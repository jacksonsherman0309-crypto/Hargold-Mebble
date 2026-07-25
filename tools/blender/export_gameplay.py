"""Validate and export the GAMEPLAY collection from the current .blend to GLB."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import bpy

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import (
    GAMEPLAY_EXPORT_DIR,
    ensure_workflow_directories,
    report_validation,
    selected_export_objects,
    validate_scene,
)


def script_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output",
        type=Path,
        default=GAMEPLAY_EXPORT_DIR / "gameplay_asset_template.glb",
    )
    arguments = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(arguments)


def export_gameplay(output: Path) -> None:
    ensure_workflow_directories()
    errors = validate_scene()
    report_validation(errors)
    if errors:
        raise RuntimeError("Asset validation failed; export cancelled.")

    bpy.ops.object.select_all(action="DESELECT")
    export_objects = selected_export_objects()
    for obj in export_objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = export_objects[0]

    output = output.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(output),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
    )
    print(f"HM_GAMEPLAY_EXPORTED {output}")


if __name__ == "__main__":
    export_gameplay(script_arguments().output)
