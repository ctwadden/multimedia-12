#!/usr/bin/env node
/**
 * make-workbook.mjs — Path A orchestrator. After you record + upload to YouTube
 * in AutoScribe, this single command turns a Drive recording into a live,
 * competency-tagged, multilingual GitHub workbook.
 *
 *   RECORD + UPLOAD (AutoScribe app)  →  this one command:
 *     analyse (Gemini) → tag to a lab → embed real frames → wire the YouTube
 *     video + per-step seeks → (optionally) publish to GitHub Pages.
 *
 *   node tools/make-workbook.mjs --drive <id|url> --lab MM12-PS-LAB-08 \
 *     --youtube <ytId> [--course MM12] [--unit "..."] [--out <dir>] \
 *     [--repo owner/repo --path lab8/index.html]   (--repo needs GITHUB_TOKEN)
 *
 *   Idempotent: if the companion already exists it reuses it (no new Gemini
 *   spend) unless --force. --dry-run prints the plan and spends nothing.
 */
import { mkdirSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeSource } from './lib/sources.mjs';
import { generateLessonPackage, buildPackage, buildHtml } from './lib/generate.mjs';
import { GENERATOR_VERSION, PROMPT_VERSION, SCHEMA_VERSION } from './lib/config.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const arg = (n, d = null) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const flag = (n) => process.argv.includes(`--${n}`);
const now = () => new Date().toISOString();
const log = (m) => console.log(m);

const input = arg('drive');
const labId = arg('lab');
if (!input || !labId) { console.error('need --drive <id|url> and --lab <LAB-ID>'); process.exit(1); }
const course = arg('course', 'MM12');
const unit = arg('unit', null);
const youtube = arg('youtube', null);
const modulePath = arg('module', 'mm12-photoshop-module.json');
const outBase = arg('out', join(homedir(), 'Documents', 'ScribeIt Companions', course));
const repo = arg('repo', null);
const dry = flag('dry-run');

const run = (script, args) => execFileSync('node', [join(here, script), ...args], { stdio: 'inherit' });

(async () => {
  log(`\n▶ make-workbook — ${input}\n`);
  const desc = await describeSource(input);
  const lessonId = desc.lessonId;
  const outDir = join(outBase, lessonId);
  log(`  lesson  ${lessonId}  (${desc.sourceType}, ~${Math.round((desc.duration || 0) / 60)}m)`);
  log(`  lab     ${labId}`);
  log(`  out     ${outDir}`);
  log(`  youtube ${youtube || '(none — still frames)'}`);
  log(`  publish ${repo ? repo + ' ' + (arg('path') || '') : '(skip)'}\n`);
  if (dry) { log('  DRY RUN — no analysis, no publish. Plan above.'); return; }

  // 1. Analyse (Gemini) — skipped if the companion already exists (idempotent).
  mkdirSync(outDir, { recursive: true });
  const haveIt = existsSync(join(outDir, 'lesson.json'));
  if (haveIt && !flag('force')) {
    log('① analyse — companion exists, reusing (no Gemini spend). Use --force to regenerate.');
  } else {
    log('① analyse — running Gemini pipeline…');
    const res = await generateLessonPackage({ input, courseTitle: course, unitTitle: unit || desc.title, outDir, log: (m) => log('     ' + m) });
    const versions = res.versions || { schemaVersion: SCHEMA_VERSION, promptVersion: PROMPT_VERSION, generatorVersion: GENERATOR_VERSION };
    const pkg = buildPackage(res.guide, res.video, res.videoName, { courseTitle: course, unitTitle: unit || desc.title, lessonId, versions, classification: res.guide.classification, displayGroups: res.displayGroups });
    writeFileSync(join(outDir, 'lesson.json'), JSON.stringify(pkg, null, 2));
    writeFileSync(join(outDir, 'workbook.preview.html'), buildHtml(res.guide, res.video, res.screenshotDataUris, { mode: 'student' }));
    log(`     ✓ analysed · ~$${(res.estimatedCost || 0).toFixed(4)}`);
  }

  // 2. Embed real screenshots into lesson.json (free).
  log('② embed — inlining screenshots…');
  run('make-embed.mjs', [outDir]);

  // 3. Render the tagged SEE→APPLY workbook (+ YouTube video & per-step seeks).
  log('③ workbook — rendering tagged lab…');
  const wbPath = join(outDir, `workbook.${labId}.html`);
  run('make-lab.mjs', ['--companion', outDir, '--module', modulePath, '--lab', labId, ...(youtube ? ['--youtube', youtube] : []), '--out', wbPath]);

  // 4. Publish to GitHub Pages (optional; needs GITHUB_TOKEN).
  if (repo) {
    log('④ publish — pushing to GitHub Pages…');
    if (!process.env.GITHUB_TOKEN) { console.error('   ✗ set GITHUB_TOKEN to publish (skipping).'); }
    else run('publish-github.mjs', ['--file', wbPath, '--repo', repo, '--path', arg('path') || `${labId}/index.html`]);
  }

  // 5b. Copy the finished workbook to a chosen path (used by CI to place it in the repo).
  const dest = arg('dest');
  if (dest) { mkdirSync(dirname(dest), { recursive: true }); copyFileSync(wbPath, dest); log('   → ' + dest); }

  log(`\n✓ done → ${dest || wbPath}${repo ? '  (and published)' : ''}\n`);
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
