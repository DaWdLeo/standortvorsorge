/* V3 Arbeitsstand: interaction only, sample state never grants an operational approval. */
(function(){
'use strict';
const A=window.HavarieApp, U=window.HavarieUI, M=window.HavarieWorkstandModel;
if(!A||!U||!M)return;
const {html,raw}=U;
const KEY='havarie.v3.arbeitsstand.sample.v1';
const defaults={selected:'ES-02',drainage:'',filter:'all',sort:'priority',history:[]};
let state={...defaults};
try{
 const x=JSON.parse(localStorage.getItem(KEY)||'null');
 if(x&&typeof x==='object'){
  if(['ES-01','ES-02','ES-03'].includes(x.selected))state.selected=x.selected;
  if(M.DRAINAGE.includes(x.drainage))state.drainage=x.drainage;
  if(M.FILTERS.includes(x.filter))state.filter=x.filter;
  if(M.SORTS.includes(x.sort))state.sort=x.sort;
  if(Array.isArray(x.history))state.history=x.history.filter(a=>a&&a.caseId==='ES-02'&&typeof a.at==='string'&&typeof a.text==='string').slice(-20);
 }
}catch{}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}
function note(action){state.history.push({caseId:'ES-02',at:new Date().toISOString(),text:action});state.history=state.history.slice(-20)}
A.STEPS.push('arbeitsstand');
A.actions['workstand-select']=el=>{state.selected=el.dataset.case;save();A.render();document.getElementById('workstand-detail')?.scrollIntoView({block:'nearest'})};
A.actions['workstand-filter']=el=>{state.filter=el.dataset.filter;save();A.render()};
A.binders['workstand-sort']=el=>{state.sort=M.SORTS.includes(el.value)?el.value:'priority';save();A.render()};
A.binders['workstand-drainage']=el=>{
 const value=M.DRAINAGE.includes(el.value)?el.value:'';
 if(value!==state.drainage){state.drainage=value;note(value?'Beispielangabe zum Ableitungsziel geändert (ungeprüft)':'Beispielangabe entfernt');save()}
 A.render();
};
A.actions['workstand-reset']=()=>{state.drainage='';note('Beispielangabe zurückgesetzt');save();A.render()};
const status=(yes,a,b)=>html`<span class="workstand-chip ${yes?'workstand-chip--done':'workstand-chip--open'}">${yes?'✓':'○'} ${yes?a:b}</span>`;
const labels={all:'Alle',needs:'Handlungsbedarf',review:'In Prüfung',approved:'Freigabe-Muster'};
const metric=(filter,title,value,total,description)=>html`<button type="button" data-act="workstand-filter" data-filter="${filter}" class="workstand-metric workstand-metric--button ${state.filter===filter?'is-active':''}" aria-pressed="${state.filter===filter}">
 <span>${title} ↗</span><strong>${value} / ${total}</strong><p>${description}</p><div class="workstand-track"><span style="width:${Math.round(100*value/total)}%"></span></div></button>`;
A.views.arbeitsstand=()=>{
 const rows=M.cases(state),tot=M.summary(rows),visible=M.filtered(rows,state.filter,state.sort),selected=rows.find(c=>c.id===state.selected)||rows[1];
 const missing=selected.id==='ES-02'&&!selected.captured;
 return html`<section class="workstand">
  <header class="workstand-head"><div><span class="workstand-eyebrow">BEISPIELPROJEKT NORD · V3-PILOT</span><h1 data-heading>Arbeitsstand</h1><p>Stoff, Tätigkeit und Einsatzort – getrennte Prüffälle</p></div><span class="workstand-demo">BEISPIELDATEN</span></header>
  <section class="workstand-scope" aria-label="Umfang der Einsatzliste">
   <div><strong>Umfang der Einsatzliste noch nicht bestätigt</strong><p>Auch wenn alle erfassten Fälle vollständig sind, können weitere relevante Situationen fehlen. Eine Prüfung durch die zuständige Bauleitung ist ausstehend.</p></div>
   <span class="workstand-chip workstand-chip--open">◷ Umfangsprüfung offen</span>
  </section>
  <div class="workstand-metrics" aria-label="Filterbare Prozesskennzahlen">
    ${metric('capture','1 · Erfassung',tot.captured,tot.total,'Angaben vollständig · anzeigen: fehlende')}
    ${metric('coverage','2 · Maßnahmenabdeckung',tot.covered,tot.total,'Musterstatus · offene anzeigen')}
    ${metric('approval','3 · Freigabe',tot.approvedSample,tot.total,'Ausschließlich fiktive Statussimulation')}
  </div>
  <p class="workstand-meta">Quoten beziehen sich nur auf die drei fiktiven Einträge. Grün bedeutet bei ES-01 ausschließlich eine simulierte Musterfreigabe, niemals eine tatsächliche Einsatzfreigabe.</p>
  <div class="workstand-sectionhead"><h2>Einsatzsituationen</h2><span>${visible.length} von ${rows.length} sichtbar · Dringende Aufgaben zuerst</span></div>
  <div class="workstand-toolbar" aria-label="Filtern und Sortieren">
   <div class="workstand-filters" role="group" aria-label="Statusfilter">
   ${Object.entries(labels).map(([key,label])=>html`<button type="button" data-act="workstand-filter" data-filter="${key}" aria-pressed="${state.filter===key}" class="${state.filter===key?'is-active':''}">${label}</button>`)}
   </div>
   <label class="workstand-sort">Sortierung <select data-bind="@workstand-sort" aria-label="Einsatzsituationen sortieren"><option value="priority" ${state.sort==='priority'?raw('selected'):''}>Handlungsbedarf zuerst</option><option value="id" ${state.sort==='id'?raw('selected'):''}>ES-Nummer</option></select></label>
  </div>
  <div class="workstand-cardgrid" aria-label="Einsatzsituationen">
   ${visible.length?visible.map(c=>html`<button type="button" data-act="workstand-select" data-case="${c.id}" aria-pressed="${state.selected===c.id}" class="workstand-case workstand-case--${c.level} ${state.selected===c.id?'is-selected':''}">
     <span class="workstand-case__top"><span>${c.id} · ${c.location}</span><span class="workstand-case__badge">${c.level==='approved'?'✓ Freigabe-Muster':c.level==='needs'?'! Angaben fehlen':'◷ In Prüfung'}</span></span>
     <strong class="workstand-case__title">${c.substance} · ${c.activity}</strong>
     <span class="workstand-case__statuses"><span>Erfassung: ${c.captured?'✓ Vollständig':'! Offen'}</span><span>Maßnahmen: ${c.coverage?'✓ Muster bestätigt':'◷ Prüfung offen'}</span><span>Freigabe: ${c.approval?'✓ nur simuliert':'○ Ausstehend'}</span></span>
     <span class="workstand-case__task"><small>NÄCHSTE AUFGABE</small><strong>${c.task}</strong><small>Zuständig: ${c.role}</small></span>
     <span class="workstand-case__open">Details öffnen →</span>
   </button>`):html`<div class="workstand-empty" role="status">Keine Einsatzsituation entspricht diesem Filter. <button type="button" data-act="workstand-filter" data-filter="all">Alle anzeigen</button></div>`}
  </div>
  <section id="workstand-detail" class="workstand-detail" aria-labelledby="workstand-detail-title">
   <div class="workstand-detail__head"><div><span class="workstand-eyebrow">DETAILS · ${selected.id}</span><h2 id="workstand-detail-title">${selected.substance} / ${selected.activity}</h2><p>${selected.location}</p></div><span class="workstand-chip">${selected.level==='approved'?'✓ Simulierte Musterfreigabe':selected.level==='needs'?'! Angaben fehlen':'◷ Fachprüfung offen'}</span></div>
   <div class="workstand-detail__body"><div><dl class="workstand-facts">
      <dt>Stoffquelle</dt><dd>${selected.source}</dd><dt>Menge/Gebinde</dt><dd>${selected.quantity}</dd>
      <dt>Ableitungsbezug</dt><dd>${selected.id==='ES-02'?(missing?'D02 · Angabe fehlt':'Beispielangabe erfasst, ungeprüft'):'Musterangaben ohne Fachprüfung'}</dd>
      <dt>Maßnahmenbasis</dt><dd>${selected.measures}</dd></dl>
      ${selected.id==='ES-02'?html`<div class="workstand-edit"><label for="workstand-drainage">Ableitungsziel D02 ergänzen · Beispielangabe</label><select id="workstand-drainage" data-bind="@workstand-drainage"><option value="" ${!state.drainage?raw('selected'):''}>Noch nicht erfasst</option><option value="D02-MUSTER" ${state.drainage==='D02-MUSTER'?raw('selected'):''}>D02: Beispielableitung dokumentiert (ungeprüft)</option><option value="KEINE-ABLEITUNG" ${state.drainage==='KEINE-ABLEITUNG'?raw('selected'):''}>Keine Ableitung laut Beispiel (ungeprüft)</option></select><p>Vervollständigt ausschließlich die Musterdatenerfassung. Maßnahmen und Freigabe bleiben offen.</p>${state.drainage?html`<button class="btn btn--quiet" type="button" data-act="workstand-reset">Angabe zurücksetzen</button>`:''}</div>`:''}
    </div><div class="workstand-next"><span>NÄCHSTER ARBEITSSCHRITT</span><h3>${selected.task}</h3><p>Danach: ${selected.after}</p><div class="workstand-owner"><span>ZUSTÄNDIGE FUNKTION · BEISPIEL</span><strong>${selected.role}</strong></div><div class="workstand-approval"><strong>${selected.approval?'Freigabe nur im fiktiven Beispieldatensatz':'Keine Freigabe erteilt'}</strong><p>Eine Freigabe kann über diese Pilot-App nicht erteilt werden.</p></div></div></div>
   <details class="workstand-history"><summary>Änderungsverlauf (lokale Demo) · ${state.history.length} Einträge</summary>
     ${state.history.length?html`<ol>${[...state.history].reverse().map(h=>html`<li><time>${new Date(h.at).toLocaleString('de-DE')}</time> · ${h.text} · Lokale Demo, Benutzer nicht verifiziert</li>`)}</ol>`:html`<p>Noch keine Änderungen an ES-02 in diesem Browser.</p>`}
     <p>Diese Anzeige ist keine revisionssichere Historie, keine Identitätsfeststellung und kein Prüf- oder Freigabenachweis.</p>
   </details>
  </section>
  <p class="workstand-bottom-note">PILOT V3 · vollständig fiktive Statusdaten · Einsatzumfang und Fachfreigaben sind nicht bestätigt. Die produktive Daten- und Freigabearchitektur folgt separat.</p>
 </section>`;
};
})();