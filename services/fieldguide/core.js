/* Fieldguide v0.3. Adapted from the November 4 Workshop Market v0.2.1 kit.
   Shared, DOM-free content validation and itinerary output. No dependencies. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FieldguideCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const CATEGORIES=['Gifts','Food','Experiences'];
  const clone=value=>JSON.parse(JSON.stringify(value));
  function text(value,max,label){if(typeof value!=='string'||!value.trim()||value.length>max)throw new Error(label+' must contain 1–'+max+' characters.');return value.trim();}
  function safeUrl(value){if(value==null||value==='')return '';if(typeof value!=='string'||value.length>1000)throw new Error('Event links must be HTTPS URLs under 1,000 characters.');let u;try{u=new URL(value);}catch(e){throw new Error('Event links must be valid HTTPS URLs.');}if(u.protocol!=='https:'||u.username||u.password)throw new Error('Event links must use HTTPS with no embedded credentials.');return u.href;}
  function validate(data){
    if(!data||data.version!==1)throw new Error('Use a Fieldguide version 1 content file.');
    if((data.edition||'workshop')!=='workshop')throw new Error('This demonstration supports the fictional Workshop Market edition only.');
    const v=data.venue;
    if(!v||!/^#[0-9a-f]{6}$/i.test(v.color))throw new Error('Accent must be a six-digit hex color.');
    const linear=v.color.slice(1).match(/../g).map(c=>parseInt(c,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);
    const luminance=linear.reduce((a,b,i)=>a+b*[.2126,.7152,.0722][i],0);
    if(1.05/(luminance+.05)<4.8)throw new Error('Choose a dark accent so light labels remain readable.');
    const venue={name:text(v.name,60,'Venue name'),season:text(v.season,60,'Edition'),headline:text(v.headline,80,'Headline'),color:v.color};
    if(!Array.isArray(data.stops)||data.stops.length<5||data.stops.length>8)throw new Error('This demonstration supports 5–8 listings.');
    const ids=new Set();
    const stops=data.stops.map(s=>{
      if(!s||typeof s.id!=='string'||!/^[a-z0-9-]{1,40}$/.test(s.id)||ids.has(s.id))throw new Error('Each listing needs a unique lowercase ID.');
      ids.add(s.id);
      if(!CATEGORIES.includes(s.category))throw new Error('Category must be Gifts, Food or Experiences.');
      return {id:s.id,name:text(s.name,60,'Listing name'),category:s.category,description:text(s.description,220,'Description'),location:text(s.location,90,'Location'),note:text(s.note,120,'Visitor note')};
    });
    if(!Array.isArray(data.events)||data.events.length>3)throw new Error('This demonstration supports up to 3 events / event links.');
    const eventIds=new Set();
    const events=data.events.map((e,i)=>{
      if(!e||typeof e!=='object')throw new Error('Each event must contain time, name and description.');
      const id=e.id||'event-'+i;
      if(!/^[a-z0-9-]{1,40}$/.test(id)||eventIds.has(id))throw new Error('Each event needs a unique lowercase ID.');
      eventIds.add(id);
      const result={id,time:text(e.time,20,'Event time'),name:text(e.name,70,'Event name'),description:text(e.description,220,'Event description')};
      const url=safeUrl(e.url);if(url)result.url=url;
      return result;
    });
    const seen=new Set();
    const plan=Array.isArray(data.plan)?data.plan.filter(p=>p&&ids.has(p.id)&&!seen.has(p.id)&&(seen.add(p.id),true)).map(p=>({id:p.id,visited:p.visited===true})):[];
    return {version:1,edition:'workshop',venue,stops,events,plan};
  }
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function itineraryText(state){return ['FIELDGUIDE / '+state.venue.name,state.venue.season,'FICTIONAL DEMONSTRATION — not a real venue guide.','',...state.plan.map((p,i)=>{const s=state.stops.find(s=>s.id===p.id);return (i+1)+'. '+(p.visited?'[visited] ':'[ ] ')+s.name+'\n   '+s.location+'\n   '+s.note;}),'','Personal plan, not directions or verified check-ins. Confirm final venue details before any real visit.'].join('\n');}
  function itineraryBody(state){return '<p class="print-kicker">FIELDGUIDE / FICTIONAL DEMONSTRATION</p><h1>My afternoon</h1><h2>'+escape(state.venue.name)+'</h2><p>'+escape(state.venue.season)+'</p><ol>'+state.plan.map(p=>{const s=state.stops.find(s=>s.id===p.id);return '<li><h3>'+escape(s.name)+(p.visited?' · Visited':'')+'</h3><p>'+escape(s.location)+'</p><p>'+escape(s.note)+'</p></li>';}).join('')+'</ol><p class="print-disclaimer">Workshop Market and all demo listings are fictional. This is a personal plan, not a mapped or optimized route. Visited marks are personal notes, not verified check-ins. No confirmed events, bookings, purchases or live offers.</p>';}
  function itineraryHtml(state){return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>My afternoon — Fieldguide</title><style>body{font:16px/1.5 Arial,sans-serif;color:#19232c;max-width:720px;margin:40px auto;padding:24px;background:#fffdf7}h1{font-size:48px;letter-spacing:-2px;line-height:1.1;margin:28px 0}h2{font-size:25px}h3{font-size:21px;margin:0 0 8px}li{padding:20px 0;border-top:1px solid #bbc5b7;break-inside:avoid}li p{margin:7px 0}ol{padding-left:22px}.print-kicker{font:10px monospace;letter-spacing:1px}.print-disclaimer{font-size:11px;border-top:1px solid #bbc5b7;padding-top:20px;margin-top:30px}.print-help{font-size:12px;background:#eef1e7;padding:15px}@media print{body{margin:0;padding:0;color:black;background:white}.print-help{display:none}h1{font-size:30pt}@page{size:letter;margin:18mm}}</style></head><body><p class="print-help">Use your browser’s Print command to print or save as PDF. This file is self-contained and makes no network requests.</p>'+itineraryBody(state)+'</body></html>';}
  return {CATEGORIES,clone,validate,safeUrl,escape,itineraryText,itineraryBody,itineraryHtml};
});
