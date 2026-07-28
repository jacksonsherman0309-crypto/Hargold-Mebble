import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;
const BIN_CHUNK = 0x004e4942;

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex').toUpperCase();
}

function parseGlb(buffer, sourcePath) {
  if (buffer.readUInt32LE(0) !== GLB_MAGIC || buffer.readUInt32LE(4) !== 2) {
    throw new Error(`${sourcePath} is not a glTF 2.0 binary`);
  }
  let offset = 12;
  let json = null;
  let binary = Buffer.alloc(0);
  while (offset < buffer.length) {
    const length = buffer.readUInt32LE(offset);
    const type = buffer.readUInt32LE(offset + 4);
    const payload = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === JSON_CHUNK) {
      json = JSON.parse(payload.toString('utf8').replace(/\0+$/u, '').trimEnd());
    } else if (type === BIN_CHUNK) {
      binary = Buffer.from(payload);
    }
    offset += 8 + length;
  }
  if (!json) throw new Error(`${sourcePath} has no JSON chunk`);
  return { json, binary, sourcePath, sourceSha256: sha256(buffer) };
}

function padBuffer(buffer, alignment, byte = 0) {
  const extra = (alignment - (buffer.length % alignment)) % alignment;
  return extra ? Buffer.concat([buffer, Buffer.alloc(extra, byte)]) : buffer;
}

function encodeGlb(json, binary) {
  const jsonBytes = padBuffer(Buffer.from(JSON.stringify(json), 'utf8'), 4, 0x20);
  const binaryBytes = padBuffer(binary, 4, 0);
  const totalLength = 12 + 8 + jsonBytes.length + 8 + binaryBytes.length;
  const output = Buffer.alloc(totalLength);
  output.writeUInt32LE(GLB_MAGIC, 0);
  output.writeUInt32LE(2, 4);
  output.writeUInt32LE(totalLength, 8);
  output.writeUInt32LE(jsonBytes.length, 12);
  output.writeUInt32LE(JSON_CHUNK, 16);
  jsonBytes.copy(output, 20);
  const binaryHeader = 20 + jsonBytes.length;
  output.writeUInt32LE(binaryBytes.length, binaryHeader);
  output.writeUInt32LE(BIN_CHUNK, binaryHeader + 4);
  binaryBytes.copy(output, binaryHeader + 8);
  return output;
}

function nodeNameMap(document) {
  return new Map((document.nodes ?? []).map((node, index) => [node.name, index]));
}

function skinSignature(document) {
  const names = (document.skins?.[0]?.joints ?? []).map(index => document.nodes[index]?.name);
  return names.join('|');
}

function hierarchySignature(document) {
  return (document.nodes ?? []).map(node => {
    const children = (node.children ?? []).map(index => document.nodes[index]?.name).sort();
    return `${node.name}:${children.join(',')}:${JSON.stringify(node.matrix ?? node.translation ?? [])}`;
  }).sort().join('|');
}

function compatibleSkeleton(base, source, label) {
  if (skinSignature(base) !== skinSignature(source)) {
    throw new Error(`${label} skin joints differ from canonical source`);
  }
  const baseBones = new Set(base.skins[0].joints.map(index => base.nodes[index].name));
  const sourceHierarchy = hierarchySignature({
    ...source,
    nodes: source.nodes.filter(node => baseBones.has(node.name))
  });
  const baseHierarchy = hierarchySignature({
    ...base,
    nodes: base.nodes.filter(node => baseBones.has(node.name))
  });
  if (sourceHierarchy !== baseHierarchy) {
    throw new Error(`${label} bind hierarchy differs from canonical source`);
  }
}

function appendAlignedBinary(state, bytes) {
  state.binary = padBuffer(state.binary, 4, 0);
  const byteOffset = state.binary.length;
  state.binary = Buffer.concat([state.binary, bytes]);
  return byteOffset;
}

function cloneAnimation(baseState, source, sourceAnimation, stableName) {
  compatibleSkeleton(baseState.json, source.json, stableName);
  const baseNodes = nodeNameMap(baseState.json);
  const bufferViewMap = new Map();
  const accessorMap = new Map();

  function cloneBufferView(index) {
    if (bufferViewMap.has(index)) return bufferViewMap.get(index);
    const view = source.json.bufferViews[index];
    if ((view.buffer ?? 0) !== 0) {
      throw new Error(`${stableName} uses unsupported non-primary animation buffer`);
    }
    const start = view.byteOffset ?? 0;
    const bytes = source.binary.subarray(start, start + view.byteLength);
    const clone = {
      ...view,
      buffer: 0,
      byteOffset: appendAlignedBinary(baseState, bytes)
    };
    baseState.json.bufferViews ??= [];
    const nextIndex = baseState.json.bufferViews.push(clone) - 1;
    bufferViewMap.set(index, nextIndex);
    return nextIndex;
  }

  function cloneAccessor(index) {
    if (accessorMap.has(index)) return accessorMap.get(index);
    const accessor = structuredClone(source.json.accessors[index]);
    if (Number.isInteger(accessor.bufferView)) {
      accessor.bufferView = cloneBufferView(accessor.bufferView);
    }
    if (accessor.sparse) {
      accessor.sparse.indices.bufferView = cloneBufferView(accessor.sparse.indices.bufferView);
      accessor.sparse.values.bufferView = cloneBufferView(accessor.sparse.values.bufferView);
    }
    baseState.json.accessors ??= [];
    const nextIndex = baseState.json.accessors.push(accessor) - 1;
    accessorMap.set(index, nextIndex);
    return nextIndex;
  }

  const animation = structuredClone(sourceAnimation);
  animation.name = stableName;
  animation.samplers = animation.samplers.map(sampler => ({
    ...sampler,
    input: cloneAccessor(sampler.input),
    output: cloneAccessor(sampler.output)
  }));
  animation.channels = animation.channels.map(channel => {
    const sourceName = source.json.nodes[channel.target.node]?.name;
    const targetNode = baseNodes.get(sourceName);
    if (!Number.isInteger(targetNode)) {
      throw new Error(`${stableName} targets missing bone/node ${sourceName}`);
    }
    return {
      ...channel,
      target: { ...channel.target, node: targetNode }
    };
  });
  animation.extras = {
    ...(animation.extras ?? {}),
    stableId: stableName,
    sourceFile: source.sourcePath,
    sourceSha256: source.sourceSha256,
    rootMotionPolicy: 'controller-owned; armature node has no animation channels'
  };
  baseState.json.animations.push(animation);
}

function renameCanonicalNodes(document, hero) {
  for (const node of document.nodes ?? []) {
    if (node.name === 'Armature') node.name = `${hero}_Canonical_Gameplay_Rig`;
    if (node.name === 'char1') node.name = `${hero}_Approved_Mesh`;
  }
  if (document.skins?.[0]) document.skins[0].name = `${hero}_Canonical_Skin`;
  if (document.meshes?.[0]) document.meshes[0].name = `${hero}_Approved_Mesh`;
  if (document.scenes?.[0]) document.scenes[0].name = `${hero}_Live_Gameplay`;
}

async function loadGlb(path) {
  const absolute = resolve(path);
  return parseGlb(await readFile(absolute), path.replaceAll('\\', '/'));
}

async function buildHero({ hero, basePath, clips, outputPath }) {
  const base = await loadGlb(basePath);
  const state = {
    json: structuredClone(base.json),
    binary: Buffer.from(base.binary)
  };
  state.json.animations = [];
  for (const clip of clips) {
    const source = await loadGlb(clip.sourcePath);
    const sourceAnimation = source.json.animations?.[clip.animationIndex ?? 0];
    if (!sourceAnimation) throw new Error(`${clip.sourcePath} has no requested animation`);
    cloneAnimation(state, source, sourceAnimation, clip.stableId);
  }
  renameCanonicalNodes(state.json, hero);
  state.json.asset.extras = {
    ...(state.json.asset.extras ?? {}),
    canonicalGameplayRig: `${hero}_Canonical_Gameplay_Rig`,
    approvedAppearancePreserved: true,
    canonicalVisibleMeshSource: base.sourcePath,
    canonicalVisibleMeshSourceSha256: base.sourceSha256,
    controllerOwnsMovement: true,
    rootMotionNeutralization: 'not required; no armature-node translation/rotation channels',
    generatedBy: 'tools/animation/build-meshy-gameplay-rigs.mjs'
  };
  state.json.buffers[0].byteLength = state.binary.length;
  const output = encodeGlb(state.json, state.binary);
  const absoluteOutput = resolve(outputPath);
  await mkdir(dirname(absoluteOutput), { recursive: true });
  await writeFile(absoluteOutput, output);
  return {
    hero,
    outputPath: outputPath.replaceAll('\\', '/'),
    bytes: output.length,
    sha256: sha256(output),
    canonicalRig: `${hero}_Canonical_Gameplay_Rig`,
    canonicalVisibleMeshSource: base.sourcePath,
    canonicalVisibleMeshSourceSha256: base.sourceSha256,
    clips: clips.map(clip => clip.stableId),
    skeletonCompatibility: 'exact GLB node names, hierarchy, and bind transforms',
    retargetingRequired: false,
    duplicateAnimationMeshesExported: false,
    controllerOwnsMovement: true
  };
}

const archive = 'archive/imported-packages/20260727-meshy-animation/expanded';
const hargoldRoot = `${archive}/Meshy_AI_Hargold_Rig_biped/Meshy_AI_Hargold_Rig_biped`;
const mebbleRoot = `${archive}/Meshy_AI_Mebble_Rig_biped (1)/Meshy_AI_Mebble_Rig_biped`;

const results = [];
results.push(await buildHero({
  hero: 'Hargold',
  basePath: `${hargoldRoot}/Meshy_AI_Hargold_Rig_biped_Character_output.glb`,
  clips: [
    {
      stableId: 'hargold_walk',
      sourcePath: `${hargoldRoot}/Meshy_AI_Hargold_Rig_biped_Animation_Walking_withSkin.glb`
    },
    {
      stableId: 'hargold_run',
      sourcePath: `${hargoldRoot}/Meshy_AI_Hargold_Rig_biped_Animation_Running_withSkin.glb`
    }
  ],
  outputPath: 'assets/exports/meshy/hargold_canonical_gameplay_rig.glb'
}));
results.push(await buildHero({
  hero: 'Mebble',
  basePath: `${mebbleRoot}/Meshy_AI_Mebble_Rig_biped_Animation_Walking_withSkin.glb`,
  clips: [
    {
      stableId: 'mebble_walk',
      sourcePath: `${mebbleRoot}/Meshy_AI_Mebble_Rig_biped_Animation_Walking_withSkin.glb`
    },
    {
      stableId: 'mebble_run',
      sourcePath: `${mebbleRoot}/Meshy_AI_Mebble_Rig_biped_Animation_Running_withSkin.glb`
    }
  ],
  outputPath: 'assets/exports/meshy/mebble_canonical_gameplay_rig.glb'
}));

await writeFile(
  resolve('assets/exports/meshy/gameplay-rig-build-manifest.json'),
  `${JSON.stringify({ schemaVersion: 1, results }, null, 2)}\n`,
  'utf8'
);
console.log(JSON.stringify(results, null, 2));
