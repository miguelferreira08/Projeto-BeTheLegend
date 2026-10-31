from pathlib import Path
import json,base64
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
css=(root/'css/v109-cups-and-players.css').read_text()
def embedded(name):
    data=(root/'assets/trophies/cup-logos-v109'/name).read_bytes()
    return 'data:image/png;base64,'+base64.b64encode(data).decode()
html='''<!doctype html><html><head><meta charset="utf-8"><style>
body{background:#0a1824;color:#f1f5f9;font-family:Arial;padding:40px}#summary-cups{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;max-width:920px}
.summary-status{background:#182631;border:1px solid #2f4846;border-radius:12px;color:#fff}
'''+css+'''</style></head><body><div id="season-summary-modal"><h2>Copas</h2><div id="summary-cups">'''
for text,name in [('Eliminado — 3ª fase','fa-cup.png'),('Eliminado — 4ª rodada','carabao-cup.png')]:
    html+=f'<div class="summary-status with-art btl-summary-cup btl-cup-logo-card"><span class="btl-summary-competition-logo btl-cup-logo-only"><img class="btl-cup-logo-image" src="{embedded(name)}" alt="{name}"></span><span class="btl-summary-cup-status">{text}</span></div>'
html+='</div></div></body></html>'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1000,'height':500},device_scale_factor=1)
 page.set_content(html,wait_until='load')
 result=page.evaluate('''() => [...document.querySelectorAll('.btl-cup-logo-card')].map(c=>({text:c.innerText.trim(),logoLoaded:c.querySelector('img').naturalWidth>0,cardHeight:Math.round(c.getBoundingClientRect().height),imageWidth:Math.round(c.querySelector('img').getBoundingClientRect().width)}))''')
 page.screenshot(path=str(root/'tests/v109-cup-card-qa.png'))
 print(json.dumps(result,ensure_ascii=False,indent=2))
 assert len(result)==2 and all(r['logoLoaded'] and r['cardHeight']>100 for r in result)
 browser.close()
