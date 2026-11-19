// Leonida Atlas v3 — boot, rendering and interaction for the trophy atlas.
// Data comes from data/trophies.json (the 55 official trophies, each with a
// guide whose every step carries bracketed source citations like [1][8]).
// v3 changes: ledger rows carry the official description under the name,
// citation chips name their source (not just a number), counter trophies
// expose a PSN target (0 / N), every guide step has its own checkbox whose
// ticks ARE the trophy's step progress, and the roadmap shows cumulative
// hours plus missable warnings per stage. Nothing is fetched from the
// network beyond the app's own files.

import { demoState, emptyState, exportState, loadState, parseImported, saveState } from './store.js';
import { cumulativeHours, nextUpQueue, platinumEta, sessionPlan } from './planner.js';

const params = new URLSearchParams(location.search);
const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const sources = doc.sources;
const stages = doc.stages;
const byId = new Map(trophies.map((t) => [t.id, t]));
const sourceName = (n) => (sources[n - 1] ? sources[n - 1].name.split('—')[0].trim() : `Source ${n}`);

let state = params.get('seed') === 'demo' ? demoState() : loadState();
if (params.get('seed') === 'demo') saveState(state);

let selectedId = 28; // Positive Mental Attitude opens by default.
let activeView = ['ledger', 'roadmap', 'missables', 'planner', 'matrix', 'sources'].includes(params.get('view'))
  ? params.get('view')
  : 'ledger';
let kindFilter = 'all';

const $ = (id) => document.getElementById(id);
const earnedSet = () => new Set(state.earned);
const isEarned = (t) => earnedSet().has(t.id);
const counterOf = (t) => Math.min(t.target || t.count || 0, state.counters[t.id] || 0);
const stepsDoneSet = (t) => new Set((state.stepsDone && state.stepsDone[t.id]) || []);
const stepsDoneCount = (t) => (isEarned(t) ? t.steps.length : Math.min(t.steps.length, stepsDoneSet(t).size));
const citedByCount = (n) => trophies.filter((t) => t.sources.includes(n)).length;
const totalSteps = trophies.reduce((sum, t) => sum + t.steps.length, 0);
const citedSteps = trophies.reduce((sum, t) => sum + t.steps.filter((s) => /\[\d+\]/.test(s)).length, 0);
const cumHours = cumulativeHours(stages);
const totalHours = stages.reduce((sum, s) => sum + s.hours, 0);

function esc(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function citeChip(n) {
  // v3: the chip names its source, so a screenshot alone shows who backs a step.
  return `<span class="cite">[${n}] ${esc(sourceName(n))}</span>`;
}

function citeHtml(text) {
  return esc(text).replace(/\[(\d+)\]/g, (m, n) => citeChip(Number(n)));
}

function spoilerMasked(t) {
  return state.spoilerSafe && t.kind === 'story' && !isEarned(t);
}

function displayName(t) {
  return spoilerMasked(t) ? 'Story trophy — hidden until earned' : t.name;
}

function flagPip(t) {
  if (t.flag === 'missable') return '<span class="pip flag-missable">Possibly missable</span>';
  if (t.flag === 'watch') return '<span class="pip flag-watch">Watch</span>';
  if (t.flag === 'unconfirmed') return '<span class="pip flag-unconfirmed">Unconfirmed</span>';
  return '';
}

function renderHeader() {
  const earned = state.earned.length;
  $('earnedCount').textContent = String(earned);
  $('progressFill').style.width = `${(earned / trophies.length) * 100}%`;
  const parts = ['platinum', 'gold', 'silver', 'bronze'].map((g) => {
    const total = trophies.filter((t) => t.grade === g).length;
    const got = trophies.filter((t) => t.grade === g && isEarned(t)).length;
    return `${got}/${total} ${g}`;
  });
  $('gradeBreakdown').textContent = parts.join(' · ');
}

function renderAudit() {
  const watch = trophies.filter((t) => t.flag === 'watch').length;
  const unconfirmed = trophies.filter((t) => t.flag === 'unconfirmed').length;
  const targets = trophies.filter((t) => t.target).length;
  $('auditStrip').innerHTML =
    `<span><b>AUDIT</b></span>` +
    `<span><b>55</b> official · 1P 2G 6S 46B</span>` +
    `<span><b>28</b> hidden</span>` +
    `<span><b>55/55</b> guides cite a source</span>` +
    `<span><b>${citedSteps}/${totalSteps}</b> steps cited</span>` +
    `<span><b>${sources.length}</b> sources read ${esc(doc.readDate)}</span>` +
    `<span><b>${targets}</b> PSN progress targets</span>` +
    `<span class="warn">1 possibly missable</span>` +
    `<span><b>${watch}</b> watch</span>` +
    `<span><b>${unconfirmed}</b> unconfirmed</span>` +
    `<span><b>1</b> source disagreement</span>`;
}

function matchesFilters(t) {
  const q = $('searchBox').value.trim().toLowerCase();
  if (kindFilter !== 'all' && t.kind !== kindFilter) return false;
  if ($('gradeSelect').value !== 'all' && t.grade !== $('gradeSelect').value) return false;
  if ($('stageSelect').value !== 'all' && t.stage !== Number($('stageSelect').value)) return false;
  if ($('earnedOnly').checked && !isEarned(t)) return false;
  if (q) {
    const hay = `${t.name} ${t.description} ${t.guide} ${t.kind}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function renderList() {
  const list = $('trophyList');
  list.replaceChildren();
  let shown = 0;
  for (const t of trophies) {
    if (!matchesFilters(t)) continue;
    shown += 1;
    const li = document.createElement('li');
    if (t.id === selectedId) li.className = 'selected';
    if (isEarned(t)) li.classList.add('earned');
    const masked = spoilerMasked(t);
    // v3 improvement 3: PSN target chip "0 / N" on every counter trophy row.
    const target = t.target
      ? `<span class="target-chip" title="PSN progress target">${counterOf(t)} / ${t.target} ${esc(t.targetLabel || '')}</span>`
      : '';
    // v3 improvement 4 (row level): step progress chip from the per-step ticks.
    const stepChip = `<span class="step-chip">Steps ${stepsDoneCount(t)}/${t.steps.length}</span>`;
    li.innerHTML =
      `<input type="checkbox" ${isEarned(t) ? 'checked' : ''} aria-label="Mark earned">` +
      `<div class="t-body"><div class="t-name">${esc(displayName(t))}</div>` +
      // v3 improvement 1: the OFFICIAL description, small, directly under the name.
      `<div class="t-desc"><span class="t-desc-label">Official:</span> ${masked ? 'Description hidden by spoiler-safe mode.' : esc(t.description)}</div>` +
      `<div class="t-meta"><span class="pip grade-${t.grade}">${t.grade} · ${t.points} pts</span>` +
      `<span class="pip">Stage ${t.stage}</span><span class="pip">${esc(t.kind)}</span>` +
      (t.hidden ? '<span class="pip hidden-pip">Hidden</span>' : '') + flagPip(t) + target + stepChip + `</div></div>`;
    const box = li.querySelector('input');
    box.addEventListener('click', (e) => e.stopPropagation());
    box.addEventListener('change', () => toggleEarned(t.id));
    li.addEventListener('click', () => { selectedId = t.id; renderAll(); });
    list.append(li);
  }
  $('countLine').textContent = `Showing ${shown} of 55 trophies · ${state.earned.length} earned · click a row for its cited guide`;
}

function toggleEarned(id) {
  const set = earnedSet();
  if (set.has(id)) set.delete(id); else set.add(id);
  state.earned = [...set];
  saveState(state);
  renderAll();
}

function toggleStep(t, idx) {
  if (!state.stepsDone) state.stepsDone = {};
  const set = stepsDoneSet(t);
  if (set.has(idx)) set.delete(idx); else set.add(idx);
  state.stepsDone[t.id] = [...set].sort((a, b) => a - b);
  // Finishing every step earns the trophy; unticking one un-earns it.
  const es = earnedSet();
  if (set.size >= t.steps.length) es.add(t.id);
  else if (es.has(t.id) && set.size > 0) es.delete(t.id);
  state.earned = [...es];
  saveState(state);
  renderAll();
}

function renderDetail() {
  const t = byId.get(selectedId) || trophies[0];
  const masked = spoilerMasked(t);
  const stage = stages.find((s) => s.n === t.stage);
  let callouts = '';
  if (t.flag === 'missable') {
    callouts += `<div class="callout missable"><b>POSSIBLY MISSABLE.</b> The Chapter 1 balcony meditation at Jason's house is gone once Chapter 1 ends — do it and keep a chapter-start save ${citeChip(1)}${citeChip(8)}.</div>`;
    callouts += `<div class="callout disagree"><b>SOURCES DISAGREE.</b> Guides count <b>18</b> meditations ${citeChip(1)}${citeChip(8)}; the 100% checklist needs only <b>15 of 18</b> ${citeChip(5)}${citeChip(7)}. This atlas plans for 18.</div>`;
  } else if (t.flag === 'watch') {
    callouts += `<div class="callout watch"><b>WATCH.</b> Not missable, but the setup is specific and easy to fumble — read the steps before you attempt it.</div>`;
  } else if (t.flag === 'unconfirmed') {
    callouts += `<div class="callout unconfirmed"><b>UNCONFIRMED.</b> Launch sources have not verified the exact trigger yet. This guide says so instead of inventing a method.</div>`;
  }
  const targetBox = t.target
    ? `<div class="counter-box"><button type="button" id="cMinus" aria-label="Decrease counter">−</button>` +
      `<span class="cnum">${counterOf(t)} / ${t.target}</span><span class="ctarget">PSN target · ${esc(t.targetLabel || '')}</span>` +
      `<div class="cbar"><div class="cfill" style="width:${(counterOf(t) / t.target) * 100}%"></div></div>` +
      `<button type="button" id="cPlus" aria-label="Increase counter">+</button></div>` +
      `<p class="target-note">${esc(t.targetNote || '')}</p>`
    : '';
  const doneSet = stepsDoneSet(t);
  const stepsHtml = masked
    ? '<p class="guide-text">Spoiler-safe mode hides this story trophy\u2019s guide until it is earned. Untick Spoiler-safe above to read it now.</p>'
    : `<p class="step-progress">Step progress: <b>${stepsDoneCount(t)} / ${t.steps.length} steps done</b> — tick each step as you finish it; the ticks save with your progress.</p>` +
      `<ol class="steps">${t.steps.map((s, i) =>
        `<li class="${doneSet.has(i) || isEarned(t) ? 'step-done' : ''}"><label class="step-label"><input type="checkbox" class="step-box" data-step="${i}" ${doneSet.has(i) || isEarned(t) ? 'checked' : ''}> <span class="step-text">${citeHtml(s)}</span></label></li>`).join('')}</ol>`;
  const guide = masked
    ? '<p class="guide-text">Hidden by spoiler-safe mode.</p>'
    : `<p class="guide-text">${citeHtml(t.guide)}</p>`;
  $('detailPane').innerHTML =
    `<h2>${esc(displayName(t))}</h2>` +
    `<p class="official">&ldquo;${masked ? 'Description hidden until earned.' : esc(t.description)}&rdquo; — official ${citeChip(10)}</p>` +
    callouts +
    `<div class="meta-grid">` +
    `<div><span>Grade</span><b>${t.grade} · ${t.points} PSN pts</b></div>` +
    `<div><span>Roadmap stage</span><b>${t.stage} · ${esc(stage ? stage.title.split('—')[0].trim() : '')}</b></div>` +
    `<div><span>Kind</span><b>${esc(t.kind)}</b></div>` +
    `<div><span>Difficulty</span><b>${t.difficulty} / 10</b></div>` +
    `<div><span>Time estimate</span><b>≈ ${t.hours} h</b></div>` +
    `<div><span>Region / character</span><b>${esc(t.scope)}</b></div>` +
    (t.target ? `<div><span>PSN target</span><b>${counterOf(t)} / ${t.target} ${esc(t.targetLabel || '')}</b></div>` : '') +
    `<div><span>Step progress</span><b>${stepsDoneCount(t)} / ${t.steps.length} steps</b></div>` +
    `</div>` +
    `<h3>Steps — tick them off as you go</h3>` + stepsHtml +
    targetBox +
    `<h3>Guide — in our own words, every step cited by name</h3>` + guide +
    `<p class="src-line">Sources for this guide: <b>${t.sources.map((n) => `[${n}] ${esc(sourceName(n))}`).join(' · ')}</b></p>` +
    `<div class="earn-row"><button type="button" id="earnBtn" class="${isEarned(t) ? 'earned-btn' : ''}">${isEarned(t) ? 'Earned ✓ — tap to undo' : 'Mark as earned'}</button>` +
    (t.hidden ? '<span class="pip hidden-pip">Hidden on PSN until earned</span>' : '') + `</div>`;
  $('earnBtn').addEventListener('click', () => toggleEarned(t.id));
  if (t.target) {
    $('cMinus').addEventListener('click', () => bumpCounter(t, -1));
    $('cPlus').addEventListener('click', () => bumpCounter(t, 1));
  }
  for (const box of $('detailPane').querySelectorAll('.step-box')) {
    box.addEventListener('change', () => toggleStep(t, Number(box.dataset.step)));
  }
}

function bumpCounter(t, delta) {
  const cap = t.target || t.count || 0;
  const next = Math.max(0, Math.min(cap, counterOf(t) + delta));
  state.counters[t.id] = next;
  if (next >= cap && cap > 0 && !isEarned(t)) state.earned = [...earnedSet(), t.id];
  saveState(state);
  renderAll();
}

function renderRail() {
  const queue = nextUpQueue(trophies, state.earned);
  const eta = platinumEta(stages, trophies, state.earned);
  const nextItems = queue.slice(0, 5).map((item) =>
    `<li><button type="button" class="linkish" data-goto="${item.trophy.id}">${esc(displayName(item.trophy))}</button> ` +
    `<span class="src-cited">Stage ${item.trophy.stage} · ≈${item.trophy.hours} h${item.gated ? ' · gated' : ' · ungated'} · steps ${stepsDoneCount(item.trophy)}/${item.trophy.steps.length}</span></li>`).join('');
  const srcItems = sources.map((s) =>
    `<li><span class="src-name">[${s.n}] ${esc(s.name)}</span>` +
    `<span class="src-cited">cited by ${citedByCount(s.n)} of 55 guides</span></li>`).join('');
  $('rightRail').innerHTML =
    `<div class="rail-card"><h3>Next up — earliest ungated</h3><ol>${nextItems}</ol></div>` +
    `<div class="rail-card"><h3>Time to platinum</h3><div class="eta">≈ ${eta} h left</div>` +
    `<p>Full run ≈ ${totalHours} h ${citeChip(1)} · difficulty 4/10 ${citeChip(1)} · ${state.earned.length}/55 earned</p></div>` +
    `<div class="rail-card"><h3>Sources — read ${esc(doc.readDate)}</h3><ol>${srcItems}</ol></div>`;
  for (const btn of $('rightRail').querySelectorAll('[data-goto]')) {
    btn.addEventListener('click', () => { selectedId = Number(btn.dataset.goto); renderAll(); });
  }
}

function renderRoadmap() {
  $('roadmapIntro').innerHTML =
    `Six stages, <b>≈${totalHours} hours in total</b> to the platinum, one playthrough. Cumulative hours are shown on every stage — by the end of Stage 3 you are ≈${cumHours[2]} h in. The launch roadmap rates the set 4/10 difficulty with a single possibly missable trophy ${citeChip(1)}. ` +
    `Per-stage hours below sum to the platinum estimate; each stage bar shows earned over total for that stage, and any stage that holds a flagged trophy carries its warning.`;
  const list = $('stageList');
  list.replaceChildren();
  stages.forEach((stage, i) => {
    const inStage = trophies.filter((t) => t.stage === stage.n);
    const got = inStage.filter((t) => isEarned(t)).length;
    const missables = inStage.filter((t) => t.flag === 'missable');
    const watchers = inStage.filter((t) => t.flag === 'watch');
    const warn = missables.length
      ? `<div class="stage-warn missable-warn">⚠ MISSABLE IN THIS STAGE: ${missables.map((t) => esc(t.name)).join(', ')} — the Chapter 1 meditation is lost when Chapter 1 ends. Keep a chapter-start save.</div>`
      : watchers.length
        ? `<div class="stage-warn watch-warn">Watch in this stage: ${watchers.map((t) => esc(t.name)).join(' · ')}</div>`
        : '';
    const li = document.createElement('li');
    li.className = 'stage-card';
    li.innerHTML =
      `<h3>Stage ${stage.n} — ${esc(stage.title)}</h3>` +
      `<div class="stage-hours"><b>${got}/${inStage.length} earned</b> · ≈${stage.hours} h this stage · <b>cumulative ≈${cumHours[i]} h</b> of ≈${totalHours} h total</div>` +
      warn +
      `<div>${citeHtml(stage.note)}</div>` +
      `<div class="stage-bar"><div class="stage-fill" style="width:${inStage.length ? (got / inStage.length) * 100 : 0}%"></div></div>` +
      `<div class="stage-names">${inStage.map((t) => esc(displayName(t))).join(' · ')}</div>`;
    list.append(li);
  });
  const total = document.createElement('li');
  total.className = 'stage-card stage-total';
  total.innerHTML = `<h3>Total estimate to platinum: ≈${totalHours} h</h3><div>45 + 25 + 55 + 40 + 20 + 15 = ${totalHours} h across the six stages ${citeChip(1)} — one playthrough, no second run needed.</div>`;
  list.append(total);
}

function renderFlags() {
  const groups = [
    ['missable', 'Possibly missable — 1', 'missable'],
    ['watch', 'Watch — specific setups, easy to fumble — 8', 'watch'],
    ['unconfirmed', 'Unconfirmed — trigger not yet verified by launch sources — 8', 'unconfirmed'],
  ];
  const wrap = $('flagGroups');
  wrap.replaceChildren();
  for (const [flag, title, cls] of groups) {
    const div = document.createElement('div');
    div.className = 'flag-group';
    div.innerHTML = `<h3>${title}</h3>`;
    for (const t of trophies.filter((x) => x.flag === flag)) {
      const card = document.createElement('div');
      card.className = `flag-card ${cls}`;
      card.innerHTML =
        `<b>${esc(t.name)}</b> <span class="pip grade-${t.grade}">${t.grade} · ${t.points} pts</span> <span class="pip">Stage ${t.stage}</span>` +
        (t.target ? ` <span class="target-chip">${counterOf(t)} / ${t.target} ${esc(t.targetLabel || '')}</span>` : '') +
        `<p><span class="t-desc-label">Official:</span> ${esc(t.description)} — ${citeHtml(t.steps[0])}</p>`;
      card.addEventListener('click', () => { selectedId = t.id; switchView('ledger'); });
      div.append(card);
    }
    wrap.append(div);
  }
}

function renderPlanner() {
  const hours = Number($('hoursSelect').value);
  const queue = nextUpQueue(trophies, state.earned);
  const { picks, used } = sessionPlan(queue, hours);
  $('planSummary').textContent = picks.length
    ? (used > hours
      ? `Plan: start with ${picks[0].trophy.name} — it outranks the clock (≈${used} h of work, begun inside your ${hours} h).`
      : `Plan: ${picks.length} trophies, ≈${used} h of your ${hours} h session.`)
    : 'Everything is earned — the platinum is yours.';
  const fill = (el, items, withWhy) => {
    el.replaceChildren();
    for (const item of items) {
      const li = document.createElement('li');
      li.innerHTML =
        `<b>${esc(displayName(item.trophy))}</b> <span class="pip grade-${item.trophy.grade}">${item.trophy.grade} · ${item.trophy.points} pts</span> ` +
        `<span class="pip">Stage ${item.trophy.stage}</span> ${flagPip(item.trophy)}` +
        (item.trophy.target ? ` <span class="target-chip">${counterOf(item.trophy)} / ${item.trophy.target} ${esc(item.trophy.targetLabel || '')}</span>` : '') +
        (withWhy ? `<span class="why">${item.trophy.flag === 'missable' ? 'First because it can be lost in Chapter 1.' : item.gated ? 'Later stage — scheduled after the current stage clears.' : 'Earliest ungated trophy in roadmap order.'} ≈${item.trophy.hours} h · steps ${stepsDoneCount(item.trophy)}/${item.trophy.steps.length} · ${citeHtml(item.trophy.steps[0])}</span>` : '');
      li.addEventListener('click', () => { selectedId = item.trophy.id; switchView('ledger'); });
      el.append(li);
    }
  };
  fill($('planList'), picks, true);
  fill($('queueList'), queue.slice(0, 10), false);
}

function renderMatrix() {
  const table = $('matrixTable');
  const head = `<tr><th class="name">Trophy</th>${sources.map((s) => `<th>[${s.n}] ${esc(sourceName(s.n))}</th>`).join('')}<th>Total</th></tr>`;
  const rows = trophies.map((t) =>
    `<tr><td class="name">${esc(t.name)}</td>` +
    sources.map((s) => t.sources.includes(s.n) ? '<td class="hit">✓</td>' : '<td>·</td>').join('') +
    `<td><b>${t.sources.length}</b></td></tr>`).join('');
  table.innerHTML = head + rows;
}

function renderSources() {
  $('sourcesIntro').textContent =
    `${sources.length} sources, all read ${doc.readDate}. Guide text is this atlas's own words; a source is cited by name beside the facts it supports, never copied.`;
  const list = $('sourceList');
  list.replaceChildren();
  for (const s of sources) {
    const li = document.createElement('li');
    li.innerHTML =
      `<b>[${s.n}] ${esc(s.name)}</b> <span class="cited-by">cited by ${citedByCount(s.n)} of 55 guides</span>` +
      `<span class="what">${esc(s.what)}</span>`;
    list.append(li);
  }
  $('disagreeBox').innerHTML =
    `<div class="callout disagree"><b>SOURCE DISAGREEMENT ON RECORD.</b> ${citeHtml(doc.disagreementNote)}</div>`;
  $('footSources').textContent = `Sources read ${doc.readDate}: ` + sources.map((s) => `[${s.n}] ${s.name}`).join(' · ');
}

function renderAll() {
  renderHeader();
  renderList();
  renderDetail();
  renderRail();
  if (activeView === 'roadmap') renderRoadmap();
  if (activeView === 'missables') renderFlags();
  if (activeView === 'planner') renderPlanner();
  if (activeView === 'matrix') renderMatrix();
  if (activeView === 'sources') renderSources();
}

function switchView(view) {
  activeView = view;
  for (const btn of $('tabBar').querySelectorAll('button')) {
    btn.classList.toggle('active', btn.dataset.view === view);
  }
  for (const section of document.querySelectorAll('.view')) {
    section.hidden = section.id !== `view-${view}`;
  }
  $('toolbar').style.display = view === 'ledger' ? '' : 'none';
  renderAll();
}

function buildKindChips() {
  const kinds = ['all', 'story', 'activities', 'collectibles', 'meta'];
  const wrap = $('kindChips');
  for (const kind of kinds) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = kind === 'all' ? 'All kinds' : kind[0].toUpperCase() + kind.slice(1);
    if (kind === 'all') btn.className = 'active';
    btn.addEventListener('click', () => {
      kindFilter = kind;
      for (const b of wrap.querySelectorAll('button')) b.classList.toggle('active', b === btn);
      renderList();
    });
    wrap.append(btn);
  }
}

buildKindChips();
renderAudit();
$('spoilerToggle').checked = state.spoilerSafe;
$('spoilerToggle').addEventListener('change', () => { state.spoilerSafe = $('spoilerToggle').checked; saveState(state); renderAll(); });
$('searchBox').addEventListener('input', renderList);
$('gradeSelect').addEventListener('change', renderList);
$('stageSelect').addEventListener('change', renderList);
$('earnedOnly').addEventListener('change', renderList);
$('hoursSelect').addEventListener('change', renderPlanner);
$('exportBtn').addEventListener('click', () => exportState(state));
$('importBtn').addEventListener('click', () => $('importFile').click());
$('importFile').addEventListener('change', async () => {
  const file = $('importFile').files[0];
  if (!file) return;
  try {
    state = parseImported(await file.text());
    saveState(state);
    $('spoilerToggle').checked = state.spoilerSafe;
    renderAll();
  } catch { /* a bad file changes nothing */ }
});
$('resetBtn').addEventListener('click', () => { state = emptyState(); saveState(state); $('spoilerToggle').checked = true; renderAll(); });
for (const btn of $('tabBar').querySelectorAll('button')) {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
}
switchView(activeView);
