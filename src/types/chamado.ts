export type Setor = "CSTI" | "GATI" | "INFRA" | "TRIAGEM";
export type StatusChamado = "aberto" | "em_analise" | "aguardando_terceiros" | "resolvido";
export type Prioridade = "baixa" | "media" | "alta" | "urgente";

/** Status simplificado que os usuários (externo e interno) veem: "aguardando terceiros" aparece como "em análise". */
export type StatusUsuario = "aberto" | "em_analise" | "resolvido";

/** Chamado como a equipe da STI vê na lista. */
export interface Chamado {
  id: string;
  assunto: string;
  solicitante: string;
  setor: Setor;
  responsavel: string | null;
  status: StatusChamado;
  prioridade: Prioridade;
  abertoEm: string; // ISO 8601
  /** Número de patrimônio do equipamento (só números). */
  rpEquipamento: string | null;
  /** Aberto por servidor da SEMA ou pela STI. */
  interno: boolean;
  totalAnexos: number;
}

/** Chamado como o usuário vê na lista: só número, assunto, solicitante e status simplificado. */
export interface ChamadoUsuario {
  id: string;
  assunto: string;
  solicitante: string;
  status: StatusUsuario;
  rpEquipamento: string | null;
  totalAnexos: number;
}

/** Print do erro anexado ao chamado. */
export interface Anexo {
  id: string;
  tipo: string;
  tamanho: number;
  enviadoPor: string | null;
  enviadoEm: string;
}

/** Tudo do chamado, para a página de detalhe. */
export interface ChamadoDetalhe extends Chamado {
  descricao: string | null;
  solicitanteId: string | null;
  responsavelId: string | null;
  resolvidoEm: string | null;
  anexos: Anexo[];
}

export interface Indicadores {
  abertos: number;
  resolvidosHoje: number;
  aguardandoTerceiros: number;
  slaViolado: number;
  volumePorSetor: { setor: Setor; percentual: number }[];
}
