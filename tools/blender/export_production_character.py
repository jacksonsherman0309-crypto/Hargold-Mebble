"""Export a built production character source without rebuilding its meshes."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_locked_characters as riglib
from build_production_character_staging import (
    GENERATION,
    ROOT,
    export_glb,
)


def main():
    source = Path(bpy.data.filepath)
    hero = source.stem.removesuffix("_character").capitalize()
    scene = bpy.context.scene
    if scene.get("geometryGeneration") != GENERATION:
        raise RuntimeError("refusing to export a non-production character source")
    armature = bpy.data.objects.get(f"RIG_{hero.upper()}")
    if armature is None:
        raise RuntimeError(f"missing RIG_{hero.upper()}")
    output_directory = (
        ROOT / "assets" / "exports" / "production-staging"
        if source.parent.name == "production-staging"
        else ROOT / "assets" / "exports"
    )
    output_directory.mkdir(parents=True, exist_ok=True)
    output = output_directory / f"{hero.lower()}_character.glb"
    riglib.restore_bone_parent_bindings(armature)
    export_glb(hero, armature, output)
    riglib.restore_bone_parent_bindings(armature)
    print("HM_PRODUCTION_CHARACTER_EXPORTED " + json.dumps({
        "hero": hero,
        "source": str(source),
        "output": str(output),
        "bytes": output.stat().st_size,
    }, sort_keys=True))


if __name__ == "__main__":
    main()
