// Chapter 1: compression and tension. A simple beam bridge carries a load by bending.
// Statics for a point load P at distance a from the left support on a simply supported span L (b = L - a):
//   reactions R_left = P b / L, R_right = P a / L; peak bending moment M = P a b / L under the load;
//   deflection under the load = P a² b² / (3 E I L). Bending stress in the outer fibres = M c / I, which
//   for a rectangular section of depth d falls as 1/d², and deflection falls as 1/d³ (I ∝ d³).
// Top fibres are squeezed and bottom fibres stretched for a downward load (sagging). The picture is a
// teaching model: loads and strength are in relative units, deflection is exaggerated and soft-limited.
import { THREE, M, box, arrow, clamp } from '../kit.js';
import { COL, paint, forceMat, legend, widenShadow, block, river } from '../bridge.js';

const L = 10, NS = 40, DECK_Y = 2.0, LIMIT = 25;

export default {
  id: 'forces',
  short: 'Squeeze and stretch',
  title: 'Squeeze, stretch, and the path to the ground',
  subtitle: 'Every bridge turns a downward load into two pushes and pulls.',
  view: { pos: [1, 5.2, 15], target: [0, 1.8, 0] },
  learn: `<p>A bridge has one job: move weight sideways to solid ground. Whatever the shape, only two kinds of internal force do the work. <b>Compression</b> squeezes a part. <b>Tension</b> stretches it. A stone pillar is in compression. A rope hanging a swing is in tension.</p>
    <p>A plain beam bridge shows both at once. Put a load on it and it sags a little. The top edge gets shorter, so it is <b>squeezed</b>. The bottom edge gets longer, so it is <b>stretched</b>. The middle barely does anything, which is why deep beams and hollow boxes are so efficient. The load then travels down the beam to the two supports, which push back up. That route is the <b>load path</b>.</p>
    <p class="tip"><b>Try it:</b> drag the cart along the deck, or use the slider. The supports share the load by distance: the nearer one carries more. Then make the beam shallow and watch the stress colours climb past the limit.</p>
    <p class="note">Loads and limits are in relative units, and the sag is exaggerated so you can see it.</p>`,
  terms: [
    { t: 'Compression', d: 'A squeezing force that pushes the particles of a material together.' },
    { t: 'Tension', d: 'A stretching force that pulls the particles of a material apart.' },
    { t: 'Load path', d: 'The route a load takes through the structure on its way to the ground.' },
    { t: 'Reaction', d: 'The upward push a support gives back to hold the bridge up.' },
    { t: 'Bending moment', d: 'The turning effect of the loads along a beam. It is largest where the beam is most strained.' },
  ],
  defaults: { at: 0.3, load: 1.5, depth: 0.5, show: true },
  controls: [
    { key: 'at', type: 'range', label: 'Load position', min: 0, max: 1, step: 0.005, fmt: (v) => `${Math.round(v * 100)}% across` },
    { key: 'load', type: 'range', label: 'Load', min: 0.5, max: 4, step: 0.05, fmt: (v) => v.toFixed(1) + ' units' },
    { key: 'depth', type: 'range', label: 'Beam depth', min: 0.3, max: 0.9, step: 0.01, fmt: (v) => (v * 100).toFixed(0) + ' cm of beam', hint: 'Deeper beams bend less and have lower stress.' },
    { key: 'show', type: 'toggle', label: 'Show stress colours' },
  ],
  quiz: [
    { q: 'A load sits in the middle of a simple beam bridge. Which part of the beam is stretched?', options: ['The top edge', 'The bottom edge', 'The ends only', 'Nothing is stretched'], answer: 1, why: 'The beam sags, so the bottom edge gets longer (tension) and the top edge gets shorter (compression).' },
    { q: 'The load is close to the left support. Which support carries more?', options: ['The right one', 'The left one', 'Both the same', 'Neither'], answer: 1, why: 'The load shares itself by distance. The nearer support carries the larger share.' },
    { q: 'You double the depth of a beam. What happens to its bending stress, roughly?', options: ['It doubles', 'It halves', 'It falls to a quarter', 'It stays the same'], answer: 2, why: 'Stress in a rectangular beam goes as 1 over depth squared, so double the depth means about a quarter of the stress.' },
  ],
  reel: [
    { ms: 5000, caption: 'A bridge does one job: pass weight sideways to solid ground.', set: { at: 0.1, load: 1.5, depth: 0.5, show: true }, anim: { at: [0.1, 0.9] }, view: { pos: [1, 5.2, 15], target: [0, 1.8, 0] }, spin: 0 },
    { ms: 5000, caption: 'Load it and the top is squeezed, the bottom is stretched.', set: { at: 0.5, load: 3, depth: 0.5, show: true }, anim: { load: [0.8, 3.2] }, view: { pos: [2, 2.4, 9], target: [0, 2.2, 0] }, spin: 0 },
  ],
  build({ stage, s }) {
    widenShadow(stage, 16);
    const root = new THREE.Group(); stage.root.add(root);
    root.add(river(36));
    // abutments
    const abutMats = [forceMat(), forceMat()];
    const abutL = block(2.3, 2, 2.6, -5.35, 1, 0, abutMats[0]), abutR = block(2.3, 2, 2.6, 5.35, 1, 0, abutMats[1]);
    root.add(abutL, abutR);
    // deck: NS segments, each a top (compression) and bottom (tension) half
    const segs = [];
    for (let i = 0; i < NS; i++) {
      const topMat = forceMat(), botMat = forceMat();
      const top = box(1, 1, 1, topMat), bot = box(1, 1, 1, botMat);
      top.userData.u = bot.userData.u = (i + 0.5) / NS;
      root.add(top, bot); segs.push({ top, bot, topMat, botMat });
    }
    stage.pickables = segs.flatMap((g) => [g.top, g.bot]);
    // load: a cart with a downward arrow, and reaction arrows under the supports
    const cart = new THREE.Group();
    const body = box(1.0, 0.5, 1.2, M.plastic(COL.warn, { emissive: 0x553300 })); body.position.y = 0.25; cart.add(body);
    const wheels = [[-0.3, 0.45], [0.3, 0.45], [-0.3, -0.45], [0.3, -0.45]];
    wheels.forEach(([x, z]) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 20), M.matte(0x222630)); w.rotation.x = Math.PI / 2; w.position.set(x, 0.0, z * 1.1); cart.add(w); });
    root.add(cart);
    const loadArrow = arrow(COL.warn, 1.5, 0.3, 0.07); loadArrow.rotation.z = Math.PI; root.add(loadArrow);
    const reL = arrow(COL.c, 1, 0.3, 0.07), reR = arrow(COL.c, 1, 0.3, 0.07); root.add(reL, reR);
    const lblLoad = stage.label('Load', [0, 4, 0], root, 'hot');
    stage.label('Top: squeezed', [0, DECK_Y + 1.8, 1.5], root);
    stage.label('Bottom: stretched', [0, 0.9, 1.5], root);
    const lblL = stage.label('', [-5.35, -1.8, 0], root), lblR = stage.label('', [5.35, -1.8, 0], root);

    // drag the cart: pointer on the deck or the cart, move along x
    const el = stage.renderer.domElement, ray = new THREE.Raycaster(), v = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -DECK_Y - 0.4), hitp = new THREE.Vector3();
    let dragging = false, drive = 0;
    const ndc = (e) => { const b = el.getBoundingClientRect(); v.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1); ray.setFromCamera(v, stage.camera); };
    const toAt = (e) => { ndc(e); if (ray.ray.intersectPlane(plane, hitp)) s.at = clamp((hitp.x + L / 2) / L, 0, 1); };
    const down = (e) => {
      ndc(e);
      const hits = ray.intersectObjects([...stage.pickables, body], true);
      if (hits.length) { dragging = true; drive = 0; stage.controls.enabled = false; toAt(e); el.setPointerCapture?.(e.pointerId); }
    };
    const move = (e) => { if (dragging) toAt(e); };
    const up = () => { if (dragging) { dragging = false; stage.controls.enabled = true; } };
    el.addEventListener('pointerdown', down); window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);

    const rows = { RL: 0, RR: 0, M: 0, sig: 0 };
    return {
      update(dt, st) {
        if (drive) { st.at = clamp(st.at + drive * dt * 0.16, 0, 1); if (st.at >= 1 || st.at <= 0) drive *= -1; }
        const P = st.load, d = st.depth, a = st.at * L, b = L - a;
        const RL = (P * b) / L, RR = (P * a) / L;
        const stiff = Math.pow(0.5 / d, 3);
        const dMid = 0.34 * (P / 1.5) * stiff;
        const vis = 1.1 * Math.tanh(dMid / 1.1) / Math.max(1e-6, dMid);              // soft limit on the drawn sag
        // deflection shape, normalised so a load at mid-span gives dMid*vis units of sag
        const shape = (x) => { const [xx, aa, bb] = x <= a ? [x, a, b] : [L - x, b, a]; return (bb * xx * (L * L - bb * bb - xx * xx)) / (6 * L); };
        const ref = (5 * (L * L - 50)) / 12 * 5 / 5; // shape under a mid-span load: 5·5·50/(6·10) = 20.83
        const sagAt = (x) => -(shape(x) / ref) * dMid * vis;
        const Mmax = (x) => (x <= a ? RL * x : RR * (L - x));
        const Mpeak = (P * a * b) / L, sig = Mpeak / (d * d);
        const x0 = -L / 2;
        for (let i = 0; i < NS; i++) {
          const xa = (i / NS) * L, xb = ((i + 1) / NS) * L, xm = (xa + xb) / 2, ym = sagAt(xm);
          const slope = Math.atan2(sagAt(xb) - sagAt(xa), xb - xa);
          const g = segs[i], cy = DECK_Y + d / 2 + ym, len = (L / NS) * 1.03;
          for (const [mesh, mat, sgn] of [[g.top, g.topMat, -1], [g.bot, g.botMat, 1]]) {
            mesh.scale.set(len, d / 2, 2); mesh.position.set(x0 + xm, cy + (sgn === -1 ? d / 4 : -d / 4), 0); mesh.rotation.z = slope;
            if (st.show) paint(mat, sgn * (Mmax(xm) / (d * d)), LIMIT); else { mat.color.setHex(COL.deck); mat.emissive.setHex(0); }
          }
        }
        const ya = sagAt(a);
        cart.position.set(x0 + a, DECK_Y + d + ya, 0);
        cart.rotation.z = 0;
        loadArrow.set(0.5 + P * 0.35); loadArrow.position.set(x0 + a, DECK_Y + d + ya + 0.5 + P * 0.35 + 0.5, 0);
        lblLoad.position.set(x0 + a, DECK_Y + d + ya + 1.0 + P * 0.35 + 0.9, 0);
        const rl = RL / 4 * 2.4, rr = RR / 4 * 2.4;
        reL.set(Math.max(0.01, rl)); reL.position.set(-5.35, -Math.max(0.01, rl), 0);
        reR.set(Math.max(0.01, rr)); reR.position.set(5.35, -Math.max(0.01, rr), 0);
        const ab = [RL, RR];
        abutMats.forEach((m, i) => { if (st.show) paint(m, -ab[i], 3); else { m.color.setHex(COL.stone); m.emissive.setHex(0); } });
        lblL.element.innerHTML = `Pushes up ${RL.toFixed(2)}`; lblR.element.innerHTML = `Pushes up ${RR.toFixed(2)}`;
        rows.RL = RL; rows.RR = RR; rows.M = Mpeak; rows.sig = sig / LIMIT;
        cart.visible = true;
      },
      pick(o) { if (o.userData.u !== undefined) { s.at = o.userData.u; drive = 0; } },
      drive() { drive = drive ? 0 : 1; if (!drive) return; s.at = 0; },
      dispose() { el.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); stage.controls.enabled = true; },
      readout(st) {
        const over = rows.sig > 1;
        return `<div class="big">${over ? 'Overloaded' : 'Holding'}</div>
          <p class="r-say">${legend}</p>
          <div class="row"><span>Left support pushes up</span><b>${rows.RL.toFixed(2)} of ${st.load.toFixed(1)}</b></div>
          <div class="row"><span>Right support pushes up</span><b>${rows.RR.toFixed(2)} of ${st.load.toFixed(1)}</b></div>
          <div class="row"><span>Edge stress vs limit</span><b style="color:${over ? '#ffb547' : 'inherit'}">${Math.round(rows.sig * 100)}%</b></div>`;
      },
    };
  },
};
