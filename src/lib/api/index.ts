import { demoApi, demoPublicApi } from './demo'
import type { ProApi, PublicApi } from './types'

/**
 * L'espace pro n'est disponible que si un back est configuré.
 * - VITE_DEMO=true : données d'exemple dans le navigateur (développement et démonstration).
 * - Sinon : l'adaptateur Supabase sera branché ici. Tant qu'il ne l'est pas, /pro reste fermé.
 */
const demo = import.meta.env.VITE_DEMO === 'true'

export const api: ProApi | null = demo ? demoApi : null

/** Envoi des demandes depuis le site. Sans back, le site renvoie vers le téléphone du club. */
export const publicApi: PublicApi | null = demo ? demoPublicApi : null
export const isDemo = demo
