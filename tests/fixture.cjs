const {app,BrowserWindow,protocol}=require('electron');
app.commandLine.appendSwitch('remote-debugging-address','127.0.0.1');app.commandLine.appendSwitch('remote-debugging-port',process.env.ZLHRS_TEST_PORT||'9345');
app.setPath('userData',require('path').join(require('os').tmpdir(),'zlhrs-fixture-'+process.pid));
protocol.registerSchemesAsPrivileged([{scheme:'app',privileges:{standard:true,secure:true,supportFetchAPI:true}}]);
app.whenReady().then(()=>{
 protocol.handle('app',()=>new Response(`<!doctype html><html><head><meta charset="utf-8"><style>html,body{height:100%;margin:0}main{height:100%;position:relative}</style></head><body><aside class="app-shell-left-panel"></aside><main class="main-surface" data-app-shell-main-surface><div data-markdown-text-style>Fixture conversation</div><div class="composer-surface-chrome"></div></main><script>window.__STUDIO_TEST_FIXTURE__=true</script></body></html>`,{headers:{'content-type':'text/html'}}));
 for(const route of ['index.html','detached-window.html','index.html?initialRoute=%2Favatar-overlay']){const w=new BrowserWindow({show:false,webPreferences:{sandbox:true}});w.loadURL('app://-/'+route);}
});
