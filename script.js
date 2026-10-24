import { timeLeft } from './launch.js';
import { formatPhone, normalizePhone, saveLead, validateLead, whatsappUrl } from './lead.js?v=5';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

$('#year').textContent = new Date().getFullYear();
$$('.nav-mobile nav a').forEach((link) => link.addEventListener('click', () => { $('.nav-mobile').open = false; }));

// Lançamento: contagem regressiva até 14/11; quando chega a zero, a seção vira o convite para o teste.
const launch = $('[data-launch]');
const pad = (n) => String(n).padStart(2, '0');
function tickLaunch() {
  const left = timeLeft();
  if (!left) {
    clearInterval(launchTimer);
    $('[data-launch-before]', launch).hidden = true;
    $('[data-launch-after]', launch).hidden = false;
    $$('[data-launch-cta]').forEach((cta) => { cta.textContent = 'Testar 14 dias grátis'; });
    return;
  }
  for (const [unit, value] of Object.entries(left)) $(`[data-unit="${unit}"]`, launch).textContent = pad(value);
}
const launchTimer = setInterval(tickLaunch, 1000);
tickLaunch();

// Contato: os botões da lista de espera, do teste e da demonstração abrem o formulário; o lead vai para a planilha e segue para o WhatsApp.
const leadDialog = $('#lead-dialog');
const leadForm = $('[data-lead-form]', leadDialog);
const leadPlanNames = { Lista: 'Lista de espera do lançamento', Teste: 'Teste grátis de 14 dias', Demonstração: 'Demonstração no computador' };
let leadPlan = { plano: 'Lista', periodo: '' };
let leadEndpoint = null;
fetch('lead-config.json', { cache: 'no-cache' })
  .then((res) => (res.ok ? res.json() : null))
  .then((config) => { leadEndpoint = config?.endpoint || null; })
  .catch(() => {});

$$('[data-lead]').forEach((button) => button.addEventListener('click', () => {
  const plano = button.dataset.lead;
  leadPlan = { plano, periodo: '' };
  $('[data-lead-plan]', leadDialog).textContent = leadPlanNames[plano];
  window.gtag?.('event', 'abrir_formulario', { plano });
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
  // O beacon garante que o evento sai antes de a página trocar para o WhatsApp.
  window.gtag?.('event', 'generate_lead', { plano: lead.plano, transport_type: 'beacon' });
  await saveLead(leadEndpoint && `${leadEndpoint}?origem=${encodeURIComponent(location.href)}`, lead);
  location.href = whatsappUrl(lead);
});
// Quem volta do WhatsApp pelo botão de voltar encontra o formulário pronto de novo.
window.addEventListener('pageshow', () => {
  const submit = $('[data-lead-submit]', leadForm);
  submit.disabled = false;
  submit.textContent = 'Continuar no WhatsApp';
});

// Vídeo do hero só no computador; no celular fica a foto (versão 1280×720), para poupar o plano de dados.
// Formato mais leve que o navegador toca: AV1 (Chrome, Android, Firefox), HEVC (Safari) ou H.264.
// As três versões têm a mesma qualidade medida (VMAF); só muda o tamanho do arquivo.
// Com menos movimento ou economia de dados, o vídeo não carrega e fica só o poster.
// O vídeo só começa a baixar depois da página carregada, para não disputar banda com o poster e o texto.
const heroVideo = $('[data-hero-video]');
function startHeroVideo() {
  if (window.matchMedia('(max-width: 760px)').matches) return;
  heroVideo.preload = 'auto';
  const { dataset } = heroVideo;
  if (heroVideo.canPlayType('video/mp4; codecs="av01.0.08M.08"')) heroVideo.src = dataset.srcAv1;
  else if (heroVideo.canPlayType('video/mp4; codecs="hvc1.1.6.L120.90"')) heroVideo.src = dataset.srcHevc;
  else heroVideo.src = dataset.src;
  // O vídeo aparece por cima da foto só quando começa a tocar, sem piscar em preto.
  heroVideo.addEventListener('playing', () => heroVideo.classList.add('is-playing'), { once: true });
  heroVideo.play().catch(() => {});
  // Navegadores adiam o autoplay em abas ocultas; retoma quando a aba aparece.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && heroVideo.paused) heroVideo.play().catch(() => {});
  });
}
// Com economia de dados ligada no celular, fica só o poster.
const saveData = navigator.connection?.saveData === true;
if (heroVideo && motion && !saveData) {
  if (document.readyState === 'complete') startHeroVideo();
  else window.addEventListener('load', startHeroVideo, { once: true });
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
    heroPhoto.style.setProperty('--hero-scale', String(1.12 - h * 0.12));
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
