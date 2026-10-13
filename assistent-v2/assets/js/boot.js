// Startet die App. Fehler werden sichtbar gemacht statt still zu bleiben.
(function () {
  'use strict';
  function show(msg) {
    var s = document.getElementById('stage');
    if (!s) return;
    var box = document.createElement('div'); box.className = 'noscript';
    var h = document.createElement('h2'); h.textContent = 'Die Seite konnte nicht gestartet werden';
    var p = document.createElement('p'); p.textContent = msg;
    box.appendChild(h); box.appendChild(p); s.textContent = ''; s.appendChild(box);
  }
  try { window.HavarieApp.start(); } catch (e) { show((e && e.message) || String(e)); if (window.console) console.error(e); }
  window.addEventListener('error', function (ev) { if (window.console) console.error(ev.error || ev.message); });
})();
