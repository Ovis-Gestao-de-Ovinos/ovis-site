import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const page = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../site.css', import.meta.url), 'utf8');

for (const id of ['inicio', 'visao', 'produto', 'rotina', 'recursos', 'precos', 'perguntas', 'estado']) {
  test(`navegação tem seção ${id}`, () => assert.match(page, new RegExp(`id="${id}"`)));
}

test('página usa identidade Ovis e ativos próprios', () => {
  assert.match(page, /O quadro branco/);
  assert.match(page, /produtores de ovinos e equipes de fazenda/);
  assert.match(page, /assets\/ovis-ficha\.webp/);
  assert.match(page, /assets\/sheep-flock\.webp/);
  assert.match(page, /<video poster="assets\/video\/hero\.jpg[^"]*" autoplay muted loop playsinline/);
  assert.match(page, /data-src="assets\/video\/hero\.mp4[^"]*" data-src-mobile="assets\/video\/hero-mobile\.mp4/);
  for (const f of ['hero.mp4', 'hero-mobile.mp4', 'hero.jpg']) assert.ok(existsSync(new URL(`../assets/video/${f}`, import.meta.url)));
  assert.match(css, /--accent:/);
  assert.ok(existsSync(new URL('../assets/ovis-ficha.webp', import.meta.url)));
  assert.doesNotMatch(page, /Subscrr|Apple Watch|subscriptions/);
});

test('composição escura com tipografia de impacto e animações acessíveis', () => {
  const script = readFileSync(new URL('../script.js', import.meta.url), 'utf8');
  assert.match(page, /href="site\.css(\?v=\d+)?"/);
  assert.match(page, /Bebas\+Neue/);
  assert.match(page, /src="script\.js\?v=\d+"/, "script versionado evita cache de versão antiga");
  assert.match(page, /data-scrub/);
  assert.match(page, /data-phone-scroll/);
  assert.match(css, /\.motion-on \[data-lines\]/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /@media \(max-width: 640px\)/);
  assert.match(script, /prefers-reduced-motion/);
  for (const old of ['styles.css', 'landing.css', 'redesign.css']) {
    assert.doesNotMatch(page, new RegExp(old.replace('.', '\\.')));
  }
});

test('planos novos substituem tabela antiga sem promessa de compra ou desconto', () => {
  assert.match(page, /14 dias grátis/);
  assert.match(page, /R\$ 309,90/);
  assert.match(page, /R\$ 359,90/);
  assert.match(page, /a partir de/);
  assert.match(page, /15% de desconto/);
  assert.match(page, /Mensal/);
  assert.match(page, /Anual/);
  assert.doesNotMatch(page, /Basic|R\$ 259,90|herd-size|price-results/i);
});

test('contratação passa por formulário, planilha e WhatsApp', () => {
  const script = readFileSync(new URL('../script.js', import.meta.url), 'utf8');
  for (const p of ['Teste', 'Plus', 'Pro']) assert.match(page, new RegExp(`data-lead="${p}"`));
  assert.match(page, /<dialog id="lead-dialog"/);
  for (const n of ['nome', 'whatsapp', 'fazenda', 'rebanho']) assert.match(page, new RegExp(`name="${n}"[^>]*required`));
  assert.match(page, /Usamos esses dados só para falar com você sobre o Ovis/);
  assert.match(script, /lead-config\.json/);
  assert.doesNotMatch(page + script, /AbacatePay|cobrança automática|checkout-links/);
  assert.match(page, /dados simulados/i);
  assert.match(page, /confirmado na conversa/i);
  assert.doesNotMatch(page, /Mais escolhido/, 'sem clientes ainda, nenhum plano é o mais escolhido');
  assert.doesNotMatch(page + script, /abc_(dev|prod)_|sk_/, 'chave de API nunca vai para o site');
  assert.match(readFileSync(new URL('../.gitignore', import.meta.url), 'utf8'), /^\.env$/m);
  assert.ok(existsSync(new URL('../obrigado.html', import.meta.url)));
});

test('canais de atendimento para dúvidas e cancelamento', () => {
  const thanks = readFileSync(new URL('../obrigado.html', import.meta.url), 'utf8');
  for (const html of [page, thanks]) {
    assert.match(html, /href="https:\/\/wa\.me\/5551984931844"/);
    assert.match(html, /href="mailto:ovisfinanceiro@gmail\.com"/);
  }
  assert.match(page, /Como cancelo/);
});

test('SEO permanece coerente com a prévia', () => {
  const sitemap = readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
  assert.match(page, /<html lang="pt-BR">/);
  assert.match(page, /<link rel="canonical" href="https:\/\/ovis-gestao-de-ovinos\.github\.io\/ovis-site\/">/);
  assert.match(page, /<meta property="og:image"/);
  assert.match(page, /type="application\/ld\+json"/);
  assert.match(sitemap, /ovis-site\//);
  assert.doesNotMatch(page, /aggregateRating|"@type":"SoftwareApplication"/);
});
