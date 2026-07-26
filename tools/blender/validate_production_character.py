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
GENERATION = "production-mannequin-fitted-v4"
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
        "constructionPriority": "mannequin-rig-action-first",
        "fitAuthority": SPEC_ID,
        "mannequinSpecHash": spec_hash(),
        "maximumJointAlignmentErrorFraction": 0.03,
        "sharedWorldScaleCamera": True,
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
        f"GEO_{hero}_head",
        f"GEO_{hero}_hand_L", f"GEO_{hero}_hand_R",
        f"GEO_{hero}_boot_shaft_L", f"GEO_{hero}_boot_shaft_R",
        f"GEO_{hero}_boot_toe_L", f"GEO_{hero}_boot_toe_R",
        f"GEO_{hero}_boot_sole_L", f"GEO_{hero}_boot_sole_R",
        f"GEO_{hero}_hat_brim", f"GEO_{hero}_hat_crown",
    }
    if hero == "Hargold":
        required_objects |= {
            "GEO_Hargold_rounded_beard", "GEO_Hargold_feather",
            "GEO_Hargold_short_cape", "GEO_Hargold_backpack",
            "GEO_Hargold_backpack_leaf_badge", "GEO_Hargold_bedroll",
            "GEO_Hargold_pack_rope",
        }
    else:
        required_objects |= {
            "GEO_Mebble_long_neck", "GEO_Mebble_adams_apple",
            "GEO_Mebble_glasses_L", "GEO_Mebble_glasses_R",
            "GEO_Mebble_cape", "GEO_Mebble_cape_emblem",
            "GEO_Mebble_hair_mass",
        }
    missing_objects = sorted(required_objects - set(bpy.data.objects.keys()))
    if missing_objects:
        errors.append("missing locked silhouette surfaces: " + ", ".join(missing_objects))

    silhouette_thresholds = (
        {
            "hand": 0.18,
            "sleeve": 0.48,
            "boot_toe": 0.40,
        }
        if hero == "Hargold"
        else {
            "hand": 0.145,
            "sleeve": 0.68,
            "boot_toe": 0.35,
        }
    )
    for side in ("L", "R"):
        hand = bpy.data.objects.get(f"GEO_{hero}_hand_{side}")
        sleeve = bpy.data.objects.get(f"GEO_{hero}_sleeve_{side}")
        boot_toe = bpy.data.objects.get(f"GEO_{hero}_boot_toe_{side}")
        if hand and hand.dimensions.x < silhouette_thresholds["hand"]:
            errors.append(f"{hand.name} is too small for 100-150 px gameplay readability")
        if sleeve:
            sleeve_profile_length = (
                float(sleeve.dimensions.x) ** 2
                + float(sleeve.dimensions.z) ** 2
            ) ** 0.5
            if sleeve_profile_length < silhouette_thresholds["sleeve"]:
                errors.append(
                    f"{sleeve.name} is too short for action silhouette readability"
                )
        if boot_toe and boot_toe.dimensions.y < silhouette_thresholds["boot_toe"]:
            errors.append(f"{boot_toe.name} lacks the required stable ground-contact length")
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
    if hero == "Mebble" and glb.get("morphTargets", 0) < 1:
        errors.append("Mebble runtime GLB has no cape glide morph target")

    if scene.get("reviewStatus") not in {
        "mannequin-fitted-staging-visual-approval-required",
        "mannequin-fitted-candidate-active-visual-approval-pending",
        "locked-mannequin-fitted-staging-visual-approval-required",
        "locked-mannequin-fitted-candidate-active-visual-approval-pending",
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
