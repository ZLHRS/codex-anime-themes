(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;else root.StudioCatalog=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const characters=[
  ['ai-hoshino','Ай Хосино','Ai Hoshino',['ai-bunny-refrain','ai-starlit-encore','ai-prismatic-gaze','ai-violet-supernova']],
  ['waguri','Вагури','Kaoruko Waguri Каоруко',['waguri-snowfall']],
  ['jibril','Джибрил','Jibril',['jibril-amber-library']],
  ['zero-two','Зеро Ту','Zero Two 002',['zero-two-rose']],
  ['kana','Кана','Kana Arima Арима',['kana-soft-garnet','kana-ruby-spotlight']],
  ['kurumi','Куруми','Kurumi Tokisaki Токисаки',['ivory-midnight-frame']],
  ['kurisu','Курису Макисе','Kurisu Makise Кристина',['kurisu-worldline','kurisu-lab-evening']],
  ['maomao','Маомао','Maomao Мао Мао',['jade-silk','jade-evening-garden']],
  ['mahiru','Махиру Сиина','Mahiru Shiina Маюри',['mayuri-amber']],
  ['noelle','Ноэль','Noelle Ноэлль',['tidal-halo','tidal-halo-duo']],
  ['reze','Резе','Reze',['reze-night-bloom']],
  ['rem','Рем','Rem',['rem-azure-fury','rem-butterfly-dream']],
  ['roxy','Рокси','Roxy Migurdia',['azure-morpho']],
  ['cc','Си Си','C.C. CC',['cc-mint-contract']],
  ['sylphie','Сильфи','Sylphie Sylphiette Сильфиетта',['sylphie-moonstone']],
  ['sora','Сора','Sora Kasugano Касугано',['sora-ribbon','private-duo']],
  ['tatsumaki','Татсумаки','Tatsumaki Тацумаки',['tatsumaki-jade','tatsumaki-jade-duo','tatsumaki-jade-solo']],
  ['fern','Ферн','Fern',['fern-plum-hush','frieren-fern-lilac','violet-silhouette']],
  ['frieren','Фрирен','Frieren',['frieren-sage-heart','frieren-fern-lilac']],
  ['fubuki','Фубуки','Fubuki',['fubuki-velvet']],
  ['furina','Фурина','Furina',['blue-cat-nocturne','furina-moonlit-repose','furina-silver-slumber','furina-turquoise-current','furina-slate-training','furina-indigo-peace','hu-tao-furina-duality']],
  ['hu-tao','Ху Тао','Hu Tao',['hu-tao-furina-duality']],
  ['shinobu','Шинобу Кочо','Shinobu Kocho',['shinobu-wisteria']]
 ].map(([id,name,aliases,themeIds])=>({id,name,aliases,themeIds}));
 const collections=[
  {id:'all',name:'Все темы',description:'Вся коллекция в одном месте.',icon:'grid'},
  {id:'quiet',name:'Спокойные оттенки',description:'Приглушённые цвета для долгих разговоров и чтения.',icon:'moon',tone:'lilac',themeIds:['slate-cat-glasses','indigo-maid-bell','sapphire-quiet-sign','emerald-stern-gaze','furina-slate-training','cocoa-back-bow','furina-indigo-peace','ruby-playful-smile','garnet-soft-gaze','golden-teal-gaze','plum-velvet','sage-reverie','silver-aquamarine','waguri-snowfall','furina-silver-slumber','rem-butterfly-dream','frieren-fern-lilac','fern-plum-hush','violet-silhouette','teal-peony','stone-focus','forest-retreat']},
  {id:'scenic',name:'Место для мечты',description:'Снежный вечер, библиотека или знакомая лаборатория.',icon:'landscape',tone:'blue',themeIds:['furina-turquoise-current','quiet-kitchen','waguri-snowfall','violet-onsen','jibril-amber-library','kurisu-worldline','kurisu-lab-evening','tatsumaki-jade-duo','tidal-halo-duo']},
  {id:'minimal',name:'Без персонажей',description:'Четыре спокойных пространства для работы и учёбы.',icon:'focus',tone:'sage',themeIds:['stone-focus','amber-study','forest-retreat','midnight-grid']},
  {id:'vivid',name:'Больше цвета',description:'Звёздные глаза, сияние и выразительные акценты.',icon:'sparkles',tone:'rose',themeIds:['ai-bunny-refrain','ai-starlit-encore','ai-prismatic-gaze','ai-violet-supernova','kana-ruby-spotlight','rem-azure-fury','zero-two-rose','hu-tao-furina-duality']},
  {id:'duo',name:'Вдвоём в кадре',description:'Два портрета в одной композиции.',icon:'users',tone:'amber',themeIds:['hu-tao-furina-duality','tatsumaki-jade-duo','crimson-heart-duo','tidal-halo-duo','frieren-fern-lilac']},
  {id:'warm',name:'Тёплый вечер',description:'Янтарь, пыльная роза и мягкий свет.',icon:'sun',tone:'peach',themeIds:['quiet-kitchen','amber-study','mayuri-amber','violet-onsen','jibril-amber-library','kana-soft-garnet','jade-silk']}
 ];
 function normalize(value){return String(value||'').normalize('NFKC').toLocaleLowerCase('ru').replace(/ё/g,'е').trim();}
 function forTheme(id){return characters.filter(c=>c.themeIds.includes(id));}
 function available(themes){const ids=new Set(themes.map(t=>t.id));return characters.map(c=>({...c,count:c.themeIds.filter(id=>ids.has(id)).length})).filter(c=>c.count);}
 function select(themes,{query='',characterIds=[],collection='all',onlyActive=false,selected='',sort='catalog',locale='ru'}={}){
  const group=collections.find(c=>c.id===collection)||collections[0];
  const words=normalize(query).split(/\s+/).filter(Boolean);
  const rows=themes.filter(t=>{
   const people=forTheme(t.id);
   if(onlyActive&&t.id!==selected)return false;
   if(group.themeIds&&!group.themeIds.includes(t.id))return false;
   if(characterIds.length&&!people.some(c=>characterIds.includes(c.id)))return false;
   const haystack=normalize([t.name,t.description,t.searchText,t.author,t.id,...people.flatMap(c=>[c.name,c.aliases])].join(' '));
   return words.every(word=>haystack.includes(word));
  });
  return sort==='name'?rows.sort((a,b)=>a.name.localeCompare(b.name,locale==='en'?'en':'ru')):rows;
 }
 return {characters,collections,normalize,forTheme,available,select};
});
