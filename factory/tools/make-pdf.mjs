#!/usr/bin/env node
/**
 * make-pdf.mjs — render a workbook HTML to a printable step-by-step manual PDF,
 * one per language (uses the workbook's own ?lang= switch + print CSS).
 * Screenshots are embedded, so the PDF is a self-contained illustrated manual —
 * a paper/offline alternative to the video, in each language.
 *
 *   node tools/make-pdf.mjs --workbook <file.html> [--langs en,es,fr,ar] [--out-dir <dir>]
 *
 * Needs Google Chrome (same as tools/lib/pdf.mjs). No Gemini.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, basename, resolve } from 'node:path';

const arg = (n, d = null) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const CHROME = process.env.SCRIBE_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wb = arg('workbook');
if (!wb) { console.error('need --workbook <file.html>'); process.exit(1); }
if (!existsSync(CHROME)) { console.error('Chrome not found for PDF rendering'); process.exit(1); }
const abs = resolve(wb);
const langs = (arg('langs', 'en,es,fr,ar')).split(',').map(s => s.trim());
const outDir = arg('out-dir', dirname(abs));
mkdirSync(outDir, { recursive: true });
const stem = basename(abs).replace(/\.html?$/i, '');

for (const lang of langs) {
  const pdf = join(outDir, `${stem}.${lang}.pdf`);
  const profile = mkdtempSync(join(tmpdir(), 'sf-pdf-'));
  try {
    execFileSync(CHROME, [
      '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run', '--no-default-browser-check',
      `--user-data-dir=${profile}`, '--no-pdf-header-footer',
      `--print-to-pdf=${pdf}`, `file://${abs}?lang=${lang}`,
    ], { stdio: 'ignore', timeout: 60000 });
  } catch (e) { /* Chrome sometimes lingers after writing */ }
  finally { try { rmSync(profile, { recursive: true, force: true }); } catch {} }
  console.log(existsSync(pdf) ? `  ✓ ${pdf}` : `  ✗ ${lang} — no PDF produced`);
}
