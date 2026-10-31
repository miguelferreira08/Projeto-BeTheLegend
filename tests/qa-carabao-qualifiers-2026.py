from pathlib import Path
from playwright.sync_api import sync_playwright
import re,json
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'index.html').read_text('utf-8')
html=re.sub(r'<link[^>]+href="(css/[^"?]+\.css)(?:\?[^\"]+)?"[^>]*>',lambda m:'<style>\n'+(ROOT/m.group(1)).read_text('utf-8')+'\n</style>',html)
html=re.sub(r'<script src="(js/[^"?]+\.js)(?:\?[^\"]+)?"></script>',lambda m:'<script>\n'+(ROOT/m.group(1)).read_text('utf-8').replace('</script>', '<\\/script>')+'\n</script>',html)
stub="""<script>const _s=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}};Object.defineProperty(window,'localStorage',{value:_s(),configurable:true});Object.defineProperty(window,'sessionStorage',{value:_s(),configurable:true});</script>"""
html=html.replace('<head>','<head>'+stub,1)
player_code=re.search(r'qa_player=(""".*?""")',(ROOT/'tests/v20-browser-qa.py').read_text('utf-8'),re.S)
ns={};exec('qa_player='+player_code.group(1),ns)
checks=[];errors=[]
def ck(name,value):
 checks.append((name,bool(value)));print('PASS' if value else 'FAIL',name,flush=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in [390,1440]:
  page=browser.new_page(viewport={'width':width,'height':900})
  page.on('pageerror',lambda ex:errors.append(str(ex)))
  page.route('https://**/*',lambda route:route.abort())
  page.set_content(html,wait_until='domcontentloaded',timeout=60000)
  page.wait_for_timeout(300)
  ck(f'{width} boot',page.evaluate('typeof state==="object"&&!!window.BTLQualification&&typeof chooseNextEvent==="function"'))
  page.evaluate(ns['qa_player'])
  page.evaluate("state.player.club='Arsenal';state.player.clubCountry='ENG';state.player.clubLeague='Premier League';state.player.clubCup='FA Cup';state.player.clubDivisionLevel=1;state.season=createSeason(state.player,2026,'UEFA Champions League');")
  ck(f'{width} Carabao separately',page.evaluate('state.season.leagueCup?.name==="Carabao Cup"&&state.season.cup.name==="FA Cup"&&state.season.leagueCup.stageIndex===2'))
  ck(f'{width} semi two legs, final one',page.evaluate('state.season.leagueCup.stages[5].legs===2&&state.season.leagueCup.stages[6].legs===1'))
  page.evaluate('state.season.cup.active=false;state.season.continental.active=false;state.season.league.index=3;state.season.leagueCup.nextLeagueRound=2')
  ck(f'{width} Carabao has event',page.evaluate("chooseNextEvent()?.competition==='Carabao Cup' && chooseNextEvent()?.type==='league-cup'"))
  # Disputar todas as rodadas: uma partida por rodada, duas na semifinal.
  page.evaluate('''() => {const c=state.season.leagueCup;let i=0;while(c.active&&i++<15){const e=getKnockoutEvent(c,'league-cup');processCompetitionResult(e,1,0)} }''')
  ck(f'{width} Carabao final grants title',page.evaluate("state.season.leagueCup.won===true&&state.season.leagueCup.active===false&&state.player.trophies.some(t=>t.name==='Carabao Cup')"))
  # Também qualifica um campeão que esteja na EFL Championship.
  page.evaluate('''() => {
    state.player.club='Wrexham';state.player.clubCountry='ENG';state.player.clubLeague='EFL Championship';state.player.clubDivisionLevel=2;
    state.season=createSeason(state.player,2026,null);
    state.season.league.finished=true;state.season.leagueCup.won=true;state.season.leagueCup.active=false;
    state.season.league.standings=[];
    commitSeasonQualifications(state.season);
  }''')
  ck(f'{width} EFL winner earns Conference playoff',page.evaluate("qualifiedForYear('ENG','Wrexham',2026)?.competition==='UEFA Conference League' && qualifiedForYear('ENG','Wrexham',2026)?.phase==='playoff'"))
  page.evaluate("state.season=createSeason(state.player,2027,'UEFA Conference League')")
  ck(f'{width} second division cup winner enters Europe',page.evaluate("state.season.continental?.name==='UEFA Conference League'&&state.season.continental.phase==='qualifying'"))
  # At year end apply one league table and ensure same club appears in next year field.
  page.evaluate('''() => {
   state.player.club='Flamengo';state.player.clubCountry='BR';state.player.clubLeague='Brasileirão Série A';state.player.clubCup='Copa do Brasil';state.player.clubDivisionLevel=1;
   state.season=createSeason(state.player,2028,'CONMEBOL Libertadores');
   state.season.league.finished=true;state.season.league.standings=['Palmeiras','Flamengo','Santos','Corinthians','Grêmio','Vasco da Gama','São Paulo','Cruzeiro','Botafogo','Fluminense','Bahia','Internacional'].map((team,i)=>({team,position:i+1,points:85-i*3}));
   state.season.league.position=2;state.season.leagueCup=null;
   commitSeasonQualifications(state.season);
  }''')
  q=page.evaluate('''() => ({flamengo:qualifiedForYear('BR','Flamengo',2028),stored:state.qualificationsByYear?.[2028]?.BR?.find(x=>x.team==='Flamengo')?.qualification,worldClubs:qualificationRowsForYear(2029,'CONMEBOL Libertadores'),tableClass:state.season.league.standings[1].qualificationColor})''')
  ck(f'{width} Brazil Flamengo second 2028 Libertadores main 2029',q['flamengo'] and q['flamengo']['competition']=='CONMEBOL Libertadores' and q['flamengo']['phase']=='league' and q['flamengo']['year']==2029)
  ck(f'{width} same saved qualifier lookup',q['flamengo']==q['stored'])
  ck(f'{width} colored table',bool(q['tableClass']))
  page.evaluate("state.season=createSeason(state.player,2029,qualifiedForYear('BR','Flamengo',2028)?.competition||null)")
  ck(f'{width} participates next season',page.evaluate("state.season.continental?.name==='CONMEBOL Libertadores'&&state.season.continental.phase==='phase'"))
  # Fifth slot should contest preliminaries
  page.evaluate("state.player.club='Grêmio';state.season=createSeason(state.player,2029,qualifiedForYear('BR','Grêmio',2028)?.competition||null)")
  # A Copa do Brasil agora produz resultados simulados persistidos. Se o 5º
  # conquistar uma vaga direta pela copa, ele não deve ser forçado à preliminar.
  ck(f'{width} fifth place follows recorded entry phase',page.evaluate("""() => {
    const slot=qualifiedForYear('BR','Grêmio',2028);return slot?.competition==='CONMEBOL Libertadores' &&
      state.season.continental?.phase===(slot.phase==='league'?'phase':'qualifying');
  }"""))
  page.evaluate("""() => {
    const c=state.season.continental;
    if(c.preliminary){c.phase='phase';c.preliminary.won=true;c.preliminary.active=false;resolveContinentalPreliminary(c);}
  }""")
  ck(f'{width} preliminary advances when applicable',page.evaluate("state.season.continental.active&&state.season.continental.phase==='phase'"))
  page.evaluate('''() => {state.season.league.standings=state.qualificationsByYear[2028].BR;state.season.league.finished=true;state.season.closed=true;state.season.league.position=5;state.season.cup.active=false;state.season.leagueCup=null;state.season.continental.active=false;showSeasonSummary()}''')
  ck(f'{width} table visual markers',page.evaluate('document.querySelectorAll("#summary-standings tr[style*=qualification-color]").length===12'))
  ck(f'{width} no horizontal scrolling',page.evaluate('document.documentElement.scrollWidth<=innerWidth+4'))
  page.close()
 browser.close()
result={'passed':sum(v for _,v in checks),'total':len(checks),'errors':errors,'failed':[x for x,v in checks if not v]}
(ROOT/'tests/QA-2026-Carabao-Qualification.json').write_text(json.dumps(result,indent=2,ensure_ascii=False))
print(result)
if result['failed'] or errors:raise SystemExit(1)
