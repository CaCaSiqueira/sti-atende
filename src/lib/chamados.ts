import "server-only";
import type { Anexo, Chamado, ChamadoDetalhe, EventoChamado, Indicadores, Prioridade, Setor, StatusChamado } from "../types/chamado";
import { EXTENSAO, type TipoImagem } from "./imagem";
import type { Usuario } from "./perfil";
import { ehSti } from "./permissoes";
import { calcularIndicadores } from "./sla";
import { obterSupabase } from "./supabase";

/**
 * Camada de acesso a chamados.
 * Com Supabase configurado, lê e grava no banco (prints no Storage, bucket privado "prints").
 * Sem ele, usa dados de exemplo em memória (útil para desenvolvimento e para a demonstração não quebrar se o banco cair).
 * Toda mudança registra um evento no histórico do chamado (tabela chamado_eventos).
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
  /** Nota de solução (ao concluir); null apaga (ao reabrir). */
  solucao?: string | null;
}

/** Quem fez a mudança, para o histórico. */
export interface Autor {
  id: string | null;
  nome: string;
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
  solucao: string | null;
  chamado_anexos: { count: number }[];
}

interface LinhaAnexo {
  id: string;
  tipo: string;
  tamanho: number;
  enviado_por_nome: string | null;
  enviado_em: string;
}

interface LinhaEvento {
  id: number;
  tipo: EventoChamado["tipo"];
  status: StatusChamado | null;
  detalhe: string | null;
  autor_nome: string | null;
  criado_em: string;
}

const COLUNAS =
  "id, assunto, descricao, solicitante, solicitante_id, setor, responsavel, responsavel_id, status, prioridade, aberto_em, resolvido_em, rp_equipamento, interno, solucao, chamado_anexos(count)";

type Registro = Omit<ChamadoDetalhe, "anexos" | "eventos">;
type NovoEvento = Pick<EventoChamado, "tipo"> & Partial<Pick<EventoChamado, "status" | "detalhe">>;

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
  solucao: l.solucao,
  totalAnexos: l.chamado_anexos?.[0]?.count ?? 0,
});

const mapearAnexo = (l: LinhaAnexo): Anexo => ({
  id: l.id,
  tipo: l.tipo,
  tamanho: l.tamanho,
  enviadoPor: l.enviado_por_nome,
  enviadoEm: l.enviado_em,
});

const mapearEvento = (l: LinhaEvento): EventoChamado => ({
  id: String(l.id),
  tipo: l.tipo,
  status: l.status,
  detalhe: l.detalhe,
  autor: l.autor_nome,
  criadoEm: l.criado_em,
});

/** Só os campos da lista (sem descrição, solução nem id do solicitante). Lista branca: campo novo não vaza por engano. */
const paraLista = (c: Registro): Chamado => ({
  id: c.id,
  assunto: c.assunto,
  solicitante: c.solicitante,
  setor: c.setor,
  responsavel: c.responsavel,
  responsavelId: c.responsavelId,
  status: c.status,
  prioridade: c.prioridade,
  abertoEm: c.abertoEm,
  rpEquipamento: c.rpEquipamento,
  interno: c.interno,
  totalAnexos: c.totalAnexos,
});

// ---------- Fallback em memória ----------
const horasAtras = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
const exemplo = (c: Omit<Registro, "descricao" | "solicitanteId" | "responsavelId" | "totalAnexos" | "solucao"> & { solucao?: string }): Registro => ({
  descricao: null,
  solicitanteId: null,
  responsavelId: null,
  totalAnexos: 0,
  solucao: null,
  ...c,
});
const EXEMPLOS_INICIAIS: Registro[] = [
  exemplo({ id: "INC-0492", assunto: "Erro de sincronização CAR", solicitante: "João Henrique", setor: "CSTI", responsavel: "Thiago Andrade", status: "em_analise", prioridade: "media", abertoEm: horasAtras(5), resolvidoEm: null, rpEquipamento: null, interno: false }),
  exemplo({ id: "INC-0491", assunto: "Monitor piscando / cabo quebrado", solicitante: "Maria Cristina", setor: "GATI", responsavel: "Pitagoras", status: "resolvido", prioridade: "baixa", abertoEm: horasAtras(24), resolvidoEm: horasAtras(2), rpEquipamento: "245871", interno: true, solucao: "Cabo HDMI substituído e monitor testado com a servidora." }),
  exemplo({ id: "REQ-0102", assunto: "Queda de internet no setor", solicitante: "Carina B. Siqueira", setor: "INFRA", responsavel: "Jadiael", status: "em_analise", prioridade: "urgente", abertoEm: horasAtras(6), resolvidoEm: null, rpEquipamento: null, interno: true }),
  exemplo({ id: "INC-0490", assunto: "SIGPAS não carrega relatório de licenças", solicitante: "Ana Paula", setor: "CSTI", responsavel: null, status: "aberto", prioridade: "alta", abertoEm: horasAtras(20), resolvidoEm: null, rpEquipamento: null, interno: true }),
  exemplo({ id: "INC-0489", assunto: "Impressora do protocolo sem toner", solicitante: "Roberto Lima", setor: "GATI", responsavel: "Fornecedor externo", status: "aguardando_terceiros", prioridade: "media", abertoEm: horasAtras(48), resolvidoEm: null, rpEquipamento: "198430", interno: true }),
];

/** Histórico inicial dos exemplos, igual ao que a migração da Sprint 6 gera no banco: abertura e resolução. */
const eventosIniciais = (chamados: Registro[]): (EventoChamado & { chamadoId: string })[] =>
  chamados.flatMap((c) => [
    { id: `${c.id}-a`, chamadoId: c.id, tipo: "aberto" as const, status: "aberto" as const, detalhe: null, autor: c.solicitante, criadoEm: c.abertoEm },
    ...(c.resolvidoEm
      ? [{ id: `${c.id}-r`, chamadoId: c.id, tipo: "status" as const, status: "resolvido" as const, detalhe: c.solucao, autor: null, criadoEm: c.resolvidoEm }]
      : []),
  ]);

/**
 * Estado em memória num único lugar do processo: rotas de API e páginas podem carregar cópias
 * separadas deste módulo (camadas diferentes do bundle) e precisam enxergar os mesmos chamados.
 */
interface Memoria {
  chamados: Registro[];
  anexos: Map<string, Anexo & { chamadoId: string; bytes: Uint8Array }>;
  eventos?: (EventoChamado & { chamadoId: string })[];
  proximoNumero: number;
}
const escopo = globalThis as typeof globalThis & { __stiAtendeMemoria?: Memoria };
const memoria: Memoria = (escopo.__stiAtendeMemoria ??= { chamados: EXEMPLOS_INICIAIS, anexos: new Map(), proximoNumero: 500 });
const EXEMPLO = memoria.chamados;
const ANEXOS_MEMORIA = memoria.anexos;
// Processo que já tinha memória de uma versão anterior (sem histórico) ganha o histórico inicial aqui.
const EVENTOS_MEMORIA = (memoria.eventos ??= eventosIniciais(memoria.chamados));

const anexosMemoria = (chamadoId: string) =>
  [...ANEXOS_MEMORIA.values()].filter((a) => a.chamadoId === chamadoId).sort((a, b) => a.enviadoEm.localeCompare(b.enviadoEm));
const comTotal = (c: Registro): Registro => ({ ...c, totalAnexos: anexosMemoria(c.id).length });

/**
 * Registra eventos no histórico. Uma falha aqui não desfaz a mudança já gravada no chamado:
 * fica no log do servidor, e o usuário não recebe erro por algo que deu certo.
 */
async function registrarEventos(chamadoId: string, eventos: NovoEvento[], autor: Autor): Promise<void> {
  if (eventos.length === 0) return;
  const db = obterSupabase();
  if (!db) {
    const agora = new Date().toISOString();
    for (const e of eventos) {
      EVENTOS_MEMORIA.push({ id: crypto.randomUUID(), chamadoId, status: null, detalhe: null, ...e, autor: autor.nome, criadoEm: agora });
    }
    return;
  }
  const { error } = await db.from("chamado_eventos").insert(
    eventos.map((e) => ({
      chamado_id: chamadoId,
      tipo: e.tipo,
      status: e.status ?? null,
      detalhe: e.detalhe?.slice(0, 2000) ?? null,
      autor_id: autor.id,
      autor_nome: autor.nome.slice(0, 120),
    })),
  );
  if (error) console.error(`[historico] Falha ao registrar ${eventos.map((e) => e.tipo).join(", ")} em ${chamadoId}: ${error.message}`);
}

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

/** Chamado completo, com prints e histórico. null se o número não existe (ou é inválido). */
export async function obterChamado(id: string): Promise<ChamadoDetalhe | null> {
  if (!idChamadoValido(id)) return null;
  const db = obterSupabase();
  if (!db) {
    const c = EXEMPLO.find((x) => x.id === id);
    if (!c) return null;
    const anexos = anexosMemoria(id).map((a): Anexo => ({ id: a.id, tipo: a.tipo, tamanho: a.tamanho, enviadoPor: a.enviadoPor, enviadoEm: a.enviadoEm }));
    const eventos = EVENTOS_MEMORIA.filter((e) => e.chamadoId === id)
      .sort((a, b) => a.criadoEm.localeCompare(b.criadoEm))
      .map((e): EventoChamado => ({ id: e.id, tipo: e.tipo, status: e.status, detalhe: e.detalhe, autor: e.autor, criadoEm: e.criadoEm }));
    return { ...c, totalAnexos: anexos.length, anexos, eventos };
  }
  const [chamado, anexos, eventos] = await Promise.all([
    db.from("chamados").select(COLUNAS).eq("id", id).maybeSingle(),
    db.from("chamado_anexos").select("id, tipo, tamanho, enviado_por_nome, enviado_em").eq("chamado_id", id).order("enviado_em"),
    db.from("chamado_eventos").select("id, tipo, status, detalhe, autor_nome, criado_em").eq("chamado_id", id).order("criado_em").order("id"),
  ]);
  if (chamado.error) throw new Error(`Falha ao abrir o chamado: ${chamado.error.message}`);
  if (anexos.error) throw new Error(`Falha ao listar os prints: ${anexos.error.message}`);
  if (eventos.error) throw new Error(`Falha ao ler o histórico: ${eventos.error.message}`);
  if (!chamado.data) return null;
  return {
    ...mapear(chamado.data as unknown as LinhaChamado),
    anexos: (anexos.data as LinhaAnexo[]).map(mapearAnexo),
    eventos: (eventos.data as LinhaEvento[]).map(mapearEvento),
  };
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
  const autor: Autor = { id: novo.solicitanteId ?? null, nome: novo.solicitante ?? "Usuário Interno" };
  const abertura: NovoEvento[] = [{ tipo: "aberto", status: "aberto" }];
  if (novo.rpEquipamento) abertura.push({ tipo: "rp", detalhe: novo.rpEquipamento });

  const db = obterSupabase();
  if (!db) {
    const c: Registro = {
      id: `INC-${String(memoria.proximoNumero++).padStart(4, "0")}`,
      assunto: novo.assunto,
      descricao: novo.descricao,
      solicitante: autor.nome,
      solicitanteId: autor.id,
      setor: novo.setor,
      responsavel: null,
      responsavelId: null,
      status: "aberto",
      prioridade: novo.prioridade,
      abertoEm: new Date().toISOString(),
      resolvidoEm: null,
      rpEquipamento: novo.rpEquipamento ?? null,
      interno: novo.interno,
      solucao: null,
      totalAnexos: 0,
    };
    EXEMPLO.push(c);
    await registrarEventos(c.id, abertura, autor);
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
  const criado = mapear(data as unknown as LinhaChamado);
  await registrarEventos(criado.id, abertura, autor);
  return paraLista(criado);
}

/**
 * Assumir, mudar status, informar o RP e gravar a nota de solução. Passe `status` só quando ele mudar:
 * resolver grava a data de resolução; qualquer outro status a limpa (reabertura).
 */
export async function atualizarChamado(id: string, m: MudancasChamado, autor: Autor): Promise<void> {
  const campos: Partial<Pick<LinhaChamado, "status" | "resolvido_em" | "responsavel" | "responsavel_id" | "rp_equipamento" | "solucao">> = {};
  const eventos: NovoEvento[] = [];
  if (m.responsavel) {
    campos.responsavel = m.responsavel.nome.slice(0, 120);
    campos.responsavel_id = m.responsavel.id;
    eventos.push({ tipo: "assumido" });
  }
  if (m.status !== undefined) {
    campos.status = m.status;
    campos.resolvido_em = m.status === "resolvido" ? new Date().toISOString() : null;
    eventos.push({ tipo: "status", status: m.status, detalhe: m.status === "resolvido" ? (m.solucao ?? null) : null });
  }
  if (m.rpEquipamento !== undefined) {
    campos.rp_equipamento = m.rpEquipamento;
    eventos.push({ tipo: "rp", detalhe: m.rpEquipamento });
  }
  if (m.solucao !== undefined) campos.solucao = m.solucao;
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
    if (campos.solucao !== undefined) c.solucao = campos.solucao;
  } else {
    const { error } = await db.from("chamados").update(campos).eq("id", id);
    if (error) throw new Error(`Falha ao atualizar o chamado: ${error.message}`);
  }
  await registrarEventos(id, eventos, autor);
}

/** Guarda o print no Storage e registra no banco. Desfaz o upload se o registro falhar. */
export async function adicionarAnexo(chamadoId: string, arquivo: { bytes: Uint8Array; tipo: TipoImagem }, autor: Autor): Promise<Anexo> {
  const id = crypto.randomUUID();
  const anexo: Anexo = { id, tipo: arquivo.tipo, tamanho: arquivo.bytes.length, enviadoPor: autor.nome, enviadoEm: new Date().toISOString() };
  const db = obterSupabase();
  if (!db) {
    ANEXOS_MEMORIA.set(id, { ...anexo, chamadoId, bytes: arquivo.bytes });
    await registrarEventos(chamadoId, [{ tipo: "print" }], autor);
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
  await registrarEventos(chamadoId, [{ tipo: "print" }], autor);
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

/** Mede a latência de uma consulta real ao banco (usado pela Saúde do Sistema e pelo cron diário). */
export async function pingBanco(): Promise<{ ok: boolean; ms: number; erro?: string } | null> {
  const db = obterSupabase();
  if (!db) return null;
  const inicio = performance.now();
  const { error } = await db.from("chamados").select("id", { head: true, count: "exact" }).limit(1).abortSignal(AbortSignal.timeout(3000));
  return { ok: !error, ms: Math.round(performance.now() - inicio), erro: error?.message };
}
