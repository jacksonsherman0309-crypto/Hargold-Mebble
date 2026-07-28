"""Report connected surfaces and production metadata for a character mesh.

Run inside Blender:

    blender --background file.blend --python tools/blender/inspect_character_topology.py
"""

from __future__ import annotations

import json

import bpy
from mathutils import Vector


def component_sizes(mesh):
    adjacency = [[] for _ in mesh.vertices]
    for edge in mesh.edges:
        first, second = edge.vertices
        adjacency[first].append(second)
        adjacency[second].append(first)
    seen = set()
    sizes = []
    for start in range(len(adjacency)):
        if start in seen:
            continue
        stack = [start]
        seen.add(start)
        size = 0
        while stack:
            vertex = stack.pop()
            size += 1
            for neighbor in adjacency[vertex]:
                if neighbor not in seen:
                    seen.add(neighbor)
                    stack.append(neighbor)
        sizes.append(size)
    return sorted(sizes, reverse=True)


reports = []
for obj in bpy.data.objects:
    if obj.type != "MESH" or not obj.name.endswith("_skin_body"):
        continue
    reports.append({
        "name": obj.name,
        "vertices": len(obj.data.vertices),
        "polygons": len(obj.data.polygons),
        "connectedComponents": component_sizes(obj.data),
        "geometryGeneration": obj.get("geometry_generation"),
        "surfaceRole": obj.get("surface_role"),
        "integratedAnatomy": obj.get("integrated_anatomy"),
    })

print("HM_CHARACTER_TOPOLOGY " + json.dumps(reports, sort_keys=True))

scene = bpy.context.scene
graph = bpy.context.evaluated_depsgraph_get()
visible_bounds = []
for obj in scene.objects:
    if (
        obj.type not in {"MESH", "CURVE"}
        or obj.hide_render
        or obj.name.startswith(("QA_", "GUIDE_", "JOINT_", "REF_"))
    ):
        continue
    evaluated = obj.evaluated_get(graph)
    corners = [evaluated.matrix_world @ Vector(corner) for corner in evaluated.bound_box]
    center = sum(corners, Vector()) / len(corners)
    visible_bounds.append({
        "name": obj.name,
        "center": [round(value, 4) for value in center],
        "dimensions": [round(value, 4) for value in evaluated.dimensions],
    })
print("HM_CHARACTER_VISIBLE_BOUNDS " + json.dumps(visible_bounds, sort_keys=True))
