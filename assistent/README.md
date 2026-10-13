# Havarie-Assistent · statische GitHub-Pages-Demo

Adaptiert aus dem bereitgestellten D2-Webfrontend. Die Original-Oberfläche (HTML/CSS/JS) bleibt erhalten, jedoch nutzt die GitHub-Version bewusst eine in-memory-Demoadapter statt der Excel/FastAPI-Schnittstellen.

**Kein operativer Betrieb**: Keine Excel-COM-Engine, keine Sicherheitsbewertung, keine Freigabe oder PDF-Erzeugung, keine realen Ereignis-Anweisungen. Keine vertraulichen oder realen Einsatzdaten eingeben. Die Testeingaben werden nicht persistent gespeichert.

Für GitHub Pages die drei Webdateien im Verzeichnis `assistent/` ablegen: `index.html`, `styles.css`, `app.js`. Nicht `data/`, `.xlsx`, `app.py` oder Backups hochladen. Die Demo kann als iFrame über `https://dawdleo.github.io/standortvorsorge/assistent/` eingebunden werden, wenn GitHub Pages auf dem Branch main/(root) aktiv ist.

Der vollständige Originalprototyp benötigt Windows mit Excel Desktop, Python und FastAPI.