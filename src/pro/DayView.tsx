import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { formatLong, todayInParis } from '../lib/dates'
import {
  TOTAL_SUNBEDS,
  holdsSunbeds,
  type DayData,
  type ProApi,
  type Reservation,
  type ReservationStatus,
  type Sunbed,
} from '../lib/api/types'
import PlanCanvas, { Legend, type BedState } from './PlanCanvas'
import { Button, errorMessage } from './ui'

const statusLabel: Record<ReservationStatus, string> = {
  confirmed: 'Attendu',
  arrived: 'Arrivé',
  no_show: 'Absent',
  cancelled: 'Annulée',
}
const statusPill: Record<ReservationStatus, string> = {
  confirmed: 'bg-petrol-900 text-cream',
  arrived: 'bg-ok text-white',
  no_show: 'bg-off text-petrol-950',
  cancelled: 'bg-off text-petrol-950',
}

const shiftDay = (iso: string, delta: number) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + delta, 12)).toISOString().slice(0, 10)
}

type Panel =
  | { kind: 'list' }
  | { kind: 'bed'; n: number }
  | { kind: 'reservation'; id: string }
  | { kind: 'new'; preferred?: number }
  | { kind: 'move'; id: string; from: number }

export default function DayView({ api, layout }: { api: ProApi; layout: Sunbed[] }) {
  const today = useMemo(() => todayInParis(), [])
  const [date, setDate] = useState(today)
  const [day, setDay] = useState<DayData | null>(null)
  const [panel, setPanel] = useState<Panel>({ kind: 'list' })
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const refresh = useCallback(async () => {
    try {
      setDay(await api.getDay(date))
    } catch (e) {
      setError(errorMessage(e))
    }
  }, [api, date])

  useEffect(() => {
    setDay(null)
    setPanel({ kind: 'list' })
    setError(null)
    void refresh()
  }, [refresh])

  /** Exécute une action, affiche l'erreur éventuelle, puis recharge la journée. */
  const run = async (action: () => Promise<unknown>, then?: Panel) => {
    setError(null)
    try {
      await action()
      if (then) setPanel(then)
    } catch (e) {
      setError(errorMessage(e))
    }
    await refresh()
  }

  const active = useMemo(() => (day?.reservations ?? []).filter((r) => holdsSunbeds(r.status)), [day])
  const byBed = useMemo(() => {
    const map = new Map<number, Reservation>()
    active.forEach((r) => r.sunbeds.forEach((n) => map.set(n, r)))
    return map
  }, [active])
  const blocked = useMemo(() => new Set(day?.blocked ?? []), [day])

  const stateOf = (n: number): BedState => {
    const r = byBed.get(n)
    if (r) return r.status === 'arrived' ? 'arrived' : 'reserved'
    return blocked.has(n) ? 'blocked' : 'free'
  }

  const reservedCount = byBed.size
  const freeCount = TOTAL_SUNBEDS - reservedCount - blocked.size
  const current =
    panel.kind === 'reservation' || panel.kind === 'move'
      ? day?.reservations.find((r) => r.id === panel.id)
      : undefined

  const selected = useMemo(() => {
    if (panel.kind === 'bed') return new Set([panel.n])
    if (panel.kind === 'move') return new Set([panel.from])
    if (current) return new Set(holdsSunbeds(current.status) ? current.sunbeds : [])
    return new Set<number>()
  }, [panel, current])

  const targets = useMemo(() => {
    if (panel.kind !== 'move') return undefined
    const free = new Set<number>()
    for (let n = 1; n <= TOTAL_SUNBEDS; n++) if (!byBed.has(n) && !blocked.has(n)) free.add(n)
    return free
  }, [panel, byBed, blocked])

  const onBed = (n: number) => {
    if (panel.kind === 'move') {
      if (targets?.has(n)) {
        void run(() => api.moveSunbed(panel.id, panel.from, n), { kind: 'reservation', id: panel.id })
      }
      return
    }
    const r = byBed.get(n)
    setError(null)
    setPanel(r ? { kind: 'reservation', id: r.id } : { kind: 'bed', n })
  }

  const filtered = (day?.reservations ?? [])
    .filter((r) => `${r.name} ${r.phone}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => Number(!holdsSunbeds(a.status)) - Number(!holdsSunbeds(b.status)) || a.name.localeCompare(b.name, 'fr'))

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" aria-label="Jour précédent" onClick={() => setDate(shiftDay(date, -1))} className="px-4">
            ←
          </Button>
          <label className="sr-only" htmlFor="pro-date">
            Jour affiché
          </label>
          <input
            id="pro-date"
            type="date"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="min-h-11 rounded-full border-2 border-petrol-900 bg-white px-4 text-base font-semibold text-petrol-950"
          />
          <Button variant="outline" aria-label="Jour suivant" onClick={() => setDate(shiftDay(date, 1))} className="px-4">
            →
          </Button>
          {date !== today && (
            <Button variant="ghost" onClick={() => setDate(today)}>
              Aujourd'hui
            </Button>
          )}
        </div>

        <h2 className="mt-4 font-display text-3xl leading-tight text-petrol-900 first-letter:uppercase">
          {formatLong(date)}
        </h2>
        <p className="mt-1 text-lg text-petrol-950/80" aria-live="polite">
          <strong className="font-semibold text-petrol-950">{reservedCount}</strong> réservé{reservedCount > 1 ? 's' : ''},{' '}
          <strong className="font-semibold text-petrol-950">{freeCount}</strong> libre{freeCount > 1 ? 's' : ''}
          {blocked.size > 0 && (
            <>
              , <strong className="font-semibold text-petrol-950">{blocked.size}</strong> bloqué{blocked.size > 1 ? 's' : ''}
            </>
          )}{' '}
          sur {TOTAL_SUNBEDS}.
        </p>

        <div className="mt-4">
          <PlanCanvas
            layout={layout}
            stateOf={stateOf}
            selected={selected}
            targets={targets}
            onActivate={onBed}
            label={`Plan des transats du ${formatLong(date)}`}
          />
        </div>
        <div className="mt-3">
          <Legend />
        </div>
      </div>

      <aside className="min-w-0 self-start rounded-3xl bg-white p-5 ring-1 ring-petrol-900/15 lg:sticky lg:top-4">
        {error && (
          <p role="alert" className="mb-4 rounded-2xl bg-danger/10 px-4 py-3 text-base font-medium text-danger">
            {error}
          </p>
        )}

        {panel.kind === 'list' && (
          <>
            <Button variant="primary" className="w-full" onClick={() => setPanel({ kind: 'new' })}>
              Nouvelle réservation
            </Button>
            <label htmlFor="pro-recherche" className="mt-5 block text-sm font-semibold">
              Réservations du jour
            </label>
            <input
              id="pro-recherche"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nom ou téléphone"
              className="mt-2 min-h-11 w-full rounded-full border-2 border-petrol-900/25 bg-white px-4 text-base focus:border-petrol-900"
            />
            {!day ? (
              <p className="mt-4 text-petrol-950/70">Chargement…</p>
            ) : filtered.length === 0 ? (
              <p className="mt-4 text-petrol-950/70">
                {query ? 'Aucune réservation ne correspond.' : 'Aucune réservation ce jour-là. Touchez un transat ou créez une réservation.'}
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-petrol-900/10">
                {filtered.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setPanel({ kind: 'reservation', id: r.id })}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl px-2 py-3 text-left hover:bg-petrol-900/5 ${holdsSunbeds(r.status) ? '' : 'opacity-60'}`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{r.name}</span>
                        <span className="block text-sm text-petrol-950/70 tabular-nums">
                          {holdsSunbeds(r.status) ? `Transats ${r.sunbeds.join(', ')}` : `${r.quantity} transat${r.quantity > 1 ? 's' : ''}`}
                        </span>
                      </span>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${statusPill[r.status]}`}>
                        {statusLabel[r.status]}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {panel.kind === 'bed' && (
          <>
            <PanelTitle onBack={() => setPanel({ kind: 'list' })}>Transat {panel.n}</PanelTitle>
            {blocked.has(panel.n) ? (
              <>
                <p className="mt-2 text-petrol-950/80">Bloqué pour ce jour. Il n'est pas proposé à la réservation.</p>
                <Button className="mt-5 w-full" onClick={() => run(() => api.setBlocked(date, panel.n, false))}>
                  Débloquer
                </Button>
              </>
            ) : (
              <>
                <p className="mt-2 text-petrol-950/80">Libre ce jour-là.</p>
                <div className="mt-5 grid gap-3">
                  <Button variant="primary" onClick={() => setPanel({ kind: 'new', preferred: panel.n })}>
                    Réserver ici
                  </Button>
                  <Button variant="outline" onClick={() => run(() => api.setBlocked(date, panel.n, true))}>
                    Bloquer pour ce jour
                  </Button>
                </div>
              </>
            )}
          </>
        )}

        {panel.kind === 'new' && (
          <NewReservationForm
            date={date}
            preferred={panel.preferred}
            maxQuantity={Math.max(1, Math.min(8, freeCount))}
            onCancel={() => setPanel({ kind: 'list' })}
            onSubmit={async (input) => {
              const box: { created?: Reservation } = {}
              await run(async () => {
                box.created = await api.createReservation({ ...input, date, preferred: panel.preferred })
              })
              if (box.created) setPanel({ kind: 'reservation', id: box.created.id })
            }}
          />
        )}

        {panel.kind === 'move' && current && (
          <>
            <PanelTitle onBack={() => setPanel({ kind: 'reservation', id: current.id })}>
              Déplacer le transat {panel.from}
            </PanelTitle>
            <p className="mt-2 text-petrol-950/80">
              Touchez un transat libre sur le plan. Ils sont entourés en jaune.
            </p>
            <Button variant="outline" className="mt-5 w-full" onClick={() => setPanel({ kind: 'reservation', id: current.id })}>
              Ne pas déplacer
            </Button>
          </>
        )}

        {panel.kind === 'reservation' && current && (
          <ReservationCard
            key={current.id}
            reservation={current}
            onBack={() => setPanel({ kind: 'list' })}
            onStatus={(status) => run(() => api.setStatus(current.id, status))}
            onMove={(from) => setPanel({ kind: 'move', id: current.id, from })}
          />
        )}
      </aside>
    </div>
  )
}

function PanelTitle({ children, onBack }: { children: ReactNode; onBack: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <h3 className="font-display text-2xl leading-tight text-petrol-900">{children}</h3>
      <button type="button" onClick={onBack} className="shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold text-petrol-900 hover:bg-petrol-900/10">
        Fermer
      </button>
    </div>
  )
}

function ReservationCard({
  reservation: r,
  onBack,
  onStatus,
  onMove,
}: {
  reservation: Reservation
  onBack: () => void
  onStatus: (s: ReservationStatus) => void
  onMove: (from: number) => void
}) {
  const [confirmCancel, setConfirmCancel] = useState(false)
  const holding = holdsSunbeds(r.status)

  return (
    <>
      <PanelTitle onBack={onBack}>{r.name}</PanelTitle>
      <p className="mt-2">
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusPill[r.status]}`}>{statusLabel[r.status]}</span>
      </p>
      <dl className="mt-4 divide-y divide-petrol-900/10 border-y border-petrol-900/10 text-base">
        <div className="flex justify-between gap-4 py-2.5">
          <dt className="text-petrol-950/70">Téléphone</dt>
          <dd className="font-semibold tabular-nums">
            {r.phone ? <a href={`tel:${r.phone.replace(/\s/g, '')}`}>{r.phone}</a> : 'Non renseigné'}
          </dd>
        </div>
        <div className="flex justify-between gap-4 py-2.5">
          <dt className="text-petrol-950/70">Origine</dt>
          <dd className="font-semibold">{r.source === 'web' ? 'Site' : 'Saisie par le club'}</dd>
        </div>
        <div className="flex justify-between gap-4 py-2.5">
          <dt className="text-petrol-950/70">Transats</dt>
          <dd className="font-semibold tabular-nums">{r.quantity}</dd>
        </div>
      </dl>

      {holding && (
        <>
          <p className="mt-4 text-sm font-semibold">Changer un transat de place</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {r.sunbeds.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onMove(n)}
                aria-label={`Déplacer le transat ${n}`}
                className="min-h-11 min-w-11 rounded-xl border-2 border-petrol-900 px-3 text-base font-bold tabular-nums text-petrol-900 hover:bg-petrol-900 hover:text-cream"
              >
                {n}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="mt-6 grid gap-3">
        {r.status === 'confirmed' && (
          <Button variant="primary" onClick={() => onStatus('arrived')}>
            Marquer arrivé
          </Button>
        )}
        {r.status === 'arrived' && (
          <Button variant="outline" onClick={() => onStatus('confirmed')}>
            Annuler l'arrivée
          </Button>
        )}
        {r.status === 'confirmed' && (
          <Button variant="outline" onClick={() => onStatus('no_show')}>
            Marquer absent
          </Button>
        )}
        {holding &&
          (confirmCancel ? (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="danger" onClick={() => onStatus('cancelled')}>
                Oui, annuler
              </Button>
              <Button variant="ghost" onClick={() => setConfirmCancel(false)}>
                Non, garder
              </Button>
            </div>
          ) : (
            <Button variant="danger" onClick={() => setConfirmCancel(true)}>
              Annuler la réservation
            </Button>
          ))}
        {!holding && (
          <>
            <p className="text-petrol-950/80">
              Ses transats ({r.sunbeds.join(', ')}) sont de nouveau libres.
            </p>
            <Button variant="outline" onClick={() => onStatus('confirmed')}>
              Rétablir la réservation
            </Button>
          </>
        )}
      </div>
    </>
  )
}

function NewReservationForm({
  date,
  preferred,
  maxQuantity,
  onCancel,
  onSubmit,
}: {
  date: string
  preferred?: number
  maxQuantity: number
  onCancel: () => void
  onSubmit: (input: { name: string; phone: string; quantity: number }) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [quantity, setQuantity] = useState(Math.min(2, maxQuantity))
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || busy) return
    setBusy(true)
    await onSubmit({ name, phone, quantity })
    setBusy(false)
  }

  const field = 'mt-1 min-h-11 w-full rounded-2xl border-2 border-petrol-900/25 bg-white px-4 text-base focus:border-petrol-900'

  return (
    <form onSubmit={submit}>
      <PanelTitle onBack={onCancel}>Nouvelle réservation</PanelTitle>
      <p className="mt-1 text-petrol-950/80 first-letter:uppercase">
        {formatLong(date)}
        {preferred !== undefined && `, à partir du transat ${preferred}`}.
      </p>

      <label htmlFor="resa-nom" className="mt-4 block text-sm font-semibold">
        Nom
      </label>
      <input id="resa-nom" required autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} className={field} />

      <label htmlFor="resa-tel" className="mt-4 block text-sm font-semibold">
        Téléphone <span className="font-normal text-petrol-950/60">(facultatif)</span>
      </label>
      <input id="resa-tel" type="tel" inputMode="tel" autoComplete="off" value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />

      <div className="mt-4 flex items-center justify-between gap-3">
        <span id="resa-qte-label" className="text-sm font-semibold">
          Transats
        </span>
        <div role="group" aria-labelledby="resa-qte-label" className="flex items-center gap-2">
          <Button id="resa-moins" aria-label="Un transat de moins" disabled={quantity <= 1} onClick={() => setQuantity((q) => q - 1)} className="px-4 text-xl">
            −
          </Button>
          <output id="resa-qte" aria-live="polite" className="w-8 text-center font-display text-2xl tabular-nums">
            {quantity}
          </output>
          <Button id="resa-plus" aria-label="Un transat de plus" disabled={quantity >= maxQuantity} onClick={() => setQuantity((q) => q + 1)} className="px-4 text-xl">
            +
          </Button>
        </div>
      </div>

      <Button type="submit" variant="primary" disabled={busy || !name.trim()} className="mt-6 w-full">
        Créer la réservation
      </Button>
    </form>
  )
}

