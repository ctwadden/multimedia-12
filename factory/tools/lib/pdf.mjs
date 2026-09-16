/**
 * Deterministic student PDF renderer (output layer — NOT the Gold engine).
 * Prints an existing self-contained student workbook HTML to PDF via headless
 * Chrome. Pure presentation of lesson.json; no model calls, no engine changes.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = process.env.SCRIBE_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export function hasChrome() { return existsSync(CHROME); }

/** Render a local HTML file to PDF. Returns the pdf path. Throws on failure. */
export function renderPdf(htmlPath, pdfPath, { log = () => {} } = {}) {
  if (!hasChrome()) throw new Error('Chrome not found for PDF rendering');
  // Isolated temp profile so we never touch/lock the user's running Chrome.
  const profile = mkdtempSync(join(tmpdir(), 'sf-chrome-'));
  try {
    execFileSync(CHROME, [
      '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run', '--no-default-browser-check',
      `--user-data-dir=${profile}`, '--no-pdf-header-footer',
      `--print-to-pdf=${pdfPath}`, `file://${htmlPath}`,
    ], { stdio: 'ignore', timeout: 60000 });
  } catch (e) {
    // Chrome sometimes writes the PDF and lingers; accept if the file was produced.
    if (!existsSync(pdfPath)) throw new Error('Chrome PDF failed: ' + String(e.message).slice(0, 60));
  } finally {
    try { rmSync(profile, { recursive: true, force: true }); } catch {}
  }
  if (!existsSync(pdfPath)) throw new Error('Chrome produced no PDF');
  return pdfPath;
}
