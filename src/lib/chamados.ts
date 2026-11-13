import type { Chamado, Indicadores } from "../types/chamado";

/**
 * Camada de acesso a chamados.
 * Sprint 2: dados de exemplo em memória. Sprint 3: as mesmas funções passam a consultar o Supabase,
 * sem mudar as telas.
 */

const CHAMADOS_EXEMPLO: Chamado[] = [
  {
    id: "INC-0492",
    assunto: "Erro de sincronização CAR",
    solicitante: "João Henrique",
    setor: "CSTI",
    responsavel: "Thiago Andrade",
    status: "em_analise",
    prioridade: "media",
    abertoEm: "2026-11-13T09:12:00-04:00",
  },
  {
    id: "INC-0491",
    assunto: "Monitor piscando / cabo quebrado",
    solicitante: "Maria Cristina",
    setor: "GATI",
    responsavel: "Pitagoras",
    status: "resolvido",
    prioridade: "baixa",
    abertoEm: "2026-11-12T14:40:00-04:00",
  },
  {
    id: "REQ-0102",
    assunto: "Queda de internet no setor",
    solicitante: "Carina B. Siqueira",
    setor: "INFRA",
    responsavel: "Jadiael",
    status: "em_analise",
    prioridade: "urgente",
    abertoEm: "2026-11-13T08:05:00-04:00",
  },
  {
    id: "INC-0490",
    assunto: "SIGPAS não carrega relatório de licenças",
    solicitante: "Ana Paula",
    setor: "CSTI",
    responsavel: null,
    status: "aberto",
    prioridade: "alta",
    abertoEm: "2026-11-12T16:20:00-04:00",
  },
  {
    id: "INC-0489",
    assunto: "Impressora do protocolo sem toner",
    solicitante: "Roberto Lima",
    setor: "GATI",
    responsavel: "Fornecedor externo",
    status: "aguardando_terceiros",
    prioridade: "media",
    abertoEm: "2026-11-11T10:00:00-04:00",
  },
];

export async function listarChamados(): Promise<Chamado[]> {
  return CHAMADOS_EXEMPLO;
}

export async function obterIndicadores(): Promise<Indicadores> {
  return {
    abertos: 142,
    resolvidosHoje: 38,
    aguardandoTerceiros: 15,
    slaViolado: 3,
    volumePorSetor: [
      { setor: "CSTI", percentual: 65 },
      { setor: "GATI", percentual: 25 },
      { setor: "INFRA", percentual: 10 },
    ],
  };
}
