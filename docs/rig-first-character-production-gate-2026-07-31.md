# Rig-First Character Production Gate

Approved: July 31, 2026  
Status: authoritative production-order override

This document records the approved production sequence for Hargold and Mebble. It supersedes any workflow that attempts to finish, polish, approve, or exhaustively validate the final animation library on the interim 24-bone Meshy rigs before the production Blender rigs are established.

The visible identity of both heroes remains locked. The production skeletons, control rigs, skin weights, deformation topology, corrective shapes, facial systems, hand systems, and accessory controls must be established and approved first. Final animation production follows those approved rigs.

## 1. Core decision

The production dependency order is:

1. establish the Blender production rigs;
2. approve their deformation and controls;
3. export and integrate versioned candidate GLBs through a semantic control map;
4. verify runtime parity and rollback safety;
5. author, migrate, polish, and approve the complete animation library on those production rigs;
6. perform exhaustive live gameplay animation validation.

The current Meshy rigs remain temporary runtime, migration, and diagnostic assets. They are not the final animation-authoring target.

## 2. Work that pauses now

Until both production Blender rigs pass the gates in this document, pause the following as final-production work:

- final keyframe or curve polish on the interim rigs;
- final approval of walk, run, sprint, stops, skids, crouch-walk, slide, jump, landing, ground slam, twirl, double jump, glide, reactions, or victory animation;
- exhaustive animation-library approval claims;
- accessory follow-through polish that the current rigs cannot physically support;
- facial or hand performance claims on rigs with no suitable controls;
- rebuilding the same action repeatedly to compensate for poor joint placement or weights.

Animation clips on the interim rigs may still be used for:

- controller and state-machine diagnostics;
- timing experiments;
- silhouette blocking;
- event-marker verification;
- regression comparisons;
- migration references;
- proof that a gameplay state can be triggered.

Such clips are provisional blocking or diagnostic evidence only. They are not final production animation.

## 3. Work that may continue in parallel

The rig-first gate does not freeze the entire game project. The following rig-independent or rig-adjacent work may continue:

- deterministic movement physics;
- movement-state and input-priority logic;
- controller-owned translation and collision;
- numeric timing contracts;
- contact, effect, and event-marker schemas;
- animation validation tooling;
- semantic pose naming and semantic control-map interfaces;
- camera, level, enemy, block, save, progression, audio-hook, and environment work;
- asset pipeline and export automation;
- tests that do not falsely claim final visual animation quality.

Do not discard the existing numeric animation contract. Preserve its gameplay timing, state relationships, and event intent, then adapt the final pose implementation to the approved production rigs.

## 4. Mandatory rig-production sequence

### Stage 0 — Preserve the current baseline

Before changing the production assets:

- preserve the current Hargold and Mebble GLBs as rollback assets;
- record hashes, scale, foot origin, facing, sockets, material assignments, mesh identity, and current runtime map;
- keep the current browser build functional;
- do not overwrite the rollback exports.

### Stage 1 — Create editable Blender production sources

Create one authoritative Blender source for each hero. Each source must contain:

- the approved visible character;
- canonical metre scale;
- clean object transforms;
- correct side-view facing;
- stable foot origin and floor alignment;
- production mesh topology suitable for deformation;
- production armature and control rig;
- clearly separated deform, control, helper, socket, and accessory systems;
- version and export metadata.

The Blender files, not generated GLBs alone, are the editable production authority.

### Stage 2 — Build the purposeful production skeletons

Use the rig direction in `docs/character-rig-direction-override-2026-07-31.md` and `data/character-rig-direction-override-2026-07-31.json`.

Do not copy an external skeleton. Build original hero-specific rigs around the approved action list.

The skeletons must support, at minimum:

- pelvis and center-of-mass control;
- multi-joint torso compression, extension, lean, and counter-rotation;
- clavicle and shoulder placement that keeps arms readable;
- clean elbows, wrists, hips, knees, ankles, feet, and toes;
- short, forceful Hargold proportions;
- Mebble's three-part long-neck control and separate head control;
- the revised ground-slam tuck, somersault, committed descent, impact, and recovery;
- Hargold's double jump and Hargold-only twirl;
- Mebble's glide body and cape system;
- crouching squat-walk, slide, skids, landings, reactions, and carry/grab poses.

### Stage 3 — Skinning, topology, and corrective deformation

Establish production skin weights and topology before animation polishing.

Correct visible failures including:

- shoulder collapse;
- elbows or knees pinching;
- wrist separation;
- hip collapse in crouch, slide, and slam;
- candy-wrapper twisting;
- Hargold's limbs disappearing into his torso;
- Mebble's neck pinching, stretching, or disconnecting;
- boots losing their planted shape;
- hard seams between body regions that should deform continuously.

Use helper joints and corrective morphs only where they solve a visible problem.

### Stage 4 — Establish hand, face, and accessory systems

Before final animation production, verify that the rigs can create the required performances.

Hands must support the approved readable shapes, whether through compact controls, morphs, or driven shapes.

Faces must support eye direction, blinks, brows, mouth states, effort, hurt, surprise, and victory.

Hargold requires working controls for hat stability, feather, scarf/cape, backpack, belt, pouch, and facial-hair follow.

Mebble requires working controls for top-hat stability, glasses, Adam's-apple/neck correction, cape open/trail/lift/sustain/settle/close, belt, and pouch.

### Stage 5 — Static and posed deformation gate

Do not begin final animation production until both heroes pass an enlarged pose review using the actual production meshes and rigs.

Required poses include:

- neutral;
- walk contact and passing;
- run contact and airborne extension;
- full-speed extension;
- acceleration first step;
- release stop;
- planted skid and planted turn;
- crouch;
- crouch-walk contact and passing;
- slide;
- jump anticipation, rise, apex, and fall preparation;
- soft and heavy landing;
- ground-slam tuck, somersault midpoint, committed descent, impact, and recovery;
- Hargold double jump;
- Hargold twirl;
- Mebble glide open and sustain;
- hurt, knockback, defeat, block hit, carry/grab, and victory.

Review every pose from true side first, then the permitted action-specific reveal angle. Test both facings and mobile-scale silhouette readability.

A neutral pose or skeleton screenshot is not sufficient.

### Stage 6 — Candidate export and semantic-map integration

After the Blender pose gate passes:

- export versioned candidate GLBs;
- preserve the current rollback GLBs;
- create an explicit old-to-new semantic bone/control map;
- keep raw export bone names out of gameplay logic;
- adapt the numeric animation runtime and renderer through the semantic map;
- verify materials, scale, foot origin, facing, sockets, bounds, and loading;
- verify no normal-gameplay root motion was introduced.

### Stage 7 — Runtime parity gate

Before switching the default runtime assets, prove:

- both candidate GLBs load without errors;
- controller collision and translation remain unchanged;
- hero swapping preserves safe foot placement;
- current gameplay states remain reachable;
- semantic controls resolve completely;
- rollback remains functional;
- performance is acceptable on the mobile target;
- visual appearance still matches the approved characters.

### Stage 8 — Final animation production

Only after Stages 0–7 pass may Codex or the animation pipeline perform final animation authoring and approval.

Recommended order:

1. idle and locomotion foundation;
2. acceleration, braking, skid, and planted turn;
3. crouch, crouch-walk, and slide;
4. jump, fall, landing, and bounce;
5. rebuilt ground slam;
6. Hargold double jump and Hargold-only twirl;
7. Mebble glide;
8. damage, defeat, block hit, carry, power, swap, and victory;
9. facial, hand, and accessory polish;
10. transitions and full-library gameplay validation.

Do not transfer weak interim deformation into the new rigs merely to preserve old curves. Retarget or rebuild actions as needed.

## 5. Rig approval gates

Both heroes must pass all five gates.

### Gate A — Identity and integration

- approved visible identity preserved;
- canonical height and relative scale preserved;
- foot origin, floor line, facing, and sockets correct;
- materials and accessories intact;
- strict side-scrolling orientation preserved.

### Gate B — Control completeness

- all required semantic body controls present;
- hero-specific neck and secondary controls present;
- hand and face systems present;
- no required action depends on a missing control;
- semantic map documented and machine-readable.

### Gate C — Deformation quality

- required pose sheet passes;
- no major collapse, pinch, separation, twist, or silhouette loss;
- Hargold's limbs remain readable outside the torso;
- Mebble's neck, head, arms, and cape remain structurally coherent;
- planted boots and foot roll remain readable.

### Gate D — Export and runtime parity

- versioned GLBs load correctly;
- no scale, origin, facing, material, socket, or bounds regression;
- no controller or collision regression;
- semantic map resolves every production control;
- rollback tested.

### Gate E — Mobile-scale animation readiness

- silhouettes remain readable at approximately 100–150 pixels tall;
- front/rear limbs separate in true side profile;
- ground slam, crouch-walk, skid, slide, twirl, double jump, and glide poses are distinguishable before full polish;
- face, hand, and accessory controls remain visible enough to justify production animation work.

Failure of any gate returns the asset to rigging, weighting, topology, corrective, or control work. Do not attempt to solve a failed rig gate by continuing animation polish.

## 6. Required deliverables before final animation resumes

- Hargold production `.blend` source;
- Mebble production `.blend` source;
- versioned candidate GLBs;
- current rollback GLBs and hashes;
- complete rig inventory for each hero;
- deform/control/helper/socket counts;
- semantic bone/control map JSON;
- skin-weight and corrective report;
- facial-control inventory;
- hand-pose inventory;
- accessory-control inventory;
- static and posed deformation sheets;
- true-side mobile silhouette sheets;
- runtime parity report;
- rollback test result;
- rig-gate pass/fail matrix.

## 7. Completion and reporting rule

Do not report that the Blender rigs are established merely because:

- an armature exists;
- the model imports into Blender;
- a GLB exports;
- a neutral pose looks acceptable;
- the bone count falls inside a recommendation range;
- structural tests pass.

The rigs are established only when both production Blender sources, controls, weights, corrective systems, pose gates, candidate exports, semantic maps, and runtime parity checks pass.

Final animation production and approval remain blocked until that point.