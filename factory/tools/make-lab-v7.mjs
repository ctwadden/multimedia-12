#!/usr/bin/env node
/**
 * make-lab-v7.mjs — "Supported Studio" hybrid: renders a companion package in the
 * accessible, chapter-based framework from Chad's Google-Docs-safe supported workbook
 * (HOW TO USE → VIDEO CHAPTERS → per-chapter WHAT ARE WE DOING / STEP + WHY + LOOK FOR
 * / STOP & CHECK → SAY IT OUT LOUD → FINAL CHECK → IF SOMETHING LOOKS WRONG → SAVE →
 * SHORT EVIDENCE → SUPPORT LADDER), with restrained studio styling and v6 skill tags.
 * Deterministic; no Gemini.
 *
 *   node tools/make-lab-v7.mjs --companion "<dir>" --module mm12-photoshop-module.json \
 *     --lab MM12-PS-LAB-08 [--youtube <id>] [--wburl <url>] [--collector <url>] [--out file.html]
 *
 * "WHY" lines are craft rationales matched to the detected action; where no rationale
 * matches, the WHY line is omitted rather than invented. Per-step DOCUMENT and richer
 * WHY narration remain a canonical gap until pulled from the teacher's narration.
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

const courseCode = (lab.id.split('-')[0] || 'MM12').toUpperCase();
const skillIds = lab.rollsUpTo;
const outcomeCodes = [...new Set(skillIds.flatMap(id => (skills.skills[id] || {}).outcomeLinks || []))].map(c => `${courseCode}-${c}`);
const dataAttrs = `data-skill-ids="${esc(skillIds.join(';'))}" data-outcome-codes="${esc(outcomeCodes.join(';'))}"`;

const mmss = (sec) => sec == null ? '' : `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(Math.round(sec % 60)).padStart(2, '0')}`;
const shotFor = (g) => { for (const id of [g.primaryStepId, g.secondaryStepId, ...(g.stepIds || [])]) if (id && shots[id]) return shots[id]; return null; };

// Craft-rationale map: matched against the step text. Correct, deliberately generic;
// where nothing matches, the WHY line is left out (never invented).
const WHY = [
  [/adjustment layer/, 'so you can change or undo the effect later without damaging the original photo.'],
  [/layer mask|\bmask\b|masking/, 'the mask controls where the effect shows — black hides, white reveals — so nothing is erased for good.'],
  [/paste into/, 'it drops the new image inside your selection, so it only shows where it belongs.'],
  [/clone stamp|healing|spot heal/, 'you copy good pixels over the problem area to remove or repair it cleanly.'],
  [/sponge/, 'to strengthen or reduce colour in just one spot, not the whole image.'],
  [/hue\/?saturation|hue|saturation/, "to change a colour's family or strength on an editable layer."],
  [/curves|levels|brightness|contrast/, 'to control tone and contrast without repainting.'],
  [/colou?r balance/, 'to shift the overall colour cast in a controlled, editable way.'],
  [/free transform|transform|resize|scale|\bctrl\+t\b|\bcmd\+t\b|warp/, 'so the layer fits the scene at the right size, shape and position.'],
  [/feather|soft brush|smooth|refine edge|select and mask/, 'so the edge blends and the edit looks believable.'],
  [/smart object|non-?destructive/, 'so the original stays fully editable.'],
  [/new layer|duplicate layer/, 'so this part can be moved, masked or corrected later on its own.'],
  [/\bgroup\b/, 'to keep related layers organised and mask or adjust them together.'],
  [/export|save as|\.png|\.jpg|\.jpeg|flatten/, 'to keep an editable master (PSD) and a separate shareable flat copy.'],
  [/select|selection|marquee|lasso|\bpen tool\b|quick selection|magic wand|object selection/, 'the selection tells Photoshop which area to work on and protects the rest.'],
  [/opacity|flow|fill\b/, 'to control how strong the effect is.'],
  [/\bbrush\b|paint/, 'so you can apply the effect exactly where you want it.'],
];
const whyFor = (txt) => { const s = (txt || '').toLowerCase(); for (const [re, why] of WHY) if (re.test(s)) return why; return null; };

// ----- chapters (one per display group) -----
let n = 0;
const chapters = groups.map(g => {
  n++;
  const gsteps = (g.stepIds || []).map(id => stepsById.get(id)).filter(Boolean);
  const first = gsteps[0] || {};
  const startSec = first.start != null ? Math.max(0, Math.floor(first.start)) : null;
  const uri = shotFor(g);
  const steps = gsteps.map((s, i) => {
    const route = (s.menuPath || []).length ? ` <span class="route">${s.menuPath.map(esc).join(' &gt; ')}</span>` : '';
    const keys = (s.keyboardShortcuts || []).length ? ` <span class="kbd">${s.keyboardShortcuts.map(esc).join(' ')}</span>` : '';
    const why = whyFor(`${s.title} ${s.description} ${(s.menuPath || []).join(' ')} ${(s.settings || []).join(' ')}`);
    return `<div class="pstep">
      <p class="stepline"><strong>STEP ${i + 1} —</strong> ${esc(s.description || s.title)}${route}${keys}</p>
      ${why ? `<p class="why"><span>WHY:</span> ${esc(why)}</p>` : ''}
      ${s.successCheck ? `<p class="look"><span>LOOK FOR:</span> ${esc(s.successCheck)}</p>` : ''}
      ${s.commonMistake ? `<p class="watch"><span>WATCH OUT:</span> ${esc(s.commonMistake)}</p>` : ''}
    </div>`;
  }).join('');
  const tb = t.teachBackPrompts || [];
  const say = tb.length ? tb[(n - 1) % tb.length]
    : `Point to your screen and explain, in one sentence, what you did in this chapter and why.`;
  return `
  <section class="chapter" id="ch-${n}" ${dataAttrs}>
    <h2><span class="chnum">CHAPTER ${n}</span> ${esc(g.title || 'Step')}</h2>
    ${startSec != null ? `<p class="chapter-start">▶ Chapter ${n} starts at ${mmss(startSec)}${youtube ? ` — <button class="linklike" onclick="seek(${startSec})">open the video here</button>` : ''}</p>` : ''}
    ${g.successCheck ? `<p class="checkpoint"><strong>Checkpoint:</strong> ${esc(g.successCheck)}</p>` : ''}
    ${uri ? `<figure><img src="${uri}" alt="Checkpoint — ${esc(g.title || '')}"><figcaption>Compare your screen with this.</figcaption></figure>` : ''}
    <div class="steps">${steps}</div>
    ${say ? `<p class="sayit"><strong>SAY IT OUT LOUD</strong> — ${esc(say.prompt || say)}</p>` : ''}
    <div class="stopcheck"><strong>STOP &amp; CHECK</strong>
      <label><input type="checkbox" onchange="save()"> ${g.successCheck ? esc(g.successCheck) : 'This chapter looks like the checkpoint image.'}</label>
      <label><input type="checkbox" onchange="save()"> My original Background layer is still there.</label>
      <label><input type="checkbox" onchange="save()"> I can explain what I just did.</label>
    </div>
  </section>`;
}).join('');

const chapterIndex = groups.map((g, i) => {
  const gsteps = (g.stepIds || []).map(id => stepsById.get(id)).filter(Boolean);
  const s0 = gsteps[0]; const sec = s0 && s0.start != null ? Math.max(0, Math.floor(s0.start)) : null;
  return `<li><a href="#ch-${i + 1}">${sec != null ? `<span class="ts">${mmss(sec)}</span> ` : ''}Chapter ${i + 1} — ${esc(g.title || '')}</a></li>`;
}).join('');

const shortEvidence = [...(t.teachBackPrompts || []), ...(t.assessment || []).map(q => q.question)]
  .filter(Boolean).slice(0, 4)
  .map(q => `<div class="evq"><p>${esc(typeof q === 'string' ? q : (q.prompt || q.question))}</p>
    <label><input type="checkbox" onchange="save()"> Explained aloud to the teacher</label>
    <label><input type="checkbox" onchange="save()"> Wrote a short answer</label></div>`).join('');

const rate = skillIds.map(id => {
  const sk = skills.skills[id] || {};
  return `<div class="raterow"><label>${esc(sk.canDo || sk.name || id)}</label>
    <select class="srate" data-skill="${esc(id)}"><option value="">—</option><option value="1">1 Beginning</option><option value="2">2 Developing</option><option value="3">3 Independent</option><option value="4">4 Transfer</option></select></div>`;
}).join('');

const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(pkg.lessonTitle || t.title || lab.title)} — Supported Workbook</title><style>
:root{--ink:#12333b;--muted:#4d6a70;--green:#0a7f77;--mint:#d3ece6;--paper:#f2f6f4;--edge:#cddbd6;--card:#fff;--warn:#a15b00;--warnbg:#fdf0dc}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:17px/1.6 -apple-system,'Inter',Arial,Helvetica,sans-serif}
.wrap{max-width:800px;margin:0 auto;padding:0 20px 100px}
header{background:var(--ink);color:#eafaf5;padding:38px 24px;border-radius:0 0 16px 16px;text-align:center}
header .eyebrow{color:var(--mint);font-size:13px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}
header h1{margin:.2em 0 .1em;font-size:30px;line-height:1.2}
header .sub{color:#c6e6de;font-size:15px}
.chips{display:flex;flex-wrap:wrap;gap:7px;justify-content:center;margin-top:14px}
.chip{background:#0c4048;color:#dcefe9;border:1px solid #1c5860;border-radius:999px;padding:3px 11px;font-size:12px}
h2{font-size:22px;margin:0 0 .4em}
.panel{background:var(--card);border:1px solid var(--edge);border-radius:14px;padding:22px 24px;margin:18px 0}
.panel.tinted{background:var(--mint);border-color:#bcded4}
.panel h2{color:var(--green);font-size:18px;letter-spacing:.02em;text-transform:uppercase;border-bottom:2px solid var(--mint);padding-bottom:8px}
ol.howto{margin:.4em 0;padding-left:1.3em}ol.howto li{margin:.3em 0}
.helpframe{background:var(--paper);border-left:4px solid var(--green);border-radius:0 8px 8px 0;padding:10px 14px;font-style:italic;margin:.6em 0}
ul.chapters{list-style:none;margin:0;padding:0}ul.chapters li{border-bottom:1px solid var(--edge)}ul.chapters li:last-child{border:0}
ul.chapters a{display:block;padding:11px 4px;color:var(--ink);text-decoration:none;font-weight:600}ul.chapters a:hover{color:var(--green)}
.ts{display:inline-block;min-width:52px;color:var(--green);font-variant-numeric:tabular-nums;font-weight:800}
.important{background:var(--warnbg);color:var(--warn);border-radius:10px;padding:12px 16px;font-weight:700;margin:16px 0}
.chapter{background:var(--card);border:1px solid var(--edge);border-radius:14px;padding:24px;margin:20px 0}
.chapter h2{color:var(--ink);text-transform:none;border:0;font-size:23px}
.chnum{display:inline-block;background:var(--green);color:#fff;font-size:12px;font-weight:800;letter-spacing:.08em;padding:3px 9px;border-radius:6px;vertical-align:middle;margin-right:8px}
.chapter-start{margin:.2em 0 1em;font-weight:700;color:var(--green)}
.checkpoint{background:var(--paper);border-radius:8px;padding:9px 13px;margin:.4em 0}
figure{margin:14px 0}figure img{max-width:100%;border:1px solid var(--edge);border-radius:10px;display:block}figcaption{font-size:13px;color:var(--muted);margin-top:6px;text-align:center}
.pstep{padding:12px 0;border-bottom:1px dashed var(--edge)}.pstep:last-child{border:0}
.stepline{margin:.1em 0}.route{font-family:ui-monospace,Menlo,monospace;font-size:14px;color:var(--green)}.kbd{font-family:ui-monospace,Menlo,monospace;font-size:12.5px;background:var(--paper);border:1px solid var(--edge);border-radius:5px;padding:1px 6px}
.why,.look,.watch{margin:.25em 0 .1em;font-size:15.5px;padding-left:14px}
.why span,.look span,.watch span{font-weight:800;letter-spacing:.03em}
.why{color:var(--muted)}.why span{color:var(--green)}
.look span{color:#0a6b45}.watch{color:#8a3b12}.watch span{color:#8a3b12}
.sayit{background:var(--mint);border-radius:8px;padding:11px 14px;margin:14px 0}
.stopcheck{background:var(--paper);border:1px dashed var(--green);border-radius:10px;padding:12px 15px;margin-top:12px}
.stopcheck label,.evq label,.checklist label{display:flex;gap:9px;align-items:flex-start;margin:.4em 0;font-size:15.5px;cursor:pointer}
.stopcheck strong{display:block;color:var(--green);margin-bottom:6px}
.checklist label input,.stopcheck label input,.evq label input{margin-top:4px}
.evq{border-top:1px solid var(--edge);padding:10px 0}.evq p{font-weight:600;margin:.2em 0}
.raterow{display:flex;justify-content:space-between;gap:12px;align-items:center;border-bottom:1px solid var(--edge);padding:8px 0}.raterow label{font-size:15px}.srate{font:inherit;padding:5px}
.yt{position:relative;padding-top:56.25%;border-radius:12px;overflow:hidden;border:1px solid var(--edge);margin:8px 0}.yt iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.linklike{background:none;border:0;color:var(--green);font-weight:800;cursor:pointer;padding:0;font:inherit;text-decoration:underline}
.button{display:inline-block;background:var(--green);color:#fff;border:0;border-radius:9px;padding:11px 18px;font:inherit;font-weight:700;cursor:pointer;text-decoration:none}
.blank{border-bottom:1.5px solid var(--muted);display:inline-block;min-width:220px}
.status{background:var(--warnbg);color:var(--warn);font-size:12px;font-weight:800;letter-spacing:.03em;padding:8px 14px;text-align:center}
@media print{header{background:#fff;color:#000;border:1px solid #999}.button,.yt,.no-print,.linklike{display:none!important}.chapter,.panel{break-inside:avoid}}
</style></head><body>
<div class="status">STATUS: DRAFT / SUPPORTED FORMAT — check the Photoshop workflow, images and links before classroom use.</div>
<header>
  <div class="eyebrow">${esc(courseCode)} · ${esc(mod.module.title)}</div>
  <h1>${esc(pkg.lessonTitle || t.title || lab.title)}</h1>
  <div class="sub">${esc(lab.focus || 'Follow one chapter at a time. Watch, do, check.')}</div>
  <div class="chips"><span class="chip">${groups.length} chapters</span>${skillIds.map(s => `<span class="chip">${esc(s)}</span>`).join('')}</div>
</header>
<div class="wrap">

  <section class="panel"><h2>How to use this workbook</h2>
    <ol class="howto">
      <li>Click the chapter link and watch <strong>only</strong> that short section.</li>
      <li>Pause the video.</li>
      <li>Do the matching Photoshop steps below.</li>
      <li>Compare your screen with the checkpoint image.</li>
      <li>Tick the boxes before moving to the next chapter.</li>
      <li>Watch one chapter at a time — don't try to remember the whole video.</li>
    </ol>
    <div class="helpframe">When you need help, say: "I am on Chapter __, Step __. I expected to see ____, but I see ____."</div>
  </section>

  ${youtube ? `<section class="panel no-print"><h2>The video</h2><div class="yt"><iframe id="ytf" src="https://www.youtube.com/embed/${esc(youtube)}?enablejsapi=1&rel=0&cc_load_policy=1" allow="autoplay;encrypted-media" allowfullscreen></iframe></div></section>` : ''}

  <section class="panel"><h2>Video chapters</h2>
    <ul class="chapters">${chapterIndex}</ul>
    <p class="important" style="margin-top:14px">IMPORTANT — do not watch the whole video and try to remember it. Use one chapter at a time.</p>
  </section>

  ${chapters}

  <section class="panel tinted"><h2>Final check + submission</h2>
    <div class="checklist">
      <label><input type="checkbox" onchange="save()"> My original Background layer is still there.</label>
      <label><input type="checkbox" onchange="save()"> I used at least one layer mask.</label>
      <label><input type="checkbox" onchange="save()"> New parts are on their own layers (not flattened onto the background).</label>
      <label><input type="checkbox" onchange="save()"> The finished image looks like one believable picture.</label>
      <label><input type="checkbox" onchange="save()"> I can explain one decision I made.</label>
    </div>
  </section>

  <section class="panel"><h2>If something looks wrong</h2>
    <ol class="howto"><li>Stop.</li><li>Find the last step that looked correct.</li><li>Undo if needed.</li><li>Replay only 10–15 seconds of the matching chapter.</li><li>Ask for a check before continuing.</li></ol>
  </section>

  <section class="panel"><h2>Save your work</h2>
    <p><strong>STEP 1 —</strong> File → Save As → save a layered <strong>.psd</strong>. <span class="why"><span>WHY:</span> the PSD keeps your layers and masks editable.</span></p>
    <p><strong>STEP 2 —</strong> File → Export → Export As → <strong>JPG or PNG</strong>. <span class="why"><span>WHY:</span> the exported file is the flat finished image for submission.</span></p>
    <p>PSD filename: <span class="blank"></span></p><p>Final image filename: <span class="blank"></span></p>
  </section>

  ${shortEvidence ? `<section class="panel"><h2>Short evidence — you may answer aloud</h2>
    <p style="color:var(--muted);font-size:15px">A teacher or support person can tick the box after you explain your answer.</p>
    ${shortEvidence}</section>` : ''}

  ${rate ? `<section class="panel no-print"><h2>My skill check (1–4)</h2>
    <p style="color:var(--muted);font-size:15px">Honest self-rating for reflection — it is not your grade.</p>
    ${rate}
    ${collector ? `<p style="margin-top:14px"><button class="button" onclick="submitEvidence()">Submit my evidence</button> <span id="subMsg" style="font-size:14px;color:var(--muted)"></span></p>` : ''}
  </section>` : ''}

  <section class="panel tinted"><h2>Support ladder</h2>
    <ol class="howto"><li>Read only the current step.</li><li>Compare your screen with the checkpoint image.</li><li>Replay only the matching 10–15 seconds of the video.</li><li>Use: "I am on Chapter __, Step __. I expected __, but I see __."</li><li>Ask for a teacher or resource check before moving on.</li></ol>
  </section>

  <p style="font-size:12px;color:var(--muted)">Generator: make-lab-v7 (Supported Studio) · ${esc(pkg.lessonId || '')} · skills ${esc(skillIds.join(' + '))} · outcomes ${esc(outcomeCodes.join('; '))}. Canonical still to add: per-step DOCUMENT and richer WHY narration, student-file links.</p>
</div>
<script>
var KEY='v7:${esc(pkg.lessonId || '')}';
function seek(s){var f=document.getElementById('ytf');if(!f)return;f.src='https://www.youtube.com/embed/${esc(youtube)}?enablejsapi=1&rel=0&cc_load_policy=1&autoplay=1&start='+s;window.scrollTo({top:f.getBoundingClientRect().top+scrollY-40,behavior:'smooth'});}
function save(){try{var d={c:[],r:{}};document.querySelectorAll('input[type=checkbox]').forEach(function(c,i){d.c[i]=c.checked;});document.querySelectorAll('.srate').forEach(function(s){d.r[s.dataset.skill]=s.value;});localStorage.setItem(KEY,JSON.stringify(d));}catch(e){}}
document.addEventListener('change',function(e){if(e.target.classList&&e.target.classList.contains('srate'))save();});
(function(){try{var d=JSON.parse(localStorage.getItem(KEY)||'{}');(d.c||[]).forEach(function(v,i){var c=document.querySelectorAll('input[type=checkbox]')[i];if(c)c.checked=v;});Object.keys(d.r||{}).forEach(function(k){var s=document.querySelector('.srate[data-skill="'+k+'"]');if(s)s.value=d.r[k];});}catch(e){}})();
function submitEvidence(){
  var url=${JSON.stringify(collector)};var msg=document.getElementById('subMsg');
  var claims=[];var today=new Date().toISOString().slice(0,10);
  document.querySelectorAll('.srate').forEach(function(s){
    claims.push({stream:'evidence',course:${JSON.stringify(courseCode)},skill:s.dataset.skill,date:today,selfRating:s.value||null,artifact:${JSON.stringify(wburl)},lab:${JSON.stringify(lab.id)}});
  });
  try{fetch(url,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify({app:'evidence-map-student-passport',schema:1,claims:claims})});if(msg)msg.textContent='Sent ✓';}catch(e){if(msg)msg.textContent='Saved locally.';}
  var blob=new Blob([JSON.stringify({app:'evidence-map-student-passport',schema:1,claims:claims},null,2)],{type:'application/json'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='evidence-${esc(lab.id)}.json';a.click();
}
</script></body></html>`;

const out = arg('out', join(dir, `workbook.v7.${lab.id}.html`));
writeFileSync(out, html);
console.log(`✓ ${out}`);
console.log(`  v7 · ${lab.id} · ${groups.length} chapters · skills ${skillIds.join('+')} · outcomes ${outcomeCodes.join(';')} · youtube ${youtube ? 'yes' : 'no'} · collector ${collector ? 'yes' : 'no'}`);
