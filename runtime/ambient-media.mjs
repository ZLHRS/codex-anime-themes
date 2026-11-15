// One native decoder per visible theme; no frame timers or canvas copies.
export function createAmbientMedia(document, window, asset) {
  if (!asset) return {ensure() {}, cleanup() {}};
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let host = null, media = null, observer = null, visible = false, failed = false;
  let focused = document.hasFocus();
  const sync = () => {
    if (!media) return;
    const play = asset.enabled && visible && focused && !document.hidden && !reduced.matches && !failed;
    if (asset.kind === 'video') {
      if (play) {
        if (!media.hasAttribute('src')) media.src = asset.src;
        if (media.paused) media.play().catch(() => { /* Poster remains available. */ });
      } else media.pause();
    } else {
      // GIF decoders have no pause API: unload the animation, show its poster.
      if (play) { if (!media.hasAttribute('src')) media.src = asset.src; }
      else media.removeAttribute('src');
      media.hidden = !play;
    }
  };
  const release = () => {
    observer?.disconnect(); observer = null;
    if (media?.tagName === 'VIDEO') { media.pause(); media.removeAttribute('src'); media.load(); }
    else media?.removeAttribute('src');
    host?.remove(); host = null; media = null; visible = false;
  };
  const focus = () => { focused = true; sync(); };
  const blur = () => { focused = false; sync(); };
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('focus', focus);
  window.addEventListener('blur', blur);
  reduced.addEventListener('change', sync);
  return {
    ensure(stage) {
      if (stage && host?.parentElement === stage) return;
      release();
      if (!stage) return;
      failed = false;
      host = document.createElement('div'); host.className = 'cts-ambient-media';
      host.setAttribute('aria-hidden', 'true');
      host.style.backgroundImage = `url("${asset.poster}")`;
      media = document.createElement(asset.kind === 'video' ? 'video' : 'img');
      if (asset.kind === 'video') {
        media.muted = true; media.defaultMuted = true; media.loop = true;
        media.playsInline = true; media.preload = 'none'; media.poster = asset.poster;
        media.disablePictureInPicture = true;
      } else { media.alt = ''; media.hidden = true; }
      media.addEventListener('error', () => { failed = true; media.hidden = true; sync(); });
      host.append(media); stage.append(host);
      observer = new window.IntersectionObserver(entries => {
        visible = entries.some(entry => entry.isIntersecting); sync();
      });
      observer.observe(host);
    },
    cleanup() {
      release(); document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('focus', focus); window.removeEventListener('blur', blur);
      reduced.removeEventListener('change', sync);
    }
  };
}
