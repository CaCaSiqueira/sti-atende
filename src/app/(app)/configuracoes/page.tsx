import type { Metadata } from "next";
import { PainelSaude } from "@/components/saude/PainelSaude";
import { PlanoEntrega } from "@/components/saude/PlanoEntrega";
import { Cabecalho } from "@/components/ui/Cabecalho";

export const metadata: Metadata = { title: "Configurações" };

const LEGENDA = [
  ["OK", "Respondendo dentro do esperado (até 1s)."],
  ["Lento", "Respondeu, mas acima de 1s."],
  ["Falha", "Não respondeu em 3s ou retornou erro (a API devolve HTTP 503)."],
  ["Pendente", "Ainda não configurado nesta etapa do projeto."],
];

export default function Configuracoes() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Cabecalho
        titulo="Configurações do Sistema"
        descricao="Saúde do sistema em tempo real e andamento do projeto"
        acao={
          <a
            href="/api/health"
            target="_blank"
            rel="noopener"
            className="self-start rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Ver JSON da API de saúde
          </a>
        }
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="space-y-4">
          <PainelSaude detalhado />
          <details className="rounded-xl border border-gray-200 bg-white p-4 text-sm shadow-sm">
            <summary className="cursor-pointer font-semibold text-gray-800">Como ler o painel de saúde</summary>
            <dl className="mt-3 grid gap-2 sm:grid-cols-2">
              {LEGENDA.map(([termo, texto]) => (
                <div key={termo}>
                  <dt className="font-semibold text-gray-800">{termo}</dt>
                  <dd className="text-gray-600">{texto}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-gray-600">
              Os dados vêm de <code className="rounded bg-gray-100 px-1">GET /api/health</code>, medidos a cada consulta e sem
              cache. Ferramentas de monitoramento externas podem usar o mesmo endereço.
            </p>
          </details>
        </div>
        <PlanoEntrega />
      </div>
    </div>
  );
}
