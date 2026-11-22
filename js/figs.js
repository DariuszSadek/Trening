// Sylwetki ćwiczeń: pozycje kluczowe (poses) + sprzęt (eq). Widok z boku, postać zwrócona w prawo.
// hip [x,y], torso (kąt biodro→bark), ankleN/F, handN/F (punkt albo 'back' | 'front' | 'chest'),
// kneeN/elbowN = strona zgięcia (+1 / −1). Jednostki: cm, podłoga y = 0, kostka y ≈ 7.

const stand = { hip: [6, 95], torso: 90, neck: 90, ankleN: [8, 7], ankleF: [4, 7], handN: [8, 86], handF: [4, 86] };
const S = (o) => ({ ...stand, ...o });
const PLATE = (at = 'handN', z) => ({ t: 'plate', at, z });

export const FIG = {
  // ── BOJE I ĆWICZENIA SIŁOWE ────────────────────────────────────────────────
  przysiad: {
    poses: [
      S({ hip: [6, 94], torso: 84, neck: 88, handN: 'back', handNoff: [-4, 5], handF: 'back', handFoff: [-7, 5], elbowN: 1 }),
      S({ hip: [-14, 40], torso: 48, neck: 62, ankleN: [8, 7], ankleF: [4, 7], handN: 'back', handNoff: [-4, 5], handF: 'back', handFoff: [-7, 5], elbowN: 1 }),
    ],
    tl: [[0, 0.6], [1, 1.8], [1, 0.4], [0, 1.2]],
    eq: [{ t: 'plate', at: 'back', z: 'back' }],
  },
  martwy: {
    poses: [
      S({ hip: [-22, 54], torso: 36, neck: 30, ankleN: [8, 7], ankleF: [4, 7], handN: [14, 22], handF: [12, 22] }),
      S({ hip: [5, 95], torso: 92, neck: 90, handN: [13, 85], handF: [11, 85] }),
    ],
    tl: [[0, 0.8], [1, 1.4], [1, 0.6], [0, 1.6]],
    eq: [{ t: 'plate', at: 'handN', z: 'back' }],
  },
  wyciskanie_lezac: {
    poses: [
      { hip: [30, 53], torso: 177, neck: 180, ankleN: [74, 7], ankleF: [70, 7], kneeN: 1, handN: [-14, 113], handF: [-16, 113], footN: 0 },
      { hip: [30, 53], torso: 177, neck: 180, ankleN: [74, 7], ankleF: [70, 7], kneeN: 1, handN: [-8, 73], handF: [-10, 73], footN: 0 },
    ],
    tl: [[0, 0.6], [1, 1.8], [1, 0.6], [0, 1.0]],
    eq: [{ t: 'bench', a: [-62, 43], b: [56, 43], legs: [[-50, 40], [46, 40]] }, { t: 'plate', at: 'handN', z: 'front' }],
  },
  podciaganie: {
    noFloor: true,
    poses: [
      { hip: [-8, 118], torso: 86, neck: 90, ankleN: [-20, 34], ankleF: [-24, 36], kneeN: 1, handN: [2, 229], handF: [0, 229] },
      { hip: [-23.5, 175], torso: 72, neck: 80, ankleN: [-34, 93], ankleF: [-38, 95], kneeN: 1, handN: [2, 229], handF: [0, 229] },
    ],
    tl: [[0, 0.6], [1, 1.2], [1, 0.5], [0, 1.8]],
    eq: [{ t: 'bar', x: 1, y: 231 }],
  },
  ohp: {
    poses: [
      S({ hip: [6, 95], torso: 90, neck: 92, handN: [16, 142], handF: [14, 142] }),
      S({ hip: [6, 95], torso: 92, neck: 98, handN: [7, 205], handF: [5, 205] }),
    ],
    tl: [[0, 0.6], [1, 1.2], [1, 0.5], [0, 1.6]],
    eq: [{ t: 'plate', at: 'handN', z: 'front' }],
  },
};

const DB = (at = 'handN', o = {}) => ({ t: 'db', at, ...o });
const KB = (at = 'handN', o = {}) => ({ t: 'kb', at, ...o });

Object.assign(FIG, {
  rdl: {
    poses: [
      S({ hip: [5, 95], torso: 90, neck: 90, handN: [12, 84], handF: [10, 84] }),
      S({ hip: [-22, 86], torso: 24, neck: 10, handN: [17, 46], handF: [15, 46] }),
    ],
    tl: [[0, 0.6], [1, 2.0], [1, 0.4], [0, 1.2]],
    eq: [PLATE('handN', 'back')],
  },
  wyciskanie_skos: {
    poses: [
      { hip: [-2, 52], torso: 150, neck: 140, ankleN: [46, 7], ankleF: [42, 7], handN: [-22, 100], handF: [-24, 100] },
      { hip: [-2, 52], torso: 150, neck: 140, ankleN: [46, 7], ankleF: [42, 7], handN: [-37, 136], handF: [-39, 136] },
    ],
    tl: [[0, 0.6], [1, 1.2], [1, 0.5], [0, 2.0]],
    eq: [{ t: 'bench', a: [-10, 44], b: [26, 44], legs: [[8, 42]] }, { t: 'seg', a: [-12, 46], b: [-64, 76], cls: 'eq-pad', w: 8, z: 'back' }, { t: 'seg', a: [-40, 60], b: [-40, 0], w: 3 },
      DB('handN', { end: true, z: 'front' })],
  },
  face_pull: {
    poses: [
      S({ hip: [4, 94], torso: 92, neck: 90, ankleN: [12, 7], ankleF: [-6, 7], handN: [58, 152], handF: [56, 152] }),
      S({ hip: [4, 94], torso: 94, neck: 92, ankleN: [12, 7], ankleF: [-6, 7], handN: [20, 158], handF: [18, 158], elbowN: 1, uaS: 0.4, faS: 0.8 }),
    ],
    tl: [[0, 0.5], [1, 1.0], [1, 0.8], [0, 1.6]],
    eq: [{ t: 'cable', at: 'handN', from: [84, 162], column: 1, handle: true }],
  },
  pallof: {
    poses: [
      S({ hip: [4, 90], torso: 88, neck: 90, ankleN: [16, 7], ankleF: [-8, 7], handN: [18, 118], handF: [16, 118] }),
      S({ hip: [4, 90], torso: 88, neck: 90, ankleN: [16, 7], ankleF: [-8, 7], handN: [62, 120], handF: [60, 120] }),
    ],
    tl: [[0, 0.6], [1, 1.0], [1, 2.0], [0, 1.0]],
    eq: [{ t: 'seg', a: [-2, 0], b: [-2, 175], w: 6, z: 'back' }, { t: 'cable', at: 'handN', from: [-2, 118], handle: true, z: 'back' }],
  },
  wioslowanie_hantlem: {
    poses: [
      { hip: [-22, 92], torso: 8, neck: 5, ankleN: [0, 7], ankleF: [-64, 52], kneeN: 1, kneeF: 1, footF: 180, handN: [31, 42], handF: [30, 50] },
      { hip: [-22, 92], torso: 8, neck: 5, ankleN: [0, 7], ankleF: [-64, 52], kneeN: 1, kneeF: 1, footF: 180, handN: [4, 86], handF: [30, 50] },
    ],
    tl: [[0, 0.5], [1, 1.0], [1, 0.6], [0, 1.8]],
    eq: [{ t: 'bench', a: [-72, 45], b: [40, 45], legs: [[-60, 41], [30, 41]] }, DB('handN', { ang: 0, z: 'front' })],
  },
  goblet: {
    poses: [
      S({ hip: [6, 94], torso: 88, neck: 90, handN: 'front', handNoff: [6, -2], handF: 'front', handFoff: [4, -2] }),
      S({ hip: [-6, 40], torso: 64, neck: 72, handN: 'front', handNoff: [6, -2], handF: 'front', handFoff: [4, -2] }),
    ],
    tl: [[0, 0.6], [1, 2.0], [1, 0.5], [0, 1.3]],
    eq: [KB('handN', { ang: -90, z: 'front' })],
  },
  dipy: {
    noFloor: true,
    poses: [
      { hip: [4, 136], torso: 88, neck: 90, ankleN: [-22, 70], ankleF: [-26, 72], kneeN: 1, handN: [8, 126], handF: [6, 126], uaS: 1, faS: 1 },
      { hip: [-1, 102], torso: 74, neck: 80, ankleN: [-30, 40], ankleF: [-34, 42], kneeN: 1, handN: [8, 126], handF: [6, 126] },
    ],
    tl: [[0, 0.5], [1, 2.0], [1, 0.4], [0, 1.2]],
    eq: [{ t: 'seg', a: [-30, 126], b: [40, 126], w: 4 }, { t: 'seg', a: [36, 126], b: [36, 40], w: 4 }, { t: 'loop', from: [-30, 126], at: 'kneeN' }],
  },
  farmer: {
    poses: [
      S({ hip: [5, 93], torso: 90, neck: 90, ankleN: [26, 9], ankleF: [-16, 11], footF: 22, handN: [8, 82], handF: [4, 82] }),
      S({ hip: [5, 93], torso: 90, neck: 90, ankleN: [-16, 11], ankleF: [26, 9], footN: 22, footF: 0, handN: [8, 82], handF: [4, 82] }),
    ],
    tl: [[0, 0.55], [1, 0.55]],
    eq: [KB('handN', { ang: -90, z: 'front' }), KB('handF', { ang: -90, z: 'mid' })],
  },
  bulgarski: {
    poses: [
      { hip: [-6, 88], torso: 84, neck: 88, ankleN: [30, 7], ankleF: [-50, 52], kneeN: 1, kneeF: 1, footF: 196, handN: [0, 78], handF: [-2, 78] },
      { hip: [-8, 50], torso: 78, neck: 84, ankleN: [30, 7], ankleF: [-50, 52], kneeN: 1, kneeF: 1, footF: 196, handN: [-2, 40], handF: [-4, 40] },
    ],
    tl: [[0, 0.5], [1, 2.0], [1, 0.4], [0, 1.2]],
    eq: [{ t: 'bench', a: [-78, 45], b: [-36, 45], legs: [[-70, 41], [-44, 41]] }, DB('handN', { ang: 0, z: 'front' })],
  },
  hip_thrust: {
    poses: [
      { hip: [10, 24], torso: 144, neck: 120, ankleN: [42, 7], ankleF: [38, 7], kneeN: 1, handN: 'hip', handNoff: [2, 12], handF: 'hip', handFoff: [0, 12] },
      { hip: [20, 55], torso: 180, neck: 150, ankleN: [42, 7], ankleF: [38, 7], kneeN: 1, handN: 'hip', handNoff: [2, 12], handF: 'hip', handFoff: [0, 12] },
    ],
    tl: [[0, 0.5], [1, 1.1], [1, 1.0], [0, 1.4]],
    eq: [{ t: 'bench', a: [-90, 43], b: [-34, 43], legs: [[-80, 39], [-44, 39]] }, { t: 'plate', at: 'hip', off: [2, 12], z: 'front' }],
  },
  wioslowanie_wyciag: {
    poses: [
      { hip: [-10, 52], torso: 72, neck: 72, ankleN: [55, 26], ankleF: [52, 26], kneeN: 1, footN: 80, footF: 80, handN: [62, 86], handF: [60, 86] },
      { hip: [-10, 52], torso: 94, neck: 92, ankleN: [55, 26], ankleF: [52, 26], kneeN: 1, footN: 80, footF: 80, handN: [12, 74], handF: [10, 74] },
    ],
    tl: [[0, 0.5], [1, 1.1], [1, 0.8], [0, 1.6]],
    eq: [{ t: 'bench', a: [-60, 44], b: [12, 44], legs: [[-50, 40], [4, 40]] }, { t: 'seg', a: [64, 14], b: [64, 40], w: 5 }, { t: 'cable', at: 'handN', from: [92, 38], column: 1, handle: true }],
  },
  wznosy_bokiem: {
    shortFeet: true,
    poses: [
      { front: true, hip: [0, 95], torso: 90, neck: 90, ankleN: [11, 7], ankleF: [-11, 7], footN: 0, footF: 180, handN: [22, 86], handF: [-22, 86], elbowN: -1, elbowF: 1 },
      { front: true, hip: [0, 95], torso: 90, neck: 90, ankleN: [11, 7], ankleF: [-11, 7], footN: 0, footF: 180, handN: [76, 140], handF: [-76, 140], elbowN: -1, elbowF: 1 },
    ],
    tl: [[0, 0.5], [1, 1.2], [1, 0.4], [0, 2.0]],
    eq: [DB('handN', { end: true, z: 'front' }), DB('handF', { end: true, z: 'front' })],
  },
  plank_boczny: {
    shortFeet: true,
    poses: [
      { front: true, hip: [6.1, 28.5], torso: 152, neck: 158, ankleN: [94, 27], ankleF: [90, 10], kneeN: 1, kneeF: 1, handN: 'hip', handNoff: [6, 14], handF: [-46, 5], faSF: 0.12, elbowF: 1, elbowN: 1 },
      { front: true, hip: [6.6, 41.4], torso: 166, neck: 166, ankleN: [94, 27], ankleF: [90, 10], kneeN: 1, kneeF: 1, handN: 'hip', handNoff: [6, 14], handF: [-46, 5], faSF: 0.12, elbowF: 1, elbowN: 1 },
    ],
    tl: [[0, 0.8], [1, 1.2], [1, 2.5], [0, 1.0]],
    eq: [],
  },
  kb_swing: {
    poses: [
      S({ hip: [-16, 84], torso: 28, neck: 15, ankleN: [12, 7], ankleF: [8, 7], handN: [-4, 64], handF: [-6, 64], kbA: 215 }),
      S({ hip: [5, 95], torso: 92, neck: 90, ankleN: [12, 7], ankleF: [8, 7], handN: [62, 132], handF: [60, 132], kbA: -12 }),
    ],
    tl: [[0, 0.15], [1, 0.75], [1, 0.1], [0, 0.75]],
    eq: [KB('handN', { ang: 'kbA', z: 'front' })],
  },
});

// ── POMPKI NA GRYFIE (zamiast dipów) ──
Object.assign(FIG, {
  pompki_gryf: {
    poses: [
      { hip: [-37.8, 71.2], torso: 45, neck: 45, ankleN: [-100, 9], ankleF: [-102, 9], footN: -40, footF: -40, handN: [38.6, 65.6], handF: [36.6, 65.6] },
      { hip: [-25.4, 55.6], torso: 32, neck: 30, ankleN: [-100, 9], ankleF: [-102, 9], footN: -40, footF: -40, handN: [38.6, 65.6], handF: [36.6, 65.6] },
    ],
    tl: [[0, 0.5], [1, 2.0], [1, 0.2], [0, 1.0]],
    eq: [{ t: 'seg', a: [48, 0], b: [48, 130], w: 6, z: 'back' }, { t: 'bar', x: 38.6, y: 65.6 }],
  },
});

// ── MOBILNOŚĆ ────────────────────────────────────────────────────────────────
Object.assign(FIG, {
  ankle_rocks: {
    poses: [
      { hip: [-10, 52], torso: 90, neck: 90, ankleN: [30, 7], ankleF: [-52, 7], footF: 180, handN: [58, 100], handF: [56, 100] },
      { hip: [4, 50], torso: 92, neck: 90, ankleN: [30, 7], ankleF: [-52, 7], footF: 180, handN: [58, 100], handF: [56, 100] },
    ],
    tl: [[0, 0.5], [1, 1.2], [1, 0.6], [0, 1.0]],
    eq: [{ t: 'wall', x: 64, h: 190 }],
  },
  goblet_hold: {
    poses: [
      S({ hip: [-6, 40], torso: 66, neck: 72, handN: 'front', handNoff: [6, -2], handF: 'front', handFoff: [4, -2] }),
      S({ hip: [-4, 38], torso: 70, neck: 74, handN: 'front', handNoff: [6, -2], handF: 'front', handFoff: [4, -2] }),
    ],
    tl: [[0, 1.2], [1, 1.2], [0, 1.2]],
    eq: [KB('handN', { ang: -90, z: 'front' })],
  },
  deep_squat: {
    poses: [
      S({ hip: [-6, 34], torso: 68, neck: 74, handN: 'front', handNoff: [12, -10], handF: 'front', handFoff: [10, -10] }),
      S({ hip: [-2, 32], torso: 72, neck: 76, handN: 'front', handNoff: [12, -10], handF: 'front', handFoff: [10, -10] }),
    ],
    tl: [[0, 1.2], [1, 1.2], [0, 1.2]],
  },
  couch_stretch: {
    poses: [
      { hip: [-27, 50], torso: 68, neck: 70, ankleN: [40, 7], ankleF: [-42, 52], kneeN: 1, kneeF: 1, footF: 95, handN: [36, 56], handF: [34, 56] },
      { hip: [-20, 50], torso: 94, neck: 92, ankleN: [40, 7], ankleF: [-42, 52], kneeN: 1, kneeF: 1, footF: 95, handN: 'hip', handNoff: [6, 4], handF: 'hip', handFoff: [4, 4], elbowN: 1 },
    ],
    tl: [[0, 0.8], [1, 1.6], [1, 2.0], [0, 1.2]],
    eq: [{ t: 'wall', x: -47, h: 120 }],
  },
  cat_camel: {
    poses: [
      { hip: [-25, 53], torso: 14, neck: -10, bend: 0, ankleN: [-66, 7], ankleF: [-68, 7], footN: 180, footF: 180, kneeN: -1, handN: [24, 5], handF: [22, 5] },
      { hip: [-25, 55], torso: 14, neck: -65, bend: 9, ankleN: [-66, 7], ankleF: [-68, 7], footN: 180, footF: 180, kneeN: -1, handN: [24, 5], handF: [22, 5] },
      { hip: [-25, 52], torso: 13, neck: 35, bend: -6, ankleN: [-66, 7], ankleF: [-68, 7], footN: 180, footF: 180, kneeN: -1, handN: [24, 5], handF: [22, 5] },
    ],
    tl: [[0, 0.4], [1, 1.6], [1, 0.6], [2, 2.0], [2, 0.6], [0, 1.2]],
  },
  thoracic_roller: {
    poses: [
      { hip: [28, 12], torso: 172, neck: 172, ankleN: [66, 7], ankleF: [62, 7], kneeN: 1, handN: [-37, 30], handF: [-39, 30], elbowN: 1 },
      { hip: [28, 12], torso: 184, neck: 196, bend: -5, ankleN: [66, 7], ankleF: [62, 7], kneeN: 1, handN: [-38, 20], handF: [-40, 20], elbowN: 1 },
    ],
    tl: [[0, 0.6], [1, 1.6], [1, 1.2], [0, 1.4]],
    eq: [{ t: 'roller', at: [-6, 8], r: 8, z: 'back' }],
  },
  hip_distraction: {
    poses: [
      { hip: [-10, 52], torso: 90, neck: 90, ankleN: [32, 7], ankleF: [-52, 7], footF: 180, handN: [26, 60], handF: [24, 60] },
      { hip: [6, 48], torso: 92, neck: 90, ankleN: [32, 7], ankleF: [-52, 7], footF: 180, handN: [30, 56], handF: [28, 56] },
    ],
    tl: [[0, 0.5], [1, 1.4], [1, 1.0], [0, 1.0]],
    eq: [{ t: 'seg', a: [-95, 0], b: [-95, 70], w: 5 }, { t: 'band', from: [-95, 52], at: 'hip' }],
  },
  hamstring_stretch: {
    poses: [
      { hip: [0, 92], torso: 90, neck: 90, ankleN: [74, 52], ankleF: [0, 7], footN: 78, kneeN: 1, handN: [12, 84], handF: [10, 84] },
      { hip: [-10, 90], torso: 42, neck: 36, ankleN: [74, 52], ankleF: [0, 7], footN: 78, kneeN: 1, handN: [44, 66], handF: [42, 66] },
    ],
    tl: [[0, 0.6], [1, 1.8], [1, 1.5], [0, 1.2]],
    eq: [{ t: 'bench', a: [52, 45], b: [100, 45], legs: [[60, 41], [92, 41]] }],
  },
  child_pose: {
    poses: [
      { hip: [-28, 30], torso: -12, neck: -14, ankleN: [-40, 7], ankleF: [-42, 7], footN: 180, footF: 180, handN: [74, 6], handF: [72, 6] },
      { hip: [-36, 22], torso: -8, neck: -10, ankleN: [-40, 7], ankleF: [-42, 7], footN: 180, footF: 180, handN: [74, 6], handF: [72, 6] },
    ],
    tl: [[0, 1.0], [1, 1.6], [1, 1.5], [0, 1.2]],
  },
  dead_bug: {
    poses: [
      { hip: [20, 12], torso: 180, neck: 180, ankleN: [64, 57], ankleF: [62, 57], kneeN: 1, kneeF: 1, footN: 0, footF: 0, handN: [-30, 74], handF: [-32, 74] },
      { hip: [20, 12], torso: 180, neck: 180, ankleN: [64, 57], ankleF: [106, 20], kneeN: 1, kneeF: 1, footN: 0, footF: 0, handN: [-88, 20], handF: [-32, 74] },
    ],
    tl: [[0, 0.6], [1, 1.6], [1, 0.8], [0, 1.4]],
  },
  pullover: {
    poses: [
      { hip: [30, 53], torso: 177, neck: 180, ankleN: [74, 7], ankleF: [70, 7], kneeN: 1, handN: [-22, 112], handF: [-24, 112] },
      { hip: [30, 53], torso: 177, neck: 180, ankleN: [74, 7], ankleF: [70, 7], kneeN: 1, handN: [-78, 78], handF: [-80, 78], elbowN: 1 },
    ],
    tl: [[0, 0.6], [1, 2.0], [1, 2.0], [0, 1.4]],
    eq: [{ t: 'bench', a: [-62, 43], b: [56, 43], legs: [[-50, 40], [46, 40]] }, DB('handN', { ang: 90, z: 'front' })],
  },
  lat_stretch_rack: {
    poses: [
      { hip: [-26, 90], torso: 22, neck: 18, ankleN: [6, 7], ankleF: [2, 7], handN: [84, 100], handF: [82, 100] },
      { hip: [-36, 88], torso: -6, neck: -8, ankleN: [6, 7], ankleF: [2, 7], handN: [84, 100], handF: [82, 100] },
    ],
    tl: [[0, 0.8], [1, 1.6], [1, 1.6], [0, 1.2]],
    eq: [{ t: 'seg', a: [90, 0], b: [90, 190], w: 6 }],
  },
});

// ── PLAN SYNÓW (początkujący) ───────────────────────────────────────────────
Object.assign(FIG, {
  wyciskanie_hantli: {
    poses: [
      { hip: [30, 53], torso: 177, neck: 180, ankleN: [74, 7], ankleF: [70, 7], kneeN: 1, handN: [-14, 113], handF: [-16, 113] },
      { hip: [30, 53], torso: 177, neck: 180, ankleN: [74, 7], ankleF: [70, 7], kneeN: 1, handN: [-6, 76], handF: [-8, 76] },
    ],
    tl: [[0, 0.6], [1, 2.0], [1, 0.4], [0, 1.2]],
    eq: [{ t: 'bench', a: [-62, 43], b: [56, 43], legs: [[-50, 40], [46, 40]] }, DB('handN', { end: true, z: 'front' })],
  },
  sciaganie_drazka: {
    poses: [
      { hip: [0, 55], torso: 96, neck: 96, ankleN: [46, 7], ankleF: [42, 7], kneeN: 1, handN: [4, 166], handF: [2, 166] },
      { hip: [0, 55], torso: 106, neck: 98, ankleN: [46, 7], ankleF: [42, 7], kneeN: 1, handN: 'sh', handNoff: [12, 10], handF: 'sh', handFoff: [10, 10], uaS: 0.62, faS: 0.85, elbowN: -1 },
    ],
    tl: [[0, 0.6], [1, 1.2], [1, 0.6], [0, 2.0]],
    eq: [{ t: 'bench', a: [-26, 47], b: [20, 47], legs: [[-4, 44]] }, { t: 'rect', x: 30, y: 62, w: 16, h: 8 }, { t: 'cable', at: 'handN', from: [6, 228] },
      ],
  },
  rdl_hantle: {
    poses: [
      S({ hip: [5, 95], torso: 90, neck: 90, handN: [12, 84], handF: [10, 84] }),
      S({ hip: [-22, 86], torso: 26, neck: 12, handN: [18, 48], handF: [16, 48] }),
    ],
    tl: [[0, 0.6], [1, 2.0], [1, 0.4], [0, 1.2]],
    eq: [DB('handN', { ang: 0, z: 'front' })],
  },
  plank: {
    poses: [
      { hip: [-28.6, 31], torso: 8, neck: 8, ankleN: [-117, 10], ankleF: [-119, 10], footN: -70, footF: -70, handN: [48, 5], handF: [46, 5] },
      { hip: [-28.6, 31.5], torso: 8.5, neck: 8, ankleN: [-117, 10], ankleF: [-119, 10], footN: -70, footF: -70, handN: [48, 5], handF: [46, 5] },
    ],
    tl: [[0, 1.5], [1, 1.5], [0, 1.5]],
  },
  uginanie: {
    poses: [
      S({ hip: [5, 95], torso: 90, neck: 90, handN: [10, 84], handF: [8, 84] }),
      S({ hip: [5, 95], torso: 90, neck: 90, handN: [15, 141], handF: [13, 141] }),
    ],
    tl: [[0, 0.5], [1, 1.0], [1, 0.4], [0, 2.0]],
    eq: [DB('handN', { end: true, z: 'front' })],
  },
  leg_press: {
    poses: [
      { hip: [0, 42], torso: 152, neck: 140, ankleN: [58, 102], ankleF: [56, 100], kneeN: 1, footN: 135, footF: 135, handN: [12, 44], handF: [10, 44],
        pts: { p1: [43, 121], p2: [76, 88] } },
      { hip: [0, 42], torso: 152, neck: 140, ankleN: [30, 76], ankleF: [28, 74], kneeN: 1, footN: 135, footF: 135, handN: [12, 44], handF: [10, 44],
        pts: { p1: [15, 95], p2: [48, 62] } },
    ],
    tl: [[0, 0.5], [1, 2.0], [1, 0.4], [0, 1.4]],
    eq: [{ t: 'seg', a: [-14, 36], b: [22, 36], cls: 'eq-pad', w: 8, z: 'back' }, { t: 'seg', a: [-14, 38], b: [-58, 62], cls: 'eq-pad', w: 8, z: 'back' }, { t: 'seg', a: [10, 30], b: [120, 140], w: 3 },
      { t: 'seg', a: [10, 30], b: [10, 0], w: 4 }, { t: 'seg', a: [-30, 50], b: [-30, 0], w: 4 }, { t: 'seg', a: 'p1', b: 'p2', w: 6, z: 'back' }],
  },
  pompki: {
    poses: [
      { hip: [-25.8, 45.5], torso: 21, neck: 21, ankleN: [-108, 14], ankleF: [-110, 14], footN: -60, footF: -60, handN: [24, 4], handF: [22, 4] },
      { hip: [-20.2, 19.2], torso: 3.4, neck: 3, ankleN: [-108, 14], ankleF: [-110, 14], footN: -60, footF: -60, handN: [24, 4], handF: [22, 4] },
    ],
    tl: [[0, 0.5], [1, 1.8], [1, 0.3], [0, 1.0]],
  },
  wyciskanie_siedzac: {
    poses: [
      { hip: [0, 52], torso: 92, neck: 92, ankleN: [46, 7], ankleF: [42, 7], kneeN: 1, handN: [10, 110], handF: [8, 110] },
      { hip: [0, 52], torso: 92, neck: 92, ankleN: [46, 7], ankleF: [42, 7], kneeN: 1, handN: [3, 162], handF: [1, 162] },
    ],
    tl: [[0, 0.5], [1, 1.2], [1, 0.4], [0, 2.0]],
    eq: [{ t: 'bench', a: [-24, 45], b: [22, 45], legs: [[-2, 42]] }, { t: 'seg', a: [-10, 48], b: [-12, 125], cls: 'eq-pad', w: 8, z: 'back' }, DB('handN', { end: true, z: 'front' })],
  },
  most_biodrowy: {
    poses: [
      { hip: [10, 11], torso: 180, neck: 180, ankleN: [46, 7], ankleF: [44, 7], kneeN: 1, kneeF: 1, handN: [18, 5], handF: [16, 5], elbowN: 1 },
      { hip: [1.5, 38], torso: 214, neck: 200, ankleN: [46, 7], ankleF: [44, 7], kneeN: 1, kneeF: 1, handN: [21, 4], handF: [19, 4], elbowN: 1 },
    ],
    tl: [[0, 0.5], [1, 1.0], [1, 1.2], [0, 1.6]],
  },
  prostowanie_wyciag: {
    poses: [
      S({ hip: [5, 95], torso: 86, neck: 88, ankleN: [10, 7], ankleF: [2, 7], handN: [23, 138], handF: [21, 138] }),
      S({ hip: [5, 95], torso: 86, neck: 88, ankleN: [10, 7], ankleF: [2, 7], handN: [14, 86], handF: [12, 86] }),
    ],
    tl: [[0, 0.5], [1, 1.0], [1, 0.5], [0, 1.8]],
    eq: [{ t: 'cable', at: 'handN', from: [40, 205], column: 1, handle: true }],
  },
});
