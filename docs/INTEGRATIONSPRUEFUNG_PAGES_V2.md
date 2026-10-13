# Integrationsprüfung – Havarie-Assistent Pages v2

Stand: 14.10.2026 · Status: **vorbereitet, nicht veröffentlicht**

## Eingangsstand
Quelle: `Havarie_Assistent_Webfrontend_D2_Pages_neutral.zip` (neutrale Veröffentlichungsfassung).

Der neue Quellstand enthält zwei verschiedene Laufwege:
- **GitHub Pages:** `docs/` mit vollständig statischer Browser-App, `assets/js/engine.js` als Nachbildung des Excel-Rechenkerns, `data/regelwerk.json` und `.js` als Exporte.
- **Windows/Excel D2:** `app.py`, `data/Havarie_Assistent_MASTER_2_8.xlsx`, `templates/`, `static/` und Freigabe-/Dokumentprozesse. **Nicht** für öffentliche GitHub Pages geeignet.

## Verbindliche Integrationsentscheidung (Vorschlag)
- Repository bleibt `DaWdLeo/standortvorsorge`.
- Bestehende Root-Demo in `index.html` und aktuelle `assistent/`-Demo **nicht überschreiben**.
- Ausschließlich den **Inhalt** des neuen `docs/`-Ordners nach `assistent-v2/` übernehmen.
- Der `main`-Branch bleibt bis zur Abnahme unverändert.
- Nach späterer Veröffentlichung über GitHub Pages aus `main/(root)` ergibt sich die URL `https://dawdleo.github.io/standortvorsorge/assistent-v2/?embed=1`.
- Für Homarr später direkte URL als iFrame, alternativ Einbindung über den Workspace im separaten Repository `DaWdLeo/nextcloud-iframe`.

## Datenabgleich
- Das exportierte JSON ist als `example_data: true` und `BEISPIELDATEN – FACHLICH NICHT FREIGEGEBEN` gekennzeichnet.
- Inhalt: 8 Regeln, 15 Maßnahmen, 15 Regel-Maßnahmen-Zuordnungen, 7 Meldekriterien, 6 Stoffreferenzen, 11 Quellen.
- Direkte Prüfung der Excel-Masterdatei bestätigt die grundlegenden Blattüberschriften und Beispiel-IDs.
- Achtung: Aus dem **Beispielmaster** enthaltene Regeln und Maßnahmen besitzen teils bereits `Aktiv`/`Freigegeben`. Sie gelten dadurch **nicht als fachlich oder operativ freigegeben**.

## Prüfungen durchgeführt
- JavaScript der statischen Seite: `node --check` ohne Syntaxfehler.
- `node --test tests/web/test_kataster.js`: **11 von 11** Tests bestanden.
- In `docs/index.html` referenzierte lokale Stylesheets und Skripte sind vorhanden.
- Stichprobensuche im öffentlichen statischen Quellordner: keine offensichtlichen E-Mail-Adressen, privaten IP-Adressen, Tokens oder internen Firmennamen.
- ZIP-Paketintegrität geprüft.
- **Nicht erneut durchgeführt:** vollständiger E2E-Browsertest, Excel-/LibreOffice-Konformitätstests, echte GitHub-Pages-Auslieferung und Homarr-iFrame-Test. Lokale Browsernavigation wird in der Testumgebung blockiert.

## Fachliche Grenzen nach PROMPT_Regelentwicklung.md
- Neue `16_Regelmatrix`-Datensätze stets `Entwurf`; neue Maßnahmen/Meldekriterien ebenfalls ohne Freigabe.
- Keine erfundenen IDs, Grenzwerte, Maßnahmen oder Quellen. IDs gegen Tabellen 10/11/12/14/18 prüfen.
- Keine `Fachlich_geprueft`-Bestätigung, keine Freigabedaten, keine operativen Dokumente.
- Unklar/fehlende Pflichtangaben => unvollständig, Fachprüfung oder Stopp; nie Standardvorsorge als Auffanglösung.
- Regelentwicklung erst nach ausgefülltem Abschnitt 11 des Fachprompts; Testfälle nach Aktivierung hypothetisch berechnen.
- Die bestehenden Excel-Tabellenfenster (Regeln 8 und Zuordnungen 15) sind voll; Erweiterung der Tabellen/Listen/Formelbereiche separat erforderlich. Formeln nicht still ändern.

## Offen vor Veröffentlichung
1. Staging-Dateien auf den Vorbereitungsbranch übernehmen.
2. Vollständige Browser-/Mobil-/iFrame-Tests einschließlich Import, Unklar und LocalStorage durchführen.
3. Excel-Konformität im dafür vorgesehenen Testsystem wiederholen.
4. Änderungen prüfen, öffentliches Datenpaket freigeben und erst dann mit `main` zusammenführen.
5. Einbindung im Homarr-iFrame testen; nur fiktive Daten verwenden.

**Sicherheitsregel:** Keine nicht-öffentlichen Sicherheitsdatenblätter, Standorte, Betriebsdaten oder personenbezogenen Eingaben in GitHub Pages einchecken. GitHub Pages dient der öffentlichen Demonstration und ist keine operative Notfallquelle.
