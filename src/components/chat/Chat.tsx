"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bot, Paperclip, RefreshCw, Send, TriangleExclamationPoint, User } from "lucide-react";
import { classificar, type Classificacao } from "@/lib/roteamento";
import { SETORES } from "@/lib/setores";

/**
 * Sprint 2: respostas montadas no navegador a partir das regras de roteamento.
 * Sprint 3: o envio passa a chamar a API da IA; estes tipos de resposta continuam valendo.
 */

type RespostaBot =
  | { tipo: "saudacao" }
  | { tipo: "classificacao"; classificacao: Classificacao; protocolo: string }
  | { tipo: "sync_ok" }
  | { tipo: "sync_bloqueada"; liberaEm: number }
  | { tipo: "encaminhado_analista"; protocolo: string };

type Mensagem =
  | { id: number; autor: "usuario"; texto: string }
  | { id: number; autor: "bot"; resposta: RespostaBot };

const SUGESTOES = ["Erro no CAR", "Meu computador não liga", "Sem internet no setor", "O SIGPAS travou"];
const CHAVE_SYNC_CAR = "sti-atende:ultima-sync-car";
const JANELA_SYNC_MS = 24 * 60 * 60 * 1000;
const ATRASO_RESPOSTA_MS = 800;

// Limite local de 24h (demonstração). Na Sprint 3 o servidor passa a ser a fonte da verdade.
function lerUltimaSync(): number | null {
  try {
    const v = localStorage.getItem(CHAVE_SYNC_CAR);
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}
function gravarUltimaSync(ts: number) {
  try {
    localStorage.setItem(CHAVE_SYNC_CAR, String(ts));
  } catch {
    /* navegador sem armazenamento: segue sem bloquear */
  }
}

/** Aplica a regra de SLA do CAR: no máximo 1 sincronização a cada 24h. */
function tentarSincronizarCar(): RespostaBot {
  const agora = Date.now();
  const ultima = lerUltimaSync();
  if (ultima && agora - ultima < JANELA_SYNC_MS) {
    return { tipo: "sync_bloqueada", liberaEm: ultima + JANELA_SYNC_MS };
  }
  gravarUltimaSync(agora);
  return { tipo: "sync_ok" };
}

function formatarDataHora(ts: number) {
  return new Date(ts).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function Balao({ autor, children }: { autor: "usuario" | "bot"; children: React.ReactNode }) {
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

function ConteudoBot({
  r,
  aoSincronizar,
  aoChamarAnalista,
}: {
  r: RespostaBot;
  aoSincronizar: () => void;
  aoChamarAnalista: () => void;
}) {
  switch (r.tipo) {
    case "saudacao":
      return (
        <>
          <p>Olá! Sou o agente de suporte inteligente do STI Atende. Como posso ajudar você hoje?</p>
          <p className="mt-2 text-sm text-gray-500">Descreva seu problema ou peça a abertura de um chamado.</p>
        </>
      );
    case "sync_ok":
      return <p>Sincronização do CAR iniciada com sucesso. Em alguns minutos os dados devem aparecer atualizados.</p>;
    case "sync_bloqueada":
      return (
        <p>
          A sincronização já foi feita nas últimas 24 horas. A próxima fica liberada em{" "}
          <strong>{formatarDataHora(r.liberaEm)}</strong>. Se o erro continuar, posso encaminhar para um analista da CSTI.
        </p>
      );
    case "encaminhado_analista":
      return (
        <>
          <p>Pronto. Encaminhei seu caso para um analista da <strong>CSTI</strong>, com o histórico desta conversa.</p>
          <Protocolo numero={r.protocolo} />
        </>
      );
    case "classificacao": {
      const { intencao } = r.classificacao;
      if (intencao === "pop_car") {
        return (
          <>
            <p>Identifiquei um erro no sistema <strong>CAR</strong>. Temos um procedimento operacional padrão (POP) para isso.</p>
            <p className="mt-2">Deseja sincronizar a base de dados agora?</p>
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
              <TriangleExclamationPoint className="mt-0.5 size-4 shrink-0" aria-hidden />
              <div>
                <strong>Atenção ao SLA:</strong> a sincronização só é permitida 1 vez a cada 24 horas para evitar sobrecarga no
                banco Oracle da SEMA.
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button onClick={aoSincronizar} className="flex items-center justify-center gap-2 rounded bg-blue-600 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-blue-700">
                <RefreshCw className="size-4" aria-hidden /> Sincronizar CAR
              </button>
              <button onClick={aoChamarAnalista} className="rounded bg-gray-200 px-4 py-2 font-medium text-gray-800 transition hover:bg-gray-300">
                Falar com analista (CSTI)
              </button>
            </div>
          </>
        );
      }
      if (intencao === "hardware") {
        return (
          <>
            <p>Isso parece ser um <strong>problema físico ou de hardware</strong>.</p>
            <p className="mt-2">Registrei sua solicitação e direcionei para a <strong>{SETORES.GATI.sigla} ({SETORES.GATI.nome})</strong>.</p>
            <Protocolo numero={r.protocolo} />
          </>
        );
      }
      if (intencao === "sistemas") {
        return (
          <>
            <p>Identifiquei um problema de <strong>sistemas</strong>.</p>
            <p className="mt-2">Sua solicitação foi encaminhada para um analista da <strong>{SETORES.CSTI.sigla}</strong>.</p>
            <Protocolo numero={r.protocolo} />
            <p className="mt-2 text-sm text-gray-500">Acompanhe o status em “Consultar Chamados”.</p>
          </>
        );
      }
      if (intencao === "infraestrutura") {
        return (
          <>
            <p>Isso indica uma falha de <strong>rede ou infraestrutura</strong>.</p>
            <p className="mt-2">
              O alerta foi enviado para a <strong>{SETORES.INFRA.nome}</strong>. Por ser crítico, a prioridade de SLA foi ajustada para{" "}
              <strong className="text-red-700">Urgente</strong>.
            </p>
            <Protocolo numero={r.protocolo} />
          </>
        );
      }
      return (
        <>
          <p>
            Entendi. Não há um procedimento automatizado (POP) exato para isso, então registrei um chamado e enviei para a{" "}
            <strong>triagem de nível 1</strong>.
          </p>
          <p className="mt-2">Um analista vai revisar o caso e repassar à equipe correta: GATI, CSTI ou Infraestrutura.</p>
          <Protocolo numero={r.protocolo} />
        </>
      );
    }
  }
}

export function Chat() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([{ id: 0, autor: "bot", resposta: { tipo: "saudacao" } }]);
  const [texto, setTexto] = useState("");
  const [pensando, setPensando] = useState(false);
  const proximoId = useRef(1);
  const proximoProtocolo = useRef(493);
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensagens.length, pensando]);

  const novoId = () => proximoId.current++;
  const novoProtocolo = () => `INC-${String(proximoProtocolo.current++).padStart(4, "0")}`;
  const responder = (resposta: RespostaBot) => setMensagens((m) => [...m, { id: novoId(), autor: "bot", resposta }]);

  function enviar(mensagem: string) {
    const limpo = mensagem.trim();
    if (!limpo || pensando) return;
    setMensagens((m) => [...m, { id: novoId(), autor: "usuario", texto: limpo }]);
    setTexto("");
    setPensando(true);
    setTimeout(() => {
      const classificacao = classificar(limpo);
      responder({ tipo: "classificacao", classificacao, protocolo: novoProtocolo() });
      setPensando(false);
    }, ATRASO_RESPOSTA_MS);
  }

  function aoEnviar(e: FormEvent) {
    e.preventDefault();
    enviar(texto);
  }

  function sincronizarCar() {
    responder(tentarSincronizarCar());
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
              <ConteudoBot
                r={m.resposta}
                aoSincronizar={sincronizarCar}
                aoChamarAnalista={() => responder({ tipo: "encaminhado_analista", protocolo: novoProtocolo() })}
              />
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

        {pensando && (
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
          <button type="button" disabled title="Anexos chegam na Sprint 3" aria-label="Anexar arquivo (em breve)" className="p-2 text-gray-300">
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
            disabled={!texto.trim() || pensando}
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
