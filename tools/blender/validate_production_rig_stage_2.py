"""Automated in-Blender validation for the unskinned Stage 2 rigs."""

from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[2]
TOOLS = ROOT / "tools" / "blender"
if str(TOOLS) not in sys.path:
    sys.path.insert(0, str(TOOLS))

import finalize_production_rig_stage_1 as stage1
import production_rig_stage_2_snap as snap

CONFIG = {
    "Hargold": {
        "blend": ROOT / "assets/blender/production/hargold_production_rig.blend",
        "rig": "Hargold_PRODUCTION_RIG_STAGE_2",
        "surface": "Hargold_LOCKED_VISIBLE_SURFACE_STAGE_1",
        "inventory": ROOT / "assets/blender/production/hargold_stage-2-rig-inventory.json",
        "validation": ROOT / "assets/blender/production/hargold_stage-2-validation.json",
        "source": "A045E299A3F63EC45765C36D436EEF8C53AFDEE4BB7BDC98FD0A23537ABBEBEC",
        "minimum": {"body-deform": 44, "accessory-deform": 10, "control": 76, "helper": 24},
    },
    "Mebble": {
        "blend": ROOT / "assets/blender/production/mebble_production_rig.blend",
        "rig": "Mebble_PRODUCTION_RIG_STAGE_2",
        "surface": "Mebble_LOCKED_VISIBLE_SURFACE_STAGE_1",
        "inventory": ROOT / "assets/blender/production/mebble_stage-2-rig-inventory.json",
        "validation": ROOT / "assets/blender/production/mebble_stage-2-validation.json",
        "source": "392D8F9C12AD140AFA738AB118D3C3A63F9A40DA41DD8A061FE8A37F91DE3A3B",
        "minimum": {"body-deform": 46, "accessory-deform": 16, "control": 78, "helper": 24},
    },
}


def arguments():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--hero", choices=sorted(CONFIG), required=True)
    return parser.parse_args(argv)


def check(report: dict, name: str, condition: bool, detail) -> None:
    report["checks"].append({"name": name, "pass": bool(condition), "detail": detail})
    if not condition:
        report["errors"].append(f"{name}: {detail}")


def required_names(hero: str) -> dict:
    deform = {
        "DEF_pelvis", "DEF_spine_lower", "DEF_spine_mid", "DEF_spine_upper", "DEF_chest",
        "DEF_neck_base", "DEF_head", "DEF_jaw",
    }
    controls = {
        "CTRL_world", "CTRL_motion", "CTRL_presentation", "CTRL_ground_slam_presentation",
        "CTRL_com", "CTRL_pelvis", "CTRL_spine_lower", "CTRL_spine_mid", "CTRL_spine_upper",
        "CTRL_chest", "CTRL_neck_base", "CTRL_head", "CTRL_face", "CTRL_gaze", "CTRL_jaw",
    }
    helpers = set()
    for side in ("L", "R"):
        suffix = f".{side}"
        deform.update({f"DEF_{part}{suffix}" for part in ("clavicle","upper_arm","forearm","hand","thumb","fingers_main","fingers_outer","thigh","shin","foot","toe")})
        controls.update({f"CTRL_{part}{suffix}" for part in ("clavicle","hand_ik","foot_ik","elbow_pole","knee_pole","hand_pose","thumb","fingers_main","fingers_outer")})
        controls.update({f"CTRL_fk_{part}{suffix}" for part in ("upper_arm","forearm","hand","thigh","shin","foot","toe")})
        helpers.update({f"MCH_ik_{part}{suffix}" for part in ("upper_arm","forearm","thigh","shin")})
        helpers.update({f"MCH_{part}{suffix}" for part in ("heel_pivot","bank_pivot","ball_pivot","toe_pivot","foot_target")})
    if hero == "Hargold":
        controls.update({"CTRL_twirl_presentation", "CTRL_double_jump_presentation", "CTRL_hat", "CTRL_feather", "CTRL_scarf", "CTRL_backpack", "CTRL_belt", "CTRL_pouch", "CTRL_facial_hair"})
    else:
        deform.update({"DEF_neck_mid", "DEF_neck_upper"})
        controls.update({"CTRL_neck_mid", "CTRL_neck_upper", "CTRL_neck_shape", "CTRL_hat", "CTRL_glasses", "CTRL_cape", "CTRL_belt", "CTRL_pouch", "CTRL_adams_apple", "CTRL_cape_yoke.L", "CTRL_cape_yoke.R", "CTRL_cape_wing.L", "CTRL_cape_wing.R"})
    return {"deform": deform, "control": controls, "helper": helpers}


def validate(hero: str) -> dict:
    config = CONFIG[hero]
    report = {"schemaVersion": 2, "hero": hero, "status": "in-progress", "blenderVersion": bpy.app.version_string, "checks": [], "errors": []}
    check(report, "authoritative-blend-open", Path(bpy.data.filepath).resolve() == config["blend"].resolve(), bpy.data.filepath)
    rig = bpy.data.objects.get(config["rig"])
    surface = bpy.data.objects.get(config["surface"])
    check(report, "stage2-rig-present", rig is not None, config["rig"])
    check(report, "locked-surface-present", surface is not None, config["surface"])
    if not rig or not surface:
        report["status"] = "failed"
        config["validation"].write_text(json.dumps(report, indent=2)+"\n", encoding="utf-8")
        return report
    inventory = json.loads(config["inventory"].read_text(encoding="utf-8"))
    semantic = json.loads((ROOT / "data/production-character-rig-semantic-map.json").read_text(encoding="utf-8"))
    check(report, "locked-source-hash", bpy.context.scene.get("source_glb_sha256") == config["source"], bpy.context.scene.get("source_glb_sha256"))
    check(report, "stage1-remains-passed", bpy.context.scene.get("stage_1_pass") is True, bpy.context.scene.get("stage_1_pass"))
    check(report, "stage2-marked-passed", bpy.context.scene.get("stage_2_pass") is True, bpy.context.scene.get("production_stage"))
    check(report, "stage3-not-started", bpy.context.scene.get("stage_3_started") is False and bpy.context.scene.get("skinning_started") is False, {"stage3": bpy.context.scene.get("stage_3_started"), "skinning": bpy.context.scene.get("skinning_started")})
    check(report, "final-animation-blocked", bpy.context.scene.get("final_animation_blocked") is True and len(bpy.data.actions) == 0, len(bpy.data.actions))
    check(report, "runtime-switch-blocked", bpy.context.scene.get("runtime_switch_authorized") is False, bpy.context.scene.get("runtime_switch_authorized"))
    check(report, "mesh-unskinned-no-modifiers", len(surface.modifiers) == 0 and surface.parent is None, {"modifiers": [m.type for m in surface.modifiers], "parent": surface.parent.name if surface.parent else None})
    check(report, "locked-surface-fingerprint", stage1.mesh_fingerprint(surface) == inventory["lockedBaseline"]["surfaceFingerprint"], "unchanged-from-stage2-inventory")
    check(report, "positive-unit-object-scale", all(abs(v-1.0) < 1e-6 for v in (*surface.scale, *rig.scale)), {"surface": list(surface.scale), "rig": list(rig.scale)})

    groups = {category: {b.name for b in rig.data.bones if b.get("semantic_category") == category} for category in ("body-deform","accessory-deform","control","helper")}
    names = required_names(hero)
    check(report, "required-deform-bones", names["deform"].issubset(groups["body-deform"]), sorted(names["deform"] - groups["body-deform"]))
    check(report, "required-animator-controls", names["control"].issubset(groups["control"]), sorted(names["control"] - groups["control"]))
    check(report, "required-mechanisms", names["helper"].issubset(groups["helper"]), sorted(names["helper"] - groups["helper"]))
    for category, minimum in config["minimum"].items():
        check(report, f"minimum-{category}-count", len(groups[category]) >= minimum, {"actual": len(groups[category]), "minimum": minimum})
    check(report, "unique-bone-identifiers", len(rig.data.bones) == len({b.name for b in rig.data.bones}), len(rig.data.bones))
    invalid_parents = [b.name for b in rig.data.bones if b.parent and b.parent.name not in rig.data.bones]
    check(report, "valid-parent-relationships", not invalid_parents, invalid_parents)
    invalid_deform_parent = [b.name for b in rig.data.bones if b.use_deform and b.parent and b.parent.get("semantic_category") == "control"]
    check(report, "deforms-not-parented-to-controls", not invalid_deform_parent, invalid_deform_parent)
    check(report, "export-deforms-exclude-controls", all(not b.use_deform for b in rig.data.bones if b.get("semantic_category") in {"control","helper"}), "animator/helper use_deform false")
    check(report, "no-negative-control-scale", all(all(v >= 0 for v in pb.scale) for pb in rig.pose.bones if pb.bone.get("semantic_category") in {"control","helper"}), "all non-negative")

    ik_details = []
    for side in ("L", "R"):
        for limb, owner, target, pole, prop in (
            ("arm", f"MCH_ik_forearm.{side}", f"CTRL_hand_ik.{side}", f"CTRL_elbow_pole.{side}", f"arm_ik_fk_{side}"),
            ("leg", f"MCH_ik_shin.{side}", f"MCH_foot_target.{side}", f"CTRL_knee_pole.{side}", f"leg_ik_fk_{side}"),
        ):
            constraints = [c for c in rig.pose.bones[owner].constraints if c.type == "IK"]
            valid = len(constraints) == 1 and constraints[0].subtarget == target and constraints[0].pole_subtarget == pole and constraints[0].chain_count == 2 and not constraints[0].use_stretch
            ik_details.append({"limb": limb, "side": side, "valid": valid})
            check(report, f"{limb}-{side}-ik-chain", valid, {"target": target, "pole": pole})
            check(report, f"{limb}-{side}-ikfk-range", prop in rig and 0.0 <= float(rig[prop]) <= 1.0, rig.get(prop))
    report["ikFk"] = ik_details

    snap_results = []
    stage1.reset_pose(rig)
    for side in ("L", "R"):
        snap_results.append(snap.snap_arm(rig, side, "IK"))
        snap_results.append(snap.snap_arm(rig, side, "FK"))
        snap_results.append(snap.snap_leg(rig, side, "IK"))
        snap_results.append(snap.snap_leg(rig, side, "FK"))
    stage1.reset_pose(rig)
    check(report, "ikfk-snapping-tolerance", all(item["endEffectorErrorMetres"] <= 0.0001 for item in snap_results), snap_results)
    report["snapResults"] = snap_results

    foot = rig.pose.bones["CTRL_foot_ik.L"]
    ball = rig.pose.bones["MCH_ball_pivot.L"]
    foot["footRoll"] = 35.0
    rig.update_tag(refresh={"DATA"})
    bpy.context.view_layer.update()
    check(report, "foot-roll-driver-functional", abs(ball.rotation_euler.x) > math.radians(1), ball.rotation_euler.x)
    foot["footRoll"] = 0.0
    hand = rig.pose.bones["CTRL_hand_pose.L"]
    finger = rig.pose.bones["CTRL_fingers_main.L"]
    hand["relaxedOpen"] = 0.0; hand["fist"] = 1.0
    rig.update_tag(refresh={"DATA"})
    bpy.context.view_layer.update()
    check(report, "hand-pose-blending-functional", abs(finger.rotation_euler.x) > 0.5, finger.rotation_euler.x)
    hand["fist"] = 0.0; hand["relaxedOpen"] = 1.0
    face = rig.pose.bones["CTRL_face"]
    check(report, "facial-interface-complete", all(prop in face for prop in inventory["facialControls"]["properties"]), inventory["facialControls"]["properties"])
    check(report, "all-hand-shapes-defined", all(pose in hand for pose in inventory["handControls"]["L"]["poses"]), inventory["handControls"]["L"]["poses"])

    sockets = {entry["semantic"] for entry in inventory["sockets"]}
    required_socket_semantics = {"characterRoot","gameplayCenter","leftHand","rightHand","leftFoot","rightFoot","head","hat","backOrBackpack","effectOrigin","groundSlamImpact","carryAttachment","heldItemLeft","heldItemRight","powerUpOrigin","interactionOrigin"}
    required_socket_semantics.add("scarfOrigin" if hero == "Hargold" else "capeOrigin")
    check(report, "socket-semantic-set", required_socket_semantics.issubset(sockets), sorted(required_socket_semantics-sockets))

    if hero == "Hargold":
        check(report, "hargold-only-presentation-controls", "CTRL_twirl_presentation" in rig.data.bones and "CTRL_double_jump_presentation" in rig.data.bones, "twirl and double-jump controls")
        check(report, "no-mebble-cape-controls-on-hargold", "CTRL_cape" not in rig.data.bones, "cape absent")
    else:
        cape = rig.pose.bones["CTRL_cape"]
        cape_props = ("closedRest","locomotionTrail","jumpLift","glideOpening","glideFullyOpen","glideSustainCurvature","directionalRoll","glideClosing","landingSettle")
        check(report, "mebble-cape-interface-complete", all(prop in cape for prop in cape_props), cape_props)
        check(report, "no-hargold-twirl-on-mebble", "CTRL_twirl_presentation" not in rig.data.bones and "hargoldTwirl" not in semantic.get("heroes",{}).get("Mebble",{}).get("actions",{}), "twirl absent")
        check(report, "no-hargold-double-jump-on-mebble", "CTRL_double_jump_presentation" not in rig.data.bones, "double jump absent")

    check(report, "semantic-map-version", semantic.get("schemaVersion") == 2, semantic.get("schemaVersion"))
    hero_map = semantic.get("heroes", {}).get(hero, {})
    check(report, "semantic-map-hero-entry", bool(hero_map), hero_map.get("source") if hero_map else None)
    mapped_names = set(hero_map.get("allExportDeforms", [])) | set(hero_map.get("allAnimatorControls", [])) | set(hero_map.get("allHelpers", []))
    actual_names = groups["body-deform"] | groups["accessory-deform"] | groups["control"] | groups["helper"]
    check(report, "semantic-map-resolves-completely", actual_names.issubset(mapped_names), sorted(actual_names-mapped_names))
    check(report, "control-pose-suite", inventory["poseReview"]["allControlsOnly"] and inventory["poseReview"]["allMechanicallyReachable"] and inventory["poseReview"]["allSolverFlipChecksPassed"], {"poses": inventory["poseReview"]["poseCount"]})

    stage1.reset_pose(rig)
    report["status"] = "stage-2-pass" if not report["errors"] else "stage-2-failed"
    report["pass"] = not report["errors"]
    report["summary"] = {"checks": len(report["checks"]), "passed": sum(1 for item in report["checks"] if item["pass"]), "failed": sum(1 for item in report["checks"] if not item["pass"])}
    config["validation"].write_text(json.dumps(report, indent=2)+"\n", encoding="utf-8")
    return report


def main():
    result = validate(arguments().hero)
    print("CODEX_STAGE_2_VALIDATION=" + json.dumps({"hero": result["hero"], "status": result["status"], "summary": result.get("summary"), "errors": result["errors"]}))
    if not result.get("pass"):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
