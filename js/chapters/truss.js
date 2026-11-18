// Chapter 2: the truss. A frame of straight members joined at pins carries only tension and compression
// (no bending) when the load sits on the joints, and a triangle is the only polygon that cannot change shape
// without a member changing length. Forces come from the shared solver in bridge.js (method of joints in
// matrix form). Warren, Pratt and Howe differ in which diagonals are in tension and which in compression:
// a Pratt truss's diagonals slope down toward the centre and stretch; a Howe truss's slope the other way and
// squeeze. A rectangle of pins with no diagonals is a mechanism: it leans over like a parallelogram.
import { THREE, M, beam, sphere, arrow, clamp } from '../kit.js';
import { COL, paint, forceMat, legend, widenShadow, block, river, solveTruss } from '../bridge.js';

const N = 6, DX = 2, H = 2;
// Nodes b0..b6 along the bottom (x = 0..12). Top nodes depend on the type.
function layout(type) {
  const nodes = [], mem = [];
  const bot = (i) => i;
  for (let i = 0; i <= N; i++) nodes.push([i * DX, 0]);
  if (type === 'warren') {
    for (let i = 0; i < N; i++) nodes.push([i * DX + DX / 2, H]);               // t_i at index N+1+i
    const t = (i) => N + 1 + i;
    for (let i = 0; i < N; i++) mem.push([bot(i), bot(i + 1)]);
    for (let i = 0; i < N - 1; i++) mem.push([t(i), t(i + 1)]);
    for (let i = 0; i < N; i++) mem.push([bot(i), t(i)], [t(i), bot(i + 1)]);
  } else if (type === 'none') {
    for (let i = 0; i <= N; i++) nodes.push([i * DX, H]);                         // t_i at N+1+i
    const t = (i) => N + 1 + i;
    for (let i = 0; i < N; i++) mem.push([bot(i), bot(i + 1)], [t(i), t(i + 1)]);
    for (let i = 0; i <= N; i++) mem.push([bot(i), t(i)]);
  } else {
    for (let i = 1; i < N; i++) nodes.push([i * DX, H]);                          // t_i (i=1..5) at index N+i
    const t = (i) => N + i;
    for (let i = 0; i < N; i++) mem.push([bot(i), bot(i + 1)]);
    for (let i = 1; i < N - 1; i++) mem.push([t(i), t(i + 1)]);
    mem.push([bot(0), t(1)], [bot(N), t(N - 1)]);                                 // end posts
    for (let i = 1; i < N; i++) mem.push([bot(i), t(i)]);                         // verticals
    if (type === 'pratt') mem.push([t(1), bot(2)], [t(2), bot(3)], [t(N - 1), bot(N - 2)], [t(N - 2), bot(N - 3)]);
    else mem.push([bot(1), t(2)], [bot(2), t(3)], [bot(N - 1), t(N - 2)], [bot(N - 2), t(N - 3)]);
  }
  return { nodes, mem };
}
const TYPES = { warren: 'Warren', pratt: 'Pratt', howe: 'Howe', none: 'No diagonals' };
const SAY = {
  warren: 'Warren: diagonals alternate in a zigzag. Each one swaps between squeeze and stretch as the load moves.',
  pratt: 'Pratt: the long diagonals slope toward the centre and are stretched, the short uprights are squeezed. Good for iron and steel.',
  howe: 'Howe: the diagonals slope the other way and are squeezed, the uprights stretched. Natural for timber with iron rods.',
  none: 'No diagonals: just a rectangle of pins. Nothing resists leaning, so it folds over.',
};

export default {
  id: 'truss',
  short: 'Why triangles',
  title: 'Beams, trusses and why triangles',
  subtitle: 'A frame of thin members that only squeeze or stretch.',
  view: { pos: [6, 5, 17], target: [6, 1.2, 0] },
  learn: `<p>A solid beam wastes most of its material, because its middle hardly works. A <b>truss</b> keeps only the working parts. The top chord is squeezed, the bottom chord is stretched, and a lattice of diagonals links them. Every member is a straight stick that is either squeezed or stretched. Nothing bends.</p>
    <p>Why triangles? Pin four sticks into a square and you can push it into a parallelogram without changing any length. Pin three into a triangle and you cannot: it only changes shape if a stick gets longer or shorter. A <b>rigid</b> frame is built from triangles. Truss bridges were the workhorse of the railway age for exactly this reason.</p>
    <p class="tip"><b>Try it:</b> slide the load along the bottom and watch the diagonals swap colour. Switch to <b>No diagonals</b> and see the frame lean over. Click any member to read its force.</p>`,
  terms: [
    { t: 'Truss', d: 'A rigid frame of straight members joined at their ends, built from triangles.' },
    { t: 'Chord', d: 'The top or bottom edge of a truss. Under a downward load the top is squeezed and the bottom stretched.' },
    { t: 'Member', d: 'One straight part of a truss. It is only ever squeezed or stretched along its length.' },
    { t: 'Joint', d: 'A node where members meet. Forces balance at every joint.' },
    { t: 'Mechanism', d: 'A frame that can change shape without any part changing length, so it cannot carry load.' },
  ],
  defaults: { type: 'warren', at: 0.5, load: 1 },
  controls: [
    { key: 'type', type: 'seg', label: 'Frame', options: Object.entries(TYPES).map(([v, label]) => ({ v, label })) },
    { key: 'at', type: 'range', label: 'Load position', min: 0, max: 1, step: 0.005, fmt: (v) => `${Math.round(v * 100)}% across` },
    { key: 'load', type: 'range', label: 'Load', min: 0.2, max: 2, step: 0.05, fmt: (v) => v.toFixed(1) + ' units' },
    { key: 'go', type: 'buttons', label: 'Drive a load across', items: [{ label: 'Drive across', act: (s, inst) => inst.drive?.() }] },
  ],
  quiz: [
    { q: 'Why is a triangle the key shape in a truss?', options: ['It looks strong', 'It cannot change shape unless a side changes length', 'It uses the least steel', 'It is easy to paint'], answer: 1, why: 'A square can lean into a parallelogram without any side changing. A triangle cannot, so it is rigid.' },
    { q: 'In a simple truss under a downward load, the top chord is…', options: ['Stretched', 'Squeezed', 'Unloaded', 'Bent in half'], answer: 1, why: 'Like the top of a beam, the top chord is squeezed and the bottom chord is stretched.' },
    { q: 'What happens to a diagonal when the load moves across the truss?', options: ['It stays the same', 'It can switch between squeeze and stretch', 'It always snaps', 'It turns into a chord'], answer: 1, why: 'A moving load changes how the shear is shared. Some diagonals reverse, which is why engineers check every position.' },
  ],
  reel: [
    { ms: 5000, caption: 'A truss is triangles, so it never leans. Take them away and the frame folds.', set: { type: 'none', at: 0.5, load: 1.5 }, anim: { load: [0.1, 1.8] }, view: { pos: [6, 4, 15], target: [6, 1.2, 0] }, spin: 0 },
  ],
  build({ stage, s }) {
    widenShadow(stage, 18);
    const root = new THREE.Group(); stage.root.add(root);
    root.add(river(36));
    const baseY = 2.4;
    const group = new THREE.Group(); group.position.y = baseY; root.add(group);
    root.add(block(2.2, 2.4, 3, -1.3, 1.2, 0), block(2.2, 2.4, 3, 13.3, 1.2, 0));
    let type = null, members = [], pins = [], mats = [], pairs = [], sel = -1, driveDir = 0;
    const cart = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 1.0), M.plastic(COL.warn, { emissive: 0x553300 })); body.position.y = 0.25; cart.add(body);
    const arr = arrow(COL.warn, 1, 0.3, 0.07); arr.rotation.z = Math.PI; cart.add(arr);
    group.add(cart);
    let lastSolve = null, key = '', maxF = 1;

    function rebuild(t) {
      type = t;
      members.forEach((m) => { group.remove(m); m.geometry.dispose(); m.material.dispose(); }); pins.forEach((p) => { group.remove(p); p.geometry.dispose(); });
      members = []; pins = []; mats = [];
      const { nodes, mem } = layout(t); pairs = mem; group.userData.nodes = nodes;
      for (const [i, j] of mem) {
        const mt = forceMat(); mats.push(mt);
        const b = beam([nodes[i][0], nodes[i][1], 0], [nodes[j][0], nodes[j][1], 0], 0.09, mt); b.userData.k = members.length; members.push(b); group.add(b);
      }
      nodes.forEach(([x, y]) => { const p = sphere(0.16, M.metal(0xdfe3ea)); p.position.set(x, y, 0); group.add(p); pins.push(p); });
      stage.pickables = members;
      key = ''; sel = -1;
    }
    stage.onPick = null;

    function loads(st, nodes) {
      const pos = st.at * N, i = Math.min(N - 1, Math.floor(pos)), f = pos - i;
      return [[i, 0, -st.load * (1 - f)], [i + 1, 0, -st.load * f]];
    }
    function solve(st) {
      const { nodes, mem } = layout(type);
      return solveTruss(nodes, mem, [[0, 'xy'], [N, 'y']], loads(st, nodes));
    }

    return {
      update(dt, st) {
        if (type !== st.type) rebuild(st.type);
        if (driveDir) { st.at = clamp(st.at + driveDir * dt * 0.14, 0, 1); if (st.at >= 1) driveDir = -1; if (st.at <= 0) driveDir = 1; }
        const nodes = group.userData.nodes, res = solve(st);
        let disp = nodes.map((n) => [n[0], n[1]]);
        if (res) {
          maxF = Math.max(0.5, ...res.N.map(Math.abs));
          const mu = Math.max(1e-6, ...Array.from(res.u).map(Math.abs));
          const k = 0.35 / mu * Math.min(1, st.load);
          disp = nodes.map((n, i) => [n[0] + res.u[2 * i] * k, n[1] + res.u[2 * i + 1] * k]);
        } else {
          // mechanism: the whole frame leans over (racking) in proportion to the load
          const g = 0.35 + 0.9 * Math.min(1, st.load / 1.6);
          disp = nodes.map((n) => [n[0] + n[1] * g, n[1] * Math.cos(g * 0.8)]);
        }
        pairs.forEach(([i, j], k) => {
          const a = disp[i], b = disp[j], m = members[k];
          const A = new THREE.Vector3(a[0], a[1], 0), B = new THREE.Vector3(b[0], b[1], 0);
          m.position.copy(A).add(B).multiplyScalar(0.5);
          m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
          m.scale.y = A.distanceTo(B) / m.geometry.parameters.height;
          if (res) paint(mats[k], res.N[k], maxF); else { mats[k].color.setHex(COL.neutral); mats[k].emissive.setHex(0); }
          mats[k].emissiveIntensity = k === sel ? 2.5 : 1;
          if (k === sel) { mats[k].emissive.setHex(0xffffff); mats[k].emissive.multiplyScalar(0.25); }
        });
        pins.forEach((p, i) => p.position.set(disp[i][0], disp[i][1], 0));
        // cart rides the bottom chord at the load position
        const pos = st.at * N, i0 = Math.min(N - 1, Math.floor(pos)), f = pos - i0;
        const cx = disp[i0][0] + (disp[i0 + 1][0] - disp[i0][0]) * f, cy = disp[i0][1] + (disp[i0 + 1][1] - disp[i0][1]) * f;
        cart.position.set(cx, cy + 0.2, 0); arr.set(0.6 + st.load * 0.5); arr.position.y = 0.9 + st.load * 0.5;
        lastSolve = res;
      },
      pick(o) { if (o.userData.k !== undefined) sel = sel === o.userData.k ? -1 : o.userData.k; },
      drive() { driveDir = driveDir ? 0 : 1; if (driveDir) s.at = 0; },
      dispose() { driveDir = 0; },
      readout(st) {
        if (!lastSolve && st.type !== 'none') return '';
        if (!lastSolve) return `<div class="big">Collapsing</div><p class="r-say">${SAY.none}</p>`;
        const Ns = lastSolve.N, mx = Math.max(...Ns), mn = Math.min(...Ns);
        const selRow = sel >= 0 ? `<div class="row"><span>Selected member</span><b>${Math.abs(Ns[sel]).toFixed(2)} ${Ns[sel] >= 0 ? 'tension' : 'compression'}</b></div>` : '';
        return `<div class="big">${TYPES[st.type]} truss</div><p class="r-say">${SAY[st.type]}</p><p class="r-say">${legend}</p>
          <div class="row"><span>Most stretched</span><b>${mx.toFixed(2)}</b></div>
          <div class="row"><span>Most squeezed</span><b>${Math.abs(mn).toFixed(2)}</b></div>${selRow}`;
      },
    };
  },
};
