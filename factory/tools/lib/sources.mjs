/**
 * Generic source/provider abstraction (§15/§16). Normalizes any source into a
 * common descriptor so the rest of ScribeIt stays source-agnostic:
 *
 *   { sourceType, sourceId, lessonId, title, duration, sourceHash,
 *     playbackReference, driveFileId?, youtubeVideoId? }
 *
 * Drive and YouTube both feed the SAME canonical pipeline. No source-specific
 * instructional schema fields.
 */
import { detectInput, PUBLIC_DRIVE_API_KEY } from './generate.mjs';

const stableId = (prefix, s) => `${prefix}-${String(s).replace(/[^A-Za-z0-9]/g, '').slice(0, 12).toUpperCase()}`;

async function describeDrive(id) {
  const meta = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?fields=name,size,md5Checksum,modifiedTime,videoMediaMetadata(durationMillis)&key=${PUBLIC_DRIVE_API_KEY}`).then(r => r.json());
  if (meta.error) throw new Error(`Drive describe failed for ${id}: ${meta.error.message}`);
  const duration = Math.round((+(meta.videoMediaMetadata?.durationMillis || 0)) / 1000);
  return {
    sourceType: 'google_drive', sourceId: id, driveFileId: id, lessonId: stableId('DRV', id),
    title: meta.name || id, duration,
    // Content hash preferred; else size+mtime composite; both change if the file changes.
    sourceHash: meta.md5Checksum || `${meta.size || 0}:${meta.modifiedTime || ''}`,
    playbackReference: `https://drive.google.com/file/d/${id}/view`,
  };
}

async function describeYouTube(id) {
  let title = `YouTube ${id}`, duration = 0;
  try { const o = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`).then(r => r.json()); if (o.title) title = o.title; } catch {}
  try {
    const page = await fetch(`https://www.youtube.com/watch?v=${id}&hl=en`, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r => r.text());
    const m = page.match(/"lengthSeconds":"(\d+)"/) || page.match(/"approxDurationMs":"(\d+)"/);
    if (m) duration = m[0].includes('Ms') ? Math.round(+m[1] / 1000) : +m[1];
  } catch {}
  return {
    sourceType: 'youtube', sourceId: id, youtubeVideoId: id, lessonId: `YT-${id}`,
    title, duration,
    // YouTube content is addressed by immutable video id; identity IS the id.
    sourceHash: `yt:${id}`,
    playbackReference: `https://www.youtube.com/watch?v=${id}`,
  };
}

/** Normalize any input (url/id) into a source descriptor. Network for metadata. */
export async function describeSource(input) {
  const v = detectInput(input);
  if (v.kind === 'youtube' && v.id) return describeYouTube(v.id);
  if (v.kind === 'drive' && v.id) return describeDrive(v.id);
  throw new Error(`Unrecognized source (not a YouTube or Drive video): ${input}`);
}

/** List videos in a Drive folder as source inputs (recursive one level). */
export async function listDriveFolder(folderId) {
  const p = new URLSearchParams({ q: `'${folderId}' in parents and trashed=false`, key: PUBLIC_DRIVE_API_KEY, fields: 'files(id,name,mimeType)', pageSize: '1000' });
  const d = await fetch(`https://www.googleapis.com/drive/v3/files?${p}`).then(r => r.json());
  if (d.error) throw new Error(`Drive list failed: ${d.error.message}`);
  return (d.files || []).filter(f => (f.mimeType || '').startsWith('video/')).map(f => f.id);
}
