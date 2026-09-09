# Acompanhamento Avançado + Identidade Visual (#1.5) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar as lacunas funcionais contra o software de referência da Gran (contagem regressiva pra prova, metas semanais, tipo de estudo, observação visível, histórico global, filtros) e aplicar uma identidade visual completa (paleta azul-marinho, Lora + Inter, cor por disciplina) em todas as telas.

**Architecture:** Unifica `sessoes_estudo` + `sessoes_exercicio` numa tabela `registros_estudo` (tempo opcional + questões + tipo + observação). Adiciona `disciplinas.cor` e tabela `metas` (uma por concurso). Métricas continuam calculadas no cliente por funções puras, agora com janela de período. Sem mudança de stack — só `expo-font` + Google Fonts.

**Tech Stack:** Expo SDK 57, Expo Router, TypeScript strict, Supabase (Postgres + Auth) na nuvem, TanStack Query v5, Zustand, zod, jest-expo + @testing-library/react-native v14, expo-font, @expo-google-fonts/lora, @expo-google-fonts/inter.

**Spec:** `docs/superpowers/specs/2026-09-09-acompanhamento-avancado-design.md`

## Global Constraints

- **Idioma da UI e das mensagens de erro: PT-BR.**
- **Base:** este plano roda a partir de `master` (que já tem o #1 + suporte web), branch `feat/acompanhamento`.
- **Banco na nuvem (sem Docker):** migrações via `npx supabase db push --db-url "<pooler>"`. Connection string do pooler (senha URL-encoded):
  `postgresql://postgres.ewhocfbaaaxdykuhtmwp:Q%40unu-zb%25aA%257D%2A@aws-0-sa-east-1.pooler.supabase.com:5432/postgres`
  Credenciais no `.env` (git-ignored). Testes de integração leem `.env` via dotenv (`npm run test:integration`).
- **TypeScript strict.** `@/*` → `src/*`.
- **RNTL v14:** testes de componente/tela são `async` com `await render(...)`, `await fireEvent...`, `await waitFor(...)`. `mock`-prefixar vars usadas dentro de factories `jest.mock`.
- **Tokens de tema:** cores/tipografia/espaçamento vêm de `src/theme/tokens.ts`. Nenhum hex hard-coded em componente, EXCETO `#FFFFFF` como cor-sobre-acento fixa e `#000` para sombra.
- **Modelo de sessão:** `registros_estudo` é a fonte ÚNICA de tempo e questões. `sessoes_estudo` e `sessoes_exercicio` são removidas.
- **Semana das metas começa no DOMINGO** (00:00 local).
- **Tipo de estudo:** exatamente `'Teoria' | 'Questões' | 'Simulado' | 'Lei Seca' | 'Jurisprudência' | 'Discursiva'`. Obrigatório ao registrar, default `'Teoria'`.
- **Paleta base:** azul-marinho `#12234a`. Acento reservado (violeta `#7c3aed` / lima `#bef264`) SÓ em conquista/celebração — nunca no dia a dia. Semânticas: verde `#059669`, vermelho `#dc2626`, âmbar `#d97706`.
- **Faixas de %:** verde ≥ 70 · âmbar ≥ 50 · vermelho < 50.
- **Fontes:** títulos e números grandes em **Lora** (600–700); corpo/labels/botões em **Inter**.
- **Paleta de disciplina (10, rodízio):** `#c8102e`, `#0ea5e9`, `#7c3aed`, `#059669`, `#d97706`, `#db2777`, `#0d9488`, `#65a30d`, `#4f46e5`, `#ea580c`.
- **App verde a cada task:** cada task termina com `npm test` + `npm run typecheck` + `npm run lint` verdes. Tasks que mexem no banco também rodam `npm run test:integration`.
- **Commits:** um por passo "Commit", prefixo convencional PT-BR, terminando com
  `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`
- **TDD:** todo comportamento com lógica (métricas, schema, store, migração) começa por um teste que falha.
- **Fora do escopo:** repetição espaçada real (#3), OCR (#2), flashcards (#5), Pomodoro (#6), gamificação — streak/XP/medalhas/confete (#6, só o token de acento fica definido), calendário mensal, export PDF/CSV (#18), metas por disciplina, edição inline de questões no edital.

---

## File Structure

### Tema e fontes
| Arquivo | Responsabilidade |
|---|---|
| `src/theme/tokens.ts` | Reescrito: paleta azul-marinho, acento reservado, semânticas, `disciplinaPalette`, faixas de % |
| `src/theme/fonts.ts` | `useAppFonts()` (carrega Lora + Inter via expo-font); constantes `FONT.serif` / `FONT.sans` |
| `src/theme/ThemeProvider.tsx` | Inalterado na API; ganha helper `fw()` (font-family por peso) — opcional |

### Componentes (`src/components/ui/`)
| Arquivo | Responsabilidade |
|---|---|
| `Button.tsx` `Card.tsx` `Input.tsx` `ProgressBar.tsx` `EmptyState.tsx` `Stat.tsx` `Toast.tsx` | Restilizados p/ os tokens novos + Lora nos números/títulos |
| `Pill.tsx` | `<Pill valor={number \| null} />` — % com faixa de cor por limiar |
| `DisciplinaDot.tsx` | `<DisciplinaDot cor nome? />` — bolinha da cor da disciplina |
| `PeriodoChips.tsx` | `<PeriodoChips value={Janela} onChange />` — seletor 7/14/30/tudo |
| `TipoEstudoSelect.tsx` | `<TipoEstudoSelect value onChange />` — 6 categorias |
| `MetaCard.tsx` | `<MetaCard label real meta formato />` — meta vs real + barra; variante "sem meta" |
| `CountdownCard.tsx` | `<CountdownCard dataProva />` — dias até a prova; oculto se null |
| `index.ts` | Barrel — re-exporta os novos |

### Métricas e tipos
| Arquivo | Responsabilidade |
|---|---|
| `src/types/models.ts` | + `RegistroLite`, `RegistroLiteFull`, `Janela`, `TipoEstudo` |
| `src/features/progresso/metrics.ts` | `aproveitamento`/`tempoEstudado` ganham `janela?`; + `realMetas`, `diasParaProva` |
| `src/features/historico/agrupar.ts` | `agruparHistorico(registros, filtro, janela, agora?)` — resumo + lista filtrada |
| `src/features/progresso/format.ts` | + `formatarDataBR` já existe em `src/lib/date.ts`; adiciona `formatarDiaSemana` |

### Camada de dados
| Arquivo | Responsabilidade |
|---|---|
| `src/features/registros/schema.ts` | `registroSchema` (zod), `TIPOS_ESTUDO` |
| `src/features/registros/api.ts` | `listarRegistrosDoTopico`, `criarRegistro`, `editarRegistro`, `apagarRegistro` |
| `src/features/registros/hooks.ts` | `useRegistrosDoTopico`, `useRegistroMutations(concursoId, topicoId)` |
| `src/features/registros/RegistrarEstudo.tsx` | Bloco unificado da tela do tópico (cronômetro + form de finalização + manual + lista) |
| `src/features/metas/api.ts` | `buscarMetas(concursoId)`, `salvarMetas(concursoId, patch)` (upsert) |
| `src/features/metas/hooks.ts` | `useMetas(concursoId)`, `useSalvarMetas(concursoId)` |
| `src/features/historico/api.ts` | `listarHistorico(concursoId)` — registros do concurso + nome/cor da disciplina + nome do tópico |
| `src/features/historico/hooks.ts` | `useHistorico(concursoId)` |
| `src/features/historico/HistoricoItem.tsx` | Linha do histórico |
| `src/features/historico/EditarRegistro.tsx` | Form de edição de um registro |
| `src/features/progresso/hooks.ts` | `usePainel(concursoId, janela)` — cobertura + aproveitamento(janela) + tempo(janela) + realMetas + diasParaProva |

### Removidos
- `src/features/estudo/{api,hooks,SessoesEstudo}.ts(x)` + `__tests__/` (mantém `timerStore.ts`, `TimerPill.tsx`)
- `src/features/exercicios/` (pasta inteira)

### Rotas (`app/`)
| Arquivo | Responsabilidade |
|---|---|
| `app/_layout.tsx` | + carregar fontes (`useAppFonts`), gate de splash |
| `app/(app)/_layout.tsx` | + 5ª aba `historico` |
| `app/(app)/index.tsx` | Painel repaginado (hub) |
| `app/(app)/historico.tsx` | Tela de histórico (nova) |
| `app/(app)/edital/index.tsx` | + barra de filtros + expandir/recolher |
| `app/(app)/edital/topico/[id].tsx` | Usa `RegistrarEstudo`; remove os 2 blocos antigos |
| `app/(app)/ajustes.tsx` | + data da prova, metas, cores das disciplinas |
| `app/(app)/revisar.tsx`, `app/(auth)/*`, `app/onboarding/novo-concurso.tsx` | Repaginação visual |

### Banco
| Arquivo | Responsabilidade |
|---|---|
| `supabase/migrations/0004_registros_estudo.sql` | `registros_estudo` + RLS + índices; `disciplinas.cor`; `metas` + RLS; cópia de dados; drop das tabelas antigas |
| `tests/integration/registros.test.ts` | RLS, cascata, migração de contagem |

---

## Task 1: Fontes (Lora + Inter) e tokens de tema novos

**Files:**
- Create: `src/theme/fonts.ts`
- Modify: `src/theme/tokens.ts` (reescrever), `app/_layout.tsx`
- Test: `src/theme/__tests__/tokens.test.ts`

**Interfaces:**
- Consumes: nada
- Produces:
  - `tokens.colors` com as chaves atuais (`bg`, `surface`, `border`, `text`, `muted`, `primary`, `success`, `danger`) + novas: `accent`, `accentSoft`, `warn`, `onAccent`. Cada uma `{ light, dark }`.
  - `tokens.disciplinaPalette: string[]` (10 hex)
  - `tokens.faixaPct(v: number | null): 'verde' | 'ambar' | 'vermelho' | 'neutro'` e `tokens.corFaixa(faixa): { fg, bg }`
  - `FONT = { serif: 'Lora_600SemiBold', serifBold: 'Lora_700Bold', sans: 'Inter_400Regular', sansMed: 'Inter_500Medium', sansSemi: 'Inter_600SemiBold', sansBold: 'Inter_700Bold' }` de `@/theme/fonts`
  - `useAppFonts(): boolean` (true quando as fontes carregaram)

- [ ] **Step 1: Instalar deps**

```bash
npx expo install expo-font @expo-google-fonts/lora @expo-google-fonts/inter expo-splash-screen
```

- [ ] **Step 2: Teste dos tokens que falha**

`src/theme/__tests__/tokens.test.ts`:

```ts
import { tokens } from '../tokens';

test('paleta base é azul-marinho', () => {
  expect(tokens.colors.bg.light).toBe('#F7F8FB');
  expect(tokens.colors.bg.dark).toBe('#0B1226');
  expect(tokens.colors.text.light).toBe('#12234A');
});

test('acento reservado existe e é violeta/lima', () => {
  expect(tokens.colors.accent.light).toBe('#7C3AED');
  expect(tokens.colors.accentSoft.light).toBe('#BEF264');
});

test('paleta de disciplina tem 10 cores hex', () => {
  expect(tokens.disciplinaPalette).toHaveLength(10);
  tokens.disciplinaPalette.forEach((c) => expect(c).toMatch(/^#[0-9a-fA-F]{6}$/));
});

test('faixaPct classifica por limiar', () => {
  expect(tokens.faixaPct(0.82)).toBe('verde');
  expect(tokens.faixaPct(0.55)).toBe('ambar');
  expect(tokens.faixaPct(0.3)).toBe('vermelho');
  expect(tokens.faixaPct(null)).toBe('neutro');
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npm test -- tokens`
Expected: FALHA (valores antigos).

- [ ] **Step 4: Reescrever `src/theme/tokens.ts`**

```ts
export const tokens = {
  colors: {
    bg: { light: '#F7F8FB', dark: '#0B1226' },
    surface: { light: '#FFFFFF', dark: '#152146' },
    surfaceAlt: { light: '#EEF1F7', dark: '#0E1730' },
    border: { light: '#E1E5EF', dark: '#24345F' },
    text: { light: '#12234A', dark: '#E7ECF7' },
    muted: { light: '#5B6B90', dark: '#8B97B8' },
    primary: { light: '#12234A', dark: '#AAB6DA' },
    success: { light: '#059669', dark: '#34D399' },
    danger: { light: '#DC2626', dark: '#F87171' },
    warn: { light: '#D97706', dark: '#FBBF24' },
    accent: { light: '#7C3AED', dark: '#A78BFA' },
    accentSoft: { light: '#BEF264', dark: '#BEF264' },
    onAccent: { light: '#FFFFFF', dark: '#FFFFFF' },
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48 },
  radius: { sm: 8, md: 12, lg: 16, xl: 22, full: 9999 },
  fontSize: { xs: 11, sm: 13, base: 15, md: 17, lg: 21, xl: 27, '2xl': 34 },
  disciplinaPalette: [
    '#C8102E', '#0EA5E9', '#7C3AED', '#059669', '#D97706',
    '#DB2777', '#0D9488', '#65A30D', '#4F46E5', '#EA580C',
  ] as string[],
  faixaPct(v: number | null): 'verde' | 'ambar' | 'vermelho' | 'neutro' {
    if (v === null || Number.isNaN(v)) return 'neutro';
    if (v >= 0.7) return 'verde';
    if (v >= 0.5) return 'ambar';
    return 'vermelho';
  },
  corFaixa(f: 'verde' | 'ambar' | 'vermelho' | 'neutro'): { fg: string; bg: string } {
    return {
      verde: { fg: '#15803D', bg: '#DCFCE7' },
      ambar: { fg: '#B45309', bg: '#FEF3C7' },
      vermelho: { fg: '#B91C1C', bg: '#FEE2E2' },
      neutro: { fg: '#5B6B90', bg: '#EEF1F7' },
    }[f];
  },
} as const;

export type Tokens = typeof tokens;
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npm test -- tokens && npm run typecheck`
Expected: PASSA.

- [ ] **Step 6: `src/theme/fonts.ts`**

```ts
import { useFonts, Lora_600SemiBold, Lora_700Bold } from '@expo-google-fonts/lora';
import {
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
} from '@expo-google-fonts/inter';

export const FONT = {
  serif: 'Lora_600SemiBold',
  serifBold: 'Lora_700Bold',
  sans: 'Inter_400Regular',
  sansMed: 'Inter_500Medium',
  sansSemi: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
} as const;

export function useAppFonts(): boolean {
  const [loaded] = useFonts({
    Lora_600SemiBold, Lora_700Bold,
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });
  return loaded;
}
```

- [ ] **Step 7: Gate de fontes em `app/_layout.tsx`**

No topo do módulo:

```tsx
import * as SplashScreen from 'expo-splash-screen';
import { useAppFonts } from '@/theme/fonts';

SplashScreen.preventAutoHideAsync().catch(() => {});
```

Dentro de `RootLayout`, antes do `return`:

```tsx
const fontsLoaded = useAppFonts();
useEffect(() => {
  if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
}, [fontsLoaded]);
if (!fontsLoaded) return null;
```

Mantenha o resto do layout (providers, `installAuthCacheReset`, `ThemedShell`) igual.

- [ ] **Step 8: `jest.setup.js` — mock de expo-font**

Adicionar (`@expo-google-fonts/*` reexporta `expo-font`):

```js
jest.mock('expo-font', () => ({
  ...jest.requireActual('expo-font'),
  useFonts: () => [true, null],
  isLoaded: () => true,
}));
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));
```

- [ ] **Step 9: Rodar tudo**

Run: `npm test && npm run typecheck && npm run lint`
Expected: PASSA (suíte inteira do #1 continua verde — os componentes só receberam valores de cor novos).

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: fontes Lora+Inter e tokens de tema novos (azul-marinho)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: Restilizar componentes primitivos + Pill + DisciplinaDot

**Files:**
- Modify: `src/components/ui/{Button,Card,Input,ProgressBar,EmptyState,Stat,Toast}.tsx`
- Create: `src/components/ui/Pill.tsx`, `src/components/ui/DisciplinaDot.tsx`
- Modify: `src/components/ui/index.ts`
- Test: `src/components/ui/__tests__/Pill.test.tsx`, `src/components/ui/__tests__/DisciplinaDot.test.tsx`; ajustar os testes existentes de UI se quebrarem

**Interfaces:**
- Consumes: `tokens`, `FONT` (Task 1), `useTheme`
- Produces:
  - `<Pill valor={number | null} sufixo?="%" testID? />` — renderiza `formatarPct(valor)` com `bg`/`fg` de `tokens.corFaixa(tokens.faixaPct(valor))`. `valor` é fração 0–1.
  - `<DisciplinaDot cor={string} nome?={string} size?={number} />` — `<View>` círculo `size` (default 10) cor `cor`; se `nome`, um `<Text>` ao lado (Lora).
  - Componentes existentes com a MESMA API pública; só o estilo muda. `Stat` e `Button` usam `FONT.serifBold` nos números/valores grandes.

- [ ] **Step 1: Testes que falham (Pill, DisciplinaDot)**

`src/components/ui/__tests__/Pill.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { Pill } from '../Pill';

test('mostra % e usa faixa verde para >=70%', async () => {
  await render(<ThemeProvider><Pill valor={0.82} testID="p" /></ThemeProvider>);
  expect(screen.getByText('82%')).toBeOnTheScreen();
});

test('valor null vira travessão neutro', async () => {
  await render(<ThemeProvider><Pill valor={null} testID="p" /></ThemeProvider>);
  expect(screen.getByText('—')).toBeOnTheScreen();
});
```

`src/components/ui/__tests__/DisciplinaDot.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { DisciplinaDot } from '../DisciplinaDot';

test('renderiza o nome quando passado', async () => {
  await render(<ThemeProvider><DisciplinaDot cor="#C8102E" nome="Português" /></ThemeProvider>);
  expect(screen.getByText('Português')).toBeOnTheScreen();
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- "ui/__tests__/Pill" "ui/__tests__/DisciplinaDot"`
Expected: FALHA — módulos não existem.

- [ ] **Step 3: Implementar `Pill.tsx`**

```tsx
import { Text, View } from 'react-native';
import { tokens } from '@/theme/tokens';
import { FONT } from '@/theme/fonts';
import { formatarPct } from '@/features/progresso/format';

export function Pill({ valor, testID }: { valor: number | null; testID?: string }) {
  const faixa = tokens.faixaPct(valor);
  const { fg, bg } = tokens.corFaixa(faixa);
  return (
    <View testID={testID} style={{ backgroundColor: bg, borderRadius: 9999, paddingVertical: 3, paddingHorizontal: 10, alignSelf: 'flex-start' }}>
      <Text style={{ color: fg, fontFamily: FONT.serifBold, fontSize: 13 }}>{formatarPct(valor)}</Text>
    </View>
  );
}
```

- [ ] **Step 4: Implementar `DisciplinaDot.tsx`**

```tsx
import { Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { FONT } from '@/theme/fonts';

export function DisciplinaDot({ cor, nome, size = 10 }: { cor: string; nome?: string; size?: number }) {
  const { c } = useTheme();
  const dot = <View style={{ width: size, height: size, borderRadius: size, backgroundColor: cor }} />;
  if (!nome) return dot;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {dot}
      <Text style={{ color: c('text'), fontFamily: FONT.serif, fontSize: 14 }}>{nome}</Text>
    </View>
  );
}
```

- [ ] **Step 5: Restilizar os primitivos**

Para cada um (`Button`, `Card`, `Input`, `ProgressBar`, `EmptyState`, `Stat`, `Toast`): manter a API, trocar os estilos para os tokens novos e aplicar `FONT`:
- `Button`: `borderRadius: tokens.radius.md`; `fontFamily: FONT.sansBold`; variante `primary` usa `c('primary')` de fundo com `c('onAccent')` no texto (no light `primary` é navy → texto branco; no dark `primary` é claro → precisa de texto escuro: use `variant`-aware `fg`).
- `Card`: `backgroundColor: c('surface')`, `borderColor: c('border')`, `borderRadius: tokens.radius.lg`.
- `Input`: label em `FONT.sansSemi` + `c('muted')`; borda `c('border')`, foco/erro como hoje.
- `ProgressBar`: trilho `c('border')`, preenchimento `c('primary')`; **nova prop opcional `cor?: string`** para sobrescrever (usada por barras "por disciplina").
- `EmptyState`: título em `FONT.serifBold`.
- `Stat`: `valor` em `FONT.serifBold` tamanho `tokens.fontSize.xl`; `rotulo`/`sub` em `FONT.sansMed` + `c('muted')`.
- `Toast`: fundo `c('text')` (navy) no light, `c('surface')` no dark; texto `FONT.sansSemi`.

- [ ] **Step 6: `index.ts` — re-exportar**

```ts
export { Pill } from './Pill';
export { DisciplinaDot } from './DisciplinaDot';
```

- [ ] **Step 7: Rodar suíte + ajustar testes quebrados**

Run: `npm test && npm run typecheck && npm run lint`
- Testes de `ProgressBar`/`Button`/`Input`/`Toast` que checam `style` específico podem precisar de ajuste (ex.: `width: '100%'` do fill continua; cores mudaram). Ajustar as asserções para o comportamento, não para valores de cor antigos. NÃO remover cobertura.
Expected: PASSA.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: restiliza componentes de UI + Pill e DisciplinaDot

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: Componentes de acompanhamento (PeriodoChips, TipoEstudoSelect, MetaCard, CountdownCard)

**Files:**
- Create: `src/components/ui/{PeriodoChips,TipoEstudoSelect,MetaCard,CountdownCard}.tsx`
- Modify: `src/components/ui/index.ts`, `src/types/models.ts`
- Test: `src/components/ui/__tests__/{PeriodoChips,TipoEstudoSelect,MetaCard,CountdownCard}.test.tsx`

**Interfaces:**
- Consumes: `tokens`, `FONT`, `useTheme`, `src/lib/date.ts` (`formatarDataBR`), `formatarDuracao`/`formatarPct` (`@/features/progresso/format`)
- Produces em `src/types/models.ts`:
  ```ts
  export type Janela = 7 | 14 | 30 | null; // null = tudo
  export type TipoEstudo = 'Teoria' | 'Questões' | 'Simulado' | 'Lei Seca' | 'Jurisprudência' | 'Discursiva';
  ```
- Produces:
  - `<PeriodoChips value={Janela} onChange={(j: Janela) => void} />` — chips "7d/14d/30d/tudo"; o ativo destacado.
  - `<TipoEstudoSelect value={TipoEstudo} onChange={(t: TipoEstudo) => void} />` — 6 chips selecionáveis (um ativo).
  - `<MetaCard label real meta formato />` onde `formato: 'horas' | 'questoes' | 'pct'`; mostra `real / meta` formatado + barra (`min(real/meta, 1)`); barra fica verde se `real >= meta`; se `meta == null` mostra só o real + texto "definir meta".
  - `<CountdownCard dataProva={string | null} />` — se null retorna `null`; senão card com "Prova em · <data> · <dia>" + número grande de dias (Lora). Estados: `> 0` "N / dias"; `== 0` "Hoje!"; `< 0` "Prova passou".

- [ ] **Step 1: Tipos em `models.ts`**

Adicionar `Janela` e `TipoEstudo` (acima). `npm run typecheck` deve continuar limpo.

- [ ] **Step 2: Testes que falham**

`MetaCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { MetaCard } from '../MetaCard';

test('mostra real / meta e barra cheia verde quando bate a meta', async () => {
  await render(<ThemeProvider><MetaCard label="Aproveitamento" real={0.77} meta={0.7} formato="pct" /></ThemeProvider>);
  expect(screen.getByText(/77%/)).toBeOnTheScreen();
  expect(screen.getByText(/70%/)).toBeOnTheScreen();
});

test('sem meta mostra "definir meta"', async () => {
  await render(<ThemeProvider><MetaCard label="Horas" real={6} meta={null} formato="horas" /></ThemeProvider>);
  expect(screen.getByText(/definir meta/i)).toBeOnTheScreen();
});
```

`CountdownCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { CountdownCard } from '../CountdownCard';

test('null não renderiza nada', async () => {
  const { toJSON } = await render(<ThemeProvider><CountdownCard dataProva={null} /></ThemeProvider>);
  expect(toJSON()).toBeNull();
});

test('data futura mostra os dias', async () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-09-09T12:00:00'));
  await render(<ThemeProvider><CountdownCard dataProva="2026-12-13" /></ThemeProvider>);
  expect(screen.getByText('95')).toBeOnTheScreen();
  jest.useRealTimers();
});
```

`PeriodoChips.test.tsx` e `TipoEstudoSelect.test.tsx`: renderizam as opções e disparam `onChange` no clique (async fireEvent).

- [ ] **Step 3: Rodar e ver falhar**

Run: `npm test -- PeriodoChips TipoEstudoSelect MetaCard CountdownCard`
Expected: FALHA.

- [ ] **Step 4: Implementar os 4 componentes**

`CountdownCard.tsx` — usa `diasParaProva` de metrics (Task 4). **Como Task 4 vem depois**, defina aqui uma função local mínima e substitua na Task 4:

```tsx
import { Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { FONT } from '@/theme/fonts';
import { formatarDataBR } from '@/lib/date';

function diasAte(iso: string, agora = new Date()): number {
  const [y, m, d] = iso.split('-').map(Number);
  const alvo = new Date(y, m - 1, d).getTime();
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).getTime();
  return Math.round((alvo - hoje) / 86_400_000);
}

export function CountdownCard({ dataProva }: { dataProva: string | null }) {
  const { c } = useTheme();
  if (!dataProva) return null;
  const dias = diasAte(dataProva);
  const label = dias > 0 ? `${dias}` : dias === 0 ? 'Hoje!' : 'Passou';
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: c('surface'), borderColor: c('border'), borderWidth: 1, borderRadius: 14, padding: 14, marginVertical: 12 }}>
      <View>
        <Text style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: c('muted'), fontFamily: FONT.sansSemi }}>Prova em</Text>
        <Text style={{ fontSize: 12, color: c('muted'), fontFamily: FONT.sans, marginTop: 2 }}>{formatarDataBR(dataProva)}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 30, color: c('text'), fontFamily: FONT.serifBold, lineHeight: 32 }}>{label}</Text>
        {dias > 0 ? <Text style={{ fontSize: 10, color: c('muted'), fontFamily: FONT.sans }}>dias</Text> : null}
      </View>
    </View>
  );
}
```

`MetaCard.tsx`:

```tsx
import { Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { FONT } from '@/theme/fonts';
import { formatarDuracao, formatarPct } from '@/features/progresso/format';

type Fmt = 'horas' | 'questoes' | 'pct';
const fmt = (v: number, f: Fmt) =>
  f === 'horas' ? formatarDuracao(v * 3600) : f === 'pct' ? formatarPct(v) : String(Math.round(v));

export function MetaCard({ label, real, meta, formato }: { label: string; real: number; meta: number | null; formato: Fmt }) {
  const { c } = useTheme();
  const bateu = meta != null && real >= meta;
  const frac = meta && meta > 0 ? Math.min(real / meta, 1) : 0;
  return (
    <View style={{ backgroundColor: c('surface'), borderColor: c('border'), borderWidth: 1, borderRadius: 12, padding: 12 }}>
      <Text style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6, color: c('muted'), fontFamily: FONT.sansSemi }}>{label}</Text>
      {meta == null ? (
        <>
          <Text style={{ fontSize: 16, color: c('text'), fontFamily: FONT.serifBold, marginTop: 3 }}>{fmt(real, formato)}</Text>
          <Text style={{ fontSize: 11, color: c('accent'), fontFamily: FONT.sansMed, marginTop: 4 }}>definir meta</Text>
        </>
      ) : (
        <>
          <Text style={{ fontSize: 16, color: c('text'), fontFamily: FONT.serifBold, marginTop: 3 }}>
            {fmt(real, formato)} <Text style={{ color: c('muted') }}>/ {fmt(meta, formato)}</Text>
          </Text>
          <View style={{ height: 5, borderRadius: 9999, backgroundColor: c('border'), overflow: 'hidden', marginTop: 7 }}>
            <View style={{ height: '100%', width: `${frac * 100}%`, backgroundColor: bateu ? c('success') : c('primary') }} />
          </View>
        </>
      )}
    </View>
  );
}
```

`PeriodoChips.tsx` e `TipoEstudoSelect.tsx`: lista de `Pressable` com `accessibilityLabel`, o ativo com `backgroundColor: c('text')` + texto `c('bg')`, os demais `c('surface')` + borda.

- [ ] **Step 5: Rodar e ver passar**

Run: `npm test && npm run typecheck && npm run lint`
Expected: PASSA.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: componentes PeriodoChips, TipoEstudoSelect, MetaCard, CountdownCard

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: Métricas — janela de período + `realMetas` + `diasParaProva` (aditivo)

**Files:**
- Modify: `src/types/models.ts`, `src/features/progresso/metrics.ts`, `src/features/progresso/format.ts`, `src/components/ui/CountdownCard.tsx`
- Test: `src/features/progresso/__tests__/metrics.test.ts` (adicionar casos)

**Interfaces:**
- Consumes: `TopicoLite`, `DisciplinaLite` (já existem), `Janela` (Task 3)
- Produces em `models.ts`:
  ```ts
  export type RegistroLite = {
    topicoId: string; disciplinaId: string; data: string; // 'AAAA-MM-DD'
    duracaoSegundos: number | null; acertos: number; erros: number;
  };
  ```
- Produces em `metrics.ts`:
  ```ts
  export function dentroDaJanela(data: string, janela: Janela, agora?: Date): boolean;
  export function aproveitamento(regs: RegistroLite[], topicos: TopicoLite[], janela?: Janela, agora?: Date):
    { geral: number | null; porDisciplina: Map<string, number | null> };
  export function tempoEstudado(regs: RegistroLite[], topicos: TopicoLite[], janela?: Janela, agora?: Date):
    { totalSegundos: number; porDisciplina: Map<string, number> };
  export function realMetas(
    regs: RegistroLite[], topicos: TopicoLite[], disciplinas: DisciplinaLite[], agora?: Date,
  ): { horasSemana: number; questoesSemana: number; conclusaoPct: number; aproveitamentoPct: number };
  export function diasParaProva(dataProva: string | null, agora?: Date):
    { dias: number; estado: 'futuro' | 'hoje' | 'passado' } | null;
  export function inicioDaSemana(agora?: Date): Date; // domingo 00:00 local
  ```
- `coberturaEdital` e `coberturaPonderada` — INALTERADAS.

> **Mudança de assinatura:** `aproveitamento` e `tempoEstudado` passam a receber `RegistroLite[]` em vez de `SessaoExercicioLite[]`/`SessaoEstudoLite[]`. Os callers (`progresso/hooks.ts` e os testes) são atualizados na Task 6. Aqui, os testes de metrics são reescritos para o formato novo.

- [ ] **Step 1: Reescrever/expandir `metrics.test.ts`**

Substituir os casos de `aproveitamento`/`tempoEstudado` para `RegistroLite[]` e adicionar:

```ts
import {
  coberturaEdital, coberturaPonderada, aproveitamento, tempoEstudado,
  realMetas, diasParaProva, inicioDaSemana, dentroDaJanela,
} from '../metrics';
import type { RegistroLite, TopicoLite, DisciplinaLite } from '@/types/models';

const T = (id: string, d: string, feito = false): TopicoLite => ({ id, disciplinaId: d, concluido: feito });
const R = (o: Partial<RegistroLite> & { topicoId: string; disciplinaId: string }): RegistroLite => ({
  data: '2026-09-01', duracaoSegundos: null, acertos: 0, erros: 0, ...o,
});

test('inicioDaSemana é o domingo 00:00', () => {
  const qua = new Date('2026-09-09T15:00:00'); // quarta
  const dom = inicioDaSemana(qua);
  expect(dom.getDay()).toBe(0);
  expect(dom.getHours()).toBe(0);
});

test('dentroDaJanela: 7d pega hoje, ignora 10 dias atrás', () => {
  const agora = new Date('2026-09-10T12:00:00');
  expect(dentroDaJanela('2026-09-08', 7, agora)).toBe(true);
  expect(dentroDaJanela('2026-08-30', 7, agora)).toBe(false);
  expect(dentroDaJanela('2020-01-01', null, agora)).toBe(true); // tudo
});

test('aproveitamento respeita a janela', () => {
  const agora = new Date('2026-09-10T12:00:00');
  const topicos = [T('t1', 'a')];
  const regs = [
    R({ topicoId: 't1', disciplinaId: 'a', data: '2026-09-09', acertos: 8, erros: 2 }),
    R({ topicoId: 't1', disciplinaId: 'a', data: '2026-08-01', acertos: 0, erros: 10 }),
  ];
  expect(aproveitamento(regs, topicos, 7, agora).geral).toBeCloseTo(0.8);
  expect(aproveitamento(regs, topicos, null, agora).geral).toBeCloseTo(8 / 20);
});

test('tempoEstudado soma só duração não-nula e respeita janela', () => {
  const agora = new Date('2026-09-10T12:00:00');
  const topicos = [T('t1', 'a')];
  const regs = [
    R({ topicoId: 't1', disciplinaId: 'a', data: '2026-09-09', duracaoSegundos: 3600 }),
    R({ topicoId: 't1', disciplinaId: 'a', data: '2026-09-09', duracaoSegundos: null, acertos: 5, erros: 0 }),
    R({ topicoId: 't1', disciplinaId: 'a', data: '2026-08-01', duracaoSegundos: 1800 }),
  ];
  expect(tempoEstudado(regs, topicos, 7, agora).totalSegundos).toBe(3600);
  expect(tempoEstudado(regs, topicos, null, agora).totalSegundos).toBe(5400);
});

test('realMetas: horas/questões da semana + % conclusão + % aproveitamento', () => {
  const agora = new Date('2026-09-09T12:00:00'); // quarta; semana começa dom 2026-09-06
  const disciplinas: DisciplinaLite[] = [{ id: 'a', nome: 'A', peso: 3 }];
  const topicos = [T('t1', 'a', true), T('t2', 'a', false)];
  const regs = [
    R({ topicoId: 't1', disciplinaId: 'a', data: '2026-09-07', duracaoSegundos: 7200, acertos: 6, erros: 4 }),
    R({ topicoId: 't1', disciplinaId: 'a', data: '2026-09-01', duracaoSegundos: 3600, acertos: 10, erros: 0 }), // fora da semana
  ];
  const r = realMetas(regs, topicos, disciplinas, agora);
  expect(r.horasSemana).toBeCloseTo(2);
  expect(r.questoesSemana).toBe(10);
  expect(r.conclusaoPct).toBeCloseTo(0.5);
  expect(r.aproveitamentoPct).toBeCloseTo(16 / 24); // acumulado (todas as questões)
});

test('diasParaProva: futuro / hoje / passado / null', () => {
  const agora = new Date('2026-09-09T12:00:00');
  expect(diasParaProva('2026-09-13', agora)).toEqual({ dias: 4, estado: 'futuro' });
  expect(diasParaProva('2026-09-09', agora)).toEqual({ dias: 0, estado: 'hoje' });
  expect(diasParaProva('2026-09-01', agora)!.estado).toBe('passado');
  expect(diasParaProva(null, agora)).toBeNull();
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- metrics`
Expected: FALHA.

- [ ] **Step 3: Adicionar `RegistroLite` em `models.ts`**

(bloco acima).

- [ ] **Step 4: Reescrever `metrics.ts`**

`coberturaEdital` e `coberturaPonderada`: **manter iguais**. Substituir `aproveitamento` e `tempoEstudado` e adicionar as novas:

```ts
import type { TopicoLite, DisciplinaLite, RegistroLite, Janela } from '@/types/models';

const pesoValido = (p: number) => (Number.isInteger(p) && p >= 1 && p <= 5 ? p : 3);
const diaLocal = (agora: Date) => new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
const parseData = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

export function inicioDaSemana(agora: Date = new Date()): Date {
  const d = diaLocal(agora);
  d.setDate(d.getDate() - d.getDay()); // volta pro domingo
  return d;
}

export function dentroDaJanela(data: string, janela: Janela, agora: Date = new Date()): boolean {
  if (janela == null) return true;
  const corte = diaLocal(agora).getTime() - (janela - 1) * 86_400_000;
  return parseData(data).getTime() >= corte;
}

// coberturaEdital(...) — inalterado
// coberturaPonderada(...) — inalterado

export function aproveitamento(
  regs: RegistroLite[], topicos: TopicoLite[], janela: Janela = null, agora: Date = new Date(),
): { geral: number | null; porDisciplina: Map<string, number | null> } {
  const disc = new Set(topicos.map((t) => t.disciplinaId));
  const por = new Map<string, { ac: number; tot: number }>();
  let acG = 0, totG = 0;
  for (const r of regs) {
    if (!dentroDaJanela(r.data, janela, agora)) continue;
    const tot = r.acertos + r.erros;
    if (tot === 0) continue;
    acG += r.acertos; totG += tot;
    const g = por.get(r.disciplinaId) ?? { ac: 0, tot: 0 };
    g.ac += r.acertos; g.tot += tot;
    por.set(r.disciplinaId, g);
  }
  const porDisciplina = new Map<string, number | null>();
  for (const d of disc) {
    const g = por.get(d);
    porDisciplina.set(d, g && g.tot ? g.ac / g.tot : null);
  }
  return { geral: totG ? acG / totG : null, porDisciplina };
}

export function tempoEstudado(
  regs: RegistroLite[], topicos: TopicoLite[], janela: Janela = null, agora: Date = new Date(),
): { totalSegundos: number; porDisciplina: Map<string, number> } {
  const disc = new Set(topicos.map((t) => t.disciplinaId));
  const porDisciplina = new Map<string, number>();
  let totalSegundos = 0;
  for (const r of regs) {
    if (r.duracaoSegundos == null) continue;
    if (!dentroDaJanela(r.data, janela, agora)) continue;
    totalSegundos += r.duracaoSegundos;
    if (disc.has(r.disciplinaId)) {
      porDisciplina.set(r.disciplinaId, (porDisciplina.get(r.disciplinaId) ?? 0) + r.duracaoSegundos);
    }
  }
  return { totalSegundos, porDisciplina };
}

export function realMetas(
  regs: RegistroLite[], topicos: TopicoLite[], disciplinas: DisciplinaLite[], agora: Date = new Date(),
): { horasSemana: number; questoesSemana: number; conclusaoPct: number; aproveitamentoPct: number } {
  const semana = inicioDaSemana(agora).getTime();
  let segSemana = 0, qSemana = 0;
  for (const r of regs) {
    if (parseData(r.data).getTime() < semana) continue;
    if (r.duracaoSegundos) segSemana += r.duracaoSegundos;
    qSemana += r.acertos + r.erros;
  }
  const cob = coberturaEdital(topicos).geral;
  const apr = aproveitamento(regs, topicos, null, agora).geral;
  return {
    horasSemana: segSemana / 3600,
    questoesSemana: qSemana,
    conclusaoPct: cob,
    aproveitamentoPct: apr ?? 0,
  };
}

export function diasParaProva(
  dataProva: string | null, agora: Date = new Date(),
): { dias: number; estado: 'futuro' | 'hoje' | 'passado' } | null {
  if (!dataProva) return null;
  const dias = Math.round((parseData(dataProva).getTime() - diaLocal(agora).getTime()) / 86_400_000);
  return { dias, estado: dias > 0 ? 'futuro' : dias === 0 ? 'hoje' : 'passado' };
}
```

- [ ] **Step 5: `CountdownCard.tsx` — trocar a função local por `diasParaProva`**

```tsx
import { diasParaProva } from '@/features/progresso/metrics';
// ...
const d = diasParaProva(dataProva);
if (!d) return null;
const label = d.estado === 'futuro' ? String(d.dias) : d.estado === 'hoje' ? 'Hoje!' : 'Passou';
```

- [ ] **Step 6: `format.ts` — `formatarDiaSemana`**

```ts
export function formatarDiaSemana(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'long' });
}
```

- [ ] **Step 7: Rodar tudo**

Run: `npm test -- metrics CountdownCard && npm run typecheck`
Expected: metrics e CountdownCard PASSAM. **`progresso/hooks.ts` e `metrics.test` antigos ainda usam a assinatura velha** — se `npm test` inteiro quebrar aqui, é esperado: a Task 6 conserta `progresso/hooks.ts`. Para manter a suíte verde nesta task, adicione um wrapper temporário: mantenha `aproveitamento`/`tempoEstudado` aceitando TAMBÉM o formato antigo via checagem `('data' in r && 'duracaoSegundos' in r)` — OU (preferível) atualize `progresso/hooks.ts` já nesta task para mapear as linhas de `sessoes_*` para `RegistroLite` (as tabelas ainda existem até a Task 5). Escolha a segunda: menos dívida.

Atualização mínima de `progresso/hooks.ts` nesta task: onde monta `sessoesEstudo`/`sessoesExercicio`, monte um único `registros: RegistroLite[]` juntando as duas queries (estudo → `{duracaoSegundos, acertos:0, erros:0, data: iniciada_em.slice(0,10)}`; exercício → `{duracaoSegundos:null, acertos, erros, data}`), e chame `aproveitamento(registros, topicos)` / `tempoEstudado(registros, topicos)`. Ajustar `metrics.test` antigo (já feito no Step 1).

Run de novo: `npm test && npm run lint`
Expected: PASSA.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: métricas com janela de período + realMetas + diasParaProva

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: Migração `registros_estudo` (banco) + shim da camada de dados

**Files:**
- Create: `supabase/migrations/0004_registros_estudo.sql`, `tests/integration/registros.test.ts`
- Modify: `src/types/db.ts` (regen), `src/features/estudo/api.ts`, `src/features/exercicios/api.ts`, `src/lib/query.ts` (qk), `src/features/progresso/hooks.ts`
- Modify tests: `tests/integration/{schema,cascade}.test.ts`, `src/features/estudo/__tests__/api.test.ts`, `src/features/exercicios/__tests__/SessoesExercicio.test.tsx`

**Interfaces:**
- Consumes: pooler connection string (Global Constraints)
- Produces:
  - Tabela `registros_estudo` na nuvem (colunas conforme spec), `disciplinas.cor`, tabela `metas`
  - `sessoes_estudo` e `sessoes_exercicio` **removidas**
  - `qk.registros(topicoId)`, `qk.metas(concursoId)`, `qk.historico(concursoId)` — e `qk.sessoesEstudo`/`qk.sessoesExercicio` **removidas**
  - `src/features/estudo/api.ts` e `src/features/exercicios/api.ts` continuam com as MESMAS funções exportadas, agora batendo em `registros_estudo` (shim — a Task 6 substitui de vez)

- [ ] **Step 1: Teste de integração que falha**

`tests/integration/registros.test.ts`:

```ts
import { makeUser } from './helpers';

test('registros_estudo existe com RLS', async () => {
  const a = await makeUser(`reg${Date.now()}@x.com`);
  const b = await makeUser(`reg2${Date.now()}@x.com`);
  const { data: c } = await a.client.from('concursos').insert({ user_id: a.id, nome: 'C', status: 'ativo' }).select().single();
  const { data: d } = await a.client.from('disciplinas').insert({ user_id: a.id, concurso_id: c.id, nome: 'D', ordem: 0 }).select().single();
  const { data: t } = await a.client.from('topicos').insert({ user_id: a.id, disciplina_id: d.id, nome: 'T', ordem: 0 }).select().single();
  await a.client.from('registros_estudo').insert({ user_id: a.id, topico_id: t.id, data: '2026-09-01', duracao_segundos: 1800, tipo: 'Teoria', origem: 'cronometro' });
  const { data: mine } = await a.client.from('registros_estudo').select('*');
  expect(mine).toHaveLength(1);
  const { data: theirs } = await b.client.from('registros_estudo').select('*');
  expect(theirs).toEqual([]);
});

test('apagar tópico apaga os registros (cascata)', async () => {
  const u = await makeUser(`regc${Date.now()}@x.com`);
  const { data: c } = await u.client.from('concursos').insert({ user_id: u.id, nome: 'C', status: 'ativo' }).select().single();
  const { data: d } = await u.client.from('disciplinas').insert({ user_id: u.id, concurso_id: c.id, nome: 'D', ordem: 0 }).select().single();
  const { data: t } = await u.client.from('topicos').insert({ user_id: u.id, disciplina_id: d.id, nome: 'T', ordem: 0 }).select().single();
  await u.client.from('registros_estudo').insert({ user_id: u.id, topico_id: t.id, data: '2026-09-01', acertos: 5, erros: 1, tipo: 'Questões', origem: 'manual' });
  await u.client.from('topicos').delete().eq('id', t.id);
  const { data } = await u.client.from('registros_estudo').select('*').eq('topico_id', t.id);
  expect(data).toEqual([]);
});

test('disciplinas.cor tem default não-nulo; metas com RLS', async () => {
  const u = await makeUser(`regm${Date.now()}@x.com`);
  const { data: c } = await u.client.from('concursos').insert({ user_id: u.id, nome: 'C', status: 'ativo' }).select().single();
  const { data: d } = await u.client.from('disciplinas').insert({ user_id: u.id, concurso_id: c.id, nome: 'D', ordem: 0 }).select('cor').single();
  expect(typeof d.cor).toBe('string');
  await u.client.from('metas').upsert({ concurso_id: c.id, user_id: u.id, meta_horas_semana: 20 });
  const { data: m } = await u.client.from('metas').select('meta_horas_semana').eq('concurso_id', c.id).single();
  expect(m.meta_horas_semana).toBe(20);
});

test('constraint: registro sem tempo E sem questões é rejeitado', async () => {
  const u = await makeUser(`regx${Date.now()}@x.com`);
  const { data: c } = await u.client.from('concursos').insert({ user_id: u.id, nome: 'C', status: 'ativo' }).select().single();
  const { data: d } = await u.client.from('disciplinas').insert({ user_id: u.id, concurso_id: c.id, nome: 'D', ordem: 0 }).select().single();
  const { data: t } = await u.client.from('topicos').insert({ user_id: u.id, disciplina_id: d.id, nome: 'T', ordem: 0 }).select().single();
  const { error } = await u.client.from('registros_estudo').insert({ user_id: u.id, topico_id: t.id, data: '2026-09-01', tipo: 'Teoria', origem: 'manual', duracao_segundos: null, acertos: 0, erros: 0 });
  expect(error).not.toBeNull();
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test:integration -- registros`
Expected: FALHA — `registros_estudo` não existe.

- [ ] **Step 3: Escrever a migração**

`supabase/migrations/0004_registros_estudo.sql`:

```sql
-- 1. registros_estudo
create table registros_estudo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topico_id uuid not null references topicos(id) on delete cascade,
  data date not null,
  iniciada_em timestamptz,
  duracao_segundos int check (duracao_segundos is null or duracao_segundos >= 0),
  tipo text not null check (tipo in ('Teoria','Questões','Simulado','Lei Seca','Jurisprudência','Discursiva')),
  acertos int not null default 0 check (acertos >= 0),
  erros int not null default 0 check (erros >= 0),
  nota text,
  origem text not null check (origem in ('cronometro','manual')),
  created_at timestamptz not null default now(),
  constraint tem_tempo_ou_questoes check (duracao_segundos is not null or acertos + erros > 0)
);
create index on registros_estudo (topico_id);
create index on registros_estudo (user_id, data);

alter table registros_estudo enable row level security;
create policy "registros_estudo_owner" on registros_estudo
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 2. disciplinas.cor
alter table disciplinas add column cor text not null default '#12234A';

-- 3. metas
create table metas (
  concurso_id uuid primary key references concursos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  meta_horas_semana numeric,
  meta_questoes_semana int,
  meta_conclusao_pct int check (meta_conclusao_pct between 0 and 100),
  meta_aproveitamento_pct int check (meta_aproveitamento_pct between 0 and 100),
  updated_at timestamptz not null default now()
);
alter table metas enable row level security;
create policy "metas_owner" on metas
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 4. copiar dados
insert into registros_estudo (user_id, topico_id, data, iniciada_em, duracao_segundos, tipo, acertos, erros, nota, origem, created_at)
select user_id, topico_id, iniciada_em::date, iniciada_em, duracao_segundos, 'Teoria', 0, 0, nota, origem, created_at
from sessoes_estudo;

insert into registros_estudo (user_id, topico_id, data, iniciada_em, duracao_segundos, tipo, acertos, erros, nota, origem, created_at)
select user_id, topico_id, data, null, null, 'Questões', acertos, erros, nota, 'manual', created_at
from sessoes_exercicio
where acertos + erros > 0;

-- 5. backfill de cor (rodízio por ordem dentro do concurso)
with pal as (
  select unnest(array['#C8102E','#0EA5E9','#7C3AED','#059669','#D97706','#DB2777','#0D9488','#65A30D','#4F46E5','#EA580C']) as cor,
         generate_series(0,9) as idx
), num as (
  select id, (row_number() over (partition by concurso_id order by ordem, created_at) - 1) as rn
  from disciplinas
)
update disciplinas d set cor = pal.cor
from num join pal on pal.idx = num.rn % 10
where d.id = num.id;

-- 6. drop antigas
drop table sessoes_estudo;
drop table sessoes_exercicio;
```

- [ ] **Step 4: Aplicar na nuvem**

```bash
export SUPABASE_DB_URL='postgresql://postgres.ewhocfbaaaxdykuhtmwp:Q%40unu-zb%25aA%257D%2A@aws-0-sa-east-1.pooler.supabase.com:5432/postgres'
printf 'Y\n' | npx supabase db push --db-url "$SUPABASE_DB_URL"
```

Se `db push` falhar pelo pooler após ~2 tentativas: rodar o SQL via script Node com `pg` (mesmo fallback do #1). Documentar no report.

- [ ] **Step 5: Regenerar tipos**

```bash
npx supabase gen types typescript --db-url "$SUPABASE_DB_URL" --schema public > src/types/db.ts
```

Se `gen types` exigir Docker (como no #1): manter `src/types/db.ts` à mão — remover `sessoes_estudo`/`sessoes_exercicio`, adicionar `registros_estudo`, `metas`, e `cor` em `disciplinas`, no mesmo formato. Verificar contra o banco via `pg` (introspection). Documentar.

- [ ] **Step 6: Shim nas APIs antigas + qk**

`src/lib/query.ts` — no objeto `qk`: remover `sessoesEstudo` e `sessoesExercicio`; adicionar:

```ts
registros: (topicoId: string) => ['registros', topicoId] as const,
metas: (concursoId: string) => ['metas', concursoId] as const,
historico: (concursoId: string) => ['historico', concursoId] as const,
```

`src/features/estudo/api.ts` — mesmas 3 funções, agora em `registros_estudo`:
- `salvarSessaoCronometro` → `insert({ ..., data: input.iniciadaEm.slice(0,10), tipo: 'Teoria', acertos: 0, erros: 0, origem: 'cronometro' })`
- `salvarSessaoManual` → `insert({ ..., data: input.data, duracao_segundos: input.duracaoSegundos, tipo: 'Teoria', origem: 'manual', nota })`
- `listarSessoesEstudo` → `select('id, iniciada_em, duracao_segundos, origem, nota').eq('topico_id', ...).not('duracao_segundos','is',null).order('iniciada_em', {ascending:false})` — só as com tempo, pra tela do tópico não mudar.

`src/features/exercicios/api.ts` — mesmas 3 funções em `registros_estudo`:
- `listarSessoesExercicio` → `select('id, data, acertos, erros, nota').eq('topico_id', ...).gt('...','...')` → filtrar `acertos + erros > 0` no cliente (ou `.or('acertos.gt.0,erros.gt.0')`). `order('data', {ascending:false})`.
- `addSessaoExercicio` → `insert({ ..., tipo: 'Questões', origem: 'manual', duracao_segundos: null })`
- `deleteSessaoExercicio` → `delete().eq('id', id)` (tabela nova)

`src/features/progresso/hooks.ts` — trocar as duas queries `sessoes_*` por uma só em `registros_estudo` (`select('topico_id, data, duracao_segundos, acertos, erros').in('topico_id', ids)`), mapear para `RegistroLite` (precisa de `disciplinaId` — resolver via `discDoTopico` como já faz). Chamar `aproveitamento(regs, topicos)` / `tempoEstudado(regs, topicos)`.

- [ ] **Step 7: Ajustar testes de integração antigos**

`tests/integration/schema.test.ts` e `cascade.test.ts` referenciam `sessoes_estudo`/`sessoes_exercicio` — trocar para `registros_estudo` (com `tipo`/`origem`). `src/features/estudo/__tests__/api.test.ts` — o mock de `supabase.from` continua, só muda o nome da tabela esperada (`registros_estudo`) e o payload (`tipo: 'Teoria'`).

- [ ] **Step 8: Rodar tudo**

```bash
npm run test:integration -- registros schema cascade triggers
npm test && npm run typecheck && npm run lint
```

Expected: PASSA. A tela do tópico continua com os 2 blocos, mas agora sobre `registros_estudo`.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: migração registros_estudo + disciplinas.cor + metas (shim das APIs)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: Feature `registros` unificada + tela do Tópico repaginada

**Files:**
- Create: `src/features/registros/{schema,api,hooks}.ts`, `src/features/registros/RegistrarEstudo.tsx`, `src/features/registros/FinalizarSessao.tsx`
- Create tests: `src/features/registros/__tests__/{schema,RegistrarEstudo}.test.tsx`
- Modify: `app/(app)/edital/topico/[id].tsx`, `src/features/progresso/hooks.ts`
- Delete: `src/features/exercicios/` (pasta), `src/features/estudo/{api,hooks,SessoesEstudo}.ts(x)`, `src/features/estudo/__tests__/{api.test.ts,SessoesEstudo.test.tsx}`
- Keep: `src/features/estudo/{timerStore.ts,TimerPill.tsx}` + `src/features/estudo/__tests__/timerStore.test.ts`

**Interfaces:**
- Consumes: `supabase`, `qk` (`registros`, `progresso`, `revisao`), `normalizeError`, `useTimer`/`segundosDecorridos` (`@/features/estudo/timerStore`), UI (`TipoEstudoSelect`, `Input`, `Button`, `Pill`, `Card`), `TipoEstudo`/`RegistroLite` types, `hojeISO` (`@/lib/date`)
- Produces:
  - `TIPOS_ESTUDO: readonly TipoEstudo[]` e `registroSchema` (zod) em `schema.ts`:
    ```ts
    { data: string /AAAA-MM-DD/, duracaoSegundos: number | null, tipo: TipoEstudo,
      acertos: number>=0, erros: number>=0, nota?: string }
      .refine(v => v.duracaoSegundos != null || v.acertos + v.erros > 0, 'Informe tempo ou questões')
    ```
  - `RegistroRow = { id, topico_id, data, iniciada_em: string|null, duracao_segundos: number|null, tipo: TipoEstudo, acertos, erros, nota: string|null, origem: 'cronometro'|'manual' }`
  - `api.ts`: `listarRegistrosDoTopico(topicoId): Promise<RegistroRow[]>`, `criarRegistro(topicoId, input, origem): Promise<void>`, `editarRegistro(id, input): Promise<void>`, `apagarRegistro(id): Promise<void>`
  - `hooks.ts`: `useRegistrosDoTopico(topicoId)`, `useRegistroMutations(concursoId, topicoId)` → `{ criar, editar, apagar }` (cada `onSuccess` invalida `qk.registros(topicoId)`, `qk.progresso(concursoId)`, `qk.historico(concursoId)`)
  - `<RegistrarEstudo topicoId topicoNome concursoId />` — bloco completo
  - `<FinalizarSessao duracaoSegundos onConfirmar={(input) => void} onCancelar />` — form de finalização (tipo, acertos, erros, nota, agendar revisão)

- [ ] **Step 1: `schema.ts` + teste**

`src/features/registros/schema.ts`:

```ts
import { z } from 'zod';
import type { TipoEstudo } from '@/types/models';

export const TIPOS_ESTUDO = ['Teoria', 'Questões', 'Simulado', 'Lei Seca', 'Jurisprudência', 'Discursiva'] as const;

export const registroSchema = z
  .object({
    data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use AAAA-MM-DD'),
    duracaoSegundos: z.number().int().min(0).nullable(),
    tipo: z.enum(TIPOS_ESTUDO),
    acertos: z.number().int().min(0, 'Não pode ser negativo'),
    erros: z.number().int().min(0, 'Não pode ser negativo'),
    nota: z.string().trim().optional(),
  })
  .refine((v) => v.duracaoSegundos != null || v.acertos + v.erros > 0, {
    message: 'Informe tempo estudado ou questões',
    path: ['acertos'],
  });

export type RegistroInput = z.infer<typeof registroSchema>;
```

`src/features/registros/__tests__/schema.test.ts`:

```ts
import { registroSchema } from '../schema';

const base = { data: '2026-09-01', duracaoSegundos: null, tipo: 'Teoria' as const, acertos: 0, erros: 0 };

test('rejeita registro vazio (sem tempo e sem questões)', () => {
  expect(registroSchema.safeParse(base).success).toBe(false);
});
test('aceita só tempo', () => {
  expect(registroSchema.safeParse({ ...base, duracaoSegundos: 1800 }).success).toBe(true);
});
test('aceita só questões', () => {
  expect(registroSchema.safeParse({ ...base, acertos: 8, erros: 2 }).success).toBe(true);
});
test('rejeita tipo inválido', () => {
  expect(registroSchema.safeParse({ ...base, tipo: 'Outro', acertos: 1 }).success).toBe(false);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- registros/__tests__/schema`
Expected: FALHA.

- [ ] **Step 3: `api.ts` + `hooks.ts`**

`src/features/registros/api.ts`:

```ts
import { supabase } from '@/lib/supabase';
import { normalizeError } from '@/lib/errors';
import type { RegistroInput } from './schema';
import type { TipoEstudo } from '@/types/models';

export type RegistroRow = {
  id: string; topico_id: string; data: string; iniciada_em: string | null;
  duracao_segundos: number | null; tipo: TipoEstudo; acertos: number; erros: number;
  nota: string | null; origem: 'cronometro' | 'manual';
};

const COLS = 'id, topico_id, data, iniciada_em, duracao_segundos, tipo, acertos, erros, nota, origem';

async function uid() {
  const { data } = await supabase.auth.getUser();
  return data.user!.id;
}

export async function listarRegistrosDoTopico(topicoId: string): Promise<RegistroRow[]> {
  const { data, error } = await supabase
    .from('registros_estudo').select(COLS)
    .eq('topico_id', topicoId)
    .order('data', { ascending: false }).order('created_at', { ascending: false });
  if (error) throw normalizeError(error);
  return (data as RegistroRow[] | null) ?? [];
}

export async function criarRegistro(topicoId: string, input: RegistroInput, origem: 'cronometro' | 'manual') {
  const { error } = await supabase.from('registros_estudo').insert({
    user_id: await uid(), topico_id: topicoId,
    data: input.data, iniciada_em: origem === 'cronometro' ? new Date().toISOString() : null,
    duracao_segundos: input.duracaoSegundos, tipo: input.tipo,
    acertos: input.acertos, erros: input.erros, nota: input.nota ?? null, origem,
  });
  if (error) throw normalizeError(error);
}

export async function editarRegistro(id: string, input: RegistroInput) {
  const { error } = await supabase.from('registros_estudo').update({
    data: input.data, duracao_segundos: input.duracaoSegundos, tipo: input.tipo,
    acertos: input.acertos, erros: input.erros, nota: input.nota ?? null,
  }).eq('id', id);
  if (error) throw normalizeError(error);
}

export async function apagarRegistro(id: string) {
  const { error } = await supabase.from('registros_estudo').delete().eq('id', id);
  if (error) throw normalizeError(error);
}
```

`src/features/registros/hooks.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query';
import * as api from './api';
import type { RegistroInput } from './schema';

export function useRegistrosDoTopico(topicoId: string) {
  return useQuery({ queryKey: qk.registros(topicoId), queryFn: () => api.listarRegistrosDoTopico(topicoId) });
}

export function useRegistroMutations(concursoId: string | null, topicoId: string) {
  const qc = useQueryClient();
  const inval = () => {
    qc.invalidateQueries({ queryKey: qk.registros(topicoId) });
    if (concursoId) {
      qc.invalidateQueries({ queryKey: qk.progresso(concursoId) });
      qc.invalidateQueries({ queryKey: qk.historico(concursoId) });
    }
  };
  return {
    criar: useMutation({
      mutationFn: (a: { input: RegistroInput; origem: 'cronometro' | 'manual' }) => api.criarRegistro(topicoId, a.input, a.origem),
      onSuccess: inval,
    }),
    editar: useMutation({ mutationFn: (a: { id: string; input: RegistroInput }) => api.editarRegistro(a.id, a.input), onSuccess: inval }),
    apagar: useMutation({ mutationFn: api.apagarRegistro, onSuccess: inval }),
  };
}
```

- [ ] **Step 4: `FinalizarSessao.tsx`**

Form: `TipoEstudoSelect` (default `Teoria`), `Input` numérico acertos, `Input` numérico erros, `Input` de nota (multiline), o bloco "agendar revisão" (7/15/21/30 + custom — reaproveitar o padrão que já existe no #1 em `SessoesEstudo`/revisão), botões "Registrar" e "Cancelar". Valida com `registroSchema` (passando `data: hojeISO()` e `duracaoSegundos` recebido por prop). Ao confirmar → `onConfirmar({ input, revDias })`.

- [ ] **Step 5: `RegistrarEstudo.tsx`**

Um `Card` com:
1. **Cronômetro** (reaproveita `useTimer` + `segundosDecorridos` do #1): iniciar/pausar/retomar/**parar**. Ao parar → abre `<FinalizarSessao duracaoSegundos={segundos} />` inline. Confirmar → `criar.mutate({ input, origem: 'cronometro' })` + agenda revisões (mesma lógica do #1) + `useTimer.getState().reset()` no `onSuccess`. Cancelar → volta o cronômetro pra idle sem salvar (perde o tempo — avisa com toast).
2. **Registro manual** (colapsável): `Input` data (default `hojeISO()`), `Input` minutos, + os mesmos campos do form. Confirmar → `criar.mutate({ input: { ...campos, duracaoSegundos: minutos*60 || null }, origem: 'manual' })`.
3. **Lista** dos `useRegistrosDoTopico(topicoId)`: data (`formatarDataBR`), tipo (chip), tempo (`formatarDuracao`), questões (`acertos/total · %` via `Pill`), nota (truncada). Cada item: editar (abre `EditarRegistro` da Task 9 — se ainda não existe, um form inline reaproveitando `FinalizarSessao`) e apagar (confirm via `Alert`).

Guardas do #1 mantidas: cronômetro persiste (store), double-tap no "parar", `onError` fica com o `MutationCache` global.

- [ ] **Step 6: `app/(app)/edital/topico/[id].tsx` — usar `RegistrarEstudo`**

Remover imports/uso de `SessoesEstudo` e `SessoesExercicio`. Manter: `useLocalSearchParams`, `useTopico`, `useToggleConcluido` (switch Concluído), `useConcursoAtivo`. Adicionar `<RegistrarEstudo topicoId={topico.id} topicoNome={topico.nome} concursoId={concurso?.id ?? null} />`. Repaginar (Lora no nome, `DisciplinaDot` da disciplina).

- [ ] **Step 7: `progresso/hooks.ts` — usar `registros` api**

Trocar a query manual por `supabase.from('registros_estudo').select('topico_id, data, duracao_segundos, acertos, erros').in('topico_id', ids)`, mapear pra `RegistroLite` (com `disciplinaId` via `discDoTopico`), chamar `aproveitamento(regs, topicos)` / `tempoEstudado(regs, topicos)`. (A Task 7 renomeia isso pra `usePainel` com janela.)

- [ ] **Step 8: Deletar o código morto**

```bash
git rm -r src/features/exercicios
git rm src/features/estudo/api.ts src/features/estudo/hooks.ts src/features/estudo/SessoesEstudo.tsx
git rm src/features/estudo/__tests__/api.test.ts src/features/estudo/__tests__/SessoesEstudo.test.tsx
```

- [ ] **Step 9: Testes de componente**

`src/features/registros/__tests__/RegistrarEstudo.test.tsx` (async, mocka `../hooks` e `@/features/estudo/timerStore`):
- "parar cronômetro abre o form de finalização" → depois de `fireEvent.press('Parar')` aparece o `TipoEstudoSelect`
- "registrar manual com só minutos cria um registro sem questões" → `criar.mutate` chamado com `duracaoSegundos: 2700, acertos: 0, erros: 0`
- "form bloqueia registro vazio" → mostra 'Informe tempo estudado ou questões'

- [ ] **Step 10: Rodar tudo**

Run: `npm test && npm run test:integration -- registros && npm run typecheck && npm run lint`
Expected: PASSA. Suíte total sem os testes deletados; novos testes verdes.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: registro de estudo unificado + tela do tópico repaginada

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 7: Camada de dados de metas + `usePainel`

**Files:**
- Create: `src/features/metas/{api,hooks}.ts`, `src/features/metas/__tests__/hooks.test.tsx`
- Modify: `src/features/progresso/hooks.ts` (renomear `useProgresso` → `usePainel`, adicionar janela + metas + countdown)
- Modify: `app/(app)/index.tsx` (só o import/uso do hook — o layout completo é a Task 8)

**Interfaces:**
- Consumes: `supabase`, `qk` (`metas`, `progresso`), `normalizeError`, `carregarArvore` (`@/features/edital/api`), métricas (`realMetas`, `diasParaProva`, `aproveitamento`, `tempoEstudado`, `coberturaEdital`, `coberturaPonderada`), `RegistroLite`/`Janela`
- Produces:
  - `Metas = { metaHorasSemana: number | null; metaQuestoesSemana: number | null; metaConclusaoPct: number | null; metaAproveitamentoPct: number | null }`
  - `api.ts`: `buscarMetas(concursoId): Promise<Metas | null>`, `salvarMetas(concursoId, patch: Partial<Metas>): Promise<void>` (upsert)
  - `hooks.ts`: `useMetas(concursoId)`, `useSalvarMetas(concursoId)`
  - `usePainel(concursoId: string | null, janela: Janela)` → `{ data: PainelDados | null; isLoading }` onde
    ```ts
    type PainelDados = {
      concursoNome: string; banca: string | null; cargo: string | null;
      dataProva: string | null;
      countdown: { dias: number; estado: 'futuro'|'hoje'|'passado' } | null;
      metasReal: { horasSemana; questoesSemana; conclusaoPct; aproveitamentoPct };
      metas: Metas | null;
      cobertura: number; coberturaPonderada: number;
      aproveitamentoGeral: number | null; tempoSegundos: number; // na janela
      disciplinas: { id; nome; cor; peso; cobertura; aproveitamento: number|null; tempoSegundos }[];
    };
    ```

- [ ] **Step 1: Teste que falha (metas)**

`src/features/metas/__tests__/hooks.test.tsx` (mock `../api`, wrapper QueryClient):

```tsx
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMetas } from '../hooks';

jest.mock('../api', () => ({ buscarMetas: jest.fn(() => Promise.resolve({ metaHorasSemana: 20, metaQuestoesSemana: null, metaConclusaoPct: null, metaAproveitamentoPct: 70 })) }));
const wrapper = ({ children }: any) => <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;

test('useMetas carrega as metas do concurso', async () => {
  const { result } = renderHook(() => useMetas('c1'), { wrapper });
  await waitFor(() => expect(result.current.data).toBeDefined());
  expect(result.current.data!.metaHorasSemana).toBe(20);
});
```

- [ ] **Step 2: Rodar e ver falhar** — `npm test -- metas`

- [ ] **Step 3: Implementar `metas/api.ts` + `hooks.ts`**

`api.ts`:

```ts
import { supabase } from '@/lib/supabase';
import { normalizeError } from '@/lib/errors';

export type Metas = {
  metaHorasSemana: number | null; metaQuestoesSemana: number | null;
  metaConclusaoPct: number | null; metaAproveitamentoPct: number | null;
};

const vazio: Metas = { metaHorasSemana: null, metaQuestoesSemana: null, metaConclusaoPct: null, metaAproveitamentoPct: null };

export async function buscarMetas(concursoId: string): Promise<Metas> {
  const { data, error } = await supabase
    .from('metas')
    .select('meta_horas_semana, meta_questoes_semana, meta_conclusao_pct, meta_aproveitamento_pct')
    .eq('concurso_id', concursoId).maybeSingle();
  if (error) throw normalizeError(error);
  if (!data) return vazio;
  return {
    metaHorasSemana: data.meta_horas_semana, metaQuestoesSemana: data.meta_questoes_semana,
    metaConclusaoPct: data.meta_conclusao_pct, metaAproveitamentoPct: data.meta_aproveitamento_pct,
  };
}

export async function salvarMetas(concursoId: string, patch: Partial<Metas>) {
  const { data: u } = await supabase.auth.getUser();
  const row: Record<string, unknown> = { concurso_id: concursoId, user_id: u.user!.id, updated_at: new Date().toISOString() };
  if ('metaHorasSemana' in patch) row.meta_horas_semana = patch.metaHorasSemana;
  if ('metaQuestoesSemana' in patch) row.meta_questoes_semana = patch.metaQuestoesSemana;
  if ('metaConclusaoPct' in patch) row.meta_conclusao_pct = patch.metaConclusaoPct;
  if ('metaAproveitamentoPct' in patch) row.meta_aproveitamento_pct = patch.metaAproveitamentoPct;
  const { error } = await supabase.from('metas').upsert(row);
  if (error) throw normalizeError(error);
}
```

`hooks.ts`: `useMetas` (`useQuery` `qk.metas`), `useSalvarMetas` (`useMutation` upsert, invalida `qk.metas` + `qk.progresso`).

- [ ] **Step 4: `progresso/hooks.ts` → `usePainel`**

Renomear `useProgresso` para `usePainel(concursoId, janela)`. Dentro do `queryFn`:
- `carregarArvore` (agora traz `cor` — ver Task 10; até lá, `cor` pode faltar → default `#12234A`)
- buscar `registros_estudo` do concurso (todos os tópicos)
- buscar `metas` (via `buscarMetas`)
- montar `RegistroLite[]`, `TopicoLite[]`, `DisciplinaLite[]`
- calcular: `coberturaEdital`, `coberturaPonderada`, `aproveitamento(regs, topicos, janela)`, `tempoEstudado(regs, topicos, janela)`, `realMetas(regs, topicos, disciplinas)`, `diasParaProva(concurso.data_prova)`
- `queryKey`: `[...qk.progresso(concursoId), janela ?? 'tudo']`
- Buscar dados do concurso (nome/banca/cargo/data_prova) — de `useConcursoAtivo` no componente, OU incluir no `carregarArvore`/query. Simplest: o componente passa o `concurso` (de `useConcursoAtivo`) e o hook recebe `dataProva` como arg. Ajustar a assinatura: `usePainel(concurso: Concurso | null, janela)`.

- [ ] **Step 5: `app/(app)/index.tsx` — trocar o hook**

Só trocar `useProgresso` → `usePainel(concurso, janela)` com um `useState<Janela>(14)`. O layout detalhado é a Task 8; aqui só garantir que compila e os testes de tela existentes passam (ajustando mocks de `useProgresso` → `usePainel`).

- [ ] **Step 6: Rodar tudo** — `npm test && npm run typecheck && npm run lint` → PASSA

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: camada de metas + usePainel (janela + metas + countdown)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 8: Painel repaginado (hub)

**Files:**
- Modify: `app/(app)/index.tsx`
- Test: `app/(app)/__tests__/index.test.tsx` (reescrever)

**Interfaces:**
- Consumes: `usePainel` (Task 7), `useConcursoAtivo`, `useMetas` (opcional — `usePainel` já traz), UI (`CountdownCard`, `MetaCard`, `PeriodoChips`, `Pill`, `DisciplinaDot`, `Card`, `Stat`, `EmptyState`), `formatarPct`/`formatarDuracao`, `useRouter`
- Produces: a tela; nenhum export novo

- [ ] **Step 1: Teste que falha (reescrito)**

`app/(app)/__tests__/index.test.tsx` (async; mocka `@/features/progresso/hooks` `usePainel` e `@/features/concurso/hooks` `useConcursoAtivo`):

```tsx
// usePainel retorna PainelDados com: countdown 96 dias, metasReal, metas com meta_horas 20,
// cobertura 0.37, 4 disciplinas com cor
test('mostra a contagem regressiva', async () => { /* screen.getByText('96') */ });
test('mostra os 4 mini-cards de meta na ordem: Horas, Conclusão edital, Questões, Aproveitamento', async () => {
  // getByText('Horas'), getByText('Conclusão edital') etc.
});
test('troca a janela nos chips de período', async () => {
  // fireEvent.press no chip '7d' → usePainel re-chamado / o texto muda
});
test('empty state quando não há disciplinas', async () => { /* ... */ });
```

- [ ] **Step 2: Rodar e ver falhar** — `npm test -- "app/(app)/__tests__/index"`

- [ ] **Step 3: Implementar o Painel** (conforme mockup aprovado)

`app/(app)/index.tsx`:

```tsx
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, EmptyState, MetaCard, CountdownCard, PeriodoChips, Pill, DisciplinaDot, ProgressBar } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { FONT } from '@/theme/fonts';
import { useConcursoAtivo } from '@/features/concurso/hooks';
import { usePainel } from '@/features/progresso/hooks';
import { formatarPct, formatarDuracao } from '@/features/progresso/format';
import type { Janela } from '@/types/models';

export default function Painel() {
  const { c } = useTheme();
  const router = useRouter();
  const [janela, setJanela] = useState<Janela>(14);
  const { data: concurso } = useConcursoAtivo();
  const { data, isLoading } = usePainel(concurso ?? null, janela);

  if (!concurso || isLoading || !data) return null;

  const secLbl = (t: string) => (
    <Text style={{ fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: c('muted'), fontFamily: FONT.sansSemi, marginTop: 18, marginBottom: 8 }}>{t}</Text>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text style={{ fontSize: 21, color: c('text'), fontFamily: FONT.serifBold }}>{data.concursoNome}</Text>
        {(data.banca || data.cargo) ? (
          <Text style={{ fontSize: 12, color: c('muted'), fontFamily: FONT.sans, marginTop: 2 }}>
            {[data.banca, data.cargo].filter(Boolean).join(' · ')}
          </Text>
        ) : null}

        <CountdownCard dataProva={data.dataProva} />

        {data.disciplinas.length === 0 ? (
          <EmptyState titulo="Sem disciplinas ainda" descricao="Cadastre o conteúdo do edital para acompanhar o progresso." />
        ) : (
          <>
            {secLbl('Metas da semana')}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <View style={{ flex: 1, minWidth: '46%', gap: 8 }}>
                <MetaCard label="Horas" real={data.metasReal.horasSemana} meta={data.metas?.metaHorasSemana ?? null} formato="horas" />
                <MetaCard label="Questões" real={data.metasReal.questoesSemana} meta={data.metas?.metaQuestoesSemana ?? null} formato="questoes" />
              </View>
              <View style={{ flex: 1, minWidth: '46%', gap: 8 }}>
                <MetaCard label="Conclusão edital" real={data.metasReal.conclusaoPct} meta={data.metas?.metaConclusaoPct != null ? data.metas.metaConclusaoPct / 100 : null} formato="pct" />
                <MetaCard label="Aproveitamento" real={data.metasReal.aproveitamentoPct} meta={data.metas?.metaAproveitamentoPct != null ? data.metas.metaAproveitamentoPct / 100 : null} formato="pct" />
              </View>
            </View>

            {secLbl('Desempenho')}
            <View style={{ marginBottom: 8 }}><PeriodoChips value={janela} onChange={setJanela} /></View>
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: c('muted'), fontFamily: FONT.sansSemi }}>Cobertura do edital</Text>
                <Text style={{ fontSize: 30, color: c('text'), fontFamily: FONT.serifBold }}>{formatarPct(data.cobertura)}</Text>
              </View>
              <View style={{ marginTop: 8 }}><ProgressBar value={data.cobertura} /></View>
              <View style={{ flexDirection: 'row', gap: 18, marginTop: 12 }}>
                <Metric v={formatarPct(data.aproveitamentoGeral)} l="Aproveit." c={c} />
                <Metric v={formatarDuracao(data.tempoSegundos)} l={`Tempo (${janela ?? 'tudo'}${janela ? 'd' : ''})`} c={c} />
                <Metric v={formatarPct(data.coberturaPonderada)} l="Ponderada" c={c} />
              </View>
            </Card>

            {secLbl('Por disciplina')}
            <Card style={{ paddingVertical: 4 }}>
              {data.disciplinas.map((d, i) => (
                <View key={d.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 10, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: c('border') }}>
                  <DisciplinaDot cor={d.cor} nome={d.nome} />
                  <View style={{ flex: 1 }} />
                  <Pill valor={d.cobertura} />
                </View>
              ))}
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ v, l, c }: { v: string; l: string; c: (n: any) => string }) {
  return (
    <View>
      <Text style={{ fontSize: 18, color: c('text'), fontFamily: FONT.serifBold }}>{v}</Text>
      <Text style={{ fontSize: 10, color: c('muted'), fontFamily: FONT.sans }}>{l}</Text>
    </View>
  );
}
```

Tocar numa disciplina → `router.push('/(app)/edital')` (ou abrir a disciplina — reaproveitar o padrão do #1).

- [ ] **Step 4: Rodar tudo** — `npm test && npm run typecheck && npm run lint` → PASSA

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: Painel repaginado como hub (countdown + metas + desempenho + por disciplina)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 9: Aba Histórico

**Files:**
- Create: `app/(app)/historico.tsx`, `src/features/historico/{api,hooks,agrupar}.ts`, `src/features/historico/{HistoricoItem,EditarRegistro}.tsx`
- Modify: `app/(app)/_layout.tsx` (+ aba)
- Test: `src/features/historico/__tests__/agrupar.test.ts`, `app/(app)/__tests__/historico.test.tsx`

**Interfaces:**
- Consumes: `supabase`, `qk.historico`, `normalizeError`, `carregarArvore`, `useConcursoAtivo`, `useRegistroMutations` (Task 6 — pra editar/apagar), UI, `Janela`, `agruparHistorico`, `formatarDataBR`/`formatarDuracao`/`formatarPct`
- Produces:
  - `agruparHistorico(regs: HistItem[], filtroDisciplina: string | null, janela: Janela, agora?: Date): { resumo: { dias; totalSegundos; totalQuestoes; mediaDiariaSegundos }; itens: HistItem[] }`
    onde `HistItem = { id; data; tipo; duracaoSegundos: number|null; acertos; erros; nota: string|null; origem; topicoNome; disciplinaNome; disciplinaCor }`
  - `api.listarHistorico(concursoId): Promise<HistItem[]>` — junta `registros_estudo` de todos os tópicos do concurso com nome/cor da disciplina e nome do tópico (2–3 queries + montagem no cliente)
  - `hooks.useHistorico(concursoId)`
  - `<HistoricoItem item onEditar onApagar />`
  - `<EditarRegistro item onSalvar onFechar />` — reaproveita `registroSchema` + `TipoEstudoSelect`

- [ ] **Step 1: Teste de `agruparHistorico` que falha**

```ts
import { agruparHistorico } from '../agrupar';
const it = (o: any) => ({ id: o.id ?? '1', data: o.data, tipo: 'Teoria', duracaoSegundos: o.dur ?? null, acertos: o.ac ?? 0, erros: o.er ?? 0, nota: null, origem: 'manual', topicoNome: 'T', disciplinaNome: o.disc ?? 'A', disciplinaCor: '#000' });

test('resumo: dias distintos, total de horas, média diária', () => {
  const agora = new Date('2026-09-10T12:00:00');
  const r = agruparHistorico([
    it({ data: '2026-09-09', dur: 3600 }), it({ data: '2026-09-09', dur: 1800 }), it({ data: '2026-09-07', dur: 3600 }),
  ], null, null, agora);
  expect(r.resumo.dias).toBe(2);
  expect(r.resumo.totalSegundos).toBe(9000);
  expect(r.resumo.mediaDiariaSegundos).toBe(4500);
});

test('filtra por disciplina e por janela', () => {
  const agora = new Date('2026-09-10T12:00:00');
  const r = agruparHistorico([
    it({ data: '2026-09-09', disc: 'A', dur: 3600 }), it({ data: '2026-09-09', disc: 'B', dur: 3600 }), it({ data: '2026-08-01', disc: 'A', dur: 3600 }),
  ], 'A', 7, agora);
  expect(r.itens).toHaveLength(1);
});
```

- [ ] **Step 2: Rodar e ver falhar** — `npm test -- historico/__tests__/agrupar`

- [ ] **Step 3: Implementar `agrupar.ts`, `api.ts`, `hooks.ts`**

`agrupar.ts` — filtra por `filtroDisciplina` (match `disciplinaNome`) e `dentroDaJanela(data, janela, agora)` (importar de `metrics`); ordena por `data` desc; monta resumo.

`api.ts` `listarHistorico` — pega as disciplinas (id, nome, cor) do concurso, os tópicos (id, nome, disciplina_id), e `registros_estudo` `in(topico_id, ids)`; monta `HistItem[]` no cliente.

`hooks.ts` `useHistorico(concursoId)` — `useQuery` `qk.historico`.

- [ ] **Step 4: `HistoricoItem.tsx` + `EditarRegistro.tsx`**

`HistoricoItem`: linha com data, `DisciplinaDot` (cor) + nome disciplina, tópico, chip de tipo, tempo, `Pill` de %, nota truncada, botões editar/apagar.
`EditarRegistro`: form (data, minutos, `TipoEstudoSelect`, acertos, erros, nota) pré-preenchido; valida `registroSchema`; `onSalvar({ id, input })`.

- [ ] **Step 5: `app/(app)/historico.tsx`**

`useConcursoAtivo` + `useHistorico` + `useState` (filtroDisciplina, janela) → `agruparHistorico`. Renderiza: resumo (4 `Stat`), `Select` de disciplina + `PeriodoChips`, `FlatList`/`ScrollView` de `HistoricoItem`. `EmptyState` "Nenhum registro ainda". Editar → abre `EditarRegistro` (modal/estado) → `useRegistroMutations().editar`. Apagar → `Alert` → `.apagar`.
- Guarda de loading: `if (concLoading || !concurso || isLoading) return null`.

- [ ] **Step 6: `app/(app)/_layout.tsx` — 5ª aba**

```tsx
<Tabs.Screen name="historico" options={{ title: 'Histórico', tabBarIcon: tabIcon('time-outline') }} />
```
(entre `revisar` e `ajustes`). Atualizar o teste `layout.test.tsx` (5 títulos).

- [ ] **Step 7: Teste da tela** — `app/(app)/__tests__/historico.test.tsx` (async, mocks): mostra um item sob o resumo; `EmptyState` quando vazio; apagar chama a mutation.

- [ ] **Step 8: Rodar tudo** — `npm test && npm run typecheck && npm run lint` → PASSA

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: aba Histórico (log cronológico, filtros, editar/apagar)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 10: Filtros do Edital + cor da disciplina

**Files:**
- Modify: `src/features/edital/api.ts` (`carregarArvore` traz `cor` + flag "tem registros"), `src/features/edital/EditalTree.tsx`, `app/(app)/edital/index.tsx`, `app/(app)/edital/disciplina/[id].tsx` (cor)
- Test: `src/features/edital/__tests__/hooks.test.tsx` (ajustar), `app/(app)/__tests__/edital.test.tsx` (novo/ajustado)

**Interfaces:**
- Consumes: `disciplina.cor` (Task 5), `registros_estudo` (contagem por tópico)
- Produces:
  - `DisciplinaRow` ganha `cor: string`
  - `TopicoRow` ganha `temRegistros: boolean`
  - `<EditalTree data filtro={'todos'|'pendentes'|'concluidos'|'com-questoes'} expandidas onToggle ... />`

- [ ] **Step 1: `carregarArvore` — incluir `cor` e `temRegistros`**

No `select` de disciplinas: `'id, nome, peso, ordem, cor'`. Depois de montar a árvore, uma query `registros_estudo` `select('topico_id').in('topico_id', todosOsIds)` → `Set` de tópicos com registro → setar `temRegistros`. Ajustar os tipos.

- [ ] **Step 2: Teste que falha** — `edital.test.tsx`: com um filtro `pendentes`, tópicos concluídos não aparecem; com `com-questoes`, só os `temRegistros`.

- [ ] **Step 3: `EditalTree.tsx`** — aceitar `filtro`; filtrar os tópicos exibidos; usar `d.cor` nas bordas/`DisciplinaDot`. Aceitar `expandidas: Set<string>` + `onToggleDisciplina`.

- [ ] **Step 4: `edital/index.tsx`** — barra de filtros (`Todos / Pendentes / Concluídos / Com questões` como chips) + botão "Expandir todas / Recolher todas" (`useState<Set>`). Passar pro `EditalTree`.

- [ ] **Step 5: `disciplina/[id].tsx`** — `DisciplinaDot` da cor no cabeçalho; repaginação (Lora).

- [ ] **Step 6: Rodar tudo** — `npm test && npm run typecheck && npm run lint` → PASSA

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: filtros no Edital + cor por disciplina na árvore

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 11: Ajustes — data da prova, metas, cores das disciplinas

**Files:**
- Modify: `app/(app)/ajustes.tsx`, `src/features/concurso/api.ts` (+`atualizarDataProva`), `src/features/edital/api.ts` (+`atualizarCorDisciplina`)
- Test: `app/(app)/__tests__/ajustes.test.tsx` (ajustar)

**Interfaces:**
- Consumes: `useSalvarMetas`/`useMetas` (Task 7), `useConcursoAtivo`, `useArvore`, UI
- Produces:
  - `concurso/api.atualizarDataProva(concursoId: string, data: string | null): Promise<void>`
  - `edital/api.atualizarCorDisciplina(id: string, cor: string): Promise<void>`

- [ ] **Step 1: `atualizarDataProva` + `atualizarCorDisciplina`** (+ hooks se preciso; ou mutations inline na tela).

- [ ] **Step 2: Teste que falha** — `ajustes.test.tsx`: nova seção "Data da prova" renderiza; editar as metas chama `salvarMetas`; trocar a cor de uma disciplina chama `atualizarCorDisciplina`.

- [ ] **Step 3: `ajustes.tsx` — 3 seções novas** (em `Card`s, no visual novo):
  - **Data da prova**: `Input` de data (AAAA-MM-DD) → `atualizarDataProva` no blur; botão "limpar".
  - **Metas**: 4 `Input` numéricos (Horas/semana, Questões/semana, Conclusão %, Aproveitamento %) pré-preenchidos de `useMetas` → `useSalvarMetas().mutate({ campo })` no blur.
  - **Cores das disciplinas**: lista das disciplinas (`useArvore`), cada uma com um seletor de cor (10 bolinhas da `tokens.disciplinaPalette`) → `atualizarCorDisciplina`.
  - Manter o que já existe (#1): tema, limiares de revisão, arquivar/trocar concurso, sair.

- [ ] **Step 4: Rodar tudo** — `npm test && npm run typecheck && npm run lint` → PASSA

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: Ajustes com data da prova, metas e cores das disciplinas

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 12: Repaginar telas restantes (Revisar, auth, onboarding)

**Files:**
- Modify: `app/(app)/revisar.tsx`, `app/(auth)/sign-in.tsx`, `app/(auth)/sign-up.tsx`, `app/onboarding/novo-concurso.tsx`, `src/features/concurso/ArvoreEditor.tsx`, `src/features/revisao/*` (cor da disciplina nos grupos)
- Test: os testes de tela existentes continuam verdes (ajustar asserções de estilo se houver)

**Interfaces:**
- Consumes: tokens/FONT novos, `DisciplinaDot`
- Produces: nada novo — só visual

- [ ] **Step 1: Revisar** — títulos em Lora, `DisciplinaDot` da cor nos grupos por disciplina, `SafeAreaView` com padding do topo (corrige o "colado no topo" notado no #1), `Pill` onde faz sentido.

- [ ] **Step 2: Auth (sign-in, sign-up)** — já foram temizadas no #1; agora aplicar Lora nos títulos, revisar espaçamento, o botão "Entrar com Google" no estilo novo.

- [ ] **Step 3: Onboarding + ArvoreEditor** — Lora nos títulos ("Novo concurso — passo N de 3"), `TipoEstudoSelect`-style nos chips de peso, cor da disciplina aparecendo conforme é atribuída (preview).

- [ ] **Step 4: Rodar tudo** — `npm test && npm run typecheck && npm run lint` → PASSA

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: repagina Revisar, auth e onboarding no visual novo

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 13: Fechamento — verificação, preview, README

**Files:**
- Modify: `README.md` (seção de escopo #1.5), `app/_layout.tsx` (revisar o gate de fontes)
- Test: suíte completa + integração + build web + preview

- [ ] **Step 1: Revisar o gate de fontes** — confirmar que `if (!fontsLoaded) return null` no `_layout` não deixa a splash presa; que os testes mockam `useFonts` retornando carregado.

- [ ] **Step 2: Verificação completa**

```bash
npm run typecheck && npm run lint && npm test    # 2x (flake de cold run)
npm run test:integration
npm run build:web
```

Todos verdes. Reportar os números.

- [ ] **Step 3: Preview visual**

```bash
npm run preview
```

O `scripts/preview-web.mjs` já semeia um cenário — **atualizar o seed** pra incluir: `data_prova`, algumas linhas em `registros_estudo` (mix de tempo e questões, tipos variados), uma linha em `metas`, e `disciplinas.cor`. Rodar e conferir os PNGs em `preview/` (claro + escuro) de: login, onboarding, Painel (hub), Edital (com filtros), Tópico (registro unificado), Histórico, Ajustes. Enviar os principais pro usuário.

- [ ] **Step 4: README** — adicionar seção "Sub-projeto #1.5" no bloco de escopo: o que entrou (metas, contagem regressiva, tipo de estudo, histórico, filtros, identidade visual). Nota: `registros_estudo` substitui `sessoes_estudo`/`sessoes_exercicio`.

- [ ] **Step 5: Commit final**

```bash
git add -A
git commit -m "chore: verificação final, seed do preview e README do #1.5

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

- [ ] **Step 6: QA manual (documentar, não executar)** — roteiro pro usuário: definir data da prova e metas em Ajustes → ver contagem regressiva e metas no Painel → registrar estudo com tempo + questões + tipo pelo cronômetro → ver no Histórico → editar e apagar um registro → filtrar Histórico e Painel por período → filtrar o Edital.

---

## Self-Review (autor do plano)

**1. Cobertura da spec:**

| Requisito da spec | Task |
|---|---|
| `registros_estudo` unificado + migração de dados | 5 |
| `disciplinas.cor` + backfill | 5 |
| tabela `metas` | 5, 7 |
| `data_prova` usada (contagem regressiva) | 4 (`diasParaProva`), 8 (`CountdownCard`), 11 (editar) |
| Métricas de fonte única + janela de período | 4, 6, 7 |
| `realMetas` (semana domingo) | 4, 7, 8 |
| Nav: Painel hub + Histórico 5ª aba | 8, 9 |
| Painel: countdown + metas + desempenho c/ filtro + por disciplina | 8 |
| Histórico: log, filtros, editar/apagar | 9 |
| Tópico: fluxo de sessão unificado | 6 |
| Tipo de estudo (6 fixas, default Teoria) | 3 (`TipoEstudoSelect`), 6 (`registroSchema`) |
| Observação visível | 6 (form + lista), 9 (coluna) |
| Filtros no Edital + expandir/recolher | 10 |
| Ajustes: data prova, metas, cores | 11 |
| Identidade: paleta azul-marinho + acento reservado | 1 |
| Tipografia Lora + Inter | 1 |
| Cor por disciplina (10, rodízio) | 1 (paleta), 5 (backfill), 10 (uso), 11 (editar) |
| Componentes novos (Pill, MetaCard, CountdownCard, DisciplinaDot, PeriodoChips, TipoEstudoSelect) | 2, 3 |
| Restilizar componentes existentes | 2 |
| Repaginar todas as telas | 6, 8, 9, 10, 11, 12 |
| Faixas de % (verde/âmbar/vermelho) | 1 (`faixaPct`), 2 (`Pill`) |
| Testes: migração, TDD métricas, componente, visual, regressão | 5, 4, 2/3, 13, todas |
| Fora do escopo (streak/#3/#2/etc.) sem task | por design |

Sem lacunas.

**2. Placeholders:** nenhum "TBD". As telas descritas em prosa (Task 6 passo 5, Task 9 passos 4–5, Task 10, 11, 12) trazem componentes, hooks, comportamento e guardas de loading exatos; a lógica (métricas, schema, api, migração) tem código completo.

**3. Consistência de tipos:** `RegistroLite` (Task 4) → usado em métricas e `usePainel` (7). `RegistroRow`/`RegistroInput` (Task 6) → usados em `hooks`, `RegistrarEstudo`, `EditarRegistro` (9). `Janela`/`TipoEstudo` (Task 3) → `metrics` (4), `registroSchema` (6), `PeriodoChips`/`TipoEstudoSelect` (3), `usePainel` (7), Painel (8), Histórico (9). `Metas` (Task 7) → `usePainel`, Painel (8), Ajustes (11). `qk.registros/metas/historico` (Task 5) → 6, 7, 9. `disciplina.cor` (5) → `carregarArvore`/`DisciplinaRow` (10), `usePainel` (7), Ajustes (11), Painel (8). `diasParaProva` retorno `{dias, estado}` — consistente entre 4, 8. `MetaCard` prop `formato: 'horas'|'questoes'|'pct'` — consistente entre 3 e 8 (Painel converte `pct` das metas dividindo por 100).

**Pendências conhecidas para o executor:**
- Task 3 cria `CountdownCard` com uma função `diasAte` local; **Task 4 substitui** por `diasParaProva` de metrics. (nota no passo).
- Task 4 muda a assinatura de `aproveitamento`/`tempoEstudado` — o passo 7 instrui a atualizar `progresso/hooks.ts` na mesma task pra manter a suíte verde (as tabelas `sessoes_*` ainda existem até a Task 5).
- Task 6 deleta `src/features/exercicios/` e parte de `src/features/estudo/` — os testes deletados junto; a suíte total diminui de contagem, é esperado.
- Task 9 renomeia a aba: `layout.test.tsx` do #1 espera 4 títulos → passa a esperar 5.
- Se `supabase gen types` continuar exigindo Docker (como no #1), `src/types/db.ts` é mantido à mão nas Tasks 5 e verificado via introspection `pg`.
