const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const aliases={
 'Bayern de Munique':['Bayern Munich','FC Bayern München'],
 'Inter de Milão':['Inter Milan','FC Internazionale Milano'],
 'Milan':['AC Milan'],
 'Atlético de Madrid':['Atletico Madrid','Atlético de Madrid'],
 'Flamengo':['CR Flamengo','Clube de Regatas do Flamengo'],
 'Corinthians':['SC Corinthians Paulista','Sport Club Corinthians Paulista'],
 'Grêmio':['Grêmio Foot-Ball Porto Alegrense','Gremio'],
 'São Paulo':['São Paulo FC','Sao Paulo FC'],
 'Sport':['Sport Club do Recife','Sport Recife'],
 'Internacional':['SC Internacional','Sport Club Internacional'],
 'Palmeiras':['SE Palmeiras','Sociedade Esportiva Palmeiras'],
 'Barcelona':['FC Barcelona'],'Real Madrid':['Real Madrid CF'],'Arsenal':['Arsenal FC'],
 'Chelsea':['Chelsea FC'],'Liverpool':['Liverpool FC'],'Tottenham':['Tottenham Hotspur FC'],
 'Manchester City':['Manchester City FC'],'Manchester United':['Manchester United FC'],
 'Paris Saint-Germain':['Paris Saint-Germain FC'], 'Inter Miami':['Inter Miami CF']
};
export async function onRequestGet({request,env}){
 const params=new URL(request.url).searchParams;
 const name=(params.get('name')||'').trim(), country=(params.get('country')||'').trim(), teamId=Number(params.get('id')||0);
 if(country.length>70||/[^\p{L} .'-]/u.test(country))return Response.json({error:'País inválido'},{status:400});
 if(name.length<2||name.length>90)return Response.json({error:'Clube inválido'},{status:400});
 if(!env?.API_FOOTBALL_KEY)return Response.json({configured:false,logo:''},{status:503,headers:{'Cache-Control':'no-store'}});
 const queries=[name,...(aliases[name]||[])];
 try{
   for(const q of (Number.isInteger(teamId)&&teamId>0&&teamId<100000000?[String(teamId),...queries]:queries)){
     const url='https://v3.football.api-sports.io/teams?'+(q===String(teamId)?'id=':'search=')+encodeURIComponent(q);
     const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),5500);
     try{
       const r=await fetch(url,{headers:{'x-apisports-key':env.API_FOOTBALL_KEY,Accept:'application/json'},signal:controller.signal});
       if(!r.ok)continue;
       const data=await r.json();
       const teams=(data.response||[]).map(x=>x.team||{}).filter(t=>t?.id&&t?.name&&!t?.national&&(!country||norm(t.country)===norm(country)));
       const pick=teams.find(t=>norm(t.name)===norm(q)||norm(t.name)===norm(name));
       const logo=String(pick?.logo||'');
       if(typeof logo==='string' && logo.startsWith('https://'))return Response.json({configured:true,logo,source:'API-Sports',name:pick.name},{headers:{'Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'}});
     }finally{clearTimeout(timer)}
   }
   return Response.json({configured:true,logo:'',status:'not-found'},{headers:{'Cache-Control':'public, max-age=1800'}});
 }catch(_){return Response.json({configured:true,logo:'',error:'Falha na API-Sports'},{status:503,headers:{'Cache-Control':'no-store'}})}
}
