import { PLANS, money } from './pricing.js';

document.getElementById('year').textContent = new Date().getFullYear();
document.querySelectorAll('.mobile-nav nav a').forEach((link) => link.addEventListener('click', () => {
  document.querySelector('.mobile-nav').open = false;
}));

function renderPrices() {
  const annual = document.querySelector('input[name="billing"]:checked')?.value === 'annual';
  for (const plan of PLANS) {
    const price = document.querySelector(`[data-plan-price="${plan.name}"]`);
    const equivalent = document.querySelector(`[data-plan-equivalent="${plan.name}"]`);
    price.replaceChildren(document.createTextNode(`${money(annual ? plan.annualCents : plan.fromCents)} `));
    const cadence = document.createElement('span');
    cadence.textContent = annual ? '/ ano' : '/ mês';
    price.append(cadence);
    equivalent.hidden = !annual;
    if (annual) equivalent.textContent = `${money(Math.round(plan.annualCents / 12))} por mês, equivalente no anual`;
  }
}

document.querySelectorAll('input[name="billing"]').forEach((radio) => radio.addEventListener('change', renderPrices));
renderPrices();

// O conteúdo continua visível sem JavaScript ou em preferência por menos movimento.
if (window.IntersectionObserver && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const revealItems = [...document.querySelectorAll('[data-reveal]')];
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.08, rootMargin: '0px 0px 40px 0px' });
  revealItems.forEach((item) => observer.observe(item));
  document.documentElement.classList.add('has-motion');
}
