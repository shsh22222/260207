const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken() {
  return localStorage.getItem('bt_token');
}

function setAuth(token, user) {
  localStorage.setItem('bt_token', token);
  localStorage.setItem('bt_user', JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem('bt_token');
  localStorage.removeItem('bt_user');
}

function getStoredUser() {
  try {
    const u = localStorage.getItem('bt_user');
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    clearAuth();
    throw new Error('UNAUTHORIZED');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API Error');
  return data;
}

// Check if the backend is available
async function checkBackend() {
  try {
    const res = await fetch(`${API_URL}/api/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Auth ───────────────────────────────────────────────
async function login(email, password) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAuth(data.token, data.user);
  return data;
}

async function register(email, password, name, role, trainingName, trainingStartDate) {
  const data = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name, role, trainingName, trainingStartDate }),
  });
  setAuth(data.token, data.user);
  return data;
}

function logout() {
  clearAuth();
}

async function getMe() {
  return request('/api/auth/me');
}

// ─── Goals ──────────────────────────────────────────────
async function getGoals() {
  return request('/api/goals');
}

async function createGoal(goal) {
  return request('/api/goals', { method: 'POST', body: JSON.stringify(goal) });
}

async function updateGoal(id, updates) {
  return request(`/api/goals/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
}

async function deleteGoal(id) {
  return request(`/api/goals/${id}`, { method: 'DELETE' });
}

// ─── Check-ins ──────────────────────────────────────────
async function getCheckins(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/checkins${query ? '?' + query : ''}`);
}

async function submitCheckins(entries) {
  return request('/api/checkins', { method: 'POST', body: JSON.stringify({ entries }) });
}

async function getCheckinStats() {
  return request('/api/checkins/stats');
}

// ─── Feedback ───────────────────────────────────────────
async function getFeedback() {
  return request('/api/feedback');
}

async function likeFeedback(id) {
  return request(`/api/feedback/${id}/like`, { method: 'POST' });
}

async function replyFeedback(id, message) {
  return request(`/api/feedback/${id}/reply`, { method: 'POST', body: JSON.stringify({ message }) });
}

async function requestFeedback() {
  return request('/api/feedback/request', { method: 'POST' });
}

// ─── Tips ───────────────────────────────────────────────
async function getTips() {
  return request('/api/tips');
}

async function getTodayTip() {
  return request('/api/tips/today');
}

export default {
  checkBackend,
  login, register, logout, getMe, getStoredUser, getToken,
  getGoals, createGoal, updateGoal, deleteGoal,
  getCheckins, submitCheckins, getCheckinStats,
  getFeedback, likeFeedback, replyFeedback, requestFeedback,
  getTips, getTodayTip,
};
