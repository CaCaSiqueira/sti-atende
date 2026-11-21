import { test } from "node:test";
import assert from "node:assert/strict";
import { permitirEmMemoria } from "./limite-memoria.ts";

test("limite em memória: libera até o máximo na janela e bloqueia o resto", () => {
  const t0 = 1_000_000;
  const chave = `teste:${Math.random()}`;
  assert.deepEqual(
    [1, 2, 3, 4].map((i) => permitirEmMemoria(chave, 3, 60_000, t0 + i)),
    [true, true, true, false],
  );
});

test("limite em memória: nova janela zera a contagem; chaves não se misturam", () => {
  const t0 = 2_000_000;
  const a = `a:${Math.random()}`;
  const b = `b:${Math.random()}`;
  permitirEmMemoria(a, 1, 60_000, t0);
  assert.equal(permitirEmMemoria(a, 1, 60_000, t0 + 1), false);
  assert.equal(permitirEmMemoria(b, 1, 60_000, t0 + 1), true, "outra chave");
  assert.equal(permitirEmMemoria(a, 1, 60_000, t0 + 60_000), true, "janela nova");
});
