const path=require('node:path');
const core=require('./core.cjs');
async function verify(root,version){
 const manifest=await core.readJson(path.join(root,'theme-inventory.json'));
 const catalog=await core.readJson(path.join(root,'catalog.json'));
 if(manifest.version!==version||!Array.isArray(manifest.ids)||!manifest.ids.length||
   new Set(catalog.map(t=>t.id)).size!==catalog.length||
   JSON.stringify([...manifest.ids].sort())!==JSON.stringify(catalog.map(t=>t.id).sort()))
  throw new Error('The update contains an incomplete or outdated theme catalog. Please reinstall the complete release.');
 for(const id of manifest.ids){
  const theme=await core.readJson(path.join(root,'themes',id,'theme.json'));
  if(theme.id!==id)throw new Error('Invalid bundled theme: '+id);
  for(const file of [theme.css,...Object.values(theme.assets||{}),...(theme.motion?[theme.motion.file,theme.motion.poster]:[])])
   if(!await core.exists(core.inside(path.join(root,'themes',id),file)))throw new Error('Missing bundled theme asset: '+id+'/'+file);
  if(!await core.exists(path.join(root,'previews',id+'-chat.jpg')))throw new Error('Missing theme preview: '+id);
 }
 return manifest.ids.length;
}
module.exports={verify};
