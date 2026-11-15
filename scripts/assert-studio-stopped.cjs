const {execFileSync}=require('node:child_process');
// A running Electron process caches ASAR offsets. Replacing its archive while
// it is alive can make subsequent file reads return unrelated archive bytes.
function assertStudioStopped() {
  if(process.platform!=='win32')throw new Error('Local deployment guard currently supports Windows only.');
  const result=execFileSync('tasklist.exe',['/FI','IMAGENAME eq ZLHRS Theme Studio.exe','/FO','CSV','/NH'],{encoding:'utf8',windowsHide:true});
  if(result.toLowerCase().includes('zlhrs theme studio.exe'))throw new Error('Fully exit Theme Studio before replacing app.asar. Closing its window is not sufficient.');
}
module.exports={assertStudioStopped};
if(require.main===module)assertStudioStopped();
