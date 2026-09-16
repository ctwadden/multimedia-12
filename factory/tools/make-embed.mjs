#!/usr/bin/env node
/**
 * make-embed.mjs — deterministic, FREE re-package step (no model calls).
 *
 * Course Depot reads `lesson.json` straight from Drive; it cannot reach the
 * `screenshots/*.webp` sidecar files. This tool reads those files and inlines
 * the STUDENT-VISIBLE ones (each display group's primary + secondary frame,
 * exactly what the polished preview shows) into `lesson.json` as base64 data
 * URIs under `topic.screenshots` — a { stepId -> "data:image/webp;base64,…" }
 * map the front-end can render with zero extra fetches.
 *
 * Idempotent: re-running overwrites `topic.screenshots` from disk each time.
 * Pure presentation — the instructional content (steps, groups, quiz) is
 * untouched, so it never re-runs a video or calls Gemini.
 *
 * Usage:
 *   node tools/make-embed.mjs <lessonDir> [<lessonDir> ...]
 *   node tools/make-embed.mjs --all <lessonDir>   # embed EVERY step's shot, not just group primaries
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const EXTS = ['webp', 'jpeg', 'jpg', 'png'];
const MIME = { webp: 'webp', jpeg: 'jpeg', jpg: 'jpeg', png: 'png' };
const pad = (n) => String(n).padStart(3, '0');

// Find the screenshot file for a step, tolerating id-named or stepNumber-named files.
function findShot(dir, step) {
  const bases = [step.id, step.stepNumber != null ? `step-${pad(step.stepNumber)}` : null].filter(Boolean);
  for (const base of bases) {
    for (const ext of EXTS) {
      const p = join(dir, 'screenshots', `${base}.${ext}`);
      if (existsSync(p)) return { path: p, ext };
    }
  }
  return null;
}

function dataUri(shot) {
  const buf = readFileSync(shot.path);
  return `data:image/${MIME[shot.ext] || 'webp'};base64,` + buf.toString('base64');
}

function embed(dir, { all = false, log = () => {} } = {}) {
  const file = join(dir, 'lesson.json');
  const pkg = JSON.parse(readFileSync(file, 'utf8'));
  const topics = pkg.topics || [];
  let embedded = 0, missing = 0;

  for (const topic of topics) {
    const byId = {};
    for (const ch of topic.chapters || []) for (const s of ch.steps || []) if (s.id) byId[s.id] = s;

    // Which step ids should carry a screenshot?
    let wantIds;
    if (all) {
      wantIds = Object.keys(byId);
    } else {
      const ids = new Set();
      for (const g of topic.displayGroups || []) {
        for (const id of [g.primaryStepId, g.secondaryStepId]) if (id && byId[id]) ids.add(id);
      }
      wantIds = [...ids];
    }

    const screenshots = {};
    for (const id of wantIds) {
      const shot = findShot(dir, byId[id]);
      if (!shot) { missing++; log(`   · no screenshot on disk for ${id}`); continue; }
      screenshots[id] = dataUri(shot);
      embedded++;
    }
    topic.screenshots = screenshots;
  }

  writeFileSync(file, JSON.stringify(pkg, null, 2));
  const bytes = readFileSync(file).length;
  return { dir, embedded, missing, sizeKB: Math.round(bytes / 1024) };
}

async function main() {
  const argv = process.argv.slice(2);
  const all = argv.includes('--all');
  const dirs = argv.filter(a => a !== '--all');
  if (!dirs.length) {
    console.error('Usage: node tools/make-embed.mjs [--all] <lessonDir> [<lessonDir> ...]');
    process.exit(1);
  }

  let failures = 0;
  for (const d of dirs) {
    if (!existsSync(join(d, 'lesson.json'))) { console.error(`   ✗ ${d}: no lesson.json`); failures++; continue; }
    try {
      const r = embed(d, { all, log: (m) => console.log(m) });
      console.log(`   ✓ ${r.dir}: embedded ${r.embedded} screenshot${r.embedded === 1 ? '' : 's'}${r.missing ? ` · ${r.missing} missing` : ''} · lesson.json now ${r.sizeKB} KB`);
    } catch (err) {
      console.error(`   ✗ ${d}: ${err.message}`);
      failures++;
    }
  }
  if (failures) process.exit(1);
}

main();
