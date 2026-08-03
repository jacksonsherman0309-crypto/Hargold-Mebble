"""Fail-fast validation for the isolated Verdant Vale terrain-bank quality gate."""

from __future__ import annotations

import json
import hashlib
import math
import sys
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[3]
EXPECTED_COLLECTIONS = (
    "00_REFERENCE", "01_FROZEN_BOUNDARIES", "10_TERRAIN_BANK_SOIL",
    "11_TERRAIN_BANK_TURF", "12_TERRAIN_BANK_STONES",
    "13_TERRAIN_BANK_ROOT_TRANSITIONS", "14_TERRAIN_BANK_EROSION",
    "15_TERRAIN_BANK_FOLIAGE", "20_APPROVED_STATIC_BACKGROUND", "30_LIGHTING",
    "40_TREE_FAMILY_BLOCKED", "42_ROCK_ROOT_FORMATION_BLOCKED", "90_EXPORT_BLOCKED",
)
VISIBLE_ASSET_COLLECTIONS = (
    "10_TERRAIN_BANK_SOIL", "11_TERRAIN_BANK_TURF", "12_TERRAIN_BANK_STONES",
    "13_TERRAIN_BANK_ROOT_TRANSITIONS", "14_TERRAIN_BANK_EROSION", "15_TERRAIN_BANK_FOLIAGE",
)
BLOCKED = (
    "40_TREE_FAMILY_BLOCKED", "42_ROCK_ROOT_FORMATION_BLOCKED", "90_EXPORT_BLOCKED",
)
FINGERPRINT = "a00bf81913452518d3ed7cbc0e8e2a60c3fc7e2b34e5f9762322fcb23acf58d9"
BACKGROUND_SHA256 = "4aa8ef74e96fd27acd06b08d027d06c26e8b0a11d78ebbf136a8178d72c89670"


def require(condition, message):
    if not condition:
        raise AssertionError(message)


def close_vector(actual, expected, tolerance=1e-6):
    return len(actual) == len(expected) and all(
        math.isclose(actual[index], expected[index], abs_tol=tolerance)
        for index in range(len(expected))
    )


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main():
    scene = bpy.context.scene
    for name in EXPECTED_COLLECTIONS:
        require(name in bpy.data.collections, f"missing collection: {name}")

    require(scene.get("quality_gate_asset") == "terrain-bank", "quality gate is not isolated to terrain bank")
    require(scene.get("visual_approval") == "PENDING", "terrain bank must remain pending user approval")
    require(scene.get("production_approved") is False, "asset was incorrectly marked production-approved")
    require(scene.get("background_status") == "APPROVED STATIC LAYER - UNMODIFIED", "background lock missing")
    require(scene.get("gameplay_layout_status") == "FROZEN - UNMODIFIED", "gameplay freeze missing")
    require(scene.get("collision_status") == "FROZEN - UNMODIFIED", "collision freeze missing")
    require(scene.get("integration_status") == "BLOCKED UNTIL USER VISUAL APPROVAL", "integration is not blocked")
    require(scene.get("deployed_visible_terrain_status") == "FROZEN AT 55cd085", "deployed terrain freeze missing")
    require(scene.get("course_geometry") == "NOT INCLUDED", "course geometry entered the review scene")
    require(scene.get("authorship") == "fixed explicit DCC control points; no random or runtime generation", "authorship contract missing")
    require(scene.get("surface_layer_scope") == "upper 0.30 m only", "surface-only scope missing")
    require(scene.get("underground_soil_status") == "FROZEN - UNMODIFIED", "underground soil freeze missing")
    require(scene.get("terrain_thickness_status") == "FROZEN - UNMODIFIED", "terrain thickness freeze missing")
    require(scene.get("camera_status") == "FROZEN - UNMODIFIED", "camera freeze missing")
    require(scene.get("lighting_status") == "FROZEN - UNMODIFIED", "lighting freeze missing")

    marker = bpy.data.objects.get("VV_REVIEW_ONLY_TerrainBankOrigin")
    require(marker is not None, "review-only terrain origin missing")
    require(all(math.isclose(marker.location[i], (2.8, 0.0, 0.0)[i], abs_tol=1e-6) for i in range(3)), "review origin changed")
    require(marker.get("not_gameplay_coordinate") is True, "review origin was treated as gameplay geometry")
    require(marker.get("not_integration_anchor") is True, "review origin was treated as an integration anchor")
    require(marker.get("collision_mutated") is False, "marker reports a collision mutation")
    require(marker.get("protected_gameplay_fingerprint") == FINGERPRINT, "protected gameplay fingerprint changed")

    background = bpy.data.objects.get("VV_APPROVED_STATIC_Background")
    require(background is not None, "approved background plane missing")
    require(background.get("locked") is True, "background is not locked")
    require(background.get("blender_modeling_prohibited") is True, "background modeling prohibition missing")
    source = ROOT / background.get("source", "")
    require(source.exists(), f"approved background source missing: {source}")
    require(sha256(source) == BACKGROUND_SHA256, "approved background pixels changed")

    require(scene.camera and scene.camera.name == "VV_CAM_TerrainBankQualityGate", "wide review camera is not active")
    wide_camera = scene.camera
    detail_camera = bpy.data.objects.get("VV_CAM_TerrainBankDetailGate")
    require(detail_camera is not None, "detail inspection camera missing")
    require(close_vector(wide_camera.location, (2.8, -18.0, 4.0)), "wide review camera location changed")
    require(close_vector(wide_camera.rotation_euler, (1.431700468, 0.0, 0.0), 1e-5), "wide review camera rotation changed")
    require(math.isclose(wide_camera.data.ortho_scale, 14.0, abs_tol=1e-6), "wide review camera framing changed")
    require(close_vector(detail_camera.location, (2.72, -18.0, 3.15)), "detail review camera location changed")
    require(close_vector(detail_camera.rotation_euler, (1.421906233, 0.0, 0.0), 1e-5), "detail review camera rotation changed")
    require(math.isclose(detail_camera.data.ortho_scale, 9.0, abs_tol=1e-6), "detail review camera framing changed")

    frozen_lights = {
        "VV_TerrainBank_Sun": ((-5.0, -7.0, 9.0), 1.55, (1.0, .78, .55)),
        "VV_TerrainBank_WarmKey": ((-3.4, -5.2, 6.2), 520.0, (1.0, .72, .43)),
        "VV_TerrainBank_SkyFill": ((6.0, -3.0, 4.5), 235.0, (.34, .56, 1.0)),
    }
    for name, (location, energy, color) in frozen_lights.items():
        light = bpy.data.objects.get(name)
        require(light is not None and light.type == "LIGHT", f"frozen light missing: {name}")
        require(close_vector(light.location, location), f"frozen light location changed: {name}")
        require(math.isclose(light.data.energy, energy, abs_tol=1e-6), f"frozen light energy changed: {name}")
        require(close_vector(light.data.color, color), f"frozen light color changed: {name}")

    for name in BLOCKED:
        collection = bpy.data.collections[name]
        require(len(collection.objects) == 1, f"blocked collection contains authored work: {name}")
        blocker = collection.objects[0]
        require(blocker.type == "EMPTY", f"blocked collection contains geometry: {name}")
        require(blocker.get("status") == "BLOCKED_UNTIL_TERRAIN_BANK_VISUAL_APPROVAL", f"blocker status missing: {name}")

    visible_objects = [obj for name in VISIBLE_ASSET_COLLECTIONS for obj in bpy.data.collections[name].objects]
    require(len(visible_objects) >= 550, "living-surface detail density unexpectedly regressed")
    require(all(obj.get("runtime_generated") is not True for obj in visible_objects), "runtime-generated terrain found")
    require(all(obj.get("integration_approved") is not True for obj in visible_objects), "unapproved terrain was marked integrated")
    require(all(obj.get("collision_source") is not True for obj in visible_objects), "visible art was marked as collision")
    require(all(obj.get("course_geometry") is not True for obj in visible_objects), "course geometry entered the asset gate")
    forbidden = ("hargold", "mebble", "enemy", "mob", "boss", "coin", "powerup", "checkpoint", "collider")
    require(not any(any(token in obj.name.lower() for token in forbidden) for obj in visible_objects), "frozen gameplay or character object found")

    body = bpy.data.objects.get("VV_TerrainBank_HeroA_SoilBody")
    require(body is not None and body.type == "MESH", "authored soil bank is missing")
    require(body.get("craft") == "fixed authored rolling bank silhouette with undercut lower edge", "bank silhouette contract missing")
    require(len(body.data.vertices) == 112 and len(body.data.polygons) == 110, "frozen soil topology changed")
    require(close_vector(body.dimensions, (14.5, 1.299139619, 3.197708845), 1e-5), "frozen soil bounds or thickness changed")
    require(body.get("surface_material_scope") == "existing top faces only; frozen geometry unchanged", "top-face-only material scope missing")
    require(len(body.data.materials) == 2, "frozen bank should have one soil material plus one top-face surface-soil material")
    top_faces = [body.data.polygons[index * 4 + 2] for index in range(27)]
    require(all(face.material_index == 1 for face in top_faces), "surface material escaped or missed existing top faces")
    require(all(
        polygon.material_index == 0
        for index, polygon in enumerate(body.data.polygons)
        if index not in {segment * 4 + 2 for segment in range(27)}
    ), "underground/front soil material assignment changed")
    require(bpy.data.objects.get("VV_TerrainBank_HeroA_GrassOverhang") is None, "legacy continuous grass ribbon returned")

    transition_band = bpy.data.objects.get("VV_SurfaceRootSoilTransitionBand")
    require(transition_band is not None and transition_band.type == "MESH", "irregular soil/grass transition band missing")
    require("SurfaceBlend" in transition_band.data.color_attributes, "vertex-painted surface blend missing")
    require(transition_band.get("underground_soil_mutated") is False, "transition band reports underground mutation")
    require("soil-dominant irregular transition" in transition_band.get("craft", ""), "hard-edge replacement contract missing")

    root_sources = [obj for obj in visible_objects if obj.name.startswith("VV_SurfaceRootSource_")]
    roots = [obj for obj in visible_objects if obj.name.startswith("VV_SurfaceRoot_") and obj.type == "CURVE"]
    require(len(root_sources) == 2 and len(roots) == 6, "tree-sourced branching root systems regressed")
    require(all(root.get("root_source") in {source.name for source in root_sources} for root in roots), "isolated or source-less root found")

    stones = [
        obj for obj in visible_objects
        if obj.name.startswith("VV_TerrainBank_EmbeddedStone_")
        and obj.type == "MESH" and "SoilPocket" not in obj.name and "Moss" not in obj.name
    ]
    require(len(stones) == 8, "authored partially buried stone clusters regressed")
    require(all(bpy.data.objects.get(f"{stone.name}_SoilPocket") is not None for stone in stones), "stone is no longer visually buried")

    cushions = [obj for obj in visible_objects if obj.name.startswith("VV_SurfaceEcologyCushion_")]
    tufts = [obj for obj in visible_objects if obj.name.startswith("VV_SurfaceCanopyTuft_")]
    flowers = [obj for obj in visible_objects if obj.name.startswith("VV_SurfaceFlower_") and obj.type == "MESH"]
    require(len(cushions) == 93, "clustered ground-cover colony count changed")
    require(len(tufts) == 58, "staggered canopy tuft count changed")
    require(len(flowers) == 11, "clustered flower count changed")
    scoped = [obj for obj in visible_objects if obj.get("surface_layer_depth_m") is not None]
    require(scoped and all(float(obj["surface_layer_depth_m"]) <= .300001 for obj in scoped), "surface geometry exceeds the 0.30 m scope")

    transition = ROOT / "assets/textures/world-1/meadow-wake/meadow-terrain-cross-section-albedo-v1.png"
    require(transition.exists(), "authored terrain cross-section texture missing")

    missing_images = []
    for image in bpy.data.images:
        if image.source == "FILE" and image.filepath:
            path = Path(bpy.path.abspath(image.filepath))
            if not path.exists():
                missing_images.append(str(path))
    require(not missing_images, f"missing external images: {missing_images}")

    metrics = {
        "status": "PASS",
        "quality_gate": "terrain-bank",
        "visual_approval": "PENDING",
        "production_approved": False,
        "objects": len(bpy.data.objects),
        "meshes": len(bpy.data.meshes),
        "curves": len(bpy.data.curves),
        "materials": len(bpy.data.materials),
        "visible_terrain_objects": len(visible_objects),
        "surface_ecology_cushions": len(cushions),
        "surface_canopy_tufts": len(tufts),
        "surface_flowers": len(flowers),
        "root_sources": len(root_sources),
        "root_branches": len(roots),
        "partially_buried_stones": len(stones),
        "frozen_soil_vertices": len(body.data.vertices),
        "frozen_soil_faces": len(body.data.polygons),
        "background_sha256": BACKGROUND_SHA256,
        "blocked_later_assets": list(BLOCKED),
        "background": str(source.relative_to(ROOT)).replace("\\", "/"),
        "terrain_texture": str(transition.relative_to(ROOT)).replace("\\", "/"),
        "protected_gameplay_fingerprint": FINGERPRINT,
        "integration": "BLOCKED",
    }
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"TERRAIN BANK GATE VALIDATION FAILED: {exc}", file=sys.stderr)
        raise
