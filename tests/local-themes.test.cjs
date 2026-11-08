const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs/promises');const os=require('node:os');const path=require('node:path');const local=require('../desktop/local-themes.cjs');const core=require('../desktop/core.cjs');
test('local source refresh picks up newly added themes and uses bundled runtime',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'studio-local-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const root=path.resolve(__dirname,'..');const config=path.join(dir,'theme-source.json');
 assert.equal(await local.resolveSource(config,root),root);
 await fs.writeFile(config,JSON.stringify({directory:dir}));await fs.writeFile(path.join(dir,'catalog.json'),'[]');
 assert.equal(await local.resolveSource(config,root),dir);
 async function add(id){await fs.mkdir(path.join(dir,'themes',id),{recursive:true});await fs.writeFile(path.join(dir,'themes',id,'theme.json'),JSON.stringify({id,name:id,css:'theme.css',assets:{}}));await fs.writeFile(path.join(dir,'themes',id,'theme.css'),'body { color: white; }');}
 await add('first');await fs.writeFile(path.join(dir,'catalog.json'),JSON.stringify([{id:'first'}]));assert.equal((await local.readCatalog(dir)).length,1);
 await add('second');await fs.writeFile(path.join(dir,'catalog.json'),JSON.stringify([{id:'first'},{id:'second'}]));assert.deepEqual((await local.readCatalog(dir)).map(t=>t.id),['first','second']);
 const payload=await core.payload(root,'second',{},dir);assert.doesNotThrow(()=>new Function(payload.expression));
 await fs.writeFile(path.join(dir,'catalog.json'),JSON.stringify([{id:'../outside'}]));await assert.rejects(local.readCatalog(dir),/ID/);
});
