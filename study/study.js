(function () {
  'use strict';
  var HOME='https://ctwadden.github.io/multimedia-12/';
  var PILOT='https://script.google.com/a/macros/gnspes.ca/s/AKfycbwYvkAgHasYDWkRwz0mknsU9qBGXEDmFkZr165wWNmDuivvlE31lsRDDlQ2_8Ixw8e3/exec';
  var allowed=[HOME,'https://ctwadden.github.io/ps-01-photoshop-foundations/','https://outcome-evidence-map.netlify.app/outputs/recovered-teaching-materials-2026-09-23/guides/'];
  function showError(message){document.getElementById('title').textContent='Multimedia 12 · Lesson view';document.getElementById('content').hidden=true;document.getElementById('error-message').textContent=message;document.getElementById('error').hidden=false;document.getElementById('status').textContent='No work was submitted or progress awarded.';}
  var params=new URLSearchParams(location.search),id=params.get('resource');
  if(Array.from(params.keys()).some(function(k){return k!=='resource';})||params.getAll('resource').length!==1||!/^mm12-[a-f0-9]{20}$/.test(id||'')){showError('Open a named workbook or simulation from the MM12 course page. This view does not accept a URL, account or assignment supplied in the address.');return;}
  fetch('../learning-studio/resources.json',{credentials:'omit',cache:'no-cache',redirect:'error'}).then(function(response){if(!response.ok)throw Error('The published resource catalogue is unavailable. Return to the course page and try again.');return response.json();}).then(async function(catalogue){
    if(catalogue.schema!=='learning-studio.course-resources.v1'||catalogue.course_id!=='MM12'||!Array.isArray(catalogue.resources))throw Error('This catalogue needs a teacher connection check.');
    var matches=catalogue.resources.filter(function(r){return r.id===id;});
    if(matches.length!==1)throw Error('This resource is no longer in the current course catalogue. Return to the course page to choose its current link.');
    var row=matches[0],url=new URL(row.url);
    if(typeof row.title!=='string'||row.title.length>300||Array.from(url.searchParams).some(function(pair){return pair[0]!=='course'||pair[1]!=='MM12';})||!allowed.some(function(prefix){return url.href.indexOf(prefix)===0;})||url.username||url.password||url.hash||!['workbook','simulation','resource'].includes(row.kind))throw Error('This resource destination needs a teacher connection check.');
    var digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(url.href)))).map(function(b){return b.toString(16).padStart(2,'0');}).join('');
    if(row.id!=='mm12-'+digest.slice(0,20))throw Error('This resource identity no longer matches its published address. Return to the current course page.');
    document.title=row.title+' · Multimedia 12';document.getElementById('title').textContent=row.title;
    var original=document.getElementById('original');original.href=url.href;original.hidden=false;
    var workspace=document.getElementById('workspace');workspace.href=PILOT+'?view=course&course=MM12&resource='+encodeURIComponent(id);workspace.hidden=false;
    var status='Use your school workspace for the assigned task and saved feedback. This public resource view does not record completion or achievement. If the resource is blocked in the frame, choose Open original.';
    if(row.status==='historical_reference')status='Earlier reference material. This is not the current Cold Delivery assignment. '+status;
    document.getElementById('status').textContent=status;
    // The original document keeps its real URL, relative assets and browser
    // storage origin. No school session, pupil identity or token enters it.
    var frame=document.getElementById('content');
    frame.addEventListener('load',function(){
      try{
        // Display-time navigation only: do not change approved file bytes,
        // read answer fields/storage or alter original Form destinations.
        var links=frame.contentDocument.querySelectorAll('a[href]');
        Array.from(links).forEach(function(link){
          var href=link.getAttribute('href')||'';
          if(/^https:\/\/script\.google\.com\/(?:a\/macros\/gnspes\.ca\/s|macros\/s)\/(?:AKfycby3lAqgW184t9EnOZg2XHDh6C8jYGZUBFpXeLICFZnAu0Yrkab3hcw6QFboHR7FWVTo|AKfycbwYvkAgHasYDWkRwz0mknsU9qBGXEDmFkZr165wWNmDuivvlE31lsRDDlQ2_8Ixw8e3)\/exec(?:[?#]|$)/.test(href)){
            link.href=workspace.href;link.target='_blank';link.rel='noopener noreferrer';
          }
        });
      }catch(error){
        // Earlier externally hosted references keep their own protected
        // origin. Their school return remains in the parent navigation.
        document.getElementById('status').textContent=status+' For this earlier external reference, use Return to school workspace above.';
      }
    });
    frame.src=url.href;frame.title=row.title;frame.hidden=false;
  }).catch(function(error){showError(error&&error.message||'The resource connection could not be confirmed.');});
})();
