(function installCareerV111(root){
'use strict';
const VERSION='11.1.0';
const START=2026;
const hash=value=>{let h=2166136261;for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const key=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');
const clampLocal=(v,a,b)=>Math.min(b,Math.max(a,v));
const wcTitle=title=>/World Cup|Copa do Mundo/i.test(String(title||''));
const seeded=(s)=>((hash(s)+.5)/4294967296);
function eligibleYear(wp,year){
  if(!wp||!wp.id)return false;
  if(wp.retiredYear&&Number(wp.retiredYear)<=year)return false;
  const birth=Number(wp.birthYear);
  if(!Number.isFinite(birth)||birth<1900||birth>year)return !wp.retired;
  if(year<=START)return !wp.retired || Number(wp.retiredYear)>year;
  const target=root.BTLWorldCareer?.retirementAge?.(wp)||38;
  return year-birth<target;
}
function select26(pool,code,year,created=null){
  const valid=pool.filter(wp=>wp&&wp.nationalCode===code&&eligibleYear(wp,year));
  const unique=[...new Map(valid.map(p=>[String(p.id),p])).values()];
  const gk=p=>/^(GOL|GK|GOLEIRO|POR)$/i.test(String(p.position||''));
  const sort=(a,b)=>Number(b.rating||0)-Number(a.rating||0)||String(a.id).localeCompare(String(b.id));
  const keepers=unique.filter(gk).sort(sort).slice(0,3);
  const others=unique.filter(p=>!gk(p)).sort(sort).slice(0,23);
  if(keepers.length<3||others.length<23)return null;
  const result=[...keepers,...others].sort(sort);
  if(created&&created.calledUp&&created.nationalityCode===code){
    const replacement=created.position==='Goleiro'?keepers.at(-1):others.at(-1);
    const id='career-user:'+String(created.name||'player');
    if(replacement){
      const idx=result.findIndex(p=>p.id===replacement.id);
      if(idx>=0)result.splice(idx,1,{id,name:created.name,position:created.position==='Goleiro'?'GOL':'ATA',rating:created.overall||65,nationalCode:code,club:created.club||'',isCareerUser:true});
    }
  }
  return result;
}
const positions=['GOL','GOL','GOL','ZAG','ZAG','LD','LE','VOL','MC','MC','MEI','MEI','MD','ME','PD','PE','ATA','ATA','SA','ZAG','VOL','PD','PE','ATA','MC','ZAG','VOL','LE','LD','ATA','MEI','MC'];
function nationalFiller(code,year,slot){
  const id='national-v111:'+year+':'+code+':'+slot;
  const gen=root.BTLPlayerNames?.generate;
  const rating=root.BTLWorldCareer?.youthRating?.(id)??(48+hash(id)%15);
  return {id,name:gen?gen(id,code,slot):'Jogador '+code+' '+slot,nationalCode:code,countryCode:'',club:'Elenco da seleção '+code,position:positions[(slot-1)%positions.length],rating,potential:root.BTLWorldCareer?.youthPotential?.(id,rating)??Math.min(85,rating+10),birthYear:year-(16+hash(id+'age')%4),lastAgedYear:year,generated:true,rosterPlaceholder:true,generationYear:year,source:'PERSONAGEM FICTÍCIO',retired:false};
}
function deterministicGoals(a,b,year,salt){
  const ra=Number(a?.rating||a?.strength||75),rb=Number(b?.rating||b?.strength||75);
  const poisson=(lambda,u)=>{let probability=Math.exp(-lambda),acc=probability,k=0;while(u>acc&&k<8){k++;probability*=lambda/k;acc+=probability;}return k;};
  const left=poisson(clampLocal(1.25+(ra-rb)*.026,.35,3.6),seeded(year+'|'+salt+'|'+a.code+'|'+b.code+'|1'));
  const right=poisson(clampLocal(1.25+(rb-ra)*.026,.35,3.6),seeded(year+'|'+salt+'|'+a.code+'|'+b.code+'|2'));
  return [left,right];
}
const api={version:VERSION,eligibleYear,select26,nationalFiller,deterministicGoals,hash,key};
root.BTLv111=api;
if(typeof ensureWorldPlayers!=='function'||typeof state==='undefined')return;
function countryCodeOf(text){
  const raw=typeof text==='object'?(text?.code||text?.countryCode||text?.name):text;
  return (typeof countryByCode==='function'&&countryByCode(raw)?.code)||(typeof codeForCountryName==='function'&&codeForCountryName(raw))||'';
}
function listWorldCupCodes(wc){
  return [...new Set((wc.groups||[]).flatMap(group=>Array.isArray(group)?group.map(countryCodeOf):(group?.teams||[]).map(countryCodeOf)).filter(Boolean))];
}
function ensureSquads(s=state.season,wc=s?.worldCup){
  if(!wc||!Array.isArray(wc.groups)||wc.groups.length!==12)return null;
  const year=Number(wc.year||s.year||START);
  if(wc.squadsV111?.year===year&&Object.keys(wc.squadsV111.rosters||{}).length===48)return wc.squadsV111;
  if(state.worldDbKey&&!worldStoreReady)return null;
  const world=ensureWorldPlayers();
  const codes=listWorldCupCodes(wc);
  if(codes.length!==48)return null;
  const used=new Set(world.map(p=>String(p.id))),rosters={};
  let changed=false;
  for(const code of codes){
    let pool=world.filter(w=>w.nationalCode===code&&eligibleYear(w,year));
    let chosen=select26(pool,code,year,(state.player?.calledUp?state.player:null));
    for(let slot=1;!chosen&&slot<=80;slot++){
      const fill=nationalFiller(code,year,slot);
      if(used.has(fill.id))continue;
      used.add(fill.id);world.push(fill);pool.push(fill);changed=true;
      chosen=select26(pool,code,year,(state.player?.calledUp?state.player:null));
    }
    if(!chosen||chosen.length!==26||chosen.some(p=>p.nationalCode!==code))throw Error('Convocação inconsistente: '+code);
    const ids=chosen.map(x=>x.id);
    if(new Set(ids).size!==26)throw Error('IDs de convocados duplicados: '+code);
    rosters[code]=ids;
  }
  wc.squadsV111={year,rosters,frozen:true,origin:'nacionalidade + classificação por GER; 3 goleiros mínimos'};
  if(changed)worldDirty=true;
  save();
  return wc.squadsV111;
}
const wcOriginal=ensureWorldCupState;
ensureWorldCupState=function(s=state.season,p=state.player){
  const wc=wcOriginal(s,p);
  if(wc)ensureSquads(s,wc);
  return wc;
};
const candidateOriginal=leaderboardCandidates;
leaderboardCandidates=function(title){
  if(!wcTitle(title))return candidateOriginal(title);
  const s=state.season,wc=s?.worldCup||ensureWorldCupState(s,state.player);
  if(!wc)return [];
  const selected=ensureSquads(s,wc);
  if(!selected)return [];
  const world=ensureWorldPlayers(),byId=new Map(world.map(p=>[String(p.id),p]));
  const result=[];
  for(const [code,ids] of Object.entries(selected.rosters)){
    const name=countryByCode(code)?.name||code;
    for(const id of ids){
      if(String(id).startsWith('career-user:'))continue; // protagonista entra pela estatística real do jogo
      const p=byId.get(String(id));
      if(!p||p.nationalCode!==code)continue;
      result.push({...p,leaderboardTeamCode:code,leaderboardTeamName:name});
    }
  }
  return result;
};
function cupOtherFixtures(title){
  const s=state.season;if(!s)return [];
  if(title!==s.cup?.name&&title!==s.leagueCup?.name)return [];
  const userRecords=(s.matchRegistry||[]).filter(m=>m.competition===title&&m.home&&m.away);
  const rounds=Math.min(12,userRecords.length);
  if(!rounds)return [];
  const saved=s.leaderboardRivalFixturesV111=s.leaderboardRivalFixturesV111||{};
  const cache=saved[title]||(saved[title]={year:s.year,rounds:[],survivors:null});
  if(cache.year!==s.year){saved[title]={year:s.year,rounds:[],survivors:null};}
  const series=saved[title];
  if(!series.survivors)series.survivors=leaderboardParticipantClubs(title).filter(Boolean);
  for(let r=series.rounds.length;r<rounds;r++){
    const actual=userRecords[r],userClubs=new Set([key(actual.home),key(actual.away)]);
    const roundTeams=series.survivors.filter(team=>!userClubs.has(key(team)));
    const ordered=roundTeams.sort((a,b)=>hash(s.year+'|'+title+'|'+r+'|'+a)-hash(s.year+'|'+title+'|'+r+'|'+b));
    const results=[],winners=[];
    for(let i=0;i<ordered.length;i+=2){
      if(!ordered[i+1]){winners.push(ordered[i]);continue;}
      const a=ordered[i],b=ordered[i+1],aCode=canonicalClubCountryCode(a,'')||s.countryAtStart,bCode=canonicalClubCountryCode(b,'')||s.countryAtStart;
      const [ga,gb]=deterministicGoals({code:key(a),rating:clubStrength(a,aCode)},{code:key(b),rating:clubStrength(b,bCode)},s.year,title+'|'+r);
      const actualStage=actual?.stage||'Rodada '+(r+1);
      results.push({id:'v111:cup:'+s.year+':'+key(title)+':'+r+':'+i,competition:title,stage:actualStage,home:a,away:b,homeGoals:ga,awayGoals:gb,type:'cup',source:'BTL simulação de outras equipes'});
      const winner=ga===gb?(hash(a+'|'+b+'|'+s.year+'|'+r)%2?a:b):ga>gb?a:b;
      winners.push(winner);
    }
    const actualWinner=Number(actual.homeGoals)>Number(actual.awayGoals)?actual.home:Number(actual.awayGoals)>Number(actual.homeGoals)?actual.away:(s.cup?.won||s.leagueCup?.won?state.player.club:actual.home);
    series.rounds.push(results);
    series.survivors=[...winners,actualWinner];
  }
  return series.rounds.flat();
}
const otherKnockoutOriginal=simulateNeutralWorldCupKnockout;
simulateNeutralWorldCupKnockout=function(a,b){
  const result=otherKnockoutOriginal(a,b),wc=state.season?.worldCup;
  if(wc&&wc.started&&a?.code&&b?.code){
    const stage=wc.stage==='third-place'?'Disputa de 3º lugar':(wc.knockoutStages?.[wc.knockoutIndex]||'Mata-mata');
    const id='v111:wc:'+wc.year+':'+key(stage)+':'+a.code+':'+b.code;
    const match={id,competition:'FIFA World Cup',stage,home:a.code,away:b.code,homeGoals:result.ga,awayGoals:result.gb,type:'national',source:'BTL simulação de outras equipes'};
    const list=wc.knockoutRivalFixturesV111=wc.knockoutRivalFixturesV111||[];
    if(!list.some(m=>m.id===id))list.push(match);
  }
  return result;
};
simulateNeutralWorldCupMatch=function(a,b){
  const year=Number(state.season?.worldCup?.year||state.season?.year||START);
  const [ga,gb]=deterministicGoals({code:a.code,rating:nationalTeamStrength(a.code,a.name)},{code:b.code,rating:nationalTeamStrength(b.code,b.name)},year,'wc-group');
  return {a:a.code,b:b.code,ga,gb};
};
function otherWorldCupFixtures(){
  const s=state.season,wc=s?.worldCup;if(!wc||!wc.started)return [];
  const fixtures=[];
  const userCode=state.player?.nationalityCode;
  if(Array.isArray(wc.groupTables)&&wc.groupTables.length===12){
    for(const table of wc.groupTables){
      for(const m of table.matches||[]){
        if(!m.a||!m.b||m.a===userCode||m.b===userCode)continue;
        fixtures.push({id:'v111:wc-group:'+wc.year+':'+m.a+':'+m.b,competition:'FIFA World Cup',stage:'Fase de grupos',home:m.a,away:m.b,homeGoals:m.ga,awayGoals:m.gb,type:'national',source:'BTL simulação de outras equipes'});
      }
    }
  }else{
    const matchesPerTeam=Math.min(3,Number(wc.groupIndex)||0);
    const schedule=[[0,3,1,2],[0,2,3,1],[0,1,2,3]];
    for(const group of wc.groups||[]){
      if(!Array.isArray(group)||group.length!==4)continue;
      for(let round=0;round<matchesPerTeam;round++){
        const pattern=schedule[round];
        for(const [a,b] of [[pattern[0],pattern[1]],[pattern[2],pattern[3]]]){
          const home=group[a],away=group[b];
          if(!home?.code||!away?.code||home.code===userCode||away.code===userCode)continue;
          const res=simulateNeutralWorldCupMatch(home,away);
          fixtures.push({id:'v111:wc-pre:'+wc.year+':'+round+':'+home.code+':'+away.code,competition:'FIFA World Cup',stage:'Fase de grupos',home:home.code,away:away.code,homeGoals:res.ga,awayGoals:res.gb,type:'national',source:'BTL simulação de outras equipes'});
        }
      }
    }
  }
  fixtures.push(...(wc.knockoutRivalFixturesV111||[]));
  return fixtures;
}
const recordedOriginal=recordedLeaderboardStatistics;
recordedLeaderboardStatistics=function(title,players){
  const s=state.season;
  if(!s)return recordedOriginal(title,players);
  const extra=wcTitle(title)?otherWorldCupFixtures():cupOtherFixtures(title);
  if(!extra.length)return recordedOriginal(title,players);
  const original=s.matchRegistry;
  const existing=new Set((original||[]).map(m=>m.id));
  s.matchRegistry=[...(original||[]),...extra.filter(m=>!existing.has(m.id))];
  try{return recordedOriginal(title,players);}
  finally{s.matchRegistry=original;}
};
function eligibleRival(w,year){return eligibleYear(w,year)&&!w.rosterPlaceholder&&w.club&&Number(w.rating||0)>=80;}
const rivalRecordsOriginal=ensureSeasonRivalRecords;
ensureSeasonRivalRecords=function(s=state.season){
  if(!s)return [];
  const year=Number(s.year)||START;
  const world=ensureWorldPlayers();
  const active=world.filter(w=>eligibleRival(w,year));
  const byName=new Map(active.map(w=>[key(w.name),w]));
  const isRealActive=r=>byName.has(key(r.name));
  if(s.rivalSeasonYear===year&&Array.isArray(s.rivalSeasonRecords)){
    const clean=s.rivalSeasonRecords.filter(isRealActive);
    if(clean.length===s.rivalSeasonRecords.length)return clean;
    s.rivalSeasonRecords=clean;return clean;
  }
  const roleValue=pos=>/^(ATA|ST|CF|CA|PD|PE|RW|LW|SA)$/i.test(pos)?1:/^(MEI|CAM|MC|CM)$/i.test(pos)?.6:.35;
  const elites=active.filter(w=>Number(w.rating||0)>=83).sort((a,b)=>Number(b.rating||0)-Number(a.rating||0)).slice(0,75);
  const templates=new Map(WORLD_AWARD_RIVALS.map(r=>[key(r.name),r]));
  const built=[];
  for(const athlete of elites){
    const template=templates.get(key(athlete.name));
    const rating=Number(athlete.rating)||80;
    const countryCode=athlete.countryCode||template?.countryCode||'';
    if(!countryCode)continue;
    const power=Number(clubStrength(athlete.club,countryCode))||rating;
    const baseGoals=template?.goalBase||Math.round((8+(rating-78)*1.3)*roleValue(athlete.position));
    const baseAssist=template?.assistBase||Math.round((5+(rating-75)*.65)*(/MEI|MC|PD|PE/.test(athlete.position)?1:.65));
    const r={name:athlete.name,club:athlete.club,countryCode,nationalCode:athlete.nationalCode,rating,teamPower:power,goalBase:clampLocal(baseGoals,4,37),assistBase:clampLocal(baseAssist,2,19)};
    const result=simulateRivalSeason(r);result.seasonYear=year;result.rating=rating;result.nationalCode=athlete.nationalCode||result.nationalCode;
    built.push(result);
  }
  s.rivalSeasonRecords=built;
  s.rivalSeasonYear=year;
  return built;
};
function eligibleCountries(){
  const leagues=(typeof COMPETITION_RULES==='object'?COMPETITION_RULES:{});
  const pool=(typeof LEAGUE_CLUB_POOLS==='object'?LEAGUE_CLUB_POOLS:{});
  return new Set(Object.keys(leagues).filter(code=>(pool[code]||[]).length>=3));
}
function renderPositionPitch(){
  const select=document.querySelector('#position');
  if(!select||document.querySelector('#btl-position-pitch'))return;
  const label=select.closest('label');if(!label)return;
  label.classList.add('btl-position-native-label');
  const field=document.createElement('fieldset');field.className='btl-position-pitch-field';field.id='btl-position-pitch';
  field.innerHTML='<legend>Posição em campo</legend><div class="btl-pitch" role="group" aria-label="Escolha a posição no campo"><div class="btl-pitch-midline"></div><div class="btl-pitch-circle"></div><div class="btl-pitch-topbox"></div><div class="btl-pitch-bottombox"></div><div class="btl-pitch-centerline"></div></div><p class="btl-pitch-caption">Toque em uma posição para selecioná-la.</p>';
  label.insertAdjacentElement('afterend',field);
  const layout={
    'Centroavante':[50,9],'Ponta esquerda':[14,17],'Ponta direita':[86,17],'Segundo atacante':[65,25],
    'Meia ofensivo':[43,35],'Meia esquerda':[14,43],'Meia direita':[86,43],'Meia central':[48,50],
    'Volante':[51,64],'Lateral esquerdo':[15,75],'Lateral direito':[85,75],'Zagueiro':[50,80],'Goleiro':[50,94]
  };
  const pitch=field.querySelector('.btl-pitch');
  for(const [pos,[x,y]] of Object.entries(layout)){
    if(![...select.options].some(o=>o.value===pos))continue;
    const button=document.createElement('button');button.type='button';button.className='btl-pitch-position';
    button.textContent=typeof POSITION_MENU_UI==='object'?POSITION_MENU_UI[pos]?.code||pos:pos;
    button.style.left=x+'%';button.style.top=y+'%';button.dataset.positionName=pos;
    button.setAttribute('aria-label',pos);button.setAttribute('aria-pressed',String(select.value===pos));
    button.title=pos;
    button.addEventListener('click',()=>{
      select.value=pos;select.dispatchEvent(new Event('change',{bubbles:true}));
      [...pitch.querySelectorAll('button')].forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      field.querySelector('.btl-pitch-caption').textContent='Posição selecionada: '+pos;
    });
    pitch.appendChild(button);
  }
  select.addEventListener('change',()=>[...pitch.querySelectorAll('button')].forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.positionName===select.value))));
  if(!select.value)select.value=''; // o formulário continua obrigatório
}
function filterCountries(){
  const select=document.querySelector('#nationality');if(!select)return;
  const codes=eligibleCountries();
  for(const opt of [...select.options])if(opt.value&&!codes.has(opt.value))opt.remove();
  if(select.value&&!codes.has(select.value)){select.value='';select.dispatchEvent(new Event('change',{bubbles:true}));}
}
if(typeof document!=='undefined'){
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{filterCountries();renderPositionPitch();},{once:true});
  }else{filterCountries();renderPositionPitch();}
}
})(typeof window!=="undefined"?window:globalThis);
