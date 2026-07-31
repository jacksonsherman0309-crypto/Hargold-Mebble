"""Create Stage 0 rollback assets and Stage 1 Blender rig authoring sources.

This script deliberately does not export candidate runtime GLBs or replace the
live 24-bone Meshy assets.  It imports the approved visible surface, removes
all imported actions, preserves an immutable interim-rig reference, bakes a
clean canonical-metre copy of the visible bind surface, and creates an original
production-rig *scaffold* for the later rig/deformation stages.

The scaffold is not skinned and is not a passed production rig.  Stages 2-7 of
the rig-first production gate remain blocked until their visual and runtime
gates are completed.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector


ROOT = Path(__file__).resolve().parents[2]
PRODUCTION_DIR = ROOT / "assets" / "blender" / "production"
ROLLBACK_DIR = ROOT / "assets" / "exports" / "rollback" / "2026-07-31"

CONFIG = {
    "Hargold": {
        "live": ROOT / "assets" / "exports" / "meshy" / "hargold_canonical_gameplay_rig.glb",
        "rollback": ROLLBACK_DIR / "hargold_interim_24bone.glb",
        "blend": PRODUCTION_DIR / "hargold_production_rig.blend",
        "report": PRODUCTION_DIR / "hargold_stage-0-1-source-report.json",
        "height": 1.82,
        "expected_sha256": "A045E299A3F63EC45765C36D436EEF8C53AFDEE4BB7BDC98FD0A23537ABBEBEC",
        "reference": "assets/references/Hargold locked production character sheet.png",
    },
    "Mebble": {
        "live": ROOT / "assets" / "exports" / "meshy" / "mebble_canonical_gameplay_rig.glb",
        "rollback": ROLLBACK_DIR / "mebble_interim_24bone.glb",
        "blend": PRODUCTION_DIR / "mebble_production_rig.blend",
        "report": PRODUCTION_DIR / "mebble_stage-0-1-source-report.json",
        "height": 2.2932,
        "expected_sha256": "392D8F9C12AD140AFA738AB118D3C3A63F9A40DA41DD8A061FE8A37F91DE3A3B",
        "reference": "assets/references/Mebble locked production character sheet.png",
    },
}

COLLECTIONS = (
    "LOCKED_VISIBLE_IDENTITY",
    "INTERIM_24_BONE_ROLLBACK_REFERENCE",
    "PRODUCTION_RIG_STAGE_1",
    "GAMEPLAY_SOCKETS_STAGE_1",
    "REFERENCE_GUIDES",
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def parse_args() -> argparse.Namespace:
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--hero", choices=sorted(CONFIG), required=True)
    return parser.parse_args(argv)


def reset_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    scene.render.fps = 60
    scene.render.fps_base = 1.0


def make_collections() -> dict[str, bpy.types.Collection]:
    scene = bpy.context.scene
    collections = {}
    for name in COLLECTIONS:
        collection = bpy.data.collections.new(name)
        scene.collection.children.link(collection)
        collections[name] = collection
    return collections


def move_to_collection(obj: bpy.types.Object, collection: bpy.types.Collection) -> None:
    for current in list(obj.users_collection):
        current.objects.unlink(obj)
    collection.objects.link(obj)


def world_bounds(objects: list[bpy.types.Object]) -> tuple[Vector, Vector]:
    points = [obj.matrix_world @ Vector(corner) for obj in objects for corner in obj.bound_box]
    return (
        Vector(min(point[i] for point in points) for i in range(3)),
        Vector(max(point[i] for point in points) for i in range(3)),
    )


def transformed_point(point: Vector, scale: float, centre_xy: Vector, floor_z: float) -> Vector:
    return Vector((
        (point.x - centre_xy.x) * scale,
        (point.y - centre_xy.y) * scale,
        (point.z - floor_z) * scale,
    ))


def remove_imported_animation() -> list[str]:
    removed = [action.name for action in bpy.data.actions]
    for obj in bpy.context.scene.objects:
        obj.animation_data_clear()
    for action in list(bpy.data.actions):
        bpy.data.actions.remove(action)
    for armature in [obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"]:
        for pose_bone in armature.pose.bones:
            pose_bone.matrix_basis.identity()
    bpy.context.view_layer.update()
    return removed


def preserve_rollback(config: dict) -> dict:
    live = config["live"]
    rollback = config["rollback"]
    actual = sha256(live)
    if actual != config["expected_sha256"]:
        raise RuntimeError(f"live asset hash changed: {live} -> {actual}")
    rollback.parent.mkdir(parents=True, exist_ok=True)
    if rollback.exists() and sha256(rollback) != actual:
        raise RuntimeError(f"rollback path exists with different bytes: {rollback}")
    if not rollback.exists():
        shutil.copy2(live, rollback)
    return {
        "livePath": live.relative_to(ROOT).as_posix(),
        "rollbackPath": rollback.relative_to(ROOT).as_posix(),
        "sha256": actual,
        "bytes": live.stat().st_size,
        "byteIdenticalRollback": sha256(rollback) == actual,
    }


def create_locked_surface(
    hero: str,
    source_mesh: bpy.types.Object,
    collection: bpy.types.Collection,
    canonical_matrix: Matrix,
) -> bpy.types.Object:
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated = source_mesh.evaluated_get(depsgraph)
    mesh_data = bpy.data.meshes.new_from_object(
        evaluated,
        preserve_all_data_layers=True,
        depsgraph=depsgraph,
    )
    locked = bpy.data.objects.new(f"{hero}_LOCKED_VISIBLE_SURFACE_STAGE_1", mesh_data)
    locked.name = f"{hero}_LOCKED_VISIBLE_SURFACE_STAGE_1"
    locked.data.name = f"{hero}_LOCKED_VISIBLE_SURFACE_STAGE_1"
    locked.matrix_world = Matrix.Identity(4)
    locked.data.transform(canonical_matrix @ source_mesh.matrix_world)
    collection.objects.link(locked)
    locked["identity_locked"] = True
    locked["source_role"] = "approved-visible-bind-surface"
    locked["skinning_status"] = "stage-3-pending"
    locked["topology_gate_status"] = "not-reviewed-for-production-deformation"
    return locked


def purposeful_rig_points(hero: str, height: float) -> dict[str, tuple[Vector, Vector]]:
    """Original normalized authoring scaffold; never copied from an external rig."""
    compact = hero == "Hargold"
    level = {
        "ankle": 0.055,
        "knee": 0.24 if compact else 0.26,
        "pelvis": 0.36 if compact else 0.48,
        "spine_lower": 0.43 if compact else 0.54,
        "spine_mid": 0.52 if compact else 0.63,
        "chest": 0.61 if compact else 0.72,
        "shoulder": 0.66 if compact else 0.77,
        "neck": 0.69 if compact else 0.78,
        "head": 0.73 if compact else 0.85,
        "head_tail": 0.94 if compact else 0.98,
    }
    shoulder_x = height * (0.18 if compact else 0.13)
    hip_x = height * (0.14 if compact else 0.10)
    elbow_z = height * (level["shoulder"] - (0.17 if compact else 0.19))
    wrist_z = height * (level["shoulder"] - (0.34 if compact else 0.39))
    foot_length = height * (0.25 if compact else 0.24)

    def point(x: float, y: float, z_ratio: float) -> Vector:
        return Vector((x, y, height * z_ratio))

    points: dict[str, tuple[Vector, Vector]] = {
        "Hips": (point(0, 0, level["pelvis"]), point(0, 0, level["spine_lower"])),
        "Spine02": (point(0, 0, level["spine_lower"]), point(0, 0, level["spine_mid"])),
        "Spine01": (point(0, 0, level["spine_mid"]), point(0, 0, level["chest"])),
        "Spine": (point(0, 0, level["chest"]), point(0, 0, level["neck"])),
        "neck": (point(0, 0, level["neck"]), point(0, 0, level["head"])),
        "Head": (point(0, 0, level["head"]), point(0, 0, level["head_tail"])),
    }
    for prefix, sign in (("Left", 1), ("Right", -1)):
        shoulder = point(sign * shoulder_x, 0, level["shoulder"])
        elbow = Vector((sign * shoulder_x * 1.04, -height * 0.018, elbow_z))
        wrist = Vector((sign * shoulder_x * 1.02, -height * 0.035, wrist_z))
        hand_tail = wrist + Vector((0, -height * 0.025, -height * 0.07))
        hip = point(sign * hip_x, 0, level["pelvis"])
        knee = point(sign * hip_x * 0.96, -height * 0.01, level["knee"])
        ankle = point(sign * hip_x * 0.94, -height * 0.005, level["ankle"])
        toe = Vector((ankle.x, -foot_length * 0.48, height * 0.045))
        toe_tail = Vector((ankle.x, -foot_length, height * 0.035))
        points.update({
            f"{prefix}Shoulder": (point(sign * shoulder_x * 0.72, 0, level["shoulder"]), shoulder),
            f"{prefix}Arm": (shoulder, elbow),
            f"{prefix}ForeArm": (elbow, wrist),
            f"{prefix}Hand": (wrist, hand_tail),
            f"{prefix}UpLeg": (hip, knee),
            f"{prefix}Leg": (knee, ankle),
            f"{prefix}Foot": (ankle, toe),
            f"{prefix}ToeBase": (toe, toe_tail),
        })
    return points


def lerp(a: Vector, b: Vector, amount: float) -> Vector:
    return a + (b - a) * amount


def safe_tail(head: Vector, tail: Vector, fallback: Vector | None = None) -> Vector:
    if (tail - head).length >= 0.015:
        return tail
    return head + (fallback or Vector((0.0, 0.0, 0.05)))


def create_production_rig(
    hero: str,
    points: dict[str, tuple[Vector, Vector]],
    collection: bpy.types.Collection,
) -> tuple[bpy.types.Object, dict[str, list[str]]]:
    data = bpy.data.armatures.new(f"{hero}_PRODUCTION_RIG_STAGE_1")
    armature = bpy.data.objects.new(f"{hero}_PRODUCTION_RIG_STAGE_1", data)
    collection.objects.link(armature)
    armature.show_in_front = True
    data.display_type = "OCTAHEDRAL"
    armature["production_stage"] = "stage-1-authoring-scaffold"
    armature["skin_binding_status"] = "stage-3-pending"
    armature["pose_gate_status"] = "stage-5-not-run"
    armature["runtime_status"] = "not-exported-not-live"

    bpy.context.view_layer.objects.active = armature
    armature.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    created: dict[str, bpy.types.EditBone] = {}
    categories: dict[str, list[str]] = {
        "deform": [],
        "control": [],
        "helper": [],
        "accessory": [],
    }

    def add(name: str, head: Vector, tail: Vector, parent: str | None, category: str, deform: bool) -> None:
        bone = data.edit_bones.new(name)
        bone.head = head
        bone.tail = safe_tail(head, tail)
        bone.use_deform = deform
        if parent:
            bone.parent = created[parent]
        created[name] = bone
        categories[category].append(name)

    hips_head, hips_tail = points["Hips"]
    spine02 = points["Spine02"][0]
    spine01 = points["Spine01"][0]
    chest = points["Spine"][0]
    neck = points["neck"][0]
    head = points["Head"][0]
    head_tail = points["Head"][1]

    add("CTRL_world", Vector((0, 0, 0)), Vector((0, 0, 0.18)), None, "control", False)
    add("CTRL_motion", Vector((hips_head.x, hips_head.y, 0)), hips_head, "CTRL_world", "control", False)
    add("DEF_pelvis", hips_head, spine02, None, "deform", True)
    add("DEF_spine_lower", spine02, spine01, "DEF_pelvis", "deform", True)
    add("DEF_spine_mid", spine01, chest, "DEF_spine_lower", "deform", True)
    add("DEF_chest", chest, neck, "DEF_spine_mid", "deform", True)

    if hero == "Mebble":
        neck_mid = lerp(neck, head, 1 / 3)
        neck_upper = lerp(neck, head, 2 / 3)
        add("DEF_neck_base", neck, neck_mid, "DEF_chest", "deform", True)
        add("DEF_neck_mid", neck_mid, neck_upper, "DEF_neck_base", "deform", True)
        add("DEF_neck_upper", neck_upper, head, "DEF_neck_mid", "deform", True)
        head_parent = "DEF_neck_upper"
    else:
        add("DEF_neck_base", neck, head, "DEF_chest", "deform", True)
        head_parent = "DEF_neck_base"
    add("DEF_head", head, head_tail, head_parent, "deform", True)
    jaw_head = lerp(head, head_tail, 0.35) + Vector((0, -0.035, -0.02))
    add("DEF_jaw", jaw_head, jaw_head + Vector((0, -0.06, -0.035)), "DEF_head", "deform", True)

    for side, source_prefix, suffix in (("left", "Left", ".L"), ("right", "Right", ".R")):
        shoulder = points[f"{source_prefix}Shoulder"]
        upper = points[f"{source_prefix}Arm"]
        fore = points[f"{source_prefix}ForeArm"]
        hand = points[f"{source_prefix}Hand"]
        thigh = points[f"{source_prefix}UpLeg"]
        shin = points[f"{source_prefix}Leg"]
        foot = points[f"{source_prefix}Foot"]
        toe = points[f"{source_prefix}ToeBase"]
        add(f"DEF_clavicle{suffix}", shoulder[0], upper[0], "DEF_chest", "deform", True)
        add(f"DEF_upper_arm{suffix}", upper[0], fore[0], f"DEF_clavicle{suffix}", "deform", True)
        add(f"MCH_upper_arm_twist{suffix}", lerp(upper[0], fore[0], 0.32), lerp(upper[0], fore[0], 0.62), f"DEF_upper_arm{suffix}", "helper", False)
        add(f"DEF_forearm{suffix}", fore[0], hand[0], f"DEF_upper_arm{suffix}", "deform", True)
        add(f"DEF_hand{suffix}", hand[0], hand[1], f"DEF_forearm{suffix}", "deform", True)
        add(f"DEF_thigh{suffix}", thigh[0], shin[0], "DEF_pelvis", "deform", True)
        add(f"MCH_thigh_twist{suffix}", lerp(thigh[0], shin[0], 0.30), lerp(thigh[0], shin[0], 0.60), f"DEF_thigh{suffix}", "helper", False)
        add(f"DEF_shin{suffix}", shin[0], foot[0], f"DEF_thigh{suffix}", "deform", True)
        add(f"DEF_foot{suffix}", foot[0], toe[0], f"DEF_shin{suffix}", "deform", True)
        add(f"DEF_toe{suffix}", toe[0], toe[1], f"DEF_foot{suffix}", "deform", True)
        add(f"CTRL_hand_ik{suffix}", hand[0], hand[0] + Vector((0, 0, 0.10)), "CTRL_world", "control", False)
        add(f"CTRL_foot_ik{suffix}", foot[0], toe[0], "CTRL_world", "control", False)
        elbow_pole = fore[0] + Vector((0, -0.18 if side == "left" else 0.18, 0))
        knee_pole = shin[0] + Vector((0, -0.20 if side == "left" else 0.20, 0))
        add(f"CTRL_elbow_pole{suffix}", elbow_pole, elbow_pole + Vector((0, 0, 0.08)), "CTRL_world", "control", False)
        add(f"CTRL_knee_pole{suffix}", knee_pole, knee_pole + Vector((0, 0, 0.08)), "CTRL_world", "control", False)

    add("CTRL_pelvis", hips_head, hips_head + Vector((0, 0, 0.13)), "CTRL_motion", "control", False)
    add("CTRL_chest", chest, neck, "CTRL_motion", "control", False)
    add("CTRL_head", head, safe_tail(head, head_tail), "CTRL_motion", "control", False)
    add("CTRL_gaze", head + Vector((0, -0.18, 0.02)), head + Vector((0, -0.28, 0.02)), "CTRL_world", "control", False)
    add("CTRL_hand_pose.L", points["LeftHand"][0], points["LeftHand"][0] + Vector((0, 0, 0.07)), "CTRL_world", "control", False)
    add("CTRL_hand_pose.R", points["RightHand"][0], points["RightHand"][0] + Vector((0, 0, 0.07)), "CTRL_world", "control", False)
    add("CTRL_face", head, head + Vector((0, -0.10, 0)), "CTRL_head", "control", False)

    accessory_parent = "DEF_head"
    add("DEF_hat", head_tail, head_tail + Vector((0, 0, 0.10)), accessory_parent, "accessory", True)
    if hero == "Hargold":
        add("DEF_feather_01", head_tail + Vector((0, 0, 0.05)), head_tail + Vector((0.08, 0, 0.12)), "DEF_hat", "accessory", True)
        add("DEF_feather_02", head_tail + Vector((0.08, 0, 0.12)), head_tail + Vector((0.15, 0, 0.08)), "DEF_feather_01", "accessory", True)
        add("DEF_scarf_root", neck, neck + Vector((0, 0.07, -0.05)), "DEF_chest", "accessory", True)
        add("DEF_scarf_tail.L", neck + Vector((0.05, 0.07, -0.05)), neck + Vector((0.10, 0.12, -0.18)), "DEF_scarf_root", "accessory", True)
        add("DEF_scarf_tail.R", neck + Vector((-0.05, 0.07, -0.05)), neck + Vector((-0.10, 0.12, -0.18)), "DEF_scarf_root", "accessory", True)
        add("DEF_backpack", chest + Vector((0, 0.13, -0.04)), chest + Vector((0, 0.18, 0.16)), "DEF_chest", "accessory", True)
        add("DEF_belt", hips_head, hips_head + Vector((0, 0, 0.08)), "DEF_pelvis", "accessory", True)
        add("DEF_pouch", hips_head + Vector((0.10, 0, 0)), hips_head + Vector((0.10, 0, -0.10)), "DEF_belt", "accessory", True)
        add("DEF_facial_hair", jaw_head, jaw_head + Vector((0, -0.02, -0.10)), "DEF_jaw", "accessory", True)
    else:
        add("DEF_glasses", head + Vector((0, -0.08, 0.02)), head + Vector((0, -0.12, 0.02)), "DEF_head", "accessory", True)
        add("DEF_adams_apple", lerp(neck, head, 0.45), lerp(neck, head, 0.45) + Vector((0, -0.035, 0.02)), "DEF_neck_mid", "accessory", True)
        cape_root = chest + Vector((0, 0.07, 0.02))
        add("DEF_cape_root", cape_root, cape_root + Vector((0, 0.02, -0.10)), "DEF_chest", "accessory", True)
        previous = "DEF_cape_root"
        for index in range(1, 7):
            top = cape_root + Vector((0, 0.02 * index, -0.10 * index))
            name = f"DEF_cape_{index:02d}"
            add(name, top, top + Vector((0, 0.025, -0.10)), previous, "accessory", True)
            previous = name
        add("DEF_belt", hips_head, hips_head + Vector((0, 0, 0.08)), "DEF_pelvis", "accessory", True)
        add("DEF_pouch", hips_head + Vector((0.08, 0, 0)), hips_head + Vector((0.08, 0, -0.10)), "DEF_belt", "accessory", True)

    bpy.ops.object.mode_set(mode="OBJECT")
    for name in categories["control"]:
        data.bones[name]["semantic_category"] = "control"
    for name in categories["helper"]:
        data.bones[name]["semantic_category"] = "helper"
    for name in categories["accessory"]:
        data.bones[name]["semantic_category"] = "accessory-deform"
    for name in categories["deform"]:
        data.bones[name]["semantic_category"] = "body-deform"
    return armature, categories


def create_sockets(
    hero: str,
    rig: bpy.types.Object,
    collection: bpy.types.Collection,
    points: dict[str, tuple[Vector, Vector]],
) -> list[dict]:
    specs = {
        "SOCKET_root": (Vector((0, 0, 0)), "CTRL_world"),
        "SOCKET_head": (points["Head"][1], "DEF_head"),
        "SOCKET_hand.L": (points["LeftHand"][1], "DEF_hand.L"),
        "SOCKET_hand.R": (points["RightHand"][1], "DEF_hand.R"),
        "SOCKET_foot.L": (points["LeftFoot"][0], "DEF_foot.L"),
        "SOCKET_foot.R": (points["RightFoot"][0], "DEF_foot.R"),
        "SOCKET_back": (points["Spine"][0] + Vector((0, 0.12, 0)), "DEF_chest"),
        "SOCKET_effect": (points["Hips"][0], "DEF_pelvis"),
    }
    if hero == "Mebble":
        specs["SOCKET_cape"] = (points["Spine"][0] + Vector((0, 0.08, 0)), "DEF_cape_root")
    else:
        specs["SOCKET_scarf"] = (points["neck"][0], "DEF_scarf_root")
    result = []
    for name, (location, semantic_parent) in specs.items():
        empty = bpy.data.objects.new(name, None)
        empty.empty_display_type = "SPHERE"
        empty.empty_display_size = 0.035
        empty.location = location
        empty["semantic_parent"] = semantic_parent
        empty["stage"] = "stage-1-interface"
        collection.objects.link(empty)
        result.append({"name": name, "semanticParent": semantic_parent, "locationMetres": [round(v, 6) for v in location]})
    return result


def configure_guides(hero: str, height: float, collection: bpy.types.Collection) -> None:
    floor = bpy.data.objects.new("GUIDE_floor_origin", None)
    floor.empty_display_type = "CIRCLE"
    floor.empty_display_size = 0.22
    collection.objects.link(floor)
    head = bpy.data.objects.new("GUIDE_canonical_height", None)
    head.empty_display_type = "PLAIN_AXES"
    head.empty_display_size = 0.12
    head.location.z = height
    head["height_metres"] = height
    collection.objects.link(head)
    facing = bpy.data.objects.new("GUIDE_forward_minus_Y", None)
    facing.empty_display_type = "ARROWS"
    facing.empty_display_size = 0.30
    facing.rotation_euler.x = 1.5707963267948966
    facing["native_forward"] = "-Y"
    facing["primary_review"] = "true-side"
    collection.objects.link(facing)


def build(hero: str) -> dict:
    config = CONFIG[hero]
    PRODUCTION_DIR.mkdir(parents=True, exist_ok=True)
    baseline = preserve_rollback(config)
    reset_scene()
    collections = make_collections()
    bpy.ops.import_scene.gltf(filepath=str(config["live"]), import_shading="NORMALS")
    imported = list(bpy.context.scene.objects)
    removed_actions = remove_imported_animation()
    armatures = [obj for obj in imported if obj.type == "ARMATURE"]
    skinned = [
        obj for obj in imported
        if obj.type == "MESH" and any(mod.type == "ARMATURE" for mod in obj.modifiers)
    ]
    if len(armatures) != 1 or len(skinned) != 1:
        raise RuntimeError(f"expected one armature and one skinned mesh, got {len(armatures)} / {len(skinned)}")
    source_armature = armatures[0]
    source_mesh = skinned[0]
    bounds_min, bounds_max = world_bounds([source_mesh])
    raw_height = bounds_max.z - bounds_min.z
    canonical_scale = config["height"] / raw_height
    centre_xy = Vector(((bounds_min.x + bounds_max.x) / 2, (bounds_min.y + bounds_max.y) / 2, 0))
    canonical_matrix = (
        Matrix.Translation(Vector((-centre_xy.x * canonical_scale, -centre_xy.y * canonical_scale, -bounds_min.z * canonical_scale)))
        @ Matrix.Scale(canonical_scale, 4)
    )

    for obj in imported:
        move_to_collection(obj, collections["INTERIM_24_BONE_ROLLBACK_REFERENCE"])
        obj.hide_render = True
        obj["runtime_role"] = "interim-rollback-reference"
    collections["INTERIM_24_BONE_ROLLBACK_REFERENCE"].hide_viewport = True
    collections["INTERIM_24_BONE_ROLLBACK_REFERENCE"].hide_render = True

    locked = create_locked_surface(
        hero,
        source_mesh,
        collections["LOCKED_VISIBLE_IDENTITY"],
        canonical_matrix,
    )
    locked_min, locked_max = world_bounds([locked])
    points = purposeful_rig_points(hero, config["height"])
    rig, categories = create_production_rig(hero, points, collections["PRODUCTION_RIG_STAGE_1"])
    sockets = create_sockets(hero, rig, collections["GAMEPLAY_SOCKETS_STAGE_1"], points)
    configure_guides(hero, config["height"], collections["REFERENCE_GUIDES"])

    scene = bpy.context.scene
    scene["asset_id"] = f"{hero.lower()}-production-rig"
    scene["asset_version"] = "0.1.0-stage-1"
    scene["production_stage"] = "stage-1-in-progress"
    scene["final_animation_blocked"] = True
    scene["visible_identity_locked"] = True
    scene["runtime_switch_authorized"] = False
    scene["canonical_height_metres"] = config["height"]
    scene["native_forward"] = "-Y"
    scene["foot_origin"] = "world-origin-floor-z0"
    scene["reference_sheet"] = config["reference"]
    scene["source_glb_sha256"] = baseline["sha256"]
    scene["source_glb"] = baseline["livePath"]
    scene["rollback_glb"] = baseline["rollbackPath"]
    scene["control_map"] = "data/production-character-rig-semantic-map.json"

    bpy.ops.wm.save_as_mainfile(filepath=str(config["blend"]), relative_remap=True)
    blend_hash = sha256(config["blend"])
    report = {
        "schemaVersion": 1,
        "hero": hero,
        "status": "stage-0-complete-stage-1-authoring-source-created-gates-2-through-7-pending",
        "baseline": baseline,
        "sourceImport": {
            "meshObject": source_mesh.name,
            "meshData": source_mesh.data.name,
            "armatureObject": source_armature.name,
            "armatureData": source_armature.data.name,
            "deformBoneCount": len(source_armature.data.bones),
            "materialAssignments": [slot.material.name for slot in source_mesh.material_slots if slot.material],
            "meshVertexCount": len(source_mesh.data.vertices),
            "meshPolygonCount": len(source_mesh.data.polygons),
            "morphTargetCount": len(source_mesh.data.shape_keys.key_blocks) if source_mesh.data.shape_keys else 0,
            "rawBoundsMetres": {
                "minimum": [round(v, 9) for v in bounds_min],
                "maximum": [round(v, 9) for v in bounds_max],
                "height": round(raw_height, 9),
            },
            "existingGameplaySockets": [],
            "removedImportedActionNames": removed_actions,
            "importedAnimationsRetainedInProductionSource": False,
        },
        "productionSource": {
            "blendPath": config["blend"].relative_to(ROOT).as_posix(),
            "sha256": blend_hash,
            "bytes": config["blend"].stat().st_size,
            "canonicalHeightMetres": config["height"],
            "canonicalNormalizationScale": round(canonical_scale, 12),
            "lockedSurfaceBoundsMetres": {
                "minimum": [round(v, 9) for v in locked_min],
                "maximum": [round(v, 9) for v in locked_max],
            },
            "lockedSurfaceObjectScale": [round(v, 6) for v in locked.scale],
            "lockedSurfaceObjectLocation": [round(v, 6) for v in locked.location],
            "nativeForward": "-Y",
            "primaryReviewOrientation": "true-side",
            "footOrigin": "world-origin-floor-z0",
            "collections": list(COLLECTIONS),
            "rigObject": rig.name,
            "rigStatus": "unskinned-stage-1-scaffold-not-approved",
            "boneCounts": {name: len(values) for name, values in categories.items()},
            "bones": categories,
            "sockets": sockets,
        },
        "gates": {
            "stage0BaselinePreserved": True,
            "stage1EditableBlendCreated": True,
            "stage1CanonicalStaticSurfaceCreated": True,
            "stage1ProductionTopologyApproved": False,
            "stage1ProductionRigApproved": False,
            "stage2PurposefulSkeletonApproved": False,
            "stage3SkinAndCorrectivesApproved": False,
            "stage4FaceHandAccessorySystemsApproved": False,
            "stage5PoseGatePassed": False,
            "stage6CandidateExportIntegrated": False,
            "stage7RuntimeParityPassed": False,
            "stage8FinalAnimationAllowed": False,
        },
    }
    config["report"].write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report


def main() -> None:
    args = parse_args()
    report = build(args.hero)
    print("CODEX_PRODUCTION_RIG_STAGE_0_1=" + json.dumps(report))


if __name__ == "__main__":
    main()
