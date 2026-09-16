/**
 * Deterministic student display-group layer — APPLICATION-AGNOSTIC (§9, §13–§18).
 *
 * The atomic action layer stays the source of truth. Display groups are a thin
 * pedagogical grouping that REFERENCES canonical step ids; they never duplicate
 * or invent facts, and encode NO app-specific vocabulary. Boundaries come from
 * generic signals only: the model-provided chapter runs and large time gaps.
 * Consecutive groups that would carry the same heading are merged so a section
 * title is never rendered repeatedly.
 *
 * Pure: no model calls.
 */
const clip = (t) => { const s = (t || '').trim(); return s.length > 64 ? s.slice(0, 61) + '…' : s; };

/**
 * @param chapters canonical chapters [{title, steps:[canonical step]}]
 * @param opts { gapSec=25 }
 * @returns [{ id, title, stepIds, primaryStepId, secondaryStepId, successCheck, essential }]
 */
export function buildDisplayGroups(chapters, { gapSec = 25 } = {}) {
  const steps = chapters.flatMap(c => (c.steps || []).map(s => ({ ...s, _chapter: c.title })));
  const raw = [];
  let cur = null, prev = null;
  for (const s of steps) {
    const boundary = !cur || s._chapter !== cur.heading || (prev && (s.start - prev.end) > gapSec);
    if (boundary) { if (cur) raw.push(cur); cur = { heading: s._chapter, steps: [] }; }
    cur.steps.push(s);
    prev = s;
  }
  if (cur) raw.push(cur);

  // Merge consecutive groups that share a heading (§9 — no repeated section titles).
  const merged = [];
  for (const g of raw) {
    const last = merged[merged.length - 1];
    if (last && last.heading && g.heading && last.heading === g.heading) last.steps.push(...g.steps);
    else merged.push({ heading: g.heading, steps: [...g.steps] });
  }

  return merged.map((g, i) => {
    const gs = g.steps;
    const essentials = gs.filter(s => s.importance === 'essential');
    const lead = essentials[0] || gs[0];
    const resultStep = essentials.length ? essentials[essentials.length - 1] : gs[gs.length - 1];
    const heading = g.heading && g.heading !== 'Lesson' && g.heading.length > 3 ? clip(g.heading) : clip(lead.title);
    const sc = [...gs].reverse().find(s => s.successCheck)?.successCheck || '';
    const secondary = gs.length >= 5 ? gs[Math.floor(gs.length / 2)] : null;
    return {
      id: `group-${String(i + 1).padStart(3, '0')}`,
      title: heading,
      stepIds: gs.map(s => s.id),
      primaryStepId: resultStep.id,
      secondaryStepId: secondary && secondary.id !== resultStep.id ? secondary.id : null,
      successCheck: sc,
      essential: essentials.length > 0,
    };
  });
}
