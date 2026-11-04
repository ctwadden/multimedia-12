#!/usr/bin/env node
/**
 * Cloud driver: one Drive/YouTube video -> one Learning Studio standard workbook
 * HTML written to --dest. Used by the "Build Studio workbook" GitHub Action so
 * the gold standard can be generated from any device, no laptop needed.
 *
 *   node build-studio.mjs --input <drive-id|youtube> --course MM12 \
 *        --domain software --dest path/to/index.html
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { generateLessonPackage, buildHtml } from './lib/generate.mjs';

const argv = process.argv.slice(2);
const a = {};
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) { a[argv[i].slice(2)] = argv[i + 1]; i++; }

const input = a.input;
const course = a.course || 'MM12';
const domain = a.domain || 'software';
const dest = a.dest;
if (!input || !dest) { console.error('usage: build-studio.mjs --input <drive-id|youtube> --course MM12 --domain software --dest path/index.html'); process.exit(1); }

const { guide, frames, video } = await generateLessonPackage({
  input, courseTitle: course, unitTitle: course, outcomes: [], domain,
  log: (m) => console.error('  ' + m),
});
const html = buildHtml(guide, video, frames, 0, { course, status: 'Draft' });
mkdirSync(dirname(dest), { recursive: true });
writeFileSync(dest, html);
console.error(`✓ Wrote ${dest} (${html.length} bytes, ${(guide.chapters || []).reduce((n, c) => n + (c.steps?.length || 0), 0)} steps)`);
