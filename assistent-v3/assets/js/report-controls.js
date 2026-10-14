(function(){
'use strict';
const A=window.HavarieApp, audit=window.HavarieReportAudit;
if(!A||!audit)return;
let last=null;
function capture(){
 const ev=A.evaluate(),d=A.S.d,project=A.project(),sub=A.currentSubstance();
 const activity=A.DATA.activities.find(x=>x.Taetigkeit_ID===d.activityId);
 const verdict=A.verdict(ev.res);
 const reasons=ev.res.open_measures.filter(x=>x.Status==='Offen').map(x=>({id:x.Offene_Massnahme_ID,title:x.Beschreibung}));
 return audit.capture({data:A.DATA,draft:d,project,substance:sub,activity,location:A.locationText(),barriers:A.barrierText(),result:ev.res,verdict,reasons});
}
function elem(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;}
function trace(snapshot,hash){
 const div=elem('section','report-section report-trace');
 const h=elem('h2','','07 · Prüfreferenz und Nachvollziehbarkeit');div.append(h);
 const rows=[
 ['Dokumentreferenz',snapshot.documentReference],['Erstellt (UTC)',snapshot.createdAt],
 ['Status','ENTWURF – FACHLICH NICHT FREIGEGEBEN'],
 ['SHA-256 des JSON-Datensatzes',hash||'Nicht verfügbar – keine Prüfsumme'],
 ['Regelwerk','Master '+snapshot.master.version+'; Export '+snapshot.master.exportedAt],
 ['Regeltreffer',snapshot.trace.rules.map(x=>x.Regel_ID+' / v'+x.Regelversion+' / '+x.Quelle_ID).join(', ')||'Keine'],
 ['Zugeordnete Meldekriterien (nur Prüfanlass)',snapshot.trace.criteria.map(x=>x.Meldekriterium_ID+' / '+(x.Freigabestatus||'ungeklärt')).join(', ')||'Keine'],
 ['Quellen',snapshot.trace.sources.map(x=>x.Quelle_ID+' / '+(x.Dokumentversion||'Versionsstand unbekannt')).join('; ')||'Keine']
 ];
 const dl=elem('dl','report-grid');
 for(const [k,v] of rows){const box=elem('div','report-field');box.append(elem('dt','',k),elem('dd','',v));dl.append(box);}
 div.append(dl,elem('p','','Prüfsumme nur zum lokalen Abgleich; kein revisionssicherer oder autorisierter Freigabenachweis.'));
 return div;
}
async function prepare(){
 const sheet=document.querySelector('#stage>.report-sheet');
 if(!sheet){A.toast('Prüfprotokoll nur in der Ergebnisansicht verfügbar.');return null;}
 const snapshot=capture(),hash=await audit.sha256(snapshot);
 // Async hash must not silently combine a changed form with an older report.
 if(JSON.stringify(A.S.d)!==JSON.stringify(snapshot.input)){A.toast('Eingaben haben sich geändert. Erneut versuchen.');return null;}
 sheet.querySelector('.report-trace')?.remove();
 const section=trace(snapshot,hash);
 const foot=sheet.querySelector('.report-footer');
 if(foot)foot.before(section);else sheet.append(section);
 last={snapshot,hash,html:sheet.innerHTML};
 A.postHeight();
 return last;
}
A.actions.print=async()=>{try{if(await prepare())window.print()}catch(e){A.toast('Druckvorbereitung fehlgeschlagen.')}};
A.actions['export-audit']=async()=>{
 try{
  const x=await prepare();if(!x)return;
  const data=JSON.stringify({...x.snapshot,checksum:{algorithm:'SHA-256',value:x.hash,scope:'snapshot'}},null,2);
  const url=URL.createObjectURL(new Blob([data],{type:'application/json;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download=x.snapshot.documentReference+'.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  A.toast('Entwurfsdatensatz exportiert – keine Freigabe.');
 }catch(e){A.toast('Export nicht möglich.');}
};
})();