from pathlib import Path
from playwright.sync_api import sync_playwright
import re,json
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'QA-V17'; OUT.mkdir(exist_ok=True)
s=(ROOT/'index.html').read_text()
s=re.sub(r'<link rel="stylesheet" href="(css/[^"?]+\.css)(?:\?[^"]+)?">',lambda m:'<style data-original="'+m[1]+'">\n'+(ROOT/m[1]).read_text()+'\n</style>',s)
s=re.sub(r'<script src="(js/[^"?]+\.js)(?:\?[^"]+)?"></script>',lambda m:'<script data-original="'+m[1]+'">\n'+(ROOT/m[1]).read_text()+'\n</script>',s)
stub='''<script>
const _s=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}};
Object.defineProperty(window,'localStorage',{value:_s(),configurable:true});Object.defineProperty(window,'sessionStorage',{value:_s(),configurable:true});
const a={accountKey:'guest:qa',id8:'12345678',nickname:'QA',type:'guest',email:'',createdAt:new Date().toISOString()};localStorage.setItem('btlAccountsV1',JSON.stringify([a]));localStorage.setItem('btlAuthSessionV1',JSON.stringify({accountKey:a.accountKey,issuedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+86400000).toISOString()}));
</script>'''
s=s.replace('<head>','<head>'+stub,1)
(OUT/'inline-qa.html').write_text(s)
results=[];errors=[]
def check(name,condition,detail=''):
 results.append((name,bool(condition),str(detail)))
 if not condition:print('FAIL',name,str(detail)[:300])
qa_player="""(()=>{const p={name:'Jogador QA',birthdate:'2006-01-01',age:20,nationality:'Brasil',nationalityCode:'BR',position:'Centroavante',foot:'Direito',club:'Flamengo',clubCountry:'BR',clubCountryName:'Brasil',clubStrength:84,clubLeague:'Brasileirão',clubCup:'Copa do Brasil',clubDivisionLevel:1,number:9,overall:88,potential:94,initialPotential:94,value:100000000,titles:0,trophies:[],awards:[],calledUp:false,nationalTeamGames:0,nationalTeamGoals:0,nationalTeamAssists:0,nationalTrust:0,nationalCaptain:false,morale:80,reputation:50,developmentBoost:0,marketBonus:0,retired:false,appearance:{},attributes:{pace:90,finishing:92,dribbling:88,passing:82,defense:40,physical:87,weakFoot:4},dnaAttributes:{pace:90,finishing:92,dribbling:88,passing:82,defense:40,physical:87,weakFoot:4},attributeOrigins:{}};state={created:true,player:p,season:createSeason(p,2026,undefined),history:[],offers:[],news:[],pendingEvent:null,savedCareers:[]};save();render();showView('home');})()"""
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
 for width in (1440,1024,768,390,320):
  page=browser.new_page(viewport={'width':width,'height':900 if width>780 else 844},device_scale_factor=1)
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.route('https://**/*',lambda r:r.abort())
  page.set_content(s,wait_until='domcontentloaded',timeout=30000)
  page.wait_for_timeout(130)
  check(f'{width}: Orbitron set globally',"Orbitron" in page.evaluate('getComputedStyle(document.body).fontFamily'))
  check(f'{width}: new game CSS active',page.evaluate("getComputedStyle(document.querySelector('.football-menu-option')).clipPath!=='none'"))
  page.evaluate(qa_player)
  page.wait_for_timeout(80)
  c1=page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--club-primary')")
  page.evaluate("state.player.club='Barcelona';state.player.clubCountry='ES';applyClubTheme('Barcelona');")
  c2=page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--club-primary')")
  check(f'{width}: real club palette changes',c1!=c2,(c1,c2))
  check(f'{width}: club HUD changes',page.locator('#btl-hud-club').inner_text()=='Barcelona')
  page.evaluate("state.player.club='Flamengo';state.player.clubCountry='BR';applyClubTheme('Flamengo');save();")
  # Home, career, creation, statistics, market, legacy.
  for view in ('home','career','create','stats','market','legacy'):
   page.evaluate('v=>showView(v)',view)
   page.wait_for_timeout(100)
   doc=page.evaluate("({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth})")
   check(f'{width}/{view}: no horizontal overflow',doc['scroll']<=doc['client']+3,doc)
   active=page.locator(f'#{view}.view.active').count()
   check(f'{width}/{view}: view active',active==1)
   if view in ('home','career','create') and width in (1440,390):page.screenshot(path=str(OUT/f'{view}-{width}.png'),full_page=False)
  page.evaluate("showView('home')")
  # New-career button and non-destructive cancellation
  page.locator('#home-new-career').click(timeout=3000)
  check(f'{width}: reset modal visible',not page.locator('#new-career-modal').evaluate('(e)=>e.classList.contains("hidden")'))
  check(f'{width}: reset explicitly identifies deletion','excluir' in page.locator('#new-career-modal').inner_text().lower())
  if width in (1440,390):
   page.wait_for_timeout(440)
   page.screenshot(path=str(OUT/f'reset-{width}.png'),full_page=False)
  page.locator('#new-career-cancel').click()
  check(f'{width}: cancel preserves game',page.evaluate('state.created && !!state.player'))
  # One existing event render on 2 viewports, with club themed modal
  if width in (1440,390):
   for kind in ('career','random','icon'):
    page.evaluate("""kind=>{state.pendingEvent={id:'v17_'+kind,type:kind,title:kind==='career'?'Entrevista decisiva':kind==='random'?'Notícia de última hora':'Mensagem de um ídolo',description:'Uma decisão importante pode mudar a temporada.',choices:[{label:'Confiar no trabalho',action:'stability',effect:'Estabilidade'},{label:'Arriscar tudo',action:'ambitious',effect:'Protagonismo'}]};openPendingEvent();}""",kind)
    page.wait_for_timeout(440)
    check(f'{width}/{kind}: event choices',page.locator('#event-choices button.event-choice').count()==2)
    check(f'{width}/{kind}: theme inherited',page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--story-accent')!==''"))
    doc=page.evaluate("({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth})")
    check(f'{width}/{kind}: no overflow',doc['scroll']<=doc['client']+3,doc)
    page.screenshot(path=str(OUT/f'event-{kind}-{width}.png'),full_page=False)
    page.evaluate("document.getElementById('event-modal').classList.add('hidden');state.pendingEvent=null;")
  if width in (1440,390):
   page.evaluate("""(()=>{state.pendingPenaltyShootout={scope:'cup',competition:'Copa do Brasil',stage:'Final',team:'Flamengo',home:'Flamengo',away:'Palmeiras',playerKickRound:null};openPenaltyShootoutDecision()})()""")
   page.wait_for_timeout(440)
   check(f'{width}: five penalty order buttons',page.locator('#decision-choices .decision-option').count()==5)
   check(f'{width}: no penalty descriptions',page.evaluate("[...document.querySelectorAll('#decision-choices .decision-option small')].every(e=>getComputedStyle(e).display==='none')"))
   check(f'{width}: penalty buttons fit screen',page.evaluate("[...document.querySelectorAll('#decision-choices .decision-option')].every(e=>{let r=e.getBoundingClientRect();return r.width>=70&&r.left>=-3&&r.right<=innerWidth+3})"))
   page.screenshot(path=str(OUT/f'penalty-{width}.png'),full_page=False)
   page.evaluate("document.getElementById('match-decision-modal').classList.add('hidden');state.pendingPenaltyShootout=null;")
  # Reset confirmed deletes current not archived careers
  page.evaluate("state.savedCareers=[{name:'Legado QA',retiredAge:35,games:220}];save();")
  page.locator('#home-new-career').click()
  page.locator('#new-career-confirm').click()
  check(f'{width}: new career deletes active',page.evaluate('!state.created && state.player===null'))
  check(f'{width}: archived careers preserved',page.evaluate("state.savedCareers.some(c=>c.name==='Legado QA')"))
  check(f'{width}: creation screen follows',page.locator('#create.view.active').count()==1)
  # check crest enforcement/fake clubs and integrity of saved metadata.
  check(f'{width}: no fake crests',page.evaluate("fallbackClubDataUri('Flamengo')===''"))
  check(f'{width}: non-Commons crest rejected',page.evaluate("BTLRegisterVerifiedCrest('Flamengo','https://a.espncdn.com/team.png','ESPN')===false"))
  check(f'{width}: league no placeholder',page.evaluate("!leaguePoolForCountry('BR','Flamengo','Brasileirão').some(n=>/Clube \\d{2}/.test(n))"))
  page.close()
 browser.close()
print('RESULTS',len(results),sum(x[1] for x in results),'PASS',len([x for x in results if not x[1]]),'FAIL','JS errors',len(errors))
for e in errors[:5]:print('JS ERROR',e[:400])
(OUT/'results.json').write_text(json.dumps({'checks':results,'jsErrors':errors},ensure_ascii=False,indent=2))
if any(not ok for _,ok,_ in results) or errors:raise SystemExit(1)
