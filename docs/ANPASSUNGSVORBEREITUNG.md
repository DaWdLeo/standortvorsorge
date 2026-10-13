# Anpassungsvorbereitung – Havarie-Assistent (GitHub Pages)
Stand: 13.10.2026

## Zweck
Die aus dem ZIP `Havarie_Assistent_GitHub_Pages_Demo.zip` abgeleitete, statische D2-Weboberfläche wird in einem separaten Branch weiterentwickelt. Der live veröffentlichte Branch `main` bleibt bis nach Prüfung und ausdrücklicher Entscheidung unverändert.

## Bestand (Ist)
- `assistent/index.html`: Layout und fünf Ansichten (Dashboard, Eingabe, Ergebnis, Fachprüfung/Freigabe, Ereignismodus); Eingabeassistent mit 7 Schritten.
- `assistent/styles.css`: Gestaltung, responsive/mobile Darstellung.
- `assistent/app.js`: DOM-Steuerung, Beispielkatalog, Formularprüfung, Demo-Adapter ohne Netzwerkzugriff.
- `assistent/README.md`: Betriebsgrenzen der öffentlichen Demonstration.
- `index.html` im Repo-Wurzelverzeichnis: separate Standortvorsorge-Demo; **nicht** unbeabsichtigt überschreiben.

Direkter Pfad zur D2-Demo: `https://dawdleo.github.io/standortvorsorge/assistent/`.
Einbettung im bestehenden Workspace: `https://dawdleo.github.io/nextcloud-iframe/havarie.html`.

## Technischer Befund (Paketprüfung)
- Die ZIP-Datei enthält ausschließlich die vier Dateien unter `assistent/`. Keine Excel-Dateien, Python-Dienste oder produktiven Daten.
- Alle vom Demo-Skript referenzierten HTML-IDs sind vorhanden (102 von 102 geprüft).
- `node --check` für das JavaScript ohne Syntaxfehler.
- CSS/JS sind relativ als `./styles.css` und `./app.js` eingebunden.
- Statischer Demo-Adapter: keine Aufrufe von `fetch`, `XMLHttpRequest`, `WebSocket` oder `eval` im Demo-Skript.
- Nicht persistente Eingaben: In-Memory-Modell; Reload verwirft den Entwurf.
- Backend fehlt bewusst: weder tatsächliche Excel-Bewertung noch fachliche Freigabe, PDF-Freigabedokument oder operativer Ereignisplan.

## Änderungsbereiche (vorläufig, noch keine funktionale Festlegung)
1. **Oberfläche:** Begriffe, Farben, Karten und Navigationsstruktur in `index.html` / `styles.css`.
2. **Smartphone / Homarr:** Verbesserte schmale iFrames, sinnvolle Höhe, Eingabekomponenten, Scrollen, Navigation.
3. **Formular:** Reihenfolge und Pflichtfelder; Projektdaten, Stoff, Tätigkeit, Menge/Gebinde, Standortbedingungen und Ausrüstung.
4. **Demo-Daten:** Beispiele ausschließlich neutral und als nicht geprüft gekennzeichnet.
5. **Modularität:** Später Trennung von UI-Steuerung, Konfiguration und Datenadapter, falls umfangreiche Erweiterungen anstehen.
6. **Backend (separates späteres Projekt):** Geschützter Dienst für überprüfte Daten; für Excel-COM ist Windows + Excel Desktop erforderlich. Auf GitHub Pages keine Backend-Geheimnisse hinterlegen.

## Schutzregeln
- Ausschließlich fiktive Beispieldaten im öffentlichen Repository und auf GitHub Pages.
- Keine API-Schlüssel, Passwörter, SDBs mit vertraulichen Angaben, Projektstandorte oder personenbezogenen Daten veröffentlichen.
- Keine echten Freigabefunktionen, Berechnungen oder Notfallanweisungen in der Demo simulieren.
- Fachprüfung und Dokumentenfreigabe bleiben technisch deaktiviert; Hinweise zur Nichtfreigabe bleiben sichtbar.
- Die Originalversion im Branch `main` vorerst unangetastet lassen.

## Vorgeschlagener Ablauf
1. Gewünschte Änderung und Abnahmekriterium kurz definieren.
2. Änderung nur in `vorbereitung-havarie-anpassung-20261013` vornehmen.
3. Statische Prüfungen durchführen (`node --check`, relative Assets, DOM-IDs).
4. Im Smartphone-Browser und Homarr-iFrame testen: Navigation, 7 Schritte, Demo-Evaluation, keine Freigabe, kein Live-Datenabruf.
5. Änderungen vergleichen und erst nach Freigabe per Pull Request in `main` übernehmen.

## Offene Entscheidung
**Welche konkrete Anpassung hat Priorität?** Zum Beispiel Homarr-Darstellung, Aufbau/Formular, Design oder Funktionsstruktur. Bis dahin: keine fachlichen oder produktiven Änderungen.
