#!/usr/bin/env node
/**
 * make-workbook-multi.mjs — combine SEVERAL recordings (e.g. a long lesson recorded
 * in chunks) into ONE v7 "Supported Studio" workbook with a Part 1..N structure.
 * Each part keeps its own embedded video; chapters are numbered continuously.
 *
 *   node tools/make-workbook-multi.mjs \
 *     --drives "id1,id2,id3,id4" [--youtubes "yt1,yt2,yt3,yt4"] \
 *     --lab MM12-PS-LAB-08 --course "Multimedia 12" \
 *     [--labels "Setup|Shape|Colour|Finish"] [--title "..."] \
 *     [--wburl <url>] [--collector <url>] [--dest <final.html>]
 *
 * Idempotent per chunk: a chunk whose companion already exists is reused (no Gemini).
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir, tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeSource } from './lib/sources.mjs';
import { generateLessonPackage, buildPackage, buildHtml } from './lib/generate.mjs';
import { GENERATOR_VERSION, PROMPT_VERSION, SCHEMA_VERSION } from './lib/config.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const arg = (n, d = null) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const flag = (n) => process.argv.includes(`--${n}`);
const log = (m) => console.log(m);
const splitList = (s) => (s || '').split(/[,\n]/).map(x => x.trim()).filter(Boolean);

const drives = splitList(arg('drives') || arg('drive'));
const labId = arg('lab');
if (!drives.length || !labId) { console.error('need --drives "id1,id2,..." and --lab <LAB-ID>'); process.exit(1); }
const youtubes = splitList(arg('youtubes') || arg('youtube'));
const labels = (arg('labels') || '').split('|').map(x => x.trim());
const course = arg('course', 'MM12');
const modulePath = arg('module', 'mm12-photoshop-module.json');
const outBase = arg('out', join(homedir(), 'Documents', 'ScribeIt Companions', course));
const title = arg('title', '');
const run = (script, args) => execFileSync('node', [join(here, script), ...args], { stdio: 'inherit' });

(async () => {
  log(`\n▶ make-workbook-multi — ${drives.length} chunk(s) → one v7 workbook\n`);
  const parts = [];
  for (let i = 0; i < drives.length; i++) {
    const input = drives[i];
    const desc = await describeSource(input);
    const outDir = join(outBase, desc.lessonId);
    const yt = youtubes[i] || '';
    log(`  ── chunk ${i + 1}/${drives.length}  ${desc.lessonId}  (${desc.sourceType}, ~${Math.round((desc.duration || 0) / 60)}m)  youtube ${yt || '(none)'}`);
    mkdirSync(outDir, { recursive: true });

    if (existsSync(join(outDir, 'lesson.json')) && !flag('force')) {
      log('     analyse — reusing existing companion (no Gemini spend).');
    } else {
      log('     analyse — running Gemini pipeline…');
      const res = await generateLessonPackage({ input, courseTitle: course, unitTitle: desc.title, outDir, log: (m) => log('        ' + m) });
      const versions = res.versions || { schemaVersion: SCHEMA_VERSION, promptVersion: PROMPT_VERSION, generatorVersion: GENERATOR_VERSION };
      const pkg = buildPackage(res.guide, res.video, res.videoName, { courseTitle: course, unitTitle: desc.title, lessonId: desc.lessonId, versions, classification: res.guide.classification, displayGroups: res.displayGroups });
      writeFileSync(join(outDir, 'lesson.json'), JSON.stringify(pkg, null, 2));
      writeFileSync(join(outDir, 'workbook.preview.html'), buildHtml(res.guide, res.video, res.screenshotDataUris, { mode: 'student' }));
      log(`        ✓ analysed · ~$${(res.estimatedCost || 0).toFixed(4)}`);
    }
    run('make-embed.mjs', [outDir]);
    parts.push({ companion: outDir, youtube: yt, label: labels[i] || `Part ${i + 1}` });
  }

  // write the manifest and render one multi-part v7
  const manifest = { title, lab: labId, course, parts };
  const manifestPath = join(tmpdir(), `v7-manifest-${Date.now()}.json`);
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const dest = arg('dest') || join(outBase, `workbook.multi.${labId}.html`);
  mkdirSync(dirname(dest), { recursive: true });
  const pass = (n) => { const v = arg(n, ''); return v ? [`--${n}`, v] : []; };
  log(`\n③ render — one v7 workbook from ${parts.length} parts…`);
  run('make-lab-v7.mjs', ['--manifest', manifestPath, '--module', modulePath, '--lab', labId,
    ...(title ? ['--title', title] : []),
    ...pass('wburl'), ...pass('collector'),
    '--out', dest]);
  log(`\n✓ done → ${dest}\n`);
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
