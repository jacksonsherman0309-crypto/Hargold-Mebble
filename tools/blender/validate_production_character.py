"""Validate clean-room production-staging character assets.

Run with:
  blender --background path/to/hero_character.blend --python \
    tools/blender/validate_production_character.py
"""

from __future__ import annotations

import json
import struct
import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from animation_mannequin_spec import (
    FRAME_SPECS,
    REVIEW_FRAMES,
    SPEC_ID,
    review_camera,
    review_frame,
    spec_hash,
)


ROOT = Path(__file__).resolve().parents[2]
GENERATION = "production-organic-silhouette-v5"
JOINT_DEFORMATION_PASS = "preserve-volume-local-corrective-v1"
SHARED_ACTIONS = {
    "idle", "walk", "run", "sprint", "start", "stop", "turn-low", "skid",
    "takeoff", "rise", "apex", "fall", "land-soft", "land-hard",
    "landing-recovery", "jump-running", "jump-triple-1", "jump-triple-2",
    "jump-triple-3", "wall-reaction", "ledge-stop", "crouch", "crawl",
    "stand", "duck", "duck-slide", "slope-slide", "rolling-momentum",
    "slide-jump", "spin-jump", "air-spin", "fast-fall", "ground-slam",
    "stomp-bounce", "swim", "dive", "surface-breach", "look-up",
    "climb-fence", "climb-vine", "climb-ladder", "climb-detach",
    "rope-grab", "rope-swing", "rope-climb", "rope-release",
    "carry-light-idle", "carry-light-walk", "carry-heavy-idle",
    "carry-heavy-walk", "carry-jump", "drop", "throw", "hurt",
    "knockback", "defeat", "swap-in", "swap-out", "victory",
}


def validate_glb(path: Path, minimum_actions: int, errors: list[str]) -> dict:
    if not path.exists():
        errors.append(f"missing runtime GLB: {path}")
        return {}
    payload = path.read_bytes()
    if len(payload) < 20:
        errors.append("runtime GLB is truncated")
        return {}
    magic, version, declared_length = struct.unpack_from("<4sII", payload, 0)
    json_length, json_type = struct.unpack_from("<II", payload, 12)
    if magic != b"glTF" or version != 2 or declared_length != len(payload) or json_type != 0x4E4F534A:
        errors.append("runtime export is not a valid GLB 2.0 container")
        return {}
    document = json.loads(payload[20:20 + json_length].decode("utf-8").rstrip("\x00 "))
    summary = {
        "bytes": len(payload),
        "nodes": len(document.get("nodes", [])),
        "meshes": len(document.get("meshes", [])),
        "skins": len(document.get("skins", [])),
        "animations": len(document.get("animations", [])),
        "morphTargets": sum(
            len(primitive.get("targets", []))
            for mesh in document.get("meshes", [])
            for primitive in mesh.get("primitives", [])
        ),
    }
    if summary["skins"] < 1:
        errors.append("runtime GLB has no armature skin")
    if summary["animations"] < minimum_actions:
        errors.append(
            f"runtime GLB has {summary['animations']} animations; expected at least {minimum_actions}"
        )
    return summary


def connected_component_sizes(mesh) -> list[int]:
    adjacency = [[] for _ in mesh.vertices]
    for edge in mesh.edges:
        first, second = edge.vertices
        adjacency[first].append(second)
        adjacency[second].append(first)
    seen = set()
    sizes = []
    for start in range(len(adjacency)):
        if start in seen:
            continue
        stack = [start]
        seen.add(start)
        size = 0
        while stack:
            vertex = stack.pop()
            size += 1
            for neighbor in adjacency[vertex]:
                if neighbor not in seen:
                    seen.add(neighbor)
                    stack.append(neighbor)
        sizes.append(size)
    return sorted(sizes, reverse=True)


def validate() -> dict:
    source = Path(bpy.data.filepath)
    hero = source.stem.removesuffix("_character").capitalize()
    errors: list[str] = []
    warnings: list[str] = []
    scene = bpy.context.scene
    target_height = FRAME_SPECS.get(hero, {}).get("heightMetres")
    armature = bpy.data.objects.get(f"RIG_{hero.upper()}")
    if armature is None or armature.type != "ARMATURE":
        errors.append(f"missing RIG_{hero.upper()} armature")
        return {"hero": hero, "errors": errors}
    if armature.animation_data:
        armature.animation_data.action = None
    face_control = armature.pose.bones.get("CTRL_face")
    if face_control:
        for prop in (
            "blink_L", "blink_R", "smile", "mouth_open",
            "brow_raise_L", "brow_raise_R",
        ):
            if prop in face_control:
                face_control[prop] = 0.0
    cape_control = armature.pose.bones.get("CTRL_cape.01")
    if cape_control and "cape_open" in cape_control:
        cape_control["cape_open"] = 0.0
    scene.frame_set(0)
    bpy.context.view_layer.update()

    expected_scene = {
        "geometryGeneration": GENERATION,
        "sourceScene": "factory-empty",
        "reusesPriorGeometry": False,
        "runtimeNormalizationScale": 1.0,
        "negativeScaleMirroring": False,
        "silhouetteValidationPixels": "100-150",
        "constructionPriority": "locked-silhouette-organic-deformation-first",
        "fitAuthority": SPEC_ID,
        "mannequinSpecHash": spec_hash(),
        "maximumJointAlignmentErrorFraction": 0.03,
        "sharedWorldScaleCamera": True,
        "animationPolishStatus": "frozen-pending-model-approval",
        "bodyConstruction": "single-continuous-organic-union",
        "garmentConstruction": "continuous-wrapped-deforming-layers",
        "bootConstruction": "single-piece-rounded-union",
        "jointDeformationPass": JOINT_DEFORMATION_PASS,
        "jointDeformationImplementation": "implemented-structural-stress-review-pending",
        "jointDeformationVisualApproval": False,
    }
    for key, expected in expected_scene.items():
        if scene.get(key) != expected:
            errors.append(f"scene {key} must be {expected!r}; got {scene.get(key)!r}")
    expected_reference_hash = (
        "4004C659783AC41ED09E6AF18D25F776DFB19BE44B9E7066289627E016A7B4E4"
        if hero == "Hargold"
        else "1A85C41AFC53061612B772F221A3F354E4E58C015F4753AFF2C3C44EC80662D0"
    )
    for key in ("assetVersion", "canonVersion", "author", "blenderVersion"):
        if not scene.get(key):
            errors.append(f"scene metadata is missing {key}")
    if scene.get("referenceHash") != expected_reference_hash:
        errors.append("scene referenceHash does not match the locked sheet")
    if target_height is None or abs(float(scene.get("targetGameplayHeightMetres", -1)) - target_height) > 1e-6:
        errors.append("scene gameplay height does not match the locked metre target")

    camera = bpy.data.objects.get("QA_Camera")
    camera_contract = review_camera()
    if camera is None or camera.type != "CAMERA":
        errors.append("missing fixed QA_Camera")
    else:
        if camera.data.type != "ORTHO":
            errors.append("QA_Camera must remain orthographic")
        if abs(camera.data.ortho_scale - camera_contract["orthoScale"]) > 1e-5:
            errors.append("QA_Camera does not use the shared world-scale crop")

    reference = bpy.data.objects.get(f"REF_{hero}_locked_sheet")
    if reference is None or reference.type != "EMPTY" or not reference.get("locked_reference"):
        errors.append("locked character sheet is not loaded as a protected reference object")

    required_bones = {
        "Root", "DEF_center_of_mass", "DEF_hips",
        "DEF_spine_lower", "DEF_spine_mid", "DEF_spine_upper",
        "DEF_chest", "DEF_neck_base", "DEF_neck_mid", "DEF_neck_upper",
        "DEF_head", "DEF_clavicle.L", "DEF_clavicle.R",
        "DEF_jaw", "DEF_eye.L", "DEF_eye.R", "DEF_brow.L", "DEF_brow.R",
        "DEF_hand.L", "DEF_hand.R", "DEF_toe.L", "DEF_toe.R",
        "CTRL_root", "CTRL_face", "CTRL_eyes", "CTRL_hand_ik.L",
        "CTRL_hand_ik.R", "CTRL_foot_ik.L", "CTRL_foot_ik.R",
        "CTRL_hat_secondary",
    }
    if hero == "Hargold":
        required_bones |= {
            "DEF_backpack", "DEF_backpack_gear", "CTRL_backpack_follow",
            "DEF_feather", "DEF_scarf_tail.L", "DEF_scarf_tail.R",
        }
    else:
        required_bones |= {
            "DEF_adams_apple", "DEF_cape.01", "DEF_cape.02", "DEF_cape.03",
            "CTRL_cape.01", "CTRL_cape.02", "CTRL_cape.03",
        }
    missing_bones = sorted(required_bones - set(armature.data.bones.keys()))
    if missing_bones:
        errors.append("missing production bones: " + ", ".join(missing_bones))

    locked_rig_name = scene.get("lockedMannequinRig")
    locked_rig = bpy.data.objects.get(locked_rig_name) if locked_rig_name else None
    maximum_joint_error_fraction = 1.0
    alignment_bones = {
        "Root", "DEF_hips", "DEF_spine_lower", "DEF_spine_upper",
        "DEF_neck_base", "DEF_neck_mid", "DEF_neck_upper", "DEF_head",
        "DEF_clavicle.L", "DEF_clavicle.R", "DEF_upper_arm.L",
        "DEF_upper_arm.R", "DEF_forearm.L", "DEF_forearm.R",
        "DEF_hand.L", "DEF_hand.R", "DEF_thigh.L", "DEF_thigh.R",
        "DEF_shin.L", "DEF_shin.R", "DEF_foot.L", "DEF_foot.R",
        "DEF_toe.L", "DEF_toe.R",
    }
    if locked_rig is None or locked_rig.type != "ARMATURE":
        errors.append("missing immutable duplicated mannequin reference rig")
    else:
        joint_errors = []
        for bone_name in alignment_bones:
            fitted_bone = armature.data.bones.get(bone_name)
            locked_bone = locked_rig.data.bones.get(bone_name)
            if fitted_bone is None or locked_bone is None:
                continue
            joint_errors.extend((
                (fitted_bone.head_local - locked_bone.head_local).length,
                (fitted_bone.tail_local - locked_bone.tail_local).length,
            ))
        maximum_joint_error_fraction = max(joint_errors, default=0.0) / target_height
        if maximum_joint_error_fraction > 0.03:
            errors.append(
                "fitted/reference joint error exceeds 3% of total height: "
                f"{maximum_joint_error_fraction:.5f}"
            )

    visible = [
        obj
        for collection_name in ("GEO", "ATTACHMENTS")
        for obj in bpy.data.collections.get(collection_name, ()).objects
        if not obj.hide_render and obj.type in {"MESH", "CURVE"}
    ]
    if len(visible) < 45:
        errors.append(f"production surface set is unexpectedly sparse: {len(visible)} objects")

    mesh_objects = [obj for obj in visible if obj.type == "MESH"]
    vertices = sum(len(obj.data.vertices) for obj in mesh_objects)
    polygons = sum(len(obj.data.polygons) for obj in mesh_objects)
    quads = sum(
        1 for obj in mesh_objects for polygon in obj.data.polygons
        if len(polygon.vertices) == 4
    )
    quad_ratio = quads / max(1, polygons)
    if vertices < 6500:
        errors.append(f"visible mesh density is below the staging floor: {vertices} vertices")
    if vertices > 90000:
        errors.append(f"visible mesh density exceeds the mobile production ceiling: {vertices} vertices")
    if quad_ratio < 0.72:
        errors.append(f"authored mesh quad ratio is too low: {quad_ratio:.3f}")

    for obj in visible:
        if obj.get("geometry_generation") != GENERATION:
            errors.append(f"{obj.name} lacks production geometry provenance")
        if obj.get("source_geometry_reused") is not False:
            errors.append(f"{obj.name} does not explicitly reject prior geometry reuse")
        if any(abs(float(component) - 1.0) > 1e-6 for component in obj.scale):
            errors.append(f"{obj.name} has unapplied object scale {tuple(obj.scale)}")
        if obj.type == "MESH":
            if not obj.data.uv_layers:
                errors.append(f"{obj.name} has no UV map")
            if any(not polygon.use_smooth for polygon in obj.data.polygons):
                errors.append(f"{obj.name} contains non-smooth visible polygons")
            deforming = any(
                modifier.type == "ARMATURE" and modifier.object == armature
                for modifier in obj.modifiers
            )
            rigid_attachment = obj.parent == armature and obj.parent_type == "BONE"
            if not deforming and not rigid_attachment:
                errors.append(f"{obj.name} is not bound to the production rig")

    required_objects = {
        f"GEO_{hero}_skin_body",
        f"GEO_{hero}_trousers",
        f"GEO_{hero}_boot_L", f"GEO_{hero}_boot_R",
        f"GEO_{hero}_hat_brim", f"GEO_{hero}_hat_crown",
    }
    if hero == "Hargold":
        required_objects |= {
            "GEO_Hargold_jacket", "GEO_Hargold_shirt_panel",
            "GEO_Hargold_rounded_beard", "GEO_Hargold_feather",
            "GEO_Hargold_short_cape", "GEO_Hargold_backpack",
            "GEO_Hargold_backpack_pocket",
            "GEO_Hargold_backpack_leaf_badge", "GEO_Hargold_bedroll",
            "GEO_Hargold_pack_rope",
        }
    else:
        required_objects |= {
            "GEO_Mebble_shirt", "GEO_Mebble_vest",
            "GEO_Mebble_glasses_L", "GEO_Mebble_glasses_R",
            "GEO_Mebble_cape", "GEO_Mebble_cape_emblem",
            "GEO_Mebble_hair_mass",
        }
    missing_objects = sorted(required_objects - set(bpy.data.objects.keys()))
    if missing_objects:
        errors.append("missing locked silhouette surfaces: " + ", ".join(missing_objects))

    body = bpy.data.objects.get(f"GEO_{hero}_skin_body")
    if body:
        components = connected_component_sizes(body.data)
        if len(components) != 1:
            errors.append(
                f"{body.name} must be one connected anatomical surface; "
                f"found {len(components)} components"
            )
        if body.get("surface_role") != "single-continuous-organic-body":
            errors.append(f"{body.name} lacks the continuous-body surface role")
        if body.get("watertight_union") is not True:
            errors.append(f"{body.name} is not marked as a watertight union")
        if body.get("silhouette_authority") not in {
            "locked-compact-mannequin",
            "locked-tall-mannequin",
        }:
            errors.append(f"{body.name} lacks locked silhouette provenance")
        deform_groups = {
            "DEF_head", "DEF_neck_upper", "DEF_chest", "DEF_hips",
            "DEF_upper_arm.L", "DEF_upper_arm.R",
            "DEF_forearm.L", "DEF_forearm.R",
            "DEF_hand.L", "DEF_hand.R",
            "DEF_thigh.L", "DEF_thigh.R",
            "DEF_shin.L", "DEF_shin.R",
        }
        for side in ("L", "R"):
            for finger in ("thumb", "index", "middle", "ring", "pinky"):
                deform_groups.add(f"DEF_{finger}.01.{side}")
                deform_groups.add(f"DEF_{finger}.02.{side}")
        missing_groups = sorted(
            group for group in deform_groups
            if body.vertex_groups.get(group) is None
        )
        if missing_groups:
            errors.append(
                f"{body.name} lacks integrated deform groups: "
                + ", ".join(missing_groups)
            )
        if hero == "Mebble":
            if body.get("neck_visibility_priority") is not True:
                errors.append("Mebble body does not lock long-neck profile visibility")
            if body.vertex_groups.get("DEF_adams_apple") is None:
                errors.append("Mebble integrated body lacks Adam's apple deformation")
        required_joint_groups = {
            "CORR_shoulders", "CORR_elbows", "CORR_hips",
            "CORR_knees", "CORR_ankles",
        }
        missing_joint_groups = sorted(
            group_name
            for group_name in required_joint_groups
            if body.vertex_groups.get(group_name) is None
        )
        if missing_joint_groups:
            errors.append(
                f"{body.name} lacks localized joint corrective groups: "
                + ", ".join(missing_joint_groups)
            )
        corrective_zones = {
            modifier.name.removeprefix("JointCorrective_").lower()
            for modifier in body.modifiers
            if modifier.type == "CORRECTIVE_SMOOTH"
            and modifier.name.startswith("JointCorrective_")
        }
        missing_correctives = sorted(
            zone
            for zone in ("shoulders", "elbows", "hips", "knees", "ankles")
            if zone not in corrective_zones
        )
        if missing_correctives:
            errors.append(
                f"{body.name} lacks corrective-smooth joint zones: "
                + ", ".join(missing_correctives)
            )
        armature_modifiers = [
            modifier
            for modifier in body.modifiers
            if modifier.type == "ARMATURE" and modifier.object == armature
        ]
        if not armature_modifiers or not all(
            modifier.use_deform_preserve_volume
            for modifier in armature_modifiers
        ):
            errors.append(f"{body.name} must use preserve-volume armature deformation")

    bendy_bone_segments = {
        "DEF_clavicle.L": 3, "DEF_clavicle.R": 3,
        "DEF_upper_arm.L": 5, "DEF_upper_arm.R": 5,
        "DEF_forearm.L": 4, "DEF_forearm.R": 4,
        "DEF_thigh.L": 5, "DEF_thigh.R": 5,
        "DEF_shin.L": 4, "DEF_shin.R": 4,
        "DEF_foot.L": 3, "DEF_foot.R": 3,
    }
    for bone_name, minimum_segments in bendy_bone_segments.items():
        bone = armature.data.bones.get(bone_name)
        if bone is None or bone.bbone_segments < minimum_segments:
            errors.append(
                f"{bone_name} needs at least {minimum_segments} B-Bone deformation segments"
            )

    joint_target_zones = {
        (
            "GEO_Hargold_jacket"
            if hero == "Hargold"
            else "GEO_Mebble_shirt"
        ): ("shoulders", "elbows"),
        f"GEO_{hero}_trousers": ("hips", "knees"),
        f"GEO_{hero}_boot_L": ("ankles",),
        f"GEO_{hero}_boot_R": ("ankles",),
    }
    for object_name, zones in joint_target_zones.items():
        obj = bpy.data.objects.get(object_name)
        if obj is None:
            continue
        armature_modifiers = [
            modifier
            for modifier in obj.modifiers
            if modifier.type == "ARMATURE" and modifier.object == armature
        ]
        if not armature_modifiers or not all(
            modifier.use_deform_preserve_volume
            for modifier in armature_modifiers
        ):
            errors.append(f"{object_name} must use preserve-volume armature deformation")
        for zone in zones:
            if obj.vertex_groups.get(f"CORR_{zone}") is None:
                errors.append(f"{object_name} lacks CORR_{zone}")
            if obj.modifiers.get(f"JointCorrective_{zone.capitalize()}") is None:
                errors.append(f"{object_name} lacks JointCorrective_{zone.capitalize()}")

    pose_space_targets = {
        f"GEO_{hero}_skin_body": (
            "shoulders", "elbows", "hips", "knees", "ankles",
        ),
        (
            "GEO_Hargold_jacket"
            if hero == "Hargold"
            else "GEO_Mebble_shirt"
        ): ("shoulders", "elbows", "hips"),
        f"GEO_{hero}_trousers": ("hips", "knees", "ankles"),
        f"GEO_{hero}_boot_L": ("ankles",),
        f"GEO_{hero}_boot_R": ("ankles",),
    }
    if hero == "Mebble":
        pose_space_targets["GEO_Mebble_vest"] = ("shoulders", "hips")
    for object_name, zones in pose_space_targets.items():
        obj = bpy.data.objects.get(object_name)
        shape_keys = obj.data.shape_keys if obj and obj.type == "MESH" else None
        if shape_keys is None:
            errors.append(f"{object_name} has no pose-space corrective shape keys")
            continue
        basis = shape_keys.key_blocks.get("Basis")
        for zone in zones:
            sides = (
                (object_name.rsplit("_", 1)[-1],)
                if f"GEO_{hero}_boot_" in object_name
                else ("L", "R")
            )
            for side in sides:
                key_name = f"CORR_{zone.capitalize()}Volume.{side}"
                key = shape_keys.key_blocks.get(key_name)
                if key is None:
                    errors.append(f"{object_name} lacks {key_name}")
                    continue
                expected_path = f'key_blocks["{key_name}"].value'
                has_driver = bool(
                    shape_keys.animation_data
                    and any(
                        driver.data_path == expected_path
                        for driver in shape_keys.animation_data.drivers
                    )
                )
                if not has_driver:
                    errors.append(f"{object_name}.{key_name} is not bend-driven")
                if basis is not None:
                    maximum_delta = max(
                        (
                            key.data[index].co - basis.data[index].co
                        ).length
                        for index in range(len(key.data))
                    )
                    if maximum_delta > 0.12:
                        errors.append(
                            f"{object_name}.{key_name} has excessive "
                            f"{maximum_delta:.6f}m Basis delta"
                        )

    garment = bpy.data.objects.get(
        "GEO_Hargold_jacket" if hero == "Hargold" else "GEO_Mebble_shirt"
    )
    if garment and not str(garment.get("surface_role", "")).startswith(
        "continuous-wrapped"
    ):
        errors.append(f"{garment.name} is not a continuous wrapped garment")

    silhouette_thresholds = {
        "body_width": 1.55 if hero == "Hargold" else 1.25,
        "boot_length": 0.42 if hero == "Hargold" else 0.50,
    }
    if body and body.dimensions.x < silhouette_thresholds["body_width"]:
        errors.append(f"{body.name} lacks the required arm/hand silhouette span")
    for side in ("L", "R"):
        boot = bpy.data.objects.get(f"GEO_{hero}_boot_{side}")
        if boot:
            if boot.get("surface_role") != "single-piece-organic-boot":
                errors.append(f"{boot.name} is not a unified organic boot")
            if boot.dimensions.y < silhouette_thresholds["boot_length"]:
                errors.append(f"{boot.name} lacks the required stable ground-contact length")
    if hero == "Mebble":
        cape = bpy.data.objects.get("GEO_Mebble_cape")
        if cape and cape.get("shoulder_yoke") != "curved-wrapped":
            errors.append("Mebble cape is missing its curved shoulder yoke")

    materials = {
        material
        for obj in visible
        for material in getattr(obj.data, "materials", ())
        if material
    }
    material_classes = {material.get("material_class") for material in materials}
    for required_class in ("skin", "woven-fabric", "leather", "metal"):
        if required_class not in material_classes:
            errors.append(f"missing PBR material class: {required_class}")
    for material in materials:
        image_nodes = [
            node for node in material.node_tree.nodes
            if node.bl_idname == "ShaderNodeTexImage" and node.image
        ] if material.use_nodes else []
        if material.get("pbr_texture_resolution") != 1024 or len(image_nodes) < 4:
            errors.append(f"{material.name} lacks the required 1K PBR node set")

    required_actions = set(SHARED_ACTIONS)
    required_actions |= (
        {"double-jump", "break-hargold-block", "heavy-ground-slam", "stonefist-strike"}
        if hero == "Hargold"
        else {"glide-open", "glide-sustain", "glide-steer-left", "glide-steer-right", "glide-close"}
    )
    required_actions |= {
        frame["action"]
        for row in REVIEW_FRAMES
        if (frame := review_frame(hero, row["key"])) is not None
        and frame.get("action")
    }
    action_names = set(bpy.data.actions.keys())
    missing_actions = sorted(required_actions - action_names)
    if missing_actions:
        errors.append("missing gameplay actions: " + ", ".join(missing_actions))
    for name in required_actions & action_names:
        action = bpy.data.actions[name]
        if action.get("clean_room_animation") is not True:
            errors.append(f"{name} is not marked clean-room authored")
        if action.get("negative_scale_mirroring") is not False:
            errors.append(f"{name} permits forbidden negative-scale mirroring")
        if action.get("locked_frame_source") != SPEC_ID:
            errors.append(f"{name} is not bound to the locked mannequin frame source")

    export_directory = (
        ROOT / "assets" / "exports" / "production-staging"
        if source.parent.name == "production-staging"
        else ROOT / "assets" / "exports"
    )
    export_path = export_directory / f"{hero.lower()}_character.glb"
    glb = validate_glb(export_path, len(required_actions), errors)
    # One ankle corrective belongs on each separate boot object; every
    # connected body/soft-garment region carries left and right keys.
    minimum_morph_targets = 26 if hero == "Hargold" else 31
    if glb.get("morphTargets", 0) < minimum_morph_targets:
        errors.append(
            f"{hero} runtime GLB has {glb.get('morphTargets', 0)} morph targets; "
            f"expected at least {minimum_morph_targets} including joint correctives"
        )

    if scene.get("reviewStatus") not in {
        "mannequin-fitted-staging-visual-approval-required",
        "mannequin-fitted-candidate-active-visual-approval-pending",
        "locked-mannequin-fitted-staging-visual-approval-required",
        "locked-mannequin-fitted-candidate-active-visual-approval-pending",
        "organic-silhouette-staging-visual-approval-required",
        "organic-silhouette-candidate-active-visual-approval-pending",
        "approved-production-character",
    }:
        warnings.append("review status is outside the production approval workflow")

    return {
        "hero": hero,
        "blend": str(source),
        "geometryGeneration": scene.get("geometryGeneration"),
        "sourceScene": scene.get("sourceScene"),
        "reusesPriorGeometry": scene.get("reusesPriorGeometry"),
        "targetGameplayHeightMetres": scene.get("targetGameplayHeightMetres"),
        "bones": len(armature.data.bones),
        "actions": len(bpy.data.actions),
        "visibleObjects": len(visible),
        "meshObjects": len(mesh_objects),
        "vertices": vertices,
        "polygons": polygons,
        "quadRatio": round(quad_ratio, 4),
        "maximumJointAlignmentErrorFraction": round(maximum_joint_error_fraction, 6),
        "jointDeformationPass": scene.get("jointDeformationPass"),
        "jointDeformationVisualApproval": scene.get("jointDeformationVisualApproval"),
        "materials": len(materials),
        "materialClasses": sorted(value for value in material_classes if value),
        "glb": glb,
        "warnings": warnings,
        "errors": errors,
        "structuralPass": not errors,
        "visualApproval": "separate human/art-direction gate",
    }


if __name__ == "__main__":
    result = validate()
    print("HM_PRODUCTION_CHARACTER_VALIDATION " + json.dumps(result, sort_keys=True))
    if result["errors"]:
        sys.exit(1)
