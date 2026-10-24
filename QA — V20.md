# QA — Be The Legend V20

- Código base: Be The Legend V19 Competition Engine.
- Fonte de cores: planilha anexada `paletas_100_ligas_futebol(1).xlsx`, aba `Paletas (100)`, A5:I104 (100 registros).
- Conferência de paletas: 100/100 resolvidas com ID e HEX originais.
- Conferência dos nomes no cadastro do simulador: 62/62 resolvidos por nome canônico, alias ou liga do mesmo país. Temas de copas ausentes do Excel são aproximações derivadas.
- QA de interface: 135/135; dimensões 1440, 1024, 768, 390 e 320 px. Sem exceções JS e sem rolagem horizontal nos fluxos verificados.
- QA de lógica: 184/184, incluindo integridade por campeonato e servidor de escudos com API simulada.
- Idiomas testados: português, inglês, espanhol e francês, com retorno ao português e status selecionado.
- Escudos: mecanismo de imagem validada antes de cache, nova versão do cache, descarte da URL falha, retries e novos serviços. Mock API-Sports valida nome e país; acessos externos não foram verificados em ambiente público.

## Limitações de QA

1. As capturas reproduzem o HTML/CSS/JS real em navegador Chromium com fontes e outros serviços externos bloqueados; a tipografia remota e o carregamento real dos escudos precisam de conferência no domínio final.
2. A tradução é operacional nos menus e interfaces principais, mas não cobre todo o roteiro narrativo original.
3. Não foi possível provar que todos os 336 clubes listados no jogo retornam escudo válido online. O diagnóstico `window.BTLCrestDiagnostics()` pode listar falhas observadas durante a sessão de jogo.
4. A planilha contém aproximações editoriais, não paletas certificadas pelas organizações de competição.
