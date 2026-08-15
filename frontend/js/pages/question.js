document.addEventListener('DOMContentLoaded', async () => {
  qbRenderNavbar('browse');

  const mount = document.getElementById('question-detail-mount');
  const id = window.location.hash ? decodeURIComponent(window.location.hash.slice(1)) : null;

  if (!id) {
    mount.innerHTML = qbErrorState('No question specified.');
    return;
  }

  async function load() {
    mount.innerHTML = qbLoadingState('Loading question…');
    try {
      const data = await QBApi.get(`/questions/${id}`);
      render(data.question);
    } catch (err) {
      mount.innerHTML = qbErrorState(err.message);
    }
  }

  function render(q) {
    const files = q.files || [];
    // Multi-page questions show each page inline, in order, labeled if
    // there's more than one. A single PDF just gets a download prompt.
    const previewHtml = files.map((f, index) => {
      const isImage = f.url && /\.(png|jpe?g|webp)$/i.test(f.url);
      const label = files.length > 1 ? `<p class="text-muted" style="margin:16px 0 4px;font-weight:600;">Page ${index + 1} of ${files.length}</p>` : '';
      if (isImage) {
        return `${label}<img src="${QBApi.fileUrl(f.url)}" alt="Question page ${index + 1}" style="max-width:100%;border:1px solid var(--color-border);border-radius:5px;margin-top:${files.length > 1 ? '4' : '16'}px;">`;
      }
      return `${label}<p class="text-muted" style="margin-top:16px;">A PDF file is attached${files.length > 1 ? ` (page ${index + 1})` : ''}. Use the download button below to view it.</p>`;
    }).join('');

    mount.innerHTML = `
      <div class="detail-card">
        <div class="flex-between" style="align-items:flex-start;">
          <h1 style="margin-bottom:4px;">${qbEscapeHtml(q.title)}</h1>
          <span class="badge">${qbEscapeHtml(qbContentTypeLabel(q.contentType))}</span>
        </div>
        <p class="text-muted mb-0">
          Uploaded by <a href="profile.html#${encodeURIComponent(q.uploader.username)}">${qbEscapeHtml(q.uploader.username)}</a>
          on ${qbFormatDate(q.createdAt)}
        </p>

        <dl class="detail-grid">
          <div><dt>Course</dt><dd>${qbEscapeHtml(q.course.code)}</dd></div>
          <div><dt>Course Name</dt><dd>${qbEscapeHtml(q.course.name)}</dd></div>
          <div><dt>Faculty</dt><dd>${q.faculty ? qbEscapeHtml(q.faculty.name) : '—'}</dd></div>
          <div><dt>Semester</dt><dd>${qbEscapeHtml(q.semester.name)} ${q.semester.year}</dd></div>
          <div><dt>Year</dt><dd>${q.year}</dd></div>
          <div><dt>Views / Downloads</dt><dd>${q.views} / ${q.downloads}</dd></div>
        </dl>

        ${q.description ? `<p><strong>Notes:</strong> ${qbEscapeHtml(q.description)}</p>` : ''}

        ${q.questionText ? `<div class="question-body">${qbEscapeHtml(q.questionText)}</div>` : ''}
        ${previewHtml}

        <div class="detail-actions">
          <button class="btn ${q.bookmarked ? 'btn-primary' : ''}" id="btn-bookmark">
            ${q.bookmarked ? '★ Bookmarked' : '☆ Bookmark'}
          </button>
          <button class="btn ${q.blessed ? 'btn-accent' : ''}" id="btn-bless">
            ${q.blessed ? 'Blessing sent' : 'Send a blessing (thanks)'} — ${q.blessings}
          </button>
          ${files.map((f, index) => {
            const url = f.id ? QBApi.downloadFileUrl(q.id, f.id) : QBApi.downloadUrl(q.id);
            const label = files.length > 1 ? `Download page ${index + 1}` : 'Download file';
            return `<a class="btn" href="${url}">${label}</a>`;
          }).join('')}
          <button class="btn" id="btn-report">Report</button>
          ${q.isOwner ? `
            <a class="btn" href="upload.html#edit-${q.id}">Edit</a>
            <button class="btn btn-danger" id="btn-delete">Delete</button>
          ` : ''}
        </div>
      </div>
    `;

    document.getElementById('btn-bookmark').addEventListener('click', async () => {
      if (!QBAuth.requireLogin()) return;
      try {
        const res = await QBApi.post(`/questions/${id}/bookmark`);
        qbToast(res.message, 'success');
        load();
      } catch (err) { qbToast(err.message, 'error'); }
    });

    document.getElementById('btn-bless').addEventListener('click', async () => {
      if (!QBAuth.requireLogin()) return;
      try {
        const res = await QBApi.post(`/questions/${id}/blessing`);
        qbToast(res.message, 'success');
        load();
      } catch (err) { qbToast(err.message, 'error'); }
    });

    document.getElementById('btn-report').addEventListener('click', async () => {
      if (!QBAuth.requireLogin()) return;
      const reason = window.prompt('Briefly describe the issue with this question:');
      if (!reason || !reason.trim()) return;
      try {
        const res = await QBApi.post(`/questions/${id}/report`, { reason: reason.trim() });
        qbToast(res.message, 'success');
      } catch (err) { qbToast(err.message, 'error'); }
    });

    const deleteBtn = document.getElementById('btn-delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        const confirmed = await qbConfirm('This question will be permanently removed.', {
          title: 'Delete this question?', confirmLabel: 'Delete', danger: true,
        });
        if (!confirmed) return;
        try {
          await QBApi.del(`/questions/${id}`);
          qbToast('Question deleted.', 'success');
          setTimeout(() => { window.location.href = 'my-questions.html'; }, 700);
        } catch (err) { qbToast(err.message, 'error'); }
      });
    }
  }

  load();
});
