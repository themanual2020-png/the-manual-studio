// Admin authentication — verified server-side via an httpOnly session cookie.
// See api/auth-login.js, api/auth-logout.js, api/auth-check.js.

async function login(username, password) {
  try {
    const res = await fetch('/api/auth-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return res.ok;
  } catch (error) {
    console.error('Login request failed:', error);
    return false;
  }
}

async function isLoggedIn() {
  try {
    const res = await fetch('/api/auth-check');
    return res.ok;
  } catch (error) {
    console.error('Auth check failed:', error);
    return false;
  }
}

async function logout() {
  try {
    await fetch('/api/auth-logout', { method: 'POST' });
  } catch (error) {
    console.error('Logout request failed:', error);
  }
  window.location.href = 'login.html';
}

async function requireAuth() {
  const loggedIn = await isLoggedIn();
  if (!loggedIn) {
    window.location.href = 'login.html';
  }
  return loggedIn;
}

// Auto-check on protected pages
const PROTECTED_PAGES = ['admin.html', 'inbox.html'];

async function autoCheck() {
  if (PROTECTED_PAGES.some((page) => window.location.pathname.includes(page))) {
    await requireAuth();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoCheck);
} else {
  autoCheck();
}
