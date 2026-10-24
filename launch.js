// Lançamento do app: 14 de novembro de 2026, meia-noite em Brasília (UTC-3, sem horário de verão).
export const LAUNCH_AT = Date.parse('2026-11-14T00:00:00-03:00');

// Quanto falta para o lançamento; null quando ele já chegou.
export function timeLeft(now = Date.now()) {
  const total = Math.ceil((LAUNCH_AT - now) / 1000);
  if (total <= 0) return null;
  return { days: Math.floor(total / 86400), hours: Math.floor(total / 3600) % 24, minutes: Math.floor(total / 60) % 60, seconds: total % 60 };
}
