/**
 * API Client — thin fetch wrapper with JWT token handling.
 * Reads token from localStorage, sets Authorization header,
 * handles 401 by redirecting to login.
 */
const API = {
  base: '/api',

  getToken() {
    return localStorage.getItem('token');
  },

  getUser() {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  },

  setAuth(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/pages/login.html';
  },

  async request(method, endpoint, body) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    const token = this.getToken();
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(this.base + endpoint, opts);
    if (res.status === 401) {
      this.logout();
      return;
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  get(endpoint) { return this.request('GET', endpoint); },
  post(endpoint, body) { return this.request('POST', endpoint, body); },
  put(endpoint, body) { return this.request('PUT', endpoint, body); },
  del(endpoint) { return this.request('DELETE', endpoint); },

  // Upload with FormData (for admin photo upload)
  async upload(endpoint, formData) {
    const opts = {
      method: 'POST',
      headers: {},
      body: formData
    };
    const token = this.getToken();
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;

    const res = await fetch(this.base + endpoint, opts);
    if (res.status === 401) { this.logout(); return; }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },

  // Check if user is logged in, redirect if not
  requireAuth() {
    if (!this.getToken()) {
      window.location.href = '/pages/login.html';
      return false;
    }
    return true;
  },

  // Check if user is admin
  requireAdmin() {
    const user = this.getUser();
    if (!user || user.role !== 'ADMIN') {
      window.location.href = '/pages/dashboard.html';
      return false;
    }
    return true;
  },

  // Show leader-only nav links if user is LEADER or ADMIN
  initLeaderNav() {
    const user = this.getUser();
    if (user && (user.role === 'LEADER' || user.role === 'ADMIN')) {
      const link = document.getElementById('leaderLink');
      if (link) link.style.display = '';
    }
  }
};

// Auto-init leader nav on every page that includes api.js
document.addEventListener('DOMContentLoaded', function() { API.initLeaderNav(); });
