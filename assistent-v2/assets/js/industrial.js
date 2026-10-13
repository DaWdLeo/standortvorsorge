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
const oldStart=A.views.start;
A.views.start=()=> {
 const d=A.S.d,project=A.project();
 const all=['ort','umgebung','stoff','taetigkeit','ausruestung'];
 const missing=all.reduce((n,k)=>n+A.missing(k).length,0);
 const collected=all.length-all.filter(k=>A.missing(k).length).length;
 return html`
  <section class="industrial-overview" aria-label="Arbeitsübersicht">
   <article class="card wide"><p class="muted small">UMWELTVORSORGE · DEMONSTRATOR</p><h1 data-heading>Standortbezogen planen.</h1><p>Umweltrisiken erfassen, Schutzmaßnahmen vorbereiten und den Zugang zu Notfallinformationen organisieren.</p>
    <div class="actions"><button type="button" class="btn btn--primary" data-act="go" data-to="ort">Standort bearbeiten →</button><button type="button" class="btn" data-act="go" data-to="notfall">Notfallinformationen</button></div>
   </article>
   <article class="card"><h2>Aktueller Standort</h2><p><strong>${project?.Projektbezeichnung||'Noch nicht gewählt'}</strong></p><p class="muted small">Angaben sind keine fachliche Prüfung.</p><button type="button" class="btn btn--sm" data-act="go" data-to="ort">Standortdaten</button></article>
   <article class="card"><h2>Erfassungsstand</h2><p><strong>${collected} von ${all.length} Bereichen vollständig</strong></p><p class="muted">${missing} Pflichtangaben noch offen</p><button type="button" class="btn btn--sm" data-act="go" data-to="pruefen">Angaben prüfen</button></article>
   <article class="card wide"><h2>Vorsorge und Notfallmanagement</h2><div class="industrial-phases">
    <div class="industrial-phase"><strong>01 · Vorsorge</strong><p>Standort, Stoff und mögliche Ausbreitungswege erfassen.</p><button class="btn btn--sm" data-act="go" data-to="umgebung" type="button">Umgebung erfassen</button></div>
    <div class="industrial-phase"><strong>02 · Bereitschaft</strong><p>Vorhandene Barrieren und Ausrüstung dokumentieren.</p><button class="btn btn--sm" data-act="go" data-to="ausruestung" type="button">Ausrüstung prüfen</button></div>
    <div class="industrial-phase"><strong>03 · Ereignis</strong><p>Nur freigegebene Alarm- und Notfallunterlagen verwenden.</p><button class="btn btn--sm industrial-quick-emergency" data-act="go" data-to="notfall" type="button">Notfallplan öffnen</button></div>
   </div></article>
   <article class="card wide"><p><strong>Wichtig:</strong> Vollständige Datenerfassung ist weder fachliche Prüfung noch Einsatzfreigabe. Das exportierte Regelwerk enthält fachlich nicht freigegebene Beispieldaten.</p></article>
  </section>${A.footer()}`;
};
const oldRender=A.render;
A.render=function(opts){
 oldRender(opts);
 const active=areaFor[A.S.step]||'start';
 document.querySelectorAll('.industrial-nav-item,.industrial-bottom-item').forEach(b=>{if(b.dataset.to===active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
 const dock=document.getElementById('status-dock');
 if(dock){
  const wrap=dock.querySelector('.dock__top');
  const project=A.project();
  if(wrap){
   const x=document.createElement('span');x.className='industrial-status-detail';x.textContent='Standort: '+(project?.Projektbezeichnung||'offen')+' · Fachprüfung: ausstehend';wrap.append(x);
  }
  if(A.S.step==='notfall'){
   const head=dock.querySelector('.dock__identity strong');if(head)head.textContent='Notfallplan';
   const prog=dock.querySelector('.dock__progress');if(prog)prog.setAttribute('aria-valuenow','0');
  }
 }
};
})();