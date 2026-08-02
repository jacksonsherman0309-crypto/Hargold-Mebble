"""Render fixed-camera collision/layout debug captures from the master scene."""

from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "assets/previews/terrain-validation/blender-vertical-slice"


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name in (
        "10_TERRAIN_HIGH", "11_TERRAIN_GAME", "20_CAMP", "21_TREES", "22_ROOTS",
        "23_ROCKS", "24_RUINS_AND_TIMBER", "30_FOLIAGE", "31_DECALS", "40_MIDGROUND",
        "50_LIGHTING_PREVIEW", "90_EXPORT", "99_ARCHIVE_DISABLED"
    ):
        bpy.data.collections[name].hide_render = True
    bpy.data.collections["01_GAMEPLAY_GUIDES"].hide_render = False
    bpy.data.collections["12_TERRAIN_COLLISION"].hide_render = False
    bpy.data.collections["41_BACKGROUND_INTEGRATION"].hide_render = False

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 75
    scene.render.image_settings.file_format = "PNG"
    scene.world.color = (0.025, 0.035, 0.055)
    for camera in sorted(
        (obj for obj in bpy.data.objects if obj.type == "CAMERA" and obj.get("fixed_comparison_view")),
        key=lambda obj: obj.name
    ):
        view_id = camera.get("fixed_comparison_view")
        scene.camera = camera
        scene.render.filepath = str(OUTPUT / f"collision-debug-{view_id}.png")
        bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    main()
