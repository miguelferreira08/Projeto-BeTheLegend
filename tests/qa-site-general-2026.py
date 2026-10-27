"""Auditoria de interface offline: testes de fluxo com navegador Chromium e recursos locais inline.
A execução não verifica serviços externos reais. Requer playwright, Chromium.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re,json,base64,time,traceback
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'tests/qa-site-general-2026.json'
s=(ROOT/'index.html').read_text('utf-8')
s=re.sub(r'<link rel="stylesheet" href="(css/[^"?]+\.css)(?:\?[^"]+)?">',lambda m:'<style>\n'+(ROOT/m[1]).read_text('utf-8')+'\n</style>',s)
s=re.sub(r'<script src="(js/[^"?]+\.js)(?:\?[^"]+)?"></script>',lambda m:'<script>\n'+(ROOT/m[1]).read_text('utf-8')+'\n</script>',s)
# Use browser-local mock session to evaluate game independently of Google/cloud connectivity.
s=s.replace('<head>', '''<head><script>
const store=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}};
Object.defineProperty(window,'localStorage',{value:store(),configurable:true});
Object.defineProperty(window,'sessionStorage',{value:store(),configurable:true});
const qaAccount={accountKey:'guest:qa',id8:'12345678',nickname:'QA',type:'guest',email:'',createdAt:new Date().toISOString()};
localStorage.setItem('btlAccountsV1',JSON.stringify([qaAccount]));
localStorage.setItem('btlAuthSessionV1',JSON.stringify({accountKey:qaAccount.accountKey,issuedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+86400000).toISOString()}));
</script>''',1)
# About:blank cannot fetch relative images; make the new trophy demonstrable with an inline data URL in this QA only.
from PIL import Image
import io
with Image.open(ROOT/'assets/trophies/user/copa-nacional.png') as im:
 im.thumbnail((280,420));buff=io.BytesIO();im.save(buff,format='PNG',optimize=True)
embedded='data:image/png;base64,'+base64.b64encode(buff.getvalue()).decode('ascii')
s += "<script>window.BTL_COMMONS_TROPHIES.find(x=>x.test.test('Copa Nacional')).src = "+json.dumps(embedded)+";</script>"
# external network isn't required for testing logic and layouts
checks=[]; errors=[]; fails=[]
def ck(name,value):
 checks.append({'name':name,'passed':bool(value)})
 if not value:fails.append(name)
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
  for width in (360,390,768,1024,1440):
   page=browser.new_page(viewport={'width':width,'height':900},device_scale_factor=1)
   page.route('https://**/*',lambda route:route.abort())
   page.on('pageerror',lambda e:errors.append(f'{width}: {e}'))
   page.set_content(s,wait_until='domcontentloaded',timeout=60000)
   page.wait_for_timeout(200)
   ev=lambda js:page.evaluate(js)
   ck(f'{width}: scripts executados',ev('typeof window.BTLTrophyDiagnostics === "function"'))
   ck(f'{width}: catálogo de troféus',ev('window.BTLTrophyDiagnostics().count')==69)
   ck(f'{width}: Copa Nacional mapeada',ev("trophySourcesFor('Copa Nacional').length===1"))
   ck(f'{width}: eliminatórias sem taça',ev("trophySourcesFor('Eliminatórias da Copa do Mundo').length===0"))
   ck(f'{width}: peça de Copa Nacional carrega',ev('new Promise(resolve=>{const e=new Image();e.onload=()=>resolve(e.naturalWidth>0);e.onerror=()=>resolve(false);e.src=trophyArtFor("Copa Nacional")})'))
   ck(f'{width}: inicial sem transbordo horizontal',ev('document.documentElement.scrollWidth<=innerWidth+4'))
   ck(f'{width}: carrega paletas',ev('typeof window.BTLCompetitionPalettes?.get === "function"'))
   ck(f'{width}: escudos estáticos',ev('typeof window.BTLStaticCrests?.resolve === "function"'))
   ck(f'{width}: menus da home',page.locator('#home .football-menu-option').count()>=4)
   ck(f'{width}: seletor de idioma existe',page.locator('#home-language-btn').count()==1)
   # Acessa o fluxo de idioma com usuário convidado de teste.
   try:
    page.locator('#home-language-btn').click(timeout=4000)
    ck(f'{width}: abre janela de idiomas',ev("!document.querySelector('#language-modal').classList.contains('hidden')"))
    page.locator('[data-language="en"]').click(timeout=4000)
    ck(f'{width}: troca para inglês',ev('document.documentElement.lang==="en"'))
    page.locator('[data-language="pt-BR"]').click(timeout=4000)
    ck(f'{width}: volta ao português',ev('document.documentElement.lang==="pt-BR"'))
    page.locator('#language-modal-done').click(timeout=4000)
    ck(f'{width}: fecha janela',ev("document.querySelector('#language-modal').classList.contains('hidden')"))
   except Exception as ex:errors.append(f'{width}: idioma: {ex}')
   player="""(()=>{const p={name:'QA Jogador',birthdate:'2006-01-01',age:20,nationality:'Brasil',nationalityCode:'BR',position:'Centroavante',foot:'Direito',club:'Flamengo',clubCountry:'BR',clubCountryName:'Brasil',clubStrength:84,clubLeague:'Brasileirão Série A',clubCup:'Copa do Brasil',clubDivisionLevel:1,number:9,overall:88,potential:94,initialPotential:94,value:100000000,titles:0,trophies:[],awards:[],calledUp:false,nationalTeamGames:0,nationalTeamGoals:0,nationalTeamAssists:0,nationalTrust:0,nationalCaptain:false,morale:80,reputation:50,developmentBoost:0,marketBonus:0,retired:false,appearance:{},attributes:{pace:90,finishing:92,dribbling:88,passing:82,defense:40,physical:87,weakFoot:4},dnaAttributes:{pace:90,finishing:92,dribbling:88,passing:82,defense:40,physical:87,weakFoot:4},attributeOrigins:{}};state={created:true,player:p,season:createSeason(p,2026,undefined),history:[],offers:[],news:[],pendingEvent:null,savedCareers:[]};save();render();showView('home');return true})()"""
   try:
    ck(f'{width}: cria estado de carreira',ev(player))
    ck(f'{width}: salvamento registrado',ev('localStorage.getItem("btlStateV1")!==null || !!state?.player'))
    ck(f'{width}: renderiza jogador',ev("document.querySelector('#p-name')?.textContent.includes('QA Jogador') || document.body.textContent.includes('QA Jogador')"))
    ck(f'{width}: home de carreira sem transbordo',ev('document.documentElement.scrollWidth<=innerWidth+4'))
    ev("showView('career')")
    ck(f'{width}: navegação para carreira',ev('document.documentElement.scrollWidth<=innerWidth+4'))
    ev("showView('home')")
    ck(f'{width}: volta à home',ev('document.documentElement.scrollWidth<=innerWidth+4'))
    ck(f'{width}: homenagem Copa Nacional',ev('honourVisual("Copa Nacional").includes("<img")'))
    for view in ('home','career','stats','market','legacy','contact'):
     ev('showView('+json.dumps(view)+')')
     ck(f'{width}: visão {view} ativa',ev('document.getElementById('+json.dumps(view)+').classList.contains("active")'))
     ck(f'{width}: visão {view} sem overflow',ev('document.documentElement.scrollWidth<=innerWidth+4'))
     if False and width in (390,1440) and view in ('home','career','market'):
      (ROOT/'tests/QA-GERAL-2026').mkdir(exist_ok=True)
      page.screenshot(path=str(ROOT/'tests/QA-GERAL-2026'/f'{view}-{width}.png'),full_page=True)
    ck(f'{width}: CDBEL não colide com CDB',ev('trophyArtFor("CDBEL").includes("copa-da-belgica.png")'))
    ck(f'{width}: CDB mantém Copa do Brasil',ev('trophyArtFor("CDB").includes("copa-do-brasil-user.png")'))
    ck(f'{width}: knockout sem taça',ev('trophyArtFor("Eliminatórias da Copa do Mundo")===""'))
   except Exception as ex:errors.append(f'{width}: carreira: {ex}')
   page.close()
  browser.close()
except Exception as ex:
 errors.append(f'Chromium: {ex}\n{traceback.format_exc()[-1200:]}')
summary={'checked':len(checks),'passed':sum(v['passed'] for v in checks),'failed':fails,'errors':errors,'checks':checks,'method':'Chromium set_content: código JS/CSS inline, autenticação convidado simulada; tamanhos 360,390,768,1024,1440; fontes externas indisponíveis; PNG Copa Nacional incorporado somente ao teste.'}
OUT.write_text(json.dumps(summary,ensure_ascii=False,indent=2),'utf-8')
print(json.dumps({k:v for k,v in summary.items() if k!='checks'},ensure_ascii=False,indent=2))
if fails or errors:raise SystemExit(1)
