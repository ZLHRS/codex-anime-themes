// Animate the existing native sprite only while its own hover reaction is active.
// No pet selection, persisted artwork, or replacement overlay is involved.
export function installPetHover(document, window) {
  const selector = '[data-codex-pet-id]';
  const reactions = [[3, 4, 140], [6, 6, 150], [7, 6, 120], [8, 6, 150]];
  const visits = new Map();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let hovered = null, animation = null, played = false;
  const cancel = () => { animation?.cancel(); animation = null; };
  const sync = () => {
    if (!hovered?.isConnected || document.hidden || reduced.matches ||
        !['idle', 'jumping'].includes(hovered.getAttribute('data-codex-pet-state'))) {
      cancel();
      return;
    }
    if (played) return;
    // Native v1/v2 sheets have 8 columns and 9/11 rows. Unknown formats
    // retain their native reaction instead of displaying the wrong cells.
    const size = window.getComputedStyle(hovered).backgroundSize.trim().split(/\s+/);
    const rows = Number.parseFloat(size[1]) / 100;
    if (size[0] !== '800%' || ![9, 11].includes(rows)) return;
    const id = hovered.getAttribute('data-codex-pet-id');
    let seed = 0;
    for (const char of id) seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
    const visit = visits.get(id) || 0;
    const [row, count, duration] = reactions[(seed + visit) % reactions.length];
    visits.set(id, visit + 1);
    const frames = [];
    // Two repetitions, then a calm idle frame until the pointer leaves.
    for (let repeat = 0; repeat < 2; repeat++) {
      for (let column = 0; column < count; column++) {
        frames.push({ backgroundPosition: `${column / 7 * 100}% ${row / (rows - 1) * 100}%`, easing: 'steps(1, end)' });
      }
    }
    frames.push({ backgroundPosition: '0% 0%' });
    animation = hovered.animate(frames, {
      duration: duration * (frames.length - 1), fill: 'forwards'
    });
    played = true;
  };
  const enter = event => {
    const pet = event.target.closest?.(selector);
    if (!pet || pet === hovered || event.buttons) return;
    cancel(); hovered = pet; played = false;
    sync();
  };
  const leave = event => {
    if (!hovered || (event.relatedTarget && hovered.contains(event.relatedTarget))) return;
    if (event.target === hovered || hovered.contains(event.target)) {
      cancel(); hovered = null; played = false;
    }
  };
  const stop = () => { cancel(); hovered = null; played = false; };
  const observer = new window.MutationObserver(sync);
  observer.observe(document.documentElement, {subtree: true, childList: true,
    attributes: true, attributeFilter: ['data-codex-pet-state', 'data-codex-pet-id']});
  document.addEventListener('pointerover', enter);
  document.addEventListener('pointerout', leave);
  document.addEventListener('pointerdown', stop, true);
  document.addEventListener('visibilitychange', stop);
  window.addEventListener('blur', stop);
  reduced.addEventListener('change', stop);
  return () => {
    stop(); observer.disconnect();
    document.removeEventListener('pointerover', enter);
    document.removeEventListener('pointerout', leave);
    document.removeEventListener('pointerdown', stop, true);
    document.removeEventListener('visibilitychange', stop);
    window.removeEventListener('blur', stop);
    reduced.removeEventListener('change', stop);
  };
}
