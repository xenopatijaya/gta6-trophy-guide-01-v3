// Leonida Atlas v3 — progress store.
// Everything the tracker remembers lives in one localStorage record:
// earned trophy ids, per-trophy counters, per-step checklists
// (stepsDone: trophy id -> array of finished step indexes), and the
// spoiler-safe switch. Export downloads that record as JSON; import
// reads it back. v2 records import cleanly (stepsDone defaults empty).

const STORAGE_KEY = 'leonida-atlas-v3-progress';

export function emptyState() {
  return { earned: [], counters: {}, stepsDone: {}, spoilerSafe: true };
}

function cleanStepsDone(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const out = {};
  for (const [key, value] of Object.entries(raw)) {
    if (Array.isArray(value)) out[key] = value.filter((n) => Number.isInteger(n) && n >= 0);
  }
  return out;
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return {
      earned: Array.isArray(parsed.earned) ? parsed.earned : [],
      counters: parsed.counters && typeof parsed.counters === 'object' ? parsed.counters : {},
      stepsDone: cleanStepsDone(parsed.stepsDone),
      spoilerSafe: parsed.spoilerSafe !== false,
    };
  } catch {
    return emptyState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function demoState() {
  // A seeded mid-run save, used by ?seed=demo for previews and screenshots:
  // 13 of 55 earned (Chapter 1 story beats among them, so spoiler-safe mode
  // has earned story names to reveal), counters part-way on the big grinds,
  // and per-step checklists part-way: Positive Mental Attitude (id 28) has
  // its first two steps ticked — the Chapter 1 balcony meditation is done,
  // the rest of the 18 are still open.
  return {
    earned: [2, 3, 8, 9, 10, 11, 12, 13, 20, 21, 29, 33, 41],
    counters: { 15: 47, 19: 4, 28: 3, 30: 1, 31: 22, 32: 11, 35: 38 },
    stepsDone: { 28: [0, 1], 15: [0], 31: [0, 1], 2: [0, 1], 3: [0, 1, 2] },
    spoilerSafe: true,
  };
}

export function exportState(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'leonida-atlas-v3-progress.json';
  link.click();
  URL.revokeObjectURL(link.href);
}

export function parseImported(text) {
  const parsed = JSON.parse(text);
  if (!parsed || !Array.isArray(parsed.earned)) throw new Error('not an atlas progress file');
  return {
    earned: parsed.earned.filter((n) => Number.isInteger(n)),
    counters: parsed.counters && typeof parsed.counters === 'object' ? parsed.counters : {},
    stepsDone: cleanStepsDone(parsed.stepsDone),
    spoilerSafe: parsed.spoilerSafe !== false,
  };
}
