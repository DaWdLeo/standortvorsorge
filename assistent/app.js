// GitHub Pages demonstration adapter. No network requests, Excel evaluation or releases.
const DEMO_OPTIONS={
  projects:[
    {id:'P-A',name:'Baustelle A (Beispiel)',site:'Standort A',manager:'Bauleitung (Rolle)',ground:'nicht fachlich geprüft',water:'nicht fachlich geprüft',excavation:'nicht fachlich geprüft',drainage:'nicht fachlich geprüft',retention:'nicht fachlich geprüft'},
    {id:'P-B',name:'Betriebshof B (Beispiel)',site:'Standort B',manager:'Standortverantwortung (Rolle)',ground:'nicht fachlich geprüft',water:'nicht fachlich geprüft',excavation:'nicht fachlich geprüft',drainage:'nicht fachlich geprüft',retention:'nicht fachlich geprüft'}
  ],
  products:[
    {id:'ST-001',name:'Beispielstoff Hydrauliköl',manufacturer:'Hersteller A (Beispiel)',state:'flüssig',sdb:'Muster – nicht geprüft',sdb_version:'Demo',release:'Nicht freigegeben'},
    {id:'ST-002',name:'Beispielstoff Kraftstoff',manufacturer:'Hersteller B (Beispiel)',state:'flüssig',sdb:'Muster – nicht geprüft',sdb_version:'Demo',release:'Nicht freigegeben'},
    {id:'ST-003',name:'Beispielstoff Reinigungsmittel',manufacturer:'Hersteller C (Beispiel)',state:'flüssig',sdb:'Muster – nicht geprüft',sdb_version:'Demo',release:'Nicht freigegeben'}
  ],
  activities:[
    {id:'T01',name:'Betankung (Beispiel)',description:'Nicht geprüfte Beispieltätigkeit'},
    {id:'T02',name:'Umfüllen (Beispiel)',description:'Nicht geprüfte Beispieltätigkeit'},
    {id:'T03',name:'Lagerung (Beispiel)',description:'Nicht geprüfte Beispieltätigkeit'}
  ],
  equipment:[
    {id:'A01',name:'Notfallausrüstung – Platzhalter',description:'Eignung und Bestand müssen extern geprüft werden',scope:'nicht bewertet'},
    {id:'A02',name:'Rückhaltung – Platzhalter',description:'Eignung und Bestand müssen extern geprüft werden',scope:'nicht bewertet'}
  ],
  demo_cases:['E001','E002','E003'],
  lists:{units:['l','kg','Stk','Set'],quantity_classes:['Klein','Mittel','Gross'],containers:['Kanister','Fass','Tank','IBC','Gebinde','Sonstiges'],dangerous_goods:['Nein','Ja','Zu pruefen']}
};
let DEMO_DRAFT=null,DEMO_ID='ENTWURF';
const statusDraft=()=>({
  result:{selected_id:DEMO_ID,overall_status:'Nicht bewertet',effective_release_status:'Nicht freigegeben',action:'Excel-Regelengine nicht verbunden – keine fachliche Bewertung oder Freigabe möglich.',rule_hits:'–',open_actions:'–',active_blocks:'–',automatic_release_capability:'Nicht ermittelt',manual_release_status:'Nicht freigegeben',case_summary:{'Projekt':DEMO_DRAFT?.project_name||'Beispiel, nicht ausgewählt','Stoff':DEMO_DRAFT?.product_name||'nicht ausgewählt','Tätigkeit':DEMO_DRAFT?.activity_name||'nicht ausgewählt','Menge':DEMO_DRAFT?.amount?String(DEMO_DRAFT.amount)+' '+(DEMO_DRAFT.unit||''): 'nicht erfasst'},measures:[],prerequisites:[],scenarios:[]},
  release:{effective_status:'Nicht freigegeben',manual_status:'Nicht freigegeben',decision:'Keine Fachprüfung',blocking_reasons:'nicht ermittelt',complete:'nicht bewertet',review_status:'Nicht erfolgt',dangerous_goods_status:'Nicht geprüft',specialist_review_required:'Ungeprüft'},
  event:{status:'Kein freigegebener Einsatzstand',reason:'GitHub-Pages-Demo ohne Excel-Bewertung, Fachprüfung und freigegebene Maßnahmen. Keine operative Notfallquelle.',specific_available:false,general_actions:[],details:{}},
  release_document:{exists:false,allowed:false,reason:'Kein wirksam freigegebener Stand – Dokumenterstellung deaktiviert.'}
});
async function staticDemoAPI(path,options={}){
  if(path==='/api/options')return DEMO_OPTIONS;
  if(path==='/api/health')return {ok:false,error:'GitHub-Pages-Demo – keine Excel-Verbindung'};
  if(path==='/api/state')return statusDraft();
  if(path==='/api/evaluate'){
    DEMO_DRAFT=JSON.parse(options.body||'{}');DEMO_ID=DEMO_DRAFT.einsatz_id||'ENTWURF';
    return statusDraft();
  }
  if(path==='/api/demo'){
    const id=JSON.parse(options.body||'{}').einsatz_id;
    if(!DEMO_OPTIONS.demo_cases.includes(id))throw Error('Unbekannter Demo-Fall');
    DEMO_ID=id;DEMO_DRAFT={einsatz_id:id,project_name:'Baustelle A (Beispiel)',product_name:'Beispielstoff Hydrauliköl',activity_name:'Betankung (Beispiel)',amount:20,unit:'l'};
    return statusDraft();
  }
  if(path==='/api/reset'){DEMO_DRAFT=null;DEMO_ID='ENTWURF';return statusDraft()}
  throw Error('In der öffentlichen Demo nicht verfügbar. Fachliche Bewertung, Freigabe, Excel-Steuerung und PDF-Erstellung benötigen das lokale Windows-/Excel-Backend.');
}

let OPTIONS=null, STATE=null, currentStep=1;
const TOTAL_STEPS=7;
const $=id=>document.getElementById(id);
const esc=t=>String(t??"").replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

async function api(path,options={}) { return staticDemoAPI(path,options); }
function showView(name){
  document.querySelectorAll('.app-view').forEach(v=>v.classList.toggle('active',v.id===`view-${name}`));
  document.querySelectorAll('.nav-item[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  window.scrollTo({top:0,behavior:'smooth'});
  if(name==='result'||name==='release'||name==='event'||name==='dashboard') refreshState();
}
function statusClass(text){
  const t=String(text||'').toUpperCase();
  if(t.includes('NICHT')||t.includes('SPERRE')||t.includes('STOFFKLAER')||t.includes('GEFAHRGUT'))return'red';
  if(t.includes('FREIGEGEBEN')||t==='AKTIV')return'green';
  if(t.includes('PRUEF')||t.includes('ÜBERPRÜF')||t.includes('UEBERPRUEF')||t.includes('MASSNAHMENBEDARF'))return'yellow';
  return'neutral';
}
function fillSelect(id, values, valueKey=null, labelKey=null, placeholder='Bitte auswählen'){
  const el=$(id);el.innerHTML=`<option value="">${placeholder}</option>`;
  values.forEach(v=>{const o=document.createElement('option');o.value=valueKey?v[valueKey]:v;o.textContent=labelKey?v[labelKey]:v;el.appendChild(o)});
}
function todayISO(offset=0){const d=new Date();d.setDate(d.getDate()+offset);return d.toISOString().slice(0,10)}

async function checkHealth(){
  try{
    const h=await api('/api/health');
    if(!h.ok)throw new Error(h.error);
    $('connectionDot').className='dot ok';$('connectionText').textContent='Excel verbunden';
    $('connectionDetail').textContent=`Excel ${h.excel_version} · Arbeitskopie aktiv`;
    $('toggleExcel').textContent=h.visible?'Excel ausblenden':'Excel anzeigen';
  }catch(e){$('connectionDot').className='dot error';$('connectionText').textContent='Nur Oberfläche · keine Excel-Engine';$('connectionDetail').textContent=e.message}
}
function renderStepper(){
  $('stepper').innerHTML='';
  ['Projekt','Stoff','Tätigkeit','Umgebung','Schutz','Ausrüstung','Prüfen'].forEach((l,i)=>{
    const c=document.createElement('div');c.className='step-chip '+(i+1===currentStep?'active':i+1<currentStep?'done':'');c.textContent=`${i+1} · ${l}`;$('stepper').appendChild(c)
  });
  document.querySelectorAll('.step').forEach(s=>s.classList.toggle('active',Number(s.dataset.step)===currentStep));
  $('prevStep').style.visibility=currentStep===1?'hidden':'visible';$('nextStep').style.display=currentStep===TOTAL_STEPS?'none':'inline-block';
}
function validateStep(){for(const e of document.querySelector(`.step[data-step="${currentStep}"]`).querySelectorAll('[required]')){if(!e.value){e.reportValidity();return false}}return true}
function updateProject(){
  const p=OPTIONS?.projects.find(x=>x.name===$('project_name').value);
  $('projectMeta').textContent=p?`${p.id} · ${p.site} · Verantwortung: ${p.manager||'nicht gepflegt'}`:'';
  $('siteProposal').innerHTML=p?`<strong>Standortvorschlag aus Excel</strong><br>Untergrund: ${esc(p.ground||'nicht gepflegt')}<br>Gewässerbezug: ${esc(p.water||'nicht gepflegt')}<br>Baugrube: ${esc(p.excavation||'nicht gepflegt')}<br>Entwässerung: ${esc(p.drainage||'nicht gepflegt')}<br>Rückhaltemöglichkeit: ${esc(p.retention||'nicht gepflegt')}`:'Bitte zuerst ein Projekt auswählen.';
}
function updateProduct(){
  const p=OPTIONS?.products.find(x=>x.name===$('product_name').value);
  $('productCard').innerHTML=p?`<strong>Stoffreferenz</strong> ${esc(p.id)}<br><strong>Hersteller</strong> ${esc(p.manufacturer||'–')}<br><strong>Aggregatzustand</strong> ${esc(p.state||'–')}<br><strong>SDB</strong> ${esc(p.sdb||'–')} · Version ${esc(p.sdb_version||'–')}<br><strong>Freigabestatus</strong> ${esc(p.release||'–')}`:'';
}

function updateDangerousGoodsHint(){
  const box=$('dangerousGoodsHint'); if(!box) return;
  const v=$('dangerous_goods').value;
  if(!v){box.className='context-hint span-2 hidden';box.innerHTML='';return}
  if(v==='Nein'){
    box.className='context-hint span-2 info';
    box.innerHTML='<strong>Hinweis</strong>Für diesen Einsatz wird aktuell kein Gefahrgutbezug angegeben. Excel prüft anschließend trotzdem alle übrigen Voraussetzungen.';
  }else{
    box.className='context-hint span-2 warn';
    box.innerHTML='<strong>Fachprüfung erforderlich</strong>Der Assistent trifft keine automatische Gefahrgutentscheidung. Nach der Bewertung muss die zuständige Gefahrgutfunktion eingebunden bzw. deren Prüfstatus dokumentiert werden.';
  }
}
function updateEnvironmentHint(){
  const box=$('environmentHint'); if(!box) return;
  const drainage=$('drainage_relation').value, retention=$('retention_available').value;
  if(!drainage && !retention){box.className='context-hint span-2 hidden';box.innerHTML='';return}
  if(drainage==='Ja' && retention==='Nein'){
    box.className='context-hint span-2 danger';
    box.innerHTML='<strong>Achtung – relevante Konstellation</strong>Entwässerungsbezug ist vorhanden, gleichzeitig wurde keine Rückhaltung bestätigt. Der Assistent bewertet diese Kombination erst nach dem Absenden in Excel; sie kann Maßnahmen oder eine Sperre auslösen.';
  }else if(drainage==='Ja' || retention==='Zu pruefen' || drainage==='Zu pruefen'){
    box.className='context-hint span-2 warn';
    box.innerHTML='<strong>Bitte besonders sorgfältig prüfen</strong>Entwässerung oder Rückhaltung ist für den konkreten Einsatz noch relevant bzw. nicht eindeutig. Dokumentiere die tatsächliche Situation – Excel bewertet anschließend die Freigabewirkung.';
  }else{
    box.className='context-hint span-2 info';
    box.innerHTML='<strong>Standortangabe erfasst</strong>Diese Angaben fließen zusammen mit den Standortstammdaten in die nachfolgende Bewertung ein.';
  }
}
function updateActivity(){const a=OPTIONS?.activities.find(x=>x.name===$('activity_name').value);$('activityMeta').textContent=a?`${a.id} · ${a.description||''}`:''}
function addEquipment(){
  const f=$('equipmentTemplate').content.cloneNode(true),row=f.querySelector('.equipment-row'),sel=row.querySelector('.eq-id');
  sel.innerHTML='<option value="">Bitte auswählen</option>';OPTIONS.equipment.forEach(e=>{const o=document.createElement('option');o.value=e.id;o.textContent=`${e.id} · ${e.name}`;sel.appendChild(o)});
  sel.addEventListener('change',()=>{const e=OPTIONS.equipment.find(x=>x.id===sel.value);row.querySelector('.eq-info').textContent=e?`${e.description||''} · Eignungsbereich: ${e.scope||'–'}`:''});
  row.querySelector('.remove-equipment').addEventListener('click',()=>row.remove());$('equipmentList').appendChild(row);
}
function equipmentPayload(){return[...document.querySelectorAll('.equipment-row')].map(r=>({equipment_id:r.querySelector('.eq-id').value,required_qty:Number(r.querySelector('.eq-required').value||0),unit:r.querySelector('.eq-unit').value,available_qty:Number(r.querySelector('.eq-available').value||0),location:r.querySelector('.eq-location').value,accessible:r.querySelector('.eq-access').value,inspection_status:r.querySelector('.eq-inspection').value,suitability_confirmed:r.querySelector('.eq-suitable').value,blocking_if_missing:r.querySelector('.eq-blocking').value})).filter(x=>x.equipment_id)}
function inputPayload(){return{einsatz_id:$('einsatz_id').value.trim(),project_name:$('project_name').value,location_description:$('location_description').value.trim(),executing_company:$('executing_company').value.trim(),start_date:$('start_date').value,end_date:$('end_date').value,responsible_person:$('responsible_person').value.trim(),product_name:$('product_name').value,sdb_confirmed:$('sdb_confirmed').value,activity_name:$('activity_name').value,amount:Number($('amount').value),unit:$('unit').value,quantity_class:$('quantity_class').value,container_type:$('container_type').value,dangerous_goods:$('dangerous_goods').value,ground_override:$('ground_override').value.trim(),water_override:$('water_override').value.trim(),excavation_override:$('excavation_override').value.trim(),drainage_relation:$('drainage_relation').value,retention_available:$('retention_available').value,protection_barriers:$('protection_barriers').value.trim(),equipment:equipmentPayload()}}
function updateReview(){const p=inputPayload();$('reviewSummary').innerHTML=`<strong>Projekt:</strong> ${esc(p.project_name||'–')}<br><strong>Stoff:</strong> ${esc(p.product_name||'–')}<br><strong>Tätigkeit:</strong> ${esc(p.activity_name||'–')}<br><strong>Menge:</strong> ${esc(p.amount||'–')} ${esc(p.unit||'')} · ${esc(p.container_type||'–')}<br><strong>Gefahrgut:</strong> ${esc(p.dangerous_goods||'–')}<br><strong>Ausrüstung:</strong> ${p.equipment.length} Position(en)`}

function tableHtml(rows, columns){
  if(!rows?.length)return'<div class="empty-state">Keine Einträge für den aktuellen Fall.</div>';
  return`<table class="data-table"><thead><tr>${columns.map(c=>`<th>${esc(c[1])}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${columns.map(c=>`<td>${esc(r[c[0]]||'')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function openPrerequisites(result){
  return (result.prerequisites||[]).filter(p=>String(p.status||'').trim() && String(p.status||'').trim()!=='Erledigt');
}
function releaseObstacleItems(state){
  const r=state.result||{}, rel=state.release||{}, items=[];
  if(String(rel.blocking_reasons||'') && String(rel.blocking_reasons)!=='0') items.push(`Excel meldet offene Sperrgründe: ${rel.blocking_reasons}.`);
  openPrerequisites(r).forEach(p=>items.push(`${p.description} - Status: ${p.status}${p.blocking==='Ja'?' (sperrend)':''}.`));
  if(rel.specialist_review_required==='Ja') items.push('Excel meldet: Fachprüfung erforderlich.');
  if(rel.review_status && !String(rel.review_status).toLowerCase().includes('nicht erforderlich') && rel.review_status!=='Freigegeben') items.push(`Reviewstatus: ${rel.review_status}.`);
  if(rel.dangerous_goods_status && !String(rel.dangerous_goods_status).toLowerCase().includes('nicht erforderlich') && rel.dangerous_goods_status!=='Freigegeben') items.push(`Gefahrgut-Prüfstatus: ${rel.dangerous_goods_status}.`);
  if(!items.length) items.push('Keine offenen Hinderungsgründe aus den aktuell dargestellten Excel-Statusinformationen.');
  return items;
}
function renderReleaseDocument(doc, effectiveStatus){
  const allowed=!!doc?.allowed, exists=!!doc?.exists;
  const title=allowed?'Einsatz wirksam freigegeben':'Noch kein freigegebener Stand vorhanden';
  const hint=allowed
    ? (exists?`Für ${doc.document_id} existiert bereits ein Freigabedokument.`:'Der freigegebene Stand kann jetzt als separates PDF dokumentiert werden.')
    : (doc?.reason||`Freigabedokument erst nach wirksamer Freigabe. Aktueller Status: ${effectiveStatus||'–'}.`);

  [['result','generateReleaseDocumentResult'],['release','generateReleaseDocumentRelease']].forEach(([prefix,buttonId])=>{
    const card=$(`${prefix}DocumentCard`),t=$(`${prefix}DocumentTitle`),h=$(`${prefix}DocumentHint`),link=$(`${prefix}DocumentLink`),button=$(buttonId);
    if(!card||!button)return;
    card.classList.toggle('available',allowed);
    card.classList.toggle('blocked',!allowed);
    t.textContent=title;h.textContent=hint;
    button.disabled=!allowed||exists;
    button.textContent=exists?'Freigabedokument vorhanden':'Freigabedokument erzeugen';
    if(exists&&doc.url){link.href=doc.url;link.classList.remove('hidden');link.textContent=`${doc.document_id} öffnen`;}
    else{link.classList.add('hidden');link.removeAttribute('href');}
  });
}
async function generateReleaseDocument(button){
  if(!STATE?.result?.selected_id)return;
  const old=button.textContent;button.disabled=true;button.textContent='PDF wird erzeugt …';
  try{
    const x=await api('/api/document/release',{method:'POST',body:JSON.stringify({einsatz_id:STATE.result.selected_id})});
    await refreshState();
    alert(x.existing
      ? `Für diese Bewertungsfassung existiert bereits ein Dokument:\n${x.document_id}`
      : `Freigabedokument erzeugt:\n${x.document_id}\n${x.filename}`);
  }catch(e){alert(`Freigabedokument konnte nicht erzeugt werden:\n${e.message}`);await refreshState();}
  finally{if(!button.disabled)button.textContent=old;}
}

function renderState(state){
  STATE=state;const r=state.result,rel=state.release,ev=state.event,cls=statusClass(r.effective_release_status||r.overall_status);
  $('dashOverall').textContent=r.overall_status||'–';$('dashEffective').textContent=`Wirksamer Status: ${r.effective_release_status||'–'}`;$('dashBadge').className=`status-badge ${cls}`;$('dashBadge').textContent=r.effective_release_status||'STATUS';
  const doc=state.release_document||{};
  $('dashDocument').textContent=doc.exists?doc.document_id:(doc.allowed?'noch nicht erzeugt':'nicht erzeugbar');
  $('processCase').textContent=r.selected_id||'–';
  $('processEvaluation').textContent=r.overall_status||'–';
  $('processReview').textContent=rel.decision||'noch nicht dokumentiert';
  $('processRelease').textContent=rel.effective_status||'–';
  $('processDocument').textContent=doc.exists?doc.document_id:(doc.allowed?'noch nicht erzeugt':'noch nicht möglich');
  $('processDocumentStatus').textContent=doc.exists?'erzeugt':(doc.allowed?'jetzt möglich':'noch nicht möglich');

  $('dashAction').textContent=r.action||'–';$('dashRules').textContent=r.rule_hits||'0';$('dashOpen').textContent=r.open_actions||'0';$('dashBlocks').textContent=r.active_blocks||'0';$('dashEvent').textContent=ev.specific_available?'Spezifisch verfügbar':'Fail-Safe';

  $('overallStatus').textContent=r.overall_status||'–';$('effectiveStatus').textContent=`Wirksamer Freigabestatus: ${r.effective_release_status||'–'}`;$('statusBadge').className=`status-badge ${cls}`;$('statusBadge').textContent=r.effective_release_status||'STATUS';
  $('actionText').textContent=r.action||'–';$('automaticRelease').textContent=r.automatic_release_capability||'–';$('manualRelease').textContent=r.manual_release_status||'–';$('effectiveRelease').textContent=r.effective_release_status||'–';$('openActions').textContent=r.open_actions||'0';$('activeBlocks').textContent=r.active_blocks||'0';
  $('caseSummary').innerHTML=Object.entries(r.case_summary||{}).map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v||'–')}</dd></div>`).join('');
  $('eventMode').textContent=ev.status||'–';$('eventReason').textContent=ev.reason||'';
  $('measuresTable').innerHTML=tableHtml(r.measures,[['title','Titel'],['wording','Freigegebener Wortlaut'],['equipment_role','Ausrüstung / Rolle'],['source','Quelle']]);
  $('prerequisitesTable').innerHTML=tableHtml(r.prerequisites,[['description','Voraussetzung'],['blocking','Sperrend'],['owner','Verantwortung'],['status','Status']]);
  $('scenariosTable').innerHTML=tableHtml(r.scenarios,[['scenario','Szenario'],['protected_asset','Schutzgut'],['rule','Regel']]);

  $('releaseEffective').textContent=rel.effective_status||'–';$('relComplete').textContent=rel.complete||'–';$('relBlocks').textContent=rel.blocking_reasons||'0';$('relReview').textContent=rel.review_status||'–';$('relDangerous').textContent=rel.dangerous_goods_status||'–';
  $('releaseManualProminent').textContent=rel.manual_status||'–';
  $('releaseEffectiveProminent').textContent=rel.effective_status||'–';
  $('releaseObstacles').innerHTML=releaseObstacleItems(state).map(x=>`<li>${esc(x)}</li>`).join('');
  renderReleaseDocument(state.release_document||{},rel.effective_status||r.effective_release_status);

  $('rel_reviewer').value=rel.reviewer||'';$('rel_decision').value=rel.decision||'Freigegeben';$('rel_comment').value=rel.comment||'';$('rel_approver').value=rel.approver||'';$('rel_manual_status').value=rel.manual_status||'Freigegeben';
  if(!$('rel_review_date').value)$('rel_review_date').value=todayISO();

  const eh=$('eventStatusHero');eh.className=`event-status ${ev.specific_available?'available':'unavailable'}`;$('eventStatus').textContent=ev.status||'–';$('eventStatusReason').textContent=ev.reason||'';
  $('generalActions').innerHTML=(ev.general_actions||[]).map(a=>`<li>${esc(a.replace(/^\d+\.\s*/,''))}</li>`).join('');
  const d=ev.details||{};
  $('eventImmediate').textContent=ev.specific_available?(d.immediate_actions||'Keine spezifische Maßnahme hinterlegt.'):'Keine einsatzspezifische Sofortmaßnahme freigegeben – allgemeine SOFORT-Logik anwenden.';
  $('eventLimits').textContent=ev.specific_available?`Einsatzgrenzen: ${d.limits||'–'}\nAbbruchkriterien: ${d.abort_criteria||'–'}`:'';
  $('eventProtect').textContent=ev.specific_available?`Verbote / Schutzgrenzen:\n${d.prohibitions||'–'}\n\nAusrüstung:\n${d.equipment||'–'}\nStandort: ${d.equipment_location||'–'}`:'Keine freigegebene einsatzbezogene Ausrüstung verfügbar – allgemeine Notfalllogik anwenden.';
  $('eventContacts').textContent=`Interne Kontakte:\n${d.internal_contacts||'Interne Notfallstelle informieren.'}\n\nEskalation:\n${d.external_escalation||'Nur nach freigegebenem standortbezogenem Prozess.'}`;
  $('eventDetails').innerHTML=Object.entries({Projekt:d.project,Einsatz:d.case,Freigabe:d.release,Warnhinweise:d.warnings,Szenario:d.scenario,SDB:d.sds,Betriebsanweisung:d.operating_instruction}).map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v||'–')}</dd></div>`).join('');
}
async function refreshState(){try{renderState(await api('/api/state'))}catch(e){console.error(e)}}

async function init(){
  await checkHealth();OPTIONS=await api('/api/options');
  fillSelect('project_name',OPTIONS.projects,'name','name');fillSelect('product_name',OPTIONS.products,'name','name');fillSelect('activity_name',OPTIONS.activities,'name','name');fillSelect('unit',OPTIONS.lists.units);fillSelect('quantity_class',OPTIONS.lists.quantity_classes);fillSelect('container_type',OPTIONS.lists.containers);fillSelect('dangerous_goods',OPTIONS.lists.dangerous_goods);fillSelect('demoCase',OPTIONS.demo_cases,null,null,'Demo-Fall');
  $('start_date').value=todayISO();$('end_date').value=todayISO();$('rel_review_date').value=todayISO();
  $('project_name').addEventListener('change',updateProject);$('product_name').addEventListener('change',updateProduct);$('activity_name').addEventListener('change',updateActivity);$('addEquipment').addEventListener('click',addEquipment);$('dangerous_goods').addEventListener('change',updateDangerousGoodsHint);$('drainage_relation').addEventListener('change',updateEnvironmentHint);$('retention_available').addEventListener('change',updateEnvironmentHint);
  document.querySelectorAll('.nav-item[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.go)));
  $('nextStep').addEventListener('click',()=>{if(!validateStep())return;if(currentStep<TOTAL_STEPS)currentStep++;if(currentStep===TOTAL_STEPS)updateReview();renderStepper()});$('prevStep').addEventListener('click',()=>{if(currentStep>1)currentStep--;renderStepper()});
  $('wizardForm').addEventListener('submit',async e=>{e.preventDefault();const b=$('evaluateButton');b.disabled=true;b.textContent='Excel berechnet …';try{await api('/api/evaluate',{method:'POST',body:JSON.stringify(inputPayload())});await refreshState();showView('result')}catch(err){alert(`Bewertung fehlgeschlagen:\n${err.message}`)}finally{b.disabled=false;b.textContent='Eingaben ohne Bewertung anzeigen';await checkHealth()}});
  $('releaseForm').addEventListener('submit',async e=>{e.preventDefault();const payload={reviewer:$('rel_reviewer').value,review_date:$('rel_review_date').value,decision:$('rel_decision').value,comment:$('rel_comment').value,approver:$('rel_approver').value,approval_date:$('rel_approval_date').value,valid_until:$('rel_valid_until').value,manual_status:$('rel_manual_status').value};try{const x=await api('/api/release',{method:'POST',body:JSON.stringify(payload)});renderState(x);alert(`Prüfentscheidung gespeichert.\nWirksamer Status: ${x.release.effective_status}`)}catch(err){alert(err.message)}});
  $('loadDemo').addEventListener('click',async()=>{if(!$('demoCase').value)return;try{await api('/api/demo',{method:'POST',body:JSON.stringify({einsatz_id:$('demoCase').value})});await refreshState()}catch(e){alert(e.message)}});
  $('toggleExcel').addEventListener('click',async()=>{try{const r=await api('/api/excel/toggle-visible',{method:'POST',body:'{}'});$('toggleExcel').textContent=r.visible?'Excel ausblenden':'Excel anzeigen'}catch(e){alert(e.message)}});
  $('generateReleaseDocumentResult').addEventListener('click',e=>generateReleaseDocument(e.currentTarget));$('generateReleaseDocumentRelease').addEventListener('click',e=>generateReleaseDocument(e.currentTarget));$('resetWorkbook').addEventListener('click',async()=>{if(!confirm('Arbeitskopie auf Master 2.8 zurücksetzen?'))return;try{const r=await api('/api/reset',{method:'POST',body:'{}'});await refreshState();showView('dashboard')}catch(e){alert(e.message)}});
  $('toggleExcel').hidden=true;
  $('resetWorkbook').hidden=true;
  $('saveRelease').disabled=true;
  $('saveRelease').textContent='Freigabe in GitHub Pages nicht möglich';
  $('evaluateButton').textContent='Eingaben ohne Bewertung anzeigen';
  addEquipment();updateProject();updateProduct();updateActivity();updateDangerousGoodsHint();updateEnvironmentHint();renderStepper();await refreshState();
}
init().catch(e=>{$('connectionDot').className='dot error';$('connectionText').textContent='Start fehlgeschlagen';$('connectionDetail').textContent=e.message});
