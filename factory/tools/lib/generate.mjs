/**
 * Inference/orchestration layer for the companion fabrication system.
 *
 *   source video
 *     → windowed Gemini analysis (default flash-lite; risk-based escalation to flash)
 *     → raw window responses preserved (immutable)
 *     → canonical schema-v4 lesson intelligence (evidence-backed, numeric timeline)
 *     → whole-video pedagogy synthesis
 *     → deterministic ffmpeg screenshots
 *
 * lesson.json is the authoritative artifact; render.mjs and the CLI turn it into a
 * companion. This module never renders instructional HTML and never invents facts.
 */
import { GoogleGenAI, FileState } from '@google/genai';
import { readFileSync, existsSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { MODELS, CONFIDENCE_MIN, ANALYSIS_WINDOW_SEC, WINDOW_OVERLAP_SEC, END_OF_VIDEO_MARGIN_SEC, SCHEMA_VERSION, GENERATOR_VERSION, PROMPT_VERSION, estimateCost } from './config.mjs';
import { timelineSchema, pedagogySchema, STEP_RULE, normalizeStep, minConfidence, toAbsoluteStep } from './schema.mjs';
import { validateRawWindow, chooseScreenshotTimestamp, coarseStepFlags, shortcutFidelityFlags, duplicateScreenshotFindings } from './validate.mjs';
import { reconcileAndDedupe } from './stitch.mjs';
import { buildDisplayGroups } from './display.mjs';
import { scrubGuide } from './sanity.mjs';
import { renderHtml } from './render.mjs';
import { extractScreenshots, hasFfmpeg, downloadYouTube } from './frames.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const PUBLIC_DRIVE_API_KEY = 'AIzaSyD6-VWZgsY8nmq0DyrQ9GegTtcrzQlvJmc';

// Deterministic renderer + ffmpeg probe re-exported for existing callers.
export const buildHtml = renderHtml;
export { hasFfmpeg };

export function getKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  const p = join(__dirname, '..', '..', '.env.local');
  if (existsSync(p)) { const m = readFileSync(p, 'utf8').match(/GEMINI_API_KEY=(.+)/); if (m) return m[1].trim(); }
  throw new Error('No GEMINI_API_KEY found (env or .env.local).');
}

export function detectInput(s) {
  s = String(s).trim();
  if (/youtube\.com|youtu\.be/.test(s)) {
    let id = null;
    try { const u = new URL(s); id = u.searchParams.get('v') || (u.hostname === 'youtu.be' ? u.pathname.slice(1) : (u.pathname.match(/\/(embed|shorts|live)\/([^/?]+)/) || [])[2]); } catch {}
    return { kind: 'youtube', id };
  }
  let id = null;
  const fm = s.match(/\/file\/d\/([A-Za-z0-9_-]+)/); if (fm) id = fm[1];
  if (!id) { try { id = new URL(s).searchParams.get('id'); } catch {} }
  if (!id && /^[A-Za-z0-9_-]{20,}$/.test(s)) id = s;
  if (!id && /^[A-Za-z0-9_-]{11}$/.test(s)) return { kind: 'youtube', id: s };
  return id ? { kind: 'drive', id } : { kind: null };
}

// Parse model JSON; if truncated, salvage the largest valid prefix.
function parseLoose(text, fallback) {
  try { return JSON.parse(text); } catch {}
  for (let i = text.length; i > 0; i--) {
    const c = text[i - 1];
    if (c === '}' || c === ']') { try { return JSON.parse(text.slice(0, i)); } catch {} }
  }
  try {
    let t = text.replace(/,\s*$/, '');
    const opens = (t.match(/[[{]/g) || []).length, closes = (t.match(/[\]}]/g) || []).length;
    return JSON.parse(t + ']}'.repeat(Math.max(0, opens - closes)));
  } catch { return fallback; }
}

const sec2ts = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// Retry transient Gemini errors; fail fast on non-retryable daily quota.
async function withRetry(fn, log = () => {}, tries = 6) {
  for (let i = 0; i < tries; i++) {
    try { return await fn(); }
    catch (e) {
      const msg = String(e?.message || e);
      if (/PerDay|free_tier|RESOURCE_EXHAUSTED|check your plan and billing/i.test(msg)) {
        throw new Error('Gemini FREE-TIER DAILY LIMIT reached. Enable billing on the API key\'s Google Cloud project (a few cents per video), or wait for the daily reset. Original: ' + msg.slice(0, 120));
      }
      const transient = /503|429|UNAVAILABLE|high demand|overloaded|rate limit|deadline|ECONNRESET|fetch failed/i.test(msg);
      if (!transient || i === tries - 1) throw e;
      const wait = Math.min(60000, 4000 * 2 ** i) + Math.floor(Math.random() * 2000);
      log(`transient error (${msg.slice(0, 48)}…) — retrying in ${Math.round(wait / 1000)}s`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
}

// ---------- analysis ----------
// Build overlapping bounded windows across the whole duration (§3).
function planWindows(durationSec) {
  if (!durationSec) return [{ startS: 0, endS: 0, durationSec: 0, whole: true }];  // unknown duration
  const W = ANALYSIS_WINDOW_SEC, stepS = Math.max(1, W - WINDOW_OVERLAP_SEC);
  const wins = [];
  for (let s = 0; s < durationSec; s += stepS) {
    const start = s, end = Math.min(s + W, durationSec);
    wins.push({ startS: start, endS: end, durationSec: end - start, whole: false });
    if (end >= durationSec) break;
  }
  return wins;
}

// One analysis call over one bounded window. Model returns WINDOW-RELATIVE times.
async function analyze(ai, videoPart, win, model, log) {
  const part = win.whole ? videoPart : { ...videoPart, videoMetadata: { startOffset: `${win.startS}s`, endOffset: `${win.endS}s` } };
  const header = win.whole
    ? `Watch this whole tutorial (about ${sec2ts(win.durationSec)} long).`
    : `This is a ${Math.round(win.durationSec)}-second clip (window ${sec2ts(win.startS)}–${sec2ts(win.endS)} of the full tutorial). Analyze ONLY this clip.`;
  const prompt = `${header} Every timestamp you output (relativeStart, relativeEnd, screenshotRelative, evidence.relativeStart, evidence.relativeEnd) is SECONDS from the START OF THIS CLIP (0 = the first frame of this clip), and must be between 0 and ${Math.round(win.durationSec)}. ${STEP_RULE}`;
  const res = await withRetry(() => ai.models.generateContent({
    model,
    contents: { parts: [part, { text: prompt }] },
    config: { responseMimeType: 'application/json', responseSchema: timelineSchema, maxOutputTokens: 16384 },
  }), log);
  return { data: parseLoose(res.text || '{}', { chapters: [] }), model, usage: res.usageMetadata || {} };
}

async function synthesize(ai, videoTitle, chapters, model, log) {
  const outline = chapters.map(c => `## ${c.title}\n${(c.steps || []).map(s => `[${sec2ts(s.start)}] (${s.importance}) ${s.title}: ${s.description}`).join('\n')}`).join('\n\n');
  const prompt = `You are a world-class instructional designer building a learning companion for the video "${videoTitle}". Here is its evidence-backed step outline:\n\n${outline}\n\nProduce whole-video pedagogy as JSON: a short title & description; a lesson classification (procedural/conceptual/overview) based on the outline; 3-5 "I can" statements; 3-6 key concepts; 4-8 vocabulary; 2-4 "now you try" activities; 3-5 related resources; a 5-question MCQ assessment (options, correct index, explanation, 2-4 graduated hints) spanning the whole video; 2-4 prediction checkpoints at real MM:SS across the video; 1-2 troubleshooting; 2-3 transfer challenges; 2-3 teach-back prompts; 3-4 retrieval-practice questions. You may ORGANIZE the material, but you MUST NOT alter or invent any source timestamps, shortcuts, numerical values, menu paths, demonstrated actions, or UI labels — those come only from the outline above. Keep these extras secondary to the procedural core.`;
  const res = await withRetry(() => ai.models.generateContent({
    model,
    contents: prompt,
    config: { responseMimeType: 'application/json', responseSchema: pedagogySchema, maxOutputTokens: 32768 },
  }), log);
  return { ped: parseLoose(res.text || '{}', {}), model, usage: res.usageMetadata || {} };
}

// ---------- video sourcing ----------
async function driveMeta(fileId) {
  return fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,mimeType,size,videoMediaMetadata(durationMillis)&key=${PUBLIC_DRIVE_API_KEY}`).then(r => r.json());
}
async function youtubeInfo(videoId) {
  let title = `YouTube Video ${videoId}`, lengthSeconds = 0;
  try { const o = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`).then(r => r.json()); if (o.title) title = o.title; } catch {}
  try {
    const page = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r => r.text());
    const m = page.match(/"lengthSeconds":"(\d+)"/) || page.match(/"approxDurationMs":"(\d+)"/);
    if (m) lengthSeconds = m[0].includes('Ms') ? Math.round(+m[1] / 1000) : +m[1];
  } catch {}
  return { title, lengthSeconds };
}

/**
 * Analyze one video into canonical lesson intelligence + provenance.
 * When `outDir` is given, raw window responses and screenshots are written there.
 * @returns rich result (see keys below). Backward-compatible extras: guide, video,
 *          videoName, durationSec, windows, frames (data URIs for legacy callers).
 */
export async function generateLessonPackage({ input, courseTitle, unitTitle, outcomes = [], outDir = null, log = () => {} }) {
  const ai = new GoogleGenAI({ apiKey: getKey() });
  const video = detectInput(input);
  if (!video.kind || !video.id) throw new Error(`Could not read a YouTube or Drive video from: ${input}`);

  const usageByModel = {};        // model -> { promptTokenCount, candidatesTokenCount, calls, cost }
  const recordUsage = (model, usage) => {
    const u = usageByModel[model] || (usageByModel[model] = { promptTokenCount: 0, candidatesTokenCount: 0, calls: 0, cost: 0 });
    u.promptTokenCount += usage.promptTokenCount || 0;
    u.candidatesTokenCount += usage.candidatesTokenCount || 0;
    u.calls += 1;
    u.cost += estimateCost(model, usage);
  };

  let videoPart, durationSec, videoName, mimeType = 'video/mp4', sizeBytes = 0, localVideoPath = null, localVideoDir = null;
  if (video.kind === 'youtube') {
    const info = await youtubeInfo(video.id);
    videoName = info.title; durationSec = info.lengthSeconds;
    videoPart = { fileData: { fileUri: `https://www.youtube.com/watch?v=${video.id}` } };
    log(`YouTube: ${videoName} (${durationSec ? sec2ts(durationSec) : 'length unknown'})`);
  } else {
    const meta = await driveMeta(video.id);
    videoName = meta.name; mimeType = meta.mimeType || 'video/mp4'; sizeBytes = +meta.size || 0;
    durationSec = Math.round((+(meta.videoMediaMetadata?.durationMillis || 0)) / 1000);
    log(`Drive: ${meta.name} (${Math.round(sizeBytes / 1048576)} MB, ${durationSec ? sec2ts(durationSec) : '?'}). Downloading + uploading to Gemini…`);
    // Prefer an authenticated download (env GDRIVE_TOKEN) — it uses the user's
    // own quota and avoids the anonymous public-key daily download cap that
    // trips after a few hundred large files. Falls back to the public key.
    const gtok = process.env.GDRIVE_TOKEN;
    const resp = await fetch(
      `https://www.googleapis.com/drive/v3/files/${video.id}?alt=media${gtok ? '' : `&key=${PUBLIC_DRIVE_API_KEY}`}`,
      gtok ? { headers: { Authorization: `Bearer ${gtok}` } } : {}
    );
    if (!resp.ok) throw new Error(`Drive download failed (${resp.status}) — is the file shared "anyone with link"?`);
    const buf = Buffer.from(await resp.arrayBuffer());
    localVideoDir = mkdtempSync(join(tmpdir(), 'sf-vid-'));
    localVideoPath = join(localVideoDir, (meta.name || 'video').replace(/[^\w.\-]/g, '_'));
    if (!/\.\w{2,4}$/.test(localVideoPath)) localVideoPath += '.mp4';
    writeFileSync(localVideoPath, buf);
    const uploaded = await ai.files.upload({ file: new Blob([buf], { type: mimeType }), config: { mimeType, displayName: meta.name } });
    let f = uploaded;
    for (let i = 0; i < 400 && f.state !== FileState.ACTIVE; i++) { if (f.state === FileState.FAILED) throw new Error('Gemini failed to process the video.'); await new Promise(r => setTimeout(r, 3000)); f = await ai.files.get({ name: uploaded.name }); }
    if (f.state !== FileState.ACTIVE) throw new Error('Gemini still processing — try again shortly.');
    videoPart = { fileData: { fileUri: f.uri, mimeType: f.mimeType } };
  }

  const rawDir = outDir ? join(outDir, 'raw') : null;
  if (rawDir && !existsSync(rawDir)) mkdirSync(rawDir, { recursive: true });

  try {
    const plan = planWindows(durationSec);
    log(`Analysis plan: ${plan.length} window(s) of ~${ANALYSIS_WINDOW_SEC}s (overlap ${WINDOW_OVERLAP_SEC}s); default ${MODELS.default}, escalation ${MODELS.escalation}.`);

    const modelCalls = [];          // §21 per-call provenance
    const windowRecords = [];
    const escalations = [];
    const rejectedTimestamps = [];  // §2/§21 out-of-window rejects (original values, not clamped)
    const collected = [];           // { chapterTitle, step (absolute) }

    const recordCall = (purpose, model, usage, window) => {
      recordUsage(model, usage);
      modelCalls.push({ purpose, model, window: window ?? null, promptTokens: usage.promptTokenCount || 0, outputTokens: usage.candidatesTokenCount || 0, approxCost: +estimateCost(model, usage).toFixed(4) });
    };

    for (let w = 0; w < plan.length; w++) {
      const win = plan[w];
      const winDur = win.whole ? (durationSec || 1e9) : win.durationSec;
      const label = win.whole ? 'whole video' : `${sec2ts(win.startS)}–${sec2ts(win.endS)}`;
      log(`  window ${w + 1}/${plan.length} (${label}) → ${MODELS.default}`);

      let out = await analyze(ai, videoPart, win, MODELS.default, log);
      recordCall('analysis', out.model, out.usage, w + 1);
      // VALIDATE window-relative output BEFORE any conversion. Reject, never clamp.
      let { validChapters, rejected } = validateRawWindow(out.data.chapters || [], winDur);
      let escalated = false;

      if (rejected.length) {
        const reasons = [...new Set(rejected.flatMap(r => r.reasons))];
        log(`    ${rejected.length} invalid step(s) [${reasons.join(', ')}] → escalating window to ${MODELS.escalation}`);
        // A single window's escalation failure must NOT abort the whole video: keep
        // the default model's already-validated steps and record the failure.
        try {
          const esc = await analyze(ai, videoPart, win, MODELS.escalation, log);
          recordCall('escalation', esc.model, esc.usage, w + 1);
          const escV = validateRawWindow(esc.data.chapters || [], winDur);
          const better = escV.rejected.length < rejected.length || escV.validChapters.flatMap(c => c.steps).length > validChapters.flatMap(c => c.steps).length;
          if (better) { out = esc; validChapters = escV.validChapters; rejected = escV.rejected; escalated = true; escalations.push({ window: w + 1, defaultModel: MODELS.default, escalationModel: MODELS.escalation, escalated: true, reasons }); }
          else escalations.push({ window: w + 1, defaultModel: MODELS.default, escalationModel: MODELS.escalation, escalated: false, reasons, note: 'escalation not kept' });
        } catch (e) {
          log(`    escalation unavailable (${String(e?.message || e).slice(0, 48)}…) — keeping default model's valid steps, dropping invalid ones`);
          escalations.push({ window: w + 1, defaultModel: MODELS.default, escalationModel: MODELS.escalation, escalated: false, reasons, note: 'escalation_failed', error: String(e?.message || e).slice(0, 120) });
        }
      }

      for (const r of rejected) rejectedTimestamps.push({ window: w + 1, ...r });
      windowRecords.push({ window: w + 1, range: win.whole ? null : [win.startS, win.endS], model: out.model, escalated, validSteps: validChapters.flatMap(c => c.steps).length, rejected: rejected.length });

      // Persist raw (immutable): chosen response + which steps were rejected & why.
      if (rawDir) writeFileSync(join(rawDir, `window-${String(w + 1).padStart(3, '0')}.json`), JSON.stringify({ window: w + 1, model: out.model, request: { startOffsetS: win.startS ?? 0, endOffsetS: win.endS ?? null, windowDurationSec: winDur }, rejected, response: out.data }, null, 2));

      // Deterministic relative → source conversion (NO clamp), tagged with window
      // ownership so overlap events can be reconciled (§3).
      const winStart = win.whole ? 0 : win.startS;
      const overStart = (win.startS || 0) + WINDOW_OVERLAP_SEC;   // overlap with previous window
      const overEnd = (win.endS || durationSec || 0) - WINDOW_OVERLAP_SEC; // overlap with next window
      for (const c of validChapters) for (const s of c.steps) {
        const step = toAbsoluteStep(s, winStart);
        const overlap = (w > 0 && step.start <= overStart) || (w < plan.length - 1 && step.start >= overEnd);
        collected.push({ chapterTitle: c.title || 'Lesson', step: { ...step, _ch: c.title || 'Lesson' }, win: w + 1, winRange: [win.startS ?? 0, win.endS ?? (durationSec || 0)], overlap });
      }

      if (plan.length > 1) await new Promise(r => setTimeout(r, 900));
    }

    // Explicit overlap reconciliation + CONSERVATIVE dedup with audit (§2–§8).
    const { canonical, report: reconciliation } = reconcileAndDedupe(collected, WINDOW_OVERLAP_SEC);
    const deduped = canonical;   // already source-ordered

    // Number + id + screenshot selection + review flags.
    let n = 1;
    const screenshotAdjustments = [];
    for (const s of deduped) {
      s.stepNumber = n; s.id = `step-${String(n).padStart(3, '0')}`; n++;
      const pick = chooseScreenshotTimestamp(s, durationSec);
      if (pick.adjusted) screenshotAdjustments.push({ step: s.stepNumber, to: pick.ts, flags: pick.flags });
      s.screenshotTimestamp = pick.ts;
      s.reviewFlags = [...new Set([...(s.reviewFlags || []), ...(pick.flags || []), ...coarseStepFlags(s), ...shortcutFidelityFlags(s)])];
      if (s.reviewFlags.some(f => /shortcut|screenshot_out_of_evidence/.test(f))) s.needsReview = true;
    }

    // Regroup into chapters by contiguous title runs (atomic-action layer).
    const chapters = [];
    for (const s of deduped) {
      const title = s._ch || 'Lesson';
      const norm = { ...normalizeStep(s), stepNumber: s.stepNumber, id: s.id, reviewFlags: s.reviewFlags, needsReview: s.needsReview, ...(s.reconciliationStatus ? { reconciliationStatus: s.reconciliationStatus } : {}) };
      const last = chapters[chapters.length - 1];
      if (last && last.title === title) last.steps.push(norm); else chapters.push({ title, steps: [norm] });
    }
    const allSteps = chapters.flatMap(c => c.steps || []);

    log('Synthesizing whole-video pedagogy (secondary to the procedural core; may not alter facts)…');
    const synth = await synthesize(ai, videoName, chapters, MODELS.pedagogy, log);
    recordCall('synthesis', synth.model, synth.usage, null);
    if (rawDir) writeFileSync(join(rawDir, 'synthesis-001.json'), JSON.stringify({ purpose: 'pedagogy_synthesis', model: synth.model, response: synth.ped }, null, 2));
    const guide = { ...synth.ped, chapters };
    // Content-sanity (§4): omit malformed/degenerate enrichment from the student
    // view; raw response stays in raw/. Never repairs prose, never re-analyzes.
    const sanityFlags = scrubGuide(guide);
    if (sanityFlags.length) log(`content-sanity: omitted ${sanityFlags.length} malformed enrichment field(s)`);
    // Student display-group layer — built from the scrubbed canonical actions.
    const displayGroups = buildDisplayGroups(guide.chapters);
    guide.displayGroups = displayGroups;

    // Deterministic screenshots. Drive uses the already-downloaded temp; YouTube
    // fetches a temporary ≤720p copy (yt-dlp) so BOTH feed the SAME ffmpeg→WebP
    // path. Source identity is unchanged; this is source-provider layer only.
    let screenshots = { files: {}, dataUris: {}, hashes: {}, format: null, captured: 0 };
    let frameMediaPath = localVideoPath, ytFrameDir = null;
    if (!frameMediaPath && outDir && video.kind === 'youtube') {
      try { ytFrameDir = mkdtempSync(join(tmpdir(), 'sf-ytframe-')); frameMediaPath = downloadYouTube(video.id, ytFrameDir, { log }); }
      catch (e) { log(`YouTube frame media unavailable (${String(e.message).slice(0, 60)}) — screenshots skipped, timestamps retained`); }
    }
    if (frameMediaPath && outDir) {
      log('Extracting screenshots (ffmpeg → WebP)…');
      screenshots = extractScreenshots(frameMediaPath, allSteps, outDir, { log: (m) => log('  ' + m) });
    }
    if (ytFrameDir) { try { rmSync(ytFrameDir, { recursive: true, force: true }); } catch {} }
    // Screenshot QA (§9/§12): identical frame across different actions, and
    // near-identical timestamps across consecutive atomic actions.
    const duplicateScreenshots = duplicateScreenshotFindings(allSteps, screenshots.hashes);
    for (const f of duplicateScreenshots) for (const s of allSteps) if (f.steps.includes(s.stepNumber)) { s.needsReview = true; if (!s.reviewFlags.includes('duplicate_screenshot')) s.reviewFlags.push('duplicate_screenshot'); }
    const nearIdenticalShots = [];
    for (let i = 1; i < allSteps.length; i++) if (Math.abs(allSteps[i].screenshotTimestamp - allSteps[i - 1].screenshotTimestamp) < 0.6) nearIdenticalShots.push({ steps: [allSteps[i - 1].stepNumber, allSteps[i].stepNumber], delta: +(allSteps[i].screenshotTimestamp - allSteps[i - 1].screenshotTimestamp).toFixed(2) });

    const coarseSteps = allSteps.filter(s => (s.reviewFlags || []).some(f => ['long_duration', 'many_shortcuts', 'many_settings', 'multiple_operations'].includes(f))).map(s => ({ step: s.stepNumber, flags: s.reviewFlags }));

    const estimatedCost = Object.values(usageByModel).reduce((a, u) => a + u.cost, 0);
    const sourceMeta = {
      type: video.kind === 'youtube' ? 'youtube' : 'google_drive',
      ...(video.kind === 'youtube' ? { youtubeVideoId: video.id } : { driveFileId: video.id }),
      filename: videoName, mimeType, sizeBytes, duration: durationSec || 0,
    };

    return {
      guide, video, videoName, durationSec, displayGroups,
      windows: plan.length, windowPlan: plan.map(w => w.whole ? 'whole' : [w.startS, w.endS]),
      screenshots: screenshots.files, screenshotDataUris: screenshots.dataUris, screenshotHashes: screenshots.hashes, screenshotFormat: screenshots.format,
      frames: screenshots.dataUris,
      windowRecords, escalations, rejectedTimestamps, modelCalls,
      screenshotAdjustments, duplicateScreenshots, nearIdenticalShots, coarseSteps, sanityFlags,
      reconciliation, dedupDropped: reconciliation.dropped.length,
      usageByModel, estimatedCost, sourceMeta,
      versions: { schemaVersion: SCHEMA_VERSION, generatorVersion: GENERATOR_VERSION, promptVersion: PROMPT_VERSION },
    };
  } finally {
    if (localVideoDir) { try { rmSync(localVideoDir, { recursive: true, force: true }); } catch {} }
  }
}

// ---------- assembly ----------
export function buildPackage(guide, video, videoName, { courseTitle, unitTitle, outcomes, lessonId, versions, classification, displayGroups } = {}) {
  const lessonName = guide.title || videoName || video.id;
  const groups = displayGroups || guide.displayGroups || [];
  // Backward-compat display fields (Course Depot reads step.timestamp/description).
  const chapters = (guide.chapters || []).map(c => ({
    ...c,
    steps: (c.steps || []).map(s => ({ ...s, timestamp: sec2ts(s.start || 0) })),
  }));
  return {
    schemaVersion: versions?.schemaVersion || SCHEMA_VERSION,
    generatorVersion: versions?.generatorVersion || GENERATOR_VERSION,
    promptVersion: versions?.promptVersion || PROMPT_VERSION,
    packageType: 'scribeit.lesson', source: 'scribe-it-cli', createdAt: new Date().toISOString(),
    lessonId: lessonId || null,
    classification: classification || guide.classification || null,
    courseTitle, course: courseTitle, unitTitle, chapterTitle: unitTitle,
    lessonTitle: lessonName, lessonType: 'single', outcomes: outcomes || [],
    workbookTitle: lessonName, workbookDescription: guide.description || '',
    displayGroups: groups,
    topics: [{
      order: 1, title: lessonName, description: guide.description || '',
      ...(video.kind === 'youtube' ? { youtubeVideoId: video.id } : { driveFileId: video.id }),
      classification: classification || guide.classification || null,
      displayGroups: groups,
      iCanStatements: guide.iCanStatements || [], keyConcepts: guide.keyConcepts || [], vocabulary: guide.vocabulary || [],
      suggestedActivities: guide.suggestedActivities || [], relatedResources: guide.relatedResources || [],
      chapters, assessment: guide.assessment || [], checkpoints: guide.checkpoints || [],
      troubleshooting: guide.troubleshooting || [], transferChallenges: guide.transferChallenges || [],
      teachBackPrompts: guide.teachBackPrompts || [], retrievalPractice: guide.retrievalPractice || [], captions: [],
    }],
  };
}

export function slugify(name, fallback) {
  return (name || fallback || 'lesson').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || fallback;
}
