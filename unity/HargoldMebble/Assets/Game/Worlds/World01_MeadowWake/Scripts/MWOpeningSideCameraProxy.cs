using UnityEngine;

namespace HargoldMebble.World01.MeadowWake
{
    /// <summary>Temporary strict side-profile camera used for slice validation.</summary>
    [DisallowMultipleComponent]
    public sealed class MWOpeningSideCameraProxy : MonoBehaviour
    {
        [SerializeField] private Transform target;
        [SerializeField] private float lookAheadMetres = 2.1f;
        [SerializeField] private float verticalOffset = 2.6f;
        [SerializeField] private float presentationDepth = -18f;
        [SerializeField] private float smoothing = 12f;

        public void Bind(Transform newTarget) => target = newTarget;

        private void LateUpdate()
        {
            if (target == null)
            {
                return;
            }

            float facing = Mathf.Abs(target.localScale.x) < 0.001f ? 1f : Mathf.Sign(target.localScale.x);
            Vector3 desired = new Vector3(
                target.position.x + lookAheadMetres * facing,
                target.position.y + verticalOffset,
                presentationDepth
            );
            transform.position = Vector3.Lerp(transform.position, desired, 1f - Mathf.Exp(-smoothing * Time.deltaTime));
            transform.rotation = Quaternion.Euler(0f, 0f, 0f);
        }
    }
}
