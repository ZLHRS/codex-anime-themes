const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('studio',{
 language:value=>ipcRenderer.invoke('studio:language',value),
 state:()=>ipcRenderer.invoke('studio:state'),
 appearance:(id,value)=>ipcRenderer.invoke('studio:appearance',id,value),
 apply:id=>ipcRenderer.invoke('studio:apply',id),
 launch:()=>ipcRenderer.invoke('studio:launch'),
 choose:()=>ipcRenderer.invoke('studio:choose'),
 shortcut:()=>ipcRenderer.invoke('studio:shortcut'),
 reveal:()=>ipcRenderer.invoke('studio:reveal'),
 refresh:()=>ipcRenderer.invoke('studio:refresh'),
 importPets:()=>ipcRenderer.invoke('studio:import-pets'),
 update:()=>ipcRenderer.invoke('studio:update'),
 quit:()=>ipcRenderer.invoke('studio:quit'),
 subscribe:callback=>ipcRenderer.on('studio:state',(_event,state)=>callback(state))
});
