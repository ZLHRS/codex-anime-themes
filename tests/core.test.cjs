const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const core=require('../desktop/core.cjs');
const root=path.resolve(__dirname,'..');
test('all bundled theme payloads compile and have stable stamps',async()=>{
 const catalog=await core.readJson(path.join(root,'catalog.json'));assert.equal(catalog.length,16);
 for(const t of catalog){const p=await core.payload(root,t.id);assert.doesNotThrow(()=>new Function(p.expression));assert(!p.expression.includes('__CTS_CSS_JSON__'));assert.equal(p.stamp,(await core.payload(root,t.id)).stamp);}
});
test('reject traversal and malformed theme IDs',async()=>{
 assert.throws(()=>core.inside(root,'../secret'));assert.throws(()=>core.inside(root,'.'));
 await assert.rejects(core.payload(root,'../../settings'));await assert.rejects(core.payload(root,'foo;bar'));
});
test('only actual application pages receive themes',()=>{
 for(const url of ['app://-/index.html','app://-/detached-window.html?thread=abc'])assert(core.validTarget({type:'page',url}));
 for(const url of ['https://chatgpt.com','app://-/avatar-overlay.html','app://evil/index.html','app://-/index.html.evil','app://-/index.html?initialRoute=%2Favatar-overlay'])assert(!core.validTarget({type:'page',url}));
 assert(!core.validTarget({type:'worker',url:'app://-/index.html'}));
 assert.throws(()=>core.evaluate('ws://attacker.test:9345/','1'));
});
test('selection persists independently of the installation directory',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'zlhrs-settings-'));
 try{const file=path.join(dir,'data/settings.json');await core.saveSettings(file,{theme:'tatsumaki-jade',appPath:'/opt/My App/chatgpt'});await core.saveSettings(file,{...await core.readJson(file),theme:'furina-blue-daylight'});assert.deepEqual(await core.readJson(file),{theme:'furina-blue-daylight',appPath:'/opt/My App/chatgpt'});assert.equal(await core.exists(file+'.tmp'),false);}finally{await fs.rm(dir,{recursive:true});}
});
test('platform launches pass paths as arguments without shell interpolation',()=>{
 const file=path.resolve('ChatGPT test $name');
 for(const platform of ['win32','linux']){const s=core.launchSpec(file,platform);assert.equal(s.command,file);assert(s.args.includes('--remote-debugging-port=9345'));}
 const mac=core.launchSpec(path.resolve('ChatGPT.app'),'darwin');assert.equal(mac.command,'/usr/bin/open');assert.equal(mac.args[1],path.resolve('ChatGPT.app'));
 assert.throws(()=>core.launchSpec('relative-path','linux'));
});

test('IPv6 fallback works when IPv4 is unavailable; never connects to remote endpoints',async()=>{
 const hosts=[];
 const request=async url=>{hosts.push(url);if(url.includes('127.0.0.1'))throw Error('ECONNREFUSED');return {ok:true,json:async()=>[{type:'page',url:'app://-/index.html',webSocketDebuggerUrl:'ws://localhost:9345/devtools/page/test'}]};};
 const found=await core.targets(request);assert.equal(found.length,1);assert.equal(new URL(found[0].webSocketDebuggerUrl).hostname,'[::1]');assert(hosts.some(url=>url.includes('[::1]')));
 const hostile=async()=>({ok:true,json:async()=>[{type:'page',url:'app://-/index.html',webSocketDebuggerUrl:'ws://attacker.test:9345/devtools/page/test'}]});
 assert.equal((await core.targets(hostile)).length,0);
});
