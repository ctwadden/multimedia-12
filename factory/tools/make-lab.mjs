#!/usr/bin/env node
/**
 * make-lab.mjs — deterministic renderer (output layer, NOT the Gold engine).
 * Companion package + lab definition → competency-tagged, multilingual
 * SEE→FOLLOW→TRY→SHOW→APPLY workbook with interactive retention questions,
 * per-student recorded answers (downloadable evidence claim), an optional
 * YouTube demo with per-step deep-links, and EN/ES/FR/AR + Arabic RTL.
 * No Gemini calls. Real frames from topic.screenshots.
 *
 *   node tools/make-lab.mjs --companion "<dir>" --module mm12-photoshop-module.json \
 *     --lab MM12-PS-LAB-08 [--youtube <videoId>] [--skills mm12-skills.json] [--out file.html]
 *
 * Interface strings: tools/i18n-ui.json. Content translations (optional):
 * <companion>/lesson.es.json | lesson.fr.json | lesson.ar.json — each may carry
 * {title,focus,competency:{title,canDo,l4},iCanStatements[],keyConcepts[],reflect[]}.
 * Missing fields fall back to English AND show a labelled "in review" banner (never
 * a silent English-as-translated). Provenance: FOLLOW/quiz = recording; TRY/SHOW/APPLY = scaffold.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const arg = (n, d = null) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const load = (p) => JSON.parse(readFileSync(p, 'utf8'));
const j = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

const companionDir = arg('companion');
if (!companionDir) { console.error('need --companion <dir>'); process.exit(1); }
const mod = load(arg('module', 'mm12-photoshop-module.json'));
const skillsDoc = load(arg('skills', 'mm12-skills.json'));
const UI = load(join(here, 'i18n-ui.json'));
const youtube = arg('youtube');
const lab = (mod.labs || []).find(l => l.id === arg('lab'));
if (!lab) { console.error(`lab not found`); process.exit(1); }

const pkg = load(join(companionDir, 'lesson.json'));
const topic = (pkg.topics && pkg.topics[0]) || {};
const stepsById = new Map();
for (const ch of (topic.chapters || [])) for (const s of (ch.steps || [])) stepsById.set(s.id, s);
const shots = topic.screenshots || {};
const primarySkill = skillsDoc.skills[lab.rollsUpTo[0]] || {};
const LOCS = ['en', 'es', 'fr', 'ar'];
const skillNext = Object.fromEntries(lab.rollsUpTo.map(id => [id, (skillsDoc.skills[id] || {}).nextMove || '']));
const wburl = arg('wburl', '');

// --- content translations (English base + optional sidecars) ---
const enContent = {
  title: pkg.lessonTitle || topic.title || lab.title, focus: lab.focus,
  compTitle: primarySkill.title || '', compCanDo: primarySkill.canDo || '', compL4: primarySkill.l4 || '',
  iCan: topic.iCanStatements || [], ideas: topic.keyConcepts || [],
  reflect: (topic.teachBackPrompts || []).slice(0, 3),
};
const CONTENT = { en: enContent };
const covered = { en: true };
for (const loc of ['es', 'fr', 'ar']) {
  const p = join(companionDir, `lesson.${loc}.json`);
  if (existsSync(p)) { const t = load(p); CONTENT[loc] = { ...enContent, ...t }; covered[loc] = true; }
  else { CONTENT[loc] = enContent; covered[loc] = false; }
}

const kbd = (a) => (a || []).map(k => `<kbd>${esc(k)}</kbd>`).join(' ');
const menu = (a) => (a || []).length ? `<div class="path">${a.map(esc).join(' → ')}</div>` : '';
const mmss = (sec) => sec == null ? '' : `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(Math.round(sec % 60)).padStart(2, '0')}`;
const shotFor = (g) => { for (const id of [g.primaryStepId, g.secondaryStepId, ...(g.stepIds || [])]) if (id && shots[id]) return shots[id]; return null; };

// --- FOLLOW ---
const groups = (topic.displayGroups || pkg.displayGroups || []);
const followHtml = groups.map((g, gi) => {
  const uri = shotFor(g);
  const first = (g.stepIds || []).map(id => stepsById.get(id)).find(Boolean) || {};
  const startSec = first.start != null ? Math.max(0, Math.floor(first.start)) : null;
  const stepList = (g.stepIds || []).map(id => stepsById.get(id)).filter(Boolean).map(s => `
      <div class="ministep">
        <div class="mstitle">${esc(s.title || s.description || 'Step')}</div>
        ${s.description && s.description !== s.title ? `<p class="mstext">${esc(s.description)}</p>` : ''}
        ${menu(s.menuPath)}
        ${(s.keyboardShortcuts || []).length ? `<div class="path">shortcut ${kbd(s.keyboardShortcuts)}</div>` : ''}
        ${(s.settings || []).length ? `<div class="path">settings: ${esc(s.settings.join(', '))}</div>` : ''}
        ${s.successCheck ? `<div class="note check"><b data-k="checkL">✓ Check:</b> ${esc(s.successCheck)}</div>` : ''}
        ${s.commonMistake ? `<details class="depth"><summary data-k="ifWrong">If it goes wrong</summary>${esc(s.commonMistake)}</details>` : ''}
      </div>`).join('');
  const watch = (youtube && startSec != null) ? `<button class="watch" onclick="seek(${startSec})" data-k="watch">▶ watch this move</button>` : '';
  return `
    <div class="step">
      <div class="head"><div class="num">${gi + 1}</div><h3>${esc(g.title || 'Step group')}</h3></div>
      <div class="grid2">
        <div class="shotwrap">${uri ? `<img class="shot-img" src="${uri}" alt="frame">` : `<div class="shot">frame</div>`}<div class="tstamp">${youtube ? watch : (startSec != null ? '▶ demo @ ' + mmss(startSec) : '')}</div></div>
        <div>${stepList}${g.successCheck ? `<div class="note why"><b data-k="doneWhen">Done when:</b> ${esc(g.successCheck)}</div>` : ''}</div>
      </div>
    </div>`;
}).join('');
const followBanner = `<div class="pending" data-showif="notenNoSteps" hidden><span data-k="pending"></span></div>`;

// --- interactive MC ---
let qn = 0;
const mc = (item) => {
  const id = 'q' + (++qn);
  const opts = (item.options || []).map((o, i) => `<button class="opt" data-c2="${i === item.correctAnswerIndex ? 1 : 0}" data-i="${i}" onclick="pick(this,'${id}')">${esc(o)}</button>`).join('');
  return `<div class="quiz" id="${id}" data-q="${esc(item.question)}">
    <div class="qq">${esc(item.question)}</div><div class="opts">${opts}</div>
    ${item.explanation ? `<div class="expl" hidden><b data-k="answer">Answer:</b> ${esc(item.explanation)}</div>` : ''}
  </div>`;
};
const checkpoints = (topic.checkpoints || []);
const quizItems = [...(topic.assessment || []), ...(topic.retrievalPractice || [])];

const vocab = (topic.vocabulary || []).map(v => `<div class="vrow"><b>${esc(v.term || v)}</b>${v.definition ? ` — ${esc(v.definition)}` : ''}</div>`).join('');
const trouble = (topic.troubleshooting || []).map(t => `
  <div class="trouble"><div class="tsc">⚠ ${esc(t.scenario || t.whatIsWrong || '')}</div>
    ${t.cause ? `<div class="tmeta"><b>Why:</b> ${esc(t.cause)}</div>` : ''}
    ${t.fix ? `<div class="note check"><b>Fix:</b> ${esc(t.fix)}</div>` : ''}
    ${t.prevention ? `<div class="tmeta"><b>Prevent:</b> ${esc(t.prevention)}</div>` : ''}</div>`).join('');
const tryItems = (topic.transferChallenges || []).slice(0, 1).map(t => `<li>${t.level ? `<span class="lvlbadge">${esc(t.level)}</span> ` : ''}${esc(t.prompt || t)}</li>`).join('');
const applyItems = (topic.suggestedActivities || topic.transferChallenges || []).slice(0, 2).map(x => `<li>${esc(typeof x === 'string' ? x : x.prompt)}</li>`).join('');
const reflectHtml = enContent.reflect.map((_, i) => `<li><span data-c="reflect-${i}">${esc(enContent.reflect[i])}</span><textarea class="refl" data-idx="${i}" data-k-ph="reflectPh" placeholder="Type your answer…"></textarea></li>`).join('');
const captions = topic.captions;
const transcript = Array.isArray(captions) ? captions.map(c => esc(c.text || c)).join(' ') : (typeof captions === 'string' ? esc(captions) : '');
const aiBadge = { HUMAN_FIRST: ['🔴 Human first', '#c0392b', '#fdecec'], AI_PARTNER: ['🟡 AI partner', '#8a6d1f', '#fbf3d6'], AI_CO_CREATE: ['🟢 AI co-create', '#1e7f4f', '#e5f6ef'] }[lab.aiStatus] || ['', '#555', '#eee'];
const evChip = (e) => ({ O: 'O · Observation', C: 'C · Conversation', P: 'P · Product' }[e] || e);
const iCanLis = enContent.iCan.map((s, i) => `<li data-c="iCan-${i}">${esc(s)}</li>`).join('');
const ideaLis = enContent.ideas.map((s, i) => `<li data-c="ideas-${i}">${esc(s)}</li>`).join('');

// flatten CONTENT into per-locale key->string map for the runtime swapper
const cmap = {};
for (const loc of LOCS) {
  const c = CONTENT[loc]; const m = { title: c.title, focus: c.focus, compTitle: c.compTitle, compCanDo: c.compCanDo, compL4: c.compL4 };
  (c.iCan || []).forEach((s, i) => m['iCan-' + i] = s);
  (c.ideas || []).forEach((s, i) => m['ideas-' + i] = s);
  (c.reflect || []).forEach((s, i) => m['reflect-' + i] = s);
  cmap[loc] = m;
}

const html = `<!DOCTYPE html><html lang="en" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(lab.title)} · ${esc(mod.module.course)}</title><style>
:root{--bg:#eef1f6;--card:#fff;--ink:#12161b;--muted:#5a6572;--line:#e2e7ee;--brand:#2f6df6;--brand-soft:#e9f1ff;--follow:#0e9f6e;--follow-soft:#e5f6ef;--try:#b45309;--try-soft:#fbefdd;--show:#7c3aed;--show-soft:#f0e8fe;--apply:#db2777;--ok:#0e9f6e;--bad:#dc2626;--chip:#eef1f6;--shadow:0 1px 2px rgba(20,30,50,.05),0 12px 34px rgba(20,30,50,.07)}
@media(prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#0e1116;--card:#161b22;--ink:#e8edf3;--muted:#9aa6b3;--line:#242c36;--brand:#6f9bff;--brand-soft:#16233c;--follow:#34d399;--follow-soft:#0e2a20;--try:#f5b06b;--try-soft:#2b2013;--show:#c4a1fb;--show-soft:#221737;--apply:#f472b6;--ok:#34d399;--bad:#f87171;--chip:#212934;--shadow:0 1px 2px rgba(0,0,0,.3),0 14px 40px rgba(0,0,0,.5)}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans Arabic",sans-serif}
[dir=rtl]{text-align:right}[dir=rtl] .path,[dir=rtl] kbd,[dir=rtl] .tstamp{direction:ltr;unicode-bidi:isolate}
.wrap{max-width:820px;margin:0 auto;padding:22px 20px 120px}
.card{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:26px 28px;margin:18px 0;box-shadow:var(--shadow)}
.langbar{position:sticky;top:0;z-index:20;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:10px 14px;margin-bottom:12px;display:flex;gap:8px;align-items:center;box-shadow:var(--shadow);flex-wrap:wrap}
.lbtn{border:1px solid var(--line);background:var(--bg);border-radius:999px;padding:6px 14px;font:inherit;font-size:14px;font-weight:700;cursor:pointer;color:var(--ink)}
.lbtn[aria-pressed=true]{background:var(--brand);color:#fff;border-color:var(--brand)}
.idwrap{margin-inline-start:auto;display:flex;gap:8px;align-items:center}
.idwrap input{font:inherit;font-size:15px;padding:8px 12px;border:1.5px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink);min-width:180px}
.tag{display:inline-flex;gap:5px;align-items:center;font-size:12px;font-weight:800;padding:4px 11px;border-radius:999px;text-transform:uppercase}
h1{font-size:34px;margin:.12em 0;line-height:1.12}h2{display:flex;gap:11px;align-items:center;font-size:15px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;margin:0 0 14px}h3{font-size:21px;margin:.15em 0}
.kicker{font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:4px}.lede{color:var(--muted);margin:.3em 0 0}
.phase{width:32px;height:32px;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:15px;font-weight:900;flex:0 0 32px}
.row{display:flex;gap:9px;flex-wrap:wrap;align-items:center}.pill{background:var(--chip);border-radius:999px;padding:5px 13px;font-size:14px;font-weight:600}
kbd{font-family:ui-monospace,Menlo,monospace;font-size:13px;background:var(--card);border:1px solid var(--line);border-bottom-width:2px;border-radius:6px;padding:2px 8px}
.path{font-family:ui-monospace,Menlo,monospace;font-size:14px;color:var(--muted);margin:4px 0}
ul{margin:.4em 0;padding-inline-start:1.3em}li{margin:.4em 0}
.scale{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:14px}.lvl{border:1px solid var(--line);border-radius:12px;padding:12px 13px;font-size:14px}.lvl b{display:block;font-size:12px;text-transform:uppercase;color:var(--muted);margin-bottom:3px}.lvl.here{border-color:var(--follow);background:var(--follow-soft)}.lvl.top{border-color:var(--try);background:var(--try-soft)}
.step{border-top:1px solid var(--line);padding:22px 0}.step:first-of-type{border-top:0}.head{display:flex;gap:14px;align-items:center;margin-bottom:6px}.num{flex:0 0 36px;height:36px;border-radius:10px;background:var(--follow);color:#fff;font-weight:900;font-size:17px;display:flex;align-items:center;justify-content:center}
.grid2{display:grid;grid-template-columns:230px 1fr;gap:20px;margin-top:8px}.shotwrap{align-self:start}.shot-img{width:100%;border:1px solid var(--line);border-radius:12px;display:block}.tstamp{font-size:12.5px;color:var(--muted);text-align:center;margin-top:5px;font-weight:700}.shot{border:1.5px dashed var(--line);border-radius:12px;min-height:120px;display:flex;align-items:center;justify-content:center;color:var(--muted);background:var(--bg)}
.watch{font:inherit;font-size:13px;font-weight:800;color:var(--brand);background:var(--brand-soft);border:0;border-radius:999px;padding:6px 12px;cursor:pointer}
.ministep{padding:9px 0}.mstitle{font-weight:800;font-size:17px}.mstext{margin:.25em 0;font-size:16px}
.note{border-radius:11px;padding:10px 14px;font-size:15.5px;margin-top:9px}.why{background:var(--follow-soft)}.why b{color:var(--follow)}.check{background:var(--brand-soft)}.check b{color:var(--brand)}
details{margin-top:8px;border:1px solid var(--line);border-radius:11px;padding:0 14px;background:var(--bg)}summary{cursor:pointer;font-weight:700;font-size:14.5px;padding:11px 0;color:var(--muted)}details[open]{padding-bottom:11px}
.evidence{display:inline-flex;gap:5px;font-size:12px;font-weight:800;color:var(--muted);border:1px dashed var(--line);border-radius:999px;padding:4px 10px}.scaffold{font-size:12px;font-weight:800;color:var(--try);background:var(--try-soft);border-radius:999px;padding:3px 9px}
.pending{background:var(--try-soft);color:var(--try);border-radius:10px;padding:9px 13px;font-size:14px;font-weight:700;margin:10px 0}
.quiz{border:1px solid var(--line);border-radius:14px;padding:16px 18px;margin:12px 0;background:var(--bg)}.qq{font-weight:800;font-size:17px;margin-bottom:11px}.opts{display:flex;flex-direction:column;gap:9px}
.opt{text-align:start;font:inherit;font-size:16px;padding:13px 15px;border:1.5px solid var(--line);border-radius:11px;background:var(--card);color:var(--ink);cursor:pointer}.opt:hover{border-color:var(--brand)}.opt.right{border-color:var(--ok);background:var(--follow-soft);font-weight:700}.opt.wrong{border-color:var(--bad);background:#fdecec}.opt[disabled]{cursor:default}.expl{margin-top:11px;font-size:15px;background:var(--brand-soft);border-radius:10px;padding:10px 13px}
.refl{width:100%;margin-top:7px;min-height:64px;font:inherit;font-size:15px;padding:10px 12px;border:1.5px solid var(--line);border-radius:10px;background:var(--card);color:var(--ink);resize:vertical}
.vrow{padding:6px 0;border-bottom:1px solid var(--line);font-size:16px}.vrow:last-child{border:0}
.trouble{padding:12px 0;border-top:1px solid var(--line)}.trouble:first-child{border:0}.tsc{font-weight:800;font-size:16.5px}.tmeta{font-size:14.5px;color:var(--muted);margin-top:4px}.lvlbadge{font-size:12px;font-weight:800;background:var(--try-soft);color:var(--try);border-radius:999px;padding:2px 9px}
.yt{position:relative;padding-top:56.25%;border-radius:12px;overflow:hidden;border:1px solid var(--line);margin-bottom:8px}.yt iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.dl{font:inherit;font-size:16px;font-weight:800;color:#fff;background:var(--brand);border:0;border-radius:12px;padding:13px 20px;cursor:pointer}.dl[disabled]{opacity:.5;cursor:not-allowed}
.foot{color:var(--muted);font-size:13.5px;margin-top:24px;line-height:1.8}
@media(max-width:620px){.grid2{grid-template-columns:1fr}.scale{grid-template-columns:1fr 1fr}h1{font-size:28px}.idwrap{width:100%}.idwrap input{flex:1}}
</style></head><body>
<div class="wrap">
  <div class="langbar">
    ${LOCS.map(l => `<button class="lbtn" data-l="${l}" aria-pressed="${l === 'en'}" onclick="setLang('${l}')">${esc(UI[l].name)}</button>`).join('')}
    <div class="idwrap"><input id="sid" placeholder="Your name or student ID" data-k-ph="yourId" oninput="save();gate()"></div>
  </div>

  <div class="card">
    <div class="row" style="justify-content:space-between"><div class="kicker">${esc(mod.module.course)} · ${esc(mod.module.title)} · ${esc(lab.id)}</div>
      <div class="row">${lab.rollsUpTo.map(id => `<span class="tag" style="background:var(--brand-soft);color:var(--brand)">${esc(id)}</span>`).join('')}<span class="tag" style="background:${aiBadge[2]};color:${aiBadge[1]}">${aiBadge[0]}</span></div></div>
    <h1 data-c="title">${esc(enContent.title)}</h1><p class="lede"><span data-c="focus">${esc(enContent.focus)}</span></p>
    ${primarySkill.canDo ? `<div class="note check" style="margin-top:16px;font-size:16px"><b><span data-k="competency">Competency assessed</span> — <span data-c="compTitle">${esc(enContent.compTitle)}</span>:</b> <span data-c="compCanDo">${esc(enContent.compCanDo)}</span></div>
    <div class="scale"><div class="lvl"><b data-k="l1">Beginning</b></div><div class="lvl"><b data-k="l2">Developing</b></div><div class="lvl here"><b data-k="l3">Independent</b> ★<div data-c="compCanDo">${esc(enContent.compCanDo)}</div></div><div class="lvl top"><b data-k="l4">Transfer</b><div data-c="compL4">${esc(enContent.compL4)}</div></div></div>` : ''}
  </div>

  ${youtube ? `<div class="card"><div class="yt"><iframe id="ytf" src="https://www.youtube.com/embed/${esc(youtube)}?enablejsapi=1&rel=0&cc_load_policy=1&playsinline=1" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe></div><p class="lede" style="font-size:14px">Closed captions ▸ auto-translate via the YouTube CC menu.</p></div>` : ''}

  <div class="card"><h2><span class="phase" style="background:#2563eb">👁</span> <span data-k="see">SEE</span></h2>
    ${iCanLis ? `<div class="kicker" data-k="ican">I can…</div><ul>${iCanLis}</ul>` : ''}
    ${ideaLis ? `<div class="kicker" style="margin-top:12px" data-k="ideas">Key ideas</div><ul>${ideaLis}</ul>` : ''}
    ${vocab ? `<div class="kicker" style="margin-top:12px" data-k="vocab">Vocabulary</div>${vocab}` : ''}
  </div>

  <div class="card"><h2><span class="phase" style="background:var(--follow)">✋</span> <span data-k="follow">FOLLOW</span> <span class="evidence" data-k="fromRec">from your recording</span></h2>
    ${followBanner}${followHtml}
  </div>

  ${checkpoints.length ? `<div class="card"><h2><span class="phase" style="background:#0891b2">⏱</span> <span data-k="checkpoints">Quick checkpoints</span></h2><p class="lede" data-k="cpLede"></p>${checkpoints.map(mc).join('')}</div>` : ''}

  <div class="card"><h2><span class="phase" style="background:var(--try)">🎯</span> <span data-k="apply" style="display:none"></span><span data-k="tryH">TRY</span> <span class="evidence">P</span> <span class="scaffold" data-k="scaffold"></span></h2>
    ${tryItems ? `<ul>${tryItems}</ul>` : '<p data-k="tryLede"></p>'}
    <div class="note check" data-k="submitTry"></div>
  </div>

  ${quizItems.length ? `<div class="card"><h2><span class="phase" style="background:#0891b2">🧠</span> <span data-k="check">CHECK</span></h2><p class="lede" data-k="tap"></p>${quizItems.map(mc).join('')}</div>` : ''}

  <div class="card"><h2><span class="phase" style="background:var(--show)">🎤</span> <span data-k="showReflect">SHOW & REFLECT</span> <span class="evidence">O / C</span> <span class="scaffold" data-k="scaffold"></span></h2>
    <div class="kicker" data-k="explain">Explain to your teacher…</div><ul>${reflectHtml}</ul>
    <div class="note" style="background:var(--show-soft)" data-k="teacherRecords"></div>
  </div>

  <div class="card"><h2><span class="phase" style="background:var(--apply)">🚀</span> <span data-k="apply">APPLY</span> <span class="evidence">P</span> <span class="scaffold" data-k="scaffold"></span></h2>
    ${applyItems ? `<ul>${applyItems}</ul>` : ''}
  </div>

  ${trouble ? `<div class="card"><h2><span class="phase" style="background:#64748b">🛠</span> <span data-k="breaks">When it breaks</span></h2><div class="pending" data-showif="noten" hidden><span data-k="pending"></span></div>${trouble}</div>` : ''}

  <div class="card"><h2><span class="phase" style="background:var(--brand)">📤</span> <span data-k="sends">Evidence</span></h2>
    <div class="row">${lab.rollsUpTo.map(id => `<span class="pill">skill: <b>${esc(id)}</b></span>`).join('')}${(lab.evidence || []).map(e => `<span class="pill">${evChip(e)}</span>`).join('')}</div>
    <div class="row" style="margin:12px 0;gap:16px">
      <label style="font-size:14px">How much help did you use?<br><select id="support" style="font:inherit;padding:8px 10px;border:1.5px solid var(--line);border-radius:9px;background:var(--bg);color:var(--ink);margin-top:4px"><option>None</option><option>Access supports only</option><option selected>Instructional hints</option><option>Modelled together</option></select></label>
      <label style="font-size:14px">Rate yourself 1–4 (optional)<br><select id="selfrating" style="font:inherit;padding:8px 10px;border:1.5px solid var(--line);border-radius:9px;background:var(--bg);color:var(--ink);margin-top:4px"><option value="">—</option><option>1</option><option>2</option><option>3</option><option>4</option></select></label>
    </div>
    <p class="lede" id="gatemsg" data-k="needId" style="margin:12px 0"></p>
    <button class="dl" id="dl" disabled onclick="download()" data-k="download">Download my evidence</button>
  </div>

  ${transcript ? `<div class="card"><details><summary data-k="transcript">Transcript</summary><p style="font-size:15px;color:var(--muted)">${transcript}</p></details></div>` : ''}

  <div class="card" style="background:var(--bg)"><p class="foot"><b>Provenance:</b> FOLLOW, checkpoints and quiz come from your recording. TRY/SHOW/APPLY are scaffolds — teacher reviews before release. Non-English content marked "in review" is machine-draft or English fallback. Generator make-lab · ${esc(pkg.lessonId || '')}.</p></div>
</div>
<script>
var UI=${j(UI)}, C=${j(cmap)}, COVERED=${j(covered)}, LESSON=${j({ lessonId: pkg.lessonId, labId: lab.id, labTitle: lab.title, course: mod.module.course, skills: lab.rollsUpTo, wburl })}, SKILLNEXT=${j(skillNext)};
var lang='en', KEY='sbwb:'+LESSON.lessonId;
function t(k){return (UI[lang]&&UI[lang][k])||UI.en[k]||k;}
function setLang(l){lang=l;var u=UI[l];document.documentElement.lang=l;document.documentElement.dir=u.dir;
  document.querySelectorAll('.lbtn').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.l===l);});
  document.querySelectorAll('[data-k]').forEach(function(e){e.textContent=t(e.dataset.k);});
  document.querySelectorAll('[data-k-ph]').forEach(function(e){e.setAttribute('placeholder',t(e.dataset.kPh));});
  document.querySelectorAll('[data-c]').forEach(function(e){var m=C[l]||{};e.textContent=(m[e.dataset.c]!=null?m[e.dataset.c]:C.en[e.dataset.c]);});
  document.querySelectorAll('[data-showif]').forEach(function(e){e.hidden=(l==='en')||COVERED[l];});
  save();
}
var ytPlayer;function onYouTubeIframeAPIReady(){try{ytPlayer=new YT.Player('ytf');}catch(e){}}
function seek(s){var f=document.getElementById('ytf');if(ytPlayer&&ytPlayer.seekTo){ytPlayer.seekTo(s,true);ytPlayer.playVideo();}else if(f){f.src='https://www.youtube.com/embed/'+${j(youtube || '')}+'?enablejsapi=1&rel=0&cc_load_policy=1&autoplay=1&start='+s;}if(f)window.scrollTo({top:f.getBoundingClientRect().top+window.scrollY-70,behavior:'smooth'});}
var answers={};
function pick(btn,qid){var box=document.getElementById(qid);box.querySelectorAll('.opt').forEach(function(o){o.disabled=true;if(o.dataset.c2==='1')o.classList.add('right');});if(btn.dataset.c2!=='1')btn.classList.add('wrong');var e=box.querySelector('.expl');if(e)e.hidden=false;answers[qid]={q:box.dataset.q,chosen:+btn.dataset.i,text:btn.textContent,correct:btn.dataset.c2==='1'};save();gate();}
function save(){try{localStorage.setItem(KEY,JSON.stringify({sid:(document.getElementById('sid')||{}).value||'',answers:answers,refl:refls(),lang:lang}));}catch(e){}}
function refls(){var o={};document.querySelectorAll('.refl').forEach(function(t){o[t.dataset.idx]=t.value;});return o;}
function gate(){var sid=(document.getElementById('sid')||{}).value||'';var nq=document.querySelectorAll('.quiz').length;var na=Object.keys(answers).length;var rok=true;document.querySelectorAll('.refl').forEach(function(t){if(!t.value.trim())rok=false;});var ok=sid.trim()&&na>=nq&&rok;document.getElementById('dl').disabled=!ok;}
function download(){
  var sid=document.getElementById('sid').value.trim();
  var date=new Date().toISOString().slice(0,10);
  var total=document.querySelectorAll('.quiz').length, correct=Object.values(answers).filter(function(a){return a.correct;}).length;
  var refl=[];document.querySelectorAll('.refl').forEach(function(t){if(t.value.trim())refl.push(t.value.trim());});
  var note=('Quiz '+correct+'/'+total+(refl[0]?(' — '+refl[0]):'')).slice(0,600)||('Completed '+LESSON.labId);
  var support=(document.getElementById('support')||{}).value||'None';
  var srv=(document.getElementById('selfrating')||{}).value; var selfRating=srv?parseInt(srv,10):null;
  var learned=refl[refl.length-1];
  var claims=LESSON.skills.map(function(skill){
    var c={ id:(sid+'-'+LESSON.lessonId+'-'+skill+'-'+date).replace(/[^A-Za-z0-9._-]+/g,'-'),
      student:sid, course:LESSON.course, skill:skill, date:date,
      attempt:('Lab: '+(LESSON.labTitle||LESSON.labId)),
      artifact:(LESSON.wburl||('Workbook '+LESSON.labId)),
      note:note, next:(SKILLNEXT[skill]||'Apply this skill in the next project.'),
      support:support, selfRating:selfRating };
    if(learned)c.learned=learned;
    return c;
  });
  var payload={app:'evidence-map-student-passport',schema:1,claims:claims};
  var blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='passport_'+sid.replace(/[^a-z0-9]+/gi,'-')+'_'+LESSON.lessonId+'.json';a.click();
}
(function(){try{var s=JSON.parse(localStorage.getItem(KEY)||'{}');if(s.sid)document.getElementById('sid').value=s.sid;if(s.refl)document.querySelectorAll('.refl').forEach(function(t){if(s.refl[t.dataset.idx])t.value=s.refl[t.dataset.idx];});}catch(e){}
document.querySelectorAll('.refl').forEach(function(t){t.addEventListener('input',function(){save();gate();});});
setLang('en');gate();})();
</script>${youtube ? '\n<script src="https://www.youtube.com/iframe_api"></script>' : ''}</body></html>`;

const out = arg('out', join(companionDir, `workbook.lab.${lab.id}.html`));
writeFileSync(out, html);
console.log(`✓ ${out}`);
console.log(`  ${lab.id} · ${lab.rollsUpTo.join('+')} · ${groups.length} groups · ${Object.keys(shots).length} frames · quiz:${quizItems.length} · langs: en${['es', 'fr', 'ar'].filter(l => covered[l]).map(l => ' ' + l + '✓').join('')}${['es', 'fr', 'ar'].filter(l => !covered[l]).map(l => ' ' + l + '(ui-only)').join('')} · youtube:${youtube ? 'yes' : 'no'} · transcript:${transcript ? 'yes' : 'no'}`);
