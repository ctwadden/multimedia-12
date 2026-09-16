/**
 * Deterministic quality gates (no model calls).
 *
 *  - validateRawWindow(): reject impossible WINDOW-RELATIVE model output BEFORE
 *    it is converted to source time. Never clamps (§2). Records original values.
 *  - chooseScreenshotTimestamp(): action-aligned, end-of-video-guarded (§8/§9).
 *  - coarseStepFlags / shortcutFidelityFlags: review signals (§7/§12/§13).
 *  - dedupeStitched(): remove overlap duplicates across adjacent windows (§5).
 *  - duplicateScreenshotFindings(): flag identical screenshots (§9).
 *  - validateLesson(): strict final gate — the Phase-1 clamp bug now FAILS (§1).
 */
import {
  CONFIDENCE_MIN, WINDOW_EPSILON_SEC, END_OF_VIDEO_MARGIN_SEC,
  COARSE_STEP_SEC, COARSE_STEP_MAX_SHORTCUTS,
} from './config.mjs';
import { BASIS_VALUES } from './schema.mjs';

const num = (v) => (typeof v === 'number' && isFinite(v) ? v : null);

// ---------- raw (relative) window validation — before conversion ----------
/**
 * @param chaptersRel  chapters whose steps use relativeStart/relativeEnd/screenshotRelative + relative evidence
 * @param windowDurationSec  actual duration of this analysis window (seconds)
 * @returns { validChapters, rejected: [{title, values, reasons}] }
 */
export function validateRawWindow(chaptersRel, windowDurationSec, eps = WINDOW_EPSILON_SEC) {
  const rejected = [];
  const validChapters = [];
  for (const c of chaptersRel || []) {
    const keep = [];
    for (const s of c.steps || []) {
      const rs = num(s.relativeStart), re = num(s.relativeEnd), sr = num(s.screenshotRelative);
      const ev = s.evidence || {};
      const evs = num(ev.relativeStart), eve = num(ev.relativeEnd);
      const reasons = [];
      if (rs == null || re == null) reasons.push('missing_timestamp');
      if (rs != null && rs < -eps) reasons.push('raw_timestamp_out_of_window');
      if (re != null && re > windowDurationSec + eps) reasons.push('raw_timestamp_out_of_window');
      if (rs != null && re != null && re <= rs) reasons.push('zero_or_negative_duration');
      if (sr != null && rs != null && re != null && (sr < rs - eps || sr > re + eps)) reasons.push('screenshot_out_of_step');
      if (evs != null && eve != null && eve <= evs) reasons.push('zero_evidence_range');
      if ((evs != null && evs < -eps) || (eve != null && eve > windowDurationSec + eps)) reasons.push('evidence_out_of_window');
      if (reasons.length) {
        rejected.push({ title: s.title || '(untitled)', values: { relativeStart: rs, relativeEnd: re, screenshotRelative: sr, evidence: { relativeStart: evs, relativeEnd: eve } }, reasons });
      } else {
        keep.push(s);
      }
    }
    if (keep.length) validChapters.push({ ...c, steps: keep });
  }
  return { validChapters, rejected };
}

// ---------- screenshot selection (source time) ----------
/**
 * Pick a screenshot time that (a) shows the action and (b) is not the outro.
 * Falls back to 50/25/75% of the evidence interval only to RECOVER from an
 * invalid/suspicious model timestamp (§10) — not as a correctness guarantee.
 * @returns { ts, adjusted, flags }
 */
export function chooseScreenshotTimestamp(step, sourceDuration, margin = END_OF_VIDEO_MARGIN_SEC) {
  const ev = step.evidence || {};
  const evStart = num(ev.start) ?? num(step.start) ?? 0;
  const evEnd = Math.max(evStart, num(ev.end) ?? num(step.end) ?? evStart);
  const safeMax = Math.max(0, (sourceDuration || Infinity) - margin);
  const desired = num(step.screenshotTimestamp);
  const flags = [];

  const inEvidence = desired != null && desired >= evStart - 0.5 && desired <= evEnd + 0.5;
  const suspiciousEnd = desired != null && sourceDuration && desired >= sourceDuration - margin;
  if (inEvidence && !suspiciousEnd && desired >= 0) return { ts: +desired.toFixed(2), adjusted: false, flags };

  if (desired == null || !inEvidence) flags.push('screenshot_out_of_evidence');
  if (suspiciousEnd) flags.push('screenshot_end_of_video');

  const span = evEnd - evStart;
  for (const frac of [0.5, 0.25, 0.75]) {
    const cand = evStart + span * frac;
    if (cand >= 0 && cand <= safeMax && cand >= evStart - 0.5 && cand <= evEnd + 0.5) {
      return { ts: +cand.toFixed(2), adjusted: true, flags };
    }
  }
  // Evidence interval sits entirely inside the end-of-video margin (a genuine
  // outro-adjacent step): best-effort earlier frame, flagged for review.
  const fallback = Math.max(0, Math.min(evEnd, safeMax));
  flags.push('screenshot_forced_before_end');
  return { ts: +fallback.toFixed(2), adjusted: true, flags };
}

// ---------- review signals (non-fatal) ----------
export function coarseStepFlags(step) {
  const flags = [];
  const dur = (num(step.end) ?? 0) - (num(step.start) ?? 0);
  if (dur > COARSE_STEP_SEC) flags.push('long_duration');
  if ((step.keyboardShortcuts || []).length > COARSE_STEP_MAX_SHORTCUTS) flags.push('many_shortcuts');
  if ((step.settings || []).length > 4) flags.push('many_settings');
  const t = `${step.title || ''} ${step.description || ''}`.toLowerCase();
  if (/\b(then|,|→|->)\b/.test(step.title || '') || (t.match(/\b(add|scale|inset|extrude|bevel|fill|snap|reset|clear|rotate|move|apply|enter|select)\b/g) || []).length >= 4) flags.push('multiple_operations');
  return flags;
}

export function shortcutFidelityFlags(step) {
  const flags = [];
  for (const k of step.keyboardShortcuts || []) {
    const s = String(k).trim();
    if (/^(ctrl|control|shift|alt|cmd|command|option)(\s*\+\s*(ctrl|control|shift|alt|cmd|command|option))*$/i.test(s)) flags.push('modifier_only_shortcut');
    if (/^\d+$/.test(s)) flags.push('bare_numeric_shortcut');
  }
  return [...new Set(flags)];
}

// ---------- stitching ----------
const words = (s) => new Set(String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(Boolean));
function titlesSimilar(a, b) {
  if (!a || !b) return false;
  if (a.toLowerCase().trim() === b.toLowerCase().trim()) return true;
  const A = words(a), B = words(b); if (!A.size || !B.size) return false;
  let inter = 0; for (const w of A) if (B.has(w)) inter++;
  return inter / (A.size + B.size - inter) >= 0.6;
}

/** Remove near-duplicate steps produced by the window overlap (§5). */
export function dedupeStitched(steps, overlapSec, count = { dropped: 0 }) {
  const sorted = [...steps].sort((a, b) => a.start - b.start);
  const out = [];
  for (const s of sorted) {
    const prev = out[out.length - 1];
    const near = prev && Math.abs(s.start - prev.start) <= overlapSec + 1;
    const sameOp = prev && ((prev.keyboardShortcuts || []).join() === (s.keyboardShortcuts || []).join() && (prev.menuPath || []).join() === (s.menuPath || []).join() && (prev.keyboardShortcuts?.length || prev.menuPath?.length));
    if (near && (titlesSimilar(prev.title, s.title) || sameOp)) { count.dropped++; continue; }
    out.push(s);
  }
  return out;
}

/** Adjacent (or any) steps whose extracted screenshot is byte-identical (§9). */
export function duplicateScreenshotFindings(steps, hashes) {
  const byHash = new Map();
  for (const s of steps) { const h = hashes[s.stepNumber]; if (!h) continue; (byHash.get(h) || byHash.set(h, []).get(h)).push(s.stepNumber); }
  const findings = [];
  for (const [h, ns] of byHash) if (ns.length > 1) findings.push({ hash: h.slice(0, 12), steps: ns });
  return findings;
}

// ---------- final lesson validation (strict) ----------
export function validateLesson(pkg, { sourceDuration } = {}) {
  const errors = [], warnings = [];
  const topic = pkg?.topics?.[0];
  if (!topic) errors.push('no topic in package');
  const steps = (topic?.chapters || []).flatMap(c => c.steps || []);
  if (!steps.length) errors.push('lesson has no steps');
  if (!pkg?.lessonTitle) errors.push('missing lessonTitle');
  if (!pkg?.schemaVersion) errors.push('missing schemaVersion');

  let reviewCount = 0, essentialCount = 0;
  for (const s of steps) {
    const id = s.stepNumber || s.id || '?';
    if (s.needsReview) reviewCount++;
    if (s.importance === 'essential') essentialCount++;
    const evS = num(s.evidence?.start), evE = num(s.evidence?.end);
    if (num(s.end) != null && num(s.start) != null && s.end < s.start) errors.push(`step ${id}: end before start`);
    // zero/negative-duration evidence on a procedural step is now a HARD failure (§1)
    if (s.importance === 'essential') {
      if (evS == null || evE == null || evE <= evS) errors.push(`step ${id}: zero/invalid evidence range`);
      const sc = num(s.screenshotTimestamp);
      if (sc != null && evS != null && evE != null && (sc < evS - 0.5 || sc > evE + 0.5)) errors.push(`step ${id}: screenshot outside evidence range`);
      if (sourceDuration != null && sc != null) {
        if (sc > sourceDuration + 0.5) errors.push(`step ${id}: screenshot beyond source duration`);
        else if (sc >= sourceDuration - END_OF_VIDEO_MARGIN_SEC) warnings.push(`step ${id}: screenshot near end-of-video`);
      }
    }
    if (sourceDuration != null && num(s.end) != null && s.end > sourceDuration + 0.5) errors.push(`step ${id}: end beyond source duration`);
    if (!(s.evidence?.basis || []).some(b => BASIS_VALUES.includes(b))) warnings.push(`step ${id}: no evidence basis`);
    if ((s.reviewFlags || []).length) warnings.push(`step ${id}: review flags [${s.reviewFlags.join(', ')}]`);
  }
  if (steps.length && !essentialCount) warnings.push('no step marked essential');
  if (reviewCount) warnings.push(`${reviewCount} step(s) flagged needsReview`);

  const status = errors.length ? 'fail' : (warnings.length ? 'warn' : 'pass');
  return { status, errors, warnings, stats: { steps: steps.length, essential: essentialCount, context: steps.length - essentialCount, needsReview: reviewCount } };
}
