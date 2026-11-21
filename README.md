# STI Atende (SEMA-MT)

**No ar:** https://sti-atende.vercel.app

Central de suporte de TI com assistente de IA nível 1: resolve problemas conhecidos via POP ou encaminha o chamado ao setor certo (GATI, CSTI, Infraestrutura) conforme o SLA.

## Stack (100% gratuita)

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS 4**: layout responsivo
- **Supabase**: banco Postgres com RLS (só o servidor acessa)
- **Gemini** (`gemini-3.5-flash-lite`, plano gratuito): IA do assistente, com fallback para regras locais
- **Vercel**: hospedagem, funções na região São Paulo (`gru1`), perto do banco

## Rodar localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra http://localhost:3000. Sem nenhuma chave do Supabase, o sistema abre em **modo demonstração** (veja [Modos de funcionamento](#modos-de-funcionamento)).

### Variáveis de ambiente (`.env.local`)

| Variável | Onde pegar |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SECRET_KEY` | Supabase > Project Settings > API Keys (chave **secreta**, só no servidor) |
| `SUPABASE_PUBLISHABLE_KEY` | Mesma tela (chave **publicável**, usada só para login/sessão) |
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey (ou rode `scripts/definir-chave-gemini.ps1`, que grava sem exibir) |
| `GEMINI_MODEL` | Opcional; padrão `gemini-3.5-flash-lite` |
| `PERFIL_LOCAL` | Só no modo demonstração: simula um usuário logado (`externo`, `servidor` ou `sti`) para testar as telas de cada perfil |

O schema do banco está em `supabase/migrations/`. Os prints do erro ficam no Storage do Supabase, no bucket privado `prints` (criado pela migração da Sprint 5).

## Como a IA decide

A IA **interpreta e redige**; o **código decide** setor e prioridade pelas regras de SLA. Se o Gemini falhar, demorar mais de 8s ou estiver sem chave, as regras locais assumem e o chat mostra quem respondeu. A mensagem do usuário é tratada como dado (proteção contra *prompt injection*).

| Comando | O que faz |
|---|---|
| `npm test` | Testes de roteamento, SLA, permissões, imagens e versão (Node test runner, sem dependências) |
| `npm run typecheck` | Checagem de tipos |
| `npm run lint` | ESLint |
| `npm run build` | Build de produção |
| `npm run lancar -- minor` | Lança uma versão nova (veja [Versionamento](#versionamento)) |

## Acesso para avaliação

A tela de login tem botões de acesso rápido. As contas são de demonstração, com dados fictícios:

| Perfil | E-mail | Senha | Vê |
|---|---|---|---|
| Usuário externo | `externo@example.com` | `Demo-STI-2026` | Assistente IA, Meus Chamados, Novo Chamado |
| Usuário interno (servidor da SEMA) | `interno@example.com` | `Demo-STI-2026` | O mesmo do externo, e informa o RP do equipamento |
| Equipe da STI | `sti@example.com` | `Demo-STI-2026` | Tudo: todos os chamados, Visão Geral e Configurações (Saúde do Sistema) |

O perfil fica em `app_metadata` (só o servidor altera), com os valores `externo`, `servidor` ou `sti`. O nome antigo `interno` (equipe de TI até a v1.0.0) continua valendo como `sti`. O `src/proxy.ts` exige login e bloqueia as rotas da STI para os demais; as APIs respondem 401/403. Recriar as contas: `node --env-file=.env.local scripts/criar-usuarios-demo.mjs`.

## Perfis e permissões

| Ação | Usuário externo | Usuário interno | Equipe da STI |
|---|---|---|---|
| Ver chamados | Só os que abriu | Só os que abriu | Todos |
| Colunas da lista | Nº, assunto, solicitante, status | Nº, assunto, solicitante, status | + setor, responsável e RP |
| Status | Aberto / Em análise / Resolvido | Aberto / Em análise / Resolvido | Todos, incluindo "Aguardando terceiros" |
| Anexar print do erro (até 3) | Enquanto não resolvido | Enquanto não resolvido | Sempre |
| Informar o RP do equipamento | Não | No próprio chamado de hardware | Sempre |
| Assumir chamado e mudar status | Não | Não | Sim (ao mudar ou concluir, pode incluir RP e print) |
| Concluir | Não | Não | Só com a **nota de solução** (mín. 10 caracteres), que o solicitante lê |
| Histórico do chamado | Linha do tempo de status, sem nomes da equipe | Linha do tempo de status, sem nomes da equipe | Completo: quem fez o quê e quando (abertura, assumir, status, RP, prints) |
| Filtros da lista | Busca | Busca | Busca + status, setor e "atribuídos a mim" |

- **RP** é o número de patrimônio do equipamento: só números, opcional.
- **Reabrir** um chamado resolvido apaga a nota atual; o histórico guarda a anterior.
- **Chamado interno** é o aberto por servidor da SEMA ou pela STI; aparece marcado para a STI.
- As regras ficam em `src/lib/permissoes.ts` e valem nas telas e nas APIs. Chamado de outra pessoa responde "não encontrado".
- **Prints:** PNG, JPG ou WebP, conferidos pelos bytes do arquivo (não pela extensão). Imagens grandes são reduzidas no navegador antes do envio. Ficam em bucket privado e só abrem por `/api/anexos/[id]`, para quem pode ver o chamado.

## Telas

| Rota | Tela |
|---|---|
| `/assistente` | Assistente IA (entrada padrão) com POP do CAR e roteamento N1 |
| `/visao-geral` | Indicadores e volume por setor (STI) |
| `/chamados` | Meus Chamados (usuários) ou Consulta de Chamados (STI), com busca e, para a STI, filtros |
| `/chamados/[id]` | Página do chamado: solução, dados, prints, histórico e, para a STI, Assumir e Status (com RP, print e nota de solução) |
| `/chamados/novo` | Abertura manual com classificação automática, RP (hardware, usuário interno) e print do erro |
| `/configuracoes` | Saúde do Sistema ao vivo (atualiza a cada 15s) + Plano de Entrega (STI) |
| `/login` | Entrada com acesso rápido às contas de demonstração |

## Regras de roteamento (SLA)

| Situação | Destino | Prioridade |
|---|---|---|
| Erro no CAR | POP de sincronização (1x a cada 24h) ou CSTI | Média |
| Rede / internet / VPN | Coordenação de Infraestrutura | Urgente |
| Hardware / impressora / monitor | GATI | Média |
| Sistemas / SIGPAS / senha | CSTI | Média |
| Não identificado | Triagem N1 | Baixa |

As regras ficam em `src/lib/roteamento.ts` e casam palavras inteiras sem acento ("carregar" não dispara o CAR).

## Modos de funcionamento

A regra fica em `src/lib/ambiente.ts` e vale para o proxy, as APIs, o acesso ao banco e a Saúde do Sistema.

| Situação | Modo | O que acontece |
|---|---|---|
| As três chaves do Supabase configuradas | Normal | Banco, login e Storage do Supabase |
| Nenhuma chave, fora da Vercel (computador local) | Demonstração | Chamados de exemplo em memória, sem login, faixa de aviso no topo. Nada é salvo |
| Nenhuma chave na Vercel, ou configuração incompleta em qualquer lugar | Bloqueado | Páginas e APIs respondem 503 "configuração incompleta"; `/api/health` mostra quais variáveis faltam (só os nomes) |

O sistema **nunca** cai para a memória em produção: se o banco configurado ficar fora do ar, as operações dão erro e a Saúde do Sistema mostra a falha.

## Limites de requisição

Login, chat, abertura e atualização de chamados, prints e sincronização do CAR têm limite por IP e por minuto. A contagem fica no Supabase (função `permitir_requisicao`, migração da Sprint 7): vale para todas as instâncias da Vercel e não zera quando uma reinicia. Se a checagem no banco falhar, a instância usa um limite em memória como reserva, em vez de liberar tudo. O limite em memória puro só é usado no modo demonstração.

## Saúde do sistema

`GET /api/health` devolve o status da aplicação, do banco e da IA, com latência, versão, commit e ambiente. Responde 503 quando algum serviço configurado falha.

A Vercel chama essa rota uma vez por dia (cron em `vercel.json`). A consulta real ao banco conta como uso e impede que o Supabase pause o projeto por inatividade no plano gratuito.

## Estrutura

```
docs/            protótipo aprovado (Sprint 0) e prompt original
src/app/(app)/   telas (layout com barra lateral)
src/app/api/     rotas de API (health)
src/components/  componentes React por área (chat, chamados, saude, layout)
src/lib/         regras de negócio e acesso a dados (roteamento, chamados, health, sprints, versao)
src/types/       tipos compartilhados
```

## Sprints

| Sprint | Entrega | Versão | Status |
|---|---|---|---|
| 0 | Protótipo HTML (`docs/prototipo.html`) | (incluída na 0.1.0) | ✅ |
| 1 | Setup Next.js, Tailwind, Git, rota de saúde | 0.1.0 | ✅ |
| 2 | Telas do protótipo em React, roteamento testado, Saúde ao vivo | 0.2.0 | ✅ |
| 3 | Supabase com RLS, IA Gemini com fallback, SLA no servidor | 0.3.0 | ✅ |
| 4 | Login por perfil, deploy na Vercel (São Paulo), testes de permissão | 0.4.0 | ✅ |
| 5 | Perfis externo/interno/STI, RP do equipamento, print do erro, atendimento pela STI | 1.1.0 | ✅ |
| 6 | Histórico do chamado, nota de solução, filtros da STI, banco sempre ativo | 1.2.0 | ✅ |
| 7 | Limites de requisição no banco, sistema bloqueado sem configuração completa | 1.3.0 | ✅ |
| 8 | Verificação automática no GitHub e testes do banco (migrações e funções) | 1.4.0 | Planejada |
| 9 | CAR: regra de 24h atômica, estados da sincronização e aviso de simulação | 1.5.0 | Planejada |

A versão **1.0.0** é a primeira estável: plano de entrega concluído e sistema no ar.

## Versionamento

O projeto segue o [Versionamento Semântico](https://semver.org/lang/pt-BR/) (`MAIOR.MENOR.CORREÇÃO`). A versão fica no `package.json` e aparece na barra lateral, na Saúde do Sistema e em `/api/health`. O histórico está no [CHANGELOG.md](CHANGELOG.md).

| Mudança | Exemplo | Versão |
|---|---|---|
| Correção sem mudar o comportamento esperado | Ajuste de texto, bug no roteamento | `1.0.0` → `1.0.1` (`patch`) |
| Funcionalidade nova, compatível | Nova tela, nova regra de SLA, nova sprint | `1.0.0` → `1.1.0` (`minor`) |
| Mudança que quebra algo existente | Rota de API removida ou renomeada, migração que exige ação manual | `1.0.0` → `2.0.0` (`major`) |

As mensagens de commit seguem os [Conventional Commits](https://www.conventionalcommits.org/pt-br/), que indicam o tipo de versão: `fix:` pede `patch`, `feat:` pede `minor` e `feat!:` ou `BREAKING CHANGE:` pede `major`. Já `docs:`, `test:` e `chore:` sozinhos não exigem versão nova.

**No dia a dia:** a cada mudança relevante, anote uma linha em `## [Não publicado]` no `CHANGELOG.md`, nas seções Adicionado, Alterado, Corrigido ou Removido.

**Para lançar uma versão:**

```bash
npm run lancar -- minor
git push --follow-tags
```

O primeiro comando aceita `patch`, `minor` ou `major`. Ele transforma o "Não publicado" na nova versão com a data de hoje, atualiza o `package.json` e o `package-lock.json`, faz o commit `chore(release): vX.Y.Z` e cria a tag `vX.Y.Z`. Ao receber a tag, o GitHub cria a release com as notas do CHANGELOG (`.github/workflows/release.yml`). O `npm test` falha se a versão do `package.json` não tiver entrada no CHANGELOG.
