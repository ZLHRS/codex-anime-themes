const fs=require('node:fs/promises'),path=require('node:path');
// A real html/body pair inside Shadow DOM retains selector specificity as well
// as the original cascade. Styles cannot escape this tree into Claude.
function scope(css){return css.replace(/:root\.codex-theme-studio/g,'html.codex-theme-studio');}
async function scene(root,slot,entry,value){
 const dir=path.resolve(entry.sourceRoot||root,entry.path||'themes/'+entry.id);
 const t=JSON.parse(await fs.readFile(path.join(dir,'theme.json'),'utf8'));if(t.ascii)return null;
 const files={};
 async function copy(key,file){
  if(!/^[\w-]+$/.test(key))throw Error('Invalid asset name');
  const source=path.resolve(dir,file);if(!source.startsWith(dir+path.sep))throw Error('Invalid artwork path');
  const bytes=await fs.readFile(source);
  const digest=require('node:crypto').createHash('sha256').update(bytes).digest('hex').slice(0,16);
  const dest='zlhrs-assets/'+t.id+'/'+key+'-'+digest+path.extname(file);
  await fs.mkdir(path.dirname(path.join(slot,dest)),{recursive:true});await fs.writeFile(path.join(slot,dest),bytes);files[key]=dest;return key;
 }
 for(const [key,file] of Object.entries(t.assets||{}))await copy(key,file);
 const enhancement=require('./appearance.cjs').compose(t.id,value);
 const cssPath=path.resolve(dir,t.css);if(!cssPath.startsWith(dir+path.sep))throw Error('Invalid theme CSS');
 const css=scope(await fs.readFile(cssPath,'utf8')+enhancement.css);
 let motion;if(t.motion)motion={kind:/\.(mp4|webm)$/i.test(t.motion.file)?'video':'gif',file:await copy('motion',t.motion.file),poster:await copy('motion-poster',t.motion.poster),enabled:enhancement.settings.animations};
 return {css,files,chrome:enhancement.chrome,motion};
}
module.exports={scene,scope};
