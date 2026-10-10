/* Local proposal draft. Field IDs and original prompts are preserved. */
const fields=[...document.querySelectorAll('#proposal textarea')];
const status=document.getElementById('status');
const controls=document.createElement('div');status.replaceWith(controls);
const draft=LearningStudioDrafts.create({key:'mm12-design-story:proposal',
 context:'Multimedia 12 · Sprint 4 · Design a Story proposal',controls,
 questions:fields.map(f=>({id:f.id,prompt:f.name})),onRestore:restore});
function restore(){for(const f of fields)f.value=draft.get(f.id).answer;}
restore();
for(const f of fields)f.addEventListener('input',()=>draft.answer(f.id,f.value));
document.getElementById('proposal').addEventListener('submit',e=>e.preventDefault());
document.getElementById('export').onclick=()=>draft.exportText();
