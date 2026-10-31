/* Cloudflare Pages: same-origin proxy for the dated public Transfermarkt/Kaggle
 * snapshot. Fixed upstream paths (no arbitrary URL proxy / SSRF). */
const ORIGIN='https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data/';
export async function onRequestGet({request}){
  const part=new URL(request.url).searchParams.get('part');
  if(!['players','clubs'].includes(part))return new Response(JSON.stringify({error:'invalid_part'}),{status:400,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);
  try{
    const upstream=await fetch(ORIGIN+part+'.csv.gz',{signal:controller.signal,headers:{Accept:'application/gzip'}});
    if(!upstream.ok||!upstream.body)return new Response(JSON.stringify({error:'upstream_unavailable'}),{status:502,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
    const size=Number(upstream.headers.get('Content-Length'))||0;
    if(size>32_000_000)return new Response('Arquivo rejeitado',{status:502});
    const headers=new Headers({'Content-Type':'application/gzip','Cache-Control':'public, max-age=86400, s-maxage=86400','X-Content-Type-Options':'nosniff','X-BTL-Snapshot-As-Of':'2026-07-06'});
    return new Response(upstream.body,{status:200,headers});
  }catch(_){return new Response(JSON.stringify({error:'upstream_unavailable'}),{status:502,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}})}finally{clearTimeout(timer)}
}
