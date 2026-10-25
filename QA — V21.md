# Be The Legend V21 — Resultado de testes

| Bloco | Resultado | Escopo |
|---|---:|---|
| Interface (Chromium) | 200/200 | Menu, idiomas e flags, reversão de idioma, conteúdo dinâmico, 5 resoluções, paletas, modais de pênalti |
| Lógica V20 regressiva | 184/184 | Regras, simulação, API mockada |
| Integrações V21 | 8/8 | País+clube correto, rejeitar país incompatível, Google Cloud Translation mockado, ausência de credenciais e origem inválida |
| Exceções JavaScript do navegador | 0 | Fluxos que integram a bateria visual |
| Clubes catalogados | 448 distintos | Deduplicação de 590 registros locais |
| Escudos verificados ao vivo | 0 | Ambiente sem DNS externo. **Não se pode concluir que todos carregam.** |

Capturas: `tests/QA-V21/home-1440.png`, `home-390.png`, `language-390.png`, `language-1440.png`, `penalty-1440.png`, `penalty-390.png`.

**Pendências externas identificadas:** Google Cloud Translation configurado para textos não presentes no dicionário; chave API-Sports para melhor resolução de escudos; teste de escudos em domínio real. Três serviços externos sem credenciais/dados atuais não equivalem a sucesso de cobertura.
