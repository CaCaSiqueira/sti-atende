import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularIndicadores, inicioDoDiaMT, slaViolado } from "./sla.ts";

const H = 60 * 60 * 1000;
const agora = Date.parse("2026-11-13T15:00:00-04:00");

test("urgente aberto há mais de 4h viola o SLA", () => {
  assert.equal(slaViolado({ status: "aberto", prioridade: "urgente", abertoEm: new Date(agora - 5 * H).toISOString() }, agora), true);
  assert.equal(slaViolado({ status: "aberto", prioridade: "urgente", abertoEm: new Date(agora - 3 * H).toISOString() }, agora), false);
});

test("resolvido nunca viola o SLA", () => {
  assert.equal(slaViolado({ status: "resolvido", prioridade: "urgente", abertoEm: new Date(agora - 99 * H).toISOString() }, agora), false);
});

test("início do dia segue o horário de Cuiabá (UTC-4)", () => {
  assert.equal(new Date(inicioDoDiaMT(agora)).toISOString(), "2026-11-13T04:00:00.000Z");
});

test("indicadores contam abertos, resolvidos hoje e volume por setor", () => {
  const ind = calcularIndicadores(
    [
      { status: "aberto", prioridade: "media", setor: "CSTI", abertoEm: new Date(agora - H).toISOString(), resolvidoEm: null },
      { status: "aguardando_terceiros", prioridade: "media", setor: "GATI", abertoEm: new Date(agora - H).toISOString(), resolvidoEm: null },
      { status: "resolvido", prioridade: "baixa", setor: "CSTI", abertoEm: new Date(agora - 30 * H).toISOString(), resolvidoEm: new Date(agora - H).toISOString() },
      { status: "resolvido", prioridade: "baixa", setor: "INFRA", abertoEm: new Date(agora - 50 * H).toISOString(), resolvidoEm: new Date(agora - 26 * H).toISOString() },
    ],
    agora,
  );
  assert.equal(ind.abertos, 2);
  assert.equal(ind.resolvidosHoje, 1);
  assert.equal(ind.aguardandoTerceiros, 1);
  assert.deepEqual(ind.volumePorSetor, [
    { setor: "CSTI", percentual: 50 },
    { setor: "GATI", percentual: 25 },
    { setor: "INFRA", percentual: 25 },
  ]);
});
