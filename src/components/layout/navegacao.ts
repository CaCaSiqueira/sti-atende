import { Bot, ChartPie, CirclePlus, Search, Settings, type LucideIcon } from "lucide-react";
import type { Perfil } from "@/lib/perfil";

export interface ItemNavegacao {
  href: string;
  rotulo: string;
  /** Rótulo alternativo para quem não é da STI (usuário externo ou interno). */
  rotuloUsuario?: string;
  icone: LucideIcon;
  destaque?: boolean;
  /** Perfis que veem o item; ausente = todos. */
  perfis?: Perfil[];
}

export const NAV_PRINCIPAL: ItemNavegacao[] = [
  { href: "/assistente", rotulo: "Assistente IA", icone: Bot, destaque: true },
  { href: "/visao-geral", rotulo: "Visão Geral", icone: ChartPie, perfis: ["sti"] },
  { href: "/chamados", rotulo: "Consultar Chamados", rotuloUsuario: "Meus Chamados", icone: Search },
  { href: "/chamados/novo", rotulo: "Novo Chamado Manual", icone: CirclePlus },
];

export const NAV_ADMIN: ItemNavegacao[] = [
  { href: "/configuracoes", rotulo: "Configurações", icone: Settings, perfis: ["sti"] },
];

/**
 * Filtra pelo perfil. `perfil` null = sem login configurado (dev local): mostra tudo.
 * `undefined` = ainda carregando: mostra só os itens comuns, para não piscar itens restritos.
 */
export function itensVisiveis(itens: ItemNavegacao[], perfil: Perfil | null | undefined): ItemNavegacao[] {
  if (perfil === null) return itens;
  return itens.filter((i) => !i.perfis || (perfil !== undefined && i.perfis.includes(perfil)));
}

/** Rótulo do item para o perfil: "Meus Chamados" para usuários, "Consultar Chamados" para a STI. */
export function rotuloPara(item: ItemNavegacao, perfil: Perfil | null | undefined): string {
  return perfil && perfil !== "sti" && item.rotuloUsuario ? item.rotuloUsuario : item.rotulo;
}

/** "/chamados" não deve ficar ativo quando a rota é "/chamados/novo". */
export function estaAtivo(pathname: string, href: string, todos: ItemNavegacao[]): boolean {
  if (pathname === href) return true;
  if (!pathname.startsWith(`${href}/`)) return false;
  return !todos.some((i) => i.href !== href && i.href.startsWith(href) && pathname.startsWith(i.href));
}
