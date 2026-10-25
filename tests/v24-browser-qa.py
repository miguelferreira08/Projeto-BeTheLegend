from pathlib import Path
from playwright.sync_api import sync_playwright
import json,re,base64
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'tests/QA-V24';OUT.mkdir(exist_ok=True)
s=(ROOT/'index.html').read_text('utf-8')
s=re.sub(r'<link rel="stylesheet" href="(css/[^"?]+\.css)(?:\?[^\"]+)?">',lambda m:'<style>\n'+(ROOT/m[1]).read_text('utf-8')+'\n</style>',s)
s=re.sub(r'<script src="(js/[^"?]+\.js)(?:\?[^\"]+)?"></script>',lambda m:'<script>\n'+(ROOT/m[1]).read_text('utf-8')+'\n</script>',s)
for code in ['br','us','es','fr']:
 data=base64.b64encode((ROOT/f'assets/flags/{code}.svg').read_bytes()).decode('ascii')
 s=s.replace(f'assets/flags/{code}.svg',f'data:image/svg+xml;base64,{data}')
s=s.replace('<head>','''<head><script>
const _s=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}};
Object.defineProperty(window,'localStorage',{value:_s(),configurable:true});Object.defineProperty(window,'sessionStorage',{value:_s(),configurable:true});
const account={accountKey:'guest:qa',id8:'12345678',nickname:'QA',type:'guest',email:'',createdAt:new Date().toISOString()};localStorage.setItem('btlAccountsV1',JSON.stringify([account]));localStorage.setItem('btlAuthSessionV1',JSON.stringify({accountKey:account.accountKey,issuedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+86400000).toISOString()}));
</script>''',1)
(OUT/'inline.html').write_text(s,'utf-8')
old=(ROOT/'tests/v20-browser-qa.py').read_text('utf-8');player=re.search(r'qa_player=(""".*?""")',old,re.S)
ns={};exec('qa_player='+player.group(1),ns)
checks=[];errors=[];requests=[]
def ck(name,result):
 good=bool(result);checks.append((name,good));
 if not good:print('FAIL',name)
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
 for width in [320,390,768,1024,1440]:
  page=browser.new_page(viewport={'width':width,'height':980},device_scale_factor=1)
  page.route('https://**/*',lambda route:route.abort())
  page.on('pageerror',lambda err:errors.append(f'{width}: {err}'))
  page.set_content(s,wait_until='domcontentloaded',timeout=90000)
  page.wait_for_timeout(150)
  js=lambda query:page.evaluate(query)
  ck(f'{width} no initial overflow',js('document.documentElement.scrollWidth<=innerWidth+4'))
  ck(f'{width} direct Athletic MG',js("window.BTLStaticCrests.resolve('Athletic Club','BR').includes('/logos/brazil/Athletic.svg')"))
  ck(f'{width} Bilbao distinct',js("window.BTLStaticCrests.resolve('Athletic Club','ES').includes('/logos/spain/')"))
  ck(f'{width} no ambiguous Athletic',js("window.BTLStaticCrests.resolve('Athletic Club','')===''"))
  ck(f'{width} FCSB mapped',js("window.BTLStaticCrests.resolve('FCSB','RO').includes('Fcsb-logo.svg')"))
  page.evaluate(ns['qa_player']);page.wait_for_timeout(140)
  page.evaluate("state.player.club='Athletic Club';state.player.clubCountry='BR';render()")
  ck(f'{width} Athletic real assigned',js("document.querySelector('#p-club-badge').src.includes('logos/brazil/Athletic.svg')"))
  ck(f'{width} club global theme',js("document.body.dataset.visualScope==='club'"))
  ck(f'{width} club name stays',js("document.querySelector('#p-club').textContent==='Athletic Club'"))
  ck(f'{width} final cup mandatory',js("isDecisiveFinal({type:'cup',stage:'Final'})"))
  ck(f'{width} final national mandatory',js("isDecisiveFinal({type:'national',stage:'Final'})"))
  ck(f'{width} semifinal not forced',js("!isDecisiveFinal({type:'cup',stage:'Semifinal'})"))
  ck(f'{width} league not forced',js("!isDecisiveFinal({type:'league',stage:'Final'})"))
  ck(f'{width} final first leg not forced',js("!isDecisiveFinal({type:'cup',stage:'Final · ida',leg:1})"))
  # Stable rival records shared between the leaderboard and the award generator.
  ck(f'{width} cached season rival stats',js("(()=>{const a=ensureSeasonRivalRecords(state.season),b=ensureSeasonRivalRecords(state.season);return a===b&&a.find(x=>x.name==='Kylian Mbappé').goals===b.find(x=>x.name==='Kylian Mbappé').goals})()"))
  ck(f'{width} no horizontal after career',js('document.documentElement.scrollWidth<=innerWidth+4'))
  if width in [1440,390]:page.screenshot(path=str(OUT/f'home-{width}.png'),full_page=True)
  # Competition modal should override club colors on the entire card.
  page.evaluate("state.pendingEvent={type:'career',id:'agent',title:'Seu empresário traz uma decisão',choices:[{label:'Buscar salto',action:'agent_open',effect:''},{label:'Ficar',action:'agent_stay',effect:''}]};window.__qaPrev=nextEventCache;nextEventCache={competition:'UEFA Europa League'};openPendingEvent()")
  ck(f'{width} event competition scope',js("document.body.dataset.visualScope==='competition'"))
  ck(f'{width} event competition primary',js("getComputedStyle(document.documentElement).getPropertyValue('--competition-primary').trim()==='#F26A21'"))
  ck(f'{width} event card styling complete',js("getComputedStyle(document.querySelector('#event-modal .career-event-card')).backgroundImage.includes('linear-gradient')"))
  if width in [1440,390]:page.screenshot(path=str(OUT/f'event-{width}.png'),full_page=True)
  page.evaluate("document.querySelector('#event-modal').classList.add('hidden');state.pendingEvent=null;nextEventCache=window.__qaPrev;pauseCareerOverlay('event')")
  ck(f'{width} pause reverts club theme',js("document.body.dataset.visualScope==='club'"))
  page.evaluate("pausedCareerOverlay=null;state.journeyPaused=null;state.pendingPenaltyShootout={scope:'cup',competition:'UEFA Champions League',stage:'Final',team:'Athletic Club',home:'Athletic Club',away:'Real Madrid',playerKickRound:null};openPenaltyShootoutDecision()")
  ck(f'{width} decision comp scope',js("document.body.dataset.visualScope==='competition'"))
  ck(f'{width} decision card comp palette',js("getComputedStyle(document.documentElement).getPropertyValue('--competition-primary').trim()==='#071B49'"))
  ck(f'{width} penalty options',page.locator('#decision-choices .decision-option').count()==5)
  if width in [1440,390]:page.screenshot(path=str(OUT/f'penalty-{width}.png'),full_page=True)
  page.close()
 browser.close()
report={'passed':sum(v for _,v in checks),'total':len(checks),'errors':errors,'failures':[n for n,v in checks if not v]}
(OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),'utf-8')
print('V24 UI:',report['passed'],'/',report['total'],'page errors',len(errors))
if report['passed']!=report['total'] or errors:raise SystemExit(1)
