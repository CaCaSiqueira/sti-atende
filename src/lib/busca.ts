import type { Setor, StatusChamado } from "../types/chamado";
import { normalizar } from "./roteamento.ts";

interface Buscavel {
  id: string;
  assunto: string;
  solicitante: string;
  rpEquipamento?: string | null;
}

/** Busca por número, assunto, solicitante ou RP, ignorando acentos, maiúsculas e o "#" do número. */
export function filtrarChamados<T extends Buscavel>(lista: T[], busca: string): T[] {
  const termo = normalizar(busca.trim().replace(/^#/, ""));
  if (!termo) return lista;
  return lista.filter((c) => normalizar(`${c.id} ${c.assunto} ${c.solicitante} ${c.rpEquipamento ?? ""}`).includes(termo));
}

export type FiltroStatus = "todos" | "nao_resolvidos" | StatusChamado;

/** Filtros da Consulta de Chamados da STI. */
export interface Filtros {
  status: FiltroStatus;
  setor: "todos" | Setor;
  /** Só os chamados assumidos por quem está logado. */
  meus: boolean;
}

export const FILTROS_PADRAO: Filtros = { status: "todos", setor: "todos", meus: false };

export const filtrosAtivos = (f: Filtros) => f.status !== "todos" || f.setor !== "todos" || f.meus;

interface Filtravel {
  status: StatusChamado;
  setor: Setor;
  responsavelId: string | null;
}

/** `meuId` null (sem login configurado) desliga o filtro "atribuídos a mim". */
export function aplicarFiltros<T extends Filtravel>(lista: T[], f: Filtros, meuId: string | null): T[] {
  return lista.filter((c) => {
    if (f.status === "nao_resolvidos" ? c.status === "resolvido" : f.status !== "todos" && c.status !== f.status) return false;
    if (f.setor !== "todos" && c.setor !== f.setor) return false;
    if (f.meus && meuId !== null && c.responsavelId !== meuId) return false;
    return true;
  });
}
