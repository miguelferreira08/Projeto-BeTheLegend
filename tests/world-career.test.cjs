'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const world=require('../js/world-career.js');
const make=(id,year=1990,club='Clube A',position='MC')=>({id,name:'Atleta '+id,club,position,birthYear:year,rating:83,potential:90,lastAgedYear:2026});

test('distribuição de aposentadoria concentrada entre 36 e 40, média entre 36 e 40',()=>{
 const players=Array.from({length:30000},(_,i)=>make('tm:'+i));
 const ages=players.map(p=>world.retirementAge(p));
 assert(ages.every(a=>a>=36&&a<=40));
 const avg=ages.reduce((a,b)=>a+b,0)/ages.length;
 assert(avg>37.7&&avg<38.6,`média: ${avg}`);
});

test('envelhece e declina sem passar do mínimo e cria reposição de mesma posição e clube',()=>{
 const v=make('tm:1990',1987,'Equipe Verde','GOL');
 v.retirementTarget=40;
 const players=[v];
 const before=v.rating;
 const report=world.advance(players,2027);
 assert.equal(report.retirements.length,1);assert.equal(report.generated.length,1);
 assert.equal(players[0].retired,true);assert.equal(players[0].club,'');
 assert.equal(players[0].retiredAge,40);assert.equal(players[1].position,'GOL');
 assert.equal(players[1].club,'Equipe Verde');assert.equal(players[1].generated,true);
 assert.match(players[1].id,/^regen:2027:/);assert.equal(world.ageAt(players[1],2027)>=16,true);
 assert(players[0].rating<before);
});

test('processar duas vezes o mesmo ano não duplica jogadores gerados',()=>{
 const players=[{...make('a',1990),retirementTarget:36}];
 const a=world.advance(players,2027),n=players.length;
 const b=world.advance(players,2027);
 assert.equal(a.retirements.length,1);assert.equal(b.retirements.length,0);assert.equal(players.length,n);
});

test('avanço a longo prazo: IDs únicos, sem ressuscitar atletas e sem degradação de juvenis antes do auge',()=>{
 const players=Array.from({length:500},(_,i)=>({...make('player-'+i,1989+i%20,'Clube '+i%25,['GOL','ZAG','MC','ATA'][i%4]),retirementTarget:36+i%5}));
 for(let year=2027;year<=2044;year++){
  const result=world.advance(players,year);
  assert.equal(result.retirements.length,result.generated.length);
  assert.equal(new Set(players.map(x=>x.id)).size,players.length);
  assert(players.every(x=>!x.retired||!x.club));
  assert(players.every(x=>x.rating>=40&&x.rating<=99));
 }
 const youth=make('youth',2008);youth.rating=60;youth.potential=82;
 world.evolveRating(youth,2027);assert(youth.rating>=60);
});

test('importação Kaggle respeita IDs, ano de nascimento, nacionalidade e não inventa GER',()=>{
 const csv='player_id,name,current_club_id,current_club_name,date_of_birth,position,sub_position,country_of_citizenship,market_value_in_eur,last_season,current_club_domestic_competition_id\n'+
 '123,"José, Santos",19,Barcelona,1999-10-10,Attack,Left Winger,Brazil,40000000,2025,ES1\n'+
 '124,Pedro,23,Arsenal,2006-04-25,Defender,Right-Back,England,500000,2025,GB1\n'+
 '125,Old,12,Olympique,1943-01-01,Attack,,France,100,1999,FR1\n';
 const rows=world.parseCSV(csv);
 assert.equal(rows[0].name,'José, Santos');
 const res=world.mapTransfermarkt(rows);
 assert.equal(res.players.length,2);assert.equal(res.omitted,1);
 assert.equal(res.players[0].id,'tm:123');assert.equal(res.players[0].birthYear,1999);
 assert.equal(res.players[0].countryCode,'ES');assert.equal(res.players[0].nationalCode,'BR');
 assert.equal(res.players[0].position,'PE');assert.equal(res.players[0].estimatedSimulationRating,true);
 assert.equal(res.players[1].countryCode,'ENG');assert.equal(res.players[1].position,'LD');
});

test('50 mil jogadores, evolução em massa e reposições com custo controlado',()=>{
 const roster=Array.from({length:50000},(_,i)=>({...make('tm:'+i,1980+i%30,'Clube '+i%800,['GOL','ZAG','MC','ATA'][i%4]),retirementTarget:36+i%5}));
 const t=Date.now();const report=world.advance(roster,2027);
 assert(report.retirements.length>0);assert.equal(report.retirements.length,report.generated.length);
 assert.equal(new Set(roster.map(p=>p.id)).size,roster.length);
 assert(Date.now()-t<15000,'Deve evoluir 50 mil jogadores em menos de 15 s');
});
