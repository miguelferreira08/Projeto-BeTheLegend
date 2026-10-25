# Be The Legend V21 — Idiomas, competições e escudos

## Resumo

- **Idiomas:** Português, Inglês, Espanhol e Francês; controle com bandeiras SVG locais que funcionam sem emojis externos. Catálogo de tradução ampliado para menus, criação, partida, estatísticas, ações e estados; troca reversível de idioma mesmo após rerenderização dinâmica.
- **Textos narrativos longos:** para traduzir dinamicamente trechos não presentes no catálogo offline, adicionado `functions/api/translate.js`, com a **Google Cloud Translation v2**. Configurar `GOOGLE_CLOUD_TRANSLATE_API_KEY` como segredo no ambiente Cloudflare Pages. A chave não vai para o navegador. **Sem ela, os trechos sem tradução predefinida continuam em português**. A tradução automática é um serviço de terceiros, pode gerar custos e envia textos de interface ao Google; verifique avisos de privacidade e quotas antes de habilitar. Informações preenchidas em formulários não são enviadas pelo sistema de tradução.
- **Temas:** as 100 paletas originais do Excel continuam em `js/competition-palettes.js`. Eliminação do caminho legado que aplicava cor de clube nas transferências. Cartões de decisão e eventos recebem a mesma paleta de competição ativa.
- **Visual:** maior uso de espaço desktop, áreas responsivas no celular, prioridade para nome, placar e decisões, menos descrições secundárias e textos decorativos. Avisos essenciais de exclusão e privacidade foram preservados.
- **Escudos:** atualização do cache (V21), prioridade à API-Sports por identidade/country, depois fontes validadas Wikidata/Wikimedia Commons; TheSportsDB apenas fallback adicional. Imagens são cacheadas **depois** de carregar, sem brasões inventados.

## Configuração para hospedagem

1. Hospede o conteúdo no Cloudflare Pages com diretório base deste pacote e suporte a Pages Functions.
2. Opcional, para obter mais escudos oficiais: configure o segredo `API_FOOTBALL_KEY`. Sem esse segredo, a consulta oficial da API-Sports não funciona.
3. Opcional, para que todas as narrativas possam ser traduzidas: habilite a Cloud Translation API no Google Cloud e configure `GOOGLE_CLOUD_TRANSLATE_API_KEY`. A API é faturável; defina cotas/restrições e reveja o tratamento de dados.
4. Abra o site por HTTPS. O modo offline só oferece escudos já resolvidos em cache e as traduções pré-definidas.

## Auditoria de escudos

A execução offline de `node tools/crest-audit.mjs` produziu `docs/crest-audit.json`: **590 entradas brutas, 448 clubes distintos** após deduplicação. **Nenhum deles pôde ser verificado contra os serviços externos neste ambiente de testes** por falta de acesso DNS às APIs. Isso não significa que os 448 estejam sem escudo, mas também não permite garantir cobertura universal.

Para executar uma verificação efetiva no site publicado:

```
node tools/crest-audit.mjs --probe https://SEU-DOMINIO.pages.dev --all
```

O relatório discrimina `image-served`, `not-resolved`, `image-not-loaded` e falhas de API. Escolha um momento com quotas adequadas: a API-Football possui limites de uso. Se o escudo real de algum clube não puder ser confirmado, o jogo exibirá `S/D` em vez de um símbolo falso.

## QA local

- `python tests/v21-browser-qa.py`: **200/200** verificações; cinco larguras (320, 390, 768, 1024 e 1440 px), sem exceções JS.
- `node tests/v20-logic.mjs`: **184/184** verificações de regressão, incluindo lógicas de competição e testes de API simulados.
- `node tests/v21-integrations.mjs`: **8/8** verificações simuladas de idioma e identidade de clubes.
- O carregamento real em Cloudflare e a precisão de todos os escudos exigem validação em produção. Este QA não a substitui.

## Preservação de save

As chaves de carreira e as informações do Hall da Fama não foram apagadas nem migradas de forma destrutiva. O cache de escudos foi renovado para evitar reaproveitar URLs anteriores.
