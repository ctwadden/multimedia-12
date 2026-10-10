'use strict';
const M=DesignModels,$=id=>document.getElementById(id),KEY='mm12-design-lab-v1';
const common={titleSize:30,ctaSize:30,aligned:'scattered',groupGap:44,side:'left',repeat:1,hue:195,scheme:'analogous',saturation:62,value:84,background:'#F5F0E8',text:'#172E32',kerning:110,tracking:130,typeSize:72,leading:27,alignment:'left',brief:0,focus:0};
const briefs=[
 {name:'Community arts showcase',title:['ARTS','FAIR'],kicker:'COMMUNITY ARTS SHOWCASE',detail:['Saturday / 1–4 pm','Community hall / Free entry'],action:'COME MAKE ART',constraint:'A welcoming poster for people seeing the event for the first time. Make the event and essential details easy to identify.'},
 {name:'Library reading club',title:['READ','TOGETHER'],kicker:'LIBRARY READING CLUB',detail:['Thursday / 4 pm','School library / Everyone welcome'],action:'JOIN THE CLUB',constraint:'A small phone poster for students. Keep the invitation and meeting details readable when the artwork is reduced.'},
 {name:'Ceramics exhibition',title:['CLAY','& LIGHT'],kicker:'STUDENT CERAMICS EXHIBITION',detail:['Friday / 12–3 pm','School gallery / Free entry'],action:'EXPLORE THE WORK',constraint:'A quiet gallery notice. Give the work room while retaining a clear title, location and visiting time.'},
 {name:'Creative workshop',title:['MAKE','A MARK'],kicker:'CREATIVE WORKSHOP',detail:['Tuesday / 3:30 pm','Art room / Materials provided'],action:'TRY SOMETHING NEW',constraint:'A school screen viewed from the back of a room. Distinguish the invitation from secondary details and test it at a smaller viewing size.'}
];
const studios={
 composition:{name:'Composition',reference:'ikea-1951.jpg',alt:'IKEA 1951 catalogue cover: a red armchair, large IKEA wordmark and a quality guarantee seal.',credit:'IKEA catalogue, 1951 · IKEA Museum',url:'https://www.ikeamuseum.com/en/explore/the-story-of-ikea/history-of-the-logotype/',question:'What do you notice first? Point to scale, contrast and placement. A historical catalogue and your poster have different viewing contexts.',handoff:'Use guides, editable type and shape/image layers to establish a hierarchy and group related details in your own Photoshop poster. Recreate the relationship you tested; develop your own layout and imagery.',steps:[
  {key:'hierarchy',label:'1 / Hierarchy',title:'What needs to read first?',description:'Contrast is a difference; hierarchy uses differences to establish priority. Test relative scale while the words, palette and layout stay fixed.',predict:'If the event title becomes larger than the invitation, what reading order do you expect—and why?',explain:'Which element should read first for this audience? Compare the starting point and your version, using visible evidence.',notes:'<p>Size is one source of emphasis. Weight, position, contrast and space can also establish hierarchy. A larger element does not prove that every viewer notices it first.</p><p>The text sizes here are study units. Ask a viewer for a real reading-order check.</p>',controls:[['titleSize','Title scale','range',26,76,1],['ctaSize','Invitation scale','range',16,34,1]]},
  {key:'grouping',label:'2 / Grouping',title:'Make related things belong.',description:'Alignment creates a shared edge. Proximity groups related information. Change those relationships while the message and type sizes stay fixed.',predict:'What will a shared edge and a smaller date-to-venue gap make easier to understand?',explain:'Point to one shared edge and one grouping relationship. Explain how each helps someone use the information.',notes:'<p>Alignment is not limited to left alignment: centre and right alignment can also be deliberate. Proximity means judging gaps between related and separate groups.</p><p>Negative space is active space around information, not wasted area. More empty space is not automatically better.</p>',seed:{titleSize:64,ctaSize:22},controls:[['aligned','Detail alignment','select',[['scattered','Separate edges'],['shared','Shared left edge']]],['groupGap','Date-to-venue baseline gap','range',20,48,1]]},
  {key:'balance',label:'3 / Balance',title:'Balance need not be symmetry.',description:'Compare the position of the still-life image and the rhythm of repeated graphic accents. The text remains left aligned; your image can counter it or sit alongside it.',predict:'How might moving the image to the other side and repeating the accent marks change the composition?',explain:'Explain your choice of image position and repetition. Identify the visual weight and the space you intentionally kept.',notes:'<p>Balance concerns the distribution of visual weight. Asymmetric compositions can feel balanced; equal mirrored halves are one option.</p><p>Repetition can build rhythm and unity. Scale and proportion describe relationships between elements. These are interpretations to test, not a computer score.</p>',seed:{titleSize:64,ctaSize:22,aligned:'shared',groupGap:24},controls:[['side','Still-life image position','select',[['left','Left side'],['right','Right side']]],['repeat','Repeated accent marks','range',1,3,1]]}
 ]},
 colour:{name:'Colour',reference:'ikea-1984.jpg',alt:'IKEA blue and yellow logotype introduced in 1984, presented as a genuine historical reference.',credit:'IKEA blue/yellow mark, 1984 · IKEA Museum',url:'https://www.ikeamuseum.com/en/explore/the-story-of-ikea/history-of-the-logotype/',question:'Identify the two colour roles and the contrast between them. The lab’s HEX values are your study values, not official IKEA specifications.',handoff:'Export the five named sRGB roles as CSS or a labelled palette card. In Photoshop, create swatches from these HEX values and apply them to editable type/shapes. Adobe documents CSS swatch import; school-version import is not yet tested. Manual fallback: enter one HEX in the foreground colour picker, then add a new swatch. Save and reopen your editable work.',steps:[
  {key:'wheel',label:'1 / Relationships',title:'Choose a relationship, then a role.',description:'A hue relationship suggests a set of colours. Your dominant, supporting, accent, background and text roles determine where those colours work.',predict:'What will happen to the accent hue when you change from analogous to complementary in this digital wheel?',explain:'Name the wheel model and your relationship. Explain where the accent belongs for this message; harmony alone does not guarantee readability.',notes:'<p>This is a digital RGB hue circle: red 0°, green 120°, blue 240°. Opposite red is cyan. The traditional RYB artists’ wheel pairs red with green instead.</p><p>The palette files encode sRGB values. That is separate from which wheel geometry selected them. This lab does not reproduce Adobe Color’s algorithm.</p>',controls:[['scheme','RGB hue relationship','select',[['monochromatic','Monochromatic · one hue'],['analogous','Analogous · +30°'],['complementary','Complementary · +180°'],['triadic','Triadic · +120° / +240°']]],['hue','Starting hue','range',0,359,1]]},
  {key:'saturation',label:'2 / Intensity',title:'Keep the hue. Change the character.',description:'Saturation changes the accent’s colour intensity. HSB value changes its highest RGB channel. Watch the accent marks while the other roles remain fixed.',predict:'What do you expect a less saturated accent to do to this composition? What evidence would make you keep or reject it?',explain:'Compare the two accents and distinguish hue, saturation and value. Explain your selected role and one tradeoff.',notes:'<p>Saturation and value are HSB controls in this digital model. Value is not the same as perceived brightness or WCAG luminance.</p><p>Lower saturation can move a colour toward a neutral. A neutral does not need a meaningful hue. Colour associations depend on the audience, medium and context.</p>',controls:[['saturation','Accent saturation','range',0,100,1],['value','Accent HSB value','range',10,100,1]]},
  {key:'readability',label:'3 / Readability',title:'A harmonious palette can still fail.',description:'Change the exact text and background colours. The calculation checks this flat colour pair; it does not rate the whole poster.',predict:'Will your chosen text/background pair remain easy to distinguish? Predict before checking its contrast ratio.',explain:'Record the ratio and the specific pair. Explain whether the result is enough for the essential details and what a viewer test still needs to check.',notes:'<p>For normal text, WCAG AA uses 4.5:1; qualifying large text uses 3:1. The lab applies the normal-text threshold to this pair without rounding the decision.</p><p>Here the measured pair is used for title, details and invitation. The calculated ratio is unchanged when the poster scales; small type can still become unreadable. Logos have an exception in the guideline. This is not an accessibility certification.</p>',controls:[['text','Text · six-digit HEX','hex'],['background','Background · six-digit HEX','hex']]}
 ]},
 type:{name:'Typography',reference:'ldf-1.jpg',alt:'London Design Festival 2025 identity with red typographic thread linking letterforms.',credit:'London Design Festival identity, 2025 · Domenic Lippa / Pentagram',url:'https://www.pentagram.com/news/london-design-festival-2025-identity-by-domenic-lippa-and-team-2',question:'Notice the letterforms and their connections. Discuss expressive identity versus legibility. This is genuine custom lettering; the study below uses a system font, not the festival’s typeface.',handoff:'Use live editable Photoshop text. Demonstrate a cursor between two letters for pair kerning, a selected run for tracking, and baseline-to-baseline leading. Use the Character controls taught in the unit. Browser fonts and shaping can differ from Photoshop; transfer the relationship, then test the actual output.',steps:[
  {key:'pair',label:'1 / Kerning',title:'One pair. One adjustment.',description:'The highlighted A–V gap is the only pair receiving a manual offset. Later letters move with the run, but their own gaps do not change.',predict:'When you reduce the A–V gap, which other letters should move—and which gaps should stay unchanged?',explain:'Describe the selected pair and the change. Explain why moving later letters is different from changing every later gap.',notes:'<p>Kerning adjusts a pair of characters. Photoshop’s numeric kerning and tracking units are 1/1000 em, so the same number scales with type size.</p><p>This teaching model positions individual glyphs, with automatic pair kerning absent. It is not Photoshop Optical kerning. Georgia is requested; a local serif fallback may be used.</p>',seed:{tracking:0},controls:[['kerning','Manual A–V pair offset','range',-70,160,5],['typeSize','Type size · study units','range',48,80,1]]},
  {key:'range',label:'2 / Tracking',title:'A selected range behaves differently.',description:'Tracking adds spacing across all five gaps in STUDIO. Compare the whole run with a pair adjustment.',predict:'Which gaps change when you reduce tracking across the selected word? How is that different from kerning?',explain:'Name the selected range, state the tracking value and explain the difference between range spacing and pair spacing.',notes:'<p>Tracking adjusts spacing over a selected run. It does not mean adding decorative spaces to the text.</p><p>This manual study has no automatic pair kerning. At a larger type size, the same 1/1000-em value produces a larger absolute offset. Browser rendering is a model, not a Photoshop screenshot.</p>',seed:{kerning:0},controls:[['tracking','Selected-run tracking','range',-30,180,5],['typeSize','Type size · study units','range',48,80,1]]},
  {key:'lines',label:'3 / Leading',title:'Read between the baselines.',description:'Leading is baseline-to-baseline distance. Alignment changes the line edges; the words and glyph widths stay fixed.',predict:'What will increasing baseline distance change? What should remain unchanged when you switch alignment?',explain:'Use the baseline guides to describe leading. Defend an alignment for this short invitation and discuss a different reading context.',notes:'<p>Leading controls baseline-to-baseline spacing. This diagram reports study units; those are not claimed as native Photoshop points.</p><p>Left, centre and right alignment can serve different purposes. Long text also needs attention to line length and, when justified, uneven spacing. This short study does not simulate paragraph justification.</p>',controls:[['leading','Baseline distance · study units','range',26,72,1],['alignment','Line alignment','select',[['left','Left'],['centre','Centre'],['right','Right']]]]}
 ]}
};
for(const [module,studio] of Object.entries(studios))studio.steps.push({key:'transfer',label:'4 / New brief',title:'Make a decision without a model answer.',description:'Choose a new client constraint. Use one set of controls at a time, then defend your choices. The starting study is practice material, not a finished production layout.',predict:'What needs to change for this new audience or viewing condition? Name a relationship you will test.',explain:'Defend your design against the new brief. Include a rejected option, a viewer’s actual response if available, and the next change you will make in Photoshop.',notes:'<p>No recommended values or finished solution are supplied. Changing settings is not evidence that the brief is met: use an observation and an explanation.</p><p>Carry your decision into an original Photoshop design using your own permitted assets. A flat study export does not replace an editable source file.</p>',seed:module==='composition'?{}:{titleSize:64,ctaSize:22,aligned:'shared',groupGap:24},controls:[]});
function freshRecord(step){return{prediction:'',explanation:'',unlocked:false,params:{...common,...step.seed}};}
function sanitize(raw){
  const result={version:1,module:'composition',step:0,studies:{}};
  if(raw&&Object.hasOwn(studios,raw.module)){result.module=raw.module;result.step=M.clamp(raw.step,0,3)|0;}
  for(const [module,studio]of Object.entries(studios)){
    result.studies[module]={};
    for(const step of studio.steps){
      const r=freshRecord(step),old=raw?.studies?.[module]?.[step.key];
      if(old&&typeof old==='object'){
        for(const field of ['prediction','explanation'])if(typeof old[field]==='string')r[field]=old[field].slice(0,field==='prediction'?1200:2000);
        r.unlocked=old.unlocked===true&&r.prediction.trim().length>0;
        for(const key of Object.keys(common)){
          const v=old.params?.[key];
          if(typeof common[key]==='number'&&typeof v==='number'&&Number.isFinite(v))r.params[key]=v;
          if(typeof common[key]==='string'&&typeof v==='string'){
            if(['text','background'].includes(key)&&M.validHex(v))r.params[key]=v.toUpperCase();
            else if({aligned:['scattered','shared'],side:['left','right'],scheme:['monochromatic','analogous','complementary','triadic'],alignment:['left','centre','right']}[key]?.includes(v))r.params[key]=v;
          }
        }
        for(const [key,lo,hi]of [['titleSize',26,76],['ctaSize',16,34],['groupGap',20,48],['repeat',1,3],['hue',0,359],['saturation',0,100],['value',10,100],['kerning',-70,160],['tracking',-30,180],['typeSize',48,80],['leading',26,72],['brief',0,3],['focus',0,2]])r.params[key]=M.clamp(r.params[key],lo,hi);
        for(const key of ['repeat','brief','focus'])r.params[key]|=0;
      }
      result.studies[module][step.key]=r;
    }
  }
  return result;
}
let storageAvailable=true,state;
try{state=sanitize(JSON.parse(localStorage.getItem(KEY)||'null'));}catch{state=sanitize(null);storageAvailable=false;}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));storageAvailable=true;}catch{storageAvailable=false;} $('save-status').textContent=storageAvailable?'Saved in this browser · export before leaving.':'This tab only: storage unavailable. Export your work.';}
const studio=()=>studios[state.module],step=()=>studio().steps[state.step],record=()=>state.studies[state.module][step().key];
function chosenControls(){return step().key==='transfer'?studio().steps[record().params.focus].controls:step().controls;}
function settings(before=false){return before?freshRecord(step()).params:record().params;}
function text(x,y,size,value,fill,extra=''){return `<text x="${x}" y="${y}" font-family="Arial,sans-serif" font-size="${size}" fill="${fill}" ${extra}>${M.escape(value)}</text>`;}
function artwork(p){return DesignArtwork[step().key==='transfer'?(p.brief===1?'book':p.brief===2?'clay':'arts'):'arts'];}
function poster(p,guide){
 const pal=state.module==='colour'?M.palette(p):{dominant:'#243F69',supporting:'#C5C0B6',accent:'#C8512F',background:'#F1ECE3',text:'#162A36'},b=briefs[step().key==='transfer'?p.brief:0],x=44;
 let s=M.svgStart(520,680,`${b.name}: AI-assisted still-life artwork; editable title ${p.titleSize}, invitation ${p.ctaSize}, detail alignment and image position.`)+`<rect width="520" height="680" fill="${pal.background}"/>`;
 s+=text(x,42,10,b.kicker,pal.text,'letter-spacing="1.7"')+text(476,42,10,'01 / CULTURE',pal.text,'text-anchor="end"');
 s+=text(x,114,p.titleSize,b.title[0],pal.text,'font-weight="800" letter-spacing="-1.8"')+text(x,114+p.titleSize*.99,p.titleSize,b.title[1],pal.text,'font-weight="800" letter-spacing="-1.8"');
 const ix=p.side==='right'?116:44;
 if(state.module==='colour')s+=`<rect x="0" y="203" width="520" height="310" fill="${pal.dominant}"/><rect x="0" y="203" width="20" height="310" fill="${pal.supporting}"/>`;
 else s+=`<line x1="44" x2="476" y1="203" y2="203" stroke="${pal.supporting}"/>`;
 s+=`<image data-artwork="hero" href="${artwork(p)}" x="${ix}" y="204" width="360" height="310" preserveAspectRatio="xMidYMid meet"/>`;
 for(let i=0;i<p.repeat;i++)s+=`<rect data-accent="${i}" x="${44+i*32}" y="520" width="24" height="5" fill="${pal.accent}"/>`;
 const dx=p.aligned==='shared'?[44,44]:[44,172];
 s+=text(dx[0],550,17,b.detail[0],pal.text)+text(dx[1],550+p.groupGap,17,b.detail[1],pal.text);
 s+=`<line x1="44" y1="613" x2="476" y2="613" stroke="${pal.text}" stroke-width="1"/>`+text(44,648,p.ctaSize,b.action,pal.text,'font-weight="700"');
 if(guide){s+=`<line x1="44" x2="44" y1="75" y2="656" stroke="#0759A0" stroke-dasharray="6 6"/><line x1="${dx[1]}" x2="${dx[1]}" y1="531" y2="604" stroke="#0759A0" stroke-dasharray="6 6"/>`;s+=text(306,603,11,`detail gap ${p.groupGap}`,'#0759A0');}
 return s+'</svg>';
}
const measureCanvas=document.createElement('canvas'),ctx=measureCanvas.getContext('2d');
function glyphLayout(p,word){ctx.font=`${p.typeSize}px Georgia,serif`;if('fontKerning'in ctx)ctx.fontKerning='none';const widths=[...word].map(c=>ctx.measureText(c).width);return{widths,positions:M.positions(widths,p.typeSize,p.tracking,p.kerning)};}
function typeStudy(p,guide){
 const focus=step().key==='transfer'?p.focus:state.step,key=studio().steps[focus].key,b=briefs[step().key==='transfer'?p.brief:0],word=step().key==='transfer'?b.title[0]:key==='range'?'STUDIO':'AVENUE',pair=word.slice(0,2).split('').join('–');
 let s=M.svgStart(520,680,`Typography study: ${key}; pair offset ${p.kerning}/1000 em; tracking ${p.tracking}/1000 em; baseline distance ${p.leading} study units.`)+'<rect width="520" height="680" fill="#F5F0E8"/>';
 s+=text(36,48,10,'TYPE / SPACE / CULTURE','#172E32','letter-spacing="1.8"');s+=text(484,48,10,'02 / STUDY','#172E32','text-anchor="end"');
 if(key==='lines'){
   const lines=step().key==='transfer'?[b.title.join(' '),...b.detail]:['Art belongs here.','Bring your ideas.','Make something together.'],anchor={left:'start',centre:'middle',right:'end'}[p.alignment],x={left:36,centre:260,right:484}[p.alignment];
   lines.forEach((line,i)=>{const y=205+i*p.leading;if(guide)s+=`<line x1="28" x2="492" y1="${y}" y2="${y}" stroke="#0759A0" stroke-dasharray="5 5"/>`;s+=`<text x="${x}" y="${y}" font-family="Georgia,serif" font-size="27" fill="#172E32" text-anchor="${anchor}">${line}</text>`;});
   s+=text(36,400,14,`Baseline distance: ${p.leading} study units`,'#172E32');
   s+=text(36,426,14,`Alignment: ${p.alignment}`,'#172E32');
 }else{
   const q={...p,kerning:key==='pair'?p.kerning:0,tracking:key==='range'?p.tracking:0},layout=glyphLayout(q,word),end=layout.positions.at(-1)+layout.widths.at(-1),offset=(520-end)/2;
   if(guide){const selected=key==='pair'?layout.positions[1]+layout.widths[1]:end;s+=`<rect x="${offset-8}" y="165" width="${selected+16}" height="${p.typeSize+35}" rx="3" fill="#D6E567"/><line x1="24" y1="${195+p.typeSize}" x2="496" y2="${195+p.typeSize}" stroke="#0759A0" stroke-dasharray="5 5"/>`;}
   [...word].forEach((c,i)=>{s+=`<text data-glyph="${i}" x="${offset+layout.positions[i]}" y="${195+p.typeSize}" font-family="Georgia,serif" font-size="${p.typeSize}" fill="#172E32">${c}</text>`;});
   s+=text(36,398,14,key==='pair'?`Only ${pair}: ${p.kerning} / 1000 em`:`All ${word.length-1} gaps: ${p.tracking} / 1000 em`,'#172E32');
   s+=text(36,424,14,`Type size: ${p.typeSize} study units`,'#172E32');
 }
 if(step().key==='transfer'){if(key!=='lines'){s+=text(36,467,28,b.title[1],'#172E32','font-weight="700"')+text(36,506,15,b.detail[0],'#172E32')+text(36,531,15,b.detail[1],'#172E32');}s+=text(36,592,18,b.action,'#172E32','font-weight="700"');}else{s+=text(36,525,18,b.name,'#172E32','font-weight="700"')+text(36,558,11,'Same words. Same face. Deliberate spacing.','#172E32');}
 s+=`<image data-artwork="hero" href="${artwork(p)}" x="320" y="398" width="170" height="184" preserveAspectRatio="xMidYMid meet"/>`;s+=`<line x1="36" x2="484" y1="617" y2="617" stroke="#172E32"/>`;s+=text(36,646,10,'MANUAL SPACING MODEL / AI-ASSISTED ARTWORK','#172E32','letter-spacing=".7"');return s+'</svg>';
}
function drawWheel(p){
 let s=M.svgStart(200,200,p.saturation===0?'Digital RGB hue wheel. Dominant and supporting markers are shown. The accent is neutral and not plotted as a meaningful hue.':'Digital RGB hue wheel. Markers identify dominant, supporting and accent hue positions.');
 for(let i=0;i<36;i++){const a=(i*10-90)*Math.PI/180,b=((i+1)*10-90)*Math.PI/180;s+=`<path d="M100 100 L${100+86*Math.cos(a)} ${100+86*Math.sin(a)} A86 86 0 0 1 ${100+86*Math.cos(b)} ${100+86*Math.sin(b)} Z" fill="${M.hsvHex(i*10,72,88)}"/>`;}
 s+='<circle cx="100" cy="100" r="53" fill="#FCFBF7"/>';
 const offset=p.scheme==='monochromatic'?0:p.scheme==='analogous'?30:p.scheme==='triadic'?120:180,groups=new Map();
 const roles=[[0,'D'],[offset,'S'],...(p.saturation>0?[[p.scheme==='triadic'?240:offset,'A']]:[])];
 roles.forEach(([off,label])=>{const angle=M.hue(p.hue+off);groups.set(angle,[...(groups.get(angle)||[]),label]);});
 groups.forEach((labels,angle)=>{const a=(angle-90)*Math.PI/180,x=100+69*Math.cos(a),y=100+69*Math.sin(a),label=labels.join('/');s+=`<circle cx="${x}" cy="${y}" r="14" fill="#FFFFFF" stroke="#172E32" stroke-width="2"/>`+text(x,y+4,label.length>3?7:label.length>1?8:11,label,'#172E32','text-anchor="middle" data-role="hue-marker"');});
 s+=text(100,96,11,'RGB HUE','#172E32','text-anchor="middle"')+text(100,112,10,`${p.hue}°`,'#172E32','text-anchor="middle"');return s+'</svg>';
}
function renderControls(){
 let s='',context='';
 if(step().key==='transfer')context=`<div class="control"><label for="client">New brief</label><select id="client">${briefs.slice(1).map((b,i)=>`<option value="${i+1}" ${record().params.brief===i+1?'selected':''}>${b.name}</option>`).join('')}</select><small id="client-constraint">${M.escape(briefs[record().params.brief||1].constraint)}</small></div><div class="control"><label for="focus">Current relationship</label><select id="focus">${studio().steps.slice(0,3).map((v,i)=>`<option value="${i}" ${record().params.focus===i?'selected':''}>${v.title}</option>`).join('')}</select></div>`;
 for(const c of chosenControls()){
   const [key,originalLabel,kind,a,b,increment]=c,value=record().params[key],label=step().key==='transfer'&&key==='kerning'?`Manual ${briefs[record().params.brief].title[0].slice(0,2).split('').join('–')} pair offset`:originalLabel;s+=`<div class="control"><label for="control-${key}">${label}${kind==='range'?`<output id="out-${key}" for="control-${key}">${value}${['kerning','tracking'].includes(key)?' / 1000 em':key==='hue'?'°':''}</output>`:''}</label>`;
   if(kind==='range')s+=`<input id="control-${key}" data-param="${key}" type="range" min="${a}" max="${b}" step="${increment}" value="${value}">`;
   else if(kind==='select')s+=`<select id="control-${key}" data-param="${key}">${a.map(([v,t])=>`<option value="${v}" ${value===v?'selected':''}>${t}</option>`).join('')}</select>`;
   else s+=`<input id="control-${key}" data-param="${key}" type="text" maxlength="7" value="${value}" spellcheck="false" pattern="#[0-9A-Fa-f]{6}" aria-describedby="hex-${key}"><small id="hex-${key}">Use # followed by six HEX digits. Invalid input leaves the last valid colour in place.</small>`;
   s+='</div>';
 }
 $('transfer-context').innerHTML=context;$('control-fields').innerHTML=s;
 $('control-fields').querySelectorAll('[data-param]').forEach(input=>input.addEventListener('input',()=>{
   const key=input.dataset.param;
   if(input.type==='text'&&!M.validHex(input.value)){input.setAttribute('aria-invalid','true');return;}
   input.removeAttribute('aria-invalid');record().params[key]=input.type==='range'?+input.value:['text','background'].includes(key)?input.value.toUpperCase():input.value;
   const out=$('out-'+key);if(out)out.textContent=input.value+(['kerning','tracking'].includes(key)?' / 1000 em':key==='hue'?'°':'');save();renderVisuals();
 }));
 if($('focus'))$('focus').addEventListener('change',()=>{record().params.focus=+$('focus').value;save();renderControls();renderVisuals();});
 if($('client'))$('client').addEventListener('change',()=>{record().params.brief=+$('client').value;save();renderControls();renderVisuals();});
}
function renderVisuals(){
 const p=settings(),initial=settings(true),guide=$('guides').checked;
 // A changed brief uses the same words on both sides, holding content constant.
 if(step().key==='transfer'){initial.brief=p.brief;initial.focus=p.focus;}
 const draw=state.module==='type'?typeStudy:poster;
 $('before').innerHTML=draw(initial,guide);$('after').innerHTML=draw(p,guide);
 $('change-label').textContent=record().unlocked?'Your current settings':'Predict first';
 $('palette').hidden=state.module!=='colour';$('wheel-area').hidden=state.module!=='colour';
 $('export-css').hidden=$('export-palette').hidden=state.module!=='colour';
 let feedback='',description='';
 const key=step().key==='transfer'?studio().steps[p.focus].key:step().key;
 if(state.module==='composition'){
   if(key==='hierarchy')feedback=`<strong>Title : invitation = ${(p.titleSize/p.ctaSize).toFixed(2)} : 1</strong>The event title is ${p.titleSize} study units; the invitation is ${p.ctaSize}. This describes scale, not measured attention.`;
   if(key==='grouping')feedback=`<strong>${p.aligned==='shared'?'One shared detail edge':'Two separate detail edges'}</strong>Date-to-venue baseline gap: ${p.groupGap}. Venue-to-invitation gap: ${648-(550+p.groupGap)} study units.`;
   if(key==='balance')feedback=`<strong>Image: ${p.side} · accent marks: ${p.repeat}</strong>The title stays on the left. Judge the distribution of weight and the role of repetition with a viewer.`;
   description='AI-assisted still-life artwork for a fictional brief. Your type, layout and graphic accents are editable. Compare the visible relationships; test reading order with a viewer.';
 }else if(state.module==='colour'){
   const pal=M.palette(p),ratio=M.contrast(pal.text,pal.background);
   $('palette').innerHTML=Object.entries(pal).map(([role,hex])=>`<div class="swatch"><div class="chip" style="background:${hex}"></div><strong>${role}</strong><code>${hex}</code></div>`).join('');
   $('wheel-area').innerHTML=`<div>${drawWheel(p)}<section><h3>Digital RGB hue circle</h3><p>D = dominant; S = supporting; A = accent. Shared markers mean shared hue, with different saturation/value roles.${p.saturation===0?' The accent is neutral: A is not plotted as a meaningful hue.':''}</p><p>RGB: red ↔ cyan. Traditional RYB: red ↔ green. These are different selection models; the exported files use sRGB.</p></section></div>`;
   if(key==='wheel')feedback=`<strong>${M.escape(p.scheme)} · base ${p.hue}°</strong>The named role colours follow this RGB hue geometry. A hue relationship does not guarantee legibility or a particular feeling.`;
   if(key==='saturation')feedback=`<strong>Accent ${pal.accent}</strong>Saturation ${p.saturation}% · HSB value ${p.value}%. Only the accent’s intensity/value changes in this study.`;
   if(key==='readability')feedback=`<strong>Text / background: ${ratio.toFixed(2)} : 1</strong>${ratio>=4.5?'Meets':'Below'} the 4.5:1 normal-text AA threshold for this flat pair. The decision uses full precision. Test text size and viewing conditions too.`;
   description=`The measured flat pair is text ${pal.text} on background ${pal.background}. Colour controls change the graphic layers, not the still-life photograph. Other role pairs, images, size and viewing conditions need review.`;
 }else{
   const q=key==='pair'?p.kerning:p.tracking;
   if(key==='lines')feedback=`<strong>Baselines ${p.leading} study units apart</strong>Alignment is ${p.alignment}; changing these controls does not change the glyph widths.`;
   else feedback=`<strong>${key==='pair'?(step().key==='transfer'?briefs[p.brief].title[0].slice(0,2).split('').join('–')+' pair':'A–V pair'):'Selected run'}: ${q} / 1000 em</strong>At size ${p.typeSize}, each affected gap gets ${(p.typeSize*q/1000).toFixed(2)} study units of manual offset. ${key==='pair'?'Later letters move; their own gaps stay fixed.':(step().key==='transfer'?'All '+(briefs[p.brief].title[0].length-1)+' gaps in '+briefs[p.brief].title[0]+' change.':'All five gaps in STUDIO change.')}`;
   description='A manual system-font model: individual glyph positions show pair versus range spacing. Georgia is requested with a local serif fallback. Native Photoshop rendering can differ.';
 }
 $('readout').innerHTML=record().unlocked?feedback:'<strong>Make a prediction first.</strong>The starting point is visible. Unlock the controls to test one relationship.';
 $('visual-description').textContent=description;
}
function render(){
 const s=studio(),t=step(),r=record();
 if(t.key==='transfer'&&!r.params.brief)r.params.brief=1;
 document.querySelectorAll('[data-module]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.module===state.module)));
 $('episodes').innerHTML=s.steps.map((v,i)=>`<button data-step="${i}" ${i===state.step?'aria-current="step"':''}>${v.label}</button>`).join('');
 $('episodes').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>navigate(state.module,+b.dataset.step)));
 $('lesson-label').textContent=s.name+' / '+t.label;$('lesson-title').textContent=t.title;$('lesson-description').textContent=t.description;
 $('reference-image').src='assets/'+s.reference;$('reference-image').alt=s.alt;
 $('reference-credit').innerHTML=`${M.escape(s.credit)} · <a href="${s.url}" target="_blank" rel="noopener">Source ↗</a>`;$('reference-question').textContent=s.question;
 $('prediction-prompt').textContent=t.predict;$('prediction').value=r.prediction;$('explanation').value=r.explanation;
 $('explanation-prompt').textContent=t.explain;$('concept-notes').innerHTML=t.notes;$('handoff-text').textContent=s.handoff;
 $('controls').disabled=!r.unlocked;$('unlock').textContent=r.unlocked?'Prediction recorded · controls open':'Test my prediction';$('unlock').disabled=r.unlocked;
 $('prediction-message').textContent='';$('previous').disabled=state.step===0;$('next').textContent=state.step===3?(state.module==='type'?'Take it to Photoshop ↗':'Next studio →'):'Next study →';
 renderControls();renderVisuals();save();
}
function navigate(module,index){state.module=module;state.step=index;$('guides').checked=false;$('visuals').classList.remove('show-original');$('compare-original').setAttribute('aria-pressed','false');$('compare-original').textContent='Show starting point';render();$('lesson').focus({preventScroll:true});}
document.querySelectorAll('[data-module]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.module,0)));
$('prediction').addEventListener('input',()=>{record().prediction=$('prediction').value;save();});
$('explanation').addEventListener('input',()=>{record().explanation=$('explanation').value;save();});
$('unlock').addEventListener('click',()=>{if(!record().prediction.trim()){$('prediction-message').textContent='Name one change you expect to see before testing.';$('prediction').focus();return;}record().unlocked=true;save();render();});
$('guides').addEventListener('change',renderVisuals);
$('compare-original').addEventListener('click',()=>{const on=$('visuals').classList.toggle('show-original');$('compare-original').setAttribute('aria-pressed',String(on));$('compare-original').textContent=on?'Show your study':'Show starting point';});
$('previous').addEventListener('click',()=>navigate(state.module,Math.max(0,state.step-1)));
$('next').addEventListener('click',()=>{if(state.step<3)navigate(state.module,state.step+1);else if(state.module==='type'){window.location.href='https://ctwadden.github.io/multimedia-12/graphic-design/design-a-story/classroom-v2/project.html';}else{const modules=Object.keys(studios);navigate(modules[modules.indexOf(state.module)+1],0);}});
function download(content,name,mime){const url=URL.createObjectURL(new Blob([content],{type:mime})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('export-status').textContent='Downloaded '+name+'. Keep it with your production evidence.';}
function decisionLog(){let log='DESIGN LAB — MM12 decision evidence\nTeacher-created practice; no achievement score.\n\n';for(const [module,s]of Object.entries(studios)){log+=s.name.toUpperCase()+'\n';for(const t of s.steps){const r=state.studies[module][t.key];if(!r.prediction&&!r.explanation&&!r.unlocked)continue;log+=`\n${t.label}: ${t.title}\nPrediction: ${r.prediction||'[not recorded]'}\nExplanation: ${r.explanation||'[not recorded]'}\nControls tested: ${r.unlocked?'yes':'not yet'}\nStarting settings: ${JSON.stringify({...freshRecord(t).params,brief:r.params.brief,focus:r.params.focus})}\nCurrent settings: ${JSON.stringify(r.params)}\n`;if(module==='colour')log+='Palette: '+JSON.stringify(M.palette(r.params))+'\n';if(t.key==='transfer')log+='Brief: '+briefs[r.params.brief].constraint+'\n';}log+='\n';}return log+'Viewer response, rejected option and Photoshop revision belong in your production defence.\n';}
$('export-log').addEventListener('click',()=>{download(decisionLog(),'MM12_Design_Lab_Decisions.txt','text/plain;charset=utf-8');});
$('export-svg').addEventListener('click',()=>download($('after').innerHTML,`MM12_${state.module}_${step().key}_study.svg`,'image/svg+xml;charset=utf-8'));
$('export-png').addEventListener('click',()=>{
 const url=URL.createObjectURL(new Blob([$('after').innerHTML],{type:'image/svg+xml'})),image=new Image();
 image.onload=()=>{try{const canvas=document.createElement('canvas');canvas.width=1040;canvas.height=1360;canvas.getContext('2d').drawImage(image,0,0,1040,1360);canvas.toBlob(blob=>{if(!blob){$('export-status').textContent='PNG export unavailable. Use the SVG export.';return;}const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=`MM12_${state.module}_${step().key}_study.png`;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);$('export-status').textContent='PNG downloaded. It is a flattened planning reference; keep live Photoshop type and layers.';},'image/png');}catch{$('export-status').textContent='PNG export unavailable. Use the SVG export.';}finally{URL.revokeObjectURL(url);}};
 image.onerror=()=>{URL.revokeObjectURL(url);$('export-status').textContent='PNG export unavailable. Use the SVG export.';};image.src=url;
});
$('export-css').addEventListener('click',()=>download(M.cssPalette(M.palette(record().params)),'MM12_Selected_Palette.css','text/css;charset=utf-8'));
$('export-palette').addEventListener('click',()=>download(M.paletteCard(M.palette(record().params)),'MM12_Selected_Palette.svg','image/svg+xml;charset=utf-8'));
$('print').addEventListener('click',()=>{$('print-log').textContent=decisionLog();window.print();});
$('clear').addEventListener('click',()=>{if(!confirm('Clear this lab’s saved predictions, settings and explanations on this browser? Export first if you need them.'))return;try{localStorage.removeItem(KEY);}catch{}state=sanitize(null);render();$('lesson').focus();});
render();

if(window.location.protocol==='file:')$('offline-archive').hidden=true;
