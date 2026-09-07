# Fundação — App de estudo para concurseiros — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar o app mobile (React Native + Expo) com cadastro manual do edital por texto colado, marcação de conclusão de tópicos, cronômetro de estudo, registro agregado de exercícios, painel de progresso e lista de revisão por data — tudo apoiado em Supabase com RLS.

**Architecture:** App Expo (Expo Router, file-based) com Supabase como backend-of-record (Postgres + Auth), segurança via RLS por `user_id`. Dados do servidor via TanStack Query; estado local mínimo (cronômetro, override de tema) via Zustand. Métricas de progresso calculadas no cliente por funções puras testáveis. Um edital ativo por vez.

**Tech Stack:** Expo SDK (via `create-expo-app@latest`), TypeScript (strict), Expo Router, NativeWind v4, @supabase/supabase-js, expo-secure-store, @tanstack/react-query, zustand, react-hook-form, zod, jest-expo, @testing-library/react-native, Supabase CLI (stack local para testes de integração).

**Spec:** `docs/superpowers/specs/2026-09-07-fundacao-app-concurseiros-design.md`

## Global Constraints

- **Escopo = sub-projeto #1 apenas.** Fora do escopo (não implementar): OCR/upload de PDF real, motor de repetição espaçada, plano automático, flashcards, Pomodoro, gamificação, confete, widget, backup em nuvem, exportação PDF/CSV, links/importação de questões, calendário, sync offline, push, múltiplos editais simultâneos, login Apple/Facebook, busca global.
- **Idioma da UI e das mensagens de erro: PT-BR.**
- **Expo SDK:** o que `create-expo-app@latest` instalar (SDK 54 ou mais novo). Não fazer downgrade.
- **TypeScript strict** (`"strict": true` no `tsconfig.json`).
- **Expo Router** com estrutura de pastas em `app/` (grupos `(auth)`, `(app)`, mais `onboarding/`).
- **NativeWind v4** para estilo; cores/tipografia/espaçamento vêm de tokens em `src/theme/tokens.ts`. Nenhum valor de cor hard-coded em componentes.
- **Um edital ativo por vez:** `profiles.active_concurso_id` aponta para um `concursos` com `status = 'ativo'`.
- **RLS obrigatório** em todas as tabelas: política `user_id = auth.uid()` para `select`, `insert`, `update`, `delete`.
- **Peso da disciplina:** inteiro 1–5, default 3, constraint no banco.
- **Hierarquia:** disciplina (sempre) → assunto (opcional) → tópico (folha, sempre sob uma disciplina).
- **Exercícios:** sessões agregadas (`data`, `acertos`, `erros`). Sem questão-a-questão.
- **Commits frequentes:** um commit por passo "Commit" do plano. Mensagens em PT-BR, prefixo convencional (`feat:`, `test:`, `chore:`, `fix:`, `docs:`).
- **Atribuição de commit:** terminar a mensagem com
  `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`
- **TDD:** todo comportamento com lógica (parser, métricas, store do cronômetro, triggers de banco) começa por um teste que falha.

---

## File Structure

### Configuração e raiz

| Arquivo | Responsabilidade |
|---|---|
| `package.json` | Dependências e scripts (`start`, `test`, `test:integration`, `lint`, `typecheck`) |
| `app.json` / `app.config.ts` | Config do Expo (nome, slug, scheme para deep link do OAuth) |
| `tsconfig.json` | TS strict + alias `@/*` → `src/*` |
| `babel.config.js` | Preset Expo + plugin NativeWind |
| `metro.config.js` | Wrapper NativeWind |
| `tailwind.config.js` | Consome tokens de `src/theme/tokens.ts` |
| `global.css` | Diretivas `@tailwind` |
| `nativewind-env.d.ts` | Tipos do NativeWind |
| `jest.config.js` | Preset `jest-expo`, `setupFilesAfterEnv` |
| `jest.setup.js` | Mocks globais (secure-store, async-storage, supabase) |
| `jest.config.integration.js` | Config separada para testes contra Supabase local |
| `.env` (git-ignored) / `.env.example` | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` |

### `app/` (rotas)

| Arquivo | Responsabilidade |
|---|---|
| `app/_layout.tsx` | Providers (QueryClient, ThemeProvider, SafeArea); hidrata sessão; redireciona por estado de auth |
| `app/(auth)/_layout.tsx` | Stack simples das telas de auth |
| `app/(auth)/sign-in.tsx` | Login: Google + e-mail/senha |
| `app/(auth)/sign-up.tsx` | Cadastro por e-mail/senha |
| `app/onboarding/novo-concurso.tsx` | Wizard de cadastro do edital (4 passos) |
| `app/(app)/_layout.tsx` | Tab navigator; gate de sessão + concurso ativo |
| `app/(app)/index.tsx` | Painel (dashboard) |
| `app/(app)/edital/index.tsx` | Árvore do edital |
| `app/(app)/edital/disciplina/[id].tsx` | Detalhe da disciplina (tópicos, peso) |
| `app/(app)/edital/topico/[id].tsx` | Detalhe do tópico (concluir, cronômetro, sessões) |
| `app/(app)/revisar.tsx` | Lista de revisão por data |
| `app/(app)/ajustes.tsx` | Perfil, trocar/arquivar concurso, tema (placeholder) |

### `src/`

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/supabase.ts` | Cliente Supabase único + storage adapter (secure-store) |
| `src/lib/query.ts` | `QueryClient` configurado + chaves de query |
| `src/lib/errors.ts` | `AppError` + `normalizeError(unknown): AppError` (mensagens PT-BR) |
| `src/theme/tokens.ts` | Tokens: cores (light/dark), espaçamento, raio, tipografia |
| `src/theme/ThemeProvider.tsx` | Contexto de tema (segue sistema; override em memória/Zustand) |
| `src/components/ui/Button.tsx` | Botão (variantes: primary, secondary, ghost, danger) |
| `src/components/ui/Card.tsx` | Container com padding/raio/sombra do token |
| `src/components/ui/Input.tsx` | Campo de texto controlado + rótulo + erro |
| `src/components/ui/ProgressBar.tsx` | Barra de progresso 0–1 |
| `src/components/ui/EmptyState.tsx` | Ilustração + título + descrição + ação opcional |
| `src/components/ui/Toast.tsx` + `ToastProvider` | Fila de toasts (sucesso/erro) |
| `src/components/ui/Stat.tsx` | Rótulo + valor grande + sub-rótulo (usado no painel) |
| `src/features/auth/useSession.ts` | Hook: sessão atual + `signInWithGoogle`, `signInWithPassword`, `signUp`, `signOut` |
| `src/features/auth/AuthGate.tsx` | Componente de redirecionamento por estado |
| `src/features/concurso/parseEditalTexto.ts` | Função pura: texto → rascunho de árvore |
| `src/features/concurso/schema.ts` | Schemas zod (concurso, disciplina, árvore) |
| `src/features/concurso/api.ts` | Queries/mutations: concurso ativo, criar concurso+árvore, arquivar, trocar |
| `src/features/concurso/hooks.ts` | Hooks TanStack Query sobre `api.ts` |
| `src/features/edital/api.ts` | CRUD de disciplina/assunto/tópico |
| `src/features/edital/hooks.ts` | Hooks correspondentes |
| `src/features/edital/EditalTree.tsx` | Render recursivo da árvore |
| `src/features/estudo/timerStore.ts` | Store Zustand do cronômetro + persistência AsyncStorage |
| `src/features/estudo/TimerPill.tsx` | Pílula flutuante global |
| `src/features/estudo/api.ts` | Inserir `sessoes_estudo` (cronômetro e manual); listar por tópico |
| `src/features/estudo/hooks.ts` | Hooks correspondentes |
| `src/features/exercicios/api.ts` | Inserir/listar `sessoes_exercicio` |
| `src/features/exercicios/hooks.ts` | Hooks correspondentes |
| `src/features/exercicios/schema.ts` | Schema zod da sessão de exercício |
| `src/features/progresso/metrics.ts` | Funções puras de métrica |
| `src/features/progresso/hooks.ts` | Carrega dados do concurso e aplica `metrics.ts` |
| `src/features/revisao/hooks.ts` | Query de tópicos concluídos além do limiar |
| `src/features/settings/hooks.ts` | Ler/gravar `profiles.settings` (limiares de revisão, tema) |
| `src/types/db.ts` | Tipos gerados do schema Supabase (`supabase gen types`) |
| `src/types/models.ts` | Tipos "Lite" usados pelas métricas e telas |

### `supabase/`

| Arquivo | Responsabilidade |
|---|---|
| `supabase/config.toml` | Config da stack local (gerado por `supabase init`) |
| `supabase/migrations/0001_init.sql` | Extensões, tabelas, constraints, índices |
| `supabase/migrations/0002_rls.sql` | RLS habilitado + políticas |
| `supabase/migrations/0003_triggers.sql` | Trigger `concluido_em`; trigger de validação `assunto_id`; trigger de criação de `profiles` |
| `supabase/seed.sql` | Dados de exemplo para dev |
| `tests/integration/rls.test.ts` | Isolamento entre usuários |
| `tests/integration/cascade.test.ts` | Deleção em cascata e `set null` |
| `tests/integration/triggers.test.ts` | `concluido_em` e validação de `assunto_id` |

---

## Task 1: Scaffold do projeto Expo + TypeScript + Expo Router + NativeWind + Jest

**Files:**
- Create: `package.json`, `app.json`, `tsconfig.json`, `babel.config.js`, `metro.config.js`, `tailwind.config.js`, `global.css`, `nativewind-env.d.ts`, `jest.config.js`, `jest.setup.js`, `.env.example`, `.gitignore`
- Create: `app/_layout.tsx`, `app/index.tsx` (placeholder temporário)
- Create: `src/theme/tokens.ts`
- Test: `__tests__/smoke.test.tsx`

**Interfaces:**
- Consumes: nada (primeira task)
- Produces: `tsconfig` com alias `@/*` → `src/*`; scripts npm `start`, `test`, `typecheck`, `lint`; preset de teste `jest-expo`; `src/theme/tokens.ts` exportando `tokens`

- [ ] **Step 1: Criar o app Expo**

Se o diretório não estiver vazio (já tem `docs/`, `supabase/`, `.git`), rode em pasta temporária e mova:

```bash
npx create-expo-app@latest /tmp/scaffold --template blank-typescript
cp -r /tmp/scaffold/. .
rm -rf /tmp/scaffold App.tsx
```

- [ ] **Step 2: Instalar dependências**

```bash
npx expo install expo-router expo-linking expo-constants expo-status-bar react-native-safe-area-context react-native-screens expo-secure-store @react-native-async-storage/async-storage
npm install @supabase/supabase-js @tanstack/react-query zustand react-hook-form zod nativewind
npm install -D tailwindcss@3 jest-expo jest @testing-library/react-native @testing-library/jest-native @types/jest eslint
```

- [ ] **Step 3: Configurar Expo Router**

`package.json` — setar `"main": "expo-router/entry"` e scripts:

```json
{
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "test": "jest",
    "test:integration": "jest --config jest.config.integration.js",
    "typecheck": "tsc --noEmit",
    "lint": "eslint ."
  }
}
```

`app.json` — adicionar plugin e scheme:

```json
{
  "expo": {
    "name": "Estuda Concurso",
    "slug": "estuda-concurso",
    "scheme": "estudaconcurso",
    "plugins": ["expo-router", "expo-secure-store"],
    "ios": { "supportsTablet": true, "bundleIdentifier": "com.estudaconcurso.app" },
    "android": { "package": "com.estudaconcurso.app" }
  }
}
```

- [ ] **Step 4: Configurar NativeWind**

`tailwind.config.js`:

```js
const { tokens } = require('./src/theme/tokens');

module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: tokens.colors,
      spacing: tokens.spacing,
      borderRadius: tokens.radius,
      fontSize: tokens.fontSize,
    },
  },
  plugins: [],
};
```

`global.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

`babel.config.js`:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  };
};
```

`metro.config.js`:

```js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: './global.css' });
```

`nativewind-env.d.ts`:

```ts
/// <reference types="nativewind/types" />
```

- [ ] **Step 5: Criar tokens de tema**

`src/theme/tokens.ts`:

```ts
export const tokens = {
  colors: {
    bg: { light: '#FFFFFF', dark: '#0B0F14' },
    surface: { light: '#F4F6F8', dark: '#151B22' },
    border: { light: '#E2E6EA', dark: '#26313C' },
    text: { light: '#0B0F14', dark: '#F4F6F8' },
    muted: { light: '#5B6B78', dark: '#93A4B3' },
    primary: { light: '#2563EB', dark: '#3B82F6' },
    success: { light: '#16A34A', dark: '#22C55E' },
    danger: { light: '#DC2626', dark: '#EF4444' },
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48 },
  radius: { sm: 6, md: 10, lg: 16, full: 9999 },
  fontSize: { xs: 12, sm: 14, base: 16, lg: 20, xl: 26, '2xl': 34 },
} as const;

export type Tokens = typeof tokens;
```

- [ ] **Step 6: `tsconfig.json` com strict + alias**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

- [ ] **Step 7: Layout raiz placeholder**

`app/_layout.tsx`:

```tsx
import '../global.css';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

`app/index.tsx`:

```tsx
import { Text, View } from 'react-native';

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-lg">Estuda Concurso</Text>
    </View>
  );
}
```

- [ ] **Step 8: Configurar Jest**

`jest.config.js`:

```js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect', '<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|nativewind|@supabase/.*))',
  ],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
};
```

`jest.setup.js`:

```js
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
```

- [ ] **Step 9: Escrever o teste de fumaça**

`__tests__/smoke.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react-native';
import Index from '../app/index';

test('a tela inicial renderiza o nome do app', () => {
  render(<Index />);
  expect(screen.getByText('Estuda Concurso')).toBeOnTheScreen();
});
```

- [ ] **Step 10: Rodar teste e typecheck**

Run: `npm test && npm run typecheck`
Expected: teste PASSA; `tsc` sem erros.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "chore: scaffold Expo + Expo Router + NativeWind + Jest"
```

---

## Task 2: Schema do banco (tabelas, constraints, índices)

**Files:**
- Create: `supabase/migrations/0001_init.sql`, `supabase/seed.sql`
- Test: `tests/integration/schema.test.ts`, `tests/integration/helpers.ts`, `jest.config.integration.js`

**Interfaces:**
- Consumes: nada
- Produces: tabelas `profiles, concursos, disciplinas, assuntos, topicos, sessoes_estudo, sessoes_exercicio`; stack local em `http://localhost:54321`; helper `makeUser(email)` e `admin()` para os testes de integração

- [ ] **Step 1: Inicializar Supabase local**

```bash
npx supabase init
npx supabase start
```

Crie `.env` com `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` da saída de `supabase status`. Adicione ao `.env.example` os nomes das variáveis sem valores.

- [ ] **Step 2: Config de teste de integração + helpers**

```bash
npm install -D ts-jest
```

`jest.config.integration.js`:

```js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
};
```

`tests/integration/helpers.ts`:

```ts
import { createClient } from '@supabase/supabase-js';

export const URL = process.env.SUPABASE_URL ?? 'http://localhost:54321';
export const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
export const ANON_KEY = process.env.SUPABASE_ANON_KEY!;

export const admin = () =>
  createClient(URL, SERVICE_KEY, { auth: { persistSession: false } });

export async function makeUser(email: string) {
  const a = admin();
  const { data, error } = await a.auth.admin.createUser({
    email, password: 'senha-forte-123', email_confirm: true,
  });
  if (error) throw error;
  const client = createClient(URL, ANON_KEY, { auth: { persistSession: false } });
  await client.auth.signInWithPassword({ email, password: 'senha-forte-123' });
  return { id: data.user!.id, client };
}
```

- [ ] **Step 3: Escrever o teste que falha**

`tests/integration/schema.test.ts`:

```ts
import { admin } from './helpers';

test('as tabelas do schema existem', async () => {
  const a = admin();
  for (const t of ['profiles','concursos','disciplinas','assuntos','topicos','sessoes_estudo','sessoes_exercicio']) {
    const { error } = await a.from(t).select('*').limit(0);
    expect(error).toBeNull();
  }
});

test('peso da disciplina rejeita valor fora de 1..5', async () => {
  const a = admin();
  const { data: u } = await a.auth.admin.createUser({ email: `s${Date.now()}@x.com`, password: 'senha-forte-123', email_confirm: true });
  const uid = u.user!.id;
  const { data: c } = await a.from('concursos').insert({ user_id: uid, nome: 'C', status: 'ativo' }).select().single();
  const { error } = await a.from('disciplinas').insert({ user_id: uid, concurso_id: c!.id, nome: 'D', peso: 9, ordem: 0 });
  expect(error).not.toBeNull();
});
```

- [ ] **Step 4: Rodar e ver falhar**

Run: `SUPABASE_SERVICE_ROLE_KEY=<key> SUPABASE_ANON_KEY=<key> npm run test:integration -- schema`
Expected: FALHA — tabelas não existem.

- [ ] **Step 5: Escrever a migração**

`supabase/migrations/0001_init.sql`:

```sql
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
```

`supabase/seed.sql`: apenas `-- seed populado na Task 8`.

- [ ] **Step 6: Aplicar e rodar teste**

```bash
npx supabase db reset
SUPABASE_SERVICE_ROLE_KEY=<key> SUPABASE_ANON_KEY=<key> npm run test:integration -- schema
```

Expected: PASSA.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: schema inicial do banco (tabelas, constraints, indices)"
```

---

## Task 3: RLS + triggers (profiles no signup, concluido_em, validação de assunto_id)

**Files:**
- Create: `supabase/migrations/0002_rls.sql`, `supabase/migrations/0003_triggers.sql`
- Test: `tests/integration/rls.test.ts`, `tests/integration/triggers.test.ts`, `tests/integration/cascade.test.ts`

**Interfaces:**
- Consumes: tabelas da Task 2; helper `makeUser` da Task 2
- Produces: RLS ativo (`user_id = auth.uid()`; `profiles` usa `id = auth.uid()`); `profiles` criado no signup; `concluido_em` sincronizado; `assunto_id` validado

- [ ] **Step 1: Testes que falham**

`tests/integration/rls.test.ts`:

```ts
import { makeUser } from './helpers';

test('usuário não lê concurso de outro usuário', async () => {
  const a = await makeUser(`a${Date.now()}@x.com`);
  const b = await makeUser(`b${Date.now()}@x.com`);
  await a.client.from('concursos').insert({ user_id: a.id, nome: 'Da A', status: 'ativo' });
  const { data } = await b.client.from('concursos').select('*');
  expect(data).toEqual([]);
});

test('usuário não insere linha com user_id de outro', async () => {
  const a = await makeUser(`c${Date.now()}@x.com`);
  const b = await makeUser(`d${Date.now()}@x.com`);
  const { error } = await b.client.from('concursos').insert({ user_id: a.id, nome: 'X', status: 'ativo' });
  expect(error).not.toBeNull();
});
```

`tests/integration/triggers.test.ts`:

```ts
import { makeUser } from './helpers';

async function baseTree(u: { id: string; client: any }) {
  const { data: c } = await u.client.from('concursos').insert({ user_id: u.id, nome: 'C', status: 'ativo' }).select().single();
  const { data: d } = await u.client.from('disciplinas').insert({ user_id: u.id, concurso_id: c.id, nome: 'D', ordem: 0 }).select().single();
  return { c, d };
}

test('concluido_em preenche ao concluir e limpa ao desmarcar', async () => {
  const u = await makeUser(`t${Date.now()}@x.com`);
  const { d } = await baseTree(u);
  const { data: t } = await u.client.from('topicos').insert({ user_id: u.id, disciplina_id: d.id, nome: 'T', ordem: 0 }).select().single();

  await u.client.from('topicos').update({ concluido: true }).eq('id', t.id);
  const { data: r1 } = await u.client.from('topicos').select('concluido_em').eq('id', t.id).single();
  expect(r1.concluido_em).not.toBeNull();

  await u.client.from('topicos').update({ concluido: false }).eq('id', t.id);
  const { data: r2 } = await u.client.from('topicos').select('concluido_em').eq('id', t.id).single();
  expect(r2.concluido_em).toBeNull();
});

test('assunto_id de outra disciplina é rejeitado', async () => {
  const u = await makeUser(`t2${Date.now()}@x.com`);
  const { c, d } = await baseTree(u);
  const { data: d2 } = await u.client.from('disciplinas').insert({ user_id: u.id, concurso_id: c.id, nome: 'D2', ordem: 1 }).select().single();
  const { data: a2 } = await u.client.from('assuntos').insert({ user_id: u.id, disciplina_id: d2.id, nome: 'A2', ordem: 0 }).select().single();
  const { error } = await u.client.from('topicos').insert({ user_id: u.id, disciplina_id: d.id, assunto_id: a2.id, nome: 'T', ordem: 0 });
  expect(error).not.toBeNull();
});

test('profiles é criado automaticamente no signup', async () => {
  const u = await makeUser(`p${Date.now()}@x.com`);
  const { data } = await u.client.from('profiles').select('id').eq('id', u.id).single();
  expect(data.id).toBe(u.id);
});
```

`tests/integration/cascade.test.ts`:

```ts
import { makeUser } from './helpers';

test('apagar concurso apaga disciplinas, tópicos e sessões', async () => {
  const u = await makeUser(`cas${Date.now()}@x.com`);
  const { data: c } = await u.client.from('concursos').insert({ user_id: u.id, nome: 'C', status: 'ativo' }).select().single();
  const { data: d } = await u.client.from('disciplinas').insert({ user_id: u.id, concurso_id: c.id, nome: 'D', ordem: 0 }).select().single();
  const { data: t } = await u.client.from('topicos').insert({ user_id: u.id, disciplina_id: d.id, nome: 'T', ordem: 0 }).select().single();
  await u.client.from('sessoes_estudo').insert({ user_id: u.id, topico_id: t.id, iniciada_em: new Date().toISOString(), duracao_segundos: 60, origem: 'manual' });

  await u.client.from('concursos').delete().eq('id', c.id);

  const { data: rest } = await u.client.from('sessoes_estudo').select('*').eq('topico_id', t.id);
  expect(rest).toEqual([]);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `... npm run test:integration -- rls triggers cascade`
Expected: FALHA (RLS não ativo; triggers ausentes).

- [ ] **Step 3: Migração de RLS**

`supabase/migrations/0002_rls.sql`:

```sql
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
```

- [ ] **Step 4: Migração de triggers**

`supabase/migrations/0003_triggers.sql`:

```sql
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
```

- [ ] **Step 5: Aplicar e rodar**

```bash
npx supabase db reset
... npm run test:integration -- rls triggers cascade
```

Expected: PASSA.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: RLS por user_id e triggers (profiles, concluido_em, validacao de assunto)"
```

---

## Task 4: Cliente Supabase, normalização de erros e QueryClient

**Files:**
- Create: `src/lib/supabase.ts`, `src/lib/errors.ts`, `src/lib/query.ts`, `src/types/db.ts`
- Test: `src/lib/__tests__/errors.test.ts`

**Interfaces:**
- Consumes: `.env` (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`); schema da Task 2
- Produces:
  - `supabase` (instância `SupabaseClient<Database>` de `@/lib/supabase`)
  - `AppError` = `{ code: 'auth' | 'rede' | 'validacao' | 'permissao' | 'desconhecido'; message: string; cause?: unknown }`
  - `normalizeError(e: unknown): AppError`
  - `queryClient` (de `@/lib/query`) e `qk` (fábrica de chaves): `qk.concursoAtivo()`, `qk.arvore(concursoId)`, `qk.sessoesEstudo(topicoId)`, `qk.sessoesExercicio(topicoId)`, `qk.progresso(concursoId)`, `qk.revisao(concursoId)`, `qk.profile()`

- [ ] **Step 1: Gerar tipos do banco**

```bash
npx supabase gen types typescript --local > src/types/db.ts
```

Isso cria `export type Database = { ... }`.

- [ ] **Step 2: Cliente Supabase**

`src/lib/supabase.ts`:

```ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { Database } from '@/types/db';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// SecureStore tem limite ~2KB por chave; usa AsyncStorage como fallback no nativo.
const storage =
  Platform.OS === 'web'
    ? undefined
    : {
        getItem: (k: string) => SecureStore.getItemAsync(k).catch(() => AsyncStorage.getItem(k)),
        setItem: (k: string, v: string) =>
          SecureStore.setItemAsync(k, v).catch(() => AsyncStorage.setItem(k, v)),
        removeItem: (k: string) =>
          SecureStore.deleteItemAsync(k).catch(() => AsyncStorage.removeItem(k)),
      };

export const supabase = createClient<Database>(url, anon, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

```bash
npx expo install react-native-url-polyfill
```

- [ ] **Step 3: Teste de `normalizeError` que falha**

`src/lib/__tests__/errors.test.ts`:

```ts
import { normalizeError } from '../errors';

test('erro de credencial vira código auth em PT-BR', () => {
  const r = normalizeError({ name: 'AuthApiError', message: 'Invalid login credentials', status: 400 });
  expect(r.code).toBe('auth');
  expect(r.message).toMatch(/e-mail ou senha/i);
});

test('violação de RLS vira permissao', () => {
  const r = normalizeError({ code: '42501', message: 'new row violates row-level security policy' });
  expect(r.code).toBe('permissao');
});

test('erro de rede vira rede', () => {
  const r = normalizeError(new TypeError('Network request failed'));
  expect(r.code).toBe('rede');
});

test('desconhecido tem mensagem genérica', () => {
  const r = normalizeError({});
  expect(r.code).toBe('desconhecido');
  expect(r.message.length).toBeGreaterThan(0);
});
```

- [ ] **Step 4: Rodar e ver falhar**

Run: `npm test -- errors`
Expected: FALHA — módulo não existe.

- [ ] **Step 5: Implementar `errors.ts`**

`src/lib/errors.ts`:

```ts
export type AppErrorCode = 'auth' | 'rede' | 'validacao' | 'permissao' | 'desconhecido';

export interface AppError {
  code: AppErrorCode;
  message: string;
  cause?: unknown;
}

export function normalizeError(e: unknown): AppError {
  const any = e as Record<string, unknown> | null;
  const raw = String(any?.message ?? '');

  if (e instanceof TypeError && /network|fetch/i.test(raw)) {
    return { code: 'rede', message: 'Sem conexão. Verifique a internet e tente de novo.', cause: e };
  }
  if (any?.code === '42501' || /row-level security/i.test(raw)) {
    return { code: 'permissao', message: 'Você não tem permissão para essa ação.', cause: e };
  }
  if (/invalid login credentials/i.test(raw)) {
    return { code: 'auth', message: 'E-mail ou senha incorretos.', cause: e };
  }
  if (/user already registered/i.test(raw)) {
    return { code: 'auth', message: 'Já existe uma conta com esse e-mail.', cause: e };
  }
  if (/password should be at least/i.test(raw)) {
    return { code: 'auth', message: 'A senha precisa ter pelo menos 6 caracteres.', cause: e };
  }
  if (String(any?.name ?? '').startsWith('Auth')) {
    return { code: 'auth', message: 'Não foi possível autenticar. Tente novamente.', cause: e };
  }
  return { code: 'desconhecido', message: 'Algo deu errado. Tente novamente.', cause: e };
}
```

- [ ] **Step 6: Rodar e ver passar**

Run: `npm test -- errors`
Expected: PASSA.

- [ ] **Step 7: QueryClient + chaves**

`src/lib/query.ts`:

```ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 30_000, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
});

export const qk = {
  profile: () => ['profile'] as const,
  concursoAtivo: () => ['concurso', 'ativo'] as const,
  concursos: () => ['concurso', 'lista'] as const,
  arvore: (concursoId: string) => ['arvore', concursoId] as const,
  sessoesEstudo: (topicoId: string) => ['sessoes-estudo', topicoId] as const,
  sessoesExercicio: (topicoId: string) => ['sessoes-exercicio', topicoId] as const,
  progresso: (concursoId: string) => ['progresso', concursoId] as const,
  revisao: (concursoId: string) => ['revisao', concursoId] as const,
};
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: cliente Supabase, normalizeError PT-BR e QueryClient"
```

---

## Task 5: Tema (ThemeProvider) e biblioteca de componentes de UI

**Files:**
- Create: `src/theme/ThemeProvider.tsx`, `src/components/ui/{Button,Card,Input,ProgressBar,EmptyState,Stat,Toast}.tsx`, `src/components/ui/index.ts`
- Test: `src/components/ui/__tests__/{Button,Input,ProgressBar,Toast}.test.tsx`

**Interfaces:**
- Consumes: `tokens` da Task 1
- Produces:
  - `<ThemeProvider>` + `useTheme(): { scheme: 'light' | 'dark'; setOverride(s: 'light' | 'dark' | 'system'): void; c: (name) => string }` (`c` resolve token de cor para o scheme atual)
  - `<Button title label onPress variant loading disabled />` — `variant: 'primary' | 'secondary' | 'ghost' | 'danger'`
  - `<Card>` `<Input label value onChangeText error keyboardType secureTextEntry multiline />`
  - `<ProgressBar value />` (0–1, faz clamp)
  - `<EmptyState titulo descricao acao? />`
  - `<Stat rotulo valor sub? />`
  - `<ToastProvider>` + `useToast(): { sucesso(msg): void; erro(msg): void }`

- [ ] **Step 1: ThemeProvider**

`src/theme/ThemeProvider.tsx`:

```tsx
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { tokens } from './tokens';

type Scheme = 'light' | 'dark';
type Override = Scheme | 'system';
type ColorName = keyof typeof tokens.colors;

const Ctx = createContext<{
  scheme: Scheme;
  setOverride: (o: Override) => void;
  c: (name: ColorName) => string;
} | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [override, setOverride] = useState<Override>('system');
  const scheme: Scheme = override === 'system' ? (system === 'dark' ? 'dark' : 'light') : override;

  const value = useMemo(
    () => ({ scheme, setOverride, c: (name: ColorName) => tokens.colors[name][scheme] }),
    [scheme],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTheme fora de ThemeProvider');
  return v;
}
```

- [ ] **Step 2: Testes de componentes que falham**

`src/components/ui/__tests__/Button.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { Button } from '../Button';

const wrap = (ui: React.ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

test('dispara onPress', () => {
  const fn = jest.fn();
  wrap(<Button label="Salvar" onPress={fn} />);
  fireEvent.press(screen.getByText('Salvar'));
  expect(fn).toHaveBeenCalled();
});

test('não dispara onPress quando loading', () => {
  const fn = jest.fn();
  wrap(<Button label="Salvar" onPress={fn} loading />);
  fireEvent.press(screen.getByRole('button'));
  expect(fn).not.toHaveBeenCalled();
});
```

`src/components/ui/__tests__/ProgressBar.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ProgressBar } from '../ProgressBar';

test('faz clamp de valor acima de 1', () => {
  render(<ThemeProvider><ProgressBar value={1.7} testID="pb" /></ThemeProvider>);
  expect(screen.getByTestId('pb-fill').props.style).toEqual(
    expect.objectContaining({ width: '100%' }),
  );
});
```

`src/components/ui/__tests__/Input.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { Input } from '../Input';

test('mostra a mensagem de erro', () => {
  render(<ThemeProvider><Input label="E-mail" value="" onChangeText={() => {}} error="Campo obrigatório" /></ThemeProvider>);
  expect(screen.getByText('Campo obrigatório')).toBeOnTheScreen();
});
```

`src/components/ui/__tests__/Toast.test.tsx`:

```tsx
import { render, screen, act } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ToastProvider, useToast } from '../Toast';

function Trigger() {
  const t = useToast();
  return <Text onPress={() => t.sucesso('Feito!')}>disparar</Text>;
}

test('exibe toast de sucesso', () => {
  render(<ToastProvider><Trigger /></ToastProvider>);
  act(() => screen.getByText('disparar').props.onPress());
  expect(screen.getByText('Feito!')).toBeOnTheScreen();
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npm test -- ui`
Expected: FALHA — componentes não existem.

- [ ] **Step 4: Implementar os componentes**

`src/components/ui/Button.tsx`:

```tsx
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  label, onPress, variant = 'primary', loading = false, disabled = false,
}: {
  label: string; onPress: () => void; variant?: Variant; loading?: boolean; disabled?: boolean;
}) {
  const { c } = useTheme();
  const bg = { primary: c('primary'), danger: c('danger'), secondary: c('surface'), ghost: 'transparent' }[variant];
  const fg = variant === 'secondary' || variant === 'ghost' ? c('text') : '#FFFFFF';
  const inativo = loading || disabled;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inativo, busy: loading }}
      disabled={inativo}
      onPress={onPress}
      style={{ backgroundColor: bg, opacity: inativo ? 0.6 : 1, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, alignItems: 'center' }}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={{ color: fg, fontWeight: '600' }}>{label}</Text>}
    </Pressable>
  );
}
```

`src/components/ui/Card.tsx`:

```tsx
import { View, type ViewProps } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export function Card({ style, ...rest }: ViewProps) {
  const { c } = useTheme();
  return <View {...rest} style={[{ backgroundColor: c('surface'), borderColor: c('border'), borderWidth: 1, borderRadius: 16, padding: 16 }, style]} />;
}
```

`src/components/ui/Input.tsx`:

```tsx
import { Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export function Input({
  label, value, onChangeText, error, keyboardType, secureTextEntry, multiline, placeholder, autoCapitalize,
}: {
  label: string; value: string; onChangeText: (t: string) => void; error?: string;
  keyboardType?: KeyboardTypeOptions; secureTextEntry?: boolean; multiline?: boolean;
  placeholder?: string; autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: c('muted'), fontSize: 14 }}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor={c('muted')}
        autoCapitalize={autoCapitalize}
        style={{ color: c('text'), borderColor: error ? c('danger') : c('border'), borderWidth: 1, borderRadius: 10, padding: 12, minHeight: multiline ? 100 : undefined, textAlignVertical: multiline ? 'top' : 'center' }}
      />
      {error ? <Text style={{ color: c('danger'), fontSize: 12 }}>{error}</Text> : null}
    </View>
  );
}
```

`src/components/ui/ProgressBar.tsx`:

```tsx
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export function ProgressBar({ value, testID }: { value: number; testID?: string }) {
  const { c } = useTheme();
  const pct = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  return (
    <View testID={testID} style={{ height: 8, borderRadius: 9999, backgroundColor: c('border'), overflow: 'hidden' }}>
      <View testID={testID ? `${testID}-fill` : undefined} style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: c('primary') }} />
    </View>
  );
}
```

`src/components/ui/EmptyState.tsx`:

```tsx
import { Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from './Button';

export function EmptyState({
  titulo, descricao, acao,
}: {
  titulo: string; descricao?: string; acao?: { label: string; onPress: () => void };
}) {
  const { c } = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: 8, padding: 32 }}>
      <Text style={{ color: c('text'), fontSize: 18, fontWeight: '600', textAlign: 'center' }}>{titulo}</Text>
      {descricao ? <Text style={{ color: c('muted'), textAlign: 'center' }}>{descricao}</Text> : null}
      {acao ? <View style={{ marginTop: 8 }}><Button label={acao.label} onPress={acao.onPress} /></View> : null}
    </View>
  );
}
```

`src/components/ui/Stat.tsx`:

```tsx
import { Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export function Stat({ rotulo, valor, sub }: { rotulo: string; valor: string; sub?: string }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ color: c('muted'), fontSize: 12 }}>{rotulo}</Text>
      <Text style={{ color: c('text'), fontSize: 26, fontWeight: '700' }}>{valor}</Text>
      {sub ? <Text style={{ color: c('muted'), fontSize: 12 }}>{sub}</Text> : null}
    </View>
  );
}
```

`src/components/ui/Toast.tsx`:

```tsx
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

type Toast = { id: number; msg: string; tipo: 'sucesso' | 'erro' };
const Ctx = createContext<{ sucesso: (m: string) => void; erro: (m: string) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  const [items, setItems] = useState<Toast[]>([]);
  const seq = useRef(0);
  const push = useCallback((msg: string, tipo: Toast['tipo']) => {
    const id = ++seq.current;
    setItems((l) => [...l, { id, msg, tipo }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), 3000);
  }, []);
  const api = useRef({ sucesso: (m: string) => push(m, 'sucesso'), erro: (m: string) => push(m, 'erro') }).current;

  return (
    <Ctx.Provider value={api}>
      {children}
      <View style={{ position: 'absolute', bottom: 40, left: 16, right: 16, gap: 8 }} pointerEvents="none">
        {items.map((t) => (
          <View key={t.id} style={{ backgroundColor: t.tipo === 'erro' ? c('danger') : c('success'), padding: 12, borderRadius: 10 }}>
            <Text style={{ color: '#FFFFFF' }}>{t.msg}</Text>
          </View>
        ))}
      </View>
    </Ctx.Provider>
  );
}

export function useToast() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useToast fora de ToastProvider');
  return v;
}
```

`src/components/ui/index.ts`:

```ts
export { Button } from './Button';
export { Card } from './Card';
export { Input } from './Input';
export { ProgressBar } from './ProgressBar';
export { EmptyState } from './EmptyState';
export { Stat } from './Stat';
export { ToastProvider, useToast } from './Toast';
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npm test -- ui && npm run typecheck`
Expected: PASSA.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: ThemeProvider e biblioteca base de componentes de UI"
```

---

## Task 6: Parser de texto do edital (`parseEditalTexto`)

**Files:**
- Create: `src/features/concurso/parseEditalTexto.ts`
- Test: `src/features/concurso/__tests__/parseEditalTexto.test.ts`

**Interfaces:**
- Consumes: nada
- Produces:
  ```ts
  export type TopicoDraft = { nome: string };
  export type AssuntoDraft = { nome: string; topicos: TopicoDraft[] };
  export type DisciplinaDraft = { nome: string; peso: number; assuntos: AssuntoDraft[]; topicos: TopicoDraft[] };
  export function parseEditalTexto(texto: string): { disciplinas: DisciplinaDraft[] };
  ```
  Regras: `peso` sempre 3 no rascunho. `topicos` diretos ficam em `disciplina.topicos`; quando há um nível intermediário, vão em `assunto.topicos`.

- [ ] **Step 1: Escrever os testes que falham**

`src/features/concurso/__tests__/parseEditalTexto.test.ts`:

```ts
import { parseEditalTexto } from '../parseEditalTexto';

test('numeração hierárquica: 1 = disciplina, 1.1 = tópico', () => {
  const r = parseEditalTexto('1 PORTUGUÊS\n1.1 Ortografia\n1.2 Crase\n2 RLM\n2.1 Proposições');
  expect(r.disciplinas.map((d) => d.nome)).toEqual(['PORTUGUÊS', 'RLM']);
  expect(r.disciplinas[0].topicos.map((t) => t.nome)).toEqual(['Ortografia', 'Crase']);
  expect(r.disciplinas[0].peso).toBe(3);
});

test('três níveis: 1.1 vira assunto, 1.1.1 vira tópico do assunto', () => {
  const r = parseEditalTexto('1 DIREITO\n1.1 Constitucional\n1.1.1 Princípios\n1.1.2 Direitos fundamentais');
  expect(r.disciplinas[0].assuntos[0].nome).toBe('Constitucional');
  expect(r.disciplinas[0].assuntos[0].topicos.map((t) => t.nome)).toEqual(['Princípios', 'Direitos fundamentais']);
  expect(r.disciplinas[0].topicos).toEqual([]);
});

test('linhas em MAIÚSCULAS sem numeração viram disciplina; marcadores viram tópicos', () => {
  const r = parseEditalTexto('PORTUGUÊS\n- Ortografia\n- Acentuação\nMATEMÁTICA\n- Frações');
  expect(r.disciplinas.map((d) => d.nome)).toEqual(['PORTUGUÊS', 'MATEMÁTICA']);
  expect(r.disciplinas[0].topicos.map((t) => t.nome)).toEqual(['Ortografia', 'Acentuação']);
});

test('linhas vazias e espaços são ignorados', () => {
  const r = parseEditalTexto('\n  1 PORTUGUÊS  \n\n  1.1 Ortografia \n');
  expect(r.disciplinas).toHaveLength(1);
  expect(r.disciplinas[0].topicos[0].nome).toBe('Ortografia');
});

test('tópicos antes de qualquer disciplina são descartados', () => {
  const r = parseEditalTexto('- solto\n1 PORTUGUÊS\n1.1 Ortografia');
  expect(r.disciplinas).toHaveLength(1);
  expect(r.disciplinas[0].topicos.map((t) => t.nome)).toEqual(['Ortografia']);
});

test('texto vazio retorna lista vazia', () => {
  expect(parseEditalTexto('')).toEqual({ disciplinas: [] });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- parseEditalTexto`
Expected: FALHA — módulo não existe.

- [ ] **Step 3: Implementar**

`src/features/concurso/parseEditalTexto.ts`:

```ts
export type TopicoDraft = { nome: string };
export type AssuntoDraft = { nome: string; topicos: TopicoDraft[] };
export type DisciplinaDraft = { nome: string; peso: number; assuntos: AssuntoDraft[]; topicos: TopicoDraft[] };

const PESO_PADRAO = 3;

type Linha =
  | { tipo: 'disciplina'; nome: string }
  | { tipo: 'assunto'; nome: string }
  | { tipo: 'topico'; nome: string };

function classificar(bruta: string): Linha | null {
  const linha = bruta.trim();
  if (!linha) return null;

  const num = linha.match(/^(\d+(?:\.\d+)*)[.)]?\s+(.*)$/);
  if (num) {
    const profundidade = num[1].split('.').length;
    const nome = num[2].trim();
    if (profundidade === 1) return { tipo: 'disciplina', nome };
    if (profundidade === 2) return { tipo: 'assunto', nome };
    return { tipo: 'topico', nome };
  }

  const marcador = linha.match(/^[-*•]\s+(.*)$/);
  if (marcador) return { tipo: 'topico', nome: marcador[1].trim() };

  const semAcento = linha.normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (semAcento === semAcento.toUpperCase() && /[A-Z]/.test(semAcento)) {
    return { tipo: 'disciplina', nome: linha };
  }
  return { tipo: 'topico', nome: linha };
}

export function parseEditalTexto(texto: string): { disciplinas: DisciplinaDraft[] } {
  const disciplinas: DisciplinaDraft[] = [];
  let disc: DisciplinaDraft | null = null;
  let assunto: AssuntoDraft | null = null;

  for (const bruta of texto.split(/\r?\n/)) {
    const linha = classificar(bruta);
    if (!linha) continue;

    if (linha.tipo === 'disciplina') {
      disc = { nome: linha.nome, peso: PESO_PADRAO, assuntos: [], topicos: [] };
      assunto = null;
      disciplinas.push(disc);
    } else if (linha.tipo === 'assunto') {
      if (!disc) continue;
      assunto = { nome: linha.nome, topicos: [] };
      disc.assuntos.push(assunto);
    } else {
      if (!disc) continue;
      if (assunto) assunto.topicos.push({ nome: linha.nome });
      else disc.topicos.push({ nome: linha.nome });
    }
  }

  return { disciplinas };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- parseEditalTexto`
Expected: PASSA.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: parser de texto do edital em rascunho de arvore"
```

---

## Task 7: Funções puras de métrica (`features/progresso/metrics.ts`)

**Files:**
- Create: `src/types/models.ts`, `src/features/progresso/metrics.ts`
- Test: `src/features/progresso/__tests__/metrics.test.ts`

**Interfaces:**
- Consumes: nada
- Produces em `src/types/models.ts`:
  ```ts
  export type TopicoLite = { id: string; disciplinaId: string; concluido: boolean };
  export type DisciplinaLite = { id: string; nome: string; peso: number };
  export type SessaoEstudoLite = { topicoId: string; duracaoSegundos: number; iniciadaEm: string };
  export type SessaoExercicioLite = { topicoId: string; acertos: number; erros: number; data: string };
  ```
- Produces em `metrics.ts`:
  ```ts
  export function coberturaEdital(topicos: TopicoLite[]): { geral: number; porDisciplina: Map<string, number> };
  export function coberturaPonderada(disciplinas: DisciplinaLite[], topicos: TopicoLite[]): number;
  export function aproveitamento(
    sessoes: SessaoExercicioLite[], topicos: TopicoLite[],
  ): { geral: number | null; porDisciplina: Map<string, number | null> };
  export function tempoEstudado(
    sessoes: SessaoEstudoLite[], topicos: TopicoLite[], agora?: Date,
  ): { totalSegundos: number; porDisciplina: Map<string, number>; ultimos7diasSegundos: number };
  ```
  Convenções: percentuais retornados como fração 0–1. `geral` do aproveitamento é `null` quando não há nenhuma questão. Disciplina sem tópicos → cobertura `0` e é ignorada na cobertura ponderada. `peso` fora de 1–5 ou ausente é tratado como 3.

- [ ] **Step 1: Escrever os testes que falham**

`src/features/progresso/__tests__/metrics.test.ts`:

```ts
import { coberturaEdital, coberturaPonderada, aproveitamento, tempoEstudado } from '../metrics';
import type { TopicoLite, DisciplinaLite, SessaoExercicioLite, SessaoEstudoLite } from '@/types/models';

const D = (id: string, peso: number): DisciplinaLite => ({ id, nome: id, peso });
const T = (id: string, disciplinaId: string, concluido: boolean): TopicoLite => ({ id, disciplinaId, concluido });

test('coberturaEdital: geral e por disciplina', () => {
  const topicos = [T('1', 'a', true), T('2', 'a', false), T('3', 'b', true)];
  const r = coberturaEdital(topicos);
  expect(r.geral).toBeCloseTo(2 / 3);
  expect(r.porDisciplina.get('a')).toBeCloseTo(0.5);
  expect(r.porDisciplina.get('b')).toBe(1);
});

test('coberturaEdital: sem tópicos retorna 0', () => {
  expect(coberturaEdital([]).geral).toBe(0);
});

test('coberturaPonderada: disciplina de peso maior domina', () => {
  const disciplinas = [D('a', 5), D('b', 1)];
  const topicos = [T('1', 'a', true), T('2', 'a', true), T('3', 'b', false), T('4', 'b', false)];
  // (5*1 + 1*0) / (5+1) = 0.8333
  expect(coberturaPonderada(disciplinas, topicos)).toBeCloseTo(5 / 6);
});

test('coberturaPonderada: disciplina sem tópicos é ignorada', () => {
  const disciplinas = [D('a', 5), D('vazia', 5)];
  const topicos = [T('1', 'a', true)];
  expect(coberturaPonderada(disciplinas, topicos)).toBe(1);
});

test('coberturaPonderada: peso inválido cai para 3', () => {
  const disciplinas = [D('a', 99), D('b', 3)];
  const topicos = [T('1', 'a', true), T('2', 'b', false)];
  expect(coberturaPonderada(disciplinas, topicos)).toBeCloseTo(0.5);
});

test('aproveitamento: geral e por disciplina', () => {
  const topicos = [T('t1', 'a', true), T('t2', 'b', true)];
  const sessoes: SessaoExercicioLite[] = [
    { topicoId: 't1', acertos: 8, erros: 2, data: '2026-09-01' },
    { topicoId: 't1', acertos: 5, erros: 5, data: '2026-09-02' },
    { topicoId: 't2', acertos: 3, erros: 1, data: '2026-09-02' },
  ];
  const r = aproveitamento(sessoes, topicos);
  expect(r.geral).toBeCloseTo((8 + 5 + 3) / (10 + 10 + 4));
  expect(r.porDisciplina.get('a')).toBeCloseTo(13 / 20);
  expect(r.porDisciplina.get('b')).toBeCloseTo(3 / 4);
});

test('aproveitamento: sem questões retorna null', () => {
  const r = aproveitamento([], [T('t1', 'a', false)]);
  expect(r.geral).toBeNull();
  expect(r.porDisciplina.get('a')).toBeNull();
});

test('tempoEstudado: total, por disciplina e últimos 7 dias', () => {
  const agora = new Date('2026-09-10T12:00:00Z');
  const topicos = [T('t1', 'a', true), T('t2', 'b', true)];
  const sessoes: SessaoEstudoLite[] = [
    { topicoId: 't1', duracaoSegundos: 3600, iniciadaEm: '2026-09-09T10:00:00Z' },
    { topicoId: 't2', duracaoSegundos: 1800, iniciadaEm: '2026-09-01T10:00:00Z' },
  ];
  const r = tempoEstudado(sessoes, topicos, agora);
  expect(r.totalSegundos).toBe(5400);
  expect(r.porDisciplina.get('a')).toBe(3600);
  expect(r.ultimos7diasSegundos).toBe(3600);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- metrics`
Expected: FALHA.

- [ ] **Step 3: Implementar**

`src/types/models.ts`:

```ts
export type TopicoLite = { id: string; disciplinaId: string; concluido: boolean };
export type DisciplinaLite = { id: string; nome: string; peso: number };
export type SessaoEstudoLite = { topicoId: string; duracaoSegundos: number; iniciadaEm: string };
export type SessaoExercicioLite = { topicoId: string; acertos: number; erros: number; data: string };
```

`src/features/progresso/metrics.ts`:

```ts
import type {
  TopicoLite, DisciplinaLite, SessaoEstudoLite, SessaoExercicioLite,
} from '@/types/models';

const pesoValido = (p: number) => (Number.isInteger(p) && p >= 1 && p <= 5 ? p : 3);

export function coberturaEdital(topicos: TopicoLite[]): { geral: number; porDisciplina: Map<string, number> } {
  const porDisciplina = new Map<string, number>();
  const agrupado = new Map<string, { total: number; feitos: number }>();
  for (const t of topicos) {
    const g = agrupado.get(t.disciplinaId) ?? { total: 0, feitos: 0 };
    g.total += 1;
    if (t.concluido) g.feitos += 1;
    agrupado.set(t.disciplinaId, g);
  }
  for (const [id, g] of agrupado) porDisciplina.set(id, g.total ? g.feitos / g.total : 0);
  const geral = topicos.length ? topicos.filter((t) => t.concluido).length / topicos.length : 0;
  return { geral, porDisciplina };
}

export function coberturaPonderada(disciplinas: DisciplinaLite[], topicos: TopicoLite[]): number {
  const { porDisciplina } = coberturaEdital(topicos);
  let num = 0;
  let den = 0;
  for (const d of disciplinas) {
    if (!porDisciplina.has(d.id)) continue; // sem tópicos: ignora
    const w = pesoValido(d.peso);
    num += w * (porDisciplina.get(d.id) ?? 0);
    den += w;
  }
  return den ? num / den : 0;
}

export function aproveitamento(
  sessoes: SessaoExercicioLite[], topicos: TopicoLite[],
): { geral: number | null; porDisciplina: Map<string, number | null> } {
  const discDoTopico = new Map(topicos.map((t) => [t.id, t.disciplinaId]));
  const porDisc = new Map<string, { acertos: number; total: number }>();
  let acertosGeral = 0;
  let totalGeral = 0;
  for (const s of sessoes) {
    const total = s.acertos + s.erros;
    acertosGeral += s.acertos;
    totalGeral += total;
    const did = discDoTopico.get(s.topicoId);
    if (!did) continue;
    const g = porDisc.get(did) ?? { acertos: 0, total: 0 };
    g.acertos += s.acertos;
    g.total += total;
    porDisc.set(did, g);
  }
  const porDisciplina = new Map<string, number | null>();
  const disciplinasVistas = new Set(topicos.map((t) => t.disciplinaId));
  for (const did of disciplinasVistas) {
    const g = porDisc.get(did);
    porDisciplina.set(did, g && g.total ? g.acertos / g.total : null);
  }
  return { geral: totalGeral ? acertosGeral / totalGeral : null, porDisciplina };
}

export function tempoEstudado(
  sessoes: SessaoEstudoLite[], topicos: TopicoLite[], agora: Date = new Date(),
): { totalSegundos: number; porDisciplina: Map<string, number>; ultimos7diasSegundos: number } {
  const discDoTopico = new Map(topicos.map((t) => [t.id, t.disciplinaId]));
  const corte = agora.getTime() - 7 * 24 * 60 * 60 * 1000;
  const porDisciplina = new Map<string, number>();
  let totalSegundos = 0;
  let ultimos7diasSegundos = 0;
  for (const s of sessoes) {
    totalSegundos += s.duracaoSegundos;
    if (new Date(s.iniciadaEm).getTime() >= corte) ultimos7diasSegundos += s.duracaoSegundos;
    const did = discDoTopico.get(s.topicoId);
    if (!did) continue;
    porDisciplina.set(did, (porDisciplina.get(did) ?? 0) + s.duracaoSegundos);
  }
  return { totalSegundos, porDisciplina, ultimos7diasSegundos };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- metrics && npm run typecheck`
Expected: PASSA.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: funcoes puras de metrica de progresso"
```

---

## Task 8: Autenticação (sessão, telas de login/cadastro, gate de rotas)

**Files:**
- Create: `src/features/auth/useSession.ts`, `src/features/auth/AuthGate.tsx`
- Create: `app/_layout.tsx` (substitui placeholder), `app/(auth)/_layout.tsx`, `app/(auth)/sign-in.tsx`, `app/(auth)/sign-up.tsx`
- Delete: `app/index.tsx` (placeholder)
- Modify: `app.json` (redirect URI do OAuth)
- Test: `src/features/auth/__tests__/useSession.test.tsx`, `app/(auth)/__tests__/sign-in.test.tsx`

**Interfaces:**
- Consumes: `supabase` (Task 4), `normalizeError` (Task 4), componentes de UI (Task 5), `queryClient` (Task 4)
- Produces:
  - `useSession(): { session: Session | null; loading: boolean; signInWithPassword(email,senha): Promise<void>; signUp(email,senha): Promise<void>; signInWithGoogle(): Promise<void>; signOut(): Promise<void> }`
  - `<AuthGate>` que decide entre `(auth)`, `onboarding`, `(app)` a partir de sessão + `active_concurso_id`
  - Rotas `(auth)/sign-in` e `(auth)/sign-up`

- [ ] **Step 1: Instalar deps de OAuth**

```bash
npx expo install expo-auth-session expo-web-browser expo-crypto
```

- [ ] **Step 2: Teste que falha — `useSession`**

`src/features/auth/__tests__/useSession.test.tsx`:

```tsx
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useSession } from '../useSession';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => {
  const listeners: any[] = [];
  return {
    supabase: {
      auth: {
        getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
        onAuthStateChange: jest.fn((cb: any) => {
          listeners.push(cb);
          return { data: { subscription: { unsubscribe: jest.fn() } } };
        }),
        signInWithPassword: jest.fn(() => Promise.resolve({ data: { session: { user: { id: 'u1' } } }, error: null })),
        signUp: jest.fn(() => Promise.resolve({ data: {}, error: null })),
        signOut: jest.fn(() => Promise.resolve({ error: null })),
        __emit: (s: any) => listeners.forEach((l) => l('SIGNED_IN', s)),
      },
    },
  };
});

test('começa sem sessão e loading vira false', async () => {
  const { result } = renderHook(() => useSession());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.session).toBeNull();
});

test('signInWithPassword chama o supabase', async () => {
  const { result } = renderHook(() => useSession());
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(() => result.current.signInWithPassword('a@b.com', 'senha123'));
  expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: 'senha123' });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npm test -- useSession`
Expected: FALHA.

- [ ] **Step 4: Implementar `useSession`**

`src/features/auth/useSession.ts`:

```ts
import { useCallback, useEffect, useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { normalizeError } from '@/lib/errors';

WebBrowser.maybeCompleteAuthSession();

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw normalizeError(error);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw normalizeError(error);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const redirectTo = AuthSession.makeRedirectUri({ scheme: 'estudaconcurso' });
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw normalizeError(error);
    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (res.type !== 'success') return;
    const url = new URL(res.url);
    const code = url.searchParams.get('code');
    if (code) {
      const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
      if (exErr) throw normalizeError(exErr);
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { session, loading, signInWithPassword, signUp, signInWithGoogle, signOut };
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npm test -- useSession`
Expected: PASSA.

- [ ] **Step 6: AuthGate + layout raiz**

`src/features/auth/AuthGate.tsx`:

```tsx
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useSession } from './useSession';
import { useProfile } from '@/features/settings/hooks';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSession();
  const { data: profile, isLoading: pLoading } = useProfile(session?.user.id ?? null);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading || (session && pLoading)) return;
    const grupo = segments[0];
    if (!session) {
      if (grupo !== '(auth)') router.replace('/(auth)/sign-in');
      return;
    }
    const temConcurso = !!profile?.active_concurso_id;
    if (!temConcurso && grupo !== 'onboarding') router.replace('/onboarding/novo-concurso');
    else if (temConcurso && (grupo === '(auth)' || grupo === 'onboarding')) router.replace('/(app)');
  }, [loading, pLoading, session, profile, segments, router]);

  if (loading || (session && pLoading)) {
    return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator /></View>;
  }
  return <>{children}</>;
}
```

`app/_layout.tsx` (substitui o placeholder):

```tsx
import '../global.css';
import { Slot } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from '@/lib/query';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/ui';
import { AuthGate } from '@/features/auth/AuthGate';
import { TimerPill } from '@/features/estudo/TimerPill';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ToastProvider>
            <AuthGate>
              <Slot />
              <TimerPill />
            </AuthGate>
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
```

> Nota para o executor: `TimerPill` e `useProfile` são criados nas Tasks 13 e 9. Se estiver executando estritamente em ordem, crie stubs temporários (`export const TimerPill = () => null;` e um `useProfile` que retorna `{ data: null, isLoading: false }`) e complete nas tasks devidas. Remova `app/index.tsx`.

- [ ] **Step 7: Telas de auth**

`app/(auth)/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

`app/(auth)/sign-in.tsx`:

```tsx
import { useState } from 'react';
import { View, Text } from 'react-native';
import { Link } from 'expo-router';
import { Button, Input, useToast } from '@/components/ui';
import { useSession } from '@/features/auth/useSession';
import type { AppError } from '@/lib/errors';

export default function SignIn() {
  const { signInWithPassword, signInWithGoogle } = useSession();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string>();
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    setErro(undefined);
    setCarregando(true);
    try {
      await signInWithPassword(email.trim(), senha);
    } catch (e) {
      setErro((e as AppError).message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 26, fontWeight: '700' }}>Entrar</Text>
      <Input label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <Input label="Senha" value={senha} onChangeText={setSenha} secureTextEntry error={erro} />
      <Button label="Entrar" onPress={entrar} loading={carregando} />
      <Button label="Entrar com Google" variant="secondary" onPress={() => signInWithGoogle().catch((e) => toast.erro((e as AppError).message))} />
      <Link href="/(auth)/sign-up">
        <Text>Não tem conta? Cadastre-se</Text>
      </Link>
    </View>
  );
}
```

`app/(auth)/sign-up.tsx`: mesma estrutura, chamando `signUp`; após sucesso, `toast.sucesso('Conta criada! Verifique seu e-mail se necessário.')` e `router.replace('/(auth)/sign-in')`.

- [ ] **Step 8: Teste da tela de login**

`app/(auth)/__tests__/sign-in.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/ui';
import SignIn from '../sign-in';

const signInWithPassword = jest.fn(() => Promise.reject({ message: 'E-mail ou senha incorretos.' }));
jest.mock('@/features/auth/useSession', () => ({
  useSession: () => ({ signInWithPassword, signInWithGoogle: jest.fn() }),
}));
jest.mock('expo-router', () => ({ Link: ({ children }: any) => children }));

test('mostra erro de credencial inválida', async () => {
  render(<ThemeProvider><ToastProvider><SignIn /></ToastProvider></ThemeProvider>);
  fireEvent.changeText(screen.getByLabelText('E-mail'), 'a@b.com');
  fireEvent.changeText(screen.getByLabelText('Senha'), 'errada');
  fireEvent.press(screen.getByText('Entrar'));
  await waitFor(() => expect(screen.getByText('E-mail ou senha incorretos.')).toBeOnTheScreen());
});
```

- [ ] **Step 9: Rodar toda a suíte + typecheck**

Run: `npm test && npm run typecheck`
Expected: PASSA.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: autenticacao (sessao, login/cadastro, gate de rotas)"
```

---

## Task 9: Perfil/ajustes e camada de dados do concurso

**Files:**
- Create: `src/features/settings/hooks.ts`, `src/features/concurso/schema.ts`, `src/features/concurso/api.ts`, `src/features/concurso/hooks.ts`
- Test: `src/features/concurso/__tests__/schema.test.ts`, `tests/integration/concurso-api.test.ts`

**Interfaces:**
- Consumes: `supabase` (Task 4), `qk`/`queryClient` (Task 4), `normalizeError` (Task 4), tipos `DisciplinaDraft` (Task 6)
- Produces:
  - `useProfile(userId: string | null)` → `{ data: { id: string; display_name: string | null; active_concurso_id: string | null; settings: Settings } | null; isLoading: boolean }`
  - `Settings = { tema?: 'light' | 'dark' | 'system'; limiaresRevisaoDias?: number[] }` (default `{ tema: 'system', limiaresRevisaoDias: [7, 15, 30] }`)
  - `useUpdateSettings()` → mutation `(patch: Partial<Settings>) => void`
  - `useConcursoAtivo()` → `{ data: Concurso | null; isLoading }` (`Concurso = { id; nome; banca; cargo; data_prova; status }`)
  - `useCriarConcurso()` → mutation `(input: { concurso: ConcursoInput; disciplinas: DisciplinaDraft[] }) => Promise<{ concursoId: string }>` — cria concurso + árvore e seta `active_concurso_id`
  - `useArquivarConcurso()` → mutation `(id: string) => void` (seta `status='arquivado'`, `archived_at`, limpa `active_concurso_id`)
  - `useDefinirConcursoAtivo()` → mutation `(id: string) => void`
  - `useConcursos()` → lista de todos os concursos do usuário
  - `concursoInputSchema` (zod): `{ nome: string.min(1), banca?: string, cargo?: string, data_prova?: string (ISO date) }`

- [ ] **Step 1: Teste do schema que falha**

`src/features/concurso/__tests__/schema.test.ts`:

```ts
import { concursoInputSchema, arvoreSchema } from '../schema';

test('concurso exige nome não vazio', () => {
  expect(concursoInputSchema.safeParse({ nome: '' }).success).toBe(false);
  expect(concursoInputSchema.safeParse({ nome: 'TRT-4' }).success).toBe(true);
});

test('árvore exige peso entre 1 e 5', () => {
  const ok = { disciplinas: [{ nome: 'P', peso: 3, assuntos: [], topicos: [{ nome: 'X' }] }] };
  const ruim = { disciplinas: [{ nome: 'P', peso: 8, assuntos: [], topicos: [] }] };
  expect(arvoreSchema.safeParse(ok).success).toBe(true);
  expect(arvoreSchema.safeParse(ruim).success).toBe(false);
});

test('árvore rejeita disciplina sem nome', () => {
  const ruim = { disciplinas: [{ nome: '', peso: 3, assuntos: [], topicos: [] }] };
  expect(arvoreSchema.safeParse(ruim).success).toBe(false);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- concurso/__tests__/schema`
Expected: FALHA.

- [ ] **Step 3: Implementar schema**

`src/features/concurso/schema.ts`:

```ts
import { z } from 'zod';

export const concursoInputSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome do concurso'),
  banca: z.string().trim().optional(),
  cargo: z.string().trim().optional(),
  data_prova: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida').optional(),
});
export type ConcursoInput = z.infer<typeof concursoInputSchema>;

const topicoSchema = z.object({ nome: z.string().trim().min(1) });
const assuntoSchema = z.object({ nome: z.string().trim().min(1), topicos: z.array(topicoSchema) });
const disciplinaSchema = z.object({
  nome: z.string().trim().min(1, 'Disciplina sem nome'),
  peso: z.number().int().min(1).max(5),
  assuntos: z.array(assuntoSchema),
  topicos: z.array(topicoSchema),
});
export const arvoreSchema = z.object({ disciplinas: z.array(disciplinaSchema) });
export type Arvore = z.infer<typeof arvoreSchema>;
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- concurso/__tests__/schema`
Expected: PASSA.

- [ ] **Step 5: Implementar `settings/hooks.ts`**

`src/features/settings/hooks.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { qk } from '@/lib/query';
import { normalizeError } from '@/lib/errors';

export type Settings = { tema: 'light' | 'dark' | 'system'; limiaresRevisaoDias: number[] };
const DEFAULTS: Settings = { tema: 'system', limiaresRevisaoDias: [7, 15, 30] };

export type Profile = {
  id: string;
  display_name: string | null;
  active_concurso_id: string | null;
  settings: Settings;
};

export function useProfile(userId: string | null) {
  return useQuery({
    queryKey: qk.profile(),
    enabled: !!userId,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, active_concurso_id, settings')
        .eq('id', userId!)
        .maybeSingle();
      if (error) throw normalizeError(error);
      if (!data) return null;
      return { ...data, settings: { ...DEFAULTS, ...(data.settings as Partial<Settings>) } };
    },
  });
}

export function useUpdateSettings(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Settings>) => {
      const atual = qc.getQueryData<Profile>(qk.profile());
      const merged = { ...DEFAULTS, ...atual?.settings, ...patch };
      const { error } = await supabase.from('profiles').update({ settings: merged }).eq('id', userId!);
      if (error) throw normalizeError(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.profile() }),
  });
}
```

- [ ] **Step 6: Implementar `concurso/api.ts` e `hooks.ts`**

`src/features/concurso/api.ts`:

```ts
import { supabase } from '@/lib/supabase';
import { normalizeError } from '@/lib/errors';
import type { ConcursoInput } from './schema';
import type { DisciplinaDraft } from './parseEditalTexto';

export type Concurso = {
  id: string; nome: string; banca: string | null; cargo: string | null;
  data_prova: string | null; status: 'ativo' | 'arquivado';
};

export async function buscarConcursoAtivo(): Promise<Concurso | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data: prof } = await supabase.from('profiles').select('active_concurso_id').eq('id', u.user.id).maybeSingle();
  if (!prof?.active_concurso_id) return null;
  const { data, error } = await supabase
    .from('concursos')
    .select('id, nome, banca, cargo, data_prova, status')
    .eq('id', prof.active_concurso_id)
    .maybeSingle();
  if (error) throw normalizeError(error);
  return data;
}

export async function listarConcursos(): Promise<Concurso[]> {
  const { data, error } = await supabase
    .from('concursos')
    .select('id, nome, banca, cargo, data_prova, status')
    .order('created_at', { ascending: false });
  if (error) throw normalizeError(error);
  return data ?? [];
}

export async function criarConcursoComArvore(input: {
  concurso: ConcursoInput; disciplinas: DisciplinaDraft[];
}): Promise<{ concursoId: string }> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user!.id;

  const { data: c, error: cErr } = await supabase
    .from('concursos')
    .insert({ user_id: uid, nome: input.concurso.nome, banca: input.concurso.banca ?? null, cargo: input.concurso.cargo ?? null, data_prova: input.concurso.data_prova ?? null, status: 'ativo' })
    .select('id')
    .single();
  if (cErr) throw normalizeError(cErr);

  for (const [di, d] of input.disciplinas.entries()) {
    const { data: disc, error: dErr } = await supabase
      .from('disciplinas')
      .insert({ user_id: uid, concurso_id: c.id, nome: d.nome, peso: d.peso, ordem: di })
      .select('id')
      .single();
    if (dErr) throw normalizeError(dErr);

    for (const [ti, t] of d.topicos.entries()) {
      const { error } = await supabase.from('topicos').insert({ user_id: uid, disciplina_id: disc.id, nome: t.nome, ordem: ti });
      if (error) throw normalizeError(error);
    }
    for (const [ai, a] of d.assuntos.entries()) {
      const { data: ass, error: aErr } = await supabase
        .from('assuntos')
        .insert({ user_id: uid, disciplina_id: disc.id, nome: a.nome, ordem: ai })
        .select('id')
        .single();
      if (aErr) throw normalizeError(aErr);
      for (const [ti, t] of a.topicos.entries()) {
        const { error } = await supabase.from('topicos').insert({ user_id: uid, disciplina_id: disc.id, assunto_id: ass.id, nome: t.nome, ordem: ti });
        if (error) throw normalizeError(error);
      }
    }
  }

  const { error: pErr } = await supabase.from('profiles').update({ active_concurso_id: c.id }).eq('id', uid);
  if (pErr) throw normalizeError(pErr);
  return { concursoId: c.id };
}

export async function arquivarConcurso(id: string): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user!.id;
  const { error } = await supabase.from('concursos').update({ status: 'arquivado', archived_at: new Date().toISOString() }).eq('id', id);
  if (error) throw normalizeError(error);
  const { data: prof } = await supabase.from('profiles').select('active_concurso_id').eq('id', uid).maybeSingle();
  if (prof?.active_concurso_id === id) {
    await supabase.from('profiles').update({ active_concurso_id: null }).eq('id', uid);
  }
}

export async function definirConcursoAtivo(id: string): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  const { error } = await supabase.from('profiles').update({ active_concurso_id: id }).eq('id', u.user!.id);
  if (error) throw normalizeError(error);
}
```

> Nota: a criação da árvore não é transacional (Supabase JS não abre transação multi-statement). Aceitável no #1 dado o volume; se uma inserção falhar, a tela mostra erro e o usuário pode apagar o concurso parcial em Ajustes. Uma RPC `create_concurso_com_arvore(jsonb)` transacional é candidata a melhoria no #2.

`src/features/concurso/hooks.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query';
import * as api from './api';

export function useConcursoAtivo() {
  return useQuery({ queryKey: qk.concursoAtivo(), queryFn: api.buscarConcursoAtivo });
}
export function useConcursos() {
  return useQuery({ queryKey: qk.concursos(), queryFn: api.listarConcursos });
}
export function useCriarConcurso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.criarConcursoComArvore,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.profile() });
      qc.invalidateQueries({ queryKey: qk.concursoAtivo() });
    },
  });
}
export function useArquivarConcurso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.arquivarConcurso,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.profile() });
      qc.invalidateQueries({ queryKey: qk.concursoAtivo() });
      qc.invalidateQueries({ queryKey: qk.concursos() });
    },
  });
}
export function useDefinirConcursoAtivo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.definirConcursoAtivo,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.profile() });
      qc.invalidateQueries({ queryKey: qk.concursoAtivo() });
    },
  });
}
```

- [ ] **Step 7: Teste de integração da API do concurso**

`tests/integration/concurso-api.test.ts`:

```ts
import { makeUser } from './helpers';

test('criar concurso com árvore seta active_concurso_id e cria tópicos', async () => {
  const u = await makeUser(`capi${Date.now()}@x.com`);
  const { data: c } = await u.client.from('concursos').insert({ user_id: u.id, nome: 'TRT', status: 'ativo' }).select().single();
  const { data: d } = await u.client.from('disciplinas').insert({ user_id: u.id, concurso_id: c.id, nome: 'Português', peso: 4, ordem: 0 }).select().single();
  await u.client.from('topicos').insert({ user_id: u.id, disciplina_id: d.id, nome: 'Crase', ordem: 0 });
  await u.client.from('profiles').update({ active_concurso_id: c.id }).eq('id', u.id);

  const { data: prof } = await u.client.from('profiles').select('active_concurso_id').eq('id', u.id).single();
  expect(prof.active_concurso_id).toBe(c.id);

  const { data: tops } = await u.client.from('topicos').select('nome').eq('disciplina_id', d.id);
  expect(tops.map((t: any) => t.nome)).toEqual(['Crase']);
});

test('arquivar concurso ativo limpa active_concurso_id', async () => {
  const u = await makeUser(`carq${Date.now()}@x.com`);
  const { data: c } = await u.client.from('concursos').insert({ user_id: u.id, nome: 'X', status: 'ativo' }).select().single();
  await u.client.from('profiles').update({ active_concurso_id: c.id }).eq('id', u.id);
  await u.client.from('concursos').update({ status: 'arquivado', archived_at: new Date().toISOString() }).eq('id', c.id);
  await u.client.from('profiles').update({ active_concurso_id: null }).eq('id', u.id);
  const { data: prof } = await u.client.from('profiles').select('active_concurso_id').eq('id', u.id).single();
  expect(prof.active_concurso_id).toBeNull();
});
```

- [ ] **Step 8: Rodar tudo**

Run: `npm test && SUPABASE_SERVICE_ROLE_KEY=<key> SUPABASE_ANON_KEY=<key> npm run test:integration -- concurso-api && npm run typecheck`
Expected: PASSA.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: perfil/ajustes e camada de dados do concurso"
```

---

## Task 10: Wizard de cadastro do edital (`onboarding/novo-concurso`)

**Files:**
- Create: `app/onboarding/_layout.tsx`, `app/onboarding/novo-concurso.tsx`
- Create: `src/features/concurso/ArvoreEditor.tsx`
- Test: `src/features/concurso/__tests__/ArvoreEditor.test.tsx`, `app/onboarding/__tests__/novo-concurso.test.tsx`

**Interfaces:**
- Consumes: `parseEditalTexto` (Task 6), `concursoInputSchema`/`arvoreSchema` (Task 9), `useCriarConcurso` (Task 9), componentes de UI (Task 5)
- Produces:
  - `<ArvoreEditor value={Arvore} onChange={(a: Arvore) => void} />` — editar nomes, adicionar/remover disciplina/assunto/tópico, ajustar peso 1–5
  - Rota `onboarding/novo-concurso` com 4 passos: (1) dados do concurso, (2) colar texto / anexar PDF (desabilitado), (3) revisar árvore, (4) confirmar → cria e vai para `/(app)`

- [ ] **Step 1: Teste do `ArvoreEditor` que falha**

`src/features/concurso/__tests__/ArvoreEditor.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ArvoreEditor } from '../ArvoreEditor';

const base = { disciplinas: [{ nome: 'Português', peso: 3, assuntos: [], topicos: [{ nome: 'Crase' }] }] };

test('altera o peso da disciplina', () => {
  const onChange = jest.fn();
  render(<ThemeProvider><ArvoreEditor value={base} onChange={onChange} /></ThemeProvider>);
  fireEvent.press(screen.getByLabelText('Peso 5 para Português'));
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({ disciplinas: [expect.objectContaining({ peso: 5 })] }),
  );
});

test('remove um tópico', () => {
  const onChange = jest.fn();
  render(<ThemeProvider><ArvoreEditor value={base} onChange={onChange} /></ThemeProvider>);
  fireEvent.press(screen.getByLabelText('Remover tópico Crase'));
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({ disciplinas: [expect.objectContaining({ topicos: [] })] }),
  );
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- ArvoreEditor`
Expected: FALHA.

- [ ] **Step 3: Implementar `ArvoreEditor`**

`src/features/concurso/ArvoreEditor.tsx`:

```tsx
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Input } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import type { Arvore } from './schema';

export function ArvoreEditor({ value, onChange }: { value: Arvore; onChange: (a: Arvore) => void }) {
  const { c } = useTheme();
  const set = (fn: (draft: Arvore) => void) => {
    const next: Arvore = JSON.parse(JSON.stringify(value));
    fn(next);
    onChange(next);
  };

  return (
    <ScrollView contentContainerStyle={{ gap: 16, padding: 4 }}>
      {value.disciplinas.map((d, di) => (
        <View key={di} style={{ borderColor: c('border'), borderWidth: 1, borderRadius: 12, padding: 12, gap: 8 }}>
          <Input label="Disciplina" value={d.nome} onChangeText={(t) => set((x) => { x.disciplinas[di].nome = t; })} />
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <Text style={{ color: c('muted') }}>Peso</Text>
            {[1, 2, 3, 4, 5].map((p) => (
              <Pressable
                key={p}
                accessibilityLabel={`Peso ${p} para ${d.nome}`}
                onPress={() => set((x) => { x.disciplinas[di].peso = p; })}
                style={{ width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: d.peso === p ? c('primary') : c('surface') }}
              >
                <Text style={{ color: d.peso === p ? '#FFF' : c('text') }}>{p}</Text>
              </Pressable>
            ))}
          </View>

          {d.topicos.map((t, ti) => (
            <View key={ti} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Input label="Tópico" value={t.nome} onChangeText={(v) => set((x) => { x.disciplinas[di].topicos[ti].nome = v; })} />
              </View>
              <Pressable accessibilityLabel={`Remover tópico ${t.nome}`} onPress={() => set((x) => { x.disciplinas[di].topicos.splice(ti, 1); })}>
                <Text style={{ color: c('danger') }}>✕</Text>
              </Pressable>
            </View>
          ))}
          <Pressable accessibilityLabel={`Adicionar tópico em ${d.nome}`} onPress={() => set((x) => { x.disciplinas[di].topicos.push({ nome: 'Novo tópico' }); })}>
            <Text style={{ color: c('primary') }}>+ tópico</Text>
          </Pressable>

          {d.assuntos.map((a, ai) => (
            <View key={ai} style={{ marginLeft: 12, gap: 6, borderLeftColor: c('border'), borderLeftWidth: 2, paddingLeft: 8 }}>
              <Input label="Assunto" value={a.nome} onChangeText={(v) => set((x) => { x.disciplinas[di].assuntos[ai].nome = v; })} />
              {a.topicos.map((t, ti) => (
                <View key={ti} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Input label="Tópico" value={t.nome} onChangeText={(v) => set((x) => { x.disciplinas[di].assuntos[ai].topicos[ti].nome = v; })} />
                  </View>
                  <Pressable accessibilityLabel={`Remover tópico ${t.nome}`} onPress={() => set((x) => { x.disciplinas[di].assuntos[ai].topicos.splice(ti, 1); })}>
                    <Text style={{ color: c('danger') }}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ))}

          <Pressable accessibilityLabel={`Remover disciplina ${d.nome}`} onPress={() => set((x) => { x.disciplinas.splice(di, 1); })}>
            <Text style={{ color: c('danger') }}>Remover disciplina</Text>
          </Pressable>
        </View>
      ))}
      <Pressable accessibilityLabel="Adicionar disciplina" onPress={() => set((x) => { x.disciplinas.push({ nome: 'Nova disciplina', peso: 3, assuntos: [], topicos: [] }); })}>
        <Text style={{ color: c('primary') }}>+ disciplina</Text>
      </Pressable>
    </ScrollView>
  );
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- ArvoreEditor`
Expected: PASSA.

- [ ] **Step 5: Implementar o wizard**

`app/onboarding/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';
export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

`app/onboarding/novo-concurso.tsx`:

```tsx
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Input, useToast } from '@/components/ui';
import { concursoInputSchema, arvoreSchema, type Arvore, type ConcursoInput } from '@/features/concurso/schema';
import { parseEditalTexto } from '@/features/concurso/parseEditalTexto';
import { ArvoreEditor } from '@/features/concurso/ArvoreEditor';
import { useCriarConcurso } from '@/features/concurso/hooks';
import type { AppError } from '@/lib/errors';

export default function NovoConcurso() {
  const router = useRouter();
  const toast = useToast();
  const criar = useCriarConcurso();
  const [passo, setPasso] = useState(1);
  const [dados, setDados] = useState<ConcursoInput>({ nome: '' });
  const [erroDados, setErroDados] = useState<string>();
  const [texto, setTexto] = useState('');
  const [arvore, setArvore] = useState<Arvore>({ disciplinas: [] });

  function avancarDados() {
    const r = concursoInputSchema.safeParse(dados);
    if (!r.success) { setErroDados(r.error.issues[0].message); return; }
    setErroDados(undefined);
    setPasso(2);
  }
  function processarTexto() {
    setArvore(parseEditalTexto(texto));
    setPasso(3);
  }
  async function confirmar() {
    const r = arvoreSchema.safeParse(arvore);
    if (!r.success) { toast.erro(r.error.issues[0].message); return; }
    try {
      await criar.mutateAsync({ concurso: dados, disciplinas: r.data.disciplinas });
      toast.sucesso('Concurso criado!');
      router.replace('/(app)');
    } catch (e) {
      toast.erro((e as AppError).message);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Novo concurso — passo {passo} de 3</Text>

      {passo === 1 && (
        <>
          <Input label="Nome do concurso" value={dados.nome} onChangeText={(t) => setDados((d) => ({ ...d, nome: t }))} error={erroDados} />
          <Input label="Banca (opcional)" value={dados.banca ?? ''} onChangeText={(t) => setDados((d) => ({ ...d, banca: t }))} />
          <Input label="Cargo (opcional)" value={dados.cargo ?? ''} onChangeText={(t) => setDados((d) => ({ ...d, cargo: t }))} />
          <Input label="Data da prova AAAA-MM-DD (opcional)" value={dados.data_prova ?? ''} onChangeText={(t) => setDados((d) => ({ ...d, data_prova: t || undefined }))} />
          <Button label="Continuar" onPress={avancarDados} />
        </>
      )}

      {passo === 2 && (
        <>
          <Text>Cole aqui a lista de conteúdos do edital.</Text>
          <Input label="Texto do edital" value={texto} onChangeText={setTexto} multiline />
          <Button label="Anexar PDF (em breve)" variant="secondary" disabled onPress={() => {}} />
          <Button label="Processar texto" onPress={processarTexto} disabled={!texto.trim()} />
          <Button label="Voltar" variant="ghost" onPress={() => setPasso(1)} />
        </>
      )}

      {passo === 3 && (
        <>
          <Text>Revise e ajuste a estrutura antes de salvar.</Text>
          <ArvoreEditor value={arvore} onChange={setArvore} />
          <Button label="Criar concurso" onPress={confirmar} loading={criar.isPending} />
          <Button label="Voltar" variant="ghost" onPress={() => setPasso(2)} />
        </>
      )}
    </ScrollView>
  );
}
```

- [ ] **Step 6: Teste do fluxo do wizard**

`app/onboarding/__tests__/novo-concurso.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/ui';
import NovoConcurso from '../novo-concurso';

const mutateAsync = jest.fn(() => Promise.resolve({ concursoId: 'c1' }));
jest.mock('@/features/concurso/hooks', () => ({ useCriarConcurso: () => ({ mutateAsync, isPending: false }) }));
const replace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace }) }));

const wrap = () => render(<ThemeProvider><ToastProvider><NovoConcurso /></ToastProvider></ThemeProvider>);

test('bloqueia avanço sem nome do concurso', () => {
  wrap();
  fireEvent.press(screen.getByText('Continuar'));
  expect(screen.getByText('Informe o nome do concurso')).toBeOnTheScreen();
});

test('fluxo completo cria concurso a partir de texto colado', async () => {
  wrap();
  fireEvent.changeText(screen.getByLabelText('Nome do concurso'), 'TRT-4');
  fireEvent.press(screen.getByText('Continuar'));
  fireEvent.changeText(screen.getByLabelText('Texto do edital'), '1 PORTUGUÊS\n1.1 Crase');
  fireEvent.press(screen.getByText('Processar texto'));
  fireEvent.press(screen.getByText('Criar concurso'));
  await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
  expect(mutateAsync.mock.calls[0][0].concurso.nome).toBe('TRT-4');
  expect(replace).toHaveBeenCalledWith('/(app)');
});
```

- [ ] **Step 7: Rodar tudo + typecheck**

Run: `npm test && npm run typecheck`
Expected: PASSA.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: wizard de cadastro do edital (colar texto + editor de arvore)"
```

---

## Task 11: Shell do app (tabs) e navegação principal

**Files:**
- Create: `app/(app)/_layout.tsx`, `app/(app)/index.tsx` (placeholder do painel), `app/(app)/edital/index.tsx` (placeholder), `app/(app)/revisar.tsx` (placeholder), `app/(app)/ajustes.tsx` (placeholder)
- Test: `app/(app)/__tests__/layout.test.tsx`

**Interfaces:**
- Consumes: `useConcursoAtivo` (Task 9), `useSession` (Task 8), componentes de UI (Task 5)
- Produces: tab navigator com 4 abas (`Painel`, `Edital`, `Revisar`, `Ajustes`); rotas de detalhe (`edital/disciplina/[id]`, `edital/topico/[id]`) fora das tabs mas dentro de `(app)`

- [ ] **Step 1: Instalar tabs**

```bash
npx expo install @react-navigation/bottom-tabs
```

- [ ] **Step 2: Teste que falha**

`app/(app)/__tests__/layout.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import AppLayout from '../_layout';

jest.mock('@/features/concurso/hooks', () => ({
  useConcursoAtivo: () => ({ data: { id: 'c1', nome: 'TRT-4', status: 'ativo' }, isLoading: false }),
}));
jest.mock('expo-router', () => {
  const React = require('react');
  return { Tabs: Object.assign(({ children }: any) => React.createElement(React.Fragment, null, children), { Screen: ({ options }: any) => React.createElement('Text', null, options?.title) }) };
});

test('renderiza os títulos das 4 abas', () => {
  render(<ThemeProvider><AppLayout /></ThemeProvider>);
  for (const t of ['Painel', 'Edital', 'Revisar', 'Ajustes']) {
    expect(screen.getByText(t)).toBeOnTheScreen();
  }
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npm test -- "app/(app)/__tests__/layout"`
Expected: FALHA.

- [ ] **Step 4: Implementar o layout de tabs**

`app/(app)/_layout.tsx`:

```tsx
import { Tabs } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';

export default function AppLayout() {
  const { c } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c('primary'),
        tabBarInactiveTintColor: c('muted'),
        tabBarStyle: { backgroundColor: c('bg'), borderTopColor: c('border') },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Painel' }} />
      <Tabs.Screen name="edital/index" options={{ title: 'Edital' }} />
      <Tabs.Screen name="revisar" options={{ title: 'Revisar' }} />
      <Tabs.Screen name="ajustes" options={{ title: 'Ajustes' }} />
      <Tabs.Screen name="edital/disciplina/[id]" options={{ href: null }} />
      <Tabs.Screen name="edital/topico/[id]" options={{ href: null }} />
    </Tabs>
  );
}
```

- [ ] **Step 5: Telas placeholder**

Cada uma renderiza um `<Text>` com o próprio nome (`Painel`, `Edital`, `Revisar`, `Ajustes`), dentro de `<SafeAreaView>`. Serão substituídas nas Tasks 15–18.

`app/(app)/index.tsx`:

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native';

export default function Painel() {
  return <SafeAreaView style={{ flex: 1 }}><Text>Painel</Text></SafeAreaView>;
}
```

(análogo para `edital/index.tsx`, `revisar.tsx`, `ajustes.tsx`)

- [ ] **Step 6: Rodar e ver passar**

Run: `npm test && npm run typecheck`
Expected: PASSA.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: shell do app com navegacao por abas"
```

---

## Task 12: Árvore do edital e CRUD de disciplina/assunto/tópico

**Files:**
- Create: `src/features/edital/api.ts`, `src/features/edital/hooks.ts`, `src/features/edital/EditalTree.tsx`
- Modify: `app/(app)/edital/index.tsx`, criar `app/(app)/edital/disciplina/[id].tsx`
- Test: `src/features/edital/__tests__/hooks.test.tsx`, `tests/integration/edital-crud.test.ts`

**Interfaces:**
- Consumes: `supabase` (Task 4), `qk` (Task 4), `useConcursoAtivo` (Task 9), UI (Task 5)
- Produces:
  - `useArvore(concursoId: string | null)` → `{ data: ArvoreCarregada | null; isLoading }` onde
    ```ts
    type TopicoRow = { id: string; nome: string; disciplina_id: string; assunto_id: string | null; ordem: number; concluido: boolean; concluido_em: string | null };
    type AssuntoRow = { id: string; nome: string; ordem: number; topicos: TopicoRow[] };
    type DisciplinaRow = { id: string; nome: string; peso: number; ordem: number; assuntos: AssuntoRow[]; topicos: TopicoRow[] };
    type ArvoreCarregada = { disciplinas: DisciplinaRow[] };
    ```
  - `useAddDisciplina()`, `useUpdateDisciplina()` (nome, peso), `useDeleteDisciplina()`
  - `useAddAssunto()`, `useUpdateAssunto()`, `useDeleteAssunto()`
  - `useAddTopico()`, `useUpdateTopico()` (nome), `useDeleteTopico()`
  - `<EditalTree data={ArvoreCarregada} onAbrirDisciplina={(id) => void} onAbrirTopico={(id) => void} />`
  - todas as mutations invalidam `qk.arvore(concursoId)`, `qk.progresso(concursoId)`, `qk.revisao(concursoId)`

- [ ] **Step 1: Teste de integração do CRUD que falha**

`tests/integration/edital-crud.test.ts`:

```ts
import { makeUser } from './helpers';

async function ctx() {
  const u = await makeUser(`ed${Date.now()}@x.com`);
  const { data: c } = await u.client.from('concursos').insert({ user_id: u.id, nome: 'C', status: 'ativo' }).select().single();
  return { u, c };
}

test('adicionar e apagar disciplina', async () => {
  const { u, c } = await ctx();
  const { data: d } = await u.client.from('disciplinas').insert({ user_id: u.id, concurso_id: c.id, nome: 'D', peso: 3, ordem: 0 }).select().single();
  await u.client.from('disciplinas').delete().eq('id', d.id);
  const { data } = await u.client.from('disciplinas').select('*').eq('concurso_id', c.id);
  expect(data).toEqual([]);
});

test('apagar assunto desagrupa tópicos (assunto_id vira null)', async () => {
  const { u, c } = await ctx();
  const { data: d } = await u.client.from('disciplinas').insert({ user_id: u.id, concurso_id: c.id, nome: 'D', peso: 3, ordem: 0 }).select().single();
  const { data: a } = await u.client.from('assuntos').insert({ user_id: u.id, disciplina_id: d.id, nome: 'A', ordem: 0 }).select().single();
  const { data: t } = await u.client.from('topicos').insert({ user_id: u.id, disciplina_id: d.id, assunto_id: a.id, nome: 'T', ordem: 0 }).select().single();
  await u.client.from('assuntos').delete().eq('id', a.id);
  const { data: r } = await u.client.from('topicos').select('assunto_id').eq('id', t.id).single();
  expect(r.assunto_id).toBeNull();
});
```

- [ ] **Step 2: Rodar e ver falhar/passar**

Run: `... npm run test:integration -- edital-crud`
Expected: PASSA se o schema/triggers das Tasks 2–3 estiverem certos (este teste valida o comportamento do banco que a feature depende). Se falhar, corrigir a migração antes de prosseguir.

- [ ] **Step 3: Implementar `edital/api.ts`**

`src/features/edital/api.ts`:

```ts
import { supabase } from '@/lib/supabase';
import { normalizeError } from '@/lib/errors';

export type TopicoRow = { id: string; nome: string; disciplina_id: string; assunto_id: string | null; ordem: number; concluido: boolean; concluido_em: string | null };
export type AssuntoRow = { id: string; nome: string; ordem: number; topicos: TopicoRow[] };
export type DisciplinaRow = { id: string; nome: string; peso: number; ordem: number; assuntos: AssuntoRow[]; topicos: TopicoRow[] };
export type ArvoreCarregada = { disciplinas: DisciplinaRow[] };

export async function carregarArvore(concursoId: string): Promise<ArvoreCarregada> {
  const [{ data: disc, error: e1 }, { data: ass, error: e2 }, { data: tops, error: e3 }] = await Promise.all([
    supabase.from('disciplinas').select('id, nome, peso, ordem').eq('concurso_id', concursoId).order('ordem'),
    supabase.from('assuntos').select('id, nome, ordem, disciplina_id').order('ordem'),
    supabase.from('topicos').select('id, nome, disciplina_id, assunto_id, ordem, concluido, concluido_em').order('ordem'),
  ]);
  if (e1 || e2 || e3) throw normalizeError(e1 ?? e2 ?? e3);

  const discIds = new Set((disc ?? []).map((d) => d.id));
  const disciplinas: DisciplinaRow[] = (disc ?? []).map((d) => {
    const assuntos: AssuntoRow[] = (ass ?? [])
      .filter((a) => a.disciplina_id === d.id)
      .map((a) => ({ id: a.id, nome: a.nome, ordem: a.ordem, topicos: (tops ?? []).filter((t) => t.assunto_id === a.id) as TopicoRow[] }));
    const topicos = (tops ?? []).filter((t) => t.disciplina_id === d.id && t.assunto_id === null) as TopicoRow[];
    return { id: d.id, nome: d.nome, peso: d.peso, ordem: d.ordem, assuntos, topicos };
  });
  return { disciplinas: disciplinas.filter((d) => discIds.has(d.id)) };
}

async function uid() {
  const { data } = await supabase.auth.getUser();
  return data.user!.id;
}

export async function addDisciplina(concursoId: string, nome: string, ordem: number) {
  const { error } = await supabase.from('disciplinas').insert({ user_id: await uid(), concurso_id: concursoId, nome, peso: 3, ordem });
  if (error) throw normalizeError(error);
}
export async function updateDisciplina(id: string, patch: { nome?: string; peso?: number }) {
  const { error } = await supabase.from('disciplinas').update(patch).eq('id', id);
  if (error) throw normalizeError(error);
}
export async function deleteDisciplina(id: string) {
  const { error } = await supabase.from('disciplinas').delete().eq('id', id);
  if (error) throw normalizeError(error);
}
export async function addAssunto(disciplinaId: string, nome: string, ordem: number) {
  const { error } = await supabase.from('assuntos').insert({ user_id: await uid(), disciplina_id: disciplinaId, nome, ordem });
  if (error) throw normalizeError(error);
}
export async function updateAssunto(id: string, nome: string) {
  const { error } = await supabase.from('assuntos').update({ nome }).eq('id', id);
  if (error) throw normalizeError(error);
}
export async function deleteAssunto(id: string) {
  const { error } = await supabase.from('assuntos').delete().eq('id', id);
  if (error) throw normalizeError(error);
}
export async function addTopico(disciplinaId: string, nome: string, ordem: number, assuntoId: string | null) {
  const { error } = await supabase.from('topicos').insert({ user_id: await uid(), disciplina_id: disciplinaId, assunto_id: assuntoId, nome, ordem });
  if (error) throw normalizeError(error);
}
export async function updateTopico(id: string, patch: { nome?: string }) {
  const { error } = await supabase.from('topicos').update(patch).eq('id', id);
  if (error) throw normalizeError(error);
}
export async function deleteTopico(id: string) {
  const { error } = await supabase.from('topicos').delete().eq('id', id);
  if (error) throw normalizeError(error);
}
```

- [ ] **Step 4: Implementar `edital/hooks.ts`**

`src/features/edital/hooks.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query';
import * as api from './api';

export function useArvore(concursoId: string | null) {
  return useQuery({
    queryKey: concursoId ? qk.arvore(concursoId) : ['arvore', 'none'],
    enabled: !!concursoId,
    queryFn: () => api.carregarArvore(concursoId!),
  });
}

function useInvalidar(concursoId: string | null) {
  const qc = useQueryClient();
  return () => {
    if (!concursoId) return;
    qc.invalidateQueries({ queryKey: qk.arvore(concursoId) });
    qc.invalidateQueries({ queryKey: qk.progresso(concursoId) });
    qc.invalidateQueries({ queryKey: qk.revisao(concursoId) });
  };
}

export function useEditalMutations(concursoId: string | null) {
  const inval = useInvalidar(concursoId);
  const m = <A extends unknown[]>(fn: (...a: A) => Promise<unknown>) =>
    useMutation({ mutationFn: (a: A) => fn(...a), onSuccess: inval });
  return {
    addDisciplina: m((nome: string, ordem: number) => api.addDisciplina(concursoId!, nome, ordem)),
    updateDisciplina: m(api.updateDisciplina),
    deleteDisciplina: m(api.deleteDisciplina),
    addAssunto: m(api.addAssunto),
    updateAssunto: m(api.updateAssunto),
    deleteAssunto: m(api.deleteAssunto),
    addTopico: m(api.addTopico),
    updateTopico: m(api.updateTopico),
    deleteTopico: m(api.deleteTopico),
  };
}
```

> Nota para o executor: `useMutation` não pode ser chamado dentro de um `.map`/helper condicionalmente. Reescreva `useEditalMutations` declarando cada `useMutation` explicitamente (uma linha por operação) para respeitar as regras dos hooks. O helper `m` acima é só ilustração da forma; expanda-o.

- [ ] **Step 5: Implementar `EditalTree` + telas**

`src/features/edital/EditalTree.tsx` — lista `SectionList`/`ScrollView` que, para cada disciplina, mostra nome, `ProgressBar` (concluídos/total da disciplina), e ao tocar chama `onAbrirDisciplina(id)`. Dentro da disciplina, lista tópicos (diretos e por assunto) com um check e nome; tocar num tópico chama `onAbrirTopico(id)`.

`app/(app)/edital/index.tsx`:

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { EmptyState } from '@/components/ui';
import { EditalTree } from '@/features/edital/EditalTree';
import { useArvore } from '@/features/edital/hooks';
import { useConcursoAtivo } from '@/features/concurso/hooks';

export default function Edital() {
  const router = useRouter();
  const { data: concurso } = useConcursoAtivo();
  const { data: arvore, isLoading } = useArvore(concurso?.id ?? null);

  if (isLoading) return null;
  if (!arvore || arvore.disciplinas.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <EmptyState titulo="Edital vazio" descricao="Adicione disciplinas para começar a acompanhar o progresso."
          acao={{ label: 'Adicionar disciplina', onPress: () => router.push('/(app)/edital/disciplina/nova') }} />
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <EditalTree
        data={arvore}
        onAbrirDisciplina={(id) => router.push(`/(app)/edital/disciplina/${id}`)}
        onAbrirTopico={(id) => router.push(`/(app)/edital/topico/${id}`)}
      />
    </SafeAreaView>
  );
}
```

`app/(app)/edital/disciplina/[id].tsx` — usa `useLocalSearchParams`, mostra `Input` do nome (salva no blur via `updateDisciplina`), seletor de peso 1–5, lista de tópicos com adicionar/renomear/remover, adicionar assunto. Rota especial `id === 'nova'` mostra só um `Input` + `Button` que chama `addDisciplina`.

- [ ] **Step 6: Teste de hook (mock do supabase)**

`src/features/edital/__tests__/hooks.test.tsx`:

```tsx
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useArvore } from '../hooks';

jest.mock('../api', () => ({
  carregarArvore: jest.fn(() => Promise.resolve({
    disciplinas: [{ id: 'd1', nome: 'Português', peso: 4, ordem: 0, assuntos: [], topicos: [{ id: 't1', nome: 'Crase', disciplina_id: 'd1', assunto_id: null, ordem: 0, concluido: false, concluido_em: null }] }],
  })),
}));

const wrapper = ({ children }: any) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

test('carrega a árvore do concurso', async () => {
  const { result } = renderHook(() => useArvore('c1'), { wrapper });
  await waitFor(() => expect(result.current.data).toBeDefined());
  expect(result.current.data!.disciplinas[0].nome).toBe('Português');
});
```

- [ ] **Step 7: Rodar tudo + typecheck**

Run: `npm test && npm run typecheck`
Expected: PASSA.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: arvore do edital e CRUD de disciplina/assunto/topico"
```

---

## Task 13: Detalhe do tópico — marcação de conclusão (otimista)

**Files:**
- Create: `app/(app)/edital/topico/[id].tsx`, `src/features/edital/useTopico.ts`
- Test: `src/features/edital/__tests__/useToggleConcluido.test.tsx`

**Interfaces:**
- Consumes: `supabase` (Task 4), `qk` (Task 4), `useArvore` (Task 12), UI (Task 5)
- Produces:
  - `useTopico(topicoId: string)` → `{ data: TopicoRow | null; isLoading }` (busca uma linha)
  - `useToggleConcluido(concursoId: string | null)` → mutation `(input: { topicoId: string; concluido: boolean }) => void` com update otimista sobre `qk.arvore(concursoId)` e rollback no erro
  - Rota `edital/topico/[id]` mostrando nome do tópico, disciplina, switch "Concluído", e (Tasks 14–15) cronômetro + sessões

- [ ] **Step 1: Teste do update otimista que falha**

`src/features/edital/__tests__/useToggleConcluido.test.tsx`:

```tsx
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { qk } from '@/lib/query';
import { useToggleConcluido } from '../useTopico';

const update = jest.fn(() => ({ eq: () => Promise.resolve({ error: null }) }));
jest.mock('@/lib/supabase', () => ({ supabase: { from: () => ({ update }) } }));

function setup() {
  const qc = new QueryClient();
  qc.setQueryData(qk.arvore('c1'), {
    disciplinas: [{ id: 'd1', nome: 'D', peso: 3, ordem: 0, assuntos: [], topicos: [{ id: 't1', nome: 'T', disciplina_id: 'd1', assunto_id: null, ordem: 0, concluido: false, concluido_em: null }] }],
  });
  const wrapper = ({ children }: any) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  return { qc, wrapper };
}

test('marca concluído otimisticamente antes da resposta', async () => {
  const { qc, wrapper } = setup();
  const { result } = renderHook(() => useToggleConcluido('c1'), { wrapper });
  act(() => { result.current.mutate({ topicoId: 't1', concluido: true }); });
  const arv: any = qc.getQueryData(qk.arvore('c1'));
  expect(arv.disciplinas[0].topicos[0].concluido).toBe(true);
  await waitFor(() => expect(update).toHaveBeenCalledWith({ concluido: true }));
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- useToggleConcluido`
Expected: FALHA.

- [ ] **Step 3: Implementar `useTopico.ts`**

`src/features/edital/useTopico.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { qk } from '@/lib/query';
import { normalizeError } from '@/lib/errors';
import type { ArvoreCarregada, TopicoRow } from './api';

export function useTopico(topicoId: string) {
  return useQuery({
    queryKey: ['topico', topicoId],
    queryFn: async (): Promise<TopicoRow | null> => {
      const { data, error } = await supabase
        .from('topicos')
        .select('id, nome, disciplina_id, assunto_id, ordem, concluido, concluido_em')
        .eq('id', topicoId)
        .maybeSingle();
      if (error) throw normalizeError(error);
      return data;
    },
  });
}

function aplicar(arv: ArvoreCarregada, topicoId: string, concluido: boolean): ArvoreCarregada {
  const patch = (t: TopicoRow) => (t.id === topicoId ? { ...t, concluido, concluido_em: concluido ? new Date().toISOString() : null } : t);
  return {
    disciplinas: arv.disciplinas.map((d) => ({
      ...d,
      topicos: d.topicos.map(patch),
      assuntos: d.assuntos.map((a) => ({ ...a, topicos: a.topicos.map(patch) })),
    })),
  };
}

export function useToggleConcluido(concursoId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ topicoId, concluido }: { topicoId: string; concluido: boolean }) => {
      const { error } = await supabase.from('topicos').update({ concluido }).eq('id', topicoId);
      if (error) throw normalizeError(error);
    },
    onMutate: async ({ topicoId, concluido }) => {
      if (!concursoId) return {};
      await qc.cancelQueries({ queryKey: qk.arvore(concursoId) });
      const anterior = qc.getQueryData<ArvoreCarregada>(qk.arvore(concursoId));
      if (anterior) qc.setQueryData(qk.arvore(concursoId), aplicar(anterior, topicoId, concluido));
      return { anterior };
    },
    onError: (_e, _v, ctx) => {
      if (concursoId && ctx?.anterior) qc.setQueryData(qk.arvore(concursoId), ctx.anterior);
    },
    onSettled: () => {
      if (!concursoId) return;
      qc.invalidateQueries({ queryKey: qk.arvore(concursoId) });
      qc.invalidateQueries({ queryKey: qk.progresso(concursoId) });
      qc.invalidateQueries({ queryKey: qk.revisao(concursoId) });
    },
  });
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- useToggleConcluido`
Expected: PASSA.

- [ ] **Step 5: Tela do tópico**

`app/(app)/edital/topico/[id].tsx`:

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, Switch, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { useToast } from '@/components/ui';
import { useTopico, useToggleConcluido } from '@/features/edital/useTopico';
import { useConcursoAtivo } from '@/features/concurso/hooks';
import type { AppError } from '@/lib/errors';

export default function TopicoDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c } = useTheme();
  const toast = useToast();
  const { data: concurso } = useConcursoAtivo();
  const { data: topico, isLoading } = useTopico(id);
  const toggle = useToggleConcluido(concurso?.id ?? null);

  if (isLoading || !topico) return null;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Text style={{ color: c('text'), fontSize: 24, fontWeight: '700' }}>{topico.nome}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: c('text') }}>Concluído</Text>
          <Switch
            value={topico.concluido}
            onValueChange={(v) =>
              toggle.mutate({ topicoId: topico.id, concluido: v }, { onError: (e) => toast.erro((e as AppError).message) })
            }
          />
        </View>
        {/* Cronômetro (Task 14) e Sessões de exercício (Task 15) entram aqui */}
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 6: Rodar tudo + typecheck**

Run: `npm test && npm run typecheck`
Expected: PASSA.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: detalhe do topico com marcacao de conclusao otimista"
```

---

## Task 14: Cronômetro de estudo (store + pílula + sessões, com entrada manual)

**Files:**
- Create: `src/features/estudo/timerStore.ts`, `src/features/estudo/TimerPill.tsx`, `src/features/estudo/api.ts`, `src/features/estudo/hooks.ts`, `src/features/estudo/SessoesEstudo.tsx`
- Modify: `app/(app)/edital/topico/[id].tsx` (adicionar controles do cronômetro + entrada manual + lista)
- Test: `src/features/estudo/__tests__/timerStore.test.ts`, `src/features/estudo/__tests__/api.test.ts`

**Interfaces:**
- Consumes: `AsyncStorage` (Task 1), `supabase`/`qk` (Task 4), UI (Task 5)
- Produces:
  - `useTimer` (Zustand): estado `{ topicoId: string | null; topicoNome: string | null; iniciadaEm: number | null; acumulado: number; status: 'idle' | 'running' | 'paused' }` e ações `start(topicoId, topicoNome)`, `pause()`, `resume()`, `reset()`, `hydrate(): Promise<void>`; seletor puro `segundosDecorridos(state, agora?): number`
  - `useEstudoMutations(concursoId)` → `salvarSessaoCronometro({ topicoId, iniciadaEm, duracaoSegundos })`, `salvarSessaoManual({ topicoId, data, duracaoSegundos, nota? })`
  - `useSessoesEstudo(topicoId)` → lista de `{ id; iniciada_em; duracao_segundos; origem; nota }`
  - `<TimerPill />` global; `<SessoesEstudo topicoId concursoId />` para a tela do tópico
  - chave AsyncStorage: `timer:v1`

- [ ] **Step 1: Testes do store que falham**

`src/features/estudo/__tests__/timerStore.test.ts`:

```ts
import { useTimer, segundosDecorridos } from '../timerStore';

beforeEach(() => useTimer.getState().reset());

test('start define topico e status running', () => {
  useTimer.getState().start('t1', 'Crase');
  expect(useTimer.getState().status).toBe('running');
  expect(useTimer.getState().topicoId).toBe('t1');
});

test('segundosDecorridos soma acumulado + segmento atual', () => {
  const t0 = 1_000_000_000_000;
  useTimer.setState({ status: 'running', iniciadaEm: t0, acumulado: 30, topicoId: 't1', topicoNome: 'X' });
  expect(segundosDecorridos(useTimer.getState(), new Date(t0 + 10_000))).toBe(40);
});

test('pause congela o acumulado e zera iniciadaEm', () => {
  const t0 = 1_000_000_000_000;
  useTimer.setState({ status: 'running', iniciadaEm: t0, acumulado: 0, topicoId: 't1', topicoNome: 'X' });
  useTimer.getState().pause(new Date(t0 + 5_000));
  expect(useTimer.getState().status).toBe('paused');
  expect(useTimer.getState().acumulado).toBe(5);
  expect(useTimer.getState().iniciadaEm).toBeNull();
});

test('resume retoma a contagem', () => {
  useTimer.setState({ status: 'paused', iniciadaEm: null, acumulado: 5, topicoId: 't1', topicoNome: 'X' });
  const t1 = 2_000_000_000_000;
  useTimer.getState().resume(new Date(t1));
  expect(useTimer.getState().status).toBe('running');
  expect(useTimer.getState().iniciadaEm).toBe(t1);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- timerStore`
Expected: FALHA.

- [ ] **Step 3: Implementar `timerStore.ts`**

`src/features/estudo/timerStore.ts`:

```ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'timer:v1';

type Status = 'idle' | 'running' | 'paused';
type Persistido = { topicoId: string | null; topicoNome: string | null; iniciadaEm: number | null; acumulado: number; status: Status };

type TimerState = Persistido & {
  start: (topicoId: string, topicoNome: string) => void;
  pause: (agora?: Date) => void;
  resume: (agora?: Date) => void;
  reset: () => void;
  hydrate: () => Promise<void>;
};

const inicial: Persistido = { topicoId: null, topicoNome: null, iniciadaEm: null, acumulado: 0, status: 'idle' };

function persist(s: Persistido) {
  AsyncStorage.setItem(KEY, JSON.stringify(s)).catch(() => {});
}

export const useTimer = create<TimerState>((set, get) => ({
  ...inicial,
  start: (topicoId, topicoNome) => {
    const s: Persistido = { topicoId, topicoNome, iniciadaEm: Date.now(), acumulado: 0, status: 'running' };
    set(s);
    persist(s);
  },
  pause: (agora = new Date()) => {
    const { iniciadaEm, acumulado } = get();
    const extra = iniciadaEm ? Math.floor((agora.getTime() - iniciadaEm) / 1000) : 0;
    const s: Persistido = { ...get(), iniciadaEm: null, acumulado: acumulado + extra, status: 'paused' };
    set(s);
    persist(s);
  },
  resume: (agora = new Date()) => {
    const s: Persistido = { ...get(), iniciadaEm: agora.getTime(), status: 'running' };
    set(s);
    persist(s);
  },
  reset: () => {
    set(inicial);
    persist(inicial);
  },
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) set(JSON.parse(raw) as Persistido);
    } catch {}
  },
}));

export function segundosDecorridos(
  s: Pick<TimerState, 'iniciadaEm' | 'acumulado' | 'status'>, agora: Date = new Date(),
): number {
  if (s.status === 'running' && s.iniciadaEm) {
    return s.acumulado + Math.floor((agora.getTime() - s.iniciadaEm) / 1000);
  }
  return s.acumulado;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- timerStore`
Expected: PASSA.

- [ ] **Step 5: Teste da API de sessões que falha**

`src/features/estudo/__tests__/api.test.ts`:

```ts
import { salvarSessaoCronometro } from '../api';

const insert = jest.fn(() => Promise.resolve({ error: null }));
jest.mock('@/lib/supabase', () => ({
  supabase: { from: () => ({ insert }), auth: { getUser: () => Promise.resolve({ data: { user: { id: 'u1' } } }) } },
}));

test('salvarSessaoCronometro insere com origem cronometro', async () => {
  await salvarSessaoCronometro({ topicoId: 't1', iniciadaEm: '2026-09-01T10:00:00Z', duracaoSegundos: 1500 });
  expect(insert).toHaveBeenCalledWith(expect.objectContaining({
    user_id: 'u1', topico_id: 't1', duracao_segundos: 1500, origem: 'cronometro',
  }));
});
```

- [ ] **Step 6: Rodar e ver falhar, depois implementar `api.ts` + `hooks.ts`**

`src/features/estudo/api.ts`:

```ts
import { supabase } from '@/lib/supabase';
import { normalizeError } from '@/lib/errors';

async function uid() {
  const { data } = await supabase.auth.getUser();
  return data.user!.id;
}

export async function salvarSessaoCronometro(input: { topicoId: string; iniciadaEm: string; duracaoSegundos: number }) {
  const { error } = await supabase.from('sessoes_estudo').insert({
    user_id: await uid(), topico_id: input.topicoId, iniciada_em: input.iniciadaEm,
    duracao_segundos: input.duracaoSegundos, origem: 'cronometro',
  });
  if (error) throw normalizeError(error);
}

export async function salvarSessaoManual(input: { topicoId: string; data: string; duracaoSegundos: number; nota?: string }) {
  const { error } = await supabase.from('sessoes_estudo').insert({
    user_id: await uid(), topico_id: input.topicoId,
    iniciada_em: `${input.data}T12:00:00Z`, duracao_segundos: input.duracaoSegundos,
    origem: 'manual', nota: input.nota ?? null,
  });
  if (error) throw normalizeError(error);
}

export async function listarSessoesEstudo(topicoId: string) {
  const { data, error } = await supabase
    .from('sessoes_estudo')
    .select('id, iniciada_em, duracao_segundos, origem, nota')
    .eq('topico_id', topicoId)
    .order('iniciada_em', { ascending: false });
  if (error) throw normalizeError(error);
  return data ?? [];
}
```

`src/features/estudo/hooks.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query';
import * as api from './api';

export function useSessoesEstudo(topicoId: string) {
  return useQuery({ queryKey: qk.sessoesEstudo(topicoId), queryFn: () => api.listarSessoesEstudo(topicoId) });
}

export function useEstudoMutations(concursoId: string | null, topicoId: string) {
  const qc = useQueryClient();
  const inval = () => {
    qc.invalidateQueries({ queryKey: qk.sessoesEstudo(topicoId) });
    if (concursoId) qc.invalidateQueries({ queryKey: qk.progresso(concursoId) });
  };
  return {
    salvarCronometro: useMutation({ mutationFn: api.salvarSessaoCronometro, onSuccess: inval }),
    salvarManual: useMutation({ mutationFn: api.salvarSessaoManual, onSuccess: inval }),
  };
}
```

- [ ] **Step 7: `TimerPill` + hidratação no layout**

`src/features/estudo/TimerPill.tsx` — lê `useTimer`, renderiza `null` quando `status === 'idle'`. Quando ativo, mostra `topicoNome` + tempo formatado (`mm:ss`), botão pausar/retomar. Usa um `setInterval(1000)` local só para re-render enquanto `running`. Não grava sessão aqui (isso é na tela do tópico, ao "Parar").

Em `app/_layout.tsx`, dentro de um `useEffect`, chamar `useTimer.getState().hydrate()` uma vez no mount. Substituir o stub `TimerPill` da Task 8 pelo componente real.

- [ ] **Step 8: Bloco do cronômetro na tela do tópico**

`src/features/estudo/SessoesEstudo.tsx` — recebe `topicoId`, `concursoId`. Renderiza:
- Se o `useTimer` está neste tópico: tempo corrente + botões **Pausar/Retomar** e **Parar** (ao parar: `salvarCronometro.mutate({ topicoId, iniciadaEm: new Date(iniciadaEm).toISOString(), duracaoSegundos: segundosDecorridos(state) })` e `useTimer.getState().reset()`).
- Se `useTimer` está em OUTRO tópico: aviso "Cronômetro rodando em outro tópico" + botão que pausa/salva o outro antes de iniciar aqui.
- Se `idle`: botão **Iniciar cronômetro** (`useTimer.getState().start(topicoId, nomeTopico)`).
- Sempre: formulário de **registro manual** — `Input` de minutos (numérico) + `Input` de data (AAAA-MM-DD, default hoje) + `Button` "Registrar tempo" → `salvarManual.mutate({ topicoId, data, duracaoSegundos: minutos*60 })`.
- Lista das sessões (`useSessoesEstudo`) com data, duração formatada e selo de origem.

Adicionar `<SessoesEstudo topicoId={topico.id} concursoId={concurso?.id ?? null} />` em `app/(app)/edital/topico/[id].tsx`.

- [ ] **Step 9: Teste de componente do fluxo parar→salva**

`src/features/estudo/__tests__/SessoesEstudo.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { SessoesEstudo } from '../SessoesEstudo';
import { useTimer } from '../timerStore';

const salvarCronometro = { mutate: jest.fn() };
jest.mock('../hooks', () => ({
  useSessoesEstudo: () => ({ data: [] }),
  useEstudoMutations: () => ({ salvarCronometro, salvarManual: { mutate: jest.fn() } }),
}));

test('parar o cronômetro salva a sessão e reseta', () => {
  useTimer.setState({ topicoId: 't1', topicoNome: 'T', status: 'running', iniciadaEm: Date.now() - 60000, acumulado: 0 });
  render(<ThemeProvider><SessoesEstudo topicoId="t1" concursoId="c1" /></ThemeProvider>);
  fireEvent.press(screen.getByText('Parar'));
  expect(salvarCronometro.mutate).toHaveBeenCalled();
  expect(useTimer.getState().status).toBe('idle');
});
```

- [ ] **Step 10: Rodar tudo + typecheck**

Run: `npm test && npm run typecheck`
Expected: PASSA.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: cronometro de estudo (store persistente, pilula, sessoes, registro manual)"
```

---

## Task 15: Registro de sessões de exercício

**Files:**
- Create: `src/features/exercicios/schema.ts`, `src/features/exercicios/api.ts`, `src/features/exercicios/hooks.ts`, `src/features/exercicios/SessoesExercicio.tsx`
- Modify: `app/(app)/edital/topico/[id].tsx`
- Test: `src/features/exercicios/__tests__/schema.test.ts`, `src/features/exercicios/__tests__/SessoesExercicio.test.tsx`

**Interfaces:**
- Consumes: `supabase`/`qk` (Task 4), UI (Task 5), `useConcursoAtivo` (Task 9)
- Produces:
  - `sessaoExercicioSchema` (zod): `{ data: string (AAAA-MM-DD), acertos: number>=0, erros: number>=0, nota?: string }` com refino `acertos + erros > 0`
  - `useSessoesExercicio(topicoId)` → lista `{ id; data; acertos; erros; nota }`
  - `useAddSessaoExercicio(concursoId, topicoId)` → mutation; invalida `qk.sessoesExercicio(topicoId)` e `qk.progresso(concursoId)`
  - `useDeleteSessaoExercicio(concursoId, topicoId)` → mutation
  - `<SessoesExercicio topicoId concursoId />`

- [ ] **Step 1: Teste do schema que falha**

`src/features/exercicios/__tests__/schema.test.ts`:

```ts
import { sessaoExercicioSchema } from '../schema';

test('aceita sessão válida', () => {
  expect(sessaoExercicioSchema.safeParse({ data: '2026-09-01', acertos: 8, erros: 2 }).success).toBe(true);
});

test('rejeita total zero', () => {
  expect(sessaoExercicioSchema.safeParse({ data: '2026-09-01', acertos: 0, erros: 0 }).success).toBe(false);
});

test('rejeita números negativos', () => {
  expect(sessaoExercicioSchema.safeParse({ data: '2026-09-01', acertos: -1, erros: 2 }).success).toBe(false);
});

test('rejeita data mal formatada', () => {
  expect(sessaoExercicioSchema.safeParse({ data: '01/09/2026', acertos: 1, erros: 0 }).success).toBe(false);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- exercicios/__tests__/schema`
Expected: FALHA.

- [ ] **Step 3: Implementar schema + api + hooks**

`src/features/exercicios/schema.ts`:

```ts
import { z } from 'zod';

export const sessaoExercicioSchema = z
  .object({
    data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD'),
    acertos: z.number().int().min(0, 'Não pode ser negativo'),
    erros: z.number().int().min(0, 'Não pode ser negativo'),
    nota: z.string().trim().optional(),
  })
  .refine((v) => v.acertos + v.erros > 0, { message: 'Informe ao menos uma questão', path: ['acertos'] });

export type SessaoExercicioInput = z.infer<typeof sessaoExercicioSchema>;
```

`src/features/exercicios/api.ts`:

```ts
import { supabase } from '@/lib/supabase';
import { normalizeError } from '@/lib/errors';
import type { SessaoExercicioInput } from './schema';

async function uid() {
  const { data } = await supabase.auth.getUser();
  return data.user!.id;
}

export async function listarSessoesExercicio(topicoId: string) {
  const { data, error } = await supabase
    .from('sessoes_exercicio')
    .select('id, data, acertos, erros, nota')
    .eq('topico_id', topicoId)
    .order('data', { ascending: false });
  if (error) throw normalizeError(error);
  return data ?? [];
}

export async function addSessaoExercicio(topicoId: string, input: SessaoExercicioInput) {
  const { error } = await supabase.from('sessoes_exercicio').insert({
    user_id: await uid(), topico_id: topicoId, data: input.data,
    acertos: input.acertos, erros: input.erros, nota: input.nota ?? null,
  });
  if (error) throw normalizeError(error);
}

export async function deleteSessaoExercicio(id: string) {
  const { error } = await supabase.from('sessoes_exercicio').delete().eq('id', id);
  if (error) throw normalizeError(error);
}
```

`src/features/exercicios/hooks.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query';
import * as api from './api';
import type { SessaoExercicioInput } from './schema';

export function useSessoesExercicio(topicoId: string) {
  return useQuery({ queryKey: qk.sessoesExercicio(topicoId), queryFn: () => api.listarSessoesExercicio(topicoId) });
}

export function useExercicioMutations(concursoId: string | null, topicoId: string) {
  const qc = useQueryClient();
  const inval = () => {
    qc.invalidateQueries({ queryKey: qk.sessoesExercicio(topicoId) });
    if (concursoId) qc.invalidateQueries({ queryKey: qk.progresso(concursoId) });
  };
  return {
    adicionar: useMutation({ mutationFn: (input: SessaoExercicioInput) => api.addSessaoExercicio(topicoId, input), onSuccess: inval }),
    remover: useMutation({ mutationFn: api.deleteSessaoExercicio, onSuccess: inval }),
  };
}
```

- [ ] **Step 4: Componente `SessoesExercicio`**

`src/features/exercicios/SessoesExercicio.tsx` — formulário: `Input` numérico de acertos, `Input` numérico de erros, `Input` de data (default hoje), `Input` de nota opcional; valida com `sessaoExercicioSchema.safeParse`, mostra erro no campo; ao salvar chama `adicionar.mutate`. Abaixo, lista as sessões com `data`, `acertos/total`, `%` e botão remover. Mostra taxa acumulada do tópico no topo (`Σacertos / Σtotal`).

Adicionar `<SessoesExercicio topicoId={topico.id} concursoId={concurso?.id ?? null} />` na tela do tópico.

- [ ] **Step 5: Teste de componente**

`src/features/exercicios/__tests__/SessoesExercicio.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { SessoesExercicio } from '../SessoesExercicio';

const adicionar = { mutate: jest.fn(), isPending: false };
jest.mock('../hooks', () => ({
  useSessoesExercicio: () => ({ data: [{ id: 's1', data: '2026-09-01', acertos: 8, erros: 2, nota: null }] }),
  useExercicioMutations: () => ({ adicionar, remover: { mutate: jest.fn() } }),
}));

test('mostra a taxa da sessão existente', () => {
  render(<ThemeProvider><SessoesExercicio topicoId="t1" concursoId="c1" /></ThemeProvider>);
  expect(screen.getByText(/80%/)).toBeOnTheScreen();
});

test('valida total zero antes de salvar', async () => {
  render(<ThemeProvider><SessoesExercicio topicoId="t1" concursoId="c1" /></ThemeProvider>);
  fireEvent.press(screen.getByText('Registrar exercícios'));
  await waitFor(() => expect(screen.getByText('Informe ao menos uma questão')).toBeOnTheScreen());
  expect(adicionar.mutate).not.toHaveBeenCalled();
});
```

- [ ] **Step 6: Rodar tudo + typecheck**

Run: `npm test && npm run typecheck`
Expected: PASSA.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: registro de sessoes de exercicio por topico"
```

---

## Task 16: Painel de progresso (dashboard)

**Files:**
- Create: `src/features/progresso/hooks.ts`, `src/features/progresso/format.ts`
- Modify: `app/(app)/index.tsx`
- Test: `src/features/progresso/__tests__/format.test.ts`, `src/features/progresso/__tests__/hooks.test.tsx`

**Interfaces:**
- Consumes: `metrics.ts` (Task 7), `carregarArvore` (Task 12), `supabase`/`qk` (Task 4), `useConcursoAtivo` (Task 9), UI `Stat`/`Card`/`ProgressBar`/`EmptyState` (Task 5)
- Produces:
  - `useProgresso(concursoId: string | null)` → `{ data: PainelDados | null; isLoading }` onde
    ```ts
    type LinhaDisciplina = { id: string; nome: string; peso: number; cobertura: number; aproveitamento: number | null; tempoSegundos: number };
    type PainelDados = {
      cobertura: number;
      coberturaPonderada: number;
      aproveitamentoGeral: number | null;
      tempoTotalSegundos: number;
      tempo7diasSegundos: number;
      disciplinas: LinhaDisciplina[];
    };
    ```
  - `formatarPct(v: number | null): string` (`'—'` para null, senão `'73%'`)
  - `formatarDuracao(seg: number): string` (`'2h 15min'`, `'45min'`, `'0min'`)

- [ ] **Step 1: Testes de formatação que falham**

`src/features/progresso/__tests__/format.test.ts`:

```ts
import { formatarPct, formatarDuracao } from '../format';

test('formatarPct arredonda e trata null', () => {
  expect(formatarPct(0.734)).toBe('73%');
  expect(formatarPct(1)).toBe('100%');
  expect(formatarPct(null)).toBe('—');
});

test('formatarDuracao', () => {
  expect(formatarDuracao(0)).toBe('0min');
  expect(formatarDuracao(2700)).toBe('45min');
  expect(formatarDuracao(8100)).toBe('2h 15min');
  expect(formatarDuracao(7200)).toBe('2h');
});
```

- [ ] **Step 2: Rodar e ver falhar, implementar `format.ts`**

`src/features/progresso/format.ts`:

```ts
export function formatarPct(v: number | null): string {
  if (v === null || Number.isNaN(v)) return '—';
  return `${Math.round(v * 100)}%`;
}

export function formatarDuracao(seg: number): string {
  const min = Math.round(seg / 60);
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}
```

- [ ] **Step 3: Implementar `progresso/hooks.ts`**

`src/features/progresso/hooks.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { qk } from '@/lib/query';
import { normalizeError } from '@/lib/errors';
import { carregarArvore } from '@/features/edital/api';
import { coberturaEdital, coberturaPonderada, aproveitamento, tempoEstudado } from './metrics';
import type { TopicoLite, DisciplinaLite, SessaoEstudoLite, SessaoExercicioLite } from '@/types/models';

export type LinhaDisciplina = {
  id: string; nome: string; peso: number;
  cobertura: number; aproveitamento: number | null; tempoSegundos: number;
};
export type PainelDados = {
  cobertura: number; coberturaPonderada: number;
  aproveitamentoGeral: number | null;
  tempoTotalSegundos: number; tempo7diasSegundos: number;
  disciplinas: LinhaDisciplina[];
};

export function useProgresso(concursoId: string | null) {
  return useQuery({
    queryKey: concursoId ? qk.progresso(concursoId) : ['progresso', 'none'],
    enabled: !!concursoId,
    queryFn: async (): Promise<PainelDados> => {
      const arvore = await carregarArvore(concursoId!);

      const disciplinas: DisciplinaLite[] = arvore.disciplinas.map((d) => ({ id: d.id, nome: d.nome, peso: d.peso }));
      const topicos: TopicoLite[] = [];
      for (const d of arvore.disciplinas) {
        for (const t of d.topicos) topicos.push({ id: t.id, disciplinaId: d.id, concluido: t.concluido });
        for (const a of d.assuntos) for (const t of a.topicos) topicos.push({ id: t.id, disciplinaId: d.id, concluido: t.concluido });
      }
      const topicoIds = topicos.map((t) => t.id);

      const [{ data: se, error: e1 }, { data: sx, error: e2 }] = await Promise.all([
        topicoIds.length
          ? supabase.from('sessoes_estudo').select('topico_id, duracao_segundos, iniciada_em').in('topico_id', topicoIds)
          : Promise.resolve({ data: [], error: null }),
        topicoIds.length
          ? supabase.from('sessoes_exercicio').select('topico_id, acertos, erros, data').in('topico_id', topicoIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (e1 || e2) throw normalizeError(e1 ?? e2);

      const sessoesEstudo: SessaoEstudoLite[] = (se ?? []).map((s) => ({ topicoId: s.topico_id, duracaoSegundos: s.duracao_segundos, iniciadaEm: s.iniciada_em }));
      const sessoesExercicio: SessaoExercicioLite[] = (sx ?? []).map((s) => ({ topicoId: s.topico_id, acertos: s.acertos, erros: s.erros, data: s.data }));

      const cob = coberturaEdital(topicos);
      const apr = aproveitamento(sessoesExercicio, topicos);
      const tmp = tempoEstudado(sessoesEstudo, topicos);

      return {
        cobertura: cob.geral,
        coberturaPonderada: coberturaPonderada(disciplinas, topicos),
        aproveitamentoGeral: apr.geral,
        tempoTotalSegundos: tmp.totalSegundos,
        tempo7diasSegundos: tmp.ultimos7diasSegundos,
        disciplinas: arvore.disciplinas.map((d) => ({
          id: d.id, nome: d.nome, peso: d.peso,
          cobertura: cob.porDisciplina.get(d.id) ?? 0,
          aproveitamento: apr.porDisciplina.get(d.id) ?? null,
          tempoSegundos: tmp.porDisciplina.get(d.id) ?? 0,
        })),
      };
    },
  });
}
```

- [ ] **Step 4: Teste do hook (mocks)**

`src/features/progresso/__tests__/hooks.test.tsx`:

```tsx
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProgresso } from '../hooks';

jest.mock('@/features/edital/api', () => ({
  carregarArvore: () => Promise.resolve({
    disciplinas: [
      { id: 'd1', nome: 'Português', peso: 5, ordem: 0, assuntos: [], topicos: [
        { id: 't1', nome: 'A', disciplina_id: 'd1', assunto_id: null, ordem: 0, concluido: true, concluido_em: null },
        { id: 't2', nome: 'B', disciplina_id: 'd1', assunto_id: null, ordem: 1, concluido: false, concluido_em: null },
      ] },
    ],
  }),
}));
jest.mock('@/lib/supabase', () => ({
  supabase: { from: () => ({ select: () => ({ in: () => Promise.resolve({ data: [], error: null }) }) }) },
}));

const wrapper = ({ children }: any) => <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;

test('calcula cobertura 0.5 e ponderada 0.5', async () => {
  const { result } = renderHook(() => useProgresso('c1'), { wrapper });
  await waitFor(() => expect(result.current.data).toBeDefined());
  expect(result.current.data!.cobertura).toBeCloseTo(0.5);
  expect(result.current.data!.coberturaPonderada).toBeCloseTo(0.5);
  expect(result.current.data!.aproveitamentoGeral).toBeNull();
});
```

- [ ] **Step 5: Tela do painel**

`app/(app)/index.tsx`:

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, Text, View } from 'react-native';
import { Card, Stat, ProgressBar, EmptyState } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useConcursoAtivo } from '@/features/concurso/hooks';
import { useProgresso } from '@/features/progresso/hooks';
import { formatarPct, formatarDuracao } from '@/features/progresso/format';

export default function Painel() {
  const { c } = useTheme();
  const { data: concurso } = useConcursoAtivo();
  const { data, isLoading } = useProgresso(concurso?.id ?? null);

  if (isLoading || !data) return null;
  const semConteudo = data.disciplinas.length === 0;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={{ color: c('text'), fontSize: 22, fontWeight: '700' }}>{concurso?.nome}</Text>

        {semConteudo ? (
          <EmptyState titulo="Sem disciplinas ainda" descricao="Cadastre o conteúdo do edital para ver seu progresso." />
        ) : (
          <>
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Stat rotulo="Cobertura do edital" valor={formatarPct(data.cobertura)} />
                <Stat rotulo="Ponderada por peso" valor={formatarPct(data.coberturaPonderada)} />
              </View>
              <View style={{ marginTop: 8 }}><ProgressBar value={data.cobertura} /></View>
            </Card>

            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Stat rotulo="Aproveitamento" valor={formatarPct(data.aproveitamentoGeral)} />
                <Stat rotulo="Tempo total" valor={formatarDuracao(data.tempoTotalSegundos)} sub={`${formatarDuracao(data.tempo7diasSegundos)} nos últimos 7 dias`} />
              </View>
            </Card>

            <Text style={{ color: c('muted'), marginTop: 8 }}>Por disciplina</Text>
            {data.disciplinas.map((d) => (
              <Card key={d.id}>
                <Text style={{ color: c('text'), fontWeight: '600' }}>{d.nome} · peso {d.peso}</Text>
                <View style={{ marginTop: 6 }}><ProgressBar value={d.cobertura} /></View>
                <Text style={{ color: c('muted'), fontSize: 12, marginTop: 6 }}>
                  {formatarPct(d.cobertura)} concluído · aproveitamento {formatarPct(d.aproveitamento)} · {formatarDuracao(d.tempoSegundos)}
                </Text>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 6: Rodar tudo + typecheck**

Run: `npm test && npm run typecheck`
Expected: PASSA.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: painel de progresso (cobertura, ponderada, aproveitamento, tempo)"
```

---

## Task 17: Lista de revisão por data

**Files:**
- Create: `src/features/revisao/hooks.ts`
- Modify: `app/(app)/revisar.tsx`
- Test: `src/features/revisao/__tests__/hooks.test.tsx`

**Interfaces:**
- Consumes: `supabase`/`qk` (Task 4), `useConcursoAtivo` (Task 9), `useProfile` (Task 9, para `settings.limiaresRevisaoDias`), UI (Task 5)
- Produces:
  - `useRevisao(concursoId: string | null, limiares: number[])` → `{ data: GrupoRevisao[] | null; isLoading }` onde
    ```ts
    type ItemRevisao = { topicoId: string; nome: string; disciplinaNome: string; concluidoEm: string; diasDesde: number };
    type GrupoRevisao = { limiarDias: number; itens: ItemRevisao[] };
    ```
    Um tópico concluído entra no maior grupo cujo `limiarDias <= diasDesde`. Grupos vazios são omitidos.
  - `diasEntre(a: string, b: Date): number` (helper puro exportado para teste)

- [ ] **Step 1: Teste que falha**

`src/features/revisao/__tests__/hooks.test.tsx`:

```ts
import { agruparRevisao, diasEntre } from '../hooks';

test('diasEntre conta dias inteiros', () => {
  expect(diasEntre('2026-09-01T12:00:00Z', new Date('2026-09-11T12:00:00Z'))).toBe(10);
});

test('agrupa no maior limiar aplicável e ignora recentes', () => {
  const agora = new Date('2026-09-30T12:00:00Z');
  const topicos = [
    { topicoId: 't1', nome: 'Antigo', disciplinaNome: 'D', concluidoEm: '2026-08-15T12:00:00Z' }, // 46 dias -> 30
    { topicoId: 't2', nome: 'Médio', disciplinaNome: 'D', concluidoEm: '2026-09-10T12:00:00Z' }, // 20 dias -> 15
    { topicoId: 't3', nome: 'Recente', disciplinaNome: 'D', concluidoEm: '2026-09-28T12:00:00Z' }, // 2 dias -> nenhum
  ];
  const grupos = agruparRevisao(topicos, [7, 15, 30], agora);
  expect(grupos.map((g) => g.limiarDias)).toEqual([30, 15]);
  expect(grupos[0].itens[0].topicoId).toBe('t1');
  expect(grupos[1].itens[0].topicoId).toBe('t2');
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- revisao`
Expected: FALHA.

- [ ] **Step 3: Implementar**

`src/features/revisao/hooks.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { qk } from '@/lib/query';
import { normalizeError } from '@/lib/errors';

export type ItemRevisao = { topicoId: string; nome: string; disciplinaNome: string; concluidoEm: string; diasDesde: number };
export type GrupoRevisao = { limiarDias: number; itens: ItemRevisao[] };

export function diasEntre(iso: string, agora: Date): number {
  return Math.floor((agora.getTime() - new Date(iso).getTime()) / 86_400_000);
}

export function agruparRevisao(
  topicos: Array<{ topicoId: string; nome: string; disciplinaNome: string; concluidoEm: string }>,
  limiares: number[],
  agora: Date,
): GrupoRevisao[] {
  const ordenados = [...limiares].sort((a, b) => b - a); // maior primeiro
  const buckets = new Map<number, ItemRevisao[]>();
  for (const t of topicos) {
    const dias = diasEntre(t.concluidoEm, agora);
    const limiar = ordenados.find((l) => l <= dias);
    if (limiar === undefined) continue;
    const item: ItemRevisao = { ...t, diasDesde: dias };
    buckets.set(limiar, [...(buckets.get(limiar) ?? []), item]);
  }
  return ordenados
    .filter((l) => buckets.has(l))
    .map((l) => ({ limiarDias: l, itens: buckets.get(l)!.sort((a, b) => b.diasDesde - a.diasDesde) }));
}

export function useRevisao(concursoId: string | null, limiares: number[]) {
  return useQuery({
    queryKey: concursoId ? [...qk.revisao(concursoId), limiares.join(',')] : ['revisao', 'none'],
    enabled: !!concursoId,
    queryFn: async (): Promise<GrupoRevisao[]> => {
      const { data: disc, error: e1 } = await supabase
        .from('disciplinas').select('id, nome').eq('concurso_id', concursoId!);
      if (e1) throw normalizeError(e1);
      const nomeDisc = new Map((disc ?? []).map((d) => [d.id, d.nome]));

      const { data: tops, error: e2 } = await supabase
        .from('topicos')
        .select('id, nome, disciplina_id, concluido, concluido_em')
        .in('disciplina_id', (disc ?? []).map((d) => d.id))
        .eq('concluido', true)
        .not('concluido_em', 'is', null);
      if (e2) throw normalizeError(e2);

      return agruparRevisao(
        (tops ?? []).map((t) => ({
          topicoId: t.id, nome: t.nome,
          disciplinaNome: nomeDisc.get(t.disciplina_id) ?? '',
          concluidoEm: t.concluido_em as string,
        })),
        limiares,
        new Date(),
      );
    },
  });
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- revisao`
Expected: PASSA.

- [ ] **Step 5: Tela `revisar.tsx`**

`app/(app)/revisar.tsx` — usa `useConcursoAtivo`, `useSession` + `useProfile` para pegar `settings.limiaresRevisaoDias` (fallback `[7,15,30]`), chama `useRevisao`. Para cada `GrupoRevisao`, um cabeçalho ("Concluídos há 30+ dias") e a lista de itens (`nome` · `disciplinaNome` · "há N dias"), cada item navega para `/(app)/edital/topico/{topicoId}`. `EmptyState` "Nada para revisar por enquanto" quando não há grupos.

- [ ] **Step 6: Teste da tela**

`app/(app)/__tests__/revisar.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import Revisar from '../revisar';

jest.mock('@/features/concurso/hooks', () => ({ useConcursoAtivo: () => ({ data: { id: 'c1', nome: 'C' } }) }));
jest.mock('@/features/auth/useSession', () => ({ useSession: () => ({ session: { user: { id: 'u1' } } }) }));
jest.mock('@/features/settings/hooks', () => ({ useProfile: () => ({ data: { settings: { limiaresRevisaoDias: [7, 15, 30] } } }) }));
jest.mock('@/features/revisao/hooks', () => ({
  useRevisao: () => ({ data: [{ limiarDias: 30, itens: [{ topicoId: 't1', nome: 'Crase', disciplinaNome: 'Português', concluidoEm: '2026-08-01T12:00:00Z', diasDesde: 40 }] }], isLoading: false }),
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

test('lista item de revisão sob o cabeçalho do grupo', () => {
  render(<ThemeProvider><Revisar /></ThemeProvider>);
  expect(screen.getByText('Crase')).toBeOnTheScreen();
  expect(screen.getByText(/30/)).toBeOnTheScreen();
});
```

- [ ] **Step 7: Rodar tudo + typecheck**

Run: `npm test && npm run typecheck`
Expected: PASSA.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: lista de revisao por data com limiares configuraveis"
```

---

## Task 18: Ajustes (perfil, trocar/arquivar concurso, tema, limiares de revisão)

**Files:**
- Modify: `app/(app)/ajustes.tsx`
- Create: `src/features/concurso/TrocarConcurso.tsx`
- Test: `app/(app)/__tests__/ajustes.test.tsx`

**Interfaces:**
- Consumes: `useSession` (Task 8), `useProfile`/`useUpdateSettings` (Task 9), `useConcursos`/`useArquivarConcurso`/`useDefinirConcursoAtivo` (Task 9), `useTheme` (Task 5), UI (Task 5)
- Produces: tela de Ajustes com: nome de exibição (somente leitura), botão **Sair**, seletor de tema (`system`/`light`/`dark`) que chama `setOverride` + persiste em `settings.tema`, edição dos limiares de revisão (3 inputs numéricos → `settings.limiaresRevisaoDias`), lista de concursos com ação "Tornar ativo" e "Arquivar", botão "Novo concurso" → `onboarding/novo-concurso`

- [ ] **Step 1: Teste da tela que falha**

`app/(app)/__tests__/ajustes.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/ui';
import Ajustes from '../ajustes';

const signOut = jest.fn();
jest.mock('@/features/auth/useSession', () => ({ useSession: () => ({ session: { user: { id: 'u1' } }, signOut }) }));
jest.mock('@/features/settings/hooks', () => ({
  useProfile: () => ({ data: { display_name: 'Igor', active_concurso_id: 'c1', settings: { tema: 'system', limiaresRevisaoDias: [7, 15, 30] } } }),
  useUpdateSettings: () => ({ mutate: jest.fn() }),
}));
jest.mock('@/features/concurso/hooks', () => ({
  useConcursos: () => ({ data: [{ id: 'c1', nome: 'TRT-4', status: 'ativo' }] }),
  useArquivarConcurso: () => ({ mutate: jest.fn() }),
  useDefinirConcursoAtivo: () => ({ mutate: jest.fn() }),
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

const wrap = () => render(<ThemeProvider><ToastProvider><Ajustes /></ToastProvider></ThemeProvider>);

test('mostra nome e o concurso ativo', () => {
  wrap();
  expect(screen.getByText('Igor')).toBeOnTheScreen();
  expect(screen.getByText('TRT-4')).toBeOnTheScreen();
});

test('botão Sair chama signOut', () => {
  wrap();
  fireEvent.press(screen.getByText('Sair'));
  expect(signOut).toHaveBeenCalled();
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- ajustes`
Expected: FALHA.

- [ ] **Step 3: Implementar a tela**

`app/(app)/ajustes.tsx` — estrutura: `ScrollView` com seções em `Card`:
1. **Conta:** `Text` com `display_name`; `Button` "Sair" (`variant="danger"`, chama `signOut`).
2. **Aparência:** três `Button` (system/claro/escuro); o selecionado usa `variant="primary"`, os demais `secondary`. Ao tocar: `useTheme().setOverride(valor)` e `updateSettings.mutate({ tema: valor })`.
3. **Revisão:** três `Input` numéricos com os limiares atuais; ao editar, `updateSettings.mutate({ limiaresRevisaoDias: [a,b,c].sort((x,y)=>x-y) })`.
4. **Concursos:** `useConcursos().data.map(...)` → nome + status; se não for o ativo, `Button` "Tornar ativo" (`definirConcursoAtivo.mutate(id)`); `Button` "Arquivar" (`variant="ghost"`, confirma via `Alert.alert` antes de `arquivarConcurso.mutate(id)`). Abaixo, `Button` "Novo concurso" → `router.push('/onboarding/novo-concurso')`.

> Nota: arquivar o concurso ativo faz `active_concurso_id` virar `null`; o `AuthGate` então redireciona para o onboarding. Isso é o comportamento desejado.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- ajustes && npm run typecheck`
Expected: PASSA.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: tela de ajustes (conta, tema, limiares de revisao, troca de concurso)"
```

---

## Task 19: Fechamento — aplicar tema aos tokens do NativeWind, README, verificação final

**Files:**
- Modify: `app/_layout.tsx` (aplicar cor de fundo do tema ao container raiz), `tailwind.config.js` (mapear cores para uma única dimensão via CSS vars OU documentar uso de `useTheme().c`)
- Create: `README.md`, `docs/superpowers/plans/2026-09-07-fundacao-app-concurseiros.md` já existe (marcar tasks)
- Test: rodar suíte completa + `test:integration`

**Interfaces:**
- Consumes: tudo
- Produces: app navegável ponta a ponta em um device/emulador; README com passos de setup

- [ ] **Step 1: Fundo temático no container raiz**

Em `app/_layout.tsx`, envolver `<Slot />` num `<View style={{ flex: 1, backgroundColor: c('bg') }}>` usando um pequeno componente interno que chama `useTheme()` (precisa estar dentro de `ThemeProvider`).

- [ ] **Step 2: README**

`README.md` com: pré-requisitos (Node, `supabase` CLI, Expo Go/emulador), `npm install`, `npx supabase start`, criar `.env` a partir de `supabase status`, `npx supabase db reset`, `npm start`. Seção "Testes": `npm test` e `SUPABASE_SERVICE_ROLE_KEY=... SUPABASE_ANON_KEY=... npm run test:integration`. Seção "Escopo": link para a spec, lista do que está e do que não está no #1.

- [ ] **Step 3: Verificação completa**

Run: `npm run typecheck && npm run lint && npm test`
Expected: tudo PASSA, zero erros de tipo/lint.

Run: `npx supabase db reset && SUPABASE_SERVICE_ROLE_KEY=<key> SUPABASE_ANON_KEY=<key> npm run test:integration`
Expected: tudo PASSA.

- [ ] **Step 4: Teste manual guiado (registrar resultado no PR)**

Com `npm start` + Expo Go:
1. Criar conta por e-mail → cai no onboarding.
2. Wizard: nome "Teste", colar `1 PORTUGUÊS\n1.1 Crase\n1.2 Ortografia\n2 RLM\n2.1 Lógica`, processar, ajustar peso de PORTUGUÊS para 5, criar.
3. Painel mostra 0% cobertura, 4 tópicos.
4. Abrir tópico "Crase" → marcar concluído → voltar ao painel: cobertura sobe.
5. No tópico: iniciar cronômetro, esperar ~10s, parar → sessão aparece na lista; registrar 8 acertos / 2 erros → aproveitamento do painel = 80%.
6. Registrar tempo manual de 30min ontem → tempo total sobe.
7. Ajustes → tema escuro aplica na hora.
8. Fechar e reabrir o app → sessão mantida, cai direto no painel.
9. Ajustes → arquivar concurso → volta ao onboarding.

- [ ] **Step 5: Commit final**

```bash
git add -A
git commit -m "chore: fundo tematico, README e verificacao final da Fundacao"
```

---

## Self-Review (preenchido pelo autor do plano)

**1. Cobertura da spec:**

| Requisito da spec | Task |
|---|---|
| Um edital ativo por vez + histórico | 2 (schema `status`), 9 (`active_concurso_id`, arquivar/trocar), 18 |
| Login obrigatório, online-first, Google + e-mail/senha | 8 |
| Peso 1–5 por disciplina | 2 (constraint), 10 (editor), 12 (edição) |
| Hierarquia disciplina → (assunto) → tópico | 2, 6 (parser), 12 |
| Cadastro por texto colado + PDF "em breve" | 6, 10 |
| Marcação de conclusão + `concluido_em` | 3 (trigger), 13 |
| Cronômetro ao vivo + entrada manual + persistência | 14 |
| Sessões de exercício agregadas | 15 |
| Painel: cobertura, cobertura ponderada, aproveitamento, tempo (+7 dias) | 7, 16 |
| Revisão: lista por data com limiares configuráveis | 17 |
| Métricas no cliente, funções puras | 7, 16 |
| RLS por usuário | 3 |
| Tokens de tema / base para dark mode | 1, 5, 18, 19 |
| Tratamento de erros PT-BR + toasts + empty states | 4, 5, e telas |
| Testes: unit (parser/métricas), componente, integração (RLS/cascata/triggers) | 6, 7, 3, e por task |

Sem lacunas identificadas. Itens fora do escopo (#1) não têm task, por design.

**2. Placeholders:** nenhum "TBD"/"TODO" com conteúdo faltando. As telas descritas em prosa (12 passo 5, 14 passo 7–8, 17 passo 5, 18 passo 3) trazem props, hooks e comportamento exatos; os componentes centrais e toda a lógica têm código completo.

**3. Consistência de tipos:** `TopicoRow`/`AssuntoRow`/`DisciplinaRow`/`ArvoreCarregada` definidos na Task 12 e reusados nas 13 e 16. Tipos "Lite" definidos na Task 7 e consumidos na 16. `qk.*` definido na Task 4 e usado em todos os hooks. `Settings`/`Profile` definidos na Task 9 e usados em 17, 18. `AppError` da Task 4 usado nas telas. `segundosDecorridos`/`useTimer` da Task 14 usados na 14. Nomes de mutation (`salvarCronometro`, `salvarManual`, `adicionar`, `remover`) consistentes entre `hooks.ts` e os testes.

**Pendência conhecida para o executor:** a Task 8 referencia `TimerPill` (Task 14) e `useProfile` (Task 9). Ao executar em ordem estrita, criar stubs mínimos e completá-los nas tasks devidas (nota já incluída na Task 8, passo 6). A Task 12 passo 4 pede para expandir o helper `m()` em `useMutation` explícitos (regras dos hooks) — nota já incluída.
