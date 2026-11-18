// The shared subject of BridgeClear: force colours, a tiny pin-jointed truss solver, and scenery.
// Blue = compression (squeezed), red = tension (stretched). Every chapter uses the same two colours.
import { THREE, M, box, clamp, lerp } from './kit.js';

export const COL = { c: 0x4ea3ff, t: 0xff5d5d, neutral: 0x8b92a5, deck: 0xcfd4de, stone: 0xb9ab94, steel: 0xaab2c0, water: 0x2f6fa8, warn: 0xffb547 };
const _a = new THREE.Color(), _b = new THREE.Color(), _n = new THREE.Color(COL.neutral);
// Force (positive = tension, negative = compression) as a colour: grey when idle, saturated at full.
export function forceColor(f, max, out = new THREE.Color()) {
  const k = clamp(Math.abs(f) / Math.max(1e-9, max), 0, 1);
  return out.copy(_n).lerp(_a.set(f >= 0 ? COL.t : COL.c), Math.pow(k, 0.7));
}
export const legend = '<span class="key c"></span>compression (squeezed) &nbsp; <span class="key t"></span>tension (stretched)';

// A material you can recolour per object.
export const forceMat = () => M.plastic(COL.neutral, { roughness: 0.4, metalness: 0.2, emissive: 0x000000 });
export function paint(mat, f, max) { forceColor(f, max, mat.color); mat.emissive.copy(mat.color).multiplyScalar(0.28); }

// The key light's shadow camera is sized for small models; widen it for a long bridge.
export function widenShadow(stage, r = 26) {
  const cam = stage.lights.children[1]?.shadow?.camera;
  if (cam) { Object.assign(cam, { left: -r, right: r, top: r, bottom: -r, far: 90 }); cam.updateProjectionMatrix(); }
}

// Ground: a river with banks, drawn as simple slabs. Returns the group.
export function river(width = 40, y = 0.55) {
  const g = new THREE.Group();
  const w = new THREE.Mesh(new THREE.PlaneGeometry(width, 14), new THREE.MeshStandardMaterial({ color: COL.water, transparent: true, opacity: 0.55, roughness: 0.2, metalness: 0.1, depthWrite: false }));
  w.rotation.x = -Math.PI / 2; w.position.y = y; g.add(w);
  return g;
}

// ---- Pin-jointed truss solver (2D, direct stiffness, every member EA = 1).
// nodes [[x,y]], members [[i,j]], fixed [[node, 'x'|'y'|'xy']], loads [[node, fx, fy]].
// Returns { N: member forces (+tension, -compression), u: node displacements } or null for a mechanism.
export function solveTruss(nodes, members, fixed, loads) {
  const n = nodes.length * 2, K = Array.from({ length: n }, () => new Float64Array(n)), F = new Float64Array(n);
  for (const [i, j] of members) {
    const dx = nodes[j][0] - nodes[i][0], dy = nodes[j][1] - nodes[i][1], L = Math.hypot(dx, dy), c = dx / L, s = dy / L, k = 1 / L;
    const d = [2 * i, 2 * i + 1, 2 * j, 2 * j + 1], v = [-c, -s, c, s];
    for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) K[d[a]][d[b]] += k * v[a] * v[b];
  }
  for (const [i, fx, fy] of loads) { F[2 * i] += fx; F[2 * i + 1] += fy; }
  const fixedDof = new Set();
  for (const [i, dir] of fixed) { if (dir.includes('x')) fixedDof.add(2 * i); if (dir.includes('y')) fixedDof.add(2 * i + 1); }
  const free = []; for (let d = 0; d < n; d++) if (!fixedDof.has(d)) free.push(d);
  const m = free.length, A = free.map((r) => free.map((c) => K[r][c])), b = free.map((r) => F[r]);
  for (let col = 0; col < m; col++) {
    let p = col; for (let r = col + 1; r < m; r++) if (Math.abs(A[r][col]) > Math.abs(A[p][col])) p = r;
    if (Math.abs(A[p][col]) < 1e-9) return null;
    [A[col], A[p]] = [A[p], A[col]]; [b[col], b[p]] = [b[p], b[col]];
    for (let r = col + 1; r < m; r++) { const f = A[r][col] / A[col][col]; if (!f) continue; for (let c = col; c < m; c++) A[r][c] -= f * A[col][c]; b[r] -= f * b[col]; }
  }
  const x = new Float64Array(m);
  for (let r = m - 1; r >= 0; r--) { let sum = b[r]; for (let c = r + 1; c < m; c++) sum -= A[r][c] * x[c]; x[r] = sum / A[r][r]; }
  const u = new Float64Array(n); free.forEach((d, i) => { u[d] = x[i]; });
  const N = members.map(([i, j]) => {
    const dx = nodes[j][0] - nodes[i][0], dy = nodes[j][1] - nodes[i][1], L = Math.hypot(dx, dy);
    return ((u[2 * j] - u[2 * i]) * dx + (u[2 * j + 1] - u[2 * i + 1]) * dy) / (L * L);
  });
  return { N, u };
}

// A small slab abutment/pier.
export function block(w, h, d, x, y, z = 0, mat = M.matte(COL.stone)) { const b = box(w, h, d, mat); b.position.set(x, y, z); return b; }
export { lerp };

// A thick polyline (LineSegments2). set(points [[x,y,z]], colours [[r,g,b]] per point) redraws it.
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
export function fatLine(stage, width = 4) {
  const mat = stage.lineMaterial({ linewidth: width, vertexColors: true, transparent: true, depthTest: false });
  const line = new LineSegments2(new LineSegmentsGeometry(), mat);
  line.renderOrder = 5;
  line.set = (pts, cols) => {
    const pos = [], col = [];
    for (let i = 0; i < pts.length - 1; i++) { pos.push(...pts[i], ...pts[i + 1]); col.push(...cols[i], ...cols[i + 1]); }
    line.geometry.setPositions(pos); line.geometry.setColors(col);
  };
  return line;
}
