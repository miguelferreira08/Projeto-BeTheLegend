from pathlib import Path
from playwright.sync_api import sync_playwright
import re,json,base64,sys
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'tests'/'QA-V21';OUT.mkdir(exist_ok=True)
s=(ROOT/'index.html').read_text(encoding='utf-8')
s=re.sub(r'<link rel="stylesheet" href="(css/[^"?]+\.css)(?:\?[^\"]+)?">',lambda m:'<style>\n'+(ROOT/m[1]).read_text(encoding='utf-8')+'\n</style>',s)
s=re.sub(r'<script src="(js/[^"?]+\.js)(?:\?[^\"]+)?"></script>',lambda m:'<script>\n'+(ROOT/m[1]).read_text(encoding='utf-8')+'\n</script>',s)
for code in ['br','us','es','fr']:
 data=base64.b64encode((ROOT/f'assets/flags/{code}.svg').read_bytes()).decode('ascii')
 s=s.replace(f'assets/flags/{code}.svg',f'data:image/svg+xml;base64,{data}')
s=s.replace('<head>', '''<head><script>
const _s=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}};
Object.defineProperty(window,'localStorage',{value:_s(),configurable:true});Object.defineProperty(window,'sessionStorage',{value:_s(),configurable:true});
const account={accountKey:'guest:qa',id8:'12345678',nickname:'QA',type:'guest',email:'',createdAt:new Date().toISOString()};localStorage.setItem('btlAccountsV1',JSON.stringify([account]));localStorage.setItem('btlAuthSessionV1',JSON.stringify({accountKey:account.accountKey,issuedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+86400000).toISOString()}));
</script>''',1)
# Keep one inline repro for QA
(OUT/'inline-qa.html').write_text(s,encoding='utf-8')
old_test=(ROOT/'tests/v20-browser-qa.py').read_text(encoding='utf-8')
player=re.search(r'qa_player=(""".*?""")',old_test,re.S)
assert player
ns={};exec('qa_player='+player.group(1),ns);qa_player=ns['qa_player']
checks=[];errs=[]
def ck(label,actual,expected=True):
 passed=actual==expected;checks.append({'label':label,'passed':bool(passed),'observed':str(actual)[:180]});
 if not passed:print('FAIL',label,actual,expected)
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
 for width in (1440,1024,768,390,320):
  page=browser.new_page(viewport={'width':width,'height':960 if width>=768 else 850},device_scale_factor=1)
  page.route('https://**/*',lambda route:route.abort())
  page.on('pageerror',lambda err:errs.append(f'{width}: {err}'))
  page.set_content(s,wait_until='domcontentloaded',timeout=90000)
  page.wait_for_timeout(230)
  js=lambda q:page.evaluate(q)
  ck(f'{width}: 100 palette spreadsheet',js('window.BTLCompetitionPalettes?.palettes?.length'),100)
  ck(f'{width}: responsive home',js('document.documentElement.scrollWidth <= innerWidth+3'))
  page.locator('#home-language-btn').click(timeout=12000)
  ck(f'{width}: language opens',page.locator('#language-modal').evaluate("el=>!el.classList.contains('hidden')"))
  flags=page.locator('#language-modal .language-flag img')
  ck(f'{width}: four flags shown',flags.count(),4)
  ck(f'{width}: four SVG flags load',flags.evaluate_all('nodes=>nodes.every(n=>n.complete && n.naturalWidth>0)'))
  if width in (1440,390):page.screenshot(path=str(OUT/f'language-{width}.png'))
  for lang,menu,create,translation in [('en','Language','New career','Current career'),('es','Idioma','Nueva carrera','Carrera actual'),('fr','Langue','Nouvelle carrière','Carrière actuelle'),('pt-BR','Linguagem','Nova carreira','Carreira atual')]:
   page.locator(f'[data-language="{lang}"]').click()
   page.wait_for_timeout(75)
   ck(f'{width}: locale {lang}',js('document.documentElement.lang'),lang)
   ck(f'{width}: language selector translated {lang}',page.locator('#home-language-btn .football-menu-copy b').inner_text().casefold(),menu.casefold())
   ck(f'{width}: navigation translated {lang}',page.locator('#home-new-career .football-menu-copy b').inner_text().casefold(),create.casefold())
   ck(f'{width}: header translated {lang}',page.locator('.home-career-slot-head > span').inner_text().casefold(),translation.casefold())
  # Dynamic node: text updated after selecting a language
  page.locator('[data-language="en"]').click();page.evaluate("document.querySelector('#home-career-status').textContent='ATIVA'");page.wait_for_timeout(130)
  ck(f'{width}: dynamic English',page.locator('#home-career-status').inner_text(),'ACTIVE')
  page.locator('[data-language="fr"]').click();page.wait_for_timeout(90)
  ck(f'{width}: dynamic French',page.locator('#home-career-status').inner_text(),'ACTIVE')
  page.locator('[data-language="pt-BR"]').click();page.wait_for_timeout(90)
  ck(f'{width}: reversibility',page.locator('#home-career-status').inner_text(),'ATIVA')
  page.locator('#language-modal-done').click()
  page.evaluate(qa_player);page.wait_for_timeout(110)
  # Relevant detail visible, portrait and name not overlapping
  bbox=js("(()=>{const a=document.querySelector('#home-career-face').getBoundingClientRect(),b=document.querySelector('#home-current-player').getBoundingClientRect();return {pass:b.left>=a.right-3&&b.right<=innerWidth+3}})()")
  ck(f'{width}: career card portrait clearance',bbox['pass'])
  ck(f'{width}: home no horizontal overflow after career',js('document.documentElement.scrollWidth<=innerWidth+3'))
  for comp,primary in [('UEFA Champions League','#071B49'),('UEFA Europa League','#F26A21'),('UEFA Conference League','#17A96B'),('Brasileirão Série A','#C7FF00'),('Premier League','#37003C')]:
   page.evaluate("comp=>applyCompetitionExperienceTheme({competition:comp})",comp)
   ck(f'{width}: theme {comp}',js("getComputedStyle(document.documentElement).getPropertyValue('--competition-primary').trim()"),primary)
   # Verify transfer compatibility call never resets theme.
   page.evaluate('applyClubTheme("Flamengo")')
   ck(f'{width}: club cannot override competition {comp}',js("getComputedStyle(document.documentElement).getPropertyValue('--competition-primary').trim()"),primary)
  page.evaluate("state.pendingPenaltyShootout={scope:'cup',competition:'UEFA Champions League',stage:'Final',team:'Barcelona',home:'Barcelona',away:'Real Madrid',playerKickRound:null};openPenaltyShootoutDecision()")
  page.wait_for_timeout(100)
  ck(f'{width}: modal competition uses UCL theme',js("getComputedStyle(document.documentElement).getPropertyValue('--competition-primary').trim()"),'#071B49')
  ck(f'{width}: decision palette matches workbook',js("getComputedStyle(document.querySelector('#match-decision-modal .decision-card')).getPropertyValue('--comp-primary').trim()"),'#071B49')
  ck(f'{width}: penalty options visible',page.locator('#decision-choices .decision-option').count(),5)
  ck(f'{width}: modal choices fit',js("[...document.querySelectorAll('#decision-choices .decision-option')].every(e=>{const r=e.getBoundingClientRect();return r.left>=-3&&r.right<=innerWidth+3})"))
  if width in (1440,390):
   page.screenshot(path=str(OUT/f'penalty-{width}.png'))
  page.locator('#match-decision-modal').evaluate('e=>e.classList.add("hidden")')
  if width in (1440,390):page.screenshot(path=str(OUT/f'home-{width}.png'))
  page.close()
 browser.close()
res={'passed':sum(r['passed'] for r in checks),'total':len(checks),'pageerrors':errs,'checks':checks}
(OUT/'results.json').write_text(json.dumps(res,ensure_ascii=False,indent=2))
print('V21 QA:',res['passed'],'/',res['total'],'page errors:',len(errs))
for x in errs[:5]:print('JS',x[:200])
if res['passed']!=res['total'] or errs:sys.exit(1)
