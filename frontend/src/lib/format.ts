const LOCALE = 'pt-BR'

const relativeFormatter = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' })
const shortDateFormatter = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' })
const shortDateWithYearFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const fullDateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: 'long',
  timeStyle: 'short',
})
const monthYearFormatter = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' })

const MINUTE = 60
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** "agora", "há 5 minutos", "ontem", "há 3 dias" ou uma data curta ("12 de set."). */
export function formatRelativeTime(isoDate: string, now: Date = new Date()): string {
  const date = new Date(isoDate)
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000)

  // Math.floor: 59 min e 50 s ainda é "há 59 minutos" (e nunca "há 60 minutos").
  if (seconds < 45) return 'agora'
  if (seconds < MINUTE) return relativeFormatter.format(-1, 'minute')
  if (seconds < HOUR) return relativeFormatter.format(-Math.floor(seconds / MINUTE), 'minute')
  if (seconds < DAY) return relativeFormatter.format(-Math.floor(seconds / HOUR), 'hour')
  if (seconds < 7 * DAY) return relativeFormatter.format(-Math.floor(seconds / DAY), 'day')

  const sameYear = date.getFullYear() === now.getFullYear()
  return (sameYear ? shortDateFormatter : shortDateWithYearFormatter).format(date)
}

/** "27 de setembro de 2026 às 15:30" (usado em tooltips). */
export function formatDateTime(isoDate: string): string {
  return fullDateTimeFormatter.format(new Date(isoDate))
}

/** "setembro de 2026" (ex.: "Membro desde setembro de 2026"). */
export function formatMonthYear(isoDate: string): string {
  return monthYearFormatter.format(new Date(isoDate))
}

/** "1 membro", "2 membros"... */
export function pluralize(count: number, singular: string, plural: string): string {
  return `${count.toLocaleString(LOCALE)} ${count === 1 ? singular : plural}`
}
