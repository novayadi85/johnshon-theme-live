/*
 * Produktkarrusellen på forsiden ("Todays selection for you").
 *
 * Vinduet er præcis tre kort bredt. Pilene rykker ét kort ad gangen ved at
 * forskyde rækken, indtil det sidste kort står yderst til højre.
 *
 * Kun over 1200px. Derunder ombryder CSS kortene til et gitter, og under 768px
 * er rækken en scroll-container — begge steder ville en transform spænde ben.
 */
(function () {
  var CAROUSEL = '(min-width: 1201px)';

  function initProductCarousel(section) {
    var wrapper = section.querySelector('.product-list-wrapper');
    var list = section.querySelector('.product-list');
    var prev = section.querySelector('.nav-prev');
    var next = section.querySelector('.nav-next');
    if (!wrapper || !list || !prev || !next) return;

    var cards = Array.prototype.slice.call(list.querySelectorAll('.product-card'));
    if (cards.length === 0) return;

    var index = 0;

    // Afstanden fra ét korts venstrekant til det næstes — bredde plus gap.
    // Måles på layoutet, så den følger med hvis CSS ændrer kortbredden.
    function stepWidth() {
      if (cards.length < 2) return cards[0].offsetWidth;
      return cards[1].offsetLeft - cards[0].offsetLeft;
    }

    // Hvor mange kort der er plads til i vinduet.
    function visibleCount() {
      var step = stepWidth();
      if (step <= 0) return cards.length;
      return Math.max(1, Math.round(wrapper.clientWidth / step));
    }

    function maxIndex() {
      return Math.max(0, cards.length - visibleCount());
    }

    /*
     * Forskydningen der centrerer de synlige kort i vinduet.
     *
     * Først hvor langt der er rullet: afstanden fra første kort til det valgte.
     * Dernæst fordeles den plads der måtte være tilovers — vinduets bredde minus
     * gruppens bredde — ligeligt i begge sider. Går tallene præcist op, er
     * restpladsen nul og gruppen står flush; går de ikke op, bliver overskuddet
     * delt i to i stedet for at hobe sig op som en stribe i den ene kant.
     *
     * offsetLeft måles på layoutet og påvirkes ikke af transformen, så
     * beregningen kan ikke drive af sted ved gentagne klik.
     */
    function offsetForIndex() {
      var visible = visibleCount();
      var cardWidth = cards[0].offsetWidth;
      var gap = stepWidth() - cardWidth;
      var groupWidth = visible * cardWidth + (visible - 1) * gap;
      var slack = wrapper.clientWidth - groupWidth;
      var scrolled = cards[index].offsetLeft - cards[0].offsetLeft;
      return -scrolled + slack / 2;
    }

    function render() {
      var limit = maxIndex();
      if (index > limit) index = limit;

      if (window.matchMedia(CAROUSEL).matches && limit > 0) {
        list.style.transform = 'translateX(' + offsetForIndex() + 'px)';
      } else {
        list.style.transform = '';
      }

      prev.disabled = index === 0 || limit === 0;
      next.disabled = index >= limit;
    }

    function move(delta) {
      var target = Math.min(Math.max(index + delta, 0), maxIndex());
      if (target === index) return;
      index = target;
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
    var sections = (root || document).querySelectorAll('.product-carousel');
    Array.prototype.forEach.call(sections, initProductCarousel);
  }

  initAll();

  // Temaeditoren gen-renderer sektionen ved hver ændring.
  document.addEventListener('shopify:section:load', function (event) {
    initAll(event.target);
  });
})();
