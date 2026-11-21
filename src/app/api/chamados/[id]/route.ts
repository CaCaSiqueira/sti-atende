import { z } from "zod";
import { PERFIS } from "@/lib/perfil";
import { sessaoDaApi } from "@/lib/auth";
import { atualizarChamado, obterChamado, type MudancasChamado } from "@/lib/chamados";
import { ipDaRequisicao, permitir } from "@/lib/limite";
import { MAX_SOLUCAO, reabrindo, validarSolucao } from "@/lib/historico";
import { RP_REGEX, podeGerenciar, podeInformarRP, podeVer } from "@/lib/permissoes";

const Entrada = z
  .object({
    /** Coloca quem está logado como responsável. */
    assumir: z.literal(true).optional(),
    status: z.enum(["aberto", "em_analise", "aguardando_terceiros", "resolvido"]).optional(),
    /** Vazio remove o RP. */
    rp: z.union([z.string().trim().regex(RP_REGEX, "Use só números."), z.literal("")]).optional(),
    /** Nota de solução: obrigatória ao concluir. */
    solucao: z.string().trim().max(MAX_SOLUCAO).optional(),
  })
  .refine((e) => e.assumir || e.status !== undefined || e.rp !== undefined, "Nada para atualizar.");

/**
 * Atualiza o chamado: assumir, mudar status e concluir com nota de solução (só STI);
 * RP do equipamento (STI ou o usuário interno dono do chamado de hardware). Cada mudança entra no histórico.
 * Chamado de outra pessoa responde 404, para não revelar que o número existe.
 */
export async function PATCH(req: Request, ctx: RouteContext<"/api/chamados/[id]">) {
  if (!permitir(`atualizar:${ipDaRequisicao(req)}`, 30, 60_000)) {
    return Response.json({ erro: "Muitas alterações em pouco tempo. Aguarde um minuto." }, { status: 429 });
  }
  const entrada = Entrada.safeParse(await req.json().catch(() => null));
  if (!entrada.success) {
    return Response.json({ erro: "Dados inválidos.", campos: entrada.error.flatten().fieldErrors }, { status: 400 });
  }
  const { assumir, status, rp, solucao } = entrada.data;

  try {
    const sessao = await sessaoDaApi();
    if ("negado" in sessao) return sessao.negado;
    const { usuario } = sessao;
    const { id } = await ctx.params;
    const chamado = await obterChamado(id);
    if (!chamado || !podeVer(usuario, chamado)) {
      return Response.json({ erro: "Chamado não encontrado." }, { status: 404 });
    }
    if ((assumir || status !== undefined) && !podeGerenciar(usuario)) {
      return Response.json({ erro: "Só a equipe da STI assume chamados e muda o status." }, { status: 403 });
    }
    if (rp !== undefined && !podeInformarRP(usuario, chamado)) {
      return Response.json({ erro: "O RP do equipamento não pode ser informado neste chamado." }, { status: 403 });
    }
    const erroSolucao = validarSolucao(chamado.status, status, solucao);
    if (erroSolucao) return Response.json({ erro: erroSolucao }, { status: 400 });

    const mudancas: MudancasChamado = {};
    if (assumir) {
      mudancas.responsavel = { id: usuario?.id ?? null, nome: usuario?.nome ?? `${PERFIS.sti.rotulo} (local)` };
      // Assumir um chamado aberto já o coloca em análise, a menos que outro status tenha sido escolhido.
      if (status === undefined && chamado.status === "aberto") mudancas.status = "em_analise";
    }
    if (status !== undefined && status !== chamado.status) mudancas.status = status;
    if (mudancas.status === "resolvido") mudancas.solucao = solucao;
    else if (reabrindo(chamado.status, mudancas.status)) mudancas.solucao = null;
    if (rp !== undefined && (rp === "" ? null : rp) !== chamado.rpEquipamento) mudancas.rpEquipamento = rp === "" ? null : rp;

    const nome = usuario?.nome ?? `${PERFIS.sti.rotulo} (local)`;
    await atualizarChamado(chamado.id, mudancas, { id: usuario?.id ?? null, nome });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[api/chamados/[id]]", e);
    return Response.json({ erro: "Não foi possível atualizar o chamado agora." }, { status: 500 });
  }
}
