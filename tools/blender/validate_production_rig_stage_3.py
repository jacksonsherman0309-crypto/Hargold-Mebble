"""Validate Stage 3 structure while preserving the failed visual gate result."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[2]
TOOLS = ROOT / "tools/blender"
if str(TOOLS) not in sys.path:
    sys.path.insert(0, str(TOOLS))
import finalize_production_rig_stage_1 as stage1


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--hero", required=True, choices=("Hargold", "Mebble"))
    hero = parser.parse_args(argv).hero
    production = ROOT / "assets/blender/production"
    blend = production / f"{hero.lower()}_production_rig.blend"
    inventory_path = production / f"{hero.lower()}_stage-3-deformation-inventory.json"
    validation_path = production / f"{hero.lower()}_stage-3-diagnostic-validation.json"
    rig = bpy.data.objects.get(f"{hero}_PRODUCTION_RIG_STAGE_3")
    surface = bpy.data.objects.get(f"{hero}_LOCKED_VISIBLE_SURFACE_STAGE_1")
    inventory = json.loads(inventory_path.read_text(encoding="utf-8"))
    report = {
        "schemaVersion": 1, "hero": hero, "status": "stage-3-structure-valid-visual-gate-failed",
        "blenderVersion": bpy.app.version_string, "checks": [], "errors": [],
        "stage3GatePass": False,
        "blockedReasons": list(inventory["unresolvedStage3Issues"]),
    }

    def check(name, condition, detail):
        report["checks"].append({"name": name, "pass": bool(condition), "detail": detail})
        if not condition:
            report["errors"].append(f"{name}: {detail}")

    check("authoritative-blend-open", Path(bpy.data.filepath).resolve() == blend.resolve(), bpy.data.filepath)
    check("production-rig-present", rig is not None, f"{hero}_PRODUCTION_RIG_STAGE_3")
    check("locked-surface-present", surface is not None, f"{hero}_LOCKED_VISIBLE_SURFACE_STAGE_1")
    if rig and surface:
        check("stage1-and-stage2-remain-passed", bpy.context.scene.get("stage_1_pass") is True and bpy.context.scene.get("stage_2_pass") is True, {"stage1": bpy.context.scene.get("stage_1_pass"), "stage2": bpy.context.scene.get("stage_2_pass")})
        check("stage3-started-not-passed", bpy.context.scene.get("stage_3_started") is True and bpy.context.scene.get("stage_3_pass") is False, {"started": bpy.context.scene.get("stage_3_started"), "pass": bpy.context.scene.get("stage_3_pass")})
        check("later-gates-blocked", bpy.context.scene.get("stage_4_started") is False and bpy.context.scene.get("stage_5_pose_gate_pass") is False and bpy.context.scene.get("candidate_export_allowed") is False and bpy.context.scene.get("runtime_switch_authorized") is False, "Stage 4/5/export/runtime false")
        check("final-animation-blocked", bpy.context.scene.get("final_animation_blocked") is True and len(bpy.data.actions) == 0, {"blocked": bpy.context.scene.get("final_animation_blocked"), "actions": len(bpy.data.actions)})
        check("locked-base-fingerprint", stage1.mesh_fingerprint(surface) == inventory["lockedIdentity"]["baseFingerprint"], "positions/topology/materials/UV unchanged")
        armature = next((modifier for modifier in surface.modifiers if modifier.type == "ARMATURE"), None)
        smoothing = next((modifier for modifier in surface.modifiers if modifier.type == "CORRECTIVE_SMOOTH"), None)
        check("production-armature-modifier", armature is not None and armature.object == rig and armature.use_deform_preserve_volume, armature.name if armature else None)
        check("corrective-smooth-modifier", smoothing is not None and smoothing.iterations >= 4, smoothing.name if smoothing else None)
        deform_names = {bone.name for bone in rig.data.bones if bone.use_deform}
        check("twist-deformers", all(f"DEF_{segment}_twist.{side}" in deform_names for segment in ("upper_arm", "forearm", "thigh") for side in ("L", "R")), sorted(name for name in deform_names if "twist" in name))
        shape_keys = list(surface.data.shape_keys.key_blocks)[1:] if surface.data.shape_keys else []
        check("corrective-shape-count", len(shape_keys) == 13, len(shape_keys))
        drivers = list(surface.data.shape_keys.animation_data.drivers) if surface.data.shape_keys and surface.data.shape_keys.animation_data else []
        check("corrective-drivers", len(drivers) == 13, len(drivers))
        production_groups = {group.index for group in surface.vertex_groups if group.name in deform_names}
        maximum_influences = 0; maximum_sum_error = 0.0; unweighted = 0
        for vertex in surface.data.vertices:
            weights = [membership.weight for membership in vertex.groups if membership.group in production_groups]
            maximum_influences = max(maximum_influences, len(weights))
            if not weights:
                unweighted += 1
            else:
                maximum_sum_error = max(maximum_sum_error, abs(1.0 - sum(weights)))
        check("all-vertices-production-weighted", unweighted == 0, unweighted)
        check("mobile-influence-limit", maximum_influences <= 4, maximum_influences)
        check("normalized-production-weights", maximum_sum_error < 1e-5, maximum_sum_error)
        check("stress-evidence-complete", inventory["stressPoseReview"]["poseCount"] == 14 and all((ROOT / item["frame"]).exists() for item in inventory["stressPoseReview"]["results"]), inventory["stressPoseReview"]["poseCount"])
        check("visual-gate-honestly-failed", inventory["stage3Pass"] is False and len(inventory["unresolvedStage3Issues"]) >= 2, inventory["unresolvedStage3Issues"])
    report["structuralChecksPass"] = not report["errors"]
    report["summary"] = {"checks": len(report["checks"]), "passed": sum(item["pass"] for item in report["checks"]), "failed": sum(not item["pass"] for item in report["checks"])}
    validation_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print("CODEX_STAGE_3_VALIDATION=" + json.dumps({"hero": hero, "structuralChecksPass": report["structuralChecksPass"], "stage3GatePass": False, "summary": report["summary"]}))
    if report["errors"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
