# STI Atende (SEMA-MT)

Central de suporte de TI com assistente de IA nível 1: resolve problemas conhecidos via POP ou encaminha o chamado ao setor certo (GATI, CSTI, Infraestrutura) conforme o SLA.

## Stack (100% gratuita)

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS 4**: layout responsivo
- **Supabase**: banco e autenticação (Sprint 3)
- **Vercel**: hospedagem (Sprint 4)

## Rodar localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra http://localhost:3000.

## Saúde do sistema

`GET /api/health` devolve o status da aplicação, do banco e da IA, com latência, versão, commit e ambiente. Responde 503 quando algum serviço configurado falha.

## Estrutura

```
docs/            protótipo aprovado (Sprint 0) e prompt original
src/app/         páginas e rotas de API
src/lib/         regras e serviços (ex.: health.ts)
```

## Sprints

| Sprint | Entrega | Status |
|---|---|---|
| 0 | Protótipo HTML (`docs/prototipo.html`) | ✅ |
| 1 | Setup Next.js, Tailwind, Git, rota de saúde | ✅ |
| 2 | Telas do protótipo em componentes React | ⏳ |
| 3 | Supabase + API da IA com regras de SLA | ⏳ |
| 4 | Testes e deploy na Vercel | ⏳ |
