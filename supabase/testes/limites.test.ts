import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { SEM_BANCO, criarBancoDeTeste, type BancoDeTeste } from "./banco.ts";

let banco: BancoDeTeste;
let pool: pg.Pool;

before(async () => {
  if (SEM_BANCO) return;
  banco = await criarBancoDeTeste();
  // Uma conexão por requisição simultânea, como instâncias diferentes da Vercel.
  pool = new pg.Pool({ connectionString: banco.url, max: 20 });
});
after(async () => {
  if (SEM_BANCO) return;
  await pool?.end();
  await banco?.apagar();
});

const permitir = async (chave: string, maximo: number, janelaSegundos: number): Promise<boolean> =>
  (await pool.query("select public.permitir_requisicao($1, $2, $3) as ok", [chave, maximo, janelaSegundos])).rows[0].ok;

test("20 requisições simultâneas com limite 5: exatamente 5 passam", { skip: SEM_BANCO }, async () => {
  const resultados = await Promise.all(Array.from({ length: 20 }, () => permitir("login:203.0.113.10", 5, 60)));
  assert.equal(resultados.filter(Boolean).length, 5);
  const { rows } = await pool.query("select total from public.limites_requisicao where chave = 'login:203.0.113.10'");
  assert.equal(rows[0].total, 20, "todas as tentativas são contadas");
});

test("chaves diferentes não se misturam", { skip: SEM_BANCO }, async () => {
  assert.equal(await permitir("chat:198.51.100.1", 1, 60), true);
  assert.equal(await permitir("chat:198.51.100.1", 1, 60), false);
  assert.equal(await permitir("chat:198.51.100.2", 1, 60), true);
});

test("a janela vence e a contagem recomeça", { skip: SEM_BANCO }, async () => {
  assert.equal(await permitir("anexos:192.0.2.7", 1, 1), true);
  assert.equal(await permitir("anexos:192.0.2.7", 1, 1), false);
  await new Promise((r) => setTimeout(r, 1100));
  assert.equal(await permitir("anexos:192.0.2.7", 1, 1), true);
});

test("o navegador (anon e authenticated) não pode chamar a função; o servidor (service_role) pode", { skip: SEM_BANCO }, async () => {
  const c = await pool.connect();
  try {
    for (const papel of ["anon", "authenticated"]) {
      await c.query("begin");
      await c.query(`set local role ${papel}`);
      await assert.rejects(c.query("select public.permitir_requisicao('x', 1, 60)"), /permission denied for function/, papel);
      await c.query("rollback");
    }
    await c.query("begin");
    await c.query("set local role service_role");
    const { rows } = await c.query("select public.permitir_requisicao('servidor:teste', 1, 60) as ok");
    assert.equal(rows[0].ok, true);
    await c.query("rollback");
  } finally {
    c.release();
  }
});
