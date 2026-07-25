# Character production status

Last verified: July 25, 2026

The locked PNG sheets were references, not pre-existing 3D assets. This
repository now contains newly generated replacement Blender sources and GLB
exports created after the overhaul request. The generator starts from a
factory-empty scene and does not open, link, append, or reuse geometry from the
rejected blockouts.

## Verified replacement assets

### Hargold

- Source: `assets/blender/hargold_character.blend`
- Runtime export: `assets/exports/hargold_character.glb`
- Technical result: 112 render meshes, 82 bones, 19 controls, 65 animations,
  one GLB skin, UV0 on every render mesh, and packed 1K base-color, roughness,
  normal, and AO channels.
- Rig coverage: IK/FK arms and legs; fingers; eyes; lids; eyebrows; jaw; mouth
  corners; six facial properties; hat, feather, and scarf secondary controls;
  hand, head, hat, glasses, back, feet-VFX, and center-VFX sockets.
- Unique clips: double jump, Hargold-block break, heavy ground slam, and
  Stonefist strike.

### Mebble

- Source: `assets/blender/mebble_character.blend`
- Runtime export: `assets/exports/mebble_character.glb`
- Technical result: 120 render meshes, 83 bones, 22 controls, 66 animations,
  one GLB skin, one cape morph target, UV0 on every render mesh, and packed 1K
  base-color, roughness, normal, and AO channels.
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

## What still requires production approval

The automated Blender and GLB gates pass, but that is not a claim of final
AAA-quality approval. The remaining work is:

1. Senior character-artist sculpt and retopology review against every locked
   orthographic view.
2. Full skin-weight and corrective-shape review at shoulders, hips, fingers,
   Hargold's round torso, and Mebble's long neck.
3. Hand-painted texture detail beyond the packed pipeline maps.
4. Mebble cape collision/dynamic-secondary-motion tuning and Hargold
   hat/feather/scarf dynamic tuning in the target engine.
5. Mobile LODs, draw-call/material consolidation, texture atlasing, and measured
   device budgets.
6. Every-clip deformation, foot-contact, transition, and readability review in
   the live 2.75D camera.
7. Final art-director approval that both characters match the locked sheets.

Until those reviews are signed off, the assets are technically complete
replacement sources and playable runtime exports, not final shipped character
art.
