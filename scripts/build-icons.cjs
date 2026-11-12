// Run with Electron: electron scripts/build-icons.cjs <source.png>
// Encode the approved artwork for desktop launchers without redrawing it.
const {app,nativeImage}=require('electron');
const fs=require('node:fs');
const path=require('node:path');
app.whenReady().then(()=>{
 const source=nativeImage.createFromPath(path.resolve(process.argv[2]));
 if(source.isEmpty())throw Error('Cannot decode logo');
 const assets=path.resolve(__dirname,'../assets');
 fs.writeFileSync(path.join(assets,'studio-logo.png'),source.resize({width:1024,height:1024,quality:'best'}).toPNG());
 const sizes=[16,24,32,48,64,128,256];
 const images=sizes.map(size=>source.resize({width:size,height:size,quality:'best'}).toPNG());
 const header=Buffer.alloc(6+16*sizes.length);
 header.writeUInt16LE(1,2);header.writeUInt16LE(sizes.length,4);
 let offset=header.length;
 sizes.forEach((size,i)=>{
  const entry=6+i*16;
  header[entry]=header[entry+1]=size===256?0:size;
  header.writeUInt16LE(1,entry+4);header.writeUInt16LE(32,entry+6);
  header.writeUInt32LE(images[i].length,entry+8);header.writeUInt32LE(offset,entry+12);
  offset+=images[i].length;
 });
 fs.writeFileSync(path.join(assets,'studio.ico'),Buffer.concat([header,...images]));
 console.log('PNG 1024px and ICO sizes '+sizes.join(', ')+' generated.');
 app.exit(0);
}).catch(error=>{console.error(error);app.exit(1);});
