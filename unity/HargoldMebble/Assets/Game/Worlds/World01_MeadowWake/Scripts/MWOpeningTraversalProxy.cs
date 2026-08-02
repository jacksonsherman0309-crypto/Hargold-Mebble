using UnityEngine;

namespace HargoldMebble.World01.MeadowWake
{
    /// <summary>
    /// Temporary editor/device traversal proxy only. This does not replace the
    /// deterministic production hero controller and never permits depth-lane movement.
    /// </summary>
    [DisallowMultipleComponent]
    public sealed class MWOpeningTraversalProxy : MonoBehaviour
    {
        [SerializeField] private float horizontalSpeed = 5.7f;
        [SerializeField] private float jumpSpeed = 10.4f;
        [SerializeField] private float gravity = 36.8f;
        [SerializeField] private float gameplayPlaneZ;
        [SerializeField] private bool temporaryValidationProxy = true;

        private CharacterController controller;
        private float verticalSpeed;

        private void Awake()
        {
            controller = GetComponent<CharacterController>();
            transform.position = new Vector3(transform.position.x, transform.position.y, gameplayPlaneZ);
        }

        private void Update()
        {
            if (!temporaryValidationProxy || controller == null)
            {
                return;
            }

            float horizontal = Input.GetAxisRaw("Horizontal");
            if (controller.isGrounded)
            {
                verticalSpeed = -0.5f;
                if (Input.GetButtonDown("Jump"))
                {
                    verticalSpeed = jumpSpeed;
                }
            }
            else
            {
                verticalSpeed -= gravity * Time.deltaTime;
            }

            controller.Move(new Vector3(horizontal * horizontalSpeed, verticalSpeed, 0f) * Time.deltaTime);
            Vector3 locked = transform.position;
            locked.z = gameplayPlaneZ;
            transform.position = locked;
        }
    }
}
