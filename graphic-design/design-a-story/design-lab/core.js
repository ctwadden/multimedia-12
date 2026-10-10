/* Small deterministic models; no design-quality score or audience prediction. */
(function(root){
  'use strict';
  const clamp=(n,lo,hi)=>Math.min(hi,Math.max(lo,Number.isFinite(+n)?+n:lo));
  const hue=n=>((+n%360)+360)%360;
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  function hsvHex(h,s,v){
    h=hue(h)/60;s=clamp(s,0,100)/100;v=clamp(v,0,100)/100;
    const c=v*s,x=c*(1-Math.abs(h%2-1)),m=v-c;
    const rgb=[[c,x,0],[x,c,0],[0,c,x],[0,x,c],[x,0,c],[c,0,x]][Math.floor(h)%6];
    return '#'+rgb.map(n=>Math.round((n+m)*255).toString(16).padStart(2,'0')).join('').toUpperCase();
  }
  function validHex(value){return /^#[0-9a-f]{6}$/i.test(value);}
  function luminance(hex){
    if(!validHex(hex))throw new Error('A six-digit HEX colour is required.');
    const c=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);
    return .2126*c[0]+.7152*c[1]+.0722*c[2];
  }
  function contrast(a,b){const l=[luminance(a),luminance(b)].sort((x,y)=>y-x);return(l[0]+.05)/(l[1]+.05);}
  function palette(settings){
    const h=hue(settings.hue),scheme=settings.scheme,offset=scheme==='monochromatic'?0:scheme==='analogous'?30:scheme==='triadic'?120:180;
    return {dominant:hsvHex(h,60,56),supporting:hsvHex(h+offset,30,82),accent:hsvHex(h+(scheme==='triadic'?240:offset),settings.saturation,settings.value),background:settings.background,text:settings.text};
  }
  function cssPalette(p){return '/* Design Lab: chosen sRGB roles; not official brand colours. */\n'+Object.entries(p).map(([name,hex])=>'.'+name+' { color: '+hex+'; }').join('\n')+'\n';}
  function positions(widths,size,tracking,kerning){
    let x=0;const result=[];
    widths.forEach((w,i)=>{if(i>0)x+=size*tracking/1000+(i===1?size*kerning/1000:0);result.push(x);x+=w;});return result;
  }
  function svgStart(w,h,title){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img"><title>${escape(title)}</title>`;}
  function paletteCard(p){return svgStart(600,420,'Selected colour roles with exact HEX values')+'<rect width="600" height="420" fill="#FFFFFF"/><text x="28" y="35" font-family="Arial,sans-serif" font-size="18" fill="#172E32">DESIGN LAB / SELECTED COLOUR ROLES</text>'+Object.entries(p).map(([role,hex],i)=>`<rect x="28" y="${58+i*65}" width="100" height="48" fill="${hex}" stroke="#555555"/><text x="150" y="${79+i*65}" font-family="Arial,sans-serif" font-size="16" fill="#172E32">${escape(role)}</text><text x="150" y="${99+i*65}" font-family="monospace" font-size="14" fill="#172E32">${hex}</text>`).join('')+'</svg>';}
  const api={clamp,hue,escape,hsvHex,validHex,luminance,contrast,palette,cssPalette,positions,svgStart,paletteCard};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DesignModels=api;
})(typeof window!=='undefined'?window:globalThis);
