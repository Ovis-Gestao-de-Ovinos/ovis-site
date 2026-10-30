import test from 'node:test';
import assert from 'node:assert/strict';
import { deveRodarHoje, precisaAvisoVet, validarPost, escapeHtml, renderPost, renderIndex, atualizarSitemap, tempoLeitura, fotoDoPost } from '../scripts/blog-lib.mjs';

test('deveRodarHoje: sem início publica', () => assert.equal(deveRodarHoje('2026-10-27', { inicio: null }), true));

test('deveRodarHoje: 14 dias diários', () => {
  assert.equal(deveRodarHoje('2026-10-27', { inicio: '2026-10-27' }), true);
  assert.equal(deveRodarHoje('2026-11-09', { inicio: '2026-10-27' }), true); // dia 13, segunda
});

test('deveRodarHoje: depois, só terça e sexta', () => {
  assert.equal(deveRodarHoje('2026-11-10', { inicio: '2026-10-27' }), true); // terça
  assert.equal(deveRodarHoje('2026-11-11', { inicio: '2026-10-27' }), false); // quarta
  assert.equal(deveRodarHoje('2026-11-13', { inicio: '2026-10-27' }), true); // sexta
  assert.equal(deveRodarHoje('2026-11-15', { inicio: '2026-10-27' }), false); // domingo
});

test('precisaAvisoVet ignora acento, caixa e tags', () => {
  assert.equal(precisaAvisoVet('<p>A <b>Vermifugação</b> do lote</p>'), true);
  assert.equal(precisaAvisoVet('Aplicação de VACINA'), true);
  assert.equal(precisaAvisoVet('Como pesar cordeiros'), false);
});

test('validarPost aponta cada erro', () => {
  const ok = { slug: 'como-pesar-cordeiros', data: '2026-10-27', tipo: 'guia', titulo: 'Como pesar cordeiros', descricao: 'x'.repeat(100), palavraChave: 'pesar cordeiros', fontes: [{ titulo: 'Embrapa', url: 'https://www.embrapa.br/' }] };
  assert.deepEqual(validarPost(ok), []);
  assert.equal(validarPost({ ...ok, slug: 'Com Espaço' }).length, 1);
  assert.equal(validarPost({ ...ok, data: '27/10/2026' }).length, 1);
  assert.equal(validarPost({ ...ok, tipo: 'opiniao' }).length, 1);
  assert.equal(validarPost({ ...ok, titulo: 't'.repeat(71) }).length, 1);
  assert.equal(validarPost({ ...ok, descricao: 'curta' }).length, 1);
  assert.equal(validarPost({ ...ok, fontes: [] }).length, 1);
  assert.equal(validarPost({ ...ok, fontes: [{ titulo: 'x', url: 'http://a.com' }] }).length, 1);
});

test('escapeHtml', () => assert.equal(escapeHtml(`"A" & <b>'`), '&quot;A&quot; &amp; &lt;b&gt;&#39;'));

const post = { slug: 'vermifugacao-de-ovinos', data: '2026-10-27', tipo: 'guia', titulo: 'Vermifugação de ovinos: "quando" & como', descricao: 'd'.repeat(100), palavraChave: 'vermifugação', fontes: [{ titulo: 'Embrapa', url: 'https://www.embrapa.br/x' }] };

test('renderPost: SEO, escape e JSON-LD', () => {
  const html = renderPost(post, '<p>Vermifugar o lote.</p>');
  assert.match(html, /<link rel="canonical" href="https:\/\/ovisapp\.com\.br\/blog\/vermifugacao-de-ovinos\/">/);
  assert.match(html, /<meta property="og:url" content="https:\/\/ovisapp\.com\.br\/blog\/vermifugacao-de-ovinos\/">/);
  assert.match(html, /<title>Vermifugação de ovinos: &quot;quando&quot; &amp; como \| Blog da Ovis<\/title>/);
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  const art = ld['@graph'].find((n) => n['@type'] === 'BlogPosting');
  assert.equal(art.headline, post.titulo);
  assert.equal(art.datePublished, '2026-10-27');
  assert.equal(art.publisher['@id'], 'https://ovisapp.com.br/#organization');
  assert.deepEqual(art.citation, ['https://www.embrapa.br/x']);
  assert.ok(ld['@graph'].some((n) => n['@type'] === 'BreadcrumbList'));
  assert.match(html, /Consulte um médico veterinário antes de aplicar qualquer medicamento ou tratamento\./);
  assert.match(html, /<time datetime="2026-10-27">27 de outubro de 2026<\/time>/);
  assert.match(html, /<h2>Fontes<\/h2>/);
  assert.match(html, /href="\/#lancamento"/);
  assert.match(html, /href="\/blog\/"/);
});

test('renderPost: notícia vira NewsArticle e sem aviso quando não precisa', () => {
  const html = renderPost({ ...post, tipo: 'noticia', titulo: 'Feira de ovinos em Esteio' }, '<p>Feira.</p>');
  assert.match(html, /"@type":"NewsArticle"/);
  assert.doesNotMatch(html, /aviso-vet/);
});

test('renderIndex ordena por data e, no empate, o último do registro primeiro', () => {
  const a = { ...post, slug: 'a', data: '2026-10-27' }, b = { ...post, slug: 'b', data: '2026-10-28' }, c = { ...post, slug: 'c', data: '2026-10-28' };
  const html = renderIndex([a, b, c]);
  assert.deepEqual([...html.matchAll(/<a href="\/blog\/([a-z]+)\/"/g)].map((m) => m[1]), ['c', 'b', 'a']);
  assert.match(html, /<link rel="canonical" href="https:\/\/ovisapp\.com\.br\/blog\/">/);
  assert.match(renderIndex([]), /Os primeiros posts chegam em breve\./);
});

test('atualizarSitemap substitui só as entradas do blog', () => {
  const xml = '<urlset>\n  <url>\n    <loc>https://ovisapp.com.br/</loc>\n    <lastmod>2026-10-19</lastmod>\n  </url>\n  <url>\n    <loc>https://ovisapp.com.br/blog/velho/</loc>\n    <lastmod>2026-01-01</lastmod>\n  </url>\n</urlset>\n';
  const out = atualizarSitemap(xml, [post], '2026-10-27');
  assert.match(out, /<loc>https:\/\/ovisapp\.com\.br\/<\/loc>/);
  assert.doesNotMatch(out, /blog\/velho/);
  assert.match(out, /<loc>https:\/\/ovisapp\.com\.br\/blog\/<\/loc>\s*<lastmod>2026-10-27<\/lastmod>/);
  assert.match(out, /<loc>https:\/\/ovisapp\.com\.br\/blog\/vermifugacao-de-ovinos\/<\/loc>/);
  assert.equal(atualizarSitemap(out, [post], '2026-10-27'), out);
});

test('precisaAvisoVet pega termos comuns de sanidade', () => {
  for (const t of ['Medicação do lote', 'anti-helmíntico', 'ivermectina 0,2 mg/kg', 'aplicar o carrapaticida', 'banho de imersão contra sarna', 'antiparasitário injetável']) assert.equal(precisaAvisoVet(t), true, t);
});

test('renderPost: aviso também quando só o título fala de remédio', () => {
  assert.match(renderPost({ ...post, titulo: 'Ivermectina em ovinos: quando usar' }, '<p>Texto neutro.</p>'), /aviso-vet/);
});

test('tempoLeitura: 200 palavras por minuto, arredondando para cima, mínimo 1', () => {
  assert.equal(tempoLeitura(`<p>${'palavra '.repeat(450)}</p>`), 3);
  assert.equal(tempoLeitura('<p>curto</p>'), 1);
});

test('fotoDoPost: sem foto no registro, é estável e usa uma foto do site', () => {
  assert.equal(fotoDoPost({ slug: 'abc' }), fotoDoPost({ slug: 'abc' }));
  assert.match(fotoDoPost({ slug: 'abc' }), /^\/assets\/sheep-(flock|pasture)\.webp$/);
});

const foto = { arquivo: '/assets/blog/vermifugacao-de-ovinos.jpg', autor: 'Fulano & Cia', licenca: 'CC BY-SA 4.0', origem: 'https://commons.wikimedia.org/wiki/File:X.jpg' };

test('validarPost: foto precisa de arquivo em /assets/blog/, autor, licença e origem https', () => {
  assert.deepEqual(validarPost({ ...post, foto }), []);
  for (const ruim of [{ ...foto, arquivo: '/assets/x.jpg' }, { ...foto, autor: '' }, { ...foto, licenca: undefined }, { ...foto, origem: 'http://x' }]) {
    assert.equal(validarPost({ ...post, foto: ruim }).length, 1, JSON.stringify(ruim));
  }
});

test('renderPost com foto: topo, og:image, JSON-LD e crédito com licença', () => {
  const html = renderPost({ ...post, foto }, '<p>texto</p>');
  assert.match(html, /<section class="post-hero" style="--foto:url\(\/assets\/blog\/vermifugacao-de-ovinos\.jpg\)">/);
  assert.match(html, /<meta property="og:image" content="https:\/\/ovisapp\.com\.br\/assets\/blog\/vermifugacao-de-ovinos\.jpg">/);
  assert.match(html, /"image":"https:\/\/ovisapp\.com\.br\/assets\/blog\/vermifugacao-de-ovinos\.jpg"/);
  assert.match(html, /<p class="post-foto-credito">Foto: <a href="https:\/\/commons\.wikimedia\.org\/wiki\/File:X\.jpg" rel="noopener">Fulano &amp; Cia<\/a>, CC BY-SA 4\.0, via Wikimedia Commons<\/p>/);
  assert.doesNotMatch(renderPost(post, '<p>texto</p>'), /post-foto-credito/);
});

test('renderPost: topo com foto, selo do tipo, resumo e tempo de leitura', () => {
  const html = renderPost(post, `<p>${'palavra '.repeat(450)}</p>`);
  assert.match(html, /<section class="post-hero" style="--foto:url\(\/assets\/sheep-(flock|pasture)\.webp\)">/);
  assert.match(html, /<span class="tag tag-guia">Guia<\/span>/);
  assert.match(html, /<p class="post-lead">d{100}<\/p>/);
  assert.match(html, /3 min de leitura/);
  assert.match(html, /<aside class="post-cta">[^]*href="\/#lancamento"/);
});

test('renderIndex: cartões com selo do tipo e o mais novo em destaque', () => {
  const a = { ...post, slug: 'a', data: '2026-10-27', tipo: 'noticia' }, b = { ...post, slug: 'b', data: '2026-10-28' };
  const html = renderIndex([a, b]);
  assert.match(html, /<a href="\/blog\/b\/" class="post-card post-card-destaque">/);
  assert.match(html, /<a href="\/blog\/a\/" class="post-card">/);
  assert.match(html, /<span class="tag tag-noticia">Notícia<\/span>/);
  assert.match(html, /<section class="blog-hero">/);
});
