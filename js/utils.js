(function () {
  function rootPath() {
    return window.location.pathname.includes('/pages/') ? '../' : './';
  }

  const navItems = [
    ['dashboard.html', 'Dashboard', 'DB'],
    ['inbound.html', 'Nhận hàng', 'IN'],
    ['iqc.html', 'IQC', 'QC'],
    ['putaway.html', 'Putaway', 'PT'],
    ['request.html', 'Yêu cầu', 'RQ'],
    ['outbound.html', 'Xuất kho', 'OUT'],
    ['inventory.html', 'Tồn kho', 'IV'],
    ['ng.html', 'Kho NG', 'NG'],
    ['admin.html', 'Admin', 'AD'],
  ];

  function initAppShell(activePage, title, subtitle) {
    const session = window.WMS_AUTH.requireAuth();
    if (!session) return;

    document.body.classList.add('app-page');
    const root = rootPath();
    const nav = navItems.map(item => {
      const active = item[0] === activePage ? 'active' : '';
      return `<a class="${active}" href="${root}pages/${item[0]}"><span class="nav-ico">${item[2]}</span><span>${item[1]}</span></a>`;
    }).join('');

    document.body.insertAdjacentHTML('afterbegin', `
      <div class="app-shell">
        <aside class="sidebar">
          <div class="sidebar-brand">
            <div class="sidebar-logo">W</div>
            <div><div class="sidebar-title">WMS PWA</div><div class="sidebar-sub">Kho vận hành</div></div>
          </div>
          <nav class="nav">${nav}</nav>
        </aside>
        <main class="main">
          <div class="topbar">
            <div class="page-title"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle || '')}</p></div>
            <div class="user-chip">
              <span>${escapeHtml(session.user.fullName || session.user.userId)}</span>
              <button class="btn ghost" id="logoutBtn">Đăng xuất</button>
            </div>
          </div>
          <div id="pageRoot"></div>
        </main>
      </div>
      <div class="toast-stack" id="toastStack"></div>
    `);
    document.getElementById('logoutBtn').addEventListener('click', () => window.WMS_AUTH.logout());
  }

  function pageRoot() {
    return document.getElementById('pageRoot');
  }

  function toast(message, type) {
    const stack = document.getElementById('toastStack') || document.body.appendChild(document.createElement('div'));
    stack.className = 'toast-stack';
    const node = document.createElement('div');
    node.className = 'toast ' + (type || '');
    node.textContent = message;
    stack.appendChild(node);
    setTimeout(() => node.remove(), 4200);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function badge(status) {
    const s = String(status || '').toUpperCase();
    let cls = 'badge';
    if (['APPROVED', 'CONFIRMED', 'CLOSED', 'DONE', 'AVAILABLE'].includes(s)) cls += ' ok';
    if (['PENDING', 'DRAFT', 'SUBMITTED', 'ALLOCATED', 'IN_PROGRESS'].includes(s)) cls += ' warn';
    if (['VOIDED', 'REJECTED', 'ERROR', 'DEPLETED'].includes(s)) cls += ' danger';
    return `<span class="${cls}">${escapeHtml(s || '-')}</span>`;
  }

  function formData(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  async function run(button, fn) {
    const original = button ? button.textContent : '';
    try {
      if (button) { button.disabled = true; button.textContent = 'Đang xử lý...'; }
      return await fn();
    } catch (err) {
      toast(err.message || 'Có lỗi xảy ra', 'error');
      throw err;
    } finally {
      if (button) { button.disabled = false; button.textContent = original; }
    }
  }

  async function loadTable(action, payload, tbody, rowFn, emptyCols) {
    tbody.innerHTML = `<tr><td colspan="${emptyCols || 6}" class="empty">Đang tải...</td></tr>`;
    try {
      const data = await window.WMS_API.call(action, payload || {});
      const items = data.items || data.lines || [];
      tbody.innerHTML = items.length
        ? items.map(rowFn).join('')
        : `<tr><td colspan="${emptyCols || 6}" class="empty">Chưa có dữ liệu</td></tr>`;
      return data;
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="${emptyCols || 6}" class="empty">${escapeHtml(err.message)}</td></tr>`;
      return null;
    }
  }

  window.WMS_UTILS = {
    rootPath,
    initAppShell,
    pageRoot,
    toast,
    escapeHtml,
    badge,
    formData,
    run,
    loadTable,
  };
})();
