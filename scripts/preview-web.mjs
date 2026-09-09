/**
 * Preview visual do app no navegador (dev only).
 *
 * 1. Semeia um cenário de teste no Supabase (usuário + concurso + árvore + sessões)
 * 2. Sobe o build web estático de ./dist (rode `npm run build:web` antes)
 * 3. Percorre as telas principais com o Chromium e salva PNGs em ./preview/
 *    (claro + escuro; um usuário com concurso e outro sem, pro onboarding)
 *
 * Uso:  npm run build:web && npm run preview
 * Requer no .env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
 */
import { createServer } from 'node:http';
import { readFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';

const DIST = resolve('dist');
const OUT = resolve('preview');
const PORT = 8091;
const BASE = `http://localhost:${PORT}`;

const SUPA_URL = process.env.SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASS = 'preview-123456';
const USER_FULL = 'preview@estuda.local'; // tem concurso ativo
const USER_NEW = 'preview-novo@estuda.local'; // sem concurso -> cai no onboarding

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
};

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('dist/ não encontrado. Rode `npm run build:web` primeiro.');
  process.exit(1);
}
if (!SUPA_URL || !SERVICE) {
  console.error('Faltam SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

/* ---------------- static server (SPA fallback) ---------------- */
function serve() {
  return new Promise((res) => {
    const srv = createServer(async (req, resp) => {
      const p = decodeURIComponent(req.url.split('?')[0]);
      const asset = join(DIST, p);
      const file = extname(p) && existsSync(asset) ? asset : join(DIST, 'index.html');
      try {
        const body = await readFile(file);
        resp.setHeader('Content-Type', MIME[extname(file)] ?? 'application/octet-stream');
        resp.end(body);
      } catch {
        resp.statusCode = 404;
        resp.end('not found');
      }
    });
    srv.listen(PORT, () => res(srv));
  });
}

/* ---------------- seed ---------------- */
async function ensureUser(admin, email) {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const found = data.users.find((u) => u.email === email);
  if (found) await admin.auth.admin.deleteUser(found.id);
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password: PASS,
    email_confirm: true,
  });
  if (error) throw error;
  return created.user.id;
}

async function seed() {
  const admin = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });

  // usuário "novo" — sem concurso
  const newUid = await ensureUser(admin, USER_NEW);
  await admin.from('profiles').upsert({ id: newUid, display_name: 'Ana (novo)' });

  // usuário "completo"
  const uid = await ensureUser(admin, USER_FULL);
  const { data: c } = await admin
    .from('concursos')
    .insert({
      user_id: uid,
      nome: 'TRT-4 · Analista Judiciário',
      banca: 'FCC',
      cargo: 'Analista Judiciário — Área Judiciária',
      status: 'ativo',
    })
    .select()
    .single();

  const discs = [
    { nome: 'Língua Portuguesa', peso: 5, topicos: ['Ortografia', 'Crase', 'Concordância verbal', 'Regência', 'Pontuação', 'Interpretação de texto'] },
    { nome: 'Raciocínio Lógico-Matemático', peso: 3, topicos: ['Proposições', 'Tabelas-verdade', 'Argumentos válidos', 'Análise combinatória'] },
    { nome: 'Direito Constitucional', peso: 4, topicos: ['Princípios fundamentais', 'Direitos e garantias', 'Organização do Estado', 'Poder Judiciário', 'Controle de constitucionalidade'] },
    { nome: 'Direito Administrativo', peso: 4, topicos: ['Atos administrativos', 'Licitações e contratos', 'Servidores públicos', 'Improbidade administrativa'] },
  ];

  const topicoIds = [];
  for (const [di, d] of discs.entries()) {
    const { data: disc } = await admin
      .from('disciplinas')
      .insert({ user_id: uid, concurso_id: c.id, nome: d.nome, peso: d.peso, ordem: di })
      .select()
      .single();
    for (const [ti, t] of d.topicos.entries()) {
      const { data: top } = await admin
        .from('topicos')
        .insert({ user_id: uid, disciplina_id: disc.id, nome: t, ordem: ti })
        .select()
        .single();
      topicoIds.push(top.id);
    }
  }

  for (const id of topicoIds.slice(0, 7)) {
    await admin.from('topicos').update({ concluido: true }).eq('id', id);
  }
  // um concluído "há muito tempo" pra aparecer em Revisar
  await admin
    .from('topicos')
    .update({ concluido_em: new Date(Date.now() - 40 * 86400000).toISOString() })
    .eq('id', topicoIds[0]);

  const now = Date.now();
  for (let i = 0; i < 6; i++) {
    await admin.from('sessoes_estudo').insert({
      user_id: uid,
      topico_id: topicoIds[i % topicoIds.length],
      iniciada_em: new Date(now - i * 86400000).toISOString(),
      duracao_segundos: 1500 + i * 700,
      origem: i % 2 ? 'manual' : 'cronometro',
    });
  }
  for (let i = 0; i < 7; i++) {
    await admin.from('sessoes_exercicio').insert({
      user_id: uid,
      topico_id: topicoIds[i % topicoIds.length],
      data: new Date(now - i * 86400000).toISOString().slice(0, 10),
      acertos: 6 + (i % 4),
      erros: 3 - (i % 3),
    });
  }
  await admin.from('profiles').upsert({ id: uid, active_concurso_id: c.id, display_name: 'Igor (preview)' });
}

/* ---------------- walkthrough ---------------- */
async function shoot() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const shots = [];

  for (const scheme of ['light', 'dark']) {
    const ctx = await browser.newContext({
      viewport: { width: 414, height: 896 },
      colorScheme: scheme,
      deviceScaleFactor: 2,
    });
    const page = await ctx.newPage();
    page.setDefaultTimeout(20000);

    const snap = async (name, fn) => {
      try {
        if (fn) await fn();
        await page.waitForTimeout(800);
        const f = join(OUT, `${name}-${scheme}.png`);
        await page.screenshot({ path: f });
        shots.push(f);
        console.log('  ✓', `${name}-${scheme}`);
      } catch (e) {
        console.log('  ✗', `${name}-${scheme}`, '—', String(e).split('\n')[0]);
      }
    };

    const login = async (email) => {
      await page.goto(BASE, { waitUntil: 'networkidle' });
      await page.getByLabel('E-mail').fill(email);
      await page.getByLabel('Senha').fill(PASS);
      await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    };

    const tab = async (label) =>
      page.getByRole('link', { name: label }).or(page.getByText(label, { exact: true })).last().click();

    // --- usuário novo: login + onboarding ---
    await snap('01-login', async () => {
      await page.goto(BASE, { waitUntil: 'networkidle' });
      await page.getByText('Entrar').first().waitFor();
    });
    await snap('02-cadastro', async () => {
      await page.getByText('Cadastre-se').click();
    });
    await snap('03-onboarding-dados', async () => {
      await login(USER_NEW);
      await page.getByText(/passo 1 de 3/i).waitFor();
    });
    await snap('04-onboarding-texto', async () => {
      await page.getByLabel('Nome do concurso').fill('Prefeitura de Porto Alegre');
      await page.getByRole('button', { name: 'Continuar' }).click();
      await page.getByText(/passo 2 de 3/i).waitFor();
    });
    await snap('05-onboarding-arvore', async () => {
      await page
        .getByLabel('Texto do edital')
        .fill('1 PORTUGUÊS\n1.1 Ortografia\n1.2 Crase\n2 MATEMÁTICA\n2.1 Frações\n2.2 Porcentagem');
      await page.getByRole('button', { name: 'Processar texto' }).click();
      await page.getByText(/passo 3 de 3/i).waitFor();
    });

    // --- usuário completo: painel + abas ---
    await ctx.clearCookies();
    await page.evaluate(() => { try { localStorage.clear(); } catch {} });
    await snap('06-painel', async () => {
      await login(USER_FULL);
      await page.getByText('TRT-4', { exact: false }).first().waitFor();
    });
    await snap('07-edital', async () => {
      await tab('Edital');
      await page.getByText('Língua Portuguesa').first().waitFor();
    });
    await snap('08-disciplina', async () => {
      await page.getByRole('button', { name: 'Abrir disciplina Direito Constitucional' }).click();
      await page.getByText('peso', { exact: false }).first().waitFor();
    });
    await snap('09-topico', async () => {
      await tab('Edital');
      await page.getByRole('button', { name: 'Abrir tópico Crase' }).click();
      await page.getByText('Concluído').first().waitFor();
    });
    await snap('10-revisar', async () => {
      await tab('Revisar');
    });
    await snap('11-ajustes', async () => {
      await tab('Ajustes');
      await page.getByText('Sair').first().waitFor();
    });

    await ctx.close();
  }
  await browser.close();
  return shots;
}

/* ---------------- run ---------------- */
const srv = await serve();
console.log(`servindo dist/ em ${BASE}`);
try {
  console.log('semeando cenário...');
  await seed();
  console.log('tirando screenshots...');
  const shots = await shoot();
  console.log(`\n${shots.length} imagens em ${OUT}/`);
} finally {
  srv.close();
}
