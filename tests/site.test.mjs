import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const page = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('a demonstração real é acessível pelos CTAs e identificada como prévia', () => {
  assert.match(page, /class="header-cta" href="desktop\/"/);
  assert.match(page, /class="button button-light" href="desktop\/"/);
  assert.match(page, /Dados de demonstração/);
  assert.match(page, /alterações ficam apenas neste navegador/);
  assert.ok(existsSync(new URL('../desktop/index.html', import.meta.url)));
});

test('a imagem do hero é uma captura local do produto', () => {
  assert.match(page, /src="assets\/desktop-map\.webp"/);
  assert.ok(existsSync(new URL('../assets/desktop-map.webp', import.meta.url)));
  assert.doesNotMatch(page, /class="phone"/);
  assert.doesNotMatch(page, /class="quote-section"/);
});
