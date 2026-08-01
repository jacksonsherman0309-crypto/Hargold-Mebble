"""Print connected-component bounds for a production character surface."""

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


def main():
    hero = arguments().hero
    obj = bpy.data.objects[f"{hero}_LOCKED_VISIBLE_SURFACE_STAGE_1"]
    mesh = obj.data
    adjacency = [[] for _ in mesh.vertices]
    for edge in mesh.edges:
        a, b = edge.vertices
        adjacency[a].append(b)
        adjacency[b].append(a)
    seen = set()
    components = []
    for start in range(len(mesh.vertices)):
        if start in seen:
            continue
        stack = [start]
        seen.add(start)
        indices = []
        while stack:
            index = stack.pop()
            indices.append(index)
            for linked in adjacency[index]:
                if linked not in seen:
                    seen.add(linked)
                    stack.append(linked)
        coords = [mesh.vertices[index].co for index in indices]
        components.append({
            "count": len(indices),
            "min": [min(co[axis] for co in coords) for axis in range(3)],
            "max": [max(co[axis] for co in coords) for axis in range(3)],
            "center": [sum(co[axis] for co in coords) / len(coords) for axis in range(3)],
        })
    components.sort(key=lambda item: -item["count"])
    print("CODEX_COMPONENTS=" + json.dumps({"hero": hero, "count": len(components), "top": components[:40]}))


if __name__ == "__main__":
    main()
