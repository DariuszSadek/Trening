// Sylwetka ćwiczenia – widok z boku, postać zwrócona w prawo.
// Jednostki: centymetry, y w górę od podłogi (y = 0). Kąty w stopniach, 0° = w prawo, 90° = w górę.
// Kończyny liczone odwrotną kinematyką (IK) dwóch odcinków: podajesz biodro, kąt tułowia,
// punkty kostek i dłoni – kolana i łokcie wyliczają się same, długości odcinków są stałe.

export const L = { shin: 44, thigh: 45, torso: 50, neck: 8, head: 10.5, uarm: 32, farm: 30, foot: 20, heel: 5 };

const rad = d => d * Math.PI / 180;
const dir = d => [Math.cos(rad(d)), Math.sin(rad(d))];
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const len = v => Math.hypot(v[0], v[1]);
const lerp = (a, b, t) => a + (b - a) * t;

// IK dwóch odcinków: root, cel, długości, side = +1 / -1 (po której stronie linii root→cel leży staw środkowy).
function ik(root, target, l1, l2, side) {
  const v = sub(target, root);
  let d = len(v);
  const maxd = l1 + l2 - 0.01;
  const base = Math.atan2(v[1], v[0]);
  if (d > maxd) d = maxd;
  if (d < Math.abs(l1 - l2) + 0.01) d = Math.abs(l1 - l2) + 0.01;
  const a = Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d));
  const mid = [root[0] + l1 * Math.cos(base + side * a), root[1] + l1 * Math.sin(base + side * a)];
  const end = [root[0] + d * Math.cos(base), root[1] + d * Math.sin(base)];
  return { mid, end };
}

// Pozycja → stawy
export function joints(p) {
  const hip = p.hip;
  const sh = add(hip, dir(p.torso), L.torso);
  const neckA = p.neck ?? p.torso;
  const neckTop = add(sh, dir(neckA), L.neck);
  const head = add(neckTop, dir(neckA), L.head);
  const back = add(add(sh, dir(p.torso + 90), 7), dir(p.torso), -3); // gryf na plecach (high-bar)
  const front = add(add(sh, dir(p.torso - 90), 9), dir(p.torso), -4); // gryf z przodu (front rack / goblet)
  const chest = add(add(hip, dir(p.torso), L.torso * 0.78), dir(p.torso - 90), 9);
  const refs = { back, front, chest, sh, hip };
  const tgt = (v, off) => { let r = typeof v === 'string' ? refs[v] : v; return off ? add(r, off) : r; };
  const hN = tgt(p.handN, p.handNoff), hF = tgt(p.handF ?? p.handN, p.handFoff ?? p.handNoff);
  const fv = !!p.front; // widok z przodu: barki i biodra rozstawione na boki
  const shN = fv ? add(sh, dir(p.torso - 90), 17) : sh, shF = fv ? add(sh, dir(p.torso + 90), 17) : sh;
  const hipN = fv ? add(hip, dir(p.torso - 90), 9) : hip, hipF = fv ? add(hip, dir(p.torso + 90), 9) : hip;
  const legN = ik(hipN, p.ankleN, L.thigh, L.shin, p.kneeN ?? 1);
  const legF = ik(hipF, p.ankleF ?? p.ankleN, L.thigh, L.shin, p.kneeF ?? p.kneeN ?? 1);
  const ua = L.uarm * (p.uaS ?? 1), fa = L.farm * (p.faS ?? 1);
  const uaF = L.uarm * (p.uaSF ?? p.uaS ?? 1), faF = L.farm * (p.faSF ?? p.faS ?? 1);
  const armN = ik(shN, hN, ua, fa, p.elbowN ?? -1);
  const armF = ik(shF, hF, uaF, faF, p.elbowF ?? p.elbowN ?? -1);
  return {
    hip, sh, neckTop, head, shN, shF, hipN, hipF, front: fv, bend: p.bend || 0, torsoA: p.torso,
    kneeN: legN.mid, ankleN: legN.end, kneeF: legF.mid, ankleF: legF.end,
    elbowN: armN.mid, handN: armN.end, elbowF: armF.mid, handF: armF.end,
    back, front, chest,
    footN: p.footN ?? 0, footF: p.footF ?? p.footN ?? 0,
  };
}

// Interpolacja dwóch pozycji (wartości liczbowe i pary [x,y])
function mix(a, b, t) {
  if (typeof a === 'number' && typeof b === 'number') return lerp(a, b, t);
  if (Array.isArray(a) && Array.isArray(b)) return a.map((v, i) => lerp(v, b[i], t));
  if (a && typeof a === 'object' && b && typeof b === 'object') {
    const o = {};
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) o[k] = (k in a && k in b) ? mix(a[k], b[k], t) : (k in a ? a[k] : b[k]);
    return o;
  }
  return t < 0.5 ? a : b;
}
const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

// Oś czasu: spec.tl = [[indeks pozycji, czas s], ...]; zaczyna od poses[tl[0][0]]
export function poseAt(spec, tsec) {
  const P = spec.poses;
  const tl = spec.tl || (P.length > 1 ? [[0, 0.7], [1, 1.6], [1, 0.5], [0, 1.4]] : [[0, 1]]);
  const total = tl.reduce((s, x) => s + x[1], 0);
  let t = ((tsec % total) + total) % total;
  let cur = tl[0][0];
  for (const [to, dur] of tl) {
    if (t <= dur) {
      if (to === cur) return P[cur];
      return mix(P[cur], P[to], ease(t / dur));
    }
    t -= dur; cur = to;
  }
  return P[cur];
}

function pt(J, pose, ref) {
  if (Array.isArray(ref)) return ref;
  if (pose.pts && pose.pts[ref]) return pose.pts[ref];
  return J[ref];
}

// ── rysowanie ────────────────────────────────────────────────────────────────
const f = n => (Math.round(n * 10) / 10);
function line(a, b, cls, w) { return `<line x1="${f(a[0])}" y1="${f(-a[1])}" x2="${f(b[0])}" y2="${f(-b[1])}" class="${cls}"${w ? ` stroke-width="${w}"` : ''}/>`; }
function circ(c, r, cls) { return `<circle cx="${f(c[0])}" cy="${f(-c[1])}" r="${r}" class="${cls}"/>`; }
function poly(ps, cls) { return `<polygon points="${ps.map(p => f(p[0]) + ',' + f(-p[1])).join(' ')}" class="${cls}"/>`; }
function pline(ps, cls, w) { return `<polyline points="${ps.map(p => f(p[0]) + ',' + f(-p[1])).join(' ')}" class="${cls}"${w ? ` stroke-width="${w}"` : ''}/>`; }

function drawEquip(e, J, pose) {
  const out = [];
  const p = e.at ? pt(J, pose, e.at) : null;
  switch (e.t) {
    case 'plate': { // talerz sztangi (widok z boku) – środek = gryf
      const c = e.off ? add(p, e.off) : p;
      out.push(circ(c, e.r || 22, 'eq-fill'), circ(c, 3, 'eq-dot')); break;
    }
    case 'db': { // hantel: widok z boku (głowice z przodu i z tyłu dłoni) lub od czoła
      const ang = typeof e.ang === 'string' ? pose[e.ang] : (e.ang ?? 0);
      if (e.end) { out.push(circ(p, 7.5, 'eq-fill'), circ(p, 2.5, 'eq-dot')); }
      else {
        const d = dir(ang);
        const a = add(p, d, -10), b = add(p, d, 10);
        out.push(line(a, b, 'eq', 3), line(add(a, d, -0), add(a, d, 0), 'eq'),
          line(add(a, d, -3), add(a, d, 3), 'eq-head'), line(add(b, d, -3), add(b, d, 3), 'eq-head'));
      }
      break;
    }
    case 'kb': { // kettlebell pod dłonią
      const down = dir((typeof e.ang === 'string' ? pose[e.ang] : (e.ang ?? -90)));
      const c = add(p, down, 11);
      out.push(circ(c, 9, 'eq-fill'), line(p, add(p, down, 3), 'eq', 3)); break;
    }
    case 'bench': { // ławka: odcinek a→b (siedzisko/oparcie), nóżki do podłogi
      const a = e.a, b = e.b;
      out.push(line(a, b, 'eq-pad'));
      for (const x of e.legs || []) out.push(line([x[0], x[1]], [x[0], 0], 'eq', 3));
      break;
    }
    case 'rect': out.push(poly([[e.x, e.y], [e.x + e.w, e.y], [e.x + e.w, e.y + e.h], [e.x, e.y + e.h]], 'eq-fill')); break;
    case 'bar': out.push(line([e.x - 14, e.y], [e.x + 14, e.y], 'eq', 2.5), circ([e.x, e.y], 2.8, 'eq-dot')); break;
    case 'cable': {
      const from = pt(J, pose, e.from);
      out.push(line(from, p, 'cable'), circ(from, 4, 'eq-fill'));
      if (e.column) out.push(line([from[0] + (e.column > 0 ? 6 : -6), from[1] + 10], [from[0] + (e.column > 0 ? 6 : -6), 0], 'eq', 5));
      if (e.handle) out.push(line(add(p, [0, -5]), add(p, [0, 5]), 'eq', 3));
      break;
    }
    case 'band': out.push(line(pt(J, pose, e.from), p, 'band')); break;
    case 'stick': out.push(line(pt(J, pose, e.a), pt(J, pose, e.b), 'eq', e.w || 3)); break;
    case 'roller': out.push(circ(p, e.r || 7.5, 'eq-fill')); break;
    case 'slope': out.push(line(e.a, e.b, 'eq', 3)); break;
    case 'seg': out.push(line(pt(J, pose, e.a), pt(J, pose, e.b), e.cls || 'eq', e.w || 3)); break;
    case 'poly': out.push(poly(e.p.map(q => pt(J, pose, q)), e.cls || 'eq-fill')); break;
    case 'wall': out.push(line([e.x, 0], [e.x, e.h || 200], 'eq', 4)); break;
    case 'loop': { // guma: pętla od punktu do stawu
      const a = pt(J, pose, e.from); out.push(line(a, p, 'band')); break;
    }
    case 'arrow': {
      const a = pt(J, pose, e.a), b = pt(J, pose, e.b);
      const d = sub(b, a), l = len(d) || 1, u = [d[0] / l, d[1] / l], n = [-u[1], u[0]];
      out.push(line(a, b, 'arrow'), poly([b, add(add(b, u, -6), n, 3.5), add(add(b, u, -6), n, -3.5)], 'arrow-head'));
      break;
    }
  }
  return out.join('');
}

function leg(J, s, cls) {
  const hip = J['hip' + s], knee = J['knee' + s], ankle = J['ankle' + s], fa = J['foot' + s];
  const d = dir(fa);
  const fl = J.shortFeet ? 0.35 : 1;
  const heel = add(ankle, d, -L.heel * fl), toe = add(ankle, d, (L.foot - L.heel) * fl);
  return pline([hip, knee, ankle], cls) + line(heel, toe, cls + ' foot');
}
function arm(J, s, cls) {
  return pline([J['sh' + s], J['elbow' + s], J['hand' + s]], cls) + circ(J['hand' + s], 3.2, cls + '-hand');
}

// Zwraca wnętrze SVG dla pozycji
export function drawPose(spec, pose) {
  const J = joints(pose);
  J.shortFeet = !!spec.shortFeet;
  const eq = spec.eq || [];
  const back = eq.filter(e => e.z === 'back' || (['bench', 'rect', 'slope', 'wall', 'roller'].includes(e.t) && e.z !== 'front'));
  const mid = eq.filter(e => !back.includes(e) && e.z !== 'front');
  const front = eq.filter(e => e.z === 'front');
  let s = '';
  s += back.map(e => drawEquip(e, J, pose)).join('');
  const farCls = J.front ? 'limb near' : 'limb far';
  if (!spec.oneLeg) s += leg(J, 'F', farCls);
  if (!spec.oneArm) s += arm(J, 'F', farCls);
  s += mid.filter(e => e.z === 'mid').map(e => drawEquip(e, J, pose)).join('');
  if (J.bend) {
    const m = [(J.hip[0] + J.sh[0]) / 2, (J.hip[1] + J.sh[1]) / 2];
    const c = add(m, dir(J.torsoA + 90), J.bend * 2);
    s += `<path d="M${f(J.hip[0])} ${f(-J.hip[1])} Q${f(c[0])} ${f(-c[1])} ${f(J.sh[0])} ${f(-J.sh[1])}" class="torso"/>`;
  } else s += line(J.hip, J.sh, 'torso');
  if (J.front) s += line(J.shF, J.shN, 'torso') + line(J.hipF, J.hipN, 'torso');
  s += line(J.sh, J.neckTop, 'limb near');
  s += circ(J.head, L.head, 'head');
  s += leg(J, 'N', 'limb near');
  s += mid.filter(e => e.z !== 'mid').map(e => drawEquip(e, J, pose)).join('');
  s += arm(J, 'N', 'limb near');
  s += front.map(e => drawEquip(e, J, pose)).join('');
  return s;
}

// Obwiednia wszystkich klatek → viewBox
export function bbox(spec) {
  let x0 = 1e9, x1 = -1e9, y0 = 0, y1 = -1e9;
  const P = spec.poses;
  const steps = 12;
  const take = (p, r = 0) => { x0 = Math.min(x0, p[0] - r); x1 = Math.max(x1, p[0] + r); y0 = Math.min(y0, p[1] - r); y1 = Math.max(y1, p[1] + r); };
  for (let i = 0; i < P.length; i++) for (let k = 0; k <= steps; k++) {
    const pose = i + 1 < P.length ? mix(P[i], P[i + 1], k / steps) : P[i];
    const J = joints(pose);
    for (const key of ['hip', 'sh', 'shN', 'shF', 'kneeN', 'ankleN', 'kneeF', 'ankleF', 'elbowN', 'handN', 'elbowF', 'handF']) take(J[key], 4);
    take(J.head, L.head + 3);
    take(add(J.ankleN, dir(J.footN), L.foot), 3); take(add(J.ankleF, dir(J.footF), L.foot), 3);
    for (const e of spec.eq || []) {
      if (e.t === 'plate') take(e.off ? add(pt(J, pose, e.at), e.off) : pt(J, pose, e.at), (e.r || 22) + 2);
      if (e.t === 'bench') { take(e.a, 5); take(e.b, 5); }
      if (e.t === 'rect') { take([e.x, e.y]); take([e.x + e.w, e.y + e.h]); }
      if (e.t === 'bar') take([e.x, e.y], 16);
      if (e.t === 'cable') take(pt(J, pose, e.from), 6);
      if (e.t === 'band') take(pt(J, pose, e.from), 3);
      if (e.t === 'kb') take(add(pt(J, pose, e.at), dir(typeof e.ang === 'string' ? pose[e.ang] : (e.ang ?? -90)), 11), 10);
      if (e.t === 'db') take(pt(J, pose, e.at), 12);
      if (e.t === 'slope') { take(e.a, 3); take(e.b, 3); }
      if (e.t === 'roller') take(pt(J, pose, e.at), (e.r || 7.5) + 2);
      if (e.t === 'seg') { take(pt(J, pose, e.a), 3); take(pt(J, pose, e.b), 3); }
      if (e.t === 'poly') e.p.forEach(q => take(pt(J, pose, q), 2));
      if (e.t === 'wall') { take([e.x, 0], 4); take([e.x, Math.min(e.h || 200, 60)], 4); }
    }
  }
  const pad = 8;
  x0 -= pad; x1 += pad; y1 += pad; y0 = spec.noFloor ? y0 - pad : Math.min(y0, 0) - 6;
  // proporcje 4:3 (szer.:wys.)
  let w = x1 - x0, h = y1 - y0;
  const ar = spec.ar || 4 / 3;
  if (w / h < ar) { const nw = h * ar; x0 -= (nw - w) / 2; w = nw; } else { const nh = w / ar; y1 += (nh - h); h = nh; }
  return { x: x0, y: -y1, w, h };
}

export function svgString(spec, tsec = null, opts = {}) {
  const b = bbox(spec);
  const pose = tsec == null ? spec.poses[opts.frame ?? 0] : poseAt(spec, tsec);
  const floor = `<line x1="${f(b.x)}" y1="0" x2="${f(b.x + b.w)}" y2="0" class="floor"/>`;
  const style = opts.inlineStyle ? `<style>${INLINE_CSS}</style>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(b.x)} ${f(b.y)} ${f(b.w)} ${f(b.h)}" class="fig">${style}${spec.noFloor ? '' : floor}<g>${drawPose(spec, pose)}</g></svg>`;
}

// Style do eksportu PNG (bez CSS aplikacji)
export const INLINE_CSS = `
.limb,.torso{fill:none;stroke-linecap:round;stroke-linejoin:round}
.near{stroke:#1f3b5f;stroke-width:7}.far{stroke:#9fb1c7;stroke-width:6.5}
.torso{stroke:#1f3b5f;stroke-width:10}.foot{stroke-width:5}
.head{fill:#1f3b5f}.near-hand{fill:#1f3b5f}.far-hand{fill:#9fb1c7}
.eq{stroke:#555;fill:none;stroke-linecap:round}.eq-head{stroke:#555;stroke-width:6;stroke-linecap:round}
.eq-fill{fill:#d9d4c7;fill-opacity:.78;stroke:#555;stroke-width:2}.eq-dot{fill:#555}
.eq-pad{stroke:#8a7f6a;stroke-width:8;stroke-linecap:round}
.cable{stroke:#777;stroke-width:1.5}.band{stroke:#c0392b;stroke-width:2;stroke-dasharray:4 3}
.floor{stroke:#bbb;stroke-width:2}.arrow{stroke:#c0392b;stroke-width:2}.arrow-head{fill:#c0392b}`;

// Animacja w elemencie DOM
export function animate(el, spec) {
  let raf = 0, t0 = performance.now(), stopped = false;
  const b = bbox(spec);
  el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(b.x)} ${f(b.y)} ${f(b.w)} ${f(b.h)}" class="fig" role="img"><line x1="${f(b.x)}" y1="0" x2="${f(b.x + b.w)}" y2="0" class="floor"/><g></g></svg>`;
  const g = el.querySelector('g');
  const still = spec.poses.length < 2;
  const frame = now => {
    if (stopped) return;
    const t = (now - t0) / 1000;
    g.innerHTML = drawPose(spec, poseAt(spec, t));
    if (!still) raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return { stop() { stopped = true; cancelAnimationFrame(raf); } };
}
