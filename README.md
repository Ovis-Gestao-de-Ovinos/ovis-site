# Ovis — site do produto

Landing page estática em português para apresentar o Ovis. A sequência editorial (abertura, capítulos do produto, planos e FAQ) se inspira na estrutura do subscrr.app, com conteúdo, fotografia e identidade visual próprios da Ovis. Implementada com HTML, CSS e JavaScript sem etapa de build.

## Executar

```bash
python3 -m http.server 8765
```

Abra `http://localhost:8765`. Use um servidor local: o script usa módulos JavaScript e pode ser bloqueado pelo navegador quando aberto por `file://`.

## Conteúdo e origem

A marca foi fornecida pela equipe Ovis. `assets/ovis-ficha.webp` é uma captura do protótipo mobile em execução, com dados simulados; `assets/ovis-mobile.webp` permanece disponível, mas não aparece nesta composição. As fotografias do campo são do Unsplash, creditadas no rodapé: Nick Cozier, Clovis Wood e Jiang Xiaopei. A prévia desktop em `/desktop/` é separada e usa um mapa esquemático, sem localização real.

A página usa uma única folha, `site.css`: tema escuro, títulos em Bebas Neue, texto em Inter e verde Ovis como cor de destaque. A composição segue o ritmo do subscrr.app — hero fotográfico, frase que acende com o scroll, celular com a tela rolando, ficha do animal, manejos interativos, trilho de recursos, ponte fotográfica, planos, FAQ e encerramento.

## Preços e simulador

A página apresenta 14 dias grátis, Plus a partir de R$ 309,90/mês e Pro a partir de R$ 359,90/mês. A alternância anual mostra o total de 12 mensalidades com 15% de desconto: R$ 3.160,98/ano e R$ 3.670,98/ano, respectivamente. O equivalente mensal do anual é informativo.

Não usamos a tabela antiga por faixa nem presumimos os recursos e limites de cada plano. As condições comerciais ainda precisam ser confirmadas antes da contratação.

## Contratação (AbacatePay)

Os botões dos planos levam a checkouts de assinatura hospedados pela AbacatePay. Cada plano tem um produto mensal e um anual, todos com 14 dias grátis (`trialDays`): o cliente cadastra o cartão, paga R$ 0,00 hoje e a primeira cobrança acontece no fim do teste. Depois do pagamento, a AbacatePay redireciona para `obrigado.html`.

Um checkout de assinatura pode ser pago por vários clientes, então o site é estático: os links ficam em `checkout-links.json`, gerado por

```bash
# .env (fora do git): ABACATEPAY_API_KEY=abc_dev_...
node scripts/abacatepay-setup.mjs
```

O script lê os preços de `pricing.js`, cria ou reaproveita os produtos e checkouts (pelo `externalId`) e grava os links. A chave precisa das permissões `PRODUCT:CREATE`, `PRODUCT:READ`, `SUBSCRIPTION:CREATE` e `SUBSCRIPTION:READ`. Com chave de Dev mode, o site mostra o aviso de ambiente de teste. Para produção, gere a chave de produção, rode o script de novo e publique o `checkout-links.json` atualizado. Sem links configurados, os botões levam às dúvidas.

Liberar o acesso no app depois do pagamento é responsabilidade do backend do app, via webhooks `subscription.completed`, `subscription.renewed` e `subscription.cancelled`.

## Animação

Tudo em JavaScript puro (`script.js`), sem biblioteca: títulos sobem de uma máscara linha a linha, blocos entram com desfoque, a frase da segunda seção acende palavra por palavra, a tela do celular rola junto com a página, os números contam, a foto da ponte tem parallax, o toggle de preços desliza e o FAQ abre suavemente. Sem JavaScript ou com `prefers-reduced-motion`, todo o conteúdo aparece estático. Ao mudar `site.css`, incremente o `?v=` no `<link>` e no `<script>` para evitar cache. A classe que esconde os elementos antes da animação (`motion-on`) só é aplicada pelo script atual, então um script antigo em cache nunca deixa a página sem texto.

## SEO e descoberta por buscadores

A página usa título e descrição descritivos, canonical absoluto para `/ovis-site/`, metadados Open Graph/Twitter, imagem social própria, linguagem `pt-BR`, conteúdo principal em HTML, JSON-LD `WebSite` e `sitemap.xml` com a home. O texto identifica o público (produtores de ovinos e equipes de fazenda) e deixa claro que o aplicativo exibido é um protótipo com dados simulados. Não publicamos marcação `SoftwareApplication` para rich results porque faltam avaliações e uma oferta comercial validada; não inventar esses campos.

A documentação do Google não exige marcação especial para AI Overviews/AI Mode: indexação, snippet elegível e boas práticas de SEO continuam sendo o caminho. O sitemap está disponível em `https://ovis-gestao-de-ovinos.github.io/ovis-site/sitemap.xml`; para solicitar indexação, a equipe precisa verificar a propriedade no Search Console e enviá-lo. `robots.txt` em um subdiretório do GitHub Pages não controlaria o host `github.io`, por isso não foi criado. Quando houver domínio próprio, atualizar canonical, URL social, JSON-LD e sitemap em conjunto. Não confundir site tecnicamente indexável com ranqueamento garantido.

## Verificação

```bash
node --test tests/*.test.mjs
node --check script.js
```

## Próximos passos antes de contratar

- Confirmar diferenças de recursos, limites de rebanho e regras dos 14 dias entre Plus e Pro.
- Definir um destino real de cadastro/contratação para os CTAs antes de prometer ativação automática.
- Atualizar as capturas do app mobile quando suas telas mudarem.
- Conectar domínio próprio, se disponível.
