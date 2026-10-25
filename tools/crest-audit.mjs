/**
 * Be The Legend V22 — static GitHub SVG crest audit (no API key).
 * node tools/crest-audit.mjs                     # inventory of 448 clubs, offline
 * node tools/crest-audit.mjs --probe --limit 12 # request SVGs directly from GitHub CDN
 * node tools/crest-audit.mjs --probe --all      # probe every matched path, sequentially
 * Passes no credentials to the image provider.
 */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const inventory=JSON.parse(fs.readFileSync(path.join(root,'assets/club-crests/manifest.json'),'utf8'));
const sourceText=fs.readFileSync(path.join(root,'js/static-crests.js'),'utf8');
const context=vm.createContext({window:{},URL});vm.runInContext(sourceText,context,{timeout:2000});
const crests=context.window.BTLStaticCrests;
const args=process.argv.slice(2),probe=args.includes('--probe'),all=args.includes('--all'),limIndex=args.indexOf('--limit');
const limit=all?Number.MAX_SAFE_INTEGER:Math.max(1,Math.min(500,Number(args[limIndex+1]||24)));
const map=crests.list();
const selected=map.slice(0,limit);
const results=[];
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
for(const row of map){
 const url=crests.resolve(row.name,row.country);
 if(!url||!crests.isCatalogUrl(url))throw Error(`URL not approved for ${row.name} (${row.country})`);
}
if(probe){
 for(let i=0;i<selected.length;i++){
  const row=selected[i],url=crests.resolve(row.name,row.country);
  try{
   const res=await fetch(url,{method:'GET',headers:{Range:'bytes=0-128'},signal:AbortSignal.timeout(12000)});
   const type=res.headers.get('content-type')||'';
   results.push({...row,image:url,status:res.ok&&(/image\/svg\+xml|image\//i.test(type))?'image-served':'image-not-loaded',http:res.status,contentType:type});
   await res.body?.cancel?.().catch(()=>{});
  }catch(e){results.push({...row,image:url,status:'network-error',detail:String(e.message).slice(0,120)});}
  if(i<selected.length-1)await pause(375);
 }
}else{
 for(const row of map)results.push({...row,image:crests.resolve(row.name,row.country),status:'tree-cataloged-not-http-tested'});
}
for(const r of inventory.unresolved)results.push({name:r.club,country:r.country,status:'not-in-static-catalog',reason:r.reason});
const statusCounts=results.reduce((o,r)=>(o[r.status]=(o[r.status]||0)+1,o),{});
const report={generatedAt:new Date().toISOString(),source:'JoseArroyave/football-logos',commit:crests.commit,inventoryTotal:inventory.inventoryCount,distinctClubs:inventory.entries.length+inventory.unresolved.length,catalogCoverage:map.length,unmatched:inventory.unresolved.length,probed:probe?selected.length:0,liveImageValidation:probe,statusCounts,records:results};
fs.mkdirSync(path.join(root,'docs'),{recursive:true});
const reportFile=path.join(root,'docs','crest-audit.json');fs.writeFileSync(reportFile,JSON.stringify(report,null,2));
console.log(JSON.stringify({clubs:report.distinctClubs,staticMappings:map.length,unmapped:report.unmatched,liveProbes:report.probed,statusCounts,report:reportFile},null,2));
