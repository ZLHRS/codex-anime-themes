const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
test('ASCII settings are bounded and persist through appearance normalization',()=>{
 const norm=require('../desktop/ascii-settings.cjs').normalize;
 assert.deepEqual(norm({speed:100,cell:1,veil:-1,motion:'bad'}),{speed:16,cell:14,veil:0,motion:'grid'});
 const a=require('../desktop/appearance.cjs').normalize({ascii:{speed:2,cell:14,motion:'grid',veil:.5}});
 assert.deepEqual(a.ascii,{speed:2,cell:14,motion:'grid',veil:.5});
});
test('All original ASCII scenes produce isolated valid payloads and settings change their stamp',async()=>{
 const fs=require('node:fs'),core=require('../desktop/core.cjs'),vm=require('node:vm');
 const ids=fs.readdirSync(path.join(root,'themes')).filter(id=>id.startsWith('ascii-'));
 assert.equal(ids.length,12);
 for(const id of ids){const p=await core.payload(root,id);new vm.Script(p.expression);assert.notEqual(p.stamp,(await core.payload(root,id,{ascii:{speed:2}})).stamp);}
});
