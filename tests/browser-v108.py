"""Self-contained render/motion regression; avoids prohibited file/localhost browser navigation."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image, ImageChops
root=Path(__file__).resolve().parents[1]
css=(root/'css/style.css').read_text()
app=(root/'js/app.js').read_text()
fn=app[app.index('function eventSceneMarkup(e){'):app.index('\n\nfunction playCareerEventResolution',app.index('function eventSceneMarkup(e){'))]
setup="""
const state={player:{name:'Jogador de Teste',number:10,appearance:{}},season:{year:2026}};
const DEFAULT_APPEARANCE={};
function esc(s){return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;')}
function normalizeKey(s){return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-')}
function clubThemeHash(s){let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0}
function eventSceneMeta(e){if(e.type==='idol')return {theme:'idol',scene:e.id,icon:'★',label:'ÍDOLO',props:['trophy-case','statue']};return {theme:'airport',scene:e.id,icon:'✈',label:'AEROPORTO',props:['terminal','plane']};}
function eventObjectMarkup(token,index){return `<span class="scene-object obj-index-${index}"><span class="scene-object-glyph">${token}</span></span>`}
function appearanceMarkup(){return '<div class="face-avatar" style="width:70px;height:110px;border-radius:40px 40px 15px 15px;background:linear-gradient(#bda48e 40%,#287abb 40%)"></div>'}
function sponsorWordmark(s){return `<b>${esc(s)}</b>`}
"""
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':960,'height':550},reduced_motion='no-preference')
    page.set_content('<html><head><style>'+css+'</style></head><body style="background:#08111b"><div id="event-modal"></div></body></html>')
    page.add_script_tag(content=setup+fn)
    htmls=page.evaluate('''() => [eventSceneMarkup({id:'travel_delay',type:'random',title:'Atraso na viagem'}),eventSceneMarkup({id:'idol_training',type:'idol',idolName:'Meu Ídolo',title:'Treino especial'})]''')
    assert all('btl-scene-cinematic' in html and 'cinematic-actor' in html for html in htmls)
    page.evaluate('''html=>{const m=document.querySelector('#event-modal');m.innerHTML=html[0];m.style.cssText='position:absolute;left:20px;top:30px;width:720px';}''',htmls)
    action=page.locator('#event-modal .cinematic-action')
    name=action.evaluate('(el)=>getComputedStyle(el).animationName')
    assert name not in ('none',''),f'No active CSS animation: {name}'
    page.screenshot(path=str(root/'tests/v108-event-frame-a.png'))
    page.wait_for_timeout(1350)
    page.screenshot(path=str(root/'tests/v108-event-frame-b.png'))
    a=Image.open(root/'tests/v108-event-frame-a.png').crop((20,30,740,310))
    b=Image.open(root/'tests/v108-event-frame-b.png').crop((20,30,740,310))
    assert ImageChops.difference(a,b).getbbox(), 'No frame-to-frame visible movement'
    page.evaluate('''html=>{document.querySelector('#event-modal').innerHTML=html[1]}''',htmls)
    name2=page.locator('#event-modal .btl-motion-mentor .actor-right').evaluate('(el)=>getComputedStyle(el).animationName')
    assert name2 not in ('none',''),f'Mentor animation missing {name2}'
    print('PASS browser animation scenes:',name,name2)
    browser.close()
