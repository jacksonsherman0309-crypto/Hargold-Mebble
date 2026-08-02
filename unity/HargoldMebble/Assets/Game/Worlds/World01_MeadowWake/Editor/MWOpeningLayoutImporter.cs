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
        private const string GuideFbxPath =
            "Assets/Game/Worlds/World01_MeadowWake/Art/Source/MW_Opening_BlockoutGuide.fbx";

        [Serializable] private sealed class Layout
        {
            public int schemaVersion;
            public string id;
            public bool completionClaim;
            public Scope scope;
            public Spawn spawn;
            public Terrain terrain;
            public GameplayObjects gameplayObjects;
        }

        [Serializable] private sealed class Scope { public float[] playableRangeMetres; }
        [Serializable] private sealed class Spawn { public Position unityPosition; }
        [Serializable] private sealed class Position { public float x; public float y; public float z; }
        [Serializable] private sealed class Terrain { public GroundPoint[] groundProfile; }
        [Serializable] private sealed class GroundPoint { public float x; public float blenderZ; }
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

            AssetDatabase.ImportAsset(GuideFbxPath, ImportAssetOptions.ForceUpdate);
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            GameObject root = new GameObject("MW_Opening_VerticalSlice__MANUAL_ART_REQUIRED");
            root.AddComponent<MWVerticalSliceStatus>();

            Transform art = Child(root.transform, "Art__SCULPT_RETOPO_UV_REQUIRED");
            Transform collision = Child(root.transform, "Collision");
            Transform gameplay = Child(root.transform, "GameplayAnchors");
            Transform lighting = Child(root.transform, "Lighting__URP_VALIDATION_REQUIRED");

            GameObject guidePrefab = AssetDatabase.LoadAssetAtPath<GameObject>(GuideFbxPath);
            if (guidePrefab != null)
            {
                GameObject instance = PrefabUtility.InstantiatePrefab(guidePrefab, art) as GameObject;
                if (instance != null)
                {
                    instance.name = "MW_Opening_BlockoutGuide__NOT_FINAL_ART";
                    instance.transform.SetLocalPositionAndRotation(Vector3.zero, Quaternion.identity);
                }
            }

            BuildCollision(layout, collision);
            BuildGameplayGuides(layout, gameplay);
            GameObject player = BuildTraversalProxy(layout, gameplay);
            BuildCamera(player.transform, root.transform);
            BuildLighting(lighting);

            EditorSceneManager.SaveScene(scene, ScenePath);
            AssetDatabase.SaveAssets();
            Debug.Log("Meadow Wake opening slice rebuilt from canonical layout. Manual art and Unity validation remain required.");
        }

        private static Transform Child(Transform parent, string name)
        {
            GameObject child = new GameObject(name);
            child.transform.SetParent(parent, false);
            return child.transform;
        }

        private static void BuildCollision(Layout layout, Transform parent)
        {
            if (layout.terrain?.groundProfile == null || layout.terrain.groundProfile.Length < 2)
            {
                throw new InvalidDataException("Ground profile is missing.");
            }

            const float halfDepth = 0.4f;
            GroundPoint[] points = layout.terrain.groundProfile;
            var vertices = new List<Vector3>();
            foreach (GroundPoint point in points)
            {
                vertices.Add(new Vector3(point.x, point.blenderZ, -halfDepth));
                vertices.Add(new Vector3(point.x, point.blenderZ, halfDepth));
            }

            var triangles = new List<int>();
            for (int i = 0; i < points.Length - 1; i++)
            {
                int left = i * 2;
                int right = (i + 1) * 2;
                AddQuad(triangles, left, right, right + 1, left + 1);
            }

            Mesh mesh = new Mesh { name = "MW_COL_OpeningProfile" };
            mesh.SetVertices(vertices);
            mesh.SetTriangles(triangles, 0);
            mesh.RecalculateNormals();
            GameObject collisionObject = new GameObject("MW_COL_OpeningProfile");
            collisionObject.transform.SetParent(parent, false);
            collisionObject.AddComponent<MeshFilter>().sharedMesh = mesh;
            collisionObject.AddComponent<MeshCollider>().sharedMesh = mesh;
        }

        private static void AddQuad(List<int> triangles, int a, int b, int c, int d)
        {
            triangles.Add(a); triangles.Add(b); triangles.Add(c);
            triangles.Add(a); triangles.Add(c); triangles.Add(d);
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
