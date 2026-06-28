(function () {
  const DB_NAME = 'wms-pwa-db';
  const DB_VERSION = 1;
  const STORE = 'offlineQueue';
  let dbPromise = null;

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        dbPromise = null;
        reject(req.error);
      };
    });
    return dbPromise;
  }

  async function tx(mode, fn) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      const store = t.objectStore(STORE);
      const result = fn(store);
      t.oncomplete = () => resolve(result);
      t.onerror = () => reject(t.error);
    });
  }

  async function addQueue(item) {
    item.id = item.id || ('q-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8));
    item.createdAt = item.createdAt || new Date().toISOString();
    await tx('readwrite', store => store.put(item));
    return item;
  }

  async function listQueue() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const t = db.transaction(STORE, 'readonly');
      const req = t.objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function removeQueue(id) {
    return tx('readwrite', store => store.delete(id));
  }

  window.WMS_DB = { addQueue, listQueue, removeQueue };
})();
