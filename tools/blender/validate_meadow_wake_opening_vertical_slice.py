"""Validate the canonical Meadow Wake opening Blender scene and write evidence."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import sys

import bpy


ROOT = Path(__file__).resolve().parents[2]
BLEND = ROOT / "assets/blender/environments/world-1/meadow-wake-opening.blend"
LAYOUT = ROOT / "data/level-art/world-1/meadow-wake-opening-layout.json"
ARCHITECTURE = ROOT / "data/level-art/world-1/meadow-wake-terrain-architecture.json"
REPORT = ROOT / "data/level-art/world-1/meadow-wake-opening-blender-validation.json"
MANIFEST = ROOT / "data/level-art/world-1/meadow-wake-opening-asset-manifest.json"
PERFORMANCE = ROOT / "data/level-art/world-1/meadow-wake-opening-performance-status.json"

REQUIRED_COLLECTIONS = [
    "00_REFERENCE", "01_GAMEPLAY_GUIDES", "02_CAMERA_GUIDES", "10_TERRAIN_HIGH",
    "11_TERRAIN_GAME", "12_TERRAIN_COLLISION", "20_CAMP", "21_TREES", "22_ROOTS",
    "23_ROCKS", "24_RUINS_AND_TIMBER", "30_FOLIAGE", "31_DECALS", "40_MIDGROUND",
    "41_BACKGROUND_INTEGRATION", "50_LIGHTING_PREVIEW", "90_EXPORT",
    "90_EXPORT_COLLISION", "90_EXPORT_VISIBLE", "99_ARCHIVE_DISABLED"
]


def stable_json_sha256(value):
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def collision_fingerprint(layout, architecture):
    collision = architecture["collisionMaster"]
    return stable_json_sha256({
        "name": collision["objectName"],
        "halfDepthMetres": collision["halfDepthMetres"],
        "closureBottomZMetres": collision["closureBottomZMetres"],
        "groundProfile": [
            [point["x"], point["blenderZ"]]
            for point in layout["terrain"]["groundProfile"]
        ],
    })


def protected_gameplay_fingerprint(layout):
    return stable_json_sha256({
        "spawn": layout["spawn"],
        "exitTransition": layout["exitTransition"],
        "gameplayPlane": layout["gameplayPlane"],
        "groundProfile": layout["terrain"]["groundProfile"],
        "pits": layout["terrain"]["pits"],
        "safeLandingZones": layout["safeLandingZones"],
        "platforms": layout["gameplayObjects"]["platforms"],
        "blocks": layout["gameplayObjects"]["blocks"],
        "enemyAnchors": layout["gameplayObjects"]["enemyAnchors"],
        "camera": layout["camera"],
    })


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def metrics(obj):
    if obj.type != "MESH":
        return {"vertices": 0, "triangles": 0, "materials": 0}
    obj.data.calc_loop_triangles()
    return {
        "vertices": len(obj.data.vertices),
        "triangles": len(obj.data.loop_triangles),
        "materials": len(obj.data.materials),
    }


def collection_material_count(collection):
    return len({
        material.name
        for obj in collection.objects
        if obj.type == "MESH"
        for material in obj.data.materials
        if material is not None
    })


def check(checks, check_id, passed, detail):
    checks.append({"id": check_id, "pass": bool(passed), "detail": detail})


def main():
    if Path(bpy.data.filepath).resolve() != BLEND.resolve():
        bpy.ops.wm.open_mainfile(filepath=str(BLEND), load_ui=False)
    layout = json.loads(LAYOUT.read_text(encoding="utf-8"))
    architecture = json.loads(ARCHITECTURE.read_text(encoding="utf-8"))
    checks = []
    collection_names = [collection.name for collection in bpy.data.collections]
    missing = [name for name in REQUIRED_COLLECTIONS if name not in collection_names]
    check(checks, "required-collections", not missing, f"missing={missing}")
    check(checks, "metric-scene-units", bpy.context.scene.unit_settings.system == "METRIC" and bpy.context.scene.unit_settings.scale_length == 1.0,
          f"system={bpy.context.scene.unit_settings.system}, scale={bpy.context.scene.unit_settings.scale_length}")
    check(checks, "not-production-approved", bpy.context.scene.get("production_approved") is False,
          str(bpy.context.scene.get("visible_art_status")))
    check(checks, "procedural-visible-terrain-frozen",
          bpy.context.scene.get("procedural_visible_terrain_allowed") is False and
          architecture["emergencyTerrainFreeze"]["proceduralVisibleTerrainAllowed"] is False,
          f"approvedBrowserCommit={architecture['emergencyTerrainFreeze']['approvedVisibleCommit']}")
    collision_contract = architecture["collisionMaster"]
    visible_contract = architecture["visibleMaster"]
    ground = bpy.data.objects.get(collision_contract["objectName"])
    visible = bpy.data.objects.get(visible_contract["objectName"])
    check(checks, "collision-ground-present", ground is not None and ground.type == "MESH", str(ground))
    check(checks, "visible-terrain-target-present", visible is not None and visible.type == "EMPTY", str(visible))
    check(checks, "independent-master-objects", ground is not None and visible is not None and ground is not visible,
          f"collision={ground}, visible={visible}")
    check(checks, "visible-terrain-not-authored",
          visible_contract["status"] == "NOT_AUTHORED" and visible is not None and visible.data is None,
          f"contract={visible_contract['status']}, objectType={visible.type if visible else None}")
    expected_fingerprint = collision_fingerprint(layout, architecture)
    check(checks, "frozen-collision-fingerprint",
          expected_fingerprint == collision_contract["geometryFingerprintSha256"] and
          ground is not None and ground.get("geometry_fingerprint_sha256") == expected_fingerprint,
          expected_fingerprint)
    gameplay_fingerprint = protected_gameplay_fingerprint(layout)
    check(checks, "protected-gameplay-snapshot",
          gameplay_fingerprint == architecture["protectedGameplaySnapshot"]["sha256"],
          gameplay_fingerprint)
    check(checks, "collision-render-collections-hidden",
          bpy.data.collections["12_TERRAIN_COLLISION"].hide_render and
          bpy.data.collections["90_EXPORT_COLLISION"].hide_render,
          "authoring and export collision collections hide from normal renders")
    collision_materials = [material.name for material in ground.data.materials] if ground else []
    check(checks, "collision-debug-material-only",
          bool(collision_materials) and all(name == "MAT_CollisionGuide" for name in collision_materials),
          str(collision_materials))
    check(checks, "visible-collision-disabled",
          visible is not None and visible.get("collision_enabled") is False,
          f"collision_enabled={visible.get('collision_enabled') if visible else None}")
    check(checks, "collision-master-low-poly",
          ground is not None and metrics(ground)["triangles"] == 60,
          f"triangles={metrics(ground)['triangles'] if ground else None}")
    block_guides = [obj for obj in bpy.data.objects if obj.name.startswith("GUIDE_Block_")]
    check(checks, "all-block-guides", len(block_guides) == len(layout["gameplayObjects"]["blocks"]),
          f"scene={len(block_guides)}, layout={len(layout['gameplayObjects']['blocks'])}")
    breakables = [obj for obj in block_guides if obj.get("block_type") == "standard-breakable"]
    check(checks, "breakable-block-guides", len(breakables) == 3, f"count={len(breakables)}")
    platform_guides = [obj for obj in bpy.data.objects if obj.name.startswith("GUIDE_Platform_")]
    check(checks, "all-platform-guides", len(platform_guides) == len(layout["gameplayObjects"]["platforms"]),
          f"scene={len(platform_guides)}, layout={len(layout['gameplayObjects']['platforms'])}")
    camera_guides = [obj for obj in bpy.data.objects if obj.type == "CAMERA" and obj.get("fixed_comparison_view")]
    check(checks, "fixed-comparison-cameras", len(camera_guides) == 5, f"count={len(camera_guides)}")
    manual_objects = [obj for obj in bpy.data.objects if obj.get("production_approved") is False]
    check(checks, "manual-dcc-targets-visible", len(manual_objects) >= 9, f"manual_targets={len(manual_objects)}")
    collision_exports = list(bpy.data.collections["90_EXPORT_COLLISION"].objects)
    visible_exports = list(bpy.data.collections["90_EXPORT_VISIBLE"].objects)
    check(checks, "dedicated-collision-export",
          ground in collision_exports and visible not in collision_exports,
          str([obj.name for obj in collision_exports]))
    check(checks, "visible-export-withheld",
          visible_exports == [] and visible_contract["unityAsset"] is None,
          str([obj.name for obj in visible_exports]))
    check(checks, "legacy-mixed-export-empty", len(bpy.data.collections["90_EXPORT"].objects) == 0,
          str([obj.name for obj in bpy.data.collections["90_EXPORT"].objects]))

    visible_art_collections = (
        "10_TERRAIN_HIGH", "11_TERRAIN_GAME", "20_CAMP", "21_TREES", "22_ROOTS",
        "23_ROCKS", "24_RUINS_AND_TIMBER", "30_FOLIAGE", "31_DECALS", "40_MIDGROUND",
        "41_BACKGROUND_INTEGRATION",
    )
    visible_proxy_meshes = [
        obj.name
        for name in visible_art_collections
        for obj in bpy.data.collections[name].objects
        if obj.type == "MESH"
    ]
    check(checks, "no-generated-visible-proxy-meshes", not visible_proxy_meshes, str(visible_proxy_meshes))

    mesh_objects = [obj for obj in bpy.data.objects if obj.type == "MESH"]
    object_metrics = {obj.name: metrics(obj) for obj in sorted(mesh_objects, key=lambda item: item.name)}
    collection_triangles = {
        name: sum(metrics(obj)["triangles"] for obj in bpy.data.collections[name].objects if obj.type == "MESH")
        for name in REQUIRED_COLLECTIONS
    }
    totals = {
        "objects": len(bpy.data.objects),
        "meshObjects": len(mesh_objects),
        "vertices": sum(item["vertices"] for item in object_metrics.values()),
        "triangles": sum(item["triangles"] for item in object_metrics.values()),
        "materials": len(bpy.data.materials),
        "textures": len(bpy.data.images),
        "collections": len(bpy.data.collections),
    }
    report = {
        "schemaVersion": 2,
        "asset": "Meadow Wake opening vertical slice",
        "source": str(BLEND.relative_to(ROOT)).replace("\\", "/"),
        "blenderVersion": ".".join(str(value) for value in bpy.app.version),
        "status": "PASS_DCC_HANDOFF_ONLY_VISIBLE_REPLACEMENT_NOT_AUTHORED" if all(item["pass"] for item in checks) else "FAIL",
        "productionReady": False,
        "checks": checks,
        "metrics": totals,
        "manualWorkRequired": [
            "human-authored terrain sculpt and silhouette review",
            "game-mesh retopology and deliberate LOD authoring",
            "UV unwrap, trim/material planning, and texture baking",
            "camp benchmark asset modeling",
            "benchmark tree/root modeling",
            "foliage, decal, midground, and background integration art review",
            "create Terrain_Visible_Master from genuine DCC work; no visible mesh or visible FBX currently exists",
            "Unity editor import validation proving collision renderers are disabled and visible-art colliders are absent",
            "target-device traversal capture",
        ],
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    assets = []
    for path, role, status, source, triangles, material_count, texture_refs, lod_status, collision_status in (
        (BLEND, "DCC handoff, guide, and frozen-collision source", "dcc-visible-art-not-authored",
         "project-authored DCC handoff assembled from canonical layout", totals["triangles"], totals["materials"],
         ["assets/references/terrain/meadow-wake-terrain-quality-reference.jpeg"],
         "LOD_REQUIRED_AFTER_HUMAN_DCC_GAME_MESH", "frozen collision present; visible target is empty"),
        (ROOT / "assets/exports/world-1/meadow-wake-opening/mw_opening_neutral_guide.glb", "neutral gameplay guide", "approved-guide-only",
         "generated from canonical layout by tools/blender/build_meadow_wake_opening_vertical_slice.py",
         collection_triangles["01_GAMEPLAY_GUIDES"] + collection_triangles["12_TERRAIN_COLLISION"], 6, [], "not-applicable-guide", "contains collision guides"),
        (ROOT / collision_contract["unityAsset"], "Unity gameplay collision master", "frozen-gameplay-authority",
         "90_EXPORT_COLLISION collection in canonical Blender scene", collection_triangles["90_EXPORT_COLLISION"],
         collection_material_count(bpy.data.collections["90_EXPORT_COLLISION"]), [],
         "not-applicable-collision", "render-disabled gameplay collision authority"),
    ):
        if path == BLEND:
            source = "project-authored Blender master assembled from canonical layout"
            triangles = totals["triangles"]
            material_count = totals["materials"]
            texture_refs = ["assets/references/terrain/meadow-wake-terrain-quality-reference.jpeg"]
            lod_status = "LOD_REQUIRED_AFTER_HUMAN_DCC_GAME_MESH"
            collision_status = "frozen Terrain_Collision_Master present; visible DCC target empty"
        assets.append({
            "path": str(path.relative_to(ROOT)).replace("\\", "/"),
            "source": source,
            "version": "meadow-wake-opening-v2-emergency-visible-freeze",
            "role": role,
            "approvalStatus": status,
            "bytes": path.stat().st_size if path.exists() else 0,
            "sha256": sha256(path) if path.exists() else None,
            "triangles": triangles,
            "materialCount": material_count,
            "textureReferences": texture_refs,
            "lodStatus": lod_status,
            "collisionStatus": collision_status,
        })
    manifest = {
        "schemaVersion": 2,
        "sliceId": layout["id"],
        "productionReady": False,
        "canonicalScale": layout["scaleReferences"],
        "boundsMetres": {"playableX": [0, 30], "visualX": [-2, 34], "gameplayDepth": [-0.4, 0.4]},
        "sceneMetrics": totals,
        "objectMetrics": object_metrics,
        "lodStatus": "LOD_REQUIRED_AFTER_HUMAN_DCC_GAME_MESH",
        "terrainArchitecture": str(ARCHITECTURE.relative_to(ROOT)).replace("\\", "/"),
        "collisionStatus": "Terrain_Collision_Master fingerprint frozen; Unity editor validation required",
        "visibleTerrainStatus": "DCC Terrain_Visible_Master is NOT_AUTHORED; deployed browser terrain remains frozen at commit 55cd085",
        "textureStatus": "reference image is linked for DCC handoff; no Blender production terrain UV/material/bake set exists",
        "targetDevicePerformance": "NOT_MEASURED",
        "assets": assets,
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    performance = {
        "schemaVersion": 2,
        "sliceId": layout["id"],
        "status": "DCC_HANDOFF_METRICS_ONLY_VISIBLE_TERRAIN_NOT_AUTHORED",
        "productionReady": False,
        "blenderScene": {
            "totalTrianglesIncludingGuides": totals["triangles"],
            "terrainVisibleMeshTriangles": collection_triangles["10_TERRAIN_HIGH"],
            "campProxyTriangles": collection_triangles["20_CAMP"],
            "treeProxyTriangles": collection_triangles["21_TREES"],
            "collisionTriangles": collection_triangles["12_TERRAIN_COLLISION"],
            "collisionExportTriangles": collection_triangles["90_EXPORT_COLLISION"],
            "visibleExportTriangles": collection_triangles["90_EXPORT_VISIBLE"],
            "materialDatablocks": totals["materials"],
            "imageDatablocks": totals["textures"],
        },
        "unityRuntime": {
            "visibleTriangles": "NOT_MEASURED",
            "drawCalls": "NOT_MEASURED",
            "materialCount": "NOT_MEASURED",
            "textureMemoryBytes": "NOT_MEASURED",
            "cpuFrameTimeMs": "NOT_MEASURED",
            "gpuFrameTimeMs": "NOT_MEASURED",
            "loadingTimeMs": "NOT_MEASURED",
            "reason": "Unity editor is not installed; the Hub editor download is paused."
        },
        "targetDevice": {
            "class": "iPhone 14 Pro Max landscape",
            "tested": False,
            "certified": False,
        },
    }
    PERFORMANCE.write_text(json.dumps(performance, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": report["status"], "checks": len(checks), "metrics": totals}, indent=2))
    if report["status"] == "FAIL":
        raise SystemExit(1)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise
