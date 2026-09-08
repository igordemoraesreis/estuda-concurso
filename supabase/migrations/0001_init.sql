create extension if not exists "pgcrypto";

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  active_concurso_id uuid,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table concursos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  banca text,
  cargo text,
  data_prova date,
  status text not null default 'ativo' check (status in ('ativo','arquivado')),
  created_at timestamptz not null default now(),
  archived_at timestamptz
);
create index on concursos (user_id, status);

alter table profiles
  add constraint profiles_active_concurso_fk
  foreign key (active_concurso_id) references concursos(id) on delete set null;

create table disciplinas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  concurso_id uuid not null references concursos(id) on delete cascade,
  nome text not null,
  peso smallint not null default 3 check (peso between 1 and 5),
  ordem int not null default 0,
  created_at timestamptz not null default now()
);
create index on disciplinas (concurso_id);

create table assuntos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  disciplina_id uuid not null references disciplinas(id) on delete cascade,
  nome text not null,
  ordem int not null default 0,
  created_at timestamptz not null default now()
);
create index on assuntos (disciplina_id);

create table topicos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  disciplina_id uuid not null references disciplinas(id) on delete cascade,
  assunto_id uuid references assuntos(id) on delete set null,
  nome text not null,
  ordem int not null default 0,
  concluido boolean not null default false,
  concluido_em timestamptz,
  created_at timestamptz not null default now()
);
create index on topicos (disciplina_id);
create index on topicos (assunto_id);

create table sessoes_estudo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topico_id uuid not null references topicos(id) on delete cascade,
  iniciada_em timestamptz not null,
  duracao_segundos int not null check (duracao_segundos >= 0),
  origem text not null check (origem in ('cronometro','manual')),
  nota text,
  created_at timestamptz not null default now()
);
create index on sessoes_estudo (topico_id);

create table sessoes_exercicio (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topico_id uuid not null references topicos(id) on delete cascade,
  data date not null,
  acertos int not null check (acertos >= 0),
  erros int not null check (erros >= 0),
  nota text,
  created_at timestamptz not null default now()
);
create index on sessoes_exercicio (topico_id);
