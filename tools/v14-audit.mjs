import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import crypto from 'node:crypto';
const root=new URL('../',import.meta.url);const read=s=>fs.readFileSync(new URL(s,root),'utf8');
const win={};const sandbox=vm.createContext({window:win});
for(const f of ['js/roster-snapshot-2026.js','js/roster-expansion-2026.js'])vm.runInContext(read(f),sandbox);
const official=win.BTLOfficialSquads;const entries=Object.entries(official);assert.equal(entries.length,9);
const names=new Map();let ct=0;for(const [,club] of entries){assert(club.players.length>=20,club.club);ct+=club.players.length;assert.equal(club.historicalSnapshot,false);assert(/^https:\/\//.test(club.sourceUrl));for(const p of club.players){assert(p.name.length>2);const key=p.name.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();assert(!names.has(key),`${p.name} in both ${names.get(key)} and ${club.club}`);names.set(key,club.club)}}
assert(ct>=235);console.log(`Roster snapshots: ${entries.length} clubs, ${ct} players, no cross-team duplicates`);
const document={readyState:'loading',addEventListener(){}};
const rostersWin={BTLOfficialSquads:official};const ctx=vm.createContext({window:rostersWin,document,URL,AbortController,setTimeout,clearTimeout,console,fetch:async()=>{throw Error('fetch not expected')}});
vm.runInContext(read('js/rosters.js'),ctx);
const hub=rostersWin.BTLRosterHub;
const locals=await hub.getRoster('Chelsea');assert.equal(locals.club,'Chelsea');assert(locals.players.some(p=>p.name==='Emiliano Martínez'));assert(!locals.players.some(p=>p.name==='Enzo Fernández'));
const csv='club,name,number,position,country,rating,nationalCode\r\n"Flamengo","Jogador, Teste",10,MEI,Brasil,80,BR\r\n"Flamengo","Outro Jogador",2,ZAG,Brasil,77,BR\r\n';
const parsed=hub.parseCsv(csv);assert.equal(parsed.players.length,2);assert.equal(parsed.players[0].name,'Jogador, Teste');assert.equal(parsed.club,'Flamengo');
assert.throws(()=>hub.parseCsv('club,name\nFlamengo,Ana\nChelsea,João'),/um clube/);
assert.throws(()=>hub.parseCsv('name,position\nTest,ATA'),/Cabeçalho/);
console.log('Roster UI: local snapshots, CSV with quotes, mixed-club import rejected');
assert(read('js/font-loader.js').includes('new FontFace('));assert(read('js/font-loader.js').includes('indexedDB'));assert(read('css/legend-atelier.css').includes("'BTL Uploaded Jersey M54'"));assert(!fs.readdirSync(new URL('assets/fonts/',root)).some(f=>/\.(?:ttf|woff2?|otf)$/i.test(f)));
console.log('Jersey M54: local user-file override + persistence, font file not redistributed');
const html=read('index.html');for(const file of ['js/font-loader.js','js/roster-expansion-2026.js','js/rosters.js','js/app.js','css/legend-atelier.css'])assert(html.includes(file));
assert(read('js/auth.js').includes("theme:'outline'"));
const apiCode=read('functions/api/roster.js');const imported=await import('data:text/javascript;base64,'+Buffer.from(apiCode).toString('base64'));
const orig=globalThis.fetch;const calls=[];globalThis.fetch=async(url,options={})=>{
 calls.push(String(url));
 if(String(url).includes('teams?name=Arsenal'))return{ok:true,json:async()=>({errors:[],response:[{team:{id:42,name:'Arsenal',logo:'https://media.api-sports.io/football/teams/42.png'}}]})};
 if(String(url).includes('players/squads?team=42'))return{ok:true,json:async()=>({errors:[],response:[{team:{id:42},players:[{name:'Jugador Uno',number:9,position:'Attacker'}]}]})};
 throw Error('unexpected '+url);
};
try{const result=await imported.onRequestGet({request:new Request('https://test.example/api/roster?club=Arsenal&country=ENG'),env:{APISPORTS_KEY:'test-secret'}});const val=await result.json();assert.equal(val.source,'API-SPORTS');assert.equal(val.players[0].position,'ATA');assert(!JSON.stringify(val).includes('test-secret'));assert.equal(calls.length,2);console.log('API-Sports: server-side key, exact club match, live squad, crest parsed');}finally{globalThis.fetch=orig}
for(const file of ['js/app.js','js/data.js','js/auth.js','js/rosters.js','js/font-loader.js','js/roster-snapshot-2026.js','js/roster-expansion-2026.js','functions/api/roster.js'])assert(fs.existsSync(new URL(file,root)));
assert(read('js/app.js').includes('window.BTLImportRosterToCareer=function'));
console.log('Regression: all referenced entrypoints exist; opt-in world import present');
console.log('V14 AUDIT OK');
