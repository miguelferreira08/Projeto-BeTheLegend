from pathlib import Path
from playwright.sync_api import sync_playwright
import http.server,threading,os,json,base64,re
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'tests'/'QA-2026-10-26';OUT.mkdir(exist_ok=True)
results=[];errors=[]
def ck(label,cond,detail=''):
 ok=bool(cond);results.append({'label':label,'ok':ok,'detail':detail})
 if not ok:print('FAIL:',label,str(detail)[:350],flush=True)
s=(ROOT/'index.html').read_text('utf8')
s=re.sub(r'<link rel="stylesheet" href="(css/[^"?]+\.css)(?:\?[^"]+)?">',lambda m:'<style>\n'+(ROOT/m[1]).read_text('utf8')+'\n</style>',s)
s=re.sub(r'<script src="(js/[^"?]+\.js)(?:\?[^"]+)?"></script>',lambda m:'<script>\n'+(ROOT/m[1]).read_text('utf8')+'\n</script>',s)
stub="""<script>
const _s=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}};
Object.defineProperty(window,'localStorage',{value:_s(),configurable:true});Object.defineProperty(window,'sessionStorage',{value:_s(),configurable:true});
const account={accountKey:'guest:qa',id8:'12345678',nickname:'QA',type:'guest',email:'',createdAt:new Date().toISOString()};localStorage.setItem('btlAccountsV1',JSON.stringify([account]));localStorage.setItem('btlAuthSessionV1',JSON.stringify({accountKey:account.accountKey,issuedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+86400000).toISOString()}));
</script>"""
s=s.replace('<head>','<head>'+stub,1)
js_player="""(()=>{const p={name:'Jogador Teste',birthdate:'2006-01-01',age:20,nationality:'Brasil',nationalityCode:'BR',position:'Centroavante',foot:'Direito',club:'Flamengo',clubCountry:'BR',clubCountryName:'Brasil',clubStrength:84,clubLeague:'Brasileirão Série A',clubCup:'Copa do Brasil',clubDivisionLevel:1,number:9,overall:88,potential:94,initialPotential:94,value:100000000,titles:0,trophies:[],awards:[],calledUp:false,nationalTeamGames:0,nationalTeamGoals:0,nationalTeamAssists:0,nationalTrust:0,nationalCaptain:false,morale:80,reputation:50,developmentBoost:0,marketBonus:0,retired:false,appearance:{},attributes:{pace:90,finishing:92,dribbling:88,passing:82,defense:40,physical:87,weakFoot:4},dnaAttributes:{pace:90,finishing:92,dribbling:88,passing:82,defense:40,physical:87,weakFoot:4},attributeOrigins:{}};state={created:true,player:p,season:createSeason(p,2026,undefined),history:[],offers:[],news:[],pendingEvent:null,savedCareers:[]};save();render();showView('home');})()"""
# static assets
names=['uefa-champions-league','brasileirao-serie-a','copa-do-mundo','copa-america','libertadores','serie-a-italia','uefa-europa-league','bola-de-ouro','dfb-pokal','bundesliga','belgian-pro-league','chuteira-de-ouro','fa-cup']
for name in names:
 p=ROOT/'assets/trophies/from-rar'/f'{name}.png'
 ck('trophy asset '+name,p.is_file() and Image.open(p).mode=='RGBA' and Image.open(p).getpixel((0,0))[3]<30)

with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
 for width in [1440,390]:
  page=browser.new_page(viewport={'width':width,'height':900})
  page.on('pageerror',lambda e: errors.append(str(e)))
  page.route('https://**/*',lambda route:route.abort())
  page.set_content(s,wait_until='domcontentloaded',timeout=35000);page.wait_for_timeout(320)
  eval=page.evaluate
  ck(f'{width}: initialization without errors',eval('typeof render==="function" && typeof trophySourcesFor==="function"'))
  ck(f'{width}: name without example placeholder',eval('document.querySelector("#name").getAttribute("placeholder") === ""'))
  ck(f'{width}: trophy catalog 13 from RAR',eval('''() => {const cs=['UEFA Champions League','Brasileirão Série A','FIFA World Cup','Copa América','CONMEBOL Libertadores','Serie A','UEFA Europa League','Bola de Ouro','DFB-Pokal','Bundesliga','Belgian Pro League','Chuteira de Ouro','FA Cup'];return cs.every(x=>trophySourcesFor(x)[0]?.startsWith('assets/trophies/from-rar/'))}'''))
  ck(f'{width}: qualifiers never receive trophy',eval("trophySourcesFor('Eliminatórias da Copa do Mundo').length===0 && trophySourcesFor('Eliminatórias UEFA').length===0"))
  ck(f'{width}: separate Athletic crests',eval("BTLStaticCrests.resolve('Athletic Club','BR').includes('/brazil/Athletic.svg')&&BTLStaticCrests.resolve('Athletic Bilbao','ES').includes('/spain/Athletic_Club_Bilbao.svg')"))
  ck(f'{width}: no descriptions in events',eval("getComputedStyle(document.querySelector('#event-description')).display==='none'"))
  ck(f'{width}: no redundant warning panel',eval("getComputedStyle(document.querySelector('.game-confirm-info')).display==='none'"))
  ck(f'{width}: no page horizontal overflow',eval('document.documentElement.scrollWidth<=innerWidth+4'))
  page.evaluate(js_player);page.wait_for_timeout(200)
  rosters=eval("() => {const a=ensureWorldPlayers(),h=a.find(x=>x.name==='Hulk'),j=a.find(x=>x.name==='Jhon Arias');return {hulk:h?.club,arias:j?.club}}")
  ck(f'{width}: player roster Hulk Fluminense, Jhon Arias Palmeiras',rosters['hulk']=='Fluminense' and rosters['arias']=='Palmeiras',rosters)
  # user competition goals statistics verify only positive
  page.evaluate("leaderboardCompetition=state.season.league.name;leaderboardMode='goals';renderCompetitionLeaderboards()")
  leaderboard=eval('''() => ({values:[...document.querySelectorAll('#competition-leaderboard .leaderboard-row>strong')].map(el=>Number(el.textContent)),count:document.querySelectorAll('#competition-leaderboard .leaderboard-row').length})''')
  ck(f'{width}: no zero-goal entries',all(n>0 for n in leaderboard['values']),leaderboard)
  # UCL has rival participants from beyond user's club
  page.evaluate("window.__qaOldCont=state.season.continental;state.season.continental={name:'UEFA Champions League',phaseSchedule:[{opponent:'Real Madrid'},{opponent:'Barcelona'}],knockout:null};state.player.club='Manchester City';state.player.clubCountry='ENG'")
  ucl=eval("leaderboardCandidates('UEFA Champions League').map(x=>x.club)")
  ck(f'{width}: UCL includes other clubs',len(set(ucl))>1, ucl[:12])
  page.evaluate("state.season.continental=window.__qaOldCont;state.player.club='Flamengo';state.player.clubCountry='BR'")
  # Finalissima: only two nationalities in candidates
  f=eval('''() => {state.season.superCups.push({name:'Finalissima',scope:'national',opponent:{name:'Argentina',code:'AR'},stages:[{name:'Final'}]});const c=leaderboardCandidates('Finalissima');return {total:c.length,outsiders:c.filter(x=>!['BR','AR'].includes(x.nationalCode||x.countryCode)).map(x=>x.name)}}''')
  ck(f'{width}: Finalissima only two teams',f['total']>1 and not f['outsiders'],f)
  # club selection centering and order
  page.evaluate("showView('create');creationChoices=[{name:'Athletic Club',countryCode:'BR',strength:72}];renderCreationClubs?.()") if False else None
  # choose club card render from normal selection, or direct call with fixture
  page.evaluate("showView('create')")
  q=eval('''() => {const box=document.querySelector('#club-options');box.innerHTML='<button class="club-option"><span class="check"></span><span class="crest-shell small"></span><strong>Athletic Club</strong></button>';const b=box.firstElementChild; const r=b.getBoundingClientRect(),crest=b.querySelector('.crest-shell').getBoundingClientRect(),name=b.querySelector('strong').getBoundingClientRect();return {aligned:Math.abs((crest.left+crest.width/2)-(name.left+name.width/2))<12,ordered:crest.top<name.top,cr:[crest.x,crest.y,crest.width,crest.height],nr:[name.x,name.y,name.width,name.height],br:[r.x,r.y,r.width,r.height],style:getComputedStyle(b).display,dir:getComputedStyle(b).flexDirection,crestPos:getComputedStyle(b.querySelector('.crest-shell')).position,strongPos:getComputedStyle(b.querySelector('strong')).position,cssRules:[...document.styleSheets].length}}''')
  ck(f'{width}: crest above name and centered',q['aligned'] and q['ordered'],q)
  # Shootout sudden death circles, no sudden list
  pen=eval('''() => {const x={scope:'cup',team:'Flamengo',home:'Flamengo',away:'Santos',playerKickRound:1,shootoutLive:{phase:'sudden',score:{home:5,away:5},kicks:[]}};for(let i=1;i<=6;i++)for(const team of ['Flamengo','Santos'])x.shootoutLive.kicks.push({round:i,team,scored:true});const html=penaltyProgressMarkup(x);const div=document.createElement('div');div.innerHTML=html;return {dots:div.querySelectorAll('.penalty-dot').length,suddenDots:div.querySelectorAll('.sudden-dot').length,oldList:div.querySelectorAll('.penalty-sudden-list').length}}''')
  ck(f'{width}: penalty sudden circles',pen['dots']==12 and pen['suddenDots']==2 and pen['oldList']==0,pen)
  page.evaluate("state.pendingPenaltyShootout={scope:'cup',competition:'Copa do Brasil',stage:'Final',team:'Flamengo',home:'Flamengo',away:'Santos',playerKickRound:1,shootoutLive:{first:'Flamengo',nextTeam:'Flamengo',round:1,kicks:[],score:{home:0,away:0},remaining:{home:5,away:5},phase:'standard',waitingForPlayer:true,finished:false}};openPenaltyShootoutDecision()")
  page.evaluate("state.pendingPenaltyShootout.shootoutLive.waitingForPlayer=true;resolvePenaltyShootout(0)")
  ck(f'{width}: player penalty buttons disappear',eval("document.querySelector('#decision-choices').classList.contains('hidden')"))
  # Clear timers/state before testing match suspense (timeouts from shootout)
  page.evaluate("state.pendingPenaltyShootout=null;document.querySelector('#match-decision-modal').classList.add('hidden')")
  page.evaluate("openMatchDecision({type:'league',competition:'Brasileirão Série A',stage:'Rodada 1',round:1,home:'Flamengo',away:'Santos',opponent:'Santos'})")
  ck(f'{width}: enlarged match trophy',eval("document.querySelector('#decision-competition .honour-art')?.getBoundingClientRect().width >= 49"))
  ck(f'{width}: no club names over decision',eval("document.querySelector('#decision-match').textContent.trim()===''"))
  page.evaluate("resolveMatchDecision(0)")
  ck(f'{width}: suspense starts after decision',eval("!!document.querySelector('.decision-suspense') && document.querySelector('#decision-continue').classList.contains('hidden')"))
  page.wait_for_timeout(1080)
  ck(f'{width}: suspense resolves to result',eval("document.querySelector('.decision-suspense')===null && !document.querySelector('#decision-continue').classList.contains('hidden')"))
  # Ballon d'Or ceremony rendering and overlap measurement
  page.evaluate("state.pendingPenaltyShootout=null;document.querySelector('#match-decision-modal').classList.add('hidden');showAwardCeremony({name:'Bola de Ouro',winner:'Kylian Mbappé',stats:['40 gols','15 assistências','1 título','nota 8.2'],copy:'Kylian Mbappé terminou à frente dos demais atletas.',isUserWinner:false})")
  page.wait_for_timeout(3450)
  gala=eval("""() => {const ids=['award-ceremony-kicker','award-ceremony-title','award-ceremony-stats','award-ceremony-copy','award-ceremony-continue'],a=ids.map(i=>document.getElementById(i).getBoundingClientRect()),stage=document.getElementById('award-ceremony-stage').getBoundingClientRect();return {boxes:a.map(r=>({top:r.top,bottom:r.bottom,left:r.left,right:r.right})),st:{top:stage.top,bottom:stage.bottom,left:stage.left,right:stage.right},ordered:a[1].bottom<=a[2].top+3&&a[2].bottom<=a[4].top+3,contained:[a[1],a[2],a[4]].every(r=>r.left>=stage.left-3&&r.right<=stage.right+3)}}""")
  ck(f'{width}: Ballon dOr elements without overlap',gala['ordered'] and gala['contained'],gala)
  page.locator('#award-ceremony-modal').screenshot(path=str(OUT/f'gala-{width}.png'))
  page.evaluate("document.querySelector('#award-ceremony-modal').classList.add('hidden')")
  # screenshot match modal
  if width==390:page.screenshot(path=str(OUT/'match-390.png'),full_page=True)
  if width==1440:page.screenshot(path=str(OUT/'match-1440.png'),full_page=True)
  page.close()
 browser.close()

report={'passed':sum(x['ok'] for x in results),'total':len(results),'errors':errors,'failures':[x for x in results if not x['ok']]}
(OUT/'user16-browser.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('USER16',report['passed'],'/',report['total'],'page errors',len(errors),flush=True)
if report['failures'] or errors:exit(1)
