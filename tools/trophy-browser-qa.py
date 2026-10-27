"""Interface tests for Wikimedia trophy images with simulated network success/failure.
Does NOT assert that remote Commons URLs truly load on the internet.
"""
import json
import os
import http.server
import threading
import socketserver
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT = Path(__file__).resolve().parents[1]
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
os.chdir(ROOT)
server=socketserver.TCPServer(('127.0.0.1',0),Quiet)
threading.Thread(target=server.serve_forever,daemon=True).start()
URL = 'http://127.0.0.1:' + str(server.server_address[1]) + '/index.html'
SVG = b'<svg xmlns="http://www.w3.org/2000/svg" width="400" height="640"><rect width="400" height="640" fill="#dbb36c"/><circle cx="200" cy="200" r="80" fill="#5c411d"/></svg>'
check_count=0
checks={}

def ck(test,description):
 global check_count
 assert test, f'FAIL: {description}'
 check_count += 1
 checks[description]='PASS'

with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for mode in ['success_mock','network_failure']:
  context=browser.new_context(viewport={'width':390,'height':844})
  page=context.new_page()
  errors=[]
  page.on('pageerror',lambda error: errors.append(str(error)))
  page.add_init_script("""(()=>{
    const a={accountKey:'guest:qa',id8:'12345678',nickname:'QA',type:'guest',email:'',createdAt:new Date().toISOString()};
    localStorage.setItem('btlAccountsV1',JSON.stringify([a]));
    localStorage.setItem('btlAuthSessionV1',JSON.stringify({accountKey:a.accountKey,issuedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+86400000).toISOString()}));
  })();""")
  if mode=='success_mock':
   page.route('https://commons.wikimedia.org/wiki/Special:FilePath/**',lambda route: route.fulfill(status=200,content_type='image/svg+xml',body=SVG))
  else:
   page.route('https://commons.wikimedia.org/wiki/Special:FilePath/**',lambda route: route.abort('failed'))
  page.goto(URL,wait_until='domcontentloaded',timeout=30000)
  page.wait_for_function('window.BTLTrophyDiagnostics !== undefined',timeout=30000)
  info=page.evaluate('window.BTLTrophyDiagnostics()')
  ck(info['source']=='Wikimedia Commons (exclusivo)',f'{mode}: only Commons')
  ck(info['count']==53,f'{mode}: registered 53 Commons images')
  ck(not errors,f'{mode}: page loads without JS error: {errors[:2]}')
  page.evaluate("showSeasonHonoursGallery(['UEFA Champions League','Brasileirão Série A','OFC Champions League'], ['Bola de Ouro'])")
  page.wait_for_timeout(550)
  mapped=page.locator('#celebration-icon .honour-art:not(.fallback) img').count()
  fallback=page.locator('#celebration-icon .honour-art.fallback').count()
  if mode=='success_mock':
   ck(mapped==3,f'{mode}: three different Commons images render in gallery')
   ck(fallback==1,f'{mode}: unknown trophy remains initials')
   ck(page.locator('#celebration-icon img').evaluate_all('(xs)=>xs.every(x=>x.complete&&x.naturalWidth>0)'),f'{mode}: mocked Commons image loads')
  else:
   ck(page.locator('#celebration-icon img').count()==0,f'{mode}: broken network images removed')
   ck(fallback==4,f'{mode}: four initials fallbacks after network error')
  # Trophy-specific victory modal.
  page.evaluate("showCelebrationForHonour('UEFA Champions League','Vitória','Teste')")
  page.wait_for_timeout(250)
  if mode=='success_mock':
   ck(page.locator('#celebration-icon img').count()==1,f'{mode}: championship celebration shows Commons image')
  else:
   ck(page.locator('#celebration-icon img').count()==0,f'{mode}: championship celebration gracefully falls back')
  page.evaluate("showCelebrationForHonour('CAF Champions League','Vitória','Teste')")
  ck(page.locator('#celebration-icon .honour-art.fallback').count()==1,f'{mode}: unavailable trophy not illustrated generically')
  # Credits script should render source attributions.
  page.locator('#commons-attribution-open').evaluate('(el)=>el.click()')
  ck(page.locator('#commons-attribution-list .commons-credit-row').count()==53,f'{mode}: all Commons author/licensing references in UI')
  ck(page.locator('#commons-attribution-list a[href^="https://commons.wikimedia.org/wiki/File:"]').count()==53,f'{mode}: all attribution links Commons')
  context.close()
 browser.close()
result={'status':'PASS','checks':check_count,'conditions':['Success simulated with a mock local SVG (not a live Wikimedia image)','Remote network failure simulated; fallback verified'],'detail':checks}
(ROOT/'assets/trophy-browser-qa-report.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
server.shutdown();server.server_close()
print(json.dumps({'status':result['status'],'checks':result['checks'],'conditions':result['conditions']},ensure_ascii=False,indent=2))
