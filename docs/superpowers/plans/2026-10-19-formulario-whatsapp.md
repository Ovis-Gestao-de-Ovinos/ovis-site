# Formulário → planilha → WhatsApp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o checkout da AbacatePay por um formulário que salva o contato numa planilha do Google e abre o WhatsApp da Ovis com a mensagem pronta.

**Architecture:** Um módulo puro `lead.js` (montagem da mensagem, normalização do telefone, envio com timeout), testável em Node como `pricing.js`. O `script.js` liga os botões `data-lead` a um `<dialog>` no `index.html`. A planilha recebe os dados por um Google Apps Script (`scripts/leads-apps-script.gs`), cuja URL fica em `lead-config.json`.

**Tech Stack:** HTML/CSS/JS sem build, módulos ES, `node --test`, Google Apps Script.

**Spec:** `docs/superpowers/specs/2026-10-19-formulario-whatsapp-design.md`

Branch: `feat/formulario-whatsapp`, criada a partir de `feat/copy-nova` (PR #10). O PR aponta para `feat/copy-nova` até o #10 entrar.

## Global Constraints

- WhatsApp da Ovis: `5551984931844` → `https://wa.me/5551984931844?text=<encodeURIComponent(mensagem)>`.
- Campos obrigatórios: nome, WhatsApp (10 ou 11 dígitos com DDD), nome da fazenda e tamanho do rebanho.
- Faixas do rebanho, exatamente: `até 100`, `101 a 300`, `301 a 1.000`, `mais de 1.000`.
- Planos: `Teste`, `Plus`, `Pro`. Períodos: `mensal`, `anual`.
- Espera máxima pela planilha: 4000 ms. O WhatsApp abre sempre, via `location.href`.
- Linha de privacidade: "Usamos esses dados só para falar com você sobre o Ovis."
- Nenhuma menção a "AbacatePay" nem a "cobrança automática" em `index.html`.
- `scripts/abacatepay-setup.mjs`, `pricing.js`, `checkout-links.json` e `obrigado.html` continuam no repositório.
- Copy: o texto exato de cada trecho está na seção "Copy que muda junto" da spec.
- Comentários e textos em português, no estilo do código atual.

## Review Focus

- WhatsApp digitado com +55, espaços, parênteses ou traço → normaliza para dígitos com DDD. Com 12 ou 13 dígitos começando por 55, tira o 55.
- Nome ou fazenda só com espaços → conta como vazio e bloqueia o envio.
- Planilha lenta ou fora do ar (fetch pendurado ou rejeitado) → o WhatsApp abre em até 4 s mesmo assim.
- `lead-config.json` ausente ou com `endpoint` vazio → não tenta salvar e abre o WhatsApp.
- Clique duplo no botão de enviar → um envio só (botão desabilitado enquanto envia).

---

### Task 1: Módulo `lead.js`

**Files:**
- Create: `lead.js`
- Test: `tests/lead.test.mjs`

**Interfaces:**
- Produces:
  - `HERD_SIZES: string[]`, as quatro faixas na ordem.
  - `OVIS_WHATSAPP = '5551984931844'`
  - `normalizePhone(raw: string) -> string | null`: só dígitos, sem o 55 do país. Devolve `null` se não sobrarem 10 ou 11 dígitos.
  - `formatPhone(digits: string) -> string`: `'51984931844'` → `'(51) 98493-1844'`, `'5133334444'` → `'(51) 3333-4444'`.
  - `validateLead(lead) -> string[]`: nomes dos campos inválidos (`'nome' | 'whatsapp' | 'fazenda' | 'rebanho'`). `lead = { nome, whatsapp, fazenda, rebanho, plano, periodo }`.
  - `leadMessage(lead) -> string`
  - `whatsappUrl(lead) -> string`
  - `saveLead(endpoint: string | null, lead, { fetchImpl = fetch, timeoutMs = 4000 } = {}) -> Promise<'saved' | 'skipped' | 'failed'>`. Nunca rejeita.

- [ ] **Step 1: Escrever os testes que falham** em `tests/lead.test.mjs`:

```js
test('telefone aceita máscara, +55 e espaços', () => {
  assert.equal(normalizePhone('(51) 98493-1844'), '51984931844');
  assert.equal(normalizePhone('+55 51 98493 1844'), '51984931844');
  assert.equal(normalizePhone('51 3333-4444'), '5133334444');
  assert.equal(normalizePhone('98493-1844'), null);
  assert.equal(formatPhone('51984931844'), '(51) 98493-1844');
});
test('campos obrigatórios, espaços não contam', () => {
  assert.deepEqual(validateLead({ nome: '  ', whatsapp: '123', fazenda: '', rebanho: 'x', plano: 'Plus', periodo: 'mensal' }),
    ['nome', 'whatsapp', 'fazenda', 'rebanho']);
  assert.deepEqual(validateLead(ok), []);
});
test('mensagem do WhatsApp por plano e período', () => {
  assert.equal(leadMessage({ ...ok, plano: 'Teste' }),
    'Oi! Sou João, da fazenda Boa Vista. Temos 101 a 300 animais e quero começar o teste grátis. Meu WhatsApp: (51) 98493-1844.');
  assert.match(leadMessage({ ...ok, plano: 'Pro', periodo: 'anual' }), /quero conhecer o plano Pro \(anual\)\./);
  assert.ok(whatsappUrl(ok).startsWith('https://wa.me/5551984931844?text=Oi!%20Sou%20Jo%C3%A3o'));
});
test('saveLead pula sem endpoint, falha sem rejeitar e respeita o tempo-limite', async () => {
  assert.equal(await saveLead(null, ok), 'skipped');
  assert.equal(await saveLead('https://x', ok, { fetchImpl: () => Promise.reject(new Error()) }), 'failed');
  const t = Date.now();
  assert.equal(await saveLead('https://x', ok, { fetchImpl: () => new Promise(() => {}), timeoutMs: 50 }), 'failed');
  assert.ok(Date.now() - t < 500);
  let sent;
  assert.equal(await saveLead('https://x', ok, { fetchImpl: (url, init) => { sent = init; return Promise.resolve({}); } }), 'saved');
  assert.equal(sent.mode, 'no-cors');
  assert.equal(sent.headers['Content-Type'], 'text/plain;charset=utf-8');
  assert.deepEqual(JSON.parse(sent.body), { ...ok, whatsapp: '(51) 98493-1844' });
});
```

com `ok = { nome: 'João', whatsapp: '51984931844', fazenda: 'Boa Vista', rebanho: '101 a 300', plano: 'Plus', periodo: 'mensal' }`.

- [ ] **Step 2:** `node --test tests/lead.test.mjs` → FAIL (módulo não existe).
- [ ] **Step 3: Implementar `lead.js`.** Na mensagem, os trechos por plano são `começar o teste grátis` / `conhecer o plano Plus` / `conhecer o plano Pro`, com ` (anual)` quando o período for anual e o plano não for Teste. O corpo enviado por `saveLead` é o lead com o WhatsApp formatado. O timeout usa `Promise.race`.
- [ ] **Step 4:** `node --test tests/*.mjs` → todos passam.
- [ ] **Step 5: Commit** `feat(site): módulo do formulário de contato`

### Task 2: Formulário na página e troca do checkout

**Files:**
- Modify: `index.html` (botões dos planos, `<dialog>` antes de `</main>`, copy da spec, `script.js?v=11`, `site.css?v=` +1)
- Modify: `script.js` (remove `checkoutLinks`, `updateCheckoutLinks` e o fetch de `checkout-links.json`, e liga o formulário)
- Modify: `site.css` (estilos do dialog; reaproveita `.btn`, `.fine` e os tokens)
- Create: `lead-config.json` → `{ "endpoint": "" }`
- Test: `tests/site.test.mjs`

**Interfaces:**
- Consumes: tudo de `lead.js` (Task 1).
- Produces: botões `data-lead="Teste|Plus|Pro"` e `<dialog id="lead-dialog">` com o form `data-lead-form` e os inputs `name="nome|whatsapp|fazenda|rebanho"`, além do campo isca `name="site"`, escondido e `tabindex="-1"`.

- [ ] **Step 1: Atualizar `tests/site.test.mjs`.** O teste de "contratação AbacatePay" vira:

```js
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
  assert.doesNotMatch(page + script, /abc_(dev|prod)_|sk_/);
  assert.ok(existsSync(new URL('../obrigado.html', import.meta.url)));
});
```

  Remove o `data-checkout` do teste antigo. O teste `canais de atendimento` continua igual.
- [ ] **Step 2:** `node --test tests/*.mjs` → FAIL nesse teste.
- [ ] **Step 3: HTML e copy.**
  - Os três botões dos planos ficam `<button type="button" class="btn …" data-lead="…">` com o texto atual.
  - Aplicar todos os itens de "Copy que muda junto" da spec, palavra por palavra. O `.checkout-mode` sai.
  - Dentro do dialog:
    - título `Falta pouco` e subtítulo com o plano escolhido (`data-lead-plan`);
    - quatro campos com `<label>` visível. O WhatsApp usa `type="tel" inputmode="numeric" autocomplete="tel"` e o rebanho é um `<select>` com opção vazia + `HERD_SIZES`;
    - botão `Continuar no WhatsApp`, a linha de privacidade em `.fine` e um botão de fechar com `aria-label="Fechar"`.
- [ ] **Step 4: `script.js`.**
  - O clique em `[data-lead]` preenche o plano e o período (`anual` se o radio annual estiver marcado) e chama `showModal()`.
  - No submit: `preventDefault`. Se o campo isca estiver preenchido, para em silêncio. `validateLead`, com os inválidos marcados por `aria-invalid="true"` e foco no primeiro. O botão fica desabilitado com o texto `Abrindo o WhatsApp…`. Depois, `await saveLead(endpoint, lead)` e `location.href = whatsappUrl(lead)`.
  - `endpoint` vem de `fetch('lead-config.json', { cache: 'no-cache' })` no carregamento. Qualquer falha vira `null`.
  - Máscara do WhatsApp ao digitar: `formatPhone` quando houver 10 ou 11 dígitos.
- [ ] **Step 5: CSS.** Dialog centrado, com largura máxima de 440px, gutter de 16px no celular, `::backdrop` escuro, campos com altura de 48px e tema escuro com os tokens existentes. Respeita `prefers-reduced-motion`.
- [ ] **Step 6:** `node --test tests/*.mjs` → todos passam.
- [ ] **Step 7: Conferir no navegador** (`python3 -m http.server 8765`), em 390px e 1440px:
  - o dialog abre em cada botão;
  - o envio vazio marca os quatro campos;
  - o envio válido, com `endpoint` vazio, navega para `wa.me/5551984931844?text=…` com a mensagem certa.
- [ ] **Step 8: Commit** `feat(site): formulário de contato no lugar do checkout`

### Task 3: Planilha (Apps Script) e README

**Files:**
- Create: `scripts/leads-apps-script.gs`
- Modify: `README.md` (a seção "Contratação (AbacatePay)" vira "Contato (formulário → planilha → WhatsApp)", e o texto da AbacatePay vai para uma subseção "Checkout da AbacatePay (desligado)")

**Interfaces:**
- Consumes: o corpo JSON de `saveLead`: `{ nome, whatsapp, fazenda, rebanho, plano, periodo, site? }`.

- [ ] **Step 1: `doPost(e)`.**
  - Faz `JSON.parse(e.postData.contents)` e descarta o envio se `site` vier preenchido.
  - Faz `appendRow` na aba `Contatos`, criando o cabeçalho `Data e hora · Nome · WhatsApp · Fazenda · Rebanho · Plano · Período · Página de origem` se a aba estiver vazia. Página de origem = `e.parameter.origem || ''`.
  - Prefixa com `'` o texto que começa com `=`, `+`, `-` ou `@`, pra a planilha não executar fórmula.
  - Devolve `ContentService.createTextOutput('ok')`.
- [ ] **Step 2: Ajustar a página de origem.** `saveLead` envia para `endpoint + '?origem=' + encodeURIComponent(location.href)`. A URL vem montada do `script.js`, e `lead.js` não sabe de `location`.
- [ ] **Step 3: README.** Passo a passo:
  1. criar a planilha;
  2. abrir Extensões → Apps Script e colar o arquivo;
  3. Implantar → Nova implantação → App da Web, executar como "Eu", acesso "Qualquer pessoa";
  4. copiar a URL para `lead-config.json`;
  5. testar enviando o formulário.
- [ ] **Step 4:** `node --test tests/*.mjs` → todos passam.
- [ ] **Step 5: Commit** `docs(site): planilha de contatos via Apps Script`
