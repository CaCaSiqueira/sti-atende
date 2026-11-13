import { z } from "zod";
import { criarChamado } from "@/lib/chamados";
import { ipDaRequisicao, permitir } from "@/lib/limite";
import { classificar, rotearIntencao } from "@/lib/roteamento";
import type { Prioridade } from "@/types/chamado";

// Mesma prioridade que o SLA aplica quando a IA/regras chegam ao setor.
const PRIORIDADE_POR_CATEGORIA: Record<"CSTI" | "GATI" | "INFRA", Prioridade> = {
  CSTI: rotearIntencao("sistemas").prioridade,
  GATI: rotearIntencao("hardware").prioridade,
  INFRA: rotearIntencao("infraestrutura").prioridade,
};

const Entrada = z.object({
  assunto: z.string().trim().min(1).max(200),
  descricao: z.string().trim().min(10).max(4000),
  categoria: z.enum(["CSTI", "GATI", "INFRA"]).optional(),
});

/** Abertura manual (formulário) ou pedido de analista vindo do chat. */
export async function POST(req: Request) {
  if (!permitir(`chamados:${ipDaRequisicao(req)}`, 10, 60_000)) {
    return Response.json({ erro: "Muitas solicitações em pouco tempo. Aguarde um minuto." }, { status: 429 });
  }

  const entrada = Entrada.safeParse(await req.json().catch(() => null));
  if (!entrada.success) {
    return Response.json({ erro: "Dados inválidos.", campos: entrada.error.flatten().fieldErrors }, { status: 400 });
  }
  const { assunto, descricao, categoria } = entrada.data;

  // Categoria escolhida pelo usuário prevalece; senão, as regras de SLA classificam.
  const auto = classificar(`${assunto} ${descricao}`);
  const setor = categoria ?? auto.setor;
  const prioridade = categoria ? PRIORIDADE_POR_CATEGORIA[categoria] : auto.prioridade;

  try {
    const chamado = await criarChamado({
      assunto,
      descricao,
      setor,
      prioridade,
      origem: "manual",
      classificadoPor: categoria ? "usuario" : "regras",
    });
    return Response.json({ protocolo: chamado.id, setor: chamado.setor, classificadoAutomaticamente: !categoria }, { status: 201 });
  } catch (e) {
    console.error("[api/chamados]", e);
    return Response.json({ erro: "Não foi possível abrir o chamado agora." }, { status: 500 });
  }
}
