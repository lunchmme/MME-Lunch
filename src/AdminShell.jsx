import { useCallback, useEffect, useRef, useState } from 'react'
import { adminCall, apiCall } from './api.js'
import BrandHeader from './BrandHeader.jsx'

export function adminRoot() {
  const path = window.location.pathname
  return path.slice(0, path.lastIndexOf('/admin')) + '/admin/'
}

export default function AdminShell({ active = 'orders', children }) {
  const [code, setCode] = useState('')
  const [ok, setOk] = useState(() => sessionStorage.getItem('mme-admin-session') === '1')
  const [checked, setChecked] = useState(() => sessionStorage.getItem('mme-admin-session') === '1')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const lock = useRef(false)
  const api = useCallback((path, method, body) => adminCall('', path, method, body), [])

  async function login(value) {
    if (lock.current) return
    lock.current = true
    setBusy(true); setError('')
    try {
      await apiCall('/api/admin/login', 'POST', { code: value })
      sessionStorage.setItem('mme-admin-session', '1')
      setCode(''); setOk(true); setChecked(true)
    } catch (e) { setError(e.message) }
    finally { setBusy(false); lock.current = false }
  }
  useEffect(() => {
    adminCall('', '/state').then(() => {
      sessionStorage.setItem('mme-admin-session', '1'); setOk(true)
    }).catch(() => {
      sessionStorage.removeItem('mme-admin-session'); setOk(false)
    }).finally(() => setChecked(true))
  }, [])
  function logout() {
    adminCall('', '/logout', 'POST').finally(() => { sessionStorage.removeItem('mme-admin-session'); setCode(''); setOk(false); setChecked(true) })
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
