/**
 * Toutes les informations du club sont ici.
 * Modifier ce fichier suffit pour mettre à jour le site.
 */

export type DayHours = { open: string; close: string }

export const club = {
  name: 'Gondolys Club',
  since: 1937,
  address: {
    street: 'Plage Centrale',
    postalCode: '66140',
    city: 'Canet-en-Roussillon',
  },
  phone: { display: '06 09 07 21 02', href: 'tel:+33609072102' },
  instagram: { handle: '@gondolysclub', url: 'https://www.instagram.com/gondolysclub/' },
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=Gondolys+Club+Plage+Centrale+66140+Canet-en-Roussillon',

  /** Horaires par jour de la semaine, 0 = dimanche. À CONFIRMER avec le club. */
  hours: {
    0: { open: '9h30', close: '20h' },
    1: { open: '9h30', close: '20h' },
    2: { open: '9h30', close: '20h' },
    3: { open: '9h30', close: '20h' },
    4: { open: '9h30', close: '2h' },
    5: { open: '9h30', close: '2h' },
    6: { open: '9h30', close: '2h' },
  } as Record<number, DayHours>,
  hoursSummary: [
    { days: 'Dimanche au mercredi', hours: '9h30 – 20h' },
    { days: 'Jeudi au samedi', hours: '9h30 – 2h' },
  ],
  seasonNote: 'Ouvert en saison',
} as const

export const booking = {
  /** Passe à true quand le back Supabase (auth + RPC de réservation) est branché. */
  onlineOpen: false,
  /** Nombre de jours proposés à partir d'aujourd'hui. */
  daysAhead: 14,
  /** Transats maximum par réservation. */
  maxPerBooking: 4,
  /** Prix d'un transat à la journée, en euros. null = non affiché. */
  pricePerSunbed: null as number | null,
  paymentOnSite: true,
} as const
