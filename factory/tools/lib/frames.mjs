/**
 * Deterministic screenshot pipeline (§11): video → ffmpeg → optimized WebP.
 * NO model calls. AI bounding-box annotation is Phase 2 and lives nowhere here.
 *
 *   video + step.screenshotTimestamp (seconds) → screenshots/step-NNN.webp
 *
 * Independent rebuild layer: screenshots can be regenerated from the source video
 * without re-running any analysis.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

export function hasFfmpeg() {
  try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true; } catch { return false; }
}

let webpChecked = null;
function ffmpegHasWebp() {
  if (webpChecked !== null) return webpChecked;
  try {
    const out = execFileSync('ffmpeg', ['-hide_banner', '-encoders'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    webpChecked = /libwebp/.test(out);
  } catch { webpChecked = false; }
  return webpChecked;
}

const pad = (n) => String(n).padStart(3, '0');

// ---------- frame-capable local media providers ----------
// Give the EXISTING screenshot stage a temporary local copy of a source, so
// Drive / YouTube / local all feed the same ffmpeg→WebP path. Source identity is
// unchanged by the caller; these only produce a throwaway file for frame capture.

export function hasYtDlp() {
  try { execFileSync('yt-dlp', ['--version'], { stdio: 'ignore' }); return true; } catch { return false; }
}

/** Download a temporary ≤720p copy of an authorized YouTube video for frame capture. */
export function downloadYouTube(videoId, destDir, { log = () => {} } = {}) {
  if (!hasYtDlp()) throw new Error('yt-dlp not available for YouTube frame capture');
  mkdirSync(destDir, { recursive: true });
  const tmpl = join(destDir, `${videoId}.%(ext)s`);
  log(`fetching temporary YouTube frame media (${videoId})…`);
  // player_client args expose a progressive (format 18) stream when YouTube's
  // default client offers none (SABR-only sessions). No credentials required.
  const fmt = process.env.SCRIBE_YTDLP_FORMAT || 'best[height<=720][ext=mp4]/18/best[ext=mp4]/best';
  const clients = process.env.SCRIBE_YTDLP_CLIENTS || 'android,ios,web_safari';
  execFileSync('yt-dlp', ['--no-playlist', '--no-warnings', '-q', '--extractor-args', `youtube:player_client=${clients}`, '-f', fmt, '-o', tmpl, `https://www.youtube.com/watch?v=${videoId}`], { stdio: 'ignore', timeout: 300000 });
  const f = readdirSync(destDir).find(x => x.startsWith(`${videoId}.`));
  if (!f) throw new Error(`yt-dlp produced no media for ${videoId}`);
  return join(destDir, f);
}

/** Download a temporary copy of a public Drive video for frame capture. */
export async function downloadDrive(fileId, destDir, apiKey, { log = () => {} } = {}) {
  mkdirSync(destDir, { recursive: true });
  // Authenticated download (env GDRIVE_TOKEN) bypasses the anonymous public-key
  // daily quota; falls back to the public key when no token is set.
  const gtok = process.env.GDRIVE_TOKEN;
  const resp = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media${gtok ? '' : `&key=${apiKey}`}`,
    gtok ? { headers: { Authorization: `Bearer ${gtok}` } } : {}
  );
  if (!resp.ok) throw new Error(`Drive download failed (${resp.status})`);
  const out = join(destDir, `${fileId}.mp4`);
  writeFileSync(out, Buffer.from(await resp.arrayBuffer()));
  return out;
}

/**
 * Extract one optimized screenshot per step into <outDir>/screenshots/.
 * @returns {{ files: Record<number,string>, dataUris: Record<number,string>, format, captured }}
 *   files    stepNumber -> relative path ("screenshots/step-001.webp") for the canonical workbook
 *   dataUris stepNumber -> data: URI for the portable preview render
 */
export function extractScreenshots(videoPath, steps, outDir, { log = () => {} } = {}) {
  if (!hasFfmpeg()) { log('ffmpeg not found — skipping screenshots.'); return { files: {}, dataUris: {}, format: null, captured: 0 }; }
  const webp = ffmpegHasWebp();
  const ext = webp ? 'webp' : 'jpg';
  const shotsDir = join(outDir, 'screenshots');
  if (!existsSync(shotsDir)) mkdirSync(shotsDir, { recursive: true });

  const files = {}, dataUris = {}, hashes = {};
  let captured = 0;
  for (const s of steps) {
    const n = s.stepNumber;
    const rel = `screenshots/step-${pad(n)}.${ext}`;
    const abs = join(outDir, rel);
    const t = typeof s.screenshotTimestamp === 'number' ? s.screenshotTimestamp : s.start || 0;
    const vf = 'scale=1280:-2';
    const args = webp
      ? ['-ss', String(t), '-i', videoPath, '-frames:v', '1', '-vf', vf, '-c:v', 'libwebp', '-quality', '80', '-y', abs]
      : ['-ss', String(t), '-i', videoPath, '-frames:v', '1', '-vf', vf, '-q:v', '4', '-y', abs];
    try {
      execFileSync('ffmpeg', args, { stdio: 'ignore', timeout: 30000 });
      const buf = readFileSync(abs);
      files[n] = rel;
      dataUris[n] = `data:image/${webp ? 'webp' : 'jpeg'};base64,` + buf.toString('base64');
      hashes[n] = createHash('sha256').update(buf).digest('hex');
      captured++;
    } catch { /* skip this frame */ }
  }
  log(`captured ${captured}/${steps.length} screenshots (${ext}).`);
  return { files, dataUris, hashes, format: ext, captured };
}
