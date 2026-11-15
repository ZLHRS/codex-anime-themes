const fs=require('node:fs'),path=require('node:path');
function generate(root){
 const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json')));
 const catalog=JSON.parse(fs.readFileSync(path.join(root,'catalog.json'),'utf8').replace(/^\uFEFF/,''));
 fs.writeFileSync(path.join(root,'theme-inventory.json'),JSON.stringify({version:pkg.version,ids:catalog.map(t=>t.id)},null,2)+'\n');
}
module.exports=async context=>generate(path.resolve(__dirname,'..'));
module.exports.generate=generate;
if(require.main===module)generate(path.resolve(__dirname,'..'));
