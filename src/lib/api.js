const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `İstek başarısız (${res.status})`)
  }

  return res.status === 204 ? null : res.json()
}

export const api = {
  getGuests: () => request('/guests'),
  getGuest: (id) => request(`/guests/${id}`),
  createGuest: (payload) => request('/guests', { method: 'POST', body: JSON.stringify(payload) }),
  updateGuest: (id, payload) =>
    request(`/guests/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteGuest: (id) => request(`/guests/${id}`, { method: 'DELETE' }),
  checkoutGuest: (id, payload) =>
    request(`/guests/${id}/checkout`, { method: 'POST', body: JSON.stringify(payload || {}) }),
  extendGuest: (id, payload) =>
    request(`/guests/${id}/extend`, { method: 'POST', body: JSON.stringify(payload) }),
  getRooms: () => request('/rooms'),
  setHousekeeping: (roomNumber, status) =>
    request(`/rooms/${encodeURIComponent(roomNumber)}/housekeeping`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  getArchive: (q) => request(`/archive${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  getStats: () => request('/stats'),
  importBackup: (payload) =>
    request('/import', { method: 'POST', body: JSON.stringify(payload) }),
}
