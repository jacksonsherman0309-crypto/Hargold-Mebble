# Character production status

Last verified: July 26, 2026

The locked PNG sheets are references, not pre-existing 3D assets. The licensed
base-model instruction was withdrawn as a clerical error. The approved
production direction is newly modeled, entirely original Hargold and Mebble
geometry created from empty Blender scenes against those locked sheets.

The rejected doll-like geometry has been replaced. The active Blender sources
and GLB exports now come from new factory-empty scenes built at canonical metre
scale. Each v5 hero has one connected organic skin surface, continuous wrapped
soft-garment surfaces, single-piece rounded boots, layered accessories,
production control rigs, and complete clean-room gameplay clip libraries. No
mesh from the rejected files was read or reused.

The active July 26 organic-silhouette v5 candidates pass the automated
featureless-frame, connected-surface, topology, binding, UV, PBR-node, action,
canonical-scale, gameplay-scale silhouette-dimension, motion-range,
joint-deformation-structure, and GLB gates. Animation-polish work is
intentionally frozen while the mesh-construction candidates await senior
art-direction review. They must not be called final shipped character art.

The current joint-deformation pass adds preserve-volume armature evaluation,
multi-segment B-Bone limb chains, localized corrective-smooth zones, and
bend-driven pose-space volume keys for the shoulders, elbows, hips, knees, and
ankles. Both sources and runtime exports pass the automated structural gate.
The largest corrective displacement from Basis is 0.030978 m for Hargold and
0.055465 m for Mebble; the validator rejects any joint key above 0.12 m.
The milestone remains **in progress** until its diagnostic stress boards pass
visual review:

- `assets/previews/joint-deformation/hargold-joint-deformation-stress.png`
- `assets/previews/joint-deformation/mebble-joint-deformation-stress.png`

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

The July 26 external platformer images are clean-room construction benchmarks
only and are not stored in the repository. Their permitted observable lessons
and the original project-only construction boards are recorded in
`docs/character-construction-benchmark.md` and
`assets/blender/character-construction-benchmark.json`.

## Organic-silhouette v5 candidates

### Hargold

- Source: `assets/blender/hargold_character.blend`
- Runtime export: `assets/exports/hargold_character.glb`
- Technical result: 58 visible mesh objects, 89,016 visible mesh vertices,
  88,971 polygons, 0.9922 quad ratio, 97 bones, 80 animations, one
  GLB skin, 26 morph targets, UVs on every render mesh, and packed 1K
  base-color, roughness, normal, and AO channels. The current source contains
  80 actions including the applicable locked review actions.
- Surface result: one connected watertight body integrating head, face, neck,
  torso, shoulders, arms, hands, all fingers, pelvis, thighs, knees and shins;
  continuous wrapped jacket/sleeves and trousers/legs; single-piece rounded
  boots; integrated cheek and nose volume; smooth eyes; tapered hair and beard
  locks; layered shirt, scarf/cape, belt pouches, floppy hat/feather, and a
  rounded camping backpack with pocket, straps, bedroll, rope and leaf badge.
- Rig coverage: IK/FK arms and legs; fingers; eyes; lids; eyebrows; jaw; mouth
  corners; six facial properties; hat, feather, and scarf secondary controls;
  hand, head, hat, glasses, back, feet-VFX, and center-VFX sockets.
- Unique clips: double jump, Hargold-block break, heavy ground slam, and
  Stonefist strike.

### Mebble

- Source: `assets/blender/mebble_character.blend`
- Runtime export: `assets/exports/mebble_character.glb`
- Technical result: 57 visible mesh objects, 87,984 visible mesh vertices,
  87,891 polygons, 0.9936 quad ratio, 95 bones, 81 animations, one
  GLB skin, 31 morph targets, UVs on every render mesh, and packed 1K
  base-color, roughness, normal, and AO channels. The current source contains
  81 actions including the applicable locked review actions.
- Surface result: one connected watertight body integrating head, face,
  forward-tapered long neck, Adam's apple, torso, shoulders, slim arms, hands,
  all fingers, pelvis, thighs, knees and shins; continuous wrapped shirt/sleeves
  and trousers/legs; close-wrapped vest; single-piece rounded tall boots;
  glasses offset from the face; smooth eyes, smile line, tapered hair locks and
  bushy brows; straps, double belts and pouches; small top hat; and a curved
  shoulder-yoke cape whose glide morph opens into a profile-readable rear sail.
- Rig coverage: IK/FK arms and legs; fingers; eyes; lids; eyebrows; jaw; mouth
  corners; six facial properties; Adam's-apple/neck bone; hat and three-bone
  cape controls; hand, head, hat, glasses, back, feet-VFX, and center-VFX
  sockets.
- Unique clips: glide open, sustain, steer left, steer right, and close.

### Shared animation library

The active exports retain the previously authored in-place clips for idle,
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
not substitute for final human art approval. Remaining work follows the binding
production checklist:

1. Visual approval of shoulder, elbow, hip, knee, and ankle deformation.
2. Dedicated facial loops for eyelids, eyebrows, cheeks, nostrils, lips, mouth
   corners, and jaw.
3. Production hand topology, followed by clothing integration and surface
   refinement.
4. Production UVs, hand-painted final textures, then final animation polish.
5. Live 2.75D gameplay validation, LOD generation, material consolidation, and
   export-ready approval.

Until those reviews are complete, the files are production-topology candidates,
not final shipped character art.
