"""Render the locked Meadow Wake art-gate camera in review modes."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import bpy


def arguments():
    raw = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=("blockout", "clay", "material", "final", "wireframe"), required=True)
    parser.add_argument("--output", required=True)
    return parser.parse_args(raw)


def review_material(name, color, roughness):
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    return material


def hide_stage_detail(mode):
    for obj in bpy.data.objects:
        stage = obj.get("art_stage", "")
        obj.hide_render = False if obj.type not in {"EMPTY", "CAMERA"} else obj.hide_render
        if mode == "blockout" and stage == "detail":
            obj.hide_render = True
    for collection_name in (
        "00_REFERENCE", "01_GAMEPLAY_GUIDES", "02_CAMERA_GUIDES",
        "12_TERRAIN_COLLISION_FUTURE", "90_EXPORT_FUTURE", "99_DISABLED_ARCHIVE",
    ):
        collection = bpy.data.collections.get(collection_name)
        if collection:
            collection.hide_render = True


def build_wire_curves(material):
    scene = bpy.context.scene
    collection = bpy.data.collections.new("MW_REVIEW_WIREFRAME_GENERATED")
    scene.collection.children.link(collection)
    depsgraph = bpy.context.evaluated_depsgraph_get()
    source_objects = []
    for obj in list(bpy.data.objects):
        if obj.type != "MESH" or obj.hide_render:
            continue
        if obj.users_collection and all(owner.hide_render for owner in obj.users_collection):
            continue
        if "LeafMass" in obj.name or "GroundFern" in obj.name:
            continue
        source_objects.append(obj)
    for obj in source_objects:
        evaluated = obj.evaluated_get(depsgraph)
        mesh = evaluated.to_mesh()
        if not mesh or not mesh.edges:
            evaluated.to_mesh_clear()
            continue
        curve = bpy.data.curves.new(f"WIRE_{obj.name}", "CURVE")
        curve.dimensions = "3D"
        curve.resolution_u = 1
        curve.bevel_depth = .005
        curve.bevel_resolution = 0
        curve.materials.append(material)
        matrix = obj.matrix_world
        for edge in mesh.edges:
            spline = curve.splines.new("POLY")
            spline.points.add(1)
            a = matrix @ mesh.vertices[edge.vertices[0]].co
            b = matrix @ mesh.vertices[edge.vertices[1]].co
            spline.points[0].co = (*a, 1.0)
            spline.points[1].co = (*b, 1.0)
        wire_obj = bpy.data.objects.new(f"WIRE_{obj.name}", curve)
        collection.objects.link(wire_obj)
        obj.hide_render = True
        evaluated.to_mesh_clear()
    return collection


def configure(mode, output):
    scene = bpy.context.scene
    camera = bpy.data.objects.get("MW_CAM_OpeningArtGate")
    if not camera:
        raise RuntimeError("Locked camera MW_CAM_OpeningArtGate is missing")
    scene.camera = camera
    scene.render.resolution_x = 1536
    scene.render.resolution_y = 864
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.filepath = str(Path(output).resolve())
    scene.frame_set(1)
    hide_stage_detail(mode)

    if mode in {"blockout", "clay"}:
        scene.render.engine = "BLENDER_WORKBENCH"
        scene.display.shading.light = "STUDIO"
        scene.display.shading.color_type = "SINGLE"
        scene.display.shading.single_color = (.31, .43, .34) if mode == "blockout" else (.57, .42, .28)
        scene.display.shading.show_shadows = True
        scene.display.shading.show_cavity = True
        scene.display.shading.cavity_type = "BOTH"
        scene.display.shading.show_object_outline = True
        scene.display.shading.background_type = "VIEWPORT"
        scene.display.shading.background_color = (.13, .24, .28) if mode == "blockout" else (.20, .25, .25)
        sky = bpy.data.objects.get("MW_Background_SkyGradient")
        if sky:
            sky.hide_render = True
        return

    if mode == "wireframe":
        scene.render.engine = "BLENDER_EEVEE"
        for collection_name in ("10_TERRAIN_HIGH", "11_TERRAIN_RENDER", "23_ROCKS", "30_FOLIAGE", "31_FLOWERS_AND_GROUND_COVER", "32_DECALS", "40_MIDGROUND", "41_BACKGROUND"):
            collection = bpy.data.collections.get(collection_name)
            if collection:
                collection.hide_render = True
        wire = review_material("MW_REVIEW_Wire", (.82, .53, .13), .84)
        bsdf = wire.node_tree.nodes.get("Principled BSDF")
        bsdf.inputs["Emission Color"].default_value = (.82, .31, .055, 1.0)
        bsdf.inputs["Emission Strength"].default_value = 1.8
        for obj in bpy.data.objects:
            if "LeafMass" in obj.name or "GroundFern" in obj.name:
                obj.hide_render = True
        build_wire_curves(wire)
        for obj in bpy.data.objects:
            if obj.type == "CURVE" and not obj.name.startswith("WIRE_"):
                if obj.users_collection and all(owner.hide_render for owner in obj.users_collection):
                    continue
                obj.data.materials.clear()
                obj.data.materials.append(wire)
        background = scene.world.node_tree.nodes.get("Background")
        background.inputs["Color"].default_value = (.008, .018, .025, 1)
        background.inputs["Strength"].default_value = .06
        return

    scene.render.engine = "BLENDER_EEVEE"
    if mode == "material":
        # Deliberately flatter pre-lighting checkpoint.
        scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value = .88
    else:
        scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value = .72


def main():
    args = arguments()
    configure(args.mode, args.output)
    bpy.ops.render.render(write_still=True)
    print(f"Rendered {args.mode}: {Path(args.output).resolve()}")


if __name__ == "__main__":
    main()
