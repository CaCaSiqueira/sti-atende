import { Bot, ChartPie, CirclePlus, Search, Settings, type LucideIcon } from "lucide-react";
import type { Perfil } from "@/lib/perfil";

export interface ItemNavegacao {
  href: string;
  rotulo: string;
  /** Rótulo alternativo para o perfil externo. */
  rotuloExterno?: string;
  icone: LucideIcon;
  destaque?: boolean;
  /** Perfis que veem o item; ausente = todos. */
  perfis?: Perfil[];
}

export const NAV_PRINCIPAL: ItemNavegacao[] = [
  { href: "/assistente", rotulo: "Assistente IA", icone: Bot, destaque: true },
  { href: "/visao-geral", rotulo: "Visão Geral", icone: ChartPie, perfis: ["interno"] },
  { href: "/chamados", rotulo: "Consultar Chamados", rotuloExterno: "Meus Chamados", icone: Search },
  { href: "/chamados/novo", rotulo: "Novo Chamado Manual", icone: CirclePlus },
];

export const NAV_ADMIN: ItemNavegacao[] = [
  { href: "/configuracoes", rotulo: "Configurações", icone: Settings, perfis: ["interno"] },
];

/**
 * Filtra pelo perfil. `perfil` null = sem login configurado (dev local): mostra tudo.
 * `undefined` = ainda carregando: mostra só os itens comuns, para não piscar itens restritos.
 */
export function itensVisiveis(itens: ItemNavegacao[], perfil: Perfil | null | undefined): ItemNavegacao[] {
  if (perfil === null) return itens;
  return itens.filter((i) => !i.perfis || (perfil !== undefined && i.perfis.includes(perfil)));
}

/** "/chamados" não deve ficar ativo quando a rota é "/chamados/novo". */
export function estaAtivo(pathname: string, href: string, todos: ItemNavegacao[]): boolean {
  if (pathname === href) return true;
  if (!pathname.startsWith(`${href}/`)) return false;
  return !todos.some((i) => i.href !== href && i.href.startsWith(href) && pathname.startsWith(i.href));
}
