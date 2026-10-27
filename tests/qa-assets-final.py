from pathlib import Path
from urllib.parse import unquote
from PIL import Image
import subprocess, json, re
root=Path(__file__).resolve().parents[1]
checks=[];issues=[]
def ck(key,val,detail=None):
 checks.append({'name':key,'passed':bool(val),'detail':detail})
 if not val:issues.append({'name':key,'detail':detail})
for js in [*sorted((root/'js').glob('*.js')),*sorted((root/'functions').rglob('*.js'))]:
 r=subprocess.run(['node','--check',str(js)],capture_output=True,text=True)
 ck('JS parse '+str(js.relative_to(root)),r.returncode==0,r.stderr[:500] if r.returncode else None)
html=(root/'index.html').read_text('utf8')
for name in re.findall(r'(?:src|href)=["\']((?:js|css|assets)/[^"\']+)["\']',html):
 src=unquote(name.split('?')[0]);ck('HTML resource '+src,(root/src).exists())
for f in sorted((root/'assets/trophies/user').glob('*.png')):
 try:
  im=Image.open(f).convert('RGBA');al=im.getchannel('A');width,height=im.size
  corners=[al.getpixel((0,0)),al.getpixel((width-1,0)),al.getpixel((0,height-1)),al.getpixel((width-1,height-1))]
  ck('RGBA '+f.name,al.getextrema()[0]==0 and max(corners)==0,{'alpha_min_max':al.getextrema(),'corners':corners})
 except Exception as e:ck('Open image '+f.name,False,str(e))
for svg in sorted((root/'assets').rglob('*.svg')):
 try:
  from lxml import etree
  r=etree.parse(str(svg));ck('SVG read '+str(svg.relative_to(root)),r.getroot().tag.endswith('svg'))
 except Exception as e:ck('SVG read '+str(svg.relative_to(root)),False,str(e))
for css in sorted((root/'css').glob('*.css')):
 txt=css.read_text('utf8')
 # Only actual url(...) resources, not sample names in comments.
 for raw in re.findall(r'url\(\s*[\'\"]?([^\)\'\"]+)',txt):
  if raw.startswith(('data:','http:','https:','#')):continue
  rel=unquote(raw.split('?')[0]);candidate=(css.parent/rel).resolve()
  ck(f'CSS resource {css.name} -> {rel}',candidate.exists())
report={'checked':len(checks),'passed':sum(x['passed'] for x in checks),'issues':issues,'checks':checks}
(root/'tests/qa-assets-final.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),'utf8')
print(json.dumps({k:v for k,v in report.items() if k!='checks'},ensure_ascii=False,indent=2))
if issues:raise SystemExit(1)
