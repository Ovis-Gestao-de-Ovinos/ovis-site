// Diz se a rotina publica hoje. Uso: node scripts/blog-hoje.mjs [--hoje AAAA-MM-DD] [--raiz pasta]
// Saída 0 (e imprime a data): publica. Saída 2: hoje não publica. Qualquer outra: erro, a rotina avisa o Roman.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deveRodarHoje } from './blog-lib.mjs';

const opcao = (nome) => { const i = process.argv.indexOf(nome); return i > -1 ? process.argv[i + 1] : undefined; };
const hoje = opcao('--hoje') ?? new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
const raiz = opcao('--raiz') ?? fileURLToPath(new URL('..', import.meta.url));

const rotina = JSON.parse(readFileSync(join(raiz, 'blog/_rotina.json'), 'utf8'));
if (!['automatico', 'aprovacao'].includes(rotina.modo)) throw new Error(`modo inválido em blog/_rotina.json: ${rotina.modo}`);
if (!/^\d{4}-\d{2}-\d{2}$/.test(hoje) || (rotina.inicio !== null && !/^\d{4}-\d{2}-\d{2}$/.test(rotina.inicio))) throw new Error(`data inválida: hoje=${hoje} inicio=${rotina.inicio}`);
if (!deveRodarHoje(hoje, rotina)) process.exit(2);
console.log(hoje);
