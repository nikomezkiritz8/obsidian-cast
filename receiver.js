/* OBSIDIAN · receptor Cast (CAF Web Receiver) — diseño B "Cine" + A sin letra.
 * La interfaz (ObsidianUI) es independiente de CAF para poder probarla en un navegador con mensajes falsos (demo.html). */
(function () {
  'use strict';
  const NS = 'urn:x-cast:com.obsidian.music';
  const $ = (id) => document.getElementById(id);
  const body = document.body;
  const NEUTRAL = { sky: [128, 146, 232], amber: [236, 164, 84], dusk: [150, 128, 196] };

  const st = { key: null, dur: 0, pos: 0, playing: false, lyrics: null, lyricsKey: null, idx: -2, tops: [], heights: [], covers: {}, lyricsByKey: {}, coverUrl: null };

  function mmss(s) { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  function initials(t) { return (t || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join(''); }

  // ── color: paleta de la portada (una vez por canción) ───────────────────────────────────────
  function rgb2hsv(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0; if (d) { h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
    return [h, mx ? d / mx : 0, mx]; }
  function hsv2rgb(h, s, v) { const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c; let r, g, b;
    [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]; }
  function vivid(c) { const [h, s, v] = rgb2hsv(c[0], c[1], c[2]); return hsv2rgb(h, Math.min(1, Math.max(.45, s * 1.5)), Math.min(1, Math.max(.62, v * 1.25))); }
  function palette(img) {
    try {
      const cv = document.createElement('canvas'); cv.width = cv.height = 24; const g = cv.getContext('2d');
      g.drawImage(img, 0, 0, 24, 24); const d = g.getImageData(0, 0, 24, 24).data;
      const bins = new Map();
      for (let i = 0; i < d.length; i += 4) {
        const [h, s, v] = rgb2hsv(d[i], d[i + 1], d[i + 2]); if (v < .12 || (s < .12 && v > .92)) continue;
        const k = Math.round(h / 30) % 12; const w = .25 + s * v; const b = bins.get(k) || { w: 0, r: 0, g: 0, b: 0 };
        b.w += w; b.r += d[i] * w; b.g += d[i + 1] * w; b.b += d[i + 2] * w; bins.set(k, b);
      }
      const top = [...bins.values()].sort((a, b) => b.w - a.w).map((b) => [b.r / b.w, b.g / b.w, b.b / b.w]);
      if (!top.length) return NEUTRAL;
      return { sky: vivid(top[0]), amber: vivid(top[1] || top[0]), dusk: vivid(top[2] || top[1] || top[0]) };
    } catch (e) { return NEUTRAL; }  // portada sin CORS: paleta neutra (no se inventa nada)
  }
  // Aurora en un lienzo de 240×135 (1/8): degradados radiales suaves, escalado por CSS. Se pinta solo al cambiar de canción.
  function paintAurora(p, nolyrics) {
    const cv = $('aurora'), g = cv.getContext('2d'); const k = 240 / 2040;
    g.clearRect(0, 0, cv.width, cv.height);
    const blobs = nolyrics
      ? [[560, 330, 420, 320, p.sky, .40], [180, 700, 300, 220, p.amber, .45], [1050, 420, 330, 300, p.dusk, .40], [1650, 250, 380, 260, p.sky, .18]]
      : [[380, 330, 380, 300, p.sky, .42], [120, 650, 260, 220, p.amber, .45], [760, 420, 300, 300, p.dusk, .38], [1500, 560, 520, 380, p.sky, .14]];
    for (const [x, y, rx, ry, c, a] of blobs) {
      const cx = (x + 60) * k, cy = (y + 40) * k;
      g.save(); g.translate(cx, cy); g.scale(1, ry / rx);
      const r = rx * 1.6 * k, gr = g.createRadialGradient(0, 0, 0, 0, 0, r);
      for (const [t, f] of [[0, 1], [.25, .82], [.5, .45], [.75, .14], [1, 0]]) gr.addColorStop(t, `rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a * f})`);
      g.fillStyle = gr; g.fillRect(-r, -r, 2 * r, 2 * r); g.restore();
    }
  }
  function paintGlow(img) {
    const cv = $('glow'), g = cv.getContext('2d'); g.clearRect(0, 0, 64, 64);
    if (!img) return;
    try { g.filter = 'saturate(2) brightness(1.45) blur(5px)'; } catch (e) {}
    g.drawImage(img, 8, 8, 48, 48); g.filter = 'none';
  }

  // ── pista ──────────────────────────────────────────────────────────────────────────────
  function setTrack(t) {
    // t: {key,title,artist,album,explicit,cover,label:{kind,detail},duration}
    const changed = t.key !== st.key;
    st.key = t.key; st.dur = t.duration || st.dur;
    body.classList.remove('idle');
    $('title').textContent = t.title || '';
    $('artist').textContent = t.artist || '';
    $('album').setAttribute('data-t', (t.album || t.title || '').toUpperCase());
    body.classList.toggle('explicit', !!t.explicit);
    const pill = $('pill'), lab = t.label;
    pill.className = !lab || !lab.kind ? 'none' : lab.kind === 'HI-RES' ? '' : 'cd';
    $('pillKind').textContent = lab ? lab.kind : ''; $('pillDetail').textContent = lab ? lab.detail : '';
    $('pill').querySelector('.sep').style.display = lab && lab.detail ? '' : 'none';
    $('initials').textContent = initials(t.title);
    if (changed) {
      setLyrics(st.lyricsByKey[t.key] || null);
      loadCover(pickCover(t));
    }
  }
  function pickCover(t) {
    const inline = st.covers[t.key];
    if (inline) return inline;
    const u = t.cover;
    if (!u) return null;
    if (location.protocol === 'https:' && u.startsWith('http:')) return null;  // contenido mixto: se espera la portada en línea del móvil
    return u;
  }
  function loadCover(url) {
    st.coverUrl = url;
    const ci = $('coverImg'), ri = $('reflImg');
    ci.classList.remove('ok'); ri.classList.remove('ok');
    if (!url) { body.classList.add('noimg'); paintGlow(null); paintAurora(NEUTRAL, body.classList.contains('nolyrics')); return; }
    const attempt = (cors) => {
      const img = new Image(); if (cors) img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (st.coverUrl !== url) return;
        body.classList.remove('noimg'); ci.src = url; ri.src = url; ci.classList.add('ok'); ri.classList.add('ok');
        st.pal = cors ? palette(img) : NEUTRAL; paintAurora(st.pal, body.classList.contains('nolyrics')); paintGlow(img);
      };
      img.onerror = () => {
        if (st.coverUrl !== url) return;
        if (cors) return attempt(false);  // servidor sin CORS: la portada se muestra igual, con paleta neutra
        body.classList.add('noimg'); paintGlow(null); paintAurora(NEUTRAL, body.classList.contains('nolyrics'));
      };
      img.src = url;
    };
    attempt(!url.startsWith('data:'));
  }
  function setInlineCover(key, data) { st.covers[key] = data; if (key === st.key && st.coverUrl !== data) loadCover(data); }

  // ── letra ──────────────────────────────────────────────────────────────────────────────
  function setLyrics(lines) {
    // lines: [[ms, text], ...] sincronizada; null/[] → diseño A
    const has = Array.isArray(lines) && lines.length > 1;
    const wasNo = body.classList.contains('nolyrics');
    body.classList.toggle('nolyrics', !has);
    if (wasNo === has && st.pal) paintAurora(st.pal, !has);
    const box = $('lines'); box.innerHTML = ''; st.lyrics = has ? lines : null; st.idx = -2; st.tops = []; st.heights = [];
    if (!has) return;
    const frag = document.createDocumentFragment();
    lines.forEach(([, txt]) => { const d = document.createElement('div'); d.className = 'line'; d.textContent = txt || '♪'; frag.appendChild(d); });
    box.appendChild(frag);
    let y = 0; const gap = 34;
    for (const el of box.children) { const h = el.offsetHeight; st.tops.push(y); st.heights.push(h); el.style.top = y + 'px'; y += h * .8 + gap; }  // escala .8 en reposo
    syncLyrics(true);
  }
  function lyricIndex(ms) { const L = st.lyrics; if (!L) return -1; let lo = 0, hi = L.length - 1, r = -1;
    while (lo <= hi) { const m = (lo + hi) >> 1; if (L[m][0] <= ms) { r = m; lo = m + 1; } else hi = m - 1; } return r; }
  function syncLyrics(force) {
    if (!st.lyrics) return;
    const i = Math.max(0, lyricIndex(st.pos * 1000 + 150));
    if (i === st.idx && !force) return;
    st.idx = i;
    const els = $('lines').children;
    for (let k = 0; k < els.length; k++) {
      const rel = k - i; const el = els[k];
      el.className = 'line' + (rel === 0 ? ' cur' : rel < -2 || rel > 5 ? ' far' : rel < 0 ? ' past' : '');
    }
    const center = 520; const cy = st.tops[i] + st.heights[i] / 2;
    $('lines').style.transform = `translate3d(0, ${Math.round(center - cy)}px, 0)`;
  }

  // ── estado de reproducción ─────────────────────────────────────────────────────────────
  let lastSec = -1;
  function setPlayback(pos, dur, playing) {
    st.pos = pos; if (dur > 0) st.dur = dur;
    body.classList.toggle('paused', !playing);
    st.playing = playing;
    const f = st.dur > 0 ? Math.min(1, pos / st.dur) : 0;
    $('bar').style.transform = `scaleX(${f.toFixed(4)})`;
    const s = Math.floor(pos);
    if (s !== lastSec) { lastSec = s; $('tPos').textContent = mmss(pos); $('tLeft').textContent = '-' + mmss(st.dur - pos); }
    syncLyrics(false);
  }
  function setSender(name) { $('chipText').textContent = 'Transmitiendo desde ' + (name || 'OBSIDIAN'); body.classList.toggle('nochip', !name); }
  function setIdle() { body.classList.add('idle'); st.key = null; }

  function onMessage(m) {
    if (!m || typeof m !== 'object') return;
    if (m.type === 'hello') setSender(m.device);
    else if (m.type === 'lyrics') { const L = (m.synced || []).filter((x) => Array.isArray(x)); st.lyricsByKey[m.key] = L; if (m.key === st.key) setLyrics(L); }
    else if (m.type === 'cover') setInlineCover(m.key, m.data);
  }

  window.ObsidianUI = { setTrack, setPlayback, setLyrics, setSender, setIdle, onMessage, NS };

  // ── CAF (solo en un dispositivo Cast real) ─────────────────────────────────────────────
  if (!(window.cast && cast.framework && cast.framework.CastReceiverContext)) return;
  const ctx = cast.framework.CastReceiverContext.getInstance();
  const pm = ctx.getPlayerManager();
  pm.setMediaElement($('media'));
  const opts = new cast.framework.CastReceiverOptions();
  opts.customNamespaces = { [NS]: cast.framework.system.MessageType.JSON };
  opts.skipPlayersLoad = true;           // solo audio progresivo: no hace falta cargar Shaka/HLS
  opts.maxInactivity = 3600;
  ctx.addCustomMessageListener(NS, (ev) => onMessage(ev.data));
  ctx.addEventListener(cast.framework.system.EventType.SENDER_CONNECTED, () => {});

  function fromMedia(mi) {
    if (!mi) return null;
    const md = mi.metadata || {}; const cd = mi.customData || {};
    return { key: cd.key || mi.contentId, title: md.title, artist: md.artist || md.albumArtist, album: md.albumName, explicit: !!cd.explicit,
      cover: cd.cover || (md.images && md.images[0] && md.images[0].url) || null, label: cd.label || null, duration: mi.duration || 0 };
  }
  pm.addEventListener(cast.framework.events.EventType.PLAYER_LOAD_COMPLETE, () => {
    const t = fromMedia(pm.getMediaInformation()); if (!t) return;
    setTrack(t);
    if (!st.lyricsByKey[t.key]) ctx.sendCustomMessage(NS, undefined, { type: 'need', key: t.key });
  });
  pm.addEventListener(cast.framework.events.EventType.MEDIA_FINISHED, () => {});
  // 4 veces por segundo: progreso (transform) y línea de la letra; nada se repinta si no cambia
  setInterval(() => {
    const s = pm.getPlayerState();
    if (s === cast.framework.messages.PlayerState.IDLE && !pm.getMediaInformation()) { if (st.key) setIdle(); return; }
    const mi = pm.getMediaInformation(); if (mi) { const t = fromMedia(mi); if (t && t.key !== st.key) setTrack(t); }
    setPlayback(pm.getCurrentTimeSec() || 0, pm.getDurationSec() || 0, s === cast.framework.messages.PlayerState.PLAYING || s === cast.framework.messages.PlayerState.BUFFERING);
  }, 250);
  ctx.start(opts);
})();
