# Course Format and Hero Action Amendment

Last approved: July 26, 2026

This amendment is current canon and overrides older documents, archived plans, prototypes, movement matrices, level scaffolds, or implementation notes wherever they conflict. Codex must apply these rules before editing course layouts, movement, animation, collision, camera behavior, or level-generation support.

## 1. No underwater levels

- The campaign contains no underwater levels.
- Do not generate, preserve, restore, or implement any course whose primary playable format is underwater swimming.
- Do not convert an existing authored course into an underwater course.
- Water may appear as scenery, a shoreline, a shallow contact hazard, a current-driven surface feature, or a tightly bounded set piece only when normal side-scrolling land controls remain authoritative.
- The player must never enter a prolonged free-swimming state or navigate a course by unrestricted vertical swimming.
- Any archived underwater course must be redesigned as an original horizontal land, shoreline, flooded-platform, tidal-mechanism, bridge, cliff, or surface-water course while preserving its world identity and difficulty role where practical.
- Tideglass Coast remains a water-themed world, but its courses use beaches, docks, cliffs, flooded ruins, moving rafts, tide-driven platforms, breakwaters, caves with dry traversal, and surface hazards rather than underwater stages.

## 2. No vertical levels

- The campaign contains no vertical levels.
- Every normal course, tower, castle approach, secret course, boss approach, and escape sequence must progress primarily from left to right or right to left on the strict linear side-scrolling plane.
- Short elevation changes, hills, stair-step ruins, ramps, lifts, climbing moments, drops, and compact vertical rooms may exist only as local segments inside an overwhelmingly horizontal course.
- Do not create courses whose primary progression is upward or downward through stacked chambers.
- Do not use continuous vertical autoscroll, tower climbing, shaft climbing, or a vertically stacked course map.
- Towers must be reinterpreted as horizontal strongholds, machinery corridors, ramparts, fortified bridges, or lateral gauntlets.
- Camera framing must preserve forward route visibility and must not rotate normal gameplay into a vertical orientation.

## 3. Mebble cape glide

Mebble retains an innate cape-based slow-fall and glide. Its gameplay presentation should evoke the broad readable silhouette and inflated gliding posture associated with a flying-squirrel-style platforming power-up, while remaining an original Hargold & Mebble animation and costume implementation.

Required behavior:

- Holding the glide input during descent opens and tensions Mebble's green cape into a broad wing-like gliding surface.
- The cape spreads laterally from his arms and shoulders, enlarging his silhouette and visibly catching air.
- Mebble adopts a stable outward-limbed gliding pose rather than hanging beneath the cape like a parachute.
- The cape must remain visibly attached to his approved clothing and preserve its locked color, emblem, proportions, and original construction.
- The animation must preserve Mebble's long neck, visible Adam's apple, crooked glasses, top hat, and readable profile.
- Glide slows descent and allows limited horizontal correction or a short transfer.
- Glide cannot produce infinite flight, repeated height gain, unrestricted ascent, or depth-lane movement.
- Entry, sustained glide, steering, release, landing, and interrupted-fall animations must be authored as distinct states.
- Cape deformation requires rigged cloth/secondary controls and cannot be represented by a rigid flat board.
- The final design must not copy Nintendo meshes, textures, animation clips, exact poses, sound effects, identifiers, or proprietary tuning.

## 4. Twirl removal

- Remove the general airborne twirl from both heroes.
- A second airborne jump-button press must not trigger a twirl, spin stall, or hang-time action by default.
- Hargold's unlocked double jump remains permitted, but its animation must not use a twirling or spinning body motion unless the user later explicitly approves that specific animation.
- Mebble's glide activation uses the cape-glide transition, not a twirl.
- Remove twirl references from input contracts, movement-state lists, animation requirements, tests, tuning data, and user-facing control instructions.
- A twirl may exist only when a future course, power-up, scripted set piece, or explicitly approved action specifically requires it.

## 5. Hero-specific slam actions

The slam is not a shared Mario-style ground-pound animation. Both heroes may use the same input family and compatible impact rules, but each must have a distinct original physical action and silhouette.

### Hargold belly flop slam

- Airborne slam input triggers a brief brace and forward curl.
- Hargold rotates his broad torso into a belly-first downward flop.
- His stomach and forearms lead the impact while his legs and boots trail with readable secondary motion.
- The impact silhouette must emphasize his short, heavy, rounded build.
- Landing uses a broad body impact, compressed squash, dust/debris response, and a short heavy recovery.
- The move may break approved slam-sensitive objects, damage approved enemies, trigger floor mechanisms, or produce an authored localized shock response.
- It must not visually resemble a feet-first or seated ground pound.

### Mebble fist-first dive-bomb slam

- Airborne slam input triggers a brief aiming and commitment pose.
- Mebble angles downward and extends one fist as the leading point of impact.
- His body follows in a streamlined diagonal-to-vertical dive-bomb pose.
- His free arm, legs, coat elements, and cape trail behind with controlled follow-through.
- The cape must fold or stream safely behind him rather than opening into glide form during the committed dive.
- The impact uses a focused fist strike, narrow impact effect, controlled recoil, and a distinct recovery pose.
- The move may strike approved targets, activate mechanisms, or break authored slam-sensitive objects according to course rules.
- It must not use Hargold's belly-first silhouette or a copied feet-first ground-pound pose.

## 6. Slam simulation contract

- Slam states remain deterministic: startup, commitment, descent, impact, and recovery.
- Hero-specific animation and collision presentation may differ, but gameplay outcomes must be explicitly authored and testable.
- The move cannot be cancelled after the commitment threshold except by damage, death, a scripted interaction, or another approved interruption.
- A held downward input that fails the slam activation requirements becomes an ordinary fast fall only when the current movement contract allows it.
- Impact hitboxes must match the visible leading contact: Hargold's belly/forearm contact area and Mebble's leading fist.
- Neither slam may create unrestricted horizontal flight or depth movement.

## 7. Level-blueprint enforcement

Every authored course blueprint must include:

- `courseOrientation: "horizontal"`
- `underwaterGameplay: false`
- `primaryTraversalMode: "grounded_side_scroll"`
- `verticalCourse: false`
- a declaration of any local elevation segment and proof that it remains subordinate to horizontal progression
- a Mebble glide-use declaration when glide is taught, required, or rewarded
- hero-specific slam compatibility fields when a slam interaction is present
- `twirlRequired: false` unless a later explicit exception is documented

A blueprint fails validation when:

- swimming is the primary traversal method;
- the course primarily progresses through stacked vertical rooms;
- the camera or controls rotate normal play into vertical orientation;
- a required action invokes the removed general twirl;
- Hargold uses a generic feet-first ground pound instead of the belly flop;
- Mebble uses a generic feet-first ground pound instead of the fist-first dive bomb;
- Mebble's glide is represented as an ordinary spin or rigid parachute-only pose;
- a historical underwater or vertical plan is implemented without redesign.

## 8. Migration directive

Codex must audit all current and archived course plans, movement specifications, animation lists, schemas, runtime states, and tests for conflicts. Conflicting material is not silently retained. Mark it superseded, migrate it to these rules, and preserve only compatible authored mechanics, enemy encounters, rewards, and world identity.