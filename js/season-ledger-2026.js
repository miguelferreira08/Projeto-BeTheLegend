/* BE THE LEGEND — Match ledger V27.
 * Results are the sole source of league and international-phase standings.
 * Historical matches with no archived score are kept as legacy aggregates,
 * never rewritten as invented played fixtures.
 */
(()=>{'use strict';
const unique=a=>[...new Set((a||[]).filter(x=>typeof x==='string'&&x.trim()))];
function hash(value){let n=2166136261;for(const c of String(value))n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
// Berger/circle method: each pair meets exactly once per round-robin cycle.
function roundRobin(teams){
 const a=unique(teams);if(a.length<2)return [];
 if(a.length%2)a.push(null);
 const n=a.length,rounds=[];
 for(let r=0;r<n-1;r++){
  const games=[];
  for(let i=0;i<n/2;i++){
   const left=a[i],right=a[n-i-1];
   if(left&&right){const flip=(r+i)%2===1;games.push({home:flip?right:left,away:flip?left:right});}
  }
  rounds.push(games);
  a.splice(1,0,a.pop());
 }
 return rounds;
}
function userRounds(teams,playerSchedule,playerClub){
 const base=roundRobin(teams),lookup=new Map();
 for(const games of base){const game=games.find(m=>m.home===playerClub||m.away===playerClub);if(game)lookup.set(game.home===playerClub?game.away:game.home,games);}
 const seen=new Map();
 return (playerSchedule||[]).map((m,i)=>{
  const opponent=m.home===playerClub?m.away:m.home;
  const template=lookup.get(opponent)||[];
  const playerGame=template.find(x=>x.home===playerClub||x.away===playerClub);
  const reverse=playerGame&&playerGame.home!==m.home;
  const other=template.filter(x=>x!==playerGame).map(x=>reverse?{home:x.away,away:x.home}:{...x});
  const occurrence=seen.get(opponent)||0;seen.set(opponent,occurrence+1);
  return {round:i+1,home:m.home,away:m.away,other,occurrence};
 });
}
function create(teams,playerSchedule=[],playerClub='',context=''){
 const clubs=unique(teams);
 const schedule=playerClub?userRounds(clubs,playerSchedule,playerClub):roundRobin(clubs).map((games,i)=>({round:i+1,other:games}));
 return {version:1,context,teams:clubs,rounds:schedule,results:[],legacy:null,source:'BTL partidas simuladas, não resultados oficiais'};
}
function randomScore(home,away,context,round,strengthFn=()=>75){
 const a=Math.max(45,Math.min(99,Number(strengthFn(home))||75)),b=Math.max(45,Math.min(99,Number(strengthFn(away))||75));
 // Deterministic, bounded goal generation; strength and home advantage both count.
 const h=hash(`${context}/${round}/${home}/${away}/H`),v=hash(`${context}/${round}/${home}/${away}/A`);
 const thresholds=(power,roll)=>{const chance=Math.max(.45,Math.min(2.8,power));let goals=0;for(let i=0;i<6;i++){const q=(hash(`${roll}/${i}`)%10000)/10000;const probability=Math.min(.79,chance/(1.08+i*1.08));if(q<probability)goals++;}return Math.min(6,goals);};
 return {homeGoals:thresholds(1.25+(a-b)*.020,h),awayGoals:thresholds(1.02+(b-a)*.020,v)};
}
function insert(ledger,round,game,source='BTL simulação'){
 const id=`${round}|${game.home}|${game.away}`;
 if(ledger.results.some(x=>x.id===id))return false;
 const homeGoals=Number(game.homeGoals),awayGoals=Number(game.awayGoals);
 if(!Number.isInteger(homeGoals)||!Number.isInteger(awayGoals)||homeGoals<0||awayGoals<0||!ledger.teams.includes(game.home)||!ledger.teams.includes(game.away))return false;
 ledger.results.push({id,round,home:game.home,away:game.away,homeGoals,awayGoals,playerGoals:Math.max(0,Number(game.playerGoals)||0),playerAssists:Math.max(0,Number(game.playerAssists)||0),source});return true;
}
function advance(ledger,round,playerResult=null,strengthFn=()=>75){
 const row=ledger.rounds[round-1];if(!row)return false;
 if(playerResult)insert(ledger,round,playerResult,'partida do jogador');
 for(const m of row.other){const score=randomScore(m.home,m.away,ledger.context,round,strengthFn);insert(ledger,round,{...m,...score},'BTL simulação de outras equipes');}
 return true;
}
function finish(ledger,strengthFn=()=>75){
 ledger.rounds.forEach((r,i)=>{
  if(r.home)return; // player match cannot be fabricated
  advance(ledger,i+1,null,strengthFn);
 });
 return standings(ledger);
}
function standings(ledger){
 const map=new Map(ledger.teams.map(team=>[team,{team,games:0,wins:0,draws:0,losses:0,gf:0,ga:0,gd:0,points:0,source:ledger.source}]));
 for(const m of ledger.results){const home=map.get(m.home),away=map.get(m.away);if(!home||!away)continue;
  home.games++;away.games++;home.gf+=m.homeGoals;home.ga+=m.awayGoals;away.gf+=m.awayGoals;away.ga+=m.homeGoals;
  if(m.homeGoals>m.awayGoals){home.wins++;away.losses++;home.points+=3;}
  else if(m.homeGoals<m.awayGoals){away.wins++;home.losses++;away.points+=3;}
  else{home.draws++;away.draws++;home.points++;away.points++;}
 }
 if(ledger.legacy?.team){const r=map.get(ledger.legacy.team),v=ledger.legacy;if(r){
  for(const x of ['games','wins','draws','losses','gf','ga','points'])r[x]+=Number(v[x]||0);
  r.legacyAggregated=true;
 }}
 return [...map.values()].map(x=>({...x,gd:x.gf-x.ga})).sort((a,b)=>b.points-a.points||b.gd-a.gd||b.gf-a.gf||a.team.localeCompare(b.team,'pt-BR')).map((r,i)=>({...r,position:i+1}));
}
function simulatedLeague(clubs,year,code,competition,strengthFn=()=>75,matchLimit=0){
 const l=create(clubs,[], '',`${year}|${code}|${competition}`);
 if(matchLimit>0&&l.rounds.length<matchLimit){const first=[...l.rounds];
  while(l.rounds.length<matchLimit){const idx=l.rounds.length;const src=first[idx%first.length];l.rounds.push({round:idx+1,other:src.other.map(m=>Math.floor(idx/first.length)%2===0?{...m}:{home:m.away,away:m.home})});}
 }
 finish(l,strengthFn);return {ledger:l,rows:standings(l)};
}
window.BTLMatchLedger=Object.freeze({create,roundRobin,userRounds,randomScore,insert,advance,finish,standings,simulatedLeague});
})();
