# Blog da Ovis com rotina automática

Data: 2026-10-26 · Escopo: seção `/blog/` no site estático e uma rotina agendada que pesquisa, escreve e publica posts.

## Por que

Ganhar tráfego orgânico. Hoje o site tem quatro páginas indexáveis. O blog cria páginas sobre o nicho que respondem ao que criadores de ovinos pesquisam no Google, e a Ovis aparece no caminho.

**Leitor:** criador de ovinos, ou alguém começando na atividade, que pesquisou uma notícia do setor, uma informação técnica ou uma dica de manejo. É o mesmo público do site (ver `2026-10-19-copy-site-design.md`): o filho ou filha veterinária e o pai, dono da fazenda.

## Decisões do Roman

- **Publica sozinha**, sem aprovação, até ele pedir para trocar para aprovação manual. A troca precisa ser simples.
- **Ritmo:** 1 post por dia nas duas primeiras semanas, depois 2 por semana. As duas semanas contam a partir do primeiro post publicado.
- **Conteúdo:** notícias atuais do nicho, curiosidades e informações/dicas práticas.
- **Remédio, dose e tratamento podem aparecer**, mas sempre com aviso claro de consultar um veterinário antes de qualquer aplicação.
- **O pior resultado possível:** informação errada ou notícia inventada.

## Objetivos

1. Publicar no ritmo combinado, sem intervenção humana.
2. Cada post responde a uma busca real do nicho, com título, descrição e estrutura bons para SEO.
3. Zero afirmação sem fonte. Notícia só com matéria original verificada.
4. Blog integrado ao site: mesmo visual, sitemap, `llms.txt`, links internos.

## Não-objetivos

- Comentários, newsletter, páginas por categoria ou tag, busca no blog.
- Imagem gerada por IA ou foto nova por post.
- Posts em outro idioma.

## Anti-objetivos (falha mesmo funcionando)

- Notícia inventada, data errada, número sem fonte, fonte que não diz o que o post afirma.
- Dose ou tratamento sem o aviso do veterinário.
- Texto copiado das fontes. Reescrever com palavras próprias; citação literal só curta e entre aspas, com crédito.
- Posts quase iguais entre si, ou enchimento de palavra-chave.
- Prometer da Ovis algo que não existe (regras da copy do site), citar preços, inventar depoimento ou número de clientes.

## Como fica no site

- `/blog/` lista os posts, do mais novo ao mais antigo: título, data, resumo de uma linha.
- `/blog/<slug>/index.html` para cada post. HTML estático no mesmo molde de `calculadora-gmd/index.html`: mesmo `<head>` base (fontes, `site.css?v=N`, `analytics.js`, favicon), mesmo header e footer, classe `doc` no `<main>`.
- Cada post tem: `<title>` e `description` próprios, `canonical`, Open Graph (imagem padrão `assets/ovis-social.jpg`), JSON-LD `BlogPosting` (ou `NewsArticle` para notícia) com `datePublished`, `author` e `publisher` apontando para a organização Ovis (`https://ovisapp.com.br/#organization`).
- Estrutura do post: H1, data visível, texto com H2, seção **Fontes** no fim com os links usados, e um parágrafo curto final sobre a Ovis com link para `/#lancamento` (funciona antes e depois do lançamento de 14/11).
- Quando o post fala de remédio, dose, vermífugo, vacina ou tratamento: caixa de aviso visível perto do topo, com texto fixo: "Estas informações são educativas. Consulte um médico veterinário antes de aplicar qualquer medicamento ou tratamento."
- Link "Blog" no footer de todas as páginas (`index.html`, `sobre/`, `privacidade/`, `calculadora-gmd/`, posts). Post pode linkar a calculadora de GMD quando o tema for peso ou engorda.
- `sitemap.xml` ganha `/blog/` e cada post com `lastmod`. `llms.txt` ganha uma linha para o blog.

## Tipos de post

- **Notícia:** algo do setor publicado nos últimos ~7 dias (mercado de cordeiro e lã, sanidade, eventos e feiras, pesquisa, políticas públicas). Fato principal confirmado na fonte original aberta pela rotina. 400–700 palavras: o que aconteceu, por que importa para o criador, fonte.
- **Guia/dica:** manejo, sanidade, reprodução, nutrição, pesagem, raças. Responde a uma pergunta de busca ("como calcular...", "quando vermifugar..."). 800–1.400 palavras.
- **Curiosidade:** fato interessante do mundo ovino, com fonte. 400–800 palavras.

Se num dia não houver notícia nova e verificável, publica guia ou curiosidade. Nunca força notícia.

## Regras de conteúdo

- Fontes aceitas para dado técnico: Embrapa (Caprinos e Ovinos, Pecuária Sul), universidades e periódicos científicos, MAPA e secretarias estaduais, Emater, associações de criadores (ARCO e de raça), veículos de imprensa agro reconhecidos para notícias. Blog de vendedor de produto não vale como fonte de dado técnico.
- A rotina só cita fonte que ela mesma conseguiu abrir e ler. Na checagem final, o link precisa responder 2xx depois de seguir redirecionamentos, com uma nova tentativa em caso de falha. Fonte atrás de paywall ou bloqueada (403) para a rotina não serve: troca por outra.
- Voz da copy do site: português simples, termo técnico com a tradução ao lado, sem linguagem de startup ("solução", "potencialize", "jornada").
- Público é brasileiro; quando um dado depende da região (clima, raça, época), dizer de qual região é.

## A rotina

- Roda na nuvem como rotina agendada do Claude Code sobre o repositório `Ovis-Gestao-de-Ovinos/ovis-site`.
- Agenda: todo dia às 07:00 (Brasília). Nos 14 dias a partir do primeiro post (data gravada na configuração) publica todo dia; depois só publica terça e sexta, e nos outros dias sai sem fazer nada.
- Passos de cada execução:
  1. Ler o modo e o registro (abaixo) e decidir se hoje publica.
  2. Pesquisar notícias recentes e temas de busca do nicho; escolher um tema que não repita os do registro.
  3. Abrir e ler as fontes; escrever o post só com o que as fontes dizem.
  4. Revisão separada: conferir cada afirmação contra as fontes, remover o que não bater, checar o aviso do veterinário, checar os links.
  5. Gerar a página, atualizar `/blog/`, `sitemap.xml` e o registro; rodar `node --test tests/*.test.mjs`.
  6. Publicar conforme o modo.
- **Modo** fica num arquivo de configuração do blog no repositório, com `modo: automatico` ou `modo: aprovacao`.
  - `automatico`: cria branch, abre PR, roda `node --test tests/*.test.mjs` e, se passar, faz o merge na `main` com `gh pr merge --squash`. O GitHub Pages publica. Não há CI no repositório; a rotina é quem roda os testes. Para isso a rotina precisa de permissão de push/merge na `main` (configuração do ambiente da rotina, feita uma vez pelo Roman ao criar).
  - `aprovacao`: abre o PR e para. Roman aprova e faz merge.
  - Trocar de modo = mudar essa linha (Roman pode pedir ao Claude).
- Se os testes falharem ou a revisão não fechar, não publica: deixa o PR aberto com o motivo e abre uma issue no GitHub marcando o Roman (login `Romanndemello`), com o motivo e o link do PR. Decisão do Roman: o aviso de falha é por issue.
- **Registro** (arquivo no repositório): slug, data, tipo, título, palavra-chave principal e fontes de cada post. Usado para não repetir tema e para variar os tipos.

## Testes

Novo `tests/blog.test.mjs`, rodado com os outros:

- Todo post listado no registro existe, aparece em `/blog/` e no `sitemap.xml`, e vice-versa.
- Cada post tem `title`, `description`, `canonical` correto, JSON-LD válido, seção Fontes com pelo menos um link e o link para `/#lancamento`.
- Post que menciona remédio, dose, vermífugo, vacina ou tratamento tem o aviso do veterinário.
- Nenhum post contém `R$` seguido de preço da Ovis nem os termos proibidos da copy.
- Footer de todas as páginas tem o link do blog.

## Ficam a cargo de quem construir

- Formato do registro e da configuração (JSON, YAML ou Markdown) e onde ficam. Se ficarem dentro de `blog/`, garantir que o Jekyll não publique o que não precisa ser público.
- Se a página `/blog/` e o sitemap são gerados por um script (por exemplo `scripts/blog-build.mjs`, testado) ou editados pela rotina. Script é o preferido, para a rotina errar menos.
- Estilo visual dos elementos novos (lista do blog, caixa de aviso), dentro do `site.css` atual, incrementando o `?v=`.
- Texto exato do prompt da rotina, desde que cubra as regras acima.

## Decisões minhas (Claude), não confirmadas pelo Roman

- URL `/blog/<slug>/`, imagem OG padrão, sem imagem por post.
- Rotina às 07:00 com agenda diária e filtro de dia no prompt, em vez de trocar a agenda em 10/11.
- Publicação via PR com merge automático, para ficar rastro como nos PRs atuais.
- Tamanhos de texto por tipo.
- Primeiro post assim que a estrutura do blog estiver no ar; não há prazo fixo.
- Sem GitHub Actions: os testes rodam dentro da rotina antes do merge.
- Checagem de links com 2xx após redirecionamento e uma nova tentativa.
