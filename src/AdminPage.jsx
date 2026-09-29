import { useEffect, useRef, useState } from 'react'
import AdminShell from './AdminShell.jsx'
import OrderDetails, { StatusBadges } from './OrderDetails.jsx'

export default function Admin() {
  return <AdminShell>{api => <Orders api={api} />}</AdminShell>
}

const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
const percent = (value, total) => total ? Math.round(value / total * 100) : 0

function Progress({ label, value, total, detail }) {
  const rate = percent(value, total)
  return <div className="progress-stat">
    <div className="section-line"><span>{label}</span><strong>{value} <span className="muted">/ {total}</span></strong></div>
    <div className="progress-track" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={total || 1} aria-valuenow={value}><span style={{ width: `${rate}%` }} /></div>
    <span className="progress-percent">{rate}%</span>
  </div>
}

function Breakdown({ title, rows }) {
  return <section className="card stat-breakdown"><h3>{title}</h3><dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
}

export function Stats({ api, refreshKey }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let current = true
    setError('')
    api('/stats').then(value => { if (current) setData(value) }).catch(e => { if (current) setError(e.message) })
    return () => { current = false }
  }, [api, refreshKey, retry])
  return <section aria-labelledby="overview-title" className="overview">
    <div className="section-line"><h2 id="overview-title">Overview</h2><span className="muted small">All orders</span></div>
    {error ? <div className="msg err" role="alert">{error} <button className="ghost" onClick={() => setRetry(n => n + 1)}>Retry</button></div> : !data ? <p role="status" className="muted">Loading statistics…</p> : <>
      <div className="metric-grid">
        {[
          ['Orders paid', `${data.paid}/${data.totalCustomers}`, `${data.unpaid} awaiting payment`],
          ['Meals ordered', data.totalMeals, `${data.burgerMeals} burger meals · ${data.bbqMeals} BBQ meals`],
          ['Collected', `${money(data.collected)}/${money(data.totalValue)}`, `${money(data.outstanding)} remaining`],
        ].map(([label, value, detail]) => <div className="card metric" key={label}><span className="metric-label">{label}</span><strong>{value}</strong><span className="muted small">{detail}</span></div>)}
      </div>
      <div className="breakdown-grid">
        <Breakdown title="Burger orders" rows={[["Chicken burgers", data.chickenBurgers], ["Meat burgers", data.meatBurgers], ["Burger meals", data.burgerMeals]]} />
        <Breakdown title="BBQ stick orders" rows={[["Tawouk sticks", data.tawoukSticks], ["Lahme sticks", data.lahmeSticks], ["Kafta sticks", data.kaftaSticks], ["BBQ meals", data.bbqMeals]]} />
        <Breakdown title="Salads" rows={[["Tabbouli", data.tabbouliSalads], ["Fattoush", data.fattoushSalads]]} />
        <Breakdown title="Beverages & fries" rows={[["Beverages", data.beverages], ["Fries", data.fries]]} />
        <Breakdown title="Burger meal servings" rows={[["Ketchup", data.ketchupServings], ["Coleslaw", data.coleslawServings]]} />
        <Breakdown title="BBQ meal servings" rows={[["Hummus", data.hummusServings], ["Garlic sauce", data.garlicSauceServings], ["Grilled tomatoes & onions", data.grilledTomatoOnionServings], ["Bread", data.breadServings]]} />
      </div>
    </>}
  </section>
}

function CustomerCard({ order, api, onChange, open, onToggle }) {
  const [details, setDetails] = useState(() => order.meals ? order : null)
  const [detailsError, setDetailsError] = useState('')
  const [reload, setReload] = useState(0)
  useEffect(() => {
    if (order.meals) setDetails(order)
  }, [order])
  useEffect(() => {
    if (!open || details?.id === order.id) return
    let current = true
    setDetailsError('')
    api(`/orders/${order.id}`).then(value => { if (current) setDetails(value) })
      .catch(error => { if (current) setDetailsError(error.message) })
    return () => { current = false }
  }, [api, details?.id, open, order.id, reload])
  const changed = (field, updated, response) => {
    if (updated) setDetails(updated)
    onChange(field, updated, response)
  }
  return <article className="card customer">
    <button className="customer-toggle" aria-expanded={open} aria-controls={`order-${order.id}`} onClick={onToggle}>
      <div className="customer-identity"><strong>{order.name} <span className="customer-total">· ${order.price}</span></strong></div>
      <StatusBadges order={order} /><span className="expand-icon" aria-hidden="true">{open ? '−' : '+'}</span>
    </button>
    {open && <div className="customer-body" id={`order-${order.id}`}>
      {detailsError ? <p className="msg err" role="alert">{detailsError} <button className="ghost" onClick={() => { setDetails(null); setReload(value => value + 1) }}>Retry</button></p>
        : !details ? <p className="muted" role="status">Loading order details…</p>
          : <OrderDetails order={details} api={api} onChange={changed} allowDelete />}
    </div>}
  </article>
}

const emptyFilters = { department: '', paid: '', entered: '', received: '' }
const statusFilters = [
  ['paid', 'Payment', 'Paid', 'Not paid'],
  ['entered', 'Entrance', 'Entered', 'Not entered'],
  ['received', 'Meal pickup', 'Received', 'Not received'],
]

function Orders({ api }) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState(emptyFilters)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tick, setTick] = useState(0)
  const [expanded, setExpanded] = useState([])
  const initialLoad = useRef(true)
  useEffect(() => {
    let current = true
    setLoading(true); setError('')
    const delay = initialLoad.current ? 0 : 200
    initialLoad.current = false
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ q: query, ...filters })
      api('/orders?' + params).then(value => { if (current) setData(value) })
        .catch(e => { if (current) setError(e.message) })
        .finally(() => { if (current) setLoading(false) })
    }, delay)
    return () => { current = false; clearTimeout(timer) }
  }, [api, query, filters, tick])
  const refresh = () => setTick(n => n + 1)
  const updateOrder = (id, field, updated, response) => {
    setData(previous => {
      if (!previous) return previous
      if (field === 'delete') return { ...previous, orders: previous.orders.filter(order => order.id !== id), count: Math.max(0, previous.count - 1) }
      return { ...previous, orders: previous.orders.map(order => {
        if (order.id !== id) return order
        if (updated) return updated
        if (['paid', 'entered', 'received'].includes(field)) return { ...order, [field]: Number(response?.value ?? !order[field]) }
        return order
      }) }
    })
    if (field === 'delete') setExpanded(previous => previous.filter(orderId => orderId !== id))
  }
  const filter = (field, value) => { setLoading(true); setFilters(previous => ({ ...previous, [field]: value })) }
  return <>
    <section className="orders-section" aria-labelledby="orders-title">
      <div className="section-line"><h2 id="orders-title">Orders</h2><button className="ghost small" onClick={refresh} disabled={loading}>Refresh</button></div>
      <div className="card filter-panel"><div className="search-field">
        <label htmlFor="order-search">Search orders</label>
        <input id="order-search" type="search" value={query} onChange={e => { setLoading(true); setQuery(e.target.value) }} placeholder="Name, university ID or email" />
        </div><div className="filters">
          <div><label htmlFor="filter-department">Major</label><select id="filter-department" value={filters.department} onChange={e => filter('department', e.target.value)}>
            <option value="">All majors</option>{(data?.departments || []).map(name => <option key={name}>{name}</option>)}
          </select></div>
          {statusFilters.map(([field, label, yes, no]) => <div key={field}><label htmlFor={`filter-${field}`}>{label}</label>
            <select id={`filter-${field}`} value={filters[field]} onChange={e => filter(field, e.target.value)}><option value="">All statuses</option><option value="1">{yes}</option><option value="0">{no}</option></select>
          </div>)}
        </div>
        {(query || Object.values(filters).some(Boolean)) && <button className="text-button" onClick={() => { setLoading(true); setQuery(''); setFilters(emptyFilters) }}>Clear filters</button>}
      </div>
      <div className="results-heading" role="status"><h3>Total: {loading || error ? '—' : data?.count ?? 0}</h3>{loading && <span className="muted small">Updating…</span>}</div>
      {error && <div className="msg err" role="alert">{error} <button className="ghost" onClick={refresh}>Retry</button></div>}
      {!loading && !error && data?.orders.length === 0 && <div className="card empty-state"><h3>No matching orders</h3><p className="muted">Try a different search or clear the filters.</p></div>}
      {!loading && !error && <div className="order-results">{data?.orders.map(order => <CustomerCard key={order.id} order={order} api={api} onChange={(field, updated, response) => updateOrder(order.id, field, updated, response)}
        open={expanded.includes(order.id)} onToggle={() => setExpanded(previous => previous.includes(order.id) ? previous.filter(id => id !== order.id) : [...previous, order.id])} />)}</div>}
    </section>
  </>
}
