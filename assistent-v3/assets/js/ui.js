/*
 * Kleine Bausteine für die Oberfläche: sicheres HTML-Template (escaped alles außer raw()), Auswahlkarten, Lernkarten.
 * Alle dynamischen Werte (auch eingelesene Kataster-Texte) laufen durch esc().
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./icons.js'), require('./content.js'));
  else root.HavarieUI = factory(root.HavarieIcons, root.HavarieContent);
}(typeof self !== 'undefined' ? self : this, function (I, C) {
  'use strict';

  class Raw { constructor(s) { this.s = s; } toString() { return this.s; } }
  const raw = s => new Raw(s == null ? '' : String(s));
  const esc = I.esc;
  function toHtml(v) {
    if (v instanceof Raw) return v.s;
    if (Array.isArray(v)) return v.map(toHtml).join('');
    if (v === null || v === undefined || v === false) return '';
    return esc(v);
  }
  function html(strings, ...vals) {
    let out = strings[0];
    vals.forEach((v, i) => { out += toHtml(v) + strings[i + 1]; });
    return new Raw(out);
  }
  const ico = (name, extra) => raw(I.ui(name, extra));
  // Dekorative Grafik: Titel entfernen und vor Screenreadern verbergen (der Text daneben sagt dasselbe)
  const decorative = svg => String(svg).replace(' role="img"', ' aria-hidden="true" focusable="false"').replace(/<title>[\s\S]*?<\/title>/, '');

  // ---------- Auswahlkarten ----------
  /** Radio-Gruppe als Karten. opts: {name, value, options:[{value,label,sub,scene,svg,unclear}], bind, row} */
  function choiceGroup(o) {
    return html`<div class="choices ${o.text ? 'choices--text' : ''}" role="radiogroup" aria-label="${o.label || ''}">${o.options.map(opt => html`
      <label class="choice ${opt.unclear ? 'choice--unclear' : ''} ${o.row ? 'choice--row' : ''}">
        <input type="radio" name="${o.name}" id="r-${o.name}-${opt.value}" value="${opt.value}" data-bind="${o.bind}" ${String(o.value) === String(opt.value) ? raw('checked') : ''}>
        <span class="choice__body">${opt.scene ? raw(decorative(I.scene(opt.scene))) : (opt.svg ? raw(decorative(opt.svg)) : '')}
          <span class="choice__text"><span class="choice__title">${opt.label}</span>${opt.sub ? html`<span class="choice__sub">${opt.sub}</span>` : ''}</span>
        </span>
        <span class="choice__check">${ico('check')}</span>
      </label>`)}</div>`;
  }

  function chipGroup(o) {      // o: {type:'radio'|'checkbox', name, items:[{id,label,checked}], bind}
    return html`<div class="chips">${o.items.map(it => html`
      <label class="chipbtn"><input type="${o.type}" name="${o.name}" value="${it.id}" data-bind="${o.bind}" ${it.checked ? raw('checked') : ''}><span>${it.label}</span></label>`)}</div>`;
  }

  // ---------- Lernkarten ----------
  function figure(sign, extra) {
    if (!sign) return '';
    if (sign.scene) return raw(I.scene(sign.scene).replace('<svg ', '<svg class="wide" '));
    if (sign.ghs) return raw(sign.ghs.map(c => I.ghs(c)).join(''));
    if (sign.warn) return raw(I.warnSign(sign.warn, 'Warnung'));
    if (sign.info) return raw(I.infoSign('Hinweis'));
    if (sign.stop) return raw(I.stopSign('Stopp'));
    return '';
  }
  function learnCard(id, ctx) {
    const t = C.learn[id];
    if (!t) return '';
    const open = ctx && ctx.open && ctx.open[id];
    const fromData = t.fromData ? t.fromData.split('.').reduce((a, k) => (a ? a[k] : null), ctx && ctx.data) : null;
    return html`<details class="learn" data-learn="${id}" ${open ? raw('open') : ''}>
      <summary>${ico('book')}<span>Mehr dazu: ${t.title}</span>${ico('chevronDown', 'class="ico chev"')}</summary>
      <div class="learn__body">
        ${t.sign ? html`<div class="learn__fig">${figure(t.sign)}</div>` : ''}
        <p class="learn__lead">${t.lead}</p>
        ${t.list ? html`<ul class="glist">${t.list.map(([code, text]) => html`<li>${raw(I.ghs(code))}<span><b>${I.GHS_LIST.find(g => g.code === code).name}</b>${text}</span></li>`)}</ul>` : ''}
        ${t.points ? html`<ul>${t.points.map(p => html`<li>${p}</li>`)}</ul>` : ''}
        ${fromData && fromData.length ? html`<ol class="ordered">${fromData.map(p => html`<li>${String(p).replace(/^\d+\.\s*/, '')}</li>`)}</ol>` : ''}
        ${t.remember ? html`<p class="learn__remember">${t.remember}</p>` : ''}
        ${t.links ? html`<ul class="learn__links">${t.links.map(l => html`<li><a href="${l.href}" target="_blank" rel="noopener noreferrer">${l.label}</a> <span class="muted small">(öffnet extern)</span></li>`)}</ul>` : ''}
      </div></details>`;
  }

  // ---------- Kleinteile ----------
  const chip = (text, tone, iconName) => html`<span class="chip ${tone ? 'chip--' + tone : ''}">${iconName ? ico(iconName) : ''}${text}</span>`;
  function signs(codes, hint, max) {
    const list = (codes || []).slice(0, max || 6);
    if (!list.length) return html`<span class="signs"><span class="nosign">Keine Zeichen hinterlegt</span></span>`;
    return html`<span class="signs">${list.map(c => raw(I.ghs(c, { hint })))}</span>`;
  }
  function stationIcon(id) {
    const g = {
      ort: '<path d="M50 24c-9 0-16 7-16 16 0 12 16 30 16 30s16-18 16-30c0-9-7-16-16-16z" fill="#fff"/><circle cx="50" cy="40" r="6" fill="#0A58A8"/>',
      umgebung: '<path d="M22 66l16-22 12 14 10-10 18 18z" fill="#fff"/><path d="M26 36q12-10 24 0t24 0" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>',
      stoff: '<path d="M42 24h16v4h-4v14l14 24q3 6-3 6H35q-6 0-3-6l14-24V28h-4z" fill="#fff"/><path d="M40 56h20l5 9H35z" fill="#0A58A8"/>',
      taetigkeit: '<path d="M64 26a14 14 0 0 0-14 18L28 66a6 6 0 0 0 8 8l22-22a14 14 0 0 0 18-14l-9 5-6-6 5-9z" fill="#fff"/>',
      ausruestung: '<path d="M50 24l24 8v16c0 14-10 22-24 28-14-6-24-14-24-28V32z" fill="#fff"/><path d="M40 50l8 8 14-16" stroke="#0A58A8" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
      pruefen: '<rect x="30" y="24" width="40" height="52" rx="5" fill="#fff"/><path d="M38 40h24M38 52h24M38 64h14" stroke="#0A58A8" stroke-width="5" stroke-linecap="round"/>',
      ergebnis: '<path d="M30 52l14 14 28-30" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    }[id] || '';
    return raw(decorative(I.mandatorySign(g, 'Station')));
  }

  return { raw, esc, html, ico, decorative, choiceGroup, chipGroup, learnCard, chip, signs, stationIcon, figure, Raw };
}));
