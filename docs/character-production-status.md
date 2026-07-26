# Character production status

Last verified: July 25, 2026

The locked PNG sheets are references, not pre-existing 3D assets. The licensed
base-model instruction was withdrawn as a clerical error. The approved
production direction is newly modeled, entirely original Hargold and Mebble
geometry created from empty Blender scenes against those locked sheets.

The existing Blender sources and GLB exports were generated procedurally from
factory-empty scenes, but their doll-like forms remain rejected. They are
runnable placeholders only and are not approved production replacements. They
will stay active until the new original models pass the required preview and
deformation gates.

## Approved visual target

`assets/references/Hargold and Mebble approved production target.png` was
approved on July 25, 2026. It locks the desired organic character appeal,
expressive action posing, layered clothing, soft anatomy, material finish, and
animated-platformer presentation. It is concept reference art, not an editable
mesh, rig, material set, or animation asset.

The individual locked Hargold and Mebble sheets remain authoritative for exact
costume pieces, proportions, facial identifiers, orthographic silhouettes, and
rear/side details not fully visible in the combined action preview.

## Provisional active assets

### Hargold

- Source: `assets/blender/hargold_character.blend`
- Runtime export: `assets/exports/hargold_character.glb`
- Technical result: 36 render meshes, 82 bones, 19 controls, 65 animations,
  one GLB skin, two facial morph targets, UV0 on every render mesh, and packed
  1K base-color, roughness, normal, and AO channels.
- Deformation result: one continuous skin-body surface, one continuous
  jacket-and-sleeves surface, one continuous trouser surface, and skinned
  organic boot surfaces. The structural validator rejects reintroduced rigid
  limb sections.
- Rig coverage: IK/FK arms and legs; fingers; eyes; lids; eyebrows; jaw; mouth
  corners; six facial properties; hat, feather, and scarf secondary controls;
  hand, head, hat, glasses, back, feet-VFX, and center-VFX sockets.
- Unique clips: double jump, Hargold-block break, heavy ground slam, and
  Stonefist strike.

### Mebble

- Source: `assets/blender/mebble_character.blend`
- Runtime export: `assets/exports/mebble_character.glb`
- Technical result: 41 render meshes, 83 bones, 22 controls, 66 animations,
  one GLB skin, two facial morph targets plus the cape morph target, UV0 on
  every render mesh, and packed 1K base-color, roughness, normal, and AO
  channels.
- Deformation result: one continuous skin-body surface preserving the long
  neck and Adam's apple, continuous shirt-and-sleeves, trousers, vest/hood
  layers, skinned organic boots, and the weighted morphing cape.
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

## Blocking production inputs and approvals

The existing procedural files pass their historical structural checks. That
does not authorize them for production. The required work is:

1. Create new original high-resolution sculpts from empty Blender scenes,
   matching the locked Hargold and Mebble sheets.
2. Retopologize for smooth deformation, clean facial edge flow, detailed hands
   and boots, layered clothing, and optimized gameplay LODs.
3. Build the production body, facial, finger, IK/FK, socket, and
   secondary-motion rigs.
4. Senior character-artist sculpt and retopology review against every locked
   orthographic view.
5. Senior skin-weight and corrective-shape polish at shoulders, hips, fingers,
   Hargold's round torso, and Mebble's long neck.
6. Hand-painted texture detail beyond the packed pipeline maps.
7. Mebble cape collision/dynamic-secondary-motion tuning and Hargold
   hat/feather/scarf dynamic tuning in the target engine.
8. Mobile LODs, draw-call/material consolidation, texture atlasing, and measured
   device budgets.
9. Author the complete original gameplay animation set.
10. Every-clip deformation, foot-contact, transition, and readability review in
   the live 2.75D camera.
11. Turnaround, action-pose, gameplay-camera, and final
   art-director approval before active-file replacement.

Until those inputs and reviews are complete, the active files are provisional
animated placeholders, not final shipped character art.
