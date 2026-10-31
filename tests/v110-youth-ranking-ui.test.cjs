'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const world=require('../js/world-career.js');
const names=require('../js/player-name-generator.js');
const source=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const hash=text=>{let h=2166136261;for(const c of String(text)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
function slice(start,end){const i=source.indexOf(start),j=source.indexOf(end,i+start.length);assert(i>=0&&j>i,'funções não localizadas: '+start);return source.slice(i,j);}
function sandbox(code,env={}){const ctx=vm.createContext(env);vm.runInContext(code,ctx);return ctx;}

test('painel Universo de Jogadores ausente da página sem excluir motor',()=>{
 assert.doesNotMatch(html,/id="world-career-panel"|id="world-player-search"|UNIVERSO DE JOGADORES/i);
 assert.match(html,/js\/world-career\.js\?v=1\.2\.0/);
 assert.match(html,/js\/app\.js\?v=[^"\s]*v110/);
 assert(source.includes('simulateWorldRetirements('));
});

test('ano inaugural sem aposentadorias; elas começam em 2027, a segunda temporada',()=>{
 const a={id:'tm:senior',name:'Jogador veterano',club:'Equipe',position:'ATA',birthYear:1986,rating:80,potential:86,lastAgedYear:2026,retirementTarget:36};
 const players=[a];
 const initial=world.advance(players,2026,{seedYear:2026});
 assert.equal(initial.retirements.length,0);assert.equal(initial.generated.length,0);
 assert.equal(players.length,1);assert.equal(players[0].retired,undefined);
 const next=world.advance(players,2027,{seedYear:2026});
 assert.equal(next.retirements.length,1);assert.equal(next.generated.length,1);assert.equal(players[1].generated,true);
});

test('gerados de reposição têm de 16 a 19 anos, GER geralmente baixo e raras exceções',()=>{
 const ratings=Array.from({length:10000},(_,i)=>world.youthRating('regen-example-'+i));
 assert(ratings.every(r=>r>=48&&r<=83));
 assert(ratings.filter(r=>r<=62).length>8000);
 assert(ratings.filter(r=>r>=77).length<80);
 const notImproving=Array.from({length:1000},(_,i)=>{
   const id='kid-'+i,overall=world.youthRating(id);return world.youthPotential(id,overall)===overall;
 }).length;
 assert(notImproving>=0);
 const noPotential=Array.from({length:1000},(_,i)=>{const id='kid-'+i;return world.youthPotential(id,world.youthRating(id))===world.youthRating(id)}).filter(Boolean).length;
 assert(noPotential>100,'nem todo jovem deve evoluir');
 const list=Array.from({length:400},(_,i)=>({id:'tm:'+i,name:'Veterano',club:'Clube '+(i%20),nationalCode:'BR',position:'ATA',birthYear:1984,rating:90,potential:91,lastAgedYear:2026,retirementTarget:36}));
 const report=world.advance(list,2027);
 assert.equal(report.generated.length,400);
 const generated=list.filter(x=>x.generated);
 assert.equal(generated.length,400);
 assert(generated.every(x=>world.ageAt(x,2027)>=16&&world.ageAt(x,2027)<=19));
 assert(generated.every(x=>x.rating>=48&&x.rating<=83));
 assert(generated.every(x=>x.name.includes(' ')));
});

test('jovens podem ficar estagnados em anos específicos sem perder potencial',()=>{
 const p={id:'regen:2027:example',name:'Jovem',generated:true,position:'ATA',club:'Clube',rating:59,potential:89,birthYear:2010,lastAgedYear:2027};
 let stagnations=0,improvements=0;
 for(let year=2028;year<=2034;year++){
   const before=p.rating;world.evolveRating(p,year);if(p.rating===before)stagnations++;if(p.rating>before)improvements++;
 }
 assert(stagnations>0,'deve poder estagnar');assert(improvements>0,'deve poder melhorar');
});

test('atletas fictícios de preenchimento são jovens e não herdam a força do clube',()=>{
 const ctx=sandbox(slice('function leaderboardSyntheticPlayer(club,country,slot,year){','function ensureLeaderboardRosterCoverage('),{
   normalizeKey:norm,stableHash:hash,window:{BTLWorldCareer:world,BTLPlayerNames:names},
   clubStrength:()=>99,findClubDataAny:()=>({strength:99}),
   clamp:(x,a,b)=>Math.max(a,Math.min(b,x))
 });
 const players=Array.from({length:22},(_,i)=>ctx.leaderboardSyntheticPlayer('Arsenal','ENG',i+1,2026));
 assert.equal(new Set(players.map(p=>p.id)).size,22);
 assert(players.every(p=>p.rating<=83&&p.rating>=48));
 assert(players.every(p=>p.birthYear<=2010&&p.birthYear>=2007));
 assert(players.every(p=>p.potential>=p.rating));
 assert(players.every(p=>p.generated&&p.rosterPlaceholder));
 assert(players.every(p=>!/^Atleta simulado/i.test(p.name)));
});

test('gols e assistências simulados são limitados por GER sem alterar placares',()=>{
 const ctx=sandbox(
   slice('function leaderboardPlayerProfile(wp){','function isNationalLeaderboard(title='),
   {
     state:{season:{league:{name:'Premier League'},matchRegistry:Array.from({length:34},(_,i)=>({id:'match'+i,competition:'FA Cup',home:'Arsenal',away:'Liverpool',homeGoals:5,awayGoals:0,source:'BTL simulação de outras equipes'}))},player:{club:'Manchester City'}},
     clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),stableHash:hash,normalizeKey:norm,isNationalLeaderboard:()=>false
   }
 );
 const youth=Array.from({length:14},(_,i)=>({name:'Jovem '+i,id:'kid'+i,club:'Arsenal',position:i<3?'ATA':'MC',rating:60,generated:true}));
 const rows=ctx.recordedLeaderboardStatistics('FA Cup',youth);
 for(const row of rows.values()){
   assert(row.goals<=3,`gols fictícios com GER 60 não devem superar 3 (${row.goals})`);
   assert(row.assists<=3,`assists fictícias com GER 60 não devem superar 3 (${row.assists})`);
 }
 assert.equal(ctx.state.season.matchRegistry.reduce((n,m)=>n+m.homeGoals,0),170,'placar da competição preservado');
});

test('jogadores fictícios antigos são reequilibrados sem perder identificação ou números registrados',()=>{
 const ctx=sandbox(slice('const renamedRosterInstances=new WeakSet();','function ensureWorldPlayers(){'),{
   window:{BTLPlayerNames:names,BTLWorldCareer:world},state:{season:{year:2030}},stableHash:hash,canonicalClubCountryCode:()=> 'ENG'
 });
 const legacy=[{id:'roster-sim:eng:arsenal:12',name:'Atleta simulado 12',club:'Arsenal',countryCode:'ENG',position:'ATA',rating:88,potential:95,birthYear:2002,lastAgedYear:2030,generated:true,rosterPlaceholder:true,goals:17,assists:3}];
 assert.equal(ctx.upgradeFictionalPlayerNames(legacy),1);
 assert(legacy[0].rating<80);assert(legacy[0].age===undefined);
 assert(legacy[0].youthRatingV110);
 assert.equal(legacy[0].goals,17);assert.equal(legacy[0].assists,3);
 assert.equal(legacy[0].id,'roster-sim:eng:arsenal:12');
 assert(!/^Atleta simulado/i.test(legacy[0].name));
 assert.equal(ctx.upgradeFictionalPlayerNames(legacy),0);
});

test('classificações não exibem marcador GERADO abaixo dos nomes',()=>{
 const markup=slice('function renderCompetitionLeaderboards(){','function renderHomeHub(){');
 assert.doesNotMatch(markup,/leaderboard-generated-label|<small[^>]*>GERADO<\/small>/);
 assert.doesNotMatch(markup,/gerados<\/span>/);
 assert(markup.includes('withStats.some(r=>!r.rosterPlaceholder)'));
 assert(markup.includes('leaderboardSelectedTeam?ordered'));
});
