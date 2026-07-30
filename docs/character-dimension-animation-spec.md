# Character dimension, composition, and animation specification

Status: approved production contract, revised July 26, 2026.

July 28 runtime authority: the original user-supplied Meshy meshes and their
24-bone rigs are locked. The construction requirements below remain quality
and validation criteria, but they do not authorize replacing either active
mesh or selecting a different base rig. See
`docs/locked-meshy-animation-production.md`.

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

- True side is the primary gameplay and approval orientation. Every action must
  work at a flat profile before any reveal toward the camera is permitted.
- The locked mannequin-fit sheets use one unchanging orthographic true-side
  camera for every hero and row. No three-quarter reveal, per-character zoom,
  airborne camera follow, camera rotation, or automatic panel filling is
  permitted in those approval sheets.
- Use the small action-dependent reveal profile in
  `assets/blender/character-scale-orientation-profile.json`: 3 degrees for
  sprint, 4 for run and ground slam, 5 for airborne, 6 for walk/default, 8 for
  idle, start, air spin, and glide, 10 for stop, skid, hurt, and victory, and
  12 for the planted turn.
- A slight three-quarter view is a secondary personality and technical-review
  view. It may not be used to hide overlapping limbs or a weak side silhouette.
- Direction reversal must brake, compress, plant, twist, rotate, and accelerate
  into the new direction. Do not mirror a model with negative scale.
- Test left-facing and right-facing movement from the real gameplay camera.

## Volume and proportions

- Final Blender sources use metres at object scale `1,1,1`: Hargold is
  1.82 m tall and Mebble is 2.2932 m tall. A standard block is 0.74 m and common
  mobs occupy the 0.62–0.76 m band.
- The Mebble-to-Hargold height ratio is 1.26. Hargold reads at 2.39–2.94
  common-mob heights. These are original project targets derived from the
  locked sheets and the repository's existing world/collision scale.
- Visible hats, hair, feathers, and cape corners may exceed a collision proxy,
  but feet, center of mass, and collision measurements remain on the canonical
  metre scale.

### Authoritative featureless animation frames

Build and approve the rigged, featureless mannequins before fitting character
surfaces. Do not begin a new face, costume, or accessory pass to compensate for
an unapproved joint layout or action silhouette.

| Normalized measurement | Hargold compact | Mebble tall |
| --- | ---: | ---: |
| Maximum body width | 0.59 | 0.36 |
| Head height | 0.34 | 0.29 |
| Head width | 0.41 | 0.31 |
| Neck height | — | 0.17 |
| Torso height | 0.32 | 0.315 |
| Torso width | 0.50 | 0.32 |
| Visible leg length | 0.22 | 0.33 |
| Shoulder-to-hand arm length | 0.37 | 0.42 |
| Hand size | 0.12 | 0.11 |
| Foot length | 0.25 | 0.24 |
| Foot height | 0.115 | 0.105 |
| Shoulder width | 0.46 | 0.34 |
| Hip width | 0.39 | 0.275 |

The rig hierarchy contains Root, center of mass, pelvis, lower/mid/upper spine,
chest, neck base/mid/upper, head, jaw, clavicles, limb chains, fingers, feet,
toes, and character-specific accessory roots. Walk, run, and sprint validation
uses contact, compression, passing, lift/airborne extension, and the mirrored
opposite phases.

### Locked-frame fitting and review contract

The mannequin is the exact animation frame, not a neighboring pose example.
For every approved row the pipeline creates and locks the mannequin pose,
duplicates that exact skeleton, fits the hero mesh to the duplicate, and
preserves all major joint centers. Head center, neck base, shoulder, elbow,
wrist, pelvis, knee, ankle, and toe may differ by no more than three percent of
total character height. Accessories may exceed the frame; the body may not
drift away from it.

Every mannequin and fitted panel uses the same:

- orthographic true-side camera, looking along logical negative Z;
- right-facing direction, logical movement X, vertical Y, and depth Z;
- floor line at normalized panel Y `0.08`;
- standing-head line at normalized panel Y `0.92`;
- usable pose width from normalized X `0.08` to `0.92`;
- neutral root at normalized X `0.50`;
- camera position, orthographic scale, root convention, frame crop, and world
  scale.

Compact/Hargold standing height is normalized `1.00`; tall/Mebble is `1.26`.
Neither hero may be enlarged independently to fill a panel. Internally blend
the mannequin over every applicable fitted panel at 40 percent opacity and
reject any joint-center error over the three-percent tolerance.

The required four-column sheet contains twenty rows:

1. neutral;
2. walk contact;
3. run extension;
4. turnaround skid;
5. jump anticipation;
6. jump apex;
7. landing compression;
8. ground-slam descent;
9. Hargold double-jump burst;
10. Mebble glide;
11. solid silhouette;
12. complete skeleton alignment;
13. run contact;
14. run passing;
15. jump takeoff;
16. fall preparation;
17. sprint slide;
18. damage recoil;
19. block-hit pose;
20. victory pose.

Hargold double jump is `N/A` in both Mebble/tall cells, and Mebble glide is
`N/A` in both Hargold/compact cells. Neutral substitutes are forbidden. Split
the review into three enlarged images covering neutral/silhouette/skeleton,
locomotion, and jumping/abilities/attacks/landing.

| Locked action frame | Required readable construction |
| --- | --- |
| Neutral | Pelvis over feet, 0–2° forward torso, 5–8° knees, 10–15° elbows, separated hands, flat feet. |
| Walk contact | Front heel and rear toe contact, rear heel raised, opposing arm, 3–5° torso lean, neither foot airborne. |
| Run extension | Both feet airborne, opposed wide leg and arm extension, 12–18° forward torso, pelvis above walk height. |
| Turnaround skid | Previous travel is right; feet plant ahead to the right while torso braces left. Hargold leans 22–28° with 10–14% compression; Mebble leans 26–34° with 8–12% compression. |
| Jump anticipation | Lowest prelaunch pose, feet flat, deep knees and hips, arms down/back. Hargold compresses 15–18%; Mebble 12–15%. |
| Jump apex | Clearly airborne, bent knees, open balance arms, upright torso; never a reused neutral. |
| Landing compression | Both feet planted with deep hip/knee absorption. Hargold compresses 18–22%; Mebble 14–18%; no higher than anticipation. |
| Ground-slam descent | Airborne vertical centerline, feet beneath body, downward toes, forceful compact arms; Mebble's cape streams upward while his neck remains visible. |
| Hargold double-jump | 10–20° torso twist, one raised knee, opposite driving leg and arms, separated feet, distinct from apex. |
| Mebble glide | 8–12° forward torso, lifted chest, 55–70° spread arms, trailing rear leg, expanded cape, unobstructed neck and Adam's apple. |

The silhouette row is pure black with no internal shading and reuses the exact
Frame 01 pose and scale. The skeleton row draws connected bones and joint
markers for root, pelvis, spine, neck, head, shoulders, elbows, wrists, hips,
knees, ankles, and toes; Mebble also shows neck base/middle/upper and cape
root. A centerline alone is not a skeleton overlay.

- Heads require a curved skull, forehead depth, cheek and jaw volume, projecting
  nose, placed ears, modeled eyes, and volumetric hair/facial hair.
- Torsos require multiple-spine deformation for twist, lean, compression,
  stretch, waist rotation, and weight shift.
- Arms are organic forms. Hands are oversized for gameplay readability and
  support open, fist, brace, grab, strike, landing, and balance poses.
- Legs visibly drive locomotion. Feet support heel/toe placement, toe-off, foot
  roll, skids, landing compression, and speed-readable ground contact.
- Silhouette approval is performed at 100–150 pixels tall. At that scale the
  upper arm, forearm, hand, front foot, rear foot, torso, and rear accessory
  must remain distinguishable in motion rather than collapsing into one blob.
- Shoulders require authored deltoid volume and deformation loops connecting
  the chest-to-arm transition. Arms cannot appear to emerge directly from the
  side of the torso.
- Hargold's forearms must extend clearly beyond his round torso, his hands are
  enlarged by approximately 20–30 percent over the rejected July 26 candidate,
  and his boots use a broader, longer ground-contact silhouette. His cheeks
  remain round but transition into the face without separate spherical bulges.
- Mebble's torso is modestly widened without weakening his tall-thin identity.
  His arms hang clear of the vest and cape, his boots are enlarged, his neck
  tapers through the middle, his Adam's apple projects clearly in profile, his
  glasses sit off the face, and the cape begins as a curved shoulder yoke rather
  than a flat back panel.
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

## Organic construction gate

The locked character sheets and the approved compact/tall featureless frames
are the silhouette authority. The full body volume must fit that silhouette
before secondary costume, facial, surface, or material detail is approved.

Each hero requires one connected watertight deforming body surface integrating
the face, neck, torso, shoulders, arms, hands, fingers, pelvis, thighs, knees,
and shins. Multiple disconnected anatomical islands inside one object do not
count as a connected body. Facial masses such as Hargold's nose and cheeks and
Mebble's long-neck transition and Adam's apple must emerge from that body
surface rather than read as attached primitives.

Soft clothing must wrap the body as continuous garment surfaces. Boots must be
single rounded connected forms with an intentional ankle transition. Belts,
capes, collars, hats, glasses, backpacks, and rigid hardware may remain
separate only where their real construction, articulation, or secondary motion
requires it.

The structural validator must verify connected-component count, watertightness,
deforming bone-group coverage, continuous garments, and unified boots. On
July 27, 2026 the user explicitly approved the supplied Meshy appearances and
matching rigs for live gameplay testing. On July 30, 2026 the user clarified
that only those models and rigs are locked: the supplied animation clips are
replaceable references. Project-authored motion may therefore replace any
supplied gait while preserving the exact locked skeleton, bind transforms,
visible design, and controller-owned translation. This approval does not mark
the remaining production checklist or missing rig controls complete.

### Clean-room construction references

The user-supplied external character images are observable craft benchmarks
only. They may inform compact-versus-tall volume distribution, rounded joint
flow, limb taper, mesh-density priorities, profile readability, and expected
finish. No external identity, costume, color, logo, texture, mesh, topology,
rig, weight, animation, or proprietary measurement may enter a project asset.

Repository-safe modeling references are rendered from the original connected
Hargold and Mebble bodies:

- `assets/previews/construction-reference/hargold-construction-reference.png`;
- `assets/previews/construction-reference/mebble-construction-reference.png`.

Each source board contains original featureless neutral, run-contact,
run-extension, jump-apex, landing, and silhouette targets. Separate
`hargold-current-body-audit.png` and `mebble-current-body-audit.png` boards
expose the active clay body, wireframe, side silhouette, and run deformation.
These expose construction weaknesses without copying external art and do not
substitute for senior retopology or visual approval.

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

Neutral-pose beauty renders cannot approve proportions. The approval sequence
is locked-silhouette fit, connected-body verification, bind deformation,
100–150 pixel action silhouettes, gameplay-camera motion, and only then close
facial, cloth, accessory, material, and animation finish.
