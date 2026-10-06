import { todayInParis, upcomingDays } from '../dates'
import { allocate } from './allocate'
import { defaultLayout } from './defaultLayout'
import {
  TOTAL_SUNBEDS,
  holdsSunbeds,
  type DayData,
  type ProApi,
  type Reservation,
  type Sunbed,
} from './types'

/**
 * Adaptateur de démonstration : aucune base, aucune vraie connexion.
 * Les données restent dans le navigateur. Activé uniquement avec VITE_DEMO=true.
 */

type State = { layout: Sunbed[]; reservations: Reservation[]; blocked: Record<string, number[]> }
const KEY = 'gondolys-demo-v1'
const SESSION_KEY = 'gondolys-demo-session'

function seed(): State {
  const [today, tomorrow] = upcomingDays(2, todayInParis())
  const make = (
    i: number,
    date: string,
    name: string,
    sunbeds: number[],
    status: Reservation['status'] = 'confirmed',
    source: Reservation['source'] = 'web',
  ): Reservation => ({
    id: `ex-${i}`,
    date,
    quantity: sunbeds.length,
    status,
    source,
    name,
    phone: `06 00 00 00 ${String(i).padStart(2, '0')}`,
    sunbeds,
    createdAt: new Date().toISOString(),
  })
  return {
    layout: defaultLayout(),
    reservations: [
      make(1, today, 'Famille Roca', [1, 2, 3, 4], 'arrived'),
      make(2, today, 'Julie Marty', [5, 6]),
      make(3, today, 'Thomas Vidal', [11, 12], 'arrived', 'manual'),
      make(4, today, 'Sophie Blanc', [13]),
      make(5, today, 'Marc Puig', [21, 22, 23]),
      make(6, today, 'Léa Fabre', [31, 32], 'cancelled'),
      make(7, tomorrow, 'Paul Soler', [1, 2]),
      make(8, tomorrow, 'Emma Coste', [3, 4, 5, 6]),
    ],
    blocked: { [today]: [50] },
  }
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as State
  } catch {
    /* stockage indisponible : on repart des exemples */
  }
  return seed()
}

let state = load()
let signedIn = false
try {
  signedIn = sessionStorage.getItem(SESSION_KEY) === '1'
} catch {
  /* idem */
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* idem */
  }
}

function freeOn(date: string, ignoreId?: string): Set<number> {
  const free = new Set(Array.from({ length: TOTAL_SUNBEDS }, (_, i) => i + 1))
  for (const n of state.blocked[date] ?? []) free.delete(n)
  for (const r of state.reservations) {
    if (r.date === date && r.id !== ignoreId && holdsSunbeds(r.status)) {
      r.sunbeds.forEach((n) => free.delete(n))
    }
  }
  return free
}

const find = (id: string) => {
  const r = state.reservations.find((x) => x.id === id)
  if (!r) throw new Error('Réservation introuvable.')
  return r
}

const copy = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T

export const demoApi: ProApi = {
  mode: 'demo',

  async getSession() {
    return signedIn ? { email: 'démo' } : null
  },
  async signIn() {
    signedIn = true
    try {
      sessionStorage.setItem(SESSION_KEY, '1')
    } catch {
      /* idem */
    }
  },
  async signOut() {
    signedIn = false
    try {
      sessionStorage.removeItem(SESSION_KEY)
    } catch {
      /* idem */
    }
  },

  async getLayout() {
    return copy(state.layout)
  },
  async saveLayout(layout) {
    state.layout = copy(layout)
    persist()
  },

  async getDay(date): Promise<DayData> {
    return copy({
      date,
      reservations: state.reservations.filter((r) => r.date === date),
      blocked: state.blocked[date] ?? [],
    })
  },

  async createReservation({ date, quantity, name, phone, preferred }) {
    const sunbeds = allocate(quantity, freeOn(date), preferred)
    if (!sunbeds) throw new Error('Plus assez de transats libres ce jour-là.')
    const reservation: Reservation = {
      id: `r-${Date.now().toString(36)}`,
      date,
      quantity,
      status: 'confirmed',
      source: 'manual',
      name: name.trim(),
      phone: phone.trim(),
      sunbeds,
      createdAt: new Date().toISOString(),
    }
    state.reservations.push(reservation)
    persist()
    return copy(reservation)
  },

  async setStatus(id, status) {
    const r = find(id)
    if (holdsSunbeds(status) && !holdsSunbeds(r.status)) {
      const free = freeOn(r.date)
      if (!r.sunbeds.every((n) => free.has(n))) {
        throw new Error('Ces transats ont été réattribués depuis. Créez une nouvelle réservation.')
      }
    }
    r.status = status
    persist()
  },

  async moveSunbed(id, from, to) {
    const r = find(id)
    if (!r.sunbeds.includes(from)) throw new Error('Ce transat ne fait pas partie de la réservation.')
    if (!freeOn(r.date).has(to)) throw new Error(`Le transat ${to} n'est pas libre.`)
    r.sunbeds = r.sunbeds.map((n) => (n === from ? to : n)).sort((a, b) => a - b)
    persist()
  },

  async setBlocked(date, n, blocked) {
    const current = new Set(state.blocked[date] ?? [])
    if (blocked) {
      if (!freeOn(date).has(n)) throw new Error(`Le transat ${n} est réservé ce jour-là.`)
      current.add(n)
    } else current.delete(n)
    state.blocked[date] = [...current].sort((a, b) => a - b)
    persist()
  },
}

/** Remet les données d'exemple. */
export function resetDemo() {
  state = seed()
  persist()
}
