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
REPORT = ROOT / "data/level-art/world-1/meadow-wake-opening-blender-validation.json"
MANIFEST = ROOT / "data/level-art/world-1/meadow-wake-opening-asset-manifest.json"
PERFORMANCE = ROOT / "data/level-art/world-1/meadow-wake-opening-performance-status.json"

REQUIRED_COLLECTIONS = [
    "00_REFERENCE", "01_GAMEPLAY_GUIDES", "02_CAMERA_GUIDES", "10_TERRAIN_HIGH",
    "11_TERRAIN_GAME", "12_TERRAIN_COLLISION", "20_CAMP", "21_TREES", "22_ROOTS",
    "23_ROCKS", "24_RUINS_AND_TIMBER", "30_FOLIAGE", "31_DECALS", "40_MIDGROUND",
    "41_BACKGROUND_INTEGRATION", "50_LIGHTING_PREVIEW", "90_EXPORT", "99_ARCHIVE_DISABLED"
]


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


def check(checks, check_id, passed, detail):
    checks.append({"id": check_id, "pass": bool(passed), "detail": detail})


def main():
    if Path(bpy.data.filepath).resolve() != BLEND.resolve():
        bpy.ops.wm.open_mainfile(filepath=str(BLEND), load_ui=False)
    layout = json.loads(LAYOUT.read_text(encoding="utf-8"))
    checks = []
    collection_names = [collection.name for collection in bpy.data.collections]
    missing = [name for name in REQUIRED_COLLECTIONS if name not in collection_names]
    check(checks, "required-collections", not missing, f"missing={missing}")
    check(checks, "metric-scene-units", bpy.context.scene.unit_settings.system == "METRIC" and bpy.context.scene.unit_settings.scale_length == 1.0,
          f"system={bpy.context.scene.unit_settings.system}, scale={bpy.context.scene.unit_settings.scale_length}")
    check(checks, "not-production-approved", bpy.context.scene.get("production_approved") is False,
          str(bpy.context.scene.get("visible_art_status")))
    ground = bpy.data.objects.get("MW_COL_OpeningGroundProfile")
    check(checks, "collision-ground-present", ground is not None and ground.type == "MESH", str(ground))
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
    check(checks, "manual-art-gates-visible", len(manual_objects) >= 10, f"manual_objects={len(manual_objects)}")
    export_objects = list(bpy.data.collections["90_EXPORT"].objects)
    invalid_export = [obj.name for obj in export_objects if obj.get("SCULPT_REQUIRED")]
    check(checks, "no-sculpt-blockout-in-export", not invalid_export, f"invalid={invalid_export}")

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
        "schemaVersion": 1,
        "asset": "Meadow Wake opening vertical slice",
        "source": str(BLEND.relative_to(ROOT)).replace("\\", "/"),
        "blenderVersion": ".".join(str(value) for value in bpy.app.version),
        "status": "PASS_STRUCTURE_ONLY_MANUAL_ART_BLOCKED" if all(item["pass"] for item in checks) else "FAIL",
        "productionReady": False,
        "checks": checks,
        "metrics": totals,
        "manualWorkRequired": [
            "manual terrain sculpt and silhouette review",
            "game-mesh retopology and deliberate LOD authoring",
            "UV unwrap, trim/material planning, and texture baking",
            "camp benchmark asset final modeling",
            "benchmark tree/root final modeling",
            "foliage, decal, midground, and background integration art review",
            "Unity editor import validation and device traversal capture",
        ],
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    assets = []
    for path, role, status, source, triangles, material_count, texture_refs, lod_status, collision_status in (
        (BLEND, "canonical Blender authoring source", "manual-art-in-progress",
         "project-authored Blender master assembled from canonical layout", totals["triangles"], totals["materials"],
         ["assets/references/terrain/meadow-wake-terrain-quality-reference.jpeg"],
         "LOD_REQUIRED_AFTER_MANUAL_GAME_MESH", "separate collision guide present"),
        (ROOT / "assets/exports/world-1/meadow-wake-opening/mw_opening_neutral_guide.glb", "neutral gameplay guide", "approved-guide-only",
         "generated from canonical layout by tools/blender/build_meadow_wake_opening_vertical_slice.py",
         collection_triangles["01_GAMEPLAY_GUIDES"] + collection_triangles["12_TERRAIN_COLLISION"], 6, [], "not-applicable-guide", "contains collision guides"),
        (ROOT / "unity/HargoldMebble/Assets/Game/Worlds/World01_MeadowWake/Art/Source/MW_Opening_BlockoutGuide.fbx", "Unity collision/blockout guide", "approved-guide-only",
         "90_EXPORT collection in canonical Blender scene", collection_triangles["90_EXPORT"], 3, [], "not-applicable-guide", "layout-derived collision only"),
    ):
        if path == BLEND:
            source = "project-authored Blender master assembled from canonical layout"
            triangles = totals["triangles"]
            material_count = totals["materials"]
            texture_refs = ["assets/references/terrain/meadow-wake-terrain-quality-reference.jpeg"]
            lod_status = "LOD_REQUIRED_AFTER_MANUAL_GAME_MESH"
            collision_status = "separate collision guide present"
        assets.append({
            "path": str(path.relative_to(ROOT)).replace("\\", "/"),
            "source": source,
            "version": "meadow-wake-opening-v0-sculpt-handoff",
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
        "schemaVersion": 1,
        "sliceId": layout["id"],
        "productionReady": False,
        "canonicalScale": layout["scaleReferences"],
        "boundsMetres": {"playableX": [0, 30], "visualX": [-2, 34], "gameplayDepth": [-0.4, 0.4]},
        "sceneMetrics": totals,
        "objectMetrics": object_metrics,
        "lodStatus": "LOD_REQUIRED_AFTER_MANUAL_GAME_MESH",
        "collisionStatus": "layout-derived guide present; Unity import validation required",
        "textureStatus": "reference texture linked; production UV/bake set not authored",
        "targetDevicePerformance": "NOT_MEASURED",
        "assets": assets,
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    performance = {
        "schemaVersion": 1,
        "sliceId": layout["id"],
        "status": "BLOCKOUT_METRICS_ONLY_UNITY_AND_DEVICE_MEASUREMENT_REQUIRED",
        "productionReady": False,
        "blenderScene": {
            "totalTrianglesIncludingGuides": totals["triangles"],
            "terrainHighBlockoutTriangles": collection_triangles["10_TERRAIN_HIGH"],
            "campBlockoutTriangles": collection_triangles["20_CAMP"],
            "treeBlockoutTriangles": collection_triangles["21_TREES"],
            "collisionTriangles": collection_triangles["12_TERRAIN_COLLISION"],
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
