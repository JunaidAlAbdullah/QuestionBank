// Handles storing the JWT + current user in localStorage and exposes
// small helpers used across every page.
const QBAuth = {
  TOKEN_KEY: 'qb_token',
  USER_KEY: 'qb_user',

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  getUser() {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  isLoggedIn() {
    return Boolean(this.getToken());
  },

  save(token, user) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    window.location.href = 'index.html';
  },

  // Redirects to login if not authenticated. Call at the top of pages
  // that require a session (upload, my-questions, etc).
  requireLogin() {
    if (!this.isLoggedIn()) {
      window.location.href = `login.html#next-${encodeURIComponent(window.location.pathname.split('/').pop())}`;
      return false;
    }
    return true;
  },
};
