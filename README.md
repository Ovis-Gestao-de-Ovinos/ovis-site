# Ovis — site do produto

Landing page estática em português para apresentar a Ovis. A sequência editorial (abertura, capítulos do produto, planos e FAQ) se inspira na estrutura do subscrr.app, com conteúdo, fotografia e identidade visual próprios da Ovis. Implementada com HTML, CSS e JavaScript sem etapa de build.

## Executar

```bash
python3 -m http.server 8765
```

Abra `http://localhost:8765`. Use um servidor local: o script usa módulos JavaScript e pode ser bloqueado pelo navegador quando aberto por `file://`.

## Conteúdo e origem

A marca foi fornecida pela equipe Ovis. `assets/ovis-ficha.webp` é uma captura do protótipo mobile em execução, com dados simulados; `assets/ovis-mobile.webp` permanece disponível, mas não aparece nesta composição. As fotografias do campo são do Unsplash, cuja licença dispensa crédito. O vídeo do hero (`assets/video/`) foi fornecido pela equipe Ovis (original 4K, primeiros 16 s) e só toca no computador; no celular (até 760px) fica a foto, para poupar o plano de dados. A foto é um `<picture>` com o quadro de 0,5 s em AVIF: `hero-720.avif` (1280×720) no celular e `hero.avif` (1920×1080) no computador. O vídeo foi convertido sem áudio em três formatos com a mesma qualidade medida por VMAF — AV1 (`hero-av1.mp4`), HEVC (`hero-hevc.mp4`, Safari) e H.264 (`hero.mp4`) — escolhidos pelo `canPlayType`, baixa só depois do evento `load` e aparece por cima da foto quando começa a tocar. Com `prefers-reduced-motion` ou economia de dados, o vídeo não carrega. Ao reconverter, comparar o VMAF contra o original antes de trocar os arquivos. A demonstração desktop em `desktop/` fica só no repositório: o `_config.yml` a exclui do site publicado, junto com `docs/`, `tests/`, `scripts/`, `vendor/`, `README.md` e `checkout-links.json`. Para mostrar a demonstração, rode o servidor local e abra `http://localhost:8765/desktop/`.

A página usa uma única folha, `site.css`: tema escuro, títulos em Bebas Neue, texto em Inter e verde Ovis como cor de destaque. A composição segue o ritmo do subscrr.app — hero fotográfico, frase que acende com o scroll, celular com a tela rolando, ficha do animal, manejos interativos, trilho de recursos, ponte fotográfica, planos, FAQ e encerramento.

## Lançamento e lista de espera

O app é lançado em 14 de novembro de 2026, à meia-noite de Brasília. Até lá, a seção `#lancamento` (que substituiu os planos) mostra a contagem regressiva e o botão "Entrar na lista de espera", que abre o mesmo formulário de contato com o plano `Lista`: o contato vai para a planilha e o WhatsApp abre com a mensagem pronta. Quando a contagem chega a zero, a seção troca para "A Ovis já está disponível" com o botão do teste grátis, e os botões do topo, do hero e do encerramento passam a dizer "Testar 14 dias grátis". A data e a conta ficam em `launch.js` (testado em `tests/launch.test.mjs`). Sem JavaScript, aparece só a data.

Os preços ficam só em `pricing.js`; não aparecem na página, na FAQ, no JSON-LD nem no `llms.txt`. A Plus começa em R$ 309,90/mês e a Pro em R$ 359,90/mês, com 15% de desconto no anual.

## Google Analytics 4 e cookies

`analytics.js` (carregado com `defer` em todas as páginas) liga o GA4 com o modo de consentimento, no mesmo modelo do site da Favo: começa com `analytics_storage` negado e sem cookies, mostra um aviso no canto da tela e só grava os cookies `_ga` se a pessoa aceitar. A escolha fica no `localStorage` em `ovis-cookies`, e o botão "Rever a escolha de cookies" da política de privacidade reabre o aviso. O `gtag.js` só baixa depois do evento `load`. O formulário envia os eventos `abrir_formulario` e `generate_lead`, com o plano escolhido.

O ID de medição fica na constante `GA_ID` do `analytics.js`. Com ela vazia, nada carrega e nenhum aviso aparece. No GA4, marque `generate_lead` como evento principal e deixe a retenção de dados em 14 meses, como diz a política de privacidade.

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

## Blog

O blog fica em `/blog/` e é escrito por uma rotina agendada do Claude Code (instruções em `docs/blog/rotina.md`). Cada post é um item em `blog/_registro.json` (slug, data, tipo, título, descrição, palavra-chave e fontes) mais o miolo do texto em `blog/_corpos/<slug>.html`. O comando `node scripts/blog-build.mjs` gera `blog/<slug>/index.html`, a lista em `blog/index.html` e as entradas do blog no `sitemap.xml`; nunca edite essas páginas à mão. Os arquivos que começam com `_` não são publicados (`_config.yml`). O aviso de consultar um veterinário entra sozinho quando o texto fala de remédio, dose, vacina, vermífugo ou tratamento (`scripts/blog-lib.mjs`). `node scripts/blog-fontes.mjs <slug>` confere se as fontes do post abrem.

A rotina publica todo dia nos 14 dias a partir do primeiro post e depois só às terças e sextas. `node scripts/blog-hoje.mjs` responde se hoje é dia de post (saída 0) ou não (saída 2); qualquer outra saída é erro e vira issue. Em `blog/_rotina.json`, `"modo": "automatico"` faz a rotina mesclar o PR do post sozinha depois dos testes; `"modo": "aprovacao"` deixa o PR aberto para revisão. Quando um post não sai, a rotina abre uma issue no GitHub mencionando o Roman.

## SEO e descoberta por buscadores

A página usa título e descrição descritivos, canonical absoluto para `https://ovisapp.com.br/`, metadados Open Graph/Twitter, imagem social própria, linguagem `pt-BR`, conteúdo principal em HTML, JSON-LD com `WebSite`, `Organization` e `SoftwareApplication` (ofertas Plus e Pro com o preço “a partir de”) e `sitemap.xml` com a home. O texto identifica o público (produtores de ovinos e equipes de fazenda) e deixa claro que o aplicativo exibido é um protótipo com dados simulados. O `SoftwareApplication` ajuda o Google a entender o produto, mas o rich result de app exige avaliações; não inventar `aggregateRating` nem `review`. Ao mudar preços em `pricing.js`, atualizar também as ofertas do JSON-LD e o `llms.txt`.

A documentação do Google não exige marcação especial para AI Overviews/AI Mode: indexação, snippet elegível e boas práticas de SEO continuam sendo o caminho. O site fica no domínio próprio `ovisapp.com.br` (arquivo `CNAME`); o endereço antigo `ovis-gestao-de-ovinos.github.io/ovis-site/` redireciona para ele. O sitemap está em `https://ovisapp.com.br/sitemap.xml` e é anunciado no `robots.txt`; para solicitar indexação, a equipe precisa verificar a propriedade no Search Console e enviá-lo. A imagem de compartilhamento da calculadora (`assets/og-calculadora-gmd.jpg`, 1200×630) é gerada a partir de `scripts/og-calculadora-gmd.html`: suba o servidor local, abra esse arquivo em `/scripts/og-calculadora-gmd.html` numa janela de 1200×630 e salve a captura. Ao trocar de domínio, atualizar `CNAME`, canonical, URL social, JSON-LD, sitemap e `robots.txt` em conjunto. Não confundir site tecnicamente indexável com ranqueamento garantido.

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
