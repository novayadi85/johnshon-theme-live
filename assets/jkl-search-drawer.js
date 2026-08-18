// Search Drawer functionality
(function () {
  var overlay = document.getElementById('jklSearchDrawerOverlay');
  if (!overlay) return;
  
  // Move the overlay to <body> so position:fixed is relative to the viewport
  // and never clipped/trapped by a transformed/overflow ancestor (e.g. sticky header).
  if (overlay.parentElement !== document.body) {
    document.body.appendChild(overlay);
  }

  var input = overlay.querySelector('[data-drawer-search-input]');
  var closeBtn = overlay.querySelector('[data-drawer-search-close]');
  var resultsInner = overlay.querySelector('[data-drawer-results-inner]');
  var backdrop = overlay.querySelector('.jkl-search-drawer-backdrop');

  if (!input || !resultsInner) return;

  var SECTION_ID = 'jkl-search-drawer-results';
  var MIN_CHARS = 3;
  var headerOpenMode = overlay.getAttribute('data-header-search-open-mode') || 'min_chars';
  var activeFetch = null;
  var cache = {};

  function debounce(fn, wait) {
    var t;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  function openDrawer() {
    overlay.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    input.focus();
  }

  function closeDrawer() {
    overlay.setAttribute('hidden', '');
    document.body.style.overflow = '';
    input.value = '';
    resultsInner.innerHTML = '<div class="jkl-search-drawer__empty"><p>Start typing to search</p></div>';
  }

  function renderLoading() {
    resultsInner.innerHTML = '<div class="jkl-search-drawer__loading"><div class="jkl-search-drawer__loading-spinner"></div></div>';
  }

  function renderNoResults(term) {
    resultsInner.innerHTML =
      '<div class="jkl-search-drawer__no-results">' +
      '<h3 class="jkl-search-drawer__no-results-title">No results</h3>' +
      '<p class="jkl-search-drawer__no-results-text">We cannot find any products for "' +
      term.replace(/"/g, '&quot;') + '". Try a different word or phrase.</p>' +
      '</div>';
  }

  function renderProducts(html) {
    resultsInner.innerHTML = html;
  }

  function fetchResults(term) {
    if (cache[term]) {
      renderProducts(cache[term]);
      return;
    }

    if (activeFetch) activeFetch.abort();
    activeFetch = new AbortController();

    var url =
      '/search/suggest?q=' + encodeURIComponent(term) +
      '&section_id=' + SECTION_ID +
      '&resources[type]=product' +
      '&resources[limit]=12' +
      '&resources[options][fields]=title,product_type,variants.title,vendor,variants.sku';

    renderLoading();

    fetch(url, { signal: activeFetch.signal })
      .then(function (res) { return res.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var inner = doc.querySelector('[data-drawer-results]');
        var markup = inner ? inner.innerHTML : html;

        if (markup.indexOf('jkl-search-drawer__products') > -1) {
          cache[term] = markup;
          renderProducts(markup);
        } else {
          renderNoResults(term);
        }
      })
      .catch(function (err) {
        if (err && err.name === 'AbortError') return;
        renderNoResults(term);
      });
  }

  var onInput = debounce(function () {
    var term = input.value.trim();
    if (term.length < MIN_CHARS) {
      resultsInner.innerHTML = '<div class="jkl-search-drawer__empty"><p>Start typing to search</p></div>';
      return;
    }
    fetchResults(term);
  }, 250);

  input.addEventListener('input', onInput);

  closeBtn.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeDrawer();
  });

  // Bind any trigger buttons (more reliable than inline onclick)
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest && e.target.closest('[data-search-drawer-open]');
    if (trigger) {
      e.preventDefault();
      openDrawer();
    }
  });

  // Header search bar: either open once MIN_CHARS are typed, or immediately on
  // focus/click depending on the section setting. We intentionally keep the term
  // in the header input so closing the overlay still leaves a submittable query.
  var headerInput = document.querySelector('[data-header-search-input]');
  if (headerInput) {
    function syncHeaderSearchToDrawer() {
      var term = headerInput.value.trim();
      var shouldOpen = headerOpenMode === 'click' || term.length >= MIN_CHARS;
      if (!shouldOpen) return;

      if (overlay.hasAttribute('hidden')) openDrawer();
      input.value = term;
      onInput();
    }

    headerInput.addEventListener('input', syncHeaderSearchToDrawer);

    if (headerOpenMode === 'click') {
      headerInput.addEventListener('focus', syncHeaderSearchToDrawer);
      headerInput.addEventListener('click', syncHeaderSearchToDrawer);
    }

    headerInput.form && headerInput.form.addEventListener('submit', function (e) {
      if (headerOpenMode !== 'click') return;
      if (headerInput.value.trim()) return;
      e.preventDefault();
      syncHeaderSearchToDrawer();
    });

    // Keep the header field in sync while the user keeps typing inside the
    // drawer, so closing the overlay leaves the full query in the header input.
    input.addEventListener('input', function () {
      headerInput.value = input.value;
    });
  }

  // Expose open function globally for header to trigger
  window.openSearchDrawer = function () {
    openDrawer();
  };
})();
