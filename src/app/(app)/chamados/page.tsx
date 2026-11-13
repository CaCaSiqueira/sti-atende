import type { Metadata } from "next";
import { ListaChamados } from "@/components/chamados/ListaChamados";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { listarChamados } from "@/lib/chamados";

export const metadata: Metadata = { title: "Consultar Chamados" };

export default async function Chamados() {
  const chamados = await listarChamados();
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Cabecalho titulo="Consulta de Chamados" descricao="Acompanhe o status e com quem está cada chamado" />
      <ListaChamados chamados={chamados} />
    </div>
  );
}
