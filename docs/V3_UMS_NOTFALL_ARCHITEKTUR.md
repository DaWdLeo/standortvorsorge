# V3 – Architekturziel: standortbezogenes Havarie- und Notfallmanagement

**Status: Zielkonzept, NICHT umgesetzt oder fachlich freigegeben.**

## Leitidee
Eine **Standortakte** bündelt gemeinsame, versionierte Informationen (Baustellenadresse, Schutzgüter, Entwässerung/Ableitungsziel, BE-Plan mit Ort-IDs, Notfallausrüstung, Rollen/Vertretung, freigegebene Alarmunterlagen). Darunter stehen **beliebig viele eindeutig identifizierte Prüffälle**, nicht nur ein Durchlauf.

Jeder Prüffall beschreibt Standortbezug + Arbeitsbereich/Ort-ID + Stoff + Tätigkeit + Menge/Einheit + Gebinde + relevante Umweltbedingungen/Barrieren und hält seinen eigenen Bewertungsstand, Maßnahmennachweis und Versionsverlauf. Gleiche Stoff-Tätigkeits-Paare können mehrere Fälle bilden; eindeutige Fall-ID unabhängig von diesen Attributen.

## Entitäten und Beziehungen
- `Site`: ID, Stammdaten, versionierter BE-Plan, Ansprechpartner-Funktionen, geprüfter Stand.
- `ScenarioCase`: ID, siteId, substanceId, activityId, locationId, Mengen/Umweltkriterien, Prüfgrund, Version.
- `AssessmentSnapshot`: caseId, Input-/Regel-/Quellenversion, Engineversion, Zeitpunkt, eindeutiger Hash, Treffer, Blockaden, vollständiger Ergebnisstand.
- `MeasureAssignment`: caseId, ruleId, measureId, Voraussetzungen, Verantwortung, Nachweis, Status, spätere Wirksamkeitsprüfung; Wiederverwendung gemeinsamer Standortmaßnahmen nur mit explizitem Geltungsbereich.
- `ApprovalDecision`: Fall-Snapshot-ID, geprüfter Geltungsbereich, befugte Funktion, Entscheidung, Datum, gegebenenfalls Befristung; Entwurf/Prüfung/Freigabe klar getrennt.
- `EmergencyDocument`: siteId, versioniertes freigegebenes Dokument, Verfügbarkeit, fachliche Gültigkeit, Zugriff im Netz-/Geräteausfall.
- `ReviewEvent`: Änderung, Ereignis, Übung, Unterweisung, erneute Beurteilung, Versionierung und nachvollziehbarer Abschluss.

## Prozess
1. Standortakte und Mindestdatensatz prüfen.
2. Prüffälle erfassen/importieren; Kombinationen und Geltungsbereiche explizit führen.
3. Jeden Fall isoliert, sicherheitsgerichtet mit gültigen Regelversionen bewerten.
4. Maßnahmen und Nachweise nachhalten; Sperren können nicht durch formale Vollständigkeit übersteuert werden.
5. Fachprüfung und Berechtigungsprüfung mit unveränderlichem Snapshot; Freigabe **nur durch autorisierte Rolle**.
6. Freigegebene Standort-Notfallunterlagen aus gültigen Ständen zusammenstellen, nicht ungeprüfte Fälle still integrieren.
7. Bei Stoff-, Tätigkeits-, Standort-, Mengen- oder Regel-/Dokumentänderungen Review-Trigger und gegebenenfalls Entzug/Neubewertung auslösen.
8. Ereignisse, Übungen und Unterweisungen dokumentieren, Wirksamkeit überprüfen und Prozesse weiterentwickeln.

## ISO-14001-Orientierung
Insbesondere Abschnitt 8.2 (Notfallvorsorge und Gefahrenabwehr), daneben Umweltaspekte, bindende Verpflichtungen, dokumentierte Information, Kompetenz und fortlaufende Verbesserung. **Die ISO 14001 fordert nicht pauschal für jedes denkbare Tripel eine gesonderte Freigabeurkunde.** Die granularen Prüffälle sind ein gewählter, prüfbarer Implementierungsansatz, dessen Geltungsbereich fachlich festzulegen ist.

## Nicht verhandelbare Anforderungen
Kein zweites ungelenktes Stoffkataster; vorhandene Fachquellen referenzieren. Keine erfundenen Litergrenzen, Schwellen, Maßnahmen, Genehmigungen oder Alarmkontakte. Reale Projekt-/Stoffdaten nie ins öffentliche Pages-Repository. App ist niemals alleinige Notfallquelle. Freigabedaten niemals automatisch aus erfassten Formularen ableiten.

## V3-Abnahmekriterien (noch offen)
- Mehrere Prüffälle je Standort, getrennte Daten-, Maßnahme- und Freigabestände.
- Wiederverwendung gemeinsamer Standortdaten ohne gegenseitiges Überschreiben.
- Rollen und Befugnisse nachweisbar, revisionssichere Historie, Freigabesnapshot nur durch autorisierte Fachfunktion.
- Ungültige/unbekannte Angaben und aktive Sperren führen nicht zu einer Freigabe.
- Versionierte Standort-Notfallunterlagen einschließlich Notfallkontakten, Offline-/Papier-Fallback und Tests.
- Unterweisung, Übung, Ereignisauswertung, Nachunternehmer-Schnittstellen und Wirksamkeitskontrolle dokumentierbar.
- Datenschutz, Informationssicherheit, Rechte, Betriebsprozess und fachliche ISO-14001-Konformität gesondert geprüft.

**V3 ist ausdrücklich eine neue Ausbauphase, kein Versprechen eines allein durch Software erreichbaren ISO-Zertifikats.**
