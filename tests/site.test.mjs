import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const page = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('a identidade e as capturas do aplicativo mobile são o foco', () => {
  assert.match(page, /src="assets\/ovis-mobile\.webp"/);
  assert.match(page, /src="assets\/ovis-ficha\.webp"/);
  assert.match(page, /href="site-v2\.css"/);
  assert.ok(existsSync(new URL('../assets/ovis-mobile.webp', import.meta.url)));
  assert.ok(existsSync(new URL('../assets/ovis-ficha.webp', import.meta.url)));
  assert.doesNotMatch(page, /src="assets\/desktop-map\.webp"/);
});

test('a demonstração desktop é secundária e tem limites claros', () => {
  assert.match(page, /class="desktop-note"/);
  assert.match(page, /href="desktop\/"/);
  assert.match(page, /mapa esquemático/);
  assert.match(page, /não sincronizam com o app mobile/);
  assert.match(page, /dados simulados/);
  assert.ok(existsSync(new URL('../desktop/index.html', import.meta.url)));
});

test('navegação e calculadora têm destinos reais', () => {
  for (const anchor of ['produto', 'rotina', 'precos']) assert.match(page, new RegExp(`id="${anchor}"`));
  assert.match(page, /class="mobile-nav"/);
  assert.match(page, /id="herd-size"/);
  assert.match(page, /id="price-results"/);
});
