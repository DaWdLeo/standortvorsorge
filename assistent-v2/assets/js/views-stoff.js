/*
 * Station "Stoff": Stoffauswahl, Gefahrstoffkataster einlesen, Stoff selbst hinzufügen.
 * Die Datei wird im Browser gelesen und nie hochgeladen. Eingelesene Stoffe, die nicht in den Stammdaten stehen,
 * bleiben "nicht in den Stammdaten" und führen zu "Fachprüfung nötig".
 */
(function () {
  'use strict';
  const A = window.HavarieApp, I = window.HavarieIcons, C = window.HavarieContent, U = window.HavarieUI, K = window.HavarieKataster;
  const { html, raw, ico } = U;
  const S = A.S, DATA = A.DATA;
  let filterText = '';
  const MAX_SHOWN = 400;
  const GHS_NAMES = {}; I.GHS_LIST.forEach(g => { GHS_NAMES[g.code] = g.name; });

  const norm = s => K.normName(s);
  function matchBadge(m) {
    if (m.matchId) return U.chip('In Stammdaten: ' + m.matchId + ' (über ' + m.matchBy + ')', 'ok', 'check');
    if (m.conflict) return U.chip('Nicht eindeutig: ' + m.conflict, 'stop', 'warn');
    return U.chip('Nicht in Stammdaten', 'warn', 'warn');
  }

  // ---------- Stoffkarten ----------
  function subCard(ch) {
    const sel = S.d.substanceKey === ch.key;
    const hz = A.hazardOf(ch), wgk = A.wgkOf(ch);
    const m = ch.master, mine = ch.mine;
    const badges = [];
    if (wgk) badges.push(U.chip(wgk === 'nwg' ? 'nicht wassergefährdend' : wgk, 'info', 'info'));
    if (m) {
      badges.push(U.chip('SDB: ' + (m.SDB_Vorhanden || '–'), String(m.SDB_Vorhanden).toLowerCase() === 'ja' ? 'ok' : 'warn'));
      if (String(m.Freigabestatus).toLowerCase() !== 'freigegeben') badges.push(U.chip('Stammdaten: ' + (m.Freigabestatus || 'nicht freigegeben'), 'warn', 'warn'));
    }
    if (mine) { badges.push(U.chip(mine.source === 'manuell' ? 'Selbst hinzugefügt' : 'Aus Kataster', 'info')); badges.push(matchBadge(mine)); }
    const meta = [m && m.Hersteller, mine && !m && mine.maker, mine && mine.place && 'Lagerort: ' + mine.place, mine && mine.kat && 'Kataster-Nr. ' + mine.kat].filter(Boolean).join(' | ');
    return html`<div class="sub-item" data-text="${norm(ch.name + ' ' + (m ? m.Hersteller + ' ' + m.Kataster_Referenz : '') + ' ' + (mine ? mine.maker + ' ' + mine.kat : ''))}" ${filterText && !norm(ch.name + ' ' + (mine ? mine.maker + ' ' + mine.kat : '')).includes(norm(filterText)) ? raw('hidden') : ''}>
      <label class="sub-card"><input type="radio" name="substanceKey" id="r-substanceKey-${ch.key}" value="${ch.key}" data-bind="d.substanceKey" ${sel ? raw('checked') : ''}>
        <span class="sub-card__body">
          ${U.signs(hz.codes, hz.source !== 'sdb', 4)}
          <span><span class="sub-card__title">${ch.name}</span><span class="badges">${badges}</span>${meta ? html`<span class="sub-card__meta">${meta}</span>` : ''}</span>
        </span></label>
      ${mine ? html`<button type="button" class="btn btn--sm btn--quiet sub-card__remove" data-act="sub-remove" data-uid="${mine.uid}" aria-label="${mine.name} entfernen">${ico('trash')}Entfernen</button>` : ''}
    </div>`;
  }

  function detail(ch) {
    if (!ch) return '';
    const hz = A.hazardOf(ch), m = ch.master, mine = ch.mine;
    const rows = [];
    if (m) {
      rows.push(['Eigenschaften', m.Relevante_Eigenschaften], ['Wassergefährdung', m.WGK_Information], ['Hersteller', m.Hersteller], ['Aggregatzustand', m.Aggregatzustand],
        ['Sicherheitsdatenblatt', [m.SDB_Version && 'Version ' + m.SDB_Version, m.SDB_Datum && 'vom ' + m.SDB_Datum].filter(Boolean).join(', ')]);
    }
    if (mine) {
      rows.push(['Aus dem Kataster', [mine.maker, mine.state, mine.cas && 'CAS ' + mine.cas, mine.signal && 'Signalwort: ' + mine.signal, mine.sdbDate && 'SDB vom ' + mine.sdbDate].filter(Boolean).join(', ')], ['H-Sätze', mine.hSaetze]);
    }
    const sourceNote = { sdb: 'Aus dem SDB-Havarieprofil der Stammdaten.', stammdaten: 'Gestrichelt: Hinweis aus den Stammdaten-Stichworten, nicht aus dem SDB geprüft.', kataster: 'Gestrichelt: Angabe aus Ihrem Kataster, nicht aus dem SDB geprüft.', none: 'Es sind keine Gefahrenzeichen hinterlegt. Zeichen und Einstufung bitte im SDB prüfen.' }[hz.source];
    return html`<div class="card" id="substance-detail" aria-live="polite">
      <h3>Das müssen Sie über ${ch.name} wissen</h3>
      ${hz.codes.length ? html`<ul class="glist">${hz.codes.map(c => html`<li>${raw(I.ghs(c, { hint: hz.source !== 'sdb' }))}<span><b>${GHS_NAMES[c]}</b>${(C.learn.ghs.list.find(x => x[0] === c) || [0, ''])[1]}</span></li>`)}</ul>` : ''}
      <p class="muted small">${sourceNote}</p>
      ${rows.filter(r => r[1]).length ? html`<dl class="summary">${rows.filter(r => r[1]).map(r => html`<dt>${r[0]}</dt><dd>${r[1]}</dd>`)}</dl>` : ''}
      ${!m ? html`<div class="banner" role="note" style="margin-top:10px">${ico('warn')}<div><b>Dieser Stoff steht nicht in den Stammdaten.</b> Er kann verwendet werden, geht aber zur Fachprüfung. Mit dem Export „Neue Stoffe für die Stammdaten“ lässt er sich fachlich aufnehmen.</div></div>` : ''}
      ${U.learnCard('wgk', { open: S.open, data: DATA })}
    </div>`;
  }

  // ---------- Import-Assistent ----------
  function impPanel() {
    const im = S.imp;
    if (!im) return '';
    if (im.phase === 'pick' || im.phase === 'loading' || im.phase === 'error') {
      return html`<div class="panel panel--solid" id="imp">
        <h3>Gefahrstoffkataster einlesen</h3>
        <p>Excel-Datei (.xlsx) oder CSV auswählen. Die Datei wird nur auf Ihrem Gerät gelesen und nicht hochgeladen.</p>
        <div class="dropzone" data-dropzone>
          ${im.phase === 'loading' ? html`<p role="status"><b>Wird gelesen: ${im.fileName}</b></p>` : html`
          <p>Datei hierher ziehen oder</p>
          <button type="button" class="btn btn--primary" data-act="imp-pick">${ico('upload')}Datei auswählen</button>`}
          <input type="file" id="imp-file" hidden accept=".csv,.txt,.xlsx,text/csv" data-bind="@impFile">
        </div>
        ${im.phase === 'error' ? html`<div class="banner banner--stop" role="alert" style="margin-top:10px">${ico('warn')}<div>${im.message}</div></div>` : ''}
        <p class="hint">Keine Datei zur Hand? <button type="button" class="btn btn--sm" data-act="imp-example">Beispieldatei ausprobieren</button>
          oder herunterladen: <a href="assets/example/Beispiel_Gefahrstoffkataster.xlsx" download>Excel</a>, <a href="assets/example/Beispiel_Gefahrstoffkataster.csv" download>CSV</a></p>
        ${U.learnCard('kataster', { open: S.open, data: DATA })}
        <div class="actions"><button type="button" class="btn btn--quiet" data-act="imp-cancel">Abbrechen</button></div>
      </div>`;
    }
    if (im.phase === 'map') {
      const headers = (im.rows[im.headerRow] || []).map((h, i) => ({ i, name: K.clean(h, 60) || ('Spalte ' + (i + 1)) }));
      const sample = f => {
        const idx = im.mapping[f.key];
        if (idx === undefined || idx === '') return '';
        return im.rows.slice(im.headerRow + 1, im.headerRow + 5).map(r => K.clean(r[idx], 40)).filter(Boolean).slice(0, 3).join(' | ');
      };
      return html`<div class="panel panel--solid" id="imp">
        <h3>Spalten zuordnen</h3>
        <p><b>${im.fileName}</b>: ${im.rows.length - im.headerRow - 1} Zeilen. Die Spalten wurden erkannt. Bitte kurz prüfen, nur der Produktname ist Pflicht.</p>
        <div class="field" style="max-width:320px"><label for="imp-header">Kopfzeile</label>
          <select id="imp-header" data-bind="@impHeader">${im.rows.slice(0, 12).map((r, i) => html`<option value="${i}" ${i === im.headerRow ? raw('selected') : ''}>Zeile ${i + 1}: ${K.clean(r.slice(0, 3).join(', '), 50)}</option>`)}</select></div>
        <div class="tablewrap"><table class="maptable"><thead><tr><th scope="col">Feld</th><th scope="col">Spalte in Ihrer Datei</th><th scope="col">Beispiel</th></tr></thead><tbody>
          ${K.FIELDS.map(f => html`<tr><th scope="row">${f.label}${f.required ? ' *' : ''}</th>
            <td><select data-bind="@impMap" data-field="${f.key}" aria-label="${f.label}"><option value="">nicht vorhanden</option>${headers.map(h => html`<option value="${h.i}" ${String(im.mapping[f.key]) === String(h.i) ? raw('selected') : ''}>${h.name}</option>`)}</select></td>
            <td class="muted small">${sample(f)}</td></tr>`)}
        </tbody></table></div>
        ${im.error ? html`<div class="banner banner--stop" role="alert" style="margin-top:10px">${ico('warn')}<div>${im.error}</div></div>` : ''}
        <div class="actions" style="margin-top:12px"><button type="button" class="btn btn--quiet" data-act="imp-cancel">Abbrechen</button>
          <div class="actions__right"><button type="button" class="btn btn--primary" data-act="imp-map-next">Weiter: Stoffe auswählen${ico('chevronRight')}</button></div></div>
      </div>`;
    }
    // Auswahl
    const subs = im.subs, sel = im.selected;
    const shown = subs.map((s, i) => ({ s, i })).filter(x => !filterText || norm(x.s.name + ' ' + x.s.maker + ' ' + x.s.kat).includes(norm(filterText))).slice(0, MAX_SHOWN);
    const unmatchedSel = subs.filter((s, i) => sel.has(i) && !im.matches[i].id).length;
    return html`<div class="panel panel--solid" id="imp">
      <h3>Welche Stoffe werden auf dieser Baustelle verwendet?</h3>
      <p>${subs.length} Stoffe in der Datei, ${sel.size} ausgewählt. Mit Haken markieren und hinzufügen.</p>
      <div class="field"><label for="imp-search">Suchen</label><input id="imp-search" class="search" type="search" placeholder="Name, Hersteller oder Nummer" value="${filterText}" data-filter="imp"></div>
      <div class="chips" style="margin-bottom:10px">
        <button type="button" class="btn btn--sm" data-act="imp-all">Alle sichtbaren</button>
        <button type="button" class="btn btn--sm" data-act="imp-matched">Nur Treffer in den Stammdaten</button>
        <button type="button" class="btn btn--sm btn--quiet" data-act="imp-none">Keine</button>
      </div>
      <div class="imp-list" role="group" aria-label="Stoffe aus dem Kataster">${shown.map(({ s, i }) => html`
        <label class="imp-row"><input type="checkbox" data-bind="@impSel" data-i="${i}" ${sel.has(i) ? raw('checked') : ''}>
          <span>${U.signs(s.ghs, true, 5)}<b>${s.name}</b> <span class="muted small">${[s.maker, s.kat && 'Nr. ' + s.kat, s.wgk, s.place].filter(Boolean).join(' | ')}</span><br>${matchBadge({ matchId: im.matches[i].id, matchBy: im.matches[i].by, conflict: im.matches[i].conflict })}</span></label>`)}
        ${subs.length > MAX_SHOWN ? html`<p class="hint">Es werden die ersten ${MAX_SHOWN} Treffer gezeigt. Bitte die Suche nutzen.</p>` : ''}
        ${!shown.length ? html`<p class="hint">Kein Stoff passt zur Suche.</p>` : ''}</div>
      ${unmatchedSel ? html`<p class="hint">${unmatchedSel} der ausgewählten Stoffe stehen nicht in den Stammdaten. Sie gehen zur Fachprüfung.</p>` : ''}
      <div class="actions" style="margin-top:12px">
        <button type="button" class="btn btn--quiet" data-act="imp-back-map">${ico('chevronLeft')}Spalten ändern</button>
        <div class="actions__right">
          <button type="button" class="btn" data-act="imp-export">${ico('download')}Neue Stoffe für die Stammdaten (CSV)</button>
          <button type="button" class="btn btn--primary" data-act="imp-add" ${sel.size ? '' : raw('disabled')}>${ico('plus')}${sel.size || ''} ${sel.size === 1 ? 'Stoff' : 'Stoffe'} hinzufügen</button>
        </div>
      </div>
    </div>`;
  }

  function manualPanel() {
    const m = S.manual;
    if (!m) return '';
    return html`<div class="panel panel--solid" id="manual">
      <h3>Stoff selbst hinzufügen</h3>
      <div class="row2">
        <div class="field"><label for="m-name">Produktname</label><input id="m-name" type="text" maxlength="160" autocomplete="off" value="${m.name}" data-live="manual.name"></div>
        <div class="field"><label for="m-maker">Hersteller (optional)</label><input id="m-maker" type="text" maxlength="120" autocomplete="off" value="${m.maker}" data-live="manual.maker"></div>
      </div>
      <fieldset class="q" style="padding-top:0"><legend style="font-size:1rem">Gefahrenzeichen auf dem Gebinde (optional)</legend>
        <div class="chips" style="clear:both">${I.GHS_LIST.map(g => html`<label class="chipbtn"><input type="checkbox" value="${g.code}" data-bind="@manGhs" ${m.ghs.includes(g.code) ? raw('checked') : ''}><span>${raw(I.ghs(g.code).replace('<svg ', '<svg width="26" height="26" aria-hidden="true" '))}${g.name}</span></label>`)}</div></fieldset>
      <div class="field" style="max-width:260px"><label for="m-wgk">Wassergefährdungsklasse (optional)</label>
        <select id="m-wgk" data-bind="manual.wgk"><option value="">unbekannt</option>${['WGK 1', 'WGK 2', 'WGK 3', 'nwg'].map(w => html`<option value="${w}" ${m.wgk === w ? raw('selected') : ''}>${w === 'nwg' ? 'nicht wassergefährdend' : w}</option>`)}</select></div>
      ${m.error ? html`<div class="banner banner--stop" role="alert">${ico('warn')}<div>${m.error}</div></div>` : ''}
      <p class="hint">Steht der Stoff nicht in den Stammdaten, geht er zur Fachprüfung.</p>
      <div class="actions"><button type="button" class="btn btn--quiet" data-act="manual-cancel">Abbrechen</button><div class="actions__right"><button type="button" class="btn btn--primary" data-act="manual-save">${ico('plus')}Hinzufügen</button></div></div>
    </div>`;
  }

  // ---------- Station ----------
  A.views.stoff = function () {
    const choices = A.substanceChoices();
    const masterList = choices.filter(c => c.kind === 'master'), mineList = choices.filter(c => c.kind === 'mine');
    const ch = A.currentSubstance();
    const unknownCard = html`<div class="sub-item"><label class="sub-card"><input type="radio" name="substanceKey" id="r-substanceKey-U" value="U" data-bind="d.substanceKey" ${S.d.substanceKey === 'U' ? raw('checked') : ''}>
      <span class="sub-card__body">${U.signs([], false)}<span><span class="sub-card__title">Stoff steht nicht in der Liste oder ist unbekannt</span><span class="sub-card__meta">Geht zur Fachprüfung.</span></span></span></label></div>`;
    const list = html`
      ${choices.length > 6 ? html`<div class="field"><label for="sub-search">Stoff suchen</label><input id="sub-search" class="search" type="search" placeholder="Name, Hersteller oder Nummer" value="${filterText}" data-filter="sub"></div>` : ''}
      <div class="subst" role="radiogroup" aria-label="Stoff">
        <h3 class="group-title" style="margin:0">Aus den Stammdaten</h3>${masterList.map(subCard)}
        ${mineList.length ? html`<h3 class="group-title" style="margin:8px 0 0">Aus Ihrem Kataster oder selbst hinzugefügt</h3>${mineList.map(subCard)}` : ''}
        ${unknownCard}
      </div>
      <p class="hint">Gestrichelte Zeichen sind Hinweise aus Stammdaten oder Kataster, nicht aus dem Sicherheitsdatenblatt geprüft.</p>`;
    const body = html`
      <div class="actions" style="margin:8px 0 4px;justify-content:flex-start">
        <button type="button" class="btn btn--primary" data-act="imp-open">${ico('upload')}Gefahrstoffkataster einlesen</button>
        <button type="button" class="btn" data-act="manual-open">${ico('plus')}Stoff selbst hinzufügen</button>
      </div>
      ${impPanel()}${manualPanel()}
      ${A.q('stoff', 'substanceKey', 'Welcher Stoff wird eingesetzt?', 'Einen Stoff antippen. Die Gefahrenzeichen erscheinen daneben.', list, 'ghs')}
      ${detail(ch)}
      ${ch ? A.choiceQ('stoff', 'sdbConfirmed', 'sdb_confirmed', 'd.sdbConfirmed') : ''}
      ${ch ? A.choiceQ('stoff', 'dangerousGoods', 'dangerous_goods', 'd.dangerousGoods') : ''}`;
    return A.tafel('stoff', body);
  };

  // ---------- Aktionen ----------
  const openPanel = id => setTimeout(() => { const p = document.getElementById(id); if (p) { p.scrollIntoView({ block: 'start' }); } }, 0);
  A.actions['imp-open'] = () => { S.imp = { phase: 'pick' }; S.manual = null; A.render(); openPanel('imp'); };
  A.actions['import-from-start'] = () => { S.imp = { phase: 'pick' }; S.manual = null; A.go('stoff'); };
  A.actions['imp-cancel'] = () => { S.imp = null; A.render(); };
  A.actions['imp-pick'] = () => { const f = document.getElementById('imp-file'); if (f) f.click(); };

  async function loadRows(promise, fileName) {
    S.imp = { phase: 'loading', fileName }; A.render();
    try {
      const rows = await promise;
      if (!rows.length) throw new Error('Die Datei enthält keine Zeilen.');
      const headerRow = K.findHeaderRow(rows);
      const mapping = K.suggestMapping(rows[headerRow].map(c => K.clean(c, 80)));
      S.imp = { phase: 'map', fileName, rows, headerRow, mapping };
    } catch (e) {
      S.imp = { phase: 'error', message: (e && e.message) || 'Die Datei konnte nicht gelesen werden.' };
    }
    A.render(); openPanel('imp');
  }
  A.binders.impFile = el => { const f = el.files && el.files[0]; if (f) loadRows(K.readFile(f, f.name), f.name); el.value = ''; };
  A.actions['imp-example'] = () => loadRows(Promise.resolve(K.parseCSV(C.exampleKatasterCsv)), 'Beispiel_Gefahrstoffkataster.csv');
  A.binders.impHeader = el => { const im = S.imp; im.headerRow = Number(el.value); im.mapping = K.suggestMapping(im.rows[im.headerRow].map(c => K.clean(c, 80))); A.render(); };
  A.binders.impMap = el => { const im = S.imp; if (el.value === '') delete im.mapping[el.dataset.field]; else im.mapping[el.dataset.field] = Number(el.value); im.error = ''; A.render(); };
  A.actions['imp-map-next'] = () => {
    const im = S.imp;
    if (im.mapping.name === undefined) { im.error = 'Bitte die Spalte mit dem Produktnamen wählen.'; A.render(); return; }
    const r = K.toSubstances(im.rows, im.headerRow, im.mapping);
    if (!r.substances.length) { im.error = 'In dieser Spalte wurden keine Stoffnamen gefunden. Bitte Spalte oder Kopfzeile prüfen.'; A.render(); return; }
    im.subs = r.substances; im.skipped = r.skipped;
    im.matches = r.substances.map(s => K.matchMaster(s, DATA.substances));
    im.selected = new Set(); im.error = ''; im.phase = 'select'; filterText = '';
    A.render(); openPanel('imp');
  };
  A.actions['imp-back-map'] = () => { S.imp.phase = 'map'; A.render(); };
  const visible = () => S.imp.subs.map((s, i) => i).filter(i => !filterText || norm(S.imp.subs[i].name + ' ' + S.imp.subs[i].maker + ' ' + S.imp.subs[i].kat).includes(norm(filterText))).slice(0, MAX_SHOWN);
  A.actions['imp-all'] = () => { visible().forEach(i => S.imp.selected.add(i)); A.render(); };
  A.actions['imp-none'] = () => { S.imp.selected.clear(); A.render(); };
  A.actions['imp-matched'] = () => { S.imp.selected.clear(); S.imp.matches.forEach((m, i) => { if (m.id) S.imp.selected.add(i); }); A.render(); };
  A.binders.impSel = el => { const i = Number(el.dataset.i); if (el.checked) S.imp.selected.add(i); else S.imp.selected.delete(i); A.render(); };
  A.actions['imp-add'] = () => {
    const im = S.imp, added = [];
    [...im.selected].sort((a, b) => a - b).forEach(i => {
      const s = im.subs[i];
      const item = A.cleanMine(Object.assign({}, s, { uid: A.uidFor(s) }));
      if (!item) return;
      const at = S.mine.findIndex(x => x.uid === item.uid);
      if (at >= 0) S.mine[at] = item; else if (S.mine.length < 300) S.mine.push(item);
      added.push(item);
    });
    if (!added.length) return;
    if (!A.currentSubstance()) S.d.substanceKey = 'K:' + added[0].uid;
    S.imp = null; A.save(); A.render();
    A.toast(added.length === 1 ? '1 Stoff hinzugefügt.' : added.length + ' Stoffe hinzugefügt.');
    openPanel('q-substanceKey');
  };
  A.actions['imp-export'] = () => {
    const im = S.imp;
    const pool = im.selected.size ? [...im.selected].map(i => i) : im.subs.map((s, i) => i);
    const subs = pool.filter(i => !im.matches[i].id).map(i => im.subs[i]);
    if (!subs.length) { A.toast('Alle gewählten Stoffe stehen schon in den Stammdaten.'); return; }
    download('Neue_Stoffe_fuer_Stammdaten.csv', K.exportForMaster(subs, GHS_NAMES), 'text/csv;charset=utf-8');
  };
  function download(name, text, type) {
    try {
      const url = URL.createObjectURL(new Blob([text], { type }));
      const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
    } catch (e) { A.toast('Der Download ist hier nicht möglich.'); }
  }
  A.download = download;

  A.actions['manual-open'] = () => { S.manual = { name: '', maker: '', ghs: [], wgk: '', error: '' }; S.imp = null; A.render(); openPanel('manual'); };
  A.actions['manual-cancel'] = () => { S.manual = null; A.render(); };
  A.binders.manGhs = el => { const set = new Set(S.manual.ghs); if (el.checked) set.add(el.value); else set.delete(el.value); S.manual.ghs = [...set].sort(); A.render(); };
  A.actions['manual-save'] = () => {
    const m = S.manual;
    const name = K.clean(m.name, 160);
    if (!name) { m.error = 'Bitte den Produktnamen eintragen.'; A.render(); return; }
    const item = A.cleanMine({ name, maker: m.maker, ghs: m.ghs, wgk: m.wgk, source: 'manuell', uid: A.uidFor({ name, kat: '' }) });
    const at = S.mine.findIndex(x => x.uid === item.uid);
    if (at >= 0) S.mine[at] = item; else S.mine.push(item);
    S.d.substanceKey = 'K:' + item.uid; S.manual = null; A.save(); A.render(); A.toast('Stoff hinzugefügt.');
  };
  A.actions['sub-remove'] = el => {
    const uid = el.dataset.uid;
    S.mine = S.mine.filter(x => x.uid !== uid);
    if (S.d.substanceKey === 'K:' + uid) { S.d.substanceKey = ''; S.d.sdbConfirmed = ''; S.d.dangerousGoods = ''; }
    A.save(); A.render(); A.toast('Stoff entfernt.');
  };

  // ---------- Suchfeld ohne Neuzeichnen, Datei per Drag and Drop ----------
  document.addEventListener('input', ev => {
    const el = ev.target;
    if (!el.dataset || !el.dataset.filter) return;
    filterText = el.value;
    if (el.dataset.filter === 'sub') {
      const n = norm(filterText);
      document.querySelectorAll('.sub-item[data-text]').forEach(it => { it.hidden = !!n && !it.dataset.text.includes(n); });
    } else if (S.imp && S.imp.phase === 'select') {
      const pos = el.selectionStart; A.render(); const again = document.getElementById('imp-search'); if (again) { again.focus(); try { again.setSelectionRange(pos, pos); } catch (e) { /* ignorieren */ } }
    }
  });
  document.addEventListener('dragover', ev => { const z = ev.target.closest && ev.target.closest('[data-dropzone]'); if (z) { ev.preventDefault(); z.classList.add('is-over'); } });
  document.addEventListener('dragleave', ev => { const z = ev.target.closest && ev.target.closest('[data-dropzone]'); if (z) z.classList.remove('is-over'); });
  document.addEventListener('drop', ev => {
    const z = ev.target.closest && ev.target.closest('[data-dropzone]');
    if (!z) return;
    ev.preventDefault(); z.classList.remove('is-over');
    const f = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0];
    if (f) loadRows(K.readFile(f, f.name), f.name);
  });
})();
