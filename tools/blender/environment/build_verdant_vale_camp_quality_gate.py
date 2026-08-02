"""Build the first Verdant Vale hero-asset gate: the opening camp only.

The gameplay layout and background art remain frozen.  This file authors the
foreground camp, its immediate foundation, and review lighting.  It does not
build trees, course terrain, rock/root formations, collision, or exports.
"""

from __future__ import annotations

import math
import random
import sys
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[3]
BLEND_PATH = ROOT / "assets/blender/environments/world-1/verdant-vale-camp-quality-gate.blend"
TARGET_PATH = ROOT / "assets/references/terrain/meadow-wake-production-quality-target.jpeg"
CURRENT_PATH = ROOT / "assets/references/terrain/meadow-wake-current-deployment.png"
BACKGROUND_PATH = ROOT / "assets/textures/world-1/meadow-wake/verdant-vale-background-v1.png"
TIMBER_PATH = ROOT / "assets/textures/world-1/meadow-wake/meadow-camp-timber-albedo-v1.png"
CANVAS_PATH = ROOT / "assets/textures/world-1/meadow-wake/meadow-canvas-albedo-v1.png"
STONE_PATH = ROOT / "assets/textures/world-1/meadow-wake/meadow-ruin-stone-albedo-v1.png"
TURF_PATH = ROOT / "assets/textures/world-1/meadow-wake/meadow-turf-albedo-v1.png"
SOIL_PATH = ROOT / "assets/textures/world-1/meadow-wake/meadow-soil-stone-albedo-v3.png"

CAMP_ANCHOR_X = -0.15
CAMERA_FOCUS_X = 2.8
RNG = random.Random(711031)

COLLECTIONS = (
    "00_REFERENCE",
    "01_FROZEN_GAMEPLAY_ANCHORS",
    "10_CAMP_STRUCTURE",
    "11_CAMP_CLOTH",
    "12_CAMP_JOINERY",
    "13_CAMP_PROPS",
    "14_CAMP_FOUNDATION",
    "20_APPROVED_STATIC_BACKGROUND",
    "30_LIGHTING",
    "40_TREE_FAMILY_BLOCKED",
    "41_TERRAIN_BANK_BLOCKED",
    "42_ROCK_ROOT_FORMATION_BLOCKED",
    "90_EXPORT_BLOCKED",
)


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for group in (
        bpy.data.collections, bpy.data.meshes, bpy.data.curves, bpy.data.materials,
        bpy.data.cameras, bpy.data.lights, bpy.data.images,
    ):
        for block in list(group):
            if getattr(block, "users", 0) == 0:
                group.remove(block)


def make_collections():
    result = {}
    for name in COLLECTIONS:
        collection = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(collection)
        result[name] = collection
    for name in (
        "00_REFERENCE", "01_FROZEN_GAMEPLAY_ANCHORS", "40_TREE_FAMILY_BLOCKED",
        "41_TERRAIN_BANK_BLOCKED", "42_ROCK_ROOT_FORMATION_BLOCKED", "90_EXPORT_BLOCKED",
    ):
        result[name].hide_render = True
    return result


def mesh_object(name, vertices, faces, collection, material=None, smooth=False, uvs=None):
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
    if uvs:
        layer = mesh.uv_layers.new(name="UVMap")
        for polygon in mesh.polygons:
            for loop_index in polygon.loop_indices:
                vertex_index = mesh.loops[loop_index].vertex_index
                layer.data[loop_index].uv = uvs.get(vertex_index, (0.0, 0.0))
    obj["verdant_vale_hero_asset"] = "camp"
    obj["integration_approved"] = False
    return obj


def bevel(obj, width=.02, segments=3):
    modifier = obj.modifiers.new("Hand-softened edges", "BEVEL")
    modifier.width = width
    modifier.segments = segments
    modifier.limit_method = "ANGLE"
    return obj


def load_image(path):
    return bpy.data.images.load(str(path), check_existing=True)


def image_material(name, path, roughness=.76, bump_strength=.20, uv_scale=(1.0, 1.0, 1.0), box=False, value=1.0, saturation=1.0):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    image = nodes.new("ShaderNodeTexImage")
    image.image = load_image(path)
    image.extension = "REPEAT"
    image.interpolation = "Linear"
    coordinate = nodes.new("ShaderNodeTexCoord")
    mapping = nodes.new("ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = uv_scale
    grade = nodes.new("ShaderNodeHueSaturation")
    grade.inputs["Value"].default_value = value
    grade.inputs["Saturation"].default_value = saturation
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 8.0
    noise.inputs["Detail"].default_value = 5.0
    noise.inputs["Roughness"].default_value = .62
    mix = nodes.new("ShaderNodeMixRGB")
    mix.blend_type = "MULTIPLY"
    mix.inputs["Fac"].default_value = .20
    bump_node = nodes.new("ShaderNodeBump")
    bump_node.inputs["Strength"].default_value = bump_strength
    bump_node.inputs["Distance"].default_value = .07
    bsdf.inputs["Roughness"].default_value = roughness
    if box:
        image.projection = "BOX"
        image.projection_blend = .25
        links.new(coordinate.outputs["Generated"], mapping.inputs["Vector"])
    else:
        links.new(coordinate.outputs["UV"], mapping.inputs["Vector"])
    links.new(mapping.outputs["Vector"], image.inputs["Vector"])
    links.new(coordinate.outputs["Object"], noise.inputs["Vector"])
    links.new(image.outputs["Color"], grade.inputs["Color"])
    links.new(grade.outputs["Color"], mix.inputs[1])
    links.new(noise.outputs["Color"], mix.inputs[2])
    links.new(mix.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(image.outputs["Color"], bump_node.inputs["Height"])
    links.new(bump_node.outputs["Normal"], bsdf.inputs["Normal"])
    links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])
    return material


def flat_material(name, color, roughness=.72, metallic=0.0, emission=0.0):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*color, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission
    material.diffuse_color = (*color, 1.0)
    return material


def background_material():
    material = bpy.data.materials.new("VV Approved Static Background - locked")
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    texture = nodes.new("ShaderNodeTexImage")
    texture.image = load_image(BACKGROUND_PATH)
    texture.interpolation = "Linear"
    coordinate = nodes.new("ShaderNodeTexCoord")
    bsdf.inputs["Roughness"].default_value = 1.0
    bsdf.inputs["Base Color"].default_value = (0.0, 0.0, 0.0, 1.0)
    bsdf.inputs["Emission Strength"].default_value = .68
    links.new(coordinate.outputs["UV"], texture.inputs["Vector"])
    links.new(texture.outputs["Color"], bsdf.inputs["Emission Color"])
    links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])
    return material


def make_materials():
    return {
        "timber": image_material("VV Camp timber - weathered heavy oak", TIMBER_PATH, .78, .34, (1.35, 1.15, 1.0), value=.72, saturation=1.08),
        "timber_dark": image_material("VV Camp timber - shaded oak", TIMBER_PATH, .86, .38, (1.8, 1.3, 1.0), value=.52, saturation=.92),
        "canvas": image_material("VV Camp canvas - explorer green", CANVAS_PATH, .95, .22, (1.15, 1.15, 1.0), value=.72, saturation=1.12),
        "canvas_dark": image_material("VV Camp canvas - shadow green", CANVAS_PATH, .97, .25, (1.35, 1.2, 1.0), value=.47, saturation=1.05),
        "canvas_patch": image_material("VV Camp canvas - repaired patch", CANVAS_PATH, .96, .22, (1.7, 1.5, 1.0), value=.60, saturation=.84),
        "stone": image_material("VV Camp foundation stone", STONE_PATH, .89, .42, (1.8, 1.8, 1.8), box=True, value=.66, saturation=.86),
        "turf": image_material("VV Camp contact turf", TURF_PATH, .92, .28, (1.9, 1.4, 1.0), box=True, value=.64, saturation=1.12),
        "soil": image_material("VV Camp contact soil", SOIL_PATH, .95, .42, (1.6, 1.6, 1.6), box=True, value=.58, saturation=.92),
        "rope": flat_material("VV Rope - flax", (.26, .16, .052), .96),
        "iron": flat_material("VV Hardware - forged iron", (.055, .064, .052), .42, .72),
        "brass": flat_material("VV Hardware - aged brass", (.47, .27, .07), .34, .66),
        "stitch": flat_material("VV Canvas stitch", (.34, .22, .075), .82),
        "interior": flat_material("VV Camp interior depth", (.012, .022, .014), .99),
        "lantern_glow": flat_material("VV Lantern flame glass", (.88, .14, .018), .20, .0, .82),
        "moss": flat_material("VV Foundation moss", (.045, .13, .018), .95),
        "bedroll": flat_material("VV Bedroll red-brown", (.35, .075, .035), .91),
        "endgrain": flat_material("VV Timber end grain", (.25, .105, .035), .92),
        "background": background_material(),
    }


def timber(name, a, b, radius, collection, material, seed, taper=.92, segments=6, sides=12):
    rng = random.Random(seed)
    start, end = Vector(a), Vector(b)
    direction = end - start
    tangent = direction.normalized()
    helper = Vector((0, 1, 0))
    if abs(tangent.dot(helper)) > .94:
        helper = Vector((1, 0, 0))
    u = tangent.cross(helper).normalized()
    v = tangent.cross(u).normalized()
    vertices = []
    uvs = {}
    for ring in range(segments + 1):
        t = ring / segments
        center = start.lerp(end, t)
        center += u * (.014 * math.sin(t * math.pi * 2 + seed))
        center += v * (.009 * math.sin(t * math.pi * 3 + seed * .7))
        ring_radius = radius * (1.0 + (taper - 1.0) * t)
        ring_radius *= 1.0 + .035 * math.sin(t * math.pi * 5 + seed)
        for side in range(sides):
            angle = math.tau * side / sides
            uneven = 1.0 + .045 * math.sin(side * 2.6 + ring * .8 + seed)
            vertex = center + u * math.cos(angle) * ring_radius * uneven + v * math.sin(angle) * ring_radius
            index = len(vertices)
            vertices.append(tuple(vertex))
            uvs[index] = (t * 2.8 + (seed % 17) * .19, side / sides + (seed % 11) * .061)
    faces = []
    for ring in range(segments):
        for side in range(sides):
            nxt = (side + 1) % sides
            faces.append((ring * sides + side, ring * sides + nxt, (ring + 1) * sides + nxt, (ring + 1) * sides + side))
    faces.append(tuple(reversed(range(sides))))
    last = segments * sides
    faces.append(tuple(range(last, last + sides)))
    obj = mesh_object(name, vertices, faces, collection, material, True, uvs)
    obj["craft"] = "tapered hand-hewn timber"
    bevel(obj, radius * .07, 3)
    return obj


def hewn_beam(name, a, b, width, depth, collection, material, seed, taper=.96, segments=5):
    """Irregular rectangular timber with visible planar faces and softened hand-hewn edges."""
    rng=random.Random(seed)
    start,end=Vector(a),Vector(b)
    tangent=(end-start).normalized()
    helper=Vector((0,1,0))
    if abs(tangent.dot(helper))>.94:
        helper=Vector((1,0,0))
    u=tangent.cross(helper).normalized()
    v=tangent.cross(u).normalized()
    vertices=[]
    uvs={}
    corners=((-1,-1),(1,-1),(1,1),(-1,1))
    for ring in range(segments+1):
        t=ring/segments
        center=start.lerp(end,t)
        center+=u*math.sin(t*math.pi*3+seed)*.006+v*math.sin(t*math.pi*2.2+seed*.4)*.005
        local_taper=1.0+(taper-1.0)*t
        for corner,(su,sv) in enumerate(corners):
            cut=1.0+rng.uniform(-.025,.025)+.018*math.sin(ring*1.8+corner+seed)
            vertex=center+u*su*width*.5*local_taper*cut+v*sv*depth*.5*local_taper*cut
            index=len(vertices)
            vertices.append(tuple(vertex))
            uvs[index]=(t*3.0+(seed%19)*.17,corner/4+(seed%7)*.073)
    faces=[]
    for ring in range(segments):
        for corner in range(4):
            nxt=(corner+1)%4
            faces.append((ring*4+corner,ring*4+nxt,(ring+1)*4+nxt,(ring+1)*4+corner))
    faces.append((3,2,1,0))
    last=segments*4
    faces.append((last,last+1,last+2,last+3))
    obj=mesh_object(name,vertices,faces,collection,material,False,uvs)
    bevel(obj,min(width,depth)*.10,3)
    obj["craft"]="notched hand-hewn structural timber"
    return obj


def tube_curve(name, points, radii, collection, material, depth=.025, resolution=3):
    curve = bpy.data.curves.new(f"{name}_Curve", "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = resolution
    curve.bevel_depth = depth
    curve.bevel_resolution = 3
    curve.materials.append(material)
    spline = curve.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for point, location, radius in zip(spline.bezier_points, points, radii):
        point.co = location
        point.radius = radius
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve)
    collection.objects.link(obj)
    obj["verdant_vale_hero_asset"] = "camp"
    obj["integration_approved"] = False
    return obj


def cloth_grid(name, x0, x1, z0, z1, y_base, collection, material, seed, u_steps=18, v_steps=16, doorway_edge=None):
    rng = random.Random(seed)
    vertices = []
    uvs = {}
    for v_index in range(v_steps + 1):
        v = v_index / v_steps
        z = z0 + (z1 - z0) * v
        for u_index in range(u_steps + 1):
            u = u_index / u_steps
            x = x0 + (x1 - x0) * u
            if v_index == 0:
                z_edge = z + .028 * math.sin(u * math.tau * 3.0 + seed)
            else:
                z_edge = z
            edge_tension = math.sin(math.pi * u) * math.sin(math.pi * v)
            fold = .060 * math.sin(u * math.tau * 5.0 + seed) * (0.25 + .75 * edge_tension)
            sag = -.048 * edge_tension
            y = y_base + fold + sag + rng.uniform(-.002, .002)
            if doorway_edge:
                y += doorway_edge * .025 * math.sin(v * math.pi)
            index = len(vertices)
            vertices.append((x, y, z_edge))
            uvs[index] = (u * 1.2, v * 1.2)
    row = u_steps + 1
    faces = []
    for v_index in range(v_steps):
        for u_index in range(u_steps):
            a = v_index * row + u_index
            faces.append((a, a + 1, a + row + 1, a + row))
    obj = mesh_object(name, vertices, faces, collection, material, False, uvs)
    solid = obj.modifiers.new("Woven cloth thickness", "SOLIDIFY")
    solid.thickness = .018
    subdivision = obj.modifiers.new("Cloth fold smoothing", "SUBSURF")
    subdivision.subdivision_type = "CATMULL_CLARK"
    subdivision.levels = 1
    subdivision.render_levels = 2
    return obj


def roof_cloth(name, center_x, collection, material):
    x0, x1 = center_x - 2.05, center_x + 1.95
    y0, y1 = -.62, .92
    u_steps, v_steps = 30, 14
    vertices, faces, uvs = [], [], {}
    for v_index in range(v_steps + 1):
        v = v_index / v_steps
        y = y0 + (y1 - y0) * v
        depth_sag = -.07 * math.sin(math.pi * v)
        for u_index in range(u_steps + 1):
            u = u_index / u_steps
            x = x0 + (x1 - x0) * u
            asym_peak = max(0.0, 1.0 - abs((u - .47) / .53))
            z = 2.58 + .66 * asym_peak + depth_sag
            z += .035 * math.sin(u * math.tau * 6.0) * math.sin(math.pi * v)
            z += -.025 * math.sin(math.pi * u)
            index = len(vertices)
            vertices.append((x, y, z))
            uvs[index] = (u * 1.65, v * 1.1)
    row = u_steps + 1
    for v_index in range(v_steps):
        for u_index in range(u_steps):
            a = v_index * row + u_index
            faces.append((a, a + 1, a + row + 1, a + row))
    obj = mesh_object(name, vertices, faces, collection, material, False, uvs)
    solid = obj.modifiers.new("Heavy canvas thickness", "SOLIDIFY")
    solid.thickness = .026
    subdivision = obj.modifiers.new("Tensioned cloth smoothing", "SUBSURF")
    subdivision.subdivision_type = "CATMULL_CLARK"
    subdivision.levels = 1
    subdivision.render_levels = 2
    bevel(obj, .012, 2)
    return obj


def cloth_panel(name, vertices, collection, material, uvs=None, thickness=.018):
    if uvs is None:
        uvs = {index: ((vertex[0] - min(v[0] for v in vertices)) / max(.001, max(v[0] for v in vertices) - min(v[0] for v in vertices)),
                       (vertex[2] - min(v[2] for v in vertices)) / max(.001, max(v[2] for v in vertices) - min(v[2] for v in vertices)))
               for index, vertex in enumerate(vertices)}
    obj = mesh_object(name, vertices, [tuple(range(len(vertices)))], collection, material, False, uvs)
    solid = obj.modifiers.new("Woven cloth thickness", "SOLIDIFY")
    solid.thickness = thickness
    bevel(obj, .008, 2)
    obj["craft"] = "cut and tensioned canvas panel"
    return obj


def cloth_triangle(name, a, b, c, collection, material, seed, divisions=16):
    rng=random.Random(seed)
    a,b,c=Vector(a),Vector(b),Vector(c)
    vertices=[]
    uvs={}
    indices={}
    for i in range(divisions+1):
        for j in range(divisions+1-i):
            u=i/divisions
            v=j/divisions
            w=1.0-u-v
            point=a*w+b*u+c*v
            tension=math.sin(math.pi*u)*math.sin(math.pi*v)*math.sin(math.pi*max(0,w))
            point.y+=.055*math.sin((u-v)*math.tau*4.0+seed)*(.18+.82*tension)+rng.uniform(-.0015,.0015)
            index=len(vertices)
            indices[(i,j)]=index
            vertices.append(tuple(point))
            uvs[index]=(u+v*.5,v)
    faces=[]
    for i in range(divisions):
        for j in range(divisions-i):
            faces.append((indices[(i,j)],indices[(i+1,j)],indices[(i,j+1)]))
            if j<divisions-i-1:
                faces.append((indices[(i+1,j)],indices[(i+1,j+1)],indices[(i,j+1)]))
    obj=mesh_object(name,vertices,faces,collection,material,False,uvs)
    solid=obj.modifiers.new("Tensioned gable canvas thickness","SOLIDIFY")
    solid.thickness=.022
    subdivision=obj.modifiers.new("Tensioned gable fold smoothing","SUBSURF")
    subdivision.subdivision_type="CATMULL_CLARK"
    subdivision.levels=1
    subdivision.render_levels=1
    obj["craft"]="subdivided tensioned canvas with authored folds"
    return obj


def gable_canvas(center_x, collection, mats):
    """Broad, readable front canvas face with an asymmetric ridge and layered hems."""
    y = -.315
    left=(center_x-2.18,y,2.44)
    ridge=(center_x-.24,y-.012,3.23)
    right=(center_x+2.05,y,2.46)
    cloth_triangle("VV_CampRoofGableCanvas",left,ridge,right,collection,mats["canvas"],6111,18)

    # Stitched slope hems, ridge seam, and restrained repair patches remain legible at play distance.
    stitch_y = y - .018
    tube_curve("VV_CampRoofHem_Left", [(center_x-2.16,stitch_y,2.43),(center_x-.24,stitch_y,3.23)], (1,.75), collection, mats["stitch"], .012, 2)
    tube_curve("VV_CampRoofHem_Right", [(center_x-.24,stitch_y,3.23),(center_x+2.03,stitch_y,2.44)], (1,.76), collection, mats["stitch"], .012, 2)
    tube_curve("VV_CampRoofRidgeStitch", [(center_x-.24,stitch_y,3.22),(center_x-.17,stitch_y,2.55)], (1,.80), collection, mats["stitch"], .010, 2)
    patch = [
        (center_x-1.42, y-.072, 2.53), (center_x-1.02, y-.072, 2.68),
        (center_x-.96, y-.072, 2.88), (center_x-1.36, y-.072, 2.74),
    ]
    cloth_panel("VV_CampRoofRepairPatch", patch, collection, mats["canvas_patch"], thickness=.010)


def scalloped_valance(name, x0, x1, z_top, y, collection, mats, scallops=10):
    vertices = [(x0, y, z_top), (x1, y, z_top)]
    for index in range(scallops, -1, -1):
        t = index / scallops
        x = x0 + (x1 - x0) * t
        z = z_top - .16 - (.055 if index % 2 else 0.0)
        vertices.append((x, y-.008 * math.sin(t * math.pi), z))
    valance = cloth_panel(name, vertices, collection, mats["canvas_dark"], thickness=.015)
    # A raised stitched hem keeps the silhouette from reading as a flat rectangle.
    tube_curve(f"{name}_Hem", [(x0,y-.015,z_top-.08),(x1,y-.015,z_top-.08)], (1,1), collection, mats["stitch"], .010, 2)
    return valance


def timber_end_cap(name, point, tangent, radius, collection, material, sides=16):
    tangent = Vector(tangent).normalized()
    helper = Vector((0, 0, 1))
    if abs(tangent.dot(helper)) > .9:
        helper = Vector((0, 1, 0))
    u = tangent.cross(helper).normalized()
    v = tangent.cross(u).normalized()
    center = Vector(point) - tangent * .004
    vertices = [tuple(center)]
    for side in range(sides):
        angle = math.tau * side / sides
        wobble = 1.0 + .045 * math.sin(side * 2.9)
        vertices.append(tuple(center + (u * math.cos(angle) + v * math.sin(angle)) * radius * wobble))
    faces = []
    for side in range(sides):
        faces.append((0, 1 + side, 1 + ((side + 1) % sides)))
    obj = mesh_object(name, vertices, faces, collection, material)
    obj["craft"] = "exposed hand-cut end grain"
    bevel(obj, .006, 2)
    return obj


def grass_tuft(name, base, collection, material, seed):
    rng = random.Random(seed)
    x, y, z = base
    vertices, faces = [], []
    for blade in range(7):
        bx = x + rng.uniform(-.10, .10)
        by = y + rng.uniform(-.025, .025)
        height = rng.uniform(.09, .19)
        lean = rng.uniform(-.055, .055)
        width = rng.uniform(.010, .022)
        start = len(vertices)
        vertices.extend([
            (bx-width,by,z), (bx+width,by,z),
            (bx+lean+width*.22,by-.008,z+height*.72),
            (bx+lean,by,z+height),
            (bx+lean-width*.22,by+.008,z+height*.72),
        ])
        faces.append((start,start+1,start+2,start+3,start+4))
    obj = mesh_object(name, vertices, faces, collection, material)
    obj["scope"] = "camp-footprint vegetation only"
    return obj


def wall_stone(name, center, scale, collection, material, seed, moss=None):
    """Shallow, hand-set dry-stone block; designed to read from the gameplay camera."""
    rng=random.Random(seed)
    cx,cy,cz=center
    sides=9
    front=[]
    for index in range(sides):
        angle=math.tau*index/sides
        radial=1.0+rng.uniform(-.13,.10)
        front.append((cx+math.cos(angle)*scale[0]*radial,cy,cz+math.sin(angle)*scale[1]*radial))
    back=[(x,cy+.20,z) for x,_,z in front]
    vertices=front+back
    faces=[tuple(range(sides)),tuple(reversed(range(sides,sides*2)))]
    for index in range(sides):
        nxt=(index+1)%sides
        faces.append((index,nxt,sides+nxt,sides+index))
    uvs={index:((vertex[0]-cx)/(scale[0]*2)+.5,(vertex[2]-cz)/(scale[1]*2)+.5) for index,vertex in enumerate(vertices)}
    obj=mesh_object(name,vertices,faces,collection,material,False,uvs)
    bevel(obj,.030,3)
    obj["craft"]="embedded dry-stone foundation block"
    if moss:
        cap=[(cx-scale[0]*.72,cy-.012,cz+scale[1]*.55),(cx+scale[0]*.68,cy-.012,cz+scale[1]*.62),
             (cx+scale[0]*.52,cy-.012,cz+scale[1]*.83),(cx-scale[0]*.55,cy-.012,cz+scale[1]*.78)]
        cloth_panel(f"{name}_MossCap",cap,collection,moss,thickness=.006)
    return obj


def weathered_plank(name, x0, x1, z0, z1, y, depth, collection, material, seed):
    rng=random.Random(seed)
    front=[(x0,y,z0+rng.uniform(-.035,.025)),(x1,y,z0+rng.uniform(-.025,.035)),
           (x1+rng.uniform(-.04,.02),y,z1+rng.uniform(-.025,.025)),(x0+rng.uniform(-.02,.04),y,z1+rng.uniform(-.02,.03))]
    back=[(x,y+depth,z) for x,_,z in front]
    vertices=front+back
    faces=[(0,1,2,3),(7,6,5,4),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)]
    uvs={0:(0,0),1:(1,0),2:(1,1),3:(0,1),4:(0,0),5:(1,0),6:(1,1),7:(0,1)}
    obj=mesh_object(name,vertices,faces,collection,material,False,uvs)
    bevel(obj,.025,3)
    obj["craft"]="weathered hand-cut plank"
    return obj


def irregular_stone(name, location, scale, collection, material, seed, moss=None):
    rng = random.Random(seed)
    rings, sides = 7, 14
    vertices, uvs = [], {}
    for ring in range(rings):
        phi = -math.pi / 2 + math.pi * ring / (rings - 1)
        for side in range(sides):
            theta = math.tau * side / sides
            noise = 1.0 + .11 * math.sin(side * 2.1 + ring * 1.7 + seed) + rng.uniform(-.035, .035)
            index = len(vertices)
            vertices.append((
                math.cos(phi) * math.cos(theta) * scale[0] * noise,
                math.cos(phi) * math.sin(theta) * scale[1] * noise,
                math.sin(phi) * scale[2] * (1.0 + rng.uniform(-.05, .05)),
            ))
            uvs[index] = (side / sides * 1.4, ring / (rings - 1))
    faces = []
    for ring in range(rings - 1):
        for side in range(sides):
            nxt = (side + 1) % sides
            faces.append((ring * sides + side, ring * sides + nxt, (ring + 1) * sides + nxt, (ring + 1) * sides + side))
    obj = mesh_object(name, vertices, faces, collection, material, False, uvs)
    obj.location = location
    obj.rotation_euler = (rng.uniform(-.12, .12), rng.uniform(-.10, .10), rng.uniform(-.32, .32))
    bevel(obj, .018, 2)
    if moss:
        cap = irregular_stone(f"{name}_Moss", (location[0], location[1] - .015, location[2] + scale[2] * .68), (scale[0] * .78, scale[1] * .70, scale[2] * .14), collection, moss, seed + 900)
        cap["craft"] = "selective shaded moss cap"
    return obj


def band_ring(name, center, radius, height, collection, material, seed=0, sides=18):
    x, y, z = center
    vertices, faces = [], []
    for level in (-height / 2, height / 2):
        for side in range(sides):
            angle = math.tau * side / sides
            vertices.append((x + math.cos(angle) * radius, y + math.sin(angle) * radius, z + level))
    for side in range(sides):
        nxt = (side + 1) % sides
        faces.append((side, nxt, sides + nxt, sides + side))
    obj = mesh_object(name, vertices, faces, collection, material, True)
    bevel(obj, .008, 2)
    return obj


def rope_wrap(name, center, post_radius, z0, turns, collection, material):
    x, y = center
    points = []
    count = turns * 18
    for index in range(count + 1):
        t = index / count
        angle = t * math.tau * turns
        points.append((x + math.cos(angle) * (post_radius + .012), y + math.sin(angle) * (post_radius + .012), z0 + t * .12))
    return tube_curve(name, points, [1.0] * len(points), collection, material, .014, 1)


def make_foundation(collections, mats):
    collection = collections["14_CAMP_FOUNDATION"]
    # A shallow receiving patch catches real contact shadows without becoming the terrain-bank hero asset.
    patch_vertices=[]
    patch_uvs={}
    patch_sides=24
    for index in range(patch_sides):
        angle=math.tau*index/patch_sides
        radial=1.0+.055*math.sin(index*2.7)+.025*math.sin(index*5.1)
        px=CAMP_ANCHOR_X+math.cos(angle)*2.58*radial
        py=-.02+math.sin(angle)*1.18*radial
        pz=.018+.018*math.sin(index*1.9)
        patch_vertices.append((px,py,pz))
        patch_uvs[index]=(math.cos(angle)*.5+.5,math.sin(angle)*.5+.5)
    ground_patch=mesh_object("VV_CampFoundation_ShadowReceivingGrass",patch_vertices,[tuple(range(patch_sides))],collection,mats["turf"],False,patch_uvs)
    ground_patch["scope"]="camp footprint and contact-shadow receiver only"
    solid=ground_patch.modifiers.new("Shallow rooted footprint","SOLIDIFY")
    solid.thickness=.055
    bevel(ground_patch,.028,3)

    x0, x1 = CAMP_ANCHOR_X - 2.52, CAMP_ANCHOR_X + 2.38
    top = [
        (x0+.18, -.66, .075), (x0+.50, -.66, .10), (CAMP_ANCHOR_X-.92, -.67, .065),
        (CAMP_ANCHOR_X-.20, -.68, .095), (CAMP_ANCHOR_X+.58, -.67, .070),
        (x1-.42, -.66, .10), (x1-.16, -.66, .060),
    ]
    bottom = [
        (x0+.31, -.665, -.06), (x0+.54, -.67, -.13), (CAMP_ANCHOR_X-.90, -.675, -.10),
        (CAMP_ANCHOR_X-.17, -.68, -.15), (CAMP_ANCHOR_X+.63, -.675, -.11),
        (x1-.40, -.67, -.13), (x1-.29, -.665, -.045),
    ]
    count = len(top)
    vertices = top + list(reversed(bottom))
    foundation = mesh_object("VV_CampFoundation_ContactBank", vertices, [tuple(range(len(vertices)))], collection, mats["soil"])
    foundation["scope"] = "camp foundation contact only; not the terrain-bank hero asset"
    bevel(foundation, .045, 4)
    turf_top = [(x, -.705, z + .070) for x, _, z in top]
    turf_bottom = [(x, -.710, z - .028 - .014*math.sin(i*1.7)) for i,(x, _, z) in enumerate(top)]
    turf = mesh_object("VV_CampFoundation_TurfLip", turf_top + list(reversed(turf_bottom)), [tuple(range(count*2))], collection, mats["turf"])
    turf["scope"] = foundation["scope"]
    bevel(turf, .022, 3)
    stones = (
        (-1.94,.02,(.28,.14)),(-1.46,-.01,(.23,.12)),(-.78,.00,(.20,.11)),
        (.50,.01,(.22,.12)),(1.10,-.01,(.24,.13)),(1.62,.02,(.28,.14)),
    )
    for index, (x, z, scale) in enumerate(stones):
        wall_stone(f"VV_CampFoundation_Stone_{index+1:02}",(x,-.735,z),scale,collection,mats["stone"],3100+index,mats["moss"] if index in (1,4) else None)
    for index, px in enumerate((x0+.18, x0+.70, CAMP_ANCHOR_X-.28, CAMP_ANCHOR_X+.92, x1-.24)):
        grass_tuft(f"VV_CampFootprint_Tuft_{index:02}", (px,-.735,.13), collection, mats["moss"], 3180+index)


def make_lantern(name, location, collection, mats):
    x, y, z = location
    # Tapered top/bottom frames and four uprights.
    timber(f"{name}_Top", (x-.14,y,z+.18),(x+.14,y,z+.18),.022,collection,mats["iron"],4101,.96,3,10)
    timber(f"{name}_Bottom",(x-.13,y,z-.18),(x+.13,y,z-.18),.025,collection,mats["iron"],4102,.96,3,10)
    for index, dx in enumerate((-.12,.12)):
        timber(f"{name}_Frame_{index}",(x+dx,y,z-.17),(x+dx,y,z+.17),.017,collection,mats["iron"],4110+index,.94,3,8)
    glass_vertices=[(x-.095,y-.015,z-.13),(x+.095,y-.015,z-.13),(x+.095,y-.015,z+.13),(x-.095,y-.015,z+.13)]
    glass=mesh_object(f"{name}_Glass",glass_vertices,[(0,1,2,3)],collection,mats["lantern_glow"])
    glass["craft"]="emissive inset glass pane"
    handle=tube_curve(f"{name}_Handle",[(x-.09,y,z+.18),(x,y,z+.31),(x+.09,y,z+.18)],(1,.8,1),collection,mats["iron"],.012,3)
    light_data=bpy.data.lights.new(f"{name}_Light","POINT")
    light_data.energy=22
    light_data.color=(1.0,.36,.07)
    light_data.shadow_soft_size=.28
    light=bpy.data.objects.new(f"{name}_Light",light_data)
    collection.objects.link(light)
    light.location=(x,y-.10,z)


def make_barrel(name, center, collection, mats):
    x,y,z=center
    rings=((0,.205),(.08,.245),(.46,.245),(.54,.205))
    sides=16
    vertices=[]
    uvs={}
    for ring,(dz,radius) in enumerate(rings):
        for side in range(sides):
            angle=math.tau*side/sides
            index=len(vertices)
            vertices.append((x+math.cos(angle)*radius,y+math.sin(angle)*radius,z+dz))
            uvs[index]=(side/sides*1.6,ring/(len(rings)-1))
    faces=[]
    for ring in range(len(rings)-1):
        for side in range(sides):
            nxt=(side+1)%sides
            faces.append((ring*sides+side,ring*sides+nxt,(ring+1)*sides+nxt,(ring+1)*sides+side))
    faces.extend((tuple(reversed(range(sides))),tuple(range((len(rings)-1)*sides,len(rings)*sides))))
    barrel=mesh_object(name,vertices,faces,collection,mats["timber"],True,uvs)
    bevel(barrel,.014,2)
    band_ring(f"{name}_BandLower",(x,y,z+.10),.252,.045,collection,mats["iron"],1,18)
    band_ring(f"{name}_BandUpper",(x,y,z+.44),.252,.045,collection,mats["iron"],2,18)
    barrel["craft"]="staved camp supply barrel"
    return barrel


def make_crate(name, center, collection, mats):
    x,y,z=center
    for index,(z0,z1) in enumerate(((z-.34,z-.18),(z-.16,z),(z+.02,z+.18),(z+.20,z+.35))):
        weathered_plank(f"{name}_Board_{index}",x-.44,x+.44,z0,z1,y-.03,.22,collection,mats["timber_dark"],4300+index)
    for index,dx in enumerate((-.36,.36)):
        hewn_beam(f"{name}_Brace_{index}",(x+dx,y-.07,z-.34),(x+dx,y-.07,z+.35),.10,.08,collection,mats["timber"],4310+index,.96,4)
    hewn_beam(f"{name}_Diagonal",(x-.34,y-.085,z-.27),(x+.34,y-.085,z+.27),.075,.065,collection,mats["timber"],4320,.94,5)
    for index,(px,pz) in enumerate(((x-.34,z-.27),(x+.34,z+.27))):
        timber_end_cap(f"{name}_Nail_{index}",(px,y-.132,pz),(0,-1,0),.024,collection,mats["iron"],10)


def make_banner(center_x, collection, mats):
    banner=cloth_grid("VV_CampBanner_Cloth",center_x-.40,center_x+.40,.80,2.10,-.71,collection,mats["canvas"],4401,14,18)
    # Original compass-leaf emblem: central stem, four leaves, eight short rays.
    timber("VV_BannerEmblem_Stem",(center_x,-.745,1.06),(center_x,-.745,1.82),.018,collection,mats["stitch"],4402,.96,4,8)
    for index,(dx,dz) in enumerate(((-.18,1.34),(.18,1.34),(-.14,1.58),(.14,1.58))):
        vertices=[(center_x,-.75,dz),(center_x+dx,-.75,dz+.12),(center_x+dx*.60,-.75,dz-.05)]
        leaf=mesh_object(f"VV_BannerEmblem_Leaf_{index}",vertices,[(0,1,2)],collection,mats["stitch"])
        leaf["craft"]="original stitched leaf compass"


def make_camp_sign(center_x, collection, mats):
    timber("VV_CampSign_Post",(center_x,-.73,.08),(center_x,-.73,1.13),.070,collection,mats["timber_dark"],4450,.84,5,10)
    weathered_plank("VV_CampSign_BoardUpper",center_x-.54,center_x+.48,.73,1.02,-.75,.12,collection,mats["timber"],4451)
    weathered_plank("VV_CampSign_BoardLower",center_x-.43,center_x+.42,.43,.69,-.75,.12,collection,mats["timber_dark"],4452)
    # Original compass-leaf mark in lieu of copied typography or iconography.
    tube_curve("VV_CampSign_CompassStem",[(center_x-.16,-.825,.80),(center_x-.16,-.825,.96)],(1,1),collection,mats["brass"],.014,2)
    for index,(dx,dz) in enumerate(((-.08,.86),(.08,.86),(-.065,.92),(.065,.92))):
        leaf=mesh_object(f"VV_CampSign_Leaf_{index}",[(center_x-.16,-.828,dz),(center_x-.16+dx,-.828,dz+.045),(center_x-.16+dx*.55,-.828,dz-.025)],[(0,1,2)],collection,mats["brass"])
        leaf["craft"]="original compass-leaf wayfinding mark"


def build_camp(collections, mats):
    structure = collections["10_CAMP_STRUCTURE"]
    cloth = collections["11_CAMP_CLOTH"]
    joinery = collections["12_CAMP_JOINERY"]
    props = collections["13_CAMP_PROPS"]
    x = CAMP_ANCHOR_X

    # Load-bearing front and rear bents.
    post_positions = (x-1.72, x+1.57)
    for index, px in enumerate(post_positions):
        hewn_beam(f"VV_CampFrontPost_{index}",(px,-.36,.20),(px,-.36,2.78),.27,.23,structure,mats["timber"],5000+index,.91,7)
        hewn_beam(f"VV_CampRearPost_{index}",(px,.72,.20),(px,.72,2.72),.23,.20,structure,mats["timber_dark"],5010+index,.92,7)
        band_ring(f"VV_CampPostIronBand_{index}",(px,-.36,.62),.158,.085,joinery,mats["iron"],index)
        rope_wrap(f"VV_CampPostRopeWrap_{index}",(px,-.36),.145,2.36,4,joinery,mats["rope"])

    hewn_beam("VV_CampFrontSill",(x-1.86,-.36,.34),(x+1.72,-.36,.34),.27,.25,structure,mats["timber_dark"],5020,.96,8)
    hewn_beam("VV_CampFrontPlate",(x-1.87,-.36,2.65),(x+1.70,-.36,2.65),.23,.22,structure,mats["timber"],5021,.95,8)
    hewn_beam("VV_CampRearPlate",(x-1.84,.72,2.61),(x+1.67,.72,2.61),.21,.19,structure,mats["timber_dark"],5022,.95,8)
    hewn_beam("VV_CampRidge",(x-.22,-.30,3.20),(x-.22,.82,3.17),.20,.18,structure,mats["timber"],5023,.94,5)
    # Diagonal bracing forms believable triangles without flattening the interior.
    hewn_beam("VV_CampBrace_Left",(x-1.63,-.39,.48),(x-.70,-.39,1.49),.15,.13,structure,mats["timber_dark"],5030,.90,5)
    hewn_beam("VV_CampBrace_Right",(x+1.49,-.39,.48),(x+.65,-.39,1.46),.15,.13,structure,mats["timber_dark"],5031,.90,5)
    hewn_beam("VV_CampRoofRafter_Left",(x-1.92,-.42,2.55),(x-.22,-.42,3.20),.15,.14,structure,mats["timber"],5032,.90,6)
    hewn_beam("VV_CampRoofRafter_Right",(x-.22,-.42,3.20),(x+1.82,-.42,2.56),.15,.14,structure,mats["timber"],5033,.90,6)
    timber("VV_CampRearRafter_Left",(x-1.90,.74,2.54),(x-.22,.80,3.17),.072,structure,mats["timber_dark"],5034,.88,7,12)
    timber("VV_CampRearRafter_Right",(x-.22,.80,3.17),(x+1.78,.74,2.54),.072,structure,mats["timber_dark"],5035,.88,7,12)

    # A small service lean-to breaks the prefab symmetry and reads as an inhabited camp.
    timber("VV_CampLeanToPost",(x-2.30,-.31,.12),(x-2.30,-.31,1.82),.105,structure,mats["timber_dark"],5040,.86,7,12)
    timber("VV_CampLeanToRafter",(x-2.45,-.34,1.78),(x-1.57,-.34,2.48),.074,structure,mats["timber"],5041,.88,6,12)
    lean_canvas=[(x-2.48,-.27,1.76),(x-1.60,-.27,2.48),(x-1.48,-.27,2.37),(x-2.39,-.27,1.66)]
    cloth_panel("VV_CampLeanToCanvas",lean_canvas,cloth,mats["canvas_dark"],thickness=.018)

    # Floor joists and hand-laid deck slats.
    for index in range(13):
        px=x-1.63+index*.26
        hewn_beam(f"VV_CampDeckSlat_{index:02}",(px,-.45,.44),(px,.79,.44),.105,.205,structure,mats["timber"],5100+index,.97,4)
    hewn_beam("VV_CampDeckFrontEdge",(x-1.82,-.49,.44),(x+1.65,-.49,.44),.23,.20,structure,mats["timber_dark"],5120,.95,8)
    hewn_beam("VV_CampLeanToDeckEdge",(x-2.36,-.48,.32),(x-1.73,-.48,.40),.19,.17,structure,mats["timber_dark"],5121,.93,5)

    # Three broad entrance steps with riser support and depth.
    for index,(half_width,z,yfront) in enumerate(((1.00,.30,-.62),(.78,.19,-.78),(.57,.095,-.92))):
        hewn_beam(f"VV_CampStep_{index}_Front",(x-half_width,yfront,z),(x+half_width,yfront,z),.19,.20,structure,mats["timber"],5140+index,.95,7)
        for slat in range(4):
            sx=x-half_width+(slat+.5)*(half_width*2/4)
            hewn_beam(f"VV_CampStep_{index}_Slat_{slat}",(sx,yfront,z),(sx,yfront+.30,z),.095,max(.18,half_width*.36),structure,mats["timber"],5150+index*10+slat,.97,3)

    # Deep doorway and separated cloth leaves preserve readable interior depth.
    interior_vertices=[(x-.46,.78,.45),(x+.74,.78,.45),(x+.74,.78,2.45),(x-.46,.78,2.45)]
    interior=mesh_object("VV_CampInteriorOpening",interior_vertices,[(0,1,2,3)],props,mats["interior"])
    interior["craft"]="open layered interior, not a flat camp wall"
    cloth_grid("VV_CampCurtain_Left",x-1.52,x-.43,.52,2.46,.48,cloth,mats["canvas"],5200,15,20,-1)
    cloth_grid("VV_CampCurtain_Right",x+.70,x+1.40,.52,2.46,.48,cloth,mats["canvas_dark"],5201,11,20,1)
    left_side=[(x-1.53,-.30,.48),(x-1.53,.75,.48),(x-1.53,.75,2.47),(x-1.53,-.30,2.47)]
    right_side=[(x+1.41,-.30,.48),(x+1.41,.75,.48),(x+1.41,.75,2.47),(x+1.41,-.30,2.47)]
    side_uv={0:(0,0),1:(1,0),2:(1,1),3:(0,1)}
    cloth_panel("VV_CampSideCanvas_Left",left_side,cloth,mats["canvas_dark"],side_uv,.020)
    cloth_panel("VV_CampSideCanvas_Right",right_side,cloth,mats["canvas"],side_uv,.020)
    roof_cloth("VV_CampRoofCanvas",x,cloth,mats["canvas"])
    gable_canvas(x,cloth,mats)
    # Front valance introduces a hemmed, scalloped silhouette rather than a flat strip.
    scalloped_valance("VV_CampRoofValance",x-2.16,x+2.02,2.56,-.47,cloth,mats,12)
    for index,px in enumerate((x-1.58,x-.94,x+.42,x+1.12)):
        tube_curve(f"VV_CampRoofPanelSeam_{index}",[(px,-.340,2.48),(px+(x-.20-px)*.18,-.340,2.70)],(1,.72),cloth,mats["stitch"],.008,2)

    # Two repairs and tied-back door edges make the wall fabric feel handled and inhabited.
    cloth_panel("VV_CampCurtainPatch_Left",[(x-1.32,.445,1.17),(x-.99,.445,1.19),(x-.97,.445,1.49),(x-1.30,.445,1.46)],cloth,mats["canvas_patch"],thickness=.010)
    tube_curve("VV_CampCurtainTie_Left",[(x-.47,.40,1.18),(x-.38,.34,1.24),(x-.46,.40,1.31)],(1,.72,1),joinery,mats["rope"],.014,2)
    tube_curve("VV_CampCurtainTie_Right",[(x+.70,.40,1.19),(x+.61,.34,1.25),(x+.70,.40,1.32)],(1,.72,1),joinery,mats["rope"],.014,2)
    for index,px in enumerate((x-1.49,x-.45,x+.72,x+1.38)):
        tube_curve(f"VV_CampCurtainEdgeStitch_{index}",[(px,.445,.58),(px,.445,2.38)],(1,.92),cloth,mats["stitch"],.007,2)

    # Joinery: visible pegs, iron straps, rope lashings, and canopy stays.
    joints=((x-1.72,2.65),(x+1.57,2.65),(x-1.72,.44),(x+1.57,.44))
    for index,(px,pz) in enumerate(joints):
        timber(f"VV_CampJoineryPeg_{index}",(px,-.53,pz),(px,-.30,pz),.042,joinery,mats["timber_dark"],5300+index,.82,3,10)
        timber_end_cap(f"VV_CampJoineryBoltHead_{index}",(px,-.545,pz),(0,-1,0),.052,joinery,mats["iron"],14)
        timber_end_cap(f"VV_CampJoineryBoltInset_{index}",(px,-.552,pz),(0,-1,0),.019,joinery,mats["brass"],12)
    for index,(px,pz) in enumerate(((x-1.49,.63),(x-.76,1.42),(x+1.36,.61),(x+.72,1.38))):
        timber_end_cap(f"VV_CampBraceFastener_{index}",(px,-.565,pz),(0,-1,0),.040,joinery,mats["iron"],12)

    # Selective adze grooves break the long post surfaces without noisy repetition.
    for post_index,px in enumerate(post_positions):
        for groove_index,(dz,length) in enumerate(((1.02,.18),(1.57,.22),(2.05,.15))):
            tube_curve(f"VV_CampPostAdze_{post_index}_{groove_index}",[(px-.045,-.493,dz),(px+.045,-.493,dz+length*.10)],(1,.55),joinery,mats["timber_dark"],.006,1)
    for index,(point,tangent,radius) in enumerate((
        ((x-1.88,-.36,2.65),(-1,0,0),.135),((x+1.71,-.36,2.65),(1,0,0),.128),
        ((x-1.83,-.49,.44),(-1,0,0),.124),((x+1.66,-.49,.44),(1,0,0),.118),
        ((x-2.46,-.34,1.78),(-1,0,-.2),.071),
    )):
        timber_end_cap(f"VV_CampExposedEndGrain_{index:02}",point,tangent,radius,joinery,mats["endgrain"])

    # The lashed ridge crown is the camp's strongest craft signature.
    for index,dx in enumerate((-.16,0,.16)):
        timber(f"VV_CampRidgeCrownPeg_{index}",(x-.22+dx,-.40,3.03),(x-.22+dx,-.40,3.46),.052,joinery,mats["timber_dark"],5320+index,.86,4,10)
        rope_wrap(f"VV_CampRidgeCrownLashing_{index}",(x-.22+dx,-.40),.052,3.16,3,joinery,mats["rope"])
    timber("VV_CampRidgeCrownCrossbar",(x-.55,-.40,3.33),(x+.12,-.40,3.33),.060,joinery,mats["timber"],5325,.90,5,10)
    tube_curve("VV_CampStay_Left",[(x-1.93,-.63,2.54),(x-2.15,-.72,1.30),(x-2.30,-.76,.10)],(1,.78,.45),joinery,mats["rope"],.018,3)
    tube_curve("VV_CampStay_Right",[(x+1.82,-.63,2.54),(x+2.06,-.72,1.25),(x+2.18,-.76,.10)],(1,.78,.45),joinery,mats["rope"],.018,3)
    timber("VV_CampGroundPeg_Left",(x-2.33,-.77,.02),(x-2.29,-.77,.32),.032,joinery,mats["iron"],5310,.84,3,8)
    timber("VV_CampGroundPeg_Right",(x+2.16,-.77,.02),(x+2.20,-.77,.32),.032,joinery,mats["iron"],5311,.84,3,8)

    make_banner(x-1.02,cloth,mats)
    make_camp_sign(x-2.33,props,mats)

    # Lantern brackets have curved load paths and hang from short chains.
    for index,(px,side) in enumerate(((x-1.57,-1),(x+1.43,1))):
        tube_curve(f"VV_LanternBracket_{index}",[(px,-.52,2.22),(px+side*.22,-.60,2.36),(px+side*.36,-.62,2.24)],(1,.85,.55),joinery,mats["iron"],.026,3)
        for link in range(3):
            band_ring(f"VV_LanternChain_{index}_{link}",(px+side*.36,-.62,2.18-link*.075),.035,.018,joinery,mats["iron"],link,12)
        make_lantern(f"VV_CampLantern_{index}",(px+side*.36,-.64,1.83),props,mats)

    # Restrained props visible through/around the threshold.
    make_crate("VV_CampSupplyCrate",(x+1.43,-.62,.45),props,mats)
    make_barrel("VV_CampWaterBarrel",(x-2.03,-.48,.08),props,mats)
    timber("VV_CampInteriorShelf",(x-.48,.62,1.05),(x+.40,.62,1.05),.065,props,mats["timber_dark"],5400,.95,5,10)
    tube_curve("VV_CampBedroll",[(x-.44,.58,.62),(x-.05,.58,.64),(x+.25,.58,.61)],(1,.92,.75),props,mats["bedroll"],.11,3)
    coil=[]
    for index in range(42):
        angle=math.tau*index/14
        radius=.19-.025*(index/42)
        coil.append((x+1.55+math.cos(angle)*radius,-.56,1.10+math.sin(angle)*radius-index*.0015))
    tube_curve("VV_CampHangingRopeCoil",coil,[1]*len(coil),props,mats["rope"],.012,2)


def set_camp_review_presentation(collections):
    """Reveal authored depth without moving the frozen gameplay anchor."""
    root=bpy.data.objects.new("VV_CampAssetRoot",None)
    collections["10_CAMP_STRUCTURE"].objects.link(root)
    root.location=(0,0,0)
    root.rotation_euler[2]=math.radians(-7.0)
    root["canonical_anchor_x"]=CAMP_ANCHOR_X
    root["presentation_rotation_only_degrees"]=-7.0
    root["gameplay_layout_mutated"]=False
    for name in ("10_CAMP_STRUCTURE","11_CAMP_CLOTH","12_CAMP_JOINERY","13_CAMP_PROPS","14_CAMP_FOUNDATION"):
        for obj in list(collections[name].objects):
            if obj != root:
                obj.parent=root


def build_static_background(collections, mats):
    collection=collections["20_APPROVED_STATIC_BACKGROUND"]
    camera=bpy.context.scene.camera
    rotation=camera.rotation_euler.to_quaternion()
    forward=rotation @ Vector((0,0,-1))
    right=rotation @ Vector((1,0,0))
    up=rotation @ Vector((0,1,0))
    center=camera.location+forward*24.0
    half_width=7.20
    half_height=4.05
    vertices=[tuple(center-right*half_width-up*half_height),tuple(center+right*half_width-up*half_height),
              tuple(center+right*half_width+up*half_height),tuple(center-right*half_width+up*half_height)]
    obj=mesh_object("VV_APPROVED_STATIC_Background",vertices,[(0,1,2,3)],collection,mats["background"],False,{0:(0,0),1:(1,0),2:(1,1),3:(0,1)})
    obj["source"]="assets/textures/world-1/meadow-wake/verdant-vale-background-v1.png"
    obj["locked"] = True
    obj["blender_modeling_prohibited"] = True


def install_reference(name, path, role, collection):
    image=load_image(path)
    obj=bpy.data.objects.new(name,None)
    collection.objects.link(obj)
    obj.empty_display_type="IMAGE"
    obj.data=image
    obj.empty_display_size=6
    obj.hide_render=True
    obj.hide_viewport=True
    obj["reference_role"]=role
    obj["non_rendering_reference"]=True
    obj["filepath"]=str(path.relative_to(ROOT)).replace("\\","/")


def build_contract_markers(collections):
    install_reference("VV_REF_QualityTarget",TARGET_PATH,"sole-quality-target",collections["00_REFERENCE"])
    install_reference("VV_REF_CurrentGameplay",CURRENT_PATH,"current-gameplay-only",collections["00_REFERENCE"])
    marker=bpy.data.objects.new("VV_FROZEN_CampAnchor",None)
    collections["01_FROZEN_GAMEPLAY_ANCHORS"].objects.link(marker)
    marker.location=(CAMP_ANCHOR_X,-.485714,0)
    marker.hide_render=True
    marker["anchor_id"]="opening-lodge"
    marker["source"]="data/level-art/world-1/meadow-wake-opening-layout.json"
    marker["layout_mutated"] = False
    for collection_name, asset_name in (
        ("40_TREE_FAMILY_BLOCKED","tree-family"),
        ("41_TERRAIN_BANK_BLOCKED","terrain-bank"),
        ("42_ROCK_ROOT_FORMATION_BLOCKED","rock-root-formation"),
        ("90_EXPORT_BLOCKED","integration-export"),
    ):
        blocked=bpy.data.objects.new(f"VV_BLOCKED_{asset_name}",None)
        collections[collection_name].objects.link(blocked)
        blocked.hide_render=True
        blocked["status"]="BLOCKED_UNTIL_CAMP_VISUAL_APPROVAL"


def look_at(obj,target):
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat("-Z","Y").to_euler()


def build_camera_and_lighting(collections):
    camera_data=bpy.data.cameras.new("VV_CAM_CampQualityGate")
    camera_data.type="ORTHO"
    camera_data.ortho_scale=14.0
    camera=bpy.data.objects.new("VV_CAM_CampQualityGate",camera_data)
    collections["01_FROZEN_GAMEPLAY_ANCHORS"].objects.link(camera)
    camera.location=(CAMERA_FOCUS_X,-18,4.05)
    look_at(camera,(CAMERA_FOCUS_X,0,1.45))
    camera["camera_role"]="frozen opening comparison centered at canonical spawn focus"
    camera["focus_x_from_layout"]=2.8
    camera["gameplay_layout_mutated"]=False
    camera["walking_surface_screen_fraction"]=.703
    camera["ordinary_terrain_body_screen_fraction"]=.025
    camera.hide_select=True
    bpy.context.scene.camera=camera

    detail_data=bpy.data.cameras.new("VV_CAM_CampDetailGate")
    detail_data.type="ORTHO"
    detail_data.ortho_scale=6.4
    detail=bpy.data.objects.new("VV_CAM_CampDetailGate",detail_data)
    collections["01_FROZEN_GAMEPLAY_ANCHORS"].objects.link(detail)
    detail.location=(CAMP_ANCHOR_X,-18,4.05)
    look_at(detail,(CAMP_ANCHOR_X,0,1.45))
    detail["camera_role"]="supplemental camp craftsmanship inspection; never runtime"
    detail["gameplay_layout_mutated"]=False
    detail.hide_select=True

    key_data=bpy.data.lights.new("VV_Camp_SunKey","AREA")
    key_data.energy=430
    key_data.shape="DISK"
    key_data.size=5.5
    key_data.color=(1.0,.69,.40)
    key=bpy.data.objects.new("VV_Camp_SunKey",key_data)
    collections["30_LIGHTING"].objects.link(key)
    key.location=(-4.8,-5.0,7.2)
    look_at(key,(CAMP_ANCHOR_X,0,1.3))

    sun_data=bpy.data.lights.new("VV_Camp_DirectionalSun","SUN")
    sun_data.energy=1.65
    sun_data.angle=math.radians(12)
    sun_data.color=(1.0,.78,.56)
    sun=bpy.data.objects.new("VV_Camp_DirectionalSun",sun_data)
    collections["30_LIGHTING"].objects.link(sun)
    sun.location=(-6.0,-8.0,10.0)
    look_at(sun,(CAMP_ANCHOR_X,0,1.0))

    fill_data=bpy.data.lights.new("VV_Camp_SkyFill","AREA")
    fill_data.energy=175
    fill_data.shape="RECTANGLE"
    fill_data.size=8
    fill_data.size_y=5
    fill_data.color=(.38,.61,1.0)
    fill=bpy.data.objects.new("VV_Camp_SkyFill",fill_data)
    collections["30_LIGHTING"].objects.link(fill)
    fill.location=(3.4,-3.0,5.5)
    look_at(fill,(CAMP_ANCHOR_X,0,1.2))

    bounce_data=bpy.data.lights.new("VV_Camp_GroundBounce","AREA")
    bounce_data.energy=80
    bounce_data.shape="RECTANGLE"
    bounce_data.size=5
    bounce_data.size_y=2
    bounce_data.color=(.42,.72,.20)
    bounce=bpy.data.objects.new("VV_Camp_GroundBounce",bounce_data)
    collections["30_LIGHTING"].objects.link(bounce)
    bounce.location=(-.2,-2.0,.25)
    look_at(bounce,(CAMP_ANCHOR_X,0,1.4))
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
    scene.render.image_settings.color_depth="8"
    scene.render.film_transparent=False
    scene.view_settings.look="AgX - Medium High Contrast"
    scene.world.use_nodes=True
    background=scene.world.node_tree.nodes.get("Background")
    background.inputs["Color"].default_value=(.18,.42,.62,1)
    background.inputs["Strength"].default_value=.12
    scene["asset_kit"]="Verdant Vale environment kit"
    scene["quality_gate_asset"]="camp"
    scene["gate_sequence"]="camp -> tree family -> terrain bank -> rock/root formation"
    scene["camp_visual_approval"]="PENDING"
    scene["later_assets_blocked"] = True
    scene["background_status"]="APPROVED STATIC LAYER - UNMODIFIED"
    scene["gameplay_layout_status"]="FROZEN - UNMODIFIED"
    scene["integration_status"]="BLOCKED UNTIL USER VISUAL APPROVAL"
    scene["production_approved"] = False


def main():
    for path in (TARGET_PATH,CURRENT_PATH,BACKGROUND_PATH,TIMBER_PATH,CANVAS_PATH,STONE_PATH,TURF_PATH,SOIL_PATH):
        if not path.exists():
            raise FileNotFoundError(path)
    reset_scene()
    collections=make_collections()
    mats=make_materials()
    configure_scene(bpy.context.scene)
    build_contract_markers(collections)
    make_foundation(collections,mats)
    build_camp(collections,mats)
    set_camp_review_presentation(collections)
    build_camera_and_lighting(collections)
    build_static_background(collections,mats)
    bpy.context.scene.frame_set(1)
    bpy.context.preferences.filepaths.save_version=0
    BLEND_PATH.parent.mkdir(parents=True,exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH),check_existing=False)
    print(f"Saved {BLEND_PATH}")
    print(f"Objects {len(bpy.data.objects)} | meshes {len(bpy.data.meshes)} | curves {len(bpy.data.curves)} | materials {len(bpy.data.materials)}")


if __name__=="__main__":
    try:
        main()
    except Exception as exc:
        print(f"ERROR: {exc}",file=sys.stderr)
        raise
