const BASE = import.meta.env.VITE_API_URL ?? '/api'

function headers() {
  const token = localStorage.getItem('token')
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, { method, headers: headers(), body: body ? JSON.stringify(body) : undefined })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const api = {
  login: (email, password) => req('POST', '/auth/login', { email, password }),
  register: (data) => req('POST', '/auth/register', data),
  me: () => req('GET', '/auth/me'),

  getTasks: () => req('GET', '/tasks'),
  createTask: (data) => req('POST', '/tasks', data),
  getTask: (id) => req('GET', `/tasks/${id}`),
  updateTask: (id, data) => req('PATCH', `/tasks/${id}`, data),
  deleteTask: (id) => req('DELETE', `/tasks/${id}`),

  getMessages: (taskId) => req('GET', `/tasks/${taskId}/messages`),
  sendMessage: (taskId, content) => req('POST', `/tasks/${taskId}/messages`, { content }),

  getFiles: (taskId) => req('GET', `/tasks/${taskId}/files`),
  addFile: (taskId, data) => req('POST', `/tasks/${taskId}/files`, data),

  getInvoices: () => req('GET', '/invoices'),
  createInvoice: (data) => req('POST', '/invoices', data),
  updateInvoice: (id, data) => req('PATCH', `/invoices/${id}`, data),
  deleteInvoice: (id) => req('DELETE', `/invoices/${id}`),

  getNotes: (taskId) => req('GET', `/tasks/${taskId}/notes`),
  addNote: (taskId, content) => req('POST', `/tasks/${taskId}/notes`, { content }),
  deleteNote: (taskId, noteId) => req('DELETE', `/tasks/${taskId}/notes/${noteId}`),

  getActivity: (taskId) => req('GET', `/tasks/${taskId}/activity`),

  getNotifications: () => req('GET', '/notifications'),
  markRead: (id) => req('PATCH', `/notifications/${id}/read`),
  markAllRead: () => req('PATCH', '/notifications/read-all'),

  search: (q) => req('GET', `/search?q=${encodeURIComponent(q)}`),

  getAnalytics: () => req('GET', '/admin/analytics'),

  getClients: () => req('GET', '/admin/clients'),
  setClientStatus: (id, isActive) => req('PATCH', `/admin/clients/${id}/status`, { is_active: isActive }),
  deleteClient: (id) => req('DELETE', `/admin/clients/${id}`),
  getStats: () => req('GET', '/admin/stats'),

  uploadFile: async (file) => {
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        Authorization: `Bearer ${token}`,
      },
      body: file,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Upload failed')
    return data
  },
}
