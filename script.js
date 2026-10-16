import { PLANS, money } from './pricing.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let checkoutLinks = null;

$('#year').textContent = new Date().getFullYear();
$$('.nav-mobile nav a').forEach((link) => link.addEventListener('click', () => { $('.nav-mobile').open = false; }));

// Preços: alternância mensal/anual com pílula deslizante.
const billing = $('.billing');
function movePill() {
  const label = $('input:checked', billing)?.closest('label');
  if (!label) return;
  billing.style.setProperty('--pill-x', `${label.offsetLeft}px`);
  billing.style.setProperty('--pill-w', `${label.offsetWidth}px`);
}

function renderPrices(animate = false) {
  const annual = $('input[name="billing"]:checked')?.value === 'annual';
  for (const plan of PLANS) {
    const price = $(`[data-plan-price="${plan.name}"]`);
    const equivalent = $(`[data-plan-equivalent="${plan.name}"]`);
    const cadence = document.createElement('small');
    cadence.textContent = annual ? '/ ano' : '/ mês';
    price.replaceChildren(document.createTextNode(`${money(annual ? plan.annualCents : plan.fromCents)} `), cadence);
    equivalent.hidden = !annual;
    if (annual) equivalent.textContent = `${money(Math.round(plan.annualCents / 12))} por mês, equivalente no anual`;
    if (animate && motion) {
      price.classList.remove('is-swapping');
      void price.offsetWidth;
      price.classList.add('is-swapping');
    }
  }
  movePill();
  updateCheckoutLinks();
}

// Checkout AbacatePay: cada botão aponta para o link do plano no período escolhido.
// Sem links configurados, os botões continuam levando às dúvidas.
function updateCheckoutLinks() {
  if (!checkoutLinks) return;
  const annual = $('input[name="billing"]:checked')?.value === 'annual';
  $$('[data-checkout]').forEach((button) => {
    const period = button.dataset.checkoutPeriod ?? (annual ? 'annual' : 'monthly');
    const url = checkoutLinks[button.dataset.checkout]?.[period];
    if (!url) return;
    button.href = url;
    button.rel = 'noopener';
  });
  $('[data-checkout-mode]').hidden = checkoutLinks.devMode !== true;
}
fetch('checkout-links.json', { cache: 'no-cache' })
  .then((res) => (res.ok ? res.json() : null))
  .then((links) => { checkoutLinks = links; updateCheckoutLinks(); })
  .catch(() => {});
$$('input[name="billing"]').forEach((radio) => radio.addEventListener('change', () => renderPrices(true)));
renderPrices();
window.addEventListener('resize', movePill);
document.fonts?.ready.then(movePill);

// Manejos de demonstração: concluir/desfazer.
$$('.task-done').forEach((button) => button.addEventListener('click', () => {
  const done = button.getAttribute('aria-pressed') !== 'true';
  button.setAttribute('aria-pressed', String(done));
  button.textContent = done ? 'Feito ✓' : 'Concluir';
  button.closest('.task').classList.toggle('is-done', done);
}));

// Trilho de recursos: setas e indicadores.
const rail = $('.rail');
const cards = $$('.rail-card', rail);
const dots = $('.rail-dots');
cards.forEach(() => dots.append(document.createElement('i')));
function cardStep() { return cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : rail.clientWidth; }
$$('[data-rail]').forEach((button) => button.addEventListener('click', () => {
  rail.scrollBy({ left: cardStep() * Number(button.dataset.rail), behavior: motion ? 'smooth' : 'auto' });
}));
function syncDots() {
  const max = rail.scrollWidth - rail.clientWidth;
  const index = max <= 0 ? 0 : Math.round((rail.scrollLeft / max) * (cards.length - 1));
  [...dots.children].forEach((dot, i) => dot.classList.toggle('on', i === index));
}
rail.addEventListener('scroll', syncDots, { passive: true });
syncDots();

// Navegação com vidro e botão de voltar ao topo.
const nav = $('.nav');
const toTop = $('.to-top');

// Daqui em diante, só movimento. Sem JS ou com menos movimento, tudo já está visível.
if (motion && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('motion-on');

  // Escalonamento: linhas de um título e elementos irmãos entram em sequência.
  $$('[data-lines]').forEach((title) => $$('.line > span', title).forEach((span, i) => span.style.setProperty('--i', i)));
  const groups = new Map();
  $$('[data-rise]').forEach((el) => {
    const siblings = groups.get(el.parentElement) ?? 0;
    el.style.setProperty('--d', String(Math.min(siblings, 6) * 90));
    groups.set(el.parentElement, siblings + 1);
  });

  const reveal = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('in-view');
      countUp(entry.target);
      reveal.unobserve(entry.target);
    }
  }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  $$('[data-lines], [data-rise], .rail-card').forEach((el) => reveal.observe(el));

  // Frase acendendo palavra por palavra conforme o scroll.
  const scrub = $('[data-scrub]');
  const words = [];
  (function split(node) {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part.trim()) { frag.append(part); return; }
          const word = document.createElement('span');
          word.className = 'w';
          word.textContent = part;
          words.push(word);
          frag.append(word);
        });
        child.replaceWith(frag);
      } else split(child);
    }
  })(scrub);

  const statement = $('.statement');
  const overview = $('#visao');
  const phoneImg = $('[data-phone-scroll]');
  const heroPhoto = $('[data-hero-photo]');
  const heroTitle = $('.hero-title');
  const parallax = $('[data-parallax] img');
  const bridge = $('.bridge');
  const closing = $('[data-scrub-color]');
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const progress = (el, start = 1, end = 0) => {
    const r = el.getBoundingClientRect();
    const vh = innerHeight;
    return clamp((vh * start - r.top) / (r.height + vh * (start - end)));
  };

  let ticking = false;
  function onScroll() {
    ticking = false;
    const y = scrollY;
    const vh = innerHeight;
    nav.classList.toggle('is-scrolled', y > 24);
    toTop.classList.toggle('show', y > vh * 1.5);

    // Hero: a foto "abre" e o título sobe devagar.
    const h = clamp(y / vh);
    heroPhoto.firstElementChild.style.setProperty('--hero-scale', String(1.12 - h * 0.12));
    heroTitle.style.setProperty('--hero-shift', `${h * -60}px`);

    // Frase: percorre as palavras enquanto a seção fica presa na tela.
    const r = statement.getBoundingClientRect();
    const p = clamp(-r.top / (r.height - vh) * 1.15);
    const lit = Math.round(p * words.length);
    words.forEach((w, i) => w.classList.toggle('on', i < lit));

    // Tela do celular rola com a página.
    const o = progress(overview, 0.9, 0.1);
    const screen = phoneImg.parentElement;
    const travel = Math.max(0, phoneImg.offsetHeight - screen.clientHeight);
    phoneImg.style.setProperty('--screen-y', `${-o * travel}px`);

    // Ponte fotográfica em parallax.
    parallax.style.setProperty('--parallax', `${(progress(bridge) - 0.5) * 18}%`);

    // Título final preenchido conforme aparece.
    closing.style.setProperty('--fill', `${clamp(progress(closing, 0.95, 0.45)) * 100}%`);
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  // FAQ com abertura suave.
  $$('.faq-list details').forEach((details) => {
    const summary = $('summary', details);
    const body = $('.faq-body', details);
    summary.addEventListener('click', (event) => {
      event.preventDefault();
      if (details.open) {
        body.animate([{ height: `${body.offsetHeight}px`, opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' })
          .finished.then(() => { details.open = false; });
      } else {
        details.open = true;
        body.animate([{ height: '0px', opacity: 0 }, { height: `${body.offsetHeight}px`, opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
      }
    });
  });
} else {
  addEventListener('scroll', () => {
    nav.classList.toggle('is-scrolled', scrollY > 24);
    toTop.classList.toggle('show', scrollY > innerHeight * 1.5);
  }, { passive: true });
}

// Números contando ao entrar na tela.
function countUp(root) {
  $$('[data-count]', root).forEach((el) => {
    const target = Number(el.dataset.count);
    const decimals = Number(el.dataset.decimals ?? 0);
    const suffix = el.dataset.suffix ?? '';
    const fmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    const start = performance.now();
    const duration = 1600;
    (function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      el.textContent = fmt.format(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(frame);
    })(start);
  });
}
