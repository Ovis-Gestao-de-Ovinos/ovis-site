import test from 'node:test';
import assert from 'node:assert/strict';
import { OVIS_WHATSAPP, normalizeHerd, normalizePhone, formatPhone, validateLead, leadMessage, whatsappUrl, saveLead } from '../lead.js';

const ok = { nome: 'João', whatsapp: '51984931844', fazenda: 'Boa Vista', rebanho: '300', plano: 'Plus', periodo: 'mensal' };

test('rebanho aceita número com ou sem ponto de milhar', () => {
  assert.equal(normalizeHerd('300'), 300);
  assert.equal(normalizeHerd(' 1.200 '), 1200);
  assert.equal(normalizeHerd('1200 cabeças'), 1200);
  assert.equal(normalizeHerd('0'), null);
  assert.equal(normalizeHerd(''), null);
  assert.equal(normalizeHerd('muitas'), null);
});

test('WhatsApp da Ovis', () => {
  assert.equal(OVIS_WHATSAPP, '5551984931844');
});

test('telefone aceita máscara, +55 e espaços', () => {
  assert.equal(normalizePhone('(51) 98493-1844'), '51984931844');
  assert.equal(normalizePhone('+55 51 98493 1844'), '51984931844');
  assert.equal(normalizePhone('51 3333-4444'), '5133334444');
  assert.equal(normalizePhone('98493-1844'), null);
  assert.equal(normalizePhone('051 98493-1844'), '51984931844');
  assert.equal(normalizePhone('0 51 3333-4444'), '5133334444');
  assert.equal(normalizePhone(''), null);
  assert.equal(formatPhone('51984931844'), '(51) 98493-1844');
  assert.equal(formatPhone('5133334444'), '(51) 3333-4444');
});

test('campos obrigatórios, espaços não contam', () => {
  assert.deepEqual(validateLead({ nome: '  ', whatsapp: '123', fazenda: '', rebanho: 'x', plano: 'Plus', periodo: 'mensal' }),
    ['nome', 'whatsapp', 'fazenda', 'rebanho']);
  assert.deepEqual(validateLead(ok), []);
  assert.deepEqual(validateLead({ ...ok, whatsapp: '(51) 98493-1844' }), []);
});

test('mensagem do WhatsApp por plano e período', () => {
  assert.equal(leadMessage({ ...ok, plano: 'Teste' }),
    'Oi! Sou João, da fazenda Boa Vista. Temos 300 animais e quero começar o teste grátis.');
  assert.equal(leadMessage({ ...ok, plano: 'Teste', periodo: 'anual' }).includes('(anual)'), false);
  assert.match(leadMessage(ok), /quero conhecer o plano Plus\./);
  assert.match(leadMessage({ ...ok, rebanho: '1200' }), /Temos 1\.200 animais/);
  assert.match(leadMessage({ ...ok, rebanho: '1' }), /Temos 1 animal e/);
  assert.match(leadMessage({ ...ok, plano: 'Demonstração', periodo: 'anual' }), /quero ver uma demonstração do Ovis no computador\.$/);
  assert.match(leadMessage({ ...ok, plano: 'Pro', periodo: 'anual' }), /quero conhecer o plano Pro \(anual\)\./);
  assert.match(leadMessage({ ...ok, nome: '  João ', fazenda: ' Boa Vista  ' }), /^Oi! Sou João, da fazenda Boa Vista\./);
  assert.ok(whatsappUrl(ok).startsWith('https://wa.me/5551984931844?text=Oi!%20Sou%20Jo%C3%A3o'));
});

test('saveLead pula sem endpoint, falha sem rejeitar e respeita o tempo-limite', async () => {
  assert.equal(await saveLead(null, ok), 'skipped');
  assert.equal(await saveLead('', ok), 'skipped');
  assert.equal(await saveLead('https://x', ok, { fetchImpl: () => Promise.reject(new Error()) }), 'failed');
  const start = Date.now();
  assert.equal(await saveLead('https://x', ok, { fetchImpl: () => new Promise(() => {}), timeoutMs: 50 }), 'failed');
  assert.ok(Date.now() - start < 500);
  let sent;
  assert.equal(await saveLead('https://x', ok, { fetchImpl: (url, init) => { sent = { url, ...init }; return Promise.resolve({}); } }), 'saved');
  assert.equal(sent.url, 'https://x');
  assert.equal(sent.method, 'POST');
  assert.equal(sent.mode, 'no-cors');
  assert.equal(sent.keepalive, true);
  assert.equal(sent.headers['Content-Type'], 'text/plain;charset=utf-8');
  assert.deepEqual(JSON.parse(sent.body), { ...ok, whatsapp: '(51) 98493-1844', rebanho: 300 });
});

test('campo isca segue para a planilha, que descarta', async () => {
  let body;
  await saveLead('https://x', { ...ok, site: 'robô' }, { fetchImpl: (url, init) => { body = JSON.parse(init.body); return Promise.resolve({}); } });
  assert.equal(body.site, 'robô');
});
