import { DAYS, BLOCK_WEEKS, WEEK_RULES, RPE_TABLE } from './plan.js';
import { EX, MOB } from './cwiczenia.js';
import { FIG } from './figs.js';
import { animate } from './figure.js';
import * as snd from './sound.js';
import { VERSION } from './version.js';

// ── stan ─────────────────────────────────────────────────────────────────────
const KEY = 'trening.v1';
const DEF = { v: 1, settings: { warn: 10, sound: 'mix', volume: 0.8, wake: true }, sessions: [], current: null, weekStart: { count: 0, week: 1 } };
let S = load();
function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) return { ...DEF, ...s, settings: { ...DEF.settings, ...s.settings } }; } catch { /* pusty */ }
  return structuredClone(DEF);
}
let saveT = 0;
function save() { clearTimeout(saveT); saveT = setTimeout(saveNow, 150); }
function saveNow() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { toast('Brak miejsca w pamięci – zrób kopię danych.'); } }
snd.configure({ mode: S.settings.sound, volume: S.settings.volume });

// ── pomocnicze ──────────────────────────────────────────────────────────────
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const num = v => { if (v == null || v === '') return null; const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : null; };
const fk = n => n == null ? '' : (Math.round(n * 100) / 100).toString().replace('.', ',');
const rnd = (x, step) => Math.round(x / step) * step;
const mmss = s => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const restTxt = s => s >= 60 ? (s % 60 ? mmss(s) : `${s / 60}:00`) : `${s} s`;
const dateTxt = ts => new Date(ts).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
const timeTxt = ts => new Date(ts).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
function toast(msg, ms = 2200) {
  const d = document.createElement('div'); d.className = 'toast'; d.textContent = msg; document.body.appendChild(d);
  setTimeout(() => d.remove(), ms);
}

// ── tydzień bloku i kolejny dzień ───────────────────────────────────────────
function currentWeek() {
  const ws = S.weekStart || { count: 0, week: 1 };
  const done = S.sessions.length - ws.count;
  return ((ws.week - 1 + Math.floor(Math.max(0, done) / 3)) % BLOCK_WEEKS) + 1;
}
function nextDay() {
  const last = S.sessions[S.sessions.length - 1];
  if (!last) return 'A';
  const i = DAYS.findIndex(d => d.id === last.day);
  return DAYS[(i + 1) % DAYS.length].id;
}

// ── historia i sugestie ciężarów ────────────────────────────────────────────
function historyOf(exId) {
  const out = [];
  for (let i = S.sessions.length - 1; i >= 0; i--) {
    const s = S.sessions[i];
    const rows = Object.values(s.log || {}).filter(r => r.ex === exId && r.done);
    if (rows.length) out.push({ s, rows: rows.sort((a, b) => a.ord - b.ord) });
  }
  return out;
}
function suggestTop(exId, lower, week) {
  const h = historyOf(exId).find(x => x.s.week !== 6 && x.rows.some(r => r.kind === 'TS'));
  if (!h) return null;
  const ts = h.rows.find(r => r.kind === 'TS');
  if (ts.kg == null) return null;
  const small = 2.5, big = lower ? 5 : 2.5;
  let kg = ts.kg, why;
  if (week === 1 && h.s.week >= 5) { kg = rnd(ts.kg * 0.95, 2.5); why = 'nowy blok: start od ok. 95% ostatniego TS'; }
  else if ((ts.reps ?? 0) < 5 || (ts.rpe ?? 8) >= 9.5) { kg = ts.kg - big; why = 'za ciężko ostatnio → mniej'; }
  else if ((ts.rpe ?? 8) >= 8.5) { why = 'RPE 8,5–9 → ten sam ciężar'; }
  else if ((ts.rpe ?? 8) <= 7) { kg = ts.kg + big; why = `RPE ≤ 7 → +${fk(big)} kg`; }
  else { kg = ts.kg + small; why = `RPE 7,5–8 → +${fk(small)} kg`; }
  return { kg, why, last: `${dateTxt(h.s.started)}: ${fk(ts.kg)} × ${ts.reps ?? '?'}${ts.rpe ? ' @ ' + fk(ts.rpe) : ''}` };
}
function suggestWork(exId, cfg, week) {
  const h = historyOf(exId).find(x => x.rows.some(r => r.kind === 'W'));
  if (!h) return null;
  const ws = h.rows.filter(r => r.kind === 'W' && r.kg != null);
  if (!ws.length) return null;
  const kg = Math.max(...ws.map(r => r.kg));
  const hi = cfg.reps[1], lo = cfg.reps[0];
  if (!hi) return { kg, why: 'zwiększ o krok, gdy cały dystans przechodzisz pewnie', last: `${dateTxt(h.s.started)}: ${fk(kg)} kg` };
  const top = ws.every(r => (r.reps ?? 0) >= hi), low = ws.some(r => (r.reps ?? 99) < lo);
  const last = `${dateTxt(h.s.started)}: ${ws.map(r => `${fk(r.kg)}×${r.reps ?? '?'}`).join(', ')}`;
  if (week === 6) return { kg, why: 'odciążenie – ten sam ciężar', last };
  if (top) return { kg: kg + cfg.step, why: `wszystkie serie ≥ ${hi} powt. → +${fk(cfg.step)} kg`, last };
  if (low) return { kg, why: `seria poniżej ${lo} powt. → zostań przy tym ciężarze`, last };
  return { kg, why: 'dobijaj powtórzenia do górnej granicy', last };
}
function lastAid(exId) {
  const h = historyOf(exId)[0];
  if (!h) return null;
  const r = h.rows.filter(r => r.aid).pop();
  return r ? { aid: r.aid, last: `${dateTxt(h.s.started)}: ${h.rows.map(r => `${r.aid || ''} ×${r.reps ?? '?'}`).join(', ')}` } : null;
}

function bwUp(exId, cfg) {
  const h = historyOf(exId).find(x => x.rows.some(r => r.kind === 'W'));
  if (!h) return null;
  const ws = h.rows.filter(r => r.kind === 'W');
  if (ws.length && ws.every(r => (r.reps ?? 0) >= cfg.reps[1])) return `wszystkie serie ≥ ${cfg.reps[1]} powt. – dziś ${cfg.lower || 'mniej pomocy / więcej oporu'}`;
  return `dobijaj do ${cfg.reps[1]} powtórzeń w każdej serii`;
}

// ── budowa wierszy serii ────────────────────────────────────────────────────
function rowsFor(day, week, plan) {
  const blocks = [];
  let ord = 0;
  day.blocks.forEach((b, bi) => {
    const out = { bi, b, rows: [] };
    const push = r => { r.ord = ord++; r.key = `${bi}.${out.rows.length}`; out.rows.push(r); };
    if (b.type === 'top') {
      const P = num(plan[b.ex]);
      let sets = b.sets.map(s => ({ ...s }));
      if (week === 6) {
        const lastR = sets.map(s => s.k).lastIndexOf('R');
        sets = sets.filter((s, i) => i !== lastR);
        sets = sets.filter((s, i, a) => s.k !== 'BO' || a.findIndex(x => x.k === 'BO') === i);
        sets.forEach(s => { if (s.k === 'TS') s.pct = 90; });
      }
      let r = 0, bo = 0;
      sets.forEach((s, i) => {
        const w = s.bar ? 20 : (P ? Math.max(20, rnd(P * s.pct / 100, 2.5)) : null);
        const label = s.k === 'R' ? `R${++r}` : s.k === 'BO' ? `BO${++bo}` : 'TS';
        const rpe = s.k === 'TS' ? (week === 1 ? '7' : week === 6 ? '~6' : '8') : null;
        const desc = s.k === 'R' ? (s.bar ? 'pusty gryf' : `${s.pct}% TS`) : s.k === 'TS' ? (week === 6 ? '90% ostatniego TS' : 'seria szczytowa') : `${s.pct}% TS`;
        push({ ex: b.ex, type: 'top', kind: s.k, label, reps: s.reps, repsTxt: String(s.reps), kg: w, desc, rpe, rest: s.rest });
      });
    } else if (b.type === 'work' || b.type === 'bw' || b.type === 'time' || b.type === 'dist') {
      addSimple(b, plan, week, push);
    } else if (b.type === 'ss') {
      const rounds = week === 6 ? Math.max(1, b.rounds - 1) : b.rounds;
      for (let k = 1; k <= rounds; k++) b.items.forEach((it, j) => {
        const base = simpleRow(it, plan, week, `${k}${'ab'[j]}`, k);
        base.ss = true; push(base);
      });
    }
    blocks.push(out);
  });
  return blocks;
}
function simpleRow(it, plan, week, label, idx) {
  const W = num(plan[it.ex]);
  const sideTxt = it.side ? `/${it.side}` : '';
  if (it.type === 'work') {
    const rir = week === 1 ? it.rir + 1 : it.rir;
    const rt = it.reps[0] === it.reps[1] ? `${it.reps[0]}` : `${it.reps[0]}–${it.reps[1]}`;
    return { ex: it.ex, type: 'work', kind: 'W', label, reps: it.reps[0], repsTxt: rt + sideTxt, kg: W, desc: `RIR ${rir}`, rest: it.rest };
  }
  if (it.type === 'bw') return { ex: it.ex, type: 'bw', kind: 'W', label, reps: it.reps[0], repsTxt: `${it.reps[0]}–${it.reps[1]}`, kg: null, desc: `RIR ${week === 1 ? it.rir + 1 : it.rir}`, rest: it.rest, aid: true, aidPh: it.aidPh };
  if (it.type === 'time') return { ex: it.ex, type: 'time', kind: 'W', label, reps: null, repsTxt: `${it.sec} s${sideTxt}`, kg: null, desc: 'przytrzymanie', rest: it.rest, hold: it.sec, sides: it.side ? 2 : 1 };
  if (it.type === 'dist') return { ex: it.ex, type: 'dist', kind: 'W', label, reps: null, repsTxt: `${it.dist} m`, kg: W, desc: 'kg na rękę', rest: it.rest };
  return {};
}
function addSimple(b, plan, week, push) {
  const W = num(plan[b.ex]);
  if (b.type === 'work') {
    (b.warm || []).forEach((w, i) => {
      const kg = w.bwOnly ? null : (W ? Math.max(0, rnd(W * w.pct / 100, b.step)) : null);
      push({ ex: b.ex, type: 'work', kind: 'R', label: `R${i + 1}`, reps: w.reps, repsTxt: String(w.reps) + (b.side ? `/${b.side}` : ''), kg, desc: w.bwOnly ? 'bez obciążenia' : `${w.pct}% ciężaru roboczego`, rest: w.rest, bwOnly: !!w.bwOnly });
    });
  }
  const n = week === 6 ? Math.max(1, b.sets - 1) : b.sets;
  for (let i = 1; i <= n; i++) {
    const r = simpleRow(b, plan, week, `S${i}`, i);
    if (i === n && b.last) r.rest = b.last;
    push(r);
  }
}

// ── nawigacja ───────────────────────────────────────────────────────────────
const main = $('#main');
let anims = [];
function stopAnims() { anims.forEach(a => a.stop && a.stop()); anims = []; io.disconnect(); }
const io = new IntersectionObserver(ents => {
  for (const e of ents) {
    const el = e.target;
    if (e.isIntersecting && !el._anim) { el._anim = animate(el, FIG[el.dataset.fig]); anims.push(el._anim); }
    else if (!e.isIntersecting && el._anim) { el._anim.stop(); el._anim = null; }
  }
}, { rootMargin: '100px' });
function attachFigs(root = document) { root.querySelectorAll('[data-fig]').forEach(el => { if (FIG[el.dataset.fig]) io.observe(el); }); }

function route() {
  stopAnims();
  const h = location.hash.replace('#/', '') || '';
  if (h === 'trening' && S.current) renderWorkout();
  else if (h === 'zasady') renderRules();
  else if (h === 'historia') renderHistory();
  else if (h === 'ustawienia') renderSettings();
  else if (h === 'pomoc') renderHelp();
  else if (h === 'zrodla') renderSources();
  else renderHome();
  updateBar();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
$('#btn-home').onclick = () => { location.hash = S.current ? '#/trening' : '#/'; if (!S.current) route(); };
$('#btn-menu').onclick = openMenu;

function updateBar() {
  const el = $('#bar-info');
  if (S.current) {
    const c = S.current;
    el.textContent = `${c.day} · T${c.week} · ${mmss((Date.now() - c.started) / 1000)}`;
  } else el.textContent = `T${currentWeek()}/${BLOCK_WEEKS} · v${VERSION}`;
}
setInterval(updateBar, 1000);

// ── ekran główny ────────────────────────────────────────────────────────────
function estMinutes(day) {
  const week = currentWeek();
  const blocks = rowsFor(day, week, {});
  let s = day.warmup.minutes * 60 + 6 * 60 + 4 * 60;
  blocks.forEach(b => b.rows.forEach(r => { s += 40 + r.rest; }));
  const c = day.cond;
  s += c.type === 'interval' ? c.rounds * (c.work + c.rest) + c.cooldown : c.type === 'emom' ? c.rounds * c.every : c.minutes * 60;
  return Math.round(s / 60 / 5) * 5;
}
function renderHome() {
  const w = currentWeek(), nd = nextDay();
  const rule = WEEK_RULES[w];
  main.innerHTML = `
    <h1>FBW – 3 dni w tygodniu</h1>
    <div class="mute small">Siła i sprawność ogólna + redukcja tkanki tłuszczowej. Kolejność A → B → C, minimum jeden dzień przerwy między treningami.</div>
    <div class="card">
      <div class="row"><b class="grow">Blok 6-tygodniowy – tydzień ${w}</b>
        <select id="week-sel" class="num" aria-label="Zmień tydzień">${[1, 2, 3, 4, 5, 6].map(i => `<option value="${i}"${i === w ? ' selected' : ''}>T${i}</option>`).join('')}</select></div>
      <div class="weekbox">${[1, 2, 3, 4, 5, 6].map(i => `<span class="${i === w ? 'on' : ''}">T${i}</span>`).join('')}</div>
      ${rule ? `<p class="small"><b>${rule.label}.</b> ${rule.note}</p>` : '<p class="small">Tydzień progresji: seria szczytowa na RPE 8, ciężary według sugestii z poprzedniego treningu.</p>'}
    </div>
    ${S.current ? `<button class="btn primary wide" data-go="trening">Wróć do treningu: ${esc(S.current.day)} (start ${timeTxt(S.current.started)})</button>` : ''}
    ${DAYS.map(d => `
      <button class="card day-card${d.id === nd ? ' next' : ''}" data-start="${d.id}">
        <div class="dc-head"><span class="dc-title">${d.title}</span>${d.id === nd ? '<span class="badge">następny</span>' : ''}</div>
        <div>${d.focus}</div>
        <div class="mute small num">ok. ${estMinutes(d)} min · kondycja: ${esc(d.cond.name)}</div>
      </button>`).join('')}
    <div class="menu-list">
      <button class="btn wide" data-go="zasady">Zasady planu, RPE i progresja</button>
      <button class="btn wide" data-go="historia">Historia treningów (${S.sessions.length})</button>
      <button class="btn wide" data-go="ustawienia">Ustawienia, dźwięk, kopia danych</button>
      <button class="btn wide" data-go="pomoc">Instalacja i obsługa</button>
    </div>`;
  $('#week-sel').onchange = e => { S.weekStart = { count: S.sessions.length, week: +e.target.value }; save(); renderHome(); updateBar(); };
}

function startDay(id) {
  if (S.current && !confirm(`Trwa trening ${S.current.day}. Porzucić go i zacząć ${id}? (Niezapisany trening zniknie.)`)) return;
  const day = DAYS.find(d => d.id === id);
  const week = currentWeek();
  const plan = {};
  for (const b of day.blocks) {
    const items = b.type === 'ss' ? b.items : [b];
    for (const it of items) {
      if (it.type === 'top') { const s = suggestTop(it.ex, it.lower, week); if (s) plan[it.ex] = s.kg; }
      if (it.type === 'work' || it.type === 'dist') { const s = suggestWork(it.ex, { reps: it.reps || [0, 0], step: it.step || 2.5 }, week); if (s) plan[it.ex] = s.kg; }
      if (it.type === 'bw') { const s = lastAid(it.ex); if (s) plan[it.ex] = s.aid; }
    }
  }
  S.current = { id: Date.now().toString(36), day: id, week, started: Date.now(), plan, log: {}, mob: {}, extra: {}, timer: null };
  save();
  snd.unlock();
  if (S.settings.wake) snd.keepAwake(true);
  location.hash = '#/trening';
}

// ── ekran treningu ──────────────────────────────────────────────────────────
let VIEW = null; // { day, blocks, flat }
function renderWorkout() {
  const c = S.current, day = DAYS.find(d => d.id === c.day);
  const blocks = rowsFor(day, c.week, c.plan);
  VIEW = { day, blocks, flat: blocks.flatMap(b => b.rows) };
  const rule = WEEK_RULES[c.week];
  let n = 0;
  main.innerHTML = `
    <h1>${day.title} <span class="mute small num">T${c.week}</span></h1>
    <div class="mute">${day.focus}</div>
    ${rule ? `<div class="note small"><b>${rule.label}.</b> ${rule.note}</div>` : ''}
    <div class="sec">${++n}. Rozgrzewka</div>
    <div class="card">${extraRow('warmup', `Rozgrzewka ogólna – ${day.warmup.minutes} min`, day.warmup.text, day.warmup.minutes * 60)}</div>
    <div class="sec">${++n}. Mobilność przed (ok. 6 min)</div>
    <div class="card">${day.mobPre.map(id => mobRow(id)).join('')}</div>
    <div class="sec">${++n}. Trening siłowy</div>
    ${blocks.map(b => blockCard(b)).join('')}
    <div class="sec">${++n}. Kondycja</div>
    <div class="card">${condRow(day, c.week)}</div>
    <div class="sec">${++n}. Mobilność po (ok. 4 min)</div>
    <div class="card">${day.mobPost.map(id => mobRow(id)).join('')}</div>
    <button class="btn primary wide" data-finish>Zakończ i zapisz trening</button>
    <p class="mute small">Dane zapisują się w telefonie na bieżąco. Kopię (plik) zrobisz w Ustawieniach.</p>`;
  attachFigs(main);
  if (c.timer) resumeTimer();
}
function figBox(figId, cls = 'ex-fig') {
  if (figId && FIG[figId]) return `<button type="button" class="${cls}" data-fig="${figId}" aria-label="Animacja ćwiczenia"></button>`;
  return `<div class="${cls} none">bez rysunku – ruch poza widokiem z boku</div>`;
}
function exHead(exId, summary, extra = '') {
  const e = EX[exId];
  return `<div class="ex-head">${figBox(e.fig).replace('data-fig', `data-open="${exId}" data-fig`)}
    <div class="grow"><div class="ex-title">${esc(e.name)}</div><div class="ex-sub">${summary}</div>${extra}
    <button type="button" class="ex-more" data-open="${exId}">Pełny opis i historia</button></div></div>`;
}
function blockSummary(b, week) {
  const rest = s => restTxt(s);
  if (b.type === 'top') {
    const ts = b.sets.find(s => s.k === 'TS'), bo = b.sets.filter(s => s.k === 'BO');
    return week === 6 ? `4 serie rozgrzewkowe → 1 × 5 (90% TS) → 1 × ${bo[0].reps} (85%)` :
      `${b.sets.filter(s => s.k === 'R').length} rozgrzewkowe → TS 1 × ${ts.reps} @ RPE ${week === 1 ? 7 : 8} → ${bo.length} × ${bo[0].reps} (85% TS). Przerwy: TS ${rest(ts.rest)}, zejściowe ${rest(bo[0].rest)}.`;
  }
  if (b.type === 'work') return `${(b.warm || []).length ? (b.warm.length + ' rozgrzewk. + ') : ''}${week === 6 ? b.sets - 1 : b.sets} × ${b.reps[0]}–${b.reps[1]}${b.side ? '/' + b.side : ''}, RIR ${week === 1 ? b.rir + 1 : b.rir}, przerwa ${rest(b.rest)}`;
  if (b.type === 'bw') return `${week === 6 ? b.sets - 1 : b.sets} × ${b.reps[0]}–${b.reps[1]}, RIR ${week === 1 ? b.rir + 1 : b.rir}, przerwa ${rest(b.rest)}`;
  if (b.type === 'dist') return `${week === 6 ? b.sets - 1 : b.sets} × ${b.dist} m, przerwa ${rest(b.rest)}`;
  return '';
}
function planLine(exId, type, b, week) {
  const c = S.current, v = c.plan[exId];
  if (type === 'top') {
    const sg = suggestTop(exId, b.lower, week);
    return `<div class="plan-line"><label for="p-${exId}">Plan serii szczytowej (TS):</label>
      <input id="p-${exId}" class="num" inputmode="decimal" data-plan="${exId}" value="${esc(fk(num(v)))}" placeholder="kg"> kg
      <div class="plan-hint">${sg ? `Ostatnio ${esc(sg.last)} → ${esc(sg.why)}.` : 'Brak historii – wpisz ciężar, z którym zrobisz 5 powtórzeń mając ok. 3 w zapasie. Rozgrzewka przeliczy się sama.'}</div></div>`;
  }
  if (type === 'work' || type === 'dist') {
    const sg = suggestWork(exId, { reps: b.reps || [0, 0], step: b.step || 2.5 }, week);
    const unit = b.db || type === 'dist' ? 'kg (na hantel/rękę)' : 'kg';
    return `<div class="plan-line"><label for="p-${exId}">Ciężar roboczy:</label>
      <input id="p-${exId}" class="num" inputmode="decimal" data-plan="${exId}" value="${esc(fk(num(v)))}" placeholder="kg"> ${unit}
      <div class="plan-hint">${sg ? `Ostatnio ${esc(sg.last)} → ${esc(sg.why)}.` : `Brak historii – dobierz tak, żeby zrobić ${b.reps ? (b.reps[0] === b.reps[1] ? b.reps[0] : b.reps[0] + '–' + b.reps[1]) + ' powt.' : 'cały dystans'} z zapasem RIR.`} Krok: ${fk(b.step || 2.5)} kg.</div></div>`;
  }
  if (type === 'bw') {
    const sg = lastAid(exId), up = bwUp(exId, b);
    return `<div class="plan-line"><label for="p-${exId}">${esc(b.aidLabel || 'Pomoc (guma) / dociążenie:')}</label>
      <input id="p-${exId}" data-plan="${exId}" value="${esc(v || '')}" placeholder="${esc(b.aidPh || 'np. czerwona')}" class="grow">
      <div class="plan-hint">${sg ? `Ostatnio ${esc(sg.last)}.` : `Wpisz ${b.aidPh ? 'wysokość gryfu (numer otworu albo cm)' : 'gumę (kolor) albo „+5 kg”'}.`}${up ? ` → ${esc(up)}.` : ''}</div></div>`;
  }
  return '';
}
function blockCard(B) {
  const b = B.b, c = S.current, wk = c.week;
  if (b.type === 'ss') {
    const heads = b.items.map((it, j) => `<div class="ss-tag">Superseria – ${'AB'[j]}${j === 0 ? ` (po niej ${restTxt(it.rest)} przejścia)` : ` (po niej ${restTxt(it.rest)} przerwy)`}</div>
      ${exHead(it.ex, simpleSummary(it, wk))}${it.type === 'work' || it.type === 'bw' ? planLine(it.ex, it.type, it, wk) : ''}`).join('<hr>');
    return `<div class="card" data-block="${B.bi}">${heads}<div class="sets">${B.rows.map(r => setRow(r)).join('')}</div></div>`;
  }
  return `<div class="card" data-block="${B.bi}">${exHead(b.ex, blockSummary(b, wk))}${planLine(b.ex, b.type, b, wk)}
    <div class="sets">${B.rows.map(r => setRow(r)).join('')}</div></div>`;
}
function simpleSummary(it, wk) {
  if (it.type === 'work') return `${it.reps[0] === it.reps[1] ? it.reps[0] : it.reps[0] + '–' + it.reps[1]}${it.side ? '/' + it.side : ''} powt., RIR ${wk === 1 ? it.rir + 1 : it.rir}`;
  if (it.type === 'bw') return `${it.reps[0]}–${it.reps[1]} powt., RIR ${wk === 1 ? it.rir + 1 : it.rir}`;
  if (it.type === 'time') return `${it.sec} s${it.side ? '/' + it.side : ''}`;
  return '';
}
function setRow(r) {
  const L = S.current.log[r.key] || {};
  const done = !!L.done;
  const kgPh = r.bwOnly ? '–' : r.kg != null ? fk(r.kg) : 'kg';
  const target = r.type === 'top' || r.kind === 'R'
    ? `<b>${r.label}</b> · ${r.kg != null ? fk(r.kg) + ' kg' : (r.bwOnly ? 'bez obc.' : '—')} × ${esc(r.repsTxt)}`
    : `<b>${r.label}</b>${r.ss ? ` ${esc(EX[r.ex].short || EX[r.ex].name)}` : ''} · ${esc(r.repsTxt)}${r.type === 'work' && r.kg != null ? ` · ${fk(r.kg)} kg` : ''}`;
  const meta = `${esc(r.desc)}${r.rpe ? ` · cel RPE ${r.rpe}` : ''} · ${r.ss && r.rest <= 30 ? 'przejście' : 'przerwa'} ${restTxt(r.rest)}`;
  let inputs;
  if (r.type === 'time') inputs = `<button type="button" class="hold-btn s-wide" data-hold="${r.key}">▶ ${r.hold} s${r.sides === 2 ? ' ×2' : ''}</button>`;
  else if (r.aid) inputs = `<input data-k="aid" data-key="${r.key}" value="${esc(L.aid ?? '')}" placeholder="${esc(S.current.plan[r.ex] || (r.aidPh ? 'otwór' : 'guma'))}" aria-label="${r.aidPh ? 'wysokość gryfu' : 'pomoc'}"><input class="num" inputmode="numeric" data-k="reps" data-key="${r.key}" value="${esc(L.reps ?? '')}" placeholder="${r.reps}" aria-label="powtórzenia">`;
  else if (r.type === 'dist') inputs = `<input class="num s-wide" inputmode="decimal" data-k="kg" data-key="${r.key}" value="${esc(fk(L.kg))}" placeholder="${kgPh}" aria-label="kg na rękę">`;
  else inputs = `<input class="num" inputmode="decimal" data-k="kg" data-key="${r.key}" value="${esc(fk(L.kg))}" placeholder="${kgPh}" aria-label="kg"${r.bwOnly ? ' disabled' : ''}><input class="num" inputmode="numeric" data-k="reps" data-key="${r.key}" value="${esc(L.reps ?? '')}" placeholder="${r.reps}" aria-label="powtórzenia">`;
  const rpe = r.kind === 'TS' && done ? `<div class="rpe">RPE serii: ${[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map(v => `<button type="button" data-rpe="${v}" data-key="${r.key}" class="${L.rpe === v ? 'on' : ''}">${fk(v)}</button>`).join('')}</div>` : '';
  return `<div class="set k-${r.kind}${done ? ' done' : ''}" data-row="${r.key}">
    <div class="s-lab">${target}<div class="s-meta">${meta}</div></div>
    ${inputs}<button type="button" class="s-done" data-done="${r.key}" aria-label="Zrobione">${done ? '✓' : 'Zrob.'}</button>${rpe}</div>`;
}
function mobRow(id) {
  const m = MOB[id], c = S.current;
  const done = !!c.mob[id];
  return `<div class="mob${done ? ' done' : ''}" data-mobrow="${id}">
    <input type="checkbox" data-mob="${id}"${done ? ' checked' : ''} aria-label="zrobione">
    <div><div class="m-name">${esc(m.name)}</div><div class="m-dose">${esc(m.dose)}</div><div class="m-opis">${esc(m.opis)}</div>
    ${m.hold ? `<button type="button" class="hold-btn" data-mobhold="${id}">▶ ${m.hold} s${m.sides === 2 ? ' ×2 strony' : ''}</button>` : ''}</div>
    ${m.fig && FIG[m.fig] ? `<button type="button" class="m-fig" data-fig="${m.fig}" data-bigfig="${m.fig}" data-title="${esc(m.name)}" aria-label="Powiększ"></button>` : '<span></span>'}</div>`;
}
function extraRow(key, title, text, sec) {
  const done = !!S.current.extra[key];
  return `<div class="mob${done ? ' done' : ''}"><input type="checkbox" data-extra="${key}"${done ? ' checked' : ''} aria-label="zrobione">
    <div><div class="m-name">${esc(title)}</div><div class="m-opis">${esc(text)}</div>
    <button type="button" class="hold-btn" data-seq="${key}">▶ ${mmss(sec)}</button></div><span></span></div>`;
}
function condRow(day, week) {
  const c = week === 6 ? { type: 'steady', name: 'Marsz spokojny (odciążenie)', minutes: 10, text: 'Tydzień odciążenia: 10 min spokojnego marszu zamiast zadania kondycyjnego.' } : day.cond;
  const done = !!S.current.extra.cond;
  const fig = c.type === 'emom' ? `<div class="ex-head">${figBox('kb_swing').replace('data-fig', 'data-open="kb_swing" data-fig')}<div class="grow"><button type="button" class="ex-more" data-open="kb_swing">Opis swingu</button></div></div>` : '';
  const lbl = c.type === 'interval' ? `${c.rounds} × ${c.work}/${c.rest} s` : c.type === 'emom' ? `${c.rounds} × ${c.every} s` : `${c.minutes}:00`;
  return `${fig}<div class="mob${done ? ' done' : ''}"><input type="checkbox" data-extra="cond"${done ? ' checked' : ''} aria-label="zrobione">
    <div><div class="m-name">${esc(c.name)}</div><div class="m-opis">${esc(c.text)}</div>
    <button type="button" class="hold-btn" data-seq="cond">▶ Start ${lbl}</button></div><span></span></div>`;
}

// ── obsługa zdarzeń ─────────────────────────────────────────────────────────
main.addEventListener('click', e => {
  const t = e.target.closest('button, input[type=checkbox]');
  if (!t) return;
  const d = t.dataset;
  if (d.go) { location.hash = '#/' + d.go; return; }
  if (d.start) { startDay(d.start); return; }
  if (d.done) { toggleDone(d.done); return; }
  if (d.rpe) { setRpe(d.key, +d.rpe); return; }
  if (d.open) { openEx(d.open); return; }
  if (d.bigfig) { openFig(d.bigfig, d.title); return; }
  if (d.mob) { S.current.mob[d.mob] = t.checked; t.closest('.mob').classList.toggle('done', t.checked); save(); return; }
  if (d.extra) { S.current.extra[d.extra] = t.checked; t.closest('.mob').classList.toggle('done', t.checked); save(); return; }
  if (d.mobhold) { const m = MOB[d.mobhold]; startHold(m.name, m.hold, m.sides || 1); return; }
  if (d.hold) { const r = VIEW.flat.find(x => x.key === d.hold); startHold(EX[r.ex].name, r.hold, r.sides); return; }
  if (d.seq) { startSeq(d.seq); return; }
  if (d.finish !== undefined) { finish(); return; }
});
main.addEventListener('input', e => {
  const t = e.target, d = t.dataset;
  if (d.plan) {
    const v = t.id && t.getAttribute('inputmode') === 'decimal' ? num(t.value) : t.value;
    S.current.plan[d.plan] = v; save();
    refreshRowsOf(d.plan);
    return;
  }
  if (d.key && d.k) {
    const r = VIEW.flat.find(x => x.key === d.key);
    const L = S.current.log[d.key] || (S.current.log[d.key] = { ex: r.ex, label: r.label, kind: r.kind, ord: r.ord });
    L[d.k] = d.k === 'aid' ? t.value : num(t.value);
    save();
  }
});
function refreshRowsOf(exId) {
  const c = S.current, day = DAYS.find(d => d.id === c.day);
  const blocks = rowsFor(day, c.week, c.plan);
  VIEW.blocks = blocks; VIEW.flat = blocks.flatMap(b => b.rows);
  for (const B of blocks) {
    if (!B.rows.some(r => r.ex === exId)) continue;
    for (const r of B.rows) {
      if (r.ex !== exId) continue;
      const el = main.querySelector(`[data-row="${r.key}"]`);
      if (!el) continue;
      const lab = el.querySelector('.s-lab'); const tmp = document.createElement('div'); tmp.innerHTML = setRow(r);
      lab.replaceWith(tmp.firstElementChild.querySelector('.s-lab'));
      const kgIn = el.querySelector('[data-k=kg]'); if (kgIn && !r.bwOnly) kgIn.placeholder = r.kg != null ? fk(r.kg) : 'kg';
      const aidIn = el.querySelector('[data-k=aid]'); if (aidIn) aidIn.placeholder = c.plan[exId] || (r.aidPh ? 'otwór' : 'guma');
    }
  }
}
function rowEl(key) { return main.querySelector(`[data-row="${key}"]`); }
function rerenderRow(key) {
  const r = VIEW.flat.find(x => x.key === key), el = rowEl(key);
  if (!r || !el) return;
  const tmp = document.createElement('div'); tmp.innerHTML = setRow(r);
  el.replaceWith(tmp.firstElementChild);
}
function toggleDone(key) {
  snd.unlock();
  if (S.settings.wake) snd.keepAwake(true);
  const c = S.current, r = VIEW.flat.find(x => x.key === key);
  const L = c.log[key] || (c.log[key] = { ex: r.ex, label: r.label, kind: r.kind, ord: r.ord });
  if (L.done) { L.done = false; save(); rerenderRow(key); return; }
  // wartości z pól (albo z planu, gdy puste)
  const el = rowEl(key);
  const kgIn = el.querySelector('[data-k=kg]'), repsIn = el.querySelector('[data-k=reps]'), aidIn = el.querySelector('[data-k=aid]');
  L.kg = kgIn ? (num(kgIn.value) ?? (r.bwOnly ? null : r.kg)) : (r.type === 'dist' ? r.kg : null);
  L.reps = repsIn ? (num(repsIn.value) ?? r.reps) : r.reps;
  if (aidIn) L.aid = aidIn.value || c.plan[r.ex] || '';
  L.done = true; L.t = Date.now(); L.ord = r.ord;
  save();
  rerenderRow(key);
  // przerwa
  const i = VIEW.flat.findIndex(x => x.key === key);
  const nxt = VIEW.flat.slice(i + 1).find(x => !(c.log[x.key] && c.log[x.key].done));
  const nextTxt = nxt ? `Dalej: ${EX[nxt.ex].name} – ${nxt.label}${nxt.kg != null && nxt.type !== 'bw' ? ', ' + fk(nxt.kg) + ' kg' : ''} × ${nxt.repsTxt}` : 'Dalej: kondycja';
  startRest(r.rest, `Przerwa po ${r.label} · ${EX[r.ex].name}`, nextTxt);
  if (r.kind === 'TS') toast('Zaznacz RPE serii szczytowej – na tej podstawie policzę następny ciężar.', 3200);
}
function setRpe(key, v) { const L = S.current.log[key]; if (!L) return; L.rpe = v; save(); rerenderRow(key); }
function finish() {
  const c = S.current;
  const doneSets = Object.values(c.log).filter(x => x.done).length;
  if (!confirm(`Zakończyć trening? Zrobione serie: ${doneSets}.`)) return;
  c.finished = Date.now(); c.timer = null;
  S.sessions.push(c); S.current = null; saveNow();
  stopTimer(); snd.keepAwake(false);
  toast('Trening zapisany.');
  location.hash = '#/historia';
}

// ── zegar: przerwy, przytrzymania, interwały ────────────────────────────────
const TEL = $('#timer');
let tickH = 0, flashed = false;
function startRest(sec, label, next) { runTimer({ phases: [{ dur: sec, kind: 'rest', label }], start: Date.now(), next, kind: 'rest' }); }
function startHold(name, sec, sides) {
  snd.unlock();
  const ph = sides === 2 ? [{ dur: 5, kind: 'prep', label: `${name} – ustaw się` }, { dur: sec, kind: 'hold', label: `${name} – strona 1` }, { dur: 5, kind: 'prep', label: 'Zmiana strony' }, { dur: sec, kind: 'hold', label: `${name} – strona 2` }]
    : [{ dur: 5, kind: 'prep', label: `${name} – ustaw się` }, { dur: sec, kind: 'hold', label: name }];
  runTimer({ phases: ph, start: Date.now(), next: 'Przytrzymanie', kind: 'seq' });
}
function startSeq(key) {
  snd.unlock();
  if (S.settings.wake) snd.keepAwake(true);
  const day = DAYS.find(d => d.id === S.current.day);
  let ph;
  if (key === 'warmup') ph = [{ dur: day.warmup.minutes * 60, kind: 'hold', label: 'Rozgrzewka ogólna' }];
  else {
    const c = S.current.week === 6 ? { type: 'steady', minutes: 10, name: 'Marsz spokojny' } : day.cond;
    if (c.type === 'interval') {
      ph = [{ dur: 10, kind: 'prep', label: 'Przygotuj się' }];
      for (let i = 1; i <= c.rounds; i++) {
        ph.push({ dur: c.work, kind: 'work', label: `Runda ${i}/${c.rounds} – MOCNO` });
        ph.push(i < c.rounds ? { dur: c.rest, kind: 'rest', label: `Runda ${i}/${c.rounds} – lekko` } : { dur: c.cooldown, kind: 'rest', label: 'Wyciszenie – spokojnie' });
      }
    } else if (c.type === 'emom') {
      ph = [{ dur: 10, kind: 'prep', label: 'Przygotuj się' }];
      for (let i = 1; i <= c.rounds; i++) ph.push({ dur: c.every, kind: 'work', label: `Minuta ${i}/${c.rounds} – ${c.note}` });
    } else ph = [{ dur: c.minutes * 60, kind: 'hold', label: c.name }];
  }
  runTimer({ phases: ph, start: Date.now(), next: key === 'warmup' ? 'Rozgrzewka' : 'Kondycja', kind: 'seq' });
}
function runTimer(t) {
  S.current && (S.current.timer = t); save();
  flashed = false;
  snd.schedule(t.phases, 0, S.settings.warn);
  showTimer(t);
}
function resumeTimer() {
  const t = S.current.timer; if (!t) return;
  const el = (Date.now() - t.start) / 1000, total = t.phases.reduce((s, p) => s + p.dur, 0);
  if (el > total + 120) { S.current.timer = null; save(); return; }
  flashed = el > total;
  snd.schedule(t.phases, el, S.settings.warn);
  showTimer(t);
}
function showTimer(t) {
  TEL.hidden = false; document.body.classList.add('timing');
  clearInterval(tickH); tickH = setInterval(() => drawTimer(t), 200); drawTimer(t);
}
function stopTimer() {
  clearInterval(tickH); TEL.hidden = true; document.body.classList.remove('timing'); snd.cancel();
  TEL.className = '';
  if (S.current) { S.current.timer = null; save(); }
}
function drawTimer(t) {
  const el = (Date.now() - t.start) / 1000;
  const total = t.phases.reduce((s, p) => s + p.dur, 0);
  let acc = 0, ph = t.phases[t.phases.length - 1], pStart = total - ph.dur;
  for (const p of t.phases) { if (el < acc + p.dur) { ph = p; pStart = acc; break; } acc += p.dur; }
  const left = pStart + ph.dur - el;
  const over = el >= total;
  TEL.querySelector('.t-label').textContent = over ? (t.kind === 'rest' ? 'Koniec przerwy – do sztangi!' : 'Koniec ✓') : ph.label;
  TEL.querySelector('.t-next').textContent = t.next || '';
  TEL.querySelector('.t-time').textContent = over ? (t.kind === 'rest' ? '+' + mmss(el - total) : '0:00') : mmss(Math.ceil(left));
  TEL.querySelector('.t-fill').style.width = `${Math.min(100, (el - pStart) / ph.dur * 100)}%`;
  TEL.className = over ? (el - total > 8 ? 'over still' : 'over') : (ph.kind === 'work' ? 'work' : (left <= S.settings.warn && (ph.kind === 'rest' || ph.kind === 'hold') ? 'warn' : ''));
  TEL.querySelector('[data-t=skip]').textContent = over ? 'OK' : 'Pomiń';
  if (over && !flashed) { flashed = true; const f = $('#flash'); f.hidden = false; f.style.animation = 'none'; void f.offsetWidth; f.style.animation = ''; setTimeout(() => { f.hidden = true; }, 950); }
  if (over && t.kind === 'seq' && el > total + 8) stopTimer();
}
TEL.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || !S.current || !S.current.timer) { if (b && b.dataset.t === 'skip') stopTimer(); return; }
  const t = S.current.timer, a = b.dataset.t;
  if (a === 'skip') { stopTimer(); return; }
  const el = (Date.now() - t.start) / 1000;
  let acc = 0, idx = t.phases.length - 1;
  for (let i = 0; i < t.phases.length; i++) { if (el < acc + t.phases[i].dur) { idx = i; break; } acc += t.phases[i].dur; }
  const delta = a === '+15' ? 15 : -15;
  t.phases[idx].dur = Math.max(1, t.phases[idx].dur + delta);
  flashed = (Date.now() - t.start) / 1000 >= t.phases.reduce((s, p) => s + p.dur, 0);
  save(); snd.schedule(t.phases, el, S.settings.warn); drawTimer(t);
});
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.current && S.current.timer) resumeTimer(); });

// ── okna: opis ćwiczenia, menu ──────────────────────────────────────────────
const DLG = $('#dlg');
let dlgAnim = null;
function openDlg(title, html, figId) {
  DLG.innerHTML = `<div class="dlg-head"><h2>${esc(title)}</h2><button type="button" data-close>Zamknij</button></div><div class="dlg-body">${html}</div>`;
  DLG.showModal();
  if (dlgAnim) dlgAnim.stop();
  const fe = DLG.querySelector('.big-fig');
  if (fe && figId && FIG[figId]) dlgAnim = animate(fe, FIG[figId]);
  DLG.querySelector('[data-close]').onclick = closeDlg;
}
function closeDlg() { if (dlgAnim) { dlgAnim.stop(); dlgAnim = null; } DLG.close(); }
DLG.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) { closeDlg(); location.hash = '#/' + b.dataset.go; } });
DLG.addEventListener('cancel', () => { if (dlgAnim) { dlgAnim.stop(); dlgAnim = null; } });
export function exDescHTML(e) {
  const li = a => (a || []).map(x => `<li>${esc(x)}</li>`).join('');
  return `<div class="desc">
    <h3>Co mam na myśli</h3><p>${esc(e.cel)}</p>
    ${e.sprzet ? `<h3>Sprzęt</h3><p>${esc(e.sprzet)}</p>` : ''}
    <h3>Ustawienie</h3><ul>${li(e.ustawienie)}</ul>
    <h3>Wykonanie</h3><ol>${li(e.wykonanie)}</ol>
    ${e.tempo ? `<h3>Tempo</h3><p>${esc(e.tempo)}</p>` : ''}
    <h3>Oddech</h3><p>${esc(e.oddech || 'Wdech i napięcie brzucha przed fazą opuszczania, wydech po minięciu najtrudniejszego punktu ruchu w górę.')}</p>
    <h3>Najczęstsze błędy</h3><ul>${li(e.bledy)}</ul>
    ${e.uwagi ? `<h3>Uwagi</h3><p>${esc(e.uwagi)}</p>` : ''}</div>`;
}
function openEx(exId) {
  const e = EX[exId];
  const h = historyOf(exId).slice(0, 6);
  const hist = h.length ? `<h3 class="sec">Historia</h3>${h.map(x => `<div class="hist-ex"><b>${dateTxt(x.s.started)} (T${x.s.week})</b>: ${x.rows.filter(r => r.kind !== 'R').map(r => `${r.label} ${r.aid ? esc(r.aid) + ' ' : ''}${r.kg != null ? fk(r.kg) : ''}×${r.reps ?? '?'}${r.rpe ? ' @' + fk(r.rpe) : ''}`).join(', ')}</div>`).join('')}` : '';
  openDlg(e.name, `${e.fig && FIG[e.fig] ? '<div class="big-fig"></div>' : '<div class="note small">Brak rysunku – ruch odbywa się w płaszczyźnie niewidocznej z boku.</div>'}
    <p class="mute small">${esc(e.en)} · animacja: pozycja startowa ↔ końcowa, ciemne kończyny = bliższa strona</p>${exDescHTML(e)}${hist}`, e.fig);
}
function openFig(figId, title) { openDlg(title, '<div class="big-fig"></div>', figId); }
function openMenu() {
  openDlg('Menu', `<div class="menu-list">
    ${S.current ? '<button class="btn primary wide" data-go="trening">Trening w toku</button>' : ''}
    <button class="btn wide" data-go="">Ekran główny</button>
    <button class="btn wide" data-go="zasady">Zasady planu, RPE i progresja</button>
    <button class="btn wide" data-go="historia">Historia treningów</button>
    <button class="btn wide" data-go="ustawienia">Ustawienia i kopia danych</button>
    <button class="btn wide" data-go="pomoc">Instalacja i obsługa</button>
    <button class="btn wide" data-go="zrodla">Źródła</button></div><p class="mute small num">Wersja ${VERSION}</p>`);
}

// ── strony informacyjne ─────────────────────────────────────────────────────
function renderRules() {
  main.innerHTML = `<h1>Zasady planu</h1>
  <div class="card"><h3>Tydzień</h3><p>3 treningi FBW (całe ciało): A → B → C, z co najmniej jednym dniem przerwy (np. pon–śr–pt albo wt–czw–sob). Opuszczony trening: robisz następny w kolejce, nie nadrabiasz dwóch dni pod rząd.</p>
  <p>W dni bez treningu: marsz 30–45 min (to, co dotąd robiłeś przed treningiem, przenosi się na dni wolne).</p></div>
  <div class="card"><h3>Blok 6 tygodni</h3><ul>
    <li><b>T1 – wejście:</b> seria szczytowa (TS) na RPE 7, pomocnicze z 3 powtórzeniami w zapasie.</li>
    <li><b>T2–T5 – progresja:</b> TS na RPE 8; ciężar wylicza aplikacja z poprzedniego treningu.</li>
    <li><b>T6 – odciążenie:</b> ${esc(WEEK_RULES[6].note)}</li>
    <li>Po T6 nowy blok od T1 – start od ok. 95% ostatniej serii szczytowej.</li></ul></div>
  <div class="card"><h3>Oznaczenia serii</h3><table class="t">
    <tr><th>Znak</th><th>Co to jest</th></tr>
    <tr><td><b>R1…R4</b></td><td>Serie rozgrzewkowe: rosnący ciężar w % ciężaru TS (albo ciężaru roboczego). Nie liczą się do pracy – mają przygotować technikę i układ nerwowy.</td></tr>
    <tr><td><b>TS</b></td><td>Seria szczytowa: 1 × 5 na RPE 8 (2 powtórzenia w zapasie). Najcięższa seria dnia. Po niej zaznacz RPE.</td></tr>
    <tr><td><b>BO1, BO2</b></td><td>Serie zejściowe: 85% ciężaru TS, więcej powtórzeń – objętość przy mniejszym zmęczeniu.</td></tr>
    <tr><td><b>S1…S3</b></td><td>Serie robocze w zakresie powtórzeń (np. 8–10) z zadanym RIR.</td></tr>
    <tr><td><b>1a / 1b</b></td><td>Superseria: ćwiczenie A, krótkie przejście (30 s), ćwiczenie B, przerwa, kolejna runda.</td></tr></table></div>
  <div class="card"><h3>Progresja</h3>
    <p><b>Seria szczytowa</b> (przysiad, martwy ciąg: krok 5 / 2,5 kg; wyciskanie leżąc: 2,5 kg):</p>
    <ul><li>5 powtórzeń przy RPE ≤ 7 → +5 kg (nogi) / +2,5 kg (wyciskanie).</li><li>RPE 7,5–8 → +2,5 kg.</li><li>RPE 8,5–9 → ten sam ciężar.</li><li>RPE ≥ 9,5 albo mniej niż 5 powtórzeń → −5 kg / −2,5 kg.</li></ul>
    <p><b>Ćwiczenia pomocnicze</b> – progresja podwójna: gdy we wszystkich seriach roboczych zrobisz górną granicę zakresu z zadanym RIR, następnym razem dokładasz jeden krok (sztanga 2,5 kg, hip thrust 5 kg, hantle zwykle 2 kg na hantel, wyciąg – jedna płytka). Do tego czasu dobijasz powtórzenia.</p>
    <p><b>Pompki na gryfie</b> (dzień B): gdy w obu seriach zrobisz 12 powtórzeń z 2 w zapasie → następnym razem gryf o jeden otwór niżej i znów od 8 powtórzeń. Po dojściu do podłogi: stopy na podwyższeniu, potem guma przez plecy albo kamizelka. W pomiarach Wurma i wsp. pompka z dłońmi 61 cm nad podłogą obciążała ok. 41% masy ciała, z dłońmi 30 cm – ok. 55%, a zwykła pompka – ok. 64%.</p></div>
  <div class="card"><h3>Przerwy</h3><p>Każda seria ma własną przerwę (widać ją w wierszu). „Zrobione” uruchamia zegar automatycznie. Sygnały: dwa krótkie piknięcia ${S.settings.warn} s przed końcem, odliczanie 3-2-1, na końcu długi podwójny sygnał, czerwony ekran i licznik „po czasie”.</p>
  <p class="small mute">Wg przeglądu z 2024 r. przerwy dłuższe niż 60 s dają niewielką przewagę dla przyrostu mięśni, a powyżej 90 s różnice już nie były widoczne – stąd 90–120 s w ćwiczeniach pomocniczych i dłuższe przerwy po seriach ciężkich.</p></div>
  <div class="card"><h3>RPE → RIR</h3><table class="t"><tr><th>RPE</th><th>RIR</th><th>Co to znaczy</th></tr>${RPE_TABLE.map(r => `<tr><td class="num">${r[0]}</td><td class="num">${r[1]}</td><td>${esc(r[2])}</td></tr>`).join('')}</table></div>
  <div class="card"><h3>Keto (Diety od Brokuła, 2000 kcal) a trening</h3>
    <ul><li>Wg firmy proporcje diety keto to ok. 80% energii z tłuszczu, 15% z białka i 5% z węglowodanów. Przy 2000 kcal daje to ok. <b>75 g białka</b> dziennie (15% × 2000 kcal ÷ 4 kcal/g – moje wyliczenie z proporcji, nie z etykiet).</li>
    <li>Meta-analiza Morton i wsp. (2018): dokładanie białka przestawało zwiększać przyrost beztłuszczowej masy ciała powyżej ok. <b>1,6 g/kg/dobę</b>. 75 g to dla dorosłego mężczyzny wyraźnie mniej. Jeśli chcesz chronić mięśnie na redukcji – zapytaj dietetyka cateringu o wariant z większą ilością białka albo o włączenie odżywki białkowej w ramach keto. Nie jestem dietetykiem – to informacja do decyzji, nie zalecenie.</li>
    <li>Siła na keto: meta-analiza Vargas-Molina i wsp. (2024) – brak istotnych różnic w 1RM przysiadu i wyciskania względem diety z węglowodanami.</li>
    <li>Wydolność: w przeglądzie z 2022 r. (sportowcy i trenujący) wyniki w próbach czasowych były korzystniejsze przy diecie bogatej w węglowodany niż na keto. Dlatego kondycja w planie to krótkie zrywy z długimi przerwami, EMOM i marsz pod górę – bez długich interwałów „do odcięcia”.</li></ul>
    <button class="btn wide" data-go="zrodla">Źródła</button></div>`;
}
function renderHistory() {
  const ss = [...S.sessions].reverse();
  main.innerHTML = `<h1>Historia</h1>${ss.length ? '' : '<p class="mute">Brak zapisanych treningów.</p>'}
  ${ss.map(s => {
    const rows = Object.values(s.log).filter(r => r.done).sort((a, b) => a.ord - b.ord);
    const byEx = {};
    rows.forEach(r => { (byEx[r.ex] = byEx[r.ex] || []).push(r); });
    return `<div class="card"><div class="row"><b class="grow">${dateTxt(s.started)} · Dzień ${s.day} · T${s.week}</b><span class="mute num small">${mmss((s.finished - s.started) / 1000)}</span></div>
      ${Object.entries(byEx).map(([ex, rs]) => `<div class="hist-ex"><b>${esc(EX[ex]?.name || ex)}</b>: ${rs.filter(r => r.kind !== 'R').map(r => `${r.label} ${r.aid ? esc(r.aid) + ' ' : ''}${r.kg != null ? fk(r.kg) : ''}×${r.reps ?? '?'}${r.rpe ? ' @' + fk(r.rpe) : ''}`).join(', ')}</div>`).join('')}
    </div>`;
  }).join('')}`;
}
function renderSettings() {
  const st = S.settings;
  main.innerHTML = `<h1>Ustawienia</h1>
  <div class="card">
    <div class="field"><label for="s-warn">Ostrzeżenie przed końcem przerwy</label><select id="s-warn">${[5, 10, 15, 20].map(v => `<option value="${v}"${st.warn === v ? ' selected' : ''}>${v} s</option>`).join('')}</select></div>
    <div class="field"><label for="s-sound">Dźwięk</label><select id="s-sound">
      <option value="mix"${st.sound === 'mix' ? ' selected' : ''}>Razem z muzyką (wyciszony przełącznikiem z boku telefonu)</option>
      <option value="always"${st.sound === 'always' ? ' selected' : ''}>Zawsze słychać, także przy wyciszeniu (może zatrzymać muzykę)</option></select>
      <span class="small mute">To ustawienie korzysta z funkcji Safari „Audio Session”. Nie miałem jak sprawdzić go na Twoim iPhonie – po instalacji zrób test oboma trybami, z muzyką i bez.</span></div>
    <div class="field"><label for="s-vol">Głośność sygnałów</label><input id="s-vol" type="range" min="0.2" max="1" step="0.1" value="${st.volume}"></div>
    <button class="btn wide" id="s-test">Test dźwięku (sygnał ostrzeżenia, 3-2-1, koniec)</button>
    <div class="field row"><input id="s-wake" type="checkbox"${st.wake ? ' checked' : ''}><label for="s-wake">Ekran nie gaśnie podczas treningu</label></div>
    <p class="small mute">Gdy telefon się zablokuje, iOS wstrzymuje aplikację i dźwięki nie zagrają. Czas przerwy liczy się jednak dalej – po odblokowaniu zegar pokaże właściwy stan.</p>
  </div>
  <div class="card"><h3>Kopia danych</h3>
    <p class="small">Dziennik jest tylko w tym telefonie (pamięć Safari). Rób kopię do Plików / iCloud Drive, np. raz w tygodniu.</p>
    <button class="btn wide" id="s-export">Zapisz kopię (plik .json)</button>
    <button class="btn wide" id="s-import">Wczytaj kopię z pliku</button>
    <button class="btn wide danger" id="s-reset">Usuń wszystkie dane z telefonu</button></div>`;
  $('#s-warn').onchange = e => { st.warn = +e.target.value; save(); };
  $('#s-sound').onchange = e => { st.sound = e.target.value; snd.configure({ mode: st.sound }); save(); };
  $('#s-vol').oninput = e => { st.volume = +e.target.value; snd.configure({ volume: st.volume }); save(); };
  $('#s-test').onclick = () => { if (!snd.test()) toast('Brak obsługi dźwięku w tej przeglądarce.'); };
  $('#s-wake').onchange = e => { st.wake = e.target.checked; save(); };
  $('#s-export').onclick = exportData;
  $('#s-import').onclick = () => $('#file-input').click();
  $('#s-reset').onclick = () => { if (confirm('Usunąć cały dziennik i ustawienia z tego telefonu? Tego nie da się cofnąć (chyba że masz kopię).')) { S = structuredClone(DEF); saveNow(); location.hash = '#/'; route(); } };
}
async function exportData() {
  const d = new Date(), name = `trening_${d.toISOString().slice(0, 10)}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}.json`;
  const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
  const file = new File([blob], name, { type: 'application/json' });
  const touch = matchMedia('(pointer: coarse)').matches;
  if (touch && navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
$('#file-input').onchange = async e => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f) return;
  try {
    const d = JSON.parse(await f.text());
    if (d.v !== 1 || !Array.isArray(d.sessions)) throw new Error('format');
    if (!confirm(`Wczytać kopię z ${d.sessions.length} treningami? Zastąpi obecne dane w telefonie.`)) return;
    S = { ...DEF, ...d, settings: { ...DEF.settings, ...d.settings } }; saveNow(); toast('Wczytano.'); location.hash = '#/'; route();
  } catch { toast('To nie jest plik kopii z tej aplikacji.'); }
};
function renderHelp() {
  main.innerHTML = `<h1>Instalacja i obsługa</h1>
  <div class="card"><h3>Instalacja na iPhonie</h3><ol>
    <li>Otwórz w Safari adres <b>dariuszsadek.github.io/Trening/</b>.</li>
    <li>Stuknij <b>Więcej</b> (⋯), potem <b>Udostępnij</b> – albo od razu <b>Udostępnij</b>, jeśli masz układ kart „Na dole” lub „Na górze”.</li>
    <li>Przewiń listę i stuknij <b>Do ekranu głównego</b> (jeśli jej nie ma: na dole listy <b>Edytuj czynności</b> i dodaj ją).</li>
    <li>Włącz <b>Otwórz jako aplikację www</b> → <b>Dodaj</b>.</li>
    <li>Uruchom aplikację raz z ikony, mając internet, i odczekaj kilka sekund – pobierze pliki. Potem działa bez internetu.</li></ol>
    <p class="small mute">Kroki według polskiej instrukcji Apple „Zamiana witryny w aplikację w Safari na iPhonie” (wersje iOS 26/27).</p></div>
  <div class="card"><h3>Trening krok po kroku</h3><ol>
    <li>Ekran główny → wybierz dzień (podświetlony jest następny w kolejce).</li>
    <li>W karcie ćwiczenia sprawdź „Plan serii szczytowej” / „Ciężar roboczy” – aplikacja podpowiada go z poprzedniego treningu. Zmiana planu przelicza wszystkie serie rozgrzewkowe.</li>
    <li>Po każdej serii dotknij <b>Zrob.</b> – zapisuje się ciężar i powtórzenia z pól (puste pole = wartość z planu) i rusza zegar przerwy.</li>
    <li>Po serii szczytowej zaznacz RPE – od niego zależy ciężar na następny raz.</li>
    <li>Pomyłka? Dotknij ✓ ponownie – seria wraca do „niezrobionej”. Pola możesz poprawiać w każdej chwili.</li>
    <li>Na końcu „Zakończ i zapisz trening”.</li></ol></div>
  <div class="card"><h3>Sygnały zegara</h3><ul>
    <li>${S.settings.warn} s przed końcem: dwa krótkie piknięcia, pasek robi się pomarańczowy.</li>
    <li>3-2-1: krótkie tyknięcia.</li><li>Koniec: długi podwójny sygnał, czerwony błysk i licznik „+0:05 po czasie”.</li>
    <li>Interwały: wysoki ton = start pracy, niski = start odpoczynku.</li></ul>
    <p class="small mute">iPhone nie pozwala aplikacjom internetowym na wibracje (Safari nie obsługuje Vibration API), więc sygnał jest dźwiękowy i wizualny.</p></div>`;
}
function renderSources() {
  const L = [
    ['ACSM Position Stand 2026 – Resistance Training Prescription…, Med Sci Sports Exerc 58(4):851–872', 'https://experts.mcmaster.ca/scholarly-works/3873753'],
    ['ACSM – podsumowanie wytycznych 2026', 'https://acsm.org/resistance-training-guideline/'],
    ['Singer i wsp. 2024 – przerwy między seriami a hipertrofia (meta-analiza)', 'https://pubmed.ncbi.nlm.nih.gov/39205815/'],
    ['Morton i wsp. 2018 – białko a trening oporowy (meta-analiza), BJSM 52:376–384', 'https://pubmed.ncbi.nlm.nih.gov/28698222/'],
    ['Vargas-Molina i wsp. 2024 – dieta keto a siła (meta-analiza), Nutrients 16:2200', 'https://pubmed.ncbi.nlm.nih.gov/39064644/'],
    ['Przegląd 2022 – dieta keto a wydolność i skład ciała u trenujących', 'https://pubmed.ncbi.nlm.nih.gov/35757868/'],
    ['Wurm, …, Ebben – Kinetic analysis of several variations of push-ups (ISBS, siły reakcji podłoża w wariantach pompek)', 'https://ojs.ub.uni-konstanz.de/cpa/article/view/4457'],
    ['Calatayud i wsp. 2015 – wyciskanie leżąc i pompki: podobne przyrosty siły, JSCR 29(1):246–253', 'https://pubmed.ncbi.nlm.nih.gov/24983847/'],
    ['Diety od Brokuła – opis diety keto', 'https://dietyodbrokula.pl/keto.html'],
    ['Safari 18.4 – naprawa Wake Lock w aplikacjach z ekranu początkowego', 'https://developer.apple.com/documentation/safari-release-notes/safari-18_4-release-notes'],
    ['Audio Session API (MDN)', 'https://developer.mozilla.org/en-US/docs/Web/API/Audio_Session_API'],
  ];
  main.innerHTML = `<h1>Źródła</h1><div class="card"><ul>${L.map(([t, u]) => `<li><a href="${u}" target="_blank" rel="noopener">${esc(t)}</a></li>`).join('')}</ul></div>
  <p class="small mute">Opisy mobilności pochodzą z Twojego poprzedniego planu (arkusz „Plan 4-dniowy (90 min)”).</p>`;
}

// ── service worker i aktualizacje ───────────────────────────────────────────
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').then(reg => {
    const show = () => { $('#update-banner').hidden = false; };
    if (reg.waiting) show();
    reg.addEventListener('updatefound', () => { const w = reg.installing; w && w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) show(); }); });
    $('#update-btn').onclick = () => { (reg.waiting) && reg.waiting.postMessage('SKIP_WAITING'); };
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloaded) { reloaded = true; saveNow(); location.reload(); } });
  }).catch(() => { /* offline lub brak https */ });
}
window.addEventListener('pagehide', saveNow);
route();
