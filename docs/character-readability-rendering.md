# Character Readability Rendering

## Scope

This pass improves live gameplay readability without changing the locked
Hargold or Mebble models. It does not modify geometry, proportions, costume
design, colors, facial features, animation timing, controller physics, or
collision.

The implementation is character-only:

1. A shared-skeleton inverted hull draws a soft external contour behind each
   visible hero mesh.
2. A local standard-material extension adds broad camera-aware rim, upper key,
   front fill, shadow-floor preservation, and distance-aware midtone clarity.
3. Authored broad background profiles select restrained targets. A
   0.32-second exponential response prevents rapid background flicker.

The rim contribution progressively reduces when a hero exceeds normal gameplay
size, while keeping a clamped minimum for difficult close-up backgrounds.
Existing authored ambient-occlusion maps are preserved within a restrained
0.9–1.08 intensity range; the pass does not add a screen-space AO stage.

There is no full-scene edge-detection pass, screen readback, per-frame texture
allocation, added shadow-casting light, or extra character geometry asset.

## Quality presets

| Preset | Contour | Lighting scale | Normal detail | Pixel-ratio cap |
| --- | ---: | ---: | ---: | ---: |
| Low | 1 CSS px | 0.68 | 0.48 | 1.5 |
| Balanced | 1.35 CSS px | 1.00 | 0.62 | 2 |
| High | 1.65 CSS px | 1.08 | 0.72 | 2 |

Balanced is the runtime default. The contour color is a character-aware dark
green-black or plum-black, never pure black. Hargold and Mebble use separate
strength profiles because Mebble's thinner silhouette requires slightly more
support.

The contour adds one draw for each visible source mesh. Lighting changes are
compiled into the existing standard-material draw. When the contour is off,
the extra contour draw is hidden.

## Broad background profiles

The diagnostic profile set is:

- bright grassland
- dense forest
- dark cave or ruin
- bright stone structure
- sunset backlight
- snow or ice
- toxic green
- busy gameplay foreground

Meadow Wake maps course-wide X ranges to broad profiles. Future authored
levels should supply equivalent room or lighting-zone metadata. The response
must not inspect every background pixel.

## Runtime and diagnostic controls

- `readability=off|contour|lighting|combined`
- `readabilityQuality=low|balanced|high`
- `readabilityBackdrop=<profile>` replaces the background with a deterministic
  diagnostic fixture only.
- `readabilityPair=overlap` displays both heroes with a small overlap for
  occlusion and draw-cost review only.

Example:

`?debugAnimation=1&readability=combined&readabilityQuality=balanced`

## Validation

The checked-in captures live in
`assets/previews/character-readability/`. They include the original view,
contour-only, lighting-only, combined, phone-size, pair-overlap, and diagnostic
background cases.

The diagnostic backgrounds are stress fixtures. They do not claim that cave,
snow, toxic, sunset, or other future production worlds are built. Meadow Wake
is the only current authored production environment used by these captures.

Architecture and browser validation demonstrate that the pass is bounded and
runs in the live renderer. Physical phone GPU profiling and final acceptance
on authored art from every world remain production QA tasks.

## Repository change inventory

- `src/rendering/character-readability.js` — character-only contour, material
  lighting extension, response smoothing, and diagnostic backdrop.
- `src/rendering/character-readability-config.js` — hero profiles, background
  profiles, quality presets, and Meadow Wake broad-zone mapping.
- `src/character-renderer.js` — live pass integration, responsive CSS-pixel
  sizing, quality cap, profile selection, and diagnostic switches.
- `src/game.js` and `index.html` — runtime cache revision.
- `src/canonical-data.js`, `docs/canonical-design-bible.md`, and
  `docs/character-dimension-animation-spec.md` — canonical readability
  contract.
- `tests/character-readability.test.mjs`, `package.json`, and
  `tests/meadow-wake-art-pipeline.test.mjs` — regression and pipeline checks.
- `data/character-readability-validation.json` — ready-gated validation
  inventory and limitations.
- `assets/previews/character-readability/` — A/B, phone, motion, overlap, and
  16-case background stress captures.
