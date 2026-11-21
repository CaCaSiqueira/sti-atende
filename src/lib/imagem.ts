/** Regras dos prints do erro. Sem dependências: usado no navegador, no servidor e nos testes. */

export type TipoImagem = "image/png" | "image/jpeg" | "image/webp";

export const TIPOS_IMAGEM: TipoImagem[] = ["image/png", "image/jpeg", "image/webp"];

/** 4 MB: abaixo do limite de 4,5 MB por requisição das funções da Vercel. */
export const TAMANHO_MAX_ANEXO = 4 * 1024 * 1024;

export const EXTENSAO: Record<TipoImagem, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

const texto = (b: Uint8Array, inicio: number, fim: number) => String.fromCharCode(...b.subarray(inicio, fim));

/**
 * Identifica a imagem pelos primeiros bytes (assinatura do arquivo),
 * sem confiar na extensão nem no tipo informado pelo navegador. SVG e outros formatos são recusados.
 */
export function detectarTipoImagem(b: Uint8Array): TipoImagem | null {
  if (b.length >= 8 && b[0] === 0x89 && texto(b, 1, 4) === "PNG" && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) {
    return "image/png";
  }
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 12 && texto(b, 0, 4) === "RIFF" && texto(b, 8, 12) === "WEBP") return "image/webp";
  return null;
}

export function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}
