import { tokenStorage } from '../utils/tokenStorage';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function getToken() {
  return tokenStorage.get();
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && path !== '/auth/login') {
      tokenStorage.remove();
    }
    const msg = json?.error?.message || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.code = json?.error?.code;
    throw err;
  }
  return json;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),

  // Author
  getDashboard: () => request('/author/dashboard'),
  getMyBooks: () => request('/author/books'),

  // Tickets (author)
  createTicket: (data) => request('/tickets', { method: 'POST', body: JSON.stringify(data) }),
  getMyTickets: () => request('/tickets/my'),
  getTicket: (id) => request(`/tickets/${id}`),

  // Admin
  getAdminStats: () => request('/admin/stats'),
  getAdminTickets: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
    ).toString();
    return request(`/admin/tickets${qs ? '?' + qs : ''}`);
  },
  getAdminTicket: (id) => request(`/admin/tickets/${id}`),
  updateTicket: (id, data) => request(`/admin/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  assignToMe: (id) => request(`/admin/tickets/${id}/assign-to-me`, { method: 'POST' }),
  addNote: (id, body) => request(`/admin/tickets/${id}/notes`, { method: 'POST', body: JSON.stringify({ body }) }),
  generateDraft: (id) => request(`/admin/tickets/${id}/ai-draft`, { method: 'POST' }),
  sendResponse: (id, body, statusAfterSend) =>
    request(`/admin/tickets/${id}/messages`, { method: 'POST', body: JSON.stringify({ body, statusAfterSend }) }),
  reanalyze: (id) => request(`/admin/tickets/${id}/reanalyze`, { method: 'POST' }),
};
