# Character Rig Direction Override — Purpose-Built Platformer Skeletons

Approved: July 31, 2026  
Status: authoritative production-rig direction override

This document records the newest user-approved character-rig direction for Hargold and Mebble. It supersedes any older instruction that treats the current generic 24-deform-bone Meshy skeletons as the final production skeletons or as an unchangeable ceiling on animation quality.

The **visible identity, proportions, costume, materials, and approved appearance of Hargold and Mebble remain locked**. The production skeleton, skin weights, deformation topology, corrective shapes, hand controls, facial controls, and accessory controls may be rebuilt as necessary to achieve the approved animation quality while preserving that identity.

The target is not to duplicate Mario's or Luigi's exact skeleton, joint names, joint positions, hierarchy, weights, topology, animation data, or proprietary implementation. Their rigs provide only a high-level production lesson: a relatively compact set of well-positioned, action-purposeful controls can produce clearer platformer animation than a larger generic humanoid skeleton whose joints, axes, and weights are poorly suited to the character.

## 1. Primary production principle

Bone count is not the quality target.

The production rig must use the **smallest purposeful control set that can cleanly produce every approved gameplay pose**. A bone or control is justified when it improves one or more of the following:

- gameplay silhouette;
- contact placement;
- shoulder, elbow, wrist, hip, knee, ankle, neck, or spine deformation;
- readable squash and stretch;
- hero-specific proportions;
- facial acting;
- hand posing;
- accessory follow-through;
- ground-slam, skid, slide, crouch-walk, jump, glide, twirl, damage, or victory readability;
- stable mobile-scale presentation.

Do not add joints merely to reach a target number. Do not preserve an inadequate joint layout merely because it already contains more joints than another character rig.

## 2. Status of the current 24-bone rigs

The current Hargold and Mebble Meshy rigs remain useful as:

- the present live-runtime baseline;
- a migration source for existing gameplay integration;
- a reference for current bind orientation and asset scale;
- a temporary validation rig while the production rigs are built.

They are **not** the final production-rig authority.

The current rigs lack the controls needed for the approved production standard, including meaningful facial acting, hand shape changes, independent cape/scarf motion, hat and glasses stabilization, accessory follow-through, and robust corrective deformation. Animation quality must not remain permanently constrained by those omissions.

A production re-rig is permitted and expected when the current skeleton cannot meet the approved action and deformation gates.

## 3. Locked versus changeable elements

### Locked

- Hargold's approved short, round, broad explorer identity;
- Mebble's approved tall, thin, long-necked identity;
- approved face, costume, colors, materials, hats, capes/scarves, boots, accessories, and overall silhouette;
- canonical character height and gameplay scale;
- strict side-scrolling gameplay plane;
- controller-owned world translation and collision;
- no animation root motion for normal gameplay;
- all approved hero abilities and movement rules.

### Changeable for production quality

- skeleton hierarchy;
- number of deform joints;
- number of non-deforming control joints;
- local joint axes and roll orientation;
- skin weights;
- topology density and edge flow where deformation requires retopology;
- corrective morph targets and pose-space correctives;
- facial morphs or facial controls;
- hand-pose controls;
- cape, scarf, hat, feather, glasses, belt, pouch, and backpack controls;
- internal control-rig organization;
- export bone names, provided the runtime bone map is updated and tested.

Retopology or re-rigging must preserve the approved visible character. It may not redesign the character under the label of technical cleanup.

## 4. Rig architecture direction

The production skeleton should follow a compact stylized-platformer architecture rather than a generic realistic-human rig.

### Shared gameplay body core

Both heroes require purposeful controls for:

1. world/root reference;
2. controller-aligned motion or center-of-mass control;
3. pelvis;
4. lower spine;
5. middle spine;
6. chest/upper spine;
7. clavicle or shoulder base on each side;
8. upper arm, forearm, and hand on each side;
9. thigh, shin, foot, and toe on each side;
10. neck chain appropriate to the hero;
11. head;
12. optional jaw or face anchor when facial shapes require it.

The body hierarchy must support:

- large readable torso lean without collapsing the abdomen;
- chest counter-rotation against the pelvis;
- planted skids and stops;
- deep crouch and squat-walk poses;
- low slides;
- wide running extensions;
- compact airborne tucks;
- the revised ground-slam somersault and low-hip descent;
- landing compression and recovery;
- side-view arm and leg separation at mobile scale.

### Hargold-specific direction

Hargold needs a compact, low-center-of-gravity rig with enough control to prevent his limbs from disappearing into his round torso.

Recommended production range, not a mandatory quota:

- core deform joints: approximately 24–30;
- secondary/accessory deform joints: approximately 6–10;
- total deform joints: commonly 30–40 when all justified controls are included.

Hargold requires:

- broad shoulder placement with clavicle control;
- upper-arm and forearm axes that keep hands outside the torso silhouette;
- hips placed for a very short, broad body rather than a scaled-down generic human;
- wide, stable knee and ankle placement;
- clear foot-roll and toe-off;
- hat stabilization;
- at least a small feather chain;
- scarf/cape follow-through controls;
- backpack, belt, and pouch follow controls where visible;
- facial hair following the jaw/cheek deformation rather than floating.

### Mebble-specific direction

Mebble needs a tall, flexible rig that preserves his long neck and thin limbs without producing rubber-hose collapse or head lag that disconnects from the body.

Recommended production range, not a mandatory quota:

- core deform joints: approximately 26–32;
- secondary/accessory deform joints: approximately 10–16;
- total deform joints: commonly 36–48 when all justified controls are included.

Mebble requires:

- a three-control neck chain at minimum: base, middle, and upper neck;
- a separate head control;
- Adam's-apple deformation or a corrective shape tied to neck motion;
- shoulder controls that keep the arms clear of vest and cape;
- thin-limb twist and bend support where needed;
- top-hat stabilization;
- glasses stabilization and controlled follow-through;
- a functional cape chain or equivalent controls capable of opening, trailing, lifting, settling, and closing for glide;
- belt and pouch follow controls where visible.

## 5. Hands and fingers

A full realistic five-finger skeleton is not required merely to increase bone count.

The hands must, however, support the approved readable gameplay shapes:

- relaxed/open;
- running cup;
- fist;
- landing brace;
- skid brace;
- block-hit/strike;
- grab or carry;
- victory pose.

These shapes may be produced with:

- a compact thumb-and-finger control set;
- hand-pose morph targets;
- driven corrective shapes;
- or another stable exportable solution.

Rigid mitten hands with no pose variation are not acceptable, but fifteen finger joints per hand are not automatically required.

## 6. Facial system

The face should not depend on a large facial-bone count when morph targets or compact controls provide cleaner results.

The production facial system must support, at minimum:

- left/right eye direction or a stable eye-aim solution;
- blinks;
- brow raise and brow compression;
- neutral mouth;
- open mouth;
- effort/grit mouth;
- hurt expression;
- surprised expression;
- victory expression;
- cheek or jaw correction where required by the character's face.

Hargold's goatee and facial hair must follow the face. Mebble's glasses and brows must remain readable and stable.

## 7. Deformation requirements

The production rig must be judged by deformation under action, not by a neutral-pose skeleton screenshot.

Required deformation gates:

- shoulders preserve rounded deltoid volume through forward, back, and raised arm poses;
- elbows bend without collapsing into sharp tubes;
- wrists remain attached and readable;
- hips do not cave in during crouch, slide, or ground slam;
- knees preserve front volume and do not invert;
- ankles support dorsiflexion, plantarflexion, and foot roll;
- toes support takeoff and planted contact;
- Hargold's torso may compress without swallowing the arms and legs;
- Mebble's neck may bend without pinching, stretching, or separating the head;
- capes, scarf, feather, glasses, hat, belt, pouch, and backpack follow the body without clipping or floating;
- no candy-wrapper twisting at upper arms or thighs;
- no visible hard seams between body regions that should read as one connected form.

Use corrective morph targets or helper deformation joints only where they solve a visible production problem.

## 8. Animation-oriented joint placement

Joint centers must be placed for the approved stylized motion rather than anatomical realism alone.

Validate placement against at least these poses:

1. neutral;
2. walk contact;
3. run contact;
4. run extension;
5. full-speed extension;
6. acceleration first step;
7. release stop;
8. planted skid;
9. planted turn;
10. crouch;
11. crouch-walk contact and passing;
12. slide;
13. jump anticipation;
14. jump rise;
15. jump apex;
16. fall preparation;
17. soft landing;
18. heavy landing;
19. ground-slam tuck;
20. ground-slam committed descent;
21. ground-slam impact;
22. Hargold double jump;
23. Hargold twirl;
24. Mebble glide open and sustain;
25. hurt;
26. knockback;
27. defeat;
28. block hit;
29. carry/grab;
30. victory.

The skeleton is not approved until those poses can be produced without unacceptable collapse or silhouette loss.

## 9. Runtime and migration contract

The production rig migration must preserve the live game while the replacement is being built.

Required migration sequence:

1. preserve the current 24-bone assets as a rollback baseline;
2. create production Blender sources for Hargold and Mebble;
3. preserve canonical scale, foot origin, facing direction, and gameplay sockets;
4. author the new skeleton and skin weights;
5. create an explicit old-to-new semantic bone/control map;
6. adapt the numeric semantic-pose runtime to the new semantic map rather than scattering raw bone names through animation code;
7. rebuild or retarget only original project-authored animation data;
8. export new GLB candidates under versioned paths;
9. validate both rigs in the animation validation course;
10. switch the runtime only after parity and quality gates pass;
11. keep rollback assets until the replacement has passed complete regression testing.

Do not import, retarget, or inspect third-party animation clips or skeleton data during this migration.

## 10. Required deliverables

A production-rig task is not complete without:

- editable Blender source for each hero;
- exported versioned GLB for each hero;
- semantic bone/control map JSON;
- rig inventory with deform and control counts;
- skin-weight and deformation validation report;
- facial control inventory;
- hand-pose inventory;
- secondary-motion control inventory;
- silhouette sheets at 100–150 pixels tall;
- action-pose sheets covering the required validation poses;
- live browser validation on both heroes;
- tests proving bone-map completeness and runtime compatibility;
- explicit list of any remaining limitations.

## 11. Acceptance standard

The final rig does not need to match any external skeleton.

It does need to achieve the same broad production philosophy:

- compact and purposeful;
- designed around the actual action set;
- cleanly weighted;
- readable from the gameplay camera;
- capable of strong stylized posing;
- simple where complexity adds no visible value;
- detailed where the character's unique design requires it.

A higher bone count does not excuse weak posing. A lower bone count does not excuse missing controls. Approval depends on the visible result and the ability to perform every locked action cleanly.