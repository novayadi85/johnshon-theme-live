(function () {
  function init() {
    var overlay = document.getElementById('filterDrawerOverlay');
    var openBtn = document.getElementById('filterDrawerOpen');
    if (!overlay || !openBtn) return;

    var form = overlay.querySelector('#filterDrawerForm');
    var countEls = document.querySelectorAll('[data-filter-count]');
    var resultCountEls = overlay.querySelectorAll('[data-result-count]');

    function openDrawer() {
      overlay.classList.add('filter-open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
      overlay.classList.remove('filter-open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      setTimeout(resetLayer, 300);
    }

    openBtn.addEventListener('click', openDrawer);
    overlay.querySelectorAll('[data-filter-close]').forEach(function (el) {
      el.addEventListener('click', closeDrawer);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('filter-open')) closeDrawer();
    });

    var layers = overlay.querySelectorAll('.filter-layer');
    function showLayer(name) {
      layers.forEach(function (l) {
        l.classList.toggle('is-active', l.dataset.layer === name);
      });
    }
    function resetLayer() {
      if (overlay.dataset.style === 'layer') showLayer('root');
    }
    overlay.querySelectorAll('[data-layer-open]').forEach(function (btn) {
      btn.addEventListener('click', function () { showLayer(btn.dataset.layerOpen); });
    });
    overlay.querySelectorAll('[data-layer-back]').forEach(function (btn) {
      btn.addEventListener('click', function () { showLayer('root'); });
    });

    function updateLayerCounts() {
      overlay.querySelectorAll('[data-layer-selected]').forEach(function (badge) {
        var key = badge.dataset.layerSelected;
        var inputs = overlay.querySelectorAll('[data-layer-input="' + key + '"]');
        var count = 0;
        inputs.forEach(function (input) {
          if (input.type === 'checkbox' || input.type === 'radio') {
            if (input.checked) count++;
          } else if (input.value !== '') {
            count++;
          }
        });
        badge.textContent = count > 0 ? count : '';
      });
    }

    function updateTotalCount() {
      if (!form) return;
      var count = 0;
      form.querySelectorAll('input').forEach(function (input) {
        if (input.type === 'checkbox' || input.type === 'radio') {
          if (input.checked) count++;
        } else if (input.type === 'number' && input.value !== '') {
          count++;
        }
      });
      countEls.forEach(function (el) { el.textContent = count; });
    }

    function buildParams() {
      var params = new URLSearchParams();
      if (!form) return params;
      form.querySelectorAll('input').forEach(function (input) {
        if (input.disabled) return;
        if ((input.type === 'checkbox' || input.type === 'radio') && !input.checked) return;
        if (input.value === '') return;
        params.append(input.name, input.value);
      });
      return params;
    }

    var fetchToken = 0;
    var fetchTimer = null;
    function setResultCount(n) {
      resultCountEls.forEach(function (el) { el.textContent = String(n); });
    }

    // Update each filter option's count + disabled state from the freshly
    // fetched section, so options that would yield 0 results get disabled and
    // you can never reach a null result. Preserves checked state, open
    // accordions, scroll and focus (we only touch counts + disabled + display).
    function updateFilterOptions(doc) {
      if (!form) return;

      // Map fetched options by "name\nvalue".
      var map = {};
      doc.querySelectorAll('.filter-options-list input').forEach(function (inp) {
        var li = inp.closest('li');
        var countEl = li ? li.querySelector('.filter-option-count') : null;
        map[inp.name + '\n' + inp.value] = {
          disabled: inp.disabled,
          count: countEl ? countEl.textContent : ''
        };
      });

      form.querySelectorAll('.filter-options-list input').forEach(function (input) {
        var li = input.closest('li');
        var data = map[input.name + '\n' + input.value];

        // Option no longer offered → hide it (unless it's the one checked).
        if (!data) {
          if (li && !input.checked) li.style.display = 'none';
          return;
        }
        if (li) li.style.display = '';

        var countEl = li ? li.querySelector('.filter-option-count') : null;
        if (countEl) countEl.textContent = data.count;

        // Disable zero-result options, but never disable an active selection.
        input.disabled = data.disabled && !input.checked;
      });
    }
    function refreshResultCount() {
      if (fetchTimer) clearTimeout(fetchTimer);
      fetchTimer = setTimeout(function () {
        var token = ++fetchToken;
        var params = buildParams();
        var query = params.toString();
        // URL shown in the address bar (no section_id).
        var displayUrl = window.location.pathname + (query ? '?' + query : '');
        // Fetch only the PLP section via the Section Rendering API for speed.
        var gridEl = document.querySelector('.plp-product-list');
        var sectionId = gridEl ? gridEl.getAttribute('data-section-id') : '';
        var url = displayUrl;
        if (sectionId) {
          url = window.location.pathname + '?' + (query ? query + '&' : '') + 'section_id=' + encodeURIComponent(sectionId);
        }
        fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
          .then(function (res) { return res.text(); })
          .then(function (html) {
            if (token !== fetchToken) return;
            var doc = new DOMParser().parseFromString(html, 'text/html');

            // Refresh filter options (counts + disabled) so no choice leads to 0.
            updateFilterOptions(doc);

            var newGrid = doc.querySelector('.plp-product-list');
            var curGrid = document.querySelector('.plp-product-list');

            // Live-swap the product grid with the filtered result.
            if (curGrid) {
              if (newGrid) {
                curGrid.innerHTML = newGrid.innerHTML;
                setResultCount(newGrid.querySelectorAll('.product-card').length);
              } else {
                // No results (collection.products.size == 0 → grid not rendered)
                var msg = curGrid.getAttribute('data-no-results') || '';
                curGrid.innerHTML = msg ? '<p class="plp-empty">' + msg + '</p>' : '';
                setResultCount(0);
              }
            } else {
              var count = doc.querySelectorAll('.plp-product-list .product-card').length;
              setResultCount(count);
            }

            // Reflect the active filters in the URL (shareable + back button).
            if (window.history && window.history.replaceState) {
              window.history.replaceState(null, '', displayUrl);
            }
          })
          .catch(function () { /* keep stale grid/count on failure */ });
      }, 300);
    }

    if (form) {
      form.addEventListener('change', function () {
        updateTotalCount();
        updateLayerCounts();
        refreshResultCount();
      });
      form.addEventListener('input', function () {
        updateTotalCount();
        updateLayerCounts();
        refreshResultCount();
      });
      form.addEventListener('reset', function (e) {
        // Native reset restores the INITIAL state — which is "checked" if the
        // page loaded with filters active. So clear everything explicitly.
        e.preventDefault();

        form.querySelectorAll('input').forEach(function (input) {
          if (input.classList.contains('filter-search')) { input.value = ''; return; }
          if (input.type === 'checkbox' || input.type === 'radio') {
            input.checked = false;
            input.disabled = false; // re-enable options disabled by zero-results
          } else {
            input.value = '';
          }
        });

        // Restore any options hidden by a search field.
        form.querySelectorAll('.filter-options-list li').forEach(function (li) {
          li.style.display = '';
        });

        updateTotalCount();
        updateLayerCounts();
        refreshResultCount();
      });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var params = buildParams();
        var base = window.location.pathname;
        window.location.href = params.toString() ? base + '?' + params.toString() : base;
      });
    }

    updateTotalCount();
    updateLayerCounts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
