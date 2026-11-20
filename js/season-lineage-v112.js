(function seasonLineageV112(root) {
'use strict';
const VERSION='11.2.0';
const KEY=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');
const hash=value=>{let h=2166136261;for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const countryFormats={
  BR:{name:'Supercopa do Brasil',kind:'final',double:'leagueRunnerUp'},
  ENG:{name:'FA Community Shield',kind:'final',double:'leagueRunnerUp'},
  DE:{name:'DFL-Supercup',kind:'final',double:'leagueRunnerUp'},
  FR:{name:'Trophée des Champions',kind:'final',double:'leagueRunnerUp'},
  PT:{name:'Supertaça Cândido de Oliveira',kind:'final',double:'cupRunnerUp'},
  NL:{name:'Johan Cruyff Shield',kind:'final',double:'leagueRunnerUp'},
  ES:{name:'Supercopa da Espanha',kind:'four'},
  IT:{name:'Supercoppa Italiana',kind:'four'}
};
const unique=(items)=>[...new Set((items||[]).filter(x=>typeof x==='string'&&x.trim()).map(x=>x.trim()))];
const orderStandings=rows=>[...(rows||[])].filter(r=>r&&r.team).sort((a,b)=>Number(a.position||0)&&Number(b.position||0)?Number(a.position)-Number(b.position):0);
function tieWinner(a,b,year,salt,strength=()=>80){
 const x=Number(strength(a)||80),y=Number(strength(b)||80),rnd=hash([year,salt,a,b].join('|'))/4294967296;
 const chance=Math.max(.18,Math.min(.82,.5+(x-y)*.018));
 return rnd<chance?a:b;
}
function createFixture(code,year,record,strength=()=>80){
 const config=countryFormats[code],league=unique(record.leagueTop||[]),cup=record.cupWinner,cupRunner=record.cupRunnerUp,champ=league[0];
 if(!config||!champ||!cup||!league.includes(champ))return null;
 if(config.kind==='final'){
   const other=champ===cup?(config.double==='cupRunnerUp'?cupRunner:league[1]):cup;
   if(!other||other===champ)return null;
   return {year,countryCode:code,competition:config.name,format:'final',participants:[champ,other],matches:[{stage:'Final',teams:[champ,other]}],origin:record.origin||'BTL simulação + resultados registrados',champions:{league:champ,cup},sourceYear:year,substitution:champ===cup?config.double:null};
 }
 const participants=unique([cup,cupRunner,...league]).slice(0,4);
 if(participants.length!==4)return null;
 // The two Cup finalists have priority; the remainder come from league positions.
 const matches=[{stage:'Semifinal 1',teams:[participants[0],participants[3]]},{stage:'Semifinal 2',teams:[participants[1],participants[2]]}];
 return {year,countryCode:code,competition:config.name,format:'four',participants,matches,origin:record.origin||'BTL simulação + resultados registrados',champions:{league:champ,cup},sourceYear:year};
}
function scheduledOpponent(fixture,club,stageIndex,strength=()=>80){
 if(!fixture?.participants?.includes(club))return null;
 if(fixture.format==='final')return stageIndex===0?fixture.participants.find(x=>x!==club)||null:null;
 const myIndex=fixture.matches.findIndex(m=>m.teams.includes(club));
 if(myIndex<0)return null;
 if(stageIndex===0)return fixture.matches[myIndex].teams.find(x=>x!==club)||null;
 if(stageIndex===1){
  const other=fixture.matches[1-myIndex];
  return other?tieWinner(other.teams[0],other.teams[1],fixture.year,fixture.competition+'|semifinal',strength):null;
 }
 return null;
}
const api={VERSION,countryFormats,createFixture,scheduledOpponent,tieWinner,orderStandings,unique,hash};
root.BTLSeasonLineageV112=api;
if(typeof state==='undefined'||typeof getCompetitionRule!=='function'||typeof createSuperCupCompetitions!=='function')return;
const countryLeagueTable=(year,code,s=state.season)=>{
 const result=state.qualificationsByYear?.[year]?.[code];
 const seasonOwn=s?.year===year&&s.countryAtStart===code&&s.divisionLevel===1;
 const baseLeague=getCompetitionRule(code,code)?.league;
 const correctOwn=seasonOwn&&s.league?.finished&&s.league.name===baseLeague;
 if(correctOwn&&Array.isArray(s.league.standings)&&s.league.standings.length)return orderStandings(s.league.standings);
 if(Array.isArray(result)&&result.length)return orderStandings(result);
 const key=window.BTLSeasonDivisions?.key?.(code,baseLeague)||`${code}|${baseLeague}`;
 const cached=state.globalStandingsByYear?.[year]?.[key];
 return orderStandings(cached||[]);
};
function lookupPlayedCupFinal(s,name){
 const list=(s?.matchRegistry||[]).filter(x=>x?.competition===name&&/^Final(?:\b|[\s·:-])/i.test(String(x.stage||'')));
 return list.at(-1)||null;
}
function buildChampions(year,code,s=state.season){
 const table=countryLeagueTable(year,code,s),top=unique(table.map(x=>x.team));
 if(top.length<2)return null;
 const rule=getCompetitionRule(code,code)||{};
 const outcomes=state.seasonOutcomesByYear?.[year]?.[code]||{};
 const isOwn=s?.year===year&&s.countryAtStart===code;
 const club=s?.clubAtStart||state.player?.club||'';
 const cupName=rule.cup;
 const played=isOwn?lookupPlayedCupFinal(s,cupName):null;
 const userCup=isOwn&&s.cup?.name===cupName?s.cup:null;
 const userPlayedFinal=!!played&&[played.home,played.away].includes(club);
 let cupWinner=outcomes.cupWinner||'';
 let cupRunnerUp=outcomes.cupRunnerUp||'';
 const candidates=unique([...top,...(isOwn?[club]:[]),...(played?[played.home,played.away]:[])]);
 if(userCup?.won){cupWinner=club;if(userPlayedFinal)cupRunnerUp=played.home===club?played.away:played.home;}
 else if(userCup?.eliminated&&userPlayedFinal){
   const other=played.home===club?played.away:played.home;
   cupWinner=other;cupRunnerUp=club;
 }
 else if(userCup?.eliminated&&cupWinner===club)cupWinner='';
 // No champion may be a club that is known to have lost the cup.
 const excluded=new Set(userCup?.eliminated?[club]:[]);
 const cupChoices=candidates.filter(x=>!excluded.has(x));
 if(!cupWinner||excluded.has(cupWinner)){
   cupWinner=cupChoices[hash(`${year}|${code}|cup|fallback`)%cupChoices.length]||'';
 }
 if(!cupRunnerUp||cupRunnerUp===cupWinner){
   cupRunnerUp=candidates.find(x=>x!==cupWinner&&x!==club)||candidates.find(x=>x!==cupWinner)||'';
 }
 const rec={year,countryCode:code,leagueName:rule.league||'',cupName,leagueTop:top,cupWinner,cupRunnerUp,
   sourceLeague:table.some(r=>r.origin==='BTL temporada jogada')||isOwn&&s.divisionLevel===1?'tabela jogada + simulação de outras equipes':'classificação simulada e persistida',
   sourceCup:userCup?.won||userPlayedFinal?'partida real do save':'resultado simulado e persistido',
   origin:'Dados persistidos da temporada '+year};
 return rec;
}
function syncCompletedSeason(s=state.season){
 if(!s||!s.league?.finished)return null;
 const year=Number(s.year),codes=new Set([...Object.keys(state.qualificationsByYear?.[year]||{}),...Object.keys(countryFormats)]);
 state.championsByYearV112=state.championsByYearV112||{};
 const book=state.championsByYearV112[year]=state.championsByYearV112[year]||{};
 let changed=false;
 for(const code of codes){
   if(!getCompetitionRule(code,code)?.league)continue;
   const result=buildChampions(year,code,s);
   if(!result)continue;
   const old=book[code];
   if(!old||old.sourceCup!=='partida real do save'||old.sourceLeague!=='tabela jogada + simulação de outras equipes'){
     // Saved, played champions always take priority over earlier simulated snapshots.
     if(!old||JSON.stringify(old)!==JSON.stringify(result)){book[code]=result;changed=true;}
   }
   if(state.seasonOutcomesByYear?.[year]?.[code]){
     const ext=state.seasonOutcomesByYear[year][code],rec=book[code];
     if(rec&&(ext.cupWinner!==rec.cupWinner||ext.cupRunnerUp!==rec.cupRunnerUp)){
       ext.cupWinner=rec.cupWinner;ext.cupRunnerUp=rec.cupRunnerUp;changed=true;
     }
   }
 }
 if(changed)save();
 return book;
}
function storedChampions(year,code){
 const previous=state.championsByYearV112?.[year]?.[code];
 if(previous?.leagueTop?.length&&previous.cupWinner)return previous;
 const rec=buildChampions(year,code);
 if(!rec)return null;
 state.championsByYearV112=state.championsByYearV112||{};
 (state.championsByYearV112[year]=state.championsByYearV112[year]||{})[code]=rec;
 save();
 return rec;
}
function resolveFixture(country,year){
 const rec=storedChampions(year,country);
 return rec?createFixture(country,year,rec,(club)=>clubStrength(club,country)):null;
}
const oldCommit=commitSeasonQualifications;
commitSeasonQualifications=function(s=state.season){
 const value=oldCommit(s);
 syncCompletedSeason(s);
 return value;
};
const oldSeasonEnd=processSeasonEnd;
processSeasonEnd=function(){
 const value=oldSeasonEnd();
 if(state.season?.league?.finished)syncCompletedSeason(state.season);
 return value;
};
const oldCreate=createSuperCupCompetitions;
createSuperCupCompetitions=function(p,year){
 const original=oldCreate(p,year);
 const domestic=countryFormats[p.clubCountry];
 const other=original.filter(x=>!domestic||x.name!==domestic.name);
 if(!domestic||Number(year)<=START_YEAR)return other;
 const fixture=resolveFixture(p.clubCountry,Number(year)-1);
 if(!fixture||!fixture.participants.includes(p.club))return other;
 const name=domestic.name;
 const sc={name,scope:'club',countryCode:p.clubCountry,active:true,won:false,eliminated:false,stageIndex:0,
   stages:(domestic.kind==='four'?['Semifinal','Final']:['Final']).map(name=>({name})),opponent:null,
   seasonLineageV112:{...fixture,club:p.club,sourceSeason:Number(year)-1}};
 return [sc,...other];
};
const oldOpponent=superCupOpponent;
superCupOpponent=function(sc){
 const data=sc?.seasonLineageV112;
 if(data&&sc.scope==='club'){
   const target=scheduledOpponent(data,data.club,sc.stageIndex,club=>clubStrength(club,sc.countryCode));
   return target?{name:target,code:sc.countryCode}:null;
 }
 const domestic=countryFormats[sc?.countryCode];
 if(domestic&&sc?.name===domestic.name){
   const year=(state.season?.year||START_YEAR)-1,fixture=resolveFixture(sc.countryCode,year);
   if(fixture&&fixture.participants.includes(state.player?.club)){
     sc.seasonLineageV112={...fixture,club:state.player.club,sourceSeason:year};
     const target=scheduledOpponent(fixture,state.player.club,sc.stageIndex,club=>clubStrength(club,sc.countryCode));
     return target?{name:target,code:sc.countryCode}:null;
   }
   return null; // Never choose a fictitious unrelated club as opponent.
 }
 return oldOpponent(sc);
};
const oldEvent=getSuperCupEvent;
getSuperCupEvent=function(sc,index){
 const domestic=countryFormats[sc?.countryCode];
 if(domestic&&sc?.name===domestic.name){
   const already=(state.season?.matchRegistry||[]).some(m=>m.competition===sc.name);
   if(!already||sc.stageIndex>0){
     const required=superCupOpponent(sc);
     if(!required){sc.active=false;state.news.push(`A ${sc.name} não foi disputada: faltam resultados confiáveis da temporada anterior.`);return null;}
     // An opponent selected by the previous random implementation is not authoritative.
     if(!already||!sc.opponent||sc.opponent.name!==required.name)sc.opponent=required;
   }
 }
 return oldEvent(sc,index);
};
root.BTLSeasonLineageAudit=()=>({currentYear:state.season?.year,champions:state.championsByYearV112||{},currentSuperCups:state.season?.superCups||[]});
})(typeof window!=='undefined'?window:globalThis);
