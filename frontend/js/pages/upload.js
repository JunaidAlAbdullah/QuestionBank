document.addEventListener('DOMContentLoaded', async () => {
  if (!QBAuth.requireLogin()) return;
  qbRenderNavbar('upload');

  const contentTypeSelect = document.getElementById('contentType');
  contentTypeSelect.innerHTML = QB_CONTENT_TYPES.map((t) => `<option value="${t.value}">${t.label}</option>`).join('');

  try {
    const deptData = await QBApi.get('/departments', { auth: false });
    const deptSelect = document.getElementById('departmentId');
    deptSelect.innerHTML += deptData.departments.map((d) => `<option value="${d.id}">${qbEscapeHtml(d.name)}</option>`).join('');
  } catch (err) { /* non-critical */ }

  const hash = window.location.hash ? decodeURIComponent(window.location.hash.slice(1)) : '';
  const editId = hash.startsWith('edit-') ? hash.slice(5) : null;
  const form = document.getElementById('upload-form');
  const submitBtn = document.getElementById('submit-btn');
  const filesInput = document.getElementById('files');
  const filePreviewList = document.getElementById('file-preview-list');

  if (editId) {
    document.getElementById('page-title').textContent = 'Edit Question';
    submitBtn.textContent = 'Save Changes';
    try {
      const data = await QBApi.get(`/questions/${editId}`);
      const q = data.question;
      if (!q.isOwner) {
        qbToast('You can only edit your own questions.', 'error');
        window.location.href = `question.html#${editId}`;
        return;
      }
      document.getElementById('title').value = q.title;
      contentTypeSelect.value = q.contentType;
      document.getElementById('courseCode').value = q.course.code;
      document.getElementById('courseName').value = q.course.name;
      document.getElementById('facultyName').value = q.faculty ? q.faculty.name : '';
      document.getElementById('semesterName').value = q.semester.name;
      document.getElementById('year').value = q.year;
      document.getElementById('description').value = q.description || '';
      document.getElementById('questionText').value = q.questionText || '';

      if (q.files && q.files.length) {
        const hint = document.createElement('div');
        hint.className = 'field-hint';
        hint.textContent = `This question currently has ${q.files.length} file(s) attached. Choosing new files below will replace them all.`;
        filesInput.insertAdjacentElement('afterend', hint);
      }
    } catch (err) {
      qbToast(err.message, 'error');
    }
  }

  // Client-side mirror of the backend's "2 images, or 1 PDF alone" rule —
  // catches the mistake before wasting an upload attempt.
  function validateFilesClientSide(fileList) {
    if (!fileList.length) return null;
    if (fileList.length > 2) {
      return 'You can attach at most 2 images. If your question is longer, please combine it into one PDF instead (see the rules panel).';
    }
    const hasPdf = Array.from(fileList).some((f) => f.type === 'application/pdf');
    if (hasPdf && fileList.length > 1) {
      return 'A PDF must be uploaded on its own, not alongside images.';
    }
    return null;
  }

  filesInput.addEventListener('change', () => {
    const err = validateFilesClientSide(filesInput.files);
    const errorEl = document.getElementById('err-files');
    if (err) {
      errorEl.textContent = err;
      errorEl.classList.remove('hidden');
      filePreviewList.innerHTML = '';
      return;
    }
    errorEl.classList.add('hidden');
    filePreviewList.innerHTML = Array.from(filesInput.files)
      .map((f) => `<div class="file-preview-item"><span>${qbEscapeHtml(f.name)}</span><span>${(f.size / 1024 / 1024).toFixed(2)} MB</span></div>`)
      .join('');
  });

  function clearErrors() {
    document.querySelectorAll('.field-error').forEach((el) => { el.classList.add('hidden'); el.textContent = ''; });
    document.querySelectorAll('.has-error').forEach((el) => el.classList.remove('has-error'));
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

    const clientFileError = validateFilesClientSide(filesInput.files);
    if (clientFileError) {
      const errorEl = document.getElementById('err-files');
      errorEl.textContent = clientFileError;
      errorEl.classList.remove('hidden');
      return;
    }

    const formData = new FormData();
    formData.append('title', document.getElementById('title').value.trim());
    formData.append('contentType', contentTypeSelect.value);
    formData.append('courseCode', document.getElementById('courseCode').value.trim());
    formData.append('courseName', document.getElementById('courseName').value.trim());
    const deptId = document.getElementById('departmentId').value;
    if (deptId) formData.append('departmentId', deptId);
    formData.append('facultyName', document.getElementById('facultyName').value.trim());
    formData.append('semesterName', document.getElementById('semesterName').value);
    formData.append('year', document.getElementById('year').value);
    formData.append('description', document.getElementById('description').value.trim());
    formData.append('questionText', document.getElementById('questionText').value.trim());

    Array.from(filesInput.files).forEach((f) => formData.append('files', f));

    submitBtn.disabled = true;
    submitBtn.textContent = editId ? 'Saving…' : 'Uploading…';

    try {
      let result;
      if (editId) {
        result = await QBApi.request(`/questions/${editId}`, { method: 'PUT', body: formData, isForm: true });
        qbToast('Question updated successfully.', 'success');
        setTimeout(() => { window.location.href = `question.html#${editId}`; }, 600);
      } else {
        result = await QBApi.request('/questions', { method: 'POST', body: formData, isForm: true });
        qbToast('Question uploaded successfully.', 'success');
        setTimeout(() => { window.location.href = `question.html#${result.questionId}`; }, 600);
      }
    } catch (err) {
      if (err.errors) showErrors(err.errors);
      qbToast(err.message, 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = editId ? 'Save Changes' : 'Upload Question';
    }
  });
});
