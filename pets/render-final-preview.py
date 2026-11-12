"""Render previews from the exact validated atlas; never change pet pixels."""
import sys, json, subprocess
from pathlib import Path
from PIL import Image, ImageDraw
sys.path.insert(0, str(Path('dist/pet-preview-deps').resolve()))
import imageio_ffmpeg

run = Path(sys.argv[1])
atlas = Image.open(run / 'final/spritesheet-extended.png').convert('RGBA')
out = run / 'previews/final'
out.mkdir(parents=True, exist_ok=True)
states = ['idle','running-right','running-left','waving','jumping','failed','waiting','running','review']
counts = [6,8,8,4,5,8,6,6,6]
def cell(row, col):
    return atlas.crop((col*192,row*208,(col+1)*192,(row+1)*208))
def display(sprite, label):
    panel = Image.new('RGB',(384,448),'#292633')
    panel.paste(sprite.resize((384,416),Image.Resampling.NEAREST),(0,32),sprite.resize((384,416),Image.Resampling.NEAREST))
    ImageDraw.Draw(panel).text((12,10),label,fill='white')
    return panel
all_frames=[]
for row,(state,count) in enumerate(zip(states,counts)):
    frames=[display(cell(row,c),state) for c in range(count)]
    frames[0].save(out/f'{state}.gif',save_all=True,append_images=frames[1:],duration=150,loop=0)
    all_frames.extend(frames*2)
look=[display(cell(9+i//8,i%8),f'look {i*22.5:g}') for i in range(16)]
look[0].save(out/'look.gif',save_all=True,append_images=look[1:],duration=200,loop=0)
all_frames.extend(look)
all_frames[0].save(out/'all-states.gif',save_all=True,append_images=all_frames[1:],duration=150,loop=0)
jump=[display(cell(r,c),'idle - jump - idle') for r,c in [(0,c) for c in range(6)]+[(4,c) for c in range(5)]+[(0,c) for c in range(6)]]
jump[0].save(out/'idle-jump-idle.gif',save_all=True,append_images=jump[1:],duration=150,loop=0)
for row in [0,3,4,7]: display(cell(row,2),states[row]).save(out/f'still-{states[row]}.png')
cmd=[imageio_ffmpeg.get_ffmpeg_exe(),'-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s','384x448','-r','7','-i','pipe:0','-an','-c:v','libx264','-pix_fmt','yuv420p',str(out/'all-states.mp4')]
p=subprocess.Popen(cmd,stdin=subprocess.PIPE)
for frame in all_frames:p.stdin.write(frame.tobytes())
p.stdin.close()
if p.wait():raise RuntimeError('Video encoding failed')
print(json.dumps({'preview_count':len(list(out.iterdir())),'output':str(out)}))
