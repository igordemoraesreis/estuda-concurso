# Estuda Concurso

App mobile (React Native + Expo) para organizar os estudos de quem presta concurso:
cadastro manual do edital por texto colado, marcação de conclusão de tópicos,
cronômetro de estudo, registro agregado de exercícios, painel de progresso e
lista de revisão por data. Backend em **Supabase na nuvem** (Postgres + Auth),
com RLS por usuário.

Este repositório entrega o **sub-projeto #1 (Fundação)**. Escopo detalhado em
[`docs/superpowers/specs/2026-09-07-fundacao-app-concurseiros-design.md`](docs/superpowers/specs/2026-09-07-fundacao-app-concurseiros-design.md).

---

## Pré-requisitos

- **Node 20+**
- **Conta Supabase** com um projeto **na nuvem**.
  Este projeto **não usa Supabase local nem Docker** — as migrações já estão
  aplicadas no projeto da nuvem.
- **Expo Go** (Android/iOS) ou um emulador/simulador para rodar o app.

---

## Setup

1. **Instalar dependências**

   ```bash
   npm install
   ```

2. **Criar o `.env` na raiz** (nunca versionado — veja `.env.example`):

   ```dotenv
   # App (prefixo EXPO_PUBLIC_)
   EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>

   # Somente testes de integração / CLI (sem prefixo EXPO_PUBLIC_)
   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_ANON_KEY=<anon key>
   SUPABASE_SERVICE_ROLE_KEY=<service role key>
   SUPABASE_DB_PASSWORD=<senha do banco>
   SUPABASE_PROJECT_REF=<project-ref>
   ```

   Todos os valores estão em **Supabase → Project Settings → API** (URLs e chaves)
   e **→ Database** (senha do banco / connection string).

3. **Aplicar as migrações** (apenas se estiver montando um projeto Supabase novo —
   o projeto já provisionado não precisa disso):

   ```bash
   npx supabase db push --db-url "postgresql://postgres.<project-ref>:<senha>@<host-do-pooler>:5432/postgres"
   ```

   Use a **connection string do pooler** que aparece em
   Supabase → Project Settings → Database → Connection string.

4. **Rodar o app (mobile)**

   ```bash
   npm start
   ```

   Abra no Expo Go (QR code) ou pressione `a` / `i` para emulador.

5. **Rodar no navegador** (dev/preview — não é alvo público)

   ```bash
   npm run web
   ```

   Abre em `http://localhost:8081`. O fluxo central (login, onboarding, painel,
   edital, cronômetro, exercícios, revisão, ajustes) funciona no navegador; o
   layout fica numa coluna de largura de celular centralizada. Recursos
   exclusivos de mobile (widget, push, backup em nuvem) não se aplicam.

---

## Screenshots automáticos

```bash
npm run build:web && npm run preview
```

`npm run preview` semeia um cenário de teste no Supabase, sobe o build web
estático e percorre as telas com o Chromium (Playwright), salvando PNGs em
`preview/` (claro + escuro; um usuário com concurso e outro sem). Requer
`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` no `.env`.

---

## Testes

| Comando | O que faz |
|---|---|
| `npm test` | Testes unitários e de componente (jest-expo + RNTL). **Não toca a nuvem.** |
| `npm run test:integration` | Testes de integração contra o **Supabase na nuvem** (RLS, cascata, triggers, APIs). Credenciais lidas do `.env` via dotenv. |
| `npm run typecheck` | `tsc --noEmit` (TypeScript strict). |
| `npm run lint` | ESLint. |

Os testes de integração criam usuários/dados de teste no projeto da nuvem
(sem limpeza automática — acumulam no projeto de dev); **não** rode
`supabase db reset`.

---

## Login com Google

O botão **"Entrar com Google"** só funciona depois de habilitar o provider no
dashboard: **Supabase → Authentication → Providers → Google** (client ID/secret
do Google Cloud + a redirect URL do Supabase). O login por **e-mail/senha
funciona out-of-the-box**, sem configuração extra.

---

## Escopo

### Incluído no sub-projeto #1 (Fundação)

- Login obrigatório (Google + e-mail/senha), online-first
- Um edital ativo por vez + histórico de concursos (arquivar / trocar)
- Cadastro do edital por **texto colado** (parser para árvore disciplina → assunto → tópico)
- Peso 1–5 por disciplina
- Marcação de conclusão de tópicos (com `concluido_em`)
- Cronômetro de estudo ao vivo + registro de tempo manual + persistência
- Sessões de exercício agregadas (acertos / erros por tópico)
- Painel de progresso: cobertura, cobertura ponderada, aproveitamento, tempo (janela de 7 dias)
- Lista de revisão por data, com limiares configuráveis
- Tema claro/escuro/sistema (persistido no perfil)
- RLS por usuário em todas as tabelas
- Mensagens de erro em PT-BR, toasts e empty states

### Fora de escopo (não implementado por design)

OCR / upload real de PDF, motor de revisão espaçada, plano de estudo automático,
flashcards, Pomodoro, gamificação, widget de tela inicial, backup em nuvem,
exportação PDF/CSV, calendário, modo offline, notificações push, múltiplos
editais simultâneos, login com Apple/Facebook.

---

## QA manual

Roteiro para validação ponta a ponta em device/emulador (`npm start` + Expo Go):

1. Criar conta por e-mail → cai no onboarding.
2. Wizard: nome "Teste", colar o texto abaixo, processar, ajustar o peso de
   PORTUGUÊS para 5, criar.

   ```
   1 PORTUGUÊS
   1.1 Crase
   1.2 Ortografia
   2 RLM
   2.1 Lógica
   ```

3. Painel mostra 0% de cobertura, 4 tópicos.
4. Abrir o tópico "Crase" → marcar como concluído → voltar ao painel: a cobertura sobe.
5. No tópico: iniciar o cronômetro, esperar ~10s, parar → a sessão aparece na
   lista; registrar 8 acertos / 2 erros → aproveitamento do painel = 80%.
6. Registrar tempo manual de 30min ontem → o tempo total sobe.
7. Ajustes → tema escuro aplica na hora.
8. Fechar e reabrir o app → sessão mantida, cai direto no painel, **tema escuro preservado**.
9. Ajustes → arquivar o concurso → volta ao onboarding.

---

## Estrutura

```
app/            rotas (Expo Router): (auth), (app), onboarding
src/
  components/ui biblioteca base de componentes + tokens de tema
  features/     auth, concurso, edital, estudo, exercicios, progresso, revisao, settings
  lib/          cliente Supabase, normalizeError (PT-BR), QueryClient
  theme/        ThemeProvider, tokens, ThemeRehydrator
supabase/migrations   schema, RLS e triggers
tests/integration     suíte contra o Supabase na nuvem
```

Plano de implementação: [`docs/superpowers/plans/2026-09-07-fundacao-app-concurseiros.md`](docs/superpowers/plans/2026-09-07-fundacao-app-concurseiros.md).
