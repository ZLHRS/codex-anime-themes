const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const i18n=require('../desktop/i18n.js');i18n.add(require('../desktop/i18n-catalog.js'));
test('English covers every theme, effect and collection without changing source data',()=>{
 const catalog=JSON.parse(fs.readFileSync(path.join(__dirname,'../catalog.json')));
 const values=catalog.flatMap(t=>{const theme=JSON.parse(fs.readFileSync(path.join(__dirname,'..',t.path,'theme.json')));return [theme.name,theme.description];});
 values.push(...Object.values(require('../desktop/appearance.cjs').designs).map(d=>d[0]),...require('../desktop/catalog-filters.js').collections.flatMap(c=>[c.name,c.description]));
 for(const value of values){assert(!/[А-Яа-яЁё]/.test(i18n.translate(value,'en')),value);assert.equal(i18n.translate(value,'ru'),value);}
 assert.equal(i18n.translate('Список обновлён: 61 тем.','en'),'List refreshed: 61 themes.');
 assert.equal(i18n.normalize('unknown'),'ru');
});
test('English pet import preserves every share link and duplicate safeguards',async()=>{
 const pets=require('../desktop/pets.cjs'),list=await pets.read(path.join(__dirname,'..'));const text=pets.importPrompt(list,'en');assert(text.startsWith('Add all missing pets'));assert(text.includes('do not create duplicates'));assert(text.includes('do not switch my active pet'));for(const pet of list)assert(text.includes(pet.sharedPetId));
});
