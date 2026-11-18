// Chapter 3: the arch. A masonry arch stands if a line of thrust (the path the pushes take through the
// stones) can run inside the ring. For vertical loads w_i at x_i on a span 2c, the line height is
// y(x) = M0(x) / H, where M0 is the bending moment of the same loads on a simple beam and H is the horizontal
// thrust, which is the same everywhere. Joints open (hinges form) wherever y leaves the ring. This is the
// lower-bound "safe theorem" of masonry (Heyman, 1966): any line that fits means the arch stands.
// H runs from H_min (line touches the extrados at the crown) to H_max (line touches the intrados), and it
// settles within that range depending on how far the abutments move. Shallow arches need more thrust:
// for a uniform load w, H = w L² / (8 rise). Stone is taken as weightless in tension and infinitely strong
// in compression; there is no spandrel fill. Weights are relative to the arch's own weight.
import { THREE, M, arrow, clamp, approach } from '../kit.js';
import { COL, paint, legend, widenShadow, block, river, fatLine } from '../bridge.js';

const C = 4, NB = 21, DEPTH = 2.2, NS = 160;

function geom(rise, t) {
  const R = (C * C + rise * rise) / (2 * rise), cy = rise - R, a = Math.asin(Math.min(1, C / R)), RI = R - t / 2, RE = R + t / 2;
  return { R, cy, a, RI, RE, rise, t };
}
const yE = (g, x) => (Math.abs(x) < g.RE ? g.cy + Math.sqrt(g.RE * g.RE - x * x) : -Infinity);
const yI = (g, x) => (Math.abs(x) < g.RI ? g.cy + Math.sqrt(g.RI * g.RI - x * x) : -Infinity);

function blocksOf(g) {
  const out = [];
  for (let k = 0; k < NB; k++) {
    const t0 = -g.a + (2 * g.a * k) / NB + 0.004, t1 = -g.a + (2 * g.a * (k + 1)) / NB - 0.004;
    const P = [[g.RI, t0], [g.RE, t0], [g.RE, t1], [g.RI, t1]].map(([r, th]) => [r * Math.sin(th), g.cy + r * Math.cos(th)]);
    let area = 0; for (let i = 0; i < 4; i++) { const [x1, y1] = P[i], [x2, y2] = P[(i + 1) % 4]; area += x1 * y2 - x2 * y1; }
    const mid = (t0 + t1) / 2, rm = g.R;
    out.push({ P, area: Math.abs(area) / 2, cx: rm * Math.sin(mid), th: mid });
  }
  return out;
}
const MAXH = 3;

export default {
  id: 'arch',
  short: 'The arch',
  title: 'The arch: a curve that turns weight into squeeze',
  subtitle: 'A line of thrust, a keystone, and abutments that push back.',
  view: { pos: [2, 3.4, 12], target: [0, 1.8, 0] },
  learn: `<p>An arch avoids bending altogether. Its curve turns almost every force into <b>compression</b>, which stone and brick are very good at and which they can bear without any glue. Each stone leans on its neighbours, and the whole ring leans on the ground at each end.</p>
    <p>Follow the path of the pushing force through the stones and you get the <b>line of thrust</b>. While that line stays inside the ring, the arch stands, even if every joint is dry. If it escapes, a joint opens like a hinge. Four hinges make a collapsing mechanism. The line has a sideways part, the <b>thrust</b>, which the <b>abutments</b> must resist. A shallow arch pushes outward much harder than a tall one. The top stone, the <b>keystone</b>, is no more special than its neighbours: the whole ring is what counts.</p>
    <p class="tip"><b>Try it:</b> make the ring thinner, or heavier loaded, until the line leaves the ring and the hinges light up. Then move the abutments apart and watch the crown sink.</p>
    <p class="note">A teaching model: a single stone ring with no fill above it, in relative weights.</p>`,
  terms: [
    { t: 'Line of thrust', d: 'The path the squeezing force takes through the stones. The arch stands while it stays inside the ring.' },
    { t: 'Keystone', d: 'The top stone at the crown, which locks the arch once placed.' },
    { t: 'Abutment', d: 'The solid support at each end that resists the arch’s sideways thrust.' },
    { t: 'Thrust', d: 'The horizontal push an arch puts on its abutments. Shallow arches push harder.' },
    { t: 'Voussoir', d: 'One wedge-shaped stone of the ring.' },
  ],
  defaults: { rise: 0.3, thick: 0.7, load: 0.3, at: -1.6, spread: 0.45 },
  controls: [
    { key: 'rise', type: 'range', label: 'Rise (height of the curve)', min: 0.14, max: 0.5, step: 0.005, fmt: (v) => `${Math.round(v * 100)}% of span` },
    { key: 'thick', type: 'range', label: 'Thickness of the ring', min: 0.12, max: 1.1, step: 0.01, fmt: (v) => `${(v / 8 * 100).toFixed(1)}% of span` },
    { key: 'load', type: 'range', label: 'Extra weight on top', min: 0, max: 2, step: 0.02, fmt: (v) => `${Math.round(v * 100)}% of the arch’s weight` },
    { key: 'at', type: 'range', label: 'Where the weight sits', min: -3.4, max: 3.4, step: 0.05, fmt: (v) => (Math.abs(v) < 0.2 ? 'at the crown' : v < 0 ? 'left of centre' : 'right of centre') },
    { key: 'spread', type: 'range', label: 'Abutments', min: 0, max: 1.25, step: 0.005, fmt: (v) => (v < 0.2 ? 'squeezed together' : v < 0.8 ? 'firm' : v <= 1.0 ? 'giving way' : 'spread apart'), hint: 'Moving the supports apart lowers the thrust until the arch fails.' },
  ],
  quiz: [
    { q: 'What kind of force does an arch turn most loads into?', options: ['Tension', 'Compression', 'Twisting', 'Bending'], answer: 1, why: 'The curve guides the load along the ring, squeezing the stones together. Stone is strong that way.' },
    { q: 'You flatten an arch while keeping the same span. What happens to the thrust on the abutments?', options: ['It falls', 'It stays the same', 'It rises', 'It becomes tension'], answer: 2, why: 'Thrust goes as 1 over the rise, so shallower arches push outward harder.' },
    { q: 'When does a masonry arch stand?', options: ['When the keystone is the biggest stone', 'When a line of thrust fits entirely inside the ring', 'When it is held with cement', 'When the abutments are wet'], answer: 1, why: 'If a possible line of thrust fits inside the ring, the arch is stable, mortar or not.' },
  ],
  reel: [
    { ms: 5200, caption: 'An arch turns weight into a squeeze that runs through every stone.', set: { rise: 0.3, thick: 0.7, load: 0, at: 0, spread: 0.45 }, anim: { load: [0, 1.0] }, view: { pos: [2, 3.4, 12], target: [0, 1.8, 0] }, spin: 0 },
    { ms: 5000, caption: 'Spread the abutments and the line of thrust escapes. Hinges form and it falls.', set: { rise: 0.3, thick: 0.8, load: 0.3, at: -1.6, spread: 0.6 }, anim: { spread: [0.6, 1.25] }, view: { pos: [2, 3.4, 12], target: [0, 1.8, 0] }, spin: 0 },
  ],
  build({ stage, s }) {
    widenShadow(stage, 16);
    const root = new THREE.Group(); stage.root.add(root);
    root.add(river(30, -1.3));
    const abL = block(3, 2.6, 3, -C - 1.5 + 0.2, -0.9, 0), abR = block(3, 2.6, 3, C + 1.5 - 0.2, -0.9, 0);
    root.add(abL, abR);
    const archG = new THREE.Group(); root.add(archG);
    let g = null, bl = [], meshes = [], mats = [], gkey = '';
    const thr = fatLine(stage, 6); root.add(thr);
    const hingeMats = new THREE.MeshBasicMaterial({ color: COL.warn, toneMapped: false });
    const hinges = [];
    for (let i = 0; i < 6; i++) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), hingeMats); h.visible = false; root.add(h); hinges.push(h); }
    const loadMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, DEPTH), M.plastic(COL.warn, { emissive: 0x442600 })); root.add(loadMesh);
    const hArr = [arrow(COL.c, 1, 0.3, 0.07), arrow(COL.c, 1, 0.3, 0.07)]; hArr[0].rotation.z = Math.PI / 2; hArr[1].rotation.z = -Math.PI / 2; root.add(...hArr);
    const lblKey = stage.label('Keystone', [0, 4, 0], root, 'hot');
    stage.label('Abutment', [-C - 1.3, -2.4, 0], root);
    stage.label('Line of thrust', [-C + 0.6, 0.15, DEPTH / 2], root);
    let sag = 0, info = { H: 0, Hmin: 0, Hmax: 0, ok: true, maxV: 0, Wt: 1 };

    function rebuildBlocks(gg) {
      meshes.forEach((m) => { archG.remove(m); m.geometry.dispose(); m.material.dispose(); });
      g = gg; bl = blocksOf(g); meshes = []; mats = [];
      bl.forEach((b, k) => {
        const sh = new THREE.Shape(b.P.map(([x, y]) => new THREE.Vector2(x, y)));
        const geo = new THREE.ExtrudeGeometry(sh, { depth: DEPTH, bevelEnabled: false }); geo.translate(0, 0, -DEPTH / 2);
        const mt = M.matte(COL.stone, { roughness: 0.9 }); mats.push(mt);
        const m = new THREE.Mesh(geo, mt); m.castShadow = m.receiveShadow = true; m.userData.k = k; archG.add(m); meshes.push(m);
      });
      const wsum = bl.reduce((a, b) => a + b.area, 0); bl.forEach((b) => { b.w = b.area / wsum; }); // arch weighs 1
    }

    function analyse(st) {
      const loads = bl.map((b) => ({ x: b.cx, w: b.w }));
      if (st.load > 0.001) loads.push({ x: st.at, w: st.load });
      const Wt = loads.reduce((a, l) => a + l.w, 0);
      const Va = loads.reduce((a, l) => a + l.w * (C - l.x), 0) / (2 * C);
      const M0 = (x) => Va * (x + C) - loads.reduce((a, l) => a + (l.x < x ? l.w * (x - l.x) : 0), 0);
      let Hmin = 1e-6, Hmax = Infinity;
      for (let i = 1; i < NS; i++) {
        const x = -C + (2 * C * i) / NS, m = M0(x), e = yE(g, x), n = yI(g, x);
        if (e > 1e-4 && m > 0) Hmin = Math.max(Hmin, m / e);
        if (n > 1e-3 && m > 1e-6) Hmax = Math.min(Hmax, m / n);
      }
      const fits = Hmin <= Hmax * 1.0001;
      let H;
      const v = st.spread;
      if (fits) H = v <= 1 ? Hmax - (Hmax - Hmin) * v : Hmin * Math.max(0.15, 1 - (v - 1) * 1.8);
      else H = (Hmin + (Number.isFinite(Hmax) ? Hmax : Hmin)) / 2 * (v > 1 ? Math.max(0.15, 1 - (v - 1) * 1.8) : 1);
      if (!Number.isFinite(H)) H = Hmin;
      return { loads, Wt, Va, M0, Hmin, Hmax, H, fits };
    }

    return {
      update(dt, st) {
        const key = `${st.rise.toFixed(3)}|${st.thick.toFixed(3)}`;
        if (key !== gkey) { gkey = key; rebuildBlocks(geom(st.rise * 2 * C, st.thick)); }
        const a = analyse(st), { H, M0 } = a;
        // line of thrust and violations
        const pts = [], cols = []; let maxV = 0, worst = [];
        for (let i = 0; i <= NS; i++) {
          const x = -C + (2 * C * i) / NS, y = M0(x) / H, e = yE(g, x), n = yI(g, x);
          const above = i > 0 && i < NS ? y - e : 0, below = i > 0 && i < NS && n > 0 ? n - y : 0, viol = Math.max(above, below, 0);
          maxV = Math.max(maxV, viol);
          if (viol > 0.005) worst.push({ x, y, viol });
          pts.push([x, y, DEPTH / 2 + 0.03]); cols.push(viol > 0.005 ? [1, 0.45, 0.2] : [0.25, 1, 0.5]);
        }
        const target = clamp(maxV / 0.5, 0, 1);
        sag = approach(sag, target > 0.02 ? target : 0, 3.5, dt);
        // block positions: crown sags, flanks swing out when hinges form
        meshes.forEach((m, k) => {
          const u = bl[k].th / g.a, f = 1 - u * u;
          m.position.set(Math.sign(u) * 0.5 * sag * (1 - f), -sag * 1.6 * f, 0);
          m.rotation.z = -u * sag * 0.12;
          const thrust = Math.hypot(H, a.Va - bl.slice(0, k).reduce((q, b) => q + b.w, 0) - (st.load > 0 && st.at < bl[k].cx ? st.load : 0));
          paint(mats[k], -thrust, MAXH * 0.9);
          if (k === (NB - 1) / 2) { mats[k].color.lerp(new THREE.Color(0xffe08a), 0.55); }
        });
        const dy = (x) => { const u = x / C; return -sag * 1.6 * (1 - u * u); };
        thr.set(pts.map(([x, y, z]) => [x, y + dy(x), z]), cols);
        // hinge markers at the worst spots, grouped
        hinges.forEach((h) => { h.visible = false; });
        const spots = [];
        for (const w of worst.sort((p, q) => q.viol - p.viol)) if (spots.every((s2) => Math.abs(s2.x - w.x) > 1.3) && spots.length < 4) spots.push(w);
        spots.forEach((w, i) => { const h = hinges[i]; h.visible = true; h.position.set(w.x, (w.y > yE(g, w.x) ? yE(g, w.x) : yI(g, w.x)) + dy(w.x), DEPTH / 2 + 0.05); });
        // load block
        const topY = (x) => yE(g, clamp(x, -g.RE + 0.01, g.RE - 0.01)) + dy(x);
        loadMesh.visible = st.load > 0.001;
        const lw = 0.5 + st.load * 0.5; loadMesh.scale.set(lw, 0.3 + st.load * 0.7, 1);
        loadMesh.position.set(st.at, topY(st.at) + (0.3 + st.load * 0.7) / 2, 0);
        // thrust arrows
        const hl = clamp((H / MAXH) * 2.6 + 0.2, 0.2, 3.4);
        hArr[0].set(hl); hArr[1].set(hl);
        hArr[0].position.set(-C - 0.1, -0.1, 0); hArr[1].position.set(C + 0.1, -0.1, 0);
        hArr[0].rotation.z = -Math.PI / 2; hArr[1].rotation.z = Math.PI / 2;
        hArr[0].position.x = -C - 0.1 + 0; hArr[1].position.x = C + 0.1;
        lblKey.position.set(0, yE(g, 0) + 0.8 + dy(0), 0);
        info = { H, Hmin: a.Hmin, Hmax: a.Hmax, ok: maxV <= 0.005, maxV, Wt: a.Wt, fits: a.fits, sag };
      },
      dispose() {},
      readout(st) {
        const failed = !info.ok;
        const verdict = failed ? (sag > 0.6 ? 'Collapsing' : 'Hinges forming') : 'Standing';
        const say = failed ? 'The line of thrust has left the ring. Joints open like hinges and the crown drops.' : 'The line of thrust stays inside the ring, so the arch stands without any glue.';
        return `<div class="big">${verdict}</div><p class="r-say">${say}</p><p class="r-say">${legend}</p>
          <div class="row"><span>Sideways thrust</span><b>${(info.H / info.Wt).toFixed(2)} × total weight</b></div>
          <div class="row"><span>Allowed range</span><b>${info.fits ? `${(info.Hmin / info.Wt).toFixed(2)} to ${Number.isFinite(info.Hmax) ? (info.Hmax / info.Wt).toFixed(2) : '∞'}` : 'none fits'}</b></div>
          <div class="row"><span>Rise : span</span><b>${(st.rise).toFixed(2)}</b></div>`;
      },
    };
  },
};
