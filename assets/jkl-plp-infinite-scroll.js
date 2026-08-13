(function () {
  var isLoading = false;
  var observer = null;

  function getGrid() {
    return document.querySelector('.plp-product-list');
  }

  function getSentinel() {
    return document.querySelector('[data-plp-infinite-scroll-sentinel]');
  }

  function updateSentinel() {
    var grid = getGrid();
    var sentinel = getSentinel();
    if (!grid || !sentinel) return;

    var hasNextPage = Boolean(grid.dataset.nextUrl);
    sentinel.hidden = !hasNextPage;
  }

  function sectionUrl(nextUrl, sectionId) {
    var url = new URL(nextUrl, window.location.origin);
    if (sectionId) url.searchParams.set('section_id', sectionId);
    return url.toString();
  }

  function copyPaginationState(currentGrid, nextGrid) {
    ['currentPage', 'totalPages', 'nextUrl'].forEach(function (key) {
      if (nextGrid.dataset[key]) {
        currentGrid.dataset[key] = nextGrid.dataset[key];
      } else {
        delete currentGrid.dataset[key];
      }
    });
  }

  function announceCardsChanged() {
    document.dispatchEvent(new CustomEvent('jkl:plp-cards-updated'));
  }

  function loadNextPage() {
    var grid = getGrid();
    if (!grid || isLoading || !grid.dataset.nextUrl) return;

    isLoading = true;
    grid.setAttribute('aria-busy', 'true');

    fetch(sectionUrl(grid.dataset.nextUrl, grid.dataset.sectionId), {
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Unable to load next collection page');
        return res.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var nextGrid = doc.querySelector('.plp-product-list');
        if (!nextGrid) {
          delete grid.dataset.nextUrl;
          return;
        }

        Array.prototype.forEach.call(nextGrid.children, function (child) {
          grid.appendChild(document.importNode(child, true));
        });

        copyPaginationState(grid, nextGrid);
        announceCardsChanged();
      })
      .catch(function () {
        updateSentinel();
      })
      .finally(function () {
        isLoading = false;
        grid.removeAttribute('aria-busy');
        updateSentinel();
      });
  }

  function init() {
    var sentinel = getSentinel();
    if (!sentinel) return;

    if (observer) observer.disconnect();
    observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) loadNextPage();
        });
      },
      { rootMargin: '500px 0px' }
    );
    observer.observe(sentinel);

    updateSentinel();
  }

  document.addEventListener('jkl:plp-updated', updateSentinel);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
