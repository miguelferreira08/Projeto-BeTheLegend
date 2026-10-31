"""Independent controlled browser regression for match-based national/international tables."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re,json
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'index.html').read_text('utf-8')
html=re.sub(r'<link[^>]+href="(css/[^"?]+\.css)(?:\?[^\"]+)?"[^>]*>',lambda m:'<style>\n'+(ROOT/m.group(1)).read_text('utf-8')+'\n</style>',html)
html=re.sub(r'<script src="(js/[^"?]+\.js)(?:\?[^\"]+)?"></script>',lambda m:'<script>\n'+(ROOT/m.group(1)).read_text('utf-8').replace('</script>','<\\/script>')+'\n</script>',html)
stub="""<script>const _s=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}};Object.defineProperty(window,'localStorage',{value:_s(),configurable:true});Object.defineProperty(window,'sessionStorage',{value:_s(),configurable:true});</script>"""
html=html.replace('<head>','<head>'+stub,1)
raw=re.search(r'qa_player=(""".*?""")',(ROOT/'tests/v20-browser-qa.py').read_text(),re.S);ns={};exec('qa_player='+raw.group(1),ns)
checks=[];errors=[]
def ck(label,value):checks.append((label,bool(value)));print('PASS' if value else 'FAIL',label,flush=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in [390,1440]:
  page=browser.new_page(viewport={'width':width,'height':900});page.on('pageerror',lambda e:errors.append(str(e)))
  page.route('https://**/*',lambda route:route.abort())
  page.set_content(html,wait_until='domcontentloaded',timeout=60000)
  page.evaluate(ns['qa_player'])
  ck(f'{width} ledger module active',page.evaluate('Boolean(window.BTLMatchLedger?.create && window.BTLMatchLedger?.standings)'))
  # Real match processing, no direct editing of fixture results.
  page.evaluate('''() => {
   const p=state.player;p.club='Flamengo';p.clubCountry='BR';p.clubLeague='Brasileirão Série A';p.clubDivisionLevel=1;
   state.season=createSeason(p,2028,null);
   const s=state.season; s.cup.active=false;
   for(let i=0;i<s.league.schedule.length;i++){
      const ev=s.league.schedule[i];processCompetitionResult(ev,i%3===0?2:1,i%4===0?1:0);
   }
  }''')
  checks_js='''() => {const s=state.season,l=s.league,a=l.standings,ledger=l.matchLedger;
    const goals=ledger.results.reduce((n,m)=>n+m.homeGoals+m.awayGoals,0);
    const tally=ledger.results.reduce((o,m)=>{o.total++;o.draw+=m.homeGoals===m.awayGoals?1:0;return o},{total:0,draw:0});
    return {finished:l.finished,teams:a.length,clubGames:a.find(r=>r.user)?.games,clubPoints:a.find(r=>r.user)?.points,
      scorePoints:l.points, allGames:a.every(r=>r.games===l.schedule.length),
      totalMatches:ledger.results.length,expectedMatches:a.length*l.schedule.length/2,
      totalGoals:a.reduce((n,r)=>n+r.gf,0),totalAgainst:a.reduce((n,r)=>n+r.ga,0),
      ledgerGoals:goals,pointsSum:a.reduce((n,r)=>n+r.points,0),expectedPoints:3*tally.total-tally.draw,
      sameSet:a.every(r=>ledger.teams.includes(r.team)),source:l.resultIntegrity,playIds:new Set(ledger.results.map(m=>m.id)).size};}'''
  x=page.evaluate(checks_js)
  ck(f'{width} national table completed',x['finished'] and x['teams']==20 and x['clubGames']==38)
  ck(f'{width} player points and history never redrawn',x['clubPoints']==x['scorePoints'])
  ck(f'{width} all domestic clubs have exact number of fixtures',x['allGames'])
  ck(f'{width} no league match counted twice',x['totalMatches']==x['expectedMatches']==x['playIds'])
  ck(f'{width} goals for = against = scorelines',x['totalGoals']==x['totalAgainst']==x['ledgerGoals'])
  ck(f'{width} three points win and one draw',x['pointsSum']==x['expectedPoints'])
  ck(f'{width} only real teams from calendar',x['sameSet'])
  page.evaluate('commitSeasonQualifications(state.season)')
  ck(f'{width} own table persisted to next year',page.evaluate('''() => {
     const s=state.season,code='BR',stored=state.qualificationsByYear[2028][code];
     return stored.length===s.league.standings.length && stored.every((r,i)=>r.team===s.league.standings[i].team&&
      (r.qualification?.competition||'')===(s.league.standings[i].qualification?.competition||''));}'''))
  ck(f'{width} other-country tables derived from match records',page.evaluate('''() => {
   const v=window.BTLExternalLeagueMatches(2028,'ENG','Premier League');
   const a=state.globalStandingsByYear[2028]['ENG|Premier League'];
   const b=BTLMatchLedger.standings(v);return !!v && v.results.length>100&&a.every((r,i)=>r.team===b[i].team&&r.points===b[i].points);
  }'''))
  ck(f'{width} promotions recorded for next season',page.evaluate("Boolean(state.leaguePoolsByYear?.[2029]?.['BR|Série B'])"))
  # First division and secondary division use different participants.
  page.evaluate('''() => {const p=state.player;p.club='Athletic Club';p.clubCountry='BR';p.clubLeague='Série B';p.clubDivisionLevel=2;
   state.season=createSeason(p,2027,null);let s=state.season;
   s.league.schedule.forEach((e,i)=>processCompetitionResult(e,i%2, (i+1)%2));
  }''')
  ck(f'{width} secondary table solely schedule clubs',page.evaluate('''() => {
   const l=state.season.league,clubs=new Set(l.schedule.flatMap(m=>[m.home,m.away]));
   return l.finished&&l.standings.every(r=>clubs.has(r.team))&&l.standings.every(r=>r.games===l.schedule.length)
    &&l.standings.every(r=>!r.qualification);
  }'''))
  # 2026/27 UEFA group / league stage, with ALL entrants scheduled.
  page.evaluate('''() => {const p=state.player;p.club='Arsenal';p.clubCountry='ENG';p.clubLeague='Premier League';p.clubDivisionLevel=1;
   state.season=createSeason(p,2026,'UEFA Champions League');const c=state.season.continental;
   c.phaseSchedule.forEach((e,i)=>processContinentalResult(e,i%3===0?2:1,i%4===0?1:0));
  }''')
  ck(f'{width} international phase standings all 36 clubs',page.evaluate('''() => {
   const c=state.season.continental,l=c.phaseLedger,a=c.phaseStandings;
   return a.length===36 && l.results.length===144 && a.every(r=>r.games===8) &&
    a.every(r=>r.points===r.wins*3+r.draws) && c.phaseRank===a.find(r=>r.team==='Arsenal')?.position;
  }'''))
  ck(f'{width} international advancement uses table position',page.evaluate('''() => {
   const c=state.season.continental;return c.phaseQualification?.qualified=== (c.phaseRank<=24) &&
    c.phaseQualification?.direct===(c.phaseRank<=8);
  }'''))
  ck(f'{width} continental ranking limits team list to participants',page.evaluate('''() => {
   const c=state.season.continental,teams=clubsForLeaderboardCompetition(c.name);return c.phaseStandings.every(x=>teams.has(x.team));
  }'''))
  page.evaluate("() => {state.season.closed=true;state.season.league.position=3;showSeasonSummary();}")
  ck(f'{width} international table is expandable and preserves score ranking',page.evaluate("""() => {
    const el=document.querySelector('#summary-international-details');return !el.classList.contains('hidden') &&
      el.querySelectorAll('tbody tr').length===state.season.continental.phaseStandings.length;
  }"""))
  ck(f'{width} summary avoids horizontal document scroll',page.evaluate('document.documentElement.scrollWidth<=innerWidth+6'))
  page.evaluate("document.querySelector('#season-summary-modal').classList.add('hidden')")
  # New season from saved older career: no invented match score for legacy user games.
  page.evaluate('''() => {const p=state.player;p.club='Santos';p.clubCountry='BR';p.clubLeague='Brasileirão Série A';p.clubDivisionLevel=1;
   state.season=createSeason(p,2030,null);const l=state.season.league;
   l.index=4;l.points=7;l.wins=2;l.draws=1;l.losses=1;l.gf=8;l.ga=6;ensureSeasonLeagueLedger(state.season);
   processCompetitionResult(l.schedule[4],2,0);
  }''')
  ck(f'{width} migration preserves old cumulative match stats',page.evaluate('''() => {
    const l=state.season.league,r=BTLMatchLedger.standings(l.matchLedger).find(r=>r.user||r.team==='Santos');
    return l.matchLedger.legacy.games===4 && l.matchLedger.results.filter(m=>m.source==='partida do jogador').length===1
      && r.games===5&&r.points===10&&r.gf===10&&r.ga===6;
  }'''))
  page.close()
 browser.close()
result={'passed':sum(x for _,x in checks),'total':len(checks),'errors':errors,'failed':[l for l,b in checks if not b]}
(ROOT/'tests/QA-Ledger-2026.json').write_text(json.dumps(result,indent=2,ensure_ascii=False))
print(json.dumps(result,ensure_ascii=False))
if result['failed'] or errors:raise SystemExit(1)
