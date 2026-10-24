/** Be The Legend V16 — Wikimedia Commons EXCLUSIVO.
 * Usa exclusivamente a MediaWiki Action API e URLs de upload.wikimedia.org.
 * Cada resultado inclui link à página, licença e atribuição.
 * Busca conservadora: na dúvida retorna vazio e usa brasão provisório original do jogo.
 */
const API='https://commons.wikimedia.org/w/api.php';
const aliases={
 'Bayern de Munique':'FC Bayern München','Inter de Milão':'FC Internazionale Milano',
 'Milan':'AC Milan','Paris Saint-Germain':'Paris Saint-Germain FC',
 'Grêmio':'Grêmio Foot-Ball Porto Alegrense','Atlético Mineiro':'Clube Atlético Mineiro',
 'Sporting CP':'Sporting Clube de Portugal','São Paulo':'São Paulo Futebol Clube',
 'Flamengo':'Clube de Regatas do Flamengo','Corinthians':'Sport Club Corinthians Paulista',
 'Atlético de Madrid':'Atlético de Madrid','Borussia Dortmund':'Borussia Dortmund',
 'Inter Miami':'Inter Miami CF','Barcelona':'FC Barcelona',
 'Real Madrid':'Real Madrid CF','Manchester United':'Manchester United FC',
 'Manchester City':'Manchester City FC','Arsenal':'Arsenal FC',
 'Chelsea':'Chelsea FC','Liverpool':'Liverpool FC',
 'Tottenham':'Tottenham Hotspur FC','Sevilla':'Sevilla FC',
 'Napoli':'SSC Napoli','Sport':'Sport Club do Recife',
 'Internacional':'Sport Club Internacional', 'Palmeiras':'Sociedade Esportiva Palmeiras'
};
const strip=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\b(fc|cf|sc|afc|saf|futebol|football|club|clube|esporte|esportivo|logo|crest|badge|escudo|emblem|official|new)\b/g,' ').replace(/[^a-z0-9]+/g,' ').trim();
const fileStem=s=>String(s||'').replace(/^File:/i,'').replace(/\.(svg|png|webp|jpg|jpeg)$/i,'').replace(/\b(20[0-9]{2}|19[0-9]{2}|logo|badge|crest|emblem|escudo|official|vector)\b/gi,' ');
const metadataText=m=>typeof m?.value==='string'?m.value.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').slice(0,220):'';
const validImage=s=>{try{const u=new URL(String(s||''));return u.protocol==='https:'&&u.hostname==='upload.wikimedia.org'&&/\.(?:svg|png|webp)$/i.test(u.pathname)}catch{return false}};
function score(filename,club){
 const target=strip(club).split(' ').filter(x=>x.length>2),file=strip(fileStem(filename)),parts=file.split(' ');
 if(!target.length)return -1;
 const forbidden=/\b(?:women|woman|feminino|femenino|basketball|rugby|ice hockey|stadium|kit|shirt|jersey|flag|fan|ultras|academy|youth|under 21|u19|u17|reserve|old logo|old crest)\b/i;
 if(forbidden.test(String(filename).replace(/_/g,' '))||forbidden.test(file))return -1;
 if(file===target.join(' '))return 100;
 if(!target.every(t=>parts.includes(t)))return -1;
 return Math.max(56,91-Math.max(0,parts.length-target.length)*5);
}
async function fetchMatches(name){
 const query=new URL(API);
 Object.entries({action:'query',format:'json',generator:'search',gsrsearch:name,gsrnamespace:'6',gsrlimit:'30',prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:'240',formatversion:'2'}).forEach(([k,v])=>query.searchParams.set(k,v));
 const c=new AbortController(),t=setTimeout(()=>c.abort(),5500);
 try{
  const r=await fetch(query.toString(),{signal:c.signal,headers:{Accept:'application/json','User-Agent':'BeTheLegend/16 (Wikimedia Commons club crests; noncommercial demo)'}});
  if(!r.ok)throw Error('Commons HTTP '+r.status);
  const j=await r.json();return j.query?.pages||[];
 }finally{clearTimeout(t)}
}
export async function onRequestGet({request}){
 const name=(new URL(request.url).searchParams.get('name')||'').trim();
 if(name.length<2||name.length>85||/[<>\x00-\x1f]/.test(name))return Response.json({error:'Clube inválido'},{status:400});
 const canonical=aliases[name]||name;
 try{
  let best=null;
  for(const q of [`${canonical} football club logo`,`${canonical} crest`,`${canonical} logo`]){
   const pages=await fetchMatches(q);
   for(const p of pages){const im=p.imageinfo?.[0],url=im?.thumburl||im?.url||'';
    if(!validImage(url)||!/\.(svg|png|webp)$/i.test(p.title))continue;
    const rank=score(p.title,canonical);
    if(rank<56)continue;
    const candidate={rank,logo:url,filePage:im.descriptionurl||'',matchedFile:p.title,
       license:metadataText(im.extmetadata?.LicenseShortName),credit:metadataText(im.extmetadata?.Artist),source:'Wikimedia Commons'};
    if(!best||candidate.rank>best.rank)best=candidate;
   }
   if(best?.rank>=90)break;
  }
  return Response.json(best||{logo:'',source:'Wikimedia Commons',status:'not-found'},{headers:{'Cache-Control':best?'public, max-age=86400':'public, max-age=900','X-Content-Type-Options':'nosniff'}});
 }catch(_){return Response.json({logo:'',source:'Wikimedia Commons',error:'Serviço Commons indisponível'},{status:503,headers:{'Cache-Control':'no-store'}})}
}
