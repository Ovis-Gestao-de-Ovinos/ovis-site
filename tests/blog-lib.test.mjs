import test from 'node:test';
import assert from 'node:assert/strict';
import { deveRodarHoje, precisaAvisoVet, validarPost, escapeHtml } from '../scripts/blog-lib.mjs';

test('deveRodarHoje: sem início publica', () => assert.equal(deveRodarHoje('2026-10-27', { inicio: null }), true));

test('deveRodarHoje: 14 dias diários', () => {
  assert.equal(deveRodarHoje('2026-10-27', { inicio: '2026-10-27' }), true);
  assert.equal(deveRodarHoje('2026-11-09', { inicio: '2026-10-27' }), true); // dia 13, segunda
});

test('deveRodarHoje: depois, só terça e sexta', () => {
  assert.equal(deveRodarHoje('2026-11-10', { inicio: '2026-10-27' }), true); // terça
  assert.equal(deveRodarHoje('2026-11-11', { inicio: '2026-10-27' }), false); // quarta
  assert.equal(deveRodarHoje('2026-11-13', { inicio: '2026-10-27' }), true); // sexta
  assert.equal(deveRodarHoje('2026-11-15', { inicio: '2026-10-27' }), false); // domingo
});

test('precisaAvisoVet ignora acento, caixa e tags', () => {
  assert.equal(precisaAvisoVet('<p>A <b>Vermifugação</b> do lote</p>'), true);
  assert.equal(precisaAvisoVet('Aplicação de VACINA'), true);
  assert.equal(precisaAvisoVet('Como pesar cordeiros'), false);
});

test('validarPost aponta cada erro', () => {
  const ok = { slug: 'como-pesar-cordeiros', data: '2026-10-27', tipo: 'guia', titulo: 'Como pesar cordeiros', descricao: 'x'.repeat(100), palavraChave: 'pesar cordeiros', fontes: [{ titulo: 'Embrapa', url: 'https://www.embrapa.br/' }] };
  assert.deepEqual(validarPost(ok), []);
  assert.equal(validarPost({ ...ok, slug: 'Com Espaço' }).length, 1);
  assert.equal(validarPost({ ...ok, data: '27/10/2026' }).length, 1);
  assert.equal(validarPost({ ...ok, tipo: 'opiniao' }).length, 1);
  assert.equal(validarPost({ ...ok, titulo: 't'.repeat(71) }).length, 1);
  assert.equal(validarPost({ ...ok, descricao: 'curta' }).length, 1);
  assert.equal(validarPost({ ...ok, fontes: [] }).length, 1);
  assert.equal(validarPost({ ...ok, fontes: [{ titulo: 'x', url: 'http://a.com' }] }).length, 1);
});

test('escapeHtml', () => assert.equal(escapeHtml(`"A" & <b>'`), '&quot;A&quot; &amp; &lt;b&gt;&#39;'));
