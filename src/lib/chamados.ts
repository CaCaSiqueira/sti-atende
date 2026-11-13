import "server-only";
import type { Chamado, Indicadores, Prioridade, Setor, StatusChamado } from "../types/chamado";
import { calcularIndicadores } from "./sla";
import { obterSupabase } from "./supabase";

/**
 * Camada de acesso a chamados.
 * Com Supabase configurado, lê e grava no banco. Sem ele, usa dados de exemplo em memória
 * (útil para desenvolvimento e para a demonstração não quebrar se o banco cair).
 */

export interface NovoChamado {
  assunto: string;
  descricao: string;
  setor: Setor;
  prioridade: Prioridade;
  origem: "chat" | "manual";
  classificadoPor: "ia" | "regras" | "usuario";
  solicitante?: string;
}

interface LinhaChamado {
  id: string;
  assunto: string;
  solicitante: string;
  setor: Setor;
  responsavel: string | null;
  status: StatusChamado;
  prioridade: Prioridade;
  aberto_em: string;
  resolvido_em: string | null;
}

const COLUNAS = "id, assunto, solicitante, setor, responsavel, status, prioridade, aberto_em, resolvido_em";

const mapear = (l: LinhaChamado): Chamado & { resolvidoEm: string | null } => ({
  id: l.id,
  assunto: l.assunto,
  solicitante: l.solicitante,
  setor: l.setor,
  responsavel: l.responsavel,
  status: l.status,
  prioridade: l.prioridade,
  abertoEm: l.aberto_em,
  resolvidoEm: l.resolvido_em,
});

// ---------- Fallback em memória ----------
const horasAtras = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
const EXEMPLO: (Chamado & { resolvidoEm: string | null })[] = [
  { id: "INC-0492", assunto: "Erro de sincronização CAR", solicitante: "João Henrique", setor: "CSTI", responsavel: "Thiago Andrade", status: "em_analise", prioridade: "media", abertoEm: horasAtras(5), resolvidoEm: null },
  { id: "INC-0491", assunto: "Monitor piscando / cabo quebrado", solicitante: "Maria Cristina", setor: "GATI", responsavel: "Pitagoras", status: "resolvido", prioridade: "baixa", abertoEm: horasAtras(24), resolvidoEm: horasAtras(2) },
  { id: "REQ-0102", assunto: "Queda de internet no setor", solicitante: "Carina B. Siqueira", setor: "INFRA", responsavel: "Jadiael", status: "em_analise", prioridade: "urgente", abertoEm: horasAtras(6), resolvidoEm: null },
  { id: "INC-0490", assunto: "SIGPAS não carrega relatório de licenças", solicitante: "Ana Paula", setor: "CSTI", responsavel: null, status: "aberto", prioridade: "alta", abertoEm: horasAtras(20), resolvidoEm: null },
  { id: "INC-0489", assunto: "Impressora do protocolo sem toner", solicitante: "Roberto Lima", setor: "GATI", responsavel: "Fornecedor externo", status: "aguardando_terceiros", prioridade: "media", abertoEm: horasAtras(48), resolvidoEm: null },
];
let proximoNumeroMemoria = 500;

// ---------- API pública ----------
export async function listarChamados(): Promise<Chamado[]> {
  const db = obterSupabase();
  if (!db) return [...EXEMPLO].sort((a, b) => b.abertoEm.localeCompare(a.abertoEm));
  const { data, error } = await db.from("chamados").select(COLUNAS).order("aberto_em", { ascending: false }).limit(200);
  if (error) throw new Error(`Falha ao listar chamados: ${error.message}`);
  return (data as LinhaChamado[]).map(mapear);
}

export async function obterIndicadores(): Promise<Indicadores> {
  const db = obterSupabase();
  if (!db) return calcularIndicadores(EXEMPLO, Date.now());
  const { data, error } = await db.from("chamados").select("setor, status, prioridade, aberto_em, resolvido_em").limit(5000);
  if (error) throw new Error(`Falha ao calcular indicadores: ${error.message}`);
  const linhas = (data as Pick<LinhaChamado, "setor" | "status" | "prioridade" | "aberto_em" | "resolvido_em">[]).map((l) => ({
    setor: l.setor,
    status: l.status,
    prioridade: l.prioridade,
    abertoEm: l.aberto_em,
    resolvidoEm: l.resolvido_em,
  }));
  return calcularIndicadores(linhas, Date.now());
}

export async function criarChamado(novo: NovoChamado): Promise<Chamado> {
  const db = obterSupabase();
  if (!db) {
    const c = {
      id: `INC-${String(proximoNumeroMemoria++).padStart(4, "0")}`,
      assunto: novo.assunto,
      solicitante: novo.solicitante ?? "Usuário Interno",
      setor: novo.setor,
      responsavel: null,
      status: "aberto" as const,
      prioridade: novo.prioridade,
      abertoEm: new Date().toISOString(),
      resolvidoEm: null,
    };
    EXEMPLO.push(c);
    return c;
  }
  const { data, error } = await db
    .from("chamados")
    .insert({
      assunto: novo.assunto,
      descricao: novo.descricao,
      setor: novo.setor,
      prioridade: novo.prioridade,
      origem: novo.origem,
      classificado_por: novo.classificadoPor,
      ...(novo.solicitante ? { solicitante: novo.solicitante } : {}),
    })
    .select(COLUNAS)
    .single();
  if (error) throw new Error(`Falha ao criar chamado: ${error.message}`);
  return mapear(data as LinhaChamado);
}

/** Mede a latência de uma consulta real ao banco (usado pela Saúde do Sistema). */
export async function pingBanco(): Promise<{ ok: boolean; ms: number; erro?: string } | null> {
  const db = obterSupabase();
  if (!db) return null;
  const inicio = performance.now();
  const { error } = await db.from("chamados").select("id", { head: true, count: "exact" }).limit(1).abortSignal(AbortSignal.timeout(3000));
  return { ok: !error, ms: Math.round(performance.now() - inicio), erro: error?.message };
}
