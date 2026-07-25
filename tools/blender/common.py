"""Shared Blender workflow helpers for Hargold & Mebble."""

from __future__ import annotations

import json
from pathlib import Path

import bpy


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
BLENDER_SOURCE_DIR = REPOSITORY_ROOT / "assets" / "blender"
GAMEPLAY_EXPORT_DIR = REPOSITORY_ROOT / "assets" / "exports"

COLLECTION_NAMES = ("GAMEPLAY", "COLLISION", "SOCKETS", "REFERENCE")
EXPORT_COLLECTION = "GAMEPLAY"
SCENE_CONTRACT_VERSION = "1"


def ensure_workflow_directories() -> None:
    BLENDER_SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    GAMEPLAY_EXPORT_DIR.mkdir(parents=True, exist_ok=True)


def reset_scene() -> None:
    if bpy.context.object and bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

    for collection in list(bpy.data.collections):
        bpy.data.collections.remove(collection)


def configure_scene(scene: bpy.types.Scene) -> dict[str, bpy.types.Collection]:
    scene.name = "HargoldMebbleAsset"
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    scene.unit_settings.length_unit = "METERS"
    scene.render.engine = "BLENDER_EEVEE"

    scene["hm_contract_version"] = SCENE_CONTRACT_VERSION
    scene["hm_gameplay_plane"] = "X/Z"
    scene["hm_depth_axis"] = "Y"
    scene["hm_units"] = "meters"
    scene["hm_character_design_policy"] = (
        "Approved Hargold and Mebble designs are locked; character changes require approval."
    )

    collections = {}
    for name in COLLECTION_NAMES:
        collection = bpy.data.collections.new(name)
        scene.collection.children.link(collection)
        collections[name] = collection
    return collections


def move_to_collection(
    obj: bpy.types.Object, destination: bpy.types.Collection
) -> None:
    for collection in tuple(obj.users_collection):
        collection.objects.unlink(obj)
    destination.objects.link(obj)


def selected_export_objects() -> list[bpy.types.Object]:
    gameplay = bpy.data.collections.get(EXPORT_COLLECTION)
    if gameplay is None:
        return []
    return [
        obj
        for obj in gameplay.all_objects
        if obj.type in {"MESH", "EMPTY", "ARMATURE"} and obj.get("export_enabled", True)
    ]


def validate_scene() -> list[str]:
    scene = bpy.context.scene
    errors: list[str] = []

    if scene.unit_settings.system != "METRIC":
        errors.append("Scene units must use METRIC.")
    if abs(scene.unit_settings.scale_length - 1.0) > 1e-9:
        errors.append("Scene scale_length must be 1.0 meter.")
    if scene.get("hm_gameplay_plane") != "X/Z":
        errors.append("Scene gameplay plane metadata must be X/Z.")
    if scene.get("hm_depth_axis") != "Y":
        errors.append("Scene depth axis metadata must be Y.")

    for name in COLLECTION_NAMES:
        if bpy.data.collections.get(name) is None:
            errors.append(f"Required collection is missing: {name}")

    export_objects = selected_export_objects()
    if not export_objects:
        errors.append("GAMEPLAY must contain at least one export-enabled object.")

    for obj in export_objects:
        if obj.name.startswith(("COL_", "REF_")):
            errors.append(f"Non-gameplay object is in GAMEPLAY: {obj.name}")
        if obj.type == "MESH" and len(obj.data.vertices) == 0:
            errors.append(f"Mesh has no vertices: {obj.name}")

    return errors


def report_validation(errors: list[str]) -> None:
    payload = {
        "blend_file": bpy.data.filepath,
        "contract_version": bpy.context.scene.get("hm_contract_version"),
        "export_objects": [obj.name for obj in selected_export_objects()],
        "errors": errors,
        "valid": not errors,
    }
    print("HM_VALIDATION " + json.dumps(payload, sort_keys=True))
