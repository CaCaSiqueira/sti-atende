export type Setor = "CSTI" | "GATI" | "INFRA" | "TRIAGEM";
export type StatusChamado = "aberto" | "em_analise" | "aguardando_terceiros" | "resolvido";
export type Prioridade = "baixa" | "media" | "alta" | "urgente";

export interface Chamado {
  id: string;
  assunto: string;
  solicitante: string;
  setor: Setor;
  responsavel: string | null;
  status: StatusChamado;
  prioridade: Prioridade;
  abertoEm: string; // ISO 8601
}

export interface Indicadores {
  abertos: number;
  resolvidosHoje: number;
  aguardandoTerceiros: number;
  slaViolado: number;
  volumePorSetor: { setor: Setor; percentual: number }[];
}
