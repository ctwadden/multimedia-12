/**
 * Canonical lesson schema (v4) + Gemini response schemas.
 *
 * lesson.json is the authoritative finished artifact; render.mjs is a
 * deterministic presentation of it. This module owns the Gemini responseSchemas
 * and the helpers that turn WINDOW-RELATIVE model output into canonical,
 * source-timeline steps.
 *
 * Phase 1.1 timeline fidelity:
 *  - The vision pass returns timestamps RELATIVE to the current analysis window
 *    (relativeStart/relativeEnd/screenshotRelative + evidence relative range).
 *    Code converts them to source time deterministically AFTER validation.
 *    Impossible values are rejected, never clamped.
 *  - Evidence-backed extraction only; uncertain facts → needsReview, not invented.
 */
import { Type } from '@google/genai';
import { SCHEMA_VERSION } from './config.mjs';
export { SCHEMA_VERSION };

export const BASIS_VALUES = ['visual', 'audio', 'visual_and_audio'];
export const IMPORTANCE_VALUES = ['essential', 'context'];
export const CLASSIFICATION_VALUES = ['procedural', 'conceptual', 'overview'];

// Evidence range as the model returns it: seconds RELATIVE to the window start.
const evidenceSchemaRel = {
  type: Type.OBJECT,
  properties: {
    relativeStart: { type: Type.NUMBER, description: 'seconds from THIS window start where the supporting footage begins' },
    relativeEnd: { type: Type.NUMBER, description: 'seconds from THIS window start where the supporting footage ends (must be > relativeStart)' },
    basis: { type: Type.ARRAY, items: { type: Type.STRING, enum: BASIS_VALUES } },
  },
  required: ['relativeStart', 'relativeEnd', 'basis'],
};

// One event as the vision pass returns it — ALL timestamps relative to the window.
const stepSchemaRel = {
  type: Type.OBJECT,
  properties: {
    relativeStart: { type: Type.NUMBER, description: 'seconds from THIS window start when the step begins' },
    relativeEnd: { type: Type.NUMBER, description: 'seconds from THIS window start when the step ends (must be > relativeStart)' },
    screenshotRelative: { type: Type.NUMBER, description: 'seconds from THIS window start of the single frame that best SHOWS this specific action in the software (must be within [relativeStart, relativeEnd]); never the intro/outro/presenter frame' },
    importance: { type: Type.STRING, enum: IMPORTANCE_VALUES, description: 'essential = required to reproduce the result; context = explanation/reasoning/background/optional advice' },
    application: { type: Type.STRING, description: 'OPTIONAL: the app or device this action happens in when a workflow spans several (e.g. "Unreal Engine", "JetSet", "iPhone", "DaVinci Resolve"); empty if not evident or single-app' },
    title: { type: Type.STRING, description: 'the single atomic operation, e.g. "Inset the top face"' },
    description: { type: Type.STRING, description: 'complete directions for THIS one operation, at depth matched to its difficulty' },
    menuPath: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'exact UI path segments actually used, e.g. ["Add Modifier","Generate","Bevel"]; empty if none' },
    keyboardShortcuts: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'exact keys/gestures used, preserving Numpad and mouse (e.g. "Ctrl + Numpad 7", "Alt + Shift + Left Click"). Do NOT list typed numeric values here.' },
    settings: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
      name: { type: Type.STRING }, value: { type: Type.STRING },
    }, required: ['name', 'value'] }, description: 'exact values entered/changed, e.g. {name:"Inset amount", value:"1 cm"}, {name:"Segments", value:"3"}' },
    successCheck: { type: Type.STRING, description: 'observable result of THIS operation' },
    commonMistake: { type: Type.STRING, description: 'a mistake ONLY if actually evidenced in the video; otherwise empty string' },
    annotationTargets: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
      label: { type: Type.STRING },
    }, required: ['label'] }, description: 'on-screen UI element(s) this step acts on' },
    confidence: { type: Type.NUMBER, description: 'non-authoritative reliability estimate 0-1' },
    needsReview: { type: Type.BOOLEAN, description: 'true if any fact here was uncertain/inferred rather than clearly evidenced' },
    evidence: evidenceSchemaRel,
  },
  required: ['relativeStart', 'relativeEnd', 'importance', 'title', 'description', 'evidence'],
};

export const timelineSchema = {
  type: Type.OBJECT,
  properties: {
    chapters: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
      title: { type: Type.STRING },
      steps: { type: Type.ARRAY, items: stepSchemaRel },
    }, required: ['title', 'steps'] } },
  },
  required: ['chapters'],
};

export const pedagogySchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING }, description: { type: Type.STRING },
    classification: { type: Type.STRING, enum: CLASSIFICATION_VALUES },
    iCanStatements: { type: Type.ARRAY, items: { type: Type.STRING } },
    keyConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
    vocabulary: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { term: { type: Type.STRING }, definition: { type: Type.STRING } }, required: ['term', 'definition'] } },
    suggestedActivities: { type: Type.ARRAY, items: { type: Type.STRING } },
    relatedResources: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, url: { type: Type.STRING }, type: { type: Type.STRING } } } },
    assessment: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctAnswerIndex: { type: Type.INTEGER }, explanation: { type: Type.STRING }, hints: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['question', 'options', 'correctAnswerIndex', 'explanation'] } },
    checkpoints: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { timestamp: { type: Type.STRING }, question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctAnswerIndex: { type: Type.INTEGER }, explanation: { type: Type.STRING } }, required: ['timestamp', 'question', 'options', 'correctAnswerIndex', 'explanation'] } },
    troubleshooting: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { scenario: { type: Type.STRING }, whatIsWrong: { type: Type.STRING }, cause: { type: Type.STRING }, fix: { type: Type.STRING }, prevention: { type: Type.STRING } }, required: ['scenario', 'whatIsWrong', 'cause', 'fix', 'prevention'] } },
    transferChallenges: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { level: { type: Type.STRING }, prompt: { type: Type.STRING } }, required: ['level', 'prompt'] } },
    teachBackPrompts: { type: Type.ARRAY, items: { type: Type.STRING } },
    retrievalPractice: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctAnswerIndex: { type: Type.INTEGER }, explanation: { type: Type.STRING } }, required: ['question', 'options', 'correctAnswerIndex', 'explanation'] } },
  },
  required: ['title', 'description', 'classification', 'iCanStatements', 'assessment'],
};

// ---------- prompt fragment ----------
export const STEP_RULE = [
  'Timestamps are SECONDS RELATIVE TO THIS WINDOW (0 = window start). Keep relativeEnd > relativeStart and screenshotRelative within [relativeStart, relativeEnd].',
  'ATOMIC STEPS: each step is ONE meaningful learner operation. A single operation with its keystrokes may stay together (e.g. "Inset faces" using I then typing 1cm), but DO NOT bundle independent operations (e.g. Enter Edit Mode + Scale + Inset + Extrude) into one step — split them.',
  'EVIDENCE-BACKED ONLY — never invent. Do not state a shortcut, numeric value, menu path, UI label, modifier, node/tool name, filename, or setting unless shown on screen or clearly said. If uncertain, set needsReview=true and omit the guessed value; keep the evidence range.',
  'SHORTCUT FIDELITY: preserve exact keys including Numpad ("Numpad 1", "Ctrl + Numpad 7") and full mouse gestures ("Alt + Shift + Left Click"). Do NOT reduce Numpad keys to plain numbers. Do NOT put a bare modifier ("Ctrl", "Alt+Shift") as a complete action.',
  'TYPED VALUES ARE SETTINGS, NOT SHORTCUTS: a value typed during an operation (Inset 1 cm, Segments 3) goes in settings, never as a keyboard shortcut chip.',
  'SCREENSHOT: screenshotRelative must show THIS specific action in the software UI — never the intro, outro, or presenter/talking-head frame.',
  'IMPORTANCE: mark essential only for critical-path actions; mark narration/explanation/philosophy as context. Do not manufacture context to hit a ratio, and do not turn narration into a fake command.',
  'COMMON MISTAKE: include only if actually evidenced; otherwise leave empty.',
  'confidence is non-authoritative metadata; still fill it, but base decisions on evidence.',
].join(' ');

// ---------- helpers ----------
const num = (v, d = 0) => (typeof v === 'number' && isFinite(v) ? v : d);

/**
 * Convert a window-relative step to a source-timeline step by ADDING the window
 * offset. No clamping — callers must have validated the relative values first.
 */
export function toAbsoluteStep(rel = {}, windowStartS = 0) {
  const ev = rel.evidence || {};
  return {
    start: windowStartS + num(rel.relativeStart, 0),
    end: windowStartS + num(rel.relativeEnd, 0),
    screenshotTimestamp: windowStartS + num(rel.screenshotRelative, num(rel.relativeStart, 0)),
    importance: rel.importance,
    ...(rel.application ? { application: rel.application } : {}),
    title: rel.title,
    description: rel.description,
    menuPath: rel.menuPath,
    keyboardShortcuts: rel.keyboardShortcuts,
    settings: rel.settings,
    successCheck: rel.successCheck,
    commonMistake: rel.commonMistake,
    annotationTargets: rel.annotationTargets,
    confidence: rel.confidence,
    needsReview: rel.needsReview,
    evidence: {
      start: windowStartS + num(ev.relativeStart, num(rel.relativeStart, 0)),
      end: windowStartS + num(ev.relativeEnd, num(rel.relativeEnd, 0)),
      basis: Array.isArray(ev.basis) ? ev.basis : [],
    },
  };
}

/** Ensure a source-timeline step has every canonical v4 field (no clamping). */
export function normalizeStep(s = {}) {
  const start = num(s.start, 0);
  const end = num(s.end, start);
  const ev = s.evidence || {};
  return {
    start, end,
    importance: IMPORTANCE_VALUES.includes(s.importance) ? s.importance : 'context',
    ...(s.application ? { application: String(s.application) } : {}),
    title: s.title || '',
    description: s.description || '',
    menuPath: Array.isArray(s.menuPath) ? s.menuPath.filter(Boolean) : (s.menuPath ? String(s.menuPath).split('>').map(x => x.trim()).filter(Boolean) : []),
    keyboardShortcuts: Array.isArray(s.keyboardShortcuts) ? s.keyboardShortcuts.filter(Boolean) : [],
    settings: Array.isArray(s.settings) ? s.settings.filter(x => x && x.name) : [],
    successCheck: s.successCheck || '',
    commonMistake: s.commonMistake ? s.commonMistake : null,
    screenshotTimestamp: num(s.screenshotTimestamp, start),
    annotationTargets: Array.isArray(s.annotationTargets) ? s.annotationTargets.filter(x => x && x.label) : [],
    confidence: typeof s.confidence === 'number' ? s.confidence : 0.5,
    needsReview: s.needsReview === true,
    reviewFlags: Array.isArray(s.reviewFlags) ? s.reviewFlags : [],
    evidence: {
      start: num(ev.start, start),
      end: num(ev.end, end),
      basis: Array.isArray(ev.basis) ? ev.basis.filter(b => BASIS_VALUES.includes(b)) : [],
    },
    ...(s.id ? { id: s.id } : {}),
    ...(s.stepNumber ? { stepNumber: s.stepNumber } : {}),
  };
}

/** Lowest self-reported step confidence (non-authoritative). */
export function minConfidence(chapters = []) {
  let min = 1;
  for (const c of chapters) for (const s of c.steps || []) if (typeof s.confidence === 'number' && s.confidence < min) min = s.confidence;
  return min;
}
