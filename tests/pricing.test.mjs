import test from 'node:test';
import assert from 'node:assert/strict';
import { PLANS, money } from '../pricing.js';

test('preços de entrada divulgam somente as condições aprovadas', () => {
  assert.deepEqual(PLANS.map(({ name, fromCents }) => [name, fromCents]), [
    ['Plus', 30990],
    ['Pro', 35990],
  ]);
  assert.equal(money(PLANS[0].fromCents), 'R$ 309,90');
  assert.equal(money(PLANS[1].fromCents), 'R$ 359,90');
});

test('anual aplica 15% ao total de doze mensalidades, sem inventar faixas', () => {
  assert.equal(PLANS.every((plan) => !('maxAnimals' in plan)), true);
  assert.deepEqual(PLANS.map(({ annualCents }) => annualCents), [316098, 367098]);
});
