/**
 * CLI: node tools/crest-audit.mjs                => inventory only (offline)
 *      node tools/crest-audit.mjs --probe https://your-game.pages.dev --limit 40
 *      node tools/crest-audit.mjs --probe https://your-game.pages.dev --all
 * Does not claim that a logo is correct based on URL alone: requires expected
 * country/name from the server and an actual image HTTP 200 response.
 */
import fs from 'node:fs';import vm from 'node:vm';import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ctx=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(root,'js/data.js'),'utf8'),ctx);
const records=vm.runInContext(`(()=>{
 const acc=[];for(const [country,clubs] of Object.entries(LOCAL_CLUBS))for(const c of clubs)acc.push({name:c.name,country,id:c.apiId||null});
 for(const c of TRANSFER_MARKET_CLUBS)acc.push({name:c.name,country:c.countryCode,id:c.apiId||null});
 for(const c of TRANSFER_TARGETS)acc.push({name:c.name,country:c.countryCode,id:c.apiId||null});
 for(const [country,clubs] of Object.entries(LEAGUE_CLUB_POOLS))for(const name of clubs)acc.push({name,country,id:null});
 return acc;
})()`,ctx);
const key=c=>(c.country||'?')+':'+String(c.name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
const clubs=[...new Map(records.filter(c=>c.name&&c.country).map(c=>[key(c),c])).values()].sort((a,b)=>a.country.localeCompare(b.country)||a.name.localeCompare(b.name));
const args=process.argv.slice(2);const argIndex=args.indexOf('--probe');
const origin=argIndex>=0?args[argIndex+1]:null;const all=args.includes('--all'),lim=Math.max(1,Math.min(2000,Number(args[args.indexOf('--limit')+1]||60)));
const selected=all?clubs:clubs.slice(0,lim);const results=[];
async function verify(c){
 const url=new URL('/api/club-badge',origin);url.searchParams.set('name',c.name);
 const country=vm.runInContext(`COUNTRIES.find(c=>c.code===${JSON.stringify(c.country)})?.apiName||''`,ctx);
 if(country)url.searchParams.set('country',country);
 if(c.id)url.searchParams.set('id',c.id);
 try{
  const res=await fetch(url,{signal:AbortSignal.timeout(8500)});
  if(!res.ok)return {...c,status:res.status===503?'api-not-configured':'not-resolved',http:res.status};
  const data=await res.json();
  if(!data.logo||!/^https:\/\//.test(data.logo))return {...c,status:'not-resolved'};
  // One byte is sufficient; check image content-type and positive response.
  const img=await fetch(data.logo,{headers:{Range:'bytes=0-64'},signal:AbortSignal.timeout(9000)});
  return {...c,status:img.ok && (img.headers.get('content-type')||'').startsWith('image/')?'image-served':'image-not-loaded',source:data.source,returnedClub:data.name,image:data.logo};
 }catch(e){return {...c,status:'unreachable',detail:String(e.message).slice(0,100)};}
}
if(origin){
 if(!/^https:\/\//.test(origin)){console.error('Use an HTTPS deployment URL.');process.exit(2)}
 let index=0;const workers=Array.from({length:3},async()=>{while(index<selected.length){const pos=index++;results[pos]=await verify(selected[pos])}});await Promise.all(workers);
}else{for(const c of clubs)results.push({...c,status:'NOT VERIFIED: no live query'});}
const counts=results.reduce((a,r)=>(a[r.status]=(a[r.status]||0)+1,a),{});
const output={generatedAt:new Date().toISOString(),inventoryTotal:records.length,distinctClubs:clubs.length,probed:origin?selected.length:0,origin:origin||null,statusCounts:counts,records:results};
const outputFile=path.join(root,'docs','crest-audit.json');fs.writeFileSync(outputFile,JSON.stringify(output,null,2));
console.log(JSON.stringify({inventoryTotal:records.length,distinctClubs:clubs.length,probed:output.probed,statusCounts:counts,report:outputFile},null,2));
