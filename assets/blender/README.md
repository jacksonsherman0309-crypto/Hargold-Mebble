# Blender character asset pipeline

This directory now contains generated, editable work-in-progress Hargold and
Mebble Blender sources in addition to the production contracts and generic
template. The character files are real modeled and rigged assets, but they are
not production-approved: their final sculpt/retopology, UV/textures, complete
deformation pass, full animation library, LODs, engine import test, and art
approval remain open.

`gameplay_asset_template.blend` and its matching GLB remain generic templates.
They are not Hargold or Mebble models.

## Source authority

1. `docs/canonical-design-bible.md` and `src/canonical-data.js`.
2. Locked reference sheets in `assets/references/`.
3. `character-production-manifest.json`.

Both newest locked production sheets are present:

- `assets/references/Hargold locked production character sheet.png`
- `assets/references/Mebble locked production character sheet.png`

They are authoritative modeling references. They are PNGs rather than editable
3D assets; rig diagrams and technical labels in the artwork are requirements,
not evidence that the depicted production files already exist.

## Scene and export contract

- Blender LTS production version, recorded in each asset's metadata.
- Units: metric, 1 Blender unit = 1 metre; Z up, character faces -Y.
- Origin: ground contact between the feet. Apply mesh transforms before rigging.
- Separate source files: `hargold_character.blend`, `mebble_character.blend`.
- Collections: `REF`, `GEO`, `RIG`, `ATTACHMENTS`, `COLLISION_PROXY`, `EXPORT`.
- Armature object: `RIG_<HERO>`; deform bones use `DEF_`, controls `CTRL_`,
  mechanisms `MCH_`, and sockets `SOCKET_`.
- Gameplay simulation drives translation. Export clips in-place with root motion
  removed unless a clip is explicitly tagged for reconciliation.
- Export glTF 2.0/GLB, +Y forward conversion enabled, animations sampled, no
  cameras/lights/reference planes/collision proxies.
- Reference images are packed or linked in `REF`, disabled in renders and exports.
- All materials use a mobile-compatible Principled BSDF path.

Rebuild the current generated sources with:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --factory-startup --python-exit-code 1 --python tools\blender\build_locked_characters.py
```

Run the implemented structural/runtime-export checks with:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background assets\blender\hargold_character.blend --python-exit-code 1 --python tools\blender\validate_locked_character.py
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background assets\blender\mebble_character.blend --python-exit-code 1 --python tools\blender\validate_locked_character.py
```

`validate_character_asset.py` remains the final animation-completeness gate and
will continue to fail until every required gameplay clip in the manifest is
authored.

## Approval gates

1. Orthographic silhouette/model sheet match.
2. Topology and deformation review.
3. Rig controls, sockets, cape behavior, and facial range.
4. Material/texture/mobile-budget review.
5. Complete in-place animation set and foot-contact markers.
6. Proxy collider measurement fed back into runtime tuning.
7. GLB import, animation, scale, plane alignment, and target-device validation.
