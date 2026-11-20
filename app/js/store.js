/* Leonida Atlas v3 — progress store.
   State lives in localStorage only: earned flags, per-step checks,
   counter values, free-text notes and the spoiler-safe preference. */
(function () {
  var KEY = "leonida-atlas-v3-progress";

  function blankState() {
    return {
      earned: {},
      steps: {},
      counters: {},
      notes: {},
      spoilerSafe: false
    };
  }

  function loadState() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return blankState();
      var parsed = JSON.parse(raw);
      var state = blankState();
      if (parsed && typeof parsed === "object") {
        if (parsed.earned) state.earned = parsed.earned;
        if (parsed.steps) state.steps = parsed.steps;
        if (parsed.counters) state.counters = parsed.counters;
        if (parsed.notes) state.notes = parsed.notes;
        state.spoilerSafe = parsed.spoilerSafe === true;
      }
      return state;
    } catch (err) {
      return blankState();
    }
  }

  function saveState(state) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch (err) {
      /* storage full or blocked: the session keeps working in memory */
    }
  }

  function clearState() {
    try {
      window.localStorage.removeItem(KEY);
    } catch (err) { /* nothing to clear */ }
    return blankState();
  }

  /* Demo state used by the ?seed=demo screenshots: a Chapter 2 player
     who finished the opening, sampled an arcade game, beat Cal, and has
     started the meditation route at 3 of 18 with the balcony step done. */
  function demoState() {
    var state = blankState();
    state.earned = {
      "just-like-paradise": true,
      "paradise-lost": true,
      "trust": true,
      "stick-fiddler": true,
      "baited-my-tackle": true
    };
    state.steps = {
      "positive-mental-attitude": [true, true, false, false, false],
      "a-long-road": [true, false, false, false, false],
      "cunning-stunts": [true, true, false, false, false]
    };
    state.counters = {
      "positive-mental-attitude": 3,
      "cunning-stunts": 41,
      "whip-it-good": 27,
      "you-wainker": 12
    };
    state.notes = {
      "positive-mental-attitude": "Balcony meditation done in Chapter 1. Next spots on the way to Vice City."
    };
    return state;
  }

  function stepsDoneFor(state, trophy) {
    var marks = state.steps[trophy.id] || [];
    var done = 0;
    for (var i = 0; i < trophy.steps.length; i++) {
      if (marks[i]) done++;
    }
    return done;
  }

  window.AtlasStore = {
    KEY: KEY,
    blankState: blankState,
    loadState: loadState,
    saveState: saveState,
    clearState: clearState,
    demoState: demoState,
    stepsDoneFor: stepsDoneFor
  };
})();
