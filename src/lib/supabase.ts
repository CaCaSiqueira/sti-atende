import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase do servidor, com a chave secreta.
 * Nunca é enviado ao navegador ("server-only" quebra o build se alguém tentar importar no cliente).
 * Retorna null quando o banco não está configurado: as telas seguem funcionando com dados de exemplo.
 */
let cliente: SupabaseClient | null | undefined;

export function obterSupabase(): SupabaseClient | null {
  if (cliente !== undefined) return cliente;
  const url = process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_SECRET_KEY;
  cliente = url && chave ? createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  return cliente;
}

export function bancoConfigurado(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}
