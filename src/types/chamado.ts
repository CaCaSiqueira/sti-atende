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
  /** Quem da STI assumiu (para o filtro "atribuídos a mim"). */
  responsavelId: string | null;
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

export type TipoEvento = "aberto" | "assumido" | "status" | "rp" | "print";

/** Uma linha do histórico do chamado. */
export interface EventoChamado {
  id: string;
  tipo: TipoEvento;
  /** Status depois do evento (abertura e mudanças de status). */
  status: StatusChamado | null;
  /** RP informado, ou a nota de solução quando o status vira "resolvido". */
  detalhe: string | null;
  autor: string | null;
  criadoEm: string;
}

/** Tudo do chamado, para a página de detalhe. */
export interface ChamadoDetalhe extends Chamado {
  descricao: string | null;
  solicitanteId: string | null;
  resolvidoEm: string | null;
  /** Nota de solução escrita pela STI ao concluir. */
  solucao: string | null;
  anexos: Anexo[];
  eventos: EventoChamado[];
}

export interface Indicadores {
  abertos: number;
  resolvidosHoje: number;
  aguardandoTerceiros: number;
  slaViolado: number;
  volumePorSetor: { setor: Setor; percentual: number }[];
}
