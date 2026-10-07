# Ovis — site do produto

Landing page estática em português para apresentar o Ovis. Direção editorial fotográfica: hero no campo, manifesto, respiro entre seções, captura real do app, calculadora e limites da demonstração. Implementada com HTML, CSS e JavaScript sem etapa de build. A hierarquia da Abacate Pay e o ritmo visual das referências agro foram usados como inspiração, sem reproduzir sua identidade ou conteúdo.

## Executar

```bash
python3 -m http.server 8765
```

Abra `http://localhost:8765`. Use um servidor local: o script usa módulos JavaScript e pode ser bloqueado pelo navegador quando aberto por `file://`.

## Conteúdo e origem

A marca foi fornecida pela equipe Ovis. `assets/ovis-ficha.webp` é uma captura do protótipo mobile em execução, com dados simulados; `assets/ovis-mobile.webp` permanece disponível, mas não aparece nesta composição. As fotografias do campo são do Unsplash, creditadas no rodapé: Nick Cozier, Clovis Wood e Jiang Xiaopei. A prévia desktop em `/desktop/` é separada e usa um mapa esquemático, sem localização real.

A página usa `styles.css` e `enhancements.css` para a calculadora e `field-notes.css` para a nova composição. Animações editoriais usam CSS e IntersectionObserver; sem JavaScript o conteúdo permanece visível.

## Preços e simulador

A calculadora exibe as 15 combinações da tabela fornecida pela equipe Ovis: 5 faixas de rebanho × Basic/Plus/Pro, com alternância mensal/anual. O valor anual é o total de 12 meses com 15% de desconto; o equivalente mensal é o valor da coluna enviada, arredondado a centavos.

As linhas `250*` e `500*` não trazem a explicação do asterisco. O site **assume provisoriamente** 101–250 e 251–500 ovinos; acima de 500 não apresenta preço. O mensal Pro/500 está parcialmente coberto na imagem, mas o valor R$ 1.099,90 é confirmado pela coluna anual (R$ 11.218,98 ÷ 10,2). Diferenças de recursos entre os planos não foram informadas: não afirmar que um é ideal, nem inventar funcionalidades. Validar as condições comerciais antes de contratação.

## Estado do produto

O app mobile continua sendo um protótipo demonstrativo sem conta, servidor ou assinatura ativa nesta versão. O link para `/desktop/` é secundário; as movimentações no mapa ficam somente no navegador do visitante, sem sincronização com o app mobile. A calculadora é informativa; o site não processa pagamentos.

## Animação

Anime.js 4.5.0 está em `vendor/` com licença MIT. O cálculo de preços usa uma transição discreta quando a pessoa muda a faixa; com `prefers-reduced-motion`, não há animação. O conteúdo permanece disponível sem movimento.

## SEO e descoberta por buscadores

A página usa título e descrição descritivos, canonical absoluto para `/ovis-site/`, metadados Open Graph/Twitter, imagem social própria, linguagem `pt-BR`, conteúdo principal em HTML, JSON-LD `WebSite` e `sitemap.xml` com a home. O texto identifica o público (produtores de ovinos e equipes de fazenda) e deixa claro que o aplicativo exibido é um protótipo com dados simulados. Não publicamos marcação `SoftwareApplication` para rich results porque faltam avaliações e uma oferta comercial validada; não inventar esses campos.

A documentação do Google não exige marcação especial para AI Overviews/AI Mode: indexação, snippet elegível e boas práticas de SEO continuam sendo o caminho. O sitemap está disponível em `https://ovis-gestao-de-ovinos.github.io/ovis-site/sitemap.xml`; para solicitar indexação, a equipe precisa verificar a propriedade no Search Console e enviá-lo. `robots.txt` em um subdiretório do GitHub Pages não controlaria o host `github.io`, por isso não foi criado. Quando houver domínio próprio, atualizar canonical, URL social, JSON-LD e sitemap em conjunto. Não confundir site tecnicamente indexável com ranqueamento garantido.

## Verificação

```bash
node --test tests/*.test.mjs
node --check script.js
```

## Próximos passos antes de contratar

- Confirmar asteriscos e diferenças de recursos entre Basic, Plus e Pro.
- Definir canal de contato/contratação real para o CTA.
- Atualizar as capturas do app mobile quando suas telas mudarem.
- Conectar domínio próprio, se disponível.
