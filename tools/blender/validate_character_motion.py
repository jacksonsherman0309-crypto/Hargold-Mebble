"""Validate functional articulation, scale metadata, and action orientation."""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from character_presentation import PROFILE_PATH, load_profile, reveal_degrees


ROOT = Path(__file__).resolve().parents[2]
REPORT_DIR = ROOT / "assets" / "blender" / "validation"


def pose_delta(bone) -> float:
    rotation = bone.rotation_euler
    return max(
        abs(rotation.x), abs(rotation.y), abs(rotation.z),
        bone.location.length,
        abs(bone.scale.x - 1), abs(bone.scale.y - 1), abs(bone.scale.z - 1),
    )


def validate() -> dict:
    errors: list[str] = []
    warnings: list[str] = []
    source = Path(bpy.data.filepath)
    hero = source.stem.removesuffix("_character").capitalize()
    profile = load_profile()
    target = profile["gameplayScale"]["characters"][hero]
    armature = bpy.data.objects.get(f"RIG_{hero.upper()}")
    if armature is None:
        return {"hero": hero, "errors": ["missing character armature"]}

    scene = bpy.context.scene
    expected_profile = str(PROFILE_PATH.relative_to(ROOT)).replace("\\", "/")
    if scene.get("presentationProfile") != expected_profile:
        errors.append("scene is not stamped with the locked presentation profile")
    if not scene.get("physicalDirectionChange"):
        errors.append("physical direction changes are not required by scene metadata")
    if scene.get("negativeScaleMirroring") is not False:
        errors.append("negative-scale mirroring is not explicitly forbidden")
    if not math.isclose(
        float(scene.get("targetGameplayHeightMetres", 0)),
        float(target["targetVisibleHeightMetres"]),
        abs_tol=1e-5,
    ):
        errors.append("target gameplay height metadata does not match the locked profile")

    required_actions = list(profile["functionalArticulation"]["deformationValidationActions"])
    required_actions += profile["functionalArticulation"]["heroValidationActions"][hero]
    missing_actions = [name for name in required_actions if name not in bpy.data.actions]
    if missing_actions:
        errors.append("missing motion-validation actions: " + ", ".join(missing_actions))

    groups = {
        "pelvis": ["DEF_hips"],
        "torso": ["DEF_spine", "DEF_chest"],
        "head": ["DEF_neck", "DEF_head", "DEF_jaw"],
        "arms": [
            "DEF_upper_arm.L", "DEF_upper_arm.R", "DEF_forearm.L",
            "DEF_forearm.R", "DEF_hand.L", "DEF_hand.R",
        ],
        "fingers": [
            f"DEF_{finger}.{segment}.{side}"
            for side in ("L", "R")
            for finger in ("thumb", "index", "middle", "ring", "pinky")
            for segment in ("01", "02")
        ],
        "legs": [
            "DEF_thigh.L", "DEF_thigh.R", "DEF_shin.L", "DEF_shin.R",
            "DEF_foot.L", "DEF_foot.R", "DEF_toe.L", "DEF_toe.R",
        ],
        "secondary": (
            ["DEF_feather", "DEF_scarf_tail.L", "DEF_scarf_tail.R"]
            if hero == "Hargold"
            else ["DEF_cape.01", "DEF_cape.02", "DEF_cape.03", "DEF_adams_apple"]
        ),
    }
    for group_name, bone_names in groups.items():
        missing = [name for name in bone_names if name not in armature.pose.bones]
        if missing:
            errors.append(f"{group_name} articulation missing bones: {', '.join(missing)}")

    maxima = {name: 0.0 for name in groups}
    face_ranges = {
        name: [float("inf"), float("-inf")]
        for name in ("smile", "mouth_open", "brow_raise_L", "brow_raise_R")
    }
    root_maximum = 0.0
    samples = []
    for action_name in required_actions:
        action = bpy.data.actions.get(action_name)
        if action is None:
            continue
        expected_reveal = reveal_degrees(profile, action_name)
        actual_reveal = float(action.get("gameplay_reveal_degrees", -999))
        if not math.isclose(actual_reveal, expected_reveal, abs_tol=0.01):
            errors.append(f"{action_name} has incorrect gameplay reveal metadata")
        if action.get("clean_room_animation") is not True:
            errors.append(f"{action_name} is not marked clean-room authored")
        start, end = action.frame_range
        frames = sorted({round(start), round((start + end) * 0.5), round(end)})
        armature.animation_data.action = action
        for frame in frames:
            scene.frame_set(frame)
            bpy.context.view_layer.update()
            root = armature.pose.bones.get("Root")
            if root:
                root_maximum = max(root_maximum, root.location.length)
            for group_name, bone_names in groups.items():
                for bone_name in bone_names:
                    bone = armature.pose.bones.get(bone_name)
                    if bone:
                        maxima[group_name] = max(maxima[group_name], pose_delta(bone))
            face = armature.pose.bones.get("CTRL_face")
            if face:
                for property_name, limits in face_ranges.items():
                    value = float(face.get(property_name, 0))
                    limits[0] = min(limits[0], value)
                    limits[1] = max(limits[1], value)
            samples.append({"action": action_name, "frame": frame})

    thresholds = {
        "pelvis": 0.08,
        "torso": 0.08,
        "head": 0.05,
        "arms": 0.20,
        "fingers": 0.08,
        "legs": 0.18,
        "secondary": 0.08,
    }
    for group_name, threshold in thresholds.items():
        if maxima[group_name] < threshold:
            errors.append(
                f"{group_name} motion range {maxima[group_name]:.4f} "
                f"is below {threshold:.4f}"
            )
    if root_maximum > 0.001:
        errors.append(f"animation library contains root translation: {root_maximum:.5f}")
    if face_ranges["mouth_open"][1] - face_ranges["mouth_open"][0] < 0.25:
        errors.append("facial action suite lacks functional mouth range")
    if face_ranges["smile"][1] - face_ranges["smile"][0] < 0.35:
        errors.append("facial action suite lacks functional smile range")

    for side in ("L", "R"):
        boot = (
            bpy.data.objects.get(f"GEO_{hero}_boot_toe_{side}")
            or bpy.data.objects.get(f"GEO_{hero}_boot_{side}")
        )
        if boot is None or f"DEF_toe.{side}" not in boot.vertex_groups:
            errors.append(f"boot {side} is not weighted for toe articulation")

    if scene.get("reviewStatus") != "approved-production-character":
        warnings.append(
            "The active mannequin-fitted candidate still requires final human art-direction approval."
        )
    if not math.isclose(float(target["runtimeNormalizationScale"]), 1.0, abs_tol=1e-5):
        warnings.append(
            "Runtime scale normalization remains active; final assets must be authored "
            "directly at gameplay metres with object scale 1,1,1."
        )

    result = {
        "hero": hero,
        "source": str(source),
        "profile": expected_profile,
        "targetGameplayHeightMetres": target["targetVisibleHeightMetres"],
        "motionRangeByFamily": {name: round(value, 5) for name, value in maxima.items()},
        "rootTranslationMaximum": round(root_maximum, 6),
        "faceRanges": {
            name: [round(values[0], 4), round(values[1], 4)]
            for name, values in face_ranges.items()
        },
        "sampleCount": len(samples),
        "errors": errors,
        "warnings": warnings,
        "finalApprovalEligible": not errors and not warnings,
    }
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    report_path = REPORT_DIR / f"{hero.lower()}-motion-report.json"
    report_path.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print("HM_CHARACTER_MOTION_VALIDATION " + json.dumps(result, sort_keys=True))
    return result


if __name__ == "__main__":
    validation = validate()
    if validation["errors"]:
        sys.exit(1)
