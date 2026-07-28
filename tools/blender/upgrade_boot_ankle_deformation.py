"""Upgrade built staging sources to matching-side boot ankle correctives."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from animation_mannequin_spec import scaled_frame
from build_production_character_staging import (
    JOINT_CORRECTIVE_SETTINGS,
    JOINT_DEFORMATION_PASS,
    add_local_joint_corrective,
    add_pose_space_volume_keys,
)


def main():
    source = Path(bpy.data.filepath)
    hero = source.stem.removesuffix("_character").capitalize()
    armature = bpy.data.objects[f"RIG_{hero.upper()}"]
    dims = scaled_frame(hero)
    radius = (
        JOINT_CORRECTIVE_SETTINGS["ankles"]["radius"][hero]
        * dims["height"]
    )
    results = {}
    for side in ("L", "R"):
        obj = bpy.data.objects[f"GEO_{hero}_boot_{side}"]
        group = obj.vertex_groups.get("CORR_ankles")
        if group is not None:
            obj.vertex_groups.remove(group)
        modifier = obj.modifiers.get("JointCorrective_Ankles")
        if modifier is not None:
            obj.modifiers.remove(modifier)
        if obj.data.shape_keys:
            for key in tuple(obj.data.shape_keys.key_blocks):
                if key.name.startswith("CORR_AnklesVolume."):
                    obj.shape_key_remove(key)

        centre = Vector(
            armature.data.bones[f"DEF_foot.{side}"].head_local
        )
        count = add_local_joint_corrective(
            obj,
            hero,
            "ankles",
            [centre],
            radius,
            boot_band=True,
        )
        keys = add_pose_space_volume_keys(
            obj,
            armature,
            hero,
            "ankles",
            radius,
            sides=(side,),
            boot_band=True,
        )
        obj["joint_deformation_pass"] = JOINT_DEFORMATION_PASS
        obj["joint_corrective_vertex_counts"] = json.dumps(
            {"ankles": count}, separators=(",", ":")
        )
        obj["preserve_volume_skinning"] = True
        results[side] = {"vertices": count, "keys": keys}

    bpy.ops.wm.save_as_mainfile(filepath=str(source), check_existing=False)
    print("HM_BOOT_ANKLE_DEFORMATION_UPGRADED " + json.dumps({
        "hero": hero,
        "source": str(source),
        "results": results,
    }, sort_keys=True))


if __name__ == "__main__":
    main()
