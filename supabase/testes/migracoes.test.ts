import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import type pg from "pg";
import { SEM_BANCO, criarBancoDeTeste, migracoes, type BancoDeTeste } from "./banco.ts";

let banco: BancoDeTeste;
let c: pg.Client;

before(async () => {
  if (SEM_BANCO) return;
  banco = await criarBancoDeTeste(); // falha aqui se qualquer migração não aplicar
  c = await banco.cliente();
});
after(async () => {
  if (SEM_BANCO) return;
  await c?.end();
  await banco?.apagar();
});

test("todas as migrações aplicam em ordem num banco vazio", { skip: SEM_BANCO }, async () => {
  assert.ok(migracoes().length >= 5, `migrações encontradas: ${migracoes().join(", ")}`);
  const { rows } = await c.query(`select table_name from information_schema.tables where table_schema = 'public' order by 1`);
  assert.deepEqual(
    rows.map((r) => r.table_name),
    ["car_sincronizacoes", "chamado_anexos", "chamado_eventos", "chamados", "limites_requisicao"],
  );
});

test("toda tabela pública tem RLS ligado (o navegador não lê nada direto)", { skip: SEM_BANCO }, async () => {
  const { rows } = await c.query(`select relname from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' and not relrowsecurity`);
  assert.deepEqual(rows, [], `tabelas sem RLS: ${rows.map((r) => r.relname).join(", ")}`);
});

test("com as permissões padrão do Supabase, o navegador (anon) não lê nem grava nada: o RLS barra", { skip: SEM_BANCO }, async () => {
  await c.query("begin");
  try {
    await c.query("set local role anon");
    for (const tabela of ["chamados", "chamado_anexos", "chamado_eventos", "car_sincronizacoes", "limites_requisicao"]) {
      const { rows } = await c.query(`select count(*)::int as n from public.${tabela}`);
      assert.equal(rows[0].n, 0, `anon leu linhas de ${tabela}`);
    }
    await assert.rejects(c.query(`insert into public.chamados (assunto, setor) values ('invasão', 'CSTI')`), /row-level security/);
  } finally {
    await c.query("rollback");
  }
});

test("bucket dos prints é privado e só aceita imagens", { skip: SEM_BANCO }, async () => {
  const { rows } = await c.query(`select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'prints'`);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].public, false);
  assert.equal(Number(rows[0].file_size_limit), 4 * 1024 * 1024);
  assert.deepEqual(rows[0].allowed_mime_types, ["image/png", "image/jpeg", "image/webp"]);
});

test("histórico inicial: abertura de todos os chamados e resolução dos resolvidos", { skip: SEM_BANCO }, async () => {
  const { rows } = await c.query(`
    select (select count(*) from public.chamados)::int as chamados,
           (select count(*) from public.chamado_eventos where tipo = 'aberto')::int as aberturas,
           (select count(*) from public.chamados where status = 'resolvido')::int as resolvidos,
           (select count(*) from public.chamado_eventos where tipo = 'status' and status = 'resolvido')::int as resolucoes`);
  assert.equal(rows[0].aberturas, rows[0].chamados);
  assert.equal(rows[0].resolucoes, rows[0].resolvidos);
});

test("RP aceita só números (regra também no banco)", { skip: SEM_BANCO }, async () => {
  await assert.rejects(c.query(`update public.chamados set rp_equipamento = 'RP12' where id = 'INC-0492'`), /rp_equipamento/);
  await c.query(`update public.chamados set rp_equipamento = '245871' where id = 'INC-0492'`);
});
