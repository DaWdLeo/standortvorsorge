/* V3 phase 1: isolated, explicitly fictional work-status prototype.
   No connection to the V2 single-case rule engine or any approval service. */
(function(){
 'use strict';
 const A=window.HavarieApp,U=window.HavarieUI;
 if(!A||!U)return;
 const {html,raw}=U;
 const STORE='havarie.v3.arbeitsstand.sample.v1';
 const defaults={selected:'ES-02',drainage:''};
 let state={...defaults};
 try{
   const x=JSON.parse(localStorage.getItem(STORE)||'null');
   if(x&&typeof x==='object'){
     if(['ES-01','ES-02','ES-03'].includes(x.selected))state.selected=x.selected;
     if(['D02-MUSTER','KEINE-ABLEITUNG'].includes(x.drainage))state.drainage=x.drainage;
   }
 }catch{}
 const save=()=>{try{localStorage.setItem(STORE,JSON.stringify(state))}catch{}};
 const samples=[
  {id:'ES-01',substance:'Diesel',activity:'Lagerung',location:'L01 · Lagercontainer Nord',complete:true,measure:true,role:'Fachfunktion Umwelt (Beispiel)',task:'Maßnahmennachweise fachlich prüfen',next:'Prüfentscheidung durch berechtigte Funktion ausstehend',mat:'MB-01 · Musterversion 1.0'},
  {id:'ES-02',substance:'Diesel',activity:'Betankung',location:'B02 · Betankungsplatz Ost',complete:false,measure:false,role:'Bauleitung (Beispiel)',task:'Ableitungsziel D02 klären',next:'Zuständige Bauleitung muss das Ableitungsziel verifizieren',mat:'MB-02 · Musterversion 1.0 · Zuordnung offen'},
  {id:'ES-03',substance:'Schalöl',activity:'Anwendung',location:'A03 · Arbeitsbereich Süd',complete:true,measure:false,role:'Fachfunktion Umwelt (Beispiel)',task:'Maßnahmenabdeckung fachlich prüfen',next:'Anschließend Freigabefähigkeit bewerten',mat:'Keine freigegebene Maßnahmenzuordnung'}
 ];
 function cases(){return samples.map(c=>{
   const completed=c.complete||(c.id==='ES-02'&&!!state.drainage);
   return {...c,completed,coverage:c.measure,approval:false};
 });}
 A.STEPS.push('arbeitsstand');
 A.actions['workstand-select']=(el)=>{
   const id=el.dataset.case;
   if(!samples.some(c=>c.id===id))return;
   state.selected=id;save();A.render();
   // Keep selected detail available for keyboard and screen reader users.
   document.getElementById('workstand-detail')?.scrollIntoView({block:'nearest'});
 };
 A.actions['workstand-reset']=()=>{
   state={...defaults};save();A.render();A.toast('Beispielangabe zurückgesetzt.');
 };
 A.binders['workstand-drainage']=(el)=>{
   state.drainage=['D02-MUSTER','KEINE-ABLEITUNG'].includes(el.value)?el.value:'';
   save();A.render();
 };
 function status(ok,yes,no){return html`<span class="workstand-chip ${ok?'workstand-chip--done':'workstand-chip--open'}"><span aria-hidden="true">${ok?'✓':'○'}</span> ${ok?yes:no}</span>`;}
 function label(v){return v?'Vorhanden':'Ausstehend';}
 A.views.arbeitsstand=function(){
  const rows=cases(),capture=rows.filter(x=>x.completed).length,coverage=rows.filter(x=>x.coverage).length;
  const selected=rows.find(x=>x.id===state.selected)||rows[1];
  const missing=selected.id==='ES-02'&&!selected.completed;
  const next=missing?selected.task:selected.id==='ES-02'?'Maßnahmenzuordnung und Eignung fachlich prüfen':selected.task;
  const role=selected.id==='ES-02'&&!missing?'Fachfunktion Umwelt (zu benennen)':selected.role;
  const pct=n=>Math.round(100*n/rows.length);
  return html`
   <section class="workstand">
    <header class="workstand-head">
      <div><span class="workstand-eyebrow">PROJEKTÜBERSICHT · V3-PILOT</span><h1 data-heading>Arbeitsstand</h1>
        <p>Beispielprojekt Nord <span aria-hidden="true">·</span> Drei fiktive Einsatzsituationen</p></div>
      <span class="workstand-demo">BEISPIELDATEN</span>
    </header>
    <div class="workstand-scope" role="status">
      <div><strong>Umfang der Einsatzliste: ungeprüft</strong><p>Die Bauleitung hat die Vollständigkeit der Einsatzsituationen nicht bestätigt.</p></div>
      <span class="workstand-chip workstand-chip--open">Umfangsprüfung offen</span>
    </div>
    <div class="workstand-metrics" aria-label="Getrennte Fortschrittsdimensionen">
      <section class="workstand-metric"><span>1 · Erfassung</span><strong>${capture} / ${rows.length}</strong><p>Angaben vollständig</p><div class="workstand-track"><span style="width:${pct(capture)}%"></span></div></section>
      <section class="workstand-metric"><span>2 · Maßnahmenabdeckung</span><strong>${coverage} / ${rows.length}</strong><p>Beispielhaft zugeordnet, nicht geprüft</p><div class="workstand-track"><span style="width:${pct(coverage)}%"></span></div></section>
      <section class="workstand-metric"><span>3 · Freigabe</span><strong>0 / ${rows.length}</strong><p>Keine fachliche Freigabe erteilt</p><div class="workstand-track"><span style="width:0%"></span></div></section>
    </div>
    <p class="workstand-meta">Die Erfassungsquote bewertet nur diese drei Beispieldatensätze. Eine vollständige Einsatzliste, Maßnahmenprüfung oder Freigabe wird dadurch nicht bestätigt.</p>
    <div class="workstand-sectionhead"><h2>Einsatzsituationen</h2><span>${rows.length} Beispiele · Eintrag auswählen</span></div>
    <div class="workstand-table" role="list" aria-label="Einsatzsituationen">
      ${rows.map(c=>html`<button type="button" role="listitem" class="workstand-row ${c.id===selected.id?'is-selected':''}" data-act="workstand-select" data-case="${c.id}" aria-current="${c.id===selected.id?'true':'false'}">
       <span class="workstand-row__name"><small>${c.id}</small><strong>${c.substance} · ${c.activity}</strong><small>${c.location}</small></span>
       <span class="workstand-row__status">${status(c.completed,'Vollständig','Angabe fehlt')}<small>Erfassung</small></span>
       <span class="workstand-row__status">${status(c.coverage,'Muster zugeordnet','Prüfung offen')}<small>Maßnahmen</small></span>
       <span class="workstand-row__status">${status(false,'Freigegeben','Ausstehend')}<small>Freigabe</small></span>
       <span class="workstand-row__chevron" aria-hidden="true">›</span>
      </button>`)}
    </div>
    <section id="workstand-detail" class="workstand-detail" aria-labelledby="workstand-detail-title">
      <div class="workstand-detail__head">
       <div><span class="workstand-eyebrow">${selected.id} · DETAILANSICHT</span>
        <h2 id="workstand-detail-title">${selected.substance} / ${selected.activity}</h2>
        <p>${selected.location}</p></div>
       ${status(selected.completed,'Erfassung vollständig','Klärung erforderlich')}
      </div>
      <div class="workstand-detail__body">
        <div>
         <dl class="workstand-facts">
          <dt>Stoffquelle</dt><dd>Fiktive Quelle · SDB-MUSTER 1.0</dd>
          <dt>Mengen/Gebinde</dt><dd>${selected.id==='ES-02'?'300 l · mobiler Tank (Beispiel)':'Beispielwerte, nicht verifiziert'}</dd>
          <dt>Ableitungsbezug</dt><dd>${selected.id==='ES-02'?(missing?'D02 · noch nicht dokumentiert':'D02 · Beispielangabe erfasst, ungeprüft'):'Keine bestätigte Datenquelle'}</dd>
          <dt>Maßnahmenbezug</dt><dd>${selected.mat}</dd>
         </dl>
         ${selected.id==='ES-02'?html`<div class="workstand-edit">
           <label for="workstand-drainage">Ableitungsziel – fehlende Beispielangabe</label>
           <select id="workstand-drainage" data-bind="@workstand-drainage">
             <option value="" ${!state.drainage?raw('selected'):''}>Noch nicht erfasst</option>
             <option value="D02-MUSTER" ${state.drainage==='D02-MUSTER'?raw('selected'):''}>D02: Beispielableitung dokumentiert (ungeprüft)</option>
             <option value="KEINE-ABLEITUNG" ${state.drainage==='KEINE-ABLEITUNG'?raw('selected'):''}>Keine Ableitung laut Beispielangabe (ungeprüft)</option>
           </select>
           <p>Eine Auswahl vervollständigt nur die Musterdokumentation – keine fachliche Bestätigung.</p>
           ${state.drainage?html`<button type="button" class="btn btn--quiet" data-act="workstand-reset">Beispielangabe zurücksetzen</button>`:''}
          </div>`:''}
        </div>
        <div class="workstand-next">
          <span>NÄCHSTER ARBEITSSCHRITT</span>
          <h3>${next}</h3>
          <p>${missing?'Vor Maßnahmenprüfung muss die Eingabe sachlich geklärt werden.':'Der Erfassungsstand ersetzt weder die Maßnahmenprüfung noch die Freigabe.'}</p>
          <div class="workstand-owner"><span>Zuständige Funktion (Beispiel)</span><strong>${role}</strong></div>
          <div class="workstand-approval"><strong>Fachprüfung offen · Freigabe ausstehend</strong><p>Ein Freigabe-Button ist bewusst nicht vorhanden.</p></div>
        </div>
      </div>
    </section>
    <p class="workstand-bottom-note">PILOT V3 · Beispielprojekt ohne echte Baustellen- oder Stoffdaten · Einzelfallbewertungen, Maßnahmen- und Freigabeworkflows folgen in Schritt 2.</p>
   </section>`;
 };
})();