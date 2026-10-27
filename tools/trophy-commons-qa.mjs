import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const ROOT = path.resolve(import.meta.dirname,'..');
const app = fs.readFileSync(path.join(ROOT,'js/app.js'),'utf8');
const catalog = fs.readFileSync(path.join(ROOT,'js/commons-trophies.js'),'utf8');
const html = fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const styles = fs.readFileSync(path.join(ROOT,'css/style.css'),'utf8');
const manifest = fs.readFileSync(path.join(ROOT,'assets/trophy-manifest.txt'),'utf8');
const names = [...manifest.matchAll(/^OK\s+(.+?)\s+->/gm)].map(m=>m[1]);
const sandbox={window:{},esc:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')};
vm.createContext(sandbox);
vm.runInContext(catalog,sandbox,{filename:'commons-trophies.js'});
const begin=app.indexOf('const TROPHY_ART='),end=app.indexOf('\nfunction countryFlag(code)',begin);
assert(begin>=0&&end>begin,'trophy functions accessible');
vm.runInContext(app.slice(begin,end),sandbox,{filename:'app-trophies.js'});
let checks=0;function ok(value,reason){assert(value,reason);checks++;}
const trophyEntries=sandbox.window.BTL_COMMONS_TROPHIES;
const featured=trophyEntries.filter(e=>e.file);
const commons=featured.filter(e=>String(e.src).startsWith('https://commons.wikimedia.org/wiki/Special:FilePath/'));
const locals=featured.filter(e=>String(e.src).startsWith('assets/trophies/user/'));
const empty=trophyEntries.filter(e=>!e.file);
ok(featured.length>=50,'at least 50 validated trophy assets');
ok(locals.length>=16,'all 16 user-provided local trophy overrides are registered');
ok(commons.length>=35,'Commons-backed trophies preserved');
ok(trophyEntries.every(e=>e.page===''||e.page.startsWith('https://commons.wikimedia.org/wiki/File:')),'attribution pages either blank or Commons file page');
ok(featured.every(e=>e.src.startsWith('https://commons.wikimedia.org/wiki/Special:FilePath/')||e.src.startsWith('assets/trophies/user/')),'sources restricted to Commons or validated local user assets');
ok(!catalog.includes('thesportsdb.com')&&!catalog.includes('freepik.com')&&!catalog.includes('pexels.com'),'no third-party media hosts embedded');
ok(!/assets\/trophies\/fm\/no-file\.svg/.test(app.slice(begin,end)),'dead FM no-file fallback removed');
ok(html.indexOf('js/commons-trophies.js')>=0&&html.indexOf('js/commons-trophies.js')<html.indexOf('js/app.js'),'catalog script loads first');
ok(styles.includes('#celebration-icon .honour-art'),'fallback is styled in celebrations');
for(const name of ['FIFA World Cup','FIFA Club World Cup','UEFA Champions League','UEFA Europa League','UEFA Conference League','CONMEBOL Libertadores','CONMEBOL Sul-Americana','Brasileirão Série A','Copa do Brasil','Copa América','Premier League','Scottish Premiership','Saudi Pro League','AFC Champions League Elite','U.S. Open Cup']){
 const x=sandbox.trophyEntryFor(name);ok(!!x?.src || /Eliminat/.test(name),`real image registered for ${name}`);
}
const mapped=[],unmapped=[];
for(const name of names){
  const sources=sandbox.trophySourcesFor(name);
  ok(sources.length<=1,`${name} has at most one verified image (no misleading generic fallback)`);
  const rendered=sandbox.honourVisual(name);
  if(sources.length){
    mapped.push(name);
    ok(sources[0].startsWith('https://commons.wikimedia.org/')||sources[0].startsWith('assets/trophies/user/'),`${name} source allowed`);
    ok(rendered.includes(`<img src="${sources[0]}`),`${name} renders image`);
  }else{
    unmapped.push(name);
    ok(!rendered.includes('<img'),`${name} no broken image tag`);
    ok(rendered.includes('class="honour-art fallback"'),`${name} fallback initials`);
  }
}
ok(unmapped.length===1 && unmapped.includes('Eliminatórias da Copa do Mundo'),'only World Cup qualifiers have no trophy');
ok(sandbox.trophySourcesFor('Copa Nacional')[0]==='assets/trophies/user/copa-nacional.png','Copa Nacional uses supplied trophy photo');
ok(sandbox.honourVisual('UEFA Champions League <script>').includes('&lt;script&gt;'),'HTML escaped in image labels');
ok(sandbox.trophySourcesFor('DUMMY NONEXISTENT CUP').length===0,'unknown honour without fake image');
// Simulate the browser onerror callback when the current image is unavailable.
const sampleSource=sandbox.trophySourcesFor('UEFA Champions League')[0]||sandbox.trophySourcesFor('AFC Champions League Elite')[0];
let removed=false,added=[];
const image={dataset:{sources:encodeURIComponent(sampleSource),index:'0'},parentElement:{classList:{add:value=>added.push(value)}},remove:()=>{removed=true;}};
sandbox.window.cycleHonourImage(image);
ok(removed,'failed <img> is removed');
ok(added.includes('fallback'),'image failure activates initials fallback');

const report={status:'PASS',testedAt:'2026-10-25',checks,manifestTotal:names.length,totalSources:featured.length,commonsSources:commons.length,localUserSources:locals.length,knownUnavailableRules:empty.length,mappedCount:mapped.length,unmappedCount:unmapped.length,mapped,unmapped,sourcePages:featured.map(e=>({filename:e.file,page:e.page,license:e.license,author:e.author,isLocal:!!e.isLocal})),notes:['Os 16 anexos foram utilizados para mapear os 16 troféus específicos indicados pelo usuário.','Wikimedia Commons continua sendo a fonte principal; Eliminatórias não têm taça específica; Copa Nacional utiliza a fotografia indicada pelo usuário.','Falhas de carregamento agora caem para iniciais, sem usar taças genéricas.']};
fs.writeFileSync(path.join(ROOT,'assets/trophy-qa-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:'PASS',checks,totalSources:featured.length,commonsSources:commons.length,localUserSources:locals.length,manifestTotal:names.length,mapped:mapped.length,unmapped},null,2));
