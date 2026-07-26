"""Authoritative clean-room animation-frame measurements for both heroes.

The normalized targets come from the July 26, 2026 user-approved compact/tall
mannequin brief.  They describe broad original platformer readability frames;
they are not extracted from, or intended to reproduce, proprietary geometry,
rigs, animation clips, or source code.
"""

from __future__ import annotations

import hashlib
import json
import math


SCHEMA_VERSION = 2
SPEC_ID = "compact-tall-locked-animation-frames-v2"

COMPACT_HEIGHT_METRES = 1.82
TALL_TO_COMPACT_RATIO = 1.26
TALL_HEIGHT_METRES = round(COMPACT_HEIGHT_METRES * TALL_TO_COMPACT_RATIO, 4)

PANEL_CONTRACT = {
    "floorLine": 0.08,
    "standingHeadLine": 0.92,
    "usablePoseX": (0.08, 0.92),
    "neutralRootX": 0.50,
    "cameraType": "ORTHO",
    "logicalMovementAxis": "X",
    "logicalVerticalAxis": "Y",
    "logicalDepthAxis": "Z",
    "logicalCameraDirection": "-Z",
    # Blender is Z-up. The native review equivalent maps logical
    # (X, Y, Z) to native (-Y, Z, X), so a camera on +native X looking
    # toward -native X is the requested logical -Z view.
    "blenderCameraDirection": "-X",
    "perspectiveDistortion": False,
}

# These are exact samples from production actions. Mannequin and fitted
# character renders must use the same hero rig, action, sample, root offset,
# camera, scale, and crop. Exclusive cells remain intentionally empty.
REVIEW_FRAMES = (
    {"key": "neutral", "label": "01  NEUTRAL", "action": "review-neutral", "frame": 1, "rootHeight": 0.0},
    {"key": "walk-contact", "label": "02  WALK CONTACT", "action": "review-walk-contact", "frame": 1, "rootHeight": 0.0},
    {"key": "run-extension", "label": "03  RUN EXTENSION", "action": "review-run-extension", "frame": 1, "rootHeight": 0.04},
    {"key": "turnaround-skid", "label": "04  TURNAROUND SKID", "action": "review-turnaround-skid", "frame": 1, "rootHeight": 0.0},
    {"key": "jump-anticipation", "label": "05  JUMP ANTICIPATION", "action": "review-jump-anticipation", "frame": 1, "rootHeight": 0.0},
    {"key": "jump-apex", "label": "06  JUMP APEX", "action": "review-jump-apex", "frame": 1, "rootHeight": 0.08},
    {"key": "landing-compression", "label": "07  LANDING COMPRESSION", "action": "review-landing-compression", "frame": 1, "rootHeight": 0.0},
    {"key": "ground-slam", "label": "08  GROUND SLAM DESCENT", "action": "review-ground-slam", "frame": 1, "rootHeight": 0.12},
    {
        "key": "hargold-double-jump",
        "label": "09  HARGOLD DOUBLE JUMP BURST",
        "action": "review-hargold-double-jump",
        "frame": 1,
        "rootHeight": 0.14,
        "exclusive": "Hargold",
    },
    {
        "key": "mebble-glide",
        "label": "10  MEBBLE GLIDE",
        "action": "review-mebble-glide",
        "frame": 1,
        "rootHeight": 0.08,
        "exclusive": "Mebble",
    },
    {"key": "solid-silhouette", "label": "11  SOLID SILHOUETTE", "special": "silhouette"},
    {"key": "skeleton-overlay", "label": "12  SKELETON ALIGNMENT", "special": "skeleton"},
    {"key": "run-contact", "label": "13  RUN CONTACT", "action": "review-run-contact", "frame": 1, "rootHeight": 0.0},
    {"key": "run-passing", "label": "14  RUN PASSING", "action": "review-run-passing", "frame": 1, "rootHeight": 0.035},
    {"key": "jump-takeoff", "label": "15  JUMP TAKEOFF", "action": "review-jump-takeoff", "frame": 1, "rootHeight": 0.0},
    {"key": "fall-preparation", "label": "16  FALL PREPARATION", "action": "review-fall-preparation", "frame": 1, "rootHeight": 0.08},
    {"key": "sprint-slide", "label": "17  SPRINT SLIDE", "action": "review-sprint-slide", "frame": 1, "rootHeight": 0.0},
    {"key": "damage-recoil", "label": "18  DAMAGE RECOIL", "action": "review-damage-recoil", "frame": 1, "rootHeight": 0.045},
    {
        "key": "block-hit",
        "label": "19  BLOCK-HIT POSE",
        "action": "review-block-hit",
        "frame": 1,
        "rootHeight": 0.0,
    },
    {"key": "victory", "label": "20  VICTORY POSE", "action": "review-victory", "frame": 1, "rootHeight": 0.0},
)

REVIEW_SHEET_GROUPS = {
    "neutral": ("neutral", "solid-silhouette", "skeleton-overlay"),
    "locomotion": (
        "walk-contact", "run-contact", "run-passing", "run-extension",
        "turnaround-skid", "sprint-slide",
    ),
    "air-actions": (
        "jump-anticipation", "jump-takeoff", "jump-apex",
        "fall-preparation", "landing-compression", "ground-slam",
        "hargold-double-jump", "mebble-glide", "damage-recoil",
        "block-hit", "victory",
    ),
}

FRAME_SPECS = {
    "Hargold": {
        "frame": "compact",
        "heightMetres": COMPACT_HEIGHT_METRES,
        "normalized": {
            "maximumBodyWidth": 0.59,
            "headHeight": 0.34,
            "headWidth": 0.41,
            "torsoHeight": 0.32,
            "torsoWidth": 0.50,
            "visibleLegLength": 0.22,
            "armLengthShoulderToHand": 0.37,
            "handSize": 0.12,
            "footLength": 0.25,
            "footHeight": 0.115,
            "shoulderWidth": 0.46,
            "hipWidth": 0.39,
            "shoulderLevel": 0.68,
            "waistLevel": 0.36,
            "kneeLevel": 0.24,
        },
        "identity": "short-wide-heavy-round-stable-low-centred",
    },
    "Mebble": {
        "frame": "tall",
        "heightMetres": TALL_HEIGHT_METRES,
        "normalized": {
            "maximumBodyWidth": 0.36,
            "headHeight": 0.29,
            "headWidth": 0.31,
            "neckHeight": 0.17,
            "torsoHeight": 0.315,
            "torsoWidth": 0.32,
            "visibleLegLength": 0.33,
            "armLengthShoulderToHand": 0.42,
            "handSize": 0.11,
            "footLength": 0.24,
            "footHeight": 0.105,
            "shoulderWidth": 0.34,
            "hipWidth": 0.275,
            "shoulderLevel": 0.69,
            "waistLevel": 0.48,
            "kneeLevel": 0.26,
        },
        "identity": "tall-thin-light-flexible-high-centred-long-limbed",
    },
}

NORMALIZED_RANGES = {
    "Hargold": {
        "maximumBodyWidth": (0.55, 0.62),
        "headHeight": (0.32, 0.36),
        "headWidth": (0.38, 0.44),
        "torsoHeight": (0.30, 0.34),
        "torsoWidth": (0.46, 0.54),
        "visibleLegLength": (0.20, 0.24),
        "armLengthShoulderToHand": (0.34, 0.39),
        "handSize": (0.11, 0.13),
        "footLength": (0.23, 0.27),
        "footHeight": (0.10, 0.13),
        "shoulderWidth": (0.43, 0.49),
        "hipWidth": (0.36, 0.42),
    },
    "Mebble": {
        "maximumBodyWidth": (0.33, 0.40),
        "headHeight": (0.27, 0.31),
        "headWidth": (0.28, 0.34),
        "neckHeight": (0.15, 0.20),
        "torsoHeight": (0.29, 0.34),
        "torsoWidth": (0.29, 0.35),
        "visibleLegLength": (0.29, 0.35),
        "armLengthShoulderToHand": (0.39, 0.45),
        "handSize": (0.10, 0.12),
        "footLength": (0.22, 0.26),
        "footHeight": (0.09, 0.12),
        "shoulderWidth": (0.31, 0.37),
        "hipWidth": (0.25, 0.30),
    },
}


def validate_specs():
    errors = []
    for hero, ranges in NORMALIZED_RANGES.items():
        selected = FRAME_SPECS[hero]["normalized"]
        for key, (minimum, maximum) in ranges.items():
            value = selected[key]
            if not minimum <= value <= maximum:
                errors.append(
                    f"{hero}.{key}={value} falls outside {minimum}-{maximum}"
                )
    ratio = (
        FRAME_SPECS["Mebble"]["heightMetres"]
        / FRAME_SPECS["Hargold"]["heightMetres"]
    )
    if not math.isclose(ratio, TALL_TO_COMPACT_RATIO, abs_tol=0.0001):
        errors.append(
            f"Mebble/Hargold height ratio {ratio:.4f} does not equal "
            f"{TALL_TO_COMPACT_RATIO:.2f}"
        )
    return errors


def review_frame(hero, key):
    for row in REVIEW_FRAMES:
        if row["key"] != key:
            continue
        if row.get("exclusive") not in (None, hero):
            return None
        resolved = dict(row)
        resolved["action"] = row.get("actionByHero", {}).get(hero, row.get("action"))
        return resolved
    raise KeyError(f"Unknown review frame: {key}")


def review_camera():
    """Return one camera contract shared by every hero and action panel."""
    ortho_scale = TALL_HEIGHT_METRES / (
        PANEL_CONTRACT["standingHeadLine"] - PANEL_CONTRACT["floorLine"]
    )
    center_height = ortho_scale * (0.5 - PANEL_CONTRACT["floorLine"])
    return {
        "orthoScale": ortho_scale,
        "centerHeight": center_height,
        "distance": ortho_scale * 3.6,
    }


def scaled_frame(hero):
    spec = FRAME_SPECS[hero]
    height = spec["heightMetres"]
    normalized = spec["normalized"]
    shoulder = height * normalized["shoulderLevel"]
    hip = height * normalized["waistLevel"]
    knee = height * normalized["kneeLevel"]
    shoulder_half = height * normalized["shoulderWidth"] * 0.5
    arm_length = height * normalized["armLengthShoulderToHand"]
    hand_size = height * normalized["handSize"]
    elbow_z = height * (0.50 if hero == "Hargold" else 0.49)
    wrist_z = height * (0.38 if hero == "Hargold" else 0.34)
    arm_to_wrist = arm_length - hand_size * 0.34
    vertical_drop = shoulder - wrist_z
    horizontal_reach = math.sqrt(
        max((height * 0.11) ** 2, arm_to_wrist ** 2 - vertical_drop ** 2)
    )
    wrist_x = shoulder_half + horizontal_reach
    elbow_x = shoulder_half + horizontal_reach * (
        0.48 if hero == "Hargold" else 0.46
    )
    return {
        "height": height,
        "head_center": height * (1.0 - normalized["headHeight"] * 0.50),
        "head_top": height,
        "hip": hip,
        "shoulder": shoulder,
        "chest_half": shoulder_half,
        "elbow": elbow_x,
        "elbow_z": elbow_z,
        "wrist": wrist_x,
        "wrist_z": wrist_z,
        "leg_x": height * normalized["hipWidth"] * 0.24,
        "knee": knee,
        "ankle": height * normalized["footHeight"] * 0.55,
        "hand_size": hand_size,
        "foot_length": height * normalized["footLength"],
        "foot_height": height * normalized["footHeight"],
        "maximum_body_width": height * normalized["maximumBodyWidth"],
        "torso_width": height * normalized["torsoWidth"],
        "head_width": height * normalized["headWidth"],
        "head_height": height * normalized["headHeight"],
        "neck_height": height * normalized.get("neckHeight", 0.07),
        "frame": spec["frame"],
    }


def spec_hash():
    payload = json.dumps(
        {
            "schemaVersion": SCHEMA_VERSION,
            "frames": FRAME_SPECS,
            "panelContract": PANEL_CONTRACT,
            "reviewFrames": REVIEW_FRAMES,
        },
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf8")
    return hashlib.sha256(payload).hexdigest().upper()
