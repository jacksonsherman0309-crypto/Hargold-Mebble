"""Render action, orientation, and scale validation frames from a character blend."""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from character_presentation import load_profile, reveal_degrees


ROOT = Path(__file__).resolve().parents[2]
OUTPUT_DIR = ROOT / "assets" / "previews" / "character-validation"


def validation_material(name: str, color: tuple[float, float, float, float]):
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.diffuse_color = color
    material.use_nodes = True
    bsdf = next(
        node for node in material.node_tree.nodes
        if node.bl_idname == "ShaderNodeBsdfPrincipled"
    )
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = 0.72
    return material


def add_scale_witnesses(hero: str, source_height: float, target_height: float):
    source_per_metre = source_height / target_height
    block_height = 0.74 * source_per_metre
    mob_height = 0.68 * source_per_metre
    bpy.ops.mesh.primitive_cube_add(
        size=1,
        location=(source_height * 0.70, 0.18, block_height * 0.5),
        scale=(block_height * 0.5, block_height * 0.42, block_height * 0.5),
    )
    block = bpy.context.object
    block.name = "QA_STANDARD_BLOCK_SCALE_WITNESS"
    block.data.materials.append(validation_material("MAT_QA_block_scale", (0.31, 0.38, 0.18, 1)))
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=24,
        ring_count=14,
        location=(-source_height * 0.72, 0.14, mob_height * 0.48),
        scale=(mob_height * 0.60, mob_height * 0.45, mob_height * 0.48),
    )
    mob = bpy.context.object
    mob.name = "QA_COMMON_MOB_SCALE_WITNESS"
    mob.data.materials.append(validation_material("MAT_QA_mob_scale", (0.48, 0.20, 0.08, 1)))
    for witness in (block, mob):
        witness["validation_only"] = True
        witness["export_enabled"] = False


def render() -> dict:
    source = Path(bpy.data.filepath)
    hero = source.stem.removesuffix("_character").capitalize()
    profile = load_profile()
    target = profile["gameplayScale"]["characters"][hero]
    armature = bpy.data.objects[f"RIG_{hero.upper()}"]
    camera = bpy.data.objects.get("QA_Camera")
    if camera is None:
        raise RuntimeError("QA_Camera is missing from character source")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 720
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.look = "AgX - Medium High Contrast"
    camera.data.type = "ORTHO"
    source_height = float(target["currentProvisionalAssetHeightMetres"])
    camera.data.ortho_scale = source_height * 1.35
    target_point = Vector((0, 0, source_height * 0.47))
    add_scale_witnesses(hero, source_height, float(target["targetVisibleHeightMetres"]))

    special = "double-jump" if hero == "Hargold" else "glide-sustain"
    shots = [
        ("idle-right", "idle", 1, 1),
        ("run-right", "run", 5, 1),
        ("run-left", "run", 13, -1),
        ("turn-toward-camera", "turn-low", 7, 1),
        (f"{special}-right", special, 7, 1),
        ("ground-slam-right", "ground-slam", 7, 1),
    ]
    rendered = []
    distance = source_height * 3.5
    for label, action_name, frame, facing in shots:
        action = bpy.data.actions.get(action_name)
        if action is None:
            raise RuntimeError(f"Missing validation action {action_name}")
        armature.animation_data.action = action
        scene.frame_set(frame)
        reveal = math.radians(reveal_degrees(profile, action_name))
        # The locked sheets use -Y as character front. A true side camera is
        # therefore on +/-X; both directions move toward -Y by the requested
        # reveal so left and right retain the same facial readability.
        camera_angle = -reveal if facing > 0 else math.pi + reveal
        camera.location = (
            math.cos(camera_angle) * distance,
            math.sin(camera_angle) * distance,
            source_height * 0.58,
        )
        camera.rotation_euler = (target_point - camera.location).to_track_quat("-Z", "Y").to_euler()
        output = OUTPUT_DIR / f"{hero.lower()}-{label}.png"
        scene.render.filepath = str(output)
        bpy.ops.render.render(write_still=True)
        rendered.append(str(output.relative_to(ROOT)).replace("\\", "/"))

    result = {"hero": hero, "rendered": rendered}
    print("HM_CHARACTER_GAMEPLAY_VALIDATION_RENDERED " + json.dumps(result, sort_keys=True))
    return result


if __name__ == "__main__":
    render()
