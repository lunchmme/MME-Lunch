import { useRef, useState } from 'react'

export function StatusBadges({ order }) {
  return <div className="status-badges">{[[order.paid, 'Paid', 'Not paid'], [order.entered, 'Entered', 'Not entered'], [order.received, 'Received', 'Not received']].map(([value, yes, no]) => <span key={yes} className={'tag ' + (value ? 'paid' : 'unpaid')}>{value ? yes : no}</span>)}</div>
}

const quantities = values => Object.entries(values.reduce((all, value) => ({ ...all, [value]: (all[value] || 0) + 1 }), {}))
const legacyServings = (meal, index) => {
  const base = meal.meal_type === 'Burgers' ? ['Ketchup', 'Coleslaw'] : ['Hummus', 'Garlic sauce', 'Grilled tomatoes & onions', 'Bread']
  if (index === 0 || meal.details?.extraBeverageAndFries) base.push('Beverage', 'Fries')
  return base
}

function MealBreakdown({ meal, index }) {
  const details = meal.details || {}, burger = meal.meal_type === 'Burgers'
  const requested = quantities(burger ? details.burgers || [] : details.sticks || [])
  return <li className="admin-meal"><div className="admin-meal-title"><span>Meal {index + 1}</span><strong>{meal.meal_type}</strong></div><div className="admin-list-row"><b>Requested</b><ul>{requested.map(([item, count]) => <li key={item}>×{count} {item}</li>)}</ul></div>{!burger && <div className="admin-list-row"><b>Salad</b><span>{details.side || 'Not added'}</span></div>}{meal.note && <div className="admin-list-row"><b>Note</b><span>{meal.note}</span></div>}</li>
}

export default function OrderDetails({ order, api, onChange, ticketKey, allowDelete = false }) {
  const [busy, setBusy] = useState(''), [error, setError] = useState('')
  const lock = useRef(false)
  const servings = quantities(order.meals.flatMap((meal, index) => meal.details?.servings ?? legacyServings(meal, index)))
  async function change(field) {
    if (lock.current || field === 'delete' && !window.confirm(`Permanently delete ${order.name}'s order?`)) return
    lock.current = true; setBusy(field); setError('')
    try {
      let response
      if (field === 'delete') response = await api(`/orders/${order.id}`, 'DELETE')
      else if (field === 'ticket-email') response = await api(`/orders/${order.id}/ticket-email`, 'POST', { ticketKey: order.ticket_key })
      else response = await api(`/orders/${order.id}/${field}`, 'POST', { value: !order[field], ...(ticketKey ? { ticketKey } : {}) })
      await onChange(field, response?.order, response)
    } catch (e) { setError(e.message); if (ticketKey && [404, 409].includes(e.status)) await onChange('invalid') } finally { lock.current = false; setBusy('') }
  }
  return <>
    <div className="admin-order-profile"><div><b>Attendee</b><span>{order.attendee_type || 'Student'}</span></div><div><b>Major</b><span>{order.department || 'Not provided'}</span></div><div><b>University ID</b><span>{order.uni_id || 'Not provided'}</span></div><div><b>Email</b><span>{order.email}</span></div></div>
    <ul className="meal-list admin-meal-list">{order.meals.map((meal, index) => <MealBreakdown key={index} meal={meal} index={index} />)}<li className="admin-meal admin-included"><div className="admin-meal-title"><strong>Servings</strong></div>{servings.length ? <ul className="servings-list">{servings.map(([item, count]) => <li key={item}>{item} ×{count}</li>)}</ul> : <span className="muted">No free servings requested</span>}</li></ul>
    {order.paid === 1 && <div className={'msg ' + (order.ticket_email_status === 'failed' ? 'err' : 'ok')} role="status">{order.ticket_email_status === 'accepted' ? 'Ticket email sent.' : order.ticket_email_status === 'failed' ? `Payment saved. ${order.ticket_email_error || 'The ticket email failed. Please retry.'}` : order.ticket_email_status === 'sending' ? 'Ticket email is being submitted. Refresh to check its status.' : 'Ticket email has not been submitted yet.'}{order.ticket_email_status !== 'accepted' && <button className="ghost" disabled={!!busy} onClick={() => change('ticket-email')}>{busy === 'ticket-email' ? 'Sending…' : order.ticket_email_status === 'failed' || order.ticket_email_status === 'sending' ? 'Retry ticket email' : 'Send ticket email'}</button>}</div>}
    <div className="action-row">{[['paid', 'Mark as paid', 'Undo paid'], ['entered', 'Mark as entered', 'Undo entered'], ['received', 'Mark order received', 'Undo received']].map(([field, yes, undo]) => <button key={field} className={order[field] ? 'ghost' : 'ok'} disabled={!!busy || (field !== 'paid' && !order.paid && !order[field])} onClick={() => change(field)}>{busy === field ? 'Saving…' : order[field] ? undo : yes}</button>)}{allowDelete && <button className="bad" disabled={!!busy} onClick={() => change('delete')}>{busy === 'delete' ? 'Deleting…' : 'Delete'}</button>}</div>
    {error && <p className="msg err" role="alert">{error}</p>}
  </>
}
