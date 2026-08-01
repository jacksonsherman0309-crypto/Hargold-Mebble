"""Skin the locked character surfaces to the Stage 2 production rigs.

Stage 3 migrates the retained Meshy bind weights into the original production
deform hierarchy, adds purpose-specific twist deformers, non-destructive pose
correctives, and deformation stress evidence.  It does not author actions,
export candidate GLBs, change the browser runtime, or begin final animation.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from collections import defaultdict
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
TOOLS = ROOT / "tools" / "blender"
if str(TOOLS) not in sys.path:
    sys.path.insert(0, str(TOOLS))

import finalize_production_rig_stage_1 as stage1
import finalize_production_rig_stage_2 as stage2

PRODUCTION = ROOT / "assets/blender/production"
PREVIEWS = ROOT / "assets/previews/rig-stage-3"

CONFIG = {
    "Hargold": {
        "blend": PRODUCTION / "hargold_production_rig.blend",
        "surface": "Hargold_LOCKED_VISIBLE_SURFACE_STAGE_1",
        "rig": "Hargold_PRODUCTION_RIG_STAGE_2",
        "stage2Sha256": "B79765AF02E00AF9FCC4CE2DF541A05B2D4F794EC2FC1E5F445EF77E5EFFEE0C",
        "stage2Inventory": PRODUCTION / "hargold_stage-2-rig-inventory.json",
        "inventory": PRODUCTION / "hargold_stage-3-deformation-inventory.json",
        "preview": PREVIEWS / "hargold-deformation-stress.png",
        "height": 1.82,
    },
    "Mebble": {
        "blend": PRODUCTION / "mebble_production_rig.blend",
        "surface": "Mebble_LOCKED_VISIBLE_SURFACE_STAGE_1",
        "rig": "Mebble_PRODUCTION_RIG_STAGE_2",
        "stage2Sha256": "B4C277F19FBA17BAFDB73E00397EE3AB9FFBA39265F143245ED085D142092BB0",
        "stage2Inventory": PRODUCTION / "mebble_stage-2-rig-inventory.json",
        "inventory": PRODUCTION / "mebble_stage-3-deformation-inventory.json",
        "preview": PREVIEWS / "mebble-deformation-stress.png",
        "height": 2.2932,
    },
}

LEGACY_GROUPS = (
    "Hips", "LeftUpLeg", "LeftLeg", "LeftFoot", "LeftToeBase",
    "RightUpLeg", "RightLeg", "RightFoot", "RightToeBase",
    "Spine02", "Spine01", "Spine", "LeftShoulder", "LeftArm",
    "LeftForeArm", "LeftHand", "RightShoulder", "RightArm",
    "RightForeArm", "RightHand", "neck", "Head", "head_end", "headfront",
)

STRESS_POSES = (
    "neutral", "shoulder_reach", "elbow_fold", "arm_twist", "wrist_brace",
    "deep_crouch", "hip_flexion", "knee_fold", "ankle_roll", "planted_skid",
    "slide", "heavy_landing", "ground_slam_tuck", "ground_slam_impact",
)


def arguments():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--hero", choices=sorted(CONFIG), required=True)
    return parser.parse_args(argv)


def add_twist_deformers(rig) -> list[str]:
    created = []
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    eb = rig.data.edit_bones
    for suffix in (".L", ".R"):
        for segment, helper, parent in (
            ("upper_arm_twist", f"MCH_upper_arm_twist{suffix}", f"DEF_clavicle{suffix}"),
            ("forearm_twist", f"MCH_forearm_twist{suffix}", f"DEF_upper_arm{suffix}"),
            ("thigh_twist", f"MCH_thigh_twist{suffix}", "DEF_pelvis"),
        ):
            name = f"DEF_{segment}{suffix}"
            if name in eb:
                continue
            source = eb[helper]
            bone = eb.new(name)
            bone.head = source.head.copy()
            bone.tail = source.tail.copy()
            bone.roll = source.roll
            bone.parent = eb[parent]
            bone.use_connect = False
            bone.use_deform = True
            created.append(name)
    bpy.ops.object.mode_set(mode="OBJECT")
    collection = rig.data.collections.get("DEFORM_RIG") or rig.data.collections.new("DEFORM_RIG")
    for name in created:
        bone = rig.data.bones[name]
        bone["semantic_category"] = "body-deform"
        bone["rig_system"] = "DEFORM_RIG"
        bone["roll_reference"] = "LOCAL_Y-longitudinal-LOCAL_X-side-bend"
        bone["bend_axis"] = "LOCAL_X"
        bone["twist_axis"] = "LOCAL_Y"
        collection.assign(bone)
        segment = name.removeprefix("DEF_").removesuffix(".L").removesuffix(".R")
        suffix = ".L" if name.endswith(".L") else ".R"
        source = {
            "upper_arm_twist": f"DEF_upper_arm{suffix}",
            "forearm_twist": f"DEF_forearm{suffix}",
            "thigh_twist": f"DEF_thigh{suffix}",
        }[segment]
        constraint = rig.pose.bones[name].constraints.new("COPY_ROTATION")
        constraint.name = "STAGE3_TWIST_DISTRIBUTION"
        constraint.target = rig
        constraint.subtarget = source
        constraint.target_space = "LOCAL"
        constraint.owner_space = "LOCAL"
        constraint.use_x = False
        constraint.use_y = True
        constraint.use_z = False
        constraint.influence = 0.5
    return created


def align_body_pivots_to_locked_bind(hero: str, rig) -> dict:
    """Correct Stage 1 scaffold pivots using the preserved approved bind.

    Stage 3 stress renders proved that the estimated scaffold put Hargold's
    shoulder roughly 0.32 m above the working bind (with similar hip errors).
    The preserved interim armature is used only as measured pivot evidence; the
    original production hierarchy, naming, controls, and helper architecture
    remain intact.
    """
    source = bpy.data.objects[f"{hero}_Canonical_Gameplay_Rig"]
    report_path = PRODUCTION / f"{hero.lower()}_stage-0-1-source-report.json"
    normalization = json.loads(report_path.read_text(encoding="utf-8"))["productionSource"]["canonicalNormalizationScale"]
    def pivot(name: str) -> Vector:
        return (source.matrix_world @ source.data.bones[name].head_local) * normalization

    p = {name: pivot(name) for name in LEGACY_GROUPS if source.data.bones.get(name)}
    positions = {
        "DEF_pelvis": (p["Hips"], p["Spine02"]),
        "DEF_spine_lower": (p["Spine02"], p["Spine01"]),
        "DEF_spine_mid": (p["Spine01"], p["Spine"]),
        "DEF_spine_upper": (p["Spine"], p["Spine"].lerp(p["neck"], .48)),
        "DEF_chest": (p["Spine"].lerp(p["neck"], .48), p["neck"]),
        "DEF_head": (p["Head"], p["Head"] + Vector((0, 0, CONFIG[hero]["height"] * .16))),
    }
    if hero == "Hargold":
        positions["DEF_neck_base"] = (p["neck"], p["Head"])
    else:
        positions["DEF_neck_base"] = (p["neck"], p["neck"].lerp(p["Head"], 1/3))
        positions["DEF_neck_mid"] = (p["neck"].lerp(p["Head"], 1/3), p["neck"].lerp(p["Head"], 2/3))
        positions["DEF_neck_upper"] = (p["neck"].lerp(p["Head"], 2/3), p["Head"])
    for side, source_side in ((".L", "Left"), (".R", "Right")):
        positions.update({
            f"DEF_clavicle{side}": (p[f"{source_side}Shoulder"], p[f"{source_side}Arm"]),
            f"DEF_upper_arm{side}": (p[f"{source_side}Arm"], p[f"{source_side}ForeArm"]),
            f"DEF_forearm{side}": (p[f"{source_side}ForeArm"], p[f"{source_side}Hand"]),
            f"DEF_thigh{side}": (p[f"{source_side}UpLeg"], p[f"{source_side}Leg"]),
            f"DEF_shin{side}": (p[f"{source_side}Leg"], p[f"{source_side}Foot"]),
            f"DEF_foot{side}": (p[f"{source_side}Foot"], p[f"{source_side}ToeBase"]),
        })
        hand = p[f"{source_side}Hand"]
        foot = p[f"{source_side}ToeBase"]
        positions[f"DEF_hand{side}"] = (hand, hand + Vector((0, -CONFIG[hero]["height"]*.07, -.015)))
        positions[f"DEF_toe{side}"] = (foot, foot + Vector((0, -CONFIG[hero]["height"]*.075, 0)))

    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    edit = rig.data.edit_bones
    control_pairs = {
        "DEF_pelvis": ("CTRL_pelvis",), "DEF_spine_lower": ("CTRL_spine_lower",),
        "DEF_spine_mid": ("CTRL_spine_mid",), "DEF_spine_upper": ("CTRL_spine_upper",),
        "DEF_chest": ("CTRL_chest",), "DEF_head": ("CTRL_head",),
    }
    for name in ("neck_base", "neck_mid", "neck_upper"):
        control_pairs[f"DEF_{name}"] = (f"CTRL_{name}",)
    for side in (".L", ".R"):
        control_pairs[f"DEF_clavicle{side}"] = (f"CTRL_clavicle{side}",)
        for segment in ("upper_arm", "forearm", "hand", "thigh", "shin", "foot", "toe"):
            control_pairs[f"DEF_{segment}{side}"] = (f"CTRL_fk_{segment}{side}", f"MCH_ik_{segment}{side}")
    adjusted = []
    for deform_name, (head, tail) in positions.items():
        targets = (deform_name,) + control_pairs.get(deform_name, ())
        for target_name in targets:
            bone = edit.get(target_name)
            if not bone:
                continue
            bone.head = head; bone.tail = stage1.safe_tail(head, tail); stage1.deliberate_roll(bone)
            adjusted.append(target_name)
    for side in (".L", ".R"):
        for segment in ("upper_arm", "forearm", "thigh"):
            source_name = f"DEF_{segment}{side}"
            source_head, source_tail = positions[source_name]
            for prefix in ("DEF", "MCH"):
                twist = edit.get(f"{prefix}_{segment}_twist{side}")
                if twist:
                    twist.head = source_head.lerp(source_tail, .28)
                    twist.tail = source_head.lerp(source_tail, .72)
                    stage1.deliberate_roll(twist); adjusted.append(twist.name)
    bpy.ops.object.mode_set(mode="OBJECT")
    bpy.context.view_layer.update()
    return {
        "reason": "Stage-3 stress evidence proved scaffold pivots did not match the locked bind",
        "source": source.name, "canonicalNormalizationScale": normalization,
        "adjustedBoneCount": len(set(adjusted)), "adjustedBones": sorted(set(adjusted)),
    }


def distance_to_bone(point: Vector, bone) -> float:
    start = bone.head_local
    end = bone.tail_local
    axis = end - start
    length_sq = axis.length_squared
    if length_sq < 1e-10:
        return (point - start).length
    t = max(0.0, min(1.0, (point - start).dot(axis) / length_sq))
    return (point - (start + axis * t)).length


def candidate_map(hero: str) -> dict[str, list[tuple[str, float]]]:
    # Stage 3 owns connected-body deformation only.  The Stage 2 rig already
    # contains face, finger, cape, backpack, and loose-accessory deform bones,
    # but those systems do not receive production weights until Stage 4.  A
    # broad nearest-bone transfer here lets those future controls capture
    # sleeves, torso cloth, and the body under accessories.  Keep this pass
    # deliberately conservative and preserve the proven Meshy bind regions.
    shared = {
        "Hips": [("DEF_pelvis", 1.0)],
        "Spine02": [("DEF_pelvis", .25), ("DEF_spine_lower", 1.0)],
        "Spine01": [("DEF_spine_lower", .35), ("DEF_spine_mid", 1.0), ("DEF_spine_upper", .35)],
        "LeftUpLeg": [("DEF_thigh.L", 1.25), ("DEF_thigh_twist.L", 1.0)],
        "RightUpLeg": [("DEF_thigh.R", 1.25), ("DEF_thigh_twist.R", 1.0)],
        "LeftLeg": [("DEF_shin.L", 1.0)],
        "RightLeg": [("DEF_shin.R", 1.0)],
        "LeftFoot": [("DEF_foot.L", 1.0)],
        "RightFoot": [("DEF_foot.R", 1.0)],
        "LeftToeBase": [("DEF_toe.L", 1.0)],
        "RightToeBase": [("DEF_toe.R", 1.0)],
        "LeftShoulder": [("DEF_clavicle.L", 1.0)],
        "RightShoulder": [("DEF_clavicle.R", 1.0)],
        "LeftArm": [("DEF_upper_arm.L", 1.25), ("DEF_upper_arm_twist.L", .70)],
        "RightArm": [("DEF_upper_arm.R", 1.25), ("DEF_upper_arm_twist.R", .70)],
        "LeftForeArm": [("DEF_forearm.L", 1.25), ("DEF_forearm_twist.L", .70)],
        "RightForeArm": [("DEF_forearm.R", 1.25), ("DEF_forearm_twist.R", .70)],
        "LeftHand": [("DEF_hand.L", 1.0)],
        "RightHand": [("DEF_hand.R", 1.0)],
    }
    if hero == "Hargold":
        shared["Spine"] = [("DEF_spine_upper", .45), ("DEF_chest", 1.0)]
        shared["neck"] = [("DEF_neck_base", 1.0)]
    else:
        shared["Spine"] = [("DEF_spine_upper", .45), ("DEF_chest", 1.0)]
        shared["neck"] = [("DEF_neck_base", .65), ("DEF_neck_mid", 1.0), ("DEF_neck_upper", .65)]
    for name in ("Head", "head_end", "headfront"):
        shared[name] = [("DEF_head", 1.0)]
    return shared


def migrate_weights(hero: str, surface, rig) -> dict:
    source_group_index = {group.name: group.index for group in surface.vertex_groups if group.name in LEGACY_GROUPS}
    deform_names = sorted(bone.name for bone in rig.data.bones if bone.use_deform)
    for name in deform_names:
        group = surface.vertex_groups.get(name)
        if group:
            surface.vertex_groups.remove(group)
    target_groups = {name: surface.vertex_groups.new(name=name) for name in deform_names}
    target_index = {name: group.index for name, group in target_groups.items()}
    bones = {name: rig.data.bones[name] for name in deform_names}
    # Stage 3's connected-body solve uses only the core production deform
    # hierarchy. Face, digit, and loose-accessory deformers are intentionally
    # left unweighted for the dedicated Stage 4 pass.
    excluded_tokens = (
        "brow", "cheek", "eye", "lid", "lip", "mouth", "jaw", "thumb",
        "fingers", "hat", "feather", "scarf", "backpack", "belt", "pouch",
        "facial_hair", "glasses", "adams_apple", "cape",
    )
    skin_names = [name for name in deform_names if not any(token in name for token in excluded_tokens)]
    mapping = {
        "Hips": [("DEF_pelvis", 1.0)],
        "Spine02": [("DEF_spine_lower", 1.0)],
        "Spine01": [("DEF_spine_mid", 1.0)],
        "Spine": [("DEF_chest", 1.0)],
        "LeftShoulder": [("DEF_clavicle.L", 1.0)],
        "RightShoulder": [("DEF_clavicle.R", 1.0)],
        "LeftArm": [("DEF_upper_arm.L", .82), ("DEF_upper_arm_twist.L", .18)],
        "RightArm": [("DEF_upper_arm.R", .82), ("DEF_upper_arm_twist.R", .18)],
        "LeftForeArm": [("DEF_forearm.L", .82), ("DEF_forearm_twist.L", .18)],
        "RightForeArm": [("DEF_forearm.R", .82), ("DEF_forearm_twist.R", .18)],
        "LeftHand": [("DEF_hand.L", 1.0)],
        "RightHand": [("DEF_hand.R", 1.0)],
        "LeftUpLeg": [("DEF_thigh.L", .82), ("DEF_thigh_twist.L", .18)],
        "RightUpLeg": [("DEF_thigh.R", .82), ("DEF_thigh_twist.R", .18)],
        "LeftLeg": [("DEF_shin.L", 1.0)], "RightLeg": [("DEF_shin.R", 1.0)],
        "LeftFoot": [("DEF_foot.L", 1.0)], "RightFoot": [("DEF_foot.R", 1.0)],
        "LeftToeBase": [("DEF_toe.L", 1.0)], "RightToeBase": [("DEF_toe.R", 1.0)],
        "neck": [("DEF_neck_base", 1.0)] if hero == "Hargold" else [("DEF_neck_mid", 1.0)],
        "Head": [("DEF_head", 1.0)], "head_end": [("DEF_head", 1.0)], "headfront": [("DEF_head", 1.0)],
    }
    # The Meshy export is a layered surface with thousands of disconnected
    # islands.  Its largest rear garment islands carry erroneous arm weights.
    # Detect those islands from topology and bind them rigidly to chest/head for
    # Stage 3. Stage 4 replaces this temporary stable follow with the authored
    # cape/backpack/accessory chains.
    adjacency = [[] for _ in surface.data.vertices]
    for edge in surface.data.edges:
        a, b = edge.vertices
        adjacency[a].append(b); adjacency[b].append(a)
    component_override = {}
    visited = bytearray(len(surface.data.vertices))
    corrected_components = []
    rigid_component_count = 0
    rear_threshold = .10 if hero == "Hargold" else .08
    height = CONFIG[hero]["height"]
    source_index_name = {index: name for name, index in source_group_index.items()}
    arm_source_bones = {
        "LeftShoulder": "DEF_clavicle.L", "RightShoulder": "DEF_clavicle.R",
        "LeftArm": "DEF_upper_arm.L", "RightArm": "DEF_upper_arm.R",
        "LeftForeArm": "DEF_forearm.L", "RightForeArm": "DEF_forearm.R",
        "LeftHand": "DEF_hand.L", "RightHand": "DEF_hand.R",
    }
    for start in range(len(surface.data.vertices)):
        if visited[start]:
            continue
        stack = [start]; visited[start] = 1; indices = []
        sum_y = 0.0; sum_z = 0.0; max_z = -1e9
        source_mass = defaultdict(float)
        while stack:
            index = stack.pop(); indices.append(index)
            co = surface.data.vertices[index].co
            sum_y += co.y; sum_z += co.z; max_z = max(max_z, co.z)
            for membership in surface.data.vertices[index].groups:
                source_name = source_index_name.get(membership.group)
                if source_name:
                    source_mass[source_name] += membership.weight
            for linked in adjacency[index]:
                if not visited[linked]:
                    visited[linked] = 1; stack.append(linked)
        center_y = sum_y / len(indices); center_z = sum_z / len(indices)
        arm_source = max(arm_source_bones, key=lambda name: source_mass.get(name, 0.0))
        total_mass = sum(source_mass.values()) or 1.0
        arm_fraction = sum(source_mass.get(name, 0.0) for name in arm_source_bones) / total_mass
        arm_distance = distance_to_bone(Vector((sum(surface.data.vertices[i].co.x for i in indices)/len(indices), center_y, center_z)), bones[arm_source_bones[arm_source]])
        rear_garment = center_y > rear_threshold and max_z > height * .48 and arm_fraction < .35
        implausible_arm_island = arm_fraction >= .35 and arm_distance > height * .25
        dominant_source = max(source_mass, key=source_mass.get) if source_mass else None
        target_weights = list(mapping.get(dominant_source, (("DEF_chest", 1.0),)))
        if rear_garment or implausible_arm_island:
            target = "DEF_head" if center_z > height * .72 else ("DEF_pelvis" if center_z < height * .38 else "DEF_chest")
            target_weights = [(target, 1.0)]
            corrected_components.append({
                "vertexCount": len(indices), "target": target, "centerY": center_y,
                "centerZ": center_z, "maximumZ": max_z,
                "reason": "rear-garment" if rear_garment else "implausible-arm-island",
                "armWeightFraction": arm_fraction, "armChainDistanceMetres": arm_distance,
            })
        for index in indices:
            component_override[index] = target_weights
        rigid_component_count += 1
    buckets = {name: defaultdict(list) for name in deform_names}
    influence_counts = defaultdict(int)
    legacy_members = {name: [] for name in LEGACY_GROUPS}
    unweighted = 0
    max_error = 0.0
    for vertex in surface.data.vertices:
        accumulated = defaultdict(float)
        for membership in vertex.groups:
            legacy_name = source_index_name.get(membership.group)
            if legacy_name:
                legacy_members[legacy_name].append(vertex.index)
                targets = mapping.get(legacy_name, ())
                target_total = sum(bias for _, bias in targets) or 1.0
                for target, bias in targets:
                    accumulated[target] += membership.weight * bias / target_total
        override = component_override.get(vertex.index)
        if override:
            accumulated = defaultdict(float, {name: weight for name, weight in override})
        if not accumulated:
            unweighted += 1
            nearest = min(("DEF_pelvis", "DEF_chest", "DEF_head"), key=lambda name: distance_to_bone(vertex.co, bones[name]))
            accumulated[nearest] = 1.0
        strongest = sorted(accumulated.items(), key=lambda item: -item[1])[:4]
        total = sum(weight for _, weight in strongest) or 1.0
        normalized = [(name, weight / total) for name, weight in strongest]
        quantized = [(name, max(1, min(255, round(weight * 255)))) for name, weight in normalized]
        q_total = sum(value for _, value in quantized)
        max_error = max(max_error, abs(1.0 - q_total / 255.0))
        influence_counts[len(quantized)] += 1
        for name, value in quantized:
            buckets[name][value].append(vertex.index)
    for name, weight_buckets in buckets.items():
        group = target_groups[name]
        for value, indices in weight_buckets.items():
            if indices:
                group.add(indices, value / 255.0, "REPLACE")
    # Quantization makes the bulk write practical; normalize its small error.
    bpy.context.view_layer.objects.active = surface
    surface.select_set(True)
    for vertex in surface.data.vertices:
        production = [item for item in vertex.groups if item.group in target_index.values()]
        total = sum(item.weight for item in production)
        if total <= 1e-8:
            continue
        for item in production:
            group_name = surface.vertex_groups[item.group].name
            target_groups[group_name].add([vertex.index], item.weight / total, "REPLACE")
    nonzero = {name: 0 for name in deform_names}
    max_influences = 0
    max_sum_error = 0.0
    for vertex in surface.data.vertices:
        production = [item for item in vertex.groups if surface.vertex_groups[item.group].name in target_groups]
        max_influences = max(max_influences, len(production))
        max_sum_error = max(max_sum_error, abs(1.0 - sum(item.weight for item in production)))
        for item in production:
            nonzero[surface.vertex_groups[item.group].name] += 1
    return {
        "method": "retained-bind-core-remap-with-connected-rear-garment-topology-correction-top4-normalized",
        "legacyGroupsPreserved": list(source_group_index),
        "productionGroups": deform_names,
        "stage3WeightedGroups": skin_names,
        "stage4DeferredGroups": [name for name in deform_names if name not in skin_names],
        "topologyCorrectedComponents": corrected_components,
        "rigidConnectedComponentBindings": rigid_component_count,
        "vertexCount": len(surface.data.vertices),
        "unweightedSourceVerticesRecovered": unweighted,
        "maximumInfluences": max_influences,
        "maximumWeightSumError": max_sum_error,
        "influenceCountHistogram": {str(key): value for key, value in sorted(influence_counts.items())},
        "nonzeroVertexCounts": nonzero,
    }


def add_armature_and_smoothing(surface, rig) -> dict:
    for modifier in list(surface.modifiers):
        surface.modifiers.remove(modifier)
    armature = surface.modifiers.new("PRODUCTION_SKIN", "ARMATURE")
    armature.object = rig
    armature.use_deform_preserve_volume = True
    armature.use_vertex_groups = True
    corrective = surface.modifiers.new("PRODUCTION_CORRECTIVE_SMOOTH", "CORRECTIVE_SMOOTH")
    corrective.factor = .32
    corrective.iterations = 4
    corrective.scale = 1.0
    corrective.smooth_type = "LENGTH_WEIGHTED"
    corrective.use_only_smooth = False
    corrective.use_pin_boundary = True
    try:
        corrective.rest_source = "ORCO"
    except TypeError:
        pass
    world = surface.matrix_world.copy()
    surface.parent = rig
    surface.parent_type = "OBJECT"
    surface.matrix_world = world
    return {"armature": armature.name, "preserveVolume": armature.use_deform_preserve_volume, "correctiveSmooth": corrective.name, "factor": corrective.factor, "iterations": corrective.iterations}


def add_corrective_key(surface, name: str, center: Vector, axis: Vector, radius: float,
                       amount: float, region_indices: set[int]):
    key = surface.shape_key_add(name=name, from_mix=False)
    axis = axis.normalized()
    affected = 0
    maximum_delta = 0.0
    for index in region_indices:
        base = surface.data.vertices[index].co
        relative = base - center
        axial = axis * relative.dot(axis)
        radial = relative - axial
        distance = relative.length
        if distance >= radius or radial.length < 1e-6:
            continue
        falloff = (1.0 - distance / radius) ** 2
        delta = radial.normalized() * amount * falloff
        key.data[index].co = base + delta
        affected += 1
        maximum_delta = max(maximum_delta, delta.length)
    key.value = 0.0
    return key, {"name": name, "affectedVertices": affected, "maximumDeltaMetres": maximum_delta, "radiusMetres": radius}


def add_pose_driver(key, rig, control_name: str, axis_index: int = 0, divisor: float = 1.25):
    fcurve = key.driver_add("value")
    driver = fcurve.driver
    driver.type = "SCRIPTED"
    driver.expression = f"min(abs(a)/{divisor},1.0)"
    variable = driver.variables.new()
    variable.name = "a"
    variable.type = "SINGLE_PROP"
    target = variable.targets[0]
    target.id_type = "OBJECT"
    target.id = rig
    target.data_path = f'pose.bones["{control_name}"].rotation_euler[{axis_index}]'


def build_correctives(hero: str, surface, rig) -> list[dict]:
    if surface.data.shape_keys:
        for key in list(surface.data.shape_keys.key_blocks)[1:]:
            surface.shape_key_remove(key)
    if not surface.data.shape_keys:
        surface.shape_key_add(name="Basis", from_mix=False)
    group_indices = {group.name: group.index for group in surface.vertex_groups}
    source_members = defaultdict(set)
    for vertex in surface.data.vertices:
        for item in vertex.groups:
            name = surface.vertex_groups[item.group].name
            if name in LEGACY_GROUPS:
                source_members[name].add(vertex.index)
    height = CONFIG[hero]["height"]
    specs = []
    for suffix, side_name in ((".L", "Left"), (".R", "Right")):
        specs.extend([
            (f"CORR_shoulder{suffix}", f"DEF_upper_arm{suffix}", f"{side_name}Arm", .115, .010, "ROT_X", 1.05),
            (f"CORR_elbow{suffix}", f"DEF_forearm{suffix}", f"{side_name}ForeArm", .085, .009, "ROT_X", 1.20),
            (f"CORR_wrist{suffix}", f"DEF_hand{suffix}", f"{side_name}Hand", .060, .006, "ROT_X", .90),
            (f"CORR_hip{suffix}", f"DEF_thigh{suffix}", f"{side_name}UpLeg", .105, .010, "ROT_X", 1.05),
            (f"CORR_knee{suffix}", f"DEF_shin{suffix}", f"{side_name}Leg", .080, .008, "ROT_X", 1.20),
            (f"CORR_ankle{suffix}", f"DEF_foot{suffix}", f"{side_name}Foot", .060, .006, "ROT_X", .85),
        ])
    results = []
    control_for_bone = {
        "upper_arm": "CTRL_fk_upper_arm", "forearm": "CTRL_fk_forearm",
        "hand": "CTRL_fk_hand", "thigh": "CTRL_fk_thigh",
        "shin": "CTRL_fk_shin", "foot": "CTRL_fk_foot",
    }
    for name, bone_name, source_group, radius_factor, amount_factor, transform, divisor in specs:
        bone = rig.data.bones[bone_name]
        center = bone.head_local.copy()
        axis = bone.tail_local - bone.head_local
        indices = source_members[source_group]
        key, record = add_corrective_key(surface, name, center, axis, height*radius_factor, height*amount_factor, indices)
        segment = bone_name.removeprefix("DEF_").removesuffix(".L").removesuffix(".R")
        suffix = ".L" if bone_name.endswith(".L") else ".R"
        control_name = control_for_bone[segment] + suffix
        add_pose_driver(key, rig, control_name, 0, divisor)
        record["driverBone"] = bone_name
        record["driverControl"] = control_name
        record["driverTransform"] = "rotation_euler[0]"
        results.append(record)
    if hero == "Hargold":
        bone = rig.data.bones["DEF_chest"]
        indices = source_members["LeftArm"] | source_members["RightArm"]
        key, record = add_corrective_key(surface, "CORR_hargold_limb_clearance", bone.head_local, bone.tail_local-bone.head_local, height*.28, height*.008, indices)
        add_pose_driver(key, rig, "CTRL_chest", 0, .8)
        record["driverBone"] = "DEF_chest"; record["driverControl"] = "CTRL_chest"; record["purpose"] = "keep compact arms readable outside torso"
        results.append(record)
    else:
        bone = rig.data.bones["DEF_neck_mid"]
        indices = source_members["neck"]
        key, record = add_corrective_key(surface, "CORR_mebble_neck_volume", bone.head_local, bone.tail_local-bone.head_local, height*.12, height*.007, indices)
        add_pose_driver(key, rig, "CTRL_neck_mid", 0, .65)
        record["driverBone"] = "DEF_neck_mid"; record["driverControl"] = "CTRL_neck_mid"; record["purpose"] = "preserve long-neck continuity and Adam's-apple profile"
        results.append(record)
    return results


def reset_static_pose(rig):
    stage1.reset_pose(rig)
    for name in ("arm_ik_fk_L", "arm_ik_fk_R", "leg_ik_fk_L", "leg_ik_fk_R"):
        rig[name] = 0.0
    for side in (".L", ".R"):
        hand = rig.pose.bones.get(f"CTRL_hand_pose{side}")
        if hand:
            for prop in stage2.HAND_POSES:
                if prop in hand: hand[prop] = 0.0
        foot = rig.pose.bones.get(f"CTRL_foot_ik{side}")
        if foot:
            for prop in ("footRoll","heelLift","ballRoll","toeRoll","bank","dorsiflexion","plantarflexion","skidOrientation","landingCompression","groundSlamContact","crouchPlacement","slidePlacement"):
                if prop in foot: foot[prop] = 0.0
    rig.update_tag(refresh={"DATA"})
    bpy.context.view_layer.update()


def configure_bind_safe_constraints(rig) -> dict:
    converted = []
    for pose_bone in rig.pose.bones:
        for constraint in list(pose_bone.constraints):
            if constraint.type == "COPY_ROTATION" and constraint.name.startswith("STAGE2_"):
                constraint.target_space = "LOCAL"
                constraint.owner_space = "LOCAL"
                converted.append(f"{pose_bone.name}:{constraint.name}:localized")
                continue
            if constraint.type == "COPY_TRANSFORMS":
                name = constraint.name
                target = constraint.target
                subtarget = constraint.subtarget
                influence = constraint.influence
                pose_bone.constraints.remove(constraint)
                rotation = pose_bone.constraints.new("COPY_ROTATION")
                rotation.name = name
                rotation.target = target
                rotation.subtarget = subtarget
                rotation.target_space = "LOCAL"
                rotation.owner_space = "LOCAL"
                rotation.influence = influence
                if name in {"STAGE2_FK", "STAGE2_IK"}:
                    side = "L" if pose_bone.name.endswith(".L") else "R"
                    limb = "arm" if any(token in pose_bone.name for token in ("upper_arm", "forearm", "hand")) else "leg"
                    stage2.add_constraint_driver(rotation, rig, f"{limb}_ik_fk_{side}", inverted=name == "STAGE2_FK")
                # The root pelvis is the only body deform bone that must copy
                # controller-owned translation. Child joints inherit position
                # through the deform hierarchy; copying their transforms was
                # the source of the Stage 3 stress-pose explosions.
                if pose_bone.name == "DEF_pelvis" and name == "STAGE2_DIRECT_CONTROL":
                    location = pose_bone.constraints.new("COPY_LOCATION")
                    location.name = "STAGE3_CONTROLLER_TRANSLATION"
                    location.target = target
                    location.subtarget = subtarget
                    location.target_space = "POSE"
                    location.owner_space = "POSE"
                converted.append(f"{pose_bone.name}:{name}")
    reset_static_pose(rig)
    return {
        "copyTransformConstraintsReplacedByLocalRotation": len(converted),
        "controllerTranslationCopiedOnlyAtPelvis": True,
        "neutralHandPosePropertiesZeroed": True,
    }


def set_stress_pose(hero: str, rig, pose: str):
    reset_static_pose(rig)
    h = CONFIG[hero]["height"]
    def rot(name, x=0, y=0, z=0):
        pb = rig.pose.bones.get(name)
        if pb:
            pb.rotation_mode = "XYZ"; pb.rotation_euler = (math.radians(x), math.radians(y), math.radians(z))
    def move(name, y=0, z=0):
        pb = rig.pose.bones[name]; pb.location.y = y; pb.location.z = z
    if pose == "shoulder_reach":
        rot("CTRL_clavicle.L", -25); rot("CTRL_fk_upper_arm.L", -115); rot("CTRL_fk_upper_arm.R", 35)
    elif pose == "elbow_fold":
        rot("CTRL_fk_upper_arm.L", -65); rot("CTRL_fk_forearm.L", 128); rot("CTRL_fk_upper_arm.R", 45); rot("CTRL_fk_forearm.R", -118)
    elif pose == "arm_twist":
        rot("CTRL_fk_upper_arm.L", -55, 95); rot("CTRL_fk_forearm.L", 72, 65); rot("CTRL_fk_upper_arm.R", 55, -95)
    elif pose == "wrist_brace":
        rot("CTRL_fk_upper_arm.L", -80); rot("CTRL_fk_forearm.L", 55); rot("CTRL_fk_hand.L", 62)
        rot("CTRL_fk_upper_arm.R", -80); rot("CTRL_fk_forearm.R", 55); rot("CTRL_fk_hand.R", 62)
    elif pose in {"deep_crouch", "hip_flexion", "knee_fold", "heavy_landing", "ground_slam_impact"}:
        move("CTRL_com", z=-h*(.12 if pose in {"deep_crouch","ground_slam_impact"} else .08))
        rot("CTRL_chest", 22 if pose != "hip_flexion" else 38)
        rot("CTRL_fk_upper_arm.L", 38); rot("CTRL_fk_upper_arm.R", -38)
        angles = {
            "deep_crouch": (-46, 82), "hip_flexion": (-72, 42),
            "knee_fold": (-22, 108), "heavy_landing": (-58, 106),
            "ground_slam_impact": (-78, 126),
        }
        thigh, shin = angles[pose]
        rot("CTRL_fk_thigh.L", thigh); rot("CTRL_fk_thigh.R", thigh)
        rot("CTRL_fk_shin.L", shin); rot("CTRL_fk_shin.R", shin)
    elif pose == "ankle_roll":
        rot("CTRL_fk_foot.L", 38, 0, 16)
    elif pose == "planted_skid":
        move("CTRL_com", y=h*.055, z=-h*.025); rot("CTRL_chest", -28)
        rot("CTRL_fk_thigh.L", -42); rot("CTRL_fk_shin.L", 34); rot("CTRL_fk_foot.L", 18)
        rot("CTRL_fk_thigh.R", 34); rot("CTRL_fk_shin.R", 24); rot("CTRL_fk_foot.R", -12)
    elif pose == "slide":
        move("CTRL_com", y=-h*.08, z=-h*.09); rot("CTRL_chest", 42)
        rot("CTRL_fk_thigh.L", -62); rot("CTRL_fk_shin.L", 78); rot("CTRL_fk_thigh.R", 24)
    elif pose == "ground_slam_tuck":
        move("CTRL_com", z=h*.08); rot("CTRL_ground_slam_presentation", 45)
        rot("CTRL_fk_thigh.L", -75); rot("CTRL_fk_thigh.R", -75); rot("CTRL_fk_shin.L", 120); rot("CTRL_fk_shin.R", 120)
    if hero == "Mebble" and pose in {"shoulder_reach", "arm_twist"}:
        rot("CTRL_neck_base", 8); rot("CTRL_neck_mid", -14); rot("CTRL_neck_upper", 10)
    rig.update_tag(refresh={"DATA"})
    bpy.context.view_layer.update()


def render_stress_sheet(hero: str, surface, rig, output: Path) -> dict:
    collection = bpy.data.collections.get("VALIDATION_POSES")
    for obj in list(collection.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    h = CONFIG[hero]["height"]
    text_mat = stage1.emission_material(f"{hero}_STAGE3_TEXT", (.03,.04,.03,1))
    stage1.add_floor_line(f"{hero}_STAGE3_FLOOR", 0, 0, h*1.05, text_mat, collection)
    camera_data = bpy.data.cameras.new(f"{hero}_STAGE3_CAMERA")
    camera = bpy.data.objects.new(f"{hero}_STAGE3_CAMERA", camera_data)
    collection.objects.link(camera)
    camera.location = (h*5.5, 0, h*.58)
    camera.rotation_euler = (Vector((0,0,h*.58))-camera.location).to_track_quat("-Z","Y").to_euler()
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = h*1.33
    bpy.context.scene.camera = camera
    world = bpy.context.scene.world or bpy.data.worlds.new(f"{hero}_STAGE3_WORLD")
    bpy.context.scene.world = world; world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (.94,.93,.89,1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = .8
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 560; scene.render.resolution_y = 680; scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    frame_dir = output.parent / "frames"
    frame_dir.mkdir(parents=True, exist_ok=True)
    visible = {surface, *collection.objects}
    hidden = {obj: obj.hide_render for obj in scene.objects}
    for obj in scene.objects:
        if obj not in visible: obj.hide_render = True
    results = []
    for pose in STRESS_POSES:
        set_stress_pose(hero, rig, pose)
        bpy.context.view_layer.update()
        evaluated = surface.evaluated_get(bpy.context.evaluated_depsgraph_get())
        bounds = [surface.matrix_world @ Vector(corner) for corner in evaluated.bound_box]
        frame = frame_dir / f"{hero.lower()}-{pose}.png"
        scene.render.filepath = str(frame)
        bpy.ops.render.render(write_still=True)
        results.append({"pose": pose, "controlsOnly": True, "deformedMeshEvaluated": True, "minimumZ": min(v.z for v in bounds), "maximumZ": max(v.z for v in bounds), "frame": frame.relative_to(ROOT).as_posix()})
    reset_static_pose(rig)
    for obj, value in hidden.items(): obj.hide_render = value
    return {"sheet": output.relative_to(ROOT).as_posix(), "framesRequireComposition": True, "poseCount": len(results), "trueSide": True, "actualProductionMesh": True, "actualProductionRig": True, "finalAnimation": False, "stage5ApprovalImplied": False, "results": results}


def finalize(hero: str) -> dict:
    config = CONFIG[hero]
    if Path(bpy.data.filepath).resolve() != config["blend"].resolve():
        raise RuntimeError("open the authoritative Stage 2 production source")
    scene = bpy.context.scene
    current_hash = stage1.sha256(config["blend"])
    if current_hash != config["stage2Sha256"] and scene.get("stage_3_started") is True:
        surface = bpy.data.objects.get(config["surface"])
        rig = bpy.data.objects.get(f"{hero}_PRODUCTION_RIG_STAGE_3")
        if not surface or not rig:
            raise RuntimeError("existing Stage 3 source is incomplete")
        before = stage1.mesh_fingerprint(surface)
        pivot_correction = align_body_pivots_to_locked_bind(hero, rig)
        bind_correction = configure_bind_safe_constraints(rig)
        weight_report = migrate_weights(hero, surface, rig)
        corrective_report = build_correctives(hero, surface, rig)
        pose_review = render_stress_sheet(hero, surface, rig, config["preview"])
        reset_static_pose(rig)
        if before != stage1.mesh_fingerprint(surface) or bpy.data.actions:
            raise RuntimeError("Stage 3 bind refresh changed the locked base or authored actions")
        scene["asset_version"] = "0.4.0-stage-3-in-progress"
        scene["production_stage"] = "stage-3-deformation-diagnostic-manual-correction-required"
        scene["stage_3_pass"] = False
        scene["skinning_complete"] = False
        scene["corrective_system_complete"] = False
        scene["unresolved_stage_3_issues"] = "disconnected layered surface islands require manual production weight painting and local topology cleanup"
        bpy.ops.wm.save_as_mainfile(filepath=str(config["blend"]), relative_remap=True)
        inventory = json.loads(config["inventory"].read_text(encoding="utf-8"))
        inventory["sourceFile"]["sha256"] = stage1.sha256(config["blend"])
        inventory["sourceFile"]["bytes"] = config["blend"].stat().st_size
        inventory["bindCorrection"] = bind_correction
        inventory["pivotCorrection"] = pivot_correction
        inventory["skinning"] = weight_report
        inventory.pop("weightMigration", None)
        inventory["correctives"] = corrective_report
        inventory["stressPoseReview"] = pose_review
        inventory["status"] = "stage-3-in-progress-visual-deformation-gate-failed"
        inventory["stage3Pass"] = False
        inventory["unresolvedStage3Issues"] = [
            "manual shoulder, armpit, torso, hip, and knee weight painting is required",
            "disconnected garment islands open visible holes under stress poses",
            "Stage 4, Stage 5, candidate export, runtime switch, and final animation remain blocked",
        ]
        config["inventory"].write_text(json.dumps(inventory, indent=2)+"\n", encoding="utf-8")
        return inventory
    if current_hash != config["stage2Sha256"]:
        raise RuntimeError("Stage 2 source hash changed before Stage 3")
    if scene.get("stage_2_pass") is not True or scene.get("stage_3_started") is not False:
        raise RuntimeError("Stage 2 gate is not in the required passed/unstarted state")
    surface = bpy.data.objects.get(config["surface"])
    rig = bpy.data.objects.get(config["rig"])
    if not surface or not rig:
        raise RuntimeError("Stage 2 surface or rig missing")
    stage2_inventory = json.loads(config["stage2Inventory"].read_text(encoding="utf-8"))
    before = stage1.mesh_fingerprint(surface)
    if before != stage2_inventory["lockedBaseline"]["surfaceFingerprint"]:
        raise RuntimeError("locked base geometry/material/UV fingerprint changed")
    if bpy.data.actions:
        raise RuntimeError("Stage 3 must not contain animation actions")
    created_twists = add_twist_deformers(rig)
    pivot_correction = align_body_pivots_to_locked_bind(hero, rig)
    weight_report = migrate_weights(hero, surface, rig)
    modifier_report = add_armature_and_smoothing(surface, rig)
    bind_correction = configure_bind_safe_constraints(rig)
    corrective_report = build_correctives(hero, surface, rig)
    pose_review = render_stress_sheet(hero, surface, rig, config["preview"])
    reset_static_pose(rig)
    after = stage1.mesh_fingerprint(surface)
    if before != after:
        raise RuntimeError("Stage 3 altered locked base positions, topology, materials, or UVs")
    if bpy.data.actions:
        raise RuntimeError("Stage 3 illegally authored animation actions")
    rig.name = f"{hero}_PRODUCTION_RIG_STAGE_3"
    rig.data.name = rig.name + "_DATA"
    scene["asset_version"] = "0.4.0-stage-3-in-progress"
    scene["production_stage"] = "stage-3-deformation-diagnostic-manual-correction-required"
    scene["stage_3_started"] = True
    scene["stage_3_pass"] = False
    scene["stage_4_started"] = False
    scene["stage_5_started"] = False
    scene["final_animation_blocked"] = True
    scene["runtime_switch_authorized"] = False
    scene["skinning_started"] = True
    scene["skinning_complete"] = False
    scene["topology_base_preserved"] = True
    scene["corrective_system_complete"] = False
    scene["stage_5_pose_gate_pass"] = False
    scene["candidate_export_allowed"] = False
    scene["unresolved_stage_3_issues"] = "disconnected layered surface islands require manual production weight painting and local topology cleanup"
    surface["locked_visible_identity"] = True
    surface["production_skinning_stage"] = 3
    surface["base_topology_preserved"] = True
    surface["production_weight_groups"] = len(weight_report["productionGroups"])
    stage1.pack_dependencies()
    bpy.ops.wm.save_as_mainfile(filepath=str(config["blend"]), relative_remap=True)
    inventory = {
        "schemaVersion": 1,
        "hero": hero,
        "status": "stage-3-in-progress-visual-deformation-gate-failed",
        "blenderVersion": bpy.app.version_string,
        "sourceFile": {"path": config["blend"].relative_to(ROOT).as_posix(), "sha256": stage1.sha256(config["blend"]), "bytes": config["blend"].stat().st_size},
        "lockedIdentity": {"changed": False, "baseFingerprint": after, "basePositionsTopologyMaterialsUvsPreserved": True, "canonicalHeightMetres": config["height"]},
        "rig": {"object": rig.name, "armature": stage1.armature_inventory(rig), "newTwistDeformers": created_twists},
        "pivotCorrection": pivot_correction,
        "skinning": weight_report,
        "modifiers": modifier_report,
        "bindCorrection": bind_correction,
        "correctives": corrective_report,
        "stressPoseReview": pose_review,
        "topologyDecision": {"baseTopologyEdited": False, "reason": "locked high-density source already supports smooth deformation; preserve identity and use production weights, twist distribution, pose correctives and corrective smoothing rather than destructive remeshing", "hardRegionSeamsIntroduced": False},
        "actions": 0,
        "stage3Pass": False,
        "stage4Started": False,
        "stage5Started": False,
        "stage5Pass": False,
        "candidateExportAllowed": False,
        "runtimeSwitchAuthorized": False,
        "finalAnimationAllowed": False,
        "unresolvedStage3Issues": [
            "manual shoulder, armpit, torso, hip, and knee weight painting is required",
            "disconnected garment islands open visible holes under stress poses",
            "Stage 4, Stage 5, candidate export, runtime switch, and final animation remain blocked",
        ],
    }
    config["inventory"].write_text(json.dumps(inventory, indent=2)+"\n", encoding="utf-8")
    return inventory


def main():
    result = finalize(arguments().hero)
    counts = result["rig"]["armature"]["counts"]
    print("CODEX_STAGE_3_DIAGNOSTIC=" + json.dumps({"hero": result["hero"], "status": result["status"], "counts": counts, "correctives": len(result["correctives"]), "stressPoses": result["stressPoseReview"]["poseCount"]}))


if __name__ == "__main__":
    main()
