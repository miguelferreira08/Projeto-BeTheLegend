from pathlib import Path
from playwright.sync_api import sync_playwright
import re,json,sys
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'QA-V20';OUT.mkdir(exist_ok=True)
s=(ROOT/'index.html').read_text(encoding='utf-8')
s=re.sub(r'<link rel="stylesheet" href="(css/[^"?]+\.css)(?:\?[^"]+)?">',lambda m:'<style>\n'+(ROOT/m[1]).read_text(encoding='utf-8')+'\n</style>',s)
s=re.sub(r'<script src="(js/[^"?]+\.js)(?:\?[^"]+)?"></script>',lambda m:'<script>\n'+(ROOT/m[1]).read_text(encoding='utf-8')+'\n</script>',s)
stub='''<script>
const _s=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}};
Object.defineProperty(window,'localStorage',{value:_s(),configurable:true});Object.defineProperty(window,'sessionStorage',{value:_s(),configurable:true});
const account={accountKey:'guest:qa',id8:'12345678',nickname:'QA',type:'guest',email:'',createdAt:new Date().toISOString()};localStorage.setItem('btlAccountsV1',JSON.stringify([account]));localStorage.setItem('btlAuthSessionV1',JSON.stringify({accountKey:account.accountKey,issuedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+86400000).toISOString()}));
</script>'''
s=s.replace('<head>','<head>'+stub,1)
# Inline local favicon into QA document; independent of network restrictions.
import base64
favicon=base64.b64encode((ROOT/'assets/favicon.svg').read_bytes()).decode('ascii')
s=s.replace('src="assets/favicon.svg"',f'src="data:image/svg+xml;base64,{favicon}"')

# Keep inline file for regression reproduction, not application shipping
(OUT/'inline-qa.html').write_text(s,encoding='utf8')
qa_player="""(()=>{const p={name:'Jogador Teste',birthdate:'2006-01-01',age:20,nationality:'Brasil',nationalityCode:'BR',position:'Centroavante',foot:'Direito',club:'Flamengo',clubCountry:'BR',clubCountryName:'Brasil',clubStrength:84,clubLeague:'Brasileirão Série A',clubCup:'Copa do Brasil',clubDivisionLevel:1,number:9,overall:88,potential:94,initialPotential:94,value:100000000,titles:0,trophies:[],awards:[],calledUp:false,nationalTeamGames:0,nationalTeamGoals:0,nationalTeamAssists:0,nationalTrust:0,nationalCaptain:false,morale:80,reputation:50,developmentBoost:0,marketBonus:0,retired:false,appearance:{},attributes:{pace:90,finishing:92,dribbling:88,passing:82,defense:40,physical:87,weakFoot:4},dnaAttributes:{pace:90,finishing:92,dribbling:88,passing:82,defense:40,physical:87,weakFoot:4},attributeOrigins:{}};state={created:true,player:p,season:createSeason(p,2026,undefined),history:[],offers:[],news:[],pendingEvent:null,savedCareers:[]};save();render();showView('home');})()"""
results=[];errors=[]
def check(label,passed,detail=None):
  results.append({'label':label,'passed':bool(passed),'detail':detail})
  if not passed: print('FAIL',label, str(detail)[:350])
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
 for width in (1440,1024,768,390,320):
  page=browser.new_page(viewport={'width':width,'height':900 if width>=768 else 850},device_scale_factor=1)
  page.route('https://**/*',lambda route:route.abort())
  page.on('pageerror',lambda error: errors.append(f'{width}: {error}'))
  page.set_content(s,wait_until='domcontentloaded',timeout=90000)
  page.wait_for_timeout(180)
  def eval(v):return page.evaluate(v)
  check(f'{width}: palette workbook loaded',eval('window.BTLCompetitionPalettes?.palettes?.length')==100)
  names=page.locator('#home .football-menu-copy b').all_text_contents()
  check(f'{width}: menu language option',len(names)==6 and 'Linguagem' in names,names)
  check(f'{width}: no horizontal overflow',eval('document.documentElement.scrollWidth<=innerWidth+3'),eval('({scroll:document.documentElement.scrollWidth,width:innerWidth})'))
  page.locator('#home-language-btn').click()
  check(f'{width}: language overlay opens',page.locator('#language-modal').evaluate("e=>!e.classList.contains('hidden')"))
  for lang,translated in [('en','Language'),('es','Idioma'),('fr','Langue'),('pt-BR','Linguagem')]:
   page.locator(f'[data-language="{lang}"]').click()
   page.wait_for_timeout(60)
   value=page.locator('#home-language-btn .football-menu-copy b').inner_text()
   check(f'{width}: {lang} translation',value.lower()==translated.lower(),value)
   check(f'{width}: {lang} document lang',eval('document.documentElement.lang')==lang)
  page.locator('#language-modal-done').click()
  check(f'{width}: language overlay closes',page.locator('#language-modal').evaluate("e=>e.classList.contains('hidden')"))
  check(f'{width}: layout remains responsive',eval('document.documentElement.scrollWidth<=innerWidth+3'))
  # tests for all sample colors directly loaded from user workbook
  for comp,code,main in [('UEFA Champions League','ES','#071B49'),('UEFA Europa League','ES','#F26A21'),('UEFA Conference League','ENG','#17A96B'),('Brasileirão Série B','BR','#021B79'),('2. Bundesliga','DE','#CC1825'),('LaLiga','ES','#EF3340'),('Ligue 1','FR','#0057F8')]:
   observed=eval(f"window.BTLCompetitionPalettes.get({json.dumps(comp)}, {json.dumps(code)})?.primary")
   check(f'{width}: palette {comp}',observed==main,observed)
  page.evaluate(qa_player);page.wait_for_timeout(120)
  page.evaluate("applyCompetitionExperienceTheme({competition:'UEFA Champions League',countryCode:'ES'})")
  observed=eval("getComputedStyle(document.documentElement).getPropertyValue('--competition-primary').trim()")
  check(f'{width}: site-wide source color',observed=='#071B49',observed)
  # Palette unaffected by club change
  page.evaluate("state.player.club='Barcelona';state.player.clubCountry='ES';applyCompetitionExperienceTheme({competition:'UEFA Champions League',countryCode:'ES'})")
  check(f'{width}: team does not override competition',eval("getComputedStyle(document.documentElement).getPropertyValue('--competition-primary').trim()")=='#071B49')
  box=eval("(()=>{const a=document.querySelector('#home-career-face').getBoundingClientRect(),b=document.querySelector('#home-current-player').getBoundingClientRect();return {ok:b.left>=a.right-2&&b.right<=innerWidth+2,face:a.right,name:b.left}})()")
  check(f'{width}: career card text clears portrait',box['ok'],box)
  if width in (1440,390):
   page.evaluate("document.querySelector('#toast')?.classList.remove('show')")
   page.screenshot(path=str(OUT/f'home-{width}.png'))

  page.evaluate("showView('career')")
  check(f'{width}: career layout responsive',eval('document.documentElement.scrollWidth<=innerWidth+3'))
  page.evaluate("state.pendingPenaltyShootout={scope:'cup',competition:'UEFA Champions League',stage:'Final',team:'Barcelona',home:'Barcelona',away:'Real Madrid',playerKickRound:null};openPenaltyShootoutDecision()")
  page.wait_for_timeout(100)
  check(f'{width}: trophy alongside competition',page.locator('#decision-competition .honour-art img').count()==1)
  check(f'{width}: penalty layout fits',eval("[...document.querySelectorAll('#decision-choices .decision-option')].every(e=>{const r=e.getBoundingClientRect();return r.left>=-3&&r.right<=innerWidth+3&&r.width>=85})"))
  page.locator('#match-decision-modal').evaluate("e=>e.classList.add('hidden')")
  if width in (1440,390):page.screenshot(path=str(OUT/f'career-{width}.png'))
  page.close()
 browser.close()
print('QA',sum(x['passed'] for x in results),'/',len(results),'JS errors',len(errors))
for e in errors[:6]: print('ERR',e[:320])
(OUT/'results.json').write_text(json.dumps({'checks':results,'errors':errors},ensure_ascii=False,indent=2),encoding='utf8')
if not all(r['passed'] for r in results) or errors:sys.exit(1)
