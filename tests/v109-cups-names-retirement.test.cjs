'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const names=require('../js/player-name-generator.js');
const career=require('../js/world-career.js');
const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
function sourceFunction(start,next){const i=app.indexOf(start);assert(i>=0,`missing ${start}`);const j=app.indexOf(next,i+start.length);assert(j>i,`missing ${next}`);return app.slice(i,j);}

test('nomes nacionais são completos, determinísticos e únicos por slot de elenco',()=>{
 for(const code of ['BR','ENG','ES','AR','FR','DE','IT','PT','JP','KR','NG','TR','SA','ZZ']){
   const result=Array.from({length:22},(_,i)=>names.generate(`roster-sim:${code}:clube:0`,code,i+1));
   assert.equal(new Set(result).size,result.length,code);
   assert(result.every(x=>x.split(/\s+/).length>=2&&!/atleta simulado/i.test(x)),code);
   assert.equal(names.generate('regen:222:abc',code,1),names.generate('regen:222:abc',code,1));
 }
 assert.match(names.generate('id-uruguai','UY',1),/\S+ \S+/);
});

test('migração troca apenas nomes genéricos preservando IDs, clube, gols e assists',()=>{
 const context={window:{BTLPlayerNames:names},canonicalClubCountryCode:()=> 'ENG'};
 vm.createContext(context);vm.runInContext(sourceFunction('const renamedRosterInstances=new WeakSet();','function ensureWorldPlayers(){'),context);
 const roster=[{id:'roster-sim:eng:arsenal:1',name:'Atleta simulado 01',rosterPlaceholder:true,countryCode:'ENG',club:'Arsenal',goals:17,assists:3},
 {id:'tm:247',name:'Harry Kane',countryCode:'ENG',club:'Bayern',goals:28,assists:12}];
 assert.equal(context.upgradeFictionalPlayerNames(roster),1);
 assert.doesNotMatch(roster[0].name,/Atleta simulado/);
 assert.equal(roster[0].goals,17);assert.equal(roster[0].assists,3);assert.equal(roster[0].id,'roster-sim:eng:arsenal:1');
 assert.equal(roster[1].name,'Harry Kane');assert.equal(context.upgradeFictionalPlayerNames(roster),0);
});

test('proteção de primeira temporada para jogadores do mundo',()=>{
 const p={id:'tm:1980',name:'Veterano',birthYear:1980,club:'Clube X',position:'ATA',countryCode:'PT',nationalCode:'PT',rating:78,potential:80,lastAgedYear:2026,retirementTarget:36,retired:false};
 const list=[p];const first=career.advance(list,2026,{seedYear:2026});
 assert.equal(first.retirements.length,0);assert.equal(list.length,1);assert.equal(p.retired,false);
 const second=career.advance(list,2027,{seedYear:2026});
 assert.equal(second.retirements.length,1);assert.equal(second.generated.length,1);assert.equal(list.length,2);
 assert.doesNotMatch(list[1].name,/Atleta simulado|Jogador \d+/i);assert.equal(list[1].nationalCode,'PT');assert.equal(list[1].club,'Clube X');
});

test('protagonista não se aposenta automaticamente na primeira temporada',()=>{
 const fn=sourceFunction('function careerSeasonLimitReached(p=state.player){','function retireAtCareerSeasonLimit');
 const ctxt={state:{history:[{year:2026}]},MAX_CAREER_SEASONS:18,window:{BTLWorldCareer:career}};
 vm.createContext(ctxt);vm.runInContext(fn,ctxt);
 const p={age:41,retirementTarget:36};assert.equal(ctxt.careerSeasonLimitReached(p),false);
 ctxt.state.history.push({year:2027});assert.equal(ctxt.careerSeasonLimitReached(p),true);
});

test('cards exibem logo real da FA Cup e Carabao sem nome visível',()=>{
 const js=sourceFunction('function summaryCompetitionLogo(name){','function summaryDecisionMatch(');
 const ctxt={esc:s=>String(s).replace(/&/g,'&amp;'),trophyArtFor:name=>name==='FA Cup'?'assets/trophies/custom-2026/fa-cup.png':name==='Carabao Cup'?'assets/trophies/custom-2026/carabao-cup.png':''};
 vm.createContext(ctxt);vm.runInContext(js,ctxt);
 for(const competition of ['FA Cup','Carabao Cup']){
   const html=ctxt.summaryCompetitionCard(competition,'Eliminado — 3ª fase');
   assert(html.includes('cup-logos-v109/'));
   assert.match(html,/class="btl-cup-logo-image"/);
   assert.doesNotMatch(html,/<strong>FA Cup<\/strong>|<strong>Carabao Cup<\/strong>/);
   const file=path.join(root,`assets/trophies/cup-logos-v109/${competition==='FA Cup'?'fa-cup':'carabao-cup'}.png`);
   assert(fs.statSync(file).size>1000);
 }
});
