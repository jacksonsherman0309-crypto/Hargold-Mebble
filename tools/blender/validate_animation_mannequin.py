"""Validate the factory-empty compact/tall animation mannequins."""

from __future__ import annotations

import json
import struct
import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from animation_mannequin_spec import (
    FRAME_SPECS,
    REVIEW_FRAMES,
    SPEC_ID,
    review_camera,
    review_frame,
    spec_hash,
    validate_specs,
)


ROOT = Path(__file__).resolve().parents[2]
GENERATION = "featureless-locked-animation-mannequin-v2"
REQUIRED_BONES = {
    "Root", "DEF_center_of_mass", "DEF_hips",
    "DEF_spine_lower", "DEF_spine_mid", "DEF_spine_upper", "DEF_chest",
    "DEF_neck_base", "DEF_neck_mid", "DEF_neck_upper", "DEF_head",
    "DEF_clavicle.L", "DEF_clavicle.R",
    "DEF_upper_arm.L", "DEF_upper_arm.R",
    "DEF_forearm.L", "DEF_forearm.R",
    "DEF_hand.L", "DEF_hand.R",
    "DEF_thigh.L", "DEF_thigh.R", "DEF_shin.L", "DEF_shin.R",
    "DEF_foot.L", "DEF_foot.R", "DEF_toe.L", "DEF_toe.R",
    "CTRL_root", "CTRL_center_of_mass", "CTRL_face",
    "CTRL_hand_ik.L", "CTRL_hand_ik.R", "CTRL_foot_ik.L", "CTRL_foot_ik.R",
}
REQUIRED_ACTIONS = {
    "idle", "walk", "run", "sprint", "skid", "takeoff", "rise", "apex",
    "fall", "land-soft", "land-hard", "ground-slam", "hurt", "victory",
}
BANNED_IDENTITY_TOKENS = {
    "hat", "hair", "beard", "moustache", "glasses", "cape", "backpack",
    "shirt", "jacket", "trouser", "boot", "feather", "scarf", "belt",
}


def glb_summary(path: Path, errors: list[str]) -> dict:
    if not path.exists():
        errors.append(f"missing mannequin GLB: {path}")
        return {}
    payload = path.read_bytes()
    if len(payload) < 20:
        errors.append("mannequin GLB is truncated")
        return {}
    magic, version, declared_length = struct.unpack_from("<4sII", payload, 0)
    json_length, json_type = struct.unpack_from("<II", payload, 12)
    if (
        magic != b"glTF"
        or version != 2
        or declared_length != len(payload)
        or json_type != 0x4E4F534A
    ):
        errors.append("mannequin export is not a valid GLB 2.0 container")
        return {}
    document = json.loads(
        payload[20:20 + json_length].decode("utf8").rstrip("\x00 ")
    )
    result = {
        "bytes": len(payload),
        "meshes": len(document.get("meshes", [])),
        "skins": len(document.get("skins", [])),
        "animations": len(document.get("animations", [])),
    }
    if result["skins"] != 1:
        errors.append(f"expected one mannequin skin; got {result['skins']}")
    if result["animations"] < len(REQUIRED_ACTIONS):
        errors.append("mannequin GLB is missing animation data")
    return result


def validate() -> dict:
    source = Path(bpy.data.filepath)
    frame = "compact" if "compact" in source.stem else "tall"
    hero = "Hargold" if frame == "compact" else "Mebble"
    scene = bpy.context.scene
    errors = list(validate_specs())
    expected = FRAME_SPECS[hero]
    metadata = {
        "geometryGeneration": GENERATION,
        "sourceScene": "factory-empty",
        "reusesPriorGeometry": False,
        "featureless": True,
        "heroFrame": frame,
        "mannequinSpec": SPEC_ID,
        "mannequinSpecHash": spec_hash(),
        "reviewStatus": "authoritative-animation-frame",
        "sharedWorldScaleCamera": True,
        "maximumJointAlignmentErrorFraction": 0.03,
    }
    for key, value in metadata.items():
        if scene.get(key) != value:
            errors.append(f"scene {key} must be {value!r}; got {scene.get(key)!r}")
    if abs(
        float(scene.get("targetGameplayHeightMetres", -1))
        - expected["heightMetres"]
    ) > 1e-6:
        errors.append("mannequin target height does not match the selected frame")

    camera = bpy.data.objects.get("QA_SideCamera")
    camera_contract = review_camera()
    if camera is None or camera.type != "CAMERA":
        errors.append("missing fixed QA_SideCamera")
    elif (
        camera.data.type != "ORTHO"
        or abs(camera.data.ortho_scale - camera_contract["orthoScale"]) > 1e-5
    ):
        errors.append("QA_SideCamera does not use the shared orthographic crop")

    armature = bpy.data.objects.get(f"RIG_{hero.upper()}")
    if not armature or armature.type != "ARMATURE":
        errors.append("missing mannequin armature")
        return {"hero": hero, "frame": frame, "errors": errors}
    missing_bones = sorted(REQUIRED_BONES - set(armature.data.bones.keys()))
    if missing_bones:
        errors.append("missing mannequin bones: " + ", ".join(missing_bones))

    geometry = [
        obj for obj in bpy.data.collections["GEO"].all_objects
        if obj.type == "MESH"
    ]
    if len(geometry) < (11 if hero == "Mebble" else 10):
        errors.append("featureless mannequin geometry is incomplete")
    vertices = sum(len(obj.data.vertices) for obj in geometry)
    polygons = sum(len(obj.data.polygons) for obj in geometry)
    for obj in geometry:
        lower_name = obj.name.lower()
        if any(token in lower_name for token in BANNED_IDENTITY_TOKENS):
            errors.append(f"{obj.name} introduces forbidden identity surface detail")
        if obj.get("featureless_mannequin") is not True:
            errors.append(f"{obj.name} is not marked as a featureless mannequin")
        if obj.get("geometry_generation") != GENERATION:
            errors.append(f"{obj.name} has incorrect geometry provenance")
        if obj.get("source_geometry_reused") is not False:
            errors.append(f"{obj.name} does not reject prior geometry reuse")
        if not any(
            modifier.type == "ARMATURE" and modifier.object == armature
            for modifier in obj.modifiers
        ):
            errors.append(f"{obj.name} is not skinned to the mannequin rig")
        if not obj.data.uv_layers:
            errors.append(f"{obj.name} has no UV map")

    action_names = set(bpy.data.actions.keys())
    required_actions = set(REQUIRED_ACTIONS)
    required_actions |= {
        frame_spec["action"]
        for row in REVIEW_FRAMES
        if (frame_spec := review_frame(hero, row["key"])) is not None
        and frame_spec.get("action")
    }
    missing_actions = sorted(required_actions - action_names)
    if missing_actions:
        errors.append("missing mannequin actions: " + ", ".join(missing_actions))
    for action_name in required_actions & action_names:
        action = bpy.data.actions[action_name]
        if action.get("clean_room_animation") is not True:
            errors.append(f"{action_name} is not marked clean-room authored")
        if action.get("mannequin_spec") != SPEC_ID:
            errors.append(f"{action_name} is not tied to the mannequin spec")
        if action.get("locked_frame_source") != SPEC_ID:
            errors.append(f"{action_name} does not use the locked frame source")
    for action_name in ("walk", "run", "sprint"):
        action = bpy.data.actions.get(action_name)
        phases = json.loads(action.get("pose_phases", "[]")) if action else []
        if len(phases) != 8 or "compression" not in phases[1]:
            errors.append(f"{action_name} lacks the required eight-phase grammar")

    export_path = (
        ROOT / "assets" / "exports" / "mannequins"
        / f"{frame}_animation_mannequin.glb"
    )
    return {
        "hero": hero,
        "frame": frame,
        "blend": str(source),
        "heightMetres": expected["heightMetres"],
        "bones": len(armature.data.bones),
        "actions": len(bpy.data.actions),
        "meshObjects": len(geometry),
        "vertices": vertices,
        "polygons": polygons,
        "glb": glb_summary(export_path, errors),
        "errors": errors,
        "structuralPass": not errors,
        "visualApproval": "comparison-sheet gate",
    }


if __name__ == "__main__":
    result = validate()
    print("HM_ANIMATION_MANNEQUIN_VALIDATION " + json.dumps(result, sort_keys=True))
    if result["errors"]:
        sys.exit(1)
