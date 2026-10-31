/** Cloudflare Pages: verifies Google RS256 ID tokens server-side. */
const GOOGLE_JWKS='https://www.googleapis.com/oauth2/v3/certs';
const DEFAULT_CLIENT_ID='838899157664-b383tnocqjcimk6f5vo34l5dgf2tdqhd.apps.googleusercontent.com';
const decode=value=>{if(!/^[A-Za-z0-9_-]+$/.test(value||''))throw Error('invalid_base64url');const v=value.replace(/-/g,'+').replace(/_/g,'/');return Uint8Array.from(atob(v.padEnd(Math.ceil(v.length/4)*4,'=')),c=>c.charCodeAt(0))};
const parse=v=>JSON.parse(new TextDecoder().decode(decode(v)));
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function verifyGoogleToken(token,clientId,get=fetch){
 if(typeof token!=='string'||token.length<50||token.length>12000)throw Error('invalid_token');
 const parts=token.split('.');if(parts.length!==3)throw Error('invalid_segments');
 const header=parse(parts[0]),payload=parse(parts[1]);
 if(header.alg!=='RS256'||typeof header.kid!=='string')throw Error('algorithm');
 const now=Math.floor(Date.now()/1000);
 if(!['accounts.google.com','https://accounts.google.com'].includes(payload.iss))throw Error('issuer');
 if(payload.aud!==clientId)throw Error('audience');
 if(typeof payload.exp!=='number'||payload.exp<=now||payload.exp>now+86400)throw Error('expiration');
 if(payload.iat&&payload.iat>now+300)throw Error('issued_future');
 if(payload.nbf&&payload.nbf>now+300)throw Error('not_yet_valid');
 if(typeof payload.sub!=='string'||!/^\d{5,32}$/.test(payload.sub))throw Error('subject');
 if(payload.email_verified!==true&&payload.email_verified!=='true')throw Error('email_unverified');
 const resp=await get(GOOGLE_JWKS,{headers:{Accept:'application/json'}});
 if(!resp.ok)throw Error('key_server');
 const jwks=await resp.json();
 const jwk=(jwks.keys||[]).find(k=>k.kid===header.kid&&k.kty==='RSA'&&k.use==='sig'&&k.alg==='RS256');
 if(!jwk)throw Error('kid_missing');
 const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 const signingData=new TextEncoder().encode(parts[0]+'.'+parts[1]);
 if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(parts[2]),signingData))throw Error('bad_signature');
 return {sub:payload.sub,email:String(payload.email||''),name:String(payload.name||'').slice(0,130),given_name:String(payload.given_name||'').slice(0,70)};
}
// GET is a safe diagnostic: it does not authenticate anybody or expose credentials.
export async function onRequestGet({env}){
 const value=String(env?.GOOGLE_CLIENT_ID||DEFAULT_CLIENT_ID).trim();
 return reply({service:'be-the-legend-google-auth',route:'available',method:'POST',client_id_source:env?.GOOGLE_CLIENT_ID?'environment':'default',configured:value.endsWith('.apps.googleusercontent.com')});
}
const PUBLIC_REJECTION_REASONS=new Set(['audience','expiration','issuer','issued_future','not_yet_valid','key_server','kid_missing','algorithm','bad_signature','email_unverified','invalid_token','invalid_segments','subject']);
export async function onRequestPost({request,env}){
 const clientId=String(env?.GOOGLE_CLIENT_ID||DEFAULT_CLIENT_ID).trim();
 if(!clientId.endsWith('.apps.googleusercontent.com'))return reply({error:'google_not_configured'},503);
 if(Number(request.headers.get('content-length')||0)>14000)return reply({error:'invalid_token'},413);
 let body;try{body=await request.json()}catch{return reply({error:'invalid_request'},400)}
 try{return reply({identity:await verifyGoogleToken(body?.credential,clientId)})}
 catch(err){const reason=String(err?.message||'');return reply({error:reason==='key_server'?'temporarily_unavailable':'google_token_rejected',reason:PUBLIC_REJECTION_REASONS.has(reason)?reason:'validation_failed'},reason==='key_server'?503:401)}
}
