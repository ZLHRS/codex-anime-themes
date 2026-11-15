// Render each authored ChatGPT composition inside an isolated artwork tree.
(() => {
 if(!/^https:\/\/claude\.ai(?:\/|$)/.test(location.href))return;
 const root=document.documentElement,panels=new Map();
 const style=document.createElement('style');
 style.textContent='html[data-zlhrs-artwork]::before{display:none!important}#zlhrs-claude-artwork{position:fixed;pointer-events:none!important;z-index:-1;overflow:hidden}';root.append(style);
 const layer=document.createElement('div');layer.id='zlhrs-claude-artwork';layer.setAttribute('aria-hidden','true');root.append(layer);
 let catalog={},current='',queued=false,version=0;
 const base=':host{display:block;position:absolute;pointer-events:none!important;overflow:hidden;--app-shell-titlebar-height:38px}html,body,.main-surface{display:block;width:100%;height:100%;margin:0;box-sizing:border-box}.main-surface{position:relative;isolation:isolate}#cts-stage{position:absolute;inset:0;z-index:-1;pointer-events:none}body{position:relative}';
 function render(host,scene){
  const shadow=host.shadowRoot||host.attachShadow({mode:'open'});for(const video of shadow.querySelectorAll('video')){video.pause();video.removeAttribute('src');video.load();}shadow.replaceChildren();
  const sheet=document.createElement('style');
  const vars=Object.entries(scene.files).map(([k,v])=>`--cts-asset-${k}:url("${chrome.runtime.getURL(v)}");`).join('');
  sheet.textContent=base+`:host{${vars}}`+scene.css;
  const html=document.createElement('html');html.className='codex-theme-studio';
  const body=document.createElement('body');
  const surface=document.createElement('div');surface.className='main-surface';
  const stage=document.createElement('div');stage.id='cts-stage';
  // Only locally generated decorative markup, never content from Claude.
  stage.innerHTML=scene.chrome||'';
  if(scene.motion){
   const m=scene.motion,ambient=document.createElement('div');ambient.className='cts-ambient-media';ambient.style.backgroundImage=`url("${chrome.runtime.getURL(scene.files[m.poster])}")`;
   if(m.enabled&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const media=document.createElement(m.kind==='video'?'video':'img');media.src=chrome.runtime.getURL(scene.files[m.file]);if(m.kind==='video'){media.muted=true;media.loop=true;media.autoplay=true;media.playsInline=true;media.poster=chrome.runtime.getURL(scene.files[m.poster]);}ambient.append(media);}
   stage.append(ambient);
  }
  surface.append(stage);body.append(surface);html.append(body);shadow.append(sheet,html);
 }
 function removePanel(panel,record){record.overlay.remove();for(const [key,value,priority] of record.saved){if(value)panel.style.setProperty(key,value,priority);else panel.style.removeProperty(key);}panel.removeAttribute('data-zlhrs-right-panel');panels.delete(panel);}
 function layout(){
  queued=false;const id=root.dataset.desktopTheme,scene=catalog._scenes?.[id];
  if(!scene){layer.shadowRoot?.replaceChildren();root.removeAttribute('data-zlhrs-artwork');current='';for(const [p,r] of panels)removePanel(p,r);return;}
  const key=id+':'+version;if(current!==key){render(layer,scene);current=key;}
  root.setAttribute('data-zlhrs-artwork','');
  let left=0;const rightPanels=[];
  for(const el of document.querySelectorAll('aside,[role="complementary"],.dframe-sidebar')){
   const r=el.getBoundingClientRect();if(r.width<=0||r.height<innerHeight*.3||r.width>innerWidth*.65)continue;
   if(r.left<innerWidth*.2)left=Math.max(left,r.right);else if(r.right>innerWidth*.8)rightPanels.push([el,r]);
  }
  const width=Math.max(0,innerWidth-left),height=innerHeight;
  Object.assign(layer.style,{left:left+'px',top:'0px',width:width+'px',height:height+'px'});
  const active=new Set(rightPanels.map(([p])=>p));for(const [p,r] of panels)if(!active.has(p)||!p.isConnected)removePanel(p,r);
  for(const [panel,r] of rightPanels){
   let record=panels.get(panel);
   if(!record){
    const saved=['position','isolation','background-image','background-size','background-position','background-repeat'].map(k=>[k,panel.style.getPropertyValue(k),panel.style.getPropertyPriority(k)]);
    const overlay=document.createElement('div');overlay.setAttribute('aria-hidden','true');overlay.style.cssText='position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:-1';
    const clone=document.createElement('div');overlay.append(clone);panel.prepend(overlay);
    if(getComputedStyle(panel).position==='static')panel.style.setProperty('position','relative');panel.style.setProperty('isolation','isolate');
    for(const k of ['background-image','background-size','background-position','background-repeat'])panel.style.removeProperty(k);
    panel.setAttribute('data-zlhrs-right-panel','');record={overlay,clone,saved,key:''};panels.set(panel,record);
   }
   if(record.key!==key){render(record.clone,scene);record.key=key;}
   Object.assign(record.clone.style,{position:'absolute',left:(left-r.left)+'px',top:-r.top+'px',width:width+'px',height:height+'px'});
  }
  const primary=layer.shadowRoot.querySelector('video');
  if(primary){const playing=!document.hidden&&document.hasFocus()&&!matchMedia('(prefers-reduced-motion: reduce)').matches;for(const video of [primary,...[...panels.values()].map(r=>r.clone.shadowRoot?.querySelector('video')).filter(Boolean)]){if(video!==primary&&Math.abs(video.currentTime-primary.currentTime)>.15)video.currentTime=primary.currentTime;if(playing&&video.paused)video.play().catch(()=>{});else if(!playing)video.pause();}}
 }
 function schedule(){if(!queued){queued=true;requestAnimationFrame(layout);}}
 new MutationObserver(schedule).observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['data-desktop-theme','class','hidden','aria-expanded']});
 new ResizeObserver(schedule).observe(root);addEventListener('resize',schedule);setInterval(schedule,1000);
 let previous='';async function load(){try{const text=await(await fetch(chrome.runtime.getURL('zlhrs-artwork.json'),{cache:'no-store'})).text();if(text!==previous){catalog=JSON.parse(text);previous=text;version++;schedule();}}catch{}}
 load();setInterval(load,3000);
})();
