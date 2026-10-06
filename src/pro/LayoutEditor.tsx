import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type SVGProps } from 'react'
import { BOUNDS, defaultLayout } from '../lib/api/defaultLayout'
import { partnerOf, type ProApi, type Sunbed } from '../lib/api/types'
import PlanCanvas from './PlanCanvas'
import { Button, errorMessage } from './ui'

const GRID = 10
const snap = (v: number) => Math.round(v / GRID) * GRID
const same = (a: Sunbed[], b: Sunbed[]) => JSON.stringify(a) === JSON.stringify(b)

type Drag = { members: number[]; startX: number; startY: number; origin: Sunbed[]; last: Sunbed[] | null }

export default function LayoutEditor({
  api,
  layout,
  onSaved,
}: {
  api: ProApi
  layout: Sunbed[]
  onSaved: (layout: Sunbed[]) => void
}) {
  const [history, setHistory] = useState<Sunbed[][]>([layout])
  const [index, setIndex] = useState(0)
  const [draft, setDraft] = useState<Sunbed[] | null>(null)
  const [saved, setSaved] = useState(layout)
  const [byPair, setByPair] = useState(true)
  const [selected, setSelected] = useState<number[]>([])
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const drag = useRef<Drag | null>(null)

  const current = draft ?? history[index]
  const dirty = !same(history[index], saved)
  const selectedSet = useMemo(() => new Set(selected), [selected])

  const commit = (next: Sunbed[]) => {
    if (same(next, history[index])) return
    setHistory([...history.slice(0, index + 1), next])
    setIndex(index + 1)
    setMessage(null)
  }

  const membersOf = (n: number) => (byPair ? [n, partnerOf(n)] : [n])

  /** Déplace un groupe de transats sans les faire sortir de la plage. */
  const moved = (base: Sunbed[], members: number[], dx: number, dy: number): Sunbed[] => {
    const group = base.filter((b) => members.includes(b.n))
    const lead = group[0]
    let ddx = snap(lead.x + dx) - lead.x
    let ddy = snap(lead.y + dy) - lead.y
    for (const b of group) {
      ddx = Math.min(Math.max(ddx, BOUNDS.minX - b.x), BOUNDS.maxX - b.x)
      ddy = Math.min(Math.max(ddy, BOUNDS.minY - b.y), BOUNDS.maxY - b.y)
    }
    return base.map((b) => (members.includes(b.n) ? { ...b, x: b.x + ddx, y: b.y + ddy } : b))
  }

  const toPlan = (e: PointerEvent) => {
    const svg = svgRef.current!
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    return pt.matrixTransform(svg.getScreenCTM()!.inverse())
  }

  const bedProps = (n: number): SVGProps<SVGGElement> => ({
    style: { touchAction: 'none', cursor: 'grab' },
    onPointerDown: (e: PointerEvent<SVGGElement>) => {
      if (e.button !== 0) return
      e.currentTarget.setPointerCapture(e.pointerId)
      const p = toPlan(e)
      const members = membersOf(n)
      setSelected(members)
      drag.current = { members, startX: p.x, startY: p.y, origin: history[index], last: null }
    },
    onPointerMove: (e: PointerEvent<SVGGElement>) => {
      const d = drag.current
      if (!d) return
      const p = toPlan(e)
      const dx = p.x - d.startX
      const dy = p.y - d.startY
      if (!d.last && Math.hypot(dx, dy) < 4) return
      d.last = moved(d.origin, d.members, dx, dy)
      setDraft(d.last)
    },
    onPointerUp: () => {
      const d = drag.current
      drag.current = null
      if (d?.last) commit(d.last)
      setDraft(null)
    },
    onPointerCancel: () => {
      drag.current = null
      setDraft(null)
    },
    onKeyDown: (e: KeyboardEvent<SVGGElement>) => {
      const step = e.shiftKey ? 50 : GRID
      const delta: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      }
      const d = delta[e.key]
      if (!d) return
      e.preventDefault()
      const members = membersOf(n)
      setSelected(members)
      commit(moved(history[index], members, d[0], d[1]))
    },
  })

  /** Fait pivoter la sélection autour de son centre. */
  const rotate = (deg: number) => {
    const base = history[index]
    const group = base.filter((b) => selectedSet.has(b.n))
    if (!group.length) return
    const cx = group.reduce((s, b) => s + b.x, 0) / group.length
    const cy = group.reduce((s, b) => s + b.y, 0) / group.length
    const rad = (deg * Math.PI) / 180
    const next = base.map((b) => {
      if (!selectedSet.has(b.n)) return b
      const dx = b.x - cx
      const dy = b.y - cy
      return {
        ...b,
        x: Math.round((cx + dx * Math.cos(rad) - dy * Math.sin(rad)) * 10) / 10,
        y: Math.round((cy + dx * Math.sin(rad) + dy * Math.cos(rad)) * 10) / 10,
        r: (((b.r + deg) % 360) + 360) % 360,
      }
    })
    commit(next)
  }

  const save = async () => {
    setBusy(true)
    try {
      await api.saveLayout(history[index])
      setSaved(history[index])
      onSaved(history[index])
      setMessage({ kind: 'ok', text: 'Disposition enregistrée.' })
    } catch (e) {
      setMessage({ kind: 'error', text: errorMessage(e) })
    }
    setBusy(false)
  }

  const hasSelection = selected.length > 0

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h2 className="font-display text-3xl leading-tight text-petrol-900">Disposition des transats</h2>
          <p className="mt-1 max-w-[60ch] text-lg text-petrol-950/80">
            Faites glisser les transats pour reproduire la plage. La disposition vaut pour tous les jours ;
            les clients ne la voient jamais.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-base text-petrol-950/80" role="status">
            {message ? (
              <span className={message.kind === 'ok' ? 'font-semibold text-ok' : 'font-semibold text-danger'}>{message.text}</span>
            ) : dirty ? (
              'Modifications non enregistrées'
            ) : (
              ''
            )}
          </span>
          <Button variant="primary" id="plan-enregistrer" disabled={!dirty || busy} onClick={save}>
            Enregistrer
          </Button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 rounded-3xl bg-white p-3 ring-1 ring-petrol-900/15">
        <div role="group" aria-label="Mode de déplacement" className="flex rounded-full bg-petrol-900/10 p-1">
          {[
            { value: true, label: 'Par paire' },
            { value: false, label: "À l'unité" },
          ].map((opt) => (
            <button
              key={opt.label}
              type="button"
              aria-pressed={byPair === opt.value}
              onClick={() => {
                setByPair(opt.value)
                setSelected([])
              }}
              className={`min-h-10 rounded-full px-4 text-base font-semibold transition-colors ${
                byPair === opt.value ? 'bg-petrol-900 text-cream' : 'text-petrol-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <Button variant="outline" disabled={!hasSelection} onClick={() => rotate(-15)} aria-label="Pivoter vers la gauche">
          ↺ 15°
        </Button>
        <Button variant="outline" disabled={!hasSelection} onClick={() => rotate(15)} aria-label="Pivoter vers la droite">
          ↻ 15°
        </Button>
        <span className="mx-1 hidden h-8 w-px bg-petrol-900/15 sm:block" aria-hidden="true" />
        <Button variant="ghost" id="plan-annuler" disabled={index === 0} onClick={() => setIndex(index - 1)}>
          Annuler
        </Button>
        <Button variant="ghost" id="plan-retablir" disabled={index >= history.length - 1} onClick={() => setIndex(index + 1)}>
          Rétablir
        </Button>
        <Button
          variant="ghost"
          className="ml-auto"
          onClick={() => {
            setSelected([])
            commit(defaultLayout())
          }}
        >
          Remettre en rangées
        </Button>
      </div>

      <p className="mt-3 text-base text-petrol-950/70" aria-live="polite">
        {hasSelection
          ? `Sélection : transat${selected.length > 1 ? 's' : ''} ${[...selected].sort((a, b) => a - b).join(' et ')}. Au clavier, les flèches déplacent la sélection.`
          : 'Touchez un transat pour le sélectionner.'}
      </p>

      <div className="mt-3">
        <PlanCanvas
          layout={current}
          selected={selectedSet}
          bedProps={bedProps}
          svgRef={svgRef}
          label="Plan modifiable des transats"
        />
      </div>
    </div>
  )
}
