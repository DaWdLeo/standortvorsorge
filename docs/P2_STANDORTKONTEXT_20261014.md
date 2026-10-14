# P2-Erweiterung – Standortnachweise und Szenario-Sichtung
Stand: 14.10.2026

## Änderungen
- Neue ergänzende, **nicht bewertungswirksame** Felder für Ort-ID, BE-/Lageplan-ID und Revision, Entwässerungsziel, Schutzgebiets-/Überflutungsbezug, Altlasten, Grundwasser/Erlaubnisreferenz, Ausrüstungsstandort und vertretende Funktion.
- Optionaler Mehrfach-Check für **zu prüfende**, nicht freigegebene Szenarien aus dem bestehenden Beispielkatalog. Kein automatischer Szenariotreffer.
- Ergänzende Angaben sind lokal in `havarie.pages.v1` gespeichert und durch `sanitizeDraft` begrenzt.
- Vorab-Prüfprotokoll zeigt Kontextreferenzen als **ungeprüft** und separiert von den für die Excel-Auswertung entscheidenden Fragen.
- Standortkontext-Fortschritt wird getrennt von Pflichtstatus und fachlichem Freigabestatus ausgewiesen.
- Regressionstests in `assistent-v2/tests/p2-site.test.js`; CI führt P1- und P2-Tests aus.

## Unverändert / offen
- `engine.js`, `regelwerk.json`, `dataEff()` und `buildDraft()` bleiben fachlich unverändert. Neue Felder lösen **keine** Regel aus.
- Kein Rollen-/Rechtemodell, keine Freigabe, keine revisionsfeste Historie, keine verifizierte Standortakte, keine Offline-Notfallunterlagen.
- Quellen, Feld-Wertelisten, tatsächliche Mindestpflichtangaben sowie Kategorien der standortbezogenen Risiken müssen durch Fachadministration bestätigt werden.
- Lokale Speicherung in der **öffentlichen Demo** ist nicht für reale vertrauliche Standortdaten geeignet.
- Kein abgeschlossener End-to-End-Gerätetest; PDF-A4-Test auf 1/5/10 Seiten steht aus.

## Abnahmebedingungen
- Feldwerte bleiben bei Stationswechsel und Reload erhalten.
- Ungültige Mengen/Einheiten bleiben durch M01 fail-closed.
- Ausgewählte Szenarien sind niemals fachlich bestätigt, verändern weder Regelhits noch operative Maßnahmen.
- Druckansicht und Textumbrüche auf Smartphone/Tablet sowie im A4-Druck kontrollieren.
