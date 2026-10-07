import { animate, stagger } from './vendor/anime.esm.min.js';
import { money, PLAN_NAMES, tierFor } from './pricing.js';

document.getElementById('year').textContent = new Date().getFullYear();
document.querySelectorAll('.mobile-nav nav a').forEach((link) => link.addEventListener('click', () => {
  document.querySelector('.mobile-nav').open = false;
}));

const herdInput = document.getElementById('herd-size');
const herdRange = document.getElementById('herd-range');
const results = document.getElementById('price-results');
const rangeLabel = document.getElementById('result-range');
const tierCaption = document.getElementById('tier-caption');
const note = document.getElementById('price-note');

function renderPrices() {
  const count = Number(herdInput.value);
  const tier = tierFor(count);
  const annual = document.querySelector('input[name="billing"]:checked').value === 'annual';
  herdRange.value = String(Math.min(Math.max(count || 1, 1), 500));
  herdRange.style.setProperty('--range-progress', `${(Number(herdRange.value) - 1) / 499 * 100}%`);

  if (!Number.isInteger(count) || count < 1) {
    tierCaption.textContent = 'Digite pelo menos 1 ovino.';
    rangeLabel.textContent = 'QUANTIDADE INVÁLIDA';
    results.innerHTML = '<p class="price-empty">Informe uma quantidade inteira a partir de 1.</p>';
    note.hidden = true;
    return;
  }
  if (!tier) {
    tierCaption.textContent = 'Acima de 500 ovinos';
    rangeLabel.textContent = 'ACIMA DE 500';
    results.innerHTML = '<p class="price-empty">Ainda não temos preço publicado para rebanhos acima de 500 ovinos.</p>';
    note.hidden = true;
    return;
  }
  note.hidden = false;
  note.textContent = annual
    ? 'O valor principal é o total pago por ano; mostramos também o equivalente mensal para comparar.'
    : 'No pagamento anual, o total dos 12 meses tem 15% de desconto.';
  tierCaption.textContent = `Faixa: ${tier.label}`;
  rangeLabel.textContent = tier.label.toLocaleUpperCase('pt-BR');
  results.replaceChildren(...tier.plans.map(([monthly, yearly, yearlyEquivalent], index) => {
    const row = document.createElement('article');
    row.className = 'price-row';
    const name = document.createElement('div');
    name.className = 'price-name';
    const plan = document.createElement('strong');
    plan.textContent = PLAN_NAMES[index];
    const desc = document.createElement('small');
    desc.textContent = `Plano ${PLAN_NAMES[index]}`;
    name.append(plan, desc);
    const value = document.createElement('div');
    value.className = 'price-value';
    const amount = document.createElement('strong');
    amount.textContent = money(annual ? yearly : monthly);
    const cadence = document.createElement('small');
    cadence.textContent = annual ? '/ ano' : '/ mês';
    value.append(amount, cadence);
    if (annual) {
      const equivalent = document.createElement('span');
      equivalent.className = 'price-equivalent';
      equivalent.textContent = `${money(yearlyEquivalent)} por mês, equivalente no anual`;
      value.append(equivalent);
    }
    row.append(name, value);
    return row;
  }));
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    animate('.price-row', { opacity: [0, 1], y: [10, 0], delay: stagger(55), duration: 350, ease: 'outQuad' });
  }
}

herdInput.addEventListener('input', renderPrices);
herdRange.addEventListener('input', () => { herdInput.value = herdRange.value; renderPrices(); });
document.getElementById('herd-minus').addEventListener('click', () => { herdInput.value = String(Math.max(1, (Number(herdInput.value) || 1) - 1)); renderPrices(); });
document.getElementById('herd-plus').addEventListener('click', () => { herdInput.value = String(Math.max(1, (Number(herdInput.value) || 0) + 1)); renderPrices(); });
document.querySelectorAll('input[name="billing"]').forEach((radio) => radio.addEventListener('change', renderPrices));
renderPrices();
