import type { Metadata } from "next";
import { PainelSaude } from "@/components/saude/PainelSaude";
import { Cabecalho } from "@/components/ui/Cabecalho";

export const metadata: Metadata = { title: "Saúde do Sistema" };

const LEGENDA = [
  ["OK", "Serviço respondendo dentro do esperado (até 1s)."],
  ["Lento", "Respondeu, mas acima de 1s."],
  ["Falha", "Não respondeu em 3s ou retornou erro. A API devolve HTTP 503."],
  ["Pendente", "Ainda não configurado nesta etapa do projeto."],
];

export default function Saude() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Cabecalho
        titulo="Saúde do Sistema"
        descricao="Verificação em tempo real dos serviços que compõem o STI Atende"
        acao={
          <a
            href="/api/health"
            target="_blank"
            rel="noopener"
            className="self-start rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Ver JSON da API
          </a>
        }
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <PainelSaude detalhado />
        </div>
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-lg font-bold text-gray-800">Como ler este painel</h2>
          <dl className="space-y-3 text-sm">
            {LEGENDA.map(([termo, texto]) => (
              <div key={termo}>
                <dt className="font-semibold text-gray-800">{termo}</dt>
                <dd className="text-gray-600">{texto}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-sm text-gray-600">
            Os dados vêm de <code className="rounded bg-gray-100 px-1">GET /api/health</code>, que mede cada dependência a cada
            consulta, sem cache. Ferramentas de monitoramento externas podem usar o mesmo endereço.
          </p>
        </section>
      </div>
    </div>
  );
}
