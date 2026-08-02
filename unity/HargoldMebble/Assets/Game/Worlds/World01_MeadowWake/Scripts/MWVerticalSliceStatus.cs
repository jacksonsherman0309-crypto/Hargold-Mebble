using UnityEngine;

namespace HargoldMebble.World01.MeadowWake
{
    [DisallowMultipleComponent]
    public sealed class MWVerticalSliceStatus : MonoBehaviour
    {
        [TextArea] public string status =
            "COLLISION_FROZEN; BROWSER_VISUAL_FROZEN_AT_55cd085; HUMAN_DCC_VISIBLE_TERRAIN_NOT_AUTHORED; UNITY_EDITOR_VALIDATION_REQUIRED";
        public bool productionReady;
        public bool terrainMastersShareGeometry;
        public bool collisionRenderersEnabled;
        public bool visibleTerrainCollisionEnabled;
        public bool visibleTerrainMeshPresent;
        public string canonicalLayout = "data/level-art/world-1/meadow-wake-opening-layout.json";
        public string canonicalTerrainArchitecture = "data/level-art/world-1/meadow-wake-terrain-architecture.json";
        public string canonicalBlender = "assets/blender/environments/world-1/meadow-wake-opening.blend";
        public string collisionMaster = "Collision/Terrain_Collision_Master";
        public string visibleMaster = "Art/Terrain_Visible_Master__AUTHORED_DCC_ASSET_REQUIRED";
    }
}
