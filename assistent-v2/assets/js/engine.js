/*
 * Havarie-Assistent – Auswertung im Browser (Vorab-Bewertung)
 *
 * Diese Datei bildet die Berechnungsspalten des Excel-Masters nach. Die INHALTE (Regeln, Massnahmen, Stoffe,
 * Standorte) kommen unveraendert aus dem Master (tools/export_regelwerk.py -> data/regelwerk.json).
 * Jede Funktion nennt das Excel-Blatt/die Zelle, die sie abbildet. Die Uebereinstimmung wird mit
 * tools/conformance/ gegen die Excel-Berechnung geprueft (zufaellige Faelle, Excel-Formeln via LibreOffice).
 *
 * Wichtig:
 * - Diese Fassung kann NIE freigeben. Es gibt keine Pruefentscheidung ("manualDecision" ist nur fuer Tests).
 * - Fehlt eine freigaberelevante Angabe, wird sie nicht angenommen, sondern als offen/unvollstaendig ausgewiesen.
 * - Optionale Zusatzsperre "strictUnclear": Antworten "Unklar" lassen die Eingabe nicht zur Bewertung zu
 *   (nur verschaerfend, siehe ui_guard im Ergebnis).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HavarieEngine = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------- Hilfsfunktionen (Excel-Semantik) ----------
  const str = v => (v === null || v === undefined) ? '' : String(v);
  const eq = (a, b) => str(a).toLowerCase() === str(b).toLowerCase();         // Excel "=" ist nicht gross/klein-sensitiv
  const blank = v => str(v) === '';
  const wild = (ruleValue, caseValue) => blank(ruleValue) || eq(ruleValue, caseValue);  // OR($X="",$X=Fall)
  const num = v => (blank(v) ? NaN : Number(v));
  const contains = (hay, needle) => str(hay).toLowerCase().includes(needle.toLowerCase());  // SEARCH()
  const excelTrim = s => str(s).replace(/ +/g, ' ').replace(/^ | $/g, '');
  const isoToday = () => new Date().toISOString().slice(0, 10);
  const find = (rows, key, value) => rows.find(r => eq(r[key], value)) || null;

  const GROUP_B = 'B - Szenario-/stoffbezogen';
  const PLACEHOLDER = 'STANDORTBEZOGEN ZU ERGAENZEN';

  // P1: validation shared by the public UI and the rules engine.
  // Unknown values and invalid quantities are never treated as evidence of completeness.
  // No implicit mass/volume conversion and no hidden default unit.
  function validateInput(data, draft) {
    const d = draft || {}, lists = (data && data.lists) || {};
    const issues = [];
    function allowed(field, value, listName, label) {
      const values = lists[listName];
      if (!Array.isArray(values) || !values.some(v => str(v) === str(value))) {
        issues.push({ field, message: label + ' fehlt oder ist nicht in der freigegebenen Werteliste enthalten.' });
      }
    }
    const quantity = typeof d.amount === 'number' ? d.amount : Number(str(d.amount).trim().replace(',', '.'));
    if (blank(d.amount) || !Number.isFinite(quantity) || quantity <= 0) {
      issues.push({ field: 'amount', message: 'Die Menge muss eine endliche Zahl größer als 0 sein.' });
    }
    allowed('unit', d.unit, 'units', 'Einheit');
    allowed('quantityClass', d.quantityClass, 'quantity_classes', 'Mengenklasse');
    allowed('container', d.container, 'containers', 'Gebinde');
    return { valid: issues.length === 0, issues };
  }

  // ---------- 22_Einsatz_Ausruestung: Zeilenstatus (Q) und Sperre_aktiv (R) ----------
  function equipmentRow(row, einsatzId) {
    const id = str(row.equipment_id);
    const required = num(row.required_qty), available = num(row.available_qty);
    let status = '';
    if (!blank(einsatzId) && !blank(id)) {
      const eignung = str(row.suitability_confirmed);
      if (blank(eignung) || eq(eignung, 'Unbekannt')) status = 'Eignung ungeklaert';
      else if (!eq(eignung, 'Ja')) status = 'Eignung ungeklaert';
      else if (blank(row.available_qty) || available === 0 || eq(row.accessible, 'Nein')) status = 'Nicht vorhanden';
      else if (blank(row.required_qty)) status = 'Eignung ungeklaert';
      else if (available < required) status = 'Teilweise vorhanden';
      else status = 'Vollstaendig vorhanden';
    }
    const sperreAktiv = status === '' ? '' : ((eq(row.blocking_if_missing, 'Ja') && status !== 'Vollstaendig vorhanden') ? 'Ja' : 'Nein');
    return Object.assign({}, row, { Zeilenstatus: status, Sperre_aktiv: sperreAktiv });
  }

  // 30_Bewertung!F20: Ausruestungsstatus (1:n)
  function equipmentOverallStatus(rows) {
    if (rows.length === 0) return 'Nicht vorhanden';
    const has = s => rows.some(r => r.Zeilenstatus === s);
    if (has('Eignung ungeklaert')) return 'Eignung ungeklaert';
    if (has('Nicht vorhanden')) return 'Nicht vorhanden';
    if (has('Teilweise vorhanden')) return 'Teilweise vorhanden';
    return 'Vollstaendig vorhanden';
  }

  // 13_Massnahmen!V (Operativ_anzeigbar) und W (Anzeige_Sperrgrund)
  function measureOperational(m) {
    if (blank(m.Massnahme_ID)) return '';
    const freigegeben = eq(m.Freigabestatus, 'Freigegeben') || eq(m.Freigabestatus, 'Aktiv');
    if (!freigegeben) return 'Nein';
    if (eq(m.Massnahmengruppe, 'A - Allgemeine Ereignislogik')) return eq(m.Voraussetzungen_fachlich_bestaetigt, 'Ja') ? 'Ja' : 'Nein';
    const stoffOk = eq(m.Stoffeignung_bestaetigt, 'Ja') || eq(m.Stoffeignung_bestaetigt, 'Nicht erforderlich');
    const szenOk = !blank(m.Szenarioeignung) && !eq(m.Szenarioeignung, 'Fachlich zu klaeren');
    if (eq(m.Massnahmengruppe, GROUP_B) && stoffOk && szenOk && eq(m.Voraussetzungen_fachlich_bestaetigt, 'Ja')) return 'Ja';
    return 'Nein';
  }
  function measureBlockReason(m) {
    if (blank(m.Massnahme_ID)) return '';
    if (measureOperational(m) === 'Ja') return '';
    const freigegeben = eq(m.Freigabestatus, 'Freigegeben') || eq(m.Freigabestatus, 'Aktiv');
    if (!freigegeben) return 'Freigabestatus nicht Freigegeben/Aktiv';
    if (eq(m.Massnahmengruppe, GROUP_B)) {
      const stoffOk = eq(m.Stoffeignung_bestaetigt, 'Ja') || eq(m.Stoffeignung_bestaetigt, 'Nicht erforderlich');
      const szenOk = !blank(m.Szenarioeignung) && !eq(m.Szenarioeignung, 'Fachlich zu klaeren');
      return excelTrim((stoffOk ? '' : 'Stoffeignung nicht bestaetigt; ') + (szenOk ? '' : 'Szenarioeignung ungeklaert; ') +
        (eq(m.Voraussetzungen_fachlich_bestaetigt, 'Ja') ? '' : 'fachliche Voraussetzungen nicht bestaetigt'));
    }
    return 'fachliche Voraussetzungen nicht bestaetigt';
  }

  // ---------- Hauptfunktion ----------
  /**
   * @param data   Inhalt von regelwerk.json
   * @param draft  Eingaben: { projectId, substanceId, activityId, amount, unit, quantityClass, container,
   *                           dangerousGoods, sdbConfirmed, ground, drainage, water, excavation, retention,
   *                           barriers, location, creator, projectName?, productName?, activityName?,
   *                           equipment:[{equipment_id, required_qty, available_qty, accessible,
   *                           suitability_confirmed, blocking_if_missing, ...}] }
   * @param opts   { today:'YYYY-MM-DD', manualDecision:'', einsatzId:'ENTWURF', strictUnclear:false }
   */
  function evaluate(data, draft, opts) {
    opts = Object.assign({ today: isoToday(), manualDecision: '', einsatzId: 'ENTWURF', strictUnclear: false }, opts || {});
    const d = Object.assign({ equipment: [] }, draft);

    // --- Hilfswerte wie 30_Bewertung!F6:F21 ---
    const project = blank(d.projectId) ? null : find(data.projects, 'Projekt_ID', d.projectId);
    const stoff = blank(d.substanceId) ? null : find(data.substances, 'Stoffreferenz_ID', d.substanceId);
    const activity = blank(d.activityId) ? null : find(data.activities, 'Taetigkeit_ID', d.activityId);
    const F = {
      stoff: stoff ? str(stoff.Stoffreferenz_ID) : '',                       // F6 (C22)
      activity: activity ? str(activity.Taetigkeit_ID) : '',                 // F7 (C33)
      container: str(d.container),                                           // F8
      qclass: str(d.quantityClass),                                          // F9
      // Untergrund/Gewaesser/Baugrube: Abweichung (C42/C44/C46) sonst Standortvorschlag (C41/C43/C45)
      ground: !blank(d.ground) ? str(d.ground) : (project ? str(project.Untergrund) : ''),          // F10
      drainage: str(d.drainage),                                             // F11 (C48)
      water: !blank(d.water) ? str(d.water) : (project ? str(project.Gewaesserbezug) : ''),         // F12
      excavation: !blank(d.excavation) ? str(d.excavation) : (project ? str(project.Baugrube) : ''),// F13
      retention: str(d.retention),                                           // F14
      dangerous: str(d.dangerousGoods),                                      // F15
      sdb: str(d.sdbConfirmed),                                              // F16
      project: project ? str(project.Projekt_ID) : '',                       // F17 (C9)
      amount: d.amount, unit: str(d.unit),                                   // F18, F19
      barriers: str(d.barriers),                                             // F21 (C53)
    };
    const inputCheck = validateInput(data, d);
    const stoffName = stoff ? str(stoff.Produktname) : 'nicht identifiziert';     // G6
    const equipRows = (d.equipment || []).filter(e => !blank(e.equipment_id)).map(e => equipmentRow(e, opts.einsatzId));

    // --- 16_Regelmatrix!AE: Trifft_zu je Regel (Fenster RM_ID) ---
    const rules = data.rules.map((r, idx) => {
      const aktiv = eq(r.Status, 'Aktiv') || eq(r.Status, 'Freigegeben');
      const von = blank(r.Gueltig_Ab) || str(r.Gueltig_Ab) <= opts.today;
      const bis = blank(r.Gueltig_Bis) || str(r.Gueltig_Bis) >= opts.today;
      const datumOk = !(Array.isArray(r._date_invalid) && r._date_invalid.length);   // Gueltigkeitsdatum als Text/Formel: Regel wird nicht angewendet (sicherer als Excel)
      const hit = aktiv && datumOk && von && bis &&
        wild(r.Stoffreferenz_ID, F.stoff) && wild(r.Taetigkeit_ID, F.activity) && wild(r.Gebindeart, F.container) &&
        wild(r.Mengenklasse, F.qclass) && wild(r.Untergrund, F.ground) && wild(r.Entwaesserungsbezug, F.drainage) &&
        wild(r.Gewaesserbezug, F.water) && wild(r.Baugrube, F.excavation) && wild(r.Rueckhaltung_vorhanden, F.retention) &&
        wild(r.Gefahrgutbezug, F.dangerous);
      return Object.assign({ index: idx, hit }, r);
    });
    const hits = rules.filter(r => r.hit);                                    // 30_Bewertung!C14
    const hitCount = hits.length;
    const scenarioRefs = hits.filter(r => !blank(r.Szenario_ID)).length;      // C15
    const prios = hits.map(r => num(r.Prioritaet)).map(p => (isNaN(p) ? 0 : p));
    const maxPrio = prios.length ? Math.max.apply(null, prios) : 0;           // F23 (0 -> "")
    const topRule = maxPrio === 0 ? null : hits[prios.indexOf(maxPrio)];      // F24: erste Zeile mit Maximalwert
    const handlung = topRule ? str(topRule.Handlungskategorie) : 'kein Regeltreffer - Fachpruefung erforderlich'; // C19

    // --- 17_Regel_Massnahmen I..O ---
    const ruleById = id => rules.find(r => eq(r.Regel_ID, id)) || null;
    const measureById = id => find(data.measures, 'Massnahme_ID', id);
    let jCount = 0;
    const assignments = data.rule_measures.map((a, i) => {
      const rule = ruleById(a.Regel_ID);
      const I = !!(rule && rule.hit);
      const m = measureById(a.Massnahme_ID);
      const K = m ? measureOperational(m) : 'Nein';
      let L = '';
      if (!blank(a.Massnahme_ID)) {
        const req = m ? str(m.Erforderliche_Ausruestung) : '';
        if (req === '') L = 'Ja';
        else L = equipRows.some(e => eq(e.equipment_id, req) && e.Zeilenstatus === 'Vollstaendig vorhanden' && eq(e.suitability_confirmed, 'Ja')) ? 'Ja' : 'Nein';
      }
      return { a, I, K, L, m, i };
    });
    assignments.forEach((x, i) => {
      // J: erste Zuordnung je Massnahme unter den zutreffenden Regeln
      const same = assignments.slice(0, i + 1).filter(y => eq(y.a.Massnahme_ID, x.a.Massnahme_ID) && y.I).length;
      x.J = x.I && x.K === 'Ja' && x.L === 'Ja' && same === 1;
      x.M = blank(x.a.Massnahme_ID) ? '' : ((x.I && eq(x.a.Pflichtmassnahme, 'Ja') && x.m && eq(x.m.Massnahmengruppe, GROUP_B) && (x.K !== 'Ja' || x.L !== 'Ja')) ? 'Ja' : 'Nein');
      if (blank(x.a.Massnahme_ID)) x.N = '';
      else if (!x.I) x.N = '';
      else if (x.K !== 'Ja') x.N = x.m ? measureBlockReason(x.m) : 'Massnahme fachlich nicht operativ freigegeben';
      else if (x.L !== 'Ja') x.N = 'Erforderliche Ausruestung fuer Massnahme nicht vollstaendig/eignungsbestaetigt';
      else x.N = '';
      x.O = x.J ? ++jCount : '';
    });
    const derived = assignments.filter(x => x.J).map(x => ({                   // 32_Abgeleitete_Massnahmen
      rank: x.O, Reihenfolge: x.a.Reihenfolge, Massnahme_ID: str(x.a.Massnahme_ID),
      Massnahmenart: str(x.m && x.m.Massnahmenart), Titel: str(x.m && x.m.Titel), Freigegebener_Text: str(x.m && x.m.Freigegebener_Text),
      Einsatzgrenze: str(x.m && x.m.Einsatzgrenze), Verbot_Hinweis: str(x.m && x.m.Verbot_Hinweis),
      Erforderliche_Ausruestung: str(x.m && x.m.Erforderliche_Ausruestung), Erforderliche_Rolle: str(x.m && x.m.Erforderliche_Rolle),
      Quelle_ID: str(x.m && x.m.Quelle_ID), Massnahmenversion: str(x.m && x.m.Massnahmenversion),
      Ausloesende_Regel_ID: str(x.a.Regel_ID), Massnahmengruppe: str(x.m && x.m.Massnahmengruppe),
    }));
    const excluded = assignments.filter(x => x.I && !x.J && x.N !== '').map(x => ({
      Massnahme_ID: str(x.a.Massnahme_ID), Titel: str(x.m && x.m.Titel), Regel_ID: str(x.a.Regel_ID),
      Pflichtmassnahme: str(x.a.Pflichtmassnahme), Grund: x.N,
    }));
    const a7Blocks = assignments.filter(x => x.M === 'Ja').length;             // COUNTIF(17!M,"Ja")

    // --- 30_Bewertung: Gefahrgut (C43), Nachunternehmen (C37/C38), Review (C32) – fuer neue Entwuerfe ohne Datensatz ---
    const gefahrgutSperre = eq(F.dangerous, 'Nein') ? 'Nein' : 'Ja';          // C43 (Rueckfall ohne B7-Datensatz)
    const gefahrgutStatus = eq(F.dangerous, 'Nein') ? 'Nicht erforderlich'
      : (eq(F.dangerous, 'Ja') || eq(F.dangerous, 'Zu pruefen')) ? 'Gefahrgut-Fachpruefung erforderlich' : 'Gefahrgutbezug ungueltig / zu klaeren'; // C42
    const nuStatus = 'Nicht zutreffend', nuSperre = 'Nein';                   // C37, C38
    const reviewStatus = 'Keine Reviewbasis / Erstbewertung';                 // C32

    // --- 30_Bewertung!C22: Anzahl Sperren ---
    const ruleBlocks = hits.filter(r => eq(r.Sperre, 'Ja')).length;
    const equipBlocks = equipRows.filter(e => e.Sperre_aktiv === 'Ja').length;
    const blocks = ruleBlocks + equipBlocks + a7Blocks + (eq(nuSperre, 'Ja') ? 1 : 0) + (gefahrgutSperre === 'Ja' ? 1 : 0);
    const conflict = (hits.some(r => eq(r.Handlungskategorie, 'Standardvorsorge')) && blocks > 0) ? 1 : 0;   // C23

    // --- 33_Offene_Massnahmen: Status je OM ---
    const hseContact = project ? str(project.Umwelt_HSE_Kontakt) : '';
    const partial = ['Teilweise vorhanden', 'Nicht vorhanden', 'Eignung ungeklaert'];
    const omStatus = {
      OM01: !eq(F.sdb, 'Ja') ? 'Offen' : 'Erledigt',
      OM02: eq(stoffName, 'nicht identifiziert') ? 'Offen' : 'Erledigt',
      OM03: (eq(F.drainage, 'Ja') && !eq(F.retention, 'Ja')) ? 'Offen' : 'Erledigt',
      OM04: equipBlocks > 0 ? 'Offen' : 'Erledigt',
      OM05: hitCount === 0 ? 'Offen' : 'Erledigt',
      OM06: conflict === 1 ? 'Offen' : 'Erledigt',
      OM07: gefahrgutSperre === 'Ja' ? 'Offen' : 'Erledigt',
      OM08: eq(hseContact, PLACEHOLDER) ? 'Offen' : 'Erledigt',
      OM09: equipRows.filter(e => eq(e.blocking_if_missing, 'Nein') && partial.includes(e.Zeilenstatus)).length > 0 ? 'Offen' : 'Erledigt',
      OM10: a7Blocks > 0 ? 'Offen' : 'Erledigt',
      OM11: eq(nuSperre, 'Ja') ? 'Offen' : 'Erledigt',
    };
    const openMeasures = data.open_measures.map(o => {
      const status = omStatus[o.Offene_Massnahme_ID] || 'Offen';           // unbekannte ID -> fail-safe "Offen"
      return Object.assign({}, o, { Status: status, Unbekannte_Logik: !(o.Offene_Massnahme_ID in omStatus) });
    });
    const openCount = openMeasures.filter(o => o.Status === 'Offen').length;   // 33!C3 = 30_Bewertung!C17

    // --- 34_Pruefung_Freigabe ---
    const complete = !blank(F.stoff) && !blank(F.activity) && !blank(F.ground) && !eq(F.ground, 'Unbekannt') &&
      !blank(F.drainage) && !eq(F.drainage, 'Unbekannt') && !blank(F.water) && !eq(F.water, 'Unbekannt') &&
      !blank(F.excavation) && !eq(F.excavation, 'Unbekannt') && !blank(F.retention) && !eq(F.retention, 'Unklar') && !eq(F.retention, 'Unbekannt') &&
      !blank(F.project) && !blank(F.amount) && !blank(F.unit) && inputCheck.valid;                // C6 + fail-safe P1 validation
    const sperrgruende = (blocks > 0 || openMeasures.filter(o => Number(o._row) <= 16).some(o => eq(o.Sperrwirkung, 'Ja') && o.Status === 'Offen')) ? 1 : 0; // C7 (33!F7:F16)
    const fachpruefung = (hitCount === 0 || conflict === 1 || contains(handlung, 'Fachpruefung') || gefahrgutSperre === 'Ja') ? 'Ja' : 'Nein'; // C9
    const manual = str(opts.manualDecision);                                                         // C12
    const stoffFreigabe = stoff ? str(stoff.Freigabestatus) : '';
    let effective;                                                                                    // C18
    if (!complete) effective = 'Unvollstaendig / Nachbesserung erforderlich';
    else if (!eq(stoffFreigabe, 'Freigegeben')) effective = 'Fachpruefung erforderlich (Stoff nicht freigegeben)';
    else if (nuStatus === 'Stoffklaerung erforderlich') effective = 'Stoffklaerung erforderlich';
    else if (gefahrgutSperre === 'Ja') effective = 'Gefahrgut-Fachpruefung erforderlich';
    else if (reviewStatus === 'Ueberpruefung erforderlich') effective = 'Ueberpruefung erforderlich';
    else if (sperrgruende > 0) effective = 'Nicht freigabefaehig (Sperre aktiv - Pruefentscheidung wird NICHT uebersteuert)';
    else if (fachpruefung === 'Ja') effective = eq(manual, 'Freigegeben') ? 'Fachpruefung erforderlich (Freigabe trotz Fachpruefungsbedarf nicht zulaessig)' : manual;
    else effective = manual;

    // --- 30_Bewertung!C18 und 05_Ergebnis!C24 / F13 ---
    let capability = blocks > 0 ? 'Nicht freigabefaehig (Sperre aktiv)'
      : hitCount === 0 ? 'Fachpruefung erforderlich (kein Regeltreffer)' : 'Freigabefaehig (vorbehaltlich Pruefung)';
    let overall = blocks > 0 ? 'NICHT FREIGABEFAEHIG'
      : hitCount === 0 ? 'FACHPRUEFUNG ERFORDERLICH'
        : openCount > 0 ? 'MASSNAHMENBEDARF VOR FREIGABE'
          : eq(effective, 'Freigegeben') ? 'EINSATZ FREIGEGEBEN' : 'EINSATZ FACHLICH FREIGABEFAEHIG';
    let action;
    if (contains(effective, 'Stoffklaerung')) action = '1. Stoff eindeutig identifizieren / führende Stoffquelle prüfen.\n2. Sicherheitsdatenblatt bzw. Stofffreigabe klären.\n3. Bewertung anschließend erneut durchführen.';
    else if (contains(effective, 'Gefahrgut')) action = '1. Gefahrgut-Fachprüfung durch zuständige Funktion einholen.\n2. Qualifizierte Rückmeldung / Nachweis dokumentieren.\n3. Bis dahin keine operative Freigabe.';
    else if (blocks > 0) action = '1. Sperrende offene Maßnahmen bearbeiten.\n2. Nachweise / Schutzmaßnahmen vervollständigen.\n3. Erst danach erneut fachlich prüfen.';
    else if (hitCount === 0) action = '1. Kein Regeltreffer vorhanden.\n2. Fachliche Einzelfallprüfung durchführen.\n3. Regelwerk nur nach fachlicher Freigabe ergänzen.';
    else if (openCount > 0) action = '1. Offene nicht-sperrende Maßnahmen schließen.\n2. Nachweise vervollständigen.\n3. Fachprüfung / Freigabe durchführen.';
    else if (contains(effective, 'Ueberpruefung')) action = '1. Reviewgrund prüfen.\n2. Bewertung aktualisieren.\n3. Neuen belastbaren Freigabestand erzeugen.';
    else if (eq(effective, 'Freigegeben')) action = 'Einsatz ist freigegeben.\nMaßnahmenblatt und Ereignisansicht dürfen nur auf Basis dieses freigegebenen Stands genutzt werden.';
    else action = 'Fachprüfung in 34_Pruefung_Freigabe durchführen.';

    // --- 04_Eingabe: Pflichtangaben-Tracker (C61:C71) ---
    const pName = project ? str(project.Projektbezeichnung) : '';
    const prodName = stoff ? str(stoff.Produktname) : str(d.productName);
    const actName = activity ? str(activity.Bezeichnung) : str(d.activityName);
    const checks = [
      { id: 'pflichtfelder', label: 'Pflichtfelder vollständig', ok: !!(pName && prodName && actName && !blank(d.amount) && !blank(d.location) && !blank(d.creator) && inputCheck.valid) },
      { id: 'stoff', label: 'Stoff eindeutig identifiziert', ok: !blank(F.stoff) },
      { id: 'sdb', label: 'SDB vorhanden und bestätigt', ok: eq(F.sdb, 'Ja') },
      { id: 'projekt', label: 'Projektinformationen vollständig', ok: !!(pName && F.project) },
      { id: 'standort', label: 'Standortbedingungen vollständig', ok: !blank(F.ground) && !blank(F.water) && !blank(F.excavation) && !blank(F.drainage) },
      { id: 'barrieren', label: 'Schutzbarrieren bestätigt', ok: !blank(F.barriers) },
      { id: 'ausruestung', label: 'Notfallausrüstung erfasst', ok: equipRows.length > 0 },
      { id: 'gefahrgut', label: 'Gefahrgutbezug erfasst', ok: ['Nein', 'Ja', 'Zu pruefen'].some(x => eq(F.dangerous, x)) },
    ];
    const progress = checks.filter(c => c.ok).length;                                                  // C69

    // --- Zusatzsperre der Browser-Fassung (nur verschaerfend) ---
    const unclear = [];
    if (eq(F.drainage, 'Unklar')) unclear.push('Entwässerung');
    if (eq(F.water, 'Unklar')) unclear.push('Gewässerbezug');
    if (eq(F.excavation, 'Unklar')) unclear.push('Baugrube');
    if (eq(F.retention, 'Unklar')) unclear.push('Rückhaltung');
    if (eq(F.ground, 'Unklar')) unclear.push('Untergrund');
    const uiGuard = { active: (opts.strictUnclear && unclear.length > 0) || !inputCheck.valid, unclear, invalid_fields: inputCheck.issues };
    if (!inputCheck.valid) {
      effective = 'Unvollstaendig / ungueltige Menge oder Einheitenangaben';
      capability = 'Nicht bewertbar (ungueltige Eingaben)';
      overall = 'ANGABEN UNVOLLSTAENDIG';
      action = '1. Menge, Einheit, Mengenklasse und Gebinde korrigieren.\\n2. Erfassung erneut pruefen.\\n3. Keine Freigabe aus dieser Vorabbewertung ableiten.';
    }

    return {
      engine_version: '1.0',
      today: opts.today,
      inputs: F,
      substance: stoff, project, activity,
      rules: rules.map(r => ({ Regel_ID: r.Regel_ID, Regeltitel: r.Regeltitel, Prioritaet: r.Prioritaet, hit: r.hit, Szenario_ID: r.Szenario_ID,
        Handlungskategorie: r.Handlungskategorie, Sperre: r.Sperre, Fachpruefung: r.Fachpruefung, Meldekriterium_ID: r.Meldekriterium_ID, Quelle_ID: r.Quelle_ID, Status: r.Status })),
      rule_hits: hitCount, scenario_refs: scenarioRefs, top_rule: topRule ? topRule.Regel_ID : '',
      handlungskategorie: handlung,
      derived_measures: derived, excluded_measures: excluded, a7_blocks: a7Blocks,
      equipment: equipRows, equipment_status: equipmentOverallStatus(equipRows), equipment_blocks: equipBlocks,
      gefahrgut: { status: gefahrgutStatus, sperre: gefahrgutSperre },
      blocks, block_parts: { rules: ruleBlocks, equipment: equipBlocks, a7: a7Blocks, nachunternehmen: eq(nuSperre, 'Ja') ? 1 : 0, gefahrgut: gefahrgutSperre === 'Ja' ? 1 : 0 },
      conflict,
      open_measures: openMeasures, open_count: openCount,
      complete, sperrgruende_offen: sperrgruende, fachpruefung_erforderlich: fachpruefung,
      effective_status: effective, automatic_capability: capability, overall_status: overall, action,
      pflicht: { checks, progress, total: checks.length, complete: progress === checks.length },
      ui_guard: uiGuard, input_validation: inputCheck,
    };
  }

  return { evaluate, validateInput, equipmentRow, measureOperational, measureBlockReason };
}));
