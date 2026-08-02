"""Fail-fast validation for the isolated Verdant Vale camp quality gate."""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[3]
EXPECTED_COLLECTIONS = (
    "00_REFERENCE", "01_FROZEN_GAMEPLAY_ANCHORS", "10_CAMP_STRUCTURE", "11_CAMP_CLOTH",
    "12_CAMP_JOINERY", "13_CAMP_PROPS", "14_CAMP_FOUNDATION", "20_APPROVED_STATIC_BACKGROUND",
    "30_LIGHTING", "40_TREE_FAMILY_BLOCKED", "41_TERRAIN_BANK_BLOCKED",
    "42_ROCK_ROOT_FORMATION_BLOCKED", "90_EXPORT_BLOCKED",
)
BLOCKED = (
    "40_TREE_FAMILY_BLOCKED", "41_TERRAIN_BANK_BLOCKED", "42_ROCK_ROOT_FORMATION_BLOCKED", "90_EXPORT_BLOCKED",
)


def require(condition, message):
    if not condition:
        raise AssertionError(message)


def main():
    scene = bpy.context.scene
    for name in EXPECTED_COLLECTIONS:
        require(name in bpy.data.collections, f"missing collection: {name}")

    require(scene.get("quality_gate_asset") == "camp", "quality gate is not isolated to camp")
    require(scene.get("camp_visual_approval") == "PENDING", "camp must remain pending user approval")
    require(scene.get("later_assets_blocked") is True, "later kit assets are not blocked")
    require(scene.get("background_status") == "APPROVED STATIC LAYER - UNMODIFIED", "background lock missing")
    require(scene.get("gameplay_layout_status") == "FROZEN - UNMODIFIED", "gameplay freeze missing")
    require(scene.get("integration_status") == "BLOCKED UNTIL USER VISUAL APPROVAL", "integration is not blocked")
    require(scene.get("production_approved") is False, "asset was incorrectly marked production-approved")

    marker = bpy.data.objects.get("VV_FROZEN_CampAnchor")
    require(marker is not None, "canonical camp anchor marker missing")
    expected = (-0.15, -0.485714, 0.0)
    require(all(math.isclose(marker.location[i], expected[i], abs_tol=1e-6) for i in range(3)), "camp anchor changed")
    require(marker.get("layout_mutated") is False, "layout marker reports mutation")

    background = bpy.data.objects.get("VV_APPROVED_STATIC_Background")
    require(background is not None, "approved background plane missing")
    require(background.get("locked") is True, "background is not locked")
    require(background.get("blender_modeling_prohibited") is True, "background modeling prohibition missing")
    source = ROOT / background.get("source", "")
    require(source.exists(), f"approved background source missing: {source}")

    require(scene.camera and scene.camera.name == "VV_CAM_CampQualityGate", "review camera is not active")
    require(bpy.data.objects.get("VV_CAM_CampDetailGate") is not None, "detail inspection camera missing")
    root = bpy.data.objects.get("VV_CampAssetRoot")
    require(root is not None and root.get("gameplay_layout_mutated") is False, "camp review root contract missing")

    for name in BLOCKED:
        collection = bpy.data.collections[name]
        require(len(collection.objects) == 1, f"blocked collection contains authored work: {name}")
        blocker = collection.objects[0]
        require(blocker.type == "EMPTY", f"blocked collection contains geometry: {name}")
        require(blocker.get("status") == "BLOCKED_UNTIL_CAMP_VISUAL_APPROVAL", f"blocker status missing: {name}")

    visible_asset_collections = (
        "10_CAMP_STRUCTURE", "11_CAMP_CLOTH", "12_CAMP_JOINERY", "13_CAMP_PROPS", "14_CAMP_FOUNDATION",
    )
    visible_objects = [obj for name in visible_asset_collections for obj in bpy.data.collections[name].objects]
    require(len(visible_objects) >= 150, "camp detail density unexpectedly regressed")
    require(all(obj.get("verdant_vale_hero_asset") in (None, "camp") for obj in visible_objects), "non-camp hero asset found")
    forbidden = ("hargold", "mebble", "enemy", "mob", "boss", "coin", "powerup", "block")
    require(not any(any(token in obj.name.lower() for token in forbidden) for obj in visible_objects), "frozen gameplay/character object found")

    missing_images = []
    for image in bpy.data.images:
        if image.source == "FILE" and image.filepath:
            path = Path(bpy.path.abspath(image.filepath))
            if not path.exists():
                missing_images.append(str(path))
    require(not missing_images, f"missing external images: {missing_images}")

    metrics = {
        "status": "PASS",
        "quality_gate": "camp",
        "visual_approval": "PENDING",
        "objects": len(bpy.data.objects),
        "meshes": len(bpy.data.meshes),
        "curves": len(bpy.data.curves),
        "materials": len(bpy.data.materials),
        "visible_camp_objects": len(visible_objects),
        "blocked_later_assets": list(BLOCKED),
        "background": str(source.relative_to(ROOT)).replace("\\", "/"),
        "camp_anchor": list(expected),
        "integration": "BLOCKED",
    }
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"CAMP GATE VALIDATION FAILED: {exc}", file=sys.stderr)
        raise
