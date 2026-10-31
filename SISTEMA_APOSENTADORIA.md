# Be The Legend — universo de jogadores e aposentadoria

> **ATUALIZAÇÃO — ELENCOS AUTOMÁTICOS:** a versão atual busca o banco Transfermarkt/Kaggle automaticamente durante a criação de novas carreiras, sem que o jogador importe arquivos. Consulte `SISTEMA_ELENCOS_AUTOMATICOS.md` para o funcionamento e as limitações. As opções de importação manual descritas abaixo são procedimentos legados de edição do projeto, não mais necessários no fluxo normal do jogador. A fonte pública continua datada de **6 de julho de 2026**, sem confirmação da última janela de 2026/27.

## O que foi implementado

A cada virada de temporada, o universo inteiro carregado no save é processado **uma única vez**. Cada jogador real possui uma identidade persistente; caso haja data de nascimento no `players.csv`, a idade parte do ano de nascimento real (o aniversário exato não é simulado, pois o jogo evolui anualmente). O GER simulado pode aumentar durante a juventude, estabilizar no auge e cair progressivamente com a idade. Goleiros atingem o auge um pouco mais tarde. Jogadores gerados seguem as mesmas regras.

A idade normal de aposentadoria é sorteada **deterministicamente por ID**, com a seguinte distribuição: 36 anos (12%), 37 (19%), 38 (28%), 39 (25%), 40 (16%). A média teórica é **38,14 anos**. Há uma exceção inevitável: atletas reais que **já estão com mais de 40 anos no início de um save** aparecem no elenco inicial e só se aposentam na primeira virada; a idade real da aposentadoria deles pode superar 40. O personagem controlado pelo usuário também tem limite automático entre 36 e 40 anos; aposentadoria voluntária continua disponível pelas regras anteriores.

A aposentadoria remove o atleta das listas de jogadores ativos, mas preserva seu registro histórico no save. Para cada aposentadoria, surge um novo atleta fictício entre 16 e 19 anos, **no mesmo clube e posição**, com GER de base, potencial estimado e ID `regen:ANO:...`. Nunca é atribuído o nome de um jogador existente de maneira intencional; os novos nomes são combinações fictícias e podem coincidir casualmente com nomes reais. O sistema também continua a utilizar transferências mundiais, incluindo atletas gerados.

A área **Mercado → Universo de jogadores** permite pesquisar os atletas atuais e históricos, observar aposentadorias e regens e importar uma base em massa. Saves grandes usam **IndexedDB**, evitando exceder o limite pequeno do `localStorage`. A importação é validada e só altera o save após a gravação bem-sucedida. Repetir a virada do mesmo ano não duplica aposentadorias/novos atletas.

## Como começar uma carreira com o banco completo Transfermarkt/Kaggle

Fonte recomendada: [Kaggle — Player Scores, de davidcariboo](https://www.kaggle.com/datasets/davidcariboo/player-scores), gerada a partir do [projeto transfermarkt-datasets](https://github.com/dcaribou/transfermarkt-datasets). Baixe e extraia `players.csv` e, opcionalmente, `clubs.csv`. Os arquivos `.csv.gz` também são aceitos.

**Opção A — importar pelo jogo:** crie sua carreira, abra **Mercado → Universo de jogadores**, e selecione `players.csv` e, opcionalmente, `clubs.csv` na mesma seleção de arquivos. Faça isso **antes de encerrar a primeira temporada**. O banco será salvo localmente em IndexedDB para essa carreira. Um save anterior à importação **não** é alterado retroativamente. Excluir os dados do site no navegador apaga o mundo salvo.

**Opção B — preparar um pacote já populado para todos os novos saves:** na raiz do projeto execute:

```bash
node tools/build-world-catalog.cjs /caminho/players.csv /caminho/clubs.csv --as-of=2026-07-06
```

O comando substitui `js/world-catalog.js` pelo catálogo real datado. Publique a pasta do jogo com esse arquivo incluído. Cada **nova** carreira começa automaticamente com todos os jogadores ativos e com clube do catálogo, sem necessidade de importação manual. A opção de importar pelo jogo continua disponível. Para arquivos compactados use `players.csv.gz` e `clubs.csv.gz` nos mesmos argumentos. Se a fonte tiver uma data diferente, atualize o `--as-of`. A data é informativa e não é comprovada automaticamente.

## Transparência sobre a fonte

- **Não foi incluída nenhuma cópia do banco completo Transfermarkt/EA Sports/Football Manager.** A cópia Kaggle precisa ser fornecida pelo proprietário/editor do site, com observância das condições de uso dos dados. Não há scraping automatizado do site Transfermarkt.
- A versão pública do `transfermarkt-datasets` consultada estava interrompida e informava cobertura até **6 de julho de 2026**. **Não é um retrato confiável dos elencos completos de outubro de 2026 / temporada 2026–27**. Para garantir elencos realmente atuais, é necessário fornecer uma atualização datada e verificada. O programa nunca atualiza magicamente transferências posteriores à data do catálogo.
- O arquivo de `players.csv` contém identificação, datas, clubes, posições e valores de mercado, **não** as notas técnicas completas do EA FC/FM. Portanto, o GER e potencial dos atletas importados são **estimativas internas do jogo baseadas no valor de mercado**; não são notas publicadas pelo Transfermarkt nem atributos licenciados do EA/FM. Essa condição aparece na interface.
- Sem catálogo fornecido, o jogo funciona com **a cobertura parcial de jogadores já existente no projeto enviado** (estrelas e nove elencos locais), que **não** é rotulada como fonte Transfermarkt e **não** deve ser confundida com cobertura de todos os clubes. Para a modalidade *exclusivamente Transfermarkt*, configure a opção A ou B.
- O banco de jogadores usa ID do Transfermarkt (`tm:ID`) para diferenciar nomes homônimos, com `current_club_id` e ID de clube quando disponível. Se o arquivo de clube não vier, a sigla do campeonato é usada quando reconhecida; algumas ligas periféricas podem ficar sem código de país e requerer enriquecimento de dados.

## Testes de verificação

Execute:

```bash
node --test tests/world-career.test.cjs
node tests/v20-logic.mjs
node --check js/app.js
```

Os testes validam a distribuição etária, a queda de GER, nascimento no clube correto, singularidade de IDs, não duplicação, conversão do esquema Kaggle e avanço de **50 mil atletas** em lote. Alguns testes antigos de versões históricas do projeto podem falhar por incompatibilidades de conteúdo anteriores a esta atualização; isso não equivale a aprovação de regressão completa da interface.

## Arquivos alterados

- `js/world-career.js`: motor testável de evolução, importação e IndexedDB.
- `js/world-catalog.js`: marcador para catálogo compilado (vazio nesta entrega).
- `js/app.js`: integração com save, transição anual, aposentadoria do protagonista, mercado e relatórios.
- `index.html` e `css/style.css`: painel de gerenciamento do universo.
- `tools/build-world-catalog.cjs`: gerador de catálogo estático a partir de CSV Kaggle.
- `tests/world-career.test.cjs`: testes automatizados.
