import test from 'node:test';
import assert from 'node:assert/strict';
import { TIERS, PLAN_NAMES, tierFor, money } from '../pricing.js';

const cases = [[1, 30], [30, 30], [31, 50], [50, 50], [51, 100], [100, 100], [101, 250], [250, 250], [251, 500], [500, 500]];
for (const [count, expectedMax] of cases) {
  test(`rebanho ${count} usa a faixa até ${expectedMax}`, () => assert.equal(tierFor(count).max, expectedMax));
}
test('quantidades fora da tabela não recebem preço inventado', () => {
  for (const count of [0, -1, 10.5, 501, NaN]) assert.equal(tierFor(count), null);
});
test('todos os 15 preços anuais da tabela têm desconto de 15%', () => {
  assert.equal(TIERS.length, 5);
  assert.deepEqual(PLAN_NAMES, ['Basic', 'Plus', 'Pro']);
  TIERS.forEach(({ plans }) => {
    assert.equal(plans.length, 3);
    plans.forEach(([monthly, yearly, equivalent]) => {
      assert.equal(yearly * 10, monthly * 102);
      assert.equal(equivalent, Math.round(yearly / 12));
    });
  });
});
test('valores limítrofes da imagem', () => {
  assert.deepEqual(tierFor(30).plans[0], [25990, 265098, 22092]);
  assert.deepEqual(tierFor(500).plans[2], [109990, 1121898, 93492]);
  assert.equal(money(265098), 'R$ 2.650,98');
});
