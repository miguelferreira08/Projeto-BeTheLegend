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
def ck(name,val):checks.append((name,bool(val)));print('PASS' if val else 'FAIL',name,flush=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in [390,1440]:
  page=browser.new_page(viewport={'width':width,'height':900})
  page.route('https://**/*',lambda route:route.abort())
  page.on('pageerror',lambda error:errors.append(str(error)))
  page.set_content(html,wait_until='domcontentloaded',timeout=60000)
  page.evaluate(ns['qa_player'])
  ck(f'{width} initial cache loaded',page.evaluate('Boolean(window.BTLInitialInternational?.forClub("Flamengo")&&window.BTLSeasonDivisions?.rules.length===8)'))
  page.evaluate('''() => {state.player.club='Flamengo';state.player.clubCountry='BR';state.player.clubLeague='Brasileirão Série A';state.player.clubDivisionLevel=1;
    state.season=createSeason(state.player,2026,undefined); }''')
  ck(f'{width} 2026 Flamengo actual Libertadores',page.evaluate('state.season.continental?.name==="CONMEBOL Libertadores"'))
  ck(f'{width} initial Libertadores rivals real list',page.evaluate('state.season.continental.phaseSchedule.every(e=>window.BTLInitialInternational.forClubIn(e.opponent,"CONMEBOL Libertadores"))'))
  page.evaluate('''() => {state.player.club='Coritiba';state.player.clubCountry='BR';state.player.clubLeague='Brasileirão Série A';state.player.clubDivisionLevel=1;
    state.season=createSeason(state.player,2026,undefined); }''')
  ck(f'{width} Coritiba no fabricated 2026 Conmebol',page.evaluate('state.season.continental===null'))
  page.evaluate('''() => {
   state.player.club='Santos';state.player.clubCountry='BR';state.player.clubLeague='Brasileirão Série A';state.player.clubDivisionLevel=1;
   state.season=createSeason(state.player,2026,undefined);
   const s=state.season,all=leaguePoolForCountry('BR','Santos','Brasileirão Série A',2026);
   s.league.finished=true;
   s.league.standings=all.filter(t=>t!=='Santos').map((team,i)=>({team,position:i+1,points:100-i,gd:20-i})).concat([{team:'Santos',position:20,points:1,gd:-30,user:true}]);
   s.league.position=20;commitSeasonQualifications(s);
  }''')
  ck(f'{width} 2026 red relegation Santos',page.evaluate('state.season.league.standings.find(x=>x.team==="Santos")?.relegated===true'))
  ck(f'{width} Santos registered Série B 2027',page.evaluate('state.leaguePoolsByYear?.[2027]?.["BR|Série B"]?.includes("Santos")===true'))
  page.evaluate('''() => {adaptClubDivisionForNextSeason(2027);state.season=createSeason(state.player,2027,null);}''')
  ck(f'{width} Santos starts Serie B 2027',page.evaluate('state.season.league.name==="Série B"&&state.player.clubDivisionLevel===2'))
  ck(f'{width} 2027 Serie B opponents actually Serie B',page.evaluate('state.season.league.schedule.length>0&&state.season.league.schedule.every(e=>state.leaguePoolsByYear[2027]["BR|Série B"].includes(e.opponent))'))
  ck(f'{width} no fictional continental for demoted side',page.evaluate('state.season.continental===null'))
  page.evaluate('''() => {state.player.club='Wrexham';state.player.clubCountry='ENG';state.player.clubLeague='EFL Championship';state.player.clubDivisionLevel=2; state.leaguePoolsByYear=undefined;
    ensureDivisionPools(2026);state.season=createSeason(state.player,2026,null);
    const teams=leaguePoolForCountry('ENG','Wrexham','EFL Championship',2026);
    state.season.league.finished=true;state.season.league.standings=teams.map((team,i)=>({team,points:team==='Wrexham'?120:100-i,gd:20-i,user:team==='Wrexham'})).sort((a,b)=>b.points-a.points);
    commitSeasonQualifications(state.season);adaptClubDivisionForNextSeason(2027);
    state.season=createSeason(state.player,2027,null);
  }''')
  ck(f'{width} EFL champion promoted',page.evaluate('state.player.clubLeague==="Premier League"&&state.player.clubDivisionLevel===1'))
  ck(f'{width} promoted Wrexham faces EPL in 2027',page.evaluate('state.season.league.schedule.every(e=>state.leaguePoolsByYear[2027]["ENG|Premier League"].includes(e.opponent))'))
  ck(f'{width} no horizontal scroll',page.evaluate('document.documentElement.scrollWidth<=innerWidth+6'))
  page.close()
 browser.close()
result={'passed':sum(x for _,x in checks),'total':len(checks),'errors':errors,'failed':[x for x,b in checks if not b]}
(ROOT/'tests/QA-Divisions-2026.json').write_text(json.dumps(result,indent=2,ensure_ascii=False))
print(result)
if result['failed'] or errors:raise SystemExit(1)
