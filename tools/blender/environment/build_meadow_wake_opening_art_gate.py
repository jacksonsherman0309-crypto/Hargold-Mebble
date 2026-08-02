"""Author the independent Meadow Wake opening environment art gate.

This scene is deliberately separate from gameplay integration.  It builds a
locked-camera, production-style 2.75D environment study from original modeled
geometry.  Reference images are installed only as non-rendering image empties.
"""

from __future__ import annotations

import math
import random
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector


ROOT = Path(__file__).resolve().parents[3]
BLEND_PATH = ROOT / "assets/blender/environments/world-1/meadow-wake-opening-art-gate.blend"
TARGET_PATH = ROOT / "assets/references/terrain/meadow-wake-production-quality-target.jpeg"
CURRENT_PATH = ROOT / "assets/references/terrain/meadow-wake-current-deployment.png"
HARGOLD_PATH = ROOT / "assets/exports/meshy/hargold_canonical_gameplay_rig.glb"

COLLECTION_NAMES = (
    "00_REFERENCE",
    "01_GAMEPLAY_GUIDES",
    "02_CAMERA_GUIDES",
    "10_TERRAIN_HIGH",
    "11_TERRAIN_RENDER",
    "12_TERRAIN_COLLISION_FUTURE",
    "20_CAMP",
    "21_TREES",
    "22_ROOTS",
    "23_ROCKS",
    "24_TIMBER_AND_STRUCTURES",
    "30_FOLIAGE",
    "31_FLOWERS_AND_GROUND_COVER",
    "32_DECALS",
    "40_MIDGROUND",
    "41_BACKGROUND",
    "50_LIGHTING",
    "60_CHARACTERS_REFERENCE",
    "90_EXPORT_FUTURE",
    "99_DISABLED_ARCHIVE",
)

PROFILE = [
    (-7.25, 0.07), (-6.70, 0.10), (-6.05, 0.16), (-5.35, 0.13),
    (-4.70, 0.09), (-4.00, 0.03), (-3.35, -0.04), (-2.75, -0.14),
    (-2.10, -0.22), (-1.45, -0.20), (-0.80, -0.12), (-0.15, -0.03),
    (0.55, 0.03), (1.25, 0.06), (1.95, 0.02), (2.65, 0.00),
    (3.30, 0.08), (3.90, 0.18), (4.45, 0.31), (5.05, 0.42),
    (5.65, 0.45), (6.25, 0.40), (6.90, 0.49), (7.55, 0.58),
]

RNG = random.Random(140219)


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block_group in (
        bpy.data.collections, bpy.data.meshes, bpy.data.curves, bpy.data.materials,
        bpy.data.cameras, bpy.data.lights, bpy.data.images,
    ):
        for block in list(block_group):
            if getattr(block, "users", 0) == 0:
                block_group.remove(block)


def make_collections():
    collections = {}
    for name in COLLECTION_NAMES:
        collection = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(collection)
        collections[name] = collection
    for name in (
        "00_REFERENCE", "01_GAMEPLAY_GUIDES", "02_CAMERA_GUIDES",
        "12_TERRAIN_COLLISION_FUTURE", "90_EXPORT_FUTURE", "99_DISABLED_ARCHIVE",
    ):
        collections[name].hide_render = True
    return collections


def mesh_object(name, vertices, faces, collection, material=None, smooth=False):
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    if material:
        mesh.materials.append(material)
    if smooth:
        for polygon in mesh.polygons:
            polygon.use_smooth = True
    obj["art_gate_geometry"] = True
    return obj


def add_bevel(obj, width=0.03, segments=2):
    modifier = obj.modifiers.new("Authored edge softness", "BEVEL")
    modifier.width = width
    modifier.segments = segments
    modifier.limit_method = "ANGLE"
    return obj


def procedural_material(name, base, roughness=0.72, noise_scale=4.0,
                        noise_detail=4.0, color_shift=(0.08, 0.06, 0.03),
                        bump=0.16, metallic=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    tex = nodes.new("ShaderNodeTexNoise")
    tex.inputs["Scale"].default_value = noise_scale
    tex.inputs["Detail"].default_value = noise_detail
    tex.inputs["Roughness"].default_value = 0.68
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (
        max(base[0] - color_shift[0], 0), max(base[1] - color_shift[1], 0),
        max(base[2] - color_shift[2], 0), 1,
    )
    ramp.color_ramp.elements[1].color = (
        min(base[0] + color_shift[0], 1), min(base[1] + color_shift[1], 1),
        min(base[2] + color_shift[2], 1), 1,
    )
    bump_node = nodes.new("ShaderNodeBump")
    bump_node.inputs["Strength"].default_value = bump
    bump_node.inputs["Distance"].default_value = 0.12
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    links.new(tex.outputs["Fac"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(tex.outputs["Fac"], bump_node.inputs["Height"])
    links.new(bump_node.outputs["Normal"], bsdf.inputs["Normal"])
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    mat.diffuse_color = (*base, 1.0)
    return mat


def flat_material(name, color, roughness=0.75, metallic=0.0, emission=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*color, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission
    mat.diffuse_color = (*color, 1.0)
    return mat


def sky_gradient_material():
    mat = bpy.data.materials.new("MW Sky - vertical atmospheric gradient")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    coords = nodes.new("ShaderNodeTexCoord")
    separate = nodes.new("ShaderNodeSeparateXYZ")
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = .08
    ramp.color_ramp.elements[0].color = (.57, .80, .86, 1)
    ramp.color_ramp.elements[1].position = .88
    ramp.color_ramp.elements[1].color = (.055, .32, .62, 1)
    bsdf.inputs["Roughness"].default_value = 1.0
    bsdf.inputs["Emission Strength"].default_value = .08
    links.new(coords.outputs["Generated"], separate.inputs["Vector"])
    links.new(separate.outputs["Z"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(ramp.outputs["Color"], bsdf.inputs["Emission Color"])
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    mat.diffuse_color = (.24, .60, .82, 1)
    return mat


def make_materials():
    return {
        "grass": procedural_material("MW Grass - layered blade green", (0.19, 0.38, 0.075), .78, 7.0, 5.0, (.09, .11, .035), .22),
        "grass_light": procedural_material("MW Grass tips - sunlit", (0.34, 0.55, 0.12), .73, 10.0, 3.0, (.08, .10, .025), .14),
        "soil_dry": procedural_material("MW Soil - dry loam", (0.31, 0.16, 0.075), .88, 5.5, 7.0, (.11, .065, .03), .28),
        "soil_compact": procedural_material("MW Soil - compact layers", (0.22, 0.105, 0.045), .92, 14.0, 3.0, (.065, .035, .018), .36),
        "soil_damp": procedural_material("MW Soil - damp pockets", (0.105, 0.075, 0.038), .82, 8.0, 5.0, (.035, .026, .012), .24),
        "stone": procedural_material("MW Stone - warm fieldstone", (0.34, 0.32, 0.24), .83, 3.0, 6.0, (.15, .13, .09), .42),
        "stone_dark": procedural_material("MW Stone - shaded fracture", (0.16, 0.18, 0.14), .88, 5.0, 4.0, (.06, .06, .04), .38),
        "moss": procedural_material("MW Moss - embedded", (0.16, 0.31, 0.055), .91, 18.0, 4.0, (.07, .09, .025), .18),
        "bark": procedural_material("MW Bark - old oak", (0.22, 0.105, 0.035), .91, 3.2, 7.0, (.10, .055, .022), .45),
        "root": procedural_material("MW Root - rubbed oak", (0.28, 0.135, 0.045), .87, 4.5, 5.0, (.09, .05, .02), .36),
        "timber": procedural_material("MW Timber - weathered camp", (0.31, 0.16, 0.055), .82, 5.5, 5.0, (.12, .065, .025), .34),
        "timber_end": procedural_material("MW Timber endgrain", (0.41, 0.245, 0.095), .84, 12.0, 3.0, (.09, .055, .025), .24),
        "canvas": procedural_material("MW Canvas - explorer green", (0.12, 0.255, 0.105), .93, 45.0, 2.5, (.028, .045, .02), .13),
        "canvas_gold": flat_material("MW Canvas stitch", (0.65, 0.46, 0.16), .76),
        "metal": procedural_material("MW Metal - aged iron", (0.10, 0.105, 0.085), .47, 9.0, 4.0, (.045, .045, .035), .23, .67),
        "leaf_dark": procedural_material("MW Leaf - forest shadow", (0.055, 0.20, 0.045), .82, 8.0, 4.0, (.04, .09, .03), .10),
        "leaf_mid": procedural_material("MW Leaf - meadow green", (0.12, 0.34, 0.055), .78, 10.0, 3.0, (.06, .12, .025), .11),
        "leaf_light": procedural_material("MW Leaf - sun edge", (0.28, 0.49, 0.085), .76, 12.0, 3.0, (.07, .09, .025), .10),
        "flower_white": flat_material("MW Flower - warm white", (.94, .89, .66), .68),
        "flower_yellow": flat_material("MW Flower - buttercup", (1.0, .62, .08), .62),
        "flower_pink": flat_material("MW Flower - foxglove", (.75, .25, .39), .67),
        "water": flat_material("MW Water - distant veil", (.25, .63, .74), .28, 0.0, .12),
        "glass": flat_material("MW Lantern glass", (1.0, .55, .12), .21, 0.0, 2.2),
        "block": procedural_material("MW Breakable stone", (.42, .24, .105), .80, 4.0, 6.0, (.12, .075, .035), .45),
        "block_face": procedural_material("MW Camp cache wood", (.48, .27, .075), .74, 7.0, 4.0, (.12, .07, .025), .30),
        "gold": flat_material("MW Compass brass", (.95, .56, .08), .31, .72),
        "mountain_far": flat_material("MW Far mountain haze", (.43, .61, .60), .96),
        "mountain_mid": flat_material("MW Mid mountain", (.20, .42, .34), .95),
        "forest_far": flat_material("MW Far forest", (.09, .28, .18), .92),
        "sky": sky_gradient_material(),
        "cloud": flat_material("MW Cloud - sunlit vapor", (.91, .95, .91), .96, 0.0, .06),
        "cloud_shadow": flat_material("MW Cloud - cool underside", (.60, .76, .78), .98),
        "snow": flat_material("MW Alpine sun facets", (.78, .87, .83), .91),
        "mannequin_green": procedural_material("MW Scale mannequin - explorer green", (.105, .285, .09), .78, 7.0, 4.0, (.045, .075, .025), .16),
        "mannequin_skin": procedural_material("MW Scale mannequin - warm skin", (.77, .46, .29), .67, 8.0, 3.0, (.06, .045, .035), .10),
        "mannequin_brown": procedural_material("MW Scale mannequin - leather", (.22, .075, .028), .73, 7.0, 4.0, (.065, .03, .015), .20),
    }


def profile_height(x):
    for (x0, z0), (x1, z1) in zip(PROFILE, PROFILE[1:]):
        if x <= x1:
            t = (x - x0) / (x1 - x0)
            return z0 + (z1 - z0) * t
    return PROFILE[-1][1]


def build_landform(collections, mats):
    top = [(x, -0.12, z) for x, z in PROFILE]
    bottom = []
    for index, (x, z) in enumerate(PROFILE):
        depth = .72 + .12 * math.sin(index * 1.71) + .06 * math.sin(index * .53)
        bottom.append((x, -0.12, z - depth))
    vertices = top + bottom
    count = len(top)
    faces = [tuple(range(count)) + tuple(range(count * 2 - 1, count - 1, -1))]
    terrain = mesh_object("MW_Terrain_OpeningConnectedLandform", vertices, faces, collections["10_TERRAIN_HIGH"], mats["soil_dry"])
    terrain["art_stage"] = "blockout"
    terrain["surface_role"] = "render-only-authored-landform"
    add_bevel(terrain, .055, 3)

    # Shallow, varied turf volume creates a readable platforming edge without a ribbon look.
    turf_top = [(x, -0.155, z + .035 + .015 * math.sin(i * 1.8)) for i, (x, z) in enumerate(PROFILE)]
    turf_bottom = [(x + .018 * math.sin(i * 2.1), -0.165, z - (.12 + .035 * (1 + math.sin(i * 1.31)))) for i, (x, z) in enumerate(PROFILE)]
    turf = mesh_object(
        "MW_Terrain_TurfOverhang", turf_top + turf_bottom,
        [tuple(range(count)) + tuple(range(count * 2 - 1, count - 1, -1))],
        collections["11_TERRAIN_RENDER"], mats["grass"],
    )
    turf["art_stage"] = "blockout"
    add_bevel(turf, .035, 3)

    # Hand-set soil strata and damp pockets break the front face into geological layers.
    for index, (start, end, offset, mat) in enumerate((
        (-6.9, -4.4, -.27, mats["soil_compact"]),
        (-3.9, -1.1, -.43, mats["soil_damp"]),
        (-.6, 2.6, -.30, mats["soil_compact"]),
        (3.0, 5.8, -.42, mats["soil_damp"]),
        (5.7, 7.3, -.24, mats["soil_compact"]),
    )):
        samples = 12
        upper, lower = [], []
        for j in range(samples):
            x = start + (end - start) * j / (samples - 1)
            z = profile_height(x) + offset + .025 * math.sin(j * 1.8 + index)
            upper.append((x, -0.185, z))
            lower.append((x, -0.19, z - .07 - .018 * math.sin(j * 2.3)))
        stripe = mesh_object(
            f"MW_SoilStratum_{index+1:02}", upper + lower,
            [tuple(range(samples)) + tuple(range(samples * 2 - 1, samples - 1, -1))],
            collections["32_DECALS"], mat,
        )
        stripe["art_stage"] = "detail"


def irregular_rock(name, location, scale, collection, material, seed, moss=None):
    rng = random.Random(seed)
    rings, sides = 4, 9
    vertices = []
    for ring in range(rings):
        phi = -math.pi / 2 + math.pi * ring / (rings - 1)
        for side in range(sides):
            theta = math.tau * side / sides
            jitter = .84 + .22 * rng.random()
            vertices.append((
                math.cos(phi) * math.cos(theta) * scale[0] * jitter,
                math.cos(phi) * math.sin(theta) * scale[1] * jitter,
                math.sin(phi) * scale[2] * (.88 + .22 * rng.random()),
            ))
    faces = []
    for ring in range(rings - 1):
        for side in range(sides):
            nxt = (side + 1) % sides
            faces.append((ring * sides + side, ring * sides + nxt, (ring + 1) * sides + nxt, (ring + 1) * sides + side))
    rock = mesh_object(name, vertices, faces, collection, material, True)
    rock.location = location
    rock.rotation_euler = (rng.uniform(-.18, .18), rng.uniform(-.16, .16), rng.uniform(-.35, .35))
    rock["art_stage"] = "detail"
    add_bevel(rock, .025, 2)
    if moss:
        cap_scale = (scale[0] * .78, scale[1] * .72, scale[2] * .18)
        cap = irregular_rock(f"{name}_MossCap", (location[0], location[1] - .015, location[2] + scale[2] * .72), cap_scale, collection, moss, seed + 800)
        cap["art_stage"] = "detail"
    return rock


def build_rocks(collections, mats):
    specifications = [
        (-6.45, .13, (.32, .25, .24)), (-5.95, .18, (.21, .18, .16)),
        (-5.48, .14, (.27, .22, .20)), (-3.15, -.01, (.22, .18, .19)),
        (-2.72, -.10, (.18, .16, .15)), (-.25, .05, (.20, .16, .17)),
        (3.58, .23, (.24, .20, .19)), (4.22, .40, (.29, .23, .23)),
        (5.22, .60, (.24, .19, .18)), (6.85, .64, (.30, .23, .22)),
    ]
    for index, (x, z, scale) in enumerate(specifications):
        irregular_rock(
            f"MW_Fieldstone_{index+1:02}", (x, -.25 - .035 * (index % 3), z), scale,
            collections["23_ROCKS"], mats["stone" if index % 3 else "stone_dark"], 300 + index,
            mats["moss"] if index in (0, 4, 7, 9) else None,
        )
    # Small embedded stones on the cut face.
    for index in range(54):
        x = RNG.uniform(-6.9, 7.2)
        top = profile_height(x)
        z = top - RNG.uniform(.22, .67)
        s = RNG.uniform(.042, .105)
        irregular_rock(
            f"MW_EmbeddedPebble_{index+1:02}", (x, -.215, z), (s * 1.5, s * .45, s),
            collections["23_ROCKS"], mats["stone_dark" if index % 4 else "stone"], 900 + index,
        )
    for index,(x,z) in enumerate(((-6.15,-.20),(-5.15,-.32),(-3.55,-.28),(-2.05,-.45),(-.75,-.30),(1.05,-.24),(2.72,-.25),(4.15,-.17),(5.25,-.09),(6.45,-.02))):
        patch=irregular_rock(f"MW_FaceMossPatch_{index+1:02}",(x,-.235,z),(.19,.025,.075),collections["23_ROCKS"],mats["moss"],980+index)
        patch["art_stage"]="detail"


def timber_between(name, a, b, radius, collection, material, seed=0, stage="detail"):
    rng = random.Random(seed)
    start, end = Vector(a), Vector(b)
    direction = end - start
    length = direction.length
    tangent = direction.normalized()
    helper = Vector((0, 1, 0))
    if abs(tangent.dot(helper)) > .94:
        helper = Vector((1, 0, 0))
    u = tangent.cross(helper).normalized()
    v = tangent.cross(u).normalized()
    sides = 8
    vertices = []
    for ring, point in enumerate((start, end)):
        ring_radius = radius * (1.0 + rng.uniform(-.09, .09))
        for side in range(sides):
            angle = math.tau * side / sides
            uneven = 1.0 + .08 * math.sin(side * 2.7 + seed)
            vertices.append(tuple(point + u * math.cos(angle) * ring_radius * uneven + v * math.sin(angle) * ring_radius))
    faces = []
    for side in range(sides):
        nxt = (side + 1) % sides
        faces.append((side, nxt, sides + nxt, sides + side))
    faces.extend((tuple(reversed(range(sides))), tuple(range(sides, sides * 2))))
    obj = mesh_object(name, vertices, faces, collection, material, True)
    obj["art_stage"] = stage
    obj["authored_length_m"] = length
    add_bevel(obj, radius * .08, 2)
    return obj


def cloth_canopy(name, x0, x1, y0, y1, base_z, collection, material):
    u_steps, v_steps = 18, 10
    vertices = []
    for v_i in range(v_steps + 1):
        y = y0 + (y1 - y0) * v_i / v_steps
        depth_t = v_i / v_steps
        for u_i in range(u_steps + 1):
            x = x0 + (x1 - x0) * u_i / u_steps
            length_t = u_i / u_steps
            # A weathered ridge and stitched, slightly sagging canvas panels.
            length_arch = 1.0 - 2.0 * abs(length_t - .50)
            roof = .32 + .52 * length_arch - .48 * abs(depth_t - .48)
            sag = -.045 * math.sin(math.pi * length_t) - .020 * math.sin(math.pi * depth_t)
            ripple = .015 * math.sin(length_t * math.tau * 5.0 + depth_t * 1.4)
            vertices.append((x, y, base_z + roof + sag + ripple))
    faces = []
    row = u_steps + 1
    for v_i in range(v_steps):
        for u_i in range(u_steps):
            a = v_i * row + u_i
            faces.append((a, a + 1, a + row + 1, a + row))
    canopy = mesh_object(name, vertices, faces, collection, material, False)
    canopy["art_stage"] = "clay"
    solid = canopy.modifiers.new("Canvas hem thickness", "SOLIDIFY")
    solid.thickness = .018
    bevel = canopy.modifiers.new("Soft woven edge", "BEVEL")
    bevel.width = .012
    bevel.segments = 2
    return canopy


def build_camp(collections, mats):
    camp = collections["20_CAMP"]
    # Stone footings make the lodge grow from the terrain rather than hover over it.
    for index, x in enumerate((-6.55, -5.92, -5.25, -4.58, -3.92)):
        irregular_rock(f"MW_CampFooting_{index+1:02}", (x, .18, profile_height(x) + .17), (.24, .27, .20), camp, mats["stone"], 1100 + index, mats["moss"] if index % 2 == 0 else None)

    # Irregular structural frame and braces.
    timber_specs = [
        ((-6.55, .25, .20), (-6.55, .25, 2.80), .105),
        ((-3.90, .25, .16), (-3.90, .25, 2.78), .105),
        ((-6.66, .25, 2.70), (-3.79, .25, 2.70), .115),
        ((-6.47, .25, .35), (-3.98, .25, .35), .13),
        ((-6.46, .25, .48), (-5.15, .25, 1.35), .075),
        ((-4.00, .25, .48), (-5.22, .25, 1.36), .075),
        ((-6.55, -.52, .28), (-6.55, .68, .28), .09),
        ((-3.90, -.52, .28), (-3.90, .68, .28), .09),
        ((-6.44, -.43, 2.47), (-3.98, -.43, 2.47), .085),
    ]
    for index, (a, b, r) in enumerate(timber_specs):
        timber_between(f"MW_CampTimber_{index+1:02}", a, b, r, camp, mats["timber"], 1200 + index, "clay")

    cloth_canopy("MW_CampCanopy_Main", -6.72, -3.72, -.62, .78, 2.31, camp, mats["canvas"])
    # Draped back curtain adds interior depth but leaves an inviting dark doorway.
    verts = [(-6.35, .58, .43), (-4.10, .58, .43), (-4.10, .58, 2.42), (-5.22, .58, 2.54), (-6.35, .58, 2.42)]
    curtain = mesh_object("MW_CampCanvas_BackWall", verts, [(0, 1, 2, 3, 4)], camp, mats["canvas"])
    curtain["art_stage"] = "clay"
    add_bevel(curtain, .018, 2)
    doorway = [(-5.73, .565, .42), (-4.77, .565, .42), (-4.77, .565, 1.94), (-5.25, .565, 2.16), (-5.73, .565, 1.94)]
    door_mat = flat_material("MW Camp interior depth", (.025, .038, .022), .98)
    door = mesh_object("MW_CampDoorway_Depth", doorway, [(0, 1, 2, 3, 4)], camp, door_mat)
    door["art_stage"] = "clay"

    # Platform and hand-built entry steps.
    for index, (x0, x1, z) in enumerate(((-6.62, -3.82, .43), (-4.18, -3.55, .24), (-3.98, -3.48, .10))):
        timber_between(f"MW_CampFloorEdge_{index+1:02}", (x0, -.53, z), (x1, -.53, z), .115 if index == 0 else .085, camp, mats["timber"], 1300 + index, "clay")
    for index in range(10):
        x = -6.45 + index * .27
        timber_between(f"MW_CampFloorSlat_{index+1:02}", (x, -.48, .44), (x, .52, .44), .085, camp, mats["timber_end"], 1350 + index)

    # Banner, stitched emblem, ropes, pegs, crates and two warm lanterns.
    banner = mesh_object(
        "MW_CampBanner", [(-5.55, -.67, 1.04), (-4.70, -.67, 1.04), (-4.64, -.67, 2.28), (-5.60, -.67, 2.28)],
        [(0, 1, 2, 3)], camp, mats["canvas"],
    )
    banner["art_stage"] = "detail"
    add_bevel(banner, .018, 2)
    # Original compass/tree emblem: trunk and three triangular boughs.
    timber_between("MW_BannerEmblem_Trunk", (-5.12, -.69, 1.35), (-5.12, -.69, 2.00), .022, camp, mats["canvas_gold"], 1401)
    for level, width in ((1.52, .23), (1.70, .18), (1.87, .12)):
        emblem = mesh_object(
            f"MW_BannerEmblem_Bough_{int(level*100)}",
            [(-5.12, -.70, level + .17), (-5.12 - width, -.70, level), (-5.12 + width, -.70, level)],
            [(0, 1, 2)], camp, mats["canvas_gold"],
        )
        emblem["art_stage"] = "detail"

    for side, x in enumerate((-6.38, -4.05)):
        timber_between(f"MW_CampRope_{side+1}", (x, -.65, 2.52), (x + (-.30 if side == 0 else .30), -.82, .16), .018, camp, mats["canvas_gold"], 1450 + side)
        build_lantern(f"MW_CampLantern_{side+1}", (x, -.70, 1.50), camp, mats)

    for c_index, x in enumerate((-6.18, -3.72)):
        make_crate(f"MW_CampSupplyCrate_{c_index+1}", (x, -.62, .27), .36, camp, mats)

    # Small trail sign and split-log bench make the opening read as a lived-in waystation.
    timber_between("MW_CampTrailSign_Post",(-3.54,-.48,.02),(-3.54,-.48,1.12),.075,camp,mats["timber"],1481)
    sign=mesh_object("MW_CampTrailSign_Board",[(-3.90,-.56,.72),(-3.18,-.56,.72),(-3.14,-.56,1.05),(-3.88,-.56,1.08)],[(0,1,2,3)],camp,mats["timber_end"])
    sign["art_stage"]="detail"
    add_bevel(sign,.035,3)
    for ray in range(4):
        a=math.tau*ray/4
        timber_between(f"MW_CampTrailSign_Mark_{ray}",(-3.54+math.cos(a)*.035,-.59,.90+math.sin(a)*.035),(-3.54+math.cos(a)*.14,-.59,.90+math.sin(a)*.11),.014,camp,mats["canvas_gold"],1490+ray)
    timber_between("MW_CampBench_Seat",(-5.25,-.82,.63),(-4.22,-.82,.63),.12,camp,mats["timber"],1498)
    timber_between("MW_CampBench_LegA",(-5.08,-.80,.18),(-5.08,-.80,.58),.06,camp,mats["timber"],1499)
    timber_between("MW_CampBench_LegB",(-4.38,-.80,.18),(-4.38,-.80,.58),.06,camp,mats["timber"],1500)


def make_crate(name, location, size, collection, mats):
    x, y, z = location
    # Six tapered boards, not a monolithic cube.
    for index, dz in enumerate((-.20, 0.0, .20)):
        timber_between(f"{name}_FrontBoard_{index+1}", (x-size, y-.16, z+dz), (x+size, y-.16, z+dz+.012), .095, collection, mats["timber"], 1500 + index)
    for index, dx in enumerate((-.31, .31)):
        timber_between(f"{name}_Brace_{index+1}", (x+dx, y-.19, z-.31), (x+dx, y-.19, z+.31), .055, collection, mats["timber_end"], 1510 + index)


def build_lantern(name, location, collection, mats):
    x, y, z = location
    timber_between(f"{name}_Top", (x-.13, y, z+.18), (x+.13, y, z+.18), .022, collection, mats["metal"], 1601)
    timber_between(f"{name}_Bottom", (x-.13, y, z-.18), (x+.13, y, z-.18), .022, collection, mats["metal"], 1602)
    for dx in (-.12, .12):
        timber_between(f"{name}_Frame_{dx}", (x+dx, y, z-.17), (x+dx, y, z+.17), .018, collection, mats["metal"], 1603 + int((dx+.2)*100))
    verts = [(x-.09, y+.01, z-.13), (x+.09, y+.01, z-.13), (x+.09, y+.01, z+.13), (x-.09, y+.01, z+.13)]
    glass = mesh_object(f"{name}_GlowPane", verts, [(0,1,2,3)], collection, mats["glass"])
    glass["art_stage"] = "detail"
    light_data = bpy.data.lights.new(f"{name}_Light", "POINT")
    light_data.energy = 22
    light_data.color = (1.0, .42, .10)
    light_data.shadow_soft_size = .35
    light = bpy.data.objects.new(f"{name}_Light", light_data)
    collection.objects.link(light)
    light.location = (x, y-.12, z)
    light["art_stage"] = "lighting"


def tube_curve(name, points, radii, collection, material, bevel=.08, resolution=2, stage="detail"):
    curve = bpy.data.curves.new(f"{name}_Curve", "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = resolution
    curve.bevel_depth = bevel
    curve.bevel_resolution = 3
    spline = curve.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for point, co, radius in zip(spline.bezier_points, points, radii):
        point.co = co
        point.radius = radius
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve)
    collection.objects.link(obj)
    curve.materials.append(material)
    obj["art_stage"] = stage
    obj["art_gate_geometry"] = True
    return obj


def build_leaf_cluster(name, center, radius, count, collection, materials, seed, stage="detail"):
    rng = random.Random(seed)
    vertices, faces = [], []
    for index in range(count):
        angle = rng.random() * math.tau
        distance = radius * math.sqrt(rng.random())
        loc = Vector((
            center[0] + math.cos(angle) * distance,
            center[1] + rng.uniform(-.30, .30) * radius,
            center[2] + math.sin(angle) * distance * .68,
        ))
        size = rng.uniform(.075, .145) * (1.0 + radius * .08)
        tilt = rng.uniform(-.75, .75)
        # Every leaf is a shallow folded lanceolate mesh with a readable highlight ridge.
        local = [
            (-size, 0, 0), (-size*.28, -.012, size*.32), (size, 0, 0),
            (-size*.28, .012, -size*.32), (0, -.025, 0),
        ]
        transform = Matrix.Rotation(tilt, 4, "Y") @ Matrix.Rotation(angle*.35, 4, "Z")
        base = len(vertices)
        vertices.extend([tuple(loc + transform @ Vector(p)) for p in local])
        faces.extend(((base, base+1, base+4), (base+1, base+2, base+4), (base+2, base+3, base+4), (base+3, base, base+4)))
    obj = mesh_object(name, vertices, faces, collection, materials[seed % len(materials)], True)
    obj["art_stage"] = stage
    return obj


def loft_trunk(name, centers, radii, collection, material, seed=1):
    rng = random.Random(seed)
    sides = 11
    vertices = []
    for ring_index, (center, radius) in enumerate(zip(centers, radii)):
        for side in range(sides):
            angle = math.tau * side / sides
            uneven = 1.0 + .10 * math.sin(side * 3.1 + ring_index * 1.7) + rng.uniform(-.035, .035)
            vertices.append((center[0] + math.cos(angle)*radius*uneven, center[1] + math.sin(angle)*radius*.68*uneven, center[2]))
    faces = []
    for ring in range(len(centers)-1):
        for side in range(sides):
            nxt = (side+1)%sides
            faces.append((ring*sides+side, ring*sides+nxt, (ring+1)*sides+nxt, (ring+1)*sides+side))
    faces.extend((tuple(reversed(range(sides))), tuple(range((len(centers)-1)*sides, len(centers)*sides))))
    obj = mesh_object(name, vertices, faces, collection, material, True)
    obj["art_stage"] = "clay"
    add_bevel(obj, .025, 2)
    return obj


def build_primary_tree(collections, mats):
    trees, roots = collections["21_TREES"], collections["22_ROOTS"]
    x = 5.93
    ground = profile_height(x)
    centers = [
        (x, .18, ground-.02), (x-.14, .17, ground+.72), (x-.10, .18, ground+1.50),
        (x+.04, .19, ground+2.25), (x+.13, .20, ground+3.02), (x+.05, .22, ground+3.70),
    ]
    loft_trunk("MW_HeroOak_Trunk", centers, (.48,.43,.36,.30,.22,.13), trees, mats["bark"], 1700)

    branches = [
        ([(x-.05,.18,ground+2.10),(x-.75,.18,ground+2.62),(x-1.25,.20,ground+2.80)], (1.0,.72,.28), .16),
        ([(x+.05,.18,ground+2.45),(x+.72,.20,ground+2.90),(x+1.22,.20,ground+3.05)], (1.0,.65,.25), .15),
        ([(x+.10,.20,ground+2.95),(x-.25,.22,ground+3.46),(x-.70,.24,ground+3.76)], (1.0,.68,.24), .13),
        ([(x+.04,.20,ground+3.25),(x+.45,.22,ground+3.75),(x+.83,.24,ground+4.03)], (1.0,.60,.18), .11),
    ]
    for index, (points, radii, bevel) in enumerate(branches):
        tube_curve(f"MW_HeroOak_Branch_{index+1:02}", points, radii, trees, mats["bark"], bevel, 3, "clay")

    root_paths = [
        ([(x,.04,ground+.10),(x-.52,-.12,ground-.02),(x-1.14,-.20,ground-.18),(x-1.72,-.21,ground-.14)], (1.3,1.0,.55,.12), .13),
        ([(x+.05,.02,ground+.09),(x+.58,-.10,ground+.02),(x+1.10,-.18,ground+.05)], (1.25,.75,.14), .14),
        ([(x-.05,.18,ground+.08),(x-.18,-.35,ground-.25),(x-.58,-.28,ground-.52)], (1.15,.62,.10), .12),
        ([(x+.10,.20,ground+.12),(x+.31,-.31,ground-.22),(x+.72,-.24,ground-.41)], (1.0,.52,.10), .11),
    ]
    for index, (points, radii, bevel) in enumerate(root_paths):
        tube_curve(f"MW_HeroOak_Root_{index+1:02}", points, radii, roots, mats["root"], bevel, 3)

    clusters = [
        ((x-1.05,-.02,ground+3.45), .98, 360), ((x-.35,.02,ground+4.03), 1.08, 430),
        ((x+.55,.04,ground+3.92), 1.10, 440), ((x+1.12,.08,ground+3.38), .91, 330),
        ((x-.05,-.08,ground+3.28), .90, 310),
    ]
    leaf_mats = (mats["leaf_dark"], mats["leaf_mid"], mats["leaf_light"])
    for index, (center, radius, count) in enumerate(clusters):
        build_leaf_cluster(f"MW_HeroOak_LeafMass_{index+1:02}", center, radius, count, trees, leaf_mats, 1800 + index)


def grass_patch(name, x0, x1, y, collection, mats, seed, count=80, height_scale=1.0):
    rng = random.Random(seed)
    vertices, faces = [], []
    for index in range(count):
        x = rng.uniform(x0, x1)
        z = profile_height(x) + .06
        blade_h = rng.uniform(.09, .25) * height_scale
        blade_w = rng.uniform(.012, .027)
        bend = rng.uniform(-.07, .07)
        base = len(vertices)
        vertices.extend(((x-blade_w,y,z),(x+blade_w,y,z),(x+blade_w*.38+ bend*.45,y-rng.uniform(0,.025),z+blade_h*.55),(x+bend,y-rng.uniform(0,.04),z+blade_h)))
        faces.extend(((base,base+1,base+2),(base,base+2,base+3)))
    obj = mesh_object(name, vertices, faces, collection, mats["grass_light" if seed % 2 else "grass"], False)
    obj["art_stage"] = "detail"
    return obj


def flower_patch(name, centers, collection, petal_mat, mats):
    vertices, faces = [], []
    for flower_index, (x,y,z,scale) in enumerate(centers):
        stem_base = len(vertices)
        vertices.extend(((x-.008,y,z),(x+.008,y,z),(x+.006,y,z+.12*scale),(x-.006,y,z+.12*scale)))
        faces.append((stem_base,stem_base+1,stem_base+2,stem_base+3))
        for petal in range(5):
            angle = math.tau*petal/5
            cx, cz = x + math.cos(angle)*.035*scale, z+.12*scale+math.sin(angle)*.035*scale
            base=len(vertices)
            vertices.extend(((x,y-.006,z+.12*scale),(cx+math.cos(angle)*.025*scale,y-.008,cz+math.sin(angle)*.025*scale),(cx-math.sin(angle)*.016*scale,y-.008,cz+math.cos(angle)*.016*scale)))
            faces.append((base,base+1,base+2))
    obj=mesh_object(name,vertices,faces,collection,petal_mat,False)
    obj["art_stage"]="detail"
    return obj


def build_foliage(collections, mats):
    foliage = collections["30_FOLIAGE"]
    for index, (a,b,count) in enumerate(((-7.1,-6.2,85),(-5.7,-4.5,90),(-3.4,-2.2,65),(-1.25,-.15,58),(.35,1.25,55),(2.55,3.55,62),(4.05,5.05,80),(6.45,7.35,82))):
        grass_patch(f"MW_GrassCluster_{index+1:02}", a,b,-.46,foliage,mats,2000+index,count,1.0 if index%2 else 1.18)
    # Ferns and broad leaves: layered lanceolate clusters.
    leaf_mats=(mats["leaf_dark"],mats["leaf_mid"],mats["leaf_light"])
    for index,(x,z,r) in enumerate(((-6.8,.16,.30),(-4.35,.10,.24),(-2.52,-.08,.20),(.72,.10,.20),(3.95,.30,.23),(5.12,.53,.25),(6.72,.57,.29))):
        build_leaf_cluster(f"MW_GroundFern_{index+1:02}",(x,-.46,z+.13),r,28,foliage,leaf_mats,2100+index)
    centers=[]
    for i,x in enumerate((-6.25,-5.78,-4.48,-3.05,-2.62,-.92,-.28,.62,1.02,3.72,4.12,4.62,6.48,7.04)):
        centers.append((x,-.51,profile_height(x)+.04,RNG.uniform(.75,1.25)))
    flower_patch("MW_Wildflowers_White",centers[::3],collections["31_FLOWERS_AND_GROUND_COVER"],mats["flower_white"],mats)
    flower_patch("MW_Wildflowers_Gold",centers[1::3],collections["31_FLOWERS_AND_GROUND_COVER"],mats["flower_yellow"],mats)
    flower_patch("MW_Wildflowers_Pink",centers[2::3],collections["31_FLOWERS_AND_GROUND_COVER"],mats["flower_pink"],mats)
    # Near-camera foliage frames the play layer and supplies controlled depth blur silhouettes.
    leaf_mats=(mats["leaf_dark"],mats["leaf_mid"])
    build_leaf_cluster("MW_Foreground_Bramble_Left",(-6.65,-1.12,-1.02),1.05,310,foliage,leaf_mats,2190)
    build_leaf_cluster("MW_Foreground_Bramble_Right",(6.85,-1.12,-1.00),1.00,295,foliage,leaf_mats,2191)


def build_ground_story(collections, mats):
    roots=collections["22_ROOTS"]
    paths=(
        ([(-6.4,-.225,-.10),(-6.0,-.23,-.28),(-5.55,-.23,-.40)],(.55,.34,.08),.025),
        ([(-4.7,-.225,-.02),(-4.3,-.23,-.26),(-3.88,-.23,-.48)],(.50,.30,.07),.022),
        ([(-2.6,-.225,-.20),(-2.2,-.23,-.43),(-1.76,-.23,-.58)],(.48,.27,.06),.020),
        ([(3.65,-.225,.14),(3.30,-.23,-.18),(2.95,-.23,-.39)],(.45,.25,.06),.021),
    )
    for index,(points,radii,bevel) in enumerate(paths):
        tube_curve(f"MW_ExposedRootVein_{index+1:02}",points,radii,roots,mats["root"],bevel,2,"detail")


def make_authored_block(name, location, material, collections, mats, cache=False):
    x,y,z=location
    s=.36
    # Bevelled chamfer block, with layered inset face and physical corner studs.
    verts=[(-s,-s*.58,-s),(s,-s*.58,-s),(s,-s*.58,s),(-s,-s*.58,s),(-s*.88,s*.58,-s*.88),(s*.88,s*.58,-s*.88),(s*.88,s*.58,s*.88),(-s*.88,s*.58,s*.88)]
    faces=[(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)]
    obj=mesh_object(name,verts,faces,collections["24_TIMBER_AND_STRUCTURES"],material,False)
    obj.location=location
    obj["art_stage"]="clay"
    obj["interactive_visual_language"]="breakable" if not cache else "cache-block"
    add_bevel(obj,.055,4)
    inset=mesh_object(f"{name}_Inset",[(-.25,-.39,-.25),(.25,-.39,-.25),(.25,-.39,.25),(-.25,-.39,.25)],[(0,1,2,3)],collections["24_TIMBER_AND_STRUCTURES"],mats["block_face" if cache else "stone_dark"])
    inset.location=location
    inset["art_stage"]="detail"
    # Original compass/starburst sign, not a protected question mark.
    if cache:
        for ray in range(8):
            a=math.tau*ray/8
            timber_between(f"{name}_CompassRay_{ray}",(x+math.cos(a)*.05,y-.415,z+math.sin(a)*.05),(x+math.cos(a)*.18,y-.415,z+math.sin(a)*.18),.018,collections["24_TIMBER_AND_STRUCTURES"],mats["gold"],2300+ray)
    else:
        for crack_i,(a,b) in enumerate((((-.13,-.04),(.02,.10)),((.02,.10),(.15,.02)),((.02,.10),(-.02,.23)))):
            timber_between(f"{name}_Crack_{crack_i}",(x+a[0],y-.42,z+a[1]),(x+b[0],y-.42,z+b[1]),.012,collections["24_TIMBER_AND_STRUCTURES"],mats["stone_dark"],2350+crack_i)
    return obj


def build_block_phrase(collections,mats):
    for index,(x,z,cache) in enumerate(((-.05,1.52,False),(.76,1.52,True),(1.57,1.52,False),(2.38,2.20,True))):
        make_authored_block(f"MW_OpeningBlock_{index+1:02}",(x,-.44,z),mats["block_face" if cache else "block"],collections,mats,cache)
    # Break fragments communicate interaction without implying active simulation.
    for index in range(7):
        angle=index*.82
        irregular_rock(f"MW_BlockFragment_{index+1:02}",(2.82+math.cos(angle)*(.18+index*.025),-.47,1.48+math.sin(angle)*.28+index*.035),(.045,.025,.055),collections["24_TIMBER_AND_STRUCTURES"],mats["block"],2400+index)
    for index,(x,z) in enumerate(((-.02,2.35),(.76,2.54),(1.54,2.36))):
        make_compass_coin(f"MW_CompassGuide_{index+1:02}",(x,-.50,z),collections["24_TIMBER_AND_STRUCTURES"],mats)


def make_compass_coin(name, location, collection, mats):
    x,y,z=location
    sides=24
    outer=.18
    inner=.13
    depth=.025
    vertices=[]
    for yy in (y-depth,y+depth):
        for radius in (outer,inner):
            for i in range(sides):
                a=math.tau*i/sides
                vertices.append((x+math.cos(a)*radius,yy,z+math.sin(a)*radius))
    faces=[]
    for i in range(sides):
        n=(i+1)%sides
        faces.append((i,n,sides+n,sides+i))
        faces.append((2*sides+i,3*sides+i,3*sides+n,2*sides+n))
        faces.append((i,2*sides+i,2*sides+n,n))
        faces.append((sides+i,sides+n,3*sides+n,3*sides+i))
    coin=mesh_object(name,vertices,faces,collection,mats["gold"],True)
    coin["art_stage"]="detail"
    coin["review_only_collectible_guide"] = True
    add_bevel(coin,.009,2)
    for ray in range(8):
        a=math.tau*ray/8
        timber_between(f"{name}_Ray_{ray}",(x+math.cos(a)*.025,y-.033,z+math.sin(a)*.025),(x+math.cos(a)*.105,y-.033,z+math.sin(a)*.105),.009,collection,mats["gold"],2440+ray)


def mountain_profile(name, y, base_z, peaks, collection, material):
    vertices=[(x,y,z) for x,z in peaks]+[(peaks[-1][0],y,base_z),(peaks[0][0],y,base_z)]
    obj=mesh_object(name,vertices,[tuple(range(len(vertices)))],collection,material)
    obj["art_stage"]="blockout"
    return obj


def build_depth_layers(collections,mats):
    bg=collections["41_BACKGROUND"]
    mid=collections["40_MIDGROUND"]
    sky=mesh_object("MW_Background_SkyGradient",[(-10,8.1,-2),(10,8.1,-2),(10,8.1,6.3),(-10,8.1,6.3)],[(0,1,2,3)],bg,mats["sky"])
    sky["art_stage"]="blockout"
    mountain_profile("MW_Background_FarRange",6.6,-2.0,[(-9,1.35),(-8.1,1.72),(-7.1,2.18),(-6.6,2.02),(-5.9,2.68),(-5.35,3.34),(-4.92,2.92),(-4.42,2.55),(-3.65,3.08),(-3.05,4.02),(-2.58,3.48),(-1.72,2.86),(-.95,3.46),(-.20,4.18),(.35,3.66),(1.10,3.05),(1.75,3.72),(2.32,3.30),(3.25,4.08),(3.82,3.54),(4.72,2.88),(5.52,3.34),(6.25,3.64),(6.82,3.12),(7.65,2.55),(9,1.95)],bg,mats["mountain_far"])
    mountain_profile("MW_Background_MidCliffs",5.3,-2.0,[(-8,1.00),(-7.35,1.34),(-6.80,1.65),(-6.12,1.38),(-5.45,1.62),(-4.75,2.05),(-4.12,2.30),(-3.55,1.84),(-2.85,1.48),(-2.08,1.90),(-1.42,2.38),(-.84,2.08),(-.08,1.68),(.68,1.95),(1.42,2.62),(2.00,2.31),(2.72,1.78),(3.38,1.93),(4.12,2.34),(4.86,2.16),(5.62,1.58),(6.42,1.83),(7.16,2.08),(8,1.90)],bg,mats["mountain_mid"])
    # Sun-catching alpine facets add modeled plane changes without copying the target skyline.
    for index,verts in enumerate((
        ((-5.90,6.54,2.68),(-5.35,6.54,3.34),(-4.92,6.54,2.92),(-5.34,6.54,3.05)),
        ((-3.65,6.54,3.08),(-3.05,6.54,4.02),(-2.58,6.54,3.48),(-3.04,6.54,3.70)),
        ((-.95,6.54,3.46),(-.20,6.54,4.18),(.35,6.54,3.66),(-.18,6.54,3.88)),
        ((2.32,6.54,3.30),(3.25,6.54,4.08),(3.82,6.54,3.54),(3.22,6.54,3.78)),
    )):
        facet=mesh_object(f"MW_AlpineFacet_{index+1:02}",verts,[(0,1,2,3)],bg,mats["snow"])
        facet["art_stage"]="detail"
    # Irregular modeled cloud banks sit behind the mountains.
    cloud_specs=((-5.9,4.62,1.2),(-4.8,4.85,.92),(-1.1,4.70,1.05),(.15,4.95,.82),(4.55,4.62,1.18),(5.75,4.86,.88))
    for index,(x,z,s) in enumerate(cloud_specs):
        cloud=irregular_rock(f"MW_CloudBank_{index+1:02}",(x,7.25,z),(s,.18,s*.32),bg,mats["cloud" if index%2 else "cloud_shadow"],2700+index)
        subdivision=cloud.modifiers.new("Soft vapor subdivision","SUBSURF")
        subdivision.subdivision_type="CATMULL_CLARK"
        subdivision.levels=2
        subdivision.render_levels=2
    # Waterfall and receiving stream sit between cliff profiles and gameplay.
    waterfall=mesh_object("MW_Background_Waterfall",[(3.02,4.75,.45),(3.52,4.75,.45),(3.68,4.75,2.63),(2.93,4.75,2.63)],[(0,1,2,3)],bg,mats["water"])
    waterfall["art_stage"]="detail"
    for index in range(28):
        x=-7.4+index*.70+RNG.uniform(-.10,.10)
        if -.50 < x < 3.05:
            continue
        z=.52+RNG.uniform(-.04,.12)
        # Midground tree silhouettes use tapered trunks plus leaf clusters, not blobs.
        timber_between(f"MW_MidTreeTrunk_{index+1:02}",(x,3.3,z-.22),(x+RNG.uniform(-.06,.06),3.3,z+.36),.035,mid,mats["bark"],2500+index)
        build_leaf_cluster(f"MW_MidTreeCrown_{index+1:02}",(x,3.3,z+.46),.46,RNG.randint(74,110),mid,(mats["forest_far"],),2600+index,"blockout")


def import_hargold(collections):
    if not HARGOLD_PATH.exists():
        return None
    before=set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(HARGOLD_PATH))
    imported=list(set(bpy.data.objects)-before)
    if not imported:
        return None
    root=bpy.data.objects.new("MW_Hargold_ScaleReference",None)
    collections["60_CHARACTERS_REFERENCE"].objects.link(root)
    top_level=[]
    for obj in imported:
        for owner in list(obj.users_collection):
            owner.objects.unlink(obj)
        collections["60_CHARACTERS_REFERENCE"].objects.link(obj)
        if obj.parent is None:
            top_level.append(obj)
            obj.parent=root
    bpy.context.view_layer.update()
    corners=[]
    for obj in imported:
        if obj.type=="MESH":
            corners.extend([obj.matrix_world @ Vector(corner) for corner in obj.bound_box])
    if corners:
        height=max(v.z for v in corners)-min(v.z for v in corners)
        if height>0:
            root.scale=(1.82/height,)*3
    root.location=(-1.58,-.52,profile_height(-1.58)+.035)
    root.rotation_euler[2]=math.radians(-90)
    root["reference_only"] = True
    root["source_asset"] = str(HARGOLD_PATH.relative_to(ROOT)).replace("\\","/")
    root["source_rig_modified"] = False
    root["canonical_height_m"] = 1.82
    root["art_stage"]="clay"
    return root


def build_hargold_scale_mannequin(collections, mats):
    """Build a neutral scale stand-in while the production hero rig is active WIP.

    This is intentionally environment-review-only and does not alter, append, or
    claim to replace any production character source.
    """
    collection = collections["60_CHARACTERS_REFERENCE"]
    x = -1.58
    ground = profile_height(x)
    root = bpy.data.objects.new("MW_Hargold_EnvironmentScaleMannequin", None)
    collection.objects.link(root)
    root["reference_only"] = True
    root["reason"] = "production rig is active WIP; environment scope forbids hero changes"
    root["canonical_height_m"] = 1.82
    root["production_character_asset_modified"] = False
    root["art_stage"] = "clay"
    # Boots and slightly bent grounded legs.
    for side, dx in enumerate((-.20, .20)):
        tube_curve(f"MW_Mannequin_Leg_{side}", [(x+dx,-.50,ground+.16),(x+dx*.85,-.50,ground+.48),(x+dx*.70,-.50,ground+.68)], (1.0,.92,.82), collection, mats["mannequin_brown"], .105, 2, "clay")
        timber_between(f"MW_Mannequin_Boot_{side}",(x+dx-.13,-.57,ground+.10),(x+dx+.18,-.57,ground+.10),.105,collection,mats["mannequin_brown"],2800+side,"clay")
    # Rounded, stocky torso and head are deliberately simple but correctly scaled.
    torso = irregular_rock("MW_Mannequin_Torso",(x,-.48,ground+1.00),(.48,.32,.58),collection,mats["mannequin_green"],2810)
    torso["art_stage"]="clay"
    head = irregular_rock("MW_Mannequin_Head",(x+.02,-.49,ground+1.50),(.31,.25,.31),collection,mats["mannequin_skin"],2811)
    head["art_stage"]="clay"
    # Side-readable explorer hat, beard, belt, and forward hand establish the scale silhouette.
    brim_vertices=[]
    sides=18
    for i in range(sides):
        a=math.tau*i/sides
        brim_vertices.append((x+math.cos(a)*.52,-.51+math.sin(a)*.18,ground+1.73))
    brim=mesh_object("MW_Mannequin_HatBrim",brim_vertices,[tuple(range(sides))],collection,mats["mannequin_green"])
    brim["art_stage"]="clay"
    add_bevel(brim,.025,2)
    crown = irregular_rock("MW_Mannequin_HatCrown",(x-.05,-.46,ground+1.79),(.30,.22,.19),collection,mats["mannequin_green"],2812)
    crown["art_stage"]="clay"
    beard = irregular_rock("MW_Mannequin_Beard",(x+.14,-.72,ground+1.38),(.23,.08,.22),collection,mats["mannequin_brown"],2813)
    beard["art_stage"]="detail"
    timber_between("MW_Mannequin_Belt",(x-.36,-.73,ground+.92),(x+.36,-.73,ground+.92),.045,collection,mats["mannequin_brown"],2814,"detail")
    tube_curve("MW_Mannequin_ForwardArm",[(x+.30,-.50,ground+1.20),(x+.55,-.55,ground+1.08),(x+.68,-.58,ground+1.18)],(1.0,.82,.72),collection,mats["mannequin_green"],.09,2,"clay")
    irregular_rock("MW_Mannequin_Hand",(x+.68,-.59,ground+1.18),(.11,.09,.11),collection,mats["mannequin_skin"],2815)
    return root


def install_reference_empty(name,path,location,collection):
    image=bpy.data.images.load(str(path),check_existing=True)
    obj=bpy.data.objects.new(name,None)
    collection.objects.link(obj)
    obj.empty_display_type="IMAGE"
    obj.data=image
    obj.location=location
    obj.empty_display_size=7.0
    obj.hide_render=True
    obj.hide_viewport=True
    obj["non_rendering_reference"]=True
    obj["reference_role"]="quality-target" if "Target" in name else "current-gameplay"
    obj["filepath"]=str(path.relative_to(ROOT)).replace("\\","/")
    return obj


def build_guides_and_references(collections):
    install_reference_empty("MW_REF_QualityTarget",TARGET_PATH,(0,5,2.0),collections["00_REFERENCE"])
    install_reference_empty("MW_REF_CurrentGameplay",CURRENT_PATH,(0,5,2.0),collections["00_REFERENCE"])
    guide=bpy.data.objects.new("MW_GUIDE_StrictGameplayPlane",None)
    collections["01_GAMEPLAY_GUIDES"].objects.link(guide)
    guide.empty_display_type="ARROWS"
    guide.empty_display_size=1.0
    guide.hide_render=True
    guide.hide_viewport=True
    guide["movement_plane_y_m"]=0.0
    guide["depth_lane_movement_allowed"]=False
    for name in ("12_TERRAIN_COLLISION_FUTURE","90_EXPORT_FUTURE"):
        marker=bpy.data.objects.new(f"MW_{name}_EMPTY",None)
        collections[name].objects.link(marker)
        marker.hide_render=True
        marker["status"]="intentionally-empty-at-art-gate"


def build_camera_and_lighting(collections):
    camera_data=bpy.data.cameras.new("MW_CAM_OpeningArtGate")
    camera_data.type="ORTHO"
    # Blender defines orthographic scale across this landscape camera's width;
    # 14 m yields a 7.875 m vertical field at 16:9.
    camera_data.ortho_scale=14.00
    camera_data.lens=50
    camera=bpy.data.objects.new("MW_CAM_OpeningArtGate",camera_data)
    collections["02_CAMERA_GUIDES"].objects.link(camera)
    camera.location=(.10,-18.0,1.50)
    camera.rotation_euler=(math.radians(90),0,0)
    # Looking down +Y: rotate +90 degrees about X.
    direction=Vector((.10,0,1.50))-camera.location
    camera.rotation_euler=direction.to_track_quat("-Z","Y").to_euler()
    camera["camera_lock_status"]="LOCKED_AFTER_BLOCKOUT"
    camera["review_resolution"]="1536x864"
    camera["walking_surface_screen_fraction"]=.690
    camera["hargold_height_fraction"]=1.82/7.875
    camera["side_profile_axis"]="X"
    camera["depth_lane_movement_allowed"]=False
    camera.hide_select=True
    bpy.context.scene.camera=camera

    sun_data=bpy.data.lights.new("MW_Sun_Key","SUN")
    sun_data.energy=2.35
    sun_data.color=(1.0,.73,.45)
    sun_data.angle=math.radians(18)
    sun=bpy.data.objects.new("MW_Sun_Key",sun_data)
    collections["50_LIGHTING"].objects.link(sun)
    sun.rotation_euler=(math.radians(38),math.radians(-24),math.radians(-38))
    sun["art_stage"]="lighting"

    area_data=bpy.data.lights.new("MW_Sky_Fill","AREA")
    area_data.energy=520
    area_data.color=(.41,.64,1.0)
    area_data.shape="RECTANGLE"
    area_data.size=12
    area_data.size_y=8
    area=bpy.data.objects.new("MW_Sky_Fill",area_data)
    collections["50_LIGHTING"].objects.link(area)
    area.location=(-2,-5,6)
    area.rotation_euler=(math.radians(24),0,0)
    area["art_stage"]="lighting"

    rim_data=bpy.data.lights.new("MW_Foliage_Rim","AREA")
    rim_data.energy=680
    rim_data.color=(.77,1.0,.47)
    rim_data.shape="DISK"
    rim_data.size=5
    rim=bpy.data.objects.new("MW_Foliage_Rim",rim_data)
    collections["50_LIGHTING"].objects.link(rim)
    rim.location=(6,2.5,6)
    direction=Vector((5.7,0,2.4))-rim.location
    rim.rotation_euler=direction.to_track_quat("-Z","Y").to_euler()
    rim["art_stage"]="lighting"

    return camera


def configure_scene(scene):
    scene.unit_settings.system="METRIC"
    scene.unit_settings.scale_length=1.0
    scene.render.engine="BLENDER_EEVEE"
    scene.render.resolution_x=1536
    scene.render.resolution_y=864
    scene.render.resolution_percentage=100
    scene.render.image_settings.file_format="PNG"
    scene.render.image_settings.color_mode="RGBA"
    scene.render.film_transparent=False
    scene.render.image_settings.color_depth="8"
    scene.render.resolution_percentage=100
    scene.render.film_transparent=False
    scene.view_settings.look="AgX - Medium High Contrast"
    scene.world.use_nodes=True
    nodes=scene.world.node_tree.nodes
    background=nodes.get("Background")
    background.inputs["Color"].default_value=(.28,.62,.88,1)
    background.inputs["Strength"].default_value=.72
    scene["asset_id"]="meadow-wake-opening-art-gate"
    scene["scope"]="opening 15-25 second environment vertical slice"
    scene["integration_status"]="NOT STARTED - visual approval required"
    scene["production_approved"]=False
    scene["target_reference"]="assets/references/terrain/meadow-wake-production-quality-target.jpeg"
    scene["current_gameplay_reference"]="assets/references/terrain/meadow-wake-current-deployment.png"
    scene["target_reference_role"]="sole quality target"
    scene["current_reference_role"]="present gameplay only"
    scene["camera_locked_after_blockout"]=True
    scene["terrain_target_body_screen_fraction"]="0.08-0.16"
    scene["collision_implementation_status"]="future"
    scene["browser_renderer_modified"]=False


def main():
    for required in (TARGET_PATH,CURRENT_PATH):
        if not required.exists():
            raise FileNotFoundError(required)
    reset_scene()
    collections=make_collections()
    mats=make_materials()
    configure_scene(bpy.context.scene)
    build_guides_and_references(collections)
    build_landform(collections,mats)
    build_depth_layers(collections,mats)
    build_rocks(collections,mats)
    build_camp(collections,mats)
    build_primary_tree(collections,mats)
    build_foliage(collections,mats)
    build_ground_story(collections,mats)
    build_block_phrase(collections,mats)
    build_hargold_scale_mannequin(collections,mats)
    build_camera_and_lighting(collections)
    bpy.context.scene.frame_set(1)
    bpy.context.preferences.filepaths.save_version=0
    BLEND_PATH.parent.mkdir(parents=True,exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH),check_existing=False)
    print(f"Saved {BLEND_PATH}")
    print(f"Objects: {len(bpy.data.objects)} | Meshes: {len(bpy.data.meshes)} | Materials: {len(bpy.data.materials)}")


if __name__=="__main__":
    try:
        main()
    except Exception as exc:
        print(f"ERROR: {exc}",file=sys.stderr)
        raise
