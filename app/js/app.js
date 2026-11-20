/* Leonida Atlas v3 — application logic.
   Renders the ledger, detail panel, audit strip, right rail, roadmap,
   missables, planner, source matrix and sources view from the local
   data file. The only fetch in the app is that local JSON file. */
(function () {
  var Store = window.AtlasStore;
  var Planner = window.AtlasPlanner;

  var data = null;
  var state = Store.loadState();
  var selectedId = null;
  var currentView = "ledger";

  var params = new URLSearchParams(window.location.search);
  if (params.get("seed") === "demo") {
    state = Store.demoState();
  }

  function $(id) { return document.getElementById(id); }

  function esc(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function sourceName(n) {
    var found = data.sources.filter(function (s) { return s.n === n; })[0];
    return found ? found.name : "Source " + n;
  }

  /* Turn inline [n] markers into named citation chips. */
  function cited(text) {
    return esc(text).replace(/\[(\d+)\]/g, function (match, n) {
      return '<span class="cite">[' + n + "] " + esc(sourceName(Number(n))) + "</span>";
    });
  }

  function gradeLabel(grade) {
    return grade.charAt(0).toUpperCase() + grade.slice(1);
  }

  function flagChip(trophy) {
    if (trophy.flag === "missable") return '<span class="chip flag-missable">POSSIBLY MISSABLE</span>';
    if (trophy.flag === "watch") return '<span class="chip flag-watch">WATCH</span>';
    if (trophy.flag === "unconfirmed") return '<span class="chip flag-unconfirmed">UNCONFIRMED</span>';
    return "";
  }

  function isMasked(trophy) {
    return state.spoilerSafe && trophy.hidden && !Planner.isEarned(state, trophy);
  }

  function displayName(trophy) {
    if (isMasked(trophy)) return "Hidden trophy";
    return trophy.name;
  }

  /* ---------- audit strip ---------- */
  function renderAudit() {
    var citedTrophies = data.trophies.filter(function (t) { return t.sources.length > 0; }).length;
    var totalSteps = 0;
    var citedSteps = 0;
    data.trophies.forEach(function (t) {
      t.steps.forEach(function (step) {
        totalSteps++;
        if (/\[\d+\]/.test(step)) citedSteps++;
      });
    });
    var flags = { missable: 0, watch: 0, unconfirmed: 0 };
    data.trophies.forEach(function (t) { if (flags[t.flag] !== undefined) flags[t.flag]++; });
    $("auditStrip").innerHTML =
      "<span><b>" + citedTrophies + " / " + data.trophies.length + "</b> trophies cited</span>" +
      "<span><b>" + citedSteps + " / " + totalSteps + "</b> steps cited</span>" +
      "<span><b>" + data.sources.length + "</b> numbered sources</span>" +
      "<span><b>" + flags.missable + "</b> possibly missable</span>" +
      "<span><b>" + flags.watch + "</b> on the watch list</span>" +
      "<span><b>" + flags.unconfirmed + "</b> unconfirmed</span>" +
      "<span><b>0</b> online trophies</span>";
  }

  /* ---------- header + rail ---------- */
  function renderProgress() {
    var earned = data.trophies.filter(function (t) { return Planner.isEarned(state, t); }).length;
    $("earnedCount").textContent = String(earned);
    var pct = Math.round((earned / data.trophies.length) * 100);
    $("progressFill").style.width = pct + "%";
    $("progressLabel").textContent = pct + "% to the platinum";
    var left = Planner.hoursLeft(data, state);
    $("hoursLeft").textContent = "±" + left;
    $("ttpNote").textContent = left === 0
      ? "Everything is earned. Leonida is yours."
      : "Estimated from the per-trophy hours in this atlas. The full run is rated " +
        data.meta.platinumDifficulty + " difficulty at about " + data.meta.platinumHours +
        " hours, one playthrough, no online or difficulty trophies.";
  }

  function renderRail() {
    var up = Planner.nextUp(data, state, 5);
    $("nextUpList").innerHTML = up.map(function (t) {
      return "<li><span class='nu-name'>" + esc(displayName(t)) + "</span>" +
        "<span class='nu-meta'>Stage " + t.stage + " · " + gradeLabel(t.grade) +
        " · ±" + t.hours + "h · " + esc(t.scope) + "</span></li>";
    }).join("") || "<li>All 55 earned — platinum complete.</li>";

    var counts = {};
    data.trophies.forEach(function (t) {
      t.sources.forEach(function (n) { counts[n] = (counts[n] || 0) + 1; });
    });
    $("railSources").innerHTML = data.sources.map(function (s) {
      return "<li><b>[" + s.n + "] " + esc(s.name) + "</b> " +
        "<span class='cited-by'>cited by " + (counts[s.n] || 0) + " of " + data.trophies.length + "</span></li>";
    }).join("");
  }

  /* ---------- ledger ---------- */
  function rowHtml(trophy) {
    var earned = Planner.isEarned(state, trophy);
    var masked = isMasked(trophy);
    var doneSteps = Store.stepsDoneFor(state, trophy);
    var counterChip = "";
    if (trophy.target) {
      var value = state.counters[trophy.id] || 0;
      counterChip = '<span class="chip counter">' + value + " / " + trophy.target + " " + esc(trophy.targetLabel) + "</span>";
    }
    var desc = masked
      ? '<span class="masked">Description hidden by spoiler-safe mode — earn it or switch the mode off to read it.</span>'
      : '<span class="official-tag">OFFICIAL</span>' + esc(trophy.description);
    return '<button type="button" class="row grade-' + trophy.grade + (earned ? " earned" : "") +
      (selectedId === trophy.id ? " selected" : "") + '" data-open="' + trophy.id + '">' +
      '<input type="checkbox" class="row-check" data-earn="' + trophy.id + '"' + (earned ? " checked" : "") + ' aria-label="Mark earned">' +
      '<span class="row-main"><span class="row-name">' + esc(displayName(trophy)) + "</span><br>" +
      '<span class="row-desc">' + desc + "</span></span>" +
      '<span class="row-chips">' +
      '<span class="chip grade-' + trophy.grade + '">' + gradeLabel(trophy.grade) + " · " + trophy.points + " pts</span>" +
      '<span class="chip">Steps ' + doneSteps + "/" + trophy.steps.length + "</span>" +
      counterChip + flagChip(trophy) +
      "</span></button>";
  }

  function filteredTrophies() {
    var query = $("searchInput").value.trim().toLowerCase();
    var kind = $("kindFilter").value;
    var grade = $("gradeFilter").value;
    var stage = $("stageFilter").value;
    var status = $("statusFilter").value;
    return data.trophies.filter(function (t) {
      if (kind && t.kind !== kind) return false;
      if (grade && t.grade !== grade) return false;
      if (stage && String(t.stage) !== stage) return false;
      if (status === "earned" && !Planner.isEarned(state, t)) return false;
      if (status === "open" && Planner.isEarned(state, t)) return false;
      if (query) {
        var hay = (t.name + " " + t.description + " " + t.guide + " " + t.kind + " " + t.scope).toLowerCase();
        if (hay.indexOf(query) === -1) return false;
      }
      return true;
    });
  }

  function renderLedger() {
    var list = filteredTrophies();
    $("ledgerMeta").textContent = "Showing " + list.length + " of " + data.trophies.length + " trophies";
    $("ledgerList").innerHTML = list.map(rowHtml).join("") ||
      '<p class="view-intro">No trophies match those filters.</p>';
  }

  /* ---------- detail panel ---------- */
  function renderDetail() {
    var panel = $("detailPanel");
    var trophy = data.trophies.filter(function (t) { return t.id === selectedId; })[0];
    if (!trophy) {
      panel.hidden = true;
      panel.innerHTML = "";
      return;
    }
    var earned = Planner.isEarned(state, trophy);
    var masked = isMasked(trophy);
    var doneSteps = Store.stepsDoneFor(state, trophy);

    var callouts = "";
    if (trophy.id === "positive-mental-attitude") {
      callouts =
        '<div class="callout"><h3>POSSIBLY MISSABLE — read before Chapter 1 ends</h3>' +
        "<p>The home meditation with Lucia on the balcony at Jason's house is only offered during Chapter 1. " +
        "It is not yet confirmed whether the trophy requires it, but the players who earned the trophy had done it. Take it, every run.</p></div>" +
        '<div class="callout disagree"><h3>SOURCES DISAGREE — 18 spots or 15?</h3>' +
        "<p>Location guides describe 18 meditation spots across 10 locations, counted per character. " +
        "The 100% checklist, however, only asks for 15 of 18. This atlas tracks the full 18, so the checklist figure is covered either way.</p></div>";
    } else if (trophy.flag === "unconfirmed") {
      callouts = '<div class="callout disagree"><h3>UNCONFIRMED — method still being verified</h3>' +
        "<p>The guides have not fully pinned this one down yet. The guide below gives the best reported method and says plainly where the doubt sits.</p></div>";
    } else if (trophy.flag === "watch") {
      callouts = '<div class="callout disagree"><h3>WATCH — plan this one early</h3>' +
        "<p>Not missable, but long, fiddly or easy to make harder for yourself. Read the guide before the relevant stage, not after it.</p></div>";
    }

    var stepsHtml = masked
      ? '<p class="masked">Steps hidden by spoiler-safe mode for this hidden trophy.</p>'
      : '<ol class="steps">' + trophy.steps.map(function (step, i) {
          var marks = state.steps[trophy.id] || [];
          var done = marks[i] === true;
          return '<li class="' + (done ? "done" : "") + '">' +
            '<input type="checkbox" data-step="' + trophy.id + ":" + i + '"' + (done ? " checked" : "") + ">" +
            "<span>" + cited(step) + "</span></li>";
        }).join("") + "</ol>";

    var counterHtml = "";
    if (trophy.target) {
      var value = state.counters[trophy.id] || 0;
      counterHtml = '<div class="counter-box"><span class="big">' + value + " / " + trophy.target + "</span>" +
        "<span>" + esc(trophy.targetLabel) + " (PSN progress target)</span>" +
        '<button type="button" data-counter="' + trophy.id + ':-1">−</button>' +
        '<input type="number" min="0" max="' + trophy.target + '" value="' + value + '" data-counter-input="' + trophy.id + '">' +
        '<button type="button" data-counter="' + trophy.id + ':1">+</button></div>';
    }

    panel.innerHTML =
      '<div class="detail-meta">' +
      '<span class="chip grade-' + trophy.grade + '">' + gradeLabel(trophy.grade) + " · " + trophy.points + " pts</span>" +
      '<span class="chip">Kind: ' + esc(trophy.kind) + "</span>" +
      '<span class="chip">Stage ' + trophy.stage + "</span>" +
      '<span class="chip">Difficulty ' + trophy.difficulty + "/5</span>" +
      '<span class="chip">±' + trophy.hours + "h</span>" +
      '<span class="chip">' + esc(trophy.scope) + "</span>" +
      (trophy.hidden ? '<span class="chip">Hidden on PSN</span>' : "") +
      flagChip(trophy) +
      "</div>" +
      "<h2>" + esc(displayName(trophy)) + "</h2>" +
      '<p class="official-desc"><span class="official-tag">OFFICIAL</span>' +
      (masked ? '<span class="masked">Official description hidden by spoiler-safe mode.</span>' : esc(trophy.description)) + "</p>" +
      callouts +
      '<label class="earned-row"><input type="checkbox" data-earn="' + trophy.id + '"' + (earned ? " checked" : "") + "> Earned</label>" +
      "<h3>Guide</h3><p>" + (masked ? '<span class="masked">Guide hidden by spoiler-safe mode.</span>' : cited(trophy.guide)) + "</p>" +
      "<h3>Steps — " + doneSteps + " / " + trophy.steps.length + " done</h3>" + stepsHtml +
      counterHtml +
      "<h3>Your notes</h3>" +
      '<textarea data-note="' + trophy.id + '" placeholder="Routes, save slots, reminders…">' +
      esc(state.notes[trophy.id] || "") + "</textarea>" +
      '<p><button type="button" id="closeDetail">Close detail</button></p>';
    panel.hidden = false;

    $("closeDetail").addEventListener("click", function () {
      selectedId = null;
      renderDetail();
      renderLedger();
    });
  }

  /* ---------- roadmap ---------- */
  function renderRoadmap() {
    var cumulative = 0;
    var cards = data.stages.map(function (stage) {
      cumulative += stage.hours;
      var prog = Planner.stageProgress(data, state, stage.id);
      var pct = prog.total ? Math.round((prog.done / prog.total) * 100) : 0;
      var hasMissable = prog.trophies.some(function (t) { return t.flag === "missable"; });
      return '<article class="stage-card"><h3>Stage ' + stage.id + " — " + esc(stage.name) + "</h3>" +
        '<p class="stage-hours">±' + stage.hours + " hours · cumulative ±" + cumulative + " hours · " +
        prog.done + " / " + prog.total + " trophies earned</p>" +
        '<div class="stage-bar"><div style="width:' + pct + '%"></div></div>' +
        "<p><b>Focus:</b> " + esc(stage.focus) + "</p><p>" + cited(stage.detail) + "</p>" +
        (hasMissable ? '<p><span class="missable-marker">MISSABLE IN THIS STAGE</span> Positive Mental Attitude — the Chapter 1 balcony meditation lives here.</p>' : "") +
        "</article>";
    }).join("");
    $("roadmapRoot").innerHTML =
      '<div class="total-card"><div><div class="big">±' + data.meta.platinumHours + " hours</div>" +
      "<div>total to the platinum, one playthrough</div></div>" +
      "<div><b>Difficulty " + data.meta.platinumDifficulty + "</b> · no online trophies · no difficulty trophies · " +
      data.meta.hiddenCount + " hidden trophies</div></div>" + cards;
  }

  /* ---------- missables & watch ---------- */
  function renderMissables() {
    var order = { missable: 0, watch: 1, unconfirmed: 2 };
    var flagged = data.trophies.filter(function (t) { return t.flag !== "none"; });
    flagged.sort(function (a, b) { return order[a.flag] - order[b.flag] || a.stage - b.stage; });
    $("missablesRoot").innerHTML = flagged.map(function (t) {
      var counter = t.target
        ? '<span class="chip counter">' + (state.counters[t.id] || 0) + " / " + t.target + " " + esc(t.targetLabel) + "</span>"
        : "";
      return '<article class="flag-card">' + flagChip(t) +
        "<h3>" + esc(t.name) + "</h3>" +
        '<p><span class="official-tag">OFFICIAL</span>' + esc(t.description) + "</p>" +
        '<p class="detail-meta"><span class="chip grade-' + t.grade + '">' + gradeLabel(t.grade) + " · " + t.points + ' pts</span>' +
        '<span class="chip">Stage ' + t.stage + "</span>" + counter + "</p>" +
        "<p>" + cited(t.guide) + "</p>" +
        '<button type="button" data-open="' + t.id + '">Open in ledger</button></article>';
    }).join("");
  }

  /* ---------- planner ---------- */
  function renderPlan() {
    var hours = Math.max(1, Math.min(60, Number($("sessionHours").value) || 6));
    var plan = Planner.buildPlan(data, state, hours);
    if (plan.items.length === 0) {
      $("plannerRoot").innerHTML = '<p class="plan-summary">Nothing left to plan — all 55 trophies are earned.</p>';
      return;
    }
    var items = plan.items.map(function (item, i) {
      var t = item.trophy;
      return '<div class="plan-item"><span class="pi-name">' + (i + 1) + ". " + esc(displayName(t)) + "</span> " +
        '<span class="chip">Stage ' + t.stage + "</span> " +
        '<span class="chip">±' + t.hours + "h</span> " +
        '<span class="chip grade-' + t.grade + '">' + gradeLabel(t.grade) + "</span>" +
        (item.focusBlock ? ' <span class="chip flag-watch">FOCUS BLOCK — longer than one session, start it now</span>' : "") +
        "<br><span class='dim'>" + esc(t.scope) + " — first step: " +
        esc(t.steps[0].replace(/\s*\[\d+\]/g, "")) + "</span></div>";
    }).join("");
    $("plannerRoot").innerHTML =
      '<p class="plan-summary">Session plan: ' + plan.items.length + " trophies, ±" + plan.plannedHours +
      " of " + hours + " hours filled" + (plan.slack > 0 ? ", ±" + plan.slack + "h slack for travel and free-roam" : "") +
      ". After this session: ±" + plan.remainingAfter + " hours to the platinum.</p>" + items;
  }

  /* ---------- matrix + sources ---------- */
  function renderMatrix() {
    var head = '<tr><th class="name">Trophy</th>' + data.sources.map(function (s) {
      return "<th title='" + esc(s.name) + "'>[" + s.n + "]</th>";
    }).join("") + "</tr>";
    var rows = data.trophies.map(function (t) {
      var cells = data.sources.map(function (s) {
        return t.sources.indexOf(s.n) !== -1 ? '<td class="hit">●</td>' : "<td>·</td>";
      }).join("");
      return '<tr><td class="name">' + esc(t.name) + "</td>" + cells + "</tr>";
    }).join("");
    $("matrixTable").innerHTML = head + rows;
  }

  function renderSources() {
    var counts = {};
    data.trophies.forEach(function (t) {
      t.sources.forEach(function (n) { counts[n] = (counts[n] || 0) + 1; });
    });
    $("sourcesRoot").innerHTML = data.sources.map(function (s) {
      return '<article class="source-card"><h3>[' + s.n + "] " + esc(s.name) + "</h3>" +
        "<p>" + esc(s.role) + "</p>" +
        '<p><span class="chip">Cited by ' + (counts[s.n] || 0) + " of " + data.trophies.length + " trophies</span></p></article>";
    }).join("");
  }

  function renderAll() {
    renderAudit();
    renderProgress();
    renderRail();
    renderLedger();
    renderDetail();
    renderRoadmap();
    renderMissables();
    renderPlan();
    renderMatrix();
    renderSources();
    Store.saveState(state);
  }

  /* ---------- views ---------- */
  function showView(name) {
    currentView = name;
    ["ledger", "roadmap", "missables", "planner", "matrix", "sources"].forEach(function (v) {
      $("view-" + v).hidden = v !== name;
    });
    var tabs = $("viewTabs").querySelectorAll(".tab");
    tabs.forEach(function (tab) {
      tab.classList.toggle("active", tab.getAttribute("data-view") === name);
    });
  }

  /* ---------- events ---------- */
  function bindEvents() {
    $("viewTabs").addEventListener("click", function (ev) {
      var tab = ev.target.closest(".tab");
      if (tab) showView(tab.getAttribute("data-view"));
    });

    document.body.addEventListener("click", function (ev) {
      var opener = ev.target.closest("[data-open]");
      if (opener && !ev.target.matches("input")) {
        selectedId = opener.getAttribute("data-open");
        showView("ledger");
        renderDetail();
        renderLedger();
        $("detailPanel").scrollIntoView({ behavior: "smooth", block: "start" });
      }
      var counterBtn = ev.target.closest("[data-counter]");
      if (counterBtn) {
        var parts = counterBtn.getAttribute("data-counter").split(":");
        var id = parts[0];
        var delta = Number(parts[1]);
        var trophy = data.trophies.filter(function (t) { return t.id === id; })[0];
        var next = (state.counters[id] || 0) + delta;
        if (trophy && trophy.target) next = Math.max(0, Math.min(trophy.target, next));
        state.counters[id] = next;
        renderAll();
      }
    });

    document.body.addEventListener("change", function (ev) {
      var earn = ev.target.closest("[data-earn]");
      if (earn) {
        var id = earn.getAttribute("data-earn");
        if (earn.checked) state.earned[id] = true; else delete state.earned[id];
        renderAll();
        return;
      }
      var step = ev.target.closest("[data-step]");
      if (step) {
        var parts = step.getAttribute("data-step").split(":");
        var sid = parts[0];
        var idx = Number(parts[1]);
        if (!state.steps[sid]) state.steps[sid] = [];
        state.steps[sid][idx] = step.checked;
        renderAll();
        return;
      }
      var counterInput = ev.target.closest("[data-counter-input]");
      if (counterInput) {
        var cid = counterInput.getAttribute("data-counter-input");
        var trophy2 = data.trophies.filter(function (t) { return t.id === cid; })[0];
        var val = Math.max(0, Number(counterInput.value) || 0);
        if (trophy2 && trophy2.target) val = Math.min(trophy2.target, val);
        state.counters[cid] = val;
        renderAll();
      }
    });

    document.body.addEventListener("input", function (ev) {
      var note = ev.target.closest("[data-note]");
      if (note) {
        state.notes[note.getAttribute("data-note")] = note.value;
        Store.saveState(state);
      }
    });

    ["searchInput", "kindFilter", "gradeFilter", "stageFilter", "statusFilter"].forEach(function (id) {
      $(id).addEventListener("input", renderLedger);
      $(id).addEventListener("change", renderLedger);
    });

    $("spoilerToggle").addEventListener("change", function () {
      state.spoilerSafe = $("spoilerToggle").checked;
      renderAll();
    });

    $("exportBtn").addEventListener("click", function () {
      var blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "leonida-atlas-v3-progress.json";
      a.click();
      URL.revokeObjectURL(url);
    });

    $("importBtn").addEventListener("click", function () { $("importFile").click(); });
    $("importFile").addEventListener("change", function () {
      var file = $("importFile").files[0];
      if (!file) return;
      file.text().then(function (text) {
        try {
          var parsed = JSON.parse(text);
          var fresh = Store.blankState();
          if (parsed.earned) fresh.earned = parsed.earned;
          if (parsed.steps) fresh.steps = parsed.steps;
          if (parsed.counters) fresh.counters = parsed.counters;
          if (parsed.notes) fresh.notes = parsed.notes;
          fresh.spoilerSafe = parsed.spoilerSafe === true;
          state = fresh;
          $("spoilerToggle").checked = state.spoilerSafe;
          renderAll();
        } catch (err) {
          window.alert("That file is not valid progress JSON.");
        }
      });
    });

    $("resetBtn").addEventListener("click", function () {
      if (window.confirm("Clear all tracked progress on this device?")) {
        state = Store.clearState();
        selectedId = null;
        $("spoilerToggle").checked = false;
        renderAll();
      }
    });

    $("planBtn").addEventListener("click", renderPlan);
    $("sessionHours").addEventListener("change", renderPlan);
    document.querySelectorAll(".preset").forEach(function (btn) {
      btn.addEventListener("click", function () {
        $("sessionHours").value = btn.getAttribute("data-hours");
        renderPlan();
      });
    });
  }

  /* ---------- init ---------- */
  function initFilters() {
    var kinds = [];
    data.trophies.forEach(function (t) { if (kinds.indexOf(t.kind) === -1) kinds.push(t.kind); });
    kinds.sort();
    $("kindFilter").innerHTML = '<option value="">All kinds</option>' + kinds.map(function (k) {
      return '<option value="' + esc(k) + '">' + esc(k) + "</option>";
    }).join("");
    $("stageFilter").innerHTML = '<option value="">All stages</option>' + data.stages.map(function (s) {
      return '<option value="' + s.id + '">Stage ' + s.id + " — " + esc(s.name) + "</option>";
    }).join("");
  }

  fetch("data/trophies.json")
    .then(function (res) { return res.json(); })
    .then(function (json) {
      data = json;
      initFilters();
      $("spoilerToggle").checked = state.spoilerSafe;
      bindEvents();
      if (params.get("detail")) selectedId = params.get("detail");
      if (params.get("seed") === "demo" && !selectedId) selectedId = "positive-mental-attitude";
      renderAll();
      var view = params.get("view");
      if (view && $("view-" + view)) showView(view);
    })
    .catch(function (err) {
      document.body.insertAdjacentHTML("beforeend",
        '<p style="padding:1rem;font-weight:bold">Could not load data/trophies.json — serve the app folder over HTTP to use the tracker.</p>');
    });
})();
