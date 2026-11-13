-- STI Atende: schema inicial (Sprint 3)
--
-- Segurança: RLS ligado e SEM políticas. Assim, as chaves públicas (anon/publishable)
-- não leem nem gravam nada; só o servidor Next.js, com a chave secreta, acessa as tabelas.

create sequence if not exists public.chamado_numero start 500;

create table public.chamados (
  id               text primary key default 'INC-' || lpad(nextval('public.chamado_numero')::text, 4, '0'),
  assunto          text not null check (char_length(assunto) between 1 and 200),
  descricao        text check (char_length(descricao) <= 4000),
  solicitante      text not null default 'Usuário Interno' check (char_length(solicitante) <= 120),
  setor            text not null check (setor in ('CSTI', 'GATI', 'INFRA', 'TRIAGEM')),
  responsavel      text,
  status           text not null default 'aberto'
                     check (status in ('aberto', 'em_analise', 'aguardando_terceiros', 'resolvido')),
  prioridade       text not null default 'media' check (prioridade in ('baixa', 'media', 'alta', 'urgente')),
  origem           text not null default 'manual' check (origem in ('chat', 'manual')),
  classificado_por text not null default 'usuario' check (classificado_por in ('ia', 'regras', 'usuario')),
  aberto_em        timestamptz not null default now(),
  resolvido_em     timestamptz
);

create index chamados_aberto_em_idx on public.chamados (aberto_em desc);
create index chamados_status_idx on public.chamados (status);

-- Registro das sincronizações do CAR: base da regra "1 vez a cada 24h" no servidor.
create table public.car_sincronizacoes (
  id         bigint generated always as identity primary key,
  cliente_id text not null check (char_length(cliente_id) <= 64),
  feita_em   timestamptz not null default now()
);

create index car_sincronizacoes_cliente_idx on public.car_sincronizacoes (cliente_id, feita_em desc);

alter table public.chamados enable row level security;
alter table public.car_sincronizacoes enable row level security;

-- Dados de exemplo para a demonstração (mesmos do protótipo).
insert into public.chamados (id, assunto, solicitante, setor, responsavel, status, prioridade, origem, classificado_por, aberto_em, resolvido_em) values
  ('INC-0492', 'Erro de sincronização CAR', 'João Henrique', 'CSTI', 'Thiago Andrade', 'em_analise', 'media', 'chat', 'regras', now() - interval '5 hours', null),
  ('INC-0491', 'Monitor piscando / cabo quebrado', 'Maria Cristina', 'GATI', 'Pitagoras', 'resolvido', 'baixa', 'manual', 'usuario', now() - interval '1 day', now() - interval '2 hours'),
  ('REQ-0102', 'Queda de internet no setor', 'Carina B. Siqueira', 'INFRA', 'Jadiael', 'em_analise', 'urgente', 'chat', 'regras', now() - interval '6 hours', null),
  ('INC-0490', 'SIGPAS não carrega relatório de licenças', 'Ana Paula', 'CSTI', null, 'aberto', 'alta', 'manual', 'usuario', now() - interval '20 hours', null),
  ('INC-0489', 'Impressora do protocolo sem toner', 'Roberto Lima', 'GATI', 'Fornecedor externo', 'aguardando_terceiros', 'media', 'manual', 'usuario', now() - interval '2 days', null);
