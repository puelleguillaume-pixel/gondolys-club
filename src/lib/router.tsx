import { useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from 'react'

/**
 * Routeur minimal : deux pages, pas besoin d'une dépendance.
 * VITE_ROUTER=memory garde la route en mémoire (aperçus embarqués où l'URL n'est pas modifiable).
 */
const memory = import.meta.env.VITE_ROUTER === 'memory'
let current = memory ? (location.hash === '#pro' ? '/pro' : '/') : location.pathname
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

if (!memory) {
  window.addEventListener('popstate', () => {
    current = location.pathname
    emit()
  })
}

export function navigate(to: string) {
  if (to === current) return
  current = to
  if (!memory) history.pushState(null, '', to)
  emit()
  window.scrollTo(0, 0)
}

export function useRoute(): string {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current,
  )
}

export function Link({ to, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    navigate(to)
  }
  return <a href={to} onClick={handle} {...rest} />
}
