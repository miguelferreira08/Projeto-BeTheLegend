# Be The Legend — elencos automáticos para novos saves

## Funcionalidade entregue

O jogador não precisa procurar um CSV nem utilizar menus de importação. Quando finaliza a criação de uma carreira, o site consulta automaticamente a distribuição pública **Transfermarkt / Kaggle Player Scores**, converte os jogadores ativos para o motor de simulação e **grava o catálogo no IndexedDB antes de iniciar** o save. A lista inteira é processada pelo motor de envelhecimento, queda de GER, aposentadoria entre 36 e 40 anos e geração de regens. As telas de elencos passam a consultar os atletas persistidos no save, sem depender das listas estáticas dos clubes.

O site contém a função Cloudflare Pages `/api/world-transfermarkt?part=players` e `/api/world-transfermarkt?part=clubs`, que serve como proxy de mesmo domínio para a cópia pública. Quando a função não está disponível, o navegador tenta acessar a fonte pública diretamente (essa alternativa pode ser bloqueada por CORS, dependendo do provedor). A gravação ocorre uma vez por nova carreira; carregar um save antigo **não** substitui os elencos da carreira. Sem conexão ou sem armazenamento persistente, o jogo pode iniciar com a base local reduzida, mas mostra claramente a origem parcial; **não** simula que o banco foi instalado.

## Limitação de atualidade (IMPORTANTE)

**Não há, nesta entrega, base verificada da última janela de transferências de 2026/27.** O conjunto de dados disponível pelo projeto [dcaribou/transfermarkt-datasets](https://github.com/dcaribou/transfermarkt-datasets) e pelo [Kaggle Player Scores](https://www.kaggle.com/datasets/davidcariboo/player-scores) declara que suas atualizações foram interrompidas em **6 de julho de 2026**. Por isso, ele é referenciado como `sourceDate: 2026-07-06` e traz `verified2026Window: false`. Não se deve considerá-lo uma reprodução exata dos clubes em 30 de outubro de 2026. O fato de baixar o catálogo automaticamente **não faz o catálogo tornar-se atual**.

O banco público contém jogador, clube, posição, nascimento e valor de mercado, mas não os atributos técnicos oficiais do EA FC / FM. GER e potencial são estimados internamente e identificados como estimativas. Os IDs originais Transfermarkt são usados com prefixo `tm:`.

Não foi possível efetuar download e embutir o CSV completo no ZIP deste ambiente (acesso externo a downloads de arquivos indisponível). O catálogo, portanto, é **obtido no primeiro início de uma nova carreira, pela rede**, não está pré-instalado offline. Para funcionamento confiável, hospede a pasta do projeto com as `functions/` do **Cloudflare Pages**. Hospedagem estática sem funções depende do CORS do servidor de dados e não tem garantia de atualização.

## Arquivos

- `js/world-auto-loader.js`: obtenção automática, validação, descompressão gzip, mapeamento e cache por sessão.
- `functions/api/world-transfermarkt.js`: proxy com URL fixa, sem endpoints arbitrários; cabeçalhos de cache e data da fonte.
- `js/app.js`: espera pelo catálogo e armazenamento na finalização de nova carreira; preserva saves anteriores.
- `js/rosters.js`: consultas de plantéis priorizam os jogadores do save (inclusive depois de aposentadorias e transferências simuladas).
- `index.html`: carrega o novo motor e remove o formulário de importação manual do Mercado.
- `tests/world-auto-loader.test.cjs`: testes da aquisição, gzip, IDs e validação do proxy.

## Testar

```sh
node --check js/app.js
node --check js/rosters.js
node --check js/world-auto-loader.js
node --test tests/world-career.test.cjs tests/world-auto-loader.test.cjs
```

Os testes isolados não representam uma verificação de disponibilidade externa em produção. É recomendado observar no navegador a primeira carreira criada em Cloudflare Pages e confirmar na aba Mercado a origem e o número de jogadores carregados.
