"""Build one isolated, explicitly authored Verdant Vale terrain-bank hero asset.

This is an art-review scene only.  It deliberately does not read the Meadow
Wake collision profile, generate course geometry, export assets, or modify the
deployed browser terrain.  Every silhouette and dressing placement below is a
fixed authored control point.
"""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[3]
BLEND_PATH = ROOT / "assets/blender/environments/world-1/verdant-vale-terrain-bank-quality-gate.blend"
TARGET_PATH = ROOT / "assets/references/terrain/meadow-wake-production-quality-target.jpeg"
CURRENT_PATH = ROOT / "assets/references/terrain/meadow-wake-current-deployment.png"
BACKGROUND_PATH = ROOT / "assets/textures/world-1/meadow-wake/verdant-vale-background-v1.png"
SOIL_PATH = ROOT / "assets/textures/world-1/meadow-wake/meadow-soil-stone-albedo-v3.png"
TERRAIN_CROSS_SECTION_PATH = ROOT / "assets/textures/world-1/meadow-wake/meadow-terrain-cross-section-albedo-v1.png"
TURF_PATH = ROOT / "assets/textures/world-1/meadow-wake/meadow-turf-albedo-v1.png"
STONE_PATH = ROOT / "assets/textures/world-1/meadow-wake/meadow-ruin-stone-albedo-v1.png"
BARK_PATH = ROOT / "assets/textures/world-1/meadow-wake/meadow-bark-albedo-v1.png"

REVIEW_ORIGIN_X = 2.8
CAMERA_FOCUS_X = 2.8

COLLECTIONS = (
    "00_REFERENCE",
    "01_FROZEN_BOUNDARIES",
    "10_TERRAIN_BANK_SOIL",
    "11_TERRAIN_BANK_TURF",
    "12_TERRAIN_BANK_STONES",
    "13_TERRAIN_BANK_ROOT_TRANSITIONS",
    "14_TERRAIN_BANK_EROSION",
    "15_TERRAIN_BANK_FOLIAGE",
    "20_APPROVED_STATIC_BACKGROUND",
    "30_LIGHTING",
    "40_TREE_FAMILY_BLOCKED",
    "42_ROCK_ROOT_FORMATION_BLOCKED",
    "90_EXPORT_BLOCKED",
)

# Fixed, art-directed surface and lower silhouettes.  These are not sampled
# from collision and are not approved course coordinates.
TOP_PROFILE = (
    (-4.40, -0.16), (-3.72, -0.13), (-3.04, -0.09), (-2.38, -0.04), (-1.72, -0.02),
    (-1.15, -0.05), (-0.82, 0.02), (-0.35, 0.11), (0.20, 0.16),
    (0.78, 0.19), (1.34, 0.28), (1.88, 0.42), (2.40, 0.50),
    (2.92, 0.47), (3.42, 0.36), (3.92, 0.25), (4.42, 0.21),
    (4.94, 0.25), (5.46, 0.20), (5.94, 0.13), (6.36, 0.04),
    (6.62, -0.05), (7.20, -0.08), (7.82, -0.02), (8.42, 0.06),
    (9.02, 0.04), (9.60, -0.06), (10.10, -0.12),
)

LOWER_PROFILE = (
    (-4.40,-2.42), (-3.72,-2.55), (-3.04,-2.48), (-2.38,-2.60), (-1.72,-2.52),
    (-1.15,-2.62), (-0.82,-2.51), (-0.35,-2.58), (0.20,-2.66),
    (0.78,-2.56), (1.34,-2.61), (1.88,-2.52), (2.40,-2.68),
    (2.92,-2.57), (3.42,-2.63), (3.92,-2.50), (4.42,-2.62),
    (4.94,-2.54), (5.46,-2.66), (5.94,-2.55), (6.36,-2.61),
    (6.62,-2.52), (7.20,-2.63), (7.82,-2.56), (8.42,-2.65),
    (9.02,-2.54), (9.60,-2.62), (10.10,-2.48),
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
    for name in ("00_REFERENCE", "01_FROZEN_BOUNDARIES", "40_TREE_FAMILY_BLOCKED", "42_ROCK_ROOT_FORMATION_BLOCKED", "90_EXPORT_BLOCKED"):
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
    obj["verdant_vale_hero_asset"] = "terrain-bank"
    obj["authored_geometry"] = True
    obj["runtime_generated"] = False
    obj["integration_approved"] = False
    return obj


def bevel(obj, width=.02, segments=3):
    modifier = obj.modifiers.new("Hand softened edge", "BEVEL")
    modifier.width = width
    modifier.segments = segments
    modifier.limit_method = "ANGLE"
    return obj


def load_image(path):
    return bpy.data.images.load(str(path), check_existing=True)


def image_material(name, path, roughness, bump_strength, scale, value=1.0, saturation=1.0, box=True):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    texture = nodes.new("ShaderNodeTexImage")
    texture.image = load_image(path)
    texture.extension = "REPEAT"
    coordinate = nodes.new("ShaderNodeTexCoord")
    mapping = nodes.new("ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = scale
    grade = nodes.new("ShaderNodeHueSaturation")
    grade.inputs["Value"].default_value = value
    grade.inputs["Saturation"].default_value = saturation
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = bump_strength
    bump.inputs["Distance"].default_value = .055
    bsdf.inputs["Roughness"].default_value = roughness
    if box:
        texture.projection = "BOX"
        texture.projection_blend = .28
        links.new(coordinate.outputs["Generated"], mapping.inputs["Vector"])
    else:
        links.new(coordinate.outputs["UV"], mapping.inputs["Vector"])
    links.new(mapping.outputs["Vector"], texture.inputs["Vector"])
    links.new(texture.outputs["Color"], grade.inputs["Color"])
    links.new(grade.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(texture.outputs["Color"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])
    return material


def flat_material(name, color, roughness=.9, metallic=0.0):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    material.diffuse_color = (*color, 1.0)
    return material


def stone_material(name, color):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    coordinate = nodes.new("ShaderNodeTexCoord")
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 4.5
    noise.inputs["Detail"].default_value = 5.0
    noise.inputs["Roughness"].default_value = .72
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = .24
    ramp.color_ramp.elements[0].color = tuple(max(0.0, channel*.72) for channel in color)+(1.0,)
    ramp.color_ramp.elements[1].position = .78
    ramp.color_ramp.elements[1].color = tuple(min(1.0, channel*1.18) for channel in color)+(1.0,)
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = .24
    bump.inputs["Distance"].default_value = .035
    bsdf.inputs["Roughness"].default_value = .94
    links.new(coordinate.outputs["Generated"],noise.inputs["Vector"])
    links.new(noise.outputs["Fac"],ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"],bsdf.inputs["Base Color"])
    links.new(noise.outputs["Fac"],bump.inputs["Height"])
    links.new(bump.outputs["Normal"],bsdf.inputs["Normal"])
    links.new(bsdf.outputs["BSDF"],output.inputs["Surface"])
    material.diffuse_color=(*color,1.0)
    return material


def meadow_floor_material():
    """Broad, low-frequency meadow color under modeled blades and litter.

    A photographed top-down foliage texture collapses into horizontal scanlines
    at the locked side-view camera's grazing angle.  This material deliberately
    keeps the continuous skin quiet and mottled; authored grass, weeds, flowers,
    leaves, soil pockets, and overhang geometry supply the readable detail.
    """
    material=bpy.data.materials.new("VV Bank mottled living meadow floor")
    material.use_nodes=True
    nodes=material.node_tree.nodes
    links=material.node_tree.links
    nodes.clear()
    output=nodes.new("ShaderNodeOutputMaterial")
    bsdf=nodes.new("ShaderNodeBsdfPrincipled")
    coordinate=nodes.new("ShaderNodeTexCoord")
    mapping=nodes.new("ShaderNodeMapping")
    mapping.inputs["Scale"].default_value=(1.45,5.2,2.0)
    noise=nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value=3.6
    noise.inputs["Detail"].default_value=6.0
    noise.inputs["Roughness"].default_value=.72
    ramp=nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position=.22
    ramp.color_ramp.elements[0].color=(.035,.105,.012,1.0)
    ramp.color_ramp.elements[1].position=.78
    ramp.color_ramp.elements[1].color=(.24,.38,.045,1.0)
    middle=ramp.color_ramp.elements.new(.50)
    middle.color=(.09,.235,.022,1.0)
    bump=nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value=.25
    bump.inputs["Distance"].default_value=.025
    bsdf.inputs["Roughness"].default_value=.97
    links.new(coordinate.outputs["Generated"],mapping.inputs["Vector"])
    links.new(mapping.outputs["Vector"],noise.inputs["Vector"])
    links.new(noise.outputs["Fac"],ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"],bsdf.inputs["Base Color"])
    links.new(noise.outputs["Fac"],bump.inputs["Height"])
    links.new(bump.outputs["Normal"],bsdf.inputs["Normal"])
    links.new(bsdf.outputs["BSDF"],output.inputs["Surface"])
    material.diffuse_color=(.09,.235,.022,1.0)
    material["surface_role"]="quiet mottled substrate beneath modeled meadow ecology"
    return material


def surface_blend_material():
    material=bpy.data.materials.new("VV Living meadow height and vertex blend")
    material.use_nodes=True
    nodes=material.node_tree.nodes
    links=material.node_tree.links
    nodes.clear()
    output=nodes.new("ShaderNodeOutputMaterial")
    bsdf=nodes.new("ShaderNodeBsdfPrincipled")
    coordinate=nodes.new("ShaderNodeTexCoord")
    mapping=nodes.new("ShaderNodeMapping")
    mapping.inputs["Scale"].default_value=(7.0,1.0,1.0)
    turf=nodes.new("ShaderNodeTexImage")
    turf.image=load_image(TURF_PATH)
    turf.extension="REPEAT"
    soil=nodes.new("ShaderNodeTexImage")
    soil.image=load_image(SOIL_PATH)
    soil.extension="REPEAT"
    vertex_color=nodes.new("ShaderNodeVertexColor")
    vertex_color.layer_name="SurfaceBlend"
    blend=nodes.new("ShaderNodeMixRGB")
    blend.blend_type="MIX"
    blend.inputs[0].default_value=.72
    bump=nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value=.34
    bump.inputs["Distance"].default_value=.035
    bsdf.inputs["Roughness"].default_value=.95
    links.new(coordinate.outputs["UV"],mapping.inputs["Vector"])
    links.new(mapping.outputs["Vector"],turf.inputs["Vector"])
    links.new(mapping.outputs["Vector"],soil.inputs["Vector"])
    links.new(vertex_color.outputs["Color"],blend.inputs[0])
    links.new(soil.outputs["Color"],blend.inputs[1])
    links.new(turf.outputs["Color"],blend.inputs[2])
    links.new(blend.outputs["Color"],bsdf.inputs["Base Color"])
    links.new(blend.outputs["Color"],bump.inputs["Height"])
    links.new(bump.outputs["Normal"],bsdf.inputs["Normal"])
    links.new(bsdf.outputs["BSDF"],output.inputs["Surface"])
    material["blend_contract"]="SurfaceBlend vertex mask plus modeled height variation"
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
    coordinate = nodes.new("ShaderNodeTexCoord")
    bsdf.inputs["Base Color"].default_value = (0, 0, 0, 1)
    bsdf.inputs["Roughness"].default_value = 1.0
    bsdf.inputs["Emission Strength"].default_value = .68
    links.new(coordinate.outputs["UV"], texture.inputs["Vector"])
    links.new(texture.outputs["Color"], bsdf.inputs["Emission Color"])
    links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])
    return material


def make_materials():
    return {
        "soil": image_material("VV Bank authored grass-root-loam cross section", TERRAIN_CROSS_SECTION_PATH, .96, .48, (5.2, 1.0, 1.0), .82, .98, False),
        "soil_dark": image_material("VV Bank shaded erosion soil", SOIL_PATH, .98, .34, (6.2, 3.0, 2.9), .62, .90),
        "soil_transition": image_material("VV Bank disturbed soil transition", SOIL_PATH, .97, .40, (6.0, 3.0, 2.8), .72, .94),
        "soil_edge": flat_material("VV Bank erosion edge", (.145, .072, .026), .98),
        "turf": image_material("VV Bank meadow turf cap", TURF_PATH, .94, .30, (7.0, 1.0, 1.0), .98, 1.12, False),
        "meadow_patch": image_material("VV Bank clustered meadow ecology", TURF_PATH, .95, .24, (1.15, 1.15, 1.0), .92, .98, False),
        "meadow_floor": meadow_floor_material(),
        "surface_blend": surface_blend_material(),
        "turf_dark": flat_material("VV Bank shaded turf", (.045, .18, .020), .96),
        "turf_mid": flat_material("VV Bank living turf transition", (.12, .32, .040), .95),
        "turf_light": flat_material("VV Bank sunlit grass", (.23, .45, .075), .94),
        "turf_olive": flat_material("VV Bank meadow olive", (.16, .30, .035), .96),
        "moss": flat_material("VV Bank stone moss", (.075, .17, .025), .98),
        "leaf_gold": flat_material("VV Bank fallen leaf gold", (.31, .14, .020), .96),
        "leaf_brown": flat_material("VV Bank fallen leaf brown", (.18, .065, .018), .98),
        "stone": stone_material("VV Bank warm fieldstone", (.22, .19, .15)),
        "stone_cool": stone_material("VV Bank cool fieldstone", (.19, .21, .18)),
        "stone_dark": stone_material("VV Bank shaded fieldstone", (.16, .17, .14)),
        "stone_highlight": stone_material("VV Bank stone sun facet", (.27, .25, .21)),
        "stone_shadow": stone_material("VV Bank stone shadow facet", (.12, .13, .11)),
        "root": image_material("VV Bank embedded roots", BARK_PATH, .93, .38, (1.35, 1.1, 1.1), .76, .94),
        "cavity": flat_material("VV Bank cavity depth", (.055, .028, .012), 1.0),
        "flower_white": flat_material("VV Bank flower ivory", (.83, .79, .55), .88),
        "flower_gold": flat_material("VV Bank flower gold", (.95, .49, .035), .78),
        "flower_violet": flat_material("VV Bank flower violet", (.34, .15, .48), .84),
        "background": background_material(),
    }


def authored_bank_body(collection, material, top_surface_material):
    front_top = [(x, -.61, z-.045) for x, z in TOP_PROFILE]
    front_bottom = [(x, -.59, z) for x, z in LOWER_PROFILE]
    back_top = [(x, .69, z-.005) for x, z in TOP_PROFILE]
    back_bottom = [(x, .65, z-.025) for x, z in LOWER_PROFILE]
    vertices = front_top + front_bottom + back_top + back_bottom
    count = len(TOP_PROFILE)
    ft, fb, bt, bb = 0, count, count*2, count*3
    faces = []
    for i in range(count-1):
        faces.append((ft+i, ft+i+1, fb+i+1, fb+i))
        faces.append((bt+i+1, bt+i, bb+i, bb+i+1))
        faces.append((ft+i, bt+i, bt+i+1, ft+i+1))
        faces.append((fb+i+1, bb+i+1, bb+i, fb+i))
    faces.extend(((ft,fb,bb,bt),(ft+count-1,bt+count-1,bb+count-1,fb+count-1)))
    uvs={}
    min_x=TOP_PROFILE[0][0]
    max_x=TOP_PROFILE[-1][0]
    for index,(x,_) in enumerate(TOP_PROFILE):
        u=(x-min_x)/(max_x-min_x)
        uvs[ft+index]=(u,1.0)
        uvs[fb+index]=(u,0.0)
        uvs[bt+index]=(u,1.0)
        uvs[bb+index]=(u,0.0)
    body = mesh_object("VV_TerrainBank_HeroA_SoilBody", vertices, faces, collection, material,False,uvs)
    body.data.materials.append(top_surface_material)
    for segment_index in range(count-1):
        # Face order is front, back, top, bottom for every frozen segment.
        # Only the already-existing horizontal top polygons receive the quiet
        # surface-soil material; vertices, faces, bounds, and bevel are intact.
        body.data.polygons[segment_index*4+2].material_index=1
    body["craft"] = "fixed authored rolling bank silhouette with undercut lower edge"
    body["course_geometry"] = False
    body["collision_source"] = False
    body["surface_material_scope"] = "existing top faces only; frozen geometry unchanged"
    bevel(body, .045, 4)
    return body


def authored_turf_cap(collection, material):
    # A true top-surface skin covers the frozen body's horizontal face.  The
    # earlier narrow seam left the cross-section texture's painted grass row
    # visible across the depth of the bank, which read as a striped wall from
    # the gameplay camera.  This overlay adds no thickness and has no collision.
    top_front = [(x, -.84, z+.100) for x, z in TOP_PROFILE]
    top_back = [(x, .71, z+.095) for x, z in TOP_PROFILE]
    vertices = top_front + top_back
    count = len(TOP_PROFILE)
    tf,tb=0,count
    faces=[(tf+i,tf+i+1,tb+i+1,tb+i) for i in range(count-1)]
    uvs={}
    min_x=TOP_PROFILE[0][0]
    max_x=TOP_PROFILE[-1][0]
    for index,(x,_) in enumerate(TOP_PROFILE):
        u=(x-min_x)/(max_x-min_x)
        uvs[tf+index]=(u,0.0)
        uvs[tb+index]=(u,1.0)
    cap = mesh_object("VV_TerrainBank_HeroA_GrassOverhang", vertices, faces, collection, material,False,uvs)
    blend=cap.data.color_attributes.new(name="SurfaceBlend",type="FLOAT_COLOR",domain="POINT")
    soil_pocket_weights=(.98,.96,.94,.88,.56,.90,.98,.98,.94,.88,.52,.92,.98,.97,.92,.84,.93,.98,.98,.90,.54,.91,.98,.96,.86,.58,.92,.97)
    for index in range(count):
        weight=soil_pocket_weights[index]
        blend.data[tf+index].color=(weight,weight,weight,1.0)
        blend.data[tb+index].color=(min(1.0,weight+.08),)*3+(1.0,)
    cap["craft"] = "full-depth living meadow skin with vertex-painted soil pockets; overlays frozen top face without changing thickness"
    cap["course_geometry"] = False
    cap["surface_layer_depth_m"] = .30
    return cap


def profile_z(x):
    for index in range(len(TOP_PROFILE)-1):
        left_x,left_z=TOP_PROFILE[index]
        right_x,right_z=TOP_PROFILE[index+1]
        if left_x <= x <= right_x:
            alpha=(x-left_x)/(right_x-left_x)
            return left_z+(right_z-left_z)*alpha
    return TOP_PROFILE[0][1] if x < TOP_PROFILE[0][0] else TOP_PROFILE[-1][1]


def lower_profile_z(x):
    for index in range(len(LOWER_PROFILE)-1):
        left_x,left_z=LOWER_PROFILE[index]
        right_x,right_z=LOWER_PROFILE[index+1]
        if left_x <= x <= right_x:
            alpha=(x-left_x)/(right_x-left_x)
            return left_z+(right_z-left_z)*alpha
    return LOWER_PROFILE[0][1] if x < LOWER_PROFILE[0][0] else LOWER_PROFILE[-1][1]


def surface_overhang(name, x0, x1, drops, collection, material, shadow_material):
    count=len(drops)
    xs=[x0+(x1-x0)*index/(count-1) for index in range(count)]
    top_front=[(x,-.855,profile_z(x)+.070) for x in xs]
    lower_front=[(x,-.852,profile_z(x)-drops[index]) for index,x in enumerate(xs)]
    top_back=[(x,-.700,profile_z(x)+.066) for x in xs]
    lower_back=[(x,-.695,profile_z(x)-drops[index]*.56) for index,x in enumerate(xs)]
    vertices=top_front+lower_front+top_back+lower_back
    tf,lf,tb,lb=0,count,count*2,count*3
    faces=[]
    for index in range(count-1):
        faces.append((tf+index,tf+index+1,lf+index+1,lf+index))
        faces.append((tf+index,tb+index,tb+index+1,tf+index+1))
        faces.append((lf+index+1,lb+index+1,lb+index,lf+index))
    faces.extend(((tf,lf,lb,tb),(tf+count-1,tb+count-1,lb+count-1,lf+count-1)))
    uvs={}
    for index in range(count):
        u=index/(count-1)
        uvs[tf+index]=(u,1.0)
        uvs[lf+index]=(u,0.0)
        uvs[tb+index]=(u,1.0)
        uvs[lb+index]=(u,0.0)
    overhang=mesh_object(name,vertices,faces,collection,material,False,uvs)
    blend=overhang.data.color_attributes.new(name="SurfaceBlend",type="FLOAT_COLOR",domain="POINT")
    for index in range(count):
        top_weight=(.92,.78,.96,.84,.90)[index%5]
        lower_weight=(.12,.24,.08,.34,.16)[index%5]
        for vertex_index,weight in (
            (tf+index,top_weight),(tb+index,min(1.0,top_weight+.05)),
            (lf+index,lower_weight),(lb+index,lower_weight*.72),
        ):
            blend.data[vertex_index].color=(weight,weight,weight,1.0)
    overhang["craft"]="broken meadow overhang with vertex-painted grass-to-soil transition"
    overhang["surface_layer_depth_m"]=max(drops)
    bevel(overhang,.010,2)
    if max(drops) >= .10:
        deepest=max(range(count),key=lambda index:drops[index])
        x=xs[deepest]
        z=profile_z(x)-drops[deepest]*.92
        undercut=tube_curve(
            f"{name}_Undercut",((x-.13,-.870,z+.02),(x,-.874,z-.012),(x+.15,-.868,z+.025)),
            (.35,1.0,.22),collection,shadow_material,.012,2,
        )
        undercut["craft"]="localized soil recess beneath a turf collapse"
    return overhang


def build_surface_transition_band(collection, material):
    depths=(
        .12,.16,.11,.19,.14,.10,.17,.13,.20,.11,.16,.10,.18,.14,
        .11,.18,.12,.15,.10,.19,.13,.11,.17,.12,.18,.11,.15,.10,
    )
    # This opaque, soil-dominant face masks the old texture's painted green
    # border without changing the frozen soil mesh or its thickness.  Sparse
    # vertex-painted turf pockets bridge into the separate grass geometry;
    # critically, there is no continuously green row of vertices.
    contour_offsets=(
        .000,.012,-.006,.018,-.010,.004,.016,-.014,.008,-.004,.020,-.012,.006,.014,
        -.008,.010,-.016,.018,-.006,.004,.015,-.010,.008,-.014,.016,-.006,.010,.000,
    )
    top=[(x,-.862,z+.091+contour_offsets[index]) for index,(x,z) in enumerate(TOP_PROFILE)]
    lower=[(x,-.864,z-depths[index]) for index,(x,z) in enumerate(TOP_PROFILE)]
    vertices=top+lower
    count=len(TOP_PROFILE)
    faces=[(index,index+1,count+index+1,count+index) for index in range(count-1)]
    min_x=TOP_PROFILE[0][0]
    max_x=TOP_PROFILE[-1][0]
    uvs={}
    for index,(x,_) in enumerate(TOP_PROFILE):
        u=(x-min_x)/(max_x-min_x)
        uvs[index]=(u,1.0)
        uvs[count+index]=(u,.82)
    band=mesh_object("VV_SurfaceRootSoilTransitionBand",vertices,faces,collection,material,False,uvs)
    blend=band.data.color_attributes.new(name="SurfaceBlend",type="FLOAT_COLOR",domain="POINT")
    top_weights=(
        .16,.24,.66,.78,.30,.12,.52,.22,.08,.18,.72,.38,.10,.61,
        .29,.14,.81,.34,.11,.20,.67,.46,.13,.74,.27,.09,.56,.18,
    )
    lower_weights=(
        .05,.03,.14,.07,.04,.10,.03,.08,.02,.06,.12,.09,.03,.10,
        .05,.03,.13,.07,.02,.08,.11,.06,.03,.12,.05,.02,.09,.04,
    )
    for index in range(count):
        top_weight=top_weights[index]
        lower_weight=lower_weights[index]
        blend.data[index].color=(top_weight,top_weight,top_weight,1.0)
        blend.data[count+index].color=(lower_weight,lower_weight,lower_weight,1.0)
    band["craft"]="soil-dominant irregular transition with clustered turf pockets masking the former hard grass border"
    band["surface_layer_depth_m"]=max(depths)
    band["underground_soil_mutated"]=False
    bevel(band,.006,2)
    return band


def build_surface_overhangs(collection, mats):
    specs=(
        ("LeftCollapse",-3.12,-2.72,(.01,.05,.12,.07,.01)),
        ("PocketA",-.60,-.24,(.01,.03,.10,.06,.01)),
        ("Crown",2.22,2.66,(.01,.04,.11,.07,.01)),
        ("RightCollapse",5.60,6.02,(.01,.06,.13,.07,.01)),
        ("RightPocket",8.30,8.66,(.01,.03,.10,.05,.01)),
    )
    for label,x0,x1,drops in specs:
        surface_overhang(
            f"VV_SurfaceOverhang_{label}",x0,x1,drops,collection,mats["surface_blend"],mats["soil_edge"],
        )


def tube_curve(name, points, radii, collection, material, depth, resolution=3):
    curve = bpy.data.curves.new(f"{name}_Curve", "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = resolution
    curve.bevel_depth = depth
    curve.bevel_resolution = 4
    curve.materials.append(material)
    spline = curve.splines.new("BEZIER")
    spline.bezier_points.add(len(points)-1)
    for point, location, radius in zip(spline.bezier_points, points, radii):
        point.co = location
        point.radius = radius
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve)
    collection.objects.link(obj)
    obj["verdant_vale_hero_asset"] = "terrain-bank"
    obj["authored_geometry"] = True
    obj["runtime_generated"] = False
    obj["integration_approved"] = False
    return obj


def organic_disk(name, center, scale, collection, material, sides=9):
    cx,cy,cz=center
    factors=(1.0,.91,1.08,.94,1.04,.88,1.07,.92,1.02)
    vertices=[center]
    uvs={0:(.5,.5)}
    for index in range(sides):
        angle=math.tau*index/sides
        factor=factors[index%len(factors)]
        vertices.append((cx+math.cos(angle)*scale[0]*factor,cy,cz+math.sin(angle)*scale[1]*factor))
        uvs[index+1]=(.5+math.cos(angle)*.5,.5+math.sin(angle)*.5)
    faces=[]
    for index in range(sides):
        faces.append((0,index+1,(index+1)%sides+1))
    disk=mesh_object(name,vertices,faces,collection,material,False,uvs)
    bevel(disk,.004,2)
    return disk


STONE_OUTLINES = (
    ((-1.00,-.14),(-.70,-.78),(-.05,-1.00),(.72,-.72),(1.00,-.04),(.72,.64),(.08,1.00),(-.70,.62)),
    ((-1.00,-.28),(-.56,-.92),(.18,-1.00),(.86,-.58),(1.00,.14),(.46,.86),(-.20,1.00),(-.82,.54)),
    ((-.92,-.48),(-.32,-1.00),(.42,-.88),(1.00,-.24),(.74,.62),(.12,1.00),(-.68,.76),(-1.00,.08)),
)


def embedded_stone(name, center, scale, outline, collection, material, soil_cover_material, highlight_material, shadow_material, moss_material=None):
    cx, cy, cz = center
    sides = len(outline)
    rim = [(cx+px*scale[0], cy+.045, cz+pz*scale[1]) for px,pz in outline]
    crown = [(cx+px*scale[0]*.63, cy-.075, cz+pz*scale[1]*.63) for px,pz in outline]
    center_vertex = (cx-scale[0]*.05, cy-.125, cz+scale[1]*.08)
    back = [(x, cy+.23, z) for x,_,z in rim]
    vertices = rim + crown + [center_vertex] + back
    crown_start = sides
    center_index = sides*2
    back_start = center_index+1
    faces = []
    for i in range(sides):
        nxt = (i+1)%sides
        faces.append((i,nxt,crown_start+nxt,crown_start+i))
    for i in range(sides):
        nxt = (i+1)%sides
        faces.append((crown_start+i,crown_start+nxt,center_index))
    for i in range(sides):
        nxt = (i+1)%sides
        faces.append((i,back_start+i,back_start+nxt,nxt))
    faces.append(tuple(reversed(range(back_start,back_start+sides))))
    obj = mesh_object(name, vertices, faces, collection, material)
    obj.data.materials.append(highlight_material)
    obj.data.materials.append(shadow_material)
    for polygon_index, polygon in enumerate(obj.data.polygons):
        if polygon_index < sides:
            polygon.material_index = 1 if polygon_index in (4,5,6) else (2 if polygon_index in (0,1) else 0)
        elif polygon_index < sides*2:
            polygon.material_index = 1 if polygon_index-sides in (4,5,6,7) else (2 if polygon_index-sides in (0,1) else 0)
        else:
            polygon.material_index = 2
    obj["craft"] = "individually authored convex fieldstone with real faceted relief"
    for polygon in obj.data.polygons:
        polygon.use_smooth=True
    subdivision=obj.modifiers.new("Sculpted fieldstone roundness","SUBSURF")
    subdivision.subdivision_type="CATMULL_CLARK"
    subdivision.levels=1
    subdivision.render_levels=1
    bevel(obj, .018, 2)
    soil_seam=(
        (cx-scale[0]*.76,cy-.158,cz-scale[1]*.64),
        (cx-scale[0]*.28,cy-.162,cz-scale[1]*.48),
        (cx+scale[0]*.18,cy-.164,cz-scale[1]*.56),
        (cx+scale[0]*.72,cy-.158,cz-scale[1]*.67),
    )
    cover=tube_curve(f"{name}_BuriedEdge",soil_seam,(1.0,.78,.58,.22),collection,soil_cover_material,.018,2)
    cover["craft"]="broken soil seam that visually buries the lower fieldstone edge"
    burial_patch=(
        (cx-scale[0]*.92,cy-.172,cz-scale[1]*.16),
        (cx-scale[0]*.48,cy-.176,cz+scale[1]*.02),
        (cx-scale[0]*.06,cy-.178,cz-scale[1]*.08),
        (cx+scale[0]*.38,cy-.176,cz+scale[1]*.01),
        (cx+scale[0]*.88,cy-.172,cz-scale[1]*.18),
        (cx+scale[0]*.80,cy-.170,cz-scale[1]*1.10),
        (cx-scale[0]*.84,cy-.170,cz-scale[1]*1.10),
    )
    min_x=TOP_PROFILE[0][0]
    max_x=TOP_PROFILE[-1][0]
    burial_uvs={}
    for index,(x,_,z) in enumerate(burial_patch):
        top=profile_z(x)-.045
        bottom=lower_profile_z(x)
        burial_uvs[index]=((x-min_x)/(max_x-min_x),max(0.0,min(1.0,(z-bottom)/(top-bottom))))
    buried=mesh_object(
        f"{name}_SoilPocket",burial_patch,[tuple(range(len(burial_patch)))],collection,soil_cover_material,False,burial_uvs,
    )
    buried["craft"]="irregular soil pocket covering most of the embedded stone"
    bevel(buried,.008,2)
    if moss_material:
        moss_specs=(
            (-.30,.54,.17,.10),(-.02,.60,.15,.08),(.22,.54,.12,.075),
        )
        for moss_index,(offset_x,offset_z,width,height) in enumerate(moss_specs):
            moss=organic_disk(
                f"{name}_Moss_{moss_index}",
                (cx+scale[0]*offset_x,cy-.168,cz+scale[1]*offset_z),
                (scale[0]*width,scale[1]*height),collection,moss_material,8,
            )
            moss["craft"]="small modeled moss colony following the stone crown"
    return obj


def build_stones(collection, mats):
    placements = (
        (-2.92,.19,(.23,.16),2,True),(-2.61,.22,(.10,.075),0,False),(-2.42,.20,(.075,.055),1,False),
        (2.78,.20,(.25,.17),0,False),(3.10,.22,(.11,.075),2,False),
        (7.36,.19,(.22,.15),1,True),(7.65,.22,(.095,.065),0,False),(7.84,.20,(.07,.052),2,False),
    )
    for index,(x,depth,scale,variant,moss) in enumerate(placements):
        z=profile_z(x)-depth
        stone_material=(mats["stone"],mats["stone_cool"],mats["stone_dark"])[index%3]
        embedded_stone(
            f"VV_TerrainBank_EmbeddedStone_{index+1:02}",(x,-.735,z),scale,
            STONE_OUTLINES[variant],collection,stone_material,mats["soil"],mats["stone_highlight"],mats["stone_shadow"],mats["moss"] if moss else None,
        )


def erosion_pocket(name, center, scale, collection, mats):
    cx,cz=center
    outline=STONE_OUTLINES[1]
    inner=[(cx+px*scale[0]*.72,-.77,cz+pz*scale[1]*.68) for px,pz in outline]
    cavity=mesh_object(f"{name}_Depth",inner,[tuple(range(len(inner)))],collection,mats["soil_dark"])
    upper=(
        (cx-scale[0]*.72,-.785,cz+scale[1]*.12),
        (cx-scale[0]*.18,-.792,cz+scale[1]*.66),
        (cx+scale[0]*.58,-.785,cz+scale[1]*.34),
    )
    lower=(
        (cx-scale[0]*.48,-.790,cz-scale[1]*.38),
        (cx+scale[0]*.12,-.795,cz-scale[1]*.62),
        (cx+scale[0]*.58,-.788,cz-scale[1]*.22),
    )
    tube_curve(f"{name}_UpperCut",upper,(1,.72,.24),collection,mats["soil_dark"],.020,2)
    tube_curve(f"{name}_LowerCrumb",lower,(.40,.70,.20),collection,mats["soil_edge"],.010,2)
    cavity["craft"]="irregular eroded pocket with broken upper lip, never a decorative ring"
    return cavity


def build_erosion(collection, mats):
    strata = (
        ((-3.98,-.752,-1.16),(-3.44,-.754,-1.22),(-2.92,-.752,-1.18)),
        ((-2.36,-.752,-.32),(-1.88,-.754,-.38),(-1.44,-.752,-.34)),
        ((-.20,-.752,-.17),(.35,-.754,-.22),(.72,-.754,-.18)),
        ((1.38,-.752,-.48),(1.78,-.754,-.52),(2.30,-.752,-.49)),
        ((3.22,-.752,-.22),(3.68,-.754,-.27),(4.06,-.752,-.24)),
        ((4.70,-.752,-.55),(5.14,-.754,-.58),(5.48,-.752,-.52)),
        ((6.46,-.752,-1.08),(6.92,-.754,-1.14),(7.42,-.752,-1.10)),
        ((7.84,-.752,-.34),(8.38,-.754,-.39),(8.92,-.752,-.35)),
        ((-.56,-.752,-1.98),(.04,-.754,-2.02),(.58,-.752,-1.96)),
        ((2.08,-.752,-2.14),(2.62,-.754,-2.18),(3.18,-.752,-2.12)),
        ((5.02,-.752,-1.92),(5.52,-.754,-1.98),(6.08,-.752,-1.91)),
    )
    for index,points in enumerate(strata):
        tube_curve(f"VV_TerrainBank_ErosionStratum_{index+1:02}",points,(1,.72,.35),collection,mats["soil_edge"],.012,2)


def build_roots(collection, mats):
    systems=(
        (
            "LeftTreeZone",-3.70,
            (
                ((-.04,-.06),(.16,-.09),(.38,-.18),(.62,-.30)),
                ((.14,-.10),(-.04,-.19),(-.22,-.31)),
                ((.34,-.18),(.48,-.29),(.54,-.43)),
            ),
        ),
        (
            "RightTreeZone",6.82,
            (
                ((.04,-.05),(-.16,-.10),(-.36,-.19),(-.58,-.32)),
                ((-.14,-.11),(.06,-.21),(.24,-.34)),
                ((-.34,-.19),(-.46,-.31),(-.52,-.45)),
            ),
        ),
    )
    for system_name,source_x,branches in systems:
        source=bpy.data.objects.new(f"VV_SurfaceRootSource_{system_name}",None)
        collection.objects.link(source)
        source.location=(source_x,-.72,profile_z(source_x)+.015)
        source.hide_render=True
        source["source_role"]="subsurface tree-root crown; trunk remains outside surface-layer scope"
        source["visible_root_fraction"]="minority"
        for branch_index,offsets in enumerate(branches):
            points=[]
            for dx,dz in offsets:
                x=source_x+dx
                points.append((x,-.825,profile_z(source_x)+dz))
            if branch_index==0:
                radii=(1.0,.72,.40,.14)
                depth=.045
            else:
                radii=(.58,.32,.10)
                depth=.026
            root=tube_curve(
                f"VV_SurfaceRoot_{system_name}_{branch_index+1}",tuple(points),radii,collection,mats["root"],depth,3,
            )
            root.parent=source
            root.matrix_parent_inverse=source.matrix_world.inverted()
            root["craft"]="tree-sourced root branching from hidden crown and disappearing into soil"
            root["root_source"]=source.name


def grass_blade(name, base, height, lean, width, collection, material):
    x,y,z=base
    width*=1.35
    vertices=[
        (x-width,y,z),(x+width,y,z),(x+lean+width*.24,y-.006,z+height*.70),
        (x+lean,y,z+height),(x+lean-width*.24,y+.006,z+height*.70),
    ]
    return mesh_object(name,vertices,[(0,1,2,3,4)],collection,material)


def grass_tuft(name, center_x, y, scale, collection, material):
    """One optimized mesh containing a varied seven-blade meadow tuft."""
    pattern=(
        (-.18,.10,-.065,.012),(-.12,.16,-.048,.016),(-.065,.23,-.022,.020),
        (0,.29,.016,.024),(.065,.21,.048,.020),(.125,.15,.075,.016),(.19,.09,.052,.011),
    )
    vertices=[]
    faces=[]
    for dx,height,lean,width in pattern:
        x=center_x+dx*scale
        z=profile_z(x)+.060
        width*=scale*1.30
        lean*=scale
        height*=scale
        start=len(vertices)
        vertices.extend((
            (x-width,y,z),(x+width,y,z),(x+lean+width*.24,y-.006,z+height*.70),
            (x+lean,y,z+height),(x+lean-width*.24,y+.006,z+height*.70),
        ))
        faces.append(tuple(range(start,start+5)))
    tuft=mesh_object(name,vertices,faces,collection,material)
    tuft["craft"]="optimized multi-blade tuft with authored height, width, and lean variation"
    tuft["surface_layer_depth_m"]=min(.30,.24*scale)
    return tuft


def hanging_turf_tongue(name, x, z, width, depth, lean, collection, material):
    vertices = [
        (x-width,-.822,z+.035),(x+width,-.822,z+.035),
        (x+width*.82+lean*.30,-.827,z-depth*.30),
        (x+width*.30+lean*.78,-.831,z-depth*.72),
        (x+lean,-.832,z-depth),
        (x-width*.30+lean*.70,-.829,z-depth*.68),
        (x-width*.78+lean*.22,-.825,z-depth*.28),
    ]
    tongue=mesh_object(name,vertices,[tuple(range(len(vertices)))],collection,material)
    tongue["craft"]="authored hanging turf edge that bridges grass into exposed soil"
    bevel(tongue,.008,2)
    return tongue


def fallen_leaf(name, x, z, scale, lean, collection, material):
    points=((-.85,0),(-.35,.45),(0,.68),(.52,.40),(.88,0),(.34,-.38),(0,-.72),(-.42,-.34))
    vertices=[(x+px*scale,-.868,z+pz*scale*.52+lean*px*scale) for px,pz in points]
    leaf=mesh_object(name,vertices,[tuple(range(len(vertices)))],collection,material)
    leaf["craft"]="fallen leaf placed inside a clustered meadow litter pocket"
    bevel(leaf,.004,2)
    return leaf


def top_soil_pocket(name, x, y, scale, collection, material):
    z=profile_z(x)+.058
    outline=STONE_OUTLINES[1]
    vertices=[(x+px*scale[0],y+pz*scale[1],z+(index%3)*.0015) for index,(px,pz) in enumerate(outline)]
    pocket=mesh_object(name,vertices,[tuple(range(len(vertices)))],collection,material)
    pocket["craft"]="small exposed-soil pocket interrupting the meadow top"
    bevel(pocket,.006,2)
    return pocket


def meadow_flower(name, x, height, material, collection, mats):
    base_z=profile_z(x)+.055
    tube_curve(
        f"{name}_Stem",((x,-.846,base_z),(x+.014,-.850,base_z+height)),
        (1,.42),collection,mats["turf_dark"],.007,2,
    )
    center=(x+.014,-.858,base_z+height)
    petals=[]
    for petal in range(5):
        angle=math.tau*petal/5
        petals.extend((
            center,
            (center[0]+math.cos(angle)*.040,center[1],center[2]+math.sin(angle)*.040),
            (center[0]+math.cos(angle+.36)*.020,center[1]-.002,center[2]+math.sin(angle+.36)*.020),
        ))
    flower=mesh_object(name,petals,[(i,i+1,i+2) for i in range(0,len(petals),3)],collection,material)
    flower["craft"]="clustered meadow flower; never evenly distributed"
    return flower


def build_foliage(collection, mats):
    # Low, overlapping moss/ground-cover cushions are deliberately authored in
    # colonies with broad gaps.  They hide neither the soil nor every root;
    # instead they break the former continuous green ribbon into living masses.
    cushion_specs=(
        (-4.22,.24,.070,"turf_dark"),(-3.94,.32,.095,"turf_mid"),(-3.58,.20,.060,"turf_olive"),
        (-3.05,.36,.105,"turf_mid"),(-2.70,.28,.085,"turf_light"),(-2.34,.22,.065,"turf_dark"),
        (-1.64,.26,.075,"turf_olive"),(-1.30,.20,.060,"turf_mid"),
        (-.70,.34,.100,"turf_mid"),(-.28,.27,.078,"turf_light"),(.08,.20,.060,"turf_dark"),
        (.72,.24,.070,"turf_olive"),(1.08,.38,.110,"turf_mid"),(1.52,.25,.072,"turf_light"),
        (2.04,.20,.058,"turf_dark"),(2.54,.32,.096,"turf_mid"),(2.92,.24,.070,"turf_olive"),
        (3.66,.28,.082,"turf_dark"),(4.02,.36,.106,"turf_mid"),(4.44,.23,.068,"turf_light"),
        (5.18,.20,.060,"turf_olive"),(5.58,.34,.102,"turf_mid"),(6.00,.25,.074,"turf_dark"),
        (6.74,.30,.090,"turf_mid"),(7.12,.20,.060,"turf_light"),
        (7.68,.36,.108,"turf_mid"),(8.12,.27,.080,"turf_olive"),(8.54,.21,.062,"turf_dark"),
        (9.18,.31,.092,"turf_mid"),(9.56,.22,.066,"turf_light"),(9.88,.18,.052,"turf_dark"),
    )
    colony_lobes=((-0.48,.00,.58,.78),(0,.018,.78,1.00),(.46,-.006,.52,.70))
    for cushion_index,(x,width,height,_material_name) in enumerate(cushion_specs):
        for lobe_index,(x_factor,z_offset,width_factor,height_factor) in enumerate(colony_lobes):
            lobe_x=x+x_factor*width
            cushion=organic_disk(
                f"VV_SurfaceEcologyCushion_{cushion_index:02}_{lobe_index}",
                (lobe_x,-.880-lobe_index*.001,profile_z(lobe_x)+.040+z_offset),
                (width*width_factor,height*height_factor),collection,mats["meadow_patch"],9,
            )
            cushion["ecology_cluster"]=f"cushion-{cushion_index//3}"
            cushion["craft"]="overlapping mottled moss and ground-cover lobe crossing the grass-soil seam"
            cushion["surface_layer_depth_m"]=min(.30,height*2)

    # Three staggered depth rows turn the locked shallow top plane into a
    # readable meadow canopy at the side camera.  The rows use different gaps
    # and scales, so they never collapse into a picket fence or haircut.
    tuft_rows=(
        (-.825,(
            (-4.18,.78,0),(-3.78,1.04,1),(-3.12,.86,3),(-2.72,1.12,2),(-2.18,.72,0),
            (-1.46,.94,1),(-.92,1.10,3),(-.30,.80,0),(.28,1.02,2),(.92,.74,1),
            (1.54,1.16,3),(2.16,.82,0),(2.82,1.02,2),(3.48,.76,1),(4.06,1.12,3),
            (4.72,.84,0),(5.34,1.08,2),(6.02,.72,1),(6.74,1.14,3),(7.42,.80,0),
            (8.04,1.06,2),(8.68,.76,1),(9.30,1.12,3),(9.82,.82,0),
        )),
        (-.36,(
            (-4.02,.68,2),(-3.58,.92,0),(-3.16,.74,3),(-2.72,.82,1),
            (-1.18,.72,2),(-.74,.90,0),(-.30,.76,3),
            (1.02,1.02,1),(1.48,.70,2),(1.94,.94,0),
            (3.92,.78,3),(4.38,1.00,1),(4.86,.72,2),
            (6.66,.76,3),(7.10,1.02,1),(7.52,.70,2),
            (8.62,.94,0),(9.08,.78,3),(9.52,.88,1),
        )),
        (.18,(
            (-3.34,.60,1),(-2.88,.78,3),(-2.42,.64,0),
            (.30,.82,2),(.76,.62,1),(1.18,.80,3),
            (2.94,.66,0),(3.40,.84,2),(3.84,.60,1),
            (5.58,.78,3),(6.04,.64,0),(6.48,.82,2),
            (8.02,.62,1),(8.48,.80,3),(8.92,.66,0),
        )),
    )
    grass_materials=(mats["turf_dark"],mats["turf_mid"],mats["turf_light"],mats["turf_olive"])
    for row_index,(y,row) in enumerate(tuft_rows):
        for tuft_index,(x,scale,material_index) in enumerate(row):
            tuft=grass_tuft(
                f"VV_SurfaceCanopyTuft_{row_index}_{tuft_index:02}",x,y,scale,
                collection,grass_materials[material_index],
            )
            tuft["ecology_cluster"]=f"depth-row-{row_index}-colony-{tuft_index//3}"

    tongue_specs=(
        (-3.72,.08,.12,-.025),(-2.46,.10,.16,.030),(-.40,.07,.10,-.020),
        (1.36,.09,.14,.025),(3.92,.075,.11,-.025),(5.70,.10,.17,.035),
        (7.84,.08,.13,-.030),(9.34,.07,.10,.020),
    )
    for tongue_index,(x,width,depth,lean) in enumerate(tongue_specs):
        tongue=hanging_turf_tongue(
            f"VV_SurfaceTurfTongue_{tongue_index}",x,profile_z(x)+.090,
            width,depth,lean,collection,mats["turf_dark"] if tongue_index%3 else mats["turf_olive"],
        )
        tongue["surface_layer_depth_m"]=depth

    variants={
        "small":((-.10,.11,-.050,.011,0),(-.04,.16,-.025,.014,1),(.03,.22,.020,.018,2),(.10,.12,.055,.011,3)),
        "medium":((-.20,.12,-.065,.012,1),(-.15,.18,-.050,.015,3),(-.09,.27,-.020,.020,0),(-.02,.36,.018,.024,2),(.06,.29,.052,.020,3),(.13,.21,.070,.016,1),(.20,.13,.030,.012,0)),
        "lush":((-.32,.12,-.075,.011,0),(-.26,.18,-.060,.014,2),(-.20,.27,-.042,.019,3),(-.13,.36,-.018,.023,1),(-.06,.43,.012,.027,2),(.02,.50,.038,.030,1),(.10,.39,.070,.024,3),(.17,.31,.082,.021,2),(.23,.24,.052,.018,1),(.29,.17,.020,.014,3),(.34,.11,-.025,.010,0)),
        "weeds":((-.18,.15,-.090,.009,3),(-.12,.24,-.075,.011,1),(-.07,.43,-.040,.014,0),(-.01,.58,.010,.016,3),(.06,.48,.045,.014,1),(.12,.31,.075,.011,2),(.18,.17,.095,.009,0)),
    }
    clusters=(
        (-4.18,"medium",0),(-3.58,"small",1),(-2.72,"lush",0),(-2.16,"medium",2),
        (-1.08,"small",3),(-.32,"weeds",0),(.58,"medium",1),(1.42,"lush",0),
        (2.18,"small",2),(3.16,"medium",3),(4.46,"lush",1),(5.02,"small",0),
        (6.12,"weeds",2),(6.92,"medium",0),(7.92,"lush",1),(8.72,"small",3),(9.54,"medium",2),
    )
    grass_materials=(mats["turf_dark"],mats["turf_mid"],mats["turf_light"],mats["turf_olive"])
    for cluster_index,(center_x,variant_name,color_shift) in enumerate(clusters):
        base_z=profile_z(center_x)+.055
        for blade_index,(dx,height,lean,width,material_index) in enumerate(variants[variant_name]):
            blade=grass_blade(
                f"VV_SurfaceGrass_{cluster_index:02}_{blade_index}",
                (center_x+dx,-.842-(blade_index%3)*.006,base_z),height,lean,width,
                collection,grass_materials[(material_index+color_shift)%len(grass_materials)],
            )
            blade["ecology_cluster"]=cluster_index
            blade["spacing_rule"]="fixed irregular authored cluster"

    micro_variants=(
        ((-.055,.09,-.028,.010,0),(0,.14,.012,.013,2),(.062,.08,.038,.009,1)),
        ((-.072,.11,-.040,.011,3),(-.018,.17,-.008,.014,1),(.048,.13,.032,.012,2),(.092,.07,.052,.008,0)),
        ((-.044,.08,-.018,.009,1),(.018,.12,.025,.011,3),(.070,.16,.048,.013,2)),
        ((-.085,.07,-.045,.008,0),(-.030,.13,-.018,.012,2),(.032,.18,.020,.014,1),(.090,.10,.055,.010,3)),
    )
    micro_groups=(
        (-4.30,0),(-4.08,2),(-3.84,1),
        (-3.28,3),(-3.06,0),(-2.82,2),(-2.56,1),
        (-1.92,2),(-1.70,0),(-1.48,3),
        (-.90,1),(-.68,2),(-.42,0),(-.18,3),
        (.36,2),(.62,1),(.88,0),(1.16,3),(1.72,1),(1.96,2),
        (2.68,0),(2.94,3),(3.22,1),(3.54,2),
        (4.12,0),(4.40,1),(4.66,3),(5.14,2),(5.38,0),
        (6.02,1),(6.30,3),(6.58,0),(7.10,2),(7.38,1),(7.66,3),
        (8.20,0),(8.48,2),(8.78,1),(9.18,3),(9.42,0),(9.72,2),(9.94,1),
    )
    for group_index,(center_x,variant_index) in enumerate(micro_groups):
        base_z=profile_z(center_x)+.052
        for blade_index,(dx,height,lean,width,material_index) in enumerate(micro_variants[variant_index]):
            blade=grass_blade(
                f"VV_SurfaceMicroGrass_{group_index:02}_{blade_index}",
                (center_x+dx,-.844-(blade_index%2)*.004,base_z),height,lean,width,
                collection,grass_materials[(material_index+group_index)%4],
            )
            blade["ecology_cluster"]=f"micro-{group_index}"
            blade["spacing_rule"]="clustered baseline with authored gaps"

    isolated=(
        (-3.24,.23,-.04,.014),(-1.66,.16,.05,.011),(.08,.31,-.02,.014),
        (2.70,.20,.06,.012),(3.86,.28,-.05,.014),(5.56,.17,.03,.011),(8.34,.26,-.04,.013),(9.90,.18,.05,.012),
    )
    for index,(x,height,lean,width) in enumerate(isolated):
        grass_blade(
            f"VV_SurfaceIsolatedBlade_{index}",(x,-.846,profile_z(x)+.055),height,lean,width,
            collection,grass_materials[(index*3)%4],
        )

    ground_cover=(
        (-3.86,.040),(-2.48,.050),(-2.28,.035),(.82,.045),(1.08,.055),
        (4.18,.050),(4.64,.040),(6.70,.045),(7.64,.055),(8.06,.040),(9.30,.045),
    )
    for cover_index,(x,scale) in enumerate(ground_cover):
        z=profile_z(x)+.035
        for leaf_index,(dx,dz) in enumerate(((-.035,.012),(.030,.018),(0,-.018))):
            leaf=organic_disk(
                f"VV_SurfaceGroundCover_{cover_index:02}_{leaf_index}",
                (x+dx,-.870,z+dz),(scale,scale*.62),collection,
                mats["turf_light"] if leaf_index==1 else mats["turf_mid"],8,
            )
            leaf["ecology_cluster"]=cover_index

    for pocket_index,(x,y,sx,sy) in enumerate((
        (-3.22,-.36,.20,.14),(-1.42,-.28,.14,.10),(2.50,-.42,.18,.12),(5.72,-.32,.16,.11),(8.90,-.40,.19,.13),
    )):
        top_soil_pocket(f"VV_SurfaceSoilPocket_{pocket_index}",x,y,(sx,sy),collection,mats["soil_transition"])

    leaf_specs=(
        (-3.12,.035,.047,-.18,"leaf_brown"),(-2.96,.045,.040,.12,"leaf_gold"),
        (.96,.045,.045,.16,"leaf_gold"),(1.10,.040,.038,-.10,"leaf_brown"),
        (5.44,.030,.046,-.14,"leaf_brown"),(5.58,.042,.039,.18,"leaf_gold"),
        (8.48,.050,.043,.10,"leaf_gold"),
    )
    for index,(x,z_offset,scale,lean,material_name) in enumerate(leaf_specs):
        fallen_leaf(
            f"VV_SurfaceFallenLeaf_{index}",x,profile_z(x)+z_offset,scale,lean,collection,mats[material_name],
        )

    flowers=(
        (-2.82,.19,"flower_white"),(-2.62,.15,"flower_violet"),(-2.48,.22,"flower_gold"),
        (1.24,.18,"flower_gold"),(1.46,.25,"flower_white"),
        (4.34,.20,"flower_violet"),(4.56,.16,"flower_white"),
        (7.76,.24,"flower_gold"),(7.98,.17,"flower_violet"),(8.14,.21,"flower_white"),
        (9.48,.18,"flower_white"),
    )
    for index,(x,height,material_name) in enumerate(flowers):
        meadow_flower(f"VV_SurfaceFlower_{index}",x,height,mats[material_name],collection,mats)


def install_reference(name, path, role, collection):
    image = load_image(path)
    obj = bpy.data.objects.new(name, None)
    collection.objects.link(obj)
    obj.empty_display_type = "IMAGE"
    obj.data = image
    obj.hide_render = True
    obj.hide_viewport = True
    obj["reference_role"] = role
    obj["non_rendering_reference"] = True
    obj["filepath"] = str(path.relative_to(ROOT)).replace("\\", "/")


def build_contract_markers(collections):
    install_reference("VV_REF_QualityTarget",TARGET_PATH,"sole-quality-target",collections["00_REFERENCE"])
    install_reference("VV_REF_CurrentGameplay",CURRENT_PATH,"current-gameplay-only",collections["00_REFERENCE"])
    marker=bpy.data.objects.new("VV_REVIEW_ONLY_TerrainBankOrigin",None)
    collections["01_FROZEN_BOUNDARIES"].objects.link(marker)
    marker.location=(REVIEW_ORIGIN_X,0,0)
    marker.hide_render=True
    marker["not_gameplay_coordinate"]=True
    marker["not_integration_anchor"]=True
    marker["collision_mutated"]=False
    marker["protected_gameplay_fingerprint"]="a00bf81913452518d3ed7cbc0e8e2a60c3fc7e2b34e5f9762322fcb23acf58d9"
    for collection_name,asset_name in (
        ("40_TREE_FAMILY_BLOCKED","tree-family"),("42_ROCK_ROOT_FORMATION_BLOCKED","rock-root-formation"),("90_EXPORT_BLOCKED","integration-export"),
    ):
        blocked=bpy.data.objects.new(f"VV_BLOCKED_{asset_name}",None)
        collections[collection_name].objects.link(blocked)
        blocked.hide_render=True
        blocked["status"]="BLOCKED_UNTIL_TERRAIN_BANK_VISUAL_APPROVAL"


def look_at(obj, target):
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat("-Z","Y").to_euler()


def build_camera_and_lighting(collections):
    data=bpy.data.cameras.new("VV_CAM_TerrainBankQualityGate")
    data.type="ORTHO"
    data.ortho_scale=14.0
    camera=bpy.data.objects.new("VV_CAM_TerrainBankQualityGate",data)
    collections["01_FROZEN_BOUNDARIES"].objects.link(camera)
    camera.location=(CAMERA_FOCUS_X,-18,4.0)
    look_at(camera,(CAMERA_FOCUS_X,0,1.48))
    camera["camera_role"]="terrain-bank review only; never runtime"
    camera["gameplay_layout_mutated"]=False
    bpy.context.scene.camera=camera

    detail_data=bpy.data.cameras.new("VV_CAM_TerrainBankDetailGate")
    detail_data.type="ORTHO"
    detail_data.ortho_scale=9.0
    detail=bpy.data.objects.new("VV_CAM_TerrainBankDetailGate",detail_data)
    collections["01_FROZEN_BOUNDARIES"].objects.link(detail)
    detail.location=(2.72,-18,3.15)
    look_at(detail,(2.72,0,.45))
    detail["camera_role"]="supplemental terrain craftsmanship inspection; never runtime"

    sun_data=bpy.data.lights.new("VV_TerrainBank_Sun","SUN")
    sun_data.energy=1.55
    sun_data.angle=math.radians(11)
    sun_data.color=(1.0,.78,.55)
    sun=bpy.data.objects.new("VV_TerrainBank_Sun",sun_data)
    collections["30_LIGHTING"].objects.link(sun)
    sun.location=(-5,-7,9)
    look_at(sun,(2.7,0,0))

    key_data=bpy.data.lights.new("VV_TerrainBank_WarmKey","AREA")
    key_data.energy=520
    key_data.shape="DISK"
    key_data.size=5.0
    key_data.color=(1.0,.72,.43)
    key=bpy.data.objects.new("VV_TerrainBank_WarmKey",key_data)
    collections["30_LIGHTING"].objects.link(key)
    key.location=(-3.4,-5.2,6.2)
    look_at(key,(2.6,0,-.1))

    fill_data=bpy.data.lights.new("VV_TerrainBank_SkyFill","AREA")
    fill_data.energy=235
    fill_data.shape="RECTANGLE"
    fill_data.size=8
    fill_data.size_y=4
    fill_data.color=(.34,.56,1.0)
    fill=bpy.data.objects.new("VV_TerrainBank_SkyFill",fill_data)
    collections["30_LIGHTING"].objects.link(fill)
    fill.location=(6,-3.0,4.5)
    look_at(fill,(2.8,0,-.2))
    return camera


def build_static_background(collections, mats):
    camera=bpy.context.scene.camera
    rotation=camera.rotation_euler.to_quaternion()
    forward=rotation @ Vector((0,0,-1))
    right=rotation @ Vector((1,0,0))
    up=rotation @ Vector((0,1,0))
    center=camera.location+forward*24.0
    vertices=[
        tuple(center-right*7.20-up*4.05),tuple(center+right*7.20-up*4.05),
        tuple(center+right*7.20+up*4.05),tuple(center-right*7.20+up*4.05),
    ]
    obj=mesh_object("VV_APPROVED_STATIC_Background",vertices,[(0,1,2,3)],collections["20_APPROVED_STATIC_BACKGROUND"],mats["background"],False,{0:(0,0),1:(1,0),2:(1,1),3:(0,1)})
    obj["verdant_vale_hero_asset"]="approved-static-background"
    obj["authored_geometry"]=False
    obj["source"]="assets/textures/world-1/meadow-wake/verdant-vale-background-v1.png"
    obj["locked"]=True
    obj["blender_modeling_prohibited"]=True


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
    background.inputs["Color"].default_value=(.12,.30,.42,1)
    background.inputs["Strength"].default_value=.12
    scene["asset_kit"]="Verdant Vale environment kit"
    scene["quality_gate_asset"]="terrain-bank"
    scene["visual_approval"]="PENDING"
    scene["production_approved"]=False
    scene["background_status"]="APPROVED STATIC LAYER - UNMODIFIED"
    scene["gameplay_layout_status"]="FROZEN - UNMODIFIED"
    scene["collision_status"]="FROZEN - UNMODIFIED"
    scene["integration_status"]="BLOCKED UNTIL USER VISUAL APPROVAL"
    scene["deployed_visible_terrain_status"]="FROZEN AT 55cd085"
    scene["authorship"]="fixed explicit DCC control points; no random or runtime generation"
    scene["course_geometry"]="NOT INCLUDED"
    scene["surface_layer_scope"]="upper 0.30 m only"
    scene["underground_soil_status"]="FROZEN - UNMODIFIED"
    scene["terrain_thickness_status"]="FROZEN - UNMODIFIED"
    scene["camera_status"]="FROZEN - UNMODIFIED"
    scene["lighting_status"]="FROZEN - UNMODIFIED"


def main():
    for path in (TARGET_PATH,CURRENT_PATH,BACKGROUND_PATH,SOIL_PATH,TERRAIN_CROSS_SECTION_PATH,TURF_PATH,STONE_PATH,BARK_PATH):
        if not path.exists():
            raise FileNotFoundError(path)
    reset_scene()
    collections=make_collections()
    mats=make_materials()
    configure_scene(bpy.context.scene)
    build_contract_markers(collections)
    authored_bank_body(collections["10_TERRAIN_BANK_SOIL"],mats["soil"],mats["soil_transition"])
    build_surface_transition_band(collections["11_TERRAIN_BANK_TURF"],mats["surface_blend"])
    build_surface_overhangs(collections["11_TERRAIN_BANK_TURF"],mats)
    build_stones(collections["12_TERRAIN_BANK_STONES"],mats)
    build_roots(collections["13_TERRAIN_BANK_ROOT_TRANSITIONS"],mats)
    build_erosion(collections["14_TERRAIN_BANK_EROSION"],mats)
    build_foliage(collections["15_TERRAIN_BANK_FOLIAGE"],mats)
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
