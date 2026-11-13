import { obterUsuario } from "@/lib/auth";

/** Dados mínimos do usuário logado para a interface (nome e perfil). */
export async function GET() {
  const usuario = await obterUsuario();
  return Response.json({ usuario }, { headers: { "Cache-Control": "private, no-store" } });
}
