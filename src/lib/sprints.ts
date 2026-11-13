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
    status: "em_andamento",
  },
  {
    numero: 4,
    titulo: "Refinamento e deploy",
    entrega: "Login (usuário interno e externo), testes finais e publicação na Vercel.",
    status: "pendente",
  },
];
