// Run with Electron. Produces data-only custom themes for themes-for-claude.
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const dest=path.resolve(process.argv[2]||path.join(root,'dist/claude-code-2.6.11'));
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const mix=(a,b,k)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-k)+parseInt(b.slice(i,i+2),16)*k).toString(16).padStart(2,'0')).join('');
app.whenReady().then(async()=>{
 fs.mkdirSync(path.join(dest,'themes'),{recursive:true});
 const w=new BrowserWindow({show:false,webPreferences:{backgroundThrottling:false}});
 await w.loadURL('about:blank');
 const images=async(file,budget)=>{
  const ext=path.extname(file).slice(1),mime=ext==='svg'?'svg+xml':ext==='jpg'?'jpeg':ext;
  const source='data:image/'+mime+';base64,'+fs.readFileSync(file).toString('base64');
  return w.webContents.executeJavaScript(`(async()=>{const im=new Image();im.src=${JSON.stringify(source)};await im.decode();const c=document.createElement('canvas');let scale=Math.min(1,1600/Math.max(im.width,im.height));for(let step=0;step<16;step++){c.width=Math.max(1,Math.round(im.width*scale));c.height=Math.max(1,Math.round(im.height*scale));c.getContext('2d').drawImage(im,0,0,c.width,c.height);const s=c.toDataURL('image/webp',.85);if(s.length<${budget})return s;scale*=.85;}throw Error('Image exceeds CSS budget');})()`);
 };
 const inventory=[];
 for(const item of JSON.parse(read('catalog.json').replace(/^\uFEFF/,''))){
  const t=JSON.parse(read(item.path+'/theme.json')),id='zlhrs-'+t.id;
  t.colors.accent ||= t.colors.silver || t.colors.rose;
  if(id.length>40)throw Error('Theme ID too long: '+id);
  const light=t.appearance==='light',bg=t.ascii?.bg||mix(light?'#f6f3f0':'#0c1018',t.colors.accent,.12);
  const theme={id,name:t.name.slice(0,60),tagline:('ZLHRS · '+t.description).slice(0,200),bg,text:t.ascii?t.colors.light:light?'#262333':'#f3f1f5',accent:t.colors.accent,vars:{'cds-radius':'10px','cds-radius-composer':'18px'}};
  let css='';
  if(t.ascii){
   theme.wallpaper=id;
   Object.assign(theme.vars,{'wall-sky':t.ascii.sky,'wall-halo':bg,'wall-rim':t.colors.accent+'55','wall-glass':bg+'e6','wall-greet':'""'});
   const scene=read('runtime/ascii/scenes/'+t.ascii.scene+'.js');
   fs.writeFileSync(path.join(dest,'themes',id+'.js'),'// Standalone user scenes do not receive the built-in sidebar offset.\nconst SIDE = 0;\n'+scene+`\nSCENES[${JSON.stringify(id)}] = SCENES[${JSON.stringify(t.ascii.scene)}];\n`);
  }else{
   const a=t.assets||{},layers=[];
   const background=a.background||a.landscape||a.backdrop||a.wall||a.artwork;
   const choices=[...(a.left?[[a.left,'left bottom','auto 90%']]:[]),...(a.portrait?[[a.portrait,'right bottom','auto 94%']]:[]),...(background?[[background,'center','cover']]:[])];
   for(const [file,pos,size] of choices){
    const uri=await images(path.join(root,item.path,file),Math.floor(178000/choices.length));
    layers.push(`url("${uri}") ${pos} / ${size} no-repeat`);
   }
   css=`html{background:${bg}!important}body{background:transparent!important}\n`;
   if(layers.length)css+=`html::before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background:${layers.join(',')};opacity:${light?'.24':'.36'}}\n*{--cds-page-bg:transparent!important;--epitaxy-transcript-surface:transparent!important}.root>.grid.bg-surface-1,main.dframe-content,.tiles-shell{background:transparent!important}\n`;
   css+=`[data-cds=ChatComposer]>.bg-surface-3{background:${bg}ed!important;border:1px solid ${t.colors.accent}66!important;backdrop-filter:blur(12px)}\n.dframe-sidebar,.dframe-sidebar-body{background:${bg}f5!important}\n::selection{background:${t.colors.accent};color:${bg}}`;
  }
  if(css.length>185000)throw Error('CSS exceeds upstream limit: '+id);
  fs.writeFileSync(path.join(dest,'themes',id+'.json'),JSON.stringify(theme,null,2)+'\n');
  fs.writeFileSync(path.join(dest,'themes',id+'.css'),css);
  inventory.push({id,sourceId:t.id,name:t.name,mode:t.ascii?'animated-ascii':t.motion?'static-video-poster':'static',license:t.license});
 }
 fs.writeFileSync(path.join(dest,'inventory.json'),JSON.stringify({version:'2.6.11',target:'Claude Desktop / Code tab',themes:inventory},null,2)+'\n');
 fs.copyFileSync(path.join(root,'runtime/ascii/LICENSE'),path.join(dest,'ASCII-LICENSE.txt'));
 fs.copyFileSync(path.join(root,'runtime/ascii/NOTICE.md'),path.join(dest,'ASCII-NOTICE.md'));
 fs.copyFileSync(path.join(root,'docs/CLAUDE-CODE.md'),path.join(dest,'START-HERE.md'));
 fs.copyFileSync(path.join(root,'scripts/Install-Claude-Themes.ps1'),path.join(dest,'Install-Claude-Themes.ps1'));
 console.log('Exported '+inventory.length+' Claude themes to '+dest);app.exit(0);
}).catch(e=>{console.error(e);app.exit(1)});
