import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const page = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../landing.css', import.meta.url), 'utf8');

for (const id of ['inicio', 'visao', 'produto', 'rotina', 'precos', 'perguntas', 'estado']) {
  test(`navegação tem seção ${id}`, () => assert.match(page, new RegExp(`id="${id}"`)));
}

test('página usa identidade Ovis e ativos próprios', () => {
  assert.match(page, /Seu rebanho ovino,/);
  assert.match(page, /produtores de ovinos e equipes de fazenda/);
  assert.match(page, /assets\/ovis-ficha\.webp/);
  assert.match(page, /assets\/sheep-flock\.webp/);
  assert.match(css, /--field-ink/);
  assert.ok(existsSync(new URL('../assets/ovis-ficha.webp', import.meta.url)));
  assert.doesNotMatch(page, /Subscrr|Apple Watch|subscriptions/);
});

test('nova composição visual rompe com hero fotográfico de tela cheia e grade uniforme de planos', () => {
  const redesign = readFileSync(new URL('../redesign.css', import.meta.url), 'utf8');
  assert.match(page, /href="redesign\.css"/);
  assert.match(page, /class="hero-app-preview"/);
  assert.match(page, /class="hero-photo-label"/);
  assert.match(redesign, /\.field-hero\s*\{/);
  assert.match(redesign, /\.field-hero-photo\s*\{/);
  assert.match(redesign, /\.pricing-section\s*>\s*\.wrap\s*\{/);
  assert.match(redesign, /\.plan-card\.trial\s*\{/);
  assert.match(redesign, /@media\s*\(max-width:\s*760px\)/);
});

test('planos novos substituem tabela antiga sem promessa de compra ou desconto', () => {
  assert.match(page, /14 dias grátis/);
  assert.match(page, /R\$ 309,90/);
  assert.match(page, /R\$ 359,90/);
  assert.match(page, /a partir de/);
  assert.match(page, /15% de desconto/);
  assert.match(page, /Mensal/);
  assert.match(page, /Anual/);
  assert.doesNotMatch(page, /Basic|R\$ 259,90|herd-size|price-results/i);
});

test('condições não definidas e limitações do protótipo ficam claras', () => {
  assert.match(page, /dados simulados/i);
  assert.match(page, /condições.*confirmadas/i);
  assert.match(page, /não processa pagamentos/i);
  assert.match(page, /a ativação do teste e a contratação não acontecem neste site/i);
});

test('SEO permanece coerente com a prévia', () => {
  const sitemap = readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
  assert.match(page, /<html lang="pt-BR">/);
  assert.match(page, /<link rel="canonical" href="https:\/\/ovis-gestao-de-ovinos\.github\.io\/ovis-site\/">/);
  assert.match(page, /<meta property="og:image"/);
  assert.match(page, /type="application\/ld\+json"/);
  assert.match(sitemap, /ovis-site\//);
  assert.doesNotMatch(page, /aggregateRating|"@type":"SoftwareApplication"/);
});
