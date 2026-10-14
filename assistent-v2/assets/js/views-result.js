/*
 * Ergebnisseite: Ampel, Gründe, Aufgaben, Maßnahmen, Meldung, Ernstfall. Alles stammt aus engine.js und dem Regelwerk.
 * Die Seite zeigt nie "freigegeben". Die Einstufung ist nur so streng wie die Auswertung oder strenger.
 */
(function () {
  'use strict';
  const A = window.HavarieApp, I = window.HavarieIcons, C = window.HavarieContent, U = window.HavarieUI;
  const { html, raw, ico } = U;
  const S = A.S, DATA = A.DATA;

  const STEP_LABEL = Object.fromEntries(A.STATIONS.map(s => [s.id, s.label]));
  const eqName = id => { const e = DATA.equipment.find(x => String(x.Ausruestung_ID).toLowerCase() === String(id).toLowerCase()); return e ? e.Bezeichnung : id; };
  const sourceOf = id => DATA.sources.find(s => s.Quelle_ID === id);

  /** Einstufung: nur strenger als die Excel-Logik, nie milder. */
  A.verdict = function (res) {
    const stationsOpen = ['ort', 'umgebung', 'stoff', 'taetigkeit', 'ausruestung'].filter(id => A.missing(id).length);
    const sub = res.substance, stoffFrei = sub && String(sub.Freigabestatus).toLowerCase() === 'freigegeben';
    const invalidInput = res.input_validation && !res.input_validation.valid;
    const stopCond = res.blocks > 0 || res.sperrgruende_offen === 1 || res.overall_status === 'NICHT FREIGABEFAEHIG';
    // Fehlende Ausrüstungsangaben können nur weitere Sperren auslösen: Ist schon eine Sperre aktiv, gilt "Stopp".
    const onlyEquipmentOpen = stationsOpen.length === 1 && stationsOpen[0] === 'ausruestung';
    let key;
    if (invalidInput || (stationsOpen.length && !(onlyEquipmentOpen && stopCond))) key = 'unvollstaendig';
    else if (stopCond) key = 'stop';
    else if (res.rule_hits === 0 || res.fachpruefung_erforderlich === 'Ja' || res.overall_status === 'FACHPRUEFUNG ERFORDERLICH' || !sub || !stoffFrei) key = 'fachpruefung';
    else if (!res.complete || !res.pflicht.complete || res.ui_guard.active) key = 'unvollstaendig';
    else if (res.open_count > 0) key = 'massnahmen';
    else key = 'bereit';
    return { key, stationsOpen };
  };

  function reasons(res, v) {
    const out = [];
    v.stationsOpen.forEach(id => {
      const n = A.missing(id).length;
      out.push({ tone: 'warn', title: STEP_LABEL[id] + ': ' + (n === 1 ? 'eine Angabe fehlt' : n + ' Angaben fehlen'), text: 'Bitte nachholen, dann stimmt das Ergebnis.', goto: id });
    });
    const unclear = res.ui_guard.unclear.slice();
    if (S.d.dangerousGoods === 'Zu pruefen') unclear.push('Gefahrgut');
    if (unclear.length) out.push({ tone: 'warn', title: 'Ungeklärt: ' + unclear.join(', '), text: '„Weiß ich nicht“ wird nie als „kein Problem“ gewertet. Vor Ort klären und neu antworten.', goto: unclear.includes('Gefahrgut') ? 'stoff' : 'umgebung' });
    res.rules.filter(r => r.hit && String(r.Sperre).toLowerCase() === 'ja').forEach(r =>
      out.push({ tone: 'block', title: 'Regel ' + r.Regel_ID + ': ' + r.Regeltitel, text: 'Diese Regel sperrt den Einsatz.' }));
    res.excluded_measures.filter(x => String(x.Pflichtmassnahme).toLowerCase() === 'ja').forEach(x => {
      const m = DATA.measures.find(y => y.Massnahme_ID === x.Massnahme_ID);
      if (m && /^B/.test(m.Massnahmengruppe)) out.push({ tone: 'block', title: 'Pflichtmaßnahme nicht ausführbar: ' + x.Titel, text: x.Grund + '.', goto: /Ausruestung/.test(x.Grund) ? 'ausruestung' : '' });
    });
    res.open_measures.filter(o => o.Status === 'Offen').forEach(o => {
      const h = C.omHelp[o.Offene_Massnahme_ID] || {};
      const isLocalFixable = o.Offene_Massnahme_ID === 'OM08' && S.d.projectId !== 'LOKAL';
      out.push({ tone: String(o.Sperrwirkung).toLowerCase() === 'ja' ? 'block' : 'warn', id: o.Offene_Massnahme_ID, title: o.Beschreibung,
        text: h.todo || '', meta: [o.Verantwortliche_Funktion && 'Zuständig: ' + o.Verantwortliche_Funktion, o.Frist && 'Frist: ' + o.Frist].filter(Boolean).join('. '),
        goto: isLocalFixable ? '' : h.goto || '' });
    });
    return out;
  }

  function measureCard(m) {
    const src = sourceOf(m.Quelle_ID);
    const rows = [['Einsatzgrenze', m.Einsatzgrenze], ['Nicht erlaubt', m.Verbot_Hinweis], ['Ausrüstung', m.Erforderliche_Ausruestung && eqName(m.Erforderliche_Ausruestung)],
      ['Zuständig', m.Erforderliche_Rolle], ['Quelle', src ? m.Quelle_ID + ': ' + src.Bezeichnung : m.Quelle_ID]].filter(r => r[1]);
    return html`<div class="measure"><h4>${m.Titel}</h4><p class="muted small">${m.Massnahmenart} | ${/^A/.test(m.Massnahmengruppe) ? 'allgemein' : 'stoff- und szenariobezogen'} | Regel ${m.Ausloesende_Regel_ID} | Version ${m.Massnahmenversion}</p>
      <p>${m.Freigegebener_Text}</p><dl>${rows.map(r => html`<dt>${r[0]}</dt><dd>${r[1]}</dd>`)}</dl></div>`;
  }

  function reportCards(res) {
    const ids = [...new Set(res.rules.filter(r => r.hit && r.Meldekriterium_ID).map(r => r.Meldekriterium_ID))];
    // No implicit reporting criterion: an unmatched rule never creates a reporting obligation.
    const list = ids;
    const checked = list.map(id => DATA.reporting_criteria.find(k => k.Meldekriterium_ID === id)).filter(k => k && !DATA.meta.example_data && ['Freigegeben', 'Aktiv'].includes(k.Freigabestatus));
    if (!checked.length) return html`<p class="muted">Keine fachlich freigegebenen und zugeordneten Meldekriterien verfügbar. Meldung und Eskalation anhand der betrieblich freigegebenen Unterlagen prüfen.</p>`;
    return checked.map(k => html`
      <div class="measure"><h4>${k.Bezeichnung}</h4>
        <p class="muted small">${String(k.Interne_Meldung_erforderlich).toLowerCase() === 'ja' ? 'Interne Meldung erforderlich' : 'Interne Meldung nicht vorgesehen'}${String(k.Externe_Pruefung_erforderlich).toLowerCase() === 'ja' ? ' | externe Prüfung erforderlich' : ''}</p>
        <dl><dt>Auslöser</dt><dd>${k.Ausloeser}</dd><dt>An wen</dt><dd>${k.Moegliche_Empfaengerfunktion}</dd><dt>Wer meldet</dt><dd>${k.Meldebefugnis || '–'}</dd>
          <dt>Wann</dt><dd>${k.Zeitpunkt_Dringlichkeit || '–'}</dd><dt>Angaben</dt><dd>${k.Benoetigte_Angaben || '–'}</dd>${k.Hinweis ? html`<dt>Hinweis</dt><dd>${k.Hinweis}</dd>` : ''}</dl></div>`);
  }

  function summaryText(res, v, rs) {
    const d = S.d, ch = A.currentSubstance(), act = DATA.activities.find(a => a.Taetigkeit_ID === d.activityId), proj = A.project();
    const L = [];
    L.push('Havarie-Assistent Gefahrstoffe: Vorab-Ergebnis (keine Freigabe)');
    if (DATA.meta.example_data) L.push(DATA.meta.banner);
    L.push('Ergebnis: ' + C.verdicts[v.key].title);
    L.push('Datum: ' + A.todayIso() + ' | Angaben von: ' + (d.creator || '–'));
    L.push('Standort: ' + (proj ? proj.Projektbezeichnung : '–') + ' | Einsatzstelle: ' + (A.locationText() || '–'));
    L.push('Stoff: ' + (ch ? ch.name : '–') + ' | Tätigkeit: ' + (act ? act.Bezeichnung : '–') + ' | Menge: ' + (d.amount || '–') + ' ' + d.unit + ' (' + (d.quantityClass || '–') + '), ' + (d.container || '–'));
    L.push('Untergrund: ' + (d.ground || '–') + ' | Einlauf/Kanal: ' + (d.drainage || '–') + ' | Gewässer: ' + (d.water || '–') + ' | Baugrube: ' + (d.excavation || '–') + ' | Rückhaltung: ' + (d.retention || '–'));
    L.push('Pflichtangaben: ' + res.pflicht.progress + ' von ' + res.pflicht.total);
    if (rs.length) { L.push('', 'Offene Punkte:'); rs.forEach(r => L.push('- ' + r.title + (r.text ? ': ' + r.text : ''))); }
    if (res.action) { L.push('', 'Nächste Schritte:'); res.action.split('\n').forEach(x => L.push(x)); }
    L.push('', C.verdictNote);
    return L.join('\n');
  }

  // Separate print dossier: all content is escaped by U.html, never a release document.
  function reportSheet(res, verdict, reasonsList) {
    const d = S.d, proj = A.project(), sub = A.currentSubstance();
    const act = DATA.activities.find(a => a.Taetigkeit_ID === d.activityId);
    const field = (label, value) => html`<div class="report-field"><dt>${label}</dt><dd>${value === undefined || value === null || value === '' ? 'Nicht angegeben' : value}</dd></div>`;
    const items = [
      ['Datum der Auswertung', A.todayIso()], ['Erfasst von', d.creator],
      ['Standort', proj && proj.Projektbezeichnung], ['Einsatzstelle', A.locationText()],
      ['Geplanter Zeitraum', (d.start || '–') + ' bis ' + (d.end || '–')],
      ['Stoff', sub && sub.name], ['Tätigkeit', act && act.Bezeichnung],
      ['Menge und Gebinde', [d.amount, d.unit, d.quantityClass, d.container].filter(Boolean).join(' · ')],
      ['Untergrund', d.ground], ['Entwässerung', d.drainage],
      ['Gewässerbezug', d.water], ['Baugrube', d.excavation],
      ['Rückhaltung', d.retention], ['Schutzbarrieren', A.barrierText()],
      ['Gefahrgutbezug', d.dangerousGoods]
    ];
    return html`<article class="report-sheet" aria-label="Druckausgabe Vorab-Prüfprotokoll">
      <header class="report-head"><div><p class="report-kicker">UMWELTVORSORGE / GEFAHRSTOFFE</p><h1>Vorab-Prüfprotokoll</h1>
        <p>Standortbezogene Vorsorge und Prüfung möglicher Umweltauswirkungen</p></div>
        <div class="report-seal">ENTWURF<br>FACHLICH NICHT<br>FREIGEGEBEN</div></header>
      <section class="report-section"><h2>01 · Dokumentangaben</h2>
        <dl class="report-grid">
          ${field('Dokumenttyp', 'Nicht freigegebenes Vorab-Prüfprotokoll')}
          ${field('Erstellt am', A.todayIso())}
          ${field('Regelwerk', 'Master ' + DATA.meta.master_version)}
          ${field('Datenstand', String(DATA.meta.exported_at || 'nicht hinterlegt').slice(0, 10))}
        </dl>
      </section>
      <section class="report-section"><h2>02 · Erfasste Angaben</h2><dl class="report-grid">${items.map(x => field(x[0],x[1]))}</dl></section>
      <section class="report-section"><h2>03 · Vorab-Prüfergebnis</h2>
        <div class="report-status"><strong>${C.verdicts[verdict.key].title}</strong><p>${C.verdicts[verdict.key].text}</p>
          <p>Pflichtangaben: ${res.pflicht.progress} von ${res.pflicht.total} · Regeltreffer: ${res.rule_hits} · Sperren: ${res.blocks} · Offene Maßnahmen: ${res.open_count}</p></div>
      </section>
      <section class="report-section"><h2>04 · Offene Punkte und Prüfbedarf</h2>
        ${reasonsList.length ? html`<ol class="report-list">${reasonsList.map(x=>html`<li><strong>${x.title}</strong>${x.text ? html` – ${x.text}` : ''}${x.meta ? html` (${x.meta})` : ''}</li>`)}</ol>` : html`<p>Keine offenen Punkte aus dieser Vorabauswertung. Dies ist keine fachliche Freigabe.</p>`}
      </section>
      <section class="report-section"><h2>05 · Maßnahmenstatus</h2>
        ${res.derived_measures.length ? res.derived_measures.map(x=>html`<div class="report-item"><strong>${x.Titel}</strong><p>${x.Freigegebener_Text}</p><p>Regel: ${x.Ausloesende_Regel_ID} · Quelle: ${x.Quelle_ID}</p></div>`) : html`<p>Keine operativ anzeigbare Maßnahme vorhanden.</p>`}
        ${res.excluded_measures.length ? html`<p><strong>${res.excluded_measures.length} Maßnahmen nicht anzeigbar.</strong> Fachliche Voraussetzungen oder Ausrüstung prüfen.</p>` : ''}
      </section>
      <section class="report-section"><h2>06 · Prüfschritt / weitere Bearbeitung</h2>
        <p>Dieses Dokument enthält ein automatisches Vorab-Ergebnis auf Basis des hinterlegten Beispielregelwerks. Offene Fragen sind durch die zuständige Fachfunktion anhand der Quellen zu klären.</p>
      </section>
      <p class="report-disclaimer"><strong>BEISPIELDATEN – FACHLICH NICHT FREIGEGEBEN.</strong> Kein Havarie- oder Notfallplan, keine Einsatzfreigabe, keine rechtsverbindliche Meldungsentscheidung. Im Ereignisfall ausschließlich die geprüften betrieblichen Unterlagen verwenden.</p>
      <footer class="report-footer">Havarie-Assistent · Vorab-Prüfprotokoll · Stand ${A.todayIso()} · Version des Regelwerks: ${DATA.meta.master_version}</footer>
    </article>`;
  }

  A.views.ergebnis = function () {
    const { res } = A.evaluate();
    const v = A.verdict(res), vd = C.verdicts[v.key];
    const rs = reasons(res, v);
    if (res.input_validation && !res.input_validation.valid) res.input_validation.issues.forEach(x => rs.unshift({tone:'warn', title:'Ungültige Angabe: '+x.field, text:x.message, goto:'taetigkeit'}));
    const signSvg = { stop: I.stopSign('Stopp'), info: I.infoSign('Hinweis'), warn: I.warnSign('bang', 'Warnung') }[vd.sign];
    const ch = A.currentSubstance(), hz = A.hazardOf(ch), proj = A.project(), d = S.d;
    const act = DATA.activities.find(a => a.Taetigkeit_ID === d.activityId);
    const actionLines = String(res.action || '').split('\n').map(s => s.replace(/^\d+\.\s*/, '')).filter(Boolean);
    const treff = proj && proj.Notfall_Treffpunkt ? proj.Notfall_Treffpunkt : '';
    S._summary = summaryText(res, v, rs);

    return html`
      ${reportSheet(res, v, rs)}
      <h2 class="vh" id="h-ergebnis" data-heading tabindex="-1">Ergebnis</h2>
      <section class="verdict verdict--${vd.tone}" aria-labelledby="h-verdict">
        ${raw(U.decorative(signSvg))}
        <div><h2 id="h-verdict">${vd.title}</h2><p>${vd.text}</p></div>
        <p class="verdict__note">${C.verdictNote}</p>
      </section>

      <div class="actions no-print" style="margin-bottom:14px">
        <button class="btn" type="button" data-act="go" data-to="pruefen">${ico('edit')}Angaben ändern</button>
        <div class="actions__right">
          <button class="btn" type="button" data-act="copy-summary">${ico('copy')}Zusammenfassung kopieren</button>
          <button class="btn" type="button" data-act="print">${ico('print')}Prüfprotokoll als PDF</button>
        </div>
      </div>

      ${rs.length ? html`<section class="card" aria-labelledby="h-why"><h3 id="h-why">Das ist zu tun</h3>
        <ul class="todo">${rs.map(r => html`<li class="${r.tone === 'block' ? 'is-block' : 'is-warn'}">
          ${raw(U.decorative(r.tone === 'block' ? I.stopSign('Sperre') : I.warnSign('bang', 'Hinweis')).replace('<svg ', '<svg class="sign" '))}
          <span><b>${r.title}</b>${r.text ? html`<span>${r.text}</span><br>` : ''}${r.meta ? html`<span class="muted small">${r.meta}</span>` : ''}</span>
          ${r.goto ? html`<button type="button" class="btn btn--sm no-print" data-act="go" data-to="${r.goto}">${STEP_LABEL[r.goto]}</button>` : raw('<span></span>')}</li>`)}</ul>
      </section>` : html`<section class="card"><h3>Offene Punkte</h3><p>Keine. Nach den hinterlegten Regeln ist nichts offen. Die Freigabe erteilt die Fachfunktion.</p></section>`}

      ${actionLines.length ? html`<section class="card" aria-labelledby="h-next"><h3 id="h-next">Nächste Schritte laut Regelwerk</h3><ol class="ordered">${actionLines.map(x => html`<li>${x}</li>`)}</ol></section>` : ''}

      <section class="card" aria-labelledby="h-case"><h3 id="h-case">Angaben zu diesem Einsatz</h3>
        <div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap">
          ${hz.codes.length ? U.signs(hz.codes, hz.source !== 'sdb', 5) : ''}
          <dl class="summary" style="flex:1;min-width:240px">
            <dt>Datum</dt><dd>${A.todayIso()}</dd><dt>Angaben von</dt><dd>${d.creator || '–'}</dd>
            <dt>Standort</dt><dd>${proj ? proj.Projektbezeichnung : '–'}</dd><dt>Einsatzstelle</dt><dd>${A.locationText() || '–'}</dd>
            <dt>Zeitraum</dt><dd>${d.start} bis ${d.end}</dd>
            <dt>Stoff</dt><dd>${ch ? ch.name : '–'}</dd><dt>Tätigkeit</dt><dd>${act ? act.Bezeichnung : '–'}</dd>
            <dt>Menge</dt><dd>${d.amount ? d.amount + ' ' + d.unit + ' (' + d.quantityClass + '), ' + (C.containerLabels[d.container] || d.container) : '–'}</dd>
            <dt>Untergrund</dt><dd>${d.ground || '–'}</dd><dt>Schutzbarrieren</dt><dd>${A.barrierText() || '–'}</dd>
            ${treff ? html`<dt>Treffpunkt im Notfall</dt><dd>${treff}</dd>` : ''}
          </dl></div>
      </section>

      <section class="card" aria-labelledby="h-meas"><h3 id="h-meas">Maßnahmen für diesen Einsatz</h3>
        ${res.derived_measures.length ? html`<p class="muted">Nur Maßnahmen, die fachlich freigegeben sind und deren Ausrüstung da und geeignet ist.</p>${res.derived_measures.map(measureCard)}`
        : html`<p>Es gibt keine Maßnahme, die jetzt angezeigt werden darf. Das liegt an offenen Punkten oder fehlender Freigabe der Maßnahmen.</p>`}
        ${res.excluded_measures.length ? html`<details class="more"><summary>Nicht anzeigbare Maßnahmen (${res.excluded_measures.length})</summary>${res.excluded_measures.map(x => html`<div class="measure measure--no"><h4>${x.Titel || x.Massnahme_ID}</h4><p class="muted small">Regel ${x.Regel_ID}${String(x.Pflichtmassnahme).toLowerCase() === 'ja' ? ', Pflichtmaßnahme' : ''}</p><p>${x.Grund}</p></div>`)}</details>` : ''}
      </section>

      <section class="card" aria-labelledby="h-report"><h3 id="h-report">Meldung und Eskalation prüfen</h3>${reportCards(res)}${U.learnCard('meldung', { open: S.open, data: DATA })}</section>

      <section class="card" aria-labelledby="h-emerg"><h3 id="h-emerg">Wenn etwas ausläuft</h3>
        <ol class="ordered">${DATA.event.general_actions.map(x => html`<li>${x.replace(/^\d+\.\s*/, '')}</li>`)}</ol>
        <p class="learn__remember" style="margin-top:10px">Bei Gefahr für Menschen zuerst den Notruf 112 wählen.</p></section>

      <section class="card"><details class="more"><summary>Technische Details</summary>
        <p class="muted small">Zur Nachvollziehbarkeit. Stand: ${A.todayIso()}, Auswertung ${res.engine_version}, Regelwerk ${DATA.meta.master_version}.</p>
        <dl class="summary"><dt>Treffer</dt><dd>${res.rule_hits} Regel(n), höchste Priorität: ${res.top_rule || '–'}</dd><dt>Handlungskategorie</dt><dd>${res.handlungskategorie}</dd>
          <dt>Sperren</dt><dd>${res.blocks}</dd><dt>Offene Maßnahmen</dt><dd>${res.open_count}</dd><dt>Einstufung (Excel-Logik)</dt><dd>${res.overall_status}</dd>
          <dt>Prüfstatus</dt><dd>${res.effective_status || '–'}</dd><dt>Ausrüstung</dt><dd>${res.equipment_status}</dd></dl>
        <div class="tablewrap"><table class="maptable"><thead><tr><th>Regel</th><th>Trifft zu</th><th>Priorität</th><th>Kategorie</th><th>Sperre</th></tr></thead><tbody>
          ${res.rules.map(r => html`<tr><td>${r.Regel_ID}: ${r.Regeltitel}</td><td>${r.hit ? 'Ja' : 'Nein'}</td><td>${r.Prioritaet}</td><td>${r.Handlungskategorie}</td><td>${r.Sperre}</td></tr>`)}</tbody></table></div>
      </details></section>

      <div class="actions no-print"><button class="btn" type="button" data-act="new-case">${ico('refresh')}Neuen Einsatz starten</button>
        <div class="actions__right"><button class="btn" type="button" data-act="go" data-to="start">Zum Anfang</button></div></div>
      ${A.footer()}`;
  };

  A.actions.print = () => { try { window.print(); } catch (e) { A.toast('Drucken ist hier nicht möglich.'); } };
  A.actions['copy-summary'] = async () => {
    const text = S._summary || '';
    try { await navigator.clipboard.writeText(text); A.toast('Zusammenfassung kopiert.'); return; } catch (e) { /* weiter mit Ersatz */ }
    try {
      const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove();
      A.toast(ok ? 'Zusammenfassung kopiert.' : 'Kopieren ist hier nicht möglich.');
    } catch (e) { A.toast('Kopieren ist hier nicht möglich.'); }
  };
  A.actions['new-case'] = () => { A.resetCase(); A.go('ort'); };
})();
