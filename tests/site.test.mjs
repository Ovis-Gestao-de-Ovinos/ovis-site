import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const page = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../field-notes.css', import.meta.url), 'utf8');

test('direção editorial combina fotografia ovina e tela real do app', () => {
  assert.match(page, /class="field-hero"/);
  assert.match(page, /src="assets\/ovis-ficha\.webp"/);
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

test('navegação e calculadora têm destinos reais', () => {
  for (const anchor of ['visao', 'produto', 'precos']) assert.match(page, new RegExp(`id="${anchor}"`));
  assert.match(page, /class="mobile-nav"/);
  assert.match(page, /id="herd-size"/);
  assert.match(page, /id="price-results"/);
});
