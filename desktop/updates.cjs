const fs=require('node:fs/promises');
const {createWriteStream}=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {Readable,Transform}=require('node:stream');
const {pipeline}=require('node:stream/promises');
const REPO='ZLHRS/codex-anime-themes';
function version(value){const match=/^v?(\d+)\.(\d+)\.(\d+)$/.exec(value||'');if(!match)throw new Error('Некорректная версия обновления.');return match.slice(1).map(Number);}
function newer(remote,current){const a=version(remote),b=version(current);for(let i=0;i<3;i++){if(a[i]!==b[i])return a[i]>b[i];}return false;}
function assetFor(release,platform,arch,appImage){
 const v=version(release.tag_name).join('.');
 const suffix=platform==='win32'?`win-${arch}.exe`:platform==='darwin'?`mac-${arch}.zip`:appImage?'linux-x86_64.AppImage':'linux-amd64.deb';
 if(platform==='linux'&&arch!=='x64')throw new Error('Для этой архитектуры Linux пока нет обновления.');
 const name=`ZLHRS-Theme-Studio-${v}-${suffix}`;
 const asset=release.assets?.find(a=>a.name===name);
 const checksum=release.assets?.find(a=>a.name==='SHA256SUMS.txt');
 if(!asset||!checksum)throw new Error('Выпуск ещё не содержит готовый файл для вашей системы. Попробуйте позже.');
 for(const a of [asset,checksum]){const u=new URL(a.browser_download_url);if(u.protocol!=='https:'||u.hostname!=='github.com'||!u.pathname.startsWith('/'+REPO+'/releases/download/'))throw new Error('Недопустимый источник обновления.');}
 return {asset,checksum,version:v};
}
async function check(current,platform,arch,appImage,request=fetch){
 const r=await request(`https://api.github.com/repos/${REPO}/releases/latest`,{headers:{Accept:'application/vnd.github+json','User-Agent':'ZLHRS-Theme-Studio'},signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw new Error(r.status===403?'GitHub временно ограничил проверки. Попробуйте позже.':'Не удалось проверить обновления. Проверьте интернет.');
 const release=await r.json();
 if(release.draft||release.prerelease||!newer(release.tag_name,current))return null;
 return assetFor(release,platform,arch,appImage);
}
function checksumFor(text,name){
 const line=text.split(/\r?\n/).find(line=>line.slice(66).replace(/^\*/,'')===name);
 if(!line||!/^([a-fA-F0-9]{64}) [ *]/.test(line))throw new Error('В выпуске нет контрольной суммы установщика.');
 return line.slice(0,64).toLowerCase();
}
async function download(info,directory,progress,request=fetch){
 const sums=await request(info.checksum.browser_download_url,{signal:AbortSignal.timeout(15000)});if(!sums.ok)throw new Error('Не удалось загрузить контрольную сумму.');
 const expected=checksumFor(await sums.text(),info.asset.name);
 await fs.mkdir(directory,{recursive:true});const file=path.join(directory,info.asset.name),temp=file+'.part';
 const response=await request(info.asset.browser_download_url,{signal:AbortSignal.timeout(600000)});if(!response.ok||!response.body)throw new Error('Не удалось скачать обновление.');
 const hash=crypto.createHash('sha256');let loaded=0,last=0;
 const measure=new Transform({transform(chunk,_encoding,done){loaded+=chunk.length;if(loaded>600*1024*1024){done(new Error('Обновление превышает допустимый размер.'));return;}hash.update(chunk);if(Date.now()-last>500){last=Date.now();progress(Math.min(99,Math.round(loaded/Math.max(info.asset.size,1)*100)));}done(null,chunk);}});
 try{await pipeline(Readable.fromWeb(response.body),measure,createWriteStream(temp));if(hash.digest('hex')!==expected)throw new Error('Файл обновления повреждён. Повторите загрузку.');await fs.rename(temp,file);progress(100);return file;}catch(error){await fs.unlink(temp).catch(()=>{});throw error;}
}
module.exports={version,newer,assetFor,check,checksumFor,download};
