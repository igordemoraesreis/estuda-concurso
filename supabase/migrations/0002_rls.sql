alter table profiles enable row level security;
alter table concursos enable row level security;
alter table disciplinas enable row level security;
alter table assuntos enable row level security;
alter table topicos enable row level security;
alter table sessoes_estudo enable row level security;
alter table sessoes_exercicio enable row level security;

create policy "profiles_self" on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

do $$
declare tbl text;
begin
  foreach tbl in array array['concursos','disciplinas','assuntos','topicos','sessoes_estudo','sessoes_exercicio']
  loop
    execute format('create policy "%1$s_owner" on %1$s for all using (user_id = auth.uid()) with check (user_id = auth.uid());', tbl);
  end loop;
end $$;
