(function () {
  var STORAGE_KEY = 'jklWishlistVariantIds';
  var config = window.JKLWishlist || {};
  var remoteSaveTimer = null;

  function normalizeIds(ids) {
    if (typeof ids === 'string') {
      try {
        ids = JSON.parse(ids);
      } catch (error) {
        ids = ids.split(',');
      }
    }

    if (!Array.isArray(ids)) return [];

    return ids.map(function (id) {
      if (id && typeof id === 'object') {
        return id.id || id.admin_graphql_api_id || id.variant_id || '';
      }

      return id;
    }).map(String).filter(Boolean);
  }

  function arraysMatch(first, second) {
    first = normalizeIds(first);
    second = normalizeIds(second);

    if (first.length !== second.length) return false;

    return first.every(function (id) {
      return second.indexOf(id) !== -1;
    });
  }

  function readWishlist() {
    try {
      var value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
      return normalizeIds(value);
    } catch (error) {
      return [];
    }
  }

  function writeWishlist(ids) {
    var uniqueIds = ids.filter(function (id, index) {
      return ids.indexOf(id) === index;
    });

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueIds));
    return uniqueIds;
  }

  function readRemoteWishlist() {
    return normalizeIds(config.remoteVariantIds);
  }

  function hasCustomer() {
    return !!config.customerId;
  }

  function saveRemoteWishlist(ids) {
    if (!hasCustomer() || !config.endpoint) return;

    window.clearTimeout(remoteSaveTimer);
    remoteSaveTimer = window.setTimeout(function () {
      fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'update_customer_wishlist',
          customer_id: config.customerId,
          variant_ids: ids,
          metafield: config.metafield || {
            namespace: 'custom',
            key: 'wishlist_variant_ids'
          }
        })
      })
        .then(function (response) {
          return response.json()
            .catch(function () { return {}; })
            .then(function (data) {
              if (!response.ok || data.success === false || data.error) {
                throw new Error(data.error || data.message || 'Wishlist save failed: ' + response.status);
              }
            });
        })
        .catch(function (error) {
          console.error('Wishlist save failed:', error);
        });
    }, 300);
  }

  function hydrateWishlist() {
    var localIds = readWishlist();
    var remoteIds = readRemoteWishlist();
    var mergedIds = writeWishlist(localIds.concat(remoteIds));

    if (hasCustomer() && !arraysMatch(remoteIds, mergedIds)) {
      saveRemoteWishlist(mergedIds);
    }

    return mergedIds;
  }

  function isSaved(ids, variantId) {
    return ids.indexOf(String(variantId)) !== -1;
  }

  function setButtonState(button, active) {
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
    button.setAttribute('aria-label', active ? 'Fjern fra wishlist' : 'Wishlist');
  }

  function syncButtons() {
    var ids = readWishlist();
    document.querySelectorAll('[data-wishlist-toggle][data-variant-id]').forEach(function (button) {
      setButtonState(button, isSaved(ids, button.dataset.variantId));
    });
  }

  function updateWishlistPage() {
    var list = document.querySelector('[data-wishlist-list]');
    if (!list) return;

    var ids = readWishlist();
    var visibleCount = 0;

    list.querySelectorAll('[data-wishlist-card][data-variant-id]').forEach(function (card) {
      var active = isSaved(ids, card.dataset.variantId);
      card.hidden = !active;
      if (active) visibleCount += 1;
    });

    var emptyState = document.querySelector('[data-wishlist-empty]');
    if (emptyState) emptyState.hidden = visibleCount > 0;

    list.dataset.wishlistCount = String(ids.length);
    list.dataset.wishlistVisibleCount = String(visibleCount);
    list.classList.remove('wishlist-loading');
  }

  function toggleWishlist(button) {
    var variantId = String(button.dataset.variantId || '');
    if (!variantId) return;

    var ids = readWishlist();
    var existingIndex = ids.indexOf(variantId);

    if (existingIndex === -1) {
      ids.push(variantId);
    } else {
      ids.splice(existingIndex, 1);
    }

    ids = writeWishlist(ids);
    saveRemoteWishlist(ids);
    syncButtons();
    updateWishlistPage();
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-wishlist-toggle]');
    if (!button) return;

    event.preventDefault();
    toggleWishlist(button);
  });

  document.addEventListener('DOMContentLoaded', function () {
    hydrateWishlist();
    syncButtons();
    updateWishlistPage();
  });
})();
