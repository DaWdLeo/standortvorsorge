/*
 * Havarie-Assistent (statische Fassung für GitHub Pages): Zustand, Auswertung, Navigation, Einbettung.
 * Die Seiten selbst stehen in views-*.js. Die Regelauswertung steht in engine.js und folgt den Excel-Formeln des Masters.
 *
 * Grundsätze: Diese Fassung erteilt NIE eine Freigabe. Fehlende oder unklare Angaben machen das Ergebnis strenger, nie milder.
 */
(function () {
  'use strict';
  const I = window.HavarieIcons, C = window.HavarieContent, E = window.HavarieEngine, U = window.HavarieUI;
  const DATA = window.HAVARIE_REGELWERK;
  const { html, raw } = U;

  const PLACEHOLDER = 'STANDORTBEZOGEN ZU ERGAENZEN';
  const KEY = 'havarie.pages.v1';
  const STEPS = ['start', 'ort', 'umgebung', 'stoff', 'taetigkeit', 'ausruestung', 'pruefen', 'ergebnis'];
  const STATIONS = C.stations;

  const params = new URLSearchParams(location.search);
  const EMBED = ['1', 'true'].includes(params.get('embed') || '');
  if (['light', 'dark'].includes(params.get('theme'))) document.documentElement.dataset.theme = params.get('theme');
  if (EMBED) document.documentElement.classList.add('embed');

  const todayIso = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };

  function blankDraft() {
    return {
      projectId: '', local: { name: '', contact: '' }, locChip: '', locText: '', creator: '', start: todayIso(), end: todayIso(),
      ground: '', drainage: '', water: '', excavation: '', retention: '', prefilled: {}, barriers: [], barrierOther: '',
      substanceKey: '', sdbConfirmed: '', dangerousGoods: '', activityId: '', amount: '', unit: '', quantityClass: '', container: '', equip: {},
    };
  }

  const A = window.HavarieApp = {
    EMBED, DATA, STEPS, STATIONS, PLACEHOLDER, todayIso, blankDraft,
    S: { step: 'start', d: blankDraft(), mine: [], open: {}, imp: null, manual: null, showErr: {}, hostAuto: false, toast: '', navOpen: false },
    views: {}, actions: {}, binders: {},
  };
  const S = A.S;

  // ---------- Speichern (nur im Browser dieses Geräts; kann fehlen oder gesperrt sein) ----------
  const str = (v, n) => (typeof v === 'string' ? v.slice(0, n || 300) : '');
  function sanitizeDraft(x) {
    const d = blankDraft();
    if (!x || typeof x !== 'object') return d;
    ['projectId', 'locChip', 'locText', 'creator', 'start', 'end', 'ground', 'drainage', 'water', 'excavation', 'retention', 'barrierOther', 'substanceKey',
      'sdbConfirmed', 'dangerousGoods', 'activityId', 'amount', 'unit', 'quantityClass', 'container'].forEach(k => { if (typeof x[k] === 'string' || typeof x[k] === 'number') d[k] = str(String(x[k]), 200); });
    if (x.local && typeof x.local === 'object') { d.local.name = str(x.local.name, 120); d.local.contact = str(x.local.contact, 120); }
    if (Array.isArray(x.barriers)) d.barriers = x.barriers.filter(b => typeof b === 'string').slice(0, 12).map(b => b.slice(0, 40));
    if (x.prefilled && typeof x.prefilled === 'object') Object.keys(x.prefilled).forEach(k => { d.prefilled[k] = !!x.prefilled[k]; });
    if (x.equip && typeof x.equip === 'object') {
      Object.keys(x.equip).slice(0, 40).forEach(id => {
        const e = x.equip[id] || {};
        if (/^[A-Za-z0-9_-]{1,12}$/.test(id)) d.equip[id] = { answer: ['da', 'nicht', 'unklar'].includes(e.answer) ? e.answer : '', qty: Math.max(1, Math.min(99, parseInt(e.qty, 10) || 1)), suit: ['Ja', 'Nein', 'Unbekannt'].includes(e.suit) ? e.suit : '' };
      });
    }
    return d;
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ v: 1, step: S.step, d: S.d, mine: S.mine.slice(0, 300) }));
    } catch (e) { /* kein Speicher verfügbar: App funktioniert trotzdem */ }
  }
  function restore() {
    try {
      const raw0 = localStorage.getItem(KEY);
      if (!raw0) return;
      const x = JSON.parse(raw0);
      if (!x || x.v !== 1) return;
      S.d = sanitizeDraft(x.d);
      S.step = STEPS.includes(x.step) && x.step !== 'ergebnis' ? x.step : 'start';
      S.mine = (Array.isArray(x.mine) ? x.mine : []).slice(0, 300).map(m => A.cleanMine(m)).filter(Boolean);
    } catch (e) { /* ignorieren */ }
  }
  A.save = save;

  A.cleanMine = function (m) {
    const K = window.HavarieKataster;
    if (!m || typeof m !== 'object' || !str(m.name, 160)) return null;
    const sub = {
      uid: /^k[a-z0-9]{1,24}$/.test(m.uid) ? m.uid : A.uidFor(m), name: K.clean(m.name, 160), maker: K.clean(m.maker, 120), kat: K.clean(m.kat, 40), cas: K.clean(m.cas, 30),
      ghs: Array.isArray(m.ghs) ? m.ghs.filter(c => /^GHS0[1-9]$/.test(c)) : [], hSaetze: K.clean(m.hSaetze, 200), signal: K.clean(m.signal, 20),
      wgk: ['WGK 1', 'WGK 2', 'WGK 3', 'nwg', ''].includes(m.wgk) ? m.wgk : '', state: K.clean(m.state, 30), sdbDate: K.clean(m.sdbDate, 20), place: K.clean(m.place, 80),
      source: m.source === 'manuell' ? 'manuell' : 'kataster',
    };
    const mt = K.matchMaster(sub, DATA.substances);       // Abgleich immer frisch gegen die aktuellen Stammdaten
    sub.matchId = mt.id || ''; sub.matchBy = mt.by || ''; sub.conflict = mt.conflict || '';
    return sub;
  };
  A.uidFor = function (sub) {
    const K = window.HavarieKataster;
    const s = (K.normKat(sub.kat) + '|' + K.normName(sub.name));
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return 'k' + h.toString(36);
  };

  // ---------- Stoffe ----------
  A.sdbProfile = id => DATA.sdb_profiles.find(p => String(p.Stoffreferenz_ID).toLowerCase() === String(id).toLowerCase()) || null;
  A.masterSubstance = id => DATA.substances.find(s => s.Stoffreferenz_ID === id) || null;
  A.substanceChoices = function () {
    const list = DATA.substances.map(s => ({ key: 'M:' + s.Stoffreferenz_ID, kind: 'master', master: s, name: s.Produktname }));
    S.mine.forEach(m => list.push({ key: 'K:' + m.uid, kind: 'mine', mine: m, name: m.name, master: m.matchId ? A.masterSubstance(m.matchId) : null }));
    return list;
  };
  A.currentSubstance = function () {
    const k = S.d.substanceKey;
    if (k === 'U') return { key: 'U', kind: 'unknown', name: 'Unbekannter Stoff', master: null };
    return A.substanceChoices().find(x => x.key === k) || null;
  };
  /** Gefahrenzeichen einer Auswahl: {codes, source:'sdb'|'stammdaten'|'kataster'|'none'} */
  A.hazardOf = function (ch) {
    if (!ch) return { codes: [], source: 'none' };
    const fromMaster = ch.master ? I.hazardCodesFor(ch.master, A.sdbProfile(ch.master.Stoffreferenz_ID)) : { codes: [], source: 'none' };
    if (fromMaster.source === 'sdb') return fromMaster;
    if (ch.mine && ch.mine.ghs.length) return { codes: ch.mine.ghs, source: 'kataster' };
    return fromMaster;
  };
  A.wgkOf = function (ch) {
    if (!ch) return '';
    if (ch.master && ch.master.WGK_Information) return ch.master.WGK_Information;
    return ch.mine ? ch.mine.wgk : '';
  };

  // ---------- Entwurf für die Auswertung ----------
  A.locationText = () => [S.d.locChip, S.d.locText.trim()].filter(Boolean).join(' – ');
  A.barrierText = function () {
    const labels = S.d.barriers.map(id => (id === 'keine' ? 'Keine Schutzbarrieren' : (C.barrierChips.find(b => b.id === id) || {}).label)).filter(Boolean);
    if (S.d.barrierOther.trim()) labels.push(S.d.barrierOther.trim());
    return labels.join(', ');
  };
  A.localProject = function () {
    const d = S.d;
    return {
      Projekt_ID: 'LOKAL', Projektbezeichnung: d.local.name.trim(), Standort: d.local.name.trim(), Adresse: '', Direktion_Einheit: '', Projektverantwortung: d.creator,
      Umwelt_HSE_Kontakt: d.local.contact.trim() || PLACEHOLDER, Notfall_Treffpunkt: '', Zufahrt: '', Entwaesserungsbeschreibung: '', Gewaesserbezug: d.water,
      Untergrund: d.ground, Baugrube: d.excavation, Rueckhaltemoeglichkeit: '', Notfallausruestung_Standort: '', Projektstatus: '',
    };
  };
  A.project = function () {
    if (S.d.projectId === 'LOKAL') return A.localProject();
    return DATA.projects.find(p => p.Projekt_ID === S.d.projectId) || null;
  };
  A.dataEff = function () {
    if (S.d.projectId !== 'LOKAL' || !S.d.local.name.trim()) return DATA;
    return Object.assign({}, DATA, { projects: DATA.projects.concat([A.localProject()]) });
  };
  A.neededEquipment = function () {
    const res = E.evaluate(A.dataEff(), A.buildDraft(false), A.evalOpts());
    const hit = new Set(res.rules.filter(r => r.hit).map(r => r.Regel_ID));
    const need = new Map();
    const add = (id, hard, why) => {
      const eq = DATA.equipment.find(e => String(e.Ausruestung_ID).toLowerCase() === String(id).toLowerCase());
      if (!eq) return;
      const cur = need.get(eq.Ausruestung_ID) || { id: eq.Ausruestung_ID, hard: false, why: [] };
      cur.hard = cur.hard || hard; if (!cur.why.includes(why)) cur.why.push(why);
      need.set(eq.Ausruestung_ID, cur);
    };
    DATA.rules.forEach(r => { if (hit.has(r.Regel_ID) && r.Ausruestung_ID) add(r.Ausruestung_ID, true, 'Regel ' + r.Regel_ID + ': ' + r.Regeltitel); });
    DATA.rule_measures.forEach(a => {
      if (!hit.has(a.Regel_ID)) return;
      const m = DATA.measures.find(x => x.Massnahme_ID === a.Massnahme_ID);
      if (m && m.Erforderliche_Ausruestung) add(m.Erforderliche_Ausruestung, String(a.Pflichtmassnahme).toLowerCase() === 'ja', 'Maßnahme ' + m.Massnahme_ID + ': ' + m.Titel);
    });
    return need;
  };
  A.evalOpts = () => ({ today: todayIso(), manualDecision: '', einsatzId: 'ENTWURF', strictUnclear: true });

  A.buildDraft = function (withEquip, needOverride) {
    const d = S.d, ch = A.currentSubstance();
    let substanceId = '', productName = '';
    if (ch) {
      productName = ch.name;
      substanceId = ch.kind === 'master' ? ch.master.Stoffreferenz_ID : (ch.kind === 'mine' && ch.mine.matchId ? ch.mine.matchId : '');
    }
    const act = DATA.activities.find(a => a.Taetigkeit_ID === d.activityId);
    const draft = {
      projectId: d.projectId === 'LOKAL' ? (d.local.name.trim() ? 'LOKAL' : '') : d.projectId,
      substanceId, productName, activityId: d.activityId, activityName: act ? act.Bezeichnung : '',
      amount: d.amount === '' ? '' : Number(String(d.amount).replace(',', '.')), unit: d.unit, quantityClass: d.quantityClass, container: d.container,
      dangerousGoods: d.dangerousGoods, sdbConfirmed: d.sdbConfirmed, ground: d.ground, drainage: d.drainage, water: d.water, excavation: d.excavation,
      retention: d.retention, barriers: A.barrierText(), location: A.locationText(), creator: d.creator.trim(), equipment: [],
    };
    if (withEquip) {
      const need = needOverride || A.neededEquipment();
      const ids = new Set([...need.keys(), ...Object.keys(d.equip)]);
      ids.forEach(id => {
        const e = d.equip[id], n = need.get(id);
        const base = { equipment_id: id, required_qty: 1, blocking_if_missing: n && n.hard ? 'Ja' : 'Nein' };
        if (!e || !e.answer) return;
        if (e.answer === 'da') draft.equipment.push(Object.assign(base, { available_qty: e.qty, accessible: 'Ja', suitability_confirmed: e.suit || '' }));
        else if (n && e.answer === 'nicht') draft.equipment.push(Object.assign(base, { available_qty: 0, accessible: 'Nein', suitability_confirmed: 'Ja' }));
        else if (n && e.answer === 'unklar') draft.equipment.push(Object.assign(base, { available_qty: '', accessible: '', suitability_confirmed: 'Unbekannt' }));
      });
    }
    return draft;
  };
  A.evaluate = function () {
    const need = A.neededEquipment();
    return { res: E.evaluate(A.dataEff(), A.buildDraft(true, need), A.evalOpts()), need };
  };

  // ---------- Pflichtfragen je Station ----------
  A.missing = function (step) {
    const d = S.d, m = [];
    const need = (id, text, ok) => { if (!ok) m.push({ id, text }); };
    if (step === 'ort') {
      need('projekt', 'Bitte einen Standort wählen.', !!d.projectId);
      if (d.projectId === 'LOKAL') need('lokal', 'Bitte den Standort benennen.', !!d.local.name.trim());
      need('ort-genau', 'Bitte die Einsatzstelle auswählen oder beschreiben.', !!A.locationText());
      need('zeit', 'Bitte Beginn und Ende angeben.', !!d.start && !!d.end && d.end >= d.start);
      need('ersteller', 'Bitte Ihren Namen eintragen.', !!d.creator.trim());
    } else if (step === 'umgebung') {
      ['ground', 'drainage', 'water', 'excavation', 'retention'].forEach(k => need(k, 'Bitte eine Antwort wählen.', !!d[k]));
      need('barriers', 'Bitte Schutzbarrieren wählen oder „Keine“.', !!A.barrierText());
    } else if (step === 'stoff') {
      need('substanceKey', 'Bitte einen Stoff wählen.', !!A.currentSubstance());
      need('sdbConfirmed', 'Bitte eine Antwort wählen.', !!d.sdbConfirmed);
      need('dangerousGoods', 'Bitte eine Antwort wählen.', !!d.dangerousGoods);
    } else if (step === 'taetigkeit') {
      need('activityId', 'Bitte eine Tätigkeit wählen.', !!d.activityId);
      need('amount', 'Bitte eine gültige positive Menge angeben.', E.validateInput(A.dataEff(), A.buildDraft(false)).issues.every(x => x.field !== 'amount'));
      need('unit', 'Bitte eine gültige Einheit wählen.', E.validateInput(A.dataEff(), A.buildDraft(false)).issues.every(x => x.field !== 'unit'));
      need('quantityClass', 'Bitte eine gültige Mengenklasse wählen.', E.validateInput(A.dataEff(), A.buildDraft(false)).issues.every(x => x.field !== 'quantityClass'));
      need('container', 'Bitte ein gültiges Gebinde wählen.', E.validateInput(A.dataEff(), A.buildDraft(false)).issues.every(x => x.field !== 'container'));
    } else if (step === 'ausruestung') {
      A.neededEquipment().forEach((n, id) => {
        const e = d.equip[id];
        need('eq-' + id, 'Bitte angeben, ob die Ausrüstung da ist.', !!(e && e.answer));
        if (e && e.answer === 'da') need('eq-' + id, 'Bitte angeben, ob sie zum Stoff passt.', !!e.suit);
      });
    }
    return m;
  };
  A.progressOf = function (step) {
    const i = STATIONS.findIndex(s => s.id === step);
    return i < 0 ? 0 : i;
  };

  // ---------- Darstellung ----------
  const $ = id => document.getElementById(id);
  function chromeHtml() {
    const meta = DATA.meta, step = S.step;
    const idx = STATIONS.findIndex(s => s.id === step);
    const done = id => A.missing(id).length === 0 && STATIONS.findIndex(s => s.id === id) < Math.max(idx, step === 'ergebnis' ? 99 : 0);
    const pct = step === 'start' ? 0 : step === 'ergebnis' ? 100 : Math.round(((idx + 1) / STATIONS.length) * 100);
    return html`
      <header class="top">
        <div class="brand">${raw(I.warnSign('bang', 'Warnzeichen'))}<span>Havarie-Assistent Gefahrstoffe</span></div>
        ${step !== 'start' ? html`<button class="btn btn--sm btn--quiet" type="button" data-act="go" data-to="start">${U.ico('home')}Start</button>` : ''}
      </header>
      ${meta.example_data ? html`<div class="banner" role="note">${U.ico('warn')}<div><b>${meta.banner}</b><br>Regeln, Stoffe und Standorte sind Beispiele und fachlich nicht freigegeben. Das Ergebnis ist nicht verbindlich.</div></div>` : ''}
      ${(meta.warnings && meta.warnings.length) ? html`<div class="banner banner--stop" role="alert">${U.ico('warn')}<div><b>Daten prüfen</b>${meta.warnings.map(w => html`<br>${w}`)}</div></div>` : ''}
      `;
  }
  // Persistent station status: lives outside #chrome so sticky works across the full page.
  function statusHtml() {
    const step = S.step, idx = STATIONS.findIndex(s => s.id === step);
    const num = idx >= 0 ? idx + 1 : step === 'ergebnis' ? STATIONS.length : 0;
    const label = step === 'start' ? 'Vorbereitung' : step === 'ergebnis' ? 'Vorab-Ergebnis' : step === 'notfall' ? 'Notfallplan' : STATIONS[idx].label;
    const pct = step === 'notfall' ? 0 : Math.round(num * 100 / STATIONS.length);
    const done = id => A.missing(id).length === 0 && (STATIONS.findIndex(st => st.id === id) < (idx < 0 ? (step === 'ergebnis' ? 99 : 0) : idx));
    return html`
      <div class="dock__top">
        <div class="dock__identity"><span class="dock__dot" aria-hidden="true"></span><strong>${label}</strong><span class="dock__step">${step === 'start' ? 'Start' : step === 'ergebnis' ? 'Ergebnis' : 'Station ' + num + '/' + STATIONS.length}</span></div>
        <span class="dock__safety" title="Beispieldaten, keine fachliche Freigabe">Demo · nicht freigegeben</span>
      </div>
      <div class="dock__bottom">
        <div class="dock__progress" role="progressbar" aria-label="Durchlaufene Stationen" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><span style="width:${pct}%"></span></div>
        <span class="dock__count">${A.pflichtSummary()}</span>
        <button class="dock__toggle industrial-quick-emergency" type="button" data-act="go" data-to="notfall" aria-label="Notfallinformationen direkt öffnen">Notfall</button>
        <button class="dock__toggle" type="button" data-act="nav-toggle" aria-expanded="${!!S.navOpen}" aria-controls="dock-navigation">${S.navOpen ? 'Schließen' : 'Stationen'} <span aria-hidden="true">${S.navOpen ? '↑' : '↓'}</span></button>
      </div>
      <nav class="dock__navigation" id="dock-navigation" aria-label="Stationen und Schritte" ${S.navOpen ? '' : raw('hidden')}>
        ${STATIONS.map((st, i) => html`<button type="button" class="dock__link ${done(st.id) ? 'is-done' : ''}" data-act="go" data-to="${st.id}" ${st.id === step ? raw('aria-current="step"') : ''}><span>${done(st.id) ? U.ico('check') : i + 1}</span>${st.label}</button>`)}
        <button type="button" class="dock__link dock__link--result" data-act="go" data-to="ergebnis" ${step === 'ergebnis' ? raw('aria-current="step"') : ''}><span>✓</span>Vorab-Ergebnis</button>
      </nav>`;
  }
  A.actions['nav-toggle'] = () => { S.navOpen = !S.navOpen; A.render(); };
  A.pflichtSummary = function () {
    try {
      const { res } = A.evaluate();
      return res.pflicht.progress + ' von ' + res.pflicht.total + ' Pflichtangaben';
    } catch (e) { return ''; }
  };

  function updateDockCompact() {
    const el = $('status-dock');
    if (el) el.classList.toggle('is-compact', window.scrollY > 100);
  }
  let lastStep = S.step;
  A.render = function (opts) {
    const o = opts || {};
    const focusId = document.activeElement && document.activeElement.id;
    const view = A.views[S.step] || A.views.start;
    $('chrome').innerHTML = chromeHtml().s;
    $('status-dock').innerHTML = statusHtml().s;
    $('stage').innerHTML = view().s;
    $('app').classList.toggle('sticky', !(EMBED && S.hostAuto));
    if (S.step !== lastStep || o.focusHeading) {
      lastStep = S.step;
      const h = document.querySelector('#stage [data-heading]');
      if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    } else if (focusId && $(focusId)) {
      $(focusId).focus({ preventScroll: true });
    }
    updateDockCompact();
    A.postHeight();
  };
  A.rerender = () => A.render();

  A.go = function (step, opts) {
    if (!STEPS.includes(step)) return;
    const o = opts || {};
    S.step = step;
    S.navOpen = false;
    if (!o.noHistory) { try { history.pushState({ step }, '', '#' + step); } catch (e) { /* ignorieren */ } }
    save();
    A.render({ focusHeading: true });
    A.scrollTop();
  };
  A.scrollTop = function () {
    if (EMBED && S.hostAuto) window.parent.postMessage({ source: 'havarie', type: 'scrollTop' }, '*');
    else window.scrollTo({ top: 0, behavior: 'auto' });
  };
  A.next = function () {
    const i = STEPS.indexOf(S.step);
    const miss = A.missing(S.step);
    if (miss.length) {
      S.showErr[S.step] = true;
      A.render();
      const first = document.getElementById('q-' + miss[0].id);
      if (first) first.scrollIntoView({ block: 'center' });
      A.say('Es fehlen ' + miss.length + ' Angaben.');
      return;
    }
    A.go(STEPS[Math.min(i + 1, STEPS.length - 1)]);
  };
  A.back = function () { A.go(STEPS[Math.max(STEPS.indexOf(S.step) - 1, 0)]); };
  A.say = function (text) {
    S.toast = text; const t = $('live'); if (t) t.textContent = text;
  };
  A.toast = function (text) {
    A.say(text);
    const el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = text;
    document.body.appendChild(el); setTimeout(() => el.remove(), 3200);
  };
  A.resetCase = function () {
    S.d = blankDraft(); S.showErr = {}; S.imp = null; S.manual = null; save();
  };
  A.clearAll = function () {
    S.d = blankDraft(); S.mine = []; S.showErr = {}; S.imp = null; S.manual = null; S.step = 'start';
    try { localStorage.removeItem(KEY); } catch (e) { /* ignorieren */ }
  };

  // ---------- Einbettung (iframe) ----------
  let lastH = 0;
  A.postHeight = function () {
    if (!EMBED || window.parent === window) return;
    const el = $('app');
    const h = Math.ceil(el.getBoundingClientRect().height + el.getBoundingClientRect().top + window.scrollY) + 4;
    if (Math.abs(h - lastH) < 2) return;
    lastH = h;
    window.parent.postMessage({ source: 'havarie', type: 'height', height: h }, '*');
  };

  // ---------- Ereignisse ----------
  function setPath(path, value) {
    const parts = path.split('.');
    let o = S;
    for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]];
    o[parts[parts.length - 1]] = value;
  }
  function onClick(ev) {
    const el = ev.target.closest('[data-act]');
    if (!el) return;
    const fn = A.actions[el.dataset.act];
    if (!fn) return;
    if (el.tagName === 'A' || el.type === 'submit') ev.preventDefault();
    fn(el, ev);
  }
  function onChange(ev) {
    const el = ev.target;
    if (!el.dataset || !el.dataset.bind) return;
    const bind = el.dataset.bind;
    if (bind[0] === '@') {
      const fn = A.binders[bind.slice(1)];
      if (fn) fn(el);
      return;
    }
    setPath(bind, el.type === 'checkbox' ? el.checked : el.value);
    const f = bind.split('.').pop();
    if (S.d.prefilled && S.d.prefilled[f]) delete S.d.prefilled[f];
    save();
    A.render();
  }
  function onInput(ev) {
    const el = ev.target;
    if (!el.dataset || !el.dataset.live) return;       // Textfelder: Wert übernehmen, ohne neu zu zeichnen
    setPath(el.dataset.live, el.value);
    save();
  }
  function onToggle(ev) {
    const el = ev.target;
    if (el.matches && el.matches('details[data-learn]')) { S.open[el.dataset.learn] = el.open; A.postHeight(); }
  }
  function onMessage(ev) {
    const m = ev.data;
    if (!m || typeof m !== 'object' || m.source !== 'havarie-host') return;
    if (ev.source !== window.parent) return;
    if (m.type === 'hello') { S.hostAuto = !!m.autoHeight; lastH = 0; $('app').classList.toggle('sticky', !S.hostAuto); A.postHeight(); }
  }

  A.start = function () {
    if (!DATA || !DATA.rules) {
      document.getElementById('stage').innerHTML = '<div class="noscript"><h2>Regelwerk nicht geladen</h2><p>Die Datei <code>data/regelwerk.js</code> fehlt. Bitte die Seite neu laden.</p></div>';
      return;
    }
    restore();
    const hash = location.hash.replace('#', '');
    if (STEPS.includes(hash) && hash !== 'ergebnis') S.step = hash;
    else if (!hash) S.step = S.step === 'start' ? 'start' : S.step;
    const root = document.getElementById('app');
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    root.addEventListener('input', onInput);
    root.addEventListener('toggle', onToggle, true);
    window.addEventListener('message', onMessage);
    window.addEventListener('scroll', updateDockCompact, { passive: true });
    window.addEventListener('popstate', () => {
      const h = location.hash.replace('#', '');
      S.step = STEPS.includes(h) ? h : 'start';
      A.render({ focusHeading: true });
    });
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => A.postHeight()).observe(root);
    try { history.replaceState({ step: S.step }, '', '#' + S.step); } catch (e) { /* ignorieren */ }
    A.render({ focusHeading: false });
    if (EMBED && window.parent !== window) window.parent.postMessage({ source: 'havarie', type: 'ready' }, '*');
  };
})();
