/**
 * Companion Registry (§6) — durable SQLite store for a resumable production
 * factory (target 1,000–5,000+ sources). Tracks source identity, versions, cost,
 * status, and artifact location so runs are idempotent and restartable (§7),
 * failures are isolated (§9), and spend is governed (§11).
 *
 * Uses the built-in node:sqlite (no external dependency).
 */
import { DatabaseSync } from 'node:sqlite';

export const STATES = ['DISCOVERED', 'QUEUED', 'ANALYZING', 'VALIDATING', 'SCREENSHOTS', 'REVIEW_REQUIRED', 'READY', 'APPROVED', 'PUBLISHED', 'FAILED'];
// A source in one of these is considered "done" and skipped on re-run (unless identity/version changed).
const DONE = new Set(['READY', 'APPROVED', 'PUBLISHED', 'REVIEW_REQUIRED']);

const COLS = [
  'lesson_id', 'source_type', 'drive_file_id', 'youtube_video_id', 'source_url', 'title',
  'source_hash', 'course_id', 'unit_id', 'duration_sec', 'discovered_at',
  'status', 'qa_status', 'publish_status', 'schema_version', 'prompt_version', 'generator_version',
  'models', 'model_calls', 'tokens_in', 'tokens_out', 'cost', 'escalation_count', 'retry_count',
  'artifact_dir', 'error', 'last_processed_at',
];

export class Registry {
  constructor(dbPath) {
    this.db = new DatabaseSync(dbPath);
    this.db.exec(`CREATE TABLE IF NOT EXISTS companions (
      lesson_id TEXT PRIMARY KEY, source_type TEXT, drive_file_id TEXT, youtube_video_id TEXT,
      source_url TEXT, title TEXT, source_hash TEXT, course_id TEXT, unit_id TEXT, duration_sec REAL,
      discovered_at TEXT, status TEXT DEFAULT 'DISCOVERED', qa_status TEXT DEFAULT 'pending',
      publish_status TEXT DEFAULT 'unpublished', schema_version TEXT, prompt_version TEXT, generator_version TEXT,
      models TEXT, model_calls INTEGER DEFAULT 0, tokens_in INTEGER DEFAULT 0, tokens_out INTEGER DEFAULT 0,
      cost REAL DEFAULT 0, escalation_count INTEGER DEFAULT 0, retry_count INTEGER DEFAULT 0,
      artifact_dir TEXT, error TEXT, last_processed_at TEXT
    )`);
  }

  /** Insert a discovered source if new; never clobbers processing state. */
  discover(desc, { courseId = null, unitId = null, nowIso } = {}) {
    const existing = this.get(desc.lessonId);
    if (existing) {
      // Refresh cheap metadata but keep status/cost; flag if the content changed.
      if (existing.source_hash && desc.sourceHash && existing.source_hash !== desc.sourceHash) {
        this.db.prepare(`UPDATE companions SET source_hash=?, status='DISCOVERED', error='source changed since last analysis' WHERE lesson_id=?`).run(desc.sourceHash, desc.lessonId);
      }
      return { lessonId: desc.lessonId, isNew: false };
    }
    this.db.prepare(`INSERT INTO companions (lesson_id, source_type, drive_file_id, youtube_video_id, source_url, title, source_hash, course_id, unit_id, duration_sec, discovered_at, status)
      VALUES (?,?,?,?,?,?,?,?,?,?,?, 'DISCOVERED')`).run(
      desc.lessonId, desc.sourceType, desc.driveFileId || null, desc.youtubeVideoId || null,
      desc.playbackReference || null, desc.title, desc.sourceHash || null, courseId, unitId,
      desc.duration || 0, nowIso);
    return { lessonId: desc.lessonId, isNew: true };
  }

  get(lessonId) { return this.db.prepare('SELECT * FROM companions WHERE lesson_id=?').get(lessonId); }

  /**
   * Idempotency (§7): should this source be (re)analyzed? Skips when a validated
   * artifact exists AND identity + all three versions are unchanged.
   */
  needsProcessing(lessonId, { schemaVersion, promptVersion, generatorVersion, sourceHash } = {}) {
    const r = this.get(lessonId);
    if (!r) return true;
    if (!DONE.has(r.status)) return true;
    if (sourceHash && r.source_hash && sourceHash !== r.source_hash) return true;
    if (schemaVersion && r.schema_version !== String(schemaVersion)) return true;
    if (promptVersion && r.prompt_version !== promptVersion) return true;
    if (generatorVersion && r.generator_version !== generatorVersion) return true;
    return false;
  }

  /** Claim up to n sources to process, oldest-discovered first (§10 bounded). */
  claimNext(n, { statuses = ['DISCOVERED', 'QUEUED', 'FAILED'], courseId = null } = {}) {
    const ph = statuses.map(() => '?').join(',');
    const args = [...statuses]; let where = `status IN (${ph})`;
    if (courseId) { where += ' AND course_id=?'; args.push(courseId); }
    const rows = this.db.prepare(`SELECT * FROM companions WHERE ${where} ORDER BY discovered_at ASC LIMIT ?`).all(...args, n);
    for (const r of rows) this.setStatus(r.lesson_id, 'QUEUED');
    return rows;
  }

  setStatus(lessonId, status, extra = {}) {
    const sets = ['status=?'], vals = [status];
    for (const [k, v] of Object.entries(extra)) { sets.push(`${k}=?`); vals.push(v); }
    this.db.prepare(`UPDATE companions SET ${sets.join(', ')} WHERE lesson_id=?`).run(...vals, lessonId);
  }

  /** Record a completed analysis result + provenance + cost. */
  recordResult(lessonId, r) {
    this.db.prepare(`UPDATE companions SET status=?, qa_status=?, schema_version=?, prompt_version=?, generator_version=?,
      models=?, model_calls=?, tokens_in=?, tokens_out=?, cost=?, escalation_count=?, duration_sec=?, artifact_dir=?, error=NULL, last_processed_at=?
      WHERE lesson_id=?`).run(
      r.status, r.qaStatus || 'pending_human_review', String(r.schemaVersion), r.promptVersion, r.generatorVersion,
      JSON.stringify(r.models || {}), r.modelCalls || 0, r.tokensIn || 0, r.tokensOut || 0, r.cost || 0,
      r.escalationCount || 0, r.durationSec || 0, r.artifactDir || null, r.lastProcessedAt, lessonId);
  }

  markFailed(lessonId, error, nowIso) {
    const r = this.get(lessonId);
    this.db.prepare(`UPDATE companions SET status='FAILED', error=?, retry_count=?, last_processed_at=? WHERE lesson_id=?`)
      .run(String(error).slice(0, 500), (r?.retry_count || 0) + 1, nowIso, lessonId);
  }

  /** Recover in-progress rows left by a crashed run so a restart resumes them (§7/§20). */
  resetStale() {
    return this.db.prepare(`UPDATE companions SET status='DISCOVERED' WHERE status IN ('ANALYZING','QUEUED','VALIDATING','SCREENSHOTS')`).run().changes;
  }

  requeue(statuses = ['FAILED']) {
    const ph = statuses.map(() => '?').join(',');
    return this.db.prepare(`UPDATE companions SET status='DISCOVERED' WHERE status IN (${ph})`).run(...statuses).changes;
  }

  listByStatus(status) { return this.db.prepare('SELECT * FROM companions WHERE status=? ORDER BY discovered_at').all(status); }
  all() { return this.db.prepare('SELECT * FROM companions ORDER BY discovered_at').all(); }
  costTotal() { return this.db.prepare('SELECT COALESCE(SUM(cost),0) c, COALESCE(SUM(model_calls),0) calls FROM companions').get(); }
  counts() {
    const rows = this.db.prepare('SELECT status, COUNT(*) n FROM companions GROUP BY status').all();
    return Object.fromEntries(rows.map(r => [r.status, r.n]));
  }
  close() { this.db.close(); }
}

export { COLS };
