import {onRequestGet} from '../functions/api/verified-clubs.js';
import assert from 'node:assert/strict';
const old=globalThis.fetch;
try{
 let called=false;
 globalThis.fetch=async(url,opts)=>{
  called=true;
  assert.ok(opts.headers['x-apisports-key']==='test-key');
  return new Response(JSON.stringify({response:[
   {team:{id:127,name:'Flamengo',country:'Brazil',national:false,logo:'https://media.api-sports.io/football/teams/127.png'}},
   {team:{id:128,name:'Palmeiras',country:'Brazil',national:false}},
   {team:{id:129,name:'Club 03',country:'Brazil',national:false}},
   {team:{id:130,name:'Brazil',country:'Brazil',national:true}},
   {team:{id:131,name:'Boca Juniors',country:'Argentina',national:false}},
  ]}),{status:200});
 };
 const res=await onRequestGet({request:new Request('https://app.example/api/verified-clubs?country=Brazil'),env:{API_FOOTBALL_KEY:'test-key'}});
 assert.equal(res.status,200);
 const d=await res.json();assert.ok(called);
 assert.deepEqual(d.clubs.map(x=>x.name),['Flamengo','Palmeiras']);
 const unavailable=await onRequestGet({request:new Request('https://app.example/api/verified-clubs?country=Brazil'),env:{}});
 assert.equal(unavailable.status,503);
 const invalid=await onRequestGet({request:new Request('https://app.example/api/verified-clubs?country=%3Cscript%3E'),env:{API_FOOTBALL_KEY:'test-key'}});
 assert.equal(invalid.status,400);
 console.log('V17: 4/4 testes do endpoint de identidade aprovados');
}finally{globalThis.fetch=old}
