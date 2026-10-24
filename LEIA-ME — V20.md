# BE THE LEGEND — V20 / COMPETITION PALETTES + LANGUAGE

## Cinco alterações

1. **Escudos reais:** O carregamento é feito por API-Sports (Cloudflare Pages com API_FOOTBALL_KEY), Wikimedia Commons, TheSportsDB e, como último recurso, o arquivo de imagem associado à identidade do clube no Wikidata. A URL só entra no cache após a imagem carregar, URLs quebradas são descartadas e o sistema faz nova tentativa com outro provedor. A correspondência entre nome e país é conservadora; um clube sem arquivo confiável usa o estado textual `S/D`, **não um escudo fictício**.
2. **Mais hierarquia visual:** Menu com nomes de setores, tipografia principal maior, destaque do jogador e resultados, cores de competição nos painéis e cabeçalhos; microdescrições dispensáveis foram suprimidas onde não tinham função operacional.
3. **Idiomas:** Botão Linguagem no menu inicial, com Português, English, Español, Français; escolha salva localmente (`btl-ui-language-v20`). Traduz mais de 150 expressões centrais da interface e menus, inclusive textos alterados pelo jogo. **Limitação:** narrativas extensas já existentes, comentários e alguns rótulos dinâmicos do simulador continuam originalmente em português. Não há um serviço externo de tradução nem textos inventados.
4. **100 paletas:** A aplicação lê no tempo de compilação os 100 registros da planilha fornecida `docs/paletas_100_ligas_futebol.xlsx`, gerando `js/competition-palettes.js`. Cada registro mantém literalmente suas cores `Principal`, `Secundária` e `Terciária`; correspondências conhecidas (ex.: LaLiga, Serie A, Brasileirão Série B) e nomes equivalentes também estão mapeados. Copas ausentes da planilha usam a paleta da liga correspondente como associação editorial claramente marcada. Para nomes completamente desconhecidos, mantém-se o visual de contingência do simulador.
5. **Tema global:** Variáveis `--competition-primary`, `--competition-secondary`, `--competition-tertiary` e `--club-primary` são atualizadas conforme a partida/competição; componentes, navegação, HUD e áreas principais usam o tema correspondente, independentemente do time do jogador.

## Sobre a planilha

A própria aba Critérios e fontes explica que as cores são **aproximações editoriais inspiradas nas identidades visuais**, não prova de autorização de marcas nem de correspondência exata com manuais oficiais. Nomes de alguns torneios podem variar por patrocinador e temporada.

## Implantação

- Abra `index.html` em hospedagem estática moderna para acessar os arquivos do jogo. Para habilitar as funções de servidor de escudos e autenticação, publique o projeto em Cloudflare Pages com suporte a `functions/`.
- Configure `API_FOOTBALL_KEY` como variável secreta no servidor; nunca inclua a chave no JavaScript entregue aos usuários.
- Use HTTPS para o Google Login e registre seu domínio no provedor de autenticação.
- Orbitron permanece configurada via Google Fonts. A conexão com o serviço é necessária para a fonte remota.
- Algumas redes limitam Wikimedia, Wikidata, TheSportsDB ou API-Sports; nenhum provedor garante todos os escudos. Não afirmar cobertura integral sem testar no domínio publicado.

## Verificações locais

- 100/100 paletas originais reproduzidas.
- 62/62 nomes de ligas/copas do cadastro primário vinculados a um tema de planilha ou liga correspondente.
- 135/135 cenários de interface (5 larguras de tela, 4 idiomas, temas, menus, card e pênaltis), sem erros de JavaScript registrados.
- 184/184 cenários de lógica e API simulada.
- Os serviços externos reais **não foram validados em produção**. O relatório `QA — V20.md` discrimina essa limitação.

## Conteúdo preservado

Arquivos existentes de áudio, gráficos, carreiras salvas, mecânicas, eventos, estatísticas, login e plantéis foram mantidos. A troca de idiomas não altera o save da carreira.
