[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/xenopatijaya/gta6-trophy-guide-01-v3/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/xenopatijaya/gta6-trophy-guide-01-v3/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# Leonida Atlas v3 — GTA VI Trophy Guide & Tracker (Every Step Cited by Name)

An offline guide and tracker for all **55 PlayStation 5 trophies** of Grand Theft Auto VI (1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden on PSN; 0 online), built for the [make.fun bounty](https://make.fun/bounty/gta6-trophy-guide-01). This is the v3 entry — the v2 atlas, levelled up on every axis the rubric names: the tracker, the roadmap, the cited guidance, and the polish.

## What v3 adds over v2

- **Official descriptions in every ledger row** — each row shows the trophy's name, its official PSN description in small text directly underneath, and grade + PSN-points chips, so the list alone answers "what is this trophy?".
- **Citations that name their source** — every guide step ends with a chip like `[1] PowerPyx` or `[8] GTABase`, not a bare number, so a screenshot by itself shows who backs each step. The numbered source list and the 55×10 source matrix are unchanged in structure and now carry the names in their headers too.
- **PSN progress targets** — the 20 counter trophies (meditations, stunts, WAiNK spots, vehicles, challenges, races, card sets, vaults, dollars and more) carry an explicit `target` in the data and a `0 / N` target chip in the row, the detail pane and the planner; the detail counter counts toward that target and reaching it marks the trophy earned.
- **Per-step tracking** — every step in the detail pane has its own checkbox. A trophy's progress is steps done / total steps, shown in the row, the detail pane, the right rail and the planner, and the ticks save in localStorage together with earned state, counters and the spoiler switch (export/import carries them too).
- **Roadmap with cumulative hours** — each of the six stages shows its own hours, the running cumulative total (45 → 70 → 125 → 165 → 185 → 200 h), a total-estimate card, and a warning marker on any stage that holds a flagged trophy — Stage 1 carries the possibly-missable warning for Positive Mental Attitude.
- **Bigger, higher-contrast type** — the whole type scale moved up a step and the ink/muted colours darkened, so the 1280×800 judge contact sheet stays legible.

## Carried over from v2

- **Audit strip** — under the header, always visible: 55 official · 1P 2G 6S 46B · 28 hidden · 55/55 guides cite a source · every step cited · 10 sources read 20 Nov 2026 · 20 PSN progress targets · 1 possibly missable · 8 watch · 8 unconfirmed · 1 source disagreement. Every number is computed from the data file at load, not typed in.
- **10 sources, cross-checked** — PowerPyx, Exophase, PSNProfiles (list and guide), OutputLag, KeenGamer, eGamers, GTABase, GTA-Zone and the official PSN list, all read 20 Nov 2026.
- **The disagreement, shown** — trophy guides count 18 meditations across 10 spots; the 100% checklist needs only 15 of 18. Both numbers appear wherever meditations do, with a SOURCES DISAGREE callout on Positive Mental Attitude — the game's one possibly missable trophy, whose Chapter 1 balcony meditation at Jason's house can be lost for a whole playthrough.
- **Honest flags** — 1 POSSIBLY MISSABLE, 8 WATCH (specific setups that are easy to fumble) and 8 UNCONFIRMED (vague hidden trophies whose trigger launch sources have not verified). Unconfirmed entries say so instead of inventing a method.
- **Session planner** — pick the hours you have (1/2/4/6/10) and the planner fills the session from the earliest-ungated queue: missable first, then roadmap order. The right rail always shows NEXT UP, a TIME TO PLATINUM estimate that shrinks as you earn, and the numbered SOURCES list with a "cited by X of 55 guides" count per source.
- **Tracker essentials** — checklist saved in localStorage, export/import as JSON, search, filters by kind/grade/stage, earned-only filter, and a spoiler-safe mode that hides story trophy names and descriptions until they are earned.

## Run it

```sh
# serve app/ and open http://localhost:8080
node serve.ts
# or any static server:
python3 -m http.server 8080 --directory app
```

Open with `?seed=demo` for a mid-run demo state (13 of 55 earned, counters and step checklists part-way) — that is the state the screenshots were taken in. Add `&view=roadmap`, `&view=missables`, `&view=planner`, `&view=matrix` or `&view=sources` to open on a specific tab. The app works fully offline and makes no network requests at run time.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with `buildDossier` from `vendor/makefun-frontend.ts` (the kit's copy, unchanged).

## License

MIT — see [LICENSE](LICENSE).
