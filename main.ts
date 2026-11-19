// Leonida Atlas — hand-in program for the make.fun bounty gta6-trophy-guide-01.
// Node 22, standard library only, no network, deterministic output.
//
// The atlas itself is the static site under app/ (index.html, style.css,
// js/ modules and data/trophies.json). This program's single job is the
// hand-in: copy app/ and screenshots/ into the output directory and write
// dossier.json there with buildDossier from vendor/makefun-frontend.ts.
// The vendored library file is the kit's copy and stays untouched, because
// the scorer rebuilds the dossier with its own copy and demands the same
// bytes. Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// MAKEFUN_OUTPUT_DIR stands in for the grader's /output.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoDir = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy one tree from the repository into the output directory, creating
// folders as needed. Nothing is deleted first, so a second run into the
// same output overwrites with identical bytes.
function copyTree(from: string, to: string): void {
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

mkdirSync(outDir, { recursive: true });
copyTree(join(repoDir, 'app'), join(outDir, 'app'));
const shotsFrom = join(repoDir, 'screenshots');
if (existsSync(shotsFrom)) copyTree(shotsFrom, join(outDir, 'screenshots'));

// The dossier limits mirror the competition gate: the text cap shapes the
// dossier bytes; the screenshot and app caps refuse anything the scorer
// would refuse anyway (over 4 screenshots, one screenshot over 256 KiB,
// over 993 app entries or 48 MiB of app files).
const limits = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};
const dossier = buildDossier(outDir, limits);
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`Leonida Atlas handed in: app/ + screenshots/ copied to ${outDir}, dossier.json written (${dossier.length} bytes).`);
