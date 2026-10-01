# Ovis — site do produto

Landing page estática em português para apresentar a direção do Ovis. Implementada com HTML, CSS e JavaScript sem dependências de build.

## Executar

```bash
python3 -m http.server 8765
```

Abra `http://localhost:8765`. Também funciona abrindo `index.html` diretamente.

## Conteúdo e origem

A paleta (`#1E4D2B`, `#4CAF50`), marca e direção de tipografia vêm de `ovis-front-mob/src/theme/` e `context.md`. O ícone e favicon foram copiados de `ovis-front-mob/assets/`. A ficha da Estrela e os indicadores do painel usam **dados simulados** de `src/mocks/data.ts`. A prévia do produto é uma interpretação HTML das telas, não uma captura nem acesso ao aplicativo.

## Estado do produto

O aplicativo original é um protótipo demonstrativo sem autenticação, servidor ou assinaturas. Por isso o site não promete preços, contas ou sincronização de produção e não simula um formulário de cadastro.

## Próximos passos antes de lançar

- Definir proposta comercial, público prioritário e oferta com a equipe.
- Disponibilizar endereço real de demonstração ou contato para um CTA de conversão.
- Substituir a prévia ilustrativa por capturas aprovadas do aplicativo, se desejado.
- Conectar domínio e hospedagem estática.
