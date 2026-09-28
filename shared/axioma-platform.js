/* Platform navigation. Subject engines own exercises; this layer owns destinations. */
(() => {
  'use strict';
  if (window.AxiomaPlatform) return;
  const script = document.currentScript;
  const root = script?.src ? new URL('../', script.src) : new URL(script?.dataset.platformRoot || '../../', location.href);
  const home = new URL('index.html', root);
  const wired = new WeakSet();
  function homeURL() { return home.href; }
  function goHome(event) {
    event?.preventDefault(); event?.stopPropagation();
    // Keep previews inside their host; their existing navigation listener handles this event.
    if (window !== window.top) {
      window.parent.postMessage({type:'axioma:navigate-home',url:home.href}, location.origin === 'null' ? '*' : location.origin);
      return;
    }
    location.assign(home.href);
  }
  function wireHome(element, { beforeLeave } = {}) {
    if (!element) return null;
    // Some imported games put the brand inside an old menu button. Convert that
    // button, preserving its child nodes (and references to game title nodes).
    let link = element.closest('button') || element;
    if (wired.has(link)) return link;
    if (link.tagName !== 'A') {
      const anchor = document.createElement('a');
      for (const attribute of link.attributes) if (!['type','role','tabindex','onclick'].includes(attribute.name)) anchor.setAttribute(attribute.name, attribute.value);
      while (link.firstChild) anchor.append(link.firstChild);
      link.replaceWith(anchor); link = anchor;
    }
    link.href = home.href;
    link.dataset.platformHome = '';
    link.classList.add('axioma-platform-home');
    link.setAttribute('aria-label','Naar de startpagina van leraarBob');
    link.title = 'Naar de startpagina van leraarBob';
    link.addEventListener('click', async event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); event.stopPropagation();
      if (beforeLeave && await beforeLeave() === false) return;
      goHome();
    });
    wired.add(link); return link;
  }
  function bindTrainer(actions) {
    for (const button of document.querySelectorAll('[data-trainer-action]')) {
      const action = actions[button.dataset.trainerAction];
      if (action) button.addEventListener('click', action);
    }
  }
  function trainerScreen(name) {
    for (const button of document.querySelectorAll('[data-trainer-action]')) {
      const active = button.dataset.trainerAction === name;
      if (active) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
    }
  }
  const style=document.createElement('style');
  style.textContent='.axioma-platform-home{color:inherit;text-decoration:none;cursor:pointer}.axioma-platform-home:focus-visible{outline:3px solid currentColor;outline-offset:3px}[data-trainer-action][aria-current="page"]{box-shadow:inset 0 -2px currentColor}';
  document.head.append(style);
  window.AxiomaPlatform = Object.freeze({homeURL,goHome,wireHome,bindTrainer,trainerScreen});
  const mount=()=>document.querySelectorAll('[data-platform-home],a.axiomaHome').forEach(element=>wireHome(element));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
