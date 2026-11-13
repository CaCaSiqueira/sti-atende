"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Building2, UserRound } from "lucide-react";

/** Contas de demonstração para a avaliação (permissões limitadas, dados fictícios). */
const DEMOS = [
  {
    rotulo: "Usuário externo",
    descricao: "Abre chamados e acompanha os seus",
    email: "externo@example.com",
    senha: "Demo-STI-2026",
    icone: UserRound,
  },
  {
    rotulo: "Equipe interna (TI)",
    descricao: "Vê todos os chamados, indicadores e saúde",
    email: "interno@example.com",
    senha: "Demo-STI-2026",
    icone: Building2,
  },
];

/** Só aceita caminhos internos, para não virar redirecionamento aberto. */
function destinoSeguro(voltar: string | null): string {
  return voltar && voltar.startsWith("/") && !voltar.startsWith("//") ? voltar : "/assistente";
}

export function FormLogin() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  async function entrar(emailLogin: string, senhaLogin: string) {
    setErro(null);
    setEntrando(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailLogin, senha: senhaLogin }),
      });
      if (!res.ok) {
        const dados = await res.json().catch(() => ({}));
        setErro(dados.erro ?? "Não foi possível entrar.");
        return;
      }
      // Navegação completa: o servidor passa a ver o cookie de sessão.
      window.location.assign(destinoSeguro(params.get("voltar")));
    } catch {
      setErro("Sem conexão com o servidor.");
    } finally {
      setEntrando(false);
    }
  }

  function aoEnviar(e: FormEvent) {
    e.preventDefault();
    entrar(email, senha);
  }

  const campo = "w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-brand-primary";

  return (
    <>
      <form onSubmit={aoEnviar} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">E-mail</label>
          <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={campo} />
        </div>
        <div>
          <label htmlFor="senha" className="mb-1 block text-sm font-medium text-gray-700">Senha</label>
          <input id="senha" type="password" autoComplete="current-password" required minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)} className={campo} />
        </div>
        {erro && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{erro}</p>}
        <button type="submit" disabled={entrando} className="w-full rounded-lg bg-brand-primary px-4 py-2.5 font-medium text-white transition hover:bg-brand-accent disabled:opacity-60">
          {entrando ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <div className="mt-6 border-t border-gray-200 pt-6">
        <p className="mb-3 text-sm font-semibold text-gray-700">Acesso de demonstração (avaliação)</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {DEMOS.map((d) => {
            const Icone = d.icone;
            return (
              <button
                key={d.email}
                type="button"
                disabled={entrando}
                onClick={() => entrar(d.email, d.senha)}
                className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 text-left transition hover:border-brand-primary hover:bg-brand-light disabled:opacity-60"
              >
                <Icone className="mt-0.5 size-5 shrink-0 text-brand-primary" aria-hidden />
                <span>
                  <span className="block text-sm font-semibold text-gray-800">{d.rotulo}</span>
                  <span className="block text-xs text-gray-500">{d.descricao}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
