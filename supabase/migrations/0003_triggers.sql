create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $fn$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end $fn$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create or replace function sync_concluido_em() returns trigger
language plpgsql as $fn$
begin
  if new.concluido and (old.concluido is distinct from true) then
    new.concluido_em := now();
  elsif not new.concluido then
    new.concluido_em := null;
  end if;
  return new;
end $fn$;

create trigger trg_sync_concluido_em
  before insert or update on topicos
  for each row execute function sync_concluido_em();

create or replace function validar_assunto_disciplina() returns trigger
language plpgsql as $fn$
declare disc uuid;
begin
  if new.assunto_id is null then return new; end if;
  select disciplina_id into disc from assuntos where id = new.assunto_id;
  if disc is null or disc <> new.disciplina_id then
    raise exception 'assunto_id nao pertence a disciplina do topico';
  end if;
  return new;
end $fn$;

create trigger trg_validar_assunto
  before insert or update on topicos
  for each row execute function validar_assunto_disciplina();
