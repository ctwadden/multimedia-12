/* Explicit preview then Google Form navigation. No automatic submission or network writes. */
(()=>{
 const host=document.getElementById('collection-controls');if(!host)return;
 const configs=window.DesignDeskForms||{},isDesk=!!document.getElementById('stage');
 host.innerHTML='<h2>Send your work to your teacher</h2><label for="submission-course">Your course</label><select id="submission-course"><option value="">Choose your course</option><option value="COM11">Communication 11</option><option value="MM12">Multimedia 12</option></select><button id="prepare-google">Prepare Google submission</button><p class="small">Review your prepared answers, open your course Form, then press Submit in Google. Device saving and exports do not submit work.</p><p id="submission-status" role="status"></p><dialog id="submission-preview"><h2>Review before opening Google</h2><p>For Design Desk, download the assessment PNG from the notebook, then attach it to the optional screenshot question in Google. Your writing and layout settings will be placed in your course’s Google Form when you open the link below. Sign in with your school account, check the answers and press Submit there. Your teacher receives the submitted Form response. No image or student work is published to GitHub.</p><textarea id="submission-record" readonly aria-label="Prepared answers" style="min-height:260px"></textarea><p><button id="submission-png" type="button">Download my assessment screenshot (PNG)</button></p><p><a id="google-prefill" class="button" target="_blank" rel="noreferrer">Open my course Google Form</a><button id="close-submission">Keep editing</button></p><p id="prefill-warning"></p></dialog>';
 const course=document.getElementById('submission-course'),status=document.getElementById('submission-status'),dialog=document.getElementById('submission-preview');
 const path=location.pathname;course.value=path.includes('/communication-technology-11/')?'COM11':path.includes('/multimedia-12/')?'MM12':'';
 document.getElementById('submission-png').hidden=!isDesk;document.getElementById('submission-png').onclick=()=>document.getElementById('assessment-png').click();
 document.getElementById('close-submission').onclick=()=>dialog.close();
 document.getElementById('prepare-google').onclick=()=>{
  const cfg=configs[course.value];if(!cfg){status.textContent='Choose your course. If its collection is unavailable, keep a downloaded backup.';return;}
  const values={};let route;
  if(isDesk){
   const data=window.designDeskSubmission?.();if(!data){status.textContent='Keep your backup; the current design record could not be prepared.';return;}
   if(['prediction','rationale','revision'].some(k=>!data[k].trim())){status.textContent='Complete the three decision-notebook responses before preparing your submission.';return;}
   route='desk';Object.assign(values,data);
  }else{
   route='gallery';const posters=['last-orchard','blue-hour','frequency','paper-planets'];
   const done=posters.filter(p=>['evidence','meaning','revision'].every(k=>document.getElementById(p+'-'+k).value.trim()));
   if(done.length<2||!document.getElementById('compare').value.trim()){status.textContent='Complete all three responses for at least two posters, then write your comparison.';return;}
   document.querySelectorAll('#responses textarea').forEach(x=>values[x.id]=x.value);
  }
  const params=new URLSearchParams({usp:'pp_url'});params.set(cfg.entries['META-COURSE'],cfg.courseValue);params.set(cfg.entries['META-PURPOSE'],route==='desk'?'Client design desk — decisions and revision':'Poster gallery — two posters');
  const lines=[cfg.title,'Checkpoint: '+route,'Prepared locally — not submitted'];
  for(const q of cfg.questions.filter(q=>q.route===route)){const value=values[q.field]||'';params.set(cfg.entries[q.id],value);lines.push(q.title+'\n'+q.prompt+'\n'+(value||'(Not selected / no response)'));}
  document.getElementById('submission-record').value=lines.join('\n\n');
  const url=cfg.url+'?'+params.toString(),long=url.length>28000;
  document.getElementById('google-prefill').href=long?cfg.url:url;
  document.getElementById('prefill-warning').textContent=long?'This record is too long for a reliable prefilled link. The link opens a blank Form: copy the prepared answers above into the matching questions. Keep your illustrated record and backup.':'Your prepared answers will be filled in. Check the selected checkpoint and press Next. If Google sign-in opens a blank Form, return here and open this same prepared link again. Keep this page open until Google confirms submission.';
  status.textContent='Prepared for review. Nothing has been submitted here.';dialog.showModal();
 };
})();
