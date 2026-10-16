// Preços de entrada aprovados para comunicação; condições por rebanho a confirmar.
export const PLANS = [
  { name: 'Plus', fromCents: 30990, annualCents: 316098 },
  { name: 'Pro', fromCents: 35990, annualCents: 367098 },
];

export const TRIAL_DAYS = 14;

export function money(cents) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

// Os quatro produtos de assinatura da AbacatePay: cada plano em ciclo mensal e anual, todos com teste grátis.
export function subscriptionProducts() {
  return PLANS.flatMap((plan) => [
    { plan: plan.name, period: 'monthly', externalId: `ovis-${plan.name.toLowerCase()}-mensal`, name: `Ovis ${plan.name} — mensal`, price: plan.fromCents, cycle: 'MONTHLY' },
    { plan: plan.name, period: 'annual', externalId: `ovis-${plan.name.toLowerCase()}-anual`, name: `Ovis ${plan.name} — anual`, price: plan.annualCents, cycle: 'ANNUALLY' },
  ]).map((product) => ({ ...product, currency: 'BRL', trialDays: TRIAL_DAYS }));
}
