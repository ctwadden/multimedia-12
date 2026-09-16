/**
 * Deterministic renderer of the canonical lesson JSON (§10, §23). PURE — no model
 * calls, no inference; renders ONLY what is present. Two modes over the SAME data:
 *   - student (default): display groups (referencing atomic step ids), one primary
 *     screenshot per group, inline shortcuts/settings, context quieter, provenance hidden.
 *   - debug: every atomic action with evidence, QA flags, screenshot timestamps.
 * Asset handling (file ref vs embedded data URI) is the caller's concern via the
 * screenshots map — the instructional content is identical.
 */
import { normalizeStep } from './schema.mjs';

const esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const mmss = (sec) => {
  const s = Math.max(0, Math.round(Number(sec) || 0));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
const chips = (arr) => (arr || []).map(k => `<kbd>${esc(k)}</kbd>`).join('');
const setInline = (arr) => (arr || []).map(v => `${esc(v.name)}: <b>${esc(v.value)}</b>`).join(' · ');
const menuInline = (arr) => (arr || []).map(esc).join(' <i>›</i> ');

// ---------- student mode: grouped ----------
function studentItem(raw) {
  const s = normalizeStep(raw);
  const ctx = s.importance !== 'essential';
  const kb = s.keyboardShortcuts.length ? `<span class="kbs">${chips(s.keyboardShortcuts)}</span>` : '';
  const menu = s.menuPath.length ? `<div class="mini-menu">${menuInline(s.menuPath)}</div>` : '';
  const set = s.settings.length ? `<div class="mini-set">${setInline(s.settings)}</div>` : '';
  const success = s.successCheck ? `<div class="mini-success">✓ ${esc(s.successCheck)}</div>` : '';
  return `<li class="${ctx ? 'ctx' : ''}"><div class="do"><span class="verb">${esc(s.title)}</span> ${kb}</div>${menu}${set}<div class="det">${esc(s.description)}</div>${success}</li>`;
}

function studentGroup(group, byId, screenshots) {
  const steps = (group.stepIds || []).map(id => byId[id]).filter(Boolean);
  const primary = byId[group.primaryStepId];
  const secondary = byId[group.secondaryStepId];
  const hrefs = [primary && screenshots[primary.stepNumber], secondary && secondary !== primary && screenshots[secondary.stepNumber]].filter(Boolean);
  const shots = hrefs.length ? `<div class="shots">${hrefs.map(h => `<img class="frame" src="${esc(h)}" loading="lazy" alt="">`).join('')}</div>` : '';
  const items = steps.map(studentItem).join('');
  const sc = group.successCheck ? `<p class="group-success">✓ ${esc(group.successCheck)}</p>` : '';
  return `<section class="group"><h3>${esc(group.title)}</h3>${shots}<ol class="items">${items}</ol>${sc}</section>`;
}

// ---------- debug mode: per atomic action ----------
function debugStep(raw, screenshots) {
  const s = normalizeStep(raw);
  const essential = s.importance === 'essential';
  const href = screenshots[s.stepNumber];
  const figure = href ? `<img class="frame" src="${esc(href)}" loading="lazy" alt="">` : '';
  const menu = s.menuPath.length ? `<div class="mini-menu">${menuInline(s.menuPath)}</div>` : '';
  const kb = s.keyboardShortcuts.length ? `<div class="kbs">${chips(s.keyboardShortcuts)}</div>` : '';
  const set = s.settings.length ? `<div class="mini-set">${setInline(s.settings)}</div>` : '';
  const success = s.successCheck ? `<p class="mini-success">✓ ${esc(s.successCheck)}</p>` : '';
  const mistake = s.commonMistake ? `<p class="mistake">⚠ ${esc(s.commonMistake)}</p>` : '';
  const basis = (s.evidence.basis || []).join('+').replace(/visual_and_audio/, 'visual+audio');
  const flags = [...(s.needsReview ? ['needsReview'] : []), ...(s.reviewFlags || []), ...(raw.reconciliationStatus ? ['reconcile:' + raw.reconciliationStatus] : [])];
  const teacher = `<details class="teacher" open><summary>provenance</summary><div class="ev">source ${esc(mmss(s.evidence.start))}–${esc(mmss(s.evidence.end))}${basis ? ' · ' + esc(basis) : ''} · screenshot ${esc(mmss(s.screenshotTimestamp))} · confidence ${esc((s.confidence).toFixed?.(2) ?? s.confidence)}</div>${flags.length ? `<div class="flags">⚑ ${flags.map(esc).join(', ')}</div>` : ''}</details>`;
  return `<div class="step ${essential ? 'is-ess' : 'is-ctx'}"><div class="step-h"><span class="ts">${esc(mmss(s.start))}</span> <b>${esc(s.stepNumber)}. ${esc(s.title)}</b> <span class="${essential ? 'ess' : 'ctx-b'}">${essential ? 'ESSENTIAL' : 'context'}</span></div>${menu}${kb}${figure}<p class="instr">${esc(s.description)}</p>${set}${success}${mistake}${teacher}</div>`;
}

// Secondary, collapsible comprehension layer (§10). Assessments + checkpoints only;
// retrieval/teach-back/transfer stay in the JSON but are not surfaced here.
function learningSection(guide) {
  const quiz = (guide.assessment || []).map((q, i) => `<div class="q"><p><b>Q${i + 1}. ${esc(q.question)}</b></p><ol type="A">${(q.options || []).map(o => `<li>${esc(o)}</li>`).join('')}</ol><details><summary>Answer</summary>${esc(q.options?.[q.correctAnswerIndex])} — ${esc(q.explanation)}</details></div>`).join('');
  const cps = (guide.checkpoints || []).map(c => `<li><span class="ts">${esc(c.timestamp)}</span> ${esc(c.question)}</li>`).join('');
  if (!quiz && !cps) return '';
  return `<details class="learning"><summary>Check your understanding — ${(guide.assessment || []).length} question(s), ${(guide.checkpoints || []).length} checkpoint(s)</summary>${quiz}${cps ? `<h4>Prediction checkpoints</h4><ul class="cps">${cps}</ul>` : ''}</details>`;
}

const STYLE = `
body{font-family:system-ui,sans-serif;max-width:1100px;margin:0 auto;padding:2rem;line-height:1.55;color:#1e293b}
.grid{display:grid;gap:2rem}@media(min-width:900px){.grid{grid-template-columns:1fr 1fr}.vid{position:sticky;top:1rem;align-self:start}}
.shell{aspect-ratio:16/9;border-radius:1rem;overflow:hidden;background:#000}iframe{width:100%;height:100%;border:0}
h1{font-size:2rem;margin-bottom:.2rem}
.cls{display:inline-block;font:800 .62rem/1 system-ui;letter-spacing:.08em;text-transform:uppercase;background:#0f172a;color:#fff;padding:.25rem .5rem;border-radius:.35rem}
.mode{display:inline-block;font:700 .62rem/1 system-ui;color:#64748b;border:1px solid #e2e8f0;border-radius:.35rem;padding:.22rem .5rem;margin-left:.4rem}
.can{background:#eef2ff;border-left:6px solid #4f46e5;padding:1rem 1.25rem;border-radius:.5rem;margin-bottom:1rem}
kbd{font:700 .72rem/1 ui-monospace,monospace;background:#0f172a;color:#e2e8f0;border-radius:.3rem;padding:.2rem .42rem;margin:0 .18rem .18rem 0;box-shadow:0 2px 0 #334155;display:inline-block}
.frame{width:100%;border-radius:.6rem;display:block;border:1px solid #e2e8f0;margin:.2rem 0}
.mini-menu{font:600 .78rem/1.4 system-ui;color:#334155;margin:.15rem 0}.mini-menu i{color:#cbd5e1;font-style:normal}
.mini-set{margin:.2rem 0;font-size:.82rem}.mini-set b{color:#4f46e5}
.mini-success,.group-success{color:#059669;font-weight:600;font-size:.84rem;margin:.25rem 0 0}
.ts{font:700 .8rem monospace;background:#eef2ff;color:#4f46e5;padding:.1rem .5rem;border-radius:.4rem}
/* student */
.group{border:1px solid #e2e8f0;border-radius:.9rem;padding:1rem 1.15rem;margin:1rem 0;background:#fff}
.group h3{margin:.1rem 0 .6rem;font-size:1.15rem}
.shots{display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:.6rem}.shots .frame{width:calc(50% - .25rem)}
.items{margin:0;padding-left:1.1rem}
.items li{margin:.5rem 0}.items li.ctx{opacity:.7}.items li.ctx .verb{font-weight:600}
.do{font-weight:400}.verb{font-weight:700;color:#0f172a}
.det{font-size:.9rem;color:#475569;margin-top:.15rem}
.group-success{border-top:1px dashed #e2e8f0;padding-top:.5rem;margin-top:.6rem}
/* debug */
.step{border:1px solid #e2e8f0;border-radius:.75rem;padding:1rem;margin:.6rem 0}
.step.is-ess{border-left:6px solid #4f46e5;background:#fbfbff}.step.is-ctx{border-left:6px solid #e2e8f0;background:#fafafa}
.step-h{margin-bottom:.4rem}.instr{margin:.35rem 0}
.ess{font:800 .58rem/1 system-ui;background:#4f46e5;color:#fff;padding:.22rem .42rem;border-radius:.3rem}
.ctx-b{font:700 .58rem/1 system-ui;color:#94a3b8;border:1px solid #e2e8f0;padding:.2rem .38rem;border-radius:.3rem}
.mistake{color:#b45309;font-weight:600;font-size:.84rem;margin:.2rem 0 0}
.teacher summary{font:600 .62rem/1 system-ui;text-transform:uppercase;letter-spacing:.04em;color:#94a3b8;cursor:pointer;margin-top:.5rem}
.teacher .ev{font:600 .68rem/1.3 ui-monospace,monospace;color:#94a3b8;margin-top:.3rem}
.teacher .flags{font:700 .68rem/1.3 system-ui;color:#92400e;background:#fef3c7;border-radius:.3rem;padding:.15rem .4rem;margin-top:.25rem;display:inline-block}
.learning{margin-top:1.5rem;border-top:2px dashed #e2e8f0;padding-top:.8rem}
.learning>summary{font:800 .8rem/1 system-ui;color:#64748b;cursor:pointer;text-transform:uppercase;letter-spacing:.03em}
.learning .q{border:1px solid #e2e8f0;border-radius:.6rem;padding:.8rem;margin:.6rem 0}
.learning .cps{list-style:none;padding:0}.learning .cps li{margin:.35rem 0}
@media print{.vid,.modebar{display:none}.frame{max-height:70mm;width:auto}}
`;

export function renderHtml(guide, video, screenshots = {}, opts = {}) {
  const mode = opts.mode === 'debug' ? 'debug' : 'student';
  const embed = video.kind === 'youtube'
    ? `https://www.youtube.com/embed/${esc(video.id)}`
    : `https://drive.google.com/file/d/${esc(video.id)}/preview`;
  const cls = guide.classification ? `<span class="cls">${esc(guide.classification)}</span>` : '';

  const allSteps = (guide.chapters || []).flatMap(c => c.steps || []);
  let body;
  if (mode === 'student' && (guide.displayGroups || []).length) {
    const byId = {}; for (const s of allSteps) byId[s.id] = s;
    body = (guide.displayGroups || []).map(g => studentGroup(g, byId, screenshots)).join('');
  } else {
    body = (guide.chapters || []).map(c => `<h3>${esc(c.title)}</h3>${(c.steps || []).map(s => debugStep(s, screenshots)).join('')}`).join('');
  }

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(guide.title)}</title><style>${STYLE}</style></head><body>
<h1>${esc(guide.title)}</h1><div>${cls}<span class="mode">${mode} mode</span></div><p>${esc(guide.description)}</p>
<div class="grid"><div class="vid"><div class="shell"><iframe src="${embed}" allowfullscreen></iframe></div></div>
<div><div class="can"><b>I can…</b><ul>${(guide.iCanStatements || []).map(s => `<li>${esc(s)}</li>`).join('')}</ul></div>${body}${learningSection(guide)}</div></div>
</body></html>`;
}

export const buildHtml = renderHtml;
