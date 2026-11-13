/**
 * Limite simples de requisições por janela (memória da instância).
 * Protege a cota gratuita do Gemini e o banco contra abuso; não substitui um WAF.
 */
const janelas = new Map<string, { inicio: number; total: number }>();

export function permitir(chave: string, maximo: number, janelaMs: number, agora = Date.now()): boolean {
  const j = janelas.get(chave);
  if (!j || agora - j.inicio >= janelaMs) {
    janelas.set(chave, { inicio: agora, total: 1 });
    if (janelas.size > 5000) janelas.clear(); // evita crescer sem limite
    return true;
  }
  if (j.total >= maximo) return false;
  j.total++;
  return true;
}

export function ipDaRequisicao(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}
