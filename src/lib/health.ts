import "server-only";
import { pingBanco } from "./chamados";
import { iaConfigurada, modeloIA, obterUltimaChamadaIA } from "./ia";

/**
 * Verificações de saúde do STI Atende.
 * Usado pela rota /api/health e pelo painel "Saúde do Sistema" em Configurações.
 */

export type StatusVerificacao = "ok" | "degradado" | "falha" | "nao_configurado";
export type IdVerificacao = "app" | "banco" | "ia" | "sema";

export interface Verificacao {
  id: IdVerificacao;
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
  memoriaMB: number;
  verificacoes: Verificacao[];
}

const LATENCIA_LENTA_MS = 1000;

function aplicacao(): Verificacao {
  return { id: "app", nome: "Aplicação (Next.js)", status: "ok", latenciaMs: 0, detalhe: "Servidor respondendo" };
}

async function bancoDeDados(): Promise<Verificacao> {
  const base = { id: "banco", nome: "Banco de dados (Supabase)" } as const;
  const r = await pingBanco();
  if (!r) return { ...base, status: "nao_configurado", latenciaMs: null, detalhe: "Sem banco: usando dados de exemplo" };
  if (!r.ok) return { ...base, status: "falha", latenciaMs: r.ms, detalhe: "Consulta ao banco falhou" };
  const lento = r.ms > LATENCIA_LENTA_MS;
  return { ...base, status: lento ? "degradado" : "ok", latenciaMs: r.ms, detalhe: lento ? "Respondendo devagar" : "Consulta real à tabela de chamados" };
}

/**
 * A IA não é chamada aqui de propósito: cada verificação gastaria a cota gratuita do Gemini.
 * O painel mostra o resultado da última chamada real feita pelo chat.
 */
function assistenteIA(): Verificacao {
  const base = { id: "ia", nome: `Assistente IA (Gemini ${modeloIA()})` } as const;
  if (!iaConfigurada()) {
    return { ...base, status: "nao_configurado", latenciaMs: null, detalhe: "Sem chave: chat usando regras locais" };
  }
  const ultima = obterUltimaChamadaIA();
  if (!ultima) return { ...base, status: "ok", latenciaMs: null, detalhe: "Configurado; aguardando a primeira conversa" };
  const quando = new Date(ultima.em).toLocaleTimeString("pt-BR", { timeZone: "America/Cuiaba" });
  if (!ultima.ok) {
    return { ...base, status: "degradado", latenciaMs: ultima.ms, detalhe: `Última chamada falhou às ${quando}; regras locais assumiram` };
  }
  return { ...base, status: ultima.ms > 5000 ? "degradado" : "ok", latenciaMs: ultima.ms, detalhe: `Última resposta às ${quando}` };
}

function integracaoSema(): Verificacao {
  return {
    id: "sema",
    nome: "Integração SEMA (SIGPAS/CAR)",
    status: "nao_configurado",
    latenciaMs: null,
    detalhe: "Depende de acesso à rede interna da SEMA",
  };
}

/** O pior status entre as verificações configuradas define o status geral. */
function statusGeral(vs: Verificacao[]): StatusVerificacao {
  if (vs.some((v) => v.status === "falha")) return "falha";
  if (vs.some((v) => v.status === "degradado")) return "degradado";
  return "ok";
}

export async function gerarRelatorioSaude(): Promise<RelatorioSaude> {
  const verificacoes = [aplicacao(), await bancoDeDados(), assistenteIA(), integracaoSema()];
  return {
    status: statusGeral(verificacoes),
    versao: process.env.npm_package_version ?? "0.1.0",
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    ambiente: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "desconhecido",
    geradoEm: new Date().toISOString(),
    uptimeSegundos: Math.round(process.uptime()),
    memoriaMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    verificacoes,
  };
}
