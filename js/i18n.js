/* V21 — Localização reversível, incluindo conteúdo dinâmico; tradução ao vivo opcional via servidor. */
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
const MAP_EXTRA={"MENU / SETTINGS":["MENU / SETTINGS","MENÚ / AJUSTES","MENU / PARAMÈTRES"],"MENU DE JOGO":["GAME MENU","MENÚ DEL JUEGO","MENU DU JEU"],"ESTAÇÃO DE CONTROLE":["CONTROL CENTER","CENTRO DE CONTROL","CENTRE DE CONTRÔLE"],"ESCOLHA SEU PRÓXIMO CAPÍTULO":["CHOOSE YOUR NEXT CHAPTER","ELIGE TU PRÓXIMO CAPÍTULO","CHOISISSEZ VOTRE PROCHAIN CHAPITRE"],"SAVE LOCAL ATIVO":["LOCAL SAVE ACTIVE","GUARDADO LOCAL ACTIVO","SAUVEGARDE LOCALE ACTIVE"],"CONTROLE O DESTINO. CONSTRUA A LENDA.":["CONTROL YOUR DESTINY. BUILD YOUR LEGEND.","CONTROLA TU DESTINO. CONSTRUYE LA LEYENDA.","MAÎTRISEZ VOTRE DESTIN. BÂTISSEZ VOTRE LÉGENDE."],"THE JOURNEY STARTS HERE":["THE JOURNEY STARTS HERE","LA AVENTURA EMPIEZA AQUÍ","LE PARCOURS COMMENCE ICI"],"COMEÇAR JOGO":["START GAME","INICIAR JUEGO","DÉMARRER LE JEU"],"Novo jogo":["New game","Nueva partida","Nouvelle partie"],"Iniciar outra carreira":["Start another career","Iniciar otra carrera","Commencer une autre carrière"],"✦ INICIAR OUTRA CARREIRA":["✦ START ANOTHER CAREER","✦ INICIAR OTRA CARRERA","✦ COMMENCER UNE AUTRE CARRIÈRE"],"✦ INICIAR OUTRA CARREIRA ↗":["✦ START ANOTHER CAREER ↗","✦ INICIAR OTRA CARRERA ↗","✦ COMMENCER UNE AUTRE CARRIÈRE ↗"],"Editar aparência":["Edit appearance","Editar apariencia","Modifier l'apparence"],"Escolher rosto":["Choose face","Elegir rostro","Choisir le visage"],"Sem cabelo":["Bald","Sin pelo","Sans cheveux"],"Curto":["Short","Corto","Court"],"Barba":["Beard","Barba","Barbe"],"Cabelo":["Hair","Pelo","Cheveux"],"Rosto":["Face","Rostro","Visage"],"Cor do cabelo":["Hair color","Color de pelo","Couleur des cheveux"],"Estilo do cabelo":["Hair style","Estilo de pelo","Style de cheveux"],"Preto":["Black","Negro","Noir"],"Castanho":["Brown","Castaño","Brun"],"Loiro":["Blond","Rubio","Blond"],"Ruivo":["Red","Pelirrojo","Roux"],"Olhos":["Eyes","Ojos","Yeux"],"Nariz":["Nose","Nariz","Nez"],"Boca":["Mouth","Boca","Bouche"],"Sobrancelhas":["Eyebrows","Cejas","Sourcils"],"Pele":["Skin","Piel","Peau"],"Bandeira":["Flag","Bandera","Drapeau"],"Pesquisar opção...":["Search option...","Buscar opción...","Rechercher une option..."],"Buscar opção...":["Search option...","Buscar opción...","Rechercher une option..."],"ESCOLHER ATRIBUTOS":["CHOOSE ATTRIBUTES","ELEGIR ATRIBUTOS","CHOISIR LES ATTRIBUTS"],"ATRIBUTOS":["ATTRIBUTES","ATRIBUTOS","ATTRIBUTS"],"Escolher atributos":["Choose attributes","Elegir atributos","Choisir les attributs"],"Jogador sorteado":["Drawn player","Jugador sorteado","Joueur tiré"],"Pular este jogador":["Skip this player","Saltar este jugador","Passer ce joueur"],"Usar este atributo":["Use this attribute","Usar este atributo","Utiliser cet attribut"],"Finalizar criação":["Complete creation","Completar creación","Terminer la création"],"NOVO CAPÍTULO":["NEW CHAPTER","NUEVO CAPÍTULO","NOUVEAU CHAPITRE"],"Início de carreira":["Career start","Inicio de carrera","Début de carrière"],"Partida em andamento":["Match in progress","Partido en curso","Match en cours"],"Próximo jogo":["Next match","Próximo partido","Prochain match"],"CONTINUAR PARTIDA":["CONTINUE MATCH","CONTINUAR PARTIDO","CONTINUER LE MATCH"],"Escalação":["Lineup","Alineación","Composition"],"Classificação":["Standings","Clasificación","Classement"],"Artilharia":["Top scorers","Goleadores","Buteurs"],"Assistências da liga":["League assists","Asistencias de liga","Passes décisives du championnat"],"Próximo adversário":["Next opponent","Próximo rival","Prochain adversaire"],"Jogos da temporada":["Season matches","Partidos de temporada","Matchs de la saison"],"GOLS":["GOALS","GOLES","BUTS"],"ASSIST.":["ASSISTS","ASIST.","PASSES D."],"DEFESA":["DEFENSE","DEFENSA","DÉFENSE"],"RITMO":["PACE","RITMO","VITESSE"],"FINALIZAÇÃO":["FINISHING","REMATE","FINITION"],"PASSE":["PASSING","PASE","PASSE"],"FÍSICO":["PHYSICAL","FÍSICO","PHYSIQUE"],"DRIBLE":["DRIBBLING","REGATE","DRIBBLE"],"EVENTO ALEATÓRIO":["RANDOM EVENT","EVENTO ALEATORIO","ÉVÉNEMENT ALÉATOIRE"],"EVENTO DE JOGO":["MATCH EVENT","EVENTO DE PARTIDO","ÉVÉNEMENT DE MATCH"],"EVENTO ICON":["ICON EVENT","EVENTO ICON","ÉVÉNEMENT ICON"],"Escolha sua decisão":["Make your choice","Elige tu decisión","Faites votre choix"],"MOMENTO DECISIVO":["KEY MOMENT","MOMENTO DECISIVO","MOMENT DÉCISIF"],"ENCERRAR TEMPORADA":["END SEASON","TERMINAR TEMPORADA","TERMINER LA SAISON"],"Resultado":["Result","Resultado","Résultat"],"RECEBER OFERTA":["RECEIVE OFFER","RECIBIR OFERTA","RECEVOIR UNE OFFRE"],"Nova proposta":["New offer","Nueva oferta","Nouvelle offre"],"Ofertas":["Offers","Ofertas","Offres"],"Aceitar":["Accept","Aceptar","Accepter"],"Rejeitar":["Reject","Rechazar","Refuser"],"Assinar contrato":["Sign contract","Firmar contrato","Signer le contrat"],"Sem propostas":["No offers","Sin ofertas","Aucune offre"],"Campeão":["Champion","Campeón","Champion"],"Eliminado":["Eliminated","Eliminado","Éliminé"],"Seleção":["National team","Selección","Sélection"],"Fora da lista":["Not selected","Fuera de la lista","Non sélectionné"],"FASE DE GRUPOS":["GROUP STAGE","FASE DE GRUPOS","PHASE DE GROUPES"],"FASE DE LIGA":["LEAGUE PHASE","FASE DE LIGA","PHASE DE LIGUE"],"QUARTAS DE FINAL":["QUARTERFINALS","CUARTOS DE FINAL","QUARTS DE FINALE"],"SEMIFINAL":["SEMIFINAL","SEMIFINAL","DEMI-FINALE"],"FINAL":["FINAL","FINAL","FINALE"],"Rodada":["Round","Jornada","Journée"],"Gols marcados":["Goals scored","Goles marcados","Buts marqués"],"Gols sofridos":["Goals conceded","Goles recibidos","Buts encaissés"],"Sem notícias":["No news","Sin noticias","Aucune actualité"],"Decisão registrada.":["Decision recorded.","Decisión registrada.","Décision enregistrée."],"Adversário":["Opponent","Rival","Adversaire"],"Placar":["Score","Marcador","Score"],"Jogos disputados":["Matches played","Partidos jugados","Matchs disputés"],"Nota da partida":["Match rating","Nota del partido","Note du match"],"Escolha o chute.":["Choose the shot.","Elige el disparo.","Choisissez le tir."],"Quando você vai bater?":["When will you shoot?","¿Cuándo vas a tirar ?","Quand allez-vous tirer ?"],"Chute alto":["High shot","Tiro alto","Tir haut"],"Tocar de lado":["Pass sideways","Tocar al lado","Passer sur le côté"],"Driblar o goleiro":["Dribble the keeper","Regatear al portero","Dribbler le gardien"],"Forte no ângulo esquerdo":["Powerful shot to the upper left","Fuerte a la escuadra izquierda","Frappe puissante en lucarne gauche"],"Rasteiro no canto direito":["Low shot to the bottom right","Raso al rincón derecho","Tir bas à droite"],"Cavadinha no centro":["Chip down the middle","Vaselina al centro","Panenka au centre"],"Confirme sua escolha":["Confirm your choice","Confirma tu elección","Confirmez votre choix"],"Configurações":["Settings","Configuración","Paramètres"],"Alterar idioma":["Change language","Cambiar idioma","Changer de langue"],"DESENVOLVEDOR":["DEVELOPER","DESARROLLADOR","DÉVELOPPEUR"],"Perfil":["Profile","Perfil","Profil"],"Salvar":["Save","Guardar","Enregistrer"],"SALVAR":["SAVE","GUARDAR","ENREGISTRER"],"CONTROLE":["CONTROL","CONTROL","CONTRÔLE"],"VOL.":["VOL.","VOL.","VOL."],"TRILHA SONORA":["SOUNDTRACK","BANDA SONORA","BANDE-SON"]};
Object.assign(MAP,MAP_EXTRA);
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
const excluded=['SCRIPT','STYLE','NOSCRIPT','TEXTAREA','CODE','OPTION'];
const preserveIds=new Set(['p-name','home-current-player','p-club','home-career-club','national-country','account-top-nickname','contact-name','contact-email','legacy-account-nickname']);
const originals=new WeakMap();
const lastRendered=new WeakMap();
const attributeOriginals=new WeakMap();
const lastAttrRendered=new WeakMap();
const runtimeTranslations=new Map();
const pendingTranslations=new Map();
let translationApiAvailable=true;
let workerRunning=false;
let translating=false;
const cacheKey='btl-translations-v21';
try{const record=JSON.parse(localStorage.getItem(cacheKey)||'{}');for(const [k,v] of Object.entries(record))if(typeof v==='string')runtimeTranslations.set(k,v);}catch(_){}
function sourceFor(node){
 const currentValue=node.nodeValue;
 const old=originals.get(node);
 if(old==null){originals.set(node,currentValue);return currentValue;}
 if(currentValue!==old && currentValue!==lastRendered.get(node)){
  // Game code overwrote this DOM node with new Portuguese game state.
  originals.set(node,currentValue);return currentValue;
 }
 return old;
}
function queueTranslation(text){
 if(current==='pt-BR'||!translationApiAvailable||!text||text.length<4||text.length>600||!/\p{L}/u.test(text))return;
 const key=current+'|'+text;
 if(runtimeTranslations.has(key)||pendingTranslations.has(key))return;
 pendingTranslations.set(key,{language:current,source:text});
 if(workerRunning)return;
 workerRunning=true;
 queueMicrotask(async()=>{
  while(pendingTranslations.size&&translationApiAvailable){
   const batch=[...pendingTranslations.entries()].slice(0,12);
   batch.forEach(([k])=>pendingTranslations.delete(k));
   const lang=batch[0][1].language,rows=batch.filter(([,v])=>v.language===lang);
   const texts=rows.map(([,v])=>v.source);
   if(!texts.length)continue;
   try{
    const response=await fetch('/api/translate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({language:lang,texts}),signal:AbortSignal.timeout(7500)});
    if(!response.ok){translationApiAvailable=false;break;}
    const data=await response.json();
    if(!Array.isArray(data.translations)||data.translations.length!==texts.length){translationApiAvailable=false;break;}
    for(let i=0;i<texts.length;i++)if(data.translations[i])runtimeTranslations.set(lang+'|'+texts[i],String(data.translations[i]));
    // Keep the local cache bounded to avoid unbounded browser storage usage.
    try{localStorage.setItem(cacheKey,JSON.stringify(Object.fromEntries([...runtimeTranslations].slice(-600))))}catch(_){}
    if(current===lang)refresh();
   }catch(_){translationApiAvailable=false;break;}
  }
  pendingTranslations.clear();workerRunning=false;
 });
}
function translateText(value){
 const src=String(value||''),s=src.trim();if(!s)return src;
 const output=transl(src);
 if(output!==src||current==='pt-BR')return output;
 const key=current+'|'+s;
 const cached=runtimeTranslations.get(key);
 if(cached)return src.replace(s,cached);
 // Only the native game interface; never submit player-entered input values.
 queueTranslation(s);
 return src;
}
function translateNode(node){
 if(node.nodeType!==Node.TEXT_NODE||!node.parentElement)return;
 const parent=node.parentElement;
 if(excluded.includes(parent.tagName)||parent.closest('[data-no-i18n],[contenteditable="true"]'))return;
 if(preserveIds.has(parent.id))return;
 const src=sourceFor(node);
 const translated=translateText(src);
 if(node.nodeValue!==translated)node.nodeValue=translated;
 lastRendered.set(node,translated);
}
function translateAttr(element,attr){
 if(!element.hasAttribute(attr))return;
 let store=attributeOriginals.get(element);if(!store){store=new Map();attributeOriginals.set(element,store)}
 const currentValue=element.getAttribute(attr),prior=store.get(attr);
 let rendered=lastAttrRendered.get(element);if(!rendered){rendered=new Map();lastAttrRendered.set(element,rendered)}
 if(prior==null||(currentValue!==prior && currentValue!==rendered.get(attr))){store.set(attr,currentValue)}
 const original=store.get(attr),next=translateText(original);
 if(currentValue!==next)element.setAttribute(attr,next);
 rendered.set(attr,next);
}
function apply(root=document.body){if(!root)return;
 const nodes=[];
 if(root.nodeType===Node.TEXT_NODE)nodes.push(root);
 else{const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);while(walker.nextNode())nodes.push(walker.currentNode)}
 nodes.forEach(translateNode);
 if(root.querySelectorAll)root.querySelectorAll('[placeholder],[title],[aria-label]').forEach(el=>{
  if(el.closest('[data-no-i18n]'))return;
  for(const att of ['placeholder','title','aria-label'])translateAttr(el,att);
 });
}
function updateControls(){
 document.documentElement.lang=current;
 document.querySelectorAll('#language-modal [data-language]').forEach(b=>{
  const selected=b.dataset.language===current;
  b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));
 });
}
function refresh(){if(translating)return;translating=true;try{apply(document.body);updateControls()}finally{translating=false}}
function setLanguage(lang){
 if(!['pt-BR',...LANGS].includes(lang))return;
 current=lang;translationApiAvailable=true;
 try{localStorage.setItem(KEY,lang)}catch(_){}
 refresh();
}
function init(){
 const btn=document.querySelector('#home-language-btn'),modal=document.querySelector('#language-modal');if(!modal||!btn)return;
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
window.BTLI18n={get current(){return current},setLanguage,apply:refresh,translations:MAP,translationStatus:()=>({providerAvailable:translationApiAvailable,cached:runtimeTranslations.size,pending:pendingTranslations.size})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
