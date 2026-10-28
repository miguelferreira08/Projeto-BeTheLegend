/* Catálogo de 67 artes fornecidas pelo usuário. Cada imagem é PNG 512×512 com canal alfa.
 * Nenhuma arte é atribuída às Eliminatórias da Copa do Mundo.
 */
(()=>{
 const rows = [
  [
    "^Premier League$|^PL$",
    "assets/trophies/custom-2026/premier-league.png",
    "Premier League"
  ],
  [
    "Scottish Premiership|Premier League / Premiership|^Premiership$",
    "assets/trophies/custom-2026/scottish-premiership.png",
    "Scottish Premiership"
  ],
  [
    "^LaLiga$",
    "assets/trophies/custom-2026/laliga.png",
    "LaLiga"
  ],
  [
    "^Bundesliga$",
    "assets/trophies/custom-2026/bundesliga.png",
    "Bundesliga"
  ],
  [
    "^Serie A$|^Serie A \\\\(It[aá]lia\\\\)$",
    "assets/trophies/custom-2026/serie-a.png",
    "Serie A"
  ],
  [
    "^Ligue 1$",
    "assets/trophies/custom-2026/ligue-1.png",
    "Ligue 1"
  ],
  [
    "^Primeira Liga$",
    "assets/trophies/custom-2026/primeira-liga.png",
    "Primeira Liga"
  ],
  [
    "^Eredivisie$",
    "assets/trophies/custom-2026/eredivisie.png",
    "Eredivisie"
  ],
  [
    "Belgian Pro League|Jupiler Pro League",
    "assets/trophies/custom-2026/belgian-pro-league.png",
    "Belgian Pro League"
  ],
  [
    "Süper Lig|Super Lig",
    "assets/trophies/custom-2026/super-lig.png",
    "Süper Lig"
  ],
  [
    "Brasileir[aã]o|Campeonato Brasileiro S[eé]rie A",
    "assets/trophies/custom-2026/brasileirao.png",
    "Brasileirão Série A"
  ],
  [
    "Liga Profesional Argentina|^LPA$",
    "assets/trophies/custom-2026/argentina-league.png",
    "Liga Profesional Argentina"
  ],
  [
    "Primera Divisi[oó]n Uruguaia",
    "assets/trophies/custom-2026/uruguay-league.png",
    "Primera División Uruguaia"
  ],
  [
    "Primera Divisi[oó]n do Chile",
    "assets/trophies/custom-2026/chile-league.png",
    "Primera División do Chile"
  ],
  [
    "Categor[ií]a Primera A",
    "assets/trophies/custom-2026/colombia-league.png",
    "Categoría Primera A"
  ],
  [
    "^Liga MX$",
    "assets/trophies/custom-2026/liga-mx.png",
    "Liga MX"
  ],
  [
    "Major League Soccer|MLS Cup",
    "assets/trophies/custom-2026/mls.png",
    "Major League Soccer"
  ],
  [
    "J1 League|^J1L$",
    "assets/trophies/custom-2026/j1-league.png",
    "J1 League"
  ],
  [
    "Saudi Pro League|^SPL$",
    "assets/trophies/custom-2026/saudi-pro-league.png",
    "Saudi Pro League"
  ],
  [
    "Copa do Brasil|^CDB$",
    "assets/trophies/custom-2026/copa-do-brasil.png",
    "Copa do Brasil"
  ],
  [
    "^Copa Nacional(?: de .+)?$",
    "assets/trophies/custom-2026/copa-nacional.png",
    "Copa Nacional"
  ],
  [
    "^Copa Argentina$",
    "assets/trophies/custom-2026/copa-argentina.png",
    "Copa Argentina"
  ],
  [
    "Copa AUF Uruguay",
    "assets/trophies/custom-2026/copa-auf.png",
    "Copa AUF Uruguay"
  ],
  [
    "Copa Chile",
    "assets/trophies/custom-2026/copa-chile.png",
    "Copa Chile"
  ],
  [
    "Copa Colombia",
    "assets/trophies/custom-2026/copa-colombia.png",
    "Copa Colombia"
  ],
  [
    "Copa da B[eé]lgica|^CDBEL$",
    "assets/trophies/custom-2026/copa-belgica.png",
    "Copa da Bélgica"
  ],
  [
    "Copa da Turquia|Turkish Cup",
    "assets/trophies/custom-2026/copa-turquia.png",
    "Copa da Turquia"
  ],
  [
    "Copa do Imperador|Emperor.s Cup",
    "assets/trophies/custom-2026/copa-imperador.png",
    "Copa do Imperador"
  ],
  [
    "Copa do Rei|Copa del Rey",
    "assets/trophies/custom-2026/copa-rei.png",
    "Copa do Rei"
  ],
  [
    "^Coppa Italia$",
    "assets/trophies/custom-2026/coppa-italia.png",
    "Coppa Italia"
  ],
  [
    "^Coupe de France$",
    "assets/trophies/custom-2026/coupe-de-france.png",
    "Coupe de France"
  ],
  [
    "DFB-Pokal",
    "assets/trophies/custom-2026/dfb-pokal.png",
    "DFB-Pokal"
  ],
  [
    "^FA Cup$",
    "assets/trophies/custom-2026/fa-cup.png",
    "FA Cup"
  ],
  [
    "KNVB Beker",
    "assets/trophies/custom-2026/knvb-beker.png",
    "KNVB Beker"
  ],
  [
    "^King Cup$|^KC$",
    "assets/trophies/custom-2026/king-cup.png",
    "King Cup"
  ],
  [
    "Taça de Portugal",
    "assets/trophies/custom-2026/taca-portugal.png",
    "Taça de Portugal"
  ],
  [
    "U[.]?S[.]? Open Cup|^USOC$",
    "assets/trophies/custom-2026/us-open-cup.png",
    "U.S. Open Cup"
  ],
  [
    "Scottish Cup",
    "assets/trophies/custom-2026/scottish-cup.png",
    "Scottish Cup"
  ],
  [
    "FIFA World Cup|(?<!Club )World Cup|Copa do Mundo",
    "assets/trophies/custom-2026/fifa-world-cup.png",
    "FIFA World Cup"
  ],
  [
    "FIFA Club World Cup|Mundial de Clubes",
    "assets/trophies/custom-2026/club-world-cup.png",
    "FIFA Club World Cup"
  ],
  [
    "UEFA Champions League",
    "assets/trophies/custom-2026/uefa-champions-league.png",
    "UEFA Champions League"
  ],
  [
    "UEFA Europa League",
    "assets/trophies/custom-2026/uefa-europa-league.png",
    "UEFA Europa League"
  ],
  [
    "UEFA Conference League|UEFA Europa Conference League",
    "assets/trophies/custom-2026/uefa-conference-league.png",
    "UEFA Conference League"
  ],
  [
    "UEFA EURO|UEFA European Championship",
    "assets/trophies/custom-2026/uefa-euro.png",
    "UEFA EURO"
  ],
  [
    "UEFA Nations League",
    "assets/trophies/custom-2026/uefa-nations-league.png",
    "UEFA Nations League"
  ],
  [
    "CONMEBOL Libertadores|Copa Libertadores",
    "assets/trophies/custom-2026/libertadores.png",
    "CONMEBOL Libertadores"
  ],
  [
    "CONMEBOL Sul-Americana|Copa Sudamericana",
    "assets/trophies/custom-2026/sulamericana.png",
    "CONMEBOL Sul-Americana"
  ],
  [
    "CONMEBOL Copa Am[eé]rica|Copa Am[eé]rica",
    "assets/trophies/custom-2026/copa-america.png",
    "CONMEBOL Copa América"
  ],
  [
    "CONCACAF Champions Cup|^CONCACAFCC$",
    "assets/trophies/custom-2026/concacaf-champions-cup.png",
    "CONCACAF Champions Cup"
  ],
  [
    "AFC Champions League Elite|^AFCCLE$",
    "assets/trophies/custom-2026/afc-champions-elite.png",
    "AFC Champions League Elite"
  ],
  [
    "AFC Champions League Two|^AFCCLT$",
    "assets/trophies/custom-2026/afc-champions-two.png",
    "AFC Champions League Two"
  ],
  [
    "CAF Champions League",
    "assets/trophies/custom-2026/caf-champions-league.png",
    "CAF Champions League"
  ],
  [
    "OFC Champions League|^OFCCL$",
    "assets/trophies/custom-2026/ofc-champions-league.png",
    "OFC Champions League"
  ],
  [
    "UEFA Super Cup",
    "assets/trophies/custom-2026/uefa-super-cup.png",
    "UEFA Super Cup"
  ],
  [
    "Supercopa do Brasil|Supercopa Rei",
    "assets/trophies/custom-2026/supercopa-brasil.png",
    "Supercopa do Brasil"
  ],
  [
    "Supercopa da Espanha|Supercopa de Espa[nñ]a",
    "assets/trophies/custom-2026/supercopa-espanha.png",
    "Supercopa da Espanha"
  ],
  [
    "Supercoppa Italiana",
    "assets/trophies/custom-2026/supercoppa-italiana.png",
    "Supercoppa Italiana"
  ],
  [
    "FA Community Shield",
    "assets/trophies/custom-2026/fa-community-shield.png",
    "FA Community Shield"
  ],
  [
    "DFL-Supercup",
    "assets/trophies/custom-2026/dfl-supercup.png",
    "DFL-Supercup"
  ],
  [
    "Trophée des Champions",
    "assets/trophies/custom-2026/trophee-champions.png",
    "Trophée des Champions"
  ],
  [
    "Supertaça Cândido de Oliveira",
    "assets/trophies/custom-2026/supertaca-portugal.png",
    "Supertaça Cândido de Oliveira"
  ],
  [
    "Johan Cruyff Shield|Johan Cruijff Schaal",
    "assets/trophies/custom-2026/johan-cruyff-shield.png",
    "Johan Cruyff Shield"
  ],
  [
    "Finalissima",
    "assets/trophies/custom-2026/finalissima.png",
    "Finalissima"
  ],
  [
    "Bola de Ouro|Ballon d[’\\x27]Or",
    "assets/trophies/custom-2026/ballon-dor.png",
    "Bola de Ouro"
  ],
  [
    "Chuteira de Ouro|European Golden Shoe",
    "assets/trophies/custom-2026/golden-shoe.png",
    "Chuteira de Ouro"
  ],
  [
    "Melhor Jogador Jovem|Kopa|^MJJ$",
    "assets/trophies/custom-2026/kopa.png",
    "Troféu Kopa"
  ],
  [
    "Time da Temporada|TOTS|Team of the Year|^TT$",
    "assets/trophies/custom-2026/tots.png",
    "Time da Temporada"
  ]
];
 window.BTL_COMMONS_TROPHIES = [
   {test:/Eliminat[oó]rias|World Cup Qualifiers/i,src:'',file:null,page:'',author:'',license:'',note:'Sem troféu',isLocal:false},
   ...rows.map(([pattern,src,name])=>({test:new RegExp(pattern,'i'),src,file:src,page:'',author:'Fornecido pelo usuário',license:'Não verificada',note:name,isLocal:true}))
 ];
})();
