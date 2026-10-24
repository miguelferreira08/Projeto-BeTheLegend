/* BTL V15 deterministic regression — npm-free, run: node tools/v15-regression.mjs */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
const ROOT=path.resolve(import.meta.dirname,'..');
const app=fs.readFileSync(path.join(ROOT,'js/app.js'),'utf8');
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const css=fs.readFileSync(path.join(ROOT,'css/v15-studio.css'),'utf8');
const finalCss=fs.readFileSync(path.join(ROOT,'css/v16-finish.css'),'utf8');
const roster=fs.readFileSync(path.join(ROOT,'js/rosters.js'),'utf8');
const tests=[];const check=(name,pass)=>{tests.push({name,pass:!!pass});if(!pass)throw Error(`FAIL: ${name}`)};
check('Two unused dashboard panels removed',!html.includes('id="roster-explorer"')&&!html.includes('class="panel typography-panel"'));
check('V16 final stylesheet loaded LAST',html.indexOf('css/v16-finish.css')>html.indexOf('css/v15-studio.css'));
check('Orbitron loaded after all other CSS',html.includes('fonts.googleapis.com/css2?family=Orbitron')&&html.indexOf('css/v17-game-ui.css')>html.indexOf('css/v16-finish.css'));
check('Provider roster crest not used',!roster.includes('BTLRegisterVerifiedCrest?.(')&&!roster.includes('<img src=\"${esc(data.crest)}'));
check('Old FCLOGO endpoint absent',!fs.existsSync(path.join(ROOT,'functions/api/club-logo.js')));
check('Legacy logo cache cleared',app.includes('delete badgeCache[team]'));
check('Legacy provider crest rejected',app.includes("if(source!=='Wikimedia Commons'"));
check('Render applies Commons-only cache',app.includes("const cached=safeCommonsImage(badgeCache?.[name]||'')"));
check('Orbitron global fallback specified',fs.readFileSync(path.join(ROOT,'css/v17-game-ui.css'),'utf8').includes("font-family:'Orbitron'"));
check('Penalties have short order buttons',app.includes('label:`${i+1}ª cobrança`'));
check('Shot buttons hide description for penalties',app.includes("scenario.visual==='penalty'?'':"));
check('No cross-league candidate backfill',!app.slice(app.indexOf('function leaderboardCandidates('),app.indexOf('function leaderboardTeamVisual(')).includes('scoped.length<'));
check('Dynamic theme changes main colors',app.includes("root.style.setProperty('--volt',theme.accent)")&&app.includes('function curatedTheme(name)'));
check('Commons lookup preferred',app.includes('const commons=await commonsCrest(name)')&&!app.slice(app.indexOf('async function exactClubBadge('),app.indexOf('function clubBadgeSources(')).includes('fcLogoCrest('));
check('Commons server proxy present',fs.existsSync(path.join(ROOT,'functions/api/commons-crest.js')));
check('Commons credits surfaced',html.includes('commons-attribution-modal'));
check('Distinct event artboards', ['btl-career-stage','btl-random-stage','btl-icon-stage','btl-pitch-graphic'].every(c=>app.includes(c)));
check('Wikimedia credit modal present',html.includes('commons-attribution-modal'));
check('No font binary redistributed', !fs.existsSync(path.join(ROOT,'assets/fonts/JerseyM54.ttf')));
function sourceFunction(name,next){const start=app.indexOf('function '+name+'('),end=app.indexOf('\nfunction '+next+'(',start);if(start<0||end<0)throw Error('Missing function '+name);return app.slice(start,end)}
const lc=sourceFunction('leaderboardCandidates','leaderboardTeamVisual');
const context={state:null,normalizeKey:s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,''),ensureWorldPlayers:()=>context.state.worldPlayers,worldPlayerEligibleForCompetition:()=>true,clubsForLeaderboardCompetition:()=>new Set(context.allowed),confederation:c=>c==='DE'?'UEFA':'OTHER'};
vm.createContext(context);vm.runInContext(lc,context);
for(let n=0;n<70;n++){
 const selected=(n%2===0)?'2. Bundesliga':'Premier League';const leagueCountry=n%2===0?'DE':'ENG';const club=n%2===0?'Schalke 04':'Arsenal';const outsiders=[{name:'Lionel Messi',club:'Inter Miami',countryCode:'US',rating:96},{name:'Erling Rival',club:'Manchester City',countryCode:'ENG',rating:98},{name:'Robert NotInLeague',club:'Bayern de Munique',countryCode:'DE',rating:94}];
 const local={name:'Jogador da liga',club,countryCode:leagueCountry,rating:78};context.allowed=[club];context.state={player:{club,clubCountry:leagueCountry},season:{countryAtStart:leagueCountry,league:{name:selected,teams:[club]},worldcup:null},worldPlayers:[...outsiders,local]};
 const got=Array.from(context.leaderboardCandidates(selected));check(`League isolation scenario ${n+1}`,got.length===1&&got[0].club===club);
 // A transfer removes a player's previous eligibility immediately.
 context.state.worldPlayers[3].club='Inter Miami';check(`League transfer removal ${n+1}`,Array.from(context.leaderboardCandidates(selected)).length===0);
}
// The Commons API must reject loosely named graphics and store provenance metadata.
const mod=await import('../functions/api/commons-crest.js');let responseName='File:Arsenal FC crest.svg';
const oldFetch=globalThis.fetch;
globalThis.fetch=async()=>new Response(JSON.stringify({query:{pages:[{title:responseName,imageinfo:[{thumburl:'https://upload.wikimedia.org/wikipedia/commons/thumb/abc/Arsenal_FC_crest.svg/220px-Arsenal_FC_crest.svg.png',descriptionurl:'https://commons.wikimedia.org/wiki/File:Arsenal_FC_crest.svg',extmetadata:{LicenseShortName:{value:'CC BY-SA 4.0'},Artist:{value:'Artist'}}}]}]}}),{status:200});
try{
 let res=await mod.onRequestGet({request:new Request('https://btl.example/api/commons-crest?name=Arsenal')});let json=await res.json();check('Commons exact result and attribution',res.status===200&&json.source==='Wikimedia Commons'&&json.license==='CC BY-SA 4.0'&&json.logo.includes('upload.wikimedia.org'));
 responseName='File:Sporting Ice Hockey badge.svg';res=await mod.onRequestGet({request:new Request('https://btl.example/api/commons-crest?name=Arsenal')});json=await res.json();check('Rejects unrelated Commons logos',json.logo==='');
 res=await mod.onRequestGet({request:new Request('https://btl.example/api/commons-crest?name=%3Cimg%3E')});check('Rejects invalid team names',res.status===400);
}finally{globalThis.fetch=oldFetch}
// A player who never appeared in another league must not be injected into its rankings.
const candidateUser=sourceFunction('userEligibleForLeaderboard','renderCompetitionLeaderboards');
vm.runInContext(candidateUser,context);
context.allowed=['Schalke 04'];
context.state={player:{club:'Inter Miami',clubCountry:'US',nationality:'Argentina'},season:{countryAtStart:'DE',clubAtStart:'Schalke 04',league:{name:'2. Bundesliga',teams:['Schalke 04']},competitionStats:{}}};
check('User from outside league absent if never played there',context.userEligibleForLeaderboard('2. Bundesliga',{games:0})===false);
context.state.player.club='Schalke 04';context.state.player.clubCountry='DE';
check('User from enrolled league appears',context.userEligibleForLeaderboard('2. Bundesliga',{games:0})===true);
context.state.player.club='Inter Miami';context.state.player.clubCountry='US';
check('Historical played stats survive later transfer',context.userEligibleForLeaderboard('2. Bundesliga',{games:12})===true);
check('No unplayed national team ranking inserted',context.userEligibleForLeaderboard('World Cup',{games:0})===false);
let failed=tests.filter(t=>!t.pass);console.log(`BTL V17: ${tests.length-failed.length}/${tests.length} static / league / API regression checks passed`);
if(failed.length)process.exit(1);
