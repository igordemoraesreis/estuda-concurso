/**
 * A Vercel (e alguns outros hosts) ignoram QUALQUER pasta chamada `node_modules`
 * no deploy. O `expo export --platform web` coloca as fontes de ícone e imagens
 * vendorizadas em `dist/assets/node_modules/...`, então elas somem no deploy.
 *
 * Este script roda depois do `expo export`: renomeia essa pasta para
 * `dist/assets/_vendor` e reescreve as referências no bundle JS.
 */
import { rename, readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const FROM_DIR = join(DIST, 'assets', 'node_modules');
const TO_DIR = join(DIST, 'assets', '_vendor');
const FROM_REF = 'assets/node_modules/';
const TO_REF = 'assets/_vendor/';

if (!existsSync(FROM_DIR)) {
  console.log('fix-web-assets: nada a fazer (sem assets/node_modules).');
  process.exit(0);
}

await rename(FROM_DIR, TO_DIR);

async function* walk(dir) {
  for (const entry of await readdir(dir)) {
    const p = join(dir, entry);
    if ((await stat(p)).isDirectory()) yield* walk(p);
    else yield p;
  }
}

let touched = 0;
for await (const file of walk(DIST)) {
  if (!/\.(js|css|html|json)$/.test(file)) continue;
  const body = await readFile(file, 'utf8');
  if (!body.includes(FROM_REF)) continue;
  await writeFile(file, body.split(FROM_REF).join(TO_REF));
  touched++;
}

console.log(`fix-web-assets: assets/node_modules -> assets/_vendor (${touched} arquivo(s) reescrito(s)).`);
