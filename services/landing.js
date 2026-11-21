(() => {
 const modal=document.getElementById('services-preview');
 if(modal){
  document.querySelectorAll('[data-open-preview]').forEach(button=>button.addEventListener('click',()=>modal.showModal()));
  modal.querySelector('[data-close-preview]').addEventListener('click',()=>modal.close());
  modal.addEventListener('click',event=>{if(event.target===modal){const r=modal.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)modal.close();}});
 }
 const slides=[...document.querySelectorAll('[data-slide]')];
 if(!slides.length)return;
 const choices=[...document.querySelectorAll('[data-slide-to]')];
 const pause=document.getElementById('pause-slides');
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 let active=0,paused=reduced.matches,timer;
 function show(index){active=index;slides.forEach((slide,i)=>{slide.classList.toggle('is-active',i===index);slide.setAttribute('aria-hidden',String(i!==index));});choices.forEach((button,i)=>{button.classList.toggle('is-active',i===index);button.setAttribute('aria-pressed',String(i===index));});}
 function cycle(){clearInterval(timer);if(!paused&&!document.hidden&&!modal?.open)timer=setInterval(()=>show((active+1)%slides.length),7500);}
 function updatePause(){pause.setAttribute('aria-pressed',String(paused));pause.setAttribute('aria-label',paused?'Play slideshow':'Pause slideshow');pause.querySelector('[data-pause-icon]').textContent=paused?'▷':'Ⅱ';cycle();}
 choices.forEach(button=>button.addEventListener('click',()=>{show(Number(button.dataset.slideTo));paused=true;updatePause();}));
 pause.addEventListener('click',()=>{paused=!paused;updatePause();});
 reduced.addEventListener('change',()=>{if(reduced.matches){paused=true;updatePause();}});
 document.addEventListener('visibilitychange',cycle);
 if(modal){new MutationObserver(cycle).observe(modal,{attributes:true,attributeFilter:['open']});}
 updatePause();
})();
