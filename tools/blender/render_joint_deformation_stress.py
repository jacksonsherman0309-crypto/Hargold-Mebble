"""Render neutral/stress close-ups for the active joint-deformation gate.

The stress poses are diagnostic only. They are deliberately more severe than
normal gameplay poses and are not animation-polish work or exported actions.
"""

from __future__ import annotations

import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "assets" / "previews" / "joint-deformation"

STRESS_POSES = {
    "shoulders": {
        "DEF_clavicle.L": (0.0, 0.0, -0.28),
        "DEF_upper_arm.L": (-1.92, 0.78, 0.18),
        "DEF_forearm.L": (-0.58, 0.0, 0.0),
    },
    "elbows": {
        "DEF_upper_arm.L": (-0.92, 0.18, 0.0),
        "DEF_forearm.L": (-2.20, 0.0, 0.0),
        "DEF_hand.L": (-0.18, 0.0, 0.0),
    },
    "hips": {
        "DEF_hips": (0.0, 0.0, 0.52),
        "DEF_thigh.L": (1.36, 0.0, 0.16),
        "DEF_thigh.R": (-0.42, 0.0, -0.08),
    },
    "knees": {
        "DEF_hips": (0.0, 0.0, 0.20),
        # Keep the knee below the torso while applying the diagnostic flex.
        # Raising the thigh to horizontal places a compact hero's knee inside
        # the belly and tests self-intersection instead of knee deformation.
        "DEF_thigh.L": (-0.24, 0.0, 0.0),
        "DEF_shin.L": (-2.12, 0.0, 0.0),
        "DEF_foot.L": (0.42, 0.0, 0.0),
    },
    "ankles": {
        # A shallow leg bend isolates the ankle/boot transition; the foot
        # carries the severe angle instead of folding the whole leg upward.
        "DEF_thigh.L": (-0.12, 0.0, 0.0),
        "DEF_shin.L": (-0.42, 0.0, 0.0),
        "DEF_foot.L": (1.10, 0.0, 0.0),
        "DEF_toe.L": (-0.46, 0.0, 0.0),
    },
}

FOCUS_BONES = {
    "shoulders": "DEF_upper_arm.L",
    "elbows": "DEF_forearm.L",
    "hips": "DEF_thigh.L",
    "knees": "DEF_shin.L",
    "ankles": "DEF_foot.L",
}

ORTHO_HEIGHT_FRACTIONS = {
    "shoulders": 0.50,
    "elbows": 0.42,
    "hips": 0.48,
    "knees": 0.85,
    "ankles": 0.65,
}

# Lower-body close-ups need a diagnostic clearance pose. In the neutral rig,
# the stylized hands hang beside the knees and can completely cover an
# orthographic knee or ankle crop; the opposite boot can do the same after an
# extreme bend. These rotations move only non-target limbs out of the camera
# ray and are applied to both the neutral-joint and stressed-joint frames.
LOWER_BODY_CLEARANCE = {
    "DEF_upper_arm.L": (-2.05, 0.34, 0.0),
    "DEF_forearm.L": (-0.42, 0.0, 0.0),
    "DEF_upper_arm.R": (-2.05, -0.34, 0.0),
    "DEF_forearm.R": (-0.42, 0.0, 0.0),
    "DEF_thigh.R": (-0.36, 0.0, -0.08),
    "DEF_shin.R": (-0.42, 0.0, 0.0),
}


def reset_pose(armature):
    armature.animation_data_create()
    armature.animation_data.action = None
    armature.location = (0.0, 0.0, 0.0)
    armature.rotation_euler = (0.0, 0.0, 0.0)
    armature.scale = (1.0, 1.0, 1.0)
    for pose_bone in armature.pose.bones:
        pose_bone.matrix_basis = Matrix.Identity(4)
    for side in ("L", "R"):
        hand_control = armature.pose.bones.get(f"CTRL_hand_ik.{side}")
        foot_control = armature.pose.bones.get(f"CTRL_foot_ik.{side}")
        if hand_control and "ik_fk" in hand_control:
            hand_control["ik_fk"] = 0.0
        if foot_control and "ik_fk" in foot_control:
            foot_control["ik_fk"] = 0.0
    face = armature.pose.bones.get("CTRL_face")
    if face:
        for prop in (
            "blink_L", "blink_R", "smile", "mouth_open",
            "brow_raise_L", "brow_raise_R",
        ):
            if prop in face:
                face[prop] = 0.0
    cape = armature.pose.bones.get("CTRL_cape.01")
    if cape and "cape_open" in cape:
        cape["cape_open"] = 0.0
    bpy.context.scene.frame_set(0)
    bpy.context.view_layer.update()


def apply_stress_pose(armature, zone):
    for bone_name, rotation in STRESS_POSES[zone].items():
        pose_bone = armature.pose.bones.get(bone_name)
        if pose_bone is None:
            continue
        pose_bone.rotation_mode = "XYZ"
        pose_bone.rotation_euler = rotation
    bpy.context.view_layer.update()


def apply_clearance_pose(armature, zone):
    if zone not in {"knees", "ankles"}:
        return
    for bone_name, rotation in LOWER_BODY_CLEARANCE.items():
        pose_bone = armature.pose.bones.get(bone_name)
        if pose_bone is None:
            continue
        pose_bone.rotation_mode = "XYZ"
        pose_bone.rotation_euler = rotation
    bpy.context.view_layer.update()


def frame_joint(camera, armature, hero_height, zone):
    # Establish one camera from the neutral diagnostic pose. The paired stress
    # render must retain this exact camera; otherwise a moving joint can
    # re-center the crop onto a torso, hand, or accessory and invalidate the
    # A/B comparison.
    joint = armature.pose.bones[FOCUS_BONES[zone]]
    target = armature.matrix_world @ Vector(joint.head)
    if zone == "knees":
        target.z -= hero_height * 0.08
    elif zone == "ankles":
        target.z -= hero_height * 0.04
    # Look from the true-side direction with a small forward reveal so the
    # near shoulder/hip volume and garment thickness remain visible.
    distance = hero_height * 3.2
    if zone in {"knees", "ankles"}:
        # The compact torso and oversized platforming hands overlap the knee
        # in strict profile. A controlled three-quarter diagnostic view keeps
        # the joint silhouette visible while still showing front/back volume.
        camera.location = target + Vector(
            (-distance * 0.35, -distance, 0.03)
        )
    else:
        camera.location = target + Vector((-distance, -distance * 0.22, 0.03))
    camera.rotation_euler = (
        target - camera.location
    ).to_track_quat("-Z", "Y").to_euler()
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = hero_height * ORTHO_HEIGHT_FRACTIONS[zone]


def main():
    source = Path(bpy.data.filepath)
    hero = source.stem.removesuffix("_character").capitalize()
    armature = bpy.data.objects[f"RIG_{hero.upper()}"]
    hero_height = float(armature.get("target_height_metres"))
    scene = bpy.context.scene
    disable_correctives = "--disable-correctives" in sys.argv
    disable_pose_correctives = "--disable-pose-correctives" in sys.argv
    if disable_correctives:
        for obj in bpy.data.objects:
            for modifier in obj.modifiers:
                if modifier.type == "CORRECTIVE_SMOOTH":
                    modifier.show_render = False
    if disable_pose_correctives:
        for obj in bpy.data.objects:
            shape_keys = getattr(obj.data, "shape_keys", None)
            if shape_keys is None:
                continue
            if shape_keys.animation_data:
                for driver in shape_keys.animation_data.drivers:
                    driver.mute = True
            for key_block in shape_keys.key_blocks:
                if key_block.name.startswith("CORR_"):
                    key_block.value = 0.0
    output_variant = (
        "-no-pose-correctives"
        if disable_pose_correctives
        else "-raw" if disable_correctives
        else ""
    )
    requested_zones = [
        argument.split("=", 1)[1]
        for argument in sys.argv
        if argument.startswith("--zone=")
    ]
    zones = requested_zones or list(STRESS_POSES)
    unknown_zones = sorted(set(zones) - set(STRESS_POSES))
    if unknown_zones:
        raise RuntimeError("unknown joint stress zones: " + ", ".join(unknown_zones))
    camera = bpy.data.objects.get("QA_Camera")
    if camera is None:
        raise RuntimeError("active production source has no QA_Camera")
    OUTPUT.mkdir(parents=True, exist_ok=True)

    for obj in bpy.data.objects:
        if obj.get("review_only"):
            obj.hide_render = True
    scene.camera = camera
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 560
    scene.render.resolution_y = 560
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False

    ground = bpy.data.objects.get("QA_Ground")
    for zone in zones:
        # Boots are separate deforming production meshes. Both are removed
        # from a knee-only crop so the pant/knee surface cannot be hidden by a
        # folded toe. For the ankle crop, retain the target L boot and hide the
        # opposite R boot, which otherwise sits in the same orthographic ray.
        for side in ("L", "R"):
            boot = bpy.data.objects.get(f"GEO_{hero}_boot_{side}")
            if boot:
                boot.hide_render = (
                    zone == "knees"
                    or (zone == "ankles" and side == "R")
                )
        if ground:
            ground.hide_render = zone != "ankles"
        reset_pose(armature)
        apply_clearance_pose(armature, zone)
        frame_joint(camera, armature, hero_height, zone)
        for state in ("neutral", "stress"):
            reset_pose(armature)
            apply_clearance_pose(armature, zone)
            if state == "stress":
                apply_stress_pose(armature, zone)
            scene.render.filepath = str(
                OUTPUT / f"{hero.lower()}-{zone}-{state}{output_variant}.png"
            )
            bpy.ops.render.render(write_still=True)
    reset_pose(armature)
    print(
        f"HM_JOINT_STRESS_RENDERS {hero} "
        f"{len(zones) * 2} {OUTPUT}"
    )


if __name__ == "__main__":
    main()
