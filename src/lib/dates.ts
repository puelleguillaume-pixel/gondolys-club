const TZ = 'Europe/Paris'

/** Date du jour à Paris, au format AAAA-MM-JJ, quel que soit le fuseau du visiteur. */
export function todayInParis(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(now)
}

/** Les `count` prochains jours à partir d'aujourd'hui (inclus), au format AAAA-MM-JJ. */
export function upcomingDays(count: number, from: string = todayInParis()): string[] {
  const [y, m, d] = from.split('-').map(Number)
  return Array.from({ length: count }, (_, i) =>
    new Date(Date.UTC(y, m - 1, d + i, 12)).toISOString().slice(0, 10),
  )
}

// Les dates AAAA-MM-JJ sont manipulées à midi UTC : aucun décalage de jour possible.
const asDate = (iso: string) => new Date(`${iso}T12:00:00Z`)
const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', ...opts })

const weekdayShort = fmt({ weekday: 'short' })
const longDate = fmt({ weekday: 'long', day: 'numeric', month: 'long' })

export const weekdayIndex = (iso: string) => asDate(iso).getUTCDay()
export const dayNumber = (iso: string) => asDate(iso).getUTCDate()
export const shortWeekday = (iso: string) => weekdayShort.format(asDate(iso)).replace('.', '')
export const formatLong = (iso: string) => longDate.format(asDate(iso))
