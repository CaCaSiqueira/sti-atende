import { sessaoDaApi } from "@/lib/auth";
import { adicionarAnexo, obterChamado } from "@/lib/chamados";
import { TAMANHO_MAX_ANEXO, detectarTipoImagem, formatarTamanho } from "@/lib/imagem";
import { ipDaRequisicao, permitir } from "@/lib/limite";
import { MAX_ANEXOS, podeAnexar, podeVer } from "@/lib/permissoes";

/**
 * Anexa um print do erro (campo "arquivo", multipart/form-data).
 * O tipo é conferido pelos bytes do arquivo (PNG, JPEG ou WebP), não pela extensão.
 */
export async function POST(req: Request, ctx: RouteContext<"/api/chamados/[id]/anexos">) {
  if (!(await permitir(`anexos:${ipDaRequisicao(req)}`, 12, 60_000))) {
    return Response.json({ erro: "Muitos envios em pouco tempo. Aguarde um minuto." }, { status: 429 });
  }
  // Recusa cedo o que nem caberia: o limite de corpo da Vercel é 4,5 MB.
  if (Number(req.headers.get("content-length") ?? 0) > TAMANHO_MAX_ANEXO + 64 * 1024) {
    return Response.json({ erro: `A imagem passa de ${formatarTamanho(TAMANHO_MAX_ANEXO)}.` }, { status: 413 });
  }

  try {
    const sessao = await sessaoDaApi();
    if ("negado" in sessao) return sessao.negado;
    const { usuario } = sessao;
    const { id } = await ctx.params;
    const chamado = await obterChamado(id);
    if (!chamado || !podeVer(usuario, chamado)) {
      return Response.json({ erro: "Chamado não encontrado." }, { status: 404 });
    }
    if (!podeAnexar(usuario, chamado)) {
      return Response.json({ erro: "Não é possível anexar prints a este chamado." }, { status: 403 });
    }
    if (chamado.anexos.length >= MAX_ANEXOS) {
      return Response.json({ erro: `Este chamado já tem ${MAX_ANEXOS} prints, o máximo permitido.` }, { status: 409 });
    }

    const formulario = await req.formData().catch(() => null);
    const arquivo = formulario?.get("arquivo");
    if (!(arquivo instanceof File) || arquivo.size === 0) {
      return Response.json({ erro: "Envie a imagem no campo 'arquivo'." }, { status: 400 });
    }
    if (arquivo.size > TAMANHO_MAX_ANEXO) {
      return Response.json({ erro: `A imagem passa de ${formatarTamanho(TAMANHO_MAX_ANEXO)}.` }, { status: 413 });
    }
    const bytes = new Uint8Array(await arquivo.arrayBuffer());
    const tipo = detectarTipoImagem(bytes);
    if (!tipo) return Response.json({ erro: "Envie uma imagem PNG, JPG ou WebP." }, { status: 415 });

    const anexo = await adicionarAnexo(chamado.id, { bytes, tipo }, { id: usuario?.id ?? null, nome: usuario?.nome ?? "Teste local" });
    return Response.json({ anexo }, { status: 201 });
  } catch (e) {
    console.error("[api/chamados/[id]/anexos]", e);
    return Response.json({ erro: "Não foi possível guardar o print agora." }, { status: 500 });
  }
}
