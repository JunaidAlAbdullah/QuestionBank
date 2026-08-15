document.addEventListener('DOMContentLoaded', async () => {
  if (!QBAuth.requireLogin()) return;
  qbRenderNavbar('my-questions');

  const listMount = document.getElementById('my-questions-list');
  const paginationMount = document.getElementById('pagination-mount');
  const countMount = document.getElementById('my-count');
  const tabUploads = document.getElementById('tab-uploads');
  const tabBookmarks = document.getElementById('tab-bookmarks');

  const state = { tab: 'uploads', page: 1 };

  function renderOwnedItem(q, showActions) {
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
          </div>
          <div class="question-meta">
            <span>${q.views} views</span>
            <span class="sep">·</span>
            <span>${q.downloads} downloads</span>
            <span class="sep">·</span>
            <span>${q.blessings} blessings</span>
          </div>
          ${showActions ? `
            <div style="display:flex;gap:8px;margin-top:12px;">
              <a class="btn btn-sm" href="question.html#${q.id}">View</a>
              <a class="btn btn-sm" href="upload.html#edit-${q.id}">Edit</a>
              <button class="btn btn-sm btn-danger" data-delete-id="${q.id}">Delete</button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  async function load() {
    listMount.innerHTML = qbLoadingState(state.tab === 'uploads' ? 'Loading your questions…' : 'Loading your bookmarks…');
    countMount.textContent = 'Loading…';

    const endpoint = state.tab === 'uploads'
      ? `/questions/mine?page=${state.page}&limit=10`
      : `/questions/bookmarks/mine?page=${state.page}&limit=10`;

    try {
      const data = await QBApi.get(endpoint);

      if (!data.questions.length) {
        listMount.innerHTML = state.tab === 'uploads'
          ? qbEmptyState('You haven\'t uploaded any questions yet.', 'Help future juniors — upload a previous question.')
          : qbEmptyState('No bookmarks yet.', 'Bookmark useful questions while browsing to find them here.');
        countMount.textContent = state.tab === 'uploads' ? '0 questions uploaded' : '0 bookmarks';
        paginationMount.innerHTML = '';
        return;
      }

      countMount.textContent = state.tab === 'uploads'
        ? `${data.pagination.total} question${data.pagination.total === 1 ? '' : 's'} uploaded`
        : `${data.pagination.total} bookmark${data.pagination.total === 1 ? '' : 's'}`;

      listMount.innerHTML = data.questions.map((q) => renderOwnedItem(q, state.tab === 'uploads')).join('');

      listMount.querySelectorAll('[data-delete-id]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-delete-id');
          const confirmed = await qbConfirm('This question will be permanently removed.', {
            title: 'Delete this question?', confirmLabel: 'Delete', danger: true,
          });
          if (!confirmed) return;
          try {
            await QBApi.del(`/questions/${id}`);
            qbToast('Question deleted.', 'success');
            load();
          } catch (err) { qbToast(err.message, 'error'); }
        });
      });

      qbRenderPagination(paginationMount, data.pagination, (page) => {
        state.page = page;
        load();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    } catch (err) {
      listMount.innerHTML = qbErrorState(err.message);
      countMount.textContent = '';
    }
  }

  function setTab(tab) {
    state.tab = tab;
    state.page = 1;
    tabUploads.classList.toggle('btn-primary', tab === 'uploads');
    tabBookmarks.classList.toggle('btn-primary', tab === 'bookmarks');
    load();
  }

  tabUploads.addEventListener('click', () => setTab('uploads'));
  tabBookmarks.addEventListener('click', () => setTab('bookmarks'));

  setTab('uploads');
});
