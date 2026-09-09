# Análise — "Edital Verticalizado" da Gran Concursos (referência)

**Data:** 2026-09-09
**Arquivo analisado:** `edital-pp-ma-policia-penal-do-estado-do-maranhao.html` (Gran Concursos)
**Objetivo:** inventário de funcionalidades do software de referência e comparação com o
nosso app (spec do sub-projeto #1 + o que já foi construído + roadmap #2–#8).

---

## 1. O que é o software de referência

| Aspecto | Referência (Gran) | Nosso app |
|---|---|---|
| Natureza | 1 arquivo HTML, tudo inline (CSS+JS) | App mobile (Expo/React Native) + web |
| Backend | Nenhum | Supabase (Postgres + Auth), RLS |
| Persistência | `localStorage` do navegador | Nuvem, multi-dispositivo |
| Backup | Exportar/importar `.json` manual | Sync automático |
| Auth | Nenhuma | Login obrigatório |
| Edital | **Embutido no arquivo** (`const EDITAL`) — a Gran gera 1 HTML por concurso | Usuário cola o texto (#1) ou sobe PDF+OCR (#2) |
| Layout | Desktop-first: barra lateral fixa 240px + abas + tabelas densas. Colapsa < 900px | Mobile-first, coluna estreita |
| Tema | Só claro | Claro + escuro |
| Multi-concurso | Não (1 edital por arquivo) | Sim (arquivar/trocar) |

**Modelo de dados da referência:**
- `state[tid]` — por tópico: `{ done, datetime, acertos, erros, questoes }`
- `historico[]` — registros de estudo: `{ id, date, disc, topic, tipo, horas, questoes, acertos, erros, obs, origem }` (`origem` ∈ cronômetro | manual | modal)
- `revisoes[]` — `{ id, disc, topic, studyDate, revDate, days, done }`
- Metas: `meta-horas`, `meta-questoes`, `meta-conclusao`, `meta-aprov`
- Edital: disciplina (`id`, `nome`) → **grupo** (`nome`) → tópicos (strings, com a numeração embutida no texto)
  - "grupo" ≡ o nosso "assunto"; na referência sempre existe (pode ser um agrupador temático)

---

## 2. Inventário de funcionalidades da referência

### Barra lateral
- Logo + info do concurso (concurso, cargo, banca)
- **Contagem regressiva pra prova**: data da prova → dias restantes ("Hoje!", "Passou")
- Navegação: Cronômetro · Metas · Edital · Revisões · Histórico
- Links por disciplina (pula pra disciplina no edital)
- Botão "Salvar Progresso"
- **Exportar backup / Restaurar** (`.json`)

### Aba "Estudos"
1. **Card "Meu Progresso"**: % tópicos concluídos + barra; totais de acertos / erros / questões / aproveitamento
   - ⚠️ o aproveitamento soma as stats inline do edital **+** as stats do histórico (risco de dupla contagem — os autores reconhecem no comentário do código)
2. **Cronômetro**:
   - Timer ao vivo HH:MM:SS, iniciar / pausar / retomar / **parar e registrar**
   - Metadados da sessão (preenchidos ANTES de parar): disciplina (opcional), assunto/tópico (select dependente), **Tipo de Estudo** (6 opções), **Agendar Revisão** (7/15/21/30 dias + custom), acertos, erros, **observação** (texto livre)
   - Ao parar → cria um registro no histórico + agenda as revisões selecionadas
   - "Horas registradas hoje"
   - ⚠️ o estado do cronômetro em andamento **NÃO** é salvo no `localStorage` → recarregar a página perde a sessão
   - **Inserção manual**: data, horas/min/seg, disciplina, tópico, tipo, questões, acertos, erros, observação → cria registro **e sincroniza as questões de volta pro tópico do edital**
3. **Calendário** (grade mensal): horas estudadas por dia, hoje destacado, navegação ‹ hoje ›; clicar num dia → modal pra editar horas/questões/disciplina/tópico daquele dia
4. **Painel "Análise de Desempenho"**: filtro por **disciplina** + **período** (7/14/30/tudo). Números grandes: horas, acertos, erros, % aproveitamento. Quebra por disciplina (barras de horas + acertos/erros/% por disciplina)
5. **Metas de Estudo** (4 cards):
   - Horas / Semana — meta (input) vs real (auto, semana atual) + barra + %
   - Questões / Semana — meta vs real (auto) + barra + %
   - Conclusão do Edital — meta % vs % real de tópicos concluídos
   - Aproveitamento — meta % vs % real de acerto

### Aba "Edital"
- Filtros: Todos / **Pendentes** / **Concluídos** / **Com Questões**
- Expandir / Recolher todos
- Por disciplina: card colapsável **colorido**, mostra concluídos/total, % acertos, acertos/erros/total, pílula de % (verde ≥70 / amarelo ≥50 / vermelho)
- Dentro: tabela agrupada por "grupo", linhas = tópicos com:
  - checkbox (concluído) + data "concluído em"
  - **inputs de acertos × erros inline** por tópico
  - total + pílula de % acerto por tópico
- Questões podem ser lançadas **direto na tabela** ou via cronômetro/manual (que sincroniza)

### Aba "Revisões"
- Criadas automaticamente ao **parar o cronômetro** com uma revisão selecionada (exige tópico selecionado)
- Agrupadas por urgência: 🔴 Atrasadas · 🟡 Revisar Hoje · 🔵 Esta Semana · ⚪ Próximas · 🟢 Concluídas
- Dentro de cada grupo: por disciplina
- Cada item: tópico, data do estudo, "agendada Nd", badge (Xd atrasada / Hoje! / Nd → DD/MM), botão Finalizado/Reabrir, delete

### Aba "Histórico"
- Resumo: dias estudados · total de horas · total de questões · média diária
- Filtros: disciplina + período (7/30/tudo)
- Tabela: Data · Disciplina · Assunto/Tópico · **Tipo** · Tempo · Questões · Acertos · Erros · % Acerto · **Observação** · **Origem** · delete

### Geral
- Toasts de feedback
- Modal de edição de dia do calendário
- Responsivo (colapsa a sidebar < 900px)

---

## 3. Comparação funcional

Legenda: ✅ temos · 🟡 parcial · ❌ não temos · 📋 planejado (sub-projeto)

| Funcionalidade | Referência | Nosso status | Observação |
|---|---|---|---|
| Hierarquia disciplina → assunto → tópico | ✅ (disc→grupo→tópico) | ✅ | Nosso: assunto opcional. Dele: grupo sempre presente |
| Marcar tópico concluído + data | ✅ | ✅ | |
| Cronômetro ao vivo (start/pause/resume/stop) | ✅ | ✅ | **Nosso persiste a sessão; o dele não** |
| Entrada manual de tempo | ✅ | ✅ | |
| Registro de exercícios (acertos/erros) | ✅ (inline + por sessão) | ✅ (por sessão) | Dele também edita direto na tabela do edital |
| Painel de progresso (cobertura, aproveitamento, tempo) | ✅ | ✅ | |
| Quebra por disciplina | ✅ | ✅ | |
| **Peso da disciplina / cobertura ponderada** | ❌ | ✅ | Nosso diferencial |
| **Contagem regressiva pra prova** | ✅ (destaque na sidebar) | ❌ | Guardamos `data_prova`, não exibimos |
| **Metas semanais** (horas, questões, conclusão %, aproveitamento %) | ✅ | ❌ | **Maior lacuna** |
| **Histórico global de estudos** (log cronológico filtrável) | ✅ | ❌ | Temos listas por tópico, não um log geral |
| **"Tipo de estudo"** (Teoria/Questões/Simulado/Lei Seca/Juris/Discursiva) | ✅ | ❌ | |
| **Observação (texto livre) na sessão** | ✅ | 🟡 | Campo `nota` existe no banco; UI não expõe bem |
| **Calendário mensal** (horas/dia, editar dia) | ✅ | ❌ | |
| **Filtro de período no painel** (7/14/30/tudo) | ✅ | 🟡 | Nosso só mostra "últimos 7 dias" pro tempo |
| **Filtros no edital** (pendentes/concluídos/com questões) | ✅ | ❌ | |
| Expandir/recolher edital | ✅ | ❌ | |
| **Cor por disciplina** (usada em todo lugar) | ✅ | ❌ | Decisão de design |
| Revisão por data | ✅ (agendada, intervalos escolhidos) | 🟡 (#1: regra fixa 7/15/30) | Nosso #3 é a versão inteligente |
| Revisão com intervalo manual (7/15/**21**/30/custom) | ✅ | ❌ | Alimentar o #3 |
| Revisões agrupadas por urgência | ✅ | 🟡 (#1: grupos por limiar) | |
| Backup manual (export/import JSON) | ✅ | 🟡 | Temos sync na nuvem; export JSON/CSV é #18 |
| Sync na nuvem / multi-dispositivo | ❌ | ✅ | Nosso diferencial |
| Login / multi-usuário | ❌ | ✅ | |
| Dark mode | ❌ | ✅ | |
| Múltiplos concursos | ❌ | ✅ | |
| App mobile nativo | ❌ | ✅ | |
| OCR do edital (PDF) | ❌ | 📋 #2 | |
| Repetição espaçada de verdade | ❌ | 📋 #3 | |
| Flashcards | ❌ | 📋 #5 | |
| Pomodoro / Modo Foco | ❌ | 📋 #6 | |
| Gamificação (streak/XP/medalhas/confete) | ❌ | 📋 #6 | |
| Busca global | ❌ | 📋 #14 | |
| Widget na tela inicial | ❌ | 📋 #8 | |
| Export PDF/CSV | ❌ | 📋 #18 | |
| Export pra Google/Apple Calendar | ❌ | 📋 #21 | |
| Links pra bancos de questões externos | ❌ | 📋 (#19) | |

---

## 4. O que a referência faz melhor / vale copiar

Em ordem de valor × esforço:

1. **Metas semanais** (esforço médio) — o recurso mais ausente. Meta manual + real automático, 4 dimensões. Não está em nenhum sub-projeto atual.
2. **Contagem regressiva pra prova** (esforço mínimo) — dado já existe, só exibir. Motivacional.
3. **Observação na sessão, visível na UI** (esforço mínimo) — banco já suporta.
4. **"Tipo de estudo"** por sessão (esforço pequeno) — campo + select. Enriquece o histórico e as estatísticas.
5. **Histórico global** (esforço médio) — tela de log cronológico, filtrável por disciplina/período, com origem/tipo/observação.
6. **Filtro de período no painel** (esforço pequeno-médio) — deixar o painel filtrável por 7/14/30/tudo e por disciplina.
7. **Filtros + expandir/recolher no edital** (esforço pequeno).
8. **Cor por disciplina** (esforço pequeno) — decisão de design; melhora leitura em todas as telas.
9. **Escolha manual do intervalo de revisão** (fold no #3) — inclusive o intervalo de **21 dias** e custom.
10. **Calendário mensal** (esforço médio) — visualização de horas/dia; bom pra ver constância.

## 5. O que NÃO copiar (paradigma diferente)

- **Edição de questões inline na tabela do edital** — é UX de planilha desktop. O nosso é mobile, uma tela por tópico. Manter a nossa abordagem.
- **Edital embutido no arquivo** — o nosso modelo (colar texto / OCR) é mais flexível e é o ponto do produto.
- **Somar stats do edital + histórico pro aproveitamento** — a própria referência reconhece o risco de dupla contagem. O nosso tem uma fonte só (sessões de exercício). Manter.
- **Backup manual JSON como mecanismo principal** — temos sync. Export JSON/CSV entra como conveniência no #18.

## 6. Observações de design

A referência tem **identidade visual forte** (que a nossa ainda não tem):
- Paleta: navy `#0D134C` + menta/lime como acento + rust `#C8102E`; verde/amarelo/vermelho para faixas de %
- Tipografia: **Nunito** (display, pesos 800–900) + **Inter** (corpo)
- **Cor por disciplina** (10 cores rotativas), usada em dots, barras, badges, bordas
- **Pílulas de %** com faixa de cor (g ≥70 / y ≥50 / r) — padrão limpo e reaproveitável
- Layout denso, orientado a dashboard (sidebar + tabelas)

Nada disso obriga a copiar — mas mostra o nível de "vestido" que o mercado (Gran, Estratégia, QC) entrega. A nossa passada de design deveria mirar algo com identidade equivalente, adaptado a mobile.

---

## 7. Recomendação de roadmap

Criar um sub-projeto **"#1.5 — Acompanhamento avançado"** com as lacunas reais de baixo/médio esforço, para rodar **antes ou logo depois do #2 (OCR)**:

- Contagem regressiva pra prova
- Metas semanais (horas, questões, conclusão %, aproveitamento %)
- "Tipo de estudo" nas sessões + observação visível na UI
- Histórico global (log filtrável)
- Filtro de período/disciplina no painel
- Filtros + expandir/recolher no edital

E dobrar isso com a **passada de design** (identidade visual, cor por disciplina, tipografia), já que várias dessas telas são novas e é melhor nascerem no visual certo.

O **#3 (repetição espaçada)** absorve: escolha manual de intervalo (7/15/21/30/custom) + agrupamento por urgência (já temos parte).
