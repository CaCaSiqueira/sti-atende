"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CircleAlert, CircleCheck } from "lucide-react";
import type { Setor } from "@/types/chamado";
import type { Perfil } from "@/lib/perfil";
import { MAX_ANEXOS, aceitaRPNaAbertura, rpValido } from "@/lib/permissoes";
import { classificar } from "@/lib/roteamento";
import { SETORES } from "@/lib/setores";
import { SeletorPrints } from "./SeletorPrints";
import { enviarPrints } from "./prints";

type Categoria = "" | Exclude<Setor, "TRIAGEM">;

interface Enviado {
  protocolo: string;
  setor: Setor;
  classificadoPelaIA: boolean;
  printsEnviados: number;
  falhasPrints: string[];
}

const MIN_DESCRICAO = 10;

/** `perfil` null = sem login configurado (desenvolvimento local). */
export function FormNovoChamado({ perfil }: { perfil: Perfil | null }) {
  const [assunto, setAssunto] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("");
  const [descricao, setDescricao] = useState("");
  const [rp, setRp] = useState("");
  const [prints, setPrints] = useState<File[]>([]);
  const [erros, setErros] = useState<{ assunto?: string; descricao?: string; rp?: string; geral?: string }>({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState<Enviado | null>(null);

  // Mesmas regras do servidor: o campo de RP aparece quando o chamado é (ou parece ser) de hardware.
  const setorPrevisto: Setor = categoria || classificar(`${assunto} ${descricao}`).setor;
  const mostraRP = aceitaRPNaAbertura(perfil, setorPrevisto);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const novosErros: typeof erros = {};
    if (!assunto.trim()) novosErros.assunto = "Informe o assunto.";
    if (descricao.trim().length < MIN_DESCRICAO) novosErros.descricao = `Descreva com pelo menos ${MIN_DESCRICAO} caracteres.`;
    if (mostraRP && rp.trim() && !rpValido(rp.trim())) novosErros.rp = "Use só números.";
    setErros(novosErros);
    if (Object.keys(novosErros).length) return;

    setEnviando(true);
    try {
      const res = await fetch("/api/chamados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assunto,
          descricao,
          ...(categoria ? { categoria } : {}),
          ...(mostraRP && rp.trim() ? { rp: rp.trim() } : {}),
        }),
      });
      const dados = await res.json().catch(() => ({}));
      if (res.status !== 201) {
        setErros({ geral: dados.erro ?? "Não foi possível abrir o chamado agora. Tente novamente." });
        return;
      }
      // O chamado já existe: se algum print falhar, dá para anexar depois na página dele.
      const falhasPrints = prints.length > 0 ? await enviarPrints(dados.protocolo, prints) : [];
      setEnviado({
        protocolo: dados.protocolo,
        setor: dados.setor,
        classificadoPelaIA: dados.classificadoAutomaticamente,
        printsEnviados: prints.length - falhasPrints.length,
        falhasPrints,
      });
    } catch {
      setErros({ geral: "Sem conexão com o servidor. Tente novamente." });
    } finally {
      setEnviando(false);
    }
  }

  function novo() {
    setAssunto("");
    setCategoria("");
    setDescricao("");
    setRp("");
    setPrints([]);
    setEnviado(null);
  }

  if (enviado) {
    return (
      <div className="max-w-2xl rounded-xl border border-green-200 bg-white p-6 shadow-sm sm:p-8" role="status">
        <CircleCheck className="size-10 text-green-600" aria-hidden />
        <h2 className="mt-3 text-xl font-bold text-gray-800">Chamado aberto</h2>
        <p className="mt-2 font-mono text-sm">Protocolo: #{enviado.protocolo}</p>
        <p className="mt-2 text-gray-700">
          Encaminhado para <strong>{SETORES[enviado.setor].nome}</strong>
          {enviado.classificadoPelaIA && " (classificado automaticamente)"}.
        </p>
        {enviado.printsEnviados > 0 && (
          <p className="mt-2 text-sm text-gray-600">
            {enviado.printsEnviados} {enviado.printsEnviados === 1 ? "print anexado" : "prints anexados"}.
          </p>
        )}
        {enviado.falhasPrints.length > 0 && (
          <p className="mt-3 flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              {enviado.falhasPrints.length === 1 ? "Um print não foi enviado" : "Alguns prints não foram enviados"}: {enviado.falhasPrints.join(" ")} Você pode
              anexar de novo na página do chamado.
            </span>
          </p>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href={`/chamados/${enviado.protocolo}`} className="rounded-lg bg-brand-primary px-5 py-2 text-center font-medium text-white transition hover:bg-brand-accent">
            Ver chamado
          </Link>
          <button onClick={novo} className="rounded-lg border border-gray-300 px-5 py-2 font-medium text-gray-700 transition hover:bg-gray-50">
            Abrir outro chamado
          </button>
        </div>
      </div>
    );
  }

  const campo = "w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-brand-primary";

  return (
    <form onSubmit={enviar} noValidate className="max-w-2xl space-y-6 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-8">
      <div>
        <label htmlFor="assunto" className="mb-1 block text-sm font-medium text-gray-700">Assunto / resumo</label>
        <input
          id="assunto"
          value={assunto}
          onChange={(e) => setAssunto(e.target.value)}
          aria-invalid={Boolean(erros.assunto)}
          aria-describedby={erros.assunto ? "erro-assunto" : undefined}
          className={`${campo} ${erros.assunto ? "border-red-400" : "border-gray-300"}`}
        />
        {erros.assunto && <p id="erro-assunto" className="mt-1 text-sm text-red-600">{erros.assunto}</p>}
      </div>

      <div>
        <label htmlFor="categoria" className="mb-1 block text-sm font-medium text-gray-700">
          Categoria <span className="font-normal text-gray-500">(opcional: a IA pode classificar)</span>
        </label>
        <select id="categoria" value={categoria} onChange={(e) => setCategoria(e.target.value as Categoria)} className={`${campo} border-gray-300 bg-white`}>
          <option value="">Deixar a IA classificar</option>
          <option value="CSTI">Sistemas (CSTI)</option>
          <option value="GATI">Equipamentos / hardware (GATI)</option>
          <option value="INFRA">Rede / infraestrutura</option>
        </select>
      </div>

      <div>
        <label htmlFor="descricao" className="mb-1 block text-sm font-medium text-gray-700">Descrição detalhada</label>
        <textarea
          id="descricao"
          rows={4}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          aria-invalid={Boolean(erros.descricao)}
          aria-describedby={erros.descricao ? "erro-descricao" : undefined}
          className={`${campo} ${erros.descricao ? "border-red-400" : "border-gray-300"}`}
        />
        {erros.descricao && <p id="erro-descricao" className="mt-1 text-sm text-red-600">{erros.descricao}</p>}
      </div>

      {mostraRP && (
        <div>
          <label htmlFor="rp" className="mb-1 block text-sm font-medium text-gray-700">
            RP do equipamento <span className="font-normal text-gray-500">(nº de patrimônio, opcional)</span>
          </label>
          <input
            id="rp"
            inputMode="numeric"
            autoComplete="off"
            maxLength={15}
            value={rp}
            onChange={(e) => {
              setRp(e.target.value);
              if (erros.rp) setErros((atuais) => ({ ...atuais, rp: undefined }));
            }}
            aria-invalid={Boolean(erros.rp)}
            aria-describedby="ajuda-rp"
            placeholder="Ex.: 245871"
            className={`${campo} font-mono sm:w-60 ${erros.rp ? "border-red-400" : "border-gray-300"}`}
          />
          <p id="ajuda-rp" className={`mt-1 text-sm ${erros.rp ? "text-red-600" : "text-gray-500"}`}>
            {erros.rp ?? "Só números, como na etiqueta de patrimônio do equipamento."}
          </p>
        </div>
      )}

      <div>
        <label htmlFor="prints-novo" className="mb-1 block text-sm font-medium text-gray-700">
          Print do erro <span className="font-normal text-gray-500">(opcional)</span>
        </label>
        <SeletorPrints id="prints-novo" arquivos={prints} aoMudar={setPrints} max={MAX_ANEXOS} desabilitado={enviando} />
      </div>

      {erros.geral && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{erros.geral}</p>}
      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-lg bg-green-600 px-6 py-2 font-bold text-white transition hover:bg-green-700 disabled:opacity-60 sm:w-auto"
      >
        {enviando ? (prints.length > 0 ? "Abrindo e enviando prints..." : "Abrindo...") : "Abrir chamado"}
      </button>
    </form>
  );
}
