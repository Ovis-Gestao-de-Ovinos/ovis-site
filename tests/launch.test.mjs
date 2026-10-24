import test from 'node:test';
import assert from 'node:assert/strict';
import { LAUNCH_AT, timeLeft } from '../launch.js';

test('lançamento é 14/11/2026 à meia-noite de Brasília', () => {
  assert.equal(new Date(LAUNCH_AT).toISOString(), '2026-11-14T03:00:00.000Z');
});

test('contagem em dias, horas, minutos e segundos', () => {
  const second = 1000;
  const day = 86400 * second;
  assert.deepEqual(timeLeft(LAUNCH_AT - (20 * day + 3 * 3600 * second + 4 * 60 * second + 5 * second)), { days: 20, hours: 3, minutes: 4, seconds: 5 });
  // Fração de segundo arredonda para cima: o zero só aparece no instante do lançamento.
  assert.deepEqual(timeLeft(LAUNCH_AT - 1), { days: 0, hours: 0, minutes: 0, seconds: 1 });
});

test('depois do lançamento não há contagem', () => {
  assert.equal(timeLeft(LAUNCH_AT), null);
  assert.equal(timeLeft(LAUNCH_AT + 5000), null);
});
