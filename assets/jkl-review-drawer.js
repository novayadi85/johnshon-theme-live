class JklReviewDrawer {
  constructor(drawer) {
    this.drawer = drawer;
    this.panel = drawer.querySelector('.pdp-review-drawer__panel');
    this.openButtons = document.querySelectorAll('[data-review-drawer-open]');
    this.closeButtons = drawer.querySelectorAll('[data-review-drawer-close]');
    this.bottomCloseButton = drawer.querySelector('.pdp-review-drawer__bottom-close');
    this.previousActiveElement = null;
    this.lastScrollTop = 0;
    this.lastNudgeAt = 0;

    this.openButtons.forEach((button) => {
      button.addEventListener('click', () => this.open(button.dataset.reviewIndex));
    });

    this.closeButtons.forEach((button) => {
      button.addEventListener('click', () => this.close());
    });

    this.panel?.addEventListener('scroll', () => this.handlePanelScroll(), { passive: true });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.drawer.classList.contains('is-open')) {
        this.close();
      }
    });
  }

  open(reviewIndex) {
    this.previousActiveElement = document.activeElement;
    this.drawer.classList.add('is-open');
    this.drawer.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('pdp-review-drawer-open');
    this.panel?.focus({ preventScroll: true });
    this.lastScrollTop = this.panel?.scrollTop || 0;
    this.updateBottomCloseVisibility();

    const reviewItem = this.drawer.querySelector(`[data-review-drawer-item="${reviewIndex}"]`);
    window.setTimeout(() => {
      reviewItem?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 240);
  }

  close() {
    this.drawer.classList.remove('is-open');
    this.drawer.classList.remove('show-bottom-close');
    this.drawer.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('pdp-review-drawer-open');

    if (this.previousActiveElement instanceof HTMLElement) {
      this.previousActiveElement.focus({ preventScroll: true });
    }
  }

  handlePanelScroll() {
    const currentScrollTop = this.panel?.scrollTop || 0;
    const hasScrolled = Math.abs(currentScrollTop - this.lastScrollTop) > 6;
    this.lastScrollTop = currentScrollTop;
    this.updateBottomCloseVisibility();

    if (!hasScrolled || !this.bottomCloseButton) return;

    const now = Date.now();
    if (now - this.lastNudgeAt < 1000) return;

    this.lastNudgeAt = now;
    this.bottomCloseButton.classList.remove('is-nudging-up');
    void this.bottomCloseButton.offsetWidth;
    this.bottomCloseButton.classList.add('is-nudging-up');
  }

  updateBottomCloseVisibility() {
    this.drawer.classList.toggle('show-bottom-close', (this.panel?.scrollTop || 0) > 50);
  }
}

const initReviewDrawers = () => {
  document.querySelectorAll('[data-review-drawer]').forEach((drawer) => {
    if (drawer.dataset.reviewDrawerReady) return;
    drawer.dataset.reviewDrawerReady = 'true';
    new JklReviewDrawer(drawer);
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initReviewDrawers);
} else {
  initReviewDrawers();
}
