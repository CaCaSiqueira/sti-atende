"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CircleCheck } from "lucide-react";
import type { Setor } from "@/types/chamado";
import { SETORES } from "@/lib/setores";

type Categoria = "" | Exclude<Setor, "TRIAGEM">;

interface Enviado {
  protocolo: string;
  setor: Setor;
  classificadoPelaIA: boolean;
}

const MIN_DESCRICAO = 10;

export function FormNovoChamado() {
  const [assunto, setAssunto] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("");
  const [descricao, setDescricao] = useState("");
  const [erros, setErros] = useState<{ assunto?: string; descricao?: string; geral?: string }>({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState<Enviado | null>(null);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const novosErros: typeof erros = {};
    if (!assunto.trim()) novosErros.assunto = "Informe o assunto.";
    if (descricao.trim().length < MIN_DESCRICAO) novosErros.descricao = `Descreva com pelo menos ${MIN_DESCRICAO} caracteres.`;
    setErros(novosErros);
    if (Object.keys(novosErros).length) return;

    setEnviando(true);
    try {
      const res = await fetch("/api/chamados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assunto, descricao, ...(categoria ? { categoria } : {}) }),
      });
      const dados = await res.json().catch(() => ({}));
      if (res.status !== 201) {
        setErros({ geral: dados.erro ?? "Não foi possível abrir o chamado agora. Tente novamente." });
        return;
      }
      setEnviado({ protocolo: dados.protocolo, setor: dados.setor, classificadoPelaIA: dados.classificadoAutomaticamente });
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
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button onClick={novo} className="rounded-lg bg-brand-primary px-5 py-2 font-medium text-white transition hover:bg-brand-accent">
            Abrir outro chamado
          </button>
          <Link href="/chamados" className="rounded-lg border border-gray-300 px-5 py-2 text-center font-medium text-gray-700 transition hover:bg-gray-50">
            Consultar chamados
          </Link>
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

      {erros.geral && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{erros.geral}</p>}
      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-lg bg-green-600 px-6 py-2 font-bold text-white transition hover:bg-green-700 disabled:opacity-60 sm:w-auto"
      >
        {enviando ? "Abrindo..." : "Abrir chamado"}
      </button>
    </form>
  );
}
