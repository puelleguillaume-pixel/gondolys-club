const partner = (n: number) => (n % 2 ? n + 1 : n - 1)

/**
 * Choisit les transats d'une réservation parmi les transats libres.
 * - 2 transats : une paire entière.
 * - 3 ou 4 : des paires voisines.
 * - 1 seul (ou le transat impair d'un groupe) : un transat déjà isolé, pour ne pas casser une paire.
 * Renvoie null s'il n'y a plus assez de place.
 * La RPC de réservation côté base devra appliquer exactement la même règle.
 */
export function allocate(quantity: number, free: Set<number>, preferred?: number): number[] | null {
  if (quantity < 1 || free.size < quantity) return null
  const sorted = [...free].sort((a, b) => a - b)

  if (preferred !== undefined && free.has(preferred)) {
    const rank = (n: number) =>
      n === preferred ? -2 : n === partner(preferred) ? -1 : Math.abs(n - preferred)
    return [...sorted]
      .sort((a, b) => rank(a) - rank(b))
      .slice(0, quantity)
      .sort((a, b) => a - b)
  }

  const isolated = sorted.filter((n) => !free.has(partner(n)))
  const fullPairs = sorted.filter((n) => n % 2 === 1 && free.has(n + 1)).map((n) => (n + 1) / 2)
  const bedsOf = (pairs: number[]) => pairs.flatMap((p) => [2 * p - 1, 2 * p])

  /** Première suite de `k` paires libres consécutives, sinon les `k` premières paires libres. */
  const pickPairs = (k: number): number[] | null => {
    if (k === 0) return []
    if (fullPairs.length < k) return null
    for (let i = 0; i + k <= fullPairs.length; i++) {
      if (fullPairs[i + k - 1] === fullPairs[i] + k - 1) return fullPairs.slice(i, i + k)
    }
    return fullPairs.slice(0, k)
  }

  const odd = quantity % 2 === 1
  if (odd && isolated.length > 0) {
    const pairs = pickPairs((quantity - 1) / 2)
    if (pairs) {
      const beds = bedsOf(pairs)
      const anchor = beds[0] ?? isolated[0]
      const single = [...isolated].sort((a, b) => Math.abs(a - anchor) - Math.abs(b - anchor))[0]
      return [...beds, single].sort((a, b) => a - b)
    }
  }

  const pairs = pickPairs(Math.ceil(quantity / 2))
  if (pairs) return bedsOf(pairs).slice(0, quantity)

  // Plus assez de paires entières : on complète avec les transats isolés.
  return [...bedsOf(fullPairs), ...isolated].slice(0, quantity).sort((a, b) => a - b)
}
