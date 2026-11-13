import { Bot, ChartPie, CirclePlus, HeartPulse, Search, Settings, type LucideIcon } from "lucide-react";

export interface ItemNavegacao {
  href: string;
  rotulo: string;
  icone: LucideIcon;
  destaque?: boolean;
}

export const NAV_PRINCIPAL: ItemNavegacao[] = [
  { href: "/assistente", rotulo: "Assistente IA", icone: Bot, destaque: true },
  { href: "/visao-geral", rotulo: "Visão Geral", icone: ChartPie },
  { href: "/chamados", rotulo: "Consultar Chamados", icone: Search },
  { href: "/chamados/novo", rotulo: "Novo Chamado Manual", icone: CirclePlus },
];

export const NAV_ADMIN: ItemNavegacao[] = [
  { href: "/saude", rotulo: "Saúde do Sistema", icone: HeartPulse },
  { href: "/configuracoes", rotulo: "Configurações", icone: Settings },
];

/** "/chamados" não deve ficar ativo quando a rota é "/chamados/novo". */
export function estaAtivo(pathname: string, href: string, todos: ItemNavegacao[]): boolean {
  if (pathname === href) return true;
  if (!pathname.startsWith(`${href}/`)) return false;
  return !todos.some((i) => i.href !== href && i.href.startsWith(href) && pathname.startsWith(i.href));
}
