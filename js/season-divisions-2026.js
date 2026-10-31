/* Be The Legend — promoção e rebaixamento 2026/27 conforme documento do usuário.
 * Nunca inventa clubes: transições apenas entre divisões existentes no catálogo.
 * Play-offs de outros clubes são SIMULADOS de modo determinístico, com placares
 * e partidas de ida/volta conforme a regra. A identidade do vencedor é persistida.
 */
(()=>{'use strict';
const rules=[
 {country:'BR',upper:'Brasileirão Série A',lower:'Série B',upperDrop:4,direct:2,playoff:'br-two',source:'documento BR 2026'},
 {country:'ENG',upper:'Premier League',lower:'EFL Championship',upperDrop:3,direct:2,playoff:'eng-six',source:'documento ENG 2026/27'},
 {country:'ENG',upper:'EFL Championship',lower:'EFL League One',upperDrop:3,direct:2,playoff:'four',source:'documento EFL League One'},
 {country:'ES',upper:'LaLiga',lower:'LALIGA HYPERMOTION',upperDrop:3,direct:2,playoff:'four',source:'documento ES 2026/27'},
 {country:'DE',upper:'Bundesliga',lower:'2. Bundesliga',upperDrop:2,direct:2,playoff:'survival',source:'documento DE 2026/27'},
 {country:'IT',upper:'Serie A',lower:'Serie B',upperDrop:3,direct:2,playoff:'it-six',source:'documento IT 2026/27'},
 {country:'FR',upper:'Ligue 1',lower:'Ligue 2',upperDrop:2,direct:2,playoff:'fr-survival',source:'documento FR 2026/27'},
 {country:'PT',upper:'Primeira Liga',lower:'Liga Portugal 2',upperDrop:2,direct:2,playoff:'survival',source:'documento PT 2026/27'}
];
const key=(country,league)=>`${country}|${league}`;
const copyPools=p=>Object.fromEntries(Object.entries(p||{}).map(([k,v])=>[k,[...v]]));
const unique=a=>[...new Set((a||[]).filter(Boolean))];
function initial(main,second){
 const pools={},primary={BR:'Brasileirão Série A',ENG:'Premier League',ES:'LaLiga',DE:'Bundesliga',IT:'Serie A',FR:'Ligue 1',PT:'Primeira Liga'};
 for(const [country,list] of Object.entries(main||{}))if(primary[country])pools[key(country,primary[country])]=unique(list);
 for(const rule of rules)if(second?.[rule.lower])pools[key(rule.country,rule.lower)]=unique(second[rule.lower]);
 return pools;
}
function findLeague(pools,country,club){
 for(const r of rules)if(r.country===country)for(const league of [r.upper,r.lower])if(pools?.[key(country,league)]?.includes(club))return league;
 return '';
}
function hash(str){let h=2166136261;for(const c of str)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
function sortRows(clubs,year,country,league,actualRows=[],strengthFn=()=>72){
 const mapped=new Map((actualRows||[]).map(r=>[r.team,r]));
 return unique(clubs).map(team=>{
  const actual=mapped.get(team);if(actual)return {...actual,team};
  const strength=Number(strengthFn(team,country))||72;
  return {team,points:Math.round(strength*1.6)+(hash(`${year}/${country}/${league}/${team}`)%35),gd:(hash(`${year}/GD/${team}`)%53)-24,strength,origin:'BTL simulação'};
 }).sort((a,b)=>Number(b.points||0)-Number(a.points||0)||Number(b.gd||0)-Number(a.gd||0)||String(a.team).localeCompare(String(b.team)));
}
function playoffTie(teamA,teamB,year,label,legs=2,strengthFn=()=>72,country=''){
 // Simula a disputa de ponta a ponta: não se confunde resultado com campeonato real.
 const rating=n=>(Number(strengthFn(n,country))||72);
 const game=(a,b,i)=>{
  const seed=hash(`${year}|${label}|${i}|${a}|${b}`),diff=rating(a)-rating(b);
  return [Math.max(0,Math.min(5,1+(seed%3)+Math.round(diff/18))),Math.max(0,Math.min(5,1+(Math.floor(seed/19)%3)-Math.round(diff/18)))];
 };
 const matches=[];let scoreA=0,scoreB=0;
 for(let i=0;i<legs;i++){
  const home=i%2===0?teamA:teamB,away=i%2===0?teamB:teamA,[gH,gA]=game(home,away,i);
  scoreA+=home===teamA?gH:gA;scoreB+=home===teamB?gH:gA;matches.push({home,away,homeGoals:gH,awayGoals:gA});
 }
 const penalty=scoreA===scoreB;const winner=scoreA>scoreB?teamA:scoreB>scoreA?teamB:hash(`${year}|${label}|desempate`)%2===0?teamA:teamB;
 return {teamA,teamB,matches,scoreA,scoreB,penalties:penalty,winner,source:'BTL simulação de mata-mata'};
}
function bracket(rule,low,high,year,strengthFn){
 const rows=low.slice(rule.direct),byRank=i=>rows[i]?.team;
 const ties=[],play=(a,b,tag,legs=2)=>{
  if(!a||!b)return {winner:a||b||''};
  const t=playoffTie(a,b,year,`${rule.country}/${rule.lower}/${tag}`,legs,strengthFn,rule.country);ties.push(t);return t;
 };
 let candidate='';
 if(rule.playoff==='br-two'){
  // 3º x 6º, 4º x 5º; os dois vencedores SOBEM (não disputar uma final adicional).
  const a=play(byRank(3),byRank(0),'3v6'),b=play(byRank(2),byRank(1),'4v5');
  for(const [tie,seed] of [[a,byRank(0)],[b,byRank(1)]]){
    if(tie&&tie.scoreA===tie.scoreB){tie.winner=seed;tie.penalties=false;tie.betterSeedAdvantage=true;}
  }
  return {winners:unique([a.winner,b.winner]),ties};
 }
 if(rule.playoff==='eng-six'||rule.playoff==='it-six'){
  // Serie B: o 3º pode subir sem playoff quando abre mais de 14 pontos do 4º.
  // Critério de vantagem previsto pela Lega B; nunca substituí-lo por sorteio.
  if(rule.playoff==='it-six'&&low.length>=4&&Number(low[2].points)-Number(low[3].points)>14){
    return {winners:[low[2].team],ties,reason:'Terceiro com vantagem de pelo menos 14 pontos'};
  }
  const s1=play(byRank(2),byRank(5),'5v8',1),s2=play(byRank(3),byRank(4),'6v7',1);
  // Na Championship, o 3º recebe o adversário de pior posição entre os
  // vencedores da fase eliminatória; as semifinais não têm chave rígida.
  const winners=[s1.winner,s2.winner];
  const rank=team=>low.findIndex(row=>row.team===team);
  const lower=rule.playoff==='eng-six'?winners.sort((a,b)=>rank(b)-rank(a))[0]:s2.winner;
  const higher=rule.playoff==='eng-six'?winners.find(t=>t!==lower):s1.winner;
  const semi1=play(lower,byRank(0),'3-vencedor',2),semi2=play(higher,byRank(1),'4-vencedor',2);
  candidate=play(semi1.winner,semi2.winner,'final',rule.playoff==='eng-six'?1:2).winner;
 }else if(rule.playoff==='four'){
  const s1=play(byRank(3),byRank(0),'3v6',2),s2=play(byRank(2),byRank(1),'4v5',2);
  candidate=play(s1.winner,s2.winner,'final',2).winner;
 }else if(rule.playoff==='fr-survival'){
  const s1=play(byRank(1),byRank(2),'4v5',1),s2=play(byRank(0),s1.winner,'3-vencedor',1);
  const elite=high[high.length-rule.upperDrop-1]?.team;
  candidate=play(s2.winner,elite,'permanencia-16',2).winner;
  return {winners:candidate&&candidate!==elite?[candidate]:[],ties};
 }else if(rule.playoff==='survival'){
  const elite=high[high.length-rule.upperDrop-1]?.team,challenger=byRank(0);
  candidate=play(challenger,elite,'permanencia-16',2).winner;
  return {winners:candidate&&candidate!==elite?[candidate]:[],ties};
 }
 return {winners:candidate?[candidate]:[],ties};
}
function movesForRule(rule,upperRows,lowerRows,year,strengthFn=()=>72){
 const relegated=upperRows.slice(-rule.upperDrop).map(r=>r.team);
 // Clubes B de Portugal não podem ascender à Primeira Liga; o próximo
 // clube elegível ocupa sua vaga, sem retirar o clube B da segunda divisão.
 const eligibleLower=rule.country==='PT'?lowerRows.filter(r=>!/(?:^|\s)(?:B|II)$/.test(String(r.team||''))):lowerRows;
 const promoted=eligibleLower.slice(0,rule.direct).map(r=>r.team);
 const extras=bracket(rule,eligibleLower,upperRows,year,strengthFn);
 if(rule.country==='IT'&&lowerRows.length>=18){
   // Playout da Serie B quando a diferença entre o 16º e o 17º é pequena.
   // O resultado é registrado; sem Serie C não é criado um clube fictício.
   const sixteenth=lowerRows[15],seventeenth=lowerRows[16];
   if(sixteenth&&seventeenth&&Number(sixteenth.points)-Number(seventeenth.points)<=4){
     const tie=playoffTie(sixteenth.team,seventeenth.team,year,'IT/SerieB/playout',2,strengthFn,'IT');
     extras.ties.push({...tie,phase:'playout',relegationTo:'Serie C (fora do catálogo jogável)'});
   }
 }
 for(const winner of extras.winners){
  if(promoted.includes(winner))continue;promoted.push(winner);
  if(rule.playoff==='survival'||rule.playoff==='fr-survival'){
   const elite=upperRows[upperRows.length-rule.upperDrop-1]?.team;if(elite&&!relegated.includes(elite))relegated.push(elite);
  } // BR/ENG/ES/IT: o descenso é fixo; play-offs apenas completam as vagas.

 }
 return {promoted,relegated,playoffSimulated:Boolean(rule.playoff),playoffTies:extras.ties};
}
function simulateTransitions(pools,year,played={},strengthFn=()=>72){
 const next=copyPools(pools),changes=[],outputs=[];
 for(const rule of rules){
  const up=key(rule.country,rule.upper),down=key(rule.country,rule.lower);
  if(!pools?.[up]?.length||!pools?.[down]?.length)continue;
  const high=sortRows(pools[up],year,rule.country,rule.upper,played[up],strengthFn),low=sortRows(pools[down],year,rule.country,rule.lower,played[down],strengthFn);
  outputs.push({rule,up,down,...movesForRule(rule,high,low,year,strengthFn)});
 }
 for(const m of outputs){next[m.up]=next[m.up].filter(t=>!m.relegated.includes(t));next[m.down]=next[m.down].filter(t=>!m.promoted.includes(t));}
 for(const m of outputs){
  next[m.up].push(...m.promoted);next[m.down].push(...m.relegated);
  changes.push({country:m.rule.country,upper:m.rule.upper,lower:m.rule.lower,promoted:[...m.promoted],relegated:[...m.relegated],playoffSimulated:m.playoffSimulated,playoffTies:m.playoffTies,source:m.rule.source});
 }
 for(const [k,v] of Object.entries(next))next[k]=unique(v);
 return {year:Number(year)+1,pools:next,changes};
}
function decorate(rows,country,league){
 const upper=rules.find(x=>x.country===country&&x.upper===league),lower=rules.find(x=>x.country===country&&x.lower===league);
 if(!upper&&!lower)return rows;
 return (rows||[]).map((r,i,arr)=>{
  const row={...r},pos=i+1;
  if(upper&&pos>arr.length-upper.upperDrop){row.relegated=true;row.qualificationColor='#e87979';row.divisionNotice=`Zona de rebaixamento para ${upper.lower}`;}
  else if(upper&&['survival','fr-survival'].includes(upper.playoff)&&pos===arr.length-upper.upperDrop){row.relegationPlayoff=true;row.qualificationColor='#d6b75a';row.divisionNotice=`Play-off de permanência (resultado pendente)`;}
  if(lower&&pos<=lower.direct&&!(country==='PT'&&/(?:^|\s)(?:B|II)$/.test(String(row.team||'')))){row.promoted=true;row.qualificationColor='#55bd8e';row.divisionNotice=`Acesso direto a ${lower.upper}`;}
  else if(lower&&pos>lower.direct){
   const playoffRange=lower.playoff==='br-two'?6:lower.playoff==='eng-six'||lower.playoff==='it-six'?8:lower.playoff==='fr-survival'?5:lower.playoff==='survival'?3:6;
   if(pos<=playoffRange){row.promotionPlayoff=true;row.qualificationColor='#d6b75a';row.divisionNotice=`Play-off de acesso (resultado pendente)`;}
  }
  return row;
 });
}
window.BTLSeasonDivisions=Object.freeze({rules,key,initial,findLeague,sortRows,playoffTie,movesForRule,simulateTransitions,decorate});
})();
