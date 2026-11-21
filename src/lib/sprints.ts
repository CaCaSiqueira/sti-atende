export type StatusSprint = "concluida" | "em_andamento" | "pendente";

export interface Sprint {
  numero: number;
  titulo: string;
  entrega: string;
  status: StatusSprint;
}

/** Fonte única do Plano de Entrega exibido em Configurações. Atualize ao fechar cada sprint. */
export const SPRINTS: Sprint[] = [
  {
    numero: 0,
    titulo: "Protótipo e arquitetura",
    entrega: "Protótipo navegável, regras de negócio e stack gratuita definida.",
    status: "concluida",
  },
  {
    numero: 1,
    titulo: "Setup",
    entrega: "Next.js 16, TypeScript, Tailwind, Git/GitHub e rota /api/health.",
    status: "concluida",
  },
  {
    numero: 2,
    titulo: "Front-end responsivo",
    entrega: "Telas do protótipo em React, roteamento N1 testado e Saúde do Sistema ao vivo.",
    status: "concluida",
  },
  {
    numero: 3,
    titulo: "Cérebro do agente (back-end)",
    entrega: "Supabase com RLS, IA Gemini com fallback para regras, SLA calculado e limite de 24h do CAR no servidor.",
    status: "concluida",
  },
  {
    numero: 4,
    titulo: "Refinamento e deploy",
    entrega: "Login por perfil (interno e externo) com proxy, deploy na Vercel em São Paulo e testes de permissão.",
    status: "concluida",
  },
  {
    numero: 5,
    titulo: "Atendimento por perfil",
    entrega: "Perfis externo, interno e STI; RP do equipamento; print do erro; STI assume e muda o status do chamado.",
    status: "concluida",
  },
  {
    numero: 6,
    titulo: "Histórico e solução",
    entrega: "Histórico do chamado, nota de solução obrigatória ao concluir, filtros da STI e banco sempre ativo (cron diário).",
    status: "concluida",
  },
  {
    numero: 7,
    titulo: "Proteções de produção",
    entrega: "Limites de requisição no banco (valem para todas as instâncias) e sistema bloqueado sem configuração completa.",
    status: "concluida",
  },
  {
    numero: 8,
    titulo: "Prova de execução dos testes",
    entrega: "Verificação automática no GitHub (testes, tipos, lint, build) e banco de teste que aplica as migrações e testa as funções.",
    status: "pendente",
  },
  {
    numero: 9,
    titulo: "Sincronização do CAR confiável",
    entrega: "Regra de 24h atômica no banco, estados solicitada/em processamento/concluída e aviso de simulação sem a integração real.",
    status: "pendente",
  },
];
