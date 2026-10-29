from pathlib import Path
import json,re
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'index.html').read_text()
def embed_css(m):
 fn=m.group(1).split('?')[0];return '<style>'+ (ROOT/'css'/fn).read_text()+'</style>'
def embed_js(m):
 fn=m.group(1).split('?')[0];return '<script>'+ (ROOT/'js'/fn).read_text().replace('</script>', '<\\/script>')+'</script>'
html=re.sub(r'<link[^>]+href="css/([^"]+)"[^>]*>',embed_css,html)
html=re.sub(r'<script src="js/([^"]+)"[^>]*></script>',embed_js,html)
html=html.replace('<head>','<head>'+"<script>const _s=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}};Object.defineProperty(window,'localStorage',{value:_s(),configurable:true});Object.defineProperty(window,'sessionStorage',{value:_s(),configurable:true});</script>",1)
results=[];errors=[]
def ck(k,v):results.append({'name':k,'ok':bool(v)});print(('PASS' if v else 'FAIL'),k)
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  for width in (390,1440):
   page=browser.new_page(viewport={'width':width,'height':900 if width==1440 else 844})
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.route('**/*', lambda r:r.abort())
   page.set_content(html,wait_until='domcontentloaded',timeout=30000)
   page.wait_for_timeout(350)
   # The network is blocked in this environment. Simulate successful image preloads
   # for two known real clubs, and failure for an unmapped name.
   page.evaluate('''() => {window.Image=class {constructor(){this.complete=false;this.naturalWidth=0;this.naturalHeight=0;}set src(value){this._src=value;Promise.resolve().then(()=>{if(value.includes('corinthians.png')||value.includes('Flamengo')){this.complete=true;this.naturalWidth=110;this.naturalHeight=110;this.onload?.();}else this.onerror?.()})}get src(){return this._src}}}''')
   ck(f'{width}: app ready',page.evaluate('typeof checkMatchCrestsBeforeDecision === "function"'))
   ck(f'{width}: css rule loaded',page.evaluate("[...document.querySelectorAll('style')].some(x=>x.textContent.includes('btl-crest-gate'))"))
   ck(f'{width}: Corinthians local',page.evaluate('window.BTLStaticCrests.resolve("Corinthians","BR") === "assets/club-crests/user/corinthians.png"'))
   # Two different badges (one local, other remote mocked) - must preload before releasing decision.
   page.evaluate('''() => {window.qaGateReady=null;checkMatchCrestsBeforeDecision({type:'league',home:'Corinthians',away:'Flamengo',competition:'Brasileirão Série A'},(fallback)=>{window.qaGateReady={fallback,at:performance.now()}})}''')
   ck(f'{width}: decisions blocked during crest preload',page.evaluate("document.querySelector('#decision-choices').querySelectorAll('[data-decision-option]').length===0"))
   page.wait_for_function('window.qaGateReady !== null',timeout=10000)
   ck(f'{width}: logos success opens automatically',page.evaluate('window.qaGateReady.fallback === false'))
   ck(f'{width}: two logos preloaded',page.evaluate('decisionCrestLoaded.size >= 2'))
   ck(f'{width}: loaded club names tracked',page.evaluate('nextMatchTeamMarkup("Corinthians",{type:"league"}).includes("data-next-club")'))
   # Missing unknown crest triggers explicit retry/continue instead of unknown team.
   page.evaluate('''() => {window.qaGateReady=null;checkMatchCrestsBeforeDecision({type:'league',home:'Corinthians',away:'Clube Inventado QA',competition:'Brasileirão Série A'},fallback=>window.qaGateReady={fallback})}''')
   page.wait_for_function("!!document.querySelector('[data-crest-names]')",timeout=10000)
   ck(f'{width}: retry available',page.locator('[data-crest-retry]').count()==1)
   ck(f'{width}: club name visible despite missing crest',page.evaluate("document.querySelector('#decision-visual').textContent.includes('Clube Inventado QA')"))
   page.evaluate("document.querySelector('[data-crest-names]').click()")
   ck(f'{width}: allows explicit fallback with names',page.evaluate('window.qaGateReady.fallback === true'))
   # Browser real fallback element: mark no file and show club name.
   page.evaluate('''() => {document.querySelector('#decision-result').innerHTML=decisionScoreboardMarkup({event:{type:'league',home:'Corinthians',away:'Clube Inventado QA',competition:'Brasileirão Série A'},homeGoals:1,awayGoals:0});hydrateNextMatchBadges()}''')
   page.wait_for_timeout(180)
   ck(f'{width}: readable club name replaces unavailable crest',page.evaluate('''() => {const e=document.querySelector('[data-next-club="Clube Inventado QA"] .crest-fallback');return e&&getComputedStyle(e).display!=='none'&&e.textContent.includes('Clube Inventado QA')}'''))
   # Full integration: the real match-decision flow remains playable once badges load.
   player_source=(ROOT/'tests/v20-browser-qa.py').read_text()
   player_code=re.search(r'qa_player=(""".*?""")',player_source,re.S)
   scope={};exec('qa_player='+player_code.group(1),scope)
   page.evaluate(scope['qa_player'])
   page.evaluate("openMatchDecision({type:'league',home:'Corinthians',away:'Flamengo',competition:'Brasileirão Série A',round:1})")
   page.wait_for_function('!!document.querySelector("#match-decision-modal [data-decision-option]")',timeout=10000)
   ck(f'{width}: actual match decision opens when both badges loaded',page.locator('#match-decision-modal [data-decision-option]').count()>=2)
   page.evaluate("state.pendingMatchDecision=null;state.pendingPenaltyShootout={scope:'cup',type:'cup',competition:'Copa do Brasil',stage:'Final',team:'Flamengo',home:'Corinthians',away:'Flamengo',playerKickRound:null};openPenaltyShootoutDecision()")
   page.wait_for_function('document.querySelectorAll("#decision-choices [data-penalty-order]").length===5',timeout=10000)
   ck(f'{width}: penalty order unlocks after crest validation',page.locator('#decision-choices [data-penalty-order]').count()==5)
   # Preview all six hairstyles in user scale (w/o any screenshot replacement)
   page.evaluate('''() => {let root=document.getElementById('qa-hair-preview');if(!root){root=document.createElement('div');root.id='qa-hair-preview';document.body.append(root);}root.style.cssText='position:fixed;z-index:999999;inset:0;background:#10232a;overflow:auto;display:grid;grid-template-columns:repeat(3,minmax(100px,1fr));gap:12px;padding:20px';root.innerHTML=['fade','short','curly','afro','mohawk','long'].map(x=>`<div style="min-width:0;text-align:center;color:white"><div>${x}</div>${appearanceMarkup({...DEFAULT_APPEARANCE,hairStyle:x},false,'10')}</div>`).join('')}''')
   screenshot=ROOT/'tests'/f'QA-V26-hair-{width}.png';page.screenshot(path=str(screenshot))
   ck(f'{width}: six hairstyle previews',page.evaluate('document.querySelectorAll("#qa-hair-preview svg").length === 6'))
   page.close()
  browser.close()
finally:pass
summary={'passed':sum(x['ok'] for x in results),'total':len(results),'failed':[x for x in results if not x['ok']],'errors':errors}
(ROOT/'tests'/'QA-V26-results.json').write_text(json.dumps(summary,indent=2,ensure_ascii=False))
print(json.dumps(summary,ensure_ascii=False,indent=2))
if summary['failed'] or errors:raise SystemExit(1)
