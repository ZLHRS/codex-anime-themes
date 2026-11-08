const core=require('./core.cjs');
const PROBE=`(()=>{const root=document.documentElement;const style=document.getElementById('cts-style');const state=window.__CODEX_THEME_STUDIO__;return {ready:!!document.querySelector('[data-app-shell-main-surface],main.main-surface'),theme:state?.themeId,stamp:state?.stamp,styled:root.classList.contains('codex-theme-studio')&&!!style?.textContent,disabled:!!window.__CODEX_THEME_STUDIO_DISABLED__};})()`;
class ThemeSession {
 constructor(root,transport=core){this.root=root;this.transport=transport;this.current=null;this.queue=Promise.resolve();}
 select(id,appearance){return this.enqueue(async()=>{this.current={id,...await this.transport.payload(this.root,id,appearance,this.themeRoot||this.root)};return this.current;});}
 enqueue(action){const next=this.queue.then(action,action);this.queue=next.catch(()=>{});return next;}
 async waitForApplied(attempts=30,delay=500){
  let last;
  for(let i=0;i<attempts;i++){try{return await this.reconcile();}catch(error){last=error;if(i+1<attempts)await new Promise(r=>setTimeout(r,delay));}}
  throw last;
 }
 reconcile(){return this.enqueue(async()=>{
  if(!this.current)throw new Error('Тема не выбрана.');
  const selected=this.current;const pages=await this.transport.targets();let applied=0;const errors=[];
  for(const page of pages){try{
   let state=await this.transport.evaluate(page.webSocketDebuggerUrl,PROBE);
   if(!state?.ready)continue;
   const matches=s=>s?.theme===selected.id&&s.stamp===selected.stamp&&s.styled&&!s.disabled;
   if(!matches(state)){
    await this.transport.evaluate(page.webSocketDebuggerUrl,selected.expression);
    state=await this.transport.evaluate(page.webSocketDebuggerUrl,PROBE);
   }
   if(!matches(state))throw new Error('ChatGPT не подтвердил стили выбранной темы.');
   applied++;
  }catch(error){errors.push(error.message);}}
  if(!applied)throw new Error(errors[0]||'Окно чата ещё не готово. Повторите применение после загрузки ChatGPT.');
  return {applied,pages,partial:errors.length>0};
 });}
}
module.exports={ThemeSession,PROBE};
