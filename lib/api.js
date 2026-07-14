const BASE = '';

const DOMAIN_SLUG_MAP = {
  'Full Stack': 'fullstack',
  'DSA': 'dsa',
  'Machine Learning': 'aiml',
  'AI': 'aiml',
  'Data Science': 'datascience',
  'Cybersecurity': 'cybersecurity',
  'Cloud': 'devops',
  'DevOps': 'devops',
  'Mobile': 'android',
  'Android': 'android',
  'System Design': 'systemdesign',
  'Blockchain': 'blockchain',
  'Game Dev': 'gamedev',
};

async function request(path, options = {}) {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('genois_token')
    : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  // FIX P4: send the httpOnly session cookie with every request so the API can
  // authenticate via the XSS-inaccessible cookie (getUserFromRequest also reads
  // it). The Bearer header is kept for backward compatibility during migration.
  const res = await fetch(`${BASE}${path}`, { ...options, headers, credentials: 'include' });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};

export const authAPI = {
  signup: (data) => api.post('/api/auth/signup', data),
  login: (data) => api.post('/api/auth/login', data),
  getProfile: () => api.get('/api/auth/profile'),
  updateProfile: (data) => api.put('/api/auth/profile', data),
  changeDomain: (domain) => {
    const slug = DOMAIN_SLUG_MAP[domain] || domain.toLowerCase().replace(/\s+/g, '');
    return api.put('/api/auth/change-domain', { domain: slug, domainSlug: slug });
  },
  resetProgress: () => api.post('/api/auth/reset-progress', {}),
};

export const roadmapAPI = {
  getDaily: () => api.get('/api/roadmap/daily'),
  getWeekly: () => api.get('/api/roadmap/weekly'),
  getMonthly: () => api.get('/api/roadmap/monthly'),
  getDomains: () => api.get('/api/roadmap/domains'),
  getDay: (day) => api.get(`/api/roadmap/day/${day}`),
  getOverview: () => api.get('/api/roadmap/overview'),
  skipBasics: () => api.post('/api/roadmap/skip-basics', {}),
  regenerate: () => api.post('/api/roadmap/regenerate', {}),
};

export const taskAPI = {
  getDayTasks: (day) => api.get(`/api/tasks/day/${day}`),
  completeTask: (data) => api.post('/api/tasks/complete', data),
  getHistory: (page) => api.get(`/api/tasks/history?page=${page || 1}`),
  getScoreBreakdown: () => api.get('/api/tasks/score-breakdown'),
};

export const testAPI = {
  generateDaily: (data) => api.post('/api/tests/daily/generate', data),
  generateWeekly: (data) => api.post('/api/tests/weekly/generate', data),
  generateMonthly: () => api.post('/api/tests/monthly/generate', {}),
  generateRevision: () => api.post('/api/tests/revision/generate', {}),
  submit: (data) => api.post('/api/tests/submit', data),
  getHistory: (type, page) => api.get(`/api/tests/history?type=${type || ''}&page=${page || 1}`),
};

export const codingAPI = {
  getDayTest: (day) => api.get(`/api/coding/day/${day}`),
  submit: (data) => api.post('/api/coding/submit', data),
  getHistory: (page) => api.get(`/api/coding/history?page=${page || 1}`),
  getHint: (id, idx) => api.get(`/api/coding/hint/${id}/${idx}`),
};

export const projectAPI = {
  getWeek: (week) => api.get(`/api/projects/week/${week}`),
  updateStep: (id, data) => api.post(`/api/projects/${id}/step`, data),
  submit: (id) => api.post(`/api/projects/${id}/submit`, {}),
  getHistory: () => api.get('/api/projects/history'),
};

export const notesAPI = {
  generate: (data) => api.post('/api/notes/generate', data),
  regenerate: (id) => api.post(`/api/notes/${id}/regenerate`, {}),
  getAll: (domain) => api.get(`/api/notes?domainSlug=${domain || ''}`),
  getByTopic: (roadmapId) => api.get(`/api/notes/topic/${roadmapId}`),
};

export const mentorAPI = {
  sendMessage: (data) => api.post('/api/mentor/message', data),
  getHistory: (mode, limit) => api.get(`/api/mentor/history?mode=${mode || ''}&limit=${limit || 20}`),
  clearHistory: (mode) => api.delete(`/api/mentor/history?mode=${mode || ''}`),
};

export const chatbotAPI = {
  sendMessage: (data) => api.post('/api/chatbot/message', data),
  getHistory: (mode, page) => api.get(`/api/chatbot/history?mode=${mode || ''}&page=${page || 1}`),
  clearHistory: (mode) => api.delete(`/api/chatbot/history?mode=${mode || ''}`),
};

export const analyticsAPI = {
  getDashboard: () => api.get('/api/analytics/dashboard'),
  getDailyGraph: (days) => api.get(`/api/analytics/daily-graph?days=${days || 30}`),
  getWeeklyGraph: () => api.get('/api/analytics/weekly-graph'),
  getScoreBreakdown: () => api.get('/api/analytics/score-breakdown'),
  getSkillIdentity: () => api.get('/api/analytics/skill-identity'),
  getTestHistory: () => api.get('/api/analytics/test-history'),
  getProjectHistory: () => api.get('/api/analytics/project-history'),
  getRoadmapProgress: () => api.get('/api/analytics/roadmap-progress'),
};

export const subscriptionAPI = {
  getStatus: () => api.get('/api/subscription/status'),
  activate: (data) => api.post('/api/subscription/activate', data),
  cancel: () => api.post('/api/subscription/cancel', {}),
};

export const anxietyAPI = {
  sendMessage: (data) => api.post('/api/anxiety/message', data),
  getHistory: () => api.get('/api/anxiety/history'),
  clearHistory: () => api.delete('/api/anxiety/history'),
};
