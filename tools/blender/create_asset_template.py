"""Create the neutral gameplay-asset template and save it as a .blend file."""

from __future__ import annotations

import sys
from pathlib import Path

import bpy

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import (
    BLENDER_SOURCE_DIR,
    configure_scene,
    ensure_workflow_directories,
    move_to_collection,
    reset_scene,
)


def create_template() -> None:
    ensure_workflow_directories()
    reset_scene()
    bpy.context.preferences.filepaths.save_version = 0
    collections = configure_scene(bpy.context.scene)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.5))
    calibration = bpy.context.object
    calibration.name = "GEO_calibration_meter"
    calibration.data.name = "MESH_calibration_meter"
    calibration["export_enabled"] = True
    calibration["purpose"] = "Neutral one-meter workflow calibration asset"
    move_to_collection(calibration, collections["GAMEPLAY"])

    material = bpy.data.materials.new("MAT_calibration_neutral")
    material.diffuse_color = (0.18, 0.42, 0.24, 1.0)
    calibration.data.materials.append(material)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.5))
    collision = bpy.context.object
    collision.name = "COL_calibration_meter"
    collision.display_type = "WIRE"
    collision.hide_render = True
    collision["export_enabled"] = False
    move_to_collection(collision, collections["COLLISION"])

    bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0.0, 0.0, 0.0))
    origin = bpy.context.object
    origin.name = "SOCKET_origin"
    origin["export_enabled"] = False
    move_to_collection(origin, collections["SOCKETS"])

    bpy.ops.object.empty_add(type="CUBE", location=(0.0, 0.0, 1.0))
    reference = bpy.context.object
    reference.name = "REF_one_meter_height"
    reference.scale = (0.02, 0.02, 1.0)
    reference.display_type = "WIRE"
    reference["export_enabled"] = False
    move_to_collection(reference, collections["REFERENCE"])

    bpy.context.scene["hm_template_kind"] = "neutral-gameplay-asset"
    bpy.context.scene["hm_locked_character_assets_modified"] = False

    destination = BLENDER_SOURCE_DIR / "gameplay_asset_template.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(destination), check_existing=False)
    print(f"HM_TEMPLATE_SAVED {destination}")


if __name__ == "__main__":
    create_template()
