using System;
using System.Collections.Generic;
using System.IO;
using HargoldMebble.World01.MeadowWake;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace HargoldMebble.Editor.World01
{
    public static class MWOpeningLayoutImporter
    {
        private const string ScenePath =
            "Assets/Game/Worlds/World01_MeadowWake/Scenes/MW_Opening_VerticalSlice.unity";
        private const string CollisionFbxPath =
            "Assets/Game/Worlds/World01_MeadowWake/Collision/Source/Terrain_Collision_Master.fbx";

        [Serializable] private sealed class Layout
        {
            public int schemaVersion;
            public string id;
            public bool completionClaim;
            public Scope scope;
            public Spawn spawn;
            public GameplayObjects gameplayObjects;
        }

        [Serializable] private sealed class Scope { public float[] playableRangeMetres; }
        [Serializable] private sealed class Spawn { public Position unityPosition; }
        [Serializable] private sealed class Position { public float x; public float y; public float z; }
        [Serializable] private sealed class GameplayObjects { public Block[] blocks; public Enemy[] enemyAnchors; }
        [Serializable] private sealed class Block { public string id; public string type; public Position blenderCenter; public float width; public float height; }
        [Serializable] private sealed class Enemy { public string id; public string actorType; public Position blenderPosition; }

        [MenuItem("Hargold & Mebble/Meadow Wake/Rebuild Opening Slice")]
        public static void Rebuild()
        {
            string repositoryRoot = Path.GetFullPath(Path.Combine(Application.dataPath, "../../.."));
            string layoutPath = Path.Combine(repositoryRoot, "data/level-art/world-1/meadow-wake-opening-layout.json");
            if (!File.Exists(layoutPath))
            {
                throw new FileNotFoundException("Canonical Meadow Wake opening layout is missing.", layoutPath);
            }

            Layout layout = JsonUtility.FromJson<Layout>(File.ReadAllText(layoutPath));
            if (layout == null || layout.schemaVersion != 1 || layout.completionClaim)
            {
                throw new InvalidDataException("Opening layout schema/status is not safe to import.");
            }

            AssetDatabase.ImportAsset(CollisionFbxPath, ImportAssetOptions.ForceUpdate);
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            GameObject root = new GameObject("MW_Opening_VerticalSlice__DCC_VISIBLE_ART_NOT_AUTHORED");
            root.AddComponent<MWVerticalSliceStatus>();

            Transform art = Child(root.transform, "Art");
            Transform collision = Child(root.transform, "Collision");
            Transform gameplay = Child(root.transform, "GameplayAnchors");
            Transform lighting = Child(root.transform, "Lighting__URP_VALIDATION_REQUIRED");

            InstantiateCollisionMaster(collision);
            InstantiateVisibleMaster(art);
            BuildGameplayGuides(layout, gameplay);
            GameObject player = BuildTraversalProxy(layout, gameplay);
            BuildCamera(player.transform, root.transform);
            BuildLighting(lighting);
            ValidateTerrainSeparation();

            EditorSceneManager.SaveScene(scene, ScenePath);
            AssetDatabase.SaveAssets();
            Debug.Log("Meadow Wake opening handoff rebuilt with hidden frozen collision and an empty DCC visible-art target. No visible terrain FBX exists or is claimed.");
        }

        [MenuItem("Hargold & Mebble/Meadow Wake/Validate Terrain Separation")]
        public static void ValidateTerrainSeparation()
        {
            GameObject collision = GameObject.Find("Terrain_Collision_Master");
            GameObject visible = GameObject.Find("Terrain_Visible_Master__AUTHORED_DCC_ASSET_REQUIRED");
            if (collision == null || visible == null || collision == visible)
            {
                throw new InvalidDataException("Frozen collision or empty Meadow Wake DCC terrain target is missing.");
            }

            bool collisionRendererEnabled = false;
            foreach (Renderer renderer in collision.GetComponentsInChildren<Renderer>(true))
            {
                collisionRendererEnabled |= renderer.enabled;
            }
            MeshCollider[] collisionColliders = collision.GetComponentsInChildren<MeshCollider>(true);
            Collider[] visibleColliders = visible.GetComponentsInChildren<Collider>(true);
            Renderer[] visibleRenderers = visible.GetComponentsInChildren<Renderer>(true);
            MeshFilter[] visibleMeshFilters = visible.GetComponentsInChildren<MeshFilter>(true);

            var collisionMeshes = new HashSet<Mesh>();
            foreach (MeshFilter filter in collision.GetComponentsInChildren<MeshFilter>(true))
            {
                if (filter.sharedMesh != null) collisionMeshes.Add(filter.sharedMesh);
            }
            bool sharedMesh = false;
            foreach (MeshFilter filter in visible.GetComponentsInChildren<MeshFilter>(true))
            {
                sharedMesh |= filter.sharedMesh != null && collisionMeshes.Contains(filter.sharedMesh);
            }

            MWVerticalSliceStatus status = UnityEngine.Object.FindFirstObjectByType<MWVerticalSliceStatus>();
            if (status != null)
            {
                status.terrainMastersShareGeometry = sharedMesh;
                status.collisionRenderersEnabled = collisionRendererEnabled;
                status.visibleTerrainCollisionEnabled = visibleColliders.Length > 0;
                status.visibleTerrainMeshPresent = visibleRenderers.Length > 0 || visibleMeshFilters.Length > 0;
                EditorUtility.SetDirty(status);
            }

            if (collisionRendererEnabled || collisionColliders.Length == 0 || visibleColliders.Length > 0 ||
                visibleRenderers.Length > 0 || visibleMeshFilters.Length > 0 || sharedMesh)
            {
                throw new InvalidDataException(
                    $"Terrain separation failed: collisionRenderers={collisionRendererEnabled}, " +
                    $"collisionMeshColliders={collisionColliders.Length}, visibleColliders={visibleColliders.Length}, " +
                    $"visibleRenderers={visibleRenderers.Length}, visibleMeshes={visibleMeshFilters.Length}, sharedMesh={sharedMesh}");
            }
            Debug.Log("Meadow Wake terrain freeze passed: collision is hidden/physical and the DCC visible-art target is empty.");
        }

        private static Transform Child(Transform parent, string name)
        {
            GameObject child = new GameObject(name);
            child.transform.SetParent(parent, false);
            return child.transform;
        }

        private static GameObject InstantiateAsset(string assetPath, Transform parent, string instanceName)
        {
            GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(assetPath);
            if (prefab == null)
            {
                throw new FileNotFoundException($"Required Meadow Wake terrain asset is missing: {assetPath}");
            }
            GameObject instance = PrefabUtility.InstantiatePrefab(prefab, parent) as GameObject;
            if (instance == null)
            {
                throw new InvalidDataException($"Could not instantiate Meadow Wake terrain asset: {assetPath}");
            }
            instance.name = instanceName;
            instance.transform.SetLocalPositionAndRotation(Vector3.zero, Quaternion.identity);
            instance.transform.localScale = Vector3.one;
            return instance;
        }

        private static void InstantiateCollisionMaster(Transform parent)
        {
            GameObject instance = InstantiateAsset(CollisionFbxPath, parent, "Terrain_Collision_Master");
            foreach (Renderer renderer in instance.GetComponentsInChildren<Renderer>(true))
            {
                renderer.enabled = false;
            }
            foreach (MeshFilter filter in instance.GetComponentsInChildren<MeshFilter>(true))
            {
                MeshCollider collider = filter.GetComponent<MeshCollider>();
                if (collider == null)
                {
                    collider = filter.gameObject.AddComponent<MeshCollider>();
                }
                collider.sharedMesh = filter.sharedMesh;
            }
        }

        private static void InstantiateVisibleMaster(Transform parent)
        {
            GameObject target = new GameObject("Terrain_Visible_Master__AUTHORED_DCC_ASSET_REQUIRED");
            target.transform.SetParent(parent, false);
            target.transform.SetLocalPositionAndRotation(Vector3.zero, Quaternion.identity);
            target.transform.localScale = Vector3.one;
        }

        private static void BuildGameplayGuides(Layout layout, Transform parent)
        {
            foreach (Block block in layout.gameplayObjects?.blocks ?? Array.Empty<Block>())
            {
                GameObject marker = GameObject.CreatePrimitive(PrimitiveType.Cube);
                marker.name = $"ANCHOR_Block_{block.id}__{block.type}";
                marker.transform.SetParent(parent, false);
                marker.transform.position = new Vector3(block.blenderCenter.x, block.blenderCenter.z, 0f);
                marker.transform.localScale = new Vector3(block.width, block.height, 0.74f);
                UnityEngine.Object.DestroyImmediate(marker.GetComponent<Collider>());
                marker.GetComponent<Renderer>().enabled = false;
            }
            foreach (Enemy enemy in layout.gameplayObjects?.enemyAnchors ?? Array.Empty<Enemy>())
            {
                GameObject marker = new GameObject($"ANCHOR_Enemy_{enemy.id}__{enemy.actorType}");
                marker.transform.SetParent(parent, false);
                marker.transform.position = new Vector3(enemy.blenderPosition.x, enemy.blenderPosition.z, 0f);
            }
        }

        private static GameObject BuildTraversalProxy(Layout layout, Transform parent)
        {
            GameObject proxy = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            proxy.name = "TEMP_TraversalProxy__NOT_HARGOLD_OR_MEBBLE";
            proxy.transform.SetParent(parent, false);
            proxy.transform.position = new Vector3(layout.spawn.unityPosition.x, layout.spawn.unityPosition.y + 0.91f, 0f);
            UnityEngine.Object.DestroyImmediate(proxy.GetComponent<Collider>());
            proxy.GetComponent<Renderer>().enabled = false;
            CharacterController controller = proxy.AddComponent<CharacterController>();
            controller.height = 1.82f;
            controller.radius = 0.45f;
            controller.center = Vector3.zero;
            proxy.AddComponent<MWOpeningTraversalProxy>();
            return proxy;
        }

        private static void BuildCamera(Transform target, Transform parent)
        {
            GameObject cameraObject = new GameObject("MW_StrictSideCamera__VALIDATION_PROXY");
            cameraObject.transform.SetParent(parent, false);
            Camera camera = cameraObject.AddComponent<Camera>();
            camera.orthographic = true;
            camera.orthographicSize = 3.75f;
            camera.nearClipPlane = 0.1f;
            camera.farClipPlane = 100f;
            cameraObject.transform.position = new Vector3(target.position.x + 2.1f, target.position.y + 2.6f, -18f);
            cameraObject.AddComponent<MWOpeningSideCameraProxy>().Bind(target);
        }

        private static void BuildLighting(Transform parent)
        {
            GameObject sun = new GameObject("MW_Sun__PREVIEW_ONLY");
            sun.transform.SetParent(parent, false);
            Light light = sun.AddComponent<Light>();
            light.type = LightType.Directional;
            light.color = new Color(1f, 0.84f, 0.68f);
            light.intensity = 1.4f;
            sun.transform.rotation = Quaternion.Euler(38f, -28f, 0f);
        }
    }
}
