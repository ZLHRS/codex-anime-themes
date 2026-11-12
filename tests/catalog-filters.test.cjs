const test=require('node:test'),assert=require('node:assert/strict');
const filters=require('../desktop/catalog-filters.js');
const sample=[
 {id:'azure-morpho',name:'Azure Morpho'},
 {id:'hu-tao-furina-duality',name:'Красный и синий'},
 {id:'frieren-fern-lilac',name:'Lilac Quiet'},
 {id:'mayuri-amber',name:'Маюри · Amber Reverie'},
 {id:'stone-focus',name:'Stone Focus'},
 {id:'forest-retreat',name:'Forest Retreat'}
];
test('character aliases find themes whose titles do not contain the character',()=>{
 for(const query of ['Рокси','Roxy','ROXY','  Рокси '])assert.deepEqual(filters.select(sample,{query}).map(t=>t.id),['azure-morpho']);
 assert.equal(filters.select(sample,{query:'Махиру'})[0].id,'mayuri-amber');
 assert.equal(filters.select(sample,{query:'Hu Tao'})[0].id,'hu-tao-furina-duality');
});
test('duo themes belong to both characters and multi-selection does not duplicate them',()=>{
 for(const id of ['frieren','fern'])assert.equal(filters.select(sample,{characterIds:[id]})[0].id,'frieren-fern-lilac');
 assert.equal(filters.select(sample,{characterIds:['frieren','fern']}).length,1);
 assert.deepEqual(filters.select(sample,{characterIds:['roxy','fern']}).map(t=>t.id),['azure-morpho','frieren-fern-lilac']);
});
test('text, collection and characters intersect; active filter and empty results are honest',()=>{
 assert.equal(filters.select(sample,{characterIds:['fern'],collection:'minimal'}).length,0);
 assert.equal(filters.select(sample,{query:'forest',collection:'minimal'}).length,1);
 assert.equal(filters.select(sample,{onlyActive:true,selected:'missing'}).length,0);
 assert.equal(filters.select(sample,{query:'no-match'}).length,0);
});
test('only available characters appear and sorting never mutates the catalog',()=>{
 const names=filters.available(sample).map(c=>c.id);
 assert.ok(names.includes('roxy'));assert.ok(!names.includes('jibril'));
 assert.equal(filters.available(sample).find(c=>c.id==='fern').count,1);
 const original=sample.map(t=>t.id);filters.select(sample,{sort:'name'});assert.deepEqual(sample.map(t=>t.id),original);
});
