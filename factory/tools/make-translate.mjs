#!/usr/bin/env node
/**
 * make-translate.mjs — generate-and-store translations (Design Brief §12).
 * Reads a companion lesson.json, translates the student-facing content into
 * es/fr/ar with Gemini, and writes lesson.<loc>.json sidecars that make-lab
 * picks up. Machine-draft — the teacher reviews before release.
 *
 *   node tools/make-translate.mjs --companion "<dir>" [--locales es,fr,ar]
 *
 * Keeps Adobe Photoshop tool/menu names in English; never changes option order,
 * count, or the correct-answer mapping (only display text is translated).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GoogleGenAI } from '@google/genai';
import { getKey } from './lib/generate.mjs';
import { MODELS } from './lib/config.mjs';

const arg = (n, d = null) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const dir = arg('companion');
if (!dir) { console.error('need --companion <dir>'); process.exit(1); }
const locales = (arg('locales', 'es,fr,ar')).split(',').map(s => s.trim());
const NAMES = { es: 'Spanish (neutral Latin American)', fr: 'French (clear, broadly understood)', ar: 'Modern Standard Arabic' };

const pkg = JSON.parse(readFileSync(join(dir, 'lesson.json'), 'utf8'));
const t = (pkg.topics && pkg.topics[0]) || {};
// Optional: pull lab focus + competency text (they live in the module/skills, not lesson.json)
let labFocus = '', comp = {};
try {
  const labId = arg('lab');
  if (labId) {
    const mod = JSON.parse(readFileSync(arg('module', 'mm12-photoshop-module.json'), 'utf8'));
    const skills = JSON.parse(readFileSync(arg('skills', 'mm12-skills.json'), 'utf8'));
    const lab = (mod.labs || []).find(l => l.id === labId);
    if (lab) { labFocus = lab.focus || ''; const s = skills.skills[lab.rollsUpTo[0]] || {}; comp = { compTitle: s.title || '', compCanDo: s.canDo || '', compL4: s.l4 || '' }; }
  }
} catch (e) { /* keep English fallback */ }
// combined quiz order MUST match make-lab render order: checkpoints, assessment, retrievalPractice
const quiz = [...(t.checkpoints || []), ...(t.assessment || []), ...(t.retrievalPractice || [])]
  .map(q => ({ question: q.question, options: q.options || [], explanation: q.explanation || '' }));
const source = {
  title: pkg.lessonTitle || t.title || '', focus: labFocus,
  compTitle: comp.compTitle || '', compCanDo: comp.compCanDo || '', compL4: comp.compL4 || '',
  iCan: t.iCanStatements || [], ideas: t.keyConcepts || [],
  reflect: (t.teachBackPrompts || []).slice(0, 3),
  quiz,
};
// Drop empty fields so make-lab keeps English for anything we couldn't source.
Object.keys(source).forEach(k => { const v = source[k]; if (v === '' || (Array.isArray(v) && !v.length)) delete source[k]; });

const ai = new GoogleGenAI({ apiKey: getKey() });

async function translate(loc) {
  const prompt = `Translate the VALUES of this JSON into ${NAMES[loc]}. Rules:
- Return ONLY valid JSON with the EXACT same keys and array lengths/order.
- Translate every string value. For "quiz", translate each question, each option (keep the same order and count), and each explanation.
- Keep well-known Adobe Photoshop tool/menu names in English (e.g. "Quick Selection Tool", "Soft Light", "Layer via Copy", "Lasso Tool"); you may add a short parenthetical gloss.
- Do not add, remove, reorder, or renumber anything. Do not translate keys.
JSON:
${JSON.stringify(source)}`;
  const res = await ai.models.generateContent({
    model: MODELS.default,
    contents: prompt,
    config: { responseMimeType: 'application/json', maxOutputTokens: 32768, temperature: 0.2 },
  });
  const out = JSON.parse(res.text);
  out._status = 'machine-draft — needs review by a proficient speaker';
  writeFileSync(join(dir, `lesson.${loc}.json`), JSON.stringify(out, null, 2));
  console.log(`  ✓ lesson.${loc}.json (${(out.quiz || []).length} quiz items)`);
}

for (const loc of locales) {
  if (!NAMES[loc]) { console.log(`  ! skip ${loc} (unsupported)`); continue; }
  try { await translate(loc); } catch (e) { console.log(`  ✗ ${loc}: ${String(e.message).slice(0, 100)}`); }
}
console.log('done.');
