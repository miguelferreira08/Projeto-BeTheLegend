from pathlib import Path
from playwright.sync_api import sync_playwright
import re,json,sys
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'QA-V19'; OUT.mkdir(exist_ok=True)
s=(ROOT/'index.html').read_text(encoding='utf-8')
s=re.sub(r'<link rel="stylesheet" href="(css/[^"?]+\.css)(?:\?[^\"]+)?">',lambda m:'<style>\n'+(ROOT/m[1]).read_text(encoding='utf-8')+'\n</style>',s)
s=re.sub(r'<script src="(js/[^"?]+\.js)(?:\?[^\"]+)?"></script>',lambda m:'<script>\n'+(ROOT/m[1]).read_text(encoding='utf-8')+'\n</script>',s)
stub='''<script>
const _s=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}};
Object.defineProperty(window,'localStorage',{value:_s(),configurable:true});Object.defineProperty(window,'sessionStorage',{value:_s(),configurable:true});
const a={accountKey:'guest:qa',id8:'12345678',nickname:'QA',type:'guest',email:'',createdAt:new Date().toISOString()};localStorage.setItem('btlAccountsV1',JSON.stringify([a]));localStorage.setItem('btlAuthSessionV1',JSON.stringify({accountKey:a.accountKey,issuedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+86400000).toISOString()}));
</script>'''
s=s.replace('<head>','<head>'+stub,1)
(OUT/'inline-qa.html').write_text(s,encoding='utf-8')
qa_player="""(()=>{const p={name:'Jogador Teste',birthdate:'2006-01-01',age:20,nationality:'Brasil',nationalityCode:'BR',position:'Centroavante',foot:'Direito',club:'Flamengo',clubCountry:'BR',clubCountryName:'Brasil',clubStrength:84,clubLeague:'Brasileirão',clubCup:'Copa do Brasil',clubDivisionLevel:1,number:9,overall:88,potential:94,initialPotential:94,value:100000000,titles:0,trophies:[],awards:[],calledUp:false,nationalTeamGames:0,nationalTeamGoals:0,nationalTeamAssists:0,nationalTrust:0,nationalCaptain:false,morale:80,reputation:50,developmentBoost:0,marketBonus:0,retired:false,appearance:{},attributes:{pace:90,finishing:92,dribbling:88,passing:82,defense:40,physical:87,weakFoot:4},dnaAttributes:{pace:90,finishing:92,dribbling:88,passing:82,defense:40,physical:87,weakFoot:4},attributeOrigins:{}};state={created:true,player:p,season:createSeason(p,2026,undefined),history:[],offers:[],news:[],pendingEvent:null,savedCareers:[]};save();render();showView('home');})()"""
results=[];errors=[]
def check(label,passed,details=None):
 results.append({'label':label,'passed':bool(passed),'details':details});
 if not passed:print('FAIL',label,details)
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
 for width in (1440,1024,768,390,320):
  page=browser.new_page(viewport={'width':width,'height':900 if width>780 else 844},device_scale_factor=1)
  page.route('https://**/*',lambda route:route.abort())
  page.on('pageerror',lambda error: errors.append(f'{width}: {error}'))
  page.set_content(s,wait_until='domcontentloaded',timeout=90000)
  page.wait_for_timeout(100)
  names=page.locator('#home .football-menu-option b').all_text_contents()
  check(f'{width} menu 5 ações',names==['Continuar carreira','Nova carreira','Meu Legado','Som / Trilha sonora','Contato'],names)
  check(f'{width} descriptions hidden',page.evaluate("getComputedStyle(document.querySelector('#home-career-meta')).display==='none'"))
  check(f'{width} Orbitron configured','Orbitron' in page.evaluate('getComputedStyle(document.body).fontFamily'))
  check(f'{width} nav removes stats/market on home',page.evaluate("[...document.querySelectorAll('#nav [data-view=stats],#nav [data-view=market]')].every(e=>getComputedStyle(e).display==='none')"))
  check(f'{width} no overflow initial',page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
  # idol custom select loaded and contains explicit flag image per row
  page.evaluate("showView('create')")
  page.locator('#idol').evaluate("e=>{e.value='pele';e.dispatchEvent(new Event('change',{bubbles:true}));}")
  page.locator('#idol').evaluate('e=>{e.selectedIndex=1;e.dispatchEvent(new Event("change",{bubbles:true}));}')
  page.locator('#idol').evaluate('e=>syncCustomSelect(e)')
  trigger=page.locator('#idol').locator('xpath=..').locator('button.btl-select-trigger')
  check(f'{width} idol selected flag',trigger.locator('.national-flag-image').count()==1 and trigger.locator('.national-flag-image b').count()==1)
  trigger.click()
  check(f'{width} idol flags in choices',page.locator('#btl-select-popover .btl-select-option-flag .national-flag-image').count()>=3)
  page.keyboard.press('Escape')
  check(f'{width} create no overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
  # Real career and competition theme independent of club
  page.evaluate(qa_player)
  page.wait_for_timeout(130)
  page.evaluate("applyCompetitionExperienceTheme({competition:'UEFA Champions League'})")
  ucl=page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--club-primary').trim()")
  page.evaluate("state.player.club='Barcelona';state.player.clubCountry='ES';applyCompetitionExperienceTheme({competition:'UEFA Champions League'})")
  ucl2=page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--club-primary').trim()")
  check(f'{width} competition same regardless club',ucl==ucl2=='#4fd0ff',(ucl,ucl2))
  page.evaluate("applyCompetitionExperienceTheme({competition:'UEFA Europa League'})")
  orange=page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--club-primary').trim()")
  page.evaluate("applyCompetitionExperienceTheme({competition:'UEFA Conference League'})")
  green=page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--club-primary').trim()")
  check(f'{width} UEL and UECL independent palettes',orange=='#ff7b2f' and green=='#44d07e',(orange,green))
  page.evaluate("state.player.club='Flamengo';state.player.clubCountry='BR';render();showView('home')")
  box=page.evaluate("""(()=>{let a=document.querySelector('#home-career-face').getBoundingClientRect(),b=document.querySelector('#home-current-player').getBoundingClientRect();let x=document.querySelector('.home-career-player').getBoundingClientRect();return {face:{left:a.left,right:a.right,top:a.top,bottom:a.bottom},name:{left:b.left,right:b.right,top:b.top,bottom:b.bottom},row:{left:x.left,right:x.right},ok:b.left>=a.right-2&&b.right<=x.right+2}})()""")
  check(f'{width} current career no overlap',box['ok'],box)
  check(f'{width} home no overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
  if width in (1440,390):page.screenshot(path=str(OUT/f'home-{width}.png'))
  page.evaluate("showView('career')")
  check(f'{width} selection yellow ribbon removed',page.evaluate("getComputedStyle(document.querySelector('.national-card'),'::before').display==='none' || getComputedStyle(document.querySelector('.national-card'),'::before').content==='none'"))
  check(f'{width} career no overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
  if width in (1440,390):page.screenshot(path=str(OUT/f'career-{width}.png'))
  page.evaluate("state.pendingPenaltyShootout={scope:'cup',competition:'UEFA Champions League',stage:'Final',team:'Flamengo',home:'Flamengo',away:'Palmeiras',playerKickRound:null};openPenaltyShootoutDecision()")
  page.wait_for_timeout(160)
  check(f'{width} Champions site-wide theme during penalties',page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--club-primary').trim()==='#4fd0ff'"))
  check(f'{width} penalty has trophy + name',page.locator('#decision-competition .honour-art img').count()==1)
  check(f'{width} penalty centered',page.evaluate("(()=>{let grid=document.querySelector('#decision-choices'),g=grid.getBoundingClientRect(),b=grid.querySelector('button').getBoundingClientRect();return Math.abs((g.left+g.right)/2-(b.left+b.right)/2)<g.width/2&&b.left>=0&&b.right<=innerWidth+2})()"))
  check(f'{width} penalty options fit',page.evaluate("[...document.querySelectorAll('#decision-choices .decision-option')].every(e=>{let r=e.getBoundingClientRect();return r.left>=-1 && r.right<=innerWidth+2 && r.width>=90})"))
  if width in (1440,390):page.screenshot(path=str(OUT/f'penalty-{width}.png'))
  page.evaluate("document.getElementById('match-decision-modal').classList.add('hidden');state.pendingPenaltyShootout=null;")
  if width in (1440,390):
   page.evaluate("state.pendingEvent={id:'qa_event',type:'career',title:'Decisão decisiva',description:'Desc',choices:[{label:'Aceitar proposta',action:'stability',effect:'Desc efeito'},{label:'Recusar',action:'ambitious',effect:'Desc efeito'}]};openPendingEvent()")
   check(f'{width} event has choices',page.locator('#event-choices button.event-choice').count()==2)
   check(f'{width} event description hidden',page.evaluate("getComputedStyle(document.querySelector('#event-description')).display==='none'"))
   page.screenshot(path=str(OUT/f'event-{width}.png'))
  page.close()
 browser.close()
print('RESULTS',sum(x['passed'] for x in results),'/',len(results),'errors',len(errors))
for error in errors[:8]:print('PAGEERROR:',error[:500])
(OUT/'results.json').write_text(json.dumps({'checks':results,'errors':errors},ensure_ascii=False,indent=2),encoding='utf-8')
if not all(x['passed'] for x in results) or errors:sys.exit(1)
