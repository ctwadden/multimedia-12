/* Local contextual copy only. No learner data is read or sent to any service. */
(() => {
  const source = document.querySelector('#stage-coach-data');
  if (!source) return;
  let rows;
  try { rows = JSON.parse(source.textContent); } catch { return; }
  for (const row of rows) {
    const step = document.getElementById(row.stage_locator);
    if (!step) continue;
    const panel = document.createElement('div');
    panel.className = 'screen-only';
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.clientCoach = row.stage_locator;
    button.textContent = 'Copy this stage’s context for Coach';
    const status = document.createElement('p');
    status.className = 'small';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    const content = [
      `${row.course_id} · ${row.module_label} · ${row.project_id}`,
      `Stage: ${row.task_title} (${row.stage_locator}); existing step: ${row.project_step_id}`,
      `Skills: ${row.skill_ids.join(', ')}; outcomes: ${row.outcome_codes.join(', ')}`,
      `Evidence checkpoints: ${row.evidence_ids.join(', ')}`,
      `Resources: ${row.resources.join('; ')}`,
      `My own thinking: ${row.assessed_cognition}`,
      `May help: ${row.scaffoldable_actions.join('; ')}`,
      `Boundaries: ${row.prohibited_assistance.join('; ')}`,
      `Check: ${row.completion_requirements}`,
      'My intent: __. Selected source/layer/control: __. Expected: __. Observed: __. Tried: __.',
      'Give one relevant hint or explain a principle using a different example. Keep my final decisions mine.'
    ].join('\n');
    button.addEventListener('click', async () => {
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(content);
        status.textContent = 'Context copied. Add your actual attempt, then open the shared Coach. Nothing was submitted.';
      } catch {
        const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `Design-a-Story-${row.stage_locator}-Coach-context.txt`;
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        status.textContent = 'Clipboard unavailable. A text download was requested; use it to add your attempt. Nothing was submitted.';
      }
    });
    panel.append(button);
    const sharedCoach = document.querySelector('a[href*="gemini.google.com/gem/"]');
    if (sharedCoach) {
      const open = document.createElement('a');
      open.href = sharedCoach.href;
      open.className = 'button';
      open.textContent = 'Open shared Coach';
      open.target = '_blank';
      open.rel = 'noopener';
      open.style.marginLeft = '6px';
      open.style.marginTop = '6px';
      panel.append(open);
    }
    panel.append(status);
    step.append(panel);
  }
})();
