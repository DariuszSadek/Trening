// Aplikacja treningowa dla synów – jeden kod, osobna instancja na każdego (brunon/, tymon/), osobne dane.
import { WEEKS, PHASES, phaseOf, DAYS, WARMUP, COOL, CEL_SYN } from './plan-syn.js';
import { EX, MOB } from '../js/cwiczenia.js';
import { FIG } from '../js/figs.js';
import { animate } from '../js/figure.js';
import * as snd from '../js/sound.js';
import { VERSION } from './version.js';

const APP = document.documentElement.dataset.app || 'brunon';
const NAME0 = document.documentElement.dataset.name || '';
const KEY = `trening.${APP}.v1`;
const DEF = { v: 1, app: APP, name: NAME0, settings: { warn: 10, sound: 'mix', volume: 0.8, wake: true }, sessions: [], current: null, weekStart: { count: 0, week: 1 } };
let S = load();
function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) { if (!s.name && NAME0) s.name = NAME0; return { ...DEF, ...s, settings: { ...DEF.settings, ...s.settings } }; } } catch { /* pusty */ }
  return structuredClone(DEF);
}
let saveT = 0;
function save() { clearTimeout(saveT); saveT = setTimeout(saveNow, 150); }
function saveNow() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { toast('Brak miejsca w pamięci – zrób kopię danych.'); } }
snd.configure({ mode: S.settings.sound, volume: S.settings.volume });

const ex = id => (CEL_SYN[id] ? { ...EX[id], cel: CEL_SYN[id] } : EX[id]);

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
const rr = r => r[0] === r[1] ? `${r[0]}` : `${r[0]}–${r[1]}`;
function toast(msg, ms = 2200) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = msg; document.body.appendChild(d); setTimeout(() => d.remove(), ms); }

// ── tydzień, faza, kolejny trening ──────────────────────────────────────────
function currentWeek() {
  const ws = S.weekStart || { count: 0, week: 1 };
  const done = Math.max(0, S.sessions.length - ws.count);
  return Math.min(WEEKS, ws.week + Math.floor(done / 3));
}
function nextDay() { const last = S.sessions[S.sessions.length - 1]; return !last ? 'A' : (last.day === 'A' ? 'B' : 'A'); }

// ── historia i sugestie ─────────────────────────────────────────────────────
function historyOf(exId) {
  const out = [];
  for (let i = S.sessions.length - 1; i >= 0; i--) {
    const s = S.sessions[i];
    const rows = Object.values(s.log || {}).filter(r => r.ex === exId && r.done);
    if (rows.length) out.push({ s, rows: rows.sort((a, b) => a.ord - b.ord) });
  }
  return out;
}
function suggest(item, ph) {
  const h = historyOf(item.ex).find(x => x.rows.some(r => r.kind === 'W'));
  if (!h) return null;
  const ws = h.rows.filter(r => r.kind === 'W');
  const last = `${dateTxt(h.s.started)}: ${ws.map(r => `${r.kg != null ? fk(r.kg) + '×' : ''}${r.reps ?? '?'}${r.aid ? ' (' + r.aid + ')' : ''}`).join(', ')}`;
  if (item.kind === 'time') return { last, why: 'trzymaj tyle, ile zadano – bez opadania bioder' };
  if (item.kind === 'dist') { const k = Math.max(...ws.map(r => r.kg ?? 0)); return { kg: k || null, last: `${dateTxt(h.s.started)}: ${fk(k)} kg`, why: 'zwiększ o krok, gdy cały dystans przechodzisz prosto i pewnie' }; }
  const hi = ph.reps ? ph.reps[1] : null;
  const top = hi && ws.every(r => (r.reps ?? 0) >= hi);
  if (item.kind === 'reps') return { last, why: top ? (item.variant ? 'wszystkie serie na górze zakresu – trudniejszy wariant (niżej dłonie)' : 'świetnie – utrzymaj jakość') : `dobijaj do ${hi} powtórzeń` };
  const kgs = ws.map(r => r.kg).filter(x => x != null);
  if (!kgs.length) return { last, why: 'wpisz ciężar, którego używasz' };
  const kg = Math.max(...kgs);
  if (top) return { kg: kg + item.step, last, why: `wszystkie serie ≥ ${hi} powt. → +${fk(item.step)} kg (jeśli technika była dobra)` };
  return { kg, last, why: `ten sam ciężar – dobijaj do ${hi} powtórzeń w każdej serii` };
}

// ── wiersze serii ───────────────────────────────────────────────────────────
function rowsFor(day, week, plan) {
  const P = phaseOf(week).n - 1;
  let ord = 0;
  const blocks = day.items.map((it, bi) => {
    const ph = it.ph[P], rows = [];
    const push = r => { r.ord = ord++; r.key = `${bi}.${rows.length}`; r.ex = it.ex; rows.push(r); };
    const W = num(plan[it.ex]);
    if (it.warm) push({ kind: 'R', type: 'kg', label: 'R', reps: 10, repsTxt: '10', kg: W ? Math.max(0, rnd(W / 2, it.step)) : null, desc: 'rozgrzewkowa – połowa ciężaru', rest: 60 });
    for (let i = 1; i <= ph.sets; i++) {
      const last = i === ph.sets;
      if (it.kind === 'time') push({ kind: 'W', type: 'time', label: `S${i}`, reps: null, repsTxt: ph.txt, kg: null, desc: 'przytrzymanie', rest: ph.rest, hold: ph.sec, sides: 1 });
      else push({ kind: 'W', type: it.kind, label: `S${i}`, reps: ph.reps[0], repsTxt: rr(ph.reps) + (it.side ? `/${it.side}` : ''), kg: it.kind === 'kg' ? W : null, desc: `zapas ${phaseOf(week).rir}${ph.txt ? ' · ' + ph.txt : ''}`, rest: ph.rest, variant: !!it.variant, last });
    }
    return { bi, it, ph, rows };
  });
  if (day.finish.type === 'dist') {
    const f = day.finish, rows = [], W = num(plan[f.ex]);
    for (let i = 1; i <= f.sets; i++) rows.push({ ord: ord++, key: `F.${i - 1}`, ex: f.ex, kind: 'W', type: 'dist', label: `S${i}`, reps: null, repsTxt: `${f.dist} m`, kg: W, desc: 'kg na rękę', rest: f.rest });
    blocks.push({ bi: 'F', it: { ex: f.ex, kind: 'dist', step: f.step, unit: 'kg na rękę' }, ph: { sets: f.sets }, rows, finish: true });
  }
  return blocks;
}

// ── nawigacja i pasek ───────────────────────────────────────────────────────
const main = $('#main');
let anims = [];
const io = new IntersectionObserver(ents => {
  for (const e of ents) {
    const el = e.target;
    if (e.isIntersecting && !el._anim) { el._anim = animate(el, FIG[el.dataset.fig]); anims.push(el._anim); }
    else if (!e.isIntersecting && el._anim) { el._anim.stop(); el._anim = null; }
  }
}, { rootMargin: '100px' });
function stopAnims() { anims.forEach(a => a.stop && a.stop()); anims = []; io.disconnect(); }
function attachFigs(root = document) { root.querySelectorAll('[data-fig]').forEach(el => { if (FIG[el.dataset.fig]) io.observe(el); }); }

function route() {
  stopAnims();
  const h = location.hash.replace('#/', '') || '';
  if (!S.name && h !== 'pomoc') renderName();
  else if (h === 'trening' && S.current) renderWorkout();
  else if (h === 'zasady') renderRules();
  else if (h === 'jedzenie') renderFood();
  else if (h === 'historia') renderHistory();
  else if (h === 'ustawienia') renderSettings();
  else if (h === 'pomoc') renderHelp();
  else if (h === 'zrodla') renderSources();
  else renderHome();
  updateBar(); window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
$('#btn-home').onclick = () => { location.hash = S.current ? '#/trening' : '#/'; if (!S.current) route(); };
$('#btn-menu').onclick = openMenu;
function updateBar() {
  $('.bar-title').textContent = S.name ? `Trening – ${S.name}` : 'Trening';
  const el = $('#bar-info');
  if (S.current) el.textContent = `${S.current.day} · tydz. ${S.current.week} · ${mmss((Date.now() - S.current.started) / 1000)}`;
  else el.textContent = `tydz. ${currentWeek()}/${WEEKS}`;
}
setInterval(updateBar, 1000);

// ── ekrany ──────────────────────────────────────────────────────────────────
function renderName() {
  main.innerHTML = `<h1>Cześć!</h1><div class="card"><p>To jest Twoja własna aplikacja treningowa. Twoje treningi i ciężary zapisują się tylko w tym telefonie.</p>
    <div class="field"><label for="nm">Jak masz na imię?</label><input id="nm" autocomplete="given-name" placeholder="imię"></div>
    <button class="btn primary wide" id="nm-ok">Zaczynamy</button></div>`;
  $('#nm').style.height = '44px';
  $('#nm-ok').onclick = () => { const v = $('#nm').value.trim(); if (!v) { toast('Wpisz imię.'); return; } S.name = v; saveNow(); route(); };
}
function estMinutes(day) {
  const week = currentWeek(); let s = 10 * 60 + 5 * 60;
  rowsFor(day, week, {}).forEach(b => b.rows.forEach(r => { s += 40 + r.rest; }));
  if (day.finish.type === 'interval') s += day.finish.rounds * (day.finish.work + day.finish.rest);
  return Math.round(s / 60 / 5) * 5;
}
function renderHome() {
  const w = currentWeek(), ph = phaseOf(w), nd = nextDay();
  main.innerHTML = `
    <h1>Cześć, ${esc(S.name)}!</h1>
    <div class="mute small">Trening całego ciała 3 razy w tygodniu, nigdy dwa dni pod rząd. Treningi A i B na zmianę.</div>
    <div class="card">
      <div class="row"><b class="grow">Tydzień ${w} z ${WEEKS}</b>
        <select id="week-sel" aria-label="Zmień tydzień">${Array.from({ length: WEEKS }, (_, i) => i + 1).map(i => `<option value="${i}"${i === w ? ' selected' : ''}>tydz. ${i}</option>`).join('')}</select></div>
      <div class="weekbox">${PHASES.map(p => `<span class="${p.n === ph.n ? 'on' : ''}">F${p.n}: tyg. ${p.from}–${p.to}</span>`).join('')}</div>
      <p class="small"><b>${ph.name}.</b> ${ph.note}</p>
    </div>
    ${S.current ? `<button class="btn primary wide" data-go="trening">Wróć do treningu ${esc(S.current.day)} (start ${timeTxt(S.current.started)})</button>` : ''}
    ${['A', 'B'].map(id => { const d = DAYS[id]; return `
      <button class="card day-card${id === nd ? ' next' : ''}" data-start="${id}">
        <div class="dc-head"><span class="dc-title">${d.title}</span>${id === nd ? '<span class="badge">następny</span>' : ''}</div>
        <div>${d.focus}</div><div class="mute small num">ok. ${estMinutes(d)} min</div></button>`; }).join('')}
    <div class="menu-list">
      <button class="btn wide" data-go="zasady">Zasady: fazy, zapas powtórzeń, ciężary</button>
      <button class="btn wide" data-go="jedzenie">Jedzenie i sen – bez tego masy nie będzie</button>
      <button class="btn wide" data-go="historia">Moje treningi (${S.sessions.length})</button>
      <button class="btn wide" data-go="ustawienia">Ustawienia, dźwięk, kopia danych</button>
      <button class="btn wide" data-go="pomoc">Instalacja i obsługa</button>
    </div>`;
  $('#week-sel').onchange = e => { S.weekStart = { count: S.sessions.length, week: +e.target.value }; save(); renderHome(); updateBar(); };
}
function startDay(id) {
  if (S.current && !confirm(`Trwa trening ${S.current.day}. Porzucić go i zacząć ${id}?`)) return;
  const day = DAYS[id], week = currentWeek(), P = phaseOf(week).n - 1, plan = {};
  for (const it of day.items) { const s = suggest(it, it.ph[P]); if (s && s.kg != null) plan[it.ex] = s.kg; else if (s && it.variant) { const a = historyOf(it.ex)[0]?.rows.filter(r => r.aid).pop(); if (a) plan[it.ex] = a.aid; } }
  if (day.finish.type === 'dist') { const s = suggest({ ex: day.finish.ex, kind: 'dist', step: day.finish.step }, {}); if (s && s.kg) plan[day.finish.ex] = s.kg; }
  S.current = { id: Date.now().toString(36), day: id, week, started: Date.now(), plan, log: {}, mob: {}, extra: {}, timer: null };
  save(); snd.unlock(); if (S.settings.wake) snd.keepAwake(true);
  location.hash = '#/trening';
}

let VIEW = null;
function renderWorkout() {
  const c = S.current, day = DAYS[c.day], ph = phaseOf(c.week);
  const blocks = rowsFor(day, c.week, c.plan);
  VIEW = { day, blocks, flat: blocks.flatMap(b => b.rows) };
  const main_ = blocks.filter(b => !b.finish), fin = blocks.find(b => b.finish);
  main.innerHTML = `
    <h1>${day.title} <span class="mute small num">tydz. ${c.week}</span></h1>
    <div class="note small"><b>${ph.name}.</b> ${ph.note}</div>
    <div class="sec">1. Rozgrzewka (8–10 min)</div>
    <div class="card"><div class="mob${c.extra.warmup ? ' done' : ''}"><input type="checkbox" data-extra="warmup"${c.extra.warmup ? ' checked' : ''} aria-label="zrobione">
      <div><ol class="m-opis">${WARMUP.map(x => `<li>${esc(x)}</li>`).join('')}</ol><button type="button" class="hold-btn" data-seq="warmup">▶ 5:00 rower/bieżnia</button></div><span></span></div></div>
    <div class="sec">2. Ćwiczenia – po kolei</div>
    ${main_.map((b, i) => card(b, i + 1)).join('')}
    <div class="sec">3. ${esc(day.finish.name)}</div>
    <div class="card">${fin ? card(fin, '', true) : finishInterval(day.finish)}</div>
    <div class="sec">4. Rozciąganie (5 min) – po 30 s</div>
    <div class="card">${COOL.map(id => mobRow(id)).join('')}</div>
    <button class="btn primary wide" data-finish>Zakończ i zapisz trening</button>
    <p class="mute small">Wszystko zapisuje się w telefonie na bieżąco.</p>`;
  attachFigs(main);
  if (c.timer) resumeTimer();
}
function figBox(figId, exId) {
  if (figId && FIG[figId]) return `<button type="button" class="ex-fig" data-open="${exId}" data-fig="${figId}" aria-label="Animacja"></button>`;
  return `<div class="ex-fig none">bez rysunku</div>`;
}
function card(B, n, inner = false) {
  const it = B.it, e = ex(it.ex), c = S.current, ph = B.ph;
  const summ = it.kind === 'time' ? `${ph.sets} × ${ph.txt}, przerwa ${restTxt(ph.rest)}` : it.kind === 'dist' ? `${ph.sets} × ${VIEW.day.finish.dist} m` :
    `${it.warm ? '1 rozgrzewkowa + ' : ''}${ph.sets} × ${rr(ph.reps)}${it.side ? '/' + it.side : ''}, zapas ${phaseOf(c.week).rir}, przerwa ${restTxt(ph.rest)}`;
  const sg = suggest(it, ph);
  let planLine = '';
  if (it.kind === 'kg' || it.kind === 'dist') planLine = `<div class="plan-line"><label for="p-${it.ex}">Ciężar:</label>
      <input id="p-${it.ex}" class="num" inputmode="decimal" data-plan="${it.ex}" value="${esc(fk(num(c.plan[it.ex])))}" placeholder="kg"> ${esc(it.unit)}
      <div class="plan-hint">${sg ? `Ostatnio ${esc(sg.last)} → ${esc(sg.why)}.` : 'Pierwszy raz: weź lekki ciężar i sprawdź technikę – ma zostać zapas powtórzeń.'}</div></div>`;
  if (it.variant) planLine = `<div class="plan-line"><label for="p-${it.ex}">Wariant:</label>
      <input id="p-${it.ex}" data-plan="${it.ex}" value="${esc(c.plan[it.ex] || '')}" placeholder="np. podłoga / ławka" class="grow">
      <div class="plan-hint">${sg ? `Ostatnio ${esc(sg.last)} → ${esc(sg.why)}.` : 'Mniej niż 6 z podłogi → dłonie na ławce.'}</div></div>`;
  const head = `<div class="ex-head">${figBox(e.fig, it.ex)}<div class="grow"><div class="ex-title">${n ? n + '. ' : ''}${esc(e.name)}</div><div class="ex-sub">${summ}</div>
    <button type="button" class="ex-more" data-open="${it.ex}">Jak to zrobić (pełny opis)</button></div></div>`;
  const body = `${head}${planLine}<div class="sets">${B.rows.map(r => setRow(r)).join('')}</div>`;
  return inner ? `<div data-block="${B.bi}">${body}</div>` : `<div class="card" data-block="${B.bi}">${body}</div>`;
}
function setRow(r) {
  const c = S.current, L = c.log[r.key] || {}, done = !!L.done;
  const target = `<b>${r.label}</b> · ${r.kg != null && r.type !== 'reps' ? fk(r.kg) + ' kg × ' : ''}${esc(r.repsTxt)}`;
  const meta = `${esc(r.desc)} · przerwa ${restTxt(r.rest)}`;
  let inputs;
  if (r.type === 'time') inputs = `<button type="button" class="hold-btn s-wide" data-hold="${r.key}">▶ ${r.hold} s</button>`;
  else if (r.type === 'dist') inputs = `<input class="num s-wide" inputmode="decimal" data-k="kg" data-key="${r.key}" value="${esc(fk(L.kg))}" placeholder="${r.kg != null ? fk(r.kg) : 'kg'}" aria-label="kg na rękę">`;
  else if (r.type === 'reps') inputs = r.variant
    ? `<input data-k="aid" data-key="${r.key}" value="${esc(L.aid ?? '')}" placeholder="${esc(c.plan[r.ex] || 'wariant')}" aria-label="wariant"><input class="num" inputmode="numeric" data-k="reps" data-key="${r.key}" value="${esc(L.reps ?? '')}" placeholder="${r.reps}" aria-label="powtórzenia">`
    : `<input class="num s-wide" inputmode="numeric" data-k="reps" data-key="${r.key}" value="${esc(L.reps ?? '')}" placeholder="${r.reps}" aria-label="powtórzenia">`;
  else inputs = `<input class="num" inputmode="decimal" data-k="kg" data-key="${r.key}" value="${esc(fk(L.kg))}" placeholder="${r.kg != null ? fk(r.kg) : 'kg'}" aria-label="kg"><input class="num" inputmode="numeric" data-k="reps" data-key="${r.key}" value="${esc(L.reps ?? '')}" placeholder="${r.reps}" aria-label="powtórzenia">`;
  return `<div class="set k-${r.kind}${done ? ' done' : ''}" data-row="${r.key}"><div class="s-lab">${target}<div class="s-meta">${meta}</div></div>
    ${inputs}<button type="button" class="s-done" data-done="${r.key}" aria-label="Zrobione">${done ? '✓' : 'Zrob.'}</button></div>`;
}
function finishInterval(f) {
  const d = !!S.current.extra.cond;
  return `<div class="mob${d ? ' done' : ''}"><input type="checkbox" data-extra="cond"${d ? ' checked' : ''} aria-label="zrobione">
    <div><div class="m-opis">${esc(f.text)}</div><button type="button" class="hold-btn" data-seq="cond">▶ Start ${f.rounds} × ${f.work}/${f.rest} s</button></div><span></span></div>`;
}
function mobRow(id) {
  const m = MOB[id], d = !!S.current.mob[id], sides = m.sides === 2;
  return `<div class="mob${d ? ' done' : ''}"><input type="checkbox" data-mob="${id}"${d ? ' checked' : ''} aria-label="zrobione">
    <div><div class="m-name">${esc(m.name)}</div><div class="m-dose">30 s${sides ? '/stronę' : ''}</div><div class="m-opis">${esc(m.opis)}</div>
    <button type="button" class="hold-btn" data-mobhold="${id}">▶ 30 s${sides ? ' ×2 strony' : ''}</button></div>
    ${m.fig && FIG[m.fig] ? `<button type="button" class="m-fig" data-fig="${m.fig}" data-bigfig="${m.fig}" data-title="${esc(m.name)}" aria-label="Powiększ"></button>` : '<span></span>'}</div>`;
}

// ── zdarzenia ───────────────────────────────────────────────────────────────
main.addEventListener('click', e => {
  const t = e.target.closest('button, input[type=checkbox]'); if (!t) return;
  const d = t.dataset;
  if (d.go !== undefined && t.tagName === 'BUTTON' && d.go !== '') { location.hash = '#/' + d.go; return; }
  if (d.start) { startDay(d.start); return; }
  if (d.done) { toggleDone(d.done); return; }
  if (d.open) { openEx(d.open); return; }
  if (d.bigfig) { openDlg(d.title, '<div class="big-fig"></div>', d.bigfig); return; }
  if (d.mob) { S.current.mob[d.mob] = t.checked; t.closest('.mob').classList.toggle('done', t.checked); save(); return; }
  if (d.extra) { S.current.extra[d.extra] = t.checked; t.closest('.mob').classList.toggle('done', t.checked); save(); return; }
  if (d.mobhold) { const m = MOB[d.mobhold]; startHold(m.name, 30, m.sides === 2 ? 2 : 1); return; }
  if (d.hold) { const r = VIEW.flat.find(x => x.key === d.hold); startHold(ex(r.ex).name, r.hold, 1); return; }
  if (d.seq) { startSeq(d.seq); return; }
  if (d.finish !== undefined) { finish(); return; }
});
main.addEventListener('input', e => {
  const t = e.target, d = t.dataset;
  if (d.plan) { S.current.plan[d.plan] = t.getAttribute('inputmode') === 'decimal' ? num(t.value) : t.value; save(); refreshRowsOf(d.plan); return; }
  if (d.key && d.k) {
    const r = VIEW.flat.find(x => x.key === d.key);
    const L = S.current.log[d.key] || (S.current.log[d.key] = { ex: r.ex, label: r.label, kind: r.kind, ord: r.ord });
    L[d.k] = d.k === 'aid' ? t.value : num(t.value); save();
  }
});
function rebuild() { const c = S.current; const blocks = rowsFor(DAYS[c.day], c.week, c.plan); VIEW.blocks = blocks; VIEW.flat = blocks.flatMap(b => b.rows); }
function refreshRowsOf(exId) {
  rebuild();
  for (const r of VIEW.flat.filter(x => x.ex === exId)) {
    const el = main.querySelector(`[data-row="${r.key}"]`); if (!el) continue;
    const tmp = document.createElement('div'); tmp.innerHTML = setRow(r);
    el.querySelector('.s-lab').replaceWith(tmp.firstElementChild.querySelector('.s-lab'));
    const kgIn = el.querySelector('[data-k=kg]'); if (kgIn) kgIn.placeholder = r.kg != null ? fk(r.kg) : 'kg';
    const aidIn = el.querySelector('[data-k=aid]'); if (aidIn) aidIn.placeholder = S.current.plan[exId] || 'wariant';
  }
}
function rerenderRow(key) {
  const r = VIEW.flat.find(x => x.key === key), el = main.querySelector(`[data-row="${key}"]`); if (!r || !el) return;
  const tmp = document.createElement('div'); tmp.innerHTML = setRow(r); el.replaceWith(tmp.firstElementChild);
}
function toggleDone(key) {
  snd.unlock(); if (S.settings.wake) snd.keepAwake(true);
  const c = S.current, r = VIEW.flat.find(x => x.key === key);
  const L = c.log[key] || (c.log[key] = { ex: r.ex, label: r.label, kind: r.kind, ord: r.ord });
  if (L.done) { L.done = false; save(); rerenderRow(key); return; }
  const el = main.querySelector(`[data-row="${key}"]`);
  const kgIn = el.querySelector('[data-k=kg]'), repsIn = el.querySelector('[data-k=reps]'), aidIn = el.querySelector('[data-k=aid]');
  L.kg = kgIn ? (num(kgIn.value) ?? r.kg) : null;
  L.reps = repsIn ? (num(repsIn.value) ?? r.reps) : r.reps;
  if (aidIn) L.aid = aidIn.value || c.plan[r.ex] || '';
  L.done = true; L.t = Date.now(); L.ord = r.ord;
  save(); rerenderRow(key);
  const i = VIEW.flat.findIndex(x => x.key === key);
  const nxt = VIEW.flat.slice(i + 1).find(x => !(c.log[x.key] && c.log[x.key].done));
  const nextTxt = nxt ? `Dalej: ${ex(nxt.ex).name} – ${nxt.label}${nxt.kg != null ? ', ' + fk(nxt.kg) + ' kg' : ''} × ${nxt.repsTxt}` : 'Dalej: rozciąganie';
  runTimer({ phases: [{ dur: r.rest, kind: 'rest', label: `Przerwa po ${r.label} · ${ex(r.ex).name}` }], start: Date.now(), next: nextTxt, kind: 'rest' });
}
function finish() {
  const c = S.current, n = Object.values(c.log).filter(x => x.done).length;
  if (!confirm(`Zakończyć trening? Zrobione serie: ${n}.`)) return;
  c.finished = Date.now(); c.timer = null; S.sessions.push(c); S.current = null; saveNow();
  stopTimer(); snd.keepAwake(false); toast('Trening zapisany. Brawo!'); location.hash = '#/historia';
}

// ── zegar ───────────────────────────────────────────────────────────────────
const TEL = $('#timer'); let tickH = 0, flashed = false;
function startHold(name, sec, sides) {
  snd.unlock();
  const ph = sides === 2 ? [{ dur: 5, kind: 'prep', label: `${name} – ustaw się` }, { dur: sec, kind: 'hold', label: `${name} – strona 1` }, { dur: 5, kind: 'prep', label: 'Zmiana strony' }, { dur: sec, kind: 'hold', label: `${name} – strona 2` }]
    : [{ dur: 5, kind: 'prep', label: `${name} – ustaw się` }, { dur: sec, kind: 'hold', label: name }];
  runTimer({ phases: ph, start: Date.now(), next: 'Przytrzymanie', kind: 'seq' });
}
function startSeq(key) {
  snd.unlock(); if (S.settings.wake) snd.keepAwake(true);
  let ph;
  if (key === 'warmup') ph = [{ dur: 300, kind: 'hold', label: 'Rozgrzewka – rower/bieżnia' }];
  else {
    const f = DAYS[S.current.day].finish; ph = [{ dur: 10, kind: 'prep', label: 'Przygotuj się' }];
    for (let i = 1; i <= f.rounds; i++) { ph.push({ dur: f.work, kind: 'work', label: `Runda ${i}/${f.rounds} – SZYBKO` }); ph.push({ dur: f.rest, kind: 'rest', label: `Runda ${i}/${f.rounds} – spokojnie` }); }
  }
  runTimer({ phases: ph, start: Date.now(), next: key === 'warmup' ? 'Rozgrzewka' : 'Sprawność', kind: 'seq' });
}
function runTimer(t) { if (S.current) S.current.timer = t; save(); flashed = false; snd.schedule(t.phases, 0, S.settings.warn); showTimer(t); }
function resumeTimer() {
  const t = S.current.timer; if (!t) return;
  const el = (Date.now() - t.start) / 1000, total = t.phases.reduce((s, p) => s + p.dur, 0);
  if (el > total + 120) { S.current.timer = null; save(); return; }
  flashed = el > total; snd.schedule(t.phases, el, S.settings.warn); showTimer(t);
}
function showTimer(t) { TEL.hidden = false; document.body.classList.add('timing'); clearInterval(tickH); tickH = setInterval(() => drawTimer(t), 200); drawTimer(t); }
function stopTimer() { clearInterval(tickH); TEL.hidden = true; document.body.classList.remove('timing'); snd.cancel(); TEL.className = ''; if (S.current) { S.current.timer = null; save(); } }
function drawTimer(t) {
  const el = (Date.now() - t.start) / 1000, total = t.phases.reduce((s, p) => s + p.dur, 0);
  let acc = 0, ph = t.phases[t.phases.length - 1], pStart = total - ph.dur;
  for (const p of t.phases) { if (el < acc + p.dur) { ph = p; pStart = acc; break; } acc += p.dur; }
  const left = pStart + ph.dur - el, over = el >= total;
  TEL.querySelector('.t-label').textContent = over ? (t.kind === 'rest' ? 'Koniec przerwy – kolejna seria!' : 'Koniec ✓') : ph.label;
  TEL.querySelector('.t-next').textContent = t.next || '';
  TEL.querySelector('.t-time').textContent = over ? (t.kind === 'rest' ? '+' + mmss(el - total) : '0:00') : mmss(Math.ceil(left));
  TEL.querySelector('.t-fill').style.width = `${Math.min(100, (el - pStart) / ph.dur * 100)}%`;
  TEL.className = over ? (el - total > 8 ? 'over still' : 'over') : (ph.kind === 'work' ? 'work' : (left <= S.settings.warn && (ph.kind === 'rest' || ph.kind === 'hold') ? 'warn' : ''));
  TEL.querySelector('[data-t=skip]').textContent = over ? 'OK' : 'Pomiń';
  if (over && !flashed) { flashed = true; const f = $('#flash'); f.hidden = false; f.style.animation = 'none'; void f.offsetWidth; f.style.animation = ''; setTimeout(() => { f.hidden = true; }, 950); }
  if (over && t.kind === 'seq' && el > total + 8) stopTimer();
}
TEL.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (!S.current || !S.current.timer || b.dataset.t === 'skip') { stopTimer(); return; }
  const t = S.current.timer, el = (Date.now() - t.start) / 1000;
  let acc = 0, idx = t.phases.length - 1;
  for (let i = 0; i < t.phases.length; i++) { if (el < acc + t.phases[i].dur) { idx = i; break; } acc += t.phases[i].dur; }
  t.phases[idx].dur = Math.max(1, t.phases[idx].dur + (b.dataset.t === '+15' ? 15 : -15));
  flashed = el >= t.phases.reduce((s, p) => s + p.dur, 0);
  save(); snd.schedule(t.phases, el, S.settings.warn); drawTimer(t);
});
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.current && S.current.timer) resumeTimer(); });

// ── okna ────────────────────────────────────────────────────────────────────
const DLG = $('#dlg'); let dlgAnim = null;
function openDlg(title, html, figId) {
  DLG.innerHTML = `<div class="dlg-head"><h2>${esc(title)}</h2><button type="button" data-close>Zamknij</button></div><div class="dlg-body">${html}</div>`;
  DLG.showModal(); if (dlgAnim) dlgAnim.stop();
  const fe = DLG.querySelector('.big-fig'); if (fe && figId && FIG[figId]) dlgAnim = animate(fe, FIG[figId]);
  DLG.querySelector('[data-close]').onclick = closeDlg;
}
function closeDlg() { if (dlgAnim) { dlgAnim.stop(); dlgAnim = null; } DLG.close(); }
DLG.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) { closeDlg(); location.hash = '#/' + b.dataset.go; } });
DLG.addEventListener('cancel', () => { if (dlgAnim) { dlgAnim.stop(); dlgAnim = null; } });
function openEx(id) {
  const e = ex(id), li = a => (a || []).map(x => `<li>${esc(x)}</li>`).join('');
  const h = historyOf(id).slice(0, 6);
  openDlg(e.name, `${e.fig && FIG[e.fig] ? '<div class="big-fig"></div>' : ''}
    <p class="mute small">Animacja: pozycja startowa ↔ końcowa. Ciemne ręce i nogi = strona bliżej Ciebie.</p>
    <div class="desc"><h3>Po co to ćwiczenie</h3><p>${esc(e.cel)}</p>${e.sprzet ? `<h3>Sprzęt</h3><p>${esc(e.sprzet)}</p>` : ''}
    <h3>Ustawienie</h3><ul>${li(e.ustawienie)}</ul><h3>Wykonanie</h3><ol>${li(e.wykonanie)}</ol>
    ${e.tempo ? `<h3>Tempo</h3><p>${esc(e.tempo)}</p>` : ''}<h3>Oddech</h3><p>${esc(e.oddech || 'Wdech i napięcie brzucha przed fazą opuszczania, wydech po minięciu najtrudniejszego punktu ruchu.')}</p>
    <h3>Najczęstsze błędy</h3><ul>${li(e.bledy)}</ul>${e.uwagi ? `<h3>Uwagi</h3><p>${esc(e.uwagi)}</p>` : ''}</div>
    ${h.length ? `<h3 class="sec">Moja historia</h3>${h.map(x => `<div class="hist-ex"><b>${dateTxt(x.s.started)}</b>: ${x.rows.filter(r => r.kind !== 'R').map(r => `${r.kg != null ? fk(r.kg) + '×' : ''}${r.reps ?? '?'}${r.aid ? ' (' + esc(r.aid) + ')' : ''}`).join(', ')}</div>`).join('')}` : ''}`, e.fig);
}
function openMenu() {
  openDlg('Menu', `<div class="menu-list">${S.current ? '<button class="btn primary wide" data-go="trening">Trening w toku</button>' : ''}
    <button class="btn wide" data-go="">Ekran główny</button><button class="btn wide" data-go="zasady">Zasady</button>
    <button class="btn wide" data-go="jedzenie">Jedzenie i sen</button><button class="btn wide" data-go="historia">Moje treningi</button>
    <button class="btn wide" data-go="ustawienia">Ustawienia i kopia danych</button><button class="btn wide" data-go="pomoc">Instalacja i obsługa</button>
    <button class="btn wide" data-go="zrodla">Źródła</button></div><p class="mute small num">Wersja ${VERSION} · aplikacja: ${esc(NAME0 || APP)}</p>`);
}

// ── strony informacyjne ─────────────────────────────────────────────────────
function renderRules() {
  main.innerHTML = `<h1>Zasady</h1>
  <div class="card"><h3>Bezpieczeństwo</h3><ul>
    <li>Pierwsze tygodnie tylko pod okiem taty albo trenera – każda seria.</li>
    <li>Technika przed ciężarem. Ciężar rośnie dopiero, gdy ruch wygląda dokładnie jak w opisie.</li>
    <li>Ból w stawie, kręgosłupie albo ostry ból (inny niż zmęczenie i „pieczenie” mięśnia) = przerywasz ćwiczenie i nie wracasz do niego bez konsultacji.</li>
    <li>Żadnych serii „do upadku” i prób maksymalnego ciężaru – zawsze zostaje zapas powtórzeń.</li></ul></div>
  <div class="card"><h3>Tydzień</h3><p>3 treningi, nigdy dwa dni pod rząd (np. pon–śr–pt). A i B na zmianę: tydzień 1: A–B–A, tydzień 2: B–A–B… Aplikacja sama podświetla następny.</p></div>
  <div class="card"><h3>Fazy</h3><table class="t"><tr><th>Faza</th><th>Tygodnie</th><th>Serie × powt.</th><th>Zapas</th></tr>
    <tr><td>1 – technika</td><td class="num">1–4</td><td class="num">2 × 12–15</td><td class="num">3–4</td></tr>
    <tr><td>2 – budowa</td><td class="num">5–8</td><td class="num">3 × 10–12</td><td class="num">2–3</td></tr>
    <tr><td>3 – siła i masa</td><td class="num">9–12</td><td class="num">3 × 8–10</td><td class="num">2</td></tr></table>
    <p class="small mute">Deska, pompki, most, dead bug i ćwiczenia na ramiona mają własne liczby – widać je w karcie ćwiczenia.</p></div>
  <div class="card"><h3>Zapas powtórzeń – jak ocenić</h3><table class="t">
    <tr><td class="num">4</td><td>Lekko. Mógłbyś zrobić jeszcze 4 powtórzenia.</td></tr><tr><td class="num">3</td><td>Średnio. Jeszcze 3 by weszły.</td></tr>
    <tr><td class="num">2</td><td>Ciężko, ale ruch nadal równy i czysty.</td></tr><tr><td class="num">1</td><td>Bardzo ciężko – tak nie kończymy serii.</td></tr>
    <tr><td class="num">0</td><td>Nie dasz rady ani jednego więcej – w tym planie nigdy.</td></tr></table></div>
  <div class="card"><h3>Kiedy więcej ciężaru</h3><p>Gdy w KAŻDEJ serii zrobisz górną granicę powtórzeń z dobrą techniką i z zapasem – na następnym treningu weź najmniejszy możliwy większy ciężar (hantle zwykle +1–2 kg, wyciąg/suwnica +1 płytka). Aplikacja podpowie to sama. Po zwiększeniu powtórzeń będzie mniej – to normalne.</p></div>`;
}
function renderFood() {
  main.innerHTML = `<h1>Jedzenie i sen</h1><div class="card"><ul>
    <li>Mięśnie rosną tylko wtedy, gdy organizm dostaje więcej energii, niż zużywa. Przy szczupłej sylwetce najczęstszy problem to po prostu za mało jedzenia.</li>
    <li>Regularnie: 3 posiłki + 2 przekąski. W każdym posiłku źródło białka (mięso, ryba, jajka, nabiał, rośliny strączkowe) i węglowodanów (pieczywo, kasza, ryż, makaron, ziemniaki, owoce).</li>
    <li>Po treningu normalny posiłek (np. obiad) – specjalne odżywki nie są potrzebne.</li>
    <li>Sen: zalecenie Amerykańskiej Akademii Medycyny Snu dla nastolatków 13–18 lat to 8–10 godzin na dobę, regularnie.</li>
    <li>Suplementy nie są potrzebne. Jeśli masa ciała mimo jedzenia stoi w miejscu przez kilka tygodni – pogadaj z tatą o wizycie u lekarza lub dietetyka.</li>
    <li>Masa ciała raz w tygodniu rano, ten sam dzień, przed śniadaniem.</li></ul></div>`;
}
function renderHistory() {
  const ss = [...S.sessions].reverse();
  main.innerHTML = `<h1>Moje treningi</h1>${ss.length ? '' : '<p class="mute">Jeszcze nic – pierwszy trening przed Tobą.</p>'}
  ${ss.map(s => { const by = {}; Object.values(s.log).filter(r => r.done).sort((a, b) => a.ord - b.ord).forEach(r => { (by[r.ex] = by[r.ex] || []).push(r); });
    return `<div class="card"><div class="row"><b class="grow">${dateTxt(s.started)} · ${s.day} · tydz. ${s.week}</b><span class="mute num small">${mmss((s.finished - s.started) / 1000)}</span></div>
    ${Object.entries(by).map(([id, rs]) => `<div class="hist-ex"><b>${esc(ex(id)?.name || id)}</b>: ${rs.filter(r => r.kind !== 'R').map(r => `${r.kg != null ? fk(r.kg) + '×' : ''}${r.reps ?? '✓'}${r.aid ? ' (' + esc(r.aid) + ')' : ''}`).join(', ')}</div>`).join('')}</div>`; }).join('')}`;
}
function renderSettings() {
  const st = S.settings;
  main.innerHTML = `<h1>Ustawienia</h1><div class="card">
    <div class="field"><label for="s-name">Imię</label><input id="s-name" value="${esc(S.name)}"></div>
    <div class="field"><label for="s-warn">Sygnał przed końcem przerwy</label><select id="s-warn">${[5, 10, 15, 20].map(v => `<option value="${v}"${st.warn === v ? ' selected' : ''}>${v} s</option>`).join('')}</select></div>
    <div class="field"><label for="s-sound">Dźwięk</label><select id="s-sound"><option value="mix"${st.sound === 'mix' ? ' selected' : ''}>Razem z muzyką (wyciszony przełącznikiem z boku telefonu)</option>
      <option value="always"${st.sound === 'always' ? ' selected' : ''}>Zawsze słychać, także przy wyciszeniu (może zatrzymać muzykę)</option></select></div>
    <div class="field"><label for="s-vol">Głośność sygnałów</label><input id="s-vol" type="range" min="0.2" max="1" step="0.1" value="${st.volume}"></div>
    <button class="btn wide" id="s-test">Test dźwięku</button>
    <div class="field row"><input id="s-wake" type="checkbox"${st.wake ? ' checked' : ''}><label for="s-wake">Ekran nie gaśnie podczas treningu</label></div></div>
  <div class="card"><h3>Kopia danych</h3><p class="small">Twoje treningi są tylko w tym telefonie. Raz na jakiś czas zapisz kopię do Plików.</p>
    <button class="btn wide" id="s-export">Zapisz kopię (plik)</button><button class="btn wide" id="s-import">Wczytaj kopię</button>
    <button class="btn wide danger" id="s-reset">Usuń wszystkie dane</button></div>`;
  $('#s-name').style.height = '40px';
  $('#s-name').onchange = e => { S.name = e.target.value.trim() || S.name; save(); updateBar(); };
  $('#s-warn').onchange = e => { st.warn = +e.target.value; save(); };
  $('#s-sound').onchange = e => { st.sound = e.target.value; snd.configure({ mode: st.sound }); save(); };
  $('#s-vol').oninput = e => { st.volume = +e.target.value; snd.configure({ volume: st.volume }); save(); };
  $('#s-test').onclick = () => { if (!snd.test()) toast('Brak obsługi dźwięku.'); };
  $('#s-wake').onchange = e => { st.wake = e.target.checked; save(); };
  $('#s-export').onclick = exportData; $('#s-import').onclick = () => $('#file-input').click();
  $('#s-reset').onclick = () => { if (confirm('Na pewno usunąć wszystkie treningi z tego telefonu? Tego nie da się cofnąć.')) { S = structuredClone(DEF); saveNow(); location.hash = '#/'; route(); } };
}
async function exportData() {
  const d = new Date(), name = `trening_${APP}_${d.toISOString().slice(0, 10)}.json`;
  const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' }), file = new File([blob], name, { type: 'application/json' });
  if (matchMedia('(pointer: coarse)').matches && navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: name }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
$('#file-input').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const d = JSON.parse(await f.text());
    if (d.v !== 1 || !Array.isArray(d.sessions)) throw new Error('format');
    if (d.app && d.app !== APP) { toast('To kopia z innej aplikacji (innej osoby) – nie wczytuję.', 3500); return; }
    if (!confirm(`Wczytać kopię (${d.sessions.length} treningów)? Zastąpi obecne dane.`)) return;
    S = { ...DEF, ...d, settings: { ...DEF.settings, ...d.settings } }; saveNow(); toast('Wczytano.'); location.hash = '#/'; route();
  } catch { toast('To nie jest plik kopii z tej aplikacji.'); }
};
function renderHelp() {
  main.innerHTML = `<h1>Instalacja i obsługa</h1>
  <div class="card"><h3>Instalacja na iPhonie</h3><ol>
    <li>Otwórz w Safari swój adres: <b>dariuszsadek.github.io/Trening/${APP}/</b></li>
    <li>Stuknij <b>Więcej</b> (⋯), potem <b>Udostępnij</b> – albo od razu <b>Udostępnij</b>, jeśli masz układ kart „Na dole” lub „Na górze”.</li>
    <li>Przewiń i stuknij <b>Do ekranu głównego</b> (jeśli jej nie ma: na dole listy <b>Edytuj czynności</b>).</li>
    <li>Włącz <b>Otwórz jako aplikację www</b> → <b>Dodaj</b>.</li>
    <li>Uruchom raz z ikony, mając internet – potem działa bez internetu.</li></ol>
    <p class="small mute">Kroki według polskiej instrukcji Apple „Zamiana witryny w aplikację w Safari na iPhonie” (iOS 26/27).</p></div>
  <div class="card"><h3>Na treningu</h3><ol>
    <li>Wybierz trening (podświetlony jest następny).</li>
    <li>W karcie ćwiczenia wpisz ciężar – aplikacja podpowie go od drugiego treningu.</li>
    <li>Po każdej serii stuknij <b>Zrob.</b> – zapisuje ciężar i powtórzenia z pól (puste = wartość z planu) i rusza zegar przerwy.</li>
    <li>Sygnały: ${S.settings.warn} s przed końcem dwa piknięcia, potem 3-2-1, na końcu długi sygnał i czerwony ekran.</li>
    <li>Pomyłka? Stuknij ✓ jeszcze raz.</li></ol></div>`;
}
function renderSources() {
  const L = [
    ['Faigenbaum i wsp. 2009 – Youth resistance training: NSCA position statement, JSCR 23(5 Suppl):S60–S79', 'https://pubmed.ncbi.nlm.nih.gov/19620931/'],
    ['Lloyd i wsp. 2014 – Position statement on youth resistance training: International Consensus, BJSM 48(7):498–505', 'https://pubmed.ncbi.nlm.nih.gov/24055781/'],
    ['AASM – zalecana długość snu nastolatków', 'https://aasm.org/advocacy/position-statements/teen-sleep-duration-health-advisory/'],
  ];
  main.innerHTML = `<h1>Źródła</h1><div class="card"><ul>${L.map(([t, u]) => `<li><a href="${u}" target="_blank" rel="noopener">${esc(t)}</a></li>`).join('')}</ul></div>`;
}

// ── service worker ──────────────────────────────────────────────────────────
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js', { scope: './' }).then(reg => {
    const show = () => { $('#update-banner').hidden = false; };
    if (reg.waiting) show();
    reg.addEventListener('updatefound', () => { const w = reg.installing; w && w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) show(); }); });
    $('#update-btn').onclick = () => { reg.waiting && reg.waiting.postMessage('SKIP_WAITING'); };
    let reloaded = false; const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController && !reloaded) { reloaded = true; saveNow(); location.reload(); } });
  }).catch(() => { /* offline */ });
}
window.addEventListener('pagehide', saveNow);
route();
