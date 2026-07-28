# Character production status

Last verified: July 26, 2026

The locked PNG sheets are references, not pre-existing 3D assets. The licensed
base-model instruction was withdrawn as a clerical error. The approved
production direction is newly modeled, entirely original Hargold and Mebble
geometry created from empty Blender scenes against those locked sheets.

The rejected doll-like geometry has been replaced. The active
Blender sources and GLB exports now come from new factory-empty scenes built at canonical
metre scale with authored quad-loop surfaces, layered clothing and accessories,
production control rigs, and complete clean-room gameplay clip libraries. No
mesh from the rejected files was read or reused.

The active July 26 locked-frame mannequin-fitted v4 candidates pass the automated
featureless-frame, topology, binding, UV, PBR-node, action, canonical-scale,
100–150 pixel silhouette-dimension, motion-range, and GLB gates. They still
require senior art-direction approval and additional close-cinematic polish
before they may be called final shipped character art.

## Authoritative mannequin gate

- Compact frame: `assets/blender/mannequins/compact_animation_mannequin.blend`
  and `assets/exports/mannequins/compact_animation_mannequin.glb`.
- Tall frame: `assets/blender/mannequins/tall_animation_mannequin.blend` and
  `assets/exports/mannequins/tall_animation_mannequin.glb`.
- Both were generated from factory-empty scenes, contain no character identity
  surface detail, and structurally pass their clean-room validators.
- The standardized fixed-camera, four-column, twenty-row review is
  `assets/previews/character-mannequin-comparison-sheet.png`.
- Enlarged neutral/alignment, locomotion, and air/action sheets are written to
  `assets/previews/character-fit-neutral-alignment.png`,
  `assets/previews/character-fit-locomotion-frames.png`, and
  `assets/previews/character-fit-air-action-frames.png`. Fitted panels include
  the required 40% internal mannequin overlay.
- Hargold is fitted to the compact rig; Mebble is fitted to the tall rig. The
  locked sheets remain authoritative for identity, costume, colors, and
  accessories.

## Approved visual target

`assets/references/Hargold and Mebble approved production target.png` was
approved on July 25, 2026. It locks the desired organic character appeal,
expressive action posing, layered clothing, soft anatomy, material finish, and
animated-platformer presentation. It is concept reference art, not an editable
mesh, rig, material set, or animation asset.

The individual locked Hargold and Mebble sheets remain authoritative for exact
costume pieces, proportions, facial identifiers, orthographic silhouettes, and
rear/side details not fully visible in the combined action preview.

## Locked-frame mannequin-fitted v4 candidates

### Hargold

- Source: `assets/blender/hargold_character.blend`
- Runtime export: `assets/exports/hargold_character.glb`
- Technical result: 86 visible objects, 57 mesh objects, 8,411 visible mesh
  vertices, 9,378 polygons, 0.7646 quad ratio, 97 bones, 80 animations, one
  GLB skin, two morph targets, UVs on every render mesh, and packed 1K
  base-color, roughness, normal, and AO channels. The current source contains
  80 actions including the applicable locked review actions.
- Surface result: new ring-loop head, torso and limb surfaces; longer deformable
  sleeves with shoulder bulge loops; enlarged articulated palms and finger
  chains; broader, longer constructed boots; softened cheek transitions; smooth
  eyes; tapered hair and beard locks; layered
  jacket, shirt, trousers, scarf/cape, belt pouches, constructed boots, floppy
  hat/feather, and a camping backpack with pocket, straps, bedroll, rope and
  leaf badge.
- Rig coverage: IK/FK arms and legs; fingers; eyes; lids; eyebrows; jaw; mouth
  corners; six facial properties; hat, feather, and scarf secondary controls;
  hand, head, hat, glasses, back, feet-VFX, and center-VFX sockets.
- Unique clips: double jump, Hargold-block break, heavy ground slam, and
  Stonefist strike.

### Mebble

- Source: `assets/blender/mebble_character.blend`
- Runtime export: `assets/exports/mebble_character.glb`
- Technical result: 85 visible objects, 53 mesh objects, 7,401 visible mesh
  vertices, 8,272 polygons, 0.7582 quad ratio, 95 bones, 81 animations, one
  GLB skin, three morph targets, UVs on every render mesh, and packed 1K
  base-color, roughness, normal, and AO channels. The current source contains
  81 actions including the applicable locked review actions.
- Surface result: new ring-loop head, more strongly tapered long neck, wider
  torso, longer shoulder-loop sleeves and enlarged hands; stronger visible
  Adam's apple; larger constructed tall boots; glasses offset from the face;
  smooth eyes, smile line, tapered hair locks and bushy brows; separate shirt,
  vest, straps, double belts and pouches; small top hat; and a curved shoulder
  yoke cape whose glide morph opens into a profile-readable rear sail.
- Rig coverage: IK/FK arms and legs; fingers; eyes; lids; eyebrows; jaw; mouth
  corners; six facial properties; Adam's-apple/neck bone; hat and three-bone
  cape controls; hand, head, hat, glasses, back, feet-VFX, and center-VFX
  sockets.
- Unique clips: glide open, sustain, steer left, steer right, and close.

### Shared animation library

The replacement exports contain newly authored in-place clips for idle,
walk/run/sprint, starts/stops/turns/skids, the full jump and landing family,
wall states, crouch/crawl/duck/slides/roll, look-up and ledge stop, spins,
fast-fall/ground-slam/stomp bounce, water, climbing, ropes, carrying,
drop/throw, hurt/knockback/defeat, swapping, and victory. Actions contain
transition, looping, root-motion, and contact-marker metadata.

The pipeline now renders the standardized true-side mannequin-fit review plus
15 action silhouettes per hero at 150 pixels: idle,
walk, run, sprint, jump, ground slam, sprint slide, skid, crouch, wall push,
carry, hurt, victory, and two character-specific poses. These are validation
captures rather than claims of final animation approval.

The twenty locked review rows use one orthographic camera, one world scale, one
floor line, and the same generated action on the mannequin and fitted surface.
Hero-exclusive rows render the other hero as `N/A`; silhouette rows are solid
black; skeleton rows show connected bones and joint markers.

## Remaining approval and finish work

The new sources pass their automated structural and runtime gates. That does
not substitute for final human art approval. Remaining work is:

1. Senior character-artist silhouette and surface review against every locked
   orthographic view.
2. Senior skin-weight and corrective-shape polish at shoulders, hips, fingers,
   Hargold's round torso, and Mebble's long neck.
3. Hand-painted texture detail beyond the packed pipeline maps.
4. Mebble cape collision/dynamic-secondary-motion tuning and Hargold
   hat/feather/scarf dynamic tuning in the target engine.
5. Mobile LODs, draw-call/material consolidation, texture atlasing, and measured
   device budgets.
6. Every-clip deformation, foot-contact, transition, and readability review in
   the live 2.75D camera.
7. Rear-view, close-cinematic, action-pose, gameplay-camera, and final
   art-director approval before final-shipping classification.

Until those reviews are complete, the files are production-topology candidates,
not final shipped character art.
