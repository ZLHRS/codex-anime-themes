const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const library=require('../desktop/theme-library.cjs');
async function pack(root,id,text){
 await fs.mkdir(path.join(root,'themes',id),{recursive:true});await fs.mkdir(path.join(root,'previews'),{recursive:true});
 await fs.writeFile(path.join(root,'themes',id,'theme.json'),JSON.stringify({id,name:id,css:'theme.css',assets:{background:'photo.png'}}));
 await fs.writeFile(path.join(root,'themes',id,'theme.css'),'body{}');await fs.writeFile(path.join(root,'themes',id,'photo.png'),text);
 await fs.writeFile(path.join(root,'previews',id+'-chat.jpg'),text);
}
test('updates merge new stock themes with durable personal artwork, even with a stale external catalog',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'studio-library-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const bundledRoot=path.join(dir,'bundle'),external=path.join(dir,'old'),personalRoot=path.join(dir,'personal');
 await pack(bundledRoot,'stock','new-stock');await pack(bundledRoot,'new-scene','new-scene');
 await fs.writeFile(path.join(bundledRoot,'catalog.json'),JSON.stringify([{id:'stock'},{id:'new-scene'}]));
 await pack(external,'stock','MY CUSTOM PHOTO');await pack(external,'my-scene','MY OTHER PHOTO');
 await fs.writeFile(path.join(external,'catalog.json'),JSON.stringify([{id:'stock'}]));
 const options={bundledRoot,personalRoot,externalRoots:[external]};
 let result=await library.load(options);assert.deepEqual(result.warnings,[]);assert.equal(result.themes.length,4);
 assert.equal(result.themes.find(x=>x.id==='stock').sourceRoot,bundledRoot);
 const mine=result.migrated.stock,other=result.migrated['my-scene'];assert.ok(mine&&other);
 assert.equal(await fs.readFile(path.join(personalRoot,'themes',mine,'photo.png'),'utf8'),'MY CUSTOM PHOTO');
 result=await library.load(options);assert.equal(result.themes.length,4,'refresh does not duplicate copies');
 await fs.rm(external,{recursive:true});await pack(bundledRoot,'next-release','next');
 await fs.writeFile(path.join(bundledRoot,'catalog.json'),JSON.stringify([{id:'stock'},{id:'new-scene'},{id:'next-release'}]));
 result=await library.load(options);assert.equal(result.themes.length,5);assert.ok(result.themes.some(x=>x.id===mine));assert.ok(result.themes.some(x=>x.id===other));
 assert.equal(await fs.readFile(path.join(personalRoot,'themes',mine,'photo.png'),'utf8'),'MY CUSTOM PHOTO');
 await fs.mkdir(path.join(personalRoot,'themes','broken'),{recursive:true});await fs.writeFile(path.join(personalRoot,'themes','broken','theme.json'),'bad');
 result=await library.load(options);assert.equal(result.themes.length,5);assert.equal(result.warnings.length,1);
});
test('unchanged stock copies are not imported; independent user edits are never overwritten',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'studio-library-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const bundledRoot=path.join(dir,'bundle'),external=path.join(dir,'external'),personalRoot=path.join(dir,'personal');
 await pack(bundledRoot,'stock','same');await pack(external,'stock','same');await fs.writeFile(path.join(bundledRoot,'catalog.json'),'[{"id":"stock"}]');
 const opts={bundledRoot,personalRoot,externalRoots:[external]};assert.equal((await library.load(opts)).themes.length,1);
 await pack(external,'stock','custom');let result=await library.load(opts);const id=result.migrated.stock;
 await fs.writeFile(path.join(personalRoot,'themes',id,'photo.png'),'personal edit');
 result=await library.load(opts);assert.equal(result.themes.length,2);assert.equal(await fs.readFile(path.join(personalRoot,'themes',id,'photo.png'),'utf8'),'personal edit');
});
test('packaged inventory includes every shipped theme and required asset',async()=>{
 const root=path.resolve(__dirname,'..');assert.equal(await require('../desktop/theme-inventory.cjs').verify(root,require('../package.json').version),99);
});
