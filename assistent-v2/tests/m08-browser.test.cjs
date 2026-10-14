/* Browser verification of the PUBLIC DEMONSTRATOR: fictional data only.
 * Requires playwright + Chromium, local static server on port 8765.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {chromium} = require('playwright');
const BASE = process.env.HAVARIE_TEST_URL || 'http://127.0.0.1:8765/assistent-v2/';
const OUT=path.join(__dirname,'artifacts');
fs.mkdirSync(OUT,{recursive:true});
let browser;
test.before(async()=>{browser=await chromium.launch({headless:true});});
test.after(async()=>{if(browser)await browser.close();});
async function openPage(width,height=850,relative=''){
 const context=await browser.newContext({viewport:{width,height},acceptDownloads:true,reducedMotion:'reduce'});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 const r=await page.goto(BASE+relative,{waitUntil:'load'});
 assert.equal(r.status(),200);
 if(!relative.includes('embed-demo.html')) await page.locator('#stage [data-heading]').first().waitFor({timeout:12000});
 return {page,context,errors};
}
function checkErrors(errors,area){assert.deepEqual(errors,[],area+': No unhandled JavaScript exceptions');}
async function overflow(page,width,area){
 const data=await page.evaluate(()=>{
  const vw=document.documentElement.clientWidth;
  const offenders=[...document.querySelectorAll('body *')].filter(el=>{
    if(el.closest('.report-sheet'))return false;
    const css=getComputedStyle(el);
    if(css.display==='none'||css.visibility==='hidden'||css.position==='fixed')return false;
    const box=el.getBoundingClientRect();
    return box.width>0&&(box.right>vw+3||box.left < -3);
  }).slice(0,10).map(el=>({tag:el.tagName,cls:String(el.className).slice(0,90)}));
  return {scroll:document.documentElement.scrollWidth,client:vw,offenders};
 });
 assert.ok(data.scroll<=data.client+3,area+' '+width+': horizontal overflow '+JSON.stringify(data));
}
test('M08 widths 360, 390, 768, 1280, 1920: start view and accessible navigation',async()=>{
 for(const width of [360,390,768,1280,1920]){
  const {page,context,errors}=await openPage(width);
  try{
   assert.match(await page.locator('#stage').innerText(),/Umweltvorsorge/);
   const menu=width<=900?'.industrial-bottom-item':'.industrial-nav-item';
   assert.equal(await page.locator(menu+':visible').count(),5);
   await overflow(page,width,'overview');
   await page.screenshot({path:path.join(OUT,'overview-'+width+'.png'),fullPage:true});
   checkErrors(errors,'overview '+width);
  }finally{await context.close();}
 }
});
test('V2 pilot has no yellow example banner and no approval card',async()=>{
 for(const width of [390,1280]){
  const {page,context,errors}=await openPage(width);
  try{
   assert.equal(await page.locator('#chrome .banner:not(.banner--stop)').count(),0,
     'retired example-data banner must not reappear');
   await page.locator('#status-dock').getByText('Freigabe: ausstehend').waitFor();
   assert.equal(await page.locator('#stage .legacy-release-tile').count(),0);
   const badges=page.locator('.industrial-pilot-badge');
   assert.equal(await badges.count(),1,'exactly one pilot identifier, in sidebar');
   if(width>900)assert.ok(await badges.isVisible());
   const data=await page.evaluate(()=>({
    example:window.HavarieApp.DATA.meta.example_data,
    single:typeof window.HavarieApp.S.d.substanceKey==='string'&&typeof window.HavarieApp.S.d.activityId==='string'
   }));
   assert.equal(data.example,true,'V2 cannot imply production-approved data');
   assert.equal(data.single,true,'V2 is a single-case demonstration');
   checkErrors(errors,'pilot '+width);
  }finally{await context.close();}
 }
});
test('M08 emergency data accessible immediately, never misrepresented as approved',async()=>{
 const {page,context,errors}=await openPage(390);
 try{
  await page.locator('.industrial-bottom-item[data-to="notfall"]').click();
  await page.locator('#stage h1').filter({hasText:'Notfallplan'}).waitFor();
  const content=await page.locator('#stage').innerText();
  assert.match(content,/Keine freigegebenen Einsatzunterlagen verfügbar/);
  assert.match(content,/nicht verifiziert|Nicht hinterlegt/);
  await overflow(page,390,'emergency');
  await page.screenshot({path:path.join(OUT,'emergency-390.png'),fullPage:true});
  await page.locator('.industrial-bottom-item[data-to="start"]').click();
  assert.match(await page.locator('#stage').innerText(),/Umweltvorsorge/);
  checkErrors(errors,'emergency navigation');
 }finally{await context.close();}
});
test('M08 status dock remains sticky and compact during long form scroll',async()=>{
 const {page,context,errors}=await openPage(390,680);
 try{
  await page.locator('.industrial-bottom-item[data-to="ort"]').click();
  await page.locator('#h-ort').waitFor();
  await page.evaluate(()=>window.scrollTo(0,760));
  await page.waitForFunction(()=>window.scrollY>100);
  await page.waitForFunction(()=>document.querySelector('#status-dock').classList.contains('is-compact'));
  const y=await page.locator('#status-dock').evaluate(el=>el.getBoundingClientRect().top);
  assert.ok(y>=-2 && y<30,'sticky dock top='+y);
  await overflow(page,390,'site form scrolled');
  await page.screenshot({path:path.join(OUT,'sticky-390.png')});
  checkErrors(errors,'dock');
 }finally{await context.close();}
});
test('M08 local inputs survive route switch and refresh; no cloud save',async()=>{
 const {page,context,errors}=await openPage(390);
 try{
  await page.locator('.industrial-bottom-item[data-to="ort"]').click();
  const first=page.locator('input[name="projectId"]').first();
  await first.check({force:true});
  const expected=await first.getAttribute('value');
  await page.waitForFunction(()=>{try{return Boolean(JSON.parse(localStorage.getItem('havarie.pages.v1'))?.d?.projectId)}catch{return false}});
  await page.locator('.industrial-bottom-item[data-to="notfall"]').click();
  await page.reload({waitUntil:'load'});
  const project=await page.evaluate(()=>window.HavarieApp.S.d.projectId);
  assert.equal(project,expected);
  checkErrors(errors,'local save');
 }finally{await context.close();}
});
test('M08 embedded host: iframe sends height updates and can open emergency panel',async()=>{
 const {page,context,errors}=await openPage(1280,900,'embed-demo.html');
 try{
  const frame=page.frameLocator('iframe[title="Havarie-Assistent Gefahrstoffe"]');
  await frame.locator('#stage [data-heading]').first().waitFor();
  await frame.locator('.industrial-nav-item[data-to="notfall"]:visible, .industrial-bottom-item[data-to="notfall"]:visible').first().click();
  await frame.getByText('Keine freigegebenen Einsatzunterlagen verfügbar.').waitFor();
  const box=await page.locator('iframe').evaluate(el=>({height:el.getBoundingClientRect().height,width:el.getBoundingClientRect().width,client:el.parentElement.getBoundingClientRect().width}));
  assert.ok(box.height>=520,'iframe height under minimum '+box.height);
  assert.ok(box.width<=box.client+3,'iframe horizontal size exceeds container');
  await page.screenshot({path:path.join(OUT,'iframe-1280.png'),fullPage:true});
  checkErrors(errors,'iframe host');
 }finally{await context.close();}
});
test('M08 draft PDF: A4, long-text continuation, footer visible, never operative',async()=>{
 const {page,context,errors}=await openPage(1280,900);
 try{
  await page.evaluate(()=>window.HavarieApp.go('ergebnis'));
  await page.locator('#stage .report-sheet').waitFor({state:'attached'});
  await page.locator('button[data-act="export-audit"]').waitFor();
  // The click creates an independent checked snapshot and its trace section.
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('button[data-act="export-audit"]').click()]);
  const filename=download.suggestedFilename();
  assert.match(filename,/^ENTWURF-.*\.json$/);
  const doc=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
  assert.equal(doc.approval.approved,false);
  assert.match(doc.status,/NICHT FREIGEGEBEN/);
  assert.ok(doc.checksum.value===null||/^[a-f0-9]{64}$/.test(doc.checksum.value));
  const getPDF=async(name)=>{
   const pdf=await page.pdf({format:'A4',printBackground:true,preferCSSPageSize:true});
   fs.writeFileSync(path.join(OUT,name+'.pdf'),pdf);
   const info=execFileSync('pdfinfo',['-'],{input:pdf}).toString();
   const text=execFileSync('pdftotext',['-','-'],{input:pdf}).toString();
   const count=Number((info.match(/^Pages:\s+(\d+)/m)||[])[1]||0);
   return {count,text};
  };
  let pdf=await getPDF('report-short');
  assert.ok(pdf.count>=1&&pdf.count<=12,'Unexpected A4 report pages: '+pdf.count);
  assert.match(pdf.text,/ENTWURF/);
  assert.match(pdf.text,/Prüfreferenz und Nachvollziehbarkeit/);
  assert.match(pdf.text,/FACHLICH NICHT/);
  await page.evaluate(()=>{
   const sheet=document.querySelector('#stage>.report-sheet');
   const footer=sheet.querySelector('.report-footer');
   for(let i=0;i<44;i++){
    const sec=document.createElement('section');
    sec.className='report-section';
    sec.innerHTML='<h2>Zusätzlicher Langtext-Test '+i+'</h2><p>'+'Baustelle Schutzgut Grundwasser Ableitung dokumentiert. '.repeat(22)+'</p>';
    footer.before(sec);
   }
   const end=document.createElement('p');end.textContent='M08-PDF-ENDMARKER-2026';footer.before(end);
  });
  pdf=await getPDF('report-long');
  assert.ok(pdf.count>=5,'long PDF expected >=5 A4 pages, got '+pdf.count);
  assert.match(pdf.text,/M08-PDF-ENDMARKER-2026/,'Last page content missing or clipped');
  checkErrors(errors,'report');
 }finally{await context.close();}
});
