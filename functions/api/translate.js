/** Optional localization fallback for authored game narration.
 * Cloudflare Pages: configure GOOGLE_CLOUD_TRANSLATE_API_KEY as a secret.
 * Google Cloud Translation Basic v2 bills translation usage; apply service quotas.
 * Native game names, credentials and input fields must not be submitted intentionally.
 */
export async function onRequestPost({request,env}){
 const expectedOrigin=new URL(request.url).origin;
 const origin=request.headers.get('origin');
 if(origin && origin!==expectedOrigin)return Response.json({error:'Origin blocked'},{status:403});
 if(!env?.GOOGLE_CLOUD_TRANSLATE_API_KEY)return Response.json({error:'Translation provider not configured'},{status:503});
 const length=Number(request.headers.get('content-length')||0);
 if(length>8500)return Response.json({error:'Request too large'},{status:413});
 let data;
 try{data=await request.json();}catch(_){return Response.json({error:'Invalid body'},{status:400});}
 if(!['en','es','fr'].includes(data?.language)||!Array.isArray(data?.texts)||data.texts.length<1||data.texts.length>12)return Response.json({error:'Invalid translation request'},{status:400});
 const texts=data.texts;
 if(texts.some(t=>typeof t!=='string'||!t.trim()||t.length>600)||texts.join('').length>6000)return Response.json({error:'Invalid text size'},{status:400});
 const apiURL=`https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(env.GOOGLE_CLOUD_TRANSLATE_API_KEY)}`;
 try{
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),7000);
  try{
   const provider=await fetch(apiURL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({q:texts,source:'pt',target:data.language,format:'text'}),signal:controller.signal});
   if(!provider.ok)return Response.json({error:'Translation provider failed'},{status:502,headers:{'Cache-Control':'no-store'}});
   const payload=await provider.json();
   const translations=(payload.data?.translations||[]).map(t=>t.translatedText||'');
   if(translations.length!==texts.length)return Response.json({error:'Incomplete translation'},{status:502});
   return Response.json({translations},{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  }finally{clearTimeout(timeout)}
 }catch(_){return Response.json({error:'Translation unavailable'},{status:503});}
}
