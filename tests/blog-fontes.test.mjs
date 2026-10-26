import test from 'node:test';
import assert from 'node:assert/strict';
import { checarUrl } from '../scripts/blog-fontes.mjs';

// fetch falso que devolve as respostas em ordem; Error na lista vira erro de rede.
const falso = (respostas) => {
  const chamadas = [];
  const fn = async (url, opts) => {
    chamadas.push({ url, opts });
    const r = respostas.shift();
    if (r instanceof Error) throw r;
    return r;
  };
  return { fn, chamadas };
};

test('redirecionamento que termina em 200 conta como ok', async () => {
  const { fn, chamadas } = falso([{ status: 200, redirected: true }]);
  assert.deepEqual(await checarUrl('http://www.embrapa.br/x', fn, 0), { url: 'http://www.embrapa.br/x', ok: true, status: 200 });
  assert.equal(chamadas.length, 1);
  assert.equal(chamadas[0].opts.redirect, 'follow');
});

test('403 duas vezes falha depois de tentar de novo', async () => {
  const { fn, chamadas } = falso([{ status: 403 }, { status: 403 }]);
  assert.deepEqual(await checarUrl('https://a.com', fn, 0), { url: 'https://a.com', ok: false, status: 403 });
  assert.equal(chamadas.length, 2);
});

test('erro de rede e depois 200 fica ok', async () => {
  const { fn, chamadas } = falso([new Error('ECONNRESET'), { status: 200 }]);
  assert.equal((await checarUrl('https://a.com', fn, 0)).ok, true);
  assert.equal(chamadas.length, 2);
});

test('erro de rede duas vezes falha sem status', async () => {
  const { fn } = falso([new Error('x'), new Error('x')]);
  assert.deepEqual(await checarUrl('https://a.com', fn, 0), { url: 'https://a.com', ok: false, status: null });
});
