"""Build new production-topology character staging assets from empty scenes.

The locked reference sheets are the only character-design authority. This
builder does not read or reuse the rejected character geometry. Visible body,
clothing, boot, hat, and accessory surfaces are rebuilt as authored ring-loft,
grid, annulus, and beveled hard-surface meshes at canonical gameplay metres.
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
from animation_mannequin_spec import (
    REVIEW_FRAMES,
    SPEC_ID,
    review_camera,
    review_frame,
    scaled_frame,
    spec_hash,
    validate_specs,
)
from character_presentation import PROFILE_PATH, load_profile, reveal_degrees


ROOT = Path(__file__).resolve().parents[2]
STAGING_BLEND = ROOT / "assets" / "blender" / "production-staging"
STAGING_EXPORT = ROOT / "assets" / "exports" / "production-staging"
STAGING_PREVIEW = ROOT / "assets" / "previews" / "production-staging"
FIT_PREVIEW = ROOT / "assets" / "previews" / "mannequin-fit"
GENERATION = "production-mannequin-fitted-v4"


def move_to(obj, collection):
    for existing in tuple(obj.users_collection):
        existing.objects.unlink(obj)
    collection.objects.link(obj)


def finish_mesh(obj, material, collection, construction="authored-quad-loft"):
    obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    obj["production_part"] = True
    obj["export_enabled"] = True
    obj["geometry_generation"] = GENERATION
    obj["surface_construction"] = construction
    obj["source_geometry_reused"] = False
    move_to(obj, collection)
    return obj


def loft_mesh(name, axis, rings, material, collection, segments=32, cap=True):
    """Create a clean ring-loop surface.

    Each ring is (axis_position, radius_a, radius_b, center_a, center_b).
    The radial axes are X/Y for Z lofts, Y/Z for X lofts, and X/Z for Y lofts.
    """
    vertices = []
    uvs = []
    for ring_index, (position, radius_a, radius_b, center_a, center_b) in enumerate(rings):
        v = ring_index / max(1, len(rings) - 1)
        for segment in range(segments):
            angle = 2 * math.pi * segment / segments
            a = center_a + math.cos(angle) * radius_a
            b = center_b + math.sin(angle) * radius_b
            if axis == "Z":
                vertex = (a, b, position)
            elif axis == "X":
                vertex = (position, a, b)
            elif axis == "Y":
                vertex = (a, position, b)
            else:
                raise ValueError(f"unsupported loft axis {axis}")
            vertices.append(vertex)
            uvs.append((segment / segments, v))
    faces = []
    for ring_index in range(len(rings) - 1):
        base = ring_index * segments
        next_base = (ring_index + 1) * segments
        for segment in range(segments):
            next_segment = (segment + 1) % segments
            faces.append((
                base + segment,
                base + next_segment,
                next_base + next_segment,
                next_base + segment,
            ))
    if cap:
        start_center = len(vertices)
        end_center = start_center + 1
        first = rings[0]
        last = rings[-1]
        if axis == "Z":
            vertices.extend(((first[3], first[4], first[0]), (last[3], last[4], last[0])))
        elif axis == "X":
            vertices.extend(((first[0], first[3], first[4]), (last[0], last[3], last[4])))
        else:
            vertices.extend(((first[3], first[0], first[4]), (last[3], last[0], last[4])))
        uvs.extend(((0.5, 0), (0.5, 1)))
        for segment in range(segments):
            next_segment = (segment + 1) % segments
            faces.append((start_center, next_segment, segment))
            end_base = (len(rings) - 1) * segments
            faces.append((end_center, end_base + segment, end_base + next_segment))
    mesh = bpy.data.meshes.new(f"MESH_{name}")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    uv_layer = mesh.uv_layers.new(name="UV0")
    for polygon in mesh.polygons:
        for loop_index in polygon.loop_indices:
            uv_layer.data[loop_index].uv = uvs[mesh.loops[loop_index].vertex_index]
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    return finish_mesh(obj, material, collection)


def annulus_mesh(name, z, inner_radius, outer_radius, thickness, material, collection, segments=48):
    vertices = []
    faces = []
    for level in (-thickness * 0.5, thickness * 0.5):
        for radius in (inner_radius, outer_radius):
            for segment in range(segments):
                angle = 2 * math.pi * segment / segments
                vertices.append((math.cos(angle) * radius, math.sin(angle) * radius, z + level))
    for segment in range(segments):
        nxt = (segment + 1) % segments
        bottom_inner = segment
        bottom_outer = segments + segment
        top_inner = segments * 2 + segment
        top_outer = segments * 3 + segment
        faces.extend((
            (bottom_outer, segments + nxt, segments * 3 + nxt, top_outer),
            (top_inner, top_outer, segments * 3 + nxt, segments * 2 + nxt),
            (bottom_inner, top_inner, segments * 2 + nxt, nxt),
            (bottom_inner, nxt, segments + nxt, bottom_outer),
        ))
    mesh = bpy.data.meshes.new(f"MESH_{name}")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.uv.smart_project(island_margin=0.02)
    bpy.ops.object.mode_set(mode="OBJECT")
    obj.select_set(False)
    return finish_mesh(obj, material, collection, "authored-quad-annulus")


def ellipsoid_mesh(name, center, radii, material, collection, segments=32, rings=12):
    """Create a smooth authored ellipsoid with deformation-friendly latitude loops."""
    center_x, center_y, center_z = center
    radius_x, radius_y, radius_z = radii
    vertices = [(center_x, center_y, center_z - radius_z)]
    for ring_index in range(1, rings):
        latitude = -math.pi * 0.5 + math.pi * ring_index / rings
        latitude_scale = math.cos(latitude)
        for segment in range(segments):
            longitude = 2 * math.pi * segment / segments
            vertices.append((
                center_x + math.cos(longitude) * radius_x * latitude_scale,
                center_y + math.sin(longitude) * radius_y * latitude_scale,
                center_z + math.sin(latitude) * radius_z,
            ))
    top_index = len(vertices)
    vertices.append((center_x, center_y, center_z + radius_z))
    faces = []
    for segment in range(segments):
        nxt = (segment + 1) % segments
        faces.append((0, 1 + nxt, 1 + segment))
    for ring_index in range(rings - 2):
        base = 1 + ring_index * segments
        next_base = base + segments
        for segment in range(segments):
            nxt = (segment + 1) % segments
            faces.append((base + segment, base + nxt, next_base + nxt, next_base + segment))
    last_ring = 1 + (rings - 2) * segments
    for segment in range(segments):
        nxt = (segment + 1) % segments
        faces.append((last_ring + segment, last_ring + nxt, top_index))
    mesh = bpy.data.meshes.new(f"MESH_{name}")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.uv.smart_project(island_margin=0.02)
    bpy.ops.object.mode_set(mode="OBJECT")
    obj.select_set(False)
    return finish_mesh(obj, material, collection, "authored-latitude-loop-surface")


def rounded_box(name, location, scale, material, collection, bevel=0.04):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    modifier = obj.modifiers.new("ProductionEdgeBevel", "BEVEL")
    modifier.width = bevel
    modifier.segments = 4
    modifier.limit_method = "ANGLE"
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.uv.smart_project(island_margin=0.02)
    bpy.ops.object.mode_set(mode="OBJECT")
    return finish_mesh(obj, material, collection, "authored-beveled-hard-surface")


def curve_tube(
    name,
    points,
    radius,
    material,
    collection,
    cyclic=False,
    taper=False,
    handle_type="AUTO",
):
    curve = bpy.data.curves.new(f"CURVE_{name}", "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 3
    curve.bevel_depth = radius
    curve.bevel_resolution = 4
    spline = curve.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for point_index, (point, coordinate) in enumerate(zip(spline.bezier_points, points)):
        point.co = coordinate
        point.handle_left_type = handle_type
        point.handle_right_type = handle_type
        if taper and len(points) > 1:
            point.radius = 1.0 - 0.72 * point_index / (len(points) - 1)
    spline.use_cyclic_u = cyclic
    obj = bpy.data.objects.new(name, curve)
    collection.objects.link(obj)
    obj.data.materials.append(material)
    obj["production_part"] = True
    obj["export_enabled"] = True
    obj["geometry_generation"] = GENERATION
    obj["surface_construction"] = "authored-bezier-tube"
    obj["source_geometry_reused"] = False
    return obj


def oval_tube(name, center, radius_x, radius_z, tube_radius, material, collection, tilt=0.0):
    """Create an authored oval accessory in the profile-facing X/Z plane."""
    center_x, center_y, center_z = center
    points = []
    cos_tilt = math.cos(tilt)
    sin_tilt = math.sin(tilt)
    for segment in range(32):
        angle = 2 * math.pi * segment / 32
        local_x = math.cos(angle) * radius_x
        local_z = math.sin(angle) * radius_z
        points.append((
            center_x + local_x * cos_tilt - local_z * sin_tilt,
            center_y,
            center_z + local_x * sin_tilt + local_z * cos_tilt,
        ))
    return curve_tube(name, points, tube_radius, material, collection, cyclic=True)


def add_armature_modifier(obj, armature):
    world = obj.matrix_world.copy()
    obj.parent = armature
    obj.matrix_parent_inverse = armature.matrix_world.inverted()
    obj.matrix_world = world
    modifier = obj.modifiers.new("ProductionArmature", "ARMATURE")
    modifier.object = armature
    modifier.use_deform_preserve_volume = True


def point_segment_distance(point, start, end):
    segment = end - start
    denominator = segment.length_squared
    if denominator < 1e-9:
        return (point - start).length
    t = max(0.0, min(1.0, (point - start).dot(segment) / denominator))
    return (point - (start + segment * t)).length


def skin_to_bones(obj, armature, bone_names, max_influences=4):
    groups = {name: obj.vertex_groups.new(name=name) for name in bone_names if name in armature.data.bones}
    segments = {
        name: (
            Vector(armature.data.bones[name].head_local),
            Vector(armature.data.bones[name].tail_local),
        )
        for name in groups
    }
    for vertex in obj.data.vertices:
        distances = sorted(
            (point_segment_distance(vertex.co, start, end), name)
            for name, (start, end) in segments.items()
        )[:max_influences]
        nearest = distances[0][0]
        adjacent = [(distance, name) for distance, name in distances if distance <= nearest + 0.075]
        raw = [(math.exp(-((distance - nearest) / 0.045) ** 2), name) for distance, name in adjacent]
        total = sum(weight for weight, _ in raw)
        for weight, name in raw:
            groups[name].add([vertex.index], weight / total, "REPLACE")
    add_armature_modifier(obj, armature)
    obj["binding"] = "normalized-four-influence-production-skin"
    return obj


def parent_bone(obj, armature, bone_name):
    riglib.parent_bone(obj, armature, bone_name)
    obj["geometry_generation"] = GENERATION
    obj["source_geometry_reused"] = False
    return obj


def add_shape_drivers(head, armature, center_z):
    head.shape_key_add(name="Basis")
    smile = head.shape_key_add(name="SmileSoft")
    squash = head.shape_key_add(name="SquashStretch")
    for index, vertex in enumerate(head.data.vertices):
        if vertex.co.y < -0.20 and vertex.co.z < center_z:
            side = min(abs(vertex.co.x) / 0.42, 1.0)
            smile.data[index].co.z += side * 0.018
            smile.data[index].co.x += math.copysign(side * 0.012, vertex.co.x or 1)
        squash.data[index].co.x *= 1.025
        squash.data[index].co.y *= 1.025
        squash.data[index].co.z = center_z + (vertex.co.z - center_z) * 0.96
    for shape_name, property_name, expression in (
        ("SmileSoft", "smile", "smile"),
        ("SquashStretch", "mouth_open", "mouth_open * 0.18"),
    ):
        driver = head.data.shape_keys.key_blocks[shape_name].driver_add("value").driver
        driver.type = "SCRIPTED"
        variable = driver.variables.new()
        variable.name = property_name
        variable.type = "SINGLE_PROP"
        variable.targets[0].id = armature
        variable.targets[0].data_path = f'pose.bones["CTRL_face"]["{property_name}"]'
        driver.expression = expression


def drive_scale(obj, armature, index, property_name, expression):
    riglib.drive_transform(
        obj, "scale", index, armature, "CTRL_face", property_name, expression
    )


def build_eyes(hero, armature, geo, mats, center_z, x_spacing, eye_height, eye_width, front_y):
    for side, sign in (("L", -1), ("R", 1)):
        x = sign * x_spacing
        eye = ellipsoid_mesh(
            f"GEO_{hero}_eye_{side}",
            (x, front_y, center_z),
            (eye_width, 0.030, eye_height * 0.52),
            mats["white"],
            geo,
            28,
            14,
        )
        parent_bone(eye, armature, f"DEF_eye.{side}")
        drive_scale(eye, armature, 2, f"blink_{side}", f"1.0 - 0.88 * blink_{side}")
        iris = ellipsoid_mesh(
            f"GEO_{hero}_iris_{side}",
            (x, front_y - 0.037, center_z),
            (eye_width * 0.44, 0.012, eye_height * 0.34),
            mats["iris"],
            geo,
            24,
            12,
        )
        parent_bone(iris, armature, f"DEF_eye.{side}")
        drive_scale(iris, armature, 2, f"blink_{side}", f"1.0 - 0.88 * blink_{side}")
        pupil = ellipsoid_mesh(
            f"GEO_{hero}_pupil_{side}",
            (x, front_y - 0.054, center_z),
            (eye_width * 0.19, 0.008, eye_height * 0.18),
            mats["black"],
            geo,
            20,
            10,
        )
        parent_bone(pupil, armature, f"DEF_eye.{side}")
        drive_scale(pupil, armature, 2, f"blink_{side}", f"1.0 - 0.88 * blink_{side}")


def build_hands(hero, armature, geo, mats, wrist_x, z, size):
    for side, sign in (("L", -1), ("R", 1)):
        palm_center = sign * (wrist_x + size * 0.50)
        palm = loft_mesh(
            f"GEO_{hero}_hand_{side}", "X",
            [
                (sign * wrist_x, size * 0.46, size * 0.65, 0, z),
                (palm_center, size * 0.58, size * 0.76, -0.015, z),
                (sign * (wrist_x + size), size * 0.48, size * 0.64, -0.020, z),
            ],
            mats["skin"], geo, 28,
        )
        skin_to_bones(palm, armature, [f"DEF_forearm.{side}", f"DEF_hand.{side}"], 2)
        finger_names = ("index", "middle", "ring", "pinky")
        for index, finger in enumerate(finger_names):
            finger_z = z + size * (0.38 - index * 0.24)
            base = sign * (wrist_x + size * 0.82)
            tip = sign * (wrist_x + size * (1.34 - index * 0.035))
            finger_obj = loft_mesh(
                f"GEO_{hero}_{finger}_{side}", "X",
                [
                    (base, size * 0.15, size * 0.17, -0.030, finger_z),
                    ((base + tip) * 0.5, size * 0.14, size * 0.15, -0.038, finger_z),
                    (tip, size * 0.095, size * 0.11, -0.046, finger_z),
                ],
                mats["skin"], geo, 16,
            )
            skin_to_bones(
                finger_obj, armature,
                [f"DEF_hand.{side}", f"DEF_{finger}.01.{side}", f"DEF_{finger}.02.{side}"],
                3,
            )
        thumb_base = sign * (wrist_x + size * 0.56)
        thumb_tip = sign * (wrist_x + size * 1.05)
        thumb = loft_mesh(
            f"GEO_{hero}_thumb_{side}", "X",
            [
                (thumb_base, size * 0.19, size * 0.22, -0.11, z - size * 0.48),
                (thumb_tip, size * 0.11, size * 0.14, -0.14, z - size * 0.62),
            ],
            mats["skin"], geo, 16,
        )
        skin_to_bones(
            thumb, armature,
            [f"DEF_hand.{side}", f"DEF_thumb.01.{side}", f"DEF_thumb.02.{side}"],
            3,
        )


def build_boot(hero, side, armature, geo, mats, x, shaft_top, width, toe_length):
    sign = -1 if side == "L" else 1
    shaft = loft_mesh(
        f"GEO_{hero}_boot_shaft_{side}", "Z",
        [
            (0.08, width * 0.88, width * 0.86, sign * x, 0.03),
            (shaft_top * 0.48, width, width * 0.92, sign * x, 0.03),
            (shaft_top, width * 1.06, width * 0.96, sign * x, 0.04),
        ],
        mats["brown"], geo, 28,
    )
    skin_to_bones(shaft, armature, [f"DEF_shin.{side}", f"DEF_foot.{side}"], 2)
    toe = loft_mesh(
        f"GEO_{hero}_boot_toe_{side}", "Y",
        [
            (0.08, width * 0.92, width * 0.52, sign * x, 0.16),
            (-toe_length * 0.45, width * 1.10, width * 0.60, sign * x, 0.15),
            (-toe_length, width * 0.96, width * 0.46, sign * x, 0.14),
        ],
        mats["brown"], geo, 28,
    )
    skin_to_bones(toe, armature, [f"DEF_foot.{side}", f"DEF_toe.{side}"], 2)
    sole = rounded_box(
        f"GEO_{hero}_boot_sole_{side}",
        (sign * x, -toe_length * 0.42, 0.045),
        (width * 1.14, toe_length * 0.72, 0.045),
        mats["brown_dark"], geo, 0.028,
    )
    skin_to_bones(sole, armature, [f"DEF_foot.{side}", f"DEF_toe.{side}"], 2)
    heel = rounded_box(
        f"GEO_{hero}_boot_heel_{side}",
        (sign * x, 0.11, 0.08),
        (width * 0.82, 0.12, 0.08),
        mats["brown_dark"], geo, 0.025,
    )
    skin_to_bones(heel, armature, [f"DEF_foot.{side}"], 1)
    for lace_index in range(4 if hero == "Mebble" else 3):
        lace_z = 0.15 + lace_index * (shaft_top - 0.17) / (4 if hero == "Mebble" else 3)
        lace = curve_tube(
            f"GEO_{hero}_boot_stitch_{side}_{lace_index}",
            [
                (sign * (x - width * 0.65), -0.12, lace_z),
                (sign * x, -0.18, lace_z + 0.012),
                (sign * (x + width * 0.65), -0.12, lace_z),
            ],
            0.009, mats["stitch"], geo,
        )
        parent_bone(lace, armature, f"DEF_shin.{side}")


def cape_grid(name, hero, armature, geo, material, top_z, bottom_z, top_width, bottom_width):
    columns, rows = 17, 13
    vertices = []
    faces = []
    for row in range(rows):
        t = row / (rows - 1)
        z = top_z + (bottom_z - top_z) * t
        width = top_width + (bottom_width - top_width) * t
        for column in range(columns):
            u = column / (columns - 1)
            x = (u - 0.5) * width
            shoulder_distance = abs(u - 0.5) * 2.0
            shoulder_wrap = (1.0 - t) ** 2 * shoulder_distance
            # The top two rows form a curved shoulder yoke instead of a flat
            # panel.  The sides wrap toward the arms and drop slightly over
            # the deltoids, while the lower rows retain a free cloth arc.
            y = (
                0.17
                + math.sin(t * math.pi) * 0.10
                - shoulder_wrap * (0.10 if hero == "Mebble" else 0.055)
            )
            local_z = z - shoulder_wrap * (0.11 if hero == "Mebble" else 0.06)
            vertices.append((x, y, local_z))
    for row in range(rows - 1):
        for column in range(columns - 1):
            a = row * columns + column
            faces.append((a, a + 1, a + columns + 1, a + columns))
    mesh = bpy.data.meshes.new(f"MESH_{name}")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    uv = mesh.uv_layers.new(name="UV0")
    for polygon in mesh.polygons:
        for loop_index in polygon.loop_indices:
            vertex_index = mesh.loops[loop_index].vertex_index
            row, column = divmod(vertex_index, columns)
            uv.data[loop_index].uv = (column / (columns - 1), 1 - row / (rows - 1))
    obj = bpy.data.objects.new(name, mesh)
    geo.objects.link(obj)
    finish_mesh(obj, material, geo, "authored-cloth-grid")
    obj["shoulder_yoke"] = "curved-wrapped"
    obj["gameplay_silhouette_priority"] = True
    solidify = obj.modifiers.new("CapeThickness", "SOLIDIFY")
    solidify.thickness = 0.018
    solidify.offset = 0
    subdiv = obj.modifiers.new("CapeSurface", "SUBSURF")
    subdiv.levels = 1
    subdiv.render_levels = 1
    if hero == "Mebble":
        groups = ["DEF_cape.01", "DEF_cape.02", "DEF_cape.03"]
    else:
        groups = ["DEF_backpack", "DEF_scarf_tail.L", "DEF_scarf_tail.R"]
    skin_to_bones(obj, armature, groups, 3)
    return obj


def materials():
    palette = dict(riglib.PALETTE)
    palette.update({
        "skin": (0.79, 0.48, 0.31, 1),
        "skin_light": (0.91, 0.66, 0.47, 1),
        "brown_dark": (0.11, 0.045, 0.018, 1),
        "stitch": (0.69, 0.38, 0.12, 1),
        "wood": (0.25, 0.095, 0.035, 1),
    })
    result = {}
    for key, color in palette.items():
        roughness = (
            0.28 if key in {"brass", "glass"}
            else 0.42 if key in {"brown", "brown_light", "brown_dark"}
            else 0.68 if key in {"olive", "olive_light", "olive_dark", "cream", "scarf", "trouser"}
            else 0.55
        )
        result[key] = riglib.material(
            f"MAT_PROD_{key}", color, roughness,
            0.65 if key == "brass" else 0,
        )
        result[key]["material_class"] = (
            "metal" if key == "brass"
            else "leather" if key in {"brown", "brown_light", "brown_dark"}
            else "woven-fabric" if key in {"olive", "olive_light", "olive_dark", "cream", "scarf", "trouser"}
            else "skin" if key.startswith("skin")
            else "surface"
        )
    return result


def build_hargold(armature, groups, mats, dims):
    geo, attach = groups["GEO"], groups["ATTACHMENTS"]
    head = loft_mesh(
        "GEO_Hargold_head", "Z",
        [
            (0.98, 0.20, 0.18, 0, 0.00),
            (1.04, 0.32, 0.27, 0, -0.01),
            (1.12, 0.39, 0.32, 0, -0.025),
            (1.21, 0.44, 0.36, 0, -0.035),
            (1.32, 0.46, 0.38, 0, -0.035),
            (1.42, 0.44, 0.36, 0, -0.020),
            (1.51, 0.37, 0.30, 0, 0.005),
            (1.57, 0.27, 0.22, 0, 0.030),
            (1.60, 0.14, 0.11, 0, 0.035),
        ],
        mats["skin"], geo, 40,
    )
    skin_to_bones(head, armature, ["DEF_neck_upper", "DEF_head", "DEF_jaw"], 3)
    add_shape_drivers(head, armature, 1.30)
    torso_skin = loft_mesh(
        "GEO_Hargold_skin_torso", "Z",
        [
            (dims["hip"] - 0.17, 0.33, 0.25, 0, 0.02),
            (dims["hip"] - 0.09, 0.39, 0.29, 0, 0.03),
            (dims["hip"] + 0.05, 0.46, 0.33, 0, 0.03),
            (dims["hip"] + 0.22, 0.49, 0.35, 0, 0.02),
            (dims["hip"] + 0.36, 0.47, 0.34, 0, 0.01),
            (dims["shoulder"] - 0.10, 0.43, 0.31, 0, 0.00),
            (dims["shoulder"], dims["chest_half"], 0.28, 0, 0.00),
        ],
        mats["skin"], geo, 40,
    )
    skin_to_bones(
        torso_skin,
        armature,
        ["DEF_hips", "DEF_spine_lower", "DEF_spine_mid", "DEF_spine_upper", "DEF_chest"],
        4,
    )
    jacket = loft_mesh(
        "GEO_Hargold_jacket", "Z",
        [
            (dims["hip"] - 0.13, 0.36, 0.28, 0, 0.025),
            (dims["hip"] - 0.06, 0.42, 0.31, 0, 0.03),
            (dims["hip"] + 0.05, 0.49, 0.35, 0, 0.03),
            (dims["hip"] + 0.23, 0.51, 0.37, 0, 0.02),
            (dims["hip"] + 0.38, 0.49, 0.36, 0, 0.01),
            (dims["shoulder"] - 0.10, 0.44, 0.33, 0, 0.00),
            (dims["shoulder"], dims["chest_half"] + 0.01, 0.29, 0, 0.00),
        ],
        mats["olive"], geo, 40,
    )
    skin_to_bones(
        jacket,
        armature,
        ["DEF_hips", "DEF_spine_lower", "DEF_spine_mid", "DEF_spine_upper", "DEF_chest"],
        4,
    )
    shirt_panel = loft_mesh(
        "GEO_Hargold_shirt_panel", "Y",
        [
            (-0.350, 0.25, 0.26, 0, dims["hip"] + 0.24),
            (-0.375, 0.22, 0.24, 0, dims["hip"] + 0.26),
        ],
        mats["cream"], geo, 28,
    )
    skin_to_bones(shirt_panel, armature, ["DEF_spine_mid", "DEF_spine_upper", "DEF_chest"], 3)
    trousers = loft_mesh(
        "GEO_Hargold_trousers", "Z",
        [
            (dims["knee"] - 0.08, 0.34, 0.25, 0, 0.025),
            (dims["hip"] - 0.16, 0.42, 0.30, 0, 0.03),
            (dims["hip"], 0.43, 0.31, 0, 0.03),
        ],
        mats["trouser"], geo, 36,
    )
    skin_to_bones(trousers, armature, ["DEF_hips", "DEF_thigh.L", "DEF_thigh.R"], 3)
    for side, sign in (("L", -1), ("R", 1)):
        arm = loft_mesh(
            f"GEO_Hargold_sleeve_{side}", "X",
            [
                (sign * dims["chest_half"], 0.205, 0.205, -0.012, dims["shoulder"]),
                (sign * (dims["chest_half"] + 0.05), 0.235, 0.245, -0.022, dims["shoulder"] + 0.01),
                (sign * (dims["chest_half"] + 0.09), 0.220, 0.230, -0.018, dims["shoulder"] - 0.02),
                (sign * dims["elbow"], 0.180, 0.190, -0.010, dims["elbow_z"]),
                (sign * (dims["elbow"] + (dims["wrist"] - dims["elbow"]) * 0.42), 0.158, 0.170, -0.005, dims["elbow_z"] + (dims["wrist_z"] - dims["elbow_z"]) * 0.42),
                (sign * (dims["elbow"] + (dims["wrist"] - dims["elbow"]) * 0.74), 0.145, 0.158, 0.000, dims["elbow_z"] + (dims["wrist_z"] - dims["elbow_z"]) * 0.74),
                (sign * dims["wrist"], 0.132, 0.145, 0.000, dims["wrist_z"]),
            ],
            mats["olive"], geo, 28,
        )
        skin_to_bones(
            arm,
            armature,
            [f"DEF_clavicle.{side}", f"DEF_upper_arm.{side}", f"DEF_forearm.{side}"],
            3,
        )
        leg = loft_mesh(
            f"GEO_Hargold_leg_{side}", "Z",
            [
                (dims["ankle"], 0.16, 0.15, sign * dims["leg_x"], 0.02),
                ((dims["ankle"] + dims["knee"]) * 0.54, 0.165, 0.152, sign * dims["leg_x"], 0.02),
                (dims["knee"], 0.175, 0.158, sign * dims["leg_x"], 0.02),
                ((dims["knee"] + dims["hip"]) * 0.54, 0.18, 0.162, sign * dims["leg_x"], 0.02),
                (dims["hip"], 0.185, 0.17, sign * dims["leg_x"], 0.02),
            ],
            mats["trouser"], geo, 28,
        )
        skin_to_bones(leg, armature, [f"DEF_thigh.{side}", f"DEF_shin.{side}"], 2)
        build_boot(
            "Hargold", side, armature, geo, mats,
            dims["leg_x"], dims["foot_height"] * 1.34, 0.22, dims["foot_length"],
        )
    build_hands(
        "Hargold", armature, geo, mats,
        dims["wrist"], dims["wrist_z"], dims["hand_size"] * 0.72,
    )
    build_eyes("Hargold", armature, geo, mats, 1.40, 0.145, 0.18, 0.105, -0.42)
    nose = loft_mesh(
        "GEO_Hargold_nose", "Y",
        [
            (-0.30, 0.13, 0.12, 0, 1.30),
            (-0.48, 0.15, 0.14, 0, 1.29),
            (-0.56, 0.11, 0.10, 0, 1.28),
        ],
        mats["skin_light"], geo, 28,
    )
    parent_bone(nose, armature, "DEF_head")
    for side, sign in (("L", -1), ("R", 1)):
        ear = ellipsoid_mesh(
            f"GEO_Hargold_ear_{side}",
            (sign * 0.415, 0.015, 1.32),
            (0.075, 0.065, 0.105),
            mats["skin_light"],
            geo,
            24,
            10,
        )
        parent_bone(ear, armature, "DEF_head")
        inner_ear = curve_tube(
            f"GEO_Hargold_inner_ear_{side}",
            [
                (sign * 0.475, -0.015, 1.37),
                (sign * 0.49, -0.035, 1.32),
                (sign * 0.47, -0.02, 1.27),
            ],
            0.012,
            mats["blush"],
            geo,
        )
        parent_bone(inner_ear, armature, "DEF_head")
    hair_mass = ellipsoid_mesh(
        "GEO_Hargold_hair_mass",
        (0, 0.065, 1.47),
        (0.39, 0.29, 0.18),
        mats["hair"],
        geo,
        36,
        12,
    )
    parent_bone(hair_mass, armature, "DEF_head")
    for lock_index, (x, y, z, sweep) in enumerate((
        (-0.32, -0.05, 1.52, -0.11),
        (-0.20, -0.17, 1.57, -0.09),
        (-0.06, -0.22, 1.59, -0.07),
        (0.08, -0.21, 1.59, 0.07),
        (0.22, -0.14, 1.56, 0.09),
        (0.34, -0.02, 1.50, 0.11),
    )):
        lock = curve_tube(
            f"GEO_Hargold_hair_lock_{lock_index}",
            [
                (x, y, z),
                (x + sweep * 0.45, y - 0.03, z - 0.045),
                (x + sweep, y, z - 0.09),
            ],
            0.037,
            mats["hair"],
            geo,
            taper=True,
        )
        parent_bone(lock, armature, "DEF_head")
    for side, sign in (("L", -1), ("R", 1)):
        cheek = loft_mesh(
            f"GEO_Hargold_cheek_{side}", "Y",
            [
                (-0.34, 0.095, 0.078, sign * 0.205, 1.20),
                (-0.405, 0.120, 0.095, sign * 0.205, 1.20),
                (-0.43, 0.075, 0.058, sign * 0.205, 1.19),
            ],
            mats["skin_light"], geo, 28,
        )
        parent_bone(cheek, armature, "DEF_head")
        brow = curve_tube(
            f"GEO_Hargold_brow_{side}",
            [
                (sign * 0.24, -0.397, 1.51),
                (sign * 0.14, -0.425, 1.53),
                (sign * 0.05, -0.405, 1.51),
            ],
            0.026, mats["hair"], geo,
        )
        parent_bone(brow, armature, f"DEF_brow.{side}")
    moustache_left = curve_tube(
        "GEO_Hargold_moustache_L",
        [(-0.02, -0.52, 1.20), (-0.12, -0.54, 1.18), (-0.25, -0.48, 1.16)],
        0.045, mats["hair"], geo,
    )
    moustache_right = curve_tube(
        "GEO_Hargold_moustache_R",
        [(0.02, -0.52, 1.20), (0.12, -0.54, 1.18), (0.25, -0.48, 1.16)],
        0.045, mats["hair"], geo,
    )
    beard = loft_mesh(
        "GEO_Hargold_rounded_beard", "Z",
        [
            (0.89, 0.10, 0.08, 0, -0.33),
            (0.93, 0.18, 0.14, 0, -0.35),
            (1.01, 0.25, 0.20, 0, -0.38),
            (1.10, 0.24, 0.19, 0, -0.39),
            (1.17, 0.18, 0.14, 0, -0.38),
            (1.20, 0.09, 0.07, 0, -0.36),
        ],
        mats["hair"], geo, 32,
    )
    for obj in (moustache_left, moustache_right, beard):
        parent_bone(obj, armature, "DEF_jaw")
    for lock_index, x in enumerate((-0.13, -0.065, 0, 0.065, 0.13)):
        beard_lock = curve_tube(
            f"GEO_Hargold_beard_lock_{lock_index}",
            [(x, -0.505, 1.05), (x * 0.92, -0.50, 0.98), (x * 0.78, -0.46, 0.92)],
            0.024,
            mats["hair"],
            geo,
            taper=True,
        )
        parent_bone(beard_lock, armature, "DEF_jaw")
    mouth = loft_mesh(
        "GEO_Hargold_mouth", "Z",
        [(1.13, 0.10, 0.014, 0, -0.505), (1.18, 0.14, 0.018, 0, -0.515)],
        mats["black"], geo, 24,
    )
    parent_bone(mouth, armature, "DEF_jaw")
    drive_scale(mouth, armature, 0, "smile", "1.0 + 0.35 * smile")
    drive_scale(mouth, armature, 2, "mouth_open", "1.0 + 1.7 * mouth_open")
    brim = annulus_mesh("GEO_Hargold_hat_brim", 1.58, 0.23, 0.55, 0.035, mats["olive_dark"], attach)
    crown = loft_mesh(
        "GEO_Hargold_hat_crown", "Z",
        [
            (1.57, 0.30, 0.26, 0, 0),
            (1.64, 0.285, 0.245, 0.005, 0.008),
            (1.71, 0.255, 0.22, 0.018, 0.015),
            (1.77, 0.205, 0.175, 0.045, 0.020),
            (1.81, 0.12, 0.10, 0.075, 0.025),
        ],
        mats["olive"], attach, 36,
    )
    band = annulus_mesh("GEO_Hargold_hat_band", 1.65, 0.245, 0.29, 0.045, mats["brown"], attach)
    for obj in (brim, crown, band):
        parent_bone(obj, armature, "DEF_hat_secondary")
    feather = loft_mesh(
        "GEO_Hargold_feather",
        "X",
        [
            (-0.28, 0.018, 0.022, 0.00, 1.70),
            (-0.38, 0.055, 0.075, -0.005, 1.74),
            (-0.49, 0.070, 0.090, -0.004, 1.77),
            (-0.58, 0.018, 0.022, 0.00, 1.78),
        ],
        mats["orange"],
        attach,
        24,
    )
    parent_bone(feather, armature, "DEF_feather")
    scarf = curve_tube(
        "GEO_Hargold_scarf_collar",
        [
            (0.40, -0.03, dims["shoulder"] - 0.08),
            (0, -0.35, dims["shoulder"] - 0.11),
            (-0.40, -0.03, dims["shoulder"] - 0.08),
            (0, 0.29, dims["shoulder"] - 0.09),
        ],
        0.075, mats["scarf"], attach, cyclic=True,
    )
    parent_bone(scarf, armature, "DEF_chest")
    cape_grid(
        "GEO_Hargold_short_cape", "Hargold", armature, geo, mats["scarf"],
        dims["shoulder"] - 0.09, dims["hip"] - 0.02, 0.55, 0.72,
    )
    belt = curve_tube(
        "GEO_Hargold_belt", [(0.43, 0, 0.62), (0, -0.32, 0.62), (-0.43, 0, 0.62), (0, 0.31, 0.62)],
        0.045, mats["brown_dark"], attach, cyclic=True,
    )
    parent_bone(belt, armature, "DEF_hips")
    buckle = rounded_box("GEO_Hargold_buckle", (0, -0.37, 0.62), (0.11, 0.028, 0.09), mats["brass"], attach, 0.025)
    parent_bone(buckle, armature, "DEF_hips")
    for side, sign in (("L", -1), ("R", 1)):
        pouch = rounded_box(
            f"GEO_Hargold_belt_pouch_{side}",
            (sign * 0.27, -0.345, 0.65),
            (0.105, 0.065, 0.115),
            mats["brown"],
            attach,
            0.035,
        )
        parent_bone(pouch, armature, "DEF_hips")
        pouch_flap = rounded_box(
            f"GEO_Hargold_belt_pouch_flap_{side}",
            (sign * 0.27, -0.415, 0.70),
            (0.095, 0.018, 0.045),
            mats["brown_light"],
            attach,
            0.018,
        )
        parent_bone(pouch_flap, armature, "DEF_hips")
    backpack = rounded_box("GEO_Hargold_backpack", (0, 0.38, 0.83), (0.38, 0.20, 0.37), mats["olive_dark"], attach, 0.085)
    parent_bone(backpack, armature, "DEF_backpack")
    pocket = rounded_box("GEO_Hargold_backpack_pocket", (0, 0.59, 0.76), (0.24, 0.075, 0.16), mats["brown"], attach, 0.045)
    parent_bone(pocket, armature, "DEF_backpack")
    leaf_badge = loft_mesh(
        "GEO_Hargold_backpack_leaf_badge",
        "Y",
        [
            (0.585, 0.020, 0.014, 0.0, 0.93),
            (0.655, 0.095, 0.055, -0.018, 0.94),
            (0.670, 0.025, 0.018, 0.070, 0.99),
        ],
        mats["olive_light"],
        attach,
        24,
    )
    parent_bone(leaf_badge, armature, "DEF_backpack")
    leaf_vein = curve_tube(
        "GEO_Hargold_backpack_leaf_vein",
        [(-0.065, 0.685, 0.91), (0.0, 0.69, 0.95), (0.065, 0.68, 0.99)],
        0.008,
        mats["cream"],
        attach,
    )
    parent_bone(leaf_vein, armature, "DEF_backpack")
    bedroll = loft_mesh(
        "GEO_Hargold_bedroll", "X",
        [(-0.32, 0.13, 0.13, 0.42, 1.18), (0.32, 0.13, 0.13, 0.42, 1.18)],
        mats["cream"], attach, 28,
    )
    parent_bone(bedroll, armature, "DEF_backpack_gear")
    for side, sign in (("L", -1), ("R", 1)):
        strap = curve_tube(
            f"GEO_Hargold_pack_strap_{side}",
            [(sign * 0.22, 0.23, 1.10), (sign * 0.28, -0.18, 0.91), (sign * 0.24, -0.16, 0.66)],
            0.028, mats["brown"], attach,
        )
        parent_bone(strap, armature, "DEF_backpack")
    rope = curve_tube(
        "GEO_Hargold_pack_rope",
        [(-0.26, 0.61, 0.96), (0, 0.66, 1.00), (0.26, 0.61, 0.96), (0, 0.64, 0.91)],
        0.018, mats["stitch"], attach, cyclic=True,
    )
    parent_bone(rope, armature, "DEF_backpack_gear")


def build_mebble(armature, groups, mats, dims):
    geo, attach = groups["GEO"], groups["ATTACHMENTS"]
    torso = loft_mesh(
        "GEO_Mebble_skin_torso", "Z",
        [
            (dims["hip"] - 0.20, 0.25, 0.17, 0, 0),
            (dims["hip"] - 0.04, 0.30, 0.20, 0, 0),
            (dims["hip"] + 0.15, 0.34, 0.22, 0, 0),
            (dims["shoulder"] - 0.14, 0.35, 0.21, 0, 0),
            (dims["shoulder"], dims["chest_half"], 0.19, 0, 0),
        ],
        mats["skin"], geo, 36,
    )
    skin_to_bones(
        torso,
        armature,
        ["DEF_hips", "DEF_spine_lower", "DEF_spine_mid", "DEF_spine_upper", "DEF_chest"],
        4,
    )
    neck = loft_mesh(
        "GEO_Mebble_long_neck", "Z",
        [
            (dims["shoulder"] - 0.05, 0.132, 0.115, 0, 0),
            (dims["shoulder"] + 0.05, 0.116, 0.103, 0, -0.010),
            (dims["shoulder"] + 0.15, 0.100, 0.089, 0, -0.024),
            (dims["shoulder"] + 0.25, 0.091, 0.082, 0, -0.031),
            (dims["shoulder"] + 0.34, 0.104, 0.094, 0, -0.020),
        ],
        mats["skin"], geo, 28,
    )
    skin_to_bones(
        neck,
        armature,
        ["DEF_chest", "DEF_neck_base", "DEF_neck_mid", "DEF_neck_upper", "DEF_head"],
        4,
    )
    head = loft_mesh(
        "GEO_Mebble_head", "Z",
        [
            (1.62, 0.075, 0.070, 0, 0.00),
            (1.66, 0.14, 0.12, 0, -0.015),
            (1.71, 0.19, 0.16, 0, -0.035),
            (1.78, 0.235, 0.205, 0, -0.055),
            (1.86, 0.255, 0.225, 0, -0.045),
            (1.94, 0.225, 0.195, 0, -0.015),
            (2.00, 0.155, 0.135, 0, 0.015),
            (2.025, 0.070, 0.060, 0, 0.025),
        ],
        mats["skin"], geo, 36,
    )
    skin_to_bones(head, armature, ["DEF_neck_upper", "DEF_head", "DEF_jaw"], 3)
    add_shape_drivers(head, armature, 1.82)
    shirt = loft_mesh(
        "GEO_Mebble_shirt", "Z",
        [
            (dims["hip"] - 0.10, 0.26, 0.19, 0, 0),
            (dims["hip"] + 0.15, 0.335, 0.225, 0, 0),
            (dims["shoulder"], dims["chest_half"], 0.20, 0, 0),
        ],
        mats["cream"], geo, 36,
    )
    skin_to_bones(
        shirt,
        armature,
        ["DEF_hips", "DEF_spine_lower", "DEF_spine_mid", "DEF_spine_upper", "DEF_chest"],
        4,
    )
    vest = loft_mesh(
        "GEO_Mebble_vest", "Z",
        [
            (dims["hip"] - 0.04, 0.275, 0.20, 0, 0.005),
            (dims["hip"] + 0.17, 0.35, 0.235, 0, 0.005),
            (dims["shoulder"] - 0.01, dims["chest_half"] - 0.01, 0.21, 0, 0),
        ],
        mats["brown"], geo, 36,
    )
    skin_to_bones(vest, armature, ["DEF_spine_mid", "DEF_spine_upper", "DEF_chest"], 3)
    trousers = loft_mesh(
        "GEO_Mebble_trousers", "Z",
        [
            (dims["knee"] + 0.04, 0.22, 0.16, 0, 0),
            (dims["hip"] - 0.18, 0.25, 0.18, 0, 0),
            (dims["hip"], 0.25, 0.18, 0, 0),
        ],
        mats["trouser"], geo, 32,
    )
    skin_to_bones(trousers, armature, ["DEF_hips", "DEF_thigh.L", "DEF_thigh.R"], 3)
    for side, sign in (("L", -1), ("R", 1)):
        sleeve = loft_mesh(
            f"GEO_Mebble_sleeve_{side}", "X",
            [
                (sign * dims["chest_half"], 0.145, 0.155, -0.010, dims["shoulder"]),
                (sign * (dims["chest_half"] + 0.05), 0.165, 0.178, -0.020, dims["shoulder"] + 0.01),
                (sign * (dims["chest_half"] + 0.10), 0.155, 0.168, -0.016, dims["shoulder"] - 0.02),
                (sign * dims["elbow"], 0.135, 0.148, -0.010, dims["elbow_z"]),
                (sign * (dims["elbow"] + (dims["wrist"] - dims["elbow"]) * 0.40), 0.122, 0.136, -0.005, dims["elbow_z"] + (dims["wrist_z"] - dims["elbow_z"]) * 0.40),
                (sign * (dims["elbow"] + (dims["wrist"] - dims["elbow"]) * 0.72), 0.108, 0.122, 0.000, dims["elbow_z"] + (dims["wrist_z"] - dims["elbow_z"]) * 0.72),
                (sign * dims["wrist"], 0.098, 0.112, 0.000, dims["wrist_z"]),
            ],
            mats["cream"], geo, 24,
        )
        skin_to_bones(
            sleeve,
            armature,
            [f"DEF_clavicle.{side}", f"DEF_upper_arm.{side}", f"DEF_forearm.{side}"],
            3,
        )
        leg = loft_mesh(
            f"GEO_Mebble_leg_{side}", "Z",
            [
                (dims["ankle"], 0.105, 0.10, sign * dims["leg_x"], 0),
                (dims["ankle"] + (dims["knee"] - dims["ankle"]) * 0.36, 0.108, 0.102, sign * dims["leg_x"], 0),
                (dims["knee"], 0.115, 0.105, sign * dims["leg_x"], 0),
                (dims["knee"] + (dims["hip"] - dims["knee"]) * 0.44, 0.12, 0.108, sign * dims["leg_x"], 0),
                (dims["hip"], 0.12, 0.11, sign * dims["leg_x"], 0),
            ],
            mats["trouser"], geo, 24,
        )
        skin_to_bones(leg, armature, [f"DEF_thigh.{side}", f"DEF_shin.{side}"], 2)
        build_boot(
            "Mebble", side, armature, geo, mats,
            dims["leg_x"], dims["foot_height"] * 1.46, 0.18, dims["foot_length"],
        )
    build_hands(
        "Mebble", armature, geo, mats,
        dims["wrist"], dims["wrist_z"], dims["hand_size"] * 0.72,
    )
    build_eyes("Mebble", armature, geo, mats, 1.84, 0.085, 0.18, 0.082, -0.22)
    nose = loft_mesh(
        "GEO_Mebble_nose", "Y",
        [(-0.17, 0.060, 0.055, 0, 1.80), (-0.29, 0.075, 0.068, 0, 1.79), (-0.34, 0.045, 0.040, 0, 1.78)],
        mats["skin_light"], geo, 24,
    )
    parent_bone(nose, armature, "DEF_head")
    for side, sign in (("L", -1), ("R", 1)):
        ear = ellipsoid_mesh(
            f"GEO_Mebble_ear_{side}",
            (sign * 0.245, 0.0, 1.83),
            (0.052, 0.050, 0.085),
            mats["skin_light"],
            geo,
            24,
            10,
        )
        parent_bone(ear, armature, "DEF_head")
        inner_ear = curve_tube(
            f"GEO_Mebble_inner_ear_{side}",
            [
                (sign * 0.282, -0.015, 1.87),
                (sign * 0.292, -0.035, 1.83),
                (sign * 0.278, -0.018, 1.79),
            ],
            0.009,
            mats["blush"],
            geo,
        )
        parent_bone(inner_ear, armature, "DEF_head")
    hair_locks = (
        ((-0.22, -0.05, 1.97), (-0.30, -0.11, 1.93), (-0.34, -0.16, 1.87)),
        ((-0.11, -0.15, 2.01), (-0.17, -0.23, 1.97), (-0.23, -0.27, 1.91)),
        ((0.00, -0.18, 2.03), (-0.02, -0.27, 1.98), (-0.08, -0.29, 1.91)),
        ((0.12, -0.13, 2.01), (0.17, -0.22, 1.97), (0.19, -0.27, 1.89)),
        ((0.22, -0.02, 1.98), (0.29, -0.05, 1.93), (0.33, -0.02, 1.86)),
        ((0.23, 0.08, 1.96), (0.29, 0.12, 1.91), (0.31, 0.18, 1.84)),
        ((-0.23, 0.08, 1.96), (-0.29, 0.12, 1.91), (-0.31, 0.18, 1.84)),
    )
    hair_mass = ellipsoid_mesh(
        "GEO_Mebble_hair_mass",
        (0, 0.12, 1.93),
        (0.245, 0.22, 0.16),
        mats["hair"],
        geo,
        36,
        12,
    )
    parent_bone(hair_mass, armature, "DEF_head")
    for lock_index, points in enumerate(hair_locks):
        lock = curve_tube(
            f"GEO_Mebble_hair_lock_{lock_index}",
            points,
            0.040 if lock_index < 5 else 0.034,
            mats["hair"],
            geo,
            taper=True,
        )
        parent_bone(lock, armature, "DEF_head")
    apple = loft_mesh(
        "GEO_Mebble_adams_apple", "Y",
        [(-0.08, 0.038, 0.040, 0, 1.55), (-0.16, 0.052, 0.054, 0, 1.55), (-0.21, 0.032, 0.034, 0, 1.55)],
        mats["skin_light"], geo, 20,
    )
    parent_bone(apple, armature, "DEF_adams_apple")
    chin_hair = curve_tube(
        "GEO_Mebble_chin_hair",
        [(-0.055, -0.205, 1.68), (0, -0.225, 1.65), (0.055, -0.205, 1.68)],
        0.018,
        mats["hair"],
        geo,
    )
    parent_bone(chin_hair, armature, "DEF_jaw")
    for side, sign in (("L", -1), ("R", 1)):
        brow = curve_tube(
            f"GEO_Mebble_brow_{side}",
            [(sign * 0.15, -0.235, 1.98), (sign * 0.085, -0.252, 2.01), (sign * 0.02, -0.238, 1.99)],
            0.028, mats["hair"], geo,
        )
        parent_bone(brow, armature, f"DEF_brow.{side}")
        glasses = oval_tube(
            f"GEO_Mebble_glasses_{side}",
            (sign * 0.09, -0.292, 1.84),
            0.105,
            0.125,
            0.012,
            mats["glass"],
            attach,
            tilt=sign * 0.07,
        )
        parent_bone(glasses, armature, "DEF_head")
    bridge = curve_tube("GEO_Mebble_glasses_bridge", [(-0.02, -0.292, 1.84), (0.02, -0.292, 1.84)], 0.012, mats["glass"], attach)
    parent_bone(bridge, armature, "DEF_head")
    mouth = loft_mesh(
        "GEO_Mebble_mouth", "Z",
        [(1.70, 0.07, 0.010, 0, -0.275), (1.75, 0.10, 0.014, 0, -0.282)],
        mats["black"], geo, 20,
    )
    parent_bone(mouth, armature, "DEF_jaw")
    drive_scale(mouth, armature, 0, "smile", "1.0 + 0.38 * smile")
    drive_scale(mouth, armature, 2, "mouth_open", "1.0 + 1.8 * mouth_open")
    smile_line = curve_tube(
        "GEO_Mebble_smile_line",
        [(-0.085, -0.298, 1.73), (0, -0.310, 1.70), (0.085, -0.298, 1.73)],
        0.010,
        mats["black"],
        geo,
    )
    parent_bone(smile_line, armature, "DEF_jaw")
    brim = annulus_mesh("GEO_Mebble_hat_brim", 2.00, 0.14, 0.29, 0.026, mats["brown_dark"], attach)
    crown = loft_mesh(
        "GEO_Mebble_hat_crown", "Z",
        [
            (dims["height"] - 0.23, 0.20, 0.17, 0, 0),
            (dims["height"] - 0.09, 0.18, 0.15, 0, 0.01),
            (dims["height"], 0.16, 0.14, 0, 0.015),
        ],
        mats["brown"], attach, 32,
    )
    hat_band = annulus_mesh("GEO_Mebble_hat_band", 2.05, 0.17, 0.205, 0.035, mats["olive_light"], attach)
    for obj in (brim, crown, hat_band):
        parent_bone(obj, armature, "DEF_hat_secondary")
    hood = curve_tube(
        "GEO_Mebble_hood",
        [
            (0.24, 0, dims["shoulder"] - 0.01),
            (0, -0.19, dims["shoulder"] - 0.03),
            (-0.24, 0, dims["shoulder"] - 0.01),
            (0, 0.20, dims["shoulder"] + 0.01),
        ],
        0.065, mats["olive_dark"], attach, cyclic=True,
    )
    parent_bone(hood, armature, "DEF_chest")
    cape = cape_grid(
        "GEO_Mebble_cape", "Mebble", armature, geo, mats["olive_dark"],
        dims["shoulder"], dims["hip"] - 0.34, 0.68, 0.82,
    )
    cape.shape_key_add(name="Basis")
    glide = cape.shape_key_add(name="GlideOpen")
    for index, vertex in enumerate(cape.data.vertices):
        cloth_t = min(
            1.0,
            max(0.0, (dims["shoulder"] - vertex.co.z) / (dims["shoulder"] - (dims["hip"] - 0.34))),
        )
        glide.data[index].co.x *= 1.56
        # Open behind and above Mebble so the glide reads from the profile
        # camera as a curved sail, not only as hidden width in depth.
        glide.data[index].co.y += 0.28 + cloth_t * 0.90
        glide.data[index].co.z += cloth_t * 0.50
    driver = cape.data.shape_keys.key_blocks["GlideOpen"].driver_add("value").driver
    variable = driver.variables.new()
    variable.name = "cape_open"
    variable.type = "SINGLE_PROP"
    variable.targets[0].id = armature
    variable.targets[0].data_path = 'pose.bones["CTRL_cape.01"]["cape_open"]'
    driver.expression = "cape_open"
    emblem = curve_tube(
        "GEO_Mebble_cape_emblem",
        [
            (0.0, 0.32, 1.25),
            (0.15, 0.32, 1.12),
            (0.0, 0.34, 0.97),
            (-0.15, 0.32, 1.12),
        ],
        0.018,
        mats["cream"],
        attach,
        cyclic=True,
        handle_type="VECTOR",
    )
    parent_bone(emblem, armature, "DEF_cape.02")
    emblem_mark = curve_tube(
        "GEO_Mebble_cape_emblem_mark",
        [(0.0, 0.35, 1.22), (0.0, 0.355, 1.04)],
        0.013,
        mats["olive_light"],
        attach,
        handle_type="VECTOR",
    )
    parent_bone(emblem_mark, armature, "DEF_cape.02")
    emblem_center = curve_tube(
        "GEO_Mebble_cape_emblem_center",
        [
            (0.0, 0.36, 1.19),
            (0.055, 0.36, 1.13),
            (0.0, 0.36, 1.07),
            (-0.055, 0.36, 1.13),
        ],
        0.010,
        mats["olive_light"],
        attach,
        cyclic=True,
        handle_type="VECTOR",
    )
    parent_bone(emblem_center, armature, "DEF_cape.02")
    for belt_index, z in enumerate((0.97, 1.08)):
        belt = curve_tube(
            f"GEO_Mebble_belt_{belt_index}",
            [(0.25, 0, z), (0, -0.19, z), (-0.25, 0, z), (0, 0.18, z)],
            0.034, mats["brown_dark"], attach, cyclic=True,
        )
        parent_bone(belt, armature, "DEF_hips" if belt_index == 0 else "DEF_spine_mid")
        buckle = rounded_box(
            f"GEO_Mebble_buckle_{belt_index}", (0, -0.23, z), (0.075, 0.022, 0.06),
            mats["brass"], attach, 0.018,
        )
        parent_bone(buckle, armature, "DEF_hips" if belt_index == 0 else "DEF_spine_mid")
    for button_index, z in enumerate((1.16, 1.27, 1.37)):
        button = ellipsoid_mesh(
            f"GEO_Mebble_vest_button_{button_index}",
            (0, -0.232, z),
            (0.018, 0.010, 0.018),
            mats["brass"],
            attach,
            16,
            8,
        )
        parent_bone(button, armature, "DEF_spine_mid" if z < 1.30 else "DEF_chest")
    for side, sign in (("L", -1), ("R", 1)):
        pouch = rounded_box(
            f"GEO_Mebble_hip_pouch_{side}",
            (sign * 0.235, -0.175, 0.99),
            (0.075, 0.055, 0.105),
            mats["brown"],
            attach,
            0.025,
        )
        parent_bone(pouch, armature, "DEF_hips")
        vest_strap = curve_tube(
            f"GEO_Mebble_vest_strap_{side}",
            [
                (sign * 0.16, -0.19, 1.40),
                (sign * 0.18, -0.235, 1.25),
                (sign * 0.19, -0.215, 1.08),
            ],
            0.018,
            mats["brown_dark"],
            attach,
        )
        parent_bone(vest_strap, armature, "DEF_chest")


def setup_scene(hero, target_height, groups, mats):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 560
    scene.render.resolution_y = 560
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.world.color = (0.35, 0.37, 0.40)
    bpy.ops.mesh.primitive_plane_add(size=8, location=(0, 0, -0.025))
    ground = bpy.context.object
    ground.name = "QA_Ground"
    ground.data.materials.append(mats["olive_dark"])
    camera_data = bpy.data.cameras.new("QA_Camera")
    camera = bpy.data.objects.new("QA_Camera", camera_data)
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
        light.rotation_euler = (Vector((0, 0, target_height * 0.5)) - light.location).to_track_quat("-Z", "Y").to_euler()
        scene.collection.objects.link(light)


def add_fit_skeleton_overlay(armature, groups, mats):
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
    front_x = -height * 0.43
    side_offset = height * 0.012
    center_material = riglib.material(
        "MAT_FIT_SKELETON_CENTER", (0.18, 0.92, 0.34, 1), 0.28
    )
    left_material = riglib.material(
        "MAT_FIT_SKELETON_LEFT", (0.10, 0.72, 1.0, 1), 0.28
    )
    right_material = riglib.material(
        "MAT_FIT_SKELETON_RIGHT", (1.0, 0.72, 0.08, 1), 0.28
    )
    cape_material = riglib.material(
        "MAT_FIT_SKELETON_CAPE", (0.95, 0.26, 0.72, 1), 0.28
    )
    result = []
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
        obj = curve_tube(
            f"GUIDE_{armature.name}_{name}",
            [start, end],
            height * 0.007,
            material,
            groups["REF"],
        )
        obj["production_part"] = False
        obj["export_enabled"] = False
        obj["review_only"] = True
        obj["skeleton_overlay"] = True
        obj.hide_render = True
        riglib.parent_bone(obj, armature, name)
        result.append(obj)
        marker_points.extend(((start, material, name), (end, material, name)))

    seen = set()
    for index, (point, material, source_name) in enumerate(marker_points):
        key = tuple(round(value, 4) for value in point)
        if key in seen:
            continue
        seen.add(key)
        marker = ellipsoid_mesh(
            f"JOINT_{armature.name}_{index:02d}_{source_name}",
            point,
            (height * 0.014, height * 0.014, height * 0.014),
            material,
            groups["REF"],
            segments=16,
            rings=8,
        )
        marker["production_part"] = False
        marker["export_enabled"] = False
        marker["review_only"] = True
        marker["skeleton_overlay"] = True
        marker["joint_marker"] = True
        marker.hide_render = True
        riglib.parent_bone(marker, armature, source_name)
        result.append(marker)
    return result


def add_locked_mannequin_rig_reference(armature, groups):
    """Keep an immutable duplicate of the exact construction skeleton."""
    reference = armature.copy()
    reference.data = armature.data.copy()
    reference.name = f"{armature.name}_LOCKED_MANNEQUIN_REFERENCE"
    reference.data.name = f"{armature.data.name}_LOCKED_MANNEQUIN_REFERENCE"
    groups["REF"].objects.link(reference)
    reference.animation_data_clear()
    reference.hide_render = True
    reference.hide_viewport = True
    reference.display_type = "WIRE"
    reference["production_part"] = False
    reference["export_enabled"] = False
    reference["review_only"] = True
    reference["locked_pose_source"] = SPEC_ID
    reference["source_rig"] = armature.name
    reference["joint_alignment_tolerance_fraction"] = 0.03
    return reference


def set_review_silhouette(objects, black_material, enabled):
    for obj in objects:
        if obj.type not in {"MESH", "CURVE"} or not obj.data.materials:
            continue
        if enabled:
            obj["_review_materials"] = json.dumps(
                [slot.name if slot else "" for slot in obj.data.materials]
            )
            for index in range(len(obj.data.materials)):
                obj.data.materials[index] = black_material
        else:
            material_names = json.loads(obj.get("_review_materials", "[]"))
            for index, material_name in enumerate(material_names):
                if material_name and material_name in bpy.data.materials:
                    obj.data.materials[index] = bpy.data.materials[material_name]


def render_mannequin_fit_panels(
    hero, armature, target_height, groups, mats, skeleton_objects
):
    """Render the fitted hero under the exact mannequin review camera."""
    FIT_PREVIEW.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    camera = scene.camera
    original_resolution = (
        scene.render.resolution_x,
        scene.render.resolution_y,
        scene.render.resolution_percentage,
    )
    scene.render.resolution_x = 420
    scene.render.resolution_y = 420
    scene.render.resolution_percentage = 100
    camera_contract = review_camera()
    camera.data.ortho_scale = camera_contract["orthoScale"]
    camera.location = (
        -camera_contract["distance"], 0, camera_contract["centerHeight"]
    )
    camera.rotation_euler = (
        Vector((0, 0, camera_contract["centerHeight"])) - camera.location
    ).to_track_quat("-Z", "Y").to_euler()
    for row in REVIEW_FRAMES:
        frame_spec = review_frame(hero, row["key"])
        if frame_spec is None or frame_spec.get("special"):
            continue
        action_name = frame_spec["action"]
        frame = frame_spec["frame"]
        armature.animation_data.action = bpy.data.actions[action_name]
        cape_control = armature.pose.bones.get("CTRL_cape.01")
        if cape_control and "cape_open" in cape_control:
            cape_control["cape_open"] = 1.0 if action_name.startswith("glide") else 0.0
        scene.frame_set(frame)
        riglib.align_review_pose_to_floor(
            armature, target_height * frame_spec.get("rootHeight", 0.0)
        )
        scene.render.filepath = str(
            FIT_PREVIEW / f"{hero.lower()}-fitted-{row['key']}.png"
        )
        bpy.ops.render.render(write_still=True)

    armature.animation_data.action = bpy.data.actions["idle"]
    cape_control = armature.pose.bones.get("CTRL_cape.01")
    if cape_control and "cape_open" in cape_control:
        cape_control["cape_open"] = 0.0
    scene.frame_set(1)
    riglib.align_review_pose_to_floor(armature)
    review_objects = [
        obj
        for collection_name in ("GEO", "ATTACHMENTS")
        for obj in bpy.data.collections[collection_name].all_objects
    ]
    original_world_color = tuple(scene.world.color)
    scene.world.color = (1.0, 1.0, 1.0)
    set_review_silhouette(
        review_objects, riglib.review_silhouette_material(), True
    )
    scene.render.filepath = str(
        FIT_PREVIEW / f"{hero.lower()}-fitted-solid-silhouette.png"
    )
    bpy.ops.render.render(write_still=True)
    set_review_silhouette(review_objects, mats["black"], False)
    scene.world.color = original_world_color
    for obj in skeleton_objects:
        obj.hide_render = False
    scene.render.filepath = str(
        FIT_PREVIEW / f"{hero.lower()}-fitted-skeleton-overlay.png"
    )
    bpy.ops.render.render(write_still=True)
    for obj in skeleton_objects:
        obj.hide_render = True
    (
        scene.render.resolution_x,
        scene.render.resolution_y,
        scene.render.resolution_percentage,
    ) = original_resolution


def export_glb(hero, armature, output):
    bpy.ops.object.select_all(action="DESELECT")
    selected = [armature]
    for collection_name in ("GEO", "ATTACHMENTS"):
        selected.extend(bpy.data.collections[collection_name].all_objects)
    for obj in selected:
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
        export_morph=True,
    )


def render_views(hero, armature, target_height):
    scene = bpy.context.scene
    camera = scene.camera
    target = Vector((0, 0, target_height * 0.48))
    actions = [
        ("identity-front", "idle", 1, 90, 1),
        ("identity-three-quarter", "idle", 1, 45, 1),
        ("identity-back", "idle", 1, -90, 1),
        ("idle-right", "idle", 1, 18, 1),
        ("run-right", "run", 1, 14, 1),
        ("run-left", "run", 8, 14, -1),
        ("ground-slam", "ground-slam", 7, 14, 1),
        (
            "hero-action",
            "double-jump" if hero == "Hargold" else "glide-sustain",
            1,
            16 if hero == "Hargold" else 22,
            1,
        ),
    ]
    distance = target_height * 3.6
    for label, action_name, frame, reveal_degrees_value, facing in actions:
        armature.animation_data.action = bpy.data.actions[action_name]
        cape_control = armature.pose.bones.get("CTRL_cape.01")
        if cape_control and "cape_open" in cape_control:
            cape_control["cape_open"] = 1.0 if action_name.startswith("glide") else 0.0
        action_offset = (
            target_height * 0.20
            if action_name in {"double-jump", "glide-sustain", "ground-slam"}
            else 0.0
        )
        armature.location.z = action_offset
        scene.frame_set(frame)
        reveal = math.radians(reveal_degrees_value)
        angle = -reveal if facing > 0 else math.pi + reveal
        camera.location = (
            math.cos(angle) * distance,
            math.sin(angle) * distance,
            target_height * 0.56 + action_offset,
        )
        action_target = target + Vector((0, 0, action_offset))
        camera.rotation_euler = (
            action_target - camera.location
        ).to_track_quat("-Z", "Y").to_euler()
        scene.render.filepath = str(STAGING_PREVIEW / f"{hero.lower()}-{label}.png")
        bpy.ops.render.render(write_still=True)
    armature.location.z = 0.0


def render_gameplay_scale_views(hero, armature, target_height):
    """Render action silhouettes at the 150 px approval ceiling.

    These images intentionally remove the comfort of a large neutral render.
    If the hands, feet, action direction, or character-specific identifiers
    disappear here, the asset is not ready for gameplay-camera promotion.
    """
    scene = bpy.context.scene
    camera = scene.camera
    original_resolution = (
        scene.render.resolution_x,
        scene.render.resolution_y,
        scene.render.resolution_percentage,
    )
    scene.render.resolution_x = 150
    scene.render.resolution_y = 150
    scene.render.resolution_percentage = 100
    target = Vector((0, 0, target_height * 0.48))
    distance = target_height * 3.6
    action_frames = [
        ("idle", "idle", 24),
        ("walk", "walk", 1),
        ("run", "run", 1),
        ("sprint", "sprint", 1),
        ("jump", "rise", 1),
        ("slam", "ground-slam", 1),
        ("slide", "duck-slide", 1),
        ("skid", "skid", 1),
        ("crouch", "crouch", 1),
        ("wall-push", "wall-reaction", 1),
        ("carry", "carry-light-walk", 1),
        ("hurt", "hurt", 1),
        ("victory", "victory", 1),
        (
            "hero-action",
            "double-jump" if hero == "Hargold" else "glide-sustain",
            1,
        ),
        (
            "identity-action",
            "break-hargold-block" if hero == "Hargold" else "glide-open",
            1,
        ),
    ]
    for label, action_name, frame in action_frames:
        armature.animation_data.action = bpy.data.actions[action_name]
        cape_control = armature.pose.bones.get("CTRL_cape.01")
        if cape_control and "cape_open" in cape_control:
            cape_control["cape_open"] = 1.0 if action_name.startswith("glide") else 0.0
        action_offset = (
            target_height * 0.20
            if action_name in {
                "rise", "ground-slam", "double-jump", "glide-open",
                "glide-sustain",
            }
            else 0.0
        )
        armature.location.z = action_offset
        scene.frame_set(frame)
        reveal = math.radians(reveal_degrees(load_profile(), action_name))
        camera.location = (
            math.cos(-reveal) * distance,
            math.sin(-reveal) * distance,
            target_height * 0.56 + action_offset,
        )
        action_target = target + Vector((0, 0, action_offset))
        camera.rotation_euler = (
            action_target - camera.location
        ).to_track_quat("-Z", "Y").to_euler()
        scene.render.filepath = str(
            STAGING_PREVIEW / f"{hero.lower()}-scale150-{label}.png"
        )
        bpy.ops.render.render(write_still=True)
    armature.location.z = 0.0
    (
        scene.render.resolution_x,
        scene.render.resolution_y,
        scene.render.resolution_percentage,
    ) = original_resolution


def build(hero):
    spec_errors = validate_specs()
    if spec_errors:
        raise RuntimeError("Invalid animation mannequin specification: " + "; ".join(spec_errors))
    riglib.reset_scene()
    bpy.context.preferences.filepaths.save_version = 0
    groups = riglib.collections()
    mats = materials()
    profile = load_profile()
    target = profile["gameplayScale"]["characters"][hero]
    dims = scaled_frame(hero)
    riglib.add_locked_reference(hero, groups["REF"], dims["height"])
    armature = riglib.create_armature(hero, dims, groups["RIG"])
    if hero == "Hargold":
        build_hargold(armature, groups, mats, dims)
    else:
        build_mebble(armature, groups, mats, dims)
    locked_reference_rig = add_locked_mannequin_rig_reference(armature, groups)
    skeleton_objects = add_fit_skeleton_overlay(armature, groups, mats)
    riglib.add_production_actions(armature, hero)
    for action in bpy.data.actions:
        action["source_geometry"] = GENERATION
        action["presentation_profile"] = str(PROFILE_PATH.relative_to(ROOT)).replace("\\", "/")
        action["gameplay_reveal_degrees"] = reveal_degrees(profile, action.name)
        action["clean_room_animation"] = True
        action["negative_scale_mirroring"] = False
    setup_scene(hero, dims["height"], groups, mats)
    scene = bpy.context.scene
    scene["assetVersion"] = "4.1.0-locked-mannequin-fit-staging"
    scene["canonVersion"] = "2026-07-26-locked-mannequin-frame-2"
    scene["referenceHash"] = (
        "4004C659783AC41ED09E6AF18D25F776DFB19BE44B9E7066289627E016A7B4E4"
        if hero == "Hargold"
        else "1A85C41AFC53061612B772F221A3F354E4E58C015F4753AFF2C3C44EC80662D0"
    )
    scene["author"] = "Hargold & Mebble production pipeline"
    scene["blenderVersion"] = bpy.app.version_string
    scene["geometryGeneration"] = GENERATION
    scene["sourceScene"] = "factory-empty"
    scene["reusesPriorGeometry"] = False
    scene["targetGameplayHeightMetres"] = dims["height"]
    scene["runtimeNormalizationScale"] = 1.0
    scene["presentationProfile"] = str(PROFILE_PATH.relative_to(ROOT)).replace("\\", "/")
    scene["negativeScaleMirroring"] = False
    scene["physicalDirectionChange"] = True
    scene["silhouetteValidationPixels"] = "100-150"
    scene["constructionPriority"] = "mannequin-rig-action-first"
    scene["fitAuthority"] = SPEC_ID
    scene["mannequinSpecHash"] = spec_hash()
    scene["lockedMannequinRig"] = locked_reference_rig.name
    scene["maximumJointAlignmentErrorFraction"] = 0.03
    scene["sharedWorldScaleCamera"] = True
    scene["reviewStatus"] = (
        "locked-mannequin-fitted-staging-visual-approval-required"
    )
    scene["lockedReference"] = str(ROOT / "assets" / "references" / f"{hero} locked production character sheet.png")
    scene["benchmarkBoundary"] = "clean-room-craft-principles-only"
    STAGING_BLEND.mkdir(parents=True, exist_ok=True)
    STAGING_EXPORT.mkdir(parents=True, exist_ok=True)
    STAGING_PREVIEW.mkdir(parents=True, exist_ok=True)
    blend_path = STAGING_BLEND / f"{hero.lower()}_character.blend"
    glb_path = STAGING_EXPORT / f"{hero.lower()}_character.glb"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path), check_existing=False)
    if "--skip-export" not in sys.argv:
        export_glb(hero, armature, glb_path)
    riglib.restore_bone_parent_bindings(armature)
    armature.animation_data.action = bpy.data.actions["idle"]
    scene.frame_set(1)
    if "--fit-only" not in sys.argv:
        render_views(hero, armature, dims["height"])
        render_gameplay_scale_views(hero, armature, dims["height"])
    riglib.restore_bone_parent_bindings(armature)
    render_mannequin_fit_panels(
        hero, armature, dims["height"], groups, mats, skeleton_objects
    )
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path), check_existing=False)
    print("HM_PRODUCTION_CHARACTER_STAGED " + json.dumps({
        "hero": hero,
        "blend": str(blend_path),
        "glb": str(glb_path),
        "heightMetres": dims["height"],
        "bones": len(armature.data.bones),
        "actions": len(bpy.data.actions),
    }, sort_keys=True))


if __name__ == "__main__":
    characters = [
        argument.split("=", 1)[1]
        for argument in sys.argv
        if argument.startswith("--hero=")
    ] or ["Hargold", "Mebble"]
    for character in characters:
        build(character)
