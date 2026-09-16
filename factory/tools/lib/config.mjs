/**
 * Central configuration — models, versions, thresholds, pricing.
 * Single source of truth so a future cheaper/better model can be benchmarked by
 * changing ONE place (or an env var), never by hunting hard-coded IDs.
 *
 * NOTE: gemini-2.5-* is blocked for new users on this billing project (404 at
 * generate time). We use Google's named successors.
 */
export const MODELS = {
  // Default analysis model (timeline + pedagogy).
  default: process.env.SCRIBE_DEFAULT_MODEL || 'gemini-3.5-flash-lite',
  // Stronger model used ONLY to re-run windows that fail quality checks.
  escalation: process.env.SCRIBE_ESCALATION_MODEL || 'gemini-3.7-flash',
  // Whole-video pedagogy synthesis (text-only).
  pedagogy: process.env.SCRIBE_PEDAGOGY_MODEL || 'gemini-3.5-flash-lite',
};

export const CONFIDENCE_MIN = Number(process.env.SCRIBE_CONFIDENCE_MIN || 0.6);

// Bounded analysis windows (§3). Procedural tutorials are ALWAYS analyzed in
// short overlapping windows; the model returns timestamps RELATIVE to each
// window, which code deterministically converts to source time. Gemini is never
// asked to keep a trustworthy absolute clock across a long tutorial.
export const ANALYSIS_WINDOW_SEC = Number(process.env.SCRIBE_ANALYSIS_WINDOW_SEC || 75);
export const WINDOW_OVERLAP_SEC = Number(process.env.SCRIBE_WINDOW_OVERLAP_SEC || 5);
// A raw relative timestamp may exceed window duration by at most this slack
// (rounding) before it is rejected as out-of-window.
export const WINDOW_EPSILON_SEC = Number(process.env.SCRIBE_WINDOW_EPSILON_SEC || 0.75);

// Screenshot guards (§8/§9).
export const END_OF_VIDEO_MARGIN_SEC = Number(process.env.SCRIBE_END_MARGIN_SEC || 8);

// Coarse-step review signals (§7) — NOT hard failures.
export const COARSE_STEP_SEC = Number(process.env.SCRIBE_COARSE_STEP_SEC || 45);
export const COARSE_STEP_MAX_SHORTCUTS = Number(process.env.SCRIBE_COARSE_MAX_SHORTCUTS || 6);

// Bump when the generation logic changes in a way that should invalidate cached
// artifacts (used later for idempotent skip/rebuild decisions).
export const GENERATOR_VERSION = '1.2.0-prod';
// Bump when the extraction prompt/schema changes. (Reliable: idempotent rebuilds depend on it.)
export const PROMPT_VERSION = '2026-08-26.1';
// Canonical schema version — one string representation everywhere (§17).
export const SCHEMA_VERSION = '4.0';

// Approximate blended pricing ($ per 1M tokens). Deliberately rough — the
// manifest labels estimatedCost as approximate. Override via env if needed.
export const MODEL_PRICING = {
  'gemini-3.5-flash-lite': { in: 0.10, out: 0.40 },
  'gemini-3.7-flash': { in: 0.30, out: 2.50 },
};

/** Rough cost for a single call given usageMetadata. */
export function estimateCost(model, usage = {}) {
  const p = MODEL_PRICING[model] || { in: 0.15, out: 0.60 };
  const inTok = usage.promptTokenCount || 0;
  const outTok = usage.candidatesTokenCount || 0;
  return (inTok / 1e6) * p.in + (outTok / 1e6) * p.out;
}
