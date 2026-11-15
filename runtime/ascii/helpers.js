const rgb = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16) / 255);
const hex = c => '#' + c.map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
const hsl = ([r, g, b]) => {
  const hi = Math.max(r, g, b), lo = Math.min(r, g, b), l = (hi + lo) / 2, d = hi - lo;
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  const h = !d ? 0 : hi === r ? ((g - b) / d + 6) % 6 : hi === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return `${Math.round(h * 60)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%`;
};
let CELL = 22;
const GLYPHS = 'St%;:X', LOOSE = ".:',o";
const hash = (a, b, c = 0) => {
  let h = Math.imul(a, 374761393) ^ Math.imul(b, 668265263) ^ Math.imul(c, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const glyph = (set, x, y, t) => set[Math.floor(hash(x, y, Math.floor(t * 1.2 + hash(y, x) * 7)) * set.length)];

const ell = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
const drift = (cols, f, t, v, w) => { const span = cols + w * 2; return ((f * span + t * v) % span) - w; };
const near = (x, y, fg, a = .3, odds = .5) => (hash(x, y, 3) < odds ? { fg, a } : undefined);
const twinkle = (x, y, t, fg, odds) => {
  const s = hash(x, y, 9);
  if (s < odds) return { ch: s < odds / 3 ? '+' : '.', fg, a: .2 + .5 * (.5 + .5 * Math.sin(t * (1 + s * 200) + s * 1000)) };
};
const rising = (x, y, t, v, odds) => hash(x, Math.floor(y + t * v), 11) < odds;

const sketch = (w, h, parts) => {
  const g = Array.from({ length: h }, () => Array(w).fill('.'));
  for (const [r, c, s] of parts) [...s].forEach((ch, i) => { if (ch !== ' ' && g[r]?.[c + i]) g[r][c + i] = ch; });
  return g.map(r => r.join(''));
};
const shape = (w, h, at) => Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => at(x, y)).join(''));
const flip = art => art.map(r => [...r].reverse().join(''));
const frame = (frames, t, rate, phase = 0) => frames[Math.floor(t * rate + phase) % frames.length];
const shade = (c, k) => hex(mix(rgb(c), k > 0 ? [1, 1, 1] : [0, 0, 0], Math.abs(k)));
const tint = (bg, fg, alphas) => Object.fromEntries(alphas.map((a, i) => [String(i + 1), { bg, fg, a }]));
const halos = new WeakMap();
const haloOf = art => {
  if (!halos.has(art)) {
    const on = (x, y) => (art[y]?.[x] ?? '.') !== '.', out = [];
    for (let y = -1; y <= art.length; y++)
      for (let x = -1; x <= art[0].length; x++)
        if (!on(x, y) && [-1, 0, 1].some(i => [-1, 0, 1].some(j => on(x + i, y + j))) && hash(x + 50, y + 50, 5) < .45) out.push([x, y]);
    halos.set(art, out);
  }
  return halos.get(art);
};

// Each scenes/<id>.js adds SCENES['<id>'] (its fields: skills/make-theme/SKILL.md)
const SCENES = {};
