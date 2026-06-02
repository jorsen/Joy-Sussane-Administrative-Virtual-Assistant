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

  getClients: () => req('GET', '/admin/clients'),
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
