// Reproducible import of MIT-licensed scene artwork; no upstream installer is run.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const upstream=path.resolve(process.argv[2]||'output/claude-desktop-themes-upstream');
const read=p=>fs.readFileSync(path.join(upstream,p),'utf8');
const dest='runtime/ascii';fs.mkdirSync(dest+'/scenes',{recursive:true});
fs.copyFileSync(path.join(upstream,'LICENSE'),dest+'/LICENSE');
const revision=require('node:child_process').execFileSync('git',['-C',upstream,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
fs.writeFileSync(dest+'/NOTICE.md',`# Live ASCII wallpapers\n\nCopyright (c) 2026 0toshigami. MIT license: see LICENSE.\n\nSource: https://github.com/0toshigami/claude-desktop-themes\nRevision: ${revision}\n\nScene files are unchanged. Drawing helpers and renderer are extracted from core.js and engine.js. Theme Studio supplies its own lifecycle, placement and settings adapter.\n`);
const core=read('extension/src/core.js');
fs.writeFileSync(dest+'/helpers.js',core.slice(core.indexOf('const rgb ='),core.indexOf('const luma ='))+core.slice(core.indexOf('let CELL =')));
const engine=read('extension/src/engine.js');
fs.writeFileSync(dest+'/draw.js',engine.slice(engine.indexOf('const keep ='),engine.indexOf('\nlet wall;')).replace('W = innerWidth, H = innerHeight','W = w.width, H = w.height'));
for(const file of fs.readdirSync(path.join(upstream,'extension/src/scenes')))fs.copyFileSync(path.join(upstream,'extension/src/scenes',file),dest+'/scenes/'+file);
let definitions=read('hooks/themes.ts');definitions=definitions.slice(definitions.indexOf('export const THEMES'),definitions.indexOf('\nexport ',definitions.indexOf('function bands')));
// Only the palette/scene declarations; functions further down are not needed.
definitions=definitions.slice(0,definitions.indexOf('\n}',definitions.indexOf('function bands'))+2);
definitions=require('node:module').stripTypeScriptTypes(definitions.replace('export const THEMES','const THEMES'));
const list=vm.runInNewContext(definitions+';THEMES.filter(t=>t.wallpaper)',{});
let catalog=JSON.parse(fs.readFileSync('catalog.json','utf8').replace(/^\uFEFF/,''));
for(const t of list){
 const id='ascii-'+t.id,dir='themes/'+id;fs.mkdirSync(dir,{recursive:true});
 const theme={schemaVersion:2,id,name:'ASCII · '+t.name,description:t.tagline,version:'1.0.0',author:'0toshigami / ZLHRS',appearance:t.id==='cloud-drift'?'light':'dark',license:'MIT',category:'landscape',tags:['ascii','animated','landscape',t.id],colors:{accent:t.accent,light:t.text},assets:{},strings:{},ascii:{scene:t.id,bg:t.bg,sky:t.vars['wall-sky']},css:'theme.css',source:'https://github.com/0toshigami/claude-desktop-themes'};
 fs.writeFileSync(dir+'/theme.json',JSON.stringify(theme,null,2)+'\n');
 const base=fs.readFileSync('themes/midnight-grid/theme.css','utf8');
 const css=base+`\n/* Original scene palette; ChatGPT surfaces adapted by ZLHRS. */
html.codex-theme-studio{--accent:${t.accent};--light:${t.text};--ink:${t.text};--night:${t.bg};--surface:${t.bg};--line:${t.vars['wall-rim']};color-scheme:${theme.appearance}}
html.codex-theme-studio .main-surface:not(.main-surface .main-surface){background:${t.vars['wall-sky']}!important}
html.codex-theme-studio .main-surface::before,html.codex-theme-studio .main-surface::after{display:none!important}
html.codex-theme-studio .main-surface > :not(#cts-stage){position:relative;z-index:1}
html.codex-theme-studio #cts-stage{position:absolute!important;inset:0;z-index:0;pointer-events:none}
html.codex-theme-studio .composer-surface-chrome{background:${t.vars['wall-glass']}!important;color:${t.text}!important;border-color:${t.vars['wall-rim']}!important}
html.codex-theme-studio .cts-halo,html.codex-theme-studio .cts-atmosphere{display:none!important}
`;
 fs.writeFileSync(dir+'/theme.css',css);
 if(!catalog.some(x=>x.id===id))catalog.push({id,name:theme.name,path:dir});
}
fs.writeFileSync('catalog.json',JSON.stringify(catalog,null,2)+'\n');
console.log('Imported '+list.length+' original scenes at '+revision);
