# Blender character asset pipeline

This directory contains production contracts and tooling, not finished character
assets. `gameplay_asset_template.blend` and the matching GLB are generic
templates. They are not Hargold or Mebble models.

## Source authority

1. `docs/canonical-design-bible.md` and `src/canonical-data.js`.
2. Locked reference sheets in `assets/references/`.
3. `character-production-manifest.json`.

Only Mebble's locked sheet is currently present. Hargold's locked sheet must be
added before visual sign-off; the written canon remains binding meanwhile.

## Scene and export contract

- Blender LTS production version, recorded in each asset's metadata.
- Units: metric, 1 Blender unit = 1 metre; Z up, character faces -Y.
- Origin: ground contact between the feet. Apply mesh transforms before rigging.
- Separate source files: `hargold_character.blend`, `mebble_character.blend`.
- Collections: `REF`, `GEO`, `RIG`, `ATTACHMENTS`, `COLLISION_PROXY`, `EXPORT`.
- Armature object: `RIG_<HERO>`; deform bones use `DEF_`, controls `CTRL_`,
  mechanisms `MCH_`, and sockets `SOCKET_`.
- Gameplay simulation drives translation. Export clips in-place with root motion
  removed unless a clip is explicitly tagged for reconciliation.
- Export glTF 2.0/GLB, +Y forward conversion enabled, animations sampled, no
  cameras/lights/reference planes/collision proxies.
- Reference images are packed or linked in `REF`, disabled in renders and exports.
- All materials use a mobile-compatible Principled BSDF path.

Run `blender --background <character.blend> --python validate_character_asset.py`
before export. The validator intentionally fails until real character files,
meshes, rigs, materials, and required actions exist.

## Approval gates

1. Orthographic silhouette/model sheet match.
2. Topology and deformation review.
3. Rig controls, sockets, cape behavior, and facial range.
4. Material/texture/mobile-budget review.
5. Complete in-place animation set and foot-contact markers.
6. Proxy collider measurement fed back into runtime tuning.
7. GLB import, animation, scale, plane alignment, and target-device validation.

