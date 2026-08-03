"""Render the Verdant Vale living-surface approval views.

The script is review-only: it never saves the blend, changes gameplay data, or
exports an integration asset.  The material render uses the frozen review
camera.  Wireframe and clay are transient Workbench diagnostics.
"""

from __future__ import annotations

from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[3]
OUTPUT = ROOT / "art-review/verdant-vale-kit/terrain-bank"


def configure_output(scene, name: str, resolution=(1440,900)) -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    scene.render.resolution_x = resolution[0]
    scene.render.resolution_y = resolution[1]
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(OUTPUT / name)


def render_material(scene) -> None:
    configure_output(scene, "surface-material.png")
    scene.render.engine = "BLENDER_EEVEE"
    bpy.ops.render.render(write_still=True)


def render_gameplay_camera(scene) -> None:
    configure_output(scene,"surface-gameplay-camera.png",(1536,864))
    scene.render.engine="BLENDER_EEVEE"
    bpy.ops.render.render(write_still=True)


def prepare_workbench(scene) -> list[bpy.types.Object]:
    scene.render.engine = "BLENDER_WORKBENCH"
    shading = scene.display.shading
    shading.light = "STUDIO"
    shading.studio_light = "paint.sl"
    shading.show_shadows = True
    shading.show_cavity = True
    shading.cavity_type = "WORLD"
    shading.show_specular_highlight = False
    shading.background_type = "VIEWPORT"
    shading.background_color = (0.025, 0.035, 0.030)
    background = bpy.data.objects.get("VV_APPROVED_STATIC_Background")
    if background:
        background.hide_render = True
    # Alpha cards are a declared medium-detail optimization.  Workbench ignores
    # their alpha and would show opaque rectangles, so clay/wireframe isolate
    # the actual modeled silhouette, root mat, roots, stones, and soil geometry.
    for obj in scene.objects:
        if obj.get("surface_ecosystem_detail_system") == "2 of 3 - sparse grass cards and clumps":
            obj.hide_render=True
    return [obj for obj in bpy.context.scene.objects if obj.type == "MESH" and not obj.hide_render]


def render_wireframe(scene, meshes: list[bpy.types.Object]) -> None:
    # Workbench's viewport-wire setting is not honored by background renders in
    # Blender 5.2, so build a transient emissive wire shell.  Nothing is saved.
    scene.render.engine = "BLENDER_EEVEE"
    wire_material = bpy.data.materials.new("VV REVIEW ONLY emissive wire")
    wire_material.use_nodes = True
    nodes = wire_material.node_tree.nodes
    links = wire_material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    emission = nodes.new("ShaderNodeEmission")
    emission.inputs["Color"].default_value = (0.52, 0.95, 0.30, 1.0)
    emission.inputs["Strength"].default_value = 1.8
    links.new(emission.outputs["Emission"], output.inputs["Surface"])
    for obj in meshes:
        obj.data.materials.clear()
        obj.data.materials.append(wire_material)
        modifier = obj.modifiers.new("REVIEW ONLY wire shell", "WIREFRAME")
        modifier.thickness = .0045
        modifier.use_replace = True
        modifier.use_even_offset = True
    for obj in scene.objects:
        if obj.type == "CURVE" and not obj.hide_render:
            obj.data.materials.clear()
            obj.data.materials.append(wire_material)
    if scene.world and scene.world.use_nodes:
        background = scene.world.node_tree.nodes.get("Background")
        if background:
            background.inputs["Color"].default_value = (0.008, 0.014, 0.011, 1.0)
            background.inputs["Strength"].default_value = .18
    configure_output(scene, "surface-wireframe.png")
    bpy.ops.render.render(write_still=True)


def render_clay(scene) -> None:
    shading = scene.display.shading
    shading.color_type = "SINGLE"
    shading.single_color = (0.40, 0.27, 0.14)
    configure_output(scene, "surface-clay.png")
    bpy.ops.render.render(write_still=True)


def main() -> None:
    scene = bpy.context.scene
    wide_camera=bpy.data.objects.get("VV_CAM_TerrainBankQualityGate")
    detail_camera = bpy.data.objects.get("VV_CAM_TerrainBankDetailGate")
    if wide_camera is None or detail_camera is None:
        raise RuntimeError("frozen surface review camera set is incomplete")
    scene.camera=wide_camera
    render_gameplay_camera(scene)
    scene.camera = detail_camera
    render_material(scene)
    meshes = prepare_workbench(scene)
    render_clay(scene)
    render_wireframe(scene, meshes)
    print(f"Rendered living-surface review set to {OUTPUT}")


if __name__ == "__main__":
    main()
