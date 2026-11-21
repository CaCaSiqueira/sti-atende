import { test } from "node:test";
import assert from "node:assert/strict";
import type { EventoChamado } from "../types/chamado";
import { descreverEvento, linhaDoTempoUsuario, reabrindo, validarSolucao } from "./historico.ts";
import { aplicarFiltros, FILTROS_PADRAO, filtrosAtivos } from "./busca.ts";

let n = 0;
const ev = (tipo: EventoChamado["tipo"], extra: Partial<EventoChamado> = {}): EventoChamado => ({
  id: String(++n),
  tipo,
  status: null,
  detalhe: null,
  autor: "Ana (STI)",
  criadoEm: `2026-11-21T1${n % 10}:00:00Z`,
  ...extra,
});

test("concluir exige nota de solução", () => {
  assert.match(validarSolucao("em_analise", "resolvido", undefined) ?? "", /nota de solução/);
  assert.match(validarSolucao("em_analise", "resolvido", "   ok    ") ?? "", /pelo menos/);
  assert.equal(validarSolucao("em_analise", "resolvido", "Cabo HDMI trocado e testado."), null);
});

test("nota só vale ao concluir", () => {
  assert.equal(validarSolucao("aberto", "em_analise", undefined), null);
  assert.equal(validarSolucao("aberto", undefined, undefined), null);
  assert.match(validarSolucao("aberto", "em_analise", "Uma nota qualquer") ?? "", /só é enviada ao concluir/);
  assert.match(validarSolucao("resolvido", "resolvido", "Outra nota qualquer") ?? "", /só é enviada ao concluir/, "já resolvido");
  assert.equal(validarSolucao("resolvido", "resolvido", undefined), null, "status igual, sem nota: nada muda");
});

test("reabrir é sair de resolvido", () => {
  assert.equal(reabrindo("resolvido", "em_analise"), true);
  assert.equal(reabrindo("resolvido", "resolvido"), false);
  assert.equal(reabrindo("resolvido", undefined), false);
  assert.equal(reabrindo("aberto", "em_analise"), false);
});

test("linha do tempo do usuário: só status, sem repetir, com reabertura", () => {
  const passos = linhaDoTempoUsuario([
    ev("aberto", { status: "aberto", autor: "Carlos" }),
    ev("assumido"),
    ev("status", { status: "em_analise" }),
    ev("rp", { detalhe: "123456" }),
    ev("status", { status: "aguardando_terceiros" }),
    ev("print"),
    ev("status", { status: "resolvido", detalhe: "Trocado o toner." }),
    ev("status", { status: "em_analise" }),
  ]);
  assert.deepEqual(
    passos.map((p) => [p.status, p.reaberto]),
    [
      ["aberto", false],
      ["em_analise", false],
      ["resolvido", false],
      ["em_analise", true],
    ],
  );
  assert.ok(passos.every((p) => !("autor" in p)), "sem nomes da equipe");
});

test("frases do histórico da STI, inclusive sem autor (chamados antigos)", () => {
  assert.equal(descreverEvento(ev("aberto", { autor: "Carlos" })), "Chamado aberto por Carlos");
  assert.equal(descreverEvento(ev("assumido")), "Ana (STI) assumiu o chamado");
  assert.equal(descreverEvento(ev("status", { status: "resolvido" })), 'Ana (STI) mudou o status para "Resolvido"');
  assert.equal(descreverEvento(ev("status", { status: "resolvido", autor: null })), 'Status: "Resolvido"');
  assert.equal(descreverEvento(ev("rp", { detalhe: "245871" })), "Ana (STI) informou o RP 245871");
  assert.equal(descreverEvento(ev("rp")), "Ana (STI) removeu o RP");
  assert.equal(descreverEvento(ev("print", { autor: null })), "Print anexado");
});

test("filtros da Consulta da STI", () => {
  const lista = [
    { id: "1", status: "aberto" as const, setor: "GATI" as const, responsavelId: null },
    { id: "2", status: "em_analise" as const, setor: "GATI" as const, responsavelId: "eu" },
    { id: "3", status: "resolvido" as const, setor: "CSTI" as const, responsavelId: "eu" },
    { id: "4", status: "aguardando_terceiros" as const, setor: "INFRA" as const, responsavelId: "outra" },
  ];
  const ids = (f: Partial<typeof FILTROS_PADRAO>, meuId: string | null = "eu") =>
    aplicarFiltros(lista, { ...FILTROS_PADRAO, ...f }, meuId).map((c) => c.id).join(",");
  assert.equal(ids({}), "1,2,3,4");
  assert.equal(ids({ status: "nao_resolvidos" }), "1,2,4");
  assert.equal(ids({ status: "resolvido" }), "3");
  assert.equal(ids({ setor: "GATI" }), "1,2");
  assert.equal(ids({ meus: true }), "2,3");
  assert.equal(ids({ meus: true, status: "nao_resolvidos" }), "2");
  assert.equal(ids({ meus: true }, null), "1,2,3,4", "sem login, 'meus' não filtra");
  assert.equal(filtrosAtivos(FILTROS_PADRAO), false);
  assert.equal(filtrosAtivos({ ...FILTROS_PADRAO, setor: "CSTI" }), true);
});
