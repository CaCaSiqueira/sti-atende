import Link from "next/link";
import { SearchX } from "lucide-react";

export default function ChamadoNaoEncontrado() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-md flex-col items-center rounded-xl border border-gray-100 bg-white p-10 text-center shadow-sm">
        <SearchX className="mb-3 size-10 text-gray-400" aria-hidden />
        <h1 className="text-xl font-bold text-gray-800">Chamado não encontrado</h1>
        <p className="mt-2 text-sm text-gray-500">Confira o número. Só aparecem aqui os chamados que você pode acompanhar.</p>
        <Link href="/chamados" className="mt-6 rounded-lg bg-brand-primary px-5 py-2 font-medium text-white transition hover:bg-brand-accent">
          Ver chamados
        </Link>
      </div>
    </div>
  );
}
