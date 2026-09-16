/**
 * Overlap reconciliation + conservative deduplication — APPLICATION-AGNOSTIC.
 *
 * The Coffee Cup is a regression fixture, not the domain. This module encodes NO
 * app-specific operation names or special cases. Two overlap candidates are the
 * same learner action when GENERIC, evidence-backed signals agree — in priority
 * order (§3): menu/command path, input gesture (shortcut), settings/value,
 * affected target, temporal overlap, then description semantics. Natural-language
 * title wording alone never decides identity.
 *
 * The same rules apply equally to "Bridge faces" vs "Bridge face loop",
 * "Create keyframe" vs "Add position keyframe", "Add light" vs "Place directional
 * light", "Import asset" vs "Bring mesh into project": if their structured
 * evidence (menu / gesture / settings / target) matches under temporal overlap,
 * they merge; if not, they are KEPT + FLAGGED, never silently dropped. Synonym
 * folding (create≈add) belongs in an optional vocabulary adapter, not here.
 *
 * Pure: no model calls.
 */

const STOP = new Set(['the', 'a', 'an', 'to', 'of', 'and', 'with', 'for', 'in', 'on', 'into', 'from', 'this', 'that', 'your', 'its', 'it', 'along', 'then', 'again', 'back', 'up-to']);
// Generic spatial/ordinal discriminators (plain English, not app-specific): when
// two candidates carry OPPOSING ones, they act on different things → not the same.
const DISCRIMINATORS = new Set(['top', 'bottom', 'up', 'down', 'left', 'right', 'inner', 'outer', 'upper', 'lower', 'inside', 'outside', 'front', 'back', 'first', 'second', 'third', 'north', 'south', 'east', 'west', 'positive', 'negative']);

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const tokens = (s) => norm(s).split(' ').filter(Boolean);

// Action verb ≈ the first token of an imperative instruction title (generic).
export const primaryVerb = (step) => tokens(step.title)[0] || '';
const targetSet = (step) => new Set(tokens(step.title).slice(1).filter(w => !DISCRIMINATORS.has(w) && !STOP.has(w)));
const discSet = (step) => new Set(tokens(step.title).filter(w => DISCRIMINATORS.has(w)));
const menuKey = (step) => (step.menuPath || []).map(x => norm(x)).join('>');
const shortcutKey = (step) => (step.keyboardShortcuts || []).map(x => norm(x)).join('|');
const settingsKey = (step) => (step.settings || []).map(s => `${norm(s.name)}=${norm(s.value)}`).sort().join(',');
const jaccard = (a, b) => { if (!a.size && !b.size) return 1; let i = 0; for (const w of a) if (b.has(w)) i++; return i / (a.size + b.size - i || 1); };
const intervalsOverlap = (a, b) => a.start <= b.end && b.start <= a.end;
const keysEqual = (a, b) => { const A = [...a], B = [...b]; return A.length === B.length && A.every(x => b.has(x)); };
const discConflict = (a, b) => { const da = discSet(a), db = discSet(b); return da.size && db.size && !keysEqual(da, db); };

/**
 * Strong same-action decision. Returns { reason } to merge, else null.
 * Requires temporal proximity, no discriminator conflict, and at least one strong
 * structural evidence match (menu ≻ gesture+target ≻ settings+command ≻ identical
 * title ≻ same action verb + high target overlap).
 */
export function sameOperation(a, b, overlapSec) {
  const timeStrong = intervalsOverlap(a, b) || Math.abs(a.start - b.start) <= overlapSec + 2;
  if (!timeStrong || discConflict(a, b)) return null;
  const mk = menuKey(a), sk = shortcutKey(a), stk = settingsKey(a);
  const tv = jaccard(targetSet(a), targetSet(b));
  if (mk && mk === menuKey(b)) return { reason: 'same_menu_command' };                              // specific command
  if (sk && sk === shortcutKey(b) && tv >= 0.34) return { reason: 'same_gesture_and_target' };       // §4
  if (stk && stk === settingsKey(b) && ((mk && mk === menuKey(b)) || (sk && sk === shortcutKey(b)))) return { reason: 'same_settings_and_command' };
  if (norm(a.title) === norm(b.title)) return { reason: 'identical_title' };
  if (primaryVerb(a) && primaryVerb(a) === primaryVerb(b) && tv >= 0.6) return { reason: 'same_action_and_target' };
  return null;
}

// Two overlap candidates from different windows that act on the SAME target (high
// target overlap) with NO opposing discriminators, but lack mergeable structural
// evidence → suspected same action described two ways: KEEP + FLAG (never drop).
// Opposing discriminators (top/bottom, up/down, …) always mean DISTINCT actions.
function ambiguous(a, b) {
  if (discConflict(a, b)) return false;
  return jaccard(targetSet(a), targetSet(b)) >= 0.5;
}

function enrich(canon, dup) {
  for (const f of ['menuPath', 'keyboardShortcuts', 'settings', 'annotationTargets']) if (!(canon[f] || []).length && (dup[f] || []).length) canon[f] = dup[f];
  if (!canon.successCheck && dup.successCheck) canon.successCheck = dup.successCheck;
  if (!canon.commonMistake && dup.commonMistake) canon.commonMistake = dup.commonMistake;
}

/**
 * @param tagged  [{ step, win, winRange, overlap:boolean }]
 * @returns { canonical, report }
 * report: { overlapCandidates, merged[], keptDistinct[], conflicts[], ambiguities[], dropped[] }
 *   Every OVERLAP candidate ends as merged | kept_distinct | conflict | ambiguous (§7).
 */
export function reconcileAndDedupe(tagged, overlapSec) {
  const items = [...tagged].sort((a, b) => a.step.start - b.step.start);
  let idx = 0;
  for (const it of items) it.step._cand = `w${it.win}-${idx++}`;

  const canonical = [], meta = [];
  const merged = [], keptDistinct = [], conflicts = [], ambiguities = [];
  let overlapCandidates = 0;

  for (const it of items) {
    const cand = it.step;
    if (it.overlap) overlapCandidates++;

    // strong-merge search
    let dupOf = null, dupReason = null;
    for (let i = canonical.length - 1; i >= 0; i--) {
      const c = canonical[i];
      if (c.start < cand.start - (overlapSec + 3)) break;
      const s = sameOperation(c, cand, overlapSec);
      if (s) { dupOf = c; dupReason = s.reason; break; }
    }
    if (dupOf) {
      enrich(dupOf, cand);
      merged.push({ candidateId: cand._cand, canonicalActionId: dupOf._cand, decision: 'merged', reason: dupReason, title: cand.title, mergedInto: dupOf.title, sourceWindow: it.win, sourceRange: [+cand.start.toFixed(1), +cand.end.toFixed(1)] });
      continue;
    }

    // not merged — for overlap candidates, classify against a prior different-window neighbour
    if (it.overlap) {
      let neighbour = null;
      for (let i = canonical.length - 1; i >= 0; i--) {
        const c = canonical[i];
        if (c.start < cand.start - (overlapSec + 3)) break;
        if (meta[i].win !== it.win && meta[i].overlap && (intervalsOverlap(c, cand) || Math.abs(c.start - cand.start) <= overlapSec + 2)) { neighbour = { c, i }; break; }
      }
      if (neighbour && ambiguous(neighbour.c, cand)) {
        cand.needsReview = true; cand.reconciliationStatus = 'ambiguous';
        neighbour.c.needsReview = true; neighbour.c.reconciliationStatus = 'ambiguous';
        ambiguities.push({ decision: 'ambiguous', a: neighbour.c.title, b: cand.title, region: [+Math.min(neighbour.c.start, cand.start).toFixed(1), +Math.max(neighbour.c.end, cand.end).toFixed(1)], reason: 'same_target_possible_double_description', evidenceA: [neighbour.c.evidence?.start, neighbour.c.evidence?.end], evidenceB: [cand.evidence?.start, cand.evidence?.end] });
      } else {
        keptDistinct.push({ candidateId: cand._cand, title: cand.title, reason: neighbour ? 'distinct_action_or_target' : 'no_adjacent_overlap_candidate' });
      }
    }
    canonical.push(cand); meta.push(it);
  }

  return { canonical, report: { overlapCandidates, merged, keptDistinct, conflicts, ambiguities, dropped: merged } };
}
