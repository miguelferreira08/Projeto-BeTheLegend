const COUNTRIES = [
  {
    "code": "AF",
    "name": "Afeganistão",
    "apiName": "Afghanistan"
  },
  {
    "code": "AL",
    "name": "Albânia",
    "apiName": "Albania"
  },
  {
    "code": "DE",
    "name": "Alemanha",
    "apiName": "Germany"
  },
  {
    "code": "AD",
    "name": "Andorra",
    "apiName": "Andorra"
  },
  {
    "code": "AO",
    "name": "Angola",
    "apiName": "Angola"
  },
  {
    "code": "AI",
    "name": "Anguila",
    "apiName": "Anguilla"
  },
  {
    "code": "AQ",
    "name": "Antártida",
    "apiName": "Antarctica"
  },
  {
    "code": "AG",
    "name": "Antígua e Barbuda",
    "apiName": "Antigua & Barbuda"
  },
  {
    "code": "AR",
    "name": "Argentina",
    "apiName": "Argentina"
  },
  {
    "code": "DZ",
    "name": "Argélia",
    "apiName": "Algeria"
  },
  {
    "code": "AM",
    "name": "Armênia",
    "apiName": "Armenia"
  },
  {
    "code": "AW",
    "name": "Aruba",
    "apiName": "Aruba"
  },
  {
    "code": "SA",
    "name": "Arábia Saudita",
    "apiName": "Saudi Arabia"
  },
  {
    "code": "AU",
    "name": "Austrália",
    "apiName": "Australia"
  },
  {
    "code": "AZ",
    "name": "Azerbaijão",
    "apiName": "Azerbaijan"
  },
  {
    "code": "BS",
    "name": "Bahamas",
    "apiName": "Bahamas"
  },
  {
    "code": "BD",
    "name": "Bangladesh",
    "apiName": "Bangladesh"
  },
  {
    "code": "BB",
    "name": "Barbados",
    "apiName": "Barbados"
  },
  {
    "code": "BH",
    "name": "Barein",
    "apiName": "Bahrain"
  },
  {
    "code": "BZ",
    "name": "Belize",
    "apiName": "Belize"
  },
  {
    "code": "BJ",
    "name": "Benin",
    "apiName": "Benin"
  },
  {
    "code": "BM",
    "name": "Bermudas",
    "apiName": "Bermuda"
  },
  {
    "code": "BY",
    "name": "Bielorrússia",
    "apiName": "Belarus"
  },
  {
    "code": "BO",
    "name": "Bolívia",
    "apiName": "Bolivia"
  },
  {
    "code": "BW",
    "name": "Botsuana",
    "apiName": "Botswana"
  },
  {
    "code": "BR",
    "name": "Brasil",
    "apiName": "Brazil"
  },
  {
    "code": "BN",
    "name": "Brunei",
    "apiName": "Brunei"
  },
  {
    "code": "BG",
    "name": "Bulgária",
    "apiName": "Bulgaria"
  },
  {
    "code": "BF",
    "name": "Burquina Faso",
    "apiName": "Burkina Faso"
  },
  {
    "code": "BI",
    "name": "Burundi",
    "apiName": "Burundi"
  },
  {
    "code": "BT",
    "name": "Butão",
    "apiName": "Bhutan"
  },
  {
    "code": "BE",
    "name": "Bélgica",
    "apiName": "Belgium"
  },
  {
    "code": "BA",
    "name": "Bósnia e Herzegovina",
    "apiName": "Bosnia & Herzegovina"
  },
  {
    "code": "CV",
    "name": "Cabo Verde",
    "apiName": "Cape Verde"
  },
  {
    "code": "CM",
    "name": "Camarões",
    "apiName": "Cameroon"
  },
  {
    "code": "KH",
    "name": "Camboja",
    "apiName": "Cambodia"
  },
  {
    "code": "CA",
    "name": "Canadá",
    "apiName": "Canada"
  },
  {
    "code": "QA",
    "name": "Catar",
    "apiName": "Qatar"
  },
  {
    "code": "KZ",
    "name": "Cazaquistão",
    "apiName": "Kazakhstan"
  },
  {
    "code": "TD",
    "name": "Chade",
    "apiName": "Chad"
  },
  {
    "code": "CL",
    "name": "Chile",
    "apiName": "Chile"
  },
  {
    "code": "CN",
    "name": "China",
    "apiName": "China"
  },
  {
    "code": "CY",
    "name": "Chipre",
    "apiName": "Cyprus"
  },
  {
    "code": "VA",
    "name": "Cidade do Vaticano",
    "apiName": "Vatican City"
  },
  {
    "code": "CO",
    "name": "Colômbia",
    "apiName": "Colombia"
  },
  {
    "code": "KM",
    "name": "Comores",
    "apiName": "Comoros"
  },
  {
    "code": "CD",
    "name": "Congo - Kinshasa",
    "apiName": "Congo - Kinshasa"
  },
  {
    "code": "KP",
    "name": "Coreia do Norte",
    "apiName": "North Korea"
  },
  {
    "code": "KR",
    "name": "Coreia do Sul",
    "apiName": "South Korea"
  },
  {
    "code": "CI",
    "name": "Costa do Marfim",
    "apiName": "Côte d’Ivoire"
  },
  {
    "code": "CR",
    "name": "Costa Rica",
    "apiName": "Costa Rica"
  },
  {
    "code": "HR",
    "name": "Croácia",
    "apiName": "Croatia"
  },
  {
    "code": "CU",
    "name": "Cuba",
    "apiName": "Cuba"
  },
  {
    "code": "CW",
    "name": "Curaçao",
    "apiName": "Curaçao"
  },
  {
    "code": "DK",
    "name": "Dinamarca",
    "apiName": "Denmark"
  },
  {
    "code": "DJ",
    "name": "Djibuti",
    "apiName": "Djibouti"
  },
  {
    "code": "DM",
    "name": "Dominica",
    "apiName": "Dominica"
  },
  {
    "code": "EG",
    "name": "Egito",
    "apiName": "Egypt"
  },
  {
    "code": "SV",
    "name": "El Salvador",
    "apiName": "El Salvador"
  },
  {
    "code": "AE",
    "name": "Emirados Árabes Unidos",
    "apiName": "United Arab Emirates"
  },
  {
    "code": "EC",
    "name": "Equador",
    "apiName": "Ecuador"
  },
  {
    "code": "ER",
    "name": "Eritreia",
    "apiName": "Eritrea"
  },
  {
    "code": "SCO",
    "name": "Escócia",
    "apiName": "Scotland"
  },
  {
    "code": "SK",
    "name": "Eslováquia",
    "apiName": "Slovakia"
  },
  {
    "code": "SI",
    "name": "Eslovênia",
    "apiName": "Slovenia"
  },
  {
    "code": "ES",
    "name": "Espanha",
    "apiName": "Spain"
  },
  {
    "code": "SZ",
    "name": "Essuatíni",
    "apiName": "Eswatini"
  },
  {
    "code": "US",
    "name": "Estados Unidos",
    "apiName": "United States"
  },
  {
    "code": "EE",
    "name": "Estônia",
    "apiName": "Estonia"
  },
  {
    "code": "ET",
    "name": "Etiópia",
    "apiName": "Ethiopia"
  },
  {
    "code": "FJ",
    "name": "Fiji",
    "apiName": "Fiji"
  },
  {
    "code": "PH",
    "name": "Filipinas",
    "apiName": "Philippines"
  },
  {
    "code": "FI",
    "name": "Finlândia",
    "apiName": "Finland"
  },
  {
    "code": "FR",
    "name": "França",
    "apiName": "France"
  },
  {
    "code": "GA",
    "name": "Gabão",
    "apiName": "Gabon"
  },
  {
    "code": "GH",
    "name": "Gana",
    "apiName": "Ghana"
  },
  {
    "code": "GE",
    "name": "Geórgia",
    "apiName": "Georgia"
  },
  {
    "code": "GI",
    "name": "Gibraltar",
    "apiName": "Gibraltar"
  },
  {
    "code": "GD",
    "name": "Granada",
    "apiName": "Grenada"
  },
  {
    "code": "GL",
    "name": "Groenlândia",
    "apiName": "Greenland"
  },
  {
    "code": "GR",
    "name": "Grécia",
    "apiName": "Greece"
  },
  {
    "code": "GP",
    "name": "Guadalupe",
    "apiName": "Guadeloupe"
  },
  {
    "code": "GU",
    "name": "Guam",
    "apiName": "Guam"
  },
  {
    "code": "GT",
    "name": "Guatemala",
    "apiName": "Guatemala"
  },
  {
    "code": "GG",
    "name": "Guernsey",
    "apiName": "Guernsey"
  },
  {
    "code": "GY",
    "name": "Guiana",
    "apiName": "Guyana"
  },
  {
    "code": "GF",
    "name": "Guiana Francesa",
    "apiName": "French Guiana"
  },
  {
    "code": "GN",
    "name": "Guiné",
    "apiName": "Guinea"
  },
  {
    "code": "GQ",
    "name": "Guiné Equatorial",
    "apiName": "Equatorial Guinea"
  },
  {
    "code": "GW",
    "name": "Guiné-Bissau",
    "apiName": "Guinea-Bissau"
  },
  {
    "code": "GM",
    "name": "Gâmbia",
    "apiName": "Gambia"
  },
  {
    "code": "HT",
    "name": "Haiti",
    "apiName": "Haiti"
  },
  {
    "code": "HN",
    "name": "Honduras",
    "apiName": "Honduras"
  },
  {
    "code": "HK",
    "name": "Hong Kong, RAE da China",
    "apiName": "Hong Kong SAR China"
  },
  {
    "code": "HU",
    "name": "Hungria",
    "apiName": "Hungary"
  },
  {
    "code": "BV",
    "name": "Ilha Bouvet",
    "apiName": "Bouvet Island"
  },
  {
    "code": "CX",
    "name": "Ilha Christmas",
    "apiName": "Christmas Island"
  },
  {
    "code": "IM",
    "name": "Ilha de Man",
    "apiName": "Isle of Man"
  },
  {
    "code": "NF",
    "name": "Ilha Norfolk",
    "apiName": "Norfolk Island"
  },
  {
    "code": "AX",
    "name": "Ilhas Aland",
    "apiName": "Åland Islands"
  },
  {
    "code": "KY",
    "name": "Ilhas Cayman",
    "apiName": "Cayman Islands"
  },
  {
    "code": "CC",
    "name": "Ilhas Cocos (Keeling)",
    "apiName": "Cocos (Keeling) Islands"
  },
  {
    "code": "CK",
    "name": "Ilhas Cook",
    "apiName": "Cook Islands"
  },
  {
    "code": "FO",
    "name": "Ilhas Faroé",
    "apiName": "Faroe Islands"
  },
  {
    "code": "GS",
    "name": "Ilhas Geórgia do Sul e Sandwich do Sul",
    "apiName": "South Georgia & South Sandwich Islands"
  },
  {
    "code": "HM",
    "name": "Ilhas Heard e McDonald",
    "apiName": "Heard & McDonald Islands"
  },
  {
    "code": "FK",
    "name": "Ilhas Malvinas",
    "apiName": "Falkland Islands"
  },
  {
    "code": "MP",
    "name": "Ilhas Marianas do Norte",
    "apiName": "Northern Mariana Islands"
  },
  {
    "code": "MH",
    "name": "Ilhas Marshall",
    "apiName": "Marshall Islands"
  },
  {
    "code": "UM",
    "name": "Ilhas Menores Distantes dos EUA",
    "apiName": "U.S. Outlying Islands"
  },
  {
    "code": "PN",
    "name": "Ilhas Pitcairn",
    "apiName": "Pitcairn Islands"
  },
  {
    "code": "SB",
    "name": "Ilhas Salomão",
    "apiName": "Solomon Islands"
  },
  {
    "code": "TC",
    "name": "Ilhas Turcas e Caicos",
    "apiName": "Turks & Caicos Islands"
  },
  {
    "code": "VI",
    "name": "Ilhas Virgens Americanas",
    "apiName": "U.S. Virgin Islands"
  },
  {
    "code": "VG",
    "name": "Ilhas Virgens Britânicas",
    "apiName": "British Virgin Islands"
  },
  {
    "code": "ID",
    "name": "Indonésia",
    "apiName": "Indonesia"
  },
  {
    "code": "ENG",
    "name": "Inglaterra",
    "apiName": "England"
  },
  {
    "code": "IQ",
    "name": "Iraque",
    "apiName": "Iraq"
  },
  {
    "code": "IE",
    "name": "Irlanda",
    "apiName": "Ireland"
  },
  {
    "code": "NIR",
    "name": "Irlanda do Norte",
    "apiName": "Northern Ireland"
  },
  {
    "code": "IR",
    "name": "Irã",
    "apiName": "Iran"
  },
  {
    "code": "IS",
    "name": "Islândia",
    "apiName": "Iceland"
  },
  {
    "code": "IL",
    "name": "Israel",
    "apiName": "Israel"
  },
  {
    "code": "IT",
    "name": "Itália",
    "apiName": "Italy"
  },
  {
    "code": "YE",
    "name": "Iêmen",
    "apiName": "Yemen"
  },
  {
    "code": "JM",
    "name": "Jamaica",
    "apiName": "Jamaica"
  },
  {
    "code": "JP",
    "name": "Japão",
    "apiName": "Japan"
  },
  {
    "code": "JE",
    "name": "Jersey",
    "apiName": "Jersey"
  },
  {
    "code": "JO",
    "name": "Jordânia",
    "apiName": "Jordan"
  },
  {
    "code": "KW",
    "name": "Kuwait",
    "apiName": "Kuwait"
  },
  {
    "code": "LA",
    "name": "Laos",
    "apiName": "Laos"
  },
  {
    "code": "LS",
    "name": "Lesoto",
    "apiName": "Lesotho"
  },
  {
    "code": "LV",
    "name": "Letônia",
    "apiName": "Latvia"
  },
  {
    "code": "LR",
    "name": "Libéria",
    "apiName": "Liberia"
  },
  {
    "code": "LI",
    "name": "Liechtenstein",
    "apiName": "Liechtenstein"
  },
  {
    "code": "LT",
    "name": "Lituânia",
    "apiName": "Lithuania"
  },
  {
    "code": "LU",
    "name": "Luxemburgo",
    "apiName": "Luxembourg"
  },
  {
    "code": "LB",
    "name": "Líbano",
    "apiName": "Lebanon"
  },
  {
    "code": "LY",
    "name": "Líbia",
    "apiName": "Libya"
  },
  {
    "code": "MO",
    "name": "Macau, RAE da China",
    "apiName": "Macao SAR China"
  },
  {
    "code": "MK",
    "name": "Macedônia do Norte",
    "apiName": "North Macedonia"
  },
  {
    "code": "MG",
    "name": "Madagascar",
    "apiName": "Madagascar"
  },
  {
    "code": "MW",
    "name": "Malaui",
    "apiName": "Malawi"
  },
  {
    "code": "MV",
    "name": "Maldivas",
    "apiName": "Maldives"
  },
  {
    "code": "ML",
    "name": "Mali",
    "apiName": "Mali"
  },
  {
    "code": "MT",
    "name": "Malta",
    "apiName": "Malta"
  },
  {
    "code": "MY",
    "name": "Malásia",
    "apiName": "Malaysia"
  },
  {
    "code": "MA",
    "name": "Marrocos",
    "apiName": "Morocco"
  },
  {
    "code": "MQ",
    "name": "Martinica",
    "apiName": "Martinique"
  },
  {
    "code": "MR",
    "name": "Mauritânia",
    "apiName": "Mauritania"
  },
  {
    "code": "MU",
    "name": "Maurício",
    "apiName": "Mauritius"
  },
  {
    "code": "YT",
    "name": "Mayotte",
    "apiName": "Mayotte"
  },
  {
    "code": "MM",
    "name": "Mianmar (Birmânia)",
    "apiName": "Myanmar (Burma)"
  },
  {
    "code": "FM",
    "name": "Micronésia",
    "apiName": "Micronesia"
  },
  {
    "code": "MD",
    "name": "Moldávia",
    "apiName": "Moldova"
  },
  {
    "code": "MN",
    "name": "Mongólia",
    "apiName": "Mongolia"
  },
  {
    "code": "ME",
    "name": "Montenegro",
    "apiName": "Montenegro"
  },
  {
    "code": "MS",
    "name": "Montserrat",
    "apiName": "Montserrat"
  },
  {
    "code": "MZ",
    "name": "Moçambique",
    "apiName": "Mozambique"
  },
  {
    "code": "MX",
    "name": "México",
    "apiName": "Mexico"
  },
  {
    "code": "MC",
    "name": "Mônaco",
    "apiName": "Monaco"
  },
  {
    "code": "NA",
    "name": "Namíbia",
    "apiName": "Namibia"
  },
  {
    "code": "NR",
    "name": "Nauru",
    "apiName": "Nauru"
  },
  {
    "code": "NP",
    "name": "Nepal",
    "apiName": "Nepal"
  },
  {
    "code": "NI",
    "name": "Nicarágua",
    "apiName": "Nicaragua"
  },
  {
    "code": "NG",
    "name": "Nigéria",
    "apiName": "Nigeria"
  },
  {
    "code": "NU",
    "name": "Niue",
    "apiName": "Niue"
  },
  {
    "code": "NO",
    "name": "Noruega",
    "apiName": "Norway"
  },
  {
    "code": "NC",
    "name": "Nova Caledônia",
    "apiName": "New Caledonia"
  },
  {
    "code": "NZ",
    "name": "Nova Zelândia",
    "apiName": "New Zealand"
  },
  {
    "code": "NE",
    "name": "Níger",
    "apiName": "Niger"
  },
  {
    "code": "OM",
    "name": "Omã",
    "apiName": "Oman"
  },
  {
    "code": "PW",
    "name": "Palau",
    "apiName": "Palau"
  },
  {
    "code": "PA",
    "name": "Panamá",
    "apiName": "Panama"
  },
  {
    "code": "PG",
    "name": "Papua-Nova Guiné",
    "apiName": "Papua New Guinea"
  },
  {
    "code": "PK",
    "name": "Paquistão",
    "apiName": "Pakistan"
  },
  {
    "code": "PY",
    "name": "Paraguai",
    "apiName": "Paraguay"
  },
  {
    "code": "WAL",
    "name": "País de Gales",
    "apiName": "Wales"
  },
  {
    "code": "NL",
    "name": "Países Baixos",
    "apiName": "Netherlands"
  },
  {
    "code": "BQ",
    "name": "Países Baixos Caribenhos",
    "apiName": "Caribbean Netherlands"
  },
  {
    "code": "PE",
    "name": "Peru",
    "apiName": "Peru"
  },
  {
    "code": "PF",
    "name": "Polinésia Francesa",
    "apiName": "French Polynesia"
  },
  {
    "code": "PL",
    "name": "Polônia",
    "apiName": "Poland"
  },
  {
    "code": "PR",
    "name": "Porto Rico",
    "apiName": "Puerto Rico"
  },
  {
    "code": "PT",
    "name": "Portugal",
    "apiName": "Portugal"
  },
  {
    "code": "KG",
    "name": "Quirguistão",
    "apiName": "Kyrgyzstan"
  },
  {
    "code": "KI",
    "name": "Quiribati",
    "apiName": "Kiribati"
  },
  {
    "code": "KE",
    "name": "Quênia",
    "apiName": "Kenya"
  },
  {
    "code": "GB",
    "name": "Reino Unido",
    "apiName": "United Kingdom"
  },
  {
    "code": "CF",
    "name": "República Centro-Africana",
    "apiName": "Central African Republic"
  },
  {
    "code": "CG",
    "name": "República do Congo",
    "apiName": "Congo - Brazzaville"
  },
  {
    "code": "DO",
    "name": "República Dominicana",
    "apiName": "Dominican Republic"
  },
  {
    "code": "RE",
    "name": "Reunião",
    "apiName": "Réunion"
  },
  {
    "code": "RO",
    "name": "Romênia",
    "apiName": "Romania"
  },
  {
    "code": "RW",
    "name": "Ruanda",
    "apiName": "Rwanda"
  },
  {
    "code": "RU",
    "name": "Rússia",
    "apiName": "Russia"
  },
  {
    "code": "EH",
    "name": "Saara Ocidental",
    "apiName": "Western Sahara"
  },
  {
    "code": "WS",
    "name": "Samoa",
    "apiName": "Samoa"
  },
  {
    "code": "AS",
    "name": "Samoa Americana",
    "apiName": "American Samoa"
  },
  {
    "code": "SM",
    "name": "San Marino",
    "apiName": "San Marino"
  },
  {
    "code": "SH",
    "name": "Santa Helena",
    "apiName": "St. Helena"
  },
  {
    "code": "LC",
    "name": "Santa Lúcia",
    "apiName": "St. Lucia"
  },
  {
    "code": "SC",
    "name": "Seicheles",
    "apiName": "Seychelles"
  },
  {
    "code": "SN",
    "name": "Senegal",
    "apiName": "Senegal"
  },
  {
    "code": "SL",
    "name": "Serra Leoa",
    "apiName": "Sierra Leone"
  },
  {
    "code": "SG",
    "name": "Singapura",
    "apiName": "Singapore"
  },
  {
    "code": "SX",
    "name": "Sint Maarten",
    "apiName": "Sint Maarten"
  },
  {
    "code": "SO",
    "name": "Somália",
    "apiName": "Somalia"
  },
  {
    "code": "LK",
    "name": "Sri Lanka",
    "apiName": "Sri Lanka"
  },
  {
    "code": "SD",
    "name": "Sudão",
    "apiName": "Sudan"
  },
  {
    "code": "SS",
    "name": "Sudão do Sul",
    "apiName": "South Sudan"
  },
  {
    "code": "SR",
    "name": "Suriname",
    "apiName": "Suriname"
  },
  {
    "code": "SE",
    "name": "Suécia",
    "apiName": "Sweden"
  },
  {
    "code": "CH",
    "name": "Suíça",
    "apiName": "Switzerland"
  },
  {
    "code": "SJ",
    "name": "Svalbard e Jan Mayen",
    "apiName": "Svalbard & Jan Mayen"
  },
  {
    "code": "BL",
    "name": "São Bartolomeu",
    "apiName": "St. Barthélemy"
  },
  {
    "code": "KN",
    "name": "São Cristóvão e Névis",
    "apiName": "St. Kitts & Nevis"
  },
  {
    "code": "MF",
    "name": "São Martinho",
    "apiName": "St. Martin"
  },
  {
    "code": "PM",
    "name": "São Pedro e Miquelão",
    "apiName": "St. Pierre & Miquelon"
  },
  {
    "code": "ST",
    "name": "São Tomé e Príncipe",
    "apiName": "São Tomé & Príncipe"
  },
  {
    "code": "VC",
    "name": "São Vicente e Granadinas",
    "apiName": "St. Vincent & Grenadines"
  },
  {
    "code": "RS",
    "name": "Sérvia",
    "apiName": "Serbia"
  },
  {
    "code": "SY",
    "name": "Síria",
    "apiName": "Syria"
  },
  {
    "code": "TJ",
    "name": "Tadjiquistão",
    "apiName": "Tajikistan"
  },
  {
    "code": "TH",
    "name": "Tailândia",
    "apiName": "Thailand"
  },
  {
    "code": "TW",
    "name": "Taiwan",
    "apiName": "Taiwan"
  },
  {
    "code": "TZ",
    "name": "Tanzânia",
    "apiName": "Tanzania"
  },
  {
    "code": "CZ",
    "name": "Tchéquia",
    "apiName": "Czechia"
  },
  {
    "code": "IO",
    "name": "Território Britânico do Oceano Índico",
    "apiName": "British Indian Ocean Territory"
  },
  {
    "code": "TF",
    "name": "Territórios Franceses do Sul",
    "apiName": "French Southern Territories"
  },
  {
    "code": "PS",
    "name": "Territórios palestinos",
    "apiName": "Palestinian Territories"
  },
  {
    "code": "TL",
    "name": "Timor-Leste",
    "apiName": "Timor-Leste"
  },
  {
    "code": "TG",
    "name": "Togo",
    "apiName": "Togo"
  },
  {
    "code": "TK",
    "name": "Tokelau",
    "apiName": "Tokelau"
  },
  {
    "code": "TO",
    "name": "Tonga",
    "apiName": "Tonga"
  },
  {
    "code": "TT",
    "name": "Trinidad e Tobago",
    "apiName": "Trinidad & Tobago"
  },
  {
    "code": "TN",
    "name": "Tunísia",
    "apiName": "Tunisia"
  },
  {
    "code": "TM",
    "name": "Turcomenistão",
    "apiName": "Turkmenistan"
  },
  {
    "code": "TR",
    "name": "Turquia",
    "apiName": "Türkiye"
  },
  {
    "code": "TV",
    "name": "Tuvalu",
    "apiName": "Tuvalu"
  },
  {
    "code": "UA",
    "name": "Ucrânia",
    "apiName": "Ukraine"
  },
  {
    "code": "UG",
    "name": "Uganda",
    "apiName": "Uganda"
  },
  {
    "code": "UY",
    "name": "Uruguai",
    "apiName": "Uruguay"
  },
  {
    "code": "UZ",
    "name": "Uzbequistão",
    "apiName": "Uzbekistan"
  },
  {
    "code": "VU",
    "name": "Vanuatu",
    "apiName": "Vanuatu"
  },
  {
    "code": "VE",
    "name": "Venezuela",
    "apiName": "Venezuela"
  },
  {
    "code": "VN",
    "name": "Vietnã",
    "apiName": "Vietnam"
  },
  {
    "code": "WF",
    "name": "Wallis e Futuna",
    "apiName": "Wallis & Futuna"
  },
  {
    "code": "ZW",
    "name": "Zimbábue",
    "apiName": "Zimbabwe"
  },
  {
    "code": "ZM",
    "name": "Zâmbia",
    "apiName": "Zambia"
  },
  {
    "code": "ZA",
    "name": "África do Sul",
    "apiName": "South Africa"
  },
  {
    "code": "AT",
    "name": "Áustria",
    "apiName": "Austria"
  },
  {
    "code": "IN",
    "name": "Índia",
    "apiName": "India"
  }
];

const LOCAL_CLUBS = {
  "BR": [
    {
      "name": "Atlético Mineiro",
      "strength": 81
    },
    {
      "name": "Bahia",
      "strength": 77
    },
    {
      "name": "Botafogo",
      "strength": 82
    },
    {
      "name": "Corinthians",
      "strength": 79
    },
    {
      "name": "Cruzeiro",
      "strength": 80
    },
    {
      "name": "Flamengo",
      "strength": 86
    },
    {
      "name": "Fluminense",
      "strength": 80
    },
    {
      "name": "Grêmio",
      "strength": 79
    },
    {
      "name": "Internacional",
      "strength": 80
    },
    {
      "name": "Palmeiras",
      "strength": 86
    },
    {
      "name": "Santos",
      "strength": 77
    },
    {
      "name": "São Paulo",
      "strength": 82
    }
  ],
  "AR": [
    {
      "name": "Argentinos Juniors",
      "strength": 75
    },
    {
      "name": "Boca Juniors",
      "strength": 83
    },
    {
      "name": "Estudiantes",
      "strength": 78
    },
    {
      "name": "Independiente",
      "strength": 77
    },
    {
      "name": "Racing Club",
      "strength": 80
    },
    {
      "name": "River Plate",
      "strength": 85
    },
    {
      "name": "Rosario Central",
      "strength": 77
    },
    {
      "name": "San Lorenzo",
      "strength": 77
    },
    {
      "name": "Talleres",
      "strength": 79
    },
    {
      "name": "Vélez Sarsfield",
      "strength": 78
    }
  ],
  "ES": [
    {
      "name": "Athletic Club",
      "strength": 82
    },
    {
      "name": "Atlético de Madrid",
      "strength": 88
    },
    {
      "name": "Barcelona",
      "strength": 92
    },
    {
      "name": "Betis",
      "strength": 81
    },
    {
      "name": "Girona",
      "strength": 80
    },
    {
      "name": "Real Madrid",
      "strength": 93
    },
    {
      "name": "Real Sociedad",
      "strength": 82
    },
    {
      "name": "Sevilla",
      "strength": 80
    },
    {
      "name": "Valencia",
      "strength": 79
    },
    {
      "name": "Villarreal",
      "strength": 82
    }
  ],
  "ENG": [
    {
      "name": "Arsenal",
      "strength": 90
    },
    {
      "name": "Aston Villa",
      "strength": 84
    },
    {
      "name": "Chelsea",
      "strength": 87
    },
    {
      "name": "Liverpool",
      "strength": 91
    },
    {
      "name": "Manchester City",
      "strength": 92
    },
    {
      "name": "Manchester United",
      "strength": 86
    },
    {
      "name": "Newcastle United",
      "strength": 85
    },
    {
      "name": "Nottingham Forest",
      "strength": 81
    },
    {
      "name": "Tottenham",
      "strength": 85
    },
    {
      "name": "West Ham",
      "strength": 80
    }
  ],
  "SCO": [
    {
      "name": "Celtic",
      "strength": 82
    },
    {
      "name": "Rangers",
      "strength": 81
    }
  ],
  "DE": [
    {
      "name": "Bayern de Munique",
      "strength": 91
    },
    {
      "name": "Bayer Leverkusen",
      "strength": 88
    },
    {
      "name": "Borussia Dortmund",
      "strength": 87
    },
    {
      "name": "Eintracht Frankfurt",
      "strength": 82
    },
    {
      "name": "RB Leipzig",
      "strength": 85
    },
    {
      "name": "Stuttgart",
      "strength": 82
    },
    {
      "name": "Werder Bremen",
      "strength": 78
    }
  ],
  "IT": [
    {
      "name": "Atalanta",
      "strength": 86
    },
    {
      "name": "Fiorentina",
      "strength": 82
    },
    {
      "name": "Inter de Milão",
      "strength": 91
    },
    {
      "name": "Juventus",
      "strength": 88
    },
    {
      "name": "Lazio",
      "strength": 83
    },
    {
      "name": "Milan",
      "strength": 88
    },
    {
      "name": "Napoli",
      "strength": 87
    },
    {
      "name": "Roma",
      "strength": 85
    }
  ],
  "FR": [
    {
      "name": "Lille",
      "strength": 82
    },
    {
      "name": "Lyon",
      "strength": 81
    },
    {
      "name": "Marseille",
      "strength": 84
    },
    {
      "name": "Monaco",
      "strength": 85
    },
    {
      "name": "Nice",
      "strength": 81
    },
    {
      "name": "Paris Saint-Germain",
      "strength": 92
    },
    {
      "name": "Rennes",
      "strength": 80
    }
  ],
  "PT": [
    {
      "name": "Benfica",
      "strength": 87
    },
    {
      "name": "Braga",
      "strength": 81
    },
    {
      "name": "Porto",
      "strength": 86
    },
    {
      "name": "Sporting CP",
      "strength": 87
    },
    {
      "name": "Vitória de Guimarães",
      "strength": 78
    }
  ],
  "NL": [
    {
      "name": "Ajax",
      "strength": 83
    },
    {
      "name": "AZ Alkmaar",
      "strength": 80
    },
    {
      "name": "Feyenoord",
      "strength": 85
    },
    {
      "name": "PSV",
      "strength": 86
    },
    {
      "name": "Twente",
      "strength": 79
    }
  ],
  "BE": [
    {
      "name": "Anderlecht",
      "strength": 80
    },
    {
      "name": "Club Brugge",
      "strength": 83
    },
    {
      "name": "Genk",
      "strength": 80
    },
    {
      "name": "Gent",
      "strength": 79
    },
    {
      "name": "Union Saint-Gilloise",
      "strength": 82
    }
  ],
  "TR": [
    {
      "name": "Beşiktaş",
      "strength": 80
    },
    {
      "name": "Fenerbahçe",
      "strength": 84
    },
    {
      "name": "Galatasaray",
      "strength": 85
    },
    {
      "name": "İstanbul Başakşehir",
      "strength": 78
    },
    {
      "name": "Trabzonspor",
      "strength": 79
    }
  ],
  "MX": [
    {
      "name": "América",
      "strength": 82
    },
    {
      "name": "Cruz Azul",
      "strength": 80
    },
    {
      "name": "Guadalajara",
      "strength": 79
    },
    {
      "name": "Monterrey",
      "strength": 82
    },
    {
      "name": "Tigres UANL",
      "strength": 82
    }
  ],
  "US": [
    {
      "name": "Atlanta United",
      "strength": 76
    },
    {
      "name": "Inter Miami",
      "strength": 81
    },
    {
      "name": "LA Galaxy",
      "strength": 79
    },
    {
      "name": "Los Angeles FC",
      "strength": 80
    },
    {
      "name": "Seattle Sounders",
      "strength": 79
    }
  ],
  "JP": [
    {
      "name": "Kashima Antlers",
      "strength": 77
    },
    {
      "name": "Kawasaki Frontale",
      "strength": 78
    },
    {
      "name": "Urawa Red Diamonds",
      "strength": 79
    },
    {
      "name": "Vissel Kobe",
      "strength": 79
    },
    {
      "name": "Yokohama F. Marinos",
      "strength": 78
    }
  ],
  "SA": [
    {
      "name": "Al-Ahli",
      "strength": 82
    },
    {
      "name": "Al-Hilal",
      "strength": 87
    },
    {
      "name": "Al-Ittihad",
      "strength": 85
    },
    {
      "name": "Al-Nassr",
      "strength": 86
    },
    {
      "name": "Al-Shabab",
      "strength": 79
    }
  ],
  "UY": [
    {
      "name": "Danubio",
      "strength": 73
    },
    {
      "name": "Defensor Sporting",
      "strength": 74
    },
    {
      "name": "Nacional",
      "strength": 79
    },
    {
      "name": "Peñarol",
      "strength": 79
    },
    {
      "name": "Liverpool Montevideo",
      "strength": 73
    }
  ],
  "CO": [
    {
      "name": "Atlético Nacional",
      "strength": 79
    },
    {
      "name": "Junior",
      "strength": 76
    },
    {
      "name": "Millonarios",
      "strength": 77
    },
    {
      "name": "América de Cali",
      "strength": 76
    },
    {
      "name": "Independiente Medellín",
      "strength": 76
    }
  ],
  "CL": [
    {
      "name": "Colo-Colo",
      "strength": 78
    },
    {
      "name": "Universidad Católica",
      "strength": 75
    },
    {
      "name": "Universidad de Chile",
      "strength": 76
    },
    {
      "name": "Huachipato",
      "strength": 73
    },
    {
      "name": "Palestino",
      "strength": 73
    }
  ]
};

const COMPETITION_RULES = {
  "BR": {
    "league": "Brasileirão Série A",
    "cup": "Copa do Brasil",
    "continental": [
      "CONMEBOL Libertadores",
      "CONMEBOL Sul-Americana"
    ]
  },
  "AR": {
    "league": "Liga Profesional Argentina",
    "cup": "Copa Argentina",
    "continental": [
      "CONMEBOL Libertadores",
      "CONMEBOL Sul-Americana"
    ]
  },
  "UY": {
    "league": "Primera División Uruguaia",
    "cup": "Copa AUF Uruguay",
    "continental": [
      "CONMEBOL Libertadores",
      "CONMEBOL Sul-Americana"
    ]
  },
  "CO": {
    "league": "Categoría Primera A",
    "cup": "Copa Colombia",
    "continental": [
      "CONMEBOL Libertadores",
      "CONMEBOL Sul-Americana"
    ]
  },
  "CL": {
    "league": "Primera División do Chile",
    "cup": "Copa Chile",
    "continental": [
      "CONMEBOL Libertadores",
      "CONMEBOL Sul-Americana"
    ]
  },
  "ES": {
    "league": "LaLiga",
    "cup": "Copa do Rei",
    "continental": [
      "UEFA Champions League",
      "UEFA Europa League",
      "UEFA Conference League"
    ]
  },
  "ENG": {
    "league": "Premier League",
    "cup": "FA Cup",
    "continental": [
      "UEFA Champions League",
      "UEFA Europa League",
      "UEFA Conference League"
    ]
  },
  "SCO": {
    "league": "Scottish Premiership",
    "cup": "Scottish Cup",
    "continental": [
      "UEFA Champions League",
      "UEFA Europa League",
      "UEFA Conference League"
    ]
  },
  "DE": {
    "league": "Bundesliga",
    "cup": "DFB-Pokal",
    "continental": [
      "UEFA Champions League",
      "UEFA Europa League",
      "UEFA Conference League"
    ]
  },
  "IT": {
    "league": "Serie A",
    "cup": "Coppa Italia",
    "continental": [
      "UEFA Champions League",
      "UEFA Europa League",
      "UEFA Conference League"
    ]
  },
  "FR": {
    "league": "Ligue 1",
    "cup": "Coupe de France",
    "continental": [
      "UEFA Champions League",
      "UEFA Europa League",
      "UEFA Conference League"
    ]
  },
  "PT": {
    "league": "Primeira Liga",
    "cup": "Taça de Portugal",
    "continental": [
      "UEFA Champions League",
      "UEFA Europa League",
      "UEFA Conference League"
    ]
  },
  "NL": {
    "league": "Eredivisie",
    "cup": "KNVB Beker",
    "continental": [
      "UEFA Champions League",
      "UEFA Europa League",
      "UEFA Conference League"
    ]
  },
  "BE": {
    "league": "Belgian Pro League",
    "cup": "Copa da Bélgica",
    "continental": [
      "UEFA Champions League",
      "UEFA Europa League",
      "UEFA Conference League"
    ]
  },
  "TR": {
    "league": "Süper Lig",
    "cup": "Copa da Turquia",
    "continental": [
      "UEFA Champions League",
      "UEFA Europa League",
      "UEFA Conference League"
    ]
  },
  "MX": {
    "league": "Liga MX",
    "cup": "Copa MX",
    "continental": [
      "CONCACAF Champions Cup"
    ]
  },
  "US": {
    "league": "Major League Soccer",
    "cup": "U.S. Open Cup",
    "continental": [
      "CONCACAF Champions Cup"
    ]
  },
  "JP": {
    "league": "J1 League",
    "cup": "Copa do Imperador",
    "continental": [
      "AFC Champions League Elite",
      "AFC Champions League Two"
    ]
  },
  "SA": {
    "league": "Saudi Pro League",
    "cup": "King Cup",
    "continental": [
      "AFC Champions League Elite",
      "AFC Champions League Two"
    ]
  }
};

const CONFEDERATIONS = {
  southAmerica: ["AR", "BO", "BR", "CL", "CO", "EC", "GY", "PE", "PY", "SR", "UY", "VE"],
  europe: ["AD", "AL", "AT", "BA", "BE", "BG", "BY", "CH", "CY", "CZ", "DE", "DK", "EE", "ENG", "ES", "FI", "FR", "GB", "GR", "HR", "HU", "IE", "IS", "IT", "LI", "LT", "LU", "LV", "MC", "MD", "ME", "MK", "MT", "NIR", "NL", "NO", "PL", "PT", "RO", "RS", "RU", "SCO", "SE", "SI", "SK", "SM", "UA", "VA", "WAL"],
  concacaf: ["AG", "BB", "BS", "BZ", "CA", "CR", "CU", "DM", "DO", "GD", "GT", "HN", "HT", "JM", "KN", "LC", "MX", "NI", "PA", "SV", "TT", "US", "VC"],
  asia: ["AE", "AF", "AM", "AZ", "BD", "BH", "BN", "BT", "CN", "GE", "ID", "IL", "IN", "IQ", "IR", "JO", "JP", "KG", "KH", "KP", "KR", "KW", "KZ", "LA", "LB", "LK", "MM", "MN", "MV", "MY", "NP", "OM", "PH", "PK", "PS", "QA", "SA", "SG", "SY", "TH", "TJ", "TL", "TM", "UZ", "VN", "YE"],
  africa: ["AO", "BF", "BI", "BJ", "BW", "CD", "CF", "CG", "CI", "CM", "CV", "DJ", "DZ", "EG", "ER", "ET", "GA", "GH", "GM", "GN", "GQ", "GW", "KE", "KM", "LR", "LS", "LY", "MA", "MG", "ML", "MR", "MU", "MW", "MZ", "NA", "NE", "NG", "RW", "SC", "SD", "SL", "SN", "SO", "SS", "ST", "SZ", "TD", "TG", "TN", "TZ", "UG", "ZA", "ZM", "ZW"],
  oceania: ["AU", "FJ", "FM", "KI", "MH", "NR", "NZ", "PG", "PW", "SB", "TO", "TV", "VU", "WS"]
};

const POSITIONS = [
  'Goleiro','Zagueiro','Lateral direito','Lateral esquerdo','Volante','Meia central','Meia ofensivo','Meia direita','Meia esquerda','Segundo atacante','Ponta direita','Ponta esquerda','Centroavante'
];

const START_YEAR = new Date().getFullYear();

// --- CareerSim V3: formatos, mercado, temas e eventos ---
const LEAGUE_FORMATS = {
  BR:{teams:20,matches:38,mode:'double_round_robin',championPoints:80,label:'20 clubes · 38 rodadas · 19 em casa e 19 fora'},
  ES:{teams:20,matches:38,mode:'double_round_robin',championPoints:82,label:'20 clubes · 38 rodadas · turno e returno'},
  ENG:{teams:20,matches:38,mode:'double_round_robin',championPoints:84,label:'20 clubes · 38 rodadas · turno e returno'},
  IT:{teams:20,matches:38,mode:'double_round_robin',championPoints:82,label:'20 clubes · 38 rodadas · turno e returno'},
  DE:{teams:18,matches:34,mode:'double_round_robin',championPoints:73,label:'18 clubes · 34 rodadas · turno e returno'},
  FR:{teams:18,matches:34,mode:'double_round_robin',championPoints:74,label:'18 clubes · 34 rodadas · turno e returno'},
  PT:{teams:18,matches:34,mode:'double_round_robin',championPoints:77,label:'18 clubes · 34 rodadas · turno e returno'},
  NL:{teams:18,matches:34,mode:'double_round_robin',championPoints:77,label:'18 clubes · 34 rodadas · turno e returno'},
  BE:{teams:18,matches:34,mode:'double_round_robin',championPoints:72,label:'18 clubes · fase regular em turno e returno (play-off simplificado)'},
  TR:{teams:18,matches:34,mode:'double_round_robin',championPoints:74,label:'18 clubes · 34 rodadas · turno e returno'},
  SA:{teams:18,matches:34,mode:'double_round_robin',championPoints:74,label:'18 clubes · 34 rodadas · turno e returno'},
  JP:{teams:20,matches:38,mode:'double_round_robin',championPoints:72,label:'20 clubes · turno e returno (modelo padrão da J1)'},
  MX:{teams:18,matches:34,mode:'split_season',championPoints:66,label:'Apertura + Clausura, 17 partidas em cada fase (play-offs simplificados)'},
  US:{teams:30,matches:34,mode:'regional',championPoints:67,label:'34 jogos de temporada regular + playoffs simplificados'},
  AR:{teams:30,matches:32,mode:'groups',championPoints:62,label:'zonas + mata-mata, adaptado para a simulação anual'},
  UY:{teams:16,matches:30,mode:'double_round_robin',championPoints:61,label:'16 clubes · 30 jogos no modelo anual simplificado'},
  CO:{teams:20,matches:38,mode:'split_season',championPoints:70,label:'Apertura + Finalización, adaptados para 38 jogos regulares'},
  CL:{teams:16,matches:30,mode:'double_round_robin',championPoints:60,label:'16 clubes · 30 rodadas · turno e returno'},
  SCO:{teams:12,matches:38,mode:'split',championPoints:78,label:'12 clubes · fase regular + divisão em grupos, modelo simplificado'}
};

const LEAGUE_CLUB_POOLS = {
  BR:['Athletico Paranaense','Atlético Mineiro','Bahia','Botafogo','Chapecoense','Corinthians','Coritiba','Cruzeiro','Flamengo','Fluminense','Grêmio','Internacional','Mirassol','Palmeiras','Red Bull Bragantino','Remo','Santos','São Paulo','Vasco da Gama','Vitória'],
  ES:['Athletic Club','Atlético de Madrid','Osasuna','Celta de Vigo','Alavés','Elche','Barcelona','Getafe','Levante','Málaga','Racing Santander','Rayo Vallecano','Deportivo La Coruña','Espanyol','Betis','Real Madrid','Real Sociedad','Sevilla','Valencia','Villarreal'],
  ENG:['Arsenal','Aston Villa','Bournemouth','Brentford','Brighton','Chelsea','Coventry City','Crystal Palace','Everton','Fulham','Hull City','Ipswich Town','Leeds United','Liverpool','Manchester City','Manchester United','Newcastle United','Nottingham Forest','Sunderland','Tottenham'],
  SCO:['Aberdeen','Celtic','Dundee','Dundee United','Falkirk','Hearts','Hibernian','Kilmarnock','Motherwell','Rangers','St Johnstone','St Mirren'],
  DE:['Bayern de Munique','Borussia Dortmund','RB Leipzig','Stuttgart','Hoffenheim','Bayer Leverkusen','Freiburg','Eintracht Frankfurt','Augsburg','Mainz','Union Berlin','Borussia Mönchengladbach','Hamburgo','Köln','Werder Bremen','Schalke 04','Elversberg','Paderborn'],
  IT:['Milan','Atalanta','Bologna','Cagliari','Como','Fiorentina','Frosinone','Genoa','Inter de Milão','Juventus','Lazio','Lecce','Monza','Napoli','Parma','Roma','Sassuolo','Torino','Udinese','Venezia'],
  FR:['Angers','Auxerre','Brest','Le Havre','Le Mans','Lens','Lorient','Lille','Lyon','Marseille','Monaco','Nice','Paris FC','Paris Saint-Germain','Rennes','Strasbourg','Toulouse','Troyes'],
  PT:['Benfica','Porto','Sporting CP','Braga','Vitória de Guimarães','Famalicão','Rio Ave','Moreirense','Casa Pia','Estoril','Arouca','Gil Vicente','Santa Clara','Nacional da Madeira','Alverca','Académico de Viseu','Marítimo','Estrela da Amadora'],
  NL:['Ajax','PSV','Feyenoord','AZ Alkmaar','Twente','Utrecht','Heerenveen','Sparta Rotterdam','Groningen','NEC','Go Ahead Eagles','Fortuna Sittard','PEC Zwolle','Excelsior','Telstar','ADO Den Haag','SC Cambuur','Willem II'],
  SA:['Al-Nassr','Al-Hilal','Al-Ahli','Al-Qadsiah','Al-Ittihad','Al-Taawoun','Al-Ettifaq','Al-Fateh','Al-Khaleej','Al-Shabab','Neom SC','Al-Hazm','Al-Fayha','Al-Kholood','Al-Riyadh','Abha','Al-Faisaly','Al-Diriyah'],
  AR:['Platense','Defensa y Justicia','Central Córdoba','Lanús','Deportivo Riestra','Talleres','Boca Juniors','Estudiantes','Instituto','Gimnasia Mendoza','San Lorenzo','Independiente','Newell\'s Old Boys','Unión','Vélez Sarsfield','Argentinos Juniors','Aldosivi','Atlético Tucumán','Banfield','Barracas Central','Belgrano','River Plate','Gimnasia La Plata','Estudiantes Río Cuarto','Independiente Rivadavia','Huracán','Racing Club','Rosario Central','Sarmiento','Tigre'],
  UY:['Albion','Boston River','Central Español','Cerro','Cerro Largo','Danubio','Defensor Sporting','Deportivo Maldonado','Juventud','Liverpool Montevideo','Montevideo City Torque','Montevideo Wanderers','Nacional','Peñarol','Progreso','Racing Montevideo'],
  CL:['Audax Italiano','Cobresal','Colo-Colo','Coquimbo Unido','Deportes Concepción','Deportes La Serena','Everton de Viña del Mar','Huachipato','Deportes Limache','Ñublense','O\'Higgins','Palestino','Unión La Calera','Universidad Católica','Universidad de Chile','Universidad de Concepción'],
  CO:['Atlético Nacional','América de Cali','Junior','Millonarios','Independiente Medellín','Deportes Tolima','Santa Fe','Internacional de Bogotá','Deportivo Cali','Once Caldas','Atlético Bucaramanga','Rionegro Águilas','Deportivo Pasto','Llaneros','Cúcuta Deportivo','Fortaleza CEIF','Alianza FC','Deportivo Pereira','Jaguares de Córdoba','Boyacá Chicó'],
  MX:['Club América','Guadalajara','Cruz Azul','Pumas UNAM','Tigres UANL','Monterrey','Toluca','Pachuca','León','Atlas','Santos Laguna','FC Juárez','Querétaro','Atlético de San Luis','Atlante','Tijuana','Puebla','Necaxa'],
  US:['Atlanta United','Charlotte FC','Chicago Fire','FC Cincinnati','Columbus Crew','D.C. United','Inter Miami','Montréal','Nashville SC','New England Revolution','New York City FC','Orlando City','Philadelphia Union','New York Red Bulls','Toronto FC','Austin FC','Colorado Rapids','FC Dallas','Houston Dynamo','Los Angeles FC','LA Galaxy','Minnesota United FC','Portland Timbers','Real Salt Lake','St. Louis CITY','San Diego FC','San Jose Earthquakes','Seattle Sounders','Sporting Kansas City','Vancouver Whitecaps'],
  JP:['Vissel Kobe','Kashima Antlers','Cerezo Osaka','FC Tokyo','Machida Zelvia','Nagoya Grampus','Sanfrecce Hiroshima','Kawasaki Frontale','Gamba Osaka','Tokyo Verdy','Fagiano Okayama','Urawa Red Diamonds','Yokohama F. Marinos','Shimizu S-Pulse','Kashiwa Reysol','Kyoto Sanga','V-Varen Nagasaki','Mito HollyHock','Avispa Fukuoka','JEF United Chiba'],
  TR:['Alanyaspor','Amedspor','Beşiktaş','Rizespor','Çorum FK','Erzurumspor','Eyüpspor','Fenerbahçe','Galatasaray','Gaziantep','Gençlerbirliği','Göztepe','İstanbul Başakşehir','Kasımpaşa','Kocaelispor','Konyaspor','Samsunspor','Trabzonspor'],
  BE:['Club Brugge','Union Saint-Gilloise','Genk','Anderlecht','Gent','Standard Liège','Mechelen','Charleroi','Westerlo','Cercle Brugge','Antwerp','Sint-Truiden','OH Leuven','Zulte Waregem','La Louvière','Lommel','Kortrijk','Beveren'],
};

const DOMESTIC_CUP_FORMATS = {
  BR:{stages:[{name:'5ª fase',legs:2},{name:'Oitavas de final',legs:2},{name:'Quartas de final',legs:2},{name:'Semifinal',legs:2},{name:'Final',legs:1}]},
  ES:{stages:[{name:'Fase inicial',legs:1},{name:'Oitavas de final',legs:1},{name:'Quartas de final',legs:1},{name:'Semifinal',legs:2},{name:'Final',legs:1}]},
  ENG:{stages:[{name:'3ª fase',legs:1},{name:'4ª fase',legs:1},{name:'Oitavas de final',legs:1},{name:'Quartas de final',legs:1},{name:'Semifinal',legs:1},{name:'Final',legs:1}]},
  SCO:{stages:[{name:'4ª fase',legs:1},{name:'Oitavas de final',legs:1},{name:'Quartas de final',legs:1},{name:'Semifinal',legs:1},{name:'Final',legs:1}]},
  DE:{stages:[{name:'2ª fase',legs:1},{name:'Oitavas de final',legs:1},{name:'Quartas de final',legs:1},{name:'Semifinal',legs:1},{name:'Final',legs:1}]},
  FR:{stages:[{name:'32-avos',legs:1},{name:'16-avos',legs:1},{name:'Oitavas de final',legs:1},{name:'Quartas de final',legs:1},{name:'Semifinal',legs:1},{name:'Final',legs:1}]},
  PT:{stages:[{name:'3ª eliminatória',legs:1},{name:'4ª eliminatória',legs:1},{name:'Oitavas de final',legs:1},{name:'Quartas de final',legs:1},{name:'Semifinal',legs:2},{name:'Final',legs:1}]}
};

const CONTINENTAL_FORMATS = {
  'UEFA Champions League':{phaseMatches:8,phase:'Fase de liga',qualifyPoints:10,directPoints:15,knockout:[{name:'Play-off',legs:2,conditional:true},{name:'Oitavas de final',legs:2},{name:'Quartas de final',legs:2},{name:'Semifinal',legs:2},{name:'Final',legs:1}]},
  'UEFA Europa League':{phaseMatches:8,phase:'Fase de liga',qualifyPoints:9,directPoints:14,knockout:[{name:'Play-off',legs:2,conditional:true},{name:'Oitavas de final',legs:2},{name:'Quartas de final',legs:2},{name:'Semifinal',legs:2},{name:'Final',legs:1}]},
  'UEFA Conference League':{phaseMatches:6,phase:'Fase de liga',qualifyPoints:7,directPoints:12,knockout:[{name:'Play-off',legs:2,conditional:true},{name:'Oitavas de final',legs:2},{name:'Quartas de final',legs:2},{name:'Semifinal',legs:2},{name:'Final',legs:1}]},
  'CONMEBOL Libertadores':{phaseMatches:6,phase:'Fase de grupos',qualifyPoints:9,directPoints:9,knockout:[{name:'Oitavas de final',legs:2},{name:'Quartas de final',legs:2},{name:'Semifinal',legs:2},{name:'Final',legs:1}]},
  'CONMEBOL Sul-Americana':{phaseMatches:6,phase:'Fase de grupos',qualifyPoints:9,directPoints:12,knockout:[{name:'Play-off',legs:2,conditional:true},{name:'Oitavas de final',legs:2},{name:'Quartas de final',legs:2},{name:'Semifinal',legs:2},{name:'Final',legs:1}]},
  'CONCACAF Champions Cup':{phaseMatches:0,phase:'Mata-mata',qualifyPoints:0,directPoints:0,knockout:[{name:'Primeira fase',legs:2},{name:'Oitavas de final',legs:2},{name:'Quartas de final',legs:2},{name:'Semifinal',legs:2},{name:'Final',legs:1}]},
  'AFC Champions League Elite':{phaseMatches:8,phase:'Fase de liga',qualifyPoints:10,directPoints:10,knockout:[{name:'Oitavas de final',legs:2},{name:'Quartas de final',legs:1},{name:'Semifinal',legs:1},{name:'Final',legs:1}]},
  'AFC Champions League Two':{phaseMatches:6,phase:'Fase de grupos',qualifyPoints:9,directPoints:9,knockout:[{name:'Oitavas de final',legs:2},{name:'Quartas de final',legs:2},{name:'Semifinal',legs:2},{name:'Final',legs:1}]}
};

const TRANSFER_TARGETS = [
  {name:'Braga',countryCode:'PT',minOverall:72,strength:78},{name:'Ajax',countryCode:'NL',minOverall:73,strength:82},
  {name:'Benfica',countryCode:'PT',minOverall:75,strength:84},{name:'Porto',countryCode:'PT',minOverall:76,strength:84},{name:'Sporting CP',countryCode:'PT',minOverall:77,strength:85},
  {name:'Borussia Dortmund',countryCode:'DE',minOverall:80,strength:87},{name:'Napoli',countryCode:'IT',minOverall:81,strength:87},{name:'Atlético de Madrid',countryCode:'ES',minOverall:82,strength:88},
  {name:'Arsenal',countryCode:'ENG',minOverall:84,strength:89},{name:'Chelsea',countryCode:'ENG',minOverall:85,strength:88},{name:'Liverpool',countryCode:'ENG',minOverall:86,strength:91},{name:'Manchester City',countryCode:'ENG',minOverall:87,strength:92},
  {name:'Inter de Milão',countryCode:'IT',minOverall:86,strength:90},{name:'Paris Saint-Germain',countryCode:'FR',minOverall:87,strength:91},
  {name:'Bayern de Munique',countryCode:'DE',minOverall:90,strength:93},{name:'Barcelona',countryCode:'ES',minOverall:90,strength:93},{name:'Real Madrid',countryCode:'ES',minOverall:91,strength:94}
];



/* ===== Be The Legend V8.8: mercado ampliado por faixa de GER ===== */
const MARKET_LEAGUE_FORMATS = {
  'EFL Championship':{teams:24,matches:46,mode:'double_round_robin',championPoints:88,label:'24 clubes · 46 rodadas · turno e returno'},
  'EFL League One':{teams:24,matches:46,mode:'double_round_robin',championPoints:90,label:'24 clubes · 46 rodadas · turno e returno'},
  '2. Bundesliga':{teams:18,matches:34,mode:'double_round_robin',championPoints:68,label:'18 clubes · 34 rodadas · turno e returno'},
  'LALIGA HYPERMOTION':{teams:22,matches:42,mode:'double_round_robin',championPoints:78,label:'22 clubes · 42 rodadas · turno e returno'},
  'Liga Portugal 2':{teams:18,matches:34,mode:'double_round_robin',championPoints:67,label:'18 clubes · 34 rodadas · turno e returno'},
  'Série B':{teams:20,matches:38,mode:'double_round_robin',championPoints:70,label:'20 clubes · 38 rodadas · turno e returno'},
  'Serie B':{teams:20,matches:38,mode:'double_round_robin',championPoints:72,label:'20 clubes · 38 rodadas · turno e returno'},
  'Ligue 2':{teams:18,matches:34,mode:'double_round_robin',championPoints:67,label:'18 clubes · 34 rodadas · turno e returno'},
  'Austrian Bundesliga':{teams:12,matches:32,mode:'regional',championPoints:60,label:'12 clubes · temporada regular + fase final simplificada'},
  'Swiss Super League':{teams:12,matches:38,mode:'regional',championPoints:68,label:'12 clubes · formato suíço simplificado'},
  'Danish Superliga':{teams:12,matches:32,mode:'regional',championPoints:60,label:'12 clubes · fase regular + grupos simplificados'},
  'Greek Super League':{teams:14,matches:32,mode:'regional',championPoints:63,label:'14 clubes · temporada regular + playoffs simplificados'},
  'Czech First League':{teams:16,matches:30,mode:'double_round_robin',championPoints:62,label:'16 clubes · 30 rodadas · turno e returno'},
  'Ekstraklasa':{teams:18,matches:34,mode:'double_round_robin',championPoints:64,label:'18 clubes · 34 rodadas · turno e returno'},
  'HNL':{teams:10,matches:36,mode:'regional',championPoints:66,label:'10 clubes · 36 rodadas'},
  'Serbian SuperLiga':{teams:16,matches:30,mode:'double_round_robin',championPoints:64,label:'16 clubes · 30 rodadas + fase final simplificada'},
  'Eliteserien':{teams:16,matches:30,mode:'double_round_robin',championPoints:61,label:'16 clubes · 30 rodadas'},
  'Allsvenskan':{teams:16,matches:30,mode:'double_round_robin',championPoints:60,label:'16 clubes · 30 rodadas'},
  'Romanian SuperLiga':{teams:16,matches:30,mode:'double_round_robin',championPoints:60,label:'16 clubes · fase regular simplificada'},
  'Ukrainian Premier League':{teams:16,matches:30,mode:'double_round_robin',championPoints:62,label:'16 clubes · 30 rodadas'},
  'K League 1':{teams:12,matches:38,mode:'regional',championPoints:67,label:'12 clubes · temporada regular + fase final simplificada'},
  'Qatar Stars League':{teams:12,matches:22,mode:'double_round_robin',championPoints:47,label:'12 clubes · 22 rodadas'},
  'UAE Pro League':{teams:14,matches:26,mode:'double_round_robin',championPoints:52,label:'14 clubes · 26 rodadas'}
};

const MARKET_LEAGUE_POOLS = {
  'EFL Championship':['Birmingham City','Blackburn Rovers','Bolton Wanderers','Bristol City','Burnley','Cardiff City','Charlton Athletic','Derby County','Lincoln City','Middlesbrough','Millwall','Norwich City','Portsmouth','Preston North End','Queens Park Rangers','Sheffield United','Stoke City','Swansea City','Watford','West Bromwich Albion','West Ham United','Wolverhampton Wanderers','Wrexham','Southampton'],
  'EFL League One':['AFC Wimbledon','Barnsley','Blackpool','Bradford City','Bromley','Burton Albion','Cambridge United','Doncaster Rovers','Huddersfield Town','Leicester City','Leyton Orient','Luton Town','Mansfield Town','Milton Keynes Dons','Notts County','Oxford United','Peterborough United','Plymouth Argyle','Reading','Sheffield Wednesday','Stevenage','Stockport County','Wigan Athletic','Wycombe Wanderers'],
  '2. Bundesliga':['Wolfsburg','Heidenheim','St. Pauli','Hannover 96','Darmstadt 98','Kaiserslautern','Hertha Berlin','Nürnberg','Bochum','Karlsruhe','Dynamo Dresden','Holstein Kiel','Arminia Bielefeld','Magdeburg','Eintracht Braunschweig','Greuther Fürth','Energie Cottbus','VfL Osnabrück'],
  'LALIGA HYPERMOTION':['AD Ceuta','Albacete','Burgos','Cádiz','Castellón','Eldense','Leganés','Tenerife','Sabadell','Celta Fortuna','Córdoba','FC Andorra','Girona','Granada','Real Sociedad B','Mallorca','Real Oviedo','Sporting Gijón','Real Valladolid','Eibar','Almería','Las Palmas'],
  'Liga Portugal 2':['Académica','AVS','Amarante','Chaves','Farense','Feirense','Felgueiras 1932','Leixões','Lusitânia de Lourosa','Penafiel','Portimonense','Tondela','Torreense','União de Leiria','Vizela','Benfica B','Sporting B','Porto B'],
  'Série B':['São Bernardo','Ceará','Criciúma','Náutico','América Mineiro','Goiás','Londrina','Novorizontino','Sport','Cuiabá','Atlético Goianiense','Operário-PR','Vila Nova','CRB','Ponte Preta','Athletic Club','Juventude','Avaí','Fortaleza','Botafogo-SP'],
  'Serie B':['Arezzo','Ascoli','Avellino','Benevento','Carrarese','Catanzaro','Cesena','Cremonese','Empoli','Hellas Verona','Juve Stabia','L.R. Vicenza','Mantova','Modena','Padova','Palermo','Pisa','Sampdoria','Südtirol','Virtus Entella'],
  'Ligue 2':['Annecy','Boulogne','Clermont Foot','Dijon','Dunkerque','Guingamp','Grenoble','Laval','Metz','Montpellier','Nancy','Nantes','Pau','Saint-Étienne','Red Star','Reims','Rodez','Sochaux']
};

const TRANSFER_MARKET_CLUBS = [
  // GER 68–72: divisões inferiores das cinco grandes ligas.
  ...MARKET_LEAGUE_POOLS['EFL Championship'].map((name,i)=>({name,countryCode:'ENG',league:'EFL Championship',cup:'FA Cup',divisionLevel:2,marketTier:'development',minOverall:68,maxOverall:i<8?73:75,strength:69+(i%6)})),
  ...MARKET_LEAGUE_POOLS['EFL League One'].map((name,i)=>({name,countryCode:'ENG',league:'EFL League One',cup:'FA Cup',divisionLevel:3,marketTier:'development',minOverall:68,maxOverall:i<8?72:74,strength:66+(i%5)})),
  ...MARKET_LEAGUE_POOLS['2. Bundesliga'].map((name,i)=>({name,countryCode:'DE',league:'2. Bundesliga',cup:'DFB-Pokal',divisionLevel:2,marketTier:'development',minOverall:68,maxOverall:i<7?74:76,strength:69+(i%6)})),
  ...MARKET_LEAGUE_POOLS['LALIGA HYPERMOTION'].map((name,i)=>({name,countryCode:'ES',league:'LALIGA HYPERMOTION',cup:'Copa do Rei',divisionLevel:2,marketTier:'development',minOverall:68,maxOverall:i<8?74:76,strength:68+(i%7)})),
  ...MARKET_LEAGUE_POOLS['Liga Portugal 2'].map((name,i)=>({name,countryCode:'PT',league:'Liga Portugal 2',cup:'Taça de Portugal',divisionLevel:2,marketTier:'development',minOverall:68,maxOverall:i<8?73:75,strength:67+(i%6)})),
  ...MARKET_LEAGUE_POOLS['Série B'].map((name,i)=>({name,countryCode:'BR',league:'Série B',cup:'Copa do Brasil',divisionLevel:2,marketTier:'development',minOverall:68,maxOverall:i<8?74:76,strength:68+(i%6)})),
  ...MARKET_LEAGUE_POOLS['Serie B'].map((name,i)=>({name,countryCode:'IT',league:'Serie B',cup:'Coppa Italia',divisionLevel:2,marketTier:'development',minOverall:68,maxOverall:i<8?74:76,strength:68+(i%7)})),
  ...MARKET_LEAGUE_POOLS['Ligue 2'].map((name,i)=>({name,countryCode:'FR',league:'Ligue 2',cup:'Coupe de France',divisionLevel:2,marketTier:'development',minOverall:68,maxOverall:i<8?74:76,strength:68+(i%7)})),

  // GER 68–76: ligas europeias de menor expressão, mas com clubes tradicionais.
  {name:'Red Bull Salzburg',countryCode:'AT',league:'Austrian Bundesliga',cup:'ÖFB-Cup',marketTier:'development',minOverall:69,maxOverall:78,strength:78},
  {name:'Sturm Graz',countryCode:'AT',league:'Austrian Bundesliga',cup:'ÖFB-Cup',marketTier:'development',minOverall:68,maxOverall:77,strength:75},
  {name:'Rapid Wien',countryCode:'AT',league:'Austrian Bundesliga',cup:'ÖFB-Cup',marketTier:'development',minOverall:68,maxOverall:76,strength:73},
  {name:'Austria Wien',countryCode:'AT',league:'Austrian Bundesliga',cup:'ÖFB-Cup',marketTier:'development',minOverall:68,maxOverall:75,strength:72},
  {name:'Young Boys',countryCode:'CH',league:'Swiss Super League',cup:'Swiss Cup',marketTier:'development',minOverall:69,maxOverall:78,strength:77},
  {name:'Basel',countryCode:'CH',league:'Swiss Super League',cup:'Swiss Cup',marketTier:'development',minOverall:68,maxOverall:77,strength:76},
  {name:'Servette',countryCode:'CH',league:'Swiss Super League',cup:'Swiss Cup',marketTier:'development',minOverall:68,maxOverall:76,strength:73},
  {name:'FC Zürich',countryCode:'CH',league:'Swiss Super League',cup:'Swiss Cup',marketTier:'development',minOverall:68,maxOverall:76,strength:73},
  {name:'Copenhagen',countryCode:'DK',league:'Danish Superliga',cup:'Danish Cup',marketTier:'development',minOverall:69,maxOverall:78,strength:77},
  {name:'Midtjylland',countryCode:'DK',league:'Danish Superliga',cup:'Danish Cup',marketTier:'development',minOverall:68,maxOverall:77,strength:76},
  {name:'Brøndby',countryCode:'DK',league:'Danish Superliga',cup:'Danish Cup',marketTier:'development',minOverall:68,maxOverall:76,strength:73},
  {name:'Nordsjælland',countryCode:'DK',league:'Danish Superliga',cup:'Danish Cup',marketTier:'development',minOverall:68,maxOverall:76,strength:72},
  {name:'Olympiacos',countryCode:'GR',league:'Greek Super League',cup:'Greek Cup',marketTier:'development',minOverall:70,maxOverall:80,strength:79},
  {name:'Panathinaikos',countryCode:'GR',league:'Greek Super League',cup:'Greek Cup',marketTier:'development',minOverall:69,maxOverall:79,strength:77},
  {name:'AEK Athens',countryCode:'GR',league:'Greek Super League',cup:'Greek Cup',marketTier:'development',minOverall:69,maxOverall:79,strength:77},
  {name:'PAOK',countryCode:'GR',league:'Greek Super League',cup:'Greek Cup',marketTier:'development',minOverall:69,maxOverall:79,strength:77},
  {name:'Sparta Praha',countryCode:'CZ',league:'Czech First League',cup:'Czech Cup',marketTier:'development',minOverall:69,maxOverall:78,strength:77},
  {name:'Slavia Praha',countryCode:'CZ',league:'Czech First League',cup:'Czech Cup',marketTier:'development',minOverall:69,maxOverall:78,strength:78},
  {name:'Viktoria Plzeň',countryCode:'CZ',league:'Czech First League',cup:'Czech Cup',marketTier:'development',minOverall:68,maxOverall:77,strength:75},
  {name:'Legia Warszawa',countryCode:'PL',league:'Ekstraklasa',cup:'Polish Cup',marketTier:'development',minOverall:68,maxOverall:77,strength:75},
  {name:'Lech Poznań',countryCode:'PL',league:'Ekstraklasa',cup:'Polish Cup',marketTier:'development',minOverall:68,maxOverall:77,strength:75},
  {name:'Raków Częstochowa',countryCode:'PL',league:'Ekstraklasa',cup:'Polish Cup',marketTier:'development',minOverall:68,maxOverall:76,strength:73},
  {name:'Dinamo Zagreb',countryCode:'HR',league:'HNL',cup:'Croatian Cup',marketTier:'development',minOverall:69,maxOverall:78,strength:78},
  {name:'Hajduk Split',countryCode:'HR',league:'HNL',cup:'Croatian Cup',marketTier:'development',minOverall:68,maxOverall:77,strength:75},
  {name:'Rijeka',countryCode:'HR',league:'HNL',cup:'Croatian Cup',marketTier:'development',minOverall:68,maxOverall:76,strength:73},
  {name:'Red Star Belgrade',countryCode:'RS',league:'Serbian SuperLiga',cup:'Serbian Cup',marketTier:'development',minOverall:69,maxOverall:79,strength:79},
  {name:'Partizan',countryCode:'RS',league:'Serbian SuperLiga',cup:'Serbian Cup',marketTier:'development',minOverall:68,maxOverall:77,strength:74},
  {name:'Bodø/Glimt',countryCode:'NO',league:'Eliteserien',cup:'Norwegian Cup',marketTier:'development',minOverall:69,maxOverall:78,strength:77},
  {name:'Molde',countryCode:'NO',league:'Eliteserien',cup:'Norwegian Cup',marketTier:'development',minOverall:68,maxOverall:76,strength:74},
  {name:'Rosenborg',countryCode:'NO',league:'Eliteserien',cup:'Norwegian Cup',marketTier:'development',minOverall:68,maxOverall:75,strength:72},
  {name:'Malmö FF',countryCode:'SE',league:'Allsvenskan',cup:'Swedish Cup',marketTier:'development',minOverall:69,maxOverall:77,strength:76},
  {name:'Djurgårdens IF',countryCode:'SE',league:'Allsvenskan',cup:'Swedish Cup',marketTier:'development',minOverall:68,maxOverall:76,strength:73},
  {name:'AIK',countryCode:'SE',league:'Allsvenskan',cup:'Swedish Cup',marketTier:'development',minOverall:68,maxOverall:75,strength:72},
  {name:'FCSB',countryCode:'RO',league:'Romanian SuperLiga',cup:'Romanian Cup',marketTier:'development',minOverall:68,maxOverall:77,strength:75},
  {name:'CFR Cluj',countryCode:'RO',league:'Romanian SuperLiga',cup:'Romanian Cup',marketTier:'development',minOverall:68,maxOverall:76,strength:74},
  {name:'Shakhtar Donetsk',countryCode:'UA',league:'Ukrainian Premier League',cup:'Ukrainian Cup',marketTier:'development',minOverall:70,maxOverall:80,strength:79},
  {name:'Dynamo Kyiv',countryCode:'UA',league:'Ukrainian Premier League',cup:'Ukrainian Cup',marketTier:'development',minOverall:69,maxOverall:78,strength:76},

  // GER 73–80: Ásia e América do Norte.
  {name:'Atlanta United',countryCode:'US',league:'Major League Soccer',cup:'U.S. Open Cup',marketTier:'global',minOverall:73,maxOverall:80,strength:75},
  {name:'Inter Miami',countryCode:'US',league:'Major League Soccer',cup:'U.S. Open Cup',marketTier:'global',minOverall:74,maxOverall:82,strength:79},
  {name:'Los Angeles FC',countryCode:'US',league:'Major League Soccer',cup:'U.S. Open Cup',marketTier:'global',minOverall:73,maxOverall:81,strength:78},
  {name:'Seattle Sounders',countryCode:'US',league:'Major League Soccer',cup:'U.S. Open Cup',marketTier:'global',minOverall:73,maxOverall:80,strength:77},
  {name:'Columbus Crew',countryCode:'US',league:'Major League Soccer',cup:'U.S. Open Cup',marketTier:'global',minOverall:73,maxOverall:80,strength:77},
  {name:'FC Cincinnati',countryCode:'US',league:'Major League Soccer',cup:'U.S. Open Cup',marketTier:'global',minOverall:73,maxOverall:80,strength:76},
  {name:'New York City FC',countryCode:'US',league:'Major League Soccer',cup:'U.S. Open Cup',marketTier:'global',minOverall:73,maxOverall:80,strength:76},
  {name:'Orlando City',countryCode:'US',league:'Major League Soccer',cup:'U.S. Open Cup',marketTier:'global',minOverall:73,maxOverall:80,strength:75},
  {name:'Club América',countryCode:'MX',league:'Liga MX',cup:'Copa MX',marketTier:'global',minOverall:74,maxOverall:82,strength:81},
  {name:'Monterrey',countryCode:'MX',league:'Liga MX',cup:'Copa MX',marketTier:'global',minOverall:74,maxOverall:81,strength:80},
  {name:'Tigres UANL',countryCode:'MX',league:'Liga MX',cup:'Copa MX',marketTier:'global',minOverall:74,maxOverall:81,strength:80},
  {name:'Cruz Azul',countryCode:'MX',league:'Liga MX',cup:'Copa MX',marketTier:'global',minOverall:73,maxOverall:80,strength:78},
  {name:'Pachuca',countryCode:'MX',league:'Liga MX',cup:'Copa MX',marketTier:'global',minOverall:73,maxOverall:80,strength:77},
  {name:'Toluca',countryCode:'MX',league:'Liga MX',cup:'Copa MX',marketTier:'global',minOverall:73,maxOverall:80,strength:77},
  {name:'Urawa Red Diamonds',countryCode:'JP',league:'J1 League',cup:'Copa do Imperador',marketTier:'global',minOverall:73,maxOverall:80,strength:76},
  {name:'Vissel Kobe',countryCode:'JP',league:'J1 League',cup:'Copa do Imperador',marketTier:'global',minOverall:73,maxOverall:80,strength:77},
  {name:'Kawasaki Frontale',countryCode:'JP',league:'J1 League',cup:'Copa do Imperador',marketTier:'global',minOverall:73,maxOverall:80,strength:76},
  {name:'Yokohama F. Marinos',countryCode:'JP',league:'J1 League',cup:'Copa do Imperador',marketTier:'global',minOverall:73,maxOverall:80,strength:76},
  {name:'Kashima Antlers',countryCode:'JP',league:'J1 League',cup:'Copa do Imperador',marketTier:'global',minOverall:73,maxOverall:80,strength:76},
  {name:'Ulsan HD',countryCode:'KR',league:'K League 1',cup:'Korean FA Cup',marketTier:'global',minOverall:73,maxOverall:80,strength:77},
  {name:'Jeonbuk Hyundai Motors',countryCode:'KR',league:'K League 1',cup:'Korean FA Cup',marketTier:'global',minOverall:73,maxOverall:80,strength:77},
  {name:'FC Seoul',countryCode:'KR',league:'K League 1',cup:'Korean FA Cup',marketTier:'global',minOverall:73,maxOverall:79,strength:75},
  {name:'Al-Sadd',countryCode:'QA',league:'Qatar Stars League',cup:'Emir of Qatar Cup',marketTier:'global',minOverall:73,maxOverall:80,strength:77},
  {name:'Al-Duhail',countryCode:'QA',league:'Qatar Stars League',cup:'Emir of Qatar Cup',marketTier:'global',minOverall:73,maxOverall:80,strength:76},
  {name:'Al-Ain',countryCode:'AE',league:'UAE Pro League',cup:'UAE President Cup',marketTier:'global',minOverall:73,maxOverall:80,strength:78},
  {name:'Shabab Al-Ahli',countryCode:'AE',league:'UAE Pro League',cup:'UAE President Cup',marketTier:'global',minOverall:73,maxOverall:80,strength:76},

  // GER 78–84: segundo/primeiro escalão europeu.
  {name:'Celtic',countryCode:'SCO',league:'Scottish Premiership',cup:'Scottish Cup',marketTier:'upper',minOverall:78,maxOverall:85,strength:82},
  {name:'Rangers',countryCode:'SCO',league:'Scottish Premiership',cup:'Scottish Cup',marketTier:'upper',minOverall:78,maxOverall:85,strength:81},
  {name:'Galatasaray',countryCode:'TR',league:'Süper Lig',cup:'Copa da Turquia',marketTier:'upper',minOverall:79,maxOverall:86,strength:84},
  {name:'Fenerbahçe',countryCode:'TR',league:'Süper Lig',cup:'Copa da Turquia',marketTier:'upper',minOverall:79,maxOverall:86,strength:83},
  {name:'Beşiktaş',countryCode:'TR',league:'Süper Lig',cup:'Copa da Turquia',marketTier:'upper',minOverall:78,maxOverall:85,strength:81},
  {name:'PSV',countryCode:'NL',league:'Eredivisie',cup:'KNVB Beker',marketTier:'upper',minOverall:79,maxOverall:86,strength:85},
  {name:'Feyenoord',countryCode:'NL',league:'Eredivisie',cup:'KNVB Beker',marketTier:'upper',minOverall:79,maxOverall:86,strength:84},
  {name:'AZ Alkmaar',countryCode:'NL',league:'Eredivisie',cup:'KNVB Beker',marketTier:'upper',minOverall:78,maxOverall:84,strength:81},
  {name:'Marseille',countryCode:'FR',league:'Ligue 1',cup:'Coupe de France',marketTier:'upper',minOverall:80,maxOverall:86,strength:85},
  {name:'Lyon',countryCode:'FR',league:'Ligue 1',cup:'Coupe de France',marketTier:'upper',minOverall:79,maxOverall:85,strength:82},
  {name:'Monaco',countryCode:'FR',league:'Ligue 1',cup:'Coupe de France',marketTier:'upper',minOverall:80,maxOverall:86,strength:85},
  {name:'Lille',countryCode:'FR',league:'Ligue 1',cup:'Coupe de France',marketTier:'upper',minOverall:79,maxOverall:85,strength:83},
  {name:'Roma',countryCode:'IT',league:'Serie A',cup:'Coppa Italia',marketTier:'upper',minOverall:80,maxOverall:86,strength:84},
  {name:'Lazio',countryCode:'IT',league:'Serie A',cup:'Coppa Italia',marketTier:'upper',minOverall:79,maxOverall:85,strength:82},
  {name:'Atalanta',countryCode:'IT',league:'Serie A',cup:'Coppa Italia',marketTier:'upper',minOverall:80,maxOverall:86,strength:85},
  {name:'Fiorentina',countryCode:'IT',league:'Serie A',cup:'Coppa Italia',marketTier:'upper',minOverall:78,maxOverall:84,strength:81},
  {name:'Bayer Leverkusen',countryCode:'DE',league:'Bundesliga',cup:'DFB-Pokal',marketTier:'upper',minOverall:81,maxOverall:87,strength:87},
  {name:'RB Leipzig',countryCode:'DE',league:'Bundesliga',cup:'DFB-Pokal',marketTier:'upper',minOverall:80,maxOverall:86,strength:85},
  {name:'Eintracht Frankfurt',countryCode:'DE',league:'Bundesliga',cup:'DFB-Pokal',marketTier:'upper',minOverall:79,maxOverall:85,strength:83},
  {name:'Stuttgart',countryCode:'DE',league:'Bundesliga',cup:'DFB-Pokal',marketTier:'upper',minOverall:79,maxOverall:85,strength:83},
  {name:'Villarreal',countryCode:'ES',league:'LaLiga',cup:'Copa do Rei',marketTier:'upper',minOverall:79,maxOverall:85,strength:83},
  {name:'Real Sociedad',countryCode:'ES',league:'LaLiga',cup:'Copa do Rei',marketTier:'upper',minOverall:79,maxOverall:85,strength:82},
  {name:'Betis',countryCode:'ES',league:'LaLiga',cup:'Copa do Rei',marketTier:'upper',minOverall:79,maxOverall:85,strength:82},
  {name:'Sevilla',countryCode:'ES',league:'LaLiga',cup:'Copa do Rei',marketTier:'upper',minOverall:78,maxOverall:84,strength:80},
  {name:'Aston Villa',countryCode:'ENG',league:'Premier League',cup:'FA Cup',marketTier:'upper',minOverall:80,maxOverall:86,strength:85},
  {name:'Newcastle United',countryCode:'ENG',league:'Premier League',cup:'FA Cup',marketTier:'upper',minOverall:80,maxOverall:86,strength:85},
  {name:'Tottenham',countryCode:'ENG',league:'Premier League',cup:'FA Cup',marketTier:'upper',minOverall:80,maxOverall:86,strength:84},
  {name:'Brighton',countryCode:'ENG',league:'Premier League',cup:'FA Cup',marketTier:'upper',minOverall:78,maxOverall:84,strength:81},

  // GER 84+: primeiro escalão europeu.
  {name:'Manchester United',countryCode:'ENG',league:'Premier League',cup:'FA Cup',marketTier:'elite',minOverall:84,maxOverall:99,strength:87},
  {name:'Arsenal',countryCode:'ENG',league:'Premier League',cup:'FA Cup',marketTier:'elite',minOverall:84,maxOverall:99,strength:90},
  {name:'Chelsea',countryCode:'ENG',league:'Premier League',cup:'FA Cup',marketTier:'elite',minOverall:84,maxOverall:99,strength:89},
  {name:'Liverpool',countryCode:'ENG',league:'Premier League',cup:'FA Cup',marketTier:'elite',minOverall:85,maxOverall:99,strength:91},
  {name:'Manchester City',countryCode:'ENG',league:'Premier League',cup:'FA Cup',marketTier:'elite',minOverall:86,maxOverall:99,strength:92},
  {name:'Barcelona',countryCode:'ES',league:'LaLiga',cup:'Copa do Rei',marketTier:'elite',minOverall:86,maxOverall:99,strength:93},
  {name:'Real Madrid',countryCode:'ES',league:'LaLiga',cup:'Copa do Rei',marketTier:'elite',minOverall:87,maxOverall:99,strength:94},
  {name:'Atlético de Madrid',countryCode:'ES',league:'LaLiga',cup:'Copa do Rei',marketTier:'elite',minOverall:84,maxOverall:99,strength:89},
  {name:'Bayern de Munique',countryCode:'DE',league:'Bundesliga',cup:'DFB-Pokal',marketTier:'elite',minOverall:86,maxOverall:99,strength:93},
  {name:'Borussia Dortmund',countryCode:'DE',league:'Bundesliga',cup:'DFB-Pokal',marketTier:'elite',minOverall:84,maxOverall:99,strength:88},
  {name:'Inter de Milão',countryCode:'IT',league:'Serie A',cup:'Coppa Italia',marketTier:'elite',minOverall:85,maxOverall:99,strength:90},
  {name:'Milan',countryCode:'IT',league:'Serie A',cup:'Coppa Italia',marketTier:'elite',minOverall:84,maxOverall:99,strength:87},
  {name:'Juventus',countryCode:'IT',league:'Serie A',cup:'Coppa Italia',marketTier:'elite',minOverall:84,maxOverall:99,strength:87},
  {name:'Napoli',countryCode:'IT',league:'Serie A',cup:'Coppa Italia',marketTier:'elite',minOverall:84,maxOverall:99,strength:87},
  {name:'Paris Saint-Germain',countryCode:'FR',league:'Ligue 1',cup:'Coupe de France',marketTier:'elite',minOverall:86,maxOverall:99,strength:92}
];

const CLUB_THEMES = {
  'Santos':{accent:'#f4f4f4',bg:'#070707',panel:'#111111',panel2:'#191919',border:'#343434'},
  'Cruzeiro':{accent:'#68a7ff',bg:'#06142b',panel:'#0b2346',panel2:'#11315f',border:'#244d82'},
  'Chelsea':{accent:'#6aa8ff',bg:'#06142e',panel:'#0b2350',panel2:'#103168',border:'#21477e'},
  'Barcelona':{accent:'#f5c84b',bg:'#170715',panel:'#28102b',panel2:'#361542',border:'#5c265f'},
  'Real Madrid':{accent:'#d6c7ff',bg:'#111018',panel:'#1c1a28',panel2:'#272338',border:'#443d5c'},
  'Bayern de Munique':{accent:'#ff6f7a',bg:'#21080d',panel:'#341016',panel2:'#48151d',border:'#6c2630'},
  'Benfica':{accent:'#ff6d6d',bg:'#220909',panel:'#351010',panel2:'#481717',border:'#6b2929'},
  'Flamengo':{accent:'#ff5151',bg:'#160707',panel:'#290b0b',panel2:'#3b1010',border:'#5e2020'},
  'Palmeiras':{accent:'#65e69a',bg:'#06170f',panel:'#0b281b',panel2:'#103a27',border:'#245c42'},
  'Grêmio':{accent:'#69c9ff',bg:'#071722',panel:'#0c2838',panel2:'#113b52',border:'#285d78'},
  'Internacional':{accent:'#ff6a6a',bg:'#200808',panel:'#330d0d',panel2:'#481313',border:'#702727'},
  'Manchester City':{accent:'#89d7ff',bg:'#071b25',panel:'#0d2b39',panel2:'#123e50',border:'#2b6074'},
  'Liverpool':{accent:'#ff6b6b',bg:'#1d0909',panel:'#310e0e',panel2:'#451515',border:'#6d2727'},
  'Arsenal':{accent:'#ff7171',bg:'#21090d',panel:'#350f16',panel2:'#491620',border:'#6c2934'},
  'Paris Saint-Germain':{accent:'#ff6c78',bg:'#07132b',panel:'#0c2148',panel2:'#11305f',border:'#294d7d'},
  'Ajax':{accent:'#ff7171',bg:'#1e0a0a',panel:'#321010',panel2:'#461717',border:'#692b2b'},
  'Porto':{accent:'#74a9ff',bg:'#07152b',panel:'#0c2247',panel2:'#12325f',border:'#28517e'}
};


Object.assign(CLUB_THEMES,{
  'Santos':{accent:'#f5f5f5',secondary:'#bfc2c4',bg:'#050505',panel:'#101010',panel2:'#1a1a1a',border:'#3b3b3b',buttonText:'#080808'},
  'Cruzeiro':{accent:'#3277e8',secondary:'#ffffff',bg:'#04142e',panel:'#09234a',panel2:'#10366f',border:'#2a5791',buttonText:'#ffffff'},
  'Chelsea':{accent:'#2468d8',secondary:'#ffffff',bg:'#04132e',panel:'#09224d',panel2:'#0f3473',border:'#2a5791',buttonText:'#ffffff'},
  'Bayern de Munique':{accent:'#e33445',secondary:'#ffffff',bg:'#21070b',panel:'#371016',panel2:'#50151e',border:'#7c2b36',buttonText:'#ffffff'},
  'Barcelona':{accent:'#d8ad2f',secondary:'#2d6cc5',bg:'#160716',panel:'#29102d',panel2:'#3c1748',border:'#642b68',buttonText:'#160716'},
  'Real Madrid':{accent:'#f4f1ff',secondary:'#806bc9',bg:'#0d0c14',panel:'#1b1927',panel2:'#29253c',border:'#50496b',buttonText:'#17131f'},
  'Benfica':{accent:'#e63c45',secondary:'#ffffff',bg:'#210707',panel:'#351010',panel2:'#4c1717',border:'#762929',buttonText:'#ffffff'},
  'Porto':{accent:'#2c6fd5',secondary:'#ffffff',bg:'#06142c',panel:'#0b2249',panel2:'#10336b',border:'#2a5790',buttonText:'#ffffff'},
  'Sporting CP':{accent:'#2ea968',secondary:'#ffffff',bg:'#051b12',panel:'#0b2d1f',panel2:'#10452e',border:'#296747',buttonText:'#ffffff'},
  'Braga':{accent:'#e24b52',secondary:'#ffffff',bg:'#21090b',panel:'#351116',panel2:'#4c1820',border:'#74303a',buttonText:'#ffffff'},
  'Borussia Dortmund':{accent:'#f0d52f',secondary:'#111111',bg:'#0d0d08',panel:'#1c1b0c',panel2:'#302d10',border:'#5d5720',buttonText:'#111111'},
  'Napoli':{accent:'#55b8e8',secondary:'#ffffff',bg:'#071a25',panel:'#0d2b3a',panel2:'#124358',border:'#2c667e',buttonText:'#071a25'},
  'Atlético de Madrid':{accent:'#e54654',secondary:'#ffffff',bg:'#1d080c',panel:'#311017',panel2:'#481620',border:'#73303b',buttonText:'#ffffff'},
  'Arsenal':{accent:'#df3340',secondary:'#ffffff',bg:'#20070b',panel:'#351018',panel2:'#4b1721',border:'#74303a',buttonText:'#ffffff'},
  'Liverpool':{accent:'#d9343f',secondary:'#ffffff',bg:'#1b0708',panel:'#300e11',panel2:'#451519',border:'#702a30',buttonText:'#ffffff'},
  'Manchester City':{accent:'#6ec4ec',secondary:'#ffffff',bg:'#071b27',panel:'#0c2d3d',panel2:'#12475d',border:'#2c6a81',buttonText:'#071b27'},
  'Inter de Milão':{accent:'#397be3',secondary:'#111111',bg:'#050d1f',panel:'#0a1935',panel2:'#0e2852',border:'#24497a',buttonText:'#ffffff'},
  'Paris Saint-Germain':{accent:'#2458b7',secondary:'#e43c4b',bg:'#061129',panel:'#0b2048',panel2:'#103264',border:'#294e80',buttonText:'#ffffff'},
  'Flamengo':{accent:'#d83039',secondary:'#111111',bg:'#150505',panel:'#290b0c',panel2:'#3e1013',border:'#652329',buttonText:'#ffffff'},
  'Palmeiras':{accent:'#29965c',secondary:'#ffffff',bg:'#05170f',panel:'#0a291b',panel2:'#0f4029',border:'#276344',buttonText:'#ffffff'},
  'Grêmio':{accent:'#4fafe1',secondary:'#ffffff',bg:'#061722',panel:'#0b2a3a',panel2:'#10435a',border:'#2a647e',buttonText:'#071722'},
  'Internacional':{accent:'#dd3942',secondary:'#ffffff',bg:'#1d0708',panel:'#321013',panel2:'#48171b',border:'#722b31',buttonText:'#ffffff'},
  'Ajax':{accent:'#de3c45',secondary:'#ffffff',bg:'#1d0808',panel:'#311010',panel2:'#471717',border:'#6d2b2b',buttonText:'#ffffff'}
});


/* ===== CareerSim V6: temas ampliados por clube ===== */
Object.assign(CLUB_THEMES,{
  "Corinthians":{accent:'#f4f4f4',secondary:'#111111',bg:'#050505',panel:'#111111',panel2:'#1d1d1d',border:'#383838',buttonText:'#090909'},
  "São Paulo":{accent:'#e33445',secondary:'#ffffff',bg:'#160708',panel:'#2b0d10',panel2:'#3e1418',border:'#67272d',buttonText:'#ffffff'},
  "Atlético Mineiro":{accent:'#f2f2f2',secondary:'#111111',bg:'#050505',panel:'#111111',panel2:'#1a1a1a',border:'#383838',buttonText:'#080808'},
  "Fluminense":{accent:'#7a1832',secondary:'#1f6d4a',bg:'#12080c',panel:'#241018',panel2:'#321821',border:'#5b2f3c',buttonText:'#ffffff'},
  "Botafogo":{accent:'#f5f5f5',secondary:'#111111',bg:'#050505',panel:'#111111',panel2:'#1b1b1b',border:'#393939',buttonText:'#080808'},
  "Vasco da Gama":{accent:'#f5f5f5',secondary:'#c52d34',bg:'#070707',panel:'#121212',panel2:'#1d1d1d',border:'#3c3c3c',buttonText:'#080808'},
  "Athletico Paranaense":{accent:'#df3340',secondary:'#111111',bg:'#150608',panel:'#2a0d11',panel2:'#3d1319',border:'#65252d',buttonText:'#ffffff'},
  "Bahia":{accent:'#2476d4',secondary:'#e33c48',bg:'#06152a',panel:'#0b2445',panel2:'#113568',border:'#2b5d95',buttonText:'#ffffff'},
  "Vitória":{accent:'#d9343f',secondary:'#111111',bg:'#150608',panel:'#2a0d10',panel2:'#3d1418',border:'#67272d',buttonText:'#ffffff'},
  "Coritiba":{accent:'#2a9c63',secondary:'#ffffff',bg:'#05160f',panel:'#0a291c',panel2:'#0f3d29',border:'#276246',buttonText:'#ffffff'},
  "Red Bull Bragantino":{accent:'#e9edf4',secondary:'#d32e3d',bg:'#0b0f16',panel:'#151c29',panel2:'#1e2a3c',border:'#3d4c62',buttonText:'#0c1118'},
  "Manchester United":{accent:'#df2f3d',secondary:'#ffffff',bg:'#1d0709',panel:'#331014',panel2:'#49171d',border:'#742d35',buttonText:'#ffffff'},
  "Tottenham":{accent:'#f5f5f5',secondary:'#183a78',bg:'#07101f',panel:'#0c1d39',panel2:'#112b54',border:'#2a4d7d',buttonText:'#09111e'},
  "Newcastle United":{accent:'#f3f3f3',secondary:'#111111',bg:'#050505',panel:'#111111',panel2:'#1c1c1c',border:'#3a3a3a',buttonText:'#080808'},
  "Everton":{accent:'#2f6ed2',secondary:'#ffffff',bg:'#06152f',panel:'#0b234c',panel2:'#11356f',border:'#2b5791',buttonText:'#ffffff'},
  "Aston Villa":{accent:'#7f2040',secondary:'#82c7ef',bg:'#160811',panel:'#2a101b',panel2:'#3d1726',border:'#663045',buttonText:'#ffffff'},
  "West Ham":{accent:'#7f203a',secondary:'#7cc9ee',bg:'#160811',panel:'#2a101a',panel2:'#3d1725',border:'#663043',buttonText:'#ffffff'},
  "Nottingham Forest":{accent:'#d9323d',secondary:'#ffffff',bg:'#1a0708',panel:'#2f0f12',panel2:'#45161a',border:'#712b31',buttonText:'#ffffff'},
  "Leeds United":{accent:'#f5f5f5',secondary:'#2f66bf',bg:'#07101f',panel:'#0c1d38',panel2:'#112b52',border:'#2a4b78',buttonText:'#09111e'},
  "Brighton":{accent:'#3d86df',secondary:'#ffffff',bg:'#06172f',panel:'#0b284d',panel2:'#103a6e',border:'#2b5c93',buttonText:'#ffffff'},
  "Juventus":{accent:'#f5f5f5',secondary:'#111111',bg:'#050505',panel:'#111111',panel2:'#1d1d1d',border:'#3b3b3b',buttonText:'#080808'},
  "Milan":{accent:'#d9343f',secondary:'#111111',bg:'#170708',panel:'#2d0e11',panel2:'#411419',border:'#6b282f',buttonText:'#ffffff'},
  "Roma":{accent:'#8b1e2d',secondary:'#e0a52b',bg:'#19090c',panel:'#301116',panel2:'#451820',border:'#71303a',buttonText:'#ffffff'},
  "Lazio":{accent:'#7cc7ec',secondary:'#ffffff',bg:'#071925',panel:'#0d2b3b',panel2:'#124258',border:'#2d667e',buttonText:'#07141e'},
  "Atalanta":{accent:'#397bd8',secondary:'#111111',bg:'#050e1e',panel:'#0a1a36',panel2:'#0f2951',border:'#274a7a',buttonText:'#ffffff'},
  "Fiorentina":{accent:'#7543b5',secondary:'#ffffff',bg:'#10091d',panel:'#1d1033',panel2:'#2a1749',border:'#503071',buttonText:'#ffffff'},
  "Marseille":{accent:'#5cc5e9',secondary:'#ffffff',bg:'#061a25',panel:'#0b2b3a',panel2:'#104357',border:'#2c667d',buttonText:'#07151e'},
  "Monaco":{accent:'#df3b45',secondary:'#ffffff',bg:'#1c0709',panel:'#310f13',panel2:'#47161b',border:'#712b32',buttonText:'#ffffff'},
  "Lyon":{accent:'#e23d49',secondary:'#274f9a',bg:'#14080d',panel:'#28111c',panel2:'#38182a',border:'#5d3045',buttonText:'#ffffff'},
  "Lille":{accent:'#c72d3b',secondary:'#24345f',bg:'#19070a',panel:'#2f0f14',panel2:'#44161e',border:'#6d2b34',buttonText:'#ffffff'},
  "Nice":{accent:'#d9343f',secondary:'#111111',bg:'#170708',panel:'#2d0f11',panel2:'#421519',border:'#6d2930',buttonText:'#ffffff'},
  "Vitória de Guimarães":{accent:'#f4f4f4',secondary:'#111111',bg:'#050505',panel:'#111111',panel2:'#1b1b1b',border:'#393939',buttonText:'#080808'},
  "Boavista":{accent:'#f4f4f4',secondary:'#111111',bg:'#050505',panel:'#111111',panel2:'#1c1c1c',border:'#3a3a3a',buttonText:'#080808'},
  "Atlético de Madrid":{accent:'#e23d49',secondary:'#ffffff',bg:'#1d080c',panel:'#311017',panel2:'#481620',border:'#73303b',buttonText:'#ffffff'},
  "Athletic Club":{accent:'#df3340',secondary:'#ffffff',bg:'#1d0709',panel:'#321014',panel2:'#48171d',border:'#732d35',buttonText:'#ffffff'},
  "Sevilla":{accent:'#e03943',secondary:'#ffffff',bg:'#1d0709',panel:'#321014',panel2:'#48171d',border:'#722c34',buttonText:'#ffffff'},
  "Valencia":{accent:'#f3f3f3',secondary:'#111111',bg:'#070707',panel:'#131313',panel2:'#1f1f1f',border:'#3f3f3f',buttonText:'#090909'},
  "Villarreal":{accent:'#e6d839',secondary:'#174b8d',bg:'#171607',panel:'#2c2a0d',panel2:'#403c12',border:'#6c6424',buttonText:'#171505'},
  "Real Betis":{accent:'#2fa16a',secondary:'#ffffff',bg:'#051a11',panel:'#0a2d1f',panel2:'#10462f',border:'#296a4a',buttonText:'#ffffff'},
  "Bayer Leverkusen":{accent:'#d9343f',secondary:'#111111',bg:'#170708',panel:'#2d0f11',panel2:'#421519',border:'#6d2930',buttonText:'#ffffff'},
  "RB Leipzig":{accent:'#e53945',secondary:'#ffffff',bg:'#1d080a',panel:'#321014',panel2:'#48171d',border:'#722c34',buttonText:'#ffffff'},
  "Eintracht Frankfurt":{accent:'#d9343f',secondary:'#111111',bg:'#170708',panel:'#2d0f11',panel2:'#421519',border:'#6d2930',buttonText:'#ffffff'},
  "Stuttgart":{accent:'#e13e48',secondary:'#ffffff',bg:'#1d0809',panel:'#321014',panel2:'#48171d',border:'#722c34',buttonText:'#ffffff'},
  "Werder Bremen":{accent:'#2b9d61',secondary:'#ffffff',bg:'#05180f',panel:'#0a2b1b',panel2:'#10412a',border:'#286747',buttonText:'#ffffff'},
  "Borussia Mönchengladbach":{accent:'#f3f3f3',secondary:'#111111',bg:'#050505',panel:'#111111',panel2:'#1c1c1c',border:'#3a3a3a',buttonText:'#080808'},
  "River Plate":{accent:'#e23b47',secondary:'#ffffff',bg:'#1d0809',panel:'#321014',panel2:'#48171d',border:'#722c34',buttonText:'#ffffff'},
  "Boca Juniors":{accent:'#f1cf35',secondary:'#1c4fa3',bg:'#071225',panel:'#0c2143',panel2:'#113263',border:'#2b518b',buttonText:'#111111'},
  "Racing Club":{accent:'#71c7ea',secondary:'#ffffff',bg:'#071925',panel:'#0d2b3b',panel2:'#124258',border:'#2d667e',buttonText:'#07141e'},
  "Independiente":{accent:'#d9343f',secondary:'#ffffff',bg:'#1a0708',panel:'#2f0f12',panel2:'#45161a',border:'#712b31',buttonText:'#ffffff'},
  "San Lorenzo":{accent:'#284d9a',secondary:'#d9343f',bg:'#071024',panel:'#0c1d41',panel2:'#112d5e',border:'#2a4f86',buttonText:'#ffffff'},
  "Nacional":{accent:'#e33b46',secondary:'#2f66bf',bg:'#15070a',panel:'#2a1018',panel2:'#3d1722',border:'#663041',buttonText:'#ffffff'},
  "Peñarol":{accent:'#e8cc32',secondary:'#111111',bg:'#171505',panel:'#2b280b',panel2:'#3f3a10',border:'#6a6121',buttonText:'#111111'},
  "LA Galaxy":{accent:'#f4f4f4',secondary:'#1f4c8e',bg:'#07101d',panel:'#0c1c35',panel2:'#11294e',border:'#294973',buttonText:'#09111d'},
  "Inter Miami":{accent:'#f29bb7',secondary:'#111111',bg:'#1a0b12',panel:'#30121f',panel2:'#45192d',border:'#71324a',buttonText:'#13080d'}
});


/* ===== CareerSim V7: 200 jogadores para o DNA (150 históricos + 50 atuais) ===== */
const HISTORICAL_DRAFT_RAW = [
  ["Pelé", 99, "complete", "ATA"],
  ["Diego Maradona", 98, "creator", "MEI"],
  ["Johan Cruyff", 97, "complete", "ATA"],
  ["Franz Beckenbauer", 97, "defender", "ZAG"],
  ["Alfredo Di Stéfano", 97, "complete", "ATA"],
  ["Ronaldo Nazário", 97, "finisher", "ATA"],
  ["Zinedine Zidane", 96, "creator", "MEI"],
  ["Ferenc Puskás", 96, "finisher", "ATA"],
  ["Garrincha", 96, "winger", "PD"],
  ["Michel Platini", 96, "creator", "MEI"],
  ["Marco van Basten", 96, "finisher", "ATA"],
  ["Eusébio", 96, "complete", "ATA"],
  ["George Best", 95, "winger", "PD"],
  ["Ronaldinho", 95, "dribbler", "MEI"],
  ["Romário", 95, "finisher", "ATA"],
  ["Bobby Charlton", 95, "complete", "MEI"],
  ["Lev Yashin", 95, "keeper", "GOL"],
  ["Paolo Maldini", 95, "defender", "ZAG"],
  ["Xavi", 95, "midfielder", "MC"],
  ["Andrés Iniesta", 95, "creator", "MC"],
  ["Thierry Henry", 95, "complete", "ATA"],
  ["Gerd Müller", 95, "finisher", "ATA"],
  ["Franco Baresi", 95, "defender", "ZAG"],
  ["Zico", 95, "creator", "MEI"],
  ["Roberto Baggio", 94, "creator", "ATA"],
  ["Lothar Matthäus", 94, "midfielder", "MC"],
  ["Ruud Gullit", 94, "physical", "MEI"],
  ["Rivaldo", 94, "complete", "MEI"],
  ["Kaká", 94, "complete", "MEI"],
  ["Sergio Ramos", 94, "defender", "ZAG"],
  ["Gianluigi Buffon", 94, "keeper", "GOL"],
  ["Iker Casillas", 94, "keeper", "GOL"],
  ["Cafu", 94, "fullback", "LD"],
  ["Roberto Carlos", 94, "fullback", "LE"],
  ["Andrea Pirlo", 94, "creator", "MC"],
  ["Dennis Bergkamp", 94, "creator", "ATA"],
  ["Kenny Dalglish", 94, "complete", "ATA"],
  ["Giuseppe Meazza", 94, "complete", "ATA"],
  ["Luís Figo", 94, "winger", "PD"],
  ["Karl-Heinz Rummenigge", 94, "complete", "ATA"],
  ["Jairzinho", 94, "winger", "PD"],
  ["Rivelino", 94, "creator", "MEI"],
  ["Didi", 94, "creator", "MC"],
  ["Kevin Keegan", 93, "complete", "ATA"],
  ["Stanley Matthews", 93, "winger", "PD"],
  ["Bobby Moore", 93, "defender", "ZAG"],
  ["Gordon Banks", 93, "keeper", "GOL"],
  ["Peter Schmeichel", 93, "keeper", "GOL"],
  ["Dino Zoff", 93, "keeper", "GOL"],
  ["Gianni Rivera", 93, "creator", "MEI"],
  ["Sandro Mazzola", 93, "complete", "ATA"],
  ["Valentino Mazzola", 93, "complete", "MEI"],
  ["Fabio Cannavaro", 93, "defender", "ZAG"],
  ["Alessandro Nesta", 93, "defender", "ZAG"],
  ["Alessandro Del Piero", 93, "creator", "ATA"],
  ["Francesco Totti", 93, "creator", "MEI"],
  ["Frank Rijkaard", 93, "defender", "VOL"],
  ["Arjen Robben", 93, "winger", "PD"],
  ["Wayne Rooney", 93, "complete", "ATA"],
  ["Steven Gerrard", 93, "midfielder", "MC"],
  ["Alan Shearer", 93, "finisher", "ATA"],
  ["Raúl", 93, "finisher", "ATA"],
  ["Carles Puyol", 93, "defender", "ZAG"],
  ["Luis Suárez Miramontes", 93, "creator", "MEI"],
  ["Raymond Kopa", 93, "creator", "MEI"],
  ["Lilian Thuram", 93, "defender", "ZAG"],
  ["Oliver Kahn", 93, "keeper", "GOL"],
  ["Philipp Lahm", 93, "fullback", "LD"],
  ["Toni Kroos", 93, "creator", "MC"],
  ["Sócrates", 93, "creator", "MC"],
  ["Falcão", 93, "midfielder", "MC"],
  ["Nilton Santos", 93, "fullback", "LE"],
  ["Carlos Alberto Torres", 93, "fullback", "LD"],
  ["Gabriel Batistuta", 93, "finisher", "ATA"],
  ["Mario Kempes", 93, "complete", "ATA"],
  ["Daniel Passarella", 93, "defender", "ZAG"],
  ["Javier Zanetti", 93, "fullback", "LD"],
  ["Sergio Agüero", 93, "finisher", "ATA"],
  ["George Weah", 93, "complete", "ATA"],
  ["Samuel Eto'o", 93, "pace", "ATA"],
  ["Hristo Stoichkov", 93, "complete", "PE"],
  ["Zlatan Ibrahimović", 93, "physical", "ATA"],
  ["Dani Alves", 93, "fullback", "LD"],
  ["Paolo Rossi", 92, "finisher", "ATA"],
  ["Clarence Seedorf", 92, "midfielder", "MC"],
  ["Johan Neeskens", 92, "midfielder", "MC"],
  ["Robin van Persie", 92, "finisher", "ATA"],
  ["Ruud van Nistelrooy", 92, "finisher", "ATA"],
  ["Rui Costa", 92, "creator", "MEI"],
  ["David Beckham", 92, "creator", "MD"],
  ["Frank Lampard", 92, "midfielder", "MC"],
  ["Paul Scholes", 92, "midfielder", "MC"],
  ["John Terry", 92, "defender", "ZAG"],
  ["Ashley Cole", 92, "fullback", "LE"],
  ["Rio Ferdinand", 92, "defender", "ZAG"],
  ["David Villa", 92, "finisher", "ATA"],
  ["Gerard Piqué", 92, "defender", "ZAG"],
  ["Xabi Alonso", 92, "midfielder", "MC"],
  ["Fernando Hierro", 92, "defender", "ZAG"],
  ["Just Fontaine", 92, "finisher", "ATA"],
  ["Marcel Desailly", 92, "defender", "ZAG"],
  ["Miroslav Klose", 92, "finisher", "ATA"],
  ["Bastian Schweinsteiger", 92, "midfielder", "MC"],
  ["Matthias Sammer", 92, "defender", "ZAG"],
  ["Günter Netzer", 92, "creator", "MEI"],
  ["Tostão", 92, "complete", "ATA"],
  ["Juan Román Riquelme", 92, "creator", "MEI"],
  ["Diego Forlán", 92, "complete", "ATA"],
  ["Enzo Francescoli", 92, "creator", "MEI"],
  ["Didier Drogba", 92, "physical", "ATA"],
  ["Yaya Touré", 92, "physical", "MC"],
  ["Gheorghe Hagi", 92, "creator", "MEI"],
  ["Pavel Nedvěd", 92, "midfielder", "MEI"],
  ["Hugo Sánchez", 92, "finisher", "ATA"],
  ["Marcelo", 92, "fullback", "LE"],
  ["Gianfranco Zola", 91, "creator", "ATA"],
  ["Wesley Sneijder", 91, "creator", "MEI"],
  ["Patrick Kluivert", 91, "finisher", "ATA"],
  ["Edgar Davids", 91, "physical", "MC"],
  ["Deco", 91, "creator", "MEI"],
  ["Michael Owen", 91, "pace", "ATA"],
  ["Gary Lineker", 91, "finisher", "ATA"],
  ["Paul Gascoigne", 91, "creator", "MEI"],
  ["Emilio Butragueño", 91, "finisher", "ATA"],
  ["Jean-Pierre Papin", 91, "finisher", "ATA"],
  ["Careca", 91, "finisher", "ATA"],
  ["Obdulio Varela", 91, "physical", "VOL"],
  ["José Nasazzi", 91, "defender", "ZAG"],
  ["Abedi Pelé", 91, "creator", "MEI"],
  ["Dragan Džajić", 91, "winger", "PE"],
  ["Petr Čech", 93, "keeper", "GOL"],
  ["Edwin van der Sar", 93, "keeper", "GOL"],
  ["Patrick Vieira", 93, "physical", "VOL"],
  ["Claude Makélélé", 91, "midfielder", "VOL"],
  ["Michael Laudrup", 93, "creator", "MEI"],
  ["Fernando Torres", 92, "finisher", "ATA"],
  ["Franck Ribéry", 92, "winger", "PE"],
  ["Nemanja Vidić", 91, "defender", "ZAG"],
  ["Jaap Stam", 91, "defender", "ZAG"],
  ["Ruud Krol", 92, "defender", "ZAG"],
  ["Gaetano Scirea", 92, "defender", "ZAG"],
  ["Giacinto Facchetti", 92, "fullback", "LE"],
  ["Bebeto", 91, "finisher", "ATA"],
  ["Djalma Santos", 92, "fullback", "LD"],
  ["Leônidas da Silva", 93, "finisher", "ATA"],
  ["Gunnar Nordahl", 93, "finisher", "ATA"],
  ["Sándor Kocsis", 93, "finisher", "ATA"],
  ["Nándor Hidegkuti", 92, "creator", "MEI"],
  ["Omar Sívori", 92, "dribbler", "ATA"],
  ["José Manuel Moreno", 93, "complete", "ATA"]
];

const HISTORICAL_CARD_PROFILES = {
  complete:  {pace:0,finishing:1,dribbling:2,passing:0,defense:-35,physical:-10,weakFoot:4},
  finisher:  {pace:-1,finishing:3,dribbling:-1,passing:-10,defense:-52,physical:-5,weakFoot:4},
  creator:   {pace:-6,finishing:-3,dribbling:2,passing:3,defense:-28,physical:-15,weakFoot:4},
  dribbler:  {pace:2,finishing:-1,dribbling:4,passing:-2,defense:-50,physical:-18,weakFoot:4},
  midfielder:{pace:-10,finishing:-8,dribbling:0,passing:3,defense:-2,physical:-5,weakFoot:4},
  defender:  {pace:-10,finishing:-45,dribbling:-14,passing:-8,defense:3,physical:1,weakFoot:3},
  fullback:  {pace:0,finishing:-25,dribbling:-4,passing:-3,defense:0,physical:-4,weakFoot:3},
  keeper:    {pace:-30,finishing:-50,dribbling:-25,passing:-15,defense:2,physical:0,weakFoot:3},
  winger:    {pace:3,finishing:-1,dribbling:3,passing:-3,defense:-45,physical:-15,weakFoot:4},
  pace:      {pace:5,finishing:0,dribbling:1,passing:-8,defense:-45,physical:-7,weakFoot:4},
  physical:  {pace:-2,finishing:-2,dribbling:-6,passing:-7,defense:-4,physical:4,weakFoot:3}
};
function historicalCardStats(name,rating,profile){
  const p=HISTORICAL_CARD_PROFILES[profile]||HISTORICAL_CARD_PROFILES.complete;
  const attrs={};
  ['pace','finishing','dribbling','passing','defense','physical'].forEach(id=>attrs[id]=Math.max(30,Math.min(99,rating+p[id])));
  attrs.weakFoot=p.weakFoot;
  const fiveStar=['Pelé','Ronaldo Nazário','Zinedine Zidane','Ronaldinho','Marco van Basten','Garrincha','George Best','Roberto Baggio','Michael Laudrup'];
  if(fiveStar.includes(name))attrs.weakFoot=5;
  return attrs;
}
const HISTORICAL_CARD_OVERRIDES = {
  'Pelé':{pace:97,finishing:97,dribbling:98,passing:94,defense:60,physical:82,weakFoot:5},
  'Diego Maradona':{pace:93,finishing:94,dribbling:98,passing:95,defense:42,physical:75,weakFoot:4},
  'Ronaldo Nazário':{pace:95,finishing:96,dribbling:95,passing:85,defense:44,physical:82,weakFoot:5},
  'Zinedine Zidane':{pace:90,finishing:93,dribbling:98,passing:97,defense:88,physical:88,weakFoot:5},
  'Ronaldinho':{pace:94,finishing:91,dribbling:99,passing:94,defense:45,physical:82,weakFoot:5},
  'Thierry Henry':{pace:97,finishing:96,dribbling:96,passing:90,defense:50,physical:88,weakFoot:4},
  'Paolo Maldini':{pace:88,finishing:55,dribbling:78,passing:85,defense:99,physical:94,weakFoot:4},
  'Roberto Carlos':{pace:97,finishing:89,dribbling:90,passing:94,defense:94,physical:96,weakFoot:4},
  'Cafu':{pace:96,finishing:75,dribbling:90,passing:92,defense:94,physical:90,weakFoot:4},
  'Ferenc Puskás':{pace:91,finishing:99,dribbling:95,passing:93,defense:45,physical:89,weakFoot:4}
};
const HISTORICAL_DRAFT_PLAYERS = HISTORICAL_DRAFT_RAW.map(([name,rating,profile,position])=>({
  name,rating,profile,position,category:'historical',source:'Auge · valores calibrados com cartas Icon/Hero e versões especiais do EA SPORTS FC',
  attributes:HISTORICAL_CARD_OVERRIDES[name]||historicalCardStats(name,rating,profile)
}));

const CURRENT_DRAFT_RAW = [
  ["Mohamed Salah", 91, "MD", 89, 88, 90, 86, 45, 76, 3],
  ["Kylian Mbappé", 91, "ATA", 97, 90, 92, 81, 37, 76, 4],
  ["Erling Haaland", 90, "ATA", 86, 91, 80, 70, 45, 88, 3],
  ["Jude Bellingham", 90, "MEI", 80, 86, 90, 83, 78, 85, 4],
  ["Ousmane Dembélé", 90, "ATA", 91, 88, 93, 83, 50, 69, 5],
  ["Rodri", 90, "VOL", 65, 80, 84, 86, 86, 85, 4],
  ["Virgil van Dijk", 90, "ZAG", 73, 60, 72, 72, 90, 87, 3],
  ["Raphinha", 89, "PE", 91, 84, 87, 85, 53, 75, 3],
  ["Lamine Yamal", 89, "PD", 85, 81, 90, 86, 23, 53, 3],
  ["Pedri", 89, "MC", 77, 73, 91, 85, 78, 77, 4],
  ["Vini Jr.", 89, "PE", 95, 84, 91, 81, 29, 69, 4],
  ["Joshua Kimmich", 89, "VOL", 72, 74, 84, 89, 83, 79, 4],
  ["Harry Kane", 89, "ATA", 64, 92, 82, 83, 48, 82, 5],
  ["Florian Wirtz", 89, "MEI", 80, 82, 90, 88, 54, 67, 4],
  ["Federico Valverde", 89, "MC", 88, 84, 84, 84, 83, 85, 4],
  ["Jamal Musiala", 88, "MEI", 80, 82, 90, 80, 66, 65, 4],
  ["Lautaro Martínez", 88, "ATA", 81, 88, 84, 75, 51, 83, 4],
  ["Robert Lewandowski", 88, "ATA", 74, 89, 85, 79, 44, 84, 4],
  ["Bukayo Saka", 88, "PD", 84, 86, 88, 85, 61, 70, 3],
  ["Cole Palmer", 88, "MEI", 74, 87, 88, 89, 58, 72, 4],
  ["Kevin De Bruyne", 87, "MC", 66, 83, 84, 92, 65, 72, 5],
  ["Frenkie de Jong", 87, "MC", 82, 71, 87, 85, 78, 77, 4],
  ["Bruno Fernandes", 87, "MEI", 67, 83, 83, 89, 65, 75, 3],
  ["Martin Ødegaard", 87, "MC", 68, 79, 87, 88, 67, 65, 2],
  ["Michael Olise", 86, "MD", 78, 80, 87, 84, 50, 66, 3],
  ["Paulo Dybala", 86, "MEI", 80, 85, 87, 84, 41, 64, 3],
  ["Hakan Çalhanoğlu", 86, "VOL", 71, 81, 82, 87, 81, 73, 4],
  ["Nico Williams", 86, "PE", 93, 76, 87, 80, 36, 66, 4],
  ["Nuno Mendes", 86, "LE", 95, 65, 82, 76, 80, 77, 3],
  ["Lionel Messi", 86, "PD", 78, 85, 90, 85, 33, 64, 4],
  ["Neymar Jr", 86, "PE", 83, 79, 92, 83, 37, 58, 5],
  ["Cristiano Ronaldo", 85, "ATA", 76, 88, 80, 76, 34, 76, 4],
  ["Achraf Hakimi", 86, "LD", 92, 78, 84, 82, 80, 80, 4],
  ["Theo Hernández", 86, "LE", 93, 78, 84, 80, 81, 88, 3],
  ["William Saliba", 88, "ZAG", 82, 45, 76, 75, 88, 84, 3],
  ["Gabriel Magalhães", 86, "ZAG", 72, 45, 68, 68, 87, 86, 2],
  ["Vitinha", 88, "MC", 78, 77, 89, 89, 70, 72, 4],
  ["Khvicha Kvaratskhelia", 87, "PE", 86, 81, 89, 83, 42, 70, 5],
  ["Nicolò Barella", 87, "MC", 80, 78, 86, 84, 81, 76, 3],
  ["Declan Rice", 87, "VOL", 72, 73, 80, 84, 83, 83, 3],
  ["Alexander Isak", 88, "ATA", 87, 89, 86, 80, 39, 78, 5],
  ["Victor Osimhen", 87, "ATA", 92, 84, 81, 65, 42, 84, 4],
  ["Viktor Gyökeres", 87, "ATA", 90, 86, 81, 73, 36, 91, 3],
  ["Julián Álvarez", 87, "ATA", 84, 86, 86, 82, 58, 78, 4],
  ["João Neves", 85, "MC", 79, 68, 83, 84, 84, 80, 4],
  ["Alessandro Bastoni", 87, "ZAG", 74, 46, 76, 75, 88, 82, 3],
  ["Rúben Dias", 87, "ZAG", 59, 39, 69, 65, 88, 87, 4],
  ["Bernardo Silva", 87, "MEI", 69, 78, 90, 88, 67, 68, 3],
  ["Rafael Leão", 86, "PE", 94, 82, 87, 79, 31, 78, 4],
  ["Jules Koundé", 87, "LD", 84, 47, 79, 74, 86, 84, 3]
];
const CURRENT_PEAK_OVERRIDES = {
  'Lionel Messi':{rating:96,attributes:{pace:89,finishing:96,dribbling:98,passing:97,defense:42,physical:71,weakFoot:4}},
  'Cristiano Ronaldo':{rating:94,attributes:{pace:93,finishing:97,dribbling:91,passing:87,defense:39,physical:90,weakFoot:4}},
  'Neymar Jr':{rating:95,attributes:{pace:94,finishing:90,dribbling:97,passing:91,defense:38,physical:68,weakFoot:5}},
  'Kylian Mbappé':{rating:94,attributes:{pace:99,finishing:94,dribbling:95,passing:84,defense:40,physical:82,weakFoot:4}},
  'Mohamed Salah':{rating:93,attributes:{pace:94,finishing:92,dribbling:93,passing:88,defense:48,physical:80,weakFoot:4}},
  'Harry Kane':{rating:93,attributes:{pace:71,finishing:96,dribbling:85,passing:89,defense:52,physical:86,weakFoot:5}},
  'Kevin De Bruyne':{rating:93,attributes:{pace:74,finishing:90,dribbling:89,passing:96,defense:70,physical:80,weakFoot:5}},
  'Robert Lewandowski':{rating:93,attributes:{pace:80,finishing:96,dribbling:88,passing:83,defense:46,physical:87,weakFoot:4}},
  'Virgil van Dijk':{rating:92,attributes:{pace:81,finishing:62,dribbling:75,passing:79,defense:94,physical:92,weakFoot:3}},
  'Jude Bellingham':{rating:92,attributes:{pace:84,finishing:89,dribbling:92,passing:87,defense:81,physical:88,weakFoot:4}},
  'Vini Jr.':{rating:92,attributes:{pace:98,finishing:88,dribbling:95,passing:83,defense:31,physical:75,weakFoot:4}},
  'Erling Haaland':{rating:93,attributes:{pace:90,finishing:97,dribbling:84,passing:76,defense:47,physical:93,weakFoot:4}}
};
function currentPeakCard({name,rating,position,attributes}){
  if(CURRENT_PEAK_OVERRIDES[name]) return {name,rating:CURRENT_PEAK_OVERRIDES[name].rating,position,category:'current',source:'Auge · valores calibrados em cartas especiais e versões de pico do EA SPORTS FC',attributes:CURRENT_PEAK_OVERRIDES[name].attributes};
  const attrs={...attributes};
  const isForward=['ATA','PE','PD','MD'].includes(position);
  const isMid=['MEI','MC','VOL'].includes(position);
  const isDef=['ZAG','LD','LE'].includes(position);
  const baseBoost=rating>=89?2:1;
  const plus=(id,n)=>attrs[id]=Math.min(99,attrs[id]+n);
  if(isForward){plus('pace',baseBoost);plus('finishing',baseBoost+1);plus('dribbling',baseBoost+1);plus('passing',1);plus('physical',1);}
  else if(isMid){plus('passing',baseBoost+1);plus('dribbling',baseBoost);plus('finishing',1);plus('defense',position==='VOL'?2:1);plus('physical',1);}
  else if(isDef){plus('defense',baseBoost+1);plus('physical',baseBoost);plus('pace',1);plus('passing',1);if(position==='LD'||position==='LE')plus('dribbling',1);}
  attrs.weakFoot=Math.min(5,attrs.weakFoot+(rating>=88?1:0));
  const peakRating=Math.min(96,rating+(rating>=88?2:1));
  return {name,rating:peakRating,position,category:'current',source:'Auge · valores calibrados em cartas especiais e versões de pico do EA SPORTS FC',attributes:attrs};
}
const CURRENT_DRAFT_PLAYERS = CURRENT_DRAFT_RAW.map(([name,rating,position,pace,finishing,dribbling,passing,defense,physical,weakFoot])=>currentPeakCard({
  name,rating,position,attributes:{pace,finishing,dribbling,passing,defense,physical,weakFoot}
}));

const LEGEND_POOL = [...HISTORICAL_DRAFT_PLAYERS,...CURRENT_DRAFT_PLAYERS];

const INCIDENT_EVENTS = [
  {id:'minor_injury',title:'Desconforto muscular',description:'Você sente a coxa pesar após uma sequência intensa. A comissão médica oferece dois caminhos.',choices:[
    {label:'Fazer recuperação completa',action:'injury_rehab',effect:'perde alguns jogos, mas reduz o risco de piorar'},
    {label:'Tentar voltar antes',action:'injury_rush',effect:'volta mais rápido, porém com risco físico'}]},
  {id:'controversy',title:'Polêmica nas redes',description:'Uma fala sua é recortada e ganha repercussão. A imprensa transforma o assunto em manchete.',choices:[
    {label:'Publicar um esclarecimento',action:'controversy_apologize',effect:'+ estabilidade; pequena queda de reputação'},
    {label:'Sustentar sua posição',action:'controversy_defend',effect:'+ personalidade; mais pressão'}]},
  {id:'locker_room',title:'Atrito no vestiário',description:'Um companheiro reclama da sua postura após uma partida difícil.',choices:[
    {label:'Resolver internamente',action:'locker_peace',effect:'+ moral e ambiente'},
    {label:'Responder em público',action:'locker_public',effect:'+ reputação; risco de desgaste'}]},
  {id:'nightlife',title:'Rumor fora de campo',description:'Uma foto sua circula na véspera de um treino importante e vira assunto no clube.',choices:[
    {label:'Assumir o erro e focar no treino',action:'rumor_focus',effect:'+ recuperação de confiança'},
    {label:'Ignorar a repercussão',action:'rumor_ignore',effect:'pode afetar moral e pressão'}]},
  {id:'agent_tension',title:'Tensão com o empresário',description:'Seu agente quer forçar uma transferência, mas você não está convencido.',choices:[
    {label:'Manter portas abertas',action:'agent_open',effect:'+ mercado; - estabilidade'},
    {label:'Priorizar o clube atual',action:'agent_stay',effect:'+ moral; menos pressão de mercado'}]},
  {id:'minor_illness',title:'Virose antes da rodada',description:'Você acorda indisposto dois dias antes da partida. O departamento médico recomenda cautela.',choices:[
    {label:'Parar e recuperar',action:'illness_rest',effect:'pode perder um jogo; recuperação segura'},
    {label:'Treinar normalmente',action:'illness_push',effect:'+ disponibilidade; risco de piora'}]},
  {id:'transfer_leak',title:'Vazamento sobre transferência',description:'Um jornalista publica que você teria conversado com outro clube, mesmo sem anúncio oficial.',choices:[
    {label:'Negar e encerrar o assunto',action:'leak_deny',effect:'+ estabilidade no clube'},
    {label:'Deixar a especulação correr',action:'leak_feed',effect:'+ mercado; + pressão'}]},
  {id:'derby_heat',title:'Clima de clássico',description:'A semana do clássico fica tensa após provocações do rival e pressão da torcida.',choices:[
    {label:'Responder dentro de campo',action:'derby_focus',effect:'+ moral e reputação'},
    {label:'Entrar na provocação',action:'derby_fire',effect:'+ reputação; + pressão'}]},
  {id:'training_clash',title:'Choque forte no treino',description:'Um treino mais pegado termina em discussão depois de uma entrada dura.',choices:[
    {label:'Aceitar as desculpas',action:'training_peace',effect:'+ ambiente; + moral'},
    {label:'Cobrar publicamente',action:'training_confront',effect:'+ personalidade; - moral'}]},
  {id:'travel_delay',title:'Viagem complicada',description:'A delegação enfrenta atraso e chega tarde ao destino na véspera de uma partida.',choices:[
    {label:'Priorizar descanso',action:'travel_rest',effect:'+ recuperação'},
    {label:'Fazer ativação extra',action:'travel_activate',effect:'+ preparação; pequeno desgaste'}]},
  {id:'sponsor_pressure',title:'Pressão de patrocinador',description:'Uma campanha comercial importante coincide com uma semana decisiva de jogos.',choices:[
    {label:'Cumprir a agenda completa',action:'sponsor_campaign_accept',effect:'+ reputação; + pressão'},
    {label:'Reduzir compromissos',action:'sponsor_campaign_focus',effect:'+ preparação esportiva'}]},
  {id:'fan_expectation',title:'Cobrança da torcida',description:'Uma sequência irregular aumenta a cobrança dos torcedores em treino aberto.',choices:[
    {label:'Falar com os torcedores',action:'fans_talk',effect:'+ conexão e reputação'},
    {label:'Blindar-se e treinar',action:'fans_train',effect:'+ foco e evolução'}]},
  {id:'boot_issue',title:'Problema com chuteiras',description:'Seu novo material incomoda durante o aquecimento e a equipe de equipamento oferece uma troca.',choices:[
    {label:'Voltar ao modelo antigo',action:'boots_safe',effect:'+ consistência'},
    {label:'Manter o novo modelo',action:'boots_risk',effect:'chance de adaptação e bônus técnico'}]}
];

const CAREER_EVENTS = [
  {id:'training',title:'Semana livre para treinar',description:'O treinador oferece uma sessão extra. Você pode forçar o desenvolvimento ou preservar o físico.',choices:[
    {label:'Treinar forte',action:'train_hard',effect:'+ chance de evolução; - moral se der errado'},
    {label:'Focar em recuperação',action:'recover',effect:'+ moral e consistência'}]},
  {id:'media',title:'Entrevista após boa atuação',description:'A imprensa pergunta onde você pretende chegar na carreira.',choices:[
    {label:'“Quero ser o melhor do mundo.”',action:'ambitious',effect:'+ reputação; + pressão'},
    {label:'“Só penso no próximo jogo.”',action:'humble',effect:'+ moral; evolução mais estável'}]},
  {id:'coach',title:'Conversa com o treinador',description:'A comissão técnica quer saber se você deseja assumir mais responsabilidade dentro do time.',choices:[
    {label:'Pedir protagonismo',action:'leadership',effect:'+ reputação; pequena chance de +GER'},
    {label:'Continuar aprendendo',action:'learn',effect:'+ potencial se ainda for jovem'}]},
  {id:'agent',title:'Seu empresário traz uma decisão',description:'Há interesse de clubes, mas uma mudança de postura pode afetar seu futuro.',choices:[
    {label:'Buscar um salto na carreira',action:'market_push',effect:'+ chance de receber mais propostas'},
    {label:'Priorizar estabilidade',action:'stability',effect:'+ moral no clube atual'}]},
  {id:'fatigue',title:'Sequência pesada de jogos',description:'Você sente o desgaste do calendário e precisa decidir como lidar com a próxima semana.',choices:[
    {label:'Jogar mesmo cansado',action:'play_tired',effect:'risco de queda de moral; + reputação'},
    {label:'Pedir descanso',action:'rest',effect:'+ moral; sem bônus de reputação'}]},
  {id:'set_piece_role',title:'Nova função em bolas paradas',description:'O auxiliar oferece a você mais responsabilidade em faltas, pênaltis e escanteios.',choices:[
    {label:'Assumir as cobranças',action:'setpiece_take',effect:'+ protagonismo e evolução técnica'},
    {label:'Dividir as cobranças',action:'setpiece_share',effect:'+ ambiente e moral'}]},
  {id:'mentor',title:'Um jovem pede sua ajuda',description:'Um atleta da base procura você depois do treino para pedir conselhos sobre a carreira.',choices:[
    {label:'Virar mentor',action:'mentor_help',effect:'+ liderança e reputação'},
    {label:'Manter foco pessoal',action:'mentor_focus',effect:'+ preparação individual'}]},
  {id:'documentary',title:'Convite para documentário',description:'Uma produtora quer acompanhar sua rotina por algumas semanas.',choices:[
    {label:'Aceitar as câmeras',action:'documentary_yes',effect:'+ reputação; + pressão'},
    {label:'Recusar e preservar rotina',action:'documentary_no',effect:'+ estabilidade e moral'}]},
  {id:'tactical_role',title:'Mudança tática',description:'O treinador quer testar você em uma função um pouco diferente durante a próxima sequência.',choices:[
    {label:'Abraçar a nova função',action:'tactical_adapt',effect:'+ desenvolvimento e confiança'},
    {label:'Pedir para manter sua função',action:'tactical_stay',effect:'+ estabilidade; menos evolução'}]},
  {id:'captain_group',title:'Reunião de lideranças',description:'Você é chamado para uma conversa com os líderes do elenco antes de uma fase decisiva.',choices:[
    {label:'Fazer um discurso forte',action:'captain_speech',effect:'+ liderança e reputação'},
    {label:'Liderar pelo exemplo',action:'captain_example',effect:'+ moral e consistência'}]},
  {id:'specialist',title:'Treino com especialista',description:'O clube traz um especialista para uma sessão individual de aperfeiçoamento.',choices:[
    {label:'Focar na principal qualidade',action:'specialist_primary',effect:'+ desenvolvimento'},
    {label:'Corrigir ponto fraco',action:'specialist_weak',effect:'+ potencial e equilíbrio'}]},
  {id:'charity',title:'Ação com a comunidade',description:'O clube organiza uma ação social no dia de folga e convida você para participar.',choices:[
    {label:'Participar da ação',action:'charity_join',effect:'+ reputação e moral'},
    {label:'Usar o dia para descansar',action:'charity_rest',effect:'+ recuperação física'}]},
  {id:'video_review',title:'Sessão de análise de vídeo',description:'A comissão separa lances seus para uma revisão individual antes do próximo jogo.',choices:[
    {label:'Estudar os erros',action:'video_learn',effect:'+ evolução e consistência'},
    {label:'Focar nos pontos fortes',action:'video_confidence',effect:'+ moral e confiança'}]},
  {id:'contract_noise',title:'Rumores sobre renovação',description:'A imprensa noticia que o clube avalia seu futuro, mesmo sem proposta formal na mesa.',choices:[
    {label:'Mostrar desejo de ficar',action:'contract_stay',effect:'+ moral e estabilidade'},
    {label:'Ouvir o mercado',action:'contract_market',effect:'+ propostas e reputação'}]},
  {id:'extra_recovery',title:'Nova tecnologia de recuperação',description:'O departamento de performance oferece uma sessão experimental de recuperação.',choices:[
    {label:'Fazer o protocolo completo',action:'recovery_tech',effect:'+ condição e moral'},
    {label:'Manter a rotina tradicional',action:'recovery_normal',effect:'+ estabilidade'}]},
  {id:'tunnel_interview',title:'Microfone no túnel',description:'A transmissão pede uma resposta rápida antes de uma partida grande, com a arquibancada já pulsando.',choices:[
    {label:'Prometer uma grande atuação',action:'ambitious',effect:'+ reputação; + pressão'},
    {label:'Falar pouco e focar no jogo',action:'humble',effect:'+ moral e estabilidade'}]},
  {id:'night_training',title:'Treino noturno no estádio',description:'O treinador fecha o estádio para uma sessão tática sob os refletores, simulando a atmosfera do próximo jogo.',choices:[
    {label:'Ficar para a sessão extra',action:'tactical_adapt',effect:'+ evolução e repertório'},
    {label:'Preservar energia',action:'recover',effect:'+ recuperação e moral'}]},
  {id:'museum_invite',title:'Convite ao museu do clube',description:'O clube convida você para conhecer ídolos históricos e gravar uma mensagem para a torcida.',choices:[
    {label:'Participar e falar com os torcedores',action:'fans_talk',effect:'+ conexão e reputação'},
    {label:'Agradecer e manter foco esportivo',action:'fans_train',effect:'+ foco e desenvolvimento'}]},
  {id:'deadline_phone',title:'Telefone no último dia da janela',description:'Seu empresário recebe uma ligação inesperada nas horas finais do mercado.',choices:[
    {label:'Ouvir a proposta',action:'contract_market',effect:'+ mercado e possibilidades'},
    {label:'Desligar e permanecer',action:'contract_stay',effect:'+ estabilidade e moral'}]},
  {id:'boot_lab',title:'Laboratório de chuteiras',description:'A fornecedora apresenta um protótipo personalizado e pede que você teste o material em treino.',choices:[
    {label:'Testar o protótipo',action:'boots_risk',effect:'chance de ganho técnico'},
    {label:'Manter seu modelo atual',action:'boots_safe',effect:'+ consistência'}]},
  {id:'captain_camera',title:'Câmera no vestiário',description:'Uma equipe de mídia acompanha a preleção e você é convidado a dizer algumas palavras ao grupo.',choices:[
    {label:'Fazer um discurso',action:'captain_speech',effect:'+ liderança e reputação'},
    {label:'Liderar em silêncio',action:'captain_example',effect:'+ moral e confiança'}]},
  {id:'recovery_pool',title:'Sessão na piscina',description:'Após uma sequência pesada, o departamento físico oferece trabalho regenerativo especial.',choices:[
    {label:'Fazer recuperação completa',action:'recovery_tech',effect:'+ condição física'},
    {label:'Treinar com bola',action:'train_hard',effect:'chance de evolução; mais desgaste'}]},
  {id:'charity_match',title:'Jogo beneficente',description:'Ídolos e atletas atuais se reúnem para um evento beneficente transmitido nacionalmente.',choices:[
    {label:'Participar do evento',action:'charity_join',effect:'+ reputação e moral'},
    {label:'Usar a folga para recuperar',action:'charity_rest',effect:'+ recuperação'}]},
  {id:'analyst_room',title:'Sala de análise individual',description:'Um analista separa padrões de movimentação dos seus próximos adversários e convida você para uma sessão privada.',choices:[
    {label:'Estudar os padrões',action:'video_learn',effect:'+ evolução e leitura'},
    {label:'Rever suas melhores jogadas',action:'video_confidence',effect:'+ confiança'}]}
];

// --- V8.7: eventos adicionais de seleção ---
const NATIONAL_TEAM_EVENTS = [
  {id:'nt_camp_intensity',title:'Concentração da seleção',description:'A comissão técnica chama você após o treino e oferece uma sessão extra antes da próxima data internacional.',choices:[
    {label:'Fazer a sessão completa',action:'nt_camp_train',effect:'+ confiança na seleção e preparação'},
    {label:'Preservar o físico',action:'nt_camp_rest',effect:'+ moral e recuperação'}]},
  {id:'nt_penalty_order',title:'Lista de cobradores',description:'O treinador de bolas paradas procura você e comunica que está revendo a ordem dos cobradores para jogos decisivos.',choices:[
    {label:'Pedir uma cobrança',action:'nt_penalty_take',effect:'+ protagonismo; + pressão'},
    {label:'Apoiar a ordem atual',action:'nt_penalty_support',effect:'+ entrosamento e confiança'}]},
  {id:'nt_press_room',title:'Coletiva da seleção',description:'O assessor da seleção procura você e informa que a comissão quer definir quem falará na próxima coletiva.',choices:[
    {label:'Assumir ambição',action:'nt_press_ambitious',effect:'+ reputação; + cobrança'},
    {label:'Blindar o grupo',action:'nt_press_calm',effect:'+ moral e estabilidade'}]},
  {id:'nt_tactical_role',title:'Função tática na seleção',description:'O treinador chama você para uma conversa individual e propõe uma função diferente da que exerce no clube.',choices:[
    {label:'Aceitar a mudança',action:'nt_tactical_adapt',effect:'+ confiança e repertório'},
    {label:'Defender sua função natural',action:'nt_tactical_stay',effect:'+ conforto; menor ganho de confiança'}]},
  {id:'nt_leadership',title:'Reunião de líderes',description:'A comissão chama você para a reunião de líderes antes de uma partida grande e pede uma participação no encontro.',choices:[
    {label:'Falar ao grupo',action:'nt_leader_speech',effect:'+ liderança e confiança'},
    {label:'Liderar pelo exemplo',action:'nt_leader_example',effect:'+ moral e estabilidade'}]},
  {id:'nt_rivalry',title:'Clássico internacional',description:'A comissão conversa com você sobre as provocações do adversário e pede uma postura para proteger o foco do grupo.',choices:[
    {label:'Responder em campo',action:'nt_rival_focus',effect:'+ foco e confiança'},
    {label:'Responder à imprensa',action:'nt_rival_media',effect:'+ reputação; + pressão'}]},
  {id:'wc_arrival',title:'Chegada à Copa do Mundo',description:'A seleção desembarca para a Copa e o ambiente muda completamente: hotel fechado, imprensa e torcida em volta do grupo.',worldCupOnly:true,choices:[
    {label:'Entrar no clima da Copa',action:'wc_arrival_embrace',effect:'+ moral e confiança'},
    {label:'Manter rotina normal',action:'wc_arrival_focus',effect:'+ estabilidade e preparação'}]},
  {id:'wc_penalties',title:'Treino de pênaltis da Copa',description:'O treinador chama você durante a sessão de pênaltis e pergunta se está pronto para assumir uma cobrança em um jogo decisivo.',worldCupOnly:true,choices:[
    {label:'Ser um dos cobradores',action:'wc_penalty_duty',effect:'+ confiança; + pressão'},
    {label:'Focar no jogo corrido',action:'wc_penalty_skip',effect:'+ preparação e moral'}]},
  {id:'wc_family',title:'Dia de visita na Copa',description:'A comissão libera algumas horas para receber familiares antes da próxima partida.',worldCupOnly:true,choices:[
    {label:'Receber a família',action:'wc_family_visit',effect:'+ moral e leveza'},
    {label:'Continuar concentrado',action:'wc_family_focus',effect:'+ foco e confiança'}]},
  {id:'wc_knockout',title:'Véspera de mata-mata',description:'Na véspera do mata-mata, o treinador chama você à sala de vídeo e pede uma postura clara para a preparação.',worldCupOnly:true,choices:[
    {label:'Estudar o adversário',action:'wc_video_study',effect:'+ preparação e confiança'},
    {label:'Confiar no instinto',action:'wc_instinct',effect:'+ moral; maior risco'}]},
  {id:'wc_captain_room',title:'Conversa antes de entrar em campo',description:'No túnel, um membro da comissão se aproxima de você e pede uma última palavra ao grupo antes do jogo.',worldCupOnly:true,choices:[
    {label:'Puxar o discurso',action:'wc_tunnel_speech',effect:'+ liderança e confiança'},
    {label:'Manter o grupo calmo',action:'wc_tunnel_calm',effect:'+ moral e controle'}]}
];

// Be The Legend / New narrative arcs. All actions below map to the existing
// consequence handlers; no changes to save schema or gameplay probabilities.
const BTL_PREMIUM_CAREER_EVENTS = [
 {id:'academy_reunion',type:'career',title:'O reencontro com a base',description:'Seu primeiro treinador aparece no CT antes de um jogo grande. Os jovens esperam uma palavra sua.',choices:[{label:'Conversar com os garotos',action:'mentor_help',effect:'+ respeito no clube e confiança'},{label:'Guardar energia para o jogo',action:'mentor_focus',effect:'+ foco individual'}]},
 {id:'captain_vacancy',type:'career',title:'A braçadeira está livre',description:'O capitão se lesionou e o técnico precisa de uma liderança para o próximo mês.',choices:[{label:'Assumir o grupo',action:'captain_speech',effect:'+ liderança e reputação'},{label:'Liderar pelo exemplo',action:'captain_example',effect:'+ moral e menos pressão'}]},
 {id:'scouting_notebook',type:'career',title:'O caderno do olheiro',description:'Um observador internacional compareceu a três treinos. Seu empresário quer saber se deve iniciar contatos.',choices:[{label:'Abrir conversas',action:'agent_open',effect:'+ mercado; mais especulações'},{label:'Provar valor aqui',action:'agent_stay',effect:'+ estabilidade no elenco'}]},
 {id:'derby_choreo',type:'career',title:'Mosaico na arquibancada',description:'A torcida prepara um mosaico com seu número para o clássico. O clube oferece uma ação especial.',choices:[{label:'Encontrar os torcedores',action:'fans_talk',effect:'+ identificação com a torcida'},{label:'Transformar a homenagem em treino',action:'fans_train',effect:'+ desenvolvimento'}]},
 {id:'tactical_revolution',type:'career',title:'Uma nova função tática',description:'O técnico testou você em outro setor. O desempenho no treino chamou atenção da comissão.',choices:[{label:'Aprender o sistema',action:'tactical_adapt',effect:'+ repertório e confiança'},{label:'Defender sua função',action:'tactical_stay',effect:'+ segurança e estabilidade'}]},
 {id:'international_invite',type:'career',title:'Convite para treinar com lendas',description:'Craques aposentados organizam um jogo beneficente e convidam você para um encontro técnico.',choices:[{label:'Participar do encontro',action:'charity_join',effect:'+ reputação e motivação'},{label:'Priorizar descanso',action:'charity_rest',effect:'+ recuperação'}]}
];
const BTL_PREMIUM_RANDOM_EVENTS = [
 {id:'weather_blackout',type:'random',title:'Apagão no centro de treinamento',description:'Uma tempestade interrompe a sessão e transforma o treino em uma disputa improvisada entre os jogadores.',choices:[{label:'Organizar treino alternativo',action:'travel_activate',effect:'+ preparação, algum desgaste'},{label:'Recuperar no departamento médico',action:'travel_rest',effect:'+ energia e descanso'}]},
 {id:'lost_luggage',type:'random',title:'Mala extraviada',description:'Na chegada para o jogo fora de casa, suas chuteiras especiais não aparecem na esteira.',choices:[{label:'Usar um modelo reserva',action:'boots_safe',effect:'+ segurança'},{label:'Testar chuteiras novas',action:'boots_risk',effect:'adaptação imprevisível'}]},
 {id:'viral_training_clip',type:'random',title:'Um lance de treino viraliza',description:'Um vídeo mostra um drible seu fora de contexto e cria expectativa exagerada para a rodada.',choices:[{label:'Aceitar a atenção',action:'controversy_defend',effect:'+ exposição e pressão'},{label:'Frear a repercussão',action:'controversy_apologize',effect:'+ controle emocional'}]},
 {id:'behind_the_scenes',type:'random',title:'Câmeras nos bastidores',description:'Uma equipe documental pede acesso ao vestiário durante um momento delicado da temporada.',choices:[{label:'Abrir as portas',action:'documentary_yes',effect:'+ visibilidade e cobrança'},{label:'Manter o vestiário protegido',action:'documentary_no',effect:'+ concentração'}]},
 {id:'community_pitch',type:'random',title:'O campinho da comunidade',description:'Um projeto social convida você para inaugurar um campo onde crianças sonham com a primeira chuteira.',choices:[{label:'Participar da inauguração',action:'charity_join',effect:'+ conexão com a comunidade'},{label:'Enviar apoio e descansar',action:'charity_rest',effect:'+ recuperação'}]}
];
const BTL_ICON_EVENTS = [
 {id:'icon_mentor_visit',type:'icon',title:'Uma lenda pede sua opinião',description:'O museu do clube recebeu um ídolo histórico. Ele vê potencial em você para carregar sua herança.',choices:[{label:'Aprender com a lenda',action:'idol_learn',effect:'+ aprendizado'},{label:'Assumir seu próprio estilo',action:'idol_leadership',effect:'+ protagonismo'}]},
 {id:'icon_legacy_project',type:'icon',title:'Seu espaço na história',description:'A diretoria planeja um espaço dedicado aos grandes nomes do clube. Sua trajetória entrou na conversa.',choices:[{label:'Inspirar uma geração',action:'mentor_help',effect:'+ legado e reputação'},{label:'Mirar novas conquistas',action:'mentor_focus',effect:'+ aperfeiçoamento'}]},
 {id:'icon_hall_invite',type:'icon',title:'Convite para o Hall da Fama',description:'Uma instituição do futebol convida você para discursar em uma cerimônia de gerações de craques.',choices:[{label:'Discurso de agradecimento',action:'captain_speech',effect:'+ liderança'},{label:'Homenagear os companheiros',action:'captain_example',effect:'+ união do elenco'}]}
];
