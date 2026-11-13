import type { Chamado, Indicadores, Prioridade, Setor } from "../types/chamado";

/** Prazo de atendimento (horas) por prioridade. */
export const PRAZO_SLA_HORAS: Record<Prioridade, number> = {
  urgente: 4,
  alta: 8,
  media: 24,
  baixa: 72,
};

const HORA_MS = 60 * 60 * 1000;
// Mato Grosso: UTC-4 o ano todo (sem horário de verão).
const FUSO_MT_MS = -4 * HORA_MS;

export function slaViolado(c: Pick<Chamado, "status" | "prioridade" | "abertoEm">, agora: number): boolean {
  if (c.status === "resolvido") return false;
  return agora - Date.parse(c.abertoEm) > PRAZO_SLA_HORAS[c.prioridade] * HORA_MS;
}

/** Início do dia corrente no horário de Cuiabá, em epoch ms. */
export function inicioDoDiaMT(agora: number): number {
  const local = agora + FUSO_MT_MS;
  return local - (local % (24 * HORA_MS)) - FUSO_MT_MS;
}

type ChamadoIndicador = Pick<Chamado, "status" | "prioridade" | "abertoEm" | "setor"> & { resolvidoEm: string | null };

export function calcularIndicadores(chamados: ChamadoIndicador[], agora: number): Indicadores {
  const hoje = inicioDoDiaMT(agora);
  const total = chamados.length || 1;
  const setores: Setor[] = ["CSTI", "GATI", "INFRA", "TRIAGEM"];

  return {
    abertos: chamados.filter((c) => c.status !== "resolvido").length,
    resolvidosHoje: chamados.filter((c) => c.resolvidoEm && Date.parse(c.resolvidoEm) >= hoje).length,
    aguardandoTerceiros: chamados.filter((c) => c.status === "aguardando_terceiros").length,
    slaViolado: chamados.filter((c) => slaViolado(c, agora)).length,
    volumePorSetor: setores
      .map((setor) => ({
        setor,
        percentual: Math.round((chamados.filter((c) => c.setor === setor).length / total) * 100),
      }))
      .filter((v) => v.percentual > 0),
  };
}
