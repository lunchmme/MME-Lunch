import { useEffect, useState } from 'react'
import AdminShell, { adminRoot } from './AdminShell.jsx'
import OrderDetails, { StatusBadges } from './OrderDetails.jsx'

export default function Checkout() {
  const key = new URLSearchParams(window.location.search).get('key')
  return <AdminShell active="scan">{api => <section className="page-section">
    <h2 className="page-title">Ticket check-in</h2>
    {key ? <Ticket api={api} orderKey={key} /> : <p className="msg err" role="alert">This link is missing a ticket key.</p>}
    <a className="button-link ghost" href={adminRoot() + 'scan/'}>Scan another ticket</a>
  </section>}</AdminShell>
}

export function Ticket({ api, orderKey }) {
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [revoked, setRevoked] = useState(false)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let current = true
    setOrder(null); setError(''); setRevoked(false)
    api('/checkout/' + encodeURIComponent(orderKey)).then(value => { if (current) setOrder(value) })
      .catch(e => { if (current) setError(e.message) })
    return () => { current = false }
  }, [api, orderKey, tick])
  function changed(field) {
    if (field === 'paid') { setOrder(null); setRevoked(true) }
    else { setOrder(null); setTick(value => value + 1) }
  }
  if (revoked) return <div className="card"><h3>Payment undone · ticket revoked</h3><p className="muted">This QR code no longer works. Mark the person as paid again from Orders to create a new ticket.</p><a href={adminRoot()}>Go to orders</a></div>
  if (error) return <div className="msg err" role="alert">{error} <button className="ghost" onClick={() => setTick(value => value + 1)}>Retry lookup</button></div>
  if (!order) return <p className="muted" role="status">Checking ticket…</p>
  return <article className="card customer ticket-card">
    <div className="customer-toggle ticket-header">
      <div className="customer-identity"><span className="eyebrow">Valid paid ticket</span><h3>{order.name} <span className="customer-total">· ${order.price}</span></h3></div>
      <StatusBadges order={order} />
    </div>
    <div className="customer-body"><OrderDetails order={order} api={api} ticketKey={orderKey} onChange={changed} /></div>
  </article>
}
