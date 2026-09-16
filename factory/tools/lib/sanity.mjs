/**
 * Deterministic content-sanity guards (production readiness §4).
 *
 * Schema validity does NOT guarantee sane prose — model-generated enrichment
 * (success checks, assessments, checkpoints, transfer/teach-back/retrieval,
 * troubleshooting) can degenerate into over-long or looping text. This module
 * detects that deterministically and OMITS the malformed field from the student
 * view. It never repairs prose heuristically and never triggers video re-analysis;
 * the raw model response is preserved in raw/ regardless.
 *
 * Pure: no model calls.
 */

// Per-field length caps (characters). Generous — only catches genuine runaways.
export const FIELD_CAPS = {
  successCheck: 320, commonMistake: 320,
  'assessment.question': 400, 'assessment.explanation': 600,
  'checkpoint.question': 400,
  'transfer.prompt': 700, 'teachBack': 500, 'retrieval.question': 450,
  'troubleshoot': 700, 'vocabulary.definition': 500, default: 600,
};

/**
 * Detect degenerate text. Returns an array of reason codes (empty = clean).
 * Empty/whitespace text is considered clean (optional fields may be empty).
 */
export function assessText(text, maxLen = FIELD_CAPS.default) {
  const s = String(text || '');
  if (!s.trim()) return [];
  const reasons = [];
  if (s.length > maxLen) reasons.push('too_long');

  const toks = s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  // consecutive identical token run (word-loop degeneration)
  let run = 1, maxRun = 1;
  for (let i = 1; i < toks.length; i++) { if (toks[i] === toks[i - 1]) { run++; maxRun = Math.max(maxRun, run); } else run = 1; }
  if (maxRun >= 5) reasons.push('token_loop');
  // one token dominates
  if (toks.length >= 12) {
    const c = {}; for (const t of toks) c[t] = (c[t] || 0) + 1;
    if (Math.max(...Object.values(c)) / toks.length > 0.3) reasons.push('repeated_token_ratio');
  }
  // repeated whole sentence
  const sents = s.split(/[.!?\n]+/).map(x => x.trim().toLowerCase()).filter(x => x.length > 8);
  const seen = new Set();
  for (const x of sents) { if (seen.has(x)) { reasons.push('repeated_sentence'); break; } seen.add(x); }
  // repeated 3-gram phrase
  if (toks.length >= 9) {
    const g = {}; for (let i = 0; i + 2 < toks.length; i++) { const k = toks[i] + ' ' + toks[i + 1] + ' ' + toks[i + 2]; g[k] = (g[k] || 0) + 1; }
    if (Math.max(...Object.values(g)) >= 3) reasons.push('repeated_phrase');
  }
  return [...new Set(reasons)];
}

const bad = (text, cap) => assessText(text, cap).length > 0;

/**
 * Scrub malformed enrichment out of a guide IN PLACE (blank/drop), preserving the
 * procedural core. Returns an array of QA flags describing what was omitted.
 * The raw model output is untouched in raw/ — this only affects the canonical
 * student-facing lesson.
 */
export function scrubGuide(guide) {
  const flags = [];
  const flag = (field, ref, text, cap) => { const r = assessText(text, cap); if (r.length) { flags.push({ field, ref, reasons: r }); return true; } return false; };

  for (const c of guide.chapters || []) for (const s of c.steps || []) {
    if (flag('successCheck', s.id, s.successCheck, FIELD_CAPS.successCheck)) s.successCheck = '';
    if (s.commonMistake && flag('commonMistake', s.id, s.commonMistake, FIELD_CAPS.commonMistake)) s.commonMistake = null;
  }
  guide.assessment = (guide.assessment || []).filter((q, i) => {
    const b = bad(q.question, FIELD_CAPS['assessment.question']) || bad(q.explanation, FIELD_CAPS['assessment.explanation']);
    if (b) flags.push({ field: 'assessment', ref: `q${i}`, reasons: ['dropped_malformed'] });
    return !b;
  });
  guide.checkpoints = (guide.checkpoints || []).filter((c, i) => {
    const b = bad(c.question, FIELD_CAPS['checkpoint.question']);
    if (b) flags.push({ field: 'checkpoint', ref: `c${i}`, reasons: ['dropped_malformed'] });
    return !b;
  });
  guide.transferChallenges = (guide.transferChallenges || []).filter((t, i) => {
    const b = bad(t.prompt, FIELD_CAPS['transfer.prompt']); if (b) flags.push({ field: 'transfer', ref: `t${i}`, reasons: ['dropped_malformed'] }); return !b;
  });
  guide.teachBackPrompts = (guide.teachBackPrompts || []).filter((t, i) => {
    const b = bad(t, FIELD_CAPS.teachBack); if (b) flags.push({ field: 'teachBack', ref: `tb${i}`, reasons: ['dropped_malformed'] }); return !b;
  });
  guide.retrievalPractice = (guide.retrievalPractice || []).filter((r, i) => {
    const b = bad(r.question, FIELD_CAPS['retrieval.question']); if (b) flags.push({ field: 'retrieval', ref: `r${i}`, reasons: ['dropped_malformed'] }); return !b;
  });
  guide.troubleshooting = (guide.troubleshooting || []).filter((t, i) => {
    const b = bad(t.fix, FIELD_CAPS.troubleshoot) || bad(t.scenario, FIELD_CAPS.troubleshoot); if (b) flags.push({ field: 'troubleshoot', ref: `ts${i}`, reasons: ['dropped_malformed'] }); return !b;
  });
  guide.vocabulary = (guide.vocabulary || []).filter((v, i) => {
    const b = bad(v.definition, FIELD_CAPS['vocabulary.definition']); if (b) flags.push({ field: 'vocabulary', ref: `v${i}`, reasons: ['dropped_malformed'] }); return !b;
  });
  return flags;
}
