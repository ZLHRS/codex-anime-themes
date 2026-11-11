const fs=require('node:fs/promises');
const path=require('node:path');
function validate(value){
 if(value?.schemaVersion!==1||!Array.isArray(value.pets))throw new Error('Неверный каталог питомцев.');
 const ids=new Set(),shares=new Set(),names=new Set();
 return value.pets.map(p=>{
  if(!/^[a-z0-9-]{1,64}$/.test(p.id)||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>100||/[\r\n]/.test(p.name)||!/^sharepet_[a-zA-Z0-9_-]+$/.test(p.sharedPetId)||shares.has(p.sharedPetId))throw new Error('Неверная запись питомца.');
  const name=p.name.trim(),nameKey=name.normalize('NFKC').toLocaleLowerCase('ru');
  if(names.has(nameKey))throw new Error('Один персонаж должен иметь одного питомца.');
  ids.add(p.id);shares.add(p.sharedPetId);names.add(nameKey);return {id:p.id,name,sharedPetId:p.sharedPetId};
 });
}
async function read(root){return validate(JSON.parse(await fs.readFile(path.join(root,'pets/catalog.json'),'utf8')));}
function importPrompt(pets){
 if(!pets.length)throw new Error('В этой сборке пока нет опубликованных питомцев.');
 return 'Добавь в мои встроенные ChatGPT Pets всех отсутствующих питомцев из публичного набора ZLHRS Theme Studio. Используй инструмент Pets adopt для каждой ссылки ниже. Сначала получи полный список моих питомцев (все страницы list_pets). Если питомец уже есть по shared_pet_id или точному имени, пропусти его; не создавай повторную копию. Ничего не удаляй, не заменяй и не переключай активного питомца. После импорта проверь список и сообщи, кого добавил, пропустил или не удалось добавить. При недоступности Pets не утверждай, что импорт выполнен.\n\n'+pets.map(p=>p.name+' — https://chatgpt.com/s/'+p.sharedPetId).join('\n');
}
module.exports={validate,read,importPrompt};
