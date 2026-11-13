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

Abra http://localhost:3000. Sem as chaves, o sistema funciona com dados de exemplo e regras locais.

### Variáveis de ambiente (`.env.local`)

| Variável | Onde pegar |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SECRET_KEY` | Supabase > Project Settings > API Keys (chave **secreta**, só no servidor) |
| `SUPABASE_PUBLISHABLE_KEY` | Mesma tela (chave **publicável**, usada só para login/sessão) |
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey (ou rode `scripts/definir-chave-gemini.ps1`, que grava sem exibir) |
| `GEMINI_MODEL` | Opcional; padrão `gemini-3.5-flash-lite` |

O schema do banco está em `supabase/migrations/`.

## Como a IA decide

A IA **interpreta e redige**; o **código decide** setor e prioridade pelas regras de SLA. Se o Gemini falhar, demorar mais de 8s ou estiver sem chave, as regras locais assumem e o chat mostra quem respondeu. A mensagem do usuário é tratada como dado (proteção contra *prompt injection*).

| Comando | O que faz |
|---|---|
| `npm test` | Testes das regras de roteamento (Node test runner, sem dependências) |
| `npm run typecheck` | Checagem de tipos |
| `npm run lint` | ESLint |
| `npm run build` | Build de produção |

## Acesso para avaliação

A tela de login tem botões de acesso rápido. As contas são de demonstração, com dados fictícios:

| Perfil | E-mail | Senha | Vê |
|---|---|---|---|
| Usuário externo | `externo@example.com` | `Demo-STI-2026` | Assistente IA, Meus Chamados, Novo Chamado |
| Equipe interna (TI) | `interno@example.com` | `Demo-STI-2026` | Tudo, incluindo Visão Geral e Configurações (Saúde do Sistema) |

O perfil fica em `app_metadata` (só o servidor altera). O `src/proxy.ts` exige login e bloqueia rotas internas para o perfil externo; as APIs respondem 401/403. Recriar as contas: `node --env-file=.env.local scripts/criar-usuarios-demo.mjs`.

## Telas

| Rota | Tela |
|---|---|
| `/assistente` | Assistente IA (entrada padrão) com POP do CAR e roteamento N1 |
| `/visao-geral` | Indicadores e volume por setor (interno) |
| `/chamados` | Consulta com busca; o externo vê só os próprios chamados |
| `/chamados/novo` | Abertura manual com classificação automática |
| `/configuracoes` | Saúde do Sistema ao vivo (atualiza a cada 15s) + Plano de Entrega (interno) |
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

## Saúde do sistema

`GET /api/health` devolve o status da aplicação, do banco e da IA, com latência, versão, commit e ambiente. Responde 503 quando algum serviço configurado falha.

## Estrutura

```
docs/            protótipo aprovado (Sprint 0) e prompt original
src/app/(app)/   telas (layout com barra lateral)
src/app/api/     rotas de API (health)
src/components/  componentes React por área (chat, chamados, saude, layout)
src/lib/         regras de negócio e acesso a dados (roteamento, chamados, health, sprints)
src/types/       tipos compartilhados
```

## Sprints

| Sprint | Entrega | Status |
|---|---|---|
| 0 | Protótipo HTML (`docs/prototipo.html`) | ✅ |
| 1 | Setup Next.js, Tailwind, Git, rota de saúde | ✅ |
| 2 | Telas do protótipo em React, roteamento testado, Saúde ao vivo | ✅ |
| 3 | Supabase com RLS, IA Gemini com fallback, SLA no servidor | ✅ |
| 4 | Login por perfil, deploy na Vercel (São Paulo), testes de permissão | ✅ |
