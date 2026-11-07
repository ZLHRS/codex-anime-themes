const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('studio',{
 state:()=>ipcRenderer.invoke('studio:state'),
 apply:id=>ipcRenderer.invoke('studio:apply',id),
 launch:()=>ipcRenderer.invoke('studio:launch'),
 choose:()=>ipcRenderer.invoke('studio:choose'),
 shortcut:()=>ipcRenderer.invoke('studio:shortcut'),
 reveal:()=>ipcRenderer.invoke('studio:reveal'),
 update:()=>ipcRenderer.invoke('studio:update'),
 quit:()=>ipcRenderer.invoke('studio:quit'),
 subscribe:callback=>ipcRenderer.on('studio:state',(_event,state)=>callback(state))
});
