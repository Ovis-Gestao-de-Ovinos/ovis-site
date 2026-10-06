# Ovis — site do produto

Landing page estática em português para apresentar a direção do Ovis. Implementada com HTML, CSS e JavaScript sem dependências de build.

## Executar

```bash
python3 -m http.server 8765
```

Abra `http://localhost:8765`. Também funciona abrindo `index.html` diretamente.

## Conteúdo e origem

A paleta e a tipografia vêm do app em `ovis-front-mob/src/theme/`. A marca foi fornecida pela equipe Ovis. `assets/ovis-mobile.webp` e `assets/ovis-ficha.webp` são capturas do protótipo mobile executado no navegador; ambas exibem dados simulados. A prévia desktop em `/desktop/` é separada e usa um mapa esquemático, sem localização real.

## Preços e simulador

A calculadora exibe as 15 combinações da tabela fornecida pela equipe Ovis: 5 faixas de rebanho × Basic/Plus/Pro, com alternância mensal/anual. O valor anual é o total de 12 meses com 15% de desconto; o equivalente mensal é o valor da coluna enviada, arredondado a centavos.

As linhas `250*` e `500*` não trazem a explicação do asterisco. O site **assume provisoriamente** 101–250 e 251–500 ovinos; acima de 500 não apresenta preço. O mensal Pro/500 está parcialmente coberto na imagem, mas o valor R$ 1.099,90 é confirmado pela coluna anual (R$ 11.218,98 ÷ 10,2). Diferenças de recursos entre os planos não foram informadas: não afirmar que um é ideal, nem inventar funcionalidades. Validar as condições comerciais antes de contratação.

## Estado do produto

O app mobile continua sendo um protótipo demonstrativo sem conta, servidor ou assinatura ativa nesta versão. O link para `/desktop/` é secundário; as movimentações no mapa ficam somente no navegador do visitante, sem sincronização com o app mobile. A calculadora é informativa; o site não processa pagamentos.

## Animação

Anime.js 4.5.0 está em `vendor/` com licença MIT. O cálculo de preços usa uma transição discreta quando a pessoa muda a faixa; com `prefers-reduced-motion`, não há animação. O conteúdo permanece disponível sem movimento.

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
