/**
 * Limite de requisições na memória desta instância.
 * Só é usado sem banco (modo demonstração) ou como reserva se o banco falhar na checagem:
 * cada instância conta sozinha e a contagem zera quando ela reinicia.
 */
const janelas = new Map<string, { inicio: number; total: number }>();

export function permitirEmMemoria(chave: string, maximo: number, janelaMs: number, agora = Date.now()): boolean {
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
