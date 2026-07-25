# Character production status

Last verified: July 25, 2026

The locked PNG sheets are references, not pre-existing 3D assets. This
repository contains generated Blender sources and GLB exports created from a
factory-empty scene. The July 25 continuous-skin rebuild replaces the rejected
rounded-part construction: body, sleeve, torso, trouser, hand, and boot volumes
are now union-remeshed surfaces with normalized armature weights instead of
separate rigid limb pieces.

## Verified replacement assets

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

## What still requires production approval

The automated Blender and GLB gates pass, and action-pose renders now verify
that facial volume stays attached during locomotion. This is still not a claim
of final AAA-quality approval. The remaining work is:

1. Senior character-artist sculpt and retopology review against every locked
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
7. Final art-director approval that both characters match the locked sheets.

Until those reviews are signed off, these are animated, continuous-skin
production prototypes and playable runtime exports, not final shipped
character art.
