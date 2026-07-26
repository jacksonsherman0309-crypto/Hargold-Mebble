"""Render the active production character's locked rear identity view."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]


def render() -> dict:
    source = Path(bpy.data.filepath)
    hero = source.stem.removesuffix("_character").capitalize()
    armature = bpy.data.objects[f"RIG_{hero.upper()}"]
    camera = bpy.data.objects["QA_Camera"]
    height = float(bpy.context.scene["targetGameplayHeightMetres"])
    action = bpy.data.actions["idle"]
    armature.animation_data.action = action
    scene = bpy.context.scene
    scene.frame_set(1)
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 560
    scene.render.resolution_y = 560
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = height * 1.30
    target = Vector((0, 0, height * 0.48))
    camera.location = (0, height * 3.6, height * 0.56)
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()
    output = ROOT / "assets" / "previews" / f"{hero.lower()}_character_back.png"
    scene.render.filepath = str(output)
    bpy.ops.render.render(write_still=True)
    result = {"hero": hero, "output": str(output), "action": "idle", "view": "rear"}
    print("HM_PRODUCTION_CHARACTER_BACK_RENDERED " + json.dumps(result, sort_keys=True))
    return result


if __name__ == "__main__":
    try:
        render()
    except Exception as error:
        print(f"HM_PRODUCTION_CHARACTER_BACK_RENDER_FAILED {error}", file=sys.stderr)
        raise
