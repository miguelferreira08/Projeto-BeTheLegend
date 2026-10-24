/* V20 — Localização de menus e interfaces principais. Histórias narrativas longas permanecem no idioma original. */
(function(){
'use strict';
const KEY='btl-ui-language-v20';
const MAP={
'Continuar carreira':['Continue career','Continuar carrera','Continuer la carrière'],
'Nova carreira':['New career','Nueva carrera','Nouvelle carrière'],
'Meu Legado':['My Legacy','Mi legado','Mon héritage'],
'Som / Trilha sonora':['Sound / Soundtrack','Sonido / Música','Son / Musique'],
'Contato':['Contact','Contacto','Contact'],
'Linguagem':['Language','Idioma','Langue'],
'Português':['Português','Português','Português'],
'English':['English','English','English'],
'Español':['Español','Español','Español'],
'Français':['Français','Français','Français'],
'Confirmar':['Confirm','Confirmar','Confirmer'],
'Fechar':['Close','Cerrar','Fermer'],
'Cancelar':['Cancel','Cancelar','Annuler'],
'Voltar':['Back','Volver','Retour'],
'Entrar':['Sign in','Entrar','Connexion'],
'Criar conta':['Create account','Crear cuenta','Créer un compte'],
'Continuar com Google':['Continue with Google','Continuar con Google','Continuer avec Google'],
'Criar conta com Google':['Create with Google','Crear con Google','Créer avec Google'],
'Criar minha conta':['Create my account','Crear mi cuenta','Créer mon compte'],
'NickName':['Nickname','Apodo','Pseudo'],
'Nickname':['Nickname','Apodo','Pseudo'],
'Senha':['Password','Contraseña','Mot de passe'],
'Confirme a senha':['Confirm password','Confirma contraseña','Confirmer le mot de passe'],
'Esqueci minha senha':['Forgot password','Olvidé mi contraseña',"Mot de passe oublié"],
'Jogar como convidado':['Play as guest','Jugar como invitado','Jouer en invité'],
'CONTINUAR CARREIRA':['CONTINUE CAREER','CONTINUAR CARRERA','CONTINUER LA CARRIÈRE'],
'CARREIRA ATUAL':['CURRENT CAREER','CARRERA ACTUAL','CARRIÈRE ACTUELLE'],
'NOVA':['NEW','NUEVA','NOUVELLE'],
'ATIVA':['ACTIVE','ACTIVA','ACTIVE'],
'ENCERRADA':['FINISHED','FINALIZADA','TERMINÉE'],
'GER':['OVR','GEN','GÉN'],
'TEMP.':['SEAS.','TEMP.','SAIS.'],
'TÍTULOS':['TROPHIES','TÍTULOS','TITRES'],
'Títulos':['Trophies','Títulos','Titres'],
'Crie sua lenda':['Create your legend','Crea tu leyenda','Créez votre légende'],
'SEM CLUBE':['NO CLUB','SIN CLUB','SANS CLUB'],
'ESTATÍSTICAS':['STATISTICS','ESTADÍSTICAS','STATISTIQUES'],
'MERCADO':['TRANSFERS','MERCADO','TRANSFERTS'],
'LEGADO':['LEGACY','LEGADO','HÉRITAGE'],
'CARREIRA':['CAREER','CARRERA','CARRIÈRE'],
'Estatísticas':['Statistics','Estadísticas','Statistiques'],
'Mercado':['Transfer market','Mercado','Mercato'],
'Carreira':['Career','Carrera','Carrière'],
'Criação do jogador':['Create player','Crear jugador','Créer le joueur'],
'CRIAÇÃO DO JOGADOR':['PLAYER CREATION','CREACIÓN DEL JUGADOR','CRÉATION DU JOUEUR'],
'Comece sua trajetória':['Start your journey','Comienza tu camino','Commencez votre parcours'],
'APARÊNCIA':['APPEARANCE','APARIENCIA','APPARENCE'],
'Aparência':['Appearance','Apariencia','Apparence'],
'Monte o rosto do seu jogador':['Build your player’s face','Crea el rostro de tu jugador','Créez le visage de votre joueur'],
'Nome':['Name','Nombre','Nom'],
'Data de nascimento':['Birth date','Fecha de nacimiento','Date de naissance'],
'Nacionalidade':['Nationality','Nacionalidad','Nationalité'],
'Posição':['Position','Posición','Poste'],
'Pé dominante':['Preferred foot','Pie dominante','Pied fort'],
'Número da camiseta':['Shirt number','Número de camiseta','Numéro de maillot'],
'Ídolo da carreira':['Career idol','Ídolo de carrera','Idole de carrière'],
'Escolha seu ídolo':['Choose your idol','Elige tu ídolo','Choisissez votre idole'],
'Escolha um ídolo':['Choose an idol','Elige un ídolo','Choisissez une idole'],
'Escolha quem vai inspirar sua trajetória.':['Choose your inspiration.','Elige tu inspiración.','Choisissez votre inspiration.'],
'CLUBE INICIAL':['STARTING CLUB','CLUB INICIAL','CLUB DE DÉPART'],
'Clube inicial':['Starting club','Club inicial','Club de départ'],
'Nome do jogador':['Player name','Nombre del jugador','Nom du joueur'],
'Clube':['Club','Club','Club'],
'Clubes':['Clubs','Clubes','Clubs'],
'Selecione um país':['Choose a country','Selecciona un país','Sélectionnez un pays'],
'Escolha um país':['Choose a country','Elige un país','Choisissez un pays'],
'Editar facial':['Edit face','Editar rostro','Modifier le visage'],
'Seleção nacional':['National team','Selección nacional','Équipe nationale'],
'SELEÇÃO NACIONAL':['NATIONAL TEAM','SELECCIÓN NACIONAL','ÉQUIPE NATIONALE'],
'Fora da lista':['Not selected','Fuera de la lista','Non sélectionné'],
'Convocado':['Called up','Convocado','Sélectionné'],
'JOGOS':['MATCHES','PARTIDOS','MATCHS'],
'Jogos':['Matches','Partidos','Matchs'],
'Gols':['Goals','Goles','Buts'],
'Assistências':['Assists','Asistencias','Passes décisives'],
'Assist.':['Ast.','Asist.','Pd.'],
'NOTA':['RATING','NOTA','NOTE'],
'Nota':['Rating','Nota','Note'],
'FUNÇÃO':['ROLE','FUNCIÓN','RÔLE'],
'Fora do grupo':['Not selected','Fuera del grupo','Hors du groupe'],
'FORA DO GRUPO':['NOT SELECTED','FUERA DEL GRUPO','NON RETENU'],
'Competições da temporada':['Season competitions','Competiciones de temporada','Compétitions de la saison'],
'Classificação da liga':['League standings','Clasificación de liga','Classement du championnat'],
'Destaques das competições':['Competition leaders','Líderes de competición','Leaders des compétitions'],
'ARTILHARIA':['TOP SCORERS','GOLEADORES','BUTEURS'],
'ASSISTÊNCIAS':['ASSISTS','ASISTENCIAS','PASSES DÉCISIVES'],
'Mais gols':['Most goals','Más goles','Plus de buts'],
'Mais assistências':['Most assists','Más asistencias','Plus de passes décisives'],
'Temporada':['Season','Temporada','Saison'],
'TEMPORADA':['SEASON','TEMPORADA','SAISON'],
'Finalizar temporada':['Finish season','Finalizar temporada','Terminer la saison'],
'Concluir temporada':['Finish season','Terminar temporada','Terminer la saison'],
'Simular temporada':['Simulate season','Simular temporada','Simuler la saison'],
'Simular partida':['Simulate match','Simular partido','Simuler le match'],
'Próxima partida':['Next match','Próximo partido','Prochain match'],
'PRÓXIMA PARTIDA':['NEXT MATCH','PRÓXIMO PARTIDO','PROCHAIN MATCH'],
'Prêmios':['Awards','Premios','Récompenses'],
'Histórico':['History','Historial','Historique'],
'Conquistas da temporada':['Season achievements','Logros de la temporada','Réussites de la saison'],
'Copas':['Cups','Copas','Coupes'],
'Propostas recebidas':['Offers received','Ofertas recibidas','Offres reçues'],
'Nova história':['New story','Nueva historia','Nouvelle histoire'],
'Começar uma nova história?':['Start a new story?','¿Comenzar una nueva historia?','Commencer une nouvelle histoire ?'],
'EXCLUIR E CRIAR NOVA ↗':['DELETE AND START NEW ↗','BORRAR Y CREAR NUEVA ↗','EFFACER ET RECOMMENCER ↗'],
'Editar jogador':['Edit player','Editar jugador','Modifier le joueur'],
'Meu jogador':['My player','Mi jugador','Mon joueur'],
'Partidas':['Matches','Partidos','Matchs'],
'Vestiário':['Locker room','Vestuario','Vestiaire'],
'Conta':['Account','Cuenta','Compte'],
'Sair':['Log out','Salir','Déconnexion'],
'Jogar':['Play','Jugar','Jouer'],
'Concluir imediatamente':['Finish now','Terminar ahora','Terminer maintenant'],
'Continuar':['Continue','Continuar','Continuer'],
'Pausar':['Pause','Pausar','Pause'],
'Ⅱ Pausar':['Ⅱ Pause','Ⅱ Pausar','Ⅱ Pause'],
'Escolha seu próximo passo':['Choose your next move','Elige tu siguiente paso','Choisissez votre prochain choix'],
'ESCOLHA SEU PRÓXIMO PASSO':['CHOOSE YOUR NEXT MOVE','ELIGE TU SIGUIENTE PASO','CHOISISSEZ VOTRE PROCHAIN CHOIX'],
'VER RESULTADO':['VIEW RESULT','VER RESULTADO','VOIR LE RÉSULTAT'],
'ESCOLHA':['CHOOSE','ELIGE','CHOISISSEZ'],
'DECISÃO':['DECISION','DECISIÓN','DÉCISION'],
'CONTINUAR':['CONTINUE','CONTINUAR','CONTINUER'],
'EVENTO DE CARREIRA':['CAREER EVENT','EVENTO DE CARRERA','ÉVÉNEMENT DE CARRIÈRE'],
'CARREIRA ATIVA':['ACTIVE CAREER','CARRERA ACTIVA','CARRIÈRE ACTIVE'],
'Seleção de jogadores':['Player selection','Selección de jugadores','Sélection des joueurs'],
'Controles':['Controls','Controles','Contrôles'],
'Cartas ICON':['ICON cards','Cartas ICON','Cartes ICON'],
'Trilha sonora':['Soundtrack','Banda sonora','Bande originale'],
'Volume':['Volume','Volumen','Volume'],
'Reproduzir':['Play','Reproducir','Lire'],
'Pausar música':['Pause music','Pausar música','Mettre la musique en pause'],
'Contato com o desenvolvedor':['Contact the developer','Contacto con el desarrollador','Contacter le développeur'],
'Enviar mensagem':['Send message','Enviar mensaje','Envoyer le message'],
'E-mail do jogador':['Player email','Correo del jugador','E-mail du joueur'],
'Sua mensagem':['Your message','Tu mensaje','Votre message'],
'Privacidade':['Privacy','Privacidad','Confidentialité'],
'Termos':['Terms','Términos','Conditions'],
'Política de Privacidade':['Privacy Policy','Política de privacidad','Politique de confidentialité'],
'Termos de Uso':['Terms of Use','Términos de uso',"Conditions d'utilisation"],
'Entrar com Google':['Sign in with Google','Entrar con Google','Connexion avec Google'],
'Confirmar escolha':['Confirm selection','Confirmar selección','Confirmer la sélection'],
'Pesquisar':['Search','Buscar','Rechercher'],
'Buscar opção...':['Search options...','Buscar opciones...','Rechercher...'],
'Selecionar':['Select','Seleccionar','Sélectionner'],
'Carreira encerrada':['Career completed','Carrera finalizada','Carrière terminée'],
'Carreira salva':['Career saved','Carrera guardada','Carrière sauvegardée'],
'Selecione':['Select','Selecciona','Sélectionnez'],
'Encerrar':['Finish','Finalizar','Terminer'],
'Cancelar exclusão':['Cancel deletion','Cancelar eliminación',"Annuler la suppression"],
'Voltar ao jogo':['Return to game','Volver al juego','Retour au jeu'],
'Modo carreira':['Career mode','Modo carrera','Mode carrière'],
'BE THE LEGEND · AUDIO':['BE THE LEGEND · AUDIO','BE THE LEGEND · AUDIO','BE THE LEGEND · AUDIO'],
};
const LANGS=['en','es','fr'];let current='pt-BR';
try{const saved=localStorage.getItem(KEY);if(['pt-BR',...LANGS].includes(saved))current=saved}catch(_){}
const lookup=new Map();const reverse=new Map();
const normalize=v=>String(v||'').trim().replace(/\s+/g,' ').toLocaleLowerCase('pt-BR');
for(const [pt,translations] of Object.entries(MAP)){
 lookup.set(normalize(pt),[pt,...translations]);
 for(const t of translations){if(t)reverse.set(normalize(t),pt)}
}
function transl(value){const trimmed=String(value||'').trim();if(!trimmed)return value;
 let key=normalize(trimmed),row=lookup.get(key);
 if(!row && reverse.has(key))row=lookup.get(normalize(reverse.get(key)));
 if(!row){
  const national=/^Seleção de (.+)$/i.exec(trimmed);
  if(national){const prefix={en:'National team: ',es:'Selección de ',fr:'Équipe de '}[current];return current==='pt-BR'?trimmed:(prefix+national[1]);}
  return value;
 }
 const output=current==='pt-BR'?row[0]:row[LANGS.indexOf(current)+1];
 return /^\s/.test(value)?value.match(/^\s*/)[0]+output+value.match(/\s*$/)[0]:output;
}
const excluded=['SCRIPT','STYLE','NOSCRIPT','TEXTAREA','CODE'];
const preserveIds=new Set(['p-name','home-current-player','p-club','home-career-club','national-country','account-top-nickname']);
function translateNode(node){
 if(node.nodeType!==Node.TEXT_NODE||!node.parentElement)return;
 let parent=node.parentElement;
 if(excluded.includes(parent.tagName)||parent.closest('[data-no-i18n]'))return;
 if(preserveIds.has(parent.id))return;
 const newValue=transl(node.nodeValue);
 if(node.nodeValue!==newValue)node.nodeValue=newValue;
}
function apply(root=document.body){if(!root)return;
 const nodes=[];
 if(root.nodeType===Node.TEXT_NODE)nodes.push(root);
 else{const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);while(walker.nextNode())nodes.push(walker.currentNode)}
 nodes.forEach(translateNode);
 if(root.querySelectorAll){root.querySelectorAll('[placeholder],[title],[aria-label]').forEach(el=>{
  for(const att of ['placeholder','title','aria-label']){const old=el.getAttribute(att);if(old){const next=transl(old);if(old!==next)el.setAttribute(att,next)}}
 })}
}
let translating=false;
function refresh(){if(translating)return;translating=true;try{apply(document.body);updateControls()}finally{translating=false}}
function updateControls(){document.documentElement.lang=current;document.querySelectorAll('#language-modal [data-language]').forEach(b=>{const selected=b.dataset.language===current;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});}
function setLanguage(lang){if(!['pt-BR',...LANGS].includes(lang))return;current=lang;try{localStorage.setItem(KEY,lang)}catch(_){}refresh()}
function init(){const btn=document.querySelector('#home-language-btn'),modal=document.querySelector('#language-modal');if(!modal||!btn)return;
 const open=()=>{modal.classList.remove('hidden');updateControls()};const close=()=>modal.classList.add('hidden');
 btn.addEventListener('click',open);
 modal.querySelector('#language-modal-close')?.addEventListener('click',close);
 modal.querySelector('#language-modal-done')?.addEventListener('click',close);
 modal.addEventListener('click',event=>{if(event.target===modal)close()});
 modal.querySelectorAll('[data-language]').forEach(b=>b.addEventListener('click',()=>setLanguage(b.dataset.language)));
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!modal.classList.contains('hidden'))close()});
 let pending=false;const schedule=()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;refresh()})};
 const observer=new MutationObserver(records=>{if(translating)return;if(records.some(r=>r.type==='childList'||r.type==='characterData'))schedule()});
 observer.observe(document.body,{childList:true,characterData:true,subtree:true});
 refresh();
}
window.BTLI18n={get current(){return current},setLanguage,apply:refresh,translations:MAP};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
