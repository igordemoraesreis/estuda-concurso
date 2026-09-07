# Fundação — App de estudo para concurseiros (sub-projeto #1)

**Data:** 2026-09-07
**Status:** Aprovado para planejamento de implementação

## Contexto

App mobile (React Native + Expo) para concurseiros. O app organiza o estudo
por edital e acompanha o progresso, independente de o usuário seguir ou não um
plano de estudos.

O produto completo tem ~21 funcionalidades que atravessam vários subsistemas
independentes. Ele foi decomposto em sub-projetos, cada um com sua própria
spec → plano → implementação:

| # | Sub-projeto | Entrega |
|---|-------------|---------|
| **1** | **Fundação** (esta spec) | Modelo de dados, navegação, auth, cadastro manual do edital (colar texto), conclusão de tópicos + cronômetro, registro de exercícios, painel de progresso, lista de revisão por data |
| 2 | Ingestão de edital | Upload de PDF + OCR + parsing na mesma árvore |
| 3 | Motor de revisão estratégica | Repetição espaçada por peso da matéria + taxa de erro |
| 4 | Plano automático + calendário | Distribuição por peso, exportar Google/Apple Calendar |
| 5 | Flashcards | Baralhos, revisão, integração com tópicos |
| 6 | Foco + gamificação | Pomodoro 25/5, streak/XP/medalhas, confete |
| 7 | Offline + sync | Armazenamento local, resolução de conflitos |
| 8 | Extras | Widget, backup em nuvem, exportação PDF/CSV, links e importação de questões |

## Decisões do produto (Fundação)

- **Um edital ativo por vez**, com histórico: o usuário pode arquivar um
  concurso e começar outro, mas não alterna entre editais no dia a dia. Pode
  evoluir para multi-edital depois.
- **Login obrigatório, online-first.** Precisa entrar com conta e ter
  conexão. Dados vivem no Supabase, com cache leve de leitura. A camada
  offline robusta é o sub-projeto #7.
- **Provedores de login no #1:** Google (OAuth do Supabase) + e-mail/senha.
  Apple e Facebook ficam para um sub-projeto de auth posterior.
- **Peso da matéria:** número simples de 1 a 5 por disciplina (default 3).
- **Hierarquia:** disciplina → (assunto opcional) → tópico. Sempre há
  disciplina e tópico; "assunto" é um agrupador opcional. O tópico é a folha
  onde se marca conclusão, roda o cronômetro e se registram exercícios.
- **Registro de exercícios:** sessões agregadas — data, nº de acertos, nº de
  erros. Questão a questão e importação ficam para o #8.
- **Cronômetro de estudo:** cronômetro ao vivo (iniciar/pausar/retomar) que
  acumula tempo numa sessão + campo de entrada manual para tempo retroativo.
  Pomodoro/Modo Foco integra no #6.
- **Painel de progresso** (tela principal) mostra em destaque:
  1. Cobertura do edital — % de tópicos concluídos, geral e por disciplina
  2. Cobertura ponderada por peso — % de conclusão onde disciplinas de peso
     4–5 valem mais
  3. Aproveitamento — % de acerto geral e por disciplina, a partir das
     sessões de exercício
  4. Tempo estudado — total, por disciplina, e tendência dos últimos 7 dias
- **Revisão no #1:** lista simples por data — tópicos concluídos há mais de
  X dias (default 7/15/30, configurável) aparecem como "pode revisar". Regra
  fixa, sem repetição espaçada. O motor de revisão (#3) substitui essa lógica.
- **Cadastro do edital:** o usuário **cola o texto** do edital num campo; um
  parser leve quebra em disciplina/(assunto)/tópico por numeração e
  marcadores, gerando um rascunho **editável**. O usuário ajusta a árvore
  manualmente e completa no seu tempo (incremental — o progresso aparece para
  o que já foi cadastrado). O botão "anexar PDF" fica visível mas marcado
  como "em breve" (OCR real é o #2).

## Arquitetura

### Stack

- **Expo** (SDK atual) + **TypeScript** + **Expo Router** (navegação por arquivos)
- **NativeWind v4** — Tailwind no RN, com tokens de tema centralizados (cores,
  tipografia, espaçamento), deixando dark mode e escala de fonte preparados
  para o #13
- **@supabase/supabase-js** + `expo-secure-store` para persistir a sessão
- **TanStack Query** — cache de dados do servidor (prepara terreno para o #7)
- **Zustand** (mínimo) — estado do cronômetro ativo e override de tema
- **react-hook-form + zod** — formulários e validação
- **Jest + @testing-library/react-native** — componentes e hooks
- **Supabase local** (`supabase start`) — testes de integração de RLS e cascata

### Onde ficam os cálculos de progresso

**Métricas calculadas no cliente**, em funções puras de TypeScript. O Supabase
apenas armazena; a segurança é garantida por RLS. Justificativa: o volume de
dados é pequeno (um concurso, algumas centenas de tópicos), então performance
não é problema, e manter a lógica em TS torna a calibração das métricas rápida
e testável com TDD, sem migração a cada ajuste.

Métricas pesadas migram para views SQL apenas quando o #8 (exportação de
relatórios no servidor) exigir.

Alternativas descartadas: views do Postgres (cada ajuste vira migração,
calibração lenta); camada de API / Edge Functions (exagero para o #1, YAGNI).

## Modelo de dados (Supabase / Postgres)

Todas as tabelas têm `user_id` (dono) e **RLS** com `user_id = auth.uid()`.
O `user_id` é denormalizado em todas as tabelas para manter as políticas de
RLS simples e diretas.

### `profiles` (1:1 com `auth.users`)

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid, PK | = `auth.users.id` |
| `display_name` | text | |
| `active_concurso_id` | uuid, nullable | FK `concursos.id`; qual edital carregar ao abrir o app |
| `settings` | jsonb | tema, escala de fonte, limiares de revisão; placeholder para #13 |
| `created_at` | timestamptz | default `now()` |

### `concursos`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid, PK | |
| `user_id` | uuid | FK `auth.users.id` |
| `nome` | text | ex.: "TRT-4 Analista Judiciário" |
| `banca` | text, nullable | |
| `cargo` | text, nullable | |
| `data_prova` | date, nullable | |
| `status` | text | `ativo` \| `arquivado` |
| `created_at` | timestamptz | default `now()` |
| `archived_at` | timestamptz, nullable | |

### `disciplinas`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid, PK | |
| `user_id` | uuid | |
| `concurso_id` | uuid | FK `concursos.id`, `on delete cascade` |
| `nome` | text | |
| `peso` | smallint | 1–5, default 3, check `peso between 1 and 5` |
| `ordem` | int | posição na lista |
| `created_at` | timestamptz | default `now()` |

### `assuntos` (nível opcional)

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid, PK | |
| `user_id` | uuid | |
| `disciplina_id` | uuid | FK `disciplinas.id`, `on delete cascade` |
| `nome` | text | |
| `ordem` | int | |
| `created_at` | timestamptz | default `now()` |

### `topicos` (folha)

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid, PK | |
| `user_id` | uuid | |
| `disciplina_id` | uuid | FK `disciplinas.id`, `on delete cascade`; sempre presente |
| `assunto_id` | uuid, nullable | FK `assuntos.id`, `on delete set null`; deve pertencer à mesma disciplina (trigger de validação) |
| `nome` | text | |
| `ordem` | int | |
| `concluido` | bool | default `false` |
| `concluido_em` | timestamptz, nullable | preenchido quando `concluido` vira `true`, limpo ao desmarcar |
| `created_at` | timestamptz | default `now()` |

### `sessoes_estudo`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid, PK | |
| `user_id` | uuid | |
| `topico_id` | uuid | FK `topicos.id`, `on delete cascade` |
| `iniciada_em` | timestamptz | |
| `duracao_segundos` | int | check `>= 0` |
| `origem` | text | `cronometro` \| `manual` |
| `nota` | text, nullable | |
| `created_at` | timestamptz | default `now()` |

### `sessoes_exercicio`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid, PK | |
| `user_id` | uuid | |
| `topico_id` | uuid | FK `topicos.id`, `on delete cascade` |
| `data` | date | dia em que os exercícios foram feitos |
| `acertos` | int | check `>= 0` |
| `erros` | int | check `>= 0` |
| `nota` | text, nullable | |
| `created_at` | timestamptz | default `now()` |

### Notas do modelo

- Deleção em cascata: apagar concurso → disciplinas → assuntos / tópicos →
  sessões. `assunto_id` em `topicos` usa `on delete set null` (apagar um
  assunto não apaga seus tópicos, só os desagrupa).
- **Revisão (lista por data)** não tem tabela: query sobre `topicos` onde
  `concluido = true` e `concluido_em < now() - (X dias)`, com X vindo de
  `profiles.settings` (default 7/15/30).
- **Métricas** são calculadas no cliente a partir dessas tabelas.
- Trigger em `topicos`: ao setar `concluido = true` e `concluido_em` nulo,
  preenche com `now()`; ao setar `concluido = false`, limpa `concluido_em`.
- Trigger de validação: `assunto_id`, quando não nulo, deve referenciar um
  assunto cuja `disciplina_id` é igual à do tópico.

## Navegação (Expo Router)

```
app/
  _layout.tsx                 # providers (Query, tema, Supabase), gate de sessão
  (auth)/
    sign-in.tsx               # Google + e-mail/senha
    sign-up.tsx
  onboarding/
    novo-concurso.tsx         # wizard: dados do concurso -> colar texto -> revisar árvore -> pesos
  (app)/
    _layout.tsx               # tabs; exige sessão + concurso ativo (senão -> onboarding)
    index.tsx                 # PAINEL (dashboard)
    edital/
      index.tsx               # árvore: disciplinas -> (assuntos) -> tópicos
      disciplina/[id].tsx     # tópicos da disciplina, editar peso/nome
      topico/[id].tsx         # concluir · cronômetro · sessões de estudo · sessões de exercício
    revisar.tsx               # lista simples por data
    ajustes.tsx               # perfil, trocar/arquivar concurso, tema (placeholder)
```

- **Tabs:** Painel · Edital · Revisar · Ajustes
- **Gate:** `(app)/_layout.tsx` exige sessão válida e `active_concurso_id`
  apontando para um concurso `ativo`. Sem sessão → `(auth)/sign-in`. Com
  sessão mas sem concurso ativo → `onboarding/novo-concurso`.
- **Cronômetro:** store Zustand + persistência de
  `{ topicoId, iniciadaEm, acumulado }` no AsyncStorage. Aparece como uma
  "pílula" flutuante quando rodando; sobrevive à navegação e ao fechamento
  do app (recupera o estado no próximo launch). Ao parar, grava uma
  `sessoes_estudo` com `origem = cronometro`.

## Estrutura de código

```
src/
  lib/          supabase.ts · query.ts · errors.ts
  theme/        tokens.ts · ThemeProvider.tsx
  components/ui/ Button · Card · Input · ProgressBar · EmptyState · Toast ...
  features/
    auth/       hooks + telas auxiliares
    concurso/   CRUD, wizard, parseEditalTexto
    edital/     árvore, disciplina, tópico
    estudo/     cronômetro + sessões de estudo
    exercicios/ sessões de exercício
    progresso/  funções puras de métrica + hooks do dashboard
    revisao/    query da lista por data
  types/db.ts   gerado do schema Supabase
supabase/
  migrations/   SQL versionado
  seed.sql      dados de exemplo para dev/testes
```

### Parser do edital

`features/concurso/parseEditalTexto.ts` — função pura:

```
string -> { disciplinas: Array<{ nome, assuntos?: Array<{ nome, topicos: string[] }>, topicos: string[] }> }
```

Heurísticas: numeração hierárquica (`1`, `1.1`, `1.1.1`), marcadores (`-`,
`•`, `*`), linhas em MAIÚSCULAS tratadas como disciplina. O resultado é
sempre um rascunho editável — o parser é um chute, não a verdade.

## Cálculo de métricas (`features/progresso/`)

Funções puras, entrada = dados já carregados, saída = números para o painel:

- `coberturaEdital(topicos)` → `{ geral: %, porDisciplina: Map }`
  (concluídos / total)
- `coberturaPonderada(disciplinas, topicos)` → `%`
  (`Σ(peso_d × fração_concluída_d) / Σ(peso_d)`)
- `aproveitamento(sessoesExercicio, topicos)` →
  `{ geral: %, porDisciplina: Map }` (`Σacertos / Σ(acertos+erros)`;
  divisão por zero → `null`, exibido como "—")
- `tempoEstudado(sessoesEstudo, topicos, periodo?)` →
  `{ totalSegundos, porDisciplina: Map, ultimos7dias: number }`

Casos de borda tratados e testados: disciplina sem tópicos (não conta para
cobertura, cobertura ponderada ignora peso da disciplina vazia), zero
exercícios (aproveitamento `null`), peso ausente (usa default 3).

## Tratamento de erros

- `lib/errors.ts` normaliza erros do Supabase (código PostgREST/auth →
  mensagem em PT-BR) num tipo único `AppError`.
- **Auth:** mensagens inline no formulário (e-mail já existe, senha fraca,
  credencial inválida).
- **Rede:** TanStack Query com retry; banner leve "sem conexão" (versão
  completa é #7).
- **Validação:** zod em todo formulário e na saída do `parseEditalTexto`
  (nome vazio, peso fora de 1–5).
- **Toast** global para sucesso/erro de ações (concluir tópico, salvar
  sessão).
- **Empty states** desenhados: sem concurso, disciplina sem tópicos, sem
  sessões, nada para revisar.
- **Ação otimista com rollback** para: concluir/desconcluir tópico e parar
  cronômetro.

## Estratégia de testes

- **Unitário (TDD)** — núcleo do sub-projeto: funções puras de `progresso/`
  (cobertura, cobertura ponderada, aproveitamento, tempo por período) e
  `parseEditalTexto`. Casos de borda listados acima.
- **Componente** (@testing-library/react-native): cards do painel renderizam
  com dados fornecidos; toggle de conclusão de tópico; iniciar/pausar/retomar
  cronômetro; formulário de sessão de exercício com validação.
- **Integração** (Supabase local): políticas RLS (usuário A não lê dado de
  B), cascata de deleção, `assunto_id` inválido rejeitado, trigger de
  `concluido_em`.
- **E2E:** fora do escopo do #1.

## Fora do escopo do #1

OCR / upload de PDF real; motor de repetição espaçada; plano de estudos
automático; flashcards; Pomodoro / Modo Foco; gamificação (streak, XP,
medalhas); celebrações com confete; widget na tela inicial; backup em nuvem
(Drive/iCloud); exportação de relatórios PDF/CSV; links e importação de
questões externas; integração com calendário; sincronização offline;
notificações push; múltiplos editais simultâneos; login Apple e Facebook;
busca global.
