-- STI Atende: vínculo do chamado com o usuário logado (Sprint 4)
alter table public.chamados
  add column solicitante_id uuid references auth.users (id) on delete set null;

create index chamados_solicitante_idx on public.chamados (solicitante_id, aberto_em desc);

-- car_sincronizacoes.cliente_id passa a guardar o id do usuário logado (texto, compatível com o formato anterior).
