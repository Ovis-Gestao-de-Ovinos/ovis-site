# Ovis — site do produto

Landing page estática em português para apresentar o Ovis. A sequência editorial (abertura, capítulos do produto, planos e FAQ) se inspira na estrutura do subscrr.app, com conteúdo, fotografia e identidade visual próprios da Ovis. Implementada com HTML, CSS e JavaScript sem etapa de build.

## Executar

```bash
python3 -m http.server 8765
```

Abra `http://localhost:8765`. Use um servidor local: o script usa módulos JavaScript e pode ser bloqueado pelo navegador quando aberto por `file://`.

## Conteúdo e origem

A marca foi fornecida pela equipe Ovis. `assets/ovis-ficha.webp` é uma captura do protótipo mobile em execução, com dados simulados; `assets/ovis-mobile.webp` permanece disponível, mas não aparece nesta composição. As fotografias do campo são do Unsplash, creditadas no rodapé: Nick Cozier, Clovis Wood e Jiang Xiaopei. A prévia desktop em `/desktop/` é separada e usa um mapa esquemático, sem localização real.

A página usa `styles.css`, `enhancements.css`, `field-notes.css` e `landing.css` para os novos capítulos e planos. Animações editoriais usam CSS e IntersectionObserver; sem JavaScript o conteúdo permanece visível e os valores mensais aparecem no HTML.

## Preços e simulador

A página apresenta 14 dias grátis, Plus a partir de R$ 309,90/mês e Pro a partir de R$ 359,90/mês. A alternância anual mostra o total de 12 mensalidades com 15% de desconto: R$ 3.160,98/ano e R$ 3.670,98/ano, respectivamente. O equivalente mensal do anual é informativo.

Não usamos a tabela antiga por faixa nem presumimos os recursos e limites de cada plano. As condições comerciais ainda precisam ser confirmadas antes da contratação.

## Estado do produto

O app mobile continua sendo um protótipo demonstrativo sem conta, servidor ou assinatura ativa nesta versão. O link para `/desktop/` é secundário; as movimentações no mapa ficam somente no navegador do visitante, sem sincronização com o app mobile. O site apresenta os preços, mas não ativa o teste nem processa pagamentos. Os CTAs levam a seções informativas até existir um destino real de cadastro/contratação.

## Animação

Os capítulos usam CSS e IntersectionObserver; com `prefers-reduced-motion`, não há animação. O conteúdo permanece disponível sem movimento. O código de Anime.js legado permanece em `vendor/`, mas não é carregado pela página.

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
