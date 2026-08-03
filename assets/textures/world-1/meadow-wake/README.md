# Meadow Wake environment texture pass

These are original World 1-1 environment assets. They support the authored
Meadow Wake course; they do not generate or replace course geometry.

## Runtime assets

- `verdant-vale-background-v1.png` — far valley, cliffs, waterfalls, creek,
  sky, and atmospheric depth.
- `meadow-midground-ridge-v1.png` — transparent forest-ridge parallax layer.
- `meadow-soil-stone-albedo-v3.png` — active authored terrain-face albedo with
  gameplay-scale fieldstones and roots.
- `meadow-turf-albedo-v1.png` — terrain-top and ledge turf albedo.
- `meadow-camp-timber-albedo-v1.png` — hand-finished camp timber and plank
  albedo for modeled decks, bridges, hoists, crates, and structural props.
- `meadow-ruin-stone-albedo-v1.png` — moss-jointed fieldstone albedo for
  modeled ruins, ledges, bridge anchors, and goal masonry.
- `meadow-canvas-albedo-v1.png` — stitched explorer-green canvas albedo for
  camp shelters, banners, and awnings.
- `meadow-bark-albedo-v1.png` — stylized bark albedo for trunks, stumps,
  fallen logs, roots, and structural timber variation.
- `verdant-vale-living-surface-atlas-v1.png` — transparent eight-cell atlas of
  original grass, fern, weed, flower, and moss colonies for sparse mobile
  cards in the pending Blender living-surface quality gate. It is not deployed.

The bitmap sources were generated with OpenAI's built-in image generation and
then integrated with real Three.js terrain meshes, lighting, fog, and 3D
foreground dressing. The supplied Meadow Wake target image was used only as a
quality, palette, density, and depth-composition reference.

## Final prompts

Far valley:

> Original premium stylized 3D-cartoon side-scrolling platformer background
> plate for Meadow Wake, a sunlit verdant mountain valley. Wide panoramic blue
> sky, soft clouds, distant blue mountains, forested cliffs, multiple
> waterfalls, a winding creek and rich meadow depth. Clean readable
> family-friendly forms, cinematic light, polished game art, no characters, no
> interface, no text, no blocks, no copied franchise assets.

Terrain face:

> Seamless square albedo texture for an original real-time 3D side-scrolling
> platformer terrain mesh: a highly polished Verdant Vale earth face with
> compact warm brown loam, rounded embedded slate and fieldstones, subtle
> branching roots, tiny moss pockets, and gently layered erosion strata.
> Hand-painted high-end stylized 3D game material with clean family-friendly
> craftsmanship, orthographic straight-on framing, uniform detail density, and
> seamless edges. Neutral ambient material lighting with no cast shadows.
> Entirely original Hargold & Mebble asset; no characters, blocks, coins,
> symbols, text, watermark, interface, or recognizable existing-game asset.

Turf:

> Seamless square premium stylized 3D-cartoon meadow turf albedo: dense short
> grass, clover, tiny white yellow and purple wildflowers, mossy natural color
> variation, clean platformer readability, flat even lighting, no characters,
> no text, no franchise assets.

Midground ridge:

> Original wide stylized 3D-cartoon forest-ridge layer for a side-scrolling
> meadow platformer, isolated on a perfectly flat saturated magenta chroma
> background. The lower half is a continuous ridge of leafy deciduous trees,
> scattered firs, shrubs, ferns, mossy rocks and tiny wildflowers; the upper
> field is empty chroma. Sunlit polished game art, no characters, no interface,
> no text, no copied franchise assets.

Camp timber:

> Original seamless square albedo texture for premium stylized 3D-cartoon
> explorer-camp timber in a side-scrolling platformer: broad hand-hewn warm
> brown planks, readable grain, knots, beveled wear and subtle tonal variation,
> soft even PBR base-color lighting, tileable on all edges, no text, no symbols,
> no characters, no interface, and no copied franchise assets.

Ruin stone:

> Original seamless square albedo texture for premium stylized meadow ruins:
> large rounded hand-set grey and warm slate fieldstones, deep readable joints,
> restrained moss and lichen, clean gameplay-distance shapes, soft even PBR
> base-color lighting, tileable on all edges, no text, no characters, no
> interface, and no copied franchise assets.

Camp canvas:

> Original seamless square albedo texture for weathered explorer-green camp
> canvas: tightly woven cloth, subtle stitched horizontal seams, gentle sun
> fading and restrained wear, clean premium stylized 3D-cartoon game finish,
> soft even PBR base-color lighting, tileable on all edges, no emblems, no text,
> no characters, no interface, and no copied franchise assets.

Bark:

> Original seamless square albedo texture for premium stylized 3D-cartoon
> meadow tree bark: chunky vertical ridges, warm dark-brown grooves, softened
> hand-sculpted forms, restrained moss traces, strong gameplay-distance
> readability, soft even PBR base-color lighting, tileable on all edges, no
> text, no characters, no interface, and no copied franchise assets.

Living-surface card atlas:

> Create one clean 4-by-2 atlas containing eight separate original Verdant
> Vale meadow vegetation clumps: two short soft grass clumps, two medium varied
> grass clumps, one sparse broken-edge grass clump, one tiny fern-and-weed
> clump, one small flower-and-grass clump, and one low mossy ground-cover
> clump. Use polished hand-painted 3D-platformer vegetation with botanically
> believable varied blade heights, widths, bends, overlaps, gaps, restrained
> dry blades, ivory and gold flowers, clear side-profile silhouettes, and
> mobile-friendly medium detail. Isolate every clump with generous padding on
> a perfectly flat solid magenta chroma background with no shadow, gradient,
> floor, text, watermark, border, copied asset, or magenta inside vegetation.
