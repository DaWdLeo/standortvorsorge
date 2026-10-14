/* Modern Industrial UI: area navigation, safe overview and readonly emergency information. */
(function(){
'use strict';
const A=window.HavarieApp,U=window.HavarieUI;
const {html,raw}=U;
const areaFor={start:'start',ort:'ort',umgebung:'ort',stoff:'stoff',taetigkeit:'stoff',ausruestung:'ausruestung',pruefen:'ausruestung',ergebnis:'ausruestung',notfall:'notfall'};
const titles={start:'Übersicht',ort:'Standort',stoff:'Gefahrstoffe',ausruestung:'Vorsorge',notfall:'Notfallplan'};
const keepGo=A.go;
A.go=function(step,opts){if(step==='notfall'){A.S.step='notfall';A.S.navOpen=false;try{history.pushState({step},'','#notfall')}catch{}A.save();A.render({focusHeading:true});A.scrollTop();return}keepGo(step,opts)};
A.STEPS.push('notfall');
try { A.S.themeChoice=localStorage.getItem('havarie.theme')||'system'; } catch { A.S.themeChoice='system'; }
if(A.S.themeChoice==='light'||A.S.themeChoice==='dark')document.documentElement.dataset.theme=A.S.themeChoice;
A.actions['theme-toggle']=()=>{let cur=A.S.themeChoice,next=cur==='system'?'light':cur==='light'?'dark':'system';A.S.themeChoice=next;try{localStorage.setItem('havarie.theme',next)}catch{}if(next==='system')document.documentElement.removeAttribute('data-theme');else document.documentElement.dataset.theme=next;A.toast('Darstellung: '+({system:'System',light:'Hell',dark:'Dunkel'}[next]))};
function clean(v){return v===null||v===undefined||v===''?'Nicht hinterlegt':String(v)}
function emergencyInformation(){
 const project=A.project(),d=A.S.d;
 const contact=project?.Umwelt_HSE_Kontakt;
 const point=project?.Notfall_Treffpunkt,access=project?.Zufahrt;
 return html`<section class="industrial-emergency">
 <span class="emergency-tag">Notfallinformationen</span>
 <h1 data-heading>Notfallplan</h1>
 <p><strong>Schneller Informationszugang.</strong> Diese öffentliche Demo enthält keine für einen realen Einsatz geprüften Notfallanweisungen.</p>
 <div class="not-verified" role="status"><strong>Keine freigegebenen Einsatzunterlagen verfügbar.</strong> Verwenden Sie im Ereignisfall die betrieblich freigegebenen Alarm- und Notfallunterlagen. Die hier angezeigten Stammdaten sind nur Beispiele.</div>
 <h2>Vorhandene Standortinformationen</h2>
 <dl><dt>Standort</dt><dd>${clean(project?.Projektbezeichnung)}</dd>
 <dt>Einsatzstelle</dt><dd>${clean(A.locationText())}</dd>
 <dt>Umwelt-/HSE-Kontakt</dt><dd>${clean(contact)} · nicht verifiziert</dd>
 <dt>Treffpunkt</dt><dd>${clean(point)} · nicht verifiziert</dd>
 <dt>Zufahrt</dt><dd>${clean(access)} · nicht verifiziert</dd>
 <dt>Entwässerung</dt><dd>${clean(d.drainage)} · Eingabe, nicht geprüft</dd></dl>
 </section>
 <section class="card"><h2>Fachlich freigegebene Dokumente</h2>
 <p class="muted">Derzeit keine verifizierten Dokumente angebunden. Eine spätere geschützte Anbindung muss Gültigkeit, Version, Freigabestatus und Offline-Verfügbarkeit prüfen.</p>
 </section>
 <div class="actions"><button type="button" class="btn" data-act="go" data-to="start">Zur Übersicht</button><button type="button" class="btn btn--quiet" data-act="go" data-to="ort">Standortdaten ansehen</button></div>`;
}
A.views.notfall=emergencyInformation;

/* Dashboard figures originate from existing validation, not inferred safety approvals. */
const WORKFLOW=['ort','umgebung','stoff','taetigkeit','ausruestung'];
const iconPaths={
 ort:'<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
 stoff:'<path d="M9 3h6M10 3v7l-5 8a3 3 0 0 0 2.6 4h8.8a3 3 0 0 0 2.6-4l-5-8V3"/><path d="M7 16h10"/>',
 ausruestung:'<path d="M12 22c7-3 9-7 9-14l-9-5-9 5c0 7 2 11 9 14Z"/><path d="m9 12 2 2 4-4"/>',
 notfall:'<path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v5"/><path d="M12 18h.01"/>'
};
const tile=(step,title,desc)=>html`
 <button type="button" class="premium-area ${step==='notfall'?'premium-area--emergency':''}" data-act="go" data-to="${step}" aria-label="${title} öffnen">
   <span class="premium-area__icon" aria-hidden="true">${raw('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+iconPaths[step]+'</svg>')}</span>
   <span class="premium-area__copy"><strong>${title}</strong><small>${desc}</small></span>
   <span class="premium-area__arrow" aria-hidden="true">↗</span>
 </button>`;
A.views.start=()=>{
 const project=A.project();
 const done=WORKFLOW.filter(k=>A.missing(k).length===0).length;
 const missing=WORKFLOW.reduce((total,k)=>total+A.missing(k).length,0);
 const percent=Math.round(100*done/WORKFLOW.length);
 return html`
 <section class="premium-overview" aria-label="Arbeitsübersicht">
   <header class="premium-page-head">
     <p class="premium-eyebrow">UMWELTMANAGEMENT · BAUSTELLE</p>
     <h1 data-heading tabindex="-1">Umweltvorsorge</h1>
     <p>Standortbezogene Risiken erfassen und Schutzmaßnahmen vorbereiten.</p>
   </header>
   <section class="premium-context" aria-label="Standort und Erfassungsstand">
     <div class="premium-context__grid">
       <div><span class="premium-meta-label">AKTUELLER STANDORT</span><strong>${project?.Projektbezeichnung||'Nicht ausgewählt'}</strong></div>
       <div><span class="premium-meta-label">DATENERFASSUNG</span><strong>${done} von ${WORKFLOW.length} Bereichen</strong></div>
       <div><span class="premium-meta-label">OFFENE PFLICHTANGABEN</span><strong>${missing}</strong></div>
     </div>
     <div class="premium-progress" role="progressbar" aria-label="Vollständige Erfassungsbereiche" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><span style="width:${percent}%"></span></div>
     <div class="premium-context__actions">
       <button class="btn btn--primary" type="button" data-act="go" data-to="ort">${project?'Standort bearbeiten':'Standort erfassen'}</button>
       <button class="btn btn--quiet" type="button" data-act="go" data-to="pruefen">Angaben prüfen</button>
     </div>
   </section>
   <div class="premium-section-heading"><h2>Arbeitsbereiche</h2><p>Direkt zum nächsten Arbeitsschritt.</p></div>
   <nav class="premium-area-grid" aria-label="Arbeitsbereiche">
     ${tile('ort','Standort','Umgebung und Schutzgüter')}
     ${tile('stoff','Gefahrstoffe','Stoffe, Mengen und Tätigkeiten')}
     ${tile('ausruestung','Vorsorge','Barrieren und Notfallausrüstung')}
     ${tile('notfall','Notfallplan','Geprüfte Unterlagen abrufen')}
   </nav>
   <p class="premium-safety-note">Die Erfassung und die Vorabbewertung ersetzen keine fachliche Prüfung. Für diesen Demonstrator sind keine freigegebenen betrieblichen Notfallunterlagen hinterlegt.</p>
 </section>${A.footer()}`;
};
const oldRender=A.render;
A.render=function(opts){
 oldRender(opts);
 const active=areaFor[A.S.step]||'start';
 document.querySelectorAll('.industrial-nav-item,.industrial-bottom-item').forEach(b=>{if(b.dataset.to===active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});

};
})();