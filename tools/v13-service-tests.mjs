import {readFileSync} from 'node:fs';import {webcrypto} from 'node:crypto';
import assert from 'node:assert/strict';
const load=async p=>import('data:text/javascript;base64,'+Buffer.from(readFileSync(new URL(p,import.meta.url),'utf8')).toString('base64'));
const google=await load('../functions/api/auth/google.js');
const keys=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const jwk=await crypto.subtle.exportKey('jwk',keys.publicKey);jwk.kid='testkid';jwk.alg='RS256';jwk.use='sig';
const b64=x=>Buffer.from(typeof x==='string'?x:JSON.stringify(x)).toString('base64url');
const jwt=async payload=>{const value=b64({typ:'JWT',alg:'RS256',kid:'testkid'})+'.'+b64(payload);const sig=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',keys.privateKey,new TextEncoder().encode(value));return value+'.'+Buffer.from(sig).toString('base64url')};
const client='client.apps.googleusercontent.com';const claims={sub:'123456789012345',iss:'https://accounts.google.com',aud:client,exp:Math.floor(Date.now()/1000)+3600,email_verified:true,email:'test@example.com',name:'Tester'};
const fetchKeys=async()=>({ok:true,json:async()=>({keys:[jwk]})});
const valid=await google.verifyGoogleToken(await jwt(claims),client,fetchKeys);assert.equal(valid.sub,claims.sub);
let failures=0;for(const mod of [{aud:'other'},{iss:'evil.example'},{exp:Math.floor(Date.now()/1000)-5},{email_verified:false}]){
 try{await google.verifyGoogleToken(await jwt({...claims,...mod}),client,fetchKeys)}catch{failures++}
}assert.equal(failures,4);
const rotten=await jwt(claims);await assert.rejects(()=>google.verifyGoogleToken(rotten.slice(0,-6)+'aaaaaa',client,fetchKeys));
console.log('Google JWT: token RS256 válido aceito; 4 claims inválidas e assinatura alterada rejeitadas');
const roster=await load('../functions/api/roster.js');
const upstream=[];globalThis.fetch=async url=>{upstream.push(url);if(url.includes('/teams?'))return{ok:true,json:async()=>({sports:[{leagues:[{teams:[{team:{id:'359',displayName:'Arsenal',name:'Arsenal',logos:[{href:'https://a.espncdn.com/i/teamlogos/soccer/500/359.png'}]}}]}]}]})};return {ok:true,json:async()=>({athletes:[{id:'test1',displayName:'Test Player',jersey:'5',position:{abbreviation:'DF'},citizenship:'England'}]})}};
const request=new Request('https://example.com/api/roster?club=Arsenal&country=ENG');const answer=await roster.onRequestGet({request});const data=await answer.json();
assert.equal(answer.status,200);assert.equal(data.club,'Arsenal');assert.equal(data.players.length,1);assert.equal(data.historicalSnapshot,false);
console.log('ESPN: resolução de clube, escudo e plantel normalizados; data real não foi simulada como snapshot histórico');
