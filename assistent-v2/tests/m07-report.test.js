const test=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const report=require('../assets/js/report-audit.js');
const d=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/regelwerk.json'),'utf8'));
const fixture={data:d,draft:{amount:10,unit:'l',siteDocs:{bePlanId:'EXAMPLE'}},project:d.projects[0],substance:{name:'Musterstoff',master:d.substances[0]},activity:d.activities[0],location:'Testort',barriers:'Musterbarriere',result:{rules:[{...d.rules[0],hit:true}],rule_hits:1,blocks:0,open_count:0,complete:true,pflicht:{progress:7,total:7},open_measures:[],derived_measures:[]},verdict:{key:'fachpruefung'},reasons:[],createdAt:'2026-10-14T12:00:00.000Z',reference:'ENTWURF-TEST'};
test('M07 frozen copy is not modified by later edits',()=>{
 const s=report.capture(fixture);
 fixture.draft.amount=999;assert.equal(s.input.amount,10);
 assert.equal(s.approval.approved,false);
 assert.match(s.status,/NICHT FREIGEGEBEN/);
 assert.equal(s.trace.rules[0].Regel_ID,d.rules[0].Regel_ID);
 assert.ok(s.trace.sources.length>0);
});
test('M07 no fabricated reporting criterion if rule has none',()=>{
 const result={...fixture.result,rules:[{...d.rules[0],Meldekriterium_ID:'',hit:true}]};
 assert.equal(report.capture({...fixture,result}).trace.criteria.length,0);
});
test('M07 SHA-256 is deterministic when available',async()=>{
 const s=report.capture(fixture),a=await report.sha256(s);
 if(a!==null){assert.match(a,/^[0-9a-f]{64}$/);assert.equal(a,await report.sha256(s));}
});
test('M07 report stays explicitly draft-only',()=>{
 const ctl=fs.readFileSync(path.join(__dirname,'../assets/js/report-controls.js'),'utf8');
 const view=fs.readFileSync(path.join(__dirname,'../assets/js/views-result.js'),'utf8');
 assert.match(ctl,/ENTWURF – FACHLICH NICHT FREIGEGEBEN/);
 assert.match(ctl,/keine Freigabe/);
 assert.match(view,/data-act="export-audit"/);
});
