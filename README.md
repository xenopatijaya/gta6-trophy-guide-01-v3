[![make.fun entry](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/badge/gta6-trophy-guide-01.svg)
[![make.fun rank](https://make.fun/badge/gta6-trophy-guide-01/rank.svg)](https://github.com/xenopatijaya/gta6-trophy-guide-01-v3)
[![make.fun reward](https://make.fun/badge/gta6-trophy-guide-01/reward.svg)](https://github.com/xenopatijaya/gta6-trophy-guide-01-v3)

# Leonida Atlas v3 — GTA VI Trophy Guide & Tracker

Version 3 of the Leonida Atlas, rebuilt from scratch as a fully hand-written entry for the make.fun bounty `gta6-trophy-guide-01`.

What is inside:

- **All 55 PS5 trophies** for Grand Theft Auto VI — 1 platinum, 2 gold, 6 silver, 46 bronze, 28 of them hidden — each with its **official PSN description** (labelled OFFICIAL in every row and in the detail panel), grade and trophy points (platinum 300, gold 90, silver 30, bronze 15).
- **Original guides and numbered steps for every trophy**, written for this atlas. Every step carries an inline citation chip with the source's name (for example `[1] PowerPyx`), drawn from a numbered list of 10 sources: PowerPyx, PSNProfiles, Exophase, PlayStationTrophies, TrueTrophies, GTABase, GTA Wiki, Rockstar Newswire, IGN Wiki and PlayStation.
- **The one possibly missable trophy, handled properly.** Positive Mental Attitude gets a POSSIBLY MISSABLE callout (the Chapter 1 balcony meditation) and a SOURCES DISAGREE callout: location guides count 18 meditation spots, the 100% checklist only asks for 15 — the tracker counts all 18.
- **A working tracker, not a static list.** Earned flags, per-step checkboxes with x/y progress, PSN progress counters (23 trophies carry a target such as 250 stunts or 100 WAiNK locations), and free-text notes — all stored in your browser's localStorage, with JSON export and import.
- **Spoiler-safe mode** that masks hidden and story trophies until you earn them.
- **A 6-stage roadmap** to the roughly 200-hour, 4/10-difficulty platinum: per-stage progress bars, hours per stage and cumulative hours, and the missable marker on the stage that contains it.
- **Missables & watch view** (1 missable, 8 watch, 8 unconfirmed), a **session planner** that fills your chosen hours from the Next Up queue, a **55×10 source matrix**, a sources view, and a right rail with Next Up, Time to Platinum and per-source "cited by X of 55" counts.
- **An audit strip computed from the data itself**: cited trophies, cited steps, source count and flag counts — if the data changes, the strip changes.

No game artwork or logos are used, and the app makes no network calls beyond fetching its own local data file.

## Run it

Build the make.fun dossier (copies `app/` and `screenshots/` into the output folder and writes `dossier.json`):

```sh
node main.ts
# or choose the destination:
MAKEFUN_OUTPUT_DIR=/tmp/atlas-out node main.ts
```

Preview the tracker locally:

```sh
node serve.ts
# then open http://localhost:4173/
```

Demo state for screenshots: open `http://localhost:4173/?seed=demo` (add `&view=roadmap`, `&view=missables` or `&view=planner` for the other views).

## Layout

- `app/` — the tracker itself: `index.html`, `style.css`, `js/app.js`, `js/store.js`, `js/planner.js`, `data/trophies.json`.
- `main.ts` — dossier builder, using the vendored library in `vendor/`.
- `serve.ts` — a small static server for local preview.
- `screenshots/` — four 1280×800 captures of the running app.
- `shots.json` — the screenshot manifest.

## License

MIT — see `LICENSE`. Trophy names and descriptions are the official PlayStation wording, reproduced as short factual listings; all guide text in this repository is original.
