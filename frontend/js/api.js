// Thin wrapper around fetch() that adds the API base URL, the auth
// header, and normalizes error handling for every page.
const QBApi = {
  async request(path, { method = 'GET', body, isForm = false, auth = true } = {}) {
    const headers = {};
    if (!isForm) headers['Content-Type'] = 'application/json';

    if (auth) {
      const token = QBAuth.getToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    let response;
    try {
      response = await fetch(`${window.QB_CONFIG.API_BASE_URL}${path}`, {
        method,
        headers,
        body: isForm ? body : body ? JSON.stringify(body) : undefined,
      });
    } catch (networkErr) {
      throw new Error('Could not reach the server. Please check your connection and try again.');
    }

    let data;
    try {
      data = await response.json();
    } catch (parseErr) {
      throw new Error('Something went wrong. Please try again.');
    }

    if (!response.ok || data.success === false) {
      const err = new Error(data.message || 'Something went wrong. Please try again.');
      err.status = response.status;
      err.errors = data.errors;
      throw err;
    }

    return data;
  },

  get(path, opts) { return this.request(path, { ...opts, method: 'GET' }); },
  post(path, body, opts) { return this.request(path, { ...opts, method: 'POST', body }); },
  put(path, body, opts) { return this.request(path, { ...opts, method: 'PUT', body }); },
  del(path, opts) { return this.request(path, { ...opts, method: 'DELETE' }); },

  fileUrl(path) {
    // Uploaded files are served from the API origin, not /api itself.
    const base = window.QB_CONFIG.API_BASE_URL.replace(/\/api\/?$/, '');
    return `${base}${path}`;
  },

  downloadUrl(id) {
    return `${window.QB_CONFIG.API_BASE_URL}/questions/${id}/download`;
  },

  downloadFileUrl(questionId, fileId) {
    return `${window.QB_CONFIG.API_BASE_URL}/questions/${questionId}/files/${fileId}/download`;
  },
};
