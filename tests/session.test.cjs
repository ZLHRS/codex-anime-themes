const test=require('node:test');const assert=require('node:assert/strict');const {ThemeSession}=require('../desktop/theme-session.cjs');
function fixture(){let state={ready:true};let injections=0;const transport={payload:async(_root,id)=>({stamp:id,expression:id}),targets:async()=>[{webSocketDebuggerUrl:'fake'}],evaluate:async(_url,expression)=>{if(expression.startsWith('(()=>'))return {...state};injections++;state={ready:true,theme:expression,stamp:expression,styled:true,disabled:false};return {installed:true};}};return {transport,get state(){return state},set state(value){state=value},get injections(){return injections}};}
test('apply, switch, same theme, missing CSS and reloaded window',async()=>{
 const f=fixture(),s=new ThemeSession('.',f.transport);await s.select('a');await s.reconcile();assert.equal(f.state.theme,'a');await s.reconcile();assert.equal(f.injections,1);
 await s.select('b');await s.reconcile();assert.equal(f.state.theme,'b');f.state.styled=false;await s.reconcile();assert.equal(f.injections,3);f.state={ready:true};await s.reconcile();assert.equal(f.state.theme,'b');
});
test('empty/not-ready window must never report successful application',async()=>{
 const f=fixture(),s=new ThemeSession('.',f.transport);await s.select('a');f.state={ready:false};await assert.rejects(s.reconcile(),/готово/);assert.equal(f.injections,0);f.transport.targets=async()=>[];await assert.rejects(s.reconcile());
});
test('waits for actual shell readiness and verifies after injection',async()=>{
 const f=fixture(),s=new ThemeSession('.',f.transport);await s.select('a');f.state={ready:false};setTimeout(()=>{f.state={ready:true}},5);await s.waitForApplied(20,2);assert.equal(f.state.theme,'a');
 const bad={...f.transport,evaluate:async()=>({ready:true,installed:true})};const broken=new ThemeSession('.',bad);await broken.select('a');await assert.rejects(broken.reconcile(),/не подтвердил/);
});
test('polling and theme selection are serialized',async()=>{
 const f=fixture(),s=new ThemeSession('.',f.transport);await s.select('a');await Promise.all([s.reconcile(),s.select('b'),s.reconcile()]);assert.equal(f.state.theme,'b');
});

test('prepares theme before shell exists without claiming readiness',async()=>{
 const f=fixture(),s=new ThemeSession('.',f.transport);await s.select('a');f.state={ready:false,documentReady:true};
 f.transport.evaluate=async(_url,expression)=>{if(expression.startsWith('(()=>'))return {...f.state};f.state={...f.state,theme:'a',stamp:'a',styled:true};};
 await assert.rejects(s.reconcile(),/готово/);assert.equal(f.state.styled,true);f.state.ready=true;assert.equal((await s.reconcile()).applied,1);
});
