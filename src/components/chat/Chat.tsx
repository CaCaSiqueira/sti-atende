"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Bot, Paperclip, RefreshCw, Send, Sparkles, TriangleExclamationPoint, User, Workflow } from "lucide-react";
import type { Intencao } from "@/lib/roteamento";
import { SETORES } from "@/lib/setores";
import type { RespostaChat } from "@/app/api/chat/route";

/** O navegador só exibe: classificação, chamado e regra de 24h do CAR acontecem no servidor. */

type RespostaBot =
  | { tipo: "saudacao" }
  | { tipo: "analise"; intencao: Intencao; texto: string | null; protocolo: string | null; fonte: "ia" | "regras" }
  | { tipo: "sync_ok" }
  | { tipo: "sync_bloqueada"; liberaEm: number }
  | { tipo: "encaminhado_analista"; protocolo: string }
  | { tipo: "erro"; texto: string };

type Mensagem =
  | { id: number; autor: "usuario"; texto: string }
  | { id: number; autor: "bot"; resposta: RespostaBot };

const SUGESTOES = ["Erro no CAR", "Meu computador não liga", "Sem internet no setor", "O SIGPAS travou"];
const ERRO_PADRAO = "Não consegui processar agora. Tente de novo em instantes ou use “Novo Chamado Manual”.";

async function postJson<T>(url: string, corpo: unknown): Promise<{ status: number; dados: T & { erro?: string } }> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
  const dados = (await res.json().catch(() => ({}))) as T & { erro?: string };
  return { status: res.status, dados };
}

function formatarDataHora(ts: number) {
  return new Date(ts).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function Balao({ autor, children }: { autor: "usuario" | "bot"; children: ReactNode }) {
  if (autor === "usuario") {
    return (
      <div className="chat-msg ml-auto flex max-w-3xl items-start justify-end gap-3">
        <div className="rounded-2xl rounded-tr-none bg-brand-primary p-3 text-white shadow-sm sm:p-4">{children}</div>
        <div className="hidden size-10 shrink-0 items-center justify-center rounded-full bg-gray-300 text-gray-600 shadow-md sm:flex">
          <User className="size-5" aria-hidden />
        </div>
      </div>
    );
  }
  return (
    <div className="chat-msg flex max-w-3xl items-start gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white shadow-md sm:size-10">
        <Bot className="size-4 sm:size-5" aria-hidden />
      </div>
      <div className="min-w-0 rounded-2xl rounded-tl-none border border-gray-100 bg-white p-3 text-gray-800 shadow-sm sm:p-4">{children}</div>
    </div>
  );
}

function Protocolo({ numero }: { numero: string }) {
  return <p className="mt-3 inline-block rounded bg-gray-100 p-2 font-mono text-sm">Protocolo gerado: #{numero}</p>;
}

function Fonte({ fonte }: { fonte: "ia" | "regras" }) {
  return fonte === "ia" ? (
    <p className="mt-3 flex items-center gap-1 text-xs text-gray-400"><Sparkles className="size-3" aria-hidden /> Respondido pela IA (Gemini)</p>
  ) : (
    <p className="mt-3 flex items-center gap-1 text-xs text-gray-400"><Workflow className="size-3" aria-hidden /> Respondido pelas regras automáticas</p>
  );
}

/** Texto usado quando a IA não respondeu e as regras assumiram. */
const TEXTO_REGRAS: Record<Intencao, ReactNode> = {
  pop_car: <p>Identifiquei um erro no sistema <strong>CAR</strong>. Temos um procedimento operacional padrão (POP) para isso. Deseja sincronizar a base agora?</p>,
  hardware: <p>Isso parece ser um <strong>problema de equipamento</strong>. Registrei sua solicitação para a <strong>{SETORES.GATI.sigla} ({SETORES.GATI.nome})</strong>.</p>,
  sistemas: <p>Identifiquei um problema de <strong>sistemas</strong>. Encaminhei para um analista da <strong>{SETORES.CSTI.sigla}</strong>.</p>,
  infraestrutura: <p>Isso indica uma falha de <strong>rede ou infraestrutura</strong>. O alerta foi enviado para a <strong>{SETORES.INFRA.nome}</strong>.</p>,
  desconhecido: <p>Entendi. Não há um procedimento automatizado para isso, então registrei um chamado para a <strong>triagem de nível 1</strong>, que vai repassar à equipe correta.</p>,
};

function ConteudoBot({ r, ocupado, aoSincronizar, aoChamarAnalista }: { r: RespostaBot; ocupado: boolean; aoSincronizar: () => void; aoChamarAnalista: () => void }) {
  switch (r.tipo) {
    case "saudacao":
      return (
        <>
          <p>Olá! Sou o agente de suporte inteligente do STI Atende. Como posso ajudar você hoje?</p>
          <p className="mt-2 text-sm text-gray-500">Descreva seu problema ou peça a abertura de um chamado.</p>
        </>
      );
    case "erro":
      return <p className="text-red-700">{r.texto}</p>;
    case "sync_ok":
      return <p>Sincronização do CAR iniciada com sucesso. Em alguns minutos os dados devem aparecer atualizados.</p>;
    case "sync_bloqueada":
      return (
        <p>
          A sincronização já foi feita nas últimas 24 horas. A próxima fica liberada em <strong>{formatarDataHora(r.liberaEm)}</strong>. Se o
          erro continuar, posso encaminhar para um analista da CSTI.
        </p>
      );
    case "encaminhado_analista":
      return (
        <>
          <p>Pronto. Encaminhei seu caso para um analista da <strong>CSTI</strong>.</p>
          <Protocolo numero={r.protocolo} />
        </>
      );
    case "analise":
      return (
        <>
          {r.texto ? <p className="whitespace-pre-line">{r.texto}</p> : TEXTO_REGRAS[r.intencao]}

          {r.intencao === "pop_car" && (
            <>
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                <TriangleExclamationPoint className="mt-0.5 size-4 shrink-0" aria-hidden />
                <div>
                  <strong>Atenção ao SLA:</strong> a sincronização só é permitida 1 vez a cada 24 horas para evitar sobrecarga no banco
                  Oracle da SEMA.
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button disabled={ocupado} onClick={aoSincronizar} className="flex items-center justify-center gap-2 rounded bg-blue-600 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50">
                  <RefreshCw className="size-4" aria-hidden /> Sincronizar CAR
                </button>
                <button disabled={ocupado} onClick={aoChamarAnalista} className="rounded bg-gray-200 px-4 py-2 font-medium text-gray-800 transition hover:bg-gray-300 disabled:opacity-50">
                  Falar com analista (CSTI)
                </button>
              </div>
            </>
          )}

          {r.intencao === "infraestrutura" && (
            <p className="mt-2 text-sm">Prioridade de SLA: <strong className="text-red-700">Urgente</strong>.</p>
          )}
          {r.protocolo && <Protocolo numero={r.protocolo} />}
          {r.protocolo && <p className="mt-2 text-sm text-gray-500">Acompanhe em “Consultar Chamados”.</p>}
          <Fonte fonte={r.fonte} />
        </>
      );
  }
}

export function Chat() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([{ id: 0, autor: "bot", resposta: { tipo: "saudacao" } }]);
  const [texto, setTexto] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const proximoId = useRef(1);
  const ultimaMensagemCar = useRef("");
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensagens.length, ocupado]);

  const responder = (resposta: RespostaBot) => setMensagens((m) => [...m, { id: proximoId.current++, autor: "bot", resposta }]);

  async function executar(acao: () => Promise<RespostaBot>) {
    setOcupado(true);
    try {
      responder(await acao());
    } catch {
      responder({ tipo: "erro", texto: ERRO_PADRAO });
    } finally {
      setOcupado(false);
    }
  }

  function enviar(mensagem: string) {
    const limpo = mensagem.trim();
    if (!limpo || ocupado) return;
    setMensagens((m) => [...m, { id: proximoId.current++, autor: "usuario", texto: limpo }]);
    setTexto("");
    executar(async () => {
      const { status, dados } = await postJson<RespostaChat>("/api/chat", { mensagem: limpo });
      if (status !== 200) return { tipo: "erro", texto: dados.erro ?? ERRO_PADRAO };
      if (dados.intencao === "pop_car") ultimaMensagemCar.current = limpo;
      return { tipo: "analise", intencao: dados.intencao as Intencao, texto: dados.resposta, protocolo: dados.protocolo, fonte: dados.fonte };
    });
  }

  function sincronizarCar() {
    executar(async () => {
      const { status, dados } = await postJson<{ ok?: boolean; liberaEm?: string }>("/api/car/sync", {});
      if (status === 200) return { tipo: "sync_ok" };
      if (status === 429 && dados.liberaEm) return { tipo: "sync_bloqueada", liberaEm: Date.parse(dados.liberaEm) };
      return { tipo: "erro", texto: dados.erro ?? ERRO_PADRAO };
    });
  }

  function chamarAnalista() {
    executar(async () => {
      const relato = ultimaMensagemCar.current || "Erro no CAR";
      const { status, dados } = await postJson<{ protocolo?: string }>("/api/chamados", {
        assunto: "Erro no CAR: atendimento com analista",
        descricao: `Pedido feito pelo Assistente IA. Relato do usuário: ${relato}`,
        categoria: "CSTI",
      });
      if (status === 201 && dados.protocolo) return { tipo: "encaminhado_analista", protocolo: dados.protocolo };
      return { tipo: "erro", texto: dados.erro ?? ERRO_PADRAO };
    });
  }

  function aoEnviar(e: FormEvent) {
    e.preventDefault();
    enviar(texto);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white p-4 shadow-sm">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-lg font-bold text-gray-800">
            <Bot className="size-5 text-brand-primary" aria-hidden /> Analista de Suporte IA
          </h1>
          <p className="truncate text-xs text-gray-500">Raciocínio aprimorado e atendimento humanizado</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="relative flex size-3">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex size-3 rounded-full bg-green-500" />
          </span>
          <span className="text-sm font-medium text-gray-600">Online</span>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4 sm:p-6" aria-live="polite" aria-label="Conversa">
        {mensagens.map((m) =>
          m.autor === "usuario" ? (
            <Balao key={m.id} autor="usuario">
              <p className="break-words">{m.texto}</p>
            </Balao>
          ) : (
            <Balao key={m.id} autor="bot">
              <ConteudoBot r={m.resposta} ocupado={ocupado} aoSincronizar={sincronizarCar} aoChamarAnalista={chamarAnalista} />
            </Balao>
          ),
        )}

        {mensagens.length === 1 && (
          <div className="flex flex-wrap gap-2 sm:pl-13">
            {SUGESTOES.map((s) => (
              <button
                key={s}
                onClick={() => enviar(s)}
                className="rounded-full border border-brand-primary/30 bg-white px-3 py-1.5 text-sm text-brand-primary transition hover:bg-brand-light"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {ocupado && (
          <Balao autor="bot">
            <span className="flex gap-1" aria-label="O assistente está digitando">
              <span className="size-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
              <span className="size-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
              <span className="size-2 animate-bounce rounded-full bg-gray-400" />
            </span>
          </Balao>
        )}
        <div ref={fimRef} />
      </div>

      <div className="border-t border-gray-200 bg-white p-3 sm:p-4">
        <form onSubmit={aoEnviar} className="mx-auto flex max-w-4xl items-center gap-2 sm:gap-3">
          <button type="button" disabled title="Anexos em breve" aria-label="Anexar arquivo (em breve)" className="p-2 text-gray-300">
            <Paperclip className="size-5" aria-hidden />
          </button>
          <label htmlFor="mensagem" className="sr-only">Descreva seu problema</label>
          <input
            id="mensagem"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            autoComplete="off"
            maxLength={1000}
            placeholder="Ex.: “Erro no CAR”, “Meu computador não liga”..."
            className="min-w-0 flex-1 rounded-full border border-transparent bg-gray-100 px-4 py-3 focus:border-brand-primary focus:bg-white focus:outline-none sm:px-6"
          />
          <button
            type="submit"
            disabled={!texto.trim() || ocupado}
            aria-label="Enviar mensagem"
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white shadow-md transition hover:bg-brand-accent disabled:opacity-50"
          >
            <Send className="size-5" aria-hidden />
          </button>
        </form>
        <p className="mt-2 text-center text-xs text-gray-400">
          A IA pode cometer erros. Em casos complexos, o chamado é roteado para GATI, CSTI ou Infra.
        </p>
      </div>
    </div>
  );
}
