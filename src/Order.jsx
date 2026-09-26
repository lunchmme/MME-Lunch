import { useEffect, useRef, useState } from 'react'
import { apiCall } from './api.js'

const emptyMeal = () => ({ kind: '', burgers: ['', ''], sticks: ['', '', ''], side: '', note: '', extraBeverageAndFries: false })
const offlineInfo = { departments: ['Mechanical Engineering', 'Mechatronics Engineering'], prices: { 1: 15, 2: 25 }, deadline: null }
const setMeal = (setMeals, index, patch) => setMeals(meals => meals.map((meal, i) => i === index ? { ...meal, ...patch } : meal))
const complete = meal => meal.kind === 'burgers' ? meal.burgers.every(Boolean) : meal.kind === 'bbq' && meal.sticks.every(Boolean) && meal.side

function Deadline({ value }) {
  if (!value) return null
  const date = new Date(value)
  return <div className="hero-deadline"><span className="deadline-label">Orders close at:</span><strong className="deadline-value">{date.toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })}</strong></div>
}

function Included({ meal, index, setMeals }) {
  const items = meal.kind === 'burgers' ? ['Ketchup', 'Coleslaw'] : ['Hummus', 'Garlic sauce', 'Grilled tomatoes & onions', 'Bread']
  const drinks = index === 0 || meal.extraBeverageAndFries
  return <aside className="meal-included"><strong><span aria-hidden="true">★</span> Included free with this meal</strong><div className="included-tags">{items.map(x => <span className="chip meal-extra" key={x}>{x}</span>)}{drinks && <><span className="chip drink-extra">Beverage</span><span className="chip fries-extra">Fries</span></>}</div>{index > 0 && <label className="extra-sides"><input type="checkbox" checked={meal.extraBeverageAndFries} onChange={e => setMeal(setMeals, index, { extraBeverageAndFries: e.target.checked })} /> Add this meal’s beverage and fries</label>}</aside>
}

function MealEntry({ meal, index, setMeals, validation }) {
  const change = patch => setMeal(setMeals, index, patch)
  const choose = (id, label, value, values, onChange) => <div><label htmlFor={id}>{label}</label><select id={id} aria-label={label} value={value} onChange={onChange}><option value="">Choose</option>{values.map(x => <option key={x}>{x}</option>)}</select></div>
  return <section className="card individual-meal"><div className="meal-heading"><span>{index + 1}</span><div><h2>Meal {index + 1}</h2></div></div>
    <div><label htmlFor={`meal-${index}`}>Meal type</label><select id={`meal-${index}`} aria-label={`Meal ${index + 1}`} value={meal.kind} onChange={e => change({ kind: e.target.value })}><option value="">Choose a meal type</option><option value="burgers">2 burgers</option><option value="bbq">3 BBQ sticks</option></select></div>
    {validation?.id === `meal-${index}` && <div className="field-error" role="alert">{validation.message}</div>}
    {meal.kind === 'burgers' && <><div className="choice-grid">{meal.burgers.map((burger, i) => choose(`burger-${index}-${i}`, `Burger ${i + 1}`, burger, ['Chicken', 'Meat'], e => change({ burgers: meal.burgers.map((x, j) => j === i ? e.target.value : x) })))}</div><Included meal={meal} index={index} setMeals={setMeals} /></>}
    {meal.kind === 'bbq' && <><div className="choice-grid bbq-grid">{meal.sticks.map((stick, i) => choose(`stick-${index}-${i}`, `Stick ${i + 1}`, stick, ['Tawouk', 'Lahme', 'Kafta'], e => change({ sticks: meal.sticks.map((x, j) => j === i ? e.target.value : x) })))}</div>{choose(`side-${index}`, 'Side', meal.side, ['Tabbouli', 'Fattoush'], e => change({ side: e.target.value }))}<Included meal={meal} index={index} setMeals={setMeals} /></>}
    <label htmlFor={`note-${index}`}>Note <span className="optional">optional</span></label><input id={`note-${index}`} aria-label={`Note for meal ${index + 1}`} maxLength={200} value={meal.note} placeholder="e.g. no onions" onChange={e => change({ note: e.target.value })} />
  </section>
}

export default function Order() {
  const [info, setInfo] = useState(null), [error, setError] = useState(''), [message, setMessage] = useState(''), [done, setDone] = useState(null)
  const [details, setDetails] = useState({ department: '', name: '', uid: '', email: '' }), [count, setCount] = useState(1), [meals, setMeals] = useState([emptyMeal()]), [busy, setBusy] = useState(false), [validation, setValidation] = useState(null)
  const lock = useRef(false)
  useEffect(() => { apiCall('/api/public').then(setInfo).catch(e => { setError(e.message); setInfo(offlineInfo) }) }, [])
  useEffect(() => setMeals(current => Array.from({ length: count }, (_, i) => current[i] || emptyMeal())), [count])
  async function submit(event) {
    event.preventDefault(); setMessage('')
    const basic = [['department', 'Please select your department.'], ['name', 'Please enter your full name.'], ['uid', 'Please enter your university ID.'], ['email', 'Please enter your email address.']].find(([key]) => !details[key].trim())
    const missing = basic ? [basic[0] === 'uid' ? 'student-id' : basic[0] === 'department' ? 'department' : `student-${basic[0]}`, basic[1]] : meals.map((meal, i) => !complete(meal) && [`meal-${i}`, `Please complete all choices for Meal ${i + 1}.`]).find(Boolean)
    if (missing) { setValidation({ id: missing[0], message: missing[1] }); requestAnimationFrame(() => document.getElementById(missing[0])?.scrollIntoView({ behavior: 'smooth', block: 'center' })); return }
    if (lock.current) return; lock.current = true; setBusy(true); setValidation(null)
    try { setDone(await apiCall('/api/orders', 'POST', { department: details.department, name: details.name, uniId: details.uid, email: details.email, meals })) } catch (e) { setMessage(e.message) } finally { lock.current = false; setBusy(false) }
  }
  if (!info) return <p className="muted">Loading…</p>
  const detailInputs = [['department', 'Department'], ['name', 'Full name'], ['uid', 'University ID'], ['email', 'Email']]
  return <div className="student-app"><header className="student-hero"><div className="order-width hero-content"><div><p className="eyebrow">Mechanical &amp; Mechatronics Engineering</p><h1>MME Lunch</h1></div><Deadline value={info.deadline} /></div></header><main className="order-width student-main">{done ? <div className="card confirmation"><h2>Order received</h2><p>Your total is <b>${done.total}</b>. Pay the club in person to confirm your order.</p><p className="payment-note">{' '}
  <span className="ticket-highlight">
    Your QR ticket will be emailed after payment is confirmed.
  </span>
</p></div> : <form onSubmit={submit} noValidate><fieldset disabled={busy} className="order-flow"><section className="card form-section"><h2><span className="step-number">01</span>Your details</h2>{detailInputs.map(([key, label]) => <div key={key}>{(() => { const invalid = validation?.id === (key === 'uid' ? 'student-id' : key === 'department' ? 'department' : `student-${key}`); return <><label htmlFor={`student-${key}`}>{label}</label>{key === 'department' ? <select id="department" aria-label="Department" aria-invalid={invalid} value={details.department} onChange={e => setDetails({ ...details, department: e.target.value })}><option value="">Select your department</option>{info.departments.map(x => <option key={x}>{x}</option>)}</select> : <input id={`student-${key === 'uid' ? 'id' : key}`} aria-label={label} aria-invalid={invalid} type={key === 'email' ? 'email' : 'text'} value={details[key]} onChange={e => setDetails({ ...details, [key]: e.target.value })} />}{invalid && <div className="field-error" role="alert">{validation.message}</div>}</> })()}</div>)}</section><section className="card form-section meal-count-section"><h2><span className="step-number">02</span>Choose your meals</h2><label htmlFor="meal-count">How many meals?</label><select id="meal-count" aria-label="How many meals?" value={count} onChange={e => setCount(Number(e.target.value))}><option value={1}>1 meal — ${info.prices[1]}</option><option value={2}>2 meals — ${info.prices[2]}</option></select><div className="meal-entries"><p className="meal-entries-title">Your {count === 1 ? 'meal entry' : `${count} meal entries`}</p><div className="individual-meals">{meals.map((meal, index) => <MealEntry key={index} meal={meal} index={index} setMeals={setMeals} validation={validation} />)}</div></div></section><section className="card checkout-section"><div className="total"><div className="total-heading"><span className="step-number">03</span><span className="total-title">Total: <strong>${info.prices[count]}</strong></span></div></div><p className="payment-note">To be paid to the club in person. Your ticket will be emailed after payment is confirmed.</p>{message && <div className="msg err" role="alert">{message}</div>}<button className="submit-order">{busy ? 'Placing order…' : 'Submit Order'}</button></section></fieldset></form>}</main></div>
}
