document.addEventListener('DOMContentLoaded', () => {
  qbRenderNavbar('');

  if (QBAuth.isLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }

  const form = document.getElementById('register-form');
  const formError = document.getElementById('form-error');
  const submitBtn = document.getElementById('submit-btn');

  function clearErrors() {
    document.querySelectorAll('.field-error').forEach((el) => { el.classList.add('hidden'); el.textContent = ''; });
    document.querySelectorAll('.has-error').forEach((el) => el.classList.remove('has-error'));
    formError.classList.add('hidden');
  }

  function showErrors(errors) {
    Object.entries(errors || {}).forEach(([key, message]) => {
      const errorEl = document.getElementById(`err-${key}`);
      const inputEl = document.getElementById(key);
      if (errorEl) { errorEl.textContent = message; errorEl.classList.remove('hidden'); }
      if (inputEl) inputEl.classList.add('has-error');
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account…';

    try {
      const data = await QBApi.post('/auth/register', {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        studentId: document.getElementById('studentId').value.trim(),
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirmPassword').value,
      }, { auth: false });

      QBAuth.save(data.token, data.user);
      qbToast('Account created.', 'success');
      setTimeout(() => { window.location.href = 'index.html'; }, 500);
    } catch (err) {
      if (err.errors) showErrors(err.errors);
      formError.textContent = err.message;
      formError.classList.remove('hidden');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create account';
    }
  });
});
