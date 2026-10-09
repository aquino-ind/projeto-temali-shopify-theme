/* Temalli — landing de vendas.
   Carregado por várias seções; o guard evita inicializar duas vezes. */
(function () {
  if (window.__temalliInit) return;
  window.__temalliInit = true;

  var reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function revelar(raiz) {
    var alvos = (raiz || document).querySelectorAll('.tml .reveal:not(.on)');
    if (!alvos.length) return;

    if (reduzirMovimento || !('IntersectionObserver' in window)) {
      alvos.forEach(function (el) { el.classList.add('on'); });
      return;
    }

    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('on');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });

    alvos.forEach(function (el) { io.observe(el); });
  }

  // A barra fixa cobre o rodapé no mobile; a classe reserva o espaço.
  function ajustarBuybar() {
    document.body.classList.toggle('tml-com-buybar', !!document.querySelector('.tml .buybar'));
  }

  // Mantém o preço da barra fixa igual ao plano selecionado na seção de oferta.
  function sincronizarPreco(radio) {
    var destino = document.querySelector('[data-tml-buybar-preco]');
    var rotulo = document.querySelector('[data-tml-buybar-rotulo]');
    if (!destino) return;
    if (radio.dataset.preco) destino.textContent = radio.dataset.preco;
    if (rotulo && radio.dataset.rotulo) rotulo.textContent = radio.dataset.rotulo;
  }

  document.addEventListener('change', function (e) {
    if (e.target.matches('.tml .plano input[name="quantity"]')) sincronizarPreco(e.target);
  });

  function iniciar() {
    revelar();
    ajustarBuybar();
    var marcado = document.querySelector('.tml .plano input[name="quantity"]:checked');
    if (marcado) sincronizarPreco(marcado);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

  // O editor de temas recarrega seções isoladamente.
  document.addEventListener('shopify:section:load', function (e) {
    revelar(e.target);
    ajustarBuybar();
  });
})();
