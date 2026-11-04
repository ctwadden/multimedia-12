/**
 * Shared workbook-generation engine for the Scribe It CLIs.
 * - Short videos: one Gemini pass.
 * - Long videos: analyze in time windows (Gemini `videoMetadata` offsets) for
 *   FULL, even coverage, then a text-only synthesis pass builds the whole-video
 *   pedagogy (I-can, concepts, vocab, quiz, checkpoints, transfer, retrieval).
 * Additive: used only by the tools, never by the deployed apps.
 */
import { GoogleGenAI, Type, FileState } from '@google/genai';
import { readFileSync, existsSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const PUBLIC_DRIVE_API_KEY = 'AIzaSyD6-VWZgsY8nmq0DyrQ9GegTtcrzQlvJmc';

const WINDOW_SECONDS = 8 * 60;     // analyze long videos in 8-minute windows
const SINGLE_PASS_MAX = 12 * 60;   // videos this short get one pass

// Models are configurable so the same tool works on the free tier (flash for
// everything) or the "most effective" paid setup (flash reads the video cheaply,
// a stronger model writes the pedagogy). Override with env vars.
const VISION_MODEL = process.env.SCRIBE_VISION_MODEL || 'gemini-3.5-flash';
const PEDAGOGY_MODEL = process.env.SCRIBE_PEDAGOGY_MODEL || 'gemini-3.5-flash';

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

// Parse model JSON; if it was truncated, salvage the largest valid prefix.
function parseLoose(text, fallback) {
  try { return JSON.parse(text); } catch {}
  // Trim to the last balanced brace/bracket so a truncated array/object still parses.
  for (let i = text.length; i > 0; i--) {
    const c = text[i - 1];
    if (c === '}' || c === ']') {
      for (let j = i; j <= text.length; j++) {
        try { return JSON.parse(text.slice(0, i)); } catch { break; }
      }
    }
  }
  // Last resort: close open structures.
  try {
    let t = text.replace(/,\s*$/, '');
    const opens = (t.match(/[[{]/g) || []).length, closes = (t.match(/[\]}]/g) || []).length;
    return JSON.parse(t + '"'.repeat(0) + ']}'.repeat(Math.max(0, opens - closes)));
  } catch { return fallback; }
}

const sec2ts = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const ts2sec = (t) => { const p = String(t || '0').split(':').map(Number); return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p.length === 2 ? p[0] * 60 + p[1] : (p[0] || 0); };

export function hasFfmpeg() {
  try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true; } catch { return false; }
}

// Grab a real frame from the local video at each step's timestamp -> data URI.
// Authentic per-step screenshots for the printable workbook (Drive/local only).
export function extractFrames(videoPath, steps, log = () => {}) {
  if (!hasFfmpeg()) { log('ffmpeg not found — skipping per-step frames.'); return {}; }
  const dir = mkdtempSync(join(tmpdir(), 'sf-frames-'));
  const map = {};
  let ok = 0;
  for (const s of steps) {
    const out = join(dir, `f${s.stepNumber}.jpg`);
    try {
      execFileSync('ffmpeg', ['-ss', String(ts2sec(s.timestamp)), '-i', videoPath, '-frames:v', '1', '-q:v', '4', '-vf', 'scale=640:-1', '-y', out], { stdio: 'ignore', timeout: 30000 });
      map[s.stepNumber] = 'data:image/jpeg;base64,' + readFileSync(out).toString('base64');
      ok++;
    } catch { /* skip this frame */ }
  }
  rmSync(dir, { recursive: true, force: true });
  log(`captured ${ok}/${steps.length} step frames.`);
  return map;
}

// ---------- schemas ----------
const timelineSchema = {
  type: Type.OBJECT,
  properties: {
    chapters: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
      title: { type: Type.STRING },
      steps: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
        timestamp: { type: Type.STRING }, title: { type: Type.STRING }, description: { type: Type.STRING },
        why: { type: Type.STRING }, check: { type: Type.STRING }, fix: { type: Type.STRING },
      }, required: ['timestamp', 'title', 'description'] } },
    }, required: ['title', 'steps'] } },
  },
  required: ['chapters'],
};

const pedagogySchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING }, description: { type: Type.STRING },
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
    realWorldConnection: { type: Type.STRING },
    essentialQuestion: { type: Type.STRING },
    prerequisites: { type: Type.ARRAY, items: { type: Type.STRING } },
    evidence: { type: Type.OBJECT, properties: { observation: { type: Type.ARRAY, items: { type: Type.STRING } }, conversation: { type: Type.ARRAY, items: { type: Type.STRING } }, product: { type: Type.ARRAY, items: { type: Type.STRING } } } },
    reflectionPrompts: { type: Type.ARRAY, items: { type: Type.STRING } },
    sources: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, note: { type: Type.STRING } } } },
  },
  required: ['title', 'description', 'iCanStatements', 'assessment'],
};

const STEP_RULE = 'Each step description must be complete written directions a student could follow WITHOUT the video: name exact menus/tools/values. 2-4 full sentences. Also give, for each step: why (the design/technical reason the step matters, not a restatement of the action), check (ONE observable success condition — "you should now see…"), and fix (the most likely thing that goes wrong and how to correct it).';

// Retry transient Gemini errors (503 overloaded / per-minute 429) with backoff.
// A daily free-tier quota exhaustion is NOT retryable — fail fast and explain.
async function withRetry(fn, log = () => {}, tries = 6) {
  for (let i = 0; i < tries; i++) {
    try { return await fn(); }
    catch (e) {
      const msg = String(e?.message || e);
      if (/PerDay|free_tier|RESOURCE_EXHAUSTED|check your plan and billing/i.test(msg)) {
        throw new Error('Gemini FREE-TIER DAILY LIMIT reached (20 requests/day for gemini-2.5-flash). Enable billing on the API key\'s Google Cloud project for the batch workflow (gemini-2.5-flash is a few cents per video), or wait for the daily reset. Original: ' + msg.slice(0, 120));
      }
      const transient = /503|429|UNAVAILABLE|high demand|overloaded|rate limit|deadline|ECONNRESET|fetch failed/i.test(msg);
      if (!transient || i === tries - 1) throw e;
      const wait = Math.min(60000, 4000 * 2 ** i) + Math.floor(Math.random() * 2000);
      log(`transient error (${msg.slice(0, 48)}…) — retrying in ${Math.round(wait / 1000)}s`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
}

// ---------- Gemini calls ----------
async function analyzeWindow(ai, videoPart, startS, endS, fullLen, log) {
  const part = { ...videoPart, videoMetadata: { startOffset: `${startS}s`, endOffset: `${endS}s` } };
  const prompt = `This is the clip from ${sec2ts(startS)} to ${sec2ts(endS)} of a ${sec2ts(fullLen)} tutorial. List the chapters and step-by-step actions IN THIS CLIP ONLY. Give each step's timestamp as MM:SS measured from THIS CLIP's start (00:00 = start of this clip). ${STEP_RULE}`;
  const res = await withRetry(() => ai.models.generateContent({
    model: VISION_MODEL,
    contents: { parts: [part, { text: prompt }] },
    config: { responseMimeType: 'application/json', responseSchema: timelineSchema, maxOutputTokens: 16384 },
  }), log);
  const data = parseLoose(res.text || '{}', { chapters: [] });
  // Shift clip-relative timestamps into the full-video timeline.
  for (const c of data.chapters || []) for (const s of c.steps || []) {
    let t = ts2sec(s.timestamp);
    if (t <= (endS - startS) + 5) t += startS;         // clip-relative -> absolute
    s.timestamp = sec2ts(Math.min(t, fullLen));
  }
  return data.chapters || [];
}

async function analyzeFull(ai, videoPart, log) {
  const prompt = `Watch this whole video and list its chapters and step-by-step actions with MM:SS timestamps. ${STEP_RULE}`;
  const res = await withRetry(() => ai.models.generateContent({
    model: VISION_MODEL,
    contents: { parts: [videoPart, { text: prompt }] },
    config: { responseMimeType: 'application/json', responseSchema: timelineSchema, maxOutputTokens: 16384 },
  }), log);
  return parseLoose(res.text || '{}', { chapters: [] }).chapters || [];
}

export async function synthesize(ai, videoTitle, chapters, log, domain = 'software') {
  const outline = chapters.map(c => `## ${c.title}\n${c.steps.map(s => `[${s.timestamp}] ${s.title}: ${s.description}`).join('\n')}`).join('\n\n');
  const inquiry = /inquiry|digital.?society|humanities|social/i.test(domain);
  const lens = inquiry
    ? 'This is an INQUIRY / Digital Society lesson. Frame steps as analysis/reasoning moves, "sources" as real articles, datasets, cases or documents, and reasoning as claim → evidence → reasoning.'
    : 'This is a SOFTWARE / technique lesson. Frame steps as software operations, "sources" as tools/official docs/assets, and reasoning as tool-choice justification.';
  const prompt = `You are a world-class instructional designer building a learning workbook for the video "${videoTitle}". ${lens}\n\nHere is its full step-by-step outline with timestamps:\n\n${outline}\n\nProduce the whole-video pedagogy as JSON: a short title & description; an essentialQuestion (the one driving question this lesson answers); a realWorldConnection (2-3 sentences on why this matters professionally / in the real world); 2-4 prerequisites (what a learner should already know); 3-5 "I can" statements; 3-6 key concepts; 4-8 vocabulary term+definition; 2-4 "now you try" activities; an evidence object with observation (2-3 things a teacher could WATCH the student do), conversation (2-3 things the student should be able to EXPLAIN), and product (2-3 things visible in the finished WORK); 3-5 sources (title + a short note each); 2-3 reflectionPrompts; a 5-question multiple-choice assessment (options, correct index, explanation, 2-4 graduated hints each) spanning the WHOLE video; 2-4 prediction checkpoints pinned to real timestamps across the whole video; 1-2 troubleshooting challenges; 2-3 transfer challenges (near/moderate/advanced); 2-3 teach-back prompts; 3-4 retrieval-practice questions. Cover the full timeline, not just the beginning. Keep every section specific to THIS lesson's actual content.`;
  const res = await withRetry(() => ai.models.generateContent({
    model: PEDAGOGY_MODEL,
    contents: prompt,
    config: { responseMimeType: 'application/json', responseSchema: pedagogySchema, maxOutputTokens: 32768 },
  }), log);
  return parseLoose(res.text || '{}', {});
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
 * Generate a lesson package for one video.
 * @returns {{ pkg, guide, videoName, durationSec, windows, video }}
 */
export async function generateLessonPackage({ input, courseTitle, unitTitle, outcomes = [], domain = 'software', log = () => {} }) {
  const ai = new GoogleGenAI({ apiKey: getKey() });
  const video = detectInput(input);
  if (!video.kind || !video.id) throw new Error(`Could not read a YouTube or Drive video from: ${input}`);

  let videoPart, durationSec, videoName, localVideoPath = null, localVideoDir = null;
  if (video.kind === 'youtube') {
    const info = await youtubeInfo(video.id);
    videoName = info.title; durationSec = info.lengthSeconds;
    videoPart = { fileData: { fileUri: `https://www.youtube.com/watch?v=${video.id}` } };
    log(`YouTube: ${videoName} (${durationSec ? sec2ts(durationSec) : 'length unknown'})`);
  } else {
    const meta = await driveMeta(video.id);
    videoName = meta.name; durationSec = Math.round((+(meta.videoMediaMetadata?.durationMillis || 0)) / 1000);
    log(`Drive: ${meta.name} (${Math.round((+meta.size || 0) / 1048576)} MB, ${durationSec ? sec2ts(durationSec) : '?'}). Downloading + uploading to Gemini…`);
    const resp = await fetch(`https://www.googleapis.com/drive/v3/files/${video.id}?alt=media&key=${PUBLIC_DRIVE_API_KEY}`);
    if (!resp.ok) throw new Error(`Drive download failed (${resp.status}) — is the file shared "anyone with link"?`);
    // Keep a local copy so we can also pull real per-step frames with ffmpeg.
    const buf = Buffer.from(await resp.arrayBuffer());
    localVideoDir = mkdtempSync(join(tmpdir(), 'sf-vid-'));
    localVideoPath = join(localVideoDir, (meta.name || 'video').replace(/[^\w.\-]/g, '_'));
    if (!/\.\w{2,4}$/.test(localVideoPath)) localVideoPath += '.mp4';
    writeFileSync(localVideoPath, buf);
    const uploaded = await ai.files.upload({ file: new Blob([buf], { type: meta.mimeType || 'video/mp4' }), config: { mimeType: meta.mimeType || 'video/mp4', displayName: meta.name } });
    let f = uploaded;
    for (let i = 0; i < 400 && f.state !== FileState.ACTIVE; i++) { if (f.state === FileState.FAILED) throw new Error('Gemini failed to process the video.'); await new Promise(r => setTimeout(r, 3000)); f = await ai.files.get({ name: uploaded.name }); }
    if (f.state !== FileState.ACTIVE) throw new Error('Gemini still processing — try again shortly.');
    videoPart = { fileData: { fileUri: f.uri, mimeType: f.mimeType } };
  }

  // Everything after the (large) download runs inside try/finally so the
  // local temp video is always cleaned up, even if a model call fails.
  try {
    // Build the timeline (chunked for long videos, single pass for short).
    let chapters = [], windows = 1;
    if (durationSec && durationSec > SINGLE_PASS_MAX) {
      windows = Math.ceil(durationSec / WINDOW_SECONDS);
      log(`Long video → ${windows} windows of ${WINDOW_SECONDS / 60} min for full coverage.`);
      for (let w = 0; w < windows; w++) {
        const start = w * WINDOW_SECONDS, end = Math.min((w + 1) * WINDOW_SECONDS, durationSec);
        log(`  window ${w + 1}/${windows} (${sec2ts(start)}–${sec2ts(end)})…`);
        const chs = await analyzeWindow(ai, videoPart, start, end, durationSec, log);
        chapters.push(...chs);
        await new Promise(r => setTimeout(r, 1500));
      }
    } else {
      log('Short video → single pass.');
      chapters = await analyzeFull(ai, videoPart, log);
    }
    let n = 1; for (const c of chapters) for (const s of c.steps || []) s.stepNumber = n++;

    log('Synthesizing whole-video workbook (concepts, quiz, checkpoints, transfer)…');
    const ped = await synthesize(ai, videoName, chapters, log, domain);
    const guide = { ...ped, chapters };

    let frames = {};
    if (localVideoPath) {
      log('Capturing a real frame at each step…');
      frames = extractFrames(localVideoPath, chapters.flatMap(c => c.steps || []), log);
    }
    return { guide, frames, video, videoName, durationSec, windows };
  } finally {
    if (localVideoDir) { try { rmSync(localVideoDir, { recursive: true, force: true }); } catch {} }
  }
}

// ---------- assembly ----------
export function buildPackage(guide, video, videoName, { courseTitle, unitTitle, outcomes }) {
  const lessonName = guide.title || videoName || video.id;
  return {
    schemaVersion: 3, packageType: 'scribeit.lesson', source: 'scribe-it-cli', createdAt: new Date().toISOString(),
    courseTitle, course: courseTitle, unitTitle, chapterTitle: unitTitle,
    lessonTitle: lessonName, lessonType: 'single', outcomes: outcomes || [],
    workbookTitle: lessonName, workbookDescription: guide.description || '',
    topics: [{
      order: 1, title: lessonName, description: guide.description || '',
      ...(video.kind === 'youtube' ? { youtubeVideoId: video.id } : { driveFileId: video.id }),
      iCanStatements: guide.iCanStatements || [], keyConcepts: guide.keyConcepts || [], vocabulary: guide.vocabulary || [],
      suggestedActivities: guide.suggestedActivities || [], relatedResources: guide.relatedResources || [],
      chapters: guide.chapters || [], assessment: guide.assessment || [], checkpoints: guide.checkpoints || [],
      troubleshooting: guide.troubleshooting || [], transferChallenges: guide.transferChallenges || [],
      teachBackPrompts: guide.teachBackPrompts || [], retrievalPractice: guide.retrievalPractice || [], captions: [],
    }],
  };
}

const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/**
 * LOCKED workbook template — one consistent look for every lesson. Sections
 * render in a fixed order and style; a section with no data is simply omitted,
 * so output stays consistent whether the AI produced a lot or a little.
 * @param {object} meta optional { course, outcomes:[{code,wording}], part:{index,total} }
 */
export function buildHtml(guide, video, frames = {}, startSeconds = 0, meta = {}) {
  const start = Math.max(0, Math.floor(startSeconds || 0));
  const isYT = video.kind === 'youtube';
  const chapters = guide.chapters || [];
  const list = (arr, cls = '') => (arr && arr.length) ? `<ul class="${cls}">${arr.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '';
  const section = (id, label, title, body) => body ? `<section class="sec" id="${id}"><div class="kicker">${esc(label)}</div><h2>${esc(title)}</h2>${body}</section>` : '';

  // --- video player: YouTube is seekable (chapters jump it); Drive can only scroll ---
  const playerHtml = isYT
    ? `<div class="shell"><div id="yt-player" data-vid="${esc(video.id)}" data-start="${start}"></div></div>`
    : `<div class="shell"><iframe src="https://drive.google.com/file/d/${esc(video.id)}/preview" allowfullscreen></iframe></div>`;

  // --- chapters + numbered steps (data-seek drives the YouTube player) ---
  const chapterNav = chapters.length ? `<nav class="chapters"><div class="kicker">Chapters</div><ol>${chapters.map((c, i) => {
    const ts = c.steps?.[0]?.timestamp;
    return `<li><a href="#ch-${i}" data-seek="${ts2sec(ts || '0')}">${esc(c.title)}</a>${ts ? `<span class="ts">${esc(ts)}</span>` : ''}</li>`;
  }).join('')}</ol></nav>` : '';
  const pid = meta.project || '';
  const stepsHtml = chapters.map((c, i) => `<section class="chapter" id="ch-${i}"><h3>${esc(c.title)}</h3>${(c.steps || []).map(st => {
    const img = frames[st.stepNumber] ? `<img class="frame" src="${frames[st.stepNumber]}" alt="Step ${esc(st.stepNumber)}" loading="lazy">` : '';
    const watch = (isYT && st.timestamp) ? `<button class="watch" data-seek="${ts2sec(st.timestamp)}" title="Jump the video to here">▶ Watch</button>` : '';
    const wcf = [
      st.why && `<div class="wcf why"><b>Why</b> ${esc(st.why)}</div>`,
      st.check && `<div class="wcf check"><b>Check</b> ${esc(st.check)}</div>`,
      st.fix && `<div class="wcf fix"><b>Fix</b> ${esc(st.fix)}</div>`,
    ].filter(Boolean).join('');
    const stepId = `${pid ? pid + '-' : ''}S${String(st.stepNumber).padStart(2, '0')}`;
    return `<div class="step" id="step-${esc(st.stepNumber)}" data-project-step-id="${esc(stepId)}"${pid ? ` data-project-id="${esc(pid)}"` : ''}><div class="step-h"><span class="num">${esc(st.stepNumber)}</span><span class="step-t">${esc(st.title)}</span>${st.timestamp ? `<span class="ts">${esc(st.timestamp)}</span>` : ''}${watch}</div>${img}<p>${esc(st.description)}</p>${wcf}</div>`;
  }).join('')}</section>`).join('');

  // --- interactive quiz ---
  const quiz = (guide.assessment || []).map((q, i) => `<div class="q" data-correct="${q.correctAnswerIndex}"><p class="qq">${i + 1}. ${esc(q.question)}</p>
    <div class="opts">${(q.options || []).map((o, j) => `<label><input type="radio" name="q${i}" value="${j}"><span>${esc(o)}</span></label>`).join('')}</div>
    <div class="exp"><b>Answer:</b> ${esc(q.options?.[q.correctAnswerIndex])} — ${esc(q.explanation)}</div></div>`).join('');

  const vocab = (guide.vocabulary || []).length ? `<dl class="vocab">${guide.vocabulary.map(v => `<dt>${esc(v.term)}</dt><dd>${esc(v.definition)}</dd>`).join('')}</dl>` : '';
  const transfer = (guide.transferChallenges || []).length ? `<ul class="transfer">${guide.transferChallenges.map(t => `<li><span class="lvl">${esc(t.level)}</span> ${esc(t.prompt)}</li>`).join('')}</ul>` : '';
  const outcomes = (meta.outcomes || []).length ? `<ul class="outcomes">${meta.outcomes.map(o => `<li><b>${esc((meta.course ? meta.course + ' ' : '') + o.code)}</b> ${esc(o.wording || '')}</li>`).join('')}</ul>` : '';
  const partTag = meta.part ? `<span class="part">Part ${esc(meta.part.index)} of ${esc(meta.part.total)}</span>` : '';
  const evb = guide.evidence || {};
  const evCols = [['observation', 'Observation', 'what to watch them DO'], ['conversation', 'Conversation', 'what they can EXPLAIN'], ['product', 'Product', "what's in the finished work"]];
  const evHtml = evCols.some(([k]) => (evb[k] || []).length) ? `<div class="evi">${evCols.map(([k, lab, sub]) => (evb[k] || []).length ? `<div class="evi-col"><h4>${lab}</h4><div class="evi-sub">${sub}</div>${list(evb[k])}</div>` : '').join('')}</div>` : '';
  const sources = (guide.sources || []).length ? `<ul class="sources">${guide.sources.map(x => `<li><b>${esc(x.title)}</b>${x.note ? ` — ${esc(x.note)}` : ''}</li>`).join('')}</ul>` : '';
  const coachBlock = `<div class="coach"><a href="${esc(meta.coachUrl || '#')}"${meta.coachUrl ? ' target="_blank" rel="noreferrer"' : ''}>Open Assistant Coach ↗</a><button type="button" id="copyCoach">Copy context for Coach</button></div>
<script type="application/json" id="coach-context">${esc(JSON.stringify({ project_id: meta.project || null, course: meta.course || null, task_title: guide.title, outcome_codes: (meta.outcomes || []).map(o => o.code), principle: 'Reduce friction, not thinking — the coach supports access, not the assessed thinking.' }))}</script>`;
  const statusBar = `<div class="statusbar">Status: <b>${esc(meta.status || 'Draft')}</b>${meta.project ? ` · Project <b>${esc(meta.project)}</b>` : ''}${meta.course ? ` · ${esc(meta.course)}` : ''} · Generated by Scribe It ${new Date().toISOString().slice(0, 10)} · <b>Not yet teacher-verified</b> — fill the teacher-only items (assets, IDs, assessment launcher) before publishing.</div>`;

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(guide.title)}</title><style>
:root{--ink:#17313e;--accent:#0f766e;--accent2:#0ea5a3;--line:#d7e3e8;--soft:#eef6f5;--muted:#5d7280;--paper:#f6f9fa}
*{box-sizing:border-box}body{font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;background:var(--paper);color:var(--ink);line-height:1.6;margin:0}
.wrap{max-width:1180px;margin:0 auto;padding:28px 22px 80px}
.hero{background:linear-gradient(135deg,#0f766e,#134e4a);color:#fff;border-radius:20px;padding:30px 32px;margin-bottom:26px}
.hero h1{margin:.1em 0;font-size:2rem;line-height:1.15}.hero p{color:#d6f0ec;margin:.3em 0 0;max-width:70ch}
.part{display:inline-block;background:#ffffff26;border:1px solid #ffffff44;border-radius:999px;padding:3px 11px;font-size:.78rem;font-weight:800;letter-spacing:.04em}
.layout{display:grid;gap:26px}@media(min-width:1000px){.layout{grid-template-columns:minmax(360px,42%) 1fr}.left{position:sticky;top:18px;align-self:start}}
.shell{aspect-ratio:16/9;border-radius:16px;overflow:hidden;background:#000;box-shadow:0 10px 30px #0f766e22}.shell iframe{width:100%;height:100%;border:0;display:block}
.kicker{text-transform:uppercase;letter-spacing:.08em;font-size:.72rem;font-weight:800;color:var(--accent)}
.sec,.chapters{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px 20px;margin:0 0 18px}
.sec h2{margin:.15em 0 .5em;font-size:1.15rem}
.can{background:var(--soft);border:1px solid var(--line);border-left:6px solid var(--accent);border-radius:12px;padding:14px 18px;margin:0 0 18px}
.can .kicker{color:var(--accent)}.can ul{margin:.4em 0 0;padding-left:1.1em}.can li{margin:.2em 0;font-weight:600}
.chapters ol{margin:.4em 0 0;padding-left:1.2em}.chapters li{margin:.25em 0}.chapters a{color:var(--ink);text-decoration:none;font-weight:600}.chapters a:hover{color:var(--accent)}
.chapter h3{border-bottom:2px solid var(--line);padding-bottom:.3em;margin:26px 0 10px;font-size:1.1rem}
.step{border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin:10px 0;background:#fff}
.step-h{display:flex;align-items:center;gap:10px;margin-bottom:.4em}
.num{flex:none;width:26px;height:26px;border-radius:50%;background:var(--accent);color:#fff;font-weight:800;font-size:.85rem;display:flex;align-items:center;justify-content:center}
.step-t{font-weight:800;flex:1}.ts{font:700 .75rem ui-monospace,monospace;background:var(--soft);color:var(--accent);padding:2px 8px;border-radius:6px}
.watch{flex:none;background:var(--accent);color:#fff;border:0;border-radius:6px;padding:3px 9px;font:800 .72rem inherit;cursor:pointer;box-shadow:none}.watch:hover{background:var(--accent2)}
.shell #yt-player{width:100%;height:100%}.chapters a{cursor:pointer}
.frame{width:100%;border-radius:10px;margin:.5em 0;border:1px solid var(--line);display:block}
.wcf{border-left:4px solid;padding:7px 12px;margin:8px 0 0;border-radius:0 8px 8px 0;font-size:.9rem}
.wcf b{display:inline-block;min-width:46px;text-transform:uppercase;font-size:.68rem;letter-spacing:.05em}
.wcf.why{border-color:#0ea5a3;background:#ecfeff}.wcf.check{border-color:#16a34a;background:#f0fdf4}.wcf.fix{border-color:#d97706;background:#fffbeb}
.coach{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 0}.coach a,.coach button{font:800 .78rem inherit;padding:7px 12px;border-radius:8px;text-decoration:none}
.coach a{background:var(--accent);color:#fff}.coach button{background:#fff;color:var(--accent);border:1px solid var(--line)}
.statusbar{margin:22px 0 0;padding:12px 16px;border:1px dashed var(--line);border-radius:12px;color:var(--muted);font-size:.82rem}
.statusbar b{color:var(--ink)}
.vocab{display:grid;grid-template-columns:1fr;gap:.2em .8em;margin:0}@media(min-width:560px){.vocab{grid-template-columns:auto 1fr}}
.vocab dt{font-weight:800;color:var(--accent)}.vocab dd{margin:0 0 .4em}
.q{border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin:10px 0}.qq{font-weight:800;margin:.1em 0 .5em}
.opts{display:grid;gap:6px}.opts label{display:flex;gap:8px;align-items:flex-start;padding:7px 10px;border:1px solid var(--line);border-radius:8px;cursor:pointer}
.opts label:hover{background:var(--soft)}.q.show .opts label.correct{background:#dcfce7;border-color:#16a34a}.q.show .opts label.wrong{background:#fee2e2;border-color:#dc2626}
.exp{display:none;margin-top:10px;padding:10px 12px;background:var(--soft);border-radius:8px;font-size:.92rem}.q.show .exp{display:block}
.transfer{padding-left:0;list-style:none}.transfer li{border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin:8px 0}
.lvl{display:inline-block;background:var(--soft);color:var(--accent);font-weight:800;font-size:.72rem;text-transform:uppercase;padding:2px 8px;border-radius:6px;margin-right:6px}
.outcomes{padding-left:1.1em}.outcomes li{margin:.25em 0}
.eq p{font-size:1.05rem;font-weight:700;margin:.3em 0 0}
.evi{display:grid;gap:12px}@media(min-width:620px){.evi{grid-template-columns:1fr 1fr 1fr}}
.evi-col{background:var(--soft);border:1px solid var(--line);border-radius:10px;padding:12px}
.evi-col h4{margin:0;color:var(--accent);font-size:.95rem}.evi-sub{font-size:.72rem;color:var(--muted);margin:2px 0 6px}
.evi-col ul{margin:0;padding-left:1.1em}.evi-col li{margin:.2em 0;font-size:.9rem}
.sources{padding-left:1.1em}.sources li{margin:.25em 0}
.bar{position:fixed;right:18px;bottom:18px;display:flex;gap:8px;z-index:50}
button{background:var(--accent);color:#fff;border:0;border-radius:10px;padding:10px 14px;font-weight:800;cursor:pointer;box-shadow:0 6px 18px #0f766e33}
button.ghost{background:#fff;color:var(--accent);border:1px solid var(--line)}
@media print{.bar,.shell{display:none}.layout{display:block}.q .exp{display:block}.opts label{border-color:#bbb}}
</style></head><body><div class="wrap">
<header class="hero">${partTag}<h1>${esc(guide.title)}</h1>${guide.description ? `<p>${esc(guide.description)}</p>` : ''}</header>
<div class="layout">
  <div class="left">${playerHtml}${chapterNav}</div>
  <div class="right">
    ${guide.essentialQuestion ? `<div class="can eq"><div class="kicker">Essential question</div><p>${esc(guide.essentialQuestion)}</p></div>` : ''}
    ${section('realworld', 'Why it matters', 'Real-world connection', guide.realWorldConnection ? `<p>${esc(guide.realWorldConnection)}</p>` : '')}
    ${guide.iCanStatements?.length ? `<div class="can"><div class="kicker">I can…</div>${list(guide.iCanStatements)}</div>` : ''}
    ${coachBlock}
    ${section('outcomes', 'Curriculum', 'Outcomes this lesson evidences', outcomes)}
    ${section('prereq', 'Before you start', 'Prerequisites', list(guide.prerequisites))}
    ${section('concepts', 'Big ideas', 'Key concepts', list(guide.keyConcepts))}
    ${section('vocab', 'Language', 'Vocabulary', vocab)}
    <section class="sec" id="steps"><div class="kicker">Follow along</div><h2>Step-by-step</h2>${stepsHtml || '<p>No steps detected.</p>'}</section>
    ${section('activities', 'Now you try', 'Practice activities', list(guide.suggestedActivities))}
    ${quiz ? `<section class="sec" id="quiz"><div class="kicker">Check your understanding</div><h2>Knowledge check</h2>${quiz}<button class="ghost" onclick="document.querySelectorAll('.q').forEach(q=>q.classList.toggle('show'))">Show / hide answers</button></section>` : ''}
    ${section('transfer', 'Go further', 'Transfer challenges', transfer)}
    ${section('evidence', 'Assessment', 'Evidence of learning — Observation · Conversation · Product', evHtml)}
    ${section('reflect', 'Think back', 'Reflection', list(guide.reflectionPrompts))}
    ${section('sources', 'Provenance', 'Sources', sources)}
  </div>
</div>${statusBar}</div>
<div class="bar"><button onclick="print()">🖨️ Print / Save PDF</button></div>
<script>
document.querySelectorAll('.q').forEach(function(q){var c=+q.dataset.correct;var labs=q.querySelectorAll('.opts label');
 q.querySelectorAll('input').forEach(function(inp){inp.addEventListener('change',function(){labs.forEach(function(l,j){l.classList.toggle('correct',j===c);l.classList.toggle('wrong',j===+inp.value&&j!==c);});q.classList.add('show');});});});
(function(){var h=document.getElementById('yt-player');if(!h)return;var p,ready=false,q=null;
 function seek(s){if(s==null||isNaN(s))return;if(ready&&p){p.seekTo(s,true);p.playVideo();}else q=s;}
 window.onYouTubeIframeAPIReady=function(){p=new YT.Player('yt-player',{videoId:h.dataset.vid,playerVars:{rel:0,modestbranding:1,playsinline:1,start:+h.dataset.start||0},events:{onReady:function(){ready=true;if(q!=null){seek(q);q=null;}}}});};
 var s=document.createElement('script');s.src='https://www.youtube.com/iframe_api';document.head.appendChild(s);
 document.addEventListener('click',function(e){var el=e.target.closest('[data-seek]');if(!el)return;var href=el.getAttribute('href');if(href&&href[0]==='#'){var t=document.querySelector(href);if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth',block:'start'});}}seek(+el.getAttribute('data-seek'));});})();
(function(){var b=document.getElementById('copyCoach');if(!b)return;b.addEventListener('click',function(){var c=document.getElementById('coach-context');var t=c?c.textContent:'';if(navigator.clipboard){navigator.clipboard.writeText(t).then(function(){var o=b.textContent;b.textContent='Copied ✓';setTimeout(function(){b.textContent=o;},1500);});}else{alert(t);}});})();
</script>
</body></html>`;
}

export function slugify(name, fallback) {
  return (name || fallback || 'lesson').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || fallback;
}
