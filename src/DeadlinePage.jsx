import { useEffect, useRef, useState } from 'react'
import AdminShell from './AdminShell.jsx'
import { deadlineInputs, formatDeadline } from './time.js'

export default function DeadlinePage() {
  return <AdminShell active="deadline">{api => <Deadline api={api} />}</AdminShell>
}

function Deadline({ api }) {
  const [savedDeadline, setSavedDeadline] = useState('')
  const [fields, setFields] = useState({ date: '', time: '' })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [retry, setRetry] = useState(0)
  const lock = useRef(false)
  useEffect(() => {
    let current = true
    setLoading(true); setError('')
    api('/deadline').then(data => {
      if (current) { setSavedDeadline(data.deadline); setFields(deadlineInputs(data.deadline)) }
    }).catch(e => { if (current) setError(e.message) }).finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [api, retry])
  async function save(event) {
    event.preventDefault()
    if (lock.current) return
    lock.current = true; setBusy(true); setError(''); setSaved(false)
    try {
      // Send Beirut wall time; the server resolves the date's actual DST offset.
      const data = await api('/deadline', 'POST', { deadline: `${fields.date}T${fields.time}:00` })
      setSavedDeadline(data.deadline); setFields(deadlineInputs(data.deadline)); setSaved(true)
    } catch (e) { setError(e.message) }
    finally { lock.current = false; setBusy(false) }
  }
  return <section className="page-section">
    <h2 className="page-title">Ordering deadline</h2>
    <form className="card deadline-settings" onSubmit={save}>
      {loading ? <p className="muted" role="status">Loading deadline…</p> : savedDeadline ? <>
        <div className="settings-summary"><p>Current deadline</p><strong>{formatDeadline(savedDeadline)}</strong></div>
        <fieldset disabled={busy} className="deadline-fields">
          <div><label htmlFor="deadline-date">Closing date</label><input id="deadline-date" type="date" required value={fields.date} onChange={e => { setFields({ ...fields, date: e.target.value }); setSaved(false) }} /></div>
          <div><label htmlFor="deadline-time">Closing time</label><input id="deadline-time" type="time" required value={fields.time} onChange={e => { setFields({ ...fields, time: e.target.value }); setSaved(false) }} /></div>
        </fieldset>
        <button disabled={busy}>{busy ? 'Saving…' : 'Save deadline'}</button>
      </> : <button type="button" onClick={() => setRetry(n => n + 1)}>Retry loading</button>}
      {error && <p className="msg err" role="alert">{error}</p>}
      {saved && <p className="msg ok" role="status">Ordering deadline saved in Lebanon time.</p>}
    </form>
  </section>
}
