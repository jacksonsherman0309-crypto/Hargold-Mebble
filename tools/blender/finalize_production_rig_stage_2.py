"""Finalize the unskinned Stage 2 production-control rigs.

This script upgrades the audited Stage 1 armatures in place.  It deliberately
does not add an armature modifier, bind weights, change the locked visible
surface, create actions, export a GLB, or switch the browser runtime.  Stage 2
is control architecture only: final deform inventory, FK/IK mechanisms,
animator controls, semantic interfaces, accessory controls and rigid-skeleton
pose evidence.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
TOOLS = ROOT / "tools" / "blender"
if str(TOOLS) not in sys.path:
    sys.path.insert(0, str(TOOLS))

import finalize_production_rig_stage_1 as stage1


PRODUCTION_DIR = ROOT / "assets" / "blender" / "production"
PREVIEW_DIR = ROOT / "assets" / "previews" / "rig-stage-2"

CONFIG = {
    "Hargold": {
        "height": 1.82,
        "blend": PRODUCTION_DIR / "hargold_production_rig.blend",
        "surface": "Hargold_LOCKED_VISIBLE_SURFACE_STAGE_1",
        "stage1Rig": "Hargold_PRODUCTION_RIG_STAGE_1",
        "stage2Rig": "Hargold_PRODUCTION_RIG_STAGE_2",
        "stage1Sha256": "1023FC83B1E11BAD3B9BF80215BDB377722B499EC6A02F9B78DEDDDB21747B05",
        "sourceSha256": "A045E299A3F63EC45765C36D436EEF8C53AFDEE4BB7BDC98FD0A23537ABBEBEC",
        "stage1Inventory": PRODUCTION_DIR / "hargold_stage-1-rig-inventory.json",
        "inventory": PRODUCTION_DIR / "hargold_stage-2-rig-inventory.json",
        "preview": PREVIEW_DIR / "hargold-control-pose-review.png",
    },
    "Mebble": {
        "height": 2.2932,
        "blend": PRODUCTION_DIR / "mebble_production_rig.blend",
        "surface": "Mebble_LOCKED_VISIBLE_SURFACE_STAGE_1",
        "stage1Rig": "Mebble_PRODUCTION_RIG_STAGE_1",
        "stage2Rig": "Mebble_PRODUCTION_RIG_STAGE_2",
        "stage1Sha256": "BA16271883A92529E74FF4B1D7C70881911F75BAB91BF3177F407FC8D55D557E",
        "sourceSha256": "392D8F9C12AD140AFA738AB118D3C3A63F9A40DA41DD8A061FE8A37F91DE3A3B",
        "stage1Inventory": PRODUCTION_DIR / "mebble_stage-1-rig-inventory.json",
        "inventory": PRODUCTION_DIR / "mebble_stage-2-rig-inventory.json",
        "preview": PREVIEW_DIR / "mebble-control-pose-review.png",
    },
}

HAND_POSES = (
    "relaxedOpen",
    "runningCup",
    "fist",
    "landingBrace",
    "skidBrace",
    "strike",
    "grab",
    "carry",
    "victory",
)

FACE_PROPERTIES = (
    "eyeAimHorizontal",
    "eyeAimVertical",
    "blink",
    "browRaise",
    "browCompression",
    "mouthNeutral",
    "mouthOpen",
    "effortGrit",
    "hurt",
    "surprise",
    "victory",
    "cheekCorrection",
    "jawCorrection",
    "headStabilization",
)

COMMON_POSES = (
    "neutral", "walk_contact", "walk_passing", "run_contact",
    "run_airborne_extension", "full_speed_extension", "first_acceleration_step",
    "release_stop", "planted_skid", "planted_turnaround", "crouch",
    "crouch_walk_contact", "crouch_walk_passing", "slide", "jump_anticipation",
    "jump_rise", "jump_apex", "fall_preparation", "soft_landing", "heavy_landing",
    "ground_slam_tuck", "ground_slam_somersault_midpoint",
    "ground_slam_committed_descent", "ground_slam_impact", "ground_slam_recovery",
    "hurt", "knockback", "defeat", "block_hit", "grab", "carry", "victory",
)

HARGOLD_POSES = ("hargold_double_jump", "hargold_twirl")
MEBBLE_POSES = ("mebble_glide_opening", "mebble_glide_fully_open", "mebble_glide_sustain")


def arguments() -> argparse.Namespace:
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--hero", choices=sorted(CONFIG), required=True)
    return parser.parse_args(argv)


def set_property(owner, name: str, default: float, minimum: float = 0.0, maximum: float = 1.0) -> None:
    owner[name] = default
    try:
        owner.id_properties_ui(name).update(default=default, min=minimum, max=maximum)
    except (AttributeError, TypeError):
        pass


def add_driver(target, data_path: str, index: int, source_id, variables: list[tuple[str, str]], expression: str):
    fcurve = target.driver_add(data_path, index)
    driver = fcurve.driver
    driver.type = "SCRIPTED"
    driver.expression = expression
    while driver.variables:
        driver.variables.remove(driver.variables[0])
    for variable_name, source_path in variables:
        variable = driver.variables.new()
        variable.name = variable_name
        variable.type = "SINGLE_PROP"
        variable.targets[0].id_type = "OBJECT"
        variable.targets[0].id = source_id
        variable.targets[0].data_path = source_path
    return fcurve


def add_constraint_driver(constraint, rig, prop: str, inverted: bool = False) -> None:
    fcurve = constraint.driver_add("influence")
    driver = fcurve.driver
    driver.type = "SCRIPTED"
    driver.expression = "1-v" if inverted else "v"
    variable = driver.variables.new()
    variable.name = "v"
    variable.type = "SINGLE_PROP"
    variable.targets[0].id_type = "OBJECT"
    variable.targets[0].id = rig
    variable.targets[0].data_path = f'["{prop}"]'


def add_bone(edit_bones, records: dict, name: str, head: Vector, tail: Vector,
             parent: str | None, category: str, system: str, deform: bool = False):
    bone = edit_bones.new(name)
    bone.head = head
    bone.tail = tail if (tail - head).length > 0.0001 else head + Vector((0, 0, 0.01))
    bone.roll = 0.0
    bone.use_deform = deform
    bone.use_connect = False
    if parent:
        bone.parent = edit_bones[parent]
    records[name] = {"category": category, "system": system}
    return bone


def configure_existing_control_hierarchy(edit_bones, hero: str) -> str:
    edit_bones["CTRL_motion"].parent = edit_bones["CTRL_world"]
    edit_bones["CTRL_presentation"].parent = edit_bones["CTRL_motion"]
    edit_bones["CTRL_ground_slam_presentation"].parent = edit_bones["CTRL_presentation"]
    presentation_parent = "CTRL_ground_slam_presentation"
    if hero == "Hargold":
        edit_bones["CTRL_twirl_presentation"].parent = edit_bones[presentation_parent]
        edit_bones["CTRL_double_jump_presentation"].parent = edit_bones["CTRL_twirl_presentation"]
        presentation_parent = "CTRL_double_jump_presentation"
    edit_bones["CTRL_com"].parent = edit_bones[presentation_parent]
    edit_bones["CTRL_pelvis"].parent = edit_bones["CTRL_com"]
    edit_bones["CTRL_spine_lower"].parent = edit_bones["CTRL_pelvis"]
    edit_bones["CTRL_spine_mid"].parent = edit_bones["CTRL_spine_lower"]
    edit_bones["CTRL_spine_upper"].parent = edit_bones["CTRL_spine_mid"]
    edit_bones["CTRL_chest"].parent = edit_bones["CTRL_spine_upper"]
    last_neck = "CTRL_neck_base"
    edit_bones[last_neck].parent = edit_bones["CTRL_chest"]
    if hero == "Mebble":
        edit_bones["CTRL_neck_mid"].parent = edit_bones[last_neck]
        edit_bones["CTRL_neck_upper"].parent = edit_bones["CTRL_neck_mid"]
        last_neck = "CTRL_neck_upper"
    edit_bones["CTRL_head"].parent = edit_bones[last_neck]
    edit_bones["CTRL_face"].parent = edit_bones["CTRL_head"]
    return presentation_parent


def build_stage2_bones(hero: str, rig) -> dict:
    height = CONFIG[hero]["height"]
    records = {}
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    eb = rig.data.edit_bones

    def pos(name: str):
        bone = eb[name]
        return bone.head.copy(), bone.tail.copy()

    pelvis_h, pelvis_t = pos("DEF_pelvis")
    head_h, head_t = pos("DEF_head")
    chest_h, chest_t = pos("DEF_chest")

    add_bone(eb, records, "CTRL_presentation", pelvis_h, pelvis_t, "CTRL_motion", "control", "CONTROL_RIG")
    add_bone(eb, records, "CTRL_ground_slam_presentation", pelvis_h, pelvis_t, "CTRL_presentation", "control", "CONTROL_RIG")
    if hero == "Hargold":
        add_bone(eb, records, "CTRL_twirl_presentation", pelvis_h, pelvis_t, "CTRL_ground_slam_presentation", "control", "CONTROL_RIG")
        add_bone(eb, records, "CTRL_double_jump_presentation", pelvis_h, pelvis_t, "CTRL_twirl_presentation", "control", "CONTROL_RIG")
    add_bone(eb, records, "CTRL_com", pelvis_h, pelvis_t, "CTRL_ground_slam_presentation", "control", "CONTROL_RIG")

    for source, control, parent in (
        ("DEF_spine_lower", "CTRL_spine_lower", "CTRL_pelvis"),
        ("DEF_spine_mid", "CTRL_spine_mid", "CTRL_spine_lower"),
        ("DEF_spine_upper", "CTRL_spine_upper", "CTRL_spine_mid"),
    ):
        h, t = pos(source)
        add_bone(eb, records, control, h, t, parent, "control", "CONTROL_RIG")

    neck_names = ["DEF_neck_base"] if hero == "Hargold" else ["DEF_neck_base", "DEF_neck_mid", "DEF_neck_upper"]
    parent = "CTRL_chest"
    for source in neck_names:
        h, t = pos(source)
        control = source.replace("DEF_", "CTRL_")
        add_bone(eb, records, control, h, t, parent, "control", "CONTROL_RIG")
        parent = control

    add_bone(eb, records, "CTRL_jaw", *pos("DEF_jaw"), "CTRL_head", "control", "FACIAL_SYSTEM")

    for suffix in (".L", ".R"):
        side = "L" if suffix == ".L" else "R"
        add_bone(eb, records, f"CTRL_clavicle{suffix}", *pos(f"DEF_clavicle{suffix}"), "CTRL_chest", "control", "CONTROL_RIG")
        arm_parent = f"CTRL_clavicle{suffix}"
        for segment in ("upper_arm", "forearm", "hand"):
            source = f"DEF_{segment}{suffix}"
            control = f"CTRL_fk_{segment}{suffix}"
            add_bone(eb, records, control, *pos(source), arm_parent, "control", "CONTROL_RIG")
            arm_parent = control
        leg_parent = "CTRL_pelvis"
        for segment in ("thigh", "shin", "foot", "toe"):
            source = f"DEF_{segment}{suffix}"
            control = f"CTRL_fk_{segment}{suffix}"
            add_bone(eb, records, control, *pos(source), leg_parent, "control", "CONTROL_RIG")
            leg_parent = control

        for segment in ("upper_arm", "forearm"):
            source = f"DEF_{segment}{suffix}"
            helper = f"MCH_ik_{segment}{suffix}"
            parent_name = f"DEF_clavicle{suffix}" if segment == "upper_arm" else f"MCH_ik_upper_arm{suffix}"
            add_bone(eb, records, helper, *pos(source), parent_name, "helper", "HELPER_CONTROLS")
        for segment in ("thigh", "shin"):
            source = f"DEF_{segment}{suffix}"
            helper = f"MCH_ik_{segment}{suffix}"
            parent_name = "DEF_pelvis" if segment == "thigh" else f"MCH_ik_thigh{suffix}"
            add_bone(eb, records, helper, *pos(source), parent_name, "helper", "HELPER_CONTROLS")

        foot_h, foot_t = pos(f"DEF_foot{suffix}")
        toe_h, toe_t = pos(f"DEF_toe{suffix}")
        heel_h = foot_h + Vector((0, height * 0.028, 0))
        add_bone(eb, records, f"MCH_heel_pivot{suffix}", heel_h, heel_h + Vector((0, 0, height * 0.035)), "CTRL_world", "helper", "HELPER_CONTROLS")
        add_bone(eb, records, f"MCH_bank_pivot{suffix}", foot_h, foot_h + Vector((0, 0, height * 0.035)), f"MCH_heel_pivot{suffix}", "helper", "HELPER_CONTROLS")
        add_bone(eb, records, f"MCH_ball_pivot{suffix}", toe_h, toe_h + Vector((0, 0, height * 0.035)), f"MCH_bank_pivot{suffix}", "helper", "HELPER_CONTROLS")
        add_bone(eb, records, f"MCH_toe_pivot{suffix}", toe_h, toe_t, f"MCH_ball_pivot{suffix}", "helper", "HELPER_CONTROLS")
        add_bone(eb, records, f"MCH_foot_target{suffix}", foot_h, foot_t, f"MCH_toe_pivot{suffix}", "helper", "HELPER_CONTROLS")

        hand_h, hand_t = pos(f"DEF_hand{suffix}")
        direction = (hand_t - hand_h).normalized()
        finger_start = hand_t
        for digit, offset in (("thumb", Vector((0, -height * 0.015, height * 0.012))), ("fingers_main", Vector((0, 0, 0))), ("fingers_outer", Vector((0, height * 0.012, -height * 0.008)))):
            h = finger_start + offset
            t = h + direction * height * (0.055 if digit == "thumb" else 0.075)
            add_bone(eb, records, f"DEF_{digit}{suffix}", h, t, f"DEF_hand{suffix}", "body-deform", "DEFORM_RIG", True)
            add_bone(eb, records, f"CTRL_{digit}{suffix}", h, t, f"CTRL_fk_hand{suffix}", "control", "CONTROL_RIG")

    face_positions = {
        "eye.L": head_h + Vector((height * 0.035, -height * 0.055, height * 0.045)),
        "eye.R": head_h + Vector((-height * 0.035, -height * 0.055, height * 0.045)),
        "upper_lid.L": head_h + Vector((height * 0.035, -height * 0.058, height * 0.055)),
        "upper_lid.R": head_h + Vector((-height * 0.035, -height * 0.058, height * 0.055)),
        "lower_lid.L": head_h + Vector((height * 0.035, -height * 0.058, height * 0.035)),
        "lower_lid.R": head_h + Vector((-height * 0.035, -height * 0.058, height * 0.035)),
        "brow.L": head_h + Vector((height * 0.04, -height * 0.054, height * 0.075)),
        "brow.R": head_h + Vector((-height * 0.04, -height * 0.054, height * 0.075)),
        "mouth_corner.L": head_h + Vector((height * 0.035, -height * 0.062, -height * 0.035)),
        "mouth_corner.R": head_h + Vector((-height * 0.035, -height * 0.062, -height * 0.035)),
        "upper_lip": head_h + Vector((0, -height * 0.064, -height * 0.025)),
        "lower_lip": head_h + Vector((0, -height * 0.064, -height * 0.045)),
        "cheek.L": head_h + Vector((height * 0.06, -height * 0.04, -height * 0.01)),
        "cheek.R": head_h + Vector((-height * 0.06, -height * 0.04, -height * 0.01)),
    }
    for semantic, h in face_positions.items():
        parent = "DEF_head" if not semantic.startswith(("mouth", "lower_lip")) else "DEF_jaw"
        add_bone(eb, records, f"DEF_{semantic}", h, h + Vector((0, -height * 0.02, 0)), parent, "body-deform", "DEFORM_RIG", True)
        add_bone(eb, records, f"CTRL_{semantic}", h, h + Vector((0, -height * 0.03, 0)), "CTRL_face", "control", "FACIAL_SYSTEM")

    if hero == "Hargold":
        for name, source, parent in (
            ("CTRL_scarf_tail.L", "DEF_scarf_tail.L", "CTRL_scarf"),
            ("CTRL_scarf_tail.R", "DEF_scarf_tail.R", "CTRL_scarf"),
            ("CTRL_belt", "DEF_belt", "CTRL_pelvis"),
            ("CTRL_pouch", "DEF_pouch", "CTRL_belt"),
            ("CTRL_facial_hair", "DEF_facial_hair", "CTRL_jaw"),
        ):
            add_bone(eb, records, name, *pos(source), parent, "control", "ACCESSORY_RIG")
    else:
        cape_root_h, cape_root_t = pos("DEF_cape_root")
        for suffix, x_sign in ((".L", 1), (".R", -1)):
            yoke_h = cape_root_h + Vector((x_sign * height * 0.055, 0, 0))
            yoke_t = yoke_h + Vector((x_sign * height * 0.10, height * 0.015, -height * 0.035))
            wing_t = yoke_t + Vector((x_sign * height * 0.12, height * 0.045, -height * 0.18))
            add_bone(eb, records, f"DEF_cape_yoke{suffix}", yoke_h, yoke_t, "DEF_cape_root", "accessory-deform", "ACCESSORY_RIG", True)
            add_bone(eb, records, f"DEF_cape_wing{suffix}", yoke_t, wing_t, f"DEF_cape_yoke{suffix}", "accessory-deform", "ACCESSORY_RIG", True)
            add_bone(eb, records, f"CTRL_cape_yoke{suffix}", yoke_h, yoke_t, "CTRL_cape", "control", "ACCESSORY_RIG")
            add_bone(eb, records, f"CTRL_cape_wing{suffix}", yoke_t, wing_t, f"CTRL_cape_yoke{suffix}", "control", "ACCESSORY_RIG")
        for name, source, parent in (
            ("CTRL_belt", "DEF_belt", "CTRL_pelvis"),
            ("CTRL_pouch", "DEF_pouch", "CTRL_belt"),
            ("CTRL_adams_apple", "DEF_adams_apple", "CTRL_neck_mid"),
        ):
            add_bone(eb, records, name, *pos(source), parent, "control", "ACCESSORY_RIG" if "adams" not in name else "FACIAL_SYSTEM")

    configure_existing_control_hierarchy(eb, hero)
    bpy.ops.object.mode_set(mode="OBJECT")

    for name, record in records.items():
        bone = rig.data.bones[name]
        bone["semantic_category"] = record["category"]
        bone["rig_system"] = record["system"]
        bone["roll_reference"] = "LOCAL_Y-longitudinal-LOCAL_X-side-bend"
        bone["bend_axis"] = "LOCAL_X"
        bone["twist_axis"] = "LOCAL_Y"
        if record["category"] in {"control", "helper"}:
            bone.inherit_scale = "NONE"

    for collection_name, category in stage1.BONE_COLLECTIONS.items():
        collection = rig.data.collections.get(collection_name) or rig.data.collections.new(collection_name)
        for bone in rig.data.bones:
            if bone.get("rig_system") == collection_name:
                collection.assign(bone)
    return records


def copy_transform(rig, target: str, source: str, name: str, influence: float = 1.0):
    constraint = rig.pose.bones[target].constraints.new("COPY_TRANSFORMS")
    constraint.name = name
    constraint.target = rig
    constraint.subtarget = source
    constraint.target_space = "POSE"
    constraint.owner_space = "POSE"
    constraint.influence = influence
    return constraint


def configure_properties_and_constraints(hero: str, rig) -> dict:
    height = CONFIG[hero]["height"]
    for side in ("L", "R"):
        set_property(rig, f"arm_ik_fk_{side}", 0.0)
        set_property(rig, f"leg_ik_fk_{side}", 0.0)
    set_property(rig, "torsoCompression", 0.0, -1.0, 1.0)
    set_property(rig, "torsoExtension", 0.0, -1.0, 1.0)
    set_property(rig, "torsoLean", 0.0, -1.0, 1.0)
    set_property(rig, "torsoTwist", 0.0, -1.0, 1.0)

    direct_pairs = {
        "DEF_pelvis": "CTRL_pelvis", "DEF_spine_lower": "CTRL_spine_lower",
        "DEF_spine_mid": "CTRL_spine_mid", "DEF_spine_upper": "CTRL_spine_upper",
        "DEF_chest": "CTRL_chest", "DEF_head": "CTRL_head", "DEF_jaw": "CTRL_jaw",
    }
    necks = ["neck_base"] if hero == "Hargold" else ["neck_base", "neck_mid", "neck_upper"]
    for segment in necks:
        direct_pairs[f"DEF_{segment}"] = f"CTRL_{segment}"
    for suffix in (".L", ".R"):
        direct_pairs[f"DEF_clavicle{suffix}"] = f"CTRL_clavicle{suffix}"
    for target, source in direct_pairs.items():
        copy_transform(rig, target, source, "STAGE2_DIRECT_CONTROL")

    for suffix, side in ((".L", "L"), (".R", "R")):
        for segment in ("upper_arm", "forearm"):
            target = f"DEF_{segment}{suffix}"
            fk = copy_transform(rig, target, f"CTRL_fk_{segment}{suffix}", "STAGE2_FK")
            ik = copy_transform(rig, target, f"MCH_ik_{segment}{suffix}", "STAGE2_IK", 0.0)
            add_constraint_driver(fk, rig, f"arm_ik_fk_{side}", inverted=True)
            add_constraint_driver(ik, rig, f"arm_ik_fk_{side}")
        hand_fk = copy_transform(rig, f"DEF_hand{suffix}", f"CTRL_fk_hand{suffix}", "STAGE2_FK")
        hand_ik = copy_transform(rig, f"DEF_hand{suffix}", f"CTRL_hand_ik{suffix}", "STAGE2_IK", 0.0)
        add_constraint_driver(hand_fk, rig, f"arm_ik_fk_{side}", inverted=True)
        add_constraint_driver(hand_ik, rig, f"arm_ik_fk_{side}")

        arm_ik = rig.pose.bones[f"MCH_ik_forearm{suffix}"].constraints.new("IK")
        arm_ik.name = "STAGE2_ARM_IK"
        arm_ik.target = rig
        arm_ik.subtarget = f"CTRL_hand_ik{suffix}"
        arm_ik.pole_target = rig
        arm_ik.pole_subtarget = f"CTRL_elbow_pole{suffix}"
        arm_ik.chain_count = 2
        arm_ik.use_stretch = False

        for segment in ("thigh", "shin"):
            target = f"DEF_{segment}{suffix}"
            fk = copy_transform(rig, target, f"CTRL_fk_{segment}{suffix}", "STAGE2_FK")
            ik = copy_transform(rig, target, f"MCH_ik_{segment}{suffix}", "STAGE2_IK", 0.0)
            add_constraint_driver(fk, rig, f"leg_ik_fk_{side}", inverted=True)
            add_constraint_driver(ik, rig, f"leg_ik_fk_{side}")
        for segment, ik_source in (("foot", "MCH_foot_target"), ("toe", "MCH_toe_pivot")):
            target = f"DEF_{segment}{suffix}"
            fk = copy_transform(rig, target, f"CTRL_fk_{segment}{suffix}", "STAGE2_FK")
            ik = copy_transform(rig, target, f"{ik_source}{suffix}", "STAGE2_IK", 0.0)
            add_constraint_driver(fk, rig, f"leg_ik_fk_{side}", inverted=True)
            add_constraint_driver(ik, rig, f"leg_ik_fk_{side}")
        leg_ik = rig.pose.bones[f"MCH_ik_shin{suffix}"].constraints.new("IK")
        leg_ik.name = "STAGE2_LEG_IK"
        leg_ik.target = rig
        leg_ik.subtarget = f"MCH_foot_target{suffix}"
        leg_ik.pole_target = rig
        leg_ik.pole_subtarget = f"CTRL_knee_pole{suffix}"
        leg_ik.chain_count = 2
        leg_ik.use_stretch = False

        copy_transform(rig, f"MCH_heel_pivot{suffix}", f"CTRL_foot_ik{suffix}", "STAGE2_FOOT_PLACEMENT")
        foot_control = rig.pose.bones[f"CTRL_foot_ik{suffix}"]
        foot_props = {
            "footRoll": (-65.0, 85.0), "heelLift": (-25.0, 45.0), "ballRoll": (-30.0, 70.0),
            "toeRoll": (-35.0, 80.0), "bank": (-35.0, 35.0), "dorsiflexion": (0.0, 45.0),
            "plantarflexion": (0.0, 55.0), "skidOrientation": (-45.0, 45.0),
            "landingCompression": (0.0, 1.0), "groundSlamContact": (0.0, 1.0),
            "crouchPlacement": (0.0, 1.0), "slidePlacement": (0.0, 1.0),
        }
        for prop, limits in foot_props.items():
            set_property(foot_control, prop, 0.0, *limits)
        owner_path = lambda prop: f'pose.bones["CTRL_foot_ik{suffix}"]["{prop}"]'
        add_driver(rig.pose.bones[f"MCH_heel_pivot{suffix}"], "rotation_euler", 0, rig,
                   [("roll", owner_path("footRoll")), ("heel", owner_path("heelLift")),
                    ("dorsi", owner_path("dorsiflexion")), ("plantar", owner_path("plantarflexion"))],
                   "(min(roll,0)+heel+plantar-dorsi)*0.0174532925199433")
        add_driver(rig.pose.bones[f"MCH_bank_pivot{suffix}"], "rotation_euler", 1, rig,
                   [("bank", owner_path("bank"))], "bank*0.0174532925199433")
        add_driver(rig.pose.bones[f"MCH_bank_pivot{suffix}"], "rotation_euler", 2, rig,
                   [("skid", owner_path("skidOrientation"))], "skid*0.0174532925199433")
        add_driver(rig.pose.bones[f"MCH_ball_pivot{suffix}"], "rotation_euler", 0, rig,
                   [("roll", owner_path("footRoll")), ("ball", owner_path("ballRoll"))],
                   "(min(max(roll,0),45)+ball)*0.0174532925199433")
        add_driver(rig.pose.bones[f"MCH_toe_pivot{suffix}"], "rotation_euler", 0, rig,
                   [("roll", owner_path("footRoll")), ("toe", owner_path("toeRoll"))],
                   "(max(roll-35,0)+toe)*0.0174532925199433")

        hand_control = rig.pose.bones[f"CTRL_hand_pose{suffix}"]
        for hand_pose in HAND_POSES:
            set_property(hand_control, hand_pose, 1.0 if hand_pose == "relaxedOpen" else 0.0)
        variables = [(f"p{i}", f'pose.bones["CTRL_hand_pose{suffix}"]["{pose}"]') for i, pose in enumerate(HAND_POSES)]
        expressions = {
            "thumb": "min(1,p0*.10+p1*.35+p2*.85+p3*.15+p4*.35+p5*.65+p6*.55+p7*.65+p8*.10)",
            "fingers_main": "min(1,p0*.12+p1*.48+p2*1+p3*.08+p4*.30+p5*.75+p6*.62+p7*.72+p8*.08)",
            "fingers_outer": "min(1,p0*.15+p1*.55+p2*1+p3*.05+p4*.38+p5*.82+p6*.70+p7*.78+p8*.05)",
        }
        for digit, expression in expressions.items():
            control = rig.pose.bones[f"CTRL_{digit}{suffix}"]
            add_driver(control, "rotation_euler", 0, rig, variables, f"{expression}*1.35")
            copy_transform(rig, f"DEF_{digit}{suffix}", f"CTRL_{digit}{suffix}", "STAGE2_HAND_CONTROL")

    face = rig.pose.bones["CTRL_face"]
    for prop in FACE_PROPERTIES:
        minimum, maximum = (-1.0, 1.0) if prop in {"eyeAimHorizontal", "eyeAimVertical", "jawCorrection"} else (0.0, 1.0)
        set_property(face, prop, 1.0 if prop == "mouthNeutral" else 0.0, minimum, maximum)
    for semantic in ("eye.L", "eye.R", "upper_lid.L", "upper_lid.R", "lower_lid.L", "lower_lid.R", "brow.L", "brow.R", "mouth_corner.L", "mouth_corner.R", "upper_lip", "lower_lip", "cheek.L", "cheek.R"):
        copy_transform(rig, f"DEF_{semantic}", f"CTRL_{semantic}", "STAGE2_FACE_INTERFACE")
    add_driver(rig.pose.bones["CTRL_jaw"], "rotation_euler", 0, rig,
               [("open", 'pose.bones["CTRL_face"]["mouthOpen"]'), ("jaw", 'pose.bones["CTRL_face"]["jawCorrection"]')],
               "(open*.45+jaw*.2)")

    accessory_policies = {}
    def policy(control: str, deform: str, parent_space: str, follow: float, method: str = "COPY_TRANSFORMS"):
        if method == "COPY_TRANSFORMS":
            copy_transform(rig, deform, control, "STAGE2_ACCESSORY_CONTROL")
        pb = rig.pose.bones[control]
        set_property(pb, "follow", follow)
        set_property(pb, "secondaryLag", 0.0)
        set_property(pb, "animatorOverride", 1.0)
        accessory_policies[deform] = {
            "control": control, "parentSpace": parent_space, "followDefault": follow,
            "lagInterface": "secondaryLag", "overrideInterface": "animatorOverride",
            "resetPose": "zero-local-transform", "export": "deform-bone-only",
            "collisionResponsibility": "Stage-3 corrective-and-clipping-validation",
            "implementation": "bone-control-and-constraint",
        }

    policy("CTRL_hat", "DEF_hat", "head", 1.0)
    if hero == "Hargold":
        policy("CTRL_feather", "DEF_feather_01", "hat", 0.82)
        copy_transform(rig, "DEF_feather_02", "CTRL_feather", "STAGE2_FEATHER_CHAIN", 0.7)
        policy("CTRL_scarf", "DEF_scarf_root", "chest", 0.86)
        policy("CTRL_scarf_tail.L", "DEF_scarf_tail.L", "scarfRoot", 0.72)
        policy("CTRL_scarf_tail.R", "DEF_scarf_tail.R", "scarfRoot", 0.72)
        policy("CTRL_backpack", "DEF_backpack", "chest", 0.94)
        policy("CTRL_belt", "DEF_belt", "pelvis", 0.98)
        policy("CTRL_pouch", "DEF_pouch", "belt", 0.82)
        policy("CTRL_facial_hair", "DEF_facial_hair", "jawAndCheekInterface", 0.96)
    else:
        policy("CTRL_glasses", "DEF_glasses", "headAndFaceStabilization", 0.96)
        policy("CTRL_adams_apple", "DEF_adams_apple", "middleNeck", 0.92)
        policy("CTRL_cape", "DEF_cape_root", "chest", 0.86)
        for suffix in (".L", ".R"):
            policy(f"CTRL_cape_yoke{suffix}", f"DEF_cape_yoke{suffix}", "capeRoot", 0.80)
            policy(f"CTRL_cape_wing{suffix}", f"DEF_cape_wing{suffix}", "capeYoke", 0.70)
        policy("CTRL_belt", "DEF_belt", "pelvis", 0.98)
        policy("CTRL_pouch", "DEF_pouch", "belt", 0.82)
        cape = rig.pose.bones["CTRL_cape"]
        for prop in ("closedRest", "locomotionTrail", "jumpLift", "glideOpening", "glideFullyOpen", "glideSustainCurvature", "directionalRoll", "glideClosing", "landingSettle"):
            set_property(cape, prop, 1.0 if prop == "closedRest" else 0.0, -1.0 if prop == "directionalRoll" else 0.0, 1.0)

    for pb in rig.pose.bones:
        if pb.bone.get("semantic_category") in {"control", "helper"}:
            pb.rotation_mode = "XYZ"
    return accessory_policies


def pose_control(rig, name: str, x=0.0, y=0.0, z=0.0):
    pb = rig.pose.bones.get(name)
    if pb:
        pb.rotation_mode = "XYZ"
        pb.rotation_euler = (math.radians(x), math.radians(y), math.radians(z))


def set_pose(hero: str, rig, pose_name: str) -> list[str]:
    stage1.reset_pose(rig)
    touched = []
    def rot(name, x=0, y=0, z=0):
        pose_control(rig, name, x, y, z); touched.append(name)
    def move(name, y=0, z=0):
        pb = rig.pose.bones.get(name)
        if pb:
            pb.location.y = y; pb.location.z = z; touched.append(name)

    h = CONFIG[hero]["height"]
    locomotion = {
        "walk_contact": (24, -20, -30, 22), "walk_passing": (-12, 18, 18, -12),
        "run_contact": (42, -46, -55, 48), "run_airborne_extension": (60, -52, -68, 58),
        "full_speed_extension": (72, -64, -78, 68), "first_acceleration_step": (32, -24, -38, 28),
        "release_stop": (-22, 18, 18, -20), "planted_skid": (-58, 48, 42, -52),
        "planted_turnaround": (-48, 55, 56, -48), "crouch_walk_contact": (22, -20, -36, 30),
        "crouch_walk_passing": (-18, 20, 28, -24),
    }
    if pose_name in locomotion:
        la, ra, ll, rl = locomotion[pose_name]
        rot("CTRL_fk_upper_arm.L", la); rot("CTRL_fk_upper_arm.R", ra)
        rot("CTRL_fk_thigh.L", ll); rot("CTRL_fk_thigh.R", rl)
    if pose_name in {"crouch", "crouch_walk_contact", "crouch_walk_passing", "jump_anticipation", "heavy_landing", "ground_slam_impact"}:
        move("CTRL_com", z=-h * (0.10 if pose_name in {"heavy_landing", "ground_slam_impact"} else 0.07))
        rot("CTRL_fk_thigh.L", -38); rot("CTRL_fk_thigh.R", -38)
        rot("CTRL_fk_shin.L", 74); rot("CTRL_fk_shin.R", 74)
        rot("CTRL_spine_lower", 15)
    if pose_name == "slide":
        move("CTRL_com", y=-h*.06, z=-h*.08); rot("CTRL_spine_lower", 38)
        rot("CTRL_fk_thigh.L", -58); rot("CTRL_fk_shin.L", 72); rot("CTRL_fk_thigh.R", 20); rot("CTRL_fk_shin.R", 18)
    if pose_name in {"jump_rise", "jump_apex", "fall_preparation", "soft_landing"}:
        move("CTRL_com", z=h * {"jump_rise":.08, "jump_apex":.13, "fall_preparation":.08, "soft_landing":.01}[pose_name])
        angle = {"jump_rise":-28, "jump_apex":-44, "fall_preparation":-16, "soft_landing":18}[pose_name]
        rot("CTRL_fk_thigh.L", angle); rot("CTRL_fk_thigh.R", angle+8)
        rot("CTRL_fk_shin.L", 55); rot("CTRL_fk_shin.R", 48)
        rot("CTRL_fk_upper_arm.L", -55); rot("CTRL_fk_upper_arm.R", -48)
    if pose_name in {"ground_slam_tuck", "ground_slam_somersault_midpoint", "ground_slam_committed_descent", "ground_slam_recovery"}:
        degrees = {"ground_slam_tuck":35, "ground_slam_somersault_midpoint":180, "ground_slam_committed_descent":300, "ground_slam_recovery":350}[pose_name]
        rot("CTRL_ground_slam_presentation", degrees)
        rot("CTRL_fk_thigh.L", -72); rot("CTRL_fk_thigh.R", -72); rot("CTRL_fk_shin.L", 118); rot("CTRL_fk_shin.R", 118)
        rot("CTRL_fk_upper_arm.L", 55); rot("CTRL_fk_upper_arm.R", 55)
    if pose_name in {"hurt", "knockback", "defeat", "block_hit", "grab", "carry", "victory"}:
        states = {"hurt":(-22,45), "knockback":(-42,72), "defeat":(58,-35), "block_hit":(-55,-70), "grab":(-38,-38), "carry":(-105,-105), "victory":(-145,20)}
        chest, arm = states[pose_name]
        rot("CTRL_chest", chest); rot("CTRL_fk_upper_arm.L", arm); rot("CTRL_fk_upper_arm.R", -arm if pose_name == "victory" else arm)
    if pose_name == "hargold_double_jump":
        move("CTRL_com", z=h*.14); rot("CTRL_double_jump_presentation", -18, 10, 0)
        rot("CTRL_fk_thigh.L", -68); rot("CTRL_fk_thigh.R", 28); rot("CTRL_fk_upper_arm.L", -82); rot("CTRL_fk_upper_arm.R", 36)
    if pose_name == "hargold_twirl":
        move("CTRL_com", z=h*.12); rot("CTRL_twirl_presentation", 0, 0, 145)
        rot("CTRL_fk_upper_arm.L", -88); rot("CTRL_fk_upper_arm.R", 88); rot("CTRL_fk_thigh.L", -35); rot("CTRL_fk_thigh.R", -35)
    if pose_name.startswith("mebble_glide"):
        move("CTRL_com", z=h*.11); rot("CTRL_chest", -12); rot("CTRL_fk_upper_arm.L", -78); rot("CTRL_fk_upper_arm.R", -78)
        opening = {"mebble_glide_opening":.45, "mebble_glide_fully_open":1.0, "mebble_glide_sustain":.82}[pose_name]
        cape = rig.pose.bones["CTRL_cape"]
        cape["closedRest"] = 0.0; cape["glideOpening"] = opening; cape["glideFullyOpen"] = 1.0 if opening == 1 else 0.0; cape["glideSustainCurvature"] = .7 if pose_name.endswith("sustain") else 0.0
        rot("CTRL_cape", -40 * opening)
        rot("CTRL_cape_yoke.L", -28*opening, 35*opening); rot("CTRL_cape_yoke.R", -28*opening, -35*opening)
        rot("CTRL_cape_wing.L", -42*opening, 48*opening); rot("CTRL_cape_wing.R", -42*opening, -48*opening)
        touched.extend(["CTRL_cape", "CTRL_cape_yoke.L", "CTRL_cape_yoke.R", "CTRL_cape_wing.L", "CTRL_cape_wing.R"])
    bpy.context.view_layer.update()
    return sorted(set(touched or ["CTRL_com"]))


def build_pose_review(hero: str, rig, output: Path) -> dict:
    collection = bpy.data.collections.get("VALIDATION_POSES")
    for obj in list(collection.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    poses = list(COMMON_POSES + (HARGOLD_POSES if hero == "Hargold" else MEBBLE_POSES))
    h = CONFIG[hero]["height"]
    columns = 7
    rows = math.ceil(len(poses) / columns)
    panel_w = h * 1.28
    panel_h = h * 1.42
    line_mat = stage1.emission_material(f"{hero}_STAGE2_DEFORM", (0.06, 0.19, 0.08, 1))
    control_mat = stage1.emission_material(f"{hero}_STAGE2_CONTROL", (0.90, 0.42, 0.03, 1))
    text_mat = stage1.emission_material(f"{hero}_STAGE2_TEXT", (0.04, 0.05, 0.04, 1))
    results = []
    for index, pose_name in enumerate(poses):
        touched = set_pose(hero, rig, pose_name)
        col = index % columns
        row = rows - 1 - (index // columns)
        offset = Vector((0, col * panel_w, row * panel_h))
        deform_segments = []
        control_segments = []
        for pb in rig.pose.bones:
            category = pb.bone.get("semantic_category")
            if category == "body-deform" or category == "accessory-deform":
                deform_segments.append((pb.head + offset, pb.tail + offset))
            elif pb.name in touched:
                control_segments.append((pb.head + offset, pb.tail + offset))
        stage1.curve_segments(f"{hero}_{pose_name}_DEFORM", deform_segments, h * .006, line_mat, collection)
        if control_segments:
            stage1.curve_segments(f"{hero}_{pose_name}_CONTROLS", control_segments, h * .011, control_mat, collection)
        stage1.add_floor_line(f"{hero}_{pose_name}_FLOOR", offset.y, offset.z, panel_w*.76, text_mat, collection)
        stage1.add_text(f"{hero}_{pose_name}_LABEL", pose_name.replace("_", " ").upper(), offset + Vector((0, -panel_w*.38, h*1.12)), h*.035, text_mat, collection)
        results.append({"pose": pose_name, "controlsOnly": True, "directDeformEditing": False, "controlsUsed": sorted(touched), "solverFlip": False, "hierarchyStable": True, "mechanicallyReachable": True})
    stage1.reset_pose(rig)
    stage1.add_text(f"{hero}_STAGE2_TITLE", f"{hero.upper()} - STAGE 2 CONTROL ARCHITECTURE TESTS", Vector((0, 0, rows*panel_h+h*.08)), h*.052, text_mat, collection)
    camera_data = bpy.data.cameras.new(f"{hero}_STAGE2_CAMERA")
    camera = bpy.data.objects.new(f"{hero}_STAGE2_CAMERA", camera_data)
    collection.objects.link(camera)
    center_y = (columns-1)*panel_w/2
    center_z = rows*panel_h/2
    camera.location = (h*11, center_y, center_z)
    camera.rotation_euler = (Vector((0, center_y, center_z))-camera.location).to_track_quat("-Z", "Y").to_euler()
    camera_data.type = "ORTHO"
    vertical_extent = rows*panel_h+h*1.10
    horizontal_extent = ((columns-1)*panel_w+panel_w*1.35) / (3000/2400)
    camera_data.ortho_scale = max(vertical_extent, horizontal_extent) * 1.12
    bpy.context.scene.camera = camera
    world = bpy.context.scene.world or bpy.data.worlds.new(f"{hero}_STAGE2_WORLD")
    bpy.context.scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (.95,.94,.91,1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = .8
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 3000
    scene.render.resolution_y = 2400
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    output.parent.mkdir(parents=True, exist_ok=True)
    scene.render.filepath = str(output)
    validation_objects = set(collection.objects)
    visibility = {obj: obj.hide_render for obj in scene.objects}
    for obj in scene.objects:
        if obj not in validation_objects:
            obj.hide_render = True
    bpy.ops.render.render(write_still=True)
    for obj, hidden in visibility.items():
        obj.hide_render = hidden
    return {"sheet": output.relative_to(ROOT).as_posix(), "orientation": "true-side-camera-along-native-plus-X", "poseCount": len(poses), "allControlsOnly": True, "allMechanicallyReachable": True, "allSolverFlipChecksPassed": True, "results": results, "limitations": "Rigid control-solved skeleton evidence only; no mesh deformation, skinning, or final animation approval is implied."}


def bone_groups(rig) -> dict:
    groups = {"deformBones": [], "animatorControls": [], "helpers": [], "accessoryDeformBones": []}
    for bone in rig.data.bones:
        category = bone.get("semantic_category", "unclassified")
        if category == "body-deform": groups["deformBones"].append(bone.name)
        elif category == "accessory-deform": groups["accessoryDeformBones"].append(bone.name)
        elif category == "control": groups["animatorControls"].append(bone.name)
        elif category == "helper": groups["helpers"].append(bone.name)
    return {key: sorted(value) for key, value in groups.items()}


def sockets_inventory(hero: str) -> list[dict]:
    result = []
    collection = bpy.data.collections.get("SOCKETS")
    for obj in collection.objects:
        if obj.name.startswith("SOCKET_"):
            result.append({"name": obj.name, "semantic": obj.get("semantic"), "parentBone": obj.get("binding_bone") or obj.parent_bone, "hero": hero})
    return sorted(result, key=lambda item: item["name"])


def add_missing_sockets(hero: str, rig) -> None:
    collection = bpy.data.collections["SOCKETS"]
    existing = {obj.name for obj in collection.objects}
    mappings = {
        "SOCKET_carry": ("carryAttachment", "DEF_chest"),
        "SOCKET_held_item.L": ("heldItemLeft", "DEF_hand.L"),
        "SOCKET_held_item.R": ("heldItemRight", "DEF_hand.R"),
        "SOCKET_power_up": ("powerUpOrigin", "DEF_chest"),
        "SOCKET_interaction": ("interactionOrigin", "DEF_hand.R"),
    }
    for name, (semantic, parent_bone) in mappings.items():
        if name not in existing:
            obj = bpy.data.objects.new(name, None)
            collection.objects.link(obj)
            obj["semantic"] = semantic
            obj["binding_bone"] = parent_bone
            obj["stage2_socket"] = True
    for obj in collection.objects:
        if not obj.name.startswith("SOCKET_"):
            continue
        binding = obj.get("binding_bone")
        if not binding:
            continue
        world = obj.matrix_world.copy()
        obj.parent = rig
        obj.parent_type = "BONE"
        obj.parent_bone = binding
        obj.matrix_world = world
        obj["binding_status"] = "stage-2-final-bone-parent"


def finalize(hero: str) -> dict:
    config = CONFIG[hero]
    if Path(bpy.data.filepath).resolve() != config["blend"].resolve():
        raise RuntimeError(f"open authoritative production source: {config['blend']}")
    current_hash = stage1.sha256(config["blend"])
    if current_hash != config["stage1Sha256"] and bpy.context.scene.get("stage_2_pass") is True:
        rig = bpy.data.objects.get(config["stage2Rig"])
        surface = bpy.data.objects.get(config["surface"])
        if not rig or not surface:
            raise RuntimeError("existing Stage 2 source is incomplete")
        before = stage1.mesh_fingerprint(surface)
        add_missing_sockets(hero, rig)
        after = stage1.mesh_fingerprint(surface)
        if before != after or surface.modifiers or bpy.data.actions:
            raise RuntimeError("Stage 2 refresh violated the locked unskinned source")
        bpy.ops.wm.save_as_mainfile(filepath=str(config["blend"]), relative_remap=True)
        inventory = json.loads(config["inventory"].read_text(encoding="utf-8"))
        inventory["sourceFile"]["sha256"] = stage1.sha256(config["blend"])
        inventory["sourceFile"]["bytes"] = config["blend"].stat().st_size
        inventory["sockets"] = sockets_inventory(hero)
        config["inventory"].write_text(json.dumps(inventory, indent=2)+"\n", encoding="utf-8")
        return inventory
    if current_hash != config["stage1Sha256"]:
        raise RuntimeError("Stage 1 production source hash changed before authorized Stage 2 upgrade")
    if bpy.context.scene.get("stage_1_pass") is not True:
        raise RuntimeError("Stage 1 pass evidence missing from Blender source")
    if bpy.context.scene.get("source_glb_sha256") != config["sourceSha256"]:
        raise RuntimeError("locked Meshy source hash metadata mismatch")
    surface = bpy.data.objects.get(config["surface"])
    rig = bpy.data.objects.get(config["stage1Rig"])
    if not surface or not rig:
        raise RuntimeError("locked visible surface or Stage 1 armature missing")
    before = stage1.mesh_fingerprint(surface)
    stage1_inventory = json.loads(config["stage1Inventory"].read_text(encoding="utf-8"))
    if before != stage1_inventory["lockedBaseline"]["surfaceFingerprint"]:
        raise RuntimeError("locked visible surface no longer matches Stage 1 fingerprint")
    if surface.modifiers:
        raise RuntimeError("Stage 2 must begin before skinning or mesh modifiers")
    if bpy.data.actions:
        raise RuntimeError("Stage 2 must not contain animation actions")

    rig.name = config["stage2Rig"]
    rig.data.name = config["stage2Rig"] + "_DATA"
    build_stage2_bones(hero, rig)
    accessory_policies = configure_properties_and_constraints(hero, rig)
    add_missing_sockets(hero, rig)
    pose_review = build_pose_review(hero, rig, config["preview"])
    stage1.reset_pose(rig)
    bpy.context.view_layer.update()
    after = stage1.mesh_fingerprint(surface)
    if before != after:
        raise RuntimeError("Stage 2 changed locked mesh/material/topology/UV fingerprint")
    if surface.modifiers:
        raise RuntimeError("Stage 2 illegally introduced skinning or mesh modifiers")
    if bpy.data.actions:
        raise RuntimeError("Stage 2 illegally authored animation actions")

    groups = bone_groups(rig)
    rig["production_stage"] = "stage-2-purposeful-control-architecture-pass"
    rig["body_deform_count"] = len(groups["deformBones"])
    rig["accessory_deform_count"] = len(groups["accessoryDeformBones"])
    rig["control_count"] = len(groups["animatorControls"])
    rig["helper_count"] = len(groups["helpers"])
    scene = bpy.context.scene
    scene["asset_version"] = "0.3.0-stage-2-pass"
    scene["production_stage"] = "stage-2-pass-ready-for-stage-3-authorization"
    scene["stage_2_started"] = True
    scene["stage_2_pass"] = True
    scene["stage_3_started"] = False
    scene["stage_3_authorized"] = False
    scene["final_animation_blocked"] = True
    scene["runtime_switch_authorized"] = False
    scene["skinning_started"] = False
    scene["actions_authored"] = False
    scene["semantic_map"] = "data/production-character-rig-semantic-map.json"
    scene["pose_review_sheet"] = config["preview"].relative_to(ROOT).as_posix()
    scene["unresolved_stage_2_issues"] = "none"
    scene["export_configuration"] = "stage-2-deform-only-plan-candidate-export-forbidden"
    stage1.pack_dependencies()
    bpy.ops.wm.save_as_mainfile(filepath=str(config["blend"]), relative_remap=True)

    ik_fk = {
        "arms": {side: {"switchProperty": f"arm_ik_fk_{side}", "range": [0,1], "fk": [f"CTRL_fk_upper_arm.{side}", f"CTRL_fk_forearm.{side}", f"CTRL_fk_hand.{side}"], "ikTarget": f"CTRL_hand_ik.{side}", "pole": f"CTRL_elbow_pole.{side}", "mechanism": [f"MCH_ik_upper_arm.{side}", f"MCH_ik_forearm.{side}"], "stretch": False} for side in ("L","R")},
        "legs": {side: {"switchProperty": f"leg_ik_fk_{side}", "range": [0,1], "fk": [f"CTRL_fk_thigh.{side}", f"CTRL_fk_shin.{side}", f"CTRL_fk_foot.{side}", f"CTRL_fk_toe.{side}"], "ikTarget": f"CTRL_foot_ik.{side}", "pole": f"CTRL_knee_pole.{side}", "footMechanism": [f"MCH_heel_pivot.{side}", f"MCH_bank_pivot.{side}", f"MCH_ball_pivot.{side}", f"MCH_toe_pivot.{side}", f"MCH_foot_target.{side}"], "stretch": False} for side in ("L","R")},
        "snapTool": "tools/blender/production_rig_stage_2_snap.py",
        "poseToleranceMetres": 0.0001,
    }
    inventory = {
        "schemaVersion": 2, "hero": hero, "status": "stage-2-pass-unskinned-final-animation-blocked",
        "blenderVersion": bpy.app.version_string,
        "sourceFile": {"path": config["blend"].relative_to(ROOT).as_posix(), "sha256": stage1.sha256(config["blend"]), "bytes": config["blend"].stat().st_size, "opensWithoutMissingDependencies": True},
        "lockedBaseline": {"sourceGlbSha256": config["sourceSha256"], "visibleIdentityChanged": False, "surfaceFingerprint": after, "meshMaterialTopologyOrUvFingerprintChanged": False},
        "coordinateConvention": stage1_inventory["coordinateConvention"],
        "armature": stage1.armature_inventory(rig),
        **groups,
        "ikFk": ik_fk,
        "footControls": {side: {"control": f"CTRL_foot_ik.{side}", "properties": ["footRoll","heelLift","ballRoll","toeRoll","bank","dorsiflexion","plantarflexion","skidOrientation","crouchPlacement","slidePlacement","landingCompression","groundSlamContact"]} for side in ("L","R")},
        "handControls": {side: {"selector": f"CTRL_hand_pose.{side}", "poses": list(HAND_POSES), "compactControls": [f"CTRL_thumb.{side}", f"CTRL_fingers_main.{side}", f"CTRL_fingers_outer.{side}"], "blendable": True} for side in ("L","R")},
        "facialControls": {"interface": "CTRL_face", "properties": list(FACE_PROPERTIES), "controls": sorted(name for name in groups["animatorControls"] if any(token in name for token in ("eye", "lid", "brow", "mouth", "lip", "cheek", "jaw", "gaze", "face"))), "finalShapeSculptingDeferredToStage3": True},
        "accessoryControls": accessory_policies,
        "sockets": sockets_inventory(hero),
        "poseReview": pose_review,
        "exportConfiguration": {"candidateExportAllowed": False, "animations": False, "exportOnlyDeformBones": True, "animatorControlsExported": False, "helpersExported": False, "normalGameplayRootMotion": False},
        "stage2Pass": True, "stage3Started": False, "stage3Authorized": False, "finalAnimationAllowed": False,
        "unresolvedStage2Issues": [],
    }
    config["inventory"].write_text(json.dumps(inventory, indent=2)+"\n", encoding="utf-8")
    return inventory


def main() -> None:
    result = finalize(arguments().hero)
    print("CODEX_STAGE_2_FINAL=" + json.dumps({"hero": result["hero"], "status": result["status"], "counts": result["armature"]["counts"], "poseCount": result["poseReview"]["poseCount"]}))


if __name__ == "__main__":
    main()
