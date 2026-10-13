# Modern Industrial UI – Stand 14.10.2026

## Implementiert
- Responsiver Arbeitsbereich mit Seitenleiste (Desktop/Touchboard) und Fünf-Punkte-Bottom-Navigation (Smartphone): Übersicht, Standort, Gefahrstoffe, Vorsorge, Notfallplan.
- Die sechs bestehenden Fachstationen bleiben mit ihren alten IDs und Hash-Routen erreichbar; insbesondere Umgebung, Tätigkeit und Prüfen.
- Eine separate, schreibgeschützte Notfallplan-Ansicht ist jederzeit direkt anwählbar, ohne Formularpflicht. Sie zeigt vorhandene Beispielstandortdaten und fehlende geprüfte Dokumente **ausdrücklich** an.
- Persistente Statusleiste, kompakter bei Scrollen, ergänzend mit Standort sowie ungeprüftem Fachstatus.
- Design-Tokens, ruhige neutrale Farbtöne, Dark-Mode-Schalter, Karten, flächensparende Hierarchie und responsive Touchbereiche.
- Bestehender localStorage-Key `havarie.pages.v1` und sämtliche vorhandenen Regel- und Stammdaten bleiben unverändert.

## Grenzen
- Die bestehende Master-Engine verarbeitet einen Stoff und eine Tätigkeit je Vorgang. Das UI tut nicht so, als könnte es mehrere Stoffe gleichzeitig fachlich bewerten.
- Bereits vorhandene Mehrfachauswahl: Standortbarrieren, zusätzliche Ausrüstung, Katasterimport mit mehreren Stoffen. Eine echte Mehrstoff-Fallbewertung bleibt ein separates Daten-/Regelmodellprojekt.
- Alle Exportdaten sind **BEISPIELDATEN – FACHLICH NICHT FREIGEGEBEN**. Keine operative Notfallanweisung, keine Rechtsauskunft oder Einsatzfreigabe.
- Notfallkontakte und Angaben sind aus Beispielstammdaten übernommen, unbestätigt und ausdrücklich markiert. Keine Telefonnummern, Grenzwerte, Meldeschwellen oder Handlungsanweisungen erfunden.
- Neue Offline-Verfügbarkeit geprüfter Einsatzdokumente und abgesicherte Datenquellen sind noch nicht implementiert.
- WCAG 2.2 AA ist Ziel, eine vollständige assistive-technologische Zertifizierung ist nicht behauptet.

## Abnahme
1. Smartphone: Bottom-Navigation, Back-Verhalten, Suchfilter, keine horizontalen Überläufe, Sticky-Leiste.
2. Desktop: Seitenleiste, Tastaturbedienung, Fokusmarkierungen, Dark Mode.
3. Notfallansicht: sofort erreichbar, nicht autoritative Inhalte klar gekennzeichnet, keine erfundene Maßnahme.
4. Formulare: bestehende Stammdaten-/Kataster-Auswahl, Mehrfachbarrieren, Ausrüstungseignung, localStorage nach Refresh.
5. Technisch: node --check, UI-Smoke-Check, bestehende Regressionstests, idealerweise E2E in einem echten Browser.
