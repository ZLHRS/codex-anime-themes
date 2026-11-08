const fs=require('node:fs/promises');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const core=require('./core.cjs');
async function resolveSource(configFile,bundledRoot){
 let config;
 try{config=await core.readJson(configFile);}catch(error){if(error.code==='ENOENT')return bundledRoot;throw error;}
 if(typeof config.directory!=='string'||!path.isAbsolute(config.directory))throw new Error('Укажите полный путь к папке локальных тем в theme-source.json.');
 await fs.access(path.join(config.directory,'catalog.json'));
 return config.directory;
}
async function readCatalog(root){
 const entries=await core.readJson(path.join(root,'catalog.json'));
 if(!Array.isArray(entries)||!entries.length)throw new Error('Каталог тем пуст.');
 return Promise.all(entries.map(async t=>{
  if(!/^[a-z0-9][a-z0-9-]{0,63}$/.test(t.id))throw new Error('Некорректный ID темы.');
  const theme=await core.readJson(path.join(root,'themes',t.id,'theme.json'));
  if(theme.id!==t.id)throw new Error('ID темы не совпадает с каталогом.');
  return {...theme,preview:pathToFileURL(path.join(root,'previews',t.id+'-chat.jpg')).href+'?v='+Date.now()};
 }));
}
module.exports={resolveSource,readCatalog};
