import * as THREE from '../../vendor/three/three.module.js';
import {
  MEADOW_WAKE_GAMEPLAY_ROOMS,
  MEADOW_WAKE_TERRAIN_MODULES,
  MEADOW_WAKE_TERRAIN_POINTS,
  MEADOW_WAKE_PITS
} from '../content/meadow-wake-course.js';

// Visible-only, course-specific terrain. The collision course is never mutated.
// All albedo maps come from the project's texture kit, never the review image.
export const TERRAIN_FINISH_VERSION = 'living-bank-20260913-r3';
const S = 70;
const TAU = Math.PI * 2;
const clamp = THREE.MathUtils.clamp;
const mix = THREE.MathUtils.lerp;
const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const hash = n => { const a = Math.sin(n * 12.9898 + 4.1414) * 43758.5453; return a - Math.floor(a); };
const wave = x => Math.sin(x * 1.13) * 0.55 + Math.sin(x * 2.79 + 0.8) * 0.28 + Math.sin(x * 5.17 + 2) * 0.17;
const color = hex => new THREE.Color(hex);
const leafColors = [0x344e18, 0x526627, 0x60792b, 0x697e30, 0x3e5924].map(color);
const soilColors = [0x8c806c, 0x9f9179, 0x807766, 0x9a937e].map(color);

// Authored finish language per room; does not generate, move, or simplify rooms.
export const ROOM_FINISH = Object.freeze({
  'trailhead-camp':       { depth: 94, stone: 0.30, fern: 0.30, wet: 0.05 },
  'elder-root-walk':      { depth: 104, stone: 0.22, fern: 0.72, wet: 0.12 },
  'mason-shelf':          { depth: 109, stone: 0.74, fern: 0.30, wet: 0.06 },
  'shellback-quarry':     { depth: 116, stone: 0.84, fern: 0.24, wet: 0.08 },
  'timberyard-clearing':  { depth: 97, stone: 0.35, fern: 0.37, wet: 0.03 },
  'stump-creek-hollow':   { depth: 121, stone: 0.35, fern: 0.92, wet: 0.64 },
  'lantern-bridge':       { depth: 128, stone: 0.83, fern: 0.66, wet: 0.48 },
  'mill-meadow':          { depth: 99, stone: 0.49, fern: 0.68, wet: 0.42 },
  'root-terrace':         { depth: 111, stone: 0.31, fern: 0.88, wet: 0.28 },
  'lookout-ruins':        { depth: 116, stone: 0.82, fern: 0.48, wet: 0.10 },
  'flowering-run':        { depth: 91, stone: 0.40, fern: 0.25, wet: 0.04 },
  'three-gap-vista':      { depth: 120, stone: 0.67, fern: 0.40, wet: 0.06 }
});

export function terrainHeight(x) {
  if (x <= MEADOW_WAKE_TERRAIN_POINTS[0][0]) return MEADOW_WAKE_TERRAIN_POINTS[0][1];
  for (let i = 1; i < MEADOW_WAKE_TERRAIN_POINTS.length; i++) {
    const [a, h0] = MEADOW_WAKE_TERRAIN_POINTS[i - 1];
    const [b, h1] = MEADOW_WAKE_TERRAIN_POINTS[i];
    if (x <= b) return mix(h0, h1, (x - a) / (b - a));
  }
  return MEADOW_WAKE_TERRAIN_POINTS.at(-1)[1];
}

function depthAt(x) {
  let depth = ROOM_FINISH[MEADOW_WAKE_GAMEPLAY_ROOMS.at(-1).id].depth;
  for (let i = 0; i < MEADOW_WAKE_GAMEPLAY_ROOMS.length; i++) {
    const room = MEADOW_WAKE_GAMEPLAY_ROOMS[i];
    if (x <= room.range[1]) {
      const next = MEADOW_WAKE_GAMEPLAY_ROOMS[Math.min(i + 1, MEADOW_WAKE_GAMEPLAY_ROOMS.length - 1)];
      depth = mix(ROOM_FINISH[room.id].depth, ROOM_FINISH[next.id].depth,
        smooth((x - (room.range[1] - 1.25)) / 1.25));
      break;
    }
  }
  return depth + 10 * wave(x * 0.51);
}

class Batch {
  constructor() { this.p = []; this.uv = []; this.c = []; this.i = []; }
  vertex(x, y, z, u, v, tint) {
    const index = this.p.length / 3;
    this.p.push(x, y, z); this.uv.push(u, v); this.c.push(tint.r, tint.g, tint.b);
    return index;
  }
  triangle(a, b, c) { this.i.push(a, b, c); }
  quad(a, b, c, d) { this.i.push(a, b, c, b, d, c); }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setIndex(this.i); g.computeVertexNormals(); g.computeBoundingBox(); g.computeBoundingSphere();
    g.userData.collisionBearing = false;
    return g;
  }
}

function leaf(batch, x, y, z, length, width, angle, tint, bend = 1) {
  const sn = Math.sin(angle), cs = Math.cos(angle);
  const points = [[0, 0, 0], [-width * .47, length * .38, 0],
    [-width * .32, length * .70, bend * .3], [0, length, -bend * .25],
    [width * .32, length * .70, 0], [width * .47, length * .38, 0],
    [0, length * .48, bend]];
  const a = points.map(([px, py, pz], index) => batch.vertex(
    x + px * cs + py * sn, y + py * cs - px * sn, z + pz,
    .5 + px / Math.max(width, .1), py / length,
    tint.clone().multiplyScalar(index === 6 ? 1.19 : index === 1 || index === 2 ? .8 : 1)
  ));
  for (let n = 0; n < 6; n++) batch.triangle(a[n], a[(n + 1) % 6], a[6]);
}

function tube(batch, points, radius, tint) {
  const sides = 7, base = batch.p.length / 3;
  points.forEach((point, i) => {
    const prev = points[Math.max(0, i - 1)], next = points[Math.min(points.length - 1, i + 1)];
    const tangent = new THREE.Vector3(...next).sub(new THREE.Vector3(...prev)).normalize();
    const side = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();
    const up = new THREE.Vector3().crossVectors(tangent, side).normalize();
    const r = radius * Math.pow(1 - i / points.length, .85);
    for (let j = 0; j < sides; j++) {
      const a = j / sides * TAU;
      const p = new THREE.Vector3(...point).addScaledVector(side, Math.cos(a) * r).addScaledVector(up, Math.sin(a) * r);
      batch.vertex(p.x, p.y, p.z, j / sides, i * .25, tint);
    }
  });
  for (let i = 0; i < points.length - 1; i++) for (let j = 0; j < sides; j++) {
    const a = base + i * sides + j, b = base + i * sides + (j + 1) % sides;
    batch.quad(a, b, a + sides, b + sides);
  }
}

function insetAt(def, x, drop) {
  const from = def.visualFrom ?? def.from, to = def.visualTo ?? def.to;
  // Exposed edges roll under, away from the gap; the top remains at its anchor.
  const left = def.cliffLeft ? (1 - smooth((x - from) / .55)) : 0;
  const right = def.cliffRight ? (1 - smooth((to - x) / .55)) : 0;
  return (left - right) * Math.min(21, drop * .17);
}

function skin(batch, def, sceneHeight, rows, tintFor, textureWidth = 270) {
  const from = def.visualFrom ?? def.from, to = def.visualTo ?? def.to;
  const steps = Math.ceil((to - from) / .075), nrows = rows.length;
  for (let i = 0; i <= steps; i++) {
    const x = mix(from, to, i / steps), surface = sceneHeight / 2 - terrainHeight(x) * S;
    rows.forEach(([offset, z], j) => {
      const drop = typeof offset === 'function' ? offset(x) : offset;
      const depth = typeof z === 'function' ? z(x) : z;
      const px = x * S + insetAt(def, x, Math.max(0, drop));
      batch.vertex(px, surface - drop, depth, px / textureWidth, -drop / textureWidth,
        tintFor(x, j, drop));
    });
  }
  for (let i = 0; i < steps; i++) for (let j = 0; j < nrows - 1; j++) {
    const a = i * nrows + j;
    // Front-facing strip from back/top through shoulder to toe.
    batch.quad(a, a + 1, a + nrows, a + nrows + 1);
  }
  for (const [column, exposed] of [[0, def.cliffLeft], [steps, def.cliffRight]]) {
    if (!exposed) continue;
    const start = column * nrows;
    for (let j = 1; j < nrows - 1; j++) {
      if (column === 0) batch.triangle(start, start + j + 1, start + j);
      else batch.triangle(start, start + j, start + j + 1);
    }
  }
}

function rock(batch, x, y, z, rx, ry, rz, seed, grey) {
  // Rounded, irregular weathered cobbles: smooth bevels, not polygon debris.
  const rings = 7, sides = 14, base = batch.p.length / 3;
  const tint = (grey ? color(0xa6a08b) : soilColors[Math.floor(hash(seed + 4) * soilColors.length)]).clone();
  for (let r = 0; r <= rings; r++) {
    const phi = r / rings * Math.PI, ring = Math.pow(Math.sin(phi), .65);
    const pz = Math.sign(Math.cos(phi)) * Math.pow(Math.abs(Math.cos(phi)), .5);
    for (let s = 0; s <= sides; s++) {
      const a = s / sides * TAU;
      const contour = 1 + .075 * Math.sin(a * 3 + seed) + .045 * Math.cos(a * 5 + seed * 2);
      const px = Math.cos(a) * rx * ring * contour;
      const py = Math.sin(a) * ry * ring * contour;
      const moss = smooth((py / ry - .33) / .55) * (.45 + hash(seed + 6) * .35);
      const c = tint.clone().lerp(color(0x435b29), moss).multiplyScalar(.85 + .15 * Math.max(pz, 0));
      batch.vertex(x + px, y + py, z + pz * rz, .22 + (px / rx) * .055, .18 + (py / ry) * .07, c);
    }
  }
  for (let r = 0; r < rings; r++) for (let s = 0; s < sides; s++) {
    const a = base + r * (sides + 1) + s;
    batch.quad(a, a + sides + 1, a + 1, a + sides + 2);
  }
}

const PLANT_CROPS = [
  [74,316,359,468], [400,196,712,467], [770,118,1156,473], [1148,95,1460,468],
  [39,536,388,908], [380,648,717,903], [784,657,1156,905], [1148,745,1489,905]
];
function plant(batch, tile, x, y, z, width, height, angle, tint) {
  const [x0,y0,x1,y1] = PLANT_CROPS[tile], cs = Math.cos(angle), sn = Math.sin(angle);
  const u0=x0/1536, u1=x1/1536, v0=1-y1/1024, v1=1-y0/1024;
  const vertex=(px,py,u,v) => batch.vertex(x+px*cs-py*sn, y+px*sn+py*cs,z,u,v,tint);
  const a=vertex(-width/2,0,u0,v0), b=vertex(width/2,0,u1,v0);
  const c=vertex(-width/2,height,u0,v1), d=vertex(width/2,height,u1,v1);
  batch.quad(a,b,c,d);
}

export function buildLivingTerrainGeometry(def, sceneHeight) {
  const b = { earth: new Batch(), crown: new Batch(), lower: new Batch(), stone: new Batch(), foliage: new Batch(), roots: new Batch(), plants: new Batch() };
  const from = def.visualFrom ?? def.from, to = def.visualTo ?? def.to;
  const profile = ROOM_FINISH[def.roomId];
  if (!profile || !Number.isFinite(sceneHeight) || to <= from) throw new Error('Invalid Meadow Wake terrain profile');
  const crownDrop = x => 24 + 5 * wave(x * 1.6) + 3 * Math.sin(x * 7.3);
  const frontZ = x => 248 + 3 * wave(x * .9);
  const bankRows = [[17, -128], [18, 55], [22, x => frontZ(x) - 9],
    [x => crownDrop(x) + 8, x => frontZ(x) + 2], [x => depthAt(x) * .58, x => frontZ(x) + 7],
    [x => depthAt(x) * .85, x => frontZ(x) + 4], [x => depthAt(x), x => frontZ(x) - 3],
    [x => depthAt(x) + 14, 74], [x => depthAt(x) + 19, 4], [x => depthAt(x) + 5, -126]];
  skin(b.earth, def, sceneHeight, bankRows, (x, j, drop) => {
    const c = color(0xa9a99b).lerp(color(0x65705b), profile.wet * .4);
    const shade = j < 3 ? .45 : .48 + .35 * Math.sin(clamp((drop - 16) / depthAt(x), 0, 1) * Math.PI);
    return c.multiplyScalar(shade * (.92 + .08 * wave(x * .35)));
  });
  const turfRows = [[-21, -138], [-12, -86], [-3, -24], [-1.2, 0],
    [x => -2 - Math.sin(x * 4.1) * 1.2, 54], [2, 199], [7, x => frontZ(x) + 7],
    [x => crownDrop(x) * .56, x => frontZ(x) + 12], [crownDrop, x => frontZ(x) + 5],
    [x => crownDrop(x) + 5, x => frontZ(x) - 7]];
  skin(b.crown, def, sceneHeight, turfRows, (x, j) => color(j < 7 ? 0xb5c68c : 0x557035)
    .multiplyScalar(.88 + .1 * wave(x * .7)), 224);

  // Dense shadowed lower vegetation replaces the endless exposed dirt curtain.
  const lowerTop = x => depthAt(x) - 5 + 14 * wave(x * .49);
  skin(b.lower, def, sceneHeight, [[lowerTop, 264], [x => lowerTop(x) + 18, 293],
    [x => lowerTop(x) + 49, 316], [x => lowerTop(x) + 97, 337],
    [x => lowerTop(x) + 200, 354], [x => lowerTop(x) + 650, 360]],
    (x, j) => color(0x6b8150).multiplyScalar(mix(.84, .36, j / 5) * (1 + .12 * wave(x * .7))), 265);

  // Non-row cobbles, mostly embedded in the same curved bank, with mossed shoulders.
  for (let k = Math.ceil(from * S / 21); k * 21 < to * S; k++) {
    const seed = k * 7 + 311, x = (k * 21 + hash(seed) * 13) / S;
    if (x <= from + .18 || x >= to - .18) continue;
    const h = sceneHeight / 2 - terrainHeight(x) * S;
    for (let row = 0; row < 3; row++) {
      const d = 39 + row * 22 + hash(seed + row * 31) * 23;
      if (d > depthAt(x) - 7 || hash(seed + row * 71) > .54 + profile.stone * .36) continue;
      const rx = 13 + hash(seed + row * 17) * 14, ry = 9 + hash(seed + row * 19) * 10;
      const rseed = seed + row * 131;
      rock(b.stone, x * S + (row % 2 ? 8 : -5), h - d,
        frontZ(x) - 6, rx, ry, 17 + hash(rseed) * 6, rseed, hash(rseed + 7) < profile.stone);
    }
  }

  // A modeled carpet of broadleaf turf and hanging tendrils. Merge per module.
  for (let k = Math.ceil(from * S / 4); k * 4 < to * S - 2; k++) {
    const seed = k * 11, x = (k * 4 + hash(seed) * 3) / S;
    if (x >= to - .025) continue;
    const h = sceneHeight / 2 - terrainHeight(x) * S;
    const tint = leafColors[Math.floor(hash(seed + 7) * leafColors.length)];
    for (let j = 0; j < 3; j++) {
      const length = 3.5 + hash(seed + j * 23) * 5.5;
      const hanging = j !== 0, y = h + (hanging ? -8 - j * 5 - hash(seed + j) * 5 : 1);
      leaf(b.foliage, x * S, y, frontZ(x) + 15 + j * 1.5,
        length, length * (.32 + hash(seed + j * 9) * .23),
        hanging ? Math.PI + (hash(seed + j * 13) - .5) * 1.9 : (hash(seed + 3) - .5) * 2.1,
        tint.clone().multiplyScalar(hanging ? .69 + .1 * j : .82), 1.2);
    }
    // Fine grass blades originate behind the collision plane; the route stays readable.
    if (k % 2 === 0) for (let j = 0; j < 3; j++) leaf(b.foliage,
      x * S + j * 2, h + 2, 48 + j * 9, 6 + hash(seed + j * 29) * 9, 1.2,
      (hash(seed + j * 47) - .5) * 1.7, tint, .65);
  }

  for (let k = Math.ceil(from / .42); k * .42 < to - .18; k++) {
    const x = k * .42 + hash(k * 43) * .12;
    if (x > to - .12) continue;
    const h = sceneHeight / 2 - terrainHeight(x) * S;
    const length = 24 + hash(k * 31) * 29;
    const start = crownDrop(x) * .52, lean = (hash(k * 19) - .5) * 10;
    const points = [];
    for (let t = 0; t <= 5; t++) points.push([x * S + Math.sin(t * .52) * lean, h - start - t / 5 * length, frontZ(x) + 11]);
    tube(b.roots, points, .8, color(0x6b5935));
    for (let j = 1; j < 5; j++) for (const sign of [-1, 1]) leaf(b.foliage,
      points[j][0], points[j][1], points[j][2] + 2, 5 + hash(k + j * 13) * 5, 3.5,
      sign * (1.8 + j * .12), leafColors[(k + j + 5000) % leafColors.length].clone().multiplyScalar(.64), .8);
  }

  // Texture-kit vegetation is cut into alpha-tested cards, not a screenshot.
  // Overlapping, jittered patches make a continuous understory without rows.
  for (let k = Math.ceil(from * S / 19); k * 19 < to * S - 2; k++) {
    const seed = k * 29, x = (k * 19 + hash(seed) * 12) / S;
    if (x < from + .05 || x > to - .05) continue;
    const h = sceneHeight / 2 - terrainHeight(x) * S;
    plant(b.plants, 7, x * S, h - 15 - hash(seed + 1) * 6,
      frontZ(x) + 23, 22 + hash(seed + 2) * 13, 12 + hash(seed + 3) * 6,
      (hash(seed + 4) - .5) * .22, color(0x8b9b59));
    if (k % 3 === 0) plant(b.plants, hash(seed + 5) < .15 ? 6 : 0,
      x * S, h + 1, 60, 16 + hash(seed + 6) * 10, 9 + hash(seed + 7) * 9,
      (hash(seed + 8) - .5) * .4, color(0x9eab72));
    for (let layer = 0; layer < 6; layer++) {
      const sx = x * S + (hash(seed + layer * 51) - .5) * 17;
      const drop = lowerTop(x) + 16 + layer * 28 + (hash(seed + layer * 37) - .5) * 35;
      let width = 32 + hash(seed + layer * 7) * 33;
      if (def.cliffLeft) width = Math.min(width, 2 * (sx - from * S - 17));
      if (def.cliffRight) width = Math.min(width, 2 * (to * S - sx - 17));
      if (width < 7) continue;
      const type = hash(seed + layer * 43) < .10 + profile.fern * .24 ? 5 : 7;
      plant(b.plants, type, sx, h - drop, 330 + layer * 11,
        width, width * (type === 5 ? .76 : .46), (hash(seed + layer * 31) - .5) * .5,
        color(0x869e65).multiplyScalar(.79 - layer * .035));
      if (layer < 2 && hash(seed + layer * 19) < .18) plant(b.plants,
        profile.fern > .6 ? 5 : 1, sx, h - drop - 6, 339 + layer * 11,
        width * .7, width * .65, (hash(seed + 61) - .5) * .4,
        color(0x758951).multiplyScalar(.8));
    }
  }

  return Object.fromEntries(Object.entries(b).map(([key, batch]) => [key, batch.geometry()]));
}

// Terrain ledges share the bank finish while keeping the original platform
// roots, centers, widths, top heights and motion slots. Timber/rope props are not
// replaced. Static rock footings remain visual-only, behind the gameplay plane.
export function buildTerrainLedgeGeometry(def) {
  const b = { earth: new Batch(), crown: new Batch(), stone: new Batch(), plants: new Batch() };
  const width = def.width * S, top = def.height * S / 2;
  if (!(width > 0) || !Number.isFinite(top)) throw new Error('Invalid terrain ledge');
  const supported = !def.motion && ['ruin','boulder'].includes(def.supportStyle);
  const depth = supported ? Math.max(49, (terrainHeight(def.x) - def.y) * S + top + 17) : 44;
  const steps = Math.max(16, Math.ceil(width / 5));
  const rows = [[0,-72],[-1.2,0],[3,53],[14,70],[depth*.52,77],[depth*.89,67],[depth,30],[depth*.95,-62]];
  for (let i=0;i<=steps;i++) {
    const u=i/steps, x=(u-.5)*width;
    rows.forEach(([drop,z],j)=>{
      const inset=(1-smooth(Math.min(u,1-u)/.22))*Math.min(12,drop*.20)*Math.sign(-x);
      b.earth.vertex(x+inset,top-drop,z,u*width/230,-drop/230,color(0x9c9d87).multiplyScalar(j<3?.65:.82));
    });
    [[-3,-75],[-1.2,0],[2,57],[8,78],[17+Math.sin(u*9+def.x)*2,78],[20,62]].forEach(([drop,z],j)=>{
      b.crown.vertex(x,top-drop,z,u*width/175,-drop/175,color(j<4?0xa5b56b:0x536c31));
    });
  }
  for (const [name,n] of [['earth',8],['crown',6]]) {
    for(let i=0;i<steps;i++) for(let j=0;j<n-1;j++) {
      const a=i*n+j;b[name].quad(a,a+1,a+n,a+n+1);
    }
    for(const offset of [0,steps*n]) for(let j=1;j<n-1;j++) b[name].triangle(offset,offset+j,offset+j+1);
  }
  for(let row=0;row<Math.max(1,Math.floor((depth-15)/23));row++) {
    for(let x=-width/2+14;x<width/2-9;x+=23) {
      const seed=def.x*83+row*31+x, drop=28+row*23+hash(seed)*9;
      if(drop>depth-5) continue;
      rock(b.stone,x+(row%2?3:-2),top-drop,68,13+hash(seed+7)*4,10+hash(seed+3)*4,13,seed,true);
    }
  }
  for(let x=-width/2+9;x<width/2;x+=15) {
    const seed=def.x*17+x;
    plant(b.plants,7,x,top-13,85,19+hash(seed)*9,11+hash(seed+1)*4,(hash(seed+2)-.5)*.18,color(0x849653));
    if(Math.floor(x)%3===0) plant(b.plants,0,x,top,39,18,11,0,color(0x8c9c64));
    if(hash(seed+4)>.52) plant(b.plants,5,x,top-17,86,14,17,Math.PI+(hash(seed+9)-.5)*.5,color(0x576e38));
  }
  return Object.fromEntries(Object.entries(b).map(([key,batch])=>[key,batch.geometry()]));
}

function finishTerrainLedges(renderer, materials) {
  let count=0;
  for(const slot of renderer.platformSlots ?? []) {
    if(!['turf-ledge','root-ledge','ruin-ledge','creek-stone'].includes(slot.visual)) continue;
    count++;
    if(slot.livingTerrainVisual) continue;
    // Keep authored root braces. The rock/soil ledge and stone footing are terrain.
    for(const child of [...slot.root.children]) {
      if(!child.name.startsWith('grounded-platform-root-buttress')) child.removeFromParent();
    }
    const group=new THREE.Group();group.name=slot.id+'_living-terrain-ledge';
    group.userData={collisionBearing:false,platformId:slot.id};
    for(const [kind,geometry] of Object.entries(buildTerrainLedgeGeometry(slot))) {
      const mesh=new THREE.Mesh(geometry,materials[kind]);
      mesh.name='living-ledge-'+kind;mesh.receiveShadow=true;mesh.castShadow=kind!=='plants';
      group.add(mesh);
    }
    slot.root.add(group);slot.livingTerrainVisual=group;
  }
  return count;
}

function makeMaterials() {
  const standard = (hex, extra = {}) => new THREE.MeshStandardMaterial({
    color: hex, roughness: 1, metalness: 0, vertexColors: true, side: THREE.DoubleSide, ...extra
  });
  return {
    earth: standard(0xd6c3a0), crown: standard(0xc3cc95), lower: standard(0x69894b),
    stone: standard(0xe3d9bc), foliage: standard(0xa8b385), roots: standard(0xb9a782),
    plants: standard(0xb5c799, { alphaTest: .30, depthWrite: true })
  };
}

export function installMeadowWakeLivingTerrain(renderer) {
  const f = renderer?.foregroundArt, terrain = f?.terrainVisualRoot;
  if (!terrain || renderer.livingTerrain) return renderer.livingTerrain ?? null;
  const materials = makeMaterials();
  // Retire the layered experimental terrain rather than covering it with a photo.
  // Actor/scenery roots, platform slots, and all collision arrays remain untouched.
  for (const child of [...terrain.children]) child.removeFromParent();
  f.terrainDressingRoot?.removeFromParent();
  f.terrainDressingRoot = null;
  f.landformRoots = []; f.trailBandRoots = []; f.roomDressingRoots = []; f.terrainModuleRoots = [];
  const root = new THREE.Group(); root.name = 'MeadowWake_LivingTerrain';
  root.userData = { version: TERRAIN_FINISH_VERSION, collisionBearing: false, scope: 'terrain-only', referenceImagesInScene: false };
  terrain.add(root);
  for (const def of MEADOW_WAKE_TERRAIN_MODULES) {
    const group = new THREE.Group(); group.name = `${def.id}_living-bank`;
    group.userData = { roomId: def.roomId, authoredRange: [def.visualFrom ?? def.from, def.visualTo ?? def.to], collisionBearing: false };
    const geometries = buildLivingTerrainGeometry(def, renderer.height);
    for (const [kind, geometry] of Object.entries(geometries)) {
      const mesh = new THREE.Mesh(geometry, materials[kind]); mesh.name = `living-terrain-${kind}`;
      mesh.receiveShadow = kind !== 'foliage'; mesh.castShadow = kind === 'crown' || kind === 'stone';
      group.add(mesh);
    }
    root.add(group); f.terrainModuleRoots.push(group);
  }
  const state = {
    root, materials, texturesReady: false, ledgeCount: 0,
    bindTextures() {
      const soil = renderer.environmentArt.soilMaterial.map, turf = renderer.environmentArt.turfMaterial.map;
      const details = renderer.environmentArt.detailTextures ?? {};
      materials.plants.map = details.livingSurface;
      for (const kind of ['earth', 'stone']) {
        materials[kind].map = kind === 'stone' ? (details.ruinStone ?? soil) : soil;
        materials[kind].bumpMap = materials[kind].map;
        materials[kind].bumpScale = kind === 'earth' ? .8 : .38;
      }
      for (const kind of ['crown', 'lower']) {
        materials[kind].map = turf; materials[kind].bumpMap = turf; materials[kind].bumpScale = .42;
      }
      for (const material of Object.values(materials)) material.needsUpdate = true;
      this.texturesReady = Boolean(soil?.image && turf?.image && details.livingSurface?.image);
      this.publish();
    },
    finalize() {
      f.productionTerrainKitRoot?.removeFromParent(); f.productionTerrainKitRoot = null; f.roomFinishRoots = [];
      this.ledgeCount = finishTerrainLedges(renderer, materials);
      f.setDebugMode(f.debugMode); this.publish();
    },
    publish() {
      const report = { version: TERRAIN_FINISH_VERSION, texturesReady: this.texturesReady,
        moduleCount: root.children.length, ledgeCount: this.ledgeCount, roomCount: Object.keys(ROOM_FINISH).length,
        collisionBearing: false, referenceImagesInScene: false, legacyPassesActive: 0,
        terrainMeshCount: root.children.reduce((sum, group) => sum + group.children.length, 0),
        pitIntervals: MEADOW_WAKE_PITS.map(({ id, from, to }) => ({ id, from, to })) };
      if (typeof window !== 'undefined') window.__HM_TERRAIN_FINISH_QA__ = Object.freeze(report);
      return report;
    }
  };
  renderer.livingTerrain = state; state.publish(); return state;
}
