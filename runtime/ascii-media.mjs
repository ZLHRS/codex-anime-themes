// Theme Studio lifecycle adapter for 0toshigami's MIT-licensed ASCII scenes.
export function createAsciiMedia(document, window, asset) {
  const root = document.documentElement;
  const performance = window.performance;
  let host = null, canvas = null, w = null, observer = null, intersection = null;
  let focused = document.hasFocus(), visible = false, disposed = false, timer = 0;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const SIDE = 0, DIM = .25;
  const column = () => {
    const r = document.querySelector('.composer-surface-chrome')?.getBoundingClientRect();
    const bounds = host?.getBoundingClientRect();
    return r?.width && bounds ? [r.left-bounds.left,r.right-bounds.left] : undefined;
  };
  /*__ASCII_SCENE_CODE__*/
  const scene = SCENES[asset.scene];
  if (!scene) return {ensure() {}, cleanup() {}};
  CELL = Math.min(asset.cell || 22, scene.size || 22);
  const running = () => !disposed && w && asset.enabled && focused && visible && !document.hidden && !reduced.matches;
  const render = () => { if (w?.width && w?.height) draw(w); };
  const tickFrame = () => {
    timer = 0;
    if (!running()) return;
    const now = performance.now();
    w.time += Math.min(now-w.last,250)/1000*w.speed;
    w.last = now;
    render();
    timer = window.setTimeout(tickFrame,33);
  };
  const sync = () => {
    window.clearTimeout(timer); timer = 0;
    if (canvas) canvas.dataset.running = String(Boolean(running()));
    if (running()) { w.last = performance.now(); timer = window.setTimeout(tickFrame,33); }
  };
  const size = () => {
    if (!w || !host) return;
    const rect = host.getBoundingClientRect();
    w.width = rect.width; w.height = rect.height;
    // Keep high-DPI text crisp without allocating an unbounded backing surface.
    const dpr = Math.min(window.devicePixelRatio || 1,2);
    canvas.width = Math.max(1,Math.round(w.width*dpr)); canvas.height = Math.max(1,Math.round(w.height*dpr));
    w.ctx.setTransform(dpr,0,0,dpr,0,0);
    w.ctx.font = `bold ${Math.round(CELL*13/22)}px Consolas, 'Cascadia Code', monospace`;
    w.ctx.textAlign = 'center'; w.ctx.textBaseline = 'middle'; w.measured = -Infinity;
    render();
  };
  const focus = () => { focused = true; sync(); };
  const blur = () => { focused = false; sync(); };
  const release = () => {
    window.clearTimeout(timer); timer = 0;
    observer?.disconnect(); intersection?.disconnect();
    observer = intersection = null; canvas?.remove(); canvas = null; host = null; w = null; visible = false;
  };
  document.addEventListener('visibilitychange',sync);
  window.addEventListener('focus',focus); window.addEventListener('blur',blur);
  reduced.addEventListener('change',sync);
  return {
    ensure(stage) {
      if (disposed || (stage && host===stage && canvas?.parentElement===stage)) return;
      release(); if (!stage) return;
      host = stage; canvas = document.createElement('canvas'); canvas.className = 'cts-ascii-wallpaper';
      canvas.setAttribute('aria-hidden','true');
      canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
      const ctx = canvas.getContext('2d'); if (!ctx) { release(); return; }
      w = {ctx,scene,time:0,last:0,measured:-Infinity,grid:asset.motion==='grid',speed:asset.speed||1,veil:asset.veil||0,bg:asset.bg};
      stage.append(canvas); size();
      observer = new window.ResizeObserver(size); observer.observe(stage);
      intersection = new window.IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);sync();});
      intersection.observe(stage);
    },
    cleanup() {
      disposed = true; release(); document.removeEventListener('visibilitychange',sync);
      window.removeEventListener('focus',focus); window.removeEventListener('blur',blur);
      reduced.removeEventListener('change',sync);
    }
  };
}
