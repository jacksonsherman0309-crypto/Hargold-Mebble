"""Build continuous, skinned Hargold and Mebble character sources.

This is the production replacement for the segmented primitive builder.  It
starts from a factory-empty scene, creates new union-remeshed body and garment
surfaces, binds them to the existing original-character control rig, authors
the complete in-place action library, and exports browser-ready GLB files.

Nintendo characters are not used as source geometry or copied designs.  The
pipeline borrows only general platform-character craft principles: a readable
silhouette, continuous deformation, clear posing, and responsive animation.
"""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_locked_characters as riglib


ROOT = Path(__file__).resolve().parents[2]
BLEND_DIR = ROOT / "assets" / "blender"
EXPORT_DIR = ROOT / "assets" / "exports"
PREVIEW_DIR = ROOT / "assets" / "previews"

GENERATION = "continuous-skinned-rebuild-2026-07-25"


def source_ellipsoid(location, scale):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.0, location=location)
    obj = bpy.context.object
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return obj


def source_capsule(start, end, radius, depth_scale=1.0):
    start_v = Vector(start)
    end_v = Vector(end)
    direction = end_v - start_v
    obj = source_ellipsoid(
        (start_v + end_v) * 0.5,
        (direction.length * 0.54, radius, radius * depth_scale),
    )
    obj.rotation_euler = direction.to_track_quat("X", "Z").to_euler()
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=False)
    return obj


def assign_projection_uv(obj):
    if obj.data.uv_layers:
        obj.data.uv_layers.remove(obj.data.uv_layers[0])
    uv = obj.data.uv_layers.new(name="UV0")
    xs = [vertex.co.x for vertex in obj.data.vertices]
    ys = [vertex.co.y for vertex in obj.data.vertices]
    zs = [vertex.co.z for vertex in obj.data.vertices]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    min_z, max_z = min(zs), max(zs)
    span_x = max(max_x - min_x, 0.001)
    span_y = max(max_y - min_y, 0.001)
    span_z = max(max_z - min_z, 0.001)
    for loop in obj.data.loops:
        vertex = obj.data.vertices[loop.vertex_index]
        normal = vertex.normal
        if abs(normal.z) > abs(normal.x) and abs(normal.z) > abs(normal.y):
            coordinate = ((vertex.co.x - min_x) / span_x, (vertex.co.y - min_y) / span_y)
        elif abs(normal.x) > abs(normal.y):
            coordinate = ((vertex.co.y - min_y) / span_y, (vertex.co.z - min_z) / span_z)
        else:
            coordinate = ((vertex.co.x - min_x) / span_x, (vertex.co.z - min_z) / span_z)
        uv.data[loop.index].uv = coordinate


def organic_union(name, parts, mat, collection, voxel=0.045, smooth_iterations=4):
    bpy.ops.object.select_all(action="DESELECT")
    for part in parts:
        part.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    obj = bpy.context.object
    obj.name = name
    # Joining keeps the active source primitive's origin. Apply that transform
    # so sculpt, facial-shape, and armature-weight coordinates all share the
    # armature's character-local space.
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    mesh = obj.data
    mesh.name = f"MESH_{name}"
    mesh.remesh_voxel_size = voxel
    mesh.remesh_voxel_adaptivity = 0.0
    mesh.use_remesh_fix_poles = True
    mesh.use_remesh_preserve_volume = True
    bpy.ops.object.voxel_remesh()
    if smooth_iterations:
        smooth = obj.modifiers.new("SculptSurfaceRelax", "SMOOTH")
        smooth.factor = 0.42
        smooth.iterations = smooth_iterations
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=smooth.name)
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    mesh.materials.clear()
    mesh.materials.append(mat)
    riglib.move_to(obj, collection)
    assign_projection_uv(obj)
    obj["production_part"] = True
    obj["export_enabled"] = True
    obj["geometry_generation"] = GENERATION
    obj["surface_construction"] = "union-remeshed-continuous-surface"
    return obj


def point_segment_distance(point, start, end):
    segment = end - start
    length_squared = segment.length_squared
    if length_squared <= 1e-8:
        return (point - start).length
    t = max(0.0, min(1.0, (point - start).dot(segment) / length_squared))
    return (point - (start + segment * t)).length


def skin_mesh(obj, armature, candidates=None, max_influences=4):
    if candidates is None:
        candidates = [
            bone.name for bone in armature.data.bones
            if bone.use_deform
            and bone.name.startswith("DEF_")
            and not any(token in bone.name for token in (
                "eye", "lid", "brow", "mouth", "jaw", "cape", "scarf",
                "feather", "hat", "adams"
            ))
        ]
    groups = {
        bone_name: obj.vertex_groups.new(name=bone_name)
        for bone_name in candidates
        if bone_name in armature.data.bones
    }
    bones = {
        name: (
            Vector(armature.data.bones[name].head_local),
            Vector(armature.data.bones[name].tail_local),
        )
        for name in groups
    }
    head_start = armature.data.bones["DEF_head"].head_local.z
    hip_height = armature.data.bones["DEF_hips"].head_local.z
    shoulder_height = armature.data.bones["DEF_chest"].tail_local.z
    torso_half_width = abs(armature.data.bones["DEF_upper_arm.L"].head_local.x) * 1.20
    torso_bones = {"DEF_hips", "DEF_spine", "DEF_chest", "DEF_neck"}
    for vertex in obj.data.vertices:
        point = vertex.co
        candidate_bones = bones
        if point.z >= head_start - 0.15 and "DEF_head" in bones:
            candidate_bones = {"DEF_head": bones["DEF_head"]}
        elif (
            hip_height - 0.25 <= point.z <= shoulder_height + 0.08
            and abs(point.x) <= torso_half_width
        ):
            core = {name: segment for name, segment in bones.items() if name in torso_bones}
            if core:
                candidate_bones = core
        distances = sorted(
            (
                point_segment_distance(point, head, tail),
                name,
            )
            for name, (head, tail) in candidate_bones.items()
        )[:max_influences]
        nearest = distances[0][0]
        # Only genuinely adjacent bones may influence a vertex. Normalizing a
        # fixed number of far-away bones causes facial and torso vertices to
        # stretch toward animated limbs.
        adjacent = [
            (distance, name) for distance, name in distances
            if distance <= nearest + 0.13
        ]
        raw = [
            (math.exp(-((distance - nearest) / 0.075) ** 2), name)
            for distance, name in adjacent
        ]
        total = sum(weight for weight, _ in raw)
        for weight, name in raw:
            groups[name].add([vertex.index], weight / total, "REPLACE")
    world = obj.matrix_world.copy()
    obj.parent = armature
    obj.matrix_parent_inverse = armature.matrix_world.inverted()
    obj.matrix_world = world
    modifier = obj.modifiers.new("CharacterArmature", "ARMATURE")
    modifier.object = armature
    modifier.use_deform_preserve_volume = True
    obj["binding"] = "normalized-four-influence-skin"
    return obj


def add_face_shapes(body, hero, center):
    body.shape_key_add(name="Basis")
    smile = body.shape_key_add(name="SmileSoft")
    squash = body.shape_key_add(name="SquashStretch")
    center_v = Vector(center)
    head_radius = 0.82 if hero == "Hargold" else 0.64
    for index, vertex in enumerate(body.data.vertices):
        local = vertex.co - center_v
        if local.length < head_radius and local.y < -0.22 and local.z < 0.08:
            side = min(abs(local.x) / max(head_radius, 0.001), 1.0)
            smile.data[index].co.z += 0.045 * side
            smile.data[index].co.x += math.copysign(0.025 * side, local.x or 1.0)
        if local.length < head_radius:
            squash.data[index].co.x = center_v.x + local.x * 1.035
            squash.data[index].co.y = center_v.y + local.y * 1.035
            squash.data[index].co.z = center_v.z + local.z * 0.94
    body["facial_shapes"] = "SmileSoft/SquashStretch"


def drive_shape(obj, shape_name, armature, property_name, expression):
    key = obj.data.shape_keys.key_blocks[shape_name]
    driver = key.driver_add("value").driver
    driver.type = "SCRIPTED"
    variable = driver.variables.new()
    variable.name = property_name
    variable.type = "SINGLE_PROP"
    variable.targets[0].id = armature
    variable.targets[0].data_path = f'pose.bones["CTRL_face"]["{property_name}"]'
    driver.expression = expression


def rigid_ellipsoid(name, location, scale, mat, collection, armature, bone):
    obj = riglib.sphere(name, location, scale, mat, collection)
    obj["geometry_generation"] = GENERATION
    riglib.parent_bone(obj, armature, bone)
    return obj


def rigid_capsule(name, start, end, radius, mat, collection, armature, bone, depth_scale=1.0):
    obj = riglib.ellipsoid_between(name, start, end, radius, mat, collection, taper=depth_scale)
    obj["geometry_generation"] = GENERATION
    riglib.parent_bone(obj, armature, bone)
    return obj


def finish_rigid(obj, armature, bone):
    obj["geometry_generation"] = GENERATION
    riglib.parent_bone(obj, armature, bone)
    return obj


def add_eye_set(hero, armature, geo, mats, center, head_scale, glasses=False):
    x, y, z = center
    for side, sign in (("L", -1), ("R", 1)):
        eye_x = x + sign * head_scale[0] * 0.32
        eye_y = y - head_scale[1] * 0.90
        eye_z = z + head_scale[2] * 0.08
        eye = rigid_ellipsoid(
            f"GEO_{hero}_eye_{side}", (eye_x, eye_y, eye_z),
            (head_scale[0] * 0.19, 0.060, head_scale[2] * 0.25),
            mats["white"], geo, armature, f"DEF_eye.{side}"
        )
        iris = rigid_ellipsoid(
            f"GEO_{hero}_iris_{side}", (eye_x, eye_y - 0.058, eye_z),
            (head_scale[0] * 0.090, 0.025, head_scale[2] * 0.13),
            mats["iris"], geo, armature, f"DEF_eye.{side}"
        )
        pupil = rigid_ellipsoid(
            f"GEO_{hero}_pupil_{side}", (eye_x, eye_y - 0.078, eye_z),
            (head_scale[0] * 0.042, 0.014, head_scale[2] * 0.066),
            mats["black"], geo, armature, f"DEF_eye.{side}"
        )
        for part in (eye, iris, pupil):
            riglib.drive_transform(
                part, "scale", 2, armature, "CTRL_face", f"blink_{side}",
                f"1.0 - 0.86 * blink_{side}"
            )
        brow = rigid_capsule(
            f"GEO_{hero}_brow_{side}",
            (eye_x - head_scale[0] * 0.16, eye_y - 0.035, eye_z + head_scale[2] * 0.29),
            (eye_x + head_scale[0] * 0.16, eye_y - 0.035, eye_z + head_scale[2] * 0.31),
            0.048 if hero == "Mebble" else 0.040,
            mats["hair"], geo, armature, f"DEF_brow.{side}", 0.70
        )
        brow.rotation_euler.y += sign * (0.11 if hero == "Mebble" else 0.05)
        if glasses:
            frame = riglib.torus(
                f"GEO_{hero}_glasses_{side}_frame",
                (eye_x + sign * 0.010, eye_y - 0.032, eye_z + sign * 0.012),
                head_scale[0] * 0.255, 0.025, mats["glass"], geo
            )
            frame.scale.z = 1.12
            frame.rotation_euler.y += 0.075 if side == "L" else -0.035
            finish_rigid(frame, armature, "DEF_head")
    if glasses:
        bridge = riglib.cube(
            f"GEO_{hero}_glasses_bridge", (x, y - head_scale[1] * 0.92, z + 0.05),
            (head_scale[0] * 0.13, 0.022, 0.020), mats["glass"], geo, bevel=0.012
        )
        finish_rigid(bridge, armature, "DEF_head")


def add_mouth(hero, armature, geo, mats, location, width):
    mouth = rigid_ellipsoid(
        f"GEO_{hero}_mouth", location, (width, 0.030, width * 0.30),
        mats["black"], geo, armature, "DEF_jaw"
    )
    teeth = riglib.cube(
        f"GEO_{hero}_teeth", (location[0], location[1] - 0.033, location[2] + width * 0.055),
        (width * 0.62, 0.012, width * 0.080), mats["white"], geo, bevel=0.010
    )
    finish_rigid(teeth, armature, "DEF_jaw")
    riglib.drive_transform(mouth, "scale", 0, armature, "CTRL_face", "smile", "1.0 + 0.38 * smile")
    riglib.drive_transform(mouth, "scale", 2, armature, "CTRL_face", "mouth_open", "1.0 + 1.7 * mouth_open")


def add_hand_sources(parts, hero, side, wrist_x, z, radius):
    sign = -1 if side == "L" else 1
    palm_x = wrist_x + sign * radius * 0.72
    parts.append(source_ellipsoid((palm_x, -0.01, z), (radius * 1.05, radius * 0.76, radius * 1.18)))
    offsets = (0.46, 0.22, 0.00, -0.22, -0.43)
    for index, offset in enumerate(offsets):
        length = radius * (1.32 - abs(index - 2) * 0.075)
        start = (palm_x + sign * radius * 0.46, -radius * 0.16, z + radius * offset)
        end = (start[0] + sign * length, start[1] - radius * 0.06, start[2])
        parts.append(source_capsule(start, end, radius * 0.19, 0.92))
    thumb_start = (palm_x + sign * radius * 0.20, -radius * 0.24, z - radius * 0.62)
    thumb_end = (thumb_start[0] + sign * radius * 0.72, thumb_start[1] - radius * 0.08, thumb_start[2] - radius * 0.24)
    parts.append(source_capsule(thumb_start, thumb_end, radius * 0.24, 0.95))


def add_hargold_geometry(armature, groups, mats):
    geo = groups["GEO"]
    attach = groups["ATTACHMENTS"]
    skin_parts = [
        source_ellipsoid((0, -0.01, 2.49), (0.72, 0.57, 0.66)),
        source_ellipsoid((-0.34, -0.37, 2.38), (0.31, 0.24, 0.30)),
        source_ellipsoid((0.34, -0.37, 2.38), (0.31, 0.24, 0.30)),
        source_ellipsoid((0, -0.58, 2.49), (0.18, 0.17, 0.15)),
        source_ellipsoid((-0.67, 0.00, 2.48), (0.15, 0.12, 0.21)),
        source_ellipsoid((0.67, 0.00, 2.48), (0.15, 0.12, 0.21)),
        source_capsule((0, 0, 2.10), (0, 0, 2.30), 0.30, 0.90),
        source_ellipsoid((0, 0, 1.40), (0.74, 0.48, 0.84)),
    ]
    for side, sign in (("L", -1), ("R", 1)):
        skin_parts.extend([
            source_capsule((sign * 0.63, 0, 1.92), (sign * 1.33, 0, 1.80), 0.20, 1.04),
            source_capsule((sign * 1.31, 0, 1.80), (sign * 1.70, 0, 1.64), 0.18, 1.02),
            source_capsule((sign * 0.32, 0, 0.95), (sign * 0.32, 0, 0.17), 0.25, 1.04),
        ])
        add_hand_sources(skin_parts, "Hargold", side, sign * 1.70, 1.65, 0.19)
    body = organic_union("GEO_Hargold_skin_body", skin_parts, mats["skin"], geo, voxel=0.040, smooth_iterations=5)
    add_face_shapes(body, "Hargold", (0, -0.01, 2.49))
    drive_shape(body, "SmileSoft", armature, "smile", "smile")
    skin_mesh(body, armature)

    jacket_parts = [
        source_ellipsoid((0, 0.00, 1.48), (0.86, 0.56, 0.90)),
        source_ellipsoid((0, 0.02, 1.92), (0.70, 0.49, 0.38)),
    ]
    for sign in (-1, 1):
        jacket_parts.extend([
            source_capsule((sign * 0.62, 0, 1.93), (sign * 1.24, 0, 1.82), 0.245, 1.02),
            source_capsule((sign * 1.18, 0, 1.82), (sign * 1.43, 0, 1.72), 0.225, 1.0),
        ])
    jacket = organic_union("GEO_Hargold_jacket", jacket_parts, mats["olive"], geo, voxel=0.042, smooth_iterations=5)
    skin_mesh(jacket, armature)
    jacket["garment"] = "continuous-skinned-jacket-and-sleeves"

    trousers_parts = [source_ellipsoid((0, 0.04, 0.93), (0.69, 0.46, 0.42))]
    for sign in (-1, 1):
        trousers_parts.extend([
            source_capsule((sign * 0.31, 0.02, 0.91), (sign * 0.32, 0.02, 0.54), 0.30, 1.0),
            source_capsule((sign * 0.32, 0.02, 0.55), (sign * 0.32, 0.02, 0.25), 0.26, 1.0),
        ])
    trousers = organic_union("GEO_Hargold_trousers", trousers_parts, mats["trouser"], geo, voxel=0.038, smooth_iterations=4)
    skin_mesh(trousers, armature)

    shirt_panel = organic_union(
        "GEO_Hargold_shirt_panel",
        [source_ellipsoid((0, -0.515, 1.53), (0.43, 0.070, 0.55))],
        mats["cream"], geo, voxel=0.025, smooth_iterations=3
    )
    skin_mesh(shirt_panel, armature, ["DEF_spine", "DEF_chest"])

    add_eye_set("Hargold", armature, geo, mats, (0, -0.01, 2.49), (0.72, 0.57, 0.66))
    add_mouth("Hargold", armature, geo, mats, (0, -0.625, 2.27), 0.20)

    beard_parts = [
        source_ellipsoid((x, -0.62, z), scale)
        for x, z, scale in (
            (0, 2.18, (0.30, 0.10, 0.23)),
            (-0.16, 2.12, (0.14, 0.08, 0.16)),
            (0.16, 2.12, (0.14, 0.08, 0.16)),
            (-0.13, 2.40, (0.19, 0.055, 0.065)),
            (0.13, 2.40, (0.19, 0.055, 0.065)),
        )
    ]
    beard = organic_union("GEO_Hargold_beard_and_moustache", beard_parts, mats["hair"], geo, voxel=0.022, smooth_iterations=3)
    finish_rigid(beard, armature, "DEF_head")

    hair_parts = [
        source_ellipsoid(position, scale) for position, scale in (
            ((-0.45, 0.10, 2.76), (0.23, 0.20, 0.25)),
            ((0.45, 0.10, 2.76), (0.23, 0.20, 0.25)),
            ((-0.25, 0.26, 2.88), (0.28, 0.22, 0.24)),
            ((0.25, 0.26, 2.88), (0.28, 0.22, 0.24)),
            ((0.0, 0.30, 2.93), (0.32, 0.22, 0.20)),
        )
    ]
    hair = organic_union("GEO_Hargold_hair", hair_parts, mats["hair"], geo, voxel=0.028, smooth_iterations=3)
    finish_rigid(hair, armature, "DEF_head")

    belt = riglib.torus("GEO_Hargold_belt", (0, 0, 1.04), 0.70, 0.080, mats["brown"], geo, rotation=(0, 0, 0))
    belt.scale.y = 0.76
    finish_rigid(belt, armature, "DEF_hips")
    buckle = riglib.cube("GEO_Hargold_buckle", (0, -0.70, 1.04), (0.18, 0.05, 0.15), mats["brass"], geo, bevel=0.035)
    finish_rigid(buckle, armature, "DEF_hips")
    scarf = riglib.torus("GEO_Hargold_scarf", (0, 0, 2.08), 0.54, 0.16, mats["scarf"], geo, rotation=(0, 0, 0))
    scarf.scale.y = 0.82
    finish_rigid(scarf, armature, "DEF_chest")
    for side, sign in (("L", -1), ("R", 1)):
        tail = riglib.trapezoid_prism(
            f"GEO_Hargold_scarf_tail_{side}", (sign * 0.10, -0.57, 1.80),
            0.12, 0.19, 0.42, 0.045, mats["scarf"], attach
        )
        finish_rigid(tail, armature, f"DEF_scarf_tail.{side}")
        pouch = riglib.cube(
            f"GEO_Hargold_pouch_{side}", (sign * 0.48, -0.60, 1.03),
            (0.17, 0.095, 0.20), mats["brown_light"], attach, bevel=0.055
        )
        finish_rigid(pouch, armature, "DEF_hips")

    brim = riglib.cylinder("GEO_Hargold_hat_brim", (0, 0, 3.04), 0.82, 0.075, mats["olive_dark"], geo)
    brim.scale.y = 0.82
    brim.rotation_euler.y = -0.07
    finish_rigid(brim, armature, "DEF_hat_secondary")
    crown = riglib.cone("GEO_Hargold_hat_crown", (0.04, 0.05, 3.32), 0.48, 0.29, 0.60, mats["olive"], geo, rotation=(0, -0.08, 0))
    finish_rigid(crown, armature, "DEF_hat_secondary")
    band = riglib.torus("GEO_Hargold_hat_band", (0, 0.02, 3.13), 0.40, 0.045, mats["brown_light"], geo, rotation=(0, 0, 0))
    finish_rigid(band, armature, "DEF_hat_secondary")
    feather = riglib.cone("GEO_Hargold_feather", (-0.46, 0.0, 3.31), 0.13, 0.025, 0.58, mats["orange"], attach, rotation=(0, -0.8, 0))
    finish_rigid(feather, armature, "DEF_feather")

    backpack_parts = [
        source_ellipsoid((0, 0.55, 1.56), (0.56, 0.25, 0.64)),
        source_ellipsoid((0, 0.74, 1.77), (0.49, 0.12, 0.25)),
        source_ellipsoid((0, 0.78, 1.37), (0.31, 0.10, 0.23)),
    ]
    backpack = organic_union("GEO_Hargold_backpack", backpack_parts, mats["brown_light"], attach, voxel=0.035, smooth_iterations=4)
    finish_rigid(backpack, armature, "DEF_chest")

    add_boots("Hargold", armature, geo, mats, leg_x=0.32, height=0.46, width=0.30)


def add_mebble_geometry(armature, groups, mats):
    geo = groups["GEO"]
    attach = groups["ATTACHMENTS"]
    skin_parts = [
        source_ellipsoid((0, -0.01, 3.31), (0.53, 0.43, 0.60)),
        source_ellipsoid((-0.22, -0.31, 3.22), (0.22, 0.18, 0.24)),
        source_ellipsoid((0.22, -0.31, 3.22), (0.22, 0.18, 0.24)),
        source_ellipsoid((0, -0.43, 3.31), (0.095, 0.10, 0.085)),
        source_ellipsoid((-0.50, 0, 3.30), (0.12, 0.10, 0.18)),
        source_ellipsoid((0.50, 0, 3.30), (0.12, 0.10, 0.18)),
        source_capsule((0, 0, 2.43), (0, 0, 3.02), 0.155, 0.92),
        source_ellipsoid((0, 0, 1.91), (0.36, 0.27, 0.64)),
        source_ellipsoid((0, -0.17, 2.72), (0.10, 0.075, 0.12)),
    ]
    for side, sign in (("L", -1), ("R", 1)):
        skin_parts.extend([
            source_capsule((sign * 0.36, 0, 2.27), (sign * 0.85, 0, 1.68), 0.13, 1.02),
            source_capsule((sign * 0.85, 0, 1.68), (sign * 1.18, 0, 1.21), 0.115, 1.0),
            source_capsule((sign * 0.20, 0, 1.50), (sign * 0.20, 0, 0.19), 0.145, 1.02),
        ])
        add_hand_sources(skin_parts, "Mebble", side, sign * 1.18, 1.20, 0.13)
    body = organic_union("GEO_Mebble_skin_body", skin_parts, mats["skin"], geo, voxel=0.034, smooth_iterations=5)
    add_face_shapes(body, "Mebble", (0, -0.01, 3.31))
    drive_shape(body, "SmileSoft", armature, "smile", "smile")
    skin_mesh(body, armature)

    shirt_parts = [
        source_ellipsoid((0, 0, 1.91), (0.42, 0.31, 0.69)),
        source_ellipsoid((0, 0, 2.30), (0.39, 0.30, 0.30)),
    ]
    for sign in (-1, 1):
        shirt_parts.extend([
            source_capsule((sign * 0.34, 0, 2.27), (sign * 0.79, 0, 1.73), 0.16, 1.04),
            source_capsule((sign * 0.78, 0, 1.74), (sign * 0.96, 0, 1.48), 0.145, 1.02),
        ])
    shirt = organic_union("GEO_Mebble_shirt", shirt_parts, mats["cream"], geo, voxel=0.034, smooth_iterations=4)
    skin_mesh(shirt, armature)
    shirt["garment"] = "continuous-skinned-shirt-and-sleeves"

    trousers_parts = [source_ellipsoid((0, 0.02, 1.47), (0.37, 0.28, 0.27))]
    for sign in (-1, 1):
        trousers_parts.extend([
            source_capsule((sign * 0.20, 0.01, 1.50), (sign * 0.20, 0.01, 0.72), 0.18, 1.02),
            source_capsule((sign * 0.20, 0.01, 0.72), (sign * 0.20, 0.01, 0.27), 0.15, 1.0),
        ])
    trousers = organic_union("GEO_Mebble_trousers", trousers_parts, mats["trouser"], geo, voxel=0.032, smooth_iterations=4)
    skin_mesh(trousers, armature)

    vest_parts = [
        source_ellipsoid((-0.19, -0.285, 1.96), (0.19, 0.075, 0.58)),
        source_ellipsoid((0.19, -0.285, 1.96), (0.19, 0.075, 0.58)),
    ]
    vest = organic_union("GEO_Mebble_vest", vest_parts, mats["brown_light"], geo, voxel=0.026, smooth_iterations=3)
    skin_mesh(vest, armature, ["DEF_spine", "DEF_chest"])

    add_eye_set("Mebble", armature, geo, mats, (0, -0.01, 3.31), (0.53, 0.43, 0.60), glasses=True)
    add_mouth("Mebble", armature, geo, mats, (0, -0.455, 3.10), 0.17)

    hair_parts = [
        source_ellipsoid(position, scale) for position, scale in (
            ((-0.30, 0.00, 3.58), (0.22, 0.18, 0.24)),
            ((-0.13, -0.03, 3.70), (0.23, 0.18, 0.26)),
            ((0.05, -0.04, 3.72), (0.24, 0.18, 0.25)),
            ((0.23, 0.00, 3.62), (0.22, 0.18, 0.24)),
            ((0, 0.23, 3.59), (0.34, 0.23, 0.27)),
        )
    ]
    hair = organic_union("GEO_Mebble_hair", hair_parts, mats["hair"], geo, voxel=0.024, smooth_iterations=3)
    finish_rigid(hair, armature, "DEF_head")
    goatee = rigid_ellipsoid("GEO_Mebble_goatee", (0, -0.455, 2.97), (0.075, 0.025, 0.055), mats["hair"], geo, armature, "DEF_jaw")

    for z in (1.52, 1.75):
        belt = riglib.torus(f"GEO_Mebble_belt_{z}", (0, 0, z), 0.39, 0.05, mats["brown"], geo, rotation=(0, 0, 0))
        belt.scale.y = 0.78
        finish_rigid(belt, armature, "DEF_hips" if z < 1.6 else "DEF_spine")
        buckle = riglib.cube(f"GEO_Mebble_buckle_{z}", (0, -0.405, z), (0.115, 0.04, 0.095), mats["brass"], geo, bevel=0.022)
        finish_rigid(buckle, armature, "DEF_hips" if z < 1.6 else "DEF_spine")
    for side, sign in (("L", -1), ("R", 1)):
        pouch = riglib.cube(
            f"GEO_Mebble_pouch_{side}", (sign * 0.34, -0.35, 1.54),
            (0.14, 0.08, 0.18), mats["brown"], attach, bevel=0.05
        )
        finish_rigid(pouch, armature, "DEF_hips")

    hood = organic_union(
        "GEO_Mebble_hood",
        [
            source_ellipsoid((0, 0.22, 2.44), (0.39, 0.20, 0.18)),
            source_ellipsoid((-0.24, -0.10, 2.43), (0.19, 0.11, 0.12)),
            source_ellipsoid((0.24, -0.10, 2.43), (0.19, 0.11, 0.12)),
        ],
        mats["olive"], geo, voxel=0.028, smooth_iterations=3
    )
    skin_mesh(hood, armature, ["DEF_chest", "DEF_neck"])

    cape = riglib.curved_cape("GEO_Mebble_cape", (0, 0.43, 2.04), 0.70, 1.15, 1.82, 0.08, mats["olive"], attach)
    cape["geometry_generation"] = GENERATION
    riglib.skin_cape(cape, armature)

    brim = riglib.cylinder("GEO_Mebble_hat_brim", (0.065, 0, 3.82), 0.39, 0.055, mats["brown"], geo)
    brim.scale.y = 0.82
    brim.rotation_euler.y = 0.14
    brim.rotation_euler.z = -0.08
    finish_rigid(brim, armature, "DEF_hat_secondary")
    crown = riglib.cone("GEO_Mebble_hat_crown", (0.095, 0.01, 4.10), 0.255, 0.30, 0.58, mats["brown_light"], geo, rotation=(0, 0.14, -0.08))
    finish_rigid(crown, armature, "DEF_hat_secondary")
    band = riglib.torus("GEO_Mebble_hat_band", (0.065, 0, 3.88), 0.265, 0.034, mats["olive_light"], geo, rotation=(0, 0.14, -0.08))
    finish_rigid(band, armature, "DEF_hat_secondary")
    leaf = rigid_ellipsoid("GEO_Mebble_hat_leaf", (0.38, -0.01, 4.02), (0.15, 0.030, 0.065), mats["olive_light"], attach, armature, "DEF_hat_secondary")

    add_boots("Mebble", armature, geo, mats, leg_x=0.20, height=0.64, width=0.19)


def add_boots(hero, armature, geo, mats, leg_x, height, width):
    for side, sign in (("L", -1), ("R", 1)):
        parts = [
            source_ellipsoid((sign * leg_x, 0.01, height * 0.52), (width * 1.20, width * 1.05, height * 0.52)),
            source_ellipsoid((sign * leg_x, -0.28, height * 0.25), (width * 1.34, 0.28, height * 0.27)),
            source_ellipsoid((sign * leg_x, 0.13, height * 0.23), (width * 1.10, 0.20, height * 0.24)),
            source_ellipsoid((sign * leg_x, -0.12, 0.07), (width * 1.38, 0.38, 0.075)),
        ]
        boot = organic_union(f"GEO_{hero}_boot_{side}", parts, mats["brown"], geo, voxel=0.026, smooth_iterations=4)
        skin_mesh(boot, armature, [f"DEF_shin.{side}", f"DEF_foot.{side}"], max_influences=2)
        for lace_index in range(4 if hero == "Mebble" else 3):
            lace = riglib.cube(
                f"GEO_{hero}_boot_lace_{side}_{lace_index}",
                (sign * leg_x, -0.29 if hero == "Hargold" else -0.25, 0.19 + lace_index * (0.08 if hero == "Hargold" else 0.10)),
                (width * 0.72, 0.016, 0.012), mats["brass"], geo,
                rotation=(0, 0, (0.18 if lace_index % 2 else -0.18) * sign), bevel=0.007
            )
            finish_rigid(lace, armature, f"DEF_shin.{side}")


def tune_materials(mats):
    for name, mat in mats.items():
        bsdf = next((node for node in mat.node_tree.nodes if node.bl_idname == "ShaderNodeBsdfPrincipled"), None)
        if not bsdf:
            continue
        if name in {"skin", "skin_light"}:
            if "Subsurface Weight" in bsdf.inputs:
                bsdf.inputs["Subsurface Weight"].default_value = 0.11
            bsdf.inputs["Roughness"].default_value = 0.58
        elif name in {"brown", "brown_light"}:
            bsdf.inputs["Roughness"].default_value = 0.58
            if "Coat Weight" in bsdf.inputs:
                bsdf.inputs["Coat Weight"].default_value = 0.07
        elif name in {"olive", "olive_light", "olive_dark", "cream", "scarf", "trouser"}:
            bsdf.inputs["Roughness"].default_value = 0.72
    return mats


def build(hero):
    riglib.reset_scene()
    bpy.context.preferences.filepaths.save_version = 0
    groups = riglib.collections()
    palette = dict(riglib.PALETTE)
    # Warm peach skin with enough shared RGB energy to avoid the saturated
    # orange/varnished-wood look of the previous material.
    palette["skin"] = (0.72, 0.43, 0.29, 1)
    palette["skin_light"] = (0.83, 0.54, 0.38, 1)
    mats = tune_materials({
        key: riglib.material(
            f"MAT_{key}", value,
            0.50 if key not in {"brass", "glass"} else 0.28,
            0.65 if key == "brass" else 0.0
        )
        for key, value in palette.items()
    })
    if hero == "Hargold":
        dims = dict(height=3.42, head_center=2.48, head_top=3.00, hip=1.05, shoulder=1.92, chest_half=0.58, elbow=1.34, wrist=1.72, leg_x=0.32, knee=0.54, ankle=0.17)
    else:
        dims = dict(height=4.16, head_center=3.30, head_top=3.79, hip=1.50, shoulder=2.27, chest_half=0.36, elbow=0.86, wrist=1.18, leg_x=0.20, knee=0.72, ankle=0.19)
    riglib.add_locked_reference(hero, groups["REF"], dims["height"])
    armature = riglib.create_armature(hero, dims, groups["RIG"])
    if hero == "Hargold":
        add_hargold_geometry(armature, groups, mats)
    else:
        add_mebble_geometry(armature, groups, mats)
    collision = riglib.cylinder(
        f"COL_{hero}_proxy", (0, 0, dims["height"] / 2),
        dims["chest_half"] * 1.05, dims["height"], mats["glass"],
        groups["COLLISION_PROXY"]
    )
    collision.display_type = "WIRE"
    collision.hide_render = True
    collision["export_enabled"] = False
    collision["geometry_generation"] = GENERATION
    riglib.add_production_actions(armature, hero)
    for action in bpy.data.actions:
        action["source_geometry"] = GENERATION
    scene = bpy.context.scene
    scene["assetVersion"] = "2.0.0-continuous-skin"
    scene["canonVersion"] = "2026-07-25-character-overhaul-2"
    scene["referenceHash"] = "4004C659783AC41ED09E6AF18D25F776DFB19BE44B9E7066289627E016A7B4E4" if hero == "Hargold" else "1A85C41AFC53061612B772F221A3F354E4E58C015F4753AFF2C3C44EC80662D0"
    scene["author"] = "Hargold & Mebble continuous-skin pipeline"
    scene["blenderVersion"] = bpy.app.version_string
    scene["reviewStatus"] = "continuous-skin-rebuild-visual-approval-required"
    scene["geometryGeneration"] = GENERATION
    scene["reusesPriorGeometry"] = False
    scene["sourceScene"] = "factory-empty"
    scene["animationGeneration"] = "original-full-body-clips-on-continuous-skin-2026-07-25"
    scene["lockedReference"] = str(riglib.REFERENCE_DIR / f"{hero} locked production character sheet.png")
    scene["benchmarkBoundary"] = "craft-principles-only-no-Nintendo-assets-or-geometry"

    riglib.setup_render(hero, groups["GEO"])
    BLEND_DIR.mkdir(parents=True, exist_ok=True)
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    source = BLEND_DIR / f"{hero.lower()}_character.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source), check_existing=False)
    riglib.export_glb(hero, armature)
    armature.animation_data.action = bpy.data.actions["idle"]
    if hero == "Mebble":
        armature.pose.bones["CTRL_cape.01"]["cape_open"] = 0.0
    scene.frame_set(2)
    scene.frame_set(1)
    bpy.context.view_layer.update()
    scene.render.filepath = str(PREVIEW_DIR / f"{hero.lower()}_character_preview.png")
    bpy.ops.render.render(write_still=True)
    riglib.render_qa_views(hero)
    riglib.render_action_pose(hero, armature)
    print(f"HM_CONTINUOUS_CHARACTER_BUILT {hero} {source}")


if __name__ == "__main__":
    for character in ("Hargold", "Mebble"):
        build(character)
