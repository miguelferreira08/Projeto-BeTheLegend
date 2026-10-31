/* Automatic Transfermarkt/Kaggle catalog acquisition for new careers.
 * Snapshot is explicitly dated 2026-07-06: NOT a verified 2026/27 roster.
 * Runs without any player upload and never mutates an existing career.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.BTLWorldAuto=api;
})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
  const UPSTREAM='https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data/';
  const SOURCE_DATE='2026-07-06';
  const MAX_COMPRESSED=32_000_000;
  const MIN_PLAYERS=5000;
  let pending=null;
  async function requestPart(part,fetcher=fetch){
    if(!['players','clubs'].includes(part))throw Error('Parte de catálogo inválida.');
    const paths=['/api/world-transfermarkt?part='+part,UPSTREAM+part+'.csv.gz'];
    let error;
    for(const path of paths){
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),20000);
      try{
        const response=await fetcher(path,{signal:controller.signal,headers:{Accept:'application/gzip, text/csv;q=0.8'}});
        if(!response.ok)throw Error('Fonte HTTP '+response.status);
        const type=String(response.headers?.get('content-type')||'').toLowerCase();
        if(type.includes('text/html'))throw Error('Resposta HTML inesperada');
        const length=Number(response.headers?.get('content-length'))||0;
        if(length>MAX_COMPRESSED)throw Error('Arquivo ultrapassa limite de segurança');
        const bytes=new Uint8Array(await response.arrayBuffer());
        if(!bytes.length||bytes.length>MAX_COMPRESSED)throw Error('Arquivo vazio ou muito grande');
        let text;
        if(bytes[0]===0x1f&&bytes[1]===0x8b){
          if(typeof DecompressionStream==='undefined')throw Error('Navegador não suporta gzip');
          text=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
        }else{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes)}
        if(!text.trimStart().startsWith(part==='players'?'player_id,':'club_id,'))throw Error('CSV Transfermarkt não identificado');
        return text;
      }catch(e){error=e}finally{clearTimeout(timeout)}
    }
    throw Error('Não foi possível carregar '+part+' do Transfermarkt/Kaggle: '+String(error?.message||error));
  }
  async function load({fetcher,engine,minPlayers=MIN_PLAYERS}={}){
    if(pending)return pending;
    pending=(async()=>{
      const tm=engine||globalThis.BTLWorldCareer;
      if(!tm?.parseCSV||!tm?.mapTransfermarkt)throw Error('Motor de elenco não carregado');
      const embedded=globalThis.BTLTransfermarktSeed;
      if(Array.isArray(embedded?.players)&&embedded.players.length>=minPlayers){
        return {players:embedded.players,meta:{...embedded.meta,automatic:true,sourceType:'embedded'}};
      }
      const playersCsv=await requestPart('players',fetcher);
      const mapped=tm.mapTransfermarkt(tm.parseCSV(playersCsv),{year:2026,sourceDate:SOURCE_DATE,maxPlayers:150000});
      if(mapped.players.length<minPlayers)throw Error('Catálogo recusado: menos de '+minPlayers+' atletas válidos');
      let enriched=0;
      try{const clubsCsv=await requestPart('clubs',fetcher);enriched=tm.attachClubs(mapped.players,tm.parseCSV(clubsCsv))}catch(e){console.warn('Clubes opcionais indisponíveis:',e)}
      return {players:mapped.players,meta:{source:'Transfermarkt via Kaggle (snapshot público)',sourceDate:SOURCE_DATE,sourceType:'automatic',automatic:true,records:mapped.players.length,excluded:mapped.omitted,clubsEnriched:enriched,sourceUrl:'https://www.kaggle.com/datasets/davidcariboo/player-scores',verified2026Window:false,notes:'Elencos NÃO confirmados após 06/07/2026. GER é estimativa do jogo.'}};
    })();
    try{return await pending}catch(e){pending=null;throw e}
  }
  return {load,requestPart,SOURCE_DATE,UPSTREAM};
});
