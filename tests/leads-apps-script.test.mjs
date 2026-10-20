import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Roda o Apps Script em Node com uma planilha falsa.
function loadScript() {
  const rows = [];
  const sheet = { getLastRow: () => rows.length, appendRow: (row) => rows.push([...row]) };
  const context = {
    rows,
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => sheet, insertSheet: () => sheet }) },
    ContentService: { createTextOutput: (text) => ({ text }) },
  };
  vm.runInNewContext(readFileSync(new URL('../scripts/leads-apps-script.gs', import.meta.url), 'utf8'), context);
  return context;
}
const post = (lead, origem = 'https://site/') => ({ postData: { contents: JSON.stringify(lead) }, parameter: { origem } });
const lead = { nome: 'João', whatsapp: '(51) 98493-1844', fazenda: 'Boa Vista', rebanho: '101 a 300', plano: 'Pro', periodo: 'anual' };

test('primeiro contato cria o cabeçalho e grava a linha', () => {
  const gs = loadScript();
  assert.equal(gs.doPost(post(lead)).text, 'ok');
  assert.deepEqual(gs.rows[0], ['Data e hora', 'Nome', 'WhatsApp', 'Fazenda', 'Rebanho', 'Plano', 'Período', 'Página de origem']);
  assert.ok(gs.rows[1][0] instanceof Date || typeof gs.rows[1][0]?.getTime === 'function');
  assert.deepEqual(gs.rows[1].slice(1), ['João', '(51) 98493-1844', 'Boa Vista', '101 a 300', 'Pro', 'anual', 'https://site/']);
});

test('campo isca preenchido não grava nada', () => {
  const gs = loadScript();
  gs.doPost(post({ ...lead, site: 'spam' }));
  assert.equal(gs.rows.length, 0);
});

test('texto que viraria fórmula entra como texto', () => {
  const gs = loadScript();
  gs.doPost(post({ ...lead, nome: '=HYPERLINK("x")', fazenda: '+1', rebanho: '-2', plano: '@a' }, '=1'));
  assert.deepEqual(gs.rows[1].slice(1, 6), ["'=HYPERLINK(\"x\")", '(51) 98493-1844', "'+1", "'-2", "'@a"]);
  assert.equal(gs.rows[1][7], "'=1");
});
