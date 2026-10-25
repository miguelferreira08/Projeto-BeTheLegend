from pathlib import Path
from playwright.sync_api import sync_playwright
import json,re,sys
ROOT=Path(__file__).resolve().parents[1]
qa=ROOT/'tests/QA-V21/inline-qa.html'
if not qa.exists():
 print('Run: python tests/v21-browser-qa.py before V22 QA')
 sys.exit(1)
source=qa.read_text(encoding='utf-8')
player_code=re.search(r'qa_player=(""".*?""")', (ROOT/'tests/v20-browser-qa.py').read_text(encoding='utf-8'),re.S)
ns={};exec('qa_player='+player_code.group(1),ns)
checks=[];errors=[];requests=[]
svg='<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><circle cx="40" cy="40" r="32" fill="#ccc" /></svg>'
def ck(name,expr):
 checks.append((name,bool(expr)))
 if not expr:print('FAIL',name)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
 for width in [320,390,768,1024,1440]:
  page=browser.new_page(viewport={'width':width,'height':900})
  page.on('pageerror',lambda ex:errors.append(str(ex)))
  def log(route):requests.append(route.request.url);route.abort()
  page.route('https://**/*',log)
  page.route('https://raw.githubusercontent.com/**',lambda route:route.fulfill(status=200,content_type='image/svg+xml',body=svg))
  page.set_content(source,wait_until='domcontentloaded',timeout=90000)
  page.wait_for_timeout(180)
  ck(f'{width} static catalog present',page.evaluate('window.BTLStaticCrests?.count')==425)
  ck(f'{width} layout no horizontal scroll',page.evaluate('document.documentElement.scrollWidth<=innerWidth+4'))
  ck(f'{width} no old external registration',page.evaluate("window.BTLRegisterVerifiedCrest('Flamengo','https://upload.wikimedia.org/test.svg','Wikimedia Commons')") is False)
  page.evaluate(ns['qa_player']);page.wait_for_timeout(150)
  page.evaluate("state.player.club='Flamengo';state.player.clubCountry='BR';render()")
  page.wait_for_timeout(350)
  club=page.locator('#p-club-badge')
  ck(f'{width} Flamengo URL pinned to github', '/logos/brazil/Flamengo.svg' in (club.get_attribute('src') or ''))
  ck(f'{width} mock SVG loads',club.evaluate('x=>x.complete&&x.naturalWidth>0'))
  ck(f'{width} crest fallback hidden',page.locator('#p-club-fallback').evaluate("e=>e.classList.contains('hidden')"))
  ck(f'{width} game no horizontal scroll with crest',page.evaluate('document.documentElement.scrollWidth<=innerWidth+4'))
  # Never take a different club's badge as a fallback.
  ck(f'{width} wrong-country club returns no badge',page.evaluate("window.BTLStaticCrests.resolve('Flamengo','ES')===''"))
  ck(f'{width} no network logo API',all('/api/club-badge' not in x and '/api/commons-crest' not in x for x in requests))
  page.close()
 browser.close()
report={'passed':sum(v for _,v in checks),'total':len(checks),'pageErrors':errors,'unexpectedApiCalls':[x for x in requests if '/api/club-badge' in x or '/api/commons-crest' in x]}
folder=ROOT/'tests/QA-V22';folder.mkdir(exist_ok=True)
(folder/'browser.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('V22 browser',report['passed'],'/',report['total'],'page errors',len(errors),'API calls',len(report['unexpectedApiCalls']))
if report['passed']!=report['total'] or errors or report['unexpectedApiCalls']:sys.exit(1)
