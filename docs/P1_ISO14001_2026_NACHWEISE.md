# P1-Maßnahmen – Havarie-Assistent / ISO 14001:2026

Stand: 14.10.2026. **ISO 14001:2026 ist laut Auftraggeber verbindliche Unternehmensnormausgabe.**
Prüffokus: Notfallvorsorge und Gefahrenabwehr nach Kapitel 8.2, mit Schnittstellen zu betrieblichen Prozessen. **Keine Aussage einer ISO-Zertifizierungsreife aus Code allein.**

## In diesem Änderungspaket technisch behoben
- M01: `engine.validateInput` prüft Menge auf endlich und > 0, Einheit/Mengenklasse/Gebinde gegen die aus dem Master exportierten Listen. `complete`, Pflichtfortschritt und `overall_status` werden bei ungültigen Werten konservativ zurückgesetzt. Kein Mengenumrechnen.
- M01: Formular nutzt dieselbe Prüf-Funktion. Exakt unterstützte Einheiten: `l, kg, m3, Stk, t`. `ml` und `m³` sind **ohne Stammdatenänderung nicht zulässig**; bewusst keine stillschweigende Umrechnung.
- M03: `MK01`-Fallback ohne Regelbezug entfernt. Bei Beispieldaten/ungeprüften Meldekriterien erscheint ein Hinweis zur fachlichen Prüfung anstelle operativer Meldeanweisungen.
- M02: Die öffentliche Ergebnisansicht und ihre PDF-Druckdarstellung verbergen beispielhafte Maßnahmen als einsatzfähige Handlungsanweisungen. Die generischen Notfallaktionen aus dem Demo-Datensatz werden nicht mehr operativ angezeigt.
- Automatisierte P1-Regressionstests in `assistent-v2/tests/p1-safety.test.js` (ungültige Menge, nicht vorhandene Einheiten, Regelausgabe ohne künstliche MK01-Zuordnung).

## P1-Nachweise, die ausdrücklich noch fehlen
1. **B07 – Berechtigte Freigabe:** Authentifizierung/Autorisierung und organisatorischer Prüf-/Freigabe-Workflow auf einer geschützten Infrastruktur. GitHub Pages kann keine berechtigte Benutzerfreigabe nachweisen. **Nicht als bestanden bewertet.**
2. **B08 – Änderungslenkung:** Unveränderliche Versionssnapshots, Änderungsprotokoll, Sperr-/Revisionsregeln bei Datenänderung, Freigabedatum und fachlicher Owner. **Nicht umgesetzt.**
3. **B09 – Alarmketten:** Fachlich benannte und geprüfte Standortkontakte, Vertretung, Prüfpflicht für Meldungen und Genehmigungs-/Rechtsbezug. **Nicht vorliegend.**
4. **B11 – Ausfallsicherheit:** Kontrollierter Offline-/Papier-Fallback mit Version, Gültigkeit, Standort, Zugriffsnachweis und Übungstest. **Nicht umgesetzt.**
5. **T03 – Vertraulichkeit:** Öffentliches Repository ist ungeeignet für private Projekt- und Gefahrstoffdaten. Geschützte Datenquelle und Rechtekonzept erforderlich. **Nicht umgesetzt.**
6. **N01 – organisatorischer Notfallprozess:** Geprüfte Alarm-/Eskalationsverfahren, Übungen, Unterweisungen, tatsächliche Zuständigkeiten und Maßnahmenwirksamkeit werden außerhalb des Codes nachgewiesen. **Nicht geprüft.**

## Abnahmekriterien vor operativem Pilot
- QA: Unbekannte, negative, nichtnumerische Mengen und nicht erlaubte Einheiten ergeben ausnahmslos *nicht bewertbar*.
- Fachadministration: Nur nachvollziehbar freigegebene und aktuell gültige Regel-/Maßnahmen-/Meldeinhalte mit Quelle, Version, zuständiger Funktion und Datenstand.
- IT/IMS: Berechtigungs-Test (nicht berechtigte Rolle kann keine Freigabe erzeugen), unveränderlicher freigegebener Snapshot, Revision nach Datenänderung.
- Baustellenorganisation/HSE: Aktuelle Notfallkontakte und verifizierter Ausfall-Fallback, Standortszenarien und Übungen dokumentiert.
- Testumgebung: Gerätetests Smartphone / Homarr / Desktop, PDF-Langtext / Seitenumbruch, Netztrennung und unberechtigte Freigabe.

**Status:** P1-Validierung und Demonstrator-Anzeige abgesichert. Die App ist weiterhin ein nicht-operativer Demonstrator, keine freigegebene Notfallquelle.
