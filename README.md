# Ovis — site do produto

Landing page estática em português para apresentar a direção do Ovis. Implementada com HTML, CSS e JavaScript sem dependências de build.

## Executar

```bash
python3 -m http.server 8765
```

Abra `http://localhost:8765`. Também funciona abrindo `index.html` diretamente.

## Conteúdo e origem

A paleta (`#1E4D2B`, `#4CAF50`), marca e direção de tipografia vêm de `ovis-front-mob/src/theme/` e `context.md`. O ícone e favicon foram copiados de `ovis-front-mob/assets/`. A ficha da Estrela e os indicadores do painel usam **dados simulados** de `src/mocks/data.ts`. A prévia do produto é uma interpretação HTML das telas, não uma captura nem acesso ao aplicativo.

## Preços e simulador

A calculadora exibe as 15 combinações da tabela fornecida pela equipe Ovis: 5 faixas de rebanho × Basic/Plus/Pro, com alternância mensal/anual. O valor anual é o total de 12 meses com 15% de desconto; o equivalente mensal é o valor da coluna enviada, arredondado a centavos.

As linhas `250*` e `500*` não trazem a explicação do asterisco. O site **assume provisoriamente** 101–250 e 251–500 ovinos; acima de 500 não apresenta preço. O mensal Pro/500 está parcialmente coberto na imagem, mas o valor R$ 1.099,90 é confirmado pela coluna anual (R$ 11.218,98 ÷ 10,2). Diferenças de recursos entre os planos não foram informadas: não afirmar que um é ideal, nem inventar funcionalidades. Validar as condições comerciais antes de contratação.

## Estado do produto

O app original continua sendo um protótipo demonstrativo sem autenticação, servidor ou assinatura ativa. A calculadora é informativa; o site não processa pagamentos.

## Referências e animação

Direção editorial, não cópia: [Encyclopedia of the Farm](https://www.awwwards.com/sites/encyclopedia-of-the-farm) (ritmo editorial), [Farm Minerals](https://www.awwwards.com/sites/farm-minerals) (narrativa agrícola e interação) e [Diesel Farm](https://www.awwwards.com/sites/diesel-farm) (contraste verde/creme). Anime.js 4.5.0 está em `vendor/` com licença MIT; é usado em entrada e transições com respeito a `prefers-reduced-motion`. A interface funciona sem movimento.

## Verificação

```bash
node --test tests/pricing.test.mjs
node --check script.js
```

## Próximos passos antes de contratar

- Confirmar asteriscos e diferenças de recursos entre Basic, Plus e Pro.
- Definir canal de contato/contratação real para o CTA.
- Substituir a prévia ilustrativa por capturas aprovadas do app, se desejado.
- Conectar domínio próprio, se disponível.
