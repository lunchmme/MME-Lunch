export function extractTicketKey(value) {
  let url
  try { url = new URL(value.trim()) } catch { throw new Error('Scan a ticket QR code or paste its full ticket link.') }
  if (!['http:', 'https:'].includes(url.protocol) || !/\/admin\/checkout\/?$/.test(url.pathname)) {
    throw new Error('This QR code is not an MME Lunch ticket link.')
  }
  const keys = url.searchParams.getAll('key')
  if (keys.length !== 1 || !/^[A-Za-z0-9_-]{8,100}$/.test(keys[0])) {
    throw new Error('The ticket link has a missing or invalid key.')
  }
  return keys[0]
}
