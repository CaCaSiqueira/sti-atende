import { test } from "node:test";
import assert from "node:assert/strict";
import { ehPublica, exigeInterno, perfilDe } from "./perfil.ts";

test("perfil só é interno quando app_metadata diz isso", () => {
  assert.equal(perfilDe({ perfil: "interno" }), "interno");
  assert.equal(perfilDe({ perfil: "admin" }), "externo");
  assert.equal(perfilDe({}), "externo");
  assert.equal(perfilDe(undefined), "externo");
});

test("Visão Geral e Configurações exigem perfil interno", () => {
  assert.equal(exigeInterno("/visao-geral"), true);
  assert.equal(exigeInterno("/configuracoes"), true);
  assert.equal(exigeInterno("/chamados"), false);
  assert.equal(exigeInterno("/assistente"), false);
});

test("rotas públicas não casam por prefixo parcial", () => {
  assert.equal(ehPublica("/login"), true);
  assert.equal(ehPublica("/api/health"), true);
  assert.equal(ehPublica("/loginx"), false);
  assert.equal(ehPublica("/api/chat"), false);
});
