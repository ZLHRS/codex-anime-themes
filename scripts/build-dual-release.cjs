const fs=require('node:fs'),path=require('node:path'),asar=require('@electron/asar');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dist/dual-2.6.11');
(async()=>{
 const stage=path.join(out,'codex-app'),portable=path.join(out,'codex-portable');
 fs.mkdirSync(stage,{recursive:true});
 for(const name of ['desktop','runtime','assets'])fs.cpSync(path.join(root,name),path.join(stage,name),{recursive:true});
 const catalog=JSON.parse(fs.readFileSync(path.join(root,'catalog.json')));
 for(const t of catalog){
  const theme=JSON.parse(fs.readFileSync(path.join(root,t.path,'theme.json')));
  const files=new Set(['theme.json',theme.css,...Object.values(theme.assets||{}),...(theme.motion?[theme.motion.file,theme.motion.poster]:[])]);
  for(const f of files){const dst=path.join(stage,t.path,f);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(path.join(root,t.path,f),dst);}
  const preview='previews/'+t.id+'-chat.jpg';fs.mkdirSync(path.join(stage,'previews'),{recursive:true});fs.copyFileSync(path.join(root,preview),path.join(stage,preview));
 }
 for(const name of ['package.json','catalog.json','theme-inventory.json','pets/catalog.json']){
  fs.mkdirSync(path.dirname(path.join(stage,name)),{recursive:true});fs.copyFileSync(path.join(root,name),path.join(stage,name));
 }
 await require('../desktop/theme-inventory.cjs').verify(stage,'2.6.11');
 fs.cpSync(path.join(root,'dist/windows-portable'),portable,{recursive:true,filter:src=>!['theme-source.json','app.asar','default_app.asar','debug.log'].includes(path.basename(src))&&!['themes','previews','personal-themes','updates'].includes(path.basename(src))});
 await asar.createPackage(stage,path.join(portable,'resources/app.asar'));
 const count=JSON.parse(asar.extractFile(path.join(portable,'resources/app.asar'),'catalog.json')).length;
 if(count!==catalog.length)throw Error('Incomplete portable');
 fs.writeFileSync(path.join(portable,'START-HERE.txt'),'ZLHRS Theme Studio 2.6.11 — CODEX / ChatGPT desktop\r\n\r\nExtract the entire archive. Open ZLHRS Theme Studio.exe. Windows x64.\r\nAll 99 themes, including video and ASCII wallpapers, are bundled. No Node or Git needed.\r\nA compatible desktop ChatGPT/Codex app must be installed separately.\r\nFor Claude Desktop Code tab use the separate Claude-Code archive.\r\n\r\nРаспакуйте весь архив и откройте ZLHRS Theme Studio.exe.\r\nЭто пакет CODEX / ChatGPT для Windows x64. Все 99 тем включены.\r\nДля Claude скачайте отдельный архив Claude-Code.\r\n');
 console.log('Portable verified: '+count+' bundled themes. '+portable);
})().catch(e=>{console.error(e);process.exit(1)});
