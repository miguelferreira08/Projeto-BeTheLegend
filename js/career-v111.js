(function installBTLV111(){
  'use strict';
  if(typeof window==='undefined'||window.BTLV111Installed)return;
  window.BTLV111Installed=true;
  const CURRENT_YEAR=()=>Number(state.season?.year)||2026;
  const normalize=v=>normalizeKey(String(v||''));
  const hash=v=>stableHash('btl-v111:'+String(v))>>>0;
  const roleFor=pos=>{
    const v=String(pos||'').toUpperCase();
    if(/GOL|GK|GOLEIRO|POR/.test(v))return 'gk';
    if(/ZAG|ZC|DEF|CB|LD|LE|LB|RB|LATERAL/.test(v))return 'def';
    if(/VOL|MEI|MC|ME|MD|CDM|CM|AM|MID|MEIA/.test(v))return 'mid';
    return 'att';
  };
  const pickNumber=(key,low,high)=>low+(hash(key)%(high-low+1));
  function generatedNationalPlayer(code,slot,year,role){
    const country=countryByCode(code)?.name||code;
    const id=`national-squad:${code}:${year}:${slot}`;
    const positionPool={gk:['GOL'],def:['ZAG','LD','LE','ZAG'],mid:['VOL','MC','MEI','MC'],att:['PD','PE','ATA','SA']};
    const position=positionPool[role][slot%positionPool[role].length];
    const rating=window.BTLWorldCareer?.youthRating(id)??pickNumber(id,48,62);
    const potential=window.BTLWorldCareer?.youthPotential(id,rating)??rating+10;
    const age=pickNumber(id+':age',16,19);
    const name=window.BTLPlayerNames?.generate(id,code,slot)||`Jovem ${code} ${slot}`;
    return {id,name,club:`Seleção ${country}`,countryCode:'',nationalCode:code,
      position,rating,potential,birthYear:year-age,lastAgedYear:year,
      retired:false,generated:true,generationYear:year,rosterPlaceholder:true,
      estimatedSimulationRating:true,source:'ATLETA FICTÍCIO DE SELEÇÃO'};
  }
  function chooseSquad(world,code,year,player=null){
    // Cidadania, não país do clube. Todos são ativos e únicos.
    const citizens=world.filter(w=>w&&!w.retired&&w.nationalCode===code&&w.id&&w.id!=='career-player');
    const unique=[...new Map(citizens.map(w=>[String(w.id),w])).values()];
    unique.sort((a,b)=>(Number(b.rating)||0)-(Number(a.rating)||0)||String(a.id).localeCompare(String(b.id)));
    const includeUser=player?.calledUp&&player.nationalityCode===code;
    const capacity=includeUser?25:26,selected=[],seen=new Set(),created=[];
    const quotas={gk:3,def:8,mid:8,att:7};
    const required=includeUser?{...quotas,[roleFor(player.position)]:quotas[roleFor(player.position)]-1}:quotas;
    for(const role of ['gk','def','mid','att']){
      const candidates=unique.filter(w=>roleFor(w.position)===role);
      for(const candidate of candidates){
        if(selected.filter(w=>roleFor(w.position)===role).length>=required[role])break;
        if(!seen.has(String(candidate.id))){selected.push(candidate);seen.add(String(candidate.id));}
      }
      let slot=1;
      while(selected.filter(w=>roleFor(w.position)===role).length<required[role]){
        const fresh=generatedNationalPlayer(code,slot,year,role);
        slot++;
        if(world.some(w=>String(w.id)===fresh.id)||seen.has(fresh.id))continue;
        world.push(fresh);created.push(fresh);selected.push(fresh);seen.add(fresh.id);
      }
    }
    // Enforce exactly 26 unique IDs, allowing the created player to occupy a place.
    if(selected.length>capacity)selected.length=capacity;
    for(const w of unique){if(selected.length>=capacity)break;if(!seen.has(String(w.id))){selected.push(w);seen.add(String(w.id));}}
    let slot=50;
    while(selected.length<capacity){const fresh=generatedNationalPlayer(code,slot++,year,'mid');if(seen.has(fresh.id)||world.some(w=>String(w.id)===fresh.id))continue;world.push(fresh);created.push(fresh);selected.push(fresh);seen.add(fresh.id);}
    const ids=selected.map(w=>String(w.id));if(includeUser)ids.push('career-player');
    return {ids,created};
  }
  function squadCodes(wc){
    return [...new Set((wc?.groups||[]).flatMap(group=>(Array.isArray(group)?group:group.teams||[]).map(c=>c.code||c.countryCode||'')).filter(Boolean))];
  }
  function ensureSquads(wc=state.season?.worldCup){
    if(!wc||!squadCodes(wc).length)return null;
    if(state.worldDbKey&&!worldStoreReady)return null;
    const codes=squadCodes(wc),year=Number(wc.year)||CURRENT_YEAR();
    const registry=wc.btlSquadsV111;
    if(registry&&registry.year===year&&codes.every(code=>Array.isArray(registry.teams?.[code])&&registry.teams[code].length===26)){
      // A convocação pode incluir o protagonista até a cerimônia de abertura,
      // mas não muda depois do primeiro jogo.
      const userCode=state.player?.nationalityCode,team=registry.teams?.[userCode];
      if(!wc.started&&state.player?.calledUp&&team&&!team.includes('career-player')){
        team.splice(25,1,'career-player');save();
      }
      return registry;
    }
    const world=ensureWorldPlayers(),teams={},created=[];
    for(const code of codes){
      const result=chooseSquad(world,code,year,state.player);
      teams[code]=result.ids;created.push(...result.created);
    }
    wc.btlSquadsV111={version:111,year,teams,lockedAt:'pré-torneio',backfilled:!!wc.started};
    if(created.length)worldDirty=true;
    save();
    return wc.btlSquadsV111;
  }
  const origCandidates=leaderboardCandidates;
  leaderboardCandidates=function(title){
    if(!/World Cup|Copa do Mundo/i.test(title))return origCandidates(title);
    const s=state.season,wc=s?.worldCup,p=state.player;if(!wc||!p)return [];
    const registry=ensureSquads(wc);if(!registry)return [];
    const byId=new Map(ensureWorldPlayers().map(w=>[String(w.id),w]));
    const players=[];
    for(const [code,ids] of Object.entries(registry.teams)){
      for(const id of ids){
        if(id==='career-player')continue;
        const wp=byId.get(id);
        if(wp&&!wp.retired&&wp.nationalCode===code){
          players.push({...wp,leaderboardTeamName:countryByCode(code)?.name||code,
            leaderboardTeamCode:code,rosterPlaceholder:false});
        }
      }
    }
    return players;
  };
  const poisson=(expected,key)=>{
    const lambda=Math.max(.05,Math.min(4,Number(expected)||1));
    const u=(hash(key)%1000000)/1000000;
    let p=Math.exp(-lambda),cdf=p;
    for(let k=0;k<7;k++){if(u<=cdf)return k;p*=lambda/(k+1);cdf+=p;}
    return 7;
  };
  function neutralGoals(home,away,seed){
    const a=typeof home==='string'?home:home.code,b=typeof away==='string'?away:away.code;
    const ra=nationalTeamStrength(a),rb=nationalTeamStrength(b);
    const model=matchModel(ra,rb,0);
    return {homeGoals:poisson(model.homeXg,seed+':h'),awayGoals:poisson(model.awayXg,seed+':a')};
  }
  const origNeutralGroup=simulateNeutralWorldCupMatch;
  simulateNeutralWorldCupMatch=function(a,b){
    const result=neutralGoals(a,b,`wc:${CURRENT_YEAR()}:${a.code}:${b.code}`);
    return {a:a.code,b:b.code,ga:result.homeGoals,gb:result.awayGoals};
  };
  const origNeutralKnockout=simulateOtherWorldCupKnockoutMatches;
  simulateOtherWorldCupKnockoutMatches=function(teams){
    const pool=shuffle(teams||[]),winners=[],losers=[];
    const wc=state.season?.worldCup;
    if(wc&&!Array.isArray(wc.btlNeutralKnockoutMatches))wc.btlNeutralKnockoutMatches=[];
    for(let i=0;i+1<pool.length;i+=2){
      const a=pool[i],b=pool[i+1],r=simulateNeutralWorldCupKnockout(a,b);
      winners.push(r.winner);losers.push(r.loser);
      if(wc)wc.btlNeutralKnockoutMatches.push({
        id:`wc-knockout:${wc.year}:${wc.btlNeutralKnockoutMatches.length}:${a.code}:${b.code}`,
        competition:'FIFA World Cup',type:'national',stage:'Mata-mata',source:'BTL simulação de outras equipes',
        home:a.code,away:b.code,homeGoals:r.ga,awayGoals:r.gb
      });
    }
    return {winners,losers};
  };
  function neutralWorldCupFixtures(title){
    const wc=state.season?.worldCup,p=state.player;
    if(!wc?.started||!wc.groups?.length)return [];
    ensureSquads(wc);
    const userCode=p?.nationalityCode,year=wc.year||CURRENT_YEAR();
    const rounds=wc.stage==='group'?Math.min(3,Math.max(0,Number(wc.groupIndex)||0)):3;
    const schedules=[[[0,1],[2,3]],[[0,2],[1,3]],[[0,3],[1,2]]];
    const rows=[];
    for(let g=0;g<wc.groups.length;g++){
      const group=wc.groups[g];
      for(let round=0;round<rounds;round++){
        for(const [x,y] of schedules[round]){
          const a=group[x],b=group[y];if(!a||!b||a.code===userCode||b.code===userCode)continue;
          const scores=neutralGoals(a,b,`wc:${year}:${a.code}:${b.code}`);
          rows.push({id:`wc-group:${year}:${g}:${round}:${a.code}:${b.code}`,home:a.code,away:b.code,
            homeGoals:scores.homeGoals,awayGoals:scores.awayGoals,type:'national',
            stage:'Grupos',competition:title,source:'BTL simulação de outras equipes'});
        }
      }
    }
    for(const m of wc.btlNeutralKnockoutMatches||[])rows.push({...m,competition:title});
    return rows;
  }
  function domesticCupFixtures(title){
    const s=state.season;if(!s)return [];
    const isCup=title===s.cup?.name||title===s.leagueCup?.name||
      (s.superCups||[]).some(sc=>sc.scope==='domestic'&&sc.name===title);
    if(!isCup)return [];
    const registered=(s.matchRegistry||[]).filter(m=>m.competition===title);
    const played=Math.min(7,registered.filter(m=>m.home&&m.away).length);
    if(!played)return [];
    const clubs=[...new Set(leaderboardParticipantClubs(title))].filter(Boolean);
    const user=normalize(s.clubAtStart||state.player?.club),without=clubs.filter(c=>normalize(c)!==user).sort((a,b)=>a.localeCompare(b));
    const rows=[];
    for(let round=0;round<played;round++){
      const shuffled=without.map(c=>({club:c,seed:hash(`${s.year}:${title}:${round}:${c}`)}))
        .sort((a,b)=>a.seed-b.seed||a.club.localeCompare(b.club)).map(x=>x.club);
      for(let i=0;i+1<shuffled.length;i+=2){
        const home=shuffled[i],away=shuffled[i+1];
        const homeStrength=clubStrength(home,canonicalClubCountryCode(home,''));
        const awayStrength=clubStrength(away,canonicalClubCountryCode(away,''));
        const model=matchModel(homeStrength,awayStrength,0),seed=`cup:${s.year}:${title}:${round}:${home}:${away}`;
        rows.push({id:seed,competition:title,type:'cup',stage:`Rodada simulada ${round+1}`,
          source:'BTL simulação de outras equipes',home,away,
          homeGoals:poisson(model.homeXg,seed+':h'),awayGoals:poisson(model.awayXg,seed+':a')});
      }
    }
    return rows;
  }
  const origStats=recordedLeaderboardStatistics;
  recordedLeaderboardStatistics=function(title,players){
    const s=state.season;if(!s)return origStats(title,players);
    if(title===s.league?.name&&s.league?.matchLedger?.version!==1&&typeof ensureSeasonLeagueLedger==='function')ensureSeasonLeagueLedger(s);
    const supplementary=/World Cup|Copa do Mundo/i.test(title)?neutralWorldCupFixtures(title):domesticCupFixtures(title);
    if(!supplementary.length)return origStats(title,players);
    const original=s.matchRegistry;
    try{
      s.matchRegistry=[...(Array.isArray(original)?original:[]),...supplementary];
      return origStats(title,players);
    }finally{s.matchRegistry=original;}
  };
  // Award races must use the currently active world, not historical star templates.
  const origRivals=ensureSeasonRivalRecords;
  ensureSeasonRivalRecords=function(season=state.season){
    const result=origRivals(season);if(!season)return result;
    const year=Number(season.year)||2026,world=ensureWorldPlayers();
    const athletes=new Map(world.filter(w=>w?.name).map(w=>[normalize(w.name),w]));
    const filtered=result.filter(row=>{
      const athlete=athletes.get(normalize(row.name));
      if(!athlete||athlete.retired)return false;
      const birth=Number(athlete.birthYear)||Number(CURRENT_PLAYER_BIRTH_YEARS[row.name])||0;
      const retirement=window.BTLWorldCareer?.retirementAge(athlete)??38;
      if(year>2026&&birth&&year-birth>=retirement)return false;
      return true;
    }).map(row=>{
      const athlete=athletes.get(normalize(row.name));
      const rating=Math.min(Number(row.rating)||80,Number(athlete.rating)||80);
      const decline=Math.max(0,(Number(row.rating)||rating)-rating);
      return {...row,rating,club:athlete.club,countryCode:athlete.countryCode,
        goals:Math.max(0,Math.round((row.goals||0)*Math.max(.38,1-decline*.035))),
        allGoals:Math.max(0,Math.round((row.allGoals||0)*Math.max(.38,1-decline*.035)))};
    });
    season.rivalSeasonRecords=filtered;
    return filtered;
  };
  // Only creation countries with a real playable domestic pool.
  const countrySelect=document.getElementById('nationality');
  if(countrySelect){
    const playable=Array.from(countrySelect.options).filter(o=>!o.value||((LEAGUE_CLUB_POOLS[o.value]||[]).length>=4||(LOCAL_CLUBS[o.value]||[]).length>=4));
    const valid=new Set(playable.map(o=>o.value));
    Array.from(countrySelect.options).forEach(o=>{if(o.value&&!valid.has(o.value))o.remove();});
    if(countrySelect.value&&!valid.has(countrySelect.value))countrySelect.value='';
  }
  // Pitch-based selection, while retaining #position for compatibility with career creation.
  const positionSelect=document.getElementById('position');
  if(positionSelect&&!document.getElementById('btl-position-pitch')){
    const container=positionSelect.closest('label');
    if(container){
      container.classList.add('btl-position-picker');
      const positionPoints={
        'Goleiro':[50,91],'Zagueiro':[50,73],
        'Lateral direito':[80,72],'Lateral esquerdo':[20,72],
        'Volante':[50,62],'Meia central':[50,51],
        'Meia ofensivo':[50,38],'Meia direita':[80,50],'Meia esquerda':[20,50],
        'Segundo atacante':[50,25],'Ponta direita':[80,26],
        'Ponta esquerda':[20,26],'Centroavante':[50,11]
      };
      if(!Array.from(positionSelect.options).some(o=>o.value==='')){
        const opt=document.createElement('option');opt.value='';opt.textContent='Selecione uma posição';positionSelect.insertBefore(opt,positionSelect.firstChild);
      }
      positionSelect.value='';
      positionSelect.required=false;
      positionSelect.setAttribute('aria-hidden','true');positionSelect.tabIndex=-1;
      const pitch=document.createElement('div');pitch.id='btl-position-pitch';pitch.className='btl-position-pitch';pitch.setAttribute('role','group');pitch.setAttribute('aria-label','Selecione sua posição no campo');
      pitch.innerHTML='<div class="btl-pitch-lines" aria-hidden="true"><i class="btl-field-mid"></i><i class="btl-field-circle"></i><i class="btl-field-penalty-top"></i><i class="btl-field-penalty-bottom"></i><i class="btl-field-goal-top"></i><i class="btl-field-goal-bottom"></i></div>';
      const legend=document.createElement('output');legend.id='btl-position-selected';legend.className='btl-position-selected';legend.textContent='Escolha uma posição no campo';
      Object.entries(positionPoints).forEach(([name,coords])=>{
        const button=document.createElement('button');button.type='button';button.className='btl-pitch-position';
        button.dataset.position=name;button.textContent=POSITION_MENU_UI[name]?.code||name;
        button.title=name;button.setAttribute('aria-label',name);button.setAttribute('aria-pressed','false');
        button.style.left=coords[0]+'%';button.style.top=coords[1]+'%';
        button.addEventListener('click',()=>{
          positionSelect.value=name;legend.textContent=`Posição escolhida: ${name}`;
          pitch.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
          positionSelect.dispatchEvent(new Event('change',{bubbles:true}));
        });
        pitch.appendChild(button);
      });
      positionSelect.after(pitch,legend);
      document.getElementById('player-form')?.addEventListener('submit',event=>{
        if(!positionSelect.value){event.preventDefault();event.stopImmediatePropagation();toast('Selecione uma posição diretamente no campo.');pitch.focus?.();}
      },true);
    }
  }
  document.title='Be The Legend';
  window.BTLV111Test={chooseSquad,ensureSquads,generatedNationalPlayer,
    neutralGoals,domesticCupFixtures,neutralWorldCupFixtures,roleFor};
})();
