/* A disclosure navigation: ordinary buttons, keyboard access, no duplicate destinations. */
(() => {
  'use strict';
  const toggle = document.getElementById('menuBtn');
  const menu = document.getElementById('trainerMenu');
  const actions = document.querySelector('.trainer-actions');
  function close(restoreFocus = false) {
    if (menu.hidden) return;
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Menu openen');
    if (restoreFocus) toggle.focus({preventScroll: true});
  }
  toggle.addEventListener('click', () => {
    if (!menu.hidden) return close(true);
    menu.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Menu sluiten');
    [...menu.querySelectorAll('button')].find(button => !button.hidden && button.getClientRects().length)?.focus();
  });
  // Close before the exercise engine captures the return-focus element.
  menu.addEventListener('click', event => {
    if (event.target.closest('button')) close(true);
  }, true);
  document.getElementById('profileBtn').addEventListener('click', () => close());
  document.addEventListener('pointerdown', event => {
    if (!actions.contains(event.target)) close();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !menu.hidden) {
      event.preventDefault();
      event.stopImmediatePropagation();
      close(true);
    }
  }, true);
  actions.addEventListener('focusout', event => {
    if (!actions.contains(event.relatedTarget)) close();
  });
})();
