(function () {
  function rootPath() {
    return window.location.pathname.includes('/pages/') ? '../' : './';
  }

  const navTree = [
    { page: 'dashboard.html', label: 'Tổng quan', icon: 'DB' },
    {
      id: 'purchase',
      label: 'Thu mua',
      icon: 'PO',
      children: [
        { page: 'po.html#manage', label: 'Quản lý thu mua' },
        { page: 'report.html#purchase', label: 'Báo cáo Thu mua' },
      ],
    },
    {
      id: 'inbound',
      label: 'Quản lý nhập kho',
      icon: 'IN',
      children: [
        { page: 'inbound.html#receive', label: 'Nhận hàng' },
        { page: 'putaway.html#pending', label: 'Nhập kho' },
        { page: 'putaway.html#history', label: 'Lịch sử nhập kho' },
        { page: 'print.html#lot-label', label: 'In tem nhập kho' },
      ],
    },
    {
      id: 'iqc',
      label: 'IQC',
      icon: 'QC',
      children: [
        { page: 'iqc.html#overview', label: 'Tổng quan IQC' },
        { page: 'iqc.html#pending', label: 'Danh sách chờ IQC' },
        { page: 'iqc.html#inspect', label: 'Thực hiện kiểm' },
        { page: 'iqc.html#history', label: 'Lịch sử IQC' },
        { page: 'report.html#iqc', label: 'Báo cáo IQC' },
      ],
    },
    {
      id: 'request',
      label: 'Quản lý đơn nhập/xuất',
      icon: 'RQ',
      children: [
        { page: 'request.html#create', label: 'Tạo đơn mới' },
        { page: 'request.html#history', label: 'Lịch sử tạo đơn' },
        { page: 'request.html#approval-log', label: 'Lịch sử phê duyệt' },
      ],
    },
    {
      id: 'outbound',
      label: 'Quản lý xuất kho',
      icon: 'OUT',
      children: [
        { page: 'outbound.html#pending', label: 'Danh sách phiếu xuất' },
        { page: 'outbound.html#void', label: 'Hủy phiếu xuất kho' },
        { page: 'outbound.html#history', label: 'Lịch sử xuất kho' },
        { page: 'outbound.html#print', label: 'In phiếu xuất kho' },
      ],
    },
    {
      id: 'inventory',
      label: 'Quản lý tồn kho',
      icon: 'IV',
      children: [
        { page: 'inventory.html#overview', label: 'Tổng quan tồn kho' },
        { page: 'inventory-history.html', label: 'Lịch sử giao dịch' },
      ],
    },
    { page: 'ng.html', label: 'Kho NG', icon: 'NG' },
    {
      id: 'location',
      label: 'Quản lý vị trí',
      icon: 'LC',
      children: [
        { page: 'location.html#list', label: 'Danh sách vị trí' },
        { page: 'location.html#edit', label: 'Thêm/Sửa vị trí' },
        { page: 'location.html#move', label: 'Di chuyển hàng' },
        { page: 'location.html#warehouse', label: 'Cấu trúc kho' },
      ],
    },
    { page: 'print.html', label: 'In ấn', icon: 'PR' },
    {
      id: 'stocktake',
      label: 'Kiểm kê',
      icon: 'ST',
      children: [
        { page: 'stocktake.html#list', label: 'Danh sách đợt' },
        { page: 'stocktake.html#create', label: 'Tạo phiên kiểm kê' },
        { page: 'stocktake.html#count', label: 'Thực hiện kiểm kê' },
        { page: 'stocktake.html#review', label: 'Review & Duyệt' },
        { page: 'report.html#stocktake', label: 'Báo cáo kiểm kê' },
      ],
    },
    { page: 'report.html', label: 'Báo cáo', icon: 'RP' },
    { page: 'admin.html', label: 'Quản trị', icon: 'AD' },
  ];

  function pageName(page) {
    return String(page || '').split('#')[0];
  }

  function pageHash(page) {
    const parts = String(page || '').split('#');
    return parts.length > 1 ? '#' + parts.slice(1).join('#') : '';
  }

  function matchesCurrentPage(page, activePage) {
    if (!page || pageName(page) !== activePage) return false;
    const currentHash = window.location.hash || '';
    const itemHash = pageHash(page);
    if (currentHash) return itemHash === currentHash;
    return itemHash === '';
  }

  function isActivePage(item, activePage) {
    if (item.page && matchesCurrentPage(item.page, activePage)) return true;
    return (item.children || []).some(child => matchesCurrentPage(child.page, activePage));
  }

  function isActiveChild(children, child, index, activePage) {
    return matchesCurrentPage(child.page, activePage);
  }

  function buildNav(activePage, root) {
    return navTree.map(item => {
      if (!item.children) {
        const active = isActivePage(item, activePage) ? 'active' : '';
        return `<a class="${active}" href="${root}pages/${item.page}"><span class="nav-ico">${item.icon}</span><span>${item.label}</span></a>`;
      }

      const open = isActivePage(item, activePage) ? ' open' : '';
      const childLinks = item.children.map((child, index) => {
        const active = isActiveChild(item.children, child, index, activePage) ? 'active' : '';
        return `<a class="nav-child ${active}" href="${root}pages/${child.page}"><span>${child.label}</span></a>`;
      }).join('');

      return `
        <div class="nav-group${open}">
          <button class="nav-parent" type="button" data-nav-group="${item.id}" aria-expanded="${open ? 'true' : 'false'}">
            <span class="nav-ico">${item.icon}</span><span>${item.label}</span><span class="nav-caret">▾</span>
          </button>
          <div class="nav-children">${childLinks}</div>
        </div>`;
    }).join('');
  }

  function initAppShell(activePage, title, subtitle) {
    const session = window.WMS_AUTH.requireAuth();
    if (!session) return;

    document.body.classList.add('app-page');
    const root = rootPath();
    const nav = buildNav(activePage, root);

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
    document.querySelectorAll('.nav-parent').forEach(button => {
      button.addEventListener('click', () => {
        const group = button.closest('.nav-group');
        const isOpen = group.classList.toggle('open');
        button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    });
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
