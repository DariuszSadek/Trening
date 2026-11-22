// Plan synów (początkujący): FBW 3×/tydz., treningi A i B na zmianę, 12 tygodni w 3 fazach.
// Podstawa: NSCA 2009 (początkujący 1–2 serie × 10–15, ok. 1 min przerwy; średniozaaw. 2–3 × 8–12, 1–2 min), 2–3 treningi/tydz. w dni nie po sobie.
// kind: kg (ciężar + powtórzenia), reps (same powtórzenia), time (przytrzymanie), dist (dystans, kg na rękę)
// ph = [faza1, faza2, faza3]: { sets, reps:[min,max] | sec, rest (s), txt (opcjonalny opis) }

export const WEEKS = 12;
export const PHASES = [
  { n: 1, from: 1, to: 4, name: 'Faza 1 – technika', rir: '3–4', note: 'Lekko. Uczysz się ruchu – każde powtórzenie ma wyglądać jak w opisie. Kończysz serię, gdy mógłbyś zrobić jeszcze 3–4 powtórzenia.' },
  { n: 2, from: 5, to: 8, name: 'Faza 2 – budowa', rir: '2–3', note: 'Trzy serie. Kończysz serię, gdy zostają 2–3 powtórzenia w zapasie.' },
  { n: 3, from: 9, to: 12, name: 'Faza 3 – siła i masa', rir: '2', note: 'Mniej powtórzeń, większy ciężar. Kończysz serię, gdy zostają 2 powtórzenia w zapasie.' },
];
export const phaseOf = w => PHASES.find(p => w >= p.from && w <= p.to) || PHASES[2];

const STD = (r1 = 90, r2 = 120, r3 = 120) => [
  { sets: 2, reps: [12, 15], rest: r1 }, { sets: 3, reps: [10, 12], rest: r2 }, { sets: 3, reps: [8, 10], rest: r3 }];

export const DAYS = {
  A: {
    id: 'A', title: 'Trening A', focus: 'Goblet squat · wyciskanie hantli · ściąganie drążka · RDL · biceps · deska',
    items: [
      { ex: 'goblet', kind: 'kg', step: 2, unit: 'kg (hantel/kettlebell)', warm: true, ph: STD() },
      { ex: 'wyciskanie_hantli', kind: 'kg', step: 2, unit: 'kg na hantel', ph: STD() },
      { ex: 'sciaganie_drazka', kind: 'kg', step: 2.5, unit: 'kg (wyciąg)', ph: STD() },
      { ex: 'rdl_hantle', kind: 'kg', step: 2, unit: 'kg na hantel', ph: [{ sets: 2, reps: [12, 15], rest: 90 }, { sets: 3, reps: [10, 12], rest: 90 }, { sets: 3, reps: [10, 12], rest: 90 }] },
      { ex: 'uginanie', kind: 'kg', step: 1, unit: 'kg na hantel', ph: [{ sets: 2, reps: [12, 15], rest: 60 }, { sets: 2, reps: [12, 15], rest: 60 }, { sets: 3, reps: [10, 12], rest: 75 }] },
      { ex: 'plank', kind: 'time', ph: [{ sets: 2, sec: 25, txt: '20–30 s', rest: 60 }, { sets: 3, sec: 35, txt: '30–40 s', rest: 60 }, { sets: 3, sec: 50, txt: '40–60 s', rest: 60 }] },
    ],
    finish: { type: 'interval', name: 'Sprawność: rower – 5 rund', rounds: 5, work: 30, rest: 60,
      text: 'Rower stacjonarny lub bieżnia: 5 rund – 30 s szybko (oddech mocno przyspiesza, ale da się wydusić krótkie zdanie), 60 s spokojnie.' },
  },
  B: {
    id: 'B', title: 'Trening B', focus: 'Suwnica · pompki · wiosłowanie · wyciskanie nad głowę · most · triceps · dead bug',
    items: [
      { ex: 'leg_press', kind: 'kg', step: 5, unit: 'kg (suwnica)', warm: true, ph: STD() },
      { ex: 'pompki', kind: 'reps', variant: true, ph: [{ sets: 2, reps: [6, 12], rest: 90 }, { sets: 3, reps: [8, 15], rest: 90 }, { sets: 3, reps: [10, 20], rest: 90 }] },
      { ex: 'wioslowanie_wyciag', kind: 'kg', step: 2.5, unit: 'kg (wyciąg)', ph: STD() },
      { ex: 'wyciskanie_siedzac', kind: 'kg', step: 1, unit: 'kg na hantel', ph: STD(90, 90, 105) },
      { ex: 'most_biodrowy', kind: 'kg', step: 2, unit: 'kg (hantel/talerz; w fazie 1 bez)', ph: [{ sets: 2, reps: [12, 15], rest: 60, txt: 'bez obciążenia' }, { sets: 3, reps: [12, 12], rest: 75, txt: 'hantel na biodrach' }, { sets: 3, reps: [10, 12], rest: 90, txt: 'cięższy hantel/talerz' }] },
      { ex: 'prostowanie_wyciag', kind: 'kg', step: 2.5, unit: 'kg (wyciąg)', ph: [{ sets: 2, reps: [12, 15], rest: 60 }, { sets: 2, reps: [12, 15], rest: 60 }, { sets: 3, reps: [10, 12], rest: 75 }] },
      { ex: 'dead_bug', kind: 'reps', side: 'stronę', ph: [{ sets: 2, reps: [6, 6], rest: 60 }, { sets: 3, reps: [8, 8], rest: 60 }, { sets: 3, reps: [10, 10], rest: 60 }] },
    ],
    finish: { type: 'dist', ex: 'farmer', name: 'Sprawność: spacer farmera', sets: 3, dist: 20, rest: 75, step: 2,
      text: '3 × 20 m z dwoma hantlami/kettlebellami, 60–90 s przerwy. Ciężar: taki, żeby przejść cały dystans prosto i bez upuszczenia.' },
  },
};

export const WARMUP = [
  '5 min rower stacjonarny lub szybki marsz na bieżni – aż zrobi się ciepło.',
  '2 rundy bez przerwy: 10 przysiadów bez obciążenia, 10 krążeń ramion w przód i 10 w tył, 5 wykroków na każdą nogę, 8 pompek z dłońmi na ławce, 10 skłonów-„zawiasów” z rękami na biodrach (biodra w tył, plecy proste).',
  'Pierwsze ćwiczenie zaczynasz od serii rozgrzewkowej (połowa ciężaru × 10) – jest już wpisana w aplikacji.',
];
export const COOL = ['couch_stretch', 'child_pose', 'hamstring_stretch', 'doorway_pec'];

// Opisy dopasowane do synów (reszta jak u taty)
export const CEL_SYN = {
  goblet: 'Przysiad z ciężarem trzymanym z przodu: uczy pionowego tułowia i pełnej głębokości. To podstawowy przysiad do nauki techniki – siła całych nóg i pośladków.',
  sciaganie_drazka: 'Najszersze grzbietu i bicepsy – przygotowanie do podciągania na drążku.',
  farmer: 'Uchwyt, mięśnie tułowia i kondycja – noszenie ciężaru z wyprostowaną sylwetką.',
};
