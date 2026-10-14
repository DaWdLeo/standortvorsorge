# V3 – Arbeitsstand, zweistufige Umsetzung

## Schritt 1: Neue Seite und Demonstrationsablauf (dieser Branch)
- Eigenständiger, aus V2 kopierter V3-Code unter `assistent-v3/`, ohne die finalisierte V2 zu verändern.
- Hauptnavigation: **Arbeitsstand** unmittelbar nach **Übersicht**, auf Desktop und Smartphone.
- Drei fiktive Prüffälle ES-01 bis ES-03. Aggregierte, **getrennte** Anzeigen für Erfassung (anfangs 2/3), *beispielhafte* Maßnahmenabdeckung (anfangs 1/3, nicht fachlich bestätigt) und Freigabe (stets 0/3).
- Der **Umfang der Einsatzliste** ist ausdrücklich **ungeprüft**. Diese Prüfung ist unabhängig von Einzelstatus und kann durch die Demo nicht bestätigt werden.
- Fallauswahl per Klick öffnet Angaben, fehlende Daten, nächsten Arbeitsschritt und zuständige Funktion. ES-02 bietet eine ergänzende, ausdrücklich ungeprüfte Beispielangabe zu D02.
- Ergänzen bei ES-02 erhöht den Demo-Erfassungsfortschritt auf 3/3; Maßnahmenabdeckung, Umfangsprüfung und Freigabe bleiben offen.
- Nur Beispieldaten, lokal gespeichert in `havarie.v3.arbeitsstand.sample.v1`. Das vorhandene V3-Wizardformular speichert getrennt in `havarie.v3.pilot.singlecase.v1`; der V2-Key `havarie.pages.v1` wird nicht verändert.
- Kein generierter realer Havarieplan, keine operative Notfallanweisung, keine Freigabefunktion.

## Schritt 2: Erst nach Fach- und Datenschemaentscheidung
- Echte, identifizierte **Standortakten** und beliebig viele **Einsatzsituationen**; Stoff × Tätigkeit × Arbeitsbereich, Menge, Gebinde, Umweltbedingungen können mehrere verschiedene Fälle erzeugen.
- Gemeinsame Standortinformationen wiederverwenden; pro Fall eigene Version, Vollständigkeit, Regelbewertung, Prüfbedarf, Maßnahmenzuordnung und Nachweise.
- Übersicht aus **berechneten realen Zuständen** (nicht aus Beispieldaten) erzeugen und den Umfang der Einsatzliste durch dafür berechtigte Funktion gesondert bestätigen lassen.
- Änderungen an einzelnen Angaben können weitere Fachprüfung und Revisionsbedarf auslösen.
- Wirksamer, rollenbasierter Freigabeprozess erst auf geschützter Infrastruktur mit unveränderlichem Snapshot; keine automatische Freigabe nach 100 % Erfassung.
- Zentraler, autorisierter Dokumentenstand, Kontaktdaten und Offline-/Papier-Fallback für die tatsächliche Notfallvorsorge nach ISO 14001, insbesondere 8.2.

## Abnahmekriterien dieses Schritts
1. Navigation Arbeitsstand in V3 Desktop/Mobil erreichbar.
2. ES-02 kann ergänzt und zurückgesetzt werden, separater Erfassungsfortschritt stimmt.
3. Andere Dimensionen bleiben trotz 100 % Erfassung unverändert offen.
4. Kein unbegründeter Freigabestatus, keine erfundenen operativen Maßnahmen.
5. Mobile Darstellung ohne horizontalen Überlauf; V2 bleibt unverändert.
6. Chromium-GitHub-Tests erfolgreich vor einer Veröffentlichung nach `main`.

**Pilotfreigabe für echte Gefahrstoff-/Standortdaten ist ausdrücklich nicht erteilt.**
