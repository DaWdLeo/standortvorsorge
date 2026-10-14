'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
let browser;
test.before(async()=>{browser=await chromium.launch({headless:true});});
test.after(async()=>{if(browser)await browser.close();});
for (const width of [390,768,1280]) test('V3 Arbeitsstand sample workflow '+width+'px',async()=>{
  const context=await browser.newContext({viewport:{width,height:860},reducedMotion:'reduce'});
  const page=await context.newPage();
  const errs=[];page.on('pageerror',e=>errs.push(String(e)));
  try{
    const response=await page.goto('http://127.0.0.1:8765/assistent-v3/',{waitUntil:'load'});
    assert.equal(response.status(),200);
    const nav=width<=900?'.industrial-bottom-item[data-to="arbeitsstand"]':'.industrial-nav-item[data-to="arbeitsstand"]';
    await page.locator(nav).click();
    await page.locator('#stage h1').getByText('Arbeitsstand').waitFor();
    let content=await page.locator('#stage').innerText();
    assert.match(content,/2 \/ 3/);
    assert.match(content,/1 \/ 3/);
    assert.match(content,/0 \/ 3/);
    assert.match(content,/Umfangsprüfung offen/);
    await page.locator('button[data-case="ES-02"]').click();
    await page.locator('#workstand-drainage').selectOption('D02-MUSTER');
    content=await page.locator('#stage').innerText();
    assert.match(content,/3 \/ 3/);
    assert.match(content,/1 \/ 3/);
    assert.match(content,/0 \/ 3/);
    assert.match(content,/Freigabe ausstehend/);
    assert.match(content,/Umfangsprüfung offen/);
    await page.reload({waitUntil:'load'});
    await page.locator('#stage h1').getByText('Arbeitsstand').waitFor();
    assert.equal(await page.locator('#workstand-drainage').inputValue(),'D02-MUSTER');
    await page.locator('[data-act="workstand-reset"]').click();
    assert.equal(await page.locator('#workstand-drainage').inputValue(),'');
    assert.match(await page.locator('#stage').innerText(),/2 \/ 3/);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    assert.ok(overflow<=3,'unexpected horizontal overflow '+overflow);
    assert.deepEqual(errs,[]);
  }finally{await context.close();}
});
test('V3 keeps finalised V2 storage and rule engine separate',async()=>{
  const context=await browser.newContext();
  const page=await context.newPage();
  try{
    await page.goto('http://127.0.0.1:8765/assistent-v3/');
    const data=await page.evaluate(()=>({
      v2:localStorage.getItem('havarie.pages.v1'),
      v3:localStorage.getItem('havarie.v3.pilot.singlecase.v1'),
      sample:localStorage.getItem('havarie.v3.arbeitsstand.sample.v1'),
      mock:window.HavarieApp.DATA.meta.example_data
    }));
    assert.equal(data.v2,null);
    assert.equal(data.mock,true);
  }finally{await context.close();}
});
