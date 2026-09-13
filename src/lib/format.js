const currencyFormatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  maximumFractionDigits: 0,
})

const dayFormatter = new Intl.DateTimeFormat('tr-TR', { weekday: 'long' })
const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})
const shortDateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})
const timeFormatter = new Intl.DateTimeFormat('tr-TR', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

function capitalize(text) {
  return text.charAt(0).toLocaleUpperCase('tr-TR') + text.slice(1)
}

export function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0)
}

export function formatDayName(date) {
  return capitalize(dayFormatter.format(date))
}

export function formatDateLong(date) {
  return capitalize(dateFormatter.format(date))
}

export function formatDateShort(value) {
  return shortDateFormatter.format(new Date(value))
}

export function formatTime(date) {
  return timeFormatter.format(date)
}
