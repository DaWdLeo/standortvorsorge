/*
 * Einbettung des Havarie-Assistenten per iframe, mit automatischer Höhe.
 *
 * Verwendung auf der Seite, die den Assistenten zeigen soll:
 *   <div id="havarie"></div>
 *   <script src="https://NUTZER.github.io/REPO/embed.js" data-target="#havarie"></script>
 *
 * Optionen am Script-Tag:
 *   data-target   CSS-Selektor des Containers (Standard: direkt hinter dem Script-Tag)
 *   data-theme    "light", "dark" oder leer (folgt dem Gerät)
 *   data-height   "auto" (Standard) oder eine feste Höhe in Pixel, z. B. "900"
 *   data-src      Adresse der App, falls sie nicht neben embed.js liegt
 *
 * Es werden nur Höhenangaben zwischen Seite und iframe ausgetauscht, keine Eingaben.
 */
(function () {
  'use strict';
  var script = document.currentScript;
  if (!script) return;
  var base = script.src ? script.src.replace(/[^\/]*$/, '') : '';
  var cfg = script.dataset || {};
  var src = cfg.src || (base + 'index.html');
  var url;
  try { url = new URL(src, location.href); } catch (e) { return; }
  url.searchParams.set('embed', '1');
  if (cfg.theme === 'light' || cfg.theme === 'dark') url.searchParams.set('theme', cfg.theme);
  var fixed = cfg.height && cfg.height !== 'auto' && /^\d{3,5}$/.test(cfg.height) ? parseInt(cfg.height, 10) : 0;

  var target = cfg.target ? document.querySelector(cfg.target) : null;
  var frame = document.createElement('iframe');
  frame.src = url.href;
  frame.title = 'Havarie-Assistent Gefahrstoffe';
  frame.loading = 'lazy';
  frame.setAttribute('allow', 'clipboard-write');
  frame.style.cssText = 'display:block;width:100%;border:0;min-height:520px;height:' + (fixed || 900) + 'px;background:transparent';
  if (target) target.appendChild(frame); else script.parentNode.insertBefore(frame, script.nextSibling);

  var origin = url.origin;
  function hello() {
    try { frame.contentWindow.postMessage({ source: 'havarie-host', type: 'hello', autoHeight: !fixed }, origin === 'null' ? '*' : origin); } catch (e) { /* ignorieren */ }
  }
  frame.addEventListener('load', hello);
  window.addEventListener('message', function (ev) {
    if (ev.source !== frame.contentWindow) return;
    if (origin !== 'null' && ev.origin !== origin) return;
    var m = ev.data;
    if (!m || m.source !== 'havarie') return;
    if (m.type === 'ready') hello();
    else if (m.type === 'height' && !fixed && typeof m.height === 'number' && m.height > 100 && m.height < 20000) frame.style.height = Math.ceil(m.height) + 'px';
    else if (m.type === 'scrollTop') {
      var r = frame.getBoundingClientRect();
      if (r.top < 0) window.scrollTo({ top: window.pageYOffset + r.top - 8, behavior: 'smooth' });
    }
  });
})();
