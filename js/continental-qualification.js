/* Be The Legend — vagas internacionais pelas classificações 2026/27.
 * Especificação: documento do usuário 'REGULAMENTOS DAS LIGAS MUNDIAIS'.
 * Posições só determinam vagas quando o documento define uma rota; resultados
 * ausentes de copas, Apertura/Clausura, coeficientes EPS e playoffs NÃO são inventados.
 */
(()=>{'use strict';
const C={ucl:'UEFA Champions League',uel:'UEFA Europa League',uecl:'UEFA Conference League',lib:'CONMEBOL Libertadores',sula:'CONMEBOL Sul-Americana',conc:'CONCACAF Champions Cup',elite:'AFC Champions League Elite',two:'AFC Champions League Two',caf:'CAF Champions League',confed:'CAF Confederation Cup',ofc:'OFC Champions League'};
const S=(competition,count,phase='league',reason='Liga nacional')=>({competition,count,phase,reason});
const profiles={
 BR:{family:'south',source:'CBF-2026',slots:[S(C.lib,4),S(C.lib,1,'qualifier'),S(C.sula,6)],cup:{competition:C.lib,phase:'league'},cupRunner:{competition:C.lib,phase:'qualifier'}},
 ENG:{family:'europe',source:'DOC-ENG-2026',eps:true,slots:[S(C.ucl,4),S(C.uel,1)],cup:{competition:C.uel,phase:'league'},leagueCup:{competition:C.uecl,phase:'playoff'}},
 ES:{family:'europe',source:'DOC-ES-2026',eps:true,slots:[S(C.ucl,4),S(C.uel,1),S(C.uecl,1,'qualifier')],cup:{competition:C.uel,phase:'league'}},
 DE:{family:'europe',source:'DOC-DE-2026',eps:true,slots:[S(C.ucl,4),S(C.uel,1),S(C.uecl,1,'qualifier')],cup:{competition:C.uel,phase:'league'}},
 IT:{family:'europe',source:'DOC-IT-2026',eps:true,slots:[S(C.ucl,4),S(C.uel,1),S(C.uecl,1,'qualifier')],cup:{competition:C.uel,phase:'league'}},
 FR:{family:'europe',source:'DOC-FR-2026',eps:true,slots:[S(C.ucl,3),S(C.ucl,1,'qualifier','3ª fase preliminar'),S(C.uel,1),S(C.uecl,1,'playoff')],cup:{competition:C.uel,phase:'league'}},
 PT:{family:'europe',source:'DOC-PT-2026',slots:[S(C.ucl,2),S(C.ucl,1,'qualifier','3ª fase preliminar'),S(C.uel,1,'qualifier','2ª fase preliminar'),S(C.uecl,1,'qualifier','2ª fase preliminar')],cup:{competition:C.uel,phase:'league'}},
 NL:{family:'europe',source:'DOC-NL-2026',slots:[S(C.ucl,1),S(C.ucl,1,'qualifier','3ª fase preliminar'),S(C.uel,1,'qualifier','2ª fase preliminar')],cup:{competition:C.uel,phase:'league'},europaPlayoff:{competition:C.uecl,phase:'qualifier'}},
 BE:{family:'europe',source:'DOC-BE-2026',slots:[S(C.ucl,1),S(C.ucl,1,'qualifier','3ª fase preliminar'),S(C.uel,1,'qualifier','2ª fase preliminar'),S(C.uecl,1,'qualifier','2ª fase preliminar')],cup:{competition:C.uel,phase:'playoff'}},
 TR:{family:'europe',source:'DOC-TR-2026',slots:[S(C.ucl,1),S(C.ucl,1,'qualifier','3ª fase preliminar'),S(C.uel,1,'qualifier','2ª fase preliminar'),S(C.uecl,1,'qualifier','2ª fase preliminar')],cup:{competition:C.uel,phase:'playoff'}},
 AR:{family:'south',source:'DOC-AR-2026',slots:[S(C.lib,3,'league','Tabela anual — três elegíveis'),S(C.sula,6)],cup:{competition:C.lib,phase:'league'},apertura:{competition:C.lib,phase:'league'},clausura:{competition:C.lib,phase:'league'}},
 UY:{family:'south',source:'DOC-UY-PARCIAL',slots:[S(C.lib,2),S(C.lib,2,'qualifier'),S(C.sula,4)]},
 CL:{family:'south',source:'DOC-CL-2026',slots:[S(C.lib,2),S(C.sula,3)],cupLeague:{competition:C.lib,phase:'qualifier'},cupPlayoff:{competition:C.lib,phase:'qualifier'}},
 CO:{family:'south',source:'DOC-CO-PARCIAL',slots:[S(C.lib,2,'league','Dois elegíveis na reclassificação'),S(C.sula,3)],cup:{competition:C.sula,phase:'league'},apertura:{competition:C.lib,phase:'league'},clausura:{competition:C.lib,phase:'league'}},
 PE:{family:'south',source:'DOC-PE-PARCIAL',slots:[S(C.lib,2),S(C.lib,2,'qualifier'),S(C.sula,4)]},
 EC:{family:'south',source:'DOC-EC-PARCIAL',slots:[S(C.lib,2),S(C.lib,1,'qualifier'),S(C.sula,3)],cup:{competition:C.lib,phase:'qualifier'}},
 JP:{family:'asia',source:'DOC-JP-2026',slots:[S(C.elite,3),S(C.elite,2,'qualifier')],cup:{competition:C.two,phase:'league'}},
 CN:{family:'asia',source:'DOC-CN-2026',slots:[S(C.elite,1),S(C.two,1)],cup:{competition:C.elite,phase:'league'}},
 EG:{family:'africa',source:'DOC-EG-PARCIAL',slots:[S(C.caf,2),S(C.confed,1)],cup:{competition:C.confed,phase:'league'}},
 ZA:{family:'africa',source:'DOC-ZA-PARCIAL',slots:[S(C.caf,2),S(C.confed,1)],cup:{competition:C.confed,phase:'league'}},
 MA:{family:'africa',source:'DOC-MA-PARCIAL',slots:[S(C.caf,2),S(C.confed,1)],cup:{competition:C.confed,phase:'league'}},
 NG:{family:'africa',source:'DOC-NG-PARCIAL',slots:[S(C.caf,2),S(C.confed,1)],cup:{competition:C.confed,phase:'league'}},
 // Sem posições anuais incondicionais no documento: esperar vencedores reais.
 US:{family:'north',source:'DOC-US-2026',slots:[],cup:{competition:C.conc,phase:'league'}},
 MX:{family:'north',source:'DOC-MX-PARCIAL',slots:[]},
 CA:{family:'north',source:'DOC-CA-2026',slots:[],cup:{competition:C.conc,phase:'league'}},
 CR:{family:'north',source:'DOC-CR-PARCIAL',slots:[]},GT:{family:'north',source:'DOC-GT-PARCIAL',slots:[]},
 KR:{family:'asia',source:'DOC-KR-SEM-POSICOES',slots:[],cup:{competition:C.two,phase:'league'}},
 SA:{family:'asia',source:'DOC-SA-SEM-POSICOES',slots:[]},AU:{family:'asia',source:'DOC-AU-SEM-POSICOES',slots:[]},
 NZ:{family:'oceania',source:'DOC-NZ-SEM-VAGA-DIRETA',slots:[]},FJ:{family:'oceania',source:'DOC-FJ-SELETIVA',slots:[]},
 // Ligas extras do mercado não abordadas no documento: conservar MODELO SIMULADO,
 // nunca rotulá-lo como regulamento oficial de 2026/27.
 SCO:{family:'europe',source:'simulacao',slots:[S(C.ucl,1,'qualifier'),S(C.uel,1,'qualifier'),S(C.uecl,2,'qualifier')]},
 AT:{family:'europe',source:'simulacao',slots:[S(C.ucl,1,'qualifier'),S(C.uel,1,'qualifier'),S(C.uecl,2,'qualifier')]},
 CH:{family:'europe',source:'simulacao',slots:[S(C.ucl,1,'qualifier'),S(C.uel,1,'qualifier'),S(C.uecl,2,'qualifier')]},
 DK:{family:'europe',source:'simulacao',slots:[S(C.ucl,1,'qualifier'),S(C.uel,1,'qualifier'),S(C.uecl,2,'qualifier')]},
 GR:{family:'europe',source:'simulacao',slots:[S(C.ucl,1,'qualifier'),S(C.uel,1,'qualifier'),S(C.uecl,2,'qualifier')]},
 CZ:{family:'europe',source:'simulacao',slots:[S(C.ucl,1),S(C.ucl,1,'qualifier'),S(C.uel,1,'qualifier'),S(C.uecl,1,'qualifier')]},
 PL:{family:'europe',source:'simulacao',slots:[S(C.ucl,1,'qualifier'),S(C.uel,1,'qualifier'),S(C.uecl,2,'qualifier')]},
 HR:{family:'europe',source:'simulacao',slots:[S(C.ucl,1,'qualifier'),S(C.uecl,2,'qualifier')]},
 RS:{family:'europe',source:'simulacao',slots:[S(C.ucl,1,'qualifier'),S(C.uecl,2,'qualifier')]},
 NO:{family:'europe',source:'simulacao',slots:[S(C.ucl,1,'qualifier'),S(C.uecl,2,'qualifier')]},
 SE:{family:'europe',source:'simulacao',slots:[S(C.ucl,1,'qualifier'),S(C.uecl,2,'qualifier')]},
 RO:{family:'europe',source:'simulacao',slots:[S(C.ucl,1,'qualifier'),S(C.uecl,2,'qualifier')]},
 UA:{family:'europe',source:'simulacao',slots:[S(C.ucl,1,'qualifier'),S(C.uel,1,'qualifier'),S(C.uecl,1,'qualifier')]},
 QA:{family:'asia',source:'simulacao',slots:[S(C.elite,1),S(C.elite,1,'qualifier'),S(C.two,1)]},
 AE:{family:'asia',source:'simulacao',slots:[S(C.elite,1),S(C.elite,1,'qualifier'),S(C.two,1)]}
};
const names={europe:[C.ucl,C.uel,C.uecl],south:[C.lib,C.sula,''],north:[C.conc,'',''],asia:[C.elite,C.two,''],africa:[C.caf,C.confed,''],oceania:[C.ofc,'','']};
const color={primary:'#4b93ff',qualifying:'#87b6ff',secondary:'#e8ad41',third:'#55bd8e',relegated:'#e87979'};
const priority=(competition,phase)=>{
 const idx=[C.ucl,C.lib,C.elite,C.caf,C.conc,C.ofc].includes(competition)?3:[C.uel,C.sula,C.two,C.confed].includes(competition)?2:1;
 return idx*10+({league:3,playoff:2,qualifier:1}[phase]||0);
};
function assign(country,standings,opt={}){
 const cfg=profiles[country];
 const rows=(standings||[]).map((r,i)=>({...r,position:i+1,qualification:null,qualificationColor:null}));
 if(!cfg)return rows;
 const eligible=rows.filter(r=>r.team&&r.divisionLevel!==2&&r.divisionLevel!==3);
 const get=team=>eligible.find(r=>r.team===team);
 function paint(r,competition,phase,reason){
  r.qualification={competition,phase,reason,year:Number(opt.year||2026)+1,model:opt.simulatedStandings?'simulacao':'BTL carreira',regulation:cfg.source};
  r.qualificationColor=phase==='league'&&priority(competition,phase)>=30?color.primary:
    phase==='qualifier'&&priority(competition,phase)>=30?color.qualifying:
    [C.uel,C.sula,C.two,C.confed].includes(competition)?color.secondary:color.third;
 }
 function next(competition,phase,reason){const r=eligible.find(r=>!r.qualification);if(!r)return false;paint(r,competition,phase,reason);return true;}
 function repass(competition,phase,reason,skip=[],depth=0){
  if(depth>eligible.length)return false;
  const score=priority(competition,phase);
  const r=eligible.find(r=>!skip.includes(r.team)&&(!r.qualification||priority(r.qualification.competition,r.qualification.phase)<score));
  if(!r)return false;
  const old=r.qualification;paint(r,competition,phase,reason);
  if(old)repass(old.competition,old.phase,`Repassada após ${reason}`,[...skip,r.team],depth+1);
  return true;
 }
 function winner(team,slot,reason){
  if(!slot||!team)return false;
  const r=get(team);if(!r)return false; // Campeão da divisão inferior: registrar em módulo específico.
  const old=r.qualification;
  if(!old){paint(r,slot.competition,slot.phase,reason);return true;}
  if(priority(old.competition,old.phase)>=priority(slot.competition,slot.phase))return repass(slot.competition,slot.phase,`Repasse: ${reason}`,[team]);
  paint(r,slot.competition,slot.phase,reason);repass(old.competition,old.phase,`Repasse após ${reason}`,[team]);return true;
 }
 const slots=[...(cfg.slots||[])].map(s=>({...s}));
 // Vaga extra de desempenho europeu: só existe se o país GANHOU a cota no ano.
 if(cfg.eps&&opt.epsCountry){const first=slots.find(s=>s.competition===C.ucl&&s.phase==='league');if(first)first.count++;}
 for(const slot of slots)for(let i=0;i<slot.count;i++)next(slot.competition,slot.phase,slot.reason);
 if(country==='BR'){
  // Copa do Brasil: campeão entra diretamente e vice na preliminar.
  // Se campeão já tem vaga direta, essa vaga DIRETA passa primeiro ao vice;
  // a vaga preliminar liberada passa ao seguinte elegível no Brasileirão.
  const champ=String(opt.cupWinner||''),vice=String(opt.cupRunnerUp||'');
  if(champ){
   const current=get(champ)?.qualification;
   if(current?.competition===C.lib&&current.phase==='league'){
    if(vice){winner(vice,{competition:C.lib,phase:'league'},'Vice Copa do Brasil — repasse direto');repass(C.lib,'qualifier','Vaga preliminar repassada após vice',[champ,vice]);}
    else repass(C.lib,'league','Repasse direto da Copa do Brasil — vice desconhecido',[champ]);
   }else{
    winner(champ,{competition:C.lib,phase:'league'},'Campeão Copa do Brasil');
    if(vice)winner(vice,{competition:C.lib,phase:'qualifier'},'Vice Copa do Brasil');
   }
  }else if(vice){winner(vice,{competition:C.lib,phase:'qualifier'},'Vice Copa do Brasil');}
 }else{
  winner(opt.cupWinner,cfg.cup,'Campeão da copa nacional');
  winner(opt.leagueCupWinner,cfg.leagueCup,'Campeão da Copa da Liga');
 }
 winner(opt.aperturaWinner,cfg.apertura,'Campeão Apertura');
 winner(opt.clausuraWinner,cfg.clausura,'Campeão Clausura');
 winner(opt.cupLeagueWinner,cfg.cupLeague,'Campeão Copa da Liga');
 winner(opt.europaPlayoffWinner,cfg.europaPlayoff,'Vencedor do playoff europeu');
 winner(opt.cupPlayoffWinner,cfg.cupPlayoff,'Vencedor do confronto Copa Chile');
 if(country==='CL')winner(opt.cupPlayoffLoser,{competition:C.sula,phase:'league'},'Perdedor do confronto Copa Chile');
 // Vias de ligas fechadas e torneios semestrais: somente campeões informados.
 if(country==='US'){
  const slot={competition:C.conc,phase:'league'};
  ['mlsCupWinner','supportersShieldWinner','otherConferenceWinner'].forEach(k=>winner(opt[k],slot,k));
  if(opt.mlsCupWinner&&opt.supportersShieldWinner&&opt.otherConferenceWinner)for(let i=0;i<2;i++)next(C.conc,'league','Próximo elegível MLS');
 }
 if(country==='MX'){
  const slot={competition:C.conc,phase:'league'};
  const keys=['aperturaWinner','aperturaRunnerUp','clausuraWinner','clausuraRunnerUp'];
  if(keys.every(k=>opt[k])){keys.forEach(k=>winner(opt[k],slot,k));for(let i=0;i<2;i++)next(C.conc,'league','Tabela acumulada');}
 }
 if(country==='CA'){
  ['regularSeasonWinner','playoffWinner'].forEach(k=>winner(opt[k],{competition:C.conc,phase:'league'},k));
 }
 // Não inferir posições fixas quando o documento explicitamente não confirma.
 return rows;
}
window.BTLQualification=Object.freeze({profiles,names,color,assign,hasCountry:c=>Boolean(profiles[c]),qualificationSource:c=>profiles[c]?.source||'ausente'});
})();
