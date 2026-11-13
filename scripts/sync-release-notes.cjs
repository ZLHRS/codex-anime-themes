// Synchronize prose only. Never change tags, binaries, visibility, or release dates.
const fs=require('node:fs');
const repo=process.env.GH_REPO;
if(!repo||!process.env.GH_TOKEN)throw Error('GitHub repository and token are required');
const base='https://api.github.com/repos/'+repo;
async function request(endpoint,body){const response=await fetch(base+endpoint,{method:body?'PATCH':'GET',headers:{Authorization:'Bearer '+process.env.GH_TOKEN,Accept:'application/vnd.github+json','Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28'},...(body?{body:JSON.stringify(body)}:{})});if(!response.ok)throw Error('GitHub request failed: '+response.status);return response.json();}
(async()=>{
 const releases=[];for(let page=1;;page++){const rows=await request('/releases?per_page=100&page='+page);releases.push(...rows);if(rows.length<100)break;}
 for(const release of releases){
  if(!/^v\d+\.\d+\.\d+$/.test(release.tag_name))continue;
  const file='docs/RELEASE-'+release.tag_name.slice(1)+'.md';
  if(!fs.existsSync(file))continue;
  const body=fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'');
  if(/[А-Яа-яЁё]/.test(body))throw Error('Untranslated release notes: '+file);
  if(body.trim()===(release.body||'').trim())continue;
  const updated=await request('/releases/'+release.id,{body});
  if(updated.body!==body)throw Error('Release description verification failed: '+release.tag_name);
  console.log('Updated '+release.tag_name);
 }
})().catch(error=>{console.error(error.message);process.exitCode=1;});
