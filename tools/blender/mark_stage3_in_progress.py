"""Record the reviewed Stage 3 diagnostic result without rerendering evidence."""

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
    blend = ROOT / f"assets/blender/production/{hero.lower()}_production_rig.blend"
    inventory_path = ROOT / f"assets/blender/production/{hero.lower()}_stage-3-deformation-inventory.json"
    scene = bpy.context.scene
    scene["asset_version"] = "0.4.0-stage-3-in-progress"
    scene["production_stage"] = "stage-3-deformation-diagnostic-manual-correction-required"
    scene["stage_3_started"] = True
    scene["stage_3_pass"] = False
    scene["stage_4_started"] = False
    scene["stage_5_started"] = False
    scene["stage_5_pose_gate_pass"] = False
    scene["skinning_started"] = True
    scene["skinning_complete"] = False
    scene["corrective_system_complete"] = False
    scene["candidate_export_allowed"] = False
    scene["runtime_switch_authorized"] = False
    scene["final_animation_blocked"] = True
    scene["unresolved_stage_3_issues"] = "disconnected layered surface islands require manual production weight painting and local topology cleanup"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend), relative_remap=True)
    inventory = json.loads(inventory_path.read_text(encoding="utf-8"))
    if "weightMigration" in inventory:
        inventory["skinning"] = inventory.pop("weightMigration")
    inventory["status"] = "stage-3-in-progress-visual-deformation-gate-failed"
    inventory["stage3Pass"] = False
    inventory["stage4Started"] = False
    inventory["stage5Started"] = False
    inventory["stage5Pass"] = False
    inventory["candidateExportAllowed"] = False
    inventory["runtimeSwitchAuthorized"] = False
    inventory["finalAnimationAllowed"] = False
    inventory["unresolvedStage3Issues"] = [
        "manual shoulder, armpit, torso, hip, and knee weight painting is required",
        "disconnected garment islands open visible holes under stress poses",
        "Stage 4, Stage 5, candidate export, runtime switch, and final animation remain blocked",
    ]
    inventory["sourceFile"]["sha256"] = stage1.sha256(blend)
    inventory["sourceFile"]["bytes"] = blend.stat().st_size
    inventory_path.write_text(json.dumps(inventory, indent=2) + "\n", encoding="utf-8")
    print("CODEX_STAGE_3_STATUS=" + json.dumps({"hero": hero, "stage3Pass": False, "status": inventory["status"]}))


if __name__ == "__main__":
    main()
