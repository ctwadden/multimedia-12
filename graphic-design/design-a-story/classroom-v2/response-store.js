/* Local drafts only. No account, network submission or achievement writes. */
window.LearningStudioDrafts = {
  create({key, context, questions, controls, onRestore}) {
    const schema = 'learning-studio-draft-v1', limit = 2 * 1024 * 1024;
    const known = new Map(questions.map(q => [q.id, q]));
    const values = new Map(questions.map(q => [q.id, {answer: '', choice: null}]));
    let unsafeOriginal = null, dirty = false;
    const status = document.createElement('p');
    status.id = 'draft-status'; status.setAttribute('role', 'status');
    controls.append(status);
    const say = message => { status.textContent = message + ' Nothing has been submitted to a teacher.'; };
    const record = () => ({schema, key, context, updatedAt: new Date().toISOString(),
      responses: questions.map(q => ({id: q.id, prompt: q.prompt, ...values.get(q.id),
        choiceText: values.get(q.id).choice === null ? null : q.options?.[values.get(q.id).choice]}))});
    function validate(data) {
      if (data?.schema !== schema || data.key !== key || !Array.isArray(data.responses))
        throw Error('This backup belongs to a different worksheet or format.');
      const seen = new Set();
      for (const r of data.responses) {
        const q = known.get(r.id);
        if (!q || seen.has(r.id) || r.prompt !== q.prompt || typeof r.answer !== 'string' ||
            r.answer.length > 100000 || !(r.choice === null ||
            (Number.isInteger(r.choice) && q.options?.[r.choice] === r.choiceText)))
          throw Error('The backup questions or response values do not match this worksheet.');
        seen.add(r.id);
      }
      return data;
    }
    function load(data) {
      for (const q of questions) values.set(q.id, {answer: '', choice: null});
      for (const r of data.responses) values.set(r.id, {answer: r.answer, choice: r.choice});
    }
    function save() {
      dirty = true;
      if (unsafeOriginal !== null) {
        say('An earlier draft could not be read; it has been protected. Download both drafts before clearing.');
        return;
      }
      try {
        localStorage.setItem(key, JSON.stringify(record())); dirty = false;
        say('Saved on this browser and device. Keep a downloaded backup, especially on a shared device.');
      } catch (_) { say('Device saving is unavailable. Keep this page open and download a backup now.'); }
    }
    function download(content, filename, type) {
      const url = URL.createObjectURL(new Blob([content], {type}));
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    const filename = key.replace(/[^a-zA-Z0-9_-]/g, '-');
    function button(text, action) {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = text;
      b.addEventListener('click', action); controls.insertBefore(b, status); return b;
    }
    button('Download restorable backup', () => download(JSON.stringify(record(), null, 2), filename + '.json', 'application/json'));
    const file = document.createElement('input'); file.type = 'file'; file.accept = '.json,application/json';
    file.hidden = true; controls.append(file);
    button('Restore a backup', () => file.click());
    file.addEventListener('change', async () => {
      const chosen = file.files[0]; if (!chosen) return;
      try {
        if (chosen.size > limit) throw Error('Backup is too large (maximum 2 MB).');
        const data = validate(JSON.parse(await chosen.text()));
        if ([...values.values()].some(v => v.answer || v.choice !== null) &&
            !confirm('Replace this browser draft with the backup? Download your current draft first if you need both.')) return;
        if (unsafeOriginal !== null) throw Error('Download the protected earlier draft and clear this device draft before restoring.');
        load(data); save(); onRestore?.();
      } catch (error) { say('Restore failed: ' + error.message + ' Your current draft was kept.'); }
      finally { file.value = ''; }
    });
    button('Clear this device draft', () => {
      if (!confirm('Clear this browser’s draft? Download it first. This does not delete downloaded files or submitted records.')) return;
      try { localStorage.removeItem(key); unsafeOriginal = null; dirty = false;
        for (const q of questions) values.set(q.id, {answer: '', choice: null});
        say('This device draft has been cleared.'); onRestore?.();
      } catch (_) { say('Could not clear device storage. Your draft was kept.'); }
    });
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        try { load(validate(JSON.parse(raw))); say('Restored this browser’s saved draft. Keep a downloaded backup.'); }
        catch (_) { unsafeOriginal = raw;
          button('Download protected earlier draft', () => download(raw, filename + '-earlier.json', 'application/json'));
          say('An earlier draft could not be read and has been protected. Download it before clearing.'); }
      } else say('No saved draft yet. Answers will save on this device as you type; keep a downloaded backup.');
    } catch (_) { say('Device saving is unavailable. Download a backup before closing or refreshing.'); }
    window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
    return {
      get: id => values.get(id),
      answer(id, answer) { if (known.has(id)) { values.get(id).answer = answer; save(); } },
      choice(id, choice) { if (known.has(id)) { values.get(id).choice = choice; save(); } },
      exportText() {
        const text = context + '\nLocal practice/draft record — not submitted\n\n' + record().responses.map(r =>
          r.id + '\n' + r.prompt + '\nAnswer: ' + (r.answer || '(no typed answer)') +
          (r.choiceText !== null && r.choiceText !== undefined ? '\nPractice choice: ' + r.choiceText : '')).join('\n\n');
        download(text, filename + '.txt', 'text/plain;charset=utf-8');
      }
    };
  }
};
