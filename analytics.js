// Google Analytics 4 com modo de consentimento, no mesmo modelo do site da Favo.
// Começa sem cookies e só os grava se a pessoa aceitar no aviso do canto da tela.
// A escolha fica em "ovis-cookies"; a política de privacidade reabre o aviso pelo [data-cookies-reabrir].
(function () {
  var GA_ID = 'G-VV46YYX0HT'; // ID de medição do GA4 (G-XXXXXXXXXX). Vazio: nada carrega e nenhum aviso aparece.
  var CHAVE = 'ovis-cookies';
  if (!GA_ID) return;

  // Se o navegador bloquear o localStorage, a escolha vale só para esta visita.
  var escolhaDaVisita = null;
  function lerEscolha() {
    try { return localStorage.getItem(CHAVE) || escolhaDaVisita; } catch (e) { return escolhaDaVisita; }
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  gtag('consent', 'default', {
    analytics_storage: lerEscolha() === 'aceito' ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  gtag('js', new Date());
  gtag('config', GA_ID);

  // O gtag.js só chega depois do load, para não disputar a primeira pintura com o site;
  // até lá o dataLayer guarda os comandos acima.
  function carregarGtag() {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }
  if (document.readyState === 'complete') carregarGtag();
  else window.addEventListener('load', carregarGtag);

  var aviso = null;
  function escolher(escolha) {
    escolhaDaVisita = escolha;
    try { localStorage.setItem(CHAVE, escolha); } catch (e) { /* fica só em escolhaDaVisita */ }
    gtag('consent', 'update', { analytics_storage: escolha === 'aceito' ? 'granted' : 'denied' });
    aviso.hidden = true;
  }

  function mostrarAviso() {
    if (!aviso) {
      aviso = document.createElement('section');
      aviso.className = 'cookie-notice';
      aviso.setAttribute('aria-label', 'Aviso de cookies');
      aviso.innerHTML = '<p>A gente usa cookies do Google Analytics para entender como o site é visitado. Nada de anúncio. <a class="inline-link" href="/privacidade/">Ver a política de privacidade</a>.</p>'
        + '<div class="cookie-actions"><button type="button" class="btn btn-ghost btn-sm" data-escolha="recusado">Só o essencial</button>'
        + '<button type="button" class="btn btn-solid btn-sm" data-escolha="aceito">Aceitar</button></div>';
      aviso.addEventListener('click', function (event) {
        var botao = event.target.closest('[data-escolha]');
        if (botao) escolher(botao.dataset.escolha);
      });
      document.body.appendChild(aviso);
    }
    aviso.hidden = false;
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!lerEscolha()) mostrarAviso();
    document.querySelectorAll('[data-cookies-reabrir]').forEach(function (botao) {
      botao.addEventListener('click', mostrarAviso);
    });
  });
})();
