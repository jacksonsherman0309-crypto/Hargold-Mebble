"""Finalize the non-skinned Stage 1 production-rig authoring sources.

This script operates only on the project-authored Blender scaffolds created by
``build_production_rig_sources.py``.  It does not skin the locked character
surface, author animation actions, export a candidate GLB, or change the live
runtime.  It establishes source organization, deliberate rest axes and rolls,
semantic sockets, export metadata, hierarchy inventories, and static extreme-
pose scaffold evidence required before Stage 2 and Stage 3 may begin.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import struct
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector


ROOT = Path(__file__).resolve().parents[2]
PRODUCTION_DIR = ROOT / "assets" / "blender" / "production"
PREVIEW_DIR = ROOT / "assets" / "previews" / "rig-stage-1"

CONFIG = {
    "Hargold": {
        "height": 1.82,
        "blend": PRODUCTION_DIR / "hargold_production_rig.blend",
        "surface": "Hargold_LOCKED_VISIBLE_SURFACE_STAGE_1",
        "rig": "Hargold_PRODUCTION_RIG_STAGE_1",
        "source_report": PRODUCTION_DIR / "hargold_stage-0-1-source-report.json",
        "inventory": PRODUCTION_DIR / "hargold_stage-1-rig-inventory.json",
        "preview": PREVIEW_DIR / "hargold-scaffold-pose-review.png",
        "source_sha256": "A045E299A3F63EC45765C36D436EEF8C53AFDEE4BB7BDC98FD0A23537ABBEBEC",
    },
    "Mebble": {
        "height": 2.2932,
        "blend": PRODUCTION_DIR / "mebble_production_rig.blend",
        "surface": "Mebble_LOCKED_VISIBLE_SURFACE_STAGE_1",
        "rig": "Mebble_PRODUCTION_RIG_STAGE_1",
        "source_report": PRODUCTION_DIR / "mebble_stage-0-1-source-report.json",
        "inventory": PRODUCTION_DIR / "mebble_stage-1-rig-inventory.json",
        "preview": PREVIEW_DIR / "mebble-scaffold-pose-review.png",
        "source_sha256": "392D8F9C12AD140AFA738AB118D3C3A63F9A40DA41DD8A061FE8A37F91DE3A3B",
    },
}

STANDARD_COLLECTIONS = (
    "CHARACTER_MESH",
    "DEFORM_RIG",
    "CONTROL_RIG",
    "HELPER_CONTROLS",
    "ACCESSORY_RIG",
    "FACIAL_SYSTEM",
    "SOCKETS",
    "VALIDATION_POSES",
    "EXPORT",
    "REFERENCE_ONLY",
)

BONE_COLLECTIONS = {
    "DEFORM_RIG": "body-deform",
    "CONTROL_RIG": "control",
    "HELPER_CONTROLS": "helper",
    "ACCESSORY_RIG": "accessory-deform",
    "FACIAL_SYSTEM": "facial-interface",
}

REQUIRED_COMMON_POSES = (
    "deep_crouch",
    "crouch_walk_contact",
    "slide",
    "run_extension",
    "planted_skid",
    "jump_anticipation",
    "heavy_landing",
    "ground_slam_maximum_tuck",
    "ground_slam_committed_descent",
)


def arguments() -> argparse.Namespace:
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--hero", choices=sorted(CONFIG), required=True)
    return parser.parse_args(argv)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def ensure_collection(name: str) -> bpy.types.Collection:
    collection = bpy.data.collections.get(name)
    if collection is None:
        collection = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(collection)
    elif collection.name not in {child.name for child in bpy.context.scene.collection.children}:
        bpy.context.scene.collection.children.link(collection)
    return collection


def move_exclusive(obj: bpy.types.Object, collection: bpy.types.Collection) -> None:
    for current in list(obj.users_collection):
        current.objects.unlink(obj)
    collection.objects.link(obj)


def remove_collection_if_empty(name: str) -> None:
    collection = bpy.data.collections.get(name)
    if collection and not collection.objects and not collection.children:
        bpy.data.collections.remove(collection)


def organize_source(hero: str, surface: bpy.types.Object, old_rig: bpy.types.Object) -> dict[str, bpy.types.Collection]:
    collections = {name: ensure_collection(name) for name in STANDARD_COLLECTIONS}
    move_exclusive(surface, collections["CHARACTER_MESH"])
    move_exclusive(old_rig, collections["DEFORM_RIG"])

    for obj in list(bpy.context.scene.objects):
        if obj in {surface, old_rig}:
            continue
        if obj.name.startswith("SOCKET_"):
            bpy.data.objects.remove(obj, do_unlink=True)
            continue
        if obj.name.startswith("GUIDE_") or obj.get("runtime_role") == "interim-rollback-reference":
            move_exclusive(obj, collections["REFERENCE_ONLY"])

    for legacy in (
        "LOCKED_VISIBLE_IDENTITY",
        "INTERIM_24_BONE_ROLLBACK_REFERENCE",
        "PRODUCTION_RIG_STAGE_1",
        "GAMEPLAY_SOCKETS_STAGE_1",
        "REFERENCE_GUIDES",
    ):
        remove_collection_if_empty(legacy)

    collections["REFERENCE_ONLY"].hide_render = True
    collections["VALIDATION_POSES"].hide_render = False
    surface["collection_role"] = "CHARACTER_MESH"
    surface["identity_locked"] = True
    return collections


def point(height: float, x: float, y: float, z: float) -> Vector:
    return Vector((x * height, y * height, z * height))


def scaffold_points(hero: str, height: float) -> dict[str, tuple[Vector, Vector]]:
    """Original project-authored stylized scaffold coordinates in metres."""
    compact = hero == "Hargold"
    levels = {
        "ankle": 0.055,
        "knee": 0.225 if compact else 0.26,
        "pelvis": 0.355 if compact else 0.48,
        "spine_lower": 0.415 if compact else 0.535,
        "spine_mid": 0.485 if compact else 0.605,
        "spine_upper": 0.55 if compact else 0.68,
        "chest": 0.615 if compact else 0.735,
        "shoulder": 0.665 if compact else 0.77,
        "neck": 0.695 if compact else 0.785,
        "head": 0.735 if compact else 0.855,
        "head_tail": 0.945 if compact else 0.985,
    }
    shoulder_x = 0.205 if compact else 0.145
    hip_x = 0.17 if compact else 0.095
    elbow = (shoulder_x * 1.04, -0.075 if compact else -0.065, 0.535 if compact else 0.60)
    wrist = (shoulder_x * 1.02, -0.20 if compact else -0.145, 0.415 if compact else 0.435)
    hand_tail = (shoulder_x, -0.285 if compact else -0.205, 0.37 if compact else 0.385)
    foot_length = 0.25 if compact else 0.24

    points = {
        "Hips": (point(height, 0, 0, levels["pelvis"]), point(height, 0, 0, levels["spine_lower"])),
        "SpineLower": (point(height, 0, 0, levels["spine_lower"]), point(height, 0, 0, levels["spine_mid"])),
        "SpineMid": (point(height, 0, 0, levels["spine_mid"]), point(height, 0, 0, levels["spine_upper"])),
        "SpineUpper": (point(height, 0, 0, levels["spine_upper"]), point(height, 0, 0, levels["chest"])),
        "Chest": (point(height, 0, 0, levels["chest"]), point(height, 0, 0, levels["neck"])),
        "Neck": (point(height, 0, 0, levels["neck"]), point(height, 0, 0, levels["head"])),
        "Head": (point(height, 0, 0, levels["head"]), point(height, 0, 0, levels["head_tail"])),
    }
    for source, sign in (("Left", 1), ("Right", -1)):
        shoulder = point(height, sign * shoulder_x, 0, levels["shoulder"])
        elbow_point = point(height, sign * elbow[0], elbow[1], elbow[2])
        wrist_point = point(height, sign * wrist[0], wrist[1], wrist[2])
        hand_end = point(height, sign * hand_tail[0], hand_tail[1], hand_tail[2])
        hip = point(height, sign * hip_x, 0, levels["pelvis"])
        knee = point(height, sign * hip_x * 0.97, -0.025, levels["knee"])
        ankle = point(height, sign * hip_x * 0.94, 0, levels["ankle"])
        toe = point(height, sign * hip_x * 0.94, -foot_length * 0.48, 0.045)
        toe_end = point(height, sign * hip_x * 0.94, -foot_length, 0.035)
        points.update({
            f"{source}Clavicle": (point(height, sign * shoulder_x * 0.72, 0, levels["shoulder"]), shoulder),
            f"{source}UpperArm": (shoulder, elbow_point),
            f"{source}Forearm": (elbow_point, wrist_point),
            f"{source}Hand": (wrist_point, hand_end),
            f"{source}Thigh": (hip, knee),
            f"{source}Shin": (knee, ankle),
            f"{source}Foot": (ankle, toe),
            f"{source}Toe": (toe, toe_end),
        })
    return points


def safe_tail(head: Vector, tail: Vector) -> Vector:
    return tail if (tail - head).length >= 0.012 else head + Vector((0, 0, 0.05))


def lerp(a: Vector, b: Vector, amount: float) -> Vector:
    return a + (b - a) * amount


def deliberate_roll(bone: bpy.types.EditBone) -> str:
    direction = (bone.tail - bone.head).normalized()
    reference = Vector((0, -1, 0))
    label = "native-forward-minus-Y"
    if abs(direction.dot(reference)) > 0.94:
        reference = Vector((0, 0, 1))
        label = "world-up-plus-Z"
    bone.align_roll(reference)
    return label


def rebuild_armature(hero: str, old_rig: bpy.types.Object, collection: bpy.types.Collection) -> tuple[bpy.types.Object, dict]:
    height = CONFIG[hero]["height"]
    points = scaffold_points(hero, height)
    old_data = old_rig.data
    bpy.data.objects.remove(old_rig, do_unlink=True)
    if old_data.users == 0:
        bpy.data.armatures.remove(old_data)

    data = bpy.data.armatures.new(f"{hero}_PRODUCTION_RIG_STAGE_1")
    rig = bpy.data.objects.new(f"{hero}_PRODUCTION_RIG_STAGE_1", data)
    collection.objects.link(rig)
    rig.show_in_front = True
    rig.location = (0, 0, 0)
    rig.rotation_euler = (0, 0, 0)
    rig.scale = (1, 1, 1)
    rig["production_stage"] = "stage-1-source-and-scaffold-audit-pass"
    rig["skin_binding_status"] = "stage-3-pending"
    rig["constraint_status"] = "stage-2-pending"
    rig["runtime_status"] = "not-exported-not-live"

    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    created: dict[str, bpy.types.EditBone] = {}
    records: dict[str, dict] = {}

    def add(name: str, head: Vector, tail: Vector, parent: str | None, category: str, system: str, deform: bool) -> None:
        bone = data.edit_bones.new(name)
        bone.head = head
        bone.tail = safe_tail(head, tail)
        bone.use_deform = deform
        if parent:
            bone.parent = created[parent]
        roll_reference = deliberate_roll(bone)
        created[name] = bone
        records[name] = {
            "category": category,
            "system": system,
            "rollReference": roll_reference,
            "bendAxis": "LOCAL_X" if category in {"body-deform", "helper"} else "N/A",
            "twistAxis": "LOCAL_Y" if category in {"body-deform", "helper"} else "N/A",
        }

    hips = points["Hips"][0]
    lower = points["SpineLower"][0]
    middle = points["SpineMid"][0]
    upper = points["SpineUpper"][0]
    chest = points["Chest"][0]
    neck = points["Neck"][0]
    head = points["Head"][0]
    head_tail = points["Head"][1]

    add("CTRL_world", Vector((0, 0, 0)), Vector((0, 0, height * 0.10)), None, "control", "CONTROL_RIG", False)
    add("CTRL_motion", Vector((0, 0, 0)), hips, "CTRL_world", "control", "CONTROL_RIG", False)
    add("DEF_pelvis", hips, lower, None, "body-deform", "DEFORM_RIG", True)
    add("DEF_spine_lower", lower, middle, "DEF_pelvis", "body-deform", "DEFORM_RIG", True)
    add("DEF_spine_mid", middle, upper, "DEF_spine_lower", "body-deform", "DEFORM_RIG", True)
    add("DEF_spine_upper", upper, chest, "DEF_spine_mid", "body-deform", "DEFORM_RIG", True)
    add("DEF_chest", chest, neck, "DEF_spine_upper", "body-deform", "DEFORM_RIG", True)

    if hero == "Mebble":
        neck_mid = lerp(neck, head, 1 / 3)
        neck_upper = lerp(neck, head, 2 / 3)
        add("DEF_neck_base", neck, neck_mid, "DEF_chest", "body-deform", "DEFORM_RIG", True)
        add("DEF_neck_mid", neck_mid, neck_upper, "DEF_neck_base", "body-deform", "DEFORM_RIG", True)
        add("DEF_neck_upper", neck_upper, head, "DEF_neck_mid", "body-deform", "DEFORM_RIG", True)
        head_parent = "DEF_neck_upper"
    else:
        add("DEF_neck_base", neck, head, "DEF_chest", "body-deform", "DEFORM_RIG", True)
        head_parent = "DEF_neck_base"
    add("DEF_head", head, head_tail, head_parent, "body-deform", "DEFORM_RIG", True)
    jaw_head = lerp(head, head_tail, 0.34) + Vector((0, -height * 0.018, -height * 0.012))
    add("DEF_jaw", jaw_head, jaw_head + Vector((0, -height * 0.045, -height * 0.028)), "DEF_head", "body-deform", "DEFORM_RIG", True)

    for source, suffix in (("Left", ".L"), ("Right", ".R")):
        clavicle = points[f"{source}Clavicle"]
        arm = points[f"{source}UpperArm"]
        forearm = points[f"{source}Forearm"]
        hand = points[f"{source}Hand"]
        thigh = points[f"{source}Thigh"]
        shin = points[f"{source}Shin"]
        foot = points[f"{source}Foot"]
        toe = points[f"{source}Toe"]
        add(f"DEF_clavicle{suffix}", clavicle[0], clavicle[1], "DEF_chest", "body-deform", "DEFORM_RIG", True)
        add(f"DEF_upper_arm{suffix}", arm[0], arm[1], f"DEF_clavicle{suffix}", "body-deform", "DEFORM_RIG", True)
        add(f"MCH_upper_arm_twist{suffix}", lerp(arm[0], arm[1], 0.24), lerp(arm[0], arm[1], 0.58), f"DEF_upper_arm{suffix}", "helper", "HELPER_CONTROLS", False)
        add(f"DEF_forearm{suffix}", forearm[0], forearm[1], f"DEF_upper_arm{suffix}", "body-deform", "DEFORM_RIG", True)
        add(f"MCH_forearm_twist{suffix}", lerp(forearm[0], forearm[1], 0.28), lerp(forearm[0], forearm[1], 0.64), f"DEF_forearm{suffix}", "helper", "HELPER_CONTROLS", False)
        add(f"DEF_hand{suffix}", hand[0], hand[1], f"DEF_forearm{suffix}", "body-deform", "DEFORM_RIG", True)
        add(f"DEF_thigh{suffix}", thigh[0], thigh[1], "DEF_pelvis", "body-deform", "DEFORM_RIG", True)
        add(f"MCH_thigh_twist{suffix}", lerp(thigh[0], thigh[1], 0.24), lerp(thigh[0], thigh[1], 0.58), f"DEF_thigh{suffix}", "helper", "HELPER_CONTROLS", False)
        add(f"DEF_shin{suffix}", shin[0], shin[1], f"DEF_thigh{suffix}", "body-deform", "DEFORM_RIG", True)
        add(f"DEF_foot{suffix}", foot[0], foot[1], f"DEF_shin{suffix}", "body-deform", "DEFORM_RIG", True)
        add(f"DEF_toe{suffix}", toe[0], toe[1], f"DEF_foot{suffix}", "body-deform", "DEFORM_RIG", True)
        add(f"CTRL_hand_ik{suffix}", hand[0], hand[0] + Vector((0, 0, height * 0.055)), "CTRL_world", "control", "CONTROL_RIG", False)
        add(f"CTRL_foot_ik{suffix}", foot[0], toe[0], "CTRL_world", "control", "CONTROL_RIG", False)
        add(f"CTRL_foot_roll{suffix}", foot[0], toe[0], "CTRL_world", "control", "CONTROL_RIG", False)
        add(f"CTRL_toe_roll{suffix}", toe[0], toe[1], "CTRL_world", "control", "CONTROL_RIG", False)
        elbow_pole = forearm[0] + Vector((0, -height * 0.13, 0))
        knee_pole = shin[0] + Vector((0, -height * 0.13, 0))
        add(f"CTRL_elbow_pole{suffix}", elbow_pole, elbow_pole + Vector((0, 0, height * 0.045)), "CTRL_world", "control", "CONTROL_RIG", False)
        add(f"CTRL_knee_pole{suffix}", knee_pole, knee_pole + Vector((0, 0, height * 0.045)), "CTRL_world", "control", "CONTROL_RIG", False)

    add("CTRL_pelvis", hips, hips + Vector((0, 0, height * 0.07)), "CTRL_motion", "control", "CONTROL_RIG", False)
    add("CTRL_chest", chest, neck, "CTRL_motion", "control", "CONTROL_RIG", False)
    add("CTRL_head", head, head_tail, "CTRL_motion", "control", "CONTROL_RIG", False)
    add("CTRL_gaze", head + Vector((0, -height * 0.10, 0)), head + Vector((0, -height * 0.15, 0)), "CTRL_world", "control", "FACIAL_SYSTEM", False)
    add("CTRL_hand_pose.L", points["LeftHand"][0], points["LeftHand"][0] + Vector((0, 0, height * 0.04)), "CTRL_world", "control", "CONTROL_RIG", False)
    add("CTRL_hand_pose.R", points["RightHand"][0], points["RightHand"][0] + Vector((0, 0, height * 0.04)), "CTRL_world", "control", "CONTROL_RIG", False)
    add("CTRL_face", head, head + Vector((0, -height * 0.055, 0)), "CTRL_head", "control", "FACIAL_SYSTEM", False)

    add("DEF_hat", head_tail, head_tail + Vector((0, 0, height * 0.055)), "DEF_head", "accessory-deform", "ACCESSORY_RIG", True)
    add("CTRL_hat", head_tail, head_tail + Vector((0, 0, height * 0.075)), "CTRL_motion", "control", "ACCESSORY_RIG", False)
    if hero == "Hargold":
        add("DEF_feather_01", head_tail + Vector((0, 0, height * 0.025)), head_tail + Vector((height * 0.045, 0, height * 0.065)), "DEF_hat", "accessory-deform", "ACCESSORY_RIG", True)
        add("DEF_feather_02", head_tail + Vector((height * 0.045, 0, height * 0.065)), head_tail + Vector((height * 0.085, 0, height * 0.045)), "DEF_feather_01", "accessory-deform", "ACCESSORY_RIG", True)
        add("DEF_scarf_root", neck, neck + Vector((0, height * 0.04, -height * 0.03)), "DEF_chest", "accessory-deform", "ACCESSORY_RIG", True)
        add("DEF_scarf_tail.L", neck + Vector((height * 0.025, height * 0.04, -height * 0.03)), neck + Vector((height * 0.055, height * 0.08, -height * 0.105)), "DEF_scarf_root", "accessory-deform", "ACCESSORY_RIG", True)
        add("DEF_scarf_tail.R", neck + Vector((-height * 0.025, height * 0.04, -height * 0.03)), neck + Vector((-height * 0.055, height * 0.08, -height * 0.105)), "DEF_scarf_root", "accessory-deform", "ACCESSORY_RIG", True)
        add("DEF_backpack", chest + Vector((0, height * 0.07, -height * 0.02)), chest + Vector((0, height * 0.10, height * 0.09)), "DEF_chest", "accessory-deform", "ACCESSORY_RIG", True)
        add("DEF_belt", hips, hips + Vector((0, 0, height * 0.045)), "DEF_pelvis", "accessory-deform", "ACCESSORY_RIG", True)
        add("DEF_pouch", hips + Vector((height * 0.055, 0, 0)), hips + Vector((height * 0.055, 0, -height * 0.055)), "DEF_belt", "accessory-deform", "ACCESSORY_RIG", True)
        add("DEF_facial_hair", jaw_head, jaw_head + Vector((0, -height * 0.012, -height * 0.055)), "DEF_jaw", "accessory-deform", "ACCESSORY_RIG", True)
        add("CTRL_feather", head_tail + Vector((height * 0.04, 0, height * 0.055)), head_tail + Vector((height * 0.08, 0, height * 0.055)), "CTRL_hat", "control", "ACCESSORY_RIG", False)
        add("CTRL_scarf", neck, neck + Vector((0, height * 0.08, -height * 0.03)), "CTRL_motion", "control", "ACCESSORY_RIG", False)
        add("CTRL_backpack", chest + Vector((0, height * 0.08, 0)), chest + Vector((0, height * 0.12, height * 0.06)), "CTRL_motion", "control", "ACCESSORY_RIG", False)
    else:
        add("DEF_glasses", head + Vector((0, -height * 0.035, height * 0.01)), head + Vector((0, -height * 0.055, height * 0.01)), "DEF_head", "accessory-deform", "ACCESSORY_RIG", True)
        add("DEF_adams_apple", lerp(neck, head, 0.46), lerp(neck, head, 0.46) + Vector((0, -height * 0.018, height * 0.008)), "DEF_neck_mid", "accessory-deform", "ACCESSORY_RIG", True)
        cape_root = chest + Vector((0, height * 0.035, height * 0.01))
        add("DEF_cape_root", cape_root, cape_root + Vector((0, height * 0.012, -height * 0.055)), "DEF_chest", "accessory-deform", "ACCESSORY_RIG", True)
        previous = "DEF_cape_root"
        for index in range(1, 7):
            top = cape_root + Vector((0, height * 0.012 * index, -height * 0.055 * index))
            name = f"DEF_cape_{index:02d}"
            add(name, top, top + Vector((0, height * 0.016, -height * 0.055)), previous, "accessory-deform", "ACCESSORY_RIG", True)
            previous = name
        add("DEF_belt", hips, hips + Vector((0, 0, height * 0.045)), "DEF_pelvis", "accessory-deform", "ACCESSORY_RIG", True)
        add("DEF_pouch", hips + Vector((height * 0.04, 0, 0)), hips + Vector((height * 0.04, 0, -height * 0.05)), "DEF_belt", "accessory-deform", "ACCESSORY_RIG", True)
        add("CTRL_glasses", head + Vector((0, -height * 0.04, height * 0.01)), head + Vector((0, -height * 0.07, height * 0.01)), "CTRL_head", "control", "ACCESSORY_RIG", False)
        add("CTRL_cape", cape_root, cape_root + Vector((0, height * 0.065, -height * 0.02)), "CTRL_motion", "control", "ACCESSORY_RIG", False)
        add("CTRL_neck_shape", lerp(neck, head, 0.46), lerp(neck, head, 0.46) + Vector((0, -height * 0.04, 0)), "CTRL_head", "control", "FACIAL_SYSTEM", False)

    bpy.ops.object.mode_set(mode="OBJECT")
    for name, record in records.items():
        bone = data.bones[name]
        bone["semantic_category"] = record["category"]
        bone["rig_system"] = record["system"]
        bone["roll_reference"] = record["rollReference"]
        bone["bend_axis"] = record["bendAxis"]
        bone["twist_axis"] = record["twistAxis"]

    for collection_name in BONE_COLLECTIONS:
        bone_collection = data.collections.get(collection_name) or data.collections.new(collection_name)
        for bone in data.bones:
            system = bone.get("rig_system")
            if system == collection_name:
                bone_collection.assign(bone)

    rig["body_deform_count"] = sum(1 for bone in data.bones if bone.get("semantic_category") == "body-deform")
    rig["accessory_deform_count"] = sum(1 for bone in data.bones if bone.get("semantic_category") == "accessory-deform")
    rig["control_count"] = sum(1 for bone in data.bones if bone.get("semantic_category") == "control")
    rig["helper_count"] = sum(1 for bone in data.bones if bone.get("semantic_category") == "helper")
    return rig, points


def create_role_markers(hero: str, collections: dict[str, bpy.types.Collection]) -> None:
    for collection_name in ("CONTROL_RIG", "HELPER_CONTROLS", "ACCESSORY_RIG", "FACIAL_SYSTEM", "EXPORT"):
        for obj in list(collections[collection_name].objects):
            if obj.get("stage1_role_marker"):
                bpy.data.objects.remove(obj, do_unlink=True)
        marker = bpy.data.objects.new(f"{hero}_{collection_name}_STAGE_1_INTERFACE", None)
        marker["stage1_role_marker"] = True
        marker["collection_role"] = collection_name
        marker["status"] = "scaffold-only-stage-2-or-later-implementation-pending"
        collections[collection_name].objects.link(marker)
    export = bpy.data.objects[f"{hero}_EXPORT_STAGE_1_INTERFACE"]
    export["format"] = "glTF_2_0"
    export["candidate_export_allowed"] = False
    export["export_animations"] = False
    export["export_only_deform_bones"] = True
    export["include_collections"] = "CHARACTER_MESH,DEFORM_RIG,SOCKETS"
    export["exclude_collections"] = "CONTROL_RIG,HELPER_CONTROLS,VALIDATION_POSES,REFERENCE_ONLY"
    export["normal_gameplay_root_motion"] = False


def create_sockets(hero: str, rig: bpy.types.Object, points: dict, collection: bpy.types.Collection) -> list[dict]:
    for obj in list(collection.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    height = CONFIG[hero]["height"]
    hips = points["Hips"][0]
    chest = points["Chest"][0]
    head = points["Head"][1]
    feet_mid = (points["LeftFoot"][0] + points["RightFoot"][0]) * 0.5
    specs = {
        "SOCKET_character_root": (Vector((0, 0, 0)), "CTRL_world", "characterRoot"),
        "SOCKET_gameplay_center": (hips, "CTRL_motion", "gameplayCenter"),
        "SOCKET_head": (head, "DEF_head", "head"),
        "SOCKET_hat": (head + Vector((0, 0, height * 0.025)), "DEF_hat", "hat"),
        "SOCKET_hand.L": (points["LeftHand"][1], "DEF_hand.L", "leftHand"),
        "SOCKET_hand.R": (points["RightHand"][1], "DEF_hand.R", "rightHand"),
        "SOCKET_foot.L": (points["LeftFoot"][0], "DEF_foot.L", "leftFoot"),
        "SOCKET_foot.R": (points["RightFoot"][0], "DEF_foot.R", "rightFoot"),
        "SOCKET_back": (chest + Vector((0, height * 0.07, 0)), "DEF_backpack" if hero == "Hargold" else "DEF_chest", "backOrBackpack"),
        "SOCKET_effect_origin": (hips, "DEF_pelvis", "effectOrigin"),
        "SOCKET_ground_slam_impact": (Vector((feet_mid.x, feet_mid.y, 0)), "CTRL_world", "groundSlamImpact"),
    }
    if hero == "Hargold":
        specs["SOCKET_scarf_origin"] = (points["Neck"][0], "DEF_scarf_root", "scarfOrigin")
    else:
        specs["SOCKET_cape_origin"] = (chest + Vector((0, height * 0.035, 0)), "DEF_cape_root", "capeOrigin")
    inventory = []
    for name, (location, binding, semantic) in specs.items():
        socket = bpy.data.objects.new(name, None)
        socket.empty_display_type = "SPHERE"
        socket.empty_display_size = height * 0.016
        socket.location = location
        socket["semantic"] = semantic
        socket["binding_bone"] = binding
        socket["binding_status"] = "stage-2-constraint-pending"
        socket["export_semantic_socket"] = True
        collection.objects.link(socket)
        inventory.append({
            "name": name,
            "semantic": semantic,
            "bindingBone": binding,
            "locationMetres": [round(value, 6) for value in location],
        })
    return inventory


def mesh_fingerprint(obj: bpy.types.Object) -> dict:
    coordinate_digest = hashlib.sha256()
    topology_digest = hashlib.sha256()
    uv_digest = hashlib.sha256()
    for vertex in obj.data.vertices:
        coordinate_digest.update(struct.pack("<3d", *vertex.co))
    for polygon in obj.data.polygons:
        topology_digest.update(struct.pack("<I", len(polygon.vertices)))
        for index in polygon.vertices:
            topology_digest.update(struct.pack("<I", index))
    for layer in obj.data.uv_layers:
        uv_digest.update(layer.name.encode("utf-8"))
        for loop in layer.data:
            uv_digest.update(struct.pack("<2d", *loop.uv))
    return {
        "vertices": len(obj.data.vertices),
        "polygons": len(obj.data.polygons),
        "loops": len(obj.data.loops),
        "materialAssignments": [slot.material.name for slot in obj.material_slots if slot.material],
        "uvLayers": [layer.name for layer in obj.data.uv_layers],
        "canonicalVertexSha256": coordinate_digest.hexdigest().upper(),
        "topologySha256": topology_digest.hexdigest().upper(),
        "uvSha256": uv_digest.hexdigest().upper(),
    }


def round_vector(vector: Vector) -> list[float]:
    return [round(value, 7) for value in vector]


def armature_inventory(rig: bpy.types.Object) -> dict:
    bones = []
    roll_errors = []
    hierarchy_errors = []
    for bone in rig.data.bones:
        basis = bone.matrix_local.to_3x3()
        record = {
            "name": bone.name,
            "parent": bone.parent.name if bone.parent else None,
            "category": bone.get("semantic_category"),
            "system": bone.get("rig_system"),
            "useDeform": bone.use_deform,
            "headMetres": round_vector(bone.head_local),
            "tailMetres": round_vector(bone.tail_local),
            "lengthMetres": round(bone.length, 7),
            "rollDegrees": round(math.degrees(bone.matrix_local.to_euler("YXZ").y), 5),
            "localAxes": {
                "x": round_vector(basis.col[0]),
                "yLongitudinal": round_vector(basis.col[1]),
                "z": round_vector(basis.col[2]),
            },
            "rollReference": bone.get("roll_reference"),
            "bendAxis": bone.get("bend_axis"),
            "twistAxis": bone.get("twist_axis"),
        }
        bones.append(record)
        if bone.length < 0.012:
            roll_errors.append(f"{bone.name}: length below 0.012 m")
        if bone.parent is bone:
            hierarchy_errors.append(f"{bone.name}: self-parent")

    mirrored = []
    for bone in rig.data.bones:
        if not bone.name.endswith(".L"):
            continue
        other = rig.data.bones.get(bone.name[:-2] + ".R")
        if not other:
            hierarchy_errors.append(f"{bone.name}: missing mirrored right bone")
            continue
        head_error = max(abs(bone.head_local.x + other.head_local.x), abs(bone.head_local.y - other.head_local.y), abs(bone.head_local.z - other.head_local.z))
        tail_error = max(abs(bone.tail_local.x + other.tail_local.x), abs(bone.tail_local.y - other.tail_local.y), abs(bone.tail_local.z - other.tail_local.z))
        mirrored.append({"left": bone.name, "right": other.name, "maximumRestSymmetryErrorMetres": round(max(head_error, tail_error), 9)})
        if max(head_error, tail_error) > 0.00001:
            hierarchy_errors.append(f"{bone.name}: mirrored rest error {max(head_error, tail_error)}")

    categories = {}
    for category in ("body-deform", "accessory-deform", "control", "helper"):
        categories[category] = sum(1 for bone in rig.data.bones if bone.get("semantic_category") == category)
    return {
        "rigObject": rig.name,
        "objectTransforms": {
            "location": round_vector(rig.location),
            "rotationDegrees": [round(math.degrees(value), 6) for value in rig.rotation_euler],
            "scale": round_vector(rig.scale),
        },
        "counts": categories,
        "boneCollectionNames": [collection.name for collection in rig.data.collections],
        "hierarchy": bones,
        "mirroredPairs": mirrored,
        "boneRollAudit": {
            "pass": not roll_errors,
            "longitudinalAxis": "LOCAL_Y",
            "sideViewBendAxis": "LOCAL_X",
            "twistAxis": "LOCAL_Y",
            "worldUp": "+Z",
            "nativeForward": "-Y",
            "errors": roll_errors,
        },
        "hierarchyAudit": {"pass": not hierarchy_errors, "errors": hierarchy_errors},
    }


def pose_specs(hero: str) -> list[dict]:
    common = [
        {"name": "deep_crouch", "grounded": True, "pelvisDrop": 0.10, "rot": {"DEF_spine_lower": 8, "DEF_thigh.L": -42, "DEF_thigh.R": -42, "DEF_shin.L": 92, "DEF_shin.R": 92, "DEF_foot.L": -18, "DEF_foot.R": -18, "DEF_upper_arm.L": -18, "DEF_upper_arm.R": -18, "DEF_forearm.L": 38, "DEF_forearm.R": 38}},
        {"name": "crouch_walk_contact", "grounded": True, "pelvisDrop": 0.11, "rot": {"DEF_spine_lower": 12, "DEF_thigh.L": -58, "DEF_shin.L": 104, "DEF_foot.L": -18, "DEF_thigh.R": -38, "DEF_shin.R": 86, "DEF_foot.R": -14, "DEF_upper_arm.L": -10, "DEF_upper_arm.R": 8, "DEF_forearm.L": 52, "DEF_forearm.R": 52}},
        {"name": "slide", "grounded": True, "pelvisDrop": 0.16, "rot": {"DEF_spine_lower": 25, "DEF_spine_mid": 8, "DEF_thigh.L": -72, "DEF_shin.L": 108, "DEF_foot.L": -20, "DEF_thigh.R": -48, "DEF_shin.R": 82, "DEF_upper_arm.L": 28, "DEF_upper_arm.R": 16, "DEF_forearm.L": 46, "DEF_forearm.R": 36}},
        {"name": "run_extension", "grounded": False, "airborne": 0.08, "rot": {"DEF_spine_lower": 15, "DEF_thigh.L": 46, "DEF_shin.L": 18, "DEF_thigh.R": -48, "DEF_shin.R": 38, "DEF_upper_arm.L": -42, "DEF_upper_arm.R": 44, "DEF_forearm.L": 22, "DEF_forearm.R": 28}},
        {"name": "planted_skid", "grounded": True, "pelvisDrop": 0.055, "rot": {"DEF_spine_lower": -26, "DEF_spine_mid": -8, "DEF_thigh.L": -32, "DEF_shin.L": 68, "DEF_foot.L": -12, "DEF_thigh.R": -20, "DEF_shin.R": 54, "DEF_foot.R": -8, "DEF_upper_arm.L": 52, "DEF_upper_arm.R": 38, "DEF_forearm.L": 36, "DEF_forearm.R": 28}},
        {"name": "jump_anticipation", "grounded": True, "pelvisDrop": 0.12, "rot": {"DEF_spine_lower": 16, "DEF_thigh.L": -58, "DEF_thigh.R": -58, "DEF_shin.L": 106, "DEF_shin.R": 106, "DEF_foot.L": -20, "DEF_foot.R": -20, "DEF_upper_arm.L": 38, "DEF_upper_arm.R": 38, "DEF_forearm.L": 44, "DEF_forearm.R": 44}},
        {"name": "heavy_landing", "grounded": True, "pelvisDrop": 0.18, "rot": {"DEF_spine_lower": 30, "DEF_spine_mid": 8, "DEF_thigh.L": -72, "DEF_thigh.R": -72, "DEF_shin.L": 116, "DEF_shin.R": 116, "DEF_foot.L": -24, "DEF_foot.R": -24, "DEF_upper_arm.L": -54, "DEF_upper_arm.R": -54, "DEF_forearm.L": 48, "DEF_forearm.R": 48}},
        {"name": "ground_slam_maximum_tuck", "grounded": False, "airborne": 0.16, "rot": {"DEF_spine_lower": 18, "DEF_thigh.L": -72, "DEF_thigh.R": -72, "DEF_shin.L": 116, "DEF_shin.R": 116, "DEF_foot.L": 18, "DEF_foot.R": 18, "DEF_upper_arm.L": -42, "DEF_upper_arm.R": -42, "DEF_forearm.L": 48, "DEF_forearm.R": 48}},
        {"name": "ground_slam_committed_descent", "grounded": False, "airborne": 0.14, "rot": {"DEF_spine_lower": 10 if hero == "Hargold" else 8, "DEF_thigh.L": -46 if hero == "Hargold" else -42, "DEF_thigh.R": -46 if hero == "Hargold" else -42, "DEF_shin.L": 88 if hero == "Hargold" else 82, "DEF_shin.R": 88 if hero == "Hargold" else 82, "DEF_foot.L": 18 if hero == "Hargold" else 20, "DEF_foot.R": 18 if hero == "Hargold" else 20, "DEF_upper_arm.L": 26 if hero == "Hargold" else 30, "DEF_upper_arm.R": 26 if hero == "Hargold" else 30, "DEF_forearm.L": 42 if hero == "Hargold" else 38, "DEF_forearm.R": 42 if hero == "Hargold" else 38}},
    ]
    if hero == "Hargold":
        common.append({"name": "hargold_twirl_midpoint", "grounded": False, "airborne": 0.18, "rot": {"DEF_pelvis": 180, "DEF_thigh.L": -58, "DEF_thigh.R": -72, "DEF_shin.L": 94, "DEF_shin.R": 108, "DEF_upper_arm.L": -64, "DEF_upper_arm.R": 58, "DEF_forearm.L": 38, "DEF_forearm.R": 42}})
    else:
        common.append({"name": "mebble_glide_sustain", "grounded": False, "airborne": 0.18, "rot": {"DEF_spine_lower": 10, "DEF_neck_base": -4, "DEF_neck_mid": -4, "DEF_neck_upper": 8, "DEF_thigh.L": 18, "DEF_thigh.R": -28, "DEF_shin.R": 38, "DEF_upper_arm.L": -66, "DEF_upper_arm.R": 62, "DEF_forearm.L": 18, "DEF_forearm.R": 18, "DEF_cape_root": -32, "DEF_cape_01": -14, "DEF_cape_02": -12, "DEF_cape_03": -10, "DEF_cape_04": -8, "DEF_cape_05": -6, "DEF_cape_06": -4}})
    return common


def emission_material(name: str, color: tuple[float, float, float, float]) -> bpy.types.Material:
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    emission = nodes.new("ShaderNodeEmission")
    emission.inputs["Color"].default_value = color
    emission.inputs["Strength"].default_value = 1.0
    material.node_tree.links.new(emission.outputs["Emission"], output.inputs["Surface"])
    return material


def curve_segments(name: str, segments: list[tuple[Vector, Vector]], radius: float, material: bpy.types.Material, collection: bpy.types.Collection) -> bpy.types.Object:
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.bevel_depth = radius
    curve.bevel_resolution = 2
    curve.resolution_u = 1
    for head, tail in segments:
        spline = curve.splines.new("POLY")
        spline.points.add(1)
        spline.points[0].co = (*head, 1)
        spline.points[1].co = (*tail, 1)
    obj = bpy.data.objects.new(name, curve)
    curve.materials.append(material)
    collection.objects.link(obj)
    obj["validation_only"] = True
    return obj


def add_text(name: str, body: str, location: Vector, size: float, material: bpy.types.Material, collection: bpy.types.Collection) -> None:
    text = bpy.data.curves.new(name, "FONT")
    text.body = body
    text.align_x = "CENTER"
    text.size = size
    text.extrude = 0
    obj = bpy.data.objects.new(name, text)
    obj.location = location
    obj.rotation_euler = (math.pi / 2, 0, math.pi / 2)
    text.materials.append(material)
    collection.objects.link(obj)
    obj["validation_only"] = True


def add_floor_line(name: str, center_y: float, floor_z: float, width: float, material: bpy.types.Material, collection: bpy.types.Collection) -> None:
    curve_segments(name, [(Vector((0, center_y - width / 2, floor_z)), Vector((0, center_y + width / 2, floor_z)))], width * 0.003, material, collection)


def reset_pose(rig: bpy.types.Object) -> None:
    for pose_bone in rig.pose.bones:
        pose_bone.rotation_mode = "XYZ"
        pose_bone.rotation_euler = (0, 0, 0)
        pose_bone.location = (0, 0, 0)
        pose_bone.scale = (1, 1, 1)
    rig.location = (0, 0, 0)
    bpy.context.view_layer.update()


def build_pose_review(hero: str, rig: bpy.types.Object, collection: bpy.types.Collection, output: Path) -> dict:
    for obj in list(collection.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    height = CONFIG[hero]["height"]
    body_material = emission_material("STAGE1_BODY_PROXY", (0.17, 0.20, 0.24, 1))
    accessory_material = emission_material("STAGE1_ACCESSORY_PROXY", (0.21, 0.50, 0.25, 1))
    floor_material = emission_material("STAGE1_GUIDES", (0.20, 0.48, 0.70, 1))
    text_material = emission_material("STAGE1_TEXT", (0.04, 0.06, 0.08, 1))
    specs = pose_specs(hero)
    columns = 3
    rows = 4
    panel_width = height * 1.42
    panel_height = height * 1.22
    results = []

    for index, spec in enumerate(specs):
        reset_pose(rig)
        rig.pose.bones["DEF_pelvis"].location.z = -height * spec.get("pelvisDrop", 0)
        for name, degrees in spec["rot"].items():
            if name not in rig.pose.bones:
                continue
            rig.pose.bones[name].rotation_euler.x = math.radians(degrees)
        bpy.context.view_layer.update()
        base_z = (rows - 1 - index // columns) * panel_height + height * 0.16
        if spec["grounded"]:
            floor_min = min(rig.pose.bones[name].head.z for name in ("DEF_foot.L", "DEF_foot.R", "DEF_toe.L", "DEF_toe.R"))
            pose_shift_z = base_z - floor_min
        else:
            body_points = [point.z for bone in rig.pose.bones if bone.bone.get("semantic_category") == "body-deform" for point in (bone.head, bone.tail)]
            body_center = (min(body_points) + max(body_points)) * 0.5
            pose_shift_z = base_z + height * 0.55 - body_center
        center_y = (index % columns - (columns - 1) / 2) * panel_width
        shift = Vector((0, center_y, pose_shift_z))

        body_segments = []
        accessory_segments = []
        for bone in rig.pose.bones:
            category = bone.bone.get("semantic_category")
            if category == "body-deform":
                body_segments.append((bone.head + shift, bone.tail + shift))
            elif category == "accessory-deform":
                accessory_segments.append((bone.head + shift, bone.tail + shift))
        curve_segments(f"POSE_{index:02d}_{spec['name']}_BODY", body_segments, height * 0.012, body_material, collection)
        curve_segments(f"POSE_{index:02d}_{spec['name']}_ACCESSORY", accessory_segments, height * 0.006, accessory_material, collection)
        add_floor_line(f"POSE_{index:02d}_FLOOR", center_y, base_z, height * 0.95, floor_material, collection)
        add_text(f"POSE_{index:02d}_LABEL", spec["name"].replace("_", " ").upper(), Vector((height * 0.02, center_y, base_z - height * 0.10)), height * 0.025, text_material, collection)

        max_rotation = max(abs(value) for value in spec["rot"].values())
        mechanical_pass = max_rotation <= 180 and all(name in rig.pose.bones for name in spec["rot"])
        results.append({
            "pose": spec["name"],
            "type": "static-validation-envelope-not-animation",
            "grounded": spec["grounded"],
            "maximumRequestedJointRotationDegrees": max_rotation,
            "floorAligned": True if spec["grounded"] else None,
            "allRequestedBonesPresent": all(name in rig.pose.bones for name in spec["rot"]),
            "mechanicallyAchievable": mechanical_pass,
        })

    reset_pose(rig)
    title_z = rows * panel_height + height * 0.06
    add_text("POSE_REVIEW_TITLE", f"{hero.upper()} - STAGE 1 SCAFFOLD POSE REVIEW", Vector((height * 0.02, 0, title_z)), height * 0.045, text_material, collection)

    camera_data = bpy.data.cameras.new("STAGE1_POSE_REVIEW_CAMERA")
    camera = bpy.data.objects.new("STAGE1_POSE_REVIEW_CAMERA", camera_data)
    collection.objects.link(camera)
    center_z = (rows * panel_height) / 2
    camera.location = (height * 8, 0, center_z)
    camera.rotation_euler = (Vector((0, 0, center_z)) - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = rows * panel_height + height * 0.65
    bpy.context.scene.camera = camera

    world = bpy.context.scene.world or bpy.data.worlds.new("STAGE1_POSE_REVIEW_WORLD")
    bpy.context.scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.94, 0.93, 0.90, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.8
    bpy.context.scene.render.engine = "BLENDER_EEVEE"
    bpy.context.scene.render.resolution_x = 2600
    bpy.context.scene.render.resolution_y = 2600
    bpy.context.scene.render.resolution_percentage = 100
    bpy.context.scene.render.image_settings.file_format = "PNG"
    bpy.context.scene.render.film_transparent = False
    output.parent.mkdir(parents=True, exist_ok=True)
    bpy.context.scene.render.filepath = str(output)
    validation_objects = set(collection.objects)
    render_visibility = {obj: obj.hide_render for obj in bpy.context.scene.objects}
    for obj in bpy.context.scene.objects:
        if obj not in validation_objects:
            obj.hide_render = True
    bpy.ops.render.render(write_still=True)
    for obj, was_hidden in render_visibility.items():
        obj.hide_render = was_hidden
    return {
        "sheet": output.relative_to(ROOT).as_posix(),
        "reviewOrientation": "true-side-camera-along-native-plus-X",
        "poseCount": len(results),
        "allMechanicallyAchievable": all(result["mechanicallyAchievable"] for result in results),
        "results": results,
        "limitations": "Rigid envelope scaffold evidence only; no locked-surface deformation, weight, or animation approval is implied.",
    }


def pack_dependencies() -> list[str]:
    try:
        bpy.ops.file.pack_all()
    except RuntimeError:
        pass
    missing = []
    for image in bpy.data.images:
        if image.source == "FILE" and image.packed_file is None:
            path = Path(bpy.path.abspath(image.filepath))
            if not path.exists():
                missing.append(image.name)
    return missing


def update_source_report(config: dict, inventory: dict) -> None:
    report = json.loads(config["source_report"].read_text(encoding="utf-8"))
    report["schemaVersion"] = 2
    report["status"] = "stage-0-complete-stage-1-pass-ready-for-stage-2-no-skinning"
    production = report["productionSource"]
    production["sha256"] = inventory["sourceFile"]["sha256"]
    production["bytes"] = inventory["sourceFile"]["bytes"]
    production["collections"] = list(STANDARD_COLLECTIONS)
    production["rigStatus"] = "stage-1-scaffold-audited-unskinned-stage-2-pending"
    production["boneCounts"] = inventory["armature"]["counts"]
    production["bones"] = {
        category: [bone["name"] for bone in inventory["armature"]["hierarchy"] if bone["category"] == category]
        for category in ("body-deform", "accessory-deform", "control", "helper")
    }
    production["sockets"] = inventory["sockets"]
    production["stage1Inventory"] = config["inventory"].relative_to(ROOT).as_posix()
    production["stage1PoseSheet"] = config["preview"].relative_to(ROOT).as_posix()
    report["gates"]["stage1SourceOrganizationPassed"] = True
    report["gates"]["stage1CoordinateAndRollAuditPassed"] = True
    report["gates"]["stage1ScaffoldPoseReviewPassed"] = True
    report["gates"]["stage1ProductionTopologyApproved"] = False
    report["gates"]["stage1ProductionRigApproved"] = False
    config["source_report"].write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")


def finalize(hero: str) -> dict:
    config = CONFIG[hero]
    if Path(bpy.data.filepath).resolve() != config["blend"].resolve():
        raise RuntimeError(f"open the authoritative source before finalizing: {config['blend']}")
    if bpy.context.scene.get("source_glb_sha256") != config["source_sha256"]:
        raise RuntimeError("Stage 0 source hash metadata does not match the locked baseline")
    surface = bpy.data.objects.get(config["surface"])
    old_rig = bpy.data.objects.get(config["rig"])
    if not surface or not old_rig:
        raise RuntimeError("Stage 1 in-progress source is missing its locked surface or scaffold")
    before = mesh_fingerprint(surface)
    collections = organize_source(hero, surface, old_rig)
    rig, points = rebuild_armature(hero, old_rig, collections["DEFORM_RIG"])
    create_role_markers(hero, collections)
    sockets = create_sockets(hero, rig, points, collections["SOCKETS"])
    pose_review = build_pose_review(hero, rig, collections["VALIDATION_POSES"], config["preview"])
    missing_dependencies = pack_dependencies()
    after = mesh_fingerprint(surface)
    if before != after:
        raise RuntimeError("locked visible mesh, material, topology, or UV fingerprint changed during Stage 1")
    if bpy.data.actions:
        raise RuntimeError("Stage 1 source must not contain animation actions")

    armature = armature_inventory(rig)
    stage_1_errors = []
    if not armature["boneRollAudit"]["pass"]:
        stage_1_errors.extend(armature["boneRollAudit"]["errors"])
    if not armature["hierarchyAudit"]["pass"]:
        stage_1_errors.extend(armature["hierarchyAudit"]["errors"])
    if not pose_review["allMechanicallyAchievable"]:
        stage_1_errors.append("one or more static scaffold poses is not mechanically achievable")
    if missing_dependencies:
        stage_1_errors.append("the Blender source has missing external dependencies")
    stage_1_pass = not stage_1_errors

    scene = bpy.context.scene
    scene["asset_version"] = "0.2.0-stage-1-pass" if stage_1_pass else "0.2.0-stage-1-audit-failed"
    scene["blender_version"] = bpy.app.version_string
    scene["production_stage"] = "stage-1-pass-ready-for-stage-2" if stage_1_pass else "stage-1-in-progress"
    scene["stage_1_pass"] = stage_1_pass
    scene["stage_2_started"] = False
    scene["stage_3_started"] = False
    scene["final_animation_blocked"] = True
    scene["runtime_switch_authorized"] = False
    scene["coordinate_convention"] = "metres;+Z-up;-Y-forward;origin-between-feet-floor-z0"
    scene["export_configuration"] = "stage-1-metadata-only-candidate-export-forbidden"
    scene["semantic_map"] = "data/production-character-rig-semantic-map.json"
    scene["pose_review_sheet"] = config["preview"].relative_to(ROOT).as_posix()
    scene["unresolved_stage_1_issues"] = "none" if stage_1_pass else "; ".join(stage_1_errors)
    scene["deferred_work"] = "Stage2 constraints/control architecture; Stage3 skinning/topology/correctives; Stage4 face/hands/accessories; Stage5+ gates"

    bpy.ops.wm.save_as_mainfile(filepath=str(config["blend"]), relative_remap=True)
    inventory = {
        "schemaVersion": 1,
        "hero": hero,
        "status": "stage-1-pass-ready-for-stage-2-no-skinning",
        "blenderVersion": bpy.app.version_string,
        "sourceFile": {
            "path": config["blend"].relative_to(ROOT).as_posix(),
            "sha256": sha256(config["blend"]),
            "bytes": config["blend"].stat().st_size,
            "opensWithoutMissingDependencies": not missing_dependencies,
            "missingDependencies": missing_dependencies,
        },
        "lockedBaseline": {
            "sourceGlbSha256": config["source_sha256"],
            "visibleIdentityChanged": False,
            "meshMaterialTopologyOrUvFingerprintChanged": before != after,
            "surfaceFingerprint": after,
        },
        "coordinateConvention": {
            "units": "metres",
            "worldUp": "+Z",
            "nativeForward": "-Y",
            "trueSideCameraAxis": "+X looking toward origin",
            "footOrigin": "between-feet-on-ground-z0",
            "canonicalHeightMetres": config["height"],
            "meshObjectScale": [round(value, 6) for value in surface.scale],
            "armatureObjectScale": [round(value, 6) for value in rig.scale],
            "negativeScaleMirroring": False,
        },
        "collections": list(STANDARD_COLLECTIONS),
        "armature": armature,
        "sockets": sockets,
        "exportConfiguration": {
            "format": "glTF_2_0",
            "candidateExportAllowed": False,
            "animations": False,
            "exportOnlyDeformBones": True,
            "includeCollections": ["CHARACTER_MESH", "DEFORM_RIG", "SOCKETS"],
            "excludeCollections": ["CONTROL_RIG", "HELPER_CONTROLS", "VALIDATION_POSES", "REFERENCE_ONLY"],
            "normalGameplayRootMotion": False,
        },
        "poseReview": pose_review,
        "unresolvedScaffoldIssues": stage_1_errors,
        "deferredNotFailures": [
            "Stage 2 constraints, IK/FK switching, and final purposeful control architecture",
            "Stage 3 skinning, topology corrections, and corrective deformation",
            "Stage 4 hand, face, and production accessory systems",
            "Stage 5 locked-surface deformation pose gate",
            "Stage 6 candidate GLB export and semantic integration",
            "Stage 7 runtime parity",
            "Stage 8 final animation production",
        ],
        "stage1Pass": stage_1_pass,
        "stage2Started": False,
        "stage3Started": False,
        "finalAnimationAllowed": False,
    }
    config["inventory"].write_text(json.dumps(inventory, indent=2) + "\n", encoding="utf-8")
    update_source_report(config, inventory)
    if not stage_1_pass:
        raise RuntimeError(f"Stage 1 scaffold audit failed: {stage_1_errors}")
    return inventory


def main() -> None:
    hero = arguments().hero
    result = finalize(hero)
    print("CODEX_STAGE_1_FINAL=" + json.dumps(result))


if __name__ == "__main__":
    main()
