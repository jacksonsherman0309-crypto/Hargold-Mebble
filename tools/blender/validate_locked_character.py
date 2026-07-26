"""Strict structural checks for generated locked-reference character assets."""

from __future__ import annotations

import json
import struct
import sys
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]

SHARED_REPLACEMENT_CLIPS = {
    "idle", "walk", "run", "sprint", "start", "stop", "turn-low", "skid",
    "takeoff", "rise", "apex", "fall", "land-soft", "land-hard",
    "landing-recovery", "jump-running", "jump-triple-1", "jump-triple-2",
    "jump-triple-3", "wall-reaction",
    "ledge-stop", "crouch", "crawl", "stand", "duck", "duck-slide",
    "slope-slide", "rolling-momentum", "slide-jump", "spin-jump", "air-spin",
    "fast-fall", "ground-slam", "stomp-bounce", "swim", "dive",
    "surface-breach", "look-up", "climb-fence", "climb-vine",
    "climb-ladder", "climb-detach", "rope-grab", "rope-swing", "rope-climb",
    "rope-release", "carry-light-idle", "carry-light-walk",
    "carry-heavy-idle", "carry-heavy-walk", "carry-jump", "drop", "throw",
    "hurt", "knockback", "defeat", "swap-in", "swap-out", "victory"
}


def fail(message: str, errors: list[str]) -> None:
    errors.append(message)


def force_driver_evaluation(armature) -> None:
    armature.update_tag()
    frame = bpy.context.scene.frame_current
    bpy.context.scene.frame_set(frame + 1)
    bpy.context.scene.frame_set(frame)
    bpy.context.view_layer.update()


def validate() -> dict:
    errors: list[str] = []
    source = Path(bpy.data.filepath)
    hero = source.stem.removesuffix("_character").capitalize()
    arm = bpy.data.objects.get(f"RIG_{hero.upper()}")
    if arm is None or arm.type != "ARMATURE":
        return {"hero": hero, "errors": [f"missing armature for {hero}"]}
    reference = bpy.data.objects.get(f"REF_{hero}_locked_sheet")
    if not reference or reference.type != "EMPTY" or reference.empty_display_type != "IMAGE":
        fail("locked sheet is not loaded as a REF image object", errors)
    elif not reference.get("locked_reference") or not reference.hide_render:
        fail("locked REF image is not protected from rendering/export", errors)

    required_bones = {
        "Root", "DEF_hips", "DEF_spine", "DEF_chest", "DEF_neck", "DEF_head",
        "DEF_jaw", "DEF_eye.L", "DEF_eye.R", "DEF_lid.L", "DEF_lid.R",
        "DEF_brow.L", "DEF_brow.R", "DEF_mouth_corner.L",
        "DEF_mouth_corner.R", "DEF_hat_secondary", "CTRL_root", "CTRL_face",
        "CTRL_eyes", "CTRL_brow.L", "CTRL_brow.R", "CTRL_mouth.L",
        "CTRL_mouth.R", "CTRL_hat_secondary",
        "DEF_toe.L", "DEF_toe.R",
        "SOCKET_hand_l", "SOCKET_hand_r", "SOCKET_head", "SOCKET_hat",
        "SOCKET_glasses", "SOCKET_back", "SOCKET_vfx_feet", "SOCKET_vfx_center",
    }
    missing_bones = sorted(required_bones - set(arm.data.bones.keys()))
    if missing_bones:
        fail(f"missing bones: {', '.join(missing_bones)}", errors)

    body = bpy.data.objects.get(f"GEO_{hero}_skin_body")
    if not body:
        fail("missing continuous skin-body mesh", errors)
    else:
        if body.get("surface_construction") != "union-remeshed-continuous-surface":
            fail("skin body is not marked as a continuous remeshed surface", errors)
        armature_modifiers = [
            modifier for modifier in body.modifiers
            if modifier.type == "ARMATURE" and modifier.object == arm
        ]
        if not armature_modifiers:
            fail("skin body lacks armature deformation", errors)
        weighted_deform_groups = {
            group.name for group in body.vertex_groups
            if group.name.startswith("DEF_")
        }
        if len(weighted_deform_groups) < 18:
            fail(
                f"skin body has insufficient full-body deformation coverage: "
                f"{len(weighted_deform_groups)} groups",
                errors,
            )
        if not body.data.shape_keys or "SmileSoft" not in body.data.shape_keys.key_blocks:
            fail("skin body lacks facial shape deformation", errors)

    for side in ("L", "R"):
        eye = bpy.data.objects.get(f"GEO_{hero}_eye_{side}")
        if not eye or eye.parent != arm or eye.parent_bone != f"DEF_eye.{side}":
            fail(f"eye {side} is not bound to DEF_eye.{side}", errors)
        hand_control = arm.pose.bones.get(f"CTRL_hand_ik.{side}")
        foot_control = arm.pose.bones.get(f"CTRL_foot_ik.{side}")
        if not hand_control or "ik_fk" not in hand_control:
            fail(f"missing arm IK/FK switch {side}", errors)
        if not foot_control or "ik_fk" not in foot_control:
            fail(f"missing leg IK/FK switch {side}", errors)
        boot = bpy.data.objects.get(f"GEO_{hero}_boot_{side}")
        if not boot or f"DEF_toe.{side}" not in boot.vertex_groups:
            fail(f"boot {side} is not weighted to DEF_toe.{side}", errors)
        arm_ik = arm.pose.bones[f"DEF_forearm.{side}"].constraints.get("IK")
        leg_ik = arm.pose.bones[f"DEF_shin.{side}"].constraints.get("IK")
        driver_paths = {
            fcurve.data_path for fcurve in (arm.animation_data.drivers if arm.animation_data else [])
        }
        arm_driver_path = f'pose.bones["DEF_forearm.{side}"].constraints["IK"].influence'
        leg_driver_path = f'pose.bones["DEF_shin.{side}"].constraints["IK"].influence'
        if not arm_ik or arm_driver_path not in driver_paths:
            fail(f"arm IK influence is not driven {side}", errors)
        if not leg_ik or leg_driver_path not in driver_paths:
            fail(f"leg IK influence is not driven {side}", errors)
        if hand_control and arm_ik:
            hand_control["ik_fk"] = 1.0
            force_driver_evaluation(arm)
            if arm_ik.influence < 0.99:
                fail(f"arm IK driver does not evaluate {side}", errors)
            hand_control["ik_fk"] = 0.0
        if foot_control and leg_ik:
            foot_control["ik_fk"] = 1.0
            force_driver_evaluation(arm)
            if leg_ik.influence < 0.99:
                fail(f"leg IK driver does not evaluate {side}", errors)
            foot_control["ik_fk"] = 0.0

    face_control = arm.pose.bones.get("CTRL_face")
    for prop in ("blink_L", "blink_R", "smile", "mouth_open", "brow_raise_L", "brow_raise_R"):
        if not face_control or prop not in face_control:
            fail(f"missing facial control property {prop}", errors)
    if face_control:
        left_eye = bpy.data.objects.get(f"GEO_{hero}_eye_L")
        face_control["blink_L"] = 1.0
        force_driver_evaluation(arm)
        if left_eye and left_eye.scale.z > 0.20:
            fail("left blink driver does not close the eye", errors)
        face_control["blink_L"] = 0.0

    if hero == "Hargold":
        for bone in ("DEF_scarf_tail.L", "DEF_scarf_tail.R", "DEF_feather"):
            if bone not in arm.data.bones:
                fail(f"missing secondary bone {bone}", errors)
    elif hero == "Mebble":
        for bone in ("DEF_adams_apple", "DEF_cape.01", "DEF_cape.02", "DEF_cape.03"):
            if bone not in arm.data.bones:
                fail(f"missing secondary bone {bone}", errors)
        cape = bpy.data.objects.get("GEO_Mebble_cape")
        if not cape:
            fail("missing Mebble cape mesh", errors)
        else:
            if not any(mod.type == "ARMATURE" and mod.object == arm for mod in cape.modifiers):
                fail("Mebble cape lacks armature deformation", errors)
            expected_groups = {"DEF_cape.01", "DEF_cape.02", "DEF_cape.03"}
            missing_groups = expected_groups - set(cape.vertex_groups.keys())
            if missing_groups:
                fail(f"Mebble cape missing weights: {', '.join(sorted(missing_groups))}", errors)
            if not cape.data.shape_keys or "GlideOpen" not in cape.data.shape_keys.key_blocks:
                fail("Mebble cape lacks GlideOpen shape", errors)
        cape_control = arm.pose.bones.get("CTRL_cape.01")
        if not cape_control or "cape_open" not in cape_control:
            fail("Mebble cape controller lacks cape_open property", errors)
        elif cape and cape.data.shape_keys:
            cape_control["cape_open"] = 1.0
            force_driver_evaluation(arm)
            if cape.data.shape_keys.key_blocks["GlideOpen"].value < 0.99:
                fail("Mebble cape-open driver does not evaluate", errors)
            cape_control["cape_open"] = 0.0

    visible_geometry = [
        obj for collection_name in ("GEO", "ATTACHMENTS")
        for obj in bpy.data.collections[collection_name].objects
        if obj.type == "MESH" and not obj.hide_render
    ]
    segmented_tokens = (
        "_upper_arm_", "_forearm_", "_elbow_", "_hand_",
        "_thigh_", "_shin_"
    )
    segmented_geometry = [
        obj.name for obj in visible_geometry
        if any(token in obj.name for token in segmented_tokens)
        and obj.parent_type == "BONE"
    ]
    if segmented_geometry:
        fail(
            "segmented rigid limb geometry is forbidden: "
            + ", ".join(sorted(segmented_geometry)),
            errors,
        )
    if len(visible_geometry) < 16:
        fail(f"unexpectedly sparse model: only {len(visible_geometry)} render meshes", errors)
    for obj in visible_geometry:
        if not obj.data.uv_layers:
            fail(f"render mesh lacks UV0: {obj.name}", errors)
        if obj.get("geometry_generation") != "continuous-skinned-rebuild-2026-07-25":
            fail(f"render mesh lacks replacement provenance: {obj.name}", errors)

    for mat in {material for obj in visible_geometry for material in obj.data.materials if material}:
        image_nodes = [
            node for node in mat.node_tree.nodes
            if node.bl_idname == "ShaderNodeTexImage" and node.image
        ] if mat.use_nodes else []
        if len(image_nodes) < 4 or mat.get("pbr_texture_resolution") != 1024:
            fail(f"material lacks packed 1K PBR texture set: {mat.name}", errors)

    required_core = set(SHARED_REPLACEMENT_CLIPS)
    if hero == "Mebble":
        required_core |= {
            "glide-open", "glide-sustain", "glide-steer-left",
            "glide-steer-right", "glide-close"
        }
    else:
        required_core |= {
            "double-jump", "break-hargold-block",
            "heavy-ground-slam", "stonefist-strike"
        }
    missing_actions = required_core - set(bpy.data.actions.keys())
    if missing_actions:
        fail(f"missing replacement actions: {', '.join(sorted(missing_actions))}", errors)
    for action_name in required_core & set(bpy.data.actions.keys()):
        action = bpy.data.actions[action_name]
        if action.get("clip_status") != "new-replacement-authored":
            fail(f"action is not a replacement-authored clip: {action_name}", errors)
        if action.get("clean_room_animation") is not True:
            fail(f"action is not marked as clean-room authored: {action_name}", errors)
        if action.get("negative_scale_mirroring") is not False:
            fail(f"action does not forbid negative-scale mirroring: {action_name}", errors)

    scene = bpy.context.scene
    if scene.get("geometryGeneration") != "continuous-skinned-rebuild-2026-07-25":
        fail("scene lacks continuous-skin geometry provenance", errors)
    if scene.get("reusesPriorGeometry") is not False:
        fail("scene does not explicitly reject prior geometry reuse", errors)
    if scene.get("sourceScene") != "factory-empty":
        fail("scene was not marked as factory-empty", errors)
    if scene.get("presentationProfile") != "assets/blender/character-scale-orientation-profile.json":
        fail("scene is missing the locked scale/orientation profile", errors)

    glb_path = ROOT / "assets" / "exports" / f"{hero.lower()}_character.glb"
    glb_summary = {}
    if not glb_path.exists():
        fail(f"missing runtime export {glb_path.name}", errors)
    else:
        payload = glb_path.read_bytes()
        magic, version, declared_length = struct.unpack_from("<4sII", payload, 0)
        json_length, json_type = struct.unpack_from("<II", payload, 12)
        if magic != b"glTF" or version != 2 or declared_length != len(payload) or json_type != 0x4E4F534A:
            fail("invalid GLB 2.0 container", errors)
        else:
            document = json.loads(payload[20:20 + json_length].decode("utf-8").rstrip("\x00 "))
            glb_summary = {
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
            if glb_summary["skins"] < 1:
                fail("runtime GLB has no skin", errors)
            if glb_summary["animations"] < len(required_core):
                fail("runtime GLB is missing core animation exports", errors)
            if hero == "Mebble" and glb_summary["morphTargets"] < 1:
                fail("runtime GLB is missing the GlideOpen morph target", errors)

    return {
        "hero": hero,
        "blend": str(source),
        "blenderVersion": bpy.app.version_string,
        "bones": len(arm.data.bones),
        "controls": sum(1 for bone in arm.data.bones if bone.name.startswith("CTRL_")),
        "renderMeshes": len(visible_geometry),
        "actions": sorted(bpy.data.actions.keys()),
        "facialProperties": [
            "blink_L", "blink_R", "smile", "mouth_open",
            "brow_raise_L", "brow_raise_R"
        ],
        "geometryGeneration": bpy.context.scene.get("geometryGeneration"),
        "reusesPriorGeometry": bpy.context.scene.get("reusesPriorGeometry"),
        "glb": glb_summary,
        "errors": errors,
    }


if __name__ == "__main__":
    result = validate()
    print("HM_LOCKED_CHARACTER_VALIDATION " + json.dumps(result, sort_keys=True))
    if result["errors"]:
        sys.exit(1)
