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
def test(name,val):
 checks.append((name,bool(val)));print('PASS' if val else 'FAIL',name,flush=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in [390,1440]:
  page=browser.new_page(viewport={'width':width,'height':900})
  page.route('https://**/*',lambda route:route.abort())
  page.on('pageerror',lambda error:errors.append(str(error)))
  page.set_content(html,wait_until='domcontentloaded',timeout=60000)
  page.evaluate(ns['qa_player'])
  page.evaluate('''() => {
    state.player.club='Athletic Club';state.player.clubCountry='BR';state.player.clubLeague='Série B';state.player.clubDivisionLevel=2;
    state.season=createSeason(state.player,2026,null);
    const l=state.season.league;l.index=l.schedule.length;l.wins=22;l.draws=7;l.losses=l.schedule.length-29;l.gf=61;l.ga=25;l.points=73;
    finalizeLeague();commitSeasonQualifications(state.season);
  }''')
  test(f'{width}: tabela da Série B coincide com o calendário',page.evaluate('''() => {
     const l=state.season.league;
     const scheduled=[...new Set([state.season.clubAtStart,...l.schedule.flatMap(m=>[m.home,m.away])])];
     return l.standings.length===scheduled.length && l.standings.every(r=>scheduled.includes(r.team));
  }'''))
  test(f'{width}: primeira divisão não foi inserida na Série B',page.evaluate('!state.season.league.standings.some(r=>r.team==="Flamengo"||r.team==="Palmeiras")'))
  test(f'{width}: vaga continental não é oferecida por colocação na Série B',page.evaluate('!state.season.league.standings.some(r=>r.qualification)'))
  test(f'{width}: outcomes globais persistidos',page.evaluate('!!state.seasonOutcomesByYear?.[2026]?.US?.mlsCupWinner&&!!state.seasonOutcomesByYear?.[2026]?.MX?.aperturaRunnerUp'))
  test(f'{width}: MLS classificada via Shield e Copa',page.evaluate('state.qualificationsByYear[2026].US.filter(r=>r.qualification?.competition==="CONCACAF Champions Cup").length===6'))
  test(f'{width}: Liga MX seis vagas',page.evaluate('state.qualificationsByYear[2026].MX.filter(r=>r.qualification?.competition==="CONCACAF Champions Cup").length===6'))
  test(f'{width}: tabela global e transições sem duplicidade',page.evaluate('''() => Object.values(state.leaguePoolsByYear[2027]||{}).every(p=>p.length===new Set(p).size)'''))
  test(f'{width}: primeira divisão exclui Athletic-MG',page.evaluate('!state.qualificationsByYear[2026].BR.some(r=>r.team==="Athletic Club"&&r.qualification)'))
  test(f'{width}: não há nova imagem genérica das Eliminatórias',page.evaluate('trophyArtFor("Eliminatórias da Copa do Mundo")===""'))
  test(f'{width}: sistema carregado no browser',page.evaluate('!!window.BTLSeasonOutcomes?.determine && window.BTLLeagueRegulations?.count===32'))
  test(f'{width}: navegação sem rolagem horizontal',page.evaluate('document.documentElement.scrollWidth<=innerWidth+6'))
  page.close()
 browser.close()
result={'passed':sum(ok for _,ok in checks),'total':len(checks),'failed':[name for name,ok in checks if not ok],'errors':errors}
(ROOT/'tests/QA-Final-2026.json').write_text(json.dumps(result,indent=2,ensure_ascii=False))
print(json.dumps(result,ensure_ascii=False))
if result['failed'] or errors:raise SystemExit(1)
