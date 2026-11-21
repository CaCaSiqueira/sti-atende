/** Regras de acesso por perfil. Sem dependências de servidor: usado pelo proxy, pelas rotas e pela navegação. */

/**
 * - externo: público de fora da SEMA. Abre chamados e acompanha os seus.
 * - servidor: usuário interno (servidor da SEMA). Como o externo, e informa o RP do equipamento nos chamados de hardware.
 * - sti: equipe da STI. Vê todos os chamados, assume, muda status, indicadores e saúde do sistema.
 */
export type Perfil = "externo" | "servidor" | "sti";

export const PERFIS: Record<Perfil, { rotulo: string }> = {
  externo: { rotulo: "Usuário externo" },
  servidor: { rotulo: "Usuário interno" },
  sti: { rotulo: "Equipe da STI" },
};

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
}

export function ehPerfil(valor: unknown): valor is Perfil {
  return valor === "externo" || valor === "servidor" || valor === "sti";
}

/**
 * O perfil vem de app_metadata, que só o servidor (chave secreta) altera.
 * Nunca use user_metadata para permissão: o próprio usuário pode editá-lo.
 * "interno" era o nome da equipe de TI até a v1.0.0 e continua valendo como "sti".
 */
export function perfilDe(appMetadata: Record<string, unknown> | undefined): Perfil {
  const valor = appMetadata?.perfil;
  if (valor === "interno") return "sti";
  return ehPerfil(valor) ? valor : "externo";
}

/** Rotas exclusivas da equipe da STI. */
export const ROTAS_STI = ["/visao-geral", "/configuracoes"];

/** Rotas abertas sem login. */
export const ROTAS_PUBLICAS = ["/login", "/api/auth/login", "/api/health"];

const casa = (pathname: string, rota: string) => pathname === rota || pathname.startsWith(`${rota}/`);

export function exigeSti(pathname: string): boolean {
  return ROTAS_STI.some((r) => casa(pathname, r));
}

export function ehPublica(pathname: string): boolean {
  return ROTAS_PUBLICAS.some((r) => casa(pathname, r));
}
