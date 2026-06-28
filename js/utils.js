(function () {
  function rootPath() {
    return window.location.pathname.includes('/pages/') ? '../' : './';
  }

  const navItems = [
    ['dashboard.html', 'Tổng quan', 'DB'],
    ['po.html', 'Thu mua', 'PO'],
    ['inbound.html', 'Nhận hàng', 'IN'],
    ['iqc.html', 'IQC', 'QC'],
    ['putaway.html', 'Nhập vị trí', 'PT'],
    ['request.html', 'Quản lý đơn', 'RQ'],
    ['outbound.html', 'Xuất kho', 'OUT'],
    ['inventory.html', 'Tồn kho', 'IV'],
    ['ng.html', 'Kho NG', 'NG'],
    ['location.html', 'Vị trí', 'LC'],
    ['print.html', 'In ấn', 'PR'],
    ['stocktake.html', 'Kiểm kê', 'ST'],
    ['report.html', 'Báo cáo', 'RP'],
    ['admin.html', 'Quản trị', 'AD'],
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
            <div><div class="sidebar-title">Quản lý kho WMS</div><div class="sidebar-sub">Kho vận hành</div></div>
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
    const labels = {
      APPROVED: 'Đã duyệt',
      AVAILABLE: 'Có sẵn',
      ALLOCATED: 'Đã phân bổ',
      CLOSED: 'Đã đóng',
      CONFIRMED: 'Đã xác nhận',
      DEPLETED: 'Hết hàng',
      DONE: 'Hoàn tất',
      DRAFT: 'Nháp',
      EMPTY: 'Trống',
      ERROR: 'Lỗi',
      FAIL: 'Không đạt',
      IN_PROGRESS: 'Đang xử lý',
      ISSUING: 'Đang xuất',
      LOCKED: 'Đã khóa',
      MATCH: 'Khớp',
      OCCUPIED: 'Có hàng',
      OPEN: 'Đang mở',
      OVER: 'Thừa',
      PASS: 'Đạt',
      PARTIAL: 'Một phần',
      PENDING: 'Đang chờ',
      PENDING_APPROVAL: 'Chờ duyệt',
      PRINTED: 'Đã in',
      PRINTING: 'Đang in',
      RECEIVED: 'Đã nhận',
      REJECTED: 'Từ chối',
      SKIP: 'Bỏ qua',
      SHORT: 'Thiếu',
      SUBMITTED: 'Đã gửi',
      UNCOUNTED: 'Chưa đếm',
      VOIDED: 'Đã hủy',
      CANCELLED: 'Đã hủy',
      COMPLETED: 'Hoàn thành',
      BLOCKED: 'Đã khóa',
    };
    let cls = 'badge';
    if (['APPROVED', 'CONFIRMED', 'CLOSED', 'DONE', 'AVAILABLE', 'PASS', 'PRINTED', 'COMPLETED', 'RECEIVED', 'MATCH', 'EMPTY'].includes(s)) cls += ' ok';
    if (['PENDING', 'DRAFT', 'SUBMITTED', 'ALLOCATED', 'IN_PROGRESS', 'PRINTING', 'SKIP', 'PENDING_APPROVAL', 'OPEN', 'PARTIAL', 'ISSUING', 'UNCOUNTED', 'OVER'].includes(s)) cls += ' warn';
    if (['VOIDED', 'REJECTED', 'ERROR', 'DEPLETED', 'FAIL', 'CANCELLED', 'BLOCKED', 'LOCKED', 'SHORT'].includes(s)) cls += ' danger';
    return `<span class="${cls}">${escapeHtml(labels[s] || s || '-')}</span>`;
  }

  function field(row, names, fallback) {
    if (!row) return fallback == null ? '' : fallback;
    const list = Array.isArray(names) ? names : [names];
    for (const name of list) {
      if (row[name] !== undefined && row[name] !== null && row[name] !== '') return row[name];
    }
    return fallback == null ? '' : fallback;
  }

  function money(value) {
    const n = Number(value || 0);
    return Number.isFinite(n) ? n.toLocaleString('vi-VN') : escapeHtml(value);
  }

  function table(headers, rows, emptyText) {
    const head = headers.map(h => `<th>${escapeHtml(h)}</th>`).join('');
    const body = rows && rows.length
      ? rows.join('')
      : `<tr><td colspan="${headers.length}" class="empty">${escapeHtml(emptyText || 'Chưa có dữ liệu')}</td></tr>`;
    return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  }

  function jsonBlock(value) {
    return `<pre class="json-block">${escapeHtml(JSON.stringify(value || {}, null, 2))}</pre>`;
  }

  function fillSelect(select, items, valueKey, labelKey, placeholder) {
    if (!select) return;
    const options = [];
    if (placeholder) options.push(`<option value="">${escapeHtml(placeholder)}</option>`);
    (items || []).forEach(item => {
      const value = field(item, valueKey);
      const label = field(item, labelKey || valueKey) || value;
      options.push(`<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`);
    });
    select.innerHTML = options.join('');
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
    field,
    money,
    table,
    jsonBlock,
    fillSelect,
    formData,
    run,
    loadTable,
  };
})();
