const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);
const STORAGE_KEY = window.BTLAuth?.getGameStorageKey?.() || 'beTheLegendV95';
const HALL_RESET_KEY = 'beTheLegendV95HallReset';
const HALL_RESET_V101_KEY = 'beTheLegendV101HallReset';
const HALL_RESET_V104_KEY = 'beTheLegendV104HallReset';
const LEGACY_STORAGE_KEY = 'careerSimV7';
const LEGACY_V103_CLAIM_KEY = 'beTheLegendV103LegacyClaimed';
const LEGACY_V95_FOR_MIGRATION = window.BTLAuth?.getCurrentAccount?.() && !localStorage.getItem(LEGACY_V103_CLAIM_KEY) ? localStorage.getItem('beTheLegendV95') : null;
const BADGE_KEY = 'beTheLegendBadgeCacheV22Static';
const DRAFT_KEY = 'beTheLegendV92AttributeDraft';
const PREVIOUS_DRAFT_KEY = 'beTheLegendV91AttributeDraft';

let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || LEGACY_V95_FOR_MIGRATION || localStorage.getItem('beTheLegendV92') || localStorage.getItem('beTheLegendV91') || localStorage.getItem('beTheLegendV90') || localStorage.getItem('beTheLegendV89') || localStorage.getItem('beTheLegendV88') || localStorage.getItem('beTheLegendV87') || localStorage.getItem('beTheLegendV86') || localStorage.getItem('beTheLegendV85') || localStorage.getItem('beTheLegendV84') || localStorage.getItem('beTheLegendV83') || localStorage.getItem('beTheLegendV82') || localStorage.getItem('beTheLegendV81') || localStorage.getItem('beTheLegendV80') || localStorage.getItem('beTheLegendV79') || localStorage.getItem('beTheLegendV781') || localStorage.getItem('beTheLegendV78') || localStorage.getItem('beTheLegendV77') || localStorage.getItem('beTheLegendV76') || localStorage.getItem('careerSimV75') || localStorage.getItem('careerSimV72') || localStorage.getItem(LEGACY_STORAGE_KEY)) || {
  created:false, player:null, season:null, history:[], offers:[], news:[], pendingEvent:null, savedCareers:[]
};
let badgeCache = JSON.parse(localStorage.getItem(BADGE_KEY) || '{}');
let creationClubPool = [];
let creationChoices = [];
let creationClubRerollsRemaining = 3;
let creationSeenClubs = new Set();
let appearanceStudioTab = 'hair';
let careerAppearanceTab = 'hair';
let careerAppearanceDraft = null;
let creationPhotoDataUrl = '';
let leaderboardMode = 'goals';
let leaderboardCompetition = null;
let nextEventCache = null;
const INTERACTION_FREQUENCY = 0.765; // 10% menos interrupções em relação ao balanceamento anterior (0,85)
const MATCH_DECISION_FREQUENCY_MULT = 1.2;
const CAREER_EVENT_FREQUENCY_MULT = 0.8;
let pausedCareerOverlay = null;
let pendingSeasonCelebration = null;
let pendingPlayerProfile = null;
let attributeDraft = null;
let pendingCareerCard = false;
let awardCeremonyQueue = [];
let awardCeremonyAfter = null;
let celebrationAfter = null;
const MAX_MARKET_VALUE = 300000000;
const MAX_SEASON_GA = 145;
const MAX_CAREER_SEASONS = 24; // safety limit; age 36–40 determines normal retirement
const MIN_START_AGE = 17;
const MAX_START_AGE = 22;
try{
  const savedDraft=JSON.parse(sessionStorage.getItem(DRAFT_KEY)||sessionStorage.getItem(PREVIOUS_DRAFT_KEY)||'null');
  if(savedDraft?.attributeDraft&&savedDraft?.pendingPlayerProfile){attributeDraft=savedDraft.attributeDraft;pendingPlayerProfile=savedDraft.pendingPlayerProfile;}
}catch(_){sessionStorage.removeItem(DRAFT_KEY);}
function saveDraftState(){
  if(attributeDraft&&pendingPlayerProfile)sessionStorage.setItem(DRAFT_KEY,JSON.stringify({attributeDraft,pendingPlayerProfile}));
  else sessionStorage.removeItem(DRAFT_KEY);
}
function clearDraftState(){sessionStorage.removeItem(DRAFT_KEY);sessionStorage.removeItem(PREVIOUS_DRAFT_KEY);}

const DEFAULT_THEME = {accent:'#42e88d',secondary:'#f4f7f5',bg:'#071016',panel:'#0d1820',panel2:'#111f29',border:'#243640',buttonText:'#032313'};

// Large worlds live in IndexedDB; localStorage contains the career metadata only.
// Small legacy worlds remain inline as a backward-compatible fallback.
let worldRestorePromise=null,careerWorldLoading=false;
let worldStoreReady=false,worldDirty=Array.isArray(state.worldPlayers)&&state.worldPlayers.length>900&&!state.worldDbKey,worldPersistChain=Promise.resolve(),worldStoreError='';
function save(){
  const largeWorld=Array.isArray(state.worldPlayers)&&state.worldPlayers.length>900;
  if(largeWorld)state.worldDbKey=STORAGE_KEY;
  const serialized=JSON.stringify(state,(key,value)=>key==='worldPlayers'&&largeWorld?undefined:value);
  localStorage.setItem(STORAGE_KEY,serialized);
  if(worldDirty&&worldStoreReady&&window.BTLWorldCareer){
    worldDirty=false;
    const snapshot=state.worldPlayers,metadata=state.worldDataset||{};
    worldPersistChain=worldPersistChain.catch(()=>{}).then(()=>window.BTLWorldCareer.persist(STORAGE_KEY,snapshot,metadata)).catch(err=>{worldDirty=true;worldStoreError=String(err?.message||err);console.error('Falha ao gravar mundo de jogadores:',err)});
  }
}
async function loadPersistedWorld(){
  if(!window.BTLWorldCareer)return;
  const loadingState=state;
  try{
    const saved=await window.BTLWorldCareer.restore(STORAGE_KEY);
    if(state!==loadingState){worldStoreReady=true;if(worldDirty)save();return;}
    if(saved?.players?.length&&(!state.worldPlayers?.length||state.worldDbKey)){
      state.worldPlayers=saved.players;state.worldDataset=saved.meta||state.worldDataset||{};
    }
    worldStoreReady=true;
    if(worldDirty)save();
    renderWorldOverview();
  }catch(e){worldStoreError=String(e?.message||e);worldStoreReady=false;console.warn('Banco de elencos indisponível:',e)}
}

function saveBadges(){ localStorage.setItem(BADGE_KEY, JSON.stringify(badgeCache)); }
const badBadgeUrls=new Set();
const badgeRequestsInFlight=new Map();
function dropBadgeUrl(url){
  if(!url)return;badBadgeUrls.add(url);
  for(const [key,stored] of Object.entries(badgeCache))if(stored===url)delete badgeCache[key];
  saveBadges();
}

function badgeCacheKeys(name,countryCode=''){ const code=countryCode||canonicalClubCountryCode(name,''); return [code?`${code}:${name}`:name]; }
function getCachedBadge(name,countryCode=''){ const url=safeBadgeImage(window.BTLStaticCrests?.resolve(name,countryCode||canonicalClubCountryCode(name,''))||''); return url&&!badBadgeUrls.has(url)?url:''; }
function setCachedBadge(name,countryCode='',url=''){ const expected=getCachedBadge(name,countryCode); if(!expected||safeBadgeImage(url)!==expected)return ''; for(const key of badgeCacheKeys(name,countryCode))badgeCache[key]=expected; saveBadges();return expected; }
// V16: FIFA/ESPN/API-Sports never supply visible club crests.
// Only Wikimedia Commons file CDN images may enter the badge cache.
window.BTLRegisterVerifiedCrest=()=>false; // External badge registration disabled in static-only mode
function rnd(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function sample(array,count){ return [...array].sort(()=>Math.random()-.5).slice(0,count); }
function shuffle(array){ return [...array].sort(()=>Math.random()-.5); }
function clamp(n,min,max){ return Math.max(min,Math.min(max,n)); }
function marketValue(v){ return clamp(Math.round(v),150000,MAX_MARKET_VALUE); }
const MARKET_VALUE_CURVE=[[68,1100000],[72,3500000],[75,8000000],[78,16000000],[80,25000000],[82,36000000],[84,52000000],[86,72000000],[88,100000000],[90,140000000],[92,190000000],[94,240000000],[96,280000000],[99,300000000]];
function interpolatedMarketBase(overall=68){
  const o=clamp(Number(overall)||68,60,99);if(o<=MARKET_VALUE_CURVE[0][0])return MARKET_VALUE_CURVE[0][1]*Math.max(.25,1-(MARKET_VALUE_CURVE[0][0]-o)*.09);
  for(let i=1;i<MARKET_VALUE_CURVE.length;i++){const [hiO,hiV]=MARKET_VALUE_CURVE[i],[loO,loV]=MARKET_VALUE_CURVE[i-1];if(o<=hiO){const t=(o-loO)/(hiO-loO);return loV+(hiV-loV)*t;}}
  return MAX_MARKET_VALUE;
}
function ageMarketMultiplier(age=24,potential=80,overall=80){
  const a=Number(age)||24,gap=Math.max(0,(Number(potential)||overall)-overall);
  if(a<=18)return .72+Math.min(.16,gap*.012);if(a===19)return .80+Math.min(.14,gap*.01);if(a===20)return .87+Math.min(.12,gap*.009);if(a===21)return .93+Math.min(.10,gap*.008);if(a===22)return .99;if(a===23)return 1.03;if(a<=26)return 1.05;if(a===27)return 1.02;if(a===28)return .97;if(a===29)return .91;if(a===30)return .84;if(a===31)return .76;if(a===32)return .68;if(a===33)return .60;return .52;
}
function marketTargetForPlayer(p=state.player,formRating=null){
  if(!p)return 1100000;const overall=Number(p.overall)||68,potential=Number(p.potential)||overall;
  const base=interpolatedMarketBase(overall),ageMult=ageMarketMultiplier(p.age,potential,overall),potentialMult=1+clamp((potential-overall)*.012,0,.14);
  const strength=Number(p.clubStrength)||((p.club&&p.clubCountry)?clubStrength(p.club,p.clubCountry):76),clubMult=clamp(.90+(strength-75)*.006,.90,1.08),repMult=clamp(.95+((Number(p.reputation)||10)-20)*.0015,.93,1.07);
  const formMult=formRating==null?1:clamp(.96+(Number(formRating)-7)*.045,.93,1.08);
  return marketValue(base*ageMult*potentialMult*clubMult*repMult*formMult);
}
function rebalanceMarketValue(p=state.player,blend=.18,formRating=null){
  if(!p)return 0;const target=marketTargetForPlayer(p,formRating),current=Number(p.value)||target;
  const floor=target*.94;return marketValue(Math.max(current*(1-blend)+target*blend, current<target*.7?floor:0));
}
function money(v){ return '€ ' + (v >= 1e6 ? (v/1e6).toFixed(1)+' mi' : Math.round(v/1000)+' mil'); }
function toast(msg){ const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2800); }
function countryByCode(code){ return COUNTRIES.find(c=>c.code===code); }
const FLAG_CDN_SPECIAL={ENG:'gb-eng',SCO:'gb-sct',WAL:'gb-wls',NIR:'gb-nir'};
function flagAssetCode(code=''){return FLAG_CDN_SPECIAL[code]||String(code).toLowerCase();}
function nationalFlagImage(code,name=''){
  const label=name||countryByCode(code)?.name||code;
  const src=`https://flagcdn.com/${flagAssetCode(code)}.svg`,fallback=countryFlag(code)||'🏳️';
  return `<span class="national-flag-image" title="${esc(label)}"><b aria-hidden="true">${fallback}</b><img src="${src}" alt="Bandeira de ${esc(label)}" loading="eager" referrerpolicy="no-referrer" onerror="this.remove()"></span>`;
}


/* V10.4: substitui o popup nativo dos <select> por um menu próprio do jogo.
   O <select> original continua sendo a fonte de verdade, então toda a lógica
   existente (value/change/required) permanece compatível. */
let activeCustomSelect=null;
let customSelectPopover=null;
function syncCustomSelect(select){
  if(!select?.dataset?.btlSelectEnhanced)return;
  const shell=select.closest('.btl-select-shell'),trigger=shell?.querySelector('.btl-select-trigger');if(!trigger)return;
  const option=select.options?.[select.selectedIndex]||select.options?.[0];
  const label=option?.textContent?.trim()||'Selecione';
  const idol=select.id==='idol'&&option?.value?idolById(option.value):null;
  const flag=select.id==='nationality'&&option?.value?nationalFlagImage(option.value,countryByCode(option.value)?.name||label):idol?nationalFlagImage(idol.code,idol.country):'';
  trigger.querySelector('.btl-select-value').innerHTML=`${flag?`<span class="btl-select-flag" aria-hidden="true">${flag}</span>`:''}<span>${esc(label)}</span>`;
  trigger.classList.toggle('is-placeholder',!option?.value);
  trigger.disabled=!!select.disabled;
  trigger.setAttribute('aria-expanded',activeCustomSelect===select?'true':'false');
}
function syncCustomSelects(){document.querySelectorAll('select[data-btl-select-enhanced="1"]').forEach(syncCustomSelect);}
function closeCustomSelect(){
  if(customSelectPopover)customSelectPopover.classList.add('hidden');
  if(activeCustomSelect){activeCustomSelect.closest('.btl-select-shell')?.classList.remove('open');activeCustomSelect=null;}
  syncCustomSelects();
}
function customSelectOptionRows(select,query=''){
  const q=normalizeKey(query||'');let html='',lastGroup='';
  [...select.options].forEach((option,index)=>{
    const label=option.textContent?.trim()||'',group=option.parentElement?.tagName==='OPTGROUP'?option.parentElement.label:'';
    if(q&&!normalizeKey(`${label} ${group}`).includes(q))return;
    if(group&&group!==lastGroup){html+=`<div class="btl-select-group">${esc(group)}</div>`;lastGroup=group;}
    const selected=index===select.selectedIndex,idol=select.id==='idol'&&option.value?idolById(option.value):null;
    const flag=select.id==='nationality'&&option.value?nationalFlagImage(option.value,countryByCode(option.value)?.name||label):idol?nationalFlagImage(idol.code,idol.country):'';
    html+=`<button type="button" class="btl-select-option ${selected?'selected':''} ${!option.value?'placeholder-option':''}" data-option-index="${index}" ${option.disabled?'disabled':''}><span class="btl-select-option-mark">${selected?'✓':''}</span>${flag?`<span class="btl-select-option-flag" aria-hidden="true">${flag}</span>`:''}<span>${esc(label)}</span></button>`;
  });
  return html||'<div class="btl-select-empty">Nenhuma opção encontrada.</div>';
}
function positionCustomSelectPopover(select){
  if(!customSelectPopover||!select)return;const trigger=select.closest('.btl-select-shell')?.querySelector('.btl-select-trigger');if(!trigger)return;
  const rect=trigger.getBoundingClientRect(),margin=10,spaceBelow=window.innerHeight-rect.bottom-margin,spaceAbove=rect.top-margin,maxH=Math.min(390,Math.max(190,Math.max(spaceBelow,spaceAbove)));
  const openAbove=spaceBelow<220&&spaceAbove>spaceBelow;
  customSelectPopover.style.width=`${Math.max(220,Math.min(rect.width,window.innerWidth-margin*2))}px`;
  customSelectPopover.style.maxHeight=`${maxH}px`;
  customSelectPopover.style.left=`${Math.max(margin,Math.min(rect.left,window.innerWidth-customSelectPopover.offsetWidth-margin))}px`;
  customSelectPopover.style.top=openAbove?'auto':`${Math.min(window.innerHeight-margin,rect.bottom+6)}px`;
  customSelectPopover.style.bottom=openAbove?`${Math.max(margin,window.innerHeight-rect.top+6)}px`:'auto';
}
function openCustomSelect(select){
  if(!select||select.disabled)return;if(activeCustomSelect===select){closeCustomSelect();return;}closeCustomSelect();activeCustomSelect=select;
  if(!customSelectPopover){customSelectPopover=document.createElement('div');customSelectPopover.id='btl-select-popover';customSelectPopover.className='btl-select-popover hidden';document.body.appendChild(customSelectPopover);}
  const searchable=select.options.length>12;
  customSelectPopover.innerHTML=`${searchable?'<div class="btl-select-search-wrap"><span>⌕</span><input class="btl-select-search" type="search" autocomplete="off" placeholder="Buscar opção…" aria-label="Buscar opção"></div>':''}<div class="btl-select-options" role="listbox"></div>`;
  const list=customSelectPopover.querySelector('.btl-select-options'),renderOptions=(query='')=>{list.innerHTML=customSelectOptionRows(select,query);list.querySelectorAll('.btl-select-option').forEach(btn=>btn.addEventListener('click',()=>{const option=select.options[Number(btn.dataset.optionIndex)];if(!option||option.disabled)return;select.selectedIndex=Number(btn.dataset.optionIndex);select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));syncCustomSelect(select);closeCustomSelect();select.closest('.btl-select-shell')?.querySelector('.btl-select-trigger')?.focus();}));};
  renderOptions();customSelectPopover.classList.remove('hidden');select.closest('.btl-select-shell')?.classList.add('open');syncCustomSelect(select);positionCustomSelectPopover(select);
  const search=customSelectPopover.querySelector('.btl-select-search');if(search){search.addEventListener('input',()=>renderOptions(search.value));requestAnimationFrame(()=>search.focus());}else requestAnimationFrame(()=>customSelectPopover.querySelector('.btl-select-option.selected')?.scrollIntoView({block:'nearest'}));
}
function enhanceSelect(select){
  if(!select||select.dataset.btlSelectEnhanced)return;select.dataset.btlSelectEnhanced='1';select.classList.add('btl-native-select');select.tabIndex=-1;select.setAttribute('aria-hidden','true');
  const shell=document.createElement('div');shell.className='btl-select-shell';select.parentNode.insertBefore(shell,select);shell.appendChild(select);
  const trigger=document.createElement('button');trigger.type='button';trigger.className='btl-select-trigger';trigger.setAttribute('aria-haspopup','listbox');trigger.innerHTML='<span class="btl-select-value"></span><span class="btl-select-chevron" aria-hidden="true">⌄</span>';shell.appendChild(trigger);
  trigger.addEventListener('click',()=>openCustomSelect(select));select.addEventListener('change',()=>syncCustomSelect(select));
  new MutationObserver(()=>syncCustomSelect(select)).observe(select,{childList:true,subtree:true,attributes:true,characterData:true});syncCustomSelect(select);
}
function enhanceAllSelects(root=document){root.querySelectorAll('select').forEach(enhanceSelect);}
document.addEventListener('pointerdown',e=>{if(activeCustomSelect&&!e.target.closest('.btl-select-popover')&&!e.target.closest('.btl-select-shell'))closeCustomSelect();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&activeCustomSelect){e.preventDefault();e.stopImmediatePropagation();closeCustomSelect();}},true);
window.addEventListener('resize',()=>{closeCustomSelect();syncViewportMetrics();});window.addEventListener('scroll',()=>{if(activeCustomSelect)positionCustomSelectPopover(activeCustomSelect);},true);

const SOUNDTRACK_KEY='beTheLegendSoundtrackV2';
const SOUNDTRACK_LEGACY_KEY='beTheLegendSoundtrackV1';
const FIFA_SOUNDTRACK=[
  {id:'f14-love-me-again',fifa:14,title:'Love Me Again',artist:'John Newman',bundled:true},
  {id:'f14-dreaming',fifa:14,title:'Dreaming',artist:'Smallpools',bundled:true},
  {id:'f14-alive',fifa:14,title:'Alive',artist:'Empire of the Sun',bundled:true},
  {id:'f15-the-nights',fifa:15,title:'The Nights',artist:'Avicii',bundled:true},
  {id:'f15-walk',fifa:15,title:'Walk',artist:'Kwabs',bundled:true},
  {id:'f15-my-type',fifa:15,title:'My Type',artist:'Saint Motel',bundled:true},
  {id:'f16-mountain',fifa:16,title:'Mountain At My Gates',artist:'Foals',bundled:true},
  {id:'f16-trip-switch',fifa:16,title:'Trip Switch',artist:'Nothing But Thieves',bundled:true},
  {id:'f16-shine-a-light',fifa:16,title:'Shine A Light',artist:'BANNERS',bundled:true},
  {id:'f17-send-them-off',fifa:17,title:'Send Them Off!',artist:'Bastille',bundled:true},
  {id:'f17-are-we-ready',fifa:17,title:'Are We Ready? (Wreck)',artist:'Two Door Cinema Club',bundled:true},
  {id:'f17-youth',fifa:17,title:'Youth',artist:'Glass Animals',bundled:true},
  {id:'f18-deadcrush',fifa:18,title:'Deadcrush (Spike Stent Mix)',artist:'alt-J',bundled:true},
  {id:'f18-supercut',fifa:18,title:'Supercut',artist:'Lorde',bundled:true},
  {id:'f18-live-in-the-moment',fifa:18,title:'Live in the Moment',artist:'Portugal. The Man',bundled:true},
  {id:'f19-genius',fifa:19,title:'Genius',artist:'LSD (Labrinth, Sia & Diplo)',bundled:true},
  {id:'f19-feels-like-summer',fifa:19,title:'Feels Like Summer',artist:'Childish Gambino',bundled:true},
  {id:'f19-crown',fifa:19,title:'you should see me in a crown',artist:'Billie Eilish',bundled:true},
  {id:'f20-runner',fifa:20,title:'The Runner',artist:'Foals',bundled:true},
  {id:'f20-phone-numbers',fifa:20,title:'Phone Numbers',artist:'Dominic Fike & Kenny Beats',bundled:true},
  {id:'f20-yo-x-ti',fifa:20,title:'Yo x Ti, Tu x Mi',artist:'ROSALÍA & Ozuna',bundled:true},
  {id:'f21-heat-waves',fifa:21,title:'Heat Waves',artist:'Glass Animals',bundled:true},
  {id:'f21-is-it-true',fifa:21,title:'Is It True',artist:'Tame Impala',bundled:true},
  {id:'f21-window',fifa:21,title:'Window',artist:'Still Woozy',bundled:true},
  {id:'f22-landline',fifa:22,title:'Landline',artist:'binki',bundled:true},
  {id:'f22-feet',fifa:22,title:"Feet Don't Fail Me Now",artist:'Joy Crookes',bundled:true},
  {id:'f22-forever-more',fifa:22,title:'forever&more',artist:'ROLE MODEL',bundled:true},
  {id:'f23-alpha-zulu',fifa:23,title:'Alpha Zulu',artist:'Phoenix',bundled:true},
  {id:'f23-the-mission',fifa:23,title:'The Mission',artist:'Bakar',bundled:true},
  {id:'f23-drive',fifa:23,title:'Drive',artist:'moa moa',bundled:true}
];
const defaultSoundtrackSettings=()=>({enabled:true,shuffle:true,volume:.38,selected:FIFA_SOUNDTRACK.map(t=>t.id),order:FIFA_SOUNDTRACK.map(t=>t.id),currentId:null,wasPlaying:false});
let soundtrackSettings=(()=>{
  try{
    const current=localStorage.getItem(SOUNDTRACK_KEY);
    if(current)return {...defaultSoundtrackSettings(),...JSON.parse(current)};
    const legacy=JSON.parse(localStorage.getItem(SOUNDTRACK_LEGACY_KEY)||'{}');
    return {...defaultSoundtrackSettings(),enabled:legacy.enabled??true,shuffle:legacy.shuffle??true,volume:Number.isFinite(Number(legacy.volume))?Number(legacy.volume):.38};
  }catch(_){return defaultSoundtrackSettings()}
})();
let soundtrackAudio=null;
let soundtrackPreviewCache=new Map();
let soundtrackResolving=false;
let soundtrackSourceKind='prévia';
let soundtrackCurrentObjectUrl=null;
let soundtrackImportedIds=new Set();
let soundtrackImportTarget=null;
const SOUNDTRACK_DB='beTheLegendAudioV1';
const SOUNDTRACK_STORE='tracks';
function saveSoundtrackSettings(){localStorage.setItem(SOUNDTRACK_KEY,JSON.stringify(soundtrackSettings));}
function esc(value=''){return String(value).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));}
const DEFAULT_APPEARANCE={hairEnabled:true,hairStyle:'fade',hairColor:'#17120f',beardEnabled:false,beardStyle:'stubble',skin:'skin-3',faceShape:'oval',eyeColor:'#433021',eyeShape:'almond',brows:'natural',nose:'straight',mouth:'neutral',photoDataUrl:''};
const APPEARANCE_MENU=[
  {key:'appearance-hair-enabled',label:'Cabelo',type:'toggle',options:[{value:'yes',label:'Com cabelo'},{value:'no',label:'Careca'}]},
  {key:'appearance-hair-style',label:'Estilo do cabelo',type:'grid',options:[{value:'fade',label:'Degradê'},{value:'short',label:'Curto'},{value:'curly',label:'Cacheado'},{value:'afro',label:'Afro'},{value:'mohawk',label:'Moicano'},{value:'long',label:'Longo'}]},
  {key:'appearance-hair-color',label:'Cor do cabelo',type:'swatches',options:[{value:'#17120f',label:'Preto'},{value:'#4b2e1f',label:'Castanho'},{value:'#d5b56a',label:'Loiro'},{value:'#8f3f23',label:'Ruivo'},{value:'#8d9298',label:'Grisalho'}]},
  {key:'appearance-beard-enabled',label:'Barba',type:'toggle',options:[{value:'no',label:'Sem barba'},{value:'yes',label:'Com barba'}]},
  {key:'appearance-beard-style',label:'Estilo de barba',type:'grid',options:[{value:'stubble',label:'Por fazer'},{value:'goatee',label:'Cavanhaque'},{value:'full',label:'Cheia'},{value:'mustache',label:'Bigode'}]},
  {key:'appearance-skin',label:'Tom de pele',type:'swatches',options:[{value:'skin-2',label:'Claro',tone:'#f0c6a6'},{value:'skin-3',label:'Médio',tone:'#c98965'},{value:'skin-4',label:'Moreno',tone:'#9a6348'},{value:'skin-5',label:'Escuro',tone:'#68402f'}]},
  {key:'appearance-face-shape',label:'Formato do rosto',type:'grid',options:[{value:'oval',label:'Oval'},{value:'square',label:'Quadrado'},{value:'round',label:'Redondo'},{value:'slim',label:'Fino'}]},
  {key:'appearance-eye-color',label:'Cor dos olhos',type:'swatches',options:[{value:'#433021',label:'Castanho'},{value:'#75a3ac',label:'Azul'},{value:'#528263',label:'Verde'},{value:'#ad8153',label:'Mel'}]},
  {key:'appearance-eye-shape',label:'Formato dos olhos',type:'grid',options:[{value:'almond',label:'Amendoados'},{value:'round',label:'Arredondados'},{value:'narrow',label:'Estreitos'}]},
  {key:'appearance-brows',label:'Sobrancelhas',type:'grid',options:[{value:'natural',label:'Naturais'},{value:'thick',label:'Marcadas'},{value:'arched',label:'Arqueadas'}]},
  {key:'appearance-nose',label:'Nariz',type:'grid',options:[{value:'straight',label:'Reto'},{value:'broad',label:'Largo'},{value:'small',label:'Curto'}]},
  {key:'appearance-mouth',label:'Expressão',type:'grid',options:[{value:'neutral',label:'Natural'},{value:'smile',label:'Sorriso'},{value:'serious',label:'Séria'}]}
];
const SPONSOR_BRANDS=[
  {name:'Nike',tone:'sponsor-nike',base:1450000,minOverall:85,minClubStrength:84,minReputation:48,tier:'global'},
  {name:'adidas',tone:'sponsor-adidas',base:1400000,minOverall:85,minClubStrength:84,minReputation:48,tier:'global'},
  {name:'PUMA',tone:'sponsor-puma',base:1220000,minOverall:82,minClubStrength:81,minReputation:38,tier:'global'},
  {name:'New Balance',tone:'sponsor-newbalance',base:980000,minOverall:78,minClubStrength:76,minReputation:26,tier:'major'},
  {name:'Under Armour',tone:'sponsor-underarmour',base:880000,minOverall:76,minClubStrength:74,minReputation:22,tier:'major'},
  {name:'Mizuno',tone:'sponsor-mizuno',base:790000,minOverall:72,minClubStrength:68,minReputation:14,tier:'regional'},
  {name:'Umbro',tone:'sponsor-umbro',base:720000,minOverall:70,minClubStrength:66,minReputation:12,tier:'regional'}
];
// Ídolos escolhidos no início da carreira. Eles funcionam como mentores narrativos:
// as interações trazem escolhas e efeitos, mas não entregam bônus automáticos.
const IDOL_POOL=[
  {id:'pele',name:'Pelé',country:'Brasil',code:'BR',role:'Rei do futebol',style:'decisão e grandeza'},
  {id:'neymar',name:'Neymar',country:'Brasil',code:'BR',role:'Camisa 10',style:'criatividade e personalidade'},
  {id:'ronaldo',name:'Ronaldo Fenômeno',country:'Brasil',code:'BR',role:'Centroavante',style:'explosão e frieza'},
  {id:'ronaldinho',name:'Ronaldinho Gaúcho',country:'Brasil',code:'BR',role:'Meia-atacante',style:'improviso e alegria'},
  {id:'kaka',name:'Kaká',country:'Brasil',code:'BR',role:'Meia',style:'arranque e profissionalismo'},
  {id:'romario',name:'Romário',country:'Brasil',code:'BR',role:'Centroavante',style:'posicionamento e confiança'},
  {id:'zico',name:'Zico',country:'Brasil',code:'BR',role:'Meia',style:'técnica e bola parada'},
  {id:'adriano',name:'Adriano Imperador',country:'Brasil',code:'BR',role:'Centroavante',style:'força e finalização'},
  {id:'vinijr',name:'Vini Jr.',country:'Brasil',code:'BR',role:'Ponta',style:'velocidade e coragem'},
  {id:'raphinha',name:'Raphinha',country:'Brasil',code:'BR',role:'Ponta',style:'intensidade e agressividade'},
  {id:'rodrygo',name:'Rodrygo',country:'Brasil',code:'BR',role:'Atacante',style:'versatilidade e decisão'},
  {id:'cristiano',name:'Cristiano Ronaldo',country:'Portugal',code:'PT',role:'Atacante',style:'obsessão competitiva e finalização'},
  {id:'messi',name:'Lionel Messi',country:'Argentina',code:'AR',role:'Atacante',style:'visão e condução'},
  {id:'maradona',name:'Diego Maradona',country:'Argentina',code:'AR',role:'Camisa 10',style:'liderança e genialidade'},
  {id:'dybala',name:'Paulo Dybala',country:'Argentina',code:'AR',role:'Segundo atacante',style:'técnica e criatividade'},
  {id:'suarez',name:'Luis Suárez',country:'Uruguai',code:'UY',role:'Centroavante',style:'movimentação e competitividade'},
  {id:'hazard',name:'Eden Hazard',country:'Bélgica',code:'BE',role:'Ponta',style:'drible e aceleração'},
  {id:'neuer',name:'Manuel Neuer',country:'Alemanha',code:'DE',role:'Goleiro',style:'leitura e liderança'},
  {id:'gerd-muller',name:'Gerd Müller',country:'Alemanha',code:'DE',role:'Centroavante',style:'instinto de gol'},
  {id:'zidane',name:'Zinedine Zidane',country:'França',code:'FR',role:'Meia',style:'controle e elegância'},
  {id:'mbappe',name:'Kylian Mbappé',country:'França',code:'FR',role:'Atacante',style:'velocidade e ambição'},
  {id:'cruyff',name:'Johan Cruyff',country:'Países Baixos',code:'NL',role:'Atacante',style:'inteligência e espaço'},
  {id:'iniesta',name:'Andrés Iniesta',country:'Espanha',code:'ES',role:'Meia',style:'controle e decisão'},
  {id:'xavi',name:'Xavi Hernández',country:'Espanha',code:'ES',role:'Meia',style:'passe e leitura'},
  {id:'modric',name:'Luka Modrić',country:'Croácia',code:'HR',role:'Meia',style:'ritmo e resistência'},
  {id:'henry',name:'Thierry Henry',country:'França',code:'FR',role:'Atacante',style:'movimentação e finalização'},
  {id:'buffon',name:'Gianluigi Buffon',country:'Itália',code:'IT',role:'Goleiro',style:'longevidade e liderança'},
  {id:'ibrahimovic',name:'Zlatan Ibrahimović',country:'Suécia',code:'SE',role:'Centroavante',style:'confiança e técnica'},
  {id:'salah',name:'Mohamed Salah',country:'Egito',code:'EG',role:'Ponta',style:'movimentação e finalização'},
  {id:'debruyne',name:'Kevin De Bruyne',country:'Bélgica',code:'BE',role:'Meia',style:'passe vertical e criação'}
];
function idolById(id){return IDOL_POOL.find(x=>x.id===id)||null;}
function idolInitials(name=''){return name.split(/\s+/).filter(Boolean).map(x=>x[0]).join('').slice(0,2).toUpperCase();}
function isWorldCupYear(year){return Number(year)%4===2;}
function normalizeAppearance(a={}){const rawPhoto=String(a?.photoDataUrl||'');const photoDataUrl=/^data:image\/(?:jpeg|png|webp);base64,/i.test(rawPhoto)?rawPhoto:'';return {...DEFAULT_APPEARANCE,...a,photoDataUrl,hairEnabled:a.hairEnabled!==false,beardEnabled:!!a.beardEnabled};}
function currentAppearanceFromForm(){
  return normalizeAppearance({
    hairEnabled:$('#appearance-hair-enabled')?.value!=='no',
    hairStyle:$('#appearance-hair-style')?.value||'fade',
    hairColor:$('#appearance-hair-color')?.value||'#17120f',
    beardEnabled:$('#appearance-beard-enabled')?.value==='yes',
    beardStyle:$('#appearance-beard-style')?.value||'stubble',
    skin:$('#appearance-skin')?.value||'skin-3',
    faceShape:$('#appearance-face-shape')?.value||'oval',eyeColor:$('#appearance-eye-color')?.value||'#433021',eyeShape:$('#appearance-eye-shape')?.value||'almond',brows:$('#appearance-brows')?.value||'natural',nose:$('#appearance-nose')?.value||'straight',mouth:$('#appearance-mouth')?.value||'neutral',
    photoDataUrl:creationPhotoDataUrl
  });
}
let faceSvgSequence=0;
function appearanceMarkup(appearance=DEFAULT_APPEARANCE,compact=false,number='10'){
  const a=normalizeAppearance(appearance);
  if(a.photoDataUrl)return `<div class="player-photo ${compact?'compact':''}"><img src="${esc(a.photoDataUrl)}" alt="Foto do jogador"></div>`;
  const id=`face${++faceSvgSequence}`,skins={'skin-2':['#f8d3b6','#c99776','#a87455'],'skin-3':['#d9a27b','#ae704e','#8f583e'],'skin-4':['#aa7555','#7e4d38','#613728'],'skin-5':['#80543f','#593526','#432519']};
  const [skin,shadow,deep]=skins[a.skin]||skins['skin-3'];
  const colors=['#17120f','#4b2e1f','#d5b56a','#8f3f23','#8d9298'];
  const hair=colors.includes(a.hairColor)?a.hairColor:'#17120f';
  const eye=['#433021','#75a3ac','#528263','#ad8153'].includes(a.eyeColor)?a.eyeColor:'#433021';
  const shape={oval:'M66 74Q65 39 110 38Q155 39 154 74L151 122Q147 152 130 166Q110 180 90 166Q73 150 69 122Z',round:'M62 77Q60 39 110 39Q160 39 158 77L157 122Q148 170 110 174Q72 170 63 122Z',square:'M66 74Q64 41 110 39Q155 41 154 74L153 134Q150 150 133 165L87 165Q70 150 67 134Z',slim:'M72 76Q67 40 110 38Q153 40 148 76L143 122Q141 147 124 171L110 178L96 171Q79 147 77 122Z'}[a.faceShape]||'M66 74Q65 39 110 38Q155 39 154 74L151 122Q147 152 130 166Q110 180 90 166Q73 150 69 122Z';
  // Camadas de volume/luz e mechas individualizadas (SVG escalável e sem imagens externas).
  const strand=(d,w=2,alpha=.19)=>`<path d="${d}" stroke="url(#${id}hairLight)" stroke-width="${w}" opacity="${alpha}" fill="none" stroke-linecap="round"/>`;
  const curl=(x,y,r)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${id}hair)" stroke="${hair}" stroke-width="2"/>`;
  // V26: contornos bilateralmente equilibrados para não parecer raspado de um lado.
  // Todos os estilos compartilham a mesma linha central (x=110), sem esticar o rosto.
  const templeLeft=`<path d="M62 66Q56 87 65 109L78 108Q71 85 76 71Z" fill="url(#${id}hair)"/>`;
  const templeRight=`<path d="M158 66Q164 87 155 109L142 108Q149 85 144 71Z" fill="url(#${id}hair)"/>`;
  const curlsSymmetric=[[65,62,13],[78,43,13],[97,33,13],[110,31,13],[123,33,13],[142,43,13],[155,62,13],[77,67,11],[97,59,11],[110,57,12],[123,59,11],[143,67,11]].map(([x,y,r])=>curl(x,y,r)).join('');
  const hairShapes={
    fade:`<path d="M63 91Q52 65 63 44Q77 20 110 23Q143 20 157 44Q168 65 157 91L151 85Q151 63 133 54Q110 46 87 54Q69 63 69 85Z" fill="url(#${id}hair)"/>${templeLeft}${templeRight}<path d="M72 73Q77 53 92 51M148 73Q143 53 128 51" stroke="url(#${id}fade)" stroke-width="6" opacity=".62" fill="none"/>${strand('M76 46Q110 29 144 46',3,.28)}`,
    short:`<path d="M63 88Q54 64 63 42Q76 20 110 21Q144 20 157 42Q166 64 157 88L150 77Q149 60 134 56Q111 48 86 56Q71 60 70 77Z" fill="url(#${id}hair)"/>${templeLeft}${templeRight}${strand('M73 44Q110 26 147 44',3,.3)}${strand('M79 53Q110 43 141 53',1.7,.23)}`,
    curly:`<path d="M62 93Q48 65 62 44Q77 18 110 21Q143 18 158 44Q172 65 158 93L148 79Q133 67 110 68Q87 67 72 79Z" fill="url(#${id}hair)"/>${templeLeft}${templeRight}${curlsSymmetric}${strand('M81 39Q91 31 101 39M119 39Q129 31 139 39M94 54Q110 46 126 54',2,.26)}`,
    afro:`<path d="M52 101Q35 77 45 55Q43 30 64 24Q77 5 97 14Q110 0 123 14Q143 5 156 24Q177 30 175 55Q185 77 168 101L151 86Q129 72 110 75Q91 72 69 86Z" fill="url(#${id}hair)"/>${templeLeft}${templeRight}${[[54,64,17],[66,40,17],[86,25,18],[110,22,19],[134,25,18],[154,40,17],[166,64,17],[68,78,16],[87,55,17],[110,49,18],[133,55,17],[152,78,16]].map(([x,y,r])=>curl(x,y,r)).join('')}${strand('M68 44q7-7 15-2M137 42q8-5 15 2',2,.23)}`,
    mohawk:`<path d="M89 70L84 35L96 42L104 9L110 31L116 9L124 42L136 35L131 70Q110 60 89 70Z" fill="url(#${id}hair)"/>${strand('M100 31L105 55M120 31L115 55',2,.3)}<path d="M64 86Q59 65 83 57L91 72Q72 73 72 91Z" fill="url(#${id}fade)"/><path d="M156 86Q161 65 137 57L129 72Q148 73 148 91Z" fill="url(#${id}fade)"/>${templeLeft}${templeRight}`,
    long:`<path d="M58 90Q47 44 75 26Q90 15 110 17Q130 15 145 26Q173 44 162 90L176 187L150 176L148 87Q141 61 110 57Q79 61 72 87L70 176L44 187Z" fill="url(#${id}hair)"/>${templeLeft}${templeRight}${strand('M73 44Q110 22 147 44',3,.3)}${strand('M57 88Q62 126 54 167M163 88Q158 126 166 167',2,.22)}`
  };
  const eyebrows=a.brows==='arched'?['M79 92Q91 82 101 89','M119 89Q132 82 142 92']:a.brows==='thick'?['M79 90Q91 84 101 89','M119 89Q132 84 142 90']:['M80 92Q90 87 101 91','M119 91Q132 87 141 92'];
  const bw=a.brows==='thick'?5:3.5;
  const eyes=a.eyeShape==='round'?`<ellipse cx="91" cy="108" rx="8" ry="6" fill="#f8f3eb"/><ellipse cx="130" cy="108" rx="8" ry="6" fill="#f8f3eb"/>`:a.eyeShape==='narrow'?`<path d="M81 108Q91 104 101 108Q91 112 81 108M120 108Q130 104 140 108Q130 112 120 108" fill="#f8f3eb"/>`:`<path d="M81 109Q91 101 101 109Q91 116 81 109M120 109Q130 101 140 109Q130 116 120 109" fill="#f8f3eb"/>`;
  const nose=a.nose==='broad'?'M102 118L100 133Q108 140 120 133L118 118':'M110 116L106 132Q110 137 116 132';
  const mouth=a.mouth==='smile'?'M94 146Q110 161 127 146':a.mouth==='serious'?'M96 150Q109 148 125 150':'M96 148Q110 153 125 148';
  const beard=a.beardEnabled?({
   stubble:`<path d="M73 125Q78 163 110 175Q142 163 147 125Q133 164 110 163Q87 164 73 125Z" fill="${hair}" opacity=".19"/>`,
   goatee:`<path d="M100 150Q110 158 121 150L118 173Q109 185 103 171Z" fill="${hair}"/><path d="M99 141Q110 137 121 141" stroke="${hair}" stroke-width="3"/>`,
   mustache:`<path d="M92 141Q101 132 110 140Q119 132 128 141Q118 149 110 145Q102 149 92 141" fill="${hair}"/>`,
   full:`<path d="M73 117Q74 154 90 166L99 184Q110 191 121 184L130 166Q147 151 147 117L137 142Q132 161 110 169Q88 161 83 142Z" fill="${hair}"/><path d="M92 140Q102 134 110 140Q119 134 128 140Q120 149 110 145Q100 149 92 140" fill="${hair}"/>`
  }[a.beardStyle]||''):'';
  return `<div class="player-face-svg-wrap ${compact?'compact':''}"><svg class="player-face-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 250" role="img" aria-label="Avatar ilustrado personalizável do jogador"><defs><linearGradient id="${id}skin" x1=".15" y1=".08" x2=".95" y2=".85"><stop stop-color="${skin}"/><stop offset=".65" stop-color="${skin}"/><stop offset="1" stop-color="${shadow}"/></linearGradient><linearGradient id="${id}shirt" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e4ff79"/><stop offset="1" stop-color="#4bbc95"/></linearGradient><linearGradient id="${id}hair" x1="0" y1="0" x2=".9" y2="1"><stop stop-color="${hair}"/><stop offset=".38" stop-color="${hair}"/><stop offset=".75" stop-color="#080e14" stop-opacity=".32"/><stop offset="1" stop-color="${hair}"/></linearGradient><linearGradient id="${id}hairLight" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffffff" stop-opacity=".6"/><stop offset="1" stop-color="${hair}" stop-opacity=".5"/></linearGradient><linearGradient id="${id}fade"><stop stop-color="${hair}" stop-opacity=".35"/><stop offset="1" stop-color="${hair}"/></linearGradient><radialGradient id="${id}light"><stop stop-color="#68d5b8" stop-opacity=".17"/><stop offset="1" stop-color="#05161e" stop-opacity="0"/></radialGradient></defs>
    <rect width="220" height="250" fill="#0c222c"/><circle cx="110" cy="115" r="116" fill="url(#${id}light)"/>
    <path d="M10 250Q23 195 82 190L139 190Q197 197 210 250Z" fill="url(#${id}shirt)"/><path d="M67 195L110 233L153 195" fill="none" stroke="#ffffff" stroke-opacity=".24" stroke-width="4"/><path d="M89 170V201Q109 216 131 201V170" fill="${shadow}"/><path d="M98 189Q110 193 122 189" fill="none" stroke="${deep}" stroke-opacity=".25" stroke-width="5"/>
    <ellipse cx="68" cy="113" rx="10" ry="18" fill="${shadow}"/><ellipse cx="152" cy="113" rx="10" ry="18" fill="${shadow}"/><path d="${shape}" fill="url(#${id}skin)" stroke="${deep}" stroke-opacity=".4" stroke-width="1.4"/>
    <path d="M80 114Q87 123 98 117M122 117Q132 123 141 114" stroke="${deep}" stroke-opacity=".09" stroke-width="7" fill="none"/>
    ${a.hairEnabled?(hairShapes[a.hairStyle]||hairShapes.fade):''}
    <path d="${eyebrows[0]}" stroke="${hair}" stroke-width="${bw}" fill="none" stroke-linecap="round"/><path d="${eyebrows[1]}" stroke="${hair}" stroke-width="${bw}" fill="none" stroke-linecap="round"/>
    ${eyes}<circle cx="91" cy="109" r="${a.eyeShape==='narrow'?2.3:3.5}" fill="${eye}"/><circle cx="130" cy="109" r="${a.eyeShape==='narrow'?2.3:3.5}" fill="${eye}"/><circle cx="92" cy="108" r="1" fill="#fff"/><circle cx="131" cy="108" r="1" fill="#fff"/>
    <path d="${nose}" stroke="${deep}" stroke-width="2.7" fill="none" stroke-linecap="round" opacity=".55"/><path d="${mouth}" stroke="#754738" stroke-width="2.7" fill="none" stroke-linecap="round"/><path d="M102 156Q110 158 118 156" stroke="#fff" stroke-opacity=".18" stroke-width="2" fill="none"/>
    ${beard}<text x="110" y="241" text-anchor="middle" fill="#06302b" font-size="16" font-family="Orbitron, Arial, sans-serif" font-weight="900">${esc(String(number).slice(0,2))}</text></svg></div>`;
}

function updateAppearancePreview(){const box=$('#appearance-preview');if(box)box.innerHTML=appearanceMarkup(currentAppearanceFromForm(),false,$('#number')?.value||'10');$('#appearance-photo-remove')?.classList.toggle('hidden',!creationPhotoDataUrl);syncAppearanceStudio();syncCustomSelects();}
async function photoCropFrame(img){
  const width=img.naturalWidth,height=img.naturalHeight,fallbackSide=Math.min(width,height),fallback={sx:Math.max(0,(width-fallbackSide)/2),sy:Math.max(0,(height-fallbackSide)/2),side:fallbackSide,faceAware:false};
  if(!('FaceDetector' in window))return fallback;
  try{
    const detector=new FaceDetector({fastMode:true,maxDetectedFaces:3}),faces=await detector.detect(img);if(!faces?.length)return fallback;
    const face=faces.slice().sort((a,b)=>(b.boundingBox.width*b.boundingBox.height)-(a.boundingBox.width*a.boundingBox.height))[0]?.boundingBox;if(!face)return fallback;
    const side=Math.min(width,height,Math.max(face.width*2.75,face.height*3.25,Math.min(width,height)*.56));
    const centerX=face.x+face.width/2,centerY=face.y+face.height/2+face.height*.48;
    return {sx:clamp(centerX-side/2,0,Math.max(0,width-side)),sy:clamp(centerY-side*.45,0,Math.max(0,height-side)),side,faceAware:true};
  }catch(_){return fallback;}
}
function centerCropPhotoFile(file,size=384){
  return new Promise((resolve,reject)=>{if(!file||!/^image\/(jpeg|png|webp)$/i.test(file.type||''))return reject(new Error('Formato não suportado. Use JPG, PNG ou WebP.'));if(file.size>10*1024*1024)return reject(new Error('A imagem deve ter no máximo 10 MB.'));const reader=new FileReader();reader.onerror=()=>reject(new Error('Não foi possível ler a imagem.'));reader.onload=()=>{const img=new Image();img.onerror=()=>reject(new Error('Arquivo de imagem inválido.'));img.onload=async()=>{const {sx,sy,side}=await photoCropFrame(img);const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(img,sx,sy,side,side,0,0,size,size);resolve(canvas.toDataURL('image/webp',.86));};img.src=String(reader.result);};reader.readAsDataURL(file);});
}
function appearancePresetVisual(cfg,opt){
  if(cfg.key==='appearance-hair-style') return `<span class="preset-visual btl-hair-mini">${appearanceMarkup({...DEFAULT_APPEARANCE,hairStyle:opt.value,hairColor:$('#appearance-hair-color')?.value||'#17120f'},true,'10')}</span>`;
  if(cfg.key==='appearance-beard-style') return `<span class="preset-visual beard-preset beard-${opt.value}"><i></i></span>`;
  if(cfg.key==='appearance-skin') return `<span class="preset-visual skin-preset" style="--preset-skin:${opt.tone||opt.value}"></span>`;
  if(cfg.key==='appearance-hair-color') return `<span class="preset-visual color-preset" style="--preset-color:${opt.value}"></span>`;
  return `<span class="preset-visual switch-preset">${opt.value==='yes'?'✓':'—'}</span>`;
}
function appearanceOptionMarkup(cfg,opt,current){
  const active=String(current)===String(opt.value)?' active':'';
  return `<button type="button" class="appearance-chip preset-card${active}" data-target="${cfg.key}" data-value="${opt.value}" aria-pressed="${active?'true':'false'}">${appearancePresetVisual(cfg,opt)}<b>${opt.label}</b></button>`;
}
function appearanceGroupsForTab(tab){
  if(tab==='skin')return APPEARANCE_MENU.filter(c=>['appearance-skin','appearance-face-shape','appearance-eye-color','appearance-eye-shape','appearance-brows','appearance-nose','appearance-mouth'].includes(c.key));
  if(tab==='beard')return APPEARANCE_MENU.filter(c=>c.key.includes('beard'));
  return APPEARANCE_MENU.filter(c=>c.key.includes('hair'));
}
function renderAppearanceStudio(){
  const box=$('#appearance-studio');if(!box)return;
  const groups=appearanceGroupsForTab(appearanceStudioTab);
  box.innerHTML=`<div class="appearance-tabs" role="tablist">
    <button type="button" data-appearance-tab="hair" class="${appearanceStudioTab==='hair'?'active':''}"><span>✂</span>Cabelo</button>
    <button type="button" data-appearance-tab="beard" class="${appearanceStudioTab==='beard'?'active':''}"><span>◆</span>Barba</button>
    <button type="button" data-appearance-tab="skin" class="${appearanceStudioTab==='skin'?'active':''}"><span>◉</span>Face + detalhes</button>
  </div><div class="appearance-panel">${groups.map(cfg=>{
    const select=$("#"+cfg.key),current=select?.value||'';
    const hidden=(cfg.key==='appearance-hair-style'&&$('#appearance-hair-enabled')?.value==='no')||(cfg.key==='appearance-beard-style'&&$('#appearance-beard-enabled')?.value==='no');
    return `<section class="appearance-group ${hidden?'disabled':''}"><div class="appearance-group-head"><strong>${cfg.label}</strong><small>${hidden?'desativado':'escolha um preset'}</small></div><div class="appearance-group-options ${cfg.type}">${cfg.options.map(opt=>appearanceOptionMarkup(cfg,opt,current)).join('')}</div></section>`;
  }).join('')}</div>`;
  box.querySelectorAll('[data-appearance-tab]').forEach(btn=>btn.addEventListener('click',()=>{appearanceStudioTab=btn.dataset.appearanceTab;renderAppearanceStudio();}));
  box.querySelectorAll('[data-target]').forEach(btn=>btn.addEventListener('click',()=>{
    const sel=$("#"+btn.dataset.target);if(!sel)return;sel.value=btn.dataset.value;
    if(btn.dataset.target==='appearance-hair-style')$('#appearance-hair-enabled').value='yes';
    if(btn.dataset.target==='appearance-beard-style')$('#appearance-beard-enabled').value='yes';
    updateAppearancePreview();
  }));
}
function syncAppearanceStudio(){renderAppearanceStudio();}
const CAREER_APPEARANCE_KEY_MAP={
  'appearance-hair-enabled':'hairEnabled','appearance-hair-style':'hairStyle','appearance-hair-color':'hairColor',
  'appearance-beard-enabled':'beardEnabled','appearance-beard-style':'beardStyle','appearance-skin':'skin',
  'appearance-face-shape':'faceShape','appearance-eye-color':'eyeColor','appearance-eye-shape':'eyeShape','appearance-brows':'brows','appearance-nose':'nose','appearance-mouth':'mouth'
};
function careerAppearanceValue(cfg){
  const prop=CAREER_APPEARANCE_KEY_MAP[cfg.key],value=careerAppearanceDraft?.[prop];
  if(prop==='hairEnabled'||prop==='beardEnabled')return value?'yes':'no';
  return value??'';
}
function setCareerAppearanceValue(key,value){
  if(!careerAppearanceDraft)careerAppearanceDraft=normalizeAppearance(state.player?.appearance||{});
  const prop=CAREER_APPEARANCE_KEY_MAP[key];if(!prop)return;
  if(prop==='hairEnabled'||prop==='beardEnabled')careerAppearanceDraft[prop]=value==='yes';else careerAppearanceDraft[prop]=value;
  if(key==='appearance-hair-style')careerAppearanceDraft.hairEnabled=true;
  if(key==='appearance-beard-style')careerAppearanceDraft.beardEnabled=true;
  careerAppearanceDraft=normalizeAppearance(careerAppearanceDraft);
}
function renderCareerAppearanceEditor(){
  const studio=$('#career-appearance-studio'),preview=$('#career-appearance-preview');if(!studio||!preview||!careerAppearanceDraft)return;
  preview.innerHTML=appearanceMarkup(careerAppearanceDraft,false,state.player?.number||10);$('#career-photo-remove')?.classList.toggle('hidden',!careerAppearanceDraft.photoDataUrl);
  const groups=appearanceGroupsForTab(careerAppearanceTab);
  studio.innerHTML=`<div class="appearance-tabs" role="tablist">
    <button type="button" data-career-appearance-tab="hair" class="${careerAppearanceTab==='hair'?'active':''}"><span>✂</span>Cabelo</button>
    <button type="button" data-career-appearance-tab="beard" class="${careerAppearanceTab==='beard'?'active':''}"><span>◆</span>Barba</button>
    <button type="button" data-career-appearance-tab="skin" class="${careerAppearanceTab==='skin'?'active':''}"><span>◉</span>Face + detalhes</button>
  </div><div class="appearance-panel">${groups.map(cfg=>{
    const current=careerAppearanceValue(cfg);
    const hidden=(cfg.key==='appearance-hair-style'&&!careerAppearanceDraft.hairEnabled)||(cfg.key==='appearance-beard-style'&&!careerAppearanceDraft.beardEnabled);
    return `<section class="appearance-group ${hidden?'disabled':''}"><div class="appearance-group-head"><strong>${cfg.label}</strong><small>${hidden?'desativado':'escolha um preset'}</small></div><div class="appearance-group-options ${cfg.type}">${cfg.options.map(opt=>appearanceOptionMarkup(cfg,opt,current).replace(/data-target=/g,'data-career-target=')).join('')}</div></section>`;
  }).join('')}</div>`;
  studio.querySelectorAll('[data-career-appearance-tab]').forEach(btn=>btn.addEventListener('click',()=>{careerAppearanceTab=btn.dataset.careerAppearanceTab;renderCareerAppearanceEditor();}));
  studio.querySelectorAll('[data-career-target]').forEach(btn=>btn.addEventListener('click',()=>{setCareerAppearanceValue(btn.dataset.careerTarget,btn.dataset.value);renderCareerAppearanceEditor();}));
}
function openCareerAppearanceEditor(){
  const p=state.player;if(!p||p.retired){toast('A facial só pode ser editada durante a carreira ativa.');return;}
  careerAppearanceDraft=normalizeAppearance(p.appearance||{});careerAppearanceTab='hair';renderCareerAppearanceEditor();$('#career-appearance-modal')?.classList.remove('hidden');
}
function closeCareerAppearanceEditor(){careerAppearanceDraft=null;$('#career-appearance-modal')?.classList.add('hidden');}
function saveCareerAppearanceEditor(){
  if(!state.player||!careerAppearanceDraft)return;state.player.appearance=normalizeAppearance(careerAppearanceDraft);save();render();closeCareerAppearanceEditor();toast('Visual atualizado para o restante da carreira.');
}
function nationalInteractionLimit(s=state.season){return s&&isWorldCupYear(s.year)?4:2;}
const NATIONAL_TEAM_RATINGS={
  AR:95,BR:94,FR:94,ES:94,ENG:92,PT:91,DE:90,NL:90,IT:89,BE:87,HR:87,UY:87,CO:86,MA:86,
  CH:84,DK:84,US:84,MX:83,JP:84,SN:84,AT:83,EC:83,KR:82,TR:82,RS:81,NO:82,SE:80,PL:80,
  NG:82,DZ:80,EG:80,CM:80,CI:81,CA:79,AU:80,IR:80,SA:77,QA:76,TN:78,CL:79,PE:78,PY:80,
  VE:76,CR:76,PA:79,JM:75,NZ:74,SCO:80,WAL:78,CZ:81,UA:81,GR:78,HU:77,RO:77,ZA:77,GH:79,
  // CAF
  ML:79,BF:78,CD:79,CV:77,GN:75,GA:74,ZM:74,UG:73,AO:73,BJ:72,MZ:70,KE:69,TZ:68,ZW:68,SO:61,
  // AFC
  IQ:79,UZ:79,JO:77,AE:76,OM:74,CN:73,BH:73,SY:72,TH:71,VN:70,ID:70,
  // Concacaf
  HN:73,SV:70,GT:73,HT:71,TT:70,CU:69,GY:69,SR:72,CW:74,
  // OFC
  NC:68,FJ:67,SB:68,PG:65,VU:64,
  // UEFA complementares
  SK:79,SI:79,IE:78,IS:77,AL:76,GE:78,BA:76,ME:74,MK:74
};
const WORLD_CUP_POOL_CODES=['AR','BR','FR','ES','ENG','PT','DE','NL','IT','BE','HR','UY','CO','MA','CH','DK','US','MX','JP','SN','AT','EC','KR','TR','RS','NO','SE','PL','NG','DZ','EG','CM','CI','CA','AU','IR','SA','QA','TN','CL','PE','PY','CR','PA','SCO','WAL','CZ','UA','GH'];
const WORLD_CUP_GROUP_LABELS=['A','B','C','D','E','F','G','H','I','J','K','L'];
const WORLD_CUP_KNOCKOUT_STAGES=['Fase de 32','Oitavas de final','Quartas de final','Semifinal','Final'];
const WORLD_CUP_DIRECT_SLOTS={UEFA:16,CAF:9,AFC:8,CONMEBOL:6,CONCACAF:6,OFC:1};
const WORLD_CUP_PLAYOFF_CONFS=new Set(['CAF','AFC','CONMEBOL','CONCACAF','OFC']);

const WORLD_CUP_CONFIRMED_HOSTS={
  2026:{mainCodes:['CA','MX','US'],ceremonialCodes:[],autoCodes:['CA','MX','US'],confirmed:true,label:'Canadá · México · Estados Unidos',note:'Copa do Mundo de 2026'},
  2030:{mainCodes:['MA','PT','ES'],ceremonialCodes:['AR','PY','UY'],autoCodes:['MA','PT','ES','AR','PY','UY'],confirmed:true,label:'Marrocos · Portugal · Espanha',note:'Jogos do centenário: Argentina · Paraguai · Uruguai'},
  2034:{mainCodes:['SA'],ceremonialCodes:[],autoCodes:['SA'],confirmed:true,label:'Arábia Saudita',note:'Copa do Mundo de 2034'}
};
const WORLD_CUP_SIMULATED_HOST_CANDIDATES={
  CONCACAF:[['US'],['MX'],['CA','US'],['MX','US']],
  CONMEBOL:[['BR'],['AR','UY'],['CO'],['CL','AR']],
  UEFA:[['ENG'],['DE'],['IT'],['FR'],['PT','ES']],
  CAF:[['MA'],['ZA'],['EG'],['MA','EG']],
  AFC:[['JP','KR'],['AU'],['QA'],['CN'],['SA']]
};
function deterministicWorldCupNumber(year,salt=''){
  const raw=`${year}:${salt}`;let n=2166136261;
  for(const ch of raw){n^=ch.charCodeAt(0);n=Math.imul(n,16777619);}
  return Math.abs(n>>>0);
}
function simulatedWorldCupHostInfo(year){
  const y=Number(year),cycle=['CONCACAF','CONMEBOL','UEFA','CAF','AFC'];
  const edition=Math.max(0,Math.round((y-2038)/4)),conf=cycle[edition%cycle.length];
  const candidates=WORLD_CUP_SIMULATED_HOST_CANDIDATES[conf]||WORLD_CUP_SIMULATED_HOST_CANDIDATES.UEFA;
  const codes=[...candidates[deterministicWorldCupNumber(y,'host')%candidates.length]];
  const names=codes.map(code=>countryByCode(code)?.name||code);
  return {year:y,mainCodes:codes,ceremonialCodes:[],autoCodes:[...codes],confirmed:false,simulated:true,confederation:conf,label:names.join(' · '),note:'Sede simulada pelo modo carreira'};
}
function worldCupHostInfo(year=state.season?.year||2026){
  const y=Number(year);const fixed=WORLD_CUP_CONFIRMED_HOSTS[y];
  if(fixed)return {year:y,simulated:false,...fixed};
  if(y>=2038&&isWorldCupYear(y))return simulatedWorldCupHostInfo(y);
  return {year:y,mainCodes:[],ceremonialCodes:[],autoCodes:[],confirmed:false,simulated:false,label:'Sede não definida',note:''};
}
function worldCupHostShortLabel(year){return worldCupHostInfo(year).label||'Sede não definida';}
function worldCupHostMarkup(year){
  const h=worldCupHostInfo(year),main=h.mainCodes||[],ceremonial=h.ceremonialCodes||[];
  const teamChip=code=>{const c=countryByCode(code)||{code,name:code};return `<span class=\"wc-host-team\">${nationalFlagImage(c.code,c.name)}<b>${esc(c.name)}</b></span>`;};
  return `<div class=\"wc-host-card ${h.simulated?'simulated':'confirmed'}\"><div class=\"wc-host-heading\"><span>${h.simulated?'◆ SEDE SIMULADA':'✓ SEDE CONFIRMADA'}</span><strong>${esc(String(year))}</strong></div><div class=\"wc-host-main\">${main.map(teamChip).join('')}</div>${ceremonial.length?`<div class=\"wc-host-centenary\"><small>Jogos do centenário</small>${ceremonial.map(teamChip).join('')}</div>`:''}<p>${esc(h.note||'')}</p></div>`;
}
function codeForCountryName(name=''){return COUNTRIES.find(c=>normalizeKey(c.name)===normalizeKey(name)||normalizeKey(c.apiName||'')===normalizeKey(name))?.code||'';}
function nationalTeamStrength(code,name=''){
  const c=code||codeForCountryName(name);if(NATIONAL_TEAM_RATINGS[c])return NATIONAL_TEAM_RATINGS[c];
  const base={UEFA:75,CONMEBOL:79,CONCACAF:70,AFC:70,CAF:71,OFC:64,Mundial:64}[confederation(c)]||64;
  const seed=[...(c||name||'XX')].reduce((n,ch)=>n+ch.charCodeAt(0),0);return clamp(base+(seed%7)-3,56,84);
}
function worldCupTeamFromPlayer(p){return countryByCode(p?.nationalityCode)||{code:p?.nationalityCode||'PLAYER',name:p?.nationality||'Seleção do jogador'};}
function isFootballNation(c){
  if(!c?.code)return false;
  const conf=confederation(c.code);
  return conf!=='Mundial'&&!['AQ','VA','MC','NR','TV','KI','MH','PW','FM'].includes(c.code);
}
function worldCupPool(playerCode=''){
  const seen=new Set(),rows=[];
  [...WORLD_CUP_POOL_CODES,...COUNTRIES.map(c=>c.code)].forEach(code=>{
    const c=countryByCode(code);
    if(c&&c.code!==playerCode&&isFootballNation(c)&&!seen.has(c.code)){seen.add(c.code);rows.push(c);}
  });
  return rows;
}
function confederationNationalPool(conf,excludeCodes=[]){
  const excluded=new Set(excludeCodes);
  return COUNTRIES.filter(c=>isFootballNation(c)&&confederation(c.code)===conf&&!excluded.has(c.code));
}
function seededNationalSelection(pool,count,forcedCodes=[]){
  const forced=forcedCodes.map(code=>countryByCode(code)).filter(Boolean);
  const forcedSet=new Set(forced.map(x=>x.code));
  const ranked=pool.filter(c=>!forcedSet.has(c.code)).map(c=>({
    team:c,
    // Pequena variância: as melhores seleções são favoritas a chegar à Copa,
    // mas ainda existe espaço para zebras nas eliminatórias simuladas.
    score:nationalTeamStrength(c.code,c.name)+Math.random()*3.5
  })).sort((a,b)=>b.score-a.score).map(x=>x.team);
  return [...forced,...ranked].slice(0,count);
}
const WORLD_CUP_2026_FIXED_QUALIFIED_CODES=[
  'CA','MX','US','AU','IR','JP','JO','KR','QA','SA','UZ','DZ','CV','CI','EG','GH','MA','SN','TN','ZA','CW','HT','PA','AR','BR','CO','EC','PY','UY','NZ','AT','BE','HR','ENG','FR','DE','NL','NO','PT','SCO','ES','CH'
];
const WORLD_CUP_2026_UEFA_PLAYOFF_CODES=['AL','BA','CZ','DK','IT','NIR','MK','PL','IE','RO','SK','SE','TR','UA','WAL'];
const WORLD_CUP_2026_INTERCONFED_PLAYOFF_CODES=['BO','CD','IQ','JM','NC','SR'];
function rankedPlayoffWinners(codes,count,year,salt){
  return codes.map(code=>countryByCode(code)).filter(Boolean).map(team=>({team,score:nationalTeamStrength(team.code,team.name)+(deterministicWorldCupNumber(year,`${salt}-${team.code}`)%401)/100}))
    .sort((a,b)=>b.score-a.score).slice(0,count).map(x=>x.team);
}
function worldCup2026QualifiedField(p){
  const fixed=WORLD_CUP_2026_FIXED_QUALIFIED_CODES.map(code=>countryByCode(code)).filter(Boolean);
  const uefa=rankedPlayoffWinners(WORLD_CUP_2026_UEFA_PLAYOFF_CODES,4,2026,'uefa-playoff');
  const inter=rankedPlayoffWinners(WORLD_CUP_2026_INTERCONFED_PLAYOFF_CODES,2,2026,'inter-playoff');
  let field=[...fixed,...uefa,...inter];
  const player=worldCupTeamFromPlayer(p);
  if(player?.code&&!field.some(t=>t.code===player.code)){
    const conf=confederation(player.code);
    const protectedCodes=new Set(['CA','MX','US','ES','AR','FR','ENG','BR','PT','NL','BE','DE']);
    let candidates=field.map((team,index)=>({team,index})).filter(x=>confederation(x.team.code)===conf&&!protectedCodes.has(x.team.code));
    if(!candidates.length)candidates=field.map((team,index)=>({team,index})).filter(x=>!protectedCodes.has(x.team.code));
    candidates.sort((a,b)=>worldCupRankingScore(a.team,2026)-worldCupRankingScore(b.team,2026));
    if(candidates[0])field[candidates[0].index]=player;
  }
  const seen=new Set();field=field.filter(t=>t&&!seen.has(t.code)&&(seen.add(t.code),true));
  if(field.length<48){
    worldCupPool(player?.code||'').sort((a,b)=>worldCupRankingScore(b,2026)-worldCupRankingScore(a,2026)).forEach(t=>{if(field.length<48&&!seen.has(t.code)){field.push(t);seen.add(t.code);}});
  }
  return field.slice(0,48);
}
function worldCupQualifiedField(p,reservedCodes=[],year=state.season?.year||2026){
  if(Number(year)===2026&&!reservedCodes.length)return worldCup2026QualifiedField(p);
  const player=worldCupTeamFromPlayer(p);
  const hosts=worldCupHostInfo(year).autoCodes||[];
  const forced=[player.code,...hosts,...reservedCodes].filter(Boolean);
  const selected=[],selectedCodes=new Set();
  const pushTeam=t=>{if(t&&!selectedCodes.has(t.code)){selected.push(t);selectedCodes.add(t.code);}};
  Object.entries(WORLD_CUP_DIRECT_SLOTS).forEach(([conf,slots])=>{
    const forcedInConf=forced.filter(code=>confederation(code)===conf);
    const pool=confederationNationalPool(conf);
    seededNationalSelection(pool,Math.max(slots,forcedInConf.length),forcedInConf).slice(0,slots).forEach(pushTeam);
  });
  // Se a seleção do jogador foi forçada para um contingente já completo, garante a
  // presença dela substituindo a seleção mais fraca da mesma confederação.
  forced.forEach(code=>{
    if(selectedCodes.has(code))return;
    const team=countryByCode(code);if(!team)return;
    const conf=confederation(code);
    let replaceIndex=-1,weak=Infinity;
    selected.forEach((row,i)=>{
      if(confederation(row.code)!==conf||forced.includes(row.code))return;
      const strength=nationalTeamStrength(row.code,row.name);
      if(strength<weak){weak=strength;replaceIndex=i;}
    });
    if(replaceIndex>=0){selectedCodes.delete(selected[replaceIndex].code);selected[replaceIndex]=team;selectedCodes.add(team.code);}
    else pushTeam(team);
  });
  // As duas vagas restantes reproduzem a lógica da repescagem intercontinental:
  // candidatos de todas as confederações, exceto UEFA.
  const playoffCandidates=[];
  WORLD_CUP_PLAYOFF_CONFS.forEach(conf=>{
    const best=COUNTRIES.filter(c=>isFootballNation(c)&&confederation(c.code)===conf&&!selectedCodes.has(c.code))
      .map(c=>({team:c,score:nationalTeamStrength(c.code,c.name)+Math.random()*5}))
      .sort((a,b)=>b.score-a.score)[0];
    if(best)playoffCandidates.push(best);
  });
  // Cada confederação leva no máximo um vencedor simulado da repescagem,
  // evitando vagas extras artificiais concentradas em um único continente.
  playoffCandidates.sort((a,b)=>b.score-a.score).slice(0,2).forEach(x=>pushTeam(x.team));
  if(selected.length<48){
    COUNTRIES.filter(c=>isFootballNation(c)&&!selectedCodes.has(c.code))
      .sort((a,b)=>nationalTeamStrength(b.code,b.name)-nationalTeamStrength(a.code,a.name))
      .forEach(c=>{if(selected.length<48)pushTeam(c);});
  }
  return selected.slice(0,48);
}
function worldCupGroupConfederationAllowed(group,team){
  const conf=confederation(team.code);
  const same=group.filter(t=>confederation(t.code)===conf).length;
  return conf==='UEFA'?same<2:same<1;
}
const WORLD_CUP_2026_OFFICIAL_POT_CODES=[
  ['CA','MX','US','ES','AR','FR','ENG','BR','PT','NL','BE','DE'],
  ['HR','MA','CO','UY','CH','JP','SN','IR','KR','EC','AT','AU'],
  ['NO','PA','EG','DZ','SCO','PY','TN','CI','UZ','QA','SA','ZA'],
  ['JO','CV','GH','CW','HT','NZ','CZ','BA','TR','SE','IQ','CD']
];
// Grupos oficiais da Copa do Mundo de 2026. A ordem interna é por pote (1→4),
// para que a cerimônia e os quatro painéis de potes continuem coerentes.
const WORLD_CUP_2026_OFFICIAL_GROUP_CODES=[
  ['MX','KR','ZA','CZ'],
  ['CA','CH','QA','BA'],
  ['BR','MA','SCO','HT'],
  ['US','AU','PY','TR'],
  ['DE','EC','CI','CW'],
  ['NL','JP','TN','SE'],
  ['BE','IR','EG','NZ'],
  ['ES','UY','SA','CV'],
  ['FR','SN','NO','IQ'],
  ['AR','AT','DZ','JO'],
  ['PT','CO','UZ','CD'],
  ['ENG','HR','PA','GH']
];
function worldCup2026OfficialGroups(){
  return WORLD_CUP_2026_OFFICIAL_GROUP_CODES.map(group=>group.map(code=>countryByCode(code)).filter(Boolean));
}
function worldCupRankingScore(team,year=2026){
  const base=nationalTeamStrength(team.code,team.name);
  if(Number(year)===2026){
    const pot=WORLD_CUP_2026_OFFICIAL_POT_CODES.findIndex(codes=>codes.includes(team.code));
    if(pot>=0){const index=WORLD_CUP_2026_OFFICIAL_POT_CODES[pot].indexOf(team.code);return 200-pot*40-index;}
  }
  // Para edições futuras, o jogo projeta um ranking FIFA a partir da força da
  // seleção, com uma pequena variação determinística por ciclo. Isso mantém os
  // potes estáveis dentro do mesmo save sem congelar para sempre o ranking de 2025.
  const drift=(deterministicWorldCupNumber(year,`rank-${team.code}`)%601)/100-3;
  return base+drift;
}
function fillWorldCupPot(target,candidates,used,count=12){
  for(const team of candidates){if(target.length>=count)break;if(!used.has(team.code)){target.push(team);used.add(team.code);}}
  return target;
}
function worldCupPots(field,year=state.season?.year||2026){
  const teams=[...field],y=Number(year),used=new Set();
  const byRanking=(a,b)=>worldCupRankingScore(b,y)-worldCupRankingScore(a,y)||nationalTeamStrength(b.code,b.name)-nationalTeamStrength(a.code,a.name);
  const hostInfo=worldCupHostInfo(y);

  // Em 2026, os potes oficiais foram definidos pelo Ranking Mundial Masculino
  // da FIFA de 19/11/2025, com Canadá, México e EUA no Pote 1 e as seis vagas de
  // repescagem no Pote 4. Como o modo carreira resolve essas vagas com seleções
  // reais, preservamos todos os países já oficialmente alocados e completamos
  // eventuais vagas simuladas pelo mesmo critério de ranking.
  if(y===2026){
    const pots=WORLD_CUP_2026_OFFICIAL_POT_CODES.map(codes=>codes.map(code=>teams.find(t=>t.code===code)).filter(Boolean));
    pots.flat().forEach(team=>used.add(team.code));
    const remaining=teams.filter(team=>!used.has(team.code)).sort(byRanking);
    // O Pote 4 recebe primeiro as seleções que representam as vagas de playoff
    // já resolvidas pelo simulador; depois completamos quaisquer lacunas raras.
    fillWorldCupPot(pots[3],remaining.slice().reverse(),used,12);
    for(let i=0;i<3;i++)fillWorldCupPot(pots[i],remaining,used,12);
    // Segurança: se uma seleção oficialmente listada não estiver no campo
    // simulado e algum pote seguir incompleto, redistribuímos apenas os sobressalentes.
    const leftovers=teams.filter(team=>!used.has(team.code)).sort(byRanking);
    for(let i=0;i<4;i++)fillWorldCupPot(pots[i],leftovers,used,12);
    if(pots.every(p=>p.length===12))return pots;
  }

  // Edições futuras: anfitriões principais entram no Pote 1; as demais seleções
  // são divididas em blocos de 12 pelo ranking FIFA projetado do modo carreira.
  const hostCodes=(hostInfo.mainCodes||[]).filter(code=>teams.some(t=>t.code===code));
  const hosts=hostCodes.map(code=>teams.find(t=>t.code===code)).filter(Boolean).slice(0,12);
  hosts.forEach(team=>used.add(team.code));
  const ranked=teams.filter(team=>!used.has(team.code)).sort(byRanking);
  const pot1=[...hosts];fillWorldCupPot(pot1,ranked,used,12);
  const remaining=teams.filter(team=>!used.has(team.code)).sort(byRanking);
  return [pot1,remaining.slice(0,12),remaining.slice(12,24),remaining.slice(24,36)];
}
function worldCupPathSide(groupIndex){return groupIndex%2===0?'A':'B';}
function drawWorldCupGroups(field,year=state.season?.year||2026){
  const pots=worldCupPots(field,year);
  for(let attempt=0;attempt<1200;attempt++){
    const groups=Array.from({length:12},()=>[]),fixed=new Set();let failed=false;
    if(Number(year)===2026){
      [['MX',0],['CA',1],['US',3]].forEach(([code,index])=>{const team=pots[0].find(t=>t.code===code);if(team){groups[index].push(team);fixed.add(code);}});
    }
    for(let potIndex=0;potIndex<4&&!failed;potIndex++){
      const pot=shuffle(pots[potIndex].filter(t=>!fixed.has(t.code)));
      const topFour=potIndex===0?[...pot].sort((a,b)=>worldCupRankingScore(b,year)-worldCupRankingScore(a,year)).slice(0,4):[];
      const topCodes=new Set(topFour.map(t=>t.code)),topPlaced={};
      for(const team of pot){
        let eligible=groups.map((g,i)=>({g,i})).filter(x=>x.g.length===potIndex&&worldCupGroupConfederationAllowed(x.g,team));
        if(potIndex===0&&topCodes.has(team.code)){
          const rank=topFour.findIndex(t=>t.code===team.code);
          if(rank===1&&topPlaced[0])eligible=eligible.filter(x=>worldCupPathSide(x.i)!==topPlaced[0]);
          if(rank===3&&topPlaced[2])eligible=eligible.filter(x=>worldCupPathSide(x.i)!==topPlaced[2]);
        }
        if(!eligible.length){failed=true;break;}
        const pick=eligible[rnd(0,eligible.length-1)];pick.g.push(team);
        if(potIndex===0&&topCodes.has(team.code)){const rank=topFour.findIndex(t=>t.code===team.code);topPlaced[rank]=worldCupPathSide(pick.i);}
      }
    }
    if(failed||groups.some(g=>g.length!==4))continue;
    if(groups.some(g=>{const n=g.filter(t=>confederation(t.code)==='UEFA').length;return n<1||n>2;}))continue;
    return groups;
  }
  const groups=Array.from({length:12},()=>[]);
  pots.forEach((pot,pi)=>pot.forEach((team,idx)=>{
    const order=Array.from({length:12},(_,i)=>(idx+i)%12),dest=order.find(i=>groups[i].length===pi&&worldCupGroupConfederationAllowed(groups[i],team));
    groups[dest??idx%12].push(team);
  }));
  return groups;
}
function createWorldCupTournament(p,preferredOpponents=[],year=state.season?.year||2026){
  const player=worldCupTeamFromPlayer(p);
  let groups;
  // 2026 reproduz exatamente o sorteio oficial. Não há re-sorteio nesta edição.
  if(Number(year)===2026){
    groups=worldCup2026OfficialGroups();
  }else{
    const preferred=(preferredOpponents||[]).map(x=>typeof x==='string'?countryByCode(x):x).filter(Boolean).filter(x=>x.code!==player.code).slice(0,3);
    if(preferred.length===3){
      const field=worldCupQualifiedField(p,preferred.map(x=>x.code),year);
      const rest=shuffle(field.filter(t=>t.code!==player.code&&!preferred.some(x=>x.code===t.code)));
      groups=[[player,...preferred]];
      for(let i=0;i<11;i++)groups.push(rest.slice(i*4,i*4+4));
    }else{
      groups=drawWorldCupGroups(worldCupQualifiedField(p,[],year),year);
    }
    if(!Array.isArray(groups)||groups.length!==12||groups.some(g=>!Array.isArray(g)||g.length!==4)){
      groups=drawWorldCupGroups(worldCupQualifiedField(p,[],year),year);
    }
  }
  const playerGroupIndex=groups.findIndex(g=>g.some(t=>t.code===player.code));
  const groupOpponents=playerGroupIndex>=0?groups[playerGroupIndex].filter(t=>t.code!==player.code).map(t=>({code:t.code,name:t.name})):[];
  return {
    groups:groups.map(g=>g.map(t=>({code:t.code,name:t.name}))),
    playerGroupIndex,
    groupOpponents,
    official2026:Number(year)===2026
  };
}
function pickWorldCupOpponent(playerCode,usedCodes=[],stage='group',sourceTeams=null){
  const used=new Set([playerCode,...usedCodes]),raw=(Array.isArray(sourceTeams)&&sourceTeams.length?sourceTeams:worldCupPool(playerCode));
  let pool=raw.map(x=>typeof x==='string'?countryByCode(x):x).filter(Boolean).filter(c=>!used.has(c.code));
  if(!pool.length)pool=raw.map(x=>typeof x==='string'?countryByCode(x):x).filter(Boolean).filter(c=>c.code!==playerCode);
  if(!pool.length)return COUNTRIES.find(c=>c.code!==playerCode)||{code:'',name:'Rival'};
  let min=76,max=95;if(stage==='Fase de 32'){min=78;}else if(stage==='Oitavas de final'){min=80;}else if(stage==='Quartas de final'){min=83;}else if(stage==='Semifinal'){min=86;}else if(stage==='Final'){min=89;}else if(stage==='Disputa de 3º lugar'){min=84;}
  const eligible=pool.filter(c=>{const r=nationalTeamStrength(c.code,c.name);return r>=min&&r<=max;});const source=eligible.length?eligible:pool;
  const weighted=[];source.forEach(c=>{const r=nationalTeamStrength(c.code,c.name),weight=stage==='group'?Math.max(1,7-Math.abs(r-83)):Math.max(1,r-min+2);for(let i=0;i<weight;i++)weighted.push(c);});
  return weighted[rnd(0,weighted.length-1)]||source[rnd(0,source.length-1)];
}
function worldCupRow(team){return {code:team.code,name:team.name,points:0,wins:0,draws:0,losses:0,gf:0,ga:0,gd:0,fairPlay:-rnd(1,8),ranking:nationalTeamStrength(team.code,team.name)};}
function applyWorldCupTableResult(rows,aCode,bCode,aGoals,bGoals){
  const a=rows.find(r=>r.code===aCode),b=rows.find(r=>r.code===bCode);if(!a||!b)return;
  a.gf+=aGoals;a.ga+=bGoals;b.gf+=bGoals;b.ga+=aGoals;
  if(aGoals>bGoals){a.points+=3;a.wins++;b.losses++;}else if(aGoals<bGoals){b.points+=3;b.wins++;a.losses++;}else{a.points++;b.points++;a.draws++;b.draws++;}
  a.gd=a.gf-a.ga;b.gd=b.gf-b.ga;
}
function worldCupMiniStats(tied,matches){
  const codes=new Set(tied.map(r=>r.code)),mini=new Map(tied.map(r=>[r.code,{points:0,gf:0,ga:0,gd:0}]));
  (matches||[]).filter(m=>codes.has(m.a)&&codes.has(m.b)).forEach(m=>{const a=mini.get(m.a),b=mini.get(m.b);a.gf+=m.ga;a.ga+=m.gb;b.gf+=m.gb;b.ga+=m.ga;if(m.ga>m.gb)a.points+=3;else if(m.ga<m.gb)b.points+=3;else{a.points++;b.points++;}});
  mini.forEach(v=>v.gd=v.gf-v.ga);return mini;
}
function rankWorldCupGroup(rows,matches){
  const pointBuckets=new Map();rows.forEach(r=>{if(!pointBuckets.has(r.points))pointBuckets.set(r.points,[]);pointBuckets.get(r.points).push(r);});
  const ranked=[];[...pointBuckets.keys()].sort((a,b)=>b-a).forEach(points=>{
    const tied=pointBuckets.get(points);if(tied.length===1){ranked.push(tied[0]);return;}
    const mini=worldCupMiniStats(tied,matches);
    tied.sort((a,b)=>{const ma=mini.get(a.code),mb=mini.get(b.code);return (mb.points-ma.points)||(mb.gd-ma.gd)||(mb.gf-ma.gf)||(b.gd-a.gd)||(b.gf-a.gf)||(b.fairPlay-a.fairPlay)||(b.ranking-a.ranking)||a.name.localeCompare(b.name);});
    ranked.push(...tied);
  });
  return ranked.map((r,i)=>({...r,position:i+1}));
}
function simulateNeutralWorldCupMatch(a,b){
  const model=matchModel(nationalTeamStrength(a.code,a.name),nationalTeamStrength(b.code,b.name),0);return {a:a.code,b:b.code,ga:poisson(model.homeXg),gb:poisson(model.awayXg)};
}
function simulateWorldCupGroup(group){
  const rows=group.map(worldCupRow),matches=[];for(let i=0;i<group.length;i++)for(let j=i+1;j<group.length;j++){const m=simulateNeutralWorldCupMatch(group[i],group[j]);matches.push(m);applyWorldCupTableResult(rows,m.a,m.b,m.ga,m.gb);}return {standings:rankWorldCupGroup(rows,matches),matches};
}
function resolvePlayerWorldCupGroup(wc,p){
  const player=worldCupTeamFromPlayer(p),groups=wc.groups||[],idx=wc.playerGroupIndex??groups.findIndex(g=>g.some(t=>t.code===player.code)),group=groups[idx]||[player,...(wc.groupOpponents||[])];
  const rows=group.map(worldCupRow),matches=(wc.playerGroupResults||[]).map(m=>({...m}));
  const rivals=group.filter(t=>t.code!==player.code);for(let i=0;i<rivals.length;i++)for(let j=i+1;j<rivals.length;j++){const m=simulateNeutralWorldCupMatch(rivals[i],rivals[j]);matches.push(m);}
  matches.forEach(m=>applyWorldCupTableResult(rows,m.a,m.b,m.ga,m.gb));return {standings:rankWorldCupGroup(rows,matches),matches};
}
function compareWorldCupThirds(a,b){return (b.points-a.points)||(b.gd-a.gd)||(b.gf-a.gf)||(b.fairPlay-a.fairPlay)||(b.ranking-a.ranking)||a.name.localeCompare(b.name);}
function resolveWorldCupGroupStage(wc,p){
  if(!Array.isArray(wc.groups)||wc.groups.length!==12){const draw=createWorldCupTournament(p,wc.groupOpponents||[],wc.year||state.season?.year||2026);wc.groups=draw.groups;wc.playerGroupIndex=draw.playerGroupIndex;wc.groupOpponents=draw.groupOpponents;}
  const groupTables=[];for(let i=0;i<12;i++){const result=i===wc.playerGroupIndex?resolvePlayerWorldCupGroup(wc,p):simulateWorldCupGroup(wc.groups[i]);groupTables.push({group:WORLD_CUP_GROUP_LABELS[i],standings:result.standings,matches:result.matches});}
  const playerCode=p.nationalityCode||worldCupTeamFromPlayer(p).code,playerTable=groupTables[wc.playerGroupIndex],playerRow=playerTable.standings.find(r=>r.code===playerCode)||playerTable.standings.find(r=>r.name===p.nationality);
  const thirds=groupTables.map(t=>({...t.standings[2],group:t.group})).sort(compareWorldCupThirds).map((r,i)=>({...r,thirdRank:i+1,qualifiedThird:i<8}));
  const playerThird=thirds.find(r=>r.code===playerCode),position=playerRow?.position||4,qualified=position<=2||(position===3&&!!playerThird?.qualifiedThird);
  wc.groupTables=groupTables;wc.thirdPlaceTable=thirds;wc.groupPosition=position;wc.thirdPlaceRank=playerThird?.thirdRank||null;wc.qualified=qualified;
  const bestThirdCodes=new Set(thirds.filter(x=>x.qualifiedThird).map(x=>x.code)),qualifiers=[];
  groupTables.forEach(t=>t.standings.forEach((r,i)=>{if(i<2||(i===2&&bestThirdCodes.has(r.code)))qualifiers.push({code:r.code,name:r.name,group:t.group,position:i+1});}));
  wc.remainingTeams=qualifiers;return {qualified,position,thirdRank:wc.thirdPlaceRank,group:WORLD_CUP_GROUP_LABELS[wc.playerGroupIndex],playerRow,qualifiers};
}
function simulateNeutralWorldCupKnockout(a,b){
  const model=matchModel(nationalTeamStrength(a.code,a.name),nationalTeamStrength(b.code,b.name),0),ga=poisson(model.homeXg),gb=poisson(model.awayXg);let aWins=ga>gb;
  if(ga===gb)aWins=Math.random()<(model.homeWin/(model.homeWin+model.awayWin||1));return {winner:aWins?a:b,loser:aWins?b:a,ga,gb,penalties:ga===gb};
}
function simulateOtherWorldCupKnockoutMatches(teams){
  const pool=shuffle(teams||[]),winners=[],losers=[];for(let i=0;i+1<pool.length;i+=2){const r=simulateNeutralWorldCupKnockout(pool[i],pool[i+1]);winners.push(r.winner);losers.push(r.loser);}return {winners,losers};
}
function createWorldCupState(p,year,leagueMatches=34){
  const draw=createWorldCupTournament(p,[],year),used=draw.groupOpponents.map(x=>x.code),hostInfo=worldCupHostInfo(year);
  const participant=draw.playerGroupIndex>=0;
  return {year,formatVersion:5,hostInfo,active:!!p.calledUp&&participant,participant,started:false,drawPresented:false,finished:!participant&&Number(year)===2026,qualified:participant?null:false,stage:'group',groupIndex:0,points:0,wins:0,draws:0,losses:0,gf:0,ga:0,groups:draw.groups,playerGroupIndex:draw.playerGroupIndex,groupOpponents:draw.groupOpponents,playerGroupResults:[],groupTables:null,thirdPlaceTable:null,groupPosition:null,thirdPlaceRank:null,knockoutStages:[...WORLD_CUP_KNOCKOUT_STAGES],knockoutIndex:0,currentOpponent:null,remainingTeams:null,thirdPlaceOpponent:null,usedOpponents:[...used],startLeagueRound:Math.max(5,Math.round(leagueMatches*.42)),champion:false,runnerUp:false,thirdPlace:false,fourthPlace:false,eliminated:!participant&&Number(year)===2026};
}
function upgradeWorldCupState(wc,p,leagueMatches=34){
  if(!wc)return createWorldCupState(p,state.season?.year||2026,leagueMatches);
  const oldStages=Array.isArray(wc.knockoutStages)?wc.knockoutStages:[],oldFormat=!oldStages.includes('Fase de 32');
  wc.formatVersion=5;wc.hostInfo=worldCupHostInfo(wc.year||state.season?.year||2026);wc.knockoutStages=[...WORLD_CUP_KNOCKOUT_STAGES];wc.drawPresented=wc.drawPresented===undefined?!!wc.started:!!wc.drawPresented;wc.playerGroupResults=Array.isArray(wc.playerGroupResults)?wc.playerGroupResults:[];wc.runnerUp=!!wc.runnerUp;wc.thirdPlace=!!wc.thirdPlace;wc.fourthPlace=!!wc.fourthPlace;
  if((Number(wc.year||state.season?.year)===2026&&!wc.started)||!Array.isArray(wc.groups)||wc.groups.length!==12){const draw=createWorldCupTournament(p,wc.groupOpponents||[],wc.year||state.season?.year||2026);wc.groups=draw.groups;wc.playerGroupIndex=draw.playerGroupIndex;wc.groupOpponents=draw.groupOpponents;wc.participant=draw.playerGroupIndex>=0;if(Number(wc.year||state.season?.year)===2026&&!wc.participant){wc.active=false;wc.finished=true;wc.qualified=false;wc.eliminated=true;}}
  if(oldFormat&&wc.stage==='knockout'&&(wc.knockoutIndex||0)>0)wc.knockoutIndex=Math.min((wc.knockoutIndex||0)+1,WORLD_CUP_KNOCKOUT_STAGES.length-1);
  wc.usedOpponents=Array.isArray(wc.usedOpponents)?wc.usedOpponents:(wc.groupOpponents||[]).map(x=>x.code).filter(Boolean);return wc;
}
function ensureWorldCupState(s=state.season,p=state.player){
  if(!s||!p||!isWorldCupYear(s.year))return null;
  if(!s.worldCup)s.worldCup=createWorldCupState(p,s.year,s.league?.schedule?.length||34);else upgradeWorldCupState(s.worldCup,p,s.league?.schedule?.length||34);
  if(p.calledUp&&!s.worldCup.finished&&s.worldCup.participant!==false)s.worldCup.active=true;
  return s.worldCup;
}
function worldCupReady(s=state.season,p=state.player){
  const wc=ensureWorldCupState(s,p);if(!wc||!p.calledUp||wc.finished||!wc.active)return false;
  return wc.started||s.league?.finished||(s.league?.index||0)>=wc.startLeagueRound;
}
function worldCupStatusText(wc){
  if(!wc)return 'Copa do Mundo';
  if(wc.champion)return 'Campeão';if(wc.runnerUp)return 'Vice-campeão';if(wc.thirdPlace)return '3º lugar';if(wc.fourthPlace)return '4º lugar';
  if(wc.eliminated){if(wc.qualified===false)return `Eliminado na fase de grupos · ${wc.points||0} pts`;const idx=Math.max(0,Math.min((wc.knockoutIndex||0),wc.knockoutStages?.length-1||0));return `Eliminado · ${wc.knockoutStages?.[idx]||'mata-mata'}`;}
  if(wc.stage==='group')return `${!wc.drawPresented?'Sorteio pendente':wc.started?'Fase de grupos':'Aguardando início'} · ${Math.min(wc.groupIndex||0,3)}/3 jogos`;
  if(wc.stage==='third-place')return 'Disputa de 3º lugar · em disputa';
  return `${wc.knockoutStages?.[wc.knockoutIndex]||'Mata-mata'} · em disputa`;
}
let worldCupDrawTimer=null;
let resumeAfterWorldCupDraw=false;
function worldCupDrawSequence(wc){const seq=[];for(let pot=0;pot<4;pot++)for(let g=0;g<12;g++){const team=wc.groups?.[g]?.[pot];if(team)seq.push({pot,group:g,team});}return seq;}
function renderWorldCupDrawBoard(wc,revealed=48){
  const grid=$('#world-cup-draw-groups');if(!grid||!wc)return;const visible=new Set(worldCupDrawSequence(wc).slice(0,revealed).map(x=>`${x.group}:${x.pot}`));
  grid.innerHTML=WORLD_CUP_GROUP_LABELS.map((label,g)=>`<article class="wc-draw-group ${g===wc.playerGroupIndex?'player-group':''}"><header><b>GRUPO ${label}</b>${g===wc.playerGroupIndex?'<span>SEU GRUPO</span>':''}</header><div>${[0,1,2,3].map(pot=>{const team=wc.groups?.[g]?.[pot],shown=team&&visible.has(`${g}:${pot}`);return `<div class="wc-draw-team ${shown?'revealed':'empty'}"><small>${pot+1}</small>${shown?`${nationalFlagImage(team.code,team.name)}<strong>${esc(team.name)}</strong><em>${confederation(team.code)}</em>`:'<span class="wc-draw-ball">●</span><strong>Aguardando...</strong>'}</div>`;}).join('')}</div></article>`).join('');
}
function renderWorldCupPots(wc){
  const box=$('#world-cup-draw-pots');if(!box||!wc)return;
  const field=(wc.groups||[]).flat();
  const pots=Number(wc.year)===2026
    ? WORLD_CUP_2026_OFFICIAL_POT_CODES.map(codes=>codes.map(code=>field.find(t=>t.code===code)||countryByCode(code)).filter(Boolean))
    : worldCupPots(field,wc.year||state.season?.year||2026);
  box.innerHTML=pots.map((teams,i)=>`<section class="wc-pot-panel"><header><b>Pote ${i+1}</b><span>${teams.length} seleções</span></header><div class="wc-pot-team-list">${teams.map(t=>`<span class="wc-pot-team">${nationalFlagImage(t.code,t.name)}<b>${esc(t.name)}</b></span>`).join('')}</div></section>`).join('');
}
function openWorldCupDraw(){
  const p=state.player,s=state.season,wc=ensureWorldCupState(s,p);if(!wc||wc.drawPresented)return false;const modal=$('#world-cup-draw-modal');if(!modal)return false;
  const host=worldCupHostInfo(s.year);wc.hostInfo=host;
  $('#world-cup-draw-year').textContent=`COPA DO MUNDO · ${s.year}`;
  $('#world-cup-draw-copy').textContent=Number(s.year)===2026?'48 seleções · 12 grupos · 4 potes. Esta edição reproduz os potes e os grupos oficiais da Copa do Mundo de 2026. México está no Grupo A, Canadá no B e Estados Unidos no D.':host.simulated?'48 seleções · 12 grupos · 4 potes. Esta edição usa uma sede futura simulada pelo modo carreira; o sorteio mantém os critérios esportivos e as restrições de confederação.':'48 seleções · 12 grupos · 4 potes. As sedes confirmadas entram automaticamente no torneio; o sorteio respeita força, separação por confederação e o limite de duas seleções UEFA por grupo.';
  const hostsBox=$('#world-cup-hosts');if(hostsBox)hostsBox.innerHTML=worldCupHostMarkup(s.year);
  renderWorldCupPots(wc);renderWorldCupDrawBoard(wc,0);$('#world-cup-draw-progress').textContent='Pronto para começar';$('#world-cup-draw-start').classList.remove('hidden');$('#world-cup-draw-skip').classList.add('hidden');$('#world-cup-draw-continue').classList.add('hidden');modal.classList.remove('hidden');return true;
}
function finishWorldCupDrawAnimation(){
  if(worldCupDrawTimer){clearInterval(worldCupDrawTimer);worldCupDrawTimer=null;}const wc=state.season?.worldCup;if(!wc)return;renderWorldCupDrawBoard(wc,48);$('#world-cup-draw-progress').textContent=`Sorteio concluído · ${state.player?.nationality} está no Grupo ${WORLD_CUP_GROUP_LABELS[wc.playerGroupIndex]}`;$('#world-cup-draw-start').classList.add('hidden');$('#world-cup-draw-skip').classList.add('hidden');$('#world-cup-draw-continue').classList.remove('hidden');
}
function startWorldCupDrawAnimation(){
  const wc=state.season?.worldCup;if(!wc)return;let revealed=0,seq=worldCupDrawSequence(wc);$('#world-cup-draw-start').classList.add('hidden');$('#world-cup-draw-skip').classList.remove('hidden');if(worldCupDrawTimer)clearInterval(worldCupDrawTimer);
  worldCupDrawTimer=setInterval(()=>{revealed++;renderWorldCupDrawBoard(wc,revealed);const current=seq[Math.max(0,revealed-1)];$('#world-cup-draw-progress').textContent=current?`Pote ${current.pot+1} · ${current.team.name} → Grupo ${WORLD_CUP_GROUP_LABELS[current.group]}`:'Sorteando...';if(revealed>=seq.length)finishWorldCupDrawAnimation();},520);
}
function confirmWorldCupDraw(){
  const wc=state.season?.worldCup;if(!wc)return;finishWorldCupDrawAnimation();wc.drawPresented=true;save();$('#world-cup-draw-modal').classList.add('hidden');toast(`${state.player.nationality} ficou no Grupo ${WORLD_CUP_GROUP_LABELS[wc.playerGroupIndex]}.`);if(resumeAfterWorldCupDraw){resumeAfterWorldCupDraw=false;setTimeout(continueSeasonSimulation,180);}else render();
}
function maybeOpenWorldCupDrawDuringSimulation(){
  const p=state.player,s=state.season;if(!p||!s||!isWorldCupYear(s.year)||!p.calledUp)return false;const wc=ensureWorldCupState(s,p);if(!wc||wc.drawPresented||!worldCupReady(s,p))return false;resumeAfterWorldCupDraw=true;state.simulatingSeason=false;save();render();openWorldCupDraw();return true;
}
function nextWorldCupEvent(){
  const p=state.player,s=state.season,wc=ensureWorldCupState(s,p);if(!wc||!worldCupReady(s,p))return null;wc.started=true;
  let rival,stage;
  if(wc.stage==='group'){
    rival=wc.groupOpponents[wc.groupIndex];if(!rival)return null;stage=`Fase de grupos · Jogo ${wc.groupIndex+1}/3`;
  }else if(wc.stage==='third-place'){
    stage='Disputa de 3º lugar';rival=wc.thirdPlaceOpponent;if(!rival)return null;
  }else{
    stage=wc.knockoutStages[wc.knockoutIndex];if(!stage)return null;
    if(!wc.currentOpponent){const source=(wc.remainingTeams||[]).filter(t=>t.code!==p.nationalityCode);const opp=pickWorldCupOpponent(p.nationalityCode,wc.usedOpponents||[],stage,source);wc.currentOpponent={code:opp.code,name:opp.name};wc.usedOpponents=[...(wc.usedOpponents||[]),opp.code];}
    rival=wc.currentOpponent;
  }
  const home=Math.random()<.5;return {type:'national',worldCup:true,competition:'FIFA World Cup',stage,home:home?p.nationality:rival.name,away:home?rival.name:p.nationality,opponent:rival.name,opponentCode:rival.code};
}
function addNationalTrophy(name='FIFA World Cup'){
  const p=state.player;p.trophies=p.trophies||[];if(p.trophies.some(t=>t.year===state.season.year&&t.name===name))return;
  p.trophies.push({year:state.season.year,name,club:p.nationality,type:'national'});p.titles=p.trophies.length;state.news.push(`${p.name} é campeão da ${name} com a seleção de ${p.nationality}!`);if(!state.simulatingSeason)showCelebrationForHonour(name,`Campeão: ${name}`,`${p.name} conquista o maior título de seleções.`);
}
function processWorldCupResult(event,pf,pa,forcedPenaltyOutcome=null){
  const p=state.player,s=state.season,wc=ensureWorldCupState(s,p);
  if(!wc||!event.worldCup)return null;
  const playerCode=p.nationalityCode||worldCupTeamFromPlayer(p).code;
  const scoreFor=Math.max(0,Number(pf)||0),scoreAgainst=Math.max(0,Number(pa)||0);

  if(wc.stage==='group'){
    wc.gf+=scoreFor;wc.ga+=scoreAgainst;
    if(scoreFor>scoreAgainst){wc.points+=3;wc.wins++;}
    else if(scoreFor===scoreAgainst){wc.points++;wc.draws++;}
    else wc.losses++;
    const rival=wc.groupOpponents[wc.groupIndex];
    if(rival)wc.playerGroupResults.push({a:playerCode,b:rival.code,ga:scoreFor,gb:scoreAgainst});
    wc.groupIndex++;
    if(wc.groupIndex>=3){
      const resolution=resolveWorldCupGroupStage(wc,p),gd=wc.gf-wc.ga,groupLabel=resolution.group;
      if(resolution.qualified){
        wc.stage='knockout';wc.knockoutIndex=0;
        const thirdInfo=resolution.position===3?` como ${resolution.thirdRank}º melhor terceiro`:` em ${resolution.position}º lugar`;
        state.news.push(`${p.nationality} termina o Grupo ${groupLabel}${thirdInfo} e avança à Fase de 32 da Copa do Mundo com ${wc.points} ponto(s) e saldo ${gd>=0?'+':''}${gd}.`);
      }else{
        wc.active=false;wc.finished=true;wc.eliminated=true;
        const detail=resolution.position===3&&resolution.thirdRank?` · ${resolution.thirdRank}º entre os terceiros colocados`:'';
        state.news.push(`${p.nationality} é eliminado na fase de grupos da Copa do Mundo em ${resolution.position}º no Grupo ${groupLabel}${detail}, com ${wc.points} ponto(s).`);
      }
      wc.lastMatchResolution={stage:'group',qualified:!!resolution.qualified,advanced:!!resolution.qualified,scoreFor,scoreAgainst};
      return wc.lastMatchResolution;
    }
    wc.lastMatchResolution={stage:'group',qualified:null,advanced:null,scoreFor,scoreAgainst};
    return wc.lastMatchResolution;
  }

  // A passagem de fase depende exclusivamente do placar da seleção.
  // A escolha individual do jogador só altera o lance e a nota.
  let advanced;
  let decidedOnPenalties=false;
  if(scoreFor>scoreAgainst)advanced=true;
  else if(scoreFor<scoreAgainst)advanced=false;
  else{
    decidedOnPenalties=true;
    if(typeof forcedPenaltyOutcome!=='boolean'){
      state.pendingPenaltyShootout={scope:'worldcup',competition:'FIFA World Cup',stage:wc.stage==='third-place'?'Disputa de 3º lugar':wc.knockoutStages[wc.knockoutIndex],team:p.nationality,home:event.home,away:event.away,event:{...event},scoreFor,scoreAgainst};
      wc.lastMatchResolution={stage:wc.stage==='third-place'?'third-place':wc.knockoutStages[wc.knockoutIndex],pendingPenalties:true,scoreFor,scoreAgainst,decidedOnPenalties:true};
      return wc.lastMatchResolution;
    }
    advanced=forcedPenaltyOutcome;
    state.news.push(`${p.nationality} ${advanced?'avança':'é superado'} nos pênaltis na ${wc.stage==='third-place'?'disputa de 3º lugar':wc.knockoutStages[wc.knockoutIndex]}.`);
  }

  if(wc.stage==='third-place'){
    wc.active=false;wc.finished=true;
    if(advanced){wc.thirdPlace=true;state.news.push(`${p.nationality} vence a disputa de 3º lugar e termina a Copa do Mundo no pódio.`);}
    else{wc.fourthPlace=true;state.news.push(`${p.nationality} termina a Copa do Mundo em 4º lugar.`);}
    wc.lastMatchResolution={stage:'third-place',advanced,scoreFor,scoreAgainst,decidedOnPenalties};
    return wc.lastMatchResolution;
  }

  const stageName=wc.knockoutStages[wc.knockoutIndex],playerTeam=worldCupTeamFromPlayer(p),opponent=wc.currentOpponent||{code:event.opponentCode,name:event.opponent};
  if(stageName==='Final'){
    wc.active=false;wc.finished=true;
    if(advanced){wc.champion=true;addNationalTrophy('FIFA World Cup');}
    else{wc.runnerUp=true;state.news.push(`${p.nationality} fica com o vice-campeonato da Copa do Mundo.`);}
    wc.lastMatchResolution={stage:stageName,advanced,champion:!!wc.champion,scoreFor,scoreAgainst,decidedOnPenalties};
    return wc.lastMatchResolution;
  }

  const otherTeams=(wc.remainingTeams||[]).filter(t=>t.code!==playerCode&&t.code!==opponent.code),otherRound=simulateOtherWorldCupKnockoutMatches(otherTeams);
  if(stageName==='Semifinal'){
    const otherWinner=otherRound.winners[0],otherLoser=otherRound.losers[0];
    if(!advanced){
      wc.stage='third-place';wc.currentOpponent=null;
      wc.thirdPlaceOpponent=otherLoser||pickWorldCupOpponent(playerCode,wc.usedOpponents||[],'Disputa de 3º lugar',otherTeams);
      if(wc.thirdPlaceOpponent)wc.usedOpponents.push(wc.thirdPlaceOpponent.code);
      state.news.push(`${p.nationality} perde a semifinal e disputará o 3º lugar da Copa do Mundo.`);
      wc.lastMatchResolution={stage:stageName,advanced:false,scoreFor,scoreAgainst,decidedOnPenalties};
      return wc.lastMatchResolution;
    }
    wc.knockoutIndex++;wc.remainingTeams=[playerTeam,otherWinner].filter(Boolean);wc.currentOpponent=otherWinner?{code:otherWinner.code,name:otherWinner.name}:null;
    state.news.push(`${p.nationality} avança para a Final da Copa do Mundo.`);
    wc.lastMatchResolution={stage:stageName,advanced:true,nextStage:'Final',scoreFor,scoreAgainst,decidedOnPenalties};
    return wc.lastMatchResolution;
  }

  if(!advanced){
    wc.active=false;wc.finished=true;wc.eliminated=true;
    state.news.push(`${p.nationality} deixa a Copa do Mundo na ${stageName}.`);
    wc.lastMatchResolution={stage:stageName,advanced:false,scoreFor,scoreAgainst,decidedOnPenalties};
    return wc.lastMatchResolution;
  }

  wc.remainingTeams=[playerTeam,...otherRound.winners];wc.knockoutIndex++;wc.currentOpponent=null;
  const nextStage=wc.knockoutStages[wc.knockoutIndex];
  state.news.push(`${p.nationality} avança para ${nextStage} da Copa do Mundo.`);
  wc.lastMatchResolution={stage:stageName,advanced:true,nextStage,scoreFor,scoreAgainst,decidedOnPenalties};
  return wc.lastMatchResolution;
}
function maybeUpdateSelectionMidSeason(event){
  const p=state.player,s=state.season;if(!p||!s||p.retired||p.calledUp||event?.type==='national')return;
  const round=s.league?.index||0,total=Math.max(1,s.league?.schedule?.length||1),progress=round/total,wc=isWorldCupYear(s.year);if(progress<(wc ? .16 : .24))return;
  const step=wc?2:4;if(round-(s.lastSelectionCheckRound??-10)<step)return;s.lastSelectionCheckRound=round;
  const avg=s.totalGames?s.ratingSum/s.totalGames:6.5,minOvr=wc?71:73,minAvg=wc?6.85:7.05;if(p.overall<minOvr||avg<minAvg)return;
  const teamLevel=nationalTeamStrength(p.nationalityCode,p.nationality),competitionPenalty=teamLevel>=92?.15:teamLevel>=88?.10:teamLevel>=84?.05:0;
  let chance=.18+(p.overall-minOvr)*.045+(avg-minAvg)*.26+(p.reputation||0)*.002-competitionPenalty;if(wc){chance+=.12;if(progress>=.30)chance+=.12;if(progress>=.40)chance+=.16;}
  if(Math.random()<clamp(chance,.08,.88)){p.calledUp=true;p.nationalTrust=Math.max(p.nationalTrust||0,wc?28:22);if(wc){const stateWC=ensureWorldCupState(s,p);if(stateWC&&!stateWC.finished)stateWC.active=true;}state.news.push(`${p.name} é convocado no meio da temporada para a seleção de ${p.nationality}${wc?' e entra na lista para a Copa do Mundo':''}!`);}
}

const CLUB_BADGE_ALIASES = {
  'Bayern de Munique':['Bayern München','Bayern Munich'],
  'Inter de Milão':['Inter','Inter Milan'],
  'Milan':['Milan','AC Milan'],
  'Betis':['Real Betis'],
  'Atlético de Madrid':['Atletico Madrid'],
  'Paris Saint-Germain':['Paris Saint-Germain'],
  'Sport':['Sport Recife','Sport Club do Recife','Sport Club Recife'],
  'Sporting CP':['Sporting CP'],
  'Tottenham':['Tottenham','Tottenham Hotspur'],
  'West Ham':['West Ham','West Ham United'],
  'Newcastle United':['Newcastle United','Newcastle'],
  'Nottingham Forest':['Nottingham Forest'],
  'Vitória de Guimarães':['Vitória de Guimarães','Vitoria SC','Guimaraes'],
  'Beşiktaş':['Besiktas'],
  'Fenerbahçe':['Fenerbahce'],
  'İstanbul Başakşehir':['Istanbul Basaksehir','Basaksehir'],
  'Guadalajara':['Guadalajara','Chivas','Chivas Guadalajara'],
  'Tigres UANL':['Tigres UANL','Tigres'],
  'Los Angeles FC':['Los Angeles FC','LAFC'],
  'Yokohama F. Marinos':['Yokohama F Marinos','Yokohama Marinos'],
  'Atlético Mineiro':['Atlético Mineiro','Atletico Mineiro','Atletico-MG'],
  'Grêmio':['Grêmio','Gremio'],
  'São Paulo':['São Paulo','Sao Paulo'],
  'Peñarol':['Peñarol','Penarol'],
  'Atlético Nacional':['Atlético Nacional','Atletico Nacional'],
  'América de Cali':['América de Cali','America de Cali'],
  'Independiente Medellín':['Independiente Medellín','Independiente Medellin'],
  'Universidad Católica':['Universidad Católica','Universidad Catolica'],
  'PSV':['PSV Eindhoven','PSV'],
  'Porto':['FC Porto','Porto'],
  'Internacional':['Internacional','SC Internacional'],
  'Corinthians':['Corinthians','SC Corinthians Paulista'],
  'América':['Club América','Club America','America'],
  'Inter Miami':['Inter Miami CF','Inter Miami'],
  'LA Galaxy':['LA Galaxy','Los Angeles Galaxy'],
  'Al-Nassr':['Al Nassr'],
  'Al-Hilal':['Al Hilal'],
  'Al-Ittihad':['Al Ittihad'],
  'Al-Ahli':['Al Ahli'],
  'Al-Shabab':['Al Shabab'],
  'Liverpool Montevideo':['Liverpool Montevideo'],
  'Club Brugge':['Club Brugge','Club Brugge KV'],
  'Union Saint-Gilloise':['Union Saint-Gilloise','Royale Union Saint-Gilloise'],
  'Kawasaki Frontale':['Kawasaki Frontale'],
  'Urawa Red Diamonds':['Urawa Red Diamonds','Urawa Reds'],
  'Vissel Kobe':['Vissel Kobe'],
  'Kashima Antlers':['Kashima Antlers'],
  'Athletic Club':['Athletic Club','Athletic Bilbao']
};
// A crest must come from a verified Wikimedia Commons file; no external static badges.
const CLUB_BADGE_STATIC = Object.freeze({});
const CURRENT_EUROPE_LOGO_FOLDERS={ENG:'England - Premier League',DE:'Germany - Bundesliga',ES:'Spain - LaLiga',IT:'Italy - Serie A',FR:'France - Ligue 1',PT:'Portugal - Liga Portugal',NL:'Netherlands - Eredivisie',SCO:'Scotland - Scottish Premiership',BE:'Belgium - Jupiler Pro League',TR:'Türkiye - Süper Lig'};
const CURRENT_EUROPE_LOGO_NAMES={
  'Arsenal':'Arsenal FC','Liverpool':'Liverpool FC','Chelsea':'Chelsea FC','Everton':'Everton FC','Fulham':'Fulham FC','Bournemouth':'AFC Bournemouth','Brighton':'Brighton & Hove Albion','Sunderland':'Sunderland AFC','Tottenham':'Tottenham Hotspur','West Ham':'West Ham United','Wolverhampton':'Wolverhampton Wanderers',
  'Bayern de Munique':'Bayern Munich','Bayer Leverkusen':'Bayer 04 Leverkusen','Stuttgart':'VfB Stuttgart','Hoffenheim':'TSG 1899 Hoffenheim','Augsburg':'FC Augsburg','Mainz':'1.FSV Mainz 05','Union Berlin':'1.FC Union Berlin','Hamburgo':'Hamburger SV','Köln':'1.FC Köln','Werder Bremen':'SV Werder Bremen','Schalke 04':'FC Schalke 04','Paderborn':'SC Paderborn 07','Elversberg':'SV 07 Elversberg',
  'Barcelona':'FC Barcelona','Athletic Club':'Athletic Bilbao','Osasuna':'CA Osasuna','Alavés':'Deportivo Alavés','Getafe':'Getafe CF','Levante':'Levante UD','Málaga':'Málaga CF','Deportivo La Coruña':'Deportivo A Coruña',
  'Milan':'AC Milan','Roma':'AS Roma','Napoli':'SSC Napoli','Atalanta':'Atalanta BC','Monza':'AC Monza','Venezia':'Venezia FC',
  'Marseille':'Olympique Marseille','Lyon':'Olympique Lyon','Paris Saint-Germain':'Paris Saint-Germain','Brest':'Stade Brestois 29','Rennes':'Stade Rennais FC','Strasbourg':'RC Strasbourg Alsace','Toulouse':'FC Toulouse','Lille':'LOSC Lille','Nice':'OGC Nice','Monaco':'AS Monaco','Auxerre':'AJ Auxerre',
  'Sporting CP':'Sporting CP','Celtic':'Celtic FC','Rangers':'Rangers FC','Hearts':'Heart of Midlothian FC','St Mirren':'St. Mirren FC'
};
const CLUB_COUNTRY_SLUG={BR:'brazil',AR:'argentina',UY:'uruguay',CO:'colombia',CL:'chile',ES:'spain',ENG:'england',SCO:'scotland',GB:'united-kingdom',DE:'germany',IT:'italy',FR:'france',PT:'portugal',NL:'netherlands',BE:'belgium',TR:'turkey',MX:'mexico',US:'usa',JP:'japan',SA:'saudi-arabia'};
// V16: obsolete FCLOGO, Github logo catalogs and their proxy removed.
function stripDiacritics(str=''){ return str.normalize('NFD').replace(/[̀-ͯ]/g,''); }
function normalizeKey(str=''){ return stripDiacritics(str).toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,''); }
function slugifyClub(name=''){ return stripDiacritics(name).toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
function fallbackClubDataUri(){return '';}// Sem escudos artificiais: revelar estado indisponível até a imagem real do Commons.
// Sem imagens de taças artificiais: falha de rede mostra a sigla da competição.
const commonsMisses=new Map();
const commonsInFlight=new Map();
const COMMONS_ENDPOINT='https://commons.wikimedia.org/w/api.php';
const COMMONS_CLUB_ALIASES={
  'Bayern de Munique':'FC Bayern München','Inter de Milão':'Inter Milan','Milan':'AC Milan',
  'Grêmio':'Grêmio Foot-Ball Porto Alegrense','Atlético Mineiro':'Clube Atlético Mineiro',
  'Flamengo':'CR Flamengo','Corinthians':'SC Corinthians Paulista',
  'Sporting CP':'Sporting Clube de Portugal','São Paulo':'São Paulo FC','Inter Miami':'Inter Miami CF'
};
const commonsMetaKey='btl-wikimedia-credits-v15';
function commonsScore(title,club){
 const normalized=x=>stripDiacritics(String(x||'').replace(/^File:/i,'').replace(/\.(svg|png|webp)$/i,'').replace(/\b(logo|escudo|badge|crest|new|official|football|club|2024|2025|2026)\b/gi,' ')).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const file=normalized(title),key=normalized(club),tokens=key.split(' ').filter(x=>x.length>2),parts=file.split(' ');
 if(/\b(old|former|historic|historical|retro|vintage|deprecated|defunct)\b/i.test(title))return -1;
 if(!tokens.length)return -1;if(file===key)return 100;
 return tokens.every(x=>parts.includes(x))?82-Math.max(0,parts.length-tokens.length)*4:-1;
}
function safeCommonsImage(url){try{const u=new URL(url);return u.protocol==='https:'&&u.hostname==='upload.wikimedia.org'&&/\.(svg|png|webp)(?:$|\?)/i.test(u.pathname)?u.href:''}catch{return ''}}
// V22: Static-only crest catalog: no API-Football, Wikidata, Commons or TheSportsDB requests.
// V22: Static-only crest catalog: no API-Football, Wikidata, Commons or TheSportsDB requests.
function safeBadgeImage(url){return window.BTLStaticCrests?.isCatalogUrl?.(url)?String(url):'';}
for(const [club,url] of Object.entries(badgeCache))if(!safeBadgeImage(url))delete badgeCache[club];
saveBadges();
const missingOfficialCrests=new Set(),badgeAttemptStatus=new Map();
window.BTLCrestDiagnostics=()=>({
  source:'GitHub static SVG catalog (JoseArroyave/football-logos)',
  configured:true,apiCalls:0,inventory:448,
  catalogCoverage:window.BTLStaticCrests?.count||0,
  unmatched:window.BTLStaticCrests ? [] : ['Static crest catalog missing'],
  unresolved:[...missingOfficialCrests].sort((a,b)=>a.localeCompare(b,'pt-BR')),
  brokenUrlCount:badBadgeUrls.size,tried:[...badgeAttemptStatus.entries()]
});
async function exactClubBadge(name,countryCode='',excludeUrls=new Set()){
 if(!name)return '';
 const code=countryCode||canonicalClubCountryCode(name,'');
 const url=safeBadgeImage(window.BTLStaticCrests?.resolve(name,code)||'');
 if(url && !badBadgeUrls.has(url) && !excludeUrls.has(url))return url;
 missingOfficialCrests.add(`${code}:${name}`);
 badgeAttemptStatus.set(`${code}:${name}`,{status:url?'image-unavailable':'not-in-static-catalog',checkedAt:new Date().toISOString()});
 return '';
}

function clubBadgeSources(name,exact=''){
  return [safeBadgeImage(exact)].filter(Boolean);
}

function averageCornerColor(data,w,h){
  const pts=[[1,1],[w-2,1],[1,h-2],[w-2,h-2]],colors=pts.map(([x,y])=>{const i=(y*w+x)*4;return [data[i],data[i+1],data[i+2],data[i+3]];});
  const alpha=colors.reduce((s,c)=>s+c[3],0)/colors.length;if(alpha<180)return null;
  const avg=[0,1,2].map(k=>colors.reduce((s,c)=>s+c[k],0)/colors.length);const spread=Math.max(...colors.flatMap(c=>avg.map((a,k)=>Math.abs(c[k]-a))));
  return spread<=34?avg:null;
}
function processFlatBackground(img,source){
  try{
    const w=source.naturalWidth||source.width,h=source.naturalHeight||source.height;if(!w||!h||w*h>3500000)return;
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0,w,h);
    const image=ctx.getImageData(0,0,w,h),data=image.data,bg=averageCornerColor(data,w,h);if(!bg)return;
    // Remove only pixels connected to the outer edge. This avoids punching holes
    // inside a silver/white trophy that happens to share a colour with the backdrop.
    const seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0,touched=0;
    const colourDistance=idx=>Math.hypot(data[idx*4]-bg[0],data[idx*4+1]-bg[1],data[idx*4+2]-bg[2]);
    const enqueue=(x,y)=>{if(x<0||x>=w||y<0||y>=h)return;const pos=y*w+x;if(seen[pos])return;const d=colourDistance(pos);if(d>66)return;seen[pos]=1;queue[tail++]=pos;};
    for(let x=0;x<w;x++){enqueue(x,0);enqueue(x,h-1);}for(let y=1;y<h-1;y++){enqueue(0,y);enqueue(w-1,y);}
    while(head<tail){const pos=queue[head++],x=pos%w,y=(pos/w)|0,d=colourDistance(pos),i=pos*4;data[i+3]=d<38?0:Math.round(data[i+3]*Math.max(0,Math.min(1,(d-38)/28)));touched++;enqueue(x-1,y);enqueue(x+1,y);enqueue(x,y-1);enqueue(x,y+1);}
    if(touched/(w*h)<.035)return;ctx.putImageData(image,0,0);img.dataset.bgCleaned='1';img.src=canvas.toDataURL('image/png');
  }catch(_){/* CORS or unsupported image: keep original safely. */}
}
function polishSiteImage(img){
  if(!img||img.dataset.bgCleaned||img.dataset.bgCleaning)return;img.style.background='transparent';const src=img.currentSrc||img.src||'';
  if(!src||/\.svg(?:\?|$)/i.test(src)||src.startsWith('data:image/svg'))return;
  if(/^https?:/i.test(src)){
    // Imagens remotas são exibidas diretamente. Não usamos canvas/crossOrigin aqui:
    // isso evita erros de CORS no GitHub Pages e não interfere no carregamento normal do <img>.
    return;
  }
  processFlatBackground(img,img);
}
function polishAllSiteImages(root=document){
  if(!root?.querySelectorAll)return;root.querySelectorAll('img').forEach(img=>{if(img.complete&&img.naturalWidth)polishSiteImage(img);else img.addEventListener('load',()=>polishSiteImage(img),{once:true});});
}
function observeSiteImages(){
  polishAllSiteImages(document);
  if(typeof MutationObserver==='undefined')return;
  const observer=new MutationObserver(mutations=>mutations.forEach(m=>m.addedNodes.forEach(node=>{if(node?.nodeType!==1)return;if(node.tagName==='IMG')polishAllSiteImages(node.parentElement||document);else polishAllSiteImages(node);})));observer.observe(document.body,{childList:true,subtree:true});
}
function applyImageSources(img,sources,fallback){if(!img)return;const list=sources.filter(Boolean);let i=0;const next=()=>{if(i>=list.length){img.classList.add('hidden');fallback?.classList.remove('hidden');return;}img.onerror=next;img.onload=()=>{img.classList.remove('hidden');fallback?.classList.add('hidden');polishSiteImage(img);};img.src=list[i++];};next();}
// Catálogo validado de troféus: prioriza Wikimedia Commons e completa lacunas com anexos locais enviados pelo usuário.
// O antigo mapa FM estava vazio e todos os títulos exibiam no-file.svg.
const TROPHY_ART=window.BTL_COMMONS_TROPHIES||[];
function trophyEntryFor(name){const label=String(name||'');if(/Qualifiers|Eliminat[oó]rias/i.test(label))return null;return TROPHY_ART.find(x=>x.test.test(label))||null;}
function trophySourcesFor(name){const item=trophyEntryFor(name);return item?.src?[item.src]:[];}
function trophyArtFor(name){return trophySourcesFor(name)[0]||'';}
function honourInitials(name){return (name||'BTL').split(/\s+/).filter(Boolean).slice(0,3).map(x=>x[0]).join('').toUpperCase();}
function honourVisual(name){
 const sources=trophySourcesFor(name),safeName=esc(name),initials=esc(honourInitials(name));
 if(!sources.length && /Eliminat[oó]rias|World Cup Qualifiers/i.test(String(name||'')))return '';
 if(!sources.length)return `<span class="honour-art fallback" title="Imagem específica não disponível para esta competição"><b>${initials}</b></span>`;
 const encoded=sources.map(encodeURIComponent).join('|');
 return `<span class="honour-art" title="Troféu: ${safeName}"><img src="${sources[0]}" data-sources="${encoded}" data-index="0" alt="${safeName}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onload="polishSiteImage(this)" onerror="cycleHonourImage(this)"><b>${initials}</b></span>`;
}
function competitionHeaderMarkup(name,sub=''){
 const main=String(name||'COMPETIÇÃO'),extra=String(sub||'').trim();
 const art=honourVisual(main);
 return `<span class="competition-inline">${art}<span class="competition-inline-copy"><b>${esc(main)}</b>${extra?`<small>${esc(extra)}</small>`:''}</span></span>`;
}
window.cycleHonourImage=function(img){
 const sources=(img.dataset.sources||'').split('|').map(decodeURIComponent).filter(Boolean),i=Number(img.dataset.index||0)+1;
 if(i<sources.length){img.dataset.index=String(i);delete img.dataset.bgCleaned;delete img.dataset.bgCleaning;img.src=sources[i];return;}
 const parent=img.parentElement;img.remove();parent?.classList.add('fallback');
};
window.BTLTrophyDiagnostics=()=>({
 source:'Catálogo local: 67 imagens fornecidas pelo usuário',count:TROPHY_ART.filter(x=>!!x.src).length,
 mapped:TROPHY_ART.filter(x=>!!x.src).map(x=>({pattern:x.test.source,url:x.src,page:x.page,isLocal:!!x.isLocal})),
 intentionallyUnavailable:TROPHY_ART.filter(x=>!x.src).map(x=>x.test.source)
});
const TROPHY_PRELOAD_CACHE=[];
function preloadTrophyImages(){
 // A exibição é sob demanda: evita dezenas de downloads remotos em cada inicialização.
}

function countryFlag(code){
  const special={ENG:'🏴',SCO:'🏴',WAL:'🏴',NIR:'🏴'};
  if(special[code]) return special[code];
  if(!code || code.length!==2) return '🌍';
  return code.toUpperCase().replace(/./g,c=>String.fromCodePoint(127397+c.charCodeAt()));
}
function confederation(code){
  // Filiação futebolística real, que nem sempre coincide com a geografia.
  if(code==='AU') return 'AFC';
  if(['IL','AM','AZ','GE','KZ','TR'].includes(code)) return 'UEFA';
  if(code==='GY'||code==='SR') return 'CONCACAF';
  if(CONFEDERATIONS.southAmerica.includes(code)) return 'CONMEBOL';
  if(CONFEDERATIONS.europe.includes(code)) return 'UEFA';
  if(CONFEDERATIONS.concacaf.includes(code)) return 'CONCACAF';
  if(CONFEDERATIONS.asia.includes(code)) return 'AFC';
  if(CONFEDERATIONS.africa.includes(code)) return 'CAF';
  if(CONFEDERATIONS.oceania.includes(code)) return 'OFC';
  return 'Mundial';
}
function genericContinental(code){
  return ({CONMEBOL:'CONMEBOL Libertadores',UEFA:'UEFA Champions League',CONCACAF:'CONCACAF Champions Cup',AFC:'AFC Champions League Elite',CAF:'CAF Champions League',OFC:'OFC Champions League'})[confederation(code)] || 'Competição Continental';
}
function getCompetitionRule(code,countryName){
  return COMPETITION_RULES[code] || {league:`Liga Nacional de ${countryName}`,cup:`Copa Nacional de ${countryName}`,continental:[genericContinental(code)]};
}
function getLeagueFormat(code){
  return LEAGUE_FORMATS[code] || {teams:16,matches:30,mode:'double_round_robin',championPoints:62,label:'16 clubes · 30 rodadas · turno e returno (formato genérico)'};
}
function getLeagueFormatForClub(code,leagueName=''){
  return (typeof MARKET_LEAGUE_FORMATS!=='undefined'&&MARKET_LEAGUE_FORMATS[leagueName]) || getLeagueFormat(code);
}
function findClubData(name,code){
  const local=(LOCAL_CLUBS[code]||[]).find(c=>c.name===name);
  const transfer=TRANSFER_TARGETS.find(c=>c.name===name&&(!code||c.countryCode===code));
  const market=(typeof TRANSFER_MARKET_CLUBS!=='undefined'?TRANSFER_MARKET_CLUBS:[]).find(c=>c.name===name&&(!code||c.countryCode===code));
  const isTopPool=!!code&&(LEAGUE_CLUB_POOLS?.[code]||[]).includes(name);
  // A temporada 2026/27 publicada pelas ligas tem prioridade sobre qualquer registro antigo.
  if(isTopPool)return {...(market||{}),...(local||{}),...(transfer||{}),name,countryCode:code,
    league:getCompetitionRule(code,countryByCode(code)?.name||code).league,divisionLevel:1};
  return market||local||transfer||null;
}
function findClubDataAny(name){
  const market=(typeof TRANSFER_MARKET_CLUBS!=='undefined'?TRANSFER_MARKET_CLUBS:[]).find(c=>c.name===name);if(market)return market;
  for(const clubs of Object.values(LOCAL_CLUBS)){ const hit=clubs.find(c=>c.name===name); if(hit)return hit; }
  return TRANSFER_TARGETS.find(c=>c.name===name) || null;
}
function clubStrength(name,code){ return findClubData(name,code)?.strength || findClubDataAny(name)?.strength || 72; }
function normalizedClub(raw,code){ return {name:raw.name||raw.strTeam,strength:raw.strength||72,badge:raw.badge||raw.strBadge||'',countryCode:code}; }
function allTransferClubs(){
  const fromLocal=Object.entries(LOCAL_CLUBS).flatMap(([countryCode,clubs])=>clubs.map(c=>({...c,countryCode})));
  const market=typeof TRANSFER_MARKET_CLUBS!=='undefined'?TRANSFER_MARKET_CLUBS:[];
  const official=Object.entries(LEAGUE_CLUB_POOLS||{}).flatMap(([countryCode,names])=>names.map(name=>({name,countryCode,strength:findClubData(name,countryCode)?.strength||72,league:getCompetitionRule(countryCode,countryByCode(countryCode)?.name||countryCode).league,divisionLevel:1})));
  const all=[...fromLocal,...TRANSFER_TARGETS,...market,...official];
  return [...new Map(all.map(c=>[`${c.countryCode}:${c.name}`,c])).values()];
}
function clubCompetitionProfile(name,code){
  const c=findClubData(name,code)||{};const base=getCompetitionRule(code,countryByCode(code)?.name||code);
  const year=state?.season?.year||START_YEAR;
  const league=window.BTLSeasonDivisions?.findLeague(state?.leaguePoolsByYear?.[year],code,name)||c.league||base.league;
  const divisionLevel=league===base.league?1:league==='EFL League One'?3:(league===c.league?(c.divisionLevel||1):2);
  return {league,cup:c.cup||base.cup,divisionLevel,continental:divisionLevel>1?[]:(base.continental||[])};
}
function canonicalClubCountryCode(name,fallback=''){
  if(!name)return fallback||'';
  if(/^Athletic(?: Club)?(?: de)? Bilbao$/i.test(name))return 'ES';
  // Athletic Club = Bilbao in LaLiga; Athletic Club = Sao Joao del-Rei in Serie B.
  // Never default to MG when the active competition is Spanish.
  if(/^Athletic(?: Club)?$/i.test(name)){
    if(['ES','BR'].includes(String(fallback||'').toUpperCase()))return String(fallback).toUpperCase();
    const league=String(state?.season?.league?.name||state?.player?.clubLeague||'');
    const activeCountry=state?.season?.countryAtStart||state?.player?.clubCountry||'';
    if(/LaLiga|Hypermotion|Copa del Rey|Copa do Rei/i.test(league)||activeCountry==='ES')return 'ES';
    return 'BR';
  }
  const localHits=Object.entries(LOCAL_CLUBS).filter(([,clubs])=>clubs.some(c=>c.name===name)).map(([code])=>code);
  const poolHits=Object.entries(LEAGUE_CLUB_POOLS||{}).filter(([,clubs])=>clubs.includes(name)).map(([code])=>code);
  const transferHits=(TRANSFER_TARGETS||[]).filter(c=>c.name===name).map(c=>c.countryCode);
  const marketHits=(typeof TRANSFER_MARKET_CLUBS!=='undefined'?TRANSFER_MARKET_CLUBS:[]).filter(c=>c.name===name).map(c=>c.countryCode);
  const hits=[...new Set([...localHits,...poolHits,...transferHits,...marketHits])];
  if(hits.length===1)return hits[0];
  if(fallback&&hits.includes(fallback))return fallback;
  if(hits.includes('BR')&&/^Athletic Club$/i.test(name))return 'BR';
  if(hits.includes('ES')&&/^Athletic Bilbao$/i.test(name))return 'ES';
  return hits.length===1?hits[0]:(fallback||'');
}
function leagueForClub(name,fallbackCode=''){
  const code=canonicalClubCountryCode(name,fallbackCode);
  return clubCompetitionProfile(name,code).league;
}

function formatDateBR(iso){ if(!iso) return '-'; const [y,m,d]=iso.split('-'); return `${d}/${m}/${y}`; }
function calculateAge(iso, reference=new Date()){
  const birth=new Date(`${iso}T12:00:00`);
  let age=reference.getFullYear()-birth.getFullYear();
  const beforeBirthday=reference.getMonth()<birth.getMonth() || (reference.getMonth()===birth.getMonth() && reference.getDate()<birth.getDate());
  if(beforeBirthday) age--;
  return age;
}
function isoDate(date){ return date.toISOString().slice(0,10); }
function setupBirthdateLimits(){
  const today=new Date();
  const max=new Date(today); max.setFullYear(today.getFullYear()-MIN_START_AGE);
  const min=new Date(today); min.setFullYear(today.getFullYear()-(MAX_START_AGE+1)); min.setDate(min.getDate()+1);
  $('#birthdate').min=isoDate(min); $('#birthdate').max=isoDate(max);
}
function sanitizeShirtNumber(){
  const input=$('#number');
  let value=input.value.replace(/\D/g,'').slice(0,2);
  if(value && Number(value)>99) value='99';
  if(value==='0' || value==='00') value='1';
  input.value=value;
}

const ATTRIBUTE_DRAFT_FIELDS = [
  {id:'pace',label:'Ritmo',short:'RIT'},
  {id:'finishing',label:'Finalização',short:'FIN'},
  {id:'dribbling',label:'Drible',short:'DRI'},
  {id:'passing',label:'Passe',short:'PAS'},
  {id:'defense',label:'Defesa',short:'DEF'},
  {id:'physical',label:'Físico',short:'FIS'},
  {id:'weakFoot',label:'Perna ruim',short:'PR'}
];
const GOALKEEPER_ATTRIBUTE_DRAFT_FIELDS = [
  {id:'reflexes',label:'Reflexos',short:'REF'},
  {id:'positioning',label:'Posicionamento',short:'POS'},
  {id:'diving',label:'Elasticidade',short:'ELA'},
  {id:'handling',label:'Manejo',short:'MAN'},
  {id:'speed',label:'Velocidade',short:'VEL'},
  {id:'kicking',label:'Chute',short:'CHU'},
  {id:'physical',label:'Físico',short:'FIS'}
];
const ATTRIBUTE_ICONS = {
  pace:'⚡',finishing:'🎯',dribbling:'🪄',passing:'🧠',defense:'🛡️',physical:'💪',weakFoot:'👣',
  reflexes:'🧤',positioning:'📍',diving:'↔',handling:'✋',speed:'⚡',kicking:'⚽'
};
function attributeFieldsForPosition(position){return position==='Goleiro'?GOALKEEPER_ATTRIBUTE_DRAFT_FIELDS:ATTRIBUTE_DRAFT_FIELDS;}
function gkCard(name,rating,category,reflexes,positioning,diving,handling,speed,kicking,physical){return {name,rating,position:'Goleiro',category,source:category==='historical'?'Auge · goleiros históricos':'Atual · auge de carreira',attributes:{reflexes,positioning,diving,handling,speed,kicking,physical}};}
const GOALKEEPER_DRAFT_PLAYERS=[
  gkCard('Lev Yashin',97,'historical',99,98,98,95,79,91,92),
  gkCard('Gianluigi Buffon',96,'historical',97,99,96,97,68,91,92),
  gkCard('Manuel Neuer',96,'historical',97,98,96,95,88,98,91),
  gkCard('Iker Casillas',95,'historical',99,96,98,93,82,88,84),
  gkCard('Peter Schmeichel',95,'historical',98,96,97,94,72,92,96),
  gkCard('Oliver Kahn',95,'historical',98,97,96,94,70,91,97),
  gkCard('Dino Zoff',94,'historical',95,98,94,97,63,88,90),
  gkCard('Gordon Banks',94,'historical',98,96,97,94,68,86,88),
  gkCard('Edwin van der Sar',94,'historical',95,96,94,96,73,95,89),
  gkCard('Petr Čech',94,'historical',96,97,95,96,66,90,91),
  gkCard('Sepp Maier',93,'historical',97,94,96,92,74,85,89),
  gkCard('Ricardo Zamora',93,'historical',96,95,95,92,70,84,90),
  gkCard('José Luis Chilavert',92,'historical',93,93,92,91,67,98,91),
  gkCard('Cláudio Taffarel',92,'historical',95,94,94,93,72,88,87),
  gkCard('Dida',92,'historical',96,93,95,92,74,89,90),
  gkCard('Júlio César',92,'historical',96,94,95,93,77,87,89),
  gkCard('Peter Shilton',92,'historical',94,96,93,95,64,87,91),
  gkCard('Rinat Dasayev',92,'historical',96,94,95,91,76,88,88),
  gkCard('Walter Zenga',91,'historical',95,94,94,92,72,86,88),
  gkCard('Ubaldo Fillol',91,'historical',96,93,95,91,75,85,87),
  gkCard('Thibaut Courtois',95,'current',97,96,96,95,68,91,92),
  gkCard('Alisson',94,'current',96,95,95,94,85,95,91),
  gkCard('Gianluigi Donnarumma',94,'current',97,94,96,93,75,88,94),
  gkCard('Jan Oblak',94,'current',96,97,95,96,66,88,90),
  gkCard('Ederson',93,'current',93,93,91,91,88,99,87),
  gkCard('Mike Maignan',93,'current',95,94,94,93,86,94,91),
  gkCard('Emiliano Martínez',92,'current',95,94,94,93,71,90,92),
  gkCard('Diogo Costa',92,'current',94,93,94,92,80,94,89),
  gkCard('David Raya',91,'current',93,93,92,94,79,95,86),
  gkCard('Unai Simón',91,'current',93,94,92,93,76,91,88)
];

function legendAttributeSet(player,position=pendingPlayerProfile?.position){
  if(player?.attributes)return {...player.attributes};
  if(position==='Goleiro')return {reflexes:84,positioning:84,diving:84,handling:82,speed:70,kicking:78,physical:82};
  return {pace:75,finishing:75,dribbling:75,passing:75,defense:60,physical:70,weakFoot:3};
}
function attributeDisplayValue(id,value){return id==='weakFoot'?`${value}★`:value;}
function weakFootPotentialValue(stars){return ({1:60,2:70,3:80,4:90,5:99})[stars]||80;}

const POSITION_ATTRIBUTE_WEIGHTS = {
  'Goleiro':{reflexes:.22,positioning:.20,diving:.18,handling:.14,speed:.08,kicking:.08,physical:.10},
  'Zagueiro':{pace:.15,finishing:.04,dribbling:.06,passing:.10,defense:.34,physical:.20,weakFoot:.11},
  'Lateral direito':{pace:.22,finishing:.05,dribbling:.13,passing:.14,defense:.22,physical:.14,weakFoot:.10},
  'Lateral esquerdo':{pace:.22,finishing:.05,dribbling:.13,passing:.14,defense:.22,physical:.14,weakFoot:.10},
  'Volante':{pace:.10,finishing:.06,dribbling:.12,passing:.22,defense:.24,physical:.16,weakFoot:.10},
  'Meia central':{pace:.10,finishing:.10,dribbling:.20,passing:.28,defense:.10,physical:.12,weakFoot:.10},
  'Meia ofensivo':{pace:.12,finishing:.18,dribbling:.24,passing:.24,defense:.05,physical:.07,weakFoot:.10},
  'Meia direita':{pace:.20,finishing:.12,dribbling:.22,passing:.22,defense:.06,physical:.08,weakFoot:.10},
  'Meia esquerda':{pace:.20,finishing:.12,dribbling:.22,passing:.22,defense:.06,physical:.08,weakFoot:.10},
  'Ponta direita':{pace:.24,finishing:.22,dribbling:.24,passing:.10,defense:.03,physical:.06,weakFoot:.11},
  'Ponta esquerda':{pace:.24,finishing:.22,dribbling:.24,passing:.10,defense:.03,physical:.06,weakFoot:.11},
  'Segundo atacante':{pace:.16,finishing:.28,dribbling:.22,passing:.12,defense:.03,physical:.08,weakFoot:.11},
  'Centroavante':{pace:.15,finishing:.35,dribbling:.12,passing:.07,defense:.03,physical:.16,weakFoot:.12}
};
const DEFAULT_ATTRIBUTE_WEIGHTS={pace:.15,finishing:.15,dribbling:.15,passing:.15,defense:.15,physical:.15,weakFoot:.10};
function positionAttributeWeights(position){return POSITION_ATTRIBUTE_WEIGHTS[position]||DEFAULT_ATTRIBUTE_WEIGHTS;}
function primaryAttributeForPosition(position){
  const w=positionAttributeWeights(position);return Object.entries(w).filter(([id])=>id!=='weakFoot').sort((a,b)=>b[1]-a[1])[0][0];
}
function normalizedAttributeValue(id,value){return id==='weakFoot'?weakFootPotentialValue(value):Number(value)||0;}
function weightedAttributeAverage(attributes,position,onlyIds=null){
  const weights=positionAttributeWeights(position);const ids=onlyIds||attributeFieldsForPosition(position).map(f=>f.id);
  let total=0,weightTotal=0;ids.forEach(id=>{if(attributes[id]===undefined)return;const w=weights[id]||0;total+=normalizedAttributeValue(id,attributes[id])*w;weightTotal+=w;});
  return weightTotal?total/weightTotal:68;
}
function calculatePotentialFromAttributes(attributes,position){return clamp(Math.round(weightedAttributeAverage(attributes,position)),68,99);}
function positionWeightedAttributeScore(player,attributesOverride=null){
  const attrs=attributesOverride||normalizePlayerAttributes(player);return weightedAttributeAverage(attrs,player.position);
}
function syncGoalkeeperCompatibility(attrs){
  if(!attrs)return attrs;
  attrs.pace=attrs.speed??attrs.pace??60;
  attrs.defense=Math.round(((attrs.reflexes||70)+(attrs.positioning||70)+(attrs.diving||70)+(attrs.handling||70))/4);
  attrs.passing=attrs.kicking??attrs.passing??65;
  attrs.dribbling=clamp(Math.round((attrs.handling||70)*.72),35,85);
  attrs.finishing=clamp(Math.round((attrs.kicking||70)*.38),25,55);
  attrs.weakFoot=attrs.weakFoot||3;
  return attrs;
}
function buildStartingAttributes(dna,potential,position){
  const attrs={},fields=attributeFieldsForPosition(position);
  fields.forEach(f=>{
    if(f.id==='weakFoot'){attrs[f.id]=dna[f.id];return;}
    attrs[f.id]=clamp(Math.round(68+(dna[f.id]-potential)*.45),35,82);
  });
  return position==='Goleiro'?syncGoalkeeperCompatibility(attrs):attrs;
}
function normalizePlayerAttributes(player){
  const base=player.overall||68;
  if(player.position==='Goleiro'){
    const a=player.attributes||{};
    player.attributes={...a,
      reflexes:a.reflexes??clamp((a.defense||base)+4,45,99),
      positioning:a.positioning??clamp((a.defense||base)+3,45,99),
      diving:a.diving??clamp((a.defense||base)+3,45,99),
      handling:a.handling??clamp((a.defense||base)+1,45,99),
      speed:a.speed??a.pace??clamp(base-8,40,92),
      kicking:a.kicking??a.passing??clamp(base-2,45,99),
      physical:a.physical??clamp(base+2,45,99)
    };
    syncGoalkeeperCompatibility(player.attributes);
  }else if(!player.attributes){
    player.attributes={
      pace:clamp(base+(player.position?.includes('Ponta')?4:0),45,99),
      finishing:clamp(base+(['Centroavante','Segundo atacante'].includes(player.position)?5:-2),45,99),
      dribbling:clamp(base+(['Meia ofensivo','Ponta direita','Ponta esquerda'].includes(player.position)?4:0),45,99),
      passing:clamp(base+((player.position||'').includes('Meia')?5:0),45,99),
      defense:clamp(base+(['Zagueiro','Volante','Lateral direito','Lateral esquerdo'].includes(player.position)?5:-12),35,99),
      physical:clamp(base+2,45,99),weakFoot:4
    };
  }
  player.dnaAttributes=player.dnaAttributes||{...player.attributes};
  player.initialPotential=player.initialPotential||player.potential||80;
  player.attributeOrigins=player.attributeOrigins||{};
  return player.attributes;
}
function ensureAttributeOverallSync(player=state.player,targetOverall=null){
  if(!player)return null;
  const attrs=normalizePlayerAttributes(player),target=clamp(Number(targetOverall??player.overall??68),45,99),fields=attributeFieldsForPosition(player.position).map(f=>f.id);
  let weighted=positionWeightedAttributeScore(player,attrs),guard=0;
  const primary=primaryAttributeForPosition(player.position);
  const emphasis=fields.filter(id=>id!=='weakFoot').sort((a,b)=>(positionAttributeWeights(player.position)[b]||0)-(positionAttributeWeights(player.position)[a]||0));
  while(weighted<target-.55&&guard<150){
    for(const id of emphasis){const bump=id===primary?2:1;attrs[id]=clamp((attrs[id]||50)+bump,35,99);if(positionWeightedAttributeScore(player,attrs)>=target-.55)break;}
    weighted=positionWeightedAttributeScore(player,attrs);guard++;
  }
  if(target>=90&&attrs[primary]<Math.min(97,target+2))attrs[primary]=clamp(Math.max(attrs[primary],target+1),35,99);
  if(player.position==='Goleiro')syncGoalkeeperCompatibility(attrs);
  player.attributes=attrs;return attrs;
}
function drawLegendForDraft(excludeName=''){
  const used=new Set(attributeDraft.usedLegends||[]),goalkeeper=pendingPlayerProfile?.position==='Goleiro';
  const sourcePool=goalkeeper?GOALKEEPER_DRAFT_PLAYERS:LEGEND_POOL;
  let pool=sourcePool.filter(l=>l.name!==excludeName&&!used.has(l.name));
  if(!pool.length)pool=sourcePool.filter(l=>l.name!==excludeName);
  const player=pool[rnd(0,pool.length-1)];
  attributeDraft.current={legend:player,values:legendAttributeSet(player,pendingPlayerProfile?.position)};
}
function selectedDraftCount(){return attributeDraft?Object.keys(attributeDraft.selections||{}).length:0;}
// Editable roster snapshot; never infer a live transfer from a name.
const BTL_PLAYER_NATIONS={
 'BR':'Pelé|Garrincha|Ronaldo Nazário|Ronaldinho|Kaká|Rivaldo|Roberto Carlos|Cafu|Zico|Romário|Sócrates|Jairzinho|Tostão|Marcelo|Bebeto|Careca|Djalma Santos|Leônidas da Silva|Neymar Jr|Raphinha|Vini Jr.|Gabriel Magalhães|Alisson|Ederson|Casemiro|Rodrygo|Vinícius Júnior',
 'AR':'Diego Maradona|Lionel Messi|Alfredo Di Stéfano|Javier Zanetti|Juan Román Riquelme|Gabriel Batistuta|Sergio Agüero|Ángel Di María|Julián Álvarez|Lautaro Martínez|Emiliano Martínez|Omar Sívori|José Manuel Moreno',
 'PT':'Cristiano Ronaldo|Eusébio|Luís Figo|Deco|Rúben Dias|Nuno Mendes|Vitinha|Bruno Fernandes|João Neves|Bernardo Silva|Diogo Costa|Rui Costa',
 'FR':'Zinedine Zidane|Thierry Henry|Kylian Mbappé|Karim Benzema|Patrick Vieira|Claude Makélélé|N’Golo Kanté|Nicolas Anelka|Jean-Pierre Papin|Michel Platini|Marcel Desailly|Just Fontaine|Franck Ribéry|William Saliba|Theo Hernández|Jules Koundé',
 'DE':'Franz Beckenbauer|Gerd Müller|Miroslav Klose|Bastian Schweinsteiger|Matthias Sammer|Günter Netzer|Toni Kroos|Thomas Müller|Joshua Kimmich|Florian Wirtz|Jamal Musiala|Manuel Neuer|Philipp Lahm|Oliver Kahn|Lothar Matthäus',
 'ES':'Xavi|Andrés Iniesta|Iker Casillas|Sergio Ramos|Carles Puyol|David Villa|Gerard Piqué|Xabi Alonso|Fernando Hierro|Raúl|Pedri|Lamine Yamal|Nico Williams|Unai Simón|Rodri|David de Gea|Emilio Butragueño|Fernando Torres',
 'IT':'Paolo Maldini|Andrea Pirlo|Francesco Totti|Alessandro Del Piero|Roberto Baggio|Gianluigi Buffon|Gianluigi Donnarumma|Giorgio Chiellini|Fabio Cannavaro|Marco Verratti|Gaetano Scirea|Giacinto Facchetti|Gianfranco Zola|Alessandro Bastoni|Nicolò Barella',
 'ENG':'David Beckham|Steven Gerrard|Frank Lampard|Paul Scholes|Wayne Rooney|John Terry|Ashley Cole|Rio Ferdinand|Michael Owen|Gary Lineker|Paul Gascoigne|Harry Kane|Bukayo Saka|Cole Palmer|Jude Bellingham|Declan Rice|Alexander Isak',
 'NL':'Johan Cruyff|Marco van Basten|Ruud Gullit|Dennis Bergkamp|Arjen Robben|Robin van Persie|Virgil van Dijk|Frenkie de Jong|Edwin van der Sar|Ruud van Nistelrooy|Wesley Sneijder|Patrick Kluivert|Edgar Davids|Jaap Stam|Ruud Krol',
 'BE':'Kevin De Bruyne|Eden Hazard|Romelu Lukaku|Thibaut Courtois|Vincent Kompany|Youri Tielemans',
 'UY':'Luis Suárez|Edinson Cavani|Diego Forlán|Enzo Francescoli|Obdulio Varela|José Nasazzi|Federico Valverde',
 'HR':'Luka Modrić|Ivan Rakitić|Mario Mandžukić|Mateo Kovačić',
 'NO':'Erling Haaland|Martin Ødegaard',
 'EG':'Mohamed Salah', 'SE':'Zlatan Ibrahimović|Alexander Isak|Gunnar Nordahl',
 'CI':'Didier Drogba|Yaya Touré', 'CM':'Samuel Eto’o|Roger Milla|André Onana',
 'GH':'Michael Essien|Abedi Pelé','CZ':'Petr Čech|Pavel Nedvěd',
 'MX':'Hugo Sánchez', 'RO':'Gheorghe Hagi', 'RS':'Nemanja Vidić|Dragan Džajić',
 'HU':'Ferenc Puskás|Sándor Kocsis|Nándor Hidegkuti','PL':'Robert Lewandowski|Wojciech Szczęsny',
 'SK':'Marek Hamšík', 'TR':'Hakan Çalhanoğlu|Arda Güler',
 'MA':'Achraf Hakimi', 'GE':'Khvicha Kvaratskhelia', 'NG':'Victor Osimhen',
 'DK':'Michael Laudrup|Christian Eriksen', 'US':'Christian Pulisic',
 'JP':'Takefusa Kubo', 'CH':'Granit Xhaka', 'AT':'David Alaba'
};
const BTL_EXTRA_NATIONS={
  'FR':'Ousmane Dembélé|Michael Olise|Raymond Kopa|Lilian Thuram',
  'AR':'Paulo Dybala|Mario Kempes|Daniel Passarella',
  'SE':'Viktor Gyökeres',
  'PT':'Rafael Leão',
  'NIR':'George Best',
  'ENG':'Bobby Charlton|Kevin Keegan|Stanley Matthews|Bobby Moore|Gordon Banks|Alan Shearer',
  'RU':'Lev Yashin',
  'IT':'Franco Baresi|Giuseppe Meazza|Dino Zoff|Gianni Rivera|Sandro Mazzola|Valentino Mazzola|Alessandro Nesta|Paolo Rossi',
  'ES':'Luis Suárez Miramontes',
  'SCO':'Kenny Dalglish',
  'DE':'Karl-Heinz Rummenigge',
  'BR':'Rivelino|Didi|Falcão|Nilton Santos|Carlos Alberto Torres|Dani Alves',
  'DK':'Peter Schmeichel',
  'NL':'Frank Rijkaard|Clarence Seedorf|Johan Neeskens',
  'LR':'George Weah',
  'BG':'Hristo Stoichkov'
};
Object.entries(BTL_EXTRA_NATIONS).forEach(([code,names])=>{BTL_PLAYER_NATIONS[code]=(BTL_PLAYER_NATIONS[code]?BTL_PLAYER_NATIONS[code]+'|':'')+names;});
const BTL_PLAYER_NATION_INDEX=Object.fromEntries(Object.entries(BTL_PLAYER_NATIONS).flatMap(([code,names])=>names.split('|').map(name=>[normalizeKey(name),code])));
const BTL_PLAYER_CLUBS={
 'Ousmane Dembélé':'Paris Saint-Germain','Frenkie de Jong':'Barcelona','Jules Koundé':'Barcelona',
 'Kylian Mbappé':'Real Madrid','Jude Bellingham':'Real Madrid','Vini Jr.':'Real Madrid','Federico Valverde':'Real Madrid','Thibaut Courtois':'Real Madrid',
 'Rodri':'Barcelona','Erling Haaland':'Manchester City','Rúben Dias':'Manchester City','Bernardo Silva':'Real Madrid',
 'Lamine Yamal':'Barcelona','Pedri':'Barcelona','Raphinha':'Barcelona','Robert Lewandowski':'Chicago Fire',
 'Mohamed Salah':'Trabzonspor','Virgil van Dijk':'Liverpool','Florian Wirtz':'Liverpool','Alexander Isak':'Liverpool','Alisson':'Liverpool',
 'Bukayo Saka':'Arsenal','Declan Rice':'Arsenal','William Saliba':'Arsenal','Gabriel Magalhães':'Arsenal','Viktor Gyökeres':'Arsenal',
 'Harry Kane':'Bayern de Munique','Jamal Musiala':'Bayern de Munique','Joshua Kimmich':'Bayern de Munique','Michael Olise':'Bayern de Munique',
 'Lautaro Martínez':'Inter de Milão','Alessandro Bastoni':'Inter de Milão','Nicolò Barella':'Inter de Milão','Hakan Çalhanoğlu':'Inter de Milão',
 'Achraf Hakimi':'Paris Saint-Germain','Nuno Mendes':'Paris Saint-Germain','Vitinha':'Paris Saint-Germain','João Neves':'Paris Saint-Germain','Khvicha Kvaratskhelia':'Paris Saint-Germain',
 'Cristiano Ronaldo':'Al-Nassr','Lionel Messi':'Inter Miami','Neymar Jr':'Santos','Bruno Fernandes':'Manchester United','Cole Palmer':'Chelsea',
 'Gianluigi Donnarumma':'Manchester City','Kevin De Bruyne':'Napoli','Julián Álvarez':'Atlético de Madrid','Paulo Dybala':'Roma',
 'Victor Osimhen':'Galatasaray','Theo Hernández':'Al-Hilal','Rafael Leão':'Milan','Martin Ødegaard':'Arsenal',
 'David Raya':'Arsenal','Diogo Costa':'Porto','Unai Simón':'Athletic Bilbao','Emiliano Martínez':'Aston Villa',
 'Ederson':'Fenerbahçe','Jan Oblak':'Atlético de Madrid','Mike Maignan':'Milan','Nico Williams':'Athletic Bilbao'
};
function currentCardClub(card){const p=window.BTLRosterHub?.lookupPlayer?.(normalizeKey(card.name));return p?.club||CURRENT_PLAYER_META?.[card.name]?.[0]||BTL_PLAYER_CLUBS[card.name]||'';}
function renderDrawIdentity(card){
  const flag=$('#legend-country'),club=$('#legend-club');if(!flag||!club)return;
  const code=BTL_PLAYER_NATION_INDEX[normalizeKey(card.name)]||CURRENT_PLAYER_META?.[card.name]?.[2]||'';
  flag.innerHTML=code?nationalFlagImage(code,countryByCode(code)?.name||code):'<span aria-hidden="true">🌐</span>';
  flag.setAttribute('title',code?countryByCode(code)?.name||code:'Nacionalidade não informada');
  const historical=card.category!=='current';
  club.innerHTML=historical?'<span class="legend-icon-crest" aria-label="Ídolo histórico">ICON ★</span>':`<span class="legend-club-inline">${clubCrestMarkup(currentCardClub(card))}</span><span>${esc(currentCardClub(card)||'Clube não verificado')}</span>`;
  if(!historical)hydratePenaltyBadges(club);
}

function renderAttributeDraft(){
  if(!attributeDraft)return;
  const fields=attributeFieldsForPosition(pendingPlayerProfile?.position),current=attributeDraft.current,selected=attributeDraft.selections,count=selectedDraftCount();
  $('#draft-progress-bar').style.width=`${Math.round(count/fields.length*100)}%`;
  $('#draft-progress-text').textContent=`${count} de ${fields.length}`;
  $('#draft-attribute-label').textContent=count===fields.length?'DNA completo':'Escolha qualquer atributo disponível';
  $('#legend-position').textContent=current.legend.position;
  $('#legend-badge').textContent=current.legend.name.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase();
  $('#legend-name').textContent=current.legend.name;$('#legend-rating').textContent=current.legend.rating;
  if($('#legend-era'))$('#legend-era').textContent=current.legend.category==='current'?'ATUAL · MELHOR FASE':'HISTÓRICO · AUGE';
  renderDrawIdentity(current.legend);
  const noSkipLeft=(attributeDraft.skipsRemaining||0)<=0;$('#reroll-legend').disabled=noSkipLeft;$('#reroll-legend').textContent=noSkipLeft?'Pulo único já utilizado':'Pular este jogador · resta 1';
  const values=current.values,primaryId=primaryAttributeForPosition(pendingPlayerProfile?.position);
  $('#legend-attributes').innerHTML=fields.map(f=>{const already=!!selected[f.id],isPrimary=f.id===primaryId;return `<button type="button" class="draft-attribute-choice ${already?'locked':''} ${isPrimary?'role-primary':''}" data-draft-attribute="${f.id}" ${already?'disabled':''}><span>${f.short}${isPrimary?' ★':''}</span><strong>${attributeDisplayValue(f.id,values[f.id])}</strong><small>${already?'já escolhido':isPrimary?`atributo principal · ${pendingPlayerProfile?.position||''}`:'usar este atributo'}</small></button>`;}).join('');
  $$('[data-draft-attribute]').forEach(btn=>btn.addEventListener('click',()=>selectDraftAttribute(btn.dataset.draftAttribute)));
  $('#draft-slots').innerHTML=fields.map(f=>{const pick=selected[f.id];return `<div class="draft-slot ${pick?'done':'pending'}"><span>${f.short}</span><strong>${pick?attributeDisplayValue(f.id,pick.value):'—'}</strong><small>${pick?pick.legend:'a escolher'}</small></div>`;}).join('');
  if(count===fields.length){const attrs={};fields.forEach(f=>attrs[f.id]=selected[f.id].value);$('#draft-overall-preview').textContent=`POT ${calculatePotentialFromAttributes(attrs,pendingPlayerProfile?.position)}`;}
  else if(count){const partialAttrs={};Object.entries(selected).forEach(([id,p])=>partialAttrs[id]=p.value);$('#draft-overall-preview').textContent=`POT parcial ${Math.round(weightedAttributeAverage(partialAttrs,pendingPlayerProfile?.position,Object.keys(partialAttrs)))}`;}
  else $('#draft-overall-preview').textContent='GER inicial 68';
}
function startAttributeDraft(profile){pendingPlayerProfile=profile;attributeDraft={selections:{},current:null,skipsRemaining:1,usedLegends:[]};drawLegendForDraft();saveDraftState();showView('attribute-draft');renderAttributeDraft();}
function selectDraftAttribute(attributeId){
  if(!attributeDraft||attributeDraft.selections[attributeId])return;
  const fields=attributeFieldsForPosition(pendingPlayerProfile?.position),field=fields.find(f=>f.id===attributeId);if(!field)return;
  const current=attributeDraft.current;attributeDraft.selections[attributeId]={value:current.values[attributeId],legend:current.legend.name,legendRating:current.legend.rating,category:current.legend.category||'historical',source:current.legend.source||''};attributeDraft.usedLegends.push(current.legend.name);saveDraftState();
  if(selectedDraftCount()>=fields.length){renderAttributeDraft();setTimeout(finalizeCareerFromDraft,260);return;}drawLegendForDraft();saveDraftState();renderAttributeDraft();
}
async function finalizeCareerFromDraft(){
  if(careerWorldLoading)return;
  careerWorldLoading=true;
  let starterWorld=null,starterWarning='';
  const status=document.getElementById('world-import-status');
  if(status)status.textContent='Preparando automaticamente o universo de jogadores do Transfermarkt/Kaggle…';
  const draftPreview=document.getElementById('draft-overall-preview');
  if(draftPreview)draftPreview.textContent='Preparando elencos reais para o save…';
  try{
    if(worldRestorePromise)await worldRestorePromise;
    if(!window.BTLWorldCareer||!window.BTLWorldAuto)throw Error('Motor automático indisponível');
    const auto=await window.BTLWorldAuto.load();
    if(!auto?.players?.length)throw Error('Catálogo de jogadores vazio');
    if(!worldStoreReady)throw Error('O navegador não disponibilizou a gravação persistente do universo');
    // Commit atômico da população antes de criar o novo save. Se falhar, não
    // identificamos o save como catálogo completo.
    await worldPersistChain.catch(()=>{});
    await window.BTLWorldCareer.persist(STORAGE_KEY,auto.players,auto.meta);
    starterWorld=auto;
  }catch(error){
    starterWarning=String(error?.message||error);
    console.warn('Carreira iniciada com base local parcial:',error);
  }
  const profile=pendingPlayerProfile,fields=attributeFieldsForPosition(profile.position),dnaAttributes={},attributeOrigins={};
  fields.forEach(f=>{const pick=attributeDraft.selections[f.id];dnaAttributes[f.id]=pick.value;attributeOrigins[f.id]={legend:pick.legend,legendRating:pick.legendRating,category:pick.category,source:pick.source};});
  const overall=68,potential=calculatePotentialFromAttributes(dnaAttributes,profile.position),attributes=buildStartingAttributes(dnaAttributes,potential,profile.position),value=1100000;
  const player={...profile,retirementTarget:window.BTLWorldCareer?.retirementAge({id:'career:'+profile.name+'|'+profile.birthdate})||38,overall,potential,initialPotential:potential,value,titles:0,trophies:[],awards:[],calledUp:false,nationalTeamGames:0,nationalTeamGoals:0,nationalTeamAssists:0,nationalTrust:0,nationalCaptain:false,morale:70,reputation:10,developmentBoost:0,marketBonus:0,retired:false,attributes,dnaAttributes,attributeOrigins};
  state={created:true,player,season:null,history:[],offers:[],news:[`${player.name}, ${player.age} anos, inicia a carreira com GER 68. O DNA escolhido definiu POT ${potential}.`],pendingEvent:null,savedCareers:[...getSavedCareers()]};
  if(starterWorld){
    state.worldPlayers=starterWorld.players;
    state.worldDataset={...starterWorld.meta};
    state.worldDbKey=STORAGE_KEY;
    state.officialSquadImported2026=true;
    state.news.push(`Base Transfermarkt/Kaggle de ${starterWorld.meta.sourceDate} carregada automaticamente com ${starterWorld.players.length} atletas. Elencos após julho/2026 não estão verificados.`);
    worldDirty=false;
  }else{
    state.worldDataset={source:'Elencos parciais locais (não verificados pelo Transfermarkt)',sourceDate:null,automatic:false,error:starterWarning};
    state.news.push('Base completa indisponível. Usando elencos parciais locais; transferências de 2026/27 não estão garantidas.');
  }
  ensureDivisionPools(START_YEAR);state.season=createSeason(player,START_YEAR,undefined);state.lastWorldEvolutionYear=START_YEAR;state.worldEvolutionHistory=[];
  ensureWorldPlayers();if(!starterWorld)worldDirty=true;
  pendingPlayerProfile=null;attributeDraft=null;clearDraftState();careerWorldLoading=false;
  save();showView('career');renderWorldOverview();
  toast(starterWorld?`Carreira iniciada · ${starterWorld.players.length.toLocaleString('pt-BR')} atletas Transfermarkt/Kaggle (jul/2026).`:'Carreira iniciada com banco parcial: dados completos indisponíveis.');
}
function attributeElitePointChance(current){
  if(current<92)return 1;
  if(current===92)return .82;
  if(current===93)return .70;
  if(current===94)return .56;
  if(current===95)return .39;
  if(current===96)return .24;
  if(current===97)return .13;
  if(current>=98)return .065;
  return 1;
}
function gameplayAttributeCeiling(player,id){
  const overall=player.overall||68,weights=positionAttributeWeights(player.position),importance=weights[id]||0;
  let ceiling=overall<80?overall+6:overall<86?overall+5:overall<91?overall+4:overall<94?overall+3:overall<97?overall+2:99;
  if(importance>=.22)ceiling+=1;
  return clamp(ceiling,70,99);
}
function evolvePlayerAttributes(delta,avg){
  const p=state.player,a=normalizePlayerAttributes(p),dna=p.dnaAttributes||a;if(!delta)return;
  const weights=positionAttributeWeights(p.position),fields=attributeFieldsForPosition(p.position).map(f=>f.id).filter(id=>id!=='weakFoot');
  const bonusCeiling=Math.max(0,(p.potential||p.initialPotential||80)-(p.initialPotential||p.potential||80));
  if(delta>0){
    fields.forEach(id=>{
      const importance=weights[id]||.08,naturalTarget=clamp((dna[id]||75)+Math.round(bonusCeiling*.42),35,99),target=Math.min(naturalTarget,gameplayAttributeCeiling(p,id));
      const gap=Math.max(0,target-a[id]);if(gap<=0)return;
      let intended=Math.max(1,Math.min(2,Math.round(delta*(.42+importance*1.55)+(avg>=8.45?1:0))));
      if(importance<.10&&Math.random()>.58)return;
      for(let step=0;step<intended&&a[id]<target;step++){const chance=attributeElitePointChance(a[id])*(step===0?1:.72);if(Math.random()<=chance)a[id]=clamp(a[id]+1,35,99);else if(a[id]>=94)break;}
    });
  }else if(p.position==='Goleiro'){
    ['speed','physical'].forEach(id=>a[id]=clamp((a[id]||65)+delta,35,99));if(avg<6.4)a.handling=clamp((a.handling||70)-1,35,99);syncGoalkeeperCompatibility(a);
  }else{
    ['pace','physical'].forEach(id=>a[id]=clamp(a[id]+delta,35,99));if(avg<6.4)a.dribbling=clamp(a.dribbling-1,35,99);
  }
  ensureAttributeOverallSync(p,p.overall);
}

const CLUB_THEME_SIGNATURES={
  'Liverpool':{tertiary:'#00b2a9',angle:132},'Benfica':{tertiary:'#d1a62c',angle:38},'Stuttgart':{tertiary:'#111111',angle:102},
  'Bayern de Munique':{tertiary:'#176fc1',angle:145},'Arsenal':{tertiary:'#173f78',angle:28},'Manchester United':{tertiary:'#f2c400',angle:118},
  'Flamengo':{tertiary:'#f4f4f4',angle:72},'Internacional':{tertiary:'#f4f4f4',angle:155},'São Paulo':{tertiary:'#111111',angle:24},
  'Barcelona':{tertiary:'#a50044',angle:122},'Real Madrid':{tertiary:'#d6b757',angle:42},'Atlético de Madrid':{tertiary:'#1f4c9a',angle:150},
  'Paris Saint-Germain':{tertiary:'#e8d7a1',angle:64},'Chelsea':{tertiary:'#d5b25b',angle:118},'Manchester City':{tertiary:'#5a255f',angle:32},
  'Juventus':{tertiary:'#d8b44a',angle:88},'Milan':{tertiary:'#f4f4f4',angle:142},'Inter de Milão':{tertiary:'#d5b25b',angle:36},
  'Borussia Dortmund':{tertiary:'#111111',angle:121},'Bayer Leverkusen':{tertiary:'#f4f4f4',angle:52},'RB Leipzig':{tertiary:'#1f4d91',angle:136},
  'Porto':{tertiary:'#d9b764',angle:36},'Sporting CP':{tertiary:'#111111',angle:110},'Santos':{tertiary:'#d8b45a',angle:84},
  'Palmeiras':{tertiary:'#f4f4f4',angle:48},'Grêmio':{tertiary:'#111111',angle:122},'Corinthians':{tertiary:'#d7b153',angle:66},
  'Boca Juniors':{tertiary:'#f1cf35',angle:104},'River Plate':{tertiary:'#111111',angle:24},'Inter Miami':{tertiary:'#f3c2d4',angle:146}
};
function clubThemeHash(name=''){let h=2166136261;for(const ch of String(name)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function deterministicClubTertiary(name,theme){
  const sig=CLUB_THEME_SIGNATURES[name];if(sig?.tertiary)return sig.tertiary;
  const h=clubThemeHash(name),palette=['#d7b153','#111827','#e7edf6','#2c6cb3','#1f8a5b','#6b3bb5','#d47b2b','#2aa6a1'];
  // Se a cor secundária já é marcante, ela vira a terceira camada; caso seja
  // branco/preto, usamos um acento determinístico para que clubes com o mesmo
  // vermelho não acabem visualmente idênticos.
  const secondary=(theme?.secondary||'').toLowerCase();
  if(secondary&& !['#ffffff','#fff','#111111','#000000','#f4f4f4','#f5f5f5'].includes(secondary))return secondary;
  return palette[h%palette.length];
}
function generatedClubTheme(name){
  if(!name)return DEFAULT_THEME;
  // Fallback for unregistered clubs: deterministic, distinct per club. Colours
  // are illustrative until the club is added to the curated palette below.
  const hash=clubThemeHash(name),hue=hash%360,hue2=(hue+44+(hash%76))%360;
  return {accent:`hsl(${hue} 78% 67%)`,secondary:`hsl(${hue2} 67% 77%)`,tertiary:`hsl(${hue2} 63% 57%)`,
    bg:`hsl(${hue} 36% 6%)`,panel:`hsl(${hue} 34% 11%)`,panel2:`hsl(${hue2} 27% 16%)`,
    border:`hsl(${hue} 28% 31%)`,buttonText:'#071015',angle:hash%160+10};
}
// Identidade de clubes com cores conhecidas: cada registro mantém padronagens,
// ângulos e variações próprias com base no nome do clube.
const BTL_CURATED_TEAM_COLORS={
 'Flamengo':['#e43d3d','#151515'],'Vasco':['#f8f8f8','#131313'],'Botafogo':['#f6f6f6','#171717'],'Fluminense':['#8c2246','#2a856a'],
 'Palmeiras':['#27a36a','#e7ece7'],'Corinthians':['#f5f4f1','#17191b'],'Santos':['#f4f4f3','#101011'],'São Paulo':['#e33a4b','#ffffff'],
 'Internacional':['#ed4349','#ffffff'],'Grêmio':['#53b5ed','#121f35'],'Cruzeiro':['#3e85f6','#f2f2f2'],'Atlético Mineiro':['#f1f1f1','#141414'],
 'Bahia':['#3277e5','#db343e'],'Fortaleza':['#2e72e6','#e03f43'],'Ceará':['#ffffff','#121212'],'Athletico Paranaense':['#dc293a','#191919'],
 'Vitória':['#d83f44','#161616'],'Sport Recife':['#de3338','#f5cb4d'],'Coritiba':['#3d9b5b','#ffffff'],'Goiás':['#3ba95a','#fff'],
 'Real Madrid':['#f3f0e9','#c9a750'],'Barcelona':['#ac1646','#174d9e'],'Atlético de Madrid':['#e54551','#2860b6'],'Athletic Bilbao':['#d74446','#fff'],
 'Sevilla':['#e54040','#ffffff'],'Real Betis':['#2db973','#ffffff'],'Betis':['#2db973','#ffffff'],'Valencia':['#f7f7f7','#171717'],
 'Villarreal':['#f0d949','#192d6d'],'Real Sociedad':['#3e7fe8','#f3f4f5'],'Celta de Vigo':['#93c9f6','#ffffff'],
 'Arsenal':['#e8414e','#f5f5f5'],'Liverpool':['#e03f48','#f1efe8'],'Manchester City':['#7ed4f3','#ffffff'],
 'Manchester United':['#df3c38','#eac34b'],'Chelsea':['#3376dc','#f4f4f4'],'Tottenham':['#f5f5f5','#182d50'],
 'Newcastle United':['#f3f3f3','#171717'],'Aston Villa':['#9d3554','#8ed0f5'],'West Ham':['#8d294e','#7dc8eb'],
 'Brighton':['#3679df','#f8f8f8'],'Everton':['#3677df','#f5f5f5'],'Leeds United':['#f4f4f4','#e6d548'],
 'Bayern de Munique':['#df3e4f','#f2f2f2'],'Borussia Dortmund':['#edd640','#181919'],'Bayer Leverkusen':['#de3138','#181818'],
 'RB Leipzig':['#ec414a','#f3f3f3'],'Stuttgart':['#e5414c','#f5f5f5'],'Eintracht Frankfurt':['#de3d3e','#111111'],
 'Schalke 04':['#397ce3','#f5f5f5'],'Hamburgo':['#3465ab','#f6f6f6'],'Hertha Berlim':['#3678d7','#f3f3f3'],
 'Juventus':['#f3f3f3','#111111'],'Milan':['#d84448','#131313'],'Inter de Milão':['#3978d4','#161616'],
 'Napoli':['#59b7ef','#f7f7f7'],'Roma':['#aa3133','#e5b24a'],'Lazio':['#94cbe8','#f4f4f4'],'Atalanta':['#3278d6','#111111'],
 'Paris Saint-Germain':['#294f93','#e94653'],'Marseille':['#64c6ec','#f7f7f7'],'Lyon':['#3e6fbb','#e03b3f'],'Monaco':['#e24b50','#ffffff'],
 'Porto':['#3779d8','#f5f5f5'],'Benfica':['#df4044','#f2f2f2'],'Sporting CP':['#35a56a','#f5f5f5'],'Braga':['#db3b3f','#ffffff'],
 'Ajax':['#e14449','#fff'],'PSV':['#e2474b','#fff'],'Feyenoord':['#e04b50','#f7f7f7'],
 'Boca Juniors':['#234f9a','#f3c83e'],'River Plate':['#f3f3f3','#d53d45'],'Racing Club':['#7cc9ed','#f9f9f9'],
 'Independiente':['#d94143','#f6f6f6'],'San Lorenzo':['#173b87','#c43d42'],'Inter Miami':['#ef9fc3','#191919'],
 'LA Galaxy':['#f2f2f2','#e6c85b'],'Los Angeles FC':['#222222','#c9a650'],'Al Nassr':['#e4ca3b','#2968c3'],
 'Al Hilal':['#386bdd','#f3f3f3'],'Al Ittihad':['#f4ca40','#151515']
};
const BTL_EXTERNAL_CLUB_COLORS_KEY='btl-v17-real-club-colors';
let externalClubColors={};
try{externalClubColors=JSON.parse(localStorage.getItem(BTL_EXTERNAL_CLUB_COLORS_KEY)||'{}')||{}}catch(_){externalClubColors={}}
function rememberClubColors(team,club){
  if(!team?.idTeam||!club?.name||team.strTeam!==club.name)return;
  const valid=v=>/^#[0-9a-f]{6}$/i.test(String(v||''));
  if(valid(team.strColour1)&&valid(team.strColour2)){
    externalClubColors[club.name]=[team.strColour1,team.strColour2];
    localStorage.setItem(BTL_EXTERNAL_CLUB_COLORS_KEY,JSON.stringify(externalClubColors));
  }
}
const btlPaletteMisses=new Set();
async function discoverDocumentedClubPalette(club){
 if(!club||BTL_CURATED_TEAM_COLORS[club]||CLUB_THEMES[club]||externalClubColors[club]||btlPaletteMisses.has(club))return;
 btlPaletteMisses.add(club);
 const code=state.player?.clubCountry,country=countryByCode(code)?.apiName;
 if(!country)return;
 try{
  const api=`https://www.thesportsdb.com/api/v1/json/123/search_all_teams.php?s=Soccer&c=${encodeURIComponent(country)}`;
  const response=await fetch(api,{signal:AbortSignal.timeout(5000)});
  if(!response.ok)return;
  const json=await response.json();
  const team=(json.teams||[]).find(x=>x.idTeam&&x.strSport==='Soccer'&&normalizeKey(x.strTeam)===normalizeKey(club));
  if(!team)return;
  rememberClubColors(team,{name:team.strTeam});
  
 }catch(_){/* Paleta incerta: manter tom neutro até encontrar fonte confirmada. */}
}
function curatedTheme(name){
 const colors=BTL_CURATED_TEAM_COLORS[name];if(!colors)return null;
 const hash=clubThemeHash(name),accent=colors[0],secondary=colors[1];
 return {accent,secondary,tertiary:deterministicClubTertiary(name,{secondary}),bg:'#060d13',panel:'#101d29',panel2:'#172735',border:'#344957',buttonText:'#071014',angle:20+hash%160};
}

function applyClubTheme(name){
  const selected=name||state.player?.club||'';
  const colors=BTL_CURATED_TEAM_COLORS[selected]||externalClubColors[selected]||null;
  const c=curatedTheme(selected)||CLUB_THEMES[selected];
  const primary=c?.accent||colors?.[0]||'#56ffc9',secondary=c?.secondary||colors?.[1]||'#effffc';
  const theme={key:'club-'+normalizeKey(selected),accent:primary,primary,secondary,tertiary:c?.tertiary||secondary,alt:secondary,
    bg:c?.bg||'#07111d',panel:c?.panel||'#0d1b2d',panel2:c?.panel2||'#13243b',border:c?.border||'#345064',
    buttonText:c?.buttonText||'#fff',angle:c?.angle||125};
  applyThemeTokens(theme,'');
  document.body.dataset.visualScope='club';
  document.body.dataset.clubTheme=normalizeKey(selected)||'neutral';
  return theme;
}

const COMPETITION_THEME_PRESETS=[
  {test:/Scottish Premiership|Scottish Cup/i,theme:{key:'scotland',accent:'#57c8fb',secondary:'#ffffff',tertiary:'#172e78',alt:'#abebff',bg:'#071323',panel:'#0c2138',panel2:'#103252',border:'#376d9d',buttonText:'#ffffff',angle:121}},
  {test:/Belgian Pro League|Copa da B[eé]lgica|Belgian Cup/i,theme:{key:'belgium',accent:'#e9d052',secondary:'#ffffff',tertiary:'#151515',alt:'#fff0ac',bg:'#15130a',panel:'#242114',panel2:'#332e19',border:'#786a40',buttonText:'#ffffff',angle:116}},
  {test:/S[uü]per Lig|Copa da Turquia/i,theme:{key:'turkey',accent:'#e6586d',secondary:'#ffffff',tertiary:'#111521',alt:'#f5a4ad',bg:'#170b14',panel:'#261323',panel2:'#361b30',border:'#744958',buttonText:'#ffffff',angle:119}},
  {test:/Liga MX|Copa MX/i,theme:{key:'mx',accent:'#f664b7',secondary:'#ffffff',tertiary:'#7528b2',alt:'#ffb6df',bg:'#17091e',panel:'#290f38',panel2:'#3c164f',border:'#7d4b8b',buttonText:'#ffffff',angle:118}},
  {test:/CONCACAF Champions Cup/i,theme:{key:'concacaf',accent:'#36e3d2',secondary:'#ffffff',tertiary:'#173c7e',alt:'#9bfaf0',bg:'#07141c',panel:'#0d2532',panel2:'#163745',border:'#397382',buttonText:'#ffffff',angle:118}},
  {test:/AFC Champions League Elite|AFC Champions League Two/i,theme:{key:'afc',accent:'#f7c465',secondary:'#ffffff',tertiary:'#222b67',alt:'#ffe5a1',bg:'#13101f',panel:'#24192f',panel2:'#332743',border:'#796477',buttonText:'#ffffff',angle:118}},
  {test:/CAF Champions League/i,theme:{key:'caf',accent:'#eeaa4e',secondary:'#ffffff',tertiary:'#175c36',alt:'#fbd49a',bg:'#11190e',panel:'#1b2a16',panel2:'#293b1d',border:'#657b3c',buttonText:'#ffffff',angle:120}},
  {test:/OFC Champions League/i,theme:{key:'ofc',accent:'#84d0ff',secondary:'#ffffff',tertiary:'#125b95',alt:'#c3eaff',bg:'#061522',panel:'#0e273c',panel2:'#143951',border:'#457c9f',buttonText:'#ffffff',angle:112}},
  {test:/EFL Championship|EFL League One/i,theme:{key:'efl',accent:'#5e9cf6',secondary:'#ffffff',tertiary:'#182b64',alt:'#b0cbff',bg:'#071322',panel:'#12243b',panel2:'#183451',border:'#426a97',buttonText:'#ffffff',angle:124}},
  {test:/Primera Divisi[oó]n Uruguaia|Copa AUF Uruguay/i,theme:{key:'uy',accent:'#75cef4',secondary:'#ffffff',tertiary:'#1f4b8c',alt:'#c0ecfd',bg:'#071725',panel:'#10283c',panel2:'#163951',border:'#457b94',buttonText:'#ffffff',angle:121}},
  {test:/Categor[ií]a Primera A|Copa Colombia/i,theme:{key:'col',accent:'#f7d24e',secondary:'#ffffff',tertiary:'#cf3b3b',alt:'#f9e79d',bg:'#17100b',panel:'#292015',panel2:'#3b2b1b',border:'#78613e',buttonText:'#ffffff',angle:118}},
  {test:/Primera Divisi[oó]n do Chile|Copa Chile/i,theme:{key:'chile',accent:'#4aa9ed',secondary:'#ffffff',tertiary:'#ef4b62',alt:'#9cddff',bg:'#0b1325',panel:'#152239',panel2:'#1a3050',border:'#4c6b91',buttonText:'#ffffff',angle:116}},

  {test:/UEFA Champions League/i,theme:{key:'ucl',accent:'#4fd0ff',secondary:'#ffffff',tertiary:'#173c9b',alt:'#7ad9ff',bg:'#031122',panel:'#081a38',panel2:'#0f2753',border:'#2f5d94',buttonText:'#f7fcff',angle:118}},
  {test:/UEFA Europa League/i,theme:{key:'uel',accent:'#ff7b2f',secondary:'#ffffff',tertiary:'#161616',alt:'#ffb57d',bg:'#140904',panel:'#241106',panel2:'#33180b',border:'#8f4b27',buttonText:'#fff7f2',angle:106}},
  {test:/UEFA Conference League/i,theme:{key:'uecl',accent:'#44d07e',secondary:'#ffffff',tertiary:'#0e0f10',alt:'#94efb6',bg:'#07130d',panel:'#0f2418',panel2:'#133220',border:'#2f7950',buttonText:'#f5fff8',angle:130}},
  {test:/CONMEBOL Libertadores/i,theme:{key:'lib',accent:'#d9b15a',secondary:'#ffffff',tertiary:'#0f214d',alt:'#f0d396',bg:'#081120',panel:'#0d1a33',panel2:'#12264a',border:'#6f6090',buttonText:'#fffaf0',angle:112}},
  {test:/CONMEBOL Sul-Americana/i,theme:{key:'sula',accent:'#f29b38',secondary:'#ffffff',tertiary:'#101010',alt:'#ffd08a',bg:'#12100b',panel:'#24190d',panel2:'#312010',border:'#7b5930',buttonText:'#fff9f1',angle:104}},
  {test:/Premier League|FA Cup|League Cup|Community Shield/i,theme:{key:'pl',accent:'#34f5c5',secondary:'#ffffff',tertiary:'#5d2a86',alt:'#8df8df',bg:'#180622',panel:'#250b35',panel2:'#34114a',border:'#5f4784',buttonText:'#fbf8ff',angle:132}},
  {test:/LaLiga|Copa del Rey|Supercopa da Espanha/i,theme:{key:'laliga',accent:'#ff5f7d',secondary:'#ffffff',tertiary:'#ff9a2f',alt:'#ff9eb0',bg:'#1a0a18',panel:'#31122d',panel2:'#42173c',border:'#7b4e70',buttonText:'#fff8fb',angle:123}},
  {test:/Bundesliga|DFB-Pokal|DFL-Supercup/i,theme:{key:'bund',accent:'#ff4343',secondary:'#ffffff',tertiary:'#111111',alt:'#ff9898',bg:'#140709',panel:'#290d12',panel2:'#361018',border:'#7f4550',buttonText:'#fff8f8',angle:118}},
  {test:/Serie A|Coppa Italia|Supercoppa Italiana/i,theme:{key:'seriea',accent:'#52b7ff',secondary:'#ffffff',tertiary:'#103d8b',alt:'#9ed8ff',bg:'#06111e',panel:'#0c1c33',panel2:'#122b4d',border:'#315c87',buttonText:'#f7fcff',angle:116}},
  {test:/Ligue 1|Coupe de France|Trophée des Champions/i,theme:{key:'ligue1',accent:'#c6f750',secondary:'#ffffff',tertiary:'#182b59',alt:'#e4ff9f',bg:'#08111e',panel:'#0d1a31',panel2:'#122548',border:'#445e83',buttonText:'#f8fff1',angle:124}},
  {test:/Primeira Liga|Taça de Portugal|Supertaça Cândido de Oliveira/i,theme:{key:'primeiraliga',accent:'#18d07e',secondary:'#ffffff',tertiary:'#c73b44',alt:'#7decb4',bg:'#081510',panel:'#10251d',panel2:'#173227',border:'#44655b',buttonText:'#f6fff9',angle:128}},
  {test:/Eredivisie|KNVB Beker|Johan Cruyff Shield/i,theme:{key:'ered',accent:'#ff7b27',secondary:'#ffffff',tertiary:'#111111',alt:'#ffb36e',bg:'#150a06',panel:'#271108',panel2:'#33170b',border:'#8a4c28',buttonText:'#fff8f3',angle:112}},
  {test:/Brasileir[aã]o|Copa do Brasil|Supercopa do Brasil|Supercopa Rei/i,theme:{key:'br',accent:'#23b7ff',secondary:'#ffffff',tertiary:'#ffd648',alt:'#90dcff',bg:'#041521',panel:'#0a2236',panel2:'#10304a',border:'#3a6081',buttonText:'#f8fdff',angle:119}},
  {test:/Liga Profesional Argentina|Copa Argentina/i,theme:{key:'arg',accent:'#79d6ff',secondary:'#ffffff',tertiary:'#1f87d9',alt:'#bbefff',bg:'#07131f',panel:'#0d1f31',panel2:'#13304a',border:'#436681',buttonText:'#f8fdff',angle:121}},
  {test:/Major League Soccer|MLS|U\.S\. Open Cup/i,theme:{key:'mls',accent:'#ffffff',secondary:'#8fd0ff',tertiary:'#ff5a5f',alt:'#cfe9ff',bg:'#0a101a',panel:'#111c2b',panel2:'#18263b',border:'#4a5d75',buttonText:'#f8fbff',angle:110}},
  {test:/Saudi Pro League|King Cup/i,theme:{key:'spl',accent:'#d4ff45',secondary:'#ffffff',tertiary:'#0b5d3b',alt:'#edff9e',bg:'#09150f',panel:'#12251b',panel2:'#183126',border:'#446657',buttonText:'#fbfff1',angle:126}},
  {test:/J1 League|Copa do Imperador/i,theme:{key:'j1',accent:'#ffffff',secondary:'#ff4c57',tertiary:'#101010',alt:'#ff9ea6',bg:'#12090a',panel:'#251011',panel2:'#35181a',border:'#7d4d55',buttonText:'#fff9f9',angle:107}},
  {test:/FIFA World Cup|Copa do Mundo|Eliminat[oó]rias da Copa do Mundo/i,theme:{key:'wc',accent:'#f1cb67',secondary:'#ffffff',tertiary:'#18306f',alt:'#f7dfa0',bg:'#091121',panel:'#111d38',panel2:'#182953',border:'#5d6290',buttonText:'#fffdf6',angle:117}},
  {test:/Copa Am[eé]rica/i,theme:{key:'ca',accent:'#6ed6ff',secondary:'#ffffff',tertiary:'#e6bc55',alt:'#b5edff',bg:'#061322',panel:'#0d2136',panel2:'#12304b',border:'#516487',buttonText:'#f8fdff',angle:118}},
  {test:/UEFA Nations League|Finalissima/i,theme:{key:'nations',accent:'#79b7ff',secondary:'#ffffff',tertiary:'#834ad8',alt:'#bedaff',bg:'#091225',panel:'#111d37',panel2:'#182b53',border:'#556286',buttonText:'#f8fbff',angle:118}}
];
function themedCompetitionContext(){
  if(state.pendingPenaltyShootout?.competition)return {competition:state.pendingPenaltyShootout.competition,stage:state.pendingPenaltyShootout.stage,type:'cup'};
  if(state.pendingMatchDecision?.event?.competition)return state.pendingMatchDecision.event;
  if(nextEventCache?.competition)return nextEventCache;
  const s=state.season,p=state.player;
  if(s?.league?.name)return {competition:s.league.name,type:'league'};
  if(p?.clubCup)return {competition:p.clubCup,type:'cup'};
  if(p?.clubLeague)return {competition:p.clubLeague,type:'league'};
  return {competition:'Be The Legend',type:'generic'};
}
function competitionThemeForName(name='',countryCode=''){
  const workbookTheme=window.BTLCompetitionPalettes?.theme(name,countryCode);
  if(workbookTheme)return workbookTheme;
  const hit=COMPETITION_THEME_PRESETS.find(entry=>entry.test.test(name||''));
  if(hit)return hit.theme;
  return {key:'default',accent:'#56ffc9',secondary:'#eefcff',tertiary:'#72c7ff',alt:'#b8ffea',bg:'#07111d',panel:'#0d1b2d',panel2:'#13243b',border:'#345064',buttonText:'#f6fffb',angle:124};
}
function applyThemeTokens(theme,competitionLabel=''){
  const root=document.documentElement;
  root.style.setProperty('--competition-primary',theme.primary||theme.accent);
  root.style.setProperty('--competition-secondary',theme.secondary||theme.accent);
  root.style.setProperty('--competition-tertiary',theme.tertiary||theme.alt||theme.accent);
  root.style.setProperty('--competition-panel',theme.panel||'#101b30');
  root.style.setProperty('--green',theme.accent);
  root.style.setProperty('--volt',theme.accent);
  root.style.setProperty('--cyan',theme.secondary||theme.accent);
  root.style.setProperty('--club-ambient',theme.accent);
  root.style.setProperty('--club-ink',theme.bg||'#060d13');
  root.style.setProperty('--green2',theme.alt||theme.accent);
  root.style.setProperty('--club-primary',theme.accent);
  root.style.setProperty('--club-secondary',theme.secondary||theme.accent);
  root.style.setProperty('--club-tertiary',theme.tertiary||theme.alt||theme.accent);
  root.style.setProperty('--club-angle',`${theme.angle||120}deg`);
  root.style.setProperty('--club-pattern-size','52px');
  root.style.setProperty('--button-text',theme.buttonText||'#ffffff');
  root.style.setProperty('--bg',theme.bg||'#07111d');
  root.style.setProperty('--panel',theme.panel||'#0d1b2d');
  root.style.setProperty('--panel2',theme.panel2||'#13243b');
  root.style.setProperty('--border',theme.border||'#345064');
  root.style.setProperty('--theme-flash',theme.accent);
  root.style.setProperty('--club-haze',`color-mix(in srgb, ${theme.accent} 22%, #08101b)`);
  root.style.setProperty('--club-panel-shine',`color-mix(in srgb, ${theme.secondary||theme.accent} 10%, #111d2b)`);
  root.style.setProperty('--game-club-color',theme.accent);
  root.style.setProperty('--game-club-rival',theme.secondary||theme.accent);
  root.style.setProperty('--game-club-third',theme.tertiary||theme.accent);
  root.style.setProperty('--game-club-dark',theme.bg||'#061016');
  root.style.setProperty('--story-accent',theme.accent);
  const hudClub=document.getElementById('btl-hud-club');
  const hudLeague=document.getElementById('btl-hud-league');
  const hudSeason=document.getElementById('btl-hud-season');
  const hudRating=document.getElementById('btl-hud-rating');
  if(hudClub)hudClub.textContent=state.player?.club||state.player?.nationality||'BE THE LEGEND';
  if(hudLeague)hudLeague.textContent=competitionLabel||state.player?.clubLeague||'MODO CARREIRA';
  if(hudSeason)hudSeason.textContent=state.season?.year||'—';
  if(hudRating)hudRating.textContent=state.player?`GER ${state.player.overall||'—'}`:'GER —';
}
function applyCompetitionExperienceTheme(context=themedCompetitionContext()){
  document.body.dataset.visualScope='competition';
  const competitionLabel=context?.competition||'';
  const theme=competitionThemeForName(competitionLabel,context?.countryCode||state.player?.clubCountry||'');
  applyThemeTokens(theme,competitionLabel);
  const current=document.body.dataset.competitionTheme||'';
  if(theme.key && current!==theme.key){
    document.body.dataset.competitionTheme=theme.key;
    document.body.classList.remove('theme-pulse');
    void document.body.offsetWidth;
    document.body.classList.add('theme-pulse');
    setTimeout(()=>document.body.classList.remove('theme-pulse'),650);
  }
}
async function resolveClubBadge(name,countryCode=''){ const exact=await exactClubBadge(name,countryCode); return safeBadgeImage(exact)||''; }
async function hydrateBadge(img,name,fallback,countryCode=''){
 if(!img||!name)return;
 const seq=String((Number(img.dataset.badgeSequence||'0')+1));img.dataset.badgeSequence=seq;
 const code=countryCode||canonicalClubCountryCode(name,'');
 const rejected=new Set();
 async function next(){
   const candidate=await exactClubBadge(name,code,rejected);
   if(img.dataset.badgeSequence!==seq||!img.isConnected)return;
   if(!candidate){img.classList.add('hidden');fallback?.classList.remove('hidden');return;}
   img.onerror=()=>{
     if(img.dataset.badgeSequence!==seq)return;
     rejected.add(candidate);dropBadgeUrl(candidate);
     next();
   };
   img.onload=()=>{
     if(img.dataset.badgeSequence!==seq)return;
     setCachedBadge(name,code,candidate);
     missingOfficialCrests.delete(`${code}:${name}`);badgeAttemptStatus.set(`${code}:${name}`,{status:'loaded',source:candidate,checkedAt:new Date().toISOString()});
     img.classList.remove('hidden');fallback?.classList.add('hidden');
     polishSiteImage(img);
   };
   img.decoding='async';img.src=candidate;
   if(img.complete&&img.naturalWidth)img.onload();
 }
 await next();
}
function clubCrestMarkup(name,countryCode=''){
  const cached=getCachedBadge(name,countryCode);
  const safe=esc(name||'Clube');
  const src=cached;
  return `<span class="crest-shell penalty-crest" data-penalty-club="${safe}" data-penalty-country="${esc(countryCode||'')}"><img class="club-badge-img ${src?'':'hidden'}" ${src?`src="${esc(src)}"`:''} alt="Escudo de ${safe}" loading="lazy"><span class="crest-fallback ${src?'hidden':''}" title="Clube identificado pelo nome">${safe}</span></span>`;
}
function hydratePenaltyBadges(root=document){
  root?.querySelectorAll?.('[data-penalty-club]').forEach(el=>hydrateBadge(el.querySelector('img'),el.dataset.penaltyClub,el.querySelector('.crest-fallback'),el.dataset.penaltyCountry||''));
}
function hydrateRenderedBadges(){
  $$('.club-option[data-club-name]').forEach(el=>hydrateBadge(el.querySelector('img'),el.dataset.clubName,el.querySelector('.crest-fallback'),el.dataset.clubCountry||''));
  $$('.offer[data-club-name]').forEach(el=>hydrateBadge(el.querySelector('img'),el.dataset.clubName,el.querySelector('.crest-fallback'),el.dataset.clubCountry||''));
}

const POSITION_MENU_UI={
 'Goleiro':{code:'GOL',icon:'🧤'},'Zagueiro':{code:'ZAG',icon:'🛡️'},
 'Lateral direito':{code:'LD',icon:'↗️'},'Lateral esquerdo':{code:'LE',icon:'↖️'},
 'Volante':{code:'VOL',icon:'⚓'},'Meia central':{code:'MC',icon:'🎯'},
 'Meia ofensivo':{code:'MEI',icon:'✨'},'Meia direita':{code:'MD',icon:'➡️'},
 'Meia esquerda':{code:'ME',icon:'⬅️'},'Segundo atacante':{code:'SA',icon:'⚡'},
 'Ponta direita':{code:'PD',icon:'💨'},'Ponta esquerda':{code:'PE',icon:'🔥'},
 'Centroavante':{code:'ATA',icon:'🥅'}
};

function populateCreationFields(){
  const countrySelect=$('#nationality');
  COUNTRIES.slice().sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')).forEach(c=>{
    const opt=document.createElement('option');opt.value=c.code;opt.textContent=c.name;countrySelect.appendChild(opt);
  });
  POSITIONS.forEach(pos=>{const opt=document.createElement('option');opt.value=pos;opt.textContent=`${POSITION_MENU_UI[pos]?.icon||'⚽'} ${POSITION_MENU_UI[pos]?.code||pos}`;opt.title=pos;$('#position').appendChild(opt);});
  const idolSelect=$('#idol');if(idolSelect){IDOL_POOL.forEach(i=>{const opt=document.createElement('option');opt.value=i.id;opt.textContent=i.name;idolSelect.appendChild(opt);});idolSelect.addEventListener('change',updateIdolPreview);updateIdolPreview();}
}
function updateIdolPreview(){
  const box=$('#idol-preview'),idol=idolById($('#idol')?.value);if(!box)return;
  if(!idol){box.innerHTML='<span class="idol-preview-empty">Escolha seu ídolo.</span>';return;}
  box.innerHTML=`<span class="idol-avatar-mark">${idolInitials(idol.name)}</span><div><strong>${esc(idol.name)} ${nationalFlagImage(idol.code,idol.country)}</strong></div>`;
}


function countryClubBase(code){
  const names=LEAGUE_CLUB_POOLS[code]||[];
  const known=(LOCAL_CLUBS[code]||[]).map(c=>({...normalizedClub(c,code),league:getCompetitionRule(code,countryByCode(code)?.name||code).league,cup:getCompetitionRule(code,countryByCode(code)?.name||code).cup,divisionLevel:1}));
  const main=names.map(name=>({name,strength:clubStrength(name,code),badge:'',countryCode:code,league:getCompetitionRule(code,countryByCode(code)?.name||code).league,cup:getCompetitionRule(code,countryByCode(code)?.name||code).cup,divisionLevel:1}));
  const lower=(typeof TRANSFER_MARKET_CLUBS!=='undefined'?TRANSFER_MARKET_CLUBS:[]).filter(c=>c.countryCode===code&&!names.includes(c.name)).map(c=>({...c,badge:c.badge||''}));
  const verified=new Set(names);
  const merged=[...lower,...known.filter(c=>!verified.has(c.name)),...main];
  return [...new Map(merged.map(c=>[c.name,c])).values()];
}
async function fetchCountryClubs(country){
  const local=countryClubBase(country.code);
  const status=$('#club-status');status.textContent=`Confirmando clubes reais de ${country.name}...`;status.classList.add('loading');
  try{
    // Preferir IDs validados por API-Sports quando o deploy possui uma chave.
    // Escudos tentam API-Sports, TheSportsDB e, por último, Wikimedia Commons.
    try{
      const response=await fetch(`/api/verified-clubs?country=${encodeURIComponent(country.apiName)}`,{signal:AbortSignal.timeout(5000)});
      if(response.ok){
        const data=await response.json(),rule=getCompetitionRule(country.code,country.name);
        const apiTeams=(data.clubs||[]).filter(c=>Number(c.id)>0&&c.name).map(c=>{
          const existing=local.find(x=>normalizeKey(x.name)===normalizeKey(c.name));
          return existing||{name:c.name,strength:clubStrength(c.name,country.code),badge:'',countryCode:country.code,league:rule.league,cup:rule.cup,divisionLevel:1,apiId:c.id};
        });
        if(apiTeams.length>=3){
          const unique=[...new Map([...local,...apiTeams].map(x=>[normalizeKey(x.name),x])).values()];
          return {clubs:unique,source:'API-Sports · identidades por ID e base nacional'};
        }
      }
    }catch(_){/* Sem chave configurada ou offline: usar listas reais já cadastradas. */}
    if(local.length>=3)return {clubs:local,source:'base cadastrada de clubes reais'};
    const response=await fetch(`https://www.thesportsdb.com/api/v1/json/123/search_all_teams.php?s=Soccer&c=${encodeURIComponent(country.apiName)}`);
    if(!response.ok)throw new Error('Falha na API');
    const data=await response.json();const base=getCompetitionRule(country.code,country.name);
    const teams=(data.teams||[]).filter(t=>t.strTeam&&t.strSport==='Soccer'&&t.idTeam&&!/^(?:club|team|clube|time)\s*\d+$/i.test(t.strTeam)).map(t=>({...normalizedClub(t,country.code),league:base.league,cup:base.cup,divisionLevel:1}));
    const unique=[...new Map(teams.map(t=>[t.name,t])).values()];teams.forEach((club,i)=>rememberClubColors((data.teams||[]).filter(t=>t.strTeam&&t.strSport==='Soccer'&&t.idTeam&&!/^(?:club|team|clube|time)\s*\d+$/i.test(t.strTeam))[i],club));if(unique.length>=3)return {clubs:unique,source:'TheSportsDB'};throw new Error('Poucos clubes');
  }catch(_){
    const base=getCompetitionRule(country.code,country.name);
    return {clubs:local,source:'Base local de clubes reais · consulta externa indisponível'};
  }finally{status.classList.remove('loading');}
}
function updateClubRerollButton(){
  const btn=$('#reroll-clubs');if(!btn)return;btn.disabled=!$('#nationality').value||creationClubRerollsRemaining<=0||creationClubPool.length===0;btn.textContent=creationClubRerollsRemaining>0?`Sortear novamente · ${creationClubRerollsRemaining} restante(s)`:'Limite de 3 novos sorteios atingido';
}
async function loadClubChoices(){
  const code=$('#nationality').value;$('#selected-club').value='';$('#create-submit').disabled=true;$('#club-options').innerHTML='';creationClubRerollsRemaining=3;creationSeenClubs=new Set();
  if(!code){$('#club-status').textContent='Selecione sua nacionalidade para sortear os clubes.';updateClubRerollButton();return;}
  $('#reroll-clubs').disabled=true;const result=await fetchCountryClubs(countryByCode(code));creationClubPool=result.clubs;$('#club-status').dataset.source=result.source;drawThreeClubs();updateClubRerollButton();
}
function drawThreeClubs(){
  const source=$('#club-status').dataset.source||'base de clubes';let pool=creationClubPool.filter(c=>!creationSeenClubs.has(c.name));if(pool.length<3)pool=creationClubPool;
  creationChoices=sample(pool,Math.min(3,pool.length));creationChoices.forEach(c=>creationSeenClubs.add(c.name));
  $('#club-status').innerHTML='';
  $('#club-options').innerHTML=creationChoices.map((c,i)=>{
    const profile={...clubCompetitionProfile(c.name,c.countryCode),...c};const division=profile.divisionLevel>1?` · ${profile.divisionLevel}ª divisão`:'';
    return `<button type="button" class="club-option" data-club-index="${i}" data-club-name="${c.name.replace(/"/g,'&quot;')}" data-club-country="${c.countryCode||''}"><span class="check"></span><span class="crest-shell small"><img class="club-badge-img hidden" alt=""><span class="crest-fallback" title="Escudo real ainda não localizado">S/D</span></span><strong>${c.name}</strong></button>`;
  }).join('');
  $$('.club-option').forEach(btn=>btn.addEventListener('click',()=>selectCreationClub(+btn.dataset.clubIndex)));hydrateRenderedBadges();updateClubRerollButton();
}
function selectCreationClub(index){
  const selected=creationChoices[index];$('#selected-club').value=selected.name;$$('.club-option').forEach((el,i)=>{el.classList.toggle('selected',i===index);el.querySelector('.check').textContent=i===index?'✓':'';});$('#create-submit').disabled=false;
}
function qualificationForClub(code,strength){
  const rule=getCompetitionRule(code,countryByCode(code)?.name||'seu país');const list=rule.continental||[];if(!list.length)return null;
  if(code==='BR'){ if(strength>=82)return list[0]; if(strength>=76)return Math.random()<.6?list[0]:list[1]; return Math.random()<.2?list[1]:null; }
  if(confederation(code)==='UEFA'){
    if(strength>=87)return list[0]; if(strength>=81)return Math.random()<.55?list[0]:list[1]; if(strength>=76)return Math.random()<.55?list[1]:list[2]; return Math.random()<.15?list[2]:null;
  }
  return strength>=80||Math.random()<.2?list[0]:null;
}
// Qualificação para o ano seguinte: a posição é SEMPRE lida da mesma tabela
// que aparece no resumo da temporada; nunca se re-sorteia o classificado.
function applyQualifyingPositions(countryCode,standings,options={}){
  if(!window.BTLQualification?.hasCountry(countryCode))return (standings||[]).map(r=>({...r,qualification:null}));
  return window.BTLQualification.assign(countryCode,standings,options);
}
function endOfSeasonQualificationOptions(s=state.season,code=s?.countryAtStart||state.player?.clubCountry,rows=s?.league?.standings||[],simulated=false){
 const year=Number(s?.year||START_YEAR);
 state.seasonOutcomesByYear=state.seasonOutcomesByYear||{};
 const global=state.seasonOutcomesByYear[year]=state.seasonOutcomesByYear[year]||{};
 const isOwnCountry=code===(s?.countryAtStart||state.player?.clubCountry);
 const ownsFirstDivision=isOwnCountry&&s?.divisionLevel===1&&
   s.league?.name===getCompetitionRule(code,countryByCode(code)?.name||code).league;
 const own=ownsFirstDivision&&!simulated;
 const cup=s?.cup,leagueCup=s?.leagueCup,club=s?.clubAtStart||state.player?.club;
 const hints=own?{
   actualCupWinner:cup?.won?club:'',
   actualCupRunnerUp:cup?.eliminated&&cup.stageIndex===cup.stages.length-1?club:'',
   finalOpponent:cup?.opponent||'',
   excludedCupWinners:cup?.eliminated?[club]:[]
 }:{};
 const teamNames=(rows||[]).map(r=>r.team);
 if(!global[code]||global[code].participants?.join('|')!==teamNames.join('|')){
   const simulatedOutcomes=window.BTLSeasonOutcomes?.determine(code,year,rows,hints)||{year,country:code,participants:teamNames,source:'simulação simplificada'};
   global[code]=simulatedOutcomes;
 }
 const result=global[code];
 const options={...result,year,simulatedStandings:simulated||!own};
 if(own&&leagueCup?.won)options.leagueCupWinner=club;
 if(own&&leagueCup?.eliminated&&leagueCup.stageIndex===leagueCup.stages.length-1&&leagueCup.opponent){
   options.leagueCupWinner=leagueCup.opponent;
 }
 // O EPS da UEFA depende dos resultados europeus da associação. Não
 // inventar vencedores de cotas extras caso essa classificação não exista.
 options.epsCountry=Boolean(state.uefaEpsBySeason?.[year]?.includes(code));
 return options;
}
function qualifiedForYear(country,club,completedYear){
 const record=state.qualificationsByYear?.[completedYear]?.[country]||[];
 const hit=record.find(x=>x.team===club);return hit?.qualification||null;
}
function qualificationRowsForYear(qualificationYear,competition){
 if(Number(qualificationYear)===2026){
   const verified=window.BTLInitialInternational?.participants(competition,qualificationYear);
   if(verified)return verified;
 }
 const prev=state.qualificationsByYear?.[Number(qualificationYear)-1];if(!prev)return null;
 const rows=Object.values(prev).flat();return rows.filter(r=>r.qualification?.competition===competition).map(r=>r.team);
}
// Outros campeonatos têm classificação SIMULADA, nunca anunciada como resultado
// oficial histórico. As 19 primeiras divisões da base principal produzem vagas
// persistentes, permitindo confrontar os classificados com a temporada seguinte.
function persistGlobalQualificationTables(s=state.season){
 if(!s?.league?.finished)return;
 state.qualificationsByYear=state.qualificationsByYear||{};
 const year=s.year,world=state.qualificationsByYear[year]=state.qualificationsByYear[year]||{};
 const ownCode=s.countryAtStart||state.player.clubCountry;
 const catalog={...(LEAGUE_CLUB_POOLS||{})};
 // After the initial year, consult promoted/relegated pools, not the fixed 2026 lists.
 const divisions=state.leaguePoolsByYear?.[year]||{};
 for(const [code,names] of Object.entries(LEAGUE_CLUB_POOLS||{})){
   const league=getCompetitionRule(code,countryByCode(code)?.name||code).league;
   const actual=divisions[window.BTLSeasonDivisions?.key(code,league)];
   if(actual?.length)catalog[code]=actual;
 }
 // Incluir as demais primeiras divisões cadastradas no mercado; não incluir
 // divisões de acesso nas vagas continentais por posição.
 const groupsByCountry={};
 for(const club of (typeof TRANSFER_MARKET_CLUBS!=='undefined'?TRANSFER_MARKET_CLUBS:[])){
   const code=club.countryCode,league=String(club.league||'');
   if(!code||catalog[code]||!window.BTLQualification?.hasCountry(code)||
      (club.divisionLevel||1)>1||/Championship|League One|2\. Bundesliga|HyperMotion|Liga Portugal 2|Série B|Serie B$|Ligue 2/i.test(league))continue;
   const group=(groupsByCountry[code]=groupsByCountry[code]||{});
   (group[league]=group[league]||[]).push(club.name);
 }
 for(const [code,groups] of Object.entries(groupsByCountry)){
   const candidates=Object.values(groups).sort((a,b)=>b.length-a.length);
   if(candidates[0]?.length>=3)catalog[code]=candidates[0];
 }
 for(const [code,names] of Object.entries(catalog)){
   if(!window.BTLQualification?.hasCountry(code))continue;
   if(code===ownCode && s.divisionLevel===1 && (s.league?.name===getCompetitionRule(code,countryByCode(code)?.name||code).league)){
     world[code]=(s.league.standings||[]).map(r=>({...r,origin:'BTL temporada jogada'}));
     state.globalStandingsByYear=state.globalStandingsByYear||{};
     (state.globalStandingsByYear[year]=state.globalStandingsByYear[year]||{})[window.BTLSeasonDivisions.key(code,s.league.name)]=world[code];
     continue;
   }
   const unique=[...new Set(names)].filter(Boolean);
   const league=getCompetitionRule(code,countryByCode(code)?.name||code).league;
   // Same deterministic league standings are used for qualifying AND relegation.
   const simulatedRows=simulateUnplayedLeagueLedger(year,code,league,unique)
      .map(r=>({...r,origin:'BTL simulação de partidas de outras ligas'}));
   const options=endOfSeasonQualificationOptions(s,code,simulatedRows,true);
   world[code]=applyQualifyingPositions(code,simulatedRows,options);
   state.globalStandingsByYear=state.globalStandingsByYear||{};
   (state.globalStandingsByYear[year]=state.globalStandingsByYear[year]||{})[window.BTLSeasonDivisions.key(code,league)]=world[code];
 }
 // Uma divisão secundária não concede vaga direta pela classificação.
 // Exceção: ganhar a Carabao Cup concede Conference League mesmo fora da elite.
 if(s.leagueCup?.won && ownCode==='ENG' && s.divisionLevel>1){
   const entrant={team:s.clubAtStart,origin:'BTL Carabao Cup',qualification:{competition:'UEFA Conference League',phase:'playoff',reason:'Campeão Carabao Cup',year:year+1,model:'PL-2026'},qualificationColor:'#55bd8e'};
   world.ENG=world.ENG||[];if(!world.ENG.some(row=>row.team===entrant.team))world.ENG.push(entrant);
 }
 if(!world[ownCode] && s.divisionLevel===1)world[ownCode]=s.league.standings||[];
}
// Acesso/rebaixamento vale para todas as divisões modeladas, inclusive
// ligas onde o jogador não atua. Sempre consome a tabela final do jogador
// para evitar duas classificações diferentes da mesma temporada.
function ensureDivisionPools(year=START_YEAR){
 if(!window.BTLSeasonDivisions)return {};
 state.leaguePoolsByYear=state.leaguePoolsByYear||{};
 if(!state.leaguePoolsByYear[START_YEAR])state.leaguePoolsByYear[START_YEAR]=
   window.BTLSeasonDivisions.initial(LEAGUE_CLUB_POOLS,MARKET_LEAGUE_POOLS);
 return state.leaguePoolsByYear[year]||state.leaguePoolsByYear[START_YEAR];
}
function commitDivisionTransitions(s=state.season){
 if(!s?.league?.finished||!window.BTLSeasonDivisions)return;
 const year=s.year;if(state.leaguePoolsByYear?.[year+1])return;
 const pools=ensureDivisionPools(year),key=window.BTLSeasonDivisions.key(s.countryAtStart,s.league.name);
 const played={...(state.globalStandingsByYear?.[year]||{}),[key]:(s.league?.standings||[])};
 // All divisions with simulated results must use the SAME match-based table
 // for promotion/relegation and next year's competition field.
 for(const [poolKey,teams] of Object.entries(pools)){
   if(played[poolKey]?.length||!Array.isArray(teams)||teams.length<2)continue;
   const sep=poolKey.indexOf('|');if(sep<0)continue;
   const poolCode=poolKey.slice(0,sep),league=poolKey.slice(sep+1);
   played[poolKey]=simulateUnplayedLeagueLedger(year,poolCode,league,teams);
 }
 state.globalStandingsByYear=state.globalStandingsByYear||{};
 state.globalStandingsByYear[year]={...(state.globalStandingsByYear[year]||{}),...played};
 const result=window.BTLSeasonDivisions.simulateTransitions(pools,year,played,clubStrength);
 state.leaguePoolsByYear[year+1]=result.pools;
 state.divisionTransitionsByYear=state.divisionTransitionsByYear||{};
 state.divisionTransitionsByYear[year]=result.changes;
 s.divisionTransitions=result.changes;
 const own=String(s.countryAtStart||state.player?.clubCountry||'');
 for(const row of s.league?.standings||[]){
   const movedDown=result.changes.find(x=>x.country===own&&x.upper===s.league.name&&x.relegated.includes(row.team));
   const movedUp=result.changes.find(x=>x.country===own&&x.lower===s.league.name&&x.promoted.includes(row.team));
   if(movedDown){row.relegated=true;row.qualificationColor='#e87979';row.divisionNotice=`Rebaixado para ${movedDown.lower}`;}
   else if(movedUp){row.promoted=true;row.qualificationColor='#55bd8e';row.divisionNotice=`Promovido para ${movedUp.upper}`;}
   else if(row.relegationPlayoff||row.promotionPlayoff){
     row.qualificationColor='#d6b75a';row.divisionNotice='Permaneceu na divisão após o play-off';
   }
 }
}
function adaptClubDivisionForNextSeason(nextYear){
 const p=state.player,divisions=window.BTLSeasonDivisions;if(!p||!divisions)return;
 const pools=state.leaguePoolsByYear?.[nextYear];if(!pools)return;
 const nextLeague=divisions.findLeague(pools,p.clubCountry,p.club);
 if(!nextLeague)return;
 const oldLeague=p.clubLeague||state.season?.league?.name;
 if(oldLeague!==nextLeague){
   p.clubLeague=nextLeague;
   p.clubDivisionLevel=nextLeague===getCompetitionRule(p.clubCountry,p.clubCountryName).league?1:
     nextLeague==='EFL League One'?3:2;
   const promoted=(p.clubDivisionLevel===1)||(oldLeague==='EFL League One'&&nextLeague==='EFL Championship');
   state.news.unshift(`${p.club} ${promoted?'conquistou o acesso':'foi rebaixado'}: disputará ${nextLeague} em ${nextYear}.`);
 }
}
function commitSeasonQualifications(s=state.season){
 if(!s?.league?.finished||s.qualificationsCommitted)return;
 const code=s.countryAtStart||state.player.clubCountry;
 if(s.divisionLevel===1){
   s.league.standings=window.BTLSeasonDivisions?.decorate(
     applyQualifyingPositions(code,s.league.standings,endOfSeasonQualificationOptions(s,code,s.league.standings)),code,s.league.name)
     ||applyQualifyingPositions(code,s.league.standings,endOfSeasonQualificationOptions(s,code,s.league.standings));
   // Campeões continentais entram automaticamente na edição seguinte, mesmo
   // quando a liga nacional os colocaria em outra competição.
   const title=s.continental?.won?s.continental.name:'';
   const groupCompetition=/UEFA Champions League|UEFA Europa League/i.test(title)?'UEFA Champions League':
     /UEFA Conference League/i.test(title)?'UEFA Europa League':
     /CONMEBOL Libertadores|CONMEBOL Sul-Americana/i.test(title)?'CONMEBOL Libertadores':'';
   const winner=s.league.standings.find(r=>r.team===s.clubAtStart);
   if(groupCompetition&&winner){
     const old=winner.qualification;
     winner.qualification={competition:groupCompetition,phase:'league',reason:`Campeão ${title}`,year:s.year+1,model:'título continental'};
     winner.qualificationColor='#4b93ff';
     if(code==='BR'&&old&&old.competition==='CONMEBOL Libertadores'){
       const available=s.league.standings.find(r=>!r.qualification&&r.team!==winner.team);
       if(available){available.qualification={...old,reason:'Vaga repassada após título continental'};available.qualificationColor=old.phase==='league'?'#4b93ff':'#87b6ff';}
     }
   }
   s.league.finalQualifications=s.league.standings.filter(r=>r.qualification).map(r=>({team:r.team,...r.qualification}));
 }
 persistGlobalQualificationTables(s);
 commitDivisionTransitions(s);
 s.qualificationsCommitted=true;
}
window.BTLQualificationAudit=()=>({year:state.season?.year,qualificationHistory:state.qualificationsByYear||{},currentTable:state.season?.league?.standings||[],matchLedger:state.season?.league?.matchLedger||null,otherLeagueLedgerKeys:[...externalLeagueLedgerCache.keys()].filter(x=>x.startsWith(`${state.season?.year}|`))});

function continentalFromLeagueResult(code,position,divisionLevel=1){
  if(divisionLevel>1)return null;
  const list=getCompetitionRule(code,countryByCode(code)?.name||'').continental||[];if(!list.length||!position)return null;
  if(code==='BR'){ if(position<=6)return list[0]; if(position<=12)return list[1]; return null; }
  if(confederation(code)==='UEFA'){ if(position<=4)return list[0];if(position<=6)return list[1];if(position<=7)return list[2];return null; }
  if(position<=3)return list[0]; return null;
}

function leaguePoolForCountry(code,currentClub,leagueName='',yearHint=0){
  const format=getLeagueFormatForClub(code,leagueName);let names=[];
  const year=Number(yearHint)||(state?.season?.year||START_YEAR);
  const dynamic=state?.leaguePoolsByYear?.[year]?.[window.BTLSeasonDivisions?.key(code,leagueName)];
  if(dynamic?.length){
    const normalized=[...new Set(dynamic)];
    if(!normalized.includes(currentClub))normalized.unshift(currentClub);
    return normalized.slice(0,format.teams);
  }
  if(leagueName&&typeof MARKET_LEAGUE_POOLS!=='undefined'&&MARKET_LEAGUE_POOLS[leagueName]) names.push(...MARKET_LEAGUE_POOLS[leagueName]);
  const market=typeof TRANSFER_MARKET_CLUBS!=='undefined'?TRANSFER_MARKET_CLUBS:[];
  names.push(...market.filter(c=>c.countryCode===code&&(!leagueName||c.league===leagueName)).map(c=>c.name));
  if(!leagueName||leagueName===getCompetitionRule(code,countryByCode(code)?.name||'').league){
    // Não inserir equipes rebaixadas a partir de bases históricas.
    const official=LEAGUE_CLUB_POOLS[code]||[];
    if(official.length)names=[...official];
    else names.push(...(LOCAL_CLUBS[code]||[]).map(c=>c.name));
  }
  if(!names.includes(currentClub)) names.unshift(currentClub);
  names=[...new Set(names)];
  // Nunca criar clubes inventados para completar classificações.
  return names.filter(x=>x&&typeof x==='string'&&!/Clube \d{2}$/i.test(x)).slice(0,format.teams);
}
function generateLeagueSchedule(code,currentClub,leagueName,yearHint=0){
  const format=getLeagueFormatForClub(code,leagueName);const teams=leaguePoolForCountry(code,currentClub,leagueName,yearHint);const opponents=shuffle(teams.filter(t=>t!==currentClub));const events=[];
  if(!opponents.length)return events; // A carreira só pode começar com adversários reais conhecidos.
  if(format.mode==='double_round_robin'&&opponents.length*2>=format.matches){
    opponents.forEach((opp,i)=>{ const home=i%2===0;events.push({type:'league',competition:leagueName,round:i+1,home:home?currentClub:opp,away:home?opp:currentClub,opponent:opp}); });
    opponents.forEach((opp,i)=>{ const home=i%2!==0;events.push({type:'league',competition:leagueName,round:opponents.length+i+1,home:home?currentClub:opp,away:home?opp:currentClub,opponent:opp}); });
    return events;
  }
  // Se a base tiver menos equipes que o formato padrão, repetir jogos contra
  // adversários existentes e identificados; nunca criar nomes fictícios.
  for(let i=0;i<format.matches;i++){
    const opp=opponents[i%opponents.length];const home=i%2===0;events.push({type:'league',competition:leagueName,round:i+1,home:home?currentClub:opp,away:home?opp:currentClub,opponent:opp});
  }
  return events;
}
function domesticCupStages(code){ return (DOMESTIC_CUP_FORMATS[code]||{stages:[{name:'Fase inicial',legs:1},{name:'Oitavas de final',legs:1},{name:'Quartas de final',legs:1},{name:'Semifinal',legs:1},{name:'Final',legs:1}]}).stages; }
function createKnockoutState(name,stages,nextLeagueRound=3){
  return {name,active:true,eliminated:false,won:false,stages,stageIndex:0,leg:1,opponent:null,firstLegHome:true,aggregateFor:0,aggregateAgainst:0,nextLeagueRound};
}
function generateContinentalPhaseSchedule(p,name,format,year=START_YEAR){
  if(!format.phaseMatches)return [];
  const conf=confederation(p.clubCountry),previous=qualificationRowsForYear(year,name);
  let pool=previous?previous.filter(club=>club!==p.club):allTransferClubs().filter(c=>c.countryCode!==p.clubCountry&&confederation(c.countryCode)===conf).map(c=>c.name);
  pool=[...new Set(pool)].filter(Boolean);
  // Sem adversários fictícios: repetir equipes reais se o catálogo for curto.
  if(pool.length>0){const real=pool.slice();for(let i=0;pool.length<format.phaseMatches;i++)pool.push(real[i%real.length]);}
  const selected=sample(pool,Math.min(format.phaseMatches,pool.length));const events=[];
  if(format.phaseMatches===6 && name.includes('CONMEBOL')){
    const three=selected.slice(0,3);three.forEach((opp,i)=>events.push({type:'continental',competition:name,stage:format.phase,round:i+1,home:i%2===0?p.club:opp,away:i%2===0?opp:p.club,opponent:opp}));
    three.forEach((opp,i)=>events.push({type:'continental',competition:name,stage:format.phase,round:i+4,home:i%2!==0?p.club:opp,away:i%2!==0?opp:p.club,opponent:opp}));return events;
  }
  selected.slice(0,format.phaseMatches).forEach((opp,i)=>{const home=i%2===0;events.push({type:'continental',competition:name,stage:format.phase,round:i+1,home:home?p.club:opp,away:home?opp:p.club,opponent:opp});});return events;
}
function phaseEligibleTeams(p,name,year,phaseSchedule){
 const yearField=qualificationRowsForYear(year,name)||[];
 const opponents=[...new Set((phaseSchedule||[]).map(m=>m.opponent).filter(Boolean))];
 // CONMEBOL Libertadores / Sul-Americana: the player's four-team group.
 if(/CONMEBOL Libertadores|CONMEBOL Sul-Americana/i.test(name))return [...new Set([p.club,...opponents])];
 const field=[...new Set([p.club,...opponents,...yearField])];
 // UEFA league phase has exactly 36 entrants; additional domestic qualifiers
 // must contest preliminaries instead of silently creating an 80-team table.
 const size=/UEFA Champions League|UEFA Europa League|UEFA Conference League/i.test(name)?36:
   /AFC Champions League/i.test(name)?32:field.length;
 return field.slice(0,size);
}
function ensureInternationalPhaseLedger(c=state.season?.continental,s=state.season){
 if(!c?.phaseSchedule?.length||!window.BTLMatchLedger)return null;
 if(c.phaseLedger?.version===1)return c.phaseLedger;
 const club=s?.clubAtStart||state.player?.club;
 const teams=[...new Set([club,...(c.phaseTeams||[]),...(c.phaseSchedule||[]).flatMap(x=>[x.home,x.away])])].filter(Boolean);
 const ledger=window.BTLMatchLedger.create(teams,c.phaseSchedule,club,`${s?.year}|continental|${c.name}`);
 if(c.phaseIndex>0){
  ledger.legacy={team:club,games:c.phaseIndex,wins:c.wins||0,draws:c.draws||0,losses:c.losses||0,points:c.points||0};
  for(let i=1;i<=c.phaseIndex;i++)window.BTLMatchLedger.advance(ledger,i,null,n=>clubStrength(n,canonicalClubCountryCode(n,'')));
 }
 c.phaseLedger=ledger;return ledger;
}
function internationalProgression(c,ranking){
 const count=ranking.length,club=state.season?.clubAtStart||state.player.club;
 const rank=ranking.findIndex(row=>row.team===club)+1;
 if(!rank)return {rank:0,qualified:false,direct:false};
 if(/CONMEBOL Libertadores|CONMEBOL Sul-Americana/i.test(c.name))return {rank,qualified:rank<=2,direct:rank<=2};
 if(/UEFA Champions League|UEFA Europa League|UEFA Conference League/i.test(c.name)){
   const direct=Math.max(1,Math.round(count*8/36)),qualify=Math.max(direct,Math.round(count*24/36));
   return {rank,qualified:rank<=qualify,direct:rank<=direct,model:count===36?'formato UEFA 36 clubes':'quadro reduzido da simulação'};
 }
 if(/AFC Champions League/i.test(c.name))return {rank,qualified:rank<=Math.max(2,Math.floor(count*2/3)),direct:rank<=Math.max(2,Math.floor(count*2/3))};
 return {rank,qualified:rank<=Math.max(2,Math.ceil(count/2)),direct:rank<=Math.max(2,Math.ceil(count/2))};
}
function createContinentalState(p,name,year=START_YEAR,entryPhase='league'){
  if(!name)return null;const format=CONTINENTAL_FORMATS[name]||{phaseMatches:6,phase:'Fase de grupos',qualifyPoints:9,directPoints:9,knockout:[{name:'Quartas de final',legs:2},{name:'Semifinal',legs:2},{name:'Final',legs:1}]};
  const phaseSchedule=generateContinentalPhaseSchedule(p,name,format,year);
  const qualifiers=entryPhase==='qualifier'||entryPhase==='playoff';
  const preliminary=qualifiers?createKnockoutState(name,[...(confederation(p.clubCountry)==='CONMEBOL'?[{name:'2ª fase preliminar',legs:2},{name:'3ª fase preliminar',legs:2}]:[{name:'Fase preliminar',legs:2},{name:'Play-off',legs:2}])],1):null;
  if(preliminary){preliminary.noTrophy=true;preliminary.isQualifier=true;preliminary.year=year;}
  const phaseTeams=phaseEligibleTeams(p,name,year,phaseSchedule);
  return {name,active:true,eliminated:false,won:false,format,entryPhase,preliminary,phase:qualifiers?'qualifying':format.phaseMatches?'phase':'knockout',phaseSchedule,phaseTeams,phaseLedger:null,phaseStandings:[],phaseIndex:0,points:0,wins:0,draws:0,losses:0,knockout:createKnockoutState(name,format.knockout,2),nextLeagueRound:2};
}
const DOMESTIC_SUPERCUPS={
  BR:{name:'Supercopa do Brasil',stages:['Final']},ES:{name:'Supercopa da Espanha',stages:['Semifinal','Final']},IT:{name:'Supercoppa Italiana',stages:['Semifinal','Final']},ENG:{name:'FA Community Shield',stages:['Final']},DE:{name:'DFL-Supercup',stages:['Final']},FR:{name:'Trophée des Champions',stages:['Final']},PT:{name:'Supertaça Cândido de Oliveira',stages:['Final']},NL:{name:'Johan Cruyff Shield',stages:['Final']}
};
function createSuperCupCompetitions(p,year){
  if(!p||Number(year)<=START_YEAR)return [];const prev=Number(year)-1,previousTrophies=(p.trophies||[]).filter(t=>Number(t.year)===prev),prevHistory=(state.history||[]).find(h=>Number(h.year)===prev),sameClub=t=>!t.club||t.club===p.club;
  const out=[],domestic=DOMESTIC_SUPERCUPS[p.clubCountry],rule=getCompetitionRule(p.clubCountry,p.clubCountryName);
  if(domestic&&previousTrophies.some(t=>sameClub(t)&&(t.name===rule.league||t.name===rule.cup)))out.push({name:domestic.name,scope:'club',countryCode:p.clubCountry,active:true,won:false,eliminated:false,stageIndex:0,stages:domestic.stages.map(name=>({name})),opponent:null});
  if(previousTrophies.some(t=>sameClub(t)&&/UEFA Champions League|UEFA Europa League/i.test(t.name)))out.push({name:'UEFA Super Cup',scope:'club',countryCode:p.clubCountry,active:true,won:false,eliminated:false,stageIndex:0,stages:[{name:'Final'}],opponent:null,international:true});
  if(p.calledUp&&previousTrophies.some(t=>/UEFA EURO|CONMEBOL Copa América/i.test(t.name)))out.push({name:'Finalissima',scope:'national',countryCode:p.nationalityCode,active:true,won:false,eliminated:false,stageIndex:0,stages:[{name:'Final'}],opponent:null,international:true});
  return out;
}
function superCupOpponent(sc){
  const p=state.player;if(sc.scope==='national'){
    const playerConf=confederation(p.nationalityCode),pool=playerConf==='UEFA'?['AR','BR','UY','CO']:['FR','ES','ENG','PT','DE','IT','NL'];const code=pool.filter(x=>x!==p.nationalityCode).sort((a,b)=>nationalTeamStrength(b)-nationalTeamStrength(a))[rnd(0,Math.min(3,pool.length-1))];return {name:countryByCode(code)?.name||code,code};
  }
  if(sc.name==='UEFA Super Cup'){
    const pool=allTransferClubs().filter(c=>c.name!==p.club&&confederation(c.countryCode)==='UEFA'&&(c.strength||0)>=84);const rival=pool[rnd(0,Math.max(0,pool.length-1))];return {name:rival?.name||p.club,code:rival?.countryCode||'ES'};
  }
  const pool=leaguePoolForCountry(p.clubCountry,p.club,p.clubLeague).filter(x=>x!==p.club);return {name:pool[rnd(0,Math.max(0,pool.length-1))]||p.club,code:p.clubCountry};
}
function getSuperCupEvent(sc,index){
  const p=state.player,stage=sc.stages[sc.stageIndex];if(!sc.active||!stage)return null;if(!sc.opponent)sc.opponent=superCupOpponent(sc);const home=Math.random()<.5;
  if(sc.scope==='national'){const playerName=p.nationality,rival=sc.opponent.name;return {type:'national',competition:sc.name,stage:stage.name,home:home?playerName:rival,away:home?rival:playerName,opponent:rival,opponentCode:sc.opponent.code,superCupName:sc.name,superCupIndex:index,specialCompetition:'supercup'};}
  return {type:'supercup',competition:sc.name,stage:stage.name,home:home?p.club:sc.opponent.name,away:home?sc.opponent.name:p.club,opponent:sc.opponent.name,superCupName:sc.name,superCupIndex:index,specialCompetition:'supercup'};
}
function processSuperCupResult(event,pf,pa){
  const sc=state.season?.superCups?.[event.superCupIndex];if(!sc||!sc.active)return null;let win=pf>pa,decidedOnPenalties=false;if(pf===pa){decidedOnPenalties=true;const p=state.player,ours=sc.scope==='national'?nationalTeamStrength(p.nationalityCode,p.nationality):playerClubStrength(),theirs=sc.scope==='national'?nationalTeamStrength(event.opponentCode,event.opponent):clubStrength(event.opponent,sc.countryCode);win=Math.random()<clamp(.5+(ours-theirs)*.018,.30,.70);}
  if(win){const final=sc.stageIndex>=sc.stages.length-1;if(final){sc.active=false;sc.won=true;if(sc.scope==='national')addNationalTrophy(sc.name);else addTrophy(sc.name);state.news.push(`${state.player.name} conquista ${sc.name}${decidedOnPenalties?' nos pênaltis':''}!`);}else{sc.stageIndex++;sc.opponent=null;state.news.push(`${state.player.club} avança à final de ${sc.name}${decidedOnPenalties?' nos pênaltis':''}.`);}}
  else{sc.active=false;sc.eliminated=true;state.news.push(`${sc.scope==='national'?state.player.nationality:state.player.club} fica pelo caminho em ${sc.name}${decidedOnPenalties?' nos pênaltis':''}.`);}
  return {superCup:true,advanced:win,nextStage:win&&sc.active?sc.stages[sc.stageIndex]?.name:null,decidedOnPenalties};
}

// Carabao Cup (EFL Cup): 2026/27 — entradas escalonadas; semifinal em ida e volta.
// A etapa preliminar e os jogos entre equipes não controladas são abstraídos no sorteio
// para não simular partidas falsas no calendário visível do jogador.
function createCarabaoCup(p,continentalName){
  if(p.clubCountry!=='ENG'||!(/Premier League|EFL Championship|EFL League One/i.test(p.clubLeague||'')))return null;
  const european=Boolean(continentalName);
  const entry=(p.clubLeague==='Premier League'?(european?3:2):1);
  const rounds=[
    {name:'1ª rodada',legs:1},{name:'2ª rodada',legs:1},{name:'3ª rodada',legs:1},
    {name:'4ª rodada',legs:1},{name:'Quartas de final',legs:1},
    {name:'Semifinal',legs:2},{name:'Final',legs:1}
  ];
  const cup=createKnockoutState('Carabao Cup',rounds,2);
  cup.stageIndex=entry-1;cup.entryRound=entry;cup.nextLeagueRound=2;
  return cup;
}
function carabaoRival(){
  const p=state.player;const pool=[
    ...(LEAGUE_CLUB_POOLS.ENG||[]),
    ...(typeof MARKET_LEAGUE_POOLS!=='undefined'?(MARKET_LEAGUE_POOLS['EFL Championship']||[]):[]),
    ...(typeof MARKET_LEAGUE_POOLS!=='undefined'?(MARKET_LEAGUE_POOLS['EFL League One']||[]):[])
  ];
  const rivals=[...new Set(pool)].filter(x=>x&&x!==p.club);
  return rivals.length?rivals[rnd(0,rivals.length-1)]:null;
}

function createSeason(p,year,continentalOverride){
  ensureClubRoleState(p);
  const baseRule=getCompetitionRule(p.clubCountry,p.clubCountryName);const clubProfile=clubCompetitionProfile(p.club,p.clubCountry);
  const leagueName=p.clubLeague||clubProfile.league||baseRule.league;const cupName=p.clubCup||clubProfile.cup||baseRule.cup;const divisionLevel=p.clubDivisionLevel||clubProfile.divisionLevel||1;
  const leagueFormat=getLeagueFormatForClub(p.clubCountry,leagueName);
  const cupWinnerFromLowerLeague=divisionLevel>1&&p.clubCountry==='ENG'&&continentalOverride==='UEFA Conference League';
  // Histórico oficial datado de 2026: não reutilizar em 2027 ou além.
  const firstYear=Number(year)===2026;
  const official=firstYear?window.BTLInitialInternational?.forClub(p.club):null;
  const coveredCountry=firstYear&&window.BTLInitialInternational?.data&&
    ['BR','AR','UY','CL','CO','ENG','SCO','ES','IT','FR','DE','PT','NL','BE','TR','AT','CH','CZ','NO','SE','DK','GR','PL','HR','RS','RO','UA','JP','US','MX'].includes(p.clubCountry);
  const initialEntry=official||(!coveredCountry?qualificationForClub(p.clubCountry,p.clubStrength):null);
  const continentalName=divisionLevel>1&&!cupWinnerFromLowerLeague?null:
    (continentalOverride===undefined?(firstYear?initialEntry:qualificationForClub(p.clubCountry,p.clubStrength)):continentalOverride);
  const qualifiedStage=year>START_YEAR?qualifiedForYear(p.clubCountry,p.club,year-1)?.phase||(cupWinnerFromLowerLeague?'playoff':'league'):'league';
  return {
    year,clubAtStart:p.club,countryAtStart:p.clubCountry,leagueAtStart:leagueName,divisionLevel,competitionStats:{},totalGames:0,clubGames:0,clubGoals:0,clubAssists:0,leagueGames:0,leagueGoals:0,leagueAssists:0,goals:0,assists:0,saves:0,tackles:0,cleanSheets:0,ratingSum:0,lastNationalAt:-10,lastCareerEventAt:-8,lastNationalEventAt:-10,lastSponsorEventAt:-20,nationalGamesPlayed:0,nationalDecisionCount:0,nationalInteractionCount:0,sponsorEventDone:false,closed:false,endProcessed:false,featuredMatch:null,
    league:{name:leagueName,format:leagueFormat,schedule:generateLeagueSchedule(p.clubCountry,p.club,leagueName,year),index:0,points:0,wins:0,draws:0,losses:0,gf:0,ga:0,finished:false,position:null,titleAwarded:false},
    cup:createKnockoutState(cupName,domesticCupStages(p.clubCountry),3),
    leagueCup:createCarabaoCup(p,continentalName),
    continental:createContinentalState(p,continentalName,year,qualifiedStage),
    superCups:createSuperCupCompetitions(p,year),
    worldCup:isWorldCupYear(year)?createWorldCupState(p,year,leagueFormat.matches||34):null,
    nationalCalendar:createNationalCalendarState(p,year)
  };
}

function knockoutOpponent(domestic=true){
  const p=state.player;
  if(domestic){ const leagueName=state.season?.league?.name||p.clubLeague||clubCompetitionProfile(p.club,p.clubCountry).league;const pool=leaguePoolForCountry(p.clubCountry,p.club,leagueName).filter(n=>n!==p.club);return pool[rnd(0,pool.length-1)]; }
  const conf=confederation(p.clubCountry);const pool=allTransferClubs().filter(c=>c.countryCode!==p.clubCountry&&confederation(c.countryCode)===conf);return pool.length?pool[rnd(0,pool.length-1)].name:(allTransferClubs().find(c=>c.name!==p.club)?.name||'');
}
function getKnockoutEvent(comp,type){
  const p=state.player;const stage=comp.stages[comp.stageIndex];if(!stage)return null;
  if(!comp.opponent){
    const continental=type==='continental';
    const field=continental?qualificationRowsForYear(state.season?.year,comp.name):null;
    const eligible=(field||[]).filter(name=>name!==p.club);
    // For a complete UEFA league-phase field, only top 24 are eligible for
    // knockouts. Group-format tournaments need separate groups, so do not
    // pretend the player's four-team group represents the entire bracket.
    const phase=state.season?.continental;
    if(continental&&phase?.phaseStandings?.length>=30&&/UEFA Champions League|UEFA Europa League|UEFA Conference League/i.test(comp.name)){
      const qualified=phase.phaseStandings.slice(0,Math.max(1,Math.round(phase.phaseStandings.length*24/36)))
        .map(r=>r.team).filter(name=>name!==p.club);
      eligible.splice(0,eligible.length,...qualified);
    }
    if(continental&&!eligible.length){
      (state.season?.continental?.phaseSchedule||[]).forEach(m=>{
        if(m.opponent&&m.opponent!==p.club&&!eligible.includes(m.opponent))eligible.push(m.opponent);
      });
    }
    comp.opponent=type==='league-cup'?carabaoRival():
      (eligible.length?eligible[rnd(0,eligible.length-1)]:knockoutOpponent(type==='cup'));comp.firstLegHome=Math.random()<.5;comp.aggregateFor=0;comp.aggregateAgainst=0;comp.leg=1;}
  const home=stage.legs===1 ? Math.random()<.5 : (comp.leg===1?comp.firstLegHome:!comp.firstLegHome);
  return {type,competition:comp.name,stage:stage.name,leg:comp.leg,qualifier:!!comp.isQualifier,home:home?p.club:comp.opponent,away:home?comp.opponent:p.club,opponent:comp.opponent};
}
function getContinentalEvent(){
  const c=state.season.continental;if(!c||!c.active)return null;
  if(c.phase==='qualifying'&&c.preliminary?.active)return getKnockoutEvent(c.preliminary,'continental');
  if(c.phase==='phase') return c.phaseSchedule[c.phaseIndex]||null;
  return getKnockoutEvent(c.knockout,'continental');
}
function worldCupCycleOffset(year){
  return ((Number(year)-2026)%4+4)%4; // 0=Copa, 1=pós-Copa, 2=meio do ciclo, 3=pré-Copa
}
const NATIONAL_CALENDAR_VERSION=3;
const NATIONAL_TOURNAMENT_STAGES={
  'CONMEBOL Copa América':{groupMatches:4,knockout:['Semifinal','Final']},
  'UEFA EURO':{groupMatches:3,knockout:['Oitavas de final','Quartas de final','Semifinal','Final']},
  'UEFA Nations League':{groupMatches:6,knockout:['Quartas de final · ida','Quartas de final · volta','Semifinal','Disputa de 3º lugar','Final']},
  'Concacaf Gold Cup':{groupMatches:3,knockout:['Quartas de final','Semifinal','Final']},
  'AFC Asian Cup':{groupMatches:3,knockout:['Oitavas de final','Quartas de final','Semifinal','Final']},
  'CAF Africa Cup of Nations':{groupMatches:3,knockout:['Oitavas de final','Quartas de final','Semifinal','Final']},
  'OFC Nations Cup':{groupMatches:3,knockout:['Semifinal','Final']}
};
function tournamentSlots(name){
  const cfg=NATIONAL_TOURNAMENT_STAGES[name];if(!cfg)return [];
  return [
    ...Array.from({length:cfg.groupMatches},(_,i)=>({competition:name,stage:`Fase de grupos · Jogo ${i+1}/${cfg.groupMatches}`,kind:'tournament',group:true})),
    ...cfg.knockout.map(stage=>({competition:name,stage,kind:'tournament',knockout:true,final:stage==='Final'}))
  ];
}
function qualifierSlots(name,count,start=1){
  return Array.from({length:count},(_,i)=>({competition:name,stage:`Eliminatórias · rodada ${start+i}`,kind:'qualifier'}));
}
function friendlySlots(count=2){
  return Array.from({length:count},(_,i)=>({competition:'Amistoso Internacional',stage:`Data FIFA · amistoso ${i+1}`,kind:'friendly'}));
}
function nationsLeagueModernFormat(year=state.season?.year||2026){return Number(year)>=2028;}
function nationsLeagueTierFor(code,p=state.player,year=state.season?.year||2026){
  const modern=nationsLeagueModernFormat(year);
  if(p?.nationalityCode===code&&['A','B','C','D'].includes(p.nationsLeagueTier))return modern&&p.nationsLeagueTier==='D'?'C':p.nationsLeagueTier;
  if(modern){
    // A partir de 2028/29 a UEFA passa a três ligas de 18 seleções. Para temporadas
    // futuras do modo carreira, a lista é aproximada pelo nível atual da seleção.
    const ranked=COUNTRIES.filter(c=>isFootballNation(c)&&confederation(c.code)==='UEFA')
      .sort((a,b)=>nationalTeamStrength(b.code,b.name)-nationalTeamStrength(a.code,a.name));
    const idx=ranked.findIndex(c=>c.code===code);return idx>=0&&idx<18?'A':idx>=0&&idx<36?'B':'C';
  }
  const strength=nationalTeamStrength(code,countryByCode(code)?.name||'');
  return strength>=83?'A':strength>=76?'B':strength>=69?'C':'D';
}
function nationsLeagueSlots(code,year=state.season?.year||2026){
  const modern=nationsLeagueModernFormat(year),tier=nationsLeagueTierFor(code,state.player,year),groupMatches=modern?6:(tier==='D'?4:6);
  const group=Array.from({length:groupMatches},(_,i)=>({competition:'UEFA Nations League',stage:`Liga ${tier} · fase de liga · Rodada ${i+1}/${groupMatches}`,kind:'tournament',group:true,nationsLeague:true,leagueTier:tier,leagueOnly:tier!=='A',nationsLeagueRound:i}));
  if(tier!=='A')return group;
  return [...group,
    {competition:'UEFA Nations League',stage:'Quartas de final · ida',stageBase:'Quartas de final',kind:'tournament',knockout:true,nationsLeague:true,leagueTier:tier,nationsLeagueTwoLeg:true,nationsLeagueLeg:1},
    {competition:'UEFA Nations League',stage:'Quartas de final · volta',stageBase:'Quartas de final',kind:'tournament',knockout:true,nationsLeague:true,leagueTier:tier,nationsLeagueTwoLeg:true,nationsLeagueLeg:2},
    {competition:'UEFA Nations League',stage:'Semifinal',kind:'tournament',knockout:true,nationsLeague:true,leagueTier:tier},
    {competition:'UEFA Nations League',stage:'Disputa de 3º lugar',kind:'tournament',knockout:true,nationsLeague:true,leagueTier:tier,nationsLeagueThirdPlace:true},
    {competition:'UEFA Nations League',stage:'Final',kind:'tournament',knockout:true,final:true,nationsLeague:true,leagueTier:tier}
  ];
}
function nationalCalendarSlotsFor(code,year){
  const conf=confederation(code),offset=worldCupCycleOffset(year),y=Number(year);
  if(offset===0&&conf!=='UEFA')return []; // Fora da UEFA, a Copa domina o ano. Na UEFA, a Nations League começa depois do Mundial.

  // O calendário abaixo usa as janelas/competições oficialmente confirmadas quando
  // disponíveis e mantém o ciclo de quatro anos de forma jogável nas temporadas futuras.
  if(conf==='CONMEBOL'){
    // Ciclo solicitado para a América do Sul: 2027 início das Eliminatórias,
    // 2028 Copa América, 2029 reta final das Eliminatórias, 2030 Copa.
    if(offset===1)return qualifierSlots('Eliminatórias CONMEBOL da Copa do Mundo',4,1);
    if(offset===2)return [...tournamentSlots('CONMEBOL Copa América'),...friendlySlots(1)];
    return qualifierSlots('Eliminatórias CONMEBOL da Copa do Mundo',5,5);
  }
  if(conf==='UEFA'){
    // A Nations League é bienal. No modo carreira a edição é resolvida na temporada
    // que começa no ano par: após a Copa do Mundo ou após a EURO.
    if(offset===0)return nationsLeagueSlots(code,y);
    if(offset===1)return qualifierSlots('Eliminatórias da UEFA EURO',5,1);
    if(offset===2)return [...tournamentSlots('UEFA EURO'),...nationsLeagueSlots(code,y)];
    return qualifierSlots('Eliminatórias UEFA da Copa do Mundo',5,1);
  }
  if(conf==='CONCACAF'){
    // Calendário 2026-30 confirmado pela Concacaf:
    // Gold Cup 2027/2029 e Eliminatórias de 2030 de set/2027 a nov/2029.
    if(offset===1)return [...tournamentSlots('Concacaf Gold Cup'),...qualifierSlots('Eliminatórias Concacaf da Copa do Mundo',3,1)];
    if(offset===2)return qualifierSlots('Eliminatórias Concacaf da Copa do Mundo',4,4);
    return [...tournamentSlots('Concacaf Gold Cup'),...qualifierSlots('Eliminatórias Concacaf da Copa do Mundo',3,8)];
  }
  if(conf==='AFC'){
    // Asian Cup 2027 está confirmada. A AFC estuda mudança de calendário para as
    // edições posteriores; no jogo, 2028/29 ficam dedicados às Eliminatórias.
    if(offset===1)return [...tournamentSlots('AFC Asian Cup'),...friendlySlots(1)];
    if(offset===2)return qualifierSlots('Eliminatórias AFC da Copa do Mundo',4,1);
    return qualifierSlots('Eliminatórias AFC da Copa do Mundo',5,5);
  }
  if(conf==='CAF'){
    // AFCON 2027 está confirmada e a CAF abriu o ciclo de AFCON 2028/2032/2036.
    if(y===2027)return tournamentSlots('CAF Africa Cup of Nations');
    if(y>=2028&&y%4===0)return [...tournamentSlots('CAF Africa Cup of Nations'),...qualifierSlots('Eliminatórias CAF da Copa do Mundo',2,1)];
    if(offset===3)return qualifierSlots('Eliminatórias CAF da Copa do Mundo',5,3);
    return qualifierSlots('Eliminatórias CAF da Copa do Mundo',3,1);
  }
  if(conf==='OFC'){
    // OFC confirmou em 2027 a qualificação da Nations Cup 2028.
    if(offset===1)return qualifierSlots('Eliminatórias da OFC Nations Cup',3,1);
    if(offset===2)return tournamentSlots('OFC Nations Cup');
    return qualifierSlots('Eliminatórias OFC da Copa do Mundo',4,1);
  }
  return friendlySlots(3);
}
function createNationalCalendarState(p,year){
  return {version:NATIONAL_CALENDAR_VERSION,year,index:0,slots:nationalCalendarSlotsFor(p?.nationalityCode,year),usedOpponents:[],tournament:null};
}
function ensureNationalCalendarState(s=state.season,p=state.player){
  if(!s||!p)return null;
  if(!s.nationalCalendar||s.nationalCalendar.year!==s.year||s.nationalCalendar.version!==NATIONAL_CALENDAR_VERSION){
    const previous=s.nationalCalendar;
    s.nationalCalendar=createNationalCalendarState(p,s.year);
    // Migração conservadora: preserva apenas o progresso já concluído da agenda antiga.
    if(previous?.year===s.year){
      s.nationalCalendar.index=Math.min(Math.max(0,previous.index||0),s.nationalCalendar.slots.length);
      s.nationalCalendar.usedOpponents=Array.isArray(previous.usedOpponents)?[...previous.usedOpponents]:[];
    }
  }
  s.nationalCalendar.slots=Array.isArray(s.nationalCalendar.slots)?s.nationalCalendar.slots:nationalCalendarSlotsFor(p.nationalityCode,s.year);
  s.nationalCalendar.usedOpponents=Array.isArray(s.nationalCalendar.usedOpponents)?s.nationalCalendar.usedOpponents:[];
  return s.nationalCalendar;
}
function currentNationalCalendarSlot(s=state.season,p=state.player){
  const cal=ensureNationalCalendarState(s,p);if(!cal)return null;
  while(cal.index<cal.slots.length){
    const slot=cal.slots[cal.index];
    if(slot.kind==='tournament'&&cal.tournament?.competition===slot.competition&&cal.tournament.finished){
      cal.index++;continue;
    }
    return slot;
  }
  return null;
}
function sameConfederationNationalPool(playerCode){
  const conf=confederation(playerCode);
  return COUNTRIES.filter(c=>isFootballNation(c)&&c.code!==playerCode&&confederation(c.code)===conf);
}
function pickNationalCalendarOpponent(p,slot,cal){
  const globalFriendly=slot.kind==='friendly';
  let pool=globalFriendly?COUNTRIES.filter(c=>isFootballNation(c)&&c.code!==p.nationalityCode):sameConfederationNationalPool(p.nationalityCode);
  if(slot.nationsLeague){const tier=slot.leagueTier||nationsLeagueTierFor(p.nationalityCode,p,state.season?.year);const tierPool=pool.filter(c=>nationsLeagueTierFor(c.code,null,state.season?.year)===tier);if(tierPool.length>=3)pool=tierPool;}
  const used=new Set(cal.usedOpponents||[]);
  let fresh=pool.filter(c=>!used.has(c.code));if(!fresh.length)fresh=pool;
  if(!fresh.length)return {code:'',name:'Adversário'};
  const our=nationalTeamStrength(p.nationalityCode,p.nationality);
  const stage=slot.stage||'';
  const target=slot.knockout?Math.max(78,our-2):slot.kind==='qualifier'?Math.max(70,our-6):our;
  const scored=fresh.map(c=>({team:c,score:Math.abs(nationalTeamStrength(c.code,c.name)-target)+Math.random()*6}))
    .sort((a,b)=>a.score-b.score);
  const shortlist=scored.slice(0,Math.min(8,scored.length)).map(x=>x.team);
  const rival=shortlist[rnd(0,shortlist.length-1)]||fresh[0];
  cal.usedOpponents.push(rival.code);
  return rival;
}
function buildNationsLeagueGroupOpponents(p,tier,count,cal){
  let pool=sameConfederationNationalPool(p.nationalityCode).filter(c=>nationsLeagueTierFor(c.code,null)===tier);
  if(pool.length<count)pool=sameConfederationNationalPool(p.nationalityCode);
  const our=nationalTeamStrength(p.nationalityCode,p.nationality),used=new Set(cal.usedOpponents||[]);
  const scored=pool.map(c=>({team:c,score:Math.abs(nationalTeamStrength(c.code,c.name)-our)+Math.random()*7+(used.has(c.code)?20:0)})).sort((a,b)=>a.score-b.score);
  const picked=[];for(const row of scored){if(!picked.some(x=>x.code===row.team.code)){picked.push(row.team);if(picked.length>=count)break;}}
  picked.forEach(x=>{if(!cal.usedOpponents.includes(x.code))cal.usedOpponents.push(x.code);});
  return picked.map(x=>({code:x.code,name:x.name}));
}
function nationalTournamentReady(s,slot){
  if(!slot||slot.kind!=='tournament')return true;
  const cal=ensureNationalCalendarState(s,state.player),started=cal?.tournament?.competition===slot.competition&&cal.tournament.started;
  if(started)return true;
  const leagueGames=s.league?.schedule?.length||34;
  return (s.league?.index||0)>=Math.max(5,Math.round(leagueGames*.40))||s.league?.finished;
}
function nextNationalCalendarEvent(){
  const p=state.player,s=state.season;if(!p?.calledUp||!s)return null;
  if(isWorldCupYear(s.year)){const wc=ensureWorldCupState(s,p);if(wc?.active&&!wc.finished)return null;}
  const cal=ensureNationalCalendarState(s,p),slot=currentNationalCalendarSlot(s,p);if(!cal||!slot)return null;
  if(!nationalTournamentReady(s,slot))return null;
  const tournamentActive=slot.kind==='tournament'&&cal.tournament?.competition===slot.competition&&cal.tournament.started;
  const gap=slot.kind==='tournament'?(tournamentActive?2:5):(slot.kind==='qualifier'?7:10);
  if(!s.league?.finished&&(s.totalGames<=0||s.totalGames-s.lastNationalAt<gap))return null;

  if(slot.kind==='tournament'){
    if(!cal.tournament||cal.tournament.competition!==slot.competition){
      const cfg=NATIONAL_TOURNAMENT_STAGES[slot.competition]||{groupMatches:3,knockout:['Semifinal','Final']};
      const groupMatches=slot.nationsLeague?(nationsLeagueModernFormat(s.year)?6:(slot.leagueTier==='D'?4:6)):cfg.groupMatches;
      cal.tournament={competition:slot.competition,started:true,finished:false,eliminated:false,points:0,gf:0,ga:0,groupPlayed:0,groupMatches,knockout:[...cfg.knockout],nationsLeague:!!slot.nationsLeague,leagueTier:slot.leagueTier||null,leagueOnly:!!slot.leagueOnly,nationsLeagueFormat:nationsLeagueModernFormat(s.year)?'three-league':'four-league',nationsLeagueOpponents:[],nationsLeagueHomePattern:[],currentKnockoutOpponent:null,qfAggregate:null,qfHomeFirst:null};
    }else cal.tournament.started=true;
  }

  const t=cal.tournament;let rival,home=Math.random()<.5;
  if(slot.nationsLeague&&slot.group){
    const opponentCount=nationsLeagueModernFormat(s.year)?5:(slot.leagueTier==='D'?2:3);
    if(!Array.isArray(t.nationsLeagueOpponents)||t.nationsLeagueOpponents.length<opponentCount){
      t.nationsLeagueOpponents=buildNationsLeagueGroupOpponents(p,slot.leagueTier||'A',opponentCount,cal);
      t.nationsLeagueHomePattern=t.nationsLeagueOpponents.map(()=>Math.random()<.5);
    }
    const round=Number.isFinite(slot.nationsLeagueRound)?slot.nationsLeagueRound:t.groupPlayed;
    const opponentIndex=round%opponentCount;rival=t.nationsLeagueOpponents[opponentIndex]||pickNationalCalendarOpponent(p,slot,cal);
    const firstMeeting=round<opponentCount,firstHome=t.nationsLeagueHomePattern?.[opponentIndex]??true;
    home=firstMeeting?firstHome:!firstHome;
  }else if(slot.nationsLeague&&slot.nationsLeagueTwoLeg){
    if(slot.nationsLeagueLeg===1||!t.currentKnockoutOpponent){
      const picked=pickNationalCalendarOpponent(p,slot,cal);t.currentKnockoutOpponent={code:picked.code,name:picked.name};t.qfHomeFirst=Math.random()<.5;
    }
    rival=t.currentKnockoutOpponent;home=slot.nationsLeagueLeg===1?!!t.qfHomeFirst:!t.qfHomeFirst;
  }else{
    rival=pickNationalCalendarOpponent(p,slot,cal);
  }
  if(!rival)rival={code:'',name:'Adversário'};
  if(slot.kind==='tournament'&&t){
    t.participantCodes=Array.isArray(t.participantCodes)?t.participantCodes:[];
    for(const code of [p.nationalityCode,rival.code])if(code&&!t.participantCodes.includes(code))t.participantCodes.push(code);
  }
  return {type:'national',competition:slot.competition,stage:slot.stage,home:home?p.nationality:rival.name,away:home?rival.name:p.nationality,opponent:rival.name,opponentCode:rival.code,nationalCalendar:true,nationalKind:slot.kind,nationalTournament:slot.kind==='tournament',nationalKnockout:!!slot.knockout,nationalFinal:!!slot.final,calendarIndex:cal.index,nationsLeague:!!slot.nationsLeague,nationsLeagueTwoLeg:!!slot.nationsLeagueTwoLeg,nationsLeagueLeg:slot.nationsLeagueLeg||null,nationsLeagueThirdPlace:!!slot.nationsLeagueThirdPlace};
}
function skipRemainingNationalTournamentSlots(cal,competition){
  while(cal.index<cal.slots.length&&cal.slots[cal.index]?.competition===competition)cal.index++;
}
function processNationalCalendarResult(event,pf,pa){
  const p=state.player,s=state.season,cal=ensureNationalCalendarState(s,p);if(!cal||!event.nationalCalendar)return;
  const slot=cal.slots[cal.index]||null;
  // Segurança: um evento já gerado continua válido mesmo se o índice foi migrado.
  if(slot&&event.calendarIndex!==undefined&&event.calendarIndex!==cal.index)cal.index=event.calendarIndex;
  if(!event.nationalTournament){cal.index++;return;}
  const t=cal.tournament;if(!t){cal.index++;return;}
  if(!event.nationalKnockout){
    t.groupPlayed++;t.gf+=pf;t.ga+=pa;
    if(pf>pa)t.points+=3;else if(pf===pa)t.points++;
    cal.index++;
    if(t.groupPlayed>=t.groupMatches){
      const gd=t.gf-t.ga;
      if(t.nationsLeague){
        const tier=t.leagueTier||'A',strong=nationalTeamStrength(p.nationalityCode,p.nationality);
        if(tier==='A'){
          const bubble=t.points===8&&Math.random()<clamp(.45+gd*.07+(strong-82)*.025,.18,.82),qualified=t.points>=9||bubble;
          if(!qualified){t.finished=true;t.eliminated=true;skipRemainingNationalTournamentSlots(cal,t.competition);state.news.push(`${p.nationality} encerra a Liga A da UEFA Nations League na fase de liga com ${t.points} ponto(s).`);}
          else state.news.push(`${p.nationality} termina entre os dois primeiros do grupo da Liga A e avança às quartas da UEFA Nations League com ${t.points} ponto(s).`);
        }else{
          const promote=t.points>=Math.max(9,t.groupMatches*2),relegate=t.points<=Math.max(2,Math.floor(t.groupMatches*.65)),order=nationsLeagueModernFormat(s.year)?['A','B','C']:['A','B','C','D'],idx=order.indexOf(tier);let next=tier;
          if(promote&&idx>0)next=order[idx-1];else if(relegate&&idx>=0&&idx<order.length-1)next=order[idx+1];
          p.nationsLeagueTier=next;t.finished=true;skipRemainingNationalTournamentSlots(cal,t.competition);
          state.news.push(`${p.nationality} conclui a Liga ${tier} da UEFA Nations League com ${t.points} ponto(s)${next!==tier?(order.indexOf(next)<idx?' e conquista promoção.':' e sofre rebaixamento.'):' e permanece na mesma liga.'}`);
        }
        return;
      }
      // Classificação simplificada da fase de grupos: 4+ pontos classifica;
      // com 3 pontos, saldo/força da seleção decide a última vaga.
      const bubble=t.points===3&&Math.random()<clamp(.42+gd*.10+(nationalTeamStrength(p.nationalityCode,p.nationality)-78)*.015,.18,.82);
      if(t.points<3||(t.points===3&&!bubble)){
        t.finished=true;t.eliminated=true;skipRemainingNationalTournamentSlots(cal,t.competition);
        state.news.push(`${p.nationality} é eliminado na fase de grupos da ${t.competition} com ${t.points} ponto(s).`);
      }else{
        state.news.push(`${p.nationality} avança da fase de grupos da ${t.competition} com ${t.points} ponto(s).`);
      }
    }
    return;
  }
  let advanced;
  if(event.nationsLeagueTwoLeg){
    t.qfAggregate=t.qfAggregate||{for:0,against:0};t.qfAggregate.for+=pf;t.qfAggregate.against+=pa;cal.index++;
    if(event.nationsLeagueLeg===1){
      state.news.push(`${p.nationality} encerra a ida das quartas da UEFA Nations League em ${pf} x ${pa}. A vaga será decidida no jogo de volta.`);
      return;
    }
    const aggFor=t.qfAggregate.for,aggAgainst=t.qfAggregate.against;
    advanced=aggFor>aggAgainst;
    if(aggFor===aggAgainst){
      const our=nationalTeamStrength(p.nationalityCode,p.nationality),opp=nationalTeamStrength(event.opponentCode,event.opponent);
      advanced=Math.random()<clamp(.50+(our-opp)*.018,.22,.78);
      state.news.push(`${p.nationality} ${advanced?'avança':'é eliminado'} nos pênaltis após ${aggFor} x ${aggAgainst} no agregado das quartas da UEFA Nations League.`);
    }else state.news.push(`${p.nationality} ${advanced?'avança':'é eliminado'} nas quartas da UEFA Nations League por ${aggFor} x ${aggAgainst} no agregado.`);
    t.qfAggregate=null;t.currentKnockoutOpponent=null;t.qfHomeFirst=null;
  }else{
    advanced=pf>pa;
    if(pf===pa){
      const our=nationalTeamStrength(p.nationalityCode,p.nationality),opp=nationalTeamStrength(event.opponentCode,event.opponent);
      advanced=Math.random()<clamp(.50+(our-opp)*.018,.22,.78);
      state.news.push(`${p.nationality} ${advanced?'avança':'é eliminado'} nos pênaltis na ${event.stage} da ${t.competition}.`);
    }
    cal.index++;
  }
  if(t.nationsLeague&&event.stage==='Semifinal'){
    if(!advanced){t.playingThirdPlace=true;state.news.push(`${p.nationality} perde a semifinal da UEFA Nations League e vai disputar o 3º lugar.`);return;}
    // O vencedor da semifinal vai direto à final e não disputa a partida de 3º lugar.
    if(cal.slots[cal.index]?.nationsLeagueThirdPlace)cal.index++;
    state.news.push(`${p.nationality} vence a semifinal e avança à final da UEFA Nations League.`);return;
  }
  if(t.nationsLeague&&event.nationsLeagueThirdPlace){
    t.finished=true;t.thirdPlace=!!advanced;t.fourthPlace=!advanced;p.nationsLeagueTier='A';skipRemainingNationalTournamentSlots(cal,t.competition);
    state.news.push(`${p.nationality} termina a UEFA Nations League em ${advanced?'3º':'4º'} lugar.`);return;
  }
  if(!advanced){
    t.finished=true;t.eliminated=true;skipRemainingNationalTournamentSlots(cal,t.competition);
    state.news.push(`${p.nationality} deixa a ${t.competition} na ${event.stage}.`);
    return;
  }
  if(event.nationalFinal){
    t.finished=true;t.champion=true;if(t.nationsLeague)p.nationsLeagueTier='A';addNationalTrophy(t.competition);
    skipRemainingNationalTournamentSlots(cal,t.competition);
    return;
  }
  state.news.push(`${p.nationality} avança para a próxima fase da ${t.competition}.`);
}
function nationalCalendarStatusText(s=state.season,p=state.player){
  if(!s||!p)return '';
  if(isWorldCupYear(s.year)){const wc=ensureWorldCupState(s,p);if(wc?.active&&!wc.finished)return 'FIFA World Cup';}
  const slot=currentNationalCalendarSlot(s,p);
  return slot?`${slot.competition} · ${slot.stage}`:'Datas FIFA concluídas';
}
function worldCupTournamentLockActive(s=state.season,p=state.player){
  if(!s||!p||!isWorldCupYear(s.year)||!p.calledUp)return false;
  const wc=ensureWorldCupState(s,p);
  if(!wc||wc.finished||!wc.active)return false;
  return !!(wc.started||worldCupReady(s,p));
}

function worldCupOutcomeSummary(wc=state.season?.worldCup,p=state.player){
  if(!wc||!p)return null;
  if(wc.champion)return {icon:'🏆',title:`${p.nationality} é campeã do mundo!`,subtitle:`${p.name} termina a Copa do Mundo como campeão e retorna ao clube somente após o encerramento do torneio.`};
  if(wc.runnerUp)return {icon:'🥈',title:`Vice-campeão da Copa do Mundo`,subtitle:`${p.nationality} chega até a final e termina a competição em 2º lugar.`};
  if(wc.thirdPlace)return {icon:'🥉',title:`3º lugar na Copa do Mundo`,subtitle:`${p.nationality} fecha o torneio no pódio antes da retomada da temporada de clubes.`};
  if(wc.fourthPlace)return {icon:'4º',title:`4º lugar na Copa do Mundo`,subtitle:`${p.nationality} encerra sua campanha após a disputa de 3º lugar.`};
  if(wc.eliminated){
    const stage=wc.lastMatchResolution?.stage||'competição';
    const label=stage==='group'?'fase de grupos':stage;
    return {icon:countryFlag(p.nationalityCode)||'🌍',title:`Fim da campanha de ${p.nationality}`,subtitle:`A seleção é eliminada na ${label}. A temporada de clubes só volta a ser simulada depois deste desfecho.`};
  }
  return {icon:'🌍',title:'Copa do Mundo concluída',subtitle:`A participação de ${p.nationality} chegou ao fim.`};
}
function maybePresentWorldCupOutcome(){
  const p=state.player,s=state.season,wc=s?.worldCup;
  if(!p||!s||!wc?.started||!wc.finished||wc.outcomePresented)return false;
  wc.outcomePresented=true;state.simulatingSeason=false;nextEventCache=null;save();render();
  const summary=worldCupOutcomeSummary(wc,p);if(!summary)return false;
  celebrationAfter=()=>{if(state.player&&!state.player.retired&&state.season&&!state.season.closed)continueSeasonSimulation();};
  if(wc.champion)showCelebrationForHonour('FIFA World Cup',summary.title,summary.subtitle);else showCelebration(summary.icon,summary.title,summary.subtitle);
  return true;
}
function chooseNextEvent(){
  if(!state.created||state.player.retired)return null;const p=state.player,s=state.season;
  // Durante a Copa do Mundo a temporada de clubes fica efetivamente pausada.
  // Nenhuma partida de liga/copa/continental pode furar o calendário enquanto
  // a seleção ainda estiver viva no torneio.
  if(worldCupTournamentLockActive(s,p))return nextWorldCupEvent();
  if(isWorldCupYear(s.year)&&p.calledUp){const wcEvent=nextWorldCupEvent();if(wcEvent)return wcEvent;}
  const superIndex=(s.superCups||[]).findIndex(x=>x.active);if(superIndex>=0){const superEvent=getSuperCupEvent(s.superCups[superIndex],superIndex);if(superEvent)return superEvent;}
  if(p.calledUp){const nationalEvent=nextNationalCalendarEvent();if(nationalEvent)return nationalEvent;}
  const continental=s.continental;
  if(continental?.active && (s.league.index>=continental.nextLeagueRound || s.league.finished)){
    const event=getContinentalEvent();if(event)return event;
  }
  if(s.leagueCup?.active && (s.league.index>=s.leagueCup.nextLeagueRound || s.league.finished)) return getKnockoutEvent(s.leagueCup,'league-cup');
  if(s.cup.active && (s.league.index>=s.cup.nextLeagueRound || s.league.finished)) return getKnockoutEvent(s.cup,'cup');
  if(!s.league.finished) return s.league.schedule[s.league.index];
  if(isWorldCupYear(s.year)&&p.calledUp){const wcEvent=nextWorldCupEvent();if(wcEvent)return wcEvent;}
  if(p.calledUp){const nationalEvent=nextNationalCalendarEvent();if(nationalEvent)return nationalEvent;}
  return null;
}
function seasonComplete(){ const s=state.season;if(!s)return false;const wc=ensureWorldCupState(s,state.player),worldCupPending=!!(isWorldCupYear(s.year)&&state.player?.calledUp&&wc?.active&&!wc.finished);const slot=currentNationalCalendarSlot(s,state.player),nationalCalendarPending=!!(state.player?.calledUp&&slot);return s.league.finished && !s.cup.active && !s.leagueCup?.active && (!s.continental||!s.continental.active) && !(s.superCups||[]).some(x=>x.active) && !worldCupPending && !nationalCalendarPending; }

function poisson(lambda){
  const limit=Math.exp(-lambda);let product=1,k=0;
  do{k++;product*=Math.random();}while(product>limit&&k<9);
  return clamp(k-1,0,7);
}
function poissonProbability(k,lambda){
  let factorial=1;for(let i=2;i<=k;i++)factorial*=i;
  return Math.exp(-lambda)*Math.pow(lambda,k)/factorial;
}
function matchModel(homeStrength,awayStrength,homeAdvantage=4){
  const effectiveHome=homeStrength+homeAdvantage;
  const diff=effectiveHome-awayStrength;
  const homeXg=clamp(1.35+diff*.045,.35,3.25);
  const awayXg=clamp(1.10-diff*.040,.25,2.85);
  let homeWin=0,draw=0,awayWin=0;
  for(let h=0;h<=7;h++)for(let a=0;a<=7;a++){
    const prob=poissonProbability(h,homeXg)*poissonProbability(a,awayXg);
    if(h>a)homeWin+=prob;else if(h===a)draw+=prob;else awayWin+=prob;
  }
  const total=homeWin+draw+awayWin;
  return {homeStrength,awayStrength,effectiveHome,homeAdvantage,homeXg,awayXg,homeWin:homeWin/total,draw:draw/total,awayWin:awayWin/total};
}
function playerClubStrength(){
  const p=state.player;
  const impact=clamp((p.overall-70)*.20,-3,5);
  return clamp((p.clubStrength||clubStrength(p.club,p.clubCountry))+impact,60,99);
}
function eventStrengths(event){
  const p=state.player;
  if(event.type==='national'){
    const base=nationalTeamStrength(p.nationalityCode,p.nationality),starImpact=clamp((p.overall-78)*.10+(p.nationalTrust||0)*.012,0,2.4),ours=clamp(base+starImpact,62,97);
    const opponentCode=event.opponentCode||codeForCountryName(event.opponent),theirs=nationalTeamStrength(opponentCode,event.opponent);
    return event.home===p.nationality?{home:ours,away:theirs}:{home:theirs,away:ours};
  }
  const ours=playerClubStrength();
  const theirs=clubStrength(event.opponent,p.clubCountry);
  return event.home===p.club?{home:ours,away:theirs}:{home:theirs,away:ours};
}
function eventHomeAdvantage(event){return event?.worldCup?0:event?.type==='national'?2:4;}
function favoritismForEvent(event){
  const strengths=eventStrengths(event);const model=matchModel(strengths.home,strengths.away,eventHomeAdvantage(event));
  const homePct=Math.round(model.homeWin*100),drawPct=Math.round(model.draw*100),awayPct=Math.max(0,100-homePct-drawPct);
  const favorite=model.homeWin>=model.awayWin?event.home:event.away;
  const favoritePct=Math.round(Math.max(model.homeWin,model.awayWin)*100);
  return {...model,homePct,drawPct,awayPct,favorite,favoritePct};
}
function simulateScore(event){
  const strengths=eventStrengths(event);const model=matchModel(strengths.home,strengths.away,eventHomeAdvantage(event));
  return {homeGoals:poisson(model.homeXg),awayGoals:poisson(model.awayXg),model};
}
function positionProfile(position){
  // V10.3: atacantes de elite voltam a ter produção de superstar. O alvo de
  // calibração é ~80 G/A em 55 jogos para um centroavante GER 92–95, com uma
  // curva adicional para 96–99. Posições não ofensivas continuam bem abaixo disso.
  return ({'Goleiro':{goal:.002,assist:.015,defensive:true},'Zagueiro':{goal:.055,assist:.040,defensive:true},'Lateral direito':{goal:.050,assist:.150,defensive:true},'Lateral esquerdo':{goal:.050,assist:.150,defensive:true},'Volante':{goal:.080,assist:.130,defensive:true},'Meia central':{goal:.140,assist:.250},'Meia ofensivo':{goal:.220,assist:.320},'Meia direita':{goal:.190,assist:.280},'Meia esquerda':{goal:.190,assist:.280},'Segundo atacante':{goal:.340,assist:.250},'Ponta direita':{goal:.310,assist:.270},'Ponta esquerda':{goal:.310,assist:.270},'Centroavante':{goal:.455,assist:.205}})[position]||{goal:.140,assist:.250};
}
function seasonProductionDamping(){
  const s=state.season;if(!s)return 1;const ga=(s.goals||0)+(s.assists||0);
  // O freio só aparece depois de uma temporada já histórica. 80 G/A não é
  // artificialmente bloqueado; 110–130 continua possível, mas exige uma curva excepcional.
  if(ga>=138)return .42;
  if(ga>=128)return .58;
  if(ga>=116)return .74;
  if(ga>=104)return .88;
  return 1;
}
function eliteProductionMultiplier(p=state.player){
  if(!p)return 1;const o=Number(p.overall)||68;
  if(o<=95)return 1;
  // 96, 97, 98 e 99 recebem crescimento progressivo de produção.
  return clamp(1+(o-95)*.055,1,1.22);
}
function developmentProductionFactor(p=state.player,appearanceRole='start'){
  if(!p)return 1;const o=Number(p.overall)||68;
  let factor=o>=90?1:o>=87?.94:o>=84?.86:o>=81?.76:o>=78?.66:o>=75?.56:o>=72?.47:.40;
  const seasonNo=currentCareerSeasonNumber();
  if(seasonNo<=3&&o<84)factor*=.88+Math.max(0,seasonNo-1)*.04;
  if(appearanceRole==='sub')factor*=.60;
  return clamp(factor,.28,1.05);
}
function agingPerformanceFactor(p=state.player){
  if(!p||p.age<37)return 1;
  return clamp(1-(p.age-36)*.025,.72,1);
}
function matchInjuryRisk(p=state.player,event=null){
  if(!p)return 0;const attrs=normalizePlayerAttributes(p),physical=clamp(Number(attrs.physical)||70,35,99);
  const physicalProtection=(physical-70)*.00025;
  const ageIncrease=Math.max(0,p.age-29)*.00055+Math.max(0,p.age-36)*.00075;
  const scheduleRisk=event?.worldCup?.0015:event?.type==='continental'?.001:0;
  return clamp(.014-physicalProtection+ageIncrease+scheduleRisk+(p.injuryRiskModifier||0),.004,.055);
}
function maybeSustainMatchInjury(event,perf){
  const p=state.player,s=state.season;if(!p||!s||!perf||perf.rating<=0||(p.injuryGames||0)>0)return null;
  const risk=matchInjuryRisk(p,event);if(Math.random()>=risk)return null;
  const attrs=normalizePlayerAttributes(p),physical=attrs.physical||70,age=p.age;
  const severityRoll=Math.random()+Math.max(0,age-34)*.018-Math.max(0,physical-75)*.006;
  let games,label;
  if(severityRoll<.55){games=rnd(1,2);label='desconforto muscular';}
  else if(severityRoll<.88){games=rnd(3,5);label='lesão muscular';}
  else{games=rnd(6,10);label='lesão mais séria';}
  p.injuryGames=games;p.injuryHistory=Array.isArray(p.injuryHistory)?p.injuryHistory:[];
  p.injuryHistory.push({year:s.year,age:p.age,games,label,competition:event?.competition||'Partida'});
  p.injuryRiskModifier=Math.max(0,(p.injuryRiskModifier||0)-.003);
  state.news.push(`${p.name} sofre ${label} em ${event?.competition||'uma partida'} e deve perder cerca de ${games} jogo(s).`);
  return {games,label,risk};
}
function simulatePlayerPerformance(teamGoals,oppGoals,context={}){
  const p=state.player,profile=positionProfile(p.position),a=normalizePlayerAttributes(p);
  const appearanceRole=context.appearanceRole||'start',developmentFactor=developmentProductionFactor(p,appearanceRole);
  const attackSkill=(a.finishing*.42+a.dribbling*.25+a.pace*.18+a.physical*.15);
  const creationSkill=(a.passing*.48+a.dribbling*.27+a.pace*.15+(50+a.weakFoot*10)*.10);
  const defenseSkill=(a.defense*.55+a.physical*.30+a.pace*.15);
  const roleSkill=positionWeightedAttributeScore(p,a);
  const primaryId=primaryAttributeForPosition(p.position);
  const primaryValue=normalizedAttributeValue(primaryId,a[primaryId]);
  const ageFactor=agingPerformanceFactor(p);
  const quality=clamp(((p.overall-60)/95+(roleSkill-68)/135+(primaryValue-68)/420)*ageFactor,0,.60);
  const elite=eliteProductionMultiplier(p),damping=seasonProductionDamping();
  let goals=0,assists=0;
  if(teamGoals>0){
    const goalBoost=clamp((attackSkill-75)/210,-.05,.12);
    const goalChance=clamp((profile.goal+quality+goalBoost)*elite*damping*developmentFactor,.001,.96);
    goals=Math.random()<goalChance?1:0;
    if(goals&&teamGoals>1&&Math.random()<clamp((.110+quality/3+Math.max(0,a.finishing-75)/500)*elite*damping*developmentFactor,.01,.75))goals++;
    if(goals>1&&teamGoals>2&&Math.random()<clamp((.045+quality/7+Math.max(0,a.finishing-90)/650)*elite*damping*developmentFactor,.005,.38))goals++;
    goals=Math.min(goals,teamGoals);
    const assistSlots=Math.max(0,teamGoals-goals);
    const assistBoost=clamp((creationSkill-75)/215,-.04,.12);
    const assistChance=clamp((profile.assist+quality*.58+assistBoost)*elite*damping*developmentFactor,.005,.86);
    if(assistSlots>0&&Math.random()<assistChance)assists=1;
    if(assistSlots>1&&assists&&Math.random()<clamp((.085+quality/4+Math.max(0,a.passing-75)/520)*elite*damping*developmentFactor,.01,.58))assists++;
    assists=Math.min(assists,assistSlots);
  }
  const skillRating=(roleSkill-68)/70;
  let rating=6.05+goals*1.2+assists*.65+skillRating+(Math.random()*1.02-.40)+(p.morale-70)/120-(1-ageFactor)*1.35;
  if(appearanceRole==='sub')rating-=.03;
  let extraLabel='Passes',extraValue=`${clamp(rnd(72,92)+Math.round((a.passing-75)/5),65,99)}%`;
  if(p.position==='Goleiro'){const saves=clamp(rnd(2,7)+Math.round((a.defense-75)/8),2,12);rating=6.1+saves*.16+(oppGoals===0?.7:0)+(defenseSkill-75)/90+(Math.random()*.45-.2);extraLabel='Defesas';extraValue=saves;}
  else if(profile.defensive){if(oppGoals===0)rating+=.35;extraLabel='Desarmes';extraValue=clamp(rnd(2,5)+Math.round((a.defense-75)/10),1,9);}
  return {goals,assists,rating:clamp(rating,5.0,10),extraLabel,extraValue};
}
function recordHistoricalDefensiveStats(perf,oppGoals){
  const p=state.player,s=state.season;if(!p||!s||!perf||Number(perf.rating)<=0)return;
  const value=Number(perf.extraValue)||0;
  if(perf.extraLabel==='Defesas')s.saves=(s.saves||0)+value;
  if(perf.extraLabel==='Desarmes')s.tackles=(s.tackles||0)+value;
  if(oppGoals===0&&['Goleiro','Zagueiro','Lateral direito','Lateral esquerdo','Volante'].includes(p.position))s.cleanSheets=(s.cleanSheets||0)+1;
}
function applySeasonGaCap(perf){
  const s=state.season;if(!s||!perf)return perf;const remaining=Math.max(0,MAX_SEASON_GA-((s.goals||0)+(s.assists||0)));if(remaining<=0){return {...perf,goals:0,assists:0};}
  let goals=Math.min(perf.goals||0,remaining);let left=remaining-goals;let assists=Math.min(perf.assists||0,left);return {...perf,goals,assists};
}
function checkSeasonGaCap(){
  const s=state.season,p=state.player;if(!s||!p||s.gaCapReached)return;
  if((s.goals||0)+(s.assists||0)>=MAX_SEASON_GA){s.gaCapReached=true;state.news.push(`${p.name} alcançou uma temporada fora da curva com ${MAX_SEASON_GA} G/A. O simulador aplica apenas um limite técnico a partir desse patamar.`);}
}
function ensureClubRoleState(p=state.player){
  if(!p)return {club:'',trust:35};
  if(!p.clubRole||p.clubRole.club!==p.club){
    const initial=clamp(30+Math.max(0,(p.overall||68)-68)*1.2,28,64);
    p.clubRole={club:p.club,trust:initial,starts:0,subApps:0,unused:0,correctDecisions:0,totalDecisions:0};
  }
  return p.clubRole;
}
function adjustClubRoleTrust(amount,reason=''){
  const p=state.player;if(!p||!amount)return;const role=ensureClubRoleState(p);role.trust=clamp((role.trust||35)+amount,0,100);
  if(reason==='correct'){role.correctDecisions=(role.correctDecisions||0)+1;role.totalDecisions=(role.totalDecisions||0)+1;}
  else if(reason==='wrong')role.totalDecisions=(role.totalDecisions||0)+1;
}
function clubStarterThreshold(p=state.player){
  const strength=p?.clubStrength||clubStrength(p?.club,p?.clubCountry);return clamp(Math.round(strength-10),72,86);
}
function clubAppearanceRole(event,p=state.player){
  if(!p||event?.type==='national')return 'start';
  if(event.playerRole)return event.playerRole;
  const role=ensureClubRoleState(p),seasonNo=currentCareerSeasonNumber(),ovr=p.overall||68,threshold=clubStarterThreshold(p);
  if(ovr>=84||(seasonNo>3&&ovr>=80)){event.playerRole='start';return 'start';}
  const trust=role.trust||35,seasonBoost=Math.max(0,seasonNo-1)*.08,overallGap=ovr-threshold;
  let startChance=clamp(.18+overallGap*.045+(trust-35)*.009+seasonBoost,.07,.86);
  let subChance=clamp(.54+overallGap*.015+(trust-35)*.004,.34,.76);
  if(seasonNo>3){startChance=clamp(startChance+.16,.12,.90);subChance=clamp(subChance+.06,.30,.78);}
  const roll=Math.random();event.playerRole=roll<startChance?'start':roll<startChance+subChance?'sub':'unused';return event.playerRole;
}
function updateClubRoleFromPerformance(roleName,perf){
  if(!state.player||!perf||roleName==='unused')return;const role=ensureClubRoleState();
  if(roleName==='start')role.starts=(role.starts||0)+1;else role.subApps=(role.subApps||0)+1;
  const rating=Number(perf.rating)||0;let delta=0;
  if(rating>=8.2)delta=3;else if(rating>=7.4)delta=2;else if(rating>=6.8)delta=1;else if(rating<6.0)delta=-2;else if(rating<6.4)delta=-1;
  if((perf.goals||0)+(perf.assists||0)>=2)delta+=1;
  role.trust=clamp((role.trust||35)+delta,0,100);
}
function simulateClubMatchWithoutAppearance(event,score){
  const p=state.player,s=state.season,playerIsHome=event.home===p.club,teamGoals=playerIsHome?score.homeGoals:score.awayGoals,oppGoals=playerIsHome?score.awayGoals:score.homeGoals;
  const role=ensureClubRoleState(p);role.unused=(role.unused||0)+1;role.trust=clamp((role.trust||35)+.15,0,100);
  processCompetitionResult(event,teamGoals,oppGoals);maybeUpdateSelectionMidSeason(event);
  return {event,playerIsHome,teamGoals,oppGoals,homeGoals:score.homeGoals,awayGoals:score.awayGoals,perf:{goals:0,assists:0,rating:0,extraLabel:'Status',extraValue:'Banco'},model:score.model,missed:true,playerRole:'unused'};
}
function simulateMatchCore(event){
  const p=state.player,s=state.season;const playerIsHome=event.type==='national'?event.home===p.nationality:event.home===p.club;
  const score=simulateScore(event);const teamGoals=playerIsHome?score.homeGoals:score.awayGoals;const oppGoals=playerIsHome?score.awayGoals:score.homeGoals;
  if((p.injuryGames||0)>0){
    p.injuryGames=Math.max(0,p.injuryGames-1);processCompetitionResult(event,teamGoals,oppGoals);
    if(p.injuryGames===0)state.news.push(`${p.name} está recuperado e volta a ficar disponível.`);
    return {event,playerIsHome,teamGoals,oppGoals,homeGoals:score.homeGoals,awayGoals:score.awayGoals,perf:{goals:0,assists:0,rating:0,extraLabel:'Status',extraValue:'Fora'},model:score.model,missed:true};
  }
  const appearanceRole=event.type==='national'?'start':clubAppearanceRole(event,p);
  if(event.type!=='national'&&appearanceRole==='unused')return simulateClubMatchWithoutAppearance(event,score);
  let perf=simulatePlayerPerformance(teamGoals,oppGoals,{appearanceRole});perf=applySeasonGaCap(perf);
  s.totalGames++;s.goals+=perf.goals;s.assists+=perf.assists;s.ratingSum+=perf.rating;recordCompetitionStat(event,perf);recordHistoricalDefensiveStats(perf,oppGoals);
  if(event.type!=='national'){
    s.clubGames++;s.clubGoals+=perf.goals;s.clubAssists+=perf.assists;if(event.type==='league'){s.leagueGames=(s.leagueGames||0)+1;s.leagueGoals=(s.leagueGoals||0)+perf.goals;s.leagueAssists=(s.leagueAssists||0)+perf.assists;}
    p.value=rebalanceMarketValue(p,.025,perf.rating);
  }else{p.nationalTeamGames++;p.nationalTeamGoals+=perf.goals;p.nationalTeamAssists=(p.nationalTeamAssists||0)+perf.assists;p.nationalTrust=clamp((p.nationalTrust||0)+(perf.rating>=8?3:perf.rating>=7.2?2:perf.rating<6.2?-1:1),0,100);}
  checkSeasonGaCap();processCompetitionResult(event,teamGoals,oppGoals,perf);const injury=maybeSustainMatchInjury(event,perf);if(event.type!=='national'){updateClubRoleFromPerformance(appearanceRole,perf);maybeUpdateSelectionMidSeason(event);}
  if(perf.rating>=8)state.news.push(`${p.name} foi destaque em ${event.competition}, com nota ${perf.rating.toFixed(1)}.`);
  return {event,playerIsHome,teamGoals,oppGoals,homeGoals:score.homeGoals,awayGoals:score.awayGoals,perf,model:score.model,injury,playerRole:appearanceRole};
}
function matchImportance(log){
  let value=log.event.type==='continental'?25:log.event.type==='cup'?18:log.event.type==='national'?12:5;
  if((log.event.stage||'').toLowerCase().includes('final'))value+=30;
  value+=clubStrength(log.event.opponent,state.player.clubCountry)/6+log.perf.rating+log.perf.goals*5+log.perf.assists*3;
  return value;
}
function generateMatchMoments(log){
  const p=state.player,attacker=['Segundo atacante','Ponta direita','Ponta esquerda','Centroavante','Meia ofensivo'].includes(p.position);
  const moments=[];let minute=8;
  const push=text=>{const jump=rnd(8,18);minute=Math.min(89,minute+jump);moments.push({minute,text});};
  if(p.position==='Goleiro')push(log.oppGoals===0?'Defesa firme em chute perigoso. Você mantém o placar zerado.':'Primeira defesa importante após finalização de média distância.');
  else if(attacker&&Math.random()<.65)push(log.perf.goals>0?'Pênalti para sua equipe. Você assume a cobrança e converte.':'Pênalti para sua equipe. Você bate, mas o goleiro evita o gol.');
  else push('Você participa de uma boa construção e ajuda a equipe a avançar no campo.');
  if(log.perf.goals>0)push(`Você aparece em ótima posição e marca${log.perf.goals>1?' um dos seus gols':' o seu gol'} na partida.`);
  else if(log.teamGoals===0)push('Boa chance criada, mas a finalização não entra. O placar segue sem gols para sua equipe.');
  else push('Sua equipe chega ao gol, mas a jogada termina com outro companheiro como protagonista.');
  if(log.perf.assists>0)push('Você encontra um companheiro livre e registra uma assistência.');
  else if(p.position==='Goleiro')push('Você organiza a defesa em uma bola parada e afasta o perigo.');
  else push('Você tenta o último passe, mas a defesa adversária consegue cortar.');
  if(log.oppGoals>0)push('O adversário aumenta a pressão e consegue balançar a rede em um dos ataques.');
  else push('A equipe suporta a pressão adversária sem sofrer gol nesse momento.');
  const result=log.teamGoals>log.oppGoals?'vitória':log.teamGoals===log.oppGoals?'empate':'derrota';
  push(`Apito final: ${result}. Sua nota na partida foi ${log.perf.rating.toFixed(1)}.`);
  return moments.slice(0,5);
}
function addTrophy(name){
  const p=state.player;p.trophies=p.trophies||[];if(p.trophies.some(t=>t.year===state.season.year&&t.name===name))return;
  p.trophies.push({year:state.season.year,name,club:p.club});p.titles=p.trophies.length;state.news.push(`${p.name} é campeão de ${name} com o ${p.club}!`);if(!state.simulatingSeason)showCelebrationForHonour(name,`Campeão: ${name}`,`${p.name} adiciona mais um título à carreira.`);
}
function legacyV4_finalizeLeague(){
  const l=state.season.league;if(l.finished)return;l.finished=true;const pts=l.points,champ=l.format.championPoints;
  let pos;if(pts>=champ)pos=1;else if(pts>=champ-5)pos=rnd(2,4);else if(pts>=champ-12)pos=rnd(3,7);else if(pts>=champ-22)pos=rnd(6,11);else if(pts>=champ-32)pos=rnd(10,15);else pos=rnd(Math.max(12,l.format.teams-5),l.format.teams);
  l.position=clamp(pos,1,l.format.teams);if(l.position===1)addTrophy(l.name);state.news.push(`${state.player.club} encerrou ${l.name} na ${l.position}ª posição, com ${l.points} pontos.`);
}
function advanceKnockout(comp){
  comp.stageIndex++;comp.leg=1;comp.opponent=null;comp.aggregateFor=0;comp.aggregateAgainst=0;
  if(comp.stageIndex>=comp.stages.length){comp.active=false;comp.won=true;if(!comp.noTrophy)addTrophy(comp.name);}
}
function buildShootoutScenario(pending){
  const options=[
    {id:'top-left',label:'Esquerda alta',chance:.72,x:18,y:22,keeperX:-1,keeperY:-1,type:'goal'},
    {id:'bottom-left',label:'Esquerda baixa',chance:.82,x:18,y:79,keeperX:-1,keeperY:1,type:'goal'},
    {id:'center',label:'Meio',chance:.83,x:50,y:60,keeperX:0,keeperY:0,type:'goal'},
    {id:'top-right',label:'Direita alta',chance:.72,x:82,y:22,keeperX:1,keeperY:-1,type:'goal'},
    {id:'bottom-right',label:'Direita baixa',chance:.82,x:82,y:79,keeperX:1,keeperY:1,type:'goal'}
  ];
  return {visual:'penalty',minute:120,title:'Disputa por pênaltis',options};
}
// Cinco alvos dentro do gol, selecionáveis também pelo teclado (botões nativos).
function penaltyAimMarkup(){
  const opts=buildShootoutScenario().options;
  return `<section class="btl-penalty-aim" aria-label="Escolha onde bater o pênalti">
      <div class="btl-penalty-arena"><div class="btl-penalty-stands" aria-hidden="true"></div>
        <div class="btl-penalty-goal" role="group" aria-label="Cinco regiões do gol">
          <div class="btl-goal-net" aria-hidden="true"></div>
          <div class="btl-keeper" aria-hidden="true"><span class="btl-keeper-head"></span><span class="btl-keeper-body"></span><span class="btl-keeper-arms"></span><span class="btl-keeper-legs"></span></div>
          ${opts.map((x,i)=>`<button type="button" class="btl-aim-target btl-aim-${x.id}" data-penalty-target="${i}" aria-label="${x.label}" title="${x.label}"><span>${i+1}</span></button>`).join('')}
          <span class="btl-penalty-flight-ball" aria-hidden="true">⚽</span>
          <span class="btl-penalty-impact" aria-hidden="true"></span>
        </div><div class="btl-penalty-spot" aria-hidden="true">⚽</div>
      </div><p class="btl-penalty-prompt">ESCOLHA UM DOS CINCO ALVOS</p>
    </section>`;
}
function renderPlayerPenaltyAim(pending){
  const visual=$('#decision-visual'),choices=$('#decision-choices');
  visual.className='decision-visual btl-penalty-interactive';
  visual.innerHTML=penaltyProgressMarkup(pending)+penaltyAimMarkup();
  choices.classList.add('hidden');choices.innerHTML='';
  hydratePenaltyBadges(visual);
  visual.querySelectorAll('[data-penalty-target]').forEach(btn=>btn.addEventListener('click',()=>resolvePenaltyShootout(Number(btn.dataset.penaltyTarget))));
}
function animatePenaltyAimShot(option,keeperOption,scored,after){
  const scene=$('#decision-visual .btl-penalty-aim'),arena=scene?.querySelector('.btl-penalty-arena');
  if(!arena){after();return;}
  scene.querySelectorAll('.btl-aim-target').forEach(el=>el.disabled=true);
  const goal=scene.querySelector('.btl-penalty-goal');
  goal.style.setProperty('--shot-x',`${option.x}%`);
  goal.style.setProperty('--shot-y',`${option.y}%`);
  goal.style.setProperty('--keeper-shift-x',`${(keeperOption.x-50)/100*goal.clientWidth}px`);
  goal.style.setProperty('--keeper-shift-y',`${keeperOption.keeperY<0?-38:keeperOption.keeperY>0?8:-10}px`);
  goal.style.setProperty('--keeper-rotation',`${keeperOption.keeperX*38}deg`);
  goal.classList.add('btl-kick-active');
  goal.classList.toggle('btl-kick-goal',scored);
  goal.classList.toggle('btl-kick-save',!scored);
  scene.querySelector('.btl-penalty-prompt').textContent='COBRANÇA EM ANDAMENTO';
  setTimeout(()=>{const status=scene.querySelector('.btl-penalty-prompt');if(status)status.textContent=scored?'⚽ GOOOOL!':'🧤 DEFESA DO GOLEIRO!';},1000);
  setTimeout(after,1650);
}

function buildPenaltyOrderOptions(){return Array.from({length:5},(_,i)=>({slot:i+1,label:`${i+1}ª cobrança`}));}
// O jogador é um dos onze cobradores. Se escolher a 3ª cobrança, só volta
// a bater na 14ª, 25ª, 36ª... da SUA equipe (não em toda alternada).
function isSelectedPenaltyRound(selectedRound,currentRound){
  const selected=Number(selectedRound),round=Number(currentRound);
  return Number.isInteger(selected)&&selected>=1&&selected<=11&&
    Number.isInteger(round)&&round>=selected&&(round-selected)%11===0;
}
function penaltyTeamVisualMarkup(pending,team){
  if(pending.scope==='worldcup'||pending.event?.type==='national')return `<span class="penalty-national-flag">${nationalFlagImage(codeForCountryName(team),team)}</span>`;
  return clubCrestMarkup(team,team===pending.team?state.player?.clubCountry:'');
}
function penaltyProgressMarkup(pending){
  const shoot=pending.shootoutLive||{kicks:[],score:{home:0,away:0}},clubs=[{name:pending.home,side:'home'},{name:pending.away,side:'away'}];
  const maxRound=Math.max(5,...(shoot.kicks||[]).map(k=>k.round||0),pending.playerKickRound||0);
  const dots=club=>Array.from({length:maxRound},(_,i)=>{const round=i+1,k=shoot.kicks.find(x=>x.team===club.name&&x.round===round),chosen=club.name===pending.team&&isSelectedPenaltyRound(pending.playerKickRound,round)&&!k&&shoot.waitingForPlayer;let cls=k?(k.scored?'made':'missed'):(chosen?'chosen':'pending'),icon=k?(k.scored?'✓':'✕'):(chosen?'★':'');return `<span class="penalty-dot ${cls}${round>5?' sudden-dot':''}${k?.isPlayer?' player-slot':''}" data-penalty-team="${esc(club.name)}" data-penalty-round="${round}">${icon}</span>`;}).join('');
  return `<div class="penalty-shootout-shell"><div class="penalty-shootout-head"><span>${shoot.phase==='sudden'?'Cobranças alternadas':'Série inicial de 5 cobranças'}</span><span><b>${shoot.score.home||0} × ${shoot.score.away||0}</b></span></div>${clubs.map(club=>`<div class="penalty-team-row"><div class="penalty-team-meta">${penaltyTeamVisualMarkup(pending,club.name)}</div><div class="penalty-dot-row">${dots(club)}</div><b class="penalty-row-score">${shoot.score[club.side]||0}</b></div>`).join('')}</div>`;
}
function initPenaltyLive(pending){
  if(pending.shootoutLive)return pending.shootoutLive;
  const first=Math.random()<.5?pending.home:pending.away;
  return pending.shootoutLive={first,nextTeam:first,round:1,kicks:[],score:{home:0,away:0},remaining:{home:5,away:5},phase:'standard',waitingForPlayer:false,finished:false};
}
function shootoutSide(pending,team){return team===pending.home?'home':'away';}
function shootoutOpponent(pending,team){return team===pending.home?pending.away:pending.home;}
function shootoutMathematicallyFinished(pending,live){return live.score.home>live.score.away+live.remaining.away||live.score.away>live.score.home+live.remaining.home;}
function simulatedPenaltyChance(pending,team){const user=team===pending.team,base=user?clamp(.69+((state.player?.overall||70)-75)*.004,.57,.86):.72;return base;}
function appendPenaltyKick(pending,team,round,scored,isPlayer=false){const live=initPenaltyLive(pending),side=shootoutSide(pending,team);live.kicks.push({team,round,scored,isPlayer});live.score[side]+=scored?1:0;if(round<=5)live.remaining[side]=Math.max(0,(live.remaining[side]||0)-1);}
function advancePenaltyCursor(pending){const live=initPenaltyLive(pending),other=shootoutOpponent(pending,live.nextTeam);if(other===live.first){live.round++;}live.nextTeam=other;}
function renderPenaltyLive(pending){const visual=$('#decision-visual');visual.className='decision-visual penalty-shootout-preview';visual.innerHTML=penaltyProgressMarkup(pending);hydratePenaltyBadges(visual);}
function finalizePenaltyShootout(pending){
  const live=initPenaltyLive(pending);live.finished=true;const teamWin=(live.score.home>live.score.away?pending.home:pending.away)===pending.team,p=state.player;
  if(pending.scope==='worldcup'){const event=pending.event||{type:'national',worldCup:true,competition:'FIFA World Cup',stage:pending.stage,home:pending.home,away:pending.away,opponent:pending.home===p.nationality?pending.away:pending.home,opponentCode:codeForCountryName(pending.home===p.nationality?pending.away:pending.home)};state.pendingPenaltyShootout=null;processWorldCupResult(event,pending.scoreFor??0,pending.scoreAgainst??0,teamWin);}
  else{const comp=pending.scope==='cup'?state.season.cup:pending.scope==='league-cup'?state.season.leagueCup:pending.scope==='continental-qualifier'?state.season.continental?.preliminary:state.season.continental?.knockout;if(teamWin){if(comp)advanceKnockout(comp);}else if(comp){comp.active=false;comp.eliminated=true;}if(pending.scope==='continental-qualifier')resolveContinentalPreliminary(state.season.continental);if(pending.scope==='continental'&&state.season.continental?.knockout===comp&&!comp.active){state.season.continental.active=false;state.season.continental.won=!!comp.won;state.season.continental.eliminated=!!comp.eliminated;}state.pendingPenaltyShootout=null;}
  save();renderPenaltyLive(pending);$('#decision-choices').classList.add('hidden');$('#decision-result').classList.remove('hidden');$('#decision-result').innerHTML=`<strong>${teamWin?'Sua equipe vence nos pênaltis!':'Sua equipe perde nos pênaltis.'}</strong><span>Placar da disputa: ${live.score.home}-${live.score.away}${live.phase==='sudden'?' após cobranças alternadas.':'.'}</span>`;$('#decision-continue').classList.remove('hidden');
}
function continuePenaltySimulation(pending){
  const live=initPenaltyLive(pending);if(live.finished)return;
  $('#decision-choices').classList.add('hidden');$('#decision-result').classList.add('hidden');renderPenaltyLive(pending);
  const tick=()=>{
    if(live.finished)return;
    if(live.phase==='standard'&&shootoutMathematicallyFinished(pending,live)){finalizePenaltyShootout(pending);return;}
    if(live.phase==='standard'&&live.round>5){if(live.score.home!==live.score.away){finalizePenaltyShootout(pending);return;}live.phase='sudden';live.round=6;live.nextTeam=live.first;}
    const isPlayerTurn=live.nextTeam===pending.team&&isSelectedPenaltyRound(pending.playerKickRound,live.round);
    if(isPlayerTurn){
      live.waitingForPlayer=true;
      $('#decision-title').textContent=`Sua vez · ${live.round}º pênalti`;
      $('#decision-description').textContent='';
      $('#decision-result').classList.add('hidden');
      renderPlayerPenaltyAim(pending);
      return;
    }
    const team=live.nextTeam,round=live.round,scored=Math.random()<simulatedPenaltyChance(pending,team);appendPenaltyKick(pending,team,round,scored,false);advancePenaltyCursor(pending);renderPenaltyLive(pending);playMatchVisualFX('penalty',scored?'success':'miss','shootout');
    if(live.phase==='sudden'&&live.nextTeam===live.first&&live.kicks.filter(k=>k.round===round).length===2&&live.score.home!==live.score.away){setTimeout(()=>finalizePenaltyShootout(pending),500);return;}
    setTimeout(tick,560);
  };
  setTimeout(tick,420);
}
function openPenaltyShootoutDecision(){
  const pending=state.pendingPenaltyShootout;if(!pending)return;
  if(pending.home&&pending.away&&!penaltyCrestGatePassed.has(pending)){
    checkMatchCrestsBeforeDecision(pending,()=>{penaltyCrestGatePassed.add(pending);openPenaltyShootoutDecision();});
    return;
  }
  applyCompetitionExperienceTheme(pending);
  const card=$('#match-decision-modal .decision-card');card.classList.add('scene-finale');applyDecisionCompetitionTheme(card,pending);$('#decision-competition').innerHTML=competitionHeaderMarkup(pending.competition,[pending.stage,'PÊNALTIS'].filter(Boolean).join(' · '));$('#decision-match').innerHTML=decisionFixtureMarkup(pending);hydrateNextMatchBadges();$('#decision-result').classList.add('hidden');$('#decision-continue').classList.add('hidden');$('#decision-visual').className='decision-visual penalty-shootout-preview';
  if(pending.playerKickRound&&initPenaltyLive(pending).waitingForPlayer){
    const live=initPenaltyLive(pending);
    // Um save antigo pode ter parado o jogo numa alternada que não era do jogador.
    if(!isSelectedPenaltyRound(pending.playerKickRound,live.round)){
      live.waitingForPlayer=false;
      $('#match-decision-modal').classList.remove('hidden');
      continuePenaltySimulation(pending);return;
    }
    $('#decision-title').textContent=`Sua vez · ${live.round}º pênalti`;
    renderPlayerPenaltyAim(pending);
    $('#match-decision-modal').classList.remove('hidden');return;
  }
  if(!pending.playerKickRound){$('#decision-title').textContent="120' · Escolha qual pênalti você vai bater";$('#decision-description').textContent='';$('#decision-visual').innerHTML=penaltyProgressMarkup(pending);hydratePenaltyBadges($('#decision-visual'));const box=$('#decision-choices');box.className='event-choices penalty-order-choices';box.innerHTML=buildPenaltyOrderOptions().map(o=>`<button class="event-choice decision-option" data-penalty-order="${o.slot}"><strong>${o.label}</strong></button>`).join('');box.querySelectorAll('[data-penalty-order]').forEach(b=>b.addEventListener('click',()=>{pending.playerKickRound=Number(b.dataset.penaltyOrder);initPenaltyLive(pending);save();continuePenaltySimulation(pending);}));$('#match-decision-modal').classList.remove('hidden');return;}
  continuePenaltySimulation(pending);$('#match-decision-modal').classList.remove('hidden');
}
function resolvePenaltyShootout(index){
  const pending=state.pendingPenaltyShootout;if(!pending)return;
  const live=initPenaltyLive(pending),options=buildShootoutScenario(pending).options,option=options[index];
  if(!live.waitingForPlayer||!option)return;
  live.waitingForPlayer=false;
  const keeperRead=options[Math.floor(Math.random()*options.length)];
  const attrs=state.player?.attributes||{},skill=((attrs.finishing||state.player?.overall||70)+(attrs.dribbling||70)*.12+(attrs.passing||70)*.08)/100;
  const keeperReadsShot=option.id===keeperRead.id;
  const chance=clamp(option.chance+(skill-.78)*.18-(keeperReadsShot?.43:0),.22,.94);
  const scored=Math.random()<chance;
  // A cobrança perdida é representada por uma defesa no canto escolhido.
  // As probabilidades e o placar continuam os mesmos; muda apenas a coreografia visual.
  const keeperOption=scored?keeperRead:option;
  // Animation completes before score changes or the next penalty starts.
  animatePenaltyAimShot(option,keeperOption,scored,()=>{
    appendPenaltyKick(pending,pending.team,live.round,scored,true);
    advancePenaltyCursor(pending);
    save();renderPenaltyLive(pending);
    playMatchVisualFX('penalty',scored?'success':'miss','shootout');
    setTimeout(()=>continuePenaltySimulation(pending),400);
  });
}

function processKnockout(comp,event,pf,pa){
  const stage=comp.stages[comp.stageIndex];comp.aggregateFor+=pf;comp.aggregateAgainst+=pa;
  if(stage.legs===1 || comp.leg===stage.legs){
    const teamName=event.type==='national'?state.player.nationality:state.player.club;
    if(comp.aggregateFor===comp.aggregateAgainst){
      state.pendingPenaltyShootout={scope:event.type==='cup'?'cup':event.type==='league-cup'?'league-cup':event.qualifier?'continental-qualifier':'continental',competition:comp.name,stage:stage.name,team:teamName,home:event.home,away:event.away};
      state.news.push(`${teamName} empata em ${comp.name} (${stage.name}) e vai para os pênaltis.`);
      return;
    }
    const win=comp.aggregateFor>comp.aggregateAgainst;
    if(win){state.news.push(`${teamName} avançou em ${comp.name} (${stage.name}).`);advanceKnockout(comp);}else{comp.active=false;comp.eliminated=true;state.news.push(`${teamName} foi eliminado de ${comp.name} na fase ${stage.name}.`);}
  }else comp.leg++;
}
function resolveContinentalPreliminary(c){
  if(!c?.preliminary||c.preliminary.active)return;
  if(c.preliminary.won){c.phase='phase';state.news.push(`${state.player.club} se classificou para a fase principal de ${c.name}.`);}
  else{c.active=false;c.eliminated=true;state.news.push(`${state.player.club} foi eliminado na fase preliminar de ${c.name}.`);}
}
function processContinentalResult(event,pf,pa){
  const c=state.season.continental;if(!c)return;
  if(c.phase==='qualifying'){processKnockout(c.preliminary,event,pf,pa);resolveContinentalPreliminary(c);}
  else if(c.phase==='phase'){
    const ledger=ensureInternationalPhaseLedger(c),playerHome=event.home===(state.season.clubAtStart||state.player.club);
    window.BTLMatchLedger.advance(ledger,c.phaseIndex+1,{home:event.home,away:event.away,homeGoals:playerHome?pf:pa,awayGoals:playerHome?pa:pf,
      playerGoals:state.season?.matchRegistry?.at(-1)?.playerGoals||0,playerAssists:state.season?.matchRegistry?.at(-1)?.playerAssists||0},
      n=>clubStrength(n,canonicalClubCountryCode(n,'')));
    c.phaseIndex++;
    c.phaseStandings=window.BTLMatchLedger.standings(ledger);
    const playerRow=c.phaseStandings.find(r=>r.team===(state.season.clubAtStart||state.player.club));
    if(playerRow){c.points=playerRow.points;c.wins=playerRow.wins;c.draws=playerRow.draws;c.losses=playerRow.losses;}
    if(c.phaseIndex>=c.phaseSchedule.length){
      const result=internationalProgression(c,c.phaseStandings);
      c.phaseRank=result.rank;c.phaseQualification=result;
      if(!result.qualified){c.active=false;c.eliminated=true;state.news.push(`${state.player.club} foi eliminado de ${c.name}: ${result.rank}º na ${c.format.phase.toLowerCase()}.`);}
      else{
        c.phase='knockout';const hasConditional=c.knockout.stages[0]?.conditional;if(hasConditional&&result.direct)c.knockout.stageIndex=1;
        state.news.push(`${state.player.club} avançou ao mata-mata de ${c.name} em ${result.rank}º lugar, com ${c.points} pontos.`);
      }
    }
  }else{processKnockout(c.knockout,event,pf,pa);if(!c.knockout.active){c.active=false;c.won=c.knockout.won;c.eliminated=c.knockout.eliminated;}}
}
function processCompetitionResult(event,pf,pa,performance=null){
  const s=state.season;
  if(!s)return null;
  // Every played fixture is preserved with the final post-decision score.
  // Never redraw scores independently for rankings or standings.
  const userHome=event.home===(event.type==='national'?state.player.nationality:(s.clubAtStart||state.player.club));
  s.matchRegistry=s.matchRegistry||[];
  s.matchRegistry.push({id:`${s.year}|${s.matchRegistry.length+1}`,competition:event.competition,type:event.type,
    stage:event.stage||'',home:event.home,away:event.away,
    homeGoals:userHome?pf:pa,awayGoals:userHome?pa:pf,
    playerGoals:Math.max(0,performance?.goals||0),playerAssists:Math.max(0,performance?.assists||0),
    source:'partida disputada na carreira'});
  if(event.superCupName)return processSuperCupResult(event,pf,pa);
  if(event.type==='league'){
    const l=s.league,ledger=ensureSeasonLeagueLedger(s),round=l.index+1;
    // Both scorelines (user match and all other round fixtures) enter the same
    // ledger before league totals or qualification positions are computed.
    const playerHome=event.home===(s.clubAtStart||state.player.club);
    window.BTLMatchLedger.advance(ledger,round,{
      home:event.home,away:event.away,
      homeGoals:playerHome?pf:pa,awayGoals:playerHome?pa:pf,
      playerGoals:performance?.goals||0,playerAssists:performance?.assists||0
    },team=>clubStrength(team,s.countryAtStart));
    l.liveStandings=window.BTLMatchLedger.standings(ledger);
    l.index++;l.gf+=pf;l.ga+=pa;if(pf>pa){l.points+=3;l.wins++;}else if(pf===pa){l.points++;l.draws++;}else l.losses++;if(l.index>=l.schedule.length)finalizeLeague();
  }else if(event.type==='cup'){processKnockout(s.cup,event,pf,pa);s.cup.nextLeagueRound+=4;}
  else if(event.type==='league-cup'){processKnockout(s.leagueCup,event,pf,pa);s.leagueCup.nextLeagueRound+=Math.max(2,Math.round(s.league.format.matches/9));}
  else if(event.type==='continental'){processContinentalResult(event,pf,pa);if(s.continental)s.continental.nextLeagueRound+=3;}
  else if(event.type==='national'){
    s.lastNationalAt=s.totalGames;s.nationalGamesPlayed=(s.nationalGamesPlayed||0)+1;
    if(event.worldCup)return processWorldCupResult(event,pf,pa);
    if(event.nationalCalendar)return processNationalCalendarResult(event,pf,pa);
  }
  return null;
}

function nationalRoleForPlayer(p=state.player){
  if(!p?.calledUp)return 'Fora do grupo';
  if(p.nationalCaptain)return 'Capitão';
  const trust=p.nationalTrust||0,caps=p.nationalTeamGames||0;
  if(trust>=70&&caps>=12)return 'Titular';
  if(trust>=42)return 'Rotação';
  return 'Reserva';
}
function updateSelectionAtSeasonEnd(avg){
  const p=state.player,was=p.calledUp;const eligible=p.overall>=73&&avg>=7.1;
  if(!was&&eligible&&Math.random()<clamp(.35+(avg-7.1)*.35+(p.overall-73)*.035,.35,.95)){
    p.calledUp=true;p.nationalTrust=Math.max(p.nationalTrust||0,22);state.news.push(`${p.name} recebe sua primeira convocação para a seleção de ${p.nationality}!`);
  }else if(was&&(avg<6.6||p.overall<71)&&Math.random()<.5){
    p.calledUp=false;p.nationalCaptain=false;p.nationalTrust=Math.max(0,(p.nationalTrust||0)-10);state.news.push(`${p.name} ficou fora da nova convocação de ${p.nationality}.`);
  }else if(was){
    p.nationalTrust=clamp((p.nationalTrust||0)+(avg>=8?5:avg>=7.3?3:avg<6.5?-3:1),0,100);
  }
  if(p.calledUp&&!p.nationalCaptain&&(p.nationalTeamGames||0)>=18&&(p.nationalTrust||0)>=82&&(p.reputation||0)>=45&&p.age>=25){
    p.nationalCaptain=true;state.news.push(`${p.name} recebe a braçadeira de capitão da seleção de ${p.nationality}.`);
  }
}
function legacyV4_developmentResult(avg){
  const p=state.player;const age=p.age;const gk=p.position==='Goleiro';const devAge=gk?age-3:age;let delta=0;
  if(devAge<=20)delta=avg>=8?4:avg>=7.4?3:avg>=6.8?2:0;
  else if(devAge<=24)delta=avg>=8?3:avg>=7.3?2:avg>=6.8?1:0;
  else if(devAge<=28)delta=avg>=7.8?2:avg>=7?1:avg<6.4?-1:0;
  else if(devAge<=31)delta=avg>=7.8?1:avg<6.6?-1:0;
  else if(devAge<=36)delta=avg>=7.6?0:-rnd(1,2);
  else if(devAge<=39)delta=-rnd(1,3);else if(devAge<=42)delta=-rnd(2,4);else delta=-rnd(3,5);
  delta+=(p.developmentBoost||0);p.developmentBoost=0;
  if(age<=24){if(avg>=7.7)p.potential=clamp(p.potential+1,75,96);else if(avg<6.3)p.potential=Math.max(p.overall,p.potential-1);}
  else if(age>=30)p.potential=Math.max(55,p.potential-1);
  const before=p.overall;if(delta>0)p.overall=Math.min(p.potential,p.overall+delta);else p.overall=clamp(p.overall+delta,45,96);
  if(age>=32)p.potential=Math.max(p.overall,p.potential);
  return p.overall-before;
}
const UEFA_AWARD_COUNTRY_CODES=new Set([...(CONFEDERATIONS.europe||[]),'IL']);
function isEuropeanCountryCode(code){return !!code&&UEFA_AWARD_COUNTRY_CODES.has(code);}

// European Golden Shoe: league goals only. The standard weighting gives 2.0 to
// the strongest five leagues, 1.5 to the next tier and 1.0 to the remaining
// eligible European leagues. Only domestic top-flight league goals count.
const GOLDEN_SHOE_FACTORS={
  // UEFA association ranking 2026: top five associations = x2.
  ENG:2,IT:2,ES:2,DE:2,FR:2,
  // Associations ranked 6–22 = x1.5.
  PT:1.5,NL:1.5,BE:1.5,TR:1.5,CZ:1.5,GR:1.5,PL:1.5,DK:1.5,NO:1.5,CY:1.5,CH:1.5,AT:1.5,SCO:1.5,SE:1.5,HR:1.5,IL:1.5,HU:1.5
};
function goldenShoeFactor(code){if(!isEuropeanCountryCode(code))return 0;return GOLDEN_SHOE_FACTORS[code]||1;}

const WORLD_AWARD_RIVALS=[
  {name:'Kylian Mbappé',countryCode:'ES',rating:94,goalBase:36,assistBase:10,teamPower:95},
  {name:'Erling Haaland',countryCode:'ENG',rating:93,goalBase:35,assistBase:6,teamPower:94},
  {name:'Harry Kane',countryCode:'DE',rating:93,goalBase:32,assistBase:9,teamPower:93},
  {name:'Mohamed Salah',countryCode:'ENG',rating:93,goalBase:28,assistBase:13,teamPower:93},
  {name:'Vinícius Jr.',countryCode:'ES',rating:92,goalBase:23,assistBase:13,teamPower:95},
  {name:'Lamine Yamal',countryCode:'ES',rating:91,goalBase:20,assistBase:16,teamPower:94},
  {name:'Ousmane Dembélé',countryCode:'FR',rating:91,goalBase:25,assistBase:12,teamPower:94},
  {name:'Raphinha',countryCode:'ES',rating:91,goalBase:23,assistBase:14,teamPower:94},
  {name:'Lautaro Martínez',countryCode:'IT',rating:91,goalBase:26,assistBase:8,teamPower:91},
  {name:'Cole Palmer',countryCode:'ENG',rating:90,goalBase:22,assistBase:14,teamPower:89},
  {name:'Jude Bellingham',countryCode:'ES',rating:91,goalBase:17,assistBase:13,teamPower:95},
  {name:'Robert Lewandowski',countryCode:'ES',rating:91,goalBase:28,assistBase:7,teamPower:94},
  {name:'Alexander Isak',countryCode:'ENG',rating:90,goalBase:27,assistBase:8,teamPower:92},
  {name:'Viktor Gyökeres',countryCode:'ENG',rating:90,goalBase:28,assistBase:7,teamPower:91},
  {name:'Michael Olise',countryCode:'DE',rating:89,goalBase:20,assistBase:14,teamPower:94},
  {name:'Julián Álvarez',countryCode:'ES',rating:90,goalBase:24,assistBase:10,teamPower:92},
  {name:'Victor Osimhen',countryCode:'TR',rating:89,goalBase:28,assistBase:5,teamPower:88}
];
const RIVAL_NATIONAL_CODES={'Kylian Mbappé':'FR','Erling Haaland':'NO','Harry Kane':'ENG','Mohamed Salah':'EG','Vinícius Jr.':'BR','Lamine Yamal':'ES','Ousmane Dembélé':'FR','Raphinha':'BR','Lautaro Martínez':'AR','Cole Palmer':'ENG','Jude Bellingham':'ENG','Robert Lewandowski':'PL','Alexander Isak':'SE','Viktor Gyökeres':'SE','Michael Olise':'FR','Julián Álvarez':'AR','Victor Osimhen':'NG'};
function rivalNoise(span=6){return rnd(-span,span);}
function titlePrestige(name=''){
  if(/Copa do Mundo|FIFA World Cup/i.test(name))return 72;
  if(/UEFA Champions League/i.test(name))return 56;
  if(/CONMEBOL Libertadores/i.test(name))return 50;
  if(/FIFA Club World Cup|Mundial/i.test(name))return 28;
  if(/UEFA Europa League|Sul-Americana/i.test(name))return 30;
  if(/UEFA Conference League/i.test(name))return 20;
  if(/Premier League|LaLiga|Bundesliga|Serie A|Ligue 1/i.test(name))return 30;
  if(/Primeira Liga|Eredivisie|Belgian Pro League|Süper Lig|Scottish Premiership/i.test(name))return 25;
  if(/Brasileir|Liga Profesional|Primera División|Categoría Primera A|Liga MX|Major League Soccer|Saudi Pro League|J1 League/i.test(name))return 24;
  if(/Copa|Cup|Pokal|Beker|Taça|Coppa|Coupe/i.test(name))return 14;
  return 10;
}
function seasonTitleNames(){const p=state.player,s=state.season,start=s?.startTrophyCount||0;return (p?.trophies||[]).slice(start).map(t=>t.name);}
function titleScoreFor(names=[]){return clamp(names.reduce((sum,n)=>sum+titlePrestige(n),0),0,100);}
function simulateRivalTitles(r){
  const rule=getCompetitionRule(r.countryCode,countryByCode(r.countryCode)?.name||'');const titles=[];
  const leagueChance=clamp((r.teamPower-80)/28,.12,.68),cupChance=clamp((r.teamPower-80)/45,.08,.35),uclChance=clamp((r.teamPower-86)/35,.04,.30);
  if(Math.random()<leagueChance)titles.push(rule.league);
  if(Math.random()<cupChance)titles.push(rule.cup);
  if(Math.random()<uclChance)titles.push('UEFA Champions League');
  return titles;
}
function simulateRivalSeason(r){
  const factor=goldenShoeFactor(r.countryCode);const leagueGoals=clamp(r.goalBase+rivalNoise(7),8,46),leagueAssists=clamp(r.assistBase+rivalNoise(5),1,24);
  const allGoals=clamp(leagueGoals+rnd(2,11),leagueGoals,60),allAssists=clamp(leagueAssists+rnd(1,6),leagueAssists,30);
  const avg=clamp(7.15+(r.rating-88)*.08+allGoals*.011+allAssists*.007+(Math.random()-.5)*.34,6.8,9.35);
  const minutes=clamp(Math.round((getLeagueFormat(r.countryCode)?.matches||34)*rnd(70,88)),1900,3400);const titles=simulateRivalTitles(r);
  return {...r,nationalCode:RIVAL_NATIONAL_CODES[r.name]||'',goals:leagueGoals,assists:leagueAssists,allGoals,allAssists,avg,minutes,titles,goldenPoints:Number((leagueGoals*factor).toFixed(1)),titleScore:titleScoreFor(titles),fairPlay:rnd(82,99)};
}
// One authoritative rival record per year. Leaderboards, Golden Shoe and ceremonies
// must read the exact same league goal total, never independent random samples.
function ensureSeasonRivalRecords(s=state.season){
  if(!s)return [];
  if(!Array.isArray(s.rivalSeasonRecords)||s.rivalSeasonYear!==s.year){
    const world=typeof ensureWorldPlayers==='function'?ensureWorldPlayers():[];
    const priorRace=s.awardRaceResults?.goldenShoe;
    const historic=new Map([...(priorRace?.top||[]),...(priorRace?.winner?[priorRace.winner]:[])].filter(x=>!x.isUser).map(x=>[normalizeKey(x.name),x]));
    s.rivalSeasonRecords=WORLD_AWARD_RIVALS.map(r=>{
      const athlete=world.find(w=>normalizeKey(w.name)===normalizeKey(r.name)&&!w.retired);
      const old=historic.get(normalizeKey(r.name));
      const code=athlete?.countryCode||old?.countryCode||r.countryCode;
      const generated=simulateRivalSeason({...r,countryCode:code});
      // Restore goal totals awarded on older saves, so rankings never contradict a trophy.
      if(old){generated.goals=old.goals;generated.assists=old.assists;generated.goldenPoints=old.goldenPoints;}
      return {...generated,club:athlete?.club||old?.club||'',seasonYear:s.year};
    });
    s.rivalSeasonYear=s.year;
  }
  return s.rivalSeasonRecords;
}
function authoritativeRivalStats(player,s=state.season){
  if(!s||!player)return null;
  return ensureSeasonRivalRecords(s).find(r=>normalizeKey(r.name)===normalizeKey(player.name)&&
    r.countryCode===player.countryCode&&(!r.club||normalizeKey(r.club)===normalizeKey(player.club)))||null;
}
function ballonIndividualScore({avg,goals,assists,rating}){
  const ratingPart=clamp((avg-6.6)*27,0,70);const outputPart=clamp(goals*.72+assists*.48,0,42);const qualityPart=clamp((rating-84)*1.4,0,16);
  return clamp(ratingPart+outputPart+qualityPart,0,100);
}
function ballonScore(candidate){
  // France Football hierarchy: individual impact first, team achievements second,
  // class/fair play third. The simulator converts that hierarchy into 52/40/8.
  const individual=ballonIndividualScore(candidate);return Number((individual*.52+(candidate.titleScore||0)*.40+(candidate.fairPlay||90)*.08).toFixed(2));
}
function majorEuropeanClubContext(p=state.player,s=state.season){
  if(!p||!s||!isEuropeanCountryCode(s.countryAtStart))return {eligible:false,strength:0,club:''};
  const club=s.clubAtStart||p.club,profile=findClubDataAny(club)||{},strength=profile.strength||clubStrength(club,s.countryAtStart);
  const topFlight=(profile.divisionLevel||p.clubDivisionLevel||1)===1;
  return {eligible:topFlight&&strength>=85,strength,club};
}
function buildAwardRaceResults(avg){
  const p=state.player,s=state.season;const rivals=ensureSeasonRivalRecords(s).filter(r=>normalizeKey(r.name)!==normalizeKey(p.name));const seasonTitles=seasonTitleNames();
  const awardClub=majorEuropeanClubContext(p,s),wonChampions=seasonTitles.some(n=>/UEFA Champions League/i.test(n)),wonWorldCup=seasonTitles.some(n=>/FIFA World Cup|Copa do Mundo/i.test(n));
  if(wonWorldCup)rivals.filter(r=>r.nationalCode===p.nationalityCode).forEach(r=>{if(!r.titles.includes('FIFA World Cup'))r.titles.push('FIFA World Cup');r.titleScore=titleScoreFor(r.titles);});
  const roleState=ensureClubRoleState(p),establishedForMajorAwards=wonWorldCup||((p.overall||68)>=83&&(s.clubGames||0)>=22&&((roleState.trust||35)>=58||currentCareerSeasonNumber()>3));
  const userLeagueGoals=s.leagueGoals||0,userLeagueAssists=s.leagueAssists||0,userLeagueGames=s.leagueGames||s.league?.index||0;
  const userFactor=goldenShoeFactor(s.countryAtStart);const user={name:p.name,isUser:true,countryCode:s.countryAtStart,nationalCode:p.nationalityCode,rating:p.overall,goals:userLeagueGoals,assists:userLeagueAssists,avg,minutes:Math.max(1,userLeagueGames)*82,titles:seasonTitles,titleScore:titleScoreFor(seasonTitles),fairPlay:clamp(Math.round(78+(p.morale||70)*.12+(p.reputation||10)*.08),70,100),majorEuropeanClub:awardClub.eligible,wonChampions};
  user.goldenPoints=Number((user.goals*userFactor).toFixed(1));
  const goldenCandidates=userFactor?[user,...rivals.filter(r=>goldenShoeFactor(r.countryCode)>0)]:[];
  goldenCandidates.sort((a,b)=>b.goldenPoints-a.goldenPoints||a.minutes-b.minutes||b.assists-a.assists);
  const goldenUserRank=userFactor?goldenCandidates.findIndex(x=>x.isUser)+1:null;const goldenWinner=goldenCandidates[0]||null;
  const ballonCandidates=[{...user,goals:s.goals||s.clubGoals||0,assists:s.assists||s.clubAssists||0},...rivals.map(r=>({...r,goals:r.allGoals,assists:r.allAssists}))];
  ballonCandidates.forEach(c=>{
    let score=ballonScore(c);
    if(c.isUser){
      // Para manter a premiação coerente com a elite real, um atleta fora de um
      // grande clube europeu sofre uma desvantagem relevante. Ganhar a Champions
      // é um forte diferencial; sem ela ainda é possível vencer, mas exige uma
      // temporada individual/coletiva excepcional.
      if(wonWorldCup)score+=34;
      else if(!awardClub.eligible||!establishedForMajorAwards)score=Math.min(score-28,38);
      else if(wonChampions)score+=10;
      else score-=4;
    }
    c.ballonPoints=Number(clamp(score,0,120).toFixed(2));
  });
  const userBallon=ballonCandidates.find(x=>x.isUser);
  if(wonWorldCup&&userBallon){
    if(wonChampions){userBallon.ballonPoints=120;ballonCandidates.filter(x=>!x.isUser).forEach(x=>{x.ballonPoints=Math.min(x.ballonPoints,119);});}
    else ballonCandidates.filter(x=>!x.isUser&&x.nationalCode!==p.nationalityCode).forEach(x=>{x.ballonPoints=Math.min(x.ballonPoints,userBallon.ballonPoints-.75);});
  }
  ballonCandidates.sort((a,b)=>b.ballonPoints-a.ballonPoints||b.titleScore-a.titleScore||(b.goals+b.assists)-(a.goals+a.assists));
  const ballonUserRank=ballonCandidates.findIndex(x=>x.isUser)+1;const ballonWinner=ballonCandidates[0];
  return {
    ceremonyEligible:(awardClub.eligible&&establishedForMajorAwards)||wonWorldCup,
    wonChampions,wonWorldCup,
    goldenShoe:userFactor?{name:'Chuteira de Ouro',winner:goldenWinner,userRank:goldenUserRank,user:user,top:goldenCandidates.slice(0,5),ceremonyEligible:awardClub.eligible&&establishedForMajorAwards}:null,
    ballonDor:{name:'Bola de Ouro',winner:ballonWinner,userRank:ballonUserRank,user:{...ballonCandidates.find(x=>x.isUser)},top:ballonCandidates.slice(0,8),ceremonyEligible:(awardClub.eligible&&establishedForMajorAwards)||wonWorldCup,wonChampions,wonWorldCup}
  };
}
function awardCeremonyEntry(race){
  if(!race?.winner)return null;const winner=race.winner,user=race.user,isUserWinner=!!winner.isUser;
  if(/Chuteira de Ouro/i.test(race.name)){
    return {name:race.name,winner:winner.name,isUserWinner,userRank:race.userRank,stats:[`${winner.goals} gols de liga`,`coef. ${goldenShoeFactor(winner.countryCode).toFixed(1)}`,`${winner.goldenPoints} pontos`],copy:isUserWinner?`Você liderou a corrida com ${winner.goals} gols de liga e ${winner.goldenPoints} pontos.`:`${winner.name} venceu com ${winner.goals} gols de liga (${winner.goldenPoints} pontos). Você terminou em ${race.userRank}º com ${user.goals} gols e ${user.goldenPoints} pontos.`};
  }
  return {name:race.name,winner:winner.name,isUserWinner,userRank:race.userRank,stats:[`${winner.goals} gols`,`${winner.assists} assist.`,`${winner.titles.length} título(s)`,`nota ${winner.avg.toFixed(2)}`],copy:isUserWinner?`Seu impacto individual e os resultados coletivos colocaram você no topo da votação simulada.`:`${winner.name} terminou à frente na avaliação de desempenho individual, títulos e fair play. Você ficou em ${race.userRank}º.`};
}
function evaluateAwards(avg){
  const p=state.player,s=state.season;const awards=[];const seasonCountry=s?.countryAtStart;const europe=isEuropeanCountryCode(seasonCountry);
  if(europe&&p.age<=21&&avg>=7.4&&s.clubGames>=18)awards.push('Melhor Jogador Jovem');
  if(europe&&avg>=7.45&&s.clubGames>=18)awards.push('Time da Temporada');

  const races=buildAwardRaceResults(avg);s.awardRaceResults=races;s.specialAwardCeremonies=[];
  const golden=races.goldenShoe;
  if(golden){
    if(golden.userRank===1&&golden.ceremonyEligible)awards.push('Chuteira de Ouro');
    if(golden.ceremonyEligible&&golden.userRank<=5&&golden.user.goals>=8){const entry=awardCeremonyEntry(golden);if(entry)s.specialAwardCeremonies.push(entry);}
    const gw=golden.winner;state.news.push(golden.userRank===1?`${p.name} venceu a Chuteira de Ouro com ${golden.user.goals} gols de liga e ${golden.user.goldenPoints} pontos.`:`${gw.name} venceu a Chuteira de Ouro com ${gw.goals} gols de liga; ${p.name} ficou em ${golden.userRank}º.`);
  }
  const ballon=races.ballonDor;
  if(ballon.userRank===1&&ballon.ceremonyEligible)awards.push('Bola de Ouro');
  if(ballon.ceremonyEligible&&ballon.userRank<=8&&(avg>=7.15||(s.goals+s.assists)>=18||seasonTitleNames().length)){const entry=awardCeremonyEntry(ballon);if(entry)s.specialAwardCeremonies.push(entry);}
  if(ballon.userRank===1&&ballon.ceremonyEligible)state.news.push(`${p.name} venceu a Bola de Ouro após liderar a avaliação da temporada.`);
  else state.news.push(`${ballon.winner.name} venceu a Bola de Ouro; ${p.name} terminou em ${ballon.userRank}º na votação simulada.`);

  p.awards=p.awards||[];awards.forEach(name=>{if(!p.awards.some(a=>a.year===s.year&&a.name===name))p.awards.push({year:s.year,name,countryCode:seasonCountry,club:s.clubAtStart||p.club});});
  const ordinary=awards.filter(a=>!/Bola de Ouro|Chuteira de Ouro/i.test(a));if(ordinary.length)state.news.push(`${p.name} recebeu: ${ordinary.join(', ')}.`);
  if(!state.simulatingSeason){queueSpecialAwardCeremonies(s.specialAwardCeremonies||[],()=>{if(awards.length)showSeasonHonoursGallery([],awards);});}
  return awards;
}
function sanitizeAwardsEligibility(){
  if(!state.created||!state.player)return;const p=state.player;let changed=false;
  p.awards=(p.awards||[]).filter(a=>{
    let code=a.countryCode;
    if(!code){const h=(state.history||[]).find(x=>x.year===a.year);code=h?.clubCountry||findClubDataAny(h?.club||'')?.countryCode||null;}
    const ok=/Bola de Ouro/i.test(a.name)||isEuropeanCountryCode(code);if(!ok)changed=true;else if(!a.countryCode&&code){a.countryCode=code;changed=true;}return ok;
  });
  if(changed)save();
}
function legacyV4_generateOffers(avg){
  const p=state.player;
  const tierTargets=TRANSFER_TARGETS.filter(c=>c.name!==p.club&&p.overall>=c.minOverall);
  let normal=allTransferClubs().filter(c=>c.name!==p.club&&c.strength<=p.overall+8&&c.strength>=Math.max(64,p.overall-10));
  if(!normal.length)normal=allTransferClubs().filter(c=>c.name!==p.club&&c.strength<=p.overall+12).sort((a,b)=>Math.abs(a.strength-p.overall)-Math.abs(b.strength-p.overall)).slice(0,12);
  let pool=[...tierTargets,...normal];pool=[...new Map(pool.map(c=>[`${c.countryCode}:${c.name}`,c])).values()];
  const baseCount=avg>=7.8?3:avg>=7.0?2:1;const count=clamp(baseCount+(p.marketBonus||0),1,4);p.marketBonus=0;
  const chosen=sample(pool,Math.min(count,pool.length));
  state.offers=chosen.map(c=>({club:c.name,countryCode:c.countryCode,countryName:countryByCode(c.countryCode)?.name||c.countryCode,league:getCompetitionRule(c.countryCode,countryByCode(c.countryCode)?.name||'').league,strength:c.strength||clubStrength(c.name,c.countryCode),minOverall:c.minOverall||null,value:marketValue(p.value*(1.05+Math.random()*.70))}));
  if(state.offers.length)state.news.push(`${p.name} recebeu ${state.offers.length} proposta(s) ao fim da temporada.`);
}

function pickFreshCareerEvent(pool){
  if(!pool?.length)return null;
  const p=state.player;const recent=p?.recentCareerEventIds||[];
  let available=pool.filter(e=>!recent.includes(e.id));
  if(!available.length)available=pool;
  const event=available[rnd(0,available.length-1)];
  if(p&&event){p.recentCareerEventIds=[...recent,event.id].slice(-6);}
  return event;
}

function pickFreshNationalEvent(worldCupOnly=false){
  const p=state.player,s=state.season,pool=(typeof NATIONAL_TEAM_EVENTS!=='undefined'?NATIONAL_TEAM_EVENTS:[]).filter(e=>worldCupOnly?!!e.worldCupOnly:(!e.worldCupOnly||isWorldCupYear(s?.year)));
  if(!pool.length)return null;const recent=p.recentNationalEventIds||[];let available=pool.filter(e=>!recent.includes(e.id));if(!available.length)available=pool;
  const event=available[rnd(0,available.length-1)];p.recentNationalEventIds=[...recent,event.id].slice(-6);return event;
}
function maybeTriggerNationalEvent(lastEvent){
  const p=state.player,s=state.season;if(!p?.calledUp||!s||state.pendingEvent||lastEvent?.type!=='national')return false;
  const wcState=lastEvent?.worldCup?ensureWorldCupState(s,p):null;if(lastEvent?.worldCup&&wcState?.finished)return false;const locked=!!lastEvent?.worldCup,gap=locked?1:2;if((s.nationalGamesPlayed||0)-(s.lastNationalEventAt||0)<gap)return false;
  if(Math.random()>((locked?.42:.26)*INTERACTION_FREQUENCY))return false;
  // Com a Copa em andamento, somente eventos explicitamente relacionados ao
  // torneio podem interromper a sequência de partidas da seleção.
  const event=pickFreshNationalEvent(locked);if(!event)return false;state.pendingEvent={...event,type:'national',worldCupContext:locked};s.lastNationalEventAt=s.nationalGamesPlayed||0;state.resumeSeasonAfterEvent=true;save();openPendingEvent();return true;
}
function sponsorOfferEvent(){
  const p=state.player,s=state.season;if(!p||!s)return null;const current=p.sponsor?.brand||null;
  const cStrength=p.clubStrength||clubStrength(p.club,p.clubCountry),rep=p.reputation||10;let pool=SPONSOR_BRANDS.filter(b=>b.name!==current&&(p.overall||68)>=b.minOverall&&cStrength>=b.minClubStrength&&rep>=b.minReputation);if(!pool.length)pool=SPONSOR_BRANDS.filter(b=>b.name!==current&&b.tier==='regional'&&(p.overall||68)>=b.minOverall);if(!pool.length)return null;
  const brand=pool[rnd(0,pool.length-1)],starPower=1+(p.overall-68)*.055+(p.reputation||10)*.018,annual=Math.max(180000,Math.round(brand.base*starPower));
  return {id:`sponsor_${normalizeKey(brand.name)}_${s.year}`,type:'sponsor',title:`Proposta de patrocínio · ${brand.name}`,description:`A ${brand.name} quer fechar um contrato pessoal com você. A oferta estimada é de ${money(annual)} por temporada, além de bônus por exposição e títulos.`,sponsorBrand:brand.name,sponsorTone:brand.tone,sponsorValue:annual,choices:[
    {label:`Assinar com ${brand.name}`,action:'sponsor_accept',effect:'contrato imediato; + reputação'},
    {label:'Negociar bônus maiores',action:'sponsor_negotiate',effect:'pode aumentar o valor ou fazer a marca recuar'},
    {label:'Recusar a proposta',action:'sponsor_decline',effect:'mantém liberdade para outra marca'}]};
}
function maybeTriggerSponsorEvent(){
  const p=state.player,s=state.season;if(!p||!s||state.pendingEvent||worldCupTournamentLockActive(s,p)||s.sponsorEventDone||s.clubGames<7)return false;
  const rep=p.reputation||10,ovr=p.overall||68,cStrength=p.clubStrength||clubStrength(p.club,p.clubCountry);const eligible=SPONSOR_BRANDS.some(b=>ovr>=b.minOverall&&cStrength>=b.minClubStrength&&rep>=b.minReputation);if(!eligible)return false;const chance=clamp((.018+(rep-10)*.0012+(ovr-72)*.0018)*INTERACTION_FREQUENCY,.017,.153);
  if(Math.random()>chance)return false;const event=sponsorOfferEvent();if(!event)return false;state.pendingEvent=event;s.sponsorEventDone=true;s.lastSponsorEventAt=s.clubGames;state.resumeSeasonAfterEvent=true;save();openPendingEvent();return true;
}
function idolInteractionEligible(p=state.player,s=state.season){
  if(!p?.idol||!s||p.retired||p.overall<84)return false;
  const strength=p.clubStrength||clubStrength(p.club,p.clubCountry),club=findClubDataAny(p.club||'');
  const tier=club?.marketTier||((strength>=88)?'elite':(strength>=83)?'upper':'global');
  return (p.clubDivisionLevel||club?.divisionLevel||1)===1 && (strength>=83||tier==='elite'||tier==='upper');
}
function idolInteractionEvent(){
  const p=state.player,s=state.season,idol=p?.idol;if(!p||!s||!idol||!idolInteractionEligible(p,s))return null;
  const templates=[
    {key:'video',title:`Sessão de vídeo com ${idol.name}`,description:`Seu ídolo ${idol.name} analisa seus últimos jogos e mostra detalhes de posicionamento ligados a ${idol.style}.`,choices:[{label:'Rever decisões no último terço',action:'idol_learn',effect:'+ desenvolvimento; leitura técnica'},{label:'Falar sobre confiança',action:'idol_confidence',effect:'+ moral; reduz pressão'}]},
    {key:'message',title:`Mensagem de ${idol.name}`,description:`Depois de uma sequência importante, ${idol.name} fala sobre expectativa, imprensa e responsabilidade em um clube grande.`,choices:[{label:'Seguir o conselho com humildade',action:'idol_humility',effect:'+ moral e reputação'},{label:'Usar como combustível competitivo',action:'idol_ambition',effect:'+ reputação; + pressão'}]},
    {key:'training',title:`Treino especial com ${idol.name}`,description:`Durante uma folga, você recebe a chance de treinar movimentos e tomadas de decisão inspiradas no auge de ${idol.name}.`,choices:[{label:'Focar no fundamento principal',action:'idol_train',effect:'+ desenvolvimento nesta temporada'},{label:'Focar em leitura de jogo',action:'idol_potential',effect:'chance de + POT'}]},
    {key:'career',title:`Conselho de carreira de ${idol.name}`,description:`Seu nome circula entre clubes de elite e ${idol.name} pergunta que tipo de legado você quer construir.`,choices:[{label:'Buscar novos desafios',action:'idol_market',effect:'+ interesse no mercado'},{label:'Construir legado no clube',action:'idol_stability',effect:'+ moral e estabilidade'}]},
    {key:'biggame',title:`${idol.name} prepara você para uma noite grande`,description:`Antes de uma partida de enorme pressão, ${idol.name} relembra como controlava a ansiedade quando todos esperavam uma atuação decisiva.`,choices:[{label:'Entrar para decidir',action:'idol_biggame',effect:'+ confiança e reputação'},{label:'Simplificar o jogo',action:'idol_confidence',effect:'+ moral; reduz pressão'}]},
    {key:'leadership',title:`Conversa sobre liderança com ${idol.name}`,description:`${idol.name} percebe que o elenco começa a olhar para você como referência e compartilha como liderar sem perder naturalidade.`,choices:[{label:'Assumir mais responsabilidade',action:'idol_leadership',effect:'+ reputação; + liderança'},{label:'Liderar pelo exemplo',action:'idol_humility',effect:'+ moral; + respeito'}]},
    {key:'media',title:`${idol.name} ajuda com a pressão externa`,description:`Uma semana de manchetes coloca você no centro das atenções. ${idol.name} oferece duas maneiras de lidar com o barulho fora de campo.`,choices:[{label:'Responder em campo',action:'idol_media_focus',effect:'- pressão; + preparação'},{label:'Dar uma resposta pública equilibrada',action:'idol_media_voice',effect:'+ reputação; + moral'}]},
    {key:'finishing',title:`Desafio técnico de ${idol.name}`,description:`${idol.name} envia um desafio específico para você repetir no treino e transformar um detalhe técnico em arma para os próximos jogos.`,choices:[{label:'Aceitar o desafio intensivo',action:'idol_train',effect:'+ desenvolvimento; + desgaste leve'},{label:'Adaptar ao seu estilo',action:'idol_learn',effect:'+ desenvolvimento; + confiança'}]},
    {key:'legacy',title:`${idol.name} fala sobre legado`,description:`Já consolidado em alto nível, você conversa com ${idol.name} sobre o que separa uma grande fase de uma carreira lembrada por décadas.`,choices:[{label:'Priorizar títulos coletivos',action:'idol_legacy_team',effect:'+ moral; foco em decisões grandes'},{label:'Buscar protagonismo histórico',action:'idol_ambition',effect:'+ reputação; + pressão'}]}
  ];
  if((p.injuryGames||0)>0)templates.push({key:'recovery',title:`${idol.name} acompanha sua recuperação`,description:`Durante a recuperação, ${idol.name} conta como lidava com pausas forçadas e reforça que voltar cedo demais pode custar caro.`,choices:[{label:'Respeitar cada etapa',action:'idol_recovery',effect:'pode reduzir a recuperação; + moral'},{label:'Voltar no limite',action:'idol_fast_return',effect:'recupera mais rápido; + risco físico'}]});
  if(p.calledUp)templates.push({key:'national',title:`${idol.name} fala sobre a seleção`,description:`Às vésperas de uma Data FIFA, ${idol.name} compartilha como lidava com o peso de representar seu país.`,choices:[{label:'Assumir responsabilidade',action:'idol_national',effect:'+ confiança na seleção; + reputação'},{label:'Proteger o grupo da pressão',action:'idol_group',effect:'+ moral; reduz pressão'}]});
  if(isWorldCupYear(s.year)&&p.calledUp)templates.push({key:'wc',title:`Ligação de ${idol.name} antes da Copa`,description:`Com a Copa do Mundo em foco, ${idol.name} fala sobre os jogos que definem carreiras e sobre como não deixar o torneio virar peso.`,choices:[{label:'Pedir conselho para jogos grandes',action:'idol_wc',effect:'+ confiança na seleção e preparação'},{label:'Manter a cabeça leve',action:'idol_confidence',effect:'+ moral; reduz pressão'}]});
  const recent=s.recentIdolTemplateKeys||[];let pool=templates.filter(x=>!recent.includes(x.key));if(!pool.length)pool=templates;
  const pick=pool[rnd(0,pool.length-1)];s.recentIdolTemplateKeys=[...recent,pick.key].slice(-5);
  return {id:`idol_${idol.id}_${pick.key}_${s.year}_${s.idolInteractionCount||0}`,type:'idol',idolName:idol.name,title:pick.title,description:pick.description,choices:pick.choices};
}
function maybeTriggerIdolInteraction(){
  const p=state.player,s=state.season;if(!idolInteractionEligible(p,s)||state.pendingEvent||worldCupTournamentLockActive(s,p)||(s.idolInteractionCount||0)>=3)return false;
  if(s.totalGames-(s.lastIdolInteractionAt||-20)<6)return false;const chance=((s.idolInteractionCount||0)===0?.18:(s.idolInteractionCount||0)===1?.11:.07)*INTERACTION_FREQUENCY;if(Math.random()>chance)return false;
  const event=idolInteractionEvent();if(!event)return false;state.pendingEvent=event;s.idolInteractionCount=(s.idolInteractionCount||0)+1;s.lastIdolInteractionAt=s.totalGames;state.resumeSeasonAfterEvent=true;save();openPendingEvent();return true;
}
function maybeTriggerCareerEvent(){
  const s=state.season;
  if(!s||state.pendingEvent||worldCupTournamentLockActive(s,state.player)||s.totalGames-(s.lastCareerEventAt||0)<5||Math.random()>(.19*INTERACTION_FREQUENCY*CAREER_EVENT_FREQUENCY_MULT))return false;
  const incidentPool=[...(typeof INCIDENT_EVENTS!=='undefined'?INCIDENT_EVENTS:[]),...BTL_PREMIUM_RANDOM_EVENTS];
  const iconEligible=(state.player?.overall||0)>=90||(state.player?.reputation||0)>=70;
  const chance=Math.random();
  const pool=iconEligible&&chance<.13?BTL_ICON_EVENTS:chance<.55?incidentPool:[...CAREER_EVENTS,...BTL_PREMIUM_CAREER_EVENTS];
  const event=pickFreshCareerEvent(pool);if(!event)return false;
  state.pendingEvent={...event};s.lastCareerEventAt=s.totalGames;state.resumeSeasonAfterEvent=true;save();openPendingEvent();return true;
}
function eventChoiceIcon(action=''){if(/train|learn|video|specialist|adapt/i.test(action))return '↗';if(/recover|rest|rehab|illness|travel/i.test(action))return '✚';if(/market|agent|contract|sponsor/i.test(action))return '€';if(/lead|ambitious|captain|derby|mentor|charity/i.test(action))return '★';if(/controversy|public|confront|fire|leak/i.test(action))return '!';if(/peace|humble|stability|stay|safe|share/i.test(action))return '●';return '◆';}
const EVENT_SCENE_LIBRARY={
  academy_reunion:{scene:'academy',theme:'locker',icon:'★',label:'BASE · O PRIMEIRO CAPÍTULO',props:['academy-bench','ball','clipboard']},
  captain_vacancy:{scene:'captain',theme:'locker',icon:'✦',label:'VESTIÁRIO · LIDERANÇA',props:['captain-band','lockers','tactics-board']},
  scouting_notebook:{scene:'scout',theme:'office',icon:'⌁',label:'BASTIDORES · OBSERVAÇÃO',props:['clipboard','phone','papers']},
  derby_choreo:{scene:'ultras',theme:'night-pitch',icon:'⚑',label:'ARQUIBANCADA · CLÁSSICO',props:['floodlights','fans','banner']},
  weather_blackout:{scene:'blackout',theme:'night-pitch',icon:'ϟ',label:'CT · IMPREVISTO',props:['floodlights','cones','ball']},
  icon_mentor_visit:{scene:'hall',theme:'museum',icon:'★',label:'HALL DA FAMA · LENDAS',props:['trophy-case','statue','plaque']},
  icon_legacy_project:{scene:'legacy',theme:'museum',icon:'♛',label:'MUSEU · LEGADO',props:['trophy-case','plaque','statue']},
  icon_hall_invite:{scene:'awards',theme:'museum',icon:'✧',label:'HISTÓRIA · RECONHECIMENTO',props:['trophy-case','statue','plaque']},
  minor_injury:{scene:'minor-injury',theme:'medical',icon:'✚',label:'DM · MACA DE FISIOTERAPIA',props:['physio-table','monitor','ice-pack']},
  controversy:{scene:'controversy',theme:'social',icon:'@',label:'REDES · REPERCUSSÃO',props:['phone','comments','camera-flash']},
  locker_room:{scene:'locker-room',theme:'locker',icon:'◇',label:'VESTIÁRIO · PÓS-JOGO',props:['lockers','bench','jersey']},
  nightlife:{scene:'nightlife',theme:'city',icon:'✦',label:'CIDADE · FORA DE CAMPO',props:['skyline','velvet-rope','camera-flash']},
  agent_tension:{scene:'agent-tension',theme:'office',icon:'✎',label:'EMPRESÁRIO · ESCRITÓRIO',props:['desk','contract','phone']},
  minor_illness:{scene:'minor-illness',theme:'clinic',icon:'＋',label:'DM · CONSULTÓRIO',props:['medical-bed','thermometer','monitor']},
  transfer_leak:{scene:'transfer-leak',theme:'newsroom',icon:'▤',label:'IMPRENSA · VAZAMENTO',props:['newspaper','phone','camera']},
  derby_heat:{scene:'derby-heat',theme:'stadium',icon:'⚡',label:'CLÁSSICO · ARQUIBANCADA',props:['stand','banner','flare']},
  training_clash:{scene:'training-clash',theme:'pitch',icon:'!',label:'CT · TREINO INTENSO',props:['pitch-lines','two-players','whistle']},
  travel_delay:{scene:'travel-delay',theme:'airport',icon:'✈',label:'AEROPORTO · ATRASO',props:['terminal','plane','suitcase']},
  sponsor_pressure:{scene:'sponsor-pressure',theme:'studio',icon:'◆',label:'ESTÚDIO · CAMPANHA',props:['backdrop','softbox','boot']},
  fan_expectation:{scene:'fan-expectation',theme:'fans',icon:'★',label:'CT · TREINO ABERTO',props:['fence','fans','megaphone']},
  boot_issue:{scene:'boot-issue',theme:'bootroom',icon:'◇',label:'VESTIÁRIO · MATERIAL',props:['kit-bench','boot','kitbag']},
  training:{scene:'training',theme:'pitch',icon:'↗',label:'CT · CAMPO DE TREINO',props:['goal','cones','ball']},
  media:{scene:'media',theme:'press',icon:'●',label:'COLETIVA · IMPRENSA',props:['sponsor-wall','microphones','camera']},
  coach:{scene:'coach',theme:'tactics',icon:'⌗',label:'COMISSÃO · SALA TÁTICA',props:['tactics-board','desk','whistle']},
  agent:{scene:'agent',theme:'office',icon:'€',label:'EMPRESÁRIO · NEGOCIAÇÃO',props:['city-window','contract','suitcase']},
  fatigue:{scene:'fatigue',theme:'recovery',icon:'≈',label:'CT · RECUPERAÇÃO',props:['massage-table','ice-tub','clock']},
  set_piece_role:{scene:'set-piece-role',theme:'pitch',icon:'◎',label:'CT · BOLAS PARADAS',props:['goal','player-wall','ball']},
  mentor:{scene:'mentor',theme:'academy',icon:'★',label:'BASE · PÓS-TREINO',props:['academy-bench','two-players','clipboard']},
  documentary:{scene:'documentary',theme:'film',icon:'◫',label:'BASTIDORES · DOCUMENTÁRIO',props:['film-camera','boom-mic','clapboard']},
  tactical_role:{scene:'tactical-role',theme:'tactics',icon:'⌗',label:'CT · QUADRO TÁTICO',props:['tactics-board','magnets','projector']},
  captain_group:{scene:'captain-group',theme:'locker',icon:'★',label:'VESTIÁRIO · LIDERANÇAS',props:['lockers','round-table','captain-band']},
  specialist:{scene:'specialist',theme:'lab',icon:'◎',label:'CT · LABORATÓRIO TÉCNICO',props:['target','sensor','ball']},
  charity:{scene:'charity',theme:'community',icon:'♥',label:'COMUNIDADE · AÇÃO SOCIAL',props:['community-stage','heart-banner','fans']},
  video_review:{scene:'video-review',theme:'analysis',icon:'◉',label:'CT · ANÁLISE DE VÍDEO',props:['big-screen','timeline','chair']},
  contract_noise:{scene:'contract-noise',theme:'boardroom',icon:'✎',label:'CLUBE · RENOVAÇÃO',props:['board-table','contract','pen']},
  extra_recovery:{scene:'extra-recovery',theme:'lab',icon:'✚',label:'PERFORMANCE · TECNOLOGIA',props:['cryo','monitor','pulse']},
  tunnel_interview:{scene:'tunnel-interview',theme:'tunnel',icon:'●',label:'ESTÁDIO · TÚNEL',props:['tunnel','microphone','floodlights']},
  night_training:{scene:'night-training',theme:'night-pitch',icon:'↗',label:'ESTÁDIO · TREINO NOTURNO',props:['floodlights','goal','cones']},
  museum_invite:{scene:'museum-invite',theme:'museum',icon:'♜',label:'CLUBE · MUSEU',props:['trophy-case','statue','plaque']},
  deadline_phone:{scene:'deadline-phone',theme:'deadline',icon:'☎',label:'JANELA · ÚLTIMAS HORAS',props:['clock','phone','papers']},
  boot_lab:{scene:'boot-lab',theme:'lab',icon:'◇',label:'MATERIAL · LABORATÓRIO',props:['boot','scanner','design-board']},
  captain_camera:{scene:'captain-camera',theme:'locker-media',icon:'◫',label:'VESTIÁRIO · CÂMERAS',props:['lockers','film-camera','captain-band']},
  recovery_pool:{scene:'recovery-pool',theme:'pool',icon:'≈',label:'CT · PISCINA',props:['pool-water','lane-rope','towel']},
  charity_match:{scene:'charity-match',theme:'charity-match',icon:'♥',label:'ESTÁDIO · JOGO BENEFICENTE',props:['goal','heart-banner','crowd']},
  analyst_room:{scene:'analyst-room',theme:'analysis',icon:'◉',label:'CT · SALA DE ANALISTAS',props:['big-screen','heatmap','laptop']},
  nt_camp_intensity:{scene:'nt-camp-intensity',theme:'national-pitch',icon:'★',label:'SELEÇÃO · CENTRO DE TREINO',props:['flag','goal','cones']},
  nt_penalty_order:{scene:'nt-penalty-order',theme:'national-pitch',icon:'◎',label:'SELEÇÃO · PÊNALTIS',props:['goal','penalty-spots','clipboard']},
  nt_press_room:{scene:'nt-press-room',theme:'national-press',icon:'●',label:'SELEÇÃO · COLETIVA',props:['flag-wall','microphones','camera']},
  nt_tactical_role:{scene:'nt-tactical-role',theme:'national-tactics',icon:'⌗',label:'SELEÇÃO · SALA TÁTICA',props:['tactics-board','flag','projector']},
  nt_leadership:{scene:'nt-leadership',theme:'national-locker',icon:'★',label:'SELEÇÃO · LIDERANÇAS',props:['lockers','captain-band','flag']},
  nt_rivalry:{scene:'nt-rivalry',theme:'national-stadium',icon:'⚡',label:'SELEÇÃO · CLÁSSICO',props:['crowd','rival-banner','flare']},
  wc_arrival:{scene:'wc-arrival',theme:'worldcup-arrival',icon:'✈',label:'COPA · CHEGADA',props:['team-bus','flags','hotel']},
  wc_penalties:{scene:'wc-penalties',theme:'worldcup-pitch',icon:'◎',label:'COPA · TREINO DE PÊNALTIS',props:['goal','balls','flag']},
  wc_family:{scene:'wc-family',theme:'worldcup-lounge',icon:'♥',label:'COPA · VISITA DA FAMÍLIA',props:['sofa','photo-frame','flag']},
  wc_knockout:{scene:'wc-knockout',theme:'worldcup-analysis',icon:'◉',label:'COPA · VÉSPERA DE MATA-MATA',props:['bracket','big-screen','flag']},
  wc_captain_room:{scene:'wc-captain-room',theme:'worldcup-tunnel',icon:'★',label:'COPA · TÚNEL',props:['tunnel','captain-band','flag']}
};
function eventSceneMeta(e={}){
  if(e.type==='idol')return {scene:`idol-${normalizeKey(e.idolName||'mentor')}`,theme:'idol',icon:'★',label:`ÍDOLO · ${String(e.idolName||'MENTOR').toUpperCase()}`,props:['trophy-wall','video-screen','two-chairs']};
  if(e.type==='sponsor')return {scene:`sponsor-${normalizeKey(e.sponsorBrand||'brand')}`,theme:'sponsor-contract',icon:'◆',label:`${String(e.sponsorBrand||'PATROCINADOR').toUpperCase()} · CONTRATO`,props:['backdrop','contract','camera-flash']};
  return EVENT_SCENE_LIBRARY[e.id]||{scene:`career-${normalizeKey(e.id||e.title||'event')}`,theme:'career',icon:'◆',label:'CARREIRA · DECISÃO',props:['city-window','desk','papers']};
}
const EVENT_PROP_GLYPHS={
  'physio-table':'▰','monitor':'▣','ice-pack':'❄','phone':'▯','comments':'≡','camera-flash':'✦','lockers':'▥','bench':'▔','jersey':'♙',
  'skyline':'▥','velvet-rope':'⌁','desk':'▰','contract':'▤','medical-bed':'▰','thermometer':'♨','newspaper':'▤','camera':'◉','stand':'▤','banner':'▰','flare':'✹',
  'pitch-lines':'╋','two-players':'♟♟','whistle':'◁','terminal':'▥','plane':'✈','suitcase':'▣','backdrop':'▦','softbox':'◫','boot':'◢','fence':'╫','fans':'♟♟♟','megaphone':'◁',
  'kit-bench':'▔','kitbag':'▣','goal':'⌑','cones':'▲','ball':'●','sponsor-wall':'▦','microphones':'♬','tactics-board':'⌗','city-window':'▥','massage-table':'▰','ice-tub':'▱','clock':'◷',
  'player-wall':'♟♟♟','academy-bench':'▔','clipboard':'▤','film-camera':'◉','boom-mic':'⌁','clapboard':'▥','magnets':'●●','projector':'◫','round-table':'◯','captain-band':'▰',
  'target':'◎','sensor':'◉','community-stage':'▱','heart-banner':'♥','big-screen':'▣','timeline':'━','chair':'▱','board-table':'▰','pen':'╱','cryo':'⬡','pulse':'⌁','microphone':'♩',
  'floodlights':'✦✦','trophy-case':'♜','statue':'♟','plaque':'▤','papers':'▤','scanner':'◫','design-board':'◇','pool-water':'≈','lane-rope':'━','towel':'▱','crowd':'♟♟♟♟',
  'heatmap':'▦','laptop':'▣','flag':'⚑','penalty-spots':'••','flag-wall':'⚑⚑','rival-banner':'▰','team-bus':'▰','flags':'⚑⚑⚑','hotel':'▥','balls':'●●●','sofa':'▱','photo-frame':'▣',
  'bracket':'⌗','tunnel':'⌂'
};
function eventObjectMarkup(token,index){
  const glyph=EVENT_PROP_GLYPHS[token]||'◆';
  return `<span class="scene-object obj-${token} obj-index-${index}" data-prop="${esc(token)}" aria-hidden="true"><span class="scene-object-glyph">${glyph}</span><i></i><b></b><em></em></span>`;
}
const SPONSOR_LOGO_URLS={nike:'https://cdn.simpleicons.org/nike/ffffff',adidas:'https://cdn.simpleicons.org/adidas/ffffff',puma:'https://cdn.simpleicons.org/puma/ffffff','new-balance':'https://cdn.simpleicons.org/newbalance/ffffff','under-armour':'https://cdn.simpleicons.org/underarmour/ffffff',mizuno:'https://cdn.simpleicons.org/mizuno/ffffff',umbro:'https://cdn.simpleicons.org/umbro/ffffff'};
function sponsorWordmark(brand=''){const safe=esc(String(brand||'MARCA').toUpperCase()),key=normalizeKey(brand),src=SPONSOR_LOGO_URLS[key];if(!src)return `<span class="sponsor-transparent-logo sponsor-logo-${key}" aria-label="${safe}">${safe}</span>`;return `<span class="sponsor-transparent-logo sponsor-logo-${key}" aria-label="${safe}"><img src="${src}" alt="${safe}" referrerpolicy="no-referrer" onerror="const p=this.parentElement;this.remove();if(p){p.classList.add('logo-fallback');p.append(document.createTextNode('${safe.replace("'","\'")}'));}"></span>`;}
function eventSceneMarkup(e){
  const m=eventSceneMeta(e),kind=e.type==='icon'?'icon':e.type==='random'?'random':e.type==='idol'?'icon':e.type==='national'?'career':e.type==='sponsor'?'career':'career';
  const key=String(e.id||e.title||'evento'),n=clubThemeHash(key),number=String((n%97)+1).padStart(2,'0');
  const title=esc(e.title||'Novo capítulo');
  const category=kind==='icon'?'LEGENDARY MOMENT':kind==='random'?'BREAKING / EXCLUSIVO':'BE THE LEGEND / BASTIDORES';
  const glyph=kind==='icon'?'★':kind==='random'?'⚡':'✦';
  const motion=['dribble','celebrate','interview','warmup','signature'][n%5];
  const gesture={dribble:'⚽',celebrate:'★',interview:'🎙',warmup:'⚡',signature:'✍'}[motion];
  const playerScene=`<div class="btl-event-player btl-player-${motion}" aria-hidden="true"><span class="btl-event-glow"></span><div class="btl-event-player-portrait">${appearanceMarkup(state.player?.appearance||DEFAULT_APPEARANCE,true,state.player?.number||10)}</div><span class="btl-event-motion-prop">${gesture}</span><span class="btl-event-player-label">${esc((state.player?.name||'SUA LENDA').split(' ')[0])}</span></div>`;
  if(kind==='icon')return `<div class="career-event-scene btl-event-stage btl-icon-stage" data-event-kind="icon"><div class="btl-icon-sparks">✦ &nbsp; ★ &nbsp; ✦</div><div class="btl-icon-card"><span class="btl-icon-number">ICON ${number}</span><div class="btl-icon-medallion"><span>★</span></div><strong>${title}</strong><small>UM ENCONTRO QUE MARCA A HISTÓRIA</small></div><div class="btl-icon-caption">${category} <span>◆ ◆ ◆</span></div>${playerScene}</div>`;
  if(kind==='random')return `<div class="career-event-scene btl-event-stage btl-random-stage" data-event-kind="random"><div class="btl-random-marquee"><span>● AO VIVO</span><span>ÚLTIMA HORA</span><span>BTL / ${number}</span></div><div class="btl-random-screen"><div class="btl-random-glyph">${glyph}</div><div><small>FORA DO ROTEIRO</small><strong>${title}</strong><em>NEM TUDO ACONTECE DENTRO DE CAMPO.</em></div></div><div class="btl-random-ticker"><span>FLASH • DESTAQUE • FLASH • DESTAQUE • </span></div>${playerScene}</div>`;
  return `<div class="career-event-scene btl-event-stage btl-career-stage" data-event-kind="career"><div class="btl-career-film"><span>BTL // ${number}</span><span>● REC</span></div><div class="btl-career-story"><div class="btl-career-emblem">${glyph}</div><div><small>${category}</small><strong>${title}</strong><span>UM CAPÍTULO DA SUA TRAJETÓRIA</span></div></div><div class="btl-career-progress"><i></i><i></i><i></i><i></i><i></i><b>YOUR STORY / ${state.season?.year||2026}</b></div>${playerScene}</div>`;
}

function playCareerEventResolution(e,message){
  const scene=$('#event-modal .career-event-scene');if(!scene)return;scene.classList.add('resolved');const badge=document.createElement('div');badge.className='scene-result-badge';badge.innerHTML=`<b>✓</b><span>${message}</span>`;scene.appendChild(badge);
}
function syncPausedOverlayButton(){const btn=$('#resume-career-overlay');if(!btn)return;const paused=pausedCareerOverlay||state.journeyPaused||null;const seasonCard=$('.season-card');if(seasonCard&&btn.parentElement!==seasonCard){const anchor=seasonCard.querySelector('.section-title');anchor?.insertAdjacentElement('afterend',btn);}btn.classList.toggle('hidden',!paused);btn.textContent=paused?'Retomar jornada ▶':'Retomar jornada ▶';}
function pauseCareerOverlay(kind){
  pausedCareerOverlay=kind;state.journeyPaused=kind;state.simulatingSeason=false;save();
  $('#match-decision-modal')?.classList.add('hidden');$('#event-modal')?.classList.add('hidden');
  applyClubTheme(state.player?.club);syncPausedOverlayButton();showView('career');toast('Jornada pausada. As interações só voltarão quando você clicar em “Retomar jornada”.');
}
function resumePausedCareerOverlay(){
  const kind=pausedCareerOverlay||state.journeyPaused;if(!kind)return;pausedCareerOverlay=null;state.journeyPaused=null;save();syncPausedOverlayButton();showView('career');
  if(kind==='decision'&&(state.pendingMatchDecision||state.pendingPenaltyShootout)){if(state.pendingPenaltyShootout)openPenaltyShootoutDecision();else $('#match-decision-modal')?.classList.remove('hidden');}
  else if(kind==='event'&&state.pendingEvent)openPendingEvent();
}
function openPendingEvent(){
  if(pausedCareerOverlay||state.journeyPaused)return;const e=state.pendingEvent;if(!e)return;const activeComp=e.competition||nextEventCache?.competition||state.season?.league?.name||state.player?.clubLeague||'';applyCompetitionExperienceTheme({competition:activeComp,countryCode:state.season?.countryAtStart||state.player?.clubCountry});const modal=$('#event-modal');
  modal.classList.toggle('sponsor-event-active',e.type==='sponsor');modal.classList.toggle('national-event-active',e.type==='national');modal.classList.toggle('idol-event-active',e.type==='idol');modal.classList.toggle('career-event-active',!['sponsor','national','idol','icon','random'].includes(e.type));modal.classList.toggle('icon-event-active',e.type==='icon');modal.classList.toggle('random-event-active',e.type==='random');
  const card=modal.querySelector('.career-event-card');if(card){[...card.classList].filter(c=>c.startsWith('event-kind-')||c.startsWith('event-scene-card-')).forEach(c=>card.classList.remove(c));card.classList.add(`event-kind-${e.type||'career'}`,`event-scene-card-${normalizeKey(e.id||e.title||'event')}`);applyDecisionCompetitionTheme(card,{...e,competition:activeComp,type:e.type==='national'?'national':'league'});}
  const eyebrow=$('#event-eyebrow');const eyebrowLabel=e.type==='national'?'SELEÇÃO':e.type==='idol'?'ÍDOLO':e.type==='sponsor'?'PATROCÍNIO':e.type==='icon'?'LENDAS':e.type==='random'?'EXTRA':'EVENTO';if(eyebrow)eyebrow.innerHTML=competitionHeaderMarkup(activeComp||eyebrowLabel,e.stage||'');$('#event-title').textContent=e.title;$('#event-description').textContent='';
  $('#event-choices').innerHTML=`<div class="btl-story-topline"><span>◆ ${e.type==='icon'?'ARQUIVO DE LENDAS':e.type==='random'?'TRANSMISSÃO URGENTE':'DIÁRIO DE CARREIRA'}</span><span>EDIÇÃO ${String(state.season?.year||'2026')}</span></div>`+eventSceneMarkup(e)+(e.type==='sponsor'?`<div class="sponsor-brand-banner ${e.sponsorTone||''}">${sponsorWordmark(e.sponsorBrand)}<span>PARCERIA</span><strong>${e.sponsorBrand||'Marca esportiva'}</strong><small>${money(e.sponsorValue||0)} / temporada</small></div>`:'')+`<div class="btl-choice-label">DECISÃO <span>Escolha seu próximo passo</span></div><div class="event-choice-grid">${e.choices.map((c,i)=>`<button class="event-choice visual-event-choice" data-choice="${i}"><span class="event-choice-glyph">${eventChoiceIcon(c.action)}</span><span class="event-choice-content"><strong>${c.label}</strong><small>${c.effect}</small></span><span class="event-choice-arrow">↗</span></button>`).join('')}</div>`;
  $$('#event-choices .event-choice').forEach(b=>b.addEventListener('click',()=>resolveCareerEvent(+b.dataset.choice)));modal.classList.remove('hidden');
}
function resolveCareerEvent(index){
  const e=state.pendingEvent;if(!e)return;const action=e.choices[index].action,p=state.player;let message='Decisão registrada.';
  if(action==='train_hard'){if(Math.random()<.7){p.developmentBoost=(p.developmentBoost||0)+1;message='O treino extra pode acelerar sua evolução nesta temporada.';}else{p.morale=clamp(p.morale-5,40,100);message='O treino pesou no físico e afetou seu moral.';}}
  if(action==='recover'){p.morale=clamp(p.morale+6,40,100);message='Você se sente mais recuperado para a sequência.';}
  if(action==='ambitious'){p.reputation+=4;p.pressure=(p.pressure||0)+1;message='Sua ambição repercutiu e sua reputação aumentou.';}
  if(action==='humble'){p.morale=clamp(p.morale+3,40,100);message='A resposta tranquila agradou ao vestiário.';}
  if(action==='leadership'){p.reputation+=3;const seasonCap=currentSeasonOverallCap();if(p.overall<90&&Math.random()<.18&&p.overall<p.potential&&p.overall<seasonCap)p.overall++;else if(p.overall>=90)p.developmentBoost=Math.max(p.developmentBoost||0,1);message='Você assumiu mais responsabilidade no elenco.';}
  if(action==='learn'){if(p.age<=24)p.potential=clamp(p.potential+1,75,96);message='Você priorizou aprendizado e desenvolvimento.';}
  if(action==='market_push'){p.marketBonus=(p.marketBonus||0)+1;message='Seu empresário vai trabalhar por mais opções no mercado.';}
  if(action==='stability'){p.morale=clamp(p.morale+5,40,100);message='A estabilidade melhorou seu ambiente no clube atual.';}
  if(action==='play_tired'){p.reputation+=2;p.morale=clamp(p.morale-4,40,100);message='Você mostrou disposição, mas sentiu o desgaste.';}
  if(action==='rest'){p.morale=clamp(p.morale+4,40,100);message='O descanso ajudou sua recuperação.';}
  if(action==='injury_rehab'){p.injuryGames=Math.max(p.injuryGames||0,rnd(2,4));p.morale=clamp(p.morale+1,40,100);message=`Você inicia tratamento e deve perder cerca de ${p.injuryGames} jogo(s).`;}
  if(action==='injury_rush'){p.injuryGames=Math.max(p.injuryGames||0,rnd(1,2));p.morale=clamp(p.morale-2,40,100);if(Math.random()<.28){p.injuryGames+=2;message='A volta foi apressada e o incômodo piorou. Você ficará mais tempo fora.';}else message='Você acelera o retorno e deve perder poucos jogos, mas assume algum risco.';}
  if(action==='controversy_apologize'){p.reputation=clamp((p.reputation||0)-1,0,100);p.morale=clamp(p.morale+2,40,100);p.pressure=Math.max(0,(p.pressure||0)-1);message='O esclarecimento reduz a pressão e o assunto perde força.';}
  if(action==='controversy_defend'){p.reputation=clamp((p.reputation||0)+2,0,100);p.pressure=(p.pressure||0)+2;p.morale=clamp(p.morale-2,40,100);message='Sua postura divide opiniões: sua personalidade cresce, mas a pressão também.';}
  if(action==='locker_peace'){p.morale=clamp(p.morale+5,40,100);message='A conversa interna melhora o ambiente do elenco.';}
  if(action==='locker_public'){p.reputation=clamp((p.reputation||0)+2,0,100);p.morale=clamp(p.morale-5,40,100);p.pressure=(p.pressure||0)+1;message='A resposta pública aumenta a repercussão e desgasta o vestiário.';}
  if(action==='rumor_focus'){p.morale=clamp(p.morale+2,40,100);p.pressure=Math.max(0,(p.pressure||0)-1);message='Você responde em campo e recupera a confiança do clube.';}
  if(action==='rumor_ignore'){p.morale=clamp(p.morale-rnd(2,5),40,100);p.pressure=(p.pressure||0)+1;message='O assunto continua rendendo e aumenta o desgaste fora de campo.';}
  if(action==='agent_open'){p.marketBonus=(p.marketBonus||0)+1;p.morale=clamp(p.morale-2,40,100);message='Seu nome passa a circular mais no mercado, mas o ambiente fica menos estável.';}
  if(action==='agent_stay'){p.morale=clamp(p.morale+4,40,100);p.pressure=Math.max(0,(p.pressure||0)-1);message='Você encerra as especulações e reforça o compromisso com o clube.';}
  if(action==='illness_rest'){p.injuryGames=Math.max(p.injuryGames||0,1);p.morale=clamp(p.morale+2,40,100);message='Você reduz a carga e recupera o corpo com segurança.';}
  if(action==='illness_push'){p.reputation=clamp((p.reputation||0)+1,0,100);if(Math.random()<.30){p.injuryGames=Math.max(p.injuryGames||0,2);message='A insistência piora o quadro e você perde alguns jogos.';}else{p.morale=clamp(p.morale-1,40,100);message='Você consegue treinar, mas sente o desgaste.';}}
  if(action==='leak_deny'){p.morale=clamp(p.morale+3,40,100);p.pressure=Math.max(0,(p.pressure||0)-1);message='O clube compra sua versão e o ambiente se acalma.';}
  if(action==='leak_feed'){p.marketBonus=(p.marketBonus||0)+1;p.reputation=clamp((p.reputation||0)+2,0,100);p.pressure=(p.pressure||0)+2;message='A especulação cresce e aumenta seu valor de mercado, junto da pressão.';}
  if(action==='derby_focus'){p.morale=clamp(p.morale+4,40,100);p.reputation=clamp((p.reputation||0)+2,0,100);message='Sua postura agrada à torcida e eleva a confiança para o clássico.';}
  if(action==='derby_fire'){p.reputation=clamp((p.reputation||0)+3,0,100);p.pressure=(p.pressure||0)+2;message='A rivalidade esquenta e todos esperam uma resposta em campo.';}
  if(action==='training_peace'){p.morale=clamp(p.morale+4,40,100);message='O clima melhora e o treino termina sem novo atrito.';}
  if(action==='training_confront'){p.reputation=clamp((p.reputation||0)+1,0,100);p.morale=clamp(p.morale-4,40,100);message='Sua cobrança mostra personalidade, mas pesa no ambiente.';}
  if(action==='travel_rest'){p.morale=clamp(p.morale+3,40,100);message='Você prioriza sono e recuperação após a viagem difícil.';}
  if(action==='travel_activate'){p.developmentBoost=(p.developmentBoost||0)+1;p.morale=clamp(p.morale-2,40,100);message='A ativação extra melhora a preparação, mas cobra energia.';}
  if(action==='sponsor_campaign_accept'){p.reputation=clamp((p.reputation||0)+3,0,100);p.pressure=(p.pressure||0)+1;message='Sua exposição cresce, junto da cobrança externa.';}
  if(action==='sponsor_campaign_focus'){p.developmentBoost=(p.developmentBoost||0)+1;p.morale=clamp(p.morale+1,40,100);message='Você reduz a agenda e ganha tempo para preparação esportiva.';}
  if(action==='fans_talk'){p.reputation=clamp((p.reputation||0)+3,0,100);p.morale=clamp(p.morale+2,40,100);message='A conversa aproxima você da torcida.';}
  if(action==='fans_train'){p.developmentBoost=(p.developmentBoost||0)+1;message='Você se blinda da pressão e transforma a semana em trabalho.';}
  if(action==='boots_safe'){p.morale=clamp(p.morale+2,40,100);message='Você volta ao equipamento conhecido e recupera conforto.';}
  if(action==='boots_risk'){if(Math.random()<.55){p.developmentBoost=(p.developmentBoost||0)+1;message='A adaptação funciona e você se sente mais solto tecnicamente.';}else{p.morale=clamp(p.morale-2,40,100);message='O material ainda incomoda e a adaptação demora.';}}
  if(action==='setpiece_take'){p.reputation=clamp((p.reputation||0)+2,0,100);p.developmentBoost=(p.developmentBoost||0)+1;message='Você assume mais bolas paradas e ganha protagonismo.';}
  if(action==='setpiece_share'){p.morale=clamp(p.morale+3,40,100);message='A divisão das cobranças fortalece o ambiente do grupo.';}
  if(action==='mentor_help'){p.reputation=clamp((p.reputation||0)+3,0,100);p.morale=clamp(p.morale+2,40,100);message='Você passa a ser visto como referência dentro do elenco.';}
  if(action==='mentor_focus'){p.developmentBoost=(p.developmentBoost||0)+1;message='Você preserva tempo para o próprio desenvolvimento.';}
  if(action==='documentary_yes'){p.reputation=clamp((p.reputation||0)+4,0,100);p.pressure=(p.pressure||0)+2;message='Sua imagem cresce, mas a rotina fica mais exposta.';}
  if(action==='documentary_no'){p.morale=clamp(p.morale+4,40,100);p.pressure=Math.max(0,(p.pressure||0)-1);message='Você protege a rotina e reduz distrações.';}
  if(action==='tactical_adapt'){p.developmentBoost=(p.developmentBoost||0)+1;p.morale=clamp(p.morale+2,40,100);message='A adaptação aumenta sua confiança e repertório.';}
  if(action==='tactical_stay'){p.morale=clamp(p.morale+2,40,100);message='Você mantém sua função mais confortável e preserva estabilidade.';}
  if(action==='captain_speech'){p.reputation=clamp((p.reputation||0)+3,0,100);p.morale=clamp(p.morale+2,40,100);message='Sua voz ganha peso dentro do grupo.';}
  if(action==='captain_example'){p.morale=clamp(p.morale+4,40,100);p.pressure=Math.max(0,(p.pressure||0)-1);message='Sua liderança silenciosa transmite confiança.';}
  if(action==='specialist_primary'){p.developmentBoost=(p.developmentBoost||0)+1;message='A sessão especializada reforça sua principal arma.';}
  if(action==='specialist_weak'){p.potential=clamp((p.potential||p.overall)+1,p.overall,99);message='Você melhora o equilíbrio do jogo e ganha margem de evolução.';}
  if(action==='charity_join'){p.reputation=clamp((p.reputation||0)+3,0,100);p.morale=clamp(p.morale+3,40,100);message='A ação aproxima você da comunidade e melhora seu moral.';}
  if(action==='charity_rest'){p.morale=clamp(p.morale+4,40,100);message='O descanso ajuda a recuperar energia para a sequência.';}
  if(action==='video_learn'){p.developmentBoost=(p.developmentBoost||0)+1;message='A análise de vídeo revela detalhes que podem melhorar seu jogo.';}
  if(action==='video_confidence'){p.morale=clamp(p.morale+4,40,100);message='Rever seus melhores lances aumenta sua confiança.';}
  if(action==='contract_stay'){p.morale=clamp(p.morale+4,40,100);p.pressure=Math.max(0,(p.pressure||0)-1);message='Sua sinalização de permanência reduz os ruídos.';}
  if(action==='contract_market'){p.marketBonus=(p.marketBonus||0)+1;p.reputation=clamp((p.reputation||0)+1,0,100);message='Seu estafe passa a ouvir novas possibilidades.';}
  if(action==='recovery_tech'){p.morale=clamp(p.morale+4,40,100);p.injuryGames=Math.max(0,(p.injuryGames||0)-1);message='O protocolo ajuda sua recuperação física.';}
  if(action==='recovery_normal'){p.morale=clamp(p.morale+2,40,100);message='Você mantém a rotina conhecida e evita mudanças desnecessárias.';}
  if(action==='sponsor_accept'){p.sponsor={brand:e.sponsorBrand,value:e.sponsorValue,startYear:state.season?.year||START_YEAR};p.reputation=clamp((p.reputation||0)+4,0,100);p.morale=clamp(p.morale+2,40,100);message=`Você assina com a ${e.sponsorBrand} por ${money(e.sponsorValue)} por temporada.`;}
  if(action==='sponsor_negotiate'){if(Math.random()<.58){const raised=Math.round((e.sponsorValue||0)*1.22);p.sponsor={brand:e.sponsorBrand,value:raised,startYear:state.season?.year||START_YEAR};p.reputation=clamp((p.reputation||0)+5,0,100);message=`A ${e.sponsorBrand} aceita a negociação: novo acordo de ${money(raised)} por temporada.`;}else{p.reputation=clamp((p.reputation||0)+1,0,100);message=`A ${e.sponsorBrand} não melhora a oferta e as conversas são encerradas.`;}}
  if(action==='sponsor_decline'){p.reputation=clamp((p.reputation||0)+1,0,100);message=`Você recusa a ${e.sponsorBrand} e mantém espaço para futuras propostas.`;}
  if(action==='nt_camp_train'){p.nationalTrust=clamp((p.nationalTrust||0)+4,0,100);p.developmentBoost=(p.developmentBoost||0)+1;message='A sessão extra fortalece sua posição dentro da seleção.';}
  if(action==='nt_camp_rest'){p.morale=clamp(p.morale+4,40,100);message='Você chega mais inteiro para a próxima partida da seleção.';}
  if(action==='nt_penalty_take'||action==='wc_penalty_duty'){p.nationalTrust=clamp((p.nationalTrust||0)+5,0,100);p.pressure=(p.pressure||0)+2;message='Você assume responsabilidade entre os cobradores e ganha protagonismo.';}
  if(action==='nt_penalty_support'||action==='wc_penalty_skip'){p.nationalTrust=clamp((p.nationalTrust||0)+2,0,100);p.morale=clamp(p.morale+3,40,100);message='Sua postura coletiva melhora o ambiente e preserva a confiança.';}
  if(action==='nt_press_ambitious'||action==='nt_rival_media'){p.reputation=clamp((p.reputation||0)+3,0,100);p.pressure=(p.pressure||0)+2;message='Sua fala repercute e aumenta o peso sobre suas atuações pela seleção.';}
  if(action==='nt_press_calm'||action==='nt_rival_focus'){p.nationalTrust=clamp((p.nationalTrust||0)+3,0,100);p.morale=clamp(p.morale+3,40,100);message='Você reduz o ruído e mantém o grupo concentrado.';}
  if(action==='nt_tactical_adapt'||action==='wc_video_study'){p.nationalTrust=clamp((p.nationalTrust||0)+4,0,100);p.developmentBoost=(p.developmentBoost||0)+1;message='A preparação aumenta sua confiança e leitura tática na seleção.';}
  if(action==='nt_tactical_stay'||action==='wc_instinct'){p.morale=clamp(p.morale+2,40,100);message='Você preserva sua confiança na função em que rende melhor.';}
  if(action==='nt_leader_speech'||action==='wc_tunnel_speech'){p.nationalTrust=clamp((p.nationalTrust||0)+5,0,100);p.reputation=clamp((p.reputation||0)+2,0,100);message='Sua voz ganha força no vestiário da seleção.';}
  if(action==='nt_leader_example'||action==='wc_tunnel_calm'){p.nationalTrust=clamp((p.nationalTrust||0)+3,0,100);p.morale=clamp(p.morale+4,40,100);message='Sua postura transmite segurança ao grupo.';}
  if(action==='wc_arrival_embrace'){p.nationalTrust=clamp((p.nationalTrust||0)+4,0,100);p.morale=clamp(p.morale+5,40,100);message='Você absorve o clima da Copa e entra ainda mais motivado.';}
  if(action==='wc_arrival_focus'){p.nationalTrust=clamp((p.nationalTrust||0)+3,0,100);p.pressure=Math.max(0,(p.pressure||0)-1);message='A rotina controlada ajuda você a lidar com a pressão da Copa.';}
  if(action==='wc_family_visit'){p.morale=clamp(p.morale+6,40,100);message='A visita renova seu ânimo durante a Copa.';}
  if(action==='wc_family_focus'){p.nationalTrust=clamp((p.nationalTrust||0)+3,0,100);message='Você mantém foco total na preparação da seleção.';}
  if(action==='idol_learn'){p.developmentBoost=(p.developmentBoost||0)+1;if(p.age<=24&&Math.random()<.34)p.potential=clamp(Math.max(p.overall,p.potential||p.overall)+1,p.overall,99);message=`O conselho de ${p.idol?.name||'seu ídolo'} vira uma referência para seus treinos.`;}
  if(action==='idol_confidence'){p.morale=clamp(p.morale+6,40,100);p.pressure=Math.max(0,(p.pressure||0)-2);message=`A conversa com ${p.idol?.name||'seu ídolo'} deixa você mais leve para a sequência.`;}
  if(action==='idol_humility'){p.morale=clamp(p.morale+4,40,100);p.reputation=clamp((p.reputation||0)+2,0,100);message='Você transforma o conselho em postura e ganha respeito dentro do clube.';}
  if(action==='idol_ambition'){p.reputation=clamp((p.reputation||0)+4,0,100);p.pressure=(p.pressure||0)+2;message='Você assume metas maiores e a cobrança cresce junto.';}
  if(action==='idol_train'){p.developmentBoost=(p.developmentBoost||0)+2;message='O treino especial acrescenta detalhes técnicos à sua preparação.';}
  if(action==='idol_potential'){if(p.age<=25)p.potential=clamp(Math.max(p.overall,p.potential||p.overall)+1,p.overall,99);else p.developmentBoost=(p.developmentBoost||0)+1;message='Você usa a sessão para ampliar repertório e leitura de jogo.';}
  if(action==='idol_market'){p.marketBonus=(p.marketBonus||0)+1;p.reputation=clamp((p.reputation||0)+2,0,100);message='Seu estafe passa a avaliar novos degraus para a carreira.';}
  if(action==='idol_stability'){p.morale=clamp(p.morale+6,40,100);p.pressure=Math.max(0,(p.pressure||0)-1);message='Você decide transformar continuidade em legado no clube atual.';}
  if(action==='idol_national'){p.nationalTrust=clamp((p.nationalTrust||0)+5,0,100);p.reputation=clamp((p.reputation||0)+2,0,100);message='Você leva a mensagem para a seleção e assume mais responsabilidade.';}
  if(action==='idol_group'){p.morale=clamp(p.morale+4,40,100);p.pressure=Math.max(0,(p.pressure||0)-2);p.nationalTrust=clamp((p.nationalTrust||0)+2,0,100);message='Você escolhe proteger o ambiente da seleção e fortalecer o grupo.';}
  if(action==='idol_wc'){p.nationalTrust=clamp((p.nationalTrust||0)+6,0,100);p.developmentBoost=(p.developmentBoost||0)+1;message=`O conselho de ${p.idol?.name||'seu ídolo'} aumenta sua preparação para os jogos decisivos da Copa.`;}
  if(action==='idol_biggame'){p.morale=clamp(p.morale+5,40,100);p.reputation=clamp((p.reputation||0)+3,0,100);p.developmentBoost=(p.developmentBoost||0)+1;message=`${p.idol?.name||'Seu ídolo'} ajuda você a transformar pressão em preparação para jogos grandes.`;}
  if(action==='idol_leadership'){p.reputation=clamp((p.reputation||0)+4,0,100);p.nationalTrust=clamp((p.nationalTrust||0)+2,0,100);p.morale=clamp(p.morale+2,40,100);message='Você passa a assumir mais responsabilidade dentro do elenco.';}
  if(action==='idol_media_focus'){p.pressure=Math.max(0,(p.pressure||0)-4);p.developmentBoost=(p.developmentBoost||0)+1;message='Você reduz o ruído externo e transforma a semana em preparação.';}
  if(action==='idol_media_voice'){p.reputation=clamp((p.reputation||0)+3,0,100);p.morale=clamp(p.morale+4,40,100);message='Sua resposta pública é equilibrada e fortalece sua imagem.';}
  if(action==='idol_recovery'){p.injuryGames=Math.max(0,(p.injuryGames||0)-1);p.morale=clamp(p.morale+5,40,100);message='A recuperação segue com calma e você ganha confiança para voltar inteiro.';}
  if(action==='idol_fast_return'){p.injuryGames=Math.max(0,(p.injuryGames||0)-1);p.injuryRiskModifier=clamp((p.injuryRiskModifier||0)+.006,0,.03);message='Você antecipa o retorno, mas o departamento médico alerta para um risco físico um pouco maior.';}
  if(action==='idol_legacy_team'){p.morale=clamp(p.morale+4,40,100);p.reputation=clamp((p.reputation||0)+2,0,100);p.pressure=Math.max(0,(p.pressure||0)-1);message='Você coloca o objetivo coletivo no centro da reta decisiva.';}
  state.news.push(`${e.title}: ${message}`);const resume=!!state.resumeSeasonAfterEvent;state.resumeSeasonAfterEvent=false;state.pendingEvent=null;const eventModal=$('#event-modal');playCareerEventResolution(e,message);save();render();toast(message);setTimeout(()=>{eventModal.classList.add('hidden');eventModal.classList.remove('sponsor-event-active','national-event-active','idol-event-active');if(resume&&!state.player?.retired&&state.season&&!state.season.closed)setTimeout(continueSeasonSimulation,120);},620);
}

function showCelebration(icon,title,subtitle){
  const iconBox=$('#celebration-icon');iconBox.className='celebration-icon';
  if(/^https?:/i.test(icon||'')){
    const safeIcon=esc(icon),label=esc(title),initials=esc(honourInitials(title));
    iconBox.innerHTML=`<span class="honour-art"><img src="${safeIcon}" data-sources="${encodeURIComponent(icon)}" data-index="0" alt="${label}" loading="eager" fetchpriority="high" decoding="async" referrerpolicy="no-referrer" onload="polishSiteImage(this)" onerror="cycleHonourImage(this)"><b>${initials}</b></span>`;
  }else iconBox.textContent=icon;
  $('#celebration-title').textContent=title;$('#celebration-subtitle').textContent=subtitle;
  $('#confetti').innerHTML=Array.from({length:38},(_,i)=>`<i style="--x:${rnd(-46,46)}vw;--r:${rnd(90,720)}deg;--d:${(Math.random()*1.4+.8).toFixed(2)}s;--delay:${(Math.random()*.5).toFixed(2)}s"></i>`).join('');
  $('#celebration').classList.remove('hidden');
}
function showCelebrationForHonour(name,title,subtitle){
  const iconBox=$('#celebration-icon');iconBox.className='celebration-icon';
  // Nunca gerar <img src="undefined"> quando a competição não tem imagem real.
  iconBox.innerHTML=honourVisual(name);
  $('#celebration-title').textContent=title;$('#celebration-subtitle').textContent=subtitle;
  $('#confetti').innerHTML=Array.from({length:38},(_,i)=>`<i style="--x:${rnd(-46,46)}vw;--r:${rnd(90,720)}deg;--d:${(Math.random()*1.4+.8).toFixed(2)}s;--delay:${(Math.random()*.5).toFixed(2)}s"></i>`).join('');
  $('#celebration').classList.remove('hidden');
}

function showSeasonHonoursGallery(titles=[],awards=[]){
  const iconBox=$('#celebration-icon');
  const items=[...titles.map(name=>({name,type:'Título'})),...awards.map(name=>({name,type:'Prêmio'}))];
  iconBox.className='celebration-icon season-honours-showcase';
  iconBox.innerHTML=items.map(item=>`<div class="season-honour-tile">${honourVisual(item.name)}<span><strong>${item.name}</strong><small>${item.type}</small></span></div>`).join('');
  $('#celebration-title').textContent=titles.length?'Temporada de conquistas':'Prêmios da temporada';
  $('#celebration-subtitle').textContent=`${titles.length} título(s) · ${awards.length} prêmio(s)`;
  $('#confetti').innerHTML=Array.from({length:52},(_,i)=>`<i style="--x:${rnd(-48,48)}vw;--r:${rnd(90,900)}deg;--d:${(Math.random()*1.6+.8).toFixed(2)}s;--delay:${(Math.random()*.6).toFixed(2)}s"></i>`).join('');
  $('#celebration').classList.remove('hidden');
}
function specialAwardTheme(name){
  if(/Bola de Ouro/i.test(name))return {className:'ballon-dor',kicker:'NOITE DE GALA · BOLA DE OURO'};
  if(/Chuteira de Ouro/i.test(name))return {className:'golden-shoe',kicker:'CERIMÔNIA · CHUTEIRA DE OURO'};
  return {className:'standard-award',kicker:'PRÊMIO INDIVIDUAL'};
}
function showAwardCeremony(result){
  const p=state.player;const entry=typeof result==='string'?{name:result,winner:p?.name||'Você',isUserWinner:true,stats:[],copy:'Seu nome foi anunciado como vencedor.'}:result;
  const theme=specialAwardTheme(entry.name),stage=$('#award-ceremony-stage');stage.className=`award-ceremony-stage ${theme.className}`;
  $('#award-ceremony-kicker').textContent=theme.kicker;
  $('#award-ceremony-title').textContent=`${entry.winner} — ${entry.name}`;
  $('#award-ceremony-copy').textContent=entry.copy||'';
  $('#award-ceremony-stats').innerHTML=(entry.stats||[]).map(x=>`<span>${x}</span>`).join('');
  $('#award-ceremony-trophy').innerHTML=honourVisual(entry.name);
  $('#award-ceremony-continue').textContent=entry.isUserWinner?'Receber prêmio':'Continuar';
  stage.classList.toggle('award-lost',!entry.isUserWinner);
  $('#award-ceremony-modal').classList.remove('hidden');
}
function playNextAwardCeremony(){
  if(!awardCeremonyQueue.length){
    $('#award-ceremony-modal').classList.add('hidden');
    const after=awardCeremonyAfter;awardCeremonyAfter=null;if(after)after();return;
  }
  showAwardCeremony(awardCeremonyQueue.shift());
}
function queueSpecialAwardCeremonies(results,after){
  awardCeremonyQueue=(results||[]).map(x=>typeof x==='string'?{name:x,winner:state.player?.name||'Você',isUserWinner:true,stats:[],copy:'Seu nome foi anunciado como vencedor.'}:x).filter(x=>/Bola de Ouro|Chuteira de Ouro/i.test(x.name||''));
  awardCeremonyAfter=after;
  if(awardCeremonyQueue.length)playNextAwardCeremony();else if(after)after();
}

const BTL_START_THEME={key:'btl-start',primary:'#070707',accent:'#f4ce32',secondary:'#ffd83d',tertiary:'#f3c71c',alt:'#ffe873',bg:'#050505',panel:'#111111',panel2:'#171717',border:'#514724',buttonText:'#111111',angle:125};
function applyStartTheme(){
  applyThemeTokens(BTL_START_THEME,'');
  document.body.dataset.visualScope='start';
  document.body.classList.add('btl-start-theme');
}
const viewNavigationStack=[];
function navigateBackInsideSite(){
  if(!document.querySelector('#auth-gate')?.classList.contains('hidden'))return;
  const current=document.querySelector('.view.active')?.id||'home';
  let previous=viewNavigationStack.pop();
  while(previous===current&&viewNavigationStack.length)previous=viewNavigationStack.pop();
  showView(previous||'home',false);
}
function showView(id,pushHistory=true){
  const activeCareer=!!(state.created&&state.player&&!state.player.retired);
  if(['career','stats','market'].includes(id)&&!state.created)id='create';
  document.body.classList.toggle('career-mode',activeCareer);
  const currentView=document.querySelector('.view.active')?.id||'home';
  if(pushHistory&&currentView!==id)viewNavigationStack.push(currentView);
  document.body.classList.toggle('home-screen',id==='home');
  document.body.classList.toggle('btl-start-theme',id==='home');
  $$('.view').forEach(v=>v.classList.toggle('active',v.id===id));
  $$('nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===id));
  window.scrollTo({top:0,behavior:'instant'});render();if(id==='home')applyStartTheme();if(id==='attribute-draft'&&attributeDraft)renderAttributeDraft();
  const back=$('#btl-site-back');if(back)back.disabled=(viewNavigationStack.length===0&&id==='home');
}
function competitionStatus(){
  const s=state.season;const items=[];if(!s)return items;const l=s.league;items.push({type:'league',title:l.name,status:`Rodada ${Math.min(l.index+1,l.schedule.length)}/${l.schedule.length} · ${l.points} pts${l.finished&&l.position?` · ${l.position}º`:''}`});
  const cup=s.cup;items.push({type:'cup',title:cup.name,status:cup.won?'Campeão':cup.eliminated?'Eliminado':`${cup.stages[cup.stageIndex]?.name||'Finalizado'}${cup.stages[cup.stageIndex]?.legs>1?` · jogo ${cup.leg}/${cup.stages[cup.stageIndex].legs}`:''}`});
  if(s.leagueCup){const lc=s.leagueCup;items.push({type:'cup',title:lc.name,status:lc.won?'Campeão':lc.eliminated?'Eliminado':`${lc.stages[lc.stageIndex]?.name||'Finalizado'} · jogo ${lc.leg}`});}
  if(s.continental){const c=s.continental;let status=c.won?'Campeão':c.eliminated?'Eliminado':c.phase==='qualifying'?`Prévia · ${c.preliminary?.stages?.[c.preliminary?.stageIndex]?.name||'Play-off'}`:c.phase==='phase'?`${c.format.phase} · ${c.phaseIndex}/${c.phaseSchedule.length} · ${c.points} pts`:`${c.knockout.stages[c.knockout.stageIndex]?.name||'Mata-mata'} · jogo ${c.knockout.leg}/${c.knockout.stages[c.knockout.stageIndex]?.legs||1}`;items.push({type:'continental',title:c.name,status});}
  (s.superCups||[]).forEach(sc=>items.push({type:sc.scope==='national'?'national':'supercup',title:sc.name,status:sc.won?'Campeão':sc.eliminated?'Eliminado':sc.stages[sc.stageIndex]?.name||'Final'}));
  if(isWorldCupYear(s.year)&&state.player?.calledUp){const wc=ensureWorldCupState(s,state.player);items.push({type:'national',title:'FIFA World Cup',status:`${worldCupStatusText(wc)} · Sede: ${worldCupHostShortLabel(s.year)}`});}
  if(state.player?.calledUp){const slot=currentNationalCalendarSlot(s,state.player);if(slot)items.push({type:'national',title:slot.competition,status:slot.stage});}
  return items;
}
const CURRENT_PLAYER_META={
'Mohamed Salah':['Trabzonspor','TR','EG'],'Kylian Mbappé':['Real Madrid','ES','FR'],'Erling Haaland':['Manchester City','ENG','NO'],'Jude Bellingham':['Real Madrid','ES','ENG'],'Ousmane Dembélé':['Paris Saint-Germain','FR','FR'],'Rodri':['Barcelona','ES','ES'],'Virgil van Dijk':['Liverpool','ENG','NL'],'Raphinha':['Barcelona','ES','BR'],'Lamine Yamal':['Barcelona','ES','ES'],'Pedri':['Barcelona','ES','ES'],'Vini Jr.':['Real Madrid','ES','BR'],'Joshua Kimmich':['Bayern de Munique','DE','DE'],'Harry Kane':['Bayern de Munique','DE','ENG'],'Florian Wirtz':['Liverpool','ENG','DE'],'Federico Valverde':['Real Madrid','ES','UY'],'Jamal Musiala':['Bayern de Munique','DE','DE'],'Lautaro Martínez':['Inter de Milão','IT','AR'],'Robert Lewandowski':['Chicago Fire','US','PL'],'Bukayo Saka':['Arsenal','ENG','ENG'],'Cole Palmer':['Chelsea','ENG','ENG'],'Kevin De Bruyne':['Napoli','IT','BE'],'Frenkie de Jong':['Barcelona','ES','NL'],'Bruno Fernandes':['Manchester United','ENG','PT'],'Martin Ødegaard':['Arsenal','ENG','NO'],'Michael Olise':['Bayern de Munique','DE','FR'],'Paulo Dybala':['Roma','IT','AR'],'Hakan Çalhanoğlu':['Inter de Milão','IT','TR'],'Nico Williams':['Athletic Club','ES','ES'],'Nuno Mendes':['Paris Saint-Germain','FR','PT'],'Lionel Messi':['Inter Miami','US','AR'],'Neymar Jr':['Santos','BR','BR'],'Cristiano Ronaldo':['Al-Nassr','SA','PT'],'Achraf Hakimi':['Paris Saint-Germain','FR','MA'],'Theo Hernández':['Al-Hilal','SA','FR'],'William Saliba':['Arsenal','ENG','FR'],'Gabriel Magalhães':['Arsenal','ENG','BR'],'Vitinha':['Paris Saint-Germain','FR','PT'],'Khvicha Kvaratskhelia':['Paris Saint-Germain','FR','GE'],'Nicolò Barella':['Inter de Milão','IT','IT'],'Declan Rice':['Arsenal','ENG','ENG'],'Alexander Isak':['Liverpool','ENG','SE'],'Victor Osimhen':['Galatasaray','TR','NG'],'Viktor Gyökeres':['Arsenal','ENG','SE'],'Julián Álvarez':['Atlético de Madrid','ES','AR'],'João Neves':['Paris Saint-Germain','FR','PT'],'Alessandro Bastoni':['Inter de Milão','IT','IT'],'Rúben Dias':['Manchester City','ENG','PT'],'Bernardo Silva':['Real Madrid','ES','PT'],'Rafael Leão':['Milan','IT','PT'],'Jules Koundé':['Barcelona','ES','FR']};
const CURRENT_PLAYER_BIRTH_YEARS={
'Mohamed Salah':1992,'Kylian Mbappé':1998,'Erling Haaland':2000,'Jude Bellingham':2003,'Ousmane Dembélé':1997,'Rodri':1996,'Virgil van Dijk':1991,'Raphinha':1996,'Lamine Yamal':2007,'Pedri':2002,'Vini Jr.':2000,'Joshua Kimmich':1995,'Harry Kane':1993,'Florian Wirtz':2003,'Federico Valverde':1998,'Jamal Musiala':2003,'Lautaro Martínez':1997,'Robert Lewandowski':1988,'Bukayo Saka':2001,'Cole Palmer':2002,'Kevin De Bruyne':1991,'Frenkie de Jong':1997,'Bruno Fernandes':1994,'Martin Ødegaard':1998,'Michael Olise':2001,'Paulo Dybala':1993,'Hakan Çalhanoğlu':1994,'Nico Williams':2002,'Nuno Mendes':2002,'Lionel Messi':1987,'Neymar Jr':1992,'Cristiano Ronaldo':1985,'Achraf Hakimi':1998,'Theo Hernández':1997,'William Saliba':2001,'Gabriel Magalhães':1997,'Vitinha':2000,'Khvicha Kvaratskhelia':2001,'Nicolò Barella':1997,'Declan Rice':1999,'Alexander Isak':1999,'Victor Osimhen':1998,'Viktor Gyökeres':1998,'Julián Álvarez':2000,'João Neves':2004,'Alessandro Bastoni':1999,'Rúben Dias':1997,'Bernardo Silva':1994,'Rafael Leão':1999,'Jules Koundé':1998};
function inferredWorldPlayerBirthYear(name=''){
  if(CURRENT_PLAYER_BIRTH_YEARS[name])return CURRENT_PLAYER_BIRTH_YEARS[name];
  return START_YEAR-(22+(stableHash(name)%12));
}
function worldPlayerAge(wp,year=state.season?.year||START_YEAR){return Math.max(16,(Number(year)||START_YEAR)-(wp.birthYear||inferredWorldPlayerBirthYear(wp.name)));}
// Aposentadoria aplicada à população completa na entrada da PRÓXIMA temporada.
function worldRetirementChance(age){return window.BTLWorldCareer?.retirementProbability(age)||0;}
function simulateWorldRetirements(year=state.season?.year||START_YEAR){
  const engine=window.BTLWorldCareer;if(!engine)return null;
  const players=ensureWorldPlayers();
  if(Number(state.lastWorldEvolutionYear||START_YEAR)>=year)return null;
  const report=engine.advance(players,year,{seedYear:START_YEAR});
  state.lastWorldEvolutionYear=year;
  state.worldEvolutionHistory=Array.isArray(state.worldEvolutionHistory)?state.worldEvolutionHistory:[];
  state.worldEvolutionHistory.push({year,aged:report.aged,retiredCount:report.retirements.length,generatedCount:report.generated.length,retirements:report.retirements.slice(0,12),generated:report.generated.slice(0,12)});
  state.worldEvolutionHistory=state.worldEvolutionHistory.slice(-24);
  if(report.retirements.length)state.news.push(`Mundo ${year}: ${report.retirements.length} aposentadorias e ${report.generated.length} novos profissionais gerados.`);
  worldDirty=true;
  return report;
}
const EXTRA_ACTIVE_PLAYERS=[
{name:'Giorgian de Arrascaeta',rating:86,position:'MEI',club:'Flamengo',countryCode:'BR',nationalCode:'UY'},
{name:'Pedro',rating:84,position:'ATA',club:'Flamengo',countryCode:'BR',nationalCode:'BR'},
{name:'Memphis Depay',rating:84,position:'ATA',club:'Corinthians',countryCode:'BR',nationalCode:'NL'},
{name:'Yuri Alberto',rating:82,position:'ATA',club:'Corinthians',countryCode:'BR',nationalCode:'BR'},
{name:'Hulk',rating:83,position:'ATA',club:'Fluminense',countryCode:'BR',nationalCode:'BR'},
{name:'Raphael Veiga',rating:83,position:'MEI',club:'Palmeiras',countryCode:'BR',nationalCode:'BR'},
{name:'Vitor Roque',rating:84,position:'ATA',club:'Palmeiras',countryCode:'BR',nationalCode:'BR'},
{name:'Alan Patrick',rating:82,position:'MEI',club:'Internacional',countryCode:'BR',nationalCode:'BR'},
{name:'Luciano',rating:81,position:'ATA',club:'São Paulo',countryCode:'BR',nationalCode:'BR'},
{name:'Jhon Arias',rating:83,position:'PD',club:'Palmeiras',countryCode:'BR',nationalCode:'CO'},
{name:'Arias',rating:80,position:'MEI',club:'Bahia',countryCode:'BR',nationalCode:'BR'},
{name:'Ángel Romero',rating:80,position:'ATA',club:'Corinthians',countryCode:'BR',nationalCode:'PY'},
{name:'Edinson Cavani',rating:82,position:'ATA',club:'Boca Juniors',countryCode:'AR',nationalCode:'UY'},
{name:'Miguel Merentiel',rating:82,position:'ATA',club:'Boca Juniors',countryCode:'AR',nationalCode:'UY'},
{name:'Marcos Rojo',rating:79,position:'ZAG',club:'Boca Juniors',countryCode:'AR',nationalCode:'AR'},
{name:'Adrián Martínez',rating:83,position:'ATA',club:'Racing Club',countryCode:'AR',nationalCode:'AR'},
{name:'Juan Fernando Quintero',rating:81,position:'MEI',club:'Racing Club',countryCode:'AR',nationalCode:'CO'},
{name:'Ignacio Fernández',rating:81,position:'MEI',club:'River Plate',countryCode:'AR',nationalCode:'AR'},
{name:'Marcos Acuña',rating:81,position:'LE',club:'River Plate',countryCode:'AR',nationalCode:'AR'},
{name:'Sebastián Driussi',rating:82,position:'ATA',club:'River Plate',countryCode:'AR',nationalCode:'AR'},
{name:'Guido Carrillo',rating:79,position:'ATA',club:'Estudiantes',countryCode:'AR',nationalCode:'AR'},
{name:'Leonardo Fernández',rating:82,position:'MEI',club:'Peñarol',countryCode:'UY',nationalCode:'UY'},
{name:'Maximiliano Silvera',rating:80,position:'ATA',club:'Peñarol',countryCode:'UY',nationalCode:'UY'},
{name:'Nicolás López',rating:80,position:'ATA',club:'Nacional',countryCode:'UY',nationalCode:'UY'},
{name:'Diego Zabala',rating:78,position:'MEI',club:'Nacional',countryCode:'UY',nationalCode:'UY'},
{name:'Arturo Vidal',rating:79,position:'VOL',club:'Colo-Colo',countryCode:'CL',nationalCode:'CL'},
{name:'Javier Correa',rating:80,position:'ATA',club:'Colo-Colo',countryCode:'CL',nationalCode:'AR'},
{name:'Fernando Zampedri',rating:81,position:'ATA',club:'Universidad Católica',countryCode:'CL',nationalCode:'AR'},
{name:'Luciano Pons',rating:78,position:'ATA',club:'Universidad de Chile',countryCode:'CL',nationalCode:'AR'},
{name:'Damián Díaz',rating:80,position:'MEI',club:'Barcelona SC',countryCode:'EC',nationalCode:'EC'},
{name:'Octavio Rivero',rating:79,position:'ATA',club:'Barcelona SC',countryCode:'EC',nationalCode:'UY'},
{name:'Alex Arce',rating:82,position:'ATA',club:'LDU Quito',countryCode:'EC',nationalCode:'PY'},
{name:'Miller Bolaños',rating:78,position:'ATA',club:'Emelec',countryCode:'EC',nationalCode:'EC'},
{name:'Alfredo Morelos',rating:81,position:'ATA',club:'Atlético Nacional',countryCode:'CO',nationalCode:'CO'},
{name:'Andrés Román',rating:79,position:'LD',club:'Atlético Nacional',countryCode:'CO',nationalCode:'CO'},
{name:'Adrián Ramos',rating:79,position:'ATA',club:'América de Cali',countryCode:'CO',nationalCode:'CO'},
{name:'Homer Martínez',rating:78,position:'VOL',club:'Junior',countryCode:'CO',nationalCode:'CO'},
{name:'Roque Santa Cruz',rating:78,position:'ATA',club:'Libertad',countryCode:'PY',nationalCode:'PY'},
{name:'Ángel Cardozo Lucena',rating:78,position:'MEI',club:'Cerro Porteño',countryCode:'PY',nationalCode:'PY'},
{name:'Carlos Bacca',rating:79,position:'ATA',club:'The Strongest',countryCode:'BO',nationalCode:'CO'},
{name:'Michael Ortega',rating:77,position:'MEI',club:'Bolívar',countryCode:'BO',nationalCode:'CO'},
{name:'Paolo Guerrero',rating:79,position:'ATA',club:'Alianza Lima',countryCode:'PE',nationalCode:'PE'},
{name:'Hernán Barcos',rating:78,position:'ATA',club:'Universitario',countryCode:'PE',nationalCode:'AR'}
];
function ensureWorldPlayers(){
  if(!Array.isArray(state.worldPlayers)||!state.worldPlayers.length){
    const seed=window.BTLTransfermarktSeed;
    if(Array.isArray(seed?.players)&&seed.players.length){
      // New saves begin with all members of the catalog. Existing careers are not overwritten.
      state.worldPlayers=seed.players.map(p=>({...p}));state.worldDataset={...seed.meta};
      state.officialSquadImported2026=true;worldDirty=true;
    }else{
      const base=(typeof CURRENT_DRAFT_PLAYERS!=='undefined'?CURRENT_DRAFT_PLAYERS:[]).map(x=>{const m=CURRENT_PLAYER_META[x.name]||[];return {id:normalizeKey(x.name),name:x.name,rating:x.rating||84,position:x.position||'ATA',club:m[0]||'',countryCode:m[1]||'',nationalCode:m[2]||'',birthYear:inferredWorldPlayerBirthYear(x.name),birthEstimated:!CURRENT_PLAYER_BIRTH_YEARS[x.name],lastAgedYear:START_YEAR,retired:false};});
      state.worldPlayers=[...base,...EXTRA_ACTIVE_PLAYERS.map(x=>({...x,id:normalizeKey(x.name),birthYear:x.birthYear||inferredWorldPlayerBirthYear(x.name),birthEstimated:!x.birthYear,lastAgedYear:START_YEAR,retired:false}))];
    }
  }
  // Primeira inicialização da temporada 2026: importa elencos de fontes oficiais
  // sem apagar progresso e sem reescrever temporadas já avançadas.
  if(!state.officialSquadImported2026 && (state.season?.year||START_YEAR)===2026 && (state.created||state.player) && window.BTLOfficialSquads){
    const existing=new Map(state.worldPlayers.map(x=>[normalizeKey(x.name),x]));
    for(const squad of Object.values(window.BTLOfficialSquads)){
      for(const item of squad.players||[]){
        const id=normalizeKey(item.name);if(!id)continue;
        const current=existing.get(id);
        if(current){current.club=squad.club;current.countryCode=squad.country;continue;}
        const record={id,name:item.name,club:squad.club,countryCode:squad.country,nationalCode:'',
          position:item.position||'MC',rating:73+(stableHash(id)%11),
          birthYear:inferredWorldPlayerBirthYear(item.name),birthEstimated:true,lastAgedYear:START_YEAR,retired:false,
          source:'2026/27 · fonte oficial',estimatedSimulationRating:true};
        state.worldPlayers.push(record);existing.set(id,record);
      }
    }
    state.officialSquadImported2026=true;worldDirty=true;save();
  }
  state.worldPlayers.forEach(wp=>{if(!wp.birthYear){wp.birthYear=inferredWorldPlayerBirthYear(wp.name);wp.birthEstimated=true;}wp.lastAgedYear=Number(wp.lastAgedYear)||Number(state.season?.year||START_YEAR);wp.retired=!!wp.retired;});
  return state.worldPlayers;
}
/* V14: opt-in roster changes. Source and date accompany each player.
   No overwriting historic saves: only active initial 2026 careers can import. */
window.BTLImportRosterToCareer=function(roster){
  if(!state?.created && !state?.player)return {ok:false,message:'Crie uma carreira antes de importar um plantel.'};
  if(Number(state.season?.year||START_YEAR)!==2026)return {ok:false,message:'Importação direta disponível só em 2026. Para evitar alterações retroativas, saves de temporadas posteriores não são modificados.'};
  if(!roster||!Array.isArray(roster.players)||roster.players.length<1||roster.players.length>120)return {ok:false,message:'O elenco selecionado está inválido.'};
  const club=String(roster.club||'').trim();if(club.length<2)return {ok:false,message:'Nome de clube inválido.'};
  const team=findClubDataAny(club)||findClubData(club,roster.country||'')||{};
  const canonical=team.name||club;const countryCode=team.countryCode||roster.country||'';
  const world=ensureWorldPlayers(),all=new Map(world.map(x=>[normalizeKey(x.name),x]));
  const sourceDate=String(roster.retrievedAt||new Date().toISOString());let added=0,updated=0;
  const touched=new Set();
  for(const athlete of roster.players){
    const name=String(athlete.name||'').trim().slice(0,100),id=normalizeKey(name);
    if(!id||name.length<3||touched.has(id))continue;touched.add(id);
    const existing=all.get(id);const code=String(athlete.nationalCode||'').toUpperCase();
    const fields={club:canonical,countryCode,nationalCode:code||existing?.nationalCode||'',rosterSource:roster.source||'fonte externa',rosterUpdatedAt:sourceDate};
    if(existing&&!existing.retired){Object.assign(existing,fields);worldDirty=true;updated++}
    else {const rating=Number(athlete.rating);const record={id,name,position:athlete.position||'MC',rating:Number.isFinite(rating)&&rating>=40&&rating<=99?rating:73+stableHash(id)%11,birthYear:inferredWorldPlayerBirthYear(name),birthEstimated:true,lastAgedYear:START_YEAR,retired:false,...fields,estimatedSimulationRating:!(rating>=40&&rating<=99)};world.push(record);all.set(id,record);worldDirty=true;added++}
  }
  if(!added&&!updated)return {ok:false,message:'Nenhum jogador válido para importar.'};
  save();return {ok:true,message:`${canonical}: ${added} atletas adicionados, ${updated} atualizados. Outros jogadores não foram removidos sem confirmação do destino. Fonte: ${roster.source||'arquivo próprio'}.`};
};

window.BTLWorldRosterForClub=function(club,country=''){
  if(!state?.created||!Array.isArray(state.worldPlayers)||!state.worldPlayers.length)return null;
  const name=normalizeKey(club);if(!name)return null;
  const canonical=findClubDataAny(club)||findClubData(club,country);
  const keys=new Set([name,normalizeKey(canonical?.name||'')].filter(Boolean));
  const loose=s=>normalizeKey(s).replace(/(?:footballclub|futebolclube|fc|cf|sc|ac)$/,'');
  const looseKeys=new Set([...keys].map(loose));
  const matches=state.worldPlayers.filter(p=>!p.retired&&p.club&&(
    keys.has(normalizeKey(p.club))||looseKeys.has(loose(p.club))
  )).slice(0,120);
  if(!matches.length)return null;
  const meta=state.worldDataset||{};
  return {club:canonical?.name||club,requestedClub:club,country:country||matches[0].countryCode||'',
    source:meta.source||'Banco do save',retrievedAt:meta.sourceDate?meta.sourceDate+'T00:00:00Z':'',
    historicalSnapshot:true,scope:'Atletas ativos no universo desta carreira',
    sourceUrl:meta.sourceUrl||'',
    players:matches.map(p=>({name:p.name,position:p.position||'MC',number:p.number||'',country:p.nationalCode||'',rating:p.rating,id:p.id}))};
};

let worldPlayerFilter='';
function renderWorldOverview(){
  const overview=document.getElementById('world-career-summary'),events=document.getElementById('world-career-events'),results=document.getElementById('world-player-results');
  if(!overview)return;
  const world=Array.isArray(state.worldPlayers)?state.worldPlayers:[];
  const last=state.worldEvolutionHistory?.at(-1);
  const total=world.length,active=world.reduce((n,p)=>n+(!p.retired?1:0),0),regens=world.reduce((n,p)=>n+(!!p.generated),0);
  const dataset=state.worldDataset;
  const summaryText=dataset?.source?`Origem: ${dataset.source} · referência ${dataset.sourceDate||'data não informada'} · elencos não confirmados para outubro/2026.`:'Origem: listas locais do projeto (cobertura parcial, não validadas pelo Transfermarkt).';
  overview.innerHTML=`<div class="world-counts"><span><strong>${active.toLocaleString('pt-BR')}</strong><small>Ativos</small></span><span><strong>${(total-active).toLocaleString('pt-BR')}</strong><small>Aposentados</small></span><span><strong>${regens.toLocaleString('pt-BR')}</strong><small>Gerados</small></span></div><p>${esc(summaryText)}</p>`;
  if(events)events.textContent=last?`Virada ${last.year}: ${last.retiredCount??last.retirements.length} aposentadorias e ${last.generatedCount??last.generated.length} reposições. Processamento único por ano.`:'A evolução do mundo começa na primeira virada de temporada.';
  if(!results)return;
  const query=normalizeKey(worldPlayerFilter),matching=query?world.filter(p=>normalizeKey(p.name).includes(query)||normalizeKey(p.club||p.lastClub).includes(query)):world.filter(p=>p.generated||p.retired).slice(-12).reverse();
  results.innerHTML=matching.slice(0,24).map(p=>`<div class="world-row"><span><strong>${esc(p.name)}</strong><small>${esc(p.club||p.lastClub||'Sem clube')} · ${esc(p.position||'MC')} · ${worldPlayerAge(p,state.season?.year||START_YEAR)} anos</small></span><span class="world-row-status">${p.retired?'Aposentado':p.generated?'Gerado · GER '+Number(p.rating||0):'GER '+Number(p.rating||0)}</span></div>`).join('')||'<small>Nenhum jogador encontrado.</small>';
}
async function readWorldCSV(file){
  if(file.size>40000000)throw Error('Arquivo acima de 40 MB. Divida o CSV em arquivos menores.');
  if(/\.gz$/i.test(file.name)){
    if(typeof DecompressionStream==='undefined')throw Error('Seu navegador não descompacta .gz. Extraia o CSV primeiro.');
    const text=await new Response(file.stream().pipeThrough(new DecompressionStream('gzip'))).text();return window.BTLWorldCareer.parseCSV(text);
  }
  return window.BTLWorldCareer.parseCSV(await file.text());
}
async function importWorldCSV(files){
  if(!state.created||!state.player)throw Error('Crie uma carreira antes de importar os dados.');
  if(Number(state.season?.year||START_YEAR)!==START_YEAR||state.history?.length)throw Error('Importação integral permitida apenas antes de concluir a primeira temporada.');
  if(!worldStoreReady)throw Error('O armazenamento persistente IndexedDB não está disponível. Nenhum dado foi alterado.');
  const list=Array.from(files||[]),playerFile=list.find(f=>/^players\.csv(?:\.gz)?$/i.test(f.name)),clubFile=list.find(f=>/^clubs\.csv(?:\.gz)?$/i.test(f.name));
  if(!playerFile)throw Error('Selecione o arquivo players.csv do Kaggle/Transfermarkt (ou players.csv.gz).');
  const rows=await readWorldCSV(playerFile),input=window.BTLWorldCareer.mapTransfermarkt(rows,{year:START_YEAR,sourceDate:'2026-07-06'});
  if(clubFile)window.BTLWorldCareer.attachClubs(input.players,await readWorldCSV(clubFile));
  for(const wp of input.players){
    const siteClub=findClubDataAny(wp.club)||findClubData(wp.club,wp.countryCode);
    if(siteClub?.name){wp.club=siteClub.name;wp.countryCode=wp.countryCode||siteClub.countryCode||'';}
  }
  if(input.players.length<5)throw Error('O arquivo não contém jogadores ativos suficientes.');
  // Atomic: first persist new players, only then change the in-memory career.
  const meta={source:input.source,sourceDate:input.sourceDate,importedAt:new Date().toISOString(),records:input.players.length,excluded:input.omitted};
  await worldPersistChain.catch(()=>{});
  await window.BTLWorldCareer.persist(STORAGE_KEY,input.players,meta);
  state.worldPlayers=input.players;state.worldDataset=meta;state.worldDbKey=STORAGE_KEY;state.officialSquadImported2026=true;state.lastWorldEvolutionYear=START_YEAR;state.worldEvolutionHistory=[];
  worldDirty=false;save();renderWorldOverview();return `${input.players.length.toLocaleString('pt-BR')} atletas reais importados (${input.omitted} registros descartados). GER é estimado a partir do valor de mercado, não um atributo Transfermarkt. Fonte de julho/2026: pode conter transferências desatualizadas.`;
}
document.getElementById('world-player-search')?.addEventListener('input',e=>{worldPlayerFilter=e.target.value;renderWorldOverview()});


function simulateWorldTransfers(){
  if(state.worldDbKey&&!worldStoreReady)throw Error('Aguarde a recuperação do banco de jogadores.');
  simulateWorldRetirements((state.season?.year||START_YEAR)+1);
  const pool=allTransferClubs().filter(c=>(c.strength||0)>=76);
  ensureWorldPlayers().forEach(wp=>{
    if(wp.retired||Math.random()>.035)return;
    const currentClub=findClubData(wp.club,wp.countryCode)||findClubDataAny(wp.club)||{};
    const currentConf=confederation(wp.countryCode);
    const elite=(wp.rating||0)>=86;
    const candidates=pool.filter(c=>{
      if(c.name===wp.club)return false;
      if(Math.abs((c.strength||80)-(wp.rating||84))>6)return false;
      if(elite&&(c.strength||0)<84)return false;
      if(elite&&confederation(c.countryCode)!==currentConf&&!['US','SA','TR'].includes(c.countryCode))return false;
      if(currentClub.marketTier==='elite'&&c.marketTier==='development')return false;
      if((wp.rating||0)>=82&&currentConf==='UEFA'&&confederation(c.countryCode)==='CONMEBOL')return false;
      return true;
    });
    if(!candidates.length)return;
    const dest=candidates[rnd(0,candidates.length-1)];wp.club=dest.name;wp.countryCode=dest.countryCode;wp.transferred=true;worldDirty=true;
  });
}
function recordCompetitionStat(event,perf){
  if(!state.season||!event?.competition||!perf||Number(perf.rating)<=0)return;const stats=state.season.competitionStats=state.season.competitionStats||{},row=stats[event.competition]=stats[event.competition]||{games:0,goals:0,assists:0};row.games++;row.goals+=perf.goals||0;row.assists+=perf.assists||0;
}
function stableHash(text=''){let h=2166136261;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return Math.abs(h>>>0);}
function competitionProgressForLeaderboard(title){
  const s=state.season;if(!s)return .05;if(title===s.league?.name)return clamp((s.league.index||0)/Math.max(1,s.league.schedule?.length||34),.03,1);const userGames=s.competitionStats?.[title]?.games||0;let max=/World Cup|Copa do Mundo/i.test(title)?7:/Champions League|Libertadores/i.test(title)?13:/Super|Finalissima|Community Shield|Trophée|Cruyff Shield/i.test(title)?2:7;return clamp(Math.max(userGames,1)/max,.08,1);
}
function clubsForLeaderboardCompetition(title){
  const s=state.season,p=state.player;if(!s||!p||!title)return null;
  const clubs=new Set();const add=name=>{if(name&&typeof name==='string')clubs.add(name);};
  if(title===s.league?.name){
    (s.league.participants?.length?s.league.participants:
     [...new Set([s.clubAtStart||p.club,...(s.league.schedule||[]).flatMap(m=>[m.home,m.away])])]).forEach(add);
    return clubs;
  }
  if(title===s.leagueCup?.name){
    const entrants=new Set([...(LEAGUE_CLUB_POOLS.ENG||[]),...(typeof MARKET_LEAGUE_POOLS!=='undefined'?(MARKET_LEAGUE_POOLS['EFL Championship']||[]):[]),...(typeof MARKET_LEAGUE_POOLS!=='undefined'?(MARKET_LEAGUE_POOLS['EFL League One']||[]):[])]);entrants.forEach(add);if(s.leagueCup.opponent)add(s.leagueCup.opponent);return clubs;
  }
  if(title===s.cup?.name){leaguePoolForCountry(s.countryAtStart||p.clubCountry,p.club,s.league?.name||p.clubLeague).forEach(add);add(p.club);if(s.cup?.opponent)add(s.cup.opponent);return clubs;}
  const superCup=(s.superCups||[]).find(sc=>sc.name===title);if(superCup){add(p.club);add(superCup.opponent?.name||superCup.opponent);return clubs;}
  if(title===s.continental?.name){const qualified=qualificationRowsForYear(s.year,title);
    if(qualified)qualified.forEach(add);
    add(p.club);(s.continental?.phaseSchedule||[]).forEach(m=>add(m.opponent));if(s.continental?.knockout?.opponent)add(s.continental.knockout.opponent);return clubs;}
  return null;
}
function worldPlayerEligibleForCompetition(wp,title=''){
  if(!wp||wp.retired||!wp.club)return false;
  const strength=clubStrength(wp.club,wp.countryCode)||findClubDataAny(wp.club)?.strength||wp.rating||75;
  if(/UEFA Champions League/i.test(title))return confederation(wp.countryCode)==='UEFA'&&strength>=82;
  if(/UEFA Europa League/i.test(title))return confederation(wp.countryCode)==='UEFA'&&strength>=77;
  if(/UEFA Conference League/i.test(title))return confederation(wp.countryCode)==='UEFA'&&strength>=73;
  if(/Libertadores|Sudamericana/i.test(title))return confederation(wp.countryCode)==='CONMEBOL';
  if(/AFC Champions/i.test(title))return confederation(wp.countryCode)==='AFC';
  if(/CAF Champions/i.test(title))return confederation(wp.countryCode)==='CAF';
  if(/CONCACAF Champions/i.test(title))return confederation(wp.countryCode)==='CONCACAF';
  return true;
}
// Statistic profiles are constrained by actual team appearances, position and
// overall; sparse official rosters must NOT inherit every goal of their club.
// Scores stay unchanged: unattached goals remain credited to the team, not to a
// made-up named top scorer.
function leaderboardPlayerProfile(wp){
 const pos=String(wp.position||'MC').toUpperCase();
 const gk=/^(GOL|GK|GOLEIRO|POR)$/.test(pos);
 const defender=/^(ZAG|ZC|CB|DEF|LD|LE|RB|LB|LWB|RWB)$/.test(pos);
 const holding=/^(VOL|CDM|DM|MDC)$/.test(pos);
 const central=/^(MC|CM|ME|MD|LM|RM)$/.test(pos);
 const creator=/^(MEI|CAM|AM|MO|MP)$/.test(pos);
 const winger=/^(PD|PE|RW|LW|ED|EE|PONTA)$/.test(pos);
 const striker=/^(ATA|ST|CF|CA|AV|SA|SEGUNDO ATACANTE)$/.test(pos);
 const type=gk?'gk':defender?'def':holding?'holding':central?'cm':creator?'creator':winger?'wing':striker?'striker':'cm';
 const quality=clamp(.74+(Number(wp.rating||78)-74)*.025,.65,1.40);
 const goalWeight={gk:0,def:.028,holding:.07,cm:.12,creator:.19,wing:.31,striker:.48}[type]*quality;
 const assistWeight={gk:0,def:.065,holding:.11,cm:.21,creator:.35,wing:.22,striker:.13}[type]*quality;
 const gameGoalCeiling={gk:0,def:.125,holding:.18,cm:.27,creator:.25,wing:.56,striker:.74}[type]*quality;
 const gameAssistCeiling={gk:0,def:.2,holding:.33,cm:.48,creator:.46,wing:.45,striker:.34}[type]*quality;
 return {type,goalWeight,assistWeight,gameGoalCeiling,gameAssistCeiling,maxMatchGoals:type==='striker'||type==='wing'?3:type==='creator'?2:type==='gk'?0:1};
}
function recordedLeaderboardStatistics(title,players){
 const s=state.season;if(!s)return new Map();
 let matches=[];
 if(title===s.league?.name&&s.league?.matchLedger?.version===1)matches=s.league.matchLedger.results||[];
 else if(title===s.continental?.name&&s.continental?.phaseLedger?.version===1){
   matches=[...(s.continental.phaseLedger.results||[]),...(s.matchRegistry||[]).filter(m=>m.competition===title&&m.stage&&!/Fase de liga|Fase de grupos/i.test(m.stage))];
 } else matches=(s.matchRegistry||[]).filter(m=>m.competition===title);
 const normalized=x=>normalizeKey(String(x||''));
 const byClub=new Map(),stats=new Map(),fixtureIds=new Set(),teamAppearances=new Map();
 const limit=/UEFA Champions League/i.test(title)?17:/UEFA Europa League|UEFA Conference League/i.test(title)?17:Infinity;
 for(const wp of players){
   const id=normalized(wp.name)+'|'+normalized(wp.club),club=normalized(wp.club);
   if(!club||stats.has(id))continue;
   const row={goals:0,assists:0,games:0},profile=leaderboardPlayerProfile(wp);
   stats.set(id,row);const arr=byClub.get(club)||[];arr.push({wp,id,row,profile});byClub.set(club,arr);
 }
 // Choose from weights, leaving room for unlisted members of the same squad.
 const pick=(options,unlistedWeight,seed,weightName)=>{
   const weights=options.map(x=>Math.max(0,x.profile[weightName]));
   const total=unlistedWeight+weights.reduce((sum,value)=>sum+value,0);
   if(total<=0)return null;
   let draw=(stableHash(seed)%100000)/100000*total;
   for(let i=0;i<options.length;i++){draw-=weights[i];if(draw<0)return options[i];}
   return null; // other, unnamed squad player
 };
 for(const match of matches){
   if(!match?.home||!match?.away)continue;
   const id=String(match.id||'')+'|'+String(match.stage||'')+'|'+match.home+'|'+match.away;
   if(fixtureIds.has(id))continue;fixtureIds.add(id);
   for(const side of ['home','away']){
     const team=match[side],club=normalized(team),group=byClub.get(club)||[];
     if(!group.length)continue;
     const played=(teamAppearances.get(club)||0)+1;teamAppearances.set(club,played);
     if(played>limit)continue;
     const selected=group.filter(x=>{
       // A registered player is not credited with 100% of the club's games.
       const reliability=clamp(.72+(Number(x.wp.rating||78)-70)*.009,.67,.96);
       const present=(stableHash(`${title}|${id}|${side}|${x.id}|appearance`)%10000)/10000<reliability;
       if(present)x.row.games++;
       return present;
     });
     const goals=Math.max(0,Math.floor(Number(match[side+'Goals'])||0));
     const isUserClub=normalized(s.clubAtStart||state.player?.club)===club&&match.source!=='BTL simulação de outras equipes';
     const userGoals=isUserClub?Math.min(goals,Math.max(0,Number(match.playerGoals)||0)):0;
     const userAssists=isUserClub?Math.min(goals-userGoals,Math.max(0,Number(match.playerAssists)||0)):0;
     const otherSquadWeight=Math.max(.35,(11-selected.length)*.19);
     for(let n=0;n<goals-userGoals;n++){
       const options=selected.filter(x=>{
         const maxSeason=x.row.games?Math.min(
           Number.isFinite(limit)?Math.ceil(limit*x.profile.gameGoalCeiling)+1:Infinity,
           Math.floor(x.row.games*x.profile.gameGoalCeiling)+1):0;
         const matchGoals=x._lastMatch===id?x._matchGoals||0:0;
         return x.profile.goalWeight>0&&x.row.goals<maxSeason&&matchGoals<x.profile.maxMatchGoals;
       });
       const scorer=pick(options,otherSquadWeight,`${title}|${id}|${side}|goal|${n}`,'goalWeight');
       if(scorer){
         scorer.row.goals++;scorer._matchGoals=(scorer._lastMatch===id?scorer._matchGoals||0:0)+1;scorer._lastMatch=id;
       }
       // Only registered chances can create a named assist; another squad
       // member may instead be responsible for it.
       if(n>=userAssists&&stableHash(`${title}|${id}|${side}|assist|${n}`)%100<64){
         const choices=selected.filter(x=>{
           if(x===scorer||x.profile.assistWeight<=0)return false;
           const maxAssist=Math.floor(x.row.games*x.profile.gameAssistCeiling)+1;
           return x.row.assists<maxAssist;
         });
         const assister=pick(choices,otherSquadWeight,`${title}|${id}|${side}|assister|${n}`,'assistWeight');
         if(assister)assister.row.assists++;
       }
     }
   }
 }
 return stats;
}

function leaderboardCandidates(title){
  const s=state.season,p=state.player;if(!s||!p||!title)return [];
  const players=ensureWorldPlayers().filter(wp=>wp&&!wp.retired&&!!wp.club);
  const normalizeClub=n=>normalizeKey(String(n||''));
  const allowed=clubsForLeaderboardCompetition(title);
  const country=String(s.countryAtStart||p.clubCountry||'');
  const fromClubSet=(clubSet,max=80)=>players.filter(wp=>clubSet.has(normalizeClub(wp.club))).slice(0,max);
  if(title===s.league?.name){
    const leagueClubs=new Set((s.league?.teams||s.league?.clubs||[]).map(t=>normalizeClub(typeof t==='string'?t:t.name)).filter(Boolean));
    for(const club of (allowed||[]))leagueClubs.add(normalizeClub(club));
    return players.filter(wp=>wp.countryCode===country&&leagueClubs.has(normalizeClub(wp.club))).slice(0,80);
  }
  if(title===s.leagueCup?.name){const clubs=new Set([...(allowed||[])].map(normalizeClub));return players.filter(wp=>wp.countryCode==='ENG'&&clubs.has(normalizeClub(wp.club))).slice(0,100);}
  if(title===s.cup?.name){
    const countryClubs=new Set((leaguePoolForCountry(country,p.club,s.league?.name)||[]).map(normalizeClub));
    if(!countryClubs.size && allowed?.size) for(const club of allowed) countryClubs.add(normalizeClub(club));
    return players.filter(wp=>wp.countryCode===country&&countryClubs.has(normalizeClub(wp.club))).slice(0,80);
  }
  const supercup=(s.superCups||[]).find(sc=>sc.name===title);
  if(supercup){
    if(!supercup.opponent)supercup.opponent=superCupOpponent(supercup);
    if(/Finalissima/i.test(title)){
      const codes=new Set([p.nationalityCode,supercup.opponent?.code].filter(Boolean));
      return players.filter(wp=>codes.has(wp.nationalCode||wp.countryCode)).slice(0,50);
    }
    if(supercup.scope==='national'){
      const codes=new Set([p.nationalityCode,supercup.opponent?.code].filter(Boolean));
      return players.filter(wp=>codes.has(wp.nationalCode||wp.countryCode)).slice(0,60);
    }
    const clubSet=new Set([normalizeClub(p.club),normalizeClub(supercup.opponent?.name||supercup.opponent)]);
    return fromClubSet(clubSet,60);
  }
  if(title===s.continental?.name){
    const clubs=new Set([...(allowed||[])].map(normalizeClub));
    const region=/UEFA/i.test(title)?'UEFA':/CONMEBOL/i.test(title)?'CONMEBOL':
      /CONCACAF/i.test(title)?'CONCACAF':/AFC/i.test(title)?'AFC':
      /CAF/i.test(title)?'CAF':/OFC/i.test(title)?'OFC':'';
    // Homonymous clubs do not inherit qualification from another continent.
    return players.filter(wp=>clubs.has(normalizeClub(wp.club))&&(!region||confederation(wp.countryCode)===region)).slice(0,100);
  }
  if(/World Cup|Copa do Mundo/i.test(title)){
    const wc=s.worldCup;const participants=new Set([
      ...(wc?.groups||[]).flatMap(group=>Array.isArray(group)?group:group?.teams||[]),
      ...(wc?.qualifiedTeams||[]),...(wc?.participants||[])
    ].map(v=>typeof v==='string'?v:v?.code||v?.countryCode||'').filter(Boolean));
    // Não há artilharia automática se os participantes reais da edição
    // ainda não foram definidos; nunca usar toda a base de seleções.
    return participants.size?players.filter(wp=>participants.has(wp.nationalCode||wp.countryCode)).slice(0,80):[];
  }
  if(/EURO|Nations|Copa América/i.test(title)){
    const tournament=s.nationalCalendar?.tournament;
    const field=new Set(tournament?.competition===title?(tournament?.participantCodes||[]):[]);
    // O motor só simula as partidas da seleção do jogador, não todo o
    // torneio. Portanto, não atribuir gols a seleções não participantes.
    return field.size?players.filter(wp=>field.has(wp.nationalCode||wp.countryCode)).slice(0,80):[];
  }
  return [];
}

function leaderboardTeamVisual(row,title=''){
  const national=/World Cup|Copa do Mundo|EURO|Copa América|Nations|Finalissima/i.test(title);
  if(national){const code=row.nationalCode||codeForCountryName(row.team||'');return `<span class="leaderboard-team-visual national" title="${esc(row.team||'Seleção')}">${nationalFlagImage(code,row.team||'Seleção')}</span>`;}
  const team=row.team||row.club||'Clube';
  const expectedCountry=/^Athletic(?: Club)?$/i.test(team)&&/UEFA|LaLiga|Hypermotion|Copa do Rei|Copa del Rey/i.test(title)?'ES':(row.countryCode||canonicalClubCountryCode(team,''));
  return `<span class="leaderboard-team-visual club" title="${esc(team)}">${clubCrestMarkup(team,expectedCountry)}</span>`;
}
function userEligibleForLeaderboard(title,stat={}){
  const s=state.season,p=state.player;if(!s||!p||!title)return false;
  // A played match is a genuine historic appearance, even after a later transfer.
  if(Number(stat.games||0)>0)return true;
  // With zero appearances do not fabricate a participant from a foreign league.
  const isNational=/World Cup|Copa do Mundo|EURO|Copa América|Nations|Finalissima/i.test(title);
  if(isNational)return false;
  const normalizeClub=name=>normalizeKey(String(name||''));
  const allowed=clubsForLeaderboardCompetition(title);
  if(title===s.league?.name){
    const clubs=(s.league.teams||s.league.clubs||[]).map(t=>normalizeClub(typeof t==='string'?t:t.name));
    if(allowed)clubs.push(...[...allowed].map(normalizeClub));
    return String(s.countryAtStart||p.clubCountry||'')===String(p.clubCountry||'')&&clubs.includes(normalizeClub(p.club));
  }
  if(title===s.leagueCup?.name)return String(s.countryAtStart||p.clubCountry||'')==='ENG'&&(!allowed?.size||allowed.has(p.club));
  if(title===s.cup?.name)return String(s.countryAtStart||p.clubCountry||'')===String(p.clubCountry||'')&&(!allowed?.size||allowed.has(p.club));
  if(allowed)return allowed.has(p.club);
  return false;
}
function renderCompetitionLeaderboards(){
  const tabs=$('#leaderboard-competition-tabs'),box=$('#competition-leaderboard');if(!tabs||!box)return;const s=state.season,p=state.player;if(!s||!p){tabs.innerHTML='';box.innerHTML='<p class="muted">Inicie uma temporada para acompanhar artilharia e assistências.</p>';return;}
  const comps=[...new Set(competitionStatus().map(x=>x.title).filter(Boolean))];if(!comps.length){box.innerHTML='<p class="muted">Sem competições ativas.</p>';return;}if(!leaderboardCompetition||!comps.includes(leaderboardCompetition))leaderboardCompetition=comps[0];
  tabs.innerHTML=comps.map(c=>`<button type="button" class="${c===leaderboardCompetition?'active':''}" data-leader-competition="${esc(c)}">${esc(c)}</button>`).join('');
  $$('.leaderboard-mode-tabs [data-leader-mode]').forEach(btn=>btn.classList.toggle('active',btn.dataset.leaderMode===leaderboardMode));
  const candidates=leaderboardCandidates(leaderboardCompetition),ledgerStats=recordedLeaderboardStatistics(leaderboardCompetition,candidates);
  const rows=candidates.map(wp=>{
    const key=normalizeKey(String(wp.name||''))+'|'+normalizeKey(String(wp.club||''));
    const stat=ledgerStats.get(key)||{goals:0,assists:0,games:0};
    return {...wp,...stat,team:wp.club||countryByCode(wp.nationalCode)?.name||'—'};
  });
  const userStat=s.competitionStats?.[leaderboardCompetition]||{games:0,goals:0,assists:0};
  if(userEligibleForLeaderboard(leaderboardCompetition,userStat)){
    const currentAllowed=clubsForLeaderboardCompetition(leaderboardCompetition);
    const countryCup=/World Cup|Copa do Mundo|EURO|Copa América|Nations|Finalissima/i.test(leaderboardCompetition);
    const playedAtPreviousClub=(userStat.games||0)>0&&currentAllowed?.size&&!currentAllowed.has(p.club);
    const userClub=playedAtPreviousClub?(s.clubAtStart||p.club):p.club;
    rows.push({id:'user',name:p.name,rating:p.overall,position:rankingPositionLabel(p.position),club:userClub,team:countryCup?p.nationality:userClub,games:userStat.games||0,goals:userStat.goals||0,assists:userStat.assists||0,isUser:true});
  }
  let ordered=rows.sort((a,b)=>(b[leaderboardMode]||0)-(a[leaderboardMode]||0)||(b.goals||0)-(a.goals||0)||(b.rating||0)-(a.rating||0));ordered=ordered.filter(r=>Number(r[leaderboardMode]||0)>0);const top=ordered.slice(0,8),userIndex=ordered.findIndex(x=>x.isUser);if(userIndex>=8)top.push({...ordered[userIndex],shownRank:userIndex+1});
  box.innerHTML=`<div class="leaderboard-head"><span>#</span><span>Jogador</span><span>Equipe</span><span>${leaderboardMode==='goals'?'Gols':'Assist.'}</span></div>${top.map((r,i)=>`<div class="leaderboard-row ${r.isUser?'is-user':''}"><b>${r.shownRank||i+1}</b><span><strong>${esc(r.name)}</strong></span>${leaderboardTeamVisual(r,leaderboardCompetition)}<strong>${r[leaderboardMode]||0}</strong></div>`).join('')}`;hydratePenaltyBadges(box);
  tabs.querySelectorAll('[data-leader-competition]').forEach(btn=>btn.addEventListener('click',()=>{leaderboardCompetition=btn.dataset.leaderCompetition;renderCompetitionLeaderboards();}));
  $$('.leaderboard-mode-tabs [data-leader-mode]').forEach(btn=>btn.onclick=()=>{leaderboardMode=btn.dataset.leaderMode;renderCompetitionLeaderboards();});
}
function renderHomeHub(){
  const face=$('#home-career-face'),name=$('#home-current-player'),club=$('#home-career-club'),meta=$('#home-career-meta'),status=$('#home-career-status');
  const ovr=$('#home-career-overall'),year=$('#home-career-season'),titles=$('#home-career-titles'),fill=$('#home-career-progress-fill'),label=$('#home-career-progress-label');
  if(!face||!name)return;
  if(!state.created||!state.player){
    face.classList.remove('face-avatar');face.innerHTML='<span>10</span>';name.textContent='Crie sua lenda';club.textContent='SEM CLUBE';meta.textContent='';status.textContent='NOVA';
    if(ovr)ovr.textContent='68';if(year)year.textContent='—';if(titles)titles.textContent='0';if(fill)fill.style.width='8%';if(label)label.textContent='';return;
  }
  const p=state.player,s=state.season,seasons=(state.history||[]).length;
  face.innerHTML=appearanceMarkup(p.appearance,true,p.number||10);face.classList.add('face-avatar');
  name.textContent=p.name;club.textContent=p.club||'SEM CLUBE';meta.textContent='';status.textContent=p.retired?'ENCERRADA':'ATIVA';
  if(ovr)ovr.textContent=p.overall;if(year)year.textContent=s?.year||p.retiredAge||'—';if(titles)titles.textContent=(p.trophies||[]).length;
  if(fill)fill.style.width=`${clamp(12+seasons*5,12,100)}%`;if(label)label.textContent='';
}

function renderAccountPanel(){
  const account=window.BTLAuth?.getCurrentAccount?.();if(!account)return;
  const method=account.type==='google'?'Google':account.type==='guest'?'Convidado':'Conta local';
  const fmt=iso=>{if(!iso)return '—';const d=new Date(iso);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('pt-BR');};
  const nick=$('#legacy-account-nickname'),id=$('#legacy-account-id'),meth=$('#legacy-account-method'),email=$('#legacy-account-email'),created=$('#legacy-account-created'),session=$('#legacy-account-session'),top=$('#account-top-nickname');
  if(nick)nick.textContent=account.nickname||'Jogador';if(id)id.textContent=String(account.id8||'').padStart(8,'0');if(meth)meth.textContent=method;if(email)email.textContent=account.email||account.contactEmail||'E-mail não vinculado';if(created)created.textContent=fmt(account.createdAt);if(session)session.textContent=fmt(window.BTLAuth?.getSession?.()?.expiresAt);if(top)top.textContent=account.nickname||'Legado';
  const contactName=$('#contact-name'),contactEmail=$('#contact-email');if(contactName&&!contactName.value)contactName.value=account.nickname||'';if(contactEmail&&!contactEmail.value)contactEmail.value=account.email||account.contactEmail||'';
}

// V26: conferir os DOIS escudos antes de revelar uma decisão.
// Promessas são compartilhadas entre o próximo jogo, a decisão e o placar.
const decisionCrestLoaded=new Set();
const decisionCrestInFlight=new Map();
const decisionCrestRecentFailure=new Map();
let decisionCrestGateSequence=0;
const penaltyCrestGatePassed=new WeakSet();
function decisionClubCountry(name,event={}){
  const competition=String(event?.competition||'');
  if(/^Athletic(?: Club)?$/i.test(name)){
    if(/UEFA|LaLiga|Hypermotion|Copa do Rei|Copa del Rey/i.test(competition))return 'ES';
    if(/Brasileir|Série B|Copa do Brasil/i.test(competition))return 'BR';
  }
  return canonicalClubCountryCode(name,'');
}
function preloadDecisionCrest(name,event){
  const country=decisionClubCountry(name,event);
  const source=safeBadgeImage(window.BTLStaticCrests?.resolve(name,country)||'');
  if(!source)return Promise.resolve({name,ok:false,reason:'not-in-catalog'});
  if(decisionCrestLoaded.has(source))return Promise.resolve({name,ok:true,source});
  if(decisionCrestInFlight.has(source))return decisionCrestInFlight.get(source).then(ok=>({name,ok,source}));
  const promise=new Promise(resolve=>{
    const picture=new Image();let finished=false;
    const finish=ok=>{if(finished)return;finished=true;clearTimeout(timer);picture.onload=null;picture.onerror=null;if(ok){decisionCrestLoaded.add(source);decisionCrestRecentFailure.delete(source);}else decisionCrestRecentFailure.set(source,Date.now());resolve(ok);};
    const timer=setTimeout(()=>finish(false),7000);
    picture.onload=()=>finish(picture.naturalWidth>0&&picture.naturalHeight>0);
    picture.onerror=()=>finish(false);
    picture.src=source;
    if(picture.complete&&picture.naturalWidth)finish(true);
  }).finally(()=>decisionCrestInFlight.delete(source));
  decisionCrestInFlight.set(source,promise);
  return promise.then(ok=>({name,ok,source}));
}
function preloadUpcomingMatchCrests(event){
  if(!event||event.type==='national')return;
  for(const name of [...new Set([event.home,event.away].filter(Boolean))]){
    const country=decisionClubCountry(name,event);const src=safeBadgeImage(window.BTLStaticCrests?.resolve(name,country)||'');
    if(src&&Date.now()-(decisionCrestRecentFailure.get(src)||0)<60000)continue;
    void preloadDecisionCrest(name,event);
  }
}
function checkMatchCrestsBeforeDecision(event,onReady){
  if(!event||event.type==='national'){onReady(false);return;}
  const gate=++decisionCrestGateSequence;
  const modal=$('#match-decision-modal');
  const names=[...new Set([event.home,event.away].filter(Boolean))];
  if(names.length!==2){onReady(true);return;}
  $('#decision-competition').innerHTML=competitionHeaderMarkup(event.competition||'Partida',event.stage||'');
  $('#decision-title').textContent='Preparando o confronto';
  $('#decision-match').innerHTML=decisionFixtureMarkup(event);hydrateNextMatchBadges();
  $('#decision-description').textContent='';
  $('#decision-continue').classList.add('hidden');
  $('#decision-result').classList.add('hidden');
  const visual=$('#decision-visual');visual.className='decision-visual btl-crest-gate';
  visual.innerHTML=`<div class="btl-crest-gate-content"><span class="btl-crest-gate-mark" aria-hidden="true">⚽</span><strong>Conferindo os escudos dos clubes</strong><span>${names.map(esc).join(' × ')}</span></div>`;
  const choices=$('#decision-choices');choices.className='event-choices';choices.replaceChildren();
  modal.classList.remove('hidden');
  Promise.all(names.map(name=>preloadDecisionCrest(name,event))).then(results=>{
    if(gate!==decisionCrestGateSequence||modal.classList.contains('hidden'))return;
    if(results.every(r=>r.ok)){onReady(false);return;}
    const missing=results.filter(r=>!r.ok).map(r=>r.name);
    $('#decision-title').textContent='Verificação de escudos';
    visual.innerHTML=`<div class="btl-crest-gate-content"><span class="btl-crest-gate-mark" aria-hidden="true">⚽</span><strong>Escudo não carregado: ${missing.map(esc).join(', ')}</strong><span>Você pode tentar novamente ou identificar os times pelo nome.</span></div>`;
    choices.innerHTML='<button type="button" class="primary" data-crest-retry>Tentar carregar escudos</button><button type="button" class="secondary" data-crest-names>Continuar com nomes dos clubes</button>';
    choices.querySelector('[data-crest-retry]').addEventListener('click',()=>checkMatchCrestsBeforeDecision(event,onReady));
    choices.querySelector('[data-crest-names]').addEventListener('click',()=>onReady(true));
  }).catch(()=>{if(gate===decisionCrestGateSequence){visual.textContent='Não foi possível verificar os escudos. Os nomes dos clubes permanecem disponíveis.';choices.innerHTML='<button type="button" class="secondary" data-crest-names>Continuar com nomes dos clubes</button>';choices.querySelector('[data-crest-names]').addEventListener('click',()=>onReady(true));}});
}
function nextMatchTeamMarkup(name,event){
  if(event?.type==='national'){
    const code=name===state.player?.nationality?state.player?.nationalityCode:(event.opponent===name?event.opponentCode:codeForCountryName(name));
    return `<span class="next-team-visual national" title="${esc(name)}" aria-label="${esc(name)}">${nationalFlagImage(code,name)}</span>`;
  }
  const code=decisionClubCountry(name,event);
  const source=safeBadgeImage(window.BTLStaticCrests?.resolve(name,code)||'');
  const ready=source&&decisionCrestLoaded.has(source);
  const safeName=esc(name);
  // A imagem só fica visível quando já foi carregada. Em caso de erro,
  // o NOME do clube substitui o escudo, nunca um símbolo sem significado.
  return `<span class="next-team-visual club" data-next-club="${safeName}" data-next-country="${esc(code)}" title="${safeName}" aria-label="${safeName}"><span class="crest-shell"><img class="club-badge-img ${ready?'':'hidden'}" ${ready?`src="${esc(source)}"`:''} alt="Escudo de ${safeName}"><span class="crest-fallback ${ready?'hidden':''}" title="Escudo indisponível; clube identificado pelo nome">${safeName}</span></span></span>`;
}
function hydrateNextMatchBadges(){document.querySelectorAll('[data-next-club]').forEach(el=>hydrateBadge(el.querySelector('img'),el.dataset.nextClub,el.querySelector('.crest-fallback'),el.dataset.nextCountry||''));}
// Always show the actual participants, not only the tournament badge.
// Keeps club names readable on mobile and works without external crest images.
function decisionFixtureMarkup(event={}){
  const teams=[event.home,event.away];
  if(!teams[0]||!teams[1])return '';
  return `<span class="btl-decision-fixture" aria-label="${esc(teams[0])} contra ${esc(teams[1])}">${teams.map((name,index)=>
    `${index?'<span class="btl-decision-versus" aria-hidden="true">×</span>':''}<span class="btl-decision-fixture-team">${nextMatchTeamMarkup(name,event)}<strong class="btl-decision-fixture-name">${esc(name)}</strong></span>`).join('')}</span>`;
}
function decisionScoreboardMarkup(log){
  const compMarkup=competitionHeaderMarkup(log.event.competition||'Partida',log.event.stage||'');
  return `<div class="decision-scoreboard"><div class="decision-score-meta">${compMarkup}</div><div class="decision-score-main"><div class="decision-score-team">${nextMatchTeamMarkup(log.event.home,log.event)}</div><div class="decision-score-numbers"><small>PLACAR</small><b>${log.homeGoals}<i>×</i>${log.awayGoals}</b></div><div class="decision-score-team">${nextMatchTeamMarkup(log.event.away,log.event)}</div></div></div>`;
}
function syncViewportMetrics(){const topbar=document.querySelector('.topbar');document.documentElement.style.setProperty('--app-topbar-height',`${topbar?.offsetHeight||72}px`);}
function render(){
  syncViewportMetrics();enhanceAllSelects();syncCustomSelects();renderHomeHub();renderAccountPanel();
  document.body.classList.toggle('home-screen',!!$('#home')?.classList.contains('active'));
  $('#home-new-career')?.classList.remove('hidden');
  const activeCareer=!!(state.created&&state.player&&!state.player.retired);document.body.classList.toggle('career-mode',activeCareer);const homeNav=$('#nav [data-view="home"]');if(homeNav)homeNav.classList.remove('hidden');
  const startLabel=$('#start-btn b'),startHint=$('#start-btn small');if(startLabel)startLabel.textContent='Continuar carreira';if(startHint)startHint.textContent=state.created?'Voltar ao vestiário e seguir a temporada':'Criar jogador e iniciar sua trajetória';$$('.game-menu-entry[data-view="stats"],.game-menu-entry[data-view="market"],.football-menu-option[data-view="stats"],.football-menu-option[data-view="market"]').forEach(btn=>btn.disabled=!state.created);
  if(!state.created){renderSavedCareers();$('#mini-profile').classList.add('hidden');$('#reset-career').classList.add('hidden');if($('#home')?.classList.contains('active'))applyStartTheme();else applyClubTheme(null);return;}
  const p=state.player,s=state.season;$('#mini-profile').classList.remove('hidden');$('#reset-career').classList.remove('hidden');$('#mini-profile').textContent=`${p.name} · ${p.overall}`;
  $('#p-name').textContent=p.name;$('#p-pos').textContent=p.position;$('#p-age').textContent=p.age;$('#p-country').textContent=p.nationality;$('#p-birthdate').textContent=formatDateBR(p.birthdate);$('#p-overall').textContent=p.overall;$('#p-potential').textContent=p.potential;$('#p-club').textContent=p.club;$('#p-league').textContent=s?.league?.name||p.clubLeague||clubCompetitionProfile(p.club,p.clubCountry).league;$('#p-value').textContent=money(p.value);$('#avatar').innerHTML=appearanceMarkup(p.appearance,true,p.number||10);$('#avatar').classList.add('face-avatar');const sponsorChip=$('#p-sponsor-chip');sponsorChip?.classList.toggle('hidden',!p.sponsor?.brand);if($('#p-sponsor'))$('#p-sponsor').innerHTML=p.sponsor?.brand?`${sponsorWordmark(p.sponsor.brand)}<span>${esc(p.sponsor.brand)}</span>`:'';const idolChip=$('#p-idol-chip');idolChip?.classList.toggle('hidden',!p.idol?.name);if($('#p-idol'))$('#p-idol').textContent=p.idol?.name||'';const injuryChip=$('#p-injury-chip');injuryChip?.classList.toggle('hidden',!(p.injuryGames>0));if($('#p-injury-status'))$('#p-injury-status').textContent=p.injuryGames>0?`${p.injuryGames} jogo(s) fora`:'';
  const attrs=ensureAttributeOverallSync(p)||normalizePlayerAttributes(p),origins=p.attributeOrigins||{};
  const dna=p.dnaAttributes||attrs,renderFields=attributeFieldsForPosition(p.position),primaryId=primaryAttributeForPosition(p.position);$('#player-attributes').innerHTML=renderFields.map(f=>`<div class="player-attribute ${f.id===primaryId?'role-primary':''}"><span><em>${ATTRIBUTE_ICONS[f.id]||'•'}</em>${f.short}${f.id===primaryId?' ★':''}</span><strong>${attributeDisplayValue(f.id,attrs[f.id])}</strong><small>${origins[f.id]?.legend?`DNA ${attributeDisplayValue(f.id,dna[f.id])} · ${origins[f.id].legend}`:f.label}</small></div>`).join('');
  $('#retire-career').classList.toggle('hidden',p.retired||p.age<=30);$('#edit-appearance')?.classList.toggle('hidden',p.retired);
  hydrateBadge($('#p-club-badge'),p.club,$('#p-club-fallback'),p.clubCountry);
  $('#retired-banner').classList.toggle('hidden',!p.retired);if(p.retired)$('#retired-text').textContent=` ${p.name} se aposentou aos ${p.age} anos.`;
  if(s){
    $('#season-year').textContent=s.year;$('#s-games').textContent=s.totalGames;$('#s-goals').textContent=s.goals;$('#s-assists').textContent=s.assists;$('#s-rating').textContent=s.totalGames?(s.ratingSum/s.totalGames).toFixed(1):'-';
    $('#league-round-label').textContent=`${s.league.name}: ${s.league.index}/${s.league.schedule.length} jogos`;$('#league-points').textContent=`${s.league.points} pts`;$('#league-progress-bar').style.width=`${Math.round(s.league.index/s.league.schedule.length*100)}%`;
    $('#season-progress').textContent=s.closed?'Temporada encerrada':seasonComplete()?'Calendário concluído':'Pronta para simular';
    $('#finish-season').disabled=!s.closed||p.retired;$('#finish-season').textContent=s.closed?'Avançar para próxima temporada →':'Simule a temporada primeiro';
    nextEventCache=!s.closed?chooseNextEvent():null;
    if(nextEventCache){
      $('#home-team').innerHTML=nextMatchTeamMarkup(nextEventCache.home,nextEventCache);$('#away-team').innerHTML=nextMatchTeamMarkup(nextEventCache.away,nextEventCache);$('#match-title').textContent=`${nextEventCache.competition}`;$('#match-competition').textContent=nextEventCache.competition;$('#match-context').textContent=nextEventCache.type==='league'?`Rodada ${nextEventCache.round} de ${s.league.schedule.length}`:nextEventCache.stage||`Temporada ${s.year}`;setTimeout(hydrateNextMatchBadges,0);preloadUpcomingMatchCrests(nextEventCache);
      $('#favorite-line').textContent='';$('#favorite-percent').textContent='';$('#favorite-meter-fill').style.width='0%';$('#strength-line').textContent='';
      $('#simulate-btn').disabled=p.retired;$('#simulate-btn').textContent='Simular temporada →';
    }else{
      $('#match-title').textContent=s.closed?'Mercado aberto':'Temporada pronta para ser encerrada';$('#home-team').textContent='';$('#away-team').textContent='';$('#match-competition').textContent='';$('#match-context').textContent=s.closed?'Veja as propostas e depois avance para a próxima temporada.':'';$('#favorite-line').textContent='';$('#favorite-percent').textContent='';$('#favorite-meter-fill').style.width='0%';$('#strength-line').textContent='';$('#simulate-btn').disabled=true;$('#simulate-btn').textContent=s.closed?'Temporada simulada':'Sem partidas pendentes';
    }
    $('#competitions-list').innerHTML=competitionStatus().map(c=>`<div class="competition-item ${c.type==='continental'?'international':''}">${honourVisual(c.title)}<div><strong>${c.title}</strong><small>${c.status}</small></div></div>`).join('');
  }else{
    $('#season-year').textContent='—';$('#s-games').textContent='0';$('#s-goals').textContent='0';$('#s-assists').textContent='0';$('#s-rating').textContent='—';$('#league-round-label').textContent='Carreira encerrada';$('#league-points').textContent='';$('#league-progress-bar').style.width='100%';$('#season-progress').textContent='Aposentado';$('#finish-season').disabled=true;$('#finish-season').textContent='Carreira encerrada';$('#competitions-list').innerHTML='<div class="competition-item"><strong>👟 Carreira concluída</strong><small>Veja o histórico completo na aba Estatísticas.</small></div>';$('#match-title').textContent='Carreira encerrada';$('#home-team').textContent='';$('#away-team').textContent='';$('#match-competition').textContent='';$('#match-context').textContent='';$('#favorite-line').textContent='';$('#favorite-percent').textContent='';$('#favorite-meter-fill').style.width='0%';$('#strength-line').textContent='';$('#simulate-btn').disabled=true;$('#simulate-btn').textContent='Aposentado';
  }
  if($('#home')?.classList.contains('active'))applyStartTheme();else {document.body.classList.remove('btl-start-theme');applyClubTheme(p.club);}
  if(!$('#match-decision-modal')?.classList.contains('hidden')&&state.pendingMatchDecision)applyCompetitionExperienceTheme(state.pendingMatchDecision.event);
  if(!$('#match-decision-modal')?.classList.contains('hidden')&&state.pendingPenaltyShootout)applyCompetitionExperienceTheme(state.pendingPenaltyShootout);
  $('#national-country').textContent=`Seleção de ${p.nationality}`;$('#national-flag').innerHTML=nationalFlagImage(p.nationalityCode,p.nationality);
  const wcStatus=s&&isWorldCupYear(s.year)?ensureWorldCupState(s,p):null;
  const calendarStatus=s?nationalCalendarStatusText(s,p):'';
  const wcOngoing=!!(wcStatus&&wcStatus.active&&!wcStatus.finished);
  $('#national-status').textContent=p.calledUp?(wcOngoing?`Copa do Mundo · ${worldCupStatusText(wcStatus)}`:(calendarStatus||'Convocado')):'Fora da lista';
  const wcHostNote=s&&isWorldCupYear(s.year)?` · Sede: ${worldCupHostShortLabel(s.year)}`:'';
  $('#national-message').textContent='';
  const trust=clamp(p.nationalTrust||0,0,100);$('#national-trust-fill').style.width=`${trust}%`;$('#national-trust-label').textContent=`${trust}%`;$('#nt-games').textContent=p.nationalTeamGames;$('#nt-goals').textContent=p.nationalTeamGoals;$('#national-role').textContent=nationalRoleForPlayer(p);const nationalAction=$('#national-action');if(nationalAction){nationalAction.classList.add('hidden');nationalAction.disabled=true;}
  const newsIcon=n=>/les[aã]o|tratamento|fora/i.test(n)?'✚':/campe[aã]o|t[ií]tulo|trof[eé]u/i.test(n)?'★':/sele[cç][aã]o|convoca/i.test(n)?'◉':/proposta|mercado|clube/i.test(n)?'↗':'●';
  $('#news').innerHTML=(state.news.slice(-4).reverse().map(n=>`<div class="news-item compact"><span class="news-icon">${newsIcon(n)}</span><div><strong>${n}</strong></div></div>`).join('')||'<div class="empty-visual">○<span>Sem notícias</span></div>');
  renderSavedCareers();
  renderCompetitionLeaderboards();animateSeasonDashboard();syncPausedOverlayButton();renderHistory();renderOffers();renderHonours();renderMarketTier();renderWorldOverview();if(state.pendingEvent&&!pausedCareerOverlay&&!state.journeyPaused)openPendingEvent();
}
function renderHistory(){
  if(!state.created)return;const current=state.season&&!state.season.closed?state.season:{clubGames:0,clubGoals:0,clubAssists:0};const totals=state.history.reduce((a,h)=>({games:a.games+h.games,goals:a.goals+h.goals,assists:a.assists+h.assists}),{games:current.clubGames||0,goals:current.clubGoals||0,assists:current.clubAssists||0});
  $('#career-games').textContent=totals.games;$('#career-goals').textContent=totals.goals;$('#career-assists').textContent=totals.assists;$('#career-titles').textContent=state.player.titles||0;
  $('#history-body').innerHTML=state.history.length?state.history.slice().reverse().map(h=>`<tr><td>${h.year}</td><td>${h.club}</td><td>${h.overall}</td><td>${h.games}</td><td>${h.goals}</td><td>${h.assists}</td><td>${h.rating}</td><td>${h.leaguePosition?`${h.leaguePosition}º`: '-'}</td></tr>`).join(''):'<tr><td colspan="8" class="muted">Conclua sua primeira temporada para criar o histórico.</td></tr>';
}
function renderHonours(){
  if(!state.created)return;const p=state.player;
  $('#trophies-list').innerHTML=p.trophies?.length?p.trophies.slice().reverse().map(t=>`<div class="honour-row">${honourVisual(t.name)}<span><b>${t.name}</b><small>Título conquistado</small></span><strong>${t.year}</strong></div>`).join(''):'<p class="muted">Nenhum título ainda.</p>';
  $('#awards-list').innerHTML=p.awards?.length?p.awards.slice().reverse().map(a=>`<div class="honour-row">${honourVisual(a.name)}<span><b>${a.name}</b><small>Prêmio individual</small></span><strong>${a.year}</strong></div>`).join(''):'<p class="muted">Nenhum prêmio individual ainda.</p>';
}
function getSavedCareers(){ state.savedCareers=Array.isArray(state.savedCareers)?state.savedCareers:[]; return state.savedCareers; }
function savedCareerTitleCounts(c){
  const map=new Map();
  if(c?.titleCounts&&typeof c.titleCounts==='object'){
    Object.entries(c.titleCounts).forEach(([name,n])=>{
      const value=Math.max(0,Number(n)||0);
      if(name&&value)map.set(name,value);
    });
  }
  (c?.trophies||[]).forEach(t=>{
    const name=(t?.name||'Título').trim();
    if(!name)return;
    // Trophies are the source of truth for new saves. Avoid double-counting
    // when a persisted titleCounts map is already present.
    if(!c?.titleCounts)map.set(name,(map.get(name)||0)+1);
  });
  return [...map.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'pt-BR'));
}
function savedCareerTotalTitles(c){
  const counts=savedCareerTitleCounts(c);
  if(counts.length)return counts.reduce((sum,[,n])=>sum+(Number(n)||0),0);
  return Math.max(0,Number(c?.titles)||0);
}
const ICON_POSITION_CODES={
  'Goleiro':'GK','Zagueiro':'ZAG','Lateral direito':'LD','Lateral esquerdo':'LE','Volante':'VOL','Meia central':'MC','Meia ofensivo':'MEI','Meia direita':'MD','Meia esquerda':'ME','Segundo atacante':'SA','Ponta direita':'PD','Ponta esquerda':'PE','Centroavante':'ATA'
};
function estimateIconAttributes(overall=80,position='Centroavante'){
  const o=clamp(Number(overall)||80,45,99);
  if(position==='Goleiro')return syncGoalkeeperCompatibility({reflexes:clamp(o+4,35,99),positioning:clamp(o+3,35,99),diving:clamp(o+3,35,99),handling:clamp(o+2,35,99),speed:clamp(o-9,35,92),kicking:clamp(o-1,35,99),physical:clamp(o+2,35,99)});
  const defensive=['Zagueiro','Lateral direito','Lateral esquerdo','Volante'].includes(position),wing=/Ponta|Lateral|Meia direita|Meia esquerda/.test(position),mid=/Meia|Volante/.test(position);
  return {pace:clamp(o+(wing?5:position==='Centroavante'?1:defensive?-1:2),35,99),finishing:clamp(o+(['Centroavante','Segundo atacante'].includes(position)?5:/Ponta/.test(position)?2:defensive?-10:-1),35,99),passing:clamp(o+(mid?5:defensive?-2:1),35,99),dribbling:clamp(o+(/Ponta|Meia ofensivo/.test(position)?5:defensive?-7:1),35,99),defense:clamp(o+(defensive?6:-16),30,99),physical:clamp(o+(position==='Zagueiro'||position==='Centroavante'?5:defensive?3:0),35,99)};
}
function buildCareerIconCardSnapshot(p=state.player){
  if(!p)return null;
  const peak=Math.max(p.overall||0,...(state.history||[]).map(h=>Number(h.overall)||0));
  const attrs={...normalizePlayerAttributes(p)},retirementRecovery=Math.max(0,peak-(p.overall||peak));
  const trophies=(p.trophies||[]),awards=(p.awards||[]),career=careerTotals();
  const major=trophies.filter(t=>/World Cup|Champions|Libertadores|Club World Cup|Copa do Mundo/i.test(t.name||'')).length;
  let iconBonus=0;
  if(peak>=88&&trophies.length>=4)iconBonus++;
  if(peak>=90&&(awards.length>=2||major>=1))iconBonus++;
  if(peak>=91&&major>=2)iconBonus++;
  if(peak>=92&&((career.goals||0)+(career.assists||0)>=350||awards.some(a=>/Bola de Ouro|Ballon/i.test(a.name||''))))iconBonus++;
  const iconOverall=clamp(peak+iconBonus,80,99);
  const iconLift=Math.max(0,iconOverall-peak);
  const prime={},iconFields=p.position==='Goleiro'?GOALKEEPER_ATTRIBUTE_DRAFT_FIELDS.map(f=>f.id):['pace','finishing','passing','dribbling','defense','physical'];
  iconFields.forEach(id=>{const positionEstimate=estimateIconAttributes(iconOverall,p.position)[id];const restored=(attrs[id]||peak)+retirementRecovery*((id==='pace'||id==='speed'||id==='physical')?1.15:1)+iconLift*.75;prime[id]=clamp(Math.round(Math.max(restored,positionEstimate-2)),30,99);});
  if(p.position==='Goleiro')syncGoalkeeperCompatibility(prime);
  return {overall:iconOverall,careerPeak:peak,position:p.position,positionCode:ICON_POSITION_CODES[p.position]||'MC',nationality:p.nationality,nationalityCode:p.nationalityCode||'',name:p.name,number:p.number||10,appearance:normalizeAppearance(p.appearance||{}),attributes:prime,weakFoot:attrs.weakFoot||4,createdYear:state.season?.year||null};
}
function iconCardFromArchive(c={}){
  if(c.iconCard?.attributes)return c.iconCard;const overall=Number(c.peak||c.overall)||80,position=c.position||'Centroavante';
  const attrs=c.attributes?{...estimateIconAttributes(overall,position),...c.attributes}:estimateIconAttributes(overall,position);
  return {overall,position,positionCode:ICON_POSITION_CODES[position]||'MC',nationality:c.nationality||'',nationalityCode:c.nationalityCode||'',name:c.name||'Lenda',number:c.number||10,appearance:normalizeAppearance(c.appearance||{}),attributes:attrs,weakFoot:c.weakFoot||4};
}
function iconCardMarkup(card,compact=false){
  if(!card)return '';const a=card.attributes||estimateIconAttributes(card.overall,card.position),surname=(card.name||'LENDA').split(/\s+/).slice(-1)[0].toUpperCase(),gk=card.position==='Goleiro';
  const stats=gk?`<span><b>${esc(a.reflexes||0)}</b> REF</span><span><b>${esc(a.positioning||0)}</b> POS</span><span><b>${esc(a.diving||0)}</b> ELA</span><span><b>${esc(a.handling||0)}</b> MAN</span><span><b>${esc(a.speed||0)}</b> VEL</span><span><b>${esc(a.kicking||0)}</b> CHU</span><span><b>${esc(a.physical||0)}</b> FIS</span>`:`<span><b>${esc(a.pace||0)}</b> RIT</span><span><b>${esc(a.dribbling||0)}</b> DRI</span><span><b>${esc(a.finishing||0)}</b> FIN</span><span><b>${esc(a.defense||0)}</b> DEF</span><span><b>${esc(a.passing||0)}</b> PAS</span><span><b>${esc(a.physical||0)}</b> FIS</span>`;
  return `<article class="fifa-icon-card ${compact?'compact':''} ${gk?'goalkeeper-icon-card':''}" aria-label="Carta ICON de ${esc(card.name||'jogador')}"><div class="icon-card-shine"></div><div class="icon-card-crown">ICON</div><div class="icon-card-rating"><strong>${esc(card.overall||'—')}</strong><span>${esc(card.positionCode||ICON_POSITION_CODES[card.position]||'MC')}</span>${nationalFlagImage(card.nationalityCode,card.nationality)}</div><div class="icon-card-face">${appearanceMarkup(card.appearance||DEFAULT_APPEARANCE,true,card.number||10)}</div><div class="icon-card-name">${esc(surname)}</div><div class="icon-card-rule"></div><div class="icon-card-stats">${stats}</div><small>${esc(card.nationality||'')} · ${esc(card.position||'')}</small></article>`;
}
function saveCareerToHall(){
  const p=state.player;if(!p?.retired)return;
  const history=(state.history||[]).map(row=>({...row}));
  const totals=history.reduce((acc,row)=>{acc.games+=row.games||0;acc.goals+=row.goals||0;acc.assists+=row.assists||0;return acc;},{games:0,goals:0,assists:0});
  const r=historicalRankBreakdown();
  const entry={
    id:`${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
    name:p.name,position:p.position,nationality:p.nationality,nationalityCode:p.nationalityCode||'',number:p.number||10,
    rank:r.rank,tier:r.tier,score:r.score,peak:r.peak,rankingComponents:{...r.components},overall:p.overall,potential:p.potential||p.overall,retiredAge:p.retiredAge||p.age,
    birthdate:p.birthdate||'',foot:p.foot||'',value:p.value||0,
    clubs:[...new Set([...history.map(h=>h.club).filter(Boolean),p.club].filter(Boolean))],
    titles:(p.trophies||[]).length,
    titleCounts:Object.fromEntries((()=>{const m=new Map();(p.trophies||[]).forEach(t=>{const name=(t?.name||'Título').trim();if(name)m.set(name,(m.get(name)||0)+1);});return [...m.entries()];})()),
    awards:(p.awards||[]).length,goals:totals.goals,assists:totals.assists,games:totals.games,
    appearance:normalizeAppearance(p.appearance||{}),
    attributes:{...normalizePlayerAttributes(p)},
    iconCard:buildCareerIconCardSnapshot(p),
    history,
    trophies:(p.trophies||[]).map(x=>({...x})),
    awardList:(p.awards||[]).map(x=>({...x})),
    national:{games:p.nationalTeamGames||0,goals:p.nationalTeamGoals||0,captain:!!p.nationalCaptain,trust:p.nationalTrust||0},
    sponsor:p.sponsor?{...p.sponsor}:null,
    clubIdols:Array.isArray(p.clubIdols)?[...p.clubIdols]:[],
    savedAt:new Date().toISOString(),archiveVersion:3
  };
  const list=getSavedCareers().filter(x=>!(x.name===entry.name&&x.retiredAge===entry.retiredAge&&x.games===entry.games));
  list.unshift(entry);state.savedCareers=list.slice(0,12);p.hallSaved=true;save();renderSavedCareers();const btn=$('#legacy-save');if(btn){btn.disabled=true;btn.textContent='Carreira salva ✓';}toast('Carreira salva no Hall da Fama.');
}
function removeSavedCareer(index,{fromModal=false}={}){
  const list=getSavedCareers(),c=list[index];if(!c)return;
  const label=c.name||'esta carreira';
  if(!confirm(`Remover ${label} do Hall da Fama? Esta ação não pode ser desfeita.`))return;
  list.splice(index,1);state.savedCareers=list;
  // Se o card removido pertence à carreira recém-encerrada, permita salvá-la novamente.
  if(state.player?.retired&&state.player?.hallSaved&&c.name===state.player.name&&Number(c.retiredAge||0)===Number(state.player.retiredAge||state.player.age||0)){
    state.player.hallSaved=false;
    const saveBtn=$('#legacy-save');if(saveBtn){saveBtn.disabled=false;saveBtn.textContent='Salvar carreira';}
  }
  save();
  if(fromModal)closeSavedCareer();
  renderSavedCareers();
  toast('Carreira removida do Hall da Fama.');
}
function renderSavedCareers(){
  const box=$('#saved-careers-list'),count=$('#home-save-count'),list=getSavedCareers();
  if(count)count.textContent=`${list.length} carreira(s) salva(s)`;
  if(!box)return;
  if(!list.length){
    box.innerHTML='<div class="hall-empty"><span>★</span><strong>Seu Hall da Fama está vazio</strong><small>Ao se aposentar, salve as carreiras que quiser manter.</small></div>';
    return;
  }
  box.innerHTML=list.map((c,i)=>{
    const countryCode=c.nationalityCode||COUNTRIES.find(x=>x.name===c.nationality)?.code||'';
    const overall=c.peak||c.overall||'—',rank=c.rank||'—';
    const flag=countryCode?nationalFlagImage(countryCode,c.nationality):`<span class="saved-career-flag-fallback">${esc(c.nationality||'🌍')}</span>`;
    return `<article class="saved-career-card saved-career-summary-card" data-saved-career="${i}" role="button" tabindex="0" aria-label="Abrir carreira arquivada de ${esc(c.name||'jogador')}">
      <button class="saved-career-delete" type="button" data-delete-saved-career="${i}" aria-label="Remover ${esc(c.name||'jogador')} do Hall da Fama" title="Remover do Hall da Fama">×</button>
      <div class="saved-career-summary-flag">${flag}</div>
      <div class="saved-career-summary-main"><span class="saved-career-kicker">CARREIRA ARQUIVADA</span><h4>${esc(c.name||'Jogador')}</h4><p><strong>${esc(c.position||'Jogador')}</strong><span>${esc(c.nationality||'')}</span></p></div>
      <div class="saved-career-summary-metrics"><div><small>OVERALL</small><strong>${esc(overall)}</strong></div><div><small>RANK HISTÓRICO</small><strong>#${esc(rank)}</strong></div></div>
      <span class="saved-career-open-hint">Ver carreira →</span>
    </article>`;
  }).join('');
  $$('.saved-career-delete').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();removeSavedCareer(+btn.dataset.deleteSavedCareer);}));
  $$('.saved-career-card').forEach(card=>{
    const open=()=>openSavedCareer(+card.dataset.savedCareer);
    card.addEventListener('click',e=>{if(e.target.closest('.saved-career-delete'))return;open();});
    card.addEventListener('keydown',e=>{if(e.target.closest?.('.saved-career-delete'))return;if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
  });
}
function openSavedCareer(index){
  const c=getSavedCareers()[index],modal=$('#saved-career-modal');if(!c||!modal)return;
  modal.dataset.savedCareerIndex=String(index);
  $('#saved-career-name').textContent=c.name||'Carreira salva';
  $('#saved-career-subtitle').textContent=`${c.position||'Jogador'} · ${c.nationality||'—'} · camisa ${c.number||10} · aposentado aos ${c.retiredAge||'—'} anos`;
  const face=$('#saved-career-detail-face');face.innerHTML=appearanceMarkup(c.appearance||DEFAULT_APPEARANCE,true,c.number||10);
  $('#saved-career-rank').textContent=`#${c.rank||'—'}`;$('#saved-career-peak').textContent=c.peak||c.overall||'—';$('#saved-career-overall').textContent=c.overall||'—';$('#saved-career-seasons').textContent=(c.history||[]).length||'—';
  $('#saved-career-games').textContent=c.games||0;$('#saved-career-goals').textContent=c.goals||0;$('#saved-career-assists').textContent=c.assists||0;$('#saved-career-titles').textContent=savedCareerTotalTitles(c);$('#saved-career-awards').textContent=c.awards||0;$('#saved-career-nt').textContent=c.national?.games||c.nationalTeamGames||0;
  $('#saved-career-club-list').innerHTML=(c.clubs||[]).length?(c.clubs||[]).map(name=>`<span class="saved-career-club-badge" title="${esc(name)}" aria-label="${esc(name)}">${clubCrestMarkup(name)}</span>`).join(''):'<small class="muted">Nenhum clube registrado.</small>';
  const titleCounts=savedCareerTitleCounts(c);
  $('#saved-career-honours').innerHTML=titleCounts.length?`<div class="saved-title-trophy-grid">${titleCounts.map(([name,n])=>`<article class="saved-title-trophy-card">${honourVisual(name)}<div><strong>${esc(name)}</strong><span>${n}× campeão</span></div><b>${n}×</b></article>`).join('')}</div>`:`<small class="muted">Sem títulos registrados nesta carreira.</small>`;
  const history=c.history||[];
  $('#saved-career-history').innerHTML=history.length?history.map(row=>`<tr><td>${esc(row.year||'—')}</td><td>${esc(row.club||'—')}</td><td>${esc(row.overall||row.finalOverall||'—')}</td><td>${esc(row.games||0)}</td><td>${esc(row.goals||0)}</td><td>${esc(row.assists||0)}</td><td>${row.rating?historicalSeasonGrade(row,c.position).toFixed(1):'—'}</td><td>${esc(row.league||row.leagueName||row.leaguePosition||'—')}</td></tr>`).join(''):`<tr><td colspan="8" class="saved-career-old-save">O progresso por temporada não estava armazenado quando esta carreira foi arquivada. As estatísticas-resumo acima continuam disponíveis.</td></tr>`;
  let saved='';try{saved=c.savedAt?new Date(c.savedAt).toLocaleDateString('pt-BR'):''}catch(_){}$('#saved-career-saved-at').textContent=saved?`Salva em ${saved}`:'';
  const iconCard=iconCardFromArchive(c);if($('#saved-career-icon-card'))$('#saved-career-icon-card').innerHTML=iconCardMarkup(iconCard,false);if($('#saved-icon-card-title'))$('#saved-icon-card-title').textContent=`ICON · ${c.name||'Lenda'}`;
  modal.classList.remove('hidden');hydratePenaltyBadges(modal);observeSiteImages();
}
function closeSavedCareer(){ const modal=$('#saved-career-modal');if(modal){modal.classList.add('hidden');delete modal.dataset.savedCareerIndex;} }

function legacyClubEligible(){
  const p=state.player,s=state.season;if(!p||p.retired||!s?.closed||p.age<35)return false;
  const consolidated=(p.overall>=84)||(p.titles||0)>=2||(p.awards||[]).length>=1||(p.reputation||0)>=45;
  return consolidated;
}
function renderLegacyClubChoice(){
  const panel=$('#legacy-club-panel'),select=$('#legacy-club-choice');if(!panel||!select)return;
  const eligible=legacyClubEligible();panel.classList.toggle('hidden',!eligible);if(!eligible)return;
  const p=state.player;const clubs=allTransferClubs().filter(c=>c.name!==p.club).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
  select.innerHTML=clubs.map(c=>`<option value="${c.countryCode}|${c.name.replace(/"/g,'&quot;')}">${c.name} · ${countryByCode(c.countryCode)?.name||c.countryCode}</option>`).join('');
}
function renderMarketTier(){
  if(!state.created)return;const o=state.player.overall;let tier='Desenvolvimento',level=28,icon='◌';if(o>=85){tier='Elite europeia';level=100;icon='★';}else if(o>=79){tier='Europa forte';level=76;icon='◆';}else if(o>=73){tier='Mercado global';level=54;icon='◇';}else if(o>=68){tier='Desenvolvimento internacional';level=36;icon='◎';}
  $('#market-tier').innerHTML=`<div class="market-tier-visual"><span class="market-tier-icon">${icon}</span><div><small>FAIXA ATUAL</small><strong>${tier}</strong></div><div class="market-ger"><b>${o}</b><small>GER</small></div></div><div class="market-tier-track"><span style="width:${level}%"></span></div><div class="market-tier-chips"><span>€ teto ${money(MAX_MARKET_VALUE).replace('€ ','')}</span><span>${state.offers.length} proposta(s)</span></div>`;renderLegacyClubChoice();
}
function renderOffers(){
  if(!state.created)return;const box=$('#offers');box.innerHTML=state.offers.length?state.offers.map((o,i)=>`<article class="panel offer compact-offer" data-club-name="${o.club.replace(/"/g,'&quot;')}"><div class="offer-main"><span class="crest-shell"><img class="club-badge-img hidden" alt=""><span class="crest-fallback" title="Escudo real ainda não localizado">S/D</span></span><div><small>${o.countryName} · ${o.league}</small><h3>${o.club}</h3><div class="offer-metrics"><span>€ ${money(o.value).replace('€ ','')}</span><span>FOR ${o.strength}</span></div></div></div><div class="offer-actions"><button class="primary" onclick="acceptOffer(${i})">Aceitar</button><button class="danger" onclick="rejectOffer(${i})">×</button></div></article>`).join(''):'<div class="empty-market"><span>◎</span><strong>Sem propostas</strong><small>Simule mais uma temporada para movimentar o mercado.</small></div>';hydrateRenderedBadges();
}

function soundtrackTrack(id){return FIFA_SOUNDTRACK.find(t=>t.id===id)||null;}
function normalizeSoundtrackOrder(){
  const valid=new Set(FIFA_SOUNDTRACK.map(t=>t.id)),saved=Array.isArray(soundtrackSettings.order)?soundtrackSettings.order:[];
  soundtrackSettings.order=[...saved.filter(id=>valid.has(id)),...FIFA_SOUNDTRACK.map(t=>t.id).filter(id=>!saved.includes(id))];
}
function orderedSoundtrackTracks(){normalizeSoundtrackOrder();return soundtrackSettings.order.map(soundtrackTrack).filter(Boolean);}
function selectedSoundtrackTracks(){
  const selected=new Set(Array.isArray(soundtrackSettings.selected)?soundtrackSettings.selected:[]);
  return orderedSoundtrackTracks().filter(t=>selected.has(t.id));
}
function moveSoundtrackTrack(id,direction){
  normalizeSoundtrackOrder();const selected=selectedSoundtrackTracks(),selectedIndex=selected.findIndex(t=>t.id===id),target=selected[selectedIndex+direction];if(selectedIndex<0||!target)return;
  const order=[...soundtrackSettings.order],from=order.indexOf(id),to=order.indexOf(target.id);[order[from],order[to]]=[order[to],order[from]];soundtrackSettings.order=order;soundtrackSettings.shuffle=false;saveSoundtrackSettings();renderSoundtrackList();syncSoundtrackPlayerUI();
}
function soundtrackRepoPath(track){return `assets/audio/tracks/${track.id}.mp3`;}
function soundtrackDb(){
  return new Promise((resolve,reject)=>{
    if(!('indexedDB' in window)){resolve(null);return;}
    const req=indexedDB.open(SOUNDTRACK_DB,1);
    req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(SOUNDTRACK_STORE))db.createObjectStore(SOUNDTRACK_STORE,{keyPath:'id'});};
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  });
}
function soundtrackIdbRequest(req){return new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
async function refreshSoundtrackImportedIds(){
  try{
    const db=await soundtrackDb();if(!db){soundtrackImportedIds=new Set();return;}
    const tx=db.transaction(SOUNDTRACK_STORE,'readonly');const keys=await soundtrackIdbRequest(tx.objectStore(SOUNDTRACK_STORE).getAllKeys());db.close();
    soundtrackImportedIds=new Set(keys||[]);
  }catch(_){soundtrackImportedIds=new Set();}
}
async function getImportedSoundtrackFile(id){
  try{const db=await soundtrackDb();if(!db)return null;const tx=db.transaction(SOUNDTRACK_STORE,'readonly');const row=await soundtrackIdbRequest(tx.objectStore(SOUNDTRACK_STORE).get(id));db.close();return row||null;}catch(_){return null;}
}
async function saveImportedSoundtrackFile(id,file){
  if(!id||!file)return false;
  if(!/^audio\//i.test(file.type||'')&&!/\.(mp3|m4a|aac|ogg|wav|flac)$/i.test(file.name||'')){toast('Escolha um arquivo de áudio válido.');return false;}
  try{
    if(navigator.storage?.persist)navigator.storage.persist().catch(()=>{});
    const db=await soundtrackDb();if(!db)throw new Error('indexeddb');
    const tx=db.transaction(SOUNDTRACK_STORE,'readwrite');await soundtrackIdbRequest(tx.objectStore(SOUNDTRACK_STORE).put({id,blob:file,name:file.name,type:file.type||'audio/mpeg',size:file.size||0,updatedAt:Date.now()}));db.close();
    soundtrackImportedIds.add(id);return true;
  }catch(err){toast(err?.name==='QuotaExceededError'?'Sem espaço suficiente no navegador para guardar esta música.':'Não foi possível guardar o arquivo de áudio.');return false;}
}
async function deleteImportedSoundtrackFile(id){
  try{const db=await soundtrackDb();if(!db)return;const tx=db.transaction(SOUNDTRACK_STORE,'readwrite');await soundtrackIdbRequest(tx.objectStore(SOUNDTRACK_STORE).delete(id));db.close();soundtrackImportedIds.delete(id);}
  catch(_){toast('Não foi possível remover o arquivo local.');}
}
function ensureSoundtrackAudio(){
  if(soundtrackAudio)return soundtrackAudio;
  soundtrackAudio=new Audio();soundtrackAudio.preload='metadata';soundtrackAudio.volume=clamp(Number(soundtrackSettings.volume)||.38,0,1);
  soundtrackAudio.addEventListener('ended',()=>playNextSoundtrack(true));
  soundtrackAudio.addEventListener('pause',()=>{soundtrackSettings.wasPlaying=false;saveSoundtrackSettings();syncSoundtrackPlayerUI();});
  soundtrackAudio.addEventListener('play',()=>{soundtrackSettings.wasPlaying=true;saveSoundtrackSettings();syncSoundtrackPlayerUI();});
  soundtrackAudio.addEventListener('error',()=>{if(!soundtrackResolving){toast('Não foi possível reproduzir esta faixa. Pulando para a próxima.');setTimeout(()=>playNextSoundtrack(true),220);}});
  return soundtrackAudio;
}
function normalizeMusicQuery(v=''){return String(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
async function resolveSoundtrackPreview(track){
  if(!track)return null;if(soundtrackPreviewCache.has(track.id))return soundtrackPreviewCache.get(track.id);
  const q=encodeURIComponent(`${track.title} ${track.artist}`);let url=null;
  try{
    const response=await fetch(`https://itunes.apple.com/search?term=${q}&entity=song&limit=12`);
    if(!response.ok)throw new Error('catalog');const data=await response.json();
    const tt=normalizeMusicQuery(track.title),ta=normalizeMusicQuery(track.artist.split(/feat\.|&|,/i)[0]);
    const candidates=(data.results||[]).filter(x=>x.previewUrl);
    const best=candidates.sort((a,b)=>{
      const score=x=>{const n=normalizeMusicQuery(x.trackName),ar=normalizeMusicQuery(x.artistName);return (n===tt?8:n.includes(tt)||tt.includes(n)?5:0)+(ar.includes(ta)||ta.includes(ar)?4:0)};
      return score(b)-score(a);
    })[0];url=best?.previewUrl||null;
  }catch(_){url=null;}
  soundtrackPreviewCache.set(track.id,url);return url;
}
async function soundtrackRepoFileExists(track){
  if(track?.bundled||location.protocol==='file:')return true;
  try{const r=await fetch(soundtrackRepoPath(track),{method:'HEAD',cache:'no-store'});return r.ok;}catch(_){return false;}
}
async function resolveSoundtrackSource(track){
  if(soundtrackImportedIds.has(track.id)){
    const imported=await getImportedSoundtrackFile(track.id);
    if(imported?.blob){
      if(soundtrackCurrentObjectUrl){URL.revokeObjectURL(soundtrackCurrentObjectUrl);soundtrackCurrentObjectUrl=null;}
      soundtrackCurrentObjectUrl=URL.createObjectURL(imported.blob);
      return {url:soundtrackCurrentObjectUrl,kind:'música completa'};
    }
  }
  if(track?.bundled)return {url:soundtrackRepoPath(track),kind:'música completa'};
  if(await soundtrackRepoFileExists(track))return {url:soundtrackRepoPath(track),kind:'música completa'};
  const preview=await resolveSoundtrackPreview(track);return preview?{url:preview,kind:'prévia'}:null;
}
let soundtrackRequestToken=0;
async function playSoundtrackTrack(id,quiet=false){
  const track=soundtrackTrack(id),audio=ensureSoundtrackAudio();if(!track||!soundtrackSettings.enabled)return;
  const selected=selectedSoundtrackTracks();if(!selected.some(t=>t.id===track.id)){if(!selected.length){audio.pause();soundtrackSettings.currentId=null;saveSoundtrackSettings();syncSoundtrackPlayerUI();}return;}
  soundtrackSettings.currentId=track.id;saveSoundtrackSettings();syncSoundtrackPlayerUI();const token=++soundtrackRequestToken;soundtrackResolving=true;
  const source=await resolveSoundtrackSource(track);if(token!==soundtrackRequestToken)return;soundtrackResolving=false;
  if(!source){if(!quiet)toast(`Áudio indisponível: ${track.title}`);playNextSoundtrack(true);return;}
  soundtrackSourceKind=source.kind;
  if(audio.src!==source.url)audio.src=source.url;audio.volume=clamp(Number(soundtrackSettings.volume)||0,0,1);syncSoundtrackPlayerUI();
  try{await audio.play();}catch(_){soundtrackSettings.wasPlaying=false;saveSoundtrackSettings();syncSoundtrackPlayerUI();if(!quiet)toast('Clique em ▶ para iniciar a trilha sonora.');}
}
function pickNextSoundtrack(direction=1){
  const tracks=selectedSoundtrackTracks();if(!tracks.length)return null;
  const current=tracks.findIndex(t=>t.id===soundtrackSettings.currentId);
  if(soundtrackSettings.shuffle&&tracks.length>1&&direction>0){const pool=tracks.filter(t=>t.id!==soundtrackSettings.currentId);return pool[rnd(0,pool.length-1)];}
  const idx=current<0?(direction>0?0:tracks.length-1):(current+direction+tracks.length)%tracks.length;return tracks[idx];
}
function playNextSoundtrack(quiet=false){const t=pickNextSoundtrack(1);if(t)playSoundtrackTrack(t.id,quiet);else{ensureSoundtrackAudio().pause();soundtrackSettings.currentId=null;saveSoundtrackSettings();syncSoundtrackPlayerUI();}}
function playPreviousSoundtrack(){const t=pickNextSoundtrack(-1);if(t)playSoundtrackTrack(t.id);}
function toggleSoundtrackPlayback(){
  const audio=ensureSoundtrackAudio();if(!soundtrackSettings.enabled){soundtrackSettings.enabled=true;saveSoundtrackSettings();}
  if(!audio.paused){audio.pause();return;}const current=soundtrackTrack(soundtrackSettings.currentId);if(current&&selectedSoundtrackTracks().some(t=>t.id===current.id)&&audio.src){audio.play().catch(()=>playSoundtrackTrack(current.id));}else{const next=pickNextSoundtrack(1);if(next)playSoundtrackTrack(next.id);else toast('Selecione pelo menos uma música.');}
}
function startSoundtrackForGameplay(){
  if(!soundtrackSettings.enabled)return;
  const audio=ensureSoundtrackAudio();if(!audio.paused)return;
  const current=soundtrackTrack(soundtrackSettings.currentId);
  const track=current&&selectedSoundtrackTracks().some(t=>t.id===current.id)?current:pickNextSoundtrack(1);
  if(track)playSoundtrackTrack(track.id,true);
}
function renderSoundtrackQueue(){
  const box=$('#soundtrack-queue');if(!box)return;const tracks=selectedSoundtrackTracks();
  if(!tracks.length){box.innerHTML='<div class="soundtrack-queue-empty">Selecione músicas abaixo para montar sua ordem.</div>';return;}
  box.innerHTML=tracks.map((t,i)=>`<div class="soundtrack-queue-item ${soundtrackSettings.currentId===t.id?'playing':''}" data-queue-track="${t.id}" role="button" tabindex="0" aria-label="Tocar ${esc(t.title)}"><b>${String(i+1).padStart(2,'0')}</b><span><strong>${esc(t.title)}</strong><small>${esc(t.artist)} · FIFA ${t.fifa}</small></span><div><button type="button" data-queue-up="${t.id}" ${i===0?'disabled':''} title="Subir na ordem">↑</button><button type="button" data-queue-down="${t.id}" ${i===tracks.length-1?'disabled':''} title="Descer na ordem">↓</button></div></div>`).join('');
  box.querySelectorAll('[data-queue-track]').forEach(row=>{const play=()=>playSoundtrackTrack(row.dataset.queueTrack);row.addEventListener('click',e=>{if(e.target.closest('button'))return;play();});row.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!e.target.closest('button')){e.preventDefault();play();}});});
  box.querySelectorAll('[data-queue-up]').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();moveSoundtrackTrack(btn.dataset.queueUp,-1);}));
  box.querySelectorAll('[data-queue-down]').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();moveSoundtrackTrack(btn.dataset.queueDown,1);}));
}
function renderSoundtrackList(){
  const box=$('#soundtrack-list');if(!box)return;normalizeSoundtrackOrder();const selected=new Set(soundtrackSettings.selected||[]);
  box.innerHTML=Array.from({length:10},(_,i)=>14+i).map(year=>`<section class="soundtrack-year"><header><b>FIFA ${year}</b><small>clique na música para ouvir</small></header><div>${FIFA_SOUNDTRACK.filter(t=>t.fifa===year).map(t=>{const imported=soundtrackImportedIds.has(t.id),full=imported||t.bundled;return `<div class="soundtrack-track ${selected.has(t.id)?'selected':''} ${soundtrackSettings.currentId===t.id?'playing':''} ${full?'has-full-audio':''}" data-soundtrack-row="${t.id}" role="button" tabindex="0"><input type="checkbox" data-soundtrack-track="${t.id}" ${selected.has(t.id)?'checked':''} aria-label="Incluir ${esc(t.title)} na trilha"><span><strong>${esc(t.title)}</strong><small>${esc(t.artist)}</small></span><div class="soundtrack-track-actions"><em>${full?'COMPLETA':'PREVIEW'}</em><button type="button" data-soundtrack-import="${t.id}" title="${full?'Substituir o áudio desta música':'Associar um arquivo de áudio a esta música'}">${full?'↻':'＋'} MP3</button>${imported?`<button type="button" class="soundtrack-remove-file" data-soundtrack-remove="${t.id}" title="Remover arquivo salvo">×</button>`:''}</div></div>`;}).join('')}</div></section>`).join('');
  box.querySelectorAll('[data-soundtrack-track]').forEach(input=>input.addEventListener('change',()=>{
    const set=new Set(soundtrackSettings.selected||[]);input.checked?set.add(input.dataset.soundtrackTrack):set.delete(input.dataset.soundtrackTrack);soundtrackSettings.selected=orderedSoundtrackTracks().map(t=>t.id).filter(id=>set.has(id));saveSoundtrackSettings();renderSoundtrackList();syncSoundtrackPlayerUI();
    if(!set.has(soundtrackSettings.currentId)&&soundtrackAudio&&!soundtrackAudio.paused)playNextSoundtrack(true);
  }));
  box.querySelectorAll('[data-soundtrack-row]').forEach(row=>{const play=()=>{const id=row.dataset.soundtrackRow,set=new Set(soundtrackSettings.selected||[]);if(!set.has(id)){set.add(id);soundtrackSettings.selected=orderedSoundtrackTracks().map(t=>t.id).filter(x=>set.has(x));saveSoundtrackSettings();}playSoundtrackTrack(id);renderSoundtrackList();};row.addEventListener('click',e=>{if(e.target.closest('input,button'))return;play();});row.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!e.target.closest('input,button')){e.preventDefault();play();}});});
  box.querySelectorAll('[data-soundtrack-import]').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();soundtrackImportTarget=btn.dataset.soundtrackImport;$('#soundtrack-file-input')?.click();}));
  box.querySelectorAll('[data-soundtrack-remove]').forEach(btn=>btn.addEventListener('click',async e=>{e.preventDefault();e.stopPropagation();const id=btn.dataset.soundtrackRemove;await deleteImportedSoundtrackFile(id);renderSoundtrackList();if(soundtrackSettings.currentId===id&&soundtrackAudio&&!soundtrackAudio.paused)playSoundtrackTrack(id,true);toast(soundtrackTrack(id)?.bundled?'Arquivo local removido. A faixa volta a usar o áudio incluído no jogo.':'Arquivo local removido. A faixa volta a usar a prévia.');}));
  renderSoundtrackQueue();
}
function syncSoundtrackPlayerUI(){
  const track=soundtrackTrack(soundtrackSettings.currentId),audio=soundtrackAudio;const playing=!!audio&&!audio.paused&&!audio.ended;
  const play=$('#soundtrack-play');if(play){play.textContent=playing?'❚❚':'▶';play.setAttribute('aria-label',playing?'Pausar':'Reproduzir');}
  if($('#soundtrack-enabled'))$('#soundtrack-enabled').checked=!!soundtrackSettings.enabled;if($('#soundtrack-shuffle'))$('#soundtrack-shuffle').checked=!!soundtrackSettings.shuffle;if($('#soundtrack-volume'))$('#soundtrack-volume').value=Math.round((soundtrackSettings.volume??.38)*100);
  if($('#soundtrack-current-title'))$('#soundtrack-current-title').textContent=track?track.title:'Nenhuma faixa';if($('#soundtrack-current-meta'))$('#soundtrack-current-meta').textContent=track?`${track.artist} · FIFA ${track.fifa} · ${soundtrackSourceKind}`:(selectedSoundtrackTracks().length?'Pressione ▶ para começar':'Selecione ao menos uma música');
  const widget=$('#now-playing');if(widget){widget.classList.toggle('hidden',!soundtrackSettings.enabled||!track);$('#now-playing-title').textContent=track?track.title:'—';$('#now-playing-meta').textContent=track?`${track.artist} · FIFA ${track.fifa} · ${soundtrackSourceKind}${playing?'':' · pausado'}`:'—';$('#now-playing-toggle').textContent=playing?'❚❚':'♫';}
  $$('[data-soundtrack-row],[data-queue-track]').forEach(row=>row.classList.toggle('playing',!!track&&(row.dataset.soundtrackRow===track.id||row.dataset.queueTrack===track.id)));
}
async function openSoundtrack(){await refreshSoundtrackImportedIds();renderSoundtrackList();syncSoundtrackPlayerUI();$('#soundtrack-modal')?.classList.remove('hidden');}
function closeSoundtrack(){saveSoundtrackSettings();$('#soundtrack-modal')?.classList.add('hidden');syncSoundtrackPlayerUI();}
function matchSoundtrackFile(file){
  const name=normalizeMusicQuery((file.name||'').replace(/\.[^.]+$/,''));
  let direct=FIFA_SOUNDTRACK.find(t=>name.includes(normalizeMusicQuery(t.id))||normalizeMusicQuery(t.id).includes(name));if(direct)return direct;
  const scored=FIFA_SOUNDTRACK.map(t=>{const title=normalizeMusicQuery(t.title),artist=normalizeMusicQuery(t.artist.split(/feat\.|&|,/i)[0]);let score=0;if(name.includes(title))score+=8;for(const token of title.split(' '))if(token.length>3&&name.includes(token))score++;for(const token of artist.split(' '))if(token.length>3&&name.includes(token))score+=2;return {t,score};}).sort((a,b)=>b.score-a.score);
  return scored[0]?.score>=6?scored[0].t:null;
}
async function importSoundtrackFiles(files,targetId=null){
  const arr=[...(files||[])];if(!arr.length)return;
  let imported=0,unmatched=0;
  for(const file of arr){const track=targetId?soundtrackTrack(targetId):matchSoundtrackFile(file);if(!track){unmatched++;continue;}if(await saveImportedSoundtrackFile(track.id,file))imported++;}
  await refreshSoundtrackImportedIds();renderSoundtrackList();syncSoundtrackPlayerUI();
  if(imported)toast(`${imported} música(s) completa(s) adicionada(s).${unmatched?` ${unmatched} arquivo(s) não identificado(s).`:''}`);else if(unmatched)toast('Não consegui identificar esses arquivos. Use o botão + MP3 ao lado de cada música.');
}
function initSoundtrack(){
  normalizeSoundtrackOrder();soundtrackSettings.selected=(soundtrackSettings.selected||[]).filter(id=>FIFA_SOUNDTRACK.some(t=>t.id===id));if(!soundtrackSettings.selected.length&&soundtrackSettings.enabled===undefined)soundtrackSettings.selected=FIFA_SOUNDTRACK.map(t=>t.id);
  ensureSoundtrackAudio();saveSoundtrackSettings();refreshSoundtrackImportedIds().then(()=>renderSoundtrackList());syncSoundtrackPlayerUI();
  if(soundtrackSettings.currentId&&soundtrackSettings.wasPlaying){const resume=()=>{document.removeEventListener('pointerdown',resume);document.removeEventListener('keydown',resume);playSoundtrackTrack(soundtrackSettings.currentId,true);};document.addEventListener('pointerdown',resume,{once:true});document.addEventListener('keydown',resume,{once:true});}
  else if(!soundtrackSettings.currentId&&soundtrackSettings.enabled){const autoStart=e=>{if(e.target?.closest?.('#soundtrack-modal,#soundtrack-btn,#now-playing'))return;if(!selectedSoundtrackTracks().length)return;document.removeEventListener('click',autoStart);startSoundtrackForGameplay();};document.addEventListener('click',autoStart);}
}
$$('[data-view]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();showView(el.dataset.view);}));

// Meu Legado e trilha sonora do menu principal.
$('#saved-career-close')?.addEventListener('click',closeSavedCareer);
$('#saved-career-close-x')?.addEventListener('click',closeSavedCareer);
$('#saved-career-view-ranking')?.addEventListener('click',()=>{const modal=$('#saved-career-modal'),index=Number(modal?.dataset.savedCareerIndex);if(Number.isInteger(index)){closeSavedCareer();renderSavedCareerHistoricalRanking(index);}});
$('#saved-career-delete-modal')?.addEventListener('click',()=>{const modal=$('#saved-career-modal'),index=Number(modal?.dataset.savedCareerIndex);if(Number.isInteger(index))removeSavedCareer(index,{fromModal:true});});
$('#saved-career-modal')?.addEventListener('click',e=>{if(e.target===e.currentTarget)closeSavedCareer();});
$('#edit-appearance')?.addEventListener('click',openCareerAppearanceEditor);
$('#career-appearance-close-x')?.addEventListener('click',closeCareerAppearanceEditor);
$('#career-appearance-cancel')?.addEventListener('click',closeCareerAppearanceEditor);
$('#career-appearance-save')?.addEventListener('click',saveCareerAppearanceEditor);
$('#career-appearance-modal')?.addEventListener('click',e=>{if(e.target===e.currentTarget)closeCareerAppearanceEditor();});

$('#legacy-logout')?.addEventListener('click',()=>window.BTLAuth?.logout?.());
$('#contact-request')?.addEventListener('input',e=>{const count=$('#contact-count');if(count)count.textContent=String((e.target.value||'').length);});
$('#contact-form')?.addEventListener('submit',e=>{
  e.preventDefault();const account=window.BTLAuth?.getCurrentAccount?.();
  const name=$('#contact-name')?.value.trim()||account?.nickname||'';const email=$('#contact-email')?.value.trim()||'';const request=$('#contact-request')?.value.trim()||'';
  if(!name||!email||!request){toast('Preencha nome, e-mail e solicitação.');return;}if(request.length>1000){toast('A solicitação deve ter no máximo 1000 caracteres.');return;}
  window.BTLAuth?.updateContactEmail?.(email);
  const subject=`Sugestão Be The Legend — ${account?.nickname||name}`;
  const body=[`Nome do jogador: ${name}`,`Nickname: ${account?.nickname||'—'}`,`ID Be The Legend: ${account?.id8||'—'}`,`E-mail: ${email}`,'', 'Solicitação:',request].join('\n');
  window.location.href=`mailto:bethelegend.contact@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

$('#soundtrack-btn')?.addEventListener('click',openSoundtrack);
$('#soundtrack-close')?.addEventListener('click',closeSoundtrack);
$('#soundtrack-close-x')?.addEventListener('click',closeSoundtrack);
$('#soundtrack-modal')?.addEventListener('click',e=>{if(e.target===e.currentTarget)closeSoundtrack();});
$('#soundtrack-play')?.addEventListener('click',toggleSoundtrackPlayback);
$('#soundtrack-prev')?.addEventListener('click',playPreviousSoundtrack);
$('#soundtrack-next')?.addEventListener('click',()=>playNextSoundtrack());
$('#now-playing-toggle')?.addEventListener('click',toggleSoundtrackPlayback);
$('#now-playing-next')?.addEventListener('click',()=>playNextSoundtrack());
$('#soundtrack-enabled')?.addEventListener('change',e=>{
  soundtrackSettings.enabled=!!e.target.checked;
  if(!soundtrackSettings.enabled&&soundtrackAudio)soundtrackAudio.pause();
  saveSoundtrackSettings();syncSoundtrackPlayerUI();
});
$('#soundtrack-shuffle')?.addEventListener('change',e=>{soundtrackSettings.shuffle=!!e.target.checked;saveSoundtrackSettings();});
$('#soundtrack-volume')?.addEventListener('input',e=>{
  soundtrackSettings.volume=clamp(Number(e.target.value)/100,0,1);
  if(soundtrackAudio)soundtrackAudio.volume=soundtrackSettings.volume;
  saveSoundtrackSettings();syncSoundtrackPlayerUI();
});
$('#soundtrack-select-all')?.addEventListener('click',()=>{
  soundtrackSettings.selected=FIFA_SOUNDTRACK.map(t=>t.id);saveSoundtrackSettings();renderSoundtrackList();syncSoundtrackPlayerUI();
});
$('#soundtrack-clear')?.addEventListener('click',()=>{
  soundtrackSettings.selected=[];if(soundtrackAudio)soundtrackAudio.pause();soundtrackSettings.currentId=null;saveSoundtrackSettings();renderSoundtrackList();syncSoundtrackPlayerUI();
});
$('#soundtrack-import-all')?.addEventListener('click',()=>$('#soundtrack-bulk-file-input')?.click());
$('#soundtrack-bulk-file-input')?.addEventListener('change',async e=>{await importSoundtrackFiles(e.target.files);e.target.value='';});
$('#soundtrack-file-input')?.addEventListener('change',async e=>{const id=soundtrackImportTarget;soundtrackImportTarget=null;await importSoundtrackFiles(e.target.files,id);e.target.value='';});
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  if(!$('#historical-ranking-modal')?.classList.contains('hidden'))closeHistoricalRankingModal();
  else if(!$('#career-appearance-modal')?.classList.contains('hidden'))closeCareerAppearanceEditor();
  else if(!$('#saved-career-modal')?.classList.contains('hidden'))closeSavedCareer();
  else if(!$('#soundtrack-modal')?.classList.contains('hidden'))closeSoundtrack();
});
$('#start-btn').addEventListener('click',()=>{showView(state.created?'career':attributeDraft?'attribute-draft':'create');startSoundtrackForGameplay();});
$('#nationality').addEventListener('change',loadClubChoices);
$('#reroll-clubs').addEventListener('click',()=>{if(creationClubRerollsRemaining<=0)return;creationClubRerollsRemaining--;$('#selected-club').value='';$('#create-submit').disabled=true;drawThreeClubs();updateClubRerollButton();});
$('#number').addEventListener('input',()=>{sanitizeShirtNumber();updateAppearancePreview();});
$('#number').addEventListener('blur',()=>{sanitizeShirtNumber();if(!$('#number').value)$('#number').value='10';});
['#appearance-hair-enabled','#appearance-hair-style','#appearance-hair-color','#appearance-beard-enabled','#appearance-beard-style','#appearance-skin'].forEach(sel=>$(sel)?.addEventListener('change',updateAppearancePreview));
$('#appearance-photo-upload')?.addEventListener('click',()=>$('#appearance-photo-input')?.click());
$('#appearance-photo-input')?.addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{creationPhotoDataUrl=await centerCropPhotoFile(file);updateAppearancePreview();toast('Foto centralizada e pronta para a carreira.');}catch(err){toast(err.message||'Não foi possível usar essa imagem.');}finally{e.target.value='';}});
$('#appearance-photo-remove')?.addEventListener('click',()=>{creationPhotoDataUrl='';updateAppearancePreview();toast('Foto removida. O avatar ilustrado voltou a ser usado.');});
$('#career-photo-upload')?.addEventListener('click',()=>$('#career-photo-input')?.click());
$('#career-photo-input')?.addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{careerAppearanceDraft=normalizeAppearance(careerAppearanceDraft||state.player?.appearance||{});careerAppearanceDraft.photoDataUrl=await centerCropPhotoFile(file);renderCareerAppearanceEditor();toast('Foto centralizada. Salve para aplicar.');}catch(err){toast(err.message||'Não foi possível usar essa imagem.');}finally{e.target.value='';}});
$('#career-photo-remove')?.addEventListener('click',()=>{if(!careerAppearanceDraft)return;careerAppearanceDraft.photoDataUrl='';renderCareerAppearanceEditor();});
renderAppearanceStudio();
$('#close-result').addEventListener('click',()=>$('#match-result').classList.add('hidden'));
$('#close-celebration').addEventListener('click',()=>{const overlay=$('#celebration');overlay.classList.add('hidden');overlay.classList.remove('idol-celebration');$('#celebration-icon').className='celebration-icon';const after=celebrationAfter;celebrationAfter=null;if(after){setTimeout(after,140);return;}if(pendingCareerCard){pendingCareerCard=false;showCareerLegacyCard();}});
$('#award-ceremony-continue').addEventListener('click',()=>{$('#award-ceremony-modal').classList.add('hidden');setTimeout(playNextAwardCeremony,180);});

$('#reroll-legend').addEventListener('click',()=>{
  if(!attributeDraft||(attributeDraft.skipsRemaining||0)<=0)return;
  const previous=attributeDraft.current.legend.name;
  attributeDraft.skipsRemaining=0;
  drawLegendForDraft(previous);saveDraftState();renderAttributeDraft();
});

$('#player-form').addEventListener('submit',e=>{
  e.preventDefault();sanitizeShirtNumber();const number=Number($('#number').value);if(!Number.isInteger(number)||number<1||number>99){toast('O número da camiseta deve ser de 1 a 99.');return;}
  const birthdate=$('#birthdate').value,age=calculateAge(birthdate);if(age<MIN_START_AGE||age>MAX_START_AGE){toast(`A idade inicial precisa ser de ${MIN_START_AGE} a ${MAX_START_AGE} anos.`);return;}
  const code=$('#nationality').value,country=countryByCode(code),selected=creationChoices.find(c=>c.name===$('#selected-club').value);if(!selected){toast('Escolha um dos três clubes sorteados.');return;}
  const idol=idolById($('#idol')?.value);if(!idol){toast('Escolha um ídolo para acompanhar sua carreira.');return;}
  const selectedProfile={...clubCompetitionProfile(selected.name,code),...selected};const profile={name:$('#name').value.trim(),birthdate,age,nationality:country.name,nationalityCode:code,position:$('#position').value,foot:$('#foot').value,club:selected.name,clubCountry:code,clubCountryName:country.name,clubStrength:selected.strength,clubLeague:selectedProfile.league,clubCup:selectedProfile.cup,clubDivisionLevel:selectedProfile.divisionLevel||1,number,appearance:currentAppearanceFromForm(),idol:{...idol}};
  startAttributeDraft(profile);
});

$('#world-cup-draw-start')?.addEventListener('click',startWorldCupDrawAnimation);
$('#world-cup-draw-skip')?.addEventListener('click',finishWorldCupDrawAnimation);
$('#world-cup-draw-continue')?.addEventListener('click',confirmWorldCupDraw);
$('#national-modal-close').addEventListener('click',()=>$('#national-modal').classList.add('hidden'));
$('#legacy-club-sign').addEventListener('click',signLegacyClub);
$('#legacy-close').addEventListener('click',()=>{if(state.player){state.player.legacyCardSeen=true;save();}$('#career-legacy-modal').classList.add('hidden');showView('home');render();});
$('#legacy-view-stats').addEventListener('click',()=>{if(state.player){state.player.legacyCardSeen=true;save();}$('#career-legacy-modal').classList.add('hidden');showView('stats');});
$('#legacy-save').addEventListener('click',saveCareerToHall);
$('#legacy-view-ranking')?.addEventListener('click',renderHistoricalRankingModal);
$('#historical-ranking-close')?.addEventListener('click',closeHistoricalRankingModal);
$('#historical-ranking-close-x')?.addEventListener('click',closeHistoricalRankingModal);

// As interações com a seleção agora são iniciadas automaticamente pela comissão técnica
// após convocações e partidas internacionais; não existe mais ação manual do jogador.

function careerTotals(){
  const p=state.player;return (state.history||[]).reduce((a,h)=>({games:a.games+(h.games||0),goals:a.goals+(h.goals||0),assists:a.assists+(h.assists||0)}),{games:0,goals:0,assists:0});
}
const HISTORICAL_TOP_100=[
['🇧🇷','Pelé','ATA'],['🇵🇹','Cristiano Ronaldo','ATA'],['🇦🇷','Lionel Messi','PD'],['🇳🇱','Johan Cruyff','ATA'],['🇧🇷','Ronaldo Nazário','ATA'],['🇦🇷','Diego Maradona','MEI'],['🇫🇷','Zinedine Zidane','MEI'],['🇧🇷','Ronaldinho Gaúcho','MEI'],['🇩🇪','Franz Beckenbauer','ZAG'],['🇧🇷','Romário','ATA'],
['🇦🇷🇪🇸','Alfredo Di Stéfano','ATA'],['🇭🇺','Ferenc Puskás','ATA'],['🇧🇷','Garrincha','PD'],['🇩🇪','Gerd Müller','ATA'],['🇧🇷','Zico','MEI'],['🇵🇹','Eusébio','ATA'],['🇫🇷','Michel Platini','MEI'],['🇳🇱','Marco van Basten','ATA'],['🇮🇹','Paolo Maldini','ZAG'],['🇪🇸','Xavi','MC'],
['🇪🇸','Andrés Iniesta','MC'],['🇩🇪','Lothar Matthäus','MC'],['🇷🇺','Lev Yashin','GOL'],['🇩🇪','Manuel Neuer','GOL'],['🇧🇷','Neymar','PE'],['🇧🇷','Rivaldo','MEI'],['🇬🇧','George Best','PD'],['🇮🇹','Franco Baresi','ZAG'],['🇺🇾','Luis Suárez','ATA'],['🇧🇷','Didi','MC'],
['🇪🇸','Sergio Ramos','ZAG'],['🇮🇹','Fabio Cannavaro','ZAG'],['🇫🇷','Thierry Henry','ATA'],['🇧🇷','Cafu','LD'],['🇧🇷','Roberto Carlos','LE'],['🇭🇷','Luka Modrić','MC'],['🇧🇷','Rivellino','MEI'],['🇮🇹','Giuseppe Meazza','ATA'],['🇬🇧','Bobby Charlton','MEI'],['🇧🇷','Jairzinho','PD'],
['🇮🇹','Roberto Baggio','MEI'],['🇧🇷','Kaká','MEI'],['🇧🇷','Sócrates','MEI'],['🇵🇱','Robert Lewandowski','ATA'],['🇮🇹','Gianluigi Buffon','GOL'],['🇪🇸','Sergio Busquets','VOL'],['🇪🇸','Iker Casillas','GOL'],['🇳🇱','Ruud Gullit','MEI'],['🇳🇱','Frank Rijkaard','VOL'],['🇳🇱','Dennis Bergkamp','SA'],
['🇫🇷','Raymond Kopa','MEI'],['🇬🇧','Bobby Moore','ZAG'],['🇺🇾','Juan Alberto Schiaffino','MEI'],['🇬🇧','Stanley Matthews','PD'],['🇮🇹','Andrea Pirlo','MC'],['🇫🇷','Karim Benzema','ATA'],['🇧🇷','Nilton Santos','LE'],['🇩🇪','Karl-Heinz Rummenigge','ATA'],['🇧🇷','Falcão','MC'],['🇮🇹','Dino Zoff','GOL'],
['🇧🇷','Leônidas da Silva','ATA'],['🇩🇪','Philipp Lahm','LD'],['🇬🇧','Kenny Dalglish','ATA'],['🇦🇷','Daniel Passarella','ZAG'],['🇫🇷','Kylian Mbappé','ATA'],['🇨🇿🇦🇹','Josef Bican','ATA'],['🇬🇧','Kevin Keegan','ATA'],['🇺🇦','Andriy Shevchenko','ATA'],['🇳🇱','Arjen Robben','PD'],['🇪🇸','Luis Suárez Miramontes','MC'],
['🇮🇹','Gianni Rivera','MEI'],['🇭🇺','Sándor Kocsis','ATA'],['🇩🇪','Sepp Maier','GOL'],['🇩🇰','Michael Laudrup','MEI'],['🇧🇷','Djalma Santos','LD'],['🇮🇹','Gaetano Scirea','ZAG'],['🇬🇧','Jimmy Greaves','ATA'],['🇧🇷','Gérson','MC'],['🇩🇪','Paul Breitner','LE'],['🇳🇱','Johan Neeskens','MC'],
['🇫🇷','Just Fontaine','ATA'],['🇬🇧','Wayne Rooney','ATA'],['🇨🇲',"Samuel Eto'o",'ATA'],['🇪🇬','Mohamed Salah','PD'],['🇧🇷','Tostão','ATA'],['🇦🇷','Mario Kempes','ATA'],['🇧🇷','Zizinho','MEI'],['🇪🇸','Raúl','ATA'],['🇵🇹','Luís Figo','PD'],['🇩🇪','Toni Kroos','MC'],
['🇦🇷','Gabriel Batistuta','ATA'],['🇧🇷','Carlos Alberto Torres','LD'],['🇳🇱','Clarence Seedorf','MC'],['🇨🇿','Pavel Nedvěd','MEI'],['🇬🇧','Gordon Banks','GOL'],['🇪🇸','David Villa','ATA'],['🇩🇪','Miroslav Klose','ATA'],['🇦🇷','Javier Zanetti','LD'],['🇮🇹','Giacinto Facchetti','LE'],['🇧🇷','Djalminha','MEI']
].map((x,i)=>({rank:i+1,flag:x[0],name:x[1],position:x[2]}));
// V10.7 — ranking histórico com ajuste por função.
// Meias/volantes recebem um deslocamento final de ~5 posições para refletir que, nesta
// lista histórica, o topo absoluto exige impacto ofensivo/transcendente ainda maior.
// Goleiros e defensores podem alcançar o Top 10 quando lendários, mas nunca o #1.
const HISTORICAL_SCORE_ANCHORS=[[1,965],[2,945],[5,920],[10,890],[20,850],[30,815],[50,740],[75,680],[100,620]];

// Patamar de referência para disputar Top 10. Ele também normaliza os componentes
// de números, títulos e prêmios. Top 5 e #1 usam padrões próprios, bem mais severos.
const HISTORICAL_POSITION_STANDARDS={
  striker:{ga:1000,titles:30,champions:4,worldCups:1,ballons:5,goldenShoes:3,peak:94,avg:7.75,games:800},
  winger:{ga:900,titles:28,champions:4,worldCups:1,ballons:4,goldenShoes:2,peak:94,avg:7.75,games:800},
  attackingMid:{ga:800,titles:28,champions:3,worldCups:1,ballons:3,goldenShoes:1,peak:94,avg:7.70,games:800},
  centralMid:{ga:650,titles:28,champions:3,worldCups:1,ballons:2,goldenShoes:0,peak:93,avg:7.65,games:850},
  defensiveMid:{ga:450,tackles:2200,titles:28,champions:3,worldCups:1,ballons:2,goldenShoes:0,peak:93,avg:7.60,games:850},
  fullback:{ga:350,tackles:2200,cleanSheets:250,titles:28,champions:3,worldCups:1,ballons:1,goldenShoes:0,peak:92,avg:7.55,games:850},
  centreBack:{ga:150,tackles:2400,cleanSheets:280,titles:28,champions:3,worldCups:1,ballons:1,goldenShoes:0,peak:93,avg:7.60,games:850},
  goalkeeper:{saves:3000,cleanSheets:300,titles:28,champions:3,worldCups:1,ballons:1,goldenShoes:0,peak:93,avg:7.60,games:900}
};

// O antigo "patamar GOAT" agora é, no máximo, referência de Top 10.
// Para entrar no Top 5 é preciso combinar produção superior, auge, longevidade,
// domínio por várias temporadas, seleção, títulos de elite e prêmios individuais.
// O #1 exige outra subida relevante em todos esses eixos.
const HISTORICAL_PANTHEON_STANDARDS={
  striker:{
    top5:{ga:1150,games:900,peak:95,avg:7.90,titles:33,champions:5,worldCups:1,ballons:6,goldenShoes:4,nationalGames:125,nationalGa:95,eliteSeasons:8,dominantSeasons:5,transcendentSeasons:2},
    top1:{ga:1350,games:1000,peak:96,avg:8.05,titles:38,champions:6,worldCups:1,ballons:8,goldenShoes:5,nationalGames:145,nationalGa:120,eliteSeasons:10,dominantSeasons:7,transcendentSeasons:4}
  },
  winger:{
    top5:{ga:1050,games:900,peak:95,avg:7.88,titles:32,champions:5,worldCups:1,ballons:5,goldenShoes:3,nationalGames:125,nationalGa:85,eliteSeasons:8,dominantSeasons:5,transcendentSeasons:2},
    top1:{ga:1250,games:1000,peak:96,avg:8.03,titles:37,champions:6,worldCups:1,ballons:7,goldenShoes:4,nationalGames:145,nationalGa:110,eliteSeasons:10,dominantSeasons:7,transcendentSeasons:4}
  },
  attackingMid:{
    top5:{ga:900,games:900,peak:95,avg:7.85,titles:32,champions:4,worldCups:1,ballons:4,goldenShoes:1,nationalGames:125,nationalGa:70,eliteSeasons:8,dominantSeasons:5,transcendentSeasons:2},
    top1:{ga:1050,games:1000,peak:96,avg:8.00,titles:37,champions:5,worldCups:1,ballons:6,goldenShoes:2,nationalGames:145,nationalGa:95,eliteSeasons:10,dominantSeasons:7,transcendentSeasons:4}
  },
  centralMid:{
    top5:{ga:700,games:950,peak:95,avg:7.80,titles:32,champions:5,worldCups:1,ballons:3,nationalGames:130,nationalGa:50,eliteSeasons:8,dominantSeasons:5,transcendentSeasons:2},
    top1:{ga:850,games:1050,peak:96,avg:7.95,titles:38,champions:6,worldCups:1,ballons:5,nationalGames:150,nationalGa:70,eliteSeasons:10,dominantSeasons:7,transcendentSeasons:4}
  },
  defensiveMid:{
    top5:{ga:500,tackles:2800,games:950,peak:94,avg:7.75,titles:32,champions:4,worldCups:1,ballons:2,nationalGames:130,nationalGa:30,eliteSeasons:8,dominantSeasons:5,transcendentSeasons:2},
    top1:{ga:600,tackles:3300,games:1050,peak:95,avg:7.90,titles:38,champions:5,worldCups:1,ballons:4,nationalGames:150,nationalGa:45,eliteSeasons:10,dominantSeasons:7,transcendentSeasons:4}
  },
  fullback:{
    top5:{ga:400,tackles:2800,cleanSheets:300,games:950,peak:94,avg:7.70,titles:32,champions:4,worldCups:1,ballons:1,nationalGames:130,nationalGa:20,eliteSeasons:8,dominantSeasons:5,transcendentSeasons:2},
    top1:{ga:500,tackles:3300,cleanSheets:360,games:1050,peak:95,avg:7.85,titles:38,champions:5,worldCups:1,ballons:2,nationalGames:150,nationalGa:30,eliteSeasons:10,dominantSeasons:7,transcendentSeasons:4}
  },
  centreBack:{
    top5:{ga:170,tackles:3100,cleanSheets:340,games:950,peak:95,avg:7.75,titles:32,champions:4,worldCups:1,ballons:2,nationalGames:130,nationalGa:15,eliteSeasons:8,dominantSeasons:5,transcendentSeasons:2},
    top1:{ga:220,tackles:3600,cleanSheets:400,games:1050,peak:96,avg:7.90,titles:38,champions:5,worldCups:1,ballons:3,nationalGames:150,nationalGa:20,eliteSeasons:10,dominantSeasons:7,transcendentSeasons:4}
  },
  goalkeeper:{
    top5:{saves:4100,cleanSheets:410,games:1050,peak:96,avg:7.85,titles:35,champions:5,worldCups:1,ballons:4,nationalGames:140,eliteSeasons:8,dominantSeasons:5,transcendentSeasons:2},
    top1:{saves:4800,cleanSheets:480,games:1150,peak:96,avg:8.00,titles:40,champions:6,worldCups:1,ballons:6,nationalGames:160,eliteSeasons:10,dominantSeasons:7,transcendentSeasons:4}
  }
};
function historicalPositionGroup(position=''){
  if(position==='Centroavante')return 'striker';
  if(position==='Segundo atacante'||position==='Ponta direita'||position==='Ponta esquerda')return 'winger';
  if(position==='Meia ofensivo'||position==='Meia direita'||position==='Meia esquerda')return 'attackingMid';
  if(position==='Meia central')return 'centralMid';
  if(position==='Volante')return 'defensiveMid';
  if(position==='Lateral direito'||position==='Lateral esquerdo')return 'fullback';
  if(position==='Zagueiro')return 'centreBack';
  if(position==='Goleiro')return 'goalkeeper';
  return 'centralMid';
}
function historicalRankFromScore(score){
  const sc=Number(score)||0;if(sc>=HISTORICAL_SCORE_ANCHORS[0][1])return 1;
  for(let i=1;i<HISTORICAL_SCORE_ANCHORS.length;i++){const [rank,threshold]=HISTORICAL_SCORE_ANCHORS[i],[prevRank,prevThreshold]=HISTORICAL_SCORE_ANCHORS[i-1];if(sc>=threshold){const t=(prevThreshold-sc)/(prevThreshold-threshold);return clamp(Math.round(prevRank+(rank-prevRank)*t),prevRank,rank);}}
  return 300;
}
function historicalOutputRatio(group,metrics){
  const std=HISTORICAL_POSITION_STANDARDS[group]||HISTORICAL_POSITION_STANDARDS.centralMid,ga=metrics.ga||0,tackles=metrics.tackles||0,cleanSheets=metrics.cleanSheets||0,saves=metrics.saves||0;
  if(['striker','winger','attackingMid','centralMid'].includes(group))return ga/Math.max(1,std.ga||1);
  if(group==='defensiveMid')return .45*(ga/Math.max(1,std.ga))+.55*(tackles/Math.max(1,std.tackles));
  if(group==='fullback')return .25*(ga/Math.max(1,std.ga))+.45*(tackles/Math.max(1,std.tackles))+.30*(cleanSheets/Math.max(1,std.cleanSheets));
  if(group==='centreBack')return .10*(ga/Math.max(1,std.ga))+.55*(tackles/Math.max(1,std.tackles))+.35*(cleanSheets/Math.max(1,std.cleanSheets));
  return .65*(saves/Math.max(1,std.saves))+.35*(cleanSheets/Math.max(1,std.cleanSheets));
}
function historicalSeasonDominance(group,history=[]){
  const defensive=['defensiveMid','fullback','centreBack','goalkeeper'].includes(group);
  const thresholds=defensive?{elite:7.55,dominant:7.85,transcendent:8.05}:{elite:7.65,dominant:7.95,transcendent:8.15};
  const qualified=history.filter(h=>(Number(h.games)||0)>=20),seasonOverall=h=>Number(h.overall)||0,seasonRating=h=>historicalSeasonGrade(h,state.player?.position);
  return {
    eliteSeasons:qualified.filter(h=>seasonRating(h)>=thresholds.elite&&seasonOverall(h)>=90).length,
    dominantSeasons:qualified.filter(h=>seasonRating(h)>=thresholds.dominant&&seasonOverall(h)>=92).length,
    transcendentSeasons:qualified.filter(h=>seasonRating(h)>=thresholds.transcendent&&seasonOverall(h)>=94).length
  };
}
function historicalMeetsStandard(std,metrics){
  if(!std)return false;
  const numericKeys=['ga','games','peak','avg','titles','champions','worldCups','ballons','goldenShoes','tackles','cleanSheets','saves','nationalGames','nationalGa','eliteSeasons','dominantSeasons','transcendentSeasons'];
  return numericKeys.every(k=>std[k]==null||(Number(metrics[k])||0)>=std[k])&&metrics.idolCount>0&&metrics.nationalIcon;
}
function historicalEligibilityCap(group,metrics){
  const pantheon=HISTORICAL_PANTHEON_STANDARDS[group]||HISTORICAL_PANTHEON_STANDARDS.centralMid;
  // #1 e Top 5 são travas absolutas. Pontuação alta sem estes requisitos não basta.
  if(historicalMeetsStandard(pantheon.top1,metrics))return 1;
  if(historicalMeetsStandard(pantheon.top5,metrics))return 2; // elegível a #2–#5 conforme pontuação

  const ratio=historicalOutputRatio(group,metrics),idol=metrics.idolCount>0,majorClub=metrics.champions+metrics.libertadores,majorSignals=majorClub+metrics.worldCups+metrics.ballons;
  // O antigo patamar "GOAT" foi rebaixado para a faixa #6–#10.
  const top10Ballons=['striker','winger'].includes(group)?3:['attackingMid','centralMid'].includes(group)?2:1;
  if(ratio>=.85&&metrics.games>=750&&metrics.peak>=93&&metrics.avg>=7.65&&metrics.titles>=24&&majorClub>=3&&(metrics.worldCups>=1||metrics.ballons>=4)&&metrics.ballons>=top10Ballons&&idol)return 6;
  const top25Ballons=['striker','winger'].includes(group)?2:1;
  if(ratio>=.72&&metrics.games>=700&&metrics.peak>=92&&metrics.avg>=7.50&&metrics.titles>=18&&majorClub>=2&&(metrics.worldCups>=1||metrics.ballons>=3)&&metrics.ballons>=top25Ballons&&idol)return 11;
  if(ratio>=.55&&metrics.games>=650&&metrics.peak>=90&&metrics.avg>=7.35&&metrics.titles>=14&&majorSignals>=2&&idol)return 26;
  if(ratio>=.40&&metrics.games>=575&&metrics.peak>=88&&metrics.avg>=7.20&&metrics.titles>=10&&majorSignals>=1&&(idol||metrics.nationalIcon))return 51;
  if(ratio>=.25&&metrics.games>=500&&metrics.peak>=86&&metrics.avg>=7.05&&metrics.titles>=7&&majorSignals>=1&&(idol||metrics.nationalIcon))return 76;
  return 300;
}
function historicalPositionRankAdjustment(group,baseRank){
  let rank=Number(baseRank)||300;
  if(rank>100)return 300;
  // MEI/MC/VOL: deslocamento deliberado de ~5 posições. Uma carreira que seria #2
  // pelo score bruto, por exemplo, termina #7; uma #11 termina #16.
  if(['attackingMid','centralMid','defensiveMid'].includes(group))rank+=5;
  // Defensores e goleiros nunca podem ser classificados como o maior da história.
  // Se uma carreira defensiva absurda produzir #1 bruto, o teto final é #2.
  if(['fullback','centreBack','goalkeeper'].includes(group))rank=Math.max(2,rank);
  return rank<=100?rank:300;
}
function historicalRankBreakdown(){
  const p=state.player,tot=careerTotals(),history=state.history||[];if(!p)return {rank:300,tier:'Sem carreira',score:0,peak:68,components:{}};
  const peak=Math.max(p.overall||0,...history.map(h=>Number(h.overall)||0),68),trophies=p.trophies||[],awards=p.awards||[],count=rx=>trophies.filter(t=>rx.test(t.name)).length;
  const worldCups=count(/FIFA World Cup|Copa do Mundo/i),champions=count(/UEFA Champions League/i),libertadores=count(/CONMEBOL Libertadores/i),clubWorlds=count(/Club World Cup|Mundial de Clubes/i),continental=count(/Champions League|Libertadores|Europa League|Sudamericana|Conference League|AFC Champions|CAF Champions|CONCACAF Champions/i);
  const ballons=awards.filter(a=>/Bola de Ouro/i.test(a.name)).length,goldenShoes=awards.filter(a=>/Chuteira de Ouro/i.test(a.name)).length;
  const games=Math.max(0,tot.games)+(p.nationalTeamGames||0),clubGa=(tot.goals||0)+(tot.assists||0),nationalGa=(p.nationalTeamGoals||0)+(p.nationalTeamAssists||0),ga=clubGa+nationalGa,nationalGames=p.nationalTeamGames||0;
  const weightedRatingGames=history.reduce((n,h)=>n+(Number(h.games)||0),0),weightedRating=history.reduce((n,h)=>n+(historicalSeasonGrade(h,p.position)||6.5)*(Number(h.games)||0),0),avg=weightedRatingGames?weightedRating/weightedRatingGames:6.5;
  const saves=history.reduce((n,h)=>n+(Number(h.saves)||0),0),tackles=history.reduce((n,h)=>n+(Number(h.tackles)||0),0),cleanSheets=history.reduce((n,h)=>n+(Number(h.cleanSheets)||0),0),group=historicalPositionGroup(p.position),std=HISTORICAL_POSITION_STANDARDS[group];
  const idolCount=Array.isArray(p.clubIdols)?p.clubIdols.length:0,dominance=historicalSeasonDominance(group,history),metrics={ga,games,peak,avg,titles:trophies.length,champions,libertadores,worldCups,clubWorlds,ballons,goldenShoes,saves,tackles,cleanSheets,idolCount,nationalIcon:!!p.nationalIcon,nationalGames,nationalGa,...dominance};
  const outputRatio=historicalOutputRatio(group,metrics),awardBallonBase=Math.max(1,std.ballons||1),awardShoeBase=Math.max(1,std.goldenShoes||1);
  const components={
    auge:clamp((peak-78)/16*120,0,120),
    desempenho:clamp((avg-6.70)/1.25*120,0,120),
    numeros:clamp(outputRatio*180,0,180),
    titulos:clamp((trophies.length/Math.max(1,std.titles))*95+(champions/Math.max(1,std.champions))*45+(worldCups/Math.max(1,std.worldCups))*40,0,180),
    premios:clamp((ballons/awardBallonBase)*115+(std.goldenShoes>0?(goldenShoes/awardShoeBase)*35:0),0,150),
    clubes:clamp((idolCount>0?40:0)+Math.min(40,(champions+libertadores)*10),0,80),
    selecao:clamp(worldCups*45+Math.min(20,nationalGames/6)+Math.min(15,(p.nationalTeamGoals||0)/5)+(p.nationalIcon?10:0),0,90),
    relevancia:clamp(((p.reputation||20)-20)*.75,0,45)+(p.nationalCaptain?15:0),
    longevidade:clamp((games-400)/500*20,0,20)
  };
  const score=Math.round(Object.values(components).reduce((a,b)=>a+b,0)),scoreRank=historicalRankFromScore(score),eligibilityCap=historicalEligibilityCap(group,metrics),baseRank=eligibilityCap>100?300:Math.max(scoreRank,eligibilityCap),rank=historicalPositionRankAdjustment(group,baseRank);
  const tier=rank===1?'Candidato a maior da história':rank<=5?'Panteão do futebol':rank<=15?'Entre os maiores da história':rank<=30?'Lenda mundial':rank<=60?'Ídolo histórico':rank<=100?'Top 100 histórico':'Fora do Top 100 histórico';
  return {rank,baseRank,tier,score,peak,worldCups,champions,libertadores,clubWorlds,ballons,goldenShoes,avg,ga,games,nationalGames,nationalGa,saves,tackles,cleanSheets,group,eligibilityCap,...dominance,components};
}
function rankingPositionLabel(position=''){const map={'Centroavante':'ATA','Segundo atacante':'SA','Ponta direita':'PD','Ponta esquerda':'PE','Meia ofensivo':'MEI','Meia central':'MC','Volante':'VOL','Lateral direito':'LD','Lateral esquerdo':'LE','Zagueiro':'ZAG','Goleiro':'GOL'};return map[position]||String(position||'JOG').slice(0,3).toUpperCase();}
function historicalFlagMarkup(flag){
  const sequence=String(flag||'');
  const regional=[...sequence].map(ch=>ch.codePointAt(0)).filter(cp=>cp>=0x1F1E6&&cp<=0x1F1FF);
  const codes=[];for(let i=0;i+1<regional.length;i+=2)codes.push(String.fromCharCode(regional[i]-0x1F1E6+65,regional[i+1]-0x1F1E6+65).toLowerCase());
  if(!codes.length)return `<span class="historical-flag-fallback">${esc(sequence||'🌍')}</span>`;
  return `<span class="historical-flag-images">${codes.map(code=>`<img src="https://flagcdn.com/${code}.svg" alt="Bandeira ${code.toUpperCase()}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'"/><span class="historical-flag-fallback" style="display:none">${esc(sequence)}</span>`).join('')}</span>`;
}
function historicalMetricGrade(metric,value){
 const maxima={auge:120,desempenho:120,numeros:180,titulos:180,premios:150,clubes:80,selecao:90,relevancia:60,longevidade:20};
 const maximum=maxima[metric]||100;
 return clamp(1+9*(Math.max(0,Number(value)||0)/maximum),1,10).toFixed(1);
}
function historicalMetricCards(comps){return Object.entries(comps||{}).map(([k,v])=>`<span><b>${k.replace('selecao','seleção')}</b><strong>${historicalMetricGrade(k,v)}</strong></span>`).join('');}
// V25: a nota da temporada preserva a nota de campo, mas reconhece um G+A
// excepcional por partida. Sempre recalcula da nota-base, sem duplicar o bônus.
function historicalSeasonGrade(h,position='Centroavante'){
 const base=Number(h?.matchRating??h?.rating),games=Math.max(0,Number(h?.games)||0);
 if(!Number.isFinite(base)||!games)return Number.isFinite(base)?clamp(base,1,10):0;
 const attackRoles=/Centroavante|atacante|Ponta|Meia ofensivo/i.test(position);
 const ga=(Math.max(0,Number(h.goals)||0)+Math.max(0,Number(h.assists)||0))/games;
 const attackBonus=attackRoles?clamp((ga-.40)*.93,0,1.45):clamp((ga-.25)*.52,0,.65);
 const defensive=!attackRoles?clamp(((Number(h.cleanSheets)||0)/games)*.48+((Number(h.tackles)||0)/Math.max(1,games*5))*.32,0,.60):0;
 const reliability=clamp((games-5)/15,0,1);
 return Math.round(clamp(base+(attackBonus+defensive)*reliability,1,10)*10)/10;
}
function renderHistoricalRankingModal(){
  const p=state.player;if(!p)return;if($('#historical-ranking-title'))$('#historical-ranking-title').textContent='Top 100 maiores da história';const r=historicalRankBreakdown(),list=HISTORICAL_TOP_100.map(x=>({...x})),flag=countryFlag(p.nationalityCode)||'🏳️',playerRow={rank:r.rank,flag,name:p.name,position:rankingPositionLabel(p.position),isUser:true};
  let rows=[];if(r.rank<=100){rows=[...list.slice(0,r.rank-1),playerRow,...list.slice(r.rank-1)].slice(0,100).map((x,i)=>({...x,rank:i+1}));}else rows=[...list,playerRow];
  const summary=$('#historical-player-summary');if(summary)summary.innerHTML=`<div class="historical-current-rank"><small>SUA POSIÇÃO</small><strong>${r.rank<=100?`#${r.rank}`:'FORA DO TOP 100'}</strong></div><div class="historical-criteria">${historicalMetricCards(r.components)}</div>`;
  const box=$('#historical-ranking-list');if(box)box.innerHTML=`<div class="historical-ranking-columns"><span>#</span><span>País</span><span>Nome</span><span>Pos.</span></div>${rows.map((x,i)=>`${r.rank>100&&i===100?'<div class="historical-ranking-gap"><span>•••</span><small>seu jogador aparece abaixo do Top 100</small></div>':''}<div class="historical-ranking-row ${x.isUser?'is-user':''}" ${x.isUser?'data-current-player-rank="true"':''}><b>${x.isUser&&r.rank>100?'—':`#${x.rank}`}</b><span class="ranking-flag">${historicalFlagMarkup(x.flag)}</span><strong>${esc(x.name)}</strong><span>${esc(x.position)}</span></div>`).join('')}`;
  $('#historical-ranking-modal')?.classList.remove('hidden');setTimeout(()=>document.querySelector('[data-current-player-rank="true"]')?.scrollIntoView({block:'center',behavior:'smooth'}),120);
}
function renderSavedCareerHistoricalRanking(index){
  const c=getSavedCareers()[index];if(!c)return;
  const rank=Math.max(1,Number(c.rank)||300),list=HISTORICAL_TOP_100.map(x=>({...x}));
  const flag=countryFlag(c.nationalityCode)||'🏳️',careerRow={rank,flag,name:c.name||'Jogador',position:rankingPositionLabel(c.position),isUser:true};
  let rows=[];if(rank<=100){rows=[...list.slice(0,rank-1),careerRow,...list.slice(rank-1)].slice(0,100).map((x,i)=>({...x,rank:i+1}));}else rows=[...list,careerRow];
  const comps=c.rankingComponents||null,totalTitles=savedCareerTotalTitles(c),ga=(Number(c.goals)||0)+(Number(c.assists)||0),seasons=(c.history||[]).length;
  const summary=$('#historical-player-summary');if(summary){
    const criteria=comps?historicalMetricCards(comps):[['auge',clamp(((Number(c.peak)||68)-68)/3.1,1,10)],['desempenho',((c.history||[]).reduce((total,row)=>total+historicalSeasonGrade(row,c.position),0)/Math.max(1,seasons))||1],['números',clamp(1+9*ga/1050,1,10)],['títulos',clamp(1+9*totalTitles/36,1,10)],['prêmios',clamp(1+9*(c.awards||0)/15,1,10)]].map(([k,v])=>`<span><b>${k}</b><strong>${Number(v).toFixed(1)}</strong></span>`).join('');
    summary.innerHTML=`<div class="historical-current-rank"><small>POSIÇÃO DESTA CARREIRA</small><strong>${rank<=100?`#${rank}`:`#${rank} · FORA DO TOP 100`}</strong></div><div class="historical-criteria">${criteria}</div>`;
  }
  const box=$('#historical-ranking-list');if(box)box.innerHTML=`<div class="historical-ranking-columns"><span>#</span><span>País</span><span>Nome</span><span>Pos.</span></div>${rows.map((x,i)=>`${rank>100&&i===100?'<div class="historical-ranking-gap"><span>•••</span><small>esta carreira aparece abaixo do Top 100</small></div>':''}<div class="historical-ranking-row ${x.isUser?'is-user':''}" ${x.isUser?'data-current-player-rank="true"':''}><b>${`#${x.rank}`}</b><span class="ranking-flag">${historicalFlagMarkup(x.flag)}</span><strong>${esc(x.name)}</strong><span>${esc(x.position)}</span></div>`).join('')}`;
  $('#historical-ranking-title').textContent=`Ranking histórico · ${c.name||'carreira salva'}`;
  $('#historical-ranking-modal')?.classList.remove('hidden');setTimeout(()=>document.querySelector('[data-current-player-rank="true"]')?.scrollIntoView({block:'center',behavior:'smooth'}),120);
}
function closeHistoricalRankingModal(){$('#historical-ranking-modal')?.classList.add('hidden');}
function historicalRankEstimate(){return historicalRankBreakdown().rank;}
function showCareerLegacyCard(){
  const p=state.player;if(!p)return;const tot=careerTotals(),r=historicalRankBreakdown(),trophies=p.trophies||[],awards=p.awards||[];
  const leagueTitles=Math.max(0,trophies.length-r.worldCups-r.champions-r.libertadores-r.clubWorlds);
  const clubs=[...new Set([...(state.history||[]).map(h=>h.club).filter(Boolean),p.club].filter(Boolean))];
  $('#legacy-card-name').textContent=p.name;$('#legacy-card-subtitle').textContent=`${p.position} · ${p.nationality} · camisa ${p.number||10} · aposentado aos ${p.retiredAge||p.age} anos`;
  $('#legacy-rank').textContent=r.rank<=100?`#${r.rank}`:'FORA';$('#legacy-final-overall').textContent=p.overall||'—';$('#legacy-peak-overall').textContent=r.peak;$('#legacy-seasons').textContent=(state.history||[]).length;$('#legacy-titles').textContent=trophies.length;$('#legacy-awards').textContent=awards.length;$('#legacy-position').textContent=p.position;$('#legacy-games').textContent=tot.games;$('#legacy-goals').textContent=tot.goals;$('#legacy-assists').textContent=tot.assists;$('#legacy-nt').textContent=p.nationalTeamGames||0;$('#legacy-shirt-name').textContent=p.name.split(' ').slice(-1)[0].toUpperCase();$('#legacy-shirt-number').textContent=p.number||10;$('#legacy-face').innerHTML=appearanceMarkup(p.appearance,true,p.number||10);$('#legacy-face').classList.add('face-avatar','legacy-face-avatar');
  $('#legacy-major-titles').innerHTML=[{label:'Copa do Mundo',count:r.worldCups,art:'FIFA World Cup'},{label:'Champions',count:r.champions,art:'UEFA Champions League'},{label:'Mundial',count:r.clubWorlds,art:'FIFA Club World Cup'},{label:'Libertadores',count:r.libertadores,art:'CONMEBOL Libertadores'},{label:'Ligas/Copas',count:leagueTitles,art:trophies[0]?.name||'Premier League'},{label:'Bola de Ouro',count:r.ballons,art:'Bola de Ouro'}].map(item=>`<div class="legacy-major-item">${honourVisual(item.art)}<span><strong>${item.count}</strong><small>${item.label}</small></span></div>`).join('');
  $('#legacy-clubs').innerHTML=clubs.length?clubs.map(name=>`<div class="legacy-club-chip"><span class="crest-shell small"><img class="club-badge-img hidden" alt=""><span class="crest-fallback" title="Escudo real ainda não localizado">S/D</span></span><b>${name}</b></div>`).join(''):'<p class="muted">Nenhum clube registrado.</p>';
  const groupedTitles=[...trophies.reduce((m,t)=>{const name=(t?.name||'Título').trim();if(name)m.set(name,(m.get(name)||0)+1);return m;},new Map()).entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'pt-BR'));$('#legacy-honours-preview').innerHTML=groupedTitles.length?groupedTitles.map(([name,count])=>`<div class="legacy-grouped-title">${honourVisual(name)}<span><strong>${esc(name)}</strong><small>${count}× campeão</small></span><b>${count}×</b></div>`).join(''):'<p class="muted">A carreira terminou sem títulos registrados.</p>';
  if($('#legacy-icon-card'))$('#legacy-icon-card').innerHTML=iconCardMarkup(buildCareerIconCardSnapshot(p),false);
  $('#legacy-rank-tier').textContent=`${r.tier} · ${r.rank<=100?`#${r.rank}`:'sem posição no Top 100'}`;$('#legacy-rank-detail').textContent=`Pontuação histórica ${r.score}. Critérios: auge, desempenho médio, números ajustados por posição, títulos, Champions/Libertadores, Copa do Mundo, prêmios individuais, idolatria, seleção e longevidade. O Top 100 exige uma carreira histórica; o Top 5 e o #1 têm travas adicionais de domínio sustentado, seleção, produção, títulos de elite e prêmios por posição.`;
  const saveBtn=$('#legacy-save');if(saveBtn){saveBtn.disabled=!!p.hallSaved;saveBtn.textContent=p.hallSaved?'Carreira salva ✓':'Salvar carreira';}
  $('#career-legacy-modal').classList.remove('hidden');$$('#legacy-clubs .legacy-club-chip').forEach(el=>hydrateBadge(el.querySelector('img'),el.querySelector('b')?.textContent,el.querySelector('.crest-fallback')));
}

function signLegacyClub(){
  const p=state.player;if(!legacyClubEligible())return;const raw=$('#legacy-club-choice').value;if(!raw)return;const sep=raw.indexOf('|'),code=raw.slice(0,sep),name=raw.slice(sep+1);const club=allTransferClubs().find(c=>c.countryCode===code&&c.name===name);if(!club)return;
  const old=p.club;p.club=club.name;p.clubCountry=club.countryCode;p.clubCountryName=countryByCode(club.countryCode)?.name||club.countryCode;p.clubStrength=club.strength||clubStrength(club.name,club.countryCode);p.clubLeague=club.league||clubCompetitionProfile(club.name,club.countryCode).league;p.clubCup=club.cup||clubCompetitionProfile(club.name,club.countryCode).cup;p.clubDivisionLevel=club.divisionLevel||1;p.clubRole=null;ensureClubRoleState(p);p.value=marketValue(p.value);state.offers=[];state.news.push(`${p.name}, já consolidado, escolhe o ${club.name} para um dos últimos capítulos da carreira, deixando o ${old}.`);save();render();showCelebration('✍️',`Destino escolhido: ${club.name}`,`${p.name} decide onde quer escrever o fim da própria história.`);
}

function showSeasonSpotlight(log){
  if(!log)return;
  const moments=generateMatchMoments(log);
  $('#spotlight-competition').textContent=`${log.event.competition}${log.event.stage?` · ${log.event.stage}`:''}`;
  $('#spotlight-title').textContent=`${log.event.home} ${log.homeGoals} × ${log.awayGoals} ${log.event.away}`;
  $('#spotlight-favorite').textContent='';
  $('#spotlight-moments').innerHTML=moments.map(m=>`<div class="timeline-moment"><span>${m.minute}'</span><p>${m.text}</p></div>`).join('');
  $('#spotlight-stats').innerHTML=`<div><strong>${log.perf.rating.toFixed(1)}</strong><small>Nota</small></div><div><strong>${log.perf.goals}</strong><small>Gols</small></div><div><strong>${log.perf.assists}</strong><small>Assist.</small></div><div><strong>${log.perf.extraValue}</strong><small>${log.perf.extraLabel}</small></div>`;
  $('#season-spotlight').classList.remove('hidden');
}
function careerSeasonLimitReached(p=state.player){return !!p&&(p.age>=Number(p.retirementTarget||window.BTLWorldCareer?.retirementAge({id:'career:'+p.name+'|'+p.birthdate})||38)||(state.history||[]).length>=MAX_CAREER_SEASONS);}
function retireAtCareerSeasonLimit(p=state.player){
  if(!p||p.retired||!careerSeasonLimitReached(p))return false;
  p.retired=true;p.retiredAge=p.age;p.legacyCardSeen=false;pendingCareerCard=true;state.offers=[];
  state.news.push(`${p.name} encerra oficialmente a carreira aos ${p.age} anos, após ${(state.history||[]).length} temporadas.`);
  return true;
}
function legacyV4_processSeasonEnd(){
  const p=state.player,s=state.season;if(!s||s.endProcessed)return;
  const avg=s.totalGames?s.ratingSum/s.totalGames:6.5;
  evaluateAwards(avg);updateSelectionAtSeasonEnd(avg);const delta=developmentResult(avg);
  state.history.push({year:s.year,club:s.clubAtStart||p.club,overall:p.overall,games:s.clubGames,goals:s.clubGoals,assists:s.clubAssists,saves:s.saves||0,tackles:s.tackles||0,cleanSheets:s.cleanSheets||0,matchRating:avg.toFixed(1),rating:historicalSeasonGrade({rating:avg,games:s.clubGames,goals:s.clubGoals,assists:s.clubAssists,tackles:s.tackles,cleanSheets:s.cleanSheets},p.position).toFixed(1),leaguePosition:s.league.position,competitions:competitionStatus().map(c=>c.title)});
  p.age++;p.value=rebalanceMarketValue(p,.58,avg);
  state.news.push(`${p.name} encerra ${s.year} com média ${avg.toFixed(1)}. GER ${p.overall} (${delta>=0?'+':''}${delta}) e POT ${p.potential}.`);
  generateOffers(avg);s.endProcessed=true;s.closed=true;s.endAverage=avg;s.developmentDelta=delta;
  retireAtCareerSeasonLimit(p);
}
function legacyV4_simulateWholeSeason(){
  const p=state.player,s=state.season;if(!s||s.closed||p.retired)return;
  const trophyCount=p.trophies?.length||0,awardCount=p.awards?.length||0;
  state.simulatingSeason=true;const logs=[];let safety=0;
  while(!seasonComplete()&&safety<140){
    const event=chooseNextEvent();if(!event)break;
    const log=simulateMatchCore(event);logs.push(log);safety++;
  }
  if(safety>=140){state.simulatingSeason=false;toast('A simulação atingiu o limite de segurança do calendário.');save();render();return;}
  const featured=logs.sort((a,b)=>matchImportance(b)-matchImportance(a))[0]||null;s.featuredMatch=featured?{competition:featured.event.competition}:null;
  processSeasonEnd();
  const newTitles=(p.trophies||[]).slice(trophyCount).map(t=>t.name);const newAwards=(p.awards||[]).slice(awardCount).map(a=>a.name);
  pendingSeasonCelebration={titles:newTitles,awards:newAwards,ceremonies:state.season?.specialAwardCeremonies||[],idols:state.season?.idolCelebrations||[]};state.simulatingSeason=false;nextEventCache=null;save();render();showSeasonSpotlight(featured);
  toast(`${state.offers.length} proposta(s) chegaram ao fim da temporada.`);
}
function showPendingSeasonCelebration(){
  const c=pendingSeasonCelebration;pendingSeasonCelebration=null;if(!c)return;
  const ceremonies=c.ceremonies||[],idols=[...(c.idols||[])];
  if(!c.titles.length&&!c.awards.length&&!ceremonies.length&&!idols.length)return;
  const showHonours=()=>{if(c.titles.length||c.awards.length)showSeasonHonoursGallery(c.titles,c.awards);};
  const showIdol=()=>{
    if(!idols.length){showHonours();return;}
    const item=idols.shift();$('#celebration').classList.add('idol-celebration');celebrationAfter=showIdol;showCelebration(item.icon,item.title,item.subtitle);
  };
  queueSpecialAwardCeremonies(ceremonies,showIdol);
}

$('#simulate-btn').addEventListener('click',simulateWholeSeason);
$('#close-spotlight').addEventListener('click',()=>{$('#season-spotlight').classList.add('hidden');showPendingSeasonCelebration();});

$('#finish-season').addEventListener('click',()=>{
  const p=state.player,s=state.season;if(!s||!s.closed||p.retired)return;
  if(state.worldDbKey&&!worldStoreReady){toast('O banco de jogadores ainda não foi recuperado. Não é seguro avançar.');return;}
  const oldDelta=s.developmentDelta||0;const stayed=p.club===(s.clubAtStart||p.club);
  commitSeasonQualifications(s);const last=qualifiedForYear(p.clubCountry,p.club,s.year);
  const cupEarned=(s.leagueCup?.won&&s.countryAtStart==='ENG')?'UEFA Conference League':null;
  const earned=(p.clubDivisionLevel||1)>1?cupEarned:(last?.competition||cupEarned||null);
  const nextYear=s.year+1;state.offers=[];adaptClubDivisionForNextSeason(nextYear);try{simulateWorldTransfers();}catch(error){console.error('Falha ao atualizar transferências mundiais; a próxima temporada continuará normalmente.',error);state.news.push('O mercado global não pôde ser atualizado nesta virada, mas a nova temporada foi iniciada normalmente.');}state.season=createSeason(p,nextYear,earned);nextEventCache=null;
  if(p.age>=30&&oldDelta<0)state.news.push(`A idade começa a pesar: ${p.name} perdeu ${Math.abs(oldDelta)} ponto(s) de overall na última temporada.`);
  if(Math.random()<.60){const event=pickFreshCareerEvent(CAREER_EVENTS);if(event)state.pendingEvent={...event};}
  save();render();toast(`Temporada ${nextYear} iniciada. GER ${p.overall} · POT ${p.potential}`);
});

window.acceptOffer=index=>{
  const o=state.offers[index],p=state.player;if(!o||p.retired)return;const old=p.club;p.club=o.club;p.clubCountry=o.countryCode;p.clubCountryName=o.countryName;p.clubStrength=o.strength;const incoming=clubCompetitionProfile(o.club,o.countryCode);p.clubLeague=incoming.league;p.clubCup=o.cup||incoming.cup;p.clubDivisionLevel=incoming.divisionLevel;p.clubRole=null;ensureClubRoleState(p);p.value=marketValue(o.value);p.morale=clamp(p.morale+5,40,100);state.news.push(`${p.name} deixa o ${old} e é anunciado pelo ${o.club}${p.clubDivisionLevel>1?` (${p.clubLeague})`:''}.`);state.offers=[];save();render();showCelebration('✍️',`Novo clube: ${o.club}`,`${p.name} inicia um novo capítulo da carreira.`);
};
window.rejectOffer=index=>{state.offers.splice(index,1);save();render();toast('Proposta recusada.');};

function openNewCareerConfirmation(){
  if(!state.created){showView('create');return;}
  $('#new-career-modal')?.classList.remove('hidden');
  $('#new-career-cancel')?.focus();
}
function closeNewCareerConfirmation(){ $('#new-career-modal')?.classList.add('hidden'); }
function deleteCurrentCareerAndCreate(){
  const savedCareers=[...getSavedCareers()];
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  clearDraftState();pendingPlayerProfile=null;attributeDraft=null;creationPhotoDataUrl='';
  state={created:false,player:null,season:null,history:[],offers:[],news:[],pendingEvent:null,savedCareers};
  state.pendingMatchDecision=null;state.pendingPenaltyShootout=null;
  nextEventCache=null;pausedCareerOverlay=null;pendingSeasonCelebration=null;
  document.querySelectorAll('.modal-backdrop:not(#new-career-modal)').forEach(el=>el.classList.add('hidden'));
  closeNewCareerConfirmation();save();render();showView('create');
  toast('Carreira anterior excluída. Hall da Fama preservado.');
}
$('#reset-career').addEventListener('click',openNewCareerConfirmation);
$('#home-new-career')?.addEventListener('click',()=>state.created?openNewCareerConfirmation():(showView('create'),startSoundtrackForGameplay()));
$('#new-career-cancel')?.addEventListener('click',closeNewCareerConfirmation);
$('#new-career-confirm')?.addEventListener('click',deleteCurrentCareerAndCreate);
$('#new-career-modal')?.addEventListener('click',e=>{if(e.target.id==='new-career-modal')closeNewCareerConfirmation();});


$('#retire-career').addEventListener('click',()=>{
  const p=state.player,s=state.season;if(!p||p.retired)return;
  if(p.age<=30){toast('A aposentadoria voluntária fica disponível após os 30 anos.');return;}
  const dlg=$('#retirement-confirm-modal');
  if(dlg){$('#retirement-confirm-name').textContent=p.name;$('#retirement-confirm-age').textContent=`${p.age} ANOS`;dlg.classList.remove('hidden');return;}
  return;
});
function finalizeVoluntaryRetirement(){
  const p=state.player,s=state.season;if(!p||p.retired||p.age<=30)return;
  $('#retirement-confirm-modal')?.classList.add('hidden');
  if(s&&!s.closed&&s.clubGames>0){
    const avg=s.totalGames?s.ratingSum/s.totalGames:6.5;
    state.history.push({year:s.year,club:s.clubAtStart||p.club,clubCountry:s.countryAtStart||p.clubCountry,overall:p.overall,games:s.clubGames,goals:s.clubGoals,assists:s.clubAssists,saves:s.saves||0,tackles:s.tackles||0,cleanSheets:s.cleanSheets||0,matchRating:avg.toFixed(1),rating:historicalSeasonGrade({rating:avg,games:s.clubGames,goals:s.clubGoals,assists:s.clubAssists,tackles:s.tackles,cleanSheets:s.cleanSheets},p.position).toFixed(1),leaguePosition:s.league.position||null,cupStatus:'Aposentadoria durante a temporada',continentalStatus:'Aposentadoria durante a temporada',competitions:competitionStatus().map(c=>c.title)});
  }
  p.retired=true;p.retiredAge=p.age;p.legacyCardSeen=false;state.offers=[];state.pendingEvent=null;state.pendingMatchDecision=null;state.pendingPenaltyShootout=null;state.season=null;
  state.news.push(`${p.name} anunciou a aposentadoria aos ${p.age} anos.`);pendingCareerCard=true;
  nextEventCache=null;save();render();showCelebration('👟','Fim de carreira',`${p.name} encerra sua trajetória profissional aos ${p.age} anos.`);
}
$('#retirement-confirm-cancel')?.addEventListener('click',()=>$('#retirement-confirm-modal')?.classList.add('hidden'));
$('#retirement-confirm-accept')?.addEventListener('click',finalizeVoluntaryRetirement);
$('#retirement-confirm-modal')?.addEventListener('click',e=>{if(e.target.id==='retirement-confirm-modal')e.currentTarget.classList.add('hidden');});




/* ===== CareerSim V5: temporada interativa, classificação e mercado garantido ===== */
// Unified, persistent round-by-round fixture ledger. It never resamples
// the player's recorded match results at the end of a season.
function ensureSeasonLeagueLedger(s=state.season){
 if(!s?.league||!window.BTLMatchLedger)return null;
 const l=s.league;if(l.matchLedger?.version===1)return l.matchLedger;
 const code=s.countryAtStart||state.player?.clubCountry,team=s.clubAtStart||state.player?.club;
 const clubs=[...new Set([team,...(l.schedule||[]).flatMap(e=>[e.home,e.away])])].filter(Boolean);
 const ledger=window.BTLMatchLedger.create(clubs,l.schedule,team,`${s.year}|${code}|${l.name}`);
 if(l.index>0){
  // Older saves carry aggregated user stats, not every historical fixture.
  // Preserve those aggregates, without fabricating individual match scores.
  ledger.legacy={team,games:l.index,wins:l.wins,draws:l.draws,losses:l.losses,gf:l.gf,ga:l.ga,points:l.points};
  for(let r=1;r<=l.index;r++)window.BTLMatchLedger.advance(ledger,r,null,n=>clubStrength(n,code));
 }
 l.matchLedger=ledger;return ledger;
}
// Other national leagues are deterministic and reproducible; keep their
// detailed match records in MEMORY to avoid exceeding the browser's
// localStorage quota over a multi-decade career. Only standings are saved.
const externalLeagueLedgerCache=new Map();
function simulateUnplayedLeagueLedger(year,code,league,names){
 const key=window.BTLSeasonDivisions?.key(code,league)||`${code}|${league}`;
 const roster=[...new Set(names||[])].filter(Boolean);
 const cacheKey=`${year}|${key}`;
 let ledger=externalLeagueLedgerCache.get(cacheKey);
 if(!ledger||ledger.teams.join('|')!==roster.join('|')){
  const format=getLeagueFormatForClub(code,league);
  ledger=window.BTLMatchLedger.simulatedLeague(roster,year,code,league,
    team=>clubStrength(team,code),format.matches).ledger;
  externalLeagueLedgerCache.set(cacheKey,ledger);
 }
 return window.BTLMatchLedger.standings(ledger);
}
window.BTLExternalLeagueMatches=(year,code,league)=>externalLeagueLedgerCache.get(`${year}|${code}|${league}`)||null;
function leagueTableRow(team, code, format){
  const strength=clubStrength(team,code);const games=format.matches;
  let points=clamp(Math.round(games*(1.13+(strength-70)*.039)+rnd(-7,7)),Math.round(games*.55),Math.round(games*2.38));
  let draws=clamp(rnd(5,11),0,games);while(draws%3!==points%3&&draws<games)draws++;
  let wins=Math.floor((points-draws)/3);if(wins<0){wins=0;draws=points;}while(wins+draws>games&&draws>=3){draws-=3;wins++;}
  const losses=Math.max(0,games-wins-draws);points=wins*3+draws;
  const gf=clamp(Math.round(games*(1.05+(strength-68)*.035))+rnd(-7,8),18,100);const ga=clamp(Math.round(games*(1.18-(strength-68)*.018))+rnd(-6,8),16,90);
  return {team,games,wins,draws,losses,gf,ga,gd:gf-ga,points,strength};
}
function finalizeLeague(){
  const l=state.season.league;if(l.finished)return;l.finished=true;const p=state.player;
  const code=state.season.countryAtStart||p.clubCountry,club=state.season.clubAtStart||p.club;
  // A classificação precisa usar os MESMOS times do calendário disputado,
  // incluindo a divisão e o ano; nunca trocar silenciosamente pela Série A.
  const playedTeams=[...new Set([club,...(l.schedule||[]).flatMap(m=>[m.home,m.away])])].filter(Boolean);
  const teams=playedTeams.length>1?playedTeams:leaguePoolForCountry(code,club,l.name,state.season.year);
  l.participants=[...teams];
  const ledger=ensureSeasonLeagueLedger(state.season);
  // Simulate only matches not involving the player; user matches must be real.
  const rows=window.BTLMatchLedger.standings(ledger);
  l.standings=rows.map(r=>({...r,user:r.team===club,strength:clubStrength(r.team,code)}));
  l.position=l.standings.find(r=>r.user)?.position||1;
  l.resultIntegrity={recordedMatches:ledger.results.length,playerMatches:ledger.results.filter(m=>m.source==='partida do jogador').length,legacyAggregated:!!ledger.legacy,source:'registro único de partidas'};
  if(state.season.divisionLevel===1)l.standings=applyQualifyingPositions(state.season.countryAtStart||p.clubCountry,l.standings,{year:state.season.year});
  if(window.BTLSeasonDivisions)l.standings=window.BTLSeasonDivisions.decorate(l.standings,state.season.countryAtStart||p.clubCountry,l.name);
  if(l.position===1)addTrophy(l.name);state.news.push(`${state.season.clubAtStart||p.club} encerrou ${l.name} na ${l.position}ª posição, com ${l.points} pontos.`);
}
// Limites de GER para o começo da carreira. O POT pode continuar acima desses
// valores; o limite controla apenas quanto GER o jogador pode atingir em cada temporada.
const EARLY_CAREER_OVERALL_CAPS = [74,80,86,90,93,95,96,97,98,98,99,99,99,99,99,99,99,99];
function currentCareerSeasonNumber(){
  if(state.season?.year && typeof START_YEAR!=='undefined') return Math.max(1,state.season.year-START_YEAR+1);
  return Math.max(1,(state.history?.length||0)+1);
}
function currentSeasonOverallCap(){
  const seasonNumber=currentCareerSeasonNumber();
  return EARLY_CAREER_OVERALL_CAPS[Math.min(EARLY_CAREER_OVERALL_CAPS.length-1,seasonNumber-1)] ?? 99;
}
function eliteOverallAdvanceAllowed(p,avg,rate,contributionTarget,roleSkill,primaryValue,attacking){
  const o=p.overall||68;if(o<90)return true;
  const requirements={
    90:{avg:7.60,skill:81,chance:.97},91:{avg:7.72,skill:82,chance:.95},92:{avg:7.82,skill:83,chance:.90},
    93:{avg:7.95,skill:84,chance:.82},94:{avg:8.08,skill:86,chance:.69},95:{avg:8.24,skill:87,chance:.52},
    96:{avg:8.40,skill:89,chance:.36},97:{avg:8.56,skill:90,chance:.22},98:{avg:8.72,skill:91,chance:.11}
  };
  const req=requirements[Math.min(98,o)]||requirements[98];
  if(avg<req.avg||roleSkill<req.skill||primaryValue<Math.min(94,req.skill+2))return false;
  if(attacking&&rate<contributionTarget*(o>=96?1.08:o>=93?.98:.88))return false;
  return Math.random()<req.chance;
}
function developmentResult(avg){
  const p=state.player,s=state.season,age=p.age,gk=p.position==='Goleiro',devAge=gk?age-3:age;
  const games=Math.max(1,s?.clubGames||1),contributions=(s?.clubGoals||0)+(s?.clubAssists||0),rate=contributions/games;
  const attacking=!['Goleiro','Zagueiro','Lateral direito','Lateral esquerdo','Volante'].includes(p.position);
  const contributionTarget=attacking?.40:.14;
  const attrs=normalizePlayerAttributes(p),roleSkill=positionWeightedAttributeScore(p,attrs);
  const primaryId=primaryAttributeForPosition(p.position),primaryValue=normalizedAttributeValue(primaryId,attrs[primaryId]);
  const seasonNo=currentCareerSeasonNumber(),potentialGap=Math.max(0,(p.potential||p.overall)-p.overall);

  // Progressão deliberadamente mais lenta: 90+ é elite, 95+ é geracional e 99 é raro.
  let base=avg>=8.45?4:avg>=7.85?3:avg>=7.15?2:avg>=6.55?1:avg<5.7?-2:avg<6.0?-1:0;
  if(devAge<=21&&p.overall<=74&&avg>=6.20)base=Math.max(base,potentialGap>=12?5:3);
  if(age<=23&&p.overall<82&&potentialGap>=8&&(s.clubGames||0)>=10){
    if(avg>=6.65)base=Math.max(base,p.overall<=76?5:4);
    else if(avg>=6.20)base=Math.max(base,4);
    else if(avg>=5.95)base=Math.max(base,3);
    else if(avg>=5.70)base=Math.max(base,2);
    const role=ensureClubRoleState(p);if((role.correctDecisions||0)>=2&&avg>=6.65)base=Math.max(base,Math.min(4,2+Math.floor(role.correctDecisions/2)));
  }
  if(seasonNo<=5&&age<=23&&p.overall<=72&&potentialGap>=12&&avg>=6.20)base=Math.max(base,3);
  if(avg>=8.15&&rate>=contributionTarget*1.35&&p.overall<90)base=Math.min(4,base+1);

  if(base>0){
    let cap=devAge<=22?5:devAge<=25?4:devAge<=29?3:devAge<=32?2:devAge<=36?(avg>=7.9?1:0):0;
    if(p.overall>=94)cap=Math.min(cap,1);else if(p.overall>=90)cap=Math.min(cap,2);
    base=Math.min(base,cap);
    if(base>0&&!eliteOverallAdvanceAllowed(p,avg,rate,contributionTarget,roleSkill,primaryValue,attacking))base=0;
  }

  if(age>=(gk?35:32)&&age<37){base=age>=35?(avg>=8.45?0:-1):(avg>=8.3?0:Math.random()<.60?-1:0);}
  if(age>=37){
    if(age<=38)base=avg>=8.7?-1:-rnd(1,2);
    else if(age<=40)base=-rnd(1,2);
    else if(age<=42)base=-rnd(2,3);
    else base=-rnd(3,5);
  }

  const trainingBoost=clamp(p.developmentBoost||0,0,1);p.developmentBoost=0;
  if(age<37&&base>0&&trainingBoost&&p.overall<93)base=Math.min(base+trainingBoost,devAge<=22?5:4);
  base=clamp(base,-5,5);

  // POT pode crescer, porém 95-99 não é mais um caminho automático de boas temporadas.
  let potentialDelta=age>=37?-1:(avg>=8.55?1:avg>=7.45&&p.potential<94?1:avg<5.9&&age<=29?-1:0);
  if(p.potential>=94&&potentialDelta>0){
    const potChance=p.potential===94?.55:p.potential===95?.38:p.potential===96?.24:p.potential===97?.13:p.potential>=98?.06:.7;
    if(avg<8.35||Math.random()>potChance)potentialDelta=0;
  }
  p.potential=clamp(p.potential+potentialDelta,Math.max(68,p.overall),99);

  if(base>0&&p.overall+base>p.potential&&avg>=8.15&&p.potential<95){
    p.potential=clamp(p.potential+1,p.overall,95);
  }

  const before=p.overall,seasonOverallCap=currentSeasonOverallCap();
  if(base>0)p.overall=Math.min(seasonOverallCap,99,Math.min(p.potential,p.overall+base));
  else p.overall=clamp(p.overall+base,45,Math.min(99,seasonOverallCap));
  if(age>=37)p.potential=Math.max(p.overall,p.potential);
  const delta=p.overall-before;evolvePlayerAttributes(delta,avg);return delta;
}

function marketBandForOverall(overall){
  if(overall<=72)return {id:'development',label:'Desenvolvimento',tiers:['development'],target:71,spread:6};
  if(overall<=78)return {id:'global',label:'Mercado global',tiers:['global','development','upper'],target:78,spread:7};
  if(overall<=84)return {id:'upper',label:'Europa forte',tiers:['upper','global','elite'],target:84,spread:7};
  return {id:'elite',label:'Elite europeia',tiers:['elite','upper'],target:90,spread:8};
}
function inferredMarketTier(c){
  if(c.marketTier)return c.marketTier;const strength=c.strength||72,conf=confederation(c.countryCode);
  if(conf==='UEFA')return strength>=87?'elite':strength>=80?'upper':strength>=74?'global':'development';
  if(['US','MX','JP','SA','KR','QA','AE'].includes(c.countryCode))return strength>=82?'upper':'global';
  return strength>=83?'upper':strength>=74?'global':'development';
}
function offerClubScore(c,p,band,avg){
  const strength=c.strength||72,tier=inferredMarketTier(c),tierIndex=band.tiers.indexOf(tier),conf=confederation(c.countryCode);let score=0;
  score+=tierIndex===0?42:tierIndex===1?22:tierIndex===2?8:-18;
  score+=Math.max(0,28-Math.abs(strength-band.target)*3.1);
  if(c.minOverall&&p.overall<c.minOverall)score-=80;
  if(c.maxOverall&&p.overall>c.maxOverall)score-=55;
  if((c.divisionLevel||1)>1&&p.overall>=79)score-=65;
  if(band.id==='development'){
    if((c.divisionLevel||1)>1)score+=20;
    if(conf==='UEFA'&&!['ENG','ES','DE','IT','FR'].includes(c.countryCode)&&strength<=79)score+=24;
  }
  if(band.id==='global'&&['US','MX','JP','SA','KR','QA','AE'].includes(c.countryCode))score+=20;
  if(band.id==='upper')score+=conf==='UEFA'?20:-38;
  if(band.id==='elite')score+=conf==='UEFA'&&strength>=86?28:-90;
  score+=(avg-6.5)*7+Math.random()*18;
  return score;
}
function generateOffers(avg){
  const p=state.player,band=marketBandForOverall(p.overall);let all=allTransferClubs().filter(c=>c.name!==p.club);
  const recent=new Set(p.recentOfferClubs||[]);let eligible=all.filter(c=>(!c.minOverall||p.overall>=c.minOverall)&&(!c.maxOverall||p.overall<=c.maxOverall));
  if(band.id==='upper')eligible=eligible.filter(c=>confederation(c.countryCode)==='UEFA'&&(c.divisionLevel||1)===1);
  if(band.id==='elite')eligible=eligible.filter(c=>confederation(c.countryCode)==='UEFA'&&(c.divisionLevel||1)===1&&(c.strength||72)>=82);
  if(band.id==='global')eligible=eligible.filter(c=>inferredMarketTier(c)!=='elite');
  if(eligible.length<12){eligible=all.filter(c=>(!c.minOverall||p.overall>=c.minOverall));if(band.id==='upper'||band.id==='elite')eligible=eligible.filter(c=>confederation(c.countryCode)==='UEFA'&&(c.divisionLevel||1)===1);}
  const fresh=eligible.filter(c=>!recent.has(`${c.countryCode}:${c.name}`));if(fresh.length>=10)eligible=fresh;
  const ranked=eligible.map(c=>({...c,_marketScore:offerClubScore(c,p,band,avg)})).sort((a,b)=>b._marketScore-a._marketScore);
  const performanceCount=avg>=8.15?4:avg>=7.25?3:2;const count=clamp(performanceCount+(p.marketBonus||0),2,4);p.marketBonus=0;
  const shortlist=ranked.slice(0,Math.min(42,ranked.length));const chosen=[],usedCountries=new Set();
  for(let slot=0;slot<count;slot++){
    let pool=shortlist.filter(c=>!chosen.some(x=>x.name===c.name&&x.countryCode===c.countryCode)&&!usedCountries.has(c.countryCode));
    if(!pool.length)pool=shortlist.filter(c=>!chosen.some(x=>x.name===c.name&&x.countryCode===c.countryCode));
    if(!pool.length)break;
    const window=pool.slice(0,Math.min(12,pool.length));const pick=window[Math.floor(Math.pow(Math.random(),1.65)*window.length)];
    if(pick){chosen.push(pick);usedCountries.add(pick.countryCode);}
  }
  if(chosen.length<count){for(const c of ranked){if(chosen.length>=count)break;if(!chosen.some(x=>x.name===c.name&&x.countryCode===c.countryCode))chosen.push(c);}}
  const valueMultiplier=tier=>tier==='elite'?[1.24,1.90]:tier==='upper'?[1.14,1.72]:tier==='global'?[1.05,1.52]:[.96,1.34];
  state.offers=chosen.slice(0,count).map(c=>{
    const profile=clubCompetitionProfile(c.name,c.countryCode),tier=inferredMarketTier(c),[lo,hi]=valueMultiplier(tier);return {club:c.name,countryCode:c.countryCode,countryName:countryByCode(c.countryCode)?.name||c.countryCode,league:c.league||profile.league,cup:c.cup||profile.cup,divisionLevel:c.divisionLevel||profile.divisionLevel||1,marketTier:tier,strength:c.strength||clubStrength(c.name,c.countryCode),minOverall:c.minOverall||null,value:marketValue(p.value*(lo+Math.random()*(hi-lo)))};
  });
  p.recentOfferClubs=[...(p.recentOfferClubs||[]),...state.offers.map(o=>`${o.countryCode}:${o.club}`)].slice(-14);
  state.news.push(`${p.name} recebeu ${state.offers.length} proposta(s) ao fim da temporada · faixa ${band.label}.`);
}

function cupFinalStatus(comp){
  if(!comp)return 'Não disputou';if(comp.won)return 'Campeão';if(comp.eliminated)return `Eliminado — ${comp.stages[comp.stageIndex]?.name||'mata-mata'}`;return comp.active?`${comp.stages[comp.stageIndex]?.name||'Em andamento'}`:'Encerrado';
}
function continentalFinalStatus(c){
  if(!c)return 'Não disputou';if(c.won)return 'Campeão';if(c.eliminated)return c.phase==='phase'?`Eliminado — ${c.format.phase}`:`Eliminado — ${c.knockout.stages[c.knockout.stageIndex]?.name||'mata-mata'}`;return c.phase==='phase'?`${c.format.phase} — ${c.points} pts`:`${c.knockout.stages[c.knockout.stageIndex]?.name||'Mata-mata'}`;
}
function buildDecisionScenario(event){
  const p=state.player,s=state.season;
  const minute=rnd(18,88),quality=clamp((p.overall-67)*.008,0,.20);
  const boost=opts=>opts.map(o=>({...o,chance:clamp(o.chance+quality,.12,.94)}));
  const make=(id,visual,title,description,options,prompt='')=>({id,minute,visual,title,description,options:boost(options),prompt});
  const goalkeeper=[
    make('gk_one_on_one','goalkeeper','Cara a cara',`${event.opponent} escapa em velocidade e fica frente a frente com você.`,[
      {label:'Sair do gol',effect:'Fecha o ângulo, mas aumenta o risco.',type:'defense',chance:.58,rating:.58,risk:.18},
      {label:'Esperar a finalização',effect:'Confia nos reflexos e mantém a posição.',type:'defense',chance:.66,rating:.46,risk:.09},
      {label:'Fechar o canto curto',effect:'Protege o lado mais próximo.',type:'defense',chance:.61,rating:.52,risk:.13}], 'Escolha como defender o 1 contra 1'),
    make('gk_cross','goalkeeper','Cruzamento venenoso','A bola vem fechada na pequena área com vários jogadores disputando.',[
      {label:'Sair de soco',effect:'Agressivo e eficaz se o tempo for perfeito.',type:'defense',chance:.61,rating:.55,risk:.16},
      {label:'Tentar segurar',effect:'Mais controle, mas exige segurança.',type:'defense',chance:.57,rating:.65,risk:.18},
      {label:'Ficar na linha',effect:'Evita o erro na saída e reage à cabeçada.',type:'defense',chance:.68,rating:.42,risk:.09}], 'Decida como atacar o cruzamento'),
    make('gk_penalty','goalkeeper','Pênalti contra','O árbitro aponta a marca da cal. O cobrador espera sua reação.',[
      {label:'Canto esquerdo',effect:'Aposte na leitura corporal do batedor.',type:'defense',chance:.40,rating:.82,risk:.12},
      {label:'Esperar no centro',effect:'Chance menor de se comprometer cedo.',type:'defense',chance:.36,rating:.88,risk:.10},
      {label:'Canto direito',effect:'Tente antecipar a direção da cobrança.',type:'defense',chance:.40,rating:.82,risk:.12}], 'Escolha sua leitura do pênalti'),
    make('gk_long_shot','goalkeeper','Chute de longa distância','O meia rival encontra espaço e arma uma finalização forte de fora da área.',[
      {label:'Dar um passo à frente',effect:'Melhora o ângulo, mas exige reação rápida.',type:'defense',chance:.66,rating:.52,risk:.10},
      {label:'Manter-se na linha',effect:'Prioriza tempo de reação.',type:'defense',chance:.70,rating:.44,risk:.08},
      {label:'Antecipar o canto',effect:'Leitura ousada para buscar uma grande defesa.',type:'defense',chance:.54,rating:.74,risk:.18}], 'Escolha seu posicionamento'),
    make('gk_sweeper','goalkeeper','Bola nas costas da defesa','Um lançamento longo quebra a linha e você precisa decidir se sai da área.',[
      {label:'Sair como líbero',effect:'Pode matar a jogada antes do atacante.',type:'defense',chance:.60,rating:.66,risk:.20},
      {label:'Esperar na área',effect:'Menos risco, mas concede avanço.',type:'defense',chance:.68,rating:.42,risk:.10},
      {label:'Atacar a bola de cabeça',effect:'Muito arriscado, grande impacto se funcionar.',type:'defense',chance:.48,rating:.88,risk:.26}], 'Decida até onde sair do gol'),
    make('gk_corner_scramble','goalkeeper','Bate-rebate na pequena área','Após um escanteio, a bola fica viva entre várias pernas na pequena área.',[
      {label:'Abafar a bola',effect:'Ataque o espaço antes da segunda finalização.',type:'defense',chance:.61,rating:.67,risk:.17},
      {label:'Fechar o ângulo',effect:'Espere o chute e reaja.',type:'defense',chance:.66,rating:.52,risk:.10},
      {label:'Afastar de soco',effect:'Limpa a área se acertar o tempo.',type:'defense',chance:.57,rating:.72,risk:.20}], 'Escolha sua reação no tumulto'),
    make('gk_free_kick_wall','goalkeeper','Falta lateral fechada','A cobrança vem forte na direção do gol e pode desviar em qualquer jogador.',[
      {label:'Atacar a bola',effect:'Tente interceptar antes do desvio.',type:'defense',chance:.62,rating:.61,risk:.16},
      {label:'Seguir na linha',effect:'Prioriza reação ao desvio.',type:'defense',chance:.68,rating:.48,risk:.09},
      {label:'Orientar a barreira',effect:'Reduz o espaço de finalização.',type:'control',chance:.76,rating:.34}], 'Comande a defesa da bola parada'),
    make('gk_backpass','build','Recuo perigoso','Um recuo vem curto e o atacante rival dispara para pressionar você.',[{label:'Dominar e sair jogando',effect:'Frieza para quebrar a pressão.',type:'control',chance:.60,rating:.62,risk:.16},{label:'Chutar para a lateral',effect:'Elimina o risco imediatamente.',type:'control',chance:.82,rating:.30,risk:.04},{label:'Passe de primeira no volante',effect:'Jogada técnica e arriscada.',type:'assist',chance:.52,rating:.78,risk:.22}], 'Saia da pressão com os pés'),
    make('gk_last_corner','goalkeeper','Último escanteio','Até o goleiro rival entra na área. O estádio inteiro fica de pé.',[{label:'Sair no alto',effect:'Ataque a bola e encerre a jogada.',type:'defense',chance:.58,rating:.78,risk:.21},{label:'Proteger a linha',effect:'Confie nos reflexos.',type:'defense',chance:.66,rating:.56,risk:.11},{label:'Socar para longe',effect:'Afaste sem tentar encaixar.',type:'defense',chance:.63,rating:.65,risk:.16}], 'Defenda o último lance')
  ];
  const defenders=[
    make('def_tackle','defense','Ataque perigoso','O adversário acelera perto da área e você é o último defensor por dentro.',[
      {label:'Dar o bote',effect:'Pode roubar a bola ou ser driblado.',type:'defense',chance:.60,rating:.52,risk:.18},
      {label:'Cercar e atrasar',effect:'Força o atacante a pensar.',type:'defense',chance:.70,rating:.38,risk:.08},
      {label:'Antecipar o passe',effect:'Leitura difícil, recompensa alta.',type:'defense',chance:.53,rating:.67,risk:.22}], 'Escolha sua abordagem defensiva'),
    make('def_cross','defense','Cruzamento na segunda trave','O ponta levanta a bola e seu adversário aparece atacando o espaço.',[
      {label:'Atacar a bola',effect:'Prioriza o corte antes do cabeceio.',type:'defense',chance:.66,rating:.52,risk:.11},
      {label:'Marcar o corpo',effect:'Tira o equilíbrio do atacante.',type:'defense',chance:.63,rating:.49,risk:.12},
      {label:'Recuar para a linha',effect:'Protege o gol, mas concede a disputa.',type:'defense',chance:.69,rating:.38,risk:.08}], 'Como defender o cruzamento?'),
    make('def_counter','defense','Contra-ataque 3 contra 2','Seu time perde a bola e você precisa controlar uma transição em inferioridade.',[
      {label:'Fechar o passe central',effect:'Protege o corredor mais perigoso.',type:'defense',chance:.68,rating:.48,risk:.09},
      {label:'Pressionar o portador',effect:'Tenta matar a jogada cedo.',type:'defense',chance:.56,rating:.66,risk:.20},
      {label:'Recuar até a área',effect:'Ganha tempo para os companheiros voltarem.',type:'defense',chance:.72,rating:.36,risk:.07}], 'Escolha como frear o contra-ataque'),
    make('def_build','build','Saída sob pressão','Você recebe a bola na defesa com a linha rival pressionando alto.',[
      {label:'Passe vertical',effect:'Quebra linhas se encontrar o volante.',type:'assist',chance:.55,rating:.56},
      {label:'Conduzir para o espaço',effect:'Atrai a pressão e cria superioridade.',type:'control',chance:.64,rating:.46},
      {label:'Bola longa',effect:'Alivia a pressão rapidamente.',type:'control',chance:.74,rating:.28}], 'Escolha a saída de bola'),
    make('def_setpiece','defense','Escanteio nos acréscimos','O rival lota a área em busca do empate.',[
      {label:'Marcar a primeira trave',effect:'Corta a trajetória mais curta.',type:'defense',chance:.68,rating:.50,risk:.09},
      {label:'Seguir o melhor cabeceador',effect:'Duelo direto contra a maior ameaça.',type:'defense',chance:.61,rating:.62,risk:.14},
      {label:'Ficar na sobra',effect:'Protege a segunda bola.',type:'defense',chance:.66,rating:.47,risk:.11}], 'Defina sua função no escanteio'),
    make('def_goal_line','defense','Bola em cima da linha','O goleiro é vencido e a bola sobra quase em cima da linha do gol.',[
      {label:'Carrinho para cortar',effect:'Tudo ou nada para salvar o gol.',type:'defense',chance:.58,rating:.82,risk:.20},
      {label:'Atacar de pé',effect:'Mais controle para o corte.',type:'defense',chance:.66,rating:.61,risk:.11},
      {label:'Fechar o rebote',effect:'Protege a segunda bola.',type:'defense',chance:.72,rating:.45,risk:.08}], 'Salve a jogada antes que ela entre'),
    make('def_overlap','build','Lateral em ultrapassagem','Você recebe espaço para apoiar o ataque enquanto a defesa rival recompõe.',[
      {label:'Acelerar por fora',effect:'Cria profundidade e chance de cruzamento.',type:'assist',chance:.61,rating:.58},
      {label:'Entrar por dentro',effect:'Surpreende a marcação com condução.',type:'control',chance:.64,rating:.54},
      {label:'Parar e circular',effect:'Mantém o time organizado.',type:'control',chance:.80,rating:.28}], 'Escolha como apoiar o ataque'),
    make('def_last_man','defense','Último homem','O atacante ganha campo aberto e você precisa decidir antes que ele entre na área.',[{label:'Carrinho lateral',effect:'Tudo ou nada na bola.',type:'defense',chance:.54,rating:.78,risk:.25},{label:'Fechar o corredor',effect:'Leve o atacante para fora.',type:'defense',chance:.70,rating:.49,risk:.10},{label:'Forçar o passe',effect:'Induza o rival a soltar a bola.',type:'defense',chance:.64,rating:.58,risk:.14}], 'Proteja a entrada da área'),
    make('def_corner_attack','goal','Escanteio ofensivo','Você sobe para o escanteio e a bola vem na marca do pênalti.',[{label:'Atacar de cabeça',effect:'Use impulsão para buscar o gol.',type:'goal',chance:.38,rating:.82},{label:'Desviar na primeira trave',effect:'Mude a direção.',type:'goal',chance:.34,rating:.86},{label:'Escorar para um companheiro',effect:'Crie uma segunda bola perigosa.',type:'assist',chance:.55,rating:.60}], 'Escolha sua ação no escanteio')
  ];
  const midfield=[
    make('mid_counter','build','Contra-ataque','Você conduz pelo meio com três opções se abrindo à frente.',[
      {label:'Passe em profundidade',effect:'Pode deixar um companheiro na cara do gol.',type:'assist',chance:.62,rating:.64},
      {label:'Carregar e finalizar',effect:'Você assume a responsabilidade.',type:'goal',chance:.38,rating:.74},
      {label:'Abrir na ponta',effect:'Amplia o campo e mantém o ataque.',type:'assist',chance:.56,rating:.46}], 'Escolha a rota do contra-ataque'),
    make('mid_press','build','Pressão no meio-campo','Dois rivais fecham seus lados e você recebe de costas.',[
      {label:'Girar e acelerar',effect:'Quebra a pressão se conseguir o drible.',type:'control',chance:.54,rating:.64},
      {label:'Tabela curta',effect:'Usa um companheiro para escapar.',type:'assist',chance:.67,rating:.48},
      {label:'Recuar a jogada',effect:'Mantém a posse e reorganiza.',type:'control',chance:.80,rating:.26}], 'Como escapar da pressão?'),
    make('mid_edge','chance','Sobra na entrada da área','A defesa corta mal e a bola sobra limpa para você na meia-lua.',[
      {label:'Bater colocado',effect:'Busca o canto com precisão.',type:'goal',chance:.45,rating:.72},
      {label:'Chutar forte',effect:'Mais potência, menos controle.',type:'goal',chance:.40,rating:.68},
      {label:'Enfiar para o atacante',effect:'Tenta encontrar o passe final.',type:'assist',chance:.61,rating:.58}], 'Decida em um toque'),
    make('mid_switch','build','Defesa fechada','O rival se compacta por dentro e você tem a bola no corredor central.',[
      {label:'Inverter o lado',effect:'Muda o ponto de ataque.',type:'assist',chance:.67,rating:.46},
      {label:'Passe entrelinhas',effect:'Mais difícil, mas pode quebrar a defesa.',type:'assist',chance:.53,rating:.68},
      {label:'Atrair e carregar',effect:'Tenta abrir espaço com condução.',type:'control',chance:.60,rating:.50}], 'Escolha como desmontar o bloco'),
    make('mid_late','build','Últimos minutos','Seu time protege uma vantagem mínima e você recebe no meio.',[
      {label:'Prender no canto',effect:'Gasta tempo e reduz o risco.',type:'control',chance:.82,rating:.28},
      {label:'Buscar o segundo gol',effect:'Acelera a transição para matar o jogo.',type:'assist',chance:.52,rating:.62},
      {label:'Chutar de longe',effect:'Tenta surpreender o goleiro.',type:'goal',chance:.30,rating:.78}], 'Gerencie os minutos finais'),
    make('mid_halfspace','build','Espaço entre linhas','Você recebe entre o lateral e o zagueiro com três companheiros atacando a área.',[
      {label:'Passe rasteiro na área',effect:'Busca uma assistência rápida.',type:'assist',chance:.62,rating:.61},
      {label:'Girar e finalizar',effect:'Ataque o espaço antes da marcação.',type:'goal',chance:.42,rating:.72},
      {label:'Atrair e devolver',effect:'Mantém a posse e abre novo corredor.',type:'control',chance:.75,rating:.36}], 'Explore o espaço entre linhas'),
    make('mid_second_ball','chance','Segunda bola na meia-lua','Um cruzamento é afastado e a sobra cai exatamente na sua zona.',[
      {label:'Voleio de primeira',effect:'Execução difícil, grande recompensa.',type:'goal',chance:.34,rating:.88},
      {label:'Dominar e bater',effect:'Mais controle, menos surpresa.',type:'goal',chance:.46,rating:.69},
      {label:'Abrir na ponta',effect:'Recicla o ataque com segurança.',type:'assist',chance:.65,rating:.46}], 'Decida o que fazer com a sobra'),
    make('mid_no_look','build','Passe sem olhar','A defesa espera o passe óbvio e um atacante dispara nas costas.',[{label:'Passe de trivela',effect:'Assistência de alto risco.',type:'assist',chance:.49,rating:.82},{label:'Passe simples por dentro',effect:'Execução segura.',type:'assist',chance:.64,rating:.58},{label:'Fingir e conduzir',effect:'Quebre a linha com a bola.',type:'control',chance:.61,rating:.64}], 'Engane a marcação'),
    make('mid_press_trigger','defense','Gatilho de pressão','O zagueiro rival domina mal e sua equipe espera sua decisão.',[{label:'Pressionar de frente',effect:'Force o erro já.',type:'defense',chance:.60,rating:.60,risk:.12},{label:'Fechar a linha de passe',effect:'Prenda o rival.',type:'defense',chance:.72,rating:.44,risk:.07},{label:'Roubar e atacar',effect:'Antecipe para criar chance.',type:'assist',chance:.50,rating:.78,risk:.20}], 'Ative a pressão coletiva')
  ];
  const attackers=[
    make('att_penalty','penalty','Pênalti para sua equipe',`Aos ${minute}', você pega a bola e encara o goleiro.`,[
      {label:'Bater forte no canto',effect:'Boa chance de gol.',type:'goal',chance:.68,rating:.62},
      {label:'Deslocar o goleiro',effect:'Mais técnico e mais arriscado.',type:'goal',chance:.62,rating:.72},
      {label:'Cavadinha',effect:'Alto risco, grande destaque se entrar.',type:'goal',chance:.48,rating:.90}], 'Escolha o tipo de cobrança'),
    make('att_one_on_one','chance','Cara a cara com o goleiro','Você rompe a última linha e entra sozinho na área.',[
      {label:'Finalizar cruzado',effect:'Escolha objetiva para o canto oposto.',type:'goal',chance:.58,rating:.60},
      {label:'Driblar o goleiro',effect:'Mais arriscado, mas abre o gol.',type:'goal',chance:.47,rating:.80},
      {label:'Tocar por cobertura',effect:'Técnica e frieza em uma execução difícil.',type:'goal',chance:.43,rating:.88}], 'Como concluir o 1 contra 1?'),
    make('att_cutback','chance','Passe para trás na área','O ponta chega à linha de fundo e rola a bola para você.',[
      {label:'Finalizar de primeira',effect:'Rápido e direto.',type:'goal',chance:.62,rating:.58},
      {label:'Dominar antes',effect:'Mais controle, mas a defesa se aproxima.',type:'goal',chance:.55,rating:.66},
      {label:'Deixar passar',effect:'Tenta criar uma assistência inesperada.',type:'assist',chance:.60,rating:.64}], 'Escolha o toque dentro da área'),
    make('att_header','goal','Cruzamento perfeito','A bola vem alta entre você e o zagueiro dentro da área.',[
      {label:'Cabecear no chão',effect:'Busca dificultar a defesa do goleiro.',type:'goal',chance:.58,rating:.64},
      {label:'Testar no contrapé',effect:'Exige direção precisa.',type:'goal',chance:.53,rating:.72},
      {label:'Escorar para trás',effect:'Tenta servir um companheiro melhor posicionado.',type:'assist',chance:.62,rating:.56}], 'Escolha a ação no alto'),
    make('att_counter','chance','Contra-ataque em velocidade','Você dispara com um defensor recuando e um companheiro ao lado.',[
      {label:'Cortar para dentro e chutar',effect:'Você busca o gol.',type:'goal',chance:.48,rating:.72},
      {label:'Passar no momento certo',effect:'Cria uma chance limpa para o companheiro.',type:'assist',chance:.65,rating:.60},
      {label:'Acelerar até a área',effect:'Tenta ganhar no corpo e na velocidade.',type:'goal',chance:.52,rating:.66}], 'Decida antes da defesa se recompor'),
    make('att_free_kick','goal','Falta frontal','Uma falta é marcada perto da meia-lua e você assume a bola.',[
      {label:'Por cima da barreira',effect:'Curva e precisão para buscar o ângulo.',type:'goal',chance:.38,rating:.84},
      {label:'Chute forte no canto',effect:'Potência para surpreender o goleiro.',type:'goal',chance:.42,rating:.76},
      {label:'Jogada ensaiada',effect:'Tenta criar uma assistência em vez do chute.',type:'assist',chance:.57,rating:.62}], 'Escolha a cobrança da falta'),
    make('att_backpost','goal','Bola na segunda trave','Um cruzamento atravessa a área e chega quase sem ângulo para você.',[
      {label:'Bater de primeira',effect:'Difícil, mas pode surpreender.',type:'goal',chance:.42,rating:.78},
      {label:'Dominar e ajeitar',effect:'Ganha controle, perde tempo.',type:'goal',chance:.50,rating:.66},
      {label:'Tocar para o meio',effect:'Procura alguém de frente para o gol.',type:'assist',chance:.63,rating:.58}], 'Escolha entre finalizar ou servir'),
    make('att_volley','goal','Voleio no limite da área','A defesa afasta mal e a bola cai no ar, perfeita para uma tentativa plástica.',[
      {label:'Voleio de chapa',effect:'Busca direção e controle.',type:'goal',chance:.40,rating:.82},
      {label:'Bater com força',effect:'Potência acima da precisão.',type:'goal',chance:.36,rating:.88},
      {label:'Dominar e tocar',effect:'Troca a jogada espetacular por segurança.',type:'assist',chance:.61,rating:.48}], 'Escolha entre espetáculo e controle'),
    make('att_nearpost','chance','Corrida na primeira trave','O lateral ganha o fundo e cruza rasteiro na direção da primeira trave.',[
      {label:'Antecipar o zagueiro',effect:'Ataca o espaço antes da marcação.',type:'goal',chance:.58,rating:.69},
      {label:'Deixar passar',effect:'Abre chance para quem vem atrás.',type:'assist',chance:.64,rating:.57},
      {label:'Frear e receber atrás',effect:'Evita o duelo e reorganiza.',type:'control',chance:.77,rating:.31}], 'Ataque a primeira trave'),
    make('att_bicycle','goal','Bola alta nas costas','O cruzamento passa do ponto e cai atrás de você dentro da área.',[{label:'Tentar bicicleta',effect:'Espetáculo e risco máximo.',type:'goal',chance:.28,rating:.98},{label:'Girar e bater',effect:'Controle antes da finalização.',type:'goal',chance:.47,rating:.73},{label:'Escorar de cabeça',effect:'Sirva um companheiro.',type:'assist',chance:.58,rating:.63}], 'Escolha entre plástico e eficiência'),
    make('att_dummy_run','build','Corrida de ruptura','Você atrai dois marcadores e um companheiro infiltra do outro lado.',[{label:'Atacar a área',effect:'Busque o passe de volta.',type:'goal',chance:.45,rating:.70},{label:'Fazer o corta-luz',effect:'Abra espaço sem tocar.',type:'assist',chance:.63,rating:.66},{label:'Receber no pé',effect:'Controle a posse.',type:'control',chance:.78,rating:.34}], 'Mova a defesa')
  ];
  goalkeeper.push(
    make('gk_snow_skid','goalkeeper','Bola escorrega na neve','O gramado está pesado e um chute rasteiro muda de trajetória perto da pequena área.',[
      {label:'Atacar antes do quique',effect:'Tente chegar antes da mudança de direção.',type:'defense',chance:.59,rating:.70,risk:.17},
      {label:'Esperar o desvio',effect:'Confie no reflexo até o último instante.',type:'defense',chance:.65,rating:.56,risk:.11},
      {label:'Espalmar para o lado',effect:'Evite o rebote no centro da área.',type:'defense',chance:.63,rating:.62,risk:.13}], 'O gramado muda a trajetória'),
    make('gk_storm_cross','goalkeeper','Cruzamento com vento forte','Uma rajada altera a curva da bola e ela cai perigosamente na pequena área.',[
      {label:'Sair para segurar',effect:'Domine a bola apesar do vento.',type:'defense',chance:.56,rating:.74,risk:.19},
      {label:'Socá-la para longe',effect:'Priorize afastar o perigo.',type:'defense',chance:.63,rating:.61,risk:.14},
      {label:'Ficar na linha',effect:'Espere o desfecho dentro da área.',type:'defense',chance:.67,rating:.49,risk:.10}], 'O vento muda o tempo da jogada')
  );
  defenders.push(
    make('def_var_tackle','defense','Carrinho no limite','O atacante invade a área e o VAR acompanha cada detalhe da jogada.',[
      {label:'Carrinho limpo',effect:'Grande impacto se acertar a bola.',type:'defense',chance:.55,rating:.82,risk:.25},
      {label:'Acompanhar sem tocar',effect:'Reduza o risco de pênalti.',type:'defense',chance:.70,rating:.47,risk:.08},
      {label:'Fechar o chute',effect:'Proteja o ângulo em vez de tentar o desarme.',type:'defense',chance:.66,rating:.57,risk:.11}], 'VAR em alerta: escolha o tempo do bote'),
    make('def_wet_clearance','defense','Bola presa na poça','A chuva segura a bola dentro da sua área e o atacante chega junto.',[
      {label:'Isolar de primeira',effect:'Afaste sem correr riscos.',type:'defense',chance:.76,rating:.36,risk:.06},
      {label:'Dominar e sair jogando',effect:'Mais técnico, mas perigoso no gramado molhado.',type:'control',chance:.55,rating:.72,risk:.20},
      {label:'Tocar para o goleiro',effect:'Reorganize a posse sob pressão.',type:'control',chance:.67,rating:.50,risk:.11}], 'A chuva muda a decisão')
  );
  midfield.push(
    make('mid_wind_switch','build','Vento cruzado','O vento muda a trajetória de bolas longas e o lado oposto aparece livre.',[
      {label:'Inversão rasteira',effect:'Evite o vento e busque o lateral.',type:'assist',chance:.68,rating:.53},
      {label:'Lançamento alto',effect:'Mais direto, mas o vento interfere.',type:'assist',chance:.48,rating:.76},
      {label:'Conduzir pelo meio',effect:'Mantenha a bola no chão.',type:'control',chance:.72,rating:.42}], 'Adapte o passe ao vento'),
    make('mid_var_restart','chance','Recomeço após o VAR','O jogo volta depois de uma longa checagem e o rival ainda está desconcentrado.',[
      {label:'Cobrança rápida',effect:'Explore a defesa antes da recomposição.',type:'assist',chance:.64,rating:.62},
      {label:'Chute direto',effect:'Tente surpreender imediatamente.',type:'goal',chance:.37,rating:.82},
      {label:'Reorganizar a posse',effect:'Priorize controle e segurança.',type:'control',chance:.82,rating:.27}], 'Ataque antes que o rival se organize')
  );
  attackers.push(
    make('att_snow_finish','chance','Finalização no gramado pesado','A bola desacelera na neve e o goleiro sai para reduzir seu ângulo.',[
      {label:'Chute alto',effect:'Evite que a bola prenda no gramado.',type:'goal',chance:.53,rating:.72},
      {label:'Tocar de lado',effect:'Sirva um companheiro chegando livre.',type:'assist',chance:.63,rating:.60},
      {label:'Driblar o goleiro',effect:'O piso pesado torna a execução arriscada.',type:'goal',chance:.42,rating:.88}], 'Escolha levando o gramado em conta'),
    make('att_away_silence','goal','Chance para silenciar o estádio','Você recebe dentro da área em um estádio hostil, com a torcida adversária atrás do gol.',[
      {label:'Bater no canto curto',effect:'Finalize rápido antes do bloqueio.',type:'goal',chance:.55,rating:.70},
      {label:'Cruzar no segundo pau',effect:'Busque um companheiro livre.',type:'assist',chance:.64,rating:.58},
      {label:'Segurar e cavar a falta',effect:'Tente ganhar uma bola parada perigosa.',type:'control',chance:.69,rating:.46}], 'Uma jogada para mudar o clima do estádio')
  );
  // Chapter 11: new on-pitch stories, with distinct positional decisions.
  goalkeeper.push(make('gk_last_second_throw','build','Contra-ataque no último segundo','Você segura a bola após um escanteio e percebe três companheiros correndo contra dois defensores.',[
    {label:'Lançamento com a mão',effect:'Explora o espaço antes do rival se recompor.',type:'assist',chance:.58,rating:.70},
    {label:'Bola longa de primeira',effect:'Mais alcance, menos precisão.',type:'assist',chance:.45,rating:.85},
    {label:'Prender e administrar',effect:'Protege o placar sem arriscar.',type:'control',chance:.87,rating:.22}], 'A última saída de bola pode decidir tudo'));
  defenders.push(make('def_captain_block','defense','O bloqueio do capitão','O camisa 9 rival prepara uma bicicleta na entrada da pequena área e todos dependem da sua leitura.',[
    {label:'Interceptar de cabeça',effect:'Antecipe antes da finalização.',type:'defense',chance:.57,rating:.80,risk:.20},
    {label:'Fechar o primeiro poste',effect:'Reduza o ângulo da conclusão.',type:'defense',chance:.68,rating:.53,risk:.09},
    {label:'Controlar o rebote',effect:'Evite a segunda finalização.',type:'defense',chance:.71,rating:.46,risk:.08}], 'Seja a última barreira'));
  midfield.push(make('mid_quick_triangle','build','O triângulo impossível','Três marcadores cercam você entre as linhas. Um companheiro infiltra no espaço que acabou de surgir.',[
    {label:'Passe de primeira',effect:'Quebra linhas na velocidade da jogada.',type:'assist',chance:.57,rating:.72},
    {label:'Giro de proteção',effect:'Escapa da marcação e mantém o ataque.',type:'control',chance:.69,rating:.45},
    {label:'Bola por cobertura',effect:'Uma assistência de alto risco.',type:'assist',chance:.43,rating:.91}], 'Encontre a solução em segundos'));
  attackers.push(make('att_bicycle_kick','chance','A chance da bicicleta','O cruzamento passa atrás do seu corpo no último lance. O estádio prende a respiração.',[
    {label:'Tentar a bicicleta',effect:'Golaço improvável; execução muito difícil.',type:'goal',chance:.30,rating:1.05},
    {label:'Dominar e girar',effect:'Mais controle e uma conclusão trabalhada.',type:'goal',chance:.60,rating:.54},
    {label:'Escorar para trás',effect:'Encontre o meia que chega de frente.',type:'assist',chance:.68,rating:.51}], 'Como transformar a última bola?'));
  let pool;
  if(p.position==='Goleiro')pool=goalkeeper;
  else if(['Zagueiro','Lateral direito','Lateral esquerdo'].includes(p.position))pool=defenders;
  else if(['Meia central','Meia direita','Meia esquerda','Volante'].includes(p.position))pool=midfield;
  else pool=attackers;
  const recent=s?.recentDecisionScenarioIds||[];
  let available=pool.filter(x=>!recent.includes(x.id));if(!available.length)available=pool;
  const scenario=available[rnd(0,available.length-1)];
  if(s&&scenario)s.recentDecisionScenarioIds=[...recent,scenario.id].slice(-8);
  const stage=(event.stage||'').toLowerCase();let scenePool;
  if(stage.includes('final'))scenePool=['finale','cup-night','floodlights','hostile','extra-time','neon','tunnel'];
  else if(event.type==='continental'||event.type==='cup'||event.type==='league-cup')scenePool=['cup-night','rain','storm','floodlights','away','hostile','sunset','extra-time','wind','neon','tunnel'];
  else if(event.type==='national')scenePool=['national-night','floodlights','sunset','hostile','rain','finale','neon','wind'];
  else scenePool=['night','rain','sunset','derby','fog','floodlights','storm','snow','heat','away','morning','afternoon','wind','neon'];
  const recentScenes=s?.recentMatchScenes||[];let scenes=scenePool.filter(x=>!recentScenes.includes(x));if(!scenes.length)scenes=scenePool;const scene=scenes[rnd(0,scenes.length-1)];if(s){s.lastMatchScene=scene;s.recentMatchScenes=[...recentScenes,scene].slice(-6);}
  return {...scenario,scene};
}

function renderDecisionChoices(scenario){
  const visual=$('#decision-visual');
  const choiceBox=$('#decision-choices');
  visual.innerHTML='';
  visual.className='decision-visual hidden';
  choiceBox.innerHTML='';
  choiceBox.classList.remove('hidden');
  const buttons=scenario.options.map((o,i)=>`<button class="event-choice decision-option" data-decision-option="${i}"><span class="decision-choice-index">${String(i+1).padStart(2,'0')}</span><span><strong>${o.label}</strong></span><b class="decision-choice-arrow">↗</b></button>`).join('');
  if(['goal','penalty','chance','goalkeeper','defense','build'].includes(scenario.visual)){
    const slotClasses=(scenario.visual==='goal'||scenario.visual==='penalty')?
      ['slot-left','slot-center','slot-right']:
      scenario.visual==='chance'?
      ['chance-left','chance-center','chance-right']:
      scenario.visual==='goalkeeper'?
      ['lane-left','lane-center','lane-right']:
      scenario.visual==='defense'?
      ['lane-left','lane-center','lane-right']:
      ['build-left','build-center','build-right'];
    const typeClass=scenario.visual==='goal'||scenario.visual==='penalty'?'goal-mouth':scenario.visual==='chance'?'chance-board':scenario.visual==='goalkeeper'?'goalkeeper-board':scenario.visual==='defense'?'defense-board':'build-board';
    visual.className=`decision-visual ${typeClass}`;
    const label=scenario.prompt|| (scenario.visual==='penalty'?'Escolha o tipo de cobrança':scenario.visual==='goal'?'Escolha a finalização':scenario.visual==='chance'?'Escolha como atacar o lance':'Escolha sua leitura no lance');
    const inner=scenario.options.map((o,i)=>`<button class="visual-choice ${slotClasses[i]||''}" data-decision-option="${i}"><span>${o.type==='assist'?'🤝':o.type==='defense'?'🛡️':o.type==='control'?'⏱️':'⚽'}</span><strong>${o.label}</strong></button>`).join('');
    const sceneHash=[...(scenario.id||scenario.title||scenario.visual)].reduce((n,ch,i)=>n+ch.charCodeAt(0)*(i+5),29);const variant=sceneHash%12;visual.style.setProperty('--decision-shift',`${(sceneHash%23)-11}px`);visual.style.setProperty('--decision-tilt',`${(sceneHash%15)-7}deg`);visual.style.setProperty('--decision-scale',`${(90+(sceneHash%19))/100}`);
    visual.classList.add(`decision-layout-${variant}`,`decision-scenario-${String(scenario.id||'generic').replace(/[^a-z0-9-]/gi,'-').toLowerCase()}`);
    visual.innerHTML=`<div class="decision-visual-label">${label}</div><div class="btl-tactics-header"><span>◉ CENTRAL TÁTICA</span><span>${scenario.visual==='penalty'?'12 PASSOS, UMA DECISÃO':'SUA JOGADA'}</span></div><div class="btl-pitch-graphic" aria-hidden="true"><i></i><i></i><i></i><span>—</span></div><div class="visual-stage">${inner}</div>`;
    choiceBox.classList.add('hidden');
    visual.querySelectorAll('[data-decision-option]').forEach(b=>b.addEventListener('click',()=>state.pendingPenaltyShootout?resolvePenaltyShootout(+b.dataset.decisionOption):resolveMatchDecision(+b.dataset.decisionOption)));
    return;
  }
  choiceBox.innerHTML=buttons;
  choiceBox.querySelectorAll('.decision-option').forEach(b=>b.addEventListener('click',()=>state.pendingPenaltyShootout?resolvePenaltyShootout(+b.dataset.decisionOption):resolveMatchDecision(+b.dataset.decisionOption)));
}


const NATIONAL_TEAM_THEME_COLORS={
  BR:['#009739','#ffdf00','#012169'],AR:['#63b6e5','#ffffff','#d6b04b'],FR:['#143c8c','#ffffff','#e31b23'],ES:['#c60b1e','#ffc400','#18254a'],ENG:['#f6f7fb','#d71920','#17365d'],PT:['#d71920','#0b7a3b','#f4c542'],DE:['#111111','#f4f4f4','#dd0000'],NL:['#f58220','#ffffff','#21468b'],IT:['#0066b3','#ffffff','#159447'],BE:['#111111','#ffda44','#ed2939'],HR:['#e11f26','#ffffff','#174b8b'],UY:['#69b9e7','#ffffff','#111111'],CO:['#fcd116','#003893','#ce1126'],MA:['#c1272d','#006233','#ffffff'],CH:['#d52b1e','#ffffff','#9b1c17'],DK:['#c60c30','#ffffff','#8a0922'],US:['#1f3c88','#ffffff','#b22234'],MX:['#006847','#ffffff','#ce1126'],JP:['#173f8a','#ffffff','#bc002d'],SN:['#00853f','#fdef42','#e31b23'],AT:['#ed2939','#ffffff','#9a1722'],EC:['#ffdd00','#034ea2','#ed1c24'],KR:['#ffffff','#cd2e3a','#0047a0'],TR:['#e30a17','#ffffff','#8f0610'],RS:['#c6363c','#0c4076','#ffffff'],NO:['#ba0c2f','#ffffff','#00205b'],SE:['#006aa7','#fecc00','#ffffff'],PL:['#ffffff','#dc143c','#811027'],NG:['#008753','#ffffff','#005c38'],DZ:['#ffffff','#006233','#d21034'],EG:['#ce1126','#ffffff','#000000'],CM:['#007a5e','#ce1126','#fcd116'],CI:['#f77f00','#ffffff','#009e60'],CA:['#d80621','#ffffff','#8f0718'],AU:['#006a4e','#ffcd00','#1c3f95'],IR:['#239f40','#ffffff','#da0000'],SA:['#006c35','#ffffff','#d9b949'],QA:['#8a1538','#ffffff','#5b0e27'],TN:['#e70013','#ffffff','#9d000d'],CL:['#d52b1e','#ffffff','#0039a6'],PE:['#d91023','#ffffff','#8a0a17'],PY:['#d52b1e','#ffffff','#0038a8'],CR:['#002b7f','#ffffff','#ce1126'],PA:['#005293','#ffffff','#d21034'],SCO:['#132c59','#ffffff','#6f8dbf'],WAL:['#d30731','#ffffff','#00ab39'],CZ:['#d7141a','#ffffff','#11457e'],UA:['#0057b7','#ffd700','#ffffff'],GH:['#ce1126','#fcd116','#006b3f'],UZ:['#0099b5','#ffffff','#1eb53a'],JO:['#111111','#ffffff','#ce1126'],AE:['#ce1126','#00732f','#ffffff'],CN:['#de2910','#ffde00','#8f1b0b'],MZ:['#009739','#fce100','#d21034'],SO:['#4189dd','#ffffff','#2b5f9d'],ZA:['#007749','#ffb81c','#e03c31'],NZ:['#111111','#ffffff','#cf142b'],CM:['#007a5e','#ce1126','#fcd116'],MA:['#c1272d','#006233','#ffffff'],EG:['#ce1126','#ffffff','#000000'],DZ:['#006233','#ffffff','#d21034'],CI:['#f77f00','#ffffff','#009e60'],GH:['#ce1126','#fcd116','#006b3f'],MZ:['#009739','#fce100','#d21034'],KE:['#111111','#bb0000','#006600'],TZ:['#1eb53a','#00a3dd','#fcd116'],ZW:['#319208','#ffd200','#d40000'],IQ:['#ce1126','#ffffff','#007a3d'],TH:['#a51931','#ffffff','#2d2a4a'],VN:['#da251d','#ffcd00','#9b160f'],ID:['#ce1126','#ffffff','#8f0b12'],JM:['#009b3a','#fed100','#000000'],HN:['#00bce4','#ffffff','#1686a5'],GT:['#4997d0','#ffffff','#2c6e9f'],NZ:['#111111','#ffffff','#cf142b'],FJ:['#68bfe5','#ffffff','#002868']
};
const COMPETITION_DECISION_THEMES=[
  {test:/UEFA Champions League/i,key:'ucl',colors:['#071b44','#f7f9ff','#4f7cff'],label:'UEFA CHAMPIONS LEAGUE'},
  {test:/UEFA Europa League/i,key:'uel',colors:['#f36b21','#111111','#ffffff'],label:'UEFA EUROPA LEAGUE'},
  {test:/UEFA Conference League/i,key:'uecl',colors:['#18d7a2','#172138','#ffffff'],label:'UEFA CONFERENCE LEAGUE'},
  {test:/CONMEBOL Libertadores/i,key:'libertadores',colors:['#111111','#e5bd55','#ffffff'],label:'CONMEBOL LIBERTADORES'},
  {test:/CONMEBOL Sul-Americana/i,key:'sudamericana',colors:['#f58220','#121212','#ffffff'],label:'CONMEBOL SUL-AMERICANA'},
  {test:/CONCACAF Champions Cup/i,key:'concacaf-club',colors:['#4b2b82','#39c6f4','#ffffff'],label:'CONCACAF CHAMPIONS CUP'},
  {test:/AFC Champions League Elite/i,key:'afc-elite',colors:['#183f45','#d9b15d','#ffffff'],label:'AFC CHAMPIONS LEAGUE ELITE'},
  {test:/AFC Champions League Two/i,key:'afc-two',colors:['#6a1538','#e0bd70','#ffffff'],label:'AFC CHAMPIONS LEAGUE TWO'},
  {test:/CAF Champions League/i,key:'caf-club',colors:['#087b4c','#e5b741','#ffffff'],label:'CAF CHAMPIONS LEAGUE'},
  {test:/OFC Champions League/i,key:'ofc-club',colors:['#145fa8','#42c9e8','#ffffff'],label:'OFC CHAMPIONS LEAGUE'},
  {test:/^Premier League$/i,key:'premier',colors:['#3d195b','#00ff85','#ffffff'],label:'PREMIER LEAGUE'},
  {test:/EFL Championship|EFL League One/i,key:'efl',colors:['#0c3f82','#e31837','#ffffff'],label:'EFL'},
  {test:/^(LaLiga|LALIGA HYPERMOTION)$/i,key:'laliga',colors:['#e1261c','#111111','#ffffff'],label:'LALIGA'},
  {test:/^(2\. Bundesliga|Bundesliga)$/i,key:'bundesliga',colors:['#d20515','#ffffff','#111111'],label:'BUNDESLIGA'},
  {test:/^(Serie B|Serie A)$/i,key:'seriea',colors:['#004b9b','#ffffff','#d71920'],label:'SERIE A'},
  {test:/^(Ligue 2|Ligue 1)$/i,key:'ligue1',colors:['#091c3e','#cdfb0a','#ffffff'],label:'LIGUE 1'},
  {test:/^(Primeira Liga|Liga Portugal 2)$/i,key:'portugal',colors:['#0b7a3b','#d71920','#ffffff'],label:'LIGA PORTUGAL'},
  {test:/Eredivisie/i,key:'eredivisie',colors:['#f47b20','#ffffff','#d71920'],label:'EREDIVISIE'},
  {test:/Belgian Pro League/i,key:'belgium',colors:['#111111','#fdda24','#ef3340'],label:'PRO LEAGUE'},
  {test:/Süper Lig/i,key:'turkey',colors:['#e30a17','#ffffff','#111111'],label:'SÜPER LIG'},
  {test:/Scottish Premiership/i,key:'scotland',colors:['#1d3f8c','#ffffff','#7aa2e3'],label:'SCOTTISH PREMIERSHIP'},
  {test:/Brasileir[aã]o|Série B/i,key:'brasil',colors:['#009739','#ffdf00','#012169'],label:'CAMPEONATO BRASILEIRO'},
  {test:/Liga Profesional Argentina/i,key:'argentina',colors:['#69b9e7','#ffffff','#d8b24c'],label:'LIGA PROFESIONAL'},
  {test:/Primera División Uruguaia/i,key:'uruguay',colors:['#69b9e7','#ffffff','#111111'],label:'PRIMERA URUGUAIA'},
  {test:/Categoría Primera A/i,key:'colombia',colors:['#fcd116','#003893','#ce1126'],label:'PRIMERA A'},
  {test:/Primera División do Chile/i,key:'chile',colors:['#d52b1e','#ffffff','#0039a6'],label:'PRIMERA CHILE'},
  {test:/Liga MX/i,key:'ligamx',colors:['#006847','#ffffff','#ce1126'],label:'LIGA MX'},
  {test:/Major League Soccer/i,key:'mls',colors:['#172b4d','#e21937','#ffffff'],label:'MAJOR LEAGUE SOCCER'},
  {test:/J1 League/i,key:'j1',colors:['#d71920','#111111','#ffffff'],label:'J1 LEAGUE'},
  {test:/K League 1/i,key:'kleague',colors:['#1b3f8b','#d71920','#ffffff'],label:'K LEAGUE 1'},
  {test:/Qatar Stars League/i,key:'qatar-league',colors:['#8a1538','#ffffff','#d8b557'],label:'QATAR STARS LEAGUE'},
  {test:/UAE Pro League/i,key:'uae-league',colors:['#ce1126','#00732f','#ffffff'],label:'UAE PRO LEAGUE'},
  {test:/Saudi Pro League/i,key:'saudi',colors:['#006c35','#ffffff','#d9b949'],label:'SAUDI PRO LEAGUE'},
  {test:/Austrian Bundesliga/i,key:'austria',colors:['#ed2939','#ffffff','#8d1520'],label:'AUSTRIAN BUNDESLIGA'},
  {test:/Swiss Super League/i,key:'swiss',colors:['#d52b1e','#ffffff','#8d1612'],label:'SWISS SUPER LEAGUE'},
  {test:/Danish Superliga/i,key:'denmark',colors:['#c60c30','#ffffff','#800a20'],label:'DANISH SUPERLIGA'},
  {test:/Greek Super League/i,key:'greece',colors:['#0d5eaf','#ffffff','#183f73'],label:'GREEK SUPER LEAGUE'},
  {test:/Czech First League/i,key:'czech',colors:['#11457e','#ffffff','#d7141a'],label:'CZECH FIRST LEAGUE'},
  {test:/Ekstraklasa/i,key:'poland',colors:['#ffffff','#dc143c','#761027'],label:'EKSTRAKLASA'},
  {test:/HNL/i,key:'croatia',colors:['#e11f26','#ffffff','#174b8b'],label:'HNL'},
  {test:/Serbian SuperLiga/i,key:'serbia',colors:['#c6363c','#0c4076','#ffffff'],label:'SERBIAN SUPERLIGA'},
  {test:/Eliteserien/i,key:'norway',colors:['#ba0c2f','#ffffff','#00205b'],label:'ELITESERIEN'},
  {test:/Allsvenskan/i,key:'sweden',colors:['#006aa7','#fecc00','#ffffff'],label:'ALLSVENSKAN'},
  {test:/Romanian SuperLiga/i,key:'romania',colors:['#002b7f','#fcd116','#ce1126'],label:'ROMANIAN SUPERLIGA'},
  {test:/Ukrainian Premier League/i,key:'ukraine',colors:['#0057b7','#ffd700','#ffffff'],label:'UKRAINIAN PREMIER LEAGUE'},
  {test:/Copa do Brasil/i,key:'copa-brasil',colors:['#009739','#ffdf00','#012169'],label:'COPA DO BRASIL'},
  {test:/FA Cup/i,key:'fa-cup',colors:['#e31b23','#ffffff','#1d2f5f'],label:'FA CUP'},
  {test:/Copa do Rei|Copa del Rey/i,key:'copa-rei',colors:['#c60b1e','#ffc400','#ffffff'],label:'COPA DO REI'},
  {test:/DFB-Pokal/i,key:'dfb',colors:['#0f7d42','#ffffff','#111111'],label:'DFB-POKAL'},
  {test:/Coppa Italia/i,key:'coppa',colors:['#0066b3','#ffffff','#ce2b37'],label:'COPPA ITALIA'},
  {test:/Coupe de France/i,key:'coupe-france',colors:['#153d8a','#ffffff','#ed2939'],label:'COUPE DE FRANCE'},
  {test:/Taça de Portugal/i,key:'taca-portugal',colors:['#d71920','#0b7a3b','#ffffff'],label:'TAÇA DE PORTUGAL'},
  {test:/KNVB Beker/i,key:'knvb',colors:['#f58220','#ffffff','#21468b'],label:'KNVB BEKER'},
  {test:/Copa da Bélgica/i,key:'belgian-cup',colors:['#111111','#fdda24','#ef3340'],label:'COPA DA BÉLGICA'},
  {test:/Copa da Turquia|Turkish Cup/i,key:'turkish-cup',colors:['#e30a17','#ffffff','#111111'],label:'COPA DA TURQUIA'},
  {test:/Scottish Cup/i,key:'scottish-cup',colors:['#1d3f8c','#ffffff','#7aa2e3'],label:'SCOTTISH CUP'},
  {test:/Copa Argentina/i,key:'copa-argentina',colors:['#69b9e7','#ffffff','#d8b24c'],label:'COPA ARGENTINA'},
  {test:/Copa AUF Uruguay/i,key:'copa-uy',colors:['#69b9e7','#ffffff','#111111'],label:'COPA AUF URUGUAY'},
  {test:/Copa Colombia/i,key:'copa-colombia',colors:['#fcd116','#003893','#ce1126'],label:'COPA COLOMBIA'},
  {test:/Copa Chile/i,key:'copa-chile',colors:['#d52b1e','#ffffff','#0039a6'],label:'COPA CHILE'},
  {test:/Copa MX/i,key:'copa-mx',colors:['#006847','#ffffff','#ce1126'],label:'COPA MX'},
  {test:/U\.S\. Open Cup/i,key:'us-open',colors:['#1f3c88','#ffffff','#b22234'],label:'U.S. OPEN CUP'},
  {test:/Copa do Imperador|Emperor/i,key:'emperor',colors:['#173f8a','#ffffff','#bc002d'],label:'COPA DO IMPERADOR'},
  {test:/King Cup/i,key:'king-cup',colors:['#006c35','#ffffff','#d9b949'],label:'KING CUP'},
  {test:/Emir of Qatar Cup/i,key:'qatar-cup',colors:['#8a1538','#ffffff','#d8b557'],label:'EMIR OF QATAR CUP'},
  {test:/UAE President Cup/i,key:'uae-cup',colors:['#ce1126','#00732f','#ffffff'],label:'UAE PRESIDENT CUP'},
  {test:/ÖFB-Cup/i,key:'ofb',colors:['#ed2939','#ffffff','#8d1520'],label:'ÖFB-CUP'},
  {test:/Swiss Cup/i,key:'swiss-cup',colors:['#d52b1e','#ffffff','#8d1612'],label:'SWISS CUP'},
  {test:/Danish Cup/i,key:'danish-cup',colors:['#c60c30','#ffffff','#800a20'],label:'DANISH CUP'},
  {test:/Greek Cup/i,key:'greek-cup',colors:['#0d5eaf','#ffffff','#183f73'],label:'GREEK CUP'},
  {test:/Czech Cup/i,key:'czech-cup',colors:['#11457e','#ffffff','#d7141a'],label:'CZECH CUP'},
  {test:/Polish Cup/i,key:'polish-cup',colors:['#ffffff','#dc143c','#761027'],label:'POLISH CUP'},
  {test:/Croatian Cup/i,key:'croatian-cup',colors:['#e11f26','#ffffff','#174b8b'],label:'CROATIAN CUP'},
  {test:/Serbian Cup/i,key:'serbian-cup',colors:['#c6363c','#0c4076','#ffffff'],label:'SERBIAN CUP'},
  {test:/Norwegian Cup/i,key:'norwegian-cup',colors:['#ba0c2f','#ffffff','#00205b'],label:'NORWEGIAN CUP'},
  {test:/Swedish Cup/i,key:'swedish-cup',colors:['#006aa7','#fecc00','#ffffff'],label:'SWEDISH CUP'},
  {test:/Romanian Cup/i,key:'romanian-cup',colors:['#002b7f','#fcd116','#ce1126'],label:'ROMANIAN CUP'},
  {test:/Ukrainian Cup/i,key:'ukrainian-cup',colors:['#0057b7','#ffd700','#ffffff'],label:'UKRAINIAN CUP'},
  {test:/CONMEBOL Copa América/i,key:'copa-america',colors:['#102a56','#d8b557','#ffffff'],label:'CONMEBOL COPA AMÉRICA'},
  {test:/UEFA EURO/i,key:'euro',colors:['#173b8f','#4fd2ff','#ffffff'],label:'UEFA EURO'},
  {test:/UEFA Nations League/i,key:'nations-league',colors:['#19164f','#e44291','#35cfee'],label:'UEFA NATIONS LEAGUE'},
  {test:/Concacaf Gold Cup/i,key:'gold-cup',colors:['#17255a','#f5c342','#ffffff'],label:'CONCACAF GOLD CUP'},
  {test:/AFC Asian Cup/i,key:'asian-cup',colors:['#8d1b3d','#d8b557','#ffffff'],label:'AFC ASIAN CUP'},
  {test:/CAF Africa Cup of Nations/i,key:'afcon',colors:['#087b4c','#e5b741','#d6232a'],label:'AFRICA CUP OF NATIONS'},
  {test:/OFC Nations Cup/i,key:'ofc-cup',colors:['#145fa8','#42c9e8','#ffffff'],label:'OFC NATIONS CUP'},
  {test:/Eliminatórias CONMEBOL/i,key:'qual-conmebol',colors:['#102a56','#6bc2e8','#d8b557'],label:'ELIMINATÓRIAS CONMEBOL'},
  {test:/Eliminatórias.*UEFA|UEFA.*Eliminatórias/i,key:'qual-uefa',colors:['#173b8f','#4fd2ff','#ffffff'],label:'ELIMINATÓRIAS UEFA'},
  {test:/Eliminatórias Concacaf/i,key:'qual-concacaf',colors:['#4b2b82','#39c6f4','#f5c342'],label:'ELIMINATÓRIAS CONCACAF'},
  {test:/Eliminatórias AFC/i,key:'qual-afc',colors:['#8d1b3d','#d8b557','#ffffff'],label:'ELIMINATÓRIAS AFC'},
  {test:/Eliminatórias CAF/i,key:'qual-caf',colors:['#087b4c','#e5b741','#d6232a'],label:'ELIMINATÓRIAS CAF'},
  {test:/Eliminatórias OFC|Eliminatórias da OFC/i,key:'qual-ofc',colors:['#145fa8','#42c9e8','#ffffff'],label:'ELIMINATÓRIAS OFC'}
];
function nationalDecisionPalette(code=state.player?.nationalityCode){
  const colors=NATIONAL_TEAM_THEME_COLORS[code];if(colors)return colors;
  const conf=confederation(code);
  return ({UEFA:['#173b8f','#ffffff','#4fd2ff'],CONMEBOL:['#102a56','#ffffff','#d8b557'],CONCACAF:['#4b2b82','#ffffff','#39c6f4'],AFC:['#8d1b3d','#ffffff','#d8b557'],CAF:['#087b4c','#ffffff','#e5b741'],OFC:['#145fa8','#ffffff','#42c9e8']})[conf]||['#182536','#ffffff','#42e88d'];
}
function competitionDecisionTheme(event={}){
  const competition=String(event.competition||'');
  if(event.specialCompetition==='supercup'||event.type==='supercup'||/UEFA Super Cup|Finalissima|Supercopa do Brasil|Supercopa da Espanha|Supercoppa Italiana|Community Shield|DFL-Supercup|Trophée des Champions|Supertaça|Cruyff Shield/i.test(competition)){
    const national=event.type==='national';return {key:`supercup-${normalizeKey(competition||'final')}`,colors:national?nationalDecisionPalette(state.player?.nationalityCode):['#3a2d0b','#f4d56b','#ffffff'],label:competition.toUpperCase()||'SUPERCOPA',flagCode:national?state.player?.nationalityCode:null};
  }
  if(event.worldCup||/FIFA World Cup|Copa do Mundo/i.test(competition)){
    return {key:'world-cup-national',colors:nationalDecisionPalette(state.player?.nationalityCode),label:`COPA DO MUNDO · ${state.player?.nationality||'SELEÇÃO'}`,flagCode:state.player?.nationalityCode};
  }
  if(/Amistoso Internacional/i.test(competition))return {key:'friendly-national',colors:nationalDecisionPalette(state.player?.nationalityCode),label:`AMISTOSO · ${state.player?.nationality||'SELEÇÃO'}`,flagCode:state.player?.nationalityCode};
  const found=COMPETITION_DECISION_THEMES.find(x=>x.test.test(competition));
  if(found)return found;
  if(event.type==='national')return {key:'national',colors:nationalDecisionPalette(state.player?.nationalityCode),label:competition||'SELEÇÃO',flagCode:state.player?.nationalityCode};
  if(event.type==='continental')return {key:'continental-generic',colors:['#162b54','#ffffff','#5da8ff'],label:competition||'COMPETIÇÃO CONTINENTAL'};
  if(event.type==='league-cup'||event.type==='cup')return {key:'cup-generic',colors:['#513f17','#f2c94c','#ffffff'],label:competition||'COPA NACIONAL'};
  return {key:'league-generic',colors:['#163b31','#42e88d','#ffffff'],label:competition||'LIGA'};
}
function hexRgbTriplet(hex='#ffffff'){
  const clean=String(hex).replace('#','').trim();const full=clean.length===3?clean.split('').map(x=>x+x).join(''):clean.padEnd(6,'0').slice(0,6);
  return `${parseInt(full.slice(0,2),16)||0}, ${parseInt(full.slice(2,4),16)||0}, ${parseInt(full.slice(4,6),16)||0}`;
}
function applyDecisionCompetitionTheme(card,event={}){
  if(!card)return;const theme=competitionDecisionTheme(event),experience=competitionThemeForName(event.competition||'',event.countryCode||state.player?.clubCountry||'');
  // Match dialogues use the exact same competition palette as the full app.
  const colors=[experience.source?.primary||experience.primary||experience.panel||'#182536',experience.source?.secondary||experience.secondary||'#ffffff',experience.source?.tertiary||experience.tertiary||experience.accent||'#42e88d'];
  card.classList.add('competition-themed');card.dataset.competitionTheme=theme.key||'generic';
  card.style.setProperty('--comp-primary',colors[0]);card.style.setProperty('--comp-secondary',colors[1]||'#ffffff');card.style.setProperty('--comp-accent',colors[2]||colors[1]||'#ffffff');
  card.style.setProperty('--comp-primary-rgb',hexRgbTriplet(colors[0]));card.style.setProperty('--comp-secondary-rgb',hexRgbTriplet(colors[1]||'#ffffff'));card.style.setProperty('--comp-accent-rgb',hexRgbTriplet(colors[2]||colors[1]||'#ffffff'));
  let badge=card.querySelector('.decision-competition-theme-badge');if(!badge){badge=document.createElement('div');badge.className='decision-competition-theme-badge';card.prepend(badge);}
  const flag=theme.flagCode?nationalFlagImage(theme.flagCode,state.player?.nationality||'Seleção'):'';
  badge.innerHTML=`${flag||'<span class="competition-theme-mark">◆</span>'}<b>${esc(theme.label||event.competition||'COMPETIÇÃO')}</b><i></i><i></i><i></i>`;
}
function ensureDecisionPlan(){
  const s=state.season;if(s.decisionTargets?.length)return;const base=s.league.schedule.length;s.decisionTargets=[.14,.31,.49,.67,.85].map(x=>Math.max(2,Math.round(base*x)));s.decisionIndex=s.decisionIndex||0;s.decisionLogs=s.decisionLogs||[];s.startTrophyCount=state.player.trophies?.length||0;s.startAwardCount=state.player.awards?.length||0;
}

function playMatchVisualFX(kind='build',outcome='intro',scenarioId=''){
  const card=$('#match-decision-modal .decision-card');if(!card)return;
  card.classList.remove('match-fx-goal','match-fx-penalty','match-fx-chance','match-fx-goalkeeper','match-fx-defense','match-fx-build','match-fx-success','match-fx-miss');
  const hash=[...(scenarioId||kind)].reduce((n,ch)=>n+ch.charCodeAt(0),0)%6;
  void card.offsetWidth;card.classList.add(`match-fx-${kind}`);if(outcome==='success')card.classList.add('match-fx-success');else if(outcome==='miss')card.classList.add('match-fx-miss');
  card.querySelector('.match-cinematic')?.remove();const fx=document.createElement('div');fx.className=`match-cinematic cinematic-${kind} cinematic-${outcome} variant-${hash}`;
  fx.innerHTML='<i></i><i></i><i></i><i></i><span class="speed-line l1"></span><span class="speed-line l2"></span><span class="speed-line l3"></span><span class="crowd-flash"></span><span class="camera-pan"></span><span class="score-pulse"></span><span class="match-ball"></span><span class="match-flash"></span>';card.appendChild(fx);setTimeout(()=>fx.remove(),1650);
}
function showDecisionSuspense(log,option){
  const card=$('#match-decision-modal .decision-card');
  const visual=$('#decision-visual'),choices=$('#decision-choices'),result=$('#decision-result'),cont=$('#decision-continue');
  visual.classList.add('hidden');choices.classList.add('hidden');cont.classList.add('hidden');
  result.classList.remove('hidden');
  card?.classList.add('btl-suspense-active');
  result.innerHTML=`<div class="btl-match-suspense" role="status" aria-live="polite" aria-label="Jogada em andamento">
    <div class="btl-suspense-lights" aria-hidden="true"><i></i><i></i><i></i></div>
    <div class="btl-suspense-top"><span>MINUTO DECISIVO</span><span class="btl-suspense-time">● AO VIVO</span></div>
    <div class="btl-suspense-pitch" aria-hidden="true">
      <div class="btl-suspense-pitch-line"></div><div class="btl-suspense-goalframe"></div>
      <span class="btl-suspense-moving-ball">⚽</span><div class="btl-suspense-goal-flash"></div>
    </div>
    <strong class="btl-suspense-headline">TUDO PODE ACONTECER...</strong>
    <strong class="btl-suspense-verdict" aria-live="polite"></strong>
    <div class="btl-suspense-pulse" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
  </div>`;
  const verdict=log?.success?(option?.type==='goal'?'⚽ GOOOOOL!':option?.type==='assist'?'🅰️ ASSISTÊNCIA!':option?.type==='defense'?'QUE DEFESA!':'JOGADA PERFEITA!')
    :(option?.type==='goal'?'QUASE!':option?.type==='assist'?'CHANCE PERDIDA!':'NÃO DEU CERTO!');
  card?.classList.toggle('btl-suspense-goal',log?.success&&option?.type==='goal');
  setTimeout(()=>{const label=result.querySelector('.btl-suspense-verdict');if(label){label.textContent=verdict;label.classList.add('revealed');}result.querySelector('.btl-match-suspense')?.classList.add('btl-verdict-visible');},1080);
}

function animateSeasonDashboard(){
  const s=state.season,seasonCard=$('.season-card'),competitionCard=$('.competitions-card'),nationalCard=$('.national-card');
  seasonCard?.classList.toggle('season-live',!!s&&!s.closed);competitionCard?.classList.toggle('season-live',!!s&&!s.closed);nationalCard?.classList.toggle('world-cup-year',!!s&&isWorldCupYear(s.year));
  if(s&&!s.closed){$$('#competitions-list .competition-item').forEach((el,i)=>el.style.setProperty('--stagger',`${i*.12}s`));}
}
function openMatchDecision(event){
  applyCompetitionExperienceTheme(event);
  const scenario=buildDecisionScenario(event);state.pendingMatchDecision={event,scenario,isNationalDecision:event.type==='national'};if(event.type==='national')state.season.nationalDecisionCount=(state.season.nationalDecisionCount||0)+1;save();
  const revealDecision=()=>{if(state.pendingMatchDecision?.event!==event)return;
  const card=$('#match-decision-modal .decision-card');card.classList.remove('btl-suspense-goal','scene-night','scene-rain','scene-sunset','scene-derby','scene-fog','scene-floodlights','scene-finale','scene-storm','scene-snow','scene-heat','scene-away','scene-hostile','scene-cup-night','scene-extra-time','scene-morning','scene-national-night','scene-afternoon','scene-wind','scene-neon','scene-tunnel');card.classList.add(`scene-${scenario.scene||'night'}`);applyDecisionCompetitionTheme(card,event);
  $('#decision-competition').innerHTML=competitionHeaderMarkup(event.competition,event.stage||'');$('#decision-title').textContent=`${scenario.minute}' · ${scenario.title}`;$('#decision-match').innerHTML=decisionFixtureMarkup(event);hydrateNextMatchBadges();$('#decision-description').textContent='';
  $('#decision-result').classList.add('hidden');$('#decision-continue').classList.add('hidden');renderDecisionChoices(scenario);$('#match-decision-modal').classList.remove('hidden');playMatchVisualFX(scenario.visual||'build','intro',scenario.id||'');
  };
  checkMatchCrestsBeforeDecision(event,revealDecision);
}
function simulateInteractiveMatch(event,option){
  const p=state.player,s=state.season,playerIsHome=event.type==='national'?event.home===p.nationality:event.home===p.club;const score=simulateScore(event);let teamGoals=playerIsHome?score.homeGoals:score.awayGoals,oppGoals=playerIsHome?score.awayGoals:score.homeGoals;
  const appearanceRole=event.type==='national'?'start':clubAppearanceRole(event,p);
  let perf=simulatePlayerPerformance(teamGoals,oppGoals,{appearanceRole});const roleChancePenalty=appearanceRole==='sub'?.05:0;const success=Math.random()<clamp(option.chance-roleChancePenalty,.12,.94);let outcome='A decisão não funciona como você esperava.';
  if(success&&option.type==='goal'){teamGoals++;perf.goals++;perf.rating+=option.rating||.5;outcome='Você executa a escolha perfeitamente e marca!';}
  else if(success&&option.type==='assist'){teamGoals++;perf.assists++;perf.rating+=option.rating||.45;outcome='Sua decisão cria o gol e você registra a assistência!';}
  else if(success&&option.type==='defense'){if(oppGoals>0)oppGoals--;perf.rating+=option.rating||.45;outcome='Leitura perfeita: você neutraliza uma chance clara do adversário.';}
  else if(success&&option.type==='control'){perf.rating+=option.rating||.2;outcome='Você mantém a posse e ajuda sua equipe a controlar o momento.';}
  else {perf.rating-=.28;if(option.type==='defense'&&Math.random()<(option.risk||.12)){oppGoals++;outcome='A tentativa falha e o adversário aproveita para marcar.';}}
  perf.goals=Math.min(perf.goals,teamGoals);perf.assists=Math.min(perf.assists,Math.max(0,teamGoals-perf.goals));perf=applySeasonGaCap(perf);perf.rating=clamp(perf.rating,5,10);
  const homeGoals=playerIsHome?teamGoals:oppGoals,awayGoals=playerIsHome?oppGoals:teamGoals;s.totalGames++;s.goals+=perf.goals;s.assists+=perf.assists;s.ratingSum+=perf.rating;recordCompetitionStat(event,perf);recordHistoricalDefensiveStats(perf,oppGoals);
  if(event.type!=='national'){s.clubGames++;s.clubGoals+=perf.goals;s.clubAssists+=perf.assists;if(event.type==='league'){s.leagueGames=(s.leagueGames||0)+1;s.leagueGoals=(s.leagueGoals||0)+perf.goals;s.leagueAssists=(s.leagueAssists||0)+perf.assists;}p.value=rebalanceMarketValue(p,.025,perf.rating);}else{p.nationalTeamGames++;p.nationalTeamGoals+=perf.goals;p.nationalTeamAssists=(p.nationalTeamAssists||0)+perf.assists;p.nationalTrust=clamp((p.nationalTrust||0)+(perf.rating>=8?3:perf.rating>=7.2?2:perf.rating<6.2?-1:1),0,100);}
  checkSeasonGaCap();const competitionResolution=processCompetitionResult(event,teamGoals,oppGoals,perf);const injury=maybeSustainMatchInjury(event,perf);if(event.type!=='national'){updateClubRoleFromPerformance(appearanceRole,perf);maybeUpdateSelectionMidSeason(event);}if(perf.rating>=8)state.news.push(`${p.name} foi destaque em ${event.competition}, com nota ${perf.rating.toFixed(1)}.`);
  if(event.worldCup&&competitionResolution&&competitionResolution.stage!=='group'){
    if(competitionResolution.advanced&&teamGoals>oppGoals&&!success)outcome+=' Mesmo assim, sua seleção vence a partida e avança.';
    else if(!competitionResolution.advanced&&teamGoals<oppGoals&&success)outcome+=' Sua boa ação individual não evita a derrota da seleção.';
  }
  return {event,playerIsHome,teamGoals,oppGoals,homeGoals,awayGoals,perf,model:score.model,outcome,success,competitionResolution,injury,playerRole:appearanceRole};
}
function resolveMatchDecision(index){
  const pending=state.pendingMatchDecision;if(!pending)return;const option=pending.scenario.options[index];const log=simulateInteractiveMatch(pending.event,option);const s=state.season;s.decisionLogs=s.decisionLogs||[];s.decisionLogs.push({competition:log.event.competition,match:`${log.event.home} ${log.homeGoals} x ${log.awayGoals} ${log.event.away}`,home:log.event.home,away:log.event.away,homeGoals:log.homeGoals,awayGoals:log.awayGoals,scope:log.event.type==='national'?'national':'club',choice:option.label,outcome:log.outcome,rating:log.perf.rating.toFixed(1)});if(!pending.isNationalDecision){s.decisionIndex=(s.decisionIndex||0)+1;adjustClubRoleTrust(log.success?6:-1,log.success?'correct':'wrong');}else state.player.nationalTrust=clamp((state.player.nationalTrust||0)+(log.success?3:-1),0,100);state.pendingMatchDecision=null;save();render();showDecisionSuspense(log,option);
  let cupProgress='';
  if(log.event.worldCup&&log.competitionResolution){
    const wc=s?.worldCup,res=log.competitionResolution;
    let label='';
    if(res.pendingPenalties)label='◌ Empate no mata-mata · a vaga será decidida nos pênaltis';
    else if(wc?.finished){
      if(wc.champion)label='🏆 CAMPEÃO DA COPA DO MUNDO';
      else if(wc.runnerUp)label='🥈 Vice-campeão da Copa do Mundo';
      else if(wc.thirdPlace)label='🥉 3º lugar na Copa do Mundo';
      else if(wc.fourthPlace)label='4º lugar na Copa do Mundo';
      else label='✕ Seleção eliminada da Copa do Mundo';
    }else if(res.stage==='group'&&res.qualified===true)label='✓ Seleção classificada à Fase de 32';
    else if(res.stage==='group'&&res.qualified===false)label='✕ Seleção eliminada na fase de grupos';
    else if(res.stage!=='group'&&typeof res.advanced==='boolean')label=`${res.advanced?'✓ Seleção classificada':'✕ Seleção eliminada'}${res.nextStage?` · próxima fase: ${esc(res.nextStage)}`:''}`;
    if(label)cupProgress=`<span class="decision-team-result ${res.pendingPenalties?'pending-penalties':''}">${label}</span>`;
  }
  setTimeout(()=>{$('#match-decision-modal .decision-card')?.classList.remove('btl-suspense-active');playMatchVisualFX(pending.scenario.visual||'build',log.success?'success':'miss',pending.scenario.id||'');$('#decision-visual').classList.add('hidden');$('#decision-choices').classList.add('hidden');$('#decision-result').classList.remove('hidden');$('#decision-result').innerHTML=`${decisionScoreboardMarkup(log)}<div class="decision-result-copy"><strong>${esc(log.outcome)}</strong>${cupProgress}<div class="decision-performance-strip"><span><b>${log.perf.rating.toFixed(1)}</b> nota</span><span><b>${log.perf.goals}</b><em role="img" aria-label="Gols">⚽</em></span><span><b>${log.perf.assists}</b><em role="img" aria-label="Assistências">🅰️</em></span></div>${log.injury?`<span class="decision-injury-result">✚ ${esc(log.injury.label)} · previsão de ${log.injury.games} jogo(s) fora</span>`:''}${state.pendingPenaltyShootout&&!log.competitionResolution?.pendingPenalties?'<span class="decision-team-result pending-penalties">A partida segue para os pênaltis.</span>':''}</div>`;setTimeout(hydrateNextMatchBadges,0);$('#decision-continue').classList.remove('hidden');},1800);
}
function checkIdolMilestones(avg){
  const p=state.player,s=state.season; if(!p||!s) return;
  s.idolCelebrations=s.idolCelebrations||[];
  const clubGames=(state.history||[]).filter(h=>h.club===p.club).reduce((n,h)=>n+(h.games||0),s.clubGames||0);
  const clubTitles=(p.trophies||[]).filter(t=>{const hist=(state.history||[]).find(h=>h.year===t.year);const trophyClub=t.club||hist?.club||(t.year===s.year?p.club:null);return trophyClub===p.club;}).length;
  p.clubIdols=Array.isArray(p.clubIdols)?p.clubIdols:[];
  if(!p.clubIdols.includes(p.club) && ((clubGames>=120&&clubTitles>=3) || clubTitles>=5)){
    p.clubIdols.push(p.club);p.clubIcon=true;const item={icon:'★',title:`Ídolo do ${p.club}`,subtitle:`${p.name} passa a ser tratado como um grande nome da história do clube.`};
    s.idolCelebrations.push(item);state.news.push(`${p.name} entra para a galeria de ídolos do ${p.club}.`);
  }
  if(p.calledUp && !p.nationalIcon && (((p.nationalTeamGames||0)>=35 && (p.nationalTrust||0)>=82) || (p.trophies||[]).some(t=>t.name==='FIFA World Cup'))){
    p.nationalIcon=true; const item={icon:countryFlag(p.nationalityCode),title:'Ídolo da seleção',subtitle:`${p.name} ganha status especial junto aos torcedores de ${p.nationality}.`};
    s.idolCelebrations.push(item);state.news.push(`${p.name} se torna um símbolo recente da seleção de ${p.nationality}.`);
  }
}

function processSeasonEnd(){
  const p=state.player,s=state.season;if(!s||s.endProcessed)return;commitSeasonQualifications(s);const avg=s.totalGames?s.ratingSum/s.totalGames:6.5;evaluateAwards(avg);updateSelectionAtSeasonEnd(avg);checkIdolMilestones(avg);const delta=developmentResult(avg);
  const cupStatus=cupFinalStatus(s.cup),continentalStatus=s.continental?continentalFinalStatus(s.continental):'Não disputou';state.history.push({year:s.year,club:s.clubAtStart||p.club,clubCountry:s.countryAtStart||p.clubCountry,overall:p.overall,games:s.clubGames,goals:s.clubGoals,assists:s.clubAssists,leagueGames:s.leagueGames||0,leagueGoals:s.leagueGoals||0,leagueAssists:s.leagueAssists||0,saves:s.saves||0,tackles:s.tackles||0,cleanSheets:s.cleanSheets||0,matchRating:avg.toFixed(1),rating:historicalSeasonGrade({rating:avg,games:s.clubGames,goals:s.clubGoals,assists:s.clubAssists,tackles:s.tackles,cleanSheets:s.cleanSheets},p.position).toFixed(1),leaguePosition:s.league.position,cupStatus,continentalStatus,competitions:competitionStatus().map(c=>c.title)});
  p.age++;p.value=rebalanceMarketValue(p,.58,avg);state.news.push(`${p.name} encerra ${s.year} com média ${avg.toFixed(1)}. GER ${p.overall} (${delta>=0?'+':''}${delta}) e POT ${p.potential}.`);generateOffers(avg);s.endProcessed=true;s.closed=true;s.endAverage=avg;s.developmentDelta=delta;s.finalCupStatus=cupStatus;s.finalContinentalStatus=continentalStatus;
  retireAtCareerSeasonLimit(p);
}
function isDecisiveFinal(event={}){
  if(!event||event.type==='league')return false;
  // Strictly the final match, not semifinals or third-place matches.
  const stage=String(event.stage||'').trim();
  return Boolean(event.final===true||(/^final(?:\s|$|\s*[·:-])/i.test(stage)&&!(/ida/i.test(stage)&&Number(event.leg||1)===1))||
    (event.superCupName&&/final|decisão/i.test(stage)));
}
function continueSeasonSimulation(){
  const p=state.player,s=state.season;if(!s||s.closed||p.retired||state.pendingMatchDecision||state.pendingPenaltyShootout||pausedCareerOverlay||state.journeyPaused)return;
  if(maybePresentWorldCupOutcome())return;
  ensureDecisionPlan();state.simulatingSeason=true;let safety=0;
  while(!seasonComplete()&&safety<160){
    if(maybeOpenWorldCupDrawDuringSimulation())return;
    const event=chooseNextEvent();
    if(!event){
      if(worldCupTournamentLockActive(s,p)){
        state.simulatingSeason=false;nextEventCache=null;save();render();toast('A Copa do Mundo ainda está em andamento. O calendário de clubes permanece pausado.');return;
      }
      break;
    }
    const target=s.decisionTargets[s.decisionIndex];
    const healthy=(p.injuryGames||0)<=0;
    const appearanceRole=event.type==='national'?'start':healthy?clubAppearanceRole(event,p):'unused';
    const wc=isWorldCupYear(s.year),nationalLimit=wc?99:2;
    // Final de competição: decisão obrigatória, independente dos eventos aleatórios.
    // Mantemos a oportunidade mesmo em caso de lesão, para nunca simular uma final sem participação do jogador.
    if(isDecisiveFinal(event)){openMatchDecision(event);save();render();return;}
    // Copa do Mundo: toda partida do jogador recebe uma situação de decisão.
    const nationalDecision=event.type==='national'&&healthy&&(event.worldCup||((s.nationalDecisionCount||0)<nationalLimit&&Math.random()<(.58*INTERACTION_FREQUENCY*MATCH_DECISION_FREQUENCY_MULT)));
    if(nationalDecision){openMatchDecision(event);save();render();return;}
    if(event.type!=='national'&&healthy&&appearanceRole!=='unused'&&target!==undefined&&s.clubGames+1>=target){
      if(Math.random()<=Math.min(.98,INTERACTION_FREQUENCY*MATCH_DECISION_FREQUENCY_MULT)){openMatchDecision(event);save();render();return;}
      s.decisionIndex=(s.decisionIndex||0)+1; // cerca de 15% das situações são puladas para dar ritmo à temporada
    }
    simulateMatchCore(event);safety++;
    if(event.worldCup&&maybePresentWorldCupOutcome())return;
    if(state.pendingPenaltyShootout){state.simulatingSeason=false;openPenaltyShootoutDecision();save();render();return;}
    if(healthy&&event.type==='national'&&!event.worldCup&&maybeTriggerNationalEvent(event)){state.simulatingSeason=false;save();render();return;}
    if(healthy&&event.type!=='national'&&maybeTriggerSponsorEvent()){state.simulatingSeason=false;save();render();return;}
    if(healthy&&event.type!=='national'&&maybeTriggerIdolInteraction()){state.simulatingSeason=false;save();render();return;}
    if(healthy&&event.type!=='national'&&maybeTriggerCareerEvent()){state.simulatingSeason=false;save();render();return;}
  }
  if(safety>=160){state.simulatingSeason=false;toast('A simulação atingiu o limite de segurança do calendário.');save();render();return;}
  processSeasonEnd();const newTitles=(p.trophies||[]).slice(s.startTrophyCount||0).map(t=>t.name);const newAwards=(p.awards||[]).slice(s.startAwardCount||0).map(a=>a.name);pendingSeasonCelebration={titles:newTitles,awards:newAwards,ceremonies:state.season?.specialAwardCeremonies||[],idols:state.season?.idolCelebrations||[]};state.simulatingSeason=false;nextEventCache=null;save();render();showSeasonSummary();toast(`${state.offers.length} proposta(s) chegaram ao fim da temporada.`);
}
function simulateWholeSeason(){
  const s=state.season,p=state.player;if(!s||s.closed||p.retired)return;ensureDecisionPlan();continueSeasonSimulation();
}
function summaryClubBadge(team,countryCode=''){
  const safe=esc(team||'Clube');
  return `<span class="btl-summary-crest" title="${safe}" aria-label="${safe}">${clubCrestMarkup(team,countryCode)}</span>`;
}
function summaryCompetitionLogo(name){
  const safe=esc(name||'Competição');
  return `<span class="btl-summary-competition-logo" title="${safe}" aria-label="${safe}">${honourVisual(name)}</span>`;
}
function summaryDecisionMatch(d){
  // Carreiras novas armazenam as equipes/placares separados; carreiras antigas
  // usam a string legada 'Clube A 2 x 1 Clube B', sem reescrever o save.
  const old=String(d.match||'');
  const parsed=old.match(/^(.*?)\s+(\d+)\s*[x×]\s*(\d+)\s+(.+)$/i);
  const home=d.home||parsed?.[1],away=d.away||parsed?.[4];
  const hg=d.homeGoals??parsed?.[2],ag=d.awayGoals??parsed?.[3];
  if(!home||!away||hg===undefined||ag===undefined)return `<strong>${esc(old)}</strong>`;
  const isNational=d.scope==='national'||/FIFA World Cup|Copa do Mundo|Nations League|EURO |Copa Am[eé]rica|Asian Cup|Gold Cup|Eliminat[oó]rias/i.test(d.competition||'');
  const iconFor=team=>isNational?`<span class="btl-summary-national-badge" title="${esc(team)}">${nationalFlagImage(codeForCountryName(team),team)}</span>`:
    summaryClubBadge(team,canonicalClubCountryCode(team,'')||'');
  return `<strong class="btl-summary-scoreline" aria-label="${esc(home)} ${esc(hg)} a ${esc(ag)} ${esc(away)}">${iconFor(home)}<span class="btl-summary-score">${esc(hg)} <em>×</em> ${esc(ag)}</span>${iconFor(away)}</strong>`;
}
function showSeasonSummary(){
  applyClubTheme(state.player?.club);
  const s=state.season,p=state.player;if(!s||!s.closed)return;$('#summary-year').textContent=`TEMPORADA ${s.year}`;$('#summary-title').textContent=`${s.league.position}º lugar em ${s.league.name}`;$('#summary-subtitle').textContent=`${s.league.points} pontos · ${s.league.wins}V ${s.league.draws}E ${s.league.losses}D · ${state.offers.length} proposta(s) recebida(s)`;
  const seasonTitles=(p.trophies||[]).slice(s.startTrophyCount||0).map(t=>t.name);const seasonAwards=(p.awards||[]).slice(s.startAwardCount||0).map(a=>a.name);
  const seasonHonours=[...seasonTitles.map(name=>({name,type:'Título'})),...seasonAwards.map(name=>({name,type:'Prêmio'}))];
  $('#summary-honours').innerHTML=seasonHonours.length?seasonHonours.map(h=>`<div class="summary-honour">${honourVisual(h.name)}<span><strong>${h.name}</strong><small>${h.type}</small></span></div>`).join(''):'<p class="muted">Nenhum título ou prêmio nesta temporada.</p>';
  const leagueHeading=$('#summary-league-heading');
  if(leagueHeading)leagueHeading.innerHTML=`${summaryCompetitionLogo(s.league.name)}<span class="btl-summary-sr-only">Classificação da liga: ${esc(s.league.name)}</span>`;
  const standings=s.league.standings||[];$('#summary-standings').innerHTML=standings.map(r=>`<tr class="${r.user?'user-row':''}" style="--qualification-color:${r.qualificationColor||'transparent'}" title="${esc(r.team)}${r.qualification?.competition?' · '+esc(r.qualification.competition):''}${r.qualification?.phase?' · '+esc(r.qualification.phase):''}"><td><span class="btl-qualif-position">${r.position}</span></td><td class="btl-summary-club-cell">${summaryClubBadge(r.team,s.countryAtStart||'')}${r.qualification?`<small class="btl-qualif-chip">${esc(r.qualification.competition)} · ${r.qualification.phase==='league'?'Fase principal':r.qualification.phase==='playoff'?'Play-off':'Preliminar'}${r.qualification.model==='simulacao'?' · tabela simulada':''}</small>`:''}${r.divisionNotice?`<small class="btl-division-chip">${esc(r.divisionNotice)}</small>`:''}</td><td>${r.games}</td><td>${r.wins}</td><td>${r.draws}</td><td>${r.losses}</td><td>${r.gd>0?'+':''}${r.gd}</td><td><strong>${r.points}</strong></td></tr>`).join('');
  let qualLegend=document.getElementById('btl-qualification-legend');
  if(!qualLegend){qualLegend=document.createElement('div');qualLegend.id='btl-qualification-legend';qualLegend.className='btl-qualification-legend';document.getElementById('summary-standings')?.closest('table')?.after(qualLegend);}
  if(qualLegend)qualLegend.textContent='Azul: principal · Azul claro: preliminar · Dourado: torneio secundário / play-off · Verde: acesso / terceira competição · Vermelho: rebaixamento';
  const intTable=s.continental?.phaseStandings||[];
  const intBox=$('#summary-international-details'),intBody=$('#summary-international-standings');
  if(intBox&&intBody){
    intBox.classList.toggle('hidden',!intTable.length);
    if(intTable.length){
      $('#summary-international-heading').innerHTML=`${summaryCompetitionLogo(s.continental.name)}<span class="btl-summary-int-label">Classificação da ${esc(s.continental.format?.phase||'fase principal')} · ${intTable.length} clubes</span>`;
      intBody.innerHTML=intTable.map(r=>{
        const qualified=/CONMEBOL Libertadores|CONMEBOL Sul-Americana/i.test(s.continental.name)?r.position<=2:
          /UEFA Champions League|UEFA Europa League|UEFA Conference League/i.test(s.continental.name)?r.position<=Math.round(intTable.length*24/36):false;
        const direct=/CONMEBOL Libertadores|CONMEBOL Sul-Americana/i.test(s.continental.name)?r.position<=2:
          /UEFA Champions League|UEFA Europa League|UEFA Conference League/i.test(s.continental.name)?r.position<=Math.round(intTable.length*8/36):false;
        const color=direct?'#4b93ff':qualified?'#d6b75a':'transparent';
        return `<tr class="${r.team===s.clubAtStart?'user-row':''}" style="--qualification-color:${color}"><td>${r.position}</td><td class="btl-summary-club-cell">${summaryClubBadge(r.team,canonicalClubCountryCode(r.team,'')||'')}</td><td>${r.games}</td><td>${r.wins}</td><td>${r.draws}</td><td>${r.losses}</td><td>${r.gd>0?'+':''}${r.gd}</td><td><strong>${r.points}</strong></td></tr>`;
      }).join('');
    }
  }
  const cupItems=[{name:s.cup.name,status:s.finalCupStatus||cupFinalStatus(s.cup)}];if(s.leagueCup)cupItems.push({name:s.leagueCup.name,status:cupFinalStatus(s.leagueCup)});if(s.continental)cupItems.push({name:s.continental.name,status:s.finalContinentalStatus||continentalFinalStatus(s.continental)});(s.superCups||[]).forEach(sc=>cupItems.push({name:sc.name,status:sc.won?'Campeão':sc.eliminated?'Eliminado':sc.stages[sc.stageIndex]?.name||'Encerrado'}));if(isWorldCupYear(s.year)&&s.worldCup?.started)cupItems.push({name:'FIFA World Cup',status:worldCupStatusText(s.worldCup)});$('#summary-cups').innerHTML=cupItems.map(x=>`<div class="summary-status with-art btl-summary-cup" title="${esc(x.name)}">${summaryCompetitionLogo(x.name)}<span class="btl-summary-cup-status">${esc(x.status)}</span></div>`).join('');
  $('#summary-decisions').innerHTML=(s.decisionLogs||[]).map((d,i)=>`<div><div class="btl-summary-decision-head"><span class="btl-summary-decision-index">${i+1}.</span>${summaryDecisionMatch(d)}</div><span>${esc(d.choice)} · ${esc(d.outcome)}</span></div>`).join('');
  $('#summary-offers').innerHTML=state.offers.length?state.offers.map(o=>`<div class="summary-offer btl-summary-offer" title="${esc(o.club)}">${summaryClubBadge(o.club,o.countryCode||canonicalClubCountryCode(o.club,''))}<span>${esc(o.countryName)} · Força ${o.strength} · ${esc(money(o.value))}</span></div>`).join(''):'<p class="muted">Nenhuma proposta devido à aposentadoria.</p>';
  hydratePenaltyBadges($('#season-summary-modal'));
  $('#season-summary-modal').classList.remove('hidden');
}
$('#decision-continue').addEventListener('click',()=>{if(state.pendingPenaltyShootout){openPenaltyShootoutDecision();return;}$('#match-decision-modal').classList.add('hidden');continueSeasonSimulation();});
$('#pause-decision')?.addEventListener('click',()=>pauseCareerOverlay('decision'));
$('#pause-event')?.addEventListener('click',()=>pauseCareerOverlay('event'));
$('#resume-career-overlay')?.addEventListener('click',resumePausedCareerOverlay);
$('#summary-market').addEventListener('click',()=>{$('#season-summary-modal').classList.add('hidden');if(state.player?.retired&&pendingCareerCard){pendingCareerCard=false;showCareerLegacyCard();return;}showView('market');showPendingSeasonCelebration();});
$('#summary-close').addEventListener('click',()=>{$('#season-summary-modal').classList.add('hidden');if(state.player?.retired&&pendingCareerCard){pendingCareerCard=false;showCareerLegacyCard();return;}showPendingSeasonCelebration();});

function applyV95Migrations(){
  if(!localStorage.getItem(HALL_RESET_KEY)){
    state.savedCareers=[];
    if(state.player)state.player.hallSaved=false;
    // Evita reaproveitar qualquer resultado antigo e incorreto do Sporting para o Sport Recife.
    delete badgeCache.Sport;delete badgeCache['Sport Recife'];saveBadges();
    localStorage.setItem(HALL_RESET_KEY,'1');
  }
}

function applyV101Migrations(){
  // Pedido do usuário: limpar somente os cards já arquivados no Hall da Fama.
  // A carreira ativa, histórico da carreira atual e demais preferências são preservados.
  if(!localStorage.getItem(HALL_RESET_V101_KEY)){
    state.savedCareers=[];
    if(state.player)state.player.hallSaved=false;
    localStorage.setItem(HALL_RESET_V101_KEY,'1');
  }
}

function applyV104Migrations(){
  // Nova limpeza solicitada para esta entrega. Só remove cards arquivados; não toca na carreira ativa.
  if(!localStorage.getItem(HALL_RESET_V104_KEY)){
    state.savedCareers=[];if(state.player)state.player.hallSaved=false;localStorage.setItem(HALL_RESET_V104_KEY,'1');
  }
}

function normalizePersistentState(){
  state.savedCareers=Array.isArray(state.savedCareers)?state.savedCareers:[];pausedCareerOverlay=state.journeyPaused||null;ensureWorldPlayers();
  if(!state.player){renderSavedCareers();return;}
  const p=state.player;
  ensureClubRoleState(p);
  if(p.idol&&typeof p.idol==='string')p.idol=idolById(p.idol)||{id:normalizeKey(p.idol),name:p.idol,country:'',code:'',role:'Ídolo',style:'experiência'};
  if(p.nationalityCode&&confederation(p.nationalityCode)==='UEFA'){
    if(state.season?.year>=2028&&p.nationsLeagueTier==='D')p.nationsLeagueTier='C';
    if(!['A','B','C','D'].includes(p.nationsLeagueTier))p.nationsLeagueTier=nationsLeagueTierFor(p.nationalityCode,null,state.season?.year||2026);
  }
  p.value=marketValue(p.value||1100000);p.nationalTrust=clamp(p.nationalTrust||0,0,100);p.injuryGames=Math.max(0,p.injuryGames||0);p.injuryHistory=Array.isArray(p.injuryHistory)?p.injuryHistory:[];p.injuryRiskModifier=Math.max(0,Number(p.injuryRiskModifier)||0);p.reputation=clamp(p.reputation||10,0,100);p.morale=clamp(p.morale||70,40,100);p.recentCareerEventIds=p.recentCareerEventIds||[];p.recentOfferClubs=p.recentOfferClubs||[];p.recentNationalEventIds=p.recentNationalEventIds||[];p.clubIdols=Array.isArray(p.clubIdols)?p.clubIdols:(p.clubIcon&&p.club?[p.club]:[]);p.appearance=normalizeAppearance(p.appearance||{});state.pendingPenaltyShootout=state.pendingPenaltyShootout||null;

  // Corrige país/liga do clube em saves antigos. O nome do clube é a fonte de verdade.
  const canonical=canonicalClubCountryCode(p.club,p.clubCountry);
  if(canonical&&canonical!==p.clubCountry){p.clubCountry=canonical;p.clubCountryName=countryByCode(canonical)?.name||canonical;}
  else if(canonical&&!p.clubCountryName)p.clubCountryName=countryByCode(canonical)?.name||canonical;
  const currentClubProfile=clubCompetitionProfile(p.club,p.clubCountry);
  const verified2026=Number(state.season?.year||START_YEAR)===2026&&(LEAGUE_CLUB_POOLS[p.clubCountry]||[]).includes(p.club);
  if(verified2026){p.clubLeague=currentClubProfile.league;p.clubDivisionLevel=1;}
  else{p.clubLeague=p.clubLeague||currentClubProfile.league;p.clubDivisionLevel=p.clubDivisionLevel||currentClubProfile.divisionLevel||1;}
  p.clubCup=p.clubCup||currentClubProfile.cup;
  p.value=rebalanceMarketValue(p,.42,null);

  (state.history||[]).forEach(h=>{
    const code=canonicalClubCountryCode(h.club,h.clubCountry);
    if(code)h.clubCountry=code;
  });

  const s=state.season;
  if(s){
    s.superCups=Array.isArray(s.superCups)?s.superCups:[];s.competitionStats=s.competitionStats||{};
    s.nationalGamesPlayed=Math.max(0,s.nationalGamesPlayed||0);s.nationalDecisionCount=Math.max(0,s.nationalDecisionCount||0);s.nationalInteractionCount=Math.max(0,s.nationalInteractionCount||0);s.lastNationalEventAt=s.lastNationalEventAt??-10;s.sponsorEventDone=!!s.sponsorEventDone;s.idolInteractionCount=Math.max(0,s.idolInteractionCount||0);s.lastIdolInteractionAt=s.lastIdolInteractionAt??-20;
    if(s.leagueGames==null){
      const played=Math.max(0,s.clubGames||0),leaguePlayed=Math.min(s.league?.index||0,played||s.league?.index||0),ratio=played?leaguePlayed/played:1;
      s.leagueGames=leaguePlayed;s.leagueGoals=Math.round((s.clubGoals||0)*ratio);s.leagueAssists=Math.round((s.clubAssists||0)*ratio);
    }
    s.leagueGoals=Math.max(0,s.leagueGoals||0);s.leagueAssists=Math.max(0,s.leagueAssists||0);
    const seasonClub=s.clubAtStart||p.club;
    const seasonCode=canonicalClubCountryCode(seasonClub,s.countryAtStart||p.clubCountry);
    const seasonProfile=clubCompetitionProfile(seasonClub,seasonCode);const rule=getCompetitionRule(seasonCode,countryByCode(seasonCode)?.name||'');
    const officialSeasonLeague=Number(s.year)===2026&&(LEAGUE_CLUB_POOLS[seasonCode]||[]).includes(seasonClub)?rule.league:null;
    const seasonLeague=officialSeasonLeague||seasonProfile.league||s.leagueAtStart||rule.league;const format=getLeagueFormatForClub(seasonCode,seasonLeague);
    const wrongLeague=seasonCode&&(s.countryAtStart!==seasonCode||s.league?.name!==seasonLeague);
    s.countryAtStart=seasonCode||s.countryAtStart||p.clubCountry;s.leagueAtStart=seasonLeague;s.divisionLevel=s.divisionLevel||seasonProfile.divisionLevel||1;
    if(wrongLeague&&s.league){
      const oldIndex=s.league.index||0;
      s.league.name=seasonLeague;s.league.format=format;
      s.league.schedule=generateLeagueSchedule(seasonCode,seasonClub,seasonLeague,s.year);
      s.league.index=Math.min(oldIndex,s.league.schedule.length);
      if(s.league.standings)s.league.standings=[];
    }
    if(s.cup){s.cup.name=seasonProfile.cup||rule.cup;if(!s.cup.stages?.length)s.cup.stages=domesticCupStages(seasonCode);}
    if(!s.leagueCup && s.year>=2026 && seasonCode==='ENG' && !s.closed){s.leagueCup=createCarabaoCup({...p,clubCountry:'ENG',clubLeague:seasonLeague},s.continental?.name||'');}
    s.lastSelectionCheckRound=s.lastSelectionCheckRound??-10;
    if(isWorldCupYear(s.year)){
      const wc=ensureWorldCupState(s,p);if(wc){upgradeWorldCupState(wc,p,s.league?.schedule?.length||34);if(p.calledUp&&!wc.finished)wc.active=true;}
      ensureNationalCalendarState(s,p);
    }else{
      s.worldCup=null;ensureNationalCalendarState(s,p);
    }
  }

  state.savedCareers=(state.savedCareers||[]).map(c=>{
    const counts=savedCareerTitleCounts(c);
    if(counts.length)c.titleCounts=Object.fromEntries(counts);
    c.titles=savedCareerTotalTitles(c);
    return c;
  });

  (p.trophies||[]).forEach(t=>{
    const season=(state.history||[]).find(h=>h.year===t.year);if(!t.club&&season?.club)t.club=season.club;
    const seasonCode=canonicalClubCountryCode(season?.club||'',season?.clubCountry||'');
    if(t.name==='Premier League / Premiership'||t.name==='Scottish Premiership'||t.name==='Premier League'){
      if(seasonCode==='SCO')t.name='Scottish Premiership';
      else if(seasonCode==='ENG')t.name='Premier League';
    }
    if(t.name==='Copa Nacional'||t.name==='Scottish Cup'||t.name==='FA Cup'){
      if(seasonCode==='SCO')t.name='Scottish Cup';
      else if(seasonCode==='ENG')t.name='FA Cup';
      else if(seasonCode==='MX')t.name='Copa MX';
    }
  });

  state.offers=(state.offers||[]).map(o=>{
    const code=canonicalClubCountryCode(o.club,o.countryCode);
    const profile=clubCompetitionProfile(o.club,code);return {...o,countryCode:code,countryName:countryByCode(code)?.name||code,league:o.league||profile.league,cup:o.cup||profile.cup,divisionLevel:o.divisionLevel||profile.divisionLevel||1,value:marketValue(o.value||p.value)};
  });
}

function repairStalledYoungDevelopment(){
  const p=state.player;if(!state.created||!p||p.retired||p.progressionRepairV1033)return;
  p.progressionRepairV1033=true;
  const seasons=(state.history||[]).length,potentialGap=Math.max(0,(p.potential||p.overall)-p.overall);
  if(seasons>=2&&p.age<=23&&p.overall<=72&&potentialGap>=12){
    const cap=currentSeasonOverallCap(),boost=Math.min(2,Math.max(0,cap-p.overall),potentialGap);
    if(boost>0){p.overall+=boost;evolvePlayerAttributes(boost,7.2);state.news.unshift(`${p.name} recebe um ajuste de desenvolvimento: a progressão volta a refletir seu alto potencial.`);}
  }
  save();
}
preloadTrophyImages();populateCreationFields();enhanceAllSelects();setupBirthdateLimits();renderAppearanceStudio();updateAppearancePreview();applyV95Migrations();applyV101Migrations();applyV104Migrations();normalizePersistentState();repairStalledYoungDevelopment();sanitizeAwardsEligibility();save();if(LEGACY_V95_FOR_MIGRATION)localStorage.setItem(LEGACY_V103_CLAIM_KEY,'1');initSoundtrack();render();worldRestorePromise=loadPersistedWorld();observeSiteImages();if(state.pendingEvent&&!pausedCareerOverlay&&!state.journeyPaused)openPendingEvent();if(state.pendingPenaltyShootout&&!pausedCareerOverlay&&!state.journeyPaused)setTimeout(openPenaltyShootoutDecision,120);if(state.player?.retired&&!state.player.legacyCardSeen)setTimeout(showCareerLegacyCard,100);
// Navegação interna — sem depender do histórico externo do navegador.
document.getElementById('btl-site-back')?.addEventListener('click',navigateBackInsideSite);
