const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const crypto=require('node:crypto');
const u=require('../desktop/updates.cjs');
function release(tag='v2.2.0'){
 const names=['win-x64.exe','win-x64-portable.zip','mac-arm64.zip','mac-x64.zip','linux-x86_64.AppImage','linux-amd64.deb'].map(s=>'ZLHRS-Theme-Studio-'+tag.slice(1)+'-'+s).concat('SHA256SUMS.txt');
 return {tag_name:tag,assets:names.map(name=>({name,size:5,browser_download_url:'https://github.com/ZLHRS/codex-anime-themes/releases/download/'+tag+'/'+name}))};
}
test('only newer stable releases trigger an update',async()=>{
 assert(u.newer('v2.10.0','2.9.9'));assert(!u.newer('v2.1.0','2.1.0'));assert(!u.newer('v2.0.0','2.1.0'));assert.throws(()=>u.newer('v2.2.0-beta','2.1.0'));
 let calls=0;const request=async()=>{calls++;return {ok:true,json:async()=>release('v2.1.0')};};
 assert.equal(await u.check('2.1.0','win32','x64',false,request),null);assert.equal(calls,1);
});
test('chooses matching platform/architecture and rejects foreign downloads',()=>{
 for(const [platform,arch,img,suffix] of [['win32','x64',false,'win-x64.exe'],['darwin','arm64',false,'mac-arm64.zip'],['darwin','x64',false,'mac-x64.zip'],['linux','x64',true,'linux-x86_64.AppImage'],['linux','x64',false,'linux-amd64.deb']])assert(u.assetFor(release(),platform,arch,img).asset.name.endsWith(suffix));
 assert.throws(()=>u.assetFor(release(),'linux','arm64',true));const bad=release();bad.assets[0].browser_download_url='https://attacker.test/fake.exe';assert.throws(()=>u.assetFor(bad,'win32','x64',false));
});
test('downloads and verifies bytes; corrupt updates never become installers',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'zlhrs-update-test-'));const info=u.assetFor(release(),'win32','x64',false);const body=Buffer.from('hello');const hash=crypto.createHash('sha256').update(body).digest('hex');
 let corrupt=false;const request=async url=>url.endsWith('SHA256SUMS.txt')?new Response(hash+'  '+info.asset.name+'\n'):new Response(corrupt?'wrong':body);
 try{let progress;const file=await u.download(info,dir,n=>progress=n,request);assert.equal((await fs.readFile(file)).toString(),'hello');assert.equal(progress,100);await fs.unlink(file);corrupt=true;await assert.rejects(u.download(info,dir,()=>{},request),/повреждён/);await assert.rejects(fs.access(file));await assert.rejects(fs.access(file+'.part'));}finally{await fs.rm(dir,{recursive:true});}
});
test('network errors return a recoverable error',async()=>{
 await assert.rejects(u.check('2.1.0','win32','x64',false,async()=>({ok:false,status:403})),/позже/);
});

test("portable Windows updates select ZIP, never installer",()=>{assert(u.assetFor(release(),"win32","x64",false,true).asset.name.endsWith("-portable.zip"));});
