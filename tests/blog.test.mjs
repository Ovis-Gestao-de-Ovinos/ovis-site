import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { validarPost, renderPost, renderIndex } from '../scripts/blog-lib.mjs';

const url = (f) => new URL(`../${f}`, import.meta.url);
const read = (f) => readFileSync(url(f), 'utf8');
const posts = JSON.parse(read('blog/_registro.json'));

test('registro, corpos, páginas, índice e sitemap batem', () => {
  const index = read('blog/index.html');
  const sitemap = read('sitemap.xml');
  assert.match(sitemap, /<loc>https:\/\/ovisapp\.com\.br\/blog\/<\/loc>/);
  for (const p of posts) {
    assert.deepEqual(validarPost(p), [], p.slug);
    assert.ok(existsSync(url(`blog/_corpos/${p.slug}.html`)), `corpo de ${p.slug}`);
    assert.equal(read(`blog/${p.slug}/index.html`), renderPost(p, read(`blog/_corpos/${p.slug}.html`)), `página de ${p.slug} gerada pelo build`);
    assert.ok(index.includes(`href="/blog/${p.slug}/"`), `${p.slug} no índice`);
    assert.ok(sitemap.includes(`/blog/${p.slug}/</loc>`), `${p.slug} no sitemap`);
  }
  assert.equal(new Set(posts.map((p) => p.slug)).size, posts.length, 'slugs únicos');
  const pastas = readdirSync(url('blog'), { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith('_')).map((d) => d.name);
  assert.deepEqual(pastas.sort(), posts.map((p) => p.slug).sort(), 'nenhuma página órfã');
  assert.equal(index, renderIndex(posts));
});

test('posts sem preço, sem linguagem de startup e sem prometer uso offline', () => {
  for (const p of posts) {
    const corpo = read(`blog/_corpos/${p.slug}.html`);
    assert.doesNotMatch(corpo, /R\$ ?\d/, `${p.slug}: valor em reais`);
    assert.doesNotMatch(corpo, /solução|potencializ|jornada|evolua|escal[ae]/i, `${p.slug}: linguagem de startup`);
    assert.doesNotMatch(corpo, /sem internet|offline/i, `${p.slug}: uso offline`);
    assert.doesNotMatch(corpo, /<h1|<h2>Fontes/i, `${p.slug}: H1 e fontes saem do registro`);
  }
});

test('modo da rotina é válido', () => {
  const r = JSON.parse(read('blog/_rotina.json'));
  assert.ok(['automatico', 'aprovacao'].includes(r.modo), r.modo);
  assert.ok(r.inicio === null || /^\d{4}-\d{2}-\d{2}$/.test(r.inicio), r.inicio);
});

test('blog no footer, no llms.txt, e o que é interno fora do Jekyll', () => {
  for (const f of ['index.html', 'sobre/index.html', 'privacidade/index.html', 'calculadora-gmd/index.html']) {
    assert.match(read(f), /<nav aria-label="Ovis">.*?href="\/?blog\/">Blog<\/a>/, f);
    assert.match(read(f), /site\.css\?v=24/, `${f}: versão do CSS`);
  }
  assert.ok(read('llms.txt').includes('](https://ovisapp.com.br/blog/)'));
  for (const p of ['blog/_registro.json', 'blog/_rotina.json', 'blog/_corpos']) assert.ok(read('_config.yml').includes(`  - ${p}\n`), p);
});
