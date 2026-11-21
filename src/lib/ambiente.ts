/**
 * Em que modo o sistema pode rodar. Função pura: usada pelo proxy, pelas rotas, pela Saúde do Sistema e pelos testes.
 *
 * - normal: banco e login do Supabase configurados.
 * - demonstracao: NENHUMA chave do Supabase e fora da Vercel (computador de desenvolvimento).
 *   Chamados de exemplo em memória, nada é salvo e não há login.
 * - bloqueado: configuração incompleta (algumas chaves sim, outras não) em qualquer lugar,
 *   ou falta de chaves na Vercel. O sistema não abre: evita rodar sem login, ou com dados que não são salvos.
 */
export type ModoSistema = "normal" | "demonstracao" | "bloqueado";

export const CHAVES_SUPABASE = ["SUPABASE_URL", "SUPABASE_SECRET_KEY", "SUPABASE_PUBLISHABLE_KEY"] as const;

type Ambiente = Record<string, string | undefined>;

/** Nomes (nunca valores) das chaves do Supabase que estão faltando. */
export function chavesAusentes(env: Ambiente = process.env): string[] {
  return CHAVES_SUPABASE.filter((nome) => !env[nome]);
}

/** A Vercel define VERCEL=1 em produção e nas prévias. */
export const naVercel = (env: Ambiente = process.env) => Boolean(env.VERCEL);

export function modoDoSistema(env: Ambiente = process.env): ModoSistema {
  const ausentes = chavesAusentes(env);
  if (ausentes.length === 0) return "normal";
  if (ausentes.length === CHAVES_SUPABASE.length && !naVercel(env)) return "demonstracao";
  return "bloqueado";
}

export const MENSAGEM_BLOQUEADO = "Sistema indisponível: a configuração do banco de dados está incompleta.";
