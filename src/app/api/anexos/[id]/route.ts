import { sessaoDaApi } from "@/lib/auth";
import { lerAnexo, obterChamado } from "@/lib/chamados";
import { podeVer } from "@/lib/permissoes";

/**
 * Entrega a imagem de um print, só para quem pode ver o chamado.
 * As imagens ficam num bucket privado: não há link público para elas.
 */
export async function GET(_req: Request, ctx: RouteContext<"/api/anexos/[id]">) {
  try {
    const sessao = await sessaoDaApi();
    if ("negado" in sessao) return sessao.negado;
    const { id } = await ctx.params;
    const anexo = await lerAnexo(id);
    const chamado = anexo ? await obterChamado(anexo.chamadoId) : null;
    if (!anexo || !chamado || !podeVer(sessao.usuario, chamado)) {
      return Response.json({ erro: "Imagem não encontrada." }, { status: 404 });
    }
    return new Response(new Blob([anexo.bytes as Uint8Array<ArrayBuffer>], { type: anexo.tipo }), {
      headers: {
        "Content-Type": anexo.tipo,
        "Cache-Control": "private, max-age=600",
        "X-Content-Type-Options": "nosniff",
        // Mesmo aberta direto no navegador, a resposta não executa nada.
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch (e) {
    console.error("[api/anexos/[id]]", e);
    return Response.json({ erro: "Não foi possível abrir a imagem agora." }, { status: 500 });
  }
}
