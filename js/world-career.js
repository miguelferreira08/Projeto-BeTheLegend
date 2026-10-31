/* Be The Legend — simulated-world lifecycle v1.
 * Pure and deterministic progression. The only verified biographical fields
 * come from the source CSV; no simulated rating is presented as Transfermarkt
 * or EA/FM ability data. Synthetic players are ALWAYS labeled as generated.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.BTLWorldCareer=api;
})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
  const START_YEAR=2026;
  const RETIREMENT_WEIGHTS=[12,19,28,25,16]; // mean 38.14 years, 36–40 inclusive
  const playerNames=(typeof globalThis!=='undefined'&&globalThis.BTLPlayerNames)||(typeof require==='function'?require('./player-name-generator.js'):null);
  const FIRST_NAMES=['Lucas','Gabriel','Mateo','Noah','Rafael','André','Daniel','Samuel','Nicolas','Thiago','Enzo','Hugo','Pedro','Yanis','Emir','Kenji','Luis','Diego','Adam','Omar','Victor','Leo','Marco','Arthur','Alex'];
  const LAST_NAMES=['Silva','Costa','Ferreira','Almeida','Moreira','Ramos','Santos','Lima','Pereira','Mendes','Torres','Oliveira','Fernández','Morales','Rodrigues','Martins','Souza','Dias','Carvalho','Gomes','Ribeiro','Nakamura','Alves','Sánchez'];
  const POSITION_GROUPS={Goalkeeper:'GOL',Defender:'ZAG',Midfield:'MC',Attack:'ATA',GOL:'GOL',GK:'GOL',CB:'ZAG',LB:'LE',RB:'LD',DM:'VOL',CDM:'VOL',CM:'MC',AM:'MEI',CAM:'MEI',LW:'PE',RW:'PD',ST:'ATA',CF:'ATA'};
  const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  function hash(s){let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
  function randomUnit(key){return hash(key)/4294967296}
  function clamp(n,min,max){return Math.max(min,Math.min(max,n))}
  function position(value,sub=''){
    const p=String(value||'').trim(),s=String(sub||'').trim();
    if(/goalkeeper|keeper|goleiro|torwart/i.test(p))return 'GOL';
    if(/right.*back|right.*defender|lateral direito/i.test(s))return 'LD';
    if(/left.*back|left.*defender|lateral esquerdo/i.test(s))return 'LE';
    if(/defensive midfield|holding|volante/i.test(s))return 'VOL';
    if(/attacking midfield|offensive midfield|meia ofensivo/i.test(s))return 'MEI';
    if(/right wing/i.test(s))return 'PD';
    if(/left wing/i.test(s))return 'PE';
    if(/centre.forward|center.forward|striker|second striker|forward/i.test(s))return 'ATA';
    return POSITION_GROUPS[p]||POSITION_GROUPS[p.toUpperCase()]||(/defen/i.test(p)?'ZAG':/midfield/i.test(p)?'MC':/attack/i.test(p)?'ATA':'MC');
  }
  function ageAt(player,year){
    const birth=Number(player.birthYear);
    return Number.isInteger(birth)&&birth>1900&&birth<=year?year-birth:null;
  }
  function retirementAge(player){
    if(Number.isInteger(player.retirementTarget)&&player.retirementTarget>=36&&player.retirementTarget<=40)return player.retirementTarget;
    const roll=hash('btl-retire-v1:'+String(player.id||player.name))%100;
    let running=0;
    for(let i=0;i<RETIREMENT_WEIGHTS.length;i++){
      running+=RETIREMENT_WEIGHTS[i];if(roll<running)return i+36;
    }
    return 40;
  }
  function retirementProbability(age){const a=Math.floor(age);return a<36?0:a===36?.12:a===37?19/88:a===38?28/69:a===39?25/41:1}
  function estimatedRating(value){const v=Number(value);return Number.isFinite(v)&&v>0?clamp(Math.round(65+13*Math.log10(v/1000000)),45,95):64}
  function yearlyDelta(player,nextAge,year){
    const keeper=player.position==='GOL';
    const peak=keeper?32:28;
    if(nextAge<=20)return 1+(hash(player.id+':growth:'+year)%3===0?1:0);
    if(nextAge<=24)return hash(player.id+':growth:'+year)%3===0?2:1;
    if(nextAge<=peak)return hash(player.id+':growth:'+year)%5===0?1:0;
    if(nextAge<=peak+2)return 0;
    const band=nextAge<=33?1:nextAge<=36?2:nextAge<=38?3:4;
    const amount=band+(hash(player.id+':decline:'+year)%3===0?1:0);
    return -amount;
  }
  function evolveRating(player,year){
    if(player.retired)return player;
    if(!Number.isInteger(player.birthYear))return player;
    let previous=Number(player.lastAgedYear);
    if(!Number.isInteger(previous)||previous<START_YEAR)previous=START_YEAR;
    const target=Math.max(previous,Math.floor(year));
    for(let y=previous+1;y<=target;y++){
      const age=ageAt(player,y);if(age===null)break;
      const current=Number(player.rating)||65;
      const delta=yearlyDelta(player,age,y);
      const potential=clamp(Number(player.potential)||clamp(current+9,60,94),45,99);
      player.rating=clamp(Math.min(potential,Math.round(current+Math.max(0,delta)))+Math.min(0,delta),40,99);
    }
    player.lastAgedYear=target;
    return player;
  }
  function createRegen(retired,year,serial,used){
    const identity=String(retired.id||normalize(retired.name));
    const club=retired.lastClub||retired.club||'';
    let id='regen:'+year+':'+hash(identity+'|'+club+'|'+serial).toString(36);
    let suffix=0;while(used.has(id))id='regen:'+year+':'+hash(identity+'|'+club+'|'+serial+'|'+(++suffix)).toString(36);
    used.add(id);
    const offset=hash(id),age=16+offset%4,base=clamp(Math.round(53+(Number(retired.rating)||68)*.16+(offset%13)),52,76);
    const ceiling=clamp(base+11+hash(id+':potential')%17,base+4,94);
    const nationality=retired.nationalCode||retired.countryCode||'';
    const name=playerNames?.generate(id,nationality,serial)||FIRST_NAMES[offset%FIRST_NAMES.length]+' '+LAST_NAMES[hash(id+':surname')%LAST_NAMES.length];
    return {id,name,club,countryCode:retired.countryCode||'',nationalCode:nationality,position:retired.position||'MC',birthYear:year-age,rating:base,potential:ceiling,retired:false,generated:true,generationYear:year,source:'GERADO PELO JOGO',lastAgedYear:year,retirementTarget:retirementAge({id}),number:null};
  }
  function advance(players,year,{seedYear=START_YEAR}={}){
    if(!Array.isArray(players))throw new TypeError('Lista de jogadores inválida');
    if(!Number.isInteger(year)||year<seedYear||year>2200)throw new RangeError('Temporada inválida');
    const ids=new Set(players.map(p=>String(p.id))),byId=new Map(players.map(p=>[p.id,p]));
    const changes={year,aged:0,retirements:[],generated:[],active:0};
    for(const p of players){
      if(p.retired)continue;
      if(!p.id)p.id='legacy:'+normalize(p.name)+'|'+normalize(p.club);
      if(!Number.isInteger(p.birthYear)){
        p.birthYear=seedYear-(21+hash(String(p.id))%14);
        p.birthEstimated=true;
      }
      const before=Number(p.lastAgedYear)||seedYear;
      evolveRating(p,year);
      changes.aged+=Math.max(0,year-before);
      const a=ageAt(p,year);
      // Ano inaugural protegido: nenhuma aposentadoria antes de a estreia ser concluída.
      if(year>seedYear&&a!==null&&a>=retirementAge(p)){
        p.retired=true;p.retiredAge=a;p.retiredYear=year;p.lastClub=p.club;
        p.club='';p.retirementTarget=retirementAge(p);
        changes.retirements.push({id:p.id,name:p.name,club:p.lastClub,age:a,year,position:p.position});
      }else changes.active++;
    }
    // One replacement for each departure. Names are fictitious; IDs are unique.
    changes.retirements.forEach((ret,i)=>{
      const original=byId.get(ret.id);
      if(!original?.lastClub)return;
      const replacement=createRegen(original,year,i,ids);
      players.push(replacement);changes.generated.push({id:replacement.id,name:replacement.name,club:replacement.club,age:ageAt(replacement,year),position:replacement.position});changes.active++;
    });
    return changes;
  }
  function summary(players){const a={total:players.length,active:0,retired:0,generated:0,clubs:0};const clubs=new Set();for(const p of players){if(p.retired)a.retired++;else{a.active++;if(p.club)clubs.add(normalize(p.club));}if(p.generated)a.generated++}a.clubs=clubs.size;return a}
  function parseCSV(str){
    const rows=[],row=[];let field='',quoted=false;
    const text=String(str||'').replace(/^\uFEFF/,'');
    for(let i=0;i<text.length;i++){
      const c=text[i];
      if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++}else quoted=!quoted}
      else if(!quoted&&(c===','||c==='\n'||c==='\r')){
        row.push(field);field='';
        if(c==='\r'&&text[i+1]==='\n')i++;
        if(c!==','){if(row.some(x=>x.trim()))rows.push(row.slice());row.length=0}
      }else field+=c;
    }
    if(quoted)throw Error('CSV com aspas não fechadas.');
    row.push(field);if(row.some(x=>x.trim()))rows.push(row);
    if(!rows.length)return [];
    const heads=rows.shift().map(x=>x.trim().replace(/^\uFEFF/,''));
    return rows.map(row=>Object.fromEntries(heads.map((key,i)=>[key,String(row[i]||'').trim()])));
  }
  const countryAliases={England:'ENG',Scotland:'SCO',Wales:'WAL','Northern Ireland':'NIR',Turkey:'TR',Türkiye:'TR',Germany:'DE',Brazil:'BR',Argentina:'AR',Spain:'ES',France:'FR',Portugal:'PT',Italy:'IT','United States':'US','United States of America':'US',Japan:'JP',Mexico:'MX',Netherlands:'NL',Belgium:'BE',Uruguay:'UY',Colombia:'CO',Switzerland:'CH',Denmark:'DK',Norway:'NO',Sweden:'SE',Croatia:'HR',Greece:'GR',Poland:'PL',Serbia:'RS',Austria:'AT',Chile:'CL',Ecuador:'EC',Paraguay:'PY',Nigeria:'NG',Morocco:'MA','Saudi Arabia':'SA',Qatar:'QA',Senegal:'SN','South Korea':'KR','Korea, South':'KR'};
  function countryCode(country){
    const s=String(country||'').trim();
    if(!s)return '';
    if(/^[A-Z]{2,3}$/.test(s))return s;
    return countryAliases[s]||'';
  }
  function parseBirth(raw){const m=/^(\d{4})-(\d\d)-(\d\d)/.exec(String(raw||''));const y=m?Number(m[1]):0;return y>=1950&&y<=2011?y:null}
  const leagueCountry={GB1:'ENG',GB2:'ENG',GB3:'ENG',GB4:'ENG',GB5:'ENG',ES1:'ES',ES2:'ES',L1:'DE',L2:'DE',IT1:'IT',IT2:'IT',FR1:'FR',FR2:'FR',PO1:'PT',PO2:'PT',NL1:'NL',NL2:'NL',BE1:'BE',SC1:'SCO',SC2:'SCO',TR1:'TR',TR2:'TR',BRA1:'BR',BRA2:'BR',AR1:'AR',US1:'US',MLS1:'US',C1:'CN',RU1:'RU',GR1:'GR',AU1:'AT',DK1:'DK',SE1:'SE',NO1:'NO',PL1:'PL',UKR1:'UA',MLS:'US'};
  function competitionCountry(code){return leagueCountry[String(code||'').toUpperCase()]||''}
  function mapTransfermarkt(rows,{year=2026,maxPlayers=120000,sourceDate='2026-07-06'}={}){
    if(!Array.isArray(rows)||!rows.length)throw Error('O CSV de jogadores está vazio.');
    if(!('player_id' in rows[0])||!('name' in rows[0])||!('current_club_id' in rows[0]))throw Error('CSV não corresponde ao players.csv do Kaggle/Transfermarkt: player_id, name e current_club_id obrigatórios.');
    if(rows.length>maxPlayers)throw Error('Número de linhas acima do limite de segurança.');
    const out=[],seen=new Set();let omitted=0;
    for(const r of rows){
      const id=String(r.player_id||'').trim(),name=String(r.name||'').trim().slice(0,100),club=String(r.current_club_name||'').trim().slice(0,100);
      const born=parseBirth(r.date_of_birth),a=born?year-born:null,lastSeason=Number(r.last_season);
      if(!/^\d+$/.test(id)||!name||!club||!String(r.current_club_id||'').trim()||String(r.current_club_id)==='0'||seen.has(id)||a!==null&&(a<15||a>43)||lastSeason&&lastSeason<year-2){omitted++;continue}
      const market=Number(r.market_value_in_eur)||0;
      const potential=clamp(estimatedRating(market)+7,55,97);
      out.push({id:'tm:'+id,externalId:id,name,club,clubId:String(r.current_club_id),countryCode:competitionCountry(r.current_club_domestic_competition_id),nationalCode:countryCode(r.country_of_citizenship),position:position(r.position,r.sub_position),birthYear:born||year-(20+hash(id)%13),birthEstimated:!born,rating:estimatedRating(market),potential,marketValueEUR:market||null,estimatedSimulationRating:true,source:'Transfermarkt via Kaggle',sourceAsOf:sourceDate,retired:false,lastAgedYear:year});seen.add(id);
    }
    return {players:out,omitted,source:'Transfermarkt via Kaggle',sourceDate};
  }
  function attachClubs(players,clubRows){
    if(!Array.isArray(clubRows)||!clubRows.length)return 0;
    const byId=new Map(clubRows.map(c=>[String(c.club_id||''),c]));let count=0;
    for(const p of players){const club=byId.get(String(p.clubId||''));if(!club)continue;
      p.club=String(club.name||p.club).trim();p.countryCode=countryCode(club.country_of_club||club.country||'')||competitionCountry(club.domestic_competition_id)||p.countryCode;count++;
    }return count;
  }
  function openStorage(){return new Promise((resolve,reject)=>{
    if(typeof indexedDB==='undefined')return reject(Error('IndexedDB indisponível neste navegador.'));
    const req=indexedDB.open('BTL_WORLD_CAREER_V1',1);
    req.onupgradeneeded=()=>req.result.createObjectStore('worlds');
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('Banco local indisponível'));
  })}
  async function persist(key,players,meta={}){
    const db=await openStorage();
    try{await new Promise((resolve,reject)=>{
      const tx=db.transaction('worlds','readwrite');tx.objectStore('worlds').put({players,meta,updatedAt:new Date().toISOString()},String(key));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('Falha ao gravar elenco'));tx.onabort=()=>reject(tx.error||Error('Gravação cancelada'));
    });return true}finally{db.close()}
  }
  async function restore(key){const db=await openStorage();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('worlds','readonly'),req=tx.objectStore('worlds').get(String(key));req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error)})}finally{db.close()}}
  return {START_YEAR,retirementAge,retirementProbability,ageAt,yearlyDelta,evolveRating,advance,summary,parseCSV,mapTransfermarkt,attachClubs,position,estimatedRating,countryCode,competitionCountry,persist,restore};
});
