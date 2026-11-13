import "server-only";
import { obterSupabase } from "./supabase";

/** Regra de SLA do CAR: no máximo 1 sincronização a cada 24h por solicitante, para proteger o Oracle da SEMA. */
export const JANELA_SYNC_MS = 24 * 60 * 60 * 1000;

export type ResultadoSync = { ok: true; feitaEm: number } | { ok: false; liberaEm: number };

// Fallback sem banco (vale só enquanto o servidor estiver no ar).
const memoria = new Map<string, number>();

export async function tentarSincronizarCar(clienteId: string, agora = Date.now()): Promise<ResultadoSync> {
  const db = obterSupabase();

  if (!db) {
    const ultima = memoria.get(clienteId);
    if (ultima && agora - ultima < JANELA_SYNC_MS) return { ok: false, liberaEm: ultima + JANELA_SYNC_MS };
    memoria.set(clienteId, agora);
    return { ok: true, feitaEm: agora };
  }

  const desde = new Date(agora - JANELA_SYNC_MS).toISOString();
  const { data, error } = await db
    .from("car_sincronizacoes")
    .select("feita_em")
    .eq("cliente_id", clienteId)
    .gte("feita_em", desde)
    .order("feita_em", { ascending: false })
    .limit(1);
  if (error) throw new Error(`Falha ao consultar sincronizações: ${error.message}`);

  if (data.length) return { ok: false, liberaEm: Date.parse(data[0].feita_em) + JANELA_SYNC_MS };

  const { error: erroInsert } = await db.from("car_sincronizacoes").insert({ cliente_id: clienteId });
  if (erroInsert) throw new Error(`Falha ao registrar sincronização: ${erroInsert.message}`);
  // Aqui entraria a chamada real à integração do CAR (depende de acesso à rede da SEMA).
  return { ok: true, feitaEm: agora };
}
