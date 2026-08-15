// Runtime configuration. No build step is used, so the API base URL is
// simply set here. Change API_BASE_URL when deploying the backend
// somewhere other than localhost — do not hardcode it anywhere else.
window.QB_CONFIG = {
  API_BASE_URL: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : 'https://YOUR-BACKEND-DOMAIN.example.com/api',
};
