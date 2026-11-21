"use client";

import { useState } from "react";
import Link from "next/link";
import { Inbox, Paperclip, Search } from "lucide-react";
import type { Chamado, ChamadoUsuario, Setor, StatusChamado } from "@/types/chamado";
import { FILTROS_PADRAO, aplicarFiltros, filtrarChamados, filtrosAtivos, type FiltroStatus, type Filtros } from "@/lib/busca";
import { PRIORIDADES, SETORES, STATUS, STATUS_USUARIO } from "@/lib/setores";
import { Badge } from "@/components/ui/Cabecalho";

/**
 * Visão da STI (tudo, com filtros) ou do usuário (número, assunto, solicitante e status simplificado).
 * `meuId`: quem da STI está logado, para "atribuídos a mim" (null sem login configurado).
 */
type Props = { visao: "sti"; chamados: Chamado[]; meuId: string | null } | { visao: "usuario"; chamados: ChamadoUsuario[] };

const OPCOES_STATUS: [FiltroStatus, string][] = [
  ["todos", "Todos os status"],
  ["nao_resolvidos", "Não resolvidos"],
  ...(Object.entries(STATUS) as [StatusChamado, { rotulo: string }][]).map(([v, s]): [FiltroStatus, string] => [v, s.rotulo]),
];
const OPCOES_SETOR: ["todos" | Setor, string][] = [
  ["todos", "Todos os setores"],
  ...(Object.entries(SETORES) as [Setor, { sigla: string }][]).map(([v, s]): ["todos" | Setor, string] => [v, s.sigla]),
];

function BarraFiltros({ filtros, mudar, comMeus }: { filtros: Filtros; mudar: (f: Filtros) => void; comMeus: boolean }) {
  const seletor = "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary";
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3" role="group" aria-label="Filtros">
      <label className="sr-only" htmlFor="filtro-status">Status</label>
      <select id="filtro-status" value={filtros.status} onChange={(e) => mudar({ ...filtros, status: e.target.value as FiltroStatus })} className={seletor}>
        {OPCOES_STATUS.map(([v, r]) => <option key={v} value={v}>{r}</option>)}
      </select>
      <label className="sr-only" htmlFor="filtro-setor">Setor</label>
      <select id="filtro-setor" value={filtros.setor} onChange={(e) => mudar({ ...filtros, setor: e.target.value as "todos" | Setor })} className={seletor}>
        {OPCOES_SETOR.map(([v, r]) => <option key={v} value={v}>{r}</option>)}
      </select>
      {comMeus && (
        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={filtros.meus} onChange={(e) => mudar({ ...filtros, meus: e.target.checked })} className="size-4 accent-brand-primary" />
          Atribuídos a mim
        </label>
      )}
      {filtrosAtivos(filtros) && (
        <button type="button" onClick={() => mudar(FILTROS_PADRAO)} className="text-sm font-medium text-brand-primary hover:underline">
          Limpar filtros
        </button>
      )}
    </div>
  );
}

function StatusSti({ c }: { c: Chamado }) {
  return (
    <div className="flex flex-wrap gap-1">
      <Badge classe={STATUS[c.status].badge}>{STATUS[c.status].rotulo}</Badge>
      {c.prioridade === "urgente" && c.status !== "resolvido" && <Badge classe={PRIORIDADES.urgente.badge}>Urgente</Badge>}
    </div>
  );
}

const StatusUsuario = ({ c }: { c: ChamadoUsuario }) => (
  <Badge classe={STATUS_USUARIO[c.status].badge}>{STATUS_USUARIO[c.status].rotulo}</Badge>
);

function Prints({ total }: { total: number }) {
  if (total === 0) return null;
  return (
    <span className="ml-2 inline-flex items-center gap-0.5 align-middle text-xs text-gray-500" title={`${total} print(s) do erro`}>
      <Paperclip className="size-3.5" aria-hidden />
      {total}
      <span className="sr-only"> print(s) anexado(s)</span>
    </span>
  );
}

const Interno = () => <span className="ml-2 rounded bg-emerald-50 px-1.5 py-0.5 align-middle text-[11px] font-semibold text-emerald-700">Interno</span>;

const linkNumero = "font-semibold text-brand-primary hover:underline";

export function ListaChamados(props: Props) {
  const [busca, setBusca] = useState("");
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_PADRAO);
  const sti = props.visao === "sti";
  const filtrados =
    props.visao === "sti"
      ? { visao: "sti" as const, chamados: aplicarFiltros(filtrarChamados(props.chamados, busca), filtros, props.meuId), meuId: props.meuId }
      : { visao: "usuario" as const, chamados: filtrarChamados(props.chamados, busca) };
  const total = filtrados.chamados.length;
  const comFiltro = sti && filtrosAtivos(filtros);

  return (
    <>
      <div className="relative mb-4 w-full lg:w-96">
        <label htmlFor="busca" className="sr-only">Buscar chamados</label>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" aria-hidden />
        <input
          id="busca"
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder={sti ? "Buscar por nº, assunto, solicitante ou RP" : "Buscar por assunto ou número..."}
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
      </div>

      {props.visao === "sti" && <BarraFiltros filtros={filtros} mudar={setFiltros} comMeus={props.meuId !== null} />}

      <p className={sti && (comFiltro || busca.trim()) ? "mb-3 text-sm text-gray-500" : "sr-only"} aria-live="polite">
        {sti ? `Mostrando ${total} de ${props.chamados.length} chamado(s)` : `${total} chamado(s) encontrado(s)`}
      </p>

      {total === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-gray-100 bg-white p-10 text-center text-gray-500">
          <Inbox className="mb-2 size-8" aria-hidden />
          {comFiltro ? (
            <>
              Nenhum chamado com esses filtros{busca.trim() ? ` para “${busca}”` : ""}.
              <button type="button" onClick={() => setFiltros(FILTROS_PADRAO)} className="mt-3 font-semibold text-brand-primary hover:underline">
                Limpar filtros
              </button>
            </>
          ) : busca.trim() ? (
            <>Nenhum chamado encontrado para “{busca}”.</>
          ) : (
            <>
              {sti ? "Nenhum chamado registrado." : "Você ainda não abriu chamados."}
              <Link href="/chamados/novo" className="mt-3 font-semibold text-brand-primary hover:underline">Abrir um chamado</Link>
            </>
          )}
        </div>
      ) : filtrados.visao === "sti" ? (
        <TabelaSti chamados={filtrados.chamados} meuId={filtrados.meuId} />
      ) : (
        <TabelaUsuario chamados={filtrados.chamados} />
      )}
    </>
  );
}

function TabelaUsuario({ chamados }: { chamados: ChamadoUsuario[] }) {
  return (
    <>
      {/* Celular: cartões */}
      <ul className="space-y-3 md:hidden">
        {chamados.map((c) => (
          <li key={c.id}>
            <Link href={`/chamados/${c.id}`} className="block rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-brand-primary">
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-brand-primary">#{c.id}</span>
                <StatusUsuario c={c} />
              </div>
              <p className="mt-1 font-medium text-gray-800">
                {c.assunto}
                <Prints total={c.totalAnexos} />
              </p>
              <p className="mt-1 text-sm text-gray-500">{c.solicitante}</p>
            </Link>
          </li>
        ))}
      </ul>

      {/* Tablet e desktop: tabela */}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-sm uppercase tracking-wider text-gray-600">
              <th scope="col" className="p-4 font-medium">Nº</th>
              <th scope="col" className="p-4 font-medium">Assunto</th>
              <th scope="col" className="p-4 font-medium">Solicitante</th>
              <th scope="col" className="p-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {chamados.map((c) => (
              <tr key={c.id} className="transition hover:bg-gray-50">
                <td className="whitespace-nowrap p-4"><Link href={`/chamados/${c.id}`} className={linkNumero}>#{c.id}</Link></td>
                <td className="p-4">
                  <Link href={`/chamados/${c.id}`} className="hover:underline">{c.assunto}</Link>
                  <Prints total={c.totalAnexos} />
                </td>
                <td className="p-4">{c.solicitante}</td>
                <td className="p-4"><StatusUsuario c={c} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** "Responsável" com a marca "(você)" para quem está logado. */
function Responsavel({ c, meuId }: { c: Chamado; meuId: string | null }) {
  if (!c.responsavel) return <span className="text-gray-400">Na fila</span>;
  return (
    <>
      {c.responsavel}
      {meuId !== null && c.responsavelId === meuId && <span className="ml-1 text-xs font-semibold text-brand-primary">(você)</span>}
    </>
  );
}

function TabelaSti({ chamados, meuId }: { chamados: Chamado[]; meuId: string | null }) {
  return (
    <>
      {/* Celular: cartões */}
      <ul className="space-y-3 md:hidden">
        {chamados.map((c) => (
          <li key={c.id}>
            <Link href={`/chamados/${c.id}`} className="block rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-brand-primary">
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-brand-primary">#{c.id}</span>
                <Badge classe={SETORES[c.setor].badge}>{SETORES[c.setor].sigla}</Badge>
              </div>
              <p className="mt-1 font-medium text-gray-800">
                {c.assunto}
                <Prints total={c.totalAnexos} />
              </p>
              <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
                <dt className="text-gray-500">Solicitante</dt>
                <dd>{c.solicitante}{c.interno && <Interno />}</dd>
                <dt className="text-gray-500">Responsável</dt>
                <dd><Responsavel c={c} meuId={meuId} /></dd>
                {c.rpEquipamento && (
                  <>
                    <dt className="text-gray-500">RP</dt>
                    <dd className="font-mono">{c.rpEquipamento}</dd>
                  </>
                )}
              </dl>
              <div className="mt-3"><StatusSti c={c} /></div>
            </Link>
          </li>
        ))}
      </ul>

      {/* Tablet e desktop: tabela */}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-sm uppercase tracking-wider text-gray-600">
              <th scope="col" className="p-4 font-medium">Nº</th>
              <th scope="col" className="p-4 font-medium">Assunto</th>
              <th scope="col" className="p-4 font-medium">Solicitante</th>
              <th scope="col" className="p-4 font-medium">Setor resp.</th>
              <th scope="col" className="p-4 font-medium">Responsável</th>
              <th scope="col" className="p-4 font-medium">Status</th>
              <th scope="col" className="p-4 font-medium">RP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {chamados.map((c) => (
              <tr key={c.id} className="transition hover:bg-gray-50">
                <td className="whitespace-nowrap p-4"><Link href={`/chamados/${c.id}`} className={linkNumero}>#{c.id}</Link></td>
                <td className="p-4">
                  <Link href={`/chamados/${c.id}`} className="hover:underline">{c.assunto}</Link>
                  <Prints total={c.totalAnexos} />
                </td>
                <td className="p-4">{c.solicitante}{c.interno && <Interno />}</td>
                <td className="p-4"><Badge classe={SETORES[c.setor].badge}>{SETORES[c.setor].sigla}</Badge></td>
                <td className="p-4"><Responsavel c={c} meuId={meuId} /></td>
                <td className="p-4"><StatusSti c={c} /></td>
                <td className="whitespace-nowrap p-4 font-mono text-gray-700">{c.rpEquipamento ?? <span className="font-sans text-gray-400">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
