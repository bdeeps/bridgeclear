// Chapter 5: how bridges fail. Four teaching models, each simplified:
//  - Flutter (Tacoma Narrows, 7 Nov 1940). Wind at roughly 64 km/h (about 40 mph) set the deck twisting. This was
//    aeroelastic flutter: the deck's own motion changes the wind forces on it, and past a critical speed those
//    forces add energy each cycle (negative aerodynamic damping), so the twist grows without limit. It was not
//    simple resonance with vortices, which gives a bounded response. Modelled as a twisting mode with
//    damping ratio z = z0 (1 - (U/Ucr)^3), boosted past Ucr, plus a small bounded vortex-shedding forcing.
//    The critical speed here (19 m/s bluff, 55 m/s streamlined) is illustrative, not measured.
//  - Lateral lock-in (London Millennium Bridge, June 2000). Walkers' sideways footfall forces nudge the deck;
//    once it moves, more of them fall into step with it, which forces it harder. Kuramoto-style phase locking
//    to a lateral mode of about 0.8 Hz. A crowd threshold emerges; the real fix was added damping.
//  - Fatigue. Tiny cracks grow a little with every load cycle, da/dN = C (Y S sqrt(pi a))^3 (the Paris law),
//    slowly, then fast. Constants are chosen so the default life is decades. Illustrative, not a design tool.
//  - Scour. Fast water digs out the riverbed around a pier. Hole depth grows with speed above a threshold, up
//    to roughly 2 pier widths (HEC-18 style scale), and the pier fails when the hole is deeper than its footing.
import { THREE, M, box, beam, arrow, clamp, approach, swarm } from '../kit.js';
import { COL, paint, forceMat, legend, widenShadow, block, river } from '../bridge.js';

const MODES = { flutter: 'Tacoma: flutter', lockin: 'Millennium: lock-in', fatigue: 'Fatigue', scour: 'Scour' };
const VIEWS = { flutter: [[5, 7, 19], [0, 2.5, 0]], lockin: [[0, 17, 8], [0, 2, 0]], fatigue: [[0, 1.5, 15], [0, 0, 0]], scour: [[6, 5, 22], [0, 0.5, 0]] };
let seed = 11; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const gauss = () => { let u = 0; for (let i = 0; i < 6; i++) u += rnd(); return (u - 3) / Math.sqrt(0.5); };

export default {
  id: 'failure',
  short: 'How bridges fail',
  title: 'Flutter, footsteps, fatigue and floods',
  subtitle: 'Four ways a sound bridge can still come apart.',
  view: { pos: [5, 7, 19], target: [0, 2.5, 0] },
  learn: `<p>Most collapses are not a beam being too weak on day one. They are slower, odder things. <b>Tacoma Narrows</b> (1940) is the famous one. A moderate wind made the deck twist in bigger and bigger swings until it tore apart. It is often called resonance, but that is not quite right. Ordinary resonance is a push at the right rhythm, and the response stays bounded. At Tacoma the wind and the moving deck fed each other: <b>aeroelastic flutter</b>. Past a critical wind speed the deck’s own motion made the air force it harder.</p>
    <p>The <b>Millennium Bridge</b> in London wobbled sideways on its opening day in 2000. A crowd’s footsteps began to move the deck a little, people unconsciously fell into step with it, and that pushed it more. This is called <b>lateral lock-in</b>. Dampers fixed it. Two slower killers: <b>fatigue</b>, where a crack grows a hair’s breadth with every load cycle, and <b>scour</b>, where floodwater digs out the ground under a pier.</p>
    <p class="tip"><b>Try it:</b> pick each mode and push the slider past its tipping point. Then change the shape, add dampers, or deepen the footing.</p>
    <p class="note">All four are teaching models. The speeds, crowd size and years are illustrative, not engineering numbers.</p>`,
  terms: [
    { t: 'Flutter', d: 'A self-feeding vibration where the structure’s motion changes the wind forces, which feed energy back into the motion.' },
    { t: 'Resonance', d: 'A big response when something is pushed at its natural rhythm. The push comes from outside and does not depend on the motion.' },
    { t: 'Lock-in', d: 'When a crowd falls into step with a vibrating structure and pushes it harder.' },
    { t: 'Fatigue', d: 'Damage from repeated loading: a crack grows a little each cycle even when each load is small.' },
    { t: 'Scour', d: 'Erosion of the riverbed around a bridge foundation by moving water.' },
    { t: 'Damper', d: 'A device that soaks up vibration energy.' },
  ],
  defaults: { mode: 'flutter', wind: 12, stream: false, crowd: 60, damp: 0, stress: 90, years: 12, flow: 1.2, foot: 1.6 },
  onChange() {},
  controls: [
    { key: 'mode', type: 'seg', label: 'Failure', options: Object.entries(MODES).map(([v, label]) => ({ v, label })) },
    { key: 'wind', type: 'range', label: 'Wind speed (Tacoma)', min: 0, max: 30, step: 0.1, fmt: (v) => `${v.toFixed(0)} m/s (${(v * 3.6).toFixed(0)} km/h)` },
    { key: 'stream', type: 'toggle', label: 'Streamlined deck (Tacoma)', hint: 'Open, shallow decks shed wind with far less feedback.' },
    { key: 'crowd', type: 'range', label: 'People on the deck (Millennium)', min: 0, max: 400, step: 1, fmt: (v) => Math.round(v) + ' people' },
    { key: 'damp', type: 'range', label: 'Dampers fitted (Millennium)', min: 0, max: 1, step: 0.01, fmt: (v) => (v < 0.05 ? 'none' : Math.round(v * 100) + '%') },
    { key: 'stress', type: 'range', label: 'Stress swing per load (Fatigue)', min: 40, max: 160, step: 1, fmt: (v) => v.toFixed(0) + ' MPa' },
    { key: 'years', type: 'log', label: 'Years of traffic (Fatigue)', min: 1, max: 200, fmt: (v) => v.toFixed(v < 10 ? 1 : 0) + ' years' },
    { key: 'flow', type: 'range', label: 'River speed (Scour)', min: 0, max: 4, step: 0.05, fmt: (v) => v.toFixed(1) + ' m/s' },
    { key: 'foot', type: 'range', label: 'Footing depth (Scour)', min: 0.6, max: 2.6, step: 0.05, fmt: (v) => v.toFixed(1) + ' pier widths' },
    { key: 'go', type: 'buttons', label: 'Start over', items: [{ label: 'Rebuild the bridge', act: (s, inst) => inst.reset?.() }] },
  ],
  quiz: [
    { q: 'What best describes what destroyed the Tacoma Narrows Bridge?', options: ['Ordinary resonance with an earthquake', 'Aeroelastic flutter: the wind and the deck’s motion fed each other', 'Too much traffic', 'A fault in the cables'], answer: 1, why: 'Past a critical speed the deck’s own twisting changed the wind forces so they added energy each cycle. That is flutter, not simple resonance.' },
    { q: 'Why did the Millennium Bridge sway sideways?', options: ['Wind', 'Walkers fell into step with a small sway and pushed it harder', 'The cables were loose', 'It was too short'], answer: 1, why: 'Walkers adjust their stride to a moving deck, so their sideways forces line up with the motion and add energy. Dampers removed it.' },
    { q: 'A tiny crack in a steel bar grows when…', options: ['The bar is loaded only once, very hard', 'It is loaded over and over', 'It gets warm', 'It is painted'], answer: 1, why: 'Fatigue: each cycle advances the crack a little, slowly at first and then faster.' },
    { q: 'What happens to a pier when floodwater scours the bed to below its footing?', options: ['Nothing', 'It loses support and can settle or tilt', 'It becomes stronger', 'The water stops'], answer: 1, why: 'The foundation is left hanging with nothing to push against, so the pier can fail.' },
  ],
  reel: [
    { ms: 5600, caption: 'Tacoma Narrows, 1940: wind and a twisting deck fed each other until it tore apart.', set: { mode: 'flutter', wind: 24, stream: false }, act: (s, inst) => { inst.reset?.(); inst.prime?.(6.5); }, view: { pos: [6, 5, 18], target: [0, 2.5, 0] }, spin: 0 },
    { ms: 5600, caption: 'London’s Millennium Bridge: walkers fell into step with the sway and made it worse.', set: { mode: 'lockin', crowd: 40, damp: 0 }, anim: { crowd: [40, 320] }, act: (s, inst) => inst.prime?.(25), view: { pos: [4, 9, 15], target: [0, 1, 0] }, spin: 0 },
  ],
  build({ stage, s }) {
    widenShadow(stage, 22);
    const root = new THREE.Group(); stage.root.add(root);
    const dyn = new THREE.Group(); root.add(dyn);
    let mode = null, M_ = null, labels = [];
    const lab = (h, pos, cls) => { const l = stage.label(h, pos, dyn, cls); labels.push(l); return l; };
    function clearDyn() {
      labels.forEach((l) => l.element.remove()); labels = [];
      [...dyn.children].forEach((k) => { dyn.remove(k); k.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose?.()); }); });
    }

    // ------------------------------------------------------------------ flutter
    function flutter() {
      const NS = 28, LEN = 14, UCR = { bluff: 19, stream: 55 };
      const water = river(40); dyn.add(water);
      dyn.add(block(1.6, 2.2, 3, -LEN / 2 - 0.8, 1.1, 0), block(1.6, 2.2, 3, LEN / 2 + 0.8, 1.1, 0));
      const segs = [];
      const deckMat = M.plastic(0xcfd4de, { metalness: 0.2 });
      const girderMat = M.plastic(0x8aa0c0, { metalness: 0.4 });
      for (let i = 0; i < NS; i++) {
        const g = new THREE.Group(), slab = box(1, 0.16, 2.6, deckMat), l = box(1, 1, 0.1, girderMat), r = box(1, 1, 0.1, girderMat);
        g.add(slab, l, r); g.userData = { slab, l, r }; dyn.add(g); segs.push(g);
      }
      const winds = []; for (let i = 0; i < 5; i++) { const a = arrow(0x9ad0ff, 1, 0.3, 0.05); a.rotation.x = Math.PI / 2; a.position.set(-5 + i * 2.5, 3.2 + (i % 2) * 0.6, -5); dyn.add(a); winds.push(a); }
      lab('Wind', [-7, 4, -5]); lab('Deck twists about its length', [0, 6, 0], 'hot');
      let th = 0.004, om = 0, failed = false, t = 0, zeta = 0.05, form = 0;
      const st = { th: 0 };
      const step = (dt, s2) => {
        const Ucr = s2.stream ? UCR.stream : UCR.bluff, g = s2.wind / Ucr, W = 2 * Math.PI * 0.8;
        zeta = g < 1 ? 0.05 * (1 - g * g * g) : 0.05 * (1 - g * g * g) * 2.5;
        const F = 0.025 * (s2.wind / 20) * Math.sin(2 * Math.PI * (0.1 * s2.wind + 0.3) * t); // bounded vortex forcing
        const n = 4;
        for (let i = 0; i < n; i++) { const h = dt / n; const a = -W * W * th - 2 * zeta * W * om + W * W * F; om += a * h; th += om * h; t += h; }
        if (Math.abs(th) > 0.55) failed = true;
      };
      return {
        step, reset() { th = 0.004; om = 0; failed = false; },
        update(dt, s2) {
          if (!failed) step(dt, s2); else th = approach(th, 0.7, 2, dt);
          const stream = s2.stream, gh = stream ? 0.2 : 0.95;
          segs.forEach((g, i) => {
            const u = (i + 0.5) / NS, sh = Math.sin(Math.PI * u), x = -LEN / 2 + u * LEN, drop = failed ? 3.5 * sh * sh * Math.min(1, (Math.abs(th) - 0.5) * 2) : 0;
            g.position.set(x, 2.6 + 0.2 - drop, 0); g.rotation.x = th * sh * (failed ? 1.2 : 1);
            const { slab, l, r } = g.userData, L = LEN / NS * 1.03;
            slab.scale.x = l.scale.x = r.scale.x = L; l.scale.y = r.scale.y = gh; l.position.set(0, 0.08 - gh / 2 + 0.0 + (stream ? 0 : -0.0), 1.3); r.position.set(0, l.position.y, -1.3);
            if (failed && sh > 0.7) g.visible = Math.abs(u - 0.5) > 0.06 || i % 2 === 0;
          });
          winds.forEach((a, i) => { a.set(0.4 + s2.wind * 0.1); a.position.z = -5 + ((time0 + i * 0.7) % 1) * 0; });
          st.th = th;
        },
        prime(sec, s2) { for (let k = 0; k < sec * 30; k++) step(1 / 30, s2); },
        readout(s2) {
          const Ucr = s2.stream ? UCR.stream : UCR.bluff, g = s2.wind / Ucr;
          const state = failed ? 'The deck has torn apart' : g < 1 ? 'Wind calms the twist' : 'Twisting grows on its own';
          const why = failed ? 'The twist passed what the deck could take. At Tacoma it reached about 45 degrees before the deck broke up.' : g < 1 ? 'Below the critical speed, the wind adds damping and any twist dies away.' : 'Above the critical speed, each swing makes the air push harder in the next one. That is flutter, and it is not simple resonance.';
          return `<div class="big">${state}</div><p class="r-say">${why}</p>
            <div class="row"><span>Critical wind speed (model)</span><b>${Ucr} m/s</b></div>
            <div class="row"><span>Net damping</span><b style="color:${zeta < 0 ? '#ff7a59' : 'inherit'}">${zeta < 0 ? 'negative: the wind feeds the twist' : 'positive: twist dies away'}</b></div>
            <div class="row"><span>Twist now</span><b>${(Math.abs(th) * 180 / Math.PI).toFixed(1)}°</b></div>`;
        },
      };
    }

    // ------------------------------------------------------------------ lock-in
    function lockin() {
      const LEN = 16, MAXN = 400, VIZ = 7, G = 0.05, K = 200;
      dyn.add(block(1.6, 2.4, 3.2, -LEN / 2 - 0.8, 1.2, 0), block(1.6, 2.4, 3.2, LEN / 2 + 0.8, 1.2, 0));
      dyn.add(river(40));
      const NS = 24, segs = [], mat = M.plastic(0xcfd4de, { metalness: 0.2 });
      for (let i = 0; i < NS; i++) { const m = box(LEN / NS * 1.03, 0.2, 2.2, mat); dyn.add(m); segs.push(m); }
      const geo = new THREE.CapsuleGeometry(0.1, 0.34, 4, 8), crowd = swarm(MAXN, geo, M.plastic(0xffb547, { roughness: 0.6 }));
      crowd.frustumCulled = false; dyn.add(crowd);
      const ph = [], om = [], xs = [], zs = [];
      for (let i = 0; i < MAXN; i++) { ph.push(rnd() * 6.283); om.push(2 * Math.PI * (0.95 + 0.1 * gauss())); xs.push(rnd()); zs.push((rnd() - 0.5) * 1.5); }
      let q = 0.001, v = 0, Phi = 0, A = 0, r = 0;
      lab('Sideways sway', [0, 3.8, 1.8], 'hot');
      const step = (dt, st) => {
        const W = 2 * Math.PI * 0.8, z = 0.01 + st.damp * 0.05, N = Math.round(st.crowd), n = 2, h = dt / n;
        for (let k = 0; k < n; k++) {
          A = Math.hypot(q, v / W); Phi = Math.atan2(-v / W, q);
          let S = 0, cr = 0, ci = 0;
          for (let i = 0; i < N; i++) {
            ph[i] += h * (om[i] + K * A * Math.sin(Phi + Math.PI / 2 - ph[i]));
            S += Math.cos(ph[i]) * Math.sin(Math.PI * xs[i]);
            cr += Math.cos(ph[i] - Phi - Math.PI / 2); ci += Math.sin(ph[i] - Phi - Math.PI / 2);
            xs[i] += h * 1.3 / LEN; if (xs[i] > 1) xs[i] -= 1;
          }
          r = N ? Math.hypot(cr, ci) / N : 0;
          const a = -W * W * q - 2 * z * W * v + G * S / 100;
          v += a * h; q += v * h;
        }
      };
      return {
        step, reset() { q = 0.001; v = 0; },
        update(dt, st) {
          step(dt, st);
          const N = Math.round(st.crowd);
          segs.forEach((m, i) => { const u = (i + 0.5) / NS; m.position.set(-LEN / 2 + u * LEN, 2.5, q * VIZ * Math.sin(Math.PI * u)); });
          for (let i = 0; i < MAXN; i++) {
            if (i >= N) { crowd.place(i, [0, -50, 0]); continue; }
            const u = xs[i], x = -LEN / 2 + u * LEN, zz = q * VIZ * Math.sin(Math.PI * u) + zs[i] * 0.8 + 0.07 * Math.sin(ph[i]);
            crowd.place(i, [x, 2.5 + 0.1 + 0.27, zz], [0, 0, 0], 1);
          }
          crowd.done();
        },
        prime(sec, st) { for (let k = 0; k < sec * 30; k++) step(1 / 30, st); },
        readout(st) {
          const amp = A * 100, wob = amp > 4 ? 'Swaying hard' : amp > 1 ? 'Starting to sway' : 'Steady';
          return `<div class="big">${wob}</div><p class="r-say">${amp > 1 && r > 0.4 ? 'The walkers are falling into step with the sway, and that pushes the deck harder.' : 'Each person pushes sideways at a slightly different rhythm, so the pushes cancel out. Add people to find the tipping point.'}</p>
            <div class="row"><span>Deck sway</span><b>${amp.toFixed(1)} cm</b></div>
            <div class="row"><span>Walkers in step</span><b>${Math.round(r * 100)}%</b></div>
            <div class="row"><span>Dampers</span><b>${st.damp < 0.05 ? 'none' : Math.round(st.damp * 100) + '%'}</b></div>`;
        },
      };
    }

    // ------------------------------------------------------------------ fatigue
    function fatigue() {
      const WID = 2.4, LEN = 7, TH = 0.5, A0 = 0.001, AC = 0.35, PER = 0.5e6, Y = 1.12;       // widths in plate widths (0.1 m wide plate)
      // life at 100 MPa is set to about 45 million cycles (90 years of heavy trucks at half a million a year)
      const Wm = 0.1, a0 = A0 * 1, ac = AC * Wm, k0 = 2 * (1 / Math.sqrt(a0) - 1 / Math.sqrt(ac)), C3 = k0 / (45e6 * Math.pow(Y * 100, 3) * Math.pow(Math.PI, 1.5));
      const lifeCycles = (S) => k0 / (C3 * Math.pow(Y * S, 3) * Math.pow(Math.PI, 1.5));
      const crackAt = (S, N) => { const inv = 1 / Math.sqrt(a0) - (N * C3 * Math.pow(Y * S, 3) * Math.pow(Math.PI, 1.5)) / 2; return inv <= 1 / Math.sqrt(ac) ? ac : 1 / (inv * inv); };
      const barMat = forceMat(), halfMat = [forceMat(), forceMat()];
      const halves = [box(1, 1, 1, halfMat[0]), box(1, 1, 1, halfMat[1])]; halves.forEach((h) => { h.scale.set(LEN / 2 - 0.02, WID, TH); dyn.add(h); });
      const slit = box(1, 1, 1, M.glow(0x000000)); dyn.add(slit);
      const top = box(0.9, 0.9, 0.9, M.matte(COL.stone)); top.position.set(0, 0, 0);
      const arrs = [arrow(COL.t, 1.6, 0.4, 0.1), arrow(COL.t, 1.6, 0.4, 0.1)]; arrs[0].rotation.z = Math.PI / 2; arrs[1].rotation.z = -Math.PI / 2; dyn.add(...arrs);
      lab('Crack', [0, WID / 2 + 0.7, 0.4], 'hot'); lab('Steel eyebar being pulled again and again', [0, -WID / 2 - 0.8, 0]);
      let gap = 0, last = { a: 0, N: 0, life: 0 }, broke = false;
      const lay = (st) => {
        const Wm2 = WID, S = st.stress, N = st.years * PER, life = lifeCycles(S);
        const a = crackAt(S, N), frac = a / Wm, aU = frac * WID;
        broke = a >= ac * 0.999 || N >= life;
        last = { a, N, life, frac, S };
        const netS = S / Math.max(0.05, 1 - frac), tgt = broke ? 1.0 : 0;
        const hi = netS / 400;
        halves.forEach((h, i) => { h.position.set((i ? 1 : -1) * (LEN / 4 + gap / 2), 0, 0); paint(halfMat[i], hi * 400, 400 * 0.6); });
        slit.position.set(0, WID / 2 - aU / 2, 0.0); slit.scale.set(0.05 + 0.05 * frac, Math.max(0.0001, aU), TH * 1.02); slit.visible = !broke && aU > 0.01;
        arrs[0].position.set(-LEN / 2 - 0.15 - gap / 2, 0, 0); arrs[1].position.set(LEN / 2 + 0.15 + gap / 2, 0, 0);
        const L = 1.2 + S / 80; arrs.forEach((x) => x.set(L)); arrs[0].position.x -= L - 0.2 * 0; arrs[1].position.x += L - 0;
        arrs[0].position.x = -LEN / 2 - 0.1 - gap / 2 - L * 0.0; arrs[1].position.x = LEN / 2 + 0.1 + gap / 2;
        return tgt;
      };
      return {
        reset() { gap = 0; }, update(dt, st) { const tg = lay(st); gap = approach(gap, tg * 0.9, 6, dt); },
        readout(st) {
          const yearsLeft = last.life / PER;
          return `<div class="big">${broke ? 'Fractured' : last.frac < 0.02 ? 'Looks fine' : 'Crack growing'}</div><p class="r-say">${broke ? 'The bar can no longer carry the load and breaks suddenly.' : 'Most of a bar’s life is spent with a crack too small to see. Then it speeds up. Halve the stress swing and life goes up about eightfold.'}</p>
            <div class="row"><span>Crack length</span><b>${(last.a * 1000).toFixed(1)} mm</b></div>
            <div class="row"><span>Load cycles so far</span><b>${(last.N / 1e6).toFixed(1)} million</b></div>
            <div class="row"><span>Life at this stress</span><b>${yearsLeft > 500 ? 'more than 500 years' : yearsLeft.toFixed(0) + ' years'}</b></div>
            <div class="row"><span>Assumed</span><b>0.5 million heavy loads a year</b></div>`;
        },
      };
    }

    // ------------------------------------------------------------------ scour
    function scour() {
      const BW = 1, SZ = 11, GN = 56;
      const bedGeo = new THREE.PlaneGeometry(SZ * 2, SZ, GN, Math.round(GN * SZ / (SZ * 2))); bedGeo.rotateX(-Math.PI / 2);
      const bed = new THREE.Mesh(bedGeo, M.matte(0xc9b48a, { roughness: 1 })); bed.receiveShadow = true; bed.position.y = 0; dyn.add(bed);
      const base = bedGeo.attributes.position.array.slice();
      const water = new THREE.Mesh(new THREE.PlaneGeometry(SZ * 2, SZ), new THREE.MeshStandardMaterial({ color: COL.water, transparent: true, opacity: 0.4, roughness: 0.2, depthWrite: false })); water.rotation.x = -Math.PI / 2; water.position.y = 2.2; dyn.add(water);
      const pierMat = forceMat();
      const pierG = new THREE.Group(); dyn.add(pierG);
      const pier = box(BW, 4.6, 2.2, pierMat), footing = box(BW * 1.5, 0.6, 2.6, M.matte(0x9a9a94)); pierG.add(pier, footing);
      const abL = block(2, 4.4, 3, -9.5, 1.8, 0), abR = block(2, 4.4, 3, 9.5, 1.8, 0); dyn.add(abL, abR);
      const deckMat = M.plastic(0xcfd4de, { metalness: 0.2 }), d1 = box(1, 0.4, 2.6, deckMat), d2 = box(1, 0.4, 2.6, deckMat); dyn.add(d1, d2);
      const N = 40, flows = swarm(N, new THREE.SphereGeometry(0.07, 8, 6), M.glow(0xbfe3ff)); dyn.add(flows);
      const fp = Array.from({ length: N }, () => ({ x: (rnd() - 0.5) * SZ * 2, y: 0.4 + rnd() * 1.6, z: (rnd() - 0.5) * SZ * 0.8 }));
      lab('Flow', [-9, 2.6, -3]); lab('Scour hole', [-2.4, -0.4, 1.6], 'hot'); lab('Pier', [0, 4.6, 1.2]);
      let depth = 0, tt = 0;
      const target = (st) => Math.max(0, Math.min(1, (st.flow - 0.6) / 2.6)) * 2.4 * BW;
      const lay = (st) => {
        const p = bedGeo.attributes.position;
        for (let i = 0; i < p.count; i++) {
          const x = base[3 * i], z = base[3 * i + 2], r = Math.hypot((x) / 1.6, z / 1.5);
          p.setY(i, -depth * Math.exp(-r * r) + depth * 0.12 * Math.exp(-Math.pow((x - 2.4) / 1.8, 2) - Math.pow(z / 1.8, 2)));
        }
        p.needsUpdate = true; bedGeo.computeVertexNormals();
        const emb = st.foot, excess = Math.max(0, depth - emb + 0.15), sink = Math.min(2, excess * 1.2), tilt = Math.min(0.3, excess * 0.3);
        const HP = emb + 4.0;
        pierG.position.set(0, -emb + sink, 0); pierG.rotation.z = tilt;
        pier.scale.y = HP / 4.6; pier.position.y = HP / 2; footing.position.y = 0.3;
        const top = [pierG.position.x - Math.sin(tilt) * HP, pierG.position.y + Math.cos(tilt) * HP];
        for (const [d, ax] of [[d1, -8.5], [d2, 8.5]]) {
          const ay = 3.8, dx = top[0] - ax, dy = top[1] - 0.2 - ay, len = Math.hypot(dx, dy);
          d.scale.x = len; d.position.set((ax + top[0]) / 2, (ay + top[1] - 0.2) / 2, 0); d.rotation.z = Math.atan2(dy, dx);
        }
        pierMat.color.setHex(excess > 0 ? COL.warn : COL.stone); pierMat.emissive.setHex(0);
        return { excess, tilt };
      };
      let res = { excess: 0, tilt: 0 };
      return {
        reset() { depth = 0; }, prime(sec, st) { for (let k = 0; k < sec * 30; k++) depth += (target(st) - depth) * (1 - Math.exp(-0.35 / 30)); res = lay(st); },
        update(dt, st) {
          depth += (target(st) - depth) * (1 - Math.exp(-0.35 * dt)); tt += dt; res = lay(st);
          const sp = st.flow * 1.6;
          fp.forEach((q, i) => { q.x += sp * dt; if (q.x > SZ) q.x = -SZ; const r = Math.hypot(q.x / 1.0, q.z), deflect = Math.exp(-r * r * 0.25) * Math.sign(q.z || 1) * 0.6; flows.place(i, [q.x, q.y, q.z + deflect]); });
          flows.done();
        },
        readout(st) {
          const dd = depth / BW, failing = res.excess > 0;
          return `<div class="big">${failing ? 'Pier undermined' : depth > 0.3 ? 'Hole growing' : 'Bed is stable'}</div><p class="r-say">${failing ? 'The scour hole is deeper than the footing, so the pier loses its grip and the deck drops.' : st.flow < 0.6 ? 'Slow water cannot move the sand, so there is no scour.' : 'Water speeding past the pier digs out a hole at its base. Floods are when the damage is done.'}</p>
            <div class="row"><span>Scour hole depth</span><b>${dd.toFixed(1)} pier widths</b></div>
            <div class="row"><span>Footing depth</span><b>${st.foot.toFixed(1)} pier widths</b></div>
            <div class="row"><span>Hole can reach (this flow)</span><b>${(target(st) / BW).toFixed(1)} pier widths</b></div>`;
        },
      };
    }

    let time0 = 0;
    const makers = { flutter, lockin, fatigue, scour };
    function ensure(st) {
      if (mode === st.mode) return;
      const first = mode === null;
      mode = st.mode; clearDyn(); M_ = makers[mode]();
      const v = VIEWS[mode]; if (!first) stage.setView(v[0], v[1], 1);
    }
    return {
      update(dt, st, time) { time0 = time; ensure(st); M_.update(dt, st); },
      readout(st) { ensure(st); return M_.readout(st); },
      prime(sec) { ensure(s); M_.prime?.(sec, s); },
      reset() { M_?.reset?.(); },
    };
  },
};
