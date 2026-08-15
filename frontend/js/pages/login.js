document.addEventListener('DOMContentLoaded', () => {
  qbRenderNavbar('');

  if (QBAuth.isLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }

  const form = document.getElementById('login-form');
  const errorEl = document.getElementById('form-error');
  const submitBtn = document.getElementById('submit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in…';

    try {
      const data = await QBApi.post('/auth/login', {
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
      }, { auth: false });

      QBAuth.save(data.token, data.user);
      qbToast('Logged in.', 'success');

      const hash = window.location.hash ? decodeURIComponent(window.location.hash.slice(1)) : '';
      const next = hash.startsWith('next-') ? hash.slice(5) : null;
      setTimeout(() => { window.location.href = next || 'index.html'; }, 400);
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove('hidden');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Log in';
    }
  });
});
