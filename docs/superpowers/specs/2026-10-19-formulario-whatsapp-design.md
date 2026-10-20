# Formulário de contato no lugar do checkout

Data: 2026-10-19 · Depende do PR #10 (copy nova).

## Por que

O preço depende do tamanho do rebanho e os planos ainda estão sendo fechados com os sócios. Por isso, por enquanto, a Ovis não quer cobrar pelo site. Quem se interessa preenche um formulário curto, e o contato:

1. **fica salvo numa planilha do Google**, o "painel" da equipe, mesmo que a pessoa desista no meio do caminho;
2. **abre o WhatsApp da Ovis**, (51) 98493-1844, com uma mensagem já escrita. A pessoa só aperta enviar.

A equipe libera o teste de 14 dias e combina o preço na conversa. Não tem cartão no site.

## Fluxo

1. A pessoa aperta um botão de plano: "Começar teste grátis", "Assinar o Plus" ou "Assinar o Pro".
2. Abre uma janela por cima da página (`<dialog>`) com o formulário. O título diz qual plano ela escolheu.
3. Ela preenche e aperta **Continuar no WhatsApp**.
4. O site envia as respostas para a planilha e espera no máximo 4 segundos.
5. Em seguida, sempre, abre `https://wa.me/5551984931844?text=…` com a mensagem pronta, na mesma aba. No celular, isso abre o app do WhatsApp.
   - Se salvar na planilha falhar (sem internet, planilha fora do ar), o WhatsApp abre do mesmo jeito. A mensagem leva todos os dados, então o contato não se perde.

## Campos

| Campo | Tipo | Regra |
|---|---|---|
| Nome | texto | obrigatório |
| WhatsApp | telefone | obrigatório. Máscara `(51) 98493-1844`, aceita 10 ou 11 dígitos com DDD |
| Nome da fazenda | texto | obrigatório |
| Tamanho do rebanho | lista | obrigatório: **até 100**, **101 a 300**, **301 a 1.000**, **mais de 1.000** animais |

Além desses, vão campos escondidos, que a pessoa não vê: **plano** (Teste, Plus ou Pro), **período** (mensal ou anual, conforme a chave de período ativa) e um campo "isca" contra robôs. Se o campo isca vier preenchido, a planilha descarta o envio.

Embaixo do botão, em letra pequena: **Usamos esses dados só para falar com você sobre o Ovis.**

## Mensagem do WhatsApp

> Oi! Sou {nome}, da fazenda {fazenda}. Temos {rebanho} animais e quero {começar o teste grátis | conhecer o plano Plus | conhecer o plano Pro | ver uma demonstração do Ovis no computador}{ (anual)}.

## Planilha (o painel)

- Colunas: **Data e hora · Nome · WhatsApp · Fazenda · Rebanho · Plano · Período · Página de origem**.
- Recebe os dados por um pequeno Google Apps Script publicado como "app da web". O código fica no repositório em `scripts/leads-apps-script.gs`, e o README ganha um passo a passo de 5 minutos: criar a planilha, colar o script, publicar e copiar a URL.
- **A equipe faz a publicação** na conta Google dela. A URL publicada vai em `lead-config.json` (`{ "endpoint": "https://script.google.com/…" }`). Enquanto a URL não estiver configurada, o formulário pula o salvamento e só abre o WhatsApp.
- O site envia com `fetch` em modo `no-cors` e `Content-Type: text/plain`. É o jeito que o Apps Script aceita sem bloqueio de CORS, mas o site não consegue ler a resposta. Por isso "enviado" significa "o navegador mandou", não "a planilha confirmou".

## Copy que muda junto

Tudo que fala de cartão, AbacatePay ou cobrança automática deixa de ser verdade.

- **Card Teste:** a nota "Cancele antes do fim e nada é cobrado" vira **Sem cartão. A gente combina pelo WhatsApp.**
- **Cards Plus e Pro:** "14 dias grátis, depois cobrança automática" vira **14 dias grátis. Preço combinado pelo tamanho do rebanho.**
- **Nota de rodapé dos planos:** **Todos os planos começam com 14 dias grátis, sem cartão. Você preenche o formulário, fala com a gente pelo WhatsApp e a gente libera o acesso. No anual, o total equivale a 12 mensalidades com 15% de desconto. “A partir de” é o valor de entrada: o preço final depende do tamanho do rebanho e é confirmado na conversa.**
- **Aviso de ambiente de teste da AbacatePay:** sai.
- **FAQ "Como funcionam os 14 dias grátis?":** **Você preenche o formulário e fala com a gente pelo WhatsApp. A gente libera o acesso e você usa o Ovis com o seu rebanho por 14 dias, sem cartão e sem pagar nada. No fim, se fizer sentido, combinamos o plano.**
- **FAQ "Quais formas de pagamento são aceitas?":** **A forma de pagamento é combinada na conversa pelo WhatsApp, depois do teste. Nada é cobrado pelo site.**
- **FAQ "Como cancelo ou falo com a Ovis?":** sai a frase sobre cancelar durante o teste. Fica o contato e entra **Durante o teste não há cobrança nenhuma.**
- **Aviso "Sobre esta página":** sai a frase sobre AbacatePay. Entra **Os dados do formulário vão só para a equipe Ovis.**
- **Desconto anual:** mantém.

## Fora do escopo

- **AbacatePay:** o site para de usar, mas `scripts/abacatepay-setup.mjs`, `pricing.js`, `checkout-links.json` e `obrigado.html` ficam no repositório, sem link, pra quando o checkout voltar. `script.js` deixa de buscar `checkout-links.json`.
- O toggle mensal/anual e os preços continuam mostrando os valores. O toggle só define o período que vai junto no formulário.
- Painel próprio no sistema da Ovis fica para depois. A planilha é provisória.

## Testes

- `tests/site.test.mjs`:
  - o teste de checkout da AbacatePay vira teste do formulário: existe o `<dialog>` com os quatro campos obrigatórios, os botões de plano trazem `data-lead`, o script monta o link `wa.me/5551984931844?text=` e lê `lead-config.json`;
  - o site não cita mais "cobrança automática" nem "AbacatePay";
  - nenhuma chave nem segredo vai para o site.
- Teste unitário da função que monta a mensagem e normaliza o telefone, extraída para um módulo puro (`lead.js`), no mesmo estilo de `pricing.js` / `tests/pricing.test.mjs`.

## Minhas decisões (podem ser revistas)

- Faixas do rebanho: até 100 / 101 a 300 / 301 a 1.000 / mais de 1.000.
- Janela por cima da página (`<dialog>`) em vez de uma página separada.
- Espera máxima de 4 segundos pela planilha. Depois disso, o WhatsApp abre de qualquer jeito.
- Linha de privacidade embaixo do botão (LGPD básica).
- Campo isca contra robôs, em vez de captcha.
- WhatsApp abre na mesma aba (`location.href`), pra não ser barrado por bloqueador de pop-up.
