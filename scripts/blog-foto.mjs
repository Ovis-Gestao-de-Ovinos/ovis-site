// Foto do topo de um post, tirada do Wikimedia Commons com licença livre e crédito.
// Uso: node scripts/blog-foto.mjs buscar "<termos em inglês>"
//      node scripts/blog-foto.mjs usar <slug> "File:<nome no Commons>"
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const API = 'https://commons.wikimedia.org/w/api.php';
const AGENTE = 'OvisBlog/1.0 (https://ovisapp.com.br; ovisfinanceiro@gmail.com)';
// 1280 é um dos tamanhos-padrão de miniatura do Commons: arquivo leve e nítido no topo do post.
const LARGURA = 1280;

// Só licenças que permitem uso comercial com crédito.
export const licencaLivre = (nome) => /^(CC0|Public domain|CC BY(-SA)? \d)/i.test(nome ?? '');
const ENTIDADES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };
export const textoPlano = (html) => String(html ?? '').replace(/<[^>]*>/g, ' ').replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (e) => ENTIDADES[e]).replace(/\s+/g, ' ').trim();

async function consultar(params) {
  const url = `${API}?${new URLSearchParams({ action: 'query', format: 'json', prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiextmetadatafilter: 'LicenseShortName|Artist', ...params })}`;
  const res = await fetch(url, { headers: { 'user-agent': AGENTE } });
  if (!res.ok) throw new Error(`Commons respondeu ${res.status}`);
  return Object.values((await res.json()).query?.pages ?? {});
}

// Converte uma página da API num candidato, ou null se não serve (licença, formato, tamanho, retrato).
export function candidato(pagina) {
  const i = pagina.imageinfo?.[0];
  if (!i) return null;
  const m = i.extmetadata ?? {};
  const licenca = m.LicenseShortName?.value;
  if (!licencaLivre(licenca) || i.mime !== 'image/jpeg' || i.width < 1200 || i.width < i.height * 1.2) return null;
  return { titulo: pagina.title, largura: i.width, altura: i.height, licenca, autor: textoPlano(m.Artist?.value) || 'autor desconhecido', origem: i.descriptionurl, imagem: i.thumburl ?? i.url };
}

async function buscar(termos) {
  const paginas = await consultar({ generator: 'search', gsrnamespace: '6', gsrlimit: '30', gsrsearch: `${termos} filetype:bitmap`, iiurlwidth: '600' });
  const lista = paginas.map(candidato).filter(Boolean);
  if (!lista.length) console.log('nenhuma foto com licença livre e paisagem; tente outros termos');
  for (const c of lista) console.log(`${c.titulo}\n  ${c.largura}x${c.altura} · ${c.licenca} · ${c.autor}\n  prévia: ${c.imagem}`);
}

async function usar(slug, titulo) {
  const caminhoRegistro = new URL('../blog/_registro.json', import.meta.url);
  const posts = JSON.parse(readFileSync(caminhoRegistro, 'utf8'));
  const post = posts.find((p) => p.slug === slug);
  if (!post) throw new Error(`post não encontrado no registro: ${slug}`);
  const [pagina] = await consultar({ titles: titulo, iiurlwidth: String(LARGURA) });
  const c = pagina && candidato(pagina);
  if (!c) throw new Error(`foto não serve (inexistente, licença não livre, não JPEG, pequena ou em pé): ${titulo}`);
  const res = await fetch(c.imagem, { headers: { 'user-agent': AGENTE } });
  if (!res.ok) throw new Error(`download falhou: ${res.status}`);
  const arquivo = `/assets/blog/${slug}.jpg`;
  mkdirSync(new URL('../assets/blog/', import.meta.url), { recursive: true });
  writeFileSync(new URL(`..${arquivo}`, import.meta.url), Buffer.from(await res.arrayBuffer()));
  post.foto = { arquivo, autor: c.autor, licenca: c.licenca, origem: c.origem };
  writeFileSync(caminhoRegistro, `${JSON.stringify(posts, null, 2)}\n`);
  console.log(`foto salva em ${arquivo.slice(1)} · ${c.licenca} · ${c.autor}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [acao, ...args] = process.argv.slice(2);
  try {
    if (acao === 'buscar' && args[0]) await buscar(args.join(' '));
    else if (acao === 'usar' && args.length === 2) await usar(...args);
    else throw new Error('uso: blog-foto.mjs buscar "<termos>" | usar <slug> "File:<nome>"');
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
