import type { Metadata } from "next";
import { connection } from "next/server";
import { FormNovoChamado } from "@/components/chamados/FormNovoChamado";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { obterUsuario } from "@/lib/auth";

export const metadata: Metadata = { title: "Novo Chamado" };

export default async function NovoChamado() {
  await connection(); // o formulário depende do perfil de quem está logado
  const usuario = await obterUsuario();
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Cabecalho titulo="Abertura de Chamado Manual" descricao="Para quem prefere não usar o assistente" />
      <FormNovoChamado perfil={usuario?.perfil ?? null} />
    </div>
  );
}
