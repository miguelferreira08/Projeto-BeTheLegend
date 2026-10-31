const fs=require('fs'),vm=require('vm'),assert=require('assert');
const text=fs.readFileSync('js/app.js','utf8');
const readBetween=(start,end)=>{const a=text.indexOf(start);const b=text.indexOf(end,a);assert(a>=0&&b>a,`block ${start}`);return text.slice(a,b)};
const ctx={console,Math,Set,Map,state:{season:{year:2026,totalGames:0,goals:0,assists:0},player:{overall:95,position:'Centroavante'}},worldDirty:false,worldStoreReady:true,START_YEAR:2026,MAX_SEASON_GA:145,
 clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),stableHash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;},
 normalizeKey:s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,''),
 canonicalClubCountryCode:()=> 'BR',findClubDataAny:()=>({countryCode:'BR',strength:82}),clubStrength:()=>82,
 save(){ctx.saves++},saves:0,ensureWorldPlayers(){return ctx.state.worldPlayers},
 clubsForLeaderboardCompetition:()=>new Set(ctx.teams),competitionStatus:()=>[],isWorldCupYear:()=>false,
 countryByCode:code=>code==='BR'?{name:'Brasil',code} :code==='AR'?{name:'Argentina',code}:null,
 codeForCountryName:s=>s==='Brasil'?'BR':s==='Argentina'?'AR':'',
 leaguePoolForCountry:()=>[],qualificationRowsForYear:()=>[],confederation:()=>''};
vm.createContext(ctx);
vm.runInContext(readBetween('function positionProfile(position){','function agingPerformanceFactor('),ctx);
vm.runInContext(readBetween('function applySeasonGaCap(perf){','function ensureClubRoleState('),ctx);
vm.runInContext(readBetween('function leaderboardPlayerProfile(wp){','function isNationalLeaderboard(title='),ctx);
vm.runInContext(readBetween('function isNationalLeaderboard(title=','function leaderboardTeamVisual('),ctx);
// Guardrail for historical 95-over production across 70 appearances.
const limits95=ctx.seasonProductionLimits({overall:95,position:'Centroavante'},70);
assert(limits95.goals<85&&limits95.assists<33&&limits95.total<118);
const limits97=ctx.seasonProductionLimits({overall:97,position:'Centroavante'},70);
assert(limits97.goals>=85&&limits97.assists>=33);
ctx.state.season={year:2026,totalGames:69,goals:limits95.goals-1,assists:0};
const gated=ctx.applySeasonGaCap({goals:3,assists:3,rating:8});
assert.strictEqual(gated.goals,1);
ctx.state.season.goals=0;ctx.state.season.assists=limits95.assists-1;
assert.strictEqual(ctx.applySeasonGaCap({goals:0,assists:3}).assists,1);
assert(ctx.eliteProductionMultiplier({overall:95})<ctx.eliteProductionMultiplier({overall:97}));
// A deliberately impossible sequence of hat-tricks and two assists per game
// must be bounded by the actual seasonal 95-OVR tier, even with 70 games.
ctx.state.player={overall:95,position:'Centroavante'};
ctx.state.season={year:2026,totalGames:0,goals:0,assists:0};
for(let i=0;i<70;i++){
 const perf=ctx.applySeasonGaCap({goals:3,assists:2,rating:9});
 ctx.state.season.totalGames++;ctx.state.season.goals+=perf.goals;ctx.state.season.assists+=perf.assists;
}
assert(ctx.state.season.goals<=limits95.goals);
assert(ctx.state.season.assists<=limits95.assists);
assert(ctx.state.season.goals+ctx.state.season.assists<=limits95.total);

// All 20 clubs get 14 players, with no duplicate IDs when re-rendered.
ctx.teams=Array.from({length:20},(_,i)=>`Clube ${i+1}`);
ctx.state.season={year:2026,countryAtStart:'BR',league:{name:'Liga Teste',participants:ctx.teams,schedule:[],teams:[]},matchRegistry:[]};
ctx.state.player={club:'Clube 1',clubCountry:'BR',overall:95};ctx.state.worldPlayers=[{id:'real',name:'Jogador Real',club:'Clube 1',countryCode:'BR',position:'ATA',rating:86}];
const squads=ctx.leaderboardCandidates('Liga Teste');
assert.strictEqual(new Set(squads.map(p=>p.leaderboardTeamName)).size,20);
for(const team of ctx.teams) assert(squads.filter(p=>p.leaderboardTeamName===team).length>=14,team);
const length=ctx.state.worldPlayers.length;
const squadsAgain=ctx.leaderboardCandidates('Liga Teste');
assert.strictEqual(ctx.state.worldPlayers.length,length,'repeat render must be idempotent');
assert.strictEqual(new Set(ctx.state.worldPlayers.map(p=>p.id)).size,length);
assert(squadsAgain.some(p=>p.name==='Jogador Real'));
assert(squadsAgain.filter(p=>p.rosterPlaceholder).every(p=>p.generated&&/FICTÍCIO/.test(p.source)));
assert(ctx.saves===1);
// Match ledger assigns no statistics to clubs without a played fixture.
ctx.state.season.league.matchLedger={version:1,results:[{id:'match1',home:'Clube 1',away:'Clube 2',homeGoals:3,awayGoals:2}]};
const stat=ctx.recordedLeaderboardStatistics('Liga Teste',squads);
assert([...stat.values()].reduce((n,row)=>n+row.goals,0)<=5);
for(const player of squads.filter(p=>p.club==='Clube 3')){
 const key=ctx.normalizeKey(player.name)+'|'+ctx.normalizeKey(player.leaderboardTeamName);
 assert.deepStrictEqual(JSON.parse(JSON.stringify(stat.get(key))),{goals:0,assists:0,games:0});
}
// National competitions include all qualified countries as browseable squads.
ctx.state.season.worldCup={groups:[{teams:['BR','AR']}]};
const international=ctx.leaderboardCandidates('FIFA World Cup');
assert(international.filter(p=>p.leaderboardTeamCode==='BR').length>=14);
assert(international.filter(p=>p.leaderboardTeamCode==='AR').length>=14);
assert(international.every(p=>p.nationalCode&&p.generated));
console.log('PASS: 95-over limits, 97+ exceptional access, 20 clubs, match-ledger grounding, national squads, unique IDs');
