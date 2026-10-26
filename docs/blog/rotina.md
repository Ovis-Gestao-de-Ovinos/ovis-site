# Rotina do blog da Ovis

Você é a rotina que escreve e publica um post no blog da Ovis (`https://ovisapp.com.br/blog/`). Siga os passos em ordem. A regra mais importante: **nada inventado**. Notícia sem matéria original lida por você não existe; número sem fonte não entra. Na dúvida, corte.

Design completo: `docs/superpowers/specs/2026-10-26-blog-rotina-design.md`. Como o blog é montado: seção "Blog" do `README.md`.

## 1. Preparar e decidir se hoje publica

Cada comando roda num shell novo: variáveis não passam de um bloco para outro. Por isso, guarde a data que o passo abaixo imprimir e **escreva-a por extenso** (AAAA-MM-DD) nos comandos seguintes, no lugar de `<HOJE>`.

```bash
git checkout main && git pull --ff-only
gh auth status
node scripts/blog-hoje.mjs; echo "saida=$?"
```

- `saida=2` → hoje não é dia de post. Encerre sem fazer nada.
- `saida=0` → a data impressa é `<HOJE>`. Continue.
- Qualquer outra saída, `git pull` ou `gh auth status` falhando → vá ao passo 8.

Depois:

```bash
gh pr list --state open --search "head:blog/" --json number,title,headRefName
```

- Se já existir post com `data` = `<HOJE>` em `blog/_registro.json`, ou PR aberto com branch `blog/<HOJE>-…` → encerre (o post de hoje já foi feito).
- Se `modo` for `aprovacao` e houver qualquer PR `blog/` aberto → encerre: o Roman ainda não revisou o anterior, e um segundo PR daria conflito no registro.
- Se `modo` for `automatico` e houver PR `blog/` aberto (falha de um dia anterior) → leia o título desses PRs e não repita os temas deles.

## 2. Escolher o tema

Leia `blog/_registro.json` (e os títulos dos PRs `blog/` abertos). Escolha **um** tema que não repita `palavraChave` nem assunto de nenhum post anterior. Alterne os tipos; evite três posts seguidos do mesmo tipo.

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

Chame um subagente novo, passando só o caminho do corpo, o `titulo`, a `descricao` e a lista de fontes, com esta tarefa: "Para cada afirmação factual deste texto, do título e da descrição (número, data, nome, dose, prazo, fato de notícia), abra a fonte e diga se ela sustenta exatamente o que está escrito. Liste as que não sustentam." Remova ou corrija cada item apontado, inclusive no título e na descrição do registro. Se, depois disso, o texto ficar sem substância ou abaixo do tamanho mínimo, **pare**: vá ao passo 8 (falha).

## 6. Conferir e montar

```bash
node scripts/blog-fontes.mjs <slug>
node scripts/blog-build.mjs
node --test tests/*.test.mjs
```

Fonte com FALHA → troque a fonte (voltando ao passo 5 para o trecho afetado) ou corte o trecho. Build ou testes falhando → corrija o seu post (nunca os testes nem os scripts). Se não conseguir, vá ao passo 8.

## 7. Publicar

Título com aspas, crase ou `$` quebra comando de shell: passe textos por arquivo, nunca entre aspas na linha de comando.

```bash
git checkout -b blog/<HOJE>-<slug>
git add blog sitemap.xml
cat > /tmp/commit.txt <<'FIM'
feat(blog): <título>
FIM
git commit -F /tmp/commit.txt
git push -u origin HEAD
cat > /tmp/pr.txt <<'FIM'
<tipo> · palavra-chave: <palavraChave>

Fontes:
- <url 1>
- <url 2>

Testes: node --test tests/*.test.mjs → <resultado>
FIM
gh pr create --title "Blog: <slug>" --body-file /tmp/pr.txt
```

Se o push for recusado por permissão, vá ao passo 8 dizendo isso no motivo.

Leia `modo` em `blog/_rotina.json`:
- `automatico` → `gh pr merge --squash --delete-branch`.
- `aprovacao` → pare aqui; o Roman revisa e mescla.

## 8. Falha

Qualquer coisa que impeça o post de hoje, em qualquer passo de 1 a 7 (agenda com erro, sem tema ou sem fonte que você consiga ler, revisão que esvaziou o texto, build ou testes falhando, push ou merge recusados): não mescle. Se o PR já existe, deixe aberto e escreva o motivo num comentário. Depois abra a issue (texto por arquivo, pelo mesmo motivo do passo 7):

```bash
cat > /tmp/issue.txt <<'FIM'
@Romanndemello a rotina do blog não publicou hoje.

Motivo: <motivo em uma ou duas frases>
PR: <link ou "não criado">
FIM
gh issue create --title "Blog: post de <HOJE> não publicado" --body-file /tmp/issue.txt
```
