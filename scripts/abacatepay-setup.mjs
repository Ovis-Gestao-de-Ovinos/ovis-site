// Cria (ou reaproveita) os produtos e checkouts de assinatura da Ovis na AbacatePay
// e grava os links públicos em checkout-links.json. Rode de novo quando mudar preço ou URL.
//
//   ABACATEPAY_API_KEY=abc_dev_... node scripts/abacatepay-setup.mjs
//
// A chave fica só no terminal ou no .env (ignorado pelo git); o site recebe apenas os links.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { subscriptionProducts } from '../pricing.js';

const API = process.env.ABACATEPAY_API_URL ?? 'https://api.abacatepay.com/v2';
const SITE = process.env.OVIS_SITE_URL ?? 'https://ovis-gestao-de-ovinos.github.io/ovis-site/';
const OUT = new URL('../checkout-links.json', import.meta.url);

function loadKey() {
  if (process.env.ABACATEPAY_API_KEY) return process.env.ABACATEPAY_API_KEY;
  const env = new URL('../.env', import.meta.url);
  if (existsSync(env)) {
    const line = readFileSync(env, 'utf8').split('\n').find((l) => l.startsWith('ABACATEPAY_API_KEY='));
    if (line) return line.slice('ABACATEPAY_API_KEY='.length).trim().replace(/^["']|["']$/g, '');
  }
  throw new Error('Defina ABACATEPAY_API_KEY no ambiente ou no arquivo .env.');
}

const key = loadKey();

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(`${method} ${path} → HTTP ${res.status}: ${JSON.stringify(json.error ?? json)}`);
  }
  return json.data;
}

const list = (data) => (Array.isArray(data) ? data : data?.items ?? data?.data ?? []);

async function ensureProduct(p) {
  const found = list(await api('GET', `/products/list?externalId=${encodeURIComponent(p.externalId)}`))
    .find((item) => item.externalId === p.externalId && item.status !== 'INACTIVE');
  if (found) {
    if (found.price !== p.price || found.cycle !== p.cycle || found.trialDays !== p.trialDays) {
      throw new Error(`Produto ${p.externalId} já existe com preço/ciclo/teste diferentes. Ajuste no dashboard ou use outro externalId.`);
    }
    return { ...found, reused: true };
  }
  const { plan, period, ...body } = p;
  return api('POST', '/products/create', body);
}

// Checkout de assinatura é de uso único na prática: depois do primeiro pagamento fica PAID
// e a API devolve o mesmo checkout para o mesmo externalId. Por isso reaproveitamos só o
// checkout publicado que ainda está PENDING e criamos outro, com externalId novo, quando não.
const previous = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};

async function ensureCheckout(product, p) {
  const id = previous[p.plan]?.[p.period]?.split('/pay/')[1];
  if (id) {
    const current = await api('GET', `/subscriptions/checkouts/get?id=${encodeURIComponent(id)}`).catch(() => null);
    if (current?.status === 'PENDING') return { ...current, reused: true };
  }
  return api('POST', '/subscriptions/create', {
    items: [{ id: product.id, quantity: 1 }],
    externalId: `${p.externalId}-site-${Date.now()}`,
    methods: ['CARD'],
    returnUrl: `${SITE}#precos`,
    completionUrl: `${SITE}obrigado.html?plano=${p.plan}&periodo=${p.period}`,
    metadata: { plan: p.plan, period: p.period, source: 'site' },
  });
}

const links = { devMode: null, Plus: {}, Pro: {} };
for (const p of subscriptionProducts()) {
  const product = await ensureProduct(p);
  const checkout = await ensureCheckout(product, p);
  links[p.plan][p.period] = checkout.url;
  links.devMode = links.devMode ?? Boolean(checkout.devMode ?? product.devMode);
  console.log(`${p.name.padEnd(18)} produto ${product.id}${product.reused ? ' (existente)' : ''} · checkout ${checkout.id}${checkout.reused ? ' (existente)' : ''}`);
}

writeFileSync(OUT, `${JSON.stringify(links, null, 2)}\n`);
console.log(`\nLinks gravados em checkout-links.json (${links.devMode ? 'modo de teste' : 'produção'}).`);
