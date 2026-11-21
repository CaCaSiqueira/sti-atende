import type { EventoChamado, StatusChamado, StatusUsuario } from "../types/chamado";
import { STATUS, statusParaUsuario } from "./setores.ts";

/** Regras do histórico e da nota de solução. Funções puras: usadas pela API, pela página e pelos testes. */

export const MIN_SOLUCAO = 10;
export const MAX_SOLUCAO = 2000;

/**
 * Concluir exige a nota de solução (o usuário vai ler o que foi feito); fora da conclusão, a nota não é aceita.
 * Devolve a mensagem de erro, ou null se estiver tudo certo.
 */
export function validarSolucao(statusAtual: StatusChamado, novoStatus: StatusChamado | undefined, solucao: string | undefined): string | null {
  const concluindo = novoStatus === "resolvido" && statusAtual !== "resolvido";
  const nota = solucao?.trim() ?? "";
  if (concluindo && nota.length < MIN_SOLUCAO) {
    return `Escreva a nota de solução (pelo menos ${MIN_SOLUCAO} caracteres) para concluir o chamado.`;
  }
  if (!concluindo && solucao !== undefined) return "A nota de solução só é enviada ao concluir o chamado.";
  return null;
}

/** Reabrir um chamado resolvido apaga a nota atual (o histórico guarda a antiga). */
export function reabrindo(statusAtual: StatusChamado, novoStatus: StatusChamado | undefined): boolean {
  return statusAtual === "resolvido" && novoStatus !== undefined && novoStatus !== "resolvido";
}

export interface PassoUsuario {
  status: StatusUsuario;
  /** Voltou a andar depois de resolvido. */
  reaberto: boolean;
  em: string;
}

/**
 * Linha do tempo que o usuário (externo ou interno) vê: só as mudanças de status que ele enxerga,
 * sem nomes da equipe, sem RP nem prints. "Aguardando terceiros" aparece como "em análise" e não repete.
 */
export function linhaDoTempoUsuario(eventos: EventoChamado[]): PassoUsuario[] {
  const passos: PassoUsuario[] = [];
  let anterior: StatusUsuario | null = null;
  for (const e of eventos) {
    if (!e.status) continue;
    const status = statusParaUsuario(e.status);
    if (status === anterior) continue;
    passos.push({ status, reaberto: anterior === "resolvido", em: e.criadoEm });
    anterior = status;
  }
  return passos;
}

/** Frase de cada evento no histórico completo (visão da STI). */
export function descreverEvento(e: EventoChamado): string {
  const quem = e.autor;
  switch (e.tipo) {
    case "aberto":
      return quem ? `Chamado aberto por ${quem}` : "Chamado aberto";
    case "assumido":
      return quem ? `${quem} assumiu o chamado` : "Chamado assumido";
    case "status": {
      const rotulo = e.status ? STATUS[e.status].rotulo : "?";
      return quem ? `${quem} mudou o status para "${rotulo}"` : `Status: "${rotulo}"`;
    }
    case "rp":
      if (e.detalhe) return quem ? `${quem} informou o RP ${e.detalhe}` : `RP informado: ${e.detalhe}`;
      return quem ? `${quem} removeu o RP` : "RP removido";
    case "print":
      return quem ? `${quem} anexou um print` : "Print anexado";
  }
}
