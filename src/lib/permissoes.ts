import type { Setor, StatusChamado } from "../types/chamado";
import type { Perfil, Usuario } from "./perfil";

/**
 * Quem pode fazer o quê em cada chamado. Funções puras: usadas pelas rotas de API, pelas páginas e pelos testes.
 * `null` = sem login configurado (desenvolvimento local): acesso total, como no restante do app.
 */
type Quem = Pick<Usuario, "id" | "perfil"> | null;

/** O mínimo de um chamado para decidir permissões. */
export interface AlvoPermissao {
  solicitanteId: string | null;
  setor: Setor;
  status: StatusChamado;
}

/** Prints por chamado. */
export const MAX_ANEXOS = 3;

/** RP = número de patrimônio: só números. */
export const RP_REGEX = /^\d{1,15}$/;

export const rpValido = (rp: string) => RP_REGEX.test(rp);

export const ehSti = (u: Quem) => u === null || u.perfil === "sti";

const ehDono = (u: Quem, c: AlvoPermissao) => u !== null && c.solicitanteId !== null && c.solicitanteId === u.id;

/** STI vê todos; usuários (externo e interno) só os que abriram. */
export function podeVer(u: Quem, c: AlvoPermissao): boolean {
  return ehSti(u) || ehDono(u, c);
}

/** Assumir o chamado e mudar o status: só a STI. */
export function podeGerenciar(u: Quem): boolean {
  return ehSti(u);
}

/** Print do erro: a STI sempre; o solicitante enquanto o chamado não está resolvido. */
export function podeAnexar(u: Quem, c: AlvoPermissao): boolean {
  return ehSti(u) || (ehDono(u, c) && c.status !== "resolvido");
}

/**
 * RP do equipamento: a STI sempre (decide quando há equipamento);
 * o usuário interno no próprio chamado de hardware, enquanto não está resolvido. O externo, nunca.
 */
export function podeInformarRP(u: Quem, c: AlvoPermissao): boolean {
  if (ehSti(u)) return true;
  return u?.perfil === "servidor" && ehDono(u, c) && c.setor === "GATI" && c.status !== "resolvido";
}

/** Na abertura, o campo de RP aparece para quem não é externo, quando o chamado é de hardware. */
export function aceitaRPNaAbertura(perfil: Perfil | null, setor: Setor): boolean {
  return perfil !== "externo" && setor === "GATI";
}

/** Chamado interno: aberto por servidor da SEMA ou pela STI. */
export function chamadoInterno(perfil: Perfil | null | undefined): boolean {
  return perfil === "servidor" || perfil === "sti";
}
