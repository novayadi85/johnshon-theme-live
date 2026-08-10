/*
 * Producent-karrusellen på forsiden.
 *
 * Rækken af kort er bredere end skærmen og centreres med CSS, så det aktive kort
 * står i midten. Pilene flytter det aktive indeks og forskyder rækken med en
 * transform — afstanden måles på de faktiske kort, så den følger med når CSS
 * ændrer kortbredde eller gap.
 *
 * På mobil er pilene skjult og rækken er en almindelig scroll-container. Derfor
 * nulstilles transformen under 769px, så den ikke kæmper mod native scroll.
 */
(function () {
  var DESKTOP = '(min-width: 769px)';

  function initStoryCarousel(section) {
    var list = section.querySelector('.story-list');
    var prev = section.querySelector('.nav-prev');
    var next = section.querySelector('.nav-next');
    if (!list || !prev || !next) return;

    var wrapper = section.querySelector('.story-list-wrapper');
    var cards = Array.prototype.slice.call(list.querySelectorAll('.story-card'));
    if (!wrapper || cards.length === 0) return;

    // Serveren markerer allerede det midterste kort — start samme sted, så der
    // ikke sker et hop når scriptet overtager.
    var serverActive = cards.indexOf(list.querySelector('.story-card:not(.faded)'));
    var active = serverActive === -1 ? Math.floor((cards.length - 1) / 2) : serverActive;

    /*
     * offsetLeft/offsetWidth måles på layoutet og påvirkes ikke af transformen.
     * Både kortene og wrapperen har .story-carousel som offsetParent, så de to
     * midtpunkter kan trækkes direkte fra hinanden. Det rammer præcist uanset om
     * antallet af kort er lige eller ulige — modsat at gange sig frem i kortbredder.
     */
    function offsetForActive() {
      var card = cards[active];
      var wrapperCenter = wrapper.offsetLeft + wrapper.offsetWidth / 2;
      var cardCenter = card.offsetLeft + card.offsetWidth / 2;
      return wrapperCenter - cardCenter;
    }

    function render() {
      if (window.matchMedia(DESKTOP).matches) {
        list.style.transform = 'translateX(' + offsetForActive() + 'px)';
      } else {
        list.style.transform = '';
      }

      cards.forEach(function (card, index) {
        card.classList.toggle('faded', index !== active);
      });

      prev.disabled = active === 0;
      next.disabled = active === cards.length - 1;
    }

    function move(delta) {
      var target = Math.min(Math.max(active + delta, 0), cards.length - 1);
      if (target === active) return;
      active = target;
      render();
    }

    prev.addEventListener('click', function () {
      move(-1);
    });
    next.addEventListener('click', function () {
      move(1);
    });

    var resizeTimer;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(render, 150);
    });

    render();
  }

  function initAll(root) {
    var sections = (root || document).querySelectorAll('.story-carousel');
    Array.prototype.forEach.call(sections, initStoryCarousel);
  }

  initAll();

  // Temaeditoren gen-renderer sektionen ved hver ændring.
  document.addEventListener('shopify:section:load', function (event) {
    initAll(event.target);
  });
})();
