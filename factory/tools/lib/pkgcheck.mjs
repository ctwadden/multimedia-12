/**
 * Package-integrity check (§8). A production companion package must contain the
 * canonical lesson, provenance, raw model responses, and both renders.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const REQUIRED = ['lesson.json', 'manifest.json', 'raw', 'workbook.preview.html', 'workbook.debug.html'];

export function verifyPackage(dir) {
  const missing = REQUIRED.filter(f => !existsSync(join(dir, f)));
  return { ok: missing.length === 0, missing, required: REQUIRED };
}
