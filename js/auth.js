(() => {
  'use strict';
  const ACCOUNTS_KEY='btlAccountsV1';
  const SESSION_KEY='btlAuthSessionV1';
  const GUEST_KEY='btlGuestAccountV1';
  const SESSION_DAYS=7;
  const SESSION_MS=SESSION_DAYS*24*60*60*1000;
  let pendingGoogle=null;

  const readJson=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch(_){return fallback}};
  const writeJson=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
  const accounts=()=>{const list=readJson(ACCOUNTS_KEY,[]);return Array.isArray(list)?list:[]};
  const saveAccounts=list=>writeJson(ACCOUNTS_KEY,list);
  const normNick=v=>String(v||'').trim();
  const nickKey=v=>normNick(v).toLocaleLowerCase('pt-BR');
  const validNickname=v=>/^[A-Za-zÀ-ÖØ-öø-ÿ0-9_.-]{3,20}$/.test(normNick(v));
  const uniqueNickname=(v,exceptKey='')=>!accounts().some(a=>a.accountKey!==exceptKey&&nickKey(a.nickname)===nickKey(v));
  const bytesToB64=bytes=>btoa(String.fromCharCode(...bytes));
  const randomSalt=()=>{const b=new Uint8Array(16);crypto.getRandomValues(b);return bytesToB64(b)};
  async function passwordHash(password,salt){
    if(!window.crypto?.subtle)throw new Error('Este navegador precisa de suporte a Web Crypto para contas locais.');
    const enc=new TextEncoder(),key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
    const saltBytes=Uint8Array.from(atob(salt),c=>c.charCodeAt(0));
    const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:saltBytes,iterations:120000},key,256);
    return bytesToB64(new Uint8Array(bits));
  }
  function randomId8(){const used=new Set(accounts().map(a=>String(a.id8)));let id;do{id=String(Math.floor(10000000+Math.random()*90000000))}while(used.has(id));return id}
  function googleId8(sub=''){let h=2166136261;for(const ch of String(sub)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return String(10000000+(Math.abs(h>>>0)%90000000))}
  const accountByKey=key=>accounts().find(a=>a.accountKey===key)||null;
  function getSession(){const s=readJson(SESSION_KEY,null);return s&&typeof s==='object'?s:null}
  function sessionExpired(s=getSession()){return !s||!s.expiresAt||Date.now()>=new Date(s.expiresAt).getTime()}
  function getCurrentAccount(){const s=getSession();if(sessionExpired(s))return null;return accountByKey(s.accountKey)}
  function startSession(account){const now=new Date(),expires=new Date(Date.now()+SESSION_MS);writeJson(SESSION_KEY,{accountKey:account.accountKey,issuedAt:now.toISOString(),expiresAt:expires.toISOString()});location.reload()}
  function getGameStorageKey(){const a=getCurrentAccount();return a?`beTheLegendV103:${a.accountKey}`:'beTheLegendV103:locked'}
  function showError(msg=''){const el=document.getElementById('auth-error');if(el)el.textContent=msg}
  function setTab(tab){const login=tab==='login';document.getElementById('auth-login-form')?.classList.toggle('hidden',!login);document.getElementById('auth-create-form')?.classList.toggle('hidden',login);document.getElementById('auth-tab-login')?.classList.toggle('active',login);document.getElementById('auth-tab-create')?.classList.toggle('active',!login);showError('')}
  function openLegal(kind){document.getElementById(kind==='terms'?'terms-modal':'privacy-modal')?.classList.remove('hidden')}
  function closeLegal(kind){document.getElementById(kind==='terms'?'terms-modal':'privacy-modal')?.classList.add('hidden')}
  function upsertAccount(account){const list=accounts(),i=list.findIndex(a=>a.accountKey===account.accountKey);if(i>=0)list[i]={...list[i],...account};else list.push(account);saveAccounts(list);return account}
  function stableGuest(){let guest=readJson(GUEST_KEY,null);if(guest?.accountKey){const existing=accountByKey(guest.accountKey);if(existing)return existing}
    const id8=randomId8();guest={accountKey:`guest:${id8}`,id8,nickname:`Convidado${id8.slice(-4)}`,type:'guest',email:'',createdAt:new Date().toISOString(),termsAcceptedAt:new Date().toISOString()};upsertAccount(guest);writeJson(GUEST_KEY,{accountKey:guest.accountKey});return guest}
  async function createLocal(){
    const nickname=normNick(document.getElementById('auth-create-nickname')?.value),password=document.getElementById('auth-create-password')?.value||'',confirm=document.getElementById('auth-create-confirm')?.value||'',accepted=!!document.getElementById('auth-create-terms')?.checked;
    if(!validNickname(nickname)){showError('Use um nickname de 3 a 20 caracteres, com letras, números, ponto, hífen ou _.');return}
    if(!uniqueNickname(nickname)){showError('Este nickname já existe neste dispositivo.');return}
    if(password.length<8){showError('A senha precisa ter pelo menos 8 caracteres.');return}if(password!==confirm){showError('As senhas não coincidem.');return}if(!accepted){showError('Aceite os Termos e a Política de Privacidade para criar a conta.');return}
    showError('Criando conta…');try{const salt=randomSalt(),hash=await passwordHash(password,salt),id8=randomId8();const account=upsertAccount({accountKey:`local:${id8}`,id8,nickname,type:'local',email:'',createdAt:new Date().toISOString(),termsAcceptedAt:new Date().toISOString(),passwordSalt:salt,passwordHash:hash});startSession(account)}catch(err){showError(err.message||'Não foi possível criar a conta.')}
  }
  async function loginLocal(){
    const nickname=normNick(document.getElementById('auth-login-nickname')?.value),password=document.getElementById('auth-login-password')?.value||'';const account=accounts().find(a=>a.type==='local'&&nickKey(a.nickname)===nickKey(nickname));
    if(!account){showError('Conta não encontrada neste dispositivo.');return}try{showError('Verificando…');const hash=await passwordHash(password,account.passwordSalt);if(hash!==account.passwordHash){showError('Senha incorreta.');return}startSession(account)}catch(err){showError(err.message||'Não foi possível entrar.')}
  }
  // Google Identity Services fornece a credencial, mas o servidor deve validá-la.
  // Nunca aceite o token apenas com decodificação do JWT no navegador.
  function googleErrorMessage(status,serverCode,reason,networkFailure=false){
    const host=location.hostname.toLowerCase();
    if(location.protocol==='file:'||host==='localhost'||host==='127.0.0.1')
      return 'O login Google exige uma hospedagem com a função /api/auth/google. Abra a versão publicada em https://projeto-bethelegend.pages.dev/.';
    if(host.endsWith('.github.io'))
      return 'O GitHub Pages não executa a verificação Google (/api/auth/google). Use https://projeto-bethelegend.pages.dev/ para entrar com Google.';
    if(networkFailure)
      return 'Não foi possível acessar /api/auth/google. Verifique sua conexão e as funções do deploy no Cloudflare Pages.';
    if(status===404||status===405)
      return `A API Google não está ativa neste domínio (HTTP ${status}). Publique a pasta functions/ no Cloudflare Pages pelo GitHub ou Wrangler.`;
    if(status===401){
      if(reason==='audience')
        return 'O token Google foi emitido para outro Client ID (HTTP 401). Confira se GOOGLE_CLIENT_ID no Cloudflare é igual ao ID de js/google-auth-config.js.';
      if(reason==='expiration')
        return 'A credencial Google expirou (HTTP 401). Atualize a página e entre novamente.';
      return 'O servidor rejeitou a credencial Google (HTTP 401). Verifique o Client ID, a origem autorizada e a configuração OAuth.';
    }
    if(status===403)
      return 'O servidor bloqueou a solicitação Google (HTTP 403). Verifique as regras de segurança do Cloudflare e as permissões OAuth.';
    if(status===503){
      if(serverCode==='google_not_configured')
        return 'O Client ID de Google no Cloudflare não está configurado corretamente (HTTP 503).';
      return 'O verificador Google está temporariamente indisponível (HTTP 503). Tente novamente e confira os logs das funções.';
    }
    if(status===502||status===504||status>=500)
      return `A autenticação no servidor falhou (HTTP ${status}). Consulte os logs do Cloudflare Pages Functions.`;
    if(status===200)
      return 'A rota /api/auth/google respondeu sem uma identidade verificada. Verifique se a função correta está publicada.';
    return `Falha na validação Google (HTTP ${status||'desconhecido'}). Confira a rota /api/auth/google no domínio atual.`;
  }
  async function handleGoogleCredential(response){
    const credential=String(response?.credential||'');
    if(!credential){showError('O Google não retornou uma credencial.');return}
    // Não enviar tokens de identidade para um host que não executa Pages Functions.
    const host=location.hostname.toLowerCase();
    if(location.protocol==='file:'||host.endsWith('.github.io')){
      showError(googleErrorMessage(0,'',''));return;
    }
    showError('Validando credencial Google…');let payload;
    let r;
    try{
      r=await fetch('/api/auth/google',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({credential}),cache:'no-store'});
    }catch(_){showError(googleErrorMessage(0,'','',true));return}
    let data;
    try{data=await r.json()}catch(_){
      showError(googleErrorMessage(r.status,'',''));return;
    }
    if(!r.ok||!data?.identity?.sub){
      showError(googleErrorMessage(r.status,String(data?.error||''),String(data?.reason||'')));return;
    }
    payload=data.identity;
    showError('');
    const existing=accounts().find(a=>a.type==='google'&&a.googleSub===payload.sub);
    if(existing){upsertAccount({...existing,email:payload.email||existing.email||'',googleName:payload.name||existing.googleName||''});startSession(existing);return}
    pendingGoogle={sub:payload.sub,email:payload.email||'',name:payload.name||''};
    document.getElementById('auth-main-step')?.classList.add('hidden');
    document.getElementById('auth-google-profile-step')?.classList.remove('hidden');
    const suggested=(payload.given_name||payload.name||'').replace(/\s+/g,'').slice(0,20);
    const input=document.getElementById('auth-google-nickname');if(input&&!input.value)input.value=suggested;
  }
  function finishGoogleAccount(){
    if(!pendingGoogle)return;const nickname=normNick(document.getElementById('auth-google-nickname')?.value),accepted=!!document.getElementById('auth-google-terms')?.checked;if(!validNickname(nickname)){showError('Escolha um nickname válido de 3 a 20 caracteres.');return}if(!uniqueNickname(nickname)){showError('Este nickname já existe neste dispositivo.');return}if(!accepted){showError('Aceite os Termos e a Política de Privacidade.');return}
    const id8=googleId8(pendingGoogle.sub),account=upsertAccount({accountKey:`google:${pendingGoogle.sub}`,googleSub:pendingGoogle.sub,id8,nickname,type:'google',email:pendingGoogle.email,googleName:pendingGoogle.name,createdAt:new Date().toISOString(),termsAcceptedAt:new Date().toISOString()});startSession(account)
  }
  function initGoogle(){
    const clientId=String(window.BTL_GOOGLE_CLIENT_ID||'').trim(),container=document.getElementById('google-signin-container'),fallback=document.getElementById('google-signin-unconfigured'),note=document.getElementById('google-config-note');
    if(!clientId){fallback?.classList.remove('hidden');return}
    fallback?.classList.add('hidden');const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client?hl=pt-BR';script.async=true;script.defer=true;script.onload=()=>{try{google.accounts.id.initialize({client_id:clientId,callback:handleGoogleCredential,auto_select:false,cancel_on_tap_outside:true});if(container){container.innerHTML='';google.accounts.id.renderButton(container,{type:'standard',theme:'outline',size:'large',text:'continue_with',shape:'rectangular',logo_alignment:'left',width:360,locale:'pt_BR'})}}catch(_){fallback?.classList.remove('hidden');note?.classList.remove('hidden')}};script.onerror=()=>{fallback?.classList.remove('hidden');note?.classList.remove('hidden')};document.head.appendChild(script)
  }
  function logout(){localStorage.removeItem(SESSION_KEY);try{window.google?.accounts?.id?.disableAutoSelect?.()}catch(_){}location.reload()}
  function updateContactEmail(email){const a=getCurrentAccount();if(!a)return;upsertAccount({...a,contactEmail:String(email||'').trim()})}
  function init(){
    document.querySelectorAll('[data-legal-open]').forEach(b=>b.addEventListener('click',()=>openLegal(b.dataset.legalOpen)));document.querySelectorAll('[data-legal-close]').forEach(b=>b.addEventListener('click',()=>closeLegal(b.dataset.legalClose)));document.querySelectorAll('.legal-modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.add('hidden')}));
    const gate=document.getElementById('auth-gate'),session=getSession(),current=getCurrentAccount();if(current){gate?.classList.add('hidden');const remaining=Math.max(500,new Date(session.expiresAt).getTime()-Date.now());setTimeout(()=>{localStorage.removeItem(SESSION_KEY);location.reload()},remaining);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&sessionExpired()){localStorage.removeItem(SESSION_KEY);location.reload()}});return}
    gate?.classList.remove('hidden');if(session&&sessionExpired(session))showError('Sua sessão de 7 dias expirou. Entre novamente para continuar.');
    document.getElementById('auth-tab-login')?.addEventListener('click',()=>setTab('login'));document.getElementById('auth-tab-create')?.addEventListener('click',()=>setTab('create'));
    document.getElementById('auth-login-form')?.addEventListener('submit',e=>{e.preventDefault();loginLocal()});document.getElementById('auth-create-form')?.addEventListener('submit',e=>{e.preventDefault();createLocal()});
    const guestExists=!!readJson(GUEST_KEY,null)?.accountKey,guestBtn=document.getElementById('auth-guest');if(guestExists&&guestBtn){const b=guestBtn.querySelector('b'),s=guestBtn.querySelector('small');if(b)b.textContent='Continuar como convidado';if(s)s.textContent='Retomar a conta convidada deste dispositivo'}guestBtn?.addEventListener('click',()=>startSession(stableGuest()));
    document.getElementById('google-signin-unconfigured')?.addEventListener('click',()=>{showError('Para ativar o Google, informe seu Client ID em js/google-auth-config.js após configurar o domínio no Google Cloud.');document.getElementById('google-config-note')?.classList.remove('hidden')});
    document.getElementById('auth-google-finish')?.addEventListener('click',finishGoogleAccount);document.getElementById('auth-google-back')?.addEventListener('click',()=>{pendingGoogle=null;document.getElementById('auth-google-profile-step')?.classList.add('hidden');document.getElementById('auth-main-step')?.classList.remove('hidden')});
    initGoogle();
  }
  window.BTLAuth={getCurrentAccount,getSession,getGameStorageKey,logout,updateContactEmail,openLegal,closeLegal};
  window.handleGoogleCredential=handleGoogleCredential;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();