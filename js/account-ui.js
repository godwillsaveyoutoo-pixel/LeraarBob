(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const overlay = $('authOverlay');
  const content = $('authContent');
  const accountBtn = $('accountBtn');
  const accountLabel = $('accountBtnLabel');
  const noteBtn = $('accountNoteBtn');

  let account = null;
  let mode = 'login';
  let message = '';
  let busy = false;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));

  function errorText(error, action) {
    if (error?.status === 429) return 'Te veel pogingen. Wacht even en probeer opnieuw.';
    if (error?.code === 'weak_password') return 'Kies een sterker wachtwoord van minstens 8 tekens.';
    if (action === 'register') return error?.message?.startsWith('Dit account vraagt')
      ? error.message
      : 'Registreren lukt niet. De alias kan al bezet zijn.';
    if (error?.message?.startsWith('Dit account heeft geen')) return error.message;
    if (error?.code === 'invalid_credentials' || /invalid login credentials/i.test(error?.message || '')) {
      return 'E-mailadres of wachtwoord klopt niet.';
    }
    if (/permission denied|schema|function/i.test(error?.message || '')) {
      return 'De login lukte, maar de leraarBob-accountcontrole kreeg geen toegang. Gebruik v0.7c of nieuwer.';
    }
    return 'Inloggen lukt niet. ' + (error?.message ? `Technische melding: ${error.message}` : 'Controleer je gegevens en probeer opnieuw.');
  }

  function safeReturnPath() {
    const raw = new URLSearchParams(location.search).get('return');
    if (!raw) return null;
    try {
      const base = new URL('./', location.href);
      const target = new URL(raw, base);
      if (target.origin !== base.origin) return null;
      if (!target.pathname.startsWith(base.pathname)) return null;
      return target.href;
    } catch {
      return null;
    }
  }

  function updateHeader() {
    if (!account) {
      accountLabel.textContent = 'Inloggen';
      accountBtn.classList.remove('signed-in','teacher');
      return;
    }
    accountBtn.classList.add('signed-in');
    accountBtn.classList.toggle('teacher', account.role === 'teacher');
    accountLabel.textContent = account.role === 'student'
      ? account.alias
      : account.role === 'teacher' ? 'Leerkracht' : 'Account';
  }

  function open() {
    overlay.hidden = false;
    document.body.classList.add('auth-open');
    render();
    setTimeout(() => overlay.querySelector('input,button')?.focus(), 0);
  }

  function close() {
    overlay.hidden = true;
    document.body.classList.remove('auth-open');
    accountBtn.focus();
  }

  function accountView() {
    if (account?.role === 'teacher') {
      return `
        <div class="account-summary">
          <span class="account-role">Leerkracht</span>
          <strong>${esc(account.email || 'leraarBob')}</strong>
          <p>Je account is gekoppeld aan de centrale leraarBob-omgeving.</p>
        </div>
        <div class="auth-actions">
          <a class="auth-primary" href="teacher/">Open leraarmodus <span>→</span></a>
          <button id="logoutBtn" class="auth-secondary" type="button">Uitloggen</button>
        </div>`;
    }
    if (account?.role === 'student') {
      return `
        <div class="account-summary">
          <span class="account-role">${esc(account.class_code)}</span>
          <strong>${esc(account.alias)}</strong>
          <p>Je bent aangemeld voor heel leraarBob. Ondersteunde onderdelen kunnen dezelfde sessie gebruiken.</p>
        </div>
        <div class="auth-actions">
          <a class="auth-primary" href="games/rechten/trainer/">Open Rechtentrainer <span>→</span></a>
          <button id="logoutBtn" class="auth-secondary" type="button">Uitloggen</button>
        </div>`;
    }
    return `
      <div class="account-summary">
        <strong>Account niet gekoppeld</strong>
        <p>Dit Supabase-account heeft nog geen leerlingprofiel of leerkrachtrechten.</p>
      </div>
      <div class="auth-actions"><button id="logoutBtn" class="auth-secondary" type="button">Uitloggen</button></div>`;
  }

  function loginView() {
    const reg = mode === 'register';
    const teacher = mode === 'teacher';
    const classes = window.AxiomaAuth.CLASSES.map(c => `<option>${c}</option>`).join('');
    return `
      <div class="auth-tabs" role="group" aria-label="Accounttype">
        <button type="button" data-mode="login" class="${mode==='login'?'active':''}">Leerling</button>
        <button type="button" data-mode="register" class="${reg?'active':''}">Account maken</button>
        <button type="button" data-mode="teacher" class="${teacher?'active':''}">Leerkracht</button>
      </div>
      <form id="centralAuthForm" class="central-auth-form">
        <label>${teacher ? 'E-mailadres' : 'Alias'}
          <input id="authName" type="${teacher ? 'email' : 'text'}" autocomplete="username" autocapitalize="none"
            ${teacher ? '' : 'minlength="3" maxlength="24" pattern="[A-Za-z0-9](?:[A-Za-z0-9_]|-){2,23}"'} required>
        </label>
        ${reg ? `<label>Klas<select id="authClass" required><option value="">Kies je klas</option>${classes}</select></label>` : ''}
        <label>Wachtwoord
          <input id="authPassword" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}"
            ${reg ? 'minlength="8"' : ''} maxlength="128" required>
        </label>
        ${reg ? `<label>Herhaal wachtwoord<input id="authRepeat" type="password" autocomplete="new-password" minlength="8" maxlength="128" required></label>` : ''}
        <p id="centralAuthMessage" class="auth-message" role="status">${esc(message)}</p>
        <button class="auth-primary auth-submit" type="submit" ${busy ? 'disabled' : ''}>
          ${busy ? 'Even wachten…' : reg ? 'Maak mijn account' : teacher ? 'Open leraarmodus' : 'Inloggen'}
          <span>→</span>
        </button>
      </form>`;
  }

  function render() {
    content.innerHTML = account ? accountView() : loginView();

    if (account) {
      $('logoutBtn')?.addEventListener('click', async () => {
        try {
          busy = true;
          await window.AxiomaAuth.signOut();
          account = null;
          message = '';
          updateHeader();
          render();
        } catch {
          message = 'Uitloggen lukt niet. Probeer opnieuw.';
        } finally {
          busy = false;
        }
      });
      return;
    }

    content.querySelectorAll('[data-mode]').forEach(button => {
      button.addEventListener('click', () => {
        mode = button.dataset.mode;
        message = '';
        render();
        $('authName')?.focus();
      });
    });

    $('centralAuthForm')?.addEventListener('submit', async event => {
      event.preventDefault();
      if (busy) return;

      const action = mode;
      const name = $('authName').value;
      const password = $('authPassword').value;
      const classCode = $('authClass')?.value;
      const repeat = $('authRepeat')?.value;

      if (action === 'register' && password !== repeat) {
        message = 'De wachtwoorden zijn niet gelijk.';
        render();
        return;
      }

      busy = true;
      message = '';
      render();

      try {
        if (action === 'register') {
          account = await window.AxiomaAuth.registerStudent(name, classCode, password);
        } else if (action === 'teacher') {
          account = await window.AxiomaAuth.signInTeacher(name, password);
        } else {
          account = await window.AxiomaAuth.signInStudent(name, password);
        }
        updateHeader();

        const returnPath = safeReturnPath();
        if (returnPath) {
          location.href = returnPath;
          return;
        }
        if (account?.role === 'teacher' && action === 'teacher') {
          location.href = 'teacher/';
          return;
        }
        close();
      } catch (error) {
        message = errorText(error, action);
        render();
      } finally {
        busy = false;
      }
    });
  }

  accountBtn.addEventListener('click', open);
  noteBtn?.addEventListener('click', open);
  $('authClose').addEventListener('click', close);
  $('authBackdrop').addEventListener('click', close);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !overlay.hidden) close();
  });

  async function init() {
    try {
      const result = await window.AxiomaAuth.ready();
      account = result.account;
      updateHeader();
      window.AxiomaAuth.onChange(detail => {
        account = detail.account;
        updateHeader();
        if (!overlay.hidden) render();
      });

      const params = new URLSearchParams(location.search);
      if (params.get('login') === '1') open();
    } catch (error) {
      console.error(error);
      accountLabel.textContent = 'Account';
      accountBtn.title = 'Accountverbinding niet beschikbaar';
    }
  }

  init();
})();
