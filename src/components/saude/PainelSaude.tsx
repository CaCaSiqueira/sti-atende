"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bot,
  CircleCheck,
  CircleExclamationPoint,
  CircleMinus,
  CircleX,
  Database,
  HeartPulse,
  Plug,
  RefreshCw,
  Server,
  type LucideIcon,
} from "lucide-react";
import type { IdVerificacao, RelatorioSaude, StatusVerificacao } from "@/lib/health";

const INTERVALO_MS = 15_000;

const ICONES: Record<IdVerificacao, LucideIcon> = { app: Server, banco: Database, ia: Bot, sema: Plug };

const ESTILO_STATUS: Record<StatusVerificacao, { cor: string; icone: LucideIcon; rotulo: string }> = {
  ok: { cor: "text-green-400", icone: CircleCheck, rotulo: "OK" },
  degradado: { cor: "text-yellow-400", icone: CircleExclamationPoint, rotulo: "Lento" },
  falha: { cor: "text-red-400", icone: CircleX, rotulo: "Falha" },
  nao_configurado: { cor: "text-gray-400", icone: CircleMinus, rotulo: "Pendente" },
};

const SELO_GERAL: Record<StatusVerificacao, string> = {
  ok: "border-green-700 bg-green-900 text-green-300",
  degradado: "border-yellow-700 bg-yellow-900 text-yellow-300",
  falha: "border-red-700 bg-red-900 text-red-300",
  nao_configurado: "border-gray-600 bg-gray-800 text-gray-300",
};
const ROTULO_GERAL: Record<StatusVerificacao, string> = {
  ok: "Operacional",
  degradado: "Degradado",
  falha: "Com falha",
  nao_configurado: "Indefinido",
};

function formatarUptime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}h ${m}min` : m ? `${m}min ${s % 60}s` : `${s}s`;
}

interface Estado {
  relatorio: RelatorioSaude | null;
  latenciaNavegadorMs: number | null;
  verificadoEm: Date | null;
  erro: string | null;
}

export function PainelSaude({ detalhado = false }: { detalhado?: boolean }) {
  const [estado, setEstado] = useState<Estado>({ relatorio: null, latenciaNavegadorMs: null, verificadoEm: null, erro: null });
  const [carregando, setCarregando] = useState(true);

  const verificar = useCallback(async () => {
    setCarregando(true);
    const inicio = performance.now();
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const relatorio = (await res.json()) as RelatorioSaude;
      setEstado({ relatorio, latenciaNavegadorMs: Math.round(performance.now() - inicio), verificadoEm: new Date(), erro: null });
    } catch {
      setEstado((e) => ({ ...e, verificadoEm: new Date(), erro: "Não foi possível falar com o servidor" }));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    const primeira = setTimeout(verificar, 0);
    const id = setInterval(verificar, INTERVALO_MS);
    return () => {
      clearTimeout(primeira);
      clearInterval(id);
    };
  }, [verificar]);

  const { relatorio, latenciaNavegadorMs, verificadoEm, erro } = estado;
  const geral: StatusVerificacao = erro ? "falha" : (relatorio?.status ?? "nao_configurado");

  return (
    <section className="rounded-xl bg-brand-dark p-4 text-white shadow-lg sm:p-6" aria-labelledby="titulo-saude">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 id="titulo-saude" className="flex items-center gap-2 text-xl font-bold">
          <HeartPulse className="size-6 text-red-500" aria-hidden /> Saúde do Sistema
        </h2>
        <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${SELO_GERAL[geral]}`} role="status">
          Status: {relatorio || erro ? ROTULO_GERAL[geral] : "verificando..."}
        </span>
      </div>

      {erro && <p className="mb-4 rounded-lg bg-red-950 p-3 text-sm text-red-300">{erro}</p>}

      <ul className="space-y-1">
        {(relatorio?.verificacoes ?? []).map((v) => {
          const Icone = ICONES[v.id];
          const st = ESTILO_STATUS[v.status];
          const IconeStatus = st.icone;
          return (
            <li key={v.id} className="flex items-center justify-between gap-3 border-b border-gray-700 py-3 last:border-0">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-gray-200">
                  <Icone className="size-4 shrink-0" aria-hidden /> {v.nome}
                </p>
                <p className="ml-6 text-xs text-gray-400">{v.detalhe}</p>
              </div>
              <span className={`flex shrink-0 items-center gap-1.5 font-mono text-sm ${st.cor}`}>
                {v.latenciaMs !== null ? `${v.latenciaMs}ms` : st.rotulo}
                <IconeStatus className="size-4" aria-label={st.rotulo} />
              </span>
            </li>
          );
        })}
        {!relatorio && !erro && <li className="py-3 text-sm text-gray-400">Verificando serviços...</li>}
      </ul>

      {relatorio && (
        <dl className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          {[
            ["Resposta da API", latenciaNavegadorMs !== null ? `${latenciaNavegadorMs}ms` : "-"],
            ["Memória do servidor", `${relatorio.memoriaMB} MB`],
            ["Tempo no ar", formatarUptime(relatorio.uptimeSegundos)],
            ...(detalhado
              ? [
                  ["Versão", relatorio.versao],
                  ["Commit", relatorio.commit ?? "local"],
                  ["Ambiente", relatorio.ambiente],
                ]
              : []),
          ].map(([rotulo, valor]) => (
            <div key={rotulo} className="rounded-lg bg-gray-800 p-3">
              <dt className="text-xs text-gray-400">{rotulo}</dt>
              <dd className="mt-1 font-mono">{valor}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
        <span>
          {verificadoEm ? `Última verificação: ${verificadoEm.toLocaleTimeString("pt-BR")}` : ""} · atualiza a cada {INTERVALO_MS / 1000}s
        </span>
        <button
          onClick={verificar}
          disabled={carregando}
          className="flex items-center gap-2 rounded-lg border border-gray-600 px-3 py-1.5 text-gray-200 transition hover:bg-gray-800 disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${carregando ? "animate-spin" : ""}`} aria-hidden /> Verificar agora
        </button>
      </div>
    </section>
  );
}
