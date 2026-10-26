# Blog da Ovis com rotina automática — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a seção `/blog/` do site estático e a rotina agendada que pesquisa, escreve e publica posts sobre ovinocultura sozinha.

**Architecture:** Os posts nascem de um registro (`blog/_registro.json`) e de um fragmento de HTML por post (`blog/_corpos/<slug>.html`). Um script Node sem dependências (`scripts/blog-build.mjs`, com a lógica pura em `scripts/blog-lib.mjs`) gera `blog/<slug>/index.html`, `blog/index.html` e as entradas do `sitemap.xml` a partir disso. A rotina na nuvem só escreve o registro e o fragmento, roda o build e os testes, e publica por PR conforme o modo em `blog/_rotina.json`.

**Tech Stack:** HTML/CSS estático no GitHub Pages (Jekyll), Node ≥ 20 (`node:test`, `fetch` nativo), `gh` CLI, rotina agendada do Claude Code (skill `schedule`).

**Spec:** `docs/superpowers/specs/2026-10-26-blog-rotina-design.md`

## Global Constraints

- Sem dependências npm; o site não tem build. Os testes rodam com `node --test tests/*.test.mjs`.
- Páginas novas seguem o molde de `calculadora-gmd/index.html`: mesmo `<head>` base, header, footer, `<main class="doc">`.
- `site.css` muda → a versão passa de `?v=23` para `?v=24` em `index.html`, `sobre/`, `privacidade/`, `calculadora-gmd/` e nas páginas do blog.
- Arquivos internos do blog começam com `_` e entram no `exclude` do `_config.yml`: `blog/_registro.json`, `blog/_rotina.json`, `blog/_corpos`.
- Aviso do veterinário, texto fixo: `Estas informações são educativas. Consulte um médico veterinário antes de aplicar qualquer medicamento ou tratamento.`
- Fecho de todo post: parágrafo curto sobre a Ovis com link para `/#lancamento`.
- Voz da copy (`docs/superpowers/specs/2026-10-19-copy-site-design.md`): sem "solução", "potencialize", "jornada", "evolua", "escale"; sem preços; sem uso offline; sem depoimento ou número de clientes.
- Imagem OG de todo post: `https://ovisapp.com.br/assets/ovis-social.jpg`.
- Aviso de falha da rotina: issue no GitHub marcando `@Romanndemello`.

## Review Focus

- Título ou descrição com aspas, `&` ou `<` → precisa sair escapado no HTML e no JSON-LD (teste em Task 2).
- Post que fala de "vermifugação" ou "Vacinação" com maiúscula/acentos diferentes → o aviso do veterinário precisa ser detectado mesmo assim (teste em Task 1).
- Dois posts no mesmo dia ou registro fora de ordem → `/blog/` lista por data desc e, no mesmo dia, pela ordem do registro, mais novo primeiro (teste em Task 2).
- Rodar o build duas vezes seguidas → nenhum arquivo muda na segunda (idempotente; teste em Task 3).
- Fonte que redireciona (http→https, Embrapa `handle`) → conta como ok se o destino final for 2xx (teste em Task 4).

---

### Task 1: Regras puras do blog

**Files:**
- Create: `scripts/blog-lib.mjs`
- Test: `tests/blog-lib.test.mjs`

**Interfaces:**
- Produces:
  - `deveRodarHoje(hojeISO: string, rotina: { inicio: string|null }) -> boolean` — datas `YYYY-MM-DD` no fuso de Brasília. `inicio` null → true (primeiro post ainda não saiu). Dentro de 14 dias a partir de `inicio` (dias 0–13) → true. Depois, só terça e sexta.
  - `precisaAvisoVet(texto: string) -> boolean` — true se o texto (sem tags, minúsculas, sem acentos) contém algum radical: `remedio`, `medicament`, `dose`, `dosage`, `vermifug`, `vermicid`, `vacin`, `antibiot`, `tratament`, `aplicacao`.
  - `validarPost(post) -> string[]` — lista de erros (vazia = ok). Post: `{ slug, data, tipo, titulo, descricao, palavraChave, fontes: [{ titulo, url }] }`. Regras: slug `^[a-z0-9]+(-[a-z0-9]+)*$`; data `YYYY-MM-DD`; tipo ∈ `noticia|guia|curiosidade`; titulo ≤ 70 caracteres; descricao entre 70 e 160; ≥ 1 fonte com url `https://`.
  - `escapeHtml(s: string) -> string`.

- [ ] **Step 1: Escrever os testes**

```js
test('deveRodarHoje: sem início publica', () => assert.equal(deveRodarHoje('2026-10-27', { inicio: null }), true));
test('deveRodarHoje: 14 dias diários', () => {
  assert.equal(deveRodarHoje('2026-10-27', { inicio: '2026-10-27' }), true);
  assert.equal(deveRodarHoje('2026-11-09', { inicio: '2026-10-27' }), true);   // dia 13, domingo
});
test('deveRodarHoje: depois, só terça e sexta', () => {
  assert.equal(deveRodarHoje('2026-11-10', { inicio: '2026-10-27' }), true);   // terça
  assert.equal(deveRodarHoje('2026-11-11', { inicio: '2026-10-27' }), false);  // quarta
  assert.equal(deveRodarHoje('2026-11-13', { inicio: '2026-10-27' }), true);   // sexta
  assert.equal(deveRodarHoje('2026-11-15', { inicio: '2026-10-27' }), false);  // domingo
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
  assert.equal(validarPost({ ...ok, tipo: 'opiniao' }).length, 1);
  assert.equal(validarPost({ ...ok, descricao: 'curta' }).length, 1);
  assert.equal(validarPost({ ...ok, fontes: [] }).length, 1);
  assert.equal(validarPost({ ...ok, fontes: [{ titulo: 'x', url: 'http://a.com' }] }).length, 1);
});
test('escapeHtml', () => assert.equal(escapeHtml(`"A" & <b>'`), '&quot;A&quot; &amp; &lt;b&gt;&#39;'));
```

- [ ] **Step 2: Rodar e ver falhar** — `node --test tests/blog-lib.test.mjs` → FAIL (módulo não existe).
- [ ] **Step 3: Implementar as quatro funções em `scripts/blog-lib.mjs`** (ES module). Dia da semana com `new Date(hojeISO + 'T12:00:00Z').getUTCDay()`; diferença de dias por milissegundos/86400000. Sem acento via `normalize('NFD').replace(/\p{M}/gu, '')`.
- [ ] **Step 4: Rodar e ver passar** — `node --test tests/blog-lib.test.mjs` → PASS.
- [ ] **Step 5: Commit** — `git add scripts/blog-lib.mjs tests/blog-lib.test.mjs && git commit -m "feat(blog): regras de agenda, aviso e validação de post"`

### Task 2: Renderização das páginas

**Files:**
- Modify: `scripts/blog-lib.mjs`
- Test: `tests/blog-lib.test.mjs`

**Interfaces:**
- Consumes: `escapeHtml`, `precisaAvisoVet` (Task 1).
- Produces:
  - `renderPost(post, corpoHtml: string) -> string` — página completa. `<title>{titulo} | Blog da Ovis</title>`, `description`, `canonical` e `og:url` = `https://ovisapp.com.br/blog/{slug}/`, `og:type` `article`, `og:image` padrão, JSON-LD `@graph` com `BlogPosting` (tipo `guia`/`curiosidade`) ou `NewsArticle` (tipo `noticia`) com `headline`, `description`, `datePublished`, `dateModified`, `inLanguage` `pt-BR`, `author` e `publisher` `{ "@id": "https://ovisapp.com.br/#organization" }`, `mainEntityOfPage`, `citation` (urls das fontes), mais `BreadcrumbList` Início › Blog › título. Corpo: kicker com o tipo (`Notícia`/`Guia`/`Curiosidade`), `<h1 class="display">`, `<time datetime>` com data por extenso em pt-BR, aviso `<aside class="aviso-vet">` logo após o cabeçalho quando `precisaAvisoVet(corpoHtml)`, o `corpoHtml`, `<h2>Fontes</h2>` com `<ul>` de links `rel="noopener"`, e o fecho `<p class="post-ovis">` com link `/#lancamento`. Header e footer copiados de `calculadora-gmd/index.html`, com o link Blog (Task 3).
  - `renderIndex(posts) -> string` — `/blog/` com `<title>Blog da Ovis | Notícias e dicas de ovinocultura</title>`, canonical `https://ovisapp.com.br/blog/`, JSON-LD `Blog` com `blogPost` (headline, url, datePublished). Lista `<ol class="post-list">`, cada item com link, `<time>` e descrição. Ordem: data desc; mesma data → o que vem depois no registro primeiro. Sem posts → `<p>` "Os primeiros posts chegam em breve."
  - `atualizarSitemap(xml: string, posts, hojeISO: string) -> string` — remove toda `<url>` cujo `<loc>` começa com `https://ovisapp.com.br/blog/` e reinsere `/blog/` (lastmod = data do post mais novo ou `hojeISO`) e um `<url>` por post (lastmod = data), antes de `</urlset>`, ordem igual à do índice.

- [ ] **Step 1: Escrever os testes**

```js
const post = { slug: 'vermifugacao-de-ovinos', data: '2026-10-27', tipo: 'guia', titulo: 'Vermifugação de ovinos: "quando" & como', descricao: 'd'.repeat(100), palavraChave: 'vermifugação', fontes: [{ titulo: 'Embrapa', url: 'https://www.embrapa.br/x' }] };
test('renderPost: SEO, escape e JSON-LD', () => {
  const html = renderPost(post, '<p>Vermifugar o lote.</p>');
  assert.match(html, /<link rel="canonical" href="https:\/\/ovisapp\.com\.br\/blog\/vermifugacao-de-ovinos\/">/);
  assert.match(html, /<title>Vermifugação de ovinos: &quot;quando&quot; &amp; como \| Blog da Ovis<\/title>/);
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  const art = ld['@graph'].find((n) => n['@type'] === 'BlogPosting');
  assert.equal(art.headline, post.titulo);
  assert.equal(art.datePublished, '2026-10-27');
  assert.deepEqual(art.citation, ['https://www.embrapa.br/x']);
  assert.match(html, /Consulte um médico veterinário antes de aplicar qualquer medicamento ou tratamento\./);
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
  assert.deepEqual([...html.matchAll(/href="\/blog\/([a-z]+)\/"/g)].map((m) => m[1]), ['c', 'b', 'a']);
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
```

- [ ] **Step 2: Rodar e ver falhar** — `node --test tests/blog-lib.test.mjs` → FAIL (`renderPost` não exportado).
- [ ] **Step 3: Implementar `renderPost`, `renderIndex`, `atualizarSitemap` em `scripts/blog-lib.mjs`.** JSON-LD com `JSON.stringify` e `<` trocado por `<` dentro do script. Data por extenso com `toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })`. Usar `/site.css?v=24`.
- [ ] **Step 4: Rodar e ver passar** — `node --test tests/blog-lib.test.mjs` → PASS.
- [ ] **Step 5: Commit** — `git commit -am "feat(blog): renderização de post, índice e sitemap"` (incluindo os arquivos novos com `git add`).

### Task 3: Build, blog vazio no ar e integração com o site

**Files:**
- Create: `scripts/blog-build.mjs`, `blog/_registro.json` (`[]`), `blog/_rotina.json`, `blog/_corpos/.gitkeep`, `blog/index.html` (gerado)
- Create: `tests/blog.test.mjs`
- Modify: `_config.yml` (exclude), `sitemap.xml` (gerado), `llms.txt`, `site.css`, footers de `index.html:258`, `sobre/index.html:70`, `privacidade/index.html:91`, `calculadora-gmd/index.html:113` e `?v=23`→`?v=24` nesses quatro, `README.md`

**Interfaces:**
- Consumes: tudo de `scripts/blog-lib.mjs`.
- Produces:
  - `node scripts/blog-build.mjs [--hoje YYYY-MM-DD]` — lê `blog/_registro.json`; para cada post roda `validarPost` e exige `blog/_corpos/<slug>.html`; qualquer erro → imprime e sai com código 1 sem escrever nada. Senão escreve `blog/<slug>/index.html`, `blog/index.html` e `sitemap.xml`. `--hoje` padrão = data de hoje em `America/Sao_Paulo`.
  - `blog/_rotina.json`: `{ "modo": "automatico", "inicio": null }` — `modo` ∈ `automatico|aprovacao`; `inicio` = data do primeiro post, gravada pela rotina na primeira publicação.

- [ ] **Step 1: Escrever `tests/blog.test.mjs`** (testa o repositório como está, como `tests/site.test.mjs`):

```js
test('registro, corpos, páginas, índice e sitemap batem', () => {
  const posts = JSON.parse(read('blog/_registro.json'));
  const index = read('blog/index.html'); const sitemap = read('sitemap.xml');
  assert.match(sitemap, /<loc>https:\/\/ovisapp\.com\.br\/blog\/<\/loc>/);
  for (const p of posts) {
    assert.deepEqual(validarPost(p), [], p.slug);
    assert.ok(existsSync(url(`blog/_corpos/${p.slug}.html`)));
    assert.equal(read(`blog/${p.slug}/index.html`), renderPost(p, read(`blog/_corpos/${p.slug}.html`)), `página de ${p.slug} gerada pelo build`);
    assert.ok(index.includes(`href="/blog/${p.slug}/"`)); assert.ok(sitemap.includes(`/blog/${p.slug}/</loc>`));
  }
  const pastas = readdirSync(url('blog'), { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith('_')).map((d) => d.name);
  assert.deepEqual(pastas.sort(), posts.map((p) => p.slug).sort(), 'nenhuma página órfã');
  assert.equal(index, renderIndex(posts));
});
test('posts sem termos proibidos nem preço', () => { /* para cada corpo: doesNotMatch /R\$ ?\d/, /solução|potencializ|jornada|evolua|escal[ae]/i, /sem internet|offline/i */ });
test('modo da rotina é válido', () => { const r = JSON.parse(read('blog/_rotina.json')); assert.ok(['automatico', 'aprovacao'].includes(r.modo)); assert.ok(r.inicio === null || /^\d{4}-\d{2}-\d{2}$/.test(r.inicio)); });
test('blog no footer, llms.txt e fora do Jekyll o que é interno', () => {
  for (const f of ['index.html', 'sobre/index.html', 'privacidade/index.html', 'calculadora-gmd/index.html']) assert.match(read(f), /<nav aria-label="Ovis">[^]*?href="\/?blog\/">Blog<\/a>/, f);
  assert.ok(read('llms.txt').includes('](https://ovisapp.com.br/blog/)'));
  for (const p of ['blog/_registro.json', 'blog/_rotina.json', 'blog/_corpos']) assert.match(read('_config.yml'), new RegExp(`- ${p}`));
});
```

- [ ] **Step 2: Rodar e ver falhar** — `node --test tests/blog.test.mjs` → FAIL (`blog/_registro.json` não existe).
- [ ] **Step 3: Implementar `scripts/blog-build.mjs`** conforme a interface; criar `blog/_registro.json`, `blog/_rotina.json`, `blog/_corpos/.gitkeep`; rodar `node scripts/blog-build.mjs` para gerar `blog/index.html` e o sitemap.
- [ ] **Step 4: Integração** — link `<a href="/blog/">Blog</a>` (na home, `blog/`) depois de "Dúvidas" no `<nav aria-label="Ovis">` das quatro páginas; `?v=24` nelas; `llms.txt` ganha em Páginas: `- [Blog da Ovis](https://ovisapp.com.br/blog/): notícias da ovinocultura, guias de manejo e curiosidades, sempre com fontes.`; `_config.yml` exclui os três caminhos internos; `site.css` ganha `.post-list` (itens com título, data em `--text-3`, descrição em `--text-2`), `.aviso-vet` (borda à esquerda em `--accent`, fundo `--surface`) e `.post-ovis` (separador acima); `README.md` ganha seção "Blog" explicando registro, corpos, build, `_rotina.json` e como trocar o modo.
- [ ] **Step 5: Rodar tudo** — `node scripts/blog-build.mjs && node scripts/blog-build.mjs && git status --short blog sitemap.xml` (segunda execução não muda nada) e `node --test tests/*.test.mjs` → todos PASS.
- [ ] **Step 6: Commit** — `git add -A blog scripts/blog-build.mjs tests/blog.test.mjs _config.yml sitemap.xml llms.txt site.css index.html sobre privacidade calculadora-gmd README.md && git commit -m "feat(blog): seção /blog/ com build, footer, sitemap e llms.txt"`

### Task 4: Verificador de fontes

**Files:**
- Create: `scripts/blog-fontes.mjs`
- Test: `tests/blog-fontes.test.mjs`

**Interfaces:**
- Produces:
  - `checarUrl(url: string, fetchFn = fetch) -> Promise<{ url, ok: boolean, status: number|null }>` — `GET` com `redirect: 'follow'`, timeout 15 s, `User-Agent` de navegador comum; ok se status final 200–299; em falha (status fora de 2xx ou erro de rede) tenta mais uma vez após 3 s.
  - CLI `node scripts/blog-fontes.mjs <slug>` — checa todas as fontes do post no registro; imprime uma linha por url; sai com 1 se alguma falhar.

- [ ] **Step 1: Testes com `fetchFn` falso** — redirecionado que termina em 200 (`{ ok: true, status: 200, redirected: true }`) → `ok: true`; 403 duas vezes → `ok: false, status: 403` e 2 chamadas; erro de rede e depois 200 → `ok: true` com 2 chamadas. Espera de 3 s injetável (parâmetro `esperaMs`, padrão 3000; teste passa 0).
- [ ] **Step 2: Rodar e ver falhar** — `node --test tests/blog-fontes.test.mjs` → FAIL.
- [ ] **Step 3: Implementar** com `AbortSignal.timeout(15000)`.
- [ ] **Step 4: Rodar e ver passar** — PASS; `node --test tests/*.test.mjs` → todos PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(blog): verificador de fontes dos posts"`

### Task 5: Instruções da rotina, PR e agendamento

**Files:**
- Create: `docs/blog/rotina.md` (o prompt completo que a rotina executa; `docs/` não é publicado)

**Interfaces:**
- Consumes: `deveRodarHoje` (via `node -e`), `blog/_rotina.json`, `blog/_registro.json`, `blog/_corpos/`, `node scripts/blog-build.mjs`, `node scripts/blog-fontes.mjs <slug>`, `node --test tests/*.test.mjs`.

- [ ] **Step 1: Escrever `docs/blog/rotina.md`** com, em ordem:
  1. Calcular hoje em `America/Sao_Paulo`; se `deveRodarHoje` der false, encerrar sem nada.
  2. Ler `_registro.json` e escolher tipo e tema: notícia se houver fato do setor dos últimos 7 dias com matéria original aberta e lida; senão guia ou curiosidade; nunca repetir `palavraChave` nem tema do registro; alternar tipos.
  3. Fontes aceitas e proibidas (copiar da spec, seção "Regras de conteúdo"); só citar fonte aberta e lida; nada de dado sem fonte; região explícita quando o dado depende dela.
  4. Escrever `blog/_corpos/<slug>.html` (só o miolo: parágrafos, `<h2>`, listas; sem H1, sem fontes, sem fecho) no tamanho do tipo (notícia 400–700, guia 800–1.400, curiosidade 400–800 palavras), voz da copy, termo técnico com tradução ao lado, link `/calculadora-gmd/` quando o tema for peso/engorda; texto próprio, citação literal só curta, entre aspas e com crédito.
  5. Acrescentar o post ao fim de `_registro.json`; se `inicio` for null, gravar a data de hoje em `_rotina.json`.
  6. Revisão separada (subagente novo, só com o corpo e as fontes): cada afirmação confere com a fonte? Remover o que não bater. Se sobrar texto sem substância, abortar.
  7. `node scripts/blog-fontes.mjs <slug>`, `node scripts/blog-build.mjs`, `node --test tests/*.test.mjs`.
  8. Branch `blog/<data>-<slug>`, commit `feat(blog): <título>`, PR com título, tipo, fontes e resultado dos testes.
  9. `modo: automatico` e tudo verde → `gh pr merge --squash --delete-branch`. `modo: aprovacao` → parar.
  10. Qualquer falha nos passos 6–9 → não fazer merge; deixar o PR aberto (se existir) e abrir issue `Blog: post de <data> não publicado` com o motivo e o link, mencionando `@Romanndemello`.
- [ ] **Step 2: Ensaio local** — seguir `docs/blog/rotina.md` uma vez nesta sessão até o passo 7 (sem PR), confirmar que o post gerado passa em `node --test tests/*.test.mjs` e abre bem em `python3 -m http.server 8765` em `/blog/` e `/blog/<slug>/`; depois descartar com `git checkout -- . && git clean -fd blog`.
- [ ] **Step 3: Commit e PR da estrutura** — `git add docs/blog/rotina.md docs/superpowers && git commit -m "docs(blog): instruções da rotina"`; push e PR com Tasks 1–5. O merge é do Roman.
- [ ] **Step 4: Criar a rotina** com a skill `schedule`, depois do merge: repositório `Ovis-Gestao-de-Ovinos/ovis-site`, cron `0 10 * * *` (07:00 de Brasília, UTC−3), prompt "Siga `docs/blog/rotina.md` à risca." Pedir ao Roman que, no ambiente da rotina, libere push/merge na `main` e o uso do `gh`. Rodar uma vez na hora para publicar o primeiro post e conferir o resultado no ar.
