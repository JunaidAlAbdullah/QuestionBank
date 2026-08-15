document.addEventListener('DOMContentLoaded', async () => {
  qbRenderNavbar('browse');

  const examSelect = document.getElementById('filter-exam');
  examSelect.innerHTML += QB_CONTENT_TYPES.map((t) => `<option value="${t.value}">${t.label}</option>`).join('');

  try {
    const deptData = await QBApi.get('/departments', { auth: false });
    const deptSelect = document.getElementById('filter-department');
    deptSelect.innerHTML += deptData.departments.map((d) => `<option value="${d.id}">${qbEscapeHtml(d.name)}</option>`).join('');
  } catch (err) { /* non-critical */ }

  const params = new URLSearchParams(window.location.search);
  const state = {
    search: params.get('search') || '',
    course: params.get('course') || '',
    faculty: params.get('faculty') || '',
    department: params.get('department') || '',
    semester: params.get('semester') || '',
    year: params.get('year') || '',
    examType: params.get('examType') || '',
    sort: params.get('sort') || 'newest',
    page: Number(params.get('page') || 1),
  };

  document.getElementById('search-input').value = state.search;
  document.getElementById('filter-course').value = state.course;
  document.getElementById('filter-faculty').value = state.faculty;
  document.getElementById('filter-department').value = state.department;
  document.getElementById('filter-semester').value = state.semester;
  document.getElementById('filter-year').value = state.year;
  document.getElementById('filter-exam').value = state.examType;
  document.getElementById('sort-select').value = state.sort;

  const listMount = document.getElementById('question-list');
  const paginationMount = document.getElementById('pagination-mount');
  const countMount = document.getElementById('result-count');

  async function load() {
    listMount.innerHTML = qbLoadingState();
    countMount.textContent = 'Loading…';

    const query = new URLSearchParams();
    Object.entries(state).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });
    window.history.replaceState({}, '', `browse.html?${query.toString()}`);

    try {
      const data = await QBApi.get(`/questions?${query.toString()}`, { auth: false });
      if (!data.questions.length) {
        listMount.innerHTML = qbEmptyState();
        countMount.textContent = '0 results';
        paginationMount.innerHTML = '';
        return;
      }
      listMount.innerHTML = data.questions.map(qbRenderQuestionItem).join('');
      countMount.textContent = `${data.pagination.total} result${data.pagination.total === 1 ? '' : 's'}`;
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

  document.getElementById('search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    state.search = document.getElementById('search-input').value.trim();
    state.page = 1;
    load();
  });

  document.getElementById('filter-form').addEventListener('submit', (e) => {
    e.preventDefault();
    state.course = document.getElementById('filter-course').value.trim();
    state.faculty = document.getElementById('filter-faculty').value.trim();
    state.department = document.getElementById('filter-department').value;
    state.semester = document.getElementById('filter-semester').value;
    state.year = document.getElementById('filter-year').value;
    state.examType = document.getElementById('filter-exam').value;
    state.page = 1;
    load();
  });

  document.getElementById('clear-filters').addEventListener('click', () => {
    document.getElementById('filter-form').reset();
    document.getElementById('search-input').value = '';
    Object.assign(state, {
      search: '', course: '', faculty: '', department: '', semester: '', year: '', examType: '', page: 1,
    });
    load();
  });

  document.getElementById('sort-select').addEventListener('change', (e) => {
    state.sort = e.target.value;
    state.page = 1;
    load();
  });

  load();
});
