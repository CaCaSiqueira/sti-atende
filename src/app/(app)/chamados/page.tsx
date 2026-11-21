import type { Metadata } from "next";
import { connection } from "next/server";
import { ListaChamados } from "@/components/chamados/ListaChamados";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { obterUsuario } from "@/lib/auth";
import { listarChamados } from "@/lib/chamados";
import { ehSti } from "@/lib/permissoes";
import { statusParaUsuario } from "@/lib/setores";
import type { Chamado, ChamadoUsuario } from "@/types/chamado";

export const metadata: Metadata = { title: "Consultar Chamados" };

/** O usuário recebe só o que vê: sem setor, responsável nem detalhes da operação da STI. */
const visaoUsuario = (c: Chamado): ChamadoUsuario => ({
  id: c.id,
  assunto: c.assunto,
  solicitante: c.solicitante,
  status: statusParaUsuario(c.status),
  rpEquipamento: c.rpEquipamento,
  totalAnexos: c.totalAnexos,
});

export default async function Chamados() {
  await connection(); // dados sempre atuais do banco, sem pré-render
  const usuario = await obterUsuario();
  const chamados = await listarChamados(usuario);

  if (ehSti(usuario)) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Cabecalho titulo="Consulta de Chamados" descricao="Status, responsável e RP de cada chamado. Clique no número para atender." />
        <ListaChamados visao="sti" chamados={chamados} />
      </div>
    );
  }
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Cabecalho titulo="Meus Chamados" descricao="Acompanhe os chamados que você abriu. Clique no número para ver detalhes ou anexar um print." />
      <ListaChamados visao="usuario" chamados={chamados.map(visaoUsuario)} />
    </div>
  );
}
