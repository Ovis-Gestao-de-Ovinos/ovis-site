// Regras e páginas do blog. Lógica pura: o build (blog-build.mjs) e os testes importam daqui.

const DIA = 86400000;
const utc = (iso) => new Date(`${iso}T12:00:00Z`);

// Nos 14 dias a partir do primeiro post publica todo dia; depois, só terça e sexta.
export function deveRodarHoje(hojeISO, { inicio }) {
  if (!inicio) return true;
  const dias = Math.round((utc(hojeISO) - utc(inicio)) / DIA);
  if (dias < 14) return true;
  return [2, 5].includes(utc(hojeISO).getUTCDay());
}

// Na dúvida, inclui: aviso a mais não faz mal, aviso a menos fere a regra do blog.
const RADICAIS_VET = ['remedio', 'medica', 'dose', 'dosage', 'vermifug', 'vermicid', 'helmint', 'ivermectin', 'antiparasit', 'carrapat', 'sarna', 'vacin', 'antibiot', 'injet', 'tratament', 'aplicacao', 'aplicar', 'mg/kg', 'ml/kg'];
const semAcento = (s) => s.normalize('NFD').replace(/\p{M}/gu, '');

// Texto que fala de remédio, dose ou tratamento leva o aviso do veterinário.
export function precisaAvisoVet(texto) {
  const plano = semAcento(texto.replace(/<[^>]*>/g, ' ')).toLowerCase();
  return RADICAIS_VET.some((r) => plano.includes(r));
}

export const TIPOS = { noticia: 'Notícia', guia: 'Guia', curiosidade: 'Curiosidade' };

// Erros de um item do registro; lista vazia quando está tudo certo.
export function validarPost(post) {
  const erros = [];
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(post.slug ?? '')) erros.push(`slug inválido: ${post.slug}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(post.data ?? '')) erros.push(`data inválida: ${post.data}`);
  if (!(post.tipo in TIPOS)) erros.push(`tipo inválido: ${post.tipo}`);
  if (!post.titulo || post.titulo.length > 70) erros.push('título vazio ou com mais de 70 caracteres');
  const d = post.descricao?.length ?? 0;
  if (d < 70 || d > 160) erros.push(`descrição com ${d} caracteres (70 a 160)`);
  const fontes = post.fontes ?? [];
  if (!fontes.length || fontes.some((f) => !f.titulo || !/^https:\/\//.test(f.url ?? ''))) erros.push('fontes ausentes ou sem https');
  const f = post.foto;
  if (f && (!/^\/assets\/blog\/[a-z0-9-]+\.jpg$/.test(f.arquivo ?? '') || !f.autor || !f.licenca || !/^https:\/\//.test(f.origem ?? ''))) erros.push('foto sem arquivo em /assets/blog/, autor, licença ou origem https');
  return erros;
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

const SITE = 'https://ovisapp.com.br';
const OG_IMAGE = `${SITE}/assets/ovis-social.jpg`;
export const AVISO_VET = 'Estas informações são educativas. Consulte um médico veterinário antes de aplicar qualquer medicamento ou tratamento.';

const dataExtenso = (iso) => utc(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
// JSON-LD dentro de <script>: "<" escapado para nenhum texto fechar a tag.
const jsonLd = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

// Mais novo primeiro; no mesmo dia, o que entrou depois no registro vem antes.
const ordenar = (posts) => posts.map((p, i) => [p, i]).sort(([a, i], [b, j]) => b.data.localeCompare(a.data) || j - i).map(([p]) => p);

function pagina({ titulo, descricao, url, ogType, ld, topo, classe, main, imagem = OG_IMAGE }) {
  const t = escapeHtml(titulo), d = escapeHtml(descricao);
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0a0e0b">
  <title>${t}</title>
  <meta name="description" content="${d}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:site_name" content="Ovis">
  <meta property="og:title" content="${t}">
  <meta property="og:description" content="${d}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${imagem}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/assets/favicon.png?v=logo2" type="image/png">
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
  <link rel="preload" href="/assets/fonts/bebas-neue-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/site.css?v=26">
  <script src="/analytics.js?v=1" defer></script>
  ${jsonLd(ld)}
</head>
<body>
  <header class="nav is-scrolled">
    <div class="wrap nav-inner">
      <a class="brand" href="/"><img src="/assets/icon.png?v=logo2" width="30" height="30" alt=""><span>Ovis</span></a>
      <a class="btn btn-solid btn-sm" style="margin-left:auto" href="/#lancamento">Lista de espera</a>
    </div>
  </header>
${topo}
  <main class="${classe}">
    <div class="wrap">
${main}
    </div>
  </main>
  <footer class="footer">
    <div class="wrap footer-grid">
      <a class="brand" href="/"><img src="/assets/icon.png?v=logo2" width="30" height="30" alt=""><span>Ovis</span></a>
      <nav aria-label="Produto"><a href="/#visao">Visão geral</a><a href="/#produto">Ficha do animal</a><a href="/#rotina">Manejos</a><a href="/#recursos">Recursos</a><a href="/calculadora-gmd/">Calculadora de GMD</a></nav>
      <nav aria-label="Ovis"><a href="/#lancamento">Lançamento</a><a href="/#perguntas">Dúvidas</a><a href="/blog/">Blog</a><a href="/sobre/">Sobre</a><a href="/privacidade/">Privacidade</a></nav>
      <nav aria-label="Contato" class="footer-contact"><a href="https://wa.me/5551984931844" rel="noopener">WhatsApp (51) 98493-1844</a><a href="mailto:ovisfinanceiro@gmail.com">ovisfinanceiro@gmail.com</a><a href="https://www.instagram.com/ovis.gestao/" rel="noopener">Instagram @ovis.gestao</a></nav>
    </div>
    <div class="wrap footer-bottom">
      <span>© <span id="year">2026</span> Ovis · CNPJ 65.981.257/0001-17 · São Leopoldo, RS</span>
    </div>
  </footer>
  <script>document.getElementById('year').textContent = new Date().getFullYear();</script>
</body>
</html>
`;
}

const ORG = { '@id': `${SITE}/#organization` };

const FOTOS = ['/assets/sheep-flock.webp', '/assets/sheep-pasture.webp'];

// Foto do topo do post: a do registro (escolhida pelo assunto); sem ela, uma das fotos do site, sempre a mesma para o mesmo slug.
export function fotoDoPost(post) {
  if (post.foto) return post.foto.arquivo;
  const soma = [...post.slug].reduce((n, c) => n + c.charCodeAt(0), 0);
  return FOTOS[soma % FOTOS.length];
}

// Licenças CC pedem crédito com autor, licença e link para a origem.
const creditoFoto = (f) => f ? `\n      <p class="post-foto-credito">Foto: <a href="${escapeHtml(f.origem)}" rel="noopener">${escapeHtml(f.autor)}</a>, ${escapeHtml(f.licenca)}, via Wikimedia Commons</p>` : '';

export function tempoLeitura(html) {
  const palavras = html.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(palavras / 200));
}

const tag = (tipo) => `<span class="tag tag-${tipo}">${TIPOS[tipo]}</span>`;

export function renderPost(post, corpoHtml) {
  const url = `${SITE}/blog/${post.slug}/`;
  const imagem = `${SITE}${fotoDoPost(post)}`;
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': post.tipo === 'noticia' ? 'NewsArticle' : 'BlogPosting', '@id': `${url}#post`, headline: post.titulo, description: post.descricao, datePublished: post.data, dateModified: post.data, inLanguage: 'pt-BR', author: ORG, publisher: ORG, mainEntityOfPage: url, image: imagem, keywords: post.palavraChave, citation: post.fontes.map((f) => f.url) },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ovis', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog/` },
      { '@type': 'ListItem', position: 3, name: post.titulo, item: url },
    ] },
  ] };
  const topo = `  <section class="post-hero" style="--foto:url(${fotoDoPost(post)})">
    <div class="wrap post-hero-inner">
      <p class="post-crumbs"><a href="/blog/">← Blog da Ovis</a></p>
      ${tag(post.tipo)}
      <h1 class="display post-title">${escapeHtml(post.titulo)}</h1>
      <p class="post-lead">${escapeHtml(post.descricao)}</p>
      <p class="post-meta"><time datetime="${post.data}">${dataExtenso(post.data)}</time><span>${tempoLeitura(corpoHtml)} min de leitura</span><span>por <a href="/sobre/">equipe Ovis</a></span></p>${creditoFoto(post.foto)}
    </div>
  </section>`;
  const aviso = precisaAvisoVet(`${post.titulo} ${post.descricao} ${corpoHtml}`) ? `\n      <aside class="aviso-vet" role="note"><strong>Atenção</strong>${AVISO_VET}</aside>` : '';
  const fontes = post.fontes.map((f) => `          <li><a href="${escapeHtml(f.url)}" rel="noopener">${escapeHtml(f.titulo)}</a></li>`).join('\n');
  const main = `${aviso}
      <article class="post-body">
${corpoHtml.trim()}
      </article>

      <section class="post-fontes">
        <h2>Fontes</h2>
        <ul>
${fontes}
        </ul>
      </section>
      <aside class="post-cta">
        <p class="post-cta-kicker">Ovis</p>
        <p class="post-cta-title">O quadro branco agora cabe no bolso.</p>
        <p>A Ovis é o controle do rebanho ovino no celular: pesagens, vacinas e manejos anotados na hora, sem quadro branco nem caderno.</p>
        <a class="btn btn-solid" href="/#lancamento">Conheça a Ovis</a>
      </aside>
      <p class="post-voltar"><a href="/blog/">← Ver todos os posts</a></p>`;
  return pagina({ titulo: `${post.titulo} | Blog da Ovis`, descricao: post.descricao, url, ogType: 'article', ld, topo, classe: 'post', main, imagem });
}

export function renderIndex(posts) {
  const url = `${SITE}/blog/`;
  const lista = ordenar(posts);
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Blog', '@id': `${url}#blog`, name: 'Blog da Ovis', url, inLanguage: 'pt-BR', publisher: ORG, blogPost: lista.map((p) => ({ '@type': p.tipo === 'noticia' ? 'NewsArticle' : 'BlogPosting', headline: p.titulo, url: `${SITE}/blog/${p.slug}/`, datePublished: p.data })) },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ovis', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: url },
    ] },
  ] };
  const topo = `  <section class="blog-hero">
    <div class="wrap blog-hero-inner">
      <p class="kicker">Blog da Ovis</p>
      <h1 class="display">Do pasto<br>pra página.</h1>
      <p class="blog-hero-lead">Notícias da ovinocultura, guias de manejo e curiosidades da criação de ovinos. Sempre com as fontes.</p>
    </div>
  </section>`;
  const cartao = (p, i) => `        <a href="/blog/${p.slug}/" class="post-card${i === 0 ? ' post-card-destaque' : ''}">
          <span class="post-card-foto" style="--foto:url(${fotoDoPost(p)})"></span>
          <span class="post-card-texto">
            ${tag(p.tipo)}
            <span class="post-card-titulo">${escapeHtml(p.titulo)}</span>
            <span class="post-card-desc">${escapeHtml(p.descricao)}</span>
            <time datetime="${p.data}">${dataExtenso(p.data)}</time>
          </span>
        </a>`;
  const main = lista.length
    ? `      <div class="post-grid">\n${lista.map(cartao).join('\n')}\n      </div>`
    : '      <p class="blog-vazio">Os primeiros posts chegam em breve.</p>';
  return pagina({ titulo: 'Blog da Ovis | Notícias e dicas de ovinocultura', descricao: 'Notícias da ovinocultura, guias de manejo e curiosidades sobre a criação de ovinos, escritos pela equipe Ovis com fontes citadas.', url, ogType: 'website', ld, topo, classe: 'blog', main });
}

// Troca todas as entradas /blog/ do sitemap pelas atuais, na ordem do índice.
export function atualizarSitemap(xml, posts, hojeISO) {
  const lista = ordenar(posts);
  const entrada = (loc, lastmod) => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>\n`;
  const limpo = xml.replace(new RegExp(`  <url>\\s*<loc>${SITE.replace(/\./g, '\\.')}/blog/[^<]*</loc>[^]*?</url>\\n`, 'g'), '');
  const novas = entrada(`${SITE}/blog/`, lista[0]?.data ?? hojeISO) + lista.map((p) => entrada(`${SITE}/blog/${p.slug}/`, p.data)).join('');
  return limpo.replace('</urlset>', `${novas}</urlset>`);
}
