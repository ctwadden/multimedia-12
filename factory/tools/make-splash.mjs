#!/usr/bin/env node
/** Build the course page from its course catalogue. No network or dependencies.
 * node factory/tools/make-splash.mjs --course factory/courses/mm12.json --out index.html
 * Supports the original flat lessons list as well as modules with lesson groups.
 * Module anchors are navigation only; they do not create curriculum or evidence IDs.
 */
import { readFileSync, writeFileSync } from 'node:fs';
const arg = (name, fallback = null) => {
  const i = process.argv.indexOf(`--${name}`);
  return i < 0 ? fallback : process.argv[i + 1];
};
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const href = (value) => {
  if (!value || /^(?:https:\/\/|[a-z0-9][a-z0-9/_?=.&%#-]*$)/i.test(value) === false || value.startsWith('//')) {
    throw new Error(`Invalid public link: ${value}`);
  }
  return esc(value);
};
const c = JSON.parse(readFileSync(arg('course'), 'utf8'));
const modules = c.modules || [{ anchor: 'lessons', number: '01', title: 'Course lessons', groups: [{ title: 'Lessons', lessons: c.lessons || [] }] }];
const accent = /^#[0-9a-f]{6}$/i.test(c.accent || '') ? c.accent : '#a61e58';
const resourceCount = modules.reduce((n, m) => n + (m.groups || []).reduce((sum, g) => sum + g.lessons.length, 0), 0);
const anchors = new Set();
for (const m of modules) {
  if (!/^[a-z][a-z0-9-]*$/.test(m.anchor) || anchors.has(m.anchor)) throw new Error('Each module needs a unique navigation anchor.');
  anchors.add(m.anchor);
}
const card = (l) => `<article class="lesson${l.kind === 'Practical assessment' ? ' assessment' : ''}">
  <div class="eyebrow">${esc(l.kind || 'Tutorial')}${l.time ? ` · ${esc(l.time)}` : ''}</div>
  <h4>${esc(l.title)}</h4>${l.label ? `<p class="label">${esc(l.label)}</p>` : ''}
  <p class="description">${esc(l.desc)}</p>
  <ul class="skills" aria-label="Skills practised">${(l.skills || []).map(s => `<li>${esc(s)}</li>`).join('')}</ul>
  <div class="actions">${l.url ? `<a class="open" href="${href(l.url)}" aria-label="Open ${esc(l.title)} workbook">Open workbook <span aria-hidden="true">↗</span></a>` : '<span class="pending">Online workbook coming soon</span>'}
  ${l.reflectionUrl ? `<a class="reflection" href="${href(l.reflectionUrl)}" aria-label="${esc(l.title)} knowledge and skill reflection">Knowledge &amp; skill reflection <span aria-hidden="true">↗</span></a>` : ''}</div>
</article>`;
const moduleSection = (m) => `<section id="${m.anchor}" class="module${m.groups ? '' : ' upcoming'}" aria-labelledby="${m.anchor}-title">
  <div class="section-heading"><div><p class="eyebrow">${esc(m.navigationLabel || `Module ${m.number}`)}</p><h2 id="${m.anchor}-title">${esc(m.title)}</h2></div>${m.groups ? `<span class="section-tag">${esc(c.learningCycle || 'Create · Explain · Refine')}</span>` : '<span class="section-tag">Materials coming later</span>'}</div>
  <p class="module-description">${esc(m.description || m.summary)}</p>
  ${(m.groups || []).map((g, i) => `<section class="group" aria-labelledby="${m.anchor}-group-${i}"><div class="group-heading"><span class="group-marker" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><div><h3 id="${m.anchor}-group-${i}">${esc(g.title)}</h3><p>${esc(g.description)}</p></div></div><div class="lesson-grid">${g.lessons.map(card).join('')}</div></section>`).join('')}
  ${m.supplemental?.length ? `<details class="supplemental"><summary>Extra skill practice <span>${m.supplemental.length} resource${m.supplemental.length === 1 ? '' : 's'}</span></summary><div class="lesson-grid">${m.supplemental.map(card).join('')}</div></details>` : ''}
</section>`;
const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${esc(c.subtitle)}"><title>${esc(c.title)} · Learning Studio</title>
<style>
:root{color-scheme:light;--paper:#f7f5f0;--card:#fff;--ink:#182b33;--muted:#53636b;--line:#d8dddb;--accent:${accent};--soft:#f8eaf0;--green:#245849}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:24px}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}a{color:var(--accent);text-underline-offset:4px}a:focus-visible,summary:focus-visible{outline:3px solid #216ba5;outline-offset:5px;border-radius:3px}h1,h2,h3,h4,p{margin-top:0}h1,h2,h3,h4{line-height:1.18;text-wrap:balance}h1{font-size:clamp(2rem,7vw,5rem);letter-spacing:-.055em;margin-bottom:22px}h2{font-size:clamp(1.8rem,4vw,2.8rem);letter-spacing:-.035em;margin-bottom:0}h3{font-size:1.35rem;margin-bottom:5px}h4{font-size:1.45rem;letter-spacing:-.02em;margin-bottom:9px}.wrap{width:min(1160px,calc(100% - 48px));margin:auto}.skip{position:absolute;left:16px;top:-80px;background:white;padding:12px;z-index:2}.skip:focus{top:10px}.topbar{border-bottom:1px solid var(--line)}.topbar .wrap{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:20px 0}.brand{font-size:13px;letter-spacing:.13em;text-transform:uppercase;font-weight:800}.course-code{font-size:13px;color:var(--muted)}.hero{padding:60px 0 42px;display:grid;grid-template-columns:1.5fr 1fr;gap:60px;align-items:end}.eyebrow{font-size:11px;letter-spacing:.12em;text-transform:uppercase;font-weight:800;color:var(--accent);margin-bottom:12px}.intro{font-size:1.18rem;color:var(--muted);max-width:49ch;margin-bottom:0}.support{border-left:2px solid var(--accent);padding-left:25px}.support h2{font-size:1.2rem;letter-spacing:0;margin-bottom:12px}.support p{font-size:.93rem;color:var(--muted)}.button{display:inline-flex;gap:24px;align-items:center;background:var(--ink);color:#fff;padding:11px 18px;text-decoration:none;font-weight:700;border-radius:5px}.button:hover{background:#29434f}.module-nav{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));border:1px solid var(--line);border-radius:9px;overflow:hidden;background:#fff;margin-bottom:56px}.module-link{padding:20px;display:flex;flex-direction:column;gap:10px;text-decoration:none;color:var(--ink);border-right:1px solid var(--line);font-weight:700;line-height:1.35}.module-link:last-child{border-right:0}.module-link:first-child{background:var(--ink);color:#fff}.module-link:hover{box-shadow:inset 0 -4px var(--accent)}.module-number{font-size:11px;letter-spacing:.12em;font-weight:700;opacity:.75}.module{margin:0 0 58px}.section-heading{display:flex;align-items:end;justify-content:space-between;gap:24px}.section-tag{color:var(--muted);font-size:12px;white-space:nowrap;padding:6px 0}.module-description{max-width:80ch;color:var(--muted);margin-top:20px}.availability{background:#fff;border-left:3px solid var(--green);padding:13px 18px;font-size:.9rem;color:var(--muted);margin-bottom:32px}.group{margin-top:34px}.group-heading{display:flex;gap:15px;align-items:baseline;margin-bottom:16px}.group-marker{font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums}.group-heading p{color:var(--muted);font-size:.91rem;margin:0}.lesson-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.lesson{padding:26px;background:var(--card);border:1px solid var(--line);border-radius:8px;display:flex;flex-direction:column}.lesson .eyebrow{color:var(--muted);font-size:10px;margin-bottom:12px}.assessment{border-left:4px solid var(--accent)}.assessment .eyebrow{color:var(--accent)}.label{font-size:.85rem;font-weight:650;color:var(--muted);margin-bottom:14px}.description{color:var(--muted);font-size:.95rem;margin-bottom:18px;max-width:58ch}.skills{list-style:none;display:flex;flex-wrap:wrap;gap:7px;padding:0;margin:0 0 23px}.skills li{font-size:11px;background:#eef3f1;color:#365348;border-radius:3px;padding:4px 8px}.actions{margin-top:auto;padding-top:17px;border-top:1px solid #edf0ee;display:flex;flex-wrap:wrap;gap:13px 22px;align-items:center}.open{font-size:.9rem;font-weight:750}.reflection{font-size:.81rem}.pending{font-size:.82rem;color:var(--muted)}.supplemental{border:1px solid var(--line);border-radius:8px;padding:18px 22px;margin-top:26px}.supplemental summary{cursor:pointer;font-weight:700}.supplemental summary span{font-size:.8rem;font-weight:400;color:var(--muted);margin-left:12px}.supplemental .lesson-grid{margin-top:22px}.upcoming{border-top:1px solid var(--line);padding-top:30px;margin-bottom:30px}.upcoming h2{font-size:1.5rem}.upcoming .eyebrow{color:var(--muted)}.upcoming .module-description{margin-bottom:0}.footer{margin-top:52px;border-top:1px solid var(--line);padding:24px 0 35px;font-size:.82rem;color:var(--muted);display:flex;justify-content:space-between;gap:20px}.footer p{margin:0}
@media(max-width:800px){.hero{grid-template-columns:1fr;gap:30px;padding-top:38px}.support{max-width:60ch}.module-nav{grid-template-columns:repeat(2,1fr)}.module-link:nth-child(2){border-right:0}.module-link:nth-child(-n+2){border-bottom:1px solid var(--line)}.section-heading{display:block}.section-tag{display:inline-block;margin-top:12px}}
@media(max-width:560px){.wrap{width:calc(100% - 32px)}.lesson-grid{grid-template-columns:1fr}.lesson{padding:22px}.module-link{font-size:.85rem;padding:16px}.hero{padding-bottom:30px}.footer{display:block}.footer a{display:inline-block;margin-top:15px}.topbar .brand{font-size:11px}.course-code{font-size:11px}.module-nav{margin-bottom:40px}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}@media print{.support,.module-nav,.skip{display:none}.wrap{width:100%}.hero{display:block;padding:12px 0}.lesson{break-inside:avoid}.lesson-grid{grid-template-columns:1fr 1fr}.module{margin-bottom:24px}.footer{display:none}}
</style></head><body>
<a href="#course-modules" class="skip">Skip to course modules</a>
<header class="topbar"><div class="wrap"><span class="brand">Learning Studio</span><span class="course-code">${esc(c.course)} · Course home</span></div></header>
<main class="wrap"><section class="hero" aria-labelledby="course-title"><div><p class="eyebrow">Create with purpose</p><h1 id="course-title">${esc(c.title)}</h1><p class="intro">${esc(c.subtitle)}</p></div>
${c.coachUrl ? `<aside class="support" aria-label="Learning support"><h2>A little help, a next step.</h2><p>Try the task first. Use the shared Coach to unpack a step, troubleshoot a problem or reflect on your choices. Follow your teacher’s directions during assessments.</p><a class="button" href="${href(c.coachUrl)}">Open the Coach <span aria-hidden="true">↗</span></a></aside>` : ''}</section>
<nav class="module-nav" aria-label="Course modules">${modules.map(m => `<a class="module-link" href="#${m.anchor}"><span class="module-number">${esc(m.navigationLabel || `MODULE ${m.number}`)}</span><span>${esc(m.title)}</span></a>`).join('')}</nav>
<div id="course-modules"><p class="availability">Open the available workbooks below. More workbook links will appear here as they are published. Practical assessments are labelled separately.</p>${modules.map(moduleSection).join('')}</div>
<footer class="footer"><p>Keep your working files. Explain your choices. Use feedback to revise.</p><a href="#course-title">Back to top ↑</a></footer></main>
</body></html>`;
writeFileSync(arg('out', 'splash.html'), html);
console.log(`Built ${arg('out', 'splash.html')} · ${modules.length} modules · ${resourceCount} core resources`);
