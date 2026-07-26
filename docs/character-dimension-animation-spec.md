# Character dimension, composition, and animation specification

Status: approved production contract, July 25, 2026.

This contract uses the locked Hargold and Mebble sheets and
`assets/references/Hargold and Mebble approved production target.png`.
The combined target locks organic appeal, action posing, materials, expression,
and animated-platformer presentation. The individual sheets remain
authoritative for exact identity, costume, orthographic silhouette, and detail.

References to other platform games describe dimensional construction,
readability, responsiveness, and presentation quality only. Do not copy their
characters, geometry, textures, rigs, animations, code, protected designs, or
proprietary tuning.

## Dimensional hierarchy

1. Character construction is complete 3D: modeled fronts, backs, sides,
   clothing, facial forms, skinned meshes, skeletons, materials, and lighting.
2. Environment construction remains fully rendered 3D.
3. Standard gameplay remains on the strict linear side-scrolling plane.
4. The camera uses controlled perspective, parallax, and cinematic shifts
   without adding free forward/back depth movement.
5. The project presentation remains 2.75D. The characters themselves are never
   implemented as 2D sprites, cutouts, billboards, or paper-thin side-only
   models.

## Gameplay orientation

- Use a controlled three-quarter side orientation: mostly facing travel, with
  enough turn toward the camera to retain the face, chest, hands, footwear, and
  personality.
- Never leave the character permanently front-facing or at a perfectly flat
  90-degree profile.
- Direction reversal must brake, compress, plant, twist, rotate, and accelerate
  into the new direction. Do not mirror a model with negative scale.
- Test left-facing and right-facing movement from the real gameplay camera.

## Volume and proportions

- Heads require a curved skull, forehead depth, cheek and jaw volume, projecting
  nose, placed ears, modeled eyes, and volumetric hair/facial hair.
- Torsos require multiple-spine deformation for twist, lean, compression,
  stretch, waist rotation, and weight shift.
- Arms are organic forms. Hands are oversized for gameplay readability and
  support open, fist, brace, grab, strike, landing, and balance poses.
- Legs visibly drive locomotion. Feet support heel/toe placement, toe-off, foot
  roll, skids, landing compression, and speed-readable ground contact.
- Hargold is the very short, broad, round, compact, low-center-of-gravity,
  grounded hero. His locked explorer identity remains unchanged.
- Mebble is the taller, much thinner, long-limbed, long-necked,
  higher-center-of-gravity hero. His Adam's apple, crooked less-round glasses,
  bushy brows, top hat, cape, and locked clothing remain readable.

## Rig contract

Each production rig requires root and pelvis controls, multiple spine joints,
chest, neck and head controls, clavicles, IK/FK arms and legs, elbows, wrists,
finger articulation, hips, knees, ankles, foot roll, toes, eyes, lids, brows,
jaw, mouth, cheeks, gameplay sockets, and deformation correctives.

Hargold additionally requires controlled hat, feather, scarf, facial-hair,
belt, pouch, and backpack secondary motion. Mebble additionally requires
controlled hat, glasses, neck/Adam's-apple, cape, belt, and pouch secondary
motion. Secondary motion must lag the body without clipping, floating,
constant shaking, hiding identifiers, or overpowering the primary action.

## Animation contract

- Motion is gameplay-driven rather than realistic: immediate input
  communication, strong anticipation, clear silhouettes, controlled
  squash/stretch, overlap, follow-through, weight transfer, contact poses, and
  rapid recovery.
- Idle uses a stable bent-knee stance, breathing, separated arms, small hand,
  head, and facial motion. Hargold feels compact and confident; Mebble feels
  lighter and physically looser.
- Walk uses planted weight transfer, pelvis rotation, shoulder
  counter-rotation, arm swing, head stabilization, and speed-matched feet.
- Run and sprint progressively add forward lean, stride, toe-off, arm drive,
  airborne phases, torso compression/extension, and accessory follow-through.
- Acceleration begins with a body-leading lean and powerful short first step,
  then increases stride and cycle rate.
- High-speed stopping plants the feet ahead of the body, bends the knees,
  carries the torso forward, balances with the arms, and lets accessories lag.
- Jump contains distinct anticipation, takeoff, ascent, apex, descent, contact,
  compression, settle, and recovery poses. Running jumps preserve horizontal
  momentum and flow back into running.
- Hargold's exclusive double jump uses a distinct midair compression,
  kick/twist, second extension, effect cue, and compact forceful silhouette.
  This contract does not grant Mebble a double jump.
- Fall and fast-fall differ from ascent. Stomp bounce visibly compresses on
  impact and rebounds from collision.
- Crouch compresses the full body. Sprint slide is a low full-body momentum
  action, not a translated crouch.
- Ground slam contains preparation, accelerated descent, impact compression,
  reaction effects, a brief hold, and responsive recovery.
- Damage uses a brief directional hit, torso twist, accessory lag, balance
  loss, knockback, and recovery/defeat transition.
- Mebble's cape trails locomotion, lifts during jumps, settles after landing,
  and opens into a controlled parachute/glider. Glide poses preserve the
  visible face, long neck, and Adam's apple.
- Faces require eye direction, blinks, brows, mouth, cheeks, head motion, and
  state-specific reactions. Hargold's facial hair follows jaw/cheek
  deformation; Mebble's glasses and brows remain stable and readable.

## Shading and optimization

Use soft rounded stylized shading with directional, ambient, rim, shadow,
environment-color, roughness, and specular response. Avoid flat/unlit surfaces,
plastic skin, metallic cloth, harsh realism, excessive texture noise, and
normal maps that damage the silhouette.

Production topology requires smooth silhouettes, facial density, shoulder,
elbow and knee loops, adequate hands, rounded footwear, clean neck transitions,
stable cape topology and normals, clean UVs, and planned LODs. Optimization may
remove hidden waste but may not destroy visible roundness.

## Required validation scene

Show both heroes in neutral presentation and through the actual gameplay camera:

- front, rear, true side, and gameplay three-quarter side;
- left- and right-facing movement;
- idle, walk, run, full sprint, acceleration, skid, and physical reversal;
- standard jump, running jump, Hargold double jump, ascent, apex, fall, landing,
  hard landing, crouch, sprint slide, stomp, bounce, ground slam, and damage;
- Hargold block break;
- Mebble slow-fall and glide;
- level-completion pose.

At gameplay distance, head, body proportions, hands, feet, face, direction,
current state, Hargold's round build, hat and beard, and Mebble's glasses,
brows, cape, neck, and Adam's apple must remain readable across bright,
interior, forest, desert, snow/crystal, volcanic, and poison/swamp lighting.

## Acceptance boundary

Completion requires actual editable 3D models, production rigs, materials,
animations, exports, and approved validation captures. This document, the
approved target image, manifests, scripts, and placeholder GLBs are not
substitutes for those assets. Do not modify mobs, enemies, bosses, levels, or
unrelated assets during this character-production stage.
