import { test } from "node:test";
import assert from "node:assert/strict";
import { ehPublica, exigeSti, perfilDe } from "./perfil.ts";

test("perfil vem de app_metadata e o desconhecido vira externo", () => {
  assert.equal(perfilDe({ perfil: "sti" }), "sti");
  assert.equal(perfilDe({ perfil: "servidor" }), "servidor");
  assert.equal(perfilDe({ perfil: "externo" }), "externo");
  assert.equal(perfilDe({ perfil: "admin" }), "externo");
  assert.equal(perfilDe({}), "externo");
  assert.equal(perfilDe(undefined), "externo");
});

test("nome antigo 'interno' (equipe de TI até a v1.0.0) continua sendo STI", () => {
  assert.equal(perfilDe({ perfil: "interno" }), "sti");
});

test("Visão Geral e Configurações são exclusivas da STI", () => {
  assert.equal(exigeSti("/visao-geral"), true);
  assert.equal(exigeSti("/configuracoes"), true);
  assert.equal(exigeSti("/chamados"), false);
  assert.equal(exigeSti("/chamados/INC-0500"), false);
  assert.equal(exigeSti("/assistente"), false);
});

test("rotas públicas não casam por prefixo parcial", () => {
  assert.equal(ehPublica("/login"), true);
  assert.equal(ehPublica("/api/health"), true);
  assert.equal(ehPublica("/loginx"), false);
  assert.equal(ehPublica("/api/chat"), false);
  assert.equal(ehPublica("/api/anexos/abc"), false);
});
