import type { Prioridade, Setor, StatusChamado } from "../types/chamado";

/** Rótulos e cores de cada setor, usados em badges, gráficos e mensagens da IA. */
export const SETORES: Record<Setor, { sigla: string; nome: string; badge: string; barra: string }> = {
  CSTI: {
    sigla: "CSTI",
    nome: "Coordenadoria de Sistemas de Tecnologia da Informação",
    badge: "bg-blue-100 text-blue-800",
    barra: "bg-blue-600",
  },
  GATI: {
    sigla: "GATI",
    nome: "Gerência de Atendimento Técnico",
    badge: "bg-purple-100 text-purple-800",
    barra: "bg-purple-600",
  },
  INFRA: {
    sigla: "Infraestrutura",
    nome: "Coordenação de Infraestrutura",
    badge: "bg-orange-100 text-orange-800",
    barra: "bg-orange-500",
  },
  TRIAGEM: {
    sigla: "Triagem N1",
    nome: "Triagem de nível 1",
    badge: "bg-gray-100 text-gray-800",
    barra: "bg-gray-500",
  },
};

export const STATUS: Record<StatusChamado, { rotulo: string; badge: string }> = {
  aberto: { rotulo: "Aberto", badge: "bg-sky-100 text-sky-800" },
  em_analise: { rotulo: "Em análise", badge: "bg-yellow-100 text-yellow-800" },
  aguardando_terceiros: { rotulo: "Aguardando terceiros", badge: "bg-amber-100 text-amber-800" },
  resolvido: { rotulo: "Resolvido", badge: "bg-green-100 text-green-800" },
};

export const PRIORIDADES: Record<Prioridade, { rotulo: string; badge: string }> = {
  baixa: { rotulo: "Baixa", badge: "bg-gray-100 text-gray-700" },
  media: { rotulo: "Média", badge: "bg-sky-100 text-sky-800" },
  alta: { rotulo: "Alta", badge: "bg-amber-100 text-amber-800" },
  urgente: { rotulo: "Urgente", badge: "bg-red-100 text-red-800" },
};
