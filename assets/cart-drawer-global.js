/**
 * Global function to open the JKL cart drawer.
 * The drawer itself (snippets/jkl-cart-drawer.liquid) defines window.jklOpenCart /
 * window.openCartDrawer once it has initialised. This is a safe fallback for callers
 * that load before the drawer script runs.
 */
if (typeof window.openCartDrawer !== 'function') {
  window.openCartDrawer = function () {
    if (typeof window.jklOpenCart === 'function') {
      window.jklOpenCart();
      return true;
    }
    var overlay = document.getElementById('cartDrawerOverlay');
    if (overlay) {
      overlay.classList.add('cart-open');
      document.body.style.overflow = 'hidden';
      return true;
    }
    return false;
  };
}

/**
 * Helper to add an item to the cart and open the drawer.
 * @param {number} variantId - The variant ID to add
 * @param {number} quantity - Quantity to add (default: 1)
 */
window.addToCartAndOpen = function (variantId, quantity) {
  quantity = quantity || 1;

  var formData = new FormData();
  formData.append('id', variantId);
  formData.append('quantity', quantity);

  fetch('/cart/add.js', {
    method: 'POST',
    body: formData
  })
    .then(function (response) {
      return response.json();
    })
    .then(function () {
      // Prefer the drawer's own refresh-and-open so contents stay in sync.
      if (typeof window.refreshAndOpenCart === 'function') {
        window.refreshAndOpenCart();
      } else {
        window.openCartDrawer();
      }
    })
    .catch(function (error) {
      console.error('Error adding to cart:', error);
    });
};
