document.addEventListener('DOMContentLoaded', async () => {
  qbRenderNavbar('home');

  document.getElementById('home-search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = document.getElementById('home-search-input').value.trim();
    window.location.href = `browse.html${q ? `?search=${encodeURIComponent(q)}` : ''}`;
  });

  const quickFiltersMount = document.getElementById('quick-filters');
  const commonCourses = ['CSE325', 'CSE251', 'CSE115', 'EEE101', 'BUS201'];
  quickFiltersMount.innerHTML = commonCourses
    .map((c) => `<a href="browse.html?course=${encodeURIComponent(c)}">${c}</a>`)
    .join('');

  const recentMount = document.getElementById('recent-questions');
  recentMount.innerHTML = qbLoadingState();

  try {
    const data = await QBApi.get('/questions?sort=newest&limit=6');
    if (!data.questions.length) {
      recentMount.innerHTML = qbEmptyState('No questions uploaded yet.', 'Be the first to upload a previous question.');
      return;
    }
    recentMount.innerHTML = data.questions.map(qbRenderQuestionItem).join('');
  } catch (err) {
    recentMount.innerHTML = qbErrorState(err.message);
  }
});
