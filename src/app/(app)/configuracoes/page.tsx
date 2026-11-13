import type { Metadata } from "next";
import { PainelSaude } from "@/components/saude/PainelSaude";
import { PlanoEntrega } from "@/components/saude/PlanoEntrega";
import { Cabecalho } from "@/components/ui/Cabecalho";

export const metadata: Metadata = { title: "Configurações" };

export default function Configuracoes() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Cabecalho titulo="Configurações do Sistema" descricao="Monitoramento e andamento do projeto" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        <PainelSaude />
        <PlanoEntrega />
      </div>
    </div>
  );
}
