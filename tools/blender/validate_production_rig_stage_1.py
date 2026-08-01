"""Validate completed Stage 1 production-rig Blender sources.

The validator approves source integrity and scaffold readiness only.  It keeps
Stage 2 skeleton controls, Stage 3 skinning/deformation, candidate export,
runtime switching, and final animation explicitly blocked.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
PRODUCTION_DIR = ROOT / "assets" / "blender" / "production"
CONFIG = {
    "Hargold": {
        "height": 1.82,
        "blend": PRODUCTION_DIR / "hargold_production_rig.blend",
        "surface": "Hargold_LOCKED_VISIBLE_SURFACE_STAGE_1",
        "rig": "Hargold_PRODUCTION_RIG_STAGE_1",
        "inventory": PRODUCTION_DIR / "hargold_stage-1-rig-inventory.json",
        "validation": PRODUCTION_DIR / "hargold_stage-1-validation.json",
        "legacy_validation": PRODUCTION_DIR / "hargold_stage-0-1-validation.json",
        "preview": ROOT / "assets" / "previews" / "rig-stage-1" / "hargold-scaffold-pose-review.png",
        "counts": {"body-deform": 24, "accessory-deform": 10, "control": 25, "helper": 6},
        "specific": {"DEF_feather_02", "DEF_scarf_root", "DEF_backpack", "CTRL_feather", "CTRL_scarf", "CTRL_backpack"},
    },
    "Mebble": {
        "height": 2.2932,
        "blend": PRODUCTION_DIR / "mebble_production_rig.blend",
        "surface": "Mebble_LOCKED_VISIBLE_SURFACE_STAGE_1",
        "rig": "Mebble_PRODUCTION_RIG_STAGE_1",
        "inventory": PRODUCTION_DIR / "mebble_stage-1-rig-inventory.json",
        "validation": PRODUCTION_DIR / "mebble_stage-1-validation.json",
        "legacy_validation": PRODUCTION_DIR / "mebble_stage-0-1-validation.json",
        "preview": ROOT / "assets" / "previews" / "rig-stage-1" / "mebble-scaffold-pose-review.png",
        "counts": {"body-deform": 26, "accessory-deform": 12, "control": 25, "helper": 6},
        "specific": {"DEF_neck_base", "DEF_neck_mid", "DEF_neck_upper", "DEF_adams_apple", "DEF_cape_06", "CTRL_glasses", "CTRL_cape", "CTRL_neck_shape"},
    },
}

REQUIRED_COLLECTIONS = {
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
}

REQUIRED_SOCKET_SEMANTICS = {
    "characterRoot",
    "gameplayCenter",
    "leftHand",
    "rightHand",
    "head",
    "hat",
    "backOrBackpack",
    "effectOrigin",
    "groundSlamImpact",
}


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


def bounds(obj: bpy.types.Object) -> tuple[Vector, Vector]:
    points = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    return (
        Vector(min(point[index] for point in points) for index in range(3)),
        Vector(max(point[index] for point in points) for index in range(3)),
    )


def validate(hero: str) -> dict:
    config = CONFIG[hero]
    errors = []
    if Path(bpy.data.filepath).resolve() != config["blend"].resolve():
        errors.append("validator did not open the authoritative Blender source")
    missing_collections = sorted(REQUIRED_COLLECTIONS - set(bpy.data.collections.keys()))
    if missing_collections:
        errors.append(f"missing source collections: {missing_collections}")

    surface = bpy.data.objects.get(config["surface"])
    rig = bpy.data.objects.get(config["rig"])
    surface_summary = {}
    if not surface or surface.type != "MESH":
        errors.append("locked visible surface is missing")
    else:
        minimum, maximum = bounds(surface)
        measured_height = maximum.z - minimum.z
        if abs(measured_height - config["height"]) > 0.00001:
            errors.append(f"canonical height mismatch: {measured_height}")
        if abs(minimum.z) > 0.00001:
            errors.append(f"floor alignment mismatch: {minimum.z}")
        if tuple(round(value, 6) for value in surface.scale) != (1.0, 1.0, 1.0):
            errors.append("mesh object scale is not 1,1,1")
        if tuple(round(value, 6) for value in surface.rotation_euler) != (0.0, 0.0, 0.0):
            errors.append("mesh object rotation is not applied")
        if surface.modifiers:
            errors.append("Stage 1 locked surface was skinned before the Stage 3 gate")
        surface_summary = {
            "vertices": len(surface.data.vertices),
            "polygons": len(surface.data.polygons),
            "materials": [slot.material.name for slot in surface.material_slots if slot.material],
            "boundsMinimum": [round(value, 9) for value in minimum],
            "boundsMaximum": [round(value, 9) for value in maximum],
            "heightMetres": round(measured_height, 9),
            "floorZ": round(minimum.z, 9),
            "objectScale": [round(value, 6) for value in surface.scale],
        }

    counts = {}
    if not rig or rig.type != "ARMATURE":
        errors.append("Stage 1 armature scaffold is missing")
    else:
        if tuple(round(value, 6) for value in rig.scale) != (1.0, 1.0, 1.0):
            errors.append("armature object scale is not 1,1,1")
        if any(abs(value) > 0.000001 for value in (*rig.location, *rig.rotation_euler)):
            errors.append("armature object transforms are not applied")
        counts = {
            category: sum(1 for bone in rig.data.bones if bone.get("semantic_category") == category)
            for category in config["counts"]
        }
        if counts != config["counts"]:
            errors.append(f"bone classification count mismatch: {counts}")
        missing_specific = sorted(config["specific"] - set(rig.data.bones.keys()))
        if missing_specific:
            errors.append(f"missing hero-specific scaffold bones: {missing_specific}")
        if "DEF_spine_upper" not in rig.data.bones:
            errors.append("purposeful upper-spine scaffold is missing")
        for bone in rig.data.bones:
            category = bone.get("semantic_category")
            expected_deform = category in {"body-deform", "accessory-deform"}
            if bone.use_deform != expected_deform:
                errors.append(f"{bone.name}: use_deform conflicts with classification")
            if bone.length < 0.012 or not math.isfinite(bone.length):
                errors.append(f"{bone.name}: invalid rest length")
        required_bone_collections = {"DEFORM_RIG", "CONTROL_RIG", "HELPER_CONTROLS", "ACCESSORY_RIG", "FACIAL_SYSTEM"}
        missing_bone_collections = sorted(required_bone_collections - {collection.name for collection in rig.data.collections})
        if missing_bone_collections:
            errors.append(f"missing armature bone collections: {missing_bone_collections}")

    sockets = [obj for obj in bpy.data.objects if obj.name.startswith("SOCKET_")]
    socket_semantics = {obj.get("semantic") for obj in sockets}
    if len(sockets) != 12:
        errors.append(f"expected exactly 12 Stage 1 sockets, found {len(sockets)}")
    missing_socket_semantics = sorted(REQUIRED_SOCKET_SEMANTICS - socket_semantics)
    if missing_socket_semantics:
        errors.append(f"missing socket semantics: {missing_socket_semantics}")
    if hero == "Hargold" and "scarfOrigin" not in socket_semantics:
        errors.append("Hargold scarf-origin socket is missing")
    if hero == "Mebble" and "capeOrigin" not in socket_semantics:
        errors.append("Mebble cape-origin socket is missing")

    if bpy.data.actions:
        errors.append("Stage 1 source contains animation actions")
    if not config["preview"].exists() or config["preview"].stat().st_size < 25_000:
        errors.append("scaffold pose-review sheet is missing or empty")
    if bpy.context.scene.get("stage_1_pass") is not True:
        errors.append("source metadata does not mark the Stage 1 audit as passed")
    if bpy.context.scene.get("stage_2_started") is not False:
        errors.append("source metadata incorrectly claims Stage 2 has started")
    if bpy.context.scene.get("final_animation_blocked") is not True:
        errors.append("source metadata does not block final animation")
    if bpy.context.scene.get("runtime_switch_authorized") is not False:
        errors.append("source metadata incorrectly authorizes a runtime switch")

    missing_dependencies = []
    for image in bpy.data.images:
        if image.source == "FILE" and image.packed_file is None:
            path = Path(bpy.path.abspath(image.filepath))
            if not path.exists():
                missing_dependencies.append(image.name)
    if missing_dependencies:
        errors.append(f"missing image dependencies: {missing_dependencies}")

    inventory = json.loads(config["inventory"].read_text(encoding="utf-8"))
    if not inventory["stage1Pass"] or inventory["unresolvedScaffoldIssues"]:
        errors.append("Stage 1 inventory records unresolved scaffold failures")
    if not inventory["armature"]["boneRollAudit"]["pass"]:
        errors.append("bone-roll inventory did not pass")
    if not inventory["armature"]["hierarchyAudit"]["pass"]:
        errors.append("hierarchy inventory did not pass")
    if not inventory["poseReview"]["allMechanicallyAchievable"]:
        errors.append("static scaffold-pose review did not pass")
    if inventory["poseReview"]["poseCount"] != 10:
        errors.append("static scaffold-pose review does not contain all ten requested poses")
    if inventory["finalAnimationAllowed"]:
        errors.append("inventory incorrectly allows final animation")
    if inventory["sourceFile"]["sha256"] != sha256(config["blend"]):
        errors.append("inventory Blender hash is stale")

    result = {
        "schemaVersion": 1,
        "hero": hero,
        "status": "pass" if not errors else "fail",
        "scope": "Stage 1 source integrity, coordinate, hierarchy, roll, socket, and static scaffold-pose gate only",
        "pass": not errors,
        "blenderVersion": bpy.app.version_string,
        "blend": config["blend"].relative_to(ROOT).as_posix(),
        "blendSha256": sha256(config["blend"]),
        "surface": surface_summary,
        "rigCategoryCounts": counts,
        "socketCount": len(sockets),
        "actionCount": len(bpy.data.actions),
        "missingDependencies": missing_dependencies,
        "boneRollAuditPass": inventory["armature"]["boneRollAudit"]["pass"],
        "hierarchyAuditPass": inventory["armature"]["hierarchyAudit"]["pass"],
        "staticScaffoldPosePass": inventory["poseReview"]["allMechanicallyAchievable"],
        "stage2Started": False,
        "stage3Started": False,
        "runtimeSwitchAuthorized": False,
        "finalAnimationAllowed": False,
        "errors": errors,
    }
    encoded = json.dumps(result, indent=2) + "\n"
    config["validation"].write_text(encoded, encoding="utf-8")
    config["legacy_validation"].write_text(encoded, encoding="utf-8")
    return result


def main() -> None:
    hero = arguments().hero
    result = validate(hero)
    print("CODEX_STAGE_1_VALIDATION=" + json.dumps(result))
    if not result["pass"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
