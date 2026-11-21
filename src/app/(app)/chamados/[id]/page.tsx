import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, CircleCheckBig, History, ImageOff } from "lucide-react";
import { PainelAtualizacao } from "@/components/chamados/PainelAtualizacao";
import { Badge, Cabecalho } from "@/components/ui/Cabecalho";
import { obterUsuario } from "@/lib/auth";
import { obterChamado } from "@/lib/chamados";
import { descreverEvento, linhaDoTempoUsuario } from "@/lib/historico";
import { formatarTamanho } from "@/lib/imagem";
import { MAX_ANEXOS, ehSti, podeAnexar, podeGerenciar, podeInformarRP, podeVer } from "@/lib/permissoes";
import { PRIORIDADES, SETORES, STATUS, STATUS_USUARIO, statusParaUsuario } from "@/lib/setores";
import type { Anexo, EventoChamado } from "@/types/chamado";

export async function generateMetadata({ params }: PageProps<"/chamados/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: `Chamado #${id}` };
}

const dataHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Cuiaba", dateStyle: "short", timeStyle: "short" });

function Item({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-gray-500">{rotulo}</dt>
      <dd className="mt-0.5 text-gray-800">{children}</dd>
    </div>
  );
}

function GaleriaPrints({ chamadoId, anexos }: { chamadoId: string; anexos: Anexo[] }) {
  if (anexos.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-gray-500">
        <ImageOff className="size-4" aria-hidden /> Nenhum print anexado.
      </p>
    );
  }
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {anexos.map((a, i) => (
        <li key={a.id} className="overflow-hidden rounded-lg border border-gray-200">
          <a href={`/api/anexos/${a.id}`} target="_blank" rel="noopener" className="block bg-gray-100" title="Abrir em tamanho real">
            {/* eslint-disable-next-line @next/next/no-img-element -- imagem privada, entregue pela API com a sessão do usuário */}
            <img src={`/api/anexos/${a.id}`} alt={`Print ${i + 1} do chamado #${chamadoId}`} loading="lazy" className="aspect-video w-full object-contain" />
          </a>
          <p className="px-3 py-2 text-xs text-gray-500">
            {a.enviadoPor ?? "—"} · {dataHora(a.enviadoEm)} · {formatarTamanho(a.tamanho)}
          </p>
        </li>
      ))}
    </ul>
  );
}

function Solucao({ texto }: { texto: string }) {
  return (
    <section className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm sm:p-6" aria-labelledby="titulo-solucao">
      <h2 id="titulo-solucao" className="mb-2 flex items-center gap-2 text-lg font-bold text-green-900">
        <CircleCheckBig className="size-5" aria-hidden /> Solução
      </h2>
      <p className="whitespace-pre-wrap text-green-950">{texto}</p>
    </section>
  );
}

/** Histórico completo (STI): quem fez o quê e quando, com a nota de solução de cada conclusão. */
function HistoricoSti({ eventos }: { eventos: EventoChamado[] }) {
  return (
    <ol className="relative ml-2 space-y-4 border-l-2 border-gray-200">
      {eventos.map((e) => (
        <li key={e.id} className="relative pl-5">
          <span className="absolute -left-[7px] top-1.5 size-3 rounded-full border-2 border-white bg-brand-primary" aria-hidden />
          <p className="text-sm text-gray-800">{descreverEvento(e)}</p>
          <p className="text-xs text-gray-500">{dataHora(e.criadoEm)}</p>
          {e.tipo === "status" && e.status === "resolvido" && e.detalhe && (
            <p className="mt-1 whitespace-pre-wrap rounded bg-gray-50 p-2 text-sm text-gray-700">“{e.detalhe}”</p>
          )}
        </li>
      ))}
    </ol>
  );
}

/** Linha do tempo do usuário: só os status que ele enxerga, sem nomes da equipe. */
function HistoricoUsuario({ eventos }: { eventos: EventoChamado[] }) {
  return (
    <ol className="relative ml-2 space-y-4 border-l-2 border-gray-200">
      {linhaDoTempoUsuario(eventos).map((p, i) => (
        <li key={`${p.em}-${i}`} className="relative pl-5">
          <span className="absolute -left-[7px] top-1.5 size-3 rounded-full border-2 border-white bg-brand-primary" aria-hidden />
          <div className="flex flex-wrap items-center gap-2">
            <Badge classe={STATUS_USUARIO[p.status].badge}>{STATUS_USUARIO[p.status].rotulo}</Badge>
            {p.reaberto && <span className="text-xs font-semibold text-amber-700">Reaberto</span>}
          </div>
          <p className="mt-1 text-xs text-gray-500">{dataHora(p.em)}</p>
        </li>
      ))}
    </ol>
  );
}

export default async function PaginaChamado({ params }: PageProps<"/chamados/[id]">) {
  await connection(); // sempre o estado atual do chamado
  const { id } = await params;
  const [usuario, chamado] = await Promise.all([obterUsuario(), obterChamado(id)]);
  // Chamado de outra pessoa aparece como inexistente, para não revelar que o número existe.
  if (!chamado || !podeVer(usuario, chamado)) notFound();

  const sti = ehSti(usuario);
  const permissoes = {
    gerenciar: podeGerenciar(usuario),
    rp: podeInformarRP(usuario, chamado),
    anexar: podeAnexar(usuario, chamado),
  };
  const status = sti ? STATUS[chamado.status] : STATUS_USUARIO[statusParaUsuario(chamado.status)];
  const mostraRP = Boolean(chamado.rpEquipamento) || permissoes.rp;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Link href="/chamados" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> {sti ? "Consulta de Chamados" : "Meus Chamados"}
      </Link>

      <Cabecalho
        titulo={chamado.assunto}
        descricao={`Chamado #${chamado.id} · aberto em ${dataHora(chamado.abertoEm)}`}
        acao={
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Badge classe={status.badge}>{status.rotulo}</Badge>
            {sti && <Badge classe={SETORES[chamado.setor].badge}>{SETORES[chamado.setor].sigla}</Badge>}
            {sti && <Badge classe={PRIORIDADES[chamado.prioridade].badge}>Prioridade {PRIORIDADES[chamado.prioridade].rotulo.toLowerCase()}</Badge>}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {chamado.solucao && chamado.status === "resolvido" && <Solucao texto={chamado.solucao} />}

          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6" aria-labelledby="titulo-dados">
            <h2 id="titulo-dados" className="mb-4 text-lg font-bold text-gray-800">Dados do chamado</h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Item rotulo="Solicitante">
                {chamado.solicitante}
                {sti && <span className="ml-2 text-xs text-gray-500">({chamado.interno ? "chamado interno" : "chamado externo"})</span>}
              </Item>
              <Item rotulo="Número">#{chamado.id}</Item>
              {sti && <Item rotulo="Setor responsável">{SETORES[chamado.setor].nome}</Item>}
              {sti && <Item rotulo="Responsável">{chamado.responsavel ?? <span className="text-gray-400">Na fila</span>}</Item>}
              {chamado.resolvidoEm && chamado.status === "resolvido" && <Item rotulo="Resolvido em">{dataHora(chamado.resolvidoEm)}</Item>}
              {mostraRP && (
                <Item rotulo="RP do equipamento">
                  {chamado.rpEquipamento ? <span className="font-mono">{chamado.rpEquipamento}</span> : <span className="text-gray-400">Não informado</span>}
                </Item>
              )}
              <div className="sm:col-span-2">
                <dt className="text-sm text-gray-500">Descrição</dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-gray-800">{chamado.descricao || <span className="text-gray-400">Sem descrição.</span>}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6" aria-labelledby="titulo-prints">
            <h2 id="titulo-prints" className="mb-4 text-lg font-bold text-gray-800">
              Prints do erro <span className="text-sm font-normal text-gray-500">({chamado.anexos.length} de {MAX_ANEXOS})</span>
            </h2>
            <GaleriaPrints chamadoId={chamado.id} anexos={chamado.anexos} />
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6" aria-labelledby="titulo-historico">
            <h2 id="titulo-historico" className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
              <History className="size-5 text-gray-500" aria-hidden /> Histórico
            </h2>
            {chamado.eventos.length === 0 ? (
              <p className="text-sm text-gray-500">Sem registros ainda.</p>
            ) : sti ? (
              <HistoricoSti eventos={chamado.eventos} />
            ) : (
              <HistoricoUsuario eventos={chamado.eventos} />
            )}
          </section>
        </div>

        <aside>
          {permissoes.gerenciar || permissoes.rp || permissoes.anexar ? (
            <PainelAtualizacao
              chamadoId={chamado.id}
              permissoes={permissoes}
              statusAtual={chamado.status}
              rpAtual={chamado.rpEquipamento}
              responsavel={chamado.responsavel}
              souResponsavel={usuario !== null && chamado.responsavelId === usuario.id}
              vagasPrints={MAX_ANEXOS - chamado.anexos.length}
            />
          ) : (
            <p className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm">
              Este chamado está resolvido. Se o problema voltar, abra um novo chamado e cite o número #{chamado.id}.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
