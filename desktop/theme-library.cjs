const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const core=require('./core.cjs');
const local=require('./local-themes.cjs');
const {pathToFileURL}=require('node:url');
const valid=id=>/^[a-z0-9][a-z0-9-]{0,63}$/.test(id);

// Hash every file, including user-supplied artwork. Never follow links outside a pack.
async function filesIn(dir,prefix='') {
 const files=[];
 for(const entry of await fs.readdir(path.join(dir,prefix),{withFileTypes:true})){
  const relative=path.join(prefix,entry.name);
  if(entry.isSymbolicLink())throw new Error('Linked files are not supported in personal themes.');
  if(entry.isDirectory())files.push(...await filesIn(dir,relative));
  else if(entry.isFile())files.push(relative);
 }
 return files.sort();
}
async function fingerprint(dir){
 const hash=crypto.createHash('sha256');
 for(const file of await filesIn(dir)){hash.update(file.replaceAll('\\','/'));hash.update(await fs.readFile(path.join(dir,file)));}
 return hash.digest('hex');
}
async function scan(root){
 let entries;
 try{entries=await fs.readdir(path.join(root,'themes'),{withFileTypes:true});}catch(e){if(e.code==='ENOENT')return [];throw e;}
 const themes=[];
 for(const entry of entries){
  if(!entry.isDirectory()||!valid(entry.name))continue;
  try{const theme=await core.readJson(path.join(root,'themes',entry.name,'theme.json'));
   if(theme.id!==entry.name)throw new Error('Theme ID mismatch');
   themes.push({...theme,sourceRoot:root,preview:pathToFileURL(path.join(root,'previews',entry.name+'-chat.jpg')).href});
  }catch(e){themes.push({invalid:entry.name,error:e.message});}
 }
 return themes;
}
async function preserve(source,theme,personalRoot,bundled){
 const dir=path.join(source,'themes',theme.id),digest=await fingerprint(dir);
 const stock=bundled.get(theme.id);
 if(stock&&digest===await fingerprint(path.join(stock.sourceRoot,'themes',theme.id)))return null;
 // Content-addressed IDs keep both edits instead of overwriting either one.
 const id='personal-'+theme.id.slice(0,40)+'-'+digest.slice(0,12);
 const destination=path.join(personalRoot,'themes',id);
 if(!await core.exists(path.join(destination,'theme.json'))){
  const temporary=destination+'.pending';
  await fs.mkdir(path.dirname(destination),{recursive:true});
  await fs.cp(dir,temporary,{recursive:true,force:true});
  const copy={...await core.readJson(path.join(temporary,'theme.json')),id,name:theme.name+' · Personal',personalSource:{id:theme.id,digest}};
  await fs.writeFile(path.join(temporary,'theme.json'),JSON.stringify(copy,null,2)+'\n');
  await fs.rename(temporary,destination);
  await fs.mkdir(path.join(personalRoot,'previews'),{recursive:true});
  const preview=path.join(source,'previews',theme.id+'-chat.jpg');
  if(await core.exists(preview))await fs.copyFile(preview,path.join(personalRoot,'previews',id+'-chat.jpg'));
 }
 return id;
}
async function load({bundledRoot,personalRoot,externalRoots=[]}){
 const stock=(await local.readCatalog(bundledRoot)).map(t=>({...t,sourceRoot:bundledRoot}));
 const builtins=new Map(stock.map(t=>[t.id,t])),warnings=[],migrated={};
 await fs.mkdir(path.join(personalRoot,'themes'),{recursive:true});
 for(const source of [...new Set(externalRoots)].filter(p=>p&&path.resolve(p)!==path.resolve(bundledRoot)&&path.resolve(p)!==path.resolve(personalRoot))){
  try{
   for(const theme of await scan(source)){
    if(theme.invalid){warnings.push(theme.invalid+': '+theme.error);continue;}
    try{const id=await preserve(source,theme,personalRoot,builtins);if(id)migrated[theme.id]=id;}
    catch(e){warnings.push(theme.id+': '+e.message);}
   }
  }catch(e){warnings.push(e.message);}
 }
 const personal=[];
 for(const theme of await scan(personalRoot)){
  if(theme.invalid){warnings.push(theme.invalid+': '+theme.error);continue;}
  if(builtins.has(theme.id)){
   // A manually added pack may use a stock ID. Preserve it with an independent ID.
   const id=await preserve(personalRoot,theme,personalRoot,builtins);
   if(id){const copy=await core.readJson(path.join(personalRoot,'themes',id,'theme.json'));personal.push({...copy,sourceRoot:personalRoot,preview:theme.preview});}
  }else personal.push(theme);
 }
 return {themes:[...stock,...new Map(personal.map(t=>[t.id,t])).values()],warnings,migrated};
}
module.exports={load,preserve,fingerprint};
