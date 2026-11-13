import { test } from "node:test";
import assert from "node:assert/strict";
import { classificar } from "./roteamento.ts";

test("erro no CAR abre o POP de sincronização", () => {
  assert.equal(classificar("Erro no CAR").intencao, "pop_car");
  assert.equal(classificar("problema no Cadastro Ambiental Rural").intencao, "pop_car");
});

test("'car' dentro de outra palavra não dispara o POP", () => {
  assert.notEqual(classificar("não consigo carregar a planilha").intencao, "pop_car");
  assert.notEqual(classificar("meu cartão de ponto").intencao, "pop_car");
});

test("hardware vai para GATI", () => {
  const c = classificar("Meu computador não liga");
  assert.equal(c.setor, "GATI");
  assert.equal(classificar("impressora sem toner").setor, "GATI");
});

test("sistemas vão para CSTI", () => {
  assert.equal(classificar("O SIGPAS travou").setor, "CSTI");
  assert.equal(classificar("esqueci a senha").setor, "CSTI");
});

test("rede vai para Infraestrutura com prioridade urgente", () => {
  const c = classificar("Queda de internet no setor");
  assert.equal(c.setor, "INFRA");
  assert.equal(c.prioridade, "urgente");
});

test("rede tem precedência sobre hardware", () => {
  assert.equal(classificar("computador sem internet").setor, "INFRA");
});

test("ignora acentos e maiúsculas", () => {
  assert.equal(classificar("SEM CONEXÃO").setor, "INFRA");
});

test("desconhecido vai para triagem N1", () => {
  const c = classificar("preciso de uma cadeira nova");
  assert.equal(c.intencao, "desconhecido");
  assert.equal(c.setor, "TRIAGEM");
});
