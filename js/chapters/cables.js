// Chapter 4: suspension and cable-stayed. A cable carries load in pure tension. For a uniform load w per
// metre of deck hung from a cable of span L and sag f, the cable is a parabola, y = f (2x/L)², and its
// horizontal pull is H = w L² / (8 f), the same all along. That is H / (w L) = L / (8 f) times the deck weight,
// so a flatter cable pulls harder. The tension at the tower is T = H √(1 + (4f/L)²). A cable carrying only its
// own weight hangs as a catenary, y = a (cosh(x/a) − 1). The two curves are close for shallow sags, which is
// why the deck-loaded main cable is a parabola. The tower is squeezed by the vertical parts of the cable
// pulls, and the anchorage must resist the whole horizontal pull. A cable-stayed bridge skips the big
// cable: each stay carries only its own stretch of deck, T = P / sin(angle), so steep stays pull less.
import { THREE, M, beam, tube, box, arrow, clamp } from '../kit.js';
import { COL, paint, forceMat, legend, widenShadow, block, river } from '../bridge.js';

const DECK = 3, SPAN = 16, ZW = 1.15;
const catA = (f, half) => { let lo = 0.5, hi = 4000; for (let i = 0; i < 60; i++) { const a = Math.sqrt(lo * hi); if (a * (Math.cosh(half / a) - 1) > f) lo = a; else hi = a; } return Math.sqrt(lo * hi); };

export default {
  id: 'cables',
  short: 'Cables and towers',
  title: 'Suspension and cable-stayed bridges',
  subtitle: 'Cables in tension, towers in compression, anchors holding on.',
  view: { pos: [5, 8, 28], target: [0, 4.2, 0] },
  learn: `<p>Steel cable is wonderful in tension. A thin rope of steel wires can pull with the force of a thick beam. A <b>suspension bridge</b> hangs the deck from vertical <b>hangers</b> on a huge main cable. The cable sags in a smooth curve, passes over the tops of the towers and ends in massive <b>anchorages</b>. All the deck’s weight ends up as a pull along the cable, and the towers only have to squeeze downward on the ground.</p>
    <p>The cable curve under a deck is a <b>parabola</b>. A cable carrying only its own weight is a <b>catenary</b>. They are close, so the difference is small. Flatter cables pull harder, so you pay for a flatter deck with stronger cable. A <b>cable-stayed</b> bridge is a different idea: each straight <b>stay</b> goes from a tower directly to a point on the deck and carries only its own share. No anchorage is needed, because the deck itself takes the sideways squeeze.</p>
    <p class="tip"><b>Try it:</b> on the suspension bridge make the sag small and watch the cable and anchorage turn deep red. Then switch to cable-stayed and raise the tower: steeper stays pull less.</p>`,
  terms: [
    { t: 'Main cable', d: 'The big cable that carries the deck on a suspension bridge, bundled from thousands of steel wires.' },
    { t: 'Hanger', d: 'A vertical rope that hangs the deck from the main cable.' },
    { t: 'Anchorage', d: 'The huge block at each end that holds the main cable against its pull.' },
    { t: 'Catenary', d: 'The curve of a flexible cable hanging under its own weight.' },
    { t: 'Stay', d: 'A straight cable running from a tower to the deck on a cable-stayed bridge.' },
  ],
  defaults: { type: 'sus', sag: 0.16, tower: 5.5, load: 1, compare: false },
  controls: [
    { key: 'type', type: 'seg', label: 'Bridge', options: [{ v: 'sus', label: 'Suspension' }, { v: 'stay', label: 'Cable-stayed' }] },
    { key: 'sag', type: 'range', label: 'Cable sag (suspension)', min: 0.08, max: 0.4, step: 0.005, fmt: (v) => `sag is 1/${(1 / v).toFixed(1)} of the span` },
    { key: 'tower', type: 'range', label: 'Tower height (cable-stayed)', min: 3, max: 8, step: 0.05, fmt: (v) => v.toFixed(1) + ' above the deck' },
    { key: 'load', type: 'range', label: 'Traffic on the deck', min: 0.3, max: 2, step: 0.01, fmt: (v) => `${Math.round(v * 100)}% of normal` },
    { key: 'compare', type: 'toggle', label: 'Compare parabola and catenary (suspension)' },
  ],
  quiz: [
    { q: 'In a suspension bridge, what are the towers mostly doing?', options: ['Being stretched', 'Being squeezed', 'Bending sideways', 'Nothing'], answer: 1, why: 'The cable pulls down on the tower tops, so the towers are in compression. The cables are the parts in tension.' },
    { q: 'You make the main cable sag less (flatter). What happens to its tension?', options: ['It falls', 'It rises', 'It stays the same', 'It reverses'], answer: 1, why: 'The horizontal pull is w L² / (8 f), so a smaller sag f means a bigger pull.' },
    { q: 'What holds the ends of a suspension bridge’s main cable?', options: ['Piers in the water', 'The deck', 'Massive anchorages', 'The hangers'], answer: 2, why: 'Anchorages are huge blocks of concrete or rock that resist the whole pull of the cable.' },
  ],
  reel: [
    { ms: 5200, caption: 'A suspension bridge hangs its deck from cables, so the weight becomes a pull.', set: { type: 'sus', sag: 0.2, load: 1, compare: false }, anim: { sag: [0.4, 0.12] }, view: { pos: [5, 8, 28], target: [0, 4.2, 0] }, spin: 0 },
    { ms: 5000, caption: 'Stays run straight from tower to deck. Taller towers make steeper, gentler stays.', set: { type: 'stay', tower: 4, load: 1 }, anim: { tower: [3.5, 8] }, view: { pos: [5, 7, 26], target: [0, 4.2, 0] }, spin: 0 },
  ],
  build({ stage, s }) {
    widenShadow(stage, 26);
    const root = new THREE.Group(); stage.root.add(root);
    root.add(river(60));
    const dyn = new THREE.Group(); root.add(dyn);
    let key = '', paints = [], info = {}, labels = [];

    function clearDyn() {
      labels.forEach((l) => { l.element.remove(); dyn.remove(l); }); labels = [];
      [...dyn.children].forEach((k) => { dyn.remove(k); k.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose?.(); }); });
      paints = [];
    }
    const lab = (h, pos, cls) => { const l = stage.label(h, pos, dyn, cls); labels.push(l); return l; };
    const mk = (mesh, fn) => { dyn.add(mesh); if (fn) paints.push((L) => fn(L, mesh.material)); return mesh; };

    function buildSus(st) {
      const f = st.sag * SPAN, half = SPAN / 2, yT = DECK + 0.3 + f, ax = 13.5;
      const par = (x) => DECK + 0.3 + f * Math.pow(x / half, 2);
      const H = SPAN / (8 * f);                                  // in units of w L
      const mainT = H * Math.sqrt(1 + Math.pow(4 * f / SPAN, 2));
      const slopeS = (yT - DECK - 0.3) / (ax - half), sideT = H * Math.sqrt(1 + slopeS * slopeS);
      const Vtower = H * (4 * f / SPAN) + H * slopeS;
      info = { type: 'sus', H, mainT, sideT, Vtower, f };
      const deck = box(2 * ax - 3, 0.35, 2 * ZW + 0.3, forceMat()); deck.position.set(0, DECK - 0.17, 0); mk(deck, (L, m) => { m.color.setHex(COL.deck); m.emissive.setHex(0); });
      deck.material.color.setHex(COL.deck);
      for (const sx of [-1, 1]) {
        const tm = forceMat(), tw = [];
        for (const z of [-ZW, ZW]) { const leg = beam([sx * half, 0, z], [sx * half, yT + 0.3, z], 0.26, tm); mk(leg); }
        const cross = beam([sx * half, yT - 0.5, -ZW], [sx * half, yT - 0.5, ZW], 0.18, tm); mk(cross);
        paints.push((L) => paint(tm, -Vtower * L, 1.4));
        const ab = block(3, 2.2, 3.2, sx * (ax + 0.8), 1.1, 0, forceMat());
        mk(ab, (L, m) => paint(m, sideT * L, 3));
        const pull = arrow(COL.t, 1.5, 0.35, 0.09);
        const dir = new THREE.Vector3(-sx * (ax - half), yT - DECK - 0.3, 0).normalize();
        pull.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); pull.position.set(sx * (ax + 0.3), DECK + 0.3, 0); pull.scale.setScalar(1);
        mk(pull);
        for (const z of [-ZW, ZW]) {
          const sm = forceMat(); mk(beam([sx * half, yT, z], [sx * ax, DECK + 0.3, z], 0.12, sm), (L) => paint(sm, sideT * L, 3));
        }
      }
      for (const z of [-ZW, ZW]) {
        const mm = forceMat(), pts = []; for (let i = 0; i <= 64; i++) { const x = -half + (SPAN * i) / 64; pts.push([x, par(x), z]); }
        mk(tube(pts, 0.12, mm, false, 64), (L) => paint(mm, mainT * L, 3));
        const hm = forceMat(); paints.push((L) => paint(hm, 1 * L, 3));
        for (let x = -7; x <= 7; x += 1) mk(beam([x, par(x), z], [x, DECK - 0.1, z], 0.035, hm, 6));
      }
      if (st.compare) {
        const a = catA(f, half), cat = (x) => DECK + 0.3 + a * (Math.cosh(x / a) - 1), z = ZW + 0.35;
        const pp = [], cc = []; for (let i = 0; i <= 64; i++) { const x = -half + (SPAN * i) / 64; pp.push([x, par(x), z]); cc.push([x, cat(x), z]); }
        mk(tube(pp, 0.06, M.glow(0xffb547), false, 64)); mk(tube(cc, 0.06, M.glow(0x8ef0ff), false, 64));
        const dmax = Math.max(...cc.map((c, i) => Math.abs(c[1] - pp[i][1])));
        info.dmax = dmax;
        lab('Parabola (deck load)', [-3.5, par(-3.5) + 1.3, z], 'hot'); lab('Catenary (own weight)', [3.5, par(3.5) - 1.4, z]);
      }
      lab('Main cable: tension', [-4, yT + 1.1, 0]); lab('Tower: compression', [-half, 1.6, ZW + 0.3]); lab('Anchorage', [-ax - 0.8, 3.0, 0]); lab('Hangers', [2.2, (par(1.5) + DECK) / 2, ZW + 0.3]);
    }

    function buildStay(st) {
      const Ht = st.tower, xT = 6, ks = [1, 2, 3, 4], P = 1.4;
      let Tmax = 0, Tmin = 1e9;
      const deck = box(2 * (xT + 7), 0.35, 2 * ZW + 0.3, forceMat()); deck.position.set(0, DECK - 0.17, 0);
      mk(deck, (L, m) => { paint(m, -2.2 * L, 5); });
      for (const sx of [-1, 1]) {
        const tm = forceMat();
        for (const z of [-ZW, ZW]) mk(beam([sx * xT, 0, z], [sx * xT, DECK + Ht, z], 0.26, tm));
        mk(beam([sx * xT, DECK + 1.2, -ZW], [sx * xT, DECK + 1.2, ZW], 0.18, tm));
        paints.push((L) => paint(tm, -8 * P * L, 12));
        for (const dir of [-1, 1]) for (const k of ks) {
          const d = 1.4 * k, ya = DECK + Ht * (0.55 + 0.45 * (k - 1) / 3), th = Math.atan2(ya - DECK, d), T = P / Math.sin(th);
          Tmax = Math.max(Tmax, T); Tmin = Math.min(Tmin, T);
          for (const z of [-ZW, ZW]) { const m = forceMat(); mk(beam([sx * xT, ya, z], [sx * xT + dir * d, DECK, z], 0.05, m, 8), (L) => paint(m, T * L, 6)); }
        }
      }
      info = { type: 'stay', Tmax, Tmin, V: 8 * P };
      lab('Stays: tension', [-xT + 2.2, DECK + Ht * 0.9 + 0.6, ZW + 0.3], 'hot'); lab('Tower: compression', [-xT, 1.6, ZW + 0.3]); lab('Deck: squeezed by the stays', [0, DECK - 0.9, ZW + 0.3]);
      for (const sx of [-1, 1]) for (const z of [-ZW, ZW]) mk(block(1.6, 1.5, 0.9, sx * xT, 0.75, z, M.matte(COL.stone)));
    }

    return {
      update(dt, st) {
        const k = `${st.type}|${st.sag.toFixed(3)}|${st.tower.toFixed(2)}|${st.compare}`;
        if (k !== key) { key = k; clearDyn(); st.type === 'sus' ? buildSus(st) : buildStay(st); }
        paints.forEach((p) => p(st.load));
      },
      readout(st) {
        if (!info.type) return '';
        if (info.type === 'sus') {
          return `<div class="big">Suspension bridge</div><p class="r-say">${legend}</p>
            <div class="row"><span>Cable pull at the tower</span><b>${info.mainT.toFixed(2)} × deck weight</b></div>
            <div class="row"><span>Anchorage pull</span><b>${info.sideT.toFixed(2)} × deck weight</b></div>
            <div class="row"><span>Tower squeeze (per tower)</span><b>${info.Vtower.toFixed(2)} × deck weight</b></div>
            ${st.compare ? `<div class="row"><span>Curves differ by at most</span><b>${(info.dmax * 100).toFixed(0)} cm in ${SPAN} m</b></div>` : ''}`;
        }
        return `<div class="big">Cable-stayed bridge</div><p class="r-say">${legend}</p>
          <div class="row"><span>Steepest stay pulls</span><b>${info.Tmin.toFixed(2)} × its share</b></div>
          <div class="row"><span>Shallowest stay pulls</span><b>${info.Tmax.toFixed(2)} × its share</b></div>
          <div class="row"><span>Rule</span><b>pull = share ÷ sin(angle)</b></div>`;
      },
    };
  },
};
