// Leonida Ledger — GTA VI trophy guide & tracker.
// Loads app/data/trophies.json, renders the checklist, the platinum roadmap, the
// next-up planner and the missables panel, and keeps progress in localStorage.
// No network at run time: the only fetch is the trophy file beside this script.
const STORE_KEY = 'leonida-ledger-v1';
const RING_CIRCUMFERENCE = 326.7;

const ROADMAP_STAGES = [
  { n: 1, title: 'Chapter 1 — First steps in Leonida', blurb: 'Open the story, meet the crew — and do the balcony meditation before the chapter ends.' },
  { n: 2, title: 'Chapter 2 — Two protagonists', blurb: 'Coffee Break unlocks playing as both Jason and Lucia. Garages, the Scooter Bros app and Billy open up here.' },
  { n: 3, title: 'Chapter 3 — Vice City opens', blurb: 'Jewelry jobs and the Snap Gun, the Key Cloner, the Dye Pack Jammer, Cal’s fishing line.' },
  { n: 4, title: 'Chapter 4 — The big scores', blurb: 'The Cartel Heist, the Vice City jobs, and the bank vaults that pay up to $205,000 a robbery.' },
  { n: 5, title: 'Chapter 5 — The finale', blurb: 'Operation Savage Glory, then the final mission. The story trophies end here.' },
  { n: 6, title: 'Free-roam — the 100% checklist', blurb: 'The long cleanup: collectibles, activities, robberies, side quests and the 100% checklist itself.' },
  { n: 7, title: 'Platinum — Leonida Legend', blurb: 'Vice Got a Price! pops the moment the other 54 are earned. About 200 hours all in.' },
];

const KIND_LABELS = {
  story: 'Story', missable: 'Missable', collectibles: 'Collectibles', activities: 'Activities',
  side: 'Side quests', robbery: 'Robberies', misc: 'Secret & misc', online: 'Online',
};

const state = loadStoredState();
let trophyData = null;

function loadStoredState() {
  const fallback = { earned: [], notes: {}, counts: {}, spoilers: true, hideEarned: false, kind: 'all', grade: 'all', query: '' };
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return { ...fallback, ...parsed, notes: parsed.notes ?? {}, counts: parsed.counts ?? {} };
  } catch {
    return fallback;
  }
}

function persistState() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function earnedIds() {
  return new Set(state.earned);
}

function isEarned(trophy) {
  return earnedIds().has(trophy.id);
}

function setEarned(trophy, earned) {
  const ids = earnedIds();
  if (earned) ids.add(trophy.id);
  else ids.delete(trophy.id);
  state.earned = [...ids].sort((a, b) => a - b);
  persistState();
  renderAll();
}

function trophyVisibleName(trophy) {
  if (state.spoilers && trophy.kind === 'story' && !isEarned(trophy)) return 'Hidden story trophy';
  return trophy.name;
}

function trophyVisibleDescription(trophy) {
  if (state.spoilers && trophy.kind === 'story' && !isEarned(trophy)) return 'Earn it in the story to reveal this trophy.';
  return trophy.description;
}

function trophyMatches(trophy) {
  if (state.grade !== 'all' && trophy.grade !== state.grade) return false;
  if (state.hideEarned && isEarned(trophy)) return false;
  if (state.kind === 'missable' && !trophy.missable) return false;
  if (state.kind === 'online') return false;
  if (state.kind !== 'all' && state.kind !== 'missable' && trophy.kind !== state.kind) return false;
  const q = state.query.trim().toLowerCase();
  if (q) {
    const hay = `${trophy.name} ${trophy.description} ${trophy.guide} ${trophy.kind}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function sortedForRoadmap(trophies) {
  return [...trophies].sort((a, b) => (a.roadmap - b.roadmap) || (a.id - b.id));
}

function renderProgress() {
  const total = trophyData.trophies.length;
  const earned = state.earned.length;
  document.getElementById('earnedCount').textContent = String(earned);
  document.getElementById('ringFill').style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - earned / total));
  document.getElementById('meterFill').style.width = `${(earned / total) * 100}%`;
  const byGrade = (grade) => trophyData.trophies.filter((t) => t.grade === grade && isEarned(t)).length;
  const totals = (grade) => trophyData.trophies.filter((t) => t.grade === grade).length;
  document.getElementById('gradeLine').textContent =
    `Platinum ${byGrade('platinum')}/${totals('platinum')} · Gold ${byGrade('gold')}/${totals('gold')} · Silver ${byGrade('silver')}/${totals('silver')} · Bronze ${byGrade('bronze')}/${totals('bronze')}`;
  document.getElementById('progressNote').textContent = earned === total
    ? 'Platinum earned — you are a Leonida Legend. Congratulations!'
    : earned === 0
      ? 'Tick trophies off as you earn them. Progress, notes and counters are saved in this browser only — nothing leaves your machine.'
      : `${total - earned} to go. The next ones to chase are listed under Next up, in roadmap order.`;
}

function renderNextUp() {
  const upcoming = sortedForRoadmap(trophyData.trophies).filter((t) => !isEarned(t)).slice(0, 3);
  const list = document.getElementById('nextList');
  list.replaceChildren();
  for (const trophy of upcoming) {
    const item = document.createElement('li');
    const kind = document.createElement('span');
    kind.className = 'next-kind';
    kind.textContent = `Stage ${trophy.roadmap} · ${KIND_LABELS[trophy.kind] ?? trophy.kind}`;
    const name = document.createElement('strong');
    name.textContent = trophyVisibleName(trophy);
    const why = document.createElement('p');
    why.textContent = nextUpReason(trophy);
    item.append(kind, name, why);
    list.append(item);
  }
  if (upcoming.length === 0) {
    const item = document.createElement('li');
    item.textContent = 'Everything is earned — the platinum is yours.';
    list.append(item);
  }
}

function nextUpReason(trophy) {
  if (trophy.missable) return 'Do this now — it may not come back after Chapter 1.';
  if (trophy.kind === 'story') return 'Next story beat in the roadmap. Play the mission and it pops.';
  if (trophy.roadmap <= 3) return 'Unlocks early — clear it while the story is still in this chapter.';
  return 'Next in roadmap order. The guide below says exactly how.';
}

function renderRoadmap() {
  const list = document.getElementById('stageList');
  const prePlatinum = trophyData.trophies.filter((t) => t.grade !== 'platinum');
  const prePlatinumEarned = prePlatinum.filter((t) => isEarned(t)).length;
  document.getElementById('roadmapCount').textContent =
    `${prePlatinumEarned} of ${prePlatinum.length} stepping stones toward the platinum are earned — finish the set and the last trophy unlocks on its own.`;
  list.replaceChildren();
  for (const stage of ROADMAP_STAGES) {
    const members = trophyData.trophies.filter((t) => t.roadmap === stage.n);
    const done = members.filter((t) => isEarned(t)).length;
    const item = document.createElement('li');
    item.className = 'stage';
    const head = document.createElement('div');
    head.className = 'stage-head';
    const title = document.createElement('h3');
    title.textContent = `Stage ${stage.n} — ${stage.title}`;
    const blurb = document.createElement('p');
    blurb.textContent = stage.blurb;
    const bar = document.createElement('div');
    bar.className = 'stage-bar';
    const fill = document.createElement('i');
    fill.style.width = members.length ? `${(done / members.length) * 100}%` : '0%';
    bar.append(fill);
    const count = document.createElement('span');
    count.className = 'stage-count';
    count.textContent = `${done}/${members.length} earned`;
    head.append(title, blurb, bar, count);
    const chips = document.createElement('div');
    chips.className = 'stage-trophies';
    for (const trophy of members) {
      const chip = document.createElement('span');
      chip.className = 'stage-chip' + (isEarned(trophy) ? ' done' : '') + (trophy.missable ? ' miss' : '');
      chip.textContent = trophyVisibleName(trophy) + (trophy.missable ? ' !' : '');
      chips.append(chip);
    }
    item.append(head, chips);
    list.append(item);
  }
}

function renderChecklist() {
  const shown = trophyData.trophies.filter(trophyMatches);
  const list = document.getElementById('cardList');
  list.replaceChildren();
  document.getElementById('shownCount').textContent = `— showing ${shown.length} of ${trophyData.trophies.length}`;
  const empty = document.getElementById('emptyMsg');
  empty.hidden = shown.length !== 0;
  empty.textContent = state.kind === 'online'
    ? 'GTA VI has no online trophies at all — all 55 are earned alone in Leonida, so this filter stays empty on purpose.'
    : 'No trophies match this filter. Clear the search or pick another kind.';
  for (const trophy of shown) list.append(buildTrophyCard(trophy));
}

function buildTrophyCard(trophy) {
  const card = document.createElement('article');
  card.className = 'card' + (isEarned(trophy) ? ' earned' : '');
  const top = document.createElement('div');
  top.className = 'card-top';
  const check = document.createElement('label');
  check.className = 'card-check';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = isEarned(trophy);
  box.setAttribute('aria-label', `Mark ${trophy.name} earned`);
  box.addEventListener('change', () => setEarned(trophy, box.checked));
  check.append(box);
  const name = document.createElement('h3');
  name.className = 'card-name';
  name.textContent = trophyVisibleName(trophy);
  const grade = document.createElement('span');
  grade.className = `grade-badge grade-${trophy.grade}`;
  grade.textContent = trophy.grade;
  top.append(check, name, grade);
  const desc = document.createElement('p');
  desc.className = 'card-desc';
  desc.textContent = trophyVisibleDescription(trophy);
  const badges = document.createElement('div');
  badges.className = 'badges';
  badges.append(kindTag(trophy));
  if (trophy.hidden) badges.append(makeTag('Hidden on PSN', 'hidden'));
  if (trophy.missable) badges.append(makeTag('Potentially missable', 'missable'));
  if (trophy.guide.startsWith('UNCONFIRMED')) badges.append(makeTag('Unconfirmed', 'unconfirmed'));
  const guide = document.createElement('p');
  guide.className = 'guide';
  const guideLabel = document.createElement('span');
  guideLabel.className = 'guide-label';
  guideLabel.textContent = 'Guide';
  guide.append(guideLabel, document.createTextNode(trophy.guide));
  const source = document.createElement('p');
  source.className = 'source-line';
  source.textContent = 'Source: ';
  const link = document.createElement('a');
  link.href = trophy.source_url;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = trophy.source;
  source.append(link);
  card.append(top, desc, badges);
  if (trophy.count !== null && trophy.count !== undefined) card.append(buildCounter(trophy));
  card.append(guide, source, buildNotes(trophy));
  return card;
}

function kindTag(trophy) {
  const tag = makeTag(KIND_LABELS[trophy.kind] ?? trophy.kind, '');
  return tag;
}

function makeTag(text, extraClass) {
  const tag = document.createElement('span');
  tag.className = 'tag' + (extraClass ? ` ${extraClass}` : '');
  tag.textContent = text;
  return tag;
}

function buildCounter(trophy) {
  const wrap = document.createElement('div');
  wrap.className = 'counter';
  const label = document.createElement('label');
  label.textContent = 'Your progress: ';
  const input = document.createElement('input');
  input.type = 'number';
  input.min = '0';
  input.value = String(state.counts[trophy.id] ?? 0);
  input.setAttribute('aria-label', `Your count for ${trophy.name}`);
  input.addEventListener('change', () => {
    const value = Math.max(0, Math.floor(Number(input.value) || 0));
    state.counts[trophy.id] = value;
    input.value = String(value);
    persistState();
  });
  const target = document.createElement('span');
  target.className = 'target';
  target.textContent = `/ ${formatCountTarget(trophy)} ${trophy.count_label ?? ''}`.trim();
  label.append(input);
  wrap.append(label, target);
  return wrap;
}

function formatCountTarget(trophy) {
  return trophy.count >= 1000 ? trophy.count.toLocaleString('en-US') : String(trophy.count);
}

function buildNotes(trophy) {
  const details = document.createElement('details');
  details.className = 'notes';
  const summary = document.createElement('summary');
  summary.textContent = state.notes[trophy.id] ? 'Your notes (saved)' : 'Your notes';
  const area = document.createElement('textarea');
  area.value = state.notes[trophy.id] ?? '';
  area.placeholder = 'Your own notes for this trophy — a spot, a loadout, a reminder…';
  area.setAttribute('aria-label', `Notes for ${trophy.name}`);
  area.addEventListener('input', () => {
    state.notes[trophy.id] = area.value;
    summary.textContent = area.value ? 'Your notes (saved)' : 'Your notes';
    persistState();
  });
  details.append(summary, area);
  return details;
}

function renderAll() {
  renderProgress();
  renderNextUp();
  renderRoadmap();
  renderChecklist();
}

function exportProgress() {
  const payload = JSON.stringify({ earned: state.earned, notes: state.notes, counts: state.counts }, null, 2);
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  anchor.download = 'leonida-ledger-progress.json';
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

async function importProgress(file) {
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    if (Array.isArray(parsed.earned)) state.earned = parsed.earned.filter((id) => Number.isInteger(id));
    if (parsed.notes && typeof parsed.notes === 'object') state.notes = parsed.notes;
    if (parsed.counts && typeof parsed.counts === 'object') state.counts = parsed.counts;
    persistState();
    renderAll();
  } catch {
    alert('That file is not a Leonida Ledger progress export.');
  }
}

function wireControls() {
  document.getElementById('search').addEventListener('input', (event) => {
    state.query = event.target.value;
    persistState();
    renderChecklist();
  });
  document.getElementById('gradeFilter').addEventListener('change', (event) => {
    state.grade = event.target.value;
    persistState();
    renderChecklist();
  });
  document.getElementById('hideEarned').addEventListener('change', (event) => {
    state.hideEarned = event.target.checked;
    persistState();
    renderChecklist();
  });
  document.getElementById('spoilerToggle').addEventListener('change', (event) => {
    state.spoilers = event.target.checked;
    persistState();
    renderAll();
  });
  document.getElementById('kindChips').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-kind]');
    if (!button) return;
    state.kind = button.dataset.kind;
    persistState();
    for (const chip of document.querySelectorAll('#kindChips .chip')) {
      chip.classList.toggle('on', chip === button);
    }
    renderChecklist();
  });
  document.getElementById('exportBtn').addEventListener('click', exportProgress);
  document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
  document.getElementById('importFile').addEventListener('change', (event) => importProgress(event.target.files[0]));
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (!confirm('Reset all progress, notes and counters?')) return;
    state.earned = [];
    state.notes = {};
    state.counts = {};
    persistState();
    renderAll();
  });
  document.addEventListener('keydown', (event) => {
    if (event.target.matches('input, textarea, select')) return;
    if (event.key === '/') { event.preventDefault(); document.getElementById('search').focus(); }
    if (event.key === 'r' || event.key === 'R') document.getElementById('roadmap').scrollIntoView();
    if (event.key === 'm' || event.key === 'M') document.getElementById('missables').scrollIntoView();
    if (event.key === 's' || event.key === 'S') {
      const toggle = document.getElementById('spoilerToggle');
      toggle.checked = !toggle.checked;
      toggle.dispatchEvent(new Event('change'));
    }
    if (event.key === 'h' || event.key === 'H') {
      const toggle = document.getElementById('hideEarned');
      toggle.checked = !toggle.checked;
      toggle.dispatchEvent(new Event('change'));
    }
  });
}

function restoreControlValues() {
  document.getElementById('search').value = state.query;
  document.getElementById('gradeFilter').value = state.grade;
  document.getElementById('hideEarned').checked = state.hideEarned;
  document.getElementById('spoilerToggle').checked = state.spoilers;
  for (const chip of document.querySelectorAll('#kindChips .chip')) {
    chip.classList.toggle('on', chip.dataset.kind === state.kind);
  }
}

const response = await fetch('data/trophies.json');
trophyData = await response.json();
restoreControlValues();
wireControls();
renderAll();
