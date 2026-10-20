// Formulário de contato: o lead vai para a planilha da equipe e segue para o WhatsApp da Ovis.
export const HERD_SIZES = ['até 100', '101 a 300', '301 a 1.000', 'mais de 1.000'];

export const OVIS_WHATSAPP = '5551984931844';

// Só dígitos com DDD, sem o 0 de longa distância nem o 55 do país; null se não sobrar um telefone brasileiro.
export function normalizePhone(raw) {
  let digits = String(raw ?? '').replace(/\D/g, '').replace(/^0+/, '');
  if (digits.length > 11 && digits.startsWith('55')) digits = digits.slice(2);
  return digits.length === 10 || digits.length === 11 ? digits : null;
}

export function formatPhone(digits) {
  const split = digits.length - 4;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, split)}-${digits.slice(split)}`;
}

export function validateLead(lead) {
  const invalid = [];
  if (!lead.nome?.trim()) invalid.push('nome');
  if (!normalizePhone(lead.whatsapp)) invalid.push('whatsapp');
  if (!lead.fazenda?.trim()) invalid.push('fazenda');
  if (!HERD_SIZES.includes(lead.rebanho)) invalid.push('rebanho');
  return invalid;
}

function interest({ plano, periodo }) {
  if (plano === 'Teste') return 'começar o teste grátis';
  if (plano === 'Demonstração') return 'ver uma demonstração do Ovis no computador';
  return `conhecer o plano ${plano}${periodo === 'anual' ? ' (anual)' : ''}`;
}

export function leadMessage(lead) {
  return `Oi! Sou ${lead.nome.trim()}, da fazenda ${lead.fazenda.trim()}. Temos ${lead.rebanho} animais e quero ${interest(lead)}.`;
}

export function whatsappUrl(lead) {
  return `https://wa.me/${OVIS_WHATSAPP}?text=${encodeURIComponent(leadMessage(lead))}`;
}

// O Apps Script não responde CORS: o envio vai como text/plain em no-cors e a resposta não é lida.
// Nunca rejeita, para o WhatsApp abrir mesmo com a planilha fora do ar.
export async function saveLead(endpoint, lead, { fetchImpl = fetch, timeoutMs = 4000 } = {}) {
  if (!endpoint) return 'skipped';
  const body = JSON.stringify({ ...lead, whatsapp: formatPhone(normalizePhone(lead.whatsapp)) });
  let timer;
  const timeout = new Promise((resolve) => { timer = setTimeout(() => resolve('failed'), timeoutMs); });
  const request = Promise.resolve()
    .then(() => fetchImpl(endpoint, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body }))
    .then(() => 'saved', () => 'failed');
  try {
    return await Promise.race([request, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
