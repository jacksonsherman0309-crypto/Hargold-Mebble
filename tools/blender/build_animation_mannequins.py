"""Build the authoritative compact and tall animation-frame mannequins.

The mannequins are featureless clean-room guides.  They intentionally contain
no face, clothing, colors, hats, hair, logos, facial hair, or character surface
details.  Their purpose is proportion, joint placement, deformation, and
side-view action validation before the locked hero identities are fitted.
"""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_locked_characters as riglib
import build_production_character_staging as surface
from animation_mannequin_spec import (
    FRAME_SPECS,
    REVIEW_FRAMES,
    SPEC_ID,
    review_camera,
    review_frame,
    scaled_frame,
    spec_hash,
    validate_specs,
)


ROOT = Path(__file__).resolve().parents[2]
BLEND_DIR = ROOT / "assets" / "blender" / "mannequins"
EXPORT_DIR = ROOT / "assets" / "exports" / "mannequins"
PREVIEW_DIR = ROOT / "assets" / "previews" / "mannequins"
GENERATION = "featureless-locked-animation-mannequin-v2"


def mannequin_materials():
    return {
        "grey": riglib.material("MAT_MANNEQUIN_GREY", (0.42, 0.44, 0.46, 1), 0.72),
        "black": riglib.review_silhouette_material(),
        "skeleton": riglib.material("MAT_MANNEQUIN_SKELETON", (0.18, 0.92, 0.34, 1), 0.34),
    }


def tag(obj):
    obj["production_part"] = True
    obj["export_enabled"] = True
    obj["geometry_generation"] = GENERATION
    obj["source_geometry_reused"] = False
    obj["featureless_mannequin"] = True
    return obj


def skin(obj, armature, bones):
    surface.skin_to_bones(obj, armature, bones, 4)
    return tag(obj)


def smooth_surface(obj):
    """Apply one authored subdivision pass to remove blockout faceting."""
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    modifier = obj.modifiers.new("MannequinSurface", "SUBSURF")
    modifier.subdivision_type = "CATMULL_CLARK"
    modifier.levels = 1
    modifier.render_levels = 1
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    obj.select_set(False)
    return obj


def build_body(hero, armature, groups, mats, dims):
    geo = groups["GEO"]
    grey = mats["grey"]
    height = dims["height"]
    shoulder = dims["shoulder"]
    hip = dims["hip"]
    head_center = dims["head_center"]
    head_height = dims["head_height"]
    head_width = dims["head_width"]
    torso_half = dims["torso_width"] * 0.5
    max_half = dims["maximum_body_width"] * 0.5

    if hero == "Hargold":
        torso_rings = [
            (max(hip - height * 0.08, height * 0.27), torso_half * 0.78, height * 0.145, 0, 0.015),
            (hip, torso_half * 0.92, height * 0.165, 0, 0.020),
            (hip + (shoulder - hip) * 0.34, max_half, height * 0.185, 0, 0.018),
            (hip + (shoulder - hip) * 0.68, torso_half * 0.96, height * 0.172, 0, 0.010),
            (shoulder, dims["chest_half"], height * 0.145, 0, 0),
        ]
        head_rings = [
            (head_center - head_height * 0.50, head_width * 0.23, head_width * 0.20, 0, -0.015),
            (head_center - head_height * 0.34, head_width * 0.42, head_width * 0.36, 0, -0.035),
            (head_center, head_width * 0.50, head_width * 0.43, 0, -0.045),
            (head_center + head_height * 0.34, head_width * 0.44, head_width * 0.37, 0, -0.020),
            (head_center + head_height * 0.50, head_width * 0.22, head_width * 0.18, 0, 0.015),
        ]
    else:
        torso_rings = [
            (hip - height * 0.08, torso_half * 0.82, height * 0.095, 0, 0.010),
            (hip, torso_half * 0.90, height * 0.105, 0, 0.012),
            (hip + (shoulder - hip) * 0.34, torso_half * 0.78, height * 0.095, 0, 0.005),
            (hip + (shoulder - hip) * 0.72, torso_half, height * 0.115, 0, 0),
            (shoulder, dims["chest_half"], height * 0.105, 0, -0.006),
        ]
        head_rings = [
            (head_center - head_height * 0.50, head_width * 0.22, head_width * 0.19, 0, -0.025),
            (head_center - head_height * 0.34, head_width * 0.40, head_width * 0.34, 0, -0.050),
            (head_center, head_width * 0.50, head_width * 0.42, 0, -0.065),
            (head_center + head_height * 0.34, head_width * 0.43, head_width * 0.36, 0, -0.035),
            (head_center + head_height * 0.50, head_width * 0.20, head_width * 0.17, 0, 0.0),
        ]

    torso = surface.loft_mesh(
        f"GEO_{hero}_mannequin_torso", "Z", torso_rings, grey, geo, 40
    )
    smooth_surface(torso)
    skin(
        torso,
        armature,
        [
            "DEF_hips", "DEF_spine_lower", "DEF_spine_mid",
            "DEF_spine_upper", "DEF_chest",
        ],
    )

    if hero == "Mebble":
        neck_bottom = shoulder - height * 0.015
        neck_top = head_center - head_height * 0.40
        neck = surface.loft_mesh(
            "GEO_Mebble_mannequin_neck",
            "Z",
            [
                (neck_bottom, height * 0.061, height * 0.052, 0, 0.0),
                (neck_bottom + (neck_top - neck_bottom) * 0.34, height * 0.052, height * 0.046, 0, -height * 0.008),
                (neck_bottom + (neck_top - neck_bottom) * 0.68, height * 0.047, height * 0.042, 0, -height * 0.014),
                (neck_top, height * 0.052, height * 0.046, 0, -height * 0.018),
            ],
            grey,
            geo,
            28,
        )
        smooth_surface(neck)
        skin(
            neck,
            armature,
            ["DEF_chest", "DEF_neck_base", "DEF_neck_mid", "DEF_neck_upper", "DEF_head"],
        )
    head = surface.loft_mesh(
        f"GEO_{hero}_mannequin_head", "Z", head_rings, grey, geo, 40
    )
    smooth_surface(head)
    skin(head, armature, ["DEF_neck_upper", "DEF_head", "DEF_jaw"])

    shoulder_radius = height * (0.092 if hero == "Hargold" else 0.070)
    elbow_radius = height * (0.068 if hero == "Hargold" else 0.052)
    wrist_radius = height * (0.058 if hero == "Hargold" else 0.043)
    for side, sign in (("L", -1), ("R", 1)):
        arm = surface.loft_mesh(
            f"GEO_{hero}_mannequin_arm_{side}",
            "X",
            [
                (sign * dims["chest_half"], shoulder_radius * 0.92, shoulder_radius, -height * 0.010, shoulder),
                (sign * (dims["chest_half"] + height * 0.035), shoulder_radius, shoulder_radius * 1.05, -height * 0.015, shoulder + height * 0.004),
                (sign * dims["elbow"], elbow_radius, elbow_radius * 1.05, -height * 0.005, dims["elbow_z"]),
                (sign * ((dims["elbow"] + dims["wrist"]) * 0.5), elbow_radius * 0.90, elbow_radius * 0.95, 0, (dims["elbow_z"] + dims["wrist_z"]) * 0.5),
                (sign * dims["wrist"], wrist_radius, wrist_radius * 1.02, 0, dims["wrist_z"]),
            ],
            grey,
            geo,
            28,
        )
        smooth_surface(arm)
        skin(
            arm,
            armature,
            [f"DEF_clavicle.{side}", f"DEF_upper_arm.{side}", f"DEF_forearm.{side}"],
        )
        hand_size = dims["hand_size"]
        hand = surface.loft_mesh(
            f"GEO_{hero}_mannequin_hand_{side}",
            "X",
            [
                (sign * dims["wrist"], hand_size * 0.38, hand_size * 0.48, 0, dims["wrist_z"]),
                (sign * (dims["wrist"] + hand_size * 0.46), hand_size * 0.48, hand_size * 0.58, -height * 0.012, dims["wrist_z"] - hand_size * 0.08),
                (sign * (dims["wrist"] + hand_size), hand_size * 0.30, hand_size * 0.40, -height * 0.018, dims["wrist_z"] - hand_size * 0.12),
            ],
            grey,
            geo,
            24,
        )
        smooth_surface(hand)
        skin(hand, armature, [f"DEF_forearm.{side}", f"DEF_hand.{side}"])

        leg_radius = height * (0.078 if hero == "Hargold" else 0.055)
        leg = surface.loft_mesh(
            f"GEO_{hero}_mannequin_leg_{side}",
            "Z",
            [
                (dims["ankle"], leg_radius * 0.78, leg_radius * 0.75, sign * dims["leg_x"], 0),
                (dims["knee"], leg_radius * 0.88, leg_radius * 0.82, sign * dims["leg_x"], 0),
                ((dims["knee"] + hip) * 0.5, leg_radius, leg_radius * 0.88, sign * dims["leg_x"], 0),
                (hip, leg_radius * 1.08, leg_radius * 0.94, sign * dims["leg_x"], 0),
            ],
            grey,
            geo,
            28,
        )
        smooth_surface(leg)
        skin(leg, armature, [f"DEF_thigh.{side}", f"DEF_shin.{side}"])

        foot_width = height * (0.105 if hero == "Hargold" else 0.078)
        foot = surface.loft_mesh(
            f"GEO_{hero}_mannequin_foot_{side}",
            "Y",
            [
                (height * 0.035, foot_width * 0.84, dims["foot_height"] * 0.42, sign * dims["leg_x"], dims["foot_height"] * 0.48),
                (-dims["foot_length"] * 0.48, foot_width, dims["foot_height"] * 0.50, sign * dims["leg_x"], dims["foot_height"] * 0.46),
                (-dims["foot_length"], foot_width * 0.88, dims["foot_height"] * 0.38, sign * dims["leg_x"], dims["foot_height"] * 0.42),
            ],
            grey,
            geo,
            28,
        )
        smooth_surface(foot)
        skin(foot, armature, [f"DEF_foot.{side}", f"DEF_toe.{side}"])
    return [obj for obj in geo.objects if obj.get("featureless_mannequin")]


def add_skeleton_overlay(armature, groups, mats):
    overlay = groups["ATTACHMENTS"]
    names = (
        "Root", "DEF_center_of_mass", "DEF_hips", "DEF_spine_lower",
        "DEF_spine_mid", "DEF_spine_upper", "DEF_chest", "DEF_neck_base",
        "DEF_neck_mid", "DEF_neck_upper", "DEF_head",
        "DEF_clavicle.L", "DEF_clavicle.R", "DEF_upper_arm.L",
        "DEF_upper_arm.R", "DEF_forearm.L", "DEF_forearm.R",
        "DEF_hand.L", "DEF_hand.R", "DEF_thigh.L", "DEF_thigh.R",
        "DEF_shin.L", "DEF_shin.R", "DEF_foot.L", "DEF_foot.R",
        "DEF_toe.L", "DEF_toe.R", "DEF_cape.01",
    )
    height = float(armature.get("target_height_metres", 1.82))
    front_x = -height * 0.39
    side_offset = height * 0.012
    center_material = mats["skeleton"]
    left_material = riglib.material(
        "MAT_MANNEQUIN_SKELETON_LEFT", (0.10, 0.72, 1.0, 1), 0.28
    )
    right_material = riglib.material(
        "MAT_MANNEQUIN_SKELETON_RIGHT", (1.0, 0.72, 0.08, 1), 0.28
    )
    cape_material = riglib.material(
        "MAT_MANNEQUIN_SKELETON_CAPE", (0.95, 0.26, 0.72, 1), 0.28
    )
    objects = []
    marker_points = []
    for name in names:
        bone = armature.data.bones.get(name)
        if bone is None:
            continue
        material = (
            left_material if name.endswith(".L")
            else right_material if name.endswith(".R")
            else cape_material if name.startswith("DEF_cape")
            else center_material
        )
        y_offset = (
            -side_offset if name.endswith(".L")
            else side_offset if name.endswith(".R")
            else 0.0
        )
        start = (front_x, bone.head_local.y + y_offset, bone.head_local.z)
        end = (front_x, bone.tail_local.y + y_offset, bone.tail_local.z)
        obj = surface.curve_tube(
            f"GUIDE_{armature.name}_{name}",
            [start, end],
            height * 0.007,
            material,
            overlay,
        )
        obj["skeleton_overlay"] = True
        obj.hide_render = True
        riglib.parent_bone(obj, armature, name)
        objects.append(obj)
        marker_points.extend(((start, material, name), (end, material, name)))

    seen = set()
    for index, (point, material, source_name) in enumerate(marker_points):
        key = tuple(round(value, 4) for value in point)
        if key in seen:
            continue
        seen.add(key)
        marker = surface.ellipsoid_mesh(
            f"JOINT_{armature.name}_{index:02d}_{source_name}",
            point,
            (height * 0.014, height * 0.014, height * 0.014),
            material,
            overlay,
            segments=16,
            rings=8,
        )
        marker["skeleton_overlay"] = True
        marker["joint_marker"] = True
        marker.hide_render = True
        riglib.parent_bone(marker, armature, source_name)
        objects.append(marker)
    return objects


def setup_scene(hero, dims, mats):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 420
    scene.render.resolution_y = 420
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.world.color = (0.35, 0.37, 0.40)
    floor_material = riglib.material(
        "MAT_REVIEW_FLOOR", (0.11, 0.045, 0.018, 1), 0.68
    )
    bpy.ops.mesh.primitive_plane_add(size=8, location=(0, 0, -0.018))
    ground = bpy.context.object
    ground.name = "QA_Floor"
    ground.data.materials.append(floor_material)
    camera_data = bpy.data.cameras.new("QA_SideCamera")
    camera = bpy.data.objects.new("QA_SideCamera", camera_data)
    scene.collection.objects.link(camera)
    camera_contract = review_camera()
    distance = camera_contract["distance"]
    center_height = camera_contract["centerHeight"]
    camera.location = (-distance, 0, center_height)
    camera.rotation_euler = (
        Vector((0, 0, center_height)) - camera.location
    ).to_track_quat("-Z", "Y").to_euler()
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = camera_contract["orthoScale"]
    scene.camera = camera
    for name, location, energy, size, color in (
        ("Key", (-3.2, -4.0, 5.5), 900, 3.2, (1.0, 0.76, 0.54)),
        ("Fill", (3.0, -2.0, 4.0), 520, 2.8, (0.48, 0.68, 1.0)),
        ("Rim", (1.0, 3.5, 4.8), 1000, 2.0, (0.67, 0.84, 0.48)),
    ):
        data = bpy.data.lights.new(name, "AREA")
        data.energy, data.shape, data.size, data.color = energy, "DISK", size, color
        light = bpy.data.objects.new(name, data)
        light.location = location
        light.rotation_euler = (
            Vector((0, 0, dims["height"] * 0.5)) - light.location
        ).to_track_quat("-Z", "Y").to_euler()
        scene.collection.objects.link(light)


def set_silhouette(objects, mats, enabled):
    for obj in objects:
        if obj.type != "MESH":
            continue
        if enabled:
            obj["_review_material_name"] = obj.data.materials[0].name
            obj.data.materials[0] = mats["black"]
        else:
            material_name = obj.get("_review_material_name")
            if material_name and material_name in bpy.data.materials:
                obj.data.materials[0] = bpy.data.materials[material_name]


def render_panels(hero, armature, dims, body_objects, skeleton_objects, mats):
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    for row in REVIEW_FRAMES:
        frame_spec = review_frame(hero, row["key"])
        if frame_spec is None or frame_spec.get("special"):
            continue
        action_name = frame_spec["action"]
        frame = frame_spec["frame"]
        armature.animation_data.action = bpy.data.actions[action_name]
        scene.frame_set(frame)
        riglib.align_review_pose_to_floor(
            armature, dims["height"] * frame_spec.get("rootHeight", 0.0)
        )
        scene.render.filepath = str(
            PREVIEW_DIR / f"{hero.lower()}-mannequin-{row['key']}.png"
        )
        bpy.ops.render.render(write_still=True)

    armature.animation_data.action = bpy.data.actions["idle"]
    scene.frame_set(1)
    riglib.align_review_pose_to_floor(armature)

    original_world_color = tuple(scene.world.color)
    scene.world.color = (1.0, 1.0, 1.0)
    set_silhouette(body_objects, mats, True)
    scene.render.filepath = str(
        PREVIEW_DIR / f"{hero.lower()}-mannequin-solid-silhouette.png"
    )
    bpy.ops.render.render(write_still=True)
    set_silhouette(body_objects, mats, False)
    scene.world.color = original_world_color

    for obj in skeleton_objects:
        obj.hide_render = False
    scene.render.filepath = str(
        PREVIEW_DIR / f"{hero.lower()}-mannequin-skeleton-overlay.png"
    )
    bpy.ops.render.render(write_still=True)
    for obj in skeleton_objects:
        obj.hide_render = True


def export_glb(armature, output):
    bpy.ops.object.select_all(action="DESELECT")
    armature.select_set(True)
    for obj in bpy.data.collections["GEO"].objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = armature
    bpy.ops.export_scene.gltf(
        filepath=str(output),
        export_format="GLB",
        use_selection=True,
        export_apply=False,
        export_yup=True,
        export_animations=True,
        export_skins=True,
        export_morph=False,
    )


def build(hero):
    spec_errors = validate_specs()
    if spec_errors:
        raise RuntimeError("Invalid animation mannequin specification: " + "; ".join(spec_errors))
    riglib.reset_scene()
    bpy.context.preferences.filepaths.save_version = 0
    groups = riglib.collections()
    mats = mannequin_materials()
    dims = scaled_frame(hero)
    armature = riglib.create_armature(hero, dims, groups["RIG"])
    body_objects = build_body(hero, armature, groups, mats, dims)
    skeleton_objects = add_skeleton_overlay(armature, groups, mats)
    riglib.add_production_actions(armature, hero)
    for action in bpy.data.actions:
        action["clean_room_animation"] = True
        action["negative_scale_mirroring"] = False
        action["mannequin_spec"] = SPEC_ID
    setup_scene(hero, dims, mats)
    scene = bpy.context.scene
    scene["assetVersion"] = "2.0.0-locked-animation-mannequin"
    scene["geometryGeneration"] = GENERATION
    scene["sourceScene"] = "factory-empty"
    scene["reusesPriorGeometry"] = False
    scene["featureless"] = True
    scene["heroFrame"] = FRAME_SPECS[hero]["frame"]
    scene["mannequinSpec"] = SPEC_ID
    scene["mannequinSpecHash"] = spec_hash()
    scene["sharedWorldScaleCamera"] = True
    scene["maximumJointAlignmentErrorFraction"] = 0.03
    scene["targetGameplayHeightMetres"] = dims["height"]
    scene["cleanRoomBoundary"] = "generic-platformer-readability-principles-only"
    scene["reviewStatus"] = "authoritative-animation-frame"
    BLEND_DIR.mkdir(parents=True, exist_ok=True)
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    blend_path = BLEND_DIR / f"{dims['frame']}_animation_mannequin.blend"
    glb_path = EXPORT_DIR / f"{dims['frame']}_animation_mannequin.glb"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path), check_existing=False)
    if "--skip-export" not in sys.argv:
        export_glb(armature, glb_path)
    riglib.restore_bone_parent_bindings(armature)
    render_panels(hero, armature, dims, body_objects, skeleton_objects, mats)
    armature.animation_data.action = bpy.data.actions["idle"]
    scene.frame_set(1)
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path), check_existing=False)
    print("HM_ANIMATION_MANNEQUIN_BUILT " + json.dumps({
        "heroFrame": hero,
        "frame": dims["frame"],
        "heightMetres": dims["height"],
        "bones": len(armature.data.bones),
        "actions": len(bpy.data.actions),
        "blend": str(blend_path),
        "glb": str(glb_path),
        "specHash": spec_hash(),
    }, sort_keys=True))


if __name__ == "__main__":
    selected = [
        argument.split("=", 1)[1]
        for argument in sys.argv
        if argument.startswith("--hero=")
    ] or ["Hargold", "Mebble"]
    for hero in selected:
        build(hero)
