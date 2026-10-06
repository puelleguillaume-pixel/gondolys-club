import { demoApi } from './demo'
import type { ProApi } from './types'

/**
 * L'espace pro n'est disponible que si un back est configuré.
 * - VITE_DEMO=true : données d'exemple dans le navigateur (développement et démonstration).
 * - Sinon : l'adaptateur Supabase sera branché ici. Tant qu'il ne l'est pas, /pro reste fermé.
 */
export const api: ProApi | null = import.meta.env.VITE_DEMO === 'true' ? demoApi : null
