import { useCallback, useEffect, useRef, useState } from 'react'
import { adminCall, apiCall } from './api.js'
import BrandHeader from './BrandHeader.jsx'

export function adminRoot() {
  const path = window.location.pathname
  return path.slice(0, path.lastIndexOf('/admin')) + '/admin/'
}

export default function AdminShell({ active = 'orders', children }) {
  const tokenKey = 'mme-admin-token'
  const [code, setCode] = useState('')
  const [token, setToken] = useState(() => localStorage.getItem(tokenKey) || '')
  const [ok, setOk] = useState(() => Boolean(localStorage.getItem(tokenKey)))
  const [checked, setChecked] = useState(() => Boolean(localStorage.getItem(tokenKey)))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const lock = useRef(false)
  const authVersion = useRef(0)
  const api = useCallback((path, method, body) => adminCall(token, path, method, body), [token])

  async function login(value) {
    if (lock.current) return
    lock.current = true
    setBusy(true); setError('')
    try {
      const result = await apiCall('/api/admin/login', 'POST', { code: value })
      if (!result.adminToken) throw new Error('The server did not return an admin session. Please try again.')
      authVersion.current += 1
      localStorage.setItem(tokenKey, result.adminToken)
      setToken(result.adminToken); setCode(''); setOk(true); setChecked(true)
    } catch (e) { setError(e.message) }
    finally { setBusy(false); lock.current = false }
  }
  useEffect(() => {
    let current = true
    const version = authVersion.current
    api('/state').then(() => {
      if (!current || version !== authVersion.current) return
      setOk(true)
    }).catch(() => {
      if (!current || version !== authVersion.current) return
      localStorage.removeItem(tokenKey); setToken(''); setOk(false)
    }).finally(() => { if (current && version === authVersion.current) setChecked(true) })
    return () => { current = false }
  }, [api])
  function logout() {
    authVersion.current += 1
    api('/logout', 'POST').finally(() => { localStorage.removeItem(tokenKey); setToken(''); setCode(''); setOk(false); setChecked(true) })
  }
  const root = adminRoot()
  return <div className="admin-app">
    <BrandHeader admin>{ok && <button className="ghost logout" onClick={logout}>Log out</button>}</BrandHeader>
    <main className="site-width admin-wrap">
    {!checked ? <p className="muted admin-session-check" role="status">Checking admin session…</p> : !ok ? <form className="card login-card" onSubmit={event => { event.preventDefault(); login(code) }}>
      <p className="eyebrow">Team access</p><h2>Admin login</h2>
      <label htmlFor="admin-code">Admin code</label>
      <input id="admin-code" type="password" autoComplete="current-password" required value={code} disabled={busy} onChange={e => setCode(e.target.value)} />
      {error && <p className="msg err" role="alert">{error}</p>}
      <button className="login-button" disabled={busy}>{busy ? 'Signing in…' : 'Log in'}</button>
    </form> : <>
      <nav className="admin-nav" aria-label="Admin pages">
        {[['overview', 'overview/', 'Overview'], ['orders', '', 'Orders'], ['scan', 'scan/', 'Scan tickets'], ['deadline', 'deadline/', 'Ordering deadline']].map(([id, path, label]) =>
          <a key={id} href={root + path} aria-current={active === id ? 'page' : undefined}>{label}</a>)}
      </nav>
      {children(api)}
    </>}
  </main></div>
}
