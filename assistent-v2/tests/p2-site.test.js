const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = path.join(__dirname,'..');
const read = p => fs.readFileSync(path.join(base,p),'utf8');
test('P2 site references are separated from the core evaluation draft', () => {
 const app=read('assets/js/app.js');
 const create=app.match(/function blankDraft\(\)[\s\S]*?const A =/);
 assert.ok(create);
 assert.match(create[0],/siteDocs:/);
 const building=app.match(/A\.buildDraft\s*=\s*function[\s\S]*?return draft;/);
 assert.ok(building);
 assert.doesNotMatch(building[0],/siteDocs|scenarioReview|protectionArea/);
});
test('P2 references are sanitized, retained locally and do not change existing storage key', () => {
 const app=read('assets/js/app.js');
 assert.match(app,/KEY = 'havarie\.pages\.v1'/);
 assert.match(app,/x\.siteDocs/);
 assert.match(app,/A\.siteDocsStatus/);
 assert.match(app,/scenarioReview\.filter/);
});
test('P2 scenario selection is explicitly non-operational and multiple', () => {
 const src=read('assets/js/views-main.js');
 assert.match(src,/type="checkbox" data-bind="@siteScenario"/);
 assert.match(src,/A\.binders\.siteScenario/);
 assert.match(src,/Hierdurch werden keine Szenarien als zutreffend bestätigt/);
});
test('P2 report prints source-free additional references separately from evaluation', () => {
 const src=read('assets/js/views-result.js');
 assert.match(src,/Standortunterlagen und offene Kontextprüfung/);
 assert.match(src,/nicht fachlich geprüft und nicht für Regelentscheidungen ausgewertet/);
 assert.match(src,/Zu prüfende Szenarien \(unbestätigt\)/);
});
test('P1 checks remain installed and an emergency plan cannot become approved by P2 fields', () => {
 const engine=read('assets/js/engine.js');
 const report=read('assets/js/views-result.js');
 const industrial=read('assets/js/industrial.js');
 assert.match(engine,/validateInput/);
 assert.match(report,/!DATA\.meta\.example_data/);
 assert.match(industrial,/Keine freigegebenen Einsatzunterlagen verfügbar/);
});
