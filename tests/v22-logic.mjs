import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';
const root=path.resolve(import.meta.dirname,'..');
const catalogCode=fs.readFileSync(path.join(root,'js/static-crests.js'),'utf8');
const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/club-crests/manifest.json'),'utf8'));
let checks=0;const ck=(condition,msg)=>{if(!condition)throw new Error(msg);checks++};
const w={};vm.runInNewContext(catalogCode,{window:w,URL});const db=w.BTLStaticCrests;
ck(db.count===manifest.entries.length,'catalog count');
ck(db.count+manifest.unresolved.length===448,'all clubs accounted for');
ck(html.includes('js/static-crests.js?v=22.0.0'),'static script loaded');
ck(html.indexOf('js/static-crests.js')<html.indexOf('js/app.js'),'catalog loads before app');
ck(!app.includes('fetch(`/api/club-badge'),'no API-Football requests for crests');
ck(!app.includes('fetch(`/api/commons-crest'),'no Commons endpoint requests for crests');
ck(!app.includes('fetch(url.href,{signal:AbortSignal.timeout(5500)'), 'no Commons search requests');
ck(!fs.existsSync(path.join(root,'functions/api/club-badge.js')),'commercial crest proxy removed');
ck(!fs.existsSync(path.join(root,'functions/api/commons-crest.js')),'Commons crest proxy removed');
ck(app.includes('window.BTLStaticCrests?.resolve'),'static provider wired into game');
const source=String(db.base);
for(const row of manifest.entries){
 const url=db.resolve(row.club,row.country);
 ck(url.startsWith(source)&&db.isCatalogUrl(url),`verified URL ${row.country} ${row.club}`);
 ck(url.includes('/logos/'),`crest path ${row.club}`);
}
for(const row of manifest.unresolved){
 ck(db.resolve(row.club,row.country)==='',`unresolved is not replaced by wrong crest ${row.club}`);
}
ck(db.resolve('Flamengo','BR').endsWith('/logos/brazil/Flamengo.svg'),'Flamengo maps to Brazilian SVG');
ck(db.resolve('Flamengo','PT')==='', 'reject country mismatch');
ck(db.resolve('Liverpool','ENG').includes('/logos/england/Liverpool_FC.svg'),'Liverpool correct country');
ck(db.resolve('Liverpool Montevideo','UY').includes('/logos/uruguay/Liverpool.svg'),'Uruguay Liverpool not ENG club');
ck(db.resolve('Real Madrid','ES').includes('/logos/spain/Real_Madrid.svg'),'Real Madrid');
ck(db.resolve('Flamengo U20','BR')==='', 'no fabricated youth club crest');
// Existing leaderboards must retain the league isolation from prior releases.
const ctx={state:null,normalizeKey:s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,''),ensureWorldPlayers:()=>ctx.state.worldPlayers,worldPlayerEligibleForCompetition:()=>true,clubsForLeaderboardCompetition:()=>new Set(ctx.allowed),confederation:c=>c==='DE'?'UEFA':'OTHER'};
const start=app.indexOf('function leaderboardCandidates('),end=app.indexOf('\nfunction leaderboardTeamVisual(',start);
ck(start>=0&&end>start,'leaderboard slice');vm.createContext(ctx);vm.runInContext(app.slice(start,end),ctx);
for(let i=0;i<70;i++){
 const league=i%2===0?'2. Bundesliga':'Premier League',country=i%2===0?'DE':'ENG',team=i%2===0?'Schalke 04':'Arsenal';
 ctx.allowed=[team];ctx.state={player:{club:team,clubCountry:country},season:{countryAtStart:country,league:{name:league,teams:[team]},superCups:[]},worldPlayers:[{name:'Messi',club:'Inter Miami',countryCode:'US',rating:99},{name:'Valid',club:team,countryCode:country}]};
 const candidates=Array.from(ctx.leaderboardCandidates(league));ck(candidates.length===1&&candidates[0].name==='Valid',`${league} isolated ${i}`);
}
const result={checks,staticMatches:db.count,unmapped:manifest.unresolved.length,apiKeysRequired:0,liveImageValidation:false,status:'PASS'};
fs.mkdirSync(path.join(root,'tests/QA-V22'),{recursive:true});fs.writeFileSync(path.join(root,'tests/QA-V22/logic.json'),JSON.stringify(result,null,2));console.log('V22 logic',checks,'PASS');
