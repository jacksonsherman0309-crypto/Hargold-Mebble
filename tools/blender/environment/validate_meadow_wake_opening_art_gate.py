"""Validate the Meadow Wake opening Blender art-gate scene contract."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[3]
REQUIRED_COLLECTIONS = (
    "00_REFERENCE", "01_GAMEPLAY_GUIDES", "02_CAMERA_GUIDES", "10_TERRAIN_HIGH",
    "11_TERRAIN_RENDER", "12_TERRAIN_COLLISION_FUTURE", "20_CAMP", "21_TREES",
    "22_ROOTS", "23_ROCKS", "24_TIMBER_AND_STRUCTURES", "30_FOLIAGE",
    "31_FLOWERS_AND_GROUND_COVER", "32_DECALS", "40_MIDGROUND", "41_BACKGROUND",
    "50_LIGHTING", "60_CHARACTERS_REFERENCE", "90_EXPORT_FUTURE", "99_DISABLED_ARCHIVE",
)
REFERENCE_PATHS = {
    "quality_target": ROOT / "assets/references/terrain/meadow-wake-production-quality-target.jpeg",
    "current_gameplay": ROOT / "assets/references/terrain/meadow-wake-current-deployment.png",
}
REVIEW_IMAGES = {
    "01_current-deployment.png": (1536, 864),
    "02_blockout-composition.png": (1536, 864),
    "03_clay-render.png": (1536, 864),
    "04_material-render.png": (1536, 864),
    "05_final-lighting-render.png": (1536, 864),
    "06_wireframe-render.png": (1536, 864),
    "07_side-by-side-target-comparison.png": (3072, 864),
    "08_four-up-review-sheet.png": (3072, 1728),
}


def arguments():
    raw = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--report", required=True)
    return parser.parse_args(raw)


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def collection_stats():
    stats = {}
    for name in REQUIRED_COLLECTIONS:
        collection = bpy.data.collections.get(name)
        if collection:
            direct = list(collection.objects)
            stats[name] = {
                "objects": len(direct),
                "meshes": sum(obj.type == "MESH" for obj in direct),
                "curves": sum(obj.type == "CURVE" for obj in direct),
                "lights": sum(obj.type == "LIGHT" for obj in direct),
                "render_hidden": bool(collection.hide_render),
            }
    return stats


def main():
    args = arguments()
    scene = bpy.context.scene
    errors = []
    warnings = []
    missing_collections = [name for name in REQUIRED_COLLECTIONS if name not in bpy.data.collections]
    if missing_collections:
        errors.append(f"Missing collections: {missing_collections}")

    camera = bpy.data.objects.get("MW_CAM_OpeningArtGate")
    if not camera or camera.type != "CAMERA":
        errors.append("MW_CAM_OpeningArtGate is missing or not a camera")
    else:
        if camera.data.type != "ORTHO" or abs(camera.data.ortho_scale - 14.0) > 1e-5:
            errors.append("Locked camera projection or scale changed")
        if camera.get("camera_lock_status") != "LOCKED_AFTER_BLOCKOUT":
            errors.append("Camera lock marker is missing")
    if (scene.render.resolution_x, scene.render.resolution_y) != (1536, 864):
        errors.append("Review resolution is not 1536x864")
    if scene.unit_settings.system != "METRIC" or abs(scene.unit_settings.scale_length - 1.0) > 1e-8:
        errors.append("Scene scale is not one Blender metre per gameplay metre")

    ref_collection = bpy.data.collections.get("00_REFERENCE")
    refs = list(ref_collection.objects) if ref_collection else []
    if len(refs) != 2:
        errors.append(f"Expected exactly two reference empties; found {len(refs)}")
    for obj in refs:
        if obj.type != "EMPTY" or obj.empty_display_type != "IMAGE":
            errors.append(f"Reference {obj.name} is not an image empty")
        if not obj.hide_render or not obj.get("non_rendering_reference"):
            errors.append(f"Reference {obj.name} is not locked non-rendering")
    if ref_collection and not ref_collection.hide_render:
        errors.append("00_REFERENCE collection must be render-hidden")

    reference_resolved = {str(path.resolve()).lower() for path in REFERENCE_PATHS.values()}
    prohibited_uses = []
    for material in bpy.data.materials:
        if material.use_nodes:
            for node in material.node_tree.nodes:
                image = getattr(node, "image", None)
                if image and image.filepath:
                    resolved = str(bpy.path.abspath(image.filepath)).lower()
                    if resolved in reference_resolved:
                        prohibited_uses.append(f"material:{material.name}")
    if prohibited_uses:
        errors.append(f"Reference image used by renderer: {prohibited_uses}")

    visible_diagnostics = []
    for collection_name in ("01_GAMEPLAY_GUIDES", "12_TERRAIN_COLLISION_FUTURE", "90_EXPORT_FUTURE", "99_DISABLED_ARCHIVE"):
        collection = bpy.data.collections.get(collection_name)
        if collection and not collection.hide_render:
            visible_diagnostics.append(collection_name)
    if visible_diagnostics:
        errors.append(f"Diagnostic/future collections render-visible: {visible_diagnostics}")

    external_files = []
    missing_files = []
    for image in bpy.data.images:
        if image.source == "FILE" and image.filepath:
            resolved = Path(bpy.path.abspath(image.filepath)).resolve()
            external_files.append(str(resolved))
            if not resolved.exists():
                missing_files.append(str(resolved))
    if missing_files:
        errors.append(f"Missing external image files: {missing_files}")

    stats = collection_stats()
    required_render_counts = {
        "10_TERRAIN_HIGH": 1, "11_TERRAIN_RENDER": 1, "20_CAMP": 25,
        "21_TREES": 8, "22_ROOTS": 6, "23_ROCKS": 40,
        "24_TIMBER_AND_STRUCTURES": 12, "30_FOLIAGE": 10,
        "40_MIDGROUND": 10, "41_BACKGROUND": 8, "50_LIGHTING": 3,
    }
    for name, minimum in required_render_counts.items():
        count = stats.get(name, {}).get("objects", 0)
        if count < minimum:
            errors.append(f"{name} has {count} objects; expected at least {minimum}")

    reference_evidence = {}
    for role, path in REFERENCE_PATHS.items():
        image = next((img for img in bpy.data.images if Path(bpy.path.abspath(img.filepath)).resolve() == path.resolve()), None)
        reference_evidence[role] = {
            "path": str(path.relative_to(ROOT)).replace("\\", "/"),
            "sha256": sha256(path),
            "dimensions": list(image.size) if image else None,
            "bytes": path.stat().st_size,
        }

    review_evidence = {}
    review_root = ROOT / "art-review/meadow-wake-opening"
    for name, expected_dimensions in REVIEW_IMAGES.items():
        path = review_root / name
        if not path.exists():
            errors.append(f"Missing review image: {path}")
            continue
        image = bpy.data.images.load(str(path), check_existing=False)
        dimensions = tuple(image.size)
        review_evidence[name] = {
            "dimensions": list(dimensions),
            "bytes": path.stat().st_size,
            "sha256": sha256(path),
        }
        if dimensions != expected_dimensions:
            errors.append(f"{name} is {dimensions}; expected {expected_dimensions}")
        bpy.data.images.remove(image)

    polygon_count = sum(len(mesh.polygons) for mesh in bpy.data.meshes)
    vertex_count = sum(len(mesh.vertices) for mesh in bpy.data.meshes)
    report = {
        "valid": not errors,
        "errors": errors,
        "warnings": warnings,
        "blender": bpy.app.version_string,
        "scene": scene.name,
        "blend": bpy.data.filepath,
        "camera": {
            "name": camera.name if camera else None,
            "type": camera.data.type if camera else None,
            "ortho_scale_width_m": camera.data.ortho_scale if camera else None,
            "vertical_field_m_at_16_9": camera.data.ortho_scale * 9 / 16 if camera else None,
            "location": list(camera.location) if camera else None,
            "rotation_euler": list(camera.rotation_euler) if camera else None,
            "resolution": [scene.render.resolution_x, scene.render.resolution_y],
            "lock_status": camera.get("camera_lock_status") if camera else None,
            "hero_screen_fraction": camera.get("hargold_height_fraction") if camera else None,
            "walking_surface_screen_fraction": camera.get("walking_surface_screen_fraction") if camera else None,
        },
        "counts": {
            "objects": len(bpy.data.objects), "meshes": len(bpy.data.meshes),
            "curves": len(bpy.data.curves), "materials": len(bpy.data.materials),
            "lights": len(bpy.data.lights), "vertices": vertex_count, "polygons": polygon_count,
        },
        "collections": stats,
        "external_files": external_files,
        "missing_external_files": missing_files,
        "references": reference_evidence,
        "review_images": review_evidence,
        "scene_contract": {
            "production_approved": bool(scene.get("production_approved", False)),
            "integration_status": scene.get("integration_status"),
            "browser_renderer_modified": bool(scene.get("browser_renderer_modified", True)),
            "collision_implementation_status": scene.get("collision_implementation_status"),
        },
    }
    output = Path(args.report).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))
    if errors:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
