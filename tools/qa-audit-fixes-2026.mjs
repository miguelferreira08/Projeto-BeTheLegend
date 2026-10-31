/* Independent checks for the fixes after the 32-country compliance audit. */
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';
const root=path.resolve(import.meta.dirname,'..');let checks=0;
const test=(condition,message)=>{checks++;if(!condition)throw Error(`FAIL ${checks}: ${message}`);};
const ctx={window:{},console};vm.createContext(ctx);
for(const file of ['continental-qualification','season-divisions-2026','season-outcomes-2026']){
  vm.runInContext(fs.readFileSync(path.join(root,'js',file+'.js'),'utf8'),ctx);
}
const Q=ctx.window.BTLQualification,D=ctx.window.BTLSeasonDivisions,O=ctx.window.BTLSeasonOutcomes;
const rows=(names)=>names.map((team,i)=>({team,points:90-i*3,games:38}));
const teams=n=>Array.from({length:n},(_,i)=>'Time '+String(i+1).padStart(2,'0'));
const result=(country)=>{const r=rows(teams(country==='US'?30:country==='AR'?30:country==='MX'?18:20));const o=O.determine(country,2028,r);return {r,o,q:Q.assign(country,r,{...o,year:2028,simulatedStandings:true})};};
for(const code of ['BR','AR','CL','CO','MX','US','NL','ENG','PT','ES','DE','IT','FR']){
 const {r,o,q}=result(code);test(o.participants.length===r.length,code+' participants preserved');
 test(q.every((row,i)=>row.team===r[i].team),code+' ranks preserved');
 test(q.every(row=>!row.qualification||row.qualification.year===2029),code+' qualification year');
 test(q.every(row=>!row.qualification||row.qualification.model==='simulacao'),code+' nonhistorical model');
}
for(const code of ['AR','CO']){
 const {o,q}=result(code);test(Boolean(o.aperturaWinner&&o.clausuraWinner),code+' semestral results');
 test(q.some(r=>r.qualification?.competition==='CONMEBOL Libertadores'&&r.qualification.reason.includes('Apertura')),code+' Apertura joins Libertadores');
}
const mls=result('US');test(Boolean(mls.o.mlsCupWinner&&mls.o.supportersShieldWinner&&mls.o.otherConferenceWinner),'MLS events generated');
test(mls.q.filter(x=>x.qualification?.competition==='CONCACAF Champions Cup').length===6,'MLS 5 places plus US Open Cup');
const mx=result('MX');test(Boolean(mx.o.aperturaRunnerUp&&mx.o.clausuraRunnerUp),'Mexico finalists persisted');
test(mx.q.filter(x=>x.qualification?.competition==='CONCACAF Champions Cup').length===6,'Mexico 6 CONCACAF spots');
const chile=result('CL');test(Boolean(chile.o.cupPlayoffWinner&&chile.o.cupPlayoffLoser&&chile.o.cupPlayoffMatches.length===2),'Chile special match simulated');
test(chile.q.find(x=>x.team===chile.o.cupPlayoffLoser)?.qualification?.competition==='CONMEBOL Sul-Americana','Chile loser goes to Sula');
const rows20=rows(teams(20));const portugal=O.determine('PT',2028,rows20);const qualified=Q.assign('PT',rows20,{...portugal,year:2028});
test(qualified.filter(x=>x.qualification?.competition==='UEFA Champions League').length===3,'Portugal 3 UCL slots');
test(qualified.some(x=>x.qualification?.competition==='UEFA Europa League'),'Portugal Europa qualification');
const italyRule=D.rules.find(r=>r.country==='IT'),italyUpper=rows(teams(20)),italyLower=rows(teams(20).map(x=>x+' B'));
italyLower[2].points=85;italyLower[3].points=60;const italy=D.movesForRule(italyRule,italyUpper,italyLower,2028);
test(italy.promoted.includes(italyLower[2].team),'Italian 14-point direct ascension');
const brazilRule=D.rules.find(r=>r.country==='BR');const br=D.movesForRule(brazilRule,rows(teams(20)),rows(teams(20).map(t=>t+'B')),2028);
test(br.promoted.length===4&&br.playoffTies.length===2,'Brazil 4 promotions and two playoffs');
const src=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
test(src.includes('const playedTeams=[...new Set([club,...(l.schedule||[]).flatMap(m=>[m.home,m.away])])].filter(Boolean);'),'final table uses actual schedule');
test(!src.includes('const teams=leaguePoolForCountry(state.season.countryAtStart||p.clubCountry,state.season.clubAtStart||p.club);'),'old defective finalize call gone');
test(src.includes('state.seasonOutcomesByYear'),'result ledger exists');
test(src.includes('state.globalStandingsByYear'),'world standings ledger exists');
test(src.includes('const played={...(state.globalStandingsByYear?.[year]||{}),[key]:'),'promotion reads same standings');
test(src.includes('const eligible=(field||[]).filter(name=>name!==p.club);'),'continental rivals only qualified teams');
console.log(JSON.stringify({status:'PASS',checks},null,2));
