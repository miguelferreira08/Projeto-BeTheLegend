"""End-to-end browser checks against the actual local files, with a mocked guest login.
Live Google login, remote media, third-party APIs cannot be exercised offline.
"""
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
import threading,os,json,re,time,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/index.html'
results=[];errors=[];screens=ROOT/'tests/QA-GERAL-2026';screens.mkdir(exist_ok=True)
def ck(label,val,details=''):
 results.append({'test':label,'ok':bool(val),'details':details})
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
  for width,height in [(360,800),(390,844),(768,1024),(1024,768),(1440,900)]:
   page=browser.new_page(viewport={'width':width,'height':height})
   page.on('pageerror',lambda e,w=width:errors.append(f'{w}: JavaScript: {e}'))
   def route(r):
    # Do not block actual local images, scripts, or CSS. Only remote sources are offline.
    if r.request.url.startswith('http://127.0.0.1:'):r.continue_()
    else:r.abort()
   page.route('**/*',route)
   page.add_init_script('''(() => {
     const acc={accountKey:'guest:qa',id8:'12345678',nickname:'QA',type:'guest',email:'',createdAt:new Date().toISOString()};
     localStorage.setItem('btlAccountsV1',JSON.stringify([acc]));
     localStorage.setItem('btlAuthSessionV1',JSON.stringify({accountKey:acc.accountKey,issuedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+86400000).toISOString()}));
   })()''')
   page.goto(url,wait_until='domcontentloaded',timeout=45000)
   page.wait_for_timeout(400)
   ev=lambda j:page.evaluate(j)
   ck(f'{width}: index e scripts',ev('typeof window.BTLTrophyDiagnostics === "function"'))
   ck(f'{width}: CSS carregado',ev('getComputedStyle(document.body).getPropertyValue("font-family").length>0'))
   ck(f'{width}: menu inicial',page.locator('#home .football-menu-option').count()>=4)
   ck(f'{width}: sem largura excessiva (home)',ev('document.documentElement.scrollWidth<=innerWidth+5'),str(ev('({vw:innerWidth,doc:document.documentElement.scrollWidth})')))
   ck(f'{width}: imagem da Copa Nacional',ev('new Promise(r=>{const im=new Image;im.onload=()=>r(im.naturalWidth>0);im.onerror=()=>r(false);im.src=trophyArtFor("Copa Nacional")})'))
   ck(f'{width}: imagem alfa Copa Nacional',ev('new Promise(r=>{const im=new Image;im.onload=()=>{const c=document.createElement("canvas");c.width=im.width;c.height=im.height;const x=c.getContext("2d");x.drawImage(im,0,0);r(x.getImageData(0,0,1,1).data[3]===0)};im.onerror=()=>r(false);im.src=trophyArtFor("Copa Nacional")})'))
   # Guest profile state, without Google/server auth.
   player="""(()=>{const p={name:'QA Jogador',birthdate:'2006-01-01',age:20,nationality:'Brasil',nationalityCode:'BR',position:'Centroavante',foot:'Direito',club:'Flamengo',clubCountry:'BR',clubCountryName:'Brasil',clubStrength:84,clubLeague:'Brasileirão Série A',clubCup:'Copa do Brasil',clubDivisionLevel:1,number:9,overall:88,potential:94,initialPotential:94,value:100000000,titles:0,trophies:[],awards:[],calledUp:false,nationalTeamGames:0,nationalTeamGoals:0,nationalTeamAssists:0,nationalTrust:0,nationalCaptain:false,morale:80,reputation:50,developmentBoost:0,marketBonus:0,retired:false,appearance:{},attributes:{pace:90,finishing:92,dribbling:88,passing:82,defense:40,physical:87,weakFoot:4},dnaAttributes:{pace:90,finishing:92,dribbling:88,passing:82,defense:40,physical:87,weakFoot:4},attributeOrigins:{}};state={created:true,player:p,season:createSeason(p,2026,undefined),history:[],offers:[],news:[],pendingEvent:null,savedCareers:[]};save();render();showView('home');return true})()"""
   ck(f'{width}: novo estado de carreira',ev(player))
   ck(f'{width}: salvamento local',ev('!!localStorage.getItem("btlStateV1")'))
   for view in ('home','career','stats','market','legacy','contact'):
    try:
     ev(f'showView({json.dumps(view)})')
     page.wait_for_timeout(80)
     ck(f'{width}: vista {view} ativa',ev(f'document.getElementById({json.dumps(view)}).classList.contains("active")'))
     ck(f'{width}: largura vista {view}',ev('document.documentElement.scrollWidth<=innerWidth+5'),str(ev('({vw:innerWidth,doc:document.documentElement.scrollWidth})')))
     if view in ('home','career','market') and width in (390,1440):page.screenshot(path=str(screens/f'{view}-{width}.png'),full_page=True,timeout=10000)
    except Exception as ex:errors.append(f'{width}: {view} {ex}')
   ck(f'{width}: sigla CDBEL correta',ev('trophyArtFor("CDBEL").includes("copa-da-belgica.png")'))
   ck(f'{width}: sigla CDB correta',ev('trophyArtFor("CDB").includes("copa-do-brasil-user.png")'))
   ck(f'{width}: sem troféu eliminatórias',ev('trophyArtFor("Eliminatórias da Copa do Mundo")===""'))
   for name in ('afc-champions-league-elite.png','ofc-champions-league.png','copa-nacional.png','team-of-the-season.png'):
    ck(f'{width}: PNG presente {name}',ev(f'new Promise(r=>{{let i=new Image;i.onload=()=>r(i.naturalWidth>0);i.onerror=()=>r(false);i.src="assets/trophies/user/{name}"}})'))
   # Modal + language
   try:
    ev('showView("home")')
    page.locator('#home-language-btn').click(timeout=4000)
    ck(f'{width}: modal de idioma',ev('!document.querySelector("#language-modal").classList.contains("hidden")'))
    page.locator('[data-language="en"]').click(timeout=4000)
    ck(f'{width}: inglês',ev('document.documentElement.lang==="en"'))
    page.locator('[data-language="pt-BR"]').click(timeout=4000)
    ck(f'{width}: português',ev('document.documentElement.lang==="pt-BR"'))
    page.locator('#language-modal-done').click(timeout=4000)
    ck(f'{width}: fechar modal idioma',ev('document.querySelector("#language-modal").classList.contains("hidden")'))
   except Exception as ex:errors.append(f'{width}: idioma {ex}')
   page.close()
  browser.close()
finally:server.shutdown()
summary={'total':len(results),'passed':sum(r['ok'] for r in results),'failed':[r for r in results if not r['ok']],'errors':errors,'tests':results,'environment':'Actual local HTML/CSS/JS/assets via localhost; chromium; guest account mocked; remote requests blocked; external APIs untested.'}
(ROOT/'tests/qa-real-site.json').write_text(json.dumps(summary,indent=2,ensure_ascii=False),'utf8')
print(json.dumps({k:v for k,v in summary.items() if k!='tests'},ensure_ascii=False,indent=2))
if summary['failed'] or summary['errors']:raise SystemExit(1)
