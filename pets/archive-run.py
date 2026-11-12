"""Save lossless, bounded Library archive parts of a pet creation run."""
import sys,zipfile,json,hashlib
from pathlib import Path
run=Path(sys.argv[1]); out=run/'library-archive';out.mkdir(exist_ok=True)
all_files=sorted(p for p in run.rglob('*') if p.is_file() and out not in p.parents)
# Preserve every path while storing identical revision bytes only once.
files=[]; seen={}; manifest=[]
for p in all_files:
    digest=hashlib.sha256(p.read_bytes()).hexdigest()
    if digest not in seen:
        seen[digest]=str(p.relative_to(run)); files.append(p)
    manifest.append({'path':str(p.relative_to(run)),'sha256':digest,'stored_as':seen[digest],'bytes':p.stat().st_size})
manifest_path=out/'archive-manifest.json'
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
files.append(manifest_path)
parts=[]; group=[];size=0
def write_group(group):
    target=out/f'creation-part-{len(parts)+1:02}.zip'
    with zipfile.ZipFile(target,'w',compression=zipfile.ZIP_DEFLATED) as z:
        for p in group:z.write(p,p.relative_to(run))
    parts.append(str(target.resolve()))
for p in files:
    n=p.stat().st_size
    if size+n>8_000_000 and group:write_group(group);group=[];size=0
    group.append(p);size+=n
if group:write_group(group)
(out/'parts.json').write_text(json.dumps(parts,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(parts,ensure_ascii=False))
