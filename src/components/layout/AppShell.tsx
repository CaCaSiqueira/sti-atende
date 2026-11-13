"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Leaf, Menu, User, X } from "lucide-react";
import { NAV_ADMIN, NAV_PRINCIPAL, estaAtivo, type ItemNavegacao } from "./navegacao";

const TODOS = [...NAV_PRINCIPAL, ...NAV_ADMIN];

function LinkNav({ item, ativo, aoClicar }: { item: ItemNavegacao; ativo: boolean; aoClicar: () => void }) {
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
      <span>{item.rotulo}</span>
    </Link>
  );
}

function Marca() {
  return (
    <div className="flex items-center gap-3">
      <Leaf className="size-7 text-green-400" aria-hidden />
      <div>
        <p className="text-lg font-bold uppercase tracking-wider">STI Atende</p>
        <p className="text-xs text-gray-400">SEMA-MT</p>
      </div>
    </div>
  );
}

function ConteudoSidebar({ pathname, aoNavegar }: { pathname: string; aoNavegar: () => void }) {
  return (
    <>
      <nav aria-label="Navegação principal" className="flex-1 space-y-2 overflow-y-auto p-4">
        {NAV_PRINCIPAL.map((item) => (
          <LinkNav key={item.href} item={item} ativo={estaAtivo(pathname, item.href, TODOS)} aoClicar={aoNavegar} />
        ))}
        <div className="mt-6 border-t border-gray-700 pt-6">
          <p className="mb-2 px-4 text-xs uppercase tracking-wider text-gray-500">Administração</p>
          <div className="space-y-2">
            {NAV_ADMIN.map((item) => (
              <LinkNav key={item.href} item={item} ativo={estaAtivo(pathname, item.href, TODOS)} aoClicar={aoNavegar} />
            ))}
          </div>
        </div>
      </nav>
      <div className="flex items-center gap-3 border-t border-gray-700 p-4 text-sm">
        <div className="flex size-8 items-center justify-center rounded-full bg-gray-600">
          <User className="size-4" aria-hidden />
        </div>
        <div>
          <p className="font-semibold">Usuário Interno</p>
          <p className="text-xs text-gray-400">Analista SEMA</p>
        </div>
      </div>
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);
  const fechar = () => setMenuAberto(false);

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Desktop: barra lateral fixa */}
      <aside className="hidden w-64 shrink-0 flex-col bg-brand-dark text-white shadow-xl md:flex">
        <div className="border-b border-gray-700 p-6">
          <Marca />
        </div>
        <ConteudoSidebar pathname={pathname} aoNavegar={fechar} />
      </aside>

      {/* Celular: gaveta sobreposta */}
      {menuAberto && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button aria-label="Fechar menu" className="absolute inset-0 bg-black/50" onClick={fechar} />
          <aside className="relative flex h-full w-72 max-w-[85%] flex-col bg-brand-dark text-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-700 p-4">
              <Marca />
              <button onClick={fechar} aria-label="Fechar menu" className="rounded-lg p-2 hover:bg-gray-800">
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <ConteudoSidebar pathname={pathname} aoNavegar={fechar} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between bg-brand-dark px-4 py-3 text-white md:hidden">
          <Marca />
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
