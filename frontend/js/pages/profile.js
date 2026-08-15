document.addEventListener('DOMContentLoaded', async () => {
  qbRenderNavbar('');

  const username = window.location.hash ? decodeURIComponent(window.location.hash.slice(1)) : null;
  const headerMount = document.getElementById('profile-header');
  const listMount = document.getElementById('profile-questions');
  const paginationMount = document.getElementById('pagination-mount');

  if (!username) {
    headerMount.innerHTML = qbErrorState('No profile specified.');
    return;
  }

  try {
    const data = await QBApi.get(`/profiles/${encodeURIComponent(username)}`, { auth: false });
    const p = data.profile;
    headerMount.innerHTML = `
      <h1 style="margin-bottom:4px;">${qbEscapeHtml(p.username)}</h1>
      <p class="text-muted">Member since ${qbFormatDate(p.memberSince)} · Identity kept anonymous</p>
      <dl class="stat-row">
        <div class="stat-block"><dt>Uploads</dt><dd>${p.totalUploads}</dd></div>
        <div class="stat-block"><dt>Blessings received</dt><dd>${p.totalBlessings}</dd></div>
        <div class="stat-block"><dt>Total downloads</dt><dd>${p.totalDownloads}</dd></div>
      </dl>
    `;
  } catch (err) {
    headerMount.innerHTML = qbErrorState(err.message);
    return;
  }

  const state = { page: 1 };

  async function loadQuestions() {
    listMount.innerHTML = qbLoadingState('Loading uploads…');
    try {
      const data = await QBApi.get(`/questions?uploader=${encodeURIComponent(username)}&page=${state.page}&limit=10`, { auth: false });
      if (!data.questions.length) {
        listMount.innerHTML = qbEmptyState('No uploads yet.', 'This student hasn\'t shared any questions.');
        paginationMount.innerHTML = '';
        return;
      }
      listMount.innerHTML = data.questions.map(qbRenderQuestionItem).join('');
      qbRenderPagination(paginationMount, data.pagination, (page) => {
        state.page = page;
        loadQuestions();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    } catch (err) {
      listMount.innerHTML = qbErrorState(err.message);
    }
  }

  loadQuestions();
});
