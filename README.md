# Ovis — site do produto

Landing page estática em português para apresentar o Ovis. A sequência editorial (abertura, capítulos do produto, planos e FAQ) se inspira na estrutura do subscrr.app, com conteúdo, fotografia e identidade visual próprios da Ovis. Implementada com HTML, CSS e JavaScript sem etapa de build.

## Executar

```bash
python3 -m http.server 8765
```

Abra `http://localhost:8765`. Use um servidor local: o script usa módulos JavaScript e pode ser bloqueado pelo navegador quando aberto por `file://`.

## Conteúdo e origem

A marca foi fornecida pela equipe Ovis. `assets/ovis-ficha.webp` é uma captura do protótipo mobile em execução, com dados simulados; `assets/ovis-mobile.webp` permanece disponível, mas não aparece nesta composição. As fotografias do campo são do Unsplash, creditadas no rodapé: Clovis Wood e Jiang Xiaopei. O vídeo do hero (`assets/video/`) foi fornecido pela equipe Ovis e convertido para web sem áudio: `hero.mp4` em 1080p (CRF 22) para telas grandes, `hero-mobile.mp4` em 720p para telas até 760px e `hero.jpg` como poster; com `prefers-reduced-motion` o vídeo não carrega. A prévia desktop em `/desktop/` é separada e usa um mapa esquemático, sem localização real.

A página usa uma única folha, `site.css`: tema escuro, títulos em Bebas Neue, texto em Inter e verde Ovis como cor de destaque. A composição segue o ritmo do subscrr.app — hero fotográfico, frase que acende com o scroll, celular com a tela rolando, ficha do animal, manejos interativos, trilho de recursos, ponte fotográfica, planos, FAQ e encerramento.

## Preços e simulador

A página apresenta 14 dias grátis, Plus a partir de R$ 309,90/mês e Pro a partir de R$ 359,90/mês. A alternância anual mostra o total de 12 mensalidades com 15% de desconto: R$ 3.160,98/ano e R$ 3.670,98/ano, respectivamente. O equivalente mensal do anual é informativo.

Não usamos a tabela antiga por faixa nem presumimos os recursos e limites de cada plano. As condições comerciais ainda precisam ser confirmadas antes da contratação.

## Contato (formulário → planilha → WhatsApp)

Por enquanto o site não cobra: o preço depende do tamanho do rebanho e é combinado na conversa. Os botões dos planos (`data-lead="Teste|Plus|Pro"`) abrem um formulário com nome, WhatsApp, nome da fazenda e tamanho do rebanho. Ao enviar, o contato vai para uma planilha do Google e, em seguida, o site abre o WhatsApp da Ovis com a mensagem pronta. Se a planilha não responder em 4 segundos ou estiver fora do ar, o WhatsApp abre do mesmo jeito; a mensagem leva todos os dados. A lógica fica em `lead.js` (testada em `tests/lead.test.mjs`).

A planilha recebe os dados por um Google Apps Script (`scripts/leads-apps-script.gs`), que grava uma linha por contato na aba `Contatos`. Para ligar:

1. Crie uma planilha no Google Drive da equipe.
2. Na planilha, abra **Extensões → Apps Script**, apague o conteúdo e cole `scripts/leads-apps-script.gs`. Salve.
3. Clique em **Implantar → Nova implantação**, tipo **App da Web**, executar como **Eu** e acesso **Qualquer pessoa**. Autorize quando o Google pedir.
4. Copie a URL do app da web (termina em `/exec`) para `lead-config.json`: `{ "endpoint": "https://script.google.com/macros/s/…/exec" }`.
5. Publique o site e envie o formulário uma vez: a linha deve aparecer na aba `Contatos`.

Com `endpoint` vazio, o formulário pula a planilha e só abre o WhatsApp. O envio usa `no-cors` (o Apps Script não responde CORS), então o site não consegue confirmar a gravação: confira a planilha depois de cada mudança no script. Ao alterar o script, crie uma nova versão em **Implantar → Gerenciar implantações** para a URL continuar a mesma.

### Checkout da AbacatePay (desligado)

O site não usa mais o checkout, mas o código fica no repositório para quando a cobrança online voltar: `scripts/abacatepay-setup.mjs`, `pricing.js`, `checkout-links.json` e `obrigado.html`. Para religar, os botões precisam voltar a apontar para os links de `checkout-links.json`. Cada plano tem um produto mensal e um anual, todos com 14 dias grátis (`trialDays`): o cliente cadastra o cartão, paga R$ 0,00 hoje e a primeira cobrança acontece no fim do teste. Depois do pagamento, a AbacatePay redireciona para `obrigado.html`.

Os links ficam em `checkout-links.json`, gerado por

```bash
# .env (fora do git): ABACATEPAY_API_KEY=abc_dev_...
node scripts/abacatepay-setup.mjs
```

O script lê os preços de `pricing.js`, cria ou reaproveita os produtos (pelo `externalId`) e mantém um checkout pendente para cada plano e período.

**Limitação conhecida:** apesar de a documentação da AbacatePay dizer que um checkout de assinatura gera várias assinaturas, na prática ele fica `PAID` depois do primeiro pagamento e deixa de aceitar novos clientes (links de pagamento reutilizáveis não aceitam produtos com `cycle`). Enquanto não houver um backend criando um checkout por clique, rode o script de novo depois de cada assinatura: ele reaproveita os checkouts ainda `PENDING` e recria os pagos. A chave precisa das permissões `PRODUCT:CREATE`, `PRODUCT:READ`, `SUBSCRIPTION:CREATE` e `SUBSCRIPTION:READ`. Para produção, gere a chave de produção, rode o script de novo e publique o `checkout-links.json` atualizado.

Liberar o acesso no app depois do pagamento é responsabilidade do backend do app, via webhooks `subscription.completed`, `subscription.renewed` e `subscription.cancelled`.

## Animação

Tudo em JavaScript puro (`script.js`), sem biblioteca: títulos sobem de uma máscara linha a linha, blocos entram com desfoque, a frase da segunda seção acende palavra por palavra, a tela do celular rola junto com a página, os números contam, a foto da ponte tem parallax, o toggle de preços desliza e o FAQ abre suavemente. Sem JavaScript ou com `prefers-reduced-motion`, todo o conteúdo aparece estático. Ao mudar `site.css`, incremente o `?v=` no `<link>` e no `<script>` para evitar cache. A classe que esconde os elementos antes da animação (`motion-on`) só é aplicada pelo script atual, então um script antigo em cache nunca deixa a página sem texto.

## SEO e descoberta por buscadores

A página usa título e descrição descritivos, canonical absoluto para `https://ovisapp.com.br/`, metadados Open Graph/Twitter, imagem social própria, linguagem `pt-BR`, conteúdo principal em HTML, JSON-LD `WebSite` e `sitemap.xml` com a home. O texto identifica o público (produtores de ovinos e equipes de fazenda) e deixa claro que o aplicativo exibido é um protótipo com dados simulados. Não publicamos marcação `SoftwareApplication` para rich results porque faltam avaliações e uma oferta comercial validada; não inventar esses campos.

A documentação do Google não exige marcação especial para AI Overviews/AI Mode: indexação, snippet elegível e boas práticas de SEO continuam sendo o caminho. O site fica no domínio próprio `ovisapp.com.br` (arquivo `CNAME`); o endereço antigo `ovis-gestao-de-ovinos.github.io/ovis-site/` redireciona para ele. O sitemap está em `https://ovisapp.com.br/sitemap.xml` e é anunciado no `robots.txt`; para solicitar indexação, a equipe precisa verificar a propriedade no Search Console e enviá-lo. Ao trocar de domínio, atualizar `CNAME`, canonical, URL social, JSON-LD, sitemap e `robots.txt` em conjunto. Não confundir site tecnicamente indexável com ranqueamento garantido.

## Verificação

```bash
node --test tests/*.test.mjs
node --check script.js
```

## Próximos passos antes de contratar

- Confirmar diferenças de recursos, limites de rebanho e regras dos 14 dias entre Plus e Pro.
- Publicar o Apps Script da planilha de contatos e preencher `lead-config.json`.
- Atualizar as capturas do app mobile quando suas telas mudarem.
- Conectar domínio próprio, se disponível.
