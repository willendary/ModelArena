const BASE = ''

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  if (!res.ok) {
    const detail = data && typeof data === 'object' ? data.detail || data.message : text
    throw new Error(detail || `Erro HTTP ${res.status}`)
  }
  return data
}

export const api = {
  health: () => request('/api/health'),
  categories: () => request('/api/categories'),
  models: ({ codingOnly = false, search = '' } = {}) => {
    const qs = new URLSearchParams()
    if (codingOnly) qs.set('coding_only', 'true')
    if (search.trim()) qs.set('search', search.trim())
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return request(`/api/models${suffix}`)
  },
  testProvider: (model = null) =>
    request('/api/provider/test', {
      method: 'POST',
      body: JSON.stringify({ model }),
    }),
  startJob: ({ models, categories, repeats }) =>
    request('/api/benchmarks/jobs', {
      method: 'POST',
      body: JSON.stringify({ models, categories, repeats }),
    }),
  listJobs: (limit = 15) => request(`/api/benchmarks/jobs?limit=${limit}`),
  getJob: (jobId) => request(`/api/benchmarks/jobs/${jobId}`),
  cancelJob: (jobId) => request(`/api/benchmarks/jobs/${jobId}/cancel`, { method: 'POST' }),
  ranking: (category = '') => request(`/api/ranking${category ? `?category=${encodeURIComponent(category)}` : ''}`),
  recommendation: () => request('/api/recommendation'),
  exportMarkdown: async () => {
    const res = await fetch('/api/ranking/export?format=markdown')
    if (!res.ok) throw new Error('Falha ao exportar relatório Markdown')
    return res.text()
  },
  history: ({ limit = 120, modelId = '', category = '' } = {}) => {
    const qs = new URLSearchParams({ limit: String(limit) })
    if (modelId) qs.set('model_id', modelId)
    if (category) qs.set('category', category)
    return request(`/api/history?${qs.toString()}`)
  },
  clearHistory: () => request('/api/history', { method: 'DELETE' }),
  runDetail: (runId) => request(`/api/runs/${runId}`),
  getSchedule: () => request('/api/schedule'),
  saveSchedule: (payload) =>
    request('/api/schedule', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  runScheduleNow: () => request('/api/schedule/run-now', { method: 'POST' }),
}
