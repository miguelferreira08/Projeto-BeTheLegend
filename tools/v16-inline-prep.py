from pathlib import Path
import re,json
ROOT=Path(__file__).resolve().parents[1]
s=(ROOT/'index.html').read_text()
# Everything is loaded byte-for-byte from the actual project, just inline to
# bypass browser navigation restrictions in this environment.
s=re.sub(r'<link rel="stylesheet" href="(css/[^"]+?\.css)(?:\?[^\"]+)?">',lambda m:'<style data-original="'+m[1]+'">\n'+(ROOT/m[1]).read_text()+'\n</style>',s)
s=re.sub(r'<script src="(js/[^"]+?\.js)(?:\?[^\"]+)?"></script>',lambda m:'<script data-original="'+m[1]+'">\n'+(ROOT/m[1]).read_text()+'\n</script>',s)
stub='''<script>
const _btlStorage = ()=>{const map=new Map();return {getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k),clear:()=>map.clear()}};
Object.defineProperty(window,'localStorage',{value:_btlStorage(),configurable:true});
Object.defineProperty(window,'sessionStorage',{value:_btlStorage(),configurable:true});
const k='guest:qa',account={accountKey:k,id8:'12345678',nickname:'QA',type:'guest',email:'',createdAt:new Date().toISOString()};
localStorage.setItem('btlAccountsV1',JSON.stringify([account]));
localStorage.setItem('btlAuthSessionV1',JSON.stringify({accountKey:k,issuedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+86400000).toISOString()}));
localStorage.setItem('beTheLegendBadgeCacheV95',JSON.stringify({'Arsenal':'https://a.espncdn.com/club.png','Barcelona':'https://upload.wikimedia.org/wikipedia/commons/0/0c/FC_Barcelona.svg'}));
</script>'''
s=s.replace('<head>','<head>'+stub,1)
# Avoid relative paths for images/fonts in the QA screenshot; the actual images
# are not necessary for checking foreground type/box geometry.
Path('/mnt/data/v16-qa-inline.html').write_text(s)
print('inlined', len(s),'bytes, old src js?', bool(re.search(r'<script src="js/',s)))
