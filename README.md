# Ovis — site do produto

Landing page estática em português para apresentar a direção do Ovis. Implementada com HTML, CSS e JavaScript sem dependências de build.

## Executar

```bash
python3 -m http.server 8765
```

Abra `http://localhost:8765`. Também funciona abrindo `index.html` diretamente.

## Conteúdo e origem

A paleta (`#1E4D2B`, `#4CAF50`) e a tipografia vêm de `ovis-front-mob/src/theme/`. A marca foi fornecida pela equipe Ovis. A imagem `assets/desktop-map.webp` é uma captura da demonstração desktop publicada em `/desktop/`, recortada para mostrar o produto; a prévia com abas abaixo é uma interpretação HTML das telas mobile. A ficha da Estrela e os indicadores usam **dados simulados**. O mapa é esquemático, não georreferenciado.

## Preços e simulador

A calculadora exibe as 15 combinações da tabela fornecida pela equipe Ovis: 5 faixas de rebanho × Basic/Plus/Pro, com alternância mensal/anual. O valor anual é o total de 12 meses com 15% de desconto; o equivalente mensal é o valor da coluna enviada, arredondado a centavos.

As linhas `250*` e `500*` não trazem a explicação do asterisco. O site **assume provisoriamente** 101–250 e 251–500 ovinos; acima de 500 não apresenta preço. O mensal Pro/500 está parcialmente coberto na imagem, mas o valor R$ 1.099,90 é confirmado pela coluna anual (R$ 11.218,98 ÷ 10,2). Diferenças de recursos entre os planos não foram informadas: não afirmar que um é ideal, nem inventar funcionalidades. Validar as condições comerciais antes de contratação.

## Estado do produto

O app original continua sendo um protótipo demonstrativo sem autenticação, servidor ou assinatura ativa. O CTA "Abrir demonstração" leva ao front desktop em `/desktop/`; as movimentações são salvas somente no navegador do visitante, sem sincronização com o app mobile. A calculadora é informativa; o site não processa pagamentos.

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
- Atualizar a captura do mapa quando o front desktop mudar.
- Conectar domínio próprio, se disponível.
