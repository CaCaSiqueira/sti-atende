"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { UserCheck } from "lucide-react";
import type { StatusChamado } from "@/types/chamado";
import { MAX_ANEXOS, rpValido } from "@/lib/permissoes";
import { STATUS } from "@/lib/setores";
import { SeletorPrints } from "./SeletorPrints";
import { enviarPrints } from "./prints";

interface Props {
  chamadoId: string;
  permissoes: { gerenciar: boolean; rp: boolean; anexar: boolean };
  statusAtual: StatusChamado;
  rpAtual: string | null;
  responsavel: string | null;
  souResponsavel: boolean;
  /** Quantos prints ainda cabem. */
  vagasPrints: number;
}

const OPCOES_STATUS = Object.entries(STATUS) as [StatusChamado, { rotulo: string }][];

/**
 * STI: assume o chamado e muda o status; ao mudar ou concluir, pode informar o RP e anexar prints.
 * Usuário: complementa o próprio chamado com prints (e o RP, se for interno e o chamado for de hardware).
 */
export function PainelAtualizacao({ chamadoId, permissoes, statusAtual, rpAtual, responsavel, souResponsavel, vagasPrints }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(statusAtual);
  const [rp, setRp] = useState(rpAtual ?? "");
  const [prints, setPrints] = useState<File[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // Depois do router.refresh(), os valores do servidor mudam: o formulário acompanha.
  const [base, setBase] = useState({ statusAtual, rpAtual });
  if (base.statusAtual !== statusAtual || base.rpAtual !== rpAtual) {
    setBase({ statusAtual, rpAtual });
    setStatus(statusAtual);
    setRp(rpAtual ?? "");
  }

  const rpLimpo = rp.trim();
  const mudouStatus = permissoes.gerenciar && status !== statusAtual;
  const mudouRp = permissoes.rp && rpLimpo !== (rpAtual ?? "");
  const temMudanca = mudouStatus || mudouRp || prints.length > 0;
  const rpInvalido = rpLimpo !== "" && !rpValido(rpLimpo);

  async function atualizar(corpo: Record<string, unknown>): Promise<boolean> {
    const res = await fetch(`/api/chamados/${encodeURIComponent(chamadoId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    }).catch(() => null);
    if (res?.ok) return true;
    const dados = res ? await res.json().catch(() => ({})) : {};
    setErro(dados.erro ?? (res ? "Não foi possível atualizar o chamado." : "Sem conexão com o servidor."));
    return false;
  }

  async function assumir() {
    setErro(null);
    setAviso(null);
    setSalvando(true);
    if (await atualizar({ assumir: true })) {
      setAviso("Chamado assumido por você.");
      router.refresh();
    }
    setSalvando(false);
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (rpInvalido) return;
    setErro(null);
    setAviso(null);
    setSalvando(true);
    try {
      const corpo: Record<string, unknown> = {};
      if (mudouStatus) corpo.status = status;
      if (mudouRp) corpo.rp = rpLimpo;
      if (Object.keys(corpo).length > 0 && !(await atualizar(corpo))) return;
      const erros = prints.length > 0 ? await enviarPrints(chamadoId, prints) : [];
      setPrints([]);
      if (erros.length > 0) setErro(`Alguns prints não foram enviados. ${erros.join(" ")}`);
      else setAviso(status === "resolvido" && mudouStatus ? "Chamado concluído." : "Chamado atualizado.");
      router.refresh();
    } finally {
      setSalvando(false);
    }
  }

  const campo = "w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-brand-primary";

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6" aria-labelledby="titulo-atualizacao">
      <h2 id="titulo-atualizacao" className="text-lg font-bold text-gray-800">
        {permissoes.gerenciar ? "Atendimento" : "Complementar chamado"}
      </h2>

      {permissoes.gerenciar && (
        <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm">
          <p className="text-gray-500">Responsável</p>
          <p className="font-semibold text-gray-800">{responsavel ?? "Ninguém ainda (na fila)"}</p>
          {!souResponsavel && (
            <button
              type="button"
              onClick={assumir}
              disabled={salvando}
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 font-medium text-white transition hover:bg-brand-accent disabled:opacity-60"
            >
              <UserCheck className="size-4" aria-hidden /> Assumir chamado
            </button>
          )}
        </div>
      )}

      <form onSubmit={salvar} noValidate className="mt-4 space-y-4">
        {permissoes.gerenciar && (
          <div>
            <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select id="status" value={status} onChange={(e) => setStatus(e.target.value as StatusChamado)} className={`${campo} border-gray-300 bg-white`}>
              {OPCOES_STATUS.map(([valor, { rotulo }]) => (
                <option key={valor} value={valor}>{rotulo}</option>
              ))}
            </select>
          </div>
        )}

        {permissoes.rp && (
          <div>
            <label htmlFor="rp" className="mb-1 block text-sm font-medium text-gray-700">
              RP do equipamento <span className="font-normal text-gray-500">(nº de patrimônio)</span>
            </label>
            <input
              id="rp"
              inputMode="numeric"
              autoComplete="off"
              maxLength={15}
              value={rp}
              onChange={(e) => setRp(e.target.value)}
              aria-invalid={rpInvalido}
              aria-describedby="ajuda-rp"
              placeholder="Ex.: 245871"
              className={`${campo} font-mono ${rpInvalido ? "border-red-400" : "border-gray-300"}`}
            />
            <p id="ajuda-rp" className={`mt-1 text-xs ${rpInvalido ? "text-red-600" : "text-gray-500"}`}>
              {rpInvalido ? "Use só números." : "Só números, como na etiqueta de patrimônio."}
            </p>
          </div>
        )}

        {permissoes.anexar && (
          <div>
            <label htmlFor={vagasPrints > 0 ? "prints-chamado" : undefined} className="mb-1 block text-sm font-medium text-gray-700">Print do erro</label>
            {vagasPrints > 0 ? (
              <SeletorPrints id="prints-chamado" arquivos={prints} aoMudar={setPrints} max={vagasPrints} desabilitado={salvando} />
            ) : (
              <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">Este chamado já tem o máximo de {MAX_ANEXOS} prints.</p>
            )}
          </div>
        )}

        {erro && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{erro}</p>}
        {aviso && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{aviso}</p>}

        <button
          type="submit"
          disabled={!temMudanca || salvando || rpInvalido}
          className="w-full rounded-lg bg-green-600 px-6 py-2 font-bold text-white transition hover:bg-green-700 disabled:opacity-50"
        >
          {salvando ? "Salvando..." : mudouStatus && status === "resolvido" ? "Concluir chamado" : "Salvar alterações"}
        </button>
      </form>
    </section>
  );
}
