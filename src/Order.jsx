import { useEffect, useRef, useState } from 'react'
import { apiCall } from './api.js'
import roboticsLogo from './assets/rhu-robotics-club.png'
import asmeLogo from './assets/rhu-asme.png'

const emptyMeal = () => ({ kind: '', burgers: ['', ''], sticks: ['', '', ''], side: '', includeSide: false, note: '', extraBeverageAndFries: false })
const offlineInfo = { departments: ['Mechanical Engineering', 'Mechatronics Engineering'], prices: { 1: 15, 2: 25 }, deadline: null }
const setMeal = (setMeals, index, patch) => setMeals(meals => meals.map((meal, i) => i === index ? { ...meal, ...patch } : meal))
const complete = (meal, index) => meal.kind === 'burgers' ? meal.burgers.every(Boolean) : meal.kind === 'bbq' && meal.sticks.every(Boolean) && (index === 0 ? Boolean(meal.side) : !meal.includeSide || Boolean(meal.side))

function Picker({ id, label, value, options, placeholder = 'Choose', invalid = false, onChange }) {
  const [open, setOpen] = useState(false)
  const picker = useRef(null)
  const selected = options.find(option => option.value === value)
  useEffect(() => {
    const close = event => { if (!picker.current?.contains(event.target)) setOpen(false) }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])
  return <div className="picker" ref={picker}>
    <button id={id} type="button" className="picker-trigger" aria-label={label} aria-invalid={invalid || undefined} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(value => !value)}>
      <span>{selected?.label || placeholder}</span><span className="picker-chevron" aria-hidden="true">v</span>
    </button>
    {open && <div className="picker-options" role="listbox" aria-label={label}>{options.map(option => <button key={option.value} type="button" role="option" aria-selected={option.value === value} onClick={() => { onChange(option.value); setOpen(false) }}>{option.label}</button>)}</div>}
  </div>
}

function Deadline({ value }) {
  if (!value) return null
  const date = new Date(value)
  return <div className="hero-deadline"><span className="deadline-label">Orders close at:</span><strong className="deadline-value">{date.toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })}</strong></div>
}

function Included({ meal, index, setMeals }) {
  const items = meal.kind === 'burgers' ? ['Ketchup', 'Coleslaw'] : ['Hummus', 'Garlic sauce', 'Grilled tomatoes & onions', 'Bread']
  const drinks = index === 0 || meal.extraBeverageAndFries
  return <aside className="meal-included"><strong><span aria-hidden="true">★</span> Included free with this meal</strong><div className="included-tags">{items.map(x => <span className="chip meal-extra" key={x}>{x}</span>)}{meal.side && <span className="chip salad-extra">{meal.side}</span>}{drinks && <><span className="chip drink-extra">Beverage</span><span className="chip fries-extra">Fries</span></>}</div>{index > 0 && <label className="extra-sides"><input type="checkbox" checked={meal.extraBeverageAndFries} onChange={e => setMeal(setMeals, index, { extraBeverageAndFries: e.target.checked })} /> Add this meal’s beverage and fries</label>}</aside>
}

function MealEntry({ meal, index, setMeals, validation }) {
  const change = patch => setMeal(setMeals, index, patch)
  const choose = (id, label, value, values, onChange) => <div><label htmlFor={id}>{label}</label><Picker id={id} label={label} value={value} onChange={onChange} options={values.map(item => ({ value: item, label: item }))} /></div>
  const invalid = validation?.id === `meal-${index}`
  return <section className="card individual-meal"><div className="meal-heading"><span>{index + 1}</span><div><h2>Meal {index + 1}</h2></div></div>
    <div><label htmlFor={`meal-${index}`}>Meal type</label><Picker id={`meal-${index}`} label={`Meal ${index + 1}`} value={meal.kind} invalid={invalid} placeholder="Choose a meal type" options={[{ value: 'burgers', label: '2 burgers' }, { value: 'bbq', label: '3 BBQ sticks' }]} onChange={kind => change({ kind })} /></div>
    {invalid && <div className="field-error" role="alert">{validation.message}</div>}
    {meal.kind === 'burgers' && <><div className="choice-grid">{meal.burgers.map((burger, i) => choose(`burger-${index}-${i}`, `Burger ${i + 1}`, burger, ['Chicken', 'Meat'], value => change({ burgers: meal.burgers.map((item, j) => j === i ? value : item) })))}</div><Included meal={meal} index={index} setMeals={setMeals} /></>}
    {meal.kind === 'bbq' && <><div className="choice-grid bbq-grid">{meal.sticks.map((stick, i) => choose(`stick-${index}-${i}`, `Stick ${i + 1}`, stick, ['Tawouk', 'Lahme', 'Kafta'], value => change({ sticks: meal.sticks.map((item, j) => j === i ? value : item) })))}</div>{index === 0 ? choose(`side-${index}`, 'Side', meal.side, ['Tabbouli', 'Fattoush'], value => change({ side: value })) : <div className="extra-side"><label><input type="checkbox" checked={meal.includeSide} onChange={event => change({ includeSide: event.target.checked, side: event.target.checked ? meal.side : '' })} /> Add this meal’s salad</label>{meal.includeSide && choose(`side-${index}`, 'Salad', meal.side, ['Tabbouli', 'Fattoush'], value => change({ side: value }))}</div>}<Included meal={meal} index={index} setMeals={setMeals} /></>}
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
    const missing = basic ? [basic[0] === 'uid' ? 'student-id' : basic[0] === 'department' ? 'department' : `student-${basic[0]}`, basic[1]] : meals.map((meal, i) => !complete(meal, i) && [`meal-${i}`, `Please complete all choices for Meal ${i + 1}.`]).find(Boolean)
    if (missing) { setValidation({ id: missing[0], message: missing[1] }); requestAnimationFrame(() => document.getElementById(missing[0])?.scrollIntoView({ behavior: 'smooth', block: 'center' })); return }
    if (lock.current) return; lock.current = true; setBusy(true); setValidation(null)
    try { setDone(await apiCall('/api/orders', 'POST', { department: details.department, name: details.name, uniId: details.uid, email: details.email, meals })) } catch (e) { setMessage(e.message) } finally { lock.current = false; setBusy(false) }
  }
  if (!info) return <p className="muted">Loading…</p>
  const detailInputs = [['department', 'Department'], ['name', 'Full name'], ['uid', 'University ID'], ['email', 'Email']]
  return <div className="student-app"><header className="student-hero"><div className="order-width hero-content"><div className="hero-brand"><div><p className="eyebrow">Mechanical &amp; Mechatronics Engineering Department</p><h1>MME Lunch</h1></div><div className="partner-logos" aria-label="RHU Robotics and Technology Club and ASME RHU Student Chapter"><img src={roboticsLogo} alt="RHU Robotics and Technology Club" /><img src={asmeLogo} alt="ASME Rafik Hariri University Student Chapter" /></div></div><Deadline value={info.deadline} /></div></header><main className="order-width student-main">{done ? <div className="card confirmation"><h2>Order received</h2><p>Your total is <b>${done.total}</b>. Pay the club in person to confirm your order.</p><p className="payment-note">{' '}
  <span className="ticket-highlight">
    Your QR ticket will be emailed after payment is confirmed.
  </span>
</p></div> : <form onSubmit={submit} noValidate><fieldset disabled={busy} className="order-flow"><section className="card form-section"><h2><span className="step-number">01</span>Your details</h2>{detailInputs.map(([key, label]) => <div key={key}>{(() => { const invalid = validation?.id === (key === 'uid' ? 'student-id' : key === 'department' ? 'department' : `student-${key}`); return <><label htmlFor={`student-${key}`}>{label}</label>{key === 'department' ? <Picker id="department" label="Department" value={details.department} invalid={invalid} placeholder="Select your department" options={info.departments.map(item => ({ value: item, label: item }))} onChange={department => setDetails({ ...details, department })} /> : <input id={`student-${key === 'uid' ? 'id' : key}`} aria-label={label} aria-invalid={invalid} type={key === 'email' ? 'email' : 'text'} value={details[key]} onChange={e => setDetails({ ...details, [key]: e.target.value })} />}{invalid && <div className="field-error" role="alert">{validation.message}</div>}</> })()}</div>)}</section><section className="card form-section meal-count-section"><h2><span className="step-number">02</span>Choose your meals</h2><label htmlFor="meal-count">How many meals?</label><Picker id="meal-count" label="How many meals?" value={String(count)} options={[{ value: '1', label: '1 meal - $' + info.prices[1] }, { value: '2', label: '2 meals - $' + info.prices[2] }]} onChange={value => setCount(Number(value))} /><div className="meal-entries"><p className="meal-entries-title">Your {count === 1 ? 'meal entry' : `${count} meal entries`}</p><div className="individual-meals">{meals.map((meal, index) => <MealEntry key={index} meal={meal} index={index} setMeals={setMeals} validation={validation} />)}</div></div></section><section className="card checkout-section"><div className="total"><div className="total-heading"><span className="step-number">03</span><span className="total-title">Total: <strong>${info.prices[count]}</strong></span></div></div><p className="payment-note">To be paid to the club in person. Your ticket will be emailed after payment is confirmed.</p>{message && <div className="msg err" role="alert">{message}</div>}<button className="submit-order">{busy ? 'Placing order...' : 'Submit Order'}</button></section></fieldset></form>}</main></div>
}
