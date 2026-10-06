import { todayInParis, upcomingDays } from '../dates'
import { allocate } from './allocate'
import { defaultLayout } from './defaultLayout'
import {
  TOTAL_SUNBEDS,
  holdsSunbeds,
  type DayData,
  type ProApi,
  type PublicApi,
  type Reservation,
  type Sunbed,
} from './types'

/**
 * Adaptateur de démonstration : aucune base, aucune vraie connexion.
 * Les données restent dans le navigateur. Activé uniquement avec VITE_DEMO=true.
 */

type State = { layout: Sunbed[]; reservations: Reservation[]; blocked: Record<string, number[]> }
const KEY = 'gondolys-demo-v2'
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
      { ...make(9, today, 'Nina Costa', []), quantity: 2, status: 'pending' },
      { ...make(10, tomorrow, 'Hugo Bonet', []), quantity: 4, status: 'pending' },
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

// Rien n'est lu au chargement du module : sans mode démo, ce fichier disparaît du build.
let loaded: State | null = null
const st = (): State => (loaded ??= load())

let session: boolean | null = null
function isSignedIn(): boolean {
  if (session === null) {
    try {
      session = sessionStorage.getItem(SESSION_KEY) === '1'
    } catch {
      session = false
    }
  }
  return session
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(st()))
  } catch {
    /* idem */
  }
}

function freeOn(date: string, ignoreId?: string): Set<number> {
  const free = new Set(Array.from({ length: TOTAL_SUNBEDS }, (_, i) => i + 1))
  for (const n of st().blocked[date] ?? []) free.delete(n)
  for (const r of st().reservations) {
    if (r.date === date && r.id !== ignoreId && holdsSunbeds(r.status)) {
      r.sunbeds.forEach((n) => free.delete(n))
    }
  }
  return free
}

const find = (id: string) => {
  const r = st().reservations.find((x) => x.id === id)
  if (!r) throw new Error('Réservation introuvable.')
  return r
}

const copy = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T

export const demoApi: ProApi = {
  mode: 'demo',

  async getSession() {
    return isSignedIn() ? { email: 'démo' } : null
  },
  async signIn() {
    session = true
    try {
      sessionStorage.setItem(SESSION_KEY, '1')
    } catch {
      /* idem */
    }
  },
  async signOut() {
    session = false
    try {
      sessionStorage.removeItem(SESSION_KEY)
    } catch {
      /* idem */
    }
  },

  async getLayout() {
    return copy(st().layout)
  },
  async saveLayout(layout) {
    st().layout = copy(layout)
    persist()
  },

  async getDay(date): Promise<DayData> {
    return copy({
      date,
      reservations: st().reservations.filter((r) => r.date === date),
      blocked: st().blocked[date] ?? [],
    })
  },

  async listPending() {
    const today = todayInParis()
    return copy(
      st().reservations
        .filter((r) => r.status === 'pending' && r.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)),
    )
  },

  async confirm(id, preferred) {
    const r = find(id)
    if (r.status !== 'pending') throw new Error("Cette demande n'est plus en attente.")
    const sunbeds = allocate(r.quantity, freeOn(r.date), preferred)
    if (!sunbeds) throw new Error(`Plus assez de transats libres pour ${r.quantity} personnes ce jour-là.`)
    r.sunbeds = sunbeds
    r.status = 'confirmed'
    persist()
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
    st().reservations.push(reservation)
    persist()
    return copy(reservation)
  },

  async setStatus(id, status) {
    const r = find(id)
    if (holdsSunbeds(status) && !holdsSunbeds(r.status)) {
      const free = freeOn(r.date)
      if (r.sunbeds.length === 0 || !r.sunbeds.every((n) => free.has(n))) {
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
    const current = new Set(st().blocked[date] ?? [])
    if (blocked) {
      if (!freeOn(date).has(n)) throw new Error(`Le transat ${n} est réservé ce jour-là.`)
      current.add(n)
    } else current.delete(n)
    st().blocked[date] = [...current].sort((a, b) => a - b)
    persist()
  },
}

const digits = (phone: string) => phone.replace(/\D/g, '')

export const demoPublicApi: PublicApi = {
  async requestReservation({ date, quantity, name, phone }) {
    // Une seule demande par personne et par jour : ici la personne est reconnue à son téléphone,
    // en attendant l'authentification du client.
    const already = st().reservations.some(
      (r) =>
        r.date === date &&
        digits(r.phone) === digits(phone) &&
        (r.status === 'pending' || holdsSunbeds(r.status)),
    )
    if (already) throw new Error('Vous avez déjà une demande pour ce jour-là.')
    st().reservations.push({
      id: `d-${Date.now().toString(36)}`,
      date,
      quantity,
      status: 'pending',
      source: 'web',
      name: name.trim(),
      phone: phone.trim(),
      sunbeds: [],
      createdAt: new Date().toISOString(),
    })
    persist()
  },
}

/** Remet les données d'exemple. */
export function resetDemo() {
  loaded = seed()
  persist()
}
