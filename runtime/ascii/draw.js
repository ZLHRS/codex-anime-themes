const keep = (col, px) => {
  if (!col) return 1;
  const inside = Math.min(px - col[0], col[1] - px);
  return 1 - (1 - DIM) * Math.max(0, Math.min(1, (inside + CELL) / (3 * CELL)));
};

const put = (w, px, py, c, sx, sy) => {
  const { ctx } = w;
  ctx.globalAlpha = Math.max(0, Math.min(1, c.a)) * Math.max(c.floor ?? 0, keep(w.veil ? undefined : w.col, px + CELL / 2));
  if (ctx.globalAlpha < .01) return;
  if (c.bg) {
    ctx.fillStyle = c.bg;
    ctx.beginPath();
    ctx.roundRect(px + 2, py + 2, CELL - 4, CELL - 4, 3);
    ctx.fill();
  }
  ctx.fillStyle = c.fg;
  ctx.fillText(c.ch ?? glyph(c.bg ? GLYPHS : LOOSE, sx, sy, w.time), px + CELL / 2, py + CELL / 2 + 1);
};

const draw = w => {
  const { ctx, scene, time: t } = w, W = w.width, H = w.height, cols = Math.ceil(W / CELL), rows = Math.ceil(H / CELL);
  const now = performance.now();
  if (!(now - w.measured < 1000)) { w.col = column(); w.measured = now; }
  ctx.clearRect(0, 0, W, H);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(160, 180, 255, .05)';
  ctx.beginPath();
  for (let x = 0; x <= cols; x++) { ctx.moveTo(x * CELL + .5, 0); ctx.lineTo(x * CELL + .5, H); }
  for (let y = 0; y <= rows; y++) { ctx.moveTo(0, y * CELL + .5); ctx.lineTo(W, y * CELL + .5); }
  ctx.stroke();
  if (scene.cell)
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const c = scene.cell(x, y, cols, rows, t);
        if (c) put(w, x * CELL, y * CELL, c, x, y);
      }
  for (const s of scene.sprites?.(cols, rows, t) ?? []) {
    const ox = (w.grid ? Math.round(s.x) : s.x) * CELL, oy = (w.grid ? Math.round(s.y) : s.y) * CELL;
    const m = s.a ?? 1, k = s.key * 997;
    const bw = s.art ? s.art[0].length : s.w, bh = s.art ? s.art.length : s.h;
    if (ox > W + CELL * 4 || oy > H + CELL * 4 || ox + (bw + 4) * CELL < 0 || oy + (bh + 4) * CELL < 0) continue;
    if (s.glow) {
      const g = s.glow, cx = ox + bw / 2 * CELL, cy = oy + bh / 2 * CELL, r = g.r * CELL;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, g.color);
      grad.addColorStop(1, `${g.color}00`);
      ctx.globalAlpha = Math.min(1, g.a * keep(w.veil ? undefined : w.col, cx));
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = grad;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      ctx.globalCompositeOperation = 'source-over';
    }
    const cells = [];
    if (s.art) s.art.forEach((row, gy) => { for (let gx = 0; gx < row.length; gx++) if (s.pal[row[gx]]) cells.push([gx, gy, s.pal[row[gx]], gx + k, gy]); });
    else
      for (let gy = 0; gy < s.h; gy++)
        for (let gx = 0; gx < s.w; gx++) {
          const f = s.field(gx, gy);
          if (f) cells.push([gx, gy, f.c, (f.sx ?? gx) + k, f.sy ?? gy]);
        }
    if (s.shadow)
      for (const [gx, gy, c] of cells)
        if (c.bg) put(w, ox + (gx + .8) * CELL, oy + (gy + .8) * CELL, { bg: s.shadow, fg: s.shadow, ch: '', a: .4 * m }, 0, 0);
    if (s.halo && s.art)
      for (const [gx, gy] of haloOf(s.art))
        put(w, ox + gx * CELL, oy + gy * CELL, { fg: s.halo, a: .3 * m }, gx + k, gy);
    for (const [gx, gy, c, sx, sy] of cells) put(w, ox + gx * CELL, oy + gy * CELL, m === 1 ? c : { ...c, a: c.a * m }, sx, sy);
  }
  if (w.col && w.veil) {
    const [l, r] = [w.col[0] - CELL * 2, w.col[1] + CELL * 2], g = ctx.createLinearGradient(l, 0, r, 0), f = CELL / (r - l);
    g.addColorStop(0, `${w.bg}00`);
    g.addColorStop(f, w.bg);
    g.addColorStop(1 - f, w.bg);
    g.addColorStop(1, `${w.bg}00`);
    ctx.globalAlpha = w.veil;
    ctx.fillStyle = g;
    ctx.fillRect(l, 0, r - l, H);
  }
};
