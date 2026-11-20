/* Leonida Atlas v3 — queue and session planner.
   The Next Up queue walks the roadmap in stage order and, inside a
   stage, shortest trophies first, so early wins land early. The
   platinum itself is held back until everything else is earned. */
(function () {
  function isEarned(state, trophy) {
    return state.earned[trophy.id] === true;
  }

  function queueOrder(a, b) {
    if (a.stage !== b.stage) return a.stage - b.stage;
    if (a.hours !== b.hours) return a.hours - b.hours;
    return a.name < b.name ? -1 : 1;
  }

  function nextUp(data, state, limit) {
    var open = data.trophies.filter(function (t) {
      return !isEarned(state, t) && t.kind !== "platinum";
    });
    open.sort(queueOrder);
    var platinum = data.trophies.filter(function (t) {
      return t.kind === "platinum" && !isEarned(state, t);
    });
    var rest = open.concat(platinum);
    return typeof limit === "number" ? rest.slice(0, limit) : rest;
  }

  function hoursLeft(data, state) {
    var total = 0;
    data.trophies.forEach(function (t) {
      if (!isEarned(state, t)) total += t.hours;
    });
    return total;
  }

  /* Greedy session plan: fill the requested hours from the front of
     the Next Up queue. A trophy longer than the whole session still
     leads the plan, flagged as a focus block, because starting the
     long checklist work early beats deferring it forever. */
  function buildPlan(data, state, sessionHours) {
    var queue = nextUp(data, state);
    var picked = [];
    var used = 0;
    for (var i = 0; i < queue.length; i++) {
      var t = queue[i];
      if (picked.length === 0 && t.hours > sessionHours) {
        picked.push({ trophy: t, focusBlock: true });
        used = sessionHours;
        break;
      }
      if (used + t.hours <= sessionHours) {
        picked.push({ trophy: t, focusBlock: false });
        used += t.hours;
      }
      if (used >= sessionHours) break;
    }
    return {
      items: picked,
      plannedHours: used,
      sessionHours: sessionHours,
      slack: Math.max(0, sessionHours - used),
      remainingAfter: hoursLeft(data, state) - used
    };
  }

  function stageProgress(data, state, stageId) {
    var inStage = data.trophies.filter(function (t) { return t.stage === stageId; });
    var done = inStage.filter(function (t) { return isEarned(state, t); }).length;
    return { done: done, total: inStage.length, trophies: inStage };
  }

  window.AtlasPlanner = {
    isEarned: isEarned,
    nextUp: nextUp,
    hoursLeft: hoursLeft,
    buildPlan: buildPlan,
    stageProgress: stageProgress
  };
})();
