import { test } from "node:test";
import assert from "node:assert/strict";
import { chavesAusentes, modoDoSistema } from "./ambiente.ts";

const completo = { SUPABASE_URL: "https://x.supabase.co", SUPABASE_SECRET_KEY: "sb_secret_x", SUPABASE_PUBLISHABLE_KEY: "sb_publishable_x" };

test("com as três chaves do Supabase, o sistema roda normal (local ou na Vercel)", () => {
  assert.equal(modoDoSistema(completo), "normal");
  assert.equal(modoDoSistema({ ...completo, VERCEL: "1" }), "normal");
});

test("sem nenhuma chave, fora da Vercel: modo demonstração", () => {
  assert.equal(modoDoSistema({}), "demonstracao");
});

test("sem chaves na Vercel (produção ou prévia): bloqueado, nunca modo demonstração", () => {
  assert.equal(modoDoSistema({ VERCEL: "1" }), "bloqueado");
});

test("configuração incompleta: bloqueado em qualquer lugar (evita banco real sem login)", () => {
  assert.equal(modoDoSistema({ SUPABASE_URL: completo.SUPABASE_URL, SUPABASE_SECRET_KEY: completo.SUPABASE_SECRET_KEY }), "bloqueado");
  assert.equal(modoDoSistema({ SUPABASE_URL: completo.SUPABASE_URL }), "bloqueado");
  assert.equal(modoDoSistema({ ...completo, SUPABASE_SECRET_KEY: "" }), "bloqueado", "variável vazia conta como ausente");
});

test("lista só os nomes das chaves que faltam", () => {
  assert.deepEqual(chavesAusentes({ SUPABASE_URL: "x" }), ["SUPABASE_SECRET_KEY", "SUPABASE_PUBLISHABLE_KEY"]);
  assert.deepEqual(chavesAusentes(completo), []);
});
