import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const page = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('o aplicativo mobile é o produto em destaque', () => {
  assert.match(page, /src="assets\/ovis-mobile\.webp"/);
  assert.match(page, /src="assets\/ovis-ficha\.webp"/);
  assert.ok(existsSync(new URL('../assets/ovis-mobile.webp', import.meta.url)));
  assert.ok(existsSync(new URL('../assets/ovis-ficha.webp', import.meta.url)));
  assert.doesNotMatch(page, /src="assets\/desktop-map\.webp"/);
});

test('a prévia desktop é secundária e os limites são explícitos', () => {
  assert.match(page, /href="desktop\/"/);
  assert.match(page, /mapa é esquemático/);
  assert.match(page, /dados simulados/);
  assert.match(page, /não são enviadas ao aplicativo/);
  assert.ok(existsSync(new URL('../desktop/index.html', import.meta.url)));
});
