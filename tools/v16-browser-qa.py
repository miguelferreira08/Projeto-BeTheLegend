from pathlib import Path
from playwright.sync_api import sync_playwright
import json
ROOT=Path(__file__).resolve().parents[1]
OUT=Path('/mnt/data/v16-preview');OUT.mkdir(exist_ok=True)
results=[]; errors=[]
def check(n,pass_,details=''):
    results.append((n,bool(pass_),details))
    if not pass_: print('FAIL',n,details)
with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--allow-file-access-from-files'])
  for width in (1280,390):
    page=browser.new_page(viewport={'width':width,'height':900 if width>600 else 844}, device_scale_factor=1)
    page.on('pageerror',lambda e:errors.append(str(e)))
    # Test the V16 locally with a clean profile and saved account.
    page.route('https://**/*',lambda route:route.abort())
    page.set_content(Path('/mnt/data/v16-qa-inline.html').read_text(),wait_until='domcontentloaded',timeout=30000)
    page.wait_for_timeout(700)
    check(f'{width}px: stylesheet applied',page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--btl-display-font').includes('Jersey')"))
    check(f'{width}px: FCLOGO/ESPN old cache removed',page.evaluate("!('Arsenal' in badgeCache) && !!badgeCache['Barcelona']"))
    check(f'{width}px: rejects provider crest',page.evaluate("BTLRegisterVerifiedCrest('Arsenal','https://a.espncdn.com/foo.png','ESPN')===false"))
    # No club-only dash removed under authentication.
    check(f'{width}px: old roster tab absent',page.locator('#roster-explorer').count()==0)
    check(f'{width}px: old font tab absent',page.locator('.typography-panel').count()==0)
    page.locator('#btl-font-file').set_input_files('/mnt/data/Jersey M54(1).ttf')
    page.wait_for_function("document.documentElement.dataset.licensedJersey==='true'",timeout=10000)
    check(f'{width}px: exact uploaded font loaded',page.evaluate("document.fonts.check('22px \"BTL Uploaded Jersey M54\"')"))
    check(f'{width}px: global font effective',page.evaluate("getComputedStyle(document.querySelector('body')).fontFamily.includes('Uploaded Jersey M54')"))
    check(f'{width}px: Portuguese char font fallback',page.evaluate("(() => {const f=document.fonts;return f.check('20px Arial','AÇÃO Ã É Ç')})()"))
    # Create demo state, use game's actual season-generation function, switch clubs.
    page.evaluate("""(()=>{
      const p={name:'Teste',birthdate:'2006-01-01',age:20,nationality:'Brasil',nationalityCode:'BR',position:'Centroavante',foot:'Direito',club:'Flamengo',clubCountry:'BR',clubCountryName:'Brasil',clubStrength:84,clubLeague:'Brasileirão',clubCup:'Copa do Brasil',clubDivisionLevel:1,number:9,overall:88,potential:94,initialPotential:94,value:100000000,titles:0,trophies:[],awards:[],calledUp:false,nationalTeamGames:0,nationalTeamGoals:0,nationalTeamAssists:0,nationalTrust:0,nationalCaptain:false,morale:80,reputation:50,developmentBoost:0,marketBonus:0,retired:false,appearance:{},attributes:{pace:90,finishing:92,dribbling:88,passing:82,defense:40,physical:87,weakFoot:4},dnaAttributes:{pace:90,finishing:92,dribbling:88,passing:82,defense:40,physical:87,weakFoot:4},attributeOrigins:{}};
      state={created:true,player:p,season:createSeason(p,2026,undefined),history:[],offers:[],news:[],pendingEvent:null,savedCareers:[]};save();render();showView('career');
    })()""")
    page.wait_for_timeout(300)
    club1=page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--club-primary')")
    page.evaluate("state.player.club='Barcelona';state.player.clubCountry='ES';applyClubTheme('Barcelona');")
    page.wait_for_timeout(100)
    club2=page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--club-primary')")
    check(f'{width}px: independent club theme',bool(club1) and bool(club2) and club1 != club2,repr((club1,club2)))
    if width==1280:page.screenshot(path=str(OUT/'home-with-font.png'),full_page=False)
    for kind in ('career','random','icon'):
      page.evaluate("""kind=>{
         state.pendingEvent={id:'qa_'+kind,type:kind,title:kind==='career'?'Polêmica nas redes':kind==='icon'?'Conselho de uma lenda':'Notícia inesperada',description:'Uma decisão muda o rumo de sua carreira nesta temporada.',choices:[{label:'Priorizar a equipe',action:'stability',effect:'Ganha estabilidade e união'},{label:'Enfrentar o desafio',action:'ambitious',effect:'Mais fama, mais pressão'}]};openPendingEvent();
      }""",kind)
      page.wait_for_timeout(100)
      check(f'{width}px {kind}: two valid choices',page.locator('#event-choices button.event-choice').count()==2)
      check(f'{width}px {kind}: proper stage',page.locator(f'#event-modal .btl-{kind}-stage').count()==1)
      overflow=page.evaluate("document.documentElement.scrollWidth-document.documentElement.clientWidth")
      check(f'{width}px {kind}: no horizontal page overflow',overflow<=1,str(overflow))
      box=page.locator('#event-choices button.event-choice').first.bounding_box()
      check(f'{width}px {kind}: button size readable',bool(box) and box['height']>=60,str(box))
      if width==1280 or (width==390 and kind=='random'):
         page.screenshot(path=str(OUT/f'event-{kind}-{width}.png'),full_page=False)
      page.evaluate("document.querySelector('#event-modal').classList.add('hidden');state.pendingEvent=null;")
    # Penalty order modal (with 5 options and no descriptions).
    page.evaluate("""(()=>{
      state.pendingPenaltyShootout={scope:'cup',competition:'Copa do Brasil',stage:'Final',team:'Barcelona',home:'Barcelona',away:'Real Madrid',playerKickRound:null};openPenaltyShootoutDecision();
    })()""")
    page.wait_for_timeout(300)
    count=page.locator('#decision-choices .decision-option').count()
    check(f'{width}px penalty: five order buttons',count==5,str(count))
    check(f'{width}px penalty: all secondary descriptions hidden',page.evaluate("[...document.querySelectorAll('#decision-choices .decision-option small')].every(e=>getComputedStyle(e).display==='none')"))
    if width==1280:page.screenshot(path=str(OUT/'penalty-order.png'),full_page=False)
    page.close()
  browser.close()
print('RESULTS',len(results),sum(x[1] for x in results),'PASS', len([x for x in results if not x[1]]),'FAIL', 'JS_ERRORS',len(errors))
for e in errors[:5]: print('JS ERR:',e[:500])
(OUT/'results.json').write_text(json.dumps({'results':results,'jsErrors':errors},ensure_ascii=False,indent=2))
if any(not ok for _,ok,_ in results) or errors: raise SystemExit(1)
