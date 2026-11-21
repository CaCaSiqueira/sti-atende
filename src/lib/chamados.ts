import "server-only";
import type { Anexo, Chamado, ChamadoDetalhe, Indicadores, Prioridade, Setor, StatusChamado } from "../types/chamado";
import { EXTENSAO, type TipoImagem } from "./imagem";
import type { Usuario } from "./perfil";
import { ehSti } from "./permissoes";
import { calcularIndicadores } from "./sla";
import { obterSupabase } from "./supabase";

/**
 * Camada de acesso a chamados.
 * Com Supabase configurado, lê e grava no banco (prints no Storage, bucket privado "prints").
 * Sem ele, usa dados de exemplo em memória (útil para desenvolvimento e para a demonstração não quebrar se o banco cair).
 */

export interface NovoChamado {
  assunto: string;
  descricao: string;
  setor: Setor;
  prioridade: Prioridade;
  origem: "chat" | "manual";
  classificadoPor: "ia" | "regras" | "usuario";
  interno: boolean;
  rpEquipamento?: string;
  solicitante?: string;
  solicitanteId?: string;
}

export interface MudancasChamado {
  status?: StatusChamado;
  responsavel?: { id: string | null; nome: string };
  /** null remove o RP. */
  rpEquipamento?: string | null;
}

const BUCKET = "prints";

/** Números de chamado no formato INC-0500 / REQ-0102. Evita consultas com lixo vindo da URL. */
const ID_CHAMADO = /^[A-Z]{2,5}-\d{1,8}$/;
const ID_ANEXO = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const idChamadoValido = (id: string) => ID_CHAMADO.test(id);

interface LinhaChamado {
  id: string;
  assunto: string;
  descricao: string | null;
  solicitante: string;
  solicitante_id: string | null;
  setor: Setor;
  responsavel: string | null;
  responsavel_id: string | null;
  status: StatusChamado;
  prioridade: Prioridade;
  aberto_em: string;
  resolvido_em: string | null;
  rp_equipamento: string | null;
  interno: boolean;
  chamado_anexos: { count: number }[];
}

interface LinhaAnexo {
  id: string;
  tipo: string;
  tamanho: number;
  enviado_por_nome: string | null;
  enviado_em: string;
}

const COLUNAS =
  "id, assunto, descricao, solicitante, solicitante_id, setor, responsavel, responsavel_id, status, prioridade, aberto_em, resolvido_em, rp_equipamento, interno, chamado_anexos(count)";

type Registro = Omit<ChamadoDetalhe, "anexos">;

const mapear = (l: LinhaChamado): Registro => ({
  id: l.id,
  assunto: l.assunto,
  descricao: l.descricao,
  solicitante: l.solicitante,
  solicitanteId: l.solicitante_id,
  setor: l.setor,
  responsavel: l.responsavel,
  responsavelId: l.responsavel_id,
  status: l.status,
  prioridade: l.prioridade,
  abertoEm: l.aberto_em,
  resolvidoEm: l.resolvido_em,
  rpEquipamento: l.rp_equipamento,
  interno: l.interno,
  totalAnexos: l.chamado_anexos?.[0]?.count ?? 0,
});

const mapearAnexo = (l: LinhaAnexo): Anexo => ({
  id: l.id,
  tipo: l.tipo,
  tamanho: l.tamanho,
  enviadoPor: l.enviado_por_nome,
  enviadoEm: l.enviado_em,
});

/** Só os campos da lista (sem descrição nem ids de usuários). Lista branca: campo novo não vaza por engano. */
const paraLista = (c: Registro): Chamado => ({
  id: c.id,
  assunto: c.assunto,
  solicitante: c.solicitante,
  setor: c.setor,
  responsavel: c.responsavel,
  status: c.status,
  prioridade: c.prioridade,
  abertoEm: c.abertoEm,
  rpEquipamento: c.rpEquipamento,
  interno: c.interno,
  totalAnexos: c.totalAnexos,
});

// ---------- Fallback em memória ----------
const horasAtras = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
const exemplo = (c: Omit<Registro, "descricao" | "solicitanteId" | "responsavelId" | "totalAnexos">): Registro => ({
  descricao: null,
  solicitanteId: null,
  responsavelId: null,
  totalAnexos: 0,
  ...c,
});
const EXEMPLOS_INICIAIS: Registro[] = [
  exemplo({ id: "INC-0492", assunto: "Erro de sincronização CAR", solicitante: "João Henrique", setor: "CSTI", responsavel: "Thiago Andrade", status: "em_analise", prioridade: "media", abertoEm: horasAtras(5), resolvidoEm: null, rpEquipamento: null, interno: false }),
  exemplo({ id: "INC-0491", assunto: "Monitor piscando / cabo quebrado", solicitante: "Maria Cristina", setor: "GATI", responsavel: "Pitagoras", status: "resolvido", prioridade: "baixa", abertoEm: horasAtras(24), resolvidoEm: horasAtras(2), rpEquipamento: "245871", interno: true }),
  exemplo({ id: "REQ-0102", assunto: "Queda de internet no setor", solicitante: "Carina B. Siqueira", setor: "INFRA", responsavel: "Jadiael", status: "em_analise", prioridade: "urgente", abertoEm: horasAtras(6), resolvidoEm: null, rpEquipamento: null, interno: true }),
  exemplo({ id: "INC-0490", assunto: "SIGPAS não carrega relatório de licenças", solicitante: "Ana Paula", setor: "CSTI", responsavel: null, status: "aberto", prioridade: "alta", abertoEm: horasAtras(20), resolvidoEm: null, rpEquipamento: null, interno: true }),
  exemplo({ id: "INC-0489", assunto: "Impressora do protocolo sem toner", solicitante: "Roberto Lima", setor: "GATI", responsavel: "Fornecedor externo", status: "aguardando_terceiros", prioridade: "media", abertoEm: horasAtras(48), resolvidoEm: null, rpEquipamento: "198430", interno: true }),
];

/**
 * Estado em memória num único lugar do processo: rotas de API e páginas podem carregar cópias
 * separadas deste módulo (camadas diferentes do bundle) e precisam enxergar os mesmos chamados.
 */
interface Memoria {
  chamados: Registro[];
  anexos: Map<string, Anexo & { chamadoId: string; bytes: Uint8Array }>;
  proximoNumero: number;
}
const escopo = globalThis as typeof globalThis & { __stiAtendeMemoria?: Memoria };
const memoria = (escopo.__stiAtendeMemoria ??= { chamados: EXEMPLOS_INICIAIS, anexos: new Map(), proximoNumero: 500 });
const EXEMPLO = memoria.chamados;
const ANEXOS_MEMORIA = memoria.anexos;

const anexosMemoria = (chamadoId: string) =>
  [...ANEXOS_MEMORIA.values()].filter((a) => a.chamadoId === chamadoId).sort((a, b) => a.enviadoEm.localeCompare(b.enviadoEm));
const comTotal = (c: Registro): Registro => ({ ...c, totalAnexos: anexosMemoria(c.id).length });

// ---------- API pública ----------
/** STI vê todos os chamados; usuários (externo e interno) veem só os que abriram. */
export async function listarChamados(usuario: Usuario | null): Promise<Chamado[]> {
  const soDoUsuario = !ehSti(usuario) && usuario !== null;
  const db = obterSupabase();
  if (!db) {
    return EXEMPLO.filter((c) => !soDoUsuario || c.solicitanteId === usuario.id)
      .sort((a, b) => b.abertoEm.localeCompare(a.abertoEm))
      .map((c) => paraLista(comTotal(c)));
  }
  let consulta = db.from("chamados").select(COLUNAS).order("aberto_em", { ascending: false }).limit(200);
  if (soDoUsuario) consulta = consulta.eq("solicitante_id", usuario.id);
  const { data, error } = await consulta;
  if (error) throw new Error(`Falha ao listar chamados: ${error.message}`);
  return (data as unknown as LinhaChamado[]).map((l) => paraLista(mapear(l)));
}

/** Chamado completo, com os prints. null se o número não existe (ou é inválido). */
export async function obterChamado(id: string): Promise<ChamadoDetalhe | null> {
  if (!idChamadoValido(id)) return null;
  const db = obterSupabase();
  if (!db) {
    const c = EXEMPLO.find((x) => x.id === id);
    if (!c) return null;
    const anexos = anexosMemoria(id).map((a): Anexo => ({ id: a.id, tipo: a.tipo, tamanho: a.tamanho, enviadoPor: a.enviadoPor, enviadoEm: a.enviadoEm }));
    return { ...c, totalAnexos: anexos.length, anexos };
  }
  const [chamado, anexos] = await Promise.all([
    db.from("chamados").select(COLUNAS).eq("id", id).maybeSingle(),
    db.from("chamado_anexos").select("id, tipo, tamanho, enviado_por_nome, enviado_em").eq("chamado_id", id).order("enviado_em"),
  ]);
  if (chamado.error) throw new Error(`Falha ao abrir o chamado: ${chamado.error.message}`);
  if (anexos.error) throw new Error(`Falha ao listar os prints: ${anexos.error.message}`);
  if (!chamado.data) return null;
  return { ...mapear(chamado.data as unknown as LinhaChamado), anexos: (anexos.data as LinhaAnexo[]).map(mapearAnexo) };
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
    const c: Registro = {
      id: `INC-${String(memoria.proximoNumero++).padStart(4, "0")}`,
      assunto: novo.assunto,
      descricao: novo.descricao,
      solicitante: novo.solicitante ?? "Usuário Interno",
      solicitanteId: novo.solicitanteId ?? null,
      setor: novo.setor,
      responsavel: null,
      responsavelId: null,
      status: "aberto",
      prioridade: novo.prioridade,
      abertoEm: new Date().toISOString(),
      resolvidoEm: null,
      rpEquipamento: novo.rpEquipamento ?? null,
      interno: novo.interno,
      totalAnexos: 0,
    };
    EXEMPLO.push(c);
    return paraLista(c);
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
      interno: novo.interno,
      ...(novo.rpEquipamento ? { rp_equipamento: novo.rpEquipamento } : {}),
      ...(novo.solicitante ? { solicitante: novo.solicitante.slice(0, 120) } : {}),
      ...(novo.solicitanteId ? { solicitante_id: novo.solicitanteId } : {}),
    })
    .select(COLUNAS)
    .single();
  if (error) throw new Error(`Falha ao criar chamado: ${error.message}`);
  return paraLista(mapear(data as unknown as LinhaChamado));
}

/**
 * Assumir, mudar status e informar o RP. Passe `status` só quando ele mudar:
 * resolver grava a data de resolução; qualquer outro status a limpa (reabertura).
 */
export async function atualizarChamado(id: string, m: MudancasChamado): Promise<void> {
  const campos: Partial<Pick<LinhaChamado, "status" | "resolvido_em" | "responsavel" | "responsavel_id" | "rp_equipamento">> = {};
  if (m.status !== undefined) {
    campos.status = m.status;
    campos.resolvido_em = m.status === "resolvido" ? new Date().toISOString() : null;
  }
  if (m.responsavel) {
    campos.responsavel = m.responsavel.nome.slice(0, 120);
    campos.responsavel_id = m.responsavel.id;
  }
  if (m.rpEquipamento !== undefined) campos.rp_equipamento = m.rpEquipamento;
  if (Object.keys(campos).length === 0) return;

  const db = obterSupabase();
  if (!db) {
    const c = EXEMPLO.find((x) => x.id === id);
    if (!c) throw new Error(`Chamado ${id} não encontrado`);
    if (campos.status !== undefined) c.status = campos.status;
    if (campos.resolvido_em !== undefined) c.resolvidoEm = campos.resolvido_em;
    if (campos.responsavel !== undefined) c.responsavel = campos.responsavel;
    if (campos.responsavel_id !== undefined) c.responsavelId = campos.responsavel_id;
    if (campos.rp_equipamento !== undefined) c.rpEquipamento = campos.rp_equipamento;
    return;
  }
  const { error } = await db.from("chamados").update(campos).eq("id", id);
  if (error) throw new Error(`Falha ao atualizar o chamado: ${error.message}`);
}

/** Guarda o print no Storage e registra no banco. Desfaz o upload se o registro falhar. */
export async function adicionarAnexo(
  chamadoId: string,
  arquivo: { bytes: Uint8Array; tipo: TipoImagem },
  autor: { id: string | null; nome: string },
): Promise<Anexo> {
  const id = crypto.randomUUID();
  const anexo: Anexo = { id, tipo: arquivo.tipo, tamanho: arquivo.bytes.length, enviadoPor: autor.nome, enviadoEm: new Date().toISOString() };
  const db = obterSupabase();
  if (!db) {
    ANEXOS_MEMORIA.set(id, { ...anexo, chamadoId, bytes: arquivo.bytes });
    return anexo;
  }
  const caminho = `${chamadoId}/${id}.${EXTENSAO[arquivo.tipo]}`;
  const envio = await db.storage.from(BUCKET).upload(caminho, arquivo.bytes, { contentType: arquivo.tipo, upsert: false });
  if (envio.error) throw new Error(`Falha ao guardar o print: ${envio.error.message}`);
  const { error } = await db.from("chamado_anexos").insert({
    id,
    chamado_id: chamadoId,
    caminho,
    tipo: arquivo.tipo,
    tamanho: arquivo.bytes.length,
    enviado_por: autor.id,
    enviado_por_nome: autor.nome.slice(0, 120),
  });
  if (error) {
    await db.storage.from(BUCKET).remove([caminho]);
    throw new Error(`Falha ao registrar o print: ${error.message}`);
  }
  return anexo;
}

/** Bytes do print e o chamado a que pertence (para conferir a permissão antes de entregar). */
export async function lerAnexo(id: string): Promise<{ chamadoId: string; tipo: string; bytes: Uint8Array } | null> {
  if (!ID_ANEXO.test(id)) return null;
  const db = obterSupabase();
  if (!db) {
    const a = ANEXOS_MEMORIA.get(id);
    return a ? { chamadoId: a.chamadoId, tipo: a.tipo, bytes: a.bytes } : null;
  }
  const { data, error } = await db.from("chamado_anexos").select("chamado_id, caminho, tipo").eq("id", id).maybeSingle();
  if (error) throw new Error(`Falha ao buscar o print: ${error.message}`);
  if (!data) return null;
  const arquivo = await db.storage.from(BUCKET).download(data.caminho);
  if (arquivo.error) throw new Error(`Falha ao baixar o print: ${arquivo.error.message}`);
  return { chamadoId: data.chamado_id, tipo: data.tipo, bytes: new Uint8Array(await arquivo.data.arrayBuffer()) };
}

/** Mede a latência de uma consulta real ao banco (usado pela Saúde do Sistema). */
export async function pingBanco(): Promise<{ ok: boolean; ms: number; erro?: string } | null> {
  const db = obterSupabase();
  if (!db) return null;
  const inicio = performance.now();
  const { error } = await db.from("chamados").select("id", { head: true, count: "exact" }).limit(1).abortSignal(AbortSignal.timeout(3000));
  return { ok: !error, ms: Math.round(performance.now() - inicio), erro: error?.message };
}
