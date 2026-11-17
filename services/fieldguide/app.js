/* Browser-local UI, adapted from Workshop Market v0.2.1. No services or tracking. */
'use strict';
const C=window.FieldguideCore;
const KEY='dale.fieldguide.services-demo.v1'; // Isolated from the unchanged Fieldguide review build.
const $=id=>document.getElementById(id);
const el=(tag,className,value)=>{const n=document.createElement(tag);if(className)n.className=className;if(value!==undefined)n.textContent=value;return n;};
let state=C.validate(window.FIELDGUIDE_STARTER),storageProblem=null,storageWarning='',toastTimer,currentTab='explore',pendingConfirm=null,proofUrl=null;
const formats={landscape:{w:1920,h:1080,label:'Screen / 1920 × 1080 px',name:'fieldguide-screen-landscape.png'},portrait:{w:1080,h:1920,label:'Screen / 1080 × 1920 px',name:'fieldguide-screen-portrait.png'},letter:{w:2550,h:3300,label:'Letter / 2550 × 3300 px · place at 8.5 × 11 in (300 ppi)',name:'fieldguide-letter-proof.png'},counter:{w:1500,h:2100,label:'Counter card / 1500 × 2100 px · place at 5 × 7 in (300 ppi)',name:'fieldguide-counter-card-proof.png'}};
function notice(message){$('status').textContent=message;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('status').textContent='',5500);}
function storageUI(){
  $('storageNotice').textContent=storageWarning;$('storageNotice').hidden=!storageWarning;
  $('planPersistence').textContent=storageWarning?'Session only. Download a copy before closing.':'Kept in this browser when storage is available. Download a copy to take it with you.';
  $('recoverSaved').hidden=!(storageProblem&&typeof storageProblem.raw==='string');
}
function load(){
  let raw;
  try{raw=localStorage.getItem(KEY);}catch(e){storageProblem={raw:null};storageWarning='Browser storage cannot be read. Changes stay in this session. Download your itinerary or export content before closing.';return;}
  if(raw===null)return;
  try{state=C.validate(JSON.parse(raw));}catch(e){storageProblem={raw};storageWarning='Saved content could not be read and has been preserved. This session uses the fictional starter. Recover the old data in Operator → Content files, or import/reset to replace it.';}
}
function persist(replace=false){
  if(storageProblem&&!replace){storageUI();return false;}
  try{localStorage.setItem(KEY,JSON.stringify(state));storageProblem=null;storageWarning='';storageUI();return true;}
  catch(e){storageWarning='Browser storage is unavailable or full. Changes stay in this session. Download or export a copy before closing.';storageUI();return false;}
}
function resultNotice(message,ok){notice(message+(ok?'':' Changes are session-only; export a copy.'));}
function switchTab(name,focusPanel=false){
  currentTab=name;
  document.querySelectorAll('[role="tab"]').forEach(t=>{const on=t.dataset.tab===name;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1;});
  document.querySelectorAll('.demo-panel').forEach(p=>p.hidden=p.id!=='panel-'+name);
  if(name==='operator'){populateEditor();renderSign();}
  if(focusPanel){$('demo').scrollIntoView({block:'start',behavior:'auto'});$('panel-'+name).focus({preventScroll:true});}
}
function download(content,name,type){
  const blob=content instanceof Blob?content:new Blob([content],{type});const url=URL.createObjectURL(blob);
  const a=el('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
function render(){
  $('venueName').textContent=state.venue.name;$('season').textContent=state.venue.season;
  $('planCount').textContent=state.plan.length;$('planVenue').textContent=state.venue.name+' / '+state.venue.season;
  renderStops();renderPlan();renderEvents();storageUI();invalidateProof();
  if(currentTab==='operator')renderSign();
}
function renderStops(){
  const q=$('search').value.trim().toLocaleLowerCase(),cat=$('category').value;
  const list=state.stops.filter(s=>(cat==='All'||s.category===cat)&&[s.name,s.description,s.location,s.category,s.note].join(' ').toLocaleLowerCase().includes(q));
  $('resultsCount').textContent=list.length+' of '+state.stops.length+' stops';$('stops').replaceChildren();
  if(!list.length){const box=el('div','no-results');box.append(el('h4','','Nothing here yet.'),el('p','','Try another search or show every stop.'));const b=el('button','button','Clear filters');b.onclick=()=>{$('search').value='';$('category').value='All';renderStops();$('search').focus();};box.append(b);$('stops').append(box);return;}
  list.forEach(s=>{
    const saved=state.plan.some(p=>p.id===s.id),a=el('article','stop'+(saved?' saved':'')),art=el('div','stop-art');art.setAttribute('aria-hidden','true');
    art.append(el('span','number',String(state.stops.indexOf(s)+1).padStart(2,'0')),el('span','art-label',s.category.toUpperCase()));
    art.append(el('span','motif '+(['paper','cocoa','studio','pantry','supper','sound'].includes(s.id)?s.id:'paper')));
    const body=el('div','stop-body'),meta=el('p','stop-meta',s.location);meta.append(el('span','',s.note));
    body.append(el('h4','',s.name),el('p','stop-description',s.description),meta);
    const b=el('button','save-button');b.type='button';b.dataset.stop=s.id;b.setAttribute('aria-label',(saved?'Remove ':'Save ')+s.name);b.setAttribute('aria-pressed',String(saved));b.append(el('span','',saved?'Saved to your plan':'Save this stop'),el('span','',saved?'✓':'+'));
    b.onclick=()=>{if(saved)state.plan=state.plan.filter(p=>p.id!==s.id);else state.plan.push({id:s.id,visited:false});const ok=persist();render();document.querySelector('[data-stop="'+s.id+'"]').focus({preventScroll:true});resultNotice(saved?'Stop removed.':'Saved to your plan.',ok);};
    body.append(b);a.append(art,body);$('stops').append(a);
  });
}
function renderPlan(){
  $('planList').replaceChildren();$('emptyPlan').hidden=state.plan.length>0;
  ['printPlan','exportPlan','exportText'].forEach(id=>$(id).disabled=!state.plan.length);
  state.plan.forEach((p,i)=>{
    const s=state.stops.find(s=>s.id===p.id),li=el('li',p.visited?'visited':''),name=el('div','plan-name');name.append(el('span','',s.name));li.append(name,el('p','',s.location),el('p','',s.note));
    const controls=el('div','plan-controls'),label=el('label'),input=el('input');input.type='checkbox';input.checked=p.visited;input.setAttribute('aria-label','Visited '+s.name);
    input.onchange=()=>{p.visited=input.checked;const ok=persist();li.className=p.visited?'visited':'';if(!ok)notice('Visit noted for this session. Download a copy before closing.');};label.append(input,el('span','','Visited'));
    const up=el('button','','↑'),down=el('button','','↓'),remove=el('button','remove-stop','Remove');up.disabled=i===0;down.disabled=i===state.plan.length-1;
    up.setAttribute('aria-label','Move '+s.name+' earlier');down.setAttribute('aria-label','Move '+s.name+' later');remove.setAttribute('aria-label','Remove '+s.name+' from plan');
    up.dataset.move=s.id+'-up';down.dataset.move=s.id+'-down';
    function move(delta){const j=i+delta;[state.plan[i],state.plan[j]]=[state.plan[j],state.plan[i]];const ok=persist();renderPlan();const control=document.querySelector('[data-move="'+s.id+(delta<0?'-down':'-up')+'"]');if(control)control.focus({preventScroll:true});resultNotice('Plan order updated.',ok);}
    up.onclick=()=>move(-1);down.onclick=()=>move(1);
    remove.onclick=()=>{state.plan=state.plan.filter(x=>x.id!==p.id);const ok=persist();render();$('panel-plan').focus({preventScroll:true});resultNotice('Stop removed.',ok);};
    controls.append(label,up,down,remove);li.append(controls);$('planList').append(li);
  });
}
function renderEvents(){
  $('events').replaceChildren();
  if(!state.events.length){$('events').append(el('p','small','No example events in this content file.'));return;}
  state.events.forEach(e=>{
    const a=el('article','event'),b=el('div');a.append(el('span','event-time',e.time));b.append(el('h5','',e.name),el('p','',e.description));
    const button=el('button','text-link','View example details');button.onclick=()=>{$('eventDialogTitle').textContent=e.name;$('eventDialogTime').textContent='Example time · '+e.time;$('eventDialogDescription').textContent=e.description;$('eventDialog').showModal();};b.append(button);
    if(e.url){const link=el('a','text-link','Open supplied event link');link.href=e.url;link.target='_blank';link.rel='noopener noreferrer';b.append(link,el('p','small','Supplied link; verify details with the venue.'));}
    a.append(b);$('events').append(a);
  });
}
function populateEditor(){
  $('editVenue').value=state.venue.name;$('editSeason').value=state.venue.season;$('editHeadline').value=state.venue.headline;
  const previous=$('editStopSelect').value;$('editStopSelect').replaceChildren();state.stops.forEach(s=>{const option=el('option','',s.name);option.value=s.id;$('editStopSelect').append(option);});
  if(state.stops.some(s=>s.id===previous))$('editStopSelect').value=previous;fillStop();
}
function fillStop(){const s=state.stops.find(s=>s.id===$('editStopSelect').value);if(!s)return;['Name','Category','Description','Location','Note'].forEach(k=>$('editStop'+k).value=s[k.toLowerCase()]);}
function ask(title,message,button,action){pendingConfirm=action;$('confirmTitle').textContent=title;$('confirmText').textContent=message;$('confirmProceed').textContent=button;$('confirmDialog').showModal();}
function invalidateProof(){if(proofUrl)URL.revokeObjectURL(proofUrl);proofUrl=null;$('exportReady').replaceChildren();}
/* A constrained typesetter shrinks and wraps approved text to fit each proof.
   The prototype exports RGB pixels only, never a print-production promise. */
function linesFor(ctx,value,maxWidth){
  const lines=[];
  for(const paragraph of value.split('\n')){let line='';for(const word of paragraph.split(/\s+/)){
    const trial=line?line+' '+word:word;if(ctx.measureText(trial).width>maxWidth&&line){lines.push(line);line=word;}else line=trial;
    if(ctx.measureText(line).width>maxWidth){let segment='';for(const char of line){if(ctx.measureText(segment+char).width>maxWidth&&segment){lines.push(segment);segment=char;}else segment+=char;}line=segment;}
  }lines.push(line);}return lines;
}
function fitText(ctx,value,x,y,w,h,size,color,weight=500){
  let lines,lh;for(;size>=10;size--){ctx.font=weight+' '+size+'px Arial';lh=size*1.12;lines=linesFor(ctx,value,w);if(lines.length*lh<=h)break;}
  if(size<10)throw new Error('The copy will not fit this proof. Shorten it before exporting.');
  ctx.fillStyle=color;ctx.textBaseline='top';lines.forEach((line,i)=>ctx.fillText(line,x,y+i*lh));return lines.length*lh;
}
function drawSign(canvas,w,h){
  canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas is unavailable in this browser.');
  const vertical=h>w,W=vertical?1080:1920,H=h/(w/W);ctx.scale(w/W,w/W);
  const bg='#f3f0e8',ink='#19232c',accent=state.venue.color,orange='#ff794b',m=vertical?65:80;
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);ctx.fillStyle=ink;ctx.fillRect(m,m,W-m*2,H-m*2);
  ctx.fillStyle=orange;ctx.beginPath();ctx.arc(W-m, m,vertical?205:260,0,Math.PI*2);ctx.fill();
  fitText(ctx,'FIELDGUIDE / FICTIONAL DEMONSTRATION',m+44,m+40,W-m*2-88,40,17,'#f3f0e8');
  let tx=m+44,ty=m+120,tw=vertical?W-m*2-88:935;
  const titleH=fitText(ctx,state.venue.name,tx,ty,tw,vertical?150:175,vertical?70:90,bg,600);
  const headY=ty+titleH+36;
  const headH=fitText(ctx,state.venue.headline,tx,headY,tw,vertical?225:380,vertical?69:100,orange,500);
  const panelX=vertical?m+35:1130,panelY=vertical?headY+headH+52:m+126,panelW=vertical?W-m*2-70:W-1130-m-30;
  const panelBottom=H-m-(vertical?170:110),panelH=panelBottom-panelY;
  if(panelH<275)throw new Error('The headline is too tall for this layout. Shorten the headline.');
  ctx.fillStyle='#050c10';ctx.fillRect(panelX+12,panelY+14,panelW,panelH);ctx.fillStyle=bg;ctx.fillRect(panelX,panelY,panelW,panelH);
  fitText(ctx,'A FEW GOOD PLACES TO BEGIN',panelX+30,panelY+29,panelW-60,35,15,accent,600);
  const rowH=(panelH-90)/state.stops.length;
  state.stops.forEach((s,i)=>{
    const y=panelY+77+i*rowH;ctx.strokeStyle='#b5c0b1';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(panelX+30,y-10);ctx.lineTo(panelX+panelW-30,y-10);ctx.stroke();
    fitText(ctx,String(i+1).padStart(2,'0'),panelX+30,y,40,rowH-18,13,accent,500);
    fitText(ctx,s.name,panelX+81,y,panelW-111,rowH*.48,vertical?38:30,ink,500);
    fitText(ctx,s.location,panelX+81,y+rowH*.54,panelW-111,rowH*.30,vertical?20:15,accent,400);
  });
  if(!vertical){fitText(ctx,'Choose your own afternoon.',tx,H-m-185,tw,70,33,bg);fitText(ctx,'DISCOVER → SAVE → TAKE ALONG',tx,H-m-117,tw,40,18,'#d2ddd1');}
  else fitText(ctx,'CHOOSE YOUR OWN AFTERNOON.',tx,H-m-119,W-m*2-88,42,20,bg);
  fitText(ctx,'DESIGN PROOF · FICTIONAL CONTENT · NO LIVE OFFERS',tx,H-m-58,W-m*2-88,34,vertical?13:16,bg);
  return canvas;
}
function renderSign(){
  const f=formats[$('signFormat').value];
  try{drawSign($('signPreview'),f.w,f.h);$('signPreview').setAttribute('aria-label',state.venue.name+' fictional signage proof. '+f.label+'. Lists: '+state.stops.map(s=>s.name).join(', '));$('signMeta').textContent=f.label;$('exportSign').disabled=false;}
  catch(e){$('signMeta').textContent='Preview unavailable. '+e.message;$('exportSign').disabled=true;}
}
document.querySelectorAll('[role="tab"]').forEach(tab=>{
  tab.onclick=()=>switchTab(tab.dataset.tab);
  tab.onkeydown=e=>{const names=['explore','plan','operator'],index=names.indexOf(tab.dataset.tab);let next;
    if(e.key==='ArrowRight')next=(index+1)%3;else if(e.key==='ArrowLeft')next=(index+2)%3;else if(e.key==='Home')next=0;else if(e.key==='End')next=2;else return;
    e.preventDefault();switchTab(names[next]);$('tab-'+names[next]).focus();};
});
$('search').addEventListener('input',renderStops);$('category').addEventListener('change',renderStops);
$('viewPlan').onclick=()=>switchTab('plan',true);$('startExploring').onclick=$('addMore').onclick=()=>switchTab('explore',true);
$('printPlan').onclick=()=>{if(!state.plan.length)return;$('printDocument').innerHTML=C.itineraryBody(state);window.print();};
$('exportPlan').onclick=()=>{if(state.plan.length){download(C.itineraryHtml(state),'Fieldguide-My-Afternoon.html','text/html;charset=utf-8');notice('Printable itinerary download requested.');}};
$('exportText').onclick=()=>{if(state.plan.length)download(C.itineraryText(state),'Fieldguide-My-Afternoon.txt','text/plain;charset=utf-8');};
window.addEventListener('beforeprint',()=>{$('printDocument').innerHTML=C.itineraryBody(state);});
$('editStopSelect').onchange=fillStop;
$('venueForm').onsubmit=e=>{e.preventDefault();try{state=C.validate({...state,venue:{...state.venue,name:$('editVenue').value,season:$('editSeason').value,headline:$('editHeadline').value}});const ok=persist();render();$('editorError').textContent='';resultNotice('Venue updated in this demo.',ok);}catch(err){$('editorError').textContent='No changes applied. '+err.message;}};
$('stopForm').onsubmit=e=>{e.preventDefault();try{const id=$('editStopSelect').value,next=C.clone(state),s=next.stops.find(s=>s.id===id);['Name','Category','Description','Location','Note'].forEach(k=>s[k.toLowerCase()]=$('editStop'+k).value);state=C.validate(next);const ok=persist();render();populateEditor();$('editorError').textContent='';resultNotice('Listing updated in the guide and signage.',ok);}catch(err){$('editorError').textContent='No changes applied. '+err.message;}};
$('signFormat').onchange=()=>{invalidateProof();renderSign();};
$('exportSign').onclick=()=>{
  invalidateProof();const f=formats[$('signFormat').value];try{const canvas=drawSign($('signPreview'),f.w,f.h);canvas.toBlob(blob=>{if(!blob){notice('This browser could not create a PNG. Try another browser.');return;}proofUrl=URL.createObjectURL(blob);const a=el('a','', 'Save '+f.name+' ↓');a.href=proofUrl;a.download=f.name;$('exportReady').replaceChildren(a);a.focus();notice('PNG proof ready. Use the save link below the button.');},'image/png');}catch(e){$('signMeta').textContent='Export failed. '+e.message;}
};
$('exportJSON').onclick=()=>{download(JSON.stringify(state,null,2),'Fieldguide-Workshop-Content.json','application/json');notice('Content file download requested. Includes this browser’s plan.');};
$('importJSON').onchange=async e=>{
  const file=e.target.files[0];if(!file)return;
  try{if(file.size>250000)throw new Error('Choose a file smaller than 250 KB.');const next=C.validate(JSON.parse(await file.text()));$('importError').textContent='';
    ask('Replace this demo’s content?','Import “'+next.venue.name+'” with '+next.stops.length+' stops and '+next.plan.length+' saved stops? This replaces this browser’s current guide and plan. Export first if you want to keep your changes.','Import content',()=>{state=next;const ok=persist(true);$('search').value='';$('category').value='All';render();populateEditor();resultNotice('Content imported.',ok);});
  }catch(err){$('importError').textContent='Nothing imported. '+err.message;}finally{e.target.value='';}
};
$('recoverSaved').onclick=()=>{if(storageProblem&&typeof storageProblem.raw==='string')download(storageProblem.raw,'Fieldguide-Unreadable-Data.txt','text/plain');};
$('resetDemo').onclick=()=>ask('Start again?','Restore the fictional Workshop Market content and clear the saved plan in this demo. Export your content first if you want to keep edits. Other Fieldguide editions are not changed.','Restore demo',()=>{state=C.validate(window.FIELDGUIDE_STARTER);const ok=persist(true);$('search').value='';$('category').value='All';$('editorError').textContent='';$('importError').textContent='';render();populateEditor();resultNotice('Fictional demo restored.',ok);});
$('confirmCancel').onclick=()=>{$('confirmDialog').close();pendingConfirm=null;};$('confirmProceed').onclick=()=>{const action=pendingConfirm;pendingConfirm=null;$('confirmDialog').close();if(action)action();};$('confirmDialog').addEventListener('cancel',()=>pendingConfirm=null);
$('closeEvent').onclick=()=>$('eventDialog').close();
load();render();populateEditor();
