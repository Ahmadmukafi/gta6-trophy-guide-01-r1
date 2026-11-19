// Leonida Ledger — the entry program for gta6-trophy-guide-01 (Node 22, stdlib only).
// The guide itself is plain static files: app/index.html opens in desktop Chrome with
// the network off, its trophy data lives in app/data/trophies.json, and the screenshots
// in screenshots/ are real renders of that app. This program hands the entry in: it
// copies app/ and screenshots/ from beside this file into the output directory and
// writes output/dossier.json with the vendored make.fun library, which is what the
// judge reads. Keep vendor/makefun-frontend.ts exactly as the kit shipped it — the
// scorer rebuilds the dossier with its own copy and the two must match byte for byte.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Run it twice into two directories: both runs must write the same bytes.

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The repository root is the directory this file sits in; the grader runs it with
// a read-only /bot holding that same directory, so nothing here depends on cwd.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's caps for this bounty: at most 4 screenshots, each at most 256 KiB;
// at most 993 files and directories in app/ and 48 MiB of app files in all; the
// dossier text is capped at 160 KiB. The library refuses an entry that breaks them,
// which is the same refusal the gate would give, so a bad entry fails loudly here.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

function copyEntryInto(output) {
  mkdirSync(output, { recursive: true });
  cpSync(join(repoRoot, 'app'), join(output, 'app'), { recursive: true });
  const shotsOut = join(output, 'screenshots');
  mkdirSync(shotsOut, { recursive: true });
  const shotsIn = join(repoRoot, 'screenshots');
  if (existsSync(shotsIn)) cpSync(shotsIn, shotsOut, { recursive: true });
}

function checkShotsPresent(output) {
  const shots = readdirSync(join(output, 'screenshots')).filter((name) => !name.startsWith('.'));
  if (shots.length < 3 || shots.length > 4) {
    throw new Error(`expected 3 or 4 screenshots, found ${shots.length}`);
  }
}

copyEntryInto(outputDir);
checkShotsPresent(outputDir);
writeFileSync(join(outputDir, 'dossier.json'), buildDossier(outputDir, DOSSIER_CAPS));
