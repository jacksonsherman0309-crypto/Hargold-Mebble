"""Build repository registries for the validated Stage 2 control rigs."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PRODUCTION = ROOT / "assets/blender/production"


def read(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write(path: Path, value):
    path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")


def semantic_entry(inventory: dict) -> dict:
    hero = inventory["hero"]
    socket_map = {entry["semantic"]: entry["name"] for entry in inventory["sockets"]}
    entry = {
        "source": inventory["sourceFile"]["path"],
        "sourceSha256": inventory["sourceFile"]["sha256"],
        "allExportDeforms": sorted(inventory["deformBones"] + inventory["accessoryDeformBones"]),
        "allAnimatorControls": inventory["animatorControls"],
        "allHelpers": inventory["helpers"],
        "ikFk": inventory["ikFk"],
        "feet": inventory["footControls"],
        "hands": inventory["handControls"],
        "face": inventory["facialControls"],
        "accessories": inventory["accessoryControls"],
        "sockets": socket_map,
        "actions": {},
    }
    if hero == "Hargold":
        entry["actions"] = {
            "groundSlamPresentation": "CTRL_ground_slam_presentation",
            "hargoldTwirl": "CTRL_twirl_presentation",
            "hargoldDoubleJump": "CTRL_double_jump_presentation",
        }
    else:
        entry["actions"] = {
            "groundSlamPresentation": "CTRL_ground_slam_presentation",
            "mebbleGlide": {
                "control": "CTRL_cape",
                "properties": ["glideOpening", "glideFullyOpen", "glideSustainCurvature", "glideClosing", "landingSettle"],
            },
        }
    return entry


def main():
    old_map = read(ROOT / "data/production-character-rig-semantic-map.json")
    inventories = {
        hero: read(PRODUCTION / f"{hero.lower()}_stage-2-rig-inventory.json")
        for hero in ("Hargold", "Mebble")
    }
    validations = {
        hero: read(PRODUCTION / f"{hero.lower()}_stage-2-validation.json")
        for hero in ("Hargold", "Mebble")
    }
    semantic = {
        "schemaVersion": 2,
        "status": "stage-2-complete-not-active-in-runtime-stage-3-blocked",
        "runtimeUsesThisMap": False,
        "rawExportNamesAllowedInGameplayLogic": False,
        "controllerOwnsWorldTranslation": True,
        "normalGameplayRootMotion": False,
        "coordinateConvention": {
            "units": "metres", "worldUp": "+Z", "nativeForward": "-Y",
            "trueSideCameraAxis": "+X looking toward origin", "negativeScaleMirroring": False,
        },
        "shared": {
            "worldRoot": "CTRL_world", "gameplayMotionReference": "CTRL_motion",
            "visualPresentation": "CTRL_presentation", "centerOfMass": "CTRL_com",
            "pelvis": "CTRL_pelvis", "lowerSpine": "CTRL_spine_lower",
            "middleSpine": "CTRL_spine_mid", "upperSpine": "CTRL_spine_upper",
            "chest": "CTRL_chest", "head": "CTRL_head", "headAim": "CTRL_gaze",
            "faceInterface": "CTRL_face", "groundSlamPresentation": "CTRL_ground_slam_presentation",
        },
        "heroes": {hero: semantic_entry(inventory) for hero, inventory in inventories.items()},
        "interim24BoneMigrationMap": old_map["interim24BoneMigrationMap"],
        "rollback": {
            "activeRuntimeRemainsInterim": True,
            "Hargold": "assets/exports/meshy/hargold_canonical_gameplay_rig.glb",
            "Mebble": "assets/exports/meshy/mebble_canonical_gameplay_rig.glb",
            "runtimeSwitchAuthorized": False,
        },
        "deprecated": {
            "stage1RigObjectNames": ["Hargold_PRODUCTION_RIG_STAGE_1", "Mebble_PRODUCTION_RIG_STAGE_1"],
            "rawInterimNamesInNewGameplayCode": "forbidden-use-semantic-map",
            "rejectedProceduralCharacters": ["assets/exports/hargold_character.glb", "assets/exports/mebble_character.glb"],
        },
        "pendingBeforeRuntimeUse": [
            "Stage 3 skinning, topology correction, weighting and corrective deformation",
            "Stage 4 final hand, face and accessory deformation systems",
            "Stage 5 locked-surface deformation pose gate",
            "Stage 6 versioned candidate GLB export and semantic integration",
            "Stage 7 runtime parity and rollback validation",
        ],
    }
    write(ROOT / "data/production-character-rig-semantic-map.json", semantic)

    stage2 = {
        "schemaVersion": 1,
        "status": "stage-2-pass-unskinned-stage-3-not-authorized-final-animation-blocked",
        "date": "2026-08-01",
        "authority": {
            "productionOrder": "data/rig-first-character-production-gate-2026-07-31.json",
            "rigDirection": "data/character-rig-direction-override-2026-07-31.json",
            "motionOverride": "data/animation-motion-override-2026-07-31.json",
            "stage1Evidence": "data/production-character-rig-stage-1.json",
            "semanticMap": "data/production-character-rig-semantic-map.json",
        },
        "tooling": {
            "blender": inventories["Hargold"]["blenderVersion"],
            "finalizer": "tools/blender/finalize_production_rig_stage_2.py",
            "snapTool": "tools/blender/production_rig_stage_2_snap.py",
            "validator": "tools/blender/validate_production_rig_stage_2.py",
            "registryBuilder": "tools/build_character_rig_stage_2_registry.py",
        },
        "heroes": {},
        "gateResult": {
            "stage0BaselinePreservation": "pass-reused",
            "stage1EditableSourcesAndScaffolds": "pass-reused",
            "stage2FinalDeformHierarchy": "pass",
            "stage2AnimatorControls": "pass",
            "stage2IkFkAndSnapping": "pass",
            "stage2FootRoll": "pass",
            "stage2HandsFaceAccessories": "pass",
            "stage2SocketsAndSemanticMap": "pass",
            "stage3SkinningTopologyCorrectives": "not-started-not-authorized",
            "runtimeSwitchAuthorized": False,
            "finalAnimationAllowed": False,
        },
    }
    for hero, inventory in inventories.items():
        counts = inventory["armature"]["counts"]
        stage2["heroes"][hero] = {
            "source": inventory["sourceFile"]["path"], "sha256": inventory["sourceFile"]["sha256"],
            "bytes": inventory["sourceFile"]["bytes"], "inventory": f"assets/blender/production/{hero.lower()}_stage-2-rig-inventory.json",
            "validation": f"assets/blender/production/{hero.lower()}_stage-2-validation.json",
            "poseSheet": inventory["poseReview"]["sheet"],
            "counts": {"bodyDeform": counts["body-deform"], "accessoryDeform": counts["accessory-deform"], "animatorControls": counts["control"], "helpers": counts["helper"], "sockets": len(inventory["sockets"]), "controlTestPoses": inventory["poseReview"]["poseCount"]},
            "unskinned": True, "actions": 0, "stage2Pass": validations[hero]["pass"],
            "validationSummary": validations[hero]["summary"],
        }
    write(ROOT / "data/production-character-rig-stage-2.json", stage2)

    checklist_path = ROOT / "assets/blender/character-production-checklist.json"
    checklist = read(checklist_path)
    checklist["schemaVersion"] = 5
    checklist["productionRigStages"]["stage2PurposefulSkeletons"] = "pass-unskinned-final-deform-control-ikfk-foot-hand-face-accessory-and-socket-architecture"
    checklist["productionRigStages"]["stage3SkinningTopologyCorrectives"] = "blocked-pending-explicit-authorization-after-stage2"
    checklist["productionRigStages"]["stage8FinalAnimationProduction"] = "blocked"
    for milestone in checklist["milestones"]:
        if milestone["id"] == "skeleton":
            milestone["status"] = "stage2-production-skeleton-and-control-architecture-pass-unskinned"
        elif milestone["id"] == "joint-deformation":
            milestone["status"] = "blocked-stage3-not-authorized"
        elif milestone["id"] == "facial-topology":
            milestone["status"] = "control-interface-complete-final-shape-and-deformation-stage3"
        elif milestone["id"] == "hand-topology":
            milestone["status"] = "compact-control-interface-complete-final-deformation-stage3"
        elif milestone["id"] == "clothing-integration":
            milestone["status"] = "accessory-control-policy-complete-final-deformation-stage3"
    write(checklist_path, checklist)

    manifest_path = ROOT / "assets/blender/character-production-manifest.json"
    manifest = read(manifest_path)
    manifest["schemaVersion"] = 8
    manifest["status"] = "locked-original-meshy-rigs-active-as-interim-stage-2-production-rigs-pass-unskinned-stage-3-blocked"
    rig_first = manifest["rigFirstProduction"]
    rig_first["stageReport"] = "../../data/production-character-rig-stage-2.json"
    rig_first["semanticMapPlan"] = "../../data/production-character-rig-semantic-map.json"
    rig_first["HargoldStage2Inventory"] = "production/hargold_stage-2-rig-inventory.json"
    rig_first["MebbleStage2Inventory"] = "production/mebble_stage-2-rig-inventory.json"
    rig_first["HargoldStage2PoseSheet"] = "../previews/rig-stage-2/hargold-control-pose-review.png"
    rig_first["MebbleStage2PoseSheet"] = "../previews/rig-stage-2/mebble-control-pose-review.png"
    rig_first["stage2Pass"] = True
    rig_first["stage3Started"] = False
    rig_first["stage3Authorized"] = False
    rig_first["runtimeSwitchAuthorized"] = False
    rig_first["finalAnimationAllowed"] = False
    write(manifest_path, manifest)
    print(json.dumps({"status": "stage2-registries-written", "semanticMapVersion": 2, "heroes": {hero: inventories[hero]["armature"]["counts"] for hero in inventories}}))


if __name__ == "__main__":
    main()
