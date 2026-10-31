const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..');const w={};const ctx=vm.createContext({window:w,Date,console});
for(const f of ['js/data.js','js/initial-international-2026.js','js/season-divisions-2026.js','js/continental-qualification.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
const division=w.BTLSeasonDivisions,initial=w.BTLInitialInternational,qual=w.BTLQualification;
let checks=0;function ok(condition,message){assert.ok(condition,message);checks++;}
for(const [name,expected] of Object.entries({'UEFA Champions League':36,'UEFA Europa League':36,'UEFA Conference League':36,'CONMEBOL Libertadores':32,'CONMEBOL Sul-Americana':32,'CAF Champions League':16,'CONCACAF Champions Cup':27,'AFC Champions League Elite':16,'AFC Champions League Two':31,'OFC Champions League':8})){
 ok(initial.participants(name).length===expected,`official count ${name}`);
 ok(initial.participants(name,2027)===null,`never reuse 2026 initial ${name}`);
 ok(initial.source(name)?.startsWith('https://'),`grounding ${name}`);
}
ok(initial.forClub('Flamengo')==='CONMEBOL Libertadores','2026 Flamengo group stage');
ok(initial.forClub('Santos')==='CONMEBOL Sul-Americana','2026 Santos Sudamericana');
ok(initial.forClub('Bayern de Munique')==='UEFA Champions League','2026 Bayern UCL');
ok(initial.forClub('Bournemouth')==='UEFA Europa League','2026 Bournemouth UEL');
ok(initial.forClub('Braga')==='UEFA Conference League','2026 Braga UECL');
ok(initial.forClub('Kashima Antlers')==='AFC Champions League Elite','2026 Kashima AFC Elite');
ok(initial.forClub('Auckland City')==='OFC Champions League','2026 Auckland OFC');
ok(initial.forClub('Coritiba')===null,'2026 Coritiba no made-up continental place');
const main=vm.runInContext('LEAGUE_CLUB_POOLS',ctx),low=vm.runInContext('MARKET_LEAGUE_POOLS',ctx);
const pools=division.initial(main,low);
for(const rule of division.rules){const h=pools[division.key(rule.country,rule.upper)],l=pools[division.key(rule.country,rule.lower)];ok(h?.length>0&&l?.length>0,`active relegation leagues ${rule.upper}/${rule.lower}`);ok(h.every(x=>!l.includes(x)),`no initial overlap ${rule.country}/${rule.lower}`);}
const br=pools['BR|Brasileirão Série A'],bs=pools['BR|Série B'];
let played={['BR|Brasileirão Série A']:br.filter(t=>t!=='Santos').map((team,i)=>({team,points:100-i,gd:25-i})).concat([{team:'Santos',points:1,gd:-40,user:true}])};
const step=division.simulateTransitions(pools,2026,played,()=>75);
const brChange=step.changes.find(x=>x.country==='BR');
ok(brChange.relegated.includes('Santos'),'Brazilian relegation honors played bottom row');
ok(step.pools['BR|Série B'].includes('Santos'),'relegated Santos goes to Série B in 2027');
ok(!step.pools['BR|Brasileirão Série A'].includes('Santos'),'relegated Santos removed from Série A');
ok(brChange.promoted.length===4,'4 Série B promotions');
ok(step.pools['BR|Brasileirão Série A'].length===br.length,'Série A stable size');
ok(step.pools['BR|Série B'].length===bs.length,'Série B stable size');
for(const rule of division.rules){
 const keyUp=division.key(rule.country,rule.upper),keyDown=division.key(rule.country,rule.lower);
 ok(step.pools[keyUp].length===pools[keyUp].length,`upper size stable ${keyUp}`);
 ok(step.pools[keyDown].length===pools[keyDown].length,`lower size stable ${keyDown}`);
 ok(!step.pools[keyUp].some(x=>step.pools[keyDown].includes(x)),`no double league membership ${keyUp}`);
}
ok(division.findLeague(step.pools,'BR','Santos')==='Série B','next season lookup demotion');
const year2=division.simulateTransitions(step.pools,2027,{},()=>75);
ok(year2.year===2028,'2028 structure persists');
const english=step.changes.filter(x=>x.country==='ENG');ok(english.length===2,'England league one and championship changes');
const englishClubs=['ENG|Premier League','ENG|EFL Championship','ENG|EFL League One'].flatMap(k=>step.pools[k]);
ok(englishClubs.length===new Set(englishClubs).size,'English divisions disjoint');
const brRows=br.map((team,i)=>({team,points:80-i,gd:10}));const noted=division.decorate(brRows,'BR','Brasileirão Série A');
ok(noted.filter(x=>x.relegated).length===4,'4 flagged red relegation places');
const secondNoted=division.decorate(bs.map(team=>({team})),'BR','Série B');
ok(secondNoted.filter(x=>x.promoted).length===4,'4 highlighted promotion places');
let rows=[{team:'Palmeiras'},{team:'Flamengo'},{team:'Santos'},{team:'Corinthians'},{team:'Cruzeiro'},{team:'São Paulo'}];
const assigned=qual.assign('BR',rows,{year:2028});
ok(assigned[1].qualification.competition==='CONMEBOL Libertadores'&&assigned[1].qualification.phase==='league'&&assigned[1].qualification.year===2029,'Flamengo 2nd 2028 => 2029 Libertadores main phase');
console.log(JSON.stringify({passed:checks,test:'2026 official baselines and promotion/relegation',countries:['BR','ENG','ES','DE','IT','FR','PT'],initialTournaments:Object.keys(initial.data).length}));
