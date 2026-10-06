/** Un transat sur le plan. Le numéro est fixe ; la paire se déduit du numéro (1-2, 3-4, …). */
export type Sunbed = { n: number; x: number; y: number; r: number }

/**
 * pending   : demande du client, en attente de confirmation par le club (aucun transat attribué)
 * confirmed : confirmée par le club, transats attribués
 * arrived   : client installé
 * refused / cancelled / no_show : n'occupent plus de transat
 */
export type ReservationStatus = 'pending' | 'confirmed' | 'arrived' | 'no_show' | 'cancelled' | 'refused'

export type Reservation = {
  id: string
  date: string
  quantity: number
  status: ReservationStatus
  source: 'web' | 'manual'
  name: string
  phone: string
  sunbeds: number[]
  createdAt: string
}

export type DayData = { date: string; reservations: Reservation[]; blocked: number[] }

export type NewReservation = {
  date: string
  quantity: number
  name: string
  phone: string
  /** Transat de départ choisi sur le plan par le pro. */
  preferred?: number
}

/**
 * Contrat de l'espace pro. L'interface ne connaît que ces fonctions :
 * l'adaptateur de démonstration et l'adaptateur Supabase l'implémentent tous les deux.
 */
export interface ProApi {
  mode: 'demo' | 'live'
  getSession(): Promise<{ email: string } | null>
  signIn(email: string, password: string): Promise<void>
  signOut(): Promise<void>
  getLayout(): Promise<Sunbed[]>
  saveLayout(layout: Sunbed[]): Promise<void>
  getDay(date: string): Promise<DayData>
  /** Toutes les demandes en attente, à partir d'aujourd'hui, tous jours confondus. */
  listPending(): Promise<Reservation[]>
  /** Réservation saisie par le club : confirmée d'office. */
  createReservation(input: NewReservation): Promise<Reservation>
  /** Confirme une demande et lui attribue ses transats (à partir de `preferred` si le club l'a choisi). */
  confirm(id: string, preferred?: number): Promise<void>
  setStatus(id: string, status: ReservationStatus): Promise<void>
  moveSunbed(id: string, from: number, to: number): Promise<void>
  setBlocked(date: string, n: number, blocked: boolean): Promise<void>
}

/** Ce que le site public a le droit de faire : envoyer une demande, rien d'autre. */
export interface PublicApi {
  requestReservation(input: Omit<NewReservation, 'preferred'>): Promise<void>
}

export const TOTAL_SUNBEDS = 50
export const partnerOf = (n: number) => (n % 2 ? n + 1 : n - 1)
export const holdsSunbeds = (s: ReservationStatus) => s === 'confirmed' || s === 'arrived'
