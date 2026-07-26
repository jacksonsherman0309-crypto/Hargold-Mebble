# Blender character asset pipeline

The active browser build still contains the July 25 procedural Hargold and
Mebble prototypes so the game remains runnable. They are not approved
production characters and must not be described or promoted as such.

The approved production route is newly modeled, entirely original character
geometry built in empty Blender scenes against the locked Hargold and Mebble
sheets. Do not reuse the rejected geometry or substitute generic humanoid base
models.

`docs/character-dimension-animation-spec.md` is the binding construction and
motion contract. Production characters are complete 3D skinned models presented
through the strict 2.75D camera at a controlled three-quarter side angle.
Negative-scale sprite-style mirroring is forbidden; direction changes require a
physical animated rotation.

Structural completeness is not final AAA art approval. A senior character
artist still needs to approve or refine the sculpt/retopology, skin weights,
correctives, hand-painted texture detail, LODs, and every-clip deformation on
target hardware.

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

The following legacy command is retained only for reproducing the current
provisional browser placeholders and now requires an explicit opt-in:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --factory-startup --python-exit-code 1 --python tools\blender\build_deformable_characters.py -- --allow-legacy-provisional-rebuild
```

It is not the production geometry entry point. It still produces the rejected
doll-like result. `build_locked_characters.py` likewise remains historical
rig/action-library code.

Run the implemented structural/runtime-export checks with:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background assets\blender\hargold_character.blend --python-exit-code 1 --python tools\blender\validate_locked_character.py
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background assets\blender\mebble_character.blend --python-exit-code 1 --python tools\blender\validate_locked_character.py
```

These validators report the structural state of the provisional generated
files only. Passing them is not production approval and does not satisfy the
modeling, deformation, action-pose, or gameplay-camera preview gates.

## Approval gates

1. Orthographic silhouette/model sheet match.
2. Topology and deformation review.
3. Rig controls, sockets, cape behavior, and facial range.
4. Material/texture/mobile-budget review.
5. Complete in-place animation set and foot-contact markers.
6. Proxy collider measurement fed back into runtime tuning.
7. GLB import, animation, scale, plane alignment, and target-device validation.

The strict validator also fails any character that brings back rigid
bone-parented upper-arm, forearm, elbow, hand, thigh, or shin pieces.
