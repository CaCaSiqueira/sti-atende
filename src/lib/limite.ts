import "server-only";
import { permitirEmMemoria } from "./limite-memoria";
import { obterSupabase } from "./supabase";

/**
 * Limite de requisições por janela: protege o login, a cota gratuita do Gemini e o banco contra abuso.
 * Com banco, a contagem fica no Supabase (função permitir_requisicao): vale para todas as instâncias
 * da Vercel e não zera quando uma reinicia. Não substitui um WAF.
 */
export async function permitir(chave: string, maximo: number, janelaMs: number): Promise<boolean> {
  const db = obterSupabase();
  if (!db) return permitirEmMemoria(chave, maximo, janelaMs);

  const { data, error } = await db.rpc("permitir_requisicao", {
    p_chave: chave.slice(0, 200),
    p_maximo: maximo,
    p_janela_segundos: Math.ceil(janelaMs / 1000),
  });
  if (!error && typeof data === "boolean") return data;

  // Falha na checagem não tira o sistema do ar: segue com o limite da memória desta instância.
  console.error(`[limite] Falha ao consultar o limite no banco (${chave.split(":")[0]}): ${error?.message ?? "resposta inesperada"}`);
  return permitirEmMemoria(chave, maximo, janelaMs);
}

export function ipDaRequisicao(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}
