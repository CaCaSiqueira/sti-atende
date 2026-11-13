"use client";

import { useState } from "react";
import { Inbox, Search } from "lucide-react";
import type { Chamado } from "@/types/chamado";
import { filtrarChamados } from "@/lib/busca";
import { PRIORIDADES, SETORES, STATUS } from "@/lib/setores";
import { Badge } from "@/components/ui/Cabecalho";

function Status({ c }: { c: Chamado }) {
  return (
    <div className="flex flex-wrap gap-1">
      <Badge classe={STATUS[c.status].badge}>{STATUS[c.status].rotulo}</Badge>
      {c.prioridade === "urgente" && c.status !== "resolvido" && (
        <Badge classe={PRIORIDADES.urgente.badge}>Urgente</Badge>
      )}
    </div>
  );
}

export function ListaChamados({ chamados }: { chamados: Chamado[] }) {
  const [busca, setBusca] = useState("");
  const resultado = filtrarChamados(chamados, busca);

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
          placeholder="Buscar por assunto, número ou solicitante..."
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
      </div>

      <p className="sr-only" aria-live="polite">{resultado.length} chamado(s) encontrado(s)</p>

      {resultado.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-gray-100 bg-white p-10 text-center text-gray-500">
          <Inbox className="mb-2 size-8" aria-hidden />
          Nenhum chamado encontrado para “{busca}”.
        </div>
      ) : (
        <>
          {/* Celular: cartões */}
          <ul className="space-y-3 md:hidden">
            {resultado.map((c) => (
              <li key={c.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-brand-primary">#{c.id}</span>
                  <Badge classe={SETORES[c.setor].badge}>{SETORES[c.setor].sigla}</Badge>
                </div>
                <p className="mt-1 font-medium text-gray-800">{c.assunto}</p>
                <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
                  <dt className="text-gray-500">Solicitante</dt>
                  <dd>{c.solicitante}</dd>
                  <dt className="text-gray-500">Com quem está</dt>
                  <dd>{c.responsavel ?? "Na fila"}</dd>
                </dl>
                <div className="mt-3"><Status c={c} /></div>
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
                  <th scope="col" className="p-4 font-medium">Com quem está</th>
                  <th scope="col" className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {resultado.map((c) => (
                  <tr key={c.id} className="transition hover:bg-gray-50">
                    <td className="whitespace-nowrap p-4 font-semibold text-brand-primary">#{c.id}</td>
                    <td className="p-4">{c.assunto}</td>
                    <td className="p-4">{c.solicitante}</td>
                    <td className="p-4"><Badge classe={SETORES[c.setor].badge}>{SETORES[c.setor].sigla}</Badge></td>
                    <td className="p-4">{c.responsavel ?? <span className="text-gray-400">Na fila</span>}</td>
                    <td className="p-4"><Status c={c} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
