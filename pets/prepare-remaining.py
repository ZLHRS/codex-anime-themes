"""Prepare the approved remaining character jobs with the bundled pet workflow."""
import json,subprocess,sys
from pathlib import Path
script=Path('C:/Users/shayk/.codex/plugins/cache/openai-curated-remote/work-pets/0.1.6/skills/create-pet/scripts/prepare_pet_run.py')
notes={
 'roxy':'Roxy Migurdia, blue braided hair, blue eyes, recognizable brown witch hat and fully clothed white and brown mage outfit, no staff.',
 'cc':'C.C. from Code Geass, long pale green hair, golden eyes, fully clothed white high-collar outfit with tasteful gold details, no weapons.',
 'fubuki':'Fubuki from One Punch Man, dark green bob hair, green eyes, fully clothed dark green dress, pearl necklace and white coat, no detached psychic effects.',
 'hu-tao':'Hu Tao from Genshin Impact, long brown hair, red flower-shaped pupils, dark Chinese-inspired coat and shorts, black hat with red blossom attached, no ghost or weapons.',
 'kurumi':'Kurumi Tokisaki, black twin tails, red right eye and golden clock-pattern left eye, fully clothed red and black gothic frilled dress, no guns.',
 'kana':'Kana Arima, red bob hair, ruby eyes, fully clothed red and white idol dress with beret, no microphone.',
 'sora':'Sora Kasugano, long silver-white twin tails, gray eyes, fully clothed black gothic dress with silver ribbons and opaque tights. Nonsexual childlike chibi, no lingerie.',
 'shinobu':'Shinobu Kocho, dark purple-tipped hair in bun with butterfly hairpin, violet eyes, fully clothed Demon Slayer uniform and white butterfly-pattern haori, no sword.',
 'sylphie':'Sylphiette, short white hair, red eyes, pointed elf ears, fully clothed dark blue mage outfit with pale scarf, no staff.',
 'tatsumaki':'Tatsumaki from One Punch Man, curly green bob hair, green eyes, fully clothed high-collar long-sleeve black dress and opaque tights, no floating rocks or effects.',
 'noelle':'Noelle Silva from Black Clover, silver twin tails, pink eyes, fully clothed white and dark navy dress with blue armor-inspired trim, attached small blue crown, no loose water effects.',
 'zero-two':'Zero Two from Darling in the Franxx, long pink hair, turquoise eyes, small red horns and white headband, fully clothed red uniform dress and white boots, no weapons.'
}
characters=json.loads(Path('pets/characters.json').read_text(encoding='utf-8'))['characters']
for ch in characters:
 if ch['id'] not in notes:continue
 run=Path('pets/runs')/(ch['id']+'-detailed')
 if (run/'pet_request.json').exists():continue
 theme=Path('themes')/ch['themes'][0]
 data=json.loads((theme/'theme.json').read_text(encoding='utf-8'))
 ref=theme/(data['assets'].get('portrait') or data['assets'].get('wall'))
 args=[sys.executable,str(script),'--pet-id',ch['id'],'--pet-name',ch['name'],'--description','Detailed chibi companion for ZLHRS Theme Studio','--pet-notes',notes[ch['id']],'--style-preset','auto','--style-notes','Polished detailed anime game chibi, compact 2.2 heads tall, broad readable silhouette, expressive carefully drawn eyes, refined hair and costume details, crisp smooth outlines, subtle cel shading. Native transparent alpha background, no chroma key, no detached effects.','--output-dir',str(run)]
 if ch['id']!='kurumi':args+=['--reference',str(ref)]
 result=subprocess.run(args,capture_output=True,text=True)
 if result.returncode:raise RuntimeError(result.stderr)
 print(ch['id']+' prepared')
