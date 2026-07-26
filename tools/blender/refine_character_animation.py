"""Upgrade the current provisional character rigs and animation actions.

This intentionally does not claim to finalize the rejected procedural meshes.
It adds the missing toe articulation, preserves normalized boot weights,
rebuilds the clean-room action library, stamps the locked presentation
contract, and refreshes the runtime GLB.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_locked_characters as riglib
from character_presentation import PROFILE_PATH, load_profile, reveal_degrees


ROOT = Path(__file__).resolve().parents[2]


def add_toe_articulation(armature, hero: str) -> None:
    missing = [side for side in ("L", "R") if f"DEF_toe.{side}" not in armature.data.bones]
    if not missing:
        return
    bpy.context.view_layer.objects.active = armature
    armature.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    for side in missing:
        foot = armature.data.edit_bones[f"DEF_foot.{side}"]
        toe = armature.data.edit_bones.new(f"DEF_toe.{side}")
        toe.head = foot.tail
        toe.tail = Vector((foot.tail.x, foot.tail.y - 0.20, foot.tail.z))
        toe.parent = foot
        toe.use_deform = True
    bpy.ops.object.mode_set(mode="OBJECT")

    for side in missing:
        toe_name = f"DEF_toe.{side}"
        foot_name = f"DEF_foot.{side}"
        boot = bpy.data.objects.get(f"GEO_{hero}_boot_{side}")
        if boot is None or boot.type != "MESH":
            continue
        toe_group = boot.vertex_groups.get(toe_name) or boot.vertex_groups.new(name=toe_name)
        foot_group = boot.vertex_groups.get(foot_name)
        if foot_group is None:
            continue
        ys = [vertex.co.y for vertex in boot.data.vertices]
        minimum_y, maximum_y = min(ys), max(ys)
        toe_threshold = minimum_y + (maximum_y - minimum_y) * 0.42
        for vertex in boot.data.vertices:
            if vertex.co.y > toe_threshold:
                continue
            try:
                foot_weight = foot_group.weight(vertex.index)
            except RuntimeError:
                continue
            if foot_weight <= 0:
                continue
            toe_weight = foot_weight * 0.62
            foot_group.add([vertex.index], foot_weight - toe_weight, "REPLACE")
            toe_group.add([vertex.index], toe_weight, "REPLACE")
        boot["toe_articulation"] = "weighted-forward-boot-zone"


def refine() -> dict:
    source = Path(bpy.data.filepath)
    hero = source.stem.removesuffix("_character").capitalize()
    if hero not in {"Hargold", "Mebble"}:
        raise RuntimeError(f"Unsupported character source: {source.name}")
    armature = bpy.data.objects.get(f"RIG_{hero.upper()}")
    if armature is None or armature.type != "ARMATURE":
        raise RuntimeError(f"Missing RIG_{hero.upper()} armature")

    profile = load_profile()
    add_toe_articulation(armature, hero)
    armature.animation_data_create()
    armature.animation_data.action = None
    for action in list(bpy.data.actions):
        bpy.data.actions.remove(action)
    riglib.add_production_actions(armature, hero)

    for action in bpy.data.actions:
        action["presentation_profile"] = str(PROFILE_PATH.relative_to(ROOT)).replace("\\", "/")
        action["gameplay_reveal_degrees"] = reveal_degrees(profile, action.name)
        action["clean_room_animation"] = True
        action["negative_scale_mirroring"] = False

    scene = bpy.context.scene
    target = profile["gameplayScale"]["characters"][hero]
    scene["presentationProfile"] = str(PROFILE_PATH.relative_to(ROOT)).replace("\\", "/")
    scene["targetGameplayHeightMetres"] = target["targetVisibleHeightMetres"]
    scene["currentProvisionalAssetHeightMetres"] = target["currentProvisionalAssetHeightMetres"]
    scene["runtimeNormalizationScale"] = target["runtimeNormalizationScale"]
    scene["orientationProfile"] = "action-dependent-three-quarter-side"
    scene["physicalDirectionChange"] = True
    scene["negativeScaleMirroring"] = False
    scene["rigArticulationUpgrade"] = "toes-fingers-face-secondary-2026-07-26"
    scene["reviewStatus"] = "provisional-mesh-animation-refined-final-sculpt-still-required"

    armature.animation_data.action = bpy.data.actions["idle"]
    scene.frame_set(1)
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(source), check_existing=False)
    riglib.export_glb(hero, armature)
    bpy.ops.wm.save_as_mainfile(filepath=str(source), check_existing=False)
    result = {
        "hero": hero,
        "blend": str(source),
        "glb": str(ROOT / "assets" / "exports" / f"{hero.lower()}_character.glb"),
        "actions": len(bpy.data.actions),
        "bones": len(armature.data.bones),
        "status": scene["reviewStatus"],
    }
    print("HM_CHARACTER_ANIMATION_REFINED " + json.dumps(result, sort_keys=True))
    return result


if __name__ == "__main__":
    if "--write-active" not in sys.argv:
        raise RuntimeError(
            "This command updates the active provisional .blend and GLB. "
            "Pass --write-active after reviewing the locked profile."
        )
    refine()
