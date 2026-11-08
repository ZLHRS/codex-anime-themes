const test=require('node:test'),assert=require('node:assert/strict');
const {awaitThemedLaunch}=require('../desktop/launch-recovery.cjs');
const main={url:'app://-/index.html',webSocketDebuggerUrl:'fake'};
function setup(){let live=false,restarts=0,focuses=0;return {get restarts(){return restarts},get focuses(){return focuses},set live(v){live=v},opts:{file:'selected-app',openWindow:true,attempts:4,missingLimit:2,sleep:async()=>{},transport:{targets:async()=>live?[main]:[],foreground:async()=>{focuses++}},session:{reconcile:async()=>{if(!live)throw Error('not ready');return {applied:1}}},restart:async()=>{restarts++;live=true}}};}
test('stale process is recovered once and selected theme is confirmed',async()=>{const f=setup();assert.equal((await awaitThemedLaunch(f.opts)).applied,1);assert.equal(f.restarts,1);assert.equal(f.focuses,1);});
test('healthy launch is never restarted',async()=>{const f=setup();f.live=true;await awaitThemedLaunch(f.opts);assert.equal(f.restarts,0);});
test('activation failure does not prevent theme application',async()=>{const f=setup();f.live=true;f.opts.transport.foreground=async()=>{throw Error('activation failed')};await awaitThemedLaunch(f.opts);assert.equal(f.restarts,0);});
test('failed relaunch is bounded',async()=>{const f=setup();let count=0;f.opts.restart=async()=>{count++};await assert.rejects(awaitThemedLaunch(f.opts));assert.equal(count,1);});
test('slow live main page is not killed',async()=>{const f=setup();f.live=true;f.opts.session.reconcile=async()=>{throw Error('loading')};await assert.rejects(awaitThemedLaunch(f.opts));assert.equal(f.restarts,0);});
test('ordinary theme edits never restart the app',async()=>{const f=setup();f.opts.openWindow=false;await assert.rejects(awaitThemedLaunch(f.opts));assert.equal(f.restarts,0);});
