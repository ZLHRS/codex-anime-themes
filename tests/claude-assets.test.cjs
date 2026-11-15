const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {scene}=require('../desktop/claude-scene.cjs');
test('Claude refreshes replaced artwork without reusing its cached URL',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'claude-assets-'));
 try{
  const dir=path.join(root,'themes','sample'),slot=path.join(root,'extension');
  await fs.mkdir(dir,{recursive:true});
  await fs.writeFile(path.join(dir,'theme.json'),JSON.stringify({id:'sample',assets:{portrait:'portrait.webp'},css:'theme.css'}));
  await fs.writeFile(path.join(dir,'theme.css'),'');
  await fs.writeFile(path.join(dir,'portrait.webp'),'old artwork');
  const first=await scene(root,slot,{id:'sample'});
  assert.equal((await scene(root,slot,{id:'sample'})).files.portrait,first.files.portrait);
  await fs.writeFile(path.join(dir,'portrait.webp'),'updated artwork');
  const next=await scene(root,slot,{id:'sample'});
  assert.notEqual(next.files.portrait,first.files.portrait);
  assert.equal(await fs.readFile(path.join(slot,next.files.portrait),'utf8'),'updated artwork');
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
