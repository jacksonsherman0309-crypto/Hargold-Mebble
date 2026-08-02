# Meadow Wake Blender environment-art quality gate

Status: source comparison approved for Blender visual development; final result
must remain `AWAITING USER VISUAL APPROVAL`.

## Verified references

| Role | Repository path | Type | Dimensions | Bytes | SHA-256 |
| --- | --- | --- | ---: | ---: | --- |
| Production-quality target | `assets/references/terrain/meadow-wake-production-quality-target.jpeg` | JPEG | 1536×864 | 529,144 | `0DE3CADE62F70051022E824EF4C9C2E4B9AC633C7CDFEAA0A6286D452D82F338` |
| Current gameplay deployment | `assets/references/terrain/meadow-wake-current-deployment.png` | PNG | 1536×864 | 2,890,043 | `C3A60853954ACC188AE163419A4A516E77A2649891AB2E783FFAC9722B6D3534` |

The images are visibly different and their roles are not interchangeable. The
JPEG is the user-supplied quality target. The PNG is a format-correct copy of
the current restored browser gameplay capture. Neither image may be projected,
composited, or rendered inside the Blender art-gate scene.

## Concrete comparison

- **Terrain depth:** The target uses a shallow ordinary cross-section, roughly
  8–14% of frame height, with local rock/root depth only where justified. The
  current deployment exposes a largely continuous soil face across roughly the
  lower 30% of the frame.
- **Hero scale:** Hargold reads near 24–26% of frame height in the target and
  about 21–23% in the current deployment. The target gives the hero stronger
  presence without sacrificing forward route visibility.
- **Camp:** The target camp has layered timber-and-canvas construction, thick
  beams, roof tension, braces, hardware, lanterns, footings, steps, props, and
  visible interior depth. The current camp reads primarily as flat panels and
  simple beams with weak foundation contact.
- **Tree and foliage:** The target combines a large branch hierarchy, varied
  canopy masses, root flare, dense edge planting, flowers, mushrooms, and
  restrained route-clear vegetation. The current scene relies on small rounded
  canopy masses, sparse grass clumps, and minimal ecological connection.
- **Foreground materials:** The target separates turf, soil, roots, embedded
  stone, timber, cloth, metal, moss, flowers, and weathering. The current terrain
  has a useful soil texture but repeats visibly and lacks enough material and
  roughness transitions to support its large exposed face.
- **Depth bands:** The target has a sharp playable foreground, near dressing,
  readable middle valley, forest/cliff layer, distant mountains/waterfalls, and
  sky haze. The current background direction is attractive but the foreground
  and midground lack equivalent structural depth and detail.
- **Lighting:** The target uses cohesive warm daylight, cool environmental fill,
  strong but readable contact shadows, and atmospheric distance. The current
  lighting is bright and readable but flatter, with less contact, material, and
  foreground-to-distance separation.
- **Gameplay readability:** Both maintain a clear left-to-right route. The target
  does so with much richer environmental framing, shallower terrain, stronger
  landing silhouettes, and clearer open space around blocks and encounters.

The target visibly contains the required original quality language: a richly
constructed timber-and-canvas camp at left, shallow connected grass terrain,
natural foreground variation, roots/stones/plants/flowers/logs/fences/stumps, a
raised right formation, open gameplay space, and multiple atmospheric layers of
forest, mountains, cliffs, and waterfalls.

## Five largest visual gaps

1. Replace the current deep rectangular soil curtain with authored shallow
   landforms, local undercuts, and selective geological depth.
2. Raise the camp from panel/blockout construction to a hero asset with genuine
   joinery, cloth tension, hardware, footings, and interior layering.
3. Build a complete tree/root ecosystem with branch hierarchy and nonuniform
   leaf masses instead of cylinder/blob shorthand.
4. Increase foreground material and ecological richness while keeping the route,
   blocks, encounter space, and landing edges unobscured.
5. Create authored foreground/midground/background geometry and cohesive light
   separation that supports the existing Verdant Vale atmosphere without using
   either reference as a render plate.

## Locked art-gate boundary

The current browser deployment is unchanged. This task creates only one
locked-camera Blender composition representing the opening 15–25 seconds. No
collision, export, retopology, LOD, Unity integration, or browser integration is
authorized before explicit user visual approval.
