import { TAMANHO_MAX_ANEXO, TIPOS_IMAGEM, type TipoImagem } from "./imagem";

/** Prints até este tamanho vão como estão; acima, são reduzidos no navegador. */
const LIMITE_SEM_REDUZIR = 1.5 * 1024 * 1024;
/** Lado maior depois de reduzir: ainda dá para ler o texto da mensagem de erro. */
const LADO_MAX = 2560;

const gerar = (canvas: HTMLCanvasElement, tipo: string, qualidade: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, tipo, qualidade));

/**
 * Prepara o print para envio: confere o tipo e reduz imagens grandes (WebP, ou JPEG onde o navegador não gera WebP).
 * Assim o envio fica abaixo do limite de 4 MB e economiza o armazenamento gratuito.
 */
export async function prepararImagem(arquivo: File): Promise<File> {
  if (!TIPOS_IMAGEM.includes(arquivo.type as TipoImagem)) throw new Error(`"${arquivo.name}" não é PNG, JPG ou WebP.`);
  if (arquivo.size <= LIMITE_SEM_REDUZIR) return arquivo;

  const bitmap = await createImageBitmap(arquivo);
  const escala = Math.min(1, LADO_MAX / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  const contexto = canvas.getContext("2d");
  if (!contexto) throw new Error("Não foi possível preparar a imagem neste navegador.");
  contexto.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const webp = await gerar(canvas, "image/webp", 0.85);
  const reduzida = webp?.type === "image/webp" ? webp : await gerar(canvas, "image/jpeg", 0.85);
  if (!reduzida || reduzida.size > TAMANHO_MAX_ANEXO) throw new Error(`"${arquivo.name}" é grande demais, mesmo reduzida.`);
  const extensao = reduzida.type === "image/webp" ? "webp" : "jpg";
  return new File([reduzida], `${arquivo.name.replace(/\.[^.]+$/, "")}.${extensao}`, { type: reduzida.type });
}
