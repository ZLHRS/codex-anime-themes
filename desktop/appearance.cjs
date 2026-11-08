const defaults=Object.freeze({brightness:100,size:100,x:0,y:0,animations:true,effects:true});
function normalize(value={}){
 const v=value&&typeof value==='object'?value:{};
 const number=(key,min,max)=>Number.isFinite(v[key])?Math.min(max,Math.max(min,v[key])):defaults[key];
 return {brightness:number('brightness',40,180),size:number('size',60,160),x:number('x',-40,40),y:number('y',-40,40),animations:typeof v.animations==='boolean'?v.animations:true,effects:typeof v.effects==='boolean'?v.effects:true};
}
const designs={
 'ivory-midnight-frame':['Мягкое бежево-лавандовое свечение','geometry','#d5b7a1'],
 'crimson-heart-duo':['Розовые сердца и рубиновое свечение','hearts','#df96ae'],
 'furina-silver-slumber':['Спокойный сон, серебристые пряди и мягкие бирюзовые блики.','moon-dust','#a8c6ed'],
 'silver-azure-bloom':['Серебряные волосы, белые цветы и сияние сапфирового глаза.','flowers','#b9cbe7'],
 'rem-butterfly-dream':['Тихий сон среди ледяных бабочек и мягкого света.','butterfly','#8bcce9'],
 'rem-azure-fury':['Голубое сияние, стальные цепи и розовый акцент.','geometry','#70c9ee'],
 'ai-prismatic-gaze':['Звёздный взгляд, индиго и неоновые блики.','stars','#b9a0ff'],
 'kana-soft-garnet':['Тёплые лепестки','petals','#d6a0a8'],
 'kana-ruby-spotlight':['Рубиновые звёзды','stars','#f69bb9'],
 'ai-bunny-refrain':['Мягкий свет ушек','bunny','#cda2ea'],
 'ai-starlit-encore':['Звёздные блики','stars','#d8abff'],
 'azure-morpho':['Бабочки по краям','butterfly','#76cce9'],
 'blue-cat-nocturne':['Лунный свет','moon','#8fbaff'],
 'cc-mint-contract':['Мятная геометрия','geometry','#9bdcb1'],
 'fubuki-velvet':['Блик зеркала и бархат','mirror','#d6a9c2'],
 'furina-moonlit-repose':['Лунный ореол и пылинки','moon-dust','#b2c3f5'],
 'hu-tao-furina-duality':['Красно-синие переливы','duality','#bf9ac9'],
 'reze-night-bloom':['Ночные цветы','flowers','#bd91c5'],
 'shinobu-wisteria':['Глициния и бабочки','wisteria','#b7a1e6'],
 'sora-ribbon':['Ленточные акценты','ribbon','#d4b3e5'],
 'sylphie-moonstone':['Перламутровые границы','pearl','#d9c6e6'],
 'tatsumaki-jade':['Кольца энергии','rings','#8bdcb1'],
 'tatsumaki-jade-duo':['Общее зелёное свечение','duo','#8bdcb1'],
 'private-duo':['Серебристое свечение','moon','#b9b4cf'],
 'zero-two-rose':['Подсветка рожек и лепестки','petals','#e5a3be']
};
function ornament(kind,color){
 const star='<path d="M35 14 39 29 54 33 39 37 35 52 31 37 16 33 31 29Z"/>';
 const butterfly='<path d="M42 42C4 1 3 58 40 48C9 82 49 78 42 47C74 79 91 47 47 45C90 12 42 1 44 41Z"/>';
 const flower='<g transform="translate(45 45)">'+[0,72,144,216,288].map(a=>`<ellipse cx="0" cy="-13" rx="8" ry="17" transform="rotate(${a})"/>`).join('')+'<circle r="5" fill="none" stroke="currentColor"/></g>';
 const shapes={hearts:'<path d="M45 76 15 46C-4 20 28 4 45 25 62 4 94 20 75 46Z"/>',stars:star,butterfly,geometry:'<path d="M8 45 45 8 82 45 45 82Z M25 45 45 25 65 45 45 65Z" fill="none" stroke="currentColor"/>',flowers:flower,wisteria:'<path d="M12 0Q65 25 44 90" fill="none" stroke="currentColor"/>'+[15,30,45,60].map(y=>`<ellipse cx="46" cy="${y}" rx="7" ry="12" transform="rotate(25 46 ${y})"/>`).join(''),ribbon:'<path d="M6 14Q55 15 64 45T84 90L66 84Q40 58 47 43T6 28Z"/>',petals:'<path d="M26 19Q65 17 55 60Q23 53 26 19Z"/><path d="M70 70Q90 64 84 88Q64 92 70 70Z"/>','moon-dust':star};
 const body=shapes[kind]||'';
 return body?'url("data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="150" viewBox="0 0 120 150" color="${color}" fill="${color}">${body}</svg>`)+'")':'none';
}
function compose(id,value){
 const a=normalize(value);const [label,kind,color]=designs[id]||['Мягкое свечение','moon','#aabbee'];
 const selector='html.codex-theme-studio .main-surface:not(.main-surface .main-surface)';
 const portraits=selector+'::before'+(['tatsumaki-jade-duo','crimson-heart-duo','private-duo'].includes(id)?','+selector+'::after':'');
 const portraitCss=`
${portraits}{filter:brightness(${a.brightness/100})!important;scale:${a.size/100}!important;translate:${a.x}vw ${a.y}vh!important;}
`;
 let css=portraitCss+` html.codex-theme-studio #cts-stage{pointer-events:none!important;user-select:none;}
 .cts-atmosphere{position:absolute;inset:0;pointer-events:none;opacity:.18;background-image:${ornament(kind,color)};background-size:145px 190px;mask-image:linear-gradient(90deg,#000,transparent 24%,transparent 73%,#000);}
 .cts-halo{position:absolute;inset:0;background:radial-gradient(ellipse at 90% 62%,${color}45,transparent 42%);}
 @keyframes cts-drift{50%{transform:translateY(-10px);opacity:.12}}
 @keyframes cts-glow{50%{opacity:.5}}
 @keyframes cts-iridescence{50%{border-color:${color}}}
 `;
 if(['moon','moon-dust'].includes(kind))css+=`.cts-halo{background:radial-gradient(circle at 87% 24%,transparent 0 72px,${color}35 74px,transparent 110px),radial-gradient(ellipse at 85% 40%,${color}30,transparent 48%);}`;
 if(['rings','duo','water'].includes(kind))css+=`.cts-halo{background:repeating-radial-gradient(ellipse at ${kind==='duo'?'50%':'90%'} 72%,transparent 0 65px,${color}22 67px,transparent 70px,transparent 105px);mask-image:linear-gradient(90deg,#000,transparent 30%,transparent 65%,#000);}`;
 if(kind==='duo')css+=`.cts-halo{background:radial-gradient(ellipse at 4% 60%,${color}40,transparent 40%),radial-gradient(ellipse at 96% 60%,${color}40,transparent 40%);}`;
 if(kind==='duality')css+=`.cts-halo{background:linear-gradient(90deg,#ed7e7e22,transparent 40%,transparent 60%,#6cbbff22);}html.codex-theme-studio .sidebar-item[data-app-action-sidebar-thread-selected="true"]{background:linear-gradient(90deg,#c7717144,#719fce44)!important;}`;
 if(kind==='mirror')css+=`.cts-halo{background:linear-gradient(110deg,transparent 78%,${color}28 80%,transparent 82%);}html.codex-theme-studio .app-shell-left-panel{background-image:repeating-linear-gradient(100deg,#ffffff02 0 1px,transparent 1px 4px),linear-gradient(155deg,var(--side-top),var(--side-bottom))!important;}`;
 if(['stars','butterfly','wisteria','ribbon'].includes(kind))css+=`html.codex-theme-studio .sidebar-item[data-app-action-sidebar-thread-selected="true"]::before{background-image:${ornament(kind==='wisteria'?'butterfly':kind,color)};background-size:contain;}`;
 if(['bunny','petals'].includes(kind))css+=`html.codex-theme-studio div:has(> .composer-surface-chrome:focus-within)::before,html.codex-theme-studio div:has(> .composer-surface-chrome:focus-within)::after{filter:drop-shadow(0 0 5px ${color});}`;
 if(kind==='pearl')css+=`html.codex-theme-studio .composer-surface-chrome,html.codex-theme-studio .app-shell-left-panel{border-color:#d8cadc!important;box-shadow:inset 0 0 0 1px #e5d2fa25;}`;
 if(a.animations&&a.effects)css+=`@media(prefers-reduced-motion:no-preference){.cts-atmosphere{animation:cts-drift 18s ease-in-out infinite}.cts-halo{animation:cts-glow 12s ease-in-out infinite}${kind==='pearl'?'html.codex-theme-studio .composer-surface-chrome{animation:cts-iridescence 12s ease-in-out infinite}':''}}`;
 const noMotion=`html.codex-theme-studio .main-surface::before,html.codex-theme-studio .main-surface::after,html.codex-theme-studio .composer-surface-chrome::before,html.codex-theme-studio .composer-surface-chrome::after,html.codex-theme-studio div:has(> .composer-surface-chrome)::before,html.codex-theme-studio div:has(> .composer-surface-chrome)::after{animation:none!important;transition:none!important;}`;
 if(!a.animations)css+=noMotion;
 return {css:a.effects?css:portraitCss+(!a.animations?noMotion:''),chrome:a.effects?'<div data-cts-layer="stage"><div class="cts-halo" aria-hidden="true"></div><div class="cts-atmosphere" aria-hidden="true"></div></div>':'',label,settings:a};
}
module.exports={defaults,normalize,designs,compose};
