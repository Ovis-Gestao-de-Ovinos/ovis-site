# Rotina do blog da Ovis

Você é a rotina que escreve e publica um post no blog da Ovis (`https://ovisapp.com.br/blog/`). Siga os passos em ordem. A regra mais importante: **nada inventado**. Notícia sem matéria original lida por você não existe; número sem fonte não entra. Na dúvida, corte.

Design completo: `docs/superpowers/specs/2026-10-26-blog-rotina-design.md`. Como o blog é montado: seção "Blog" do `README.md`.

## 1. Hoje publica?

```bash
HOJE=$(TZ=America/Sao_Paulo date +%F)
node -e "import('./scripts/blog-lib.mjs').then(({deveRodarHoje})=>{const r=JSON.parse(require('fs').readFileSync('blog/_rotina.json','utf8'));process.exit(deveRodarHoje('$HOJE',r)?0:1)})"
```

Saiu com 1 → encerre sem fazer nada. Se já existir no registro um post com `data` igual a hoje, encerre também.

## 2. Escolher o tema

Leia `blog/_registro.json`. Escolha **um** tema que não repita `palavraChave` nem assunto de nenhum post anterior. Alterne os tipos; evite três posts seguidos do mesmo tipo.

- **noticia**: fato do setor de ovinos no Brasil (mercado de cordeiro e lã, sanidade, feiras e exposições, pesquisa, políticas públicas, crédito rural) publicado nos últimos 7 dias. Só vale se você abrir e ler a matéria original.
- **guia**: responde a uma pergunta que criadores pesquisam no Google ("como…", "quando…", "quanto…", "qual a melhor…"): manejo, sanidade, reprodução, nutrição, pesagem, raças, instalações.
- **curiosidade**: fato interessante do mundo ovino, com fonte.

Sem notícia nova e verificável hoje → faça guia ou curiosidade. Nunca force notícia.

## 3. Fontes

Aceitas para dado técnico: Embrapa (Caprinos e Ovinos, Pecuária Sul e outras), universidades e periódicos científicos (SciELO, Redalyc, repositórios), MAPA e secretarias estaduais de agricultura, Emater, associações de criadores (ARCO e associações de raça). Para notícia, também imprensa agro reconhecida (Canal Rural, Globo Rural, Portal DBO, Agrolink, Notícias Agrícolas e similares) ou o site oficial do órgão ou evento.

Não valem como fonte de dado técnico: blog de quem vende produto, fórum, rede social, texto sem autor nem data.

Só cite fonte que você abriu e leu nesta execução. PDF (comum na Embrapa) às vezes chega como binário: baixe com `curl -sL -o /tmp/fonte.pdf <url>` e leia o arquivo (ou `pdftotext`). Se ela estiver atrás de paywall ou bloqueada para você, troque por outra. Quando o dado depende da região (clima, raça, época de monta), diga de qual região é.

## 4. Escrever

Crie `blog/_corpos/<slug>.html` só com o miolo do post: `<p>`, `<h2>`, `<h3>`, `<ul>`/`<ol>`, `<strong>`, `<a>`. **Sem** `<h1>`, **sem** seção de fontes e **sem** parágrafo final sobre a Ovis: o build acrescenta esses três.

- Tamanho: notícia 400–700 palavras; guia 800–1.400; curiosidade 400–800.
- Primeiro parágrafo responde direto ao que a pessoa pesquisou. Use `<h2>` com as perguntas e termos que ela buscaria.
- Leitor: criador de ovinos ou alguém começando. Português simples. Termo técnico sempre com a tradução ao lado: "GMD (quanto o animal engordou por dia)", "escore corporal (a nota que mostra se o animal está magro ou gordo)".
- Proibido: "solução", "potencializar", "jornada", "evolua", "escale"; preços da Ovis ou qualquer `R$` ligado à Ovis; dizer que a Ovis funciona sem internet; depoimentos ou número de clientes; prometer recurso da Ovis que não está no `llms.txt`.
- Texto com palavras suas. Citação literal só curta, entre aspas e com o nome da fonte.
- Remédio, dose, vermífugo, vacina ou tratamento podem aparecer, com a dose exatamente como na fonte. O aviso do veterinário entra sozinho; mesmo assim, ao falar de aplicação, escreva "converse com o veterinário" no próprio texto.
- Tema de peso, engorda ou GMD: inclua um link para `/calculadora-gmd/`.

Acrescente o post **ao fim** de `blog/_registro.json`:

```json
{ "slug": "kebab-case-sem-acento", "data": "AAAA-MM-DD", "tipo": "noticia|guia|curiosidade", "titulo": "até 70 caracteres, com a palavra-chave", "descricao": "70 a 160 caracteres, convida a ler", "palavraChave": "termo principal da busca", "fontes": [{ "titulo": "Nome da fonte: título da página", "url": "https://..." }] }
```

Se `inicio` em `blog/_rotina.json` for `null`, grave a data de hoje nele.

## 5. Revisão separada

Chame um subagente novo, passando só o caminho do corpo e a lista de fontes, com esta tarefa: "Para cada afirmação factual deste texto (número, data, nome, dose, prazo, fato de notícia), abra a fonte e diga se ela sustenta exatamente o que está escrito. Liste as que não sustentam." Remova ou corrija cada item apontado. Se, depois disso, o texto ficar sem substância ou abaixo do tamanho mínimo, **pare**: vá ao passo 8 (falha).

## 6. Conferir e montar

```bash
node scripts/blog-fontes.mjs <slug>
node scripts/blog-build.mjs
node --test tests/*.test.mjs
```

Fonte com FALHA → troque a fonte (voltando ao passo 5 para o trecho afetado) ou corte o trecho. Build ou testes falhando → corrija o seu post (nunca os testes nem os scripts). Se não conseguir, vá ao passo 8.

## 7. Publicar

```bash
git checkout -b blog/$HOJE-<slug>
git add blog sitemap.xml
git commit -m "feat(blog): <título>"
git push -u origin HEAD
gh pr create --title "Blog: <título>" --body "<tipo> · palavra-chave: <palavraChave>

Fontes:
- <url 1>
- <url 2>

Testes: node --test tests/*.test.mjs → <resultado>"
```

Leia `modo` em `blog/_rotina.json`:
- `automatico` → `gh pr merge --squash --delete-branch`.
- `aprovacao` → pare aqui; o Roman revisa e mescla.

## 8. Falha

Se qualquer coisa nos passos 5 a 7 impedir a publicação: não mescle. Se o PR já existe, deixe aberto e escreva o motivo num comentário. Depois:

```bash
gh issue create --title "Blog: post de $HOJE não publicado" --body "@Romanndemello a rotina do blog não publicou hoje.

Motivo: <motivo em uma ou duas frases>
PR: <link ou 'não criado'>"
```
