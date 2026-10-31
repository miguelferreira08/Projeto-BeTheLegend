/* Simulador explícito de resultados fora da carreira do jogador.
 * NUNCA classifica como históricos/oficiais placares criados pelo BTL.
 * Cada entrada decorre dos participantes e classificação daquela temporada,
 * com semente determinística, para que a UI e a temporada seguinte coincidam.
 */
(()=>{'use strict';
const hash=text=>{let h=2166136261;for(const c of String(text)){h=Math.imul(h^c.charCodeAt(0),16777619);}return h>>>0;};
const unique=list=>[...new Set((list||[]).filter(Boolean))];
function determine(country,year,rows,opt={}){
 const teams=unique((rows||[]).map(r=>r.team));const output={year,country,source:'BTL simulação de torneios não jogados',participants:teams,qualificationBasis:'Classificação simulada da temporada — não oficial'};
 if(teams.length<2)return output;
 const nth=(type,start=0)=>{
  const candidates=teams.slice(start);if(!candidates.length)return '';
  return candidates[hash(`${country}/${year}/${type}`)%Math.min(candidates.length,Math.max(2,Math.ceil(candidates.length*.65)))];
 };
 const fixture=(a,b,label)=>{
  if(!a||!b||a===b)return {winner:a||b||'',loser:'',matches:[]};
  let aa=0,bb=0;const matches=[];
  for(let leg=0;leg<2;leg++){
   const home=leg===0?a:b,away=leg===0?b:a,seed=hash(`${country}/${year}/${label}/${leg}`);
   const homeGoals=seed%4,awayGoals=Math.floor(seed/13)%4;
   matches.push({home,away,homeGoals,awayGoals});if(home===a){aa+=homeGoals;bb+=awayGoals;}else{aa+=awayGoals;bb+=homeGoals;}
  }
  const winner=aa===bb?(hash(`${country}/${year}/${label}/penalties`)%2?a:b):aa>bb?a:b;
  return {winner,loser:winner===a?b:a,matches,decidedOnPenalties:aa===bb};
 };
 const winner=String(opt.actualCupWinner||'');const finalist=String(opt.actualCupRunnerUp||'');
 // Campeão e vice da copa persistem. Uma derrota do usuário na final também
 // conserva o adversário real da partida quando ele é conhecido.
 const potentialCupWinners=teams.filter(team=>!opt.excludedCupWinners?.includes(team));
 const sampledCupWinner=potentialCupWinners[hash(`${country}/${year}/national-cup`)%Math.max(1,potentialCupWinners.length)];
 output.cupWinner=teams.includes(winner)?winner:(teams.includes(opt.finalOpponent)&&teams.includes(finalist)?opt.finalOpponent:(sampledCupWinner||''));
 if(finalist&&finalist!==output.cupWinner&&teams.includes(finalist))output.cupRunnerUp=finalist;
 else if(finalist&&finalist===output.cupWinner&&winner!==output.cupWinner)output.cupRunnerUp=winner;
 else output.cupRunnerUp=teams.find(t=>t!==output.cupWinner&&t===nth('cup-finalist',1))||teams.find(t=>t!==output.cupWinner)||'';
 if(country==='AR'||country==='CO'||country==='MX'||country==='GT'||country==='CR'){
  output.aperturaWinner=nth('apertura-final');output.clausuraWinner=nth('clausura-final');
  output.aperturaRunnerUp=teams.find(t=>t!==output.aperturaWinner&&t===nth('apertura-runner',1))||teams.find(t=>t!==output.aperturaWinner)||'';
  output.clausuraRunnerUp=teams.find(t=>t!==output.clausuraWinner&&t===nth('clausura-runner',1))||teams.find(t=>t!==output.clausuraWinner)||'';
 }
 if(country==='CL'){
  output.cupLeagueWinner=nth('copa-da-liga',0);
  const third=teams[2]||teams[0],cup=output.cupWinner;
  const tie=fixture(third,cup,'chile-cup-barrage');
  output.cupPlayoffWinner=tie.winner;output.cupPlayoffLoser=tie.loser;output.cupPlayoffMatches=tie.matches;
 }
 if(country==='NL'){
  // Playoff europeu entre clubes elegíveis, não outorga automática ao quarto.
  const eligible=teams.slice(3,8).filter(t=>t!==output.cupWinner);
  if(eligible.length)output.europaPlayoffWinner=eligible[hash(`${year}/nl-european-playoff`)%eligible.length];
 }
 if(country==='US'){
  output.supportersShieldWinner=teams[0];
  // Divisão de conferências fixada pelo catálogo MLS; somente adversários
  // pertencentes à tabela são elegíveis para a conferência oposta.
  const east=new Set(['Atlanta United','Charlotte FC','Chicago Fire','FC Cincinnati','Columbus Crew','D.C. United','Inter Miami','Montréal','Nashville SC','New England Revolution','New York City FC','Orlando City','Philadelphia Union','New York Red Bulls','Toronto FC']);
  const west=teams.filter(t=>!east.has(t)),eastern=teams.filter(t=>east.has(t));
  const shieldInEast=east.has(output.supportersShieldWinner);
  output.otherConferenceWinner=(shieldInEast?west:eastern)[0]||teams[1];
  const bracket=fixture(teams[0],nth('mls-cup-opponent',1),'mls-cup-final');output.mlsCupWinner=bracket.winner;output.mlsCupFinal=bracket.matches;
 }
 if(country==='CA'){output.regularSeasonWinner=teams[0];output.playoffWinner=fixture(teams[0],teams[1],'cpl-final').winner;}
 if(country==='MX')output.annualStandings=teams;
 output.simulatedEvents=true;
 return output;
}
window.BTLSeasonOutcomes=Object.freeze({determine});
})();
