const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync(__dirname+'/../js/app.js','utf8');
const body=(fn,next)=>{const st=src.indexOf('function '+fn+'(');assert(st>=0,fn+' missing');const end=src.indexOf('\nfunction '+next+'(',st+1);assert(end>=0,`next ${next} missing`);return src.slice(st,end);};
const functions=body('historicalFlagMarkup','historicalMetricGrade')+'\n'+body('historicalMetricGrade','historicalMetricCards')+'\n'+body('historicalMetricCards','historicalSeasonGrade')+'\n'+body('historicalSeasonGrade','renderHistoricalRankingModal');
const sandbox={clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),esc:(s)=>s};vm.createContext(sandbox);vm.runInContext(functions,sandbox);
let tests=0;const check=(ok,msg)=>{assert(ok,msg);tests++};
for(const [goals,assists,games,rating] of [[54,36,40,8.4],[35,55,48,8.4],[45,45,60,8.4]]){
 const grade=sandbox.historicalSeasonGrade({games,goals,assists,rating},'Centroavante');check(grade>9.0&&grade<=10,`alta produção ${goals+assists}/${games} -> ${grade}`);
 const grade2=sandbox.historicalSeasonGrade({games,goals,assists,rating:grade,matchRating:rating},'Centroavante');check(grade===grade2,'bônus repetido');
}
check(sandbox.historicalSeasonGrade({games:32,goals:0,assists:0,rating:7.1},'Centroavante')===7.1,'nota sem gols');
for(const [k,m] of [['auge',120],['numeros',180],['desempenho',120],['premios',150],['selecao',90],['longevidade',20]]){check(sandbox.historicalMetricGrade(k,m)==='10.0','máximo '+k);check(sandbox.historicalMetricGrade(k,0)==='1.0','mínimo '+k);}
check(sandbox.historicalFlagMarkup('🇧🇷').includes('br.svg'),'bandeira brasileira');check(sandbox.historicalFlagMarkup('🇦🇷🇪🇸').includes('ar.svg')&&sandbox.historicalFlagMarkup('🇦🇷🇪🇸').includes('es.svg'),'dupla nacionalidade');
check(src.includes('function finalizeVoluntaryRetirement()')&&src.includes("$('#retirement-confirm-modal')"),'modal aposentadoria');check(!src.includes('if(!confirm(`Encerrar a carreira'),'sem confirm nativo');
check(src.includes('window.BTL_FM_TROPHIES')&&!src.includes('const TROPHY_ART=[\n'),'troféus só FM');
check(fs.readFileSync(__dirname+'/../index.html','utf8').includes('retirement-confirm-modal'),'markup modal');
check(fs.existsSync(__dirname+'/../tools/import-fm-trophies.py'),'importador FM');
console.log(JSON.stringify({status:'ok',checks:tests}));
