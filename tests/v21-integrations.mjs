import {onRequestGet} from '../functions/api/club-badge.js';
import {onRequestPost} from '../functions/api/translate.js';
const checks=[];const check=(label,ok)=>{checks.push({label,ok:!!ok});if(!ok)console.error('FAIL',label)};
const originalFetch=globalThis.fetch;
function fakeRequest(path){return {url:'https://btl.example'+path,headers:new Headers()}}
function team(id,name,country,logo){return {team:{id,name,country,national:false,logo}}}
const fakeMatches=[team(12,'Barcelona SC','Ecuador','https://media.api-sports.io/football/teams/12.png'),team(529,'Barcelona','Spain','https://media.api-sports.io/football/teams/529.png')];
globalThis.fetch=async url=>new Response(JSON.stringify({response:fakeMatches}),{status:200,headers:{'Content-Type':'application/json'}});
let r=await onRequestGet({request:fakeRequest('/api/club-badge?name=Barcelona&country=Spain'),env:{API_FOOTBALL_KEY:'private-key'}});
let j=await r.json();check('Barcelona Spain selects Spanish badge',r.status===200&&j.logo.endsWith('/529.png'));
r=await onRequestGet({request:fakeRequest('/api/club-badge?name=Barcelona%20SC&country=Ecuador'),env:{API_FOOTBALL_KEY:'private-key'}});j=await r.json();check('Barcelona Ecuador selects Ecuador badge',r.status===200&&j.logo.endsWith('/12.png'));
r=await onRequestGet({request:fakeRequest('/api/club-badge?name=Barcelona&country=Germany'),env:{API_FOOTBALL_KEY:'private-key'}});j=await r.json();check('Reject country mismatch',r.status===200&&!j.logo);
r=await onRequestGet({request:fakeRequest('/api/club-badge?name=Barcelona&country=Spain'),env:{}});check('Do not expose unconfigured badge source',r.status===503);
const translateBody={language:'fr',texts:['Evento de carreira','Escolha seu próximo passo']};
globalThis.fetch=async (_url,args)=>{
 const body=JSON.parse(args.body);return new Response(JSON.stringify({data:{translations:body.q.map(x=>({translatedText:'FR '+x}))}}),{status:200});
};
function translationRequest(data,origin='https://btl.example'){
 return new Request('https://btl.example/api/translate',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(data)})
}
r=await onRequestPost({request:translationRequest(translateBody),env:{GOOGLE_CLOUD_TRANSLATE_API_KEY:'private-key'}});j=await r.json();
check('Cloud translate batch mocks render',r.status===200&&j.translations.length===2&&j.translations[0].startsWith('FR '));
r=await onRequestPost({request:translationRequest(translateBody),env:{}});check('Translation requires server credential',r.status===503);
r=await onRequestPost({request:translationRequest({...translateBody,language:'zz'}),env:{GOOGLE_CLOUD_TRANSLATE_API_KEY:'private-key'}});check('Reject unsupported locale',r.status===400);
r=await onRequestPost({request:translationRequest(translateBody,'https://evil.example'),env:{GOOGLE_CLOUD_TRANSLATE_API_KEY:'private-key'}});check('Reject cross-origin caller',r.status===403);
globalThis.fetch=originalFetch;
console.log('V21 integrations:',checks.filter(x=>x.ok).length,'/',checks.length);
if(checks.some(x=>!x.ok))process.exit(1);
