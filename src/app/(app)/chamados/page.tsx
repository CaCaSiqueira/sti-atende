import type { Metadata } from "next";
import { connection } from "next/server";
import { ListaChamados } from "@/components/chamados/ListaChamados";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { obterUsuario } from "@/lib/auth";
import { listarChamados } from "@/lib/chamados";

export const metadata: Metadata = { title: "Consultar Chamados" };

export default async function Chamados() {
  await connection(); // dados sempre atuais do banco, sem pré-render
  const usuario = await obterUsuario();
  const chamados = await listarChamados(usuario);
  const externo = usuario?.perfil === "externo";
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Cabecalho
        titulo={externo ? "Meus Chamados" : "Consulta de Chamados"}
        descricao={externo ? "Acompanhe o status dos chamados que você abriu" : "Acompanhe o status e com quem está cada chamado"}
      />
      <ListaChamados chamados={chamados} />
    </div>
  );
}
