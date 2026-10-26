// Regras e páginas do blog. Lógica pura: o build (blog-build.mjs) e os testes importam daqui.

const DIA = 86400000;
const utc = (iso) => new Date(`${iso}T12:00:00Z`);

// Nos 14 dias a partir do primeiro post publica todo dia; depois, só terça e sexta.
export function deveRodarHoje(hojeISO, { inicio }) {
  if (!inicio) return true;
  const dias = Math.round((utc(hojeISO) - utc(inicio)) / DIA);
  if (dias < 14) return true;
  return [2, 5].includes(utc(hojeISO).getUTCDay());
}

const RADICAIS_VET = ['remedio', 'medicament', 'dose', 'dosage', 'vermifug', 'vermicid', 'vacin', 'antibiot', 'tratament', 'aplicacao'];
const semAcento = (s) => s.normalize('NFD').replace(/\p{M}/gu, '');

// Texto que fala de remédio, dose ou tratamento leva o aviso do veterinário.
export function precisaAvisoVet(texto) {
  const plano = semAcento(texto.replace(/<[^>]*>/g, ' ')).toLowerCase();
  return RADICAIS_VET.some((r) => plano.includes(r));
}

export const TIPOS = { noticia: 'Notícia', guia: 'Guia', curiosidade: 'Curiosidade' };

// Erros de um item do registro; lista vazia quando está tudo certo.
export function validarPost(post) {
  const erros = [];
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(post.slug ?? '')) erros.push(`slug inválido: ${post.slug}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(post.data ?? '')) erros.push(`data inválida: ${post.data}`);
  if (!(post.tipo in TIPOS)) erros.push(`tipo inválido: ${post.tipo}`);
  if (!post.titulo || post.titulo.length > 70) erros.push('título vazio ou com mais de 70 caracteres');
  const d = post.descricao?.length ?? 0;
  if (d < 70 || d > 160) erros.push(`descrição com ${d} caracteres (70 a 160)`);
  const fontes = post.fontes ?? [];
  if (!fontes.length || fontes.some((f) => !f.titulo || !/^https:\/\//.test(f.url ?? ''))) erros.push('fontes ausentes ou sem https');
  return erros;
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
