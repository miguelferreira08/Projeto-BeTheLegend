/* V14: source-transparent roster workbench. Live data is NOT October 2026 archive.
   Supports vetted local 2026/27 club lists, ESPN, optional API-Sports,
   and personal CSV/JSON input. No copyrighted EA/WSC/Transfermarkt database bundled. */
(()=>{'use strict';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const live=new Map(),players=new Map();let shown=null;
const official=()=>window.BTLOfficialSquads||{};
const allowedSource=new Set(['ESPN','API-SPORTS','OFICIAL 2026/27','IMPORTAÇÃO DO USUÁRIO']);
const state=()=>(typeof window.BTLImportRosterToCareer==='function');
function normalizeRoster(data,fromUser=false){
 if(!data||typeof data!=='object'||!Array.isArray(data.players))throw Error('O arquivo precisa conter uma lista de jogadores.');
 const club=String(data.club||data.requestedClub||'').trim().slice(0,80);
 if(club.length<2)throw Error('Clube ausente no arquivo.');
 const seen=new Set();const list=[];
 for(const item of data.players.slice(0,120)){
  if(!item||typeof item!=='object')continue;
  const name=String(item.name||'').trim().slice(0,100);
  const k=norm(name);if(name.length<3||seen.has(k))continue;seen.add(k);
  list.push({name,number:String(item.number||'').replace(/[^0-9]/g,'').slice(0,2),position:String(item.position||'MC').slice(0,12),country:String(item.country||'').slice(0,40),nationalCode:String(item.nationalCode||'').toUpperCase().slice(0,3),rating:Number(item.rating)||null});
 }
 if(!list.length)throw Error('Nenhum jogador válido no arquivo.');
 return {club,requestedClub:club,country:String(data.country||'').toUpperCase().slice(0,3),source:fromUser?'IMPORTAÇÃO DO USUÁRIO':String(data.source||''),sourceUrl:fromUser?'':String(data.sourceUrl||''),retrievedAt:fromUser?new Date().toISOString():String(data.retrievedAt||''),historicalSnapshot:!!data.historicalSnapshot,sourcePublication:!fromUser&&data.source==='OFICIAL 2026/27',scope:fromUser?'Arquivo escolhido pelo usuário':String(data.scope||''),crest:String(data.crest||''),players:list};
}
function cache(data){const key=norm(data.requestedClub||data.club);live.set(key,{data,t:Date.now()});for(const person of data.players){const id=norm(person.name);players.set(id,{club:data.requestedClub||data.club,source:data.source})}}
async function getRoster(name,code='',options={}){
 const fromCareer=window.BTLWorldRosterForClub?.(name,code);
 if(fromCareer){const validated=normalizeRoster(fromCareer);cache(validated);return validated}
 const o=official()[norm(name)];if(o&&!options.live){const validated=normalizeRoster(o);cache(validated);return validated}
 const cached=live.get(norm(name));if(cached&&!options.live&&Date.now()-cached.t<12*3600000)return cached.data;
 const url=new URL('/api/roster',document.baseURI);url.searchParams.set('club',name);if(code)url.searchParams.set('country',code);
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),18000);let r;
 try{r=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json'}})}finally{clearTimeout(timer)}
 const response=await r.json().catch(()=>({}));if(!r.ok)throw Error(response.error==='team_not_found'?'Clube não identificado nas fontes disponíveis.':response.error==='provider_unavailable'?'Fontes externas indisponíveis.':'Para consultar clubes sem catálogo local, publique com as funções Cloudflare Pages.');
 if(!allowedSource.has(response.source))throw Error('Origem dos dados não reconhecida.');
 const d=normalizeRoster(response);cache(d);return d;
}
const toCSV=rows=>rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n')+'\r\n';
function download(text,name,type){const b=new Blob([text],{type}),url=URL.createObjectURL(b),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function simpleCsv(raw){
 const lines=[],row=[];let value='',quoted=false;
 for(let i=0;i<raw.length;i++){const c=raw[i];if(c==='"'){if(quoted&&raw[i+1]==='"'){value+='"';i++}else quoted=!quoted}
 else if(!quoted&&(c===','||c===';'||c==='\n'||c==='\r')){row.push(value.trim());value='';if(c==='\r'&&raw[i+1]==='\n')i++;if(c==='\n'||c==='\r'){if(row.some(Boolean))lines.push(row.slice());row.length=0}}
 else value+=c}
 row.push(value.trim());if(row.some(Boolean))lines.push(row);
 if(lines.length<2)throw Error('O CSV deve conter cabeçalho e pelo menos um jogador.');
 const keys=lines.shift().map(k=>norm(k));const idx=(...names)=>keys.findIndex(k=>names.some(name=>norm(name)===k));
 const ni=idx('name','nome','player','jogador'),ci=idx('club','clube','team','time'),pos=idx('position','posicao','pos','posição'),country=idx('country','pais','nacionalidade'),no=idx('number','camisa','numero'),ovr=idx('rating','ger','overall'),nat=idx('nationalCode','iso','countryCode');
 if(ni<0||ci<0)throw Error('Cabeçalho obrigatório: club,name (ou clube,nome).');
 const names=lines.map(a=>a[ci]).filter(Boolean);if(!names.length)throw Error('O arquivo não possui clube.');
 const target=norm(names[0]);if(names.some(s=>norm(s)!==target))throw Error('Importe apenas um clube por arquivo CSV; separe por time.');
 const data={club:names[0],players:lines.map(a=>({name:a[ni],position:a[pos]||'MC',number:a[no]||'',country:a[country]||'',rating:a[ovr]||'',nationalCode:a[nat]||''}))};return normalizeRoster(data,true);
}
async function readUpload(file){if(file.size>500_000)throw Error('Arquivo grande demais: limite de 500 KB.');const text=await file.text();let data;if(/\.json$/i.test(file.name)){const parsed=JSON.parse(text);if(Array.isArray(parsed))throw Error('JSON deve ser objeto com club e players.');data=normalizeRoster(parsed,true)}else data=simpleCsv(text);cache(data);return data}
const sourceLabel=d=>d.source?.includes('Transfermarkt')?'Transfermarkt/Kaggle · base datada (não é elenco atual certificado)':d.source==='OFICIAL 2026/27'?'Lista publicada pelo clube/liga em 2026/27':d.source==='IMPORTAÇÃO DO USUÁRIO'?'Arquivo importado por você':`${d.source} · consulta atual`;
const dateLabel=d=>{const date=new Date(d.retrievedAt);return !isNaN(date)?date.toLocaleDateString('pt-BR'):'sem data confirmada'};
function render(data){shown=data;const status=document.getElementById('roster-status'),out=document.getElementById('roster-result');if(!status||!out)return;
 // Provider logos are intentionally ignored; all visible club crests use Commons.
 status.textContent=`${data.players.length} atletas · ${sourceLabel(data)} · ${dateLabel(data)}.`;
 const src=(typeof clubCrestMarkup==='function')?clubCrestMarkup(data.club):'';
 const article=data.sourceUrl&&/^https:\/\//.test(data.sourceUrl)?`<a href="${esc(data.sourceUrl)}" rel="noopener noreferrer" target="_blank">Ver publicação original ↗</a>`:'';
 out.innerHTML=`<header class="roster-team-title">${src}<div><b>${esc(data.club)}</b><small>${esc(data.league||data.source)} · ${data.players.length} atletas</small></div></header>
 <p class="roster-source-meta"><b>${esc(sourceLabel(data))}</b> · ${esc(dateLabel(data))} ${article}</p>
 <p class="roster-notice">${data.historicalSnapshot?'Jogadores do seu save. O arquivo Transfermarkt/Kaggle utilizado pode ser anterior à última janela de transferências.':data.source==='OFICIAL 2026/27'?'Listagem publicada para 2026/27; não garante ausência de transferências posteriores à publicação.':data.source==='IMPORTAÇÃO DO USUÁRIO'?'Os dados deste arquivo não foram verificados automaticamente.':'Plantel atual do provedor, não uma reconstituição garantida de 22/10/2026.'}</p>
 <div class="roster-team-actions">${data.historicalSnapshot?'':'<button class="secondary" type="button" id="roster-apply-to-world">Usar no mundo simulado</button>'}<button class="secondary" type="button" id="roster-export-current">Exportar CSV</button></div>
 <div class="roster-roster-grid">${data.players.map(p=>`<div class="roster-player"><span>${esc(p.number||'—')}</span><div><b>${esc(p.name)}</b><small>${esc(p.position||'—')}${p.country?' · '+esc(p.country):''}</small></div></div>`).join('')}</div>`;
 document.getElementById('roster-export-current')?.addEventListener('click',()=>download(toCSV([['club','name','number','position','country','rating','nationalCode'],...data.players.map(x=>[data.club,x.name,x.number,x.position,x.country,x.rating,x.nationalCode])]),'btl-'+norm(data.club)+'-2026-27.csv','text/csv;charset=utf-8'));
 document.getElementById('roster-apply-to-world')?.addEventListener('click',()=>{
  const input=document.getElementById('roster-apply-consent');if(!input?.checked){status.textContent='Marque a autorização de atualização antes de alterar jogadores no mundo simulado.';return}
  if(!state()){status.textContent='Carreira não disponível. Crie ou abra uma carreira para importar.';return}
  const r=window.BTLImportRosterToCareer(data);status.textContent=r.message; if(r.ok){input.checked=false}
 });
 if(typeof hydratePenaltyBadges==='function')hydratePenaltyBadges(out);
}
async function show(name,code='',options={}){const status=document.getElementById('roster-status'),out=document.getElementById('roster-result');if(!status||!out)return;
 status.textContent='Consultando fontes…';out.replaceChildren();try{render(await getRoster(name,code,options))}catch(e){status.textContent=e.message;out.innerHTML='<p class="roster-empty">Nada foi alterado no save. Se a consulta não funcionar, importe um CSV.</p>'}}
function init(){const form=document.getElementById('roster-search'),input=document.getElementById('roster-club-input'),data=document.getElementById('roster-club-list');if(!form)return;
 const local=typeof LOCAL_CLUBS!=='undefined'?Object.values(LOCAL_CLUBS).flat():[],market=typeof TRANSFER_MARKET_CLUBS!=='undefined'?TRANSFER_MARKET_CLUBS:[];
 if(data)[...new Set([...local,...market].map(x=>x.name).filter(Boolean))].sort().forEach(name=>{const o=document.createElement('option');o.value=name;data.append(o)});
 document.getElementById('roster-refresh-live')?.addEventListener('click',()=>{const name=input.value.trim();if(name.length<2){document.getElementById('roster-status').textContent='Informe o nome do clube antes de consultar.';return;}const match=market.find(x=>norm(x.name)===norm(name))||local.find(x=>norm(x.name)===norm(name));show(name,match?.country||match?.code||'',{live:true})});
 form.addEventListener('submit',event=>{event.preventDefault();const name=input.value.trim();if(name.length<2)return;const match=market.find(x=>norm(x.name)===norm(name))||local.find(x=>norm(x.name)===norm(name));show(name,match?.countryCode||'')});
 document.getElementById('roster-import-file')?.addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{const data=await readUpload(file);input.value=data.club;render(data)}catch(err){document.getElementById('roster-status').textContent=String(err.message||err)}e.target.value=''});
 document.getElementById('roster-export-template')?.addEventListener('click',()=>download(toCSV([['club','name','number','position','country','rating','nationalCode'],['Clube exemplo','Jogador exemplo','10','MEI','Brasil','78','BR']]),'modelo-elenco-btl.csv','text/csv;charset=utf-8'));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.BTLRosterHub={getRoster,show,lookupPlayer:key=>players.get(norm(key))||null,parseCsv:simpleCsv,normalizeRoster};
})();
