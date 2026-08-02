# Collision

`Source/Terrain_Collision_Master.fbx` is the frozen low-poly gameplay authority
for character support, enemies, raycasts, and physics. The Unity importer adds
mesh colliders and disables every renderer below this asset.

The visible-art target is currently empty at
`Art/Terrain_Visible_Master__AUTHORED_DCC_ASSET_REQUIRED`. Never derive visible
art from this collision asset, and never enable its renderers in normal play or
screenshots. Collision visualization requires an explicit debug workflow.
