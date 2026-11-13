import type { Chamado } from "../types/chamado";
import { normalizar } from "./roteamento";

/** Busca por número, assunto ou solicitante, ignorando acentos, maiúsculas e o "#" do número. */
export function filtrarChamados(lista: Chamado[], busca: string): Chamado[] {
  const termo = normalizar(busca.trim().replace(/^#/, ""));
  if (!termo) return lista;
  return lista.filter((c) => normalizar(`${c.id} ${c.assunto} ${c.solicitante}`).includes(termo));
}
