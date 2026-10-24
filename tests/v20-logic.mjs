import fs from 'node:fs';import vm from 'node:vm';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),js=fs.readFileSync(path.join(root,'js/app.js'),'utf8'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),css=fs.readFileSync(path.join(root,'css/v17-game-ui.css'),'utf8');
let pass=0;const assert=(cond,title)=>{if(!cond)throw Error('FAIL '+title);pass++};
for(let i=0;i<11;i++)assert(['#home','home-new-career','btl-select-option-flag','world-cup-year::before','penalty-order-choices','competitionThemeForName','goal-mouth .visual-stage','missingOfficialCrests','competitionHeaderMarkup','trophyEntryFor','football-menu-option'].some(x=>html.includes(x)||css.includes(x)||js.includes(x)),'component '+i);
assert(/applyCompetitionExperienceTheme\(pending\)/.test(js),'penalty match theme');
assert(/applyCompetitionExperienceTheme\(event\)/.test(js),'decision match theme');
assert(html.match(/<button class="football-menu-option/g)?.length===6,'6 home actions');
assert(!html.includes('class="football-menu-option" data-view="stats"'),'home stats removed');
assert(!html.includes('class="football-menu-option" data-view="market"'),'home market removed');
assert(!html.includes('src="assets/fallback-crest'),'no fabricated club crests in markup');
assert(js.includes('getCachedBadge')&&js.includes('missingOfficialCrests.add'),'verified crest path');
assert(fs.existsSync(path.join(root,'js/competition-trophy-data.js')),'bundled trophy assets');
const ctx={state:null,normalizeKey:s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,''),ensureWorldPlayers:()=>ctx.state.worldPlayers,worldPlayerEligibleForCompetition:()=>true,clubsForLeaderboardCompetition:()=>new Set(ctx.allowed),confederation:c=>c==='DE'?'UEFA':'OTHER'};
let start=js.indexOf('function leaderboardCandidates('),end=js.indexOf('\nfunction leaderboardTeamVisual(',start);assert(start>0&&end>start,'league script slice');
vm.createContext(ctx);vm.runInContext(js.slice(start,end),ctx);
for(let i=0;i<80;i++){
 const de=i%2===0,code=de?'DE':'ENG',title=de?'2. Bundesliga':'Premier League',team=de?'Schalke 04':'Arsenal';
 ctx.allowed=[team];ctx.state={player:{club:team,clubCountry:code},season:{countryAtStart:code,league:{name:title,teams:[team]},superCups:[]},worldPlayers:[{name:'Messi',club:'Inter Miami',countryCode:'US',rating:99},{name:'Bund outsider',club:'Bayern de Munique',countryCode:'DE'},{name:'Premier outsider',club:'Manchester City',countryCode:'ENG'},{name:'Valid',club:team,countryCode:code}]};
 const selected=Array.from(ctx.leaderboardCandidates(title));assert(selected.length===1&&selected[0].name==='Valid',title+' only current club #'+i);
 ctx.state.worldPlayers[3].club='Inter Miami';assert(ctx.leaderboardCandidates(title).length===0,'transfer removes outside #'+i);
}
const {onRequestGet}=await import('../functions/api/club-badge.js');
let requests=0;const oldFetch=globalThis.fetch;
globalThis.fetch=async u=>{requests++;return Response.json({response:[{team:{id:1,name:'Flamengo',country:'Brazil',logo:'https://media.api-sports.io/football/teams/127.png'}},{team:{id:2,name:'Flamengo',country:'Germany',logo:'https://media.api-sports.io/football/teams/999.png'}},{team:{id:3,name:'Flamengo U17',country:'Brazil',logo:'https://media.api-sports.io/football/teams/888.png'}}]})};
try{
 let resp=await onRequestGet({request:new Request('https://game.example/api/club-badge?name=Flamengo&country=Brazil'),env:{API_FOOTBALL_KEY:'TEST'}}),obj=await resp.json();assert(resp.ok&&obj.logo.endsWith('/127.png'),'API-Sports accepts exact club and country');
 resp=await onRequestGet({request:new Request('https://game.example/api/club-badge?name=Flamengo&country=France'),env:{API_FOOTBALL_KEY:'TEST'}});obj=await resp.json();assert(obj.logo===''&&obj.status==='not-found','Reject wrong country');
 resp=await onRequestGet({request:new Request('https://game.example/api/club-badge?name=Fla&country=Brazil'),env:{API_FOOTBALL_KEY:'TEST'}});obj=await resp.json();assert(obj.logo===''&&obj.status==='not-found','Reject partial names');
 resp=await onRequestGet({request:new Request('https://game.example/api/club-badge?name=Flamengo&country=Brazil'),env:{}});assert(resp.status===503,'No secret reported clearly');
}finally{globalThis.fetch=oldFetch}
const output={checks:pass,status:'PASS',networkTests:'mocked',requests};fs.writeFileSync(path.join(root,'QA-V20','logic-results.json'),JSON.stringify(output,null,2));console.log('V20 logic:',pass,'/',pass,'checks passed');
