import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { MENSAGEM_BLOQUEADO, modoDoSistema } from "./ambiente";

/**
 * Cliente Supabase do servidor, com a chave secreta.
 * Nunca é enviado ao navegador ("server-only" quebra o build se alguém tentar importar no cliente).
 * Retorna null só no modo demonstração (nenhuma chave, fora da Vercel): as telas usam dados de exemplo em memória.
 * Com a configuração incompleta, ou sem chaves na Vercel, lança erro: nunca cai para a memória em produção.
 */
let cliente: SupabaseClient | null | undefined;

export function obterSupabase(): SupabaseClient | null {
  if (cliente !== undefined) return cliente;
  const url = process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_SECRET_KEY;
  if (url && chave && modoDoSistema() === "normal") {
    cliente = createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } });
    return cliente;
  }
  if (modoDoSistema() === "demonstracao") return (cliente = null);
  throw new Error(MENSAGEM_BLOQUEADO);
}

export function bancoConfigurado(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}
