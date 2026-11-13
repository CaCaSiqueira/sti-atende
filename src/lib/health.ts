/**
 * Verificações de saúde do STI Atende.
 * Usado pela rota /api/health e, a partir da Sprint 2, pela tela "Saúde do Sistema".
 */

export type StatusVerificacao = "ok" | "degradado" | "falha" | "nao_configurado";

export interface Verificacao {
  nome: string;
  status: StatusVerificacao;
  latenciaMs: number | null;
  detalhe: string;
}

export interface RelatorioSaude {
  status: StatusVerificacao;
  versao: string;
  commit: string | null;
  ambiente: string;
  geradoEm: string;
  uptimeSegundos: number;
  verificacoes: Verificacao[];
}

const TIMEOUT_MS = 3000;
const LATENCIA_LENTA_MS = 1000;

async function medir(url: string, init?: RequestInit): Promise<{ ok: boolean; ms: number; codigo?: number; erro?: string }> {
  const inicio = performance.now();
  try {
    const res = await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
    return { ok: res.ok, ms: Math.round(performance.now() - inicio), codigo: res.status };
  } catch (e) {
    return { ok: false, ms: Math.round(performance.now() - inicio), erro: e instanceof Error ? e.name : "erro" };
  }
}

function aplicacao(): Verificacao {
  return { nome: "Aplicação (Next.js)", status: "ok", latenciaMs: 0, detalhe: "Servidor respondendo" };
}

async function bancoDeDados(): Promise<Verificacao> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const nome = "Banco de dados (Supabase)";
  if (!url || !chave) {
    return { nome, status: "nao_configurado", latenciaMs: null, detalhe: "Será conectado na Sprint 3" };
  }
  const r = await medir(`${url}/auth/v1/health`, { headers: { apikey: chave } });
  if (!r.ok) {
    return { nome, status: "falha", latenciaMs: r.ms, detalhe: r.erro === "TimeoutError" ? "Sem resposta em 3s" : `HTTP ${r.codigo ?? r.erro}` };
  }
  return {
    nome,
    status: r.ms > LATENCIA_LENTA_MS ? "degradado" : "ok",
    latenciaMs: r.ms,
    detalhe: r.ms > LATENCIA_LENTA_MS ? "Respondendo devagar" : "Conectado",
  };
}

function assistenteIA(): Verificacao {
  const configurado = Boolean(process.env.AI_API_KEY);
  return {
    nome: "Assistente IA",
    status: configurado ? "ok" : "nao_configurado",
    latenciaMs: null,
    detalhe: configurado ? `Provedor: ${process.env.AI_PROVIDER ?? "padrão"}` : "Será conectado na Sprint 3",
  };
}

/** O pior status entre as verificações configuradas define o status geral. */
function statusGeral(vs: Verificacao[]): StatusVerificacao {
  if (vs.some((v) => v.status === "falha")) return "falha";
  if (vs.some((v) => v.status === "degradado")) return "degradado";
  return "ok";
}

export async function gerarRelatorioSaude(): Promise<RelatorioSaude> {
  const verificacoes = [aplicacao(), await bancoDeDados(), assistenteIA()];
  return {
    status: statusGeral(verificacoes),
    versao: process.env.npm_package_version ?? "0.1.0",
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    ambiente: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "desconhecido",
    geradoEm: new Date().toISOString(),
    uptimeSegundos: Math.round(process.uptime()),
    verificacoes,
  };
}
