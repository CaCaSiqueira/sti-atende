import pg from "pg";
import { readdirSync, readFileSync } from "node:fs";

/**
 * Banco de teste: um PostgreSQL comum (no GitHub, um serviço do próprio workflow; local, o que você tiver).
 * Cada arquivo de teste cria um banco novo, aplica TODAS as migrações em ordem e o apaga no fim.
 * Nada aqui toca o Supabase de produção.
 *
 * Uso: BANCO_TESTE_URL=postgres://postgres:postgres@localhost:5432/postgres npm run test:banco
 */
export const URL_BANCO_TESTE = process.env.BANCO_TESTE_URL;
export const SEM_BANCO = URL_BANCO_TESTE ? false : "defina BANCO_TESTE_URL para rodar os testes do banco";

const PASTA_MIGRACOES = new URL("../migrations/", import.meta.url);

/** O que o Supabase já traz pronto e as migrações usam: papéis, auth.users e storage.buckets (versões mínimas). */
const ESTRUTURA_SUPABASE = `
-- Papéis valem para o servidor inteiro, e os arquivos de teste rodam em paralelo: tolera o papel já criado.
do $$ begin
  begin create role anon nologin; exception when duplicate_object or unique_violation then null; end;
  begin create role authenticated nologin; exception when duplicate_object or unique_violation then null; end;
  begin create role service_role nologin bypassrls; exception when duplicate_object or unique_violation then null; end;
end $$;
create schema auth;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_app_meta_data jsonb not null default '{}',
  raw_user_meta_data jsonb not null default '{}'
);
create schema storage;
create table storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);
grant usage on schema public to anon, authenticated, service_role;
-- Como no Supabase: tudo que for criado em public já nasce liberado para os três papéis.
-- Quem barra o navegador é o RLS (tabelas) e o revoke das migrações (funções).
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
`;

export const migracoes = () =>
  readdirSync(PASTA_MIGRACOES)
    .filter((f) => f.endsWith(".sql"))
    .sort();

export interface BancoDeTeste {
  url: string;
  cliente: () => Promise<pg.Client>;
  apagar: () => Promise<void>;
}

/** Cria um banco novo, com a estrutura mínima do Supabase e todas as migrações aplicadas em ordem. */
export async function criarBancoDeTeste(): Promise<BancoDeTeste> {
  const base = new URL(URL_BANCO_TESTE!);
  const nome = `sti_teste_${process.pid}_${Date.now()}`;
  const admin = new pg.Client({ connectionString: base.toString() });
  await admin.connect();
  await admin.query(`create database ${nome}`);
  await admin.end();

  const url = new URL(base);
  url.pathname = `/${nome}`;
  const conectar = async () => {
    const c = new pg.Client({ connectionString: url.toString() });
    await c.connect();
    return c;
  };

  const c = await conectar();
  try {
    await c.query(ESTRUTURA_SUPABASE);
    for (const arquivo of migracoes()) {
      try {
        await c.query(readFileSync(new URL(arquivo, PASTA_MIGRACOES), "utf8"));
      } catch (e) {
        throw new Error(`A migração ${arquivo} falhou: ${(e as Error).message}`);
      }
    }
  } finally {
    await c.end();
  }

  return {
    url: url.toString(),
    cliente: conectar,
    apagar: async () => {
      const a = new pg.Client({ connectionString: base.toString() });
      await a.connect();
      await a.query(`drop database if exists ${nome} with (force)`);
      await a.end();
    },
  };
}
