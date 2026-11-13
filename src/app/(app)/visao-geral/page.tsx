import type { Metadata } from "next";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { obterIndicadores } from "@/lib/chamados";
import { SETORES } from "@/lib/setores";

export const metadata: Metadata = { title: "Visão Geral" };

export default async function VisaoGeral() {
  const ind = await obterIndicadores();
  const cards = [
    { rotulo: "Chamados abertos", valor: ind.abertos, borda: "border-l-blue-500" },
    { rotulo: "Resolvidos (hoje)", valor: ind.resolvidosHoje, borda: "border-l-green-500" },
    { rotulo: "Aguardando terceiros", valor: ind.aguardandoTerceiros, borda: "border-l-yellow-500" },
    { rotulo: "SLA violado", valor: ind.slaViolado, borda: "border-l-red-500" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Cabecalho titulo="Visão Geral" descricao="Indicadores do atendimento de TI (dados de exemplo até a Sprint 3)" />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        {cards.map((c) => (
          <div key={c.rotulo} className={`rounded-xl border border-l-4 border-gray-100 bg-white p-4 shadow-sm sm:p-6 ${c.borda}`}>
            <p className="text-xs font-semibold uppercase text-gray-500 sm:text-sm">{c.rotulo}</p>
            <p className="mt-2 text-2xl font-bold text-gray-800 sm:text-3xl">{c.valor}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 text-lg font-bold text-gray-800">Volume por setor</h2>
        <ul className="space-y-4">
          {ind.volumePorSetor.map((v) => (
            <li key={v.setor}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium">
                  {SETORES[v.setor].sigla} <span className="hidden text-gray-500 sm:inline">· {SETORES[v.setor].nome}</span>
                </span>
                <span>{v.percentual}%</span>
              </div>
              <div
                className="h-2 w-full rounded-full bg-gray-200"
                role="progressbar"
                aria-valuenow={v.percentual}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Volume ${SETORES[v.setor].sigla}`}
              >
                <div className={`h-2 rounded-full ${SETORES[v.setor].barra}`} style={{ width: `${v.percentual}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
