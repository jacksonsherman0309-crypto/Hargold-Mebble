"""Validate the narrow Stage 0/1 production-rig deliverables honestly."""

from __future__ import annotations

import argparse
import hashlib
import json
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
        "report": PRODUCTION_DIR / "hargold_stage-0-1-source-report.json",
        "validation": PRODUCTION_DIR / "hargold_stage-0-1-validation.json",
        "rig": "Hargold_PRODUCTION_RIG_STAGE_1",
        "surface": "Hargold_LOCKED_VISIBLE_SURFACE_STAGE_1",
        "minimum_socket_count": 9,
    },
    "Mebble": {
        "height": 2.2932,
        "blend": PRODUCTION_DIR / "mebble_production_rig.blend",
        "report": PRODUCTION_DIR / "mebble_stage-0-1-source-report.json",
        "validation": PRODUCTION_DIR / "mebble_stage-0-1-validation.json",
        "rig": "Mebble_PRODUCTION_RIG_STAGE_1",
        "surface": "Mebble_LOCKED_VISIBLE_SURFACE_STAGE_1",
        "minimum_socket_count": 9,
    },
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def arguments() -> argparse.Namespace:
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--hero", choices=sorted(CONFIG), required=True)
    return parser.parse_args(argv)


def bounds(obj: bpy.types.Object) -> tuple[Vector, Vector]:
    points = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    return (
        Vector(min(point[i] for point in points) for i in range(3)),
        Vector(max(point[i] for point in points) for i in range(3)),
    )


def validate(hero: str) -> dict:
    config = CONFIG[hero]
    errors: list[str] = []
    if Path(bpy.data.filepath).resolve() != config["blend"].resolve():
        errors.append("validator did not open the expected production blend")
    required_collections = {
        "LOCKED_VISIBLE_IDENTITY",
        "INTERIM_24_BONE_ROLLBACK_REFERENCE",
        "PRODUCTION_RIG_STAGE_1",
        "GAMEPLAY_SOCKETS_STAGE_1",
        "REFERENCE_GUIDES",
    }
    missing_collections = sorted(required_collections - set(bpy.data.collections.keys()))
    if missing_collections:
        errors.append(f"missing collections: {missing_collections}")

    surface = bpy.data.objects.get(config["surface"])
    rig = bpy.data.objects.get(config["rig"])
    if not surface or surface.type != "MESH":
        errors.append("canonical locked surface is missing")
    if not rig or rig.type != "ARMATURE":
        errors.append("Stage 1 production-rig scaffold is missing")

    surface_summary = {}
    if surface:
        minimum, maximum = bounds(surface)
        measured_height = maximum.z - minimum.z
        if abs(measured_height - config["height"]) > 0.00001:
            errors.append(f"canonical height mismatch: {measured_height}")
        if abs(minimum.z) > 0.00001:
            errors.append(f"foot origin is not on floor z=0: {minimum.z}")
        if any(abs(component - 1) > 0.000001 for component in surface.scale):
            errors.append(f"locked surface scale is not 1,1,1: {tuple(surface.scale)}")
        if surface.modifiers:
            errors.append("Stage 1 canonical surface must remain unskinned until Stage 3")
        surface_summary = {
            "vertices": len(surface.data.vertices),
            "polygons": len(surface.data.polygons),
            "materials": [slot.material.name for slot in surface.material_slots if slot.material],
            "boundsMinimum": [round(value, 9) for value in minimum],
            "boundsMaximum": [round(value, 9) for value in maximum],
            "heightMetres": round(measured_height, 9),
        }

    category_counts = {}
    if rig:
        for category in ("body-deform", "control", "helper", "accessory-deform"):
            category_counts[category] = sum(
                1 for bone in rig.data.bones if bone.get("semantic_category") == category
            )
        if category_counts.get("control", 0) < 10:
            errors.append("production control scaffold is incomplete")
        if category_counts.get("body-deform", 0) < 20:
            errors.append("production body scaffold is incomplete")
        if hero == "Mebble":
            for name in ("DEF_neck_base", "DEF_neck_mid", "DEF_neck_upper", "DEF_cape_06"):
                if name not in rig.data.bones:
                    errors.append(f"Mebble scaffold missing {name}")
        else:
            for name in ("DEF_feather_02", "DEF_scarf_root", "DEF_backpack"):
                if name not in rig.data.bones:
                    errors.append(f"Hargold scaffold missing {name}")

    sockets = [obj for obj in bpy.data.objects if obj.name.startswith("SOCKET_")]
    if len(sockets) < config["minimum_socket_count"]:
        errors.append(f"expected at least {config['minimum_socket_count']} sockets, got {len(sockets)}")
    if bpy.data.actions:
        errors.append("production source retains imported animation actions")
    if bpy.context.scene.get("runtime_switch_authorized") is not False:
        errors.append("production source must explicitly forbid a Stage 1 runtime switch")
    if bpy.context.scene.get("final_animation_blocked") is not True:
        errors.append("production source must explicitly keep final animation blocked")

    source_report = json.loads(config["report"].read_text(encoding="utf-8"))
    if not source_report["baseline"]["byteIdenticalRollback"]:
        errors.append("rollback is not byte-identical")
    if source_report["gates"]["stage8FinalAnimationAllowed"]:
        errors.append("source report incorrectly allows final animation")

    result = {
        "schemaVersion": 1,
        "hero": hero,
        "pass": not errors,
        "scope": "Stage 0 baseline preservation and Stage 1 authoring-source structure only",
        "blend": config["blend"].relative_to(ROOT).as_posix(),
        "blendSha256": sha256(config["blend"]),
        "surface": surface_summary,
        "rigCategoryCounts": category_counts,
        "socketCount": len(sockets),
        "actionCount": len(bpy.data.actions),
        "runtimeSwitchAuthorized": False,
        "finalAnimationAllowed": False,
        "remainingBlockedStages": [2, 3, 4, 5, 6, 7, 8],
        "errors": errors,
    }
    config["validation"].write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    return result


def main() -> None:
    hero = arguments().hero
    result = validate(hero)
    print("CODEX_STAGE_0_1_VALIDATION=" + json.dumps(result))
    if not result["pass"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
