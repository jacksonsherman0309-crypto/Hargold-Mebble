# Character animation and modeling analysis

Last verified: July 25, 2026

## Scope and originality boundary

Mario and Luigi are useful only as broad production-quality benchmarks. Their
meshes, topology, proportions, clothing, textures, poses, animation data,
names, and protected visual identifiers are not source material for Hargold or
Mebble. The locked Hargold and Mebble sheets remain the sole visual authority.

Official Nintendo material describes the target games as lively and responsive
and distinguishes playable characters through silhouette and movement
behavior. The transferable craft principles are:

- Read the full-body silhouette before reading surface detail.
- Keep body volumes continuous through shoulders, elbows, wrists, hips, knees,
  neck, and face.
- Deform soft tissue and cloth around joints instead of rotating disconnected
  pieces.
- Push each locomotion pose through the hips, spine, head, hands, and feet,
  with counter-rotation and overlap.
- Preserve a character-specific physical identity in motion: compact and
  weighty for Hargold; tall, elastic, and cape-led for Mebble.
- Use facial motion, eye focus, brows, fingers, clothing, and accessories as
  part of the action rather than as static decoration.
- Judge deformation in action poses and gameplay-camera scale, not from a
  neutral turntable alone.

## Why the rejected build looked like wooden dolls

The rejected generator produced 112 Hargold render meshes and 120 Mebble
render meshes. Upper arms, forearms, elbows, hands, fingers, thighs, shins, boot
parts, and many torso details were separate rounded objects parented directly
to individual bones. The clips moved those parts, but the surfaces did not bend
through their joints. The result was articulated motion rather than character
deformation.

## Implemented construction correction

The active `build_deformable_characters.py` pipeline now:

- starts from a factory-empty Blender scene;
- union-remeshes overlapping sculpt volumes into continuous skin and garment
  surfaces;
- applies normalized, adjacent-bone-only armature weights;
- gives central torso and head regions anatomical weight constraints so facial
  volume cannot be pulled by limb animation;
- adds facial morph targets and driven facial parts;
- keeps rigid parenting only for legitimately rigid accessories such as hat
  hardware, glasses, buckles, and pouches;
- validates that rigid upper-arm, forearm, elbow, hand, thigh, and shin pieces
  are absent;
- renders locomotion/glide action poses as deformation QA;
- exports all 65 Hargold and 66 Mebble original gameplay actions to GLB.

## Remaining art work

This procedural rebuild establishes the correct deformation architecture. It
does not replace senior hand sculpting, production retopology, hand-painted
texture work, corrective-shape authoring, animation polish, cape/cloth
collision tuning, LOD creation, or final art-direction approval against the
locked sheets.
