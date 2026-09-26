import test from 'node:test'
import assert from 'node:assert/strict'
import { extractTicketKey } from '../src/ticket.js'
import { deadlineInputs, formatDeadline } from '../src/time.js'

test('ticket parser accepts hosted subpaths and URL-safe keys', () => {
  assert.equal(extractTicketKey('https://example.com/lunch/admin/checkout/?key=abc_DEF-12345'), 'abc_DEF-12345')
})
test('ticket parser rejects unsafe protocols, unrelated URLs, duplicate or malformed keys', () => {
  for (const input of ['javascript:alert(1)', 'hello', 'https://example.com/?key=abc123456',
    'https://example.com/admin/checkout/', 'https://example.com/admin/checkout/?key=abc123456&key=second123',
    'https://example.com/admin/checkout/?key=..%2Fsecret']) assert.throws(() => extractTicketKey(input))
})
test('deadline display and inputs always use Beirut winter and summer time', () => {
  assert.deepEqual(deadlineInputs('2027-07-15T09:00:00Z'), { date: '2027-07-15', time: '12:00' })
  assert.deepEqual(deadlineInputs('2027-01-15T09:00:00Z'), { date: '2027-01-15', time: '11:00' })
  assert.match(formatDeadline('2027-07-15T09:00:00Z'), /12:00/)
})
