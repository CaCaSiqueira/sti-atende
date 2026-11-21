# Changelog

Todas as mudanças relevantes do STI Atende ficam registradas aqui, da mais nova para a mais antiga.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e as versões seguem o
[Versionamento Semântico](https://semver.org/lang/pt-BR/). Veja a seção "Versionamento" do README.

## [Não publicado]

## [1.4.0] - 2026-11-21

Sprint 8: prova de execução dos testes. Sem migração nova.

### Adicionado

- Verificação automática no GitHub (`.github/workflows/ci.yml`) em todo envio de código e pull request: testes, tipos,
  lint e build de produção. Selo com o resultado no README.
- Testes do banco (`npm run test:banco`) num PostgreSQL de teste: todas as migrações aplicam em ordem; RLS em todas as
  tabelas; o navegador não lê nem grava nada; bucket dos prints privado; limite de requisições com 20 chamadas
  simultâneas e sem acesso pelo navegador.

## [1.3.0] - 2026-11-21

Sprint 7: proteções de produção. Exige a migração `supabase/migrations/20261121220000_sprint7.sql` no banco.

### Alterado

- Limites de requisição (login, chat, chamados, prints, CAR) contados no Supabase: valem para todas as instâncias da
  Vercel e não zeram quando uma reinicia. Se a checagem falhar, a instância usa o limite em memória como reserva.
- Sistema bloqueado (503, tela "indisponível") quando a configuração do Supabase está incompleta, ou ausente na Vercel.
  Antes, nesses casos, ele abria sem login e com chamados em memória. `/api/health` mostra quais variáveis faltam.
- Modo demonstração (memória, sem login) só sem nenhuma chave e fora da Vercel, com faixa de aviso no topo.

### Corrigido

- README dizia que os dados de exemplo entram quando o banco cai; na verdade o sistema mostra erro, e agora isso é a regra.

### Planejado

- Sprints 8 (prova de execução dos testes) e 9 (sincronização do CAR confiável) no Plano de Entrega, a partir dos
  apontamentos da ficha técnica.

## [1.2.0] - 2026-11-21

Sprint 6: histórico e solução. Exige a migração `supabase/migrations/20261121190000_sprint6.sql` no banco.

### Adicionado

- Histórico do chamado: abertura, assumir, mudanças de status, RP e prints, com quem fez e quando. A STI vê tudo; o
  solicitante vê só a linha do tempo de status, sem nomes da equipe.
- Nota de solução, obrigatória para concluir. O solicitante vê a solução na página do chamado.
- Filtros na Consulta de Chamados da STI: status (inclui "Não resolvidos"), setor e "Atribuídos a mim", com contador.
- Cron diário da Vercel em `/api/health`, para o Supabase do plano gratuito não pausar por inatividade.

### Alterado

- Reabrir um chamado resolvido apaga a nota de solução atual (o histórico guarda a anterior).
- Chamados que já existiam começam o histórico pela abertura e, se resolvidos, pela resolução.

## [1.1.1] - 2026-11-21

### Corrigido

- Os prints do erro não ficam mais no cache do navegador (antes ficavam 10 minutos), para não sobrarem depois do
  "Sair" num computador compartilhado.

## [1.1.0] - 2026-11-21

Sprint 5: atendimento por perfil. Exige a migração `supabase/migrations/20261121150000_sprint5.sql` no banco.

### Adicionado

- Três perfis: usuário externo, usuário interno (servidor da SEMA) e equipe da STI, com a conta de demonstração `sti@example.com`.
- Página do chamado (`/chamados/[id]`) com dados, prints do erro e painel de atendimento.
- STI: botão "Assumir chamado" (um chamado aberto passa a "Em análise") e seletor de status; ao mudar ou concluir, pode
  informar o RP e anexar prints.
- RP do equipamento (número de patrimônio, só números): o usuário interno informa nos chamados de hardware; a STI, em
  qualquer chamado.
- Print do erro: até 3 imagens por chamado, escolhidas, arrastadas ou coladas com Ctrl+V; imagens grandes são reduzidas
  no navegador. Ficam em bucket privado e só abrem para quem pode ver o chamado.
- Busca pelo RP na Consulta de Chamados.
- `PERFIL_LOCAL` para testar as telas de cada perfil sem Supabase.

### Alterado

- Usuários veem na lista só número, assunto, solicitante e status simplificado (Aberto, Em análise, Resolvido).
- O perfil `interno` (equipe de TI) passa a se chamar `sti`; o nome antigo continua aceito. A conta `interno@example.com`
  passa a ser de usuário interno (servidor da SEMA).

## [1.0.0] - 2026-11-21

Primeira versão estável: todas as sprints do plano de entrega concluídas e o sistema no ar.

### Adicionado

- Esquema de versionamento: SemVer, este CHANGELOG, tags `vX.Y.Z` e releases no GitHub criadas automaticamente.
- Comando `npm run lancar -- patch|minor|major` para lançar uma versão sem passos manuais.
- Versão do sistema exibida na barra lateral.
- Teste que garante que o CHANGELOG e o `package-lock.json` acompanham a versão do `package.json`.

### Corrigido

- A versão exibida na Saúde do Sistema e em `/api/health` dependia de `npm_package_version`, que só existe quando o
  servidor é iniciado pelo npm; na Vercel caía no valor fixo `0.1.0`. Agora vem do `package.json`.

## [0.4.0] - 2026-11-13

Sprint 4: refinamento e deploy.

### Adicionado

- Login com Supabase Auth (sessão em cookies) e perfis externo e interno; o perfil fica em `app_metadata`.
- `proxy.ts` exige login e bloqueia Visão Geral e Configurações para o perfil externo; as APIs respondem 401/403.
- Usuário externo vê só os próprios chamados.
- Tela de login com acesso rápido às contas de demonstração e script para recriá-las.
- Menu por perfil, nome do usuário e botão Sair.
- Testes de permissão (15 testes no total).

### Alterado

- Limite de 24h da sincronização do CAR passa a valer por usuário logado.
- Funções da Vercel na região São Paulo (`gru1`), perto do banco.

## [0.3.0] - 2026-11-13

Sprint 3: cérebro do agente (back-end).

### Adicionado

- Banco Supabase com RLS: só o servidor (chave secreta) acessa.
- Assistente com Gemini: a IA interpreta e redige, o código decide setor e prioridade; regras locais assumem em
  falha, demora ou sem chave.
- APIs `/api/chat`, `/api/chamados` e `/api/car/sync`, com o limite de 24h do CAR aplicado no servidor.
- Validação de entrada com zod e limite de requisições por IP.
- SLA violado por prioridade e "resolvidos hoje" no fuso de Cuiabá.
- Script para gravar a chave do Gemini no `.env.local` sem exibi-la.
- Esqueletos de carregamento e testes de SLA.

### Alterado

- Saúde do Sistema com consulta real ao banco e status da última chamada à IA; o painel fica só em Configurações.
- Pedidos fora de TI (móveis, material de escritório) vão para a triagem.

## [0.2.0] - 2026-11-13

Sprint 2: front-end responsivo.

### Adicionado

- Telas do protótipo em React: Assistente IA, Visão Geral, Consulta e Abertura de Chamados, Configurações.
- Barra lateral fixa no desktop e gaveta no celular.
- POP do CAR (limite de 24h) e roteamento N1 por palavra inteira, sem acento, com testes.
- Saúde do Sistema ao vivo (atualiza a cada 15s) e Plano de Entrega.

## [0.1.0] - 2026-11-13

Sprint 1: setup. Inclui o protótipo aprovado na Sprint 0 em `docs/`.

### Adicionado

- Projeto Next.js com TypeScript e Tailwind, paleta do protótipo e idioma pt-BR.
- Rota `GET /api/health` com status, latência, versão e ambiente.
- `.env.example`, script `typecheck` e README em português.
