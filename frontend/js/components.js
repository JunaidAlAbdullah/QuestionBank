// Human-readable labels for the content-type enum used across the app.
const QB_CONTENT_TYPES = [
  { value: 'quiz_question', label: 'Quiz Question' },
  { value: 'mid_question', label: 'Midterm Question' },
  { value: 'final_question', label: 'Final Question' },
  { value: 'assignment_question', label: 'Assignment Question' },
  { value: 'term_paper', label: 'Term Paper' },
  { value: 'lab_report', label: 'Lab Report' },
  { value: 'quiz_solution', label: 'Quiz Solution' },
  { value: 'mid_solution', label: 'Midterm Solution' },
  { value: 'final_solution', label: 'Final Solution' },
  { value: 'project_report', label: 'Project Report' },
  { value: 'presentation_slide', label: 'Presentation Slide' },
];

function qbContentTypeLabel(value) {
  const found = QB_CONTENT_TYPES.find((t) => t.value === value);
  return found ? found.label : value;
}

function qbEscapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function qbFormatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return isoString;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------
function qbRenderNavbar(activePage) {
  const mount = document.getElementById('app-navbar');
  if (!mount) return;

  const user = QBAuth.getUser();
  const links = [
    { href: 'browse.html', label: 'Browse', key: 'browse' },
    { href: 'upload.html', label: 'Upload', key: 'upload' },
    { href: 'my-questions.html', label: 'My Questions', key: 'my-questions' },
  ];

  const linksHtml = links.map((l) => (
    `<a href="${l.href}" class="${activePage === l.key ? 'active' : ''}">${l.label}</a>`
  )).join('');

  const rightHtml = user
    ? `
      <a href="profile.html#${encodeURIComponent(user.username)}" class="user-chip">${qbEscapeHtml(user.username)}</a>
      <button class="btn btn-sm" id="qb-logout-btn">Logout</button>
    `
    : `
      <a href="login.html" class="btn btn-sm">Login</a>
      <a href="register.html" class="btn btn-sm btn-primary">Register</a>
    `;

  mount.innerHTML = `
    <div class="container navbar">
      <a href="index.html" class="navbar-brand">Question Bank</a>
      <button class="navbar-toggle" id="qb-nav-toggle" aria-label="Toggle navigation">☰</button>
      <div class="navbar-links" id="qb-nav-links">${linksHtml}</div>
      <div class="navbar-right">${rightHtml}</div>
    </div>
  `;

  const toggle = document.getElementById('qb-nav-toggle');
  const navLinks = document.getElementById('qb-nav-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  }

  const logoutBtn = document.getElementById('qb-logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => QBAuth.logout());
}

function qbRenderFooter() {
  const mount = document.getElementById('app-footer');
  if (!mount) return;
  mount.innerHTML = `
    <div class="container">
      <small>Question Bank — a student-built archive of previous exam questions.</small>
      <small>Uploads stay anonymous. Be the senior you wish you had.</small>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Toasts
// ---------------------------------------------------------------------------
function qbToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  el.className = `toast ${type === 'error' ? 'toast-error' : type === 'success' ? 'toast-success' : ''}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ---------------------------------------------------------------------------
// Confirm modal (replaces window.confirm with something on-brand)
// ---------------------------------------------------------------------------
function qbConfirm(message, { title = 'Are you sure?', confirmLabel = 'Confirm', danger = false } = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <h3>${qbEscapeHtml(title)}</h3>
        <p>${qbEscapeHtml(message)}</p>
        <div class="modal-actions">
          <button class="btn" id="qb-modal-cancel">Cancel</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="qb-modal-confirm">${qbEscapeHtml(confirmLabel)}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const cleanup = (result) => {
      overlay.remove();
      resolve(result);
    };
    overlay.querySelector('#qb-modal-cancel').addEventListener('click', () => cleanup(false));
    overlay.querySelector('#qb-modal-confirm').addEventListener('click', () => cleanup(true));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) cleanup(false); });
  });
}

// ---------------------------------------------------------------------------
// Loading / empty / error states
// ---------------------------------------------------------------------------
function qbLoadingState(message = 'Loading questions...') {
  return `
    <div class="state-box">
      <div class="skeleton-line" style="width:40%;margin:0 auto 12px;"></div>
      <p class="mb-0">${qbEscapeHtml(message)}</p>
    </div>
  `;
}

function qbEmptyState(title = 'No questions found.', hint = 'Try changing your filters or search terms.') {
  return `
    <div class="state-box">
      <h3>${qbEscapeHtml(title)}</h3>
      <p>${qbEscapeHtml(hint)}</p>
    </div>
  `;
}

function qbErrorState(message = 'Something went wrong. Please try again.') {
  return `
    <div class="state-box">
      <h3>Something went wrong</h3>
      <p>${qbEscapeHtml(message)}</p>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Question list item
// ---------------------------------------------------------------------------
function qbRenderQuestionItem(q) {
  return `
    <div class="question-item">
      <div class="question-item-main">
        <div class="question-item-title">
          <a href="question.html#${q.id}">${qbEscapeHtml(q.title)}</a>
        </div>
        <div class="question-meta">
          <span><strong>${qbEscapeHtml(q.course.code)}</strong> — ${qbEscapeHtml(q.course.name)}</span>
          <span class="sep">·</span>
          <span>${qbEscapeHtml(qbContentTypeLabel(q.contentType))}</span>
          <span class="sep">·</span>
          <span>${qbEscapeHtml(q.semester.name)} ${q.semester.year}</span>
          ${q.faculty ? `<span class="sep">·</span><span>${qbEscapeHtml(q.faculty.name)}</span>` : ''}
        </div>
        <div class="question-meta">
          <span>Uploaded ${qbFormatDate(q.createdAt)}</span>
          <span class="sep">·</span>
          <a href="profile.html#${encodeURIComponent(q.uploader.username)}">by ${qbEscapeHtml(q.uploader.username)}</a>
          ${q.files && q.files.length ? `<span class="badge badge-file">${q.files.length > 1 ? `${q.files.length} pages attached` : 'File attached'}</span>` : ''}
        </div>
      </div>
      <div class="question-item-stats">
        <span>${q.views} views</span>
        <span>${q.downloads} downloads</span>
        <span>${q.blessings} blessings</span>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------
function qbRenderPagination(mountEl, pagination, onPageChange) {
  const { page, totalPages } = pagination;
  if (totalPages <= 1) { mountEl.innerHTML = ''; return; }

  const buttons = [];
  buttons.push(`<button data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}>Previous</button>`);

  const windowSize = 2;
  for (let p = 1; p <= totalPages; p += 1) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= windowSize) {
      buttons.push(`<button data-page="${p}" class="${p === page ? 'active' : ''}">${p}</button>`);
    } else if (Math.abs(p - page) === windowSize + 1) {
      buttons.push('<span class="text-faint">…</span>');
    }
  }

  buttons.push(`<button data-page="${page + 1}" ${page === totalPages ? 'disabled' : ''}>Next</button>`);
  mountEl.innerHTML = `<div class="pagination">${buttons.join('')}</div>`;

  mountEl.querySelectorAll('button[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = Number(btn.getAttribute('data-page'));
      if (target >= 1 && target <= totalPages) onPageChange(target);
    });
  });
}

document.addEventListener('DOMContentLoaded', qbRenderFooter);
