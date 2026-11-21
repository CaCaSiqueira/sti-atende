-- STI Atende: Sprint 5
-- Perfis externo / servidor (usuário interno) / sti, RP do equipamento, prints do erro e atualização pela STI.
-- Segue o padrão do projeto: RLS ligado e SEM políticas. Só o servidor (chave secreta) lê e grava.

-- RP = número de patrimônio do equipamento (só números).
alter table public.chamados
  add column rp_equipamento text check (rp_equipamento ~ '^[0-9]{1,15}$'),
  -- Chamado interno: aberto por servidor da SEMA ou pela própria STI.
  add column interno boolean not null default false,
  -- Quem da STI assumiu o chamado (o nome continua em "responsavel").
  add column responsavel_id uuid references auth.users (id) on delete set null;

-- Prints do erro: o arquivo fica no Storage (bucket privado "prints"); aqui, o registro.
create table public.chamado_anexos (
  id               uuid primary key default gen_random_uuid(),
  chamado_id       text not null references public.chamados (id) on delete cascade,
  caminho          text not null unique,
  tipo             text not null check (tipo in ('image/png', 'image/jpeg', 'image/webp')),
  tamanho          integer not null check (tamanho between 1 and 4194304),
  enviado_por      uuid references auth.users (id) on delete set null,
  enviado_por_nome text check (char_length(enviado_por_nome) <= 120),
  enviado_em       timestamptz not null default now()
);

create index chamado_anexos_chamado_idx on public.chamado_anexos (chamado_id, enviado_em);

alter table public.chamado_anexos enable row level security;

-- Bucket privado: sem políticas, só a chave secreta acessa. As imagens chegam ao navegador
-- pela rota /api/anexos/[id], que confere quem pode ver o chamado.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('prints', 'prints', false, 4194304, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

-- Perfis: "interno" era o nome da equipe de TI até a v1.0.0; agora é "sti".
-- ("servidor" é o novo usuário interno, servidor da SEMA.) O app também aceita o nome antigo.
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"perfil": "sti"}'::jsonb
where raw_app_meta_data ->> 'perfil' = 'interno';
