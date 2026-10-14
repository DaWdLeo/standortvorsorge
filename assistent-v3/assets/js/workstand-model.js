/* Status model for V3 pilot samples – not the ISO rule engine or an approval service.
   An example release state is supplied by a fixed demo fixture, NEVER derived from form completeness. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.HavarieWorkstandModel=factory();
})(typeof self!=='undefined'?self:this,function(){
 'use strict';
 const FIXTURES=Object.freeze([
  {id:'ES-01',substance:'Diesel',activity:'Lagerung',location:'L01 · Lagercontainer Nord',
   captured:true,measureSampleConfirmed:true,approvalSampleRecorded:true,
   role:'Fachfunktion Umwelt (Beispiel)',task:'Muster-Freigabestand und Gültigkeit bei Änderungen prüfen',
   after:'Bei Änderungen des Stoffs oder Lagerorts neue Fachprüfung veranlassen',
   source:'SDB-01 · fiktiv · Version 3',quantity:'Musterangabe, nicht verifiziert',
   measures:'MB-01 · fiktiver Maßnahmennachweis (Muster)'},
  {id:'ES-02',substance:'Diesel',activity:'Betankung',location:'B02 · Betankungsplatz Ost',
   captured:false,measureSampleConfirmed:false,approvalSampleRecorded:false,
   role:'Bauleitung (Beispiel)',task:'Ableitungsziel D02 klären',
   after:'Maßnahmenbasis MB-02 zuordnen und fachlich prüfen lassen',
   source:'SDB-01 · fiktiv · Version 3',quantity:'300 l · mobiler Tank (Beispiel)',
   measures:'MB-02 · fiktive Maßnahmenbasis · Zuordnung offen'},
  {id:'ES-03',substance:'Schalöl',activity:'Anwendung',location:'A03 · Arbeitsbereich Süd',
   captured:true,measureSampleConfirmed:false,approvalSampleRecorded:false,
   role:'Fachfunktion Umwelt (Beispiel)',task:'Maßnahmenabdeckung fachlich prüfen',
   after:'Erst nach dokumentierter Maßnahmenprüfung fachliche Entscheidung möglich',
   source:'SDB-03 · fiktiv · Version 2',quantity:'Musterangabe, nicht verifiziert',
   measures:'Fachliche Prüfung ausstehend'}
 ]);
 const FILTERS=['all','needs','review','approved','capture','coverage','approval'];
 const SORTS=['priority','id'];
 const DRAINAGE=['','D02-MUSTER','KEINE-ABLEITUNG'];
 function cases(state){
  const drainage=DRAINAGE.includes(state?.drainage)?state.drainage:'';
  return FIXTURES.map(c=>{
   const captured=c.id==='ES-02'?Boolean(drainage):c.captured;
   const coverage=c.measureSampleConfirmed;
   const approval=c.approvalSampleRecorded;  // sample fixture, not an application approval
   const level=approval?'approved':!captured?'needs':'review';
   const task=c.id==='ES-02'&&captured?'Maßnahmenbasis MB-02 zuordnen und prüfen lassen':c.task;
   const role=c.id==='ES-02'&&captured?'Fachfunktion Umwelt (Beispiel)':c.role;
   return {...c,captured,coverage,approval,level,task,role};
  });
 }
 function summary(rows){
  return {total:rows.length,captured:rows.filter(x=>x.captured).length,
   covered:rows.filter(x=>x.coverage).length,
   approvedSample:rows.filter(x=>x.approval).length,
   scopeConfirmed:false};  // scope always unconfirmed: no verified Bauleitung role
 }
 function filtered(rows,filter,sort){
  const result=rows.filter(c=>
   filter==='all' || (filter==='needs'&&!c.captured) ||
   (filter==='review'&&c.captured&&!c.approval) ||
   (filter==='approved'&&c.approval) ||
   (filter==='capture'&&!c.captured) ||
   (filter==='coverage'&&!c.coverage) ||
   (filter==='approval'&&!c.approval));
  return result.sort((a,b)=>sort==='id'?a.id.localeCompare(b.id):
   ({needs:0,review:1,approved:2}[a.level]-{needs:0,review:1,approved:2}[b.level])||a.id.localeCompare(b.id));
 }
 return {cases,summary,filtered,FILTERS,SORTS,DRAINAGE};
});