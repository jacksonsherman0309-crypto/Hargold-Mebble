import bpy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
manifest = json.loads((ROOT / "character-production-manifest.json").read_text(encoding="utf-8"))
name = Path(bpy.data.filepath).name
hero = next((key for key, spec in manifest["characters"].items() if spec["blend"] == name), None)
if not hero:
    raise RuntimeError(f"{name or 'unsaved file'} is not a declared production character asset")

errors = []
required_collections = {"REF", "GEO", "RIG", "ATTACHMENTS", "COLLISION_PROXY", "EXPORT"}
errors += [f"missing collection {item}" for item in sorted(required_collections - set(bpy.data.collections.keys()))]
armature = bpy.data.objects.get(f"RIG_{hero.upper()}")
if not armature or armature.type != "ARMATURE":
    errors.append(f"missing armature RIG_{hero.upper()}")
meshes = [obj for obj in bpy.data.objects if obj.type == "MESH" and obj.visible_get()]
if not meshes:
    errors.append("no visible production mesh")
for socket in manifest["requiredSockets"]:
    if not armature or socket not in armature.data.bones:
        errors.append(f"missing socket bone {socket}")
actions = {action.name for action in bpy.data.actions}
required_actions = set(manifest["sharedAnimationClipsRequired"] + manifest["heroAnimationClipsRequired"][hero])
errors += [f"missing action {action}" for action in sorted(required_actions - actions)]
for field in manifest["requiredMetadata"]:
    if field not in bpy.context.scene:
        errors.append(f"missing scene metadata {field}")
if errors:
    raise RuntimeError("\n".join(errors))
print(f"PASS: {hero} asset contract ({len(meshes)} mesh objects, {len(required_actions)} required actions)")
