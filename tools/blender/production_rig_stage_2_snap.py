"""Pose-preserving IK/FK snapping helpers for the Stage 2 production rigs.

Run inside Blender.  The functions are importable by validation and future
authoring tools; the CLI is intentionally non-saving unless ``--save`` is used.
"""

from __future__ import annotations

import argparse
import json
import sys

import bpy
from mathutils import Vector


def _suffix(side: str) -> str:
    side = side.upper()
    if side not in {"L", "R"}:
        raise ValueError("side must be L or R")
    return f".{side}"


def _set_pose_matrix(rig, bone_name: str, matrix) -> None:
    rig.pose.bones[bone_name].matrix = matrix.copy()
    rig.update_tag(refresh={"DATA"})
    bpy.context.view_layer.update()


def snap_arm(rig, side: str, destination: str) -> dict:
    side = side.upper()
    suffix = _suffix(side)
    destination = destination.upper()
    before = rig.pose.bones[f"DEF_hand{suffix}"].matrix.copy()
    if destination == "IK":
        _set_pose_matrix(rig, f"CTRL_hand_ik{suffix}", before)
        elbow = rig.pose.bones[f"DEF_forearm{suffix}"].head.copy()
        shoulder = rig.pose.bones[f"DEF_upper_arm{suffix}"].head.copy()
        wrist = rig.pose.bones[f"DEF_forearm{suffix}"].tail.copy()
        pole = elbow + (elbow - (shoulder + wrist) * 0.5).normalized() * max((wrist - shoulder).length * 0.55, 0.08)
        pole_bone = rig.pose.bones[f"CTRL_elbow_pole{suffix}"]
        pole_bone.location += pole - pole_bone.head
        rig[f"arm_ik_fk_{side}"] = 1.0
    elif destination == "FK":
        for segment in ("upper_arm", "forearm", "hand"):
            _set_pose_matrix(rig, f"CTRL_fk_{segment}{suffix}", rig.pose.bones[f"DEF_{segment}{suffix}"].matrix)
        rig[f"arm_ik_fk_{side}"] = 0.0
    else:
        raise ValueError("destination must be IK or FK")
    rig.update_tag(refresh={"DATA"})
    bpy.context.view_layer.update()
    error = (rig.pose.bones[f"DEF_hand{suffix}"].matrix.translation - before.translation).length
    return {"limb": "arm", "side": side, "destination": destination, "endEffectorErrorMetres": error}


def snap_leg(rig, side: str, destination: str) -> dict:
    side = side.upper()
    suffix = _suffix(side)
    destination = destination.upper()
    before = rig.pose.bones[f"DEF_foot{suffix}"].matrix.copy()
    if destination == "IK":
        _set_pose_matrix(rig, f"CTRL_foot_ik{suffix}", before)
        knee = rig.pose.bones[f"DEF_shin{suffix}"].head.copy()
        hip = rig.pose.bones[f"DEF_thigh{suffix}"].head.copy()
        ankle = rig.pose.bones[f"DEF_shin{suffix}"].tail.copy()
        pole = knee + (knee - (hip + ankle) * 0.5).normalized() * max((ankle - hip).length * 0.55, 0.08)
        pole_bone = rig.pose.bones[f"CTRL_knee_pole{suffix}"]
        pole_bone.location += pole - pole_bone.head
        rig[f"leg_ik_fk_{side}"] = 1.0
        rig.update_tag(refresh={"DATA"})
        bpy.context.view_layer.update()
        # The foot-roll hierarchy has deliberate heel/ball/toe rest offsets.
        # Compensate the placement control so switching preserves the evaluated
        # foot position instead of snapping to the helper chain's rest offset.
        for _ in range(4):
            current = rig.pose.bones[f"DEF_foot{suffix}"].matrix.translation
            correction = before.translation - current
            if correction.length <= 0.00001:
                break
            control = rig.pose.bones[f"CTRL_foot_ik{suffix}"]
            corrected = control.matrix.copy()
            corrected.translation += correction
            _set_pose_matrix(rig, f"CTRL_foot_ik{suffix}", corrected)
    elif destination == "FK":
        for segment in ("thigh", "shin", "foot", "toe"):
            _set_pose_matrix(rig, f"CTRL_fk_{segment}{suffix}", rig.pose.bones[f"DEF_{segment}{suffix}"].matrix)
        rig[f"leg_ik_fk_{side}"] = 0.0
    else:
        raise ValueError("destination must be IK or FK")
    rig.update_tag(refresh={"DATA"})
    bpy.context.view_layer.update()
    error = (rig.pose.bones[f"DEF_foot{suffix}"].matrix.translation - before.translation).length
    return {"limb": "leg", "side": side, "destination": destination, "endEffectorErrorMetres": error}


def arguments() -> argparse.Namespace:
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--limb", choices=("arm", "leg"), required=True)
    parser.add_argument("--side", choices=("L", "R"), required=True)
    parser.add_argument("--destination", choices=("IK", "FK"), required=True)
    parser.add_argument("--save", action="store_true")
    return parser.parse_args(argv)


def main() -> None:
    args = arguments()
    rig = next((obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE" and "PRODUCTION_RIG_STAGE_2" in obj.name), None)
    if rig is None:
        raise RuntimeError("open a Stage 2 production rig source first")
    result = snap_arm(rig, args.side, args.destination) if args.limb == "arm" else snap_leg(rig, args.side, args.destination)
    if args.save:
        bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath, relative_remap=True)
    print("CODEX_STAGE_2_SNAP=" + json.dumps(result))


if __name__ == "__main__":
    main()
