const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';

function getToken() {
  return localStorage.getItem('affluence_token');
}

async function request(url, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('affluence_token');
    localStorage.removeItem('affluence_user');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  // Handle CSV/blob responses
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    return res.blob();
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/auth/me'),

  // Influencers
  getInfluencers: () => request('/influencers'),
  getInfluencerStats: (id) => request(`/influencers/${id}/stats`),
  generateLink: (data) => request('/influencers/generate-link', { method: 'POST', body: JSON.stringify(data) }),

  // Sales
  getSales: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/sales?${qs}`);
  },
  getSalesAnalytics: (days = 30) => request(`/sales/analytics?days=${days}`),

  // Payments
  getPayments: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/payments?${qs}`);
  },
  approvePayment: (id) => request(`/payments/${id}/approve`, { method: 'PATCH' }),
  payPayment: (id, data) => request(`/payments/${id}/pay`, { method: 'PATCH', body: JSON.stringify(data) }),
  rejectPayment: (id, data) => request(`/payments/${id}/reject`, { method: 'PATCH', body: JSON.stringify(data) }),
  generatePayments: (data) => request('/payments/generate', { method: 'POST', body: JSON.stringify(data) }),
  exportPayments: (params = {}) => {
    const qs = new URLSearchParams({ format: 'csv', ...params }).toString();
    return request(`/payments/export?${qs}`);
  },

  // Analytics
  getDashboard: (days = 30) => request(`/analytics/dashboard?days=${days}`),
  getTopInfluencers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/analytics/top-influencers?${qs}`);
  },
  getConversionRates: () => request('/analytics/conversion-rates'),

  // AI
  getPredictions: (days = 7) => request(`/ai/predictions?days=${days}`),
  getInsights: (influencerId = null) => {
    const qs = influencerId ? `?influencerId=${influencerId}` : '';
    return request(`/ai/insights${qs}`);
  },
  getFraudDetection: () => request('/ai/fraud'),
};
