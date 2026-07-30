# Character production status

Last verified: July 30, 2026

## Locked production path

The original user-supplied Meshy characters are the current approved animation
targets:

- Hargold:
  `assets/exports/meshy/hargold_canonical_gameplay_rig.glb`
- Mebble:
  `assets/exports/meshy/mebble_canonical_gameplay_rig.glb`

Do not replace either visible mesh, select a different base rig, restart
modeling, or load an earlier procedural character export. The locked character
sheets remain identity references; they are not editable meshes or evidence of
controls that are absent from the source GLBs.

Both live GLBs contain one visible skinned mesh, one 24-bone biped, one
material, one embedded 4096-pixel texture, no morph targets, and supplied walk
and run clips. Gameplay translation remains controlled by the deterministic
fixed-step controller; the character clips are in-place.

## Animation implementation

`src/animation/locked-meshy-animation-library.js` constructs additive
local-space body clips from each locked rig's own bind transforms. It does not
read, render, or retarget the rejected procedural characters. The supplied
Meshy walk and run remain available as debug references but are not selected
by live locomotion.

The runtime exposes 41 Hargold presentation clips and 43 Mebble presentation
clips. These include controller-driven idles, acceleration and deceleration,
turn and skid, crouch/crawl/slide, staged jumps and landings, twirl, stomp,
ground slam, damage and defeat, block and power reactions, victory, swapping,
Hargold's distinct double jump, and Mebble's glide body poses.

Animation selection uses the real movement state and measured velocity.
Separate project-authored walk, run, and full-speed sprint cycles follow ground
speed, loop phase is preserved across gait changes, gameplay state changes can
interrupt presentation one-shots, and grounded contact clips use bounded
foot-height and slope correction. Ground slam now has buffered intent, staged
startup/descent/impact/recovery presentation, terrain impact effects, camera
response, and current-world mob contact.

The dedicated live validation surface is:

`?animationValidation=1&debugAnimation=1`

It provides ten stations in the actual Meadow Wake course for acceleration,
skids, slopes, uneven ground, moving platforms, pits, landings, hero-specific
abilities, enemy contact, blocks, power reactions, swapping, and mobile-camera
review.

## Verified source limitations

The current Meshy skeleton does not contain:

- eye, eyelid, eyebrow, cheek, jaw, mouth, or expression controls;
- finger or thumb bones;
- independent cape, scarf, hat, feather, glasses, belt, or backpack controls;
- corrective bones or pose-space corrective morphs.

The present body clips can pose each hand as one rigid deform group and can
stabilize the head/neck/body during Mebble's glide. They cannot open Mebble's
cape, articulate fingers, animate a face, or simulate accessories
independently. Those features are not claimed complete. They require a
reviewed extension of the locked source rigs and weights without replacing the
approved visible meshes.

The current meshes are also high-density LOD0 assets: roughly 293k triangles
for Hargold and 290k for Mebble. Reviewed lower LODs and mobile texture variants
remain required.

## Quarantined files

The following remain in the repository for historical reproduction or
validation only and are not production runtime inputs:

- `assets/exports/hargold_character.glb`
- `assets/exports/mebble_character.glb`
- `assets/blender/hargold_character.blend`
- `assets/blender/mebble_character.blend`
- `assets/exports/mannequins/`
- mannequin, silhouette, construction, and prior joint-stress previews

The first four files describe rejected altered/procedural character work.
Mannequins and review images are validation references, never playable heroes.
The active selection and quarantine policies are machine-readable in
`data/character-rig-selection.json`,
`data/animation-retarget-map.json`, and
`data/locked-meshy-animation-capabilities.json`.

## Completion status

Implemented and live:

- locked original Meshy visible meshes and rigs;
- supplied walk/run retained as reference/debug clips;
- refined project-authored walk/run/sprint playback on the locked rigs;
- controller-linked body-animation state package;
- automatic directional acceleration with no manual run or sprint action;
- Hargold double-jump body animation;
- Mebble glide body animation;
- complete live ground-slam input, impact feedback, and current-world mob contact;
- velocity synchronization, responsive crossfades, foot-height correction,
  slope adaptation, debug playback, and validation stations.

Still incomplete:

- source-authored facial rig and animation;
- finger controls and distinct finger poses;
- independent cloth/accessory controls and collision-safe secondary simulation;
- pose-space joint correctives and full visual deformation approval;
- clip-by-clip mobile visual approval;
- LOD generation, compression tuning, and target-device profiling.

The animation body pass is active and testable, but the complete production
standard cannot be truthfully closed until those source-rig and device gates
are implemented and reviewed.
