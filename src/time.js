export const TIME_ZONE = 'Asia/Beirut'

export function formatDeadline(iso) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

export function deadlineInputs(iso) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(iso))
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return { date: `${values.year}-${values.month}-${values.day}`, time: `${values.hour}:${values.minute}` }
}
