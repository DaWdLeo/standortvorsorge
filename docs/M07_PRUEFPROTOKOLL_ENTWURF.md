# M07 – Prüfprotokoll / kontrollierter Entwurfsdatensatz
Stand: 14.10.2026. Status: **Technische Entwurfsfunktion, nicht fachlich freigegeben.**

## Implementiert
- Im Ergebnis **Prüfprotokoll als PDF** (Browser-Druckdialog) plus **Prüfdatensatz (JSON)**.
- Beim Export wird ein lokaler, tief kopierter **Snapshot** des aktuell bewerteten Einzelvorgangs erstellt, ohne das Excel-Regelwerk zu verändern.
- Entwurfsreferenz, UTC-Zeitstempel, Regelwerk- und Datenexportversion, Regeltreffer samt Version und Quell-ID, zugeordnete Meldekriterien (keine erdachten Fallbacks), Maßnahmen-/Quellenreferenzen.
- SHA-256-Prüfsumme des serialisierten Snapshot-JSON, sofern WebCrypto verfügbar. Der exportierte JSON-Datensatz enthält die Prüfsumme zusätzlich in einem `checksum`-Feld; nur der **snapshot**-Teil ist Prüfsummengrundlage.
- Getrennter Nachweisbereich im A4-Druckbericht, konsequent als **ENTWURF – FACHLICH NICHT FREIGEGEBEN** markiert.
- Kein Freigabe-, Rollen-, Berechtigungs- oder Datenarchivierungsversprechen. Bei jeder Exportaktion wird neu aus den gerade sichtbaren Falldaten erzeugt.
- Tests in `assistent-v2/tests/m07-report.test.js`.

## Grenzen und nächste Abnahmeschritte
- Eine lokale Entwurfsreferenz und SHA-256 ersetzen **keine unveränderliche Speicherung, Signatur oder fachliche Freigabe**; M04 bleibt offen.
- Die technische Prüfsumme ist ohne echte Backend-Autorisierung manipulierbar und soll ausschließlich spätere Differenzkontrolle erleichtern.
- Der Export wird nicht zentral gesichert; JSON/PDF müssen fachlich überprüft und geschützt abgelegt werden.
- Gültigkeit und fachliche Eignung der Quellen sind anhand von `18_Quellen` und den Originalen zu verifizieren. Beispiel-Statuswerte sind **keine Freigabe**.
- Mobile Browser- und A4-Seitenumbruchtests (1, 5, 10 Seiten) sind noch durchzuführen.
- Für spätere Produktivnutzung: authentifizierter Freigabe-Workflow, kontrollierter unveränderlicher Snapshot, Datenzugriff und Rollenmodell, Notfall-Offline-Fallback.
