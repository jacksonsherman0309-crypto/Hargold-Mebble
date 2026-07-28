# Blender character asset pipeline

The active July 26 locked-frame mannequin-fitted v4 candidates were rebuilt from
factory-empty scenes without reading or reusing the rejected July 25 geometry.
Both candidates pass the automated mannequin-frame, topology, UV, binding,
material, scale, action-library, motion-range, and GLB gates. Final shipped-art
classification still requires the human approval gates below.

The approved production route is newly modeled, entirely original character
geometry built in empty Blender scenes against the locked Hargold and Mebble
sheets. Do not reuse the rejected geometry or substitute generic humanoid base
models.

`docs/character-dimension-animation-spec.md` is the binding construction and
motion contract. Production characters are complete 3D skinned models presented
through the strict 2.75D camera with true side as the primary approval view and
only a small action-dependent secondary reveal.
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
4. `character-scale-orientation-profile.json` for canonical metre scale,
   true-side-first presentation, small action-dependent reveal, and
   articulation gates.

The authoritative construction frames are:

- `mannequins/compact_animation_mannequin.blend`
- `mannequins/tall_animation_mannequin.blend`
- `../exports/mannequins/compact_animation_mannequin.glb`
- `../exports/mannequins/tall_animation_mannequin.glb`

Build and validate these featureless frames before fitting character surfaces.
The twenty-row comparison sheet is generated at
`../previews/character-mannequin-comparison-sheet.png`.
The same build also generates three enlarged review sheets for
neutral/alignment, locomotion, and air/actions. Every fitted panel in those
sheets contains a 40% mannequin overlay; both renders use the same duplicated
skeleton action, fixed orthographic camera, floor line, root convention, scale,
and crop. Maximum permitted joint displacement is 3% of total hero height.

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

Build the new production-topology candidates into the isolated staging paths:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --factory-startup --python-exit-code 1 --python tools\blender\build_production_character_staging.py -- --hero=Hargold --hero=Mebble
```

Build the authoritative featureless frames first:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --factory-startup --python-exit-code 1 --python tools\blender\build_animation_mannequins.py -- --hero=Hargold --hero=Mebble
```

Validate them with `validate_animation_mannequin.py`, then compose the
standardized review with `compose_mannequin_fit_sheet.py`.

The builder produces sources, GLBs, identity turnarounds, left/right
gameplay-profile views, run, ground-slam, and hero-action renders under each
`production-staging` directory. It also renders idle, walk, run, sprint, jump,
slam, slide, skid, crouch, wall push, carry, hurt, victory, and hero-specific
silhouettes at 150 pixels. Promotion to the active paths happens only after
structural validation and the 100–150 pixel silhouette comparison. After
copying a validated candidate to an active `.blend` path, record the active
review state with:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background assets\blender\hargold_character.blend --python-exit-code 1 --python tools\blender\mark_production_character_active.py
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background assets\blender\mebble_character.blend --python-exit-code 1 --python tools\blender\mark_production_character_active.py
```

The following legacy command is retained only for reproducing the rejected
browser placeholders and requires an explicit opt-in:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --factory-startup --python-exit-code 1 --python tools\blender\build_deformable_characters.py -- --allow-legacy-provisional-rebuild
```

It is not the production geometry entry point. It still produces the rejected
doll-like result. `build_locked_characters.py` remains the reusable historical
rig/action contract; the production builder creates all visible geometry anew.

Run the production structural/runtime-export checks with:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background assets\blender\hargold_character.blend --python-exit-code 1 --python tools\blender\validate_production_character.py
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background assets\blender\mebble_character.blend --python-exit-code 1 --python tools\blender\validate_production_character.py
```

These validators enforce factory-empty provenance, no rejected-geometry reuse,
canonical metre scale, mesh density and quad ratio, smooth UV-mapped surfaces,
rig binding, locked silhouette parts, minimum action-readable hand, sleeve and
boot dimensions, Mebble's wrapped cape yoke, material classes, action coverage,
and runtime GLB structure. Run the functional motion checks separately:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background assets\blender\hargold_character.blend --python-exit-code 1 --python tools\blender\validate_character_motion.py
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background assets\blender\mebble_character.blend --python-exit-code 1 --python tools\blender\validate_character_motion.py
```

`refine_character_animation.py -- --write-active` is retained for historical
reproducibility. It must not be run against the active production-topology
sources because it targets the rejected geometry generation.

Gameplay-profile review frames are generated with:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background assets\blender\hargold_character.blend --python-exit-code 1 --python tools\blender\render_character_gameplay_validation.py
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background assets\blender\mebble_character.blend --python-exit-code 1 --python tools\blender\render_character_gameplay_validation.py
```

The frames include a canonical common-mob witness and standard-block witness.
Passing structural and functional checks is still not production approval.
Locked-sheet sculpt, deformation, action-pose, and gameplay-camera visual
review remain required.

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
