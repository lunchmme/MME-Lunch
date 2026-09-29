import { useEffect, useRef, useState } from 'react'
import { apiCall } from './api.js'
import roboticsLogo from './assets/rhu-robotics-club.png'
import asmeLogo from './assets/rhu-asme.png'

const BURGER_SERVINGS = ['Ketchup', 'Coleslaw', 'Beverage', 'Fries']
const BBQ_SERVINGS = ['Hummus', 'Garlic sauce', 'Grilled tomatoes & onions', 'Bread', 'Beverage', 'Fries']
const availableServings = kind => kind === 'burgers' ? BURGER_SERVINGS : BBQ_SERVINGS
const emptyMeal = () => ({ kind: '', burgers: ['', ''], sticks: ['', '', ''], side: '', includeSide: false, note: '', includeFreeServings: false, servings: [] })
const offlineInfo = { departments: ['Mechanical Engineering', 'Mechatronics Engineering'], prices: { 1: 15, 2: 25 }, deadline: null, extraFriesPrice: 2.5 }
const setMeal = (setMeals, index, patch) => setMeals(meals => meals.map((meal, i) => i === index ? { ...meal, ...patch } : meal))
const complete = meal => meal.kind === 'burgers' ? meal.burgers.every(Boolean) : meal.kind === 'bbq' && meal.sticks.every(Boolean) && (!meal.includeSide || Boolean(meal.side))

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
  const items = availableServings(meal.kind)
  const enabled = index === 0 || meal.includeFreeServings
  const toggleServing = item => setMeal(setMeals, index, {
    servings: meal.servings.includes(item) ? meal.servings.filter(value => value !== item) : [...meal.servings, item],
  })
  const toggleAll = checked => setMeal(setMeals, index, { includeFreeServings: checked, servings: checked ? [...items] : [] })
  return <div className="included-controls">
    {index > 0 && <label className="meal-toggle"><input type="checkbox" checked={meal.includeFreeServings} onChange={event => toggleAll(event.target.checked)} /> Include this meal’s free servings</label>}
    {enabled && <aside className="meal-included"><strong><span className="included-check" aria-hidden="true">★</span><span className="included-title">Included free with this meal</span><small>Tap an item to uncheck it</small></strong><div className="serving-options">{items.map(item => <label className={'serving-option ' + (meal.servings.includes(item) ? 'selected' : '')} key={item}><input type="checkbox" checked={meal.servings.includes(item)} onChange={() => toggleServing(item)} /><span className="serving-check" aria-hidden="true">✓</span><span>{item}</span></label>)}</div></aside>}
  </div>
}

function MealEntry({ meal, index, setMeals, validation, clearValidation }) {
  const change = patch => { setMeal(setMeals, index, patch); clearValidation() }
  const choose = (id, label, value, values, onChange) => <div><label htmlFor={id}>{label}</label><Picker id={id} label={label} value={value} onChange={onChange} options={values.map(item => ({ value: item, label: item }))} /></div>
  const invalid = validation?.id === `meal-${index}`
  return <section className="card individual-meal"><div className="meal-heading"><span>{index + 1}</span><div><h2>Meal {index + 1}</h2></div></div>
    <div><label htmlFor={`meal-${index}`}>Meal type</label><Picker id={`meal-${index}`} label={`Meal ${index + 1}`} value={meal.kind} invalid={invalid} placeholder="Choose a meal type" options={[{ value: 'burgers', label: '2 burgers' }, { value: 'bbq', label: '3 BBQ sticks' }]} onChange={kind => change({ kind, side: '', includeSide: false, includeFreeServings: index === 0, servings: index === 0 ? [...availableServings(kind)] : [] })} /></div>
    {invalid && <div className="field-error" role="alert">{validation.message}</div>}
    {meal.kind === 'burgers' && <><div className="choice-grid">{meal.burgers.map((burger, i) => choose(`burger-${index}-${i}`, `Burger ${i + 1}`, burger, ['Chicken', 'Meat'], value => change({ burgers: meal.burgers.map((item, j) => j === i ? value : item) })))}</div><Included meal={meal} index={index} setMeals={setMeals} /></>}
    {meal.kind === 'bbq' && <><div className="choice-grid bbq-grid">{meal.sticks.map((stick, i) => choose(`stick-${index}-${i}`, `Stick ${i + 1}`, stick, ['Tawouk', 'Lahme', 'Kafta'], value => change({ sticks: meal.sticks.map((item, j) => j === i ? value : item) })))}</div>{index === 0 ? choose(`side-${index}`, 'Side', meal.side, ['None', 'Tabbouli', 'Fattoush'], value => change({ side: value })) : <div className="extra-side"><label className="meal-toggle"><input type="checkbox" checked={meal.includeSide} onChange={event => change({ includeSide: event.target.checked, side: event.target.checked ? meal.side : '' })} /> Include this meal’s side</label>{meal.includeSide && choose(`side-${index}`, 'Side', meal.side, ['Tabbouli', 'Fattoush'], value => change({ side: value }))}</div>}<Included meal={meal} index={index} setMeals={setMeals} /></>}
    <label htmlFor={`note-${index}`}>Note <span className="optional">optional</span></label><input id={`note-${index}`} aria-label={`Note for meal ${index + 1}`} maxLength={200} value={meal.note} placeholder="e.g. no onions" onChange={e => change({ note: e.target.value })} />
  </section>
}
export default function Order() {
  const [info, setInfo] = useState(null), [error, setError] = useState(''), [message, setMessage] = useState(''), [done, setDone] = useState(null)
  const [details, setDetails] = useState({ attendeeType: 'Student', department: '', name: '', uid: '', email: '' }), [count, setCount] = useState(1), [meals, setMeals] = useState([emptyMeal()]), [extraFries, setExtraFries] = useState(false), [busy, setBusy] = useState(false), [validation, setValidation] = useState(null)
  const lock = useRef(false)
  useEffect(() => { apiCall('/api/public').then(setInfo).catch(e => { setError(e.message); setInfo(offlineInfo) }) }, [])
  useEffect(() => setMeals(current => Array.from({ length: count }, (_, i) => current[i] || emptyMeal())), [count])
  async function submit(event) {
    event.preventDefault(); setMessage('')
    const requiredDetails = details.attendeeType === 'Student'
      ? [['name', 'Please enter your full name.'], ['department', 'Please select your major.'], ['uid', 'Please enter your university ID.'], ['email', 'Please enter your email address.']]
      : [['name', 'Please enter your full name.'], ['email', 'Please enter your email address.']]
    const basic = requiredDetails.find(([key]) => !details[key].trim())
    const basicId = basic?.[0] === 'department' ? 'department' : basic?.[0] === 'uid' ? 'student-id' : basic ? `student-${basic[0]}` : ''
    const missing = basic ? [basicId, basic[1]] : meals.map((meal, i) => !complete(meal) && [`meal-${i}`, `Please complete all required choices for Meal ${i + 1}.`]).find(Boolean)
    if (missing) { setValidation({ id: missing[0], message: missing[1] }); requestAnimationFrame(() => document.getElementById(missing[0])?.scrollIntoView({ behavior: 'smooth', block: 'center' })); return }
    if (lock.current) return; lock.current = true; setBusy(true); setValidation(null)
    try { setDone(await apiCall('/api/orders', 'POST', { attendeeType: details.attendeeType, department: details.attendeeType === 'Student' ? details.department : '', name: details.name, uniId: details.attendeeType === 'Student' ? details.uid : '', email: details.email, meals, extraFries })) } catch (e) { setMessage(e.message) } finally { lock.current = false; setBusy(false) }
  }
  if (!info) return <p className="muted">Loading…</p>
  return <div className="student-app"><header className="student-hero"><div className="order-width hero-content"><div className="hero-brand"><div><p className="eyebrow">Mechanical &amp; Mechatronics Engineering</p><h1>MME Lunch</h1></div><div className="partner-logos" aria-label="RHU Robotics and Technology Club and ASME RHU Student Chapter"><img src={roboticsLogo} alt="RHU Robotics and Technology Club" /><img src={asmeLogo} alt="ASME Rafik Hariri University Student Chapter" /></div></div><Deadline value={info.deadline} /></div></header><main className="order-width student-main">{done ? <div className="card confirmation"><h2>Order received</h2><p>Your total is <b>${done.total}</b>.</p><div className="payment-instructions"><strong>Pay in person for your order</strong> at either <b>Dr. Mohammad Al Kaderi’s office — Block C</b> or <b>Mrs. Alaa Al Lel’s office — Block C</b>.</div><div className="ticket-highlight">Your QR ticket will be emailed after your payment is confirmed. Don’t lose it!</div></div> : <><section className="welcome-panel"><span className="welcome-kicker">Welcome to MME Lunch</span><strong>Good food. Great company. Come hungry!</strong><p>Build your meal exactly how you like it, then join the MME community for lunch.</p></section><div className="mme-only-note" role="note"><span className="warning-mark" aria-hidden="true">!</span><div><strong>MME community only</strong><span>Registration is restricted to MME students and faculty members.</span></div></div><form onSubmit={submit} noValidate><fieldset disabled={busy} className="order-flow"><section className="card form-section"><h2><span className="step-number">01</span>Your details</h2><label htmlFor="attendee-type">I am a</label><Picker id="attendee-type" label="Attendee type" value={details.attendeeType} options={['Student', 'Faculty member'].map(value => ({ value, label: value }))} onChange={attendeeType => { setDetails({ ...details, attendeeType, ...(attendeeType === 'Faculty member' ? { department: '', uid: '' } : {}) }); setValidation(null) }} /><label htmlFor="student-name">Full name</label><input id="student-name" aria-label="Full name" aria-invalid={validation?.id === 'student-name'} value={details.name} onChange={event => { setDetails({ ...details, name: event.target.value }); setValidation(null) }} />{validation?.id === 'student-name' && <div className="field-error" role="alert">{validation.message}</div>}{details.attendeeType === 'Student' && <><label htmlFor="department">Major</label><Picker id="department" label="Major" value={details.department} invalid={validation?.id === 'department'} placeholder="Select your major" options={info.departments.map(item => ({ value: item, label: item }))} onChange={department => { setDetails({ ...details, department }); setValidation(null) }} />{validation?.id === 'department' && <div className="field-error" role="alert">{validation.message}</div>}<label htmlFor="student-id">University ID</label><input id="student-id" aria-label="University ID" aria-invalid={validation?.id === 'student-id'} value={details.uid} onChange={event => { setDetails({ ...details, uid: event.target.value }); setValidation(null) }} />{validation?.id === 'student-id' && <div className="field-error" role="alert">{validation.message}</div>}</>}<label htmlFor="student-email">Email</label><input id="student-email" aria-label="Email" aria-invalid={validation?.id === 'student-email'} type="email" value={details.email} onChange={event => { setDetails({ ...details, email: event.target.value }); setValidation(null) }} />{validation?.id === 'student-email' && <div className="field-error" role="alert">{validation.message}</div>}</section><section className="card form-section meal-count-section"><h2><span className="step-number">02</span>Choose your meals</h2><label htmlFor="meal-count">How many meals?</label><Picker id="meal-count" label="How many meals?" value={String(count)} options={[{ value: '1', label: '1 meal - $' + info.prices[1] }, { value: '2', label: '2 meals - $' + info.prices[2] }]} onChange={value => setCount(Number(value))} /><div className="meal-entries"><p className="meal-entries-title">Your {count === 1 ? 'meal entry' : `${count} meal entries`}</p><div className="individual-meals">{meals.map((meal, index) => <MealEntry key={index} meal={meal} index={index} setMeals={setMeals} validation={validation} clearValidation={() => setValidation(null)} />)}</div><label className="extra-fries-option"><input type="checkbox" checked={extraFries} onChange={event => setExtraFries(event.target.checked)} /><span><strong>Add extra fries</strong><small>A separate, larger fries portion</small></span><b>+${(info.extraFriesPrice ?? 2.5).toFixed(2)}</b></label></div></section><section className="card checkout-section"><div className="total"><div className="total-heading"><span className="step-number">03</span><span className="total-title">Total: <strong>${(info.prices[count] + (extraFries ? (info.extraFriesPrice ?? 2.5) : 0)).toFixed(2)}</strong></span></div></div><div className="payment-instructions"><strong>Pay in person for your order</strong> at either <b>Dr. Mohammad Al Kaderi’s office — Block C</b> or <b>Mrs. Alaa Al Lel’s office — Block C</b>. Your QR ticket will be emailed after payment is confirmed.</div>{message && <div className="msg err" role="alert">{message}</div>}<button className="submit-order">{busy ? 'Placing order...' : 'Submit Order'}</button></section></fieldset></form></>}</main></div>
}
