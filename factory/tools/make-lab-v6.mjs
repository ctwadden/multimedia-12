#!/usr/bin/env node
/**
 * make-lab-v6.mjs — Phase 1: render a companion package in the Learning Studio
 * "Drop Day" v6 standard (restrained studio palette, START HERE panel, production
 * brief, staged step-cards with SELECT-FIRST / ACTIONS / WHY-CHECK-FIX / figure /
 * done, comparison + assessment panels). Deterministic; no Gemini.
 *
 *   node tools/make-lab-v6.mjs --companion "<dir>" --module mm12-photoshop-module.json \
 *     --lab MM12-PS-LAB-08 [--youtube <id>] [--wburl <url>] [--collector <url>] [--out file.html]
 *
 * STATUS: DRAFT / FORMAT MIGRATED. Stage-level tagging only (data-skill-ids +
 * data-outcome-codes from the module/skills). Per-step PS-/GD- skill IDs, evidence
 * IDs, asset URLs, Coach + assessment launcher are TODO placeholders until supplied.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const arg = (n, d = null) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const load = (p) => JSON.parse(readFileSync(p, 'utf8'));

const dir = arg('companion'); if (!dir) { console.error('need --companion'); process.exit(1); }
const mod = load(arg('module', 'mm12-photoshop-module.json'));
const skills = load(arg('skills', 'mm12-skills.json'));
const lab = (mod.labs || []).find(l => l.id === arg('lab')); if (!lab) { console.error('lab not found'); process.exit(1); }
const youtube = arg('youtube', ''); const wburl = arg('wburl', ''); const collector = arg('collector', '');
const pkg = load(join(dir, 'lesson.json'));
const t = (pkg.topics && pkg.topics[0]) || {};
const stepsById = new Map();
for (const ch of (t.chapters || [])) for (const s of (ch.steps || [])) stepsById.set(s.id, s);
const shots = t.screenshots || {};
const groups = t.displayGroups || pkg.displayGroups || [];

// canonical tags (stage level): skill IDs + outcome codes from the module/skills
const courseCode = (lab.id.split('-')[0] || 'MM12').toUpperCase(); // MM12 / COM11 / IBDS / CP12
const skillIds = lab.rollsUpTo;
const outcomeCodes = [...new Set(skillIds.flatMap(id => (skills.skills[id] || {}).outcomeLinks || []))].map(c => `${courseCode}-${c}`);
const dataAttrs = `data-project-id="TODO_PROJECT_ID" data-skill-ids="${esc(skillIds.join(';'))}" data-outcome-codes="${esc(outcomeCodes.join(';'))}" data-evidence-ids="TODO_EVIDENCE_IDS"`;

const mmss = (sec) => sec == null ? '' : `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(Math.round(sec % 60)).padStart(2, '0')}`;
const shotFor = (g) => { for (const id of [g.primaryStepId, g.secondaryStepId, ...(g.stepIds || [])]) if (id && shots[id]) return shots[id]; return null; };

// ----- step cards (one per display group) -----
let n = 0;
const stepCards = groups.map(g => {
  n++;
  const gsteps = (g.stepIds || []).map(id => stepsById.get(id)).filter(Boolean);
  const first = gsteps[0] || {};
  const routes = [...new Set(gsteps.flatMap(s => (s.menuPath || []).length ? [s.menuPath.join(' > ')] : []))];
  const shortcuts = [...new Set(gsteps.flatMap(s => s.keyboardShortcuts || []))];
  const startSec = first.start != null ? Math.max(0, Math.floor(first.start)) : null;
  const uri = shotFor(g);
  const fix = gsteps.map(s => s.commonMistake).find(Boolean);
  const actions = gsteps.map(s => {
    const bits = [];
    if (s.menuPath && s.menuPath.length) bits.push(`<span class="route">${s.menuPath.map(esc).join(' &gt; ')}</span>`);
    if ((s.keyboardShortcuts || []).length) bits.push(`<span class="kbd">${s.keyboardShortcuts.map(esc).join(' ')}</span>`);
    if ((s.settings || []).length) bits.push(`settings: ${esc(s.settings.join(', '))}`);
    return `<li>${esc(s.description || s.title)}${bits.length ? ' <span class="meta">' + bits.join(' · ') + '</span>' : ''}</li>`;
  }).join('');
  return `
  <article class="step" id="step-${n}" data-project-step-id="TODO_STEP_ID" ${dataAttrs}>
    <div class="stephead"><span class="stepnum">${String(n).padStart(2, '0')}</span><h3>${esc(g.title || 'Step')}</h3></div>
    <div class="target"><strong>DOCUMENT:</strong> TODO_DOCUMENT<br><strong>SELECT:</strong> ${esc(first.title || 'the working layer')}<br><strong>TOOLS / ROUTE:</strong> ${routes.length ? routes.map(esc).join('; ') : 'see actions'}${shortcuts.length ? ' · <span class="kbd">' + shortcuts.map(esc).join(' ') + '</span>' : ''}</div>
    <ol class="actions">${actions}</ol>
    ${uri ? `<figure><img src="${uri}" alt="Real frame — ${esc(g.title || '')}">${startSec != null && youtube ? `<figcaption><button class="linklike" onclick="seek(${startSec})">▶ watch this step @ ${mmss(startSec)}</button></figcaption>` : startSec != null ? `<figcaption>demo @ ${mmss(startSec)}</figcaption>` : ''}</figure>` : ''}
    <div class="wcf">
      <div><strong>Why</strong> <span class="todo">TODO — from teacher narration (why this action matters).</span></div>
      ${g.successCheck ? `<div><strong>Check</strong> ${esc(g.successCheck)}</div>` : ''}
      ${fix ? `<div><strong>Fix</strong> ${esc(fix)}</div>` : ''}
    </div>
    <label class="done"><input type="checkbox" onchange="save()"> Done</label>
  </article>`;
}).join('');

const bullets = (a) => (a || []).map(x => `<li>${esc(typeof x === 'string' ? x : (x.prompt || x.question || x.text || ''))}</li>`).join('');
const vocab = (t.vocabulary || []).map(v => `<details><summary>${esc(v.term || v)}</summary>${v.definition ? esc(v.definition) : ''}</details>`).join('');
const trouble = (t.troubleshooting || []).map(x => `<li><strong>${esc(x.scenario || x.whatIsWrong || '')}</strong> → ${esc(x.cause || '')} → <em>${esc(x.fix || '')}</em></li>`).join('');
const quiz = [...(t.assessment || []), ...(t.retrievalPractice || [])].map((q, i) => {
  const id = 'q' + i;
  const opts = (q.options || []).map((o, oi) => `<button class="opt" onclick="pick(this,${oi === q.correctAnswerIndex ? 1 : 0})">${esc(o)}</button>`).join('');
  return `<div class="q"><p class="qq">${esc(q.question)}</p><div class="opts">${opts}</div>${q.explanation ? `<p class="expl" hidden>${esc(q.explanation)}</p>` : ''}</div>`;
}).join('');
const reflect = bullets((t.teachBackPrompts || []).slice(0, 3));
const transfer = (t.transferChallenges || []).slice(0, 1).map(x => esc(x.prompt || x)).join('') || 'Apply the technique to a changed condition your teacher specifies.';

const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(pkg.lessonTitle || t.title || lab.title)} — Student Tutorial</title><style>
:root{--ink:#102f37;--muted:#48656a;--green:#087a73;--mint:#c9e8df;--paper:#edf3f0;--edge:#cbdcd6;--card:#fff}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.55 Arial,Helvetica,sans-serif}
.wrap{max-width:920px;margin:0 auto;padding:0 18px 90px}
header{background:var(--ink);color:#eaf5f1;padding:34px 22px;border-radius:0 0 14px 14px}
header .eyebrow{color:var(--mint);font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
header h1{margin:.15em 0 .1em;font-size:34px;letter-spacing:.01em}
header p{margin:.3em 0 0;color:#cfe7df;max-width:64ch}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.chip{background:#0b3b43;color:#d6ede7;border:1px solid #1b535b;border-radius:999px;padding:4px 11px;font-size:12.5px}
.status{background:#7a4d08;color:#ffe9c7;font-size:12px;font-weight:700;letter-spacing:.04em;padding:7px 14px;text-align:center}
.panel{background:var(--card);border:1px solid var(--edge);border-radius:12px;padding:20px 22px;margin:16px 0}
.panel h2{margin:0 0 10px;font-size:18px;color:var(--green);border-bottom:2px solid var(--mint);padding-bottom:8px}
.ls-panel{background:#e6f2ee;border:1px solid var(--edge)}
.ls-row{display:flex;flex-wrap:wrap;gap:10px;margin:8px 0}
.button{display:inline-block;background:var(--green);color:#fff;text-decoration:none;border:0;border-radius:8px;padding:9px 15px;font-weight:700;font-size:14px;cursor:pointer}
.button.secondary{background:#fff;color:var(--green);border:1.5px solid var(--green)}
.todo{color:#a15b00;background:#fdf0dc;border-radius:5px;padding:1px 6px;font-size:.9em;font-weight:700}
.stage-title{font-size:20px;color:var(--ink);margin:26px 0 6px;border-left:5px solid var(--green);padding-left:12px}
.step{background:var(--card);border:1px solid var(--edge);border-radius:12px;padding:18px 20px;margin:14px 0}
.stephead{display:flex;align-items:center;gap:12px}.stepnum{background:var(--green);color:#fff;font-weight:800;border-radius:8px;padding:5px 10px;font-size:14px}
.stephead h3{margin:0;font-size:18px}
.target{background:var(--paper);border:1px solid var(--edge);border-radius:8px;padding:10px 12px;margin:10px 0;font-size:14px}
.actions{margin:8px 0;padding-left:22px}.actions li{margin:.4em 0}
.route{font-family:ui-monospace,Menlo,monospace;font-size:13px;color:var(--green)}.kbd{font-family:ui-monospace,Menlo,monospace;font-size:12px;background:var(--paper);border:1px solid var(--edge);border-radius:5px;padding:1px 6px}.meta{color:var(--muted);font-size:13px}
figure{margin:10px 0}figure img{max-width:100%;border:1px solid var(--edge);border-radius:8px;display:block}figcaption{font-size:13px;color:var(--muted);margin-top:5px}
.linklike{background:none;border:0;color:var(--green);font-weight:700;cursor:pointer;padding:0;font-size:13px}
.wcf{display:grid;gap:8px;margin:10px 0}.wcf>div{background:var(--paper);border-left:3px solid var(--green);border-radius:0 8px 8px 0;padding:8px 12px;font-size:14.5px}.wcf strong{color:var(--green);margin-right:6px}
.done{display:inline-flex;gap:7px;align-items:center;font-size:14px;color:var(--muted);margin-top:6px}
.yt{position:relative;padding-top:56.25%;border-radius:10px;overflow:hidden;border:1px solid var(--edge)}.yt iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.opts{display:flex;flex-direction:column;gap:7px;margin:8px 0}.opt{text-align:left;font:inherit;font-size:15px;padding:11px 13px;border:1.5px solid var(--edge);border-radius:8px;background:#fff;cursor:pointer}.opt.ok{border-color:var(--green);background:var(--mint)}.opt.no{border-color:#c0392b;background:#fbe9e7}.expl{background:var(--mint);border-radius:7px;padding:9px 12px;font-size:14px}
details{background:var(--paper);border:1px solid var(--edge);border-radius:8px;padding:0 12px;margin:6px 0}summary{cursor:pointer;font-weight:700;padding:9px 0;color:var(--green)}
@media print{header{background:#fff;color:#000;border:1px solid #999}.button,.yt,.no-print{display:none!important}.expl{display:block!important}}
</style></head><body>
<div class="status">STATUS: DRAFT / FORMAT MIGRATED — verify Photoshop workflow, assets, links, assessment and teacher review before classroom use.</div>
<header>
  <div class="wrap" style="padding:0">
    <div class="eyebrow">${esc(mod.module.course)} · ${esc(mod.module.title)} · Learning Studio</div>
    <h1>${esc(pkg.lessonTitle || t.title || lab.title)}</h1>
    <p>${esc(lab.focus || '')}</p>
    <div class="chips"><span class="chip">${esc(courseCode)}</span><span class="chip">Photoshop</span><span class="chip">${groups.length} stages</span>${skillIds.map(s => `<span class="chip">${esc(s)}</span>`).join('')}</div>
  </div>
</header>
<div class="wrap">
  <section class="panel ls-panel no-print"><h2>Start here: files, support and evidence</h2>
    <div class="ls-row"><a class="button" href="TODO_STUDENT_FILES">⬇ Download student files (TODO)</a><a class="button secondary" href="TODO_FINISHED_EXAMPLE">View finished example (TODO)</a>${youtube ? `<a class="button secondary" href="https://youtu.be/${esc(youtube)}" target="_blank">Open video ↗</a>` : ''}<a class="button secondary" href="TODO_COACH_URL">Open Assistant Coach ↗ (TODO)</a></div>
    <p style="font-size:14px;color:var(--muted)">Builds on: <span class="todo">TODO</span> · New learning: ${esc(lab.focus || 'TODO')} · Prepares for: <span class="todo">TODO</span></p>
  </section>

  <section class="panel"><h2>Your production brief</h2>
    <p>${esc(mod.module.bigIdea || 'Complete the build described below, keeping every layer editable.')}</p>
    ${(t.iCanStatements || []).length ? `<h3 style="font-size:15px;margin:.6em 0 .2em">What you will learn</h3><ul>${bullets(t.iCanStatements)}</ul>` : ''}
  </section>

  <section class="panel"><h2>Before you begin</h2>
    <ul><li>Open the student files and <strong>Save As</strong> a working <code>.psd</code> named <code>Lastname_${esc(lab.id)}.psd</code>.</li><li>Keep the original source untouched; work non-destructively (masks and adjustment layers, not erasing).</li><li>Open Window &gt; Layers and Window &gt; Properties.</li></ul>
  </section>

  ${youtube ? `<section class="panel no-print"><div class="yt"><iframe id="ytf" src="https://www.youtube.com/embed/${esc(youtube)}?enablejsapi=1&rel=0&cc_load_policy=1" allow="autoplay;encrypted-media" allowfullscreen></iframe></div></section>` : ''}

  <h2 class="stage-title">Workflow — follow, check, repair</h2>
  ${stepCards}

  <section class="panel comparison"><h2>Independent transfer — the brief has changed</h2>
    <p>${esc(transfer)}</p>
    <p style="font-size:14px;color:var(--muted)">Determine the new result, revise your work, keep it editable, and explain <strong>one</strong> decision. Do this without copying the demonstration.</p>
  </section>

  <section class="panel assessment"><h2>Practice knowledge check</h2>
    <p style="font-size:14px;color:var(--muted)">Practice only — not a grade. Official Knowledge + Reflection launches through the Learning Studio assessment button (<span class="todo">TODO launcher</span>).</p>
    ${quiz || '<p>No practice questions in this package.</p>'}
    ${reflect ? `<h3 style="font-size:15px;margin:1em 0 .2em">Reflect (explain to your teacher)</h3><ul>${reflect}</ul>` : ''}
  </section>

  ${vocab ? `<section class="panel"><h2>Vocabulary</h2>${vocab}</section>` : ''}
  ${trouble ? `<section class="panel"><h2>Something went wrong — symptom → cause → fix</h2><ul>${trouble}</ul></section>` : ''}

  <section class="panel"><h2>Submission</h2><p>Save your layered <code>.psd</code> and export a viewing copy. Submit both. Keep every layer editable.</p></section>

  <p style="font-size:12px;color:var(--muted)">Generator: make-lab-v6 · ${esc(pkg.lessonId || '')} · stage-level tags only. Canonical still required: PS-/GD- skill IDs, evidence IDs, student-file + finished-example URLs, Coach URL, assessment launcher, per-step Why &amp; DOCUMENT.</p>
</div>
<script>
function seek(s){var f=document.getElementById('ytf');if(f)f.src='https://www.youtube.com/embed/${esc(youtube)}?enablejsapi=1&rel=0&cc_load_policy=1&autoplay=1&start='+s;window.scrollTo({top:f.getBoundingClientRect().top+scrollY-60,behavior:'smooth'});}
function pick(b,ok){var box=b.closest('.q');box.querySelectorAll('.opt').forEach(function(o){o.disabled=true;});b.classList.add(ok?'ok':'no');var e=box.querySelector('.expl');if(e)e.hidden=false;}
function save(){try{var d={};document.querySelectorAll('.done input').forEach(function(c,i){d[i]=c.checked;});localStorage.setItem('v6:${esc(pkg.lessonId||'')}',JSON.stringify(d));}catch(e){}}
(function(){try{var d=JSON.parse(localStorage.getItem('v6:${esc(pkg.lessonId||'')}')||'{}');document.querySelectorAll('.done input').forEach(function(c,i){if(d[i])c.checked=true;});}catch(e){}})();
</script></body></html>`;

const out = arg('out', join(dir, `workbook.v6.${lab.id}.html`));
writeFileSync(out, html);
console.log(`✓ ${out}`);
console.log(`  v6 · ${lab.id} · ${groups.length} step-cards · skills ${skillIds.join('+')} · outcomes ${outcomeCodes.join(';')} · youtube ${youtube ? 'yes' : 'no'}`);
