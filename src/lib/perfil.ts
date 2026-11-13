/** Regras de acesso por perfil. Sem dependências de servidor: usado pelo proxy, pelas rotas e pela navegação. */

export type Perfil = "interno" | "externo";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
}

/**
 * O perfil vem de app_metadata, que só o servidor (chave secreta) altera.
 * Nunca use user_metadata para permissão: o próprio usuário pode editá-lo.
 */
export function perfilDe(appMetadata: Record<string, unknown> | undefined): Perfil {
  return appMetadata?.perfil === "interno" ? "interno" : "externo";
}

/** Rotas que exigem perfil interno (equipe de TI da SEMA). */
export const ROTAS_INTERNAS = ["/visao-geral", "/configuracoes"];

/** Rotas abertas sem login. */
export const ROTAS_PUBLICAS = ["/login", "/api/auth/login", "/api/health"];

const casa = (pathname: string, rota: string) => pathname === rota || pathname.startsWith(`${rota}/`);

export function exigeInterno(pathname: string): boolean {
  return ROTAS_INTERNAS.some((r) => casa(pathname, r));
}

export function ehPublica(pathname: string): boolean {
  return ROTAS_PUBLICAS.some((r) => casa(pathname, r));
}
