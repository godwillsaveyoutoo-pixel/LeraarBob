(() => {
  'use strict';

  const CLASSES = Object.freeze(['3TBO','3TMW','3TMWW','4TMWW','4TMW']);
  const STUDENT_DOMAIN = 'students.axioma.invalid';
  const ALIAS_RE = /^[a-z0-9][a-z0-9_-]{2,23}$/;

  let client = null;
  let readyPromise = null;
  let currentSession = null;
  let currentAccount = null;
  const listeners = new Set();

  function config() {
    return window.AXIOMA_CONFIG || {};
  }

  function configured() {
    const cfg = config();
    return /^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(cfg.url || '') && !!cfg.publicKey;
  }

  function getClient() {
    if (client) return client;
    if (!configured()) throw new Error('Axioma is nog niet aan Supabase gekoppeld.');
    if (!window.supabase?.createClient) throw new Error('De Supabase-browserbibliotheek is niet geladen.');

    const cfg = config();
    client = window.supabase.createClient(cfg.url, cfg.publicKey, {
      auth: {
        storage: window.localStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: cfg.storageKey || 'axioma-auth-v1'
      }
    });
    return client;
  }

  function normalizeAlias(alias) {
    const value = String(alias || '').trim().toLowerCase();
    if (!ALIAS_RE.test(value)) {
      throw new Error('Gebruik 3–24 tekens: letters, cijfers, een streepje of underscore.');
    }
    return value;
  }

  function aliasEmail(alias) {
    return `${normalizeAlias(alias)}@${STUDENT_DOMAIN}`;
  }

  function emit() {
    const detail = Object.freeze({
      session: currentSession,
      account: currentAccount
    });
    listeners.forEach(fn => {
      try { fn(detail); } catch (error) { console.error(error); }
    });
    window.dispatchEvent(new CustomEvent('axioma:auth', { detail }));
  }

  async function resolveAccount(session) {
    currentSession = session || null;

    if (!session?.user?.id) {
      currentAccount = null;
      emit();
      return null;
    }

    const sb = getClient();
    const userId = session.user.id;

    // Use the two proven existing endpoints instead of the newer axioma_account()
    // wrapper. Concurrent checks for the same session are harmless.
    const { data: isTeacher, error: teacherError } = await sb.rpc('axioma_is_teacher');
    if (teacherError) throw teacherError;

    const { data: profile, error: profileError } = await sb
      .from('axioma_profiles')
      .select('user_id,alias,class_code')
      .eq('user_id', userId)
      .maybeSingle();
    if (profileError) throw profileError;

    // Never let a late request restore an account after logout/session replacement.
    if (currentSession?.user?.id !== userId) return currentAccount;

    if (isTeacher === true) {
      currentAccount = Object.freeze({
        id: userId,
        role: 'teacher',
        email: session.user.email || ''
      });
    } else if (profile) {
      currentAccount = Object.freeze({
        id: userId,
        role: 'student',
        alias: profile.alias,
        class_code: profile.class_code
      });
    } else {
      currentAccount = Object.freeze({
        id: userId,
        role: 'unknown',
        email: session.user.email || ''
      });
    }

    emit();
    return currentAccount;
  }

  async function refresh(sessionOverride) {
    const sb = getClient();
    let session = sessionOverride;
    if (session === undefined) {
      const { data, error } = await sb.auth.getSession();
      if (error) throw error;
      session = data.session;
    }
    return resolveAccount(session);
  }

  function ready() {
    if (readyPromise) return readyPromise;
    readyPromise = (async () => {
      const sb = getClient();

      sb.auth.onAuthStateChange((_event, session) => {
        // Do not perform follow-up Supabase calls synchronously inside the callback.
        setTimeout(() => {
          resolveAccount(session).catch(error => {
            console.error('Axioma auth refresh:', error);
          });
        }, 0);
      });

      await refresh();
      return {
        client: sb,
        session: currentSession,
        account: currentAccount
      };
    })();
    return readyPromise;
  }

  async function signInStudent(alias, password) {
    const sb = getClient();
    const { data, error } = await sb.auth.signInWithPassword({
      email: aliasEmail(alias),
      password
    });
    if (error) throw error;
    await resolveAccount(data.session);
    return currentAccount;
  }

  async function signInTeacher(email, password) {
    const sb = getClient();
    const { error } = await sb.auth.signInWithPassword({
      email: String(email || '').trim(),
      password
    });
    if (error) throw error;

    // Read the session back from the shared client. This avoids a race with
    // Supabase's SIGNED_IN callback and guarantees the RPC uses the active JWT.
    const { data: sessionData, error: sessionError } = await sb.auth.getSession();
    if (sessionError) throw sessionError;

    const account = await resolveAccount(sessionData.session);
    if (account?.role !== 'teacher') {
      await sb.auth.signOut({ scope: 'local' });
      await resolveAccount(null);
      throw new Error('Dit account heeft geen leerkrachtrechten.');
    }
    return account;
  }

  async function registerStudent(alias, classCode, password) {
    const cleanAlias = normalizeAlias(alias);
    if (!CLASSES.includes(classCode)) throw new Error('Kies je klas.');
    if (String(password || '').length < 8) throw new Error('Gebruik een wachtwoord van minstens 8 tekens.');

    const sb = getClient();
    const { data, error } = await sb.auth.signUp({
      email: aliasEmail(cleanAlias),
      password,
      options: { data: { alias: cleanAlias, class_code: classCode } }
    });
    if (error) throw error;
    if (!data.session) {
      throw new Error('Dit account vraagt nog e-mailbevestiging. Controleer de Supabase e-mailinstellingen voor leerlingaccounts.');
    }
    await resolveAccount(data.session);
    return currentAccount;
  }

  async function signOut() {
    const sb = getClient();
    const { error } = await sb.auth.signOut({ scope: 'local' });
    if (error) throw error;
    await resolveAccount(null);
  }

  async function getSession() {
    await ready();
    return currentSession;
  }

  async function getAccount() {
    await ready();
    return currentAccount;
  }

  function onChange(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  window.AxiomaAuth = Object.freeze({
    CLASSES,
    STUDENT_DOMAIN,
    configured,
    client: getClient,
    ready,
    refresh,
    getSession,
    getAccount,
    signInStudent,
    signInTeacher,
    registerStudent,
    signOut,
    onChange,
    aliasEmail
  });
})();
