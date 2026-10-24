/** Cloudflare Pages /api/roster: ESPN live squads and official ESPN crests.
  Live API has no historical-as-of roster parameter. Never label as frozen 22 Oct. */
const L={ENG:['eng.1','eng.2'],BR:['bra.1','bra.2'],ES:['esp.1','esp.2'],DE:['ger.1','ger.2'],IT:['ita.1','ita.2'],FR:['fra.1','fra.2'],PT:['por.1'],NL:['ned.1'],BE:['bel.1'],TR:['tur.1'],SCO:['sco.1'],AR:['arg.1'],US:['usa.1'],MX:['mex.1'],SA:['ksa.1'],JP:['jpn.1'],AT:['aut.1'],CH:['sui.1'],DK:['den.1'],NO:['nor.1'],SE:['swe.1'],PL:['pol.1'],GR:['gre.1'],CZ:['cze.1'],UY:['uru.1'],CO:['col.1'],CL:['chi.1'],EC:['ecu.1'],HR:['cro.1'],RS:['srb.1'],PY:['par.1']};
const ALL=[...new Set(Object.values(L).flat())],base='https://site.api.espn.com/apis/site/v2/sports/soccer/';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'').replace(/(?:footballclub|futebolclube|football|futebol|clube|club|fc|cf)$/,'');
const A={bayerndemunique:['bayernmunich','bayernmunchen'],interdemilao:['intermilan','internazionale'],parissaintgermain:['psg'],atleticomineiro:['atleticomg'],atleticodemadrid:['atleticomadrid'],barcelona:['fcbarcelona'],intermiami:['intermiamicf'],sportingcp:['sportinglisbon'],milan:['acmilan'],napoli:['sscnapoli'],tottenham:['tottenhamhotspur'],porto:['fcporto'],gremio:['gremiofbpa']};
const json=(d,code=200)=>new Response(JSON.stringify(d),{status:code,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':code===200?'public, max-age=900, s-maxage=3600':'no-store','X-Content-Type-Options':'nosniff'}});
async function fetchJSON(url){const c=new AbortController(),id=setTimeout(()=>c.abort(),6500);try{const r=await fetch(url,{headers:{Accept:'application/json'},signal:c.signal});if(!r.ok)throw Error(`upstream_${r.status}`);return await r.json()}finally{clearTimeout(id)}}
const memo=new Map();async function teams(league){let c=memo.get(league);if(c&&Date.now()-c.t<3600000)return c.p;const p=fetchJSON(base+league+'/teams?limit=500').then(j=>(j.sports||[]).flatMap(s=>s.leagues||[]).flatMap(l=>l.teams||[]).map(x=>x.team||x).filter(x=>x.id&&x.displayName).map(x=>({...x,league}))).catch(()=>[]);memo.set(league,{p,t:Date.now()});return p}
function logo(href){try{let u=new URL(href);return u.protocol==='https:'&&['a.espncdn.com','a1.espncdn.com','cdn.espn.com'].includes(u.hostname)?u.href:''}catch{return ''}}
function playersFrom(data){let arr=Array.isArray(data.athletes)?data.athletes:(Array.isArray(data.roster)?data.roster:[]);arr=arr.flatMap(x=>Array.isArray(x.items)?x.items:[x]);const seen=new Set();return arr.map(x=>x.athlete||x).filter(x=>x.id&&x.displayName).filter(x=>{if(seen.has(x.id))return false;seen.add(x.id);return true}).map(x=>({name:String(x.displayName).slice(0,120),number:String(x.jersey||''),position:String(x.position?.abbreviation||x.position?.displayName||''),country:String(x.citizenship||x.birthPlace?.country||x.nationality||'')}))}
// API-Sports optional account: use Cloudflare secret APISPORTS_KEY.
// Matches are exact-name only; this endpoint returns a LIVE squad, not an as-of date.
const mapPos=p=>({Goalkeeper:'GOL',Defender:'ZAG',Midfielder:'MC',Attacker:'ATA'}[p]||String(p||'MC').slice(0,12));
async function sportsRoster(name,key){
  const headers={'x-apisports-key':key,Accept:'application/json'};
  const sportsJSON=async path=>{
    const c=new AbortController(),id=setTimeout(()=>c.abort(),5000);
    try{const r=await fetch('https://v3.football.api-sports.io/'+path,{headers,signal:c.signal});if(!r.ok)throw Error('sports_'+r.status);const j=await r.json();if(j.errors&&(Array.isArray(j.errors)?j.errors.length:Object.keys(j.errors).length))throw Error('provider_rejected');return j}finally{clearTimeout(id)}
  };
  const matches=await sportsJSON('teams?name='+encodeURIComponent(name));
  const want=norm(name);
  const names=new Set([want,...(A[want]||[])]);
  const choices=(matches.response||[]).map(x=>x.team).filter(Boolean);
  const club=choices.find(t=>[t.name,t.code].some(v=>names.has(norm(v))));
  if(!club)return null;
  const roster=await sportsJSON('players/squads?team='+encodeURIComponent(club.id));
  const group=(roster.response||[]).find(x=>String(x.team?.id||'')===String(club.id));
  const members=(group?.players||[]).slice(0,100).filter(p=>p.name);
  if(!members.length)return null;
  return {club:club.name,requestedClub:name,source:'API-SPORTS',retrievedAt:new Date().toISOString(),historicalSnapshot:false,
    crest:/^https:\/\/media\.api-sports\.io\/football\/teams\/\d+\.(?:png|webp)$/i.test(club.logo||'')?club.logo:'',
    players:members.map(p=>({name:String(p.name).slice(0,120),number:String(p.number||''),position:mapPos(p.position),country:''}))};
}
export async function onRequestGet({request,env={}}){
 const q=new URL(request.url).searchParams,club=(q.get('club')||'').trim(),country=(q.get('country')||'').trim().toUpperCase();
 if(club.length<2||club.length>80||/[<>\x00-\x1f]/.test(club)||!/^([A-Z]{2,3})?$/.test(country))return json({error:'invalid_club'},400);
 const want=norm(club),names=new Set([want,...(A[want]||[])]),leagues=L[country]||ALL;
 if(env.APISPORTS_KEY){try{const sports=await sportsRoster(club,String(env.APISPORTS_KEY));if(sports)return json(sports)}catch(_){ /* Fall through to ESPN; never leak credentials. */ }}
 try{
  let matched=null;
  for(let i=0;i<leagues.length;i+=6){const lists=await Promise.all(leagues.slice(i,i+6).map(teams));for(const item of lists.flat()){if([item.displayName,item.name,item.shortDisplayName,item.slug].some(n=>names.has(norm(n)))){matched=item;break}}if(matched)break}
  if(!matched)return json({error:'team_not_found',provider:'ESPN'},404);
  const roster=await fetchJSON(`${base}${matched.league}/teams/${encodeURIComponent(matched.id)}/roster`);
  return json({club:matched.displayName,requestedClub:club,league:matched.league,teamId:String(matched.id),source:'ESPN',retrievedAt:new Date().toISOString(),historicalSnapshot:false,
   crest:[...(matched.logos||[]),...(roster.team?.logos||[])].map(x=>logo(x.href)).find(Boolean)||'',players:playersFrom(roster)});
 }catch(e){return json({error:'provider_unavailable',provider:'ESPN'},502)}
}
