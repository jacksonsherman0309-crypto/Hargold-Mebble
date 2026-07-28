"""Rebuild joint corrective data from Basis in an existing production source.

This migration removes only the project-authored CORR_* shape keys, matching
corrective-smooth modifiers, and their mask groups. Facial and cape shapes,
geometry, skin weights, actions, and all other authored data are preserved.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from animation_mannequin_spec import scaled_frame
from build_production_character_staging import configure_joint_deformation


JOINT_ZONES = ("shoulders", "elbows", "hips", "knees", "ankles")


def remove_old_correctives(obj):
    removed_keys = []
    shape_keys = getattr(obj.data, "shape_keys", None)
    if shape_keys is not None:
        for key in tuple(shape_keys.key_blocks):
            if key.name.startswith("CORR_"):
                removed_keys.append(key.name)
                obj.shape_key_remove(key)

    removed_modifiers = []
    for modifier in tuple(obj.modifiers):
        if modifier.name.startswith("JointCorrective_"):
            removed_modifiers.append(modifier.name)
            obj.modifiers.remove(modifier)

    removed_groups = []
    for zone in JOINT_ZONES:
        group = obj.vertex_groups.get(f"CORR_{zone}")
        if group is not None:
            removed_groups.append(group.name)
            obj.vertex_groups.remove(group)
    return {
        "keys": removed_keys,
        "modifiers": removed_modifiers,
        "groups": removed_groups,
    }


def maximum_corrective_delta(obj):
    shape_keys = getattr(obj.data, "shape_keys", None)
    if shape_keys is None or "Basis" not in shape_keys.key_blocks:
        return 0.0
    basis = shape_keys.key_blocks["Basis"]
    maximum = 0.0
    for key in shape_keys.key_blocks:
        if not key.name.startswith("CORR_"):
            continue
        maximum = max(
            maximum,
            max(
                (key.data[index].co - basis.data[index].co).length
                for index in range(len(key.data))
            ),
        )
    return maximum


def main():
    source = Path(bpy.data.filepath)
    hero = source.stem.removesuffix("_character").capitalize()
    armature = bpy.data.objects[f"RIG_{hero.upper()}"]
    targets = [
        obj
        for obj in bpy.data.objects
        if obj.type == "MESH"
        and (
            any(
                modifier.name.startswith("JointCorrective_")
                for modifier in obj.modifiers
            )
            or (
                getattr(obj.data, "shape_keys", None) is not None
                and any(
                    key.name.startswith("CORR_")
                    for key in obj.data.shape_keys.key_blocks
                )
            )
        )
    ]
    removed = {
        obj.name: remove_old_correctives(obj)
        for obj in targets
    }
    configure_joint_deformation(hero, armature, scaled_frame(hero))

    deltas = {
        obj.name: round(maximum_corrective_delta(obj), 6)
        for obj in targets
    }
    maximum = max(deltas.values(), default=0.0)
    if maximum > 0.12:
        raise RuntimeError(
            f"corrective migration produced excessive {maximum:.6f}m delta"
        )

    bpy.context.scene["jointDeformationImplementation"] = (
        "implemented-structural-stress-review-pending"
    )
    bpy.context.scene["jointDeformationVisualApproval"] = False
    bpy.ops.wm.save_as_mainfile(filepath=str(source), check_existing=False)
    print("HM_JOINT_CORRECTIVES_UPGRADED " + json.dumps({
        "hero": hero,
        "source": str(source),
        "removed": removed,
        "maximumCorrectiveDeltaMetres": maximum,
        "perObjectMaximumDeltaMetres": deltas,
    }, sort_keys=True))


if __name__ == "__main__":
    main()
