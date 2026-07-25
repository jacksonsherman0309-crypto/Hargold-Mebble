"""Build real Blender character assets from the locked Hargold/Mebble sheets.

This produces editable .blend sources, armatures, named materials, core actions,
GLB exports, and rendered QA previews. Geometry is deliberately modular so a
character artist can sculpt/retopologize individual parts without discarding the
rig, naming, sockets, or export contract.
"""

from __future__ import annotations

import math
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
BLEND_DIR = ROOT / "assets" / "blender"
EXPORT_DIR = ROOT / "assets" / "exports"
PREVIEW_DIR = ROOT / "assets" / "previews"
REFERENCE_DIR = ROOT / "assets" / "references"


PALETTE = {
    "skin": (0.72, 0.31, 0.095, 1),
    "skin_light": (0.90, 0.46, 0.18, 1),
    "hair": (0.18, 0.055, 0.012, 1),
    "olive": (0.12, 0.20, 0.035, 1),
    "olive_light": (0.24, 0.32, 0.07, 1),
    "olive_dark": (0.08, 0.14, 0.035, 1),
    "cream": (0.72, 0.54, 0.30, 1),
    "brown": (0.20, 0.075, 0.018, 1),
    "brown_light": (0.31, 0.105, 0.018, 1),
    "scarf": (0.30, 0.075, 0.035, 1),
    "trouser": (0.08, 0.065, 0.045, 1),
    "brass": (0.72, 0.38, 0.055, 1),
    "white": (0.95, 0.95, 0.88, 1),
    "black": (0.008, 0.008, 0.006, 1),
    "orange": (0.9, 0.24, 0.025, 1),
    "glass": (0.035, 0.045, 0.04, 1),
    "iris": (0.28, 0.11, 0.025, 1),
    "blush": (0.82, 0.12, 0.055, 1),
}


def reset_scene() -> None:
    if bpy.context.object and bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (
        bpy.data.meshes, bpy.data.curves, bpy.data.armatures,
        bpy.data.materials, bpy.data.cameras, bpy.data.lights, bpy.data.actions
    ):
        for block in list(datablocks):
            datablocks.remove(block)
    for collection in list(bpy.data.collections):
        bpy.data.collections.remove(collection)


def collections():
    result = {}
    for name in ("REF", "GEO", "RIG", "ATTACHMENTS", "COLLISION_PROXY", "EXPORT"):
        collection = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(collection)
        result[name] = collection
    return result


def add_locked_reference(hero, reference_collection, height):
    path = REFERENCE_DIR / f"{hero} locked production character sheet.png"
    image = bpy.data.images.load(str(path), check_existing=True)
    image.name = f"REF_{hero}_locked_sheet_image"
    reference = bpy.data.objects.new(f"REF_{hero}_locked_sheet", None)
    reference.empty_display_type = "IMAGE"
    reference.data = image
    reference.empty_display_size = height * 0.72
    reference.color[3] = 0.48
    reference.location = (height * 1.15, 0.75, height * 0.52)
    reference.rotation_euler = (math.pi / 2, 0, 0)
    reference.show_in_front = True
    reference.hide_render = True
    reference["locked_reference"] = True
    reference["source_path"] = str(path)
    reference["export_enabled"] = False
    reference_collection.objects.link(reference)
    return reference


def move_to(obj, collection) -> None:
    for current in tuple(obj.users_collection):
        current.objects.unlink(obj)
    collection.objects.link(obj)


def material(name: str, color, roughness=0.55, metallic=0.0):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.diffuse_color = color
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if any(token in name for token in ("olive", "cream", "brown", "trouser", "scarf")):
        noise = mat.node_tree.nodes.new("ShaderNodeTexNoise")
        noise.inputs["Scale"].default_value = 7.0 if "brown" in name else 11.0
        noise.inputs["Detail"].default_value = 2.0
        noise.inputs["Roughness"].default_value = 0.58
        bump = mat.node_tree.nodes.new("ShaderNodeBump")
        bump.inputs["Strength"].default_value = 0.09 if "brown" in name else 0.045
        bump.inputs["Distance"].default_value = 0.055
        mat.node_tree.links.new(noise.outputs["Fac"], bump.inputs["Height"])
        mat.node_tree.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


def finish(obj, name, mat, collection, bevel=0.03):
    obj.name = name
    if getattr(obj.data, "materials", None) is not None:
        obj.data.materials.append(mat)
    move_to(obj, collection)
    if obj.type == "MESH":
        for polygon in obj.data.polygons:
            polygon.use_smooth = True
        if bevel:
            modifier = obj.modifiers.new("SurfaceSoftening", "BEVEL")
            modifier.width = bevel
            modifier.segments = 2
    obj["production_part"] = True
    obj["export_enabled"] = True
    return obj


def sphere(name, location, scale, mat, collection):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=20, location=location)
    obj = bpy.context.object
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, name, mat, collection, 0.018)


def cube(name, location, scale, mat, collection, rotation=(0, 0, 0), bevel=0.04):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, name, mat, collection, bevel)


def cylinder(name, location, radius, depth, mat, collection, rotation=(0, 0, 0), vertices=24):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices, radius=radius, depth=depth, location=location, rotation=rotation
    )
    return finish(bpy.context.object, name, mat, collection, 0.025)


def cylinder_between(name, start, end, radius, mat, collection, vertices=20):
    start_v, end_v = Vector(start), Vector(end)
    midpoint = (start_v + end_v) * 0.5
    direction = end_v - start_v
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices, radius=radius, depth=direction.length, location=midpoint
    )
    obj = bpy.context.object
    obj.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()
    return finish(obj, name, mat, collection, min(radius * 0.35, 0.018))


def torus(name, location, major, minor, mat, collection, rotation=(math.pi / 2, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major, minor_radius=minor, major_segments=32, minor_segments=10,
        location=location, rotation=rotation
    )
    return finish(bpy.context.object, name, mat, collection, 0.008)


def cone(name, location, radius1, radius2, depth, mat, collection, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cone_add(
        vertices=24, radius1=radius1, radius2=radius2, depth=depth,
        location=location, rotation=rotation
    )
    return finish(bpy.context.object, name, mat, collection, 0.018)


def tube_curve(name, points, radius, mat, collection):
    curve_data = bpy.data.curves.new(f"CURVE_{name}", "CURVE")
    curve_data.dimensions = "3D"
    curve_data.resolution_u = 2
    curve_data.bevel_depth = radius
    curve_data.bevel_resolution = 3
    spline = curve_data.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for point, coordinate in zip(spline.bezier_points, points):
        point.co = coordinate
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve_data)
    collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj


def trapezoid_prism(name, location, top_width, bottom_width, height, depth, mat, collection):
    tw, bw, hh, dd = top_width / 2, bottom_width / 2, height / 2, depth / 2
    vertices = [
        (-tw, -dd, hh), (tw, -dd, hh), (-bw, -dd, -hh), (bw, -dd, -hh),
        (-tw, dd, hh), (tw, dd, hh), (-bw, dd, -hh), (bw, dd, -hh),
    ]
    faces = [
        (0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1),
        (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3),
    ]
    mesh = bpy.data.meshes.new(f"MESH_{name}")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = location
    collection.objects.link(obj)
    return finish(obj, name, mat, collection, 0.035)


def curved_cape(name, location, top_width, bottom_width, height, thickness, mat, collection):
    columns, rows = 7, 9
    vertices = []
    for layer in (-1, 1):
        for row in range(rows):
            vertical = row / (rows - 1)
            z = height * (0.5 - vertical)
            width = top_width + (bottom_width - top_width) * vertical
            billow = math.sin(vertical * math.pi) * 0.085 + vertical * 0.025
            for column in range(columns):
                horizontal = column / (columns - 1)
                x = width * (horizontal - 0.5)
                wrap = -0.06 * (abs(horizontal - 0.5) * 2.0) ** 1.7
                y = billow + wrap + layer * thickness * 0.5
                vertices.append((x, y, z))
    layer_size = rows * columns
    faces = []
    for layer_index in range(2):
        offset = layer_index * layer_size
        for row in range(rows - 1):
            for column in range(columns - 1):
                a = offset + row * columns + column
                b = a + 1
                c = a + columns + 1
                d = a + columns
                faces.append((a, b, c, d) if layer_index else (a, d, c, b))
    for row in range(rows - 1):
        for column in (0, columns - 1):
            a = row * columns + column
            b = (row + 1) * columns + column
            faces.append((a, a + layer_size, b + layer_size, b))
    for column in range(columns - 1):
        for row in (0, rows - 1):
            a = row * columns + column
            b = a + 1
            faces.append((a, b, b + layer_size, a + layer_size))
    mesh = bpy.data.meshes.new(f"MESH_{name}")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = location
    collection.objects.link(obj)
    return finish(obj, name, mat, collection, 0.025)


def parent_bone(obj, armature, bone):
    # Objects created directly through bpy.data (rather than an operator) do not
    # have a reliable evaluated matrix until the view layer updates.
    bpy.context.view_layer.update()
    world = obj.matrix_world.copy()
    obj.parent = armature
    obj.parent_type = "BONE"
    obj.parent_bone = bone
    parent_matrix = armature.matrix_world @ armature.data.bones[bone].matrix_local
    obj.matrix_parent_inverse = parent_matrix.inverted()
    obj.matrix_world = world


def parent_object(obj, parent):
    world = obj.matrix_world.copy()
    obj.parent = parent
    obj.matrix_parent_inverse = parent.matrix_world.inverted()
    obj.matrix_world = world


def skin_cape(obj, armature):
    bpy.context.view_layer.update()
    world = obj.matrix_world.copy()
    obj.parent = armature
    obj.matrix_parent_inverse = armature.matrix_world.inverted()
    obj.matrix_world = world
    modifier = obj.modifiers.new("CapeArmature", "ARMATURE")
    modifier.object = armature
    z_values = [vertex.co.z for vertex in obj.data.vertices]
    z_min, z_max = min(z_values), max(z_values)
    groups = {
        "DEF_cape.01": obj.vertex_groups.new(name="DEF_cape.01"),
        "DEF_cape.02": obj.vertex_groups.new(name="DEF_cape.02"),
        "DEF_cape.03": obj.vertex_groups.new(name="DEF_cape.03"),
    }
    for vertex in obj.data.vertices:
        t = (vertex.co.z - z_min) / max(z_max - z_min, 0.0001)
        top = max(0.0, min(1.0, (t - 0.45) / 0.55))
        bottom = max(0.0, min(1.0, (0.55 - t) / 0.55))
        middle = max(0.0, 1.0 - abs(t - 0.5) * 2.0)
        total = top + middle + bottom
        for group_name, weight in (
            ("DEF_cape.01", top / total),
            ("DEF_cape.02", middle / total),
            ("DEF_cape.03", bottom / total),
        ):
            if weight > 0:
                groups[group_name].add([vertex.index], weight, "REPLACE")
    basis = obj.shape_key_add(name="Basis")
    glide_open = obj.shape_key_add(name="GlideOpen")
    for index, vertex in enumerate(basis.data):
        t = (z_max - vertex.co.z) / max(z_max - z_min, 0.0001)
        glide_open.data[index].co.x = vertex.co.x * (1.0 + 1.75 * t)
        glide_open.data[index].co.y = vertex.co.y + 0.10 * t
        glide_open.data[index].co.z = vertex.co.z + (z_max - z_min) * 0.56 * t
    driver = glide_open.driver_add("value").driver
    driver.type = "SCRIPTED"
    variable = driver.variables.new()
    variable.name = "cape_open"
    variable.type = "SINGLE_PROP"
    variable.targets[0].id = armature
    variable.targets[0].data_path = 'pose.bones["CTRL_cape.01"]["cape_open"]'
    driver.expression = "cape_open"


def drive_transform(obj, data_path, index, armature, control_bone, prop_name, expression):
    driver = obj.driver_add(data_path, index).driver
    driver.type = "SCRIPTED"
    variable = driver.variables.new()
    variable.name = prop_name
    variable.type = "SINGLE_PROP"
    variable.targets[0].id = armature
    variable.targets[0].data_path = f'pose.bones["{control_bone}"]["{prop_name}"]'
    driver.expression = expression


def create_armature(hero, dims, rig_collection):
    arm_data = bpy.data.armatures.new(f"ARM_{hero.upper()}")
    arm = bpy.data.objects.new(f"RIG_{hero.upper()}", arm_data)
    rig_collection.objects.link(arm)
    arm.show_in_front = True
    arm["rig_status"] = "production-intent-core-rig"
    bpy.context.view_layer.objects.active = arm
    arm.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")

    bones = {}

    def add(name, head, tail, parent=None, deform=True):
        bone = arm_data.edit_bones.new(name)
        bone.head, bone.tail = head, tail
        bone.use_deform = deform
        if parent:
            bone.parent = bones[parent]
        bones[name] = bone

    h = dims["height"]
    head_center = dims["head_center"]
    head_top = dims["head_top"]
    hip = dims["hip"]
    shoulder = dims["shoulder"]
    add("Root", (0, 0, 0), (0, 0, 0.22))
    add("DEF_hips", (0, 0, hip - 0.18), (0, 0, hip + 0.18), "Root")
    add("DEF_spine", (0, 0, hip), (0, 0, shoulder - 0.18), "DEF_hips")
    add("DEF_chest", (0, 0, shoulder - 0.18), (0, 0, shoulder + 0.18), "DEF_spine")
    add("DEF_neck", (0, 0, shoulder + 0.12), (0, 0, head_center - 0.27), "DEF_chest")
    add("DEF_head", (0, 0, head_center - 0.29), (0, 0, head_center + 0.34), "DEF_neck")
    add("DEF_jaw", (0, -0.06, head_center - 0.14), (0, -0.30, head_center - 0.20), "DEF_head")
    eye_x = 0.23 if hero == "Hargold" else 0.16
    eye_z = head_center + (0.05 if hero == "Hargold" else 0.04)
    add("DEF_eye.L", (-eye_x, -0.10, eye_z), (-eye_x, -0.30, eye_z), "DEF_head")
    add("DEF_eye.R", (eye_x, -0.10, eye_z), (eye_x, -0.30, eye_z), "DEF_head")
    add("DEF_cape", (0, 0.12, shoulder), (0, 0.25, hip), "DEF_chest")
    add("DEF_cape.01", (0, 0.22, shoulder + 0.12), (0, 0.32, shoulder - 0.38), "DEF_chest")
    add("DEF_cape.02", (0, 0.32, shoulder - 0.38), (0, 0.38, shoulder - 0.88), "DEF_cape.01")
    add("DEF_cape.03", (0, 0.38, shoulder - 0.88), (0, 0.34, shoulder - 1.38), "DEF_cape.02")
    if hero == "Hargold":
        add("DEF_scarf_tail.L", (-0.10, -0.05, shoulder + 0.05), (-0.10, -0.12, shoulder - 0.42), "DEF_chest")
        add("DEF_scarf_tail.R", (0.10, -0.05, shoulder + 0.05), (0.10, -0.12, shoulder - 0.42), "DEF_chest")
        add("DEF_feather", (-0.42, 0, head_top + 0.06), (-0.72, 0, head_top + 0.47), "DEF_head")
    else:
        add("DEF_adams_apple", (0, -0.10, head_center - 0.47), (0, -0.18, head_center - 0.64), "DEF_neck")
    for side, sign in (("L", -1), ("R", 1)):
        add(f"DEF_upper_arm.{side}", (sign * dims["chest_half"], 0, shoulder), (sign * dims["elbow"], 0, shoulder - 0.12), "DEF_chest")
        add(f"DEF_forearm.{side}", (sign * dims["elbow"], 0, shoulder - 0.12), (sign * dims["wrist"], 0, shoulder - 0.28), f"DEF_upper_arm.{side}")
        add(f"DEF_hand.{side}", (sign * dims["wrist"], 0, shoulder - 0.28), (sign * (dims["wrist"] + 0.18), 0, shoulder - 0.31), f"DEF_forearm.{side}")
        for finger_index, finger in enumerate(("thumb", "index", "middle", "ring", "pinky")):
            base_x = sign * (dims["wrist"] + 0.15)
            base_z = shoulder - 0.34 + (2 - finger_index) * 0.018
            add(f"DEF_{finger}.01.{side}", (base_x, -0.01, base_z),
                (base_x + sign * 0.10, -0.02, base_z), f"DEF_hand.{side}")
            add(f"DEF_{finger}.02.{side}", (base_x + sign * 0.10, -0.02, base_z),
                (base_x + sign * 0.18, -0.03, base_z), f"DEF_{finger}.01.{side}")
        add(f"DEF_thigh.{side}", (sign * dims["leg_x"], 0, hip), (sign * dims["leg_x"], 0, dims["knee"]), "DEF_hips")
        add(f"DEF_shin.{side}", (sign * dims["leg_x"], 0, dims["knee"]), (sign * dims["leg_x"], 0, dims["ankle"]), f"DEF_thigh.{side}")
        add(f"DEF_foot.{side}", (sign * dims["leg_x"], 0, dims["ankle"]), (sign * dims["leg_x"], -0.34, dims["ankle"] - 0.03), f"DEF_shin.{side}")
    socket_specs = {
        "SOCKET_hand_l": (-dims["wrist"], 0, shoulder - 0.28),
        "SOCKET_hand_r": (dims["wrist"], 0, shoulder - 0.28),
        "SOCKET_head": (0, 0, head_top),
        "SOCKET_hat": (0, 0, head_top + 0.02),
        "SOCKET_glasses": (0, -0.34, head_center + 0.05),
        "SOCKET_back": (0, 0.28, shoulder),
        "SOCKET_vfx_feet": (0, 0, 0.05),
        "SOCKET_vfx_center": (0, 0, hip),
    }
    for name, head in socket_specs.items():
        add(name, head, (head[0], head[1], head[2] + 0.12), "Root")
    add("CTRL_root", (0, 0, 0), (0, 0.35, 0), None, False)
    add("CTRL_hips", (0, -0.35, hip), (0, 0.35, hip), None, False)
    add("CTRL_chest", (0, -0.32, shoulder), (0, 0.32, shoulder), None, False)
    add("CTRL_head", (0, -0.28, head_center), (0, 0.28, head_center), None, False)
    add("CTRL_face", (0, -0.68, head_center), (0, -0.84, head_center), None, False)
    if hero == "Mebble":
        # Parallel rest orientation prevents control constraints from changing
        # the cape merely by being enabled.
        add("CTRL_cape.01", (0.62, 0.22, shoulder + 0.12), (0.62, 0.32, shoulder - 0.38), None, False)
        add("CTRL_cape.02", (0.62, 0.32, shoulder - 0.38), (0.62, 0.38, shoulder - 0.88), None, False)
        add("CTRL_cape.03", (0.62, 0.38, shoulder - 0.88), (0.62, 0.34, shoulder - 1.38), None, False)
    for side, sign in (("L", -1), ("R", 1)):
        add(f"CTRL_hand_ik.{side}", (sign * (dims["wrist"] + 0.2), -0.20, shoulder - 0.28),
            (sign * (dims["wrist"] + 0.2), 0.05, shoulder - 0.28), None, False)
        add(f"CTRL_elbow_pole.{side}", (sign * dims["elbow"], -0.65, shoulder - 0.12),
            (sign * dims["elbow"], -0.45, shoulder - 0.12), None, False)
        add(f"CTRL_foot_ik.{side}", (sign * dims["leg_x"], -0.35, dims["ankle"]),
            (sign * dims["leg_x"], 0.18, dims["ankle"]), None, False)
        add(f"CTRL_knee_pole.{side}", (sign * dims["leg_x"], -0.65, dims["knee"]),
            (sign * dims["leg_x"], -0.45, dims["knee"]), None, False)

    bpy.ops.object.mode_set(mode="POSE")
    for bone in arm.pose.bones:
        if bone.name.startswith("DEF_"):
            bone.rotation_mode = "XYZ"
    for side in ("L", "R"):
        arm_ik = arm.pose.bones[f"DEF_forearm.{side}"].constraints.new("IK")
        arm_ik.target = arm
        arm_ik.subtarget = f"CTRL_hand_ik.{side}"
        arm_ik.pole_target = arm
        arm_ik.pole_subtarget = f"CTRL_elbow_pole.{side}"
        arm_ik.chain_count = 2
        hand_control = arm.pose.bones[f"CTRL_hand_ik.{side}"]
        hand_control["ik_fk"] = 0.0
        hand_control.id_properties_ui("ik_fk").update(
            min=0.0, max=1.0, description="Blend the arm from FK (0) to IK (1)"
        )
        influence_driver = arm_ik.driver_add("influence").driver
        influence_driver.type = "SCRIPTED"
        variable = influence_driver.variables.new()
        variable.name = "ik_fk"
        variable.type = "SINGLE_PROP"
        variable.targets[0].id = arm
        variable.targets[0].data_path = f'pose.bones["CTRL_hand_ik.{side}"]["ik_fk"]'
        influence_driver.expression = "ik_fk"
        leg_ik = arm.pose.bones[f"DEF_shin.{side}"].constraints.new("IK")
        leg_ik.target = arm
        leg_ik.subtarget = f"CTRL_foot_ik.{side}"
        leg_ik.pole_target = arm
        leg_ik.pole_subtarget = f"CTRL_knee_pole.{side}"
        leg_ik.chain_count = 2
        foot_control = arm.pose.bones[f"CTRL_foot_ik.{side}"]
        foot_control["ik_fk"] = 0.0
        foot_control.id_properties_ui("ik_fk").update(
            min=0.0, max=1.0, description="Blend the leg from FK (0) to IK (1)"
        )
        influence_driver = leg_ik.driver_add("influence").driver
        influence_driver.type = "SCRIPTED"
        variable = influence_driver.variables.new()
        variable.name = "ik_fk"
        variable.type = "SINGLE_PROP"
        variable.targets[0].id = arm
        variable.targets[0].data_path = f'pose.bones["CTRL_foot_ik.{side}"]["ik_fk"]'
        influence_driver.expression = "ik_fk"
    if hero == "Mebble":
        cape_control = arm.pose.bones["CTRL_cape.01"]
        cape_control["cape_open"] = 0.0
        cape_control.id_properties_ui("cape_open").update(
            min=0.0, max=1.0, description="Blend the cape from draped to glide-open"
        )
        for index in (1, 2, 3):
            constraint = arm.pose.bones[f"DEF_cape.0{index}"].constraints.new("COPY_ROTATION")
            constraint.target = arm
            constraint.subtarget = f"CTRL_cape.0{index}"
            constraint.target_space = "LOCAL"
            constraint.owner_space = "LOCAL"
    bpy.ops.object.mode_set(mode="OBJECT")
    face_control = arm.pose.bones["CTRL_face"]
    for prop_name, description in (
        ("blink_L", "Close the left eyelids"),
        ("blink_R", "Close the right eyelids"),
        ("smile", "Broaden the authored smile"),
    ):
        face_control[prop_name] = 0.0
        ui = face_control.id_properties_ui(prop_name)
        ui.update(min=0.0, max=1.0, description=description)
    arm.select_set(False)
    return arm


def add_core_actions(arm, hero):
    scene = bpy.context.scene
    actions = {}
    relaxed_arms = {
        "DEF_upper_arm.L": (-0.72, 0, 0),
        "DEF_upper_arm.R": (-0.72, 0, 0),
    }

    def action(name, frames):
        act = bpy.data.actions.new(name)
        act.use_fake_user = True
        act["clip_status"] = "authored-core" if name in {
            "idle", "walk", "run", "takeoff", "rise", "fall", "land-soft",
            "glide-open", "glide-sustain", "glide-close"
        } else "contract-placeholder"
        arm.animation_data_create()
        arm.animation_data.action = act
        for pose_bone in arm.pose.bones:
            if pose_bone.rotation_mode == "QUATERNION":
                pose_bone.rotation_quaternion = (1, 0, 0, 0)
            else:
                pose_bone.rotation_euler = (0, 0, 0)
        for frame, poses in frames:
            scene.frame_set(frame)
            for bone_name, rotation in poses.items():
                bone = arm.pose.bones.get(bone_name)
                if bone:
                    bone.rotation_euler = rotation
                    bone.keyframe_insert("rotation_euler", frame=frame)
        actions[name] = act
        return act

    action("idle", [
        (1, {**relaxed_arms, "DEF_chest": (0, 0, -0.025), "DEF_head": (0.02, 0, 0)}),
        (20, {**relaxed_arms, "DEF_chest": (0, 0, 0.025), "DEF_head": (-0.015, 0, 0)}),
        (40, {**relaxed_arms, "DEF_chest": (0, 0, -0.025), "DEF_head": (0.02, 0, 0)}),
    ])
    for name, amplitude, length in (("walk", 0.55, 24), ("run", 0.9, 16)):
        action(name, [
            (1, {"DEF_thigh.L": (amplitude, 0, 0), "DEF_thigh.R": (-amplitude, 0, 0),
                 "DEF_upper_arm.L": (-amplitude * 0.7, 0, 0), "DEF_upper_arm.R": (amplitude * 0.7, 0, 0)}),
            (length // 2, {"DEF_thigh.L": (-amplitude, 0, 0), "DEF_thigh.R": (amplitude, 0, 0),
                           "DEF_upper_arm.L": (amplitude * 0.7, 0, 0), "DEF_upper_arm.R": (-amplitude * 0.7, 0, 0)}),
            (length, {"DEF_thigh.L": (amplitude, 0, 0), "DEF_thigh.R": (-amplitude, 0, 0),
                      "DEF_upper_arm.L": (-amplitude * 0.7, 0, 0), "DEF_upper_arm.R": (amplitude * 0.7, 0, 0)}),
        ])
    action("takeoff", [
        (1, {**relaxed_arms, "DEF_hips": (0.12, 0, 0)}),
        (8, {**relaxed_arms, "DEF_hips": (-0.15, 0, 0)})
    ])
    action("rise", [(1, {
        "DEF_upper_arm.L": (-0.95, 0, 0),
        "DEF_upper_arm.R": (-0.30, 0, 0),
        "DEF_chest": (-0.12, 0, 0)
    })])
    action("fall", [(1, {
        "DEF_upper_arm.L": (-0.38, 0, 0),
        "DEF_upper_arm.R": (-0.38, 0, 0),
        "DEF_chest": (0.10, 0, 0)
    })])
    action("land-soft", [
        (1, {**relaxed_arms, "DEF_hips": (0.18, 0, 0)}),
        (10, {**relaxed_arms, "DEF_hips": (0, 0, 0)})
    ])
    if hero == "Mebble":
        action("glide-open", [(1, {"DEF_upper_arm.L": (0, 0, 0), "DEF_upper_arm.R": (0, 0, 0)})])
        action("glide-sustain", [(1, {"DEF_upper_arm.L": (0, 0, 0), "DEF_upper_arm.R": (0, 0, 0)})])
        action("glide-close", [(1, {"DEF_upper_arm.L": (0, 0, 0), "DEF_upper_arm.R": (0, 0, 0)})])
        for clip_name, cape_open in (("glide-open", 1.0), ("glide-sustain", 1.0), ("glide-close", 0.0)):
            arm.animation_data.action = actions[clip_name]
            control = arm.pose.bones["CTRL_cape.01"]
            control["cape_open"] = cape_open
            control.keyframe_insert(data_path='["cape_open"]', frame=1)
    arm.animation_data.action = actions["idle"]
    scene.frame_start, scene.frame_end = 1, 40


def common_face(hero, arm, geo, mats, center, head_scale, glasses=False):
    x, y, z = center
    head = sphere(f"GEO_{hero}_head", center, head_scale, mats["skin"], geo)
    parent_bone(head, arm, "DEF_head")
    for side in (-1, 1):
        ear = sphere(
            f"GEO_{hero}_ear_{'L' if side < 0 else 'R'}",
            (x + side * head_scale[0] * 0.92, y, z),
            (head_scale[0] * 0.19, head_scale[1] * 0.14, head_scale[2] * 0.25),
            mats["skin_light"], geo
        )
        parent_bone(ear, arm, "DEF_head")
    for side in (-1, 1):
        eye_x = x + side * head_scale[0] * 0.34
        eye_y = y - head_scale[1] * 0.82
        eye_z = z + head_scale[2] * 0.08
        eye_width = 0.27 if hero == "Hargold" else 0.25
        eye_height = 0.32 if hero == "Hargold" else 0.30
        eye = sphere(
            f"GEO_{hero}_eye_{'L' if side < 0 else 'R'}",
            (eye_x, eye_y, eye_z),
            (head_scale[0] * eye_width, head_scale[1] * 0.10, head_scale[2] * eye_height),
            mats["white"], geo
        )
        pupil = sphere(
            f"GEO_{hero}_pupil_{'L' if side < 0 else 'R'}",
            (eye_x, eye_y - head_scale[1] * 0.085, eye_z),
            (head_scale[0] * 0.12, head_scale[1] * 0.045, head_scale[2] * 0.16),
            mats["iris"], geo
        )
        pupil_black = sphere(
            f"GEO_{hero}_pupil_black_{'L' if side < 0 else 'R'}",
            (eye_x, eye_y - head_scale[1] * 0.125, eye_z),
            (head_scale[0] * 0.058, head_scale[1] * 0.026, head_scale[2] * 0.085),
            mats["black"], geo
        )
        eye_glint = sphere(
            f"GEO_{hero}_eye_glint_{'L' if side < 0 else 'R'}",
            (eye_x - head_scale[0] * 0.025, eye_y - head_scale[1] * 0.15, eye_z + head_scale[2] * 0.055),
            (head_scale[0] * 0.021, head_scale[1] * 0.010, head_scale[2] * 0.030),
            mats["white"], geo
        )
        eye_bone = f"DEF_eye.{'L' if side < 0 else 'R'}"
        blink_prop = f"blink_{'L' if side < 0 else 'R'}"
        for eye_part in (eye, pupil, pupil_black, eye_glint):
            parent_bone(eye_part, arm, eye_bone)
            drive_transform(eye_part, "scale", 2, arm, "CTRL_face", blink_prop, f"1.0 - 0.82 * {blink_prop}")
        brow = cube(
            f"GEO_{hero}_brow_{'L' if side < 0 else 'R'}",
            (eye_x, eye_y - 0.035, eye_z + head_scale[2] * 0.27),
            (head_scale[0] * 0.20, 0.035, 0.045 if hero == "Hargold" else 0.065),
            mats["hair"], geo, rotation=(0, side * 0.06, side * 0.06), bevel=0.02
        )
        parent_bone(brow, arm, "DEF_head")
        cheek = sphere(
            f"GEO_{hero}_cheek_{'L' if side < 0 else 'R'}",
            (x + side * head_scale[0] * 0.39, y - head_scale[1] * 0.83, z - head_scale[2] * 0.18),
            (head_scale[0] * 0.23, head_scale[1] * 0.07, head_scale[2] * 0.15),
            mats["skin_light"], geo
        )
        parent_bone(cheek, arm, "DEF_head")
        blush = sphere(
            f"GEO_{hero}_blush_{'L' if side < 0 else 'R'}",
            (x + side * head_scale[0] * 0.48, y - head_scale[1] * 0.895, z - head_scale[2] * 0.17),
            (head_scale[0] * 0.11, head_scale[1] * 0.018, head_scale[2] * 0.055),
            mats["blush"], geo
        )
        parent_bone(blush, arm, "DEF_head")
        if glasses:
            frame_side = "L" if side < 0 else "R"
            frame = torus(
                f"GEO_{hero}_glasses_{frame_side}_frame",
                (eye_x + side * 0.012, eye_y - 0.070, eye_z + side * 0.016),
                head_scale[0] * 0.275, 0.025, mats["glass"], geo
            )
            frame.scale.z = 1.08
            frame.rotation_euler.y += 0.065 if side < 0 else -0.025
            parent_bone(frame, arm, "DEF_head")
    nose = sphere(
        f"GEO_{hero}_nose", (x, y - head_scale[1] * 0.98, z - head_scale[2] * 0.03),
        (head_scale[0] * (0.21 if hero == "Hargold" else 0.16),
         head_scale[1] * (0.20 if hero == "Hargold" else 0.16),
         head_scale[2] * (0.17 if hero == "Hargold" else 0.13)),
        mats["skin_light"], geo
    )
    parent_bone(nose, arm, "DEF_head")
    mouth = sphere(
        f"GEO_{hero}_mouth", (x, y - head_scale[1] * 0.93, z - head_scale[2] * 0.29),
        (head_scale[0] * (0.24 if hero == "Mebble" else 0.22),
         head_scale[1] * 0.055, head_scale[2] * (0.085 if hero == "Mebble" else 0.075)),
        mats["black"], geo
    )
    if hero == "Mebble":
        mouth.scale.z *= 0.48
    teeth = cube(
        f"GEO_{hero}_teeth", (x, y - head_scale[1] * 0.99, z - head_scale[2] * 0.27),
        (head_scale[0] * (0.16 if hero == "Mebble" else 0.12), 0.018, head_scale[2] * 0.027),
        mats["white"], geo, bevel=0.012
    )
    parent_bone(mouth, arm, "DEF_jaw")
    parent_bone(teeth, arm, "DEF_jaw")
    drive_transform(mouth, "scale", 0, arm, "CTRL_face", "smile", "1.0 + 0.45 * smile")
    drive_transform(teeth, "scale", 0, arm, "CTRL_face", "smile", "1.0 + 0.35 * smile")
    smile_curve = tube_curve(
        f"GEO_{hero}_smile_curve",
        (
            (x - head_scale[0] * 0.24, y - head_scale[1] * 1.035, z - head_scale[2] * 0.255),
            (x, y - head_scale[1] * 1.06, z - head_scale[2] * 0.335),
            (x + head_scale[0] * 0.24, y - head_scale[1] * 1.035, z - head_scale[2] * 0.255),
        ),
        0.018 if hero == "Hargold" else 0.014, mats["black"], geo
    )
    parent_bone(smile_curve, arm, "DEF_jaw")
    if glasses:
        bridge = cube(f"GEO_{hero}_glasses_bridge", (x, y - head_scale[1] * 0.90, z + 0.05),
                      (head_scale[0] * 0.14, 0.025, 0.025), mats["glass"], geo, bevel=0.015)
        parent_bone(bridge, arm, "DEF_head")
        for side in (-1, 1):
            temple = cylinder_between(
                f"GEO_{hero}_glasses_temple_{'L' if side < 0 else 'R'}",
                (x + side * head_scale[0] * 0.40, y - head_scale[1] * 0.89, z + head_scale[2] * 0.07),
                (x + side * head_scale[0] * 0.83, y - head_scale[1] * 0.42, z + head_scale[2] * 0.06),
                0.022, mats["glass"], geo
            )
            parent_bone(temple, arm, "DEF_head")
    return head


def hargold(arm, geo, attach, mats):
    body = sphere("GEO_Hargold_body", (0, 0, 1.38), (0.82, 0.55, 0.90), mats["olive"], geo)
    parent_bone(body, arm, "DEF_spine")
    shirt = sphere("GEO_Hargold_shirt_panel", (0, -0.50, 1.50), (0.43, 0.075, 0.54), mats["cream"], geo)
    parent_bone(shirt, arm, "DEF_chest")
    belt = torus("GEO_Hargold_belt", (0, 0, 1.02), 0.69, 0.085, mats["brown"], geo, rotation=(0, 0, 0))
    belt.scale.y = 0.76
    parent_bone(belt, arm, "DEF_hips")
    buckle = cube("GEO_Hargold_buckle", (0, -0.69, 1.02), (0.18, 0.055, 0.15), mats["brass"], geo, bevel=0.035)
    parent_bone(buckle, arm, "DEF_hips")
    buckle_inset = cube("GEO_Hargold_buckle_inset", (0, -0.752, 1.02), (0.105, 0.018, 0.078), mats["brown"], geo, bevel=0.022)
    buckle_tongue = cube("GEO_Hargold_buckle_tongue", (0.045, -0.774, 1.02), (0.065, 0.010, 0.014), mats["brass"], geo, bevel=0.006)
    parent_bone(buckle_inset, arm, "DEF_hips")
    parent_bone(buckle_tongue, arm, "DEF_hips")
    scarf = torus("GEO_Hargold_scarf", (0, 0, 2.08), 0.52, 0.16, mats["scarf"], geo, rotation=(0, 0, 0))
    scarf.scale.y = 0.82
    parent_bone(scarf, arm, "DEF_chest")
    common_face("Hargold", arm, geo, mats, (0, -0.02, 2.48), (0.67, 0.55, 0.64))
    beard = sphere("GEO_Hargold_beard", (0, -0.56, 2.11), (0.31, 0.12, 0.25), mats["hair"], geo)
    moustache_l = sphere("GEO_Hargold_moustache_L", (-0.13, -0.61, 2.36), (0.17, 0.055, 0.065), mats["hair"], geo)
    moustache_r = sphere("GEO_Hargold_moustache_R", (0.13, -0.61, 2.36), (0.17, 0.055, 0.065), mats["hair"], geo)
    moustache_l.rotation_euler.y = -0.18
    moustache_r.rotation_euler.y = 0.18
    for obj in (beard, moustache_l, moustache_r):
        parent_bone(obj, arm, "DEF_head")
    smile = sphere("GEO_Hargold_smile", (0, -0.685, 2.285), (0.18, 0.028, 0.075), mats["black"], geo)
    smile_teeth = cube("GEO_Hargold_smile_teeth", (0, -0.716, 2.305), (0.11, 0.013, 0.025), mats["white"], geo, bevel=0.012)
    parent_bone(smile, arm, "DEF_jaw")
    parent_bone(smile_teeth, arm, "DEF_jaw")
    for index, (bx, bz, scale) in enumerate((
        (-0.20, 2.10, (0.13, 0.055, 0.15)),
        (-0.07, 2.02, (0.13, 0.055, 0.17)),
        (0.07, 2.02, (0.13, 0.055, 0.17)),
        (0.20, 2.10, (0.13, 0.055, 0.15)),
    )):
        beard_curl = sphere(f"GEO_Hargold_beard_curl_{index}", (bx, -0.66, bz), scale, mats["hair"], geo)
        parent_bone(beard_curl, arm, "DEF_head")
    for index, (hx, hy, hz, scale) in enumerate((
        (-0.46, 0.02, 2.60, (0.22, 0.18, 0.25)),
        (0.46, 0.02, 2.60, (0.22, 0.18, 0.25)),
        (-0.34, 0.22, 2.80, (0.24, 0.22, 0.24)),
        (0.34, 0.22, 2.80, (0.24, 0.22, 0.24)),
        (0.0, 0.29, 2.86, (0.32, 0.23, 0.20)),
    )):
        curl = sphere(f"GEO_Hargold_hair_{index}", (hx, hy, hz), scale, mats["hair"], geo)
        parent_bone(curl, arm, "DEF_head")
    for index, z in enumerate((1.35, 1.55, 1.75)):
        button = sphere(f"GEO_Hargold_jacket_button_{index}", (0, -0.59, z),
                        (0.055, 0.025, 0.055), mats["brass"], geo)
        parent_bone(button, arm, "DEF_chest")
    scarf_knot = sphere("GEO_Hargold_scarf_knot", (0, -0.58, 1.99), (0.16, 0.07, 0.15), mats["olive_dark"], geo)
    scarf_tail_l = trapezoid_prism("GEO_Hargold_scarf_tail_L", (-0.10, -0.57, 1.79), 0.12, 0.19, 0.43, 0.045, mats["olive_dark"], geo)
    scarf_tail_r = trapezoid_prism("GEO_Hargold_scarf_tail_R", (0.10, -0.57, 1.78), 0.12, 0.18, 0.39, 0.045, mats["olive_dark"], geo)
    parent_bone(scarf_knot, arm, "DEF_chest")
    parent_bone(scarf_tail_l, arm, "DEF_scarf_tail.L")
    parent_bone(scarf_tail_r, arm, "DEF_scarf_tail.R")
    brim = cylinder("GEO_Hargold_hat_brim", (0, 0, 2.99), 0.76, 0.075, mats["olive_dark"], geo)
    brim.scale.y = 0.82
    brim.rotation_euler.y = -0.07
    crown = cone("GEO_Hargold_hat_crown", (0.04, 0.05, 3.27), 0.45, 0.27, 0.58, mats["olive"], geo, rotation=(0, -0.08, 0))
    band = torus("GEO_Hargold_hat_band", (0, 0.02, 3.08), 0.37, 0.045, mats["brown_light"], geo, rotation=(0, 0, 0))
    feather = cone("GEO_Hargold_feather", (-0.46, 0.0, 3.30), 0.13, 0.025, 0.58, mats["orange"], attach, rotation=(0, -0.8, 0))
    for obj in (brim, crown, band):
        parent_bone(obj, arm, "DEF_head")
    parent_bone(feather, arm, "DEF_feather")
    backpack = cube("GEO_Hargold_backpack", (0, 0.53, 1.55), (0.55, 0.22, 0.62), mats["olive_dark"], attach, bevel=0.12)
    flap = cube("GEO_Hargold_backpack_flap", (0, 0.78, 1.75), (0.47, 0.08, 0.22), mats["brown_light"], attach, bevel=0.08)
    for obj in (backpack, flap):
        parent_bone(obj, arm, "DEF_chest")
    pack_pocket = cube("GEO_Hargold_backpack_pocket", (0, 0.79, 1.37), (0.29, 0.065, 0.22), mats["brown"], attach, bevel=0.065)
    pack_buckle = cube("GEO_Hargold_backpack_buckle", (0, 0.865, 1.41), (0.07, 0.018, 0.055), mats["brass"], attach, bevel=0.015)
    pack_leaf = sphere("GEO_Hargold_backpack_leaf", (0, 0.875, 1.63), (0.12, 0.018, 0.065), mats["olive_light"], attach)
    pack_leaf.rotation_euler.y = -0.42
    parent_bone(pack_pocket, arm, "DEF_chest")
    parent_bone(pack_buckle, arm, "DEF_chest")
    parent_bone(pack_leaf, arm, "DEF_chest")
    for side, sign in (("L", -1), ("R", 1)):
        strap = cube(f"GEO_Hargold_backpack_strap_{side}", (sign * 0.39, 0.765, 1.63),
                     (0.055, 0.018, 0.46), mats["brown_light"], attach,
                     rotation=(0, sign * 0.05, sign * 0.04), bevel=0.02)
        parent_bone(strap, arm, "DEF_chest")
    for side, sign in (("L", -1), ("R", 1)):
        pouch = cube(f"GEO_Hargold_belt_pouch_{side}", (sign * 0.48, -0.59, 1.0),
                     (0.17, 0.10, 0.20), mats["brown_light"], attach, bevel=0.055)
        parent_bone(pouch, arm, "DEF_hips")
    for side, sign in (("L", -1), ("R", 1)):
        lapel = cube(f"GEO_Hargold_jacket_lapel_{side}", (sign * 0.24, -0.55, 1.68),
                     (0.12, 0.035, 0.39), mats["olive_light"], geo,
                     rotation=(0, sign * 0.18, sign * 0.20), bevel=0.035)
        parent_bone(lapel, arm, "DEF_chest")
    for side, sign in (("L", -1), ("R", 1)):
        cuff = torus(f"GEO_Hargold_sleeve_cuff_{side}", (sign * 1.48, 0, 1.72),
                     0.235, 0.045, mats["olive_dark"], geo, rotation=(0, math.pi / 2, 0))
        cuff.scale.z = 0.82
        parent_bone(cuff, arm, f"DEF_forearm.{side}")
    limbs(arm, geo, mats, "Hargold", arm_width=0.22, leg_width=0.28, boot_height=0.45)


def mebble(arm, geo, attach, mats):
    torso = sphere("GEO_Mebble_torso", (0, 0, 1.86), (0.43, 0.30, 0.68), mats["brown_light"], geo)
    shirt = sphere("GEO_Mebble_shirt", (0, -0.18, 1.88), (0.37, 0.20, 0.61), mats["cream"], geo)
    parent_bone(torso, arm, "DEF_spine")
    parent_bone(shirt, arm, "DEF_chest")
    neck = cylinder("GEO_Mebble_neck", (0, 0, 2.72), 0.16, 1.02, mats["skin"], geo)
    parent_bone(neck, arm, "DEF_neck")
    adam = sphere("GEO_Mebble_adams_apple", (0, -0.16, 2.73), (0.10, 0.07, 0.12), mats["skin_light"], geo)
    parent_bone(adam, arm, "DEF_adams_apple")
    common_face("Mebble", arm, geo, mats, (0, -0.01, 3.30), (0.47, 0.40, 0.55), glasses=True)
    chin = sphere("GEO_Mebble_chin", (0, -0.34, 3.00), (0.13, 0.065, 0.10), mats["skin"], geo)
    goatee = sphere("GEO_Mebble_goatee", (0, -0.405, 2.94), (0.07, 0.025, 0.05), mats["hair"], geo)
    parent_bone(chin, arm, "DEF_head")
    parent_bone(goatee, arm, "DEF_jaw")
    hair_specs = (
        (-0.32, -0.02, 3.59, (0.23, 0.20, 0.25), -0.35),
        (-0.16, -0.08, 3.72, (0.25, 0.20, 0.28), -0.15),
        (0.02, -0.08, 3.76, (0.27, 0.21, 0.27), 0.12),
        (0.22, -0.02, 3.67, (0.24, 0.20, 0.26), 0.32),
        (-0.34, 0.16, 3.45, (0.22, 0.20, 0.28), -0.50),
        (0.34, 0.16, 3.48, (0.22, 0.20, 0.28), 0.50),
        (0.0, 0.25, 3.62, (0.34, 0.24, 0.28), 0.0),
    )
    for index, (hx, hy, hz, scale, rot) in enumerate(hair_specs):
        hair = sphere(f"GEO_Mebble_hair_{index}", (hx, hy, hz), scale, mats["hair"], geo)
        hair.rotation_euler.y = rot
        parent_bone(hair, arm, "DEF_head")
    for index, (position, scale, tilt) in enumerate((
        ((-0.29, -0.34, 3.57), (0.115, 0.075, 0.205), -0.58),
        ((-0.13, -0.39, 3.65), (0.120, 0.075, 0.225), -0.28),
        ((0.04, -0.40, 3.66), (0.125, 0.075, 0.215), 0.05),
        ((0.20, -0.37, 3.61), (0.115, 0.072, 0.195), 0.34),
        ((0.31, -0.30, 3.53), (0.100, 0.068, 0.165), 0.61),
    )):
        lock = sphere(f"GEO_Mebble_forelock_{index}", position, scale, mats["hair"], geo)
        lock.rotation_euler.y = tilt
        parent_bone(lock, arm, "DEF_head")
    brim = cylinder("GEO_Mebble_hat_brim", (0.065, 0, 3.82), 0.39, 0.055, mats["brown"], geo)
    brim.scale.y = 0.82
    brim.rotation_euler.y = 0.14
    brim.rotation_euler.z = -0.08
    crown = cone("GEO_Mebble_hat_crown", (0.095, 0.01, 4.10), 0.255, 0.30, 0.58,
                 mats["brown_light"], geo, rotation=(0, 0.14, -0.08))
    band = torus("GEO_Mebble_hat_band", (0.065, 0, 3.88), 0.265, 0.034,
                 mats["olive_light"], geo, rotation=(0, 0.14, -0.08))
    leaf = sphere("GEO_Mebble_hat_leaf", (0.38, -0.01, 4.02), (0.15, 0.030, 0.065), mats["olive_light"], attach)
    for obj in (brim, crown, band, leaf):
        parent_bone(obj, arm, "DEF_head")
    for z in (1.52, 1.75):
        belt = torus(f"GEO_Mebble_belt_{z}", (0, 0, z), 0.39, 0.05, mats["brown"], geo, rotation=(0, 0, 0))
        belt.scale.y = 0.78
        parent_bone(belt, arm, "DEF_hips" if z < 1.6 else "DEF_spine")
        buckle = cube(f"GEO_Mebble_buckle_{z}", (0, -0.405, z), (0.115, 0.040, 0.095), mats["brass"], geo, bevel=0.022)
        buckle_inset = cube(f"GEO_Mebble_buckle_inset_{z}", (0, -0.452, z), (0.067, 0.012, 0.048), mats["brown"], geo, bevel=0.012)
        parent_bone(buckle, arm, "DEF_hips" if z < 1.6 else "DEF_spine")
        parent_bone(buckle_inset, arm, "DEF_hips" if z < 1.6 else "DEF_spine")
    for z in (1.83, 2.04, 2.25):
        button = sphere(f"GEO_Mebble_shirt_button_{z}", (0, -0.405, z), (0.036, 0.018, 0.036), mats["brass"], geo)
        parent_bone(button, arm, "DEF_chest")
    hood_back = sphere("GEO_Mebble_hood_back", (0, 0.21, 2.45), (0.39, 0.20, 0.18), mats["olive"], geo)
    hood_l = sphere("GEO_Mebble_hood_L", (-0.24, -0.10, 2.43), (0.19, 0.11, 0.12), mats["olive"], geo)
    hood_r = sphere("GEO_Mebble_hood_R", (0.24, -0.10, 2.43), (0.19, 0.11, 0.12), mats["olive"], geo)
    for hood_part in (hood_back, hood_l, hood_r):
        parent_bone(hood_part, arm, "DEF_chest")
    clasp = torus("GEO_Mebble_cape_clasp", (0, -0.405, 2.44), 0.070, 0.022, mats["brass"], geo)
    parent_bone(clasp, arm, "DEF_chest")
    for side, sign in (("L", -1), ("R", 1)):
        vest = cube(f"GEO_Mebble_vest_panel_{side}", (sign * 0.19, -0.30, 1.95),
                    (0.16, 0.035, 0.49), mats["brown_light"], geo, bevel=0.035)
        pouch = cube(f"GEO_Mebble_pouch_{side}", (sign * 0.34, -0.34, 1.54),
                     (0.14, 0.08, 0.18), mats["brown"], attach, bevel=0.05)
        parent_bone(vest, arm, "DEF_chest")
        parent_bone(pouch, arm, "DEF_hips")
        suspender = cube(f"GEO_Mebble_suspender_{side}", (sign * 0.20, -0.36, 2.12),
                         (0.045, 0.025, 0.39), mats["brown"], geo,
                         rotation=(0, sign * 0.08, sign * 0.06), bevel=0.018)
        parent_bone(suspender, arm, "DEF_chest")
    cape = curved_cape("GEO_Mebble_cape", (0, 0.43, 2.04), 0.70, 1.15, 1.82, 0.08,
                       mats["olive"], attach)
    skin_cape(cape, arm)
    emblem_parts = (
        cylinder_between("GEO_Mebble_emblem_upper_L", (0, 0.635, 2.35), (-0.17, 0.635, 2.18), 0.018, mats["brass"], attach),
        cylinder_between("GEO_Mebble_emblem_lower_L", (-0.17, 0.635, 2.18), (0, 0.635, 1.99), 0.018, mats["brass"], attach),
        cylinder_between("GEO_Mebble_emblem_upper_R", (0, 0.635, 2.35), (0.17, 0.635, 2.18), 0.018, mats["brass"], attach),
        cylinder_between("GEO_Mebble_emblem_lower_R", (0.17, 0.635, 2.18), (0, 0.635, 1.99), 0.018, mats["brass"], attach),
    )
    for emblem_part in emblem_parts:
        parent_bone(emblem_part, arm, "DEF_cape.02")
    emblem_center = torus("GEO_Mebble_cape_emblem_center", (0, 0.652, 2.18), 0.075, 0.018, mats["brass"], attach)
    parent_bone(emblem_center, arm, "DEF_cape.02")
    limbs(arm, geo, mats, "Mebble", arm_width=0.13, leg_width=0.16, boot_height=0.62)


def limbs(arm, geo, mats, hero, arm_width, leg_width, boot_height):
    dims = {
        "Hargold": {"shoulder": 1.92, "elbow": 1.34, "wrist": 1.72, "leg_x": 0.32, "knee": 0.54, "ankle": 0.17},
        "Mebble": {"shoulder": 2.27, "elbow": 0.86, "wrist": 1.18, "leg_x": 0.20, "knee": 0.72, "ankle": 0.19},
    }[hero]
    for side, sign in (("L", -1), ("R", 1)):
        upper_x = sign * (dims["elbow"] - 0.20)
        fore_x = sign * (dims["elbow"] + dims["wrist"]) / 2
        upper = cylinder(f"GEO_{hero}_upper_arm_{side}", (upper_x, 0, dims["shoulder"] - 0.07),
                         arm_width, abs(dims["elbow"] - 0.38), mats["olive" if hero == "Hargold" else "cream"],
                         geo, rotation=(0, math.pi / 2, 0))
        fore = cylinder(f"GEO_{hero}_forearm_{side}", (fore_x, 0, dims["shoulder"] - 0.20),
                        arm_width * 0.83, abs(dims["wrist"] - dims["elbow"]), mats["skin"], geo,
                        rotation=(0, math.pi / 2, 0))
        hand = sphere(f"GEO_{hero}_hand_{side}", (sign * (dims["wrist"] + 0.13), -0.01, dims["shoulder"] - 0.27),
                      (arm_width * 1.10, arm_width * 0.72, arm_width * 1.22), mats["skin_light"], geo)
        parent_bone(upper, arm, f"DEF_upper_arm.{side}")
        parent_bone(fore, arm, f"DEF_forearm.{side}")
        parent_bone(hand, arm, f"DEF_hand.{side}")
        finger_names = ("thumb", "index", "middle", "ring", "pinky")
        for finger_index, finger_name in enumerate(finger_names):
            y_offset = -arm_width * 0.76
            z_offset = (2 - finger_index) * arm_width * 0.26
            if finger_name == "thumb":
                y_offset = -arm_width * 0.58
                z_offset = -arm_width * 0.62
            for segment in (1, 2):
                segment_start = (
                    sign * (dims["wrist"] + 0.20 + (segment - 1) * arm_width * 0.34),
                    y_offset,
                    dims["shoulder"] - 0.27 + z_offset
                )
                segment_end = (
                    sign * (dims["wrist"] + 0.20 + segment * arm_width * 0.34),
                    y_offset - arm_width * 0.10,
                    dims["shoulder"] - 0.27 + z_offset - (0.018 if finger_name == "thumb" else 0)
                )
                digit = cylinder_between(
                    f"GEO_{hero}_{finger_name}_{segment}_{side}",
                    segment_start, segment_end,
                    arm_width * (0.20 if finger_name != "thumb" else 0.23),
                    mats["skin_light"], geo, vertices=16
                )
                parent_bone(digit, arm, f"DEF_{finger_name}.0{segment}.{side}")
        thigh_z = (0.98 + dims["knee"]) / 2 if hero == "Hargold" else (1.55 + dims["knee"]) / 2
        thigh_len = (0.98 - dims["knee"]) if hero == "Hargold" else (1.55 - dims["knee"])
        thigh = cylinder(f"GEO_{hero}_thigh_{side}", (sign * dims["leg_x"], 0, thigh_z),
                         leg_width, thigh_len, mats["trouser"], geo)
        shin_z = (dims["knee"] + dims["ankle"]) / 2
        shin = cylinder(f"GEO_{hero}_shin_{side}", (sign * dims["leg_x"], 0, shin_z),
                        leg_width * 0.85, dims["knee"] - dims["ankle"], mats["trouser"], geo)
        boot = cube(f"GEO_{hero}_boot_{side}", (sign * dims["leg_x"], -0.10, boot_height / 2),
                    (leg_width * 1.22, 0.30 if hero == "Hargold" else 0.24, boot_height / 2),
                    mats["brown"], geo, bevel=0.10)
        parent_bone(thigh, arm, f"DEF_thigh.{side}")
        parent_bone(shin, arm, f"DEF_shin.{side}")
        parent_bone(boot, arm, f"DEF_foot.{side}")
        toe = sphere(
            f"GEO_{hero}_boot_toe_{side}",
            (sign * dims["leg_x"], -0.34 if hero == "Hargold" else -0.30, boot_height * 0.27),
            (leg_width * 1.28, 0.24, boot_height * 0.27),
            mats["brown_light"], geo
        )
        cuff = torus(
            f"GEO_{hero}_boot_cuff_{side}",
            (sign * dims["leg_x"], 0, boot_height * 0.78),
            leg_width * 1.00, 0.045, mats["brown_light"], geo, rotation=(0, 0, 0)
        )
        cuff.scale.y = 0.78
        parent_bone(toe, arm, f"DEF_foot.{side}")
        parent_bone(cuff, arm, f"DEF_shin.{side}")
        sole = cube(
            f"GEO_{hero}_boot_sole_{side}",
            (sign * dims["leg_x"], -0.13, 0.045),
            (leg_width * 1.30, 0.39 if hero == "Hargold" else 0.32, 0.045),
            mats["brown_light"], geo, bevel=0.035
        )
        parent_bone(sole, arm, f"DEF_foot.{side}")
        if hero in ("Hargold", "Mebble"):
            lace_count = 3 if hero == "Hargold" else 4
            for lace_index in range(lace_count):
                lace = cube(
                    f"GEO_{hero}_boot_lace_{side}_{lace_index}",
                    (sign * dims["leg_x"], -0.325 if hero == "Hargold" else -0.255,
                     0.19 + lace_index * (0.08 if hero == "Hargold" else 0.10)),
                    (leg_width * 0.68, 0.018, 0.014), mats["brass"], geo,
                    rotation=(0, 0, (0.18 if lace_index % 2 else -0.18) * sign), bevel=0.008
                )
                parent_bone(lace, arm, f"DEF_shin.{side}")


def setup_render(hero, geo):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 900
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.world.color = (0.025, 0.035, 0.018)
    scene.view_settings.look = "AgX - Medium High Contrast"
    height = 3.45 if hero == "Hargold" else 4.25
    bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, -0.03))
    ground = bpy.context.object
    ground.name = "QA_Ground"
    ground.data.materials.append(material("MAT_QA_ground", (0.12, 0.18, 0.07, 1), 0.9))
    camera_data = bpy.data.cameras.new("QA_Camera")
    camera = bpy.data.objects.new("QA_Camera", camera_data)
    bpy.context.scene.collection.objects.link(camera)
    camera.location = (5.8, -9.5, height * 0.62)
    direction = Vector((0, 0, height * 0.48)) - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    camera.data.lens = 62
    scene.camera = camera
    for name, location, energy, size, color in (
        ("Key", (-4, -5, 7), 1050, 4.0, (1.0, 0.72, 0.48)),
        ("Fill", (4, -3, 5), 650, 3.0, (0.42, 0.65, 1.0)),
        ("Rim", (1, 4, 6), 1200, 2.0, (0.65, 0.82, 0.45)),
    ):
        light_data = bpy.data.lights.new(name, "AREA")
        light_data.energy, light_data.shape, light_data.size, light_data.color = energy, "DISK", size, color
        light = bpy.data.objects.new(name, light_data)
        light.location = location
        direction = Vector((0, 0, height * 0.48)) - light.location
        light.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
        scene.collection.objects.link(light)
    return ground


def render_qa_views(hero):
    scene = bpy.context.scene
    camera = bpy.data.objects["QA_Camera"]
    height = 3.45 if hero == "Hargold" else 4.25
    target = Vector((0, 0, height * 0.48))
    views = {
        "front": (0, -10.5, height * 0.55),
        "side": (9.5, 0, height * 0.55),
        "back": (0, 10.5, height * 0.55),
    }
    original_location = camera.location.copy()
    original_rotation = camera.rotation_euler.copy()
    original_resolution = (scene.render.resolution_x, scene.render.resolution_y)
    original_camera_type = camera.data.type
    original_lens = camera.data.lens
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = height * 1.23
    scene.render.resolution_x = 600
    scene.render.resolution_y = 600
    for view, location in views.items():
        camera.location = location
        camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()
        scene.render.filepath = str(PREVIEW_DIR / f"{hero.lower()}_character_{view}.png")
        bpy.ops.render.render(write_still=True)
    camera.location = original_location
    camera.rotation_euler = original_rotation
    camera.data.type = original_camera_type
    camera.data.lens = original_lens
    scene.render.resolution_x, scene.render.resolution_y = original_resolution


def render_action_pose(hero, armature):
    scene = bpy.context.scene
    action_name = "run" if hero == "Hargold" else "glide-sustain"
    armature.animation_data.action = bpy.data.actions[action_name]
    scene.frame_set(2)
    scene.frame_set(1)
    scene.render.filepath = str(PREVIEW_DIR / f"{hero.lower()}_character_{action_name}_pose.png")
    bpy.ops.render.render(write_still=True)
    armature.animation_data.action = bpy.data.actions["idle"]
    if hero == "Mebble":
        armature.pose.bones["CTRL_cape.01"]["cape_open"] = 0.0
    scene.frame_set(2)
    scene.frame_set(1)


def export_glb(hero, arm):
    bpy.ops.object.select_all(action="DESELECT")
    selected = [arm]
    for collection_name in ("GEO", "ATTACHMENTS"):
        selected.extend(bpy.data.collections[collection_name].all_objects)
    for obj in selected:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.export_scene.gltf(
        filepath=str(EXPORT_DIR / f"{hero.lower()}_character.glb"),
        export_format="GLB",
        use_selection=True,
        # Applying modifiers destroys morph targets; source primitives already
        # have transforms applied when created, so preserve the shape-key stack.
        export_apply=False,
        export_yup=True,
        export_animations=True,
        export_skins=True,
        export_morph=True,
    )


def build(hero):
    reset_scene()
    bpy.context.preferences.filepaths.save_version = 0
    groups = collections()
    mats = {key: material(f"MAT_{key}", value, 0.48 if key != "brass" else 0.28, 0.65 if key == "brass" else 0.0)
            for key, value in PALETTE.items()}
    if hero == "Hargold":
        dims = dict(height=3.42, head_center=2.48, head_top=3.00, hip=1.05, shoulder=1.92, chest_half=0.58, elbow=1.34, wrist=1.72, leg_x=0.32, knee=0.54, ankle=0.17)
    else:
        dims = dict(height=4.16, head_center=3.30, head_top=3.79, hip=1.50, shoulder=2.27, chest_half=0.36, elbow=0.86, wrist=1.18, leg_x=0.20, knee=0.72, ankle=0.19)
    add_locked_reference(hero, groups["REF"], dims["height"])
    arm = create_armature(hero, dims, groups["RIG"])
    if hero == "Hargold":
        hargold(arm, groups["GEO"], groups["ATTACHMENTS"], mats)
    else:
        mebble(arm, groups["GEO"], groups["ATTACHMENTS"], mats)
    collision = cylinder(f"COL_{hero}_proxy", (0, 0, dims["height"] / 2), dims["chest_half"] * 1.05,
                         dims["height"], mats["glass"], groups["COLLISION_PROXY"])
    collision.display_type = "WIRE"
    collision.hide_render = True
    collision["export_enabled"] = False
    add_core_actions(arm, hero)
    scene = bpy.context.scene
    if hero == "Mebble":
        arm.pose.bones["CTRL_cape.01"]["cape_open"] = 0.0
        scene.frame_set(2)
        scene.frame_set(1)
        bpy.context.view_layer.update()
    scene["assetVersion"] = "0.1.0"
    scene["canonVersion"] = "2026-07-25"
    scene["referenceHash"] = "4004C659783AC41ED09E6AF18D25F776DFB19BE44B9E7066289627E016A7B4E4" if hero == "Hargold" else "1A85C41AFC53061612B772F221A3F354E4E58C015F4753AFF2C3C44EC80662D0"
    scene["author"] = "Hargold & Mebble production pipeline"
    scene["blenderVersion"] = bpy.app.version_string
    scene["reviewStatus"] = "production-intent-visual-review-required"
    scene["lockedReference"] = str(REFERENCE_DIR / f"{hero} locked production character sheet.png")
    setup_render(hero, groups["GEO"])
    BLEND_DIR.mkdir(parents=True, exist_ok=True)
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    source = BLEND_DIR / f"{hero.lower()}_character.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(source), check_existing=False)
    export_glb(hero, arm)
    # The glTF exporter evaluates every action and can leave custom-property
    # drivers at the last sampled clip even when it restores the action name.
    arm.animation_data.action = bpy.data.actions["idle"]
    if hero == "Mebble":
        arm.pose.bones["CTRL_cape.01"]["cape_open"] = 0.0
    scene.frame_set(2)
    scene.frame_set(1)
    bpy.context.view_layer.update()
    scene.render.filepath = str(PREVIEW_DIR / f"{hero.lower()}_character_preview.png")
    scene.frame_set(1)
    bpy.ops.render.render(write_still=True)
    render_qa_views(hero)
    render_action_pose(hero, arm)
    print(f"HM_CHARACTER_BUILT {hero} {source}")


if __name__ == "__main__":
    for character in ("Hargold", "Mebble"):
        build(character)
