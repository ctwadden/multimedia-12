(function(){'use strict';
var script=document.currentScript, SUPPORTS=['today','glossary','summary','audio','checklist','worked','frames','stretch'];
var labels={today:'Today',glossary:'Glossary',summary:'Summary',audio:'Read aloud',checklist:'Checklist',worked:'Worked example',frames:'Sentence frames',stretch:'Stretch'};
var glossary={
 'smart object':'Smart Object — an editable container that protects source pixels and supports reversible transforms or filters.',
 'layer mask':'Layer mask — a grayscale visibility control: white reveals, black conceals, and gray partly reveals.',
 'clipping mask':'Clipping mask — limits one layer so it appears only where the layer beneath has visible pixels.',
 'filter mask':'Filter mask — controls where a Smart Filter appears without deleting its settings.',
 'select and mask':'Select and Mask — a workspace for inspecting and refining a selection edge before output.',
 'content-aware fill':'Content-Aware Fill — replaces a selected area by sampling surrounding image information.',
 'clone stamp':'Clone Stamp — copies pixels from a source point you choose to another area.',
 'healing brush':'Healing Brush — blends sampled texture with the tone and colour around the repair.',
 'pen tool':'Pen tool — creates editable vector paths with anchor points and direction handles.',
 'vector mask':'Vector mask — uses a path to control visibility with a clean, scalable edge.',
 'blend mode':'Blend mode — changes how a layer combines mathematically with layers below it.',
 'adjustment layer':'Adjustment layer — a reversible colour or tone change stored separately from image pixels.',
 'curves':'Curves — a tone control that remaps input brightness to output brightness.',
 'levels':'Levels — sets black, white and midpoint values for tonal correction.',
 'gradient':'Gradient — a controlled transition between colours or opacity values.',
 'gaussian blur':'Gaussian Blur — softens detail with an adjustable radius.',
 'transform warp':'Transform Warp — bends an object using a mesh while keeping the source recoverable.',
 'puppet warp':'Puppet Warp — deforms an object around pins that hold and move chosen areas.',
 'linked smart object':'Linked Smart Object — an instance connected to an external source file.',
 'rasterize':'Rasterize — converts editable vector, type or Smart Object content into pixels.',
 'hierarchy':'Visual hierarchy — the planned order in which a viewer notices and reads elements.',
 'kerning':'Kerning — spacing between a particular pair of letters.',
 'leading':'Leading — vertical spacing between lines of type.',
 'tracking':'Tracking — even spacing added across a selected range of letters.',
 'alpha':'Alpha — transparency information stored with an image or render.',
 'outliner':'Outliner — Blender’s list of scene objects and collections.',
 'origin':'Object origin — the reference point Blender uses for transforms and parenting.',
 'parent':'Parent — an object whose transform can control one or more child objects.',
 'material':'Material — surface settings that determine how a 3D object responds to light.',
 'render':'Render — the final image calculated from a 3D scene, camera, lights and materials.'
};
var profiles={
 'PS-DROP-DAY':{alternate:'a hiking boot launch image',purpose:'a retail product launch'},
 'PS-TRUCK-AD':{alternate:'an electric utility vehicle campaign',purpose:'a rugged audience-focused advertisement'},
 'PS-LEMON-BURST':{alternate:'a sparkling-water can with a berry label',purpose:'a product advertising image'},
 'PS-BELOW-SURFACE':{alternate:'a sea-turtle documentary title image',purpose:'a documentary opening identity'},
 'PS-ON-COVER':{alternate:'a science magazine portrait cover',purpose:'an editorial cover'},
 'PS-ZEBRA-IRONING':{alternate:'a giraffe tailoring its patterned jacket',purpose:'a surreal visual narrative'},
 'PS-CEREAL-BOX':{alternate:'an OCEAN OATS cereal package',purpose:'a dimensional brand illustration'},
 'PS-TURTLE-KINGDOM':{alternate:'a whale carrying a floating research station',purpose:'a believable fantasy composite'},
 'PS-STORMBOUND':{alternate:'an icy arm transforming into an arctic fox',purpose:'a surreal weather composite'},
 'BL-SKYBOUND':{alternate:'a low-poly observatory rendered into a night poster',purpose:'a 3D-to-Photoshop composite'}
};
var cfg={project:script.dataset.project||'WORKBOOK',course:(new URLSearchParams(location.search).get('course')||script.dataset.course||'MM12').toUpperCase(),sprint:script.dataset.sprint||'',studentOs:script.dataset.studentOs||'https://script.google.com/a/macros/gnspes.ca/s/AKfycby3lAqgW184t9EnOZg2XHDh6C8jYGZUBFpXeLICFZnAu0Yrkab3hcw6QFboHR7FWVTo/exec',formLauncher:script.dataset.formLauncher||'https://script.google.com/a/macros/gnspes.ca/s/AKfycbxqHbAwEwbvdMrOGY4eP4Yu-z8PXqMsA-MfMGBFoTA5CoDbOA4sUv1LsXbYfFMWmrcP/exec'};
if(cfg.course==='CT11')cfg.course='COM11';if(cfg.course==='COM11'&&script.dataset.comSprint)cfg.sprint=script.dataset.comSprint; var profile=profiles[cfg.project]||{alternate:'a different source asset',purpose:'the same communication goal'};
var steps=[].slice.call(document.querySelectorAll('article.step,section.step,article.step-card,section.step-card')).filter(function(x){return x.id;});
if(!steps.length)return;
function clean(s){return String(s||'').replace(/\s+/g,' ').trim()}
function heading(step){var h=step.querySelector('h2,h3,h4,.step-title');return clean(h?h.textContent:step.id)}
function firstText(step,sel){var n=step.querySelector(sel);return clean(n&&n.textContent)}
function actions(step){var nodes=[].slice.call(step.querySelectorAll('ol li,.actions li,.instructions li,.do-this li'));var out=nodes.map(function(n){return clean(n.textContent)}).filter(Boolean);if(!out.length){out=[].slice.call(step.querySelectorAll('p')).map(function(n){return clean(n.textContent)}).filter(function(t){return /^(choose|click|select|open|create|place|set|add|paint|drag|save|use|duplicate|rename|move|type|press|go to|make|build|download|extract|inspect|read)\b/i.test(t)}).slice(0,6)}if(!out.length)out=['Confirm the correct document, layer or object is selected.','Complete “'+heading(step)+'” using the directions in this step.','Compare your result with the step CHECK before moving on.'];return out.slice(0,8)}
function terms(step){var txt=clean(step.textContent).toLowerCase();var found=Object.keys(glossary).filter(function(k){return txt.indexOf(k)>=0}).slice(0,5);if(!found.length)found=['layer mask','smart object'].filter(function(k){return glossary[k]});return found}
function checkText(step){var hs=[].slice.call(step.querySelectorAll('h3,h4,strong,b'));var n=hs.find(function(x){return /\bcheck\b/i.test(x.textContent)});if(n){var box=n.parentElement;return clean(box&&box.textContent).slice(0,420)}return 'Your result matches the visible checkpoint and the file remains editable.'}
function stepData(step){var title=heading(step), a=actions(step), ts=terms(step), check=checkText(step);return {id:step.id,title:title,checklist:a,glossary:ts.map(function(k){return glossary[k]}),summary:'In this step you will '+title.replace(/^\d+\s*/,'').replace(/[.!]$/,'').toLowerCase()+'. Keep the source editable, follow the named route, and use the CHECK to decide whether the result is ready.',worked:'Different asset example: use '+profile.alternate+'. Repeat the same technique for “'+title+'”, but choose settings from that asset’s edge, scale and lighting rather than copying this project’s values.',frames:['I selected ___ before using ___ because ___.','My CHECK shows the step worked because ___.','If I revised this step, I would change ___ because it affects '+profile.purpose+'.'],stretch:'After the CHECK passes, change one constraint in “'+title+'” (scale, source, audience or lighting). Keep the file editable and explain why your revised choice works.',today:'Current step: '+title+'. Start by checking the SELECT / DOCUMENT target, complete one action at a time, then stop at the CHECK.',audio:clean(step.textContent).slice(0,3500),check:check};}
var data={};steps.forEach(function(s){data[s.id]=stepData(s)});
var key='learning-studio-supports:'+cfg.course+':'+cfg.project, chosen=[];
try{chosen=JSON.parse(localStorage.getItem(key)||'[]').filter(function(x){return SUPPORTS.indexOf(x)>=0})}catch(e){}
var fromQuery=(new URLSearchParams(location.search).get('supports')||'').split(',').filter(function(x){return SUPPORTS.indexOf(x)>=0});fromQuery.forEach(function(x){if(chosen.indexOf(x)<0)chosen.push(x)});
var current=(location.hash||'').replace(/^#/,'');if(!data[current])current=steps[0].id;
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function log(id,action){if(window.parent!==window)window.parent.postMessage({type:'student-os-support-use',event:{course_id:cfg.course,sprint_id:cfg.sprint,project_id:cfg.project,step_id:current,support_id:id,action:action}},'*')}
var launch=document.createElement('button');launch.className='ls-support-launch';launch.type='button';launch.textContent='My supports';launch.setAttribute('aria-controls','ls-support-drawer');launch.setAttribute('aria-expanded','false');
var drawer=document.createElement('aside');drawer.id='ls-support-drawer';drawer.className='ls-support-drawer';drawer.hidden=true;drawer.setAttribute('aria-label','My supports');
document.body.appendChild(launch);document.body.appendChild(drawer);
function card(id,title,body){return chosen.indexOf(id)>=0?'<section class="ls-support-card" data-support="'+id+'"><h3>'+esc(title)+'</h3>'+body+'</section>':''}
function render(){var d=data[current],opts='<div class="ls-support-toggles">'+SUPPORTS.map(function(x){return '<label class="ls-support-toggle"><input type="checkbox" value="'+x+'" '+(chosen.indexOf(x)>=0?'checked':'')+'> '+esc(labels[x])+'</label>'}).join('')+'</div>';
var list=d.checklist.map(function(x,i){var ck=localStorage.getItem(key+':'+current+':'+i)==='1';return '<label class="ls-support-check"><input type="checkbox" data-check="'+i+'" '+(ck?'checked':'')+'> <span>'+esc(x)+'</span></label>'}).join('');
drawer.innerHTML='<div class="ls-support-head"><div><small class="ls-support-meta">'+esc(cfg.course)+' · '+esc(cfg.project)+' · support stream only, never achievement</small><h2>My supports</h2></div><button class="ls-support-close" type="button">Close</button></div><p class="ls-support-note">These tools change access, not the task or success criteria. Teacher presets load when you open this guide through Student OS.</p>'+opts+'<label><b>Support for step</b><select class="ls-support-step">'+steps.map(function(s){return '<option value="'+esc(s.id)+'" '+(s.id===current?'selected':'')+'>'+esc(heading(s))+'</option>'}).join('')+'</select></label>'+card('today','Today','<p>'+esc(d.today)+'</p>')+card('summary','Summary','<p>'+esc(d.summary)+'</p>')+card('glossary','Glossary','<ul>'+d.glossary.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul>')+card('audio','Read aloud','<p>Hear this step’s directions. Pause speech before changing steps.</p><button class="ls-support-audio" type="button">Read this step aloud</button>')+card('checklist','Step checklist',list)+card('worked','Worked example','<p>'+esc(d.worked)+'</p>')+card('frames','Evidence conversation','<ul>'+d.frames.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul>')+card('stretch','Stretch after the CHECK','<p><b>CHECK first:</b> '+esc(d.check)+'</p><p>'+esc(d.stretch)+'</p>')+'<div class="ls-support-links"><a class="ls-support-open-os" href="'+esc(cfg.studentOs)+'#/supports" target="_blank" rel="noopener">Open My supports in Student OS ↗</a><a class="ls-support-open-os" href="'+esc(cfg.formLauncher)+'?project='+encodeURIComponent(cfg.project)+'&amp;type=student" target="_blank" rel="noopener">Knowledge &amp; skill reflection ↗</a></div>';
drawer.querySelector('.ls-support-close').onclick=close;drawer.querySelector('.ls-support-step').onchange=function(){current=this.value;history.replaceState(null,'','#'+current);render()};drawer.querySelectorAll('.ls-support-toggle input').forEach(function(i){i.onchange=function(){if(this.checked&&chosen.indexOf(this.value)<0)chosen.push(this.value);if(!this.checked)chosen=chosen.filter(function(x){return x!==i.value});localStorage.setItem(key,JSON.stringify(chosen));log(this.value,this.checked?'enabled':'disabled');render()}});drawer.querySelectorAll('[data-check]').forEach(function(i){i.onchange=function(){localStorage.setItem(key+':'+current+':'+this.dataset.check,this.checked?'1':'0');log('checklist',this.checked?'item_checked':'item_unchecked')}});var a=drawer.querySelector('.ls-support-audio');if(a)a.onclick=function(){speechSynthesis.cancel();speechSynthesis.speak(new SpeechSynthesisUtterance(d.audio));log('audio','played')}}
function open(){drawer.hidden=false;launch.setAttribute('aria-expanded','true');render();drawer.querySelector('.ls-support-close').focus()}
function close(){speechSynthesis&&speechSynthesis.cancel();drawer.hidden=true;launch.setAttribute('aria-expanded','false');launch.focus()}
launch.onclick=open;document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!drawer.hidden)close()});
window.addEventListener('hashchange',function(){var h=(location.hash||'').replace(/^#/,'');if(data[h]){current=h;if(!drawer.hidden)render()}});
window.addEventListener('message',function(e){if(!e.data||e.data.type!=='student-os-set-supports'||!Array.isArray(e.data.supports))return;chosen=e.data.supports.filter(function(x){return SUPPORTS.indexOf(x)>=0});localStorage.setItem(key,JSON.stringify(chosen));if(!drawer.hidden)render()});
})();
