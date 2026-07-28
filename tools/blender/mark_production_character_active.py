"""Mark a validated production-topology character source as the active candidate."""

from __future__ import annotations

import json
from pathlib import Path

import bpy


def mark_active() -> dict:
    source = Path(bpy.data.filepath)
    hero = source.stem.removesuffix("_character").capitalize()
    scene = bpy.context.scene
    if scene.get("geometryGeneration") != "production-organic-silhouette-v5":
        raise RuntimeError("refusing to activate a non-organic-silhouette source")
    if scene.get("reusesPriorGeometry") is not False:
        raise RuntimeError("refusing to activate a source without no-reuse provenance")
    scene["assetVersion"] = "5.0.0-organic-silhouette-candidate-active"
    scene["referenceHash"] = (
        "4004C659783AC41ED09E6AF18D25F776DFB19BE44B9E7066289627E016A7B4E4"
        if hero == "Hargold"
        else "1A85C41AFC53061612B772F221A3F354E4E58C015F4753AFF2C3C44EC80662D0"
    )
    scene["author"] = "Hargold & Mebble production pipeline"
    scene["blenderVersion"] = bpy.app.version_string
    scene["reviewStatus"] = (
        "organic-silhouette-candidate-active-visual-approval-pending"
    )
    bpy.ops.wm.save_as_mainfile(filepath=str(source), check_existing=False)
    result = {"hero": hero, "source": str(source), "reviewStatus": scene["reviewStatus"]}
    print("HM_PRODUCTION_CHARACTER_MARKED_ACTIVE " + json.dumps(result, sort_keys=True))
    return result


if __name__ == "__main__":
    mark_active()
