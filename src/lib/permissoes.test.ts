import { test } from "node:test";
import assert from "node:assert/strict";
import {
  aceitaRPNaAbertura,
  chamadoInterno,
  podeAnexar,
  podeGerenciar,
  podeInformarRP,
  podeVer,
  rpValido,
  type AlvoPermissao,
} from "./permissoes.ts";
import { statusParaUsuario } from "./setores.ts";

const sti = { id: "u-sti", perfil: "sti" as const };
const servidor = { id: "u-servidor", perfil: "servidor" as const };
const externo = { id: "u-externo", perfil: "externo" as const };

const hardwareDoServidor: AlvoPermissao = { solicitanteId: "u-servidor", setor: "GATI", status: "aberto" };
const sistemaDoServidor: AlvoPermissao = { solicitanteId: "u-servidor", setor: "CSTI", status: "aberto" };
const hardwareDoExterno: AlvoPermissao = { solicitanteId: "u-externo", setor: "GATI", status: "em_analise" };
const semDono: AlvoPermissao = { solicitanteId: null, setor: "INFRA", status: "aberto" };

test("STI vê todos os chamados; usuários só os próprios", () => {
  assert.equal(podeVer(sti, hardwareDoExterno), true);
  assert.equal(podeVer(sti, semDono), true);
  assert.equal(podeVer(servidor, hardwareDoServidor), true);
  assert.equal(podeVer(servidor, hardwareDoExterno), false);
  assert.equal(podeVer(externo, hardwareDoServidor), false);
  assert.equal(podeVer(externo, semDono), false, "chamado sem dono não é de ninguém");
});

test("só a STI assume e muda status", () => {
  assert.equal(podeGerenciar(sti), true);
  assert.equal(podeGerenciar(servidor), false);
  assert.equal(podeGerenciar(externo), false);
});

test("RP: usuário interno no próprio chamado de hardware; externo nunca; STI sempre", () => {
  assert.equal(podeInformarRP(servidor, hardwareDoServidor), true);
  assert.equal(podeInformarRP(servidor, sistemaDoServidor), false, "só hardware");
  assert.equal(podeInformarRP(servidor, { ...hardwareDoServidor, status: "resolvido" }), false, "resolvido fica fechado");
  assert.equal(podeInformarRP(servidor, hardwareDoExterno), false, "chamado de outra pessoa");
  assert.equal(podeInformarRP(externo, hardwareDoExterno), false);
  assert.equal(podeInformarRP(sti, sistemaDoServidor), true);
});

test("print: solicitante enquanto não resolve; STI sempre", () => {
  assert.equal(podeAnexar(externo, hardwareDoExterno), true);
  assert.equal(podeAnexar(externo, { ...hardwareDoExterno, status: "resolvido" }), false);
  assert.equal(podeAnexar(servidor, hardwareDoExterno), false);
  assert.equal(podeAnexar(sti, { ...hardwareDoExterno, status: "resolvido" }), true);
});

test("sem login configurado (local), acesso total", () => {
  assert.equal(podeVer(null, semDono), true);
  assert.equal(podeGerenciar(null), true);
  assert.equal(podeInformarRP(null, semDono), true);
});

test("campo de RP na abertura: hardware e quem não é externo", () => {
  assert.equal(aceitaRPNaAbertura("servidor", "GATI"), true);
  assert.equal(aceitaRPNaAbertura("sti", "GATI"), true);
  assert.equal(aceitaRPNaAbertura("servidor", "CSTI"), false);
  assert.equal(aceitaRPNaAbertura("externo", "GATI"), false);
});

test("RP aceita só números", () => {
  assert.equal(rpValido("123456"), true);
  assert.equal(rpValido("0012"), true, "zeros à esquerda fazem parte do número");
  assert.equal(rpValido(""), false);
  assert.equal(rpValido("12.345"), false);
  assert.equal(rpValido("RP123"), false);
  assert.equal(rpValido(" 123"), false);
  assert.equal(rpValido("1".repeat(16)), false);
});

test("chamado interno é o aberto por servidor ou pela STI", () => {
  assert.equal(chamadoInterno("servidor"), true);
  assert.equal(chamadoInterno("sti"), true);
  assert.equal(chamadoInterno("externo"), false);
  assert.equal(chamadoInterno(null), false);
});

test("usuário vê 'aguardando terceiros' como 'em análise'", () => {
  assert.equal(statusParaUsuario("aguardando_terceiros"), "em_analise");
  assert.equal(statusParaUsuario("aberto"), "aberto");
  assert.equal(statusParaUsuario("resolvido"), "resolvido");
});
