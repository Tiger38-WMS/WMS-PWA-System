(function () {
  const cfg = () => window.WMS_CONFIG || {};

  function getDeviceId() {
    const key = cfg().DEVICE_KEY || 'wms.device.v1';
    let id = localStorage.getItem(key);
    if (!id) {
      id = 'WEB-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
      localStorage.setItem(key, id);
    }
    return id;
  }

  function getSession() {
    const raw = localStorage.getItem(cfg().SESSION_KEY || 'wms.session.v1');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function setSession(session) {
    localStorage.setItem(cfg().SESSION_KEY || 'wms.session.v1', JSON.stringify(session));
  }

  function clearSession() {
    localStorage.removeItem(cfg().SESSION_KEY || 'wms.session.v1');
  }

  async function login(userId, password) {
    const result = await window.WMS_API.call('login', {
      userId,
      password,
      deviceId: getDeviceId(),
    }, { public: true });

    setSession({
      sessionId: result.sessionId,
      expiresAt: result.expiresAt,
      user: result.user,
    });
    return result;
  }

  async function logout() {
    const session = getSession();
    try {
      if (session) await window.WMS_API.call('logout', {}, {});
    } finally {
      clearSession();
      window.location.href = window.WMS_UTILS.rootPath() + 'index.html';
    }
  }

  function requireAuth() {
    const session = getSession();
    if (!session || !session.sessionId) {
      window.location.href = window.WMS_UTILS.rootPath() + 'index.html';
      return null;
    }
    return session;
  }

  window.WMS_AUTH = { getDeviceId, getSession, setSession, clearSession, login, logout, requireAuth };
})();
