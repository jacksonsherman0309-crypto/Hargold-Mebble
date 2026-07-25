# Meadow Wake environment texture pass

These are original World 1-1 environment assets. They support the authored
Meadow Wake course; they do not generate or replace course geometry.

## Runtime assets

- `verdant-vale-background-v1.png` — far valley, cliffs, waterfalls, creek,
  sky, and atmospheric depth.
- `meadow-midground-ridge-v1.png` — transparent forest-ridge parallax layer.
- `meadow-soil-stone-albedo-v2.png` — authored terrain-face albedo with
  gameplay-scale fieldstones and roots.
- `meadow-turf-albedo-v1.png` — terrain-top and ledge turf albedo.

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

> Create one original seamless square albedo texture for the vertical side face
> of a premium stylized 3D-cartoon meadow platform in a polished side-scrolling
> platformer. Dark warm chocolate-brown compact soil with clear broad patches,
> scattered large rounded moss-dark fieldstones and slate fragments, a few thick
> exposed roots, tiny restrained moss flecks. Stones should be chunky and clearly
> readable from gameplay distance, roughly 8–15% of the texture width each; use
> sparse deliberate placement, not dense gravel or noisy pebbles. Rich
> hand-authored sculpted look, clean family-friendly game art, soft even flat
> lighting suitable as a PBR base-color texture, tileable on all four edges. No
> grass top strip, no characters, no interface, no text, no logos, no copied
> franchise assets.

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
