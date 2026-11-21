import { test } from "node:test";
import assert from "node:assert/strict";
import { detectarTipoImagem, formatarTamanho } from "./imagem.ts";

const bytes = (...partes: (number[] | string)[]) =>
  new Uint8Array(partes.flatMap((p) => (typeof p === "string" ? [...p].map((c) => c.charCodeAt(0)) : p)));

test("reconhece PNG, JPEG e WebP pela assinatura", () => {
  assert.equal(detectarTipoImagem(bytes([0x89], "PNG", [0x0d, 0x0a, 0x1a, 0x0a, 0, 0])), "image/png");
  assert.equal(detectarTipoImagem(bytes([0xff, 0xd8, 0xff, 0xe0, 0, 0x10])), "image/jpeg");
  assert.equal(detectarTipoImagem(bytes("RIFF", [0x24, 0, 0, 0], "WEBPVP8 ")), "image/webp");
});

test("recusa SVG, HTML, PDF e arquivos curtos, mesmo com nome de imagem", () => {
  assert.equal(detectarTipoImagem(bytes('<svg xmlns="http://www.w3.org/2000/svg">')), null);
  assert.equal(detectarTipoImagem(bytes("<!doctype html><script>")), null);
  assert.equal(detectarTipoImagem(bytes("%PDF-1.7")), null);
  assert.equal(detectarTipoImagem(bytes("RIFF", [0, 0, 0, 0], "WAVE")), null);
  assert.equal(detectarTipoImagem(bytes([0x89], "PN")), null);
  assert.equal(detectarTipoImagem(new Uint8Array()), null);
});

test("formata o tamanho em português", () => {
  assert.equal(formatarTamanho(512), "512 B");
  assert.equal(formatarTamanho(200 * 1024), "200 KB");
  assert.equal(formatarTamanho(1.5 * 1024 * 1024), "1,5 MB");
});
