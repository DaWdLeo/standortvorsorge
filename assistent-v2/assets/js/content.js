/*
 * Texte der Oberfläche: Stationen, Fragen, Lernkarten, Hilfetexte zu offenen Maßnahmen.
 * Reiner Inhalt, keine Logik. Änderungen hier verändern NICHT die Regelauswertung (die kommt aus data/regelwerk.js).
 * Allgemeine Hinweise ersetzen keine Betriebsanweisung, kein Sicherheitsdatenblatt und keine fachliche Freigabe.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HavarieContent = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const stations = [
    { id: 'ort', label: 'Ort', title: 'Wo findet der Einsatz statt?', lead: 'Standort wählen, Einsatzstelle benennen, Namen eintragen. Das dauert eine Minute.' },
    { id: 'umgebung', label: 'Umgebung', title: 'Was ist rund um die Einsatzstelle?', lead: 'Untergrund, Kanäle, Gewässer und Auffangmöglichkeiten bestimmen, wie weit sich ein Austritt ausbreiten kann.' },
    { id: 'stoff', label: 'Stoff', title: 'Welcher Gefahrstoff wird eingesetzt?', lead: 'Stoff aus der Liste wählen oder aus dem eigenen Gefahrstoffkataster einlesen.' },
    { id: 'taetigkeit', label: 'Tätigkeit', title: 'Was wird gemacht, und wie viel?', lead: 'Tätigkeit, Menge und Gebinde. Daraus ergibt sich, welche Regeln greifen.' },
    { id: 'ausruestung', label: 'Ausrüstung', title: 'Was liegt für den Ernstfall bereit?', lead: 'Für jede Ausrüstung: da und griffbereit, nicht da oder unklar. Ehrliche Antworten helfen mehr als gute.' },
    { id: 'pruefen', label: 'Prüfen', title: 'Alles dabei?', lead: 'Die acht Pflichtangaben auf einen Blick. Offene Punkte lassen sich direkt nachholen.' },
  ];

  // ---------- Fragen mit Auswahl ----------
  // scene = Bild aus icons.js, learn = Lernkarte, value = Wert für die Auswertung (entspricht den Listen im Excel-Master)
  const questions = {
    ground: {
      title: 'Worauf steht oder läuft der Stoff?', help: 'Gemeint ist die Fläche an der Einsatzstelle, nicht der ganze Hof.', learn: 'untergrund',
      options: [
        { value: 'Befestigt', label: 'Befestigt', sub: 'Asphalt, Beton, Pflaster', scene: 'ground_paved' },
        { value: 'Unbefestigt', label: 'Unbefestigt', sub: 'Erde, Schotter, Rasen', scene: 'ground_unpaved' },
        { value: 'Baugrube', label: 'Baugrube', sub: 'Vertiefung, Graben, Schacht', scene: 'ground_pit' },
      ],
    },
    drainage: {
      title: 'Gibt es Einläufe, Rinnen oder Schächte in der Nähe?', help: 'Dorthin könnte ein Austritt laufen. Gefälle beachten.', learn: 'entwaesserung',
      options: [
        { value: 'Ja', label: 'Ja', sub: 'Einlauf, Rinne oder Schacht erreichbar', scene: 'drain_yes' },
        { value: 'Nein', label: 'Nein', sub: 'Keiner in Reichweite', scene: 'drain_no' },
        { value: 'Unklar', label: 'Weiß ich nicht', sub: 'Wird als ungeklärt gewertet', scene: 'drain_unknown', unclear: true },
      ],
    },
    water: {
      title: 'Liegt ein Gewässer in der Nähe?', help: 'Bach, Graben, See, Teich oder Grundwasser-Messstelle zählen mit.', learn: 'gewaesser',
      options: [
        { value: 'Ja', label: 'Ja', sub: 'Gewässer in der Nähe', scene: 'water_yes' },
        { value: 'Nein', label: 'Nein', sub: 'Kein Gewässer in der Nähe', scene: 'water_no' },
        { value: 'Unklar', label: 'Weiß ich nicht', sub: 'Wird als ungeklärt gewertet', scene: 'water_unknown', unclear: true },
      ],
    },
    excavation: {
      title: 'Ist eine offene Baugrube in der Nähe?', help: 'Auch Gräben und Schächte, in die etwas hineinlaufen kann.', learn: 'baugrube',
      options: [
        { value: 'Ja', label: 'Ja', sub: 'Offene Baugrube in der Nähe', scene: 'pit_yes' },
        { value: 'Nein', label: 'Nein', sub: 'Keine offene Baugrube', scene: 'pit_no' },
        { value: 'Unklar', label: 'Weiß ich nicht', sub: 'Wird als ungeklärt gewertet', scene: 'pit_unknown', unclear: true },
      ],
    },
    retention: {
      title: 'Ist eine Auffangmöglichkeit vorhanden?', help: 'Auffangwanne, Rückhaltebecken oder dichte Aufstellfläche an der Einsatzstelle.', learn: 'rueckhaltung',
      options: [
        { value: 'Ja', label: 'Ja', sub: 'Auffangeinrichtung vorhanden', scene: 'hold_yes' },
        { value: 'Nein', label: 'Nein', sub: 'Keine Auffangeinrichtung', scene: 'hold_no' },
      ],
    },
    sdbConfirmed: {
      title: 'Liegt das aktuelle Sicherheitsdatenblatt (SDB) vor?', help: 'Mit „Ja“ bestätigen Sie, dass das passende SDB vorliegt und für diesen Einsatz gesichtet wurde.', learn: 'sdb',
      options: [
        { value: 'Ja', label: 'Ja, liegt vor', sub: 'Gesichtet für diesen Einsatz' },
        { value: 'Nein', label: 'Nein', sub: 'Fehlt oder nicht geprüft' },
      ],
    },
    dangerousGoods: {
      title: 'Ist der Stoff Gefahrgut (Transport auf öffentlichen Straßen)?', help: 'Hinweis steht im SDB, Abschnitt 14 (UN-Nummer). Im Zweifel „Weiß ich nicht“ wählen.', learn: 'gefahrgut',
      options: [
        { value: 'Nein', label: 'Nein', sub: 'Kein Gefahrgut' },
        { value: 'Ja', label: 'Ja', sub: 'Gefahrgut' },
        { value: 'Zu pruefen', label: 'Weiß ich nicht', sub: 'Fachprüfung anfordern', unclear: true },
      ],
    },
    quantityClass: {
      title: 'Welche Mengenklasse passt?', help: 'Die Grenzen legt der Betreiber fest, im Regelwerk sind sie nicht hinterlegt. Bei Unsicherheit die größere Klasse wählen: Das führt in der Regel zu mehr Vorsorge.', learn: 'menge',
      options: [
        { value: 'Klein', label: 'Klein', sub: 'z. B. ein Kanister' },
        { value: 'Mittel', label: 'Mittel', sub: 'z. B. ein Fass' },
        { value: 'Gross', label: 'Groß', sub: 'z. B. ein Container' },
      ],
    },
  };

  const locationChips = ['Tankplatz', 'Lagerfläche', 'Baustraße', 'Baugrube', 'Werkstatt oder Waschplatz', 'Container oder Depot', 'Anlieferung'];
  const barrierChips = [
    { id: 'wanne', label: 'Auffangwanne' },
    { id: 'abdeckung', label: 'Bodenabdeckung' },
    { id: 'kanal', label: 'Kanaleinläufe abgedeckt' },
    { id: 'absperrung', label: 'Absperrung' },
    { id: 'bindemittel', label: 'Bindemittel griffbereit' },
    { id: 'doppelwand', label: 'Doppelwandiges Gebinde' },
  ];
  const unitChoices = [
    { value: 'l', label: 'Liter' }, { value: 'kg', label: 'Kilogramm' }, { value: 'm3', label: 'Kubikmeter' },
    { value: 'Stk', label: 'Stück' }, { value: 't', label: 'Tonnen' },
  ];
  const containerLabels = { Fass: 'Fass', IBC: 'IBC-Container', Tank: 'Tank', Kanister: 'Kanister', Sack: 'Sack' };

  // Ausrüstung: Antworten (Zuordnung in app.js)
  const equipmentAnswers = [
    { value: 'da', label: 'Da und griffbereit' },
    { value: 'nicht', label: 'Nicht da' },
    { value: 'unklar', label: 'Weiß ich nicht' },
  ];
  const suitabilityAnswers = [
    { value: 'Ja', label: 'Ja, passt laut SDB' },
    { value: 'Nein', label: 'Nein' },
    { value: 'Unbekannt', label: 'Weiß ich nicht' },
  ];

  // ---------- Ergebnis ----------
  const verdicts = {
    stop: { tone: 'stop', sign: 'stop', title: 'Stopp: noch nicht freigabefähig', text: 'Mindestens eine Sperre ist aktiv. Erst klären, dann starten.' },
    fachpruefung: { tone: 'info', sign: 'info', title: 'Fachprüfung nötig', text: 'Die Angaben reichen für eine automatische Einschätzung nicht aus. Eine Fachfunktion muss prüfen.' },
    unvollstaendig: { tone: 'warn', sign: 'warn', title: 'Angaben unvollständig', text: 'Es fehlen Pflichtangaben oder Antworten sind ungeklärt. Bitte nachholen.' },
    massnahmen: { tone: 'warn', sign: 'warn', title: 'Maßnahmen offen vor der Freigabe', text: 'Es sind keine Sperren aktiv, aber offene Punkte müssen vor der Freigabe erledigt werden.' },
    bereit: { tone: 'info', sign: 'info', title: 'Fachlich freigabefähig: Freigabe steht aus', text: 'Nach den hinterlegten Regeln spricht nichts dagegen. Die Freigabe erteilt die zuständige Fachfunktion, nicht diese App.' },
  };
  const verdictNote = 'Vorab-Ergebnis. Diese App gibt nie frei. Die Freigabe erfolgt durch die zuständige Fachfunktion.';

  // Hilfetexte zu den offenen Maßnahmen (Master-ID -> was ist konkret zu tun, wohin springen)
  const omHelp = {
    OM01: { todo: 'SDB besorgen oder prüfen, dann bei „Stoff“ mit Ja bestätigen.', goto: 'stoff' },
    OM02: { todo: 'Stoff eindeutig bestimmen. Ist er nicht in den Stammdaten, geht er zur Fachprüfung an das Umweltmanagement.', goto: 'stoff' },
    OM03: { todo: 'Einlauf in der Nähe, aber keine Auffangmöglichkeit: Rückhaltung schaffen oder Einsatzstelle verlegen.', goto: 'umgebung' },
    OM04: { todo: 'Fehlende oder ungeklärte Notfallausrüstung bereitstellen und bei „Ausrüstung“ eintragen.', goto: 'ausruestung' },
    OM05: { todo: 'Für diese Kombination gibt es keine hinterlegte Regel. Fachliche Einzelfallprüfung anfordern.' },
    OM06: { todo: 'Zwei Regeln widersprechen sich. Fachprüfung anfordern.' },
    OM07: { todo: 'Gefahrgutbezug klären. Gefahrgutbeauftragte oder zuständige Funktion einbinden.', goto: 'stoff' },
    OM08: { todo: 'Für den Standort ist keine Ansprechperson Umwelt/HSE hinterlegt. Eintragen (eigener Standort) oder in den Stammdaten ergänzen lassen.', goto: 'ort' },
    OM09: { todo: 'Ausrüstung ist unvollständig, aber nicht sperrend. Trotzdem vor Beginn ergänzen.', goto: 'ausruestung' },
    OM10: { todo: 'Eine Pflichtmaßnahme ist fachlich noch nicht freigegeben. Das kann nur die Fachfunktion beheben.' },
    OM11: { todo: 'Gilt für Nachunternehmen. Stoff im Kataster klären lassen.' },
  };

  // Pflichtangaben -> Station, die den Punkt behebt
  const pflichtGoto = { pflichtfelder: 'ort', stoff: 'stoff', sdb: 'stoff', projekt: 'ort', standort: 'umgebung', barrieren: 'umgebung', ausruestung: 'ausruestung', gefahrgut: 'stoff' };

  // ---------- Lernkarten ----------
  // sign: { ghs:[codes] } | { scene:name } | { warn:'drop'|'bang' } ; list: Zeichenliste; links: weiterführende Quellen (nur Klick, kein Abruf beim Laden)
  const L = {
    vorab: {
      title: 'Was „Vorab-Ergebnis“ bedeutet', sign: { info: true },
      lead: 'Die App zeigt, was vor einem Einsatz noch fehlt. Sie erteilt keine Freigabe.',
      points: [
        'Die Auswertung folgt den hinterlegten Regeln. Bei Beispieldaten sind diese Regeln fachlich nicht freigegeben.',
        '„Weiß ich nicht“ führt zu mehr Prüfbedarf, nie zu weniger.',
        'Fehlt eine Angabe, wird sie nicht angenommen, sondern als offen gezeigt.',
        'Die Freigabe erteilt die zuständige Fachfunktion im Prüfblatt der Excel-Arbeitsmappe.',
      ],
      remember: 'Ein gutes Ergebnis hier ersetzt keine Unterweisung und keine Betriebsanweisung.',
    },
    ghs: {
      title: 'Gefahrenpiktogramme erkennen', sign: { list: true },
      lead: 'Die roten Rauten auf Gebinden zeigen auf einen Blick, wovor ein Stoff warnt.',
      list: [
        ['GHS01', 'Explosionsgefahr durch Stoß, Reibung, Feuer oder Wärme.'],
        ['GHS02', 'Kann sich leicht entzünden oder brennen. Zündquellen fernhalten.'],
        ['GHS03', 'Kann Brände fördern oder verstärken. Nicht neben brennbaren Stoffen lagern.'],
        ['GHS04', 'Gas unter Druck. Vor Erwärmung schützen, Flaschen sichern.'],
        ['GHS05', 'Verätzt Haut und Augen, kann Metalle angreifen.'],
        ['GHS06', 'Schon kleine Mengen können schwer schaden. Kontakt vermeiden.'],
        ['GHS07', 'Reizt Haut, Augen oder Atemwege, gesundheitsschädlich, kann Allergien auslösen.'],
        ['GHS08', 'Kann langfristig schädigen, etwa Organe, Erbgut oder Atemwege.'],
        ['GHS09', 'Schädlich für Gewässerorganismen. Nicht in Boden, Kanal oder Gewässer gelangen lassen.'],
      ],
      remember: 'Fehlt ein Zeichen, heißt das nicht automatisch „ungefährlich“. Das Sicherheitsdatenblatt entscheidet.',
      links: [{ label: 'GESTIS-Stoffdatenbank (Stoffinformationen)', href: 'https://gestis.dguv.de' }],
    },
    sdb: {
      title: 'Das Sicherheitsdatenblatt (SDB) lesen', sign: { ghs: ['GHS07'] },
      lead: 'Das SDB hat 16 Abschnitte. Für die Baustelle zählen vor allem diese:',
      points: [
        'Abschnitt 2: Mögliche Gefahren und Kennzeichnung.',
        'Abschnitt 5: Maßnahmen zur Brandbekämpfung.',
        'Abschnitt 6: Maßnahmen bei unbeabsichtigter Freisetzung, also bei einem Austritt.',
        'Abschnitt 7: Handhabung und Lagerung.',
        'Abschnitt 8: Persönliche Schutzausrüstung.',
        'Abschnitt 14: Angaben zum Transport, etwa die UN-Nummer.',
      ],
      remember: 'Das SDB muss zum Produkt und zur aktuellen Fassung passen. Alte Ausdrucke prüfen.',
    },
    wgk: {
      title: 'Wassergefährdungsklasse (WGK)', sign: { ghs: ['GHS09'] },
      lead: 'Die WGK sagt, wie stark ein Stoff Gewässer gefährden kann.',
      points: [
        'WGK 1: schwach wassergefährdend.',
        'WGK 2: deutlich wassergefährdend.',
        'WGK 3: stark wassergefährdend.',
        'Die Angabe steht meist im SDB, oft in Abschnitt 15.',
        'Je höher die Klasse, desto strenger sind die Anforderungen an Lagern und Umgang.',
      ],
      remember: 'Auslaufen verhindern ist besser als Aufräumen.',
      links: [{ label: 'Rigoletto: Datenbank des Umweltbundesamtes zu Wassergefährdungsklassen', href: 'https://webrigoletto.uba.de' }, { label: 'AwSV im Wortlaut', href: 'https://www.gesetze-im-internet.de/awsv/' }],
    },
    untergrund: {
      title: 'Untergrund: befestigt, unbefestigt, Baugrube', sign: { scene: 'ground_unpaved' },
      lead: 'Der Untergrund entscheidet, wohin ein Stoff zuerst gelangt.',
      points: [
        'Befestigt (Asphalt, Beton, Pflaster): Der Stoff bleibt zunächst oben, kann aber in Fugen, Risse und Einläufe laufen.',
        'Unbefestigt (Erde, Schotter, Rasen): Der Stoff versickert. Boden und Grundwasser können verunreinigt werden.',
        'Baugrube: Der Stoff sammelt sich in tiefen Stellen. Dämpfe können sich ebenfalls dort sammeln.',
      ],
      remember: 'Beurteilen Sie die Fläche, auf der der Stoff tatsächlich umgeht.',
    },
    entwaesserung: {
      title: 'Einläufe, Rinnen und Schächte', sign: { scene: 'drain_yes' },
      lead: 'Ein Austritt folgt dem Gefälle. Kanäle sind der schnellste Weg in die Umwelt.',
      points: [
        'Einläufe, Rinnen und Schächte in Reichweite zählen, auch wenn sie abgedeckt aussehen.',
        'Regenwasserkanäle führen häufig ungereinigt in ein Gewässer.',
        'Einlauf in der Nähe ohne Auffangmöglichkeit: In den hinterlegten Beispielregeln führt das zu einer Sperre.',
        'Bei „Weiß ich nicht“ vor Ort nachsehen. Bis dahin gilt die Frage als ungeklärt.',
      ],
      remember: 'Einlauf vor Beginn sichern, nicht erst im Ernstfall.',
    },
    gewaesser: {
      title: 'Gewässer in der Nähe', sign: { scene: 'water_yes' },
      lead: 'Gewässer reagieren empfindlich. Schon kleine Mengen Öl bilden einen Film.',
      points: [
        'Bäche, Gräben, Teiche und Seen zählen. Auch ein trockener Graben kann bei Regen Wasser führen.',
        'Auch ein Einlauf, der in ein Gewässer entwässert, schafft einen Gewässerbezug.',
        'Bei Gewässerbezug verlangen die hinterlegten Beispielregeln zusätzliche Vorsorge und im Ereignisfall eine Eskalationsprüfung.',
      ],
      remember: 'Im Zweifel nachfragen, wohin die Entwässerung der Baustelle führt.',
    },
    baugrube: {
      title: 'Baugrube und Gräben', sign: { scene: 'ground_pit' },
      lead: 'Tiefe Stellen fangen Flüssigkeiten und Dämpfe ein.',
      points: [
        'Flüssigkeiten laufen in die Baugrube und sind schwer zurückzuholen.',
        'Dämpfe schwerer als Luft sammeln sich unten. Nicht ohne Freigabe in die Grube steigen.',
        'Grundwasserkontakt in der Baugrube macht einen Austritt besonders kritisch.',
      ],
      remember: 'Gefahrstoffe nicht am Rand einer Baugrube abstellen oder umfüllen.',
    },
    rueckhaltung: {
      title: 'Auffangwanne und Rückhaltung', sign: { scene: 'hold_yes' },
      lead: 'Eine Auffangeinrichtung hält einen Austritt am Ort, bis er beseitigt ist.',
      points: [
        'Sie muss zum Gebinde und zum Stoff passen und dicht sein.',
        'Regenwasser in der Wanne nicht unkontrolliert ablassen.',
        'Die nötige Größe richtet sich nach Gebinde und Vorgaben. Die Betriebsanweisung nennt Details.',
        'Ohne Auffangmöglichkeit und mit Einlauf in der Nähe sperren die hinterlegten Beispielregeln den Einsatz.',
      ],
      remember: 'Rückhaltung ist die wichtigste Barriere. Sie wirkt ohne dass jemand eingreifen muss.',
    },
    barrieren: {
      title: 'Schutzbarrieren', sign: { warn: 'drop' },
      lead: 'Schutzbarrieren verhindern, dass ein Austritt Boden, Kanal oder Gewässer erreicht.',
      points: [
        'Auffangwanne, Bodenabdeckung, abgedeckte Einläufe, Absperrung.',
        'Wählen Sie nur, was tatsächlich vor Ort steht, nicht was geplant ist.',
        '„Keine“ ist eine gültige Antwort. Sie wird ehrlich gewertet.',
      ],
      remember: 'Eine Barriere zählt nur, wenn sie vor Beginn der Tätigkeit steht.',
    },
    gefahrgut: {
      title: 'Gefahrgut und Transport', sign: { warn: 'bang' },
      lead: 'Für Stoffe, die auf öffentlichen Straßen befördert werden, gelten zusätzliche Regeln (ADR).',
      points: [
        'Ob ein Stoff Gefahrgut ist, steht im SDB in Abschnitt 14 (UN-Nummer, Klasse, Verpackungsgruppe).',
        'Das betrifft vor allem Anlieferung, Abholung und Be- und Entladen.',
        'Im Zweifel „Weiß ich nicht“ wählen. Die App fordert dann eine Gefahrgut-Fachprüfung an.',
      ],
      remember: 'Gefahrgut nie nach Gefühl einschätzen.',
    },
    kataster: {
      title: 'Gefahrstoffkataster und Gefahrstoffverzeichnis', sign: { ghs: ['GHS07', 'GHS02'] },
      lead: 'Betriebe führen ein Verzeichnis ihrer Gefahrstoffe. Daraus lassen sich Stoffe hier schnell übernehmen.',
      points: [
        'Datei als CSV oder Excel (.xlsx) auswählen. Die Datei bleibt auf Ihrem Gerät und wird nicht hochgeladen.',
        'Die Spalten werden erkannt. Falsch erkannte Spalten lassen sich per Auswahl korrigieren.',
        'Stoffe, die in den Stammdaten stehen, werden mit den Regeln verknüpft.',
        'Stoffe, die dort fehlen, bleiben verwendbar, führen aber zu „Fachprüfung nötig“ und können als CSV für die Stammdaten exportiert werden.',
      ],
      remember: 'Nichts wird automatisch freigegeben. Neue Stoffe müssen fachlich in die Stammdaten aufgenommen werden.',
      links: [{ label: 'Gefahrstoffverordnung im Wortlaut', href: 'https://www.gesetze-im-internet.de/gefstoffv_2010/' }],
    },
    menge: {
      title: 'Menge, Mengenklasse und Gebinde', sign: { warn: 'drop' },
      lead: 'Die Menge bestimmt, wie viel im Ernstfall austreten könnte.',
      points: [
        'Menge ist das, was am Einsatzort gleichzeitig bereitsteht oder verarbeitet wird, nicht der Tagesbedarf der ganzen Baustelle.',
        'Die Mengenklasse legt der Betreiber fest. Zur Orientierung dienten in den Beispielfällen etwa 10 bis 50 Liter als klein, 200 Liter als mittel und 500 Liter als groß. Das sind keine Grenzwerte.',
        'Das größte Gebinde bestimmt, wie viel auf einmal auslaufen kann.',
      ],
      remember: 'Im Zweifel die größere Klasse wählen.',
    },
    ausruestung: {
      title: 'Notfallausrüstung: da, erreichbar, geeignet', sign: { warn: 'drop' },
      lead: 'Drei Prüfungen entscheiden, ob Ausrüstung im Ernstfall hilft.',
      points: [
        'Da: In ausreichender Menge am Einsatzort.',
        'Erreichbar: Griffbereit, nicht verstellt oder abgeschlossen.',
        'Geeignet: Passt zum Stoff. Bindemittel, Material und Schutzausrüstung sind stoffabhängig. Das SDB gibt Auskunft.',
        'Fehlt eine dieser Prüfungen, gilt die Ausrüstung als nicht einsatzfähig.',
      ],
      remember: 'Lieber „Weiß ich nicht“ als ein geratenes Ja.',
    },
    ersteSchritte: {
      title: 'Wenn etwas ausläuft: erste Schritte', sign: { stop: true },
      lead: 'Diese Reihenfolge stammt aus dem hinterlegten Regelwerk.',
      fromData: 'event.general_actions',
      remember: 'Bei Gefahr für Menschen zuerst den Notruf 112 wählen.',
    },
    meldung: {
      title: 'Wann und wem melden', sign: { warn: 'bang' },
      lead: 'Jedes relevante Ereignis wird intern gemeldet. Ob zusätzlich extern geprüft wird, hängt von Ort und Folgen ab.',
      points: [
        'Intern melden: Ort, Zeitpunkt, Stoff, geschätzte Menge, Ausbreitungsweg und Sofortmaßnahmen angeben.',
        'Bei Boden- oder Gewässerbezug und bei Kanälen sehen die hinterlegten Meldekriterien eine Eskalationsprüfung vor.',
        'Konkrete Ansprechpersonen und Fristen legt der Standort fest.',
      ],
      remember: 'Im Zweifel lieber einmal zu viel melden.',
    },
  };

  // Beispiel-Kataster (erfundene Daten, nur zum Ausprobieren des Imports)
  const exampleKatasterCsv = [
    'Produktname;Hersteller;Kataster-Nr;CAS;GHS;Signalwort;WGK;Aggregatzustand;SDB-Datum;Lagerort',
    'Diesel (Kraftstoff);Hersteller C (Beispiel);KAT-2201;68334-30-5;GHS02, GHS07, GHS08, GHS09;Gefahr;WGK 2;flüssig;2025-01-15;Tankplatz',
    'Hydrauliköl HLP 46;Hersteller D (Beispiel);KAT-2214;;;;WGK 1;flüssig;2024-11-02;Werkstatt',
    'Betonzusatzmittel Typ FM;Hersteller E (Beispiel);KAT-2260;;GHS05;Gefahr;WGK 1;flüssig;2025-03-10;Container',
    'Schalöl Spezial (Beispiel);Hersteller F (Beispiel);KAT-3101;;GHS07, GHS09;Achtung;WGK 2;flüssig;2025-05-20;Lagerfläche',
    'Kaltreiniger Typ K (Beispiel);Hersteller G (Beispiel);KAT-3102;;GHS02, GHS07;Gefahr;WGK 2;flüssig;2025-06-01;Werkstatt',
    'Acetylen (Beispiel);Hersteller H (Beispiel);KAT-3103;74-86-2;GHS02, GHS04;Gefahr;WGK nwg;gasförmig;2024-09-12;Depot',
  ].join('\n');

  return { stations, questions, locationChips, barrierChips, unitChoices, containerLabels, equipmentAnswers, suitabilityAnswers, verdicts, verdictNote, omHelp, pflichtGoto, learn: L, exampleKatasterCsv };
}));
