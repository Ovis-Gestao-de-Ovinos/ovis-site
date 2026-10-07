import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const page = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../field-notes.css', import.meta.url), 'utf8');

test('direção editorial combina fotografia ovina e tela real do app', () => {
  assert.match(page, /class="field-hero"/);
  assert.match(page, /src="assets\/ovis-ficha\.webp"/);
  assert.match(page, /Seu rebanho ovino,/);
  assert.match(page, /produtores de ovinos e equipes de fazenda/);
  assert.match(page, /href="field-notes\.css"/);
  assert.match(css, /assets\/sheep-portrait\.webp/);
  assert.match(css, /assets\/sheep-pasture\.webp/);
  for (const asset of ['ovis-ficha.webp', 'sheep-portrait.webp', 'sheep-pasture.webp', 'sheep-flock.webp']) {
    assert.ok(existsSync(new URL(`../assets/${asset}`, import.meta.url)));
  }
  assert.doesNotMatch(page, /src="assets\/desktop-map\.webp"/);
});

test('demonstração secundária e limitações claras', () => {
  assert.match(page, /class="field-desktop"/);
  assert.match(page, /href="desktop\/"/);
  assert.match(page, /dados simulados/i);
  assert.match(page, /Não há conta, sincronização/);
  assert.ok(existsSync(new URL('../desktop/index.html', import.meta.url)));
});

test('SEO e conteúdo legível por buscadores refletem o protótipo sem prometer assinatura', () => {
  const sitemap = readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
  const canonical = 'https://ovis-gestao-de-ovinos.github.io/ovis-site/';
  assert.match(page, /<html lang="pt-BR">/);
  assert.match(page, /<title>Ovis \| Gestão de rebanhos ovinos no celular<\/title>/);
  assert.match(page, /<link rel="canonical" href="https:\/\/ovis-gestao-de-ovinos\.github\.io\/ovis-site\/">/);
  assert.match(page, /<meta property="og:image"/);
  assert.match(page, /<meta name="twitter:card" content="summary_large_image">/);
  assert.ok(existsSync(new URL('../assets/ovis-social.jpg', import.meta.url)));
  assert.match(page, /type="application\/ld\+json"/);
  assert.match(page, /dados simulados/i);
  assert.match(sitemap, new RegExp(canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(page, /aggregateRating|"@type":"SoftwareApplication"/);
});

test('navegação e calculadora têm destinos reais', () => {
  for (const anchor of ['visao', 'produto', 'precos']) assert.match(page, new RegExp(`id="${anchor}"`));
  assert.match(page, /class="mobile-nav"/);
  assert.match(page, /id="herd-size"/);
  assert.match(page, /id="price-results"/);
});
