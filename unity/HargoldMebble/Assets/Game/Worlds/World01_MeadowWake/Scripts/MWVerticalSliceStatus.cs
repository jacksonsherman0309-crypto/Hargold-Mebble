using UnityEngine;

namespace HargoldMebble.World01.MeadowWake
{
    [DisallowMultipleComponent]
    public sealed class MWVerticalSliceStatus : MonoBehaviour
    {
        [TextArea] public string status =
            "UNITY_EDITOR_VALIDATION_REQUIRED; SCULPT_REQUIRED; RETOPO_REQUIRED; UV_REQUIRED; ART_REVIEW_REQUIRED";
        public bool productionReady;
        public string canonicalLayout = "data/level-art/world-1/meadow-wake-opening-layout.json";
        public string canonicalBlender = "assets/blender/environments/world-1/meadow-wake-opening.blend";
    }
}
