const {app,BrowserWindow}=require('electron');
app.setPath('userData',require('path').join(require('os').tmpdir(),'zlhrs-background-'+process.pid));
app.whenReady().then(()=>{const w=new BrowserWindow({show:false});w.on('close',e=>e.preventDefault());w.loadURL('about:blank');console.log('BACKGROUND_READY');});
