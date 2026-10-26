// Confere se as fontes de um post abrem. Uso: node scripts/blog-fontes.mjs <slug>
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const NAVEGADOR = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

// Ok quando o destino final, depois dos redirecionamentos, responde 2xx. Uma nova tentativa em caso de falha.
export async function checarUrl(url, fetchFn = fetch, esperaMs = 3000) {
  let status = null;
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    if (tentativa) await new Promise((r) => setTimeout(r, esperaMs));
    try {
      const res = await fetchFn(url, { redirect: 'follow', headers: { 'user-agent': NAVEGADOR }, signal: AbortSignal.timeout(15000) });
      status = res.status;
      if (status >= 200 && status < 300) return { url, ok: true, status };
    } catch {
      status = null;
    }
  }
  return { url, ok: false, status };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const slug = process.argv[2];
  const post = JSON.parse(readFileSync(new URL('../blog/_registro.json', import.meta.url), 'utf8')).find((p) => p.slug === slug);
  if (!post) {
    console.error(`post não encontrado no registro: ${slug}`);
    process.exit(1);
  }
  const resultados = await Promise.all(post.fontes.map((f) => checarUrl(f.url)));
  for (const r of resultados) console.log(`${r.ok ? 'ok   ' : 'FALHA'} ${r.status ?? '---'} ${r.url}`);
  if (resultados.some((r) => !r.ok)) process.exit(1);
}
