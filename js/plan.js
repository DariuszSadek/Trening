// Plan FBW 3 dni – Darek. Dane, z których aplikacja buduje ekrany i liczy ciężary.
// Typy: top (seria szczytowa + zejściowe), work (serie robocze w zakresie powtórzeń), bw (masa ciała / guma),
// time (czas), dist (dystans), ss (superseria dwóch ćwiczeń). rest = przerwa PO serii (s).

export const BLOCK_WEEKS = 6; // T1 wejście, T2–T5 progresja, T6 odciążenie

export const DAYS = [
  {
    id: 'A', title: 'Dzień A', focus: 'Przysiad · wyciskanie skośne · ściąganie drążka',
    warmup: { minutes: 8, text: 'Bieżnia lub rower: 4 min spokojnie, potem 4 min żwawiej (marsz pod górę, nachylenie 5–8%) – aż lekko się spocisz.' },
    mobPre: ['ankle_rocks', 'hip_9090', 'goblet_hold', 'open_book'],
    blocks: [
      { type: 'top', ex: 'przysiad', lower: true, sets: [
        { k: 'R', bar: true, reps: 10, rest: 60 }, { k: 'R', pct: 50, reps: 6, rest: 60 }, { k: 'R', pct: 70, reps: 4, rest: 90 }, { k: 'R', pct: 85, reps: 2, rest: 120 },
        { k: 'TS', pct: 100, reps: 5, rest: 180 }, { k: 'BO', pct: 85, reps: 8, rest: 120 }, { k: 'BO', pct: 85, reps: 8, rest: 150 }] },
      { type: 'work', ex: 'rdl', warm: [{ pct: 60, reps: 8, rest: 60 }], sets: 2, reps: [8, 10], rir: 3, rest: 120, step: 2.5, last: 120 },
      { type: 'work', ex: 'wyciskanie_skos', warm: [{ pct: 60, reps: 8, rest: 60 }], sets: 3, reps: [8, 10], rir: 2, rest: 120, step: 2, db: true },
      { type: 'work', ex: 'sciaganie_drazka', warm: [{ pct: 60, reps: 10, rest: 60 }], sets: 3, reps: [8, 10], rir: 2, rest: 120, step: 2.5 },
      { type: 'ss', rounds: 2, items: [
        { type: 'work', ex: 'face_pull', reps: [12, 15], rir: 2, rest: 30, step: 2.5 },
        { type: 'work', ex: 'pallof', reps: [10, 10], side: 'stronę', rir: 2, rest: 60, step: 2.5 }] },
    ],
    cond: { type: 'interval', name: 'Rower – krótkie sprinty', rounds: 8, work: 15, rest: 45, cooldown: 120,
      text: '8 rund: 15 s mocno (duży opór, wysoka kadencja – ok. 8/10 wysiłku, nie „do odcięcia”) + 45 s bardzo lekko. Na koniec 2 min spokojnego pedałowania.' },
    mobPost: ['couch_stretch', 'deep_squat', 'lat_stretch_bar'],
  },
  {
    id: 'B', title: 'Dzień B', focus: 'Martwy ciąg · OHP · wiosłowanie',
    warmup: { minutes: 8, text: 'Bieżnia lub rower: 4 min spokojnie, potem 4 min żwawiej – aż lekko się spocisz.' },
    mobPre: ['cat_camel', 'thoracic_roller', 'hip_distraction', 'scapular_cars'],
    blocks: [
      { type: 'top', ex: 'martwy', lower: true, sets: [
        { k: 'R', pct: 40, reps: 5, rest: 60 }, { k: 'R', pct: 60, reps: 3, rest: 90 }, { k: 'R', pct: 80, reps: 2, rest: 120 }, { k: 'R', pct: 90, reps: 1, rest: 150 },
        { k: 'TS', pct: 100, reps: 5, rest: 180 }, { k: 'BO', pct: 85, reps: 6, rest: 150 }, { k: 'BO', pct: 85, reps: 6, rest: 150 }] },
      { type: 'work', ex: 'ohp', warm: [{ pct: 50, reps: 8, rest: 60 }, { pct: 75, reps: 4, rest: 90 }], sets: 3, reps: [6, 8], rir: 2, rest: 120, step: 2.5 },
      { type: 'work', ex: 'wioslowanie_hantlem', warm: [{ pct: 60, reps: 10, rest: 60 }], sets: 3, reps: [10, 12], side: 'rękę', rir: 2, rest: 90, step: 2, db: true },
      { type: 'ss', rounds: 2, items: [
        { type: 'work', ex: 'goblet', reps: [10, 12], rir: 2, rest: 30, step: 2, db: true },
        { type: 'bw', ex: 'pompki_gryf', reps: [8, 12], rir: 2, rest: 90, aidLabel: 'Wysokość gryfu (otwór / cm):', aidPh: 'np. otwór 9', lower: 'gryf o jeden otwór niżej' }] },
      { type: 'dist', ex: 'farmer', sets: 3, dist: 30, rest: 90, step: 2, db: true },
    ],
    cond: { type: 'steady', name: 'Bieżnia – marsz pod górę', minutes: 15,
      text: '15 min: nachylenie 8–12%, prędkość ok. 4,5–5,5 km/h. Intensywność: czujesz wysiłek, ale możesz mówić pełnymi zdaniami. Bez trzymania się poręczy.' },
    mobPost: ['hamstring_stretch', 'child_pose', 'pigeon'],
  },
  {
    id: 'C', title: 'Dzień C', focus: 'Wyciskanie leżąc · przysiad bułgarski · hip thrust',
    warmup: { minutes: 8, text: 'Bieżnia lub rower: 4 min spokojnie, potem 4 min żwawiej – aż lekko się spocisz.' },
    mobPre: ['thoracic_roller', 'band_er', 'dead_bug', 'pullover', 'hip_airplanes'],
    blocks: [
      { type: 'top', ex: 'wyciskanie_lezac', lower: false, sets: [
        { k: 'R', bar: true, reps: 10, rest: 60 }, { k: 'R', pct: 50, reps: 6, rest: 60 }, { k: 'R', pct: 70, reps: 4, rest: 90 }, { k: 'R', pct: 85, reps: 2, rest: 120 },
        { k: 'TS', pct: 100, reps: 5, rest: 180 }, { k: 'BO', pct: 85, reps: 8, rest: 120 }, { k: 'BO', pct: 85, reps: 8, rest: 120 }] },
      { type: 'work', ex: 'bulgarski', warm: [{ bwOnly: true, reps: 8, rest: 60 }], sets: 3, reps: [8, 10], side: 'nogę', rir: 2, rest: 120, step: 2, db: true },
      { type: 'work', ex: 'hip_thrust', warm: [{ pct: 50, reps: 10, rest: 60 }], sets: 3, reps: [8, 10], rir: 2, rest: 120, step: 5 },
      { type: 'work', ex: 'wioslowanie_wyciag', warm: [{ pct: 60, reps: 10, rest: 60 }], sets: 3, reps: [10, 12], rir: 2, rest: 90, step: 2.5 },
      { type: 'ss', rounds: 2, items: [
        { type: 'work', ex: 'wznosy_bokiem', reps: [12, 15], rir: 2, rest: 30, step: 1, db: true },
        { type: 'time', ex: 'plank_boczny', sec: 30, side: 'stronę', rest: 60 }] },
    ],
    cond: { type: 'emom', name: 'Swing kettlebell – EMOM', rounds: 10, every: 60, note: '12 swingów',
      text: 'Co minutę przez 10 min: 12 swingów kettlebell, reszta minuty odpoczynek. Ciężar: taki, przy którym 12 powtórzeń zajmuje ok. 20–25 s i technika się nie sypie.' },
    mobPost: ['doorway_pec', 'adductor_rock', 'policjant'],
  },
];

// Odciążenie (T6) i wejście (T1)
export const WEEK_RULES = {
  1: { label: 'T1 – wejście', note: 'Seria szczytowa na RPE 7 (3 powtórzenia w zapasie), ćwiczenia pomocnicze z 3 w zapasie. Szukasz ciężarów na blok, nie rekordów.' },
  6: { label: 'T6 – odciążenie', note: 'Bez serii szczytowej: 1 × 5 na 90% ostatniego TS (RPE ok. 6), jedna seria zejściowa, w pozostałych ćwiczeniach o 1 serię mniej, kondycja tylko spokojna (10 min marszu).' },
};

export const RPE_TABLE = [
  ['10', '0', 'Seria do upadku. Zero powtórzeń w zapasie.'],
  ['9,5', '~0,5', 'Jeszcze jedno może byś wycisnął, może nie.'],
  ['9', '1', 'Zrobisz jedno powtórzenie więcej, gdybyś musiał.'],
  ['8,5', '~1,5', 'Minimalny luz, ale blisko ciężko.'],
  ['8', '2', 'Dwa powtórzenia zostały w baku. Ciężko, ale kontrola jest.'],
  ['7', '3', 'Średnio ciężko. Solidna praca.'],
  ['6', '4', 'Lekko–średnio. Idealne na technikę i objętość.'],
  ['5 i mniej', '5+', 'Bardzo lekko, rozgrzewka, technika.'],
];
