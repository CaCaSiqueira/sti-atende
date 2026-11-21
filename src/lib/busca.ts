import { normalizar } from "./roteamento";

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
