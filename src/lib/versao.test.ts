import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const raiz = new URL("../../", import.meta.url);
const ler = (arquivo: string) => readFileSync(new URL(arquivo, raiz), "utf8");
const versao: string = JSON.parse(ler("package.json")).version;

test("versão do package.json segue o SemVer", () => {
  assert.match(versao, /^\d+\.\d+\.\d+$/);
});

test("CHANGELOG tem uma entrada para a versão atual", () => {
  const titulo = `## [${versao}] - `;
  assert.ok(ler("CHANGELOG.md").split(/\r?\n/).some((linha) => linha.startsWith(titulo)), `falta "${titulo}AAAA-MM-DD" no CHANGELOG.md`);
});

test("package-lock.json está na mesma versão do package.json", () => {
  const trava = JSON.parse(ler("package-lock.json"));
  assert.equal(trava.version, versao);
  assert.equal(trava.packages[""].version, versao);
});
