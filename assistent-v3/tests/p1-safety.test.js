const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const E=require('../assets/js/engine.js');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/regelwerk.json'),'utf8'));
const base={projectId:data.projects[0].Projekt_ID,substanceId:data.substances[0].Stoffreferenz_ID,activityId:data.activities[0].Taetigkeit_ID,amount:10,unit:'l',quantityClass:'Klein',container:'Kanister',ground:'Befestigt',drainage:'Nein',water:'Nein',excavation:'Nein',retention:'Ja',dangerousGoods:'Nein',sdbConfirmed:'Ja',location:'TEST',creator:'TEST'};
for(const amount of [0,-4,'abc','',null,Infinity,'1e999']){
 test('P1 rejects quantity '+String(amount),()=>{
  const d={...base,amount};const r=E.evaluate(data,d,{strictUnclear:true});
  assert.equal(r.input_validation.valid,false);
  assert.equal(r.complete,false);
  assert.equal(r.overall_status,'ANGABEN UNVOLLSTAENDIG');
  assert.equal(r.pflicht.complete,false);
 });
}
for(const unit of ['ml','m³','INVALID','']){
 test('P1 rejects unlisted unit '+unit,()=>{
  const r=E.evaluate(data,{...base,unit},{strictUnclear:true});
  assert.equal(r.input_validation.valid,false);
  assert.equal(r.complete,false);
  assert.equal(r.overall_status,'ANGABEN UNVOLLSTAENDIG');
 });
}
test('P1 accepts listed units without conversion',()=>{
 for(const unit of data.lists.units){
  const r=E.evaluate(data,{...base,unit},{strictUnclear:true});
  assert.equal(r.input_validation.valid,true);
  assert.equal(r.inputs.unit,unit);
 }
});
test('P1 rejects unknown quantity classes and containers',()=>{
 for(const patch of [{quantityClass:'??'},{container:'??'}]){
  const r=E.evaluate(data,{...base,...patch},{strictUnclear:true});
  assert.equal(r.input_validation.valid,false);
  assert.equal(r.complete,false);
 }
});
test('P1 report must not invent MK01 when there is no linked rule',()=>{
 const s=fs.readFileSync(path.join(__dirname,'../assets/js/views-result.js'),'utf8');
 assert.doesNotMatch(s,/ids\.length\s*\?\s*ids\s*:\s*\['MK01'\]/);
 assert.match(s,/const list = ids;/);
 assert.match(s,/!DATA\.meta\.example_data/);
});
