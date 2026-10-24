from pathlib import Path
import re,unicodedata,json
p=Path(__file__).resolve().parents[1]
a=(p/'js/app.js').read_text();data=(p/'js/data.js').read_text();html=(p/'index.html').read_text();auth=(p/'js/auth.js').read_text();css=(p/'css/legend-atelier.css').read_text()
cs=re.findall(r'\["([^"]+)",\s*\d+,\s*"',data[data.index('const CURRENT_DRAFT_RAW = ['):data.index('const CURRENT_DRAFT_PLAYERS =')]);hs=re.findall(r'\["([^"]+)",\s*\d+,',data[data.index('const HISTORICAL_DRAFT_RAW'):data.index('const HISTORICAL_DRAFT_PLAYERS')]);
def norm(s):return re.sub('[^a-z0-9]','', ''.join(c for c in unicodedata.normalize('NFD',s.lower()) if unicodedata.category(c)!='Mn'))
raw=a[a.index('const BTL_PLAYER_NATIONS={'):a.index('const BTL_PLAYER_NATION_INDEX')];known={norm(n) for _,names in re.findall(r"'([^']+)':'([^']+)'",raw) for n in names.split('|')}
missing=[name for name in cs+hs if norm(name) not in known]
clubsrc=a[a.index('const BTL_PLAYER_CLUBS='):a.index('function currentCardClub')];clbs={n for n in re.findall(r"'([^']+)':'[^']+'",clubsrc)};missingclubs=[name for name in cs if name not in clbs]
checks={'200 cartas possuem nacionalidade':len(cs)+len(hs)==200 and not missing,'50 jogadores atuais possuem clube':len(cs)==50 and not missingclubs,
 'Consulta de elencos no Mercado':'id="roster-search"' in html,
 '5 catálogos oficiais 2026/27':'window.BTLOfficialSquads=' in (p/'js/roster-snapshot-2026.js').read_text(),
 'Jersey M54 aplicada globalmente':"--btl-display-font:'Jersey M54 Local','Jersey M54'" in css,
 'Fonte remota configurada':'fonts.cdnfonts.com/css/jersey-m54' in html,
 'Google usa validação servidor':'/api/auth/google' in auth and 'decodeJwtPayload' not in auth,
 'Google validação criptográfica':(p/'functions/api/auth/google.js').exists(),
 'FCLOGO existente':(p/'functions/api/club-logo.js').exists(),
 'ESPN roster endpoint':(p/'functions/api/roster.js').exists(),
 'Flags FlagCDN':'flagcdn.com/' in a,
 'Seis ícones do menu':'.menu-line-icon' in css,
 'Novo editor facial':'appearance-face-shape' in a,
 'Eventos com estilos próprios':'icon-event-active' in css and 'random-event-active' in css and 'match-decision-modal' in css,
 'Saves conservados':'beTheLegendV103' in auth and 'ensureWorldPlayers' in a,
 'Snapshot importado na simulação':'officialSquadImported2026' in a}
print(json.dumps({'checks':checks,'success':sum(checks.values()),'total':len(checks),'missingFlags':missing,'missingClubs':missingclubs},indent=2,ensure_ascii=False));assert all(checks.values());(p/'tools/v13-audit.json').write_text(json.dumps(checks,indent=2,ensure_ascii=False))
