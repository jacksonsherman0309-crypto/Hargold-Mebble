"""Diagnostic neutral displacement measurements for a Stage 3 source."""

from __future__ import annotations

import argparse
import json
import sys

import bpy


def arguments():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--hero", choices=("Hargold", "Mebble"), required=True)
    return parser.parse_args(argv)


def measure(surface):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated = surface.evaluated_get(depsgraph)
    mesh = evaluated.to_mesh()
    distances = [(mesh.vertices[i].co - surface.data.vertices[i].co).length for i in range(len(mesh.vertices))]
    evaluated.to_mesh_clear()
    ordered = sorted(distances)
    return {"maximum": max(ordered), "mean": sum(ordered)/len(ordered), "p95": ordered[int(len(ordered)*.95)]}


def main():
    hero = arguments().hero
    surface = bpy.data.objects[f"{hero}_LOCKED_VISIBLE_SURFACE_STAGE_1"]
    result = {"hero": hero, "current": measure(surface)}
    if surface.data.shape_keys and surface.data.shape_keys.animation_data:
        for driver in surface.data.shape_keys.animation_data.drivers:
            driver.mute = True
        for key in surface.data.shape_keys.key_blocks:
            if key.name != "Basis": key.value = 0.0
        bpy.context.view_layer.update()
        result["correctiveDriversMuted"] = measure(surface)
    smooth = surface.modifiers.get("PRODUCTION_CORRECTIVE_SMOOTH")
    if smooth:
        smooth.show_viewport = False
        bpy.context.view_layer.update()
        result["armatureOnly"] = measure(surface)
    print("CODEX_DEFORMATION=" + json.dumps(result))


if __name__ == "__main__":
    main()
