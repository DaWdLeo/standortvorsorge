/*
 * Gefahrenzeichen, Piktogramme und Szenenbilder als SVG (selbst gezeichnet, vereinfacht, keine externen Dateien).
 * Die GHS-Piktogramme sind vereinfachte Darstellungen. Verbindlich ist die Kennzeichnung auf Gebinde und im
 * Sicherheitsdatenblatt (SDB).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HavarieIcons = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const INK = '#1E2227';
  const esc = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const svg = (vb, inner, attrs) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" ${attrs || ''}>${inner}</svg>`;
  const labelled = (title, vb, inner, extra) => svg(vb, `<title>${esc(title)}</title>${inner}`, `role="img" ${extra || ''}`);
  const deco = (vb, inner, extra) => svg(vb, inner, `aria-hidden="true" focusable="false" ${extra || ''}`);

  // ---------- GHS-Piktogramme (Raute, rote Umrandung) ----------
  const FLAME = 'M50 22C54 32 64 38 62 52C61 61 56 68 50 68C43 68 37 62 38 53C39 47 43 44 45 37C47 41 48 43 50 45C52 38 50 30 50 22Z';
  const GHS = {
    GHS01: { name: 'Explosiv', sym:
      `<circle cx="44" cy="62" r="13" fill="${INK}"/><path d="M53 53L60 45" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
       <g stroke="${INK}" stroke-width="3" stroke-linecap="round"><path d="M64 40V30M64 40L72 34M64 40L74 42M64 40L58 32M64 40L72 47"/></g><circle cx="64" cy="40" r="3.2" fill="${INK}"/>` },
    GHS02: { name: 'Entzündbar', sym: `<path d="${FLAME}" fill="${INK}"/>` },
    GHS03: { name: 'Brandfördernd', sym:
      `<circle cx="50" cy="65" r="9" fill="none" stroke="${INK}" stroke-width="5"/><path d="${FLAME}" fill="${INK}" transform="translate(17 -2) scale(.66)"/>` },
    GHS04: { name: 'Gas unter Druck', sym:
      `<rect x="39" y="40" width="22" height="34" rx="10" fill="${INK}"/><rect x="45" y="31" width="10" height="11" fill="${INK}"/><rect x="41" y="27" width="18" height="6" rx="2" fill="${INK}"/>` },
    GHS05: { name: 'Ätzend', sym:
      `<path d="M29 35l11-8 6 8-11 8z" fill="${INK}"/><path d="M50 31l11-8 6 8-11 8z" fill="${INK}"/>
       <path d="M35 49q3 6 0 9q-3-3 0-9zM56 45q3 6 0 9q-3-3 0-9z" fill="${INK}"/>
       <rect x="27" y="63" width="46" height="9" fill="${INK}"/><path d="M42 63l7 7 7-7z" fill="#fff"/>` },
    GHS06: { name: 'Giftig', sym:
      `<g stroke="${INK}" stroke-width="5" stroke-linecap="round"><path d="M35 56L65 70M65 56L35 70"/></g>
       <circle cx="50" cy="42" r="12" fill="${INK}"/><rect x="43" y="49" width="14" height="9" rx="2" fill="${INK}"/>
       <circle cx="45" cy="42" r="3.6" fill="#fff"/><circle cx="55" cy="42" r="3.6" fill="#fff"/><path d="M50 46l-2.2 4.2h4.4z" fill="#fff"/>` },
    GHS07: { name: 'Gesundheitsschädlich oder reizend', sym:
      `<rect x="45.5" y="27" width="9" height="28" rx="3.5" fill="${INK}"/><circle cx="50" cy="66" r="5.4" fill="${INK}"/>` },
    GHS08: { name: 'Gesundheitsgefahr', sym:
      `<circle cx="50" cy="32" r="7.5" fill="${INK}"/><path d="M31 66C31 51 40 44 50 44S69 51 69 66Z" fill="${INK}"/>
       <path d="M50 49l2.2 4.6 5 .6-3.7 3.4 1 5-4.5-2.5-4.5 2.5 1-5-3.7-3.4 5-.6z" fill="#fff"/>` },
    GHS09: { name: 'Umweltgefährlich', sym:
      `<g stroke="${INK}" stroke-width="3" stroke-linecap="round" fill="none"><path d="M33 66V47M33 56l-6-6M33 52l6-6M33 61l-5-3"/></g>
       <ellipse cx="59" cy="55" rx="9" ry="5" fill="${INK}"/><path d="M67 55l7-5v10z" fill="${INK}"/><circle cx="55" cy="54" r="1.4" fill="#fff"/>
       <path d="M30 70q5-3 10 0t10 0t10 0t10 0" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>` },
  };
  function ghs(code, opts) {
    const g = GHS[code]; if (!g) return '';
    const o = opts || {};
    const dash = o.hint ? ' stroke-dasharray="7 5"' : '';
    return labelled(`${code}: ${g.name}`, '0 0 100 100',
      `<polygon points="50,5 95,50 50,95 5,50" fill="#fff" stroke="#C8281E" stroke-width="9"${dash} stroke-linejoin="miter"/>${g.sym}`,
      o.cls ? `class="${o.cls}"` : '');
  }
  const GHS_LIST = Object.keys(GHS).map(code => ({ code, name: GHS[code].name }));

  // ---------- Warn-/Gebots-/Verbotszeichen ----------
  function warnSign(kind, title) {
    const sym = {
      drop: `<path d="M50 36C58 47 64 54 64 62C64 70 58 75 50 75C42 75 36 70 36 62C36 54 42 47 50 36Z" fill="${INK}"/><path d="M42 64q0 6 7 8" stroke="#FFC500" stroke-width="3" fill="none" stroke-linecap="round"/>`,
      bang: `<rect x="46" y="38" width="8" height="21" rx="3" fill="${INK}"/><circle cx="50" cy="68" r="4.6" fill="${INK}"/>`,
    }[kind] || '';
    return labelled(title || 'Warnung', '0 0 100 100',
      `<path d="M50 8L95 88H5Z" fill="#FFC500" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>${sym}`);
  }
  function stopSign(label) {
    return labelled(label || 'Stopp', '0 0 100 100',
      `<polygon points="31,5 69,5 95,31 95,69 69,95 31,95 5,69 5,31" fill="#C8281E" stroke="#fff" stroke-width="3"/>
       <polygon points="31,9 69,9 91,31 91,69 69,91 31,91 9,69 9,31" fill="none" stroke="#fff" stroke-width="2"/>
       <text x="50" y="58" text-anchor="middle" font-family="Bahnschrift,Arial Narrow,Arial,sans-serif" font-weight="700" font-size="25" fill="#fff">STOPP</text>`);
  }
  function okSign(label) {
    return labelled(label || 'In Ordnung', '0 0 100 100',
      `<rect x="6" y="6" width="88" height="88" rx="10" fill="#1B7F46"/><path d="M27 52l16 16 31-33" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
  }
  function infoSign(label) {
    return labelled(label || 'Hinweis', '0 0 100 100',
      `<circle cx="50" cy="50" r="44" fill="#0A58A8"/><circle cx="50" cy="29" r="6" fill="#fff"/><rect x="44" y="41" width="12" height="35" rx="3" fill="#fff"/>`);
  }
  function mandatorySign(inner, label) {
    return labelled(label || 'Gebot', '0 0 100 100', `<circle cx="50" cy="50" r="44" fill="#0A58A8"/>${inner}`);
  }

  // ---------- Szenen (160 x 100), flach gezeichnet ----------
  const SKY = '#DCE9F5';
  const scene = (title, inner) => labelled(title, '0 0 160 100', `<rect width="160" height="100" fill="${SKY}"/>${inner}`, 'preserveAspectRatio="xMidYMid slice"');
  const sun = `<circle cx="132" cy="22" r="9" fill="#FFD84D"/>`;
  const drum = (x, y, c) => `<rect x="${x}" y="${y}" width="18" height="24" rx="3" fill="${c || '#2F6DB5'}"/><path d="M${x} ${y + 7}h18M${x} ${y + 17}h18" stroke="#fff" stroke-opacity=".55" stroke-width="1.6"/>`;
  const question = `<circle cx="80" cy="46" r="24" fill="#fff" stroke="${INK}" stroke-width="4"/><text x="80" y="58" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="34" fill="${INK}">?</text>`;
  const grate = (x, y) => `<rect x="${x}" y="${y}" width="34" height="14" rx="2" fill="#2B2F36"/><g stroke="#9AA3AD" stroke-width="2.2"><path d="M${x + 6} ${y + 2}v10M${x + 12} ${y + 2}v10M${x + 18} ${y + 2}v10M${x + 24} ${y + 2}v10M${x + 30} ${y + 2}v10"/></g>`;
  const SCENES = {
    ground_paved: () => scene('Befestigter Untergrund', `${sun}<rect y="58" width="160" height="42" fill="#69707A"/><rect y="58" width="160" height="5" fill="#8A929C"/>
      <path d="M0 80h160" stroke="#fff" stroke-width="3" stroke-dasharray="16 12"/>${drum(26, 40)}<rect x="120" y="44" width="4" height="16" fill="#F28C28"/><path d="M118 60h8l-2-16h-4z" fill="#F28C28"/>`),
    ground_unpaved: () => scene('Unbefestigter Untergrund', `${sun}<rect y="58" width="160" height="42" fill="#9B7A57"/><rect y="58" width="160" height="6" fill="#6FA14F"/>
      <g fill="#7E603F"><circle cx="20" cy="76" r="3"/><circle cx="46" cy="88" r="3.4"/><circle cx="78" cy="74" r="2.6"/><circle cx="108" cy="86" r="3.2"/><circle cx="138" cy="76" r="3"/></g>
      <g stroke="#4F8A38" stroke-width="2.4" stroke-linecap="round"><path d="M12 58l-2-9M16 58l1-8M60 58l-2-8M64 58l2-9M120 58l-2-8M124 58l2-9"/></g>${drum(84, 38, '#D9822B')}`),
    ground_pit: () => scene('Baugrube', `${sun}<rect y="48" width="160" height="52" fill="#9B7A57"/><rect y="48" width="160" height="5" fill="#6FA14F"/>
      <path d="M42 48L54 92H106L118 48Z" fill="#5E4630"/><path d="M54 92H106" stroke="#3E2D1E" stroke-width="3"/>
      <g stroke="${INK}" stroke-width="2.6"><path d="M92 50l10 38M102 50l10 38M95 62h13M98 74h13"/></g>
      <path d="M30 42h100" stroke="#F2C200" stroke-width="5"/><path d="M30 42h100" stroke="${INK}" stroke-width="5" stroke-dasharray="7 7"/><rect x="29" y="42" width="3" height="16" fill="${INK}"/><rect x="128" y="42" width="3" height="16" fill="${INK}"/>`),
    drain_yes: () => scene('Ablauf in Kanal oder Rinne vorhanden', `${sun}<rect y="58" width="160" height="42" fill="#69707A"/>${grate(63, 70)}
      <g stroke="#2F7FD1" stroke-width="3" fill="none" stroke-linecap="round"><path d="M18 66q18 6 38 12"/><path d="M142 64q-18 8-38 14"/></g><path d="M52 77l9 3-8 5M108 77l-9 3 8 5" fill="#2F7FD1" stroke="#2F7FD1" stroke-width="2"/>${drum(18, 40)}`),
    drain_no: () => scene('Kein Ablauf in Kanal oder Rinne', `${sun}<rect y="58" width="160" height="42" fill="#69707A"/><rect y="58" width="160" height="5" fill="#8A929C"/>
      <path d="M0 82h160" stroke="#fff" stroke-width="3" stroke-dasharray="16 12"/>${drum(70, 40)}`),
    drain_unknown: () => scene('Entwässerung unklar', `<rect y="58" width="160" height="42" fill="#8E949C"/>${question}`),
    water_yes: () => scene('Gewässer in der Nähe', `${sun}<rect y="56" width="70" height="44" fill="#9B7A57"/><rect y="56" width="70" height="5" fill="#6FA14F"/>
      <path d="M70 62h90v38H70z" fill="#3E8FD6"/><g stroke="#fff" stroke-opacity=".7" stroke-width="2.4" fill="none" stroke-linecap="round"><path d="M80 74q6-4 12 0t12 0t12 0"/><path d="M96 88q6-4 12 0t12 0t12 0"/></g>
      <g stroke="#4F8A38" stroke-width="2.6" stroke-linecap="round"><path d="M64 60l-2-14M68 60l1-12M60 60l-6-10"/></g>${drum(18, 34)}`),
    water_no: () => scene('Kein Gewässer in der Nähe', `${sun}<rect y="58" width="160" height="42" fill="#7DA85A"/><rect y="58" width="160" height="5" fill="#5E9244"/>
      <rect x="116" y="38" width="6" height="22" fill="#6B4E31"/><circle cx="119" cy="34" r="14" fill="#4F8A38"/>${drum(48, 38)}`),
    water_unknown: () => scene('Gewässerbezug unklar', `<rect y="58" width="160" height="42" fill="#8E949C"/>${question}`),
    pit_yes: () => SCENES.ground_pit(),
    pit_no: () => scene('Keine offene Baugrube', `${sun}<rect y="58" width="160" height="42" fill="#69707A"/><rect y="58" width="160" height="5" fill="#8A929C"/>${drum(60, 40)}<rect x="104" y="36" width="30" height="22" fill="#F28C28"/><rect x="108" y="40" width="10" height="8" fill="#DCE9F5"/>`),
    pit_unknown: () => scene('Baugrube unklar', `<rect y="58" width="160" height="42" fill="#8E949C"/>${question}`),
    hold_yes: () => scene('Auffangeinrichtung vorhanden', `${sun}<rect y="64" width="160" height="36" fill="#69707A"/>
      <path d="M42 62h76v16H42z" fill="#F2C200" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M48 62v-6M112 62v-6" stroke="${INK}" stroke-width="3"/>${drum(71, 36)}
      <circle cx="132" cy="38" r="12" fill="#1B7F46"/><path d="M126 38l5 5 8-10" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round"/>`),
    hold_no: () => scene('Keine Auffangeinrichtung', `${sun}<rect y="64" width="160" height="36" fill="#69707A"/>${drum(71, 40)}
      <path d="M80 66q3 6 0 9q-3-3 0-9z" fill="#2F2F2F"/><ellipse cx="82" cy="84" rx="20" ry="5" fill="#2F2F2F" opacity=".8"/>
      <circle cx="132" cy="38" r="12" fill="#C8281E"/><path d="M126 32l12 12M138 32l-12 12" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>`),
    site_fence: () => scene('Baustelle mit Bauzaun und Gefahrenzeichen', `<rect y="70" width="160" height="30" fill="#9B7A57"/>
      <g stroke="#6B7480" stroke-width="2"><path d="M0 40h160M0 52h160M0 64h160"/><path d="M10 34v40M30 34v40M50 34v40M70 34v40M90 34v40M110 34v40M130 34v40M150 34v40" stroke-width="1.2"/></g>
      <g fill="#6B7480"><rect x="0" y="30" width="5" height="46"/><rect x="155" y="30" width="5" height="46"/><rect x="75" y="30" width="5" height="46"/></g>`),
  };
  function sceneFor(name) { const f = SCENES[name]; return f ? f() : ''; }

  // ---------- Strichsymbole (48 x 48) fuer Taetigkeiten, Gebinde, Ausruestung ----------
  const line = (title, inner) => labelled(title, '0 0 48 48', `<g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`, 'class="lineico"');
  const ACTIVITY = {
    T01: ['Betanken', '<rect x="9" y="8" width="18" height="32" rx="2"/><rect x="13" y="12" width="10" height="8"/><path d="M27 18h5q4 0 4 4v11q0 3 3 3"/><path d="M6 40h24"/>'],
    T02: ['Lagern', '<rect x="6" y="7" width="36" height="34" rx="2"/><path d="M6 24h36M24 7v34"/><rect x="10" y="12" width="10" height="8"/><rect x="28" y="28" width="10" height="9"/>'],
    T03: ['Umfüllen', '<path d="M7 18h14v22H7z"/><path d="M10 18v-4h8v4"/><path d="M27 12l12 8-4 7-12-8z"/><path d="M25 28q-2 6 0 9"/><path d="M35 33v7"/>'],
    T04: ['Transportieren', '<rect x="4" y="12" width="24" height="20" rx="1"/><path d="M28 18h9l6 7v7H28z"/><circle cx="14" cy="35" r="4"/><circle cx="35" cy="35" r="4"/>'],
    T05: ['Be- und Entladen', '<rect x="12" y="19" width="22" height="20" rx="1"/><path d="M12 29h22"/><path d="M23 4v10M18 9l5-5 5 5"/>'],
    T06: ['Verarbeiten oder Auftragen', '<rect x="6" y="7" width="30" height="11" rx="2"/><path d="M36 12h5v12H22v6"/><rect x="19" y="30" width="6" height="12" rx="1"/>'],
    T07: ['Reinigen', '<path d="M9 18h26l-3 22H12z"/><path d="M9 18q13-8 26 0"/><path d="M38 8l2 4 4 1-4 2-2 4-2-4-4-1 4-2z"/>'],
    T08: ['Warten oder Reparieren', '<path d="M31 6a9 9 0 0 0-8 12L8 33a4 4 0 0 0 6 6l15-15a9 9 0 0 0 12-8l-6 3-4-4 3-6z"/>'],
    T09: ['Abfall sammeln', '<path d="M11 14h26l-2 26H13z"/><path d="M8 14h32M18 14V9h12v5"/><path d="M19 22v12M24 22v12M29 22v12"/>'],
    T10: ['Nachunternehmen', '<circle cx="24" cy="17" r="7"/><path d="M15 15q9-12 18 0"/><path d="M8 42q2-13 16-13t16 13"/>'],
    default: ['Tätigkeit', '<circle cx="24" cy="24" r="16"/><path d="M24 14v10l7 5"/>'],
  };
  const CONTAINER = {
    Fass: ['Fass', '<ellipse cx="24" cy="10" rx="13" ry="4"/><path d="M11 10v28q0 4 13 4t13-4V10"/><path d="M11 20q13 4 26 0M11 30q13 4 26 0"/>'],
    IBC: ['IBC-Container', '<rect x="8" y="6" width="32" height="30" rx="2"/><path d="M8 16h32M8 26h32M18 6v30M30 6v30"/><path d="M6 36h36v6H6z"/>'],
    Tank: ['Tank', '<rect x="6" y="14" width="36" height="18" rx="9"/><path d="M14 32v8M34 32v8M24 14v-5"/><path d="M20 9h8"/>'],
    Kanister: ['Kanister', '<path d="M10 14l6-7h14l4 7v26H10z"/><path d="M28 7v7"/><rect x="16" y="20" width="14" height="12" rx="1"/>'],
    Sack: ['Sack', '<path d="M12 8h24l3 6-3 26H12L9 14z"/><path d="M12 8q12 6 24 0"/><path d="M17 22h14M17 29h14"/>'],
  };
  const EQUIP = {
    A01: ['Ölbindemittel', '<path d="M12 12h24l3 6-2 22H11L9 18z"/><path d="M12 12q12 6 24 0"/><circle cx="19" cy="28" r="1.2"/><circle cx="26" cy="31" r="1.2"/><circle cx="31" cy="26" r="1.2"/>'],
    A02: ['Auffangwanne', '<path d="M5 28h38l-3 12H8z"/><rect x="16" y="8" width="16" height="20" rx="3"/><path d="M16 15h16M16 22h16"/>'],
    A03: ['Kanaldichtkissen', '<rect x="5" y="30" width="38" height="10" rx="1"/><path d="M12 33v4M18 33v4M24 33v4M30 33v4M36 33v4"/><rect x="11" y="12" width="26" height="14" rx="7"/>'],
    A04: ['Abdeckung Einlauf', '<rect x="5" y="30" width="38" height="10" rx="1"/><path d="M6 30q18-20 36 0z"/><path d="M12 24l-4 5M36 24l4 5"/>'],
    A05: ['Schutzausrüstung', '<path d="M12 22q0-12 12-12t12 12"/><path d="M9 22h30v5H9z"/><path d="M16 27v7q0 6 8 6t8-6v-7"/><path d="M21 31h6"/>'],
    default: ['Ausrüstung', '<rect x="8" y="12" width="32" height="24" rx="3"/><path d="M8 22h32"/>'],
  };
  function pick(table, key) { return table[key] || table.default || ['', '']; }
  function activity(id) { const [t, p] = pick(ACTIVITY, id); return line(t, p); }
  function container(name) { const [t, p] = pick(CONTAINER, name); return line(t, p); }
  function equipment(id) { const [t, p] = pick(EQUIP, id); return line(t, p); }

  // ---------- Oberflaechen-Icons (24 x 24) ----------
  const UI = {
    chevronRight: '<path d="M9 5l7 7-7 7"/>', chevronLeft: '<path d="M15 5l-7 7 7 7"/>', chevronDown: '<path d="M5 9l7 7 7-7"/>',
    check: '<path d="M4 12l5 5 11-12"/>', close: '<path d="M5 5l14 14M19 5L5 19"/>', plus: '<path d="M12 4v16M4 12h16"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>', print: '<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4"/>', download: '<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>',
    search: '<circle cx="11" cy="11" r="6"/><path d="M16 16l5 5"/>', refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    book: '<path d="M4 5h6q2 0 2 2v12q0-2-2-2H4zM20 5h-6q-2 0-2 2v12q0-2 2-2h6z"/>',
    warn: '<path d="M12 4l9 16H3z"/><path d="M12 10v5M12 17.5v.5"/>', home: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>',
    phone: '<path d="M6 3h4l2 5-2.5 1.5a11 11 0 0 0 5 5L16 12l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 4 6a2 2 0 0 1 2-3z"/>',
    trash: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>', edit: '<path d="M4 20l1-5L16 4l4 4L9 19z"/>',
  };
  function ui(name, extra) {
    return deco('0 0 24 24', `<g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${UI[name] || ''}</g>`, extra || 'class="ico"');
  }

  // ---------- Hinweis aus Stammdaten -> Gefahrenzeichen (nur Anzeige) ----------
  // Rangfolge: 1) GHS-Codes im SDB-Havarieprofil (Abschnitt 2), 2) Stichworte in "Relevante_Eigenschaften".
  // Stichwort-Zuordnung ist ein Hinweis (gestrichelte Umrandung), kein SDB-Inhalt.
  const KEYWORDS = [
    [/explosiv|explosion/i, 'GHS01'], [/ent?z(ue|ü)nd|brennbar|flamm/i, 'GHS02'], [/brandf(oe|ö)rdernd|oxidier/i, 'GHS03'],
    [/gas unter druck|druckgas/i, 'GHS04'], [/(ae|ä)tzend|korrosiv/i, 'GHS05'], [/giftig|toxisch/i, 'GHS06'],
    [/gesundheitssch(ae|ä)dlich|reizend|sensibilisier/i, 'GHS07'], [/krebs|mutagen|reproduktionstox|organsch/i, 'GHS08'],
    [/umweltgef(ae|ä)hrlich|aquatisch toxisch|gew(ae|ä)ssergef(ae|ä)hrdend\s*\(ghs/i, 'GHS09'],
  ];
  function hazardCodesFor(substance, sdbProfile) {
    // 1) GHS-Codes im SDB-Havarieprofil (Feld Einstufung_GHS), 2) Stichworte in Relevante_Eigenschaften (nur Hinweis)
    const einstufung = sdbProfile && sdbProfile.Einstufung_GHS;
    const fromSdb = [];
    if (einstufung) (String(einstufung).match(/GHS0[1-9]/gi) || []).forEach(c => { c = c.toUpperCase(); if (!fromSdb.includes(c)) fromSdb.push(c); });
    if (fromSdb.length) return { source: 'sdb', codes: fromSdb };
    const text = substance ? String(substance.Relevante_Eigenschaften || '') : '';
    const codes = [];
    KEYWORDS.forEach(([re, code]) => { if (re.test(text) && !codes.includes(code)) codes.push(code); });
    return { source: codes.length ? 'stammdaten' : 'none', codes };
  }

  return { ghs, GHS_LIST, warnSign, stopSign, okSign, infoSign, mandatorySign, scene: sceneFor, activity, container, equipment, ui, hazardCodesFor, esc };
}));
