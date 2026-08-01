"""Build the original Verdant Vale foreground finishing kit.

The kit contains authored mesh families for Meadow Wake's twelve-room
foreground. It is decorative visible terrain only: deterministic gameplay
collision remains in the browser runtime's authored X/Z course profile.
"""

from __future__ import annotations

import math
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SOURCE_DIR = ROOT / "assets" / "blender" / "world-1"
EXPORT_DIR = ROOT / "assets" / "exports" / "world-1"
ASSET_NAME = "verdant_vale_terrain_kit"


def reset_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.name = "VerdantValeTerrainKit"
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    scene["hm_asset_status"] = "production-intent-original-terrain-kit"
    scene["hm_course"] = "1-1 Meadow Wake"
    scene["hm_visible_terrain_only"] = True
    scene["hm_collision_source"] = "MEADOW_WAKE_TERRAIN_POINTS"
    scene["hm_originality"] = "Original Hargold & Mebble environment asset"


def make_material(
    name: str,
    color: tuple[float, float, float, float],
    roughness: float = 0.9,
    metallic: float = 0.0,
) -> bpy.types.Material:
    material = bpy.data.materials.new(name)
    material.diffuse_color = color
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    return material


def component(name: str) -> bpy.types.Object:
    root = bpy.data.objects.new(name, None)
    root["hm_terrain_component"] = True
    root["hm_collision_bearing"] = False
    bpy.context.scene.collection.objects.link(root)
    return root


def finish(
    obj: bpy.types.Object,
    name: str,
    material: bpy.types.Material,
    parent: bpy.types.Object,
    bevel: float = 0.025,
    smooth: bool = True,
) -> bpy.types.Object:
    obj.name = name
    obj.parent = parent
    obj.data.materials.append(material)
    if bevel > 0:
        modifier = obj.modifiers.new("ProductionBevel", "BEVEL")
        modifier.width = bevel
        modifier.segments = 2
    if smooth and obj.type == "MESH":
        for polygon in obj.data.polygons:
            polygon.use_smooth = True
    obj["hm_visible_terrain"] = True
    obj["hm_collision_bearing"] = False
    return obj


def stone(
    parent: bpy.types.Object,
    name: str,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    material: bpy.types.Material,
    rotation: tuple[float, float, float] = (0.0, 0.0, 0.0),
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=2,
        radius=0.5,
        location=location,
        rotation=rotation,
    )
    obj = finish(bpy.context.object, name, material, parent, 0.018, True)
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return obj


def beam_between(
    parent: bpy.types.Object,
    name: str,
    start: tuple[float, float, float],
    end: tuple[float, float, float],
    radius_start: float,
    radius_end: float,
    material: bpy.types.Material,
    vertices: int = 12,
) -> bpy.types.Object:
    start_vector = Vector(start)
    end_vector = Vector(end)
    direction = end_vector - start_vector
    midpoint = (start_vector + end_vector) * 0.5
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices,
        radius1=radius_start,
        radius2=radius_end,
        depth=direction.length,
        location=midpoint,
    )
    obj = finish(bpy.context.object, name, material, parent, 0.012, True)
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(direction.normalized())
    return obj


def rounded_box(
    parent: bpy.types.Object,
    name: str,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    material: bpy.types.Material,
    rotation: tuple[float, float, float] = (0.0, 0.0, 0.0),
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = finish(bpy.context.object, name, material, parent, 0.055, False)
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return obj


def grass_tuft(
    parent: bpy.types.Object,
    name: str,
    location: tuple[float, float, float],
    scale: float,
    material: bpy.types.Material,
) -> None:
    for index, angle in enumerate((-0.34, -0.12, 0.12, 0.34)):
        bpy.ops.mesh.primitive_cone_add(
            vertices=5,
            radius1=0.055 * scale,
            radius2=0.0,
            depth=(0.34 + index % 2 * 0.08) * scale,
            location=(
                location[0] + (index - 1.5) * 0.075 * scale,
                location[1],
                location[2] + 0.17 * scale,
            ),
            rotation=(0.0, angle, 0.0),
        )
        finish(
            bpy.context.object,
            f"{name}_Blade_{index}",
            material,
            parent,
            0.006,
            True,
        )


def moss_ribbon(
    parent: bpy.types.Object,
    name: str,
    width: float,
    location: tuple[float, float, float],
    material: bpy.types.Material,
) -> None:
    rounded_box(parent, name, location, (width / 2, 0.36, 0.07), material)
    for index in range(max(3, round(width * 2.2))):
        x = -width * 0.43 + index * width * 0.86 / max(1, round(width * 2.2) - 1)
        grass_tuft(parent, f"{name}_Tuft_{index}", (location[0] + x, -0.39, location[2] + 0.08), 0.72, material)


def build_compacted_edge(materials: dict[str, bpy.types.Material]) -> None:
    root = component("TerrainKit_CompactedEdge")
    stone_specs = (
        (-1.0, 0.12, 0.30, 0.72, 0.30, 0.40, -0.12),
        (-0.44, 0.08, 0.20, 0.54, 0.25, 0.34, 0.18),
        (0.12, 0.08, 0.27, 0.64, 0.31, 0.38, -0.08),
        (0.73, 0.10, 0.22, 0.70, 0.28, 0.42, 0.11),
        (1.18, 0.07, 0.17, 0.46, 0.22, 0.31, -0.16),
    )
    for index, (x, y, z, sx, sy, sz, rotation) in enumerate(stone_specs):
        stone(
            root,
            f"CompactedEdge_Fieldstone_{index}",
            (x, y, z),
            (sx, sy, sz),
            materials["stone_light" if index % 2 else "stone"],
            (0.0, rotation * 0.35, rotation),
        )
    beam_between(root, "CompactedEdge_ExposedRoot", (-1.35, 0.05, 0.58), (0.82, 0.0, 0.12), 0.095, 0.045, materials["root"])
    moss_ribbon(root, "CompactedEdge_MossCrown", 2.7, (0.0, 0.0, 0.62), materials["grass"])


def build_root_bank(materials: dict[str, bpy.types.Material]) -> None:
    root = component("TerrainKit_RootBank")
    for index, (start_x, end_x, height) in enumerate((
        (-1.25, -0.45, 0.92),
        (-0.72, 0.10, 1.08),
        (-0.18, 0.65, 0.84),
        (0.34, 1.20, 1.02),
    )):
        beam_between(
            root,
            f"RootBank_Buttress_{index}",
            (start_x, 0.02, 0.06),
            (end_x, 0.04, height),
            0.15 - index * 0.012,
            0.075,
            materials["root_light" if index % 2 else "root"],
        )
    for index, x in enumerate((-1.05, -0.45, 0.18, 0.78, 1.16)):
        stone(
            root,
            f"RootBank_BeddedStone_{index}",
            (x, 0.1 + index % 2 * 0.04, 0.24 + index % 3 * 0.12),
            (0.54, 0.28, 0.36),
            materials["stone" if index % 2 else "stone_light"],
            (0.0, index * 0.08, -0.16 + index * 0.07),
        )
    moss_ribbon(root, "RootBank_MossCrown", 2.7, (0.0, 0.0, 1.02), materials["grass_dark"])


def build_ruin_foundation(materials: dict[str, bpy.types.Material]) -> None:
    root = component("TerrainKit_RuinFoundation")
    for row in range(3):
        columns = 4 - (1 if row == 2 else 0)
        for column in range(columns):
            x = (column - (columns - 1) / 2) * 0.69 + (row % 2) * 0.11
            z = 0.27 + row * 0.48
            scale = (0.40 + (column + row) % 2 * 0.05, 0.34, 0.29)
            stone(
                root,
                f"RuinFoundation_Fieldstone_{row}_{column}",
                (x, 0.06 + column % 2 * 0.03, z),
                scale,
                materials["ruin_light" if (row + column) % 3 == 0 else "ruin"],
                (0.0, column * 0.05, (-0.06 + column * 0.035) * (1 if row % 2 else -1)),
            )
    rounded_box(root, "RuinFoundation_FracturedCap", (0.0, 0.0, 1.57), (1.34, 0.34, 0.12), materials["ruin"])
    moss_ribbon(root, "RuinFoundation_Moss", 2.5, (0.0, -0.02, 1.73), materials["grass_dark"])


def build_camp_foundation(materials: dict[str, bpy.types.Material]) -> None:
    root = component("TerrainKit_CampFoundation")
    for index, x in enumerate((-1.15, -0.38, 0.38, 1.15)):
        rounded_box(
            root,
            f"CampFoundation_Timber_{index}",
            (x, 0.0, 0.28 + index % 2 * 0.035),
            (0.35, 0.40, 0.16),
            materials["wood_light" if index % 2 else "wood"],
            (0.0, 0.0, (-0.025 + index * 0.014)),
        )
    for side in (-1, 1):
        beam_between(
            root,
            f"CampFoundation_RetainingPost_{side}",
            (side * 1.28, -0.05, 0.0),
            (side * 1.28, -0.05, 1.08),
            0.12,
            0.10,
            materials["wood"],
        )
        beam_between(
            root,
            f"CampFoundation_Brace_{side}",
            (side * 0.18, -0.02, 0.02),
            (side * 1.16, -0.02, 0.86),
            0.08,
            0.065,
            materials["wood_light"],
        )
    moss_ribbon(root, "CampFoundation_GrowingEdge", 2.8, (0.0, -0.03, 0.70), materials["grass"])


def build_bridge_abutment(materials: dict[str, bpy.types.Material]) -> None:
    root = component("TerrainKit_BridgeAbutment")
    for row in range(4):
        for column in range(3):
            stone(
                root,
                f"BridgeAbutment_LoadStone_{row}_{column}",
                ((column - 1) * 0.61 + row % 2 * 0.09, 0.0, 0.26 + row * 0.43),
                (0.36 + (row + column) % 2 * 0.04, 0.34, 0.27),
                materials["stone_light" if (row + column) % 3 == 0 else "stone"],
                (0.0, column * 0.04, -0.08 + column * 0.07),
            )
    beam_between(root, "BridgeAbutment_AnchorPost", (0.0, 0.03, 0.42), (0.0, 0.03, 2.18), 0.15, 0.12, materials["wood"])
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.22,
        minor_radius=0.045,
        major_segments=20,
        minor_segments=7,
        location=(0.0, -0.12, 1.87),
        rotation=(math.pi / 2, 0.0, 0.0),
    )
    finish(bpy.context.object, "BridgeAbutment_AnchorRing", materials["iron"], root, 0.008, True)
    moss_ribbon(root, "BridgeAbutment_MossCrown", 1.85, (0.0, 0.0, 1.98), materials["grass_dark"])


def build_mill_race(materials: dict[str, bpy.types.Material]) -> None:
    root = component("TerrainKit_MillRace")
    for side in (-1, 1):
        for index in range(4):
            stone(
                root,
                f"MillRace_ChannelStone_{side}_{index}",
                (side * (0.62 + index * 0.05), 0.0, 0.24 + index * 0.39),
                (0.42, 0.36, 0.29),
                materials["stone_light" if index % 2 else "stone"],
                (0.0, side * index * 0.04, side * (-0.09 + index * 0.035)),
            )
    rounded_box(root, "MillRace_WornSill", (0.0, 0.0, 1.63), (1.10, 0.38, 0.12), materials["stone_light"])
    beam_between(root, "MillRace_FallenBranch", (-0.98, -0.28, 1.78), (0.72, -0.3, 1.92), 0.08, 0.05, materials["root"])
    for x in (-1.0, -0.78, 0.80, 1.02):
        grass_tuft(root, f"MillRace_Reeds_{x}", (x, -0.28, 1.67), 1.08, materials["grass_dark"])


def build_overlook_edge(materials: dict[str, bpy.types.Material]) -> None:
    root = component("TerrainKit_OverlookEdge")
    for index in range(7):
        x = -1.18 + index * 0.39
        z = 0.22 + index % 3 * 0.17
        stone(
            root,
            f"OverlookEdge_FracturedStone_{index}",
            (x, 0.03, z),
            (0.43 + index % 2 * 0.08, 0.33, 0.34),
            materials["stone_light" if index % 3 == 0 else "stone"],
            (0.0, index * 0.04, -0.16 + index * 0.045),
        )
    beam_between(root, "OverlookEdge_ExposedRoot", (-1.24, 0.04, 0.76), (1.1, 0.0, 0.31), 0.13, 0.055, materials["root"])
    moss_ribbon(root, "OverlookEdge_FloweringCrown", 2.75, (0.0, 0.0, 0.86), materials["grass"])
    for index, x in enumerate((-0.86, -0.22, 0.48, 0.94)):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.055, location=(x, -0.4, 1.12 + index % 2 * 0.06))
        finish(
            bpy.context.object,
            f"OverlookEdge_Wildflower_{index}",
            materials["flower_gold" if index % 2 else "flower_white"],
            root,
            0.004,
            True,
        )


def consolidate_components() -> None:
    """Keep one multi-material mesh per kit component for mobile draw economy."""

    roots = [
        obj
        for obj in bpy.context.scene.objects
        if obj.type == "EMPTY" and obj.get("hm_terrain_component")
    ]
    for root in roots:
        meshes = [child for child in root.children_recursive if child.type == "MESH"]
        if not meshes:
            continue
        for mesh in meshes:
            bpy.context.view_layer.objects.active = mesh
            mesh.select_set(True)
            for modifier in list(mesh.modifiers):
                bpy.ops.object.modifier_apply(modifier=modifier.name)
            mesh.select_set(False)
        bpy.ops.object.select_all(action="DESELECT")
        for mesh in meshes:
            mesh.select_set(True)
        bpy.context.view_layer.objects.active = meshes[0]
        bpy.ops.object.join()
        combined = bpy.context.object
        combined.name = f"{root.name}_CombinedMesh"
        combined.parent = root
        combined["hm_visible_terrain"] = True
        combined["hm_collision_bearing"] = False
        combined.select_set(False)


def export_scene() -> None:
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    blend_path = SOURCE_DIR / f"{ASSET_NAME}.blend"
    glb_path = EXPORT_DIR / f"{ASSET_NAME}.glb"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=str(glb_path),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_materials="EXPORT",
    )
    print(f"HM_VERDANT_VALE_TERRAIN_KIT {glb_path}")


def main() -> None:
    reset_scene()
    materials = {
        "stone": make_material("VV_Fieldstone", (0.25, 0.27, 0.22, 1.0), 0.96),
        "stone_light": make_material("VV_FieldstoneLight", (0.39, 0.39, 0.30, 1.0), 0.94),
        "ruin": make_material("VV_RuinStone", (0.31, 0.32, 0.27, 1.0), 0.98),
        "ruin_light": make_material("VV_RuinStoneLight", (0.46, 0.45, 0.36, 1.0), 0.96),
        "root": make_material("VV_RootBark", (0.24, 0.105, 0.035, 1.0), 0.92),
        "root_light": make_material("VV_RootCut", (0.43, 0.21, 0.07, 1.0), 0.88),
        "wood": make_material("VV_CampTimber", (0.29, 0.13, 0.045, 1.0), 0.9),
        "wood_light": make_material("VV_CampTimberLight", (0.47, 0.24, 0.08, 1.0), 0.88),
        "grass": make_material("VV_LivingGrass", (0.16, 0.42, 0.08, 1.0), 0.94),
        "grass_dark": make_material("VV_Moss", (0.075, 0.27, 0.07, 1.0), 0.98),
        "iron": make_material("VV_DarkIron", (0.08, 0.075, 0.06, 1.0), 0.42, 0.48),
        "flower_gold": make_material("VV_WildflowerGold", (0.98, 0.55, 0.08, 1.0), 0.76),
        "flower_white": make_material("VV_WildflowerWhite", (0.96, 0.88, 0.72, 1.0), 0.8),
    }
    build_compacted_edge(materials)
    build_root_bank(materials)
    build_ruin_foundation(materials)
    build_camp_foundation(materials)
    build_bridge_abutment(materials)
    build_mill_race(materials)
    build_overlook_edge(materials)
    consolidate_components()
    export_scene()


if __name__ == "__main__":
    main()
