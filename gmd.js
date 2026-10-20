// Calculadora de GMD (ganho médio diário): (peso final − peso inicial) ÷ dias entre as pesagens.

// Peso digitado em kg, com vírgula ou ponto; null se não for um número positivo.
export function parseWeight(raw) {
  const text = String(raw ?? '').trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(text)) return null;
  const kg = Number(text);
  return kg > 0 ? kg : null;
}

// Dias entre duas datas no formato do campo date (AAAA-MM-DD), contados em UTC para não sofrer com fuso.
export function daysBetween(start, end) {
  if (!start || !end) return null;
  const [a, b] = [start, end].map((d) => Date.UTC(...d.split('-').map((n, i) => Number(n) - (i === 1 ? 1 : 0))));
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / 86400000);
}

export function computeGmd({ pesoInicial, dataInicial, pesoFinal, dataFinal }) {
  const inicial = parseWeight(pesoInicial);
  if (inicial === null) return { ok: false, erro: 'Informe o peso inicial em kg.' };
  const final = parseWeight(pesoFinal);
  if (final === null) return { ok: false, erro: 'Informe o peso final em kg.' };
  const dias = daysBetween(dataInicial, dataFinal);
  if (dias === null) return { ok: false, erro: 'Informe as duas datas de pesagem.' };
  if (dias <= 0) return { ok: false, erro: 'A pesagem final precisa ser depois da inicial.' };
  const ganhoKg = Math.round((final - inicial) * 1000) / 1000;
  return { ok: true, dias, ganhoKg, gmd: Math.round((ganhoKg * 1000) / dias) };
}
