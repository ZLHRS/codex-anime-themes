"""Display already-extracted rows at native cell size without changing artwork."""
from pathlib import Path
import sys
from PIL import Image, ImageDraw
run=Path(sys.argv[1])
states=sys.argv[2:]
out=Image.new('RGB',(1536,232*len(states)),(235,235,235))
draw=ImageDraw.Draw(out)
for row,state in enumerate(states):
    draw.text((4,row*232+3),state,fill='black')
    for col,path in enumerate(sorted((run/'qa'/'rows'/state/'frames'/state).glob('*.png'))):
        im=Image.open(path).convert('RGBA')
        out.paste(im,(col*192,row*232+24),im)
path=run/'qa'/'early-rows.png'
out.save(path)
print(path)
