
(function () {
  // Shopify app proxy — forwards to the communication app server-side.
  var CANCEL_ORDER_ENDPOINT = '/apps/communication';

  document.addEventListener('submit', function (event) {
    var form = event.target.closest('.cancel-order-form');
    if (!form) return;

    event.preventDefault();

    var submitButton = form.querySelector('.cancel-order-form__submit');
    var messageEl = form.querySelector('.cancel-order-form__message');

    function showMessage(text, isError) {
      if (!messageEl) return;
      messageEl.textContent = text;
      messageEl.hidden = false;
      messageEl.classList.toggle('cancel-order-form__message--error', !!isError);
      messageEl.classList.toggle('cancel-order-form__message--success', !isError);
    }

    function getErrorMessage(error) {
      var message = error && error.message ? error.message : '';

      if (message === 'No order found for the given order number/email.') {
        return 'Vi kunne ikke finde en ordre med det angivne ordrenummer og e-mail.';
      }

      return message || 'Noget gik galt. Prøv venligst igen senere.';
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    function value(name) {
      var field = form.querySelector('[name="' + name + '"]');
      return field ? field.value.trim() : '';
    }

    var payload = {
      method: 'cancel_order',
      // Customers type their order number by hand (e.g. "#1234") — strip the
      // prefix and let the proxy resolve it against name/email.
      order_id: value('order_number').replace(/^#/, ''),
      reason: value('reason'),
      reason_note: value('reason_note'),
      name: value('name'),
      email: value('email')
    };

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.classList.add('button--loading');
    }

    fetch(CANCEL_ORDER_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        return response.json()
          .catch(function () { return {}; })
          .then(function (data) {
            if (!response.ok || data.success === false || data.error) {
              throw new Error(data.error || data.message || 'Request failed: ' + response.status);
            }
            return data;
          });
      })
      .then(function () {
        showMessage('Tak! Vi har modtaget din anmodning om at fortryde din ordre.', false);
        form.reset();
      })
      .catch(function (error) {
        console.error('Cancel order submit failed:', error); 
        showMessage(getErrorMessage(error), true);
      })
      .finally(function () {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.classList.remove('button--loading');
        }
      });
  });
})();
