export const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'http://localhost:5173').replace(/\/$/, '')
export async function apiCall(path, method = 'GET', body, code) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20000)
  try {
    const response = await fetch(API + path, {
      method, signal: controller.signal, credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(code ? { 'x-admin-code': code } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) {
      const error = new Error(data?.error || `The request failed (${response.status}). Please try again.`)
      error.status = response.status
      throw error
    }
    if (!data) throw new Error('The server returned an unexpected response. Please try again.')
    return data
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('The request timed out. Refresh to check whether your change was saved before trying again.')
    if (error instanceof TypeError) throw new Error('Could not reach the server. Check your connection and try again.')
    throw error
  } finally {
    clearTimeout(timer)
  }
}
export const adminCall = (code, path, method = 'GET', body) => apiCall('/api/admin' + path, method, body, code)
