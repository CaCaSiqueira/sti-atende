"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Leaf, LogOut, Menu, User, X } from "lucide-react";
import type { Perfil, Usuario } from "@/lib/perfil";
import { NAV_ADMIN, NAV_PRINCIPAL, estaAtivo, itensVisiveis, type ItemNavegacao } from "./navegacao";

const TODOS = [...NAV_PRINCIPAL, ...NAV_ADMIN];

function LinkNav({ item, ativo, perfil, aoClicar }: { item: ItemNavegacao; ativo: boolean; perfil?: Perfil | null; aoClicar: () => void }) {
  const Icone = item.icone;
  const base = "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition";
  const estilo = ativo
    ? "bg-brand-primary text-white shadow-lg"
    : item.destaque
      ? "text-white ring-1 ring-brand-primary/60 hover:bg-gray-800"
      : "text-gray-300 hover:bg-gray-800 hover:text-white";
  return (
    <Link href={item.href} onClick={aoClicar} aria-current={ativo ? "page" : undefined} className={`${base} ${estilo}`}>
      <Icone className="size-5 shrink-0" aria-hidden />
      <span>{perfil === "externo" && item.rotuloExterno ? item.rotuloExterno : item.rotulo}</span>
    </Link>
  );
}

function Marca({ versao }: { versao: string }) {
  return (
    <div className="flex items-center gap-3">
      <Leaf className="size-7 text-green-400" aria-hidden />
      <div>
        <p className="text-lg font-bold uppercase tracking-wider">STI Atende</p>
        <p className="text-xs text-gray-400">
          SEMA-MT · <span title="Versão do sistema">v{versao}</span>
        </p>
      </div>
    </div>
  );
}

/** undefined = carregando; null = sem login configurado (dev local). */
type EstadoUsuario = Usuario | null | undefined;

function ConteudoSidebar({ pathname, usuario, aoNavegar }: { pathname: string; usuario: EstadoUsuario; aoNavegar: () => void }) {
  const router = useRouter();
  async function sair() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.replace("/login");
    router.refresh(); // descarta páginas em cache da sessão anterior
  }
  const perfil = usuario === undefined ? undefined : (usuario?.perfil ?? null);
  const principal = itensVisiveis(NAV_PRINCIPAL, perfil);
  const admin = itensVisiveis(NAV_ADMIN, perfil);
  return (
    <>
      <nav aria-label="Navegação principal" className="flex-1 space-y-2 overflow-y-auto p-4">
        {principal.map((item) => (
          <LinkNav key={item.href} item={item} perfil={perfil} ativo={estaAtivo(pathname, item.href, TODOS)} aoClicar={aoNavegar} />
        ))}
        {admin.length > 0 && (
          <div className="mt-6 border-t border-gray-700 pt-6">
            <p className="mb-2 px-4 text-xs uppercase tracking-wider text-gray-500">Administração</p>
            <div className="space-y-2">
              {admin.map((item) => (
                <LinkNav key={item.href} item={item} perfil={perfil} ativo={estaAtivo(pathname, item.href, TODOS)} aoClicar={aoNavegar} />
              ))}
            </div>
          </div>
        )}
      </nav>
      <div className="flex items-center gap-3 border-t border-gray-700 p-4 text-sm">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-600">
          <User className="size-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{usuario ? usuario.nome : usuario === null ? "Modo local" : "..."}</p>
          <p className="text-xs text-gray-400">
            {usuario ? (usuario.perfil === "interno" ? "Equipe de TI (interno)" : "Usuário externo") : usuario === null ? "Sem login configurado" : ""}
          </p>
        </div>
        {usuario && (
          <button onClick={sair} aria-label="Sair" title="Sair" className="rounded-lg p-2 text-gray-300 hover:bg-gray-800 hover:text-white">
            <LogOut className="size-4" aria-hidden />
          </button>
        )}
      </div>
    </>
  );
}

export function AppShell({ children, versao }: { children: ReactNode; versao: string }) {
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);
  const [usuario, setUsuario] = useState<EstadoUsuario>(undefined);
  const fechar = () => setMenuAberto(false);

  useEffect(() => {
    let ativo = true;
    fetch("/api/eu", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { usuario: null }))
      .then((d: { usuario: Usuario | null }) => ativo && setUsuario(d.usuario))
      .catch(() => ativo && setUsuario(null));
    return () => {
      ativo = false;
    };
  }, []);

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Desktop: barra lateral fixa */}
      <aside className="hidden w-64 shrink-0 flex-col bg-brand-dark text-white shadow-xl md:flex">
        <div className="border-b border-gray-700 p-6">
          <Marca versao={versao} />
        </div>
        <ConteudoSidebar pathname={pathname} usuario={usuario} aoNavegar={fechar} />
      </aside>

      {/* Celular: gaveta sobreposta */}
      {menuAberto && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button aria-label="Fechar menu" className="absolute inset-0 bg-black/50" onClick={fechar} />
          <aside className="relative flex h-full w-72 max-w-[85%] flex-col bg-brand-dark text-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-700 p-4">
              <Marca versao={versao} />
              <button onClick={fechar} aria-label="Fechar menu" className="rounded-lg p-2 hover:bg-gray-800">
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <ConteudoSidebar pathname={pathname} usuario={usuario} aoNavegar={fechar} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between bg-brand-dark px-4 py-3 text-white md:hidden">
          <Marca versao={versao} />
          <button
            onClick={() => setMenuAberto(true)}
            aria-label="Abrir menu"
            aria-expanded={menuAberto}
            className="rounded-lg p-2 hover:bg-gray-800"
          >
            <Menu className="size-6" aria-hidden />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
