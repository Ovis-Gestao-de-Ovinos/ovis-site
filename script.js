import { PLANS, money } from './pricing.js';
import { formatPhone, normalizePhone, saveLead, validateLead, whatsappUrl } from './lead.js?v=3';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    // A linha existe nos dois períodos para os cards não mudarem de altura na troca.
    equivalent.classList.toggle('is-annual', annual);
    equivalent.textContent = annual ? `${money(Math.round(plan.annualCents / 12))} por mês, equivalente no anual` : 'cobrado todo mês';
    if (animate && motion) {
      price.classList.remove('is-swapping');
      void price.offsetWidth;
      price.classList.add('is-swapping');
    }
  }
  movePill();
}

$$('input[name="billing"]').forEach((radio) => radio.addEventListener('change', () => renderPrices(true)));
renderPrices();

// Contato: os botões dos planos abrem o formulário; o lead vai para a planilha e segue para o WhatsApp.
const leadDialog = $('#lead-dialog');
const leadForm = $('[data-lead-form]', leadDialog);
const leadPlanNames = { Teste: 'Teste grátis de 14 dias', Plus: 'Plano Plus', Pro: 'Plano Pro', Demonstração: 'Demonstração no computador' };
let leadPlan = { plano: 'Teste', periodo: 'mensal' };
let leadEndpoint = null;
fetch('lead-config.json', { cache: 'no-cache' })
  .then((res) => (res.ok ? res.json() : null))
  .then((config) => { leadEndpoint = config?.endpoint || null; })
  .catch(() => {});

$$('[data-lead]').forEach((button) => button.addEventListener('click', () => {
  const annual = $('input[name="billing"]:checked')?.value === 'annual';
  const plano = button.dataset.lead;
  leadPlan = { plano, periodo: annual && (plano === 'Plus' || plano === 'Pro') ? 'anual' : 'mensal' };
  $('[data-lead-plan]', leadDialog).textContent = leadPlan.periodo === 'anual' ? `${leadPlanNames[plano]} · anual` : leadPlanNames[plano];
  leadDialog.showModal();
}));
$('[data-lead-close]', leadDialog).addEventListener('click', () => leadDialog.close());
leadDialog.addEventListener('click', (event) => { if (event.target === leadDialog) leadDialog.close(); });

leadForm.elements.whatsapp.addEventListener('blur', (event) => {
  const digits = normalizePhone(event.target.value);
  if (digits) event.target.value = formatPhone(digits);
});
leadForm.addEventListener('input', (event) => event.target.removeAttribute('aria-invalid'));

leadForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submit = $('[data-lead-submit]', leadForm);
  if (submit.disabled) return;
  const field = (name) => leadForm.elements[name].value;
  // O campo isca vai junto e a planilha descarta: um autopreenchimento não pode travar o contato.
  const lead = { nome: field('nome'), whatsapp: field('whatsapp'), fazenda: field('fazenda'), rebanho: field('rebanho'), site: field('site'), ...leadPlan };
  const invalid = validateLead(lead);
  ['nome', 'whatsapp', 'fazenda', 'rebanho'].forEach((name) => {
    if (invalid.includes(name)) leadForm.elements[name].setAttribute('aria-invalid', 'true');
    else leadForm.elements[name].removeAttribute('aria-invalid');
  });
  const error = $('[data-lead-error]', leadForm);
  error.hidden = !invalid.length;
  error.textContent = invalid.includes('whatsapp') && invalid.length === 1
    ? 'Confira o WhatsApp: DDD e número, como (51) 99999-9999.'
    : 'Preencha os campos marcados.';
  if (invalid.length) {
    leadForm.elements[invalid[0]].focus();
    return;
  }
  submit.disabled = true;
  submit.textContent = 'Abrindo o WhatsApp…';
  await saveLead(leadEndpoint && `${leadEndpoint}?origem=${encodeURIComponent(location.href)}`, lead);
  location.href = whatsappUrl(lead);
});
// Quem volta do WhatsApp pelo botão de voltar encontra o formulário pronto de novo.
window.addEventListener('pageshow', () => {
  const submit = $('[data-lead-submit]', leadForm);
  submit.disabled = false;
  submit.textContent = 'Continuar no WhatsApp';
});
window.addEventListener('resize', movePill);
document.fonts?.ready.then(movePill);

// Vídeo do hero: versão Full HD no computador e 720p em telas pequenas.
// Com menos movimento, o vídeo não carrega e fica só o poster.
const heroVideo = $('[data-hero-video]');
if (heroVideo && motion) {
  const small = window.matchMedia('(max-width: 760px)').matches;
  heroVideo.preload = 'auto';
  heroVideo.src = small ? heroVideo.dataset.srcMobile : heroVideo.dataset.src;
  heroVideo.play().catch(() => {});
  // Navegadores adiam o autoplay em abas ocultas; retoma quando a aba aparece.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && heroVideo.paused) heroVideo.play().catch(() => {});
  });
}

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
