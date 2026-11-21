-- STI Atende: Sprint 7
-- Limites de requisição no banco: valem para todas as instâncias da Vercel e não zeram quando uma reinicia.
-- Segue o padrão do projeto: RLS ligado e SEM políticas. Só o servidor (chave secreta) usa.

create table public.limites_requisicao (
  -- Ex.: "login:200.10.20.30" (rota + IP de quem chama).
  chave  text primary key check (char_length(chave) <= 200),
  inicio timestamptz not null,
  total  integer not null
);

alter table public.limites_requisicao enable row level security;

-- Conta a requisição na janela atual e diz se ainda cabe no limite.
-- Uma única instrução (insert ... on conflict): duas instâncias ao mesmo tempo não contam errado.
create or replace function public.permitir_requisicao(p_chave text, p_maximo integer, p_janela_segundos integer)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  v_total integer;
begin
  insert into public.limites_requisicao as l (chave, inicio, total)
  values (p_chave, now(), 1)
  on conflict (chave) do update
    set inicio = case when l.inicio <= now() - make_interval(secs => p_janela_segundos) then now() else l.inicio end,
        total  = case when l.inicio <= now() - make_interval(secs => p_janela_segundos) then 1 else l.total + 1 end
  returning total into v_total;

  -- Limpeza ocasional (cerca de 1 a cada 100 chamadas) das janelas com mais de um dia.
  if random() < 0.01 then
    delete from public.limites_requisicao where inicio < now() - interval '1 day';
  end if;

  return v_total <= p_maximo;
end;
$$;

-- Só o servidor (service_role, chave secreta) pode chamar. O navegador (anon/authenticated) não.
revoke execute on function public.permitir_requisicao(text, integer, integer) from public, anon, authenticated;
grant execute on function public.permitir_requisicao(text, integer, integer) to service_role;
