// Preços de entrada aprovados para comunicação; condições por rebanho a confirmar.
export const PLANS = [
  { name: 'Plus', fromCents: 30990, annualCents: 316098 },
  { name: 'Pro', fromCents: 35990, annualCents: 367098 },
];

export function money(cents) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}
