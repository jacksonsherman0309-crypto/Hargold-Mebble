"""Build production-intent World 1-1 vertical-slice assets.

These assets are original Hargold & Mebble models. They preserve Meadow Wake's
authored camp-meadow identity without copying Nintendo geometry or art.
"""

from __future__ import annotations

import math
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SOURCE_DIR = ROOT / "assets" / "blender" / "world-1"
EXPORT_DIR = ROOT / "assets" / "exports" / "world-1"


def reset_scene(name: str) -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.name = name
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    scene["hm_asset_status"] = "production-intent-vertical-slice-wip"
    scene["hm_course"] = "1-1 Meadow Wake"
    scene["hm_gameplay_plane"] = "X/Z"
    scene["hm_depth_axis"] = "Y"


def material(name: str, color: tuple[float, float, float, float], roughness: float = 0.72,
             metallic: float = 0.0) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = color
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    return mat


def finish(obj: bpy.types.Object, name: str, mat: bpy.types.Material,
           bevel: float = 0.03, smooth: bool = True) -> bpy.types.Object:
    obj.name = name
    obj.data.materials.append(mat)
    if bevel > 0:
        modifier = obj.modifiers.new("ProductionBevel", "BEVEL")
        modifier.width = bevel
        modifier.segments = 2
    if smooth and obj.type == "MESH":
        for polygon in obj.data.polygons:
            polygon.use_smooth = True
    obj["export_enabled"] = True
    return obj


def cube(name: str, location: tuple[float, float, float], scale: tuple[float, float, float],
         mat: bpy.types.Material, bevel: float = 0.04) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = finish(bpy.context.object, name, mat, bevel, False)
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return obj


def sphere(name: str, location: tuple[float, float, float], scale: tuple[float, float, float],
           mat: bpy.types.Material, segments: int = 24, rings: int = 16) -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=location)
    obj = finish(bpy.context.object, name, mat, 0.015, True)
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return obj


def cylinder_between(name: str, start: tuple[float, float, float], end: tuple[float, float, float],
                     radius: float, mat: bpy.types.Material, vertices: int = 14) -> bpy.types.Object:
    start_v = Vector(start)
    end_v = Vector(end)
    direction = end_v - start_v
    midpoint = (start_v + end_v) * 0.5
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=direction.length,
        location=midpoint,
    )
    obj = finish(bpy.context.object, name, mat, 0.015, True)
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(direction.normalized())
    return obj


def cone(name: str, location: tuple[float, float, float], radius1: float, radius2: float,
         depth: float, mat: bpy.types.Material, rotation=(0.0, 0.0, 0.0)) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cone_add(
        vertices=16,
        radius1=radius1,
        radius2=radius2,
        depth=depth,
        location=location,
        rotation=rotation,
    )
    return finish(bpy.context.object, name, mat, 0.01, True)


def leaf(name: str, location: tuple[float, float, float], scale: float,
         mat: bpy.types.Material, rotation=(0.0, 0.0, 0.0)) -> bpy.types.Object:
    verts = [(0, 0, 0.55), (-0.28, 0, 0), (0, 0, -0.55), (0.28, 0, 0)]
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(verts, [], [(0, 1, 2, 3)])
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = location
    obj.scale = (scale, scale, scale)
    obj.rotation_euler = rotation
    return finish(obj, name, mat, 0.012, False)


def export_current(name: str) -> None:
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    blend_path = SOURCE_DIR / f"{name}.blend"
    glb_path = EXPORT_DIR / f"{name}.glb"
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
    print(f"HM_MEADOW_WAKE_ASSET {glb_path}")


def build_environment() -> None:
    reset_scene("MeadowWakeOpeningEnvironment")
    wood = material("MW_Wood", (0.28, 0.105, 0.035, 1))
    wood_light = material("MW_WoodCut", (0.58, 0.29, 0.09, 1))
    cloth = material("MW_CampCloth", (0.12, 0.31, 0.12, 1), 0.88)
    cloth_light = material("MW_ClothTrim", (0.32, 0.52, 0.20, 1), 0.86)
    brass = material("MW_Brass", (0.54, 0.28, 0.06, 1), 0.34, 0.42)
    lantern_glow = material("MW_LanternGlow", (1.0, 0.48, 0.08, 1), 0.24)
    leaf_dark = material("MW_LeafDark", (0.035, 0.18, 0.055, 1), 0.9)
    leaf_mid = material("MW_LeafMid", (0.08, 0.34, 0.10, 1), 0.9)
    leaf_light = material("MW_LeafLight", (0.22, 0.51, 0.15, 1), 0.9)
    stone = material("MW_Stone", (0.27, 0.31, 0.23, 1), 0.96)
    flower = material("MW_Flower", (0.95, 0.65, 0.12, 1), 0.7)

    # Timber-framed camp pavilion at the opening runway.
    for x in (0.25, 2.55):
        cylinder_between(f"CampPost_{x}", (x, 0.28, 0), (x, 0.28, 2.65), 0.12, wood)
    cylinder_between("CampRidge", (0.0, 0.28, 2.55), (2.8, 0.28, 2.55), 0.13, wood)
    cylinder_between("RoofBraceLeft", (0.0, 0.28, 2.35), (1.4, 0.28, 3.2), 0.10, wood)
    cylinder_between("RoofBraceRight", (2.8, 0.28, 2.35), (1.4, 0.28, 3.2), 0.10, wood)
    roof_verts = [
        (-0.15, -0.66, 2.35), (1.4, -0.66, 3.14), (2.95, -0.66, 2.35),
        (-0.15, 0.75, 2.35), (1.4, 0.75, 3.14), (2.95, 0.75, 2.35),
    ]
    roof_faces = [(0, 1, 4, 3), (1, 2, 5, 4)]
    roof_mesh = bpy.data.meshes.new("CampCanopy_Mesh")
    roof_mesh.from_pydata(roof_verts, [], roof_faces)
    roof = bpy.data.objects.new("CampCanopy", roof_mesh)
    bpy.context.scene.collection.objects.link(roof)
    finish(roof, "CampCanopy", cloth, 0.035, False)
    for x in (0.25, 2.55):
        cube(f"CampFooting_{x}", (x, 0.28, 0.16), (0.24, 0.24, 0.16), stone, 0.05)
    cube("SupplyCrate", (2.14, 0.1, 0.38), (0.38, 0.37, 0.38), wood_light, 0.055)
    cube("CampTable", (1.2, 0.2, 0.72), (0.75, 0.35, 0.08), wood_light, 0.035)
    for x in (0.6, 1.8):
        cylinder_between(f"TableLeg_{x}", (x, 0.2, 0.08), (x, 0.2, 0.68), 0.055, wood)

    # Original leaf-emblem banner and readable camp sign.
    cube("CampBanner", (1.4, -0.7, 1.76), (0.52, 0.035, 0.72), cloth, 0.06)
    leaf("CampBannerLeaf", (1.4, -0.742, 1.78), 0.42, cloth_light, (math.pi / 2, 0, 0))
    cylinder_between("SignPost", (-0.3, -0.3, 0), (-0.3, -0.3, 1.1), 0.075, wood)
    cube("CampSignBoard", (0.15, -0.33, 0.86), (0.54, 0.07, 0.22), wood_light, 0.055)
    leaf("CampSignLeaf", (0.15, -0.405, 0.86), 0.18, cloth, (math.pi / 2, 0, 0))

    # Two modeled lanterns with cages and warm emissive-looking cores.
    for index, x in enumerate((0.45, 2.35)):
        cylinder_between(f"LanternHook_{index}", (x, -0.12, 2.42), (x, -0.12, 1.82), 0.025, brass)
        sphere(f"LanternGlow_{index}", (x, -0.12, 1.67), (0.14, 0.12, 0.20), lantern_glow)
        for dx in (-0.16, 0.16):
            cylinder_between(
                f"LanternCage_{index}_{dx}",
                (x + dx, -0.12, 1.43),
                (x + dx, -0.12, 1.91),
                0.018,
                brass,
                8,
            )
        cylinder_between(
            f"LanternTop_{index}", (x - 0.2, -0.12, 1.93), (x + 0.2, -0.12, 1.93), 0.026, brass, 8
        )
        cylinder_between(
            f"LanternBottom_{index}", (x - 0.2, -0.12, 1.41), (x + 0.2, -0.12, 1.41), 0.026, brass, 8
        )

    # Layered tree clusters and meadow dressing provide real parallax silhouettes.
    for index, (x, y, size) in enumerate(((-0.9, 0.9, 1.1), (3.15, 1.1, 1.0), (4.35, 1.8, 0.8))):
        cylinder_between(f"TreeTrunk_{index}", (x, y, 0), (x, y, 2.25 * size), 0.20 * size, wood)
        for crown_index, (dx, dz, s) in enumerate(((-0.35, 0.12, 0.72), (0.32, 0.2, 0.76), (0, 0.65, 0.9))):
            sphere(
                f"TreeCrown_{index}_{crown_index}",
                (x + dx * size, y, (2.15 + dz) * size),
                (s * size, 0.62 * size, s * size),
                (leaf_dark, leaf_mid, leaf_light)[crown_index],
                20,
                14,
            )
    for index, (x, y, size) in enumerate(((3.1, -0.3, 0.34), (3.7, -0.4, 0.25), (4.6, -0.2, 0.31))):
        sphere(f"MeadowBush_{index}", (x, y, size * 0.6), (size, size * 0.72, size * 0.62), leaf_mid)
    for index, x in enumerate((2.85, 3.35, 3.9, 4.35, 4.8)):
        cylinder_between(f"FlowerStem_{index}", (x, -0.44, 0), (x, -0.44, 0.22), 0.012, leaf_dark, 8)
        sphere(f"FlowerHead_{index}", (x, -0.44, 0.25), (0.065, 0.035, 0.065), flower, 12, 8)

    export_current("meadow_wake_opening_environment")


def build_camp_critter() -> None:
    reset_scene("CampCritter")
    fur = material("Critter_Fur", (0.62, 0.18, 0.035, 1), 0.9)
    fur_light = material("Critter_Face", (0.93, 0.48, 0.12, 1), 0.86)
    fur_dark = material("Critter_Spines", (0.20, 0.055, 0.02, 1), 0.95)
    eye = material("Critter_Eyes", (0.018, 0.012, 0.006, 1), 0.28)
    nose = material("Critter_Nose", (0.07, 0.025, 0.012, 1), 0.4)
    sphere("CritterBody", (0, 0, 0.42), (0.56, 0.38, 0.38), fur)
    sphere("CritterFace", (0.42, -0.02, 0.42), (0.34, 0.31, 0.30), fur_light)
    sphere("CritterMuzzle", (0.67, -0.02, 0.35), (0.16, 0.23, 0.14), fur_light)
    sphere("CritterNose", (0.82, -0.02, 0.38), (0.07, 0.07, 0.07), nose, 16, 10)
    for side in (-1, 1):
        sphere(f"CritterEye_{side}", (0.56, side * 0.23, 0.53), (0.052, 0.035, 0.064), eye, 16, 10)
        cone(
            f"CritterEar_{side}",
            (0.34, side * 0.28, 0.68),
            0.13,
            0.025,
            0.28,
            fur,
            (side * 0.18, 0.05, 0),
        )
        sphere(f"CritterFootFront_{side}", (0.38, side * 0.26, 0.12), (0.18, 0.11, 0.09), fur_dark)
        sphere(f"CritterFootBack_{side}", (-0.38, side * 0.26, 0.12), (0.18, 0.11, 0.09), fur_dark)
    for index, angle in enumerate((-1.05, -0.65, -0.25, 0.2, 0.6, 1.0)):
        cone(
            f"CritterSpine_{index}",
            (-0.26 + index * 0.08, 0.04, 0.70),
            0.15,
            0.025,
            0.43,
            fur_dark,
            (0, angle, 0),
        )
    export_current("camp_critter")


def build_shellback() -> None:
    reset_scene("Shellback")
    shell = material("Shellback_Shell", (0.12, 0.31, 0.075, 1), 0.82)
    shell_ridge = material("Shellback_Ridges", (0.39, 0.49, 0.16, 1), 0.9)
    skin = material("Shellback_Skin", (0.78, 0.45, 0.11, 1), 0.86)
    belly = material("Shellback_Belly", (0.91, 0.68, 0.26, 1), 0.82)
    eye = material("Shellback_Eyes", (0.014, 0.01, 0.005, 1), 0.24)
    sphere("ShellbackShell", (-0.12, 0, 0.47), (0.58, 0.43, 0.48), shell)
    for index, z in enumerate((0.30, 0.50, 0.69)):
        bpy.ops.mesh.primitive_torus_add(
            major_radius=0.34 - abs(0.5 - z) * 0.35,
            minor_radius=0.025,
            major_segments=20,
            minor_segments=8,
            location=(-0.12, -0.42, z),
            rotation=(math.pi / 2, 0, 0),
        )
        finish(bpy.context.object, f"ShellRidge_{index}", shell_ridge, 0.006, True)
    sphere("ShellbackHead", (0.51, -0.01, 0.43), (0.31, 0.29, 0.30), skin)
    sphere("ShellbackMuzzle", (0.70, -0.01, 0.37), (0.16, 0.23, 0.13), belly)
    for side in (-1, 1):
        sphere(f"ShellbackEye_{side}", (0.62, side * 0.22, 0.53), (0.050, 0.035, 0.061), eye, 16, 10)
        sphere(f"ShellbackFootFront_{side}", (0.34, side * 0.33, 0.10), (0.24, 0.14, 0.10), skin)
        sphere(f"ShellbackFootBack_{side}", (-0.43, side * 0.33, 0.10), (0.24, 0.14, 0.10), skin)
    export_current("shellback")


def build_breakable_block() -> None:
    reset_scene("MeadowWakeBreakableBlock")
    stone = material("Block_Fieldstone", (0.30, 0.23, 0.15, 1), 0.96)
    mortar = material("Block_Mortar", (0.12, 0.13, 0.10, 1), 1.0)
    cube("BreakableBlockCore", (0, 0, 0.5), (0.5, 0.42, 0.5), mortar, 0.08)
    layout = [
        (-0.28, 0.51, 0.72, 0.19, 0.24),
        (0.24, 0.51, 0.73, 0.28, 0.23),
        (-0.31, 0.51, 0.25, 0.18, 0.21),
        (0.20, 0.51, 0.25, 0.29, 0.21),
    ]
    for index, (x, y, z, sx, sz) in enumerate(layout):
        slab = cube(f"BreakableStone_{index}", (x, y, z), (sx, 0.08, sz), stone, 0.075)
        slab.rotation_euler.y = (-0.04, 0.025, 0.035, -0.025)[index]
    export_current("breakable_block")


def build_hargold_block() -> None:
    reset_scene("MeadowWakeHargoldBlock")
    timber = material("HeavyBlock_Timber", (0.34, 0.16, 0.055, 1), 0.9)
    iron = material("HeavyBlock_Brass", (0.50, 0.27, 0.055, 1), 0.42, 0.35)
    emblem = material("HeavyBlock_Leaf", (0.15, 0.36, 0.10, 1), 0.82)
    cube("HargoldBlockCore", (0, 0, 0.5), (0.52, 0.44, 0.52), timber, 0.09)
    for x in (-0.43, 0.43):
        cube(f"HeavyCorner_{x}", (x, 0.49, 0.5), (0.06, 0.04, 0.47), iron, 0.025)
    for z in (0.08, 0.92):
        cube(f"HeavyBand_{z}", (0, 0.49, z), (0.47, 0.04, 0.055), iron, 0.025)
    leaf("HargoldLeafEmblem", (0, -0.495, 0.5), 0.55, emblem, (math.pi / 2, 0, 0))
    export_current("hargold_block")


def build_meadow_ledge() -> None:
    reset_scene("MeadowWakeLedge")
    stone = material("Ledge_Stone", (0.24, 0.27, 0.19, 1), 0.97)
    stone_light = material("Ledge_StoneLight", (0.38, 0.36, 0.24, 1), 0.95)
    soil = material("Ledge_Soil", (0.25, 0.12, 0.045, 1), 0.98)
    grass = material("Ledge_Grass", (0.14, 0.46, 0.09, 1), 0.91)
    cube("LedgeCore", (0, 0, 0.18), (1.0, 0.46, 0.18), soil, 0.07)
    for index, (x, z, size) in enumerate(((-0.72, 0.18, 0.26), (-0.22, 0.16, 0.25), (0.28, 0.19, 0.28), (0.76, 0.17, 0.23))):
        rock = sphere(f"LedgeRock_{index}", (x, -0.47, z), (size, 0.08, size * 0.68),
                      stone if index % 2 else stone_light, 16, 10)
        rock.rotation_euler.y = index * 0.24
    cube("LedgeGrassMat", (0, 0, 0.40), (1.03, 0.49, 0.06), grass, 0.06)
    for index, x in enumerate((-0.88, -0.52, -0.15, 0.18, 0.54, 0.87)):
        cone(
            f"LedgeGrassBlade_{index}",
            (x, -0.42, 0.52 + (index % 2) * 0.03),
            0.055,
            0.0,
            0.22,
            grass,
            (0, (index - 2.5) * 0.035, 0),
        )
    export_current("meadow_ledge")


if __name__ == "__main__":
    build_environment()
    build_camp_critter()
    build_shellback()
    build_breakable_block()
    build_hargold_block()
    build_meadow_ledge()
