-- STI Atende: Sprint 6
-- Histórico do chamado (quem fez o quê e quando) e nota de solução escrita pela STI ao concluir.
-- Segue o padrão do projeto: RLS ligado e SEM políticas. Só o servidor (chave secreta) lê e grava.

-- Nota de solução: obrigatória ao concluir; reabrir o chamado a apaga (o histórico guarda a antiga).
alter table public.chamados
  add column solucao text check (char_length(solucao) <= 2000);

create table public.chamado_eventos (
  id         bigint generated always as identity primary key,
  chamado_id text not null references public.chamados (id) on delete cascade,
  -- aberto | assumido | status (mudança de status) | rp (RP informado ou removido) | print (print anexado)
  tipo       text not null check (tipo in ('aberto', 'assumido', 'status', 'rp', 'print')),
  -- Status do chamado depois do evento (aberto, assumido e status).
  status     text check (status in ('aberto', 'em_analise', 'aguardando_terceiros', 'resolvido')),
  -- RP informado, ou a nota de solução quando o status vira "resolvido".
  detalhe    text check (char_length(detalhe) <= 2000),
  autor_id   uuid references auth.users (id) on delete set null,
  autor_nome text check (char_length(autor_nome) <= 120),
  criado_em  timestamptz not null default now()
);

create index chamado_eventos_chamado_idx on public.chamado_eventos (chamado_id, criado_em, id);

alter table public.chamado_eventos enable row level security;

-- Chamados que já existiam: o histórico começa na abertura (e na resolução, quando houver).
-- O que aconteceu entre uma e outra antes da Sprint 6 não foi registrado.
insert into public.chamado_eventos (chamado_id, tipo, status, autor_id, autor_nome, criado_em)
select id, 'aberto', 'aberto', solicitante_id, solicitante, aberto_em from public.chamados;

insert into public.chamado_eventos (chamado_id, tipo, status, criado_em)
select id, 'status', 'resolvido', resolvido_em from public.chamados where status = 'resolvido' and resolvido_em is not null;
