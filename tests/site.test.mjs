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
  assert.match(page, /<h1[^>]*>\s*<span class="eyebrow"[^>]*>Ovis · Controle do rebanho ovino no celular/);
  assert.match(page, /produtores de ovinos e equipes de fazenda/);
  assert.match(page, /assets\/ovis-ficha\.webp/);
  assert.match(page, /assets\/sheep-flock\.webp/);
  assert.match(page, /<picture><source media="\(max-width: 760px\)" srcset="assets\/video\/hero-720\.avif[^"]*" type="image\/avif"><img src="assets\/video\/hero\.avif[^"]*"[^>]*fetchpriority="high"><\/picture><video autoplay muted loop playsinline/);
  for (const [attr, file] of [['data-src', 'hero.mp4'], ['data-src-av1', 'hero-av1.mp4'], ['data-src-hevc', 'hero-hevc.mp4']]) assert.match(page, new RegExp(`${attr}="assets/video/${file}`));
  assert.doesNotMatch(page, /hero-mobile/, 'celular fica só com a foto');
  for (const f of ['hero.mp4', 'hero-av1.mp4', 'hero-hevc.mp4', 'hero.avif', 'hero-720.avif']) assert.ok(existsSync(new URL(`../assets/video/${f}`, import.meta.url)));
  assert.match(css, /--accent:/);
  // Texto secundário com contraste WCAG AA (4,5:1) nos fundos escuros do site.
  const lum = (hex) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const token = (name) => css.match(new RegExp(`--${name}: (#[0-9a-f]{6})`))[1];
  for (const bg of ['bg', 'bg-2', 'surface']) assert.ok(contrast(token('text-3'), token(bg)) >= 4.5, `--text-3 sobre --${bg}`);
  assert.ok(existsSync(new URL('../assets/ovis-ficha.webp', import.meta.url)));
  assert.doesNotMatch(page, /Subscrr|Apple Watch|subscriptions/);
});

test('composição escura com tipografia de impacto e animações acessíveis', () => {
  const script = readFileSync(new URL('../script.js', import.meta.url), 'utf8');
  assert.match(page, /href="site\.css(\?v=\d+)?"/);
  assert.doesNotMatch(page, /fonts\.googleapis|fonts\.gstatic/, 'fontes hospedadas no próprio site');
  assert.match(css, /@font-face \{ font-family: 'Bebas Neue'/);
  assert.match(css, /\.hero-title \.line > span \{ white-space: nowrap; \}/, 'título não quebra linha enquanto a fonte carrega');
  for (const face of ['Impact', 'Narrow', 'Arial']) assert.match(css, new RegExp(`font-family: 'Bebas Neue Reserva ${face}'; src: local\\([^;]+; size-adjust: [0-9.]+%`));
  assert.match(css, /--display: 'Bebas Neue', 'Bebas Neue Reserva Impact'/);
  assert.match(css, /@font-face \{ font-family: 'Inter'[^}]*font-weight: 400 700/);
  for (const f of ['bebas-neue-latin', 'bebas-neue-latin-ext', 'inter-latin', 'inter-latin-ext']) assert.ok(existsSync(new URL(`../assets/fonts/${f}.woff2`, import.meta.url)));
  assert.match(script, /matchMedia\('\(max-width: 760px\)'\)\.matches\) return/, 'sem vídeo no celular');
  assert.ok(script.indexOf('av01.0.08M.08') > 0 && script.indexOf('av01.0.08M.08') < script.indexOf('hvc1.1.6.L120.90'), 'AV1 antes do HEVC');
  assert.match(script, /canPlayType\('video\/mp4; codecs="av01/);
  assert.match(script, /addEventListener\('load', startHeroVideo/, 'vídeo do hero só baixa depois do load');
  assert.match(script, /navigator\.connection\?\.saveData/, 'economia de dados fica só com o poster');
  assert.match(page, /src="script\.js\?v=\d+"/, "script versionado evita cache de versão antiga");
  // Os módulos importados pelo script entram na fila junto com ele, sem esperar o script baixar.
  const version = (re) => (page.match(re) || [])[0];
  assert.equal(version(/modulepreload" href="script\.js\?v=\d+/)?.split('href="')[1], version(/src="script\.js\?v=\d+/)?.split('src="')[1], 'modulepreload na mesma versão do script');
  assert.match(page, /<link rel="modulepreload" href="pricing\.js">/);
  const leadImport = script.match(/from '\.\/(lead\.js[^']*)'/)[1];
  assert.ok(page.includes(`<link rel="modulepreload" href="${leadImport}">`), `modulepreload de ${leadImport}`);
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
  for (const p of ['Teste', 'Plus', 'Pro', 'Demonstração']) assert.match(page, new RegExp(`data-lead="${p}"`));
  assert.match(page, /<dialog id="lead-dialog"/);
  for (const n of ['nome', 'whatsapp', 'fazenda', 'rebanho']) assert.match(page, new RegExp(`name="${n}"[^>]*required`));
  assert.match(page, /<input name="rebanho" type="text" inputmode="numeric"/);
  assert.doesNotMatch(page, /<select name="rebanho"/);
  assert.match(page, /Usamos esses dados só para falar com você sobre o Ovis/);
  assert.match(page, /<p class="lead-error" data-lead-error role="alert" hidden>/);
  assert.match(script, /setAttribute\('aria-invalid', 'true'\)/, 'aria-invalid vazio vale false para leitor de tela');
  assert.doesNotMatch(script, /if \(field\('site'\)\) return/, 'campo isca não pode travar o envio no navegador');
  assert.doesNotMatch(page, /nada é cobrado hoje/);
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
  assert.match(page, /<link rel="canonical" href="https:\/\/ovisapp\.com\.br\/">/);
  assert.equal(readFileSync(new URL('../CNAME', import.meta.url), 'utf8').trim(), 'ovisapp.com.br');
  assert.doesNotMatch(page + readFileSync(new URL('../desktop/index.html', import.meta.url), 'utf8'), /github\.io|\/ovis-site\//, 'domínio próprio na raiz, sem o caminho antigo');
  assert.match(page, /<meta property="og:image"/);
  assert.match(page, /type="application\/ld\+json"/);
  assert.match(sitemap, /<loc>https:\/\/ovisapp\.com\.br\/<\/loc>/);
  assert.doesNotMatch(page, /aggregateRating|"review"/, 'sem avaliações inventadas');
  const ld = JSON.parse(page.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  const types = ld['@graph'].map((n) => n['@type']);
  assert.deepEqual(types, ['WebSite', 'Organization', 'SoftwareApplication']);
  const app = ld['@graph'][2];
  assert.equal(app.applicationCategory, 'BusinessApplication');
  assert.deepEqual(app.offers.map((o) => [o.name, o.price, o.priceCurrency]), [['Plus', '309.90', 'BRL'], ['Pro', '359.90', 'BRL']]);
  for (const offer of app.offers) assert.deepEqual([offer.priceSpecification['@type'], offer.priceSpecification.unitCode, offer.priceSpecification.minPrice], ['UnitPriceSpecification', 'MON', offer.price]);
  const description = page.match(/<meta name="description" content="([^"]*)">/)[1];
  assert.ok(description.length <= 160, `descrição com ${description.length} caracteres`);
  assert.match(description, /14 dias grátis/);
  assert.match(page, /<link rel="apple-touch-icon" href="assets\/apple-touch-icon\.png">/);
  assert.match(sitemap, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
  const llms = readFileSync(new URL('../llms.txt', import.meta.url), 'utf8');
  assert.match(llms, /^# Ovis$/m, 'llms.txt com H1');
  assert.match(llms, /^> /m, 'llms.txt com resumo em citação');
  for (const url of ['https://ovisapp.com.br/', 'https://ovisapp.com.br/sobre/', 'https://ovisapp.com.br/privacidade/']) assert.ok(llms.includes(`](${url})`), `link Markdown para ${url}`);
});

test('páginas de confiança: privacidade e sobre', () => {
  const priv = readFileSync(new URL('../privacidade/index.html', import.meta.url), 'utf8');
  const sobre = readFileSync(new URL('../sobre/index.html', import.meta.url), 'utf8');
  for (const html of [priv, sobre]) {
    assert.match(html, /65\.981\.257\/0001-17/);
    assert.match(html, /São Leopoldo, RS/);
    assert.match(html, /<link rel="canonical" href="https:\/\/ovisapp\.com\.br\/(privacidade|sobre)\/">/);
    assert.match(html, /href="\/site\.css\?v=\d+"/);
  }
  assert.match(priv, /LGPD/);
  for (const dado of ['nome', 'número de WhatsApp', 'nome da fazenda', 'quantos animais']) assert.ok(priv.includes(dado), dado);
  for (const [nome, cargo] of [['Carlos Eduardo (Cadu)', 'CEO'], ['Dartagnan Romann', 'Co-CTO'], ['Lucas Moraes', 'Co-CTO'], ['Lucas Pereira', 'CCO'], ['Gabriel Santanna', 'CCO']]) assert.match(sobre, new RegExp(`<li>${nome.replace(/[()]/g, '\\$&')}<span>${cargo}`), nome);
  assert.match(page, /href="privacidade\/"/);
  assert.match(page, /href="sobre\/"/);
  const ld = JSON.parse(page.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.deepEqual(ld['@graph'][1].sameAs, ['https://www.instagram.com/ovis.gestao/']);
  assert.equal(ld['@graph'][1].taxID, '65.981.257/0001-17');
  const sitemap = readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
  for (const p of ['sobre', 'privacidade']) assert.match(sitemap, new RegExp(`<loc>https://ovisapp\\.com\\.br/${p}/</loc>`));
});

test('material interno e demonstração não são publicados', () => {
  const config = readFileSync(new URL('../_config.yml', import.meta.url), 'utf8');
  for (const path of ['desktop', 'docs', 'tests', 'scripts', 'vendor', 'README.md', 'checkout-links.json']) assert.match(config, new RegExp(`^  - ${path.replace('.', '\\.')}$`, 'm'), path);
  assert.ok(!existsSync(new URL('../.nojekyll', import.meta.url)), '.nojekyll desligaria o exclude');
  assert.doesNotMatch(page, /href="[^"]*desktop/);
  const sitemap = readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
  assert.doesNotMatch(sitemap, /desktop|docs/);
});

test('voltar ao topo aponta para um elemento que rola, e sem créditos de fotografia', () => {
  // Âncora em elemento position: fixed não rola a página; o alvo de #inicio é a seção do topo.
  assert.match(page, /<section id="inicio" class="hero"/);
  assert.doesNotMatch(page, /<header[^>]*id="inicio"/);
  assert.match(page, /<a class="to-top" href="#inicio"/);
  assert.doesNotMatch(page, /Fotografia:|unsplash\.com/);
});

test('calculadora de GMD publicada e ligada ao site', () => {
  const calc = readFileSync(new URL('../calculadora-gmd/index.html', import.meta.url), 'utf8');
  assert.match(calc, /<title>Calculadora de GMD de cordeiros e ovinos \| Ovis<\/title>/);
  assert.match(calc, /<link rel="canonical" href="https:\/\/ovisapp\.com\.br\/calculadora-gmd\/">/);
  for (const n of ['pesoInicial', 'dataInicial', 'pesoFinal', 'dataFinal']) assert.match(calc, new RegExp(`name="${n}"`));
  assert.match(calc, /import \{ computeGmd \} from '\/gmd\.js'/);
  assert.match(calc, /217 g por dia/);
  assert.match(calc, /"@type":"BreadcrumbList"/);
  assert.match(calc, /<h1[^>]*>Calculadora de GMD<span class="h1-sub">Ganho médio diário/);
  assert.match(calc, /"@type":"WebApplication"[^}]*"isAccessibleForFree":true/);
  assert.match(calc, /"offers":\{"@type":"Offer","price":"0","priceCurrency":"BRL"\}/);
  for (const f of ['../calculadora-gmd/index.html', '../sobre/index.html', '../privacidade/index.html']) {
    const html = readFileSync(new URL(f, import.meta.url), 'utf8');
    const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)[1];
    assert.ok(html.includes(`<meta property="og:url" content="${canonical}">`), `og:url igual ao canonical em ${f}`);
    for (const tag of ['og:title', 'og:description', 'og:image']) assert.match(html, new RegExp(`<meta property="${tag}" content="[^"]+">`), `${tag} em ${f}`);
  }
  assert.match(page, /href="calculadora-gmd\/"/);
  assert.match(readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8'), /<loc>https:\/\/ovisapp\.com\.br\/calculadora-gmd\/<\/loc>/);
  assert.ok(readFileSync(new URL('../llms.txt', import.meta.url), 'utf8').includes('](https://ovisapp.com.br/calculadora-gmd/)'));
});

