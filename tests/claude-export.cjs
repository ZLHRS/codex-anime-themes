// Validate exported themes against the reviewed upstream parser and CSS guard.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),dest=path.resolve(process.argv[2]||'dist/claude-code-2.6.11');
const upstream=path.resolve(process.argv[3]||'output/claude-desktop-themes-upstream');
const read=p=>fs.readFileSync(p,'utf8');
let parser=read(path.join(upstream,'hooks/themes.ts')).replace(/^import .*$/gm,'').replace(/export /g,'');
parser=require('node:module').stripTypeScriptTypes(parser);
const parse=vm.runInNewContext('const THUMBS={};'+parser+';parseUserTheme');
const core=read(path.join(upstream,'extension/src/core.js'));
const safe=vm.runInNewContext(core.slice(core.indexOf('const safe ='),core.indexOf('const varsOf ='))+';safe');
const inventory=JSON.parse(read(path.join(dest,'inventory.json')));
assert.equal(inventory.themes.length,JSON.parse(read(path.join(root,'catalog.json'))).length);
assert.equal(new Set(inventory.themes.map(t=>t.id)).size,inventory.themes.length);
for(const t of inventory.themes){
 const base=path.join(dest,'themes',t.id),css=read(base+'.css'),scene=fs.existsSync(base+'.js');
 const parsed=parse(read(base+'.json'),css,scene);assert.ok(parsed,t.id+' parses');
 const complete=read(path.join(upstream,'themes/_base.css'))+'\n'+(scene?read(path.join(upstream,'themes/_wallpaper.css')):'')+'\n'+css;
 assert.ok(safe(complete),t.id+' passes upstream CSS guard');
 if(scene){
  assert.equal(parsed.wallpaper,t.id);
  const helpers=read(path.join(root,'runtime/ascii/helpers.js'));
  const context=vm.createContext({root:{dataset:{}}});
  const sceneObject=vm.runInContext(helpers+'\n'+read(base+'.js')+'\nSCENES['+JSON.stringify(t.id)+']',context);
  for(const time of [0,1,10]){sceneObject.cell?.(10,5,70,40,time);sceneObject.sprites?.(70,40,time);}
 }
}
console.log('PASS: '+inventory.themes.length+' themes accepted by upstream parser and CSS guard; all ASCII scenes compile and draw data.');
