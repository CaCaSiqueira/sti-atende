"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState, type Dispatch, type DragEvent, type SetStateAction } from "react";
import { ImagePlus, X } from "lucide-react";
import { formatarTamanho } from "@/lib/imagem";
import { prepararImagem } from "@/lib/imagem-navegador";

interface Props {
  id: string;
  arquivos: File[];
  aoMudar: Dispatch<SetStateAction<File[]>>;
  /** Quantos prints ainda cabem neste chamado. */
  max: number;
  desabilitado?: boolean;
}

/**
 * Prints do erro: escolher arquivo, arrastar ou colar (Ctrl+V em qualquer lugar da página).
 * Imagens grandes são reduzidas aqui mesmo, antes do envio.
 */
export function SeletorPrints({ id, arquivos, aoMudar, max, desabilitado }: Props) {
  const [erro, setErro] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const [preparando, setPreparando] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);
  const cheio = arquivos.length >= max;
  const bloqueado = desabilitado || preparando || cheio;

  const previas = useMemo(() => arquivos.map((a) => URL.createObjectURL(a)), [arquivos]);
  useEffect(() => () => previas.forEach((url) => URL.revokeObjectURL(url)), [previas]);

  async function adicionar(lista: File[]) {
    if (lista.length === 0 || bloqueado) return;
    setErro(null);
    setPreparando(true);
    const erros: string[] = [];
    const prontos: File[] = [];
    for (const arquivo of lista) {
      try {
        prontos.push(await prepararImagem(arquivo));
      } catch (e) {
        erros.push(e instanceof Error ? e.message : `Não foi possível usar "${arquivo.name}".`);
      }
    }
    if (prontos.length > max - arquivos.length) erros.push(`Cabem no máximo ${max} ${max === 1 ? "print" : "prints"}.`);
    aoMudar((atuais) => [...atuais, ...prontos].slice(0, max));
    setErro(erros.length ? erros.join(" ") : null);
    setPreparando(false);
  }

  // O ouvinte de "colar" fica na janela inteira e sempre usa o estado atual.
  const aoColarImagens = useEffectEvent((imagens: File[]) => adicionar(imagens));
  useEffect(() => {
    function aoColar(e: ClipboardEvent) {
      const imagens = [...(e.clipboardData?.files ?? [])].filter((f) => f.type.startsWith("image/"));
      if (imagens.length === 0) return; // texto colado segue normal
      e.preventDefault();
      aoColarImagens(imagens);
    }
    window.addEventListener("paste", aoColar);
    return () => window.removeEventListener("paste", aoColar);
  }, []);

  function aoSoltar(e: DragEvent) {
    e.preventDefault();
    setArrastando(false);
    adicionar([...e.dataTransfer.files]);
  }

  function remover(indice: number) {
    aoMudar((atuais) => atuais.filter((_, i) => i !== indice));
    setErro(null);
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!bloqueado) setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={aoSoltar}
        className={`rounded-lg border-2 border-dashed p-4 text-center text-sm transition ${
          arrastando ? "border-brand-primary bg-brand-light" : "border-gray-300 bg-gray-50"
        } ${cheio ? "opacity-60" : ""}`}
      >
        <ImagePlus className="mx-auto mb-2 size-6 text-gray-400" aria-hidden />
        {cheio ? (
          <p className="text-gray-600">Limite de {max} {max === 1 ? "print" : "prints"} atingido.</p>
        ) : (
          <p className="text-gray-600">
            Arraste a imagem, cole com <kbd className="rounded border border-gray-300 bg-white px-1 font-sans text-xs">Ctrl+V</kbd> ou{" "}
            <button
              type="button"
              onClick={() => entrada.current?.click()}
              disabled={bloqueado}
              className="font-semibold text-brand-primary underline-offset-2 hover:underline disabled:opacity-60"
            >
              escolha um arquivo
            </button>
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">PNG, JPG ou WebP · até {max} {max === 1 ? "imagem" : "imagens"}</p>
        {preparando && <p className="mt-2 text-xs text-gray-500" role="status">Preparando imagem...</p>}
        <input
          ref={entrada}
          id={id}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            adicionar([...(e.target.files ?? [])]);
            e.target.value = ""; // permite escolher o mesmo arquivo de novo
          }}
        />
      </div>

      {erro && <p role="alert" className="mt-2 text-sm text-red-600">{erro}</p>}

      {arquivos.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {arquivos.map((arquivo, i) => (
            <li key={previas[i]} className="relative overflow-hidden rounded-lg border border-gray-200 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element -- prévia local (blob:), o otimizador não se aplica */}
              <img src={previas[i]} alt={`Prévia do print ${i + 1}`} className="aspect-video w-full object-cover" />
              <p className="truncate px-2 py-1 text-xs text-gray-500">{formatarTamanho(arquivo.size)}</p>
              <button
                type="button"
                onClick={() => remover(i)}
                disabled={desabilitado}
                aria-label={`Remover print ${i + 1}`}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white transition hover:bg-black/80"
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
