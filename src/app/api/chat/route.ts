import { z } from "zod";
import { criarChamado } from "@/lib/chamados";
import { analisarMensagem } from "@/lib/ia";
import { ipDaRequisicao, permitir } from "@/lib/limite";

const Entrada = z.object({ mensagem: z.string().trim().min(1).max(1000) });

export interface RespostaChat {
  intencao: string;
  setor: string;
  prioridade: string;
  resposta: string | null;
  fonte: "ia" | "regras";
  protocolo: string | null;
}

export async function POST(req: Request) {
  if (!permitir(`chat:${ipDaRequisicao(req)}`, 15, 60_000)) {
    return Response.json({ erro: "Muitas mensagens em pouco tempo. Aguarde um minuto." }, { status: 429 });
  }

  const entrada = Entrada.safeParse(await req.json().catch(() => null));
  if (!entrada.success) return Response.json({ erro: "Mensagem inválida." }, { status: 400 });
  const { mensagem } = entrada.data;

  try {
    const analise = await analisarMensagem(mensagem);

    // CAR tem POP de autoatendimento: o chamado só nasce se o usuário pedir um analista.
    const chamado =
      analise.intencao === "pop_car"
        ? null
        : await criarChamado({
            assunto: analise.assunto,
            descricao: mensagem,
            setor: analise.setor,
            prioridade: analise.prioridade,
            origem: "chat",
            classificadoPor: analise.fonte,
          });

    const corpo: RespostaChat = {
      intencao: analise.intencao,
      setor: analise.setor,
      prioridade: analise.prioridade,
      resposta: analise.resposta,
      fonte: analise.fonte,
      protocolo: chamado?.id ?? null,
    };
    return Response.json(corpo);
  } catch (e) {
    console.error("[api/chat]", e);
    return Response.json({ erro: "Não foi possível registrar seu atendimento agora." }, { status: 500 });
  }
}
