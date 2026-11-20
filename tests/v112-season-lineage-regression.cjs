'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('js/season-lineage-v112.js','utf8');
const html=fs.readFileSync('index.html','utf8');
new Function(src);assert.match(html,/js\/season-lineage-v112\.js\?v=11\.2\.0/);
let count=0;function test(name,fn){fn();console.log('OK',++count,name);}
const pure={window:{},console,Math,Map,Set};vm.createContext(pure);vm.runInContext(src,pure);
const lib=pure.window.BTLSeasonLineageV112;
test('engine loads',()=>assert.equal(lib.VERSION,'11.2.0'));
test('Brasil Inter campeao Copa x Atletico campeao Brasileirao',()=>{
 const f=lib.createFixture('BR',2026,{leagueTop:['Atlético Mineiro','Internacional','Sport'],cupWinner:'Internacional',cupRunnerUp:'Bahia'});
 assert.deepEqual([...f.participants],['Atlético Mineiro','Internacional']);
 assert.equal(lib.scheduledOpponent(f,'Internacional',0),'Atlético Mineiro');
 assert.equal(lib.scheduledOpponent(f,'Atlético Mineiro',0),'Internacional');
});
for(const [code,dbl,expected] of [
 ['BR','Palmeiras','Flamengo'],['ENG','Palmeiras','Flamengo'],
 ['DE','Palmeiras','Flamengo'],['FR','Palmeiras','Flamengo'],['NL','Palmeiras','Flamengo'],
 ['PT','Palmeiras','Corinthians']
]){
 test(code+' double title uses correct runner-up',()=>{
  const f=lib.createFixture(code,2027,{leagueTop:['Palmeiras','Flamengo','Sport'],cupWinner:dbl,cupRunnerUp:'Corinthians'});
  assert.equal(lib.scheduledOpponent(f,'Palmeiras',0),expected);
 });
}
for(const code of ['ES','IT']){
 test(code+' qualifies four unique clubs with fixed semifinal/final',()=>{
  const f=lib.createFixture(code,2027,{leagueTop:['Real Madrid','Barcelona','Atlético Madrid','Villarreal'],cupWinner:'Barcelona',cupRunnerUp:'Real Madrid'});
  assert.equal(f.participants.length,4);assert.equal(new Set(f.participants).size,4);
  assert.equal(f.matches.length,2);assert.equal(lib.scheduledOpponent(f,'Barcelona',0),'Villarreal');
  assert.ok(['Real Madrid','Atlético Madrid'].includes(lib.scheduledOpponent(f,'Barcelona',1,()=>82)));
 });
}
test('noneligible club excluded',()=>{
 const f=lib.createFixture('BR',2027,{leagueTop:['Flamengo','Palmeiras','Sport'],cupWinner:'Inter'});
 assert.equal(f.participants.includes('Sport'),false);
});
test('no invented opponent with missing data',()=>{
 assert.equal(lib.createFixture('BR',2028,{leagueTop:['A','B'],cupWinner:''}),null);
 assert.equal(lib.createFixture('IT',2028,{leagueTop:['A','B'],cupWinner:'A',cupRunnerUp:'B'}),null);
});
test('stable winner of other semifinal',()=>{
 assert.equal(lib.tieWinner('Inter','Atletico',2030,'Semi',()=>83),lib.tieWinner('Inter','Atletico',2030,'Semi',()=>83));
});
const rules={BR:{league:'Brasileirão Série A',cup:'Copa do Brasil'},ES:{league:'LaLiga',cup:'Copa del Rey'},IT:{league:'Serie A',cup:'Coppa Italia'},ENG:{league:'Premier League',cup:'FA Cup'},DE:{league:'Bundesliga',cup:'DFB-Pokal'},PT:{league:'Primeira Liga',cup:'Taça de Portugal'},FR:{league:'Ligue 1',cup:'Coupe de France'},NL:{league:'Eredivisie',cup:'KNVB Cup'}};
const state={player:{club:'Internacional',clubCountry:'BR',clubCountryName:'Brasil',trophies:[{name:'Copa do Brasil',year:2026,club:'Internacional'}]},season:{year:2026,countryAtStart:'BR',clubAtStart:'Internacional',divisionLevel:1,league:{name:'Brasileirão Série A',finished:true,standings:[{team:'Atlético Mineiro',position:1,origin:'BTL temporada jogada'},{team:'Internacional',position:2,origin:'BTL temporada jogada'},{team:'Sport',position:3,origin:'BTL temporada jogada'}]},cup:{name:'Copa do Brasil',won:true,eliminated:false},matchRegistry:[{competition:'Copa do Brasil',stage:'Final',home:'Internacional',away:'Bahia',homeGoals:2,awayGoals:1}]},qualificationsByYear:{2026:{}},seasonOutcomesByYear:{2026:{}},globalStandingsByYear:{2026:{}},news:[]};
for(const [code] of Object.entries(rules)){const rows=code==='BR'?state.season.league.standings:[{team:code+' Champ',position:1},{team:code+' Runner',position:2},{team:code+' Third',position:3},{team:code+' Fourth',position:4}];state.qualificationsByYear[2026][code]=rows;state.seasonOutcomesByYear[2026][code]={participants:rows.map(x=>x.team),cupWinner:code==='BR'?'Internacional':code+' Cup',cupRunnerUp:code+' CupRunner'};}
const ctx={window:{BTLSeasonDivisions:{key:(c,l)=>c+'|'+l}},state,console,Math,Map,Set,START_YEAR:2026,getCompetitionRule:code=>rules[code]||null,createSuperCupCompetitions:()=>[{name:'Supercopa do Brasil',scope:'club',countryCode:'BR',opponent:null},{name:'UEFA Super Cup',scope:'club'}],superCupOpponent:()=>({name:'Sport',code:'BR'}),getSuperCupEvent:(sc,index)=>({competition:sc.name,opponent:sc.opponent?.name||null,index}),commitSeasonQualifications:s=>{s.qualificationsCommitted=true;},processSeasonEnd:()=>{},clubStrength:()=>82,save:()=>{ctx.saves++},saves:0};
vm.createContext(ctx);vm.runInContext(src,ctx);
test('persists champions of 8 national leagues',()=>{
 ctx.commitSeasonQualifications(state.season);
 assert.equal(Object.keys(state.championsByYearV112[2026]).length,8);
 assert.equal(state.championsByYearV112[2026].BR.leagueTop[0],'Atlético Mineiro');
 assert.equal(state.championsByYearV112[2026].BR.cupWinner,'Internacional');
 assert.equal(state.championsByYearV112[2026].BR.cupRunnerUp,'Bahia');
});
test('2027 user Inter plays Atletico not Sport',()=>{
 const [sc,...rest]=ctx.createSuperCupCompetitions(state.player,2027);
 assert.equal(sc.name,'Supercopa do Brasil');assert.equal(sc.seasonLineageV112.sourceSeason,2026);
 state.season={year:2027,superCups:[sc],matchRegistry:[]};
 assert.equal(ctx.getSuperCupEvent(sc,0).opponent,'Atlético Mineiro');
 assert.equal(rest[0].name,'UEFA Super Cup');
});
test('club transfer qualifies by club title not individual trophy',()=>{
 state.player.club='Atlético Mineiro';
 const sc=ctx.createSuperCupCompetitions(state.player,2027)[0];
 assert.equal(ctx.superCupOpponent(sc).name,'Internacional');
});
test('Sport does not receive phantom Supercopa',()=>{
 state.player.club='Sport';
 assert.equal(ctx.createSuperCupCompetitions(state.player,2027).some(x=>x.name==='Supercopa do Brasil'),false);
});
test('prior champions frozen across next-year table',()=>{
 state.player.club='Internacional';
 assert.equal(ctx.createSuperCupCompetitions(state.player,2027)[0].seasonLineageV112.champions.league,'Atlético Mineiro');
});
console.log('TOTAL '+count+' TESTES APROVADOS');