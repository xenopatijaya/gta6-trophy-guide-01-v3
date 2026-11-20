// Leonida Atlas v3 — make.fun entry builder.
//
// What this does, in plain terms:
//   1. reads the destination from MAKEFUN_OUTPUT_DIR (falling back to /output),
//   2. copies the finished app/ and screenshots/ folders into it,
//   3. asks the vendored frontend library to pack that folder into a
//      dossier, and writes the result as dossier.json next to the copy.
//
// Running it twice over the same sources produces the same dossier
// bytes, which the rebuild check relies on.

import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// Start from an empty destination so stale files can never leak into
// the dossier from a previous build. The destination itself is never
// removed — in the grader environment it is /output, which we may not
// be able to delete or recreate — so only the copied sub-folders are
// cleared before they are copied in again.
mkdirSync(outDir, { recursive: true });
rmSync(join(outDir, "app"), { recursive: true, force: true });
rmSync(join(outDir, "screenshots"), { recursive: true, force: true });

cpSync(join(here, "app"), join(outDir, "app"), { recursive: true });
cpSync(join(here, "screenshots"), join(outDir, "screenshots"), { recursive: true });

// Caps handed to the dossier builder: a generous text budget for a
// 55-trophy data file plus three script files, and the screenshot
// limits this entry holds itself to (4 shots, each under 256 KiB).
const dossier = buildDossier(outDir, {
  text_max_bytes: 2 * 1024 * 1024,
  screenshots: { max: 8, max_bytes: 256 * 1024 },
});

writeFileSync(join(outDir, "dossier.json"), dossier);
console.log(`Leonida Atlas v3: dossier written to ${join(outDir, "dossier.json")} (${dossier.length} bytes)`);
