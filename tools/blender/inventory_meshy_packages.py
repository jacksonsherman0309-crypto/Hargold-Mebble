"""Inventory imported Meshy rig packages with Blender's real importers.

Run with:
  blender --background --python tools/blender/inventory_meshy_packages.py -- \
    <zip-source-root> <expanded-root> <output-json>

The report is intentionally source-preserving: it fingerprints every archive
and extracted file, imports each unique FBX/GLB once, and records the skeleton,
skin, material, texture, mesh, bind-pose, and animation data needed for an
explicit runtime selection or retarget decision.
"""

from __future__ import annotations

import hashlib
import json
import math
import struct
import sys
import zipfile
from pathlib import Path

import bpy


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def clean_number(value: float) -> float:
    value = float(value)
    if not math.isfinite(value):
        return 0.0
    return round(value, 8)


def vector(values) -> list[float]:
    return [clean_number(value) for value in values]


def matrix(values) -> list[float]:
    return [clean_number(value) for row in values for value in row]


def read_glb_json(path: Path) -> dict | None:
    with path.open("rb") as source:
        header = source.read(12)
        if len(header) != 12:
            return None
        magic, version, _length = struct.unpack("<III", header)
        if magic != 0x46546C67 or version != 2:
            return None
        while True:
            chunk_header = source.read(8)
            if len(chunk_header) != 8:
                return None
            chunk_length, chunk_type = struct.unpack("<II", chunk_header)
            payload = source.read(chunk_length)
            if chunk_type == 0x4E4F534A:
                return json.loads(payload.decode("utf-8").rstrip("\x00 \t\r\n"))


def glb_source_metadata(path: Path) -> dict:
    source = read_glb_json(path)
    if not source:
        return {}
    accessors = source.get("accessors", [])
    animations = []
    for index, animation in enumerate(source.get("animations", [])):
        starts = []
        ends = []
        targeted_nodes = set()
        paths = set()
        for sampler in animation.get("samplers", []):
            accessor_index = sampler.get("input")
            if isinstance(accessor_index, int) and accessor_index < len(accessors):
                accessor = accessors[accessor_index]
                if accessor.get("min"):
                    starts.append(float(accessor["min"][0]))
                if accessor.get("max"):
                    ends.append(float(accessor["max"][0]))
        for channel in animation.get("channels", []):
            target = channel.get("target", {})
            node = target.get("node")
            if isinstance(node, int):
                targeted_nodes.add(node)
            if target.get("path"):
                paths.add(target["path"])
        start = min(starts, default=0.0)
        end = max(ends, default=start)
        animations.append(
            {
                "index": index,
                "name": animation.get("name") or f"animation_{index}",
                "durationSeconds": clean_number(max(0.0, end - start)),
                "startSeconds": clean_number(start),
                "endSeconds": clean_number(end),
                "channelCount": len(animation.get("channels", [])),
                "samplerCount": len(animation.get("samplers", [])),
                "targetedNodeCount": len(targeted_nodes),
                "targetPaths": sorted(paths),
            }
        )
    asset = source.get("asset", {})
    return {
        "assetGenerator": asset.get("generator"),
        "assetVersion": asset.get("version"),
        "sceneCount": len(source.get("scenes", [])),
        "nodeCount": len(source.get("nodes", [])),
        "meshCount": len(source.get("meshes", [])),
        "skinCount": len(source.get("skins", [])),
        "materialCount": len(source.get("materials", [])),
        "textureCount": len(source.get("textures", [])),
        "imageCount": len(source.get("images", [])),
        "animations": animations,
        "coordinateSystem": {
            "handedness": "right-handed",
            "upAxis": "+Y",
            "forwardAxis": "+Z",
            "unit": "metre",
            "authority": "glTF 2.0 specification",
        },
    }


def action_fcurves(action):
    try:
        return list(action.fcurves)
    except (AttributeError, RuntimeError):
        curves = []
        for layer in getattr(action, "layers", []):
            for strip in getattr(layer, "strips", []):
                channelbag_lookup = getattr(strip, "channelbag", None)
                if callable(channelbag_lookup):
                    for slot in getattr(action, "slots", []):
                        channelbag = channelbag_lookup(slot)
                        if channelbag:
                            curves.extend(channelbag.fcurves)
                for bag in getattr(strip, "channelbags", []):
                    curves.extend(bag.fcurves)
        return curves


def curve_key_values(curve) -> list[tuple[float, float]]:
    return [
        (float(point.co[0]), float(point.co[1]))
        for point in curve.keyframe_points
    ]


def inspect_action(action, fps: float, armature_names: set[str]) -> dict:
    start, end = (float(value) for value in action.frame_range)
    curves = action_fcurves(action)
    root_curves = []
    all_translation_curves = []
    for curve in curves:
        path = curve.data_path
        is_location = path.endswith("location")
        if not is_location:
            continue
        keys = curve_key_values(curve)
        if len(keys) < 2:
            continue
        delta = keys[-1][1] - keys[0][1]
        record = {
            "dataPath": path,
            "arrayIndex": int(curve.array_index),
            "firstValue": clean_number(keys[0][1]),
            "lastValue": clean_number(keys[-1][1]),
            "delta": clean_number(delta),
            "keyCount": len(keys),
        }
        all_translation_curves.append(record)
        lowered = path.lower()
        if (
            path == "location"
            or any(token in lowered for token in ('"root"', '"hips"', '"pelvis"'))
            or any(name.lower() in lowered for name in armature_names)
        ):
            root_curves.append(record)
    root_delta = max((abs(entry["delta"]) for entry in root_curves), default=0.0)
    return {
        "name": action.name,
        "frameStart": clean_number(start),
        "frameEnd": clean_number(end),
        "durationFrames": clean_number(max(0.0, end - start)),
        "durationSeconds": clean_number(max(0.0, end - start) / max(fps, 0.0001)),
        "frameRate": clean_number(fps),
        "curveCount": len(curves),
        "keyframePointCount": sum(len(curve.keyframe_points) for curve in curves),
        "rootMotion": {
            "detected": root_delta > 0.0001,
            "maximumRootCurveDelta": clean_number(root_delta),
            "curves": root_curves,
        },
        "translationCurveCount": len(all_translation_curves),
        "loopHeuristic": {
            "nameSuggestsLoop": any(
                token in action.name.lower()
                for token in ("idle", "walk", "run", "loop", "cycle")
            ),
            "sourceLoopMetadataPresent": False,
            "requiresVisualValidation": True,
        },
    }


def inspect_material(material) -> dict:
    textures = []
    if material.use_nodes and material.node_tree:
        for node in material.node_tree.nodes:
            if node.type != "TEX_IMAGE" or not node.image:
                continue
            image = node.image
            textures.append(
                {
                    "node": node.name,
                    "image": image.name,
                    "source": image.source,
                    "filePath": image.filepath,
                    "packed": bool(image.packed_file),
                    "size": list(image.size),
                    "colorspace": image.colorspace_settings.name,
                }
            )
    return {
        "name": material.name,
        "blendMethod": getattr(material, "surface_render_method", None)
        or getattr(material, "blend_method", None),
        "doubleSided": not bool(material.use_backface_culling),
        "usesNodes": bool(material.use_nodes),
        "textureNodes": textures,
    }


def inspect_scene(path: Path) -> dict:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    before_actions = set(bpy.data.actions)
    suffix = path.suffix.lower()
    if suffix == ".glb" or suffix == ".gltf":
        bpy.ops.import_scene.gltf(filepath=str(path), import_shading="NORMALS")
    elif suffix == ".fbx":
        bpy.ops.import_scene.fbx(
            filepath=str(path),
            automatic_bone_orientation=False,
            use_anim=True,
            use_custom_normals=True,
        )
    else:
        raise ValueError(f"unsupported 3D format: {suffix}")

    scene = bpy.context.scene
    fps = scene.render.fps / max(scene.render.fps_base, 0.0001)
    armatures = [obj for obj in scene.objects if obj.type == "ARMATURE"]
    meshes = [obj for obj in scene.objects if obj.type == "MESH"]
    imported_actions = [action for action in bpy.data.actions if action not in before_actions]
    if not imported_actions:
        imported_actions = list(bpy.data.actions)
    armature_names = {obj.name for obj in armatures}
    armature_records = []
    for armature in armatures:
        bones = []
        for bone in armature.data.bones:
            bones.append(
                {
                    "name": bone.name,
                    "parent": bone.parent.name if bone.parent else None,
                    "useDeform": bool(bone.use_deform),
                    "headLocal": vector(bone.head_local),
                    "tailLocal": vector(bone.tail_local),
                    "matrixLocal": matrix(bone.matrix_local),
                }
            )
        armature_records.append(
            {
                "name": armature.name,
                "dataName": armature.data.name,
                "boneCount": len(armature.data.bones),
                "rootBones": [bone.name for bone in armature.data.bones if not bone.parent],
                "dimensions": vector(armature.dimensions),
                "location": vector(armature.location),
                "rotationEuler": vector(armature.rotation_euler),
                "scale": vector(armature.scale),
                "bones": bones,
            }
        )

    mesh_records = []
    skinned_meshes = 0
    total_vertices = 0
    total_triangles = 0
    material_names = set()
    for obj in meshes:
        mesh = obj.data
        triangles = sum(max(0, len(polygon.vertices) - 2) for polygon in mesh.polygons)
        armature_modifiers = [
            modifier.object.name
            for modifier in obj.modifiers
            if modifier.type == "ARMATURE" and modifier.object
        ]
        has_skin = bool(armature_modifiers or obj.vertex_groups)
        skinned_meshes += int(has_skin)
        total_vertices += len(mesh.vertices)
        total_triangles += triangles
        assigned_materials = [slot.material.name for slot in obj.material_slots if slot.material]
        material_names.update(assigned_materials)
        mesh_records.append(
            {
                "object": obj.name,
                "mesh": mesh.name,
                "vertexCount": len(mesh.vertices),
                "polygonCount": len(mesh.polygons),
                "triangleCount": triangles,
                "vertexGroupCount": len(obj.vertex_groups),
                "armatureModifiers": armature_modifiers,
                "hasSkin": has_skin,
                "materialSlots": assigned_materials,
                "dimensions": vector(obj.dimensions),
                "location": vector(obj.location),
                "rotationEuler": vector(obj.rotation_euler),
                "scale": vector(obj.scale),
                "shapeKeyCount": (
                    len(mesh.shape_keys.key_blocks) if mesh.shape_keys else 0
                ),
            }
        )

    result = {
        "sourcePath": path.as_posix(),
        "sourceFormat": suffix.removeprefix(".").upper(),
        "sourceSha256": sha256(path),
        "sourceBytes": path.stat().st_size,
        "blenderImport": {
            "blenderVersion": bpy.app.version_string,
            "sceneFrameRate": clean_number(fps),
            "sceneUnitSystem": scene.unit_settings.system,
            "sceneScaleLength": clean_number(scene.unit_settings.scale_length),
            "objectCount": len(scene.objects),
        },
        "summary": {
            "meshCount": len(meshes),
            "skinnedMeshCount": skinned_meshes,
            "armatureCount": len(armatures),
            "boneCount": sum(len(obj.data.bones) for obj in armatures),
            "actionCount": len(imported_actions),
            "materialCount": len(material_names),
            "totalVertices": total_vertices,
            "totalTriangles": total_triangles,
            "containsSkin": skinned_meshes > 0,
            "containsDuplicateVisibleMeshCandidate": bool(meshes and imported_actions),
        },
        "armatures": armature_records,
        "meshes": mesh_records,
        "materials": [
            inspect_material(material)
            for material in bpy.data.materials
            if material.name in material_names
        ],
        "images": [
            {
                "name": image.name,
                "filePath": image.filepath,
                "source": image.source,
                "packed": bool(image.packed_file),
                "size": list(image.size),
                "colorspace": image.colorspace_settings.name,
            }
            for image in bpy.data.images
        ],
        "actions": [
            inspect_action(action, fps, armature_names)
            for action in imported_actions
        ],
    }
    if suffix == ".glb":
        result["glbSource"] = glb_source_metadata(path)
    else:
        result["sourceCoordinateAssessment"] = {
            "upAxis": "normalized by Blender FBX importer",
            "forwardAxis": "normalized by Blender FBX importer",
            "unitScale": "normalized by Blender FBX importer",
            "requiresSourceExporterMetadataForExactPreImportAxes": True,
        }
    return result


def archive_records(zip_root: Path) -> list[dict]:
    records = []
    for path in sorted(zip_root.glob("*.zip")):
        with zipfile.ZipFile(path) as archive:
            entries = [
                {
                    "path": info.filename,
                    "bytes": info.file_size,
                    "compressedBytes": info.compress_size,
                    "crc32": f"{info.CRC:08X}",
                }
                for info in archive.infolist()
                if not info.is_dir()
            ]
        records.append(
            {
                "name": path.name,
                "path": path.as_posix(),
                "bytes": path.stat().st_size,
                "sha256": sha256(path),
                "entries": entries,
            }
        )
    hashes = {}
    for record in records:
        hashes.setdefault(record["sha256"], []).append(record["name"])
    for record in records:
        record["byteIdenticalArchives"] = [
            name for name in hashes[record["sha256"]] if name != record["name"]
        ]
    return records


def main() -> None:
    arguments = sys.argv[sys.argv.index("--") + 1 :]
    if len(arguments) != 3:
        raise SystemExit("expected: <zip-source-root> <expanded-root> <output-json>")
    zip_root, expanded_root, output_path = map(Path, arguments)
    files = []
    unique_assets = {}
    for path in sorted(item for item in expanded_root.rglob("*") if item.is_file()):
        fingerprint = sha256(path)
        record = {
            "path": path.as_posix(),
            "bytes": path.stat().st_size,
            "sha256": fingerprint,
            "extension": path.suffix.lower(),
        }
        files.append(record)
        if path.suffix.lower() in {".fbx", ".glb", ".gltf"}:
            unique_assets.setdefault(fingerprint, path)

    inspections = []
    failures = []
    for index, path in enumerate(unique_assets.values(), start=1):
        print(f"[{index}/{len(unique_assets)}] Inspecting {path}", flush=True)
        try:
            inspections.append(inspect_scene(path))
        except Exception as error:
            failures.append(
                {
                    "sourcePath": path.as_posix(),
                    "errorType": type(error).__name__,
                    "message": str(error),
                }
            )

    report = {
        "schemaVersion": 1,
        "generatedBy": "tools/blender/inventory_meshy_packages.py",
        "sourcePolicy": {
            "visibleAppearanceLocked": True,
            "controllerOwnsTranslation": True,
            "rootMotionDefault": "neutralize",
            "duplicateAnimationMeshesLive": False,
        },
        "packages": archive_records(zip_root),
        "extractedFiles": files,
        "unique3DAssetCount": len(unique_assets),
        "assets": inspections,
        "inspectionFailures": failures,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Wrote {output_path}", flush=True)
    if failures:
        raise SystemExit(f"{len(failures)} asset inspections failed")


if __name__ == "__main__":
    main()
