// Gera as páginas do blog e o sitemap a partir de blog/_registro.json e blog/_corpos/<slug>.html.
// Uso: node scripts/blog-build.mjs [--hoje AAAA-MM-DD]
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { validarPost, renderPost, renderIndex, atualizarSitemap } from './blog-lib.mjs';

const raiz = (f) => new URL(`../${f}`, import.meta.url);
const arg = process.argv.indexOf('--hoje');
const hoje = arg > -1 ? process.argv[arg + 1] : new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

const posts = JSON.parse(readFileSync(raiz('blog/_registro.json'), 'utf8'));
const erros = posts.flatMap((p) => [
  ...validarPost(p).map((e) => `${p.slug}: ${e}`),
  ...(existsSync(raiz(`blog/_corpos/${p.slug}.html`)) ? [] : [`${p.slug}: falta blog/_corpos/${p.slug}.html`]),
]);
const repetidos = posts.map((p) => p.slug).filter((s, i, a) => a.indexOf(s) !== i);
if (repetidos.length) erros.push(`slug repetido: ${repetidos.join(', ')}`);
if (erros.length) {
  console.error(erros.join('\n'));
  process.exit(1);
}

for (const p of posts) {
  mkdirSync(raiz(`blog/${p.slug}`), { recursive: true });
  writeFileSync(raiz(`blog/${p.slug}/index.html`), renderPost(p, readFileSync(raiz(`blog/_corpos/${p.slug}.html`), 'utf8')));
}
writeFileSync(raiz('blog/index.html'), renderIndex(posts));
writeFileSync(raiz('sitemap.xml'), atualizarSitemap(readFileSync(raiz('sitemap.xml'), 'utf8'), posts, hoje));
console.log(`blog: ${posts.length} post(s), índice e sitemap atualizados`);
