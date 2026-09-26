import { test, expect } from '@playwright/test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { QRCodeSVG } from 'qrcode.react'

const ticketKey = 'test-ticket-key-123456789'
const ticketUrl = `https://example.com/lunch/admin/checkout/?key=${ticketKey}`
const departments = ['Mechanical Engineering', 'Mechatronics Engineering']

async function mockApi(page) {
  // Keep tests independent of external font downloads.
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }))
  await page.route('https://fonts.gstatic.com/**', route => route.abort())
  const state = {
    deadline: '2027-07-15T12:00:00+03:00', failOrders: false, failMutation: false, failSubmit: false,
    submitted: 0, deadlinePayload: null, failEmail: false,
    orders: [
      { id: 1, name: 'Maya Test', department: departments[0], uni_id: '123', email: 'maya@example.com', meal_count: 1, price: 15, paid: 1, entered: 0, received: 0, ticket_key: ticketKey, meals: [{ meal_type: 'Burgers', details: { burgers: ['Chicken', 'Meat'] }, note: 'No onions' }] },
      { id: 2, name: 'Karim Test', department: departments[1], uni_id: '456', email: 'karim@example.com', meal_count: 2, price: 25, paid: 0, entered: 0, received: 0, ticket_key: null, meals: [{ meal_type: 'BBQ sticks', details: { sticks: ['Tawouk', 'Lahme', 'Kafta'], side: 'Tabbouli' }, note: '' }, { meal_type: 'BBQ sticks', details: { sticks: ['Tawouk', 'Lahme', 'Kafta'], side: 'Fattoush', extraBeverageAndFries: true }, note: '' }] },
    ],
  }
  await page.route('**/api/**', async route => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname
    const respond = (json, status = 200) => route.fulfill({ status, json, headers: { 'Access-Control-Allow-Origin': 'http://127.0.0.1:4173', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS' } })
    if (request.method() === 'OPTIONS') return respond({})
    if (path === '/api/public') return respond({ closed: false, deadline: state.deadline, departments, prices: { 1: 15, 2: 25 } })
    if (path === '/api/orders') {
      state.submitted++
      if (state.failSubmit) return route.abort('failed')
      return respond({ id: 3, total: 15 }, 201)
    }
    if (path === '/api/admin/state') return respond({ ok: true })
    if (path === '/api/admin/deadline') {
      if (request.method() === 'POST') {
        state.deadlinePayload = request.postDataJSON()
        state.deadline = state.deadlinePayload.deadline + '+02:00'
      }
      return respond({ deadline: state.deadline, timezone: 'Asia/Beirut' })
    }
    if (path === '/api/admin/stats') return respond({ totalCustomers: 2, paid: 1, unpaid: 1, totalMeals: 3, burgerMeals: 1, bbqMeals: 2, entered: 0, received: 0, collected: 15, totalValue: 40, outstanding: 25, chickenBurgers: 1, meatBurgers: 1, tawoukSticks: 2, lahmeSticks: 2, kaftaSticks: 2, tabbouliSalads: 1, fattoushSalads: 1, beverages: 2, fries: 2, ketchupServings: 1, coleslawServings: 1, hummusServings: 2, garlicSauceServings: 2, grilledTomatoOnionServings: 2, breadServings: 2 })
    if (path === '/api/admin/orders') {
      if (state.failOrders) return respond({ error: 'Orders temporarily unavailable.' }, 503)
      const query = url.searchParams.get('q')?.toLowerCase() || ''
      const filtered = state.orders.filter(order => {
        if (![order.name, order.uni_id, order.email].some(value => value.toLowerCase().includes(query))) return false
        return ['department', 'paid', 'entered', 'received'].every(key => !url.searchParams.get(key) || String(order[key]) === url.searchParams.get(key))
      })
      return respond({ orders: filtered, count: filtered.length, departments })
    }
    if (path.startsWith('/api/admin/checkout/')) {
      const key = path.split('/').pop()
      const order = state.orders.find(order => order.paid && order.ticket_key === key)
      return order ? respond(order) : respond({ error: 'This ticket is invalid or has been revoked.' }, 404)
    }
    const emailRetry = path.match(/\/api\/admin\/orders\/(\d+)\/ticket-email$/)
    if (emailRetry) {
      const order = state.orders.find(order => order.id === Number(emailRetry[1]))
      order.ticket_email_status = 'accepted'; order.ticket_email_error = null
      return respond({ ok: true })
    }
    const mutation = path.match(/\/api\/admin\/orders\/(\d+)\/(paid|entered|received)$/)
    if (mutation) {
      if (state.failMutation) return respond({ error: 'Could not save status.' }, 503)
      const order = state.orders.find(order => order.id === Number(mutation[1]))
      const { value } = request.postDataJSON()
      order[mutation[2]] = Number(value)
      if (mutation[2] === 'paid') {
        order.ticket_key = value ? 'replacement-key-123456789' : null
        order.ticket_email_status = value ? state.failEmail ? 'failed' : 'accepted' : null
        order.ticket_email_error = value && state.failEmail ? 'Brevo unavailable.' : null
      }
      return respond({ ok: true, value })
    }
    return respond({ error: 'Unexpected test request: ' + path }, 404)
  })
  return state
}

test('overview has concise statistics and orders use count-free filters with filtered totals', async ({ page }) => {
  await mockApi(page)
  await page.goto('/admin/overview/')
  await expect(page.getByRole('link', { name: 'Scan tickets' })).toHaveCount(1)
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible()
  await expect(page.getByRole('meter')).toHaveCount(0)
  await page.goto('/admin/')
  await expect(page.getByRole('heading', { name: 'Total: 2' })).toBeVisible()
  await expect(page.locator('.filters')).not.toContainText(/\(\d+\)/)
  await expect(page.getByRole('heading', { name: 'Overview' })).toHaveCount(0)
  await page.getByLabel('Payment', { exact: true }).selectOption('0')
  await expect(page.getByRole('heading', { name: 'Total: 1' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Karim Test/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Maya Test/ })).toHaveCount(0)
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(page.getByRole('heading', { name: 'Total: 2' })).toBeVisible()
  await page.screenshot({ path: 'test-results/admin-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/admin-mobile.png', fullPage: true })
})

test('deadline page shows Beirut time even in a Los Angeles browser', async ({ page }) => {
  const state = await mockApi(page)
  await page.goto('/admin/deadline/')
  await expect(page.getByLabel('Closing time')).toHaveValue('12:00')
  await page.screenshot({ path: 'test-results/deadline-desktop.png', fullPage: true })
  await page.getByLabel('Closing date').fill('2027-01-15')
  await page.getByLabel('Closing time').fill('17:30')
  await page.getByRole('button', { name: 'Save deadline' }).click()
  await expect(page.getByText('Ordering deadline saved in Lebanon time.')).toBeVisible()
  expect(state.deadlinePayload).toEqual({ deadline: '2027-01-15T17:30:00' })
  await page.reload()
  await expect(page.getByLabel('Closing time')).toHaveValue('17:30')
})

test('scanner decodes an actual QR image and invalidates the displayed ticket on undo paid', async ({ page }) => {
  const state = await mockApi(page)
  await page.goto('/admin/scan/')
  await expect(page.getByRole('button', { name: 'Start camera' })).toBeVisible()
  await page.screenshot({ path: 'test-results/scanner-desktop.png', fullPage: true })
  const svg = renderToStaticMarkup(React.createElement(QRCodeSVG, { xmlns: 'http://www.w3.org/2000/svg', value: ticketUrl, size: 400, includeMargin: true }))
  await page.getByLabel('Upload QR image').setInputFiles({ name: 'ticket.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(svg) })
  await expect(page.getByRole('heading', { name: 'Maya Test' })).toBeVisible()
  await expect(page.getByText('No onions')).toBeVisible()
  await page.locator('#order-1').getByRole('button', { name: 'Mark as entered' }).click()
  await expect(page.getByRole('button', { name: 'Undo entered' })).toBeVisible()
  await page.getByRole('button', { name: 'Undo paid', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Payment undone · ticket revoked' })).toBeVisible()
  expect(state.orders[0].ticket_key).toBeNull()
  await page.getByLabel('Ticket link', { exact: true }).fill(ticketUrl)
  await page.getByRole('button', { name: 'Look up ticket' }).click()
  await expect(page.getByRole('alert')).toContainText('revoked')
})

test('scanner handles invalid links, unreadable images, and camera denial', async ({ page }) => {
  await mockApi(page)
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { value: async () => { throw new DOMException('Denied', 'NotAllowedError') } })
  })
  await page.goto('/admin/scan/')
  await page.getByRole('button', { name: 'Start camera' }).click()
  await expect(page.getByRole('alert')).toContainText('Could not start the camera')
  await page.getByLabel('Ticket link', { exact: true }).fill('https://example.com/not-a-ticket')
  await page.getByRole('button', { name: 'Look up ticket' }).click()
  await expect(page.getByRole('alert')).toContainText('not an MME Lunch ticket')
  await page.getByLabel('Upload QR image').setInputFiles({ name: 'blank.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="white"/></svg>') })
  await expect(page.getByRole('alert')).toContainText('No readable QR code')
})

test('camera stream decodes a ticket and releases its tracks after a scan', async ({ page }) => {
  await mockApi(page)
  await page.goto('/admin/scan/')
  await expect(page.getByRole('button', { name: 'Start camera' })).toBeVisible()
  const svg = renderToStaticMarkup(React.createElement(QRCodeSVG, { xmlns: 'http://www.w3.org/2000/svg', value: ticketUrl, size: 280, includeMargin: true }))
  await page.evaluate(async source => {
    const canvas = document.createElement('canvas')
    canvas.width = 640; canvas.height = 480
    const image = new Image()
    image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source)
    await image.decode()
    const context = canvas.getContext('2d')
    const draw = () => { context.fillStyle = 'white'; context.fillRect(0, 0, 640, 480); context.drawImage(image, 180, 100, 280, 280) }
    draw()
    const stream = canvas.captureStream(10)
    window.testCameraStream = stream
    window.testCameraTimer = setInterval(draw, 100)
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { value: async () => stream })
  }, svg)
  await page.getByRole('button', { name: 'Start camera' }).click()
  await expect(page.getByRole('heading', { name: 'Maya Test' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.testCameraStream.getTracks().every(track => track.readyState === 'ended'))).toBe(true)
  await page.evaluate(() => clearInterval(window.testCameraTimer))
})

test('failed reads and status updates surface errors and allow retries', async ({ page }) => {
  const state = await mockApi(page)
  state.failOrders = true
  await page.goto('/admin/')
  await expect(page.getByRole('alert')).toContainText('Orders temporarily unavailable')
  state.failOrders = false
  await page.getByRole('button', { name: 'Retry', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Total: 2' })).toBeVisible()
  await page.getByRole('button', { name: /Maya Test/ }).click()
  state.failMutation = true
  await page.locator('#order-1').getByRole('button', { name: 'Mark as entered' }).click()
  await expect(page.getByRole('alert')).toContainText('Could not save status')
  state.failMutation = false
  await page.locator('#order-1').getByRole('button', { name: 'Mark as entered' }).click()
  await expect(page.getByRole('heading', { name: 'Total: 2' })).toBeVisible()
})

test('student submission handles a network failure and shows no unpaid QR ticket', async ({ page }) => {
  const state = await mockApi(page)
  state.failSubmit = true
  await page.goto('/')
  await page.getByRole('button', { name: 'Submit Order' }).click()
  await expect(page.getByRole('alert')).toHaveText('Please select your department.')
  await expect(page.getByLabel('Department', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  await page.getByLabel('Department', { exact: true }).selectOption(departments[0])
  await page.getByLabel('Full name').fill('Student Test')
  await page.getByLabel('University ID').fill('ID-987')
  await page.getByLabel('Email', { exact: true }).fill('test@example.com')
  await page.getByRole('combobox', { name: 'Meal 1', exact: true }).selectOption('burgers')
  await page.getByLabel('Burger 1').selectOption('Chicken')
  await page.getByLabel('Burger 2').selectOption('Meat')
  await page.screenshot({ path: 'test-results/student-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/student-mobile.png', fullPage: true })
  await page.getByRole('button', { name: 'Submit Order' }).click()
  await expect(page.getByRole('alert')).toContainText('Could not reach the server')
  state.failSubmit = false
  await page.getByRole('button', { name: 'Submit Order' }).click()
  await expect(page.getByRole('heading', { name: 'Order received' })).toBeVisible()
  await expect(page.locator('svg')).toHaveCount(0)
  expect(state.submitted).toBe(2)
})

test('payment email failure is visible and retry preserves the paid ticket', async ({ page }) => {
  const state = await mockApi(page)
  state.failEmail = true
  await page.goto('/admin/')
  await page.getByRole('button', { name: /Karim Test/ }).click()
  await page.getByRole('button', { name: 'Mark as paid', exact: true }).click()
  await expect(page.getByText('Payment saved. Brevo unavailable.')).toBeVisible()
  const key = state.orders[1].ticket_key
  await expect(page.getByRole('button', { name: 'Undo paid', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Retry ticket email' }).click()
  await expect(page.getByText('Ticket email accepted by Brevo.')).toBeVisible()
  expect(state.orders[1].ticket_key).toBe(key)
})
