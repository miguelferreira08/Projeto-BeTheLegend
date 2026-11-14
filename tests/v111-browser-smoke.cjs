'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'};
const root=process.cwd();
const server=http.createServer((req,res)=>{
  const requested=decodeURIComponent((req.url||'/').split('?')[0]);
  const file=path.resolve(root,'.'+(requested==='/'?'/index.html':requested));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(error,contents)=>{
    if(error){res.writeHead(404);res.end('Not found');return;}
    res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(contents);
  });
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({headless:true,args:['--no-sandbox']});
    const page=await browser.newPage({viewport:{width:1280,height:900},serviceWorkers:'block'});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>!!window.BTLv111&&!!document.querySelector('#btl-position-pitch'),{timeout:30000});
    assert.equal(await page.title(),'Be The Legend');
    assert.equal(await page.locator('#btl-position-pitch .btl-pitch-position').count(),13);
    const countryCodes=await page.locator('#nationality option').evaluateAll(nodes=>nodes.map(x=>x.value));
    assert.ok(!countryCodes.includes('BT'),'Butão não deve ser mostrado');
    assert.ok(countryCodes.includes('BR')&&countryCodes.includes('ENG'));
    const position=await page.evaluate(()=>{
      const btn=[...document.querySelectorAll('#btl-position-pitch button')].find(x=>x.dataset.positionName==='Meia central');
      btn.click();
      return {selected:document.querySelector('#position').value,pressed:btn.getAttribute('aria-pressed')};
    });
    assert.equal(position.selected,'Meia central');
    assert.equal(position.pressed,'true');
    assert.equal(await page.evaluate(()=>window.BTLv111.version),'11.1.0');
    // Regression invariant: no browser JS exception during rendering.
    assert.deepEqual(errors,[],'Browser JavaScript errors: '+errors.join(' | '));
    console.log('BROWSER OK title, 13 positions, country filter, selection, runtime');
  }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
