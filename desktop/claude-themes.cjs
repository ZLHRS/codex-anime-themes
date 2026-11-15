const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const SLOT='fmkadmapgofadopljbjfkapdkoienihi';
async function locate(home=os.homedir()){
 const local=path.join(home,'AppData/Local/Claude-Data');
 const candidates=[];
 for(const name of await fs.readdir(local).catch(()=>[]))candidates.push(path.join(local,name));
 candidates.push(path.join(home,'AppData/Roaming/Claude'),path.join(home,'Library/Application Support/Claude'));
 for(const dir of candidates){const slot=path.join(dir,'extensions',SLOT);try{const m=JSON.parse(await fs.readFile(path.join(slot,'manifest.json'),'utf8'));if(m.content_scripts?.some(s=>s.js?.includes('theme.js')))return slot;}catch{}}
 throw Error('Сначала установите Claude Desktop Themes через /themes → Install extension.');
}
async function syncArtwork(root,slot,entries){
 const manifestPath=path.join(slot,'manifest.json'),manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
 let index=JSON.parse(await fs.readFile(path.join(slot,'zlhrs-artwork.json'),'utf8').catch(()=>'{}'));
 for(const entry of entries){
  if(!/^[a-z0-9-]+$/.test(entry.id))throw Error('Invalid theme id');
  const themeRoot=entry.sourceRoot||root,dir=path.resolve(themeRoot,entry.path||'themes/'+entry.id),t=JSON.parse(await fs.readFile(path.join(dir,'theme.json'),'utf8'));
  if(t.ascii)continue;
  const assets=t.assets||{},background=assets.background||assets.landscape||assets.backdrop||assets.wall||assets.artwork;
  const arts=[];
  for(const [side,file] of [['background',background],['left',assets.left],['right',assets.portrait]]){
   if(!file)continue;
   const source=path.resolve(dir,file);if(!source.startsWith(dir+path.sep))throw Error('Invalid artwork path');
   const target='zlhrs-assets/'+t.id+'/'+side+path.extname(file);
   await fs.mkdir(path.dirname(path.join(slot,target)),{recursive:true});await fs.copyFile(source,path.join(slot,target));arts.push({side,file:target});
  }
  if(arts.length)index['zlhrs-'+t.id]=arts;
  index._scenes||={};
  index._scenes['zlhrs-'+t.id]=await require('./claude-scene.cjs').scene(root,slot,entry,index._appearance?.['zlhrs-'+t.id]);
 }
 await fs.writeFile(path.join(slot,'zlhrs-artwork.json'),JSON.stringify(index));
 const helper=await fs.readFile(path.join(root,'desktop/claude-artwork.js'),'utf8');
 const old=await fs.readFile(path.join(slot,'zlhrs-artwork.js'),'utf8').catch(()=>'');
 await fs.writeFile(path.join(slot,'zlhrs-artwork.js'),helper);
 const added=!manifest.content_scripts.some(s=>s.js?.includes('zlhrs-artwork.js'));
 if(added)manifest.content_scripts.push({matches:['https://claude.ai/*'],js:['zlhrs-artwork.js']});
 if(!manifest.web_accessible_resources.some(r=>r.resources?.includes('zlhrs-artwork.json')))manifest.web_accessible_resources.push({resources:['zlhrs-artwork.json','zlhrs-assets/*'],matches:['https://claude.ai/*']});
 await fs.writeFile(manifestPath,JSON.stringify(manifest,null,2));
 return added||old!==helper;
}
async function apply(root,entry,{home=os.homedir(),slot,appearance}={}){
 slot ||= await locate(home);
 const base=path.join(root,'desktop/claude-data/themes','zlhrs-'+entry.id);
 const t=JSON.parse(await fs.readFile(base+'.json','utf8').catch(()=>{throw Error('Эта тема ещё не экспортирована для Claude.');}));
 const restart=await syncArtwork(root,slot,[entry]);
 const a=require('./appearance.cjs').normalize(appearance);
 const indexFile=path.join(slot,'zlhrs-artwork.json');
 const index=JSON.parse(await fs.readFile(indexFile,'utf8'));
 index._appearance={...index._appearance,[t.id]:a};
 index._scenes||={};index._scenes[t.id]=await require('./claude-scene.cjs').scene(root,slot,entry,a);
 await fs.writeFile(indexFile,JSON.stringify(index));
 const read=name=>fs.readFile(path.join(root,'desktop/claude-data',name),'utf8');
 t.css=await read('_base.css')+'\n'+(t.wallpaper?await read('_wallpaper.css'):'')+'\n'+await fs.readFile(base+'.css','utf8');

 if(t.wallpaper){
  const {sceneModule}=await import('./claude-data/assemble.mjs');
  await fs.mkdir(path.join(slot,'scenes'),{recursive:true});
  await fs.writeFile(path.join(slot,'scenes',t.id+'.js'),sceneModule(await fs.readFile(base+'.js','utf8')));
  Object.assign(t,{scene:'scenes/'+t.id+'.js?v='+Date.now(),motion:'grid',speed:4,cell:14,veil:.4});
  Object.assign(t,a.ascii||{});if(!a.animations)t.speed=0;
  t.css+='\n#desktop-theme-wallpaper{filter:brightness('+a.brightness/100+')!important}';
 }
 await fs.writeFile(path.join(slot,'theme.json'),JSON.stringify(t));
 return {id:t.id,restart};
}
module.exports={locate,syncArtwork,apply};
