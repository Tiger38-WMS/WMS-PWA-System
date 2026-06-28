(function () {
  const memoryCache = new Map();
  const pendingCalls = new Map();
  const MUTATION_PREFIXES = /^(create|save|confirm|submit|void|close|cancel|approve|reject|mark|enqueue|admin|change|update|add|bulk|block|unblock|move|split|open|recalc|check)/i;

  function config() {
    return window.WMS_CONFIG || {};
  }

  function ensureApiUrl() {
    const url = config().GAS_API_URL || '';
    if (!url) throw new Error('Chưa cấu hình GAS_API_URL trong config.js');
    return url;
  }

  function getSessionId(options) {
    if (options && options.public) return '';
    const session = window.WMS_AUTH ? window.WMS_AUTH.getSession() : null;
    return session ? session.sessionId : '';
  }

  function cacheKey(action, body) {
    return action + '::' + body.sessionId + '::' + JSON.stringify(body.payload || {});
  }

  function getCached(key) {
    const item = memoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      memoryCache.delete(key);
      return null;
    }
    return item.data;
  }

  function setCached(key, data, ttlMs) {
    if (!ttlMs) return;
    memoryCache.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  function clearCache() {
    memoryCache.clear();
  }

  async function call(action, payload, options) {
    options = options || {};
    const body = {
      action,
      sessionId: getSessionId(options),
      payload: payload || {},
    };
    const key = cacheKey(action, body);
    const cacheTtlMs = Number(options.cacheTtlMs || 0);
    if (cacheTtlMs) {
      const cached = getCached(key);
      if (cached) return cached;
    }
    if (pendingCalls.has(key)) return pendingCalls.get(key);

    const request = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), config().API_TIMEOUT_MS || 25000);
      const response = await fetch(ensureApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timer);

      const data = await response.json();
      if (!data.ok) {
        const err = new Error(data.message || data.errorCode || 'API error');
        err.code = data.errorCode;
        if (err.code === 'SESSION_EXPIRED' && window.WMS_AUTH) window.WMS_AUTH.clearSession();
        throw err;
      }
      if (MUTATION_PREFIXES.test(action)) clearCache();
      setCached(key, data.data, cacheTtlMs);
      return data.data;
    })();

    pendingCalls.set(key, request);
    try {
      return await request;
    } catch (err) {
      if (options.queue && window.WMS_DB) {
        await window.WMS_DB.addQueue({ action, sessionId: body.sessionId, payload: body.payload });
        return { queued: true };
      }
      throw err;
    } finally {
      pendingCalls.delete(key);
    }
  }

  async function syncQueue() {
    if (!window.WMS_DB) return { synced: 0 };
    const items = await window.WMS_DB.listQueue();
    let synced = 0;
    for (const item of items) {
      const body = { action: item.action, sessionId: item.sessionId, payload: item.payload };
      const response = await fetch(ensureApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!data.ok) throw new Error(data.message || data.errorCode || 'Sync error');
      await window.WMS_DB.removeQueue(item.id);
      synced++;
    }
    return { synced };
  }

  window.WMS_API = { call, syncQueue, clearCache };
})();
