"""Render original clean-room construction views from an active hero source.

The output deliberately excludes costume identity and external benchmark art.
It shows only the project's connected deforming body in clay, wireframe,
silhouette, and a deformation pose so topology and volume flow can be reviewed.
"""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "assets" / "previews" / "construction-reference"


def argument(name: str, default: str | None = None) -> str | None:
    prefix = f"--{name}="
    for value in sys.argv:
        if value.startswith(prefix):
            return value.split("=", 1)[1]
    return default


def material(name: str, color: tuple[float, float, float, float], roughness=0.72):
    found = bpy.data.materials.get(name)
    if found is not None:
        return found
    found = bpy.data.materials.new(name)
    found.diffuse_color = color
    found.use_nodes = True
    node = found.node_tree.nodes.get("Principled BSDF")
    node.inputs["Base Color"].default_value = color
    node.inputs["Roughness"].default_value = roughness
    return found


def look_at(obj, point):
    obj.rotation_euler = (Vector(point) - obj.location).to_track_quat("-Z", "Y").to_euler()


def configure_scene(height: float):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 640
    scene.render.resolution_y = 760
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.world.color = (0.018, 0.024, 0.021)
    scene.view_settings.look = "AgX - Medium High Contrast"

    for obj in tuple(bpy.data.objects):
        if obj.type in {"LIGHT", "CAMERA"}:
            bpy.data.objects.remove(obj, do_unlink=True)

    bpy.ops.object.camera_add(location=(0, -height * 4.2, height * 0.52))
    camera = bpy.context.object
    camera.name = "CAMERA_ConstructionReference"
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = height * 1.14
    look_at(camera, (0, 0, height * 0.50))
    scene.camera = camera

    for location, energy, size in (
        ((-height * 1.5, -height * 2.0, height * 2.2), 850, height * 1.4),
        ((height * 1.6, -height * 0.8, height * 1.3), 520, height * 1.0),
        ((0, height * 1.8, height * 1.7), 650, height * 1.2),
    ):
        bpy.ops.object.light_add(type="AREA", location=location)
        light = bpy.context.object
        light.data.energy = energy
        light.data.shape = "DISK"
        light.data.size = size
        look_at(light, (0, 0, height * 0.75))
    return camera


def evaluated_copy(source, name: str):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated = source.evaluated_get(depsgraph)
    mesh = bpy.data.meshes.new_from_object(
        evaluated,
        preserve_all_data_layers=True,
        depsgraph=depsgraph,
    )
    result = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(result)
    return result


def show_only(objects):
    keep = set(objects)
    for obj in bpy.context.scene.objects:
        if obj.type in {"MESH", "CURVE", "SURFACE", "FONT", "META"}:
            obj.hide_render = obj not in keep


def render(scene, camera, hero, body, height, label, direction, mode, action_name):
    armature = next(obj for obj in bpy.data.objects if obj.type == "ARMATURE")
    if armature.animation_data is None:
        armature.animation_data_create()
    action = bpy.data.actions.get(action_name)
    if action is None:
        raise RuntimeError(f"missing construction-reference action: {action_name}")
    armature.animation_data.action = action
    scene.frame_set(1)
    bpy.context.view_layer.update()

    clay = material("MAT_ConstructionClay", (0.55, 0.62, 0.53, 1.0), 0.78)
    dark = material("MAT_ConstructionWire", (0.015, 0.022, 0.018, 1.0), 0.62)
    black = material("MAT_ConstructionSilhouette", (0.002, 0.002, 0.002, 1.0), 1.0)

    posed = evaluated_copy(body, f"RENDER_{hero}_{label}_surface")
    posed.data.materials.clear()
    posed.data.materials.append(black if mode == "silhouette" else clay)
    visible = [posed]

    if mode == "wire":
        wire = posed.copy()
        wire.data = posed.data.copy()
        wire.name = f"RENDER_{hero}_{label}_wire"
        bpy.context.scene.collection.objects.link(wire)
        wire.data.materials.clear()
        wire.data.materials.append(dark)
        modifier = wire.modifiers.new("ConstructionTopologyWire", "WIREFRAME")
        modifier.thickness = height * 0.00125
        modifier.use_replace = True
        modifier.use_even_offset = True
        visible.append(wire)

    show_only(visible)
    if direction == "front":
        camera.location = (0, -height * 4.2, height * 0.52)
    else:
        camera.location = (height * 4.2, 0, height * 0.52)
    look_at(camera, (0, 0, height * 0.50))

    if mode == "silhouette":
        scene.world.color = (0.92, 0.93, 0.89)
        for light in (obj for obj in scene.objects if obj.type == "LIGHT"):
            light.hide_render = True
    else:
        scene.world.color = (0.018, 0.024, 0.021)
        for light in (obj for obj in scene.objects if obj.type == "LIGHT"):
            light.hide_render = False

    path = OUTPUT / f"{hero.lower()}-{label}.png"
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)

    for obj in visible:
        bpy.data.objects.remove(obj, do_unlink=True)
    body.hide_render = True
    return str(path)


def main():
    hero = argument("hero")
    if hero not in {"Hargold", "Mebble"}:
        raise RuntimeError("--hero must be Hargold or Mebble")
    scene = bpy.context.scene
    height = float(scene.get("targetGameplayHeightMetres", 0.0))
    if height <= 0:
        raise RuntimeError("active source is missing targetGameplayHeightMetres")
    body = bpy.data.objects.get(f"GEO_{hero}_skin_body")
    if body is None:
        raise RuntimeError(f"missing connected body GEO_{hero}_skin_body")
    if body.get("surface_role") != "single-continuous-organic-body":
        raise RuntimeError("construction reference requires the connected organic body")

    OUTPUT.mkdir(parents=True, exist_ok=True)
    camera = configure_scene(height)
    outputs = [
        render(scene, camera, hero, body, height, "neutral-front", "front", "clay", "review-neutral"),
        render(scene, camera, hero, body, height, "neutral-side", "side", "clay", "review-neutral"),
        render(scene, camera, hero, body, height, "topology-front", "front", "wire", "review-neutral"),
        render(scene, camera, hero, body, height, "silhouette-side", "side", "silhouette", "review-neutral"),
        render(scene, camera, hero, body, height, "run-deformation-side", "side", "wire", "review-run-extension"),
    ]
    print("HM_CONSTRUCTION_REFERENCE_RENDERS " + json.dumps({
        "hero": hero,
        "heightMetres": height,
        "body": body.name,
        "outputs": outputs,
    }, sort_keys=True))


if __name__ == "__main__":
    main()
