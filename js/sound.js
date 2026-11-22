// Dźwięk (Web Audio) i blokada wygaszania ekranu.
// Dźwięki są planowane z wyprzedzeniem na zegarze AudioContext, więc nie zależą od przycinania timerów JS.

let ctx = null, master = null, planned = [];
let mode = 'mix', volume = 0.8;

export function configure(opts) {
  if (opts.mode) mode = opts.mode;
  if (opts.volume != null) volume = opts.volume;
  if (master) master.gain.value = volume;
  applySession();
}

function applySession() {
  // 'ambient' = miesza się z muzyką, ale wycisza go przełącznik wyciszenia;
  // 'playback' = słychać przy wyciszonym telefonie, ale iOS może zatrzymać muzykę z innej aplikacji.
  try { if ('audioSession' in navigator) navigator.audioSession.type = mode === 'always' ? 'playback' : 'ambient'; } catch { /* brak API */ }
}

// Musi być wywołane w obsłudze dotknięcia (wymóg iOS)
export function unlock() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = volume;
      master.connect(ctx.destination);
    }
    applySession();
    if (ctx.state !== 'running') ctx.resume();
    return true;
  } catch { return false; }
}

export function ready() { return !!ctx && ctx.state === 'running'; }

function tone(at, freq, dur, gain = 0.9, type = 'sine') {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.linearRampToValueAtTime(gain, at + 0.012);
  g.gain.setValueAtTime(gain, Math.max(at + 0.013, at + dur - 0.04));
  g.gain.linearRampToValueAtTime(0.0001, at + dur);
  o.connect(g); g.connect(master);
  o.start(at); o.stop(at + dur + 0.03);
  planned.push(o);
}

export function cancel() {
  for (const o of planned) { try { o.stop(); } catch { /* już zatrzymany */ } }
  planned = [];
}

// Sygnały dla sekwencji faz: phases = [{dur, kind:'rest'|'work'|'hold'|'prep'}], elapsed = ile sekund już minęło
export function schedule(phases, elapsed, warn) {
  if (!ctx) return;
  cancel();
  const now = ctx.currentTime;
  let t = 0;
  phases.forEach((p, i) => {
    const start = t, end = t + p.dur;
    const last = i === phases.length - 1;
    const at = s => now + (s - elapsed);
    // ostrzeżenie przed końcem przerwy (tylko dla przerw i przytrzymań dłuższych niż próg)
    if ((p.kind === 'rest' || p.kind === 'hold') && p.dur > warn + 1 && end - warn > elapsed) {
      tone(at(end - warn), 880, 0.12); tone(at(end - warn) + 0.18, 880, 0.12);
    }
    // 3-2-1 przed końcem fazy
    for (const k of [3, 2, 1]) if (p.dur > k + 0.5 && end - k > elapsed) tone(at(end - k), 660, 0.09, 0.7);
    if (end > elapsed) {
      if (last) { tone(at(end), 1046, 0.45); tone(at(end) + 0.55, 1046, 0.7); }
      else if (phases[i + 1].kind === 'work') { tone(at(end), 1318, 0.35); }
      else { tone(at(end), 523, 0.45); }
    }
    t = end;
  });
}

export function test() {
  if (!unlock()) return false;
  const now = ctx.currentTime + 0.05;
  tone(now, 880, 0.12); tone(now + 0.18, 880, 0.12);
  tone(now + 0.6, 660, 0.09, 0.7);
  tone(now + 1.0, 1046, 0.45); tone(now + 1.55, 1046, 0.7);
  return true;
}

// ── blokada wygaszania ekranu ───────────────────────────────────────────────
let lock = null, want = false;
export async function keepAwake(on) {
  want = on;
  try {
    if (on && !lock && 'wakeLock' in navigator && document.visibilityState === 'visible') {
      lock = await navigator.wakeLock.request('screen');
      lock.addEventListener('release', () => { lock = null; });
    } else if (!on && lock) { await lock.release(); lock = null; }
  } catch { lock = null; }
}
export function awake() { return !!lock; }
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    if (want) keepAwake(true);
    if (ctx && ctx.state !== 'running') ctx.resume();
  }
});
