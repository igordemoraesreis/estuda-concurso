# Acompanhamento Avançado + Identidade Visual (sub-projeto #1.5)

**Data:** 2026-09-09
**Status:** Aprovado para planejamento de implementação
**Depende de:** sub-projeto #1 (Fundação) — já mergeado em `master`
**Referência analisada:** `docs/analise-referencia-gran-verticalizado.md` (Edital Verticalizado da Gran Concursos)

## Contexto

O sub-projeto #1 entregou a estrutura funcional do app (edital, conclusão, cronômetro,
exercícios, painel de progresso, revisão por data) com um visual deliberadamente cru.

Este sub-projeto #1.5 faz duas coisas ao mesmo tempo:

1. **Fecha as lacunas funcionais** identificadas contra o software de referência da Gran:
   contagem regressiva pra prova, metas semanais, "tipo de estudo", observação visível,
   histórico global, filtros no painel e no edital.
2. **Passada de design completa**: identidade visual (paleta, tipografia, cor por
   disciplina) aplicada em **todas** as ~15 telas.

Faz-se junto porque várias telas são novas e é melhor nascerem no visual definitivo, e
porque a passada de design toca os mesmos arquivos.

## Decisões do produto

- **Navegação:** o Painel vira o hub (contagem regressiva + metas + desempenho + por
  disciplina). O **Histórico** ganha uma 5ª aba. Abas finais: Painel · Edital · Revisar ·
  Histórico · Ajustes.
- **Modelo de sessão de estudo UNIFICADO:** `sessoes_estudo` e `sessoes_exercicio` (do #1)
  viram uma única tabela `registros_estudo`. Uma entrada = tempo (opcional) + questões
  (acertos/erros) + tipo + observação + origem. É como o usuário estuda de verdade.
- **Metas semanais:** 4 metas — Horas/semana, Questões/semana, Conclusão do edital (%),
  Aproveitamento (%). As duas primeiras zeram toda semana; as duas últimas são alvos
  acumulados. **Semana começa no domingo.** O usuário define cada meta; o "real" é sempre
  calculado das `registros_estudo`, nunca armazenado.
- **Contagem regressiva:** dias até `concursos.data_prova`. Some se a data não estiver
  preenchida. Estados: "N dias", "Hoje!", "Passou". Editável em Ajustes.
- **Tipo de estudo:** 6 categorias fixas — Teoria, Questões, Simulado, Lei Seca,
  Jurisprudência, Discursiva. Obrigatório ao registrar (default `Teoria` pré-selecionado).
- **Histórico global:** lista cronológica de `registros_estudo`, filtrável por disciplina e
  período (7/14/30/tudo). Cada registro pode ser **editado e apagado** por lá.
- **Filtro de período no Painel:** 7 / 14 / 30 dias / tudo — afeta os números de desempenho
  (cobertura de sessão, aproveitamento, tempo) e a quebra por disciplina.
- **Filtros no Edital:** Todos / Pendentes / Concluídos / Com questões + botão
  expandir/recolher todas as disciplinas.
- **Cor por disciplina:** cada disciplina tem uma cor (`disciplinas.cor`), atribuída em
  rodízio de uma paleta de 10 na criação, editável em Ajustes. Usada em bolinhas, bordas,
  badges do histórico e barras "por disciplina".

## Identidade visual

- **Base:** azul-marinho `#12234a`.
  - Tema claro: fundo off-white, cards brancos, texto `#12234a`.
  - Tema escuro: fundo quase-preto azulado `#0b1226`, cards um tom acima (`#0e1730` /
    `#152146`), texto branco-suave.
- **Acento reservado:** violeta `#7c3aed` + lima `#bef264`. Aparece **apenas** em contextos
  de conquista/celebração (streak, meta batida, confete futuro). **Não** no dia a dia.
- **Semânticas:** verde `#059669` (progresso/acerto), vermelho `#dc2626` (erro), âmbar
  `#d97706` (atenção).
- **Faixas de %:** verde ≥ 70 · âmbar ≥ 50 · vermelho < 50 (pílulas).
- **Tipografia** (Google Fonts via `expo-font`):
  - Títulos e números grandes: **Lora** (serif, pesos 600–700).
  - Corpo, labels, botões: **Inter**.
- **Paleta de disciplina** (10 cores, rodízio): `#c8102e`, `#0ea5e9`, `#7c3aed`, `#059669`,
  `#d97706`, `#db2777`, `#0d9488`, `#65a30d`, `#4f46e5`, `#ea580c`.

## Arquitetura

### Stack

Sem mudança de stack. Adiciona: `expo-font` + `@expo-google-fonts/lora` +
`@expo-google-fonts/inter` (carregamento de fontes).

### Modelo de dados

#### Nova tabela `registros_estudo` (substitui `sessoes_estudo` + `sessoes_exercicio`)

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid, PK | |
| `user_id` | uuid | FK `auth.users`, `on delete cascade`; RLS |
| `topico_id` | uuid | FK `topicos`, `on delete cascade` |
| `data` | date | dia do estudo |
| `iniciada_em` | timestamptz, nullable | preenchido quando veio do cronômetro |
| `duracao_segundos` | int, nullable | `check (duracao_segundos is null or duracao_segundos >= 0)`. null = registro só de questões |
| `tipo` | text | `check (tipo in ('Teoria','Questões','Simulado','Lei Seca','Jurisprudência','Discursiva'))` |
| `acertos` | int, not null, default 0 | `check (acertos >= 0)` |
| `erros` | int, not null, default 0 | `check (erros >= 0)` |
| `nota` | text, nullable | observação |
| `origem` | text | `check (origem in ('cronometro','manual'))` |
| `created_at` | timestamptz, default now() | |

- `check (duracao_segundos is not null or acertos + erros > 0)` — um registro tem tempo OU questões (ou os dois).
- Índice em `(topico_id)` e `(user_id, data)`.
- RLS: `user_id = auth.uid()` para todas as operações.

#### `disciplinas` — nova coluna

| Campo | Tipo | Notas |
|---|---|---|
| `cor` | text, not null, default `'#12234a'` | hex; atribuída em rodízio da paleta na criação |

#### Nova tabela `metas`

| Campo | Tipo | Notas |
|---|---|---|
| `concurso_id` | uuid, PK | FK `concursos`, `on delete cascade`; uma linha por concurso |
| `user_id` | uuid | RLS |
| `meta_horas_semana` | numeric, nullable | |
| `meta_questoes_semana` | int, nullable | |
| `meta_conclusao_pct` | int, nullable | 0–100 |
| `meta_aproveitamento_pct` | int, nullable | 0–100 |
| `updated_at` | timestamptz | |

- RLS: `user_id = auth.uid()`.
- Sem trigger de criação: a linha é criada por **upsert** quando o usuário salva uma meta pela
  primeira vez. Enquanto não existe, o Painel trata como "sem metas definidas".

#### `concursos.data_prova` — já existe (#1)

Passa a ser lida (contagem regressiva) e fica editável em Ajustes.

### Migração

Migração `NNNN_registros_estudo.sql` (aplicada na nuvem via `supabase db push`):

1. `create table registros_estudo (...)` + RLS + índices.
2. `alter table disciplinas add column cor text not null default '#12234a';`
3. `create table metas (...)` + RLS.
4. Copiar dados:
   ```sql
   insert into registros_estudo (user_id, topico_id, data, iniciada_em, duracao_segundos, tipo, acertos, erros, nota, origem, created_at)
   select user_id, topico_id, iniciada_em::date, iniciada_em, duracao_segundos, 'Teoria', 0, 0, nota, origem, created_at
   from sessoes_estudo;

   insert into registros_estudo (user_id, topico_id, data, iniciada_em, duracao_segundos, tipo, acertos, erros, nota, origem, created_at)
   select user_id, topico_id, data, null, null, 'Questões', acertos, erros, nota, 'manual', created_at
   from sessoes_exercicio;
   ```
5. Backfill `disciplinas.cor` — rodízio da paleta por `ordem` dentro de cada concurso
   (via `update ... from (select id, row_number() over (partition by concurso_id order by ordem) ...)`).
6. `drop table sessoes_estudo; drop table sessoes_exercicio;`
7. Regenerar `src/types/db.ts`.

O banco de dev na nuvem já tem dados de teste (do preview) — a migração converte esses dados.

### Funções de métrica (`src/features/progresso/metrics.ts`)

Reescritas para ler de `registros_estudo` (fonte única) e aceitar uma **janela de período**:

```ts
export type Janela = 7 | 14 | 30 | null; // null = tudo

export type RegistroLite = {
  topicoId: string; disciplinaId: string; data: string;
  duracaoSegundos: number | null; acertos: number; erros: number;
};

// já existentes, ajustados:
coberturaEdital(topicos): { geral, porDisciplina }          // inalterado (usa topicos)
coberturaPonderada(disciplinas, topicos): number            // inalterado
aproveitamento(registros: RegistroLite[], topicos, janela?): { geral, porDisciplina }
tempoEstudado(registros: RegistroLite[], topicos, janela?, agora?): { totalSegundos, porDisciplina }

// novos:
export function realMetas(
  registros: RegistroLite[], topicos: TopicoLite[], disciplinas: DisciplinaLite[], agora?: Date
): { horasSemana: number; questoesSemana: number; conclusaoPct: number; aproveitamentoPct: number };
// semana = domingo 00:00 até agora

export function diasParaProva(dataProva: string | null, agora?: Date):
  { dias: number; estado: 'futuro' | 'hoje' | 'passado' } | null;

export function agruparHistorico(
  registros: RegistroLiteFull[], filtroDisciplina: string | null, janela: Janela, agora?: Date
): { resumo: { dias: number; totalSegundos: number; totalQuestoes: number; mediaDiariaSegundos: number };
    itens: RegistroLiteFull[] };
```

Todas puras, testadas com TDD.

## Telas

### Painel (`app/(app)/index.tsx`) — repaginado, vira o hub

Ordem (uma tela rolável):
1. Título (concurso) + banca/cargo — serif
2. **CountdownCard** — "Prova em · <data> · <dia da semana>" + número grande de dias. Oculto se `data_prova` null.
3. *(streak: elemento reservado para o #6 — NÃO implementar aqui)*
4. **Seção "Metas da semana"** — grid 2×2 de `MetaCard`:
   - Coluna esquerda: Horas · Questões (esforço da semana)
   - Coluna direita: Conclusão edital · Aproveitamento (% acumulado)
   - Cada `MetaCard`: label, "real / meta", barra. Sem meta definida → mostra só o real + link "definir meta" (leva a Ajustes).
5. **Seção "Desempenho"** — chips de período (7/14/30/tudo) + card com cobertura do edital
   (%), aproveitamento, tempo (na janela), cobertura ponderada.
6. **Seção "Por disciplina"** — lista: bolinha da cor, nome (serif), % de cobertura (pílula
   com faixa de cor). Toca → abre a disciplina no Edital.
- Empty state se não há disciplinas.

### Histórico (`app/(app)/historico.tsx`) — nova, 5ª aba

- Resumo (respeitando o filtro): dias estudados · total de horas · total de questões · média
  diária.
- Filtros: `Select` de disciplina + chips de período (7/14/30/tudo).
- Lista de `registros_estudo` (mais recente primeiro): data · badge de disciplina (cor) ·
  tópico · tipo · tempo · questões (`8/10 · 80%`) · observação (truncada) · origem.
- Cada item: **editar** (form modal/tela com todos os campos) e **apagar** (confirmação via `Alert`).
- Empty state.
- `src/features/historico/{api,hooks}.ts`, `HistoricoItem.tsx`, `EditarRegistro.tsx`.

### Tópico (`app/(app)/edital/topico/[id].tsx`) — repaginado + fluxo unificado

- Nome, disciplina (com cor), switch "Concluído" (update otimista — mantido do #1).
- **Bloco "Registrar estudo"** (um só, substitui os dois blocos do #1):
  - Cronômetro: iniciar / pausar / retomar / **parar**. Ao parar → abre o form de finalização:
    tipo (default Teoria), acertos, erros, observação, **agendar revisão** (7/15/21/30/custom).
    Confirma → cria UM `registro_estudo` (`origem: 'cronometro'`) + agenda revisões.
  - **Registro manual:** data (default hoje, local) + minutos + os mesmos campos → cria UM
    `registro_estudo` (`origem: 'manual'`, `duracao_segundos` = minutos·60, ou null se 0).
- Lista dos `registros_estudo` desse tópico (com editar/apagar).
- Cronômetro continua persistente (store Zustand + AsyncStorage) — mantido do #1; o form de
  finalização é o novo.
- `src/features/estudo/*` reescrito sobre `registros_estudo`.

### Edital (`app/(app)/edital/index.tsx`) — repaginado + filtros

- Barra de filtros: Todos / Pendentes / Concluídos / Com questões.
- Botão expandir/recolher todas.
- `EditalTree` usa `disciplina.cor` nas bordas/dots.

### Ajustes (`app/(app)/ajustes.tsx`) — novos campos

Além do que já tem (#1): tema, limiares de revisão, arquivar/trocar concurso, sair.
- **Data da prova** — date input, grava `concursos.data_prova`.
- **Metas** — 4 inputs numéricos, upsert em `metas`.
- **Cores das disciplinas** — lista com um seletor de cor por disciplina (paleta de 10),
  grava `disciplinas.cor`.

### Revisar (`app/(app)/revisar.tsx`) + auth/onboarding

Repaginadas para o visual novo. Sem mudança de função. A revisão continua a "lista simples
por data" do #1 (a inteligente é o #3); o agendamento manual (7/15/21/30/custom) no fluxo de
finalização do cronômetro alimenta a mesma tabela de revisões.

## Sistema de componentes (`src/components/ui/`)

**Restilizados** (herdam tokens novos): Button, Card, Input, ProgressBar, EmptyState, Stat, Toast.

**Novos:**
- `Pill` — valor de % com faixa de cor (verde/âmbar/vermelho) por limiar.
- `MetaCard` — label, real/meta, barra de progresso; variante "sem meta".
- `CountdownCard` — data + dias grandes; estados hoje/passado.
- `DisciplinaDot` — bolinha da cor da disciplina (+ variante com nome).
- `PeriodoChips` — seletor 7/14/30/tudo.
- `TipoEstudoSelect` — seletor das 6 categorias.

**Tema (`src/theme/`):**
- `tokens.ts` reescrito (paleta nova, `disciplinaPalette`, faixas de %).
- `fonts.ts` — carrega Lora + Inter via `expo-font`; `useAppFonts()` hook; splash até carregar.
- `ThemeProvider` — inalterado na API; só os valores mudam.

## Tratamento de erros

Mantém o padrão do #1 (`MutationCache` global com toast de erro; `normalizeError` PT-BR;
empty states; ação otimista com rollback para conclusão de tópico). Adiciona empty states e
estados de erro para: Histórico vazio, sem metas definidas, sem data de prova.

## Estratégia de testes

- **Integração (nuvem):** migração aplica limpo; contagem de linhas `sessoes_*` → `registros_estudo`
  bate; RLS em `registros_estudo` e `metas`; cascata (apagar tópico → apaga registros);
  `disciplinas.cor` backfill não-nulo.
- **Unitário (TDD):** todas as funções de `metrics.ts` reescritas/novas — `aproveitamento` e
  `tempoEstudado` com janela; `realMetas` (semana domingo, os 4 valores); `diasParaProva`
  (futuro/hoje/passado, timezone local); `agruparHistorico` (resumo + filtros).
- **Componente:** `MetaCard` (real vs meta, variante sem meta), `CountdownCard` (3 estados),
  `Pill` (faixas), filtros do Histórico, filtros do Edital, fluxo "parar cronômetro → form →
  cria registro", editar/apagar registro no Histórico, `TipoEstudoSelect`.
- **Visual:** `npm run build:web && npm run preview` — screenshots de todas as telas no visual
  novo (claro + escuro), conferidas manualmente.
- **Regressão:** toda a suíte do #1 tem que continuar verde após a migração e a repaginação
  (ajustando os testes que referenciam `sessoes_estudo`/`sessoes_exercicio`).

## Fora do escopo do #1.5

Repetição espaçada de verdade (#3); OCR / upload de PDF (#2); flashcards (#5); Pomodoro /
Modo Foco (#6); gamificação — streak, XP, medalhas, confete (#6 — só o *token* de acento
violeta/lima fica definido aqui, sem lógica); calendário mensal; export PDF/CSV (#18); export
pra calendário (#21); links pra bancos de questões externos (#19); metas por disciplina;
edição inline de questões na tabela do edital (mantemos o fluxo mobile de uma tela por tópico).
