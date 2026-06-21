(function () {
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

  async function call(action, payload, options) {
    options = options || {};
    const body = {
      action,
      sessionId: getSessionId(options),
      payload: payload || {},
    };

    try {
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
        throw err;
      }
      return data.data;
    } catch (err) {
      if (options.queue && window.WMS_DB) {
        await window.WMS_DB.addQueue({ action, sessionId: body.sessionId, payload: body.payload });
        return { queued: true };
      }
      throw err;
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

  window.WMS_API = { call, syncQueue };
})();
