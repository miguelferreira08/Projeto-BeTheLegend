/* BTL · nomes fictícios culturalmente plausíveis, determinísticos por ID.
 * Nenhum nome gerado representa identidade verificada/real de atleta.
 * O identificador do atleta NÃO depende do nome exibido.
 */
(function(root,factory){
  const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.BTLPlayerNames=api;
})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
  const sets={
    PT:[['Tiago','João','Diogo','Rúben','Gonçalo','Tomás','Afonso','Rodrigo','Martim','Francisco','Miguel','Nuno','Rafael','Leandro'],['Ferreira','Silva','Pereira','Costa','Oliveira','Sousa','Rodrigues','Mendes','Carvalho','Lopes','Rocha','Teixeira','Martins','Fonseca']],
    BR:[['Caio','Gabriel','Matheus','Lucas','Pedro','Gustavo','Vinícius','João','Rafael','Thiago','Felipe','Eduardo','Bruno','André'],['Silva','Santos','Oliveira','Souza','Pereira','Almeida','Costa','Rodrigues','Gomes','Barbosa','Ribeiro','Lima','Araújo','Fernandes']],
    ES:[['Álvaro','Iker','Hugo','Pablo','Javier','Sergio','Diego','Marcos','Alejandro','Adrián','Dani','Raúl','Iván','Nicolás'],['García','Fernández','López','Martínez','Sánchez','Pérez','González','Romero','Ruiz','Navarro','Torres','Moreno','Vargas','Jiménez']],
    AR:[['Lautaro','Facundo','Nicolás','Santiago','Matías','Franco','Agustín','Joaquín','Thiago','Enzo','Benjamín','Federico','Valentín','Bruno'],['Fernández','Pérez','Gómez','Rodríguez','López','González','Díaz','Martínez','Romero','Álvarez','Sosa','Herrera','Acosta','Suárez']],
    UY:[['Agustín','Federico','Santiago','Facundo','Joaquín','Matías','Sebastián','Martín','Nicolás','Luciano','Emiliano','Bruno'],['Rodríguez','Fernández','Pereira','Suárez','Silva','González','García','Martínez','Cabrera','Olivera','Núñez','Torres']],
    ENG:[['Oliver','Harry','Jack','George','Charlie','Alfie','Thomas','Jacob','James','Ethan','Archie','Noah','Leo','William'],['Smith','Johnson','Taylor','Brown','Williams','Jones','Wilson','Walker','Wright','Robinson','Thompson','Harrison','Clarke','Foster']],
    SCO:[['Callum','Finlay','Lewis','Liam','Euan','Jamie','Ross','Cameron','Hamish','Ryan','Fraser','Archie'],['MacDonald','Campbell','Stewart','Murray','McKenzie','Fraser','Robertson','MacLeod','Wilson','Graham','Anderson','Ferguson']],
    FR:[['Théo','Lucas','Hugo','Nathan','Enzo','Mathis','Jules','Raphaël','Antoine','Maxime','Louis','Clément','Noé','Alexis'],['Martin','Bernard','Dubois','Moreau','Laurent','Lefebvre','Michel','Simon','Robert','Fontaine','Girard','Roux','Lemaire','Mercier']],
    DE:[['Lukas','Felix','Jonas','Leon','Finn','Paul','Ben','Maximilian','Tim','Jakob','Julian','Nico','Tobias','Emil'],['Müller','Schmidt','Schneider','Fischer','Weber','Wagner','Becker','Hoffmann','Schulz','Koch','Richter','Wolf','Neumann','Hartmann']],
    IT:[['Lorenzo','Matteo','Alessandro','Leonardo','Marco','Gabriele','Tommaso','Andrea','Riccardo','Niccolò','Federico','Davide','Edoardo','Pietro'],['Rossi','Russo','Ferrari','Esposito','Bianchi','Romano','Colombo','Ricci','Marino','Greco','Bruno','Moretti','Gallo','Conti']],
    NL:[['Daan','Sem','Lars','Jesse','Milan','Noah','Luuk','Bram','Thijs','Finn','Koen','Jens','Jasper','Joep'],['de Jong','Jansen','de Vries','van Dijk','Bakker','Visser','Smit','Meijer','de Boer','Mulder','Bos','Vos','Vermeer','van der Meer']],
    BE:[['Arthur','Noah','Louis','Lucas','Liam','Adam','Milan','Jules','Elias','Mathis','Simon','Victor'],['Peeters','Janssens','Maes','Jacobs','Mertens','Willems','Claes','Dubois','Lambert','Martin','De Smet','Lemaire']],
    TR:[['Emir','Kerem','Arda','Efe','Mert','Yusuf','Can','Barış','Oğuz','Burak','Deniz','Eren','Berk','Alper'],['Yılmaz','Kaya','Demir','Çelik','Şahin','Yıldız','Yıldırım','Öztürk','Aydın','Arslan','Koç','Kılıç','Polat','Erdoğan']],
    JP:[['Haruto','Yuto','Sota','Ren','Kaito','Riku','Minato','Daiki','Hayato','Takumi','Sho','Ryota','Naoki','Kenta'],['Sato','Suzuki','Takahashi','Tanaka','Watanabe','Ito','Yamamoto','Nakamura','Kobayashi','Kato','Yoshida','Yamada','Sasaki','Matsumoto']],
    KR:[['Min-jun','Seo-jun','Ji-ho','Do-yun','Hyun-woo','Jun-seo','Si-woo','Tae-yang','Joon-ho','Seong-min','Ji-hun','Woo-jin'],['Kim','Lee','Park','Choi','Jung','Kang','Cho','Yoon','Jang','Lim','Han','Oh']],
    CN:[['Wei','Jun','Hao','Ming','Lei','Cheng','Jian','Bo','Rui','Yu','Chen','Tao'],['Wang','Li','Zhang','Liu','Chen','Yang','Huang','Zhao','Wu','Zhou','Xu','Sun']],
    SA:[['Omar','Fahad','Abdullah','Saud','Yousef','Khalid','Nasser','Sultan','Salem','Ahmed','Ibrahim','Majed'],['Al-Harbi','Al-Qahtani','Al-Otaibi','Al-Shammari','Al-Dossari','Al-Ghamdi','Al-Mutairi','Al-Faraj','Al-Zahrani','Al-Shehri','Al-Anazi','Al-Rashid']],
    MA:[['Youssef','Ayoub','Hamza','Achraf','Yassine','Amine','Mehdi','Sofiane','Ilyas','Ismail','Omar','Anas'],['El Amrani','Benali','Bennani','El Idrissi','Bouzidi','Haddad','Tazi','Alaoui','Berrada','Cherkaoui','Amrani','Rachidi']],
    NG:[['Chinedu','Emeka','Tobi','Chukwu','Ibrahim','Samuel','David','Victor','Daniel','Kelechi','Uche','Segun'],['Okafor','Adeyemi','Eze','Ibrahim','Adebayo','Nwosu','Onyekachi','Obi','Okechukwu','Olawale','Umeh','Bello']],
    SN:[['Moussa','Ibrahima','Cheikh','Ousmane','Mamadou','Abdoulaye','Pape','Aliou','Boubacar','Amadou','Saliou','Malick'],['Diop','Ndiaye','Fall','Sow','Sarr','Ba','Diallo','Gueye','Faye','Cissé','Seck','Ndour']],
    EG:[['Omar','Ahmed','Mahmoud','Youssef','Mohamed','Karim','Mostafa','Hassan','Tarek','Amr','Ibrahim','Ziad'],['Hassan','Ali','Ibrahim','Mahmoud','Saleh','Fathi','Sayed','Nabil','Farouk','Ezzat','Hamdy','Mansour']],
    US:[['Ethan','Mason','Logan','Noah','Liam','Jackson','Caleb','Elijah','Aiden','Lucas','Owen','Carter'],['Miller','Anderson','Davis','Martin','Moore','Harris','Clark','Lewis','Allen','Young','King','Turner']],
    MX:[['Santiago','Diego','Emiliano','Sebastián','Mateo','Emilio','Leonardo','Ángel','Gael','José','Andrés','Luis'],['Hernández','García','Martínez','López','González','Ramírez','Torres','Flores','Rivera','Morales','Vargas','Castillo']],
    CO:[['Santiago','Juan','Andrés','Sebastián','Julián','Felipe','Mateo','Nicolás','Daniel','Camilo','David','Samuel'],['Rodríguez','García','Martínez','Gómez','López','Hernández','Moreno','Rojas','Castro','Vargas','Torres','Ramírez']],
    CL:[['Benjamín','Vicente','Matías','Tomás','Agustín','Cristóbal','Joaquín','Ignacio','Felipe','Diego','Sebastián','Nicolás'],['González','Muñoz','Rojas','Díaz','Pérez','Soto','Contreras','Silva','Morales','Sepúlveda','Fuentes','Castillo']],
    EC:[['Mateo','Josué','Jhon','Andrés','Kevin','Bryan','Luis','Jefferson','Carlos','David','Michael','Ángel'],['Caicedo','Preciado','Valencia','Cortez','Quintero','Mina','Mendoza','Vera','Mero','Cevallos','Chávez','Paredes']],
    PY:[['Rodrigo','Miguel','Diego','Hugo','José','Ángel','Lucas','Matías','Federico','Iván','César','Bruno'],['González','Giménez','Benítez','Villalba','Martínez','Fernández','Romero','Cardozo','Vera','López','Ayala','Cáceres']],
    PE:[['Renato','Luis','José','Carlos','Miguel','Diego','André','Sergio','Jorge','Marco','Gabriel','Jean'],['Quispe','Flores','García','Sánchez','Torres','Vargas','Rojas','Mendoza','Castillo','Ramírez','Paredes','Zambrano']],
    GR:[['Giorgos','Nikos','Dimitris','Kostas','Panagiotis','Alexandros','Stavros','Christos','Vasilis','Giannis'],['Papadopoulos','Nikolaidis','Georgiou','Ioannou','Dimitriou','Konstantinou','Karagiannis','Alexiou','Pappas','Stavridis']],
    PL:[['Jakub','Jan','Antoni','Filip','Szymon','Wojciech','Piotr','Mateusz','Kacper','Adam','Michał','Bartosz'],['Kowalski','Nowak','Wiśniewski','Wójcik','Kowalczyk','Kamiński','Lewandowski','Zieliński','Szymański','Woźniak','Jankowski','Mazur']],
    HR:[['Luka','Ivan','Marko','Petar','Ante','Matej','Josip','Filip','Nikola','Dario','Karlo','Domagoj'],['Horvat','Kovačević','Babić','Marić','Novak','Jurić','Knežević','Vuković','Perić','Šimunić','Božić','Vidović']],
    RS:[['Luka','Nikola','Stefan','Marko','Filip','Aleksandar','Nemanja','Dušan','Miloš','Vuk','Uroš','Mihajlo'],['Jovanović','Petrović','Nikolić','Đorđević','Marković','Stojanović','Ilić','Pavlović','Todorović','Kostić','Đurić','Popović']],
    NO:[['Emil','Noah','Jakob','Oliver','Magnus','Sander','Oskar','Marius','Henrik','Elias','Mathias','Kristian'],['Hansen','Johansen','Olsen','Larsen','Andersen','Pedersen','Nilsen','Kristiansen','Berg','Haugen','Solberg','Eriksen']],
    SE:[['Oscar','William','Lucas','Elias','Hugo','Oliver','Liam','Emil','Noah','Albin','Viktor','Axel'],['Andersson','Johansson','Karlsson','Nilsson','Eriksson','Larsson','Olsson','Persson','Svensson','Gustafsson','Lindberg','Bergström']],
    DK:[['William','Oscar','Noah','Oliver','Carl','Alfred','Emil','Viktor','Valdemar','Anton','Frederik','Lucas'],['Jensen','Nielsen','Hansen','Pedersen','Andersen','Christensen','Larsen','Sørensen','Rasmussen','Petersen','Madsen','Kristensen']],
    CH:[['Noah','Liam','Luca','Leon','Matteo','Elias','Julian','Nico','Jonas','David','Simon','Emil'],['Müller','Meier','Schmid','Keller','Weber','Huber','Moser','Steiner','Fischer','Brunner','Gerber','Baumann']],
    AT:[['Lukas','Felix','Maximilian','David','Jakob','Paul','Jonas','Matthias','Elias','Sebastian','Leon','Simon'],['Gruber','Huber','Bauer','Wagner','Müller','Pichler','Steiner','Moser','Mayer','Hofer','Berger','Schmid']],
    RU:[['Ivan','Dmitri','Aleksandr','Artem','Kirill','Nikita','Maksim','Mikhail','Pavel','Andrei'],['Ivanov','Petrov','Sokolov','Smirnov','Kuznetsov','Popov','Volkov','Orlov','Morozov','Fedorov']],
    UA:[['Andriy','Oleksandr','Maksym','Danylo','Bohdan','Mykhailo','Artem','Ivan','Dmytro','Vladyslav'],['Shevchenko','Kovalenko','Bondarenko','Tkachenko','Kravchenko','Melnyk','Boyko','Koval','Moroz','Savchenko']],
    AU:[['Oliver','Jack','Noah','William','Thomas','Liam','James','Henry','Charlie','Ethan','Cooper','Leo'],['Smith','Jones','Williams','Brown','Wilson','Taylor','Martin','Thompson','White','Walker','Harris','Roberts']],
    ZZ:[['Alex','Daniel','Adrian','Leo','Gabriel','Samuel','Lucas','Victor','Elias','Noah','David','Nicolas','Rafael','Marco'],['Costa','Martin','Silva','Anders','Santos','García','Mendes','Lopez','Hassan','Romero','Lima','Ferreira','Müller','Torres']]
  };
  const aliases={GB:'ENG',UK:'ENG',EN:'ENG',BRA:'BR',POR:'PT',ESP:'ES',GER:'DE',FRA:'FR',ITA:'IT',NED:'NL',NLD:'NL',TUR:'TR',JPN:'JP',KOR:'KR',CHI:'CN',KSA:'SA',ARG:'AR',URU:'UY',MEX:'MX',COL:'CO',USA:'US',NGA:'NG',MAR:'MA',EGY:'EG',SEN:'SN',CRO:'HR',POL:'PL',SWE:'SE',DEN:'DK',NOR:'NO',SUI:'CH',AUT:'AT',GRE:'GR',SRB:'RS',RUS:'RU',UKR:'UA',CHN:'CN',BEL:'BE',SCO:'SCO',WAL:'ENG',NIR:'ENG',ECU:'EC',PAR:'PY',PER:'PE',CHL:'CL',AUS:'AU',IRL:'ENG',QA:'SA',BO:'ES',VE:'ES'};
  const groupCountries={ES:['BO','VE','CR','GT','HN','SV','PA','DO','CU','NI'],PT:['AO','MZ','CV','GW'],FR:['CM','CI','CD','ML','GN','BJ','TG','BF','GA'],ENG:['NZ','CA','IE'],SA:['AE','BH','KW','OM','IQ','JO','SY','LB'],NG:['GH','GM','LR','SL'],RU:['BY','KZ'],RS:['BA','ME'],HR:['SI'],NL:['SR'],SE:['FI'],TR:['AZ'],AR:[]};
  const map={...aliases};for(const [from,codes] of Object.entries(groupCountries))for(const c of codes)map[c]=from;
  function normalCode(value){const code=String(value||'').trim().toUpperCase();return map[code]||code;}
  function hash(str){let n=2166136261;for(const c of String(str)){n^=c.charCodeAt(0);n=Math.imul(n,16777619)}return n>>>0;}
  function generate(id,code='',slot=0){const key=String(id||'athlete'),nation=normalCode(code);const [first,last]=sets[nation]||sets.ZZ;const serial=Math.max(0,Number(slot)||0);const rosterKey=/:(?:[0-9]+)$/.test(key)?key.replace(/:[0-9]+$/,''):key;const idx=(hash(rosterKey+':'+nation)+serial)%(first.length*last.length);return first[idx%first.length]+' '+last[Math.floor(idx/first.length)];}
  function needsName(player){return !!player&&(player.rosterPlaceholder===true||/^(?:atleta simulado|jogador simulado|simulated player)\s*\d+$/i.test(String(player.name||'')));}
  return {generate,needsName,normalCode};
});
