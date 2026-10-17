const apiBase = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')

export const apiUrl = (path) => `${apiBase}${path}`
