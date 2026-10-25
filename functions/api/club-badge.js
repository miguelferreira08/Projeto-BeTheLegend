// Be The Legend — Cloudflare Pages Function
// Consulta de identidade do clube pela API-Football.
// A chave permanece exclusivamente no segredo API_FOOTBALL_KEY do Cloudflare.
const norm = value => String(value ?? '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const aliases = {
  'Bayern de Munique': ['Bayern Munich', 'FC Bayern München'],
  'Inter de Milão': ['Inter Milan', 'FC Internazionale Milano'],
  'Milan': ['AC Milan'],
  'Atlético de Madrid': ['Atletico Madrid', 'Atlético de Madrid'],
  'Flamengo': ['CR Flamengo', 'Clube de Regatas do Flamengo'],
  'Corinthians': ['SC Corinthians Paulista', 'Sport Club Corinthians Paulista'],
  'Grêmio': ['Grêmio Foot-Ball Porto Alegrense', 'Gremio'],
  'São Paulo': ['São Paulo FC', 'Sao Paulo FC'],
  'Sport': ['Sport Club do Recife', 'Sport Recife'],
  'Internacional': ['SC Internacional', 'Sport Club Internacional'],
  'Palmeiras': ['SE Palmeiras', 'Sociedade Esportiva Palmeiras'],
  'Barcelona': ['FC Barcelona'],
  'Real Madrid': ['Real Madrid CF'],
  'Arsenal': ['Arsenal FC'],
  'Chelsea': ['Chelsea FC'],
  'Liverpool': ['Liverpool FC'],
  'Tottenham': ['Tottenham Hotspur FC'],
  'Manchester City': ['Manchester City FC'],
  'Manchester United': ['Manchester United FC'],
  'Paris Saint-Germain': ['Paris Saint-Germain FC'],
  'Inter Miami': ['Inter Miami CF']
};

function json(body, status = 200, cache = 'no-store') {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': cache,
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

function apiFailure(errors, httpStatus) {
  const raw = typeof errors === 'string' ? errors : JSON.stringify(errors ?? '');
  const message = raw.toLowerCase();
  if (/limit|quota|rate|requests|too many/.test(message) || httpStatus === 429) return 'quota-or-rate-limit';
  if (/subscription|plan|subscribe|access|not allowed/.test(message)) return 'subscription-or-permission';
  if (/key|token|auth|credential|unauthoriz/.test(message) || httpStatus === 401 || httpStatus === 403) return 'authentication';
  return 'upstream-api-error';
}

export async function onRequestGet({ request, env }) {
  const params = new URL(request.url).searchParams;
  const name = (params.get('name') || '').trim();
  const country = (params.get('country') || '').trim();
  const idString = (params.get('id') || '').trim();
  const teamId = Number(idString);

  if (name.length < 2 || name.length > 90) return json({ error: 'Clube inválido' }, 400);
  if (country.length > 70 || /[^\p{L} .'-]/u.test(country)) return json({ error: 'País inválido' }, 400);
  if (idString && (!Number.isSafeInteger(teamId) || teamId < 1 || teamId > 100000000)) {
    return json({ error: 'ID inválido' }, 400);
  }
  const key = String(env?.API_FOOTBALL_KEY || '').trim();
  if (!key) return json({ configured: false, logo: '', status: 'missing-key' }, 503);

  // Consulta exata por ID primeiro; se houver ID, NÃO consome requisições extras.
  const queries = idString
    ? [{ field: 'id', value: String(teamId) }]
    : [{ field: 'name', value: name }, { field: 'search', value: name },
       ...((aliases[name] || []).slice(0, 2).map(value => ({ field: 'name', value })))];

  for (const query of queries) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5500);
    try {
      const url = `https://v3.football.api-sports.io/teams?${query.field}=${encodeURIComponent(query.value)}`;
      const response = await fetch(url, {
        method: 'GET',
        // Documentação API-Football: este deve ser o ÚNICO cabeçalho definido.
        headers: { 'x-apisports-key': key },
        signal: controller.signal
      });
      let data;
      try {
        data = await response.json();
      } catch {
        return json({ configured: true, logo: '', status: 'invalid-upstream-response', httpStatus: response.status }, 502);
      }
      const errors = data?.errors;
      const hasErrors = Array.isArray(errors)
        ? errors.length > 0
        : Boolean(errors && typeof errors === 'object' ? Object.keys(errors).length : errors);
      if (!response.ok || hasErrors) {
        // Não confundir falha da API com clube não cadastrado.
        return json({
          configured: true,
          logo: '',
          status: 'api-error',
          reason: apiFailure(errors, response.status),
          httpStatus: response.status
        }, 502);
      }
      const teams = Array.isArray(data?.response) ? data.response.map(entry => entry.team).filter(Boolean) : [];
      const acceptedNames = new Set([name, ...(aliases[name] || [])].map(norm));
      const pick = teams.find(team =>
        Number.isInteger(Number(team.id)) &&
        !team.national &&
        (!idString || Number(team.id) === teamId) &&
        (!country || norm(team.country) === norm(country)) &&
        acceptedNames.has(norm(team.name))
      );
      const logo = String(pick?.logo || '');
      if (logo.startsWith('https://media.api-sports.io/football/teams/') && /\.png$/i.test(logo)) {
        return json({
          configured: true,
          logo,
          status: 'ok',
          source: 'API-Sports',
          id: pick.id,
          name: pick.name,
          country: pick.country
        }, 200, 'public, max-age=86400');
      }
    } catch (error) {
      return json({
        configured: true,
        logo: '',
        status: 'network-error',
        reason: error?.name === 'AbortError' ? 'timeout' : 'connection-failed'
      }, 503);
    } finally {
      clearTimeout(timeout);
    }
  }
  return json({ configured: true, logo: '', status: 'not-found' }, 404);
}
