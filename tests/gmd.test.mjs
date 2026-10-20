import test from 'node:test';
import assert from 'node:assert/strict';
import { parseWeight, daysBetween, computeGmd } from '../gmd.js';

test('peso aceita vírgula ou ponto e recusa vazio, zero e texto', () => {
  assert.equal(parseWeight('32,5'), 32.5);
  assert.equal(parseWeight(' 38.5 '), 38.5);
  assert.equal(parseWeight('38'), 38);
  assert.equal(parseWeight(''), null);
  assert.equal(parseWeight('0'), null);
  assert.equal(parseWeight('-3'), null);
  assert.equal(parseWeight('abc'), null);
});

test('dias entre datas do campo date, sem erro de fuso ou horário de verão', () => {
  assert.equal(daysBetween('2026-09-01', '2026-10-01'), 30);
  assert.equal(daysBetween('2026-10-01', '2026-10-02'), 1);
  assert.equal(daysBetween('2026-02-01', '2026-03-01'), 28);
  assert.equal(daysBetween('', '2026-03-01'), null);
});

test('exemplo da página: 32 kg para 38,5 kg em 30 dias dá 217 g/dia', () => {
  assert.deepEqual(computeGmd({ pesoInicial: '32', dataInicial: '2026-09-01', pesoFinal: '38,5', dataFinal: '2026-10-01' }),
    { ok: true, dias: 30, ganhoKg: 6.5, gmd: 217 });
});

test('perda de peso vem negativa, não como erro', () => {
  assert.deepEqual(computeGmd({ pesoInicial: '40', dataInicial: '2026-09-01', pesoFinal: '38,8', dataFinal: '2026-09-11' }),
    { ok: true, dias: 10, ganhoKg: -1.2, gmd: -120 });
});

test('erros explicam o que corrigir', () => {
  assert.deepEqual(computeGmd({ pesoInicial: '', dataInicial: '2026-09-01', pesoFinal: '38', dataFinal: '2026-10-01' }), { ok: false, erro: 'Informe o peso inicial em kg.' });
  assert.deepEqual(computeGmd({ pesoInicial: '32', dataInicial: '2026-09-01', pesoFinal: 'x', dataFinal: '2026-10-01' }), { ok: false, erro: 'Informe o peso final em kg.' });
  assert.deepEqual(computeGmd({ pesoInicial: '32', dataInicial: '', pesoFinal: '38', dataFinal: '2026-10-01' }), { ok: false, erro: 'Informe as duas datas de pesagem.' });
  assert.deepEqual(computeGmd({ pesoInicial: '32', dataInicial: '2026-10-01', pesoFinal: '38', dataFinal: '2026-10-01' }), { ok: false, erro: 'A pesagem final precisa ser depois da inicial.' });
  assert.deepEqual(computeGmd({ pesoInicial: '32', dataInicial: '2026-10-05', pesoFinal: '38', dataFinal: '2026-10-01' }), { ok: false, erro: 'A pesagem final precisa ser depois da inicial.' });
});
