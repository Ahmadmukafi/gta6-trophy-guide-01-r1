# Leonida Ledger — GTA VI Trophy Guide &amp; Tracker

[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Ahmadmukafi/gta6-trophy-guide-01-r1/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Ahmadmukafi/gta6-trophy-guide-01-r1/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI:
1 platinum, 2 gold, 6 silver, 46 bronze — 28 of them hidden, 0 online, about 200 hours
to the platinum, and exactly one trophy reported as possibly missable.

## What it is

- **Checklist** — every trophy with its official name, description and grade as PlayStation
  publishes them, a guide in our own words, and the source cited beside each guide.
  Progress, per-trophy notes and PSN counters (stunts 0/250, meditations 0/18, …) are saved
  in the browser's localStorage. Export to a file, import it back, reset any time.
- **Platinum roadmap** — seven chapter-ordered stages with per-stage progress, from the
  Chapter 1 opening to the free-roam 100% cleanup and the platinum itself.
- **Next up** — the next three unearned trophies in roadmap order, with why each matters now.
- **Missables** — the one warning that matters: the Chapter 1 balcony meditation for
  Positive Mental Attitude, plus save-slot advice for a game with no mission replay.
- **Filters & spoilers** — search across names, guides and missions; filter by kind (story,
  missable, collectibles, activities, side quests, robberies, online) and grade; hide earned
  trophies; a spoiler setting that hides story trophies' names and descriptions until earned.
  Keyboard: `/` search, `R` roadmap, `M` missables, `S` spoilers, `H` hide earned.

## Sources

Guides draw on, and cite, PowerPyx's GTA 6 Trophy Guide & Roadmap, the EGamers and
Output Lag trophy lists (27 visible / 28 hidden), Exophase's published list, and IGTA's
secret-trophy notes. Five trophies had no confirmed unlock method in any community guide
at launch (19 Nov 2026) and are marked unconfirmed in the app rather than guessed at.

## Run it

Serve `app/` with any static server — for example `node serve.ts` — and open
http://localhost:8080. No build step, no network at run time, no Rockstar artwork.

## Hand in

`main.ts` (Node 22, stdlib only) copies `app/` and `screenshots/` to `/output` and writes
`/output/dossier.json` with the vendored make.fun library. Run it twice; both runs must
write the same bytes.

## License

MIT — see [LICENSE](LICENSE).
