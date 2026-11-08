const core=require('./core.cjs');
// One bounded recovery for a stale/exiting process. Never restart a live main
// page merely because its theme or network-backed UI is still loading.
async function awaitThemedLaunch({session,file,openWindow,restart,transport=core,sleep=ms=>new Promise(r=>setTimeout(r,ms)),attempts=60,missingLimit=16}){
 let last,focused=new Set();
 for(let round=0;round<2;round++){
  let missing=0,canRecover=false;
  for(let i=0;i<attempts;i++){
   let pages=[];try{pages=await transport.targets();}catch(error){last=error;}
   const main=pages.find(p=>p.url?.startsWith('app://-/index.html'));
   missing=main?0:missing+1;
   if(main&&openWindow&&!focused.has(main.webSocketDebuggerUrl)){
    focused.add(main.webSocketDebuggerUrl);
    // Window activation must not block theme installation or recovery.
    transport.foreground(main,file).catch(()=>{});
   }
   try{const result=await session.reconcile();if(main)return result;}catch(error){last=error;}
   canRecover=!main;
   if(missing>=missingLimit)break;
   await sleep(500);
  }
  if(round||!openWindow||!canRecover)break;
  await restart();focused.clear();
 }
 throw last||new Error('ChatGPT не подтвердил запуск с темой после повторной попытки.');
}
module.exports={awaitThemedLaunch};
