import type { Prioridade, Setor } from "../types/chamado";

/**
 * Regras de roteamento nível 1 (SLA).
 * Na Sprint 2 rodam no navegador; na Sprint 3 viram o fallback da IA no servidor
 * e a referência do prompt do modelo.
 */

export type Intencao = "pop_car" | "infraestrutura" | "hardware" | "sistemas" | "desconhecido";

export interface Classificacao {
  intencao: Intencao;
  setor: Setor;
  prioridade: Prioridade;
  /** Termo que disparou a regra (útil para auditoria e testes). */
  termo: string | null;
}

interface Regra {
  intencao: Exclude<Intencao, "desconhecido">;
  setor: Setor;
  prioridade: Prioridade;
  termos: string[];
}

// A ordem importa: a primeira regra que casar vence.
// Infra vem antes de hardware para "computador sem internet" ir para Infraestrutura.
const REGRAS: Regra[] = [
  {
    intencao: "pop_car",
    setor: "CSTI",
    prioridade: "media",
    termos: ["car", "cadastro ambiental rural", "sicar"],
  },
  {
    intencao: "infraestrutura",
    setor: "INFRA",
    prioridade: "urgente",
    termos: ["internet", "rede", "wifi", "wi-fi", "vpn", "cabo de rede", "sem conexao", "conexao caiu"],
  },
  {
    intencao: "hardware",
    setor: "GATI",
    prioridade: "media",
    termos: ["computador", "pc", "notebook", "hardware", "impressora", "monitor", "teclado", "mouse", "nao liga", "tela azul"],
  },
  {
    intencao: "sistemas",
    setor: "CSTI",
    prioridade: "media",
    termos: ["sistema", "sigpas", "travou", "senha", "login", "acesso negado"],
  },
];

export const INTENCOES: Intencao[] = ["pop_car", "infraestrutura", "hardware", "sistemas", "desconhecido"];

/**
 * Setor e prioridade mínima de cada intenção. A IA interpreta a mensagem;
 * quem decide setor e prioridade é este código, seguindo o SLA.
 */
export function rotearIntencao(intencao: Intencao): Pick<Classificacao, "setor" | "prioridade"> {
  const regra = REGRAS.find((r) => r.intencao === intencao);
  return regra ? { setor: regra.setor, prioridade: regra.prioridade } : { setor: "TRIAGEM", prioridade: "baixa" };
}

/** Remove acentos e padroniza caixa: "Não Conexão" -> "nao conexao". */
export function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function escaparRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Casa só palavras inteiras: "car" casa com "erro no CAR", mas não com "carregar". */
function contemTermo(textoNormalizado: string, termo: string): boolean {
  return new RegExp(`(^|[^a-z0-9])${escaparRegex(termo)}([^a-z0-9]|$)`).test(textoNormalizado);
}

export function classificar(texto: string): Classificacao {
  const t = normalizar(texto);
  for (const regra of REGRAS) {
    const termo = regra.termos.find((x) => contemTermo(t, x));
    if (termo) return { intencao: regra.intencao, setor: regra.setor, prioridade: regra.prioridade, termo };
  }
  return { intencao: "desconhecido", setor: "TRIAGEM", prioridade: "baixa", termo: null };
}
