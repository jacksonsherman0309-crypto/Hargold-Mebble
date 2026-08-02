"""Build the canonical Meadow Wake opening Blender authoring scene.

This script automates scene structure, exact gameplay guides, frozen collision,
fixed review cameras, and empty DCC authoring targets. It deliberately creates
no visible terrain mesh, primitive environment proxy, or production screenshot.
"""

from __future__ import annotations

import json
import hashlib
import math
from pathlib import Path
import sys

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
LAYOUT_PATH = ROOT / "data/level-art/world-1/meadow-wake-opening-layout.json"
ARCHITECTURE_PATH = ROOT / "data/level-art/world-1/meadow-wake-terrain-architecture.json"
BLEND_PATH = ROOT / "assets/blender/environments/world-1/meadow-wake-opening.blend"
GUIDE_GLB = ROOT / "assets/exports/world-1/meadow-wake-opening/mw_opening_neutral_guide.glb"
COLLISION_FBX = ROOT / "unity/HargoldMebble/Assets/Game/Worlds/World01_MeadowWake/Collision/Source/Terrain_Collision_Master.fbx"
REFERENCE_IMAGE = ROOT / "assets/references/terrain/meadow-wake-terrain-quality-reference.jpeg"

COLLECTION_NAMES = [
    "00_REFERENCE",
    "01_GAMEPLAY_GUIDES",
    "02_CAMERA_GUIDES",
    "10_TERRAIN_HIGH",
    "11_TERRAIN_GAME",
    "12_TERRAIN_COLLISION",
    "20_CAMP",
    "21_TREES",
    "22_ROOTS",
    "23_ROCKS",
    "24_RUINS_AND_TIMBER",
    "30_FOLIAGE",
    "31_DECALS",
    "40_MIDGROUND",
    "41_BACKGROUND_INTEGRATION",
    "50_LIGHTING_PREVIEW",
    "90_EXPORT",
    "90_EXPORT_COLLISION",
    "90_EXPORT_VISIBLE",
    "99_ARCHIVE_DISABLED",
]

MANUAL_GATES = (
    "HUMAN_DCC_SCULPT_REQUIRED",
    "RETOPO_REQUIRED",
    "UV_REQUIRED",
    "MATERIALS_REQUIRED",
    "LOD_REQUIRED",
    "ENGINE_INTEGRATION_REQUIRED",
    "ART_REVIEW_REQUIRED",
)


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in list(bpy.data.collections):
        bpy.data.collections.remove(collection)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for block in list(datablocks):
            if block.users == 0:
                datablocks.remove(block)


def make_collections():
    result = {}
    for name in COLLECTION_NAMES:
        collection = bpy.data.collections.new(name)
        result[name] = collection
    for name, collection in result.items():
        if name in ("90_EXPORT_COLLISION", "90_EXPORT_VISIBLE"):
            result["90_EXPORT"].children.link(collection)
        else:
            bpy.context.scene.collection.children.link(collection)
    for name in (
        "00_REFERENCE", "01_GAMEPLAY_GUIDES", "02_CAMERA_GUIDES", "12_TERRAIN_COLLISION",
        "41_BACKGROUND_INTEGRATION", "90_EXPORT", "90_EXPORT_COLLISION", "90_EXPORT_VISIBLE"
    ):
        result[name].hide_render = True
    return result


def move_to_collection(obj, collection):
    for owner in list(obj.users_collection):
        owner.objects.unlink(obj)
    collection.objects.link(obj)
    return obj


def link_to_collection(obj, collection):
    if obj.name not in collection.objects:
        collection.objects.link(obj)


def material(name, color, metallic=0.0, roughness=0.78, emission=None):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = 0.55
    return mat


def tag_manual(obj, stage="authored-dcc-asset-required"):
    obj["asset_status"] = stage
    obj["production_approved"] = False
    for gate in MANUAL_GATES:
        obj[gate] = True
    return obj


def add_cube(name, location, scale, collection, mat=None, display="TEXTURED", manual=False):
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = move_to_collection(bpy.context.object, collection)
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.display_type = display
    if mat:
        obj.data.materials.append(mat)
    if manual:
        tag_manual(obj)
    return obj


def add_cylinder(name, location, radius, depth, collection, mat=None, vertices=12, manual=False):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location)
    obj = move_to_collection(bpy.context.object, collection)
    obj.name = name
    if mat:
        obj.data.materials.append(mat)
    if manual:
        tag_manual(obj)
    return obj


def add_ico(name, location, scale, collection, mat=None, subdivisions=1, manual=False):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdivisions, radius=1, location=location)
    obj = move_to_collection(bpy.context.object, collection)
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if mat:
        obj.data.materials.append(mat)
    if manual:
        tag_manual(obj)
    return obj


def add_empty(name, location, collection, display="PLAIN_AXES", size=0.45, properties=None):
    obj = bpy.data.objects.new(name, None)
    collection.objects.link(obj)
    obj.location = location
    obj.empty_display_type = display
    obj.empty_display_size = size
    for key, value in (properties or {}).items():
        obj[key] = value
    return obj


def profile_prism(name, points, half_depth, bottom_z, collection, materials, manual=False):
    count = len(points)
    vertices = [(p["x"], -half_depth, p["blenderZ"]) for p in points]
    vertices += [(p["x"], half_depth, p["blenderZ"]) for p in points]
    vertices += [
        (points[0]["x"], -half_depth, bottom_z),
        (points[-1]["x"], -half_depth, bottom_z),
        (points[0]["x"], half_depth, bottom_z),
        (points[-1]["x"], half_depth, bottom_z),
    ]
    front_bottom_left, front_bottom_right = count * 2, count * 2 + 1
    back_bottom_left, back_bottom_right = count * 2 + 2, count * 2 + 3
    faces = []
    material_indices = []
    for index in range(count - 1):
        faces.append((index, index + 1, count + index + 1, count + index))
        material_indices.append(1)
    faces.append(tuple(range(count)) + (front_bottom_right, front_bottom_left))
    material_indices.append(0)
    faces.append(tuple(reversed(range(count, count * 2))) + (back_bottom_left, back_bottom_right))
    material_indices.append(0)
    faces.extend([
        (front_bottom_left, front_bottom_right, back_bottom_right, back_bottom_left),
        (0, count, back_bottom_left, front_bottom_left),
        (count - 1, front_bottom_right, back_bottom_right, count * 2 - 1),
    ])
    material_indices.extend([0, 0, 0])
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    for mat in materials:
        mesh.materials.append(mat)
    for polygon, material_index in zip(mesh.polygons, material_indices):
        polygon.material_index = material_index
    if manual:
        tag_manual(obj)
    return obj


def collision_geometry_fingerprint(layout, architecture):
    collision = architecture["collisionMaster"]
    payload = {
        "name": collision["objectName"],
        "halfDepthMetres": collision["halfDepthMetres"],
        "closureBottomZMetres": collision["closureBottomZMetres"],
        "groundProfile": [
            [point["x"], point["blenderZ"]]
            for point in layout["terrain"]["groundProfile"]
        ],
    }
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def terrain_z(layout, x):
    points = layout["terrain"]["groundProfile"]
    for left, right in zip(points, points[1:]):
        if x <= right["x"]:
            ratio = (x - left["x"]) / max(right["x"] - left["x"], 1e-9)
            return left["blenderZ"] + (right["blenderZ"] - left["blenderZ"]) * ratio
    return points[-1]["blenderZ"]


def build_guides(layout, architecture, collections, mats):
    guides = collections["01_GAMEPLAY_GUIDES"]
    collision = collections["12_TERRAIN_COLLISION"]
    export = collections["90_EXPORT_COLLISION"]
    collision_contract = architecture["collisionMaster"]
    fingerprint = collision_geometry_fingerprint(layout, architecture)
    if fingerprint != collision_contract["geometryFingerprintSha256"]:
        raise ValueError("Frozen Terrain_Collision_Master fingerprint no longer matches the canonical layout")
    ground = profile_prism(
        collision_contract["objectName"],
        layout["terrain"]["groundProfile"],
        collision_contract["halfDepthMetres"],
        collision_contract["closureBottomZMetres"],
        collision,
        [mats["collision"], mats["collision"]],
    )
    ground.data.name = collision_contract["meshName"]
    ground["terrain_role"] = "gameplay-collision-authority"
    ground["collision_role"] = "deterministic-ground-profile"
    ground["source_layout"] = "data/level-art/world-1/meadow-wake-opening-layout.json"
    ground["source_architecture"] = "data/level-art/world-1/meadow-wake-terrain-architecture.json"
    ground["geometry_fingerprint_sha256"] = fingerprint
    ground["visible_in_game"] = False
    ground["renderers_enabled"] = False
    ground["material_policy"] = "gameplay-visualization-only"
    ground["modification_policy"] = collision_contract["modificationPolicy"]
    link_to_collection(ground, export)

    add_empty("ANCHOR_Spawn_Hargold", tuple(layout["spawn"]["blenderPosition"].values()), guides,
              properties={"hero": "Hargold", "height_m": 1.82})
    add_empty("ANCHOR_SliceExit", tuple(layout["exitTransition"]["blenderPosition"].values()), guides,
              properties={"review_boundary_only": True})

    for hero, x, width, height, color in (
        ("Hargold", 1.8, 1.02, 1.82, mats["hargold"]),
        ("Mebble", 3.0, 0.72, 2.2932, mats["mebble"]),
    ):
        z = terrain_z(layout, x) + height / 2
        mannequin = add_cylinder(f"GUIDE_{hero}_Mannequin", (x, 0, z), width / 2, height, guides, color, vertices=16)
        mannequin.display_type = "WIRE"
        mannequin["guide_only"] = True

    for zone in layout["safeLandingZones"]:
        start, end = zone["range"]
        x = (start + end) / 2
        zone_obj = add_cube(
            f"GUIDE_SafeLanding_{zone['id']}",
            (x, 0, terrain_z(layout, x) + 0.04),
            ((end - start) / 2, 0.48, 0.04), guides, mats["safe"], "WIRE"
        )
        zone_obj["guide_only"] = True

    for platform in layout["gameplayObjects"]["platforms"]:
        center = platform["blenderCenter"]
        obj = add_cube(
            f"GUIDE_Platform_{platform['id']}",
            (center["x"], center["y"], center["z"]),
            (platform["width"] / 2, 0.38, platform["height"] / 2), guides, mats["platform"], "WIRE"
        )
        obj["anchor_id"] = platform["id"]
        obj["motion_kind"] = platform.get("motion", {}).get("kind", "static")

        col = obj.copy()
        col.data = obj.data.copy()
        col.name = f"MW_COL_Platform_{platform['id']}"
        collision.objects.link(col)
        col.display_type = "WIRE"
        col["collision_role"] = platform["collisionRole"]
        link_to_collection(col, export)

    for block in layout["gameplayObjects"]["blocks"]:
        center = block["blenderCenter"]
        obj = add_cube(
            f"GUIDE_Block_{block['id']}",
            (center["x"], 0, center["z"]),
            (block["width"] / 2, 0.37, block["height"] / 2), guides,
            mats["breakable"] if block["type"] == "standard-breakable" else mats["block"], "WIRE"
        )
        obj["block_type"] = block["type"]
        obj["interactive"] = True

    for coin in layout["gameplayObjects"]["coins"]:
        center = coin["blenderCenter"]
        marker = add_cylinder(
            f"GUIDE_Coin_{coin['id']}", (center["x"], 0, center["z"]), 0.12, 0.05,
            guides, mats["coin"], vertices=16
        )
        marker.rotation_euler.x = math.pi / 2
        marker["collectible_route"] = coin["route"]

    for enemy in layout["gameplayObjects"]["enemyAnchors"]:
        pos = enemy["blenderPosition"]
        add_empty(
            f"ANCHOR_Enemy_{enemy['id']}", (pos["x"], 0, pos["z"]), guides, "SPHERE", 0.5,
            {"actor_type": enemy["actorType"], "patrol_from": enemy["patrolRange"][0], "patrol_to": enemy["patrolRange"][1]}
        )

    for prop in layout["environmentAnchors"]["scenery"]:
        anchor = prop["blenderAnchor"]
        add_empty(
            f"ANCHOR_Prop_{prop['id']}", (anchor["x"], anchor["y"], anchor["z"]), guides, "CUBE", 0.35,
            {"prop_type": prop["type"], "manual_art_required": True}
        )


def build_dcc_handoff_targets(layout, architecture, collections):
    visible_contract = architecture["visibleMaster"]
    terrain = add_empty(
        visible_contract["objectName"],
        (15.0, 0.0, 0.0),
        collections["10_TERRAIN_HIGH"],
        "PLAIN_AXES",
        1.0,
        {
            "asset_status": visible_contract["status"],
            "production_status": visible_contract["productionStatus"],
            "production_approved": False,
            "collision_enabled": False,
            "generated_mesh_forbidden": True,
            "procedural_visible_terrain_allowed": False,
            "approved_browser_visible_commit": architecture["emergencyTerrainFreeze"]["approvedVisibleCommit"],
        },
    )
    terrain["terrain_role"] = "empty-human-dcc-authoring-target"
    terrain["purpose"] = "replace only with approved human-authored DCC terrain"
    terrain["source_architecture"] = "data/level-art/world-1/meadow-wake-terrain-architecture.json"
    terrain["source_collision_fingerprint"] = architecture["collisionMaster"]["geometryFingerprintSha256"]
    for gate in MANUAL_GATES:
        terrain[gate] = True

    targets = (
        ("MW_DCC_TARGET_Camp", "20_CAMP", (1.0, 0.0, 0.35), "camp foundation, lodge, timber, canvas"),
        ("MW_DCC_TARGET_Trees", "21_TREES", (14.7, 0.0, 2.1), "tree trunks and canopies"),
        ("MW_DCC_TARGET_Roots", "22_ROOTS", (14.8, 0.0, 0.8), "terrain-integrated root systems"),
        ("MW_DCC_TARGET_Rocks", "23_ROCKS", (24.5, 0.0, 0.7), "authored rock families"),
        ("MW_DCC_TARGET_RuinsAndTimber", "24_RUINS_AND_TIMBER", (25.0, 0.0, 0.8), "ruins and fallen timber"),
        ("MW_DCC_TARGET_Foliage", "30_FOLIAGE", (15.0, 0.0, 0.2), "foliage and grass cards"),
        ("MW_DCC_TARGET_Decals", "31_DECALS", (15.0, 0.0, 0.0), "terrain decals and blend masks"),
        ("MW_DCC_TARGET_Midground", "40_MIDGROUND", (15.0, 3.2, 1.5), "authored midground integration"),
    )
    for name, collection_name, location, purpose in targets:
        target = add_empty(
            name,
            location,
            collections[collection_name],
            properties={
                "asset_status": "NOT_AUTHORED",
                "production_approved": False,
                "purpose": purpose,
                "generated_proxy_forbidden": True,
            },
        )
        for gate in MANUAL_GATES:
            target[gate] = True


def build_background(collections):
    if not REFERENCE_IMAGE.exists():
        return
    image = bpy.data.images.load(str(REFERENCE_IMAGE), check_existing=True)
    reference = add_empty(
        "REFERENCE_MeadowWakeQualityTarget",
        (15, 5.3, 3.1),
        collections["00_REFERENCE"],
        "IMAGE",
        8.0,
        {"filepath": str(REFERENCE_IMAGE), "non_rendering_reference": True},
    )
    reference.data = image
    reference.empty_image_depth = "BACK"
    reference.color[3] = 0.8


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def build_cameras_and_lighting(layout, collections):
    cameras = {}
    for view in layout["camera"]["fixedComparisonViewpoints"]:
        camera_data = bpy.data.cameras.new(f"CAM_{view['id']}")
        camera_data.type = "ORTHO"
        camera_data.ortho_scale = view["orthographicScale"]
        camera = bpy.data.objects.new(f"CAM_{view['id']}", camera_data)
        collections["02_CAMERA_GUIDES"].objects.link(camera)
        camera.location = view["cameraBlender"]
        look_at(camera, (view["focus"][0], 0, view["focus"][1]))
        camera["fixed_comparison_view"] = view["id"]
        cameras[view["id"]] = camera

    sun_data = bpy.data.lights.new("MW_Sun_WarmPreview", "SUN")
    sun_data.energy = 2.0
    sun_data.color = (1.0, 0.83, 0.63)
    sun = bpy.data.objects.new("MW_Sun_WarmPreview", sun_data)
    collections["50_LIGHTING_PREVIEW"].objects.link(sun)
    sun.rotation_euler = (math.radians(28), math.radians(-18), math.radians(-32))
    sun["preview_only"] = True
    area_data = bpy.data.lights.new("MW_SkyFill_Preview", "AREA")
    area_data.energy = 450
    area_data.shape = "RECTANGLE"
    area_data.size = 18
    area_data.color = (0.48, 0.68, 1.0)
    area = bpy.data.objects.new("MW_SkyFill_Preview", area_data)
    collections["50_LIGHTING_PREVIEW"].objects.link(area)
    area.location = (15, -4, 9)
    look_at(area, (15, 0, 0))
    area["preview_only"] = True
    return cameras


def make_materials():
    return {
        "collision": material("MAT_CollisionGuide", (0.1, 0.8, 0.9), emission=(0.1, 0.6, 0.8)),
        "safe": material("MAT_SafeLandingGuide", (0.18, 1.0, 0.28), emission=(0.1, 0.7, 0.2)),
        "platform": material("MAT_PlatformGuide", (0.95, 0.66, 0.12), emission=(0.8, 0.4, 0.05)),
        "block": material("MAT_BlockGuide", (0.95, 0.78, 0.14), emission=(0.8, 0.55, 0.05)),
        "breakable": material("MAT_BreakableBlockGuide", (0.88, 0.26, 0.08), emission=(0.72, 0.12, 0.03)),
        "coin": material("MAT_CoinGuide", (1.0, 0.62, 0.03), metallic=0.55),
        "hargold": material("MAT_HargoldScaleGuide", (0.18, 0.68, 0.17)),
        "mebble": material("MAT_MebbleScaleGuide", (0.16, 0.42, 0.82)),
    }


def export_selected(objects, filepath, kind):
    filepath.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.hide_set(False)
        obj.select_set(True)
    if objects:
        bpy.context.view_layer.objects.active = objects[0]
    if kind == "glb":
        bpy.ops.export_scene.gltf(
            filepath=str(filepath), export_format="GLB", use_selection=True,
            export_cameras=True, export_extras=True, export_yup=True
        )
    else:
        bpy.ops.export_scene.fbx(
            filepath=str(filepath), use_selection=True, axis_forward="-Z", axis_up="Y",
            apply_unit_scale=True, bake_space_transform=False, add_leaf_bones=False,
            use_mesh_modifiers=True
        )


def main():
    layout = json.loads(LAYOUT_PATH.read_text(encoding="utf-8"))
    architecture = json.loads(ARCHITECTURE_PATH.read_text(encoding="utf-8"))
    reset_scene()
    collections = make_collections()
    mats = make_materials()
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    scene["asset_id"] = layout["id"]
    scene["layout_source"] = str(LAYOUT_PATH.relative_to(ROOT)).replace("\\", "/")
    scene["terrain_architecture_source"] = str(ARCHITECTURE_PATH.relative_to(ROOT)).replace("\\", "/")
    scene["terrain_collision_master"] = architecture["collisionMaster"]["objectName"]
    scene["terrain_visible_master"] = architecture["visibleMaster"]["objectName"]
    scene["terrain_masters_share_geometry"] = False
    scene["visible_art_status"] = layout["visibleArtStatus"]
    scene["production_approved"] = False
    scene["browser_runtime_role"] = "layout-and-traversal-reference-only"
    scene["unity_role"] = "production-assembly-target"
    scene["blender_role"] = "dcc-handoff-guides-and-frozen-collision-only"
    scene["visible_dcc_asset_status"] = architecture["visibleMaster"]["status"]
    scene["procedural_visible_terrain_allowed"] = False
    scene["approved_browser_visible_commit"] = architecture["emergencyTerrainFreeze"]["approvedVisibleCommit"]
    scene["scale_contract"] = "1 gameplay metre = 1 Blender metre = 1 Unity unit"
    build_guides(layout, architecture, collections, mats)
    build_dcc_handoff_targets(layout, architecture, collections)
    build_background(collections)
    build_cameras_and_lighting(layout, collections)

    guide_objects = list(collections["01_GAMEPLAY_GUIDES"].objects) + list(collections["12_TERRAIN_COLLISION"].objects)
    export_selected(guide_objects, GUIDE_GLB, "glb")
    export_selected(list(collections["90_EXPORT_COLLISION"].objects), COLLISION_FBX, "fbx")
    BLEND_PATH.parent.mkdir(parents=True, exist_ok=True)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH), check_existing=False)
    print(f"Saved {BLEND_PATH}")
    print(f"Exported {GUIDE_GLB}")
    print(f"Exported {COLLISION_FBX}")
    print("Visible terrain export intentionally withheld: human-authored DCC asset not present")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise
