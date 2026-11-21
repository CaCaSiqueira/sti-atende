/** Envia os prints de um chamado, um por vez. Devolve as mensagens de erro (lista vazia = tudo enviado). */
export async function enviarPrints(chamadoId: string, arquivos: File[]): Promise<string[]> {
  const erros: string[] = [];
  for (const arquivo of arquivos) {
    const corpo = new FormData();
    corpo.append("arquivo", arquivo);
    try {
      const res = await fetch(`/api/chamados/${encodeURIComponent(chamadoId)}/anexos`, { method: "POST", body: corpo });
      if (!res.ok) {
        const dados = await res.json().catch(() => ({}));
        erros.push(`${arquivo.name}: ${dados.erro ?? "não foi possível enviar."}`);
      }
    } catch {
      erros.push(`${arquivo.name}: sem conexão com o servidor.`);
    }
  }
  return erros;
}
