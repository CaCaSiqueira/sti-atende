import type { Metadata } from "next";
import { FormNovoChamado } from "@/components/chamados/FormNovoChamado";
import { Cabecalho } from "@/components/ui/Cabecalho";

export const metadata: Metadata = { title: "Novo Chamado" };

export default function NovoChamado() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Cabecalho titulo="Abertura de Chamado Manual" descricao="Para quem prefere não usar o assistente" />
      <FormNovoChamado />
    </div>
  );
}
