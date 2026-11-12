'use strict';
const $=id=>document.getElementById(id);
const Catalog=window.StudioCatalog;
let state,onlyActive=false,pending=false,appearanceTheme=null,appearanceDirty=false,currentPage='skins';
let characterIds=[],draftCharacterIds=new Set(),collection='all';
const appearanceKeys=['brightness','size','x','y'];
const pageInfo={
 skins:['Коллекция тем','СОЗДАЙ СВОЮ АТМОСФЕРУ','Найди свою тему.','Любимые персонажи, красивые места и цвета под настроение.'],
 collections:['Подборки','СОБРАНО С НАСТРОЕНИЕМ','Под твоё настроение.','Несколько способов найти то, что тебе близко.'],
 pets:['Питомцы','ТВОИ МАЛЕНЬКИЕ СПУТНИКИ','В хорошей компании.','Знакомые персонажи оживают прямо в ChatGPT.'],
 settings:['Настройки','ВСЁ ПО-ТВОЕМУ','Детали имеют значение.','Подстрой картинку и приложение так, как удобно тебе.'],
 help:['Инструкция','НАЧАТЬ ПРОСТО','Устраивайся поудобнее.','Как выбрать тему, добавить питомцев и сохранить всё под рукой.']
};
function element(tag,text,className){const el=document.createElement(tag);if(text)el.textContent=text;if(className)el.className=className;return el;}
function icon(name){const el=document.createElementNS('http://www.w3.org/2000/svg','svg');el.classList.add('icon');el.setAttribute('aria-hidden','true');const use=document.createElementNS('http://www.w3.org/2000/svg','use');use.setAttribute('href','#i-'+name);el.append(use);return el;}
function plural(n,one,few,many){return n%10===1&&n%100!==11?one:n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?few:many;}
function setStatus(text,kind=''){$('status').textContent=text;const notice=$('status').parentElement;notice.classList.toggle('is-busy',kind==='busy');notice.classList.toggle('is-error',kind==='error');}
function render(next){
 state=next;
 const chosen=state.themes.find(t=>t.id===state.selected);
 for(const id of ['current','sidebar-current','settings-current']){$(id).textContent=chosen?.name||'Выбери тему в коллекции';$(id).title=chosen?.name||'';}
 $('themes-nav-count').textContent=state.themes.length;
 $('pets-nav-count').textContent=state.petCount||0;
 $('pet-total').textContent=state.petCount||0;
 $('pet-total').nextSibling.nodeValue=' '+plural(state.petCount||0,'персонаж','персонажа','персонажей');
 $('pets-hint').textContent='В наборе '+(state.petCount||0)+' '+plural(state.petCount||0,'питомец','питомца','питомцев')+'. Запрос добавит недостающих и сохранит текущего спутника.';
 $('import-pets').disabled=!state.petCount||pending;
 renderAppearance();
 setStatus(state.status);
 $('reveal').hidden=!state.lastShortcut;
 $('update').disabled=!!state.updating;
 $('update').textContent=state.updating?'Обновляем…':'Подтянуть изменения';
 $('version').textContent='v'+state.version;
 $('platform').textContent={win32:'Windows',darwin:'macOS',linux:'Linux'}[state.platform]||state.platform;
 $('search-shortcut').textContent=state.platform==='darwin'?'⌘ K':'Ctrl K';
 $('app-path').textContent=state.appPath||'ChatGPT не найден автоматически. Укажи путь к установленному приложению.';
 const validIds=new Set(Catalog.available(state.themes).map(c=>c.id));characterIds=characterIds.filter(id=>validIds.has(id));
 renderCollections();renderPets();cards();
}
function cards(){
 if(!state)return;
 const rows=Catalog.select(state.themes,{query:$('search').value,characterIds,collection,onlyActive,selected:state.selected,sort:$('sort').value});
 $('cards').replaceChildren();
 for(const t of rows){
 const card=element('article',null,'card'+(t.id===state.selected?' active':''));const preview=element('button',null,'preview-button');preview.setAttribute('aria-label','Посмотреть '+t.name);const img=element('img');img.src=t.preview;img.alt=t.name;preview.append(img);preview.onclick=()=>{$('preview').querySelector('img').src=t.preview;$('preview').querySelector('p').textContent=t.name+' · демонстрационный чат с настоящими стилями темы';$('preview').showModal();};
 const body=element('div',null,'card-body');body.append(element('h2',t.name),element('div','v'+t.version+'　@'+t.author,'meta'),element('p',t.description,'description'));const apply=element('button',t.id===state.selected?'✓ Выбрана':'Применить','primary');apply.disabled=pending;apply.onclick=()=>applyTheme(t.id);body.append(apply);card.append(preview,body);$('cards').append(card);
 }
 $('empty-state').hidden=rows.length!==0;
 $('result-count').textContent=rows.length+' из '+state.themes.length+' тем';
 renderFilterSummary();
}
function renderFilterSummary(){
 $('all').classList.toggle('selected',collection==='all'&&!onlyActive);$('all').setAttribute('aria-pressed',String(collection==='all'&&!onlyActive));
 $('active').classList.toggle('selected',onlyActive);$('active').setAttribute('aria-pressed',String(onlyActive));
 for(const button of document.querySelectorAll('[data-collection]')){const selected=collection===button.dataset.collection&&!onlyActive;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));}
 $('character-filter').classList.toggle('has-selection',characterIds.length>0);
 $('character-filter-label').textContent=characterIds.length?'Персонажи · '+characterIds.length:'Персонажи';
 $('clear-search').hidden=!$('search').value;
 $('search-shortcut').hidden=!!$('search').value;
 $('filter-tags').replaceChildren();
 function tag(text,remove){const button=element('button',text,'filter-tag');button.append(icon('close'));button.setAttribute('aria-label','Убрать фильтр: '+text);button.onclick=()=>{remove();cards();};$('filter-tags').append(button);}
 for(const id of characterIds){const c=Catalog.characters.find(c=>c.id===id);if(c)tag(c.name,()=>{characterIds=characterIds.filter(x=>x!==id);});}
 if(collection!=='all')tag(Catalog.collections.find(c=>c.id===collection).name,()=>{collection='all';});
 $('reset-filters').hidden=!(characterIds.length||collection!=='all'||onlyActive||$('search').value||$('sort').value!=='catalog');
}
function clearThemeFilters(){characterIds=[];collection='all';onlyActive=false;$('search').value='';$('sort').value='catalog';}
function resetFilters(){clearThemeFilters();cards();}
function chooseCollection(id){clearThemeFilters();collection=id;page('skins');cards();}
function renderCollections(){
 $('collections-grid').replaceChildren();
 for(const c of Catalog.collections.filter(c=>c.id!=='all')){
  const count=Catalog.select(state.themes,{collection:c.id}).length;if(!count)continue;
  const tile=element('button',null,'collection-tile '+c.tone);tile.dataset.collectionId=c.id;
  const top=element('div',null,'collection-top');top.append(icon(c.icon),element('span',count+' '+plural(count,'тема','темы','тем'),'collection-count'));
  tile.append(top,element('h3',c.name),element('p',c.description),icon('arrow'));
  tile.onclick=()=>chooseCollection(c.id);$('collections-grid').append(tile);
 }
}
function renderPets(){
 $('pet-names').replaceChildren();
 for(const pet of state.pets||[])$('pet-names').append(element('span',pet.name,'pet-name'));
}
function page(name){
 if(!pageInfo[name])return;currentPage=name;
 for(const key of Object.keys(pageInfo)){
  $(key+'-page').hidden=key!==name;
  const tab=$(key+'-tab');tab.classList.toggle('selected',key===name);
  if(key===name)tab.setAttribute('aria-current','page');else tab.removeAttribute('aria-current');
 }
 const [breadcrumb,eyebrow,title,description]=pageInfo[name];
 $('breadcrumb').textContent=breadcrumb;$('page-eyebrow').textContent=eyebrow;$('page-title').textContent=title;$('page-description').textContent=description;
 $('page-title').tabIndex=-1;$('page-title').focus({preventScroll:true});window.scrollTo(0,0);
}
function openCharacters(){
 if(!state)return;
 draftCharacterIds=new Set(characterIds);$('character-search').value='';renderCharacters();$('character-dialog').showModal();$('character-search').focus();
}
function renderCharacters(){
 const query=Catalog.normalize($('character-search').value);
 const people=Catalog.available(state.themes).filter(c=>Catalog.normalize(c.name+' '+c.aliases).includes(query));
 $('character-options').replaceChildren();
 for(const c of people){
  const label=element('label',null,'character-option');const input=element('input');input.type='checkbox';input.value=c.id;input.checked=draftCharacterIds.has(c.id);
  input.onchange=()=>{if(input.checked)draftCharacterIds.add(c.id);else draftCharacterIds.delete(c.id);updateCharacterCount();};
  label.append(input,element('span',c.name),element('span',String(c.count),'option-count'));$('character-options').append(label);
 }
 $('character-empty').hidden=people.length!==0;updateCharacterCount();
}
function updateCharacterCount(){$('character-selection-count').textContent=draftCharacterIds.size?'Выбрано: '+draftCharacterIds.size:'Все персонажи';}
async function applyTheme(id){
 if(pending||state?.updating)return;pending=true;cards();setStatus('Сохраняем тему и подключаемся к ChatGPT…','busy');
 try{render(await window.studio.apply(id));}catch(e){setStatus(e.message,'error');}finally{pending=false;cards();}
}
async function runAction(action,message){
 if(pending||state?.updating)return;
 pending=true;cards();$('import-pets').disabled=true;setStatus(message,'busy');
 try{render(await action());}catch(e){setStatus(e.message,'error');}finally{pending=false;cards();$('import-pets').disabled=!state?.petCount;}
}
function readAppearance(){return Object.fromEntries([...appearanceKeys.map(key=>[key,Number($(key).value)]),['animations',$('animations').checked],['effects',$('effects').checked]]);}
function updateAppearanceLabels(){for(const key of appearanceKeys)$(key+'-value').textContent=$(key).value+(['size','brightness'].includes(key)?'%':'% экрана');}
function setAppearance(value){for(const key of appearanceKeys)$(key).value=value[key];$('animations').checked=value.animations;$('effects').checked=value.effects;updateAppearanceLabels();}
function renderAppearance(){
 if(appearanceTheme!==state.selected||!appearanceDirty){setAppearance(state.appearance);appearanceTheme=state.selected;appearanceDirty=false;$('appearance-dirty').textContent='';}
 $('effect-description').textContent=state.effect?'Особенность темы: '+state.effect:'Настрой яркость, размер и положение картинки.';
}
async function saveAppearance(value){if(pending)return;await runAction(async()=>{const next=await window.studio.appearance(state.selected,value);appearanceDirty=false;return next;},'Сохраняем настройки темы…');}
for(const key of [...appearanceKeys,'animations','effects'])$(key).oninput=()=>{appearanceDirty=true;updateAppearanceLabels();$('appearance-dirty').textContent='Есть несохранённые изменения';};
for(const key of Object.keys(pageInfo))$(key+'-tab').onclick=()=>page(key);
$('customize').onclick=()=>page('settings');$('back-to-themes').onclick=()=>page('skins');
$('browse-characters').onclick=()=>{resetFilters();page('skins');openCharacters();};
$('search').oninput=cards;$('sort').onchange=cards;
$('clear-search').onclick=()=>{$('search').value='';cards();$('search').focus();};
$('all').onclick=resetFilters;
$('active').onclick=()=>{clearThemeFilters();onlyActive=true;cards();};
for(const button of document.querySelectorAll('[data-collection]'))button.onclick=()=>{collection=button.dataset.collection;onlyActive=false;cards();};
$('reset-filters').onclick=$('empty-reset').onclick=resetFilters;
$('character-filter').onclick=openCharacters;$('character-search').oninput=renderCharacters;
$('clear-characters').onclick=()=>{draftCharacterIds.clear();renderCharacters();};
$('close-characters').onclick=()=>$('character-dialog').close();
$('done-characters').onclick=()=>{characterIds=[...draftCharacterIds];$('character-dialog').close();cards();};
$('character-dialog').addEventListener('close',()=>$('character-filter').focus());
$('open').onclick=$('launch').onclick=()=>runAction(()=>window.studio.launch(),'Открываем окно ChatGPT…');
$('choose').onclick=()=>runAction(()=>window.studio.choose(),'Выберите приложение…');
$('shortcut').onclick=()=>runAction(()=>window.studio.shortcut(),'Создаём ярлыки…');
$('quit').onclick=()=>window.studio.quit();
$('close-preview').onclick=()=>$('preview').close();
$('update').onclick=()=>runAction(async()=>{const next=await window.studio.update();clearThemeFilters();return next;},'Обновляем темы и проверяем программу…');
$('refresh').onclick=()=>runAction(async()=>{const next=await window.studio.refresh();clearThemeFilters();return next;},'Обновляем список тем…');
$('reveal').onclick=()=>window.studio.reveal();
$('save-appearance').onclick=()=>saveAppearance(readAppearance());
$('reset-appearance').onclick=()=>saveAppearance({brightness:100,size:100,x:0,y:0,animations:true,effects:true});
$('import-pets').onclick=()=>runAction(()=>window.studio.importPets(),'Копируем запрос для импорта питомцев и открываем ChatGPT…');
document.addEventListener('keydown',event=>{
 if((event.ctrlKey||event.metaKey)&&event.code==='KeyK'&&!document.querySelector('dialog[open]')){event.preventDefault();page('skins');$('search').focus();}
});
window.studio.subscribe(render);
window.studio.state().then(render).catch(e=>setStatus('Не удалось загрузить коллекцию: '+e.message,'error'));
