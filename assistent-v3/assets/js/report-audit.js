/* Auditierbarer ENTWURFS-Export. Keine Freigabe, kein revisionssicherer Speicher. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.HavarieReportAudit=factory();
}(typeof self!=='undefined'?self:this,function(){
 'use strict';
 const copy=value=>JSON.parse(JSON.stringify(value));
 const n=value=>String(value===undefined||value===null?'':value).trim();
 function capture({data,draft,project,substance,activity,location,barriers,result,verdict,reasons,createdAt,reference}){
  const rules=(result.rules||[]).filter(r=>r.hit).map(r=>({
   Regel_ID:r.Regel_ID,Regelversion:r.Regelversion,Regeltitel:r.Regeltitel,
   Status:r.Status,Prioritaet:r.Prioritaet,Sperre:r.Sperre,
   Handlungskategorie:r.Handlungskategorie,Quelle_ID:r.Quelle_ID,
   Meldekriterium_ID:r.Meldekriterium_ID
  }));
  const reportingIds=[...new Set(rules.map(r=>r.Meldekriterium_ID).filter(Boolean))];
  const criteria=reportingIds.map(id=>{
   const found=(data.reporting_criteria||[]).find(x=>x.Meldekriterium_ID===id);
   return found?{Meldekriterium_ID:id,Bezeichnung:found.Bezeichnung,Version:found.Version,
    Freigabestatus:found.Freigabestatus,Quelle:found.Quelle||''}
    :{Meldekriterium_ID:id,missing:true};
  });
  const measures=(result.derived_measures||[]).map(m=>({
   Massnahme_ID:m.Massnahme_ID,Massnahmenversion:m.Massnahmenversion,
   Ausloesende_Regel_ID:m.Ausloesende_Regel_ID,Quelle_ID:m.Quelle_ID
  }));
  const sourceIds=[...new Set([...rules.map(r=>r.Quelle_ID),...criteria.map(c=>c.Quelle),...measures.map(m=>m.Quelle_ID)].filter(Boolean))];
  const sources=sourceIds.map(id=>{
   const f=(data.sources||[]).find(x=>x.Quelle_ID===id);
   return f?{Quelle_ID:id,Bezeichnung:f.Bezeichnung,Dokumentversion:f.Dokumentversion,
    Fundstelle:f.Fundstelle,Fachlich_geprueft:f.Fachlich_geprueft,Pruefdatum:f.Pruefdatum}
    :{Quelle_ID:id,missing:true};
  });
  const at=createdAt||new Date().toISOString();
  const ref=reference||'ENTWURF-'+at.replace(/[-:.TZ]/g,'').slice(0,14)+'-'+Math.random().toString(36).slice(2,8).toUpperCase();
  return copy({
   schema:1,documentType:'Vorab-Prüfprotokoll',
   status:'ENTWURF – FACHLICH NICHT FREIGEGEBEN',
   documentReference:ref,createdAt:at,
   master:{version:data.meta.master_version,exportedAt:data.meta.exported_at,exampleData:!!data.meta.example_data},
   input:draft,
   project:{id:project?.Projekt_ID||'',name:project?.Projektbezeichnung||'',location:location||'',barriers:barriers||''},
   substance:{id:substance?.master?.Stoffreferenz_ID||'',name:substance?.name||''},
   activity:{id:activity?.Taetigkeit_ID||'',name:activity?.Bezeichnung||''},
   assessment:{
    verdict:verdict.key,complete:!!result.complete,overallStatus:n(result.overall_status),
    ruleHits:result.rule_hits,blocks:result.blocks,openCount:result.open_count,
    mandatory:{done:result.pflicht?.progress,total:result.pflicht?.total},
    inputValidation:result.input_validation||null,
    openReasons:(reasons||[]).map(r=>({title:r.title,text:r.text||'',id:r.id||''}))
   },
   trace:{rules,criteria,measures,sources},
   approval:{approved:false,person:null,approvedAt:null,validUntil:null},
   warning:'Öffentliche Beispieldaten und lokale Entwurfsausgabe. Kein Freigabedokument, keine operative Notfallanweisung.'
  });
 }
 async function sha256(snapshot){
  const subtle=(typeof globalThis!=='undefined'&&globalThis.crypto&&globalThis.crypto.subtle)||null;
  if(!subtle)return null;
  const bytes=new TextEncoder().encode(JSON.stringify(snapshot));
  const digest=await subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 }
 return {capture,sha256};
}));
