import type { ReactNode } from "react";

export function Cabecalho({ titulo, descricao, acao }: { titulo: string; descricao?: string; acao?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">{titulo}</h1>
        {descricao && <p className="mt-1 text-sm text-gray-500">{descricao}</p>}
      </div>
      {acao}
    </div>
  );
}

export function Badge({ classe, children }: { classe: string; children: ReactNode }) {
  return <span className={`inline-block whitespace-nowrap rounded px-2 py-1 text-xs font-semibold ${classe}`}>{children}</span>;
}
