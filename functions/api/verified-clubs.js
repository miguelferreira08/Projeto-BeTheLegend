/** BTL 17 — IDs de clubes reais, somente quando a API-Sports estiver configurada.
 * No Cloudflare Pages, configure API_FOOTBALL_KEY como segredo de ambiente.
 * Nunca exponha a chave em HTML ou JavaScript do navegador.
 * Retorna apenas identidades confirmadas pelo feed, sem equipes fictícias.
 */
const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export async function onRequestGet({request,env}){
 const params=new URL(request.url).searchParams;
 const country=(params.get('country')||'').trim();
 if(country.length<3||country.length>65||!(/^[\p{L} .'-]+$/u).test(country))
  return Response.json({error:'País inválido',clubs:[]},{status:400});
 if(!env?.API_FOOTBALL_KEY)
  return Response.json({configured:false,clubs:[],source:'API-Sports'},{status:503,headers:{'Cache-Control':'no-store'}});
 const url='https://v3.football.api-sports.io/teams?country='+encodeURIComponent(country);
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),6500);
 try{
  const result=await fetch(url,{headers:{'x-apisports-key':env.API_FOOTBALL_KEY,Accept:'application/json'},signal:controller.signal});
  if(!result.ok)return Response.json({clubs:[],error:'API-Sports indisponível'},{status:502});
  const json=await result.json();const clubs=[];const found=new Set();
  for(const item of json.response||[]){
   const team=item.team||{},name=String(team.name||'').trim();
   const valid=Number.isInteger(team.id)&&team.id>0&&!team.national&&name.length>=3&&name.length<=80&&
     !/^(?:club|clube|team|time)\s*\d+$/i.test(name)&&
     norm(team.country)===norm(country);
   if(!valid||found.has(team.id))continue;
   found.add(team.id);clubs.push({id:team.id,name,country:team.country,source:'API-Sports',logoAvailable:!!team.logo});
  }
  return Response.json({configured:true,clubs:clubs.slice(0,300),source:'API-Sports'},
   {headers:{'Cache-Control':'public, max-age=43200','X-Content-Type-Options':'nosniff'}});
 }catch(_){return Response.json({clubs:[],error:'Falha de consulta aos clubes'},{status:503,headers:{'Cache-Control':'no-store'}})}
 finally{clearTimeout(timer)}
}
