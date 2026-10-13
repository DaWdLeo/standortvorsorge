/*
 * Seiten: Start, Ort, Umgebung, Tätigkeit, Ausrüstung, Prüfen.
 */
(function () {
  'use strict';
  const A = window.HavarieApp, I = window.HavarieIcons, C = window.HavarieContent, U = window.HavarieUI;
  const { html, raw, ico } = U;
  const S = A.S, DATA = A.DATA;

  // ---------- gemeinsame Bausteine ----------
  function missingIds(step) { return S.showErr[step] ? A.missing(step).map(m => m.id) : []; }

  A.tafel = function (id, body, opts) {
    const o = opts || {};
    const st = A.STATIONS.find(s => s.id === id);
    const miss = S.showErr[id] ? A.missing(id) : [];
    const last = id === 'pruefen';
    return html`
      <section class="tafel" aria-labelledby="h-${id}">
        <div class="tafel__head">${U.stationIcon(id)}<div><h2 id="h-${id}" data-heading>${st.title}</h2><p>${st.lead}</p></div></div>
        <div class="tafel__body">${body}</div>
      </section>
      ${miss.length ? html`<div class="banner banner--stop" role="alert">${ico('warn')}<div><b>${miss.length === 1 ? 'Eine Angabe fehlt.' : miss.length + ' Angaben fehlen.'}</b> Die markierten Fragen bitte beantworten.</div></div>` : ''}
      <div class="actions-bar"><div class="actions">
        <button class="btn" type="button" data-act="back">${ico('chevronLeft')}Zurück</button>
        <div class="actions__right">
          ${o.extraAction || ''}
          ${last ? html`<button class="btn btn--primary" type="button" data-act="show-result">Ergebnis anzeigen${ico('chevronRight')}</button>`
        : html`<button class="btn btn--primary" type="button" data-act="next">Weiter${ico('chevronRight')}</button>`}
        </div>
      </div></div>`;
  };

  A.q = function (step, id, title, help, inner, learnId, extra) {
    const missing = missingIds(step).includes(id);
    const msg = (A.missing(step).find(m => m.id === id) || {}).text || 'Bitte beantworten.';
    return html`<fieldset class="q ${missing ? 'is-missing' : ''}" id="q-${id}">
      <legend>${title}</legend>
      ${help ? html`<p class="q__help">${help}</p>` : ''}
      ${extra || ''}
      ${inner}
      ${learnId ? U.learnCard(learnId, { open: S.open, data: DATA }) : ''}
      <p class="q__err" role="alert">${msg}</p>
    </fieldset>`;
  };

  function listFor(key) { return DATA.lists[key] || []; }
  function optionsFor(qid, listKey) {
    const q = C.questions[qid];
    const allowed = listFor(listKey);
    return q.options.filter(o => allowed.includes(o.value));
  }
  function choiceQ(step, qid, listKey, bind, extra) {
    const q = C.questions[qid];
    const field = bind.split('.').pop();
    const pre = S.d.prefilled && S.d.prefilled[field] ? U.chip('Vorschlag aus den Standortdaten', 'info', 'info') : '';
    return A.q(step, field, q.title, q.help, U.choiceGroup({ name: qid, bind, value: S.d[field], options: optionsFor(qid, listKey), label: q.title }), q.learn, html`${pre}${extra || ''}`);
  }
  A.choiceQ = choiceQ;

  // ---------- Start ----------
  A.views.start = function () {
    const has = S.d.projectId || S.d.substanceKey || S.d.activityId || S.mine.length;
    const first = A.missing('ort').length === 0 ? 'umgebung' : 'ort';
    return html`
      <section class="hero" aria-labelledby="h-start">
        <div class="hero__stripe" aria-hidden="true"></div>
        <div class="hero__grid">
          <div>
            <h1 id="h-start" data-heading>Vor dem Einsatz: Gefahrstoff-Check für die Baustelle</h1>
            <p class="hero__lead">Sechs kurze Stationen, dann ein Vorab-Ergebnis: Was ist noch zu klären, bevor es losgeht?</p>
            <ol class="steps">
              <li><b>Ort:</b> Standort und Einsatzstelle</li>
              <li><b>Umgebung:</b> Untergrund, Kanäle, Gewässer</li>
              <li><b>Stoff:</b> aus der Liste oder aus dem Gefahrstoffkataster</li>
              <li><b>Tätigkeit:</b> was, wie viel, in welchem Gebinde</li>
              <li><b>Ausrüstung:</b> was für den Ernstfall bereitliegt</li>
              <li><b>Prüfen:</b> alle Pflichtangaben auf einen Blick</li>
            </ol>
            <div class="hero__cta">
              <button class="btn btn--primary" type="button" data-act="begin">${has ? 'Neu beginnen' : 'Einweisung starten'}${ico('chevronRight')}</button>
              ${has ? html`<button class="btn" type="button" data-act="go" data-to="${first}">Weitermachen</button>` : ''}
              <button class="btn" type="button" data-act="import-from-start">${ico('upload')}Gefahrstoffkataster einlesen</button>
            </div>
            <p class="hint">Dauer etwa 5 Minuten. Eingaben bleiben auf Ihrem Gerät, nichts wird hochgeladen.</p>
          </div>
          <div class="hero__fence" aria-hidden="true">${raw(I.scene('site_fence').replace('<svg ', '<svg preserveAspectRatio="xMidYMid slice" '))}
            <div class="hero__signs">${['GHS02', 'GHS05', 'GHS07', 'GHS09'].map(c => raw(I.ghs(c)))}</div></div>
        </div>
      </section>

      <section class="card" aria-labelledby="h-signs">
        <h3 id="h-signs">Gefahrenzeichen kennenlernen</h3>
        <p class="muted">Diese neun Zeichen begegnen Ihnen auf Gebinden. Tippen Sie auf „Mehr dazu“ für die Bedeutung.</p>
        <div class="signs" style="width:auto;gap:8px;margin-bottom:8px">${I.GHS_LIST.map(g => raw(I.ghs(g.code)))}</div>
        ${U.learnCard('ghs', { open: S.open, data: DATA })}
      </section>

      <section class="card" aria-labelledby="h-learn">
        <h3 id="h-learn">Lernkarten</h3>
        <p class="muted">Kurze Erklärungen zu allen Themen. Sie erscheinen auch direkt bei den Fragen.</p>
        <details class="more"><summary>Alle Lernkarten anzeigen</summary>
          <div style="display:grid;gap:8px">${Object.keys(C.learn).filter(k => k !== 'ghs').map(k => U.learnCard(k, { open: S.open, data: DATA }))}</div>
        </details>
      </section>
      ${A.footer()}`;
  };

  A.footer = function () {
    const m = DATA.meta;
    return html`<footer class="footer">
      <p>${C.verdictNote}</p>
      <p>Regelwerk-Stand: Master ${m.master_version}, exportiert am ${String(m.exported_at).slice(0, 10)}. Auswertung läuft in Ihrem Browser.</p>
      <div class="footer__links"><button type="button" data-act="clear-all">Gespeicherte Eingaben auf diesem Gerät löschen</button></div>
    </footer>`;
  };

  // ---------- Ort ----------
  A.views.ort = function () {
    const d = S.d, proj = d.projectId && d.projectId !== 'LOKAL' ? DATA.projects.find(p => p.Projekt_ID === d.projectId) : null;
    const projOpts = DATA.projects.map(p => ({ value: p.Projekt_ID, label: p.Projektbezeichnung, sub: p.Standort, svg: I.scene(p.Untergrund === 'Unbefestigt' ? 'ground_unpaved' : 'ground_paved') }))
      .concat([{ value: 'LOKAL', label: 'Anderer Standort', sub: 'Name selbst eintragen', svg: I.scene('site_fence') }]);
    const proj1 = A.q('ort', 'projekt', 'Welcher Standort?', 'Die Standortdaten füllen Untergrund, Gewässer und Baugrube als Vorschlag vor.',
      U.choiceGroup({ name: 'projectId', bind: '@project', value: d.projectId, options: projOpts, label: 'Standort' }), null,
      proj ? html`<p class="hint">Aus den Standortdaten: ${[proj.Notfall_Treffpunkt && 'Treffpunkt im Notfall: ' + proj.Notfall_Treffpunkt, proj.Zufahrt && 'Zufahrt: ' + proj.Zufahrt].filter(Boolean).join('. ')}.</p>` : '');
    const local = d.projectId === 'LOKAL' ? A.q('ort', 'lokal', 'Wie heißt der Standort?', 'Zum Beispiel Name der Baustelle oder des Betriebshofs.', html`
      <div class="row2"><div class="field"><label for="f-local-name">Standortname</label><input id="f-local-name" type="text" maxlength="120" autocomplete="off" value="${d.local.name}" data-live="d.local.name"></div>
      <div class="field"><label for="f-local-contact">Ansprechperson Umwelt oder Arbeitsschutz (optional)</label><input id="f-local-contact" type="text" maxlength="120" autocomplete="off" value="${d.local.contact}" data-live="d.local.contact"></div></div>
      <p class="hint">Ohne Ansprechperson bleibt der Punkt „Standortbezogener Kontakt fehlt“ im Ergebnis offen.</p>`) : '';
    const loc = A.q('ort', 'ort-genau', 'Wo genau findet der Einsatz statt?', 'Tippen Sie auf einen Vorschlag oder schreiben Sie selbst.', html`
      <div class="chips" style="margin-bottom:10px">${C.locationChips.map(l => html`<button type="button" class="chipbtn chipbtn--btn" data-act="loc-chip" data-value="${l}" aria-pressed="${d.locText === l ? 'true' : 'false'}">${l}</button>`)}</div>
      <div class="field"><label for="f-loc">Einsatzstelle</label><input id="f-loc" type="text" maxlength="160" autocomplete="off" value="${d.locText}" data-live="d.locText"></div>`);
    const zeit = A.q('ort', 'zeit', 'Wann?', 'Beginn und Ende des Einsatzes.', html`
      <div class="row2"><div class="field"><label for="f-start">Beginn</label><input id="f-start" type="date" value="${d.start}" data-live="d.start"></div>
      <div class="field"><label for="f-end">Ende</label><input id="f-end" type="date" value="${d.end}" data-live="d.end"></div></div>`);
    const who = A.q('ort', 'ersteller', 'Wer macht die Angaben?', 'Der Name erscheint auf der Ergebnisseite und bleibt auf diesem Gerät.', html`
      <div class="field"><label for="f-creator">Name</label><input id="f-creator" type="text" maxlength="120" autocomplete="name" value="${d.creator}" data-live="d.creator"></div>`, 'vorab');
    return A.tafel('ort', html`${proj1}${local}${loc}${zeit}${who}`);
  };
  A.binders.project = function (el) {
    const id = el.value;
    S.d.projectId = id; S.d.prefilled = {};
    const p = DATA.projects.find(x => x.Projekt_ID === id);
    if (p) {
      [['ground', 'ground', p.Untergrund], ['water', 'water', p.Gewaesserbezug], ['excavation', 'excavation', p.Baugrube]].forEach(([field, list, val]) => {
        if (val && DATA.lists[list].includes(val) && val !== 'Unklar') { S.d[field] = val; S.d.prefilled[field] = true; }
      });
    }
    A.save(); A.render();
  };
  A.actions['loc-chip'] = el => { S.d.locText = el.dataset.value; A.save(); A.render(); };

  // ---------- Umgebung ----------
  A.views.umgebung = function () {
    const proj = A.project();
    const dh = proj && proj.Entwaesserungsbeschreibung ? html`<p class="hint">Aus den Standortdaten: ${proj.Entwaesserungsbeschreibung}.</p>` : '';
    const rh = proj && proj.Rueckhaltemoeglichkeit ? html`<p class="hint">Aus den Standortdaten: ${proj.Rueckhaltemoeglichkeit}.</p>` : '';
    const barriers = A.q('umgebung', 'barriers', 'Welche Schutzbarrieren stehen vor Ort?', 'Mehrere sind möglich. Nur auswählen, was schon steht.', html`
      ${U.chipGroup({ type: 'checkbox', name: 'barrier', bind: '@barrier', items: C.barrierChips.map(b => ({ id: b.id, label: b.label, checked: S.d.barriers.includes(b.id) })).concat([{ id: 'keine', label: 'Keine', checked: S.d.barriers.includes('keine') }]) })}
      <div class="field" style="margin-top:10px"><label for="f-bother">Weitere Schutzbarriere (optional)</label><input id="f-bother" type="text" maxlength="120" autocomplete="off" value="${S.d.barrierOther}" data-live="d.barrierOther"></div>`, 'barrieren');
    return A.tafel('umgebung', html`
      ${choiceQ('umgebung', 'ground', 'ground', 'd.ground')}
      ${choiceQ('umgebung', 'drainage', 'drainage', 'd.drainage', dh)}
      ${choiceQ('umgebung', 'water', 'water', 'd.water')}
      ${choiceQ('umgebung', 'excavation', 'excavation', 'd.excavation')}
      ${choiceQ('umgebung', 'retention', 'retention', 'd.retention', rh)}
      ${barriers}`);
  };
  A.binders.barrier = function (el) {
    const id = el.value, set = new Set(S.d.barriers);
    if (el.checked) { if (id === 'keine') { set.clear(); S.d.barrierOther = ''; } else set.delete('keine'); set.add(id); } else set.delete(id);
    S.d.barriers = [...set]; A.save(); A.render();
  };

  // ---------- Tätigkeit ----------
  A.views.taetigkeit = function () {
    const acts = DATA.activities.filter(a => String(a.Aktiv).toLowerCase() !== 'nein');
    const act = A.q('taetigkeit', 'activityId', 'Welche Tätigkeit wird ausgeführt?', 'Die wichtigste Tätigkeit mit dem Stoff wählen.',
      U.choiceGroup({ name: 'activityId', bind: 'd.activityId', value: S.d.activityId, row: true, options: acts.map(a => ({ value: a.Taetigkeit_ID, label: a.Bezeichnung, sub: a.Beschreibung, svg: I.activity(a.Taetigkeit_ID) })), label: 'Tätigkeit' }));
    const units = DATA.lists.units.map(u => ({ id: u, label: (C.unitChoices.find(x => x.value === u) || {}).label || u, checked: S.d.unit === u }));
    const amount = A.q('taetigkeit', 'amount', 'Wie viel kommt zum Einsatz?', 'Menge, die gleichzeitig am Einsatzort bereitsteht oder verarbeitet wird.', html`
      <div class="field" style="max-width:260px"><label for="f-amount">Menge</label><input id="f-amount" type="number" inputmode="decimal" min="0" step="any" value="${S.d.amount}" data-live="d.amount"></div>`, 'menge');
    const unit = A.q('taetigkeit', 'unit', 'In welcher Einheit?', '', U.chipGroup({ type: 'radio', name: 'unit', bind: 'd.unit', items: units }));
    const qc = A.q('taetigkeit', 'quantityClass', C.questions.quantityClass.title, C.questions.quantityClass.help,
      U.choiceGroup({ name: 'quantityClass', bind: 'd.quantityClass', value: S.d.quantityClass, text: true, options: optionsFor('quantityClass', 'quantity_classes'), label: 'Mengenklasse' }));
    const cont = A.q('taetigkeit', 'container', 'In welchem Gebinde?', 'Das größte Gebinde bestimmt, wie viel auf einmal auslaufen kann.',
      U.choiceGroup({ name: 'container', bind: 'd.container', value: S.d.container, row: true, options: DATA.lists.containers.map(c => ({ value: c, label: C.containerLabels[c] || c, svg: I.container(c) })), label: 'Gebinde' }));
    return A.tafel('taetigkeit', html`${act}${amount}${unit}${qc}${cont}`);
  };

  // ---------- Ausrüstung ----------
  function equipCard(eq, need) {
    const id = eq.Ausruestung_ID, e = S.d.equip[id] || { answer: '', qty: 1, suit: '' };
    const miss = missingIds('ausruestung').includes('eq-' + id);
    const ans = (need ? C.equipmentAnswers : [{ value: 'da', label: 'Auch vorhanden' }]);
    const answerGroup = need ? html`<div class="chips" role="radiogroup" aria-label="${eq.Bezeichnung}">${ans.map(a => html`<label class="chipbtn"><input type="radio" name="eq-${id}" value="${a.value}" data-bind="@eqAnswer" data-eq="${id}" ${e.answer === a.value ? raw('checked') : ''}><span>${a.label}</span></label>`)}</div>`
      : html`<label class="chipbtn"><input type="checkbox" name="eq-${id}" value="da" data-bind="@eqOpt" data-eq="${id}" ${e.answer === 'da' ? raw('checked') : ''}><span>Ist vor Ort vorhanden</span></label>`;
    const detail = e.answer === 'da' ? html`
      <div class="sub-q"><b>Wie viele sind da?</b>
        <div class="stepper" style="margin:6px 0 10px"><button type="button" data-act="eq-qty" data-eq="${id}" data-delta="-1" aria-label="Eine weniger">−</button><output aria-live="polite">${e.qty}</output><button type="button" data-act="eq-qty" data-eq="${id}" data-delta="1" aria-label="Eine mehr">+</button></div>
        <b>Passt sie zum Stoff laut Sicherheitsdatenblatt?</b>
        <div class="chips" role="radiogroup" aria-label="Eignung ${eq.Bezeichnung}" style="margin-top:6px">${C.suitabilityAnswers.map(a => html`<label class="chipbtn"><input type="radio" name="suit-${id}" value="${a.value}" data-bind="@eqSuit" data-eq="${id}" ${e.suit === a.value ? raw('checked') : ''}><span>${a.label}</span></label>`)}</div>
      </div>` : '';
    return html`<div class="equip ${miss ? 'is-missing' : ''}" id="q-eq-${id}">
      <div class="equip__head">${raw(U.decorative(I.equipment(id)))}<div><b>${eq.Bezeichnung}</b><span class="muted small">${eq.Beschreibung}</span>
        ${need ? html`<br><span class="small">Gebraucht für: ${need.why.join('; ')}</span>` : ''}</div></div>
      ${answerGroup}${detail}
      ${miss ? html`<p class="q__err" style="display:block" role="alert">${e.answer === 'da' ? 'Bitte angeben, ob sie zum Stoff passt.' : 'Bitte angeben, ob die Ausrüstung da ist.'}</p>` : ''}
    </div>`;
  }
  A.views.ausruestung = function () {
    const need = A.neededEquipment();
    const eqs = DATA.equipment.filter(e => String(e.Aktiv).toLowerCase() !== 'nein');
    const needed = eqs.filter(e => need.has(e.Ausruestung_ID)), others = eqs.filter(e => !need.has(e.Ausruestung_ID));
    const body = html`
      ${needed.length ? html`<h3 class="group-title">Das braucht dieser Einsatz</h3>
        <p class="muted">Aus den zutreffenden Regeln und Maßnahmen. Fehlt etwas, bleibt der Einsatz gesperrt oder offen.</p>
        ${needed.map(e => equipCard(e, need.get(e.Ausruestung_ID)))}`
        : html`<p class="banner" role="note">${ico('info')}<span>Für diese Kombination ist keine bestimmte Ausrüstung hinterlegt. Tragen Sie ein, was vor Ort bereitliegt. Ist nichts davon vorhanden, bleibt „Notfallausrüstung erfasst“ offen und das Ergebnis weist darauf hin.</span></p>`}
      <details class="more" ${!needed.length || others.some(e => (S.d.equip[e.Ausruestung_ID] || {}).answer) ? raw('open') : ''}><summary>Weitere Ausrüstung am Standort</summary>
        ${others.map(e => equipCard(e, null))}
      </details>
      ${U.learnCard('ausruestung', { open: S.open, data: DATA })}`;
    return A.tafel('ausruestung', body);
  };
  const eqState = id => (S.d.equip[id] = S.d.equip[id] || { answer: '', qty: 1, suit: '' });
  A.binders.eqAnswer = el => { const e = eqState(el.dataset.eq); e.answer = el.value; if (el.value !== 'da') e.suit = ''; A.save(); A.render(); };
  A.binders.eqOpt = el => { const e = eqState(el.dataset.eq); e.answer = el.checked ? 'da' : ''; if (!el.checked) e.suit = ''; A.save(); A.render(); };
  A.binders.eqSuit = el => { eqState(el.dataset.eq).suit = el.value; A.save(); A.render(); };
  A.actions['eq-qty'] = el => { const e = eqState(el.dataset.eq); e.qty = Math.max(1, Math.min(99, e.qty + Number(el.dataset.delta))); A.save(); A.render(); };

  // ---------- Prüfen ----------
  A.views.pruefen = function () {
    const { res } = A.evaluate();
    const p = res.pflicht, d = S.d;
    const ch = A.currentSubstance(), act = DATA.activities.find(a => a.Taetigkeit_ID === d.activityId), proj = A.project();
    const lbl = (qid, v) => { const o = (C.questions[qid].options.find(x => x.value === v) || {}); return o.label || v || '–'; };
    const unclear = [['drainage', 'Entwässerung'], ['water', 'Gewässer'], ['excavation', 'Baugrube']].filter(([k]) => d[k] === 'Unklar').map(([, n]) => n);
    if (d.dangerousGoods === 'Zu pruefen') unclear.push('Gefahrgut');
    const list = html`<ul class="checklist">${p.checks.map(c => html`<li class="${c.ok ? 'ok' : 'open'}"><span class="tick">${c.ok ? ico('check') : '!'}</span><span>${c.label}${c.ok ? '' : html` <span class="muted small">(offen)</span>`}</span>
      ${c.ok ? '' : html`<button class="btn btn--sm" type="button" data-act="go" data-to="${C.pflichtGoto[c.id] || 'ort'}">Nachholen</button>`}</li>`)}</ul>`;
    const sum = html`<dl class="summary">
      <dt>Standort</dt><dd>${proj ? proj.Projektbezeichnung || 'noch nicht benannt' : '–'}</dd>
      <dt>Einsatzstelle</dt><dd>${A.locationText() || '–'}</dd>
      <dt>Stoff</dt><dd>${ch ? ch.name : '–'}</dd>
      <dt>Tätigkeit</dt><dd>${act ? act.Bezeichnung : '–'}</dd>
      <dt>Menge</dt><dd>${d.amount ? d.amount + ' ' + d.unit + (d.quantityClass ? ' (' + d.quantityClass + ')' : '') : '–'}${d.container ? ', ' + (C.containerLabels[d.container] || d.container) : ''}</dd>
      <dt>Untergrund</dt><dd>${d.ground || '–'}</dd>
      <dt>Einlauf/Kanal</dt><dd>${lbl('drainage', d.drainage)}</dd>
      <dt>Gewässer</dt><dd>${lbl('water', d.water)}</dd>
      <dt>Rückhaltung</dt><dd>${lbl('retention', d.retention)}</dd>
    </dl>`;
    const body = html`
      <h3 class="group-title">${p.progress} von ${p.total} Pflichtangaben erfüllt</h3>
      ${list}
      ${unclear.length ? html`<div class="banner" role="note">${ico('warn')}<div><b>Ungeklärt: ${unclear.join(', ')}.</b> Solange das offen ist, zeigt das Ergebnis höchstens „Angaben unvollständig“.</div></div>` : ''}
      <h3 class="group-title">Ihre Angaben</h3>${sum}
      ${p.complete && !unclear.length ? '' : html`<p class="hint">Sie können das Ergebnis auch mit offenen Punkten ansehen. Es sagt dann, was fehlt.</p>`}`;
    return A.tafel('pruefen', body);
  };

  // ---------- Aktionen ----------
  A.actions.go = el => A.go(el.dataset.to);
  A.actions.next = () => A.next();
  A.actions.back = () => A.back();
  A.actions.begin = () => { A.resetCase(); A.go('ort'); };
  A.actions['show-result'] = () => A.go('ergebnis');
  A.actions['clear-all'] = () => {
    if (!window.confirm('Alle gespeicherten Eingaben und eingelesenen Stoffe auf diesem Gerät löschen?')) return;
    A.clearAll(); A.render({ focusHeading: true }); A.toast('Gelöscht.');
  };
})();
