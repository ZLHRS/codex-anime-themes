const test=require('node:test'),assert=require('node:assert/strict');
const pets=require('../desktop/pets.cjs');
test('public pet catalog uses shared identities and excludes drafts',async()=>{
 const rows=await pets.read(require('node:path').resolve(__dirname,'..'));
 assert.ok(rows.length>0);
 const prompt=pets.importPrompt(rows);
 for(const p of rows)assert.ok(prompt.includes('https://chatgpt.com/s/'+p.sharedPetId));
 assert.ok(prompt.includes('все страницы list_pets'));
 assert.ok(prompt.includes('не переключай активного питомца'));
 assert.ok(!prompt.includes('pet_6af3a4343114819181c15e72b5d6174b'));
});
test('invalid and repeated shared pets cannot become an import request',()=>{
 const row={id:'reze',name:'Резе',sharedPetId:'sharepet_test'};
 assert.throws(()=>pets.validate({schemaVersion:1,pets:[row,row]}));
 assert.throws(()=>pets.validate({schemaVersion:1,pets:[row,{id:'reze-another-theme',name:'  РЕЗЕ  ',sharedPetId:'sharepet_another'}]}));
 for(const sharedPetId of ['https://evil.example','pet_private','sharepet_x\nextra'])assert.throws(()=>pets.validate({schemaVersion:1,pets:[{...row,sharedPetId}]}));
 assert.throws(()=>pets.importPrompt([]));
});
