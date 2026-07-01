// Simple authentication for admin panel
const ADMIN_CREDENTIALS = {
  username: 'Manual',
  password: 'manual2020'
};

const AUTH_TOKEN_KEY = 'tms_admin_token';

// Check if user is logged in
function isLoggedIn() {
  return localStorage.getItem(AUTH_TOKEN_KEY) === 'true';
}

// Login function
function login(username, password) {
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    localStorage.setItem(AUTH_TOKEN_KEY, 'true');
    return true;
  }
  return false;
}

// Logout function
function logout() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  window.location.href = 'login.html';
}

// Redirect to login if not authenticated
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
  }
}

// Auto-check on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('admin.html') && !isLoggedIn()) {
      window.location.href = 'login.html';
    }
  });
} else {
  if (window.location.pathname.includes('admin.html') && !isLoggedIn()) {
    window.location.href = 'login.html';
  }
}
