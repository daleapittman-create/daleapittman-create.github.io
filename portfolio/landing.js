(() => {
 const world=document.getElementById('world');
 const nodes=document.querySelector('.nodes');
 const projectPanel=document.getElementById('panel');
 const servicePanel=document.getElementById('services-preview');
 const toggle=document.getElementById('slideshow-toggle');
 const status=document.getElementById('slideshow-status');
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const choices=[...document.querySelectorAll('[data-scene-to]')];
 const revealDelay=3500;
 let ribbonShown=false;
 let scene='portrait',paused=reduce.matches||projectPanel.open,timer=null,touchNode=null;
 const noRibbon=()=>world.classList.contains('no-webgl');
 function schedule(){
  clearTimeout(timer);
  if(!ribbonShown&&scene==='portrait'&&!paused&&!document.hidden&&!projectPanel.open&&!servicePanel.open&&!noRibbon())timer=setTimeout(()=>select('ribbon'),revealDelay);
 }
 function sync(){
  world.dataset.slideshow=ribbonShown?'complete':paused?'paused':'playing';
  if(ribbonShown&&document.activeElement===toggle)choices.find(button=>button.dataset.sceneTo===scene)?.focus();
  toggle.hidden=ribbonShown;
  toggle.style.display=ribbonShown?'none':'';
  toggle.setAttribute('aria-label',paused?'Resume automatic reveal':'Pause automatic reveal');
  toggle.setAttribute('aria-pressed',String(paused));
  toggle.querySelector('span').textContent=paused?'▷':'Ⅱ';
  schedule();
 }
 function select(next){
  if(next==='ribbon'&&noRibbon()){paused=true;sync();show('index');return;}
  scene=next;
  if(scene==='ribbon'){ribbonShown=true;paused=true;}
  world.dataset.scene=scene;nodes.inert=scene!=='ribbon';
  choices.forEach(button=>{const selected=button.dataset.sceneTo===scene;button.classList.toggle('is-active',selected);button.setAttribute('aria-pressed',String(selected));});
  if(scene!=='ribbon'){nodes.querySelectorAll('.is-revealed').forEach(n=>n.classList.remove('is-revealed'));touchNode=null;}
  world.dispatchEvent(new CustomEvent('portfolio-scene-change'));
  sync();
 }
 nodes.addEventListener('click',event=>{
  const node=event.target.closest('.node');
  if(!node)return;
  if(event.pointerType==='touch'&&touchNode!==node){event.preventDefault();event.stopImmediatePropagation();nodes.querySelectorAll('.is-revealed').forEach(n=>n.classList.remove('is-revealed'));node.classList.add('is-revealed');touchNode=node;}
 },true);
 choices.forEach(button=>button.addEventListener('click',()=>{paused=true;select(button.dataset.sceneTo);}));
 document.querySelectorAll('[data-show-ribbon]').forEach(button=>button.addEventListener('click',()=>{paused=true;select('ribbon');status.textContent='Project ribbon selected. Project names appear on hover, focus, or tap.';}));
 toggle.addEventListener('click',()=>{paused=!paused;sync();status.textContent=paused?'Automatic ribbon reveal paused.':'Automatic ribbon reveal resumed.';});
 document.querySelectorAll('[data-preview-services]').forEach(button=>button.addEventListener('click',event=>{event.preventDefault();paused=true;sync();servicePanel.showModal();}));
 servicePanel.querySelector('[data-close-preview]').addEventListener('click',()=>servicePanel.close());
 servicePanel.addEventListener('click',event=>{if(event.target===servicePanel){const r=servicePanel.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)servicePanel.close();}});
 new MutationObserver(()=>{if(projectPanel.open){paused=true;sync();}else schedule();}).observe(projectPanel,{attributes:true,attributeFilter:['open']});
 new MutationObserver(schedule).observe(servicePanel,{attributes:true,attributeFilter:['open']});
 new MutationObserver(()=>{if(noRibbon()){paused=true;toggle.disabled=true;sync();if(scene==='ribbon'){scene='portrait';world.dataset.scene=scene;nodes.inert=true;}}}).observe(world,{attributes:true,attributeFilter:['class']});
 reduce.addEventListener('change',()=>{if(reduce.matches){paused=true;sync();}});
 document.addEventListener('visibilitychange',schedule);
 if(noRibbon()){paused=true;toggle.disabled=true;}
 select('portrait');
})();
