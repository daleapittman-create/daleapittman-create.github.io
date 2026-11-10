'use strict';
(() => {
  const canvas = document.getElementById('field-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const root = document.documentElement;
  const fine = matchMedia('(pointer:fine)');
  const initialYaw = -.57;
  let yaw = initialYaw, targetYaw = initialYaw, pitch = -.24, targetPitch = -.24;
  let width = 1, height = 1, raf = 0, previous = 0, elapsed = 0, visible = true, drag = null;
  let mouseX = 0, mouseY = 0, frameX = 0, frameY = 0, draws = 0;
  const shapes = [];
  // An actual 3D arrangement projected into a self-contained Canvas renderer.
  function box(cx,cy,cz,sx,sy,sz,material='metal', twist=0) {
    const points = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(([x,y,z]) => {
      x*=sx/2; y*=sy/2; z*=sz/2;
      return [cx+x*Math.cos(twist)-z*Math.sin(twist), cy+y, cz+x*Math.sin(twist)+z*Math.cos(twist)];
    });
    const faces = [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[0,1,5,4],[3,7,6,2]];
    faces.forEach((indices,i) => shapes.push({points:indices.map(k=>points[k]),material,side:i}));
  }
  box(0,1.25,0,3.8,.13,2.25,'dark');
  box(-.45,.67,.15,1.3,1.05,1.4,'metal');
  box(.27,.15,-.45,1.4,1.65,.1,'orange');
  box(.35,-.7,-.50,1.55,.09,.23,'metal');
  box(1,-.25,-.6,.13,2.45,.4,'metal');
  box(-.5,-.4,-.74,.10,2.6,.60,'metal');
  box(-.8,-.5,-.78,.09,2.4,.56,'metal');
  box(-1.1,-.42,-.81,.08,2.15,.5,'dark');
  box(1.10,.28,.15,1.25,.12,1.15,'dark',.07);
  box(.66,.92,.55,.11,.60,1.65,'orange');
  box(1.56,.7,.4,.09,.95,1.9,'metal');
  box(1.77,.70,.5,.08,.72,1.55,'dark');
  box(-.83,.1,.84,1.6,.1,.22,'metal',-.24);
  box(-1.05,-.18,.40,.10,1.2,.95,'glass');
  box(.55,-.2,.8,.72,.09,.88,'metal',.1);
  box(.6,-.43,.8,.35,.45,.35,'metal');
  box(1.45,-.40,-.89,.09,2.65,.45,'glass');
  box(1.95,.40,-.72,.08,1.3,.42,'blue');
  box(-1.5,.6,-.2,.08,1.0,.7,'glass');
  box(.85,1.25,1.65,.07,.08,2.5,'blue');
  const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const sub = (a,b) => a.map((v,i)=>v-b[i]);
  function rotate([x,y,z]) {
    const ya = yaw + frameX, pi = pitch + frameY;
    const xx = x*Math.cos(ya)+z*Math.sin(ya), zz = -x*Math.sin(ya)+z*Math.cos(ya);
    return [xx, y*Math.cos(pi)-zz*Math.sin(pi), y*Math.sin(pi)+zz*Math.cos(pi)];
  }
  function path(points) { ctx.beginPath(); ctx.moveTo(...points[0]); for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);ctx.closePath(); }
  function draw() {
    draws++;
    ctx.clearRect(0,0,width,height);
    const scale = Math.min(width*.178,height*.235), cx = width*.57, cy = height*.49;
    const project = ([x,y,z]) => { const k=6.8/(6.8-z); return [cx+x*scale*k,cy+y*scale*k]; };
    // Broad volumetric pools and a narrow light shaft behind the solid geometry.
    [[cx-20*width/900,cy,scale*1.85,'255,102,29'],[cx+scale*1.35,cy+scale*.25,scale*2.1,'31,105,255']].forEach(([x,y,r,rgb])=>{
      const glow=ctx.createRadialGradient(x,y,0,x,y,r);glow.addColorStop(0,`rgba(${rgb},.12)`);glow.addColorStop(.45,`rgba(${rgb},.055)`);glow.addColorStop(1,`rgba(${rgb},0)`);ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
    });
    ctx.save();ctx.translate(cx+scale,cy);ctx.rotate(-.55);
    const beam=ctx.createLinearGradient(-scale*2,0,scale*2,0);beam.addColorStop(0,'#1c66ff00');beam.addColorStop(.5,'#3e7cfe1c');beam.addColorStop(1,'#2771ff00');ctx.fillStyle=beam;ctx.filter=`blur(${scale*.12}px)`;ctx.fillRect(-scale*2,-scale*.09,scale*4,scale*.18);ctx.restore();
    // Floor shadow and reflected light belong to the sculpture's ground plane.
    ctx.save();ctx.translate(cx,cy+scale*1.65);ctx.scale(1,.23);
    const shadow=ctx.createRadialGradient(0,0,0,0,0,scale*2);shadow.addColorStop(0,'#000c');shadow.addColorStop(1,'#0000');ctx.fillStyle=shadow;ctx.fillRect(-scale*2,-scale*2,scale*4,scale*4);ctx.restore();
    ctx.save();ctx.strokeStyle='#a4c9ff17';ctx.lineWidth=.7;
    path([[-3,1.36,-1.1],[3.2,1.36,-1.1],[3.2,1.36,2.5],[-3,1.36,2.5]].map(rotate).map(project));ctx.stroke();ctx.restore();
    const faces=shapes.map(face=>{
      const points=face.points.map(rotate);const n=cross(sub(points[1],points[0]),sub(points[2],points[0]));const mag=Math.hypot(...n)||1;
      return {...face,points,z:points.reduce((a,p)=>a+p[2],0)/4,n:n.map(v=>v/mag)};
    }).sort((a,b)=>a.z-b.z);
    for(const face of faces){
      const ps=face.points.map(project);const {material,n,side}=face;
      const lit=Math.abs(n[0]*-.5+n[1]*-.7+n[2]*.5);
      const minX=Math.min(...ps.map(p=>p[0])),minY=Math.min(...ps.map(p=>p[1])),maxX=Math.max(...ps.map(p=>p[0])),maxY=Math.max(...ps.map(p=>p[1]));
      const grad=ctx.createLinearGradient(minX,minY,maxX+1,maxY+1);
      if(material==='orange'){
        grad.addColorStop(0,side===0?'#ffb477':'#a54316');grad.addColorStop(.45,'#ff7d31');grad.addColorStop(1,'#703112');
      } else if(material==='blue'){
        grad.addColorStop(0,'#c4e6ff');grad.addColorStop(.3,'#3b89e7');grad.addColorStop(1,'#0d2a58');
      } else if(material==='dark'){
        grad.addColorStop(0,`hsl(217 13% ${10+lit*12}%)`);grad.addColorStop(.48,'#11151a');grad.addColorStop(1,'#05070b');
      } else if(material==='glass'){
        grad.addColorStop(0,'#a7c2df63');grad.addColorStop(.18,'#54779b20');grad.addColorStop(.7,'#0c142482');grad.addColorStop(1,'#ddedfc58');
      } else {
        const lum=18+lit*40;
        grad.addColorStop(0,`hsl(220 7% ${Math.min(92,lum+29)}%)`);grad.addColorStop(.19,`hsl(212 10% ${lum+8}%)`);grad.addColorStop(.49,`hsl(225 6% ${Math.max(9,lum-17)}%)`);grad.addColorStop(.82,`hsl(23 12% ${lum+6}%)`);grad.addColorStop(1,`hsl(212 14% ${lum+22}%)`);
      }
      path(ps);ctx.fillStyle=grad;ctx.fill();
      ctx.strokeStyle=material==='orange'?'#ffbe8777':material==='blue'?'#a3dcff99':material==='glass'?'#e0efff65':`rgba(211,222,236,${.08+lit*.25})`;ctx.lineWidth=Math.max(.6,width/1400);ctx.stroke();
      if((material==='orange'||material==='blue')&&side===1){ctx.save();ctx.shadowBlur=12;ctx.shadowColor=material==='orange'?'#ff7d32':'#3b84ff';ctx.stroke();ctx.restore();}
    }
    // Sparse points make the volume legible without a decorative grid.
    [[-2.3,-1.1,.2],[2.3,-.3,0],[-1.6,1.5,1.8]].forEach((p,i)=>{const [x,y]=project(rotate(p));ctx.fillStyle=i===1?'#76aafc':'#e8ae87';ctx.globalAlpha=.45;ctx.fillRect(x,y,1.5,1.5);ctx.globalAlpha=1;});
  }
  const motion = () => root.dataset.motion !== 'off';
  function tick(time) {
    raf=0;
    if (!visible || document.hidden) {previous=0;return;}
    if(previous && time-previous<32){raf=requestAnimationFrame(tick);return;}
    const dt=previous?Math.min(time-previous,60):33;previous=time;
    if(motion()&&!drag){elapsed+=dt;targetYaw+=dt*.000018;}
    const smoothing=motion()?.10:1;
    yaw+=(targetYaw-yaw)*smoothing;pitch+=(targetPitch-pitch)*smoothing;
    frameX+=((motion()?mouseX:0)-frameX)*smoothing;frameY+=((motion()?mouseY:0)-frameY)*smoothing;
    draw();
    if(motion()||Math.abs(targetYaw-yaw)>.0001||Math.abs(targetPitch-pitch)>.0001)raf=requestAnimationFrame(tick);
  }
  function wake(){if(!raf&&visible&&!document.hidden)raf=requestAnimationFrame(tick);}
  function resize(){const rect=canvas.getBoundingClientRect();const ratio=Math.min(devicePixelRatio||1,1.6);width=Math.max(1,Math.round(rect.width*ratio));height=Math.max(1,Math.round(rect.height*ratio));canvas.width=width;canvas.height=height;wake();}
  function rotateBy(amount){targetYaw+=amount;wake();}
  function reset(){targetYaw=initialYaw;targetPitch=-.24;mouseX=0;mouseY=0;wake();}
  canvas.addEventListener('pointerdown',event=>{if(event.button!==0)return;drag={id:event.pointerId,x:event.clientX,y:event.clientY,yaw:targetYaw,pitch:targetPitch};canvas.setPointerCapture(event.pointerId);canvas.focus({preventScroll:true});});
  canvas.addEventListener('pointermove',event=>{
    if(drag&&event.pointerId===drag.id){targetYaw=drag.yaw+(event.clientX-drag.x)*.006;targetPitch=Math.max(-.65,Math.min(.2,drag.pitch+(event.clientY-drag.y)*.001));wake();}
    else if(fine.matches&&motion()){const rect=canvas.getBoundingClientRect();mouseX=(event.clientX-rect.left-rect.width/2)/rect.width*.1;mouseY=(event.clientY-rect.top-rect.height/2)/rect.height*.05;wake();}
  });
  function endDrag(){drag=null;}
  canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);canvas.addEventListener('lostpointercapture',endDrag);
  canvas.addEventListener('pointerleave',()=>{mouseX=0;mouseY=0;wake();});
  canvas.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();rotateBy(event.key==='ArrowLeft'?-.15:.15);}if(event.key==='Home'){event.preventDefault();reset();}});
  document.querySelectorAll('[data-rotate]').forEach(button=>button.addEventListener('click',()=>rotateBy(Number(button.dataset.rotate)*.25)));
  document.querySelector('[data-reset]')?.addEventListener('click',reset);
  document.addEventListener('portfolio:motion',()=>{previous=0;wake();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;previous=0;}else wake();});
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible){cancelAnimationFrame(raf);raf=0;previous=0;}else wake();},{rootMargin:'80px'}).observe(canvas);
  new ResizeObserver(resize).observe(canvas);resize();
  // A read-only state surface for local quality checks.
  window.portfolioField={get state(){return{yaw,pitch,draws,motion:motion(),visible,animationPending:!!raf};}};
})();
